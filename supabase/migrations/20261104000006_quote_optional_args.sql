-- Forward migration: make submit_quote_request's optional arguments defaulted.
-- Postgres cannot change parameter defaults/order with CREATE OR REPLACE, so the
-- old signature is dropped and recreated. Execution stays service_role only.

drop function if exists public.submit_quote_request(
  text, text, text, text, uuid, text, text
);

create function public.submit_quote_request(
  p_name text,
  p_ip_hash text,
  p_phone text default null,
  p_email text default null,
  p_business_type text default null,
  p_product_id uuid default null,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_name is null or char_length(btrim(p_name)) = 0 then
    raise exception 'name required' using errcode = '22023';
  end if;
  if coalesce(btrim(p_phone), '') = '' and coalesce(btrim(p_email), '') = '' then
    raise exception 'phone or email required' using errcode = '22023';
  end if;

  -- Identity is mandatory: lowercase SHA-256 hex produced by the server action.
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid rate-limit identity' using errcode = '22023';
  end if;

  if (
    select count(*) from public.quote_requests
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.quote_requests
    where created_at > now() - interval '1 hour'
  ) >= 100 then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;

  insert into public.quote_requests
    (name, phone, email, business_type, product_id, message, ip_hash)
  values
    (btrim(p_name), nullif(btrim(p_phone), ''), nullif(btrim(p_email), ''),
     nullif(btrim(p_business_type), ''), p_product_id,
     nullif(btrim(p_message), ''), p_ip_hash)
  returning id into v_id;

  return v_id;
end;
$$;

-- New function defaults to PUBLIC execute: lock down, grant service_role only.
revoke execute on function public.submit_quote_request(
  text, text, text, text, text, uuid, text
) from public, anon, authenticated;

grant execute on function public.submit_quote_request(
  text, text, text, text, text, uuid, text
) to service_role;
