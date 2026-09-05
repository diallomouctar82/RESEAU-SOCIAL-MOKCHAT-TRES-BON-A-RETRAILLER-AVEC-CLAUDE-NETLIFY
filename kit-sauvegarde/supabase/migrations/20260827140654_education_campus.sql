
-- ═══════════════════════════════════════════════════════════
-- ÉDUCATION / CAMPUS — courses, enrollments, exams, certificates.
-- Corrige le bug d'index de cloud.ts (certificats indexés sur
-- studentName au lieu d'un vrai user_id).
-- ═══════════════════════════════════════════════════════════

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  academic_level text,
  country_code text,
  duration_minutes integer,
  thumbnail_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  lesson_progress jsonb not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  score numeric,
  passed boolean,
  answers jsonb,
  taken_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete set null,
  certificate_url text,
  issued_at timestamptz not null default now()
);

create index idx_enrollments_user on public.enrollments(user_id);
create index idx_enrollments_course on public.enrollments(course_id);
create index idx_exam_sessions_enrollment on public.exam_sessions(enrollment_id);
create index idx_certificates_user on public.certificates(user_id);

alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.certificates enable row level security;

create policy "courses_select_published_or_admin" on public.courses
for select to authenticated using (is_published or public.is_admin());
create policy "courses_write_admin" on public.courses
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "enrollments_owner" on public.enrollments for all to authenticated
using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid());

create policy "exam_sessions_owner" on public.exam_sessions for all to authenticated
using (exists (select 1 from public.enrollments e where e.id = enrollment_id and (e.user_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));

create policy "certificates_select_owner" on public.certificates for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy "certificates_insert_system" on public.certificates for insert to authenticated
with check (user_id = auth.uid());
