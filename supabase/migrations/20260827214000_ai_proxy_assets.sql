-- Backend minimal requis par les modules IA/Studio partiels : quota, propriété
-- des opérations et actifs privés. Aucun secret n'est exposé au navigateur.
begin;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.api_usage_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count>=0),
  primary key(user_id,scope,window_started_at)
);
alter table public.api_usage_windows enable row level security;
create or replace function public.consume_api_quota(p_user_id uuid,p_scope text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_window timestamptz; v_count integer;
begin
  if p_limit<1 or p_window_seconds<1 then return false; end if;
  v_window:=to_timestamp(floor(extract(epoch from timezone('utc',now()))/p_window_seconds)*p_window_seconds);
  insert into public.api_usage_windows(user_id,scope,window_started_at,request_count)
  values(p_user_id,p_scope,v_window,1)
  on conflict(user_id,scope,window_started_at) do update set request_count=public.api_usage_windows.request_count+1
  returning request_count into v_count;
  return v_count<=p_limit;
end;
$$;
revoke all on function public.consume_api_quota(uuid,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_quota(uuid,text,integer,integer) to service_role;

create table if not exists public.ai_generated_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) between 38 and 240),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','audio/wav','video/mp4','video/webm')),
  byte_size bigint not null check (byte_size between 1 and 104857600),
  created_at timestamptz not null default timezone('utc',now())
);
create table if not exists public.ai_operations (
  operation_name text primary key check (char_length(operation_name) between 5 and 300),
  owner_id uuid not null references auth.users(id) on delete cascade,
  model text not null check (char_length(model) between 3 and 100),
  status text not null check (status in ('running','completed','failed')),
  storage_path text references public.ai_generated_assets(storage_path) on delete set null,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);
drop trigger if exists ai_operations_set_updated_at on public.ai_operations;
create trigger ai_operations_set_updated_at before update on public.ai_operations
for each row execute function public.set_updated_at();
alter table public.ai_generated_assets enable row level security;
alter table public.ai_operations enable row level security;
drop policy if exists ai_generated_assets_select_own on public.ai_generated_assets;
create policy ai_generated_assets_select_own on public.ai_generated_assets for select to authenticated
using(owner_id=auth.uid());
drop policy if exists ai_operations_select_own on public.ai_operations;
create policy ai_operations_select_own on public.ai_operations for select to authenticated
using(owner_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('studio-generated','studio-generated',false,104857600,array['image/png','image/jpeg','image/webp','audio/wav','video/mp4','video/webm','application/pdf'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists studio_generated_select_own on storage.objects;
create policy studio_generated_select_own on storage.objects for select to authenticated
using(bucket_id='studio-generated' and (storage.foldername(name))[1]=auth.uid()::text);

commit;
