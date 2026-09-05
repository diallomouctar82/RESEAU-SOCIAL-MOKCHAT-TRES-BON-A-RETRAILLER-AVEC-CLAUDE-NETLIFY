-- Réglages partagés de la plateforme — 5 septembre 2026.
--
-- Constat : les réglages de la console Super-Admin ne vivaient que dans le
-- navigateur de l'administrateur (localStorage) ; `savePlatformSettings` était
-- un stub sans table. L'avatar vivant de l'Architecte, créé ou remplacé depuis
-- une photo par la Direction (DEC-2026-077), ne pouvait donc pas s'appliquer à
-- tous les membres.
--
-- Cette migration crée une table clé → JSON. Premier réglage porté :
-- `architecte_avatar` (écrit à chaque validation dans l'onglet Super-Admin
-- « Avatar de l'Architecte », lu par l'application au démarrage, la version la
-- plus récente gagne). Sans cette table, l'application continue avec ses
-- réglages locaux (dégradation silencieuse côté client, aucune erreur visible).
--
-- Droits : lecture pour tout compte authentifié (l'avatar est public dans
-- l'application) ; écriture réservée aux administrateurs (`public.is_admin()`,
-- même garde que la Santé Globale — en production le rang est porté par le
-- rôle `admin` : 0 profil `super_admin` mesuré le 05/09/2026).
-- Retour arrière : supabase/rollback/20260905160000_platform_settings_rollback.sql

create table if not exists public.platform_settings (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users (id) on delete set null
);

comment on table public.platform_settings is
    'Réglages partagés de la plateforme (clé → JSON). Lecture : comptes authentifiés ; écriture : administrateurs (public.is_admin()).';

alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_lecture_authentifies on public.platform_settings;
create policy platform_settings_lecture_authentifies
    on public.platform_settings
    for select
    to authenticated
    using (true);

drop policy if exists platform_settings_ecriture_administrateurs on public.platform_settings;
create policy platform_settings_ecriture_administrateurs
    on public.platform_settings
    for all
    to authenticated
    using (auth.uid() is not null and public.is_admin())
    with check (auth.uid() is not null and public.is_admin());

grant select on public.platform_settings to authenticated;
grant insert, update on public.platform_settings to authenticated;
