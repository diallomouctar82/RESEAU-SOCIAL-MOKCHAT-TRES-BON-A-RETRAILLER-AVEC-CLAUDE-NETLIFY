-- Santé globale MokNet — 1/4 : coffre de sauvegarde et gardes de rang.
create table if not exists public.health_snapshots (
    id uuid primary key default gen_random_uuid(),
    remediation_id text not null,
    line_id text not null,
    actor_id uuid null references auth.users(id) on delete set null,
    kind text not null check (kind in ('delete', 'update', 'revoke_execute', 'revoke_select_anon')),
    payload jsonb not null default '{}'::jsonb,
    restore_order text[] not null default '{}',
    row_count integer not null default 0,
    created_at timestamptz not null default now(),
    restored_at timestamptz null,
    restored_by uuid null references auth.users(id) on delete set null,
    constraint health_snapshots_payload_size check (pg_column_size(payload) <= 8000000)
);

comment on table public.health_snapshots is
    'Sauvegarde prise avant chaque réparation de santé, et seule source de la restauration. Contient de vraies données applicatives : jamais lisible hors service_role, purgeable par health_purge_snapshots().';

create index if not exists health_snapshots_created_idx on public.health_snapshots (created_at desc);
create index if not exists health_snapshots_line_idx on public.health_snapshots (line_id, created_at desc);

alter table public.health_snapshots enable row level security;
revoke all on public.health_snapshots from anon, authenticated;

create or replace function public.health_require_admin()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if auth.uid() is null then
        raise exception 'Non autorisé : authentification requise.' using errcode = '42501';
    end if;
    if not public.is_admin() then
        raise exception 'Non autorisé : réservé aux administrateurs.' using errcode = '42501';
    end if;
end;
$$;

create or replace function public.health_require_general_admin()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
    if auth.uid() is null then
        raise exception 'Non autorisé : authentification requise.' using errcode = '42501';
    end if;
    if not exists (
        select 1 from public.profiles
         where id = auth.uid() and role = 'super_admin'
    ) then
        raise exception
            'Non autorisé : cette action est réservée à l''Admin Général (rôle super_admin).'
            using errcode = '42501';
    end if;
end;
$$;

create or replace function public.health_my_rank()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_role text;
begin
    if auth.uid() is null then
        return jsonb_build_object('role', null, 'canRead', false, 'canRepair', false);
    end if;
    select role into v_role from public.profiles where id = auth.uid();
    return jsonb_build_object(
        'role', v_role,
        'canRead', v_role in ('admin', 'super_admin'),
        'canRepair', v_role = 'super_admin');
end;
$$;

revoke all on function public.health_require_admin() from public, anon, authenticated;
revoke all on function public.health_require_general_admin() from public, anon, authenticated;
grant execute on function public.health_my_rank() to authenticated;
