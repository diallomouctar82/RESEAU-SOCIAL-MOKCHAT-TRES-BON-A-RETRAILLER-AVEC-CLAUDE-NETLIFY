# Structure Supabase de MokNet — fiche générée

> Générée par `kit-sauvegarde/supabase/generer-structure-md.mjs` à partir du relevé du **2026-09-05T20:16:00Z** sur le projet **monde a vous** (`rqciahtpixdjbyoajomg`, eu-west-1, Postgres 17.6.1.054).
> Structure seulement : aucune ligne de données, aucune valeur de secret (seuls les NOMS des entrées du coffre sont relevés).

## Vue d'ensemble

| Objet | Nombre |
| :--- | ---: |
| Migrations appliquées (historique complet embarqué dans `migrations/`) | 110 |
| Tables du schéma `public` | 89 |
| Politiques RLS (`public` + `storage`) | 186 |
| Fonctions `public` | 84 |
| Fonctions `private` | 2 |
| Contraintes (PK, FK, unique, check) | 309 |
| Index | 228 |
| Déclencheurs (`public`) | 31 |
| Déclencheur sur `auth.users` | 1 |
| Vues | 1 |
| Énumérations | 0 |
| Tâches pg_cron | 6 |
| Buckets de stockage | 3 |
| Tables publiées en temps réel | 14 |
| Entrées du coffre (noms seulement) | 16 |
| Extensions installées | 9 |

## Tables (schéma `public`)

| Table | RLS | Colonnes | Lignes (estimation) | Commentaire |
| :--- | :---: | ---: | ---: | :--- |
| `profiles` | oui | 28 | 16 | Profil applicatif Le Monde à Vous, 1:1 avec auth.users. role/credits/xp/level protégés en écriture (voir trigg… |
| `profile_skills` | oui | 7 | 0 |  |
| `profile_badges` | oui | 9 | 0 |  |
| `posts` | oui | 18 | 12 |  |
| `post_documents` | oui | 8 | 0 |  |
| `comments` | oui | 7 | 6 |  |
| `post_reactions` | oui | 5 | 10 |  |
| `stories` | oui | 8 | 20 |  |
| `agents` | oui | 12 | 13 |  |
| `conversations` | oui | 9 | 10 |  |
| `conversation_participants` | oui | 6 | 20 |  |
| `messages` | oui | 14 | 88 |  |
| `agent_chat_sessions` | oui | 5 | 0 |  |
| `agent_chat_messages` | oui | 6 | 0 |  |
| `live_sessions` | oui | 48 | 26 |  |
| `live_speakers` | oui | 16 | 58 |  |
| `live_attendance` | oui | 9 | 0 |  |
| `live_questions` | oui | 11 | 0 |  |
| `live_question_upvotes` | oui | 3 | 0 |  |
| `live_polls` | oui | 5 | 0 |  |
| `live_poll_options` | oui | 4 | 0 |  |
| `live_poll_votes` | oui | 4 | 0 |  |
| `live_agenda_items` | oui | 7 | 0 |  |
| `live_decisions` | oui | 6 | 0 |  |
| `live_action_items` | oui | 9 | 0 |  |
| `live_documents` | oui | 9 | 0 |  |
| `live_source_cards` | oui | 10 | 0 |  |
| `live_products` | oui | 14 | 0 |  |
| `live_personal_notes` | oui | 8 | 0 |  |
| `gift_catalog` | oui | 6 | 0 |  |
| `live_gifts_sent` | oui | 6 | 0 |  |
| `live_replays` | oui | 15 | 0 |  |
| `live_whiteboard_strokes` | oui | 13 | 0 |  |
| `dossiers` | oui | 12 | 0 |  |
| `dossier_steps` | oui | 6 | 0 |  |
| `dossier_tasks` | oui | 7 | 0 |  |
| `dossier_documents` | oui | 6 | 0 |  |
| `dossier_deliverables` | oui | 5 | 0 |  |
| `dossier_appointments` | oui | 7 | 0 |  |
| `dossier_shares` | oui | 5 | 0 |  |
| `career_goals` | oui | 8 | 0 |  |
| `career_opportunities` | oui | 13 | 0 |  |
| `career_opportunity_feedback` | oui | 7 | 0 |  |
| `career_search_missions` | oui | 7 | 0 |  |
| `master_resumes` | oui | 6 | 0 |  |
| `career_snapshots` | oui | 5 | 0 |  |
| `courses` | oui | 10 | 0 |  |
| `enrollments` | oui | 8 | 0 |  |
| `exam_sessions` | oui | 6 | 0 |  |
| `certificates` | oui | 6 | 0 |  |
| `shops` | oui | 10 | 0 |  |
| `products` | oui | 28 | 0 |  |
| `orders` | oui | 8 | 0 |  |
| `order_items` | oui | 6 | 0 |  |
| `wallet_transactions` | oui | 7 | 0 |  |
| `notifications` | oui | 9 | 345 |  |
| `documents` | oui | 11 | 0 |  |
| `document_shares` | oui | 5 | 0 |  |
| `audit_logs` | oui | 8 | 3 |  |
| `admin_api_rate_limits` | oui | 4 | 0 |  |
| `ai_providers` | oui | 22 | 37 |  |
| `ai_models` | oui | 11 | 40 |  |
| `ai_provider_credentials` | oui | 11 | 15 |  |
| `ai_call_log` | oui | 17 | 2200 |  |
| `ai_tools` | oui | 11 | 4 |  |
| `agent_tool_grants` | oui | 5 | 31 |  |
| `ai_budget` | oui | 5 | 1 |  |
| `friendships` | oui | 6 | 32 |  |
| `live_transport_config` | oui | 10 | 2 |  |
| `live_messages` | oui | 7 | 2 |  |
| `live_reactions` | oui | 5 | 3 |  |
| `live_solidarity_causes` | oui | 13 | 0 | Mission de solidarité créée depuis un LIVE (souvent par la voix — LOOP 09/14). Continue d'exister après la fin… |
| `live_solidarity_wallet_ledger` | oui | 7 | 0 | Écritures append-only (collecté/utilisé) — jamais un solde stocké, même principe que wallet_transactions/get_w… |
| `live_solidarity_proofs` | oui | 9 | 0 | Preuve structurée (photo/vidéo/facture/reçu/document) associée à une cause + une étape + une dépense + un mont… |
| `live_solidarity_updates` | oui | 5 | 0 |  |
| `live_solidarity_donors` | oui | 7 | 0 | Enregistrement du don côté MokNet (suivi/transparence) — pas le mouvement réel de fonds, qui passe par un pres… |
| `user_blocks` | oui | 4 | 1 |  |
| `follows` | oui | 4 | 10 |  |
| `reminders` | oui | 6 | 0 | LOOP 09/17 : rappel ponctuel créé par un utilisateur pour lui-même. Transformé une seule fois en notification … |
| `user_memory` | oui | 16 | 3 | LOOP 12/17 : mémoire contextuelle structurée par scope. "recent_activity" est préparé mais sans producteur pou… |
| `tasks` | oui | 15 | 0 | LOOP 14/17 : tâche trackable générique (statut/priorité/échéance) — distincte de reminders (déclenchement ponc… |
| `invite_codes` | oui | 3 | 0 |  |
| `invitations` | oui | 5 | 0 |  |
| `push_subscriptions` | oui | 9 | 8 | Abonnements Web Push (un par navigateur/appareil). Écrits par save_push_subscription (un endpoint appartient t… |
| `push_vapid_config` | oui | 5 | 1 | Clé publique VAPID (lisible via get_push_public_key) + référence Vault de la clé privée (jamais en clair ici).… |
| `push_delivery_log` | oui | 11 | 88 | Journal des notifications push (Web Push) envoyées par la fonction Edge push-notify : une ligne par abonnement… |
| `call_diagnostics` | oui | 11 | 178 | AU-7 : journal technique d'un appel vu depuis un appareil (aucun contenu audio, jetons et IP locales épurés cô… |
| `live_transcript_lines` | oui | 7 | 0 | LP-7 — parole du direct transcrite une seule fois, gardée uniquement si l'animateur a activé l'enregistrement … |
| `health_snapshots` | oui | 11 | 0 | Sauvegarde prise avant chaque réparation de santé, et seule source de la restauration. Contient de vraies donn… |

## Détail des tables

### `profiles`

> Profil applicatif Le Monde à Vous, 1:1 avec auth.users. role/credits/xp/level protégés en écriture (voir trigger protect_profile_sensitive_columns).

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non |  |  |
| `email` | text | non |  |  |
| `name` | text | non | ''::text |  |
| `title` | text | oui |  |  |
| `role` | text | non | 'user'::text | role = ANY (ARRAY['user'::text, 'admin'::text, 'expert'::text, 'mentor'::text, '… |
| `citizenship_id` | text | oui |  |  |
| `level` | integer | non | 1 |  |
| `xp` | integer | non | 0 |  |
| `next_level_xp` | integer | non | 1000 |  |
| `credits` | numeric | non | 0 |  |
| `avatar_url` | text | oui |  |  |
| `preferred_language` | text | oui |  |  |
| `two_factor_enabled` | boolean | non | false |  |
| `interests` | ARRAY | non | '{}'::text[] |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `bio` | text | oui |  |  |
| `status` | text | non | 'active'::text | status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text]) |
| `country` | text | oui |  |  |
| `city` | text | oui |  |  |
| `phone` | text | oui |  |  |
| `website` | text | oui |  |  |
| `privacy_settings` | jsonb | non | '{"showOnlineStatus": true, "allowMessagesFrom": "network", … |  |
| `is_verified` | boolean | non | false |  |
| `followers_count` | integer | non | 0 |  |
| `following_count` | integer | non | 0 |  |
| `permissions` | jsonb | non | '["standard_access"]'::jsonb |  |
| `admin_notes` | text | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `live_question_upvotes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `profile_skills_profile_id_fkey` : (profile_id) → `public.profiles` (id)
- Clé étrangère `profiles_id_fkey` : (id) → `auth.users` (id)
- Clé étrangère `live_transcript_lines_speaker_id_fkey` : (speaker_id) → `public.profiles` (id)
- Clé étrangère `push_delivery_log_sender_id_fkey` : (sender_id) → `public.profiles` (id)
- Clé étrangère `orders_seller_id_fkey` : (seller_id) → `public.profiles` (id)
- Clé étrangère `orders_buyer_id_fkey` : (buyer_id) → `public.profiles` (id)
- Clé étrangère `products_seller_id_fkey` : (seller_id) → `public.profiles` (id)
- Clé étrangère `shops_owner_id_fkey` : (owner_id) → `public.profiles` (id)
- Clé étrangère `certificates_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `enrollments_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `career_snapshots_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `master_resumes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `career_search_missions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `career_opportunity_feedback_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `career_opportunities_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `career_goals_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `dossier_shares_shared_with_user_id_fkey` : (shared_with_user_id) → `public.profiles` (id)
- Clé étrangère `dossiers_owner_id_fkey` : (owner_id) → `public.profiles` (id)
- Clé étrangère `live_whiteboard_strokes_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `live_gifts_sent_sender_id_fkey` : (sender_id) → `public.profiles` (id)
- Clé étrangère `live_personal_notes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_poll_votes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_questions_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `live_attendance_participant_id_fkey` : (participant_id) → `public.profiles` (id)
- Clé étrangère `live_speakers_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_sessions_host_id_fkey` : (host_id) → `public.profiles` (id)
- Clé étrangère `agent_chat_sessions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `messages_sender_id_fkey` : (sender_id) → `public.profiles` (id)
- Clé étrangère `conversation_participants_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `conversations_created_by_fkey` : (created_by) → `public.profiles` (id)
- Clé étrangère `stories_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `post_reactions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `comments_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `posts_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `profile_badges_profile_id_fkey` : (profile_id) → `public.profiles` (id)
- Clé étrangère `push_delivery_log_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `push_subscriptions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `invitations_invited_user_id_fkey` : (invited_user_id) → `public.profiles` (id)
- Clé étrangère `invitations_inviter_id_fkey` : (inviter_id) → `public.profiles` (id)
- Clé étrangère `invite_codes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `tasks_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `user_memory_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `reminders_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `follows_followee_id_fkey` : (followee_id) → `public.profiles` (id)
- Clé étrangère `follows_follower_id_fkey` : (follower_id) → `public.profiles` (id)
- Clé étrangère `user_blocks_blocked_id_fkey` : (blocked_id) → `public.profiles` (id)
- Clé étrangère `user_blocks_blocker_id_fkey` : (blocker_id) → `public.profiles` (id)
- Clé étrangère `live_reactions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_messages_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `friendships_addressee_id_fkey` : (addressee_id) → `public.profiles` (id)
- Clé étrangère `friendships_requester_id_fkey` : (requester_id) → `public.profiles` (id)
- Clé étrangère `ai_call_log_requested_by_fkey` : (requested_by) → `public.profiles` (id)
- Clé étrangère `ai_provider_credentials_created_by_fkey` : (created_by) → `public.profiles` (id)
- Clé étrangère `admin_api_rate_limits_actor_id_fkey` : (actor_id) → `public.profiles` (id)
- Clé étrangère `audit_logs_actor_id_fkey` : (actor_id) → `public.profiles` (id)
- Clé étrangère `document_shares_shared_with_user_id_fkey` : (shared_with_user_id) → `public.profiles` (id)
- Clé étrangère `documents_owner_id_fkey` : (owner_id) → `public.profiles` (id)
- Clé étrangère `notifications_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `wallet_transactions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `profiles_role_check` : `CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'expert'::text, 'mentor'::text, 'moderator'::text, 'organization'::text, 'super_admin'::text])))`
- Contrainte `profiles_status_check` : `CHECK ((status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `profiles_select_visible` | SELECT | {authenticated} | PERMISSIVE |
| `profiles_update_own` | UPDATE | {public} | PERMISSIVE |

- Déclencheur `trg_profiles_protect_sensitive` : `CREATE TRIGGER trg_profiles_protect_sensitive BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_sensitive_columns()`
- Déclencheur `trg_profiles_updated_at` : `CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (1) : `profiles_pkey`

### `profile_skills`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `profile_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `progress` | integer | non | 0 | progress >= 0 AND progress <= 100 |
| `created_at` | timestamp with time zone | non | now() |  |
| `source_type` | text | non | 'manual'::text | source_type = ANY (ARRAY['manual'::text, 'course_completion'::text, 'certificate… |
| `source_id` | uuid | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `profile_skills_profile_id_fkey` : (profile_id) → `public.profiles` (id)
- Contrainte `profile_skills_profile_id_name_key` : `UNIQUE (profile_id, name)`
- Contrainte `profile_skills_progress_check` : `CHECK (((progress >= 0) AND (progress <= 100)))`
- Contrainte `profile_skills_source_type_check` : `CHECK ((source_type = ANY (ARRAY['manual'::text, 'course_completion'::text, 'certificate'::text, 'project'::text, 'recommendation'::text, 'activity'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `profile_skills_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `profile_skills_select_own_or_admin` | SELECT | {authenticated} | PERMISSIVE |
| `profile_skills_update_own` | UPDATE | {authenticated} | PERMISSIVE |
| `profile_skills_write_own` | INSERT | {authenticated} | PERMISSIVE |
- Index (3) : `idx_profile_skills_profile_id`, `profile_skills_pkey`, `profile_skills_profile_id_name_key`

### `profile_badges`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `profile_id` | uuid | non |  |  |
| `badge_key` | text | non |  |  |
| `name` | text | non |  |  |
| `icon` | text | oui |  |  |
| `description` | text | oui |  |  |
| `earned_at` | timestamp with time zone | non | now() |  |
| `source_type` | text | non | 'manual'::text | source_type = ANY (ARRAY['manual'::text, 'course_completion'::text, 'certificate… |
| `source_id` | uuid | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `profile_badges_profile_id_fkey` : (profile_id) → `public.profiles` (id)
- Contrainte `profile_badges_profile_id_badge_key_key` : `UNIQUE (profile_id, badge_key)`
- Contrainte `profile_badges_source_type_check` : `CHECK ((source_type = ANY (ARRAY['manual'::text, 'course_completion'::text, 'certificate'::text, 'project'::text, 'recommendation'::text, 'activity'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `profile_badges_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `profile_badges_select_own_or_admin` | SELECT | {authenticated} | PERMISSIVE |
| `profile_badges_write_own` | INSERT | {authenticated} | PERMISSIVE |
- Index (3) : `idx_profile_badges_profile_id`, `profile_badges_pkey`, `profile_badges_profile_id_badge_key_key`

### `posts`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `author_id` | uuid | non |  |  |
| `content` | text | non | ''::text |  |
| `visibility` | text | non | 'public'::text | visibility = ANY (ARRAY['public'::text, 'private'::text, 'network'::text]) |
| `shares_count` | integer | non | 0 |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `image_url` | text | oui |  |  |
| `category` | text | oui |  |  |
| `tags` | ARRAY | non | '{}'::text[] |  |
| `video_url` | text | oui |  |  |
| `audio_url` | text | oui |  |  |
| `status` | text | non | 'published'::text | status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text, 'archiv… |
| `scheduled_at` | timestamp with time zone | oui |  |  |
| `format` | text | non | 'text'::text | format = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'audio'::text, '… |
| `source_type` | text | oui |  |  |
| `source_id` | uuid | oui |  |  |
| `client_post_id` | uuid | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `post_documents_post_id_fkey` : (post_id) → `public.posts` (id)
- Clé étrangère `post_reactions_post_id_fkey` : (post_id) → `public.posts` (id)
- Clé étrangère `posts_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `comments_post_id_fkey` : (post_id) → `public.posts` (id)
- Contrainte `posts_format_check` : `CHECK ((format = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'audio'::text, 'document'::text, 'live_extract'::text, 'composite'::text])))`
- Contrainte `posts_status_check` : `CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text, 'archived'::text])))`
- Contrainte `posts_visibility_check` : `CHECK ((visibility = ANY (ARRAY['public'::text, 'private'::text, 'network'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `posts_delete_own_or_admin` | DELETE | {authenticated} | PERMISSIVE |
| `posts_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `posts_select_visible` | SELECT | {public} | PERMISSIVE |
| `posts_update_own_or_admin` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_posts_updated_at` : `CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (4) : `idx_posts_author_id`, `idx_posts_created_at`, `posts_pkey`, `uq_post_client_id`

### `post_documents`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `post_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `url` | text | non |  |  |
| `size` | bigint | oui |  |  |
| `type` | text | oui |  |  |
| `page_count` | integer | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `post_documents_post_id_fkey` : (post_id) → `public.posts` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `post_documents_select_if_post_visible` | SELECT | {authenticated} | PERMISSIVE |
| `post_documents_write_if_post_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_post_documents_post_id`, `post_documents_pkey`

### `comments`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `post_id` | uuid | non |  |  |
| `author_id` | uuid | non |  |  |
| `parent_comment_id` | uuid | oui |  |  |
| `content` | text | non |  |  |
| `likes_count` | integer | non | 0 |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `comments_parent_comment_id_fkey` : (parent_comment_id) → `public.comments` (id)
- Clé étrangère `comments_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `comments_post_id_fkey` : (post_id) → `public.posts` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `comments_delete_own_or_admin` | DELETE | {authenticated} | PERMISSIVE |
| `comments_insert_if_post_visible` | INSERT | {authenticated} | PERMISSIVE |
| `comments_select_if_post_visible` | SELECT | {authenticated} | PERMISSIVE |
| `comments_update_own` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_comment_notify` : `CREATE TRIGGER trg_comment_notify AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION notify_comment_event()`
- Index (4) : `comments_pkey`, `idx_comments_author`, `idx_comments_parent_id`, `idx_comments_post_id`

### `post_reactions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `post_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `type` | text | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `post_reactions_post_id_fkey` : (post_id) → `public.posts` (id)
- Clé étrangère `post_reactions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `post_reactions_post_id_user_id_key` : `UNIQUE (post_id, user_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `post_reactions_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `post_reactions_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `post_reactions_select_if_post_visible` | SELECT | {authenticated} | PERMISSIVE |
- Index (4) : `idx_post_reactions_post_id`, `idx_post_reactions_user`, `post_reactions_pkey`, `post_reactions_post_id_user_id_key`

### `stories`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `author_id` | uuid | non |  |  |
| `media_url` | text | non |  |  |
| `caption` | text | oui |  |  |
| `is_live` | boolean | non | false |  |
| `viewers_count` | integer | non | 0 |  |
| `expires_at` | timestamp with time zone | non | (now() + '24:00:00'::interval) |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `stories_author_id_fkey` : (author_id) → `public.profiles` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `stories_delete_own_or_admin` | DELETE | {authenticated} | PERMISSIVE |
| `stories_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `stories_select_authenticated` | SELECT | {authenticated} | PERMISSIVE |
| `stories_update_own` | UPDATE | {authenticated} | PERMISSIVE |
- Index (3) : `idx_stories_author_id`, `idx_stories_expires_at`, `stories_pkey`

### `agents`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | text | non |  |  |
| `name` | text | non |  |  |
| `role` | text | non |  |  |
| `description` | text | oui |  |  |
| `avatar_url` | text | oui |  |  |
| `is_human` | boolean | non | false |  |
| `hourly_rate` | numeric | oui |  |  |
| `experience_years` | integer | oui |  |  |
| `bio` | text | oui |  |  |
| `is_active` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `specialty` | text | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `live_sessions_featured_agent_id_fkey` : (featured_agent_id) → `public.agents` (id)
- Clé étrangère `dossiers_lead_agent_id_fkey` : (lead_agent_id) → `public.agents` (id)
- Clé étrangère `live_sessions_expert_id_fkey` : (expert_id) → `public.agents` (id)
- Clé étrangère `live_speakers_agent_id_fkey` : (agent_id) → `public.agents` (id)
- Clé étrangère `agent_chat_sessions_agent_id_fkey` : (agent_id) → `public.agents` (id)
- Clé étrangère `live_sessions_ai_assistant_id_fkey` : (ai_assistant_id) → `public.agents` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `agents_select_authenticated` | SELECT | {authenticated} | PERMISSIVE |
| `agents_write_admin_only` | ALL | {authenticated} | PERMISSIVE |
- Index (1) : `agents_pkey`

### `conversations`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `is_group` | boolean | non | false |  |
| `title` | text | oui |  |  |
| `created_by` | uuid | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `direct_key` | text | oui |  |  |
| `last_message_at` | timestamp with time zone | oui |  |  |
| `last_message_preview` | text | oui |  |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `messages_conversation_id_fkey` : (conversation_id) → `public.conversations` (id)
- Clé étrangère `conversations_created_by_fkey` : (created_by) → `public.profiles` (id)
- Clé étrangère `conversation_participants_conversation_id_fkey` : (conversation_id) → `public.conversations` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `conversations_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `conversations_select_if_participant` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `trg_conversations_enroll_creator` : `CREATE TRIGGER trg_conversations_enroll_creator AFTER INSERT ON public.conversations FOR EACH ROW EXECUTE FUNCTION enroll_creator_as_participant()`
- Index (3) : `conversations_pkey`, `idx_conversations_created_by`, `uq_direct_conversation_key`

### `conversation_participants`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `conversation_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `joined_at` | timestamp with time zone | non | now() |  |
| `last_read_at` | timestamp with time zone | oui |  |  |
| `member_role` | text | non | 'member'::text |  |

- Clé primaire : `id`
- Clé étrangère `conversation_participants_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `conversation_participants_conversation_id_fkey` : (conversation_id) → `public.conversations` (id)
- Contrainte `conversation_participants_conversation_id_user_id_key` : `UNIQUE (conversation_id, user_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `conversation_participants_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `conversation_participants_insert_if_member_or_self` | INSERT | {authenticated} | PERMISSIVE |
| `conversation_participants_select_if_participant` | SELECT | {authenticated} | PERMISSIVE |
| `conversation_participants_update_own_read_marker` | UPDATE | {public} | PERMISSIVE |
- Index (5) : `conversation_participants_conversation_id_user_id_key`, `conversation_participants_pkey`, `idx_conversation_participants_conversation`, `idx_conversation_participants_user`, `idx_conversation_participants_user_conversation`

### `messages`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `conversation_id` | uuid | non |  |  |
| `sender_id` | uuid | non |  |  |
| `content` | text | oui | ''::text |  |
| `attachment_url` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `client_message_id` | uuid | non | gen_random_uuid() |  |
| `message_type` | text | non | 'text'::text |  |
| `status` | text | non | 'sent'::text |  |
| `metadata` | jsonb | non | '{}'::jsonb |  |
| `reply_to_id` | uuid | oui |  |  |
| `edited_at` | timestamp with time zone | oui |  |  |
| `deleted_at` | timestamp with time zone | oui |  |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `messages_sender_id_fkey` : (sender_id) → `public.profiles` (id)
- Clé étrangère `messages_reply_to_id_fkey` : (reply_to_id) → `public.messages` (id)
- Clé étrangère `messages_conversation_id_fkey` : (conversation_id) → `public.conversations` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `messages_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `messages_insert_if_participant` | INSERT | {authenticated} | PERMISSIVE |
| `messages_select_if_participant` | SELECT | {authenticated} | PERMISSIVE |
| `messages_update_own` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_message_notify` : `CREATE TRIGGER trg_message_notify AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_message_event()`
- Déclencheur `trg_messages_touch_conversation` : `CREATE TRIGGER trg_messages_touch_conversation AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION private.touch_conversation_from_message()`
- Index (6) : `idx_messages_conversation_created`, `idx_messages_conversation_id`, `idx_messages_created_at`, `idx_messages_sender`, `messages_pkey`, `uq_message_client_id`

### `agent_chat_sessions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `agent_id` | text | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `agent_chat_messages_session_id_fkey` : (session_id) → `public.agent_chat_sessions` (id)
- Clé étrangère `agent_chat_sessions_agent_id_fkey` : (agent_id) → `public.agents` (id)
- Clé étrangère `agent_chat_sessions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `agent_chat_sessions_user_id_agent_id_key` : `UNIQUE (user_id, agent_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `agent_chat_sessions_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_agent_chat_sessions_updated_at` : `CREATE TRIGGER trg_agent_chat_sessions_updated_at BEFORE UPDATE ON public.agent_chat_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (4) : `agent_chat_sessions_pkey`, `agent_chat_sessions_user_id_agent_id_key`, `idx_agent_chat_sessions_agent`, `idx_agent_chat_sessions_user`

### `agent_chat_messages`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `role` | text | non |  | role = ANY (ARRAY['user'::text, 'model'::text]) |
| `content` | text | non |  |  |
| `image_urls` | ARRAY | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `agent_chat_messages_session_id_fkey` : (session_id) → `public.agent_chat_sessions` (id)
- Contrainte `agent_chat_messages_role_check` : `CHECK ((role = ANY (ARRAY['user'::text, 'model'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `agent_chat_messages_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `agent_chat_messages_pkey`, `idx_agent_chat_messages_session`

### `live_sessions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `host_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `description` | text | oui |  |  |
| `type` | text | oui |  |  |
| `host_name` | text | oui |  |  |
| `host_avatar` | text | oui |  |  |
| `viewers_count` | integer | non | 0 |  |
| `is_mixed` | boolean | non | false |  |
| `ai_assistant_id` | text | oui |  |  |
| `started_at` | timestamp with time zone | oui |  |  |
| `scheduled_for` | timestamp with time zone | oui |  |  |
| `timezone` | text | oui |  |  |
| `is_scheduled` | boolean | non | false |  |
| `duration_minutes` | integer | non | 0 |  |
| `ended_at` | timestamp with time zone | oui |  |  |
| `is_paid` | boolean | non | false |  |
| `pricing` | jsonb | oui |  |  |
| `donation_goal` | jsonb | oui |  |  |
| `tags` | ARRAY | non | '{}'::text[] |  |
| `language` | text | oui |  |  |
| `target_language` | text | oui |  |  |
| `cover_image` | text | oui |  |  |
| `is_private` | boolean | non | false |  |
| `allowed_member_ids` | ARRAY | non | '{}'::uuid[] |  |
| `tribe_id` | text | oui |  |  |
| `tribe_name` | text | oui |  |  |
| `expert_id` | text | oui |  |  |
| `is_recording_enabled` | boolean | non | false |  |
| `is_translation_enabled` | boolean | non | false |  |
| `is_questions_enabled` | boolean | non | true |  |
| `is_screen_share_enabled` | boolean | non | true |  |
| `is_vision_enabled` | boolean | non | false |  |
| `is_data_saver` | boolean | non | false |  |
| `quality_mode` | text | oui | 'auto'::text | quality_mode = ANY (ARRAY['auto'::text, 'hd'::text, 'sd'::text, 'eco_audio'::tex… |
| `dossier_id` | uuid | oui |  |  |
| `dossier_title` | text | oui |  |  |
| `is_waiting_room_enabled` | boolean | non | false |  |
| `course_module_id` | text | oui |  |  |
| `interview_guest_name` | text | oui |  |  |
| `interview_guest_bio` | text | oui |  |  |
| `conf_tracks` | ARRAY | non | '{}'::text[] |  |
| `sensitive_data_alert` | boolean | non | false |  |
| `meeting_minutes` | jsonb | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `visual_universe` | text | non | 'crystal'::text | visual_universe = ANY (ARRAY['crystal'::text, 'futuristic_blue'::text, 'natural_… |
| `featured_agent_id` | text | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `live_sessions_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `live_sessions_host_id_fkey` : (host_id) → `public.profiles` (id)
- Clé étrangère `live_sessions_ai_assistant_id_fkey` : (ai_assistant_id) → `public.agents` (id)
- Clé étrangère `live_sessions_expert_id_fkey` : (expert_id) → `public.agents` (id)
- Clé étrangère `live_speakers_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_attendance_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_questions_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_polls_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_agenda_items_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_decisions_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_action_items_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_documents_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_source_cards_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_products_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_personal_notes_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_gifts_sent_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_replays_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_whiteboard_strokes_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `products_linked_live_id_fkey` : (linked_live_id) → `public.live_sessions` (id)
- Clé étrangère `live_messages_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_reactions_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_solidarity_causes_live_session_id_fkey` : (live_session_id) → `public.live_sessions` (id)
- Clé étrangère `live_sessions_featured_agent_id_fkey` : (featured_agent_id) → `public.agents` (id)
- Clé étrangère `live_transcript_lines_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_sessions_quality_mode_check` : `CHECK ((quality_mode = ANY (ARRAY['auto'::text, 'hd'::text, 'sd'::text, 'eco_audio'::text])))`
- Contrainte `live_sessions_visual_universe_check` : `CHECK ((visual_universe = ANY (ARRAY['crystal'::text, 'futuristic_blue'::text, 'natural_fresh'::text, 'solaire_chaud'::text, 'violet_luxe'::text, 'deep_ocean'::…`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_sessions_delete_host` | DELETE | {authenticated} | PERMISSIVE |
| `live_sessions_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `live_sessions_select_visible` | SELECT | {public} | PERMISSIVE |
| `live_sessions_update_host` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_live_sessions_updated_at` : `CREATE TRIGGER trg_live_sessions_updated_at BEFORE UPDATE ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Déclencheur `trg_notify_live_started` : `CREATE TRIGGER trg_notify_live_started AFTER INSERT ON public.live_sessions FOR EACH ROW EXECUTE FUNCTION notify_live_started()`
- Index (5) : `idx_live_sessions_ai_assistant`, `idx_live_sessions_dossier`, `idx_live_sessions_expert`, `idx_live_sessions_host`, `live_sessions_pkey`

### `live_speakers`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `user_id` | uuid | oui |  |  |
| `agent_id` | text | oui |  |  |
| `name` | text | non |  |  |
| `avatar` | text | oui |  |  |
| `role` | text | non |  | role = ANY (ARRAY['host'::text, 'cohost'::text, 'guest'::text, 'viewer'::text, '… |
| `is_muted` | boolean | non | false |  |
| `is_video_on` | boolean | non | true |  |
| `is_ai` | boolean | non | false |  |
| `is_verified` | boolean | non | false |  |
| `specialty` | text | oui |  |  |
| `is_screen_sharing` | boolean | non | false |  |
| `is_hand_raised` | boolean | non | false |  |
| `joined_at` | timestamp with time zone | non | now() |  |
| `left_at` | timestamp with time zone | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `live_speakers_agent_id_fkey` : (agent_id) → `public.agents` (id)
- Clé étrangère `live_speakers_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_speakers_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_speakers_role_check` : `CHECK ((role = ANY (ARRAY['host'::text, 'cohost'::text, 'guest'::text, 'viewer'::text, 'moderator'::text, 'expert_ai'::text, 'expert_human'::text, 'speaker'::te…`
- Contrainte `live_speakers_session_user_key` : `UNIQUE (session_id, user_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_speakers_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_speakers_write_host_or_moderator` | ALL | {public} | PERMISSIVE |
- Index (6) : `idx_live_speakers_agent`, `idx_live_speakers_session`, `idx_live_speakers_user`, `live_speakers_pkey`, `live_speakers_session_agent_active_idx`, `live_speakers_session_user_key`

### `live_attendance`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `participant_id` | uuid | non |  |  |
| `name` | text | oui |  |  |
| `joined_at` | timestamp with time zone | non | now() |  |
| `duration_minutes` | integer | non | 0 |  |
| `exercises_done` | integer | non | 0 |  |
| `quiz_score` | integer | oui |  |  |
| `competence_validated` | boolean | non | false |  |

- Clé primaire : `id`
- Clé étrangère `live_attendance_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_attendance_participant_id_fkey` : (participant_id) → `public.profiles` (id)
- Contrainte `live_attendance_session_id_participant_id_key` : `UNIQUE (session_id, participant_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_attendance_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_attendance_update_own_or_host` | UPDATE | {authenticated} | PERMISSIVE |
| `live_attendance_upsert_own` | INSERT | {authenticated} | PERMISSIVE |
- Index (4) : `idx_live_attendance_participant`, `idx_live_attendance_session`, `live_attendance_pkey`, `live_attendance_session_id_participant_id_key`

### `live_questions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `author_id` | uuid | oui |  |  |
| `author_name` | text | oui |  |  |
| `author_avatar` | text | oui |  |  |
| `text` | text | non |  |  |
| `upvotes_count` | integer | non | 0 |  |
| `status` | text | non | 'open'::text | status = ANY (ARRAY['open'::text, 'answering'::text, 'answered'::text]) |
| `category` | text | oui |  |  |
| `ai_group_key` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_question_upvotes_question_id_fkey` : (question_id) → `public.live_questions` (id)
- Clé étrangère `live_questions_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_questions_author_id_fkey` : (author_id) → `public.profiles` (id)
- Contrainte `live_questions_status_check` : `CHECK ((status = ANY (ARRAY['open'::text, 'answering'::text, 'answered'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_questions_insert` | INSERT | {authenticated} | PERMISSIVE |
| `live_questions_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_questions_update_own_or_host` | UPDATE | {authenticated} | PERMISSIVE |
- Index (3) : `idx_live_questions_author`, `idx_live_questions_session`, `live_questions_pkey`

### `live_question_upvotes`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `question_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `question_id`, `user_id`
- Clé étrangère `live_question_upvotes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_question_upvotes_question_id_fkey` : (question_id) → `public.live_questions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_question_upvotes_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `live_question_upvotes_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `live_question_upvotes_select` | SELECT | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_question_upvotes_user`, `live_question_upvotes_pkey`

### `live_polls`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `question` | text | non |  |  |
| `is_active` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_polls_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_poll_votes_poll_id_fkey` : (poll_id) → `public.live_polls` (id)
- Clé étrangère `live_poll_options_poll_id_fkey` : (poll_id) → `public.live_polls` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_polls_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_polls_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_polls_session`, `live_polls_pkey`

### `live_poll_options`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `poll_id` | uuid | non |  |  |
| `text` | text | non |  |  |
| `votes_count` | integer | non | 0 |  |

- Clé primaire : `id`
- Clé étrangère `live_poll_options_poll_id_fkey` : (poll_id) → `public.live_polls` (id)
- Clé étrangère `live_poll_votes_option_id_fkey` : (option_id) → `public.live_poll_options` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_poll_options_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_poll_options_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_poll_options_poll`, `live_poll_options_pkey`

### `live_poll_votes`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `poll_id` | uuid | non |  |  |
| `option_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `poll_id`, `user_id`
- Clé étrangère `live_poll_votes_poll_id_fkey` : (poll_id) → `public.live_polls` (id)
- Clé étrangère `live_poll_votes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_poll_votes_option_id_fkey` : (option_id) → `public.live_poll_options` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_poll_votes_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `live_poll_votes_select` | SELECT | {authenticated} | PERMISSIVE |
- Index (3) : `idx_live_poll_votes_option`, `idx_live_poll_votes_user`, `live_poll_votes_pkey`

### `live_agenda_items`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `duration_minutes` | integer | non | 0 |  |
| `presenter` | text | oui |  |  |
| `completed` | boolean | non | false |  |
| `position` | integer | non | 0 |  |

- Clé primaire : `id`
- Clé étrangère `live_agenda_items_session_id_fkey` : (session_id) → `public.live_sessions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_agenda_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_agenda_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_agenda_session`, `live_agenda_items_pkey`

### `live_decisions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `text` | text | non |  |  |
| `agreed_by` | ARRAY | non | '{}'::text[] |  |
| `category` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_decisions_session_id_fkey` : (session_id) → `public.live_sessions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_decisions_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_decisions_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_decisions_session`, `live_decisions_pkey`

### `live_action_items`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `category` | text | non |  | category = ANY (ARRAY['projet'::text, 'juridique'::text, 'finance'::text, 'forma… |
| `assigned_to` | text | oui |  |  |
| `deadline` | timestamp with time zone | oui |  |  |
| `completed` | boolean | non | false |  |
| `notes` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_action_items_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_action_items_category_check` : `CHECK ((category = ANY (ARRAY['projet'::text, 'juridique'::text, 'finance'::text, 'formation'::text, 'action'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_action_items_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_action_items_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_action_items_session`, `live_action_items_pkey`

### `live_documents`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `url` | text | non |  |  |
| `type` | text | oui |  | type = ANY (ARRAY['pdf'::text, 'doc'::text, 'image'::text, 'slide'::text, 'sheet… |
| `size` | text | oui |  |  |
| `uploaded_by` | text | oui |  |  |
| `page_count` | integer | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_documents_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_documents_type_check` : `CHECK ((type = ANY (ARRAY['pdf'::text, 'doc'::text, 'image'::text, 'slide'::text, 'sheet'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_documents_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_documents_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_documents_session`, `live_documents_pkey`

### `live_source_cards`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `statement` | text | non |  |  |
| `organization` | text | oui |  |  |
| `document_name` | text | oui |  |  |
| `card_date` | text | oui |  |  |
| `reference_url` | text | oui |  |  |
| `verified_status` | text | oui |  | verified_status = ANY (ARRAY['confirmed'::text, 'uncertain'::text, 'contradictor… |
| `analysis` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_source_cards_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_source_cards_verified_status_check` : `CHECK ((verified_status = ANY (ARRAY['confirmed'::text, 'uncertain'::text, 'contradictory'::text, 'insufficient'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_source_cards_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_source_cards_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_source_cards_session`, `live_source_cards_pkey`

### `live_products`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `description` | text | oui |  |  |
| `price` | numeric | oui |  |  |
| `currency` | text | oui |  |  |
| `country` | text | oui |  |  |
| `country_flag` | text | oui |  |  |
| `availability` | text | oui |  | availability = ANY (ARRAY['in_stock'::text, 'preorder'::text, 'limited'::text]) |
| `seller_name` | text | oui |  |  |
| `seller_avatar` | text | oui |  |  |
| `image_url` | text | oui |  |  |
| `category` | text | oui |  |  |
| `has_trade_assistance` | boolean | oui | false |  |

- Clé primaire : `id`
- Clé étrangère `live_products_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_products_availability_check` : `CHECK ((availability = ANY (ARRAY['in_stock'::text, 'preorder'::text, 'limited'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_products_select` | SELECT | {authenticated} | PERMISSIVE |
| `live_products_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_products_session`, `live_products_pkey`

### `live_personal_notes`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `text` | text | non |  |  |
| `category` | text | non | 'general'::text | category = ANY (ARRAY['reminder'::text, 'task'::text, 'project'::text, 'learning… |
| `target_module` | text | oui |  |  |
| `reminder_date` | timestamp with time zone | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_personal_notes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_personal_notes_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Contrainte `live_personal_notes_category_check` : `CHECK ((category = ANY (ARRAY['reminder'::text, 'task'::text, 'project'::text, 'learning'::text, 'general'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_personal_notes_owner_only` | ALL | {authenticated} | PERMISSIVE |
- Index (3) : `idx_live_personal_notes_session`, `idx_live_personal_notes_user`, `live_personal_notes_pkey`

### `gift_catalog`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | text | non |  |  |
| `name` | text | non |  |  |
| `icon` | text | oui |  |  |
| `cost` | numeric | non |  |  |
| `animation` | text | oui |  |  |
| `is_active` | boolean | non | true |  |

- Clé primaire : `id`
- Clé étrangère `live_gifts_sent_gift_id_fkey` : (gift_id) → `public.gift_catalog` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `gift_catalog_select_authenticated` | SELECT | {authenticated} | PERMISSIVE |
| `gift_catalog_write_admin` | ALL | {authenticated} | PERMISSIVE |
- Index (1) : `gift_catalog_pkey`

### `live_gifts_sent`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `sender_id` | uuid | non |  |  |
| `gift_id` | text | non |  |  |
| `quantity` | integer | non | 1 |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_gifts_sent_sender_id_fkey` : (sender_id) → `public.profiles` (id)
- Clé étrangère `live_gifts_sent_gift_id_fkey` : (gift_id) → `public.gift_catalog` (id)
- Clé étrangère `live_gifts_sent_session_id_fkey` : (session_id) → `public.live_sessions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_gifts_sent_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `live_gifts_sent_select` | SELECT | {authenticated} | PERMISSIVE |
- Index (4) : `idx_live_gifts_sent_gift`, `idx_live_gifts_sent_sender`, `idx_live_gifts_sent_session`, `live_gifts_sent_pkey`

### `live_replays`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `duration_seconds` | integer | non | 0 |  |
| `host_name` | text | oui |  |  |
| `host_avatar` | text | oui |  |  |
| `video_url` | text | oui |  |  |
| `category` | text | oui |  |  |
| `chapters` | jsonb | non | '[]'::jsonb |  |
| `transcript` | jsonb | non | '[]'::jsonb |  |
| `summary` | text | oui |  |  |
| `key_takeaways` | ARRAY | non | '{}'::text[] |  |
| `resources` | jsonb | non | '[]'::jsonb |  |
| `campus_ready` | boolean | non | false |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_replays_session_id_fkey` : (session_id) → `public.live_sessions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_replays_select_authenticated` | SELECT | {authenticated} | PERMISSIVE |
| `live_replays_write_host` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_live_replays_session`, `live_replays_pkey`

### `live_whiteboard_strokes`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `author_id` | uuid | oui |  |  |
| `tool` | text | non |  | tool = ANY (ARRAY['pen'::text, 'rect'::text, 'circle'::text, 'text'::text, 'note… |
| `color` | text | oui |  |  |
| `stroke_width` | numeric | oui |  |  |
| `points` | jsonb | oui |  |  |
| `stroke_text` | text | oui |  |  |
| `x` | numeric | oui |  |  |
| `y` | numeric | oui |  |  |
| `width_box` | numeric | oui |  |  |
| `height_box` | numeric | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_whiteboard_strokes_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_whiteboard_strokes_author_id_fkey` : (author_id) → `public.profiles` (id)
- Contrainte `live_whiteboard_strokes_tool_check` : `CHECK ((tool = ANY (ARRAY['pen'::text, 'rect'::text, 'circle'::text, 'text'::text, 'note'::text, 'arrow'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_whiteboard_delete_host` | DELETE | {authenticated} | PERMISSIVE |
| `live_whiteboard_insert` | INSERT | {authenticated} | PERMISSIVE |
| `live_whiteboard_select` | SELECT | {authenticated} | PERMISSIVE |
- Index (3) : `idx_live_whiteboard_author`, `idx_live_whiteboard_session`, `live_whiteboard_strokes_pkey`

### `dossiers`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `owner_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `objective` | text | oui |  |  |
| `category` | text | oui |  |  |
| `lead_agent_id` | text | oui |  |  |
| `collaborator_agent_ids` | ARRAY | non | '{}'::text[] |  |
| `status` | text | non | 'active'::text |  |
| `blockers` | text | oui |  |  |
| `plan_b` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_tasks_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossiers_owner_id_fkey` : (owner_id) → `public.profiles` (id)
- Clé étrangère `dossiers_lead_agent_id_fkey` : (lead_agent_id) → `public.agents` (id)
- Clé étrangère `dossier_steps_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossier_documents_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossier_deliverables_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossier_appointments_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossier_shares_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `live_sessions_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossiers_delete_owner` | DELETE | {authenticated} | PERMISSIVE |
| `dossiers_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `dossiers_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossiers_update` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_dossiers_updated_at` : `CREATE TRIGGER trg_dossiers_updated_at BEFORE UPDATE ON public.dossiers FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (3) : `dossiers_pkey`, `idx_dossiers_lead_agent`, `idx_dossiers_owner`

### `dossier_steps`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `dossier_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `status` | text | non | 'pending'::text |  |
| `position` | integer | non | 0 |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_tasks_step_id_fkey` : (step_id) → `public.dossier_steps` (id)
- Clé étrangère `dossier_steps_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossier_steps_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossier_steps_write` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `dossier_steps_pkey`, `idx_dossier_steps_dossier`

### `dossier_tasks`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `dossier_id` | uuid | non |  |  |
| `step_id` | uuid | oui |  |  |
| `title` | text | non |  |  |
| `completed` | boolean | non | false |  |
| `due_date` | timestamp with time zone | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_tasks_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossier_tasks_step_id_fkey` : (step_id) → `public.dossier_steps` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossier_tasks_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossier_tasks_write` | ALL | {authenticated} | PERMISSIVE |
- Index (3) : `dossier_tasks_pkey`, `idx_dossier_tasks_dossier`, `idx_dossier_tasks_step`

### `dossier_documents`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `dossier_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `storage_path` | text | oui |  |  |
| `url` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_documents_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossier_documents_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossier_documents_write` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `dossier_documents_pkey`, `idx_dossier_documents_dossier`

### `dossier_deliverables`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `dossier_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `status` | text | non | 'pending'::text |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_deliverables_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossier_deliverables_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossier_deliverables_write` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `dossier_deliverables_pkey`, `idx_dossier_deliverables_dossier`

### `dossier_appointments`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `dossier_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `scheduled_at` | timestamp with time zone | non |  |  |
| `location` | text | oui |  |  |
| `notes` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_appointments_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossier_appointments_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossier_appointments_write` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `dossier_appointments_pkey`, `idx_dossier_appointments_dossier`

### `dossier_shares`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `dossier_id` | uuid | non |  |  |
| `shared_with_user_id` | uuid | non |  |  |
| `permission` | text | non | 'read'::text | permission = ANY (ARRAY['read'::text, 'write'::text]) |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `dossier_shares_dossier_id_fkey` : (dossier_id) → `public.dossiers` (id)
- Clé étrangère `dossier_shares_shared_with_user_id_fkey` : (shared_with_user_id) → `public.profiles` (id)
- Contrainte `dossier_shares_dossier_id_shared_with_user_id_key` : `UNIQUE (dossier_id, shared_with_user_id)`
- Contrainte `dossier_shares_permission_check` : `CHECK ((permission = ANY (ARRAY['read'::text, 'write'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `dossier_shares_select` | SELECT | {authenticated} | PERMISSIVE |
| `dossier_shares_write_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (4) : `dossier_shares_dossier_id_shared_with_user_id_key`, `dossier_shares_pkey`, `idx_dossier_shares_dossier`, `idx_dossier_shares_user`

### `career_goals`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `archetype` | text | oui |  |  |
| `point_a` | jsonb | oui |  |  |
| `point_b` | jsonb | oui |  |  |
| `is_active` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `career_goals_user_id_fkey` : (user_id) → `public.profiles` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `career_goals_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_career_goals_updated_at` : `CREATE TRIGGER trg_career_goals_updated_at BEFORE UPDATE ON public.career_goals FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `career_goals_pkey`, `idx_career_goals_user`

### `career_opportunities`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `organization` | text | oui |  |  |
| `universe` | text | oui |  |  |
| `match_score` | integer | oui |  |  |
| `status` | text | non | 'new'::text |  |
| `vault_status` | text | oui |  |  |
| `is_favorite` | boolean | non | false |  |
| `source` | text | oui |  |  |
| `raw` | jsonb | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `career_opportunities_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `career_opportunity_feedback_opportunity_id_fkey` : (opportunity_id) → `public.career_opportunities` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `career_opportunities_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_career_opportunities_updated_at` : `CREATE TRIGGER trg_career_opportunities_updated_at BEFORE UPDATE ON public.career_opportunities FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `career_opportunities_pkey`, `idx_career_opportunities_user`

### `career_opportunity_feedback`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `opportunity_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `feedback_type` | text | oui |  |  |
| `decline_reason` | text | oui |  |  |
| `notes` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `career_opportunity_feedback_opportunity_id_fkey` : (opportunity_id) → `public.career_opportunities` (id)
- Clé étrangère `career_opportunity_feedback_user_id_fkey` : (user_id) → `public.profiles` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `career_opportunity_feedback_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (3) : `career_opportunity_feedback_pkey`, `idx_career_opportunity_feedback_opportunity`, `idx_career_opportunity_feedback_user`

### `career_search_missions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `criteria` | jsonb | oui |  |  |
| `is_active` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `career_search_missions_user_id_fkey` : (user_id) → `public.profiles` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `career_search_missions_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_career_search_missions_updated_at` : `CREATE TRIGGER trg_career_search_missions_updated_at BEFORE UPDATE ON public.career_search_missions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `career_search_missions_pkey`, `idx_career_search_missions_user`

### `master_resumes`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `content` | jsonb | non |  |  |
| `version` | integer | non | 1 |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `master_resumes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `master_resumes_user_id_key` : `UNIQUE (user_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `master_resumes_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_master_resumes_updated_at` : `CREATE TRIGGER trg_master_resumes_updated_at BEFORE UPDATE ON public.master_resumes FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `master_resumes_pkey`, `master_resumes_user_id_key`

### `career_snapshots`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `kind` | text | non |  |  |
| `payload` | jsonb | non |  |  |
| `generated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `career_snapshots_user_id_fkey` : (user_id) → `public.profiles` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `career_snapshots_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `career_snapshots_pkey`, `idx_career_snapshots_user_kind`

### `courses`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `title` | text | non |  |  |
| `description` | text | oui |  |  |
| `category` | text | oui |  |  |
| `academic_level` | text | oui |  |  |
| `country_code` | text | oui |  |  |
| `duration_minutes` | integer | oui |  |  |
| `thumbnail_url` | text | oui |  |  |
| `is_published` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `certificates_course_id_fkey` : (course_id) → `public.courses` (id)
- Clé étrangère `enrollments_course_id_fkey` : (course_id) → `public.courses` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `courses_select_published_or_admin` | SELECT | {authenticated} | PERMISSIVE |
| `courses_write_admin` | ALL | {authenticated} | PERMISSIVE |
- Index (1) : `courses_pkey`

### `enrollments`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `course_id` | uuid | non |  |  |
| `progress_percent` | integer | non | 0 | progress_percent >= 0 AND progress_percent <= 100 |
| `lesson_progress` | jsonb | non | '{}'::jsonb |  |
| `status` | text | non | 'in_progress'::text | status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text]) |
| `enrolled_at` | timestamp with time zone | non | now() |  |
| `completed_at` | timestamp with time zone | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `exam_sessions_enrollment_id_fkey` : (enrollment_id) → `public.enrollments` (id)
- Clé étrangère `enrollments_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `enrollments_course_id_fkey` : (course_id) → `public.courses` (id)
- Clé étrangère `certificates_enrollment_id_fkey` : (enrollment_id) → `public.enrollments` (id)
- Contrainte `enrollments_progress_percent_check` : `CHECK (((progress_percent >= 0) AND (progress_percent <= 100)))`
- Contrainte `enrollments_status_check` : `CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text])))`
- Contrainte `enrollments_user_id_course_id_key` : `UNIQUE (user_id, course_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `enrollments_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (4) : `enrollments_pkey`, `enrollments_user_id_course_id_key`, `idx_enrollments_course`, `idx_enrollments_user`

### `exam_sessions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `enrollment_id` | uuid | non |  |  |
| `score` | numeric | oui |  |  |
| `passed` | boolean | oui |  |  |
| `answers` | jsonb | oui |  |  |
| `taken_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `exam_sessions_enrollment_id_fkey` : (enrollment_id) → `public.enrollments` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `exam_sessions_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `exam_sessions_pkey`, `idx_exam_sessions_enrollment`

### `certificates`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `course_id` | uuid | non |  |  |
| `enrollment_id` | uuid | oui |  |  |
| `certificate_url` | text | oui |  |  |
| `issued_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `certificates_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `certificates_course_id_fkey` : (course_id) → `public.courses` (id)
- Clé étrangère `certificates_enrollment_id_fkey` : (enrollment_id) → `public.enrollments` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `certificates_insert_system` | INSERT | {authenticated} | PERMISSIVE |
| `certificates_select_owner` | SELECT | {authenticated} | PERMISSIVE |
- Index (4) : `certificates_pkey`, `idx_certificates_course`, `idx_certificates_enrollment`, `idx_certificates_user`

### `shops`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `owner_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `description` | text | oui |  |  |
| `banner_url` | text | oui |  |  |
| `revenue` | numeric | non | 0 |  |
| `sales_count` | integer | non | 0 |  |
| `ai_config` | jsonb | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `products_shop_id_fkey` : (shop_id) → `public.shops` (id)
- Clé étrangère `shops_owner_id_fkey` : (owner_id) → `public.profiles` (id)
- Contrainte `shops_owner_id_key` : `UNIQUE (owner_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `shops_select_authenticated` | SELECT | {authenticated} | PERMISSIVE |
| `shops_write_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_shops_updated_at` : `CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `shops_owner_id_key`, `shops_pkey`

### `products`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `shop_id` | uuid | oui |  |  |
| `seller_id` | uuid | oui |  |  |
| `title` | text | non |  |  |
| `description` | text | oui |  |  |
| `price` | numeric | non | 0 |  |
| `currency` | text | non | 'EUR'::text |  |
| `category` | text | oui |  | category = ANY (ARRAY['Digital'::text, 'Service'::text, 'Physique'::text]) |
| `image_url` | text | oui |  |  |
| `rating` | numeric | oui | 0 |  |
| `reviews_count` | integer | oui | 0 |  |
| `seller_country` | text | oui |  |  |
| `seller_flag` | text | oui |  |  |
| `seller_verified` | boolean | oui | false |  |
| `dimension_type` | text | oui |  | dimension_type = ANY (ARRAY['B2C'::text, 'B2B'::text, 'C2C'::text]) |
| `min_order_quantity` | integer | oui |  |  |
| `unit` | text | oui |  |  |
| `stock_available` | integer | oui |  |  |
| `origin_country` | text | oui |  |  |
| `lead_time_days` | integer | oui |  |  |
| `shipping_available` | boolean | oui | false |  |
| `is_service` | boolean | oui | false |  |
| `service_details` | jsonb | oui |  |  |
| `linked_reel_id` | text | oui |  |  |
| `linked_live_id` | uuid | oui |  |  |
| `is_active` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `products_linked_live_id_fkey` : (linked_live_id) → `public.live_sessions` (id)
- Clé étrangère `products_shop_id_fkey` : (shop_id) → `public.shops` (id)
- Clé étrangère `products_seller_id_fkey` : (seller_id) → `public.profiles` (id)
- Clé étrangère `order_items_product_id_fkey` : (product_id) → `public.products` (id)
- Contrainte `products_category_check` : `CHECK ((category = ANY (ARRAY['Digital'::text, 'Service'::text, 'Physique'::text])))`
- Contrainte `products_dimension_type_check` : `CHECK ((dimension_type = ANY (ARRAY['B2C'::text, 'B2B'::text, 'C2C'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `products_select_active_or_owner` | SELECT | {authenticated} | PERMISSIVE |
| `products_write_owner` | ALL | {authenticated} | PERMISSIVE |

- Déclencheur `trg_products_updated_at` : `CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (4) : `idx_products_linked_live`, `idx_products_seller`, `idx_products_shop`, `products_pkey`

### `orders`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `buyer_id` | uuid | non |  |  |
| `seller_id` | uuid | oui |  |  |
| `status` | text | non | 'pending'::text | status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'completed':… |
| `total_amount` | numeric | non | 0 |  |
| `currency` | text | non | 'EUR'::text |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `orders_buyer_id_fkey` : (buyer_id) → `public.profiles` (id)
- Clé étrangère `orders_seller_id_fkey` : (seller_id) → `public.profiles` (id)
- Clé étrangère `order_items_order_id_fkey` : (order_id) → `public.orders` (id)
- Contrainte `orders_status_check` : `CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'shipped'::text, 'completed'::text, 'cancelled'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `orders_insert_buyer` | INSERT | {authenticated} | PERMISSIVE |
| `orders_select_buyer_or_seller` | SELECT | {authenticated} | PERMISSIVE |
| `orders_update_buyer_or_seller` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_orders_updated_at` : `CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (3) : `idx_orders_buyer`, `idx_orders_seller`, `orders_pkey`

### `order_items`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `order_id` | uuid | non |  |  |
| `product_id` | uuid | non |  |  |
| `quantity` | integer | non | 1 |  |
| `unit_price` | numeric | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `order_items_order_id_fkey` : (order_id) → `public.orders` (id)
- Clé étrangère `order_items_product_id_fkey` : (product_id) → `public.products` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `order_items_insert_buyer` | INSERT | {authenticated} | PERMISSIVE |
| `order_items_select` | SELECT | {authenticated} | PERMISSIVE |
- Index (3) : `idx_order_items_order`, `idx_order_items_product`, `order_items_pkey`

### `wallet_transactions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `type` | text | non |  | type = ANY (ARRAY['credit'::text, 'debit'::text, 'escrow_hold'::text, 'escrow_re… |
| `amount` | numeric | non |  |  |
| `currency` | text | non | 'Credits'::text |  |
| `reference` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `wallet_transactions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `wallet_transactions_type_check` : `CHECK ((type = ANY (ARRAY['credit'::text, 'debit'::text, 'escrow_hold'::text, 'escrow_release'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `wallet_transactions_select_own` | SELECT | {authenticated} | PERMISSIVE |
- Index (2) : `idx_wallet_transactions_user`, `wallet_transactions_pkey`

### `notifications`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `type` | text | non | 'info'::text | type = ANY (ARRAY['success'::text, 'info'::text, 'warning'::text, 'alert'::text]… |
| `title` | text | non |  |  |
| `message` | text | non |  |  |
| `priority` | text | oui | 'normal'::text |  |
| `target_action` | text | oui |  |  |
| `read` | boolean | non | false |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `notifications_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `notifications_type_check` : `CHECK ((type = ANY (ARRAY['success'::text, 'info'::text, 'warning'::text, 'alert'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `notifications_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `idx_notifications_user_unread`, `notifications_pkey`

### `documents`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `owner_id` | uuid | non |  |  |
| `name` | text | non |  |  |
| `category` | text | oui |  |  |
| `storage_path` | text | non |  |  |
| `file_size` | bigint | oui |  |  |
| `mime_type` | text | oui |  |  |
| `visibility` | text | non | 'private'::text | visibility = ANY (ARRAY['private'::text, 'shared'::text]) |
| `expiry_date` | timestamp with time zone | oui |  |  |
| `is_verified` | boolean | non | false |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `document_shares_document_id_fkey` : (document_id) → `public.documents` (id)
- Clé étrangère `documents_owner_id_fkey` : (owner_id) → `public.profiles` (id)
- Contrainte `documents_visibility_check` : `CHECK ((visibility = ANY (ARRAY['private'::text, 'shared'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `documents_select` | SELECT | {authenticated} | PERMISSIVE |
| `documents_write_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (2) : `documents_pkey`, `idx_documents_owner`

### `document_shares`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `document_id` | uuid | non |  |  |
| `shared_with_user_id` | uuid | non |  |  |
| `permission` | text | non | 'read'::text | permission = ANY (ARRAY['read'::text, 'write'::text]) |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `document_shares_document_id_fkey` : (document_id) → `public.documents` (id)
- Clé étrangère `document_shares_shared_with_user_id_fkey` : (shared_with_user_id) → `public.profiles` (id)
- Contrainte `document_shares_document_id_shared_with_user_id_key` : `UNIQUE (document_id, shared_with_user_id)`
- Contrainte `document_shares_permission_check` : `CHECK ((permission = ANY (ARRAY['read'::text, 'write'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `document_shares_select` | SELECT | {authenticated} | PERMISSIVE |
| `document_shares_write_owner` | ALL | {authenticated} | PERMISSIVE |
- Index (4) : `document_shares_document_id_shared_with_user_id_key`, `document_shares_pkey`, `idx_document_shares_document`, `idx_document_shares_user`

### `audit_logs`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `actor_id` | uuid | oui |  |  |
| `action` | text | non |  |  |
| `entity_type` | text | non |  |  |
| `entity_id` | text | oui |  |  |
| `request_id` | text | oui |  |  |
| `metadata` | jsonb | non | '{}'::jsonb |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `audit_logs_actor_id_fkey` : (actor_id) → `public.profiles` (id)
- Index (2) : `audit_logs_pkey`, `idx_audit_logs_entity`

### `admin_api_rate_limits`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `actor_id` | uuid | non |  |  |
| `window_started_at` | timestamp with time zone | non | now() |  |
| `request_count` | integer | non | 0 | request_count >= 0 |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `actor_id`
- Clé étrangère `admin_api_rate_limits_actor_id_fkey` : (actor_id) → `public.profiles` (id)
- Contrainte `admin_api_rate_limits_request_count_check` : `CHECK ((request_count >= 0))`
- Index (1) : `admin_api_rate_limits_pkey`

### `ai_providers`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | text | non |  |  |
| `category` | text | non |  | category = ANY (ARRAY['llm'::text, 'voice'::text, 'image_video'::text]) |
| `display_name` | text | non |  |  |
| `adapter_kind` | text | non |  |  |
| `base_url` | text | oui |  |  |
| `docs_url` | text | oui |  |  |
| `priority` | integer | non | 100 |  |
| `status` | text | non | 'not_implemented'::text | status = ANY (ARRAY['not_implemented'::text, 'active'::text]) |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `api_key_url` | text | oui |  |  |
| `billing_url` | text | oui |  |  |
| `source_url` | text | oui |  |  |
| `discovery_status` | text | non | 'manual'::text | discovery_status = ANY (ARRAY['manual'::text, 'pending'::text, 'analyzing'::text… |
| `discovery_confidence` | numeric | oui |  |  |
| `discovery_summary` | text | oui |  |  |
| `adapter_config` | jsonb | non | '{}'::jsonb |  |
| `missing_fields` | jsonb | non | '[]'::jsonb |  |
| `discovered_at` | timestamp with time zone | oui |  |  |
| `auth_method` | text | oui | 'unknown'::text | auth_method = ANY (ARRAY['api_key'::text, 'oauth2'::text, 'webhook'::text, 'mcp'… |
| `pricing_summary` | text | oui |  |  |
| `cost_tier` | text | non | 'paid'::text | cost_tier = ANY (ARRAY['free'::text, 'paid'::text]) |

- Clé primaire : `id`
- Clé étrangère `ai_models_provider_id_fkey` : (provider_id) → `public.ai_providers` (id)
- Clé étrangère `ai_provider_credentials_provider_id_fkey` : (provider_id) → `public.ai_providers` (id)
- Clé étrangère `ai_call_log_provider_id_fkey` : (provider_id) → `public.ai_providers` (id)
- Contrainte `ai_providers_auth_method_check` : `CHECK ((auth_method = ANY (ARRAY['api_key'::text, 'oauth2'::text, 'webhook'::text, 'mcp'::text, 'unknown'::text])))`
- Contrainte `ai_providers_category_check` : `CHECK ((category = ANY (ARRAY['llm'::text, 'voice'::text, 'image_video'::text])))`
- Contrainte `ai_providers_cost_tier_check` : `CHECK ((cost_tier = ANY (ARRAY['free'::text, 'paid'::text])))`
- Contrainte `ai_providers_discovery_status_check` : `CHECK ((discovery_status = ANY (ARRAY['manual'::text, 'pending'::text, 'analyzing'::text, 'ready'::text, 'needs_info'::text, 'failed'::text])))`
- Contrainte `ai_providers_status_check` : `CHECK ((status = ANY (ARRAY['not_implemented'::text, 'active'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `ai_providers_admin_select` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `set_updated_at` : `CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_providers FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (1) : `ai_providers_pkey`

### `ai_models`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `provider_id` | text | non |  |  |
| `model_id` | text | non |  |  |
| `label` | text | non |  |  |
| `is_default` | boolean | non | false |  |
| `capabilities` | jsonb | non | '{}'::jsonb |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `input_cost_per_million` | numeric | non | 0 |  |
| `output_cost_per_million` | numeric | non | 0 |  |
| `cost_per_call` | numeric | non | 0 |  |

- Clé primaire : `id`
- Clé étrangère `ai_models_provider_id_fkey` : (provider_id) → `public.ai_providers` (id)
- Contrainte `ai_models_provider_id_model_id_key` : `UNIQUE (provider_id, model_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `ai_models_admin_select` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `set_updated_at` : `CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_models FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (4) : `ai_models_one_default_per_provider`, `ai_models_pkey`, `ai_models_provider_id_idx`, `ai_models_provider_id_model_id_key`

### `ai_provider_credentials`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `provider_id` | text | non |  |  |
| `vault_secret_id` | uuid | non |  |  |
| `key_hint` | text | oui |  |  |
| `is_enabled` | boolean | non | false |  |
| `last_tested_at` | timestamp with time zone | oui |  |  |
| `last_test_status` | text | oui |  | last_test_status = ANY (ARRAY['success'::text, 'failure'::text]) |
| `last_test_message` | text | oui |  |  |
| `created_by` | uuid | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `ai_provider_credentials_created_by_fkey` : (created_by) → `public.profiles` (id)
- Clé étrangère `ai_provider_credentials_provider_id_fkey` : (provider_id) → `public.ai_providers` (id)
- Contrainte `ai_provider_credentials_last_test_status_check` : `CHECK ((last_test_status = ANY (ARRAY['success'::text, 'failure'::text])))`
- Contrainte `ai_provider_credentials_provider_id_key` : `UNIQUE (provider_id)`

- Déclencheur `set_updated_at` : `CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_provider_credentials FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `ai_provider_credentials_pkey`, `ai_provider_credentials_provider_id_key`

### `ai_call_log`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `category` | text | oui |  |  |
| `provider_id` | text | oui |  |  |
| `model_id` | text | oui |  |  |
| `attempt_number` | integer | non | 1 |  |
| `status` | text | oui |  | status = ANY (ARRAY['success'::text, 'error'::text, 'skipped'::text, 'blocked'::… |
| `error_class` | text | oui |  |  |
| `error_message` | text | oui |  |  |
| `latency_ms` | integer | oui |  |  |
| `requested_by` | uuid | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `request_id` | uuid | oui |  |  |
| `decision` | text | oui |  |  |
| `decision_reason` | text | oui |  |  |
| `input_tokens` | integer | oui |  |  |
| `output_tokens` | integer | oui |  |  |
| `cost_usd` | numeric | non | 0 |  |

- Clé primaire : `id`
- Clé étrangère `ai_call_log_provider_id_fkey` : (provider_id) → `public.ai_providers` (id)
- Clé étrangère `ai_call_log_requested_by_fkey` : (requested_by) → `public.profiles` (id)
- Contrainte `ai_call_log_status_check` : `CHECK ((status = ANY (ARRAY['success'::text, 'error'::text, 'skipped'::text, 'blocked'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `ai_call_log_admin_select` | SELECT | {authenticated} | PERMISSIVE |
- Index (6) : `ai_call_log_created_at_idx`, `ai_call_log_created_idx`, `ai_call_log_pkey`, `ai_call_log_provider_id_idx`, `ai_call_log_request_idx`, `ai_call_log_requested_by_idx`

### `ai_tools`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | text | non |  |  |
| `display_name` | text | non |  |  |
| `description` | text | non |  |  |
| `category` | text | non |  | category = ANY (ARRAY['search'::text, 'read'::text, 'action'::text]) |
| `parameters_schema` | jsonb | non | '{"type": "object", "properties": {}}'::jsonb |  |
| `requires_confirmation` | boolean | non | false |  |
| `requires_auth` | boolean | non | false |  |
| `is_enabled` | boolean | non | true |  |
| `sort_order` | integer | non | 100 |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `agent_tool_grants_tool_id_fkey` : (tool_id) → `public.ai_tools` (id)
- Contrainte `ai_tools_category_check` : `CHECK ((category = ANY (ARRAY['search'::text, 'read'::text, 'action'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `ai_tools_read` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `set_updated_at_ai_tools` : `CREATE TRIGGER set_updated_at_ai_tools BEFORE UPDATE ON public.ai_tools FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (1) : `ai_tools_pkey`

### `agent_tool_grants`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `agent_id` | text | non |  |  |
| `tool_id` | text | non |  |  |
| `is_enabled` | boolean | non | true |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `agent_id`, `tool_id`
- Clé étrangère `agent_tool_grants_tool_id_fkey` : (tool_id) → `public.ai_tools` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `agent_tool_grants_read` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `set_updated_at_agent_tool_grants` : `CREATE TRIGGER set_updated_at_agent_tool_grants BEFORE UPDATE ON public.agent_tool_grants FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (2) : `agent_tool_grants_pkey`, `agent_tool_grants_tool_idx`

### `ai_budget`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | text | non | 'global'::text |  |
| `daily_cap_usd` | numeric | oui |  |  |
| `monthly_cap_usd` | numeric | oui |  |  |
| `enforced` | boolean | non | true |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `ai_budget_read` | SELECT | {authenticated} | PERMISSIVE |
- Index (1) : `ai_budget_pkey`

### `friendships`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `requester_id` | uuid | non |  |  |
| `addressee_id` | uuid | non |  |  |
| `status` | text | non | 'pending'::text | status = ANY (ARRAY['pending'::text, 'accepted'::text]) |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `friendships_requester_id_fkey` : (requester_id) → `public.profiles` (id)
- Clé étrangère `friendships_addressee_id_fkey` : (addressee_id) → `public.profiles` (id)
- Contrainte `friendships_no_self` : `CHECK ((requester_id <> addressee_id))`
- Contrainte `friendships_status_check` : `CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `friendships_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `friendships_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `friendships_select_own` | SELECT | {authenticated} | PERMISSIVE |
| `friendships_update_addressee_accept` | UPDATE | {authenticated} | PERMISSIVE |

- Déclencheur `trg_friendship_notify` : `CREATE TRIGGER trg_friendship_notify AFTER INSERT OR UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION notify_friendship_event()`
- Déclencheur `trg_friendships_updated_at` : `CREATE TRIGGER trg_friendships_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (5) : `friendships_addressee_idx`, `friendships_pkey`, `friendships_requester_idx`, `friendships_unique_pair`, `friendships_unique_pair_idx`

### `live_transport_config`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `provider` | text | non | 'livekit'::text | provider = 'livekit'::text |
| `server_url` | text | non |  |  |
| `api_key` | text | non |  |  |
| `vault_secret_id` | uuid | non |  |  |
| `environment` | text | non | 'development'::text | environment = ANY (ARRAY['development'::text, 'production'::text]) |
| `is_active` | boolean | non | true |  |
| `created_by` | uuid | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_transport_config_vault_secret_id_fkey` : (vault_secret_id) → `vault.secrets` (id)
- Clé étrangère `live_transport_config_created_by_fkey` : (created_by) → `auth.users` (id)
- Contrainte `live_transport_config_environment_check` : `CHECK ((environment = ANY (ARRAY['development'::text, 'production'::text])))`
- Contrainte `live_transport_config_provider_check` : `CHECK ((provider = 'livekit'::text))`
- Index (1) : `live_transport_config_pkey`

### `live_messages`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `author_id` | uuid | oui |  |  |
| `author_name` | text | oui |  |  |
| `author_avatar` | text | oui |  |  |
| `text` | text | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_messages_author_id_fkey` : (author_id) → `public.profiles` (id)
- Clé étrangère `live_messages_session_id_fkey` : (session_id) → `public.live_sessions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_messages_delete_own_or_moderator` | DELETE | {public} | PERMISSIVE |
| `live_messages_insert_own` | INSERT | {public} | PERMISSIVE |
| `live_messages_select` | SELECT | {public} | PERMISSIVE |
- Index (2) : `live_messages_pkey`, `live_messages_session_id_idx`

### `live_reactions`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `user_id` | uuid | non |  |  |
| `type` | text | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_reactions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Clé étrangère `live_reactions_session_id_fkey` : (session_id) → `public.live_sessions` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_reactions_insert_own` | INSERT | {public} | PERMISSIVE |
| `live_reactions_select` | SELECT | {public} | PERMISSIVE |
- Index (2) : `live_reactions_pkey`, `live_reactions_session_id_idx`

### `live_solidarity_causes`

> Mission de solidarité créée depuis un LIVE (souvent par la voix — LOOP 09/14). Continue d'exister après la fin du direct (point "continuité après le LIVE" de la spec) jusqu'à sa clôture (status).

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `live_session_id` | uuid | non |  |  |
| `organizer_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `beneficiary_description` | text | non |  |  |
| `beneficiary_type` | text | non |  | beneficiary_type = ANY (ARRAY['person'::text, 'community'::text, 'project'::text… |
| `target_amount` | numeric | oui |  |  |
| `currency` | text | non | 'XOF'::text |  |
| `organizer_fee_percent` | numeric | non | 0 | organizer_fee_percent >= 0::numeric AND organizer_fee_percent <= 100::numeric |
| `status` | text | non | 'active'::text | status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text]) |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `visibility` | text | non | 'live_participants'::text | visibility = ANY (ARRAY['organizer_only'::text, 'live_participants'::text]) |

- Clé primaire : `id`
- Clé étrangère `live_solidarity_causes_organizer_id_fkey` : (organizer_id) → `auth.users` (id)
- Clé étrangère `live_solidarity_updates_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Clé étrangère `live_solidarity_proofs_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Clé étrangère `live_solidarity_causes_live_session_id_fkey` : (live_session_id) → `public.live_sessions` (id)
- Clé étrangère `live_solidarity_wallet_ledger_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Clé étrangère `live_solidarity_donors_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Contrainte `live_solidarity_causes_beneficiary_type_check` : `CHECK ((beneficiary_type = ANY (ARRAY['person'::text, 'community'::text, 'project'::text, 'medical'::text, 'complex'::text])))`
- Contrainte `live_solidarity_causes_organizer_fee_percent_check` : `CHECK (((organizer_fee_percent >= (0)::numeric) AND (organizer_fee_percent <= (100)::numeric)))`
- Contrainte `live_solidarity_causes_status_check` : `CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])))`
- Contrainte `live_solidarity_causes_visibility_check` : `CHECK ((visibility = ANY (ARRAY['organizer_only'::text, 'live_participants'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_solidarity_causes_delete` | DELETE | {public} | PERMISSIVE |
| `live_solidarity_causes_insert` | INSERT | {public} | PERMISSIVE |
| `live_solidarity_causes_select` | SELECT | {public} | PERMISSIVE |
| `live_solidarity_causes_update` | UPDATE | {public} | PERMISSIVE |
- Index (1) : `live_solidarity_causes_pkey`

### `live_solidarity_wallet_ledger`

> Écritures append-only (collecté/utilisé) — jamais un solde stocké, même principe que wallet_transactions/get_wallet_balance(). Aucun mouvement réel de fonds ici : ce ledger trace, il ne détient jamais d'argent (le transfert réel passe par un prestataire de paiement externe, hors périmètre).

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `cause_id` | uuid | non |  |  |
| `entry_type` | text | non |  | entry_type = ANY (ARRAY['collected'::text, 'used'::text]) |
| `amount` | numeric | non |  | amount > 0::numeric |
| `description` | text | oui |  |  |
| `created_by` | uuid | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_solidarity_wallet_ledger_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Clé étrangère `live_solidarity_wallet_ledger_created_by_fkey` : (created_by) → `auth.users` (id)
- Contrainte `live_solidarity_wallet_ledger_amount_check` : `CHECK ((amount > (0)::numeric))`
- Contrainte `live_solidarity_wallet_ledger_entry_type_check` : `CHECK ((entry_type = ANY (ARRAY['collected'::text, 'used'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_solidarity_ledger_select` | SELECT | {public} | PERMISSIVE |
| `live_solidarity_ledger_write` | INSERT | {public} | PERMISSIVE |
- Index (1) : `live_solidarity_wallet_ledger_pkey`

### `live_solidarity_proofs`

> Preuve structurée (photo/vidéo/facture/reçu/document) associée à une cause + une étape + une dépense + un montant — traçabilité réelle, pas un fil social (spec point "preuves structurées").

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `cause_id` | uuid | non |  |  |
| `step_label` | text | non |  |  |
| `expense_description` | text | oui |  |  |
| `amount` | numeric | oui |  |  |
| `proof_type` | text | non |  | proof_type = ANY (ARRAY['photo'::text, 'video'::text, 'invoice'::text, 'receipt'… |
| `document_url` | text | oui |  |  |
| `created_by` | uuid | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_solidarity_proofs_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Clé étrangère `live_solidarity_proofs_created_by_fkey` : (created_by) → `auth.users` (id)
- Contrainte `live_solidarity_proofs_proof_type_check` : `CHECK ((proof_type = ANY (ARRAY['photo'::text, 'video'::text, 'invoice'::text, 'receipt'::text, 'document'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_solidarity_proofs_select` | SELECT | {public} | PERMISSIVE |
| `live_solidarity_proofs_write` | INSERT | {public} | PERMISSIVE |
- Index (1) : `live_solidarity_proofs_pkey`

### `live_solidarity_updates`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `cause_id` | uuid | non |  |  |
| `author_id` | uuid | oui |  |  |
| `text` | text | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_solidarity_updates_author_id_fkey` : (author_id) → `auth.users` (id)
- Clé étrangère `live_solidarity_updates_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_solidarity_updates_select` | SELECT | {public} | PERMISSIVE |
| `live_solidarity_updates_write` | INSERT | {public} | PERMISSIVE |
- Index (1) : `live_solidarity_updates_pkey`

### `live_solidarity_donors`

> Enregistrement du don côté MokNet (suivi/transparence) — pas le mouvement réel de fonds, qui passe par un prestataire de paiement externe (hors périmètre de ce sandbox). donor_id nullable : un don peut être anonyme y compris en base.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `cause_id` | uuid | non |  |  |
| `donor_id` | uuid | oui |  |  |
| `amount` | numeric | non |  | amount > 0::numeric |
| `is_anonymous_public` | boolean | non | false |  |
| `wants_impact_updates` | boolean | non | false |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_solidarity_donors_donor_id_fkey` : (donor_id) → `auth.users` (id)
- Clé étrangère `live_solidarity_donors_cause_id_fkey` : (cause_id) → `public.live_solidarity_causes` (id)
- Contrainte `live_solidarity_donors_amount_check` : `CHECK ((amount > (0)::numeric))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_solidarity_donors_select` | SELECT | {public} | PERMISSIVE |
| `live_solidarity_donors_write` | INSERT | {public} | PERMISSIVE |
- Index (1) : `live_solidarity_donors_pkey`

### `user_blocks`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `blocker_id` | uuid | non |  |  |
| `blocked_id` | uuid | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `user_blocks_blocker_id_fkey` : (blocker_id) → `public.profiles` (id)
- Clé étrangère `user_blocks_blocked_id_fkey` : (blocked_id) → `public.profiles` (id)
- Contrainte `user_blocks_no_self` : `CHECK ((blocker_id <> blocked_id))`
- Contrainte `user_blocks_unique` : `UNIQUE (blocker_id, blocked_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `user_blocks_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `user_blocks_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `user_blocks_select_own` | SELECT | {authenticated} | PERMISSIVE |
- Index (2) : `user_blocks_pkey`, `user_blocks_unique`

### `follows`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `follower_id` | uuid | non |  |  |
| `followee_id` | uuid | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `follows_follower_id_fkey` : (follower_id) → `public.profiles` (id)
- Clé étrangère `follows_followee_id_fkey` : (followee_id) → `public.profiles` (id)
- Contrainte `follows_no_self` : `CHECK ((follower_id <> followee_id))`
- Contrainte `follows_unique` : `UNIQUE (follower_id, followee_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `follows_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `follows_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `follows_select_own` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `trg_follow_notify` : `CREATE TRIGGER trg_follow_notify AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION notify_follow_event()`
- Déclencheur `trg_follows_counts` : `CREATE TRIGGER trg_follows_counts AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION handle_follow_change()`
- Index (2) : `follows_pkey`, `follows_unique`

### `reminders`

> LOOP 09/17 : rappel ponctuel créé par un utilisateur pour lui-même. Transformé une seule fois en notification réelle par fire_due_reminders() (pg_cron) quand remind_at est atteint, jamais récurrent sauf création explicite d'un nouveau rappel. Aucune UI de création dédiée pour cette LOOP (testé via SQL/REST direct) — voir docs/SUPABASE_ARCHITECTURE.md.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `message` | text | non |  |  |
| `remind_at` | timestamp with time zone | non |  |  |
| `status` | text | non | 'pending'::text | status = ANY (ARRAY['pending'::text, 'fired'::text, 'cancelled'::text]) |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `reminders_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `reminders_status_check` : `CHECK ((status = ANY (ARRAY['pending'::text, 'fired'::text, 'cancelled'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `reminders_delete_own` | DELETE | {public} | PERMISSIVE |
| `reminders_insert_own` | INSERT | {public} | PERMISSIVE |
| `reminders_select_own` | SELECT | {public} | PERMISSIVE |
| `reminders_update_own` | UPDATE | {public} | PERMISSIVE |
- Index (2) : `reminders_due_idx`, `reminders_pkey`

### `user_memory`

> LOOP 12/17 : mémoire contextuelle structurée par scope. "recent_activity" est préparé mais sans producteur pour l'instant (aucun module n'écrit encore ici — état honnête, comparable à `stories`/`courses` avant leur propre LOOP). "explicit" sert les mémoires demandées textuellement par l'utilisateur ; "project" sert l'objectif/les décisions liés à un parcours ; "durable_preference" les préférences stables.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `scope` | text | non |  | scope = ANY (ARRAY['recent_activity'::text, 'project'::text, 'durable_preference… |
| `category` | text | non |  |  |
| `key` | text | non |  |  |
| `value` | text | non |  |  |
| `source` | text | non | 'explicit'::text | source = ANY (ARRAY['explicit'::text, 'inferred'::text]) |
| `confidence` | numeric | oui |  | confidence IS NULL OR confidence >= 0::numeric AND confidence <= 1::numeric |
| `status` | text | non | 'active'::text | status = ANY (ARRAY['active'::text, 'superseded'::text, 'expired'::text]) |
| `expires_at` | timestamp with time zone | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `agent_id` | text | oui |  |  |
| `dossier_id` | text | oui |  |  |
| `layer` | text | oui |  | layer = ANY (ARRAY['personal'::text, 'parcours'::text, 'learning'::text, 'docume… |
| `verified` | boolean | non | true |  |

- Clé primaire : `id`
- Clé étrangère `user_memory_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `user_memory_confidence_check` : `CHECK (((confidence IS NULL) OR ((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))))`
- Contrainte `user_memory_layer_check` : `CHECK ((layer = ANY (ARRAY['personal'::text, 'parcours'::text, 'learning'::text, 'documentary'::text, 'conversational'::text])))`
- Contrainte `user_memory_scope_check` : `CHECK ((scope = ANY (ARRAY['recent_activity'::text, 'project'::text, 'durable_preference'::text, 'explicit'::text])))`
- Contrainte `user_memory_source_check` : `CHECK ((source = ANY (ARRAY['explicit'::text, 'inferred'::text])))`
- Contrainte `user_memory_status_check` : `CHECK ((status = ANY (ARRAY['active'::text, 'superseded'::text, 'expired'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `user_memory_delete_own` | DELETE | {public} | PERMISSIVE |
| `user_memory_insert_own` | INSERT | {public} | PERMISSIVE |
| `user_memory_select_own` | SELECT | {public} | PERMISSIVE |
| `user_memory_update_own` | UPDATE | {public} | PERMISSIVE |

- Déclencheur `trg_user_memory_updated_at` : `CREATE TRIGGER trg_user_memory_updated_at BEFORE UPDATE ON public.user_memory FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (3) : `user_memory_pkey`, `user_memory_preference_key_idx`, `user_memory_user_scope_idx`

### `tasks`

> LOOP 14/17 : tâche trackable générique (statut/priorité/échéance) — distincte de reminders (déclenchement ponctuel unique) et de user_memory (faits contextuels). due_at en timestamptz (instant normalisé, jamais une chaîne libre comme dans DossierTask.deadline/ LiveActionItem.deadline côté client) — l'affichage en heure locale reste la responsabilité du client.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `title` | text | non |  |  |
| `description` | text | oui |  |  |
| `status` | text | non | 'pending'::text | status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'ca… |
| `priority` | text | non | 'medium'::text | priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]) |
| `due_at` | timestamp with time zone | oui |  |  |
| `related_type` | text | oui |  |  |
| `related_id` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `depends_on_task_id` | uuid | oui |  |  |
| `recurrence_rule` | text | oui |  | recurrence_rule = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]) |
| `recurrence_parent_id` | uuid | oui |  |  |
| `recurrence_advanced` | boolean | non | false |  |

- Clé primaire : `id`
- Clé étrangère `tasks_depends_on_task_id_fkey` : (depends_on_task_id) → `public.tasks` (id)
- Clé étrangère `tasks_recurrence_parent_id_fkey` : (recurrence_parent_id) → `public.tasks` (id)
- Clé étrangère `tasks_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `tasks_priority_check` : `CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))`
- Contrainte `tasks_recurrence_rule_check` : `CHECK ((recurrence_rule = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])))`
- Contrainte `tasks_status_check` : `CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `tasks_delete_own` | DELETE | {public} | PERMISSIVE |
| `tasks_insert_own` | INSERT | {public} | PERMISSIVE |
| `tasks_select_own` | SELECT | {public} | PERMISSIVE |
| `tasks_update_own` | UPDATE | {public} | PERMISSIVE |

- Déclencheur `trg_tasks_updated_at` : `CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Déclencheur `trg_validate_task_dependency` : `CREATE TRIGGER trg_validate_task_dependency BEFORE INSERT OR UPDATE OF depends_on_task_id ON public.tasks FOR EACH ROW EXECUTE FUNCTION validate_task_dependency…`
- Index (4) : `tasks_depends_on_idx`, `tasks_pkey`, `tasks_recurrence_parent_idx`, `tasks_user_status_idx`

### `invite_codes`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | uuid | non |  |  |
| `code` | text | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `user_id`
- Clé étrangère `invite_codes_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `invite_codes_code_key` : `UNIQUE (code)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `invite_codes_select_own` | SELECT | {public} | PERMISSIVE |
- Index (2) : `invite_codes_code_key`, `invite_codes_pkey`

### `invitations`

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `inviter_id` | uuid | non |  |  |
| `invited_user_id` | uuid | non |  |  |
| `code_used` | text | non |  |  |
| `accepted_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `invitations_invited_user_id_fkey` : (invited_user_id) → `public.profiles` (id)
- Clé étrangère `invitations_inviter_id_fkey` : (inviter_id) → `public.profiles` (id)
- Contrainte `invitations_invited_user_id_key` : `UNIQUE (invited_user_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `invitations_select_involved` | SELECT | {public} | PERMISSIVE |
- Index (2) : `invitations_invited_user_id_key`, `invitations_pkey`

### `push_subscriptions`

> Abonnements Web Push (un par navigateur/appareil). Écrits par save_push_subscription (un endpoint appartient toujours au DERNIER compte connecté sur cet appareil). Lus par l'Edge Function push-notify (service_role).

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `endpoint` | text | non |  |  |
| `p256dh` | text | non |  |  |
| `auth` | text | non |  |  |
| `user_agent` | text | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |
| `last_seen_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `push_subscriptions_user_id_fkey` : (user_id) → `public.profiles` (id)
- Contrainte `push_subscriptions_endpoint_key` : `UNIQUE (endpoint)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `push_subscriptions_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `push_subscriptions_select_own` | SELECT | {authenticated} | PERMISSIVE |

- Déclencheur `push_subscriptions_set_updated_at` : `CREATE TRIGGER push_subscriptions_set_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
- Index (3) : `push_subscriptions_endpoint_key`, `push_subscriptions_pkey`, `push_subscriptions_user_id_idx`

### `push_vapid_config`

> Clé publique VAPID (lisible via get_push_public_key) + référence Vault de la clé privée (jamais en clair ici). Aucune policy : service_role uniquement.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | text | non | 'default'::text |  |
| `public_key` | text | non |  |  |
| `subject` | text | non |  |  |
| `vault_secret_id` | uuid | non |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Index (1) : `push_vapid_config_pkey`

### `push_delivery_log`

> Journal des notifications push (Web Push) envoyées par la fonction Edge push-notify : une ligne par abonnement ciblé, avec le statut HTTP réel du service de push.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `sender_id` | uuid | oui |  |  |
| `topic` | text | non |  |  |
| `call_id` | text | oui |  |  |
| `endpoint_host` | text | oui |  |  |
| `status_code` | integer | oui |  |  |
| `ok` | boolean | non | false |  |
| `error` | text | oui |  |  |
| `duration_ms` | integer | oui |  |  |
| `created_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `push_delivery_log_sender_id_fkey` : (sender_id) → `public.profiles` (id)
- Clé étrangère `push_delivery_log_user_id_fkey` : (user_id) → `public.profiles` (id)
- Index (2) : `push_delivery_log_pkey`, `push_delivery_log_user_created_idx`

### `call_diagnostics`

> AU-7 : journal technique d'un appel vu depuis un appareil (aucun contenu audio, jetons et IP locales épurés côté client). Propriétaire ou admin en lecture.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `user_id` | uuid | non |  |  |
| `call_id` | text | non |  |  |
| `device_id` | text | non |  |  |
| `conversation_id` | uuid | oui |  |  |
| `role` | text | non |  | role = ANY (ARRAY['appelant'::text, 'appelé'::text]) |
| `outcome` | text | non | 'en cours'::text |  |
| `device` | jsonb | non | '{}'::jsonb |  |
| `events` | jsonb | non | '[]'::jsonb | pg_column_size(events) <= 200000 |
| `created_at` | timestamp with time zone | non | now() |  |
| `updated_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `call_diagnostics_user_id_fkey` : (user_id) → `auth.users` (id)
- Contrainte `call_diagnostics_events_size` : `CHECK ((pg_column_size(events) <= 200000))`
- Contrainte `call_diagnostics_role_check` : `CHECK ((role = ANY (ARRAY['appelant'::text, 'appelé'::text])))`
- Contrainte `call_diagnostics_unique_per_device` : `UNIQUE (user_id, call_id, device_id)`

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `call_diagnostics_delete_own` | DELETE | {authenticated} | PERMISSIVE |
| `call_diagnostics_insert_own` | INSERT | {authenticated} | PERMISSIVE |
| `call_diagnostics_select_own_or_admin` | SELECT | {authenticated} | PERMISSIVE |
| `call_diagnostics_update_own` | UPDATE | {authenticated} | PERMISSIVE |
- Index (4) : `call_diagnostics_call_idx`, `call_diagnostics_pkey`, `call_diagnostics_unique_per_device`, `call_diagnostics_user_created_idx`

### `live_transcript_lines`

> LP-7 — parole du direct transcrite une seule fois, gardée uniquement si l'animateur a activé l'enregistrement (live_sessions.is_recording_enabled). Append-only, purgée 30 jours après la fin du direct.

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `session_id` | uuid | non |  |  |
| `speaker_id` | uuid | oui |  |  |
| `speaker_name` | text | oui |  |  |
| `text` | text | non |  |  |
| `language` | text | oui |  |  |
| `spoken_at` | timestamp with time zone | non | now() |  |

- Clé primaire : `id`
- Clé étrangère `live_transcript_lines_session_id_fkey` : (session_id) → `public.live_sessions` (id)
- Clé étrangère `live_transcript_lines_speaker_id_fkey` : (speaker_id) → `public.profiles` (id)

| Politique RLS | Commande | Rôles | Type |
| :--- | :--- | :--- | :--- |
| `live_transcript_lines_insert_own` | INSERT | {public} | PERMISSIVE |
| `live_transcript_lines_select` | SELECT | {public} | PERMISSIVE |
- Index (2) : `live_transcript_lines_pkey`, `live_transcript_lines_session_idx`

### `health_snapshots`

> Sauvegarde prise avant chaque réparation de santé, et seule source de la restauration. Contient de vraies données applicatives : jamais lisible hors service_role, purgeable par health_purge_snapshots().

| Colonne | Type | Nul | Défaut | Contrainte |
| :--- | :--- | :---: | :--- | :--- |
| `id` | uuid | non | gen_random_uuid() |  |
| `remediation_id` | text | non |  |  |
| `line_id` | text | non |  |  |
| `actor_id` | uuid | oui |  |  |
| `kind` | text | non |  | kind = ANY (ARRAY['delete'::text, 'update'::text, 'revoke_execute'::text, 'revok… |
| `payload` | jsonb | non | '{}'::jsonb | pg_column_size(payload) <= 8000000 |
| `restore_order` | ARRAY | non | '{}'::text[] |  |
| `row_count` | integer | non | 0 |  |
| `created_at` | timestamp with time zone | non | now() |  |
| `restored_at` | timestamp with time zone | oui |  |  |
| `restored_by` | uuid | oui |  |  |

- Clé primaire : `id`
- Clé étrangère `health_snapshots_actor_id_fkey` : (actor_id) → `auth.users` (id)
- Clé étrangère `health_snapshots_restored_by_fkey` : (restored_by) → `auth.users` (id)
- Contrainte `health_snapshots_kind_check` : `CHECK ((kind = ANY (ARRAY['delete'::text, 'update'::text, 'revoke_execute'::text, 'revoke_select_anon'::text])))`
- Contrainte `health_snapshots_payload_size` : `CHECK ((pg_column_size(payload) <= 8000000))`
- Index (3) : `health_snapshots_created_idx`, `health_snapshots_line_idx`, `health_snapshots_pkey`

## Politiques RLS du stockage (`storage.objects`)

| Politique | Table | Commande | Rôles |
| :--- | :--- | :--- | :--- |
| `private_bucket_owner_only` | objects | ALL | {authenticated} |
| `public_bucket_delete_own_folder` | objects | DELETE | {authenticated} |
| `public_bucket_read_anyone` | objects | SELECT | {public} |
| `public_bucket_update_own_folder` | objects | UPDATE | {authenticated} |
| `public_bucket_write_own_folder` | objects | INSERT | {authenticated} |

## Fonctions (`public`)

| Fonction | Genre | Sécurité | Droits d'exécution |
| :--- | :--- | :--- | :--- |
| `accept_invitation(p_code text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `admin_consume_rate_limit(p_actor_id uuid, p_limit integer)` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `are_users_blocked(p_user_a uuid, p_user_b uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `award_xp_and_credits(p_user_id uuid, p_xp_delta integer, p_credits_delta numeric)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `can_access_dossier(p_dossier_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `can_message_user(p_sender uuid, p_recipient uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `can_send_friend_request(p_requester uuid, p_addressee uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `can_view_live_session(p_session_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `can_view_network_post(p_author uuid, p_viewer uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `can_write_dossier(p_dossier_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `close_zombie_live_sessions()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `create_conversation(p_member_ids uuid[], p_title text, p_is_group boolean)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `discover_profiles(term text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `enroll_creator_as_participant()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `fire_due_reminders()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `generate_recurring_task_instances()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `get_agent_tools(p_agent_id text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_ai_provider_secret_internal(p_provider_id text)` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `get_ai_provider_status()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_ai_spend()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_content_author_profiles(p_author_ids uuid[])` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_live_transport_config_internal(p_environment text)` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `get_mutual_friends_count(p_user_a uuid, p_user_b uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_my_conversation_participant_profiles()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_my_growth_stats()` | fonction | SECURITY INVOKER | {postgres=X,authenticated=X,service_role=X} |
| `get_my_invitations()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_or_create_invite_code()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_public_profiles(p_user_ids uuid[])` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_push_public_key()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_push_vapid_internal()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `get_ranked_ai_candidates(p_category text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_tool_matrix()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `get_wallet_balance(p_user_id uuid, p_currency text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `handle_follow_change()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `handle_new_user()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `health_apply_remediation(p_remediation_id text, p_line_id text)` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_diagnose_remediation(p_remediation_id text)` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_journal(p_limit integer)` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_my_rank()` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_probe_catalogue()` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_probe_data()` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_probe_operations()` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_purge_snapshots(p_older_than_days integer)` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_remediation_catalogue()` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `health_remediation_spec(p_remediation_id text)` | fonction | SECURITY INVOKER | {postgres=X,service_role=X} |
| `health_require_admin()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `health_require_general_admin()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `health_restore_snapshot(p_snapshot_id uuid)` | fonction | SECURITY DEFINER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `increment_post_shares(p_post_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `insert_wallet_transaction(p_type text, p_amount numeric, p_currency text, p_reference text…` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `invite_to_live_session(p_session_id uuid, p_invitee_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `is_admin()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `is_live_host(p_session_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `is_live_moderator_or_host(p_session_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `mark_conversation_read(p_conversation_id uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `notify_comment_event()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `notify_follow_event()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `notify_friendship_event()` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `notify_live_started()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `notify_message_event()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `notify_missed_call(p_callee uuid)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `post_live_agent_message(p_session_id uuid, p_agent_id text, p_text text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `protect_profile_sensitive_columns()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `publish_scheduled_posts()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `purge_expired_live_transcripts()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `search_profiles_minimal(term text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `search_universal(term text)` | fonction | SECURITY INVOKER | {postgres=X,authenticated=X,service_role=X} |
| `send_daily_digest()` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `set_agent_tool_enabled(p_agent_id text, p_tool_id text, p_enabled boolean)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_ai_budget(p_daily_cap numeric, p_monthly_cap numeric, p_enforced boolean)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_ai_provider_enabled(p_provider_id text, p_enabled boolean)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_ai_provider_priority(p_provider_id text, p_priority integer)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_ai_provider_secret(p_provider_id text, p_secret text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_model_costs(p_provider_id text, p_model_id text, p_input numeric, p_output numeric)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_provider_adapter_config(p_provider_id text, p_config jsonb)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_provider_cost_tier(p_provider_id text, p_tier text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_tool_enabled(p_tool_id text, p_enabled boolean)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `set_updated_at()` | fonction | SECURITY INVOKER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |
| `store_push_vapid_internal(p_public_key text, p_private_jwk text, p_subject text)` | fonction | SECURITY DEFINER | {postgres=X,service_role=X} |
| `toggle_message_reaction(p_message_id uuid, p_emoji text)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `update_my_profile(p_changes jsonb)` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `upsert_discovered_provider(p_id text, p_category text, p_display_name text, p_source_url t…` | fonction | SECURITY DEFINER | {postgres=X,authenticated=X,service_role=X} |
| `validate_task_dependency()` | fonction | SECURITY INVOKER | {=X,postgres=X,anon=X,authenticated=X,service_role=X} |

Définitions complètes : `releve/functions.json` (champ `def`, `pg_get_functiondef`).

## Fonctions (`private`)

- `private.is_conversation_member` — CREATE OR REPLACE FUNCTION private.is_conversation_member(p_conversation_id uuid, p_user_id uuid DEFAULT auth.uid()) RETURNS boolean
- `private.touch_conversation_from_message` — CREATE OR REPLACE FUNCTION private.touch_conversation_from_message() RETURNS trigger

## Vues et énumérations

- Vue `ai_spend_by_provider` : `SELECT (date_trunc('day'::text, created_at))::date AS jour, provider_id, count(*) FILTER (WHERE (status = 'success'::text)) AS appels_reussis, count(*) FILTER (WHERE (status = 'error'::text)) AS appel…`

## Déclencheur sur `auth.users`

- `trg_on_auth_user_created` : `CREATE TRIGGER trg_on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()`

## Tâches planifiées (pg_cron)

| Tâche | Planification | Commande | Active |
| :--- | :--- | :--- | :---: |
| `close-zombie-live-sessions` | `15 * * * *` | `select public.close_zombie_live_sessions();` | oui |
| `fire-due-reminders` | `*/5 * * * *` | `select public.fire_due_reminders();` | oui |
| `generate-recurring-tasks` | `*/5 * * * *` | `select public.generate_recurring_task_instances();` | oui |
| `publish-scheduled-posts` | `*/5 * * * *` | `select public.publish_scheduled_posts();` | oui |
| `purge-expired-live-transcripts` | `30 3 * * *` | `select public.purge_expired_live_transcripts();` | oui |
| `send-daily-digest` | `0 8 * * *` | `select public.send_daily_digest();` | oui |

## Buckets de stockage

| Bucket | Public | Créé par migration |
| :--- | :---: | :---: |
| `mok bouker` | non | **non** (complément) |
| `private` | non | oui |
| `public` | oui | oui |

## Temps réel (publication `supabase_realtime`)

`public.live_messages`, `public.live_poll_votes`, `public.live_questions`, `public.live_reactions`, `public.live_sessions`, `public.live_solidarity_causes`, `public.live_solidarity_proofs`, `public.live_solidarity_updates`, `public.live_speakers`, `public.live_whiteboard_strokes`, `public.messages`, `public.notifications`, `public.tasks`, `public.user_memory`

## Extensions installées

| Extension | Version / schéma | Créée par une migration |
| :--- | :--- | :---: |
| `pg_cron` | 1.6.4 in pg_catalog | **non** (prerequis.sql) |
| `pg_graphql` | 1.5.11 in graphql | **non** (prerequis.sql) |
| `pg_stat_statements` | 1.11 in extensions | **non** (prerequis.sql) |
| `pgcrypto` | 1.3 in extensions | **non** (prerequis.sql) |
| `plpgsql` | 1.0 in pg_catalog | **non** (prerequis.sql) |
| `supabase_vault` | 0.3.1 in vault | **non** (prerequis.sql) |
| `unaccent` | 1.1 in extensions | oui |
| `uuid-ossp` | 1.1 in extensions | **non** (prerequis.sql) |
| `wrappers` | 0.5.6 in extensions | **non** (prerequis.sql) |

## Coffre (`vault.secrets`) — noms seulement

| Nom | Description | Recréé par |
| :--- | :--- | :--- |
| `ai_provider:anthropic` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:deepgram` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:deepseek` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:elevenlabs` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:gemini` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:heygen` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:ideogram` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:kimi` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:kling` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:openai` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:openrouter` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:runway` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `ai_provider:veo` | Clé API orchestrateur IA | Super Admin → Connecteurs & Modèles IA |
| `live_transport_dev_livekit` |  | étape LiveKit de l'assistant |
| `livekit-production-secret` |  | étape LiveKit de l'assistant |
| `push_vapid_private_20260901203540160` | Clé privée VAPID (Web Push) — générée par push-notify, jamais exposée | automatique (fonction Edge push-notify) |

## Schémas et privilèges par défaut

Schémas présents : `auth`, `cron`, `extensions`, `graphql`, `graphql_public`, `pgbouncer`, `private`, `public`, `realtime`, `storage`, `supabase_migrations`, `vault`.

- postgres in public : `f {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`
- postgres in public : `r {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`
- postgres in public : `S {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}`
- postgres in storage : `r {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}`
- postgres in storage : `f {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`
- postgres in storage : `S {postgres=rwU/postgres,anon=rwU/postgres,authenticated=rwU/postgres,service_role=rwU/postgres}`
- supabase_admin in public : `S {postgres=rwU/supabase_admin,anon=rwU/supabase_admin,authenticated=rwU/supabase_admin,service_role=rwU/supabase_admin}`
- supabase_admin in public : `r {postgres=arwdDxtm/supabase_admin,anon=arwdDxtm/supabase_admin,authenticated=arwdDxtm/supabase_admin,service_role=arwdDxtm/supabase_admin}`
- supabase_admin in public : `f {postgres=X/supabase_admin,anon=X/supabase_admin,authenticated=X/supabase_admin,service_role=X/supabase_admin}`

## Commentaires de colonnes

- `ai_providers.adapter_config` : Configuration interprétée par l'adaptateur générique (generic_http) : méthode, endpoint, headers, forme de requête/réponse. Générée par auto-découverte ou éditée par un admin.
- `ai_providers.auth_method` : Méthode d'authentification détectée par l'auto-découverte. Seul api_key est géré de bout en bout par generic_http.ts ; oauth2/webhook/mcp nécessitent une clé/jeton statique fourni manuellement par l'a…
- `ai_providers.missing_fields` : Liste de champs que l'auto-découverte n'a pas pu déterminer avec confiance (ex. chemin exact de la réponse) ; affichés comme un mini-formulaire à l'admin tant que non résolus.
- `live_sessions.featured_agent_id` : EX-5 — expert actuellement mis en avant sur la scène (première carte, jamais relégué au débordement). NULL = personne en avant. Écriture réservée à l'animateur par live_sessions_update_host ; lu par t…
- `live_sessions.visual_universe` : Univers visuel actif (prompt 3/7) : crystal (référence, Glassmorphism Crystal Water), futuristic_blue, natural_fresh, violet_luxe, deep_ocean. Modifiable par l'hôte uniquement (live_sessions_update_ho…
- `live_solidarity_causes.organizer_fee_percent` : Politique de frais d'organisation — configurable par l'administration (spec : ex. 5-10%, jamais un taux inventé librement), affichée avant le don. Défaut 0 tant qu'aucune UI d'administration ne le con…
- `live_solidarity_causes.visibility` : Niveau de visibilité basique (LOOP 14/16) : "live_participants" (défaut) = visible par quiconque peut voir la session LIVE ; "organizer_only" = strictement privé, seul l'organisateur (et l'admin) peut…
- `posts.client_post_id` : Ancre d'idempotence de la file de synchronisation hors-ligne de l'Architecte : identifiant UUID de la tâche, généré une seule fois côté client et réutilisé à chaque rejeu. Renseigné uniquement par le …
- `posts.format` : Propriété du contenu (moteur de contenu unifié) — indique quels champs média sont pertinents, ne détermine pas une architecture séparée. Ne remplace pas public.stories.
- `posts.scheduled_at` : Horodatage de publication différée quand status='scheduled'. Aucun job serveur ne fait encore basculer status automatiquement (voir LOOP 15/17).
- `posts.source_id` : Référence polymorphe vers l'objet source (table dépendant de source_type, pas de contrainte FK stricte).
- `posts.source_type` : Provenance du contenu quand il est dérivé d'un autre objet MOCnet (ex. 'live_session'). NULL = création directe. Consommé à partir de LOOP 03/17.
- `posts.status` : Cycle de vie du contenu (moteur de contenu unifié, LOOP 01/17). draft = jamais visible publiquement quel que soit visibility ; published = visible selon visibility (comportement historique, valeur par…
- `profile_badges.source_id` : Même principe que profile_skills.source_id — voir ce commentaire.
- `profile_skills.source_id` : Pointeur polymorphe optionnel vers la ligne d'origine (ex. enrollments.id si source_type=course_completion, certificates.id si source_type=certificate). Pas de FK — la table cible dépend de source_typ…
- `profiles.preferred_language` : Langue choisie par le membre (« Ma langue », messagerie). NULL = « Par défaut » : aucune traduction, on lit et on entend l'original. Un code ISO 639-1 = traduction du texte, des vocaux et des appels v…

