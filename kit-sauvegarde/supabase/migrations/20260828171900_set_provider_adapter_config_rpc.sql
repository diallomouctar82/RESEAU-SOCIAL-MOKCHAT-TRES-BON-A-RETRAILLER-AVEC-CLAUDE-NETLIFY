-- Permet à l'administrateur de renseigner la configuration technique d'un
-- fournisseur depuis la console, sans redéploiement. Premier usage :
-- l'identifiant d'espace de travail Anthropic, exigé par les clés liées à une
-- identité (en-tête anthropic-workspace-id).
create or replace function public.set_provider_adapter_config(
    p_provider_id text, p_config jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès réservé aux administrateurs.';
    end if;
    update public.ai_providers
       set adapter_config = coalesce(p_config, '{}'::jsonb),
           updated_at = now()
     where id = p_provider_id;
end;
$$;

revoke all on function public.set_provider_adapter_config(text, jsonb) from public, anon;
grant execute on function public.set_provider_adapter_config(text, jsonb) to authenticated;
