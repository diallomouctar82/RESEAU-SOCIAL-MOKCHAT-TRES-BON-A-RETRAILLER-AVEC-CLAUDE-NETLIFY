-- ============================================================================
-- PRÉREQUIS AVANT LA PREMIÈRE MIGRATION — kit de sauvegarde MokNet
-- Relevé sur le projet de production le 5 septembre 2026 (pg_extension) :
-- ces extensions sont installées en production mais AUCUNE migration ne les
-- crée (seule `unaccent` est créée par 20260829180823). Sans `pg_cron`, cinq
-- migrations (cron.schedule) échouent ; sans `pgcrypto`, `gen_random_uuid()`
-- reste disponible (natif Postgres 13+) mais les migrations l'attendent dans
-- `extensions`. Idempotent : peut être rejoué sans effet.
-- Aucune donnée, aucun secret.
-- ============================================================================
create extension if not exists pg_cron;                         -- 1.6.4 en production (schéma pg_catalog)
create extension if not exists pgcrypto with schema extensions;  -- 1.3
create extension if not exists "uuid-ossp" with schema extensions; -- 1.1
create extension if not exists supabase_vault;                  -- 0.3.1 (schéma vault) — coffre des clés
create extension if not exists pg_graphql;                      -- 1.5.11 (schéma graphql) — défaut Supabase
create extension if not exists pg_stat_statements with schema extensions; -- 1.11 — défaut Supabase
create extension if not exists wrappers with schema extensions; -- 0.5.6 — présent en production, aucun usage relevé dans le code
-- `unaccent` est créée par la migration 20260829180823_search_engine_loop11_17_unaccent_and_rpc.
-- Le schéma `private` est créé par la migration 20260828051018_finalize_mokchat_conversations_text.
-- Droits pg_cron pour le rôle postgres (défaut Supabase, rappelé ici) :
grant usage on schema cron to postgres;
