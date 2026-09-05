
-- ═══════════════════════════════════════════════════════════
-- IDENTITY: profiles (1:1 auth.users), skills, badges, roles
-- ═══════════════════════════════════════════════════════════

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  title text,
  role text not null default 'user' check (role in ('user','admin','expert','mentor','moderator','organization','super_admin')),
  citizenship_id text,
  level integer not null default 1,
  xp integer not null default 0,
  next_level_xp integer not null default 1000,
  credits numeric not null default 0,
  avatar_url text,
  preferred_language text not null default 'fr',
  two_factor_enabled boolean not null default false,
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil applicatif Le Monde à Vous, 1:1 avec auth.users. role/credits/xp/level protégés en écriture (voir trigger protect_profile_sensitive_columns).';

create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.profile_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_key text not null,
  name text not null,
  icon text,
  description text,
  earned_at timestamptz not null default now(),
  unique (profile_id, badge_key)
);

create index idx_profile_skills_profile_id on public.profile_skills(profile_id);
create index idx_profile_badges_profile_id on public.profile_badges(profile_id);

-- ═══════════════════════════════════════════════════════════
-- Shared helper: auto-maintain updated_at (reused by later migrations)
-- ═══════════════════════════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Protect sensitive columns: role/credits/xp/level/next_level_xp
-- can never be changed by a direct client UPDATE, only by
-- service_role (i.e. a SECURITY DEFINER RPC function).
-- ═══════════════════════════════════════════════════════════
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.credits := old.credits;
    new.xp := old.xp;
    new.level := old.level;
    new.next_level_xp := old.next_level_xp;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_protect_sensitive
before update on public.profiles
for each row execute function public.protect_profile_sensitive_columns();

-- ═══════════════════════════════════════════════════════════
-- is_admin(): SECURITY DEFINER helper so RLS policies can check
-- role without recursive-RLS issues on public.profiles itself.
-- ═══════════════════════════════════════════════════════════
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','super_admin')
  );
$$;

-- ═══════════════════════════════════════════════════════════
-- Bootstrap: auto-create profile row when a new auth.users row
-- is created (Google OAuth or any future provider). Admin role
-- is granted only to the bootstrap admin email, server-side —
-- never client-computed again.
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_name text;
  v_avatar text;
begin
  v_role := case when lower(new.email) = 'visionsmart224@gmail.com' then 'admin' else 'user' end;
  v_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,'utilisateur'), '@', 1));
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');

  insert into public.profiles (id, email, name, role, avatar_url, citizenship_id, credits, level, xp, next_level_xp)
  values (
    new.id,
    coalesce(new.email, ''),
    v_name,
    v_role,
    v_avatar,
    'LMAV-' || to_char(now(),'YYYY') || '-' || lpad(floor(random()*9000+1000)::text,4,'0') || '-XX',
    case when v_role = 'admin' then 1000000 else 150 end,
    case when v_role = 'admin' then 99 else 1 end,
    case when v_role = 'admin' then 999999 else 0 end,
    1000
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- Public-safe card view (id, name, avatar_url, title, level) —
-- readable by anyone, used for mentions/author display without
-- exposing the full profile row (email, credits, medical-like data).
-- ═══════════════════════════════════════════════════════════
create view public.profile_cards
with (security_invoker = false)
as
  select id, name, avatar_url, title, level, role
  from public.profiles;

grant select on public.profile_cards to anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_badges enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin" on public.profiles
for update to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

-- No client-side INSERT/DELETE policy on purpose: rows are created
-- only by the handle_new_user trigger (SECURITY DEFINER, bypasses RLS)
-- and deleted only via auth.users cascade.

create policy "profile_skills_select_own_or_admin" on public.profile_skills
for select to authenticated
using (auth.uid() = profile_id or public.is_admin());

create policy "profile_skills_write_own" on public.profile_skills
for insert to authenticated with check (auth.uid() = profile_id);

create policy "profile_skills_update_own" on public.profile_skills
for update to authenticated
using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "profile_skills_delete_own" on public.profile_skills
for delete to authenticated
using (auth.uid() = profile_id);

create policy "profile_badges_select_own_or_admin" on public.profile_badges
for select to authenticated
using (auth.uid() = profile_id or public.is_admin());

create policy "profile_badges_write_own" on public.profile_badges
for insert to authenticated with check (auth.uid() = profile_id);

create policy "profile_badges_delete_own" on public.profile_badges
for delete to authenticated
using (auth.uid() = profile_id);
