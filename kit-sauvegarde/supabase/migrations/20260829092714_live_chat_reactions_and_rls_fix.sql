-- LOOP 02/14 — modèle de données réel du LIVE.
--
-- Découverte en auditant l'existant avant d'écrire quoi que ce soit (comme
-- exigé par la méthode) : live_sessions/live_speakers/live_questions/... (18
-- tables) existent déjà, RLS activée, jamais consommées par aucun code
-- (aucun `.from('live_` dans tout le dépôt) — donc pas de duplication à
-- faire ici, seulement compléter les deux briques manquantes (chat libre,
-- réactions) et corriger un bug RLS trouvé en cours d'audit sur la table
-- centrale live_sessions.

-- 1. Bug RLS pré-existant sur live_sessions_select_visible : la policy
-- dupliquait à la main la logique de can_view_live_session() au lieu de
-- l'appeler, et cette copie contenait une faute de corrélation
-- (`sp.session_id = sp.id` / `a.session_id = a.id` — une ligne comparée à
-- elle-même au lieu d'être corrélée à la session vérifiée), rendant les
-- branches "je suis speaker/attendee de cette session privée" inopérantes
-- en pratique (comparaison de deux UUID générés indépendamment). La fonction
-- can_view_live_session() elle-même est correcte (vérifiée) — on l'appelle
-- donc directement au lieu de garder une copie qui a divergé.
drop policy if exists live_sessions_select_visible on public.live_sessions;

create policy live_sessions_select_visible on public.live_sessions
  for select
  using (public.can_view_live_session(id));

-- 2. Chat en direct — texte libre, distinct de live_questions (Q/R
-- structurée avec statut/upvotes/regroupement IA, feature séparée déjà
-- correcte, non touchée ici). Mêmes conventions RLS que public.comments.
create table public.live_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text,
  author_avatar text,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.live_messages enable row level security;

create policy live_messages_select on public.live_messages
  for select using (public.can_view_live_session(session_id));

create policy live_messages_insert_own on public.live_messages
  for insert with check (
    author_id = (select auth.uid())
    and public.can_view_live_session(session_id)
  );

create policy live_messages_delete_own_or_host on public.live_messages
  for delete using (
    author_id = (select auth.uid())
    or public.is_live_host(session_id)
  );

create index live_messages_session_id_idx on public.live_messages (session_id, created_at);

-- 3. Réactions ponctuelles (tap emoji pendant le LIVE) — journal d'événements
-- append-only (un utilisateur peut réagir plusieurs fois pendant un même
-- LIVE, contrairement à post_reactions qui est un état courant unique par
-- post/utilisateur) ; colonne `type` nommée comme post_reactions pour
-- rester cohérent avec la convention existante.
create table public.live_reactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now()
);

alter table public.live_reactions enable row level security;

create policy live_reactions_select on public.live_reactions
  for select using (public.can_view_live_session(session_id));

create policy live_reactions_insert_own on public.live_reactions
  for insert with check (
    user_id = (select auth.uid())
    and public.can_view_live_session(session_id)
  );

create index live_reactions_session_id_idx on public.live_reactions (session_id, created_at);
