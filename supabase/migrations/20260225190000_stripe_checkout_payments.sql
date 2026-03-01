-- Real online payments for bookings via Stripe Checkout
-- Adds checkout session tracking + secure system RPC for webhook settlement.

create table if not exists public.booking_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_type text not null,
  amount numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'created',
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text null,
  checkout_url text null,
  expires_at timestamptz null,
  paid_at timestamptz null,
  processed_at timestamptz null,
  created_by uuid null references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_checkout_sessions_booking_id_idx
  on public.booking_checkout_sessions(booking_id);

create index if not exists booking_checkout_sessions_status_idx
  on public.booking_checkout_sessions(status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_checkout_sessions_payment_type_check'
  ) then
    alter table public.booking_checkout_sessions
      add constraint booking_checkout_sessions_payment_type_check
      check (payment_type in ('deposit', 'balance', 'full', 'refund'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_checkout_sessions_status_check'
  ) then
    alter table public.booking_checkout_sessions
      add constraint booking_checkout_sessions_status_check
      check (status in ('created', 'paid', 'expired', 'failed', 'cancelled'));
  end if;
end $$;

create unique index if not exists booking_payments_transaction_ref_uidx
  on public.booking_payments(transaction_ref)
  where transaction_ref is not null;

create or replace function public.record_booking_payment_from_checkout(
  p_booking_id uuid,
  p_payment_type text,
  p_amount numeric,
  p_transaction_ref text,
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
  if p_booking_id is null then
    raise exception 'booking id required';
  end if;

  if p_payment_type not in ('deposit', 'balance', 'full', 'refund') then
    raise exception 'invalid payment type';
  end if;

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'amount must be > 0';
  end if;

  if coalesce(nullif(trim(p_transaction_ref), ''), '') = '' then
    raise exception 'transaction reference required';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  insert into public.booking_payments (
    booking_id,
    payment_type,
    amount,
    currency,
    status,
    paid_at,
    transaction_ref,
    note,
    created_by,
    created_at,
    updated_at
  )
  values (
    p_booking_id,
    p_payment_type,
    round(p_amount::numeric, 2),
    'EUR',
    'paid',
    now(),
    p_transaction_ref,
    p_note,
    null,
    now(),
    now()
  )
  on conflict (transaction_ref)
  where transaction_ref is not null
  do nothing;

  perform public.refresh_booking_finance(p_booking_id);

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  return v_booking;
end;
$$;

alter table public.booking_checkout_sessions enable row level security;

grant select on table public.booking_checkout_sessions to authenticated;
grant select, insert, update on table public.booking_checkout_sessions to service_role;

drop policy if exists "Booking participants can view checkout sessions" on public.booking_checkout_sessions;
create policy "Booking participants can view checkout sessions"
on public.booking_checkout_sessions for select
using (public.is_booking_participant(booking_id));

revoke all on function public.record_booking_payment_from_checkout(uuid, text, numeric, text, text) from public;
revoke all on function public.record_booking_payment_from_checkout(uuid, text, numeric, text, text) from anon;
revoke all on function public.record_booking_payment_from_checkout(uuid, text, numeric, text, text) from authenticated;
grant execute on function public.record_booking_payment_from_checkout(uuid, text, numeric, text, text) to service_role;
