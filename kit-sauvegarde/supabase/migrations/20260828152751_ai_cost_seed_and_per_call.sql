-- La voix et l'image/vidéo ne se facturent pas au jeton (caractères, secondes,
-- images générées). Un coût forfaitaire par appel permet de les intégrer au
-- même budget sans modéliser chaque unité de facturation.
alter table public.ai_models
    add column if not exists cost_per_call numeric(12,6) not null default 0;

-- Tarifs indicatifs (USD par million de jetons), à vérifier et ajuster depuis la
-- console : les grilles des fournisseurs évoluent. Un modèle laissé à 0 ne
-- consomme aucun budget — c'est volontaire pour les offres réellement gratuites,
-- mais cela signifie aussi qu'un tarif oublié rend la dépense invisible.
update public.ai_models set input_cost_per_million = 0.30,  output_cost_per_million = 2.50
    where provider_id = 'gemini' and model_id = 'gemini-2.5-flash';
update public.ai_models set input_cost_per_million = 3.00,  output_cost_per_million = 15.00
    where provider_id = 'anthropic' and model_id = 'claude-sonnet-4-5-20250929';
update public.ai_models set input_cost_per_million = 1.00,  output_cost_per_million = 5.00
    where provider_id = 'anthropic' and model_id = 'claude-haiku-4-5-20251001';
update public.ai_models set input_cost_per_million = 2.50,  output_cost_per_million = 10.00
    where provider_id = 'openai' and model_id = 'gpt-4o';
update public.ai_models set input_cost_per_million = 0.15,  output_cost_per_million = 0.60
    where provider_id = 'openai' and model_id = 'gpt-4o-mini';
update public.ai_models set input_cost_per_million = 0.27,  output_cost_per_million = 1.10
    where provider_id = 'deepseek' and model_id = 'deepseek-chat';
update public.ai_models set input_cost_per_million = 2.50,  output_cost_per_million = 10.00
    where provider_id = 'openrouter' and model_id = 'openai/gpt-4o';

-- Vue d'audit : dépense par jour et par fournisseur, prête pour la console.
create or replace view public.ai_spend_by_provider as
select
    date_trunc('day', created_at)::date as jour,
    provider_id,
    count(*) filter (where status = 'success')  as appels_reussis,
    count(*) filter (where status = 'error')    as appels_en_echec,
    count(*) filter (where status = 'skipped')  as fournisseurs_ecartes,
    count(*) filter (where status = 'blocked')  as appels_bloques,
    coalesce(sum(input_tokens), 0)  as jetons_entree,
    coalesce(sum(output_tokens), 0) as jetons_sortie,
    coalesce(sum(cost_usd), 0)      as cout_usd
from public.ai_call_log
group by 1, 2;

grant select on public.ai_spend_by_provider to authenticated;
