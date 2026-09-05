-- LOOP 08/14 : cinq univers visuels (prompt 3/7) — une architecture, pas cinq
-- interfaces. Le choix d'univers est un réglage de scène (Avancé, hôte
-- uniquement) qui doit changer l'expérience pour TOUS les spectateurs, donc
-- persisté sur la session (pas un état local par client) et diffusé en
-- temps réel comme le reste des réglages de session.
alter table public.live_sessions
  add column visual_universe text not null default 'crystal'
    check (visual_universe in ('crystal', 'futuristic_blue', 'natural_fresh', 'violet_luxe', 'deep_ocean'));

comment on column public.live_sessions.visual_universe is
  'Univers visuel actif (prompt 3/7) : crystal (référence, Glassmorphism Crystal
   Water), futuristic_blue, natural_fresh, violet_luxe, deep_ocean. Modifiable
   par l''hôte uniquement (live_sessions_update_host) — s''applique à tous les
   participants via Supabase Realtime (postgres_changes UPDATE) sur cette table.';

-- live_sessions n'était pas encore dans la publication Realtime (seuls
-- live_messages/live_reactions/live_speakers l'avaient été au LOOP 05/14) —
-- nécessaire pour que le changement d'univers de l'hôte se propage en direct.
alter publication supabase_realtime add table public.live_sessions;
