-- High-priority features suite:
-- 1) Booking finance (quote/deposit/balance + auto-confirm on payment)
-- 2) Contract + signatures
-- 3) Reminder workflow
-- 4) Calendar sync helpers + auto blocked dates for confirmed bookings
-- 5) RSVP by family via public token links
-- 6) Cancellation / reschedule workflow

-- --------------------------------------------------
-- Booking schema extensions
-- --------------------------------------------------

alter table public.bookings
  add column if not exists quote_amount numeric not null default 0,
  add column if not exists deposit_amount numeric not null default 0,
  add column if not exists deposit_due_date date null,
  add column if not exists deposit_paid_amount numeric not null default 0,
  add column if not exists deposit_paid_at timestamptz null,
  add column if not exists balance_amount numeric not null default 0,
  add column if not exists balance_due_date date null,
  add column if not exists balance_paid_amount numeric not null default 0,
  add column if not exists balance_paid_at timestamptz null,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists auto_confirm_on_deposit boolean not null default true,
  add column if not exists contract_required boolean not null default true,
  add column if not exists cancellation_policy text null,
  add column if not exists can_reschedule boolean not null default true,
  add column if not exists max_reschedules integer not null default 2,
  add column if not exists reschedule_count integer not null default 0,
  add column if not exists last_reminder_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_payment_status_check'
  ) then
    alter table public.bookings
      add constraint bookings_payment_status_check
      check (payment_status in ('unpaid', 'deposit_pending', 'deposit_paid', 'paid', 'refunded', 'cancelled'));
  end if;
end $$;

update public.bookings
set
  quote_amount = case
    when coalesce(quote_amount, 0) <= 0 then coalesce(total_price, 0)
    else quote_amount
  end,
  deposit_amount = case
    when coalesce(deposit_amount, 0) <= 0 then round((coalesce(total_price, 0) * 0.30)::numeric, 2)
    else deposit_amount
  end,
  payment_status = case
    when status = 'cancelled' then 'cancelled'
    when status = 'completed' then 'paid'
    when status = 'confirmed' then 'deposit_paid'
    else 'deposit_pending'
  end
where true;

update public.bookings
set
  balance_amount = greatest(coalesce(quote_amount, 0) - coalesce(deposit_amount, 0), 0),
  balance_due_date = coalesce(balance_due_date, booking_date);

-- --------------------------------------------------
-- New tables
-- --------------------------------------------------

create table if not exists public.booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_type text not null,
  amount numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'pending',
  due_date date null,
  paid_at timestamptz null,
  transaction_ref text null,
  note text null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_payments_booking_id_idx
  on public.booking_payments(booking_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_payments_payment_type_check'
  ) then
    alter table public.booking_payments
      add constraint booking_payments_payment_type_check
      check (payment_type in ('deposit', 'balance', 'full', 'refund'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_payments_status_check'
  ) then
    alter table public.booking_payments
      add constraint booking_payments_status_check
      check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded'));
  end if;
end $$;

create table if not exists public.booking_contracts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  title text not null default 'Contrat de prestation',
  body text not null default '',
  version integer not null default 1,
  provider_signature_name text null,
  provider_signed_at timestamptz null,
  client_signature_name text null,
  client_signed_at timestamptz null,
  attachment_url text null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_reminders (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  reminder_type text not null,
  target_role text not null default 'both',
  channel text not null default 'in_app',
  scheduled_for timestamptz not null,
  sent_at timestamptz null,
  status text not null default 'scheduled',
  message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_reminders_booking_id_idx
  on public.booking_reminders(booking_id);

create index if not exists booking_reminders_scheduled_for_idx
  on public.booking_reminders(scheduled_for);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_reminders_type_check'
  ) then
    alter table public.booking_reminders
      add constraint booking_reminders_type_check
      check (reminder_type in ('rsvp', 'deposit', 'balance', 'contract', 'event_day', 'custom'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'booking_reminders_target_role_check'
  ) then
    alter table public.booking_reminders
      add constraint booking_reminders_target_role_check
      check (target_role in ('client', 'provider', 'both'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'booking_reminders_channel_check'
  ) then
    alter table public.booking_reminders
      add constraint booking_reminders_channel_check
      check (channel in ('in_app', 'email', 'sms'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'booking_reminders_status_check'
  ) then
    alter table public.booking_reminders
      add constraint booking_reminders_status_check
      check (status in ('scheduled', 'sent', 'failed', 'cancelled'));
  end if;
end $$;

create table if not exists public.booking_reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  requested_role text not null,
  "current_date" date not null,
  "current_start_time" text null,
  proposed_date date not null,
  proposed_start_time text null,
  reason text null,
  status text not null default 'pending',
  review_note text null,
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_reschedule_requests_booking_id_idx
  on public.booking_reschedule_requests(booking_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_reschedule_requests_role_check'
  ) then
    alter table public.booking_reschedule_requests
      add constraint booking_reschedule_requests_role_check
      check (requested_role in ('client', 'provider'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'booking_reschedule_requests_status_check'
  ) then
    alter table public.booking_reschedule_requests
      add constraint booking_reschedule_requests_status_check
      check (status in ('pending', 'accepted', 'declined', 'cancelled'));
  end if;
end $$;

create table if not exists public.provider_calendar_sync_settings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.providers(id) on delete cascade,
  sync_mode text not null default 'manual',
  auto_block_confirmed boolean not null default true,
  include_pending boolean not null default false,
  ics_secret text not null unique default encode(gen_random_bytes(24), 'hex'),
  last_exported_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provider_calendar_sync_settings_mode_check'
  ) then
    alter table public.provider_calendar_sync_settings
      add constraint provider_calendar_sync_settings_mode_check
      check (sync_mode in ('manual', 'google_export', 'apple_export'));
  end if;
end $$;

-- RSVP by family (public token invite)
alter table public.guest_groups
  add column if not exists confirmed_adults integer not null default 0,
  add column if not exists confirmed_children integer not null default 0,
  add column if not exists response_note text null,
  add column if not exists contact_name text null;

create table if not exists public.guest_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references public.guest_groups(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  is_active boolean not null default true,
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_by uuid null references public.profiles(id) on delete set null,
  last_response_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_group_invites_event_id_idx
  on public.guest_group_invites(event_id);

-- --------------------------------------------------
-- Access helper functions
-- --------------------------------------------------

create or replace function public.booking_provider_user_id(p_booking_id uuid)
returns uuid
language sql
stable
as $$
  select p.user_id
  from public.bookings b
  join public.providers p on p.id = b.provider_id
  where b.id = p_booking_id
  limit 1;
$$;

create or replace function public.is_booking_participant(p_booking_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.bookings b
    join public.providers p on p.id = b.provider_id
    where b.id = p_booking_id
      and (
        b.client_id = auth.uid()
        or p.user_id = auth.uid()
      )
  );
$$;

create or replace function public.current_booking_role(p_booking_id uuid)
returns text
language sql
stable
as $$
  select case
    when b.client_id = auth.uid() then 'client'
    when p.user_id = auth.uid() then 'provider'
    else null
  end
  from public.bookings b
  join public.providers p on p.id = b.provider_id
  where b.id = p_booking_id
  limit 1;
$$;

-- --------------------------------------------------
-- Finance + contract core functions
-- --------------------------------------------------

create or replace function public.refresh_booking_finance(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_contract public.booking_contracts%rowtype;
  v_quote numeric;
  v_deposit numeric;
  v_balance numeric;
  v_deposit_paid numeric;
  v_balance_paid numeric;
  v_total_paid numeric;
  v_payment_status text;
begin
  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  select *
  into v_contract
  from public.booking_contracts
  where booking_id = p_booking_id;

  v_quote := case
    when coalesce(v_booking.quote_amount, 0) > 0 then v_booking.quote_amount
    else coalesce(v_booking.total_price, 0)
  end;

  v_deposit := case
    when coalesce(v_booking.deposit_amount, 0) > 0 then v_booking.deposit_amount
    else round((v_quote * 0.30)::numeric, 2)
  end;

  if v_deposit > v_quote then
    v_deposit := v_quote;
  end if;

  v_balance := greatest(v_quote - v_deposit, 0);

  select coalesce(sum(amount), 0)
  into v_deposit_paid
  from public.booking_payments
  where booking_id = p_booking_id
    and status = 'paid'
    and payment_type in ('deposit', 'full');

  select coalesce(sum(amount), 0)
  into v_balance_paid
  from public.booking_payments
  where booking_id = p_booking_id
    and status = 'paid'
    and payment_type = 'balance';

  v_total_paid := v_deposit_paid + v_balance_paid;

  if v_booking.status = 'cancelled' then
    v_payment_status := 'cancelled';
  elsif v_total_paid >= v_quote and v_quote > 0 then
    v_payment_status := 'paid';
  elsif v_deposit_paid > 0 then
    v_payment_status := 'deposit_paid';
  elsif v_deposit > 0 then
    v_payment_status := 'deposit_pending';
  else
    v_payment_status := 'unpaid';
  end if;

  update public.bookings
  set
    quote_amount = v_quote,
    deposit_amount = v_deposit,
    balance_amount = v_balance,
    deposit_paid_amount = least(v_deposit_paid, v_quote),
    balance_paid_amount = least(v_balance_paid, v_quote),
    deposit_paid_at = case
      when v_deposit_paid > 0 and deposit_paid_at is null then now()
      else deposit_paid_at
    end,
    balance_paid_at = case
      when v_total_paid >= v_quote and quote_amount > 0 and balance_paid_at is null then now()
      when v_balance_paid > 0 and balance_paid_at is null then now()
      else balance_paid_at
    end,
    payment_status = v_payment_status,
    status = case
      when status = 'pending'
        and auto_confirm_on_deposit = true
        and v_deposit_paid >= least(v_deposit, v_quote)
        and (
          contract_required = false
          or (
            v_contract.booking_id is not null
            and v_contract.client_signed_at is not null
            and v_contract.provider_signed_at is not null
          )
        )
      then 'confirmed'::public.booking_status
      else status
    end,
    confirmed_at = case
      when status = 'pending'
        and auto_confirm_on_deposit = true
        and v_deposit_paid >= least(v_deposit, v_quote)
        and (
          contract_required = false
          or (
            v_contract.booking_id is not null
            and v_contract.client_signed_at is not null
            and v_contract.provider_signed_at is not null
          )
        )
        and confirmed_at is null
      then now()
      else confirmed_at
    end,
    updated_at = now()
  where id = p_booking_id;
end;
$$;

create or replace function public.record_booking_payment(
  p_booking_id uuid,
  p_payment_type text,
  p_amount numeric,
  p_due_date date default null,
  p_mark_paid boolean default true,
  p_note text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  insert into public.booking_payments (
    booking_id,
    payment_type,
    amount,
    status,
    due_date,
    paid_at,
    note,
    created_by
  )
  values (
    p_booking_id,
    p_payment_type,
    greatest(coalesce(p_amount, 0), 0),
    case when p_mark_paid then 'paid' else 'pending' end,
    p_due_date,
    case when p_mark_paid then now() else null end,
    p_note,
    auth.uid()
  );

  perform public.refresh_booking_finance(p_booking_id);

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  return v_booking;
end;
$$;

create or replace function public.upsert_booking_contract(
  p_booking_id uuid,
  p_title text,
  p_body text
)
returns public.booking_contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_contract public.booking_contracts%rowtype;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  v_role := public.current_booking_role(p_booking_id);
  if v_role is distinct from 'provider' then
    raise exception 'only provider can edit contract';
  end if;

  insert into public.booking_contracts (
    booking_id,
    title,
    body,
    created_by
  )
  values (
    p_booking_id,
    coalesce(nullif(trim(p_title), ''), 'Contrat de prestation'),
    coalesce(p_body, ''),
    auth.uid()
  )
  on conflict (booking_id) do update
  set
    title = excluded.title,
    body = excluded.body,
    version = public.booking_contracts.version + 1,
    updated_at = now();

  select *
  into v_contract
  from public.booking_contracts
  where booking_id = p_booking_id;

  return v_contract;
end;
$$;

create or replace function public.sign_booking_contract(
  p_booking_id uuid,
  p_signature_name text
)
returns public.booking_contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_contract public.booking_contracts%rowtype;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  v_role := public.current_booking_role(p_booking_id);
  if v_role is null then
    raise exception 'unknown participant role';
  end if;

  insert into public.booking_contracts (booking_id, body, created_by)
  values (p_booking_id, '', auth.uid())
  on conflict (booking_id) do nothing;

  if v_role = 'provider' then
    update public.booking_contracts
    set
      provider_signature_name = coalesce(nullif(trim(p_signature_name), ''), provider_signature_name),
      provider_signed_at = coalesce(provider_signed_at, now()),
      updated_at = now()
    where booking_id = p_booking_id;
  else
    update public.booking_contracts
    set
      client_signature_name = coalesce(nullif(trim(p_signature_name), ''), client_signature_name),
      client_signed_at = coalesce(client_signed_at, now()),
      updated_at = now()
    where booking_id = p_booking_id;
  end if;

  perform public.refresh_booking_finance(p_booking_id);

  select *
  into v_contract
  from public.booking_contracts
  where booking_id = p_booking_id;

  return v_contract;
end;
$$;

-- --------------------------------------------------
-- Reminder workflow
-- --------------------------------------------------

create or replace function public.create_default_booking_reminders(p_booking_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_inserted integer := 0;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  delete from public.booking_reminders
  where booking_id = p_booking_id
    and status = 'scheduled'
    and sent_at is null;

  if v_booking.deposit_due_date is not null and v_booking.deposit_paid_at is null then
    insert into public.booking_reminders (
      booking_id,
      reminder_type,
      target_role,
      channel,
      scheduled_for,
      message
    )
    values (
      p_booking_id,
      'deposit',
      'client',
      'in_app',
      (v_booking.deposit_due_date::timestamptz - interval '2 days'),
      'Rappel acompte: merci de régler votre acompte pour confirmer la réservation.'
    );
    v_inserted := v_inserted + 1;
  end if;

  if v_booking.balance_due_date is not null and coalesce(v_booking.balance_paid_amount, 0) < coalesce(v_booking.balance_amount, 0) then
    insert into public.booking_reminders (
      booking_id,
      reminder_type,
      target_role,
      channel,
      scheduled_for,
      message
    )
    values (
      p_booking_id,
      'balance',
      'client',
      'in_app',
      (v_booking.balance_due_date::timestamptz - interval '2 days'),
      'Rappel solde: le solde de votre réservation arrive à échéance.'
    );
    v_inserted := v_inserted + 1;
  end if;

  if v_booking.contract_required = true then
    insert into public.booking_reminders (
      booking_id,
      reminder_type,
      target_role,
      channel,
      scheduled_for,
      message
    )
    values (
      p_booking_id,
      'contract',
      'both',
      'in_app',
      (v_booking.booking_date::timestamptz - interval '5 days'),
      'Rappel contrat: merci de signer le contrat avant la prestation.'
    );
    v_inserted := v_inserted + 1;
  end if;

  insert into public.booking_reminders (
    booking_id,
    reminder_type,
    target_role,
    channel,
    scheduled_for,
    message
  )
  values (
    p_booking_id,
    'event_day',
    'both',
    'in_app',
    (v_booking.booking_date::timestamptz - interval '1 day'),
    'Rappel événement: votre prestation est prévue demain.'
  );
  v_inserted := v_inserted + 1;

  return v_inserted;
end;
$$;

create or replace function public.send_booking_reminder_now(
  p_reminder_id uuid,
  p_custom_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reminder public.booking_reminders%rowtype;
  v_booking public.bookings%rowtype;
  v_provider_user_id uuid;
  v_message text;
begin
  select *
  into v_reminder
  from public.booking_reminders
  where id = p_reminder_id;

  if not found then
    raise exception 'reminder not found';
  end if;

  if not public.is_booking_participant(v_reminder.booking_id) then
    raise exception 'not authorized';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = v_reminder.booking_id;

  select p.user_id
  into v_provider_user_id
  from public.providers p
  where p.id = v_booking.provider_id;

  v_message := coalesce(nullif(trim(p_custom_message), ''), v_reminder.message);

  if v_reminder.target_role in ('client', 'both') then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      v_booking.client_id,
      'booking',
      'Rappel réservation',
      v_message,
      jsonb_build_object('booking_id', v_booking.id, 'reminder_type', v_reminder.reminder_type)
    );
  end if;

  if v_reminder.target_role in ('provider', 'both') and v_provider_user_id is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      v_provider_user_id,
      'booking',
      'Rappel réservation',
      v_message,
      jsonb_build_object('booking_id', v_booking.id, 'reminder_type', v_reminder.reminder_type)
    );
  end if;

  update public.booking_reminders
  set
    sent_at = now(),
    status = 'sent',
    updated_at = now()
  where id = p_reminder_id;

  update public.bookings
  set
    last_reminder_at = now(),
    updated_at = now()
  where id = v_booking.id;
end;
$$;

-- --------------------------------------------------
-- Reschedule workflow
-- --------------------------------------------------

create or replace function public.create_booking_reschedule_request(
  p_booking_id uuid,
  p_proposed_date date,
  p_proposed_start_time text default null,
  p_reason text default null
)
returns public.booking_reschedule_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_role text;
  v_request public.booking_reschedule_requests%rowtype;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  if v_booking.can_reschedule = false then
    raise exception 'reschedule disabled for this booking';
  end if;

  if coalesce(v_booking.reschedule_count, 0) >= coalesce(v_booking.max_reschedules, 0) then
    raise exception 'max reschedules reached';
  end if;

  -- one active pending request at a time
  if exists (
    select 1
    from public.booking_reschedule_requests r
    where r.booking_id = p_booking_id
      and r.status = 'pending'
  ) then
    raise exception 'a pending reschedule request already exists';
  end if;

  v_role := public.current_booking_role(p_booking_id);
  if v_role is null then
    raise exception 'unknown participant role';
  end if;

  insert into public.booking_reschedule_requests (
    booking_id,
    requested_by,
    requested_role,
    "current_date",
    "current_start_time",
    proposed_date,
    proposed_start_time,
    reason,
    status
  )
  values (
    p_booking_id,
    auth.uid(),
    v_role,
    v_booking.booking_date,
    v_booking.start_time,
    p_proposed_date,
    p_proposed_start_time,
    p_reason,
    'pending'
  )
  returning *
  into v_request;

  return v_request;
end;
$$;

create or replace function public.respond_booking_reschedule_request(
  p_request_id uuid,
  p_accept boolean,
  p_review_note text default null
)
returns public.booking_reschedule_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.booking_reschedule_requests%rowtype;
  v_booking public.bookings%rowtype;
  v_role text;
begin
  select *
  into v_request
  from public.booking_reschedule_requests
  where id = p_request_id;

  if not found then
    raise exception 'request not found';
  end if;

  if not public.is_booking_participant(v_request.booking_id) then
    raise exception 'not authorized';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'request already processed';
  end if;

  v_role := public.current_booking_role(v_request.booking_id);
  if v_role is null then
    raise exception 'unknown participant role';
  end if;

  if v_role = v_request.requested_role then
    raise exception 'request author cannot review own request';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = v_request.booking_id;

  if p_accept then
    update public.bookings
    set
      booking_date = v_request.proposed_date,
      start_time = coalesce(v_request.proposed_start_time, start_time),
      reschedule_count = coalesce(reschedule_count, 0) + 1,
      updated_at = now()
    where id = v_request.booking_id;

    perform public.create_default_booking_reminders(v_request.booking_id);
  end if;

  update public.booking_reschedule_requests
  set
    status = case when p_accept then 'accepted' else 'declined' end,
    review_note = p_review_note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_request_id
  returning *
  into v_request;

  return v_request;
end;
$$;

-- --------------------------------------------------
-- Calendar / blocked dates sync
-- --------------------------------------------------

create or replace function public.sync_provider_blocked_dates_from_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_periods jsonb;
  v_new_period jsonb;
begin
  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    return;
  end if;

  select coalesce(p.blocked_dates, '[]'::jsonb)
  into v_periods
  from public.providers p
  where p.id = v_booking.provider_id;

  -- remove previous autogenerated period for this booking
  v_periods := (
    select coalesce(jsonb_agg(elem), '[]'::jsonb)
    from jsonb_array_elements(v_periods) elem
    where coalesce(elem->>'reason', '') <> ('booking:' || p_booking_id::text)
  );

  if v_booking.status = 'confirmed' then
    v_new_period := jsonb_build_object(
      'start', v_booking.booking_date,
      'end', v_booking.booking_date,
      'reason', 'booking:' || p_booking_id::text
    );
    v_periods := v_periods || jsonb_build_array(v_new_period);
  end if;

  update public.providers
  set blocked_dates = v_periods
  where id = v_booking.provider_id;
end;
$$;

create or replace function public.trg_bookings_sync_blocked_dates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_provider_blocked_dates_from_booking(new.id);
  return new;
end;
$$;

drop trigger if exists bookings_sync_blocked_dates_trg on public.bookings;
create trigger bookings_sync_blocked_dates_trg
after insert or update of status, booking_date, provider_id
on public.bookings
for each row
execute function public.trg_bookings_sync_blocked_dates();

-- --------------------------------------------------
-- RSVP family token helpers (anon-safe via security definer)
-- --------------------------------------------------

create or replace function public.trg_guest_group_invite_fill_event_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id is null then
    select g.event_id
    into new.event_id
    from public.guest_groups g
    where g.id = new.group_id;
  end if;
  return new;
end;
$$;

drop trigger if exists guest_group_invite_fill_event_id_trg on public.guest_group_invites;
create trigger guest_group_invite_fill_event_id_trg
before insert on public.guest_group_invites
for each row
execute function public.trg_guest_group_invite_fill_event_id();

create or replace function public.create_guest_group_invite(
  p_group_id uuid,
  p_valid_days integer default 90
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.guest_groups%rowtype;
  v_token text;
begin
  select *
  into v_group
  from public.guest_groups
  where id = p_group_id;

  if not found then
    raise exception 'guest group not found';
  end if;

  if not public.can_edit_event(v_group.event_id) then
    raise exception 'not authorized';
  end if;

  update public.guest_group_invites
  set is_active = false, updated_at = now()
  where group_id = p_group_id;

  insert into public.guest_group_invites (
    group_id,
    event_id,
    is_active,
    expires_at,
    created_by
  )
  values (
    p_group_id,
    v_group.event_id,
    true,
    now() + make_interval(days => greatest(p_valid_days, 1)),
    auth.uid()
  )
  returning token into v_token;

  return v_token;
end;
$$;

create or replace function public.get_guest_group_rsvp_payload(p_token text)
returns table (
  group_id uuid,
  event_id uuid,
  event_title text,
  group_name text,
  member_count integer,
  status text,
  confirmed_adults integer,
  confirmed_children integer,
  response_note text,
  contact_name text
)
language sql
security definer
set search_path = public
as $$
  select
    g.id as group_id,
    g.event_id,
    e.title as event_title,
    g.name as group_name,
    g.member_count,
    g.status,
    g.confirmed_adults,
    g.confirmed_children,
    g.response_note,
    g.contact_name
  from public.guest_group_invites i
  join public.guest_groups g on g.id = i.group_id
  join public.events e on e.id = g.event_id
  where i.token = p_token
    and i.is_active = true
    and i.expires_at > now()
  limit 1;
$$;

create or replace function public.submit_guest_group_rsvp(
  p_token text,
  p_status text,
  p_adults integer default 0,
  p_children integer default 0,
  p_note text default null,
  p_contact_name text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.guest_group_invites%rowtype;
begin
  if p_status not in ('pending', 'confirmed', 'declined', 'maybe') then
    raise exception 'invalid rsvp status';
  end if;

  select *
  into v_invite
  from public.guest_group_invites
  where token = p_token
    and is_active = true
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'invite token invalid or expired';
  end if;

  update public.guest_groups
  set
    status = p_status,
    rsvp_date = now(),
    confirmed_adults = greatest(coalesce(p_adults, 0), 0),
    confirmed_children = greatest(coalesce(p_children, 0), 0),
    response_note = p_note,
    contact_name = p_contact_name,
    updated_at = now()
  where id = v_invite.group_id;

  update public.guest_group_invites
  set
    last_response_at = now(),
    updated_at = now()
  where id = v_invite.id;

  return true;
end;
$$;

-- --------------------------------------------------
-- RLS
-- --------------------------------------------------

alter table public.booking_payments enable row level security;
alter table public.booking_contracts enable row level security;
alter table public.booking_reminders enable row level security;
alter table public.booking_reschedule_requests enable row level security;
alter table public.provider_calendar_sync_settings enable row level security;
alter table public.guest_group_invites enable row level security;

grant select, insert, update, delete on table public.booking_payments to authenticated;
grant select, insert, update, delete on table public.booking_contracts to authenticated;
grant select, insert, update, delete on table public.booking_reminders to authenticated;
grant select, insert, update, delete on table public.booking_reschedule_requests to authenticated;
grant select, insert, update, delete on table public.provider_calendar_sync_settings to authenticated;
grant select, insert, update, delete on table public.guest_group_invites to authenticated;

drop policy if exists "Booking participants can view payments" on public.booking_payments;
create policy "Booking participants can view payments"
on public.booking_payments for select
to authenticated
using (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can manage payments" on public.booking_payments;
create policy "Booking participants can manage payments"
on public.booking_payments for all
to authenticated
using (public.is_booking_participant(booking_id))
with check (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can view contracts" on public.booking_contracts;
create policy "Booking participants can view contracts"
on public.booking_contracts for select
to authenticated
using (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can manage contracts" on public.booking_contracts;
create policy "Booking participants can manage contracts"
on public.booking_contracts for all
to authenticated
using (public.is_booking_participant(booking_id))
with check (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can view reminders" on public.booking_reminders;
create policy "Booking participants can view reminders"
on public.booking_reminders for select
to authenticated
using (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can manage reminders" on public.booking_reminders;
create policy "Booking participants can manage reminders"
on public.booking_reminders for all
to authenticated
using (public.is_booking_participant(booking_id))
with check (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can view reschedule requests" on public.booking_reschedule_requests;
create policy "Booking participants can view reschedule requests"
on public.booking_reschedule_requests for select
to authenticated
using (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can manage reschedule requests" on public.booking_reschedule_requests;
create policy "Booking participants can manage reschedule requests"
on public.booking_reschedule_requests for all
to authenticated
using (public.is_booking_participant(booking_id))
with check (public.is_booking_participant(booking_id));

drop policy if exists "Provider owner can view calendar sync settings" on public.provider_calendar_sync_settings;
create policy "Provider owner can view calendar sync settings"
on public.provider_calendar_sync_settings for select
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_calendar_sync_settings.provider_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Provider owner can manage calendar sync settings" on public.provider_calendar_sync_settings;
create policy "Provider owner can manage calendar sync settings"
on public.provider_calendar_sync_settings for all
to authenticated
using (
  exists (
    select 1
    from public.providers p
    where p.id = provider_calendar_sync_settings.provider_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.providers p
    where p.id = provider_calendar_sync_settings.provider_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Event members can view guest group invites" on public.guest_group_invites;
create policy "Event members can view guest group invites"
on public.guest_group_invites for select
to authenticated
using (public.can_view_event(event_id));

drop policy if exists "Event editors can manage guest group invites" on public.guest_group_invites;
create policy "Event editors can manage guest group invites"
on public.guest_group_invites for all
to authenticated
using (public.can_edit_event(event_id))
with check (public.can_edit_event(event_id));

-- --------------------------------------------------
-- RPC grants
-- --------------------------------------------------

revoke all on function public.refresh_booking_finance(uuid) from public;
revoke all on function public.record_booking_payment(uuid, text, numeric, date, boolean, text) from public;
revoke all on function public.upsert_booking_contract(uuid, text, text) from public;
revoke all on function public.sign_booking_contract(uuid, text) from public;
revoke all on function public.create_default_booking_reminders(uuid) from public;
revoke all on function public.send_booking_reminder_now(uuid, text) from public;
revoke all on function public.create_booking_reschedule_request(uuid, date, text, text) from public;
revoke all on function public.respond_booking_reschedule_request(uuid, boolean, text) from public;
revoke all on function public.sync_provider_blocked_dates_from_booking(uuid) from public;
revoke all on function public.create_guest_group_invite(uuid, integer) from public;
revoke all on function public.get_guest_group_rsvp_payload(text) from public;
revoke all on function public.submit_guest_group_rsvp(text, text, integer, integer, text, text) from public;

grant execute on function public.refresh_booking_finance(uuid) to authenticated;
grant execute on function public.record_booking_payment(uuid, text, numeric, date, boolean, text) to authenticated;
grant execute on function public.upsert_booking_contract(uuid, text, text) to authenticated;
grant execute on function public.sign_booking_contract(uuid, text) to authenticated;
grant execute on function public.create_default_booking_reminders(uuid) to authenticated;
grant execute on function public.send_booking_reminder_now(uuid, text) to authenticated;
grant execute on function public.create_booking_reschedule_request(uuid, date, text, text) to authenticated;
grant execute on function public.respond_booking_reschedule_request(uuid, boolean, text) to authenticated;
grant execute on function public.sync_provider_blocked_dates_from_booking(uuid) to authenticated;
grant execute on function public.create_guest_group_invite(uuid, integer) to authenticated;
grant execute on function public.get_guest_group_rsvp_payload(text) to anon, authenticated;
grant execute on function public.submit_guest_group_rsvp(text, text, integer, integer, text, text) to anon, authenticated;
