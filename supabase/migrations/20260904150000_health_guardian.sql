-- Santé globale MokNet — coffre de sauvegarde et catalogue FERMÉ de réparations.
--
-- Ce que cette migration installe :
--   1. `health_snapshots` : la sauvegarde prise AVANT chaque action, et la
--      seule source de la restauration.
--   2. Les sondes de lecture (`health_probe_*`) : introspection du catalogue
--      Postgres et comptages d'intégrité, impossibles depuis PostgREST.
--   3. Le catalogue de réparations : une liste FERMÉE, écrite ici, en code
--      relu. L'appelant n'envoie qu'un identifiant ; il ne peut ni composer
--      une requête, ni désigner une table, ni élargir une condition.
--
-- Règle de conception, tirée de l'audit du 04/09/2026 : la table cible et la
-- condition d'une réparation ne franchissent JAMAIS le réseau. Le seul
-- paramètre accepté est une clé du catalogue. C'est ce qui distingue une
-- console d'exploitation d'une porte dérobée d'exécution SQL.
--
-- Toutes les fonctions sont `SECURITY DEFINER` avec `search_path` figé et
-- refusent tout appelant non administrateur, y compris en lecture : les
-- sondes révèlent la structure de sécurité de la base.

-- ─────────────────────────── 1. COFFRE DE SAUVEGARDE ───────────────────────────

create table if not exists public.health_snapshots (
    id uuid primary key default gen_random_uuid(),
    remediation_id text not null,
    line_id text not null,
    actor_id uuid null references auth.users(id) on delete set null,
    kind text not null check (kind in ('delete', 'update', 'revoke_execute', 'revoke_select_anon')),
    -- Contenu sauvegardé : objet { "nom_de_table": [lignes...] }, dans
    -- l'ordre parent-d'abord, pour que la restauration réinsère sans violer
    -- les clés étrangères.
    payload jsonb not null default '{}'::jsonb,
    -- Ordre de restauration, figé au moment de la sauvegarde.
    restore_order text[] not null default '{}',
    row_count integer not null default 0,
    created_at timestamptz not null default now(),
    restored_at timestamptz null,
    restored_by uuid null references auth.users(id) on delete set null,
    -- Une sauvegarde de plusieurs mégaoctets signale une réparation dont le
    -- périmètre a dérapé : mieux vaut échouer bruyamment que stocker en silence.
    constraint health_snapshots_payload_size check (pg_column_size(payload) <= 8000000)
);

comment on table public.health_snapshots is
    'Sauvegarde prise avant chaque réparation de santé, et seule source de la restauration. Contient de vraies données applicatives (messages, abonnements) : jamais lisible hors service_role, et purgeable par health_purge_snapshots().';

create index if not exists health_snapshots_created_idx on public.health_snapshots (created_at desc);
create index if not exists health_snapshots_line_idx on public.health_snapshots (line_id, created_at desc);

alter table public.health_snapshots enable row level security;
-- Aucune policy, volontairement : refus par défaut pour `anon` comme pour
-- `authenticated`. Seules les fonctions SECURITY DEFINER ci-dessous et le
-- service_role y accèdent — même schéma que `ai_provider_credentials`.
revoke all on public.health_snapshots from anon, authenticated;

-- ─────────────────────────── 2. GARDE COMMUN ───────────────────────────

-- DEUX niveaux, délibérément distincts :
--
--   • LIRE (sondes, diagnostic, journal) → administrateur. Regarder l'état de
--     santé ne modifie rien ; le refuser à un admin rendrait le tableau de
--     bord inutile pour l'exploitation courante.
--
--   • ÉCRIRE (réparer, restaurer, purger) → Admin Général (`super_admin`)
--     UNIQUEMENT. `is_admin()` ne convient pas ici : il répond vrai pour
--     `admin` COMME pour `super_admin` (vérifié en base le 04/09/2026). Une
--     action qui modifie la production doit être réservée au rang le plus
--     élevé, pas au rang le plus large.

create or replace function public.health_require_admin()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    -- `auth.uid() is null` testé EN PREMIER et séparément : sans cela,
    -- l'expression entière vaut NULL pour un appelant anonyme et le garde ne
    -- se déclenche pas (logique ternaire SQL). Même piège que celui déjà
    -- corrigé dans award_xp_and_credits.
    if auth.uid() is null then
        raise exception 'Non autorisé : authentification requise.' using errcode = '42501';
    end if;
    if not public.is_admin() then
        raise exception 'Non autorisé : réservé aux administrateurs.' using errcode = '42501';
    end if;
end;
$$;

create or replace function public.health_require_general_admin()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if auth.uid() is null then
        raise exception 'Non autorisé : authentification requise.' using errcode = '42501';
    end if;
    if not exists (
        select 1 from public.profiles
         where id = auth.uid() and role = 'super_admin'
    ) then
        raise exception
            'Non autorisé : cette action est réservée à l''Admin Général (rôle super_admin).'
            using errcode = '42501';
    end if;
end;
$$;

/**
 * Rang de l'appelant, pour que l'interface sache quoi afficher AVANT de
 * proposer un bouton : un bouton qui échouera à coup sûr est un défaut
 * d'interface, pas une protection.
 */
create or replace function public.health_my_rank()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_role text;
begin
    if auth.uid() is null then
        return jsonb_build_object('role', null, 'canRead', false, 'canRepair', false);
    end if;
    select role into v_role from public.profiles where id = auth.uid();
    return jsonb_build_object(
        'role', v_role,
        'canRead', v_role in ('admin', 'super_admin'),
        'canRepair', v_role = 'super_admin');
end;
$$;

-- ─────────────────────────── 3. CATALOGUE DE RÉPARATIONS ───────────────────────────
--
-- Chaque entrée décrit une opération et rien d'autre. Les conditions sont des
-- littéraux écrits ici : elles ne peuvent pas être influencées depuis
-- l'extérieur. `steps` est ordonné PARENT D'ABORD — la sauvegarde capture
-- tous les niveaux, la suppression ne frappe que le premier (la cascade fait
-- le reste), et la restauration réinsère dans cet ordre.

create or replace function public.health_remediation_spec(p_remediation_id text)
returns jsonb
language sql
immutable
set search_path to 'public'
as $$
    select case p_remediation_id

        -- ── Sécurité : fermeture de droits (réversible par re-octroi) ──
        when 'securite.revoke_credit_forgery' then jsonb_build_object(
            'kind', 'revoke_execute',
            'functions', jsonb_build_array('award_xp_and_credits'))
        when 'securite.revoke_wallet_self_credit' then jsonb_build_object(
            'kind', 'revoke_execute',
            'functions', jsonb_build_array('insert_wallet_transaction'))
        when 'securite.restrict_ai_spend' then jsonb_build_object(
            'kind', 'revoke_execute',
            'functions', jsonb_build_array('get_ai_spend'))
        when 'securite.revoke_anon_selects' then jsonb_build_object(
            'kind', 'revoke_select_anon',
            -- Tables laissées lisibles sans session : elles servent le fil
            -- public. Tout le reste perd le droit de lecture anonyme.
            'keep', jsonb_build_array('posts', 'profiles', 'comments', 'post_reactions', 'follows'))

        -- ── Exploitation : nettoyage borné, sauvegardé, restaurable ──
        when 'ia.enforce_budget' then jsonb_build_object(
            'kind', 'update',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'ai_budget',
                'where', 'id = ''global'' and enforced is not true',
                'set',   'enforced = true, updated_at = now()')))
        when 'ia.purge_old_call_log' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'ai_call_log',
                'where', 'created_at < now() - interval ''90 days''')))
        when 'notifications.purge_delivery_log' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'push_delivery_log',
                'where', 'created_at < now() - interval ''30 days''')))
        when 'notifications.prune_dead_subscriptions' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'push_subscriptions',
                -- Refusé DÉFINITIVEMENT par le service de push (410 Gone /
                -- 404) lors de la dernière tentative connue pour ce couple
                -- (compte, hôte). `push-notify` supprime déjà ces lignes,
                -- mais en écriture différée (fireAndForget) : quand elle
                -- échoue, personne ne le voit. C'est ce reliquat que l'on vise.
                'where', $w$exists (
                    select 1 from public.push_delivery_log l
                    where l.user_id = push_subscriptions.user_id
                      and l.endpoint_host = split_part(split_part(push_subscriptions.endpoint, '://', 2), '/', 1)
                      and l.status_code in (404, 410)
                      and l.created_at = (
                          select max(l2.created_at) from public.push_delivery_log l2
                          where l2.user_id = l.user_id and l2.endpoint_host = l.endpoint_host))$w$)))
        when 'live.close_zombie_sessions' then jsonb_build_object(
            'kind', 'update',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'live_sessions',
                -- Un direct n'a pas de colonne `status` : « en cours » se lit
                -- `ended_at is null` après un démarrage effectif. 24 h est
                -- très au-delà de tout direct réel.
                'where', 'ended_at is null and started_at is not null and started_at < now() - interval ''24 hours''',
                'set',   'ended_at = now(), updated_at = now()')))
        when 'live.purge_expired_transcripts' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'live_transcript_lines',
                -- Rétention annoncée aux utilisateurs : 30 jours après la fin
                -- du direct. Appliquer cette purge tient un engagement.
                'where', $w$exists (
                    select 1 from public.live_sessions s
                    where s.id = live_transcript_lines.session_id
                      and s.ended_at is not null
                      and s.ended_at < now() - interval '30 days')$w$)))
        when 'messagerie.close_stuck_calls' then jsonb_build_object(
            'kind', 'update',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'call_diagnostics',
                'where', 'outcome = ''en cours'' and updated_at < now() - interval ''6 hours''',
                'set',   'outcome = ''correspondant perdu'', updated_at = now()')))
        -- ── Contenu & vie sociale ──
        when 'contenu.release_scheduled_posts' then jsonb_build_object(
            'kind', 'update',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'posts',
                -- Heure programmée dépassée, mais la publication n'est jamais
                -- passée à l'état publié. `archived` est délibérément exclu :
                -- c'est un retrait volontaire, pas un blocage.
                'where', 'scheduled_at is not null and scheduled_at <= now() and status = ''draft''',
                'set',   'status = ''published'', updated_at = now()')))
        when 'contenu.purge_expired_stories' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'stories',
                'where', 'expires_at is not null and expires_at < now()')))
        when 'contenu.purge_old_notifications' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'notifications',
                -- `read` strictement vrai : une notification non lue, même
                -- ancienne, reste due à son destinataire.
                'where', 'read is true and created_at < now() - interval ''90 days''')))

        when 'donnees.purge_empty_conversations' then jsonb_build_object(
            'kind', 'delete',
            -- Ordre PARENT D'ABORD. La suppression ne frappe que
            -- `conversations` ; `messages` part en cascade, mais est
            -- sauvegardé ici pour que la restauration soit complète.
            'steps', jsonb_build_array(
                jsonb_build_object(
                    'table', 'conversations',
                    'where', $w$not exists (
                        select 1 from public.conversation_participants p
                        where p.conversation_id = conversations.id)$w$),
                jsonb_build_object(
                    'table', 'messages',
                    'where', $w$exists (
                        select 1 from public.conversations c
                        where c.id = messages.conversation_id
                          and not exists (
                              select 1 from public.conversation_participants p
                              where p.conversation_id = c.id))$w$)))

        else null
    end;
$$;

comment on function public.health_remediation_spec(text) is
    'Catalogue FERMÉ des réparations de santé. Un identifiant inconnu renvoie NULL et l''appel échoue : aucune opération ne peut être composée depuis l''extérieur.';

/** Liste des identifiants du catalogue — sert de contrôle croisé avec le registre TypeScript. */
create or replace function public.health_remediation_catalogue()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_ids text[] := array[
        'securite.revoke_credit_forgery', 'securite.revoke_wallet_self_credit',
        'securite.restrict_ai_spend', 'securite.revoke_anon_selects',
        'ia.enforce_budget', 'ia.purge_old_call_log',
        'notifications.purge_delivery_log', 'notifications.prune_dead_subscriptions',
        'live.close_zombie_sessions', 'live.purge_expired_transcripts',
        'messagerie.close_stuck_calls', 'donnees.purge_empty_conversations',
        'contenu.release_scheduled_posts', 'contenu.purge_expired_stories',
        'contenu.purge_old_notifications'
    ];
begin
    perform public.health_require_admin();
    return jsonb_build_object('ids', to_jsonb(v_ids));
end;
$$;

-- ─────────────────────────── 4. DIAGNOSTIC (aucune écriture) ───────────────────────────

create or replace function public.health_diagnose_remediation(p_remediation_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_spec jsonb;
    v_kind text;
    v_step jsonb;
    v_count integer := 0;
    v_total integer := 0;
    v_tables text[] := '{}';
    v_sample jsonb := '[]'::jsonb;
    v_fn text;
    v_sigs text[] := '{}';
begin
    perform public.health_require_admin();

    v_spec := public.health_remediation_spec(p_remediation_id);
    if v_spec is null then
        raise exception 'Réparation inconnue : %', p_remediation_id using errcode = '22023';
    end if;
    v_kind := v_spec ->> 'kind';

    if v_kind in ('delete', 'update') then
        for v_step in select * from jsonb_array_elements(v_spec -> 'steps') loop
            execute format('select count(*) from public.%I where %s',
                           v_step ->> 'table', v_step ->> 'where')
                into v_count;
            v_total := v_total + v_count;
            v_tables := v_tables || (v_step ->> 'table');
            -- Échantillon pris sur la première étape seulement : il sert à
            -- montrer À QUOI ressemble ce qui va changer, pas à tout lister.
            if v_sample = '[]'::jsonb and v_count > 0 then
                execute format(
                    'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 5) t',
                    v_step ->> 'table', v_step ->> 'where')
                    into v_sample;
            end if;
        end loop;

    elsif v_kind = 'revoke_execute' then
        v_tables := array['pg_proc'];
        for v_fn in select jsonb_array_elements_text(v_spec -> 'functions') loop
            select array_agg(p.oid::regprocedure::text)
              into v_sigs
              from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = v_fn and p.prokind = 'f'
               and has_function_privilege('authenticated', p.oid, 'EXECUTE');
            if v_sigs is not null then
                v_total := v_total + array_length(v_sigs, 1);
                v_sample := v_sample || to_jsonb(v_sigs);
            end if;
        end loop;

    elsif v_kind = 'revoke_select_anon' then
        v_tables := array['information_schema.role_table_grants'];
        select count(*), coalesce(jsonb_agg(to_jsonb(x.table_name)), '[]'::jsonb)
          into v_total, v_sample
          from (
              select c.relname as table_name
                from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relkind = 'r'
                 and has_table_privilege('anon', c.oid, 'SELECT')
                 and not (c.relname = any (
                     select jsonb_array_elements_text(v_spec -> 'keep')))
               order by c.relname
          ) x;
    end if;

    return jsonb_build_object(
        'remediationId', p_remediation_id,
        'kind', v_kind,
        'affectedCount', v_total,
        'affectedTables', to_jsonb(v_tables),
        'sample', case when jsonb_array_length(v_sample) > 5
                       then (select jsonb_agg(e) from (select e from jsonb_array_elements(v_sample) e limit 5) s)
                       else v_sample end,
        'reversible', true);
end;
$$;

-- ─────────────────────────── 5. APPLICATION (sauvegarde puis action) ───────────────────────────
--
-- Sauvegarde et action vivent dans la MÊME transaction : il est impossible
-- d'obtenir une modification sans sa sauvegarde. Si la sauvegarde échoue
-- (taille dépassée, par exemple), rien n'est modifié.

create or replace function public.health_apply_remediation(p_remediation_id text, p_line_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_spec jsonb;
    v_kind text;
    v_step jsonb;
    v_rows jsonb;
    v_payload jsonb := '{}'::jsonb;
    v_order text[] := '{}';
    v_total integer := 0;
    v_changed integer := 0;
    v_snapshot_id uuid;
    v_first jsonb;
    v_fn text;
    v_sig text;
    v_sigs text[] := '{}';
    v_tbl text;
    v_tbls text[] := '{}';
begin
    perform public.health_require_general_admin();

    v_spec := public.health_remediation_spec(p_remediation_id);
    if v_spec is null then
        raise exception 'Réparation inconnue : %', p_remediation_id using errcode = '22023';
    end if;
    v_kind := v_spec ->> 'kind';

    if v_kind in ('delete', 'update') then
        -- (a) SAUVEGARDER toutes les étapes, parent d'abord.
        for v_step in select * from jsonb_array_elements(v_spec -> 'steps') loop
            execute format(
                'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where %s',
                v_step ->> 'table', v_step ->> 'where')
                into v_rows;
            v_payload := v_payload || jsonb_build_object(v_step ->> 'table', v_rows);
            v_order := v_order || (v_step ->> 'table');
            v_total := v_total + jsonb_array_length(v_rows);
        end loop;

        insert into public.health_snapshots (remediation_id, line_id, actor_id, kind, payload, restore_order, row_count)
        values (p_remediation_id, p_line_id, auth.uid(), v_kind, v_payload, v_order, v_total)
        returning id into v_snapshot_id;

        -- (b) APPLIQUER. Pour une suppression, seule la PREMIÈRE étape est
        -- frappée : les suivantes ne sont là que pour la sauvegarde, la
        -- cascade s'en charge.
        v_first := (v_spec -> 'steps') -> 0;
        if v_kind = 'delete' then
            execute format('delete from public.%I where %s', v_first ->> 'table', v_first ->> 'where');
        else
            execute format('update public.%I set %s where %s',
                           v_first ->> 'table', v_first ->> 'set', v_first ->> 'where');
        end if;
        get diagnostics v_changed = row_count;

    elsif v_kind = 'revoke_execute' then
        for v_fn in select jsonb_array_elements_text(v_spec -> 'functions') loop
            for v_sig in
                select p.oid::regprocedure::text
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = v_fn and p.prokind = 'f'
                   and has_function_privilege('authenticated', p.oid, 'EXECUTE')
            loop
                v_sigs := v_sigs || v_sig;
            end loop;
        end loop;

        insert into public.health_snapshots (remediation_id, line_id, actor_id, kind, payload, restore_order, row_count)
        values (p_remediation_id, p_line_id, auth.uid(), v_kind,
                jsonb_build_object('signatures', to_jsonb(v_sigs)), '{}', coalesce(array_length(v_sigs, 1), 0))
        returning id into v_snapshot_id;

        foreach v_sig in array v_sigs loop
            execute format('revoke execute on function %s from authenticated', v_sig);
            v_changed := v_changed + 1;
        end loop;

    elsif v_kind = 'revoke_select_anon' then
        for v_tbl in
            select c.relname
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r'
               and has_table_privilege('anon', c.oid, 'SELECT')
               and not (c.relname = any (select jsonb_array_elements_text(v_spec -> 'keep')))
        loop
            v_tbls := v_tbls || v_tbl;
        end loop;

        insert into public.health_snapshots (remediation_id, line_id, actor_id, kind, payload, restore_order, row_count)
        values (p_remediation_id, p_line_id, auth.uid(), v_kind,
                jsonb_build_object('tables', to_jsonb(v_tbls)), '{}', coalesce(array_length(v_tbls, 1), 0))
        returning id into v_snapshot_id;

        foreach v_tbl in array v_tbls loop
            execute format('revoke select on public.%I from anon', v_tbl);
            v_changed := v_changed + 1;
        end loop;
    end if;

    return jsonb_build_object(
        'snapshotId', v_snapshot_id,
        'changedCount', v_changed,
        'snapshotRowCount', v_total);
end;
$$;

-- ─────────────────────────── 6. RESTAURATION ───────────────────────────

create or replace function public.health_restore_snapshot(p_snapshot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_snap public.health_snapshots;
    v_tbl text;
    v_rows jsonb;
    v_restored integer := 0;
    v_n integer;
    v_sig text;
begin
    perform public.health_require_general_admin();

    select * into v_snap from public.health_snapshots where id = p_snapshot_id;
    if v_snap.id is null then
        raise exception 'Sauvegarde introuvable : %', p_snapshot_id using errcode = '22023';
    end if;
    if v_snap.restored_at is not null then
        raise exception 'Cette sauvegarde a déjà été restaurée le %.', v_snap.restored_at
            using errcode = '22023';
    end if;

    if v_snap.kind in ('delete', 'update') then
        -- Parent d'abord, pour ne jamais violer une clé étrangère au retour.
        -- Les lignes encore présentes (cas d'une mise à jour) sont retirées
        -- puis réinsérées telles qu'elles étaient : un seul chemin de code
        -- couvre la suppression comme la modification.
        foreach v_tbl in array v_snap.restore_order loop
            v_rows := v_snap.payload -> v_tbl;
            if v_rows is null or jsonb_array_length(v_rows) = 0 then continue; end if;

            execute format(
                'delete from public.%I where id in (select (e ->> ''id'') from jsonb_array_elements($1) e)',
                v_tbl) using v_rows;

            execute format(
                'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',
                v_tbl, v_tbl) using v_rows;
            get diagnostics v_n = row_count;
            v_restored := v_restored + v_n;
        end loop;

    elsif v_snap.kind = 'revoke_execute' then
        for v_sig in select jsonb_array_elements_text(v_snap.payload -> 'signatures') loop
            execute format('grant execute on function %s to authenticated', v_sig);
            v_restored := v_restored + 1;
        end loop;

    elsif v_snap.kind = 'revoke_select_anon' then
        for v_sig in select jsonb_array_elements_text(v_snap.payload -> 'tables') loop
            execute format('grant select on public.%I to anon', v_sig);
            v_restored := v_restored + 1;
        end loop;
    end if;

    update public.health_snapshots
       set restored_at = now(), restored_by = auth.uid()
     where id = p_snapshot_id;

    return jsonb_build_object('restoredCount', v_restored, 'snapshotId', p_snapshot_id);
end;
$$;

/** Purge des sauvegardes anciennes — elles contiennent de vraies données. */
create or replace function public.health_purge_snapshots(p_older_than_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_n integer;
begin
    perform public.health_require_general_admin();
    delete from public.health_snapshots
     where created_at < now() - make_interval(days => greatest(p_older_than_days, 1));
    get diagnostics v_n = row_count;
    return jsonb_build_object('deleted', v_n);
end;
$$;

-- ─────────────────────────── 7. SONDES DE LECTURE ───────────────────────────
--
-- PostgREST n'expose que le schéma `public` : sans ces fonctions, aucune
-- sonde ne pourrait lire l'état réel des droits, des politiques ni des
-- contraintes. Elles ne renvoient QUE des agrégats et des noms — jamais une
-- ligne de donnée applicative.

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
                             where n.nspname = 'public' and c.relname = 'audit_logs')
    ) into v_result;

    return v_result;
end;
$$;

create or replace function public.health_probe_data()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_result jsonb;
begin
    perform public.health_require_admin();

    select jsonb_build_object(
        'orphanMessages', (select count(*) from public.messages m
                            where not exists (select 1 from public.conversations c where c.id = m.conversation_id)),
        'orphanParticipants', (select count(*) from public.conversation_participants p
                                where not exists (select 1 from public.conversations c where c.id = p.conversation_id)
                                   or not exists (select 1 from public.profiles pr where pr.id = p.user_id)),
        'emptyConversations', (select count(*) from public.conversations c
                                where not exists (select 1 from public.conversation_participants p
                                                   where p.conversation_id = c.id)),
        'orphanReactions', (select (select count(*) from public.post_reactions r
                                     where not exists (select 1 from public.posts p where p.id = r.post_id))
                                 + (select count(*) from public.comments cm
                                     where not exists (select 1 from public.posts p where p.id = cm.post_id))),
        'selfFriendships', (select count(*) from public.friendships where requester_id = addressee_id),
        'duplicateFriendships', (select count(*) from (
                                    select least(requester_id, addressee_id) a, greatest(requester_id, addressee_id) b
                                      from public.friendships
                                     group by 1, 2 having count(*) > 1) d),
        'profilesWithoutAccount', (select count(*) from public.profiles p
                                    where not exists (select 1 from auth.users u where u.id = p.id)),
        'orphanSpeakers', (select count(*) from public.live_speakers s
                            where not exists (select 1 from public.live_sessions ls where ls.id = s.session_id)),
        'orphanDocuments', (select count(*) from public.post_documents d
                             where not exists (select 1 from public.posts p where p.id = d.post_id)),

        -- Contenu & vie sociale.
        'stuckScheduledPosts', (select count(*) from public.posts
                                 where scheduled_at is not null and scheduled_at <= now()
                                   and status = 'draft'),
        'expiredStories', (select count(*) from public.stories
                            where expires_at is not null and expires_at < now()),
        'notificationsTotal', (select count(*) from public.notifications),
        'staleNotifications', (select count(*) from public.notifications
                                where read is true and created_at < now() - interval '90 days'),
        'activeAgents', (select count(*) from public.agents where is_active)
    ) into v_result;

    return v_result;
end;
$$;

create or replace function public.health_probe_operations()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_result jsonb;
begin
    perform public.health_require_admin();

    select jsonb_build_object(
        -- Orchestrateur IA.
        'activeProviderCategories', (select coalesce(jsonb_agg(distinct p.category), '[]'::jsonb)
                                      from public.ai_providers p
                                      join public.ai_provider_credentials c on c.provider_id = p.id
                                     where p.status = 'active' and c.is_enabled),
        'enabledWithoutSecret', (select count(*) from public.ai_providers p
                                  join public.ai_provider_credentials c on c.provider_id = p.id
                                 where p.status = 'active' and c.is_enabled and c.vault_secret_id is null),
        'budgetEnforced', (select enforced from public.ai_budget where id = 'global'),
        'budgetHasCap', (select (daily_cap_usd is not null or monthly_cap_usd is not null)
                           from public.ai_budget where id = 'global'),
        'aiCalls24h', (select count(*) from public.ai_call_log where created_at > now() - interval '24 hours'),
        'aiFailures24h', (select count(*) from public.ai_call_log
                           where created_at > now() - interval '24 hours' and status <> 'success'),
        'aiCallLogRows', (select count(*) from public.ai_call_log),

        -- Messagerie et appels.
        'liveTransportConfigured', (select count(*) > 0 from public.live_transport_config),
        'stuckCalls', (select count(*) from public.call_diagnostics
                        where outcome = 'en cours' and updated_at < now() - interval '6 hours'),
        'calls24h', (select count(*) from public.call_diagnostics where created_at > now() - interval '24 hours'),
        'callFailures24h', (select count(*) from public.call_diagnostics
                             where created_at > now() - interval '24 hours'
                               and outcome in ('correspondant perdu', 'échec')),
        'blockFunctionPresent', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                  where n.nspname = 'public' and p.proname = 'are_users_blocked'),

        -- LIVE.
        'zombieSessions', (select count(*) from public.live_sessions
                            where ended_at is null and started_at is not null
                              and started_at < now() - interval '24 hours'),
        'expiredTranscripts', (select count(*) from public.live_transcript_lines t
                                where exists (select 1 from public.live_sessions s
                                               where s.id = t.session_id and s.ended_at is not null
                                                 and s.ended_at < now() - interval '30 days')),

        -- Notifications.
        'vapidConfigured', (select count(*) > 0 from public.push_vapid_config),
        'pushSends24h', (select count(*) from public.push_delivery_log where created_at > now() - interval '24 hours'),
        'pushFailures24h', (select count(*) from public.push_delivery_log
                             where created_at > now() - interval '24 hours' and ok is not true),
        'pushDeliveryLogRows', (select count(*) from public.push_delivery_log),
        'deadSubscriptions', (select count(*) from public.push_subscriptions s
                               where exists (
                                   select 1 from public.push_delivery_log l
                                    where l.user_id = s.user_id
                                      and l.endpoint_host = split_part(split_part(s.endpoint, '://', 2), '/', 1)
                                      and l.status_code in (404, 410)
                                      and l.created_at = (select max(l2.created_at) from public.push_delivery_log l2
                                                           where l2.user_id = l.user_id and l2.endpoint_host = l.endpoint_host))),

        -- Stockage. `storage.buckets` est hors du schéma `public` : le nom est
        -- qualifié en entier puisque le `search_path` de cette fonction est figé.
        'publicBucketPresent', (select count(*) > 0 from storage.buckets where id = 'public'),

        -- Gouvernance.
        'healthActionsLogged', (select count(*) from public.audit_logs where entity_type = 'health')
    ) into v_result;

    return v_result;
end;
$$;

/** Journal des actions de santé, joint aux sauvegardes encore restaurables. */
create or replace function public.health_journal(p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_result jsonb;
begin
    perform public.health_require_admin();

    select coalesce(jsonb_agg(row_to_json(j) order by j.created_at desc), '[]'::jsonb)
      into v_result
      from (
          select l.id, l.action, l.entity_id as line_id, l.actor_id, l.metadata, l.created_at,
                 p.name as actor_name,
                 (l.metadata ->> 'snapshotId')::uuid as snapshot_id,
                 (s.id is not null and s.restored_at is null) as restorable
            from public.audit_logs l
            left join public.profiles p on p.id = l.actor_id
            left join public.health_snapshots s on s.id = (l.metadata ->> 'snapshotId')::uuid
           where l.entity_type = 'health'
           order by l.created_at desc
           limit greatest(least(p_limit, 200), 1)
      ) j;

    return v_result;
end;
$$;

-- ─────────────────────────── 8. DROITS ───────────────────────────
--
-- `authenticated` reçoit le droit d'APPELER ces fonctions ; chacune refuse
-- ensuite tout appelant non administrateur via `health_require_admin()`. Le
-- contrôle est donc dans la fonction, pas dans le droit d'appel — même
-- convention que les fonctions `set_ai_*` existantes.

revoke all on function public.health_require_admin() from public, anon, authenticated;
revoke all on function public.health_require_general_admin() from public, anon, authenticated;
revoke all on function public.health_remediation_spec(text) from public, anon, authenticated;

grant execute on function public.health_my_rank() to authenticated;
grant execute on function public.health_remediation_catalogue() to authenticated;
grant execute on function public.health_diagnose_remediation(text) to authenticated;
grant execute on function public.health_apply_remediation(text, text) to authenticated;
grant execute on function public.health_restore_snapshot(uuid) to authenticated;
grant execute on function public.health_purge_snapshots(integer) to authenticated;
grant execute on function public.health_probe_catalogue() to authenticated;
grant execute on function public.health_probe_data() to authenticated;
grant execute on function public.health_probe_operations() to authenticated;
grant execute on function public.health_journal(integer) to authenticated;
