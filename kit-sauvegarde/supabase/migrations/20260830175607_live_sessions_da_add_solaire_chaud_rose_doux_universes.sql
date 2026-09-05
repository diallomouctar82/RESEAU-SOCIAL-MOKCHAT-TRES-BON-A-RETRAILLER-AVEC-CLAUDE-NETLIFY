-- Direction artistique Studio Live (30/08/2026, image de référence aux 7
-- verres d'eau) : deux univers visuels supplémentaires, solaire_chaud (4)
-- et rose_doux (7), rejoignent les 5 existants. Purement additif — aucune
-- valeur existante n'est invalidée.
alter table public.live_sessions
  drop constraint live_sessions_visual_universe_check;
alter table public.live_sessions
  add constraint live_sessions_visual_universe_check
  check (visual_universe = any (array[
    'crystal'::text, 'futuristic_blue'::text, 'natural_fresh'::text,
    'solaire_chaud'::text, 'violet_luxe'::text, 'deep_ocean'::text, 'rose_doux'::text
  ]));
