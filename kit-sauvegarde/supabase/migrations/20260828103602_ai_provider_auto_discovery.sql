-- Auto-découverte des fournisseurs IA : l'admin colle une URL, le système explore
-- le site et génère une configuration d'appel générique (adapter_config), sans
-- écrire de code. Le fournisseur devient utilisable partout dès que la clé est
-- validée, exactement comme un fournisseur codé en dur.

alter table public.ai_providers
    add column if not exists source_url text,
    add column if not exists discovery_status text not null default 'manual'
        check (discovery_status in ('manual','pending','analyzing','ready','needs_info','failed')),
    add column if not exists discovery_confidence numeric,
    add column if not exists discovery_summary text,
    add column if not exists adapter_config jsonb not null default '{}'::jsonb,
    add column if not exists missing_fields jsonb not null default '[]'::jsonb,
    add column if not exists discovered_at timestamptz;

comment on column public.ai_providers.adapter_config is
    'Configuration interprétée par l''adaptateur générique (generic_http) : méthode, endpoint, headers, forme de requête/réponse. Générée par auto-découverte ou éditée par un admin.';
comment on column public.ai_providers.missing_fields is
    'Liste de champs que l''auto-découverte n''a pas pu déterminer avec confiance (ex. chemin exact de la réponse) ; affichés comme un mini-formulaire à l''admin tant que non résolus.';

-- Enregistre/actualise un fournisseur issu de l'auto-découverte. Admin-only.
-- adapter_kind est toujours 'generic_http' pour un fournisseur découvert
-- (un fournisseur codé en dur garde son adapter_kind spécifique, jamais touché ici).
-- status passe à 'active' dès que la config est jugée exploitable (discovery_status='ready') ;
-- l'usage réel reste gardé par ai_provider_credentials.is_enabled (clé + interrupteur),
-- comme pour tous les autres fournisseurs.
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
    p_missing_fields jsonb
) returns void
language plpgsql
security definer
set search_path to 'public'
as $$
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

    insert into public.ai_providers (
        id, category, display_name, adapter_kind, base_url, docs_url,
        api_key_url, billing_url, priority, status,
        source_url, discovery_status, discovery_confidence, discovery_summary,
        adapter_config, missing_fields, discovered_at
    ) values (
        p_id, p_category, p_display_name, 'generic_http', p_base_url, p_docs_url,
        p_api_key_url, p_billing_url, 200,
        case when p_discovery_status = 'ready' then 'active' else 'not_implemented' end,
        p_source_url, p_discovery_status, p_discovery_confidence, p_discovery_summary,
        p_adapter_config, p_missing_fields, now()
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
        discovered_at = now(),
        updated_at = now()
    where public.ai_providers.adapter_kind = 'generic_http'; -- ne jamais écraser un fournisseur codé en dur
end;
$$;

revoke all on function public.upsert_discovered_provider from public;
grant execute on function public.upsert_discovered_provider to authenticated;
