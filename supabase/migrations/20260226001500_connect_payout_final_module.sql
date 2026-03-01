-- Final Connect payout module
-- - Provider Connect account tracking
-- - Held funds ledger (hold -> release -> payout)
-- - Completion confirmation by both parties
-- - Provider payout requests

alter table public.booking_checkout_sessions
  add column if not exists base_amount numeric not null default 0,
  add column if not exists client_fee_amount numeric not null default 0,
  add column if not exists provider_fee_amount numeric not null default 0,
  add column if not exists provider_net_amount numeric not null default 0;

create table if not exists public.provider_stripe_accounts (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  stripe_account_id text not null unique,
  country text not null default 'BE',
  default_currency text not null default 'eur',
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  payout_schedule_mode text not null default 'manual',
  onboarding_completed_at timestamptz null,
  requirements_currently_due jsonb not null default '[]'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provider_stripe_accounts_payout_schedule_mode_check'
  ) then
    alter table public.provider_stripe_accounts
      add constraint provider_stripe_accounts_payout_schedule_mode_check
      check (payout_schedule_mode in ('manual', 'automatic'));
  end if;
end $$;

create table if not exists public.booking_completion_confirmations (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  provider_confirmed_by uuid null references public.profiles(id) on delete set null,
  provider_confirmed_at timestamptz null,
  provider_note text null,
  client_confirmed_by uuid null references public.profiles(id) on delete set null,
  client_confirmed_at timestamptz null,
  client_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_payout_requests (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  status text not null default 'requested',
  amount numeric not null default 0,
  currency text not null default 'EUR',
  stripe_payout_id text null unique,
  requested_by uuid null references public.profiles(id) on delete set null,
  processed_at timestamptz null,
  paid_at timestamptz null,
  failed_at timestamptz null,
  failure_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_payout_requests_provider_id_idx
  on public.provider_payout_requests(provider_id);

create index if not exists provider_payout_requests_status_idx
  on public.provider_payout_requests(status);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provider_payout_requests_status_check'
  ) then
    alter table public.provider_payout_requests
      add constraint provider_payout_requests_status_check
      check (status in ('requested', 'processing', 'paid', 'failed', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'provider_payout_requests_amount_check'
  ) then
    alter table public.provider_payout_requests
      add constraint provider_payout_requests_amount_check
      check (amount > 0);
  end if;
end $$;

create table if not exists public.provider_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  booking_id uuid null references public.bookings(id) on delete set null,
  booking_payment_id uuid null references public.booking_payments(id) on delete set null,
  checkout_session_id text null,
  payout_request_id uuid null references public.provider_payout_requests(id) on delete set null,
  entry_type text not null,
  status text not null,
  direction text not null,
  amount numeric not null default 0,
  currency text not null default 'EUR',
  available_at timestamptz null,
  description text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_wallet_ledger_provider_id_idx
  on public.provider_wallet_ledger(provider_id);

create index if not exists provider_wallet_ledger_booking_id_idx
  on public.provider_wallet_ledger(booking_id);

create index if not exists provider_wallet_ledger_status_idx
  on public.provider_wallet_ledger(status);

create unique index if not exists provider_wallet_ledger_checkout_session_entry_uidx
  on public.provider_wallet_ledger(checkout_session_id, entry_type);

create unique index if not exists provider_wallet_ledger_payout_entry_uidx
  on public.provider_wallet_ledger(payout_request_id, entry_type);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provider_wallet_ledger_entry_type_check'
  ) then
    alter table public.provider_wallet_ledger
      add constraint provider_wallet_ledger_entry_type_check
      check (entry_type in ('hold', 'release', 'payout', 'adjustment', 'refund'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'provider_wallet_ledger_status_check'
  ) then
    alter table public.provider_wallet_ledger
      add constraint provider_wallet_ledger_status_check
      check (status in ('held', 'released', 'available', 'reserved', 'paid_out', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'provider_wallet_ledger_direction_check'
  ) then
    alter table public.provider_wallet_ledger
      add constraint provider_wallet_ledger_direction_check
      check (direction in ('credit', 'debit'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'provider_wallet_ledger_amount_check'
  ) then
    alter table public.provider_wallet_ledger
      add constraint provider_wallet_ledger_amount_check
      check (amount > 0);
  end if;
end $$;

create or replace function public.current_provider_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select p.id
  from public.providers p
  where p.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_provider_owner(p_provider_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.providers p
    where p.id = p_provider_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function public.record_provider_hold_from_checkout(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_transaction_ref text,
  p_base_amount numeric,
  p_provider_fee_amount numeric default 0,
  p_client_fee_amount numeric default 0,
  p_currency text default 'EUR'
)
returns public.provider_wallet_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_booking_payment_id uuid;
  v_net_amount numeric;
  v_entry public.provider_wallet_ledger%rowtype;
begin
  if p_booking_id is null then
    raise exception 'booking id required';
  end if;

  if coalesce(nullif(trim(p_checkout_session_id), ''), '') = '' then
    raise exception 'checkout session id required';
  end if;

  if coalesce(p_base_amount, 0) <= 0 then
    raise exception 'base amount must be > 0';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  v_net_amount := round(greatest(coalesce(p_base_amount, 0) - coalesce(p_provider_fee_amount, 0), 0)::numeric, 2);
  if v_net_amount <= 0 then
    raise exception 'provider net amount must be > 0';
  end if;

  select bp.id
  into v_booking_payment_id
  from public.booking_payments bp
  where bp.booking_id = p_booking_id
    and bp.transaction_ref = p_transaction_ref
  order by bp.created_at desc
  limit 1;

  insert into public.provider_wallet_ledger (
    provider_id,
    booking_id,
    booking_payment_id,
    checkout_session_id,
    entry_type,
    status,
    direction,
    amount,
    currency,
    available_at,
    description,
    metadata,
    created_at,
    updated_at
  )
  values (
    v_booking.provider_id,
    p_booking_id,
    v_booking_payment_id,
    p_checkout_session_id,
    'hold',
    'held',
    'credit',
    v_net_amount,
    upper(coalesce(nullif(trim(p_currency), ''), 'EUR')),
    null,
    'Fonds reçus et bloqués en attente de validation de prestation',
    jsonb_build_object(
      'transaction_ref', p_transaction_ref,
      'base_amount', round(coalesce(p_base_amount, 0)::numeric, 2),
      'provider_fee_amount', round(coalesce(p_provider_fee_amount, 0)::numeric, 2),
      'client_fee_amount', round(coalesce(p_client_fee_amount, 0)::numeric, 2),
      'provider_net_amount', v_net_amount
    ),
    now(),
    now()
  )
  on conflict (checkout_session_id, entry_type) do nothing
  returning *
  into v_entry;

  if not found then
    select *
    into v_entry
    from public.provider_wallet_ledger
    where checkout_session_id = p_checkout_session_id
      and entry_type = 'hold'
    limit 1;
  end if;

  return v_entry;
end;
$$;

create or replace function public.release_booking_funds_for_payout(
  p_booking_id uuid,
  p_force boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_contract public.booking_contracts%rowtype;
  v_confirmation public.booking_completion_confirmations%rowtype;
  v_hold public.provider_wallet_ledger%rowtype;
  v_count integer := 0;
begin
  if p_booking_id is null then
    raise exception 'booking id required';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  if auth.uid() is null then
    if not p_force then
      raise exception 'not authorized';
    end if;
  elsif not p_force and not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  if v_booking.contract_required = true then
    select *
    into v_contract
    from public.booking_contracts
    where booking_id = p_booking_id;

    if not found
      or v_contract.provider_signed_at is null
      or v_contract.client_signed_at is null then
      raise exception 'contract must be signed by both parties before release';
    end if;
  end if;

  select *
  into v_confirmation
  from public.booking_completion_confirmations
  where booking_id = p_booking_id;

  if not found
    or v_confirmation.provider_confirmed_at is null
    or v_confirmation.client_confirmed_at is null then
    raise exception 'booking completion must be confirmed by both parties';
  end if;

  for v_hold in
    select *
    from public.provider_wallet_ledger
    where booking_id = p_booking_id
      and entry_type = 'hold'
      and status = 'held'
    order by created_at asc
    for update
  loop
    insert into public.provider_wallet_ledger (
      provider_id,
      booking_id,
      booking_payment_id,
      checkout_session_id,
      payout_request_id,
      entry_type,
      status,
      direction,
      amount,
      currency,
      available_at,
      description,
      metadata,
      created_at,
      updated_at
    )
    values (
      v_hold.provider_id,
      v_hold.booking_id,
      v_hold.booking_payment_id,
      v_hold.checkout_session_id,
      null,
      'release',
      'available',
      'credit',
      v_hold.amount,
      v_hold.currency,
      now(),
      'Fonds débloqués après validation des deux parties',
      jsonb_build_object('source_hold_id', v_hold.id),
      now(),
      now()
    );

    update public.provider_wallet_ledger
    set
      status = 'released',
      available_at = now(),
      updated_at = now()
    where id = v_hold.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.confirm_booking_completion(
  p_booking_id uuid,
  p_note text default null
)
returns public.booking_completion_confirmations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_confirmation public.booking_completion_confirmations%rowtype;
begin
  if p_booking_id is null then
    raise exception 'booking id required';
  end if;

  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  v_role := public.current_booking_role(p_booking_id);
  if v_role is null then
    raise exception 'unknown role';
  end if;

  insert into public.booking_completion_confirmations (booking_id, created_at, updated_at)
  values (p_booking_id, now(), now())
  on conflict (booking_id) do nothing;

  if v_role = 'provider' then
    update public.booking_completion_confirmations
    set
      provider_confirmed_by = coalesce(provider_confirmed_by, auth.uid()),
      provider_confirmed_at = coalesce(provider_confirmed_at, now()),
      provider_note = coalesce(provider_note, nullif(trim(p_note), '')),
      updated_at = now()
    where booking_id = p_booking_id;
  elsif v_role = 'client' then
    update public.booking_completion_confirmations
    set
      client_confirmed_by = coalesce(client_confirmed_by, auth.uid()),
      client_confirmed_at = coalesce(client_confirmed_at, now()),
      client_note = coalesce(client_note, nullif(trim(p_note), '')),
      updated_at = now()
    where booking_id = p_booking_id;
  else
    raise exception 'unknown role';
  end if;

  select *
  into v_confirmation
  from public.booking_completion_confirmations
  where booking_id = p_booking_id;

  if v_confirmation.provider_confirmed_at is not null
    and v_confirmation.client_confirmed_at is not null then
    perform public.release_booking_funds_for_payout(p_booking_id, true);
  end if;

  return v_confirmation;
end;
$$;

create or replace function public.get_provider_wallet_summary(
  p_provider_id uuid default null
)
returns table (
  provider_id uuid,
  held_amount numeric,
  available_amount numeric,
  reserved_amount numeric,
  paid_out_amount numeric,
  total_released_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_id uuid;
begin
  v_provider_id := coalesce(p_provider_id, public.current_provider_id());

  if v_provider_id is null then
    raise exception 'provider not found for current user';
  end if;

  if auth.uid() is not null and not public.is_provider_owner(v_provider_id) then
    raise exception 'not authorized';
  end if;

  return query
  select
    v_provider_id as provider_id,
    coalesce(sum(case when wl.entry_type = 'hold' and wl.status = 'held' then wl.amount else 0 end), 0) as held_amount,
    coalesce(sum(case when wl.entry_type = 'release' and wl.status = 'available' and wl.payout_request_id is null then wl.amount else 0 end), 0) as available_amount,
    coalesce(sum(case when wl.entry_type = 'release' and wl.status = 'reserved' then wl.amount else 0 end), 0) as reserved_amount,
    coalesce(sum(case when wl.entry_type = 'payout' and wl.status = 'paid_out' then wl.amount else 0 end), 0) as paid_out_amount,
    coalesce(sum(case when wl.entry_type = 'release' then wl.amount else 0 end), 0) as total_released_amount
  from public.provider_wallet_ledger wl
  where wl.provider_id = v_provider_id;
end;
$$;

create or replace function public.create_provider_payout_request(
  p_amount numeric default null
)
returns public.provider_payout_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider_id uuid;
  v_available numeric := 0;
  v_target numeric := 0;
  v_remaining numeric := 0;
  v_request public.provider_payout_requests%rowtype;
  v_entry public.provider_wallet_ledger%rowtype;
  v_split_remainder numeric;
begin
  v_provider_id := public.current_provider_id();
  if v_provider_id is null then
    raise exception 'provider not found for current user';
  end if;

  select coalesce(sum(wl.amount), 0)
  into v_available
  from public.provider_wallet_ledger wl
  where wl.provider_id = v_provider_id
    and wl.entry_type = 'release'
    and wl.status = 'available'
    and wl.payout_request_id is null;

  if v_available <= 0 then
    raise exception 'no available funds for payout';
  end if;

  v_target := coalesce(round(p_amount::numeric, 2), round(v_available::numeric, 2));
  if v_target <= 0 then
    raise exception 'payout amount must be > 0';
  end if;

  if v_target > v_available then
    raise exception 'requested payout exceeds available balance';
  end if;

  insert into public.provider_payout_requests (
    provider_id,
    status,
    amount,
    currency,
    requested_by,
    metadata,
    created_at,
    updated_at
  )
  values (
    v_provider_id,
    'requested',
    v_target,
    'EUR',
    auth.uid(),
    '{}'::jsonb,
    now(),
    now()
  )
  returning *
  into v_request;

  v_remaining := v_target;

  for v_entry in
    select *
    from public.provider_wallet_ledger wl
    where wl.provider_id = v_provider_id
      and wl.entry_type = 'release'
      and wl.status = 'available'
      and wl.payout_request_id is null
    order by wl.created_at asc
    for update
  loop
    exit when v_remaining <= 0;

    if v_entry.amount <= v_remaining then
      update public.provider_wallet_ledger
      set
        status = 'reserved',
        payout_request_id = v_request.id,
        updated_at = now()
      where id = v_entry.id;

      v_remaining := round((v_remaining - v_entry.amount)::numeric, 2);
    else
      v_split_remainder := round((v_entry.amount - v_remaining)::numeric, 2);

      update public.provider_wallet_ledger
      set
        amount = v_remaining,
        status = 'reserved',
        payout_request_id = v_request.id,
        updated_at = now()
      where id = v_entry.id;

      insert into public.provider_wallet_ledger (
        provider_id,
        booking_id,
        booking_payment_id,
        checkout_session_id,
        payout_request_id,
        entry_type,
        status,
        direction,
        amount,
        currency,
        available_at,
        description,
        metadata,
        created_at,
        updated_at
      )
      values (
        v_entry.provider_id,
        v_entry.booking_id,
        v_entry.booking_payment_id,
        v_entry.checkout_session_id,
        null,
        'release',
        'available',
        'credit',
        v_split_remainder,
        v_entry.currency,
        v_entry.available_at,
        coalesce(v_entry.description, 'Reste disponible après réservation de payout'),
        coalesce(v_entry.metadata, '{}'::jsonb),
        now(),
        now()
      );

      v_remaining := 0;
    end if;
  end loop;

  if v_remaining > 0 then
    raise exception 'unable to reserve payout amount';
  end if;

  return v_request;
end;
$$;

create or replace function public.update_provider_payout_status(
  p_payout_request_id uuid,
  p_status text,
  p_stripe_payout_id text default null,
  p_failure_reason text default null
)
returns public.provider_payout_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.provider_payout_requests%rowtype;
begin
  if p_payout_request_id is null then
    raise exception 'payout request id required';
  end if;

  if p_status not in ('requested', 'processing', 'paid', 'failed', 'cancelled') then
    raise exception 'invalid payout status';
  end if;

  select *
  into v_request
  from public.provider_payout_requests
  where id = p_payout_request_id
  for update;

  if not found then
    raise exception 'payout request not found';
  end if;

  if p_status = 'processing' then
    update public.provider_payout_requests
    set
      status = 'processing',
      stripe_payout_id = coalesce(nullif(trim(p_stripe_payout_id), ''), stripe_payout_id),
      processed_at = coalesce(processed_at, now()),
      updated_at = now()
    where id = p_payout_request_id;

  elsif p_status = 'paid' then
    update public.provider_payout_requests
    set
      status = 'paid',
      stripe_payout_id = coalesce(nullif(trim(p_stripe_payout_id), ''), stripe_payout_id),
      processed_at = coalesce(processed_at, now()),
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
    where id = p_payout_request_id;

    update public.provider_wallet_ledger
    set
      status = 'paid_out',
      updated_at = now()
    where payout_request_id = p_payout_request_id
      and entry_type = 'release'
      and status in ('reserved', 'available');

    insert into public.provider_wallet_ledger (
      provider_id,
      booking_id,
      booking_payment_id,
      checkout_session_id,
      payout_request_id,
      entry_type,
      status,
      direction,
      amount,
      currency,
      available_at,
      description,
      metadata,
      created_at,
      updated_at
    )
    values (
      v_request.provider_id,
      null,
      null,
      null,
      p_payout_request_id,
      'payout',
      'paid_out',
      'debit',
      v_request.amount,
      v_request.currency,
      now(),
      'Virement prestataire exécuté',
      jsonb_build_object('stripe_payout_id', coalesce(nullif(trim(p_stripe_payout_id), ''), v_request.stripe_payout_id)),
      now(),
      now()
    )
    on conflict (payout_request_id, entry_type) do nothing;

  elsif p_status in ('failed', 'cancelled') then
    update public.provider_payout_requests
    set
      status = p_status,
      stripe_payout_id = coalesce(nullif(trim(p_stripe_payout_id), ''), stripe_payout_id),
      failed_at = coalesce(failed_at, now()),
      failure_reason = coalesce(nullif(trim(p_failure_reason), ''), failure_reason),
      updated_at = now()
    where id = p_payout_request_id;

    update public.provider_wallet_ledger
    set
      status = 'available',
      payout_request_id = null,
      updated_at = now()
    where payout_request_id = p_payout_request_id
      and entry_type = 'release'
      and status = 'reserved';
  else
    update public.provider_payout_requests
    set
      status = p_status,
      updated_at = now()
    where id = p_payout_request_id;
  end if;

  select *
  into v_request
  from public.provider_payout_requests
  where id = p_payout_request_id;

  return v_request;
end;
$$;

alter table public.provider_stripe_accounts enable row level security;
alter table public.booking_completion_confirmations enable row level security;
alter table public.provider_payout_requests enable row level security;
alter table public.provider_wallet_ledger enable row level security;

grant select, insert, update on table public.provider_stripe_accounts to authenticated;
grant select, insert, update on table public.booking_completion_confirmations to authenticated;
grant select, insert on table public.provider_payout_requests to authenticated;
grant select on table public.provider_wallet_ledger to authenticated;

drop policy if exists "Provider owners can view stripe accounts" on public.provider_stripe_accounts;
create policy "Provider owners can view stripe accounts"
on public.provider_stripe_accounts for select
to authenticated
using (public.is_provider_owner(provider_id));

drop policy if exists "Provider owners can manage stripe accounts" on public.provider_stripe_accounts;
create policy "Provider owners can manage stripe accounts"
on public.provider_stripe_accounts for all
to authenticated
using (public.is_provider_owner(provider_id))
with check (public.is_provider_owner(provider_id));

drop policy if exists "Booking participants can view completion confirmations" on public.booking_completion_confirmations;
create policy "Booking participants can view completion confirmations"
on public.booking_completion_confirmations for select
to authenticated
using (public.is_booking_participant(booking_id));

drop policy if exists "Booking participants can manage completion confirmations" on public.booking_completion_confirmations;
create policy "Booking participants can manage completion confirmations"
on public.booking_completion_confirmations for all
to authenticated
using (public.is_booking_participant(booking_id))
with check (public.is_booking_participant(booking_id));

drop policy if exists "Provider owners can view payout requests" on public.provider_payout_requests;
create policy "Provider owners can view payout requests"
on public.provider_payout_requests for select
to authenticated
using (public.is_provider_owner(provider_id));

drop policy if exists "Provider owners can create payout requests" on public.provider_payout_requests;
create policy "Provider owners can create payout requests"
on public.provider_payout_requests for insert
to authenticated
with check (public.is_provider_owner(provider_id));

drop policy if exists "Provider owners can view wallet ledger" on public.provider_wallet_ledger;
create policy "Provider owners can view wallet ledger"
on public.provider_wallet_ledger for select
to authenticated
using (public.is_provider_owner(provider_id));

revoke all on function public.current_provider_id() from public;
revoke all on function public.is_provider_owner(uuid) from public;
grant execute on function public.current_provider_id() to authenticated;
grant execute on function public.is_provider_owner(uuid) to authenticated;

revoke all on function public.record_provider_hold_from_checkout(uuid, text, text, numeric, numeric, numeric, text) from public;
revoke all on function public.record_provider_hold_from_checkout(uuid, text, text, numeric, numeric, numeric, text) from anon;
revoke all on function public.record_provider_hold_from_checkout(uuid, text, text, numeric, numeric, numeric, text) from authenticated;
grant execute on function public.record_provider_hold_from_checkout(uuid, text, text, numeric, numeric, numeric, text) to service_role;

revoke all on function public.release_booking_funds_for_payout(uuid, boolean) from public;
grant execute on function public.release_booking_funds_for_payout(uuid, boolean) to authenticated;
grant execute on function public.release_booking_funds_for_payout(uuid, boolean) to service_role;

revoke all on function public.confirm_booking_completion(uuid, text) from public;
grant execute on function public.confirm_booking_completion(uuid, text) to authenticated;

revoke all on function public.get_provider_wallet_summary(uuid) from public;
grant execute on function public.get_provider_wallet_summary(uuid) to authenticated;
grant execute on function public.get_provider_wallet_summary(uuid) to service_role;

revoke all on function public.create_provider_payout_request(numeric) from public;
grant execute on function public.create_provider_payout_request(numeric) to authenticated;

revoke all on function public.update_provider_payout_status(uuid, text, text, text) from public;
revoke all on function public.update_provider_payout_status(uuid, text, text, text) from anon;
revoke all on function public.update_provider_payout_status(uuid, text, text, text) from authenticated;
grant execute on function public.update_provider_payout_status(uuid, text, text, text) to service_role;
