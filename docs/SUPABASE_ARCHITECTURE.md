# Architecture Supabase — contrat vérifié

> Mise à jour : 28 août 2026. Ce document distingue le schéma observé, le code versionné et les validations réellement exécutées.

## Source de vérité

Le projet actif `rqciahtpixdjbyoajomg` contient 58 tables `public` issues de 18 migrations. L'ancien fichier `docs/supabase_schema.sql` ne décrivait que douze tables et utilisait plusieurs noms incompatibles. Il est désormais un pointeur ; l'unique chaîne SQL exécutable est `supabase/migrations/`, par ordre lexical. `supabase/schema-manifest.json` fige l'inventaire observé et `npm run db:verify` empêche la réintroduction d'un nom historique, d'une table sans RLS ou d'une version dupliquée.

| Fichier | Objet |
|---|---|
| `20260827130000_live_schema_snapshot.sql` | snapshot déclaratif des 58 tables, contraintes, index, fonctions, triggers, policies et grants observés |
| `20260827210000_live_core_baseline.sql` | baseline additive du cœur Identity/Social/Messagerie |
| `20260827211000_core_schema_and_rpc_reconciliation.sql` | colonnes manquantes, helpers non ambigus et RPC contrôlées |
| `20260827212000_core_rls_storage_and_grants.sql` | remplacement des policies cœur et réduction des grants |
| `20260827212500_cross_domain_rls_correlation_fixes.sql` | correction de la corrélation Documents héritée |

Une migration additive ne signifie pas qu'elle est déjà appliquée en production. Le dépôt est la proposition reproductible ; son déploiement suit une validation sur branche Supabase isolée.

## Noms canoniques

Le code doit réutiliser les noms actifs, sans tables parallèles :

| Domaine | Tables |
|---|---|
| Identité | `profiles`, `profile_skills`, `profile_badges` |
| Réseau | `posts`, `post_documents`, `comments`, `post_reactions`, `stories` |
| MokChat | `conversations`, `conversation_participants`, `messages`, `message_reactions`, `user_presence`, `user_blocks`, `abuse_reports` |
| Transverse | `notifications`, `audit_logs` |

Les noms `social_posts`, `post_comments`, `conversation_members`, `participant1_id` et `participant2_id` ne font pas partie du contrat. Une conversation est liée à ses utilisateurs par `conversation_participants(conversation_id,user_id)`.

## Identité et profil

`auth.users.id = profiles.id`. La création du profil appartient exclusivement au trigger `handle_new_user`; le navigateur ne fait jamais de `INSERT`/`UPSERT profiles`.

Le trigger n'accepte de `raw_user_meta_data` que le nom et l'avatar. Il attribue toujours le rôle initial `user`; aucun email codé en dur ni champ `role` fourni par le client ne peut créer un administrateur. Les rôles existants sont conservés lors de la migration.

Les colonnes `id`, `email`, `role`, `credits`, `xp`, `level`, `next_level_xp`, `two_factor_enabled` et `created_at` sont protégées. Les changements de rôle passent par `admin_set_user_role(...)`, avec autorisation serveur et journal d'audit. Les gains passent par une fonction réservée au `service_role`.

## RLS et annuaire

La lecture complète de `profiles` est limitée au propriétaire et aux administrateurs. Les autres écrans utilisent :

- `search_public_profiles(p_query,p_limit)` pour l'annuaire ;
- `get_public_profiles(p_user_ids)` pour résoudre des auteurs ou participants ;
- `update_my_profile(p_changes)` pour les champs personnels autorisés.

Les projections publiques n'incluent jamais email, téléphone, rôle, crédits ou identifiant citoyen. Elles appliquent visibilité et blocages, et limitent le nombre d'identifiants.

Les policies de messagerie utilisent des helpers paramétrés (`private.is_conversation_member(conversation_id)`) afin d'éviter les anciennes tautologies comme `cp.conversation_id = cp.conversation_id`. Les grants `anon` sont révoqués sur le schéma applicatif et les fonctions sensibles ne sont pas exécutables par le navigateur.

## Données et types

`services/database.types.ts` est le type généré depuis le schéma actif avant application des migrations de réconciliation. Après chaque migration distante validée, il faut le régénérer et committer le diff. Les nouveaux appels RPC sont temporairement isolés derrière le service de données afin de ne pas diffuser des casts dans les composants.

## Validation reproductible

Le test `supabase/tests/core_rls_test.sql` couvre les cas autorisés et refusés : profil complet, annuaire sans données sensibles, isolation des conversations/messages, rôle/crédits et fonctions sensibles. Il doit être exécuté par `supabase test db` après un reset local ou sur une branche sans données.

État au 28 août 2026 : le contrat local cible PostgreSQL 17, comme la production. Le contrôle `npm run db:verify` valide les noms, versions, transactions, 58 tables du snapshot et l'activation RLS de toutes les tables versionnées. Le reset complet reste exécutable avec `supabase db reset` dès qu'un runtime Docker compatible est disponible.

## Réglages externes

Les éléments suivants ne sont pas encodables dans une migration SQL et restent des contrôles opérateur : provider Google et URLs de redirection Auth, protection des mots de passe compromis, paramètres Realtime et rotation des clés. Aucun secret `service_role`, OAuth ou base de données ne doit entrer dans Git ni dans une variable `VITE_*`.
