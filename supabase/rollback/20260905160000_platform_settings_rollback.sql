-- Retour arrière de 20260905160000_platform_settings.sql : supprime la table
-- des réglages partagés. L'application retombe sur ses réglages locaux
-- (dégradation silencieuse déjà en place côté client).
drop policy if exists platform_settings_ecriture_administrateurs on public.platform_settings;
drop policy if exists platform_settings_lecture_authentifies on public.platform_settings;
drop table if exists public.platform_settings;
