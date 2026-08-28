begin;

create schema if not exists private;
revoke all on schema private from public, anon;

alter table public.conversations
  add column if not exists direct_key text,
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_preview text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.conversation_participants
  add column if not exists member_role text not null default 'member';

alter table public.messages alter column content drop not null;
alter table public.messages
  add column if not exists client_message_id uuid not null default gen_random_uuid(),
  add column if not exists message_type text not null default 'text',
  add column if not exists status text not null default 'sent',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists uq_direct_conversation_key
  on public.conversations(direct_key) where is_group = false and direct_key is not null;
create unique index if not exists uq_message_client_id
  on public.messages(sender_id, client_message_id);
create index if not exists idx_messages_conversation_created
  on public.messages(conversation_id, created_at desc);
create index if not exists idx_conversation_participants_user_conversation
  on public.conversation_participants(user_id, conversation_id);

create or replace function private.is_conversation_member(p_conversation_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = p_user_id
  );
$$;
revoke all on function private.is_conversation_member(uuid, uuid) from public, anon;
grant execute on function private.is_conversation_member(uuid, uuid) to authenticated, service_role;

create or replace function public.get_public_profiles(p_user_ids uuid[])
returns table(id uuid, name text, title text, avatar_url text, country text, city text,
  is_verified boolean, followers_count integer, following_count integer, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  with requested as (
    select distinct value as id from unnest(coalesce(p_user_ids, '{}'::uuid[])) value
    where value is not null limit 100
  )
  select p.id, p.name, p.title, p.avatar_url, p.country, p.city,
         p.is_verified, p.followers_count, p.following_count, p.created_at
  from requested r join public.profiles p on p.id = r.id
  where auth.uid() is not null and (
    p.id = auth.uid() or exists (
      select 1
      from public.conversation_participants mine
      join public.conversation_participants theirs on theirs.conversation_id = mine.conversation_id
      where mine.user_id = auth.uid() and theirs.user_id = p.id
    )
  );
$$;

create or replace function public.create_conversation(p_member_ids uuid[], p_title text default null, p_is_group boolean default false)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid(); members uuid[]; other_user_id uuid;
  conversation_key text; new_conversation_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select coalesce(array_agg(distinct member_id), '{}'::uuid[]) into members
  from unnest(coalesce(p_member_ids, '{}'::uuid[])) member_id
  where member_id is not null and member_id <> current_user_id;
  if cardinality(members) = 0 then raise exception 'At least one other member is required' using errcode='22023'; end if;
  if cardinality(members) > 49 then raise exception 'Conversation member limit exceeded' using errcode='54000'; end if;
  if exists (select 1 from unnest(members) m where not exists (select 1 from public.profiles p where p.id=m))
    then raise exception 'Unknown conversation member' using errcode='23503'; end if;
  if not p_is_group then
    if cardinality(members) <> 1 then raise exception 'A direct conversation has exactly two members' using errcode='22023'; end if;
    other_user_id := members[1];
    conversation_key := least(current_user_id::text, other_user_id::text) || ':' || greatest(current_user_id::text, other_user_id::text);
    insert into public.conversations(is_group,title,created_by,direct_key)
    values(false,null,current_user_id,conversation_key)
    on conflict (direct_key) where is_group=false and direct_key is not null
    do update set updated_at=now() returning id into new_conversation_id;
  else
    if nullif(trim(p_title),'') is null then raise exception 'A group title is required' using errcode='22023'; end if;
    insert into public.conversations(is_group,title,created_by)
    values(true,left(trim(p_title),160),current_user_id) returning id into new_conversation_id;
  end if;
  insert into public.conversation_participants(conversation_id,user_id,member_role)
  values(new_conversation_id,current_user_id,'owner') on conflict(conversation_id,user_id) do nothing;
  insert into public.conversation_participants(conversation_id,user_id,member_role)
  select new_conversation_id,m,'member' from unnest(members) m on conflict(conversation_id,user_id) do nothing;
  return new_conversation_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns timestamptz language plpgsql security definer set search_path = ''
as $$
declare read_at timestamptz := now();
begin
  update public.conversation_participants set last_read_at=read_at
  where conversation_id=p_conversation_id and user_id=auth.uid();
  if not found then raise exception 'Conversation membership required' using errcode='42501'; end if;
  return read_at;
end;
$$;

create or replace function private.touch_conversation_from_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations set
    last_message_at=new.created_at,
    last_message_preview=left(coalesce(new.content,''),240),
    updated_at=now()
  where id=new.conversation_id;
  return new;
end;
$$;
drop trigger if exists trg_messages_touch_conversation on public.messages;
create trigger trg_messages_touch_conversation after insert on public.messages
for each row execute function private.touch_conversation_from_message();

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists conversations_select_if_participant on public.conversations;
create policy conversations_select_if_participant on public.conversations for select to authenticated
using (private.is_conversation_member(id));
drop policy if exists conversations_insert_own on public.conversations;
create policy conversations_insert_own on public.conversations for insert to authenticated
with check (created_by=auth.uid());

drop policy if exists conversation_participants_select_if_participant on public.conversation_participants;
create policy conversation_participants_select_if_participant on public.conversation_participants for select to authenticated
using (private.is_conversation_member(conversation_id));

drop policy if exists messages_select_if_participant on public.messages;
create policy messages_select_if_participant on public.messages for select to authenticated
using (private.is_conversation_member(conversation_id));
drop policy if exists messages_insert_if_participant on public.messages;
create policy messages_insert_if_participant on public.messages for insert to authenticated
with check (sender_id=auth.uid() and private.is_conversation_member(conversation_id));
drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages for update to authenticated
using (sender_id=auth.uid() and private.is_conversation_member(conversation_id))
with check (sender_id=auth.uid() and private.is_conversation_member(conversation_id));
drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages for delete to authenticated
using (sender_id=auth.uid() and private.is_conversation_member(conversation_id));

grant usage on schema public to authenticated;
revoke all on table public.conversations, public.conversation_participants, public.messages from anon;
grant select on table public.conversations, public.conversation_participants to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
grant execute on function public.create_conversation(uuid[],text,boolean) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

commit;
