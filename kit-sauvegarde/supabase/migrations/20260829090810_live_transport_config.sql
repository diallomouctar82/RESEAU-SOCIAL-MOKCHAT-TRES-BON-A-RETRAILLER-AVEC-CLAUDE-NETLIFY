create table public.live_transport_config (
    id uuid primary key default gen_random_uuid(),
    provider text not null default 'livekit' check (provider in ('livekit')),
    server_url text not null,
    api_key text not null,
    vault_secret_id uuid not null references vault.secrets(id),
    environment text not null default 'development' check (environment in ('development', 'production')),
    is_active boolean not null default true,
    created_by uuid references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.live_transport_config enable row level security;

create or replace function public.get_live_transport_config_internal(p_environment text default 'development')
returns table(server_url text, api_key text, api_secret text)
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
begin
    return query
    select c.server_url, c.api_key, ds.decrypted_secret
    from public.live_transport_config c
    join vault.decrypted_secrets ds on ds.id = c.vault_secret_id
    where c.environment = p_environment and c.is_active = true
    order by c.created_at desc
    limit 1;
end;
$function$;

revoke all on function public.get_live_transport_config_internal(text) from public, anon, authenticated;
grant execute on function public.get_live_transport_config_internal(text) to service_role;
