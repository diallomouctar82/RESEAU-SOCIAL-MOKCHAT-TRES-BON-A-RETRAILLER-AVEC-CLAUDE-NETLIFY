-- ─────────────────────────────────────────────────────────────────────────
-- RETOUR ARRIÈRE — Santé Globale MokNet (migration 20260904150000)
--
-- Ce script annule INTÉGRALEMENT le déploiement du 04/09/2026.
--
-- Pourquoi il est complet, et pas seulement « raisonnablement complet » :
-- la migration d'origine ne contient AUCUNE instruction qui touche un objet
-- préexistant. Vérifié instruction par instruction — les seules écritures
-- visent `public.health_snapshots`, une table créée par cette même migration
-- et qui n'existait pas avant. Aucun `alter` sur une table MokNet, aucun
-- `update`, aucun `delete`, aucune politique RLS modifiée ailleurs.
-- Supprimer ce que la migration a créé rend donc la base identique à son
-- état antérieur : il n'y a rien d'autre à restaurer.
--
-- Ce script NE supprime aucune donnée MokNet. `health_snapshots` ne contient
-- que des sauvegardes produites par les réparations ; si des réparations ont
-- été appliquées, les supprimer fait perdre la possibilité de les annuler —
-- restaurer AVANT de dérouler ce script (voir étape 0).
--
-- Étape 0 (facultative, à faire seulement si des réparations ont été jouées) :
--   select * from public.health_journal(200);            -- que s'est-il passé
--   select public.health_restore_snapshot('<id>');       -- annuler une action
--
-- Étape 1 : couper l'accès applicatif (console Supabase → Edge Functions)
--   supprimer la fonction « health-guardian ».
--   Sans elle, l'onglet Santé Globale n'affiche plus que des lignes BLANCHES
--   (« non éprouvé ») : il ne se casse pas, il dit honnêtement qu'il ne
--   mesure plus rien. C'est le comportement voulu.
--
-- Étape 2 : dérouler le SQL ci-dessous.
-- ─────────────────────────────────────────────────────────────────────────

begin;

-- Les fonctions d'abord : elles dépendent de la table.
drop function if exists public.health_apply_remediation(p_remediation_id text, p_line_id text);
drop function if exists public.health_diagnose_remediation(p_remediation_id text);
drop function if exists public.health_journal(p_limit integer);
drop function if exists public.health_my_rank();
drop function if exists public.health_probe_catalogue();
drop function if exists public.health_probe_data();
drop function if exists public.health_probe_operations();
drop function if exists public.health_purge_snapshots(p_older_than_days integer);
drop function if exists public.health_remediation_catalogue();
drop function if exists public.health_remediation_spec(p_remediation_id text);
drop function if exists public.health_require_admin();
drop function if exists public.health_require_general_admin();
drop function if exists public.health_restore_snapshot(p_snapshot_id uuid);

-- Puis le coffre. `restrict` (et non `cascade`) est délibéré : si un objet
-- inattendu s'était accroché à cette table, on veut une erreur bruyante,
-- pas une suppression silencieuse en chaîne.
drop table if exists public.health_snapshots restrict;

commit;

-- ─────────────────────────── CONTRÔLE APRÈS ───────────────────────────
-- Doit renvoyer 0 partout, et le nombre de tables publiques doit être
-- redescendu à 88 (89 avec le coffre).
--
--   select
--     (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--        where n.nspname = 'public' and p.proname like 'health\_%')  as fonctions_restantes,
--     (select count(*) from pg_tables
--        where schemaname = 'public' and tablename = 'health_snapshots') as coffre_restant,
--     (select count(*) from pg_tables where schemaname = 'public')      as tables_publiques;
