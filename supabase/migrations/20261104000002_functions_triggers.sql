-- Authorization helpers, guard triggers, profile bootstrap.

-- ---------------------------------------------------------------------------
-- Helpers used inside RLS policies. SECURITY DEFINER avoids recursive RLS.
-- ---------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.is_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members
    where business_id = p_business_id and user_id = (select auth.uid())
  );
$$;

create function public.business_is_active(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses
    where id = p_business_id and status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> profile. Role is ALWAYS client; admins are promoted manually.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- profiles: only admins may change role/id/email
-- Guards check current_user so SECURITY DEFINER functions and service_role
-- (current_user is not authenticated/anon there) are not blocked.
-- ---------------------------------------------------------------------------
create function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at then
      raise exception 'protected field: only admins can change this profile field'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_trg
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- businesses: slug lifecycle (history, no reuse, admin only)
-- ---------------------------------------------------------------------------
create function public.businesses_slug_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then
    return new;
  end if;

  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    raise exception 'protected field: only admins can set the slug'
      using errcode = '42501';
  end if;

  -- A retired slug can never be claimed by a different business.
  if exists (
    select 1 from public.slug_history h
    where h.slug = new.slug
      and h.business_id is distinct from new.id
  ) then
    raise exception 'slug % is retired and cannot be reused', new.slug
      using errcode = '23505';
  end if;

  if tg_op = 'UPDATE' then
    -- Same business moving back to one of its own old slugs.
    delete from public.slug_history
      where slug = new.slug and business_id = new.id;
    insert into public.slug_history (slug, business_id)
      values (old.slug, old.id)
      on conflict (slug) do nothing;
  end if;

  return new;
end;
$$;

create trigger businesses_slug_guard_trg
  before insert or update of slug on public.businesses
  for each row execute function public.businesses_slug_guard();

-- Non-slug protected business fields (status, plan, indexable...) are blocked
-- for non-admins by RLS (no update policy). This trigger is defense in depth.
create function public.businesses_admin_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    raise exception 'protected: only admins can modify businesses'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger businesses_admin_only_trg
  before update on public.businesses
  for each row execute function public.businesses_admin_only();

-- ---------------------------------------------------------------------------
-- pages: clients may only change draft_content.
-- Publishing goes through publish_page() (SECURITY DEFINER).
-- ---------------------------------------------------------------------------
create function public.pages_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.id is distinct from old.id
       or new.business_id is distinct from old.business_id
       or new.template_key is distinct from old.template_key
       or new.status is distinct from old.status
       or new.published_content is distinct from old.published_content
       or new.published_at is distinct from old.published_at then
      raise exception 'protected field: only draft_content can be edited'
        using errcode = '42501';
    end if;
  end if;
  new.updated_by = coalesce((select auth.uid()), old.updated_by);
  return new;
end;
$$;

create trigger pages_guard_trg
  before update on public.pages
  for each row execute function public.pages_guard();
