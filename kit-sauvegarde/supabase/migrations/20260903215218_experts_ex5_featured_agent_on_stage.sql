-- EX-5 : « mettre l'expert en avant, puis le faire redescendre ».
--
-- La mise en avant doit être PARTAGÉE : si elle vivait dans l'état React de
-- l'animateur, lui seul verrait l'expert au premier plan — exactement le
-- défaut que cette mission corrige partout ailleurs.
--
-- Colonne additive sur la session : aucune policy nouvelle n'est nécessaire,
-- `live_sessions_update_host` réserve déjà l'écriture à l'animateur, et
-- `live_sessions_select` / can_view_live_session laissent déjà les
-- participants lire la ligne. La clé étrangère garantit qu'on ne met jamais
-- en avant un expert qui n'existe pas ; `on delete set null` évite qu'une
-- suppression d'agent bloque la session.
alter table public.live_sessions
  add column if not exists featured_agent_id text
    references public.agents(id) on delete set null;

comment on column public.live_sessions.featured_agent_id is
  'EX-5 — expert actuellement mis en avant sur la scène (première carte, jamais
   relégué au débordement). NULL = personne en avant. Écriture réservée à
   l''animateur par live_sessions_update_host ; lu par tous les participants,
   ce qui rend la mise en avant identique sur tous les écrans.';
