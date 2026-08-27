-- Run with `supabase test db` after `supabase db reset`.
-- The transaction is always rolled back and never changes a linked project.

begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Deterministic identities used to prove isolation.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000','10000000-0000-4000-8000-000000000001','authenticated','authenticated','alice@example.test','', '{"provider":"email","providers":["email"]}','{"name":"Alice"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-4000-8000-000000000002','authenticated','authenticated','bob@example.test','',   '{"provider":"email","providers":["email"]}','{"name":"Bob"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-4000-8000-000000000003','authenticated','authenticated','eve@example.test','',   '{"provider":"email","providers":["email"]}','{"name":"Eve"}',now(),now());

insert into public.conversations(id,is_group,title,created_by)
values ('20000000-0000-4000-8000-000000000001',false,null,'10000000-0000-4000-8000-000000000001');
insert into public.conversation_participants(conversation_id,user_id,member_role)
values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','owner'),
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','member');

insert into public.documents(id,owner_id,name,storage_path)
values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Bob secret','bob/secret.pdf');
insert into public.document_shares(document_id,shared_with_user_id)
values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);

select results_eq(
  $$ select id from public.profiles order by id $$,
  $$ values ('10000000-0000-4000-8000-000000000001'::uuid) $$,
  'full profile rows are restricted to self'
);
select is(
  (select count(*)::integer from public.get_public_profiles(array['10000000-0000-4000-8000-000000000002'::uuid])),
  1,
  'safe directory exposes another visible profile'
);
select ok(
  not (to_jsonb(p) ?| array['email','role','credits','phone','citizenship_id']),
  'safe directory contains no sensitive profile keys'
) from public.get_public_profiles(array['10000000-0000-4000-8000-000000000002'::uuid]) p;
select is(
  (select count(*)::integer from public.conversations where id='20000000-0000-4000-8000-000000000001'),
  1,
  'conversation member can read the conversation'
);
select lives_ok(
  $$ insert into public.messages(conversation_id,sender_id,content)
     values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','allowed') $$,
  'conversation member can write a message as self'
);
select throws_ok(
  $$ insert into public.messages(conversation_id,sender_id,content)
     values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','') $$,
  '23514',
  null,
  'empty text messages are rejected'
);
select is(
  (select count(*)::integer from public.documents where id='30000000-0000-4000-8000-000000000001'),
  1,
  'explicit document share grants access'
);
select throws_ok(
  $$ update public.profiles set role='admin' where id='10000000-0000-4000-8000-000000000001' $$,
  '42501',
  null,
  'browser cannot promote its profile role'
);
select throws_ok(
  $$ select public.award_xp_and_credits('10000000-0000-4000-8000-000000000001',100,100) $$,
  '42501',
  null,
  'browser cannot self-award XP or credits'
);
select throws_ok(
  $$ select public.insert_wallet_transaction('10000000-0000-4000-8000-000000000001','credit',100,'CREDITS','test','test-credit') $$,
  '42501',
  null,
  'browser cannot create a wallet credit'
);

select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is(
  (select count(*)::integer from public.conversations where id='20000000-0000-4000-8000-000000000001'),
  0,
  'non-member cannot read another conversation'
);
select throws_ok(
  $$ insert into public.messages(conversation_id,sender_id,content)
     values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','denied') $$,
  '42501',
  null,
  'non-member cannot insert into another conversation'
);
select is(
  (select count(*)::integer from public.documents where id='30000000-0000-4000-8000-000000000001'),
  0,
  'unshared user cannot read another document'
);
select is(
  has_function_privilege('anon','public.award_xp_and_credits(uuid,integer,numeric)','execute'),
  false,
  'anon cannot execute the sensitive award RPC'
);

select * from finish();
rollback;
