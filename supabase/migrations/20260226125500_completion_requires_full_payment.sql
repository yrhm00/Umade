-- Completion validation is allowed only after full payment.

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
  v_booking public.bookings%rowtype;
  v_confirmation public.booking_completion_confirmations%rowtype;
  v_total_due numeric := 0;
  v_total_paid numeric := 0;
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

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'booking is cancelled';
  end if;

  v_total_due := round(greatest(coalesce(v_booking.quote_amount, v_booking.total_price, 0), 0)::numeric, 2);
  v_total_paid := round(
    (
      coalesce(v_booking.deposit_paid_amount, 0)
      + coalesce(v_booking.balance_paid_amount, 0)
    )::numeric,
    2
  );

  if coalesce(v_booking.payment_status, '') <> 'paid'
    and v_total_due > 0
    and v_total_paid < v_total_due then
    raise exception 'booking must be fully paid before completion confirmation';
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

grant execute on function public.confirm_booking_completion(uuid, text) to authenticated;
grant execute on function public.confirm_booking_completion(uuid, text) to service_role;
