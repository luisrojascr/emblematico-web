-- Serialize create_my_business per user so parallel calls cannot exceed
-- profiles.max_properties (each call locks the caller's profile row before
-- counting owned properties).

create or replace function public.create_my_business(
  p_name text,
  p_slug text,
  p_content jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_limit integer;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.is_admin() then
    -- Lock the caller's profile row so concurrent calls from the same user
    -- run one at a time: the count below always sees the previous insert.
    select max_properties into v_limit
    from public.profiles
    where id = v_uid
    for update;
    select count(*) into v_count
    from public.business_members
    where user_id = v_uid and role = 'owner';
    if coalesce(v_limit, 0) <= v_count then
      raise exception 'property limit reached' using errcode = 'P0001';
    end if;
  end if;

  insert into public.businesses (name, slug, category)
  values (p_name, p_slug, 'hospedaje')
  returning id into v_id;

  insert into public.pages (business_id, template_key, draft_content)
  values (v_id, 'hospitality', coalesce(p_content, '{}'::jsonb));

  insert into public.qr_codes (business_id, destination_path)
  values (v_id, '/negocio/' || p_slug);

  insert into public.business_members (business_id, user_id, role)
  values (v_id, v_uid, 'owner');

  return v_id;
end;
$$;
