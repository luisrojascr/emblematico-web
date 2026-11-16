-- Permite que un cliente cree sus propios alojamientos desde el panel.
-- REVISAR ANTES DE APLICAR: no se ha ejecutado contra ninguna base de datos.
--
-- * profiles.max_properties: cuántos alojamientos puede crear la persona (plan).
--   Free = 1 (valor por defecto). Un admin lo sube a 3 (Essential) o 5 (Plus).
-- * create_my_business(): crea negocio + página de hospitalidad + QR + membresía
--   "owner" en una sola transacción, respetando ese límite. Los admins no tienen límite.

alter table public.profiles
  add column max_properties integer not null default 1
  check (max_properties between 0 and 50);

-- Solo un admin puede cambiar el límite (como role/email).
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.created_at is distinct from old.created_at
       or new.max_properties is distinct from old.max_properties then
      raise exception 'protected field: only admins can change this profile field'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create function public.create_my_business(
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
    select max_properties into v_limit from public.profiles where id = v_uid;
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

revoke all on function public.create_my_business(text, text, jsonb) from public, anon;
grant execute on function public.create_my_business(text, text, jsonb) to authenticated;
