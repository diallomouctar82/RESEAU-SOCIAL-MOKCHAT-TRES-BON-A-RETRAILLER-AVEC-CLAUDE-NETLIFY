-- Sans ceci, `insert into conversations ... returning id` echoue sous RLS :
-- la clause RETURNING exige que la ligne soit visible via la policy SELECT
-- (is_conversation_member), qui est fausse tant que le createur n'est pas
-- encore lui-meme un participant — probleme de l'oeuf et la poule resolu
-- en ajoutant le createur comme participant DANS LA MEME transaction, via
-- un trigger AFTER INSERT (SECURITY INVOKER — created_by = auth.uid() est
-- deja garanti par conversations_insert_own, donc user_id = auth.uid())
-- satisfait la policy conversation_participants sans privilege elargi).
create or replace function public.enroll_creator_as_participant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.conversation_participants (conversation_id, user_id, member_role)
  values (new.id, new.created_by, 'owner')
  on conflict (conversation_id, user_id) do nothing;
  return new;
end;
$$;
create trigger trg_conversations_enroll_creator
  after insert on public.conversations
  for each row execute function public.enroll_creator_as_participant();
