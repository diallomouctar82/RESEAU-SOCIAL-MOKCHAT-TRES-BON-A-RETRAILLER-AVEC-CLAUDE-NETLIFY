-- LOOP 12/17 (Mémoire contextuelle : fondation)
-- Modèle structuré et audité (colonnes typées, jamais un JSON fourre-tout) —
-- scopes volontairement limités à ceux qui méritent une vraie persistance
-- serveur : le contexte immédiat/de session (quelques tours de dialogue)
-- reste délibérément côté client, jamais écrit ici (principe explicite du
-- lot d'origine : "ne pas mémoriser plus que nécessaire").
create table public.user_memory (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    scope text not null check (scope in ('recent_activity','project','durable_preference','explicit')),
    category text not null,
    key text not null,
    value text not null,
    -- Préférence déclarée vs inférée (raffiné en LOOP 13/17) — colonne
    -- présente dès la fondation pour ne jamais avoir à migrer le schéma
    -- plus tard ; toute écriture de cette LOOP utilise 'explicit'.
    source text not null default 'explicit' check (source in ('explicit', 'inferred')),
    confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
    status text not null default 'active' check (status in ('active', 'superseded', 'expired')),
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- Une correction REMPLACE la valeur existante plutôt que d'empiler une
    -- ligne concurrente de même portée (principe explicite du lot d'origine :
    -- "jamais deux règles actives de même portée en conflit").
    unique (user_id, scope, category, key)
);

comment on table public.user_memory is
    'LOOP 12/17 : mémoire contextuelle structurée par scope. "recent_activity" '
    'est préparé mais sans producteur pour l''instant (aucun module n''écrit '
    'encore ici — état honnête, comparable à `stories`/`courses` avant leur '
    'propre LOOP). "explicit" sert les mémoires demandées textuellement par '
    'l''utilisateur ; "project" sert l''objectif/les décisions liés à un '
    'parcours ; "durable_preference" les préférences stables.';

alter table public.user_memory enable row level security;

create policy user_memory_select_own on public.user_memory
    for select using (auth.uid() = user_id);
create policy user_memory_insert_own on public.user_memory
    for insert with check (auth.uid() = user_id);
create policy user_memory_update_own on public.user_memory
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_memory_delete_own on public.user_memory
    for delete using (auth.uid() = user_id);

create trigger trg_user_memory_updated_at
    before update on public.user_memory
    for each row execute function public.set_updated_at();

create index user_memory_user_scope_idx on public.user_memory (user_id, scope) where status = 'active';
