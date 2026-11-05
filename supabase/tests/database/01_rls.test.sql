begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

-- Fixtures -------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.dev', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clienta@test.dev', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clientb@test.dev', '{}', '{}', now(), now());

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';

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

-- Admin creates two businesses --------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$select public.create_business('Casa Brisa', 'rls-casa-brisa', 'hotel', 'hospitality', '{"schema_version":1,"name":"Casa Brisa"}')$$, 'admin can create business A');
select lives_ok($$select public.create_business('Cafe Luna', 'rls-cafe-luna', 'cafe', 'general', '{"schema_version":1,"name":"Cafe Luna"}')$$, 'admin can create business B');

insert into public.business_members (business_id, user_id)
select id, '00000000-0000-0000-0000-0000000000c1' from public.businesses where slug = 'rls-casa-brisa';
insert into public.business_members (business_id, user_id)
select id, '00000000-0000-0000-0000-0000000000c2' from public.businesses where slug = 'rls-cafe-luna';
reset role;

select is((select count(*)::int from public.qr_codes where destination_path like '/negocio/rls-%'), 2, 'create_business also creates QR records');

-- Client A isolation --------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is((select count(*)::int from public.businesses), 1, 'client A sees only own business');
select is((select slug from public.businesses), 'rls-casa-brisa', 'client A sees rls-casa-brisa');
select is((select count(*)::int from public.pages), 1, 'client A sees only own page');
select is((select count(*)::int from public.business_members), 1, 'client A sees only own membership');
select is((select count(*)::int from public.quote_requests), 0, 'client cannot read quotes');
select is((select count(*)::int from public.slug_history), 0, 'client cannot read slug history');

select lives_ok($$update public.pages set draft_content = '{"schema_version":1,"name":"Casa Brisa 2"}' where business_id = (select id from public.businesses where slug = 'rls-casa-brisa')$$, 'client A can edit own draft');
select throws_like($$update public.pages set published_content = '{"x":1}' where business_id = (select id from public.businesses where slug = 'rls-casa-brisa')$$, '%protected field%', 'client cannot write published_content directly');
select throws_like($$update public.pages set status = 'published' where business_id = (select id from public.businesses where slug = 'rls-casa-brisa')$$, '%protected field%', 'client cannot change page status directly');
select throws_like($$update public.pages set template_key = 'general' where business_id = (select id from public.businesses where slug = 'rls-casa-brisa')$$, '%protected field%', 'client cannot change template');
select lives_ok($$update public.businesses set slug = 'hacked-slug' where slug = 'rls-casa-brisa'$$, 'client slug update runs (filtered by RLS)');
select lives_ok($$update public.businesses set status = 'archived' where slug = 'rls-casa-brisa'$$, 'client status update runs (filtered by RLS)');
select throws_like($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000c1'$$, '%protected field%', 'client cannot self-promote');
select throws_like($$insert into public.business_members (business_id, user_id) select id, '00000000-0000-0000-0000-0000000000c1' from public.businesses$$, '%row-level security%', 'client cannot add memberships');
select throws_like($$select public.create_business('Evil', 'evil-biz', 'x', 'general')$$, '%only admins%', 'client cannot create business');

-- Cross-tenant write attempt is silently filtered by RLS
select lives_ok($$update public.pages set draft_content = '{"hacked":true}' where business_id = (select id from public.businesses where slug = 'rls-cafe-luna')$$, 'cross-tenant update runs (filtered)');
select throws_like($$select public.publish_page((select id from public.businesses where slug = 'rls-cafe-luna'))$$, '%not allowed%', 'client A cannot publish business B');
reset role;

select is((select slug || ':' || status::text from public.businesses where slug like 'rls-casa-brisa%'), 'rls-casa-brisa:active', 'client could not change slug or status');
select is((select draft_content ->> 'hacked' from public.pages p join public.businesses b on b.id = p.business_id where b.slug = 'rls-cafe-luna'), null, 'business B draft untouched');

-- Publish flow --------------------------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select lives_ok($$select public.publish_page((select id from public.businesses where slug = 'rls-casa-brisa'))$$, 'client A can publish own page');
reset role;

select pg_temp.act_as_anon();
select throws_like($$select count(*) from public.businesses$$, '%permission denied%', 'anon cannot read businesses table');
select is((public.get_public_page('rls-casa-brisa') -> 'content' ->> 'name'), 'Casa Brisa 2', 'anon sees published content via RPC');
select is(public.get_public_page('rls-cafe-luna'), null, 'unpublished page is not public');
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => 'hotel', p_product_id => null, p_message => 'Hola', p_ip_hash => repeat('a', 64))$$, '%permission denied%', 'anon cannot call submit_quote_request');
select throws_like($$insert into public.quote_requests (name) values ('direct')$$, '%permission denied%', 'anon cannot insert quotes directly');
reset role;

-- Slug change keeps old URL alive ---------------------------------------------------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$update public.businesses set slug = 'rls-casa-brisa-cr' where slug = 'rls-casa-brisa'$$, 'admin can change slug');
reset role;

select pg_temp.act_as_anon();
select is(public.get_public_page('rls-casa-brisa') ->> 'redirect_to', 'rls-casa-brisa-cr', 'old slug redirects to new slug');
reset role;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select throws_like($$select public.create_business('Squatter', 'rls-casa-brisa', 'x', 'general')$$, '%retired%', 'retired slug cannot be reused');
select throws_like($$select public.create_business('Bad', 'Bad_Slug', 'x', 'general')$$, '%slug_format%', 'invalid slug format rejected');
select throws_like($$select public.create_business('Res', 'admin', 'x', 'general')$$, '%not_reserved%', 'reserved slug rejected');
reset role;

-- Suspension hides the page ---------------------------------------------------------
update public.businesses set status = 'suspended' where slug = 'rls-casa-brisa-cr';
select pg_temp.act_as_anon();
select is(public.get_public_page('rls-casa-brisa-cr'), null, 'suspended business page not public');
select is(public.get_public_page('rls-casa-brisa'), null, 'suspended business old slug not public');
reset role;

select * from finish();
rollback;
