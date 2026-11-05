begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.dev', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clienta@test.dev', '{}', '{}', now(), now());
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

insert into public.businesses (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'A', 'rls-biz-a'),
  ('22222222-2222-2222-2222-222222222222', 'B', 'rls-biz-b');
insert into public.business_members (business_id, user_id)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000c1');

-- Helpers return the number of rows the CALLER could actually affect (RLS applies).
create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function pg_temp.replace_object(p_name text) returns int language plpgsql as $$
declare n int;
begin
  update storage.objects
     set metadata = '{"replaced": true}'::jsonb
   where bucket_id = 'business-media' and name = p_name;
  get diagnostics n = row_count;
  return n;
end $$;

create function pg_temp.delete_object(p_name text) returns int language plpgsql as $$
declare n int;
begin
  -- Storage blocks raw DELETEs unless the Storage API flags them; the API does this.
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects where bucket_id = 'business-media' and name = p_name;
  get diagnostics n = row_count;
  return n;
end $$;

-- Bucket settings -------------------------------------------------------------------
select is((select public from storage.buckets where id = 'business-media'), true, 'bucket is public-read');
select is((select file_size_limit from storage.buckets where id = 'business-media'), 5242880::bigint, 'bucket limited to 5 MB');
select is((select allowed_mime_types from storage.buckets where id = 'business-media'), array['image/jpeg','image/png','image/webp'], 'bucket allows only jpeg/png/webp');

-- Objects owned by someone else (inserted as the table owner) -------------------------
insert into storage.objects (bucket_id, name) values
  ('business-media', '22222222-2222-2222-2222-222222222222/logo.png'),
  ('business-media', 'products/x.png');

-- Member: INSERT -------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select lives_ok($$insert into storage.objects (bucket_id, name, owner) values ('business-media', '11111111-1111-1111-1111-111111111111/logo.png', '00000000-0000-0000-0000-0000000000c1')$$, 'member can upload to own business folder');
select throws_like($$insert into storage.objects (bucket_id, name, owner) values ('business-media', '22222222-2222-2222-2222-222222222222/new.png', '00000000-0000-0000-0000-0000000000c1')$$, '%row-level security%', 'member cannot upload to another business folder');
select throws_like($$insert into storage.objects (bucket_id, name, owner) values ('business-media', 'products/new.png', '00000000-0000-0000-0000-0000000000c1')$$, '%row-level security%', 'client cannot upload to products folder');

-- Member: SELECT (needed by Storage API for replace and delete) ------------------------
select is((select count(*)::int from storage.objects where bucket_id = 'business-media'), 1, 'member sees only own business objects');
select is((select name from storage.objects where bucket_id = 'business-media'), '11111111-1111-1111-1111-111111111111/logo.png', 'the visible object is the own logo');
select is((select count(*)::int from storage.objects where name like '22222222%'), 0, 'member cannot see another business objects');
select is((select count(*)::int from storage.objects where name like 'products/%'), 0, 'member cannot see products objects');

-- Member: UPDATE (replace) ------------------------------------------------------------------
select is(pg_temp.replace_object('11111111-1111-1111-1111-111111111111/logo.png'), 1, 'member can replace own object');
select is(pg_temp.replace_object('22222222-2222-2222-2222-222222222222/logo.png'), 0, 'member cannot replace another business object');
select is(pg_temp.replace_object('products/x.png'), 0, 'member cannot replace products object');

-- Member: DELETE ------------------------------------------------------------------------------
select is(pg_temp.delete_object('22222222-2222-2222-2222-222222222222/logo.png'), 0, 'member cannot delete another business object');
select is(pg_temp.delete_object('products/x.png'), 0, 'member cannot delete products object');
select is(pg_temp.delete_object('11111111-1111-1111-1111-111111111111/logo.png'), 1, 'member can delete own object');
reset role;

select is((select count(*)::int from storage.objects where bucket_id = 'business-media'), 2, 'only the foreign objects remain after member deletes');
select is((select count(*)::int from storage.objects where metadata ->> 'replaced' = 'true'), 0, 'foreign objects were not modified');

-- Anon gets no listing access -------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
set local role anon;
select is((select count(*)::int from storage.objects where bucket_id = 'business-media'), 0, 'anon cannot list objects');
reset role;

-- Admin: full management --------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$insert into storage.objects (bucket_id, name, owner) values ('business-media', 'products/y.png', '00000000-0000-0000-0000-0000000000a1')$$, 'admin can upload product images');
select is((select count(*)::int from storage.objects where bucket_id = 'business-media'), 3, 'admin sees every object');
select is(pg_temp.replace_object('products/x.png'), 1, 'admin can replace a product image');
select is(pg_temp.delete_object('products/x.png'), 1, 'admin can delete a product image');
reset role;

-- Regression guard: without the SELECT policy, replacing an existing object is impossible.
insert into storage.objects (bucket_id, name) values ('business-media', '11111111-1111-1111-1111-111111111111/keep.png');
drop policy business_media_select on storage.objects;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is(pg_temp.replace_object('11111111-1111-1111-1111-111111111111/keep.png'), 0, 'without the SELECT policy a member cannot replace an existing object');
reset role;

select * from finish();
rollback;
