-- Santé globale MokNet — 4/4 : sondes de LECTURE SEULE et journal.
-- Elles ne renvoient que des agrégats et des noms, jamais une ligne de
-- donnée applicative.
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
                                      from public.friendships group by 1, 2 having count(*) > 1) d),
        'profilesWithoutAccount', (select count(*) from public.profiles p
                                    where not exists (select 1 from auth.users u where u.id = p.id)),
        'orphanSpeakers', (select count(*) from public.live_speakers s
                            where not exists (select 1 from public.live_sessions ls where ls.id = s.session_id)),
        'orphanDocuments', (select count(*) from public.post_documents d
                             where not exists (select 1 from public.posts p where p.id = d.post_id)),
        'stuckScheduledPosts', (select count(*) from public.posts
                                 where scheduled_at is not null and scheduled_at <= now() and status = 'draft'),
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
        'liveTransportConfigured', (select count(*) > 0 from public.live_transport_config),
        'stuckCalls', (select count(*) from public.call_diagnostics
                        where outcome = 'en cours' and updated_at < now() - interval '6 hours'),
        'calls24h', (select count(*) from public.call_diagnostics where created_at > now() - interval '24 hours'),
        'callFailures24h', (select count(*) from public.call_diagnostics
                             where created_at > now() - interval '24 hours'
                               and outcome in ('correspondant perdu', 'échec')),
        'blockFunctionPresent', (select count(*) > 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                                  where n.nspname = 'public' and p.proname = 'are_users_blocked'),
        'zombieSessions', (select count(*) from public.live_sessions
                            where ended_at is null and started_at is not null
                              and started_at < now() - interval '24 hours'),
        'expiredTranscripts', (select count(*) from public.live_transcript_lines t
                                where exists (select 1 from public.live_sessions s
                                               where s.id = t.session_id and s.ended_at is not null
                                                 and s.ended_at < now() - interval '30 days')),
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
        'publicBucketPresent', (select count(*) > 0 from storage.buckets where id = 'public'),
        'healthActionsLogged', (select count(*) from public.audit_logs where entity_type = 'health')
    ) into v_result;
    return v_result;
end;
$$;

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

grant execute on function public.health_probe_catalogue() to authenticated;
grant execute on function public.health_probe_data() to authenticated;
grant execute on function public.health_probe_operations() to authenticated;
grant execute on function public.health_journal(integer) to authenticated;
