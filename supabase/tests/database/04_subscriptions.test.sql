begin;
create extension if not exists pgtap with schema extensions;
select plan(52);

-- Fixtures -------------------------------------------------------------------
-- d1: self-signup, verified, country given in lowercase (must be normalized)
-- d2: invited account (admin-created) -> starts on Free
-- d3: self-signup, email NOT verified
-- a2: admin
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at, invited_at)
values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dee.one@gmail.com', '{}', '{"full_name":"Dee One","country":"cr"}', now(), now(), now(), null),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invited@test.dev', '{}', '{}', now(), now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'unverified@test.dev', '{}', '{}', now(), now(), null, null),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin2@test.dev', '{}', '{}', now(), now(), now(), now());

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a2';

create function pg_temp.act_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
end $$;

-- Signup bootstrap -----------------------------------------------------------------
select is((select plan::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000d1'), 'essential', 'self-signup starts on Essential');
select is((select status::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000d1'), 'trialing', 'self-signup is trialing');
select ok((select trial_ends_at between now() + interval '29 days' and now() + interval '31 days' from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000d1'), 'trial lasts about 30 days');
select is((select country from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'), 'CR', 'country is normalized to uppercase');
select is((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'), 'Dee One', 'full name is copied to the profile');
select is((select email_normalized from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'), 'deeone@gmail.com', 'gmail dots are removed in the normalized email');
select is((select plan::text || '/' || status::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000d2'), 'free/active', 'invited account starts on Free');
select ok((select not self_signup from public.profiles where id = '00000000-0000-0000-0000-0000000000d2'), 'invited account is not flagged as self-signup');
select is((select plan::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000a2'), 'free', 'admin row exists (admin plan comes from the role)');

select throws_ok(
  $$insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'Dee.One+promo@googlemail.com', '{}', '{}', now(), now())$$,
  '23505', null, 'an alias of an existing self-signup email is rejected');

-- Effective plan and limits ----------------------------------------------------------
select is(public.effective_plan('00000000-0000-0000-0000-0000000000d1')::text, 'essential', 'trial counts as Essential');
select is(public.effective_plan('00000000-0000-0000-0000-0000000000a2')::text, 'managers', 'admins resolve to managers');
select is(public.property_limit('00000000-0000-0000-0000-0000000000d1'), 3, 'Essential allows 3 properties');
select is(public.property_limit('00000000-0000-0000-0000-0000000000d2'), 1, 'Free allows 1 property');

update public.subscriptions set extra_properties = 2 where user_id = '00000000-0000-0000-0000-0000000000d1';
select is(public.property_limit('00000000-0000-0000-0000-0000000000d1'), 5, 'Essential extras add properties');
update public.subscriptions set extra_properties = 10 where user_id = '00000000-0000-0000-0000-0000000000d1';
select is(public.property_limit('00000000-0000-0000-0000-0000000000d1'), 7, 'Essential is capped at 7');
select is((select max_properties from public.profiles where id = '00000000-0000-0000-0000-0000000000d1'), 7, 'profiles.max_properties follows the subscription');
update public.subscriptions set plan = 'plus', status = 'active', trial_ends_at = null, extra_properties = 3 where user_id = '00000000-0000-0000-0000-0000000000d1';
select is(public.property_limit('00000000-0000-0000-0000-0000000000d1'), 10, 'Plus has no cap on extras');
update public.subscriptions set plan = 'managers', property_limit_override = 15 where user_id = '00000000-0000-0000-0000-0000000000d1';
select is(public.property_limit('00000000-0000-0000-0000-0000000000d1'), 15, 'managers use the admin override');

-- Back to a fresh Essential trial
update public.subscriptions
set plan = 'essential', status = 'trialing', trial_ends_at = now() + interval '30 days',
    extra_properties = 0, property_limit_override = null
where user_id = '00000000-0000-0000-0000-0000000000d1';

update public.subscriptions set trial_ends_at = now() - interval '1 minute' where user_id = '00000000-0000-0000-0000-0000000000d1';
select is(public.effective_plan('00000000-0000-0000-0000-0000000000d1')::text, 'free', 'an expired trial resolves to Free without any job');
select is(public.property_limit('00000000-0000-0000-0000-0000000000d1'), 1, 'an expired trial allows 1 property');
update public.subscriptions set trial_ends_at = now() + interval '30 days' where user_id = '00000000-0000-0000-0000-0000000000d1';

-- Self-serve guide creation ------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d3');
select throws_like($$select public.create_my_business('Casa Sin Verificar', 'sub-unverified')$$, '%email not verified%', 'unverified email cannot create a guide');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select lives_ok($$select public.create_my_business('Casa A', 'sub-a', '{"schema_version":1,"name":"Casa A"}')$$, 'trial user creates guide 1');
select lives_ok($$select public.create_my_business('Casa B', 'sub-b', '{"schema_version":1,"name":"Casa B"}')$$, 'trial user creates guide 2');
select lives_ok($$select public.create_my_business('Casa C', 'sub-c', '{"schema_version":1,"name":"Casa C"}')$$, 'trial user creates guide 3');
select throws_like($$select public.create_my_business('Casa D', 'sub-d')$$, '%property limit reached%', 'the 4th guide is rejected');
select is((public.my_entitlements() ->> 'property_limit')::int, 3, 'my_entitlements reports the limit');
select is((public.my_entitlements() ->> 'properties_used')::int, 3, 'my_entitlements reports the guides in use');
select is(public.my_entitlements() ->> 'plan', 'essential', 'my_entitlements reports the effective plan');
select lives_ok($$select public.publish_page(b.id, p.updated_at) from public.businesses b join public.pages p on p.business_id = b.id where b.slug in ('sub-a', 'sub-b', 'sub-c')$$, 'guides can be published during the trial');
reset role;

-- Give the guides a deterministic age: a is the oldest
update public.businesses set created_at = now() - interval '3 days' where slug = 'sub-a';
update public.businesses set created_at = now() - interval '2 days' where slug = 'sub-b';
update public.businesses set created_at = now() - interval '1 day' where slug = 'sub-c';

select pg_temp.act_as_anon();
select is((public.get_public_page('sub-c') ->> 'branding')::boolean, false, 'trial (Essential) guides have no branding');
reset role;

-- Trial ends: the oldest guide stays, the others pause --------------------------------------
update public.subscriptions set trial_ends_at = now() - interval '1 minute' where user_id = '00000000-0000-0000-0000-0000000000d1';

select is(public.business_is_paused_by_plan((select id from public.businesses where slug = 'sub-a')), false, 'oldest guide stays enabled');
select is(public.business_is_paused_by_plan((select id from public.businesses where slug = 'sub-b')), true, 'second guide is paused');
select is(public.business_is_paused_by_plan((select id from public.businesses where slug = 'sub-c')), true, 'third guide is paused');

select pg_temp.act_as_anon();
select is(public.get_public_page('sub-b') ->> 'redirect_to', 'sub-a', 'a paused guide redirects to the enabled one');
select is((public.get_public_page('sub-b') ->> 'temporary')::boolean, true, 'the pause redirect is flagged temporary');
select is((public.get_public_page('sub-a') ->> 'branding')::boolean, true, 'Free guides show the branding note');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
update public.pages set draft_content = '{"schema_version":1,"name":"Hacked B"}' where business_id = (select id from public.businesses where slug = 'sub-b');
update public.pages set draft_content = '{"schema_version":1,"name":"Edited A"}' where business_id = (select id from public.businesses where slug = 'sub-a');
select throws_like($$select public.publish_page(b.id, p.updated_at) from public.businesses b join public.pages p on p.business_id = b.id where b.slug = 'sub-b'$$, '%not active%', 'a paused guide cannot be published');
select throws_like($$select public.create_my_business('Casa E', 'sub-e')$$, '%property limit reached%', 'Free limit blocks new guides after the trial');
reset role;

select is((select draft_content ->> 'name' from public.pages where business_id = (select id from public.businesses where slug = 'sub-b')), 'Casa B', 'a paused guide cannot be edited by its owner');
select is((select draft_content ->> 'name' from public.pages where business_id = (select id from public.businesses where slug = 'sub-a')), 'Edited A', 'the enabled guide can still be edited');

-- Paying again reactivates everything -----------------------------------------------------
update public.subscriptions
set plan = 'essential', status = 'active', trial_ends_at = null, current_period_end = now() + interval '30 days'
where user_id = '00000000-0000-0000-0000-0000000000d1';

select is(public.business_is_paused_by_plan((select id from public.businesses where slug = 'sub-b')), false, 'upgrading unpauses the guides');
select pg_temp.act_as_anon();
select is(public.get_public_page('sub-b') ->> 'slug', 'sub-b', 'an unpaused guide is served again');
reset role;

-- RLS and protected fields ---------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
update public.subscriptions set plan = 'plus' where user_id = '00000000-0000-0000-0000-0000000000d1';
select is((select count(*)::int from public.subscriptions), 1, 'a client sees only their own subscription');
select throws_like($$update public.profiles set email_normalized = 'x@y.z' where id = '00000000-0000-0000-0000-0000000000d1'$$, '%protected field%', 'a client cannot change email_normalized');
select throws_like($$select public.property_limit('00000000-0000-0000-0000-0000000000d1')$$, '%permission denied%', 'clients cannot call internal helpers');
select throws_like($$select public.expire_subscriptions()$$, '%permission denied%', 'clients cannot run the expiry job');
reset role;
select is((select plan::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000d1'), 'essential', 'a client cannot change their own plan');

-- Expiry job ----------------------------------------------------------------------------------------
update public.subscriptions
set plan = 'plus', status = 'trialing', trial_ends_at = now() - interval '1 day'
where user_id = '00000000-0000-0000-0000-0000000000d2';
select cmp_ok(public.expire_subscriptions(), '>=', 1, 'expire_subscriptions reports the rows it changed');
select is((select plan::text || '/' || status::text from public.subscriptions where user_id = '00000000-0000-0000-0000-0000000000d2'), 'free/expired', 'expired trials are stored as Free/expired');

-- Suspension metadata -----------------------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
update public.businesses set status = 'suspended', suspended_reason = 'spam' where slug = 'sub-a';
reset role;
select ok((select suspended_at is not null from public.businesses where slug = 'sub-a'), 'suspending a guide records the time');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
update public.businesses set status = 'active' where slug = 'sub-a';
reset role;
select ok((select suspended_at is null and suspended_reason is null from public.businesses where slug = 'sub-a'), 'reactivating clears the suspension data');

select * from finish();
rollback;
