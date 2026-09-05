-- `revoke ... from public` ne suffit pas : Supabase accorde par défaut
-- EXECUTE sur les nouvelles fonctions à `anon` directement (confirmé par
-- get_advisors : anon_security_definer_function_executable). Le partage
-- doit être réservé aux utilisateurs connectés (même exigence que
-- commenter/réagir/ajouter un ami ailleurs dans ce dépôt) — un visiteur non
-- authentifié ne doit pas pouvoir incrémenter arbitrairement un compteur.
revoke execute on function public.increment_post_shares(uuid) from anon;
