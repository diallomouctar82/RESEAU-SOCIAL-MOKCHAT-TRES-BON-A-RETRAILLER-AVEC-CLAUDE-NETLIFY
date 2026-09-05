-- Correctif critique decouvert pendant LOOP 06/17 (messagerie), mais
-- fondamental et transversal : la seule policy SELECT sur profiles
-- ("id = auth.uid() OR is_admin()") empechait tout utilisateur normal de
-- voir le profil de QUICONQUE d'autre — recherche de personnes,
-- suggestions d'amis, noms affiches dans la messagerie, tout ce qui a ete
-- construit sur les LOOP 04/17 et 05/17 en dependait silencieusement sans
-- jamais avoir ete verifie avec un compte non-admin reel jusqu'ici.
-- Corrige en implementant enfin reellement privacy_settings.profileVisibility
-- (colonne existante, jamais appliquee) : public (defaut) = visible par tout
-- utilisateur connecte, network = visible seulement par les amis reels
-- (accepted, LOOP 04/17), private = uniquement soi-meme/admin — exactement
-- la semantique que ce reglage promettait deja cote client sans jamais
-- l'appliquer cote base.
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or coalesce(privacy_settings->>'profileVisibility', 'public') = 'public'
    or (
      coalesce(privacy_settings->>'profileVisibility', 'public') = 'network'
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = profiles.id)
            or (f.addressee_id = auth.uid() and f.requester_id = profiles.id))
      )
    )
  );
