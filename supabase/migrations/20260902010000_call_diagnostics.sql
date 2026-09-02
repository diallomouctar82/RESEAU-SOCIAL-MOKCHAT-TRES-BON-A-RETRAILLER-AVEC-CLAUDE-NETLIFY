-- AU-7 — Rapports de diagnostic d'appel (une ligne par appel, par compte, par
-- appareil), déposés automatiquement par l'écran d'appel pour lire ce qui se
-- passe réellement sur un vrai téléphone : états de connexion, raisons de
-- reconnexion données par le SDK, chemin réseau négocié, verdicts audio.
-- Aucun contenu audio, aucun jeton, aucune adresse IP locale (épurés côté client).
-- Lecture : propriétaire ou administrateur. Écriture : propriétaire uniquement.

create table if not exists public.call_diagnostics (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    call_id text not null,
    device_id text not null,
    conversation_id uuid null,
    role text not null check (role in ('appelant', 'appelé')),
    outcome text not null default 'en cours',
    device jsonb not null default '{}'::jsonb,
    events jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint call_diagnostics_events_size check (pg_column_size(events) <= 200000),
    constraint call_diagnostics_unique_per_device unique (user_id, call_id, device_id)
);

comment on table public.call_diagnostics is 'AU-7 : journal technique d''un appel vu depuis un appareil (aucun contenu audio, jetons et IP locales épurés côté client). Propriétaire ou admin en lecture.';

create index if not exists call_diagnostics_user_created_idx on public.call_diagnostics (user_id, created_at desc);
create index if not exists call_diagnostics_call_idx on public.call_diagnostics (call_id);

alter table public.call_diagnostics enable row level security;

drop policy if exists call_diagnostics_select_own_or_admin on public.call_diagnostics;
create policy call_diagnostics_select_own_or_admin on public.call_diagnostics
    for select to authenticated
    using ((select auth.uid()) = user_id or public.is_admin());

drop policy if exists call_diagnostics_insert_own on public.call_diagnostics;
create policy call_diagnostics_insert_own on public.call_diagnostics
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists call_diagnostics_update_own on public.call_diagnostics;
create policy call_diagnostics_update_own on public.call_diagnostics
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists call_diagnostics_delete_own on public.call_diagnostics;
create policy call_diagnostics_delete_own on public.call_diagnostics
    for delete to authenticated
    using ((select auth.uid()) = user_id);

revoke all on public.call_diagnostics from anon;
grant select, insert, update, delete on public.call_diagnostics to authenticated;
