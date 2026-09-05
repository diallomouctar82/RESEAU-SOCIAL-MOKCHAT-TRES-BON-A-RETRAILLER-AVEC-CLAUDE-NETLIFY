-- LOOP 06/17 (Architecte MOCnet) — moteur de messagerie : fondation
-- 1. Correctif de securite : la policy d'origine comparait
--    cp2.conversation_id a lui-meme (tautologie toujours vraie), rendant
--    la verification d'appartenance non correlee a la conversation cible —
--    n'importe quel utilisateur deja membre d'UNE conversation quelconque
--    pouvait ajouter n'importe qui a n'importe QUELLE AUTRE conversation.
--    Corrige : correlation reelle a la ligne inseree + verification de
--    blocage quand on ajoute quelqu'un d'autre que soi-meme.
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
  );

-- 2. Une conversation directe (non-groupe) ne doit pas permettre d'envoyer
--    un message si l'une des deux parties a bloque l'autre — reutilise
--    exactement are_users_blocked (LOOP 04/17), pas un second mecanisme.
drop policy if exists messages_insert_if_participant on public.messages;
create policy messages_insert_if_participant on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and private.is_conversation_member(conversation_id)
    and not exists (
      select 1 from public.conversations c
      join public.conversation_participants cp on cp.conversation_id = c.id
      where c.id = messages.conversation_id
        and c.is_group = false
        and cp.user_id <> auth.uid()
        and public.are_users_blocked(auth.uid(), cp.user_id)
    )
  );

-- 3. Reaction atomique — la mise a jour precedente cote client faisait un
--    lire-modifier-ecrire sujet a une condition de course entre deux
--    personnes reagissant en meme temps. SECURITY DEFINER necessaire car
--    une reaction doit pouvoir etre ajoutee par N'IMPORTE QUEL membre de
--    la conversation, pas seulement l'auteur du message (que la policy
--    messages_update_own restreindrait sinon) — verification explicite
--    d'appartenance a l'interieur, meme motif que les fonctions LOOP 04/17.
create or replace function public.toggle_message_reaction(p_message_id uuid, p_emoji text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_reactions jsonb;
  v_users jsonb;
  v_uid_text text := auth.uid()::text;
  v_new_users jsonb;
begin
  select conversation_id, coalesce(metadata->'reactions', '{}'::jsonb)
    into v_conversation_id, v_reactions
    from public.messages where id = p_message_id
    for update;

  if v_conversation_id is null then
    raise exception 'Message introuvable';
  end if;
  if not private.is_conversation_member(v_conversation_id) then
    raise exception 'Non autorise';
  end if;

  v_users := coalesce(v_reactions->p_emoji, '[]'::jsonb);
  if v_users @> to_jsonb(v_uid_text) then
    select coalesce(jsonb_agg(u), '[]'::jsonb) into v_new_users
      from jsonb_array_elements_text(v_users) u where u <> v_uid_text;
  else
    v_new_users := v_users || to_jsonb(v_uid_text);
  end if;

  if jsonb_array_length(v_new_users) = 0 then
    v_reactions := v_reactions - p_emoji;
  else
    v_reactions := jsonb_set(v_reactions, array[p_emoji], v_new_users);
  end if;

  update public.messages set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{reactions}', v_reactions)
    where id = p_message_id;

  return v_reactions;
end;
$$;
revoke all on function public.toggle_message_reaction(uuid, text) from public;
grant execute on function public.toggle_message_reaction(uuid, text) to authenticated;
revoke execute on function public.toggle_message_reaction(uuid, text) from anon;
