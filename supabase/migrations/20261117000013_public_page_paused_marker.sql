-- get_public_page(): when a guide is paused by its owner's plan and the owner has no other
-- live guide to redirect to, return {"paused": true} instead of null.
--
-- Why: null is cached by the app as "this guide does not exist" for hours, but this case can
-- change within minutes (another guide of the owner goes live, or the owner upgrades). The
-- marker lets the app cache it for seconds only. Follow-up to 20261117000012, which was
-- already applied, so this is a new migration instead of an edit.
-- `create or replace` keeps the existing grants (anon/authenticated execute).

create or replace function public.get_public_page(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_b record;
  v_owner uuid;
  v_branding boolean;
  v_target text;
  v_current text;
begin
  select b.id, b.name, b.slug, b.indexable, b.service_plan,
         p.template_key, p.published_content
  into v_b
  from public.businesses b
  join public.pages p on p.business_id = b.id
  where b.slug = p_slug
    and b.status = 'active'
    and p.status = 'published'
    and p.published_content is not null;

  if found then
    v_owner := public.business_owner(v_b.id);

    if v_owner is not null and public.business_is_paused_by_plan(v_b.id) then
      select b2.slug into v_target
      from public.business_members m
      join public.businesses b2 on b2.id = m.business_id
      join public.pages p2 on p2.business_id = b2.id
      where m.user_id = v_owner
        and m.role = 'owner'
        and b2.status = 'active'
        and p2.status = 'published'
        and p2.published_content is not null
        and not public.business_is_paused_by_plan(b2.id)
      order by b2.created_at, b2.id
      limit 1;

      -- Paused and nothing live to redirect to. A marker (not null) lets the app cache
      -- this briefly: it can change when another of the owner's guides goes live.
      if v_target is null then
        return jsonb_build_object('paused', true);
      end if;
      return jsonb_build_object('redirect_to', v_target, 'temporary', true);
    end if;

    if v_owner is not null then
      v_branding := public.effective_plan(v_owner) = 'free';
    else
      v_branding := not coalesce(
        lower(v_b.service_plan) ~ '(admin|manager|plus|essential|esencial)',
        false
      );
    end if;

    return jsonb_build_object(
      'found', true,
      'business_id', v_b.id,
      'name', v_b.name,
      'slug', v_b.slug,
      'template_key', v_b.template_key,
      'content', v_b.published_content,
      'indexable', v_b.indexable,
      'branding', v_branding
    );
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
