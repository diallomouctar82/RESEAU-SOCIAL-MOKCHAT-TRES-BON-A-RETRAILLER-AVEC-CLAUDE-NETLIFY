-- Reconciles the repository with the live 2026-08-27 core schema.
-- Additive/idempotent: existing identities and user data are preserved.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;

-- ---------------------------------------------------------------------------
-- Additive columns for the live tables (no parallel social/chat tables).
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists privacy_settings jsonb not null
  default '{"profileVisibility":"network","allowMessagesFrom":"network","showOnlineStatus":true}'::jsonb;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists followers_count integer not null default 0;
alter table public.profiles add column if not exists following_count integer not null default 0;

alter table public.posts add column if not exists media_bucket text;
alter table public.posts add column if not exists media_path text;
alter table public.posts add column if not exists media_type text;
alter table public.posts add column if not exists media_metadata jsonb not null default '{}'::jsonb;
alter table public.posts drop constraint if exists posts_visibility_check;
alter table public.posts add constraint posts_visibility_check
  check (visibility in ('public','network','private')) not valid;
alter table public.posts validate constraint posts_visibility_check;

alter table public.post_documents alter column url drop not null;
alter table public.post_documents add column if not exists bucket_id text;
alter table public.post_documents add column if not exists object_path text;

alter table public.comments add column if not exists updated_at timestamptz not null default now();

alter table public.stories alter column media_url drop not null;
alter table public.stories add column if not exists media_bucket text;
alter table public.stories add column if not exists media_path text;
alter table public.stories add column if not exists media_type text;
alter table public.stories add column if not exists visibility text not null default 'network';
alter table public.stories drop constraint if exists stories_visibility_check;
alter table public.stories add constraint stories_visibility_check
  check (visibility in ('public','network','private')) not valid;
alter table public.stories validate constraint stories_visibility_check;

alter table public.conversations add column if not exists direct_key text;
alter table public.conversations add column if not exists last_message_at timestamptz;
alter table public.conversations add column if not exists last_message_preview text;
alter table public.conversations add column if not exists updated_at timestamptz not null default now();

alter table public.conversation_participants add column if not exists member_role text not null default 'member';
alter table public.conversation_participants add column if not exists is_muted boolean not null default false;
alter table public.conversation_participants add column if not exists is_pinned boolean not null default false;
alter table public.conversation_participants drop constraint if exists conversation_participants_member_role_check;
alter table public.conversation_participants add constraint conversation_participants_member_role_check
  check (member_role in ('owner','admin','member')) not valid;
alter table public.conversation_participants validate constraint conversation_participants_member_role_check;

alter table public.messages add column if not exists client_message_id uuid not null default gen_random_uuid();
alter table public.messages add column if not exists message_type text not null default 'text';
alter table public.messages add column if not exists status text not null default 'sent';
alter table public.messages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.messages add column if not exists reply_to_id uuid references public.messages(id) on delete set null;
alter table public.messages add column if not exists is_pinned boolean not null default false;
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists updated_at timestamptz not null default now();
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text','system')) not valid;
alter table public.messages validate constraint messages_message_type_check;
alter table public.messages drop constraint if exists messages_status_check;
alter table public.messages add constraint messages_status_check
  check (status in ('sending','sent','delivered','read','failed')) not valid;
alter table public.messages validate constraint messages_status_check;
alter table public.messages drop constraint if exists messages_payload_check;
alter table public.messages add constraint messages_payload_check
  check (deleted_at is not null or nullif(trim(content), '') is not null) not valid;
alter table public.messages validate constraint messages_payload_check;

alter table public.wallet_transactions add column if not exists idempotency_key text;
alter table public.wallet_transactions add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.wallet_transactions add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists uq_conversation_participant
  on public.conversation_participants(conversation_id, user_id);
create unique index if not exists uq_direct_conversation_key
  on public.conversations(direct_key) where is_group = false and direct_key is not null;
create unique index if not exists uq_message_client_id
  on public.messages(sender_id, client_message_id);
create unique index if not exists uq_post_reaction
  on public.post_reactions(post_id, user_id);
create unique index if not exists uq_wallet_transaction_idempotency
  on public.wallet_transactions(user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_conversation_participants_user
  on public.conversation_participants(user_id, conversation_id);
create index if not exists idx_messages_conversation_created
  on public.messages(conversation_id, created_at desc);
create index if not exists idx_posts_created
  on public.posts(created_at desc);
create index if not exists idx_comments_post_created
  on public.comments(post_id, created_at);
create index if not exists idx_stories_active
  on public.stories(expires_at desc) where expires_at > '2000-01-01'::timestamptz;
create index if not exists idx_user_blocks_blocked
  on public.user_blocks(blocked_id, blocker_id);
create index if not exists idx_abuse_reports_status
  on public.abuse_reports(status, created_at desc);
create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Generic timestamp trigger.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at before update on public.posts
for each row execute function public.set_updated_at();
drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at before update on public.comments
for each row execute function public.set_updated_at();
drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at before update on public.conversations
for each row execute function public.set_updated_at();
drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at before update on public.messages
for each row execute function public.set_updated_at();
drop trigger if exists trg_presence_updated_at on public.user_presence;
create trigger trg_presence_updated_at before update on public.user_presence
for each row execute function public.set_updated_at();
drop trigger if exists trg_abuse_reports_updated_at on public.abuse_reports;
create trigger trg_abuse_reports_updated_at before update on public.abuse_reports
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Identity: auth.users is the single source of truth. Metadata never grants a
-- role. Existing roles are preserved; future promotions use an audited RPC.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'utilisateur'), '@', 1)
  );
  v_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  -- The trigger is trusted, but its caller is an Auth session. Explicitly
  -- enable the guard only for this transaction-local operation.
  perform set_config('app.bypass_profile_guard', 'on', true);

  insert into public.profiles (
    id, email, name, role, avatar_url, citizenship_id,
    credits, level, xp, next_level_xp
  ) values (
    new.id,
    coalesce(new.email, ''),
    left(v_name, 120),
    'user',
    v_avatar,
    'LMAV-' || upper(substr(replace(new.id::text, '-', ''), 1, 12)),
    0, 1, 0, 1000
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and coalesce(current_setting('app.bypass_profile_guard', true), '') <> 'on'
     and (
       new.id is distinct from old.id or
       new.email is distinct from old.email or
       new.role is distinct from old.role or
       new.credits is distinct from old.credits or
       new.xp is distinct from old.xp or
       new.level is distinct from old.level or
       new.next_level_xp is distinct from old.next_level_xp or
       new.two_factor_enabled is distinct from old.two_factor_enabled or
       new.created_at is distinct from old.created_at
     ) then
    raise exception using
      errcode = '42501',
      message = 'Protected profile fields can only be changed by a trusted server operation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_protect_sensitive on public.profiles;
create trigger trg_profiles_protect_sensitive
before update on public.profiles
for each row execute function public.protect_profile_sensitive_columns();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','super_admin')
  );
$$;

create or replace function private.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('moderator','admin','super_admin')
  );
$$;

create or replace function private.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

create or replace function private.can_manage_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
      and cp.member_role in ('owner','admin')
  );
$$;

create or replace function private.users_are_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = p_user_a and b.blocked_id = p_user_b)
       or (b.blocker_id = p_user_b and b.blocked_id = p_user_a)
  );
$$;

create or replace function private.conversation_has_block(p_conversation_id uuid, p_sender_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id <> p_sender_id
      and private.users_are_blocked(p_sender_id, cp.user_id)
  );
$$;

create or replace function private.can_view_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        p.author_id = auth.uid()
        or public.is_admin()
        or (
          p.visibility in ('public','network')
          and not private.users_are_blocked(p.author_id, auth.uid())
        )
      )
  );
$$;

create or replace function private.can_view_story(p_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stories s
    where s.id = p_story_id
      and s.expires_at > now()
      and (
        s.author_id = auth.uid()
        or public.is_admin()
        or (
          s.visibility in ('public','network')
          and not private.users_are_blocked(s.author_id, auth.uid())
        )
      )
  );
$$;

create or replace function private.can_view_presence(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = p_user_id
        and coalesce((p.privacy_settings ->> 'showOnlineStatus')::boolean, true)
        and not private.users_are_blocked(p_user_id, auth.uid())
    );
$$;

create or replace function private.write_audit(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, request_id, metadata)
  values (
    auth.uid(), left(p_action, 120), left(p_entity_type, 120), left(p_entity_id, 200),
    coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb ->> 'x-request-id',
    coalesce(p_metadata, '{}'::jsonb)
  );
$$;

-- Safe public directory: never returns email, phone, role, credits or metadata.
create or replace function public.search_public_profiles(
  p_query text default '',
  p_limit integer default 30
)
returns table (
  id uuid,
  name text,
  title text,
  avatar_url text,
  country text,
  city text,
  is_verified boolean,
  followers_count integer,
  following_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.title, p.avatar_url, p.country, p.city,
         p.is_verified, p.followers_count, p.following_count
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and coalesce(p.privacy_settings ->> 'profileVisibility', 'network') <> 'private'
    and not private.users_are_blocked(p.id, auth.uid())
    and (
      nullif(trim(p_query), '') is null
      or position(lower(trim(p_query)) in lower(p.name)) > 0
      or position(lower(trim(p_query)) in lower(coalesce(p.title, ''))) > 0
      or position(lower(trim(p_query)) in lower(coalesce(p.city, ''))) > 0
    )
  order by p.is_verified desc, p.name asc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

create or replace function public.get_public_profiles(p_user_ids uuid[])
returns table (
  id uuid,
  name text,
  title text,
  avatar_url text,
  country text,
  city text,
  is_verified boolean,
  followers_count integer,
  following_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with requested as (
    select distinct requested_id
    from unnest(coalesce(p_user_ids, '{}')) requested_id
    where requested_id is not null
    limit 100
  )
  select p.id, p.name, p.title, p.avatar_url, p.country, p.city,
         p.is_verified, p.followers_count, p.following_count, p.created_at
  from requested r
  join public.profiles p on p.id = r.requested_id
  where auth.uid() is not null
    and (
      p.id = auth.uid()
      or public.is_admin()
      or (
        coalesce(p.privacy_settings ->> 'profileVisibility', 'network') <> 'private'
        and not private.users_are_blocked(p.id, auth.uid())
      )
    );
$$;

create or replace function public.update_my_profile(p_changes jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_unknown_key text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object' then
    raise exception 'Profile changes must be a JSON object' using errcode = '22023';
  end if;

  select k into v_unknown_key
  from jsonb_object_keys(coalesce(p_changes, '{}'::jsonb)) k
  where k <> all(array[
    'name','title','bio','country','city','phone','website','avatar_url',
    'preferred_language','interests','privacy_settings'
  ])
  limit 1;
  if v_unknown_key is not null then
    raise exception 'Profile field is not client-editable: %', v_unknown_key using errcode = '42501';
  end if;

  update public.profiles p set
    name = case when p_changes ? 'name' then left(nullif(trim(p_changes->>'name'), ''), 120) else p.name end,
    title = case when p_changes ? 'title' then left(nullif(trim(p_changes->>'title'), ''), 160) else p.title end,
    bio = case when p_changes ? 'bio' then left(p_changes->>'bio', 2000) else p.bio end,
    country = case when p_changes ? 'country' then left(p_changes->>'country', 120) else p.country end,
    city = case when p_changes ? 'city' then left(p_changes->>'city', 160) else p.city end,
    phone = case when p_changes ? 'phone' then left(p_changes->>'phone', 40) else p.phone end,
    website = case when p_changes ? 'website' then left(p_changes->>'website', 500) else p.website end,
    avatar_url = case when p_changes ? 'avatar_url' then left(p_changes->>'avatar_url', 2000) else p.avatar_url end,
    preferred_language = case when p_changes ? 'preferred_language' then left(p_changes->>'preferred_language', 12) else p.preferred_language end,
    interests = case when p_changes ? 'interests' then array(select jsonb_array_elements_text(p_changes->'interests')) else p.interests end,
    privacy_settings = case when p_changes ? 'privacy_settings' then p_changes->'privacy_settings' else p.privacy_settings end
  where p.id = auth.uid()
  returning p.* into v_profile;

  if v_profile.id is null then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  perform private.write_audit('profile.updated', 'profile', v_profile.id::text, jsonb_build_object('fields', p_changes));
  return v_profile;
end;
$$;

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role text,
  p_reason text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_before text;
  v_profile public.profiles;
begin
  select p.role into v_actor_role from public.profiles p where p.id = auth.uid();
  if v_actor_role not in ('admin','super_admin') then raise exception 'Admin role required' using errcode = '42501'; end if;
  if p_role not in ('user','admin','expert','mentor','moderator','organization','super_admin') then
    raise exception 'Invalid role' using errcode = '22023';
  end if;
  if p_role = 'super_admin' and v_actor_role <> 'super_admin' then
    raise exception 'Only a super administrator can grant super_admin' using errcode = '42501';
  end if;
  if nullif(trim(p_reason), '') is null then raise exception 'A reason is required' using errcode = '22023'; end if;

  select p.role into v_before from public.profiles p where p.id = p_user_id for update;
  if v_before is null then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles p set role = p_role where p.id = p_user_id returning p.* into v_profile;
  perform private.write_audit(
    'profile.role_changed','profile',p_user_id::text,
    jsonb_build_object('from',v_before,'to',p_role,'reason',left(p_reason,1000))
  );
  return v_profile;
end;
$$;

create or replace function public.admin_update_user_profile(
  p_user_id uuid,
  p_changes jsonb,
  p_reason text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_unknown_key text;
begin
  if not public.is_admin() then raise exception 'Admin role required' using errcode = '42501'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'A reason is required' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object' then
    raise exception 'Profile changes must be a JSON object' using errcode = '22023';
  end if;
  select k into v_unknown_key
  from jsonb_object_keys(coalesce(p_changes, '{}'::jsonb)) k
  where k <> all(array[
    'name','title','bio','country','city','phone','website','avatar_url',
    'preferred_language','interests','privacy_settings','is_verified'
  ])
  limit 1;
  if v_unknown_key is not null then
    raise exception 'Admin profile field is not editable through this RPC: %', v_unknown_key using errcode = '42501';
  end if;

  update public.profiles p set
    name = case when p_changes ? 'name' then left(nullif(trim(p_changes->>'name'), ''), 120) else p.name end,
    title = case when p_changes ? 'title' then left(nullif(trim(p_changes->>'title'), ''), 160) else p.title end,
    bio = case when p_changes ? 'bio' then left(p_changes->>'bio', 2000) else p.bio end,
    country = case when p_changes ? 'country' then left(p_changes->>'country', 120) else p.country end,
    city = case when p_changes ? 'city' then left(p_changes->>'city', 160) else p.city end,
    phone = case when p_changes ? 'phone' then left(p_changes->>'phone', 40) else p.phone end,
    website = case when p_changes ? 'website' then left(p_changes->>'website', 500) else p.website end,
    avatar_url = case when p_changes ? 'avatar_url' then left(p_changes->>'avatar_url', 2000) else p.avatar_url end,
    preferred_language = case when p_changes ? 'preferred_language' then left(p_changes->>'preferred_language', 12) else p.preferred_language end,
    interests = case when p_changes ? 'interests' then array(select jsonb_array_elements_text(p_changes->'interests')) else p.interests end,
    privacy_settings = case when p_changes ? 'privacy_settings' then p_changes->'privacy_settings' else p.privacy_settings end,
    is_verified = case when p_changes ? 'is_verified' then (p_changes->>'is_verified')::boolean else p.is_verified end
  where p.id = p_user_id
  returning p.* into v_profile;
  if v_profile.id is null then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  perform private.write_audit(
    'profile.admin_updated','profile',p_user_id::text,
    jsonb_build_object('fields',p_changes,'reason',left(p_reason,1000))
  );
  return v_profile;
end;
$$;

-- XP/credits and wallet mutations are server-only. A browser can no longer
-- award itself value simply by choosing its own user id.
create or replace function public.award_xp_and_credits(
  p_user_id uuid,
  p_xp_delta integer,
  p_credits_delta numeric
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_new_xp integer;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Trusted server credential required' using errcode = '42501';
  end if;
  if abs(p_xp_delta) > 1000000 or abs(p_credits_delta) > 1000000 then
    raise exception 'Delta outside allowed range' using errcode = '22003';
  end if;

  select p.xp into v_new_xp from public.profiles p where p.id = p_user_id for update;
  if v_new_xp is null then raise exception 'Profile not found' using errcode = 'P0002'; end if;
  v_new_xp := greatest(0, v_new_xp + p_xp_delta);
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles p set
    xp = v_new_xp,
    credits = greatest(0, p.credits + p_credits_delta),
    level = case when v_new_xp >= p.next_level_xp then p.level + 1 else p.level end,
    next_level_xp = case when v_new_xp >= p.next_level_xp then p.next_level_xp + (p.level + 1) * 500 else p.next_level_xp end
  where p.id = p_user_id returning p.* into v_profile;
  perform private.write_audit(
    'profile.value_awarded','profile',p_user_id::text,
    jsonb_build_object('xp_delta',p_xp_delta,'credits_delta',p_credits_delta)
  );
  return v_profile;
end;
$$;

-- The canonical ledger stores signed amounts (credit > 0, debit/hold < 0).
-- Preserve the existing self/admin authorization while correcting the old
-- double-negation formula.
create or replace function public.get_wallet_balance(
  p_user_id uuid,
  p_currency text default 'CREDITS'
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_user_id = auth.uid() or public.is_admin() then
      coalesce((
        select sum(wt.amount)
        from public.wallet_transactions wt
        where wt.user_id = p_user_id
          and upper(wt.currency) = upper(left(p_currency, 12))
      ), 0)
    else null
  end;
$$;

-- Remove both legacy overload orders. They were browser-callable and did not
-- identify a target when invoked with a service-role token.
drop function if exists public.insert_wallet_transaction(text,numeric,text,text);
drop function if exists public.insert_wallet_transaction(numeric,text,text,text);

create or replace function public.insert_wallet_transaction(
  p_user_id uuid,
  p_type text,
  p_amount numeric,
  p_currency text,
  p_reference text,
  p_idempotency_key text
)
returns public.wallet_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tx public.wallet_transactions;
  v_balance numeric;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Trusted server credential required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if p_amount = 0 or abs(p_amount) > 1000000000 then raise exception 'Invalid amount' using errcode = '22003'; end if;
  if p_type not in ('credit','debit','escrow_hold','escrow_release') then
    raise exception 'Invalid transaction type' using errcode = '22023';
  end if;
  if p_type in ('debit','escrow_hold') and p_amount >= 0 then raise exception 'Debit amounts must be negative' using errcode = '22023'; end if;
  if p_type in ('credit','escrow_release','refund') and p_amount <= 0 then raise exception 'Credit amounts must be positive' using errcode = '22023'; end if;
  if nullif(trim(p_currency), '') is null then raise exception 'Currency is required' using errcode = '22023'; end if;
  if nullif(trim(p_idempotency_key), '') is null then raise exception 'Idempotency key is required' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || upper(p_currency), 0));
  select coalesce(sum(t.amount),0) into v_balance
  from public.wallet_transactions t
  where t.user_id=p_user_id and t.currency=upper(left(p_currency,12));
  if p_amount < 0 and v_balance + p_amount < 0 then raise exception 'Insufficient balance' using errcode = '22003'; end if;

  select t.* into v_tx from public.wallet_transactions t
  where t.user_id=p_user_id and t.idempotency_key=left(p_idempotency_key,200);
  if v_tx.id is not null then return v_tx; end if;

  insert into public.wallet_transactions(user_id,type,amount,currency,reference,idempotency_key,created_by)
  values (p_user_id,p_type,p_amount,upper(left(p_currency,12)),left(p_reference,200),left(p_idempotency_key,200),auth.uid())
  returning * into v_tx;
  perform private.write_audit('wallet.transaction_created','wallet_transaction',v_tx.id::text,to_jsonb(v_tx));
  return v_tx;
end;
$$;

create or replace function public.create_conversation(
  p_member_ids uuid[],
  p_title text default null,
  p_is_group boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current uuid := auth.uid();
  v_members uuid[];
  v_other uuid;
  v_direct_key text;
  v_conversation_id uuid;
begin
  if v_current is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select coalesce(array_agg(distinct member_id), '{}') into v_members
  from unnest(coalesce(p_member_ids, '{}')) member_id
  where member_id is not null and member_id <> v_current;
  if cardinality(v_members) = 0 then raise exception 'At least one other member is required' using errcode = '22023'; end if;
  if cardinality(v_members) > 49 then raise exception 'Conversation member limit exceeded' using errcode = '54000'; end if;
  if exists (select 1 from unnest(v_members) m where not exists (select 1 from public.profiles p where p.id = m)) then
    raise exception 'Unknown conversation member' using errcode = '23503';
  end if;
  if exists (select 1 from unnest(v_members) m where private.users_are_blocked(v_current, m)) then
    raise exception 'A blocked relationship prevents this conversation' using errcode = '42501';
  end if;

  if not p_is_group then
    if cardinality(v_members) <> 1 then raise exception 'A direct conversation has exactly two members' using errcode = '22023'; end if;
    v_other := v_members[1];
    v_direct_key := least(v_current::text, v_other::text) || ':' || greatest(v_current::text, v_other::text);
    insert into public.conversations(is_group,title,created_by,direct_key)
    values (false,null,v_current,v_direct_key)
    on conflict (direct_key) where is_group = false and direct_key is not null
    do update set updated_at = now()
    returning id into v_conversation_id;
  else
    if nullif(trim(p_title), '') is null then raise exception 'A group title is required' using errcode = '22023'; end if;
    insert into public.conversations(is_group,title,created_by)
    values (true,left(trim(p_title),160),v_current)
    returning id into v_conversation_id;
  end if;

  insert into public.conversation_participants(conversation_id,user_id,member_role)
  values (v_conversation_id,v_current,'owner')
  on conflict (conversation_id,user_id) do nothing;
  insert into public.conversation_participants(conversation_id,user_id,member_role)
  select v_conversation_id,m,'member' from unnest(v_members) m
  on conflict (conversation_id,user_id) do nothing;
  perform private.write_audit('conversation.created','conversation',v_conversation_id::text,jsonb_build_object('group',p_is_group));
  return v_conversation_id;
end;
$$;

create or replace function public.add_conversation_member(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.can_manage_conversation(p_conversation_id) then raise exception 'Conversation manager role required' using errcode = '42501'; end if;
  if not exists (select 1 from public.conversations c where c.id=p_conversation_id and c.is_group) then
    raise exception 'Members can only be added to a group' using errcode = '22023';
  end if;
  if private.users_are_blocked(auth.uid(),p_user_id) then raise exception 'A blocked relationship prevents membership' using errcode = '42501'; end if;
  insert into public.conversation_participants(conversation_id,user_id)
  values (p_conversation_id,p_user_id)
  on conflict (conversation_id,user_id) do nothing;
  perform private.write_audit('conversation.member_added','conversation',p_conversation_id::text,jsonb_build_object('user_id',p_user_id));
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare v_now timestamptz := now();
begin
  update public.conversation_participants cp
  set last_read_at = v_now
  where cp.conversation_id = p_conversation_id and cp.user_id = auth.uid();
  if not found then raise exception 'Conversation membership required' using errcode = '42501'; end if;
  return v_now;
end;
$$;

create or replace function public.set_user_presence(
  p_status text,
  p_device_id text default null
)
returns public.user_presence
language plpgsql
security definer
set search_path = ''
as $$
declare v_presence public.user_presence;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_status not in ('online','away','busy','offline') then raise exception 'Invalid presence status' using errcode = '22023'; end if;
  insert into public.user_presence(user_id,status,device_id,last_seen_at)
  values (auth.uid(),p_status,left(p_device_id,200),now())
  on conflict (user_id) do update
    set status=excluded.status,device_id=excluded.device_id,last_seen_at=excluded.last_seen_at
  returning * into v_presence;
  return v_presence;
end;
$$;

create or replace function public.admin_update_abuse_report(
  p_report_id uuid,
  p_status text,
  p_resolution text default null
)
returns public.abuse_reports
language plpgsql
security definer
set search_path = ''
as $$
declare v_report public.abuse_reports;
begin
  if not private.is_moderator() then raise exception 'Moderator role required' using errcode = '42501'; end if;
  if p_status not in ('open','in_review','resolved','dismissed') then raise exception 'Invalid report status' using errcode = '22023'; end if;
  update public.abuse_reports r
  set status=p_status,resolution=left(p_resolution,4000),assigned_to=auth.uid()
  where r.id=p_report_id returning * into v_report;
  if v_report.id is null then raise exception 'Report not found' using errcode = 'P0002'; end if;
  perform private.write_audit('abuse_report.updated','abuse_report',p_report_id::text,jsonb_build_object('status',p_status));
  return v_report;
end;
$$;

commit;
