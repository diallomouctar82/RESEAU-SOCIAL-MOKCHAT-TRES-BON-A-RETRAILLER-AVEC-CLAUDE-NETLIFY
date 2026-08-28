begin;

alter table public.profiles
  add column if not exists permissions jsonb not null default '["standard_access"]'::jsonb,
  add column if not exists admin_notes text;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id, created_at desc);

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from public, anon, authenticated;
grant select, insert, update, delete on table public.audit_logs to service_role;

create table if not exists public.admin_api_rate_limits (
  actor_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.admin_api_rate_limits enable row level security;
revoke all on table public.admin_api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_api_rate_limits to service_role;

create or replace function public.admin_consume_rate_limit(p_actor_id uuid, p_limit integer default 30)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare accepted_actor uuid;
begin
  if p_actor_id is null or p_limit < 1 or p_limit > 300 then return false; end if;
  insert into public.admin_api_rate_limits as limits(actor_id, window_started_at, request_count, updated_at)
  values (p_actor_id, now(), 1, now())
  on conflict (actor_id) do update set
    window_started_at = case when limits.window_started_at <= now() - interval '1 minute' then now() else limits.window_started_at end,
    request_count = case when limits.window_started_at <= now() - interval '1 minute' then 1 else limits.request_count + 1 end,
    updated_at = now()
  where limits.window_started_at <= now() - interval '1 minute' or limits.request_count < p_limit
  returning actor_id into accepted_actor;
  return accepted_actor is not null;
end;
$$;

revoke all on function public.admin_consume_rate_limit(uuid, integer) from public, anon, authenticated;
grant execute on function public.admin_consume_rate_limit(uuid, integer) to service_role;

update public.profiles
set permissions = case
  when role = 'super_admin' then '["all"]'::jsonb
  when role = 'admin' and permissions = '["standard_access"]'::jsonb
    then '["manage_users","manage_roles","manage_permissions","suspend_users","delete_users","view_audit_logs"]'::jsonb
  else permissions
end;

commit;
