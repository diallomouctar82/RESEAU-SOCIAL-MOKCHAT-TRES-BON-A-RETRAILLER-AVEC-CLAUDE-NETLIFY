-- LOOP 12/17 (suite) : ajustement découvert en analysant les 5 VRAIS
-- appelants existants de `services/memory.ts::addOrUpdateMemory`
-- (ExpertsHub.tsx x2, ParcoursDetailView.tsx, dossierService.ts,
-- WorldHub.tsx en lecture) avant de les migrer de `localStorage` vers cette
-- table : aucun des 5 appels réels ne repasse jamais un `id` existant — ce
-- sont donc TOUJOURS des insertions distinctes (un historique, ex. deux
-- tentatives d'examen avec la même catégorie/clé doivent rester deux
-- lignes), jamais une mise à jour par clé naturelle. La contrainte
-- UNIQUE(scope,category,key) de la migration précédente aurait fusionné à
-- tort ces entrées d'historique légitimement distinctes.
alter table public.user_memory drop constraint user_memory_user_id_scope_category_key_key;

-- Champs réellement envoyés par les appelants existants (jamais un JSON
-- fourre-tout : chacun a sa colonne typée). `agent_id`/`dossier_id` restent
-- du texte libre sans clé étrangère : `dossierId` provient de
-- `dossierService.ts`, confirmé 100% `localStorage` (pas de table
-- `dossiers` réelle correspondante) — une FK serait fausse.
alter table public.user_memory
    add column agent_id text,
    add column dossier_id text,
    add column layer text check (layer in ('personal','parcours','learning','documentary','conversational')),
    add column verified boolean not null default true;
