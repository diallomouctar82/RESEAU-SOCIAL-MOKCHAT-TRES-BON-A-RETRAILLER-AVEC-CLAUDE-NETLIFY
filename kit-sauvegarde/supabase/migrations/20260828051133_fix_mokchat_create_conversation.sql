begin;

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

revoke all on function public.create_conversation(uuid[],text,boolean) from public, anon;
grant execute on function public.create_conversation(uuid[],text,boolean) to authenticated, service_role;

commit;
