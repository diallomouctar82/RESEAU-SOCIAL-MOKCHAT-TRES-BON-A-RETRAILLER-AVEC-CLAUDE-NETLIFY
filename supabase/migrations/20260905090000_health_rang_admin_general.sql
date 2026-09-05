-- Santé Globale — 5 septembre 2026 : la base dit combien de comptes portent
-- le rang Admin Général (`super_admin`).
--
-- Constat : réparer et restaurer exigent `super_admin` (health_require_general_admin),
-- mais AUCUN profil ne le porte en production (mesuré le 05/09/2026 : 14 `user`,
-- 1 `admin`, 0 `super_admin`). L'application déduit son « Super-Admin » d'une
-- adresse e-mail écrite en dur (constat J-01b de l'audit), que la base ignore.
-- Résultat : toutes les réparations restent en « Diagnostic seulement » pour
-- tout le monde, et rien ne le disait.
--
-- Cette migration ne change AUCUN droit et n'écrit AUCUNE donnée : elle ajoute
-- deux compteurs à la sonde de catalogue, pour que la ligne
-- « gouvernance.rang_admin_general » puisse être mesurée au lieu de rester
-- blanche. Même garde (`health_require_admin`), même signature, même chemin de
-- recherche figé. Retour arrière : supabase/rollback/20260905090000_health_rang_admin_general_rollback.sql
-- (rejoue la version précédente de la fonction).

create or replace function public.health_probe_catalogue()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_result jsonb;
begin
    perform public.health_require_admin();

    select jsonb_build_object(
        'tablesTotal', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                         where n.nspname = 'public' and c.relkind = 'r'),
        'tablesWithRls', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                           where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity),
        'tablesWithoutRls', (select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
                              from pg_class c join pg_namespace n on n.oid = c.relnamespace
                             where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),

        -- Forge de crédits (R-01) et écriture directe du portefeuille (R-03).
        'creditForgeryOpen', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                               where n.nspname = 'public' and p.proname = 'award_xp_and_credits'
                                 and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        'walletWriteOpen', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                             where n.nspname = 'public' and p.proname = 'insert_wallet_transaction'
                               and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        'aiSpendOpen', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = 'get_ai_spend'
                           and has_function_privilege('authenticated', p.oid, 'EXECUTE')),

        -- Le coffre : aucune fonction `*_internal` ne doit être atteignable
        -- depuis une session utilisateur.
        'vaultLeaks', (select coalesce(jsonb_agg(p.proname order by p.proname), '[]'::jsonb)
                        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public' and p.proname like '%\_internal'
                         and has_function_privilege('authenticated', p.oid, 'EXECUTE')),

        -- Chemin de recherche libre sur une fonction privilégiée.
        'mutableSearchPath', (select coalesce(jsonb_agg(p.proname order by p.proname), '[]'::jsonb)
                               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                              where n.nspname = 'public' and p.prosecdef and p.prokind = 'f'
                                and p.proconfig is null),

        -- Garde anti-élévation de rôle.
        'roleGuardEnabled', (select count(*) > 0 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                              where c.relname = 'profiles' and t.tgname = 'trg_profiles_protect_sensitive'
                                and t.tgenabled = 'O'),

        -- Portée du rôle anonyme.
        'anonReadableTables', (select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
                                from pg_class c join pg_namespace n on n.oid = c.relnamespace
                               where n.nspname = 'public' and c.relkind = 'r'
                                 and has_table_privilege('anon', c.oid, 'SELECT')),

        -- Contraintes d'intégrité dont dépendent les lignes « orphelins ».
        'foreignKeys', (select coalesce(jsonb_agg(con.conname order by con.conname), '[]'::jsonb)
                         from pg_constraint con join pg_namespace n on n.oid = con.connamespace
                        where n.nspname = 'public' and con.contype = 'f'),

        -- Tables protégées par RLS mais SANS aucune politique : elles refusent
        -- tout le monde. Voulu pour un coffre, muet et invisible ailleurs.
        'rlsNoPolicy', (select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
                         from pg_class c join pg_namespace n on n.oid = c.relnamespace
                        where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
                          and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),

        'auditLogPresent', (select count(*) > 0 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                             where n.nspname = 'public' and c.relname = 'audit_logs'),

        -- 05/09/2026 — le rang Admin Général est-il porté par quelqu'un ? Des
        -- COMPTES, jamais des noms : la sonde ne dit pas qui, elle dit combien.
        'superAdminCount', (select count(*) from public.profiles where role = 'super_admin'),
        'adminCount', (select count(*) from public.profiles where role = 'admin')
    ) into v_result;

    return v_result;
end;
$$;
