
-- ═══════════════════════════════════════════════════════════
-- Optimisation RLS (recommandation Supabase) : auth.uid()/auth.role()
-- appelés directement dans une policy sont réévalués PAR LIGNE.
-- Les envelopper en (select auth.uid()) les rend "stable" pour toute
-- la requête (planifiés une seule fois). Comportement identique,
-- juste plus rapide à l'échelle. DROP+CREATE nécessaire (Postgres
-- n'autorise pas l'ALTER d'une expression de policy existante).
-- ═══════════════════════════════════════════════════════════

-- profiles
drop policy "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
drop policy "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated
using ((select auth.uid()) = id or public.is_admin()) with check ((select auth.uid()) = id or public.is_admin());

-- profile_skills
drop policy "profile_skills_select_own_or_admin" on public.profile_skills;
create policy "profile_skills_select_own_or_admin" on public.profile_skills for select to authenticated using ((select auth.uid()) = profile_id or public.is_admin());
drop policy "profile_skills_write_own" on public.profile_skills;
create policy "profile_skills_write_own" on public.profile_skills for insert to authenticated with check ((select auth.uid()) = profile_id);
drop policy "profile_skills_update_own" on public.profile_skills;
create policy "profile_skills_update_own" on public.profile_skills for update to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
drop policy "profile_skills_delete_own" on public.profile_skills;
create policy "profile_skills_delete_own" on public.profile_skills for delete to authenticated using ((select auth.uid()) = profile_id);

-- profile_badges
drop policy "profile_badges_select_own_or_admin" on public.profile_badges;
create policy "profile_badges_select_own_or_admin" on public.profile_badges for select to authenticated using ((select auth.uid()) = profile_id or public.is_admin());
drop policy "profile_badges_write_own" on public.profile_badges;
create policy "profile_badges_write_own" on public.profile_badges for insert to authenticated with check ((select auth.uid()) = profile_id);
drop policy "profile_badges_delete_own" on public.profile_badges;
create policy "profile_badges_delete_own" on public.profile_badges for delete to authenticated using ((select auth.uid()) = profile_id);

-- posts
drop policy "posts_select_visible" on public.posts;
create policy "posts_select_visible" on public.posts for select to authenticated using (visibility = 'public' or author_id = (select auth.uid()) or public.is_admin());
drop policy "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated with check (author_id = (select auth.uid()));
drop policy "posts_update_own_or_admin" on public.posts;
create policy "posts_update_own_or_admin" on public.posts for update to authenticated using (author_id = (select auth.uid()) or public.is_admin()) with check (author_id = (select auth.uid()) or public.is_admin());
drop policy "posts_delete_own_or_admin" on public.posts;
create policy "posts_delete_own_or_admin" on public.posts for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

-- post_documents
drop policy "post_documents_write_if_post_owner" on public.post_documents;
create policy "post_documents_write_if_post_owner" on public.post_documents for all to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

-- comments
drop policy "comments_insert_if_post_visible" on public.comments;
create policy "comments_insert_if_post_visible" on public.comments for insert to authenticated with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.posts p where p.id = post_id and (p.visibility = 'public' or p.author_id = (select auth.uid()) or public.is_admin()))
);
drop policy "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy "comments_delete_own_or_admin" on public.comments;
create policy "comments_delete_own_or_admin" on public.comments for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

-- post_reactions
drop policy "post_reactions_insert_own" on public.post_reactions;
create policy "post_reactions_insert_own" on public.post_reactions for insert to authenticated with check (user_id = (select auth.uid()));
drop policy "post_reactions_delete_own" on public.post_reactions;
create policy "post_reactions_delete_own" on public.post_reactions for delete to authenticated using (user_id = (select auth.uid()));

-- stories
drop policy "stories_insert_own" on public.stories;
create policy "stories_insert_own" on public.stories for insert to authenticated with check (author_id = (select auth.uid()));
drop policy "stories_update_own" on public.stories;
create policy "stories_update_own" on public.stories for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy "stories_delete_own_or_admin" on public.stories;
create policy "stories_delete_own_or_admin" on public.stories for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

-- conversations
drop policy "conversations_select_if_participant" on public.conversations;
create policy "conversations_select_if_participant" on public.conversations for select to authenticated using (
  exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = (select auth.uid()))
);
drop policy "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations for insert to authenticated with check (created_by = (select auth.uid()));

-- conversation_participants
drop policy "conversation_participants_select_if_participant" on public.conversation_participants;
create policy "conversation_participants_select_if_participant" on public.conversation_participants for select to authenticated using (
  exists (select 1 from public.conversation_participants cp2 where cp2.conversation_id = conversation_id and cp2.user_id = (select auth.uid()))
);
drop policy "conversation_participants_insert_if_member_or_self" on public.conversation_participants;
create policy "conversation_participants_insert_if_member_or_self" on public.conversation_participants for insert to authenticated with check (
  user_id = (select auth.uid())
  or exists (select 1 from public.conversation_participants cp2 where cp2.conversation_id = conversation_id and cp2.user_id = (select auth.uid()))
  or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = (select auth.uid()))
);
drop policy "conversation_participants_delete_own" on public.conversation_participants;
create policy "conversation_participants_delete_own" on public.conversation_participants for delete to authenticated using (user_id = (select auth.uid()));

-- messages
drop policy "messages_select_if_participant" on public.messages;
create policy "messages_select_if_participant" on public.messages for select to authenticated using (
  exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = (select auth.uid()))
);
drop policy "messages_insert_if_participant" on public.messages;
create policy "messages_insert_if_participant" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = (select auth.uid()))
);
drop policy "messages_delete_own" on public.messages;
create policy "messages_delete_own" on public.messages for delete to authenticated using (sender_id = (select auth.uid()));

-- agent_chat_sessions / agent_chat_messages
drop policy "agent_chat_sessions_owner" on public.agent_chat_sessions;
create policy "agent_chat_sessions_owner" on public.agent_chat_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy "agent_chat_messages_owner" on public.agent_chat_messages;
create policy "agent_chat_messages_owner" on public.agent_chat_messages for all to authenticated using (
  exists (select 1 from public.agent_chat_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.agent_chat_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
);
