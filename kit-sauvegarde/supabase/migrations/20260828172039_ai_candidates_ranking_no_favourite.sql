-- Classement des candidats IA : AUCUN fournisseur n'est privilégié par principe.
-- L'ordre découle uniquement de critères objectifs et mesurés, recalculés à
-- chaque appel. Tous les couples (fournisseur, modèle) éligibles concourent à
-- égalité ; seul le mérite observé les départage.
--
-- Critères, dans l'ordre :
--   1. Palier gratuit avant payant (règle métier explicite).
--   2. Santé récente, mesurée sur les appels des 7 derniers jours :
--      sain (>= 80 % de succès) > inconnu (aucune donnée) > défaillant.
--      Un fournisseur sans historique n'est ni favorisé ni pénalisé : il est
--      simplement essayé après ceux qui ont fait leurs preuves.
--   3. Coût estimé du modèle (entrée + sortie), le moins cher d'abord.
--   4. Latence moyenne observée.
--   5. Priorité manuelle, puis identifiants — départage stable et déterministe,
--      sans quoi deux candidats identiques changeraient d'ordre à chaque appel.
create or replace function public.get_ranked_ai_candidates(p_category text)
returns table (
    provider_id    text,
    model_id       text,
    adapter_kind   text,
    base_url       text,
    adapter_config jsonb,
    cost_tier      text,
    sante          text,
    cout_estime    numeric,
    latence_ms     numeric,
    motif          text
)
language sql
stable
security definer
set search_path = public
as $$
    with stats as (
        select l.provider_id,
               count(*) filter (where l.status in ('success','error')) as tentatives,
               count(*) filter (where l.status = 'success')            as succes,
               avg(l.latency_ms) filter (where l.status = 'success')   as latence
        from public.ai_call_log l
        where l.created_at >= now() - interval '7 days'
          and l.provider_id is not null
        group by l.provider_id
    ),
    candidats as (
        select p.id, m.model_id, p.adapter_kind, p.base_url, p.adapter_config,
               p.cost_tier, p.priority,
               -- Coût d'un échange de référence (1000 jetons entrée, 500 sortie)
               -- : rend comparables des grilles exprimées différemment.
               (m.input_cost_per_million * 1000 / 1000000.0)
             + (m.output_cost_per_million * 500 / 1000000.0)
             + m.cost_per_call as cout,
               s.tentatives, s.succes, s.latence
        from public.ai_providers p
        join public.ai_provider_credentials c
          on c.provider_id = p.id and c.is_enabled = true
        join public.ai_models m
          on m.provider_id = p.id and m.is_default = true
        left join stats s on s.provider_id = p.id
        where p.category = p_category
          and p.status = 'active'
    )
    select id, model_id, adapter_kind, base_url, adapter_config, cost_tier,
           case
               when tentatives is null or tentatives < 3 then 'inconnu'
               when succes::numeric / tentatives >= 0.8  then 'sain'
               else 'defaillant'
           end,
           round(cout::numeric, 6),
           round(coalesce(latence, 0)::numeric, 0),
           case
               when tentatives is null or tentatives < 3
                   then 'Historique insuffisant — essayé après les fournisseurs éprouvés.'
               when succes::numeric / tentatives >= 0.8
                   then 'Sain : ' || succes || '/' || tentatives || ' succès sur 7 jours.'
               else 'Défaillant : ' || succes || '/' || tentatives || ' succès sur 7 jours — relégué.'
           end
    from candidats
    order by
        (cost_tier = 'free') desc,
        case
            when tentatives is null or tentatives < 3 then 1
            when succes::numeric / tentatives >= 0.8  then 2
            else 0
        end desc,
        cout asc nulls last,
        coalesce(latence, 999999) asc,
        priority asc,
        id asc;
$$;

grant execute on function public.get_ranked_ai_candidates(text) to authenticated, service_role;

-- Plus aucune priorité manuelle ne favorise un fournisseur : toutes égales.
-- Le champ reste disponible comme départage de dernier recours si un
-- administrateur souhaite un jour forcer un ordre.
update public.ai_providers set priority = 100, updated_at = now();
