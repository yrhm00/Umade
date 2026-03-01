-- Electronic signature metadata linked to authenticated account
-- Adds signature place fields and enforces account-derived signer identity.

alter table public.booking_contracts
  add column if not exists provider_signature_place text null,
  add column if not exists client_signature_place text null;

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
  v_profile_full_name text;
  v_profile_email text;
  v_profile_city text;
  v_profile_postal text;
  v_signer_name text;
  v_signer_place text;
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

  select
    nullif(trim(full_name), ''),
    nullif(trim(email), ''),
    nullif(trim(city), ''),
    nullif(trim(postal_code), '')
  into
    v_profile_full_name,
    v_profile_email,
    v_profile_city,
    v_profile_postal
  from public.profiles
  where id = auth.uid();

  v_signer_name := coalesce(
    v_profile_full_name,
    v_profile_email,
    nullif(trim(p_signature_name), ''),
    'Compte vérifié'
  );

  v_signer_place := nullif(trim(concat_ws(' ', v_profile_postal, v_profile_city)), '');

  if v_signer_place is null and v_role = 'provider' then
    select nullif(trim(concat_ws(' ', nullif(trim(p.postal_code), ''), nullif(trim(p.city), ''))), '')
    into v_signer_place
    from public.bookings b
    join public.providers p on p.id = b.provider_id
    where b.id = p_booking_id;
  end if;

  if v_signer_place is null then
    v_signer_place := 'Non renseigné';
  end if;

  if v_role = 'provider' then
    update public.booking_contracts
    set
      provider_signature_name = coalesce(provider_signature_name, v_signer_name),
      provider_signature_place = coalesce(provider_signature_place, v_signer_place),
      provider_signed_at = coalesce(provider_signed_at, now()),
      updated_at = now()
    where booking_id = p_booking_id;
  else
    update public.booking_contracts
    set
      client_signature_name = coalesce(client_signature_name, v_signer_name),
      client_signature_place = coalesce(client_signature_place, v_signer_place),
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
