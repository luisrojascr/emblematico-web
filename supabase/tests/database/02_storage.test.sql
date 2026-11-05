begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

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

select is((select public from storage.buckets where id = 'business-media'), true, 'bucket is public-read');
select is((select file_size_limit from storage.buckets where id = 'business-media'), 5242880::bigint, 'bucket limited to 5 MB');
select is((select allowed_mime_types from storage.buckets where id = 'business-media'), array['image/jpeg','image/png','image/webp'], 'bucket allows only jpeg/png/webp');

select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000c1', 'role', 'authenticated')::text, true);
set local role authenticated;

select lives_ok($$insert into storage.objects (bucket_id, name, owner) values ('business-media', '11111111-1111-1111-1111-111111111111/logo.png', '00000000-0000-0000-0000-0000000000c1')$$, 'member can upload to own business folder');
select throws_like($$insert into storage.objects (bucket_id, name, owner) values ('business-media', '22222222-2222-2222-2222-222222222222/logo.png', '00000000-0000-0000-0000-0000000000c1')$$, '%row-level security%', 'member cannot upload to another business folder');
select throws_like($$insert into storage.objects (bucket_id, name, owner) values ('business-media', 'products/x.png', '00000000-0000-0000-0000-0000000000c1')$$, '%row-level security%', 'client cannot upload to products folder');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);
set local role authenticated;
select lives_ok($$insert into storage.objects (bucket_id, name, owner) values ('business-media', 'products/x.png', '00000000-0000-0000-0000-0000000000a1')$$, 'admin can upload product images');
reset role;

select * from finish();
rollback;
