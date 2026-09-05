-- LV-4 — Inviter un ami dans un direct.
--
-- La policy `notifications_owner` n'autorise chacun à écrire QUE ses propres
-- notifications : sans cette fonction, inviter quelqu'un est structurellement
-- impossible côté client (et c'est exactement pour ça que l'invitation
-- n'existait nulle part dans le produit). Même patron que
-- `can_message_user` / `discover_profiles` : SECURITY DEFINER étroite, droits
-- vérifiés DANS la fonction, EXECUTE révoqué pour anon dès l'origine.
create or replace function public.invite_to_live_session(p_session_id uuid, p_invitee_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := (select auth.uid());
  v_title text;
  v_host_name text;
begin
  if v_caller is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  -- Seul l'animateur (ou un modérateur) de CE direct peut inviter : une
  -- invitation est une sollicitation, pas une action ouverte à tous.
  if not is_live_moderator_or_host(p_session_id) then
    raise exception 'Seul l''animateur de ce direct peut inviter quelqu''un.' using errcode = '42501';
  end if;

  if p_invitee_id = v_caller then
    return; -- s'inviter soi-même n'a pas de sens : sans effet, sans erreur.
  end if;

  -- Le blocage est respecté ici comme partout ailleurs : la voix, l'écran et
  -- l'invitation n'ont jamais plus de droits les uns que les autres.
  if are_users_blocked(v_caller, p_invitee_id) then
    raise exception 'Invitation impossible.' using errcode = '42501';
  end if;

  select title, coalesce(host_name, '') into v_title, v_host_name
  from live_sessions where id = p_session_id;

  if v_title is null then
    raise exception 'Direct introuvable.' using errcode = 'P0002';
  end if;

  -- Anti-doublon : tant que l'invitation précédente n'est pas lue, on n'en
  -- crée pas une seconde (double clic, retry réseau, insistance).
  if exists (
    select 1 from notifications
    where user_id = p_invitee_id
      and type = 'live_invite'
      and target_action = 'live:' || p_session_id::text
      and read = false
  ) then
    return;
  end if;

  insert into notifications (user_id, type, title, message, priority, target_action)
  values (
    p_invitee_id,
    'live_invite',
    'Invitation à un direct',
    coalesce(nullif(v_host_name, ''), 'Un membre') || ' vous invite au direct « ' || v_title || ' »',
    'high',
    'live:' || p_session_id::text
  );
end;
$$;

revoke all on function public.invite_to_live_session(uuid, uuid) from public;
revoke all on function public.invite_to_live_session(uuid, uuid) from anon;
grant execute on function public.invite_to_live_session(uuid, uuid) to authenticated;
