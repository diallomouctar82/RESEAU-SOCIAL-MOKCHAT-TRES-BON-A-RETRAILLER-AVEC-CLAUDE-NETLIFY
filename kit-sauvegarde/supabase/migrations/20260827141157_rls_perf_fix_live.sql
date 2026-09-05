
drop policy "live_sessions_select_visible" on public.live_sessions;
create policy "live_sessions_select_visible" on public.live_sessions
for select to authenticated using (is_private = false or host_id = (select auth.uid()) or public.is_admin()
  or exists (select 1 from public.live_speakers sp where sp.session_id = id and sp.user_id = (select auth.uid()))
  or exists (select 1 from public.live_attendance a where a.session_id = id and a.participant_id = (select auth.uid())));
drop policy "live_sessions_insert_own" on public.live_sessions;
create policy "live_sessions_insert_own" on public.live_sessions for insert to authenticated with check (host_id = (select auth.uid()));

drop policy "live_speakers_write_host" on public.live_speakers;
create policy "live_speakers_write_host" on public.live_speakers for all to authenticated
using (public.is_live_host(session_id) or user_id = (select auth.uid())) with check (public.is_live_host(session_id) or user_id = (select auth.uid()));

drop policy "live_attendance_upsert_own" on public.live_attendance;
create policy "live_attendance_upsert_own" on public.live_attendance for insert to authenticated with check (participant_id = (select auth.uid()));
drop policy "live_attendance_update_own_or_host" on public.live_attendance;
create policy "live_attendance_update_own_or_host" on public.live_attendance for update to authenticated
using (participant_id = (select auth.uid()) or public.is_live_host(session_id)) with check (participant_id = (select auth.uid()) or public.is_live_host(session_id));

drop policy "live_questions_insert" on public.live_questions;
create policy "live_questions_insert" on public.live_questions for insert to authenticated with check (author_id = (select auth.uid()) and public.can_view_live_session(session_id));
drop policy "live_questions_update_own_or_host" on public.live_questions;
create policy "live_questions_update_own_or_host" on public.live_questions for update to authenticated
using (author_id = (select auth.uid()) or public.is_live_host(session_id)) with check (author_id = (select auth.uid()) or public.is_live_host(session_id));

drop policy "live_question_upvotes_insert_own" on public.live_question_upvotes;
create policy "live_question_upvotes_insert_own" on public.live_question_upvotes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy "live_question_upvotes_delete_own" on public.live_question_upvotes;
create policy "live_question_upvotes_delete_own" on public.live_question_upvotes for delete to authenticated using (user_id = (select auth.uid()));

drop policy "live_poll_votes_insert_own" on public.live_poll_votes;
create policy "live_poll_votes_insert_own" on public.live_poll_votes for insert to authenticated with check (user_id = (select auth.uid()));

drop policy "live_personal_notes_owner_only" on public.live_personal_notes;
create policy "live_personal_notes_owner_only" on public.live_personal_notes for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "live_gifts_sent_insert_own" on public.live_gifts_sent;
create policy "live_gifts_sent_insert_own" on public.live_gifts_sent for insert to authenticated with check (sender_id = (select auth.uid()));

drop policy "live_whiteboard_insert" on public.live_whiteboard_strokes;
create policy "live_whiteboard_insert" on public.live_whiteboard_strokes for insert to authenticated with check (author_id = (select auth.uid()) and public.can_view_live_session(session_id));

-- is_admin() elle-même appelle auth.uid() en interne : elle est
-- SQL + stable, donc déjà planifiée une seule fois par le
-- planneur (ce n'est pas un appel direct dans le texte de la
-- policy) — aucun changement nécessaire ici.
