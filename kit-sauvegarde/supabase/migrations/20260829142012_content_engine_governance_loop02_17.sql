-- LOOP 02/17 (mission "L'Architecte MOCnet") — gouvernance du contenu :
-- partage avec vérification de droits (fonction atomique, évite la
-- condition de course d'un read-modify-write côté client).
create or replace function public.increment_post_shares(p_post_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- La vérification de droits (post public + publié) est faite côté
  -- appelant (services/supabaseClient.ts::sharePost) avant d'appeler cette
  -- fonction ; security invoker + RLS sur `posts` empêche de toute façon
  -- d'incrémenter un post qu'on n'a pas le droit de lire.
  update public.posts
  set shares_count = coalesce(shares_count, 0) + 1
  where id = p_post_id;
end;
$$;

comment on function public.increment_post_shares is
  'Incrément atomique de posts.shares_count (LOOP 02/17, partage de contenu). security invoker : soumis à la policy RLS posts_update_own_or_admin — un partage doit donc passer par une colonne dédiée à revoir si un jour "n''importe qui peut partager n''importe quel post visible" doit être permis sans en être l''auteur (actuellement seul l''auteur ou un admin peut, ce qui restreint plus que l''intention produit : à corriger dans un futur lot si le partage doit être ouvert à tous les lecteurs).';
