-- Contract-first booking workflow guardrails
-- 1) Payments require both signatures when contract_required=true
-- 2) Editing an existing contract invalidates previous signatures
-- 3) Signing requires an existing non-empty contract

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
  v_contract public.booking_contracts%rowtype;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'amount must be > 0';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  if p_mark_paid = true and v_booking.contract_required = true then
    select *
    into v_contract
    from public.booking_contracts
    where booking_id = p_booking_id;

    if not found
      or v_contract.provider_signed_at is null
      or v_contract.client_signed_at is null then
      raise exception 'contract must be signed by both parties before payment';
    end if;
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
    round(p_amount::numeric, 2),
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
  v_title text;
  v_body text;
  v_changed boolean := false;
begin
  if not public.is_booking_participant(p_booking_id) then
    raise exception 'not authorized';
  end if;

  v_role := public.current_booking_role(p_booking_id);
  if v_role is distinct from 'provider' then
    raise exception 'only provider can edit contract';
  end if;

  v_title := coalesce(nullif(trim(p_title), ''), 'Contrat de prestation');
  v_body := coalesce(p_body, '');

  select *
  into v_contract
  from public.booking_contracts
  where booking_id = p_booking_id;

  if not found then
    insert into public.booking_contracts (
      booking_id,
      title,
      body,
      created_by
    )
    values (
      p_booking_id,
      v_title,
      v_body,
      auth.uid()
    )
    returning *
    into v_contract;

    return v_contract;
  end if;

  v_changed := v_contract.title is distinct from v_title
    or v_contract.body is distinct from v_body;

  update public.booking_contracts
  set
    title = v_title,
    body = v_body,
    version = case
      when v_changed then public.booking_contracts.version + 1
      else public.booking_contracts.version
    end,
    provider_signature_name = case
      when v_changed then null
      else provider_signature_name
    end,
    provider_signed_at = case
      when v_changed then null
      else provider_signed_at
    end,
    client_signature_name = case
      when v_changed then null
      else client_signature_name
    end,
    client_signed_at = case
      when v_changed then null
      else client_signed_at
    end,
    updated_at = now()
  where booking_id = p_booking_id
  returning *
  into v_contract;

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

  select *
  into v_contract
  from public.booking_contracts
  where booking_id = p_booking_id;

  if not found then
    raise exception 'contract not found';
  end if;

  if length(trim(coalesce(v_contract.body, ''))) < 20 then
    raise exception 'contract not ready';
  end if;

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
