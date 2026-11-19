begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

-- Fixtures -------------------------------------------------------------------
-- f1: trial ended yesterday                          -> queued on the first run
-- f2: paid plan, period ended 8 days ago (past grace) -> queued on the first run
-- f3: trial still running; lapses before the second run
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, invited_at)
values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f1@test.dev', '{}', '{}', now(), now(), now(), null),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f2@test.dev', '{}', '{}', now(), now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'f3@test.dev', '{}', '{}', now(), now(), now(), null);

update public.subscriptions set trial_ends_at = now() - interval '1 day'
where user_id = '00000000-0000-0000-0000-0000000000f1';
update public.subscriptions
set plan = 'plus', status = 'active', billing_period = 'annual', current_period_end = now() - interval '8 days'
where user_id = '00000000-0000-0000-0000-0000000000f2';

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function pg_temp.queued(p_uid uuid) returns text language sql as $$
  select string_agg(previous_plan::text || '/' || previous_status::text
                    || '/' || coalesce(processed_at::text, 'pending'), ',')
  from public.subscription_expirations where user_id = p_uid
$$;

-- Privileges -------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000f3');
select throws_ok($$select * from public.subscription_expirations$$, '42501', null, 'clients cannot read the expiry queue');
reset role;

-- First run --------------------------------------------------------------------------
create temp table first_run as select * from public.run_subscription_expiry();

select is((select count(*)::int from first_run where user_id::text like '00000000-0000-0000-0000-0000000000f%'), 2, 'the run still reports who dropped');
select is(pg_temp.queued('00000000-0000-0000-0000-0000000000f1'), 'essential/trialing/pending', 'a lapsed trial is queued as pending');
select is(pg_temp.queued('00000000-0000-0000-0000-0000000000f2'), 'plus/active/pending', 'a lapsed paid plan is queued as pending');
select ok((select period_end < now() - interval '7 days' from public.subscription_expirations where user_id = '00000000-0000-0000-0000-0000000000f2'), 'the queue keeps the lapsed period end');
select is(pg_temp.queued('00000000-0000-0000-0000-0000000000f3'), null, 'a running trial is not queued');

-- Second run (through expire_subscriptions) -------------------------------------------
update public.subscriptions set trial_ends_at = now() - interval '1 minute'
where user_id = '00000000-0000-0000-0000-0000000000f3';

select is(
  (select public.expire_subscriptions()) >= 1, true,
  'expire_subscriptions() drops the newly lapsed trial');
select is(pg_temp.queued('00000000-0000-0000-0000-0000000000f3'), 'essential/trialing/pending', 'expire_subscriptions() queues it too');
select is((select count(*)::int from public.subscription_expirations where user_id::text like '00000000-0000-0000-0000-0000000000f%'), 3, 'accounts already on Free are not queued again');

-- Cleanup -------------------------------------------------------------------------------
delete from auth.users where id = '00000000-0000-0000-0000-0000000000f1';
select is(pg_temp.queued('00000000-0000-0000-0000-0000000000f1'), null, 'deleting the user removes its queue rows');

select * from finish();
rollback;
