begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, invited_at)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b1@test.dev', '{}', '{}', now(), now(), now(), null);

-- Lease -----------------------------------------------------------------------------
select is(public.acquire_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000aaaa', 30), true, 'a free lease is taken');
select is(public.acquire_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000bbbb', 30), false, 'a held lease is refused to another token');
select is(public.release_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000bbbb'), false, 'another token cannot release it');
select is(public.release_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000aaaa'), true, 'the holder releases it');
select is(public.acquire_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000bbbb', 30), true, 'a released lease can be taken again');

-- Expiry --------------------------------------------------------------------------------
update public.billing_locks set locked_until = clock_timestamp() - interval '1 second'
where user_id = '00000000-0000-0000-0000-0000000000b1';
select is(public.acquire_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000cccc', 30), true, 'an expired lease is taken over');
select is(public.release_billing_lock('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000bbbb'), false, 'the expired holder cannot release the new lease');

select throws_ok(
  $$ select public.acquire_billing_lock('00000000-0000-0000-0000-0000000000b1', gen_random_uuid(), 0) $$,
  'lease must be between 1 and 300 seconds');

-- Access ----------------------------------------------------------------------------------
set local role authenticated;
select throws_ok(
  $$ select public.acquire_billing_lock('00000000-0000-0000-0000-0000000000b1', gen_random_uuid(), 30) $$,
  '42501', null, 'clients cannot call it');
reset role;

select * from finish();
rollback;
