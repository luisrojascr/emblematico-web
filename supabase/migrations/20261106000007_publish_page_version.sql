-- publish_page must copy the draft the caller validated. A second editor tab
-- can save between that read and the publish; the old function copied whatever
-- draft was current. Postgres cannot add an argument with CREATE OR REPLACE.

drop function if exists public.publish_page(uuid);

create function public.publish_page(
  p_business_id uuid,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft jsonb;
  v_previous jsonb;
  v_updated timestamptz;
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

  -- Lock the row so the version check and the copy see the same draft.
  select draft_content, published_content, updated_at
  into v_draft, v_previous, v_updated
  from public.pages
  where business_id = p_business_id
  for update;

  if not found or v_draft is null or v_draft = '{}'::jsonb then
    raise exception 'nothing to publish' using errcode = 'P0002';
  end if;

  if v_updated is distinct from p_expected_updated_at then
    raise exception 'draft changed' using errcode = '40001';
  end if;

  update public.pages
  set published_content = v_draft,
      status = 'published',
      published_at = now(),
      updated_by = (select auth.uid())
  where business_id = p_business_id
  returning published_at into v_published_at;

  return jsonb_build_object(
    'published_at', v_published_at,
    'previous_content', v_previous,
    'published_content', v_draft
  );
end;
$$;

revoke execute on function public.publish_page(uuid, timestamptz)
  from public, anon;

grant execute on function public.publish_page(uuid, timestamptz)
  to authenticated, service_role;
