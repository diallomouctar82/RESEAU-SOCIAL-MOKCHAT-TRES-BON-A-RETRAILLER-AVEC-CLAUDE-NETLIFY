-- LOOP 05/17 — recommandation explicable, sans fuite : un nombre d'amis en
-- commun est une donnée standard et peu sensible (pas d'identité révélée),
-- mais calculer "les amis de mes amis" nécessite de lire les lignes
-- friendships d'un tiers, hors de portée de la RLS de l'appelant — d'où un
-- SECURITY DEFINER retournant STRICTEMENT un entier, jamais les lignes.
create or replace function public.get_mutual_friends_count(p_user_a uuid, p_user_b uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer from (
    select case when requester_id = p_user_a then addressee_id else requester_id end as friend_id
    from public.friendships
    where status = 'accepted' and (requester_id = p_user_a or addressee_id = p_user_a)
  ) a_friends
  where a_friends.friend_id in (
    select case when requester_id = p_user_b then addressee_id else requester_id end
    from public.friendships
    where status = 'accepted' and (requester_id = p_user_b or addressee_id = p_user_b)
  );
$$;
revoke all on function public.get_mutual_friends_count(uuid, uuid) from public;
grant execute on function public.get_mutual_friends_count(uuid, uuid) to authenticated;
revoke execute on function public.get_mutual_friends_count(uuid, uuid) from anon;
