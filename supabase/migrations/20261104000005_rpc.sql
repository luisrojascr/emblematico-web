-- RPCs. All SECURITY DEFINER with empty search_path.

-- ---------------------------------------------------------------------------
-- get_public_page(slug): the ONLY way public pages are read (anon allowed).
-- Returns:
--   { "found": true, business_id, name, slug, template_key, content, indexable }
--   { "redirect_to": "<current slug>" }   (old slug of an active business)
--   null                                  (not public)
-- ---------------------------------------------------------------------------
create function public.get_public_page(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_current text;
begin
  select jsonb_build_object(
    'found', true,
    'business_id', b.id,
    'name', b.name,
    'slug', b.slug,
    'template_key', p.template_key,
    'content', p.published_content,
    'indexable', b.indexable
  )
  into v_result
  from public.businesses b
  join public.pages p on p.business_id = b.id
  where b.slug = p_slug
    and b.status = 'active'
    and p.status = 'published'
    and p.published_content is not null;

  if v_result is not null then
    return v_result;
  end if;

  select b.slug
  into v_current
  from public.slug_history h
  join public.businesses b on b.id = h.business_id
  join public.pages p on p.business_id = b.id
  where h.slug = p_slug
    and b.status = 'active'
    and p.status = 'published';

  if v_current is not null then
    return jsonb_build_object('redirect_to', v_current);
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- publish_page(business_id): member (active business) or admin.
-- Copies draft -> published. The app validates the draft with Zod first.
-- ---------------------------------------------------------------------------
create function public.publish_page(p_business_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_published_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not (public.is_admin() or public.is_member(p_business_id)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if not public.business_is_active(p_business_id) then
    raise exception 'business is not active' using errcode = '42501';
  end if;

  update public.pages
  set published_content = draft_content,
      status = 'published',
      published_at = now(),
      updated_by = (select auth.uid())
  where business_id = p_business_id
    and draft_content <> '{}'::jsonb
  returning published_at into v_published_at;

  if v_published_at is null then
    raise exception 'nothing to publish' using errcode = 'P0002';
  end if;

  return v_published_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_business(): admin only. Business + page + QR record in one transaction.
-- ---------------------------------------------------------------------------
create function public.create_business(
  p_name text,
  p_slug text,
  p_category text,
  p_template public.template_key,
  p_content jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'only admins can create businesses' using errcode = '42501';
  end if;

  insert into public.businesses (name, slug, category)
  values (p_name, p_slug, p_category)
  returning id into v_id;

  insert into public.pages (business_id, template_key, draft_content)
  values (v_id, p_template, coalesce(p_content, '{}'::jsonb));

  insert into public.qr_codes (business_id, destination_path)
  values (v_id, '/negocio/' || p_slug);

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_quote_request(): anon allowed. Validates + rate limits.
-- ip_hash is supplied by the server action (hashed with a secret salt).
-- ---------------------------------------------------------------------------
create function public.submit_quote_request(
  p_name text,
  p_phone text,
  p_email text,
  p_business_type text,
  p_product_id uuid,
  p_message text,
  p_ip_hash text
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

  if p_ip_hash is not null and (
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

-- ---------------------------------------------------------------------------
-- Execution grants (functions default to PUBLIC execute; lock them down)
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_member(uuid) to anon, authenticated;
grant execute on function public.business_is_active(uuid) to anon, authenticated;
grant execute on function public.storage_can_write(text) to authenticated;
grant execute on function public.get_public_page(text) to anon, authenticated;
grant execute on function public.publish_page(uuid) to authenticated;
grant execute on function public.create_business(text, text, text, public.template_key, jsonb) to authenticated;
grant execute on function public.submit_quote_request(text, text, text, text, uuid, text, text) to anon, authenticated;

-- service_role bypasses RLS but still needs plain privileges (server-only key).
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;
