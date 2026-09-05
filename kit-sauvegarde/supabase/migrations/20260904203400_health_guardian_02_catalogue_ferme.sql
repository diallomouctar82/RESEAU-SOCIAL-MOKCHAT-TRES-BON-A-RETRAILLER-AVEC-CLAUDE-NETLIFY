-- Santé globale MokNet — 2/4 : catalogue FERMÉ des réparations.
-- L'appelant n'envoie qu'un identifiant. Les tables et conditions sont des
-- littéraux écrits ici : elles ne franchissent jamais le réseau.
create or replace function public.health_remediation_spec(p_remediation_id text)
returns jsonb
language sql
immutable
set search_path to 'public'
as $$
    select case p_remediation_id
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
            'keep', jsonb_build_array('posts', 'profiles', 'comments', 'post_reactions', 'follows'))

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
                'where', 'ended_at is null and started_at is not null and started_at < now() - interval ''24 hours''',
                'set',   'ended_at = now(), updated_at = now()')))
        when 'live.purge_expired_transcripts' then jsonb_build_object(
            'kind', 'delete',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'live_transcript_lines',
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

        when 'contenu.release_scheduled_posts' then jsonb_build_object(
            'kind', 'update',
            'steps', jsonb_build_array(jsonb_build_object(
                'table', 'posts',
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
                'where', 'read is true and created_at < now() - interval ''90 days''')))

        when 'donnees.purge_empty_conversations' then jsonb_build_object(
            'kind', 'delete',
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

revoke all on function public.health_remediation_spec(text) from public, anon, authenticated;
grant execute on function public.health_remediation_catalogue() to authenticated;
