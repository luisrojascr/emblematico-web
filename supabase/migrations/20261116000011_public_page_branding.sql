-- get_public_page: adds `branding` (bool) so paid plans publish their guide without
-- "Página creada con emblemático". Derived from the free-text businesses.service_plan,
-- same keywords as planFromText() in src/lib/panel/subscription.ts: a page keeps the
-- branding unless the plan mentions Essential, Plus or the managers plan.
-- The plan text itself is NOT exposed publicly, only the boolean.
-- `create or replace` keeps the existing grants (anon/authenticated execute).

create or replace function public.get_public_page(p_slug text)
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
    'indexable', b.indexable,
    'branding', not coalesce(
      lower(b.service_plan) ~ '(admin|manager|plus|essential|esencial)',
      false
    )
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
