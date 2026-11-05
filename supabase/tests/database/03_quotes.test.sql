begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clienta@test.dev', '{}', '{}', now(), now());

-- Untrusted roles cannot call the RPC at all --------------------------------------------
set local role anon;
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('a', 64))$$, '%permission denied%', 'anon cannot submit quotes');
reset role;

select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000c1', 'role', 'authenticated')::text, true);
set local role authenticated;
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('a', 64))$$, '%permission denied%', 'authenticated clients cannot submit quotes');
reset role;

-- Trusted server (service_role) ---------------------------------------------------------------
set local role service_role;
select lives_ok($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => 'hotel', p_product_id => null, p_message => 'Hola', p_ip_hash => repeat('a', 64))$$, 'service_role can submit a quote');
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => null)$$, '%invalid rate-limit identity%', 'null identity is rejected');
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => 'not-a-hash')$$, '%invalid rate-limit identity%', 'malformed identity is rejected');
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => null, p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('b', 64))$$, '%phone or email%', 'quote requires phone or email');
select throws_like($$select public.submit_quote_request(p_name => '', p_phone => '+506', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('b', 64))$$, '%name required%', 'quote requires a name');

-- Per-identity limit: 5 per hour (the first call above counted as 1) ---------------------------------
select lives_ok($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('a', 64)) from generate_series(1, 4)$$, 'four more requests from the same identity succeed');
select throws_like($$select public.submit_quote_request(p_name => 'Ana', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('a', 64))$$, '%rate limit exceeded%', 'sixth request from the same identity is blocked');
select lives_ok($$select public.submit_quote_request(p_name => 'Luis', p_phone => '+50688887777', p_email => null, p_business_type => null, p_product_id => null, p_message => null, p_ip_hash => repeat('c', 64))$$, 'a different identity is not affected');
reset role;

select is((select count(*)::int from public.quote_requests where ip_hash = repeat('a', 64)), 5, 'exactly five stored for the limited identity');

select * from finish();
rollback;
