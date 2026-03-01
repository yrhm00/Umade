-- Allow multiple reserved release rows per payout request.
-- Keep uniqueness only for the final synthetic payout ledger entry.

drop index if exists public.provider_wallet_ledger_payout_entry_uidx;

create unique index if not exists provider_wallet_ledger_payout_entry_uidx
  on public.provider_wallet_ledger(payout_request_id, entry_type)
  where payout_request_id is not null
    and entry_type = 'payout';

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
    on conflict (payout_request_id, entry_type)
    where (payout_request_id is not null and entry_type = 'payout')
    do nothing;

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
