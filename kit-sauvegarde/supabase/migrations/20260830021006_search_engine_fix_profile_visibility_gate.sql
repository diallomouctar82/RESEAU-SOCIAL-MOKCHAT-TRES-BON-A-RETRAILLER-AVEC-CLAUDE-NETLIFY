
-- Correctif vérifié empiriquement (2 comptes de test réels, session
-- authentifiée réelle) : search_universal() est SECURITY INVOKER, donc son
-- sous-select sur `profiles` est filtré par la policy `profiles_select_visible`
-- exactement comme n'importe quelle lecture directe de la table. Or
-- `profiles.privacy_settings` a pour défaut `profileVisibility: 'network'`
-- pour TOUT nouveau compte (colonne DEFAULT, jamais changé à l'inscription) —
-- ce qui veut dire qu'un tout nouveau membre est invisible à la recherche
-- universelle pour quiconque n'est pas déjà son ami accepté. Testé : Alice
-- (nouveau compte) cherchant "Bob VerifE2E" (nouveau compte, pas encore ami)
-- recevait `[]` alors que le profil existe réellement et correspond au terme.
--
-- Conséquence concrète : deux inconnus ne peuvent jamais se trouver via la
-- recherche pour s'ajouter en ami — la fonctionnalité de découverte est
-- inopérante pour son cas d'usage principal (le cas déjà-amis n'a justement
-- pas besoin d'une recherche pour se retrouver).
--
-- Le même problème existait déjà pour la messagerie (deux personnes qui
-- démarrent une PREMIÈRE conversation ne sont typiquement pas encore amies)
-- et avait déjà été résolu par `get_my_conversation_participant_profiles`
-- (SECURITY DEFINER, ne révèle que id/name/avatar_url/title/role — jamais
-- bio/email/téléphone/crédits/permissions). On applique ici exactement le
-- même principe, dans une fonction dédiée et minimale plutôt qu'en rendant
-- search_universal() lui-même SECURITY DEFINER : le reste de la fonction
-- (posts/courses) doit continuer à respecter la RLS de l'appelant sans
-- changement (posts_select_visible filtre déjà brouillons/programmés/
-- archivés — un search_universal() entièrement SECURITY DEFINER les aurait
-- exposés par erreur, une régression bien pire que le bug corrigé ici).
--
-- Un profil explicitement 'private' reste exclu (ce choix-là, contrairement
-- au défaut 'network' non choisi, est une décision explicite de
-- l'utilisateur à respecter) ; le propriétaire se voit toujours lui-même.
create or replace function public.search_profiles_minimal(term text)
returns table(id uuid, name text, title text, avatar_url text)
language sql
stable
security definer
set search_path = 'public', 'extensions'
as $$
  select p.id, p.name, p.title, p.avatar_url
  from public.profiles p
  where (
    p.id = auth.uid()
    or coalesce(p.privacy_settings ->> 'profileVisibility', 'public') <> 'private'
  )
  and (
    extensions.unaccent(lower(p.name)) ilike extensions.unaccent(lower('%' || term || '%'))
    or extensions.unaccent(lower(coalesce(p.title, ''))) ilike extensions.unaccent(lower('%' || term || '%'))
  )
  limit 8;
$$;

revoke all on function public.search_profiles_minimal(text) from public;
grant execute on function public.search_profiles_minimal(text) to authenticated;

create or replace function public.search_universal(term text)
returns table(id uuid, result_type text, title text, subtitle text, avatar_url text)
language sql
stable
set search_path = 'public', 'extensions'
as $$
  (select sp.id, 'profile'::text, sp.name, sp.title, sp.avatar_url
   from public.search_profiles_minimal(term) sp)

  union all

  (select po.id, 'post'::text, left(po.content, 100),
          case when a.id is not null then 'Par ' || a.name else null end,
          a.avatar_url
   from public.posts po
   left join public.profiles a on a.id = po.author_id
   where extensions.unaccent(lower(po.content)) ilike extensions.unaccent(lower('%' || term || '%'))
   order by po.created_at desc
   limit 8)

  union all

  (select c.id, 'course'::text, c.title, c.category, null::text
   from public.courses c
   where extensions.unaccent(lower(c.title)) ilike extensions.unaccent(lower('%' || term || '%'))
      or extensions.unaccent(lower(coalesce(c.description, ''))) ilike extensions.unaccent(lower('%' || term || '%'))
   limit 8)
$$;

revoke all on function public.search_universal(text) from public;
grant execute on function public.search_universal(text) to authenticated;
