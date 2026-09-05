-- Correctif immédiat (repéré en relisant ma propre fonction juste après
-- l'avoir écrite) : `security invoker` restreignait implicitement le
-- partage au seul auteur/admin du post (policy posts_update_own_or_admin),
-- ce qui n'est pas le comportement voulu — n'importe quel lecteur d'un post
-- public doit pouvoir le partager. `security definer` est nécessaire ici,
-- mais alors la vérification de droits ("ce post est-il réellement public
-- et publié ?") doit être faite EXPLICITEMENT dans la fonction elle-même,
-- puisque RLS ne s'applique plus automatiquement une fois definer — c'est
-- exactement la vérification de droits exigée par la spécification
-- ("jamais de remix/partage automatique sans droit vérifié").
create or replace function public.increment_post_shares(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select (status = 'published' and visibility = 'public') into v_ok
  from public.posts
  where id = p_post_id;

  if v_ok is not true then
    raise exception 'Ce contenu n''est pas partageable (introuvable, non publié, ou non public).';
  end if;

  update public.posts
  set shares_count = coalesce(shares_count, 0) + 1
  where id = p_post_id;
end;
$$;

revoke all on function public.increment_post_shares(uuid) from public;
grant execute on function public.increment_post_shares(uuid) to authenticated;

comment on function public.increment_post_shares is
  'Incrément atomique de posts.shares_count (LOOP 02/17, partage de contenu). SECURITY DEFINER volontaire : un partage doit être possible pour tout lecteur d''un post public, pas seulement son auteur — la vérification de droits (post réellement status=published ET visibility=public) est donc faite explicitement dans la fonction, pas déléguée à RLS. N''accorde aucun autre privilège (une seule colonne, un seul type d''opération).';
