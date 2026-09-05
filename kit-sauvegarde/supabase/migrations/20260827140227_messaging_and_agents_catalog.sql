
-- ═══════════════════════════════════════════════════════════
-- AGENTS: catalogue des experts Diallo (IA + humains). Table
-- admin-managée — pas de RLS par utilisateur, lecture publique.
-- Seedée séparément depuis constants.ts AGENTS (migration suivante).
-- ═══════════════════════════════════════════════════════════
create table public.agents (
  id text primary key,
  name text not null,
  role text not null,
  description text,
  avatar_url text,
  is_human boolean not null default false,
  hourly_rate numeric,
  experience_years integer,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.agents enable row level security;

create policy "agents_select_authenticated" on public.agents
for select to authenticated using (true);

create policy "agents_write_admin_only" on public.agents
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- MESSAGERIE: conversations privées/groupes (Mooc Chat)
-- ═══════════════════════════════════════════════════════════
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  attachment_url text,
  created_at timestamptz not null default now()
);

create index idx_conversation_participants_conversation on public.conversation_participants(conversation_id);
create index idx_conversation_participants_user on public.conversation_participants(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at);

-- ═══════════════════════════════════════════════════════════
-- CHAT EXPERT IA 1:1 (persiste enfin ce que memoryService.saveConversation
-- prévoyait sans jamais être branché)
-- ═══════════════════════════════════════════════════════════
create table public.agent_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id text not null references public.agents(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, agent_id)
);

create table public.agent_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.agent_chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','model')),
  content text not null,
  image_urls text[],
  created_at timestamptz not null default now()
);

create index idx_agent_chat_sessions_user on public.agent_chat_sessions(user_id);
create index idx_agent_chat_messages_session on public.agent_chat_messages(session_id);

create trigger trg_agent_chat_sessions_updated_at before update on public.agent_chat_sessions
for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- RLS — messagerie : uniquement les participants
-- ═══════════════════════════════════════════════════════════
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.agent_chat_sessions enable row level security;
alter table public.agent_chat_messages enable row level security;

create policy "conversations_select_if_participant" on public.conversations
for select to authenticated using (
  exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid())
);

create policy "conversations_insert_own" on public.conversations
for insert to authenticated with check (created_by = auth.uid());

create policy "conversation_participants_select_if_participant" on public.conversation_participants
for select to authenticated using (
  exists (select 1 from public.conversation_participants cp2 where cp2.conversation_id = conversation_id and cp2.user_id = auth.uid())
);

create policy "conversation_participants_insert_if_member_or_self" on public.conversation_participants
for insert to authenticated with check (
  user_id = auth.uid()
  or exists (select 1 from public.conversation_participants cp2 where cp2.conversation_id = conversation_id and cp2.user_id = auth.uid())
  or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
);

create policy "conversation_participants_delete_own" on public.conversation_participants
for delete to authenticated using (user_id = auth.uid());

create policy "messages_select_if_participant" on public.messages
for select to authenticated using (
  exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid())
);

create policy "messages_insert_if_participant" on public.messages
for insert to authenticated with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid())
);

create policy "messages_delete_own" on public.messages
for delete to authenticated using (sender_id = auth.uid());

create policy "agent_chat_sessions_owner" on public.agent_chat_sessions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "agent_chat_messages_owner" on public.agent_chat_messages
for all to authenticated using (
  exists (select 1 from public.agent_chat_sessions s where s.id = session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.agent_chat_sessions s where s.id = session_id and s.user_id = auth.uid())
);

-- Realtime pour le chat (valeur réelle : messages instantanés)
alter publication supabase_realtime add table public.messages;
