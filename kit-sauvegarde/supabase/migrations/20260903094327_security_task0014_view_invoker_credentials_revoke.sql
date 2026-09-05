-- TASK-0014 (Vision Smart AI Core, AR12 Moknet pilot) — remédiation P0 sécurité, AR04 → AR07.
-- Finding 1 (Supabase advisor ERROR security_definer_view) : la vue public.ai_spend_by_provider
-- s'exécutait avec les droits de son propriétaire et exposait l'agrégat de ai_call_log à anon et à
-- tout utilisateur authentifié, en contournant la RLS admin-only de ai_call_log (preuve avant :
-- 37 lignes visibles par anon et par un compte non-admin).
-- Correctif : la vue s'exécute désormais avec les droits de l'appelant (RLS de ai_call_log
-- appliquée), anon n'y a plus aucun droit, authenticated ne conserve que SELECT.
alter view public.ai_spend_by_provider set (security_invoker = true);
revoke all on public.ai_spend_by_provider from anon;
revoke insert, update, delete, truncate, references, trigger on public.ai_spend_by_provider from authenticated;

-- Finding 2 (Supabase advisor WARN pg_graphql_anon_table_exposed / authenticated_table_exposed) :
-- public.ai_provider_credentials (RLS activée, aucune policy) portait encore les grants par défaut
-- pour anon et authenticated, donc restait exposée dans le schéma GraphQL. Les secrets vivent dans
-- le Vault ; la table n'est lue que par les fonctions Edge (service_role) et les RPC SECURITY
-- DEFINER admin (set_ai_provider_secret/_enabled/_priority, protégées par is_admin()).
revoke all on public.ai_provider_credentials from anon, authenticated;

comment on view public.ai_spend_by_provider is
  'Agrégat de dépenses IA par fournisseur. security_invoker = true depuis TASK-0014 (03/09/2026) : la RLS de ai_call_log s''applique à l''appelant ; réservée aux administrateurs et au rôle service.';
