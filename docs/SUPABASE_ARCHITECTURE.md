# 🗄️ ARCHITECTURE SUPABASE — LE MONDE À VOUS

> Socle backend (base de données, authentification, permissions, stockage, temps réel).
> Projet Supabase : **"monde a vous"** (`rqciahtpixdjbyoajomg`, région `eu-west-1`, Postgres 17).
> *Mise à jour : 27 août 2026 — migration complète Firebase → Supabase.*

---

## 1. Principe directeur

Toute l'app converge vers **une identité unique** : `auth.users` (Supabase Auth) + `public.profiles` (profil applicatif, 1:1). Chaque module métier référence `profiles.id`, jamais un identifiant local par module. RLS activé sur **toutes** les tables contenant des données utilisateur.

**Périmètre de cette mission** (décision explicite, voir section 4) : Identity, Social, Messagerie, Dossiers de vie, Carrière (scope réel), Éducation/Campus, Commerce minimal, Finance, Notifications, Fichiers, Live (intégral), catalogue Agents. **Hors périmètre** : Trade/Commerce Mondial (RFQ, CommercialDossier, salons, MokTrust — ~90 types), Tribus/Cercles riches — 0% de persistance prouvée dans le code au moment de la migration, laissés inchangés (écrans de démo) jusqu'à preuve de besoin produit réel.

---

## 2. Domaines et tables

| Domaine | Tables | Notes |
|---|---|---|
| **Identity** | `profiles`, `profile_skills`, `profile_badges` | `profiles.id` = `auth.users.id`. `role`/`credits`/`xp`/`level`/`next_level_xp` protégés en écriture (trigger, voir §5). |
| **Social** | `posts`, `post_documents`, `comments`, `post_reactions`, `stories` | Réactions UNIQUE(post_id, user_id). Commentaires self-FK (réponses imbriquées). |
| **Messagerie** | `conversations`, `conversation_participants`, `messages`, `agent_chat_sessions`, `agent_chat_messages` | `messages` en Realtime. Chat Expert IA enfin persisté (service `memoryService` existait côté code mais n'était jamais branché). |
| **Dossiers de vie** | `dossiers`, `dossier_steps`, `dossier_tasks`, `dossier_documents`, `dossier_deliverables`, `dossier_appointments`, `dossier_shares` | Domaine le mieux justifié par l'audit (CRUD réel préexistant). Partage explicite via `dossier_shares`. |
| **Carrière** | `career_goals`, `career_opportunities`, `career_opportunity_feedback`, `career_search_missions`, `master_resumes`, `career_snapshots` | Seuls Radar + CV Maître avaient un CRUD prouvé. `career_snapshots` (jsonb) reçoit les ~70 autres types Carrière (Boussole, simulations, journal...) sans normalisation forcée. |
| **Éducation / Campus** | `courses`, `enrollments`, `exam_sessions`, `certificates` | `enrollments` UNIQUE(user_id, course_id). Corrige un bug d'index de l'ancien code (`cloud.ts` indexait les certificats sur `studentName` au lieu d'un vrai `user_id`). |
| **Commerce (minimal)** | `shops`, `products`, `orders`, `order_items` | `orders`/`order_items` n'existaient pas du tout côté code — nécessaires pour que le panier devienne réel. |
| **Finance** | `wallet_transactions` | Solde **dérivé** (`get_wallet_balance()`), jamais stocké — évite toute désynchronisation. Écriture uniquement via `insert_wallet_transaction()` (RPC). |
| **Notifications** | `notifications` | Realtime activé. |
| **Fichiers** | `documents`, `document_shares` | Métadonnées uniquement ; fichiers réels dans Supabase Storage (§6). Digital Safe était un stub vide côté code (`cloudService.uploadFile` ne stockait rien) — première implémentation réelle. |
| **Live** | `live_sessions`, `live_speakers`, `live_attendance`, `live_questions` (+upvotes), `live_polls`(+options+votes), `live_agenda_items`, `live_decisions`, `live_action_items`, `live_documents`, `live_source_cards`, `live_products`, `live_personal_notes`, `gift_catalog`, `live_gifts_sent`, `live_replays`, `live_whiteboard_strokes` | Couverture intégrale de `SocialLive.tsx`/`LiveStream` (pas une version réduite — décision explicite, voir §4). |
| **Agents** | `agents` | Catalogue des 13 experts Diallo. Admin-managé, lecture publique. |

**Standards transverses** : `created_at`/`updated_at` (trigger `set_updated_at`), UUID (`gen_random_uuid()`), index sur toutes les FK, contraintes UNIQUE anti-doublons (réactions, participants, inscriptions, votes).

---

## 3. Rôles et permissions

`profiles.role` ∈ `user | admin | expert | mentor | moderator | organization | super_admin` (contrainte `check`). Seuls `user`/`admin` sont utilisés aujourd'hui ; les autres sont préparés pour les évolutions futures sans migration supplémentaire.

- **Bootstrap admin** : le trigger `handle_new_user()` attribue `role = 'admin'` uniquement si l'email correspond à l'admin historique (`visionsmart224@gmail.com`), sinon `'user'`. Cette logique vit **côté base**, plus jamais côté client.
- **Vérification** : fonction `is_admin()` (SECURITY DEFINER, lit `profiles.role` du user courant) — utilisée dans toutes les policies nécessitant un accès admin.
- **Colonnes protégées** : `role`, `credits`, `xp`, `level`, `next_level_xp` sur `profiles` ne peuvent être modifiées ni par un `UPDATE` client direct, ni par une policy RLS "own row" — un trigger `protect_profile_sensitive_columns` les restaure à leur valeur précédente sauf appel `service_role` ou RPC de confiance (voir `award_xp_and_credits`).

---

## 4. Décisions de périmètre (traçabilité)

1. **Auth + domaines déjà réels uniquement** (validé explicitement) : pas de normalisation de Trade/Commerce Mondial/MokTrust (0% persistance prouvée).
2. **Live intégral** (ajusté suite à une demande explicite en cours de mission) : contrairement au choix initial "minimal", tout `SocialLive.tsx` est couvert (questions, sondages, agenda, décisions, documents, cadeaux, présence, tableau blanc) — rien de ce qui existe déjà dans l'UI n'est laissé de côté.
3. **Tribus/Cercles** : hors périmètre (quasi aucune structure réelle dans le code — 1 tribu mock, `members` est un entier, pas une relation).

---

## 5. Fonctions RPC clés

| Fonction | Rôle |
|---|---|
| `is_admin()` | Vérifie si l'utilisateur courant est admin (utilisée dans les policies). |
| `can_view_live_session(id)` / `is_live_host(id)` | Visibilité et droits d'écriture sur une session Live. |
| `can_access_dossier(id)` / `can_write_dossier(id)` | Visibilité et droits d'écriture sur un dossier (propriétaire ou partage explicite). |
| `get_wallet_balance(user_id, currency)` | Solde dérivé (somme des transactions), avec vérification d'autorisation (soi-même ou admin). |
| `insert_wallet_transaction(...)` | Seule voie d'écriture dans `wallet_transactions` — vérifie le solde avant un débit. |
| `award_xp_and_credits(user_id, xp_delta, credits_delta)` | Seule voie légitime pour modifier `credits`/`xp`/`level` sur `profiles`. |

---

## 6. Storage

Deux buckets (pas un par écran) :
- **`public`** — avatars, images de posts/stories. Lecture publique, écriture restreinte au chemin `{domaine}/{user_id}/...` du propriétaire.
- **`private`** — documents, CV, pièces Carrière/Campus. Aucune URL publique permanente ; accès uniquement au propriétaire (policy Storage), le partage explicite (`document_shares`/`dossier_shares`) se fait par **signed URLs** générées côté app, jamais en élargissant la policy du bucket.

---

## 7. Realtime

Activé uniquement là où il apporte une vraie valeur (mission section 26) : `messages`, `notifications`, `live_questions`, `live_poll_votes`, `live_whiteboard_strokes`. Pas de Realtime généralisé à toutes les tables.

---

## 8. État des lieux avant/après

Avant cette mission : **aucun backend réel**. Authentification 100% simulée (mot de passe jamais vérifié, session falsifiable via `localStorage`), toutes les données en `localStorage`/IndexedDB/state React, un seul projet Supabase existant avec une table stub vide (`mok`, supprimée lors de cette migration).

Voir `docs/AUTHENTICATION.md` pour le détail du flux d'authentification et `docs/JOURNAL_DECISIONS.md` pour l'historique des décisions.
