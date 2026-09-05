-- LOOP 04/17 (Architecte MOCnet) — moteur social : fondation
-- 1. Anti-doublon strict sur friendships (paire non-ordonnee, quel que soit
--    le sens de la demande ou son statut).
create unique index if not exists friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- 2. Blocage : relation forte, personnelle, jamais visible par la personne
--    bloquee (RLS restreinte au seul blocker).
create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_no_self check (blocker_id <> blocked_id),
  constraint user_blocks_unique unique (blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;
create policy user_blocks_select_own on public.user_blocks for select to authenticated
  using (blocker_id = auth.uid());
create policy user_blocks_insert_own on public.user_blocks for insert to authenticated
  with check (blocker_id = auth.uid());
create policy user_blocks_delete_own on public.user_blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- 3. Abonnement (follow) : modele unilateral distinct de l'amitie
--    (jamais melanges — decision d'architecture centrale du lot).
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_no_self check (follower_id <> followee_id),
  constraint follows_unique unique (follower_id, followee_id)
);
alter table public.follows enable row level security;
create policy follows_select_own on public.follows for select to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());
create policy follows_delete_own on public.follows for delete to authenticated
  using (follower_id = auth.uid());

-- 4. Compteurs reels (colonnes deja presentes sur profiles, jamais
--    alimentees jusqu'ici faute de mecanisme de suivi reel).
create or replace function public.handle_follow_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = coalesce(following_count, 0) + 1 where id = new.follower_id;
    update public.profiles set followers_count = coalesce(followers_count, 0) + 1 where id = new.followee_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(0, coalesce(following_count, 0) - 1) where id = old.follower_id;
    update public.profiles set followers_count = greatest(0, coalesce(followers_count, 0) - 1) where id = old.followee_id;
  end if;
  return null;
end;
$$;
create trigger trg_follows_counts
  after insert or delete on public.follows
  for each row execute function public.handle_follow_change();

-- 5. Verification de blocage — narrow existence check, jamais de fuite de
--    la ligne elle-meme, utilisable des deux cotes d'une relation (SECURITY
--    DEFINER necessaire : la RLS de user_blocks cache sinon a A le fait que
--    B l'a bloque).
create or replace function public.are_users_blocked(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = p_user_a and blocked_id = p_user_b)
       or (blocker_id = p_user_b and blocked_id = p_user_a)
  );
$$;
revoke all on function public.are_users_blocked(uuid, uuid) from public;
grant execute on function public.are_users_blocked(uuid, uuid) to authenticated;

-- 6. Autorisation d'envoi de demande d'ami — combine blocage + preference
--    de confidentialite du destinataire (allowFriendRequestsFrom), un seul
--    point de decision reutilisable, jamais duplique dans le code client.
create or replace function public.can_send_friend_request(p_requester uuid, p_addressee uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_pref text;
begin
  if public.are_users_blocked(p_requester, p_addressee) then
    return false;
  end if;
  select coalesce(privacy_settings->>'allowFriendRequestsFrom', 'all') into v_pref
    from public.profiles where id = p_addressee;
  if v_pref = 'none' then
    return false;
  end if;
  return true;
end;
$$;
revoke all on function public.can_send_friend_request(uuid, uuid) from public;
grant execute on function public.can_send_friend_request(uuid, uuid) to authenticated;

-- 7. Les deux points d'ecriture concernes appliquent desormais ces regles
--    au niveau RLS (source de verite), pas seulement cote client.
drop policy if exists friendships_insert_own on public.friendships;
create policy friendships_insert_own on public.friendships
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'pending'
    and public.can_send_friend_request(requester_id, addressee_id)
  );

create policy follows_insert_own on public.follows
  for insert to authenticated
  with check (
    follower_id = auth.uid()
    and not public.are_users_blocked(follower_id, followee_id)
  );
