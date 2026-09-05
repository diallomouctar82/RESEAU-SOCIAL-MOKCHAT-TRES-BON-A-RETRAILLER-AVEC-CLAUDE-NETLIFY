-- Orchestrateur central des modèles IA (Super Admin) : catalogue, modèles, identifiants (Vault), journal d'appels.

create table public.ai_providers (
    id            text primary key,
    category      text not null check (category in ('llm','voice','image_video')),
    display_name  text not null,
    adapter_kind  text not null,
    base_url      text,
    docs_url      text,
    priority      integer not null default 100,
    status        text not null default 'not_implemented' check (status in ('not_implemented','active')),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table public.ai_models (
    id            uuid primary key default gen_random_uuid(),
    provider_id   text not null references public.ai_providers(id) on delete cascade,
    model_id      text not null,
    label         text not null,
    is_default    boolean not null default false,
    capabilities  jsonb not null default '{}'::jsonb,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    unique (provider_id, model_id)
);
create unique index ai_models_one_default_per_provider
    on public.ai_models (provider_id) where (is_default);

create table public.ai_provider_credentials (
    id                  uuid primary key default gen_random_uuid(),
    provider_id         text not null unique references public.ai_providers(id) on delete cascade,
    vault_secret_id      uuid not null,
    key_hint            text,
    is_enabled          boolean not null default false,
    last_tested_at      timestamptz,
    last_test_status    text check (last_test_status in ('success','failure')),
    last_test_message   text,
    created_by          uuid references public.profiles(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table public.ai_call_log (
    id              uuid primary key default gen_random_uuid(),
    category        text,
    provider_id     text references public.ai_providers(id),
    model_id        text,
    attempt_number  integer not null default 1,
    status          text check (status in ('success','error')),
    error_class     text,
    error_message   text,
    latency_ms      integer,
    requested_by    uuid references public.profiles(id),
    created_at      timestamptz not null default now()
);

create trigger set_updated_at before update on public.ai_providers
    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ai_models
    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ai_provider_credentials
    for each row execute function public.set_updated_at();

create index ai_models_provider_id_idx on public.ai_models (provider_id);
create index ai_call_log_provider_id_idx on public.ai_call_log (provider_id);
create index ai_call_log_created_at_idx on public.ai_call_log (created_at desc);
create index ai_call_log_requested_by_idx on public.ai_call_log (requested_by);

alter table public.ai_providers enable row level security;
alter table public.ai_models enable row level security;
alter table public.ai_provider_credentials enable row level security;
alter table public.ai_call_log enable row level security;

-- ai_providers / ai_models : lecture admin uniquement, aucune écriture cliente (seedées par migration, ajustées via RPC SECURITY DEFINER).
create policy "ai_providers_admin_select" on public.ai_providers
    for select to authenticated using (public.is_admin());
create policy "ai_models_admin_select" on public.ai_models
    for select to authenticated using (public.is_admin());

-- ai_provider_credentials : aucune policy cliente (deny-by-default) — accès exclusivement via RPC SECURITY DEFINER.

-- ai_call_log : lecture admin uniquement ; écriture uniquement via service_role (Edge Function), pas de policy d'insertion cliente.
create policy "ai_call_log_admin_select" on public.ai_call_log
    for select to authenticated using (public.is_admin());
