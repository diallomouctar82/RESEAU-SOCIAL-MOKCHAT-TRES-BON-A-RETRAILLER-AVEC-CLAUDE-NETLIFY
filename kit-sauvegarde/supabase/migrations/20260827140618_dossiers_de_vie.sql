
-- ═══════════════════════════════════════════════════════════
-- DOSSIERS DE VIE — domaine le mieux justifié de l'audit
-- (dossierService.ts a déjà un vrai CRUD complet en localStorage)
-- ═══════════════════════════════════════════════════════════

create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  objective text,
  category text,
  lead_agent_id text references public.agents(id),
  collaborator_agent_ids text[] not null default '{}',
  status text not null default 'active',
  blockers text,
  plan_b text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dossier_steps (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.dossier_tasks (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  step_id uuid references public.dossier_steps(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create table public.dossier_documents (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  name text not null,
  storage_path text,
  url text,
  created_at timestamptz not null default now()
);

create table public.dossier_deliverables (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  title text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.dossier_appointments (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.dossier_shares (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  shared_with_user_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read','write')),
  created_at timestamptz not null default now(),
  unique (dossier_id, shared_with_user_id)
);

create index idx_dossiers_owner on public.dossiers(owner_id);
create index idx_dossier_steps_dossier on public.dossier_steps(dossier_id);
create index idx_dossier_tasks_dossier on public.dossier_tasks(dossier_id);
create index idx_dossier_documents_dossier on public.dossier_documents(dossier_id);
create index idx_dossier_deliverables_dossier on public.dossier_deliverables(dossier_id);
create index idx_dossier_appointments_dossier on public.dossier_appointments(dossier_id);
create index idx_dossier_shares_dossier on public.dossier_shares(dossier_id);
create index idx_dossier_shares_user on public.dossier_shares(shared_with_user_id);

create trigger trg_dossiers_updated_at before update on public.dossiers
for each row execute function public.set_updated_at();

-- Now that dossiers exists, wire the FK left pending on live_sessions.
alter table public.live_sessions
  add constraint live_sessions_dossier_id_fkey
  foreign key (dossier_id) references public.dossiers(id) on delete set null;

create or replace function public.can_access_dossier(p_dossier_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.dossiers d
    where d.id = p_dossier_id
    and (
      d.owner_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.dossier_shares s where s.dossier_id = d.id and s.shared_with_user_id = auth.uid())
    )
  );
$$;

create or replace function public.can_write_dossier(p_dossier_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.dossiers d
    where d.id = p_dossier_id
    and (
      d.owner_id = auth.uid()
      or public.is_admin()
      or exists (select 1 from public.dossier_shares s where s.dossier_id = d.id and s.shared_with_user_id = auth.uid() and s.permission = 'write')
    )
  );
$$;

alter table public.dossiers enable row level security;
alter table public.dossier_steps enable row level security;
alter table public.dossier_tasks enable row level security;
alter table public.dossier_documents enable row level security;
alter table public.dossier_deliverables enable row level security;
alter table public.dossier_appointments enable row level security;
alter table public.dossier_shares enable row level security;

create policy "dossiers_select" on public.dossiers for select to authenticated using (public.can_access_dossier(id));
create policy "dossiers_insert_own" on public.dossiers for insert to authenticated with check (owner_id = auth.uid());
create policy "dossiers_update" on public.dossiers for update to authenticated using (public.can_write_dossier(id)) with check (public.can_write_dossier(id));
create policy "dossiers_delete_owner" on public.dossiers for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy "dossier_steps_select" on public.dossier_steps for select to authenticated using (public.can_access_dossier(dossier_id));
create policy "dossier_steps_write" on public.dossier_steps for all to authenticated using (public.can_write_dossier(dossier_id)) with check (public.can_write_dossier(dossier_id));

create policy "dossier_tasks_select" on public.dossier_tasks for select to authenticated using (public.can_access_dossier(dossier_id));
create policy "dossier_tasks_write" on public.dossier_tasks for all to authenticated using (public.can_write_dossier(dossier_id)) with check (public.can_write_dossier(dossier_id));

create policy "dossier_documents_select" on public.dossier_documents for select to authenticated using (public.can_access_dossier(dossier_id));
create policy "dossier_documents_write" on public.dossier_documents for all to authenticated using (public.can_write_dossier(dossier_id)) with check (public.can_write_dossier(dossier_id));

create policy "dossier_deliverables_select" on public.dossier_deliverables for select to authenticated using (public.can_access_dossier(dossier_id));
create policy "dossier_deliverables_write" on public.dossier_deliverables for all to authenticated using (public.can_write_dossier(dossier_id)) with check (public.can_write_dossier(dossier_id));

create policy "dossier_appointments_select" on public.dossier_appointments for select to authenticated using (public.can_access_dossier(dossier_id));
create policy "dossier_appointments_write" on public.dossier_appointments for all to authenticated using (public.can_write_dossier(dossier_id)) with check (public.can_write_dossier(dossier_id));

create policy "dossier_shares_select" on public.dossier_shares for select to authenticated using (
  shared_with_user_id = auth.uid() or exists (select 1 from public.dossiers d where d.id = dossier_id and d.owner_id = auth.uid()) or public.is_admin()
);
create policy "dossier_shares_write_owner" on public.dossier_shares for all to authenticated using (
  exists (select 1 from public.dossiers d where d.id = dossier_id and d.owner_id = auth.uid())
) with check (
  exists (select 1 from public.dossiers d where d.id = dossier_id and d.owner_id = auth.uid())
);
