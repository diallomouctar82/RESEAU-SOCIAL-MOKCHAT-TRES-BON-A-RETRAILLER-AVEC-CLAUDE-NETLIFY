-- SECURITY DEFINER : ce trigger effectue un seul effet de bord garanti sur
-- et provablement sans risque — le createur (new.created_by, deja
-- contraint par conversations_insert_own a etre auth.uid()) devient
-- participant de SA PROPRE conversation qu'il vient de creer. Aucune
-- marge d'abus possible (les valeurs proviennent de la ligne deja validee
-- par la policy d'insertion de conversations, jamais d'une entree
-- utilisateur arbitraire).
create or replace function public.enroll_creator_as_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.conversation_participants (conversation_id, user_id, member_role)
  values (new.id, new.created_by, 'owner')
  on conflict (conversation_id, user_id) do nothing;
  return new;
end;
$$;
