-- L5 (assainissement Live) — la visibilité du direct, vérifiée et rendue cohérente.
--
-- Constat (base réelle) : can_view_live_session() n'honorait PAS
-- allowed_member_ids, et invite_to_live_session() ne le peuplait pas — une
-- personne invitée à un direct PRIVÉ ne pouvait donc pas entrer (l'invitation
-- n'écrivait qu'une notification, que rien dans le contrôle d'accès ne lit).
-- Par ailleurs, la policy d'écriture de live_speakers laissait N'IMPORTE QUI
-- s'auto-inscrire (user_id = auth.uid()) sur N'IMPORTE QUEL direct — donc un
-- direct « privé » n'était pas réellement privé.
-- Zéro régression : 0 direct privé, 0 allowed_member_ids peuplé, 26 directs
-- publics inchangés (is_private=false court-circuite tout).

-- 1) can_view : l'invité (allowed_member_ids) peut voir/entrer.
create or replace function public.can_view_live_session(p_session_id uuid)
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select exists (
    select 1 from public.live_sessions s
    where s.id = p_session_id
    and (
      s.is_private = false
      or s.host_id = auth.uid()
      or public.is_admin()
      or auth.uid() = any(s.allowed_member_ids)
      or exists (select 1 from public.live_speakers sp where sp.session_id = s.id and sp.user_id = auth.uid())
      or exists (select 1 from public.live_attendance a where a.session_id = s.id and a.participant_id = auth.uid())
    )
  );
$function$;

-- 2) invite : l'invitation GRANTe réellement l'entrée (allowed_member_ids),
--    en plus de la notification. Idempotent.
create or replace function public.invite_to_live_session(p_session_id uuid, p_invitee_id uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_caller uuid := (select auth.uid());
  v_title text;
  v_host_name text;
begin
  if v_caller is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  if not is_live_moderator_or_host(p_session_id) then
    raise exception 'Seul l''animateur de ce direct peut inviter quelqu''un.' using errcode = '42501';
  end if;

  if p_invitee_id = v_caller then
    return;
  end if;

  if are_users_blocked(v_caller, p_invitee_id) then
    raise exception 'Invitation impossible.' using errcode = '42501';
  end if;

  select title, coalesce(host_name, '') into v_title, v_host_name
  from live_sessions where id = p_session_id;

  if v_title is null then
    raise exception 'Direct introuvable.' using errcode = 'P0002';
  end if;

  -- L5 — donner l'accès réel (même pour un direct privé), idempotent.
  update live_sessions
  set allowed_member_ids = coalesce(allowed_member_ids, '{}') || p_invitee_id
  where id = p_session_id
    and not (p_invitee_id = any(coalesce(allowed_member_ids, '{}')));

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
$function$;

-- 3) live_speakers : l'auto-inscription n'est permise que si la personne peut
--    réellement voir le direct — un direct privé cesse d'être auto-joignable.
--    Pour un direct public, can_view = true → comportement identique.
alter policy live_speakers_write_host_or_moderator on public.live_speakers
  with check (
    is_live_moderator_or_host(session_id)
    or (user_id = (select auth.uid()) and can_view_live_session(session_id))
  );
