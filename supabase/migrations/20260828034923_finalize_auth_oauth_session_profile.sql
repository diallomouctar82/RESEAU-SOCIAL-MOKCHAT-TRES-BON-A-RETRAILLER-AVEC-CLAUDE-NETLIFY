-- Finalise exclusivement le contrat Auth OAuth/session/profil.
-- Migration additive et idempotente : les identités, rôles et soldes existants
-- sont conservés. Les nouvelles identités commencent toujours comme `user`.

begin;

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists privacy_settings jsonb not null
  default '{"profileVisibility":"network","allowMessagesFrom":"network","showOnlineStatus":true}'::jsonb;
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists followers_count integer not null default 0;
alter table public.profiles add column if not exists following_count integer not null default 0;

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active', 'pending', 'suspended')) not valid;
alter table public.profiles validate constraint profiles_status_check;

-- Répare uniquement les lignes manquantes et les champs d'identité vides.
insert into public.profiles (
  id, email, name, role, status, avatar_url, citizenship_id,
  credits, level, xp, next_level_xp
)
select
  u.id,
  coalesce(u.email, ''),
  left(coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(u.email, 'utilisateur'), '@', 1)
  ), 120),
  'user',
  'active',
  coalesce(
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  ),
  'LMAV-' || upper(substr(replace(u.id::text, '-', ''), 1, 12)),
  0, 1, 0, 1000
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles p
set email = case when p.email = '' then coalesce(u.email, '') else p.email end,
    name = case when p.name = '' then left(coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(u.email, 'utilisateur'), '@', 1)
    ), 120) else p.name end,
    avatar_url = coalesce(
      p.avatar_url,
      nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(u.raw_user_meta_data ->> 'picture', '')
    ),
    updated_at = now()
from auth.users u
where p.id = u.id
  and (p.email = '' or p.name = '' or p.avatar_url is null);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(new.email, 'utilisateur'), '@', 1)
  );
  v_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  -- Compatible avec le garde de colonnes sensibles installé par les
  -- environnements déjà réconciliés.
  perform set_config('app.bypass_profile_guard', 'on', true);

  insert into public.profiles (
    id, email, name, role, status, avatar_url, citizenship_id,
    credits, level, xp, next_level_xp
  ) values (
    new.id,
    coalesce(new.email, ''),
    left(v_name, 120),
    'user',
    'active',
    v_avatar,
    'LMAV-' || upper(substr(replace(new.id::text, '-', ''), 1, 12)),
    0, 1, 0, 1000
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case when public.profiles.name = '' then excluded.name else public.profiles.name end,
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

alter table public.profiles enable row level security;
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
drop policy if exists profiles_select_self_or_admin on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_select_self_or_admin on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

-- L'UPDATE direct est volontairement interdit : seul l'appel RPC ci-dessous
-- accepte les champs publics autorisés.
revoke update on table public.profiles from authenticated;

create or replace function public.update_my_profile(p_changes jsonb)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_unknown_key text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if jsonb_typeof(coalesce(p_changes, '{}'::jsonb)) <> 'object' then
    raise exception 'Profile changes must be a JSON object' using errcode = '22023';
  end if;
  if p_changes ? 'interests' and jsonb_typeof(p_changes -> 'interests') <> 'array' then
    raise exception 'interests must be an array' using errcode = '22023';
  end if;
  if p_changes ? 'privacy_settings' and jsonb_typeof(p_changes -> 'privacy_settings') <> 'object' then
    raise exception 'privacy_settings must be an object' using errcode = '22023';
  end if;

  select key into v_unknown_key
  from jsonb_object_keys(coalesce(p_changes, '{}'::jsonb)) as key
  where key <> all(array[
    'name','title','bio','country','city','phone','website','avatar_url',
    'preferred_language','interests','privacy_settings'
  ])
  limit 1;
  if v_unknown_key is not null then
    raise exception 'Profile field is not client-editable: %', v_unknown_key using errcode = '42501';
  end if;

  update public.profiles p set
    name = case when p_changes ? 'name' then coalesce(left(nullif(trim(p_changes->>'name'), ''), 120), p.name) else p.name end,
    title = case when p_changes ? 'title' then left(nullif(trim(p_changes->>'title'), ''), 160) else p.title end,
    bio = case when p_changes ? 'bio' then left(p_changes->>'bio', 2000) else p.bio end,
    country = case when p_changes ? 'country' then left(p_changes->>'country', 120) else p.country end,
    city = case when p_changes ? 'city' then left(p_changes->>'city', 160) else p.city end,
    phone = case when p_changes ? 'phone' then left(p_changes->>'phone', 40) else p.phone end,
    website = case when p_changes ? 'website' then left(p_changes->>'website', 500) else p.website end,
    avatar_url = case when p_changes ? 'avatar_url' then left(p_changes->>'avatar_url', 2000) else p.avatar_url end,
    preferred_language = case when p_changes ? 'preferred_language' then left(p_changes->>'preferred_language', 12) else p.preferred_language end,
    interests = case when p_changes ? 'interests' then array(select jsonb_array_elements_text(p_changes->'interests')) else p.interests end,
    privacy_settings = case when p_changes ? 'privacy_settings' then p_changes->'privacy_settings' else p.privacy_settings end
  where p.id = auth.uid()
  returning p.* into v_profile;

  if v_profile.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  return v_profile;
end;
$$;

revoke all on function public.update_my_profile(jsonb) from public, anon;
grant execute on function public.update_my_profile(jsonb) to authenticated;

commit;
