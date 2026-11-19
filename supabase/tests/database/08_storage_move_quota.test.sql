begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

-- Fixtures -------------------------------------------------------------------
-- h1: member of two guides. Guide 1 is full (20 images), guide 2 has one image.
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, invited_at)
values
  ('00000000-0000-0000-0000-0000000000b7', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'h1@test.dev', '{}', '{}', now(), now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000b8', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'h9@test.dev', '{}', '{}', now(), now(), now(), now());
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000b8';
-- Room for two guides, whatever the default plan of an invited account is.
update public.subscriptions set plan = 'essential', status = 'active', current_period_end = now() + interval '1 year'
where user_id = '00000000-0000-0000-0000-0000000000b7';

insert into public.businesses (id, name, slug) values
  ('81111111-1111-1111-1111-111111111111', 'Llena', 'move-llena'),
  ('82222222-2222-2222-2222-222222222222', 'Vacia', 'move-vacia');
insert into public.business_members (business_id, user_id) values
  ('81111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000b7'),
  ('82222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000b7');

insert into storage.objects (bucket_id, name)
select 'business-media', '81111111-1111-1111-1111-111111111111/' || i || '.png'
from generate_series(1, 20) i;
insert into storage.objects (bucket_id, name)
values ('business-media', '82222222-2222-2222-2222-222222222222/a.png');

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

-- Moves -------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b7');
select throws_like(
  $$update storage.objects set name = '81111111-1111-1111-1111-111111111111/movida.png'
    where name = '82222222-2222-2222-2222-222222222222/a.png'$$,
  '%row-level security%', 'moving an image into a full guide is refused');
select lives_ok(
  $$update storage.objects set metadata = '{"replaced": true}'
    where name = '81111111-1111-1111-1111-111111111111/1.png'$$,
  'replacing an image inside a full guide still works');
select lives_ok(
  $$update storage.objects set name = '81111111-1111-1111-1111-111111111111/renombrada.png'
    where name = '81111111-1111-1111-1111-111111111111/2.png'$$,
  'renaming inside the same guide still works');
select lives_ok(
  $$update storage.objects set name = '82222222-2222-2222-2222-222222222222/desde-llena.png'
    where name = '81111111-1111-1111-1111-111111111111/3.png'$$,
  'moving into a guide with room works');
reset role;

select is(
  (select count(*)::int from storage.objects where name like '81111111-1111-1111-1111-111111111111/%'),
  19, 'the full guide lost only the image moved out');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b8');
select lives_ok(
  $$update storage.objects set name = '81111111-1111-1111-1111-111111111111/admin.png'
    where name = '82222222-2222-2222-2222-222222222222/a.png'$$,
  'admins can move images anywhere');
reset role;

select * from finish();
rollback;
