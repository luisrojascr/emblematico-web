begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Fixtures -------------------------------------------------------------------
-- e1: trial ended yesterday            -> drops to Free
-- e2: trial still running              -> unchanged
-- e3: paid plan, period ended 8 days ago (past the 7-day grace) -> drops to Free
-- e4: paid plan, period ended 3 days ago (in grace)              -> unchanged
-- e5: admin with a lapsed trial row    -> never downgraded here
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, invited_at)
values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e1@test.dev', '{}', '{}', now(), now(), now(), null),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e2@test.dev', '{}', '{}', now(), now(), now(), null),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e3@test.dev', '{}', '{}', now(), now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e4@test.dev', '{}', '{}', now(), now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'e5@test.dev', '{}', '{}', now(), now(), now(), null);

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000e5';

update public.subscriptions set trial_ends_at = now() - interval '1 day'
where user_id in ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e5');
update public.subscriptions
set plan = 'plus', status = 'active', billing_period = 'annual', current_period_end = now() - interval '8 days'
where user_id = '00000000-0000-0000-0000-0000000000e3';
update public.subscriptions
set plan = 'essential', status = 'active', billing_period = 'monthly', current_period_end = now() - interval '3 days'
where user_id = '00000000-0000-0000-0000-0000000000e4';

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

-- Privileges -------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000e2');
select throws_ok($$select * from public.run_subscription_expiry()$$, '42501', null, 'clients cannot run the expiry');
select throws_ok($$select * from public.subscription_notices$$, '42501', null, 'clients cannot read sent notices');
reset role;

-- Expiry ---------------------------------------------------------------------------
create temp table expired as select * from public.run_subscription_expiry();

select is((select count(*)::int from expired where user_id::text like '00000000-0000-0000-0000-0000000000e%'), 2, 'two accounts drop to Free');
select is((select previous_plan::text || '/' || previous_status::text from expired where user_id = '00000000-0000-0000-0000-0000000000e1'), 'essential/trialing', 'a lapsed trial reports its previous plan');
select is((select previous_plan::text || '/' || previous_status::text from expired where user_id = '00000000-0000-0000-0000-0000000000e3'), 'plus/active', 'a lapsed paid plan reports its previous plan');
select ok((select period_end < now() - interval '7 days' from expired where user_id = '00000000-0000-0000-0000-0000000000e3'), 'the paid plan reports its period end');
select is((select plan::text || '/' || status::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000e1'), 'free/expired', 'the lapsed trial is stored as Free');
select is((select billing_period from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000e3'), null, 'the billing period is cleared');
select is((select status::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000e2'), 'trialing', 'a running trial is untouched');
select is((select plan::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000e4'), 'essential', 'a paid plan in its grace period is untouched');
select is((select status::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000e5'), 'trialing', 'admins are never downgraded');
select is((select count(*)::int from public.run_subscription_expiry() where user_id::text like '00000000-0000-0000-0000-0000000000e%'), 0, 'a second run finds nothing to do');
select lives_ok('select public.expire_subscriptions()', 'expire_subscriptions() still works');

-- Notices --------------------------------------------------------------------------
insert into public.subscription_notices (user_id, kind, period_end)
values ('00000000-0000-0000-0000-0000000000e2', 'trial_7d', '2026-12-01T00:00:00Z');
select throws_ok(
  $$insert into public.subscription_notices (user_id, kind, period_end)
    values ('00000000-0000-0000-0000-0000000000e2', 'trial_7d', '2026-12-01T00:00:00Z')$$,
  '23505', null, 'a notice is recorded once per period');

select * from finish();
rollback;
