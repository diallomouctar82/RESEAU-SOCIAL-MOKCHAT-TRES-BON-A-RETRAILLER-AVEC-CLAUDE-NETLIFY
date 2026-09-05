-- CORRECTIF de l'anomalie 42501 documentée depuis la LOOP 15/17 (mission
-- Architecte MOCnet) et reproduite par le contrôle du 30/08/2026 :
-- `INSERT ... RETURNING` (PostgREST `return=representation`, utilisé par
-- `liveSessionService.createLiveSession`) évalue la policy SELECT sur la
-- ligne fraîche. Or `can_view_live_session(id)` RELIT la table — et une
-- ligne insérée par la commande en cours n'est pas encore visible dans
-- l'instantané de cette même commande : exists() = faux → 42501, alors que
-- la policy INSERT elle-même passait (d'où le diagnostic impossible de
-- l'époque : « le prédicat s'évalue à true et pourtant RLS échoue »).
-- Correctif : tester la COLONNE de la ligne directement, puis la fonction.
-- Sémantique inchangée en lecture normale (la fonction accordait déjà la
-- visibilité à l'hôte) ; seule la ligne en cours d'insertion devient
-- correctement visible pour son propre hôte.
ALTER POLICY live_sessions_select_visible ON public.live_sessions
  USING (host_id = auth.uid() OR public.can_view_live_session(id));
