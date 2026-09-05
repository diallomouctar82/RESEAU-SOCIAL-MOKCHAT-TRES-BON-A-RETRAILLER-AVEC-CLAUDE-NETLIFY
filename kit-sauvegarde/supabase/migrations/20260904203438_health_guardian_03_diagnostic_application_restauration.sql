-- Santé globale MokNet — 3/4 : diagnostic (lecture seule), application
-- (sauvegarde + action dans la MÊME transaction) et restauration.
create or replace function public.health_diagnose_remediation(p_remediation_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_spec jsonb; v_kind text; v_step jsonb;
    v_count integer := 0; v_total integer := 0;
    v_tables text[] := '{}'; v_sample jsonb := '[]'::jsonb;
    v_fn text; v_sigs text[] := '{}';
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
                           v_step ->> 'table', v_step ->> 'where') into v_count;
            v_total := v_total + v_count;
            v_tables := v_tables || (v_step ->> 'table');
            if v_sample = '[]'::jsonb and v_count > 0 then
                execute format(
                    'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (select * from public.%I where %s limit 5) t',
                    v_step ->> 'table', v_step ->> 'where') into v_sample;
            end if;
        end loop;

    elsif v_kind = 'revoke_execute' then
        v_tables := array['pg_proc'];
        for v_fn in select jsonb_array_elements_text(v_spec -> 'functions') loop
            select array_agg(p.oid::regprocedure::text) into v_sigs
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
                 and not (c.relname = any (select jsonb_array_elements_text(v_spec -> 'keep')))
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

create or replace function public.health_apply_remediation(p_remediation_id text, p_line_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_spec jsonb; v_kind text; v_step jsonb; v_rows jsonb;
    v_payload jsonb := '{}'::jsonb; v_order text[] := '{}';
    v_total integer := 0; v_changed integer := 0;
    v_snapshot_id uuid; v_first jsonb;
    v_fn text; v_sig text; v_sigs text[] := '{}';
    v_tbl text; v_tbls text[] := '{}';
begin
    perform public.health_require_general_admin();
    v_spec := public.health_remediation_spec(p_remediation_id);
    if v_spec is null then
        raise exception 'Réparation inconnue : %', p_remediation_id using errcode = '22023';
    end if;
    v_kind := v_spec ->> 'kind';

    if v_kind in ('delete', 'update') then
        for v_step in select * from jsonb_array_elements(v_spec -> 'steps') loop
            execute format(
                'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where %s',
                v_step ->> 'table', v_step ->> 'where') into v_rows;
            v_payload := v_payload || jsonb_build_object(v_step ->> 'table', v_rows);
            v_order := v_order || (v_step ->> 'table');
            v_total := v_total + jsonb_array_length(v_rows);
        end loop;

        insert into public.health_snapshots (remediation_id, line_id, actor_id, kind, payload, restore_order, row_count)
        values (p_remediation_id, p_line_id, auth.uid(), v_kind, v_payload, v_order, v_total)
        returning id into v_snapshot_id;

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
            select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
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
        'snapshotId', v_snapshot_id, 'changedCount', v_changed, 'snapshotRowCount', v_total);
end;
$$;

create or replace function public.health_restore_snapshot(p_snapshot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_snap public.health_snapshots; v_tbl text; v_rows jsonb;
    v_restored integer := 0; v_n integer; v_sig text;
begin
    perform public.health_require_general_admin();
    select * into v_snap from public.health_snapshots where id = p_snapshot_id;
    if v_snap.id is null then
        raise exception 'Sauvegarde introuvable : %', p_snapshot_id using errcode = '22023';
    end if;
    if v_snap.restored_at is not null then
        raise exception 'Cette sauvegarde a déjà été restaurée le %.', v_snap.restored_at using errcode = '22023';
    end if;

    if v_snap.kind in ('delete', 'update') then
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

grant execute on function public.health_diagnose_remediation(text) to authenticated;
grant execute on function public.health_apply_remediation(text, text) to authenticated;
grant execute on function public.health_restore_snapshot(uuid) to authenticated;
grant execute on function public.health_purge_snapshots(integer) to authenticated;
