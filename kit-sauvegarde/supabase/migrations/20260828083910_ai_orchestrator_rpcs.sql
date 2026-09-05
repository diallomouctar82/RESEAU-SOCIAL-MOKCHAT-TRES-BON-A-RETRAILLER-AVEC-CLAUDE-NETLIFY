-- RPC de l'orchestrateur IA. Toutes SECURITY DEFINER ; toutes (sauf la dernière) vérifient is_admin() en interne.

create or replace function public.set_ai_provider_secret(p_provider_id text, p_secret text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
    v_existing_secret_id uuid;
    v_new_secret_id uuid;
begin
    if not public.is_admin() then
        raise exception 'Accès refusé : réservé aux administrateurs.';
    end if;
    if p_secret is null or length(trim(p_secret)) = 0 then
        raise exception 'Clé API vide.';
    end if;
    if not exists (select 1 from public.ai_providers where id = p_provider_id) then
        raise exception 'Fournisseur inconnu : %', p_provider_id;
    end if;

    select vault_secret_id into v_existing_secret_id
    from public.ai_provider_credentials where provider_id = p_provider_id;

    if v_existing_secret_id is not null then
        perform vault.update_secret(v_existing_secret_id, p_secret);
        update public.ai_provider_credentials
            set key_hint = right(p_secret, 4),
                last_tested_at = null,
                last_test_status = null,
                last_test_message = null,
                created_by = auth.uid()
            where provider_id = p_provider_id;
    else
        v_new_secret_id := vault.create_secret(p_secret, 'ai_provider:' || p_provider_id, 'Clé API orchestrateur IA');
        insert into public.ai_provider_credentials (provider_id, vault_secret_id, key_hint, created_by)
        values (p_provider_id, v_new_secret_id, right(p_secret, 4), auth.uid());
    end if;
end;
$$;

create or replace function public.set_ai_provider_enabled(p_provider_id text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès refusé : réservé aux administrateurs.';
    end if;
    update public.ai_provider_credentials set is_enabled = p_enabled where provider_id = p_provider_id;
    if not found then
        raise exception 'Aucune clé configurée pour ce fournisseur : %', p_provider_id;
    end if;
end;
$$;

create or replace function public.set_ai_provider_priority(p_provider_id text, p_priority integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès refusé : réservé aux administrateurs.';
    end if;
    update public.ai_providers set priority = p_priority where id = p_provider_id;
    if not found then
        raise exception 'Fournisseur inconnu : %', p_provider_id;
    end if;
end;
$$;

create or replace function public.get_ai_provider_status()
returns table (
    provider_id text,
    is_enabled boolean,
    key_hint text,
    last_tested_at timestamptz,
    last_test_status text,
    last_test_message text
)
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès refusé : réservé aux administrateurs.';
    end if;
    return query
        select c.provider_id, c.is_enabled, c.key_hint, c.last_tested_at, c.last_test_status, c.last_test_message
        from public.ai_provider_credentials c;
end;
$$;

-- Lit le secret déchiffré. Jamais appelable par le client : révoqué pour anon/authenticated,
-- accessible uniquement via le rôle service_role (Edge Function ai-gateway).
create or replace function public.get_ai_provider_secret_internal(p_provider_id text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
    v_secret text;
begin
    select decrypted_secret into v_secret
    from vault.decrypted_secrets ds
    join public.ai_provider_credentials c on c.vault_secret_id = ds.id
    where c.provider_id = p_provider_id;
    return v_secret;
end;
$$;

revoke execute on function public.get_ai_provider_secret_internal(text) from public, anon, authenticated;
grant execute on function public.get_ai_provider_secret_internal(text) to service_role;
