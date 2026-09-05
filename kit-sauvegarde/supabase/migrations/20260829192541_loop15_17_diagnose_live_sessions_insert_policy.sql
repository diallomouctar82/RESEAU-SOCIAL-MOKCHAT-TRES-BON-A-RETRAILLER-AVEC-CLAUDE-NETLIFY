
-- Diagnostic LOOP 15/17 : recréation à l'identique (même prédicat, aucun
-- changement de sémantique) de live_sessions_insert_own pour vérifier une
-- hypothèse de catalogue RLS obsolète après les nombreuses migrations
-- ALTER TABLE de la mission LIVE (16 LOOP) précédente.
drop policy if exists live_sessions_insert_own on public.live_sessions;
create policy live_sessions_insert_own on public.live_sessions
  for insert
  to authenticated
  with check (host_id = auth.uid());
