-- Correctif immédiat (avant tout usage réel) : le libellé exact déjà affiché
-- dans MemberProfileModal.tsx pour allowMessagesFrom='network' est
-- "Uniquement mes abonnés et contacts réciproques" — plus large qu'une
-- simple amitié acceptée. "mes abonnés" = les personnes qui suivent le
-- destinataire (table follows, LOOP 04/17), "contacts réciproques" =
-- amitié acceptée (la seule relation véritablement mutuelle du dépôt).
-- La première version de can_message_user() ne vérifiait que l'amitié —
-- corrigé avant tout test réel pour respecter le libellé déjà engagé
-- auprès des utilisateurs.
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
    ) or exists (
      select 1 from public.follows fo
      where fo.follower_id = p_sender and fo.followee_id = p_recipient
    );
  else
    return true; -- 'all' (défaut)
  end if;
end;
$$;
revoke all on function public.can_message_user(uuid, uuid) from public;
grant execute on function public.can_message_user(uuid, uuid) to authenticated;
revoke execute on function public.can_message_user(uuid, uuid) from anon;
