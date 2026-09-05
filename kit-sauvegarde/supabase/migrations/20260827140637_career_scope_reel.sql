
-- ═══════════════════════════════════════════════════════════
-- CARRIÈRE — scope réel uniquement (Radar + CV Maître, seuls
-- sous-domaines avec CRUD prouvé). career_snapshots reçoit les
-- ~70 autres types (Boussole, simulations, journal...) en jsonb
-- tant qu'aucun n'a prouvé de besoin relationnel.
-- ═══════════════════════════════════════════════════════════

create table public.career_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  archetype text,
  point_a jsonb,
  point_b jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.career_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  organization text,
  universe text,
  match_score integer,
  status text not null default 'new',
  vault_status text,
  is_favorite boolean not null default false,
  source text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.career_opportunity_feedback (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.career_opportunities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback_type text,
  decline_reason text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.career_search_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  criteria jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.master_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.career_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  payload jsonb not null,
  generated_at timestamptz not null default now()
);

create index idx_career_goals_user on public.career_goals(user_id);
create index idx_career_opportunities_user on public.career_opportunities(user_id);
create index idx_career_opportunity_feedback_opportunity on public.career_opportunity_feedback(opportunity_id);
create index idx_career_search_missions_user on public.career_search_missions(user_id);
create index idx_career_snapshots_user_kind on public.career_snapshots(user_id, kind);

create trigger trg_career_goals_updated_at before update on public.career_goals for each row execute function public.set_updated_at();
create trigger trg_career_opportunities_updated_at before update on public.career_opportunities for each row execute function public.set_updated_at();
create trigger trg_career_search_missions_updated_at before update on public.career_search_missions for each row execute function public.set_updated_at();
create trigger trg_master_resumes_updated_at before update on public.master_resumes for each row execute function public.set_updated_at();

alter table public.career_goals enable row level security;
alter table public.career_opportunities enable row level security;
alter table public.career_opportunity_feedback enable row level security;
alter table public.career_search_missions enable row level security;
alter table public.master_resumes enable row level security;
alter table public.career_snapshots enable row level security;

create policy "career_goals_owner" on public.career_goals for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
create policy "career_opportunities_owner" on public.career_opportunities for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
create policy "career_opportunity_feedback_owner" on public.career_opportunity_feedback for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
create policy "career_search_missions_owner" on public.career_search_missions for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
create policy "master_resumes_owner" on public.master_resumes for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
create policy "career_snapshots_owner" on public.career_snapshots for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());
