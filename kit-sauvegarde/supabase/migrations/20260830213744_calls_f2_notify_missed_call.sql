-- Équipe F2 : un appel manqué doit atteindre la cloche de l'appelé MÊME SI
-- son application est fermée (le broadcast de signalisation est éphémère, et
-- la RLS notifications_owner n'autorise que l'auto-insertion). L'APPELANT
-- déclenche donc cette fonction au timeout sans réponse / à l'annulation.
-- Garde anti-abus : réservée aux membres d'une conversation directe commune
-- (même famille de gardes que can_message_user / notify_live_started).

create or replace function public.notify_missed_call(p_callee uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_name text;
begin
  if v_caller is null or p_callee is null or p_callee = v_caller then
    return;
  end if;

  -- L'appelant doit partager une conversation avec l'appelé (c'est le seul
  -- chemin par lequel un appel peut être lancé) — sinon refus silencieux.
  if not exists (
    select 1
    from public.conversation_participants cp_caller
    join public.conversation_participants cp_callee
      on cp_callee.conversation_id = cp_caller.conversation_id
    where cp_caller.user_id = v_caller
      and cp_callee.user_id = p_callee
  ) then
    return;
  end if;

  if public.are_users_blocked(v_caller, p_callee) then
    return;
  end if;

  select name into v_caller_name from public.profiles where id = v_caller;

  insert into public.notifications (user_id, type, title, message, priority, target_action)
  values (
    p_callee,
    'info',
    'Appel manqué',
    coalesce(v_caller_name, 'Un membre') || ' a essayé de vous appeler.',
    'high',
    'chat'
  );
end;
$$;

-- Exécutable par les utilisateurs connectés uniquement (c'est son usage) —
-- jamais par anon.
revoke execute on function public.notify_missed_call(uuid) from public, anon;
grant execute on function public.notify_missed_call(uuid) to authenticated;
