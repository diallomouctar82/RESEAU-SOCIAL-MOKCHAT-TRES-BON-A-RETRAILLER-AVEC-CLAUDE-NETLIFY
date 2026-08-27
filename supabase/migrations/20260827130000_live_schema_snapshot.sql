-- AUTO-GENERATED DECLARATIVE SNAPSHOT (read-only introspection, 2026-08-27)
-- Source project: rqciahtpixdjbyoajomg
-- Scope: all 58 live tables in public, constraints, indexes, public functions,
-- user triggers (including auth.users profile trigger), RLS, policies and grants.
-- No production data or secret is included.
--
-- This snapshot is deliberately idempotent so it can be applied to the live
-- project without replacing data. Later migrations in this directory harden
-- the vulnerable legacy policies and extend the MokChat contract.

begin;

create extension if not exists pgcrypto;

-- Tables
create table if not exists public.agent_chat_messages (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  role text not null,
  content text not null,
  image_urls text[],
  created_at timestamp with time zone default now() not null
);

create table if not exists public.agent_chat_sessions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  agent_id text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.agents (
  id text not null,
  name text not null,
  role text not null,
  description text,
  avatar_url text,
  is_human boolean default false not null,
  hourly_rate numeric,
  experience_years integer,
  bio text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.career_goals (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  archetype text,
  point_a jsonb,
  point_b jsonb,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.career_opportunities (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  organization text,
  universe text,
  match_score integer,
  status text default 'new'::text not null,
  vault_status text,
  is_favorite boolean default false not null,
  source text,
  raw jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.career_opportunity_feedback (
  id uuid default gen_random_uuid() not null,
  opportunity_id uuid not null,
  user_id uuid not null,
  feedback_type text,
  decline_reason text,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.career_search_missions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text not null,
  criteria jsonb,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.career_snapshots (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  kind text not null,
  payload jsonb not null,
  generated_at timestamp with time zone default now() not null
);

create table if not exists public.certificates (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  course_id uuid not null,
  enrollment_id uuid,
  certificate_url text,
  issued_at timestamp with time zone default now() not null
);

create table if not exists public.comments (
  id uuid default gen_random_uuid() not null,
  post_id uuid not null,
  author_id uuid not null,
  parent_comment_id uuid,
  content text not null,
  likes_count integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.conversation_participants (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  user_id uuid not null,
  joined_at timestamp with time zone default now() not null,
  last_read_at timestamp with time zone
);

create table if not exists public.conversations (
  id uuid default gen_random_uuid() not null,
  is_group boolean default false not null,
  title text,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.courses (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  category text,
  academic_level text,
  country_code text,
  duration_minutes integer,
  thumbnail_url text,
  is_published boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.document_shares (
  id uuid default gen_random_uuid() not null,
  document_id uuid not null,
  shared_with_user_id uuid not null,
  permission text default 'read'::text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.documents (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  name text not null,
  category text,
  storage_path text not null,
  file_size bigint,
  mime_type text,
  visibility text default 'private'::text not null,
  expiry_date timestamp with time zone,
  is_verified boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossier_appointments (
  id uuid default gen_random_uuid() not null,
  dossier_id uuid not null,
  title text not null,
  scheduled_at timestamp with time zone not null,
  location text,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossier_deliverables (
  id uuid default gen_random_uuid() not null,
  dossier_id uuid not null,
  title text not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossier_documents (
  id uuid default gen_random_uuid() not null,
  dossier_id uuid not null,
  name text not null,
  storage_path text,
  url text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossier_shares (
  id uuid default gen_random_uuid() not null,
  dossier_id uuid not null,
  shared_with_user_id uuid not null,
  permission text default 'read'::text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossier_steps (
  id uuid default gen_random_uuid() not null,
  dossier_id uuid not null,
  title text not null,
  status text default 'pending'::text not null,
  "position" integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossier_tasks (
  id uuid default gen_random_uuid() not null,
  dossier_id uuid not null,
  step_id uuid,
  title text not null,
  completed boolean default false not null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.dossiers (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  title text not null,
  objective text,
  category text,
  lead_agent_id text,
  collaborator_agent_ids text[] default '{}'::text[] not null,
  status text default 'active'::text not null,
  blockers text,
  plan_b text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.enrollments (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  course_id uuid not null,
  progress_percent integer default 0 not null,
  lesson_progress jsonb default '{}'::jsonb not null,
  status text default 'in_progress'::text not null,
  enrolled_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);

create table if not exists public.exam_sessions (
  id uuid default gen_random_uuid() not null,
  enrollment_id uuid not null,
  score numeric,
  passed boolean,
  answers jsonb,
  taken_at timestamp with time zone default now() not null
);

create table if not exists public.gift_catalog (
  id text not null,
  name text not null,
  icon text,
  cost numeric not null,
  animation text,
  is_active boolean default true not null
);

create table if not exists public.live_action_items (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  title text not null,
  category text not null,
  assigned_to text,
  deadline timestamp with time zone,
  completed boolean default false not null,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_agenda_items (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  title text not null,
  duration_minutes integer default 0 not null,
  presenter text,
  completed boolean default false not null,
  "position" integer default 0 not null
);

create table if not exists public.live_attendance (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  participant_id uuid not null,
  name text,
  joined_at timestamp with time zone default now() not null,
  duration_minutes integer default 0 not null,
  exercises_done integer default 0 not null,
  quiz_score integer,
  competence_validated boolean default false not null
);

create table if not exists public.live_decisions (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  text text not null,
  agreed_by text[] default '{}'::text[] not null,
  category text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_documents (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  name text not null,
  url text not null,
  type text,
  size text,
  uploaded_by text,
  page_count integer,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_gifts_sent (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  sender_id uuid not null,
  gift_id text not null,
  quantity integer default 1 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_personal_notes (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  user_id uuid not null,
  text text not null,
  category text default 'general'::text not null,
  target_module text,
  reminder_date timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_poll_options (
  id uuid default gen_random_uuid() not null,
  poll_id uuid not null,
  text text not null,
  votes_count integer default 0 not null
);

create table if not exists public.live_poll_votes (
  poll_id uuid not null,
  option_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_polls (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  question text not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_products (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  name text not null,
  description text,
  price numeric,
  currency text,
  country text,
  country_flag text,
  availability text,
  seller_name text,
  seller_avatar text,
  image_url text,
  category text,
  has_trade_assistance boolean default false
);

create table if not exists public.live_question_upvotes (
  question_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_questions (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  author_id uuid,
  author_name text,
  author_avatar text,
  text text not null,
  upvotes_count integer default 0 not null,
  status text default 'open'::text not null,
  category text,
  ai_group_key text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_replays (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  title text not null,
  duration_seconds integer default 0 not null,
  host_name text,
  host_avatar text,
  video_url text,
  category text,
  chapters jsonb default '[]'::jsonb not null,
  transcript jsonb default '[]'::jsonb not null,
  summary text,
  key_takeaways text[] default '{}'::text[] not null,
  resources jsonb default '[]'::jsonb not null,
  campus_ready boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_sessions (
  id uuid default gen_random_uuid() not null,
  host_id uuid not null,
  title text not null,
  description text,
  type text,
  host_name text,
  host_avatar text,
  viewers_count integer default 0 not null,
  is_mixed boolean default false not null,
  ai_assistant_id text,
  started_at timestamp with time zone,
  scheduled_for timestamp with time zone,
  timezone text,
  is_scheduled boolean default false not null,
  duration_minutes integer default 0 not null,
  ended_at timestamp with time zone,
  is_paid boolean default false not null,
  pricing jsonb,
  donation_goal jsonb,
  tags text[] default '{}'::text[] not null,
  language text,
  target_language text,
  cover_image text,
  is_private boolean default false not null,
  allowed_member_ids uuid[] default '{}'::uuid[] not null,
  tribe_id text,
  tribe_name text,
  expert_id text,
  is_recording_enabled boolean default false not null,
  is_translation_enabled boolean default false not null,
  is_questions_enabled boolean default true not null,
  is_screen_share_enabled boolean default true not null,
  is_vision_enabled boolean default false not null,
  is_data_saver boolean default false not null,
  quality_mode text default 'auto'::text,
  dossier_id uuid,
  dossier_title text,
  is_waiting_room_enabled boolean default false not null,
  course_module_id text,
  interview_guest_name text,
  interview_guest_bio text,
  conf_tracks text[] default '{}'::text[] not null,
  sensitive_data_alert boolean default false not null,
  meeting_minutes jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.live_source_cards (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  statement text not null,
  organization text,
  document_name text,
  card_date text,
  reference_url text,
  verified_status text,
  analysis text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.live_speakers (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  user_id uuid,
  agent_id text,
  name text not null,
  avatar text,
  role text not null,
  is_muted boolean default false not null,
  is_video_on boolean default true not null,
  is_ai boolean default false not null,
  is_verified boolean default false not null,
  specialty text,
  is_screen_sharing boolean default false not null,
  is_hand_raised boolean default false not null,
  joined_at timestamp with time zone default now() not null
);

create table if not exists public.live_whiteboard_strokes (
  id uuid default gen_random_uuid() not null,
  session_id uuid not null,
  author_id uuid,
  tool text not null,
  color text,
  stroke_width numeric,
  points jsonb,
  stroke_text text,
  x numeric,
  y numeric,
  width_box numeric,
  height_box numeric,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.master_resumes (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  content jsonb not null,
  version integer default 1 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() not null,
  conversation_id uuid not null,
  sender_id uuid not null,
  content text default ''::text not null,
  attachment_url text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  type text default 'info'::text not null,
  title text not null,
  message text not null,
  priority text default 'normal'::text,
  target_action text,
  read boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  product_id uuid not null,
  quantity integer default 1 not null,
  unit_price numeric not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.orders (
  id uuid default gen_random_uuid() not null,
  buyer_id uuid not null,
  seller_id uuid,
  status text default 'pending'::text not null,
  total_amount numeric default 0 not null,
  currency text default 'EUR'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.post_documents (
  id uuid default gen_random_uuid() not null,
  post_id uuid not null,
  name text not null,
  url text not null,
  size bigint,
  type text,
  page_count integer,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.post_reactions (
  id uuid default gen_random_uuid() not null,
  post_id uuid not null,
  user_id uuid not null,
  type text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.posts (
  id uuid default gen_random_uuid() not null,
  author_id uuid not null,
  content text default ''::text not null,
  visibility text default 'public'::text not null,
  shares_count integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.products (
  id uuid default gen_random_uuid() not null,
  shop_id uuid,
  seller_id uuid,
  title text not null,
  description text,
  price numeric default 0 not null,
  currency text default 'EUR'::text not null,
  category text,
  image_url text,
  rating numeric default 0,
  reviews_count integer default 0,
  seller_country text,
  seller_flag text,
  seller_verified boolean default false,
  dimension_type text,
  min_order_quantity integer,
  unit text,
  stock_available integer,
  origin_country text,
  lead_time_days integer,
  shipping_available boolean default false,
  is_service boolean default false,
  service_details jsonb,
  linked_reel_id text,
  linked_live_id uuid,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.profile_badges (
  id uuid default gen_random_uuid() not null,
  profile_id uuid not null,
  badge_key text not null,
  name text not null,
  icon text,
  description text,
  earned_at timestamp with time zone default now() not null
);

create table if not exists public.profile_skills (
  id uuid default gen_random_uuid() not null,
  profile_id uuid not null,
  name text not null,
  progress integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.profiles (
  id uuid not null,
  email text not null,
  name text default ''::text not null,
  title text,
  role text default 'user'::text not null,
  citizenship_id text,
  level integer default 1 not null,
  xp integer default 0 not null,
  next_level_xp integer default 1000 not null,
  credits numeric default 0 not null,
  avatar_url text,
  preferred_language text default 'fr'::text not null,
  two_factor_enabled boolean default false not null,
  interests text[] default '{}'::text[] not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.shops (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  name text not null,
  description text,
  banner_url text,
  revenue numeric default 0 not null,
  sales_count integer default 0 not null,
  ai_config jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.stories (
  id uuid default gen_random_uuid() not null,
  author_id uuid not null,
  media_url text not null,
  caption text,
  is_live boolean default false not null,
  viewers_count integer default 0 not null,
  expires_at timestamp with time zone default (now() + '24:00:00'::interval) not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.wallet_transactions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  type text not null,
  amount numeric not null,
  currency text default 'Credits'::text not null,
  reference text,
  created_at timestamp with time zone default now() not null
);

-- Constraints (created only when absent)
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_messages_pkey' and conrelid='public.agent_chat_messages'::regclass) then alter table public.agent_chat_messages add constraint agent_chat_messages_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_sessions_pkey' and conrelid='public.agent_chat_sessions'::regclass) then alter table public.agent_chat_sessions add constraint agent_chat_sessions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agents_pkey' and conrelid='public.agents'::regclass) then alter table public.agents add constraint agents_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_goals_pkey' and conrelid='public.career_goals'::regclass) then alter table public.career_goals add constraint career_goals_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_opportunities_pkey' and conrelid='public.career_opportunities'::regclass) then alter table public.career_opportunities add constraint career_opportunities_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_opportunity_feedback_pkey' and conrelid='public.career_opportunity_feedback'::regclass) then alter table public.career_opportunity_feedback add constraint career_opportunity_feedback_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_search_missions_pkey' and conrelid='public.career_search_missions'::regclass) then alter table public.career_search_missions add constraint career_search_missions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_snapshots_pkey' and conrelid='public.career_snapshots'::regclass) then alter table public.career_snapshots add constraint career_snapshots_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='certificates_pkey' and conrelid='public.certificates'::regclass) then alter table public.certificates add constraint certificates_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='comments_pkey' and conrelid='public.comments'::regclass) then alter table public.comments add constraint comments_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='conversation_participants_pkey' and conrelid='public.conversation_participants'::regclass) then alter table public.conversation_participants add constraint conversation_participants_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='conversations_pkey' and conrelid='public.conversations'::regclass) then alter table public.conversations add constraint conversations_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='courses_pkey' and conrelid='public.courses'::regclass) then alter table public.courses add constraint courses_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='document_shares_pkey' and conrelid='public.document_shares'::regclass) then alter table public.document_shares add constraint document_shares_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='documents_pkey' and conrelid='public.documents'::regclass) then alter table public.documents add constraint documents_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_appointments_pkey' and conrelid='public.dossier_appointments'::regclass) then alter table public.dossier_appointments add constraint dossier_appointments_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_deliverables_pkey' and conrelid='public.dossier_deliverables'::regclass) then alter table public.dossier_deliverables add constraint dossier_deliverables_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_documents_pkey' and conrelid='public.dossier_documents'::regclass) then alter table public.dossier_documents add constraint dossier_documents_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_shares_pkey' and conrelid='public.dossier_shares'::regclass) then alter table public.dossier_shares add constraint dossier_shares_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_steps_pkey' and conrelid='public.dossier_steps'::regclass) then alter table public.dossier_steps add constraint dossier_steps_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_tasks_pkey' and conrelid='public.dossier_tasks'::regclass) then alter table public.dossier_tasks add constraint dossier_tasks_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossiers_pkey' and conrelid='public.dossiers'::regclass) then alter table public.dossiers add constraint dossiers_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='enrollments_pkey' and conrelid='public.enrollments'::regclass) then alter table public.enrollments add constraint enrollments_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='exam_sessions_pkey' and conrelid='public.exam_sessions'::regclass) then alter table public.exam_sessions add constraint exam_sessions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='gift_catalog_pkey' and conrelid='public.gift_catalog'::regclass) then alter table public.gift_catalog add constraint gift_catalog_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_action_items_pkey' and conrelid='public.live_action_items'::regclass) then alter table public.live_action_items add constraint live_action_items_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_agenda_items_pkey' and conrelid='public.live_agenda_items'::regclass) then alter table public.live_agenda_items add constraint live_agenda_items_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_attendance_pkey' and conrelid='public.live_attendance'::regclass) then alter table public.live_attendance add constraint live_attendance_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_decisions_pkey' and conrelid='public.live_decisions'::regclass) then alter table public.live_decisions add constraint live_decisions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_documents_pkey' and conrelid='public.live_documents'::regclass) then alter table public.live_documents add constraint live_documents_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_gifts_sent_pkey' and conrelid='public.live_gifts_sent'::regclass) then alter table public.live_gifts_sent add constraint live_gifts_sent_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_personal_notes_pkey' and conrelid='public.live_personal_notes'::regclass) then alter table public.live_personal_notes add constraint live_personal_notes_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_poll_options_pkey' and conrelid='public.live_poll_options'::regclass) then alter table public.live_poll_options add constraint live_poll_options_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_poll_votes_pkey' and conrelid='public.live_poll_votes'::regclass) then alter table public.live_poll_votes add constraint live_poll_votes_pkey PRIMARY KEY (poll_id, user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_polls_pkey' and conrelid='public.live_polls'::regclass) then alter table public.live_polls add constraint live_polls_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_products_pkey' and conrelid='public.live_products'::regclass) then alter table public.live_products add constraint live_products_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_question_upvotes_pkey' and conrelid='public.live_question_upvotes'::regclass) then alter table public.live_question_upvotes add constraint live_question_upvotes_pkey PRIMARY KEY (question_id, user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_questions_pkey' and conrelid='public.live_questions'::regclass) then alter table public.live_questions add constraint live_questions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_replays_pkey' and conrelid='public.live_replays'::regclass) then alter table public.live_replays add constraint live_replays_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_sessions_pkey' and conrelid='public.live_sessions'::regclass) then alter table public.live_sessions add constraint live_sessions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_source_cards_pkey' and conrelid='public.live_source_cards'::regclass) then alter table public.live_source_cards add constraint live_source_cards_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_speakers_pkey' and conrelid='public.live_speakers'::regclass) then alter table public.live_speakers add constraint live_speakers_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_whiteboard_strokes_pkey' and conrelid='public.live_whiteboard_strokes'::regclass) then alter table public.live_whiteboard_strokes add constraint live_whiteboard_strokes_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='master_resumes_pkey' and conrelid='public.master_resumes'::regclass) then alter table public.master_resumes add constraint master_resumes_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='messages_pkey' and conrelid='public.messages'::regclass) then alter table public.messages add constraint messages_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='notifications_pkey' and conrelid='public.notifications'::regclass) then alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='order_items_pkey' and conrelid='public.order_items'::regclass) then alter table public.order_items add constraint order_items_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='orders_pkey' and conrelid='public.orders'::regclass) then alter table public.orders add constraint orders_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='post_documents_pkey' and conrelid='public.post_documents'::regclass) then alter table public.post_documents add constraint post_documents_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='post_reactions_pkey' and conrelid='public.post_reactions'::regclass) then alter table public.post_reactions add constraint post_reactions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='posts_pkey' and conrelid='public.posts'::regclass) then alter table public.posts add constraint posts_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='products_pkey' and conrelid='public.products'::regclass) then alter table public.products add constraint products_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profile_badges_pkey' and conrelid='public.profile_badges'::regclass) then alter table public.profile_badges add constraint profile_badges_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profile_skills_pkey' and conrelid='public.profile_skills'::regclass) then alter table public.profile_skills add constraint profile_skills_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profiles_pkey' and conrelid='public.profiles'::regclass) then alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='shops_pkey' and conrelid='public.shops'::regclass) then alter table public.shops add constraint shops_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='stories_pkey' and conrelid='public.stories'::regclass) then alter table public.stories add constraint stories_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='wallet_transactions_pkey' and conrelid='public.wallet_transactions'::regclass) then alter table public.wallet_transactions add constraint wallet_transactions_pkey PRIMARY KEY (id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_sessions_user_id_agent_id_key' and conrelid='public.agent_chat_sessions'::regclass) then alter table public.agent_chat_sessions add constraint agent_chat_sessions_user_id_agent_id_key UNIQUE (user_id, agent_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='conversation_participants_conversation_id_user_id_key' and conrelid='public.conversation_participants'::regclass) then alter table public.conversation_participants add constraint conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='document_shares_document_id_shared_with_user_id_key' and conrelid='public.document_shares'::regclass) then alter table public.document_shares add constraint document_shares_document_id_shared_with_user_id_key UNIQUE (document_id, shared_with_user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_shares_dossier_id_shared_with_user_id_key' and conrelid='public.dossier_shares'::regclass) then alter table public.dossier_shares add constraint dossier_shares_dossier_id_shared_with_user_id_key UNIQUE (dossier_id, shared_with_user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='enrollments_user_id_course_id_key' and conrelid='public.enrollments'::regclass) then alter table public.enrollments add constraint enrollments_user_id_course_id_key UNIQUE (user_id, course_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_attendance_session_id_participant_id_key' and conrelid='public.live_attendance'::regclass) then alter table public.live_attendance add constraint live_attendance_session_id_participant_id_key UNIQUE (session_id, participant_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='master_resumes_user_id_key' and conrelid='public.master_resumes'::regclass) then alter table public.master_resumes add constraint master_resumes_user_id_key UNIQUE (user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='post_reactions_post_id_user_id_key' and conrelid='public.post_reactions'::regclass) then alter table public.post_reactions add constraint post_reactions_post_id_user_id_key UNIQUE (post_id, user_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profile_badges_profile_id_badge_key_key' and conrelid='public.profile_badges'::regclass) then alter table public.profile_badges add constraint profile_badges_profile_id_badge_key_key UNIQUE (profile_id, badge_key); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='shops_owner_id_key' and conrelid='public.shops'::regclass) then alter table public.shops add constraint shops_owner_id_key UNIQUE (owner_id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_messages_role_check' and conrelid='public.agent_chat_messages'::regclass) then alter table public.agent_chat_messages add constraint agent_chat_messages_role_check CHECK (role = ANY (ARRAY['user'::text, 'model'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='document_shares_permission_check' and conrelid='public.document_shares'::regclass) then alter table public.document_shares add constraint document_shares_permission_check CHECK (permission = ANY (ARRAY['read'::text, 'write'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='documents_visibility_check' and conrelid='public.documents'::regclass) then alter table public.documents add constraint documents_visibility_check CHECK (visibility = ANY (ARRAY['private'::text, 'shared'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_shares_permission_check' and conrelid='public.dossier_shares'::regclass) then alter table public.dossier_shares add constraint dossier_shares_permission_check CHECK (permission = ANY (ARRAY['read'::text, 'write'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='enrollments_progress_percent_check' and conrelid='public.enrollments'::regclass) then alter table public.enrollments add constraint enrollments_progress_percent_check CHECK (progress_percent >= 0 AND progress_percent <= 100); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='enrollments_status_check' and conrelid='public.enrollments'::regclass) then alter table public.enrollments add constraint enrollments_status_check CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_action_items_category_check' and conrelid='public.live_action_items'::regclass) then alter table public.live_action_items add constraint live_action_items_category_check CHECK (category = ANY (ARRAY['projet'::text, 'juridique'::text, 'finance'::text, 'formation'::text, 'action'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_documents_type_check' and conrelid='public.live_documents'::regclass) then alter table public.live_documents add constraint live_documents_type_check CHECK (type = ANY (ARRAY['pdf'::text, 'doc'::text, 'image'::text, 'slide'::text, 'sheet'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_personal_notes_category_check' and conrelid='public.live_personal_notes'::regclass) then alter table public.live_personal_notes add constraint live_personal_notes_category_check CHECK (category = ANY (ARRAY['reminder'::text, 'task'::text, 'project'::text, 'learning'::text, 'general'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_products_availability_check' and conrelid='public.live_products'::regclass) then alter table public.live_products add constraint live_products_availability_check CHECK (availability = ANY (ARRAY['in_stock'::text, 'preorder'::text, 'limited'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_questions_status_check' and conrelid='public.live_questions'::regclass) then alter table public.live_questions add constraint live_questions_status_check CHECK (status = ANY (ARRAY['open'::text, 'answering'::text, 'answered'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_sessions_quality_mode_check' and conrelid='public.live_sessions'::regclass) then alter table public.live_sessions add constraint live_sessions_quality_mode_check CHECK (quality_mode = ANY (ARRAY['auto'::text, 'hd'::text, 'sd'::text, 'eco_audio'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_source_cards_verified_status_check' and conrelid='public.live_source_cards'::regclass) then alter table public.live_source_cards add constraint live_source_cards_verified_status_check CHECK (verified_status = ANY (ARRAY['confirmed'::text, 'uncertain'::text, 'contradictory'::text, 'insufficient'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_speakers_role_check' and conrelid='public.live_speakers'::regclass) then alter table public.live_speakers add constraint live_speakers_role_check CHECK (role = ANY (ARRAY['host'::text, 'cohost'::text, 'guest'::text, 'expert_ai'::text, 'expert_human'::text, 'speaker'::text, 'secretary_ai'::text, 'moderator_ai'::text, 'director_ai'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_whiteboard_strokes_tool_check' and conrelid='public.live_whiteboard_strokes'::regclass) then alter table public.live_whiteboard_strokes add constraint live_whiteboard_strokes_tool_check CHECK (tool = ANY (ARRAY['pen'::text, 'rect'::text, 'circle'::text, 'text'::text, 'note'::text, 'arrow'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='notifications_type_check' and conrelid='public.notifications'::regclass) then alter table public.notifications add constraint notifications_type_check CHECK (type = ANY (ARRAY['success'::text, 'info'::text, 'warning'::text, 'alert'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='orders_status_check' and conrelid='public.orders'::regclass) then alter table public.orders add constraint orders_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='posts_visibility_check' and conrelid='public.posts'::regclass) then alter table public.posts add constraint posts_visibility_check CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='products_category_check' and conrelid='public.products'::regclass) then alter table public.products add constraint products_category_check CHECK (category = ANY (ARRAY['Digital'::text, 'Service'::text, 'Physique'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='products_dimension_type_check' and conrelid='public.products'::regclass) then alter table public.products add constraint products_dimension_type_check CHECK (dimension_type = ANY (ARRAY['B2C'::text, 'B2B'::text, 'C2C'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profile_skills_progress_check' and conrelid='public.profile_skills'::regclass) then alter table public.profile_skills add constraint profile_skills_progress_check CHECK (progress >= 0 AND progress <= 100); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profiles_role_check' and conrelid='public.profiles'::regclass) then alter table public.profiles add constraint profiles_role_check CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'expert'::text, 'mentor'::text, 'moderator'::text, 'organization'::text, 'super_admin'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='wallet_transactions_type_check' and conrelid='public.wallet_transactions'::regclass) then alter table public.wallet_transactions add constraint wallet_transactions_type_check CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text, 'escrow_hold'::text, 'escrow_release'::text])); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_messages_session_id_fkey' and conrelid='public.agent_chat_messages'::regclass) then alter table public.agent_chat_messages add constraint agent_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES agent_chat_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_sessions_agent_id_fkey' and conrelid='public.agent_chat_sessions'::regclass) then alter table public.agent_chat_sessions add constraint agent_chat_sessions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='agent_chat_sessions_user_id_fkey' and conrelid='public.agent_chat_sessions'::regclass) then alter table public.agent_chat_sessions add constraint agent_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_goals_user_id_fkey' and conrelid='public.career_goals'::regclass) then alter table public.career_goals add constraint career_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_opportunities_user_id_fkey' and conrelid='public.career_opportunities'::regclass) then alter table public.career_opportunities add constraint career_opportunities_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_opportunity_feedback_opportunity_id_fkey' and conrelid='public.career_opportunity_feedback'::regclass) then alter table public.career_opportunity_feedback add constraint career_opportunity_feedback_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES career_opportunities(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_opportunity_feedback_user_id_fkey' and conrelid='public.career_opportunity_feedback'::regclass) then alter table public.career_opportunity_feedback add constraint career_opportunity_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_search_missions_user_id_fkey' and conrelid='public.career_search_missions'::regclass) then alter table public.career_search_missions add constraint career_search_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='career_snapshots_user_id_fkey' and conrelid='public.career_snapshots'::regclass) then alter table public.career_snapshots add constraint career_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='certificates_course_id_fkey' and conrelid='public.certificates'::regclass) then alter table public.certificates add constraint certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='certificates_enrollment_id_fkey' and conrelid='public.certificates'::regclass) then alter table public.certificates add constraint certificates_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='certificates_user_id_fkey' and conrelid='public.certificates'::regclass) then alter table public.certificates add constraint certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='comments_author_id_fkey' and conrelid='public.comments'::regclass) then alter table public.comments add constraint comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='comments_parent_comment_id_fkey' and conrelid='public.comments'::regclass) then alter table public.comments add constraint comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='comments_post_id_fkey' and conrelid='public.comments'::regclass) then alter table public.comments add constraint comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='conversation_participants_conversation_id_fkey' and conrelid='public.conversation_participants'::regclass) then alter table public.conversation_participants add constraint conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='conversation_participants_user_id_fkey' and conrelid='public.conversation_participants'::regclass) then alter table public.conversation_participants add constraint conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='conversations_created_by_fkey' and conrelid='public.conversations'::regclass) then alter table public.conversations add constraint conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='document_shares_document_id_fkey' and conrelid='public.document_shares'::regclass) then alter table public.document_shares add constraint document_shares_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='document_shares_shared_with_user_id_fkey' and conrelid='public.document_shares'::regclass) then alter table public.document_shares add constraint document_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='documents_owner_id_fkey' and conrelid='public.documents'::regclass) then alter table public.documents add constraint documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_appointments_dossier_id_fkey' and conrelid='public.dossier_appointments'::regclass) then alter table public.dossier_appointments add constraint dossier_appointments_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_deliverables_dossier_id_fkey' and conrelid='public.dossier_deliverables'::regclass) then alter table public.dossier_deliverables add constraint dossier_deliverables_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_documents_dossier_id_fkey' and conrelid='public.dossier_documents'::regclass) then alter table public.dossier_documents add constraint dossier_documents_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_shares_dossier_id_fkey' and conrelid='public.dossier_shares'::regclass) then alter table public.dossier_shares add constraint dossier_shares_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_shares_shared_with_user_id_fkey' and conrelid='public.dossier_shares'::regclass) then alter table public.dossier_shares add constraint dossier_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_steps_dossier_id_fkey' and conrelid='public.dossier_steps'::regclass) then alter table public.dossier_steps add constraint dossier_steps_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_tasks_dossier_id_fkey' and conrelid='public.dossier_tasks'::regclass) then alter table public.dossier_tasks add constraint dossier_tasks_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossier_tasks_step_id_fkey' and conrelid='public.dossier_tasks'::regclass) then alter table public.dossier_tasks add constraint dossier_tasks_step_id_fkey FOREIGN KEY (step_id) REFERENCES dossier_steps(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossiers_lead_agent_id_fkey' and conrelid='public.dossiers'::regclass) then alter table public.dossiers add constraint dossiers_lead_agent_id_fkey FOREIGN KEY (lead_agent_id) REFERENCES agents(id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='dossiers_owner_id_fkey' and conrelid='public.dossiers'::regclass) then alter table public.dossiers add constraint dossiers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='enrollments_course_id_fkey' and conrelid='public.enrollments'::regclass) then alter table public.enrollments add constraint enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='enrollments_user_id_fkey' and conrelid='public.enrollments'::regclass) then alter table public.enrollments add constraint enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='exam_sessions_enrollment_id_fkey' and conrelid='public.exam_sessions'::regclass) then alter table public.exam_sessions add constraint exam_sessions_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_action_items_session_id_fkey' and conrelid='public.live_action_items'::regclass) then alter table public.live_action_items add constraint live_action_items_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_agenda_items_session_id_fkey' and conrelid='public.live_agenda_items'::regclass) then alter table public.live_agenda_items add constraint live_agenda_items_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_attendance_participant_id_fkey' and conrelid='public.live_attendance'::regclass) then alter table public.live_attendance add constraint live_attendance_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_attendance_session_id_fkey' and conrelid='public.live_attendance'::regclass) then alter table public.live_attendance add constraint live_attendance_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_decisions_session_id_fkey' and conrelid='public.live_decisions'::regclass) then alter table public.live_decisions add constraint live_decisions_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_documents_session_id_fkey' and conrelid='public.live_documents'::regclass) then alter table public.live_documents add constraint live_documents_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_gifts_sent_gift_id_fkey' and conrelid='public.live_gifts_sent'::regclass) then alter table public.live_gifts_sent add constraint live_gifts_sent_gift_id_fkey FOREIGN KEY (gift_id) REFERENCES gift_catalog(id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_gifts_sent_sender_id_fkey' and conrelid='public.live_gifts_sent'::regclass) then alter table public.live_gifts_sent add constraint live_gifts_sent_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_gifts_sent_session_id_fkey' and conrelid='public.live_gifts_sent'::regclass) then alter table public.live_gifts_sent add constraint live_gifts_sent_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_personal_notes_session_id_fkey' and conrelid='public.live_personal_notes'::regclass) then alter table public.live_personal_notes add constraint live_personal_notes_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_personal_notes_user_id_fkey' and conrelid='public.live_personal_notes'::regclass) then alter table public.live_personal_notes add constraint live_personal_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_poll_options_poll_id_fkey' and conrelid='public.live_poll_options'::regclass) then alter table public.live_poll_options add constraint live_poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES live_polls(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_poll_votes_option_id_fkey' and conrelid='public.live_poll_votes'::regclass) then alter table public.live_poll_votes add constraint live_poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES live_poll_options(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_poll_votes_poll_id_fkey' and conrelid='public.live_poll_votes'::regclass) then alter table public.live_poll_votes add constraint live_poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES live_polls(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_poll_votes_user_id_fkey' and conrelid='public.live_poll_votes'::regclass) then alter table public.live_poll_votes add constraint live_poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_polls_session_id_fkey' and conrelid='public.live_polls'::regclass) then alter table public.live_polls add constraint live_polls_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_products_session_id_fkey' and conrelid='public.live_products'::regclass) then alter table public.live_products add constraint live_products_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_question_upvotes_question_id_fkey' and conrelid='public.live_question_upvotes'::regclass) then alter table public.live_question_upvotes add constraint live_question_upvotes_question_id_fkey FOREIGN KEY (question_id) REFERENCES live_questions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_question_upvotes_user_id_fkey' and conrelid='public.live_question_upvotes'::regclass) then alter table public.live_question_upvotes add constraint live_question_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_questions_author_id_fkey' and conrelid='public.live_questions'::regclass) then alter table public.live_questions add constraint live_questions_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_questions_session_id_fkey' and conrelid='public.live_questions'::regclass) then alter table public.live_questions add constraint live_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_replays_session_id_fkey' and conrelid='public.live_replays'::regclass) then alter table public.live_replays add constraint live_replays_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_sessions_ai_assistant_id_fkey' and conrelid='public.live_sessions'::regclass) then alter table public.live_sessions add constraint live_sessions_ai_assistant_id_fkey FOREIGN KEY (ai_assistant_id) REFERENCES agents(id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_sessions_dossier_id_fkey' and conrelid='public.live_sessions'::regclass) then alter table public.live_sessions add constraint live_sessions_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_sessions_expert_id_fkey' and conrelid='public.live_sessions'::regclass) then alter table public.live_sessions add constraint live_sessions_expert_id_fkey FOREIGN KEY (expert_id) REFERENCES agents(id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_sessions_host_id_fkey' and conrelid='public.live_sessions'::regclass) then alter table public.live_sessions add constraint live_sessions_host_id_fkey FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_source_cards_session_id_fkey' and conrelid='public.live_source_cards'::regclass) then alter table public.live_source_cards add constraint live_source_cards_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_speakers_agent_id_fkey' and conrelid='public.live_speakers'::regclass) then alter table public.live_speakers add constraint live_speakers_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id); end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_speakers_session_id_fkey' and conrelid='public.live_speakers'::regclass) then alter table public.live_speakers add constraint live_speakers_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_speakers_user_id_fkey' and conrelid='public.live_speakers'::regclass) then alter table public.live_speakers add constraint live_speakers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_whiteboard_strokes_author_id_fkey' and conrelid='public.live_whiteboard_strokes'::regclass) then alter table public.live_whiteboard_strokes add constraint live_whiteboard_strokes_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='live_whiteboard_strokes_session_id_fkey' and conrelid='public.live_whiteboard_strokes'::regclass) then alter table public.live_whiteboard_strokes add constraint live_whiteboard_strokes_session_id_fkey FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='master_resumes_user_id_fkey' and conrelid='public.master_resumes'::regclass) then alter table public.master_resumes add constraint master_resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='messages_conversation_id_fkey' and conrelid='public.messages'::regclass) then alter table public.messages add constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='messages_sender_id_fkey' and conrelid='public.messages'::regclass) then alter table public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='notifications_user_id_fkey' and conrelid='public.notifications'::regclass) then alter table public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='order_items_order_id_fkey' and conrelid='public.order_items'::regclass) then alter table public.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='order_items_product_id_fkey' and conrelid='public.order_items'::regclass) then alter table public.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='orders_buyer_id_fkey' and conrelid='public.orders'::regclass) then alter table public.orders add constraint orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='orders_seller_id_fkey' and conrelid='public.orders'::regclass) then alter table public.orders add constraint orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='post_documents_post_id_fkey' and conrelid='public.post_documents'::regclass) then alter table public.post_documents add constraint post_documents_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='post_reactions_post_id_fkey' and conrelid='public.post_reactions'::regclass) then alter table public.post_reactions add constraint post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='post_reactions_user_id_fkey' and conrelid='public.post_reactions'::regclass) then alter table public.post_reactions add constraint post_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='posts_author_id_fkey' and conrelid='public.posts'::regclass) then alter table public.posts add constraint posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='products_linked_live_id_fkey' and conrelid='public.products'::regclass) then alter table public.products add constraint products_linked_live_id_fkey FOREIGN KEY (linked_live_id) REFERENCES live_sessions(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='products_seller_id_fkey' and conrelid='public.products'::regclass) then alter table public.products add constraint products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE SET NULL; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='products_shop_id_fkey' and conrelid='public.products'::regclass) then alter table public.products add constraint products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profile_badges_profile_id_fkey' and conrelid='public.profile_badges'::regclass) then alter table public.profile_badges add constraint profile_badges_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profile_skills_profile_id_fkey' and conrelid='public.profile_skills'::regclass) then alter table public.profile_skills add constraint profile_skills_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='profiles_id_fkey' and conrelid='public.profiles'::regclass) then alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='shops_owner_id_fkey' and conrelid='public.shops'::regclass) then alter table public.shops add constraint shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='stories_author_id_fkey' and conrelid='public.stories'::regclass) then alter table public.stories add constraint stories_author_id_fkey FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_constraint where conname='wallet_transactions_user_id_fkey' and conrelid='public.wallet_transactions'::regclass) then alter table public.wallet_transactions add constraint wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; end if; end $snapshot$;

-- Non-constraint indexes
CREATE INDEX IF NOT EXISTS idx_agent_chat_messages_session ON public.agent_chat_messages USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_sessions_agent ON public.agent_chat_sessions USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_chat_sessions_user ON public.agent_chat_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_user ON public.career_goals USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_career_opportunities_user ON public.career_opportunities USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_career_opportunity_feedback_opportunity ON public.career_opportunity_feedback USING btree (opportunity_id);
CREATE INDEX IF NOT EXISTS idx_career_opportunity_feedback_user ON public.career_opportunity_feedback USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_career_search_missions_user ON public.career_search_missions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_career_snapshots_user_kind ON public.career_snapshots USING btree (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment ON public.certificates USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments USING btree (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_document ON public.document_shares USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user ON public.document_shares USING btree (shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_dossier_appointments_dossier ON public.dossier_appointments USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_deliverables_dossier ON public.dossier_deliverables USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_documents_dossier ON public.dossier_documents USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_shares_dossier ON public.dossier_shares USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_shares_user ON public.dossier_shares USING btree (shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_dossier_steps_dossier ON public.dossier_steps USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_tasks_dossier ON public.dossier_tasks USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_tasks_step ON public.dossier_tasks USING btree (step_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_lead_agent ON public.dossiers USING btree (lead_agent_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_owner ON public.dossiers USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_enrollment ON public.exam_sessions USING btree (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_live_action_items_session ON public.live_action_items USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_agenda_session ON public.live_agenda_items USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_participant ON public.live_attendance USING btree (participant_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_session ON public.live_attendance USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_decisions_session ON public.live_decisions USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_documents_session ON public.live_documents USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_gifts_sent_gift ON public.live_gifts_sent USING btree (gift_id);
CREATE INDEX IF NOT EXISTS idx_live_gifts_sent_sender ON public.live_gifts_sent USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_live_gifts_sent_session ON public.live_gifts_sent USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_personal_notes_session ON public.live_personal_notes USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_personal_notes_user ON public.live_personal_notes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_live_poll_options_poll ON public.live_poll_options USING btree (poll_id);
CREATE INDEX IF NOT EXISTS idx_live_poll_votes_option ON public.live_poll_votes USING btree (option_id);
CREATE INDEX IF NOT EXISTS idx_live_poll_votes_user ON public.live_poll_votes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_live_polls_session ON public.live_polls USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_products_session ON public.live_products USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_question_upvotes_user ON public.live_question_upvotes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_live_questions_author ON public.live_questions USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_live_questions_session ON public.live_questions USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_replays_session ON public.live_replays USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_ai_assistant ON public.live_sessions USING btree (ai_assistant_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_dossier ON public.live_sessions USING btree (dossier_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_expert ON public.live_sessions USING btree (expert_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_host ON public.live_sessions USING btree (host_id);
CREATE INDEX IF NOT EXISTS idx_live_source_cards_session ON public.live_source_cards USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_speakers_agent ON public.live_speakers USING btree (agent_id);
CREATE INDEX IF NOT EXISTS idx_live_speakers_session ON public.live_speakers USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_live_speakers_user ON public.live_speakers USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_live_whiteboard_author ON public.live_whiteboard_strokes USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_live_whiteboard_session ON public.live_whiteboard_strokes USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages USING btree (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages USING btree (sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications USING btree (user_id, read);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders USING btree (buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_post_documents_post_id ON public.post_documents USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions USING btree (post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_linked_live ON public.products USING btree (linked_live_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products USING btree (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_shop ON public.products USING btree (shop_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_profile_id ON public.profile_badges USING btree (profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile_id ON public.profile_skills USING btree (profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories USING btree (author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions USING btree (user_id, currency);

-- Public functions
CREATE OR REPLACE FUNCTION public.award_xp_and_credits(p_user_id uuid, p_xp_delta integer, p_credits_delta numeric)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.profiles;
  v_new_xp integer;
begin
  if not (auth.uid() = p_user_id or public.is_admin()) then
    raise exception 'Non autorisé';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);

  select xp into v_new_xp from public.profiles where id = p_user_id;
  v_new_xp := greatest(0, v_new_xp + p_xp_delta);

  update public.profiles
  set xp = v_new_xp,
      credits = greatest(0, credits + p_credits_delta),
      level = case when v_new_xp >= next_level_xp then level + 1 else level end,
      next_level_xp = case when v_new_xp >= next_level_xp then next_level_xp + (level + 1) * 500 else next_level_xp end
  where id = p_user_id
  returning * into v_row;

  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.can_access_dossier(p_dossier_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.dossiers d
    where d.id = p_dossier_id
    and (
      d.owner_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.dossier_shares s where s.dossier_id = d.id and s.shared_with_user_id = auth.uid())
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_view_live_session(p_session_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.live_sessions s
    where s.id = p_session_id
    and (
      s.is_private = false
      or s.host_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.live_speakers sp where sp.session_id = s.id and sp.user_id = auth.uid())
      or exists (select 1 from public.live_attendance a where a.session_id = s.id and a.participant_id = auth.uid())
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_write_dossier(p_dossier_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.dossiers d
    where d.id = p_dossier_id
    and (
      d.owner_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.dossier_shares s where s.dossier_id = d.id and s.shared_with_user_id = auth.uid() and s.permission = 'write')
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_user_id uuid, p_currency text DEFAULT 'Credits'::text)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when p_user_id = auth.uid() or public.is_admin() then
      coalesce((
        select sum(case when type in ('credit','escrow_release') then amount
                         when type in ('debit','escrow_hold') then -amount
                         else 0 end)
        from public.wallet_transactions
        where user_id = p_user_id and currency = p_currency
      ), 0)
    else null
  end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role text;
  v_name text;
  v_avatar text;
begin
  v_role := case when lower(new.email) = 'visionsmart224@gmail.com' then 'admin' else 'user' end;
  v_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,'utilisateur'), '@', 1));
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');

  insert into public.profiles (id, email, name, role, avatar_url, citizenship_id, credits, level, xp, next_level_xp)
  values (
    new.id,
    coalesce(new.email, ''),
    v_name,
    v_role,
    v_avatar,
    'LMAV-' || to_char(now(),'YYYY') || '-' || lpad(floor(random()*9000+1000)::text,4,'0') || '-XX',
    case when v_role = 'admin' then 1000000 else 150 end,
    case when v_role = 'admin' then 99 else 1 end,
    case when v_role = 'admin' then 999999 else 0 end,
    1000
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.insert_wallet_transaction(p_type text, p_amount numeric, p_currency text, p_reference text)
 RETURNS wallet_transactions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_balance numeric;
  v_row public.wallet_transactions;
begin
  if p_type in ('debit','escrow_hold') then
    v_balance := public.get_wallet_balance(auth.uid(), p_currency);
    if v_balance < p_amount then
      raise exception 'Solde insuffisant';
    end if;
  end if;

  insert into public.wallet_transactions (user_id, type, amount, currency, reference)
  values (auth.uid(), p_type, p_amount, p_currency, p_reference)
  returning * into v_row;

  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_live_host(p_session_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.live_sessions s where s.id = p_session_id and (s.host_id = auth.uid() or public.is_admin()));
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.role() <> 'service_role' and coalesce(current_setting('app.bypass_profile_guard', true), '') <> 'on' then
    new.role := old.role;
    new.credits := old.credits;
    new.xp := old.xp;
    new.level := old.level;
    new.next_level_xp := old.next_level_xp;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;


-- User triggers
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_on_auth_user_created' and tgrelid='auth.users'::regclass) then execute 'CREATE TRIGGER trg_on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_agent_chat_sessions_updated_at' and tgrelid='public.agent_chat_sessions'::regclass) then execute 'CREATE TRIGGER trg_agent_chat_sessions_updated_at BEFORE UPDATE ON agent_chat_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_career_goals_updated_at' and tgrelid='public.career_goals'::regclass) then execute 'CREATE TRIGGER trg_career_goals_updated_at BEFORE UPDATE ON career_goals FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_career_opportunities_updated_at' and tgrelid='public.career_opportunities'::regclass) then execute 'CREATE TRIGGER trg_career_opportunities_updated_at BEFORE UPDATE ON career_opportunities FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_career_search_missions_updated_at' and tgrelid='public.career_search_missions'::regclass) then execute 'CREATE TRIGGER trg_career_search_missions_updated_at BEFORE UPDATE ON career_search_missions FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_dossiers_updated_at' and tgrelid='public.dossiers'::regclass) then execute 'CREATE TRIGGER trg_dossiers_updated_at BEFORE UPDATE ON dossiers FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_live_sessions_updated_at' and tgrelid='public.live_sessions'::regclass) then execute 'CREATE TRIGGER trg_live_sessions_updated_at BEFORE UPDATE ON live_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_master_resumes_updated_at' and tgrelid='public.master_resumes'::regclass) then execute 'CREATE TRIGGER trg_master_resumes_updated_at BEFORE UPDATE ON master_resumes FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_orders_updated_at' and tgrelid='public.orders'::regclass) then execute 'CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_posts_updated_at' and tgrelid='public.posts'::regclass) then execute 'CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_products_updated_at' and tgrelid='public.products'::regclass) then execute 'CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_profiles_protect_sensitive' and tgrelid='public.profiles'::regclass) then execute 'CREATE TRIGGER trg_profiles_protect_sensitive BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_sensitive_columns();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_profiles_updated_at' and tgrelid='public.profiles'::regclass) then execute 'CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_trigger where tgname='trg_shops_updated_at' and tgrelid='public.shops'::regclass) then execute 'CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION set_updated_at();'; end if; end $snapshot$;

-- RLS state
alter table public.agent_chat_messages enable row level security;
alter table public.agent_chat_sessions enable row level security;
alter table public.agents enable row level security;
alter table public.career_goals enable row level security;
alter table public.career_opportunities enable row level security;
alter table public.career_opportunity_feedback enable row level security;
alter table public.career_search_missions enable row level security;
alter table public.career_snapshots enable row level security;
alter table public.certificates enable row level security;
alter table public.comments enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.conversations enable row level security;
alter table public.courses enable row level security;
alter table public.document_shares enable row level security;
alter table public.documents enable row level security;
alter table public.dossier_appointments enable row level security;
alter table public.dossier_deliverables enable row level security;
alter table public.dossier_documents enable row level security;
alter table public.dossier_shares enable row level security;
alter table public.dossier_steps enable row level security;
alter table public.dossier_tasks enable row level security;
alter table public.dossiers enable row level security;
alter table public.enrollments enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.gift_catalog enable row level security;
alter table public.live_action_items enable row level security;
alter table public.live_agenda_items enable row level security;
alter table public.live_attendance enable row level security;
alter table public.live_decisions enable row level security;
alter table public.live_documents enable row level security;
alter table public.live_gifts_sent enable row level security;
alter table public.live_personal_notes enable row level security;
alter table public.live_poll_options enable row level security;
alter table public.live_poll_votes enable row level security;
alter table public.live_polls enable row level security;
alter table public.live_products enable row level security;
alter table public.live_question_upvotes enable row level security;
alter table public.live_questions enable row level security;
alter table public.live_replays enable row level security;
alter table public.live_sessions enable row level security;
alter table public.live_source_cards enable row level security;
alter table public.live_speakers enable row level security;
alter table public.live_whiteboard_strokes enable row level security;
alter table public.master_resumes enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.order_items enable row level security;
alter table public.orders enable row level security;
alter table public.post_documents enable row level security;
alter table public.post_reactions enable row level security;
alter table public.posts enable row level security;
alter table public.products enable row level security;
alter table public.profile_badges enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.stories enable row level security;
alter table public.wallet_transactions enable row level security;

-- Policies (created only when absent; later migrations replace insecure legacy policies)
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='agent_chat_messages' and policyname='agent_chat_messages_owner') then execute 'create policy agent_chat_messages_owner on public.agent_chat_messages as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM agent_chat_sessions s
  WHERE ((s.id = agent_chat_messages.session_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))) with check ((EXISTS ( SELECT 1
   FROM agent_chat_sessions s
  WHERE ((s.id = agent_chat_messages.session_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='agent_chat_sessions' and policyname='agent_chat_sessions_owner') then execute 'create policy agent_chat_sessions_owner on public.agent_chat_sessions as permissive for all to authenticated using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='agents' and policyname='agents_select_authenticated') then execute 'create policy agents_select_authenticated on public.agents as permissive for select to authenticated using (true)'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='agents' and policyname='agents_write_admin_only') then execute 'create policy agents_write_admin_only on public.agents as permissive for all to authenticated using (is_admin()) with check (is_admin())'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='career_goals' and policyname='career_goals_owner') then execute 'create policy career_goals_owner on public.career_goals as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='career_opportunities' and policyname='career_opportunities_owner') then execute 'create policy career_opportunities_owner on public.career_opportunities as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='career_opportunity_feedback' and policyname='career_opportunity_feedback_owner') then execute 'create policy career_opportunity_feedback_owner on public.career_opportunity_feedback as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='career_search_missions' and policyname='career_search_missions_owner') then execute 'create policy career_search_missions_owner on public.career_search_missions as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='career_snapshots' and policyname='career_snapshots_owner') then execute 'create policy career_snapshots_owner on public.career_snapshots as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='certificates' and policyname='certificates_insert_system') then execute 'create policy certificates_insert_system on public.certificates as permissive for insert to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='certificates' and policyname='certificates_select_owner') then execute 'create policy certificates_select_owner on public.certificates as permissive for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_delete_own_or_admin') then execute 'create policy comments_delete_own_or_admin on public.comments as permissive for delete to authenticated using (((author_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_insert_if_post_visible') then execute 'create policy comments_insert_if_post_visible on public.comments as permissive for insert to authenticated with check (((author_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = comments.post_id) AND ((p.visibility = ''public''::text) OR (p.author_id = ( SELECT auth.uid() AS uid)) OR is_admin()))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_select_if_post_visible') then execute 'create policy comments_select_if_post_visible on public.comments as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = comments.post_id) AND ((p.visibility = ''public''::text) OR (p.author_id = ( SELECT auth.uid() AS uid)) OR is_admin())))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='comments' and policyname='comments_update_own') then execute 'create policy comments_update_own on public.comments as permissive for update to authenticated using ((author_id = ( SELECT auth.uid() AS uid))) with check ((author_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_participants' and policyname='conversation_participants_delete_own') then execute 'create policy conversation_participants_delete_own on public.conversation_participants as permissive for delete to authenticated using ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_participants' and policyname='conversation_participants_insert_if_member_or_self') then execute 'create policy conversation_participants_insert_if_member_or_self on public.conversation_participants as permissive for insert to authenticated with check (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM conversation_participants cp2
  WHERE ((cp2.conversation_id = cp2.conversation_id) AND (cp2.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = conversation_participants.conversation_id) AND (c.created_by = ( SELECT auth.uid() AS uid)))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversation_participants' and policyname='conversation_participants_select_if_participant') then execute 'create policy conversation_participants_select_if_participant on public.conversation_participants as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM conversation_participants cp2
  WHERE ((cp2.conversation_id = cp2.conversation_id) AND (cp2.user_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_insert_own') then execute 'create policy conversations_insert_own on public.conversations as permissive for insert to authenticated with check ((created_by = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='conversations' and policyname='conversations_select_if_participant') then execute 'create policy conversations_select_if_participant on public.conversations as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = cp.id) AND (cp.user_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_select_published_or_admin') then execute 'create policy courses_select_published_or_admin on public.courses as permissive for select to authenticated using ((is_published OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_write_admin') then execute 'create policy courses_write_admin on public.courses as permissive for all to authenticated using (is_admin()) with check (is_admin())'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='document_shares' and policyname='document_shares_select') then execute 'create policy document_shares_select on public.document_shares as permissive for select to authenticated using (((shared_with_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM documents d
  WHERE ((d.id = document_shares.document_id) AND (d.owner_id = ( SELECT auth.uid() AS uid))))) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='document_shares' and policyname='document_shares_write_owner') then execute 'create policy document_shares_write_owner on public.document_shares as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM documents d
  WHERE ((d.id = document_shares.document_id) AND (d.owner_id = ( SELECT auth.uid() AS uid)))))) with check ((EXISTS ( SELECT 1
   FROM documents d
  WHERE ((d.id = document_shares.document_id) AND (d.owner_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='documents_select') then execute 'create policy documents_select on public.documents as permissive for select to authenticated using (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin() OR (EXISTS ( SELECT 1
   FROM document_shares s
  WHERE ((s.document_id = s.id) AND (s.shared_with_user_id = ( SELECT auth.uid() AS uid)))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='documents_write_owner') then execute 'create policy documents_write_owner on public.documents as permissive for all to authenticated using (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((owner_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_appointments' and policyname='dossier_appointments_select') then execute 'create policy dossier_appointments_select on public.dossier_appointments as permissive for select to authenticated using (can_access_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_appointments' and policyname='dossier_appointments_write') then execute 'create policy dossier_appointments_write on public.dossier_appointments as permissive for all to authenticated using (can_write_dossier(dossier_id)) with check (can_write_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_deliverables' and policyname='dossier_deliverables_select') then execute 'create policy dossier_deliverables_select on public.dossier_deliverables as permissive for select to authenticated using (can_access_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_deliverables' and policyname='dossier_deliverables_write') then execute 'create policy dossier_deliverables_write on public.dossier_deliverables as permissive for all to authenticated using (can_write_dossier(dossier_id)) with check (can_write_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_documents' and policyname='dossier_documents_select') then execute 'create policy dossier_documents_select on public.dossier_documents as permissive for select to authenticated using (can_access_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_documents' and policyname='dossier_documents_write') then execute 'create policy dossier_documents_write on public.dossier_documents as permissive for all to authenticated using (can_write_dossier(dossier_id)) with check (can_write_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_shares' and policyname='dossier_shares_select') then execute 'create policy dossier_shares_select on public.dossier_shares as permissive for select to authenticated using (((shared_with_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = dossier_shares.dossier_id) AND (d.owner_id = ( SELECT auth.uid() AS uid))))) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_shares' and policyname='dossier_shares_write_owner') then execute 'create policy dossier_shares_write_owner on public.dossier_shares as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = dossier_shares.dossier_id) AND (d.owner_id = ( SELECT auth.uid() AS uid)))))) with check ((EXISTS ( SELECT 1
   FROM dossiers d
  WHERE ((d.id = dossier_shares.dossier_id) AND (d.owner_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_steps' and policyname='dossier_steps_select') then execute 'create policy dossier_steps_select on public.dossier_steps as permissive for select to authenticated using (can_access_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_steps' and policyname='dossier_steps_write') then execute 'create policy dossier_steps_write on public.dossier_steps as permissive for all to authenticated using (can_write_dossier(dossier_id)) with check (can_write_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_tasks' and policyname='dossier_tasks_select') then execute 'create policy dossier_tasks_select on public.dossier_tasks as permissive for select to authenticated using (can_access_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossier_tasks' and policyname='dossier_tasks_write') then execute 'create policy dossier_tasks_write on public.dossier_tasks as permissive for all to authenticated using (can_write_dossier(dossier_id)) with check (can_write_dossier(dossier_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossiers' and policyname='dossiers_delete_owner') then execute 'create policy dossiers_delete_owner on public.dossiers as permissive for delete to authenticated using (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossiers' and policyname='dossiers_insert_own') then execute 'create policy dossiers_insert_own on public.dossiers as permissive for insert to authenticated with check ((owner_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossiers' and policyname='dossiers_select') then execute 'create policy dossiers_select on public.dossiers as permissive for select to authenticated using (can_access_dossier(id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossiers' and policyname='dossiers_update') then execute 'create policy dossiers_update on public.dossiers as permissive for update to authenticated using (can_write_dossier(id)) with check (can_write_dossier(id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='enrollments' and policyname='enrollments_owner') then execute 'create policy enrollments_owner on public.enrollments as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='exam_sessions' and policyname='exam_sessions_owner') then execute 'create policy exam_sessions_owner on public.exam_sessions as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.id = exam_sessions.enrollment_id) AND ((e.user_id = ( SELECT auth.uid() AS uid)) OR is_admin()))))) with check ((EXISTS ( SELECT 1
   FROM enrollments e
  WHERE ((e.id = exam_sessions.enrollment_id) AND (e.user_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='gift_catalog' and policyname='gift_catalog_select_authenticated') then execute 'create policy gift_catalog_select_authenticated on public.gift_catalog as permissive for select to authenticated using (true)'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='gift_catalog' and policyname='gift_catalog_write_admin') then execute 'create policy gift_catalog_write_admin on public.gift_catalog as permissive for all to authenticated using (is_admin()) with check (is_admin())'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_action_items' and policyname='live_action_items_select') then execute 'create policy live_action_items_select on public.live_action_items as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_action_items' and policyname='live_action_items_write_host') then execute 'create policy live_action_items_write_host on public.live_action_items as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_agenda_items' and policyname='live_agenda_select') then execute 'create policy live_agenda_select on public.live_agenda_items as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_agenda_items' and policyname='live_agenda_write_host') then execute 'create policy live_agenda_write_host on public.live_agenda_items as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_attendance' and policyname='live_attendance_select') then execute 'create policy live_attendance_select on public.live_attendance as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_attendance' and policyname='live_attendance_update_own_or_host') then execute 'create policy live_attendance_update_own_or_host on public.live_attendance as permissive for update to authenticated using (((participant_id = ( SELECT auth.uid() AS uid)) OR is_live_host(session_id))) with check (((participant_id = ( SELECT auth.uid() AS uid)) OR is_live_host(session_id)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_attendance' and policyname='live_attendance_upsert_own') then execute 'create policy live_attendance_upsert_own on public.live_attendance as permissive for insert to authenticated with check ((participant_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_decisions' and policyname='live_decisions_select') then execute 'create policy live_decisions_select on public.live_decisions as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_decisions' and policyname='live_decisions_write_host') then execute 'create policy live_decisions_write_host on public.live_decisions as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_documents' and policyname='live_documents_select') then execute 'create policy live_documents_select on public.live_documents as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_documents' and policyname='live_documents_write_host') then execute 'create policy live_documents_write_host on public.live_documents as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_gifts_sent' and policyname='live_gifts_sent_insert_own') then execute 'create policy live_gifts_sent_insert_own on public.live_gifts_sent as permissive for insert to authenticated with check ((sender_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_gifts_sent' and policyname='live_gifts_sent_select') then execute 'create policy live_gifts_sent_select on public.live_gifts_sent as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_personal_notes' and policyname='live_personal_notes_owner_only') then execute 'create policy live_personal_notes_owner_only on public.live_personal_notes as permissive for all to authenticated using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_poll_options' and policyname='live_poll_options_select') then execute 'create policy live_poll_options_select on public.live_poll_options as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM live_polls p
  WHERE ((p.id = live_poll_options.poll_id) AND can_view_live_session(p.session_id)))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_poll_options' and policyname='live_poll_options_write_host') then execute 'create policy live_poll_options_write_host on public.live_poll_options as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM live_polls p
  WHERE ((p.id = live_poll_options.poll_id) AND is_live_host(p.session_id))))) with check ((EXISTS ( SELECT 1
   FROM live_polls p
  WHERE ((p.id = live_poll_options.poll_id) AND is_live_host(p.session_id)))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_poll_votes' and policyname='live_poll_votes_insert_own') then execute 'create policy live_poll_votes_insert_own on public.live_poll_votes as permissive for insert to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_poll_votes' and policyname='live_poll_votes_select') then execute 'create policy live_poll_votes_select on public.live_poll_votes as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM live_polls p
  WHERE ((p.id = live_poll_votes.poll_id) AND can_view_live_session(p.session_id)))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_polls' and policyname='live_polls_select') then execute 'create policy live_polls_select on public.live_polls as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_polls' and policyname='live_polls_write_host') then execute 'create policy live_polls_write_host on public.live_polls as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_products' and policyname='live_products_select') then execute 'create policy live_products_select on public.live_products as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_products' and policyname='live_products_write_host') then execute 'create policy live_products_write_host on public.live_products as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_question_upvotes' and policyname='live_question_upvotes_delete_own') then execute 'create policy live_question_upvotes_delete_own on public.live_question_upvotes as permissive for delete to authenticated using ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_question_upvotes' and policyname='live_question_upvotes_insert_own') then execute 'create policy live_question_upvotes_insert_own on public.live_question_upvotes as permissive for insert to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_question_upvotes' and policyname='live_question_upvotes_select') then execute 'create policy live_question_upvotes_select on public.live_question_upvotes as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM live_questions q
  WHERE ((q.id = live_question_upvotes.question_id) AND can_view_live_session(q.session_id)))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_questions' and policyname='live_questions_insert') then execute 'create policy live_questions_insert on public.live_questions as permissive for insert to authenticated with check (((author_id = ( SELECT auth.uid() AS uid)) AND can_view_live_session(session_id)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_questions' and policyname='live_questions_select') then execute 'create policy live_questions_select on public.live_questions as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_questions' and policyname='live_questions_update_own_or_host') then execute 'create policy live_questions_update_own_or_host on public.live_questions as permissive for update to authenticated using (((author_id = ( SELECT auth.uid() AS uid)) OR is_live_host(session_id))) with check (((author_id = ( SELECT auth.uid() AS uid)) OR is_live_host(session_id)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_replays' and policyname='live_replays_select_authenticated') then execute 'create policy live_replays_select_authenticated on public.live_replays as permissive for select to authenticated using (true)'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_replays' and policyname='live_replays_write_host') then execute 'create policy live_replays_write_host on public.live_replays as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_sessions' and policyname='live_sessions_delete_host') then execute 'create policy live_sessions_delete_host on public.live_sessions as permissive for delete to authenticated using (is_live_host(id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_sessions' and policyname='live_sessions_insert_own') then execute 'create policy live_sessions_insert_own on public.live_sessions as permissive for insert to authenticated with check ((host_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_sessions' and policyname='live_sessions_select_visible') then execute 'create policy live_sessions_select_visible on public.live_sessions as permissive for select to authenticated using (((is_private = false) OR (host_id = ( SELECT auth.uid() AS uid)) OR is_admin() OR (EXISTS ( SELECT 1
   FROM live_speakers sp
  WHERE ((sp.session_id = sp.id) AND (sp.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM live_attendance a
  WHERE ((a.session_id = a.id) AND (a.participant_id = ( SELECT auth.uid() AS uid)))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_sessions' and policyname='live_sessions_update_host') then execute 'create policy live_sessions_update_host on public.live_sessions as permissive for update to authenticated using (is_live_host(id)) with check (is_live_host(id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_source_cards' and policyname='live_source_cards_select') then execute 'create policy live_source_cards_select on public.live_source_cards as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_source_cards' and policyname='live_source_cards_write_host') then execute 'create policy live_source_cards_write_host on public.live_source_cards as permissive for all to authenticated using (is_live_host(session_id)) with check (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_speakers' and policyname='live_speakers_select') then execute 'create policy live_speakers_select on public.live_speakers as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_speakers' and policyname='live_speakers_write_host') then execute 'create policy live_speakers_write_host on public.live_speakers as permissive for all to authenticated using ((is_live_host(session_id) OR (user_id = ( SELECT auth.uid() AS uid)))) with check ((is_live_host(session_id) OR (user_id = ( SELECT auth.uid() AS uid))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_whiteboard_strokes' and policyname='live_whiteboard_delete_host') then execute 'create policy live_whiteboard_delete_host on public.live_whiteboard_strokes as permissive for delete to authenticated using (is_live_host(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_whiteboard_strokes' and policyname='live_whiteboard_insert') then execute 'create policy live_whiteboard_insert on public.live_whiteboard_strokes as permissive for insert to authenticated with check (((author_id = ( SELECT auth.uid() AS uid)) AND can_view_live_session(session_id)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_whiteboard_strokes' and policyname='live_whiteboard_select') then execute 'create policy live_whiteboard_select on public.live_whiteboard_strokes as permissive for select to authenticated using (can_view_live_session(session_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='master_resumes' and policyname='master_resumes_owner') then execute 'create policy master_resumes_owner on public.master_resumes as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_delete_own') then execute 'create policy messages_delete_own on public.messages as permissive for delete to authenticated using ((sender_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_insert_if_participant') then execute 'create policy messages_insert_if_participant on public.messages as permissive for insert to authenticated with check (((sender_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = cp.conversation_id) AND (cp.user_id = ( SELECT auth.uid() AS uid)))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='messages' and policyname='messages_select_if_participant') then execute 'create policy messages_select_if_participant on public.messages as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM conversation_participants cp
  WHERE ((cp.conversation_id = cp.conversation_id) AND (cp.user_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notifications_owner') then execute 'create policy notifications_owner on public.notifications as permissive for all to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_insert_buyer') then execute 'create policy order_items_insert_buyer on public.order_items as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND (o.buyer_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='order_items' and policyname='order_items_select') then execute 'create policy order_items_select on public.order_items as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND ((o.buyer_id = ( SELECT auth.uid() AS uid)) OR (o.seller_id = ( SELECT auth.uid() AS uid)) OR is_admin())))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_insert_buyer') then execute 'create policy orders_insert_buyer on public.orders as permissive for insert to authenticated with check ((buyer_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_select_buyer_or_seller') then execute 'create policy orders_select_buyer_or_seller on public.orders as permissive for select to authenticated using (((buyer_id = ( SELECT auth.uid() AS uid)) OR (seller_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_update_buyer_or_seller') then execute 'create policy orders_update_buyer_or_seller on public.orders as permissive for update to authenticated using (((buyer_id = ( SELECT auth.uid() AS uid)) OR (seller_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check (((buyer_id = ( SELECT auth.uid() AS uid)) OR (seller_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_documents' and policyname='post_documents_select_if_post_visible') then execute 'create policy post_documents_select_if_post_visible on public.post_documents as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_documents.post_id) AND ((p.visibility = ''public''::text) OR (p.author_id = ( SELECT auth.uid() AS uid)) OR is_admin())))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_documents' and policyname='post_documents_write_if_post_owner') then execute 'create policy post_documents_write_if_post_owner on public.post_documents as permissive for all to authenticated using ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_documents.post_id) AND (p.author_id = ( SELECT auth.uid() AS uid)))))) with check ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_documents.post_id) AND (p.author_id = ( SELECT auth.uid() AS uid))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_reactions' and policyname='post_reactions_delete_own') then execute 'create policy post_reactions_delete_own on public.post_reactions as permissive for delete to authenticated using ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_reactions' and policyname='post_reactions_insert_own') then execute 'create policy post_reactions_insert_own on public.post_reactions as permissive for insert to authenticated with check ((user_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_reactions' and policyname='post_reactions_select_if_post_visible') then execute 'create policy post_reactions_select_if_post_visible on public.post_reactions as permissive for select to authenticated using ((EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = post_reactions.post_id) AND ((p.visibility = ''public''::text) OR (p.author_id = ( SELECT auth.uid() AS uid)) OR is_admin())))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_delete_own_or_admin') then execute 'create policy posts_delete_own_or_admin on public.posts as permissive for delete to authenticated using (((author_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_insert_own') then execute 'create policy posts_insert_own on public.posts as permissive for insert to authenticated with check ((author_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_select_visible') then execute 'create policy posts_select_visible on public.posts as permissive for select to authenticated using (((visibility = ''public''::text) OR (author_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='posts' and policyname='posts_update_own_or_admin') then execute 'create policy posts_update_own_or_admin on public.posts as permissive for update to authenticated using (((author_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check (((author_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_select_active_or_owner') then execute 'create policy products_select_active_or_owner on public.products as permissive for select to authenticated using ((is_active OR (seller_id = ( SELECT auth.uid() AS uid)) OR is_admin() OR (EXISTS ( SELECT 1
   FROM shops s
  WHERE ((s.id = products.shop_id) AND (s.owner_id = ( SELECT auth.uid() AS uid)))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products_write_owner') then execute 'create policy products_write_owner on public.products as permissive for all to authenticated using (((seller_id = ( SELECT auth.uid() AS uid)) OR is_admin() OR (EXISTS ( SELECT 1
   FROM shops s
  WHERE ((s.id = products.shop_id) AND (s.owner_id = ( SELECT auth.uid() AS uid))))))) with check (((seller_id = ( SELECT auth.uid() AS uid)) OR is_admin() OR (EXISTS ( SELECT 1
   FROM shops s
  WHERE ((s.id = products.shop_id) AND (s.owner_id = ( SELECT auth.uid() AS uid)))))))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_badges' and policyname='profile_badges_delete_own') then execute 'create policy profile_badges_delete_own on public.profile_badges as permissive for delete to authenticated using ((( SELECT auth.uid() AS uid) = profile_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_badges' and policyname='profile_badges_select_own_or_admin') then execute 'create policy profile_badges_select_own_or_admin on public.profile_badges as permissive for select to authenticated using (((( SELECT auth.uid() AS uid) = profile_id) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_badges' and policyname='profile_badges_write_own') then execute 'create policy profile_badges_write_own on public.profile_badges as permissive for insert to authenticated with check ((( SELECT auth.uid() AS uid) = profile_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_skills' and policyname='profile_skills_delete_own') then execute 'create policy profile_skills_delete_own on public.profile_skills as permissive for delete to authenticated using ((( SELECT auth.uid() AS uid) = profile_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_skills' and policyname='profile_skills_select_own_or_admin') then execute 'create policy profile_skills_select_own_or_admin on public.profile_skills as permissive for select to authenticated using (((( SELECT auth.uid() AS uid) = profile_id) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_skills' and policyname='profile_skills_update_own') then execute 'create policy profile_skills_update_own on public.profile_skills as permissive for update to authenticated using ((( SELECT auth.uid() AS uid) = profile_id)) with check ((( SELECT auth.uid() AS uid) = profile_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profile_skills' and policyname='profile_skills_write_own') then execute 'create policy profile_skills_write_own on public.profile_skills as permissive for insert to authenticated with check ((( SELECT auth.uid() AS uid) = profile_id))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_select_authenticated') then execute 'create policy profiles_select_authenticated on public.profiles as permissive for select to authenticated using ((id = (select auth.uid())))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_update_own_or_admin') then execute 'create policy profiles_update_own_or_admin on public.profiles as permissive for update to authenticated using (((( SELECT auth.uid() AS uid) = id) OR is_admin())) with check (((( SELECT auth.uid() AS uid) = id) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='shops' and policyname='shops_select_authenticated') then execute 'create policy shops_select_authenticated on public.shops as permissive for select to authenticated using (true)'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='shops' and policyname='shops_write_owner') then execute 'create policy shops_write_owner on public.shops as permissive for all to authenticated using (((owner_id = ( SELECT auth.uid() AS uid)) OR is_admin())) with check ((owner_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='stories' and policyname='stories_delete_own_or_admin') then execute 'create policy stories_delete_own_or_admin on public.stories as permissive for delete to authenticated using (((author_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='stories' and policyname='stories_insert_own') then execute 'create policy stories_insert_own on public.stories as permissive for insert to authenticated with check ((author_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='stories' and policyname='stories_select_authenticated') then execute 'create policy stories_select_authenticated on public.stories as permissive for select to authenticated using (true)'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='stories' and policyname='stories_update_own') then execute 'create policy stories_update_own on public.stories as permissive for update to authenticated using ((author_id = ( SELECT auth.uid() AS uid))) with check ((author_id = ( SELECT auth.uid() AS uid)))'; end if; end $snapshot$;
do $snapshot$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='wallet_transactions' and policyname='wallet_transactions_select_own') then execute 'create policy wallet_transactions_select_own on public.wallet_transactions as permissive for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()))'; end if; end $snapshot$;

-- Data API grants observed on the live schema
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agent_chat_messages to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agent_chat_messages to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agent_chat_messages to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agent_chat_sessions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agent_chat_sessions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agent_chat_sessions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agents to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agents to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.agents to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_goals to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_goals to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_goals to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_opportunities to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_opportunities to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_opportunities to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_opportunity_feedback to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_opportunity_feedback to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_opportunity_feedback to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_search_missions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_search_missions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_search_missions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_snapshots to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_snapshots to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.career_snapshots to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.certificates to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.certificates to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.certificates to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.comments to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.comments to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.comments to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.conversation_participants to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.conversation_participants to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.conversation_participants to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.conversations to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.conversations to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.conversations to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.courses to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.courses to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.courses to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.document_shares to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.document_shares to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.document_shares to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.documents to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.documents to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.documents to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_appointments to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_appointments to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_appointments to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_deliverables to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_deliverables to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_deliverables to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_documents to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_documents to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_documents to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_shares to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_shares to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_shares to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_steps to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_steps to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_steps to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_tasks to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_tasks to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossier_tasks to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossiers to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossiers to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.dossiers to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.enrollments to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.enrollments to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.enrollments to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exam_sessions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exam_sessions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exam_sessions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.gift_catalog to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.gift_catalog to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.gift_catalog to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_action_items to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_action_items to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_action_items to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_agenda_items to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_agenda_items to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_agenda_items to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_attendance to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_attendance to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_attendance to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_decisions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_decisions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_decisions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_documents to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_documents to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_documents to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_gifts_sent to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_gifts_sent to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_gifts_sent to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_personal_notes to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_personal_notes to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_personal_notes to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_poll_options to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_poll_options to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_poll_options to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_poll_votes to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_poll_votes to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_poll_votes to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_polls to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_polls to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_polls to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_products to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_products to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_products to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_question_upvotes to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_question_upvotes to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_question_upvotes to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_questions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_questions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_questions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_replays to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_replays to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_replays to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_sessions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_sessions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_sessions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_source_cards to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_source_cards to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_source_cards to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_speakers to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_speakers to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_speakers to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_whiteboard_strokes to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_whiteboard_strokes to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.live_whiteboard_strokes to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.master_resumes to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.master_resumes to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.master_resumes to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.messages to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.messages to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.messages to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.notifications to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.notifications to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.notifications to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.order_items to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.order_items to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.order_items to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.orders to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.orders to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.orders to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.post_documents to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.post_documents to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.post_documents to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.post_reactions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.post_reactions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.post_reactions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.posts to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.posts to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.posts to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.products to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.products to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.products to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profile_badges to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profile_badges to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profile_badges to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profile_skills to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profile_skills to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profile_skills to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profiles to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profiles to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.profiles to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.shops to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.shops to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.shops to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.stories to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.stories to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.stories to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.wallet_transactions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.wallet_transactions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.wallet_transactions to service_role;

-- Schema comments
comment on table public.profiles is 'Profil applicatif Le Monde à Vous, 1:1 avec auth.users. role/credits/xp/level protégés en écriture (voir trigger protect_profile_sensitive_columns).';

commit;
