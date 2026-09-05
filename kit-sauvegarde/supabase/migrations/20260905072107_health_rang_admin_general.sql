-- Santé Globale — 5 septembre 2026 : deux compteurs de plus dans la sonde de
-- catalogue (superAdminCount, adminCount). Aucun droit, aucune donnée touchée.
-- Même garde (health_require_admin), même signature, même search_path figé.

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
        'creditForgeryOpen', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                               where n.nspname = 'public' and p.proname = 'award_xp_and_credits'
                                 and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        'walletWriteOpen', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                             where n.nspname = 'public' and p.proname = 'insert_wallet_transaction'
                               and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        'aiSpendOpen', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = 'get_ai_spend'
                           and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        'vaultLeaks', (select coalesce(jsonb_agg(p.proname order by p.proname), '[]'::jsonb)
                        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                       where n.nspname = 'public' and p.proname like '%\_internal'
                         and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
        'mutableSearchPath', (select coalesce(jsonb_agg(p.proname order by p.proname), '[]'::jsonb)
                               from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                              where n.nspname = 'public' and p.prosecdef and p.prokind = 'f'
                                and p.proconfig is null),
        'roleGuardEnabled', (select count(*) > 0 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                              where c.relname = 'profiles' and t.tgname = 'trg_profiles_protect_sensitive'
                                and t.tgenabled = 'O'),
        'anonReadableTables', (select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
                                from pg_class c join pg_namespace n on n.oid = c.relnamespace
                               where n.nspname = 'public' and c.relkind = 'r'
                                 and has_table_privilege('anon', c.oid, 'SELECT')),
        'foreignKeys', (select coalesce(jsonb_agg(con.conname order by con.conname), '[]'::jsonb)
                         from pg_constraint con join pg_namespace n on n.oid = con.connamespace
                        where n.nspname = 'public' and con.contype = 'f'),
        'rlsNoPolicy', (select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb)
                         from pg_class c join pg_namespace n on n.oid = c.relnamespace
                        where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
                          and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
        'auditLogPresent', (select count(*) > 0 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                             where n.nspname = 'public' and c.relname = 'audit_logs'),
        'superAdminCount', (select count(*) from public.profiles where role = 'super_admin'),
        'adminCount', (select count(*) from public.profiles where role = 'admin')
    ) into v_result;

    return v_result;
end;
$$;
