-- Complète l'auto-découverte : méthode d'authentification détectée, résumé
-- tarifaire, et surtout les modèles détectés avec leurs capacités. Sans ça,
-- un fournisseur découvert n'a AUCUNE ligne ai_models — donc même activé, il
-- ne peut jamais être réellement appelé (defaultModelId() renvoie null côté
-- ai-gateway). C'est corrigé ici en étendant la RPC pour upserter aussi les
-- modèles, exactement comme le seed fait pour les fournisseurs codés en dur.

alter table public.ai_providers
    add column if not exists auth_method text
        check (auth_method in ('api_key','oauth2','webhook','mcp','unknown')) default 'unknown',
    add column if not exists pricing_summary text;

comment on column public.ai_providers.auth_method is
    'Méthode d''authentification détectée par l''auto-découverte. Seul api_key est géré de bout en bout par generic_http.ts ; oauth2/webhook/mcp nécessitent une clé/jeton statique fourni manuellement par l''admin (pas d''échange de jeton automatisé).';

create or replace function public.upsert_discovered_provider(
    p_id text,
    p_category text,
    p_display_name text,
    p_source_url text,
    p_docs_url text,
    p_api_key_url text,
    p_billing_url text,
    p_base_url text,
    p_discovery_status text,
    p_discovery_confidence numeric,
    p_discovery_summary text,
    p_adapter_config jsonb,
    p_missing_fields jsonb,
    p_auth_method text default 'unknown',
    p_pricing_summary text default null,
    p_models jsonb default '[]'::jsonb
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_model jsonb;
begin
    if not public.is_admin() then
        raise exception 'Accès refusé : réservé aux administrateurs.';
    end if;
    if p_category not in ('llm','voice','image_video') then
        raise exception 'Catégorie invalide : %', p_category;
    end if;
    if p_discovery_status not in ('pending','analyzing','ready','needs_info','failed') then
        raise exception 'Statut de découverte invalide : %', p_discovery_status;
    end if;
    if p_auth_method not in ('api_key','oauth2','webhook','mcp','unknown') then
        p_auth_method := 'unknown';
    end if;

    insert into public.ai_providers (
        id, category, display_name, adapter_kind, base_url, docs_url,
        api_key_url, billing_url, priority, status,
        source_url, discovery_status, discovery_confidence, discovery_summary,
        adapter_config, missing_fields, auth_method, pricing_summary, discovered_at
    ) values (
        p_id, p_category, p_display_name, 'generic_http', p_base_url, p_docs_url,
        p_api_key_url, p_billing_url, 200,
        case when p_discovery_status = 'ready' then 'active' else 'not_implemented' end,
        p_source_url, p_discovery_status, p_discovery_confidence, p_discovery_summary,
        p_adapter_config, p_missing_fields, p_auth_method, p_pricing_summary, now()
    )
    on conflict (id) do update set
        category = excluded.category,
        display_name = excluded.display_name,
        base_url = excluded.base_url,
        docs_url = excluded.docs_url,
        api_key_url = excluded.api_key_url,
        billing_url = excluded.billing_url,
        status = excluded.status,
        source_url = excluded.source_url,
        discovery_status = excluded.discovery_status,
        discovery_confidence = excluded.discovery_confidence,
        discovery_summary = excluded.discovery_summary,
        adapter_config = excluded.adapter_config,
        missing_fields = excluded.missing_fields,
        auth_method = excluded.auth_method,
        pricing_summary = excluded.pricing_summary,
        discovered_at = now(),
        updated_at = now()
    where public.ai_providers.adapter_kind = 'generic_http'; -- ne jamais écraser un fournisseur codé en dur

    -- Modèles détectés : mêmes lignes ai_models qu'un fournisseur seedé manuellement,
    -- pour que ce fournisseur soit sélectionnable/appelable exactement pareil.
    for v_model in select * from jsonb_array_elements(coalesce(p_models, '[]'::jsonb))
    loop
        insert into public.ai_models (provider_id, model_id, label, is_default, capabilities)
        values (
            p_id,
            v_model->>'model_id',
            coalesce(v_model->>'label', v_model->>'model_id'),
            coalesce((v_model->>'is_default')::boolean, false),
            coalesce(v_model->'capabilities', '{}'::jsonb)
        )
        on conflict (provider_id, model_id) do update set
            label = excluded.label,
            capabilities = excluded.capabilities,
            updated_at = now();
    end loop;

    -- Si aucun modèle n'est marqué par défaut mais qu'au moins un a été inséré,
    -- le premier devient le défaut (nécessaire pour que l'appel automatique
    -- puisse résoudre un modèle sans que l'admin n'ait à y toucher).
    if not exists (select 1 from public.ai_models where provider_id = p_id and is_default = true)
       and exists (select 1 from public.ai_models where provider_id = p_id) then
        update public.ai_models set is_default = true
        where id = (select id from public.ai_models where provider_id = p_id order by created_at limit 1);
    end if;
end;
$$;

revoke all on function public.upsert_discovered_provider(text,text,text,text,text,text,text,text,text,numeric,text,jsonb,jsonb,text,text,jsonb) from public;
grant execute on function public.upsert_discovered_provider(text,text,text,text,text,text,text,text,text,numeric,text,jsonb,jsonb,text,text,jsonb) to authenticated;
