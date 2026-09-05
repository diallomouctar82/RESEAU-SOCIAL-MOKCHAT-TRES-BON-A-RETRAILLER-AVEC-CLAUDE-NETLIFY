-- ============================================================================
-- REQUÊTES DE RELEVÉ DE LA STRUCTURE — kit de sauvegarde MokNet
-- Ce sont exactement les requêtes (lecture seule, catalogues Postgres) qui ont
-- produit supabase/releve/*.json le 5 septembre 2026. À rejouer sur le projet
-- (éditeur SQL, `psql`, ou API de gestion POST /v1/projects/{ref}/database/query)
-- pour rafraîchir le relevé. Aucune requête ne lit vault.decrypted_secrets ni
-- une table applicative : seuls des NOMS de secrets sont relevés.
-- ============================================================================

-- A. Historique complet des migrations AVEC leurs instructions SQL
--    → supabase/migrations/<version>_<name>.sql
select version, name, array_to_string(statements, E'\n') as sql
from supabase_migrations.schema_migrations order by version;

-- B. Politiques RLS (public + storage) → releve/policies.json
select schemaname, tablename, policyname, permissive, roles::text as roles, cmd, qual, with_check
from pg_policies where schemaname in ('public','storage') order by schemaname, tablename, policyname;

-- C. Fonctions du schéma public (définition complète) → releve/functions.json
select n.nspname as schema, p.proname as name, p.prokind,
       pg_get_function_identity_arguments(p.oid) as args, pg_get_functiondef(p.oid) as def
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by p.proname;

-- D. Contraintes, index, déclencheurs, vues, état RLS, énumérations → releve/objets.json
select 'constraint' as kind, conrelid::regclass::text as tbl, conname as name, pg_get_constraintdef(oid) as def
  from pg_constraint where connamespace = 'public'::regnamespace and contype in ('f','c','u','p','x')
union all select 'index', tablename, indexname, indexdef from pg_indexes where schemaname = 'public'
union all select 'trigger', tgrelid::regclass::text, tgname, pg_get_triggerdef(oid) from pg_trigger
  where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace = 'public'::regnamespace)
union all select 'view', schemaname||'.'||viewname, viewname, definition from pg_views where schemaname = 'public'
union all select 'rls', relname, case when relrowsecurity then 'enabled' else 'disabled' end,
  case when relforcerowsecurity then 'forced' else '' end from pg_class
  where relnamespace = 'public'::regnamespace and relkind in ('r','p')
union all select 'enum', n.nspname, t.typname, string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder)
  from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' group by n.nspname, t.typname
order by 1,2,3;

-- E. Complément → releve/complement.json : schémas, déclencheur sur auth.users, droits et
--    mode de sécurité des fonctions, privilèges par défaut, séquences, commentaires,
--    objets du schéma private, extensions, tâches cron, buckets, publication realtime,
--    NOMS des secrets du coffre, estimation du nombre de lignes par table.
select 'schema' as kind, nspname::text as name, ''::text as info from pg_namespace
  where nspname not in ('pg_catalog','information_schema','pg_toast') and nspname not like 'pg_temp%' and nspname not like 'pg_toast%'
union all select 'auth_trigger', tgname::text, pg_get_triggerdef(t.oid) from pg_trigger t
  where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace = 'auth'::regnamespace)
union all select 'func_acl', (p.proname||'('||pg_get_function_identity_arguments(p.oid)||')')::text, coalesce(p.proacl::text,'(default)')
  from pg_proc p where p.pronamespace = 'public'::regnamespace
union all select 'func_security', (p.proname||'('||pg_get_function_identity_arguments(p.oid)||')')::text,
  (case when p.prosecdef then 'SECURITY DEFINER' else 'SECURITY INVOKER' end)||' | config='||coalesce(array_to_string(p.proconfig, ';'),'')
  from pg_proc p where p.pronamespace = 'public'::regnamespace
union all select 'domain_or_composite', t.typname::text, t.typtype::text from pg_type t
  where t.typnamespace = 'public'::regnamespace and t.typtype in ('d','c')
  and not exists (select 1 from pg_class c where c.reltype = t.oid and c.relkind in ('r','v','m','p'))
union all select 'default_privileges', (coalesce(r.rolname::text,'(all)')||' in '||coalesce(n.nspname::text,'(all)')),
  (d.defaclobjtype::text||' '||d.defaclacl::text) from pg_default_acl d
  left join pg_roles r on r.oid = d.defaclrole left join pg_namespace n on n.oid = d.defaclnamespace
  where n.nspname in ('public','storage')
union all select 'sequence', sequencename::text, data_type::text from pg_sequences where schemaname = 'public'
union all select 'matview', matviewname::text, definition from pg_matviews where schemaname = 'public'
union all select 'table_comment', c.relname::text, obj_description(c.oid) from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and obj_description(c.oid) is not null
union all select 'column_comment', (c.relname||'.'||a.attname)::text, col_description(c.oid, a.attnum)
  from pg_class c join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and col_description(c.oid, a.attnum) is not null
union all select 'private_schema_object', c.relname::text, c.relkind::text from pg_class c where c.relnamespace = 'private'::regnamespace
union all select 'private_schema_function', p.proname::text, pg_get_functiondef(p.oid) from pg_proc p where p.pronamespace = 'private'::regnamespace
union all select 'extension', extname::text, extversion||' in '||n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace
union all select 'cron_job', jobname::text, jsonb_build_object('schedule', schedule, 'active', active, 'command', command)::text from cron.job
union all select 'bucket', id::text, jsonb_build_object('public', public, 'file_size_limit', file_size_limit, 'allowed_mime_types', allowed_mime_types)::text from storage.buckets
union all select 'realtime_publication', (schemaname||'.'||tablename)::text, pubname::text from pg_publication_tables where pubname = 'supabase_realtime'
union all select 'vault_secret_name_only', name::text, coalesce(description,'') from vault.secrets
union all select 'table_rows_estimate', relname::text, n_live_tup::text from pg_stat_user_tables where schemaname = 'public'
order by 1,2;

-- F. Tables et colonnes (relevé produit par l'outil `list_tables` du serveur MCP Supabase,
--    schéma public, mode détaillé) → releve/tables.json. Équivalent SQL :
select c.relname as table_name, a.attname as column_name, format_type(a.atttypid, a.atttypmod) as data_type,
       not a.attnotnull as nullable, pg_get_expr(d.adbin, d.adrelid) as default_value
from pg_class c join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' order by 1, a.attnum;
