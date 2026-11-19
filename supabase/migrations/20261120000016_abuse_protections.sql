-- Protections for open signup (phase 6 of self-serve signup).
--
--   * Image quota: a client can upload at most business_media_limit() objects into a
--     business folder. Clients upload with their own session, so the check lives in
--     the storage insert policy, not only in the panel. Admins have no limit.
--   * Guide reports: anyone can report a public guide ("Reportar esta guía"). Reports
--     go through submit_guide_report() (service_role only, called by the site with a
--     hashed IP for rate limiting) and only admins can read or update them.

-- ---------------------------------------------------------------------------
-- Image quota per business
-- ---------------------------------------------------------------------------
-- Keep in sync with MEDIA_LIMIT_PER_BUSINESS in src/lib/panel/media-limit.ts.
create function public.business_media_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 20;
$$;

create function public.storage_can_insert(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_folder text := (string_to_array(p_name, '/'))[1];
begin
  if not public.storage_can_write(p_name) then
    return false;
  end if;
  if public.is_admin() then
    return true;
  end if;
  -- storage_can_write() already checked that the folder is a business id. Two
  -- uploads at the same instant can both pass; the limit is a guard, not a meter.
  return (
    select count(*)
    from storage.objects o
    where o.bucket_id = 'business-media'
      and o.name like v_folder || '/%'
  ) < public.business_media_limit();
end;
$$;

drop policy business_media_insert on storage.objects;
create policy business_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'business-media' and public.storage_can_insert(name));

revoke execute on function public.business_media_limit()
  from public, anon, authenticated;
revoke execute on function public.storage_can_insert(text) from public, anon;
grant execute on function public.business_media_limit() to service_role;
grant execute on function public.storage_can_insert(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Guide reports
-- ---------------------------------------------------------------------------
create table public.guide_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  -- The slug the visitor reported (it may have changed since).
  slug text not null check (char_length(slug) <= 80),
  reason text not null check (reason in ('scam', 'misleading', 'inappropriate', 'other')),
  details text check (char_length(details) <= 1000),
  contact_email text check (char_length(contact_email) <= 200),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'open' check (status in ('open', 'reviewed')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index guide_reports_created_idx on public.guide_reports (created_at desc);
create index guide_reports_business_idx on public.guide_reports (business_id);
create index guide_reports_ip_idx on public.guide_reports (ip_hash, created_at);

alter table public.guide_reports enable row level security;
revoke all on public.guide_reports from anon, authenticated;
grant select, update on public.guide_reports to authenticated;
grant all on public.guide_reports to service_role;

create policy guide_reports_admin_select on public.guide_reports
  for select to authenticated
  using (public.is_admin());

create policy guide_reports_admin_update on public.guide_reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Records a report and returns its business, or null when the slug is unknown.
-- Limits: 5 reports per hour per IP, 200 per hour in total, and a repeated report of
-- the same guide from the same IP within a day is accepted but not stored again.
create function public.submit_guide_report(
  p_slug text,
  p_reason text,
  p_details text,
  p_contact_email text,
  p_ip_hash text
)
returns table (report_id uuid, business_id uuid, business_name text, duplicate boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_business record;
  v_existing uuid;
  v_id uuid;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid rate-limit identity' using errcode = '22023';
  end if;
  if p_reason is null or p_reason not in ('scam', 'misleading', 'inappropriate', 'other') then
    raise exception 'invalid reason' using errcode = '22023';
  end if;
  if p_slug is null or char_length(p_slug) > 80 then
    raise exception 'invalid slug' using errcode = '22023';
  end if;

  select b.id, b.name into v_business
  from public.businesses b
  where b.slug = p_slug
  limit 1;
  if v_business.id is null then
    select b.id, b.name into v_business
    from public.slug_history h
    join public.businesses b on b.id = h.business_id
    where h.slug = p_slug
    limit 1;
  end if;
  if v_business.id is null then
    return;
  end if;

  select r.id into v_existing
  from public.guide_reports r
  where r.ip_hash = p_ip_hash
    and r.business_id = v_business.id
    and r.created_at > now() - interval '1 day'
  limit 1;
  if v_existing is not null then
    return query select v_existing, v_business.id, v_business.name::text, true;
    return;
  end if;

  if (
    select count(*) from public.guide_reports r
    where r.ip_hash = p_ip_hash and r.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;
  if (
    select count(*) from public.guide_reports r
    where r.created_at > now() - interval '1 hour'
  ) >= 200 then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;

  insert into public.guide_reports
    (business_id, slug, reason, details, contact_email, ip_hash)
  values (
    v_business.id,
    p_slug,
    p_reason,
    nullif(left(btrim(coalesce(p_details, '')), 1000), ''),
    nullif(left(btrim(coalesce(p_contact_email, '')), 200), ''),
    p_ip_hash
  )
  returning id into v_id;

  return query select v_id, v_business.id, v_business.name::text, false;
end;
$$;

revoke execute on function public.submit_guide_report(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_guide_report(text, text, text, text, text)
  to service_role;
