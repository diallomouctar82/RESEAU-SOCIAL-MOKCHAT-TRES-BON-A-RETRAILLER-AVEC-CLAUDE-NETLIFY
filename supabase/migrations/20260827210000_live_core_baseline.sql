-- Le Monde à Vous / MokChat
-- Reproducible baseline for the live Supabase core contract observed on 2026-08-27.
-- This file is intentionally additive: it never drops production data.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  title text,
  role text not null default 'user'
    check (role in ('user','admin','expert','mentor','moderator','organization','super_admin')),
  citizenship_id text,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  next_level_xp integer not null default 1000 check (next_level_xp > 0),
  credits numeric not null default 0 check (credits >= 0),
  avatar_url text,
  preferred_language text not null default 'fr',
  two_factor_enabled boolean not null default false,
  interests text[] not null default '{}',
  bio text,
  country text,
  city text,
  phone text,
  website text,
  privacy_settings jsonb not null default '{"profileVisibility":"network","allowMessagesFrom":"network","showOnlineStatus":true}'::jsonb,
  is_verified boolean not null default false,
  followers_count integer not null default 0 check (followers_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  unique (profile_id, name)
);

create table if not exists public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null,
  name text not null,
  icon text,
  description text,
  earned_at timestamptz not null default now(),
  unique (profile_id, badge_key)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  visibility text not null default 'public' check (visibility in ('public','network','private')),
  shares_count integer not null default 0 check (shares_count >= 0),
  media_bucket text,
  media_path text,
  media_type text,
  media_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_documents (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  name text not null,
  url text,
  bucket_id text,
  object_path text,
  size bigint check (size is null or size >= 0),
  type text,
  page_count integer check (page_count is null or page_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like','love','celebrate','insightful','support','fire')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_url text,
  media_bucket text,
  media_path text,
  media_type text,
  visibility text not null default 'network' check (visibility in ('public','network','private')),
  caption text,
  is_live boolean not null default false,
  viewers_count integer not null default 0 check (viewers_count >= 0),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  direct_key text,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner','admin','member')),
  is_muted boolean not null default false,
  is_pinned boolean not null default false,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  client_message_id uuid not null default gen_random_uuid(),
  content text not null,
  message_type text not null default 'text'
    check (message_type in ('text','system')),
  status text not null default 'sent' check (status in ('sending','sent','delivered','read','failed')),
  attachment_url text,
  metadata jsonb not null default '{}'::jsonb,
  reply_to_id uuid references public.messages(id) on delete set null,
  is_pinned boolean not null default false,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deleted_at is not null or nullif(trim(content), '') is not null),
  unique (sender_id, client_message_id)
);

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 32),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, reaction)
);

create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'offline' check (status in ('online','away','busy','offline')),
  device_id text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  category text not null check (category in ('spam','harassment','hate','fraud','nudity','violence','impersonation','other')),
  description text,
  status text not null default 'open' check (status in ('open','in_review','resolved','dismissed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (target_user_id is not null or conversation_id is not null or message_id is not null or post_id is not null)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text not null,
  priority text default 'normal',
  target_action text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount numeric not null,
  currency text not null default 'CREDITS',
  reference text,
  idempotency_key text,
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

commit;
