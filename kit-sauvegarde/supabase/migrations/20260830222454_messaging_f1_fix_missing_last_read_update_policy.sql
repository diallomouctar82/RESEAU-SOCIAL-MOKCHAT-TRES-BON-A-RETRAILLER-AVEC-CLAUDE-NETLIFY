-- Équipe F1 : `conversation_participants` n'a JAMAIS eu de policy UPDATE —
-- markConversationRead (écrit last_read_at à l'ouverture d'une conversation)
-- ne mettait à jour AUCUNE ligne, silencieusement, depuis l'origine : l'état
-- « Lu » et la remise à zéro serveur des non-lus étaient donc impossibles
-- pour tout utilisateur réel. Même classe de défaut que le correctif
-- profiles (LOOP 09/17, grant/policy UPDATE manquants).
-- Le grant UPDATE global existait ; on le RESTREINT à la seule colonne
-- last_read_at (un membre ne doit jamais pouvoir changer son member_role
-- lui-même), et la policy limite à SA propre ligne.
revoke update on public.conversation_participants from authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;

create policy conversation_participants_update_own_read_marker
  on public.conversation_participants
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
