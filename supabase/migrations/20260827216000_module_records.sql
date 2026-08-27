-- Persistance partagée des modules métier encore sans schéma relationnel dédié.
begin;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create table if not exists public.module_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in (
    'dossiers','career','campus','languages','health','housing','legal',
    'mobility','studio','google_workspace'
  )),
  record_type text not null check (char_length(record_type) between 1 and 80),
  status text not null default 'active' check (status in ('draft','active','completed','archived','deleted')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  version integer not null default 1 check (version > 0),
  idempotency_key text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  unique (owner_id, module, idempotency_key)
);
create index if not exists module_records_owner_module_idx
  on public.module_records(owner_id, module, record_type, updated_at desc)
  where deleted_at is null;
drop trigger if exists module_records_set_updated_at on public.module_records;
create or replace function public.touch_module_record()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = timezone('utc',now());
  new.version = old.version + 1;
  return new;
end;
$$;
create trigger module_records_set_updated_at before update on public.module_records
for each row execute function public.touch_module_record();

alter table public.module_records enable row level security;
drop policy if exists module_records_select_own on public.module_records;
create policy module_records_select_own on public.module_records for select to authenticated
using (owner_id = auth.uid() or public.is_platform_admin());
drop policy if exists module_records_insert_own on public.module_records;
create policy module_records_insert_own on public.module_records for insert to authenticated
with check (owner_id = auth.uid());
drop policy if exists module_records_update_own on public.module_records;
create policy module_records_update_own on public.module_records for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists module_records_delete_own on public.module_records;
create policy module_records_delete_own on public.module_records for delete to authenticated
using (owner_id = auth.uid());

commit;
