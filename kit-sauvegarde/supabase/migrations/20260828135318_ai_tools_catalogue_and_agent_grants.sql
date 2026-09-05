-- Boîte à outils de l'orchestrateur IA.
-- Le catalogue et les autorisations vivent en base : l'administrateur active ou
-- désactive un outil pour un expert donné sans qu'une ligne de code change.

create table if not exists public.ai_tools (
    id                    text primary key,
    display_name          text not null,
    -- Description envoyée telle quelle au modèle : c'est elle qui détermine si
    -- l'outil est appelé au bon moment. À soigner autant que du code.
    description           text not null,
    category              text not null check (category in ('search','read','action')),
    parameters_schema     jsonb not null default '{"type":"object","properties":{}}'::jsonb,
    -- Une action ne s'exécute jamais sans accord explicite de l'utilisateur.
    requires_confirmation boolean not null default false,
    -- Outil réservé aux utilisateurs authentifiés (données personnelles, écritures).
    requires_auth         boolean not null default false,
    -- Interrupteur global : coupe l'outil pour tous les experts d'un coup.
    is_enabled            boolean not null default true,
    -- Ordre d'affichage dans la console d'administration.
    sort_order            integer not null default 100,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now()
);

-- Autorisation par expert. agent_id n'a volontairement pas de clé étrangère :
-- les experts sont définis côté application (constants.ts AGENTS), et cette
-- table doit pouvoir accueillir un nouvel expert avant son insertion en base.
create table if not exists public.agent_tool_grants (
    agent_id   text not null,
    tool_id    text not null references public.ai_tools(id) on delete cascade,
    is_enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (agent_id, tool_id)
);

create index if not exists agent_tool_grants_tool_idx on public.agent_tool_grants(tool_id);

drop trigger if exists set_updated_at_ai_tools on public.ai_tools;
create trigger set_updated_at_ai_tools before update on public.ai_tools
    for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_agent_tool_grants on public.agent_tool_grants;
create trigger set_updated_at_agent_tool_grants before update on public.agent_tool_grants
    for each row execute function public.set_updated_at();

alter table public.ai_tools enable row level security;
alter table public.agent_tool_grants enable row level security;

-- Lecture ouverte aux utilisateurs authentifiés : le client doit savoir quels
-- outils sont disponibles pour afficher les confirmations. Aucune donnée
-- sensible ici (pas de clé, pas de secret) — uniquement des descriptions.
drop policy if exists ai_tools_read on public.ai_tools;
create policy ai_tools_read on public.ai_tools
    for select to authenticated using (true);

drop policy if exists agent_tool_grants_read on public.agent_tool_grants;
create policy agent_tool_grants_read on public.agent_tool_grants
    for select to authenticated using (true);

-- Aucune écriture cliente : tout passe par les RPC admin ci-dessous.
