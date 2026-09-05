-- Correction : l'historique antérieur au dernier changement de clé ou de
-- configuration ne doit plus compter.
--
-- Sans cela, un fournisseur dont on vient de corriger la clé resterait relégué
-- à cause d'échecs qui n'ont plus lieu d'être — l'orchestrateur punirait un
-- problème déjà résolu, et il faudrait attendre 7 jours pour qu'il redevienne
-- éligible. La fenêtre de santé démarre donc au plus tard entre « il y a
-- 7 jours » et « dernière modification des identifiants ».
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
    with fenetre as (
        select c.provider_id,
               greatest(now() - interval '7 days', coalesce(c.updated_at, now() - interval '7 days')) as depuis
        from public.ai_provider_credentials c
    ),
    stats as (
        select l.provider_id,
               count(*) filter (where l.status in ('success','error')) as tentatives,
               count(*) filter (where l.status = 'success')            as succes,
               avg(l.latency_ms) filter (where l.status = 'success')   as latence
        from public.ai_call_log l
        join fenetre f on f.provider_id = l.provider_id
        where l.created_at >= f.depuis
          and l.provider_id is not null
        group by l.provider_id
    ),
    candidats as (
        select p.id, m.model_id, p.adapter_kind, p.base_url, p.adapter_config,
               p.cost_tier, p.priority,
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
                   then 'Historique insuffisant depuis la dernière modification de la clé — essayé après les fournisseurs éprouvés.'
               when succes::numeric / tentatives >= 0.8
                   then 'Sain : ' || succes || '/' || tentatives || ' succès depuis la dernière modification de la clé.'
               else 'Défaillant : ' || succes || '/' || tentatives || ' succès depuis la dernière modification de la clé — relégué.'
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
