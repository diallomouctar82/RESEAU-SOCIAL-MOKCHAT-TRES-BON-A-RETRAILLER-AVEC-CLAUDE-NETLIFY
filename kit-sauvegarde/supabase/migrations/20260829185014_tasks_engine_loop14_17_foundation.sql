-- LOOP 14/17 (Tâches/Agenda/Planification : fondation)
-- Distinction volontaire vis-à-vis de ce qui existe déjà : `reminders`
-- (LOOP 09/17) déclenche UNE notification ponctuelle puis s'arrête — pas de
-- suivi d'avancement ; `user_memory` (LOOP 12-13/17) retient des FAITS
-- contextuels, pas des actions à accomplir. `tasks` est le premier
-- véritable TODO trackable (statut, priorité, échéance), volontairement
-- distinct de `dossier_tasks` (schéma réel mais dont le parent `dossiers`
-- n'est alimenté que par `services/dossierService.ts`, confirmé 100%
-- `localStorage` — une contrainte FK réelle vers `dossiers(id)` empêcherait
-- toute écriture tant que les dossiers eux-mêmes ne sont pas réels ;
-- migrer l'ensemble du système de dossiers dépasse le périmètre d'une
-- fondation Tâches/Agenda). `related_type`/`related_id` : pointeur
-- polymorphe optionnel sans clé étrangère (même convention que
-- `profile_skills.source_type`/`source_id`), pour rattacher plus tard une
-- tâche à un vrai objet MOCnet (dossier, cours, Live, conversation) sans
-- imposer une seule table cible.
create table public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    description text,
    status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
    due_at timestamptz,
    related_type text,
    related_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.tasks is
    'LOOP 14/17 : tâche trackable générique (statut/priorité/échéance) — '
    'distincte de reminders (déclenchement ponctuel unique) et de '
    'user_memory (faits contextuels). due_at en timestamptz (instant '
    'normalisé, jamais une chaîne libre comme dans DossierTask.deadline/ '
    'LiveActionItem.deadline côté client) — l''affichage en heure locale '
    'reste la responsabilité du client.';

alter table public.tasks enable row level security;

create policy tasks_select_own on public.tasks for select using (auth.uid() = user_id);
create policy tasks_insert_own on public.tasks for insert with check (auth.uid() = user_id);
create policy tasks_update_own on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tasks_delete_own on public.tasks for delete using (auth.uid() = user_id);

create trigger trg_tasks_updated_at
    before update on public.tasks
    for each row execute function public.set_updated_at();

create index tasks_user_status_idx on public.tasks (user_id, status);
alter publication supabase_realtime add table public.tasks;

-- Événement planifié déjà réel et déjà documenté comme en attente de cette
-- mission : `posts.scheduled_at`/`status='scheduled'` existent depuis la
-- LOOP 01/17 mais aucune bascule automatique n'a jamais été implémentée —
-- un post "programmé" restait 'scheduled' pour toujours. SECURITY DEFINER
-- nécessaire : le job doit publier les posts programmés de TOUS les
-- utilisateurs, pas seulement ceux de l'appelant (même patron que
-- fire_due_reminders/send_daily_digest, LOOP 09/17).
create or replace function public.publish_scheduled_posts()
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
  set status = 'published'
  where status = 'scheduled' and scheduled_at is not null and scheduled_at <= now();
$$;

comment on function public.publish_scheduled_posts() is
    'LOOP 14/17 : bascule automatique scheduled->published, comble une '
    'lacune documentée depuis la LOOP 01/17 (posts.scheduled_at existait '
    'sans jamais être consommé). Idempotent (WHERE status=''scheduled'' '
    'exclut les lignes déjà traitées).';

revoke all on function public.publish_scheduled_posts() from public;
revoke execute on function public.publish_scheduled_posts() from anon, authenticated;

select cron.schedule('publish-scheduled-posts', '*/5 * * * *', $$select public.publish_scheduled_posts();$$);
