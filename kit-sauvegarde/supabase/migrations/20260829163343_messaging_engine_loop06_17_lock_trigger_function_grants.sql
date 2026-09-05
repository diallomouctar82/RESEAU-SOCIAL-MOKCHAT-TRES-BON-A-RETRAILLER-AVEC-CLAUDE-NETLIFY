-- LOOP 06/17 — hygiène de droits découverte via get_advisors : la fonction
-- déclencheur enroll_creator_as_participant() (migration précédente de cette
-- LOOP, avant cette compaction) était exécutable par `anon` ET `authenticated`
-- en RPC direct — exactement le même défaut de grant par défaut de Supabase
-- Studio déjà rencontré et corrigé au LOOP 02/17 et LOOP 04/17. Un appel RPC
-- direct échouerait de toute façon à l'exécution (RETURNS trigger, `new` non
-- lié hors contexte de déclencheur) mais l'hygiène est de retirer les droits
-- quand même : le déclenchement par la table `conversations` ne dépend pas
-- d'un GRANT EXECUTE explicite (Postgres invoque les fonctions de trigger
-- via le propriétaire, jamais via les droits du rôle appelant).
revoke all on function public.enroll_creator_as_participant() from public;
revoke execute on function public.enroll_creator_as_participant() from anon;
revoke execute on function public.enroll_creator_as_participant() from authenticated;
