-- SAT-5 (5 septembre 2026) — clôture AUTOMATIQUE des directs zombies.
--
-- Constat : la ligne « live.sessions_zombies » de la Santé Globale était rouge
-- avec 13 directs jamais fermés (ended_at vide, démarrés depuis plus de 24 h) ;
-- la réparation existait mais exigeait un clic de l'Administrateur Général
-- (health_apply_remediation('live.close_zombie_sessions', …)). Ce que
-- l'application peut faire seule, elle le fait seule : la MÊME règle, jouée
-- toutes les heures par pg_cron, et tracée dans audit_logs comme une
-- réparation automatique (acteur vide = personne n'a cliqué).
--
-- Le critère est copié à l'identique de health_remediation_spec
-- ('live.close_zombie_sessions') : `ended_at is null and started_at is not
-- null and started_at < now() - interval '24 hours'`. Un direct qui n'a jamais
-- démarré (started_at vide) n'est pas un zombie ; un direct de moins de 24 h
-- est, peut-être, un vrai direct.
--
-- Sauvegarde AVANT la première exécution : les 13 lignes concernées ont été
-- relevées (id, host_id, started_at, updated_at) ; retour arrière = remettre
-- ended_at à NULL sur ces ids. Rien n'est supprimé, seule ended_at est posée.

create or replace function public.close_zombie_live_sessions()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_changed integer := 0;
    v_ids uuid[];
begin
    with fermes as (
        update public.live_sessions
           set ended_at = now(), updated_at = now()
         where ended_at is null
           and started_at is not null
           and started_at < now() - interval '24 hours'
        returning id
    )
    select coalesce(array_agg(id), '{}'), count(*) into v_ids, v_changed from fermes;

    -- Journal : une ligne par exécution qui a réellement changé quelque chose,
    -- lisible par health_probe_history (entity_type = 'health'). Jamais de
    -- ligne « rien à faire » : un journal qui bavarde ne se lit plus.
    if v_changed > 0 then
        insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
        values (null, 'health.auto_repair', 'health', 'live.sessions_zombies',
                jsonb_build_object(
                    'remediationId', 'live.close_zombie_sessions',
                    'source', 'pg_cron:close-zombie-live-sessions',
                    'changedCount', v_changed,
                    'sessionIds', to_jsonb(v_ids)));
    end if;

    return v_changed;
end;
$$;

-- Réservée à pg_cron (rôle postgres) et au rôle service : aucun client, même
-- administrateur, n'appelle cette fonction par RPC — la réparation manuelle
-- passe par health_apply_remediation, tracée avec son acteur.
revoke all on function public.close_zombie_live_sessions() from public, anon, authenticated;

-- Toutes les heures à la minute 15 (les autres travaux tournent à */5 et 0/30).
do $$
begin
    if exists (select 1 from cron.job where jobname = 'close-zombie-live-sessions') then
        perform cron.unschedule('close-zombie-live-sessions');
    end if;
end
$$;
select cron.schedule('close-zombie-live-sessions', '15 * * * *', $$select public.close_zombie_live_sessions();$$);
