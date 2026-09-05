-- Équipe I / LOOP I3 : la cloche centralise les ÉVÉNEMENTS LIVE.
-- Même patron SECURITY DEFINER que notify_friendship_event / notify_message_event
-- (les notifications d'un tiers ne peuvent pas être écrites par le client :
-- RLS notifications_owner = self-insert only, le trigger est le seul chemin).

create or replace function public.notify_live_started()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Session programmée pour plus tard : ne JAMAIS annoncer « en direct »
  -- (ce serait une information fausse). La bascule programmé→direct n'a pas
  -- encore de flux d'écriture dans l'app — le jour où elle en aura un, un
  -- trigger UPDATE dédié prendra le relais.
  if new.is_scheduled is true then
    return new;
  end if;

  if new.is_private is true then
    -- Live privé : la cloche porte l'INVITATION des membres explicitement
    -- autorisés — jamais une annonce aux amis non invités.
    insert into public.notifications (user_id, type, title, message, priority, target_action)
    select m, 'info', 'Invitation à un Live privé',
           coalesce(new.host_name, 'Un membre') || ' vous invite : « ' || coalesce(new.title, 'Live') || ' »',
           'high', 'live'
    from unnest(coalesce(new.allowed_member_ids, '{}'::uuid[])) as m
    where m <> new.host_id
      and not public.are_users_blocked(new.host_id, m);
  else
    -- Live public : annoncé aux AMIS acceptés de l'hôte uniquement
    -- (jamais un broadcast à toute la plateforme).
    insert into public.notifications (user_id, type, title, message, priority, target_action)
    select case when f.requester_id = new.host_id then f.addressee_id else f.requester_id end,
           'info', 'Live en direct',
           coalesce(new.host_name, 'Un membre') || ' est en direct : « ' || coalesce(new.title, 'Live') || ' »',
           'normal', 'live'
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = new.host_id or f.addressee_id = new.host_id)
      and not public.are_users_blocked(new.host_id,
            case when f.requester_id = new.host_id then f.addressee_id else f.requester_id end);
  end if;

  return new;
end;
$$;

-- Jamais exécutable en RPC direct par un client (même défaut de grant par
-- défaut corrigé aux LOOP 02/17, 04/17, 06/17) : réservé au trigger.
revoke execute on function public.notify_live_started() from public, anon, authenticated;

drop trigger if exists trg_notify_live_started on public.live_sessions;
create trigger trg_notify_live_started
  after insert on public.live_sessions
  for each row execute function public.notify_live_started();
