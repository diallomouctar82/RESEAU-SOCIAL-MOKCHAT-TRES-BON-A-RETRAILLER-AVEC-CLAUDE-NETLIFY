-- LOOP 11/17 (Recherche universelle : intelligence & Architecte)
-- `unaccent` comble une lacune déjà documentée depuis LOOP 05/17
-- (`searchProfiles` : "sans repli accent-insensible — une recherche sans
-- accents peut manquer un nom accentué"). Installée dans le schéma
-- `extensions`, comme `uuid-ossp`/`pgcrypto` (convention déjà en place sur
-- ce projet), et appelée en pleine qualification (`extensions.unaccent`)
-- pour ne dépendre d'aucun `search_path` particulier.
create extension if not exists unaccent with schema extensions;

-- Remplace les 5-6 requêtes REST séparées d'`universalSearch` (LOOP 10/17)
-- par UN seul appel RPC : même nombre de domaines (profiles/posts/courses),
-- même RLS (SECURITY INVOKER — par défaut, jamais SECURITY DEFINER ici,
-- aucun besoin de bypass, chaque ligne retournée est déjà celle que
-- l'appelant a le droit de voir), en plus accent-insensible et avec
-- l'auteur d'une publication résolu par une jointure (jamais un second
-- aller-retour réseau, et jamais un nom fabriqué : si l'auteur n'est pas
-- visible pour l'appelant selon `profiles_select_visible`, le LEFT JOIN le
-- filtre silencieusement — la ligne du post reste, sans nom d'auteur).
create or replace function public.search_universal(term text)
returns table(id uuid, result_type text, title text, subtitle text, avatar_url text)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  (select p.id, 'profile'::text, p.name, p.title, p.avatar_url
   from public.profiles p
   where extensions.unaccent(lower(p.name)) ilike extensions.unaccent(lower('%' || term || '%'))
      or extensions.unaccent(lower(coalesce(p.title, ''))) ilike extensions.unaccent(lower('%' || term || '%'))
   limit 8)

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

comment on function public.search_universal(text) is
  'LOOP 11/17 : recherche transversale accent-insensible (profiles/posts/courses). '
  'SECURITY INVOKER (défaut) — RLS de chaque table appliquée normalement pour '
  'l''appelant, aucun bypass. Un index fonctionnel (unaccent immutable + GIN/trigram) '
  'serait nécessaire pour de gros volumes ; non ajouté ici (table posts/courses '
  'quasi vides en pratique à ce stade) — à revisiter si le volume réel le justifie.';

revoke all on function public.search_universal(text) from public;
revoke execute on function public.search_universal(text) from anon;
grant execute on function public.search_universal(text) to authenticated;
