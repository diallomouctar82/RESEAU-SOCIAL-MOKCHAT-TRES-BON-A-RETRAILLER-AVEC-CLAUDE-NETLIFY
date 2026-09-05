-- LOOP 08/17 (Architecte MOCnet, moteur de notifications : fondation) —
-- seul notify_friendship_event() existait ; aucun trigger equivalent sur
-- messages/comments/follows, confirme par lecture directe de pg_proc
-- (aucune autre fonction du schema public ne referencait `notifications`).
-- Reactions volontairement exclues (spec moteur de notifications, point
-- deja retenu ailleurs dans ce depot : "un like n'a pas besoin d'un
-- accuse") — evenement != notification, ne pas creer de bruit pour un
-- acquiescement.

-- 1. Nouveau message -> notifie chaque AUTRE participant de la
--    conversation (pas seulement 1-1 : une conversation de groupe notifie
--    tous les autres membres). Priorite 'normal' fixee par le TYPE
--    d'evenement, jamais par qui l'a envoye.
create or replace function public.notify_message_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  recipient record;
begin
  select name into sender_name from public.profiles where id = new.sender_id;
  for recipient in
    select user_id from public.conversation_participants
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (user_id, type, title, message, priority, target_action)
    values (recipient.user_id, 'info', 'Nouveau message', coalesce(sender_name, 'Un membre') || ' vous a envoyé un message.', 'normal', 'messages');
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_message_notify on public.messages;
create trigger trg_message_notify
  after insert on public.messages
  for each row execute function public.notify_message_event();

-- 2. Nouveau commentaire -> notifie l'auteur du post (jamais soi-meme).
--    Ne remonte pas encore au parent d'une reponse imbriquee — deferred
--    (voir doc), le cas simple (auteur du post) couvre l'essentiel.
create or replace function public.notify_comment_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  commenter_name text;
  v_post_author uuid;
begin
  select author_id into v_post_author from public.posts where id = new.post_id;
  if v_post_author is null or v_post_author = new.author_id then
    return new;
  end if;
  select name into commenter_name from public.profiles where id = new.author_id;
  insert into public.notifications (user_id, type, title, message, priority, target_action)
  values (v_post_author, 'info', 'Nouveau commentaire', coalesce(commenter_name, 'Un membre') || ' a commenté votre publication.', 'normal', 'social');
  return new;
end;
$$;

drop trigger if exists trg_comment_notify on public.comments;
create trigger trg_comment_notify
  after insert on public.comments
  for each row execute function public.notify_comment_event();

-- 3. Nouvel abonnement -> notifie la personne suivie. Priorite 'low' :
--    informatif, ne requiert aucune action contrairement a une demande
--    d'ami ou un message.
create or replace function public.notify_follow_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  follower_name text;
begin
  if new.follower_id = new.followee_id then
    return new;
  end if;
  select name into follower_name from public.profiles where id = new.follower_id;
  insert into public.notifications (user_id, type, title, message, priority, target_action)
  values (new.followee_id, 'info', 'Nouvel abonné', coalesce(follower_name, 'Un membre') || ' vous suit désormais.', 'low', 'social');
  return new;
end;
$$;

drop trigger if exists trg_follow_notify on public.follows;
create trigger trg_follow_notify
  after insert on public.follows
  for each row execute function public.notify_follow_event();

-- Hygiène de droits (même défaut par trigger déjà rencontré 3 fois cette
-- mission — LOOP 02/17, 04/17, 06/17) : ces fonctions ne sont destinées
-- qu'au déclenchement par trigger, jamais à un appel RPC direct.
revoke all on function public.notify_message_event() from public, anon, authenticated;
revoke all on function public.notify_comment_event() from public, anon, authenticated;
revoke all on function public.notify_follow_event() from public, anon, authenticated;
