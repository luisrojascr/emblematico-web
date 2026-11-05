-- Public-read bucket with random, business-scoped paths.
--   {business_id}/{uuid}.{ext}   -> business members + admins can write
--   products/{uuid}.{ext}        -> admins only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-media',
  'business-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create function public.storage_can_write(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_folder text := (string_to_array(p_name, '/'))[1];
begin
  if public.is_admin() then
    return true;
  end if;
  if v_folder is null
     or v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_member(v_folder::uuid)
     and public.business_is_active(v_folder::uuid);
end;
$$;

create policy business_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'business-media' and public.storage_can_write(name));

create policy business_media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'business-media' and public.storage_can_write(name))
  with check (bucket_id = 'business-media' and public.storage_can_write(name));

create policy business_media_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'business-media' and public.storage_can_write(name));
