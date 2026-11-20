-- Image quota also applies when an object moves into another guide's folder.
--
-- Migration 16 checks the quota on INSERT only. The Storage API moves an object by
-- updating its name, and the update policy only checked that the caller may write
-- both folders. A client with two guides could upload into one and move the files
-- into the other, past its limit. Now an update that changes the folder counts the
-- destination; an update inside the same folder (replacing an image) is not counted,
-- so it keeps working even in a full folder.

create function public.storage_can_update(p_name text, p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_folder text := (string_to_array(p_name, '/'))[1];
  v_old_folder text;
begin
  if not public.storage_can_write(p_name) then
    return false;
  end if;
  if public.is_admin() then
    return true;
  end if;
  -- In a WITH CHECK expression this still reads the row as it was before the update.
  select (string_to_array(o.name, '/'))[1] into v_old_folder
  from storage.objects o
  where o.id = p_id;
  if v_old_folder is not distinct from v_folder then
    return true;
  end if;
  return (
    select count(*)
    from storage.objects o
    where o.bucket_id = 'business-media'
      and o.name like v_folder || '/%'
      and o.id <> p_id
  ) < public.business_media_limit();
end;
$$;

drop policy business_media_update on storage.objects;
create policy business_media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'business-media' and public.storage_can_write(name))
  with check (bucket_id = 'business-media' and public.storage_can_update(name, id));

revoke execute on function public.storage_can_update(text, uuid) from public, anon;
grant execute on function public.storage_can_update(text, uuid) to authenticated, service_role;
