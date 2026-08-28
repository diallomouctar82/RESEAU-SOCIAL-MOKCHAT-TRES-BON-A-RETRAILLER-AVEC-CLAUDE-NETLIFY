begin;

revoke all on table public.conversations, public.conversation_participants, public.messages from anon;
grant select on table public.conversations, public.conversation_participants to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;

commit;
