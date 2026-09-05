-- LOOP 13/17 (Mémoire contextuelle : durabilité & contrôle utilisateur)
-- "Jamais deux règles actives de même portée en conflit" (principe du lot
-- d'origine) ne s'applique qu'aux scopes de type PRÉFÉRENCE — une
-- contrainte globale (LOOP 12/17) aurait fusionné à tort l'historique
-- légitime de project/recent_activity (ex. plusieurs tentatives d'examen).
-- Index unique PARTIEL : une correction sur une préférence/mémoire
-- explicite REMPLACE la valeur existante ; l'historique de projet/activité
-- reste, lui, non contraint.
create unique index user_memory_preference_key_idx
    on public.user_memory (user_id, scope, category, key)
    where scope in ('durable_preference', 'explicit') and status = 'active';

-- Multi-appareils : jusqu'ici seules `notifications`/`messages` étaient
-- dans la publication Realtime — un ajout/une modification de mémoire sur
-- un appareil n'apparaissait jamais en direct sur un second appareil
-- déjà ouvert (ex. ExpertsHub.tsx sur deux onglets).
alter publication supabase_realtime add table public.user_memory;
