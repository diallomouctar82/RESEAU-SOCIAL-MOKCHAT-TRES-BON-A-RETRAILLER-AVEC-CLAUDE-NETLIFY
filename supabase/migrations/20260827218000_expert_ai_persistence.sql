-- Persistance durable des échanges Experts DIALLO et des résultats d'orchestration.
-- Cette migration reste additive : les messages historiques conservent une clé
-- d'idempotence NULL, tandis que les nouvelles écritures peuvent fournir un UUID.
begin;

alter table public.module_records
  drop constraint if exists module_records_module_check;
alter table public.module_records
  add constraint module_records_module_check check (module in (
    'dossiers','career','campus','languages','health','housing','legal',
    'mobility','studio','google_workspace','experts'
  ));

revoke all on table public.module_records from anon;
revoke all on table public.module_records from authenticated;
grant select, insert, update, delete on table public.module_records to authenticated;

alter table public.agent_chat_messages
  add column if not exists idempotency_key uuid;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_chat_messages_session_idempotency_key_key'
      and conrelid = 'public.agent_chat_messages'::regclass
  ) then
    alter table public.agent_chat_messages
      add constraint agent_chat_messages_session_idempotency_key_key
      unique (session_id, idempotency_key);
  end if;
end;
$migration$;

alter table public.agent_chat_sessions enable row level security;
alter table public.agent_chat_messages enable row level security;

revoke all on table public.agent_chat_sessions from anon;
revoke all on table public.agent_chat_messages from anon;
revoke all on table public.agent_chat_sessions from authenticated;
revoke all on table public.agent_chat_messages from authenticated;
grant select, insert, update, delete on table public.agent_chat_sessions to authenticated;
grant select, insert, update, delete on table public.agent_chat_messages to authenticated;

drop policy if exists agent_chat_sessions_owner on public.agent_chat_sessions;
drop policy if exists agent_chat_sessions_select_own on public.agent_chat_sessions;
drop policy if exists agent_chat_sessions_insert_own on public.agent_chat_sessions;
drop policy if exists agent_chat_sessions_update_own on public.agent_chat_sessions;
drop policy if exists agent_chat_sessions_delete_own on public.agent_chat_sessions;
create policy agent_chat_sessions_select_own
  on public.agent_chat_sessions for select to authenticated
  using (user_id = (select auth.uid()));
create policy agent_chat_sessions_insert_own
  on public.agent_chat_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy agent_chat_sessions_update_own
  on public.agent_chat_sessions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy agent_chat_sessions_delete_own
  on public.agent_chat_sessions for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists agent_chat_messages_owner on public.agent_chat_messages;
drop policy if exists agent_chat_messages_select_own on public.agent_chat_messages;
drop policy if exists agent_chat_messages_insert_own on public.agent_chat_messages;
drop policy if exists agent_chat_messages_update_own on public.agent_chat_messages;
drop policy if exists agent_chat_messages_delete_own on public.agent_chat_messages;
create policy agent_chat_messages_select_own
  on public.agent_chat_messages for select to authenticated
  using (
    exists (
      select 1
      from public.agent_chat_sessions session
      where session.id = agent_chat_messages.session_id
        and session.user_id = (select auth.uid())
    )
  );
create policy agent_chat_messages_insert_own
  on public.agent_chat_messages for insert to authenticated
  with check (
    exists (
      select 1
      from public.agent_chat_sessions session
      where session.id = agent_chat_messages.session_id
        and session.user_id = (select auth.uid())
    )
  );
create policy agent_chat_messages_update_own
  on public.agent_chat_messages for update to authenticated
  using (
    exists (
      select 1
      from public.agent_chat_sessions session
      where session.id = agent_chat_messages.session_id
        and session.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.agent_chat_sessions session
      where session.id = agent_chat_messages.session_id
        and session.user_id = (select auth.uid())
    )
  );
create policy agent_chat_messages_delete_own
  on public.agent_chat_messages for delete to authenticated
  using (
    exists (
      select 1
      from public.agent_chat_sessions session
      where session.id = agent_chat_messages.session_id
        and session.user_id = (select auth.uid())
    )
  );

create or replace function public.touch_agent_chat_session_from_message()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.agent_chat_sessions
  set updated_at = timezone('utc', now())
  where id = new.session_id;
  return new;
end;
$$;
revoke all on function public.touch_agent_chat_session_from_message() from public, anon;
grant execute on function public.touch_agent_chat_session_from_message() to authenticated, service_role;

drop trigger if exists agent_chat_messages_touch_session on public.agent_chat_messages;
create trigger agent_chat_messages_touch_session
after insert on public.agent_chat_messages
for each row execute function public.touch_agent_chat_session_from_message();

commit;
