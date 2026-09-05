
alter table public.tasks
  add column depends_on_task_id uuid null references public.tasks(id) on delete set null,
  add column recurrence_rule text null check (recurrence_rule in ('daily','weekly','monthly')),
  add column recurrence_parent_id uuid null references public.tasks(id) on delete set null,
  add column recurrence_advanced boolean not null default false;

create index tasks_depends_on_idx on public.tasks (depends_on_task_id) where depends_on_task_id is not null;
create index tasks_recurrence_parent_idx on public.tasks (recurrence_parent_id) where recurrence_parent_id is not null;

-- Validation de dépendance : même utilisateur, jamais d'auto-référence.
-- Fonction NON SECURITY DEFINER (invoker) : la vérification porte toujours
-- sur les propres lignes de l'appelant, RLS déjà suffisante, aucun bypass
-- nécessaire (cohérent avec la hygiène de grants de toute cette mission :
-- SECURITY DEFINER seulement quand un vrai bypass est requis).
create or replace function public.validate_task_dependency()
returns trigger
language plpgsql
as $func$
begin
  if new.depends_on_task_id is not null then
    if new.depends_on_task_id = new.id then
      raise exception 'a task cannot depend on itself';
    end if;
    if not exists (
      select 1 from public.tasks
      where id = new.depends_on_task_id and user_id = new.user_id
    ) then
      raise exception 'dependency task not found or belongs to another user';
    end if;
  end if;
  return new;
end;
$func$;

create trigger trg_validate_task_dependency
before insert or update of depends_on_task_id on public.tasks
for each row execute function public.validate_task_dependency();

-- Récurrence : une tâche complétée portant recurrence_rule engendre une
-- nouvelle instance (nouvelle ligne, jamais une réécriture in-place — même
-- principe "history-preserving" déjà retenu pour user_memory scope=project
-- au LOOP 12/17). recurrence_advanced rend l'opération idempotente : une
-- fois la relève créée, la ligne d'origine ne sera plus jamais reprise même
-- si le job tourne en double pendant l'exécution (FOR UPDATE SKIP LOCKED
-- protège en plus contre le chevauchement de deux exécutions concurrentes
-- du même cron). recurrence_parent_id chaîne toujours vers la RACINE de la
-- série (jamais l'instance immédiatement précédente), pour permettre de
-- retrouver toutes les occurrences d'une tâche récurrente par un seul
-- filtre. SECURITY DEFINER : cette fonction doit voir/modifier les tâches
-- de TOUS les utilisateurs (le déclencheur est un cron, pas un appelant
-- authentifié précis) — EXECUTE révoqué pour anon/authenticated dès
-- l'origine, même patron que fire_due_reminders/send_daily_digest/
-- publish_scheduled_posts (LOOP 09/17, LOOP 14/17).
create or replace function public.generate_recurring_task_instances()
returns void
language plpgsql
security definer
set search_path = public
as $func$
declare
  r record;
  next_due timestamptz;
begin
  for r in
    select * from public.tasks
    where status = 'completed'
      and recurrence_rule is not null
      and recurrence_advanced = false
    for update skip locked
  loop
    next_due := case r.recurrence_rule
      when 'daily' then coalesce(r.due_at, now()) + interval '1 day'
      when 'weekly' then coalesce(r.due_at, now()) + interval '7 days'
      when 'monthly' then coalesce(r.due_at, now()) + interval '1 month'
    end;

    insert into public.tasks (
      user_id, title, description, priority, due_at,
      related_type, related_id, recurrence_rule, recurrence_parent_id
    ) values (
      r.user_id, r.title, r.description, r.priority, next_due,
      r.related_type, r.related_id, r.recurrence_rule,
      coalesce(r.recurrence_parent_id, r.id)
    );

    update public.tasks set recurrence_advanced = true where id = r.id;
  end loop;
end;
$func$;

revoke all on function public.generate_recurring_task_instances() from public;
revoke execute on function public.generate_recurring_task_instances() from anon, authenticated;

select cron.schedule('generate-recurring-tasks', '*/5 * * * *', $cron$select public.generate_recurring_task_instances();$cron$);
