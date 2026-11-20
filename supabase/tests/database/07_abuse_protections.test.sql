begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Fixtures -------------------------------------------------------------------
-- g1: member of business 1 (a guide that already holds 19 images)
-- g9: admin
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, invited_at)
values
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g1@test.dev', '{}', '{}', now(), now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'g9@test.dev', '{}', '{}', now(), now(), now(), now());
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a8';

insert into public.businesses (id, name, slug) values
  ('71111111-1111-1111-1111-111111111111', 'Casa Uno', 'abuse-casa-uno'),
  ('72222222-2222-2222-2222-222222222222', 'Casa Dos', 'abuse-casa-dos');
insert into public.business_members (business_id, user_id)
values ('71111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a7');
insert into public.slug_history (business_id, slug)
values ('72222222-2222-2222-2222-222222222222', 'abuse-casa-vieja');

-- 19 images already in business 1, and some in business 2 that must not count.
insert into storage.objects (bucket_id, name)
select 'business-media', '71111111-1111-1111-1111-111111111111/' || i || '.png'
from generate_series(1, 19) i;
insert into storage.objects (bucket_id, name)
select 'business-media', '72222222-2222-2222-2222-222222222222/' || i || '.png'
from generate_series(1, 30) i;

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function pg_temp.report(p_slug text, p_ip text, p_reason text default 'scam')
returns table (report_id uuid, business_id uuid, business_name text, duplicate boolean)
language sql as $$
  select * from public.submit_guide_report(p_slug, p_reason, 'detalle', null, repeat(p_ip, 64))
$$;

-- Image quota ---------------------------------------------------------------------------
select is(public.business_media_limit(), 20, 'the limit is 20 images per business');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a7');
select lives_ok($$insert into storage.objects (bucket_id, name) values ('business-media', '71111111-1111-1111-1111-111111111111/20.png')$$, 'a member can upload up to the limit');
select throws_like($$insert into storage.objects (bucket_id, name) values ('business-media', '71111111-1111-1111-1111-111111111111/21.png')$$, '%row-level security%', 'a member cannot upload past the limit');
reset role;

-- Replacing an existing image is an update, not a new object: still allowed at the limit.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a7');
update storage.objects set metadata = '{"replaced": true}'
where bucket_id = 'business-media' and name = '71111111-1111-1111-1111-111111111111/1.png';
reset role;
select is((select metadata ->> 'replaced' from storage.objects where name = '71111111-1111-1111-1111-111111111111/1.png'), 'true', 'replacing an image at the limit still works');

-- Deleting one frees a slot.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a7');
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where bucket_id = 'business-media' and name = '71111111-1111-1111-1111-111111111111/2.png';
select lives_ok($$insert into storage.objects (bucket_id, name) values ('business-media', '71111111-1111-1111-1111-111111111111/22.png')$$, 'deleting an image frees a slot');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a8');
select lives_ok($$insert into storage.objects (bucket_id, name) values ('business-media', '72222222-2222-2222-2222-222222222222/99.png')$$, 'admins have no limit');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a7');
select throws_ok($$select public.business_media_limit()$$, '42501', null, 'clients cannot call the limit helper directly');
reset role;

-- Reports: privileges ---------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a7');
select throws_ok($$select * from public.submit_guide_report('abuse-casa-uno', 'scam', null, null, repeat('a', 64))$$, '42501', null, 'clients cannot submit reports directly');
select throws_ok($$insert into public.guide_reports (business_id, slug, reason, ip_hash) values ('71111111-1111-1111-1111-111111111111', 'x', 'scam', repeat('a', 64))$$, '42501', null, 'clients cannot insert reports');
reset role;

-- Reports: submit ---------------------------------------------------------------------------
select is((select business_name from pg_temp.report('abuse-casa-uno', 'a')), 'Casa Uno', 'a report resolves the guide by slug');
select is((select business_name from pg_temp.report('abuse-casa-vieja', 'a')), 'Casa Dos', 'a retired slug resolves to its guide');
select is((select count(*)::int from pg_temp.report('no-existe', 'a')), 0, 'an unknown slug returns nothing');
select is((select duplicate from pg_temp.report('abuse-casa-uno', 'a')), true, 'the same guide from the same IP within a day is a duplicate');
select is((select count(*)::int from public.guide_reports where ip_hash = repeat('a', 64)), 2, 'duplicates are not stored again');
select throws_ok($$select * from public.submit_guide_report('abuse-casa-uno', 'nope', null, null, repeat('b', 64))$$, '22023', null, 'an unknown reason is rejected');

-- Reports: rate limit (5 per hour per IP) -----------------------------------------------------
insert into public.guide_reports (business_id, slug, reason, ip_hash)
select '72222222-2222-2222-2222-222222222222', 'abuse-casa-dos', 'other', repeat('c', 64)
from generate_series(1, 5);
select throws_ok($$select * from pg_temp.report('abuse-casa-uno', 'c')$$, 'P0001', null, 'a sixth report from one IP within an hour is refused');

-- Reports: who can read them ---------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a7');
select is((select count(*)::int from public.guide_reports), 0, 'members cannot read reports, not even about their guide');
update public.guide_reports set status = 'reviewed';
reset role;
-- Only this test's rows: the local database can hold reports from the e2e run.
select is((select count(*)::int from public.guide_reports where status = 'reviewed' and ip_hash in (repeat('a', 64), repeat('c', 64))), 0, 'members cannot update reports');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a8');
select is((select count(*)::int from public.guide_reports where ip_hash in (repeat('a', 64), repeat('c', 64))), 7, 'admins read every report');
select lives_ok($$update public.guide_reports set status = 'reviewed', reviewed_at = now() where ip_hash = repeat('a', 64)$$, 'admins mark reports reviewed');
reset role;

select * from finish();
rollback;
