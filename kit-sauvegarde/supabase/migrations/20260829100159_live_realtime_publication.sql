-- LOOP 05/14 — les tables live_messages/live_reactions/live_speakers
-- n'étaient pas enregistrées dans la publication supabase_realtime (à la
-- différence de messages/notifications, déjà présentes) : les abonnements
-- Realtime (subscribeToLiveMessages/Reactions/SpeakerChanges) n'auraient
-- reçu aucun événement malgré un code client correct — trouvé en vérifiant
-- avant de considérer le câblage temps réel terminé.
alter publication supabase_realtime add table public.live_messages, public.live_reactions, public.live_speakers;
