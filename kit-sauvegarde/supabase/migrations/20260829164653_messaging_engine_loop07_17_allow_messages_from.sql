-- LOOP 07/17 (Architecte MOCnet, moteur de messagerie : intelligence &
-- permissions) — jusqu'ici `profiles.privacy_settings->>'allowMessagesFrom'`
-- (colonne réelle, UI de réglage réelle dans MemberProfileModal.tsx) n'était
-- vérifié dans AUCUNE policy : confirmé par lecture directe de pg_policies
-- (seules is_conversation_member()/are_users_blocked() y apparaissent) et
-- par recherche du littéral dans pg_proc.prosrc (0 résultat). N'importe qui
-- pouvait donc ajouter n'importe qui à une conversation quel que soit son
-- réglage "qui peut m'écrire". Réutilise exactement le même patron que
-- can_send_friend_request (LOOP 04/17) — combine blocage + préférence —
-- plutôt qu'un second mécanisme de permission indépendant.
create or replace function public.can_message_user(p_sender uuid, p_recipient uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref text;
begin
  if p_sender = p_recipient then
    return true;
  end if;
  if public.are_users_blocked(p_sender, p_recipient) then
    return false;
  end if;

  select coalesce(privacy_settings->>'allowMessagesFrom', 'all') into v_pref
  from public.profiles where id = p_recipient;

  if v_pref = 'none' then
    return false;
  elsif v_pref = 'network' then
    return exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester_id = p_sender and f.addressee_id = p_recipient)
          or (f.requester_id = p_recipient and f.addressee_id = p_sender))
    );
  else
    return true; -- 'all' (défaut)
  end if;
end;
$$;
revoke all on function public.can_message_user(uuid, uuid) from public;
grant execute on function public.can_message_user(uuid, uuid) to authenticated;
revoke execute on function public.can_message_user(uuid, uuid) from anon;

-- Appliqué au même endroit que are_users_blocked (INSERT sur
-- conversation_participants) : la préférence de la personne AJOUTÉE est
-- vérifiée quand ce n'est pas elle-même qui s'ajoute (self-add — ex.
-- rejoindre après une invitation déjà validée ailleurs — toujours autorisé).
drop policy if exists conversation_participants_insert_if_member_or_self on public.conversation_participants;
create policy conversation_participants_insert_if_member_or_self on public.conversation_participants
  for insert to authenticated
  with check (
    (
      user_id = auth.uid()
      or exists (
        select 1 from public.conversation_participants cp2
        where cp2.conversation_id = conversation_participants.conversation_id
          and cp2.user_id = auth.uid()
      )
      or exists (
        select 1 from public.conversations c
        where c.id = conversation_participants.conversation_id
          and c.created_by = auth.uid()
      )
    )
    and (user_id = auth.uid() or not public.are_users_blocked(auth.uid(), user_id))
    and (user_id = auth.uid() or public.can_message_user(auth.uid(), user_id))
  );
