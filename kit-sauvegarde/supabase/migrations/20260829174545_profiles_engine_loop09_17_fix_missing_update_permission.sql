-- LOOP 09/17 : découvert en testant la persistance REST réelle du nouveau
-- champ `notificationsMuted` (mode silencieux) — `public.profiles` n'a
-- JAMAIS eu ni le GRANT UPDATE pour `authenticated`, ni une seule policy RLS
-- couvrant UPDATE (seule `profiles_select_visible`, SELECT uniquement,
-- existait). Conséquence réelle vérifiée via un vrai jeton JWT + PostgREST :
-- CHAQUE tentative de sauvegarde de profil par CHAQUE utilisateur réel,
-- depuis toujours, échoue avec `42501 permission denied for table profiles`
-- avant même que RLS ne soit évaluée — le nettoyage de payload de Chantier 1
-- (retirer skills/badges) rendait la requête propre, mais jamais exécutable.
-- `handle_new_user()` (SECURITY DEFINER) n'a jamais eu besoin d'une policy
-- INSERT, ce qui masquait complètement le problème : les profils
-- apparaissaient bien à l'inscription, seule leur MODIFICATION échouait
-- silencieusement (le chemin d'appel avale l'erreur dans un `catch`).

grant update on public.profiles to authenticated;
revoke update on public.profiles from anon;

-- Même forme que `profiles_select_visible` (auth.uid() = id OR is_admin()) —
-- un utilisateur ne modifie que sa propre ligne ; le trigger existant
-- `protect_profile_sensitive_columns` continue de neutraliser
-- role/credits/xp/level/next_level_xp quel que soit l'appelant, cette policy
-- ne change rien à cette protection.
create policy profiles_update_own on public.profiles
    for update
    using (auth.uid() = id or is_admin())
    with check (auth.uid() = id or is_admin());
