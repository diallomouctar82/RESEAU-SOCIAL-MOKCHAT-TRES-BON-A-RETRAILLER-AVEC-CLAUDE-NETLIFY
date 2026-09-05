
-- ═══════════════════════════════════════════════════════════
-- LIVE — schéma complet fidèle à SocialLive.tsx / types.ts
-- (LiveStream + tous ses sous-objets), pas une version réduite.
-- ═══════════════════════════════════════════════════════════

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  type text,
  host_name text,
  host_avatar text,
  viewers_count integer not null default 0,
  is_mixed boolean not null default false,
  ai_assistant_id text references public.agents(id),
  started_at timestamptz,
  scheduled_for timestamptz,
  timezone text,
  is_scheduled boolean not null default false,
  duration_minutes integer not null default 0,
  ended_at timestamptz,
  is_paid boolean not null default false,
  pricing jsonb,
  donation_goal jsonb,
  tags text[] not null default '{}',
  language text,
  target_language text,
  cover_image text,
  is_private boolean not null default false,
  allowed_member_ids uuid[] not null default '{}',
  tribe_id text,
  tribe_name text,
  expert_id text references public.agents(id),
  is_recording_enabled boolean not null default false,
  is_translation_enabled boolean not null default false,
  is_questions_enabled boolean not null default true,
  is_screen_share_enabled boolean not null default true,
  is_vision_enabled boolean not null default false,
  is_data_saver boolean not null default false,
  quality_mode text default 'auto' check (quality_mode in ('auto','hd','sd','eco_audio')),
  dossier_id uuid,
  dossier_title text,
  is_waiting_room_enabled boolean not null default false,
  course_module_id text,
  interview_guest_name text,
  interview_guest_bio text,
  conf_tracks text[] not null default '{}',
  sensitive_data_alert boolean not null default false,
  meeting_minutes jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_live_sessions_updated_at before update on public.live_sessions
for each row execute function public.set_updated_at();

create table public.live_speakers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  agent_id text references public.agents(id),
  name text not null,
  avatar text,
  role text not null check (role in ('host','cohost','guest','expert_ai','expert_human','speaker','secretary_ai','moderator_ai','director_ai')),
  is_muted boolean not null default false,
  is_video_on boolean not null default true,
  is_ai boolean not null default false,
  is_verified boolean not null default false,
  specialty text,
  is_screen_sharing boolean not null default false,
  is_hand_raised boolean not null default false,
  joined_at timestamptz not null default now()
);

create table public.live_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  participant_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  joined_at timestamptz not null default now(),
  duration_minutes integer not null default 0,
  exercises_done integer not null default 0,
  quiz_score integer,
  competence_validated boolean not null default false,
  unique (session_id, participant_id)
);

create table public.live_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,
  author_avatar text,
  text text not null,
  upvotes_count integer not null default 0,
  status text not null default 'open' check (status in ('open','answering','answered')),
  category text,
  ai_group_key text,
  created_at timestamptz not null default now()
);

create table public.live_question_upvotes (
  question_id uuid not null references public.live_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

create table public.live_polls (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  question text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.live_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.live_polls(id) on delete cascade,
  text text not null,
  votes_count integer not null default 0
);

create table public.live_poll_votes (
  poll_id uuid not null references public.live_polls(id) on delete cascade,
  option_id uuid not null references public.live_poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table public.live_agenda_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 0,
  presenter text,
  completed boolean not null default false,
  position integer not null default 0
);

create table public.live_decisions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  text text not null,
  agreed_by text[] not null default '{}',
  category text,
  created_at timestamptz not null default now()
);

create table public.live_action_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  title text not null,
  category text not null check (category in ('projet','juridique','finance','formation','action')),
  assigned_to text,
  deadline timestamptz,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table public.live_documents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  name text not null,
  url text not null,
  type text check (type in ('pdf','doc','image','slide','sheet')),
  size text,
  uploaded_by text,
  page_count integer,
  created_at timestamptz not null default now()
);

create table public.live_source_cards (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  statement text not null,
  organization text,
  document_name text,
  card_date text,
  reference_url text,
  verified_status text check (verified_status in ('confirmed','uncertain','contradictory','insufficient')),
  analysis text,
  created_at timestamptz not null default now()
);

create table public.live_products (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  currency text,
  country text,
  country_flag text,
  availability text check (availability in ('in_stock','preorder','limited')),
  seller_name text,
  seller_avatar text,
  image_url text,
  category text,
  has_trade_assistance boolean default false
);

create table public.live_personal_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  category text not null default 'general' check (category in ('reminder','task','project','learning','general')),
  target_module text,
  reminder_date timestamptz,
  created_at timestamptz not null default now()
);

create table public.gift_catalog (
  id text primary key,
  name text not null,
  icon text,
  cost numeric not null,
  animation text,
  is_active boolean not null default true
);

create table public.live_gifts_sent (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  gift_id text not null references public.gift_catalog(id),
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.live_replays (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  title text not null,
  duration_seconds integer not null default 0,
  host_name text,
  host_avatar text,
  video_url text,
  category text,
  chapters jsonb not null default '[]',
  transcript jsonb not null default '[]',
  summary text,
  key_takeaways text[] not null default '{}',
  resources jsonb not null default '[]',
  campus_ready boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.live_whiteboard_strokes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  tool text not null check (tool in ('pen','rect','circle','text','note','arrow')),
  color text,
  stroke_width numeric,
  points jsonb,
  stroke_text text,
  x numeric, y numeric, width_box numeric, height_box numeric,
  created_at timestamptz not null default now()
);

create index idx_live_sessions_host on public.live_sessions(host_id);
create index idx_live_speakers_session on public.live_speakers(session_id);
create index idx_live_attendance_session on public.live_attendance(session_id);
create index idx_live_questions_session on public.live_questions(session_id);
create index idx_live_polls_session on public.live_polls(session_id);
create index idx_live_poll_options_poll on public.live_poll_options(poll_id);
create index idx_live_agenda_session on public.live_agenda_items(session_id);
create index idx_live_decisions_session on public.live_decisions(session_id);
create index idx_live_action_items_session on public.live_action_items(session_id);
create index idx_live_documents_session on public.live_documents(session_id);
create index idx_live_source_cards_session on public.live_source_cards(session_id);
create index idx_live_products_session on public.live_products(session_id);
create index idx_live_personal_notes_user on public.live_personal_notes(user_id);
create index idx_live_gifts_sent_session on public.live_gifts_sent(session_id);
create index idx_live_replays_session on public.live_replays(session_id);
create index idx_live_whiteboard_session on public.live_whiteboard_strokes(session_id);

create or replace function public.can_view_live_session(p_session_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
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
$$;

create or replace function public.is_live_host(p_session_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.live_sessions s where s.id = p_session_id and (s.host_id = auth.uid() or public.is_admin()));
$$;

alter table public.live_sessions enable row level security;
alter table public.live_speakers enable row level security;
alter table public.live_attendance enable row level security;
alter table public.live_questions enable row level security;
alter table public.live_question_upvotes enable row level security;
alter table public.live_polls enable row level security;
alter table public.live_poll_options enable row level security;
alter table public.live_poll_votes enable row level security;
alter table public.live_agenda_items enable row level security;
alter table public.live_decisions enable row level security;
alter table public.live_action_items enable row level security;
alter table public.live_documents enable row level security;
alter table public.live_source_cards enable row level security;
alter table public.live_products enable row level security;
alter table public.live_personal_notes enable row level security;
alter table public.gift_catalog enable row level security;
alter table public.live_gifts_sent enable row level security;
alter table public.live_replays enable row level security;
alter table public.live_whiteboard_strokes enable row level security;

create policy "live_sessions_select_visible" on public.live_sessions
for select to authenticated using (is_private = false or host_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.live_speakers sp where sp.session_id = id and sp.user_id = auth.uid())
  or exists (select 1 from public.live_attendance a where a.session_id = id and a.participant_id = auth.uid()));
create policy "live_sessions_insert_own" on public.live_sessions
for insert to authenticated with check (host_id = auth.uid());
create policy "live_sessions_update_host" on public.live_sessions
for update to authenticated using (public.is_live_host(id)) with check (public.is_live_host(id));
create policy "live_sessions_delete_host" on public.live_sessions
for delete to authenticated using (public.is_live_host(id));

create policy "live_speakers_select" on public.live_speakers for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_speakers_write_host" on public.live_speakers for all to authenticated using (public.is_live_host(session_id) or user_id = auth.uid()) with check (public.is_live_host(session_id) or user_id = auth.uid());

create policy "live_attendance_select" on public.live_attendance for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_attendance_upsert_own" on public.live_attendance for insert to authenticated with check (participant_id = auth.uid());
create policy "live_attendance_update_own_or_host" on public.live_attendance for update to authenticated using (participant_id = auth.uid() or public.is_live_host(session_id)) with check (participant_id = auth.uid() or public.is_live_host(session_id));

create policy "live_questions_select" on public.live_questions for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_questions_insert" on public.live_questions for insert to authenticated with check (author_id = auth.uid() and public.can_view_live_session(session_id));
create policy "live_questions_update_own_or_host" on public.live_questions for update to authenticated using (author_id = auth.uid() or public.is_live_host(session_id)) with check (author_id = auth.uid() or public.is_live_host(session_id));

create policy "live_question_upvotes_select" on public.live_question_upvotes for select to authenticated using (exists (select 1 from public.live_questions q where q.id = question_id and public.can_view_live_session(q.session_id)));
create policy "live_question_upvotes_insert_own" on public.live_question_upvotes for insert to authenticated with check (user_id = auth.uid());
create policy "live_question_upvotes_delete_own" on public.live_question_upvotes for delete to authenticated using (user_id = auth.uid());

create policy "live_polls_select" on public.live_polls for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_polls_write_host" on public.live_polls for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_poll_options_select" on public.live_poll_options for select to authenticated using (exists (select 1 from public.live_polls p where p.id = poll_id and public.can_view_live_session(p.session_id)));
create policy "live_poll_options_write_host" on public.live_poll_options for all to authenticated using (exists (select 1 from public.live_polls p where p.id = poll_id and public.is_live_host(p.session_id))) with check (exists (select 1 from public.live_polls p where p.id = poll_id and public.is_live_host(p.session_id)));

create policy "live_poll_votes_select" on public.live_poll_votes for select to authenticated using (exists (select 1 from public.live_polls p where p.id = poll_id and public.can_view_live_session(p.session_id)));
create policy "live_poll_votes_insert_own" on public.live_poll_votes for insert to authenticated with check (user_id = auth.uid());

create policy "live_agenda_select" on public.live_agenda_items for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_agenda_write_host" on public.live_agenda_items for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_decisions_select" on public.live_decisions for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_decisions_write_host" on public.live_decisions for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_action_items_select" on public.live_action_items for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_action_items_write_host" on public.live_action_items for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_documents_select" on public.live_documents for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_documents_write_host" on public.live_documents for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_source_cards_select" on public.live_source_cards for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_source_cards_write_host" on public.live_source_cards for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_products_select" on public.live_products for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_products_write_host" on public.live_products for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_personal_notes_owner_only" on public.live_personal_notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "gift_catalog_select_authenticated" on public.gift_catalog for select to authenticated using (true);
create policy "gift_catalog_write_admin" on public.gift_catalog for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "live_gifts_sent_select" on public.live_gifts_sent for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_gifts_sent_insert_own" on public.live_gifts_sent for insert to authenticated with check (sender_id = auth.uid());

create policy "live_replays_select_authenticated" on public.live_replays for select to authenticated using (true);
create policy "live_replays_write_host" on public.live_replays for all to authenticated using (public.is_live_host(session_id)) with check (public.is_live_host(session_id));

create policy "live_whiteboard_select" on public.live_whiteboard_strokes for select to authenticated using (public.can_view_live_session(session_id));
create policy "live_whiteboard_insert" on public.live_whiteboard_strokes for insert to authenticated with check (author_id = auth.uid() and public.can_view_live_session(session_id));
create policy "live_whiteboard_delete_host" on public.live_whiteboard_strokes for delete to authenticated using (public.is_live_host(session_id));

alter publication supabase_realtime add table public.live_questions;
alter publication supabase_realtime add table public.live_poll_votes;
alter publication supabase_realtime add table public.live_whiteboard_strokes;
