-- ÉQUIPE 11 « Identité des publications » (loops 13-15).
-- Identité d'annuaire minimale (nom, avatar, titre) des AUTEURS de contenu
-- visible par l'appelant — jamais plus (pas d'email/téléphone/crédits).
-- Patron établi : SECURITY DEFINER étroit (comme discover_profiles /
-- get_my_conversation_participant_profiles), jamais un assouplissement de la
-- RLS de `profiles`. Un id demandé n'est renvoyé QUE si son porteur est
-- réellement auteur d'au moins un contenu que l'appelant peut voir :
--   * un post visible — prédicat recopié à l'identique de la policy
--     posts_select_visible (y compris la branche network/can_view_network_post) ;
--   * OU un commentaire visible — prédicat recopié de
--     comments_select_if_post_visible ;
--   * OU une story active — stories_select_authenticated vaut `true` pour tout
--     authentifié, restreint ici aux stories non expirées (celles que le fil
--     affiche réellement).
create or replace function public.get_content_author_profiles(p_author_ids uuid[])
returns table(id uuid, name text, avatar_url text, title text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar_url, p.title
  from public.profiles p
  where p.id = any(p_author_ids)
    and (
      -- Auteur d'un post visible par l'appelant (= posts_select_visible).
      exists (
        select 1 from public.posts po
        where po.author_id = p.id
          and (
            (po.status = 'published' and po.visibility = 'public')
            or (po.status = 'published' and po.visibility = 'network'
                and public.can_view_network_post(po.author_id, (select auth.uid())))
            or po.author_id = (select auth.uid())
            or public.is_admin()
          )
      )
      -- Auteur d'un commentaire visible (= comments_select_if_post_visible).
      or exists (
        select 1
        from public.comments c
        join public.posts cp on cp.id = c.post_id
        where c.author_id = p.id
          and (
            cp.visibility = 'public'
            or cp.author_id = (select auth.uid())
            or public.is_admin()
          )
      )
      -- Auteur d'une story active (stories_select_authenticated = true pour
      -- tout authentifié ; seules les stories non expirées sont affichées).
      or exists (
        select 1 from public.stories s
        where s.author_id = p.id
          and s.expires_at > now()
      )
    );
$$;

-- Discipline du dépôt : jamais le grant par défaut. Réservé aux authentifiés
-- (anon → 42501).
revoke execute on function public.get_content_author_profiles(uuid[]) from public;
revoke execute on function public.get_content_author_profiles(uuid[]) from anon;
grant execute on function public.get_content_author_profiles(uuid[]) to authenticated;
