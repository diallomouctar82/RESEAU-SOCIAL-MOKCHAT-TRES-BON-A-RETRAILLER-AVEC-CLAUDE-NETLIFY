-- LOOP 09/17 (Notifications/Attention : orchestration proactive)
-- Rappels ponctuels réels (fin automatique sur déclenchement, jamais récurrents
-- par défaut) + digest quotidien honnête (jamais envoyé s'il n'y a rien de
-- réel à signaler) — tous deux orchestrés par pg_cron (confirmé installé,
-- v1.6.4, aucun job existant avant cette migration).

create table public.reminders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    message text not null,
    remind_at timestamptz not null,
    status text not null default 'pending' check (status in ('pending','fired','cancelled')),
    created_at timestamptz not null default now()
);

comment on table public.reminders is
    'LOOP 09/17 : rappel ponctuel créé par un utilisateur pour lui-même. '
    'Transformé une seule fois en notification réelle par fire_due_reminders() '
    '(pg_cron) quand remind_at est atteint, jamais récurrent sauf création '
    'explicite d''un nouveau rappel. Aucune UI de création dédiée pour cette '
    'LOOP (testé via SQL/REST direct) — voir docs/SUPABASE_ARCHITECTURE.md.';

alter table public.reminders enable row level security;

create policy reminders_select_own on public.reminders
    for select using (auth.uid() = user_id);

create policy reminders_insert_own on public.reminders
    for insert with check (auth.uid() = user_id);

-- Permet à l'utilisateur d'annuler un rappel qu'il a créé (status -> 'cancelled')
-- avant qu'il ne se déclenche ; fire_due_reminders() (SECURITY DEFINER)
-- n'a pas besoin de cette policy pour son propre passage à 'fired'.
create policy reminders_update_own on public.reminders
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy reminders_delete_own on public.reminders
    for delete using (auth.uid() = user_id);

-- Index partiel : fire_due_reminders() ne scanne jamais les rappels déjà
-- traités, quelle que soit la taille de la table au fil du temps.
create index reminders_due_idx on public.reminders (remind_at) where status = 'pending';

-- SECURITY DEFINER : un rappel appartient à un utilisateur donné, mais
-- l'insertion de la notification correspondante et le passage à 'fired'
-- doivent s'appliquer pour tous les utilisateurs dus, pas seulement
-- l'appelant — appelé uniquement par pg_cron (jamais exposé en RPC client,
-- EXECUTE révoqué ci-dessous dès l'origine, même hygiène que LOOP 08/17).
create or replace function public.fire_due_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    with due as (
        update public.reminders
        set status = 'fired'
        where status = 'pending' and remind_at <= now()
        returning id, user_id, message
    )
    insert into public.notifications (user_id, type, title, message, priority, target_action)
    select user_id, 'info', 'Rappel', message, 'normal', 'reminder'
    from due;
end;
$$;

revoke all on function public.fire_due_reminders() from public;
revoke execute on function public.fire_due_reminders() from anon, authenticated;

-- Digest quotidien : une seule notification agrégée par utilisateur, et
-- SEULEMENT s'il existe au moins une notification réelle non lue depuis son
-- dernier digest (jamais un "rien de neuf" fabriqué — silence si rien à dire,
-- cf. règle transversale n°8 de la mission : "aucune métrique inventée").
-- La fenêtre de comptage part du dernier digest de CET utilisateur (ou, à
-- défaut, des dernières 24h) : jamais de double-comptage entre deux exécutions.
create or replace function public.send_daily_digest()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.notifications (user_id, type, title, message, priority, target_action)
    select
        n.user_id,
        'info',
        'Votre résumé du jour',
        'Vous avez ' || count(*) || ' notification(s) non lue(s) depuis votre dernier résumé.',
        'low',
        'digest'
    from public.notifications n
    where n.read = false
      and n.target_action is distinct from 'digest'
      and n.created_at > coalesce(
          (select max(d.created_at) from public.notifications d
           where d.user_id = n.user_id and d.target_action = 'digest'),
          now() - interval '1 day'
      )
    group by n.user_id
    having count(*) > 0;
end;
$$;

revoke all on function public.send_daily_digest() from public;
revoke execute on function public.send_daily_digest() from anon, authenticated;

select cron.schedule('fire-due-reminders', '*/5 * * * *', $$select public.fire_due_reminders();$$);
select cron.schedule('send-daily-digest', '0 8 * * *', $$select public.send_daily_digest();$$);
