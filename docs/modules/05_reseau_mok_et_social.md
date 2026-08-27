# Module 05 — Réseau Mok, MokChat et confiance

> État du code source au 27 août 2026. Ce document distingue les fonctions
> implémentées des validations qui exigent encore l’application des migrations et
> une recette sur l’environnement Supabase cible.

## Objectif

Le module fournit deux parcours authentifiés :

1. MokChat pour les conversations texte directes et de groupe ;
2. Réseau Mok pour le fil, les commentaires, les réactions, les stories et les
   reels publiés comme posts vidéo.

Les identités tierces sont toujours lues par les RPC publiques minimales. Le
client ne lit jamais directement les colonnes privées de `profiles`.

## Contrat Supabase canonique

Le code réutilise exclusivement les noms déjà présents dans le projet :

| Domaine | Tables / RPC |
|---|---|
| Conversations | `conversations`, `conversation_participants`, `messages`, `message_reactions` |
| Annuaire et présence | `search_public_profiles`, `get_public_profiles`, `user_presence`, `set_user_presence` |
| Réseau | `posts`, `comments`, `post_reactions`, `stories` |
| Confiance | `user_blocks`, `abuse_reports`, `mok_trust_findings`, `mok_trust_scores` |
| Calcul MokTrust | `record_mok_trust_finding`, `refresh_my_mok_trust_score` |
| Création de conversation | `create_conversation`, `mark_conversation_read` |
| Médias sociaux | bucket privé `social-media`, chemin `<user_uuid>/<content_uuid>/<file>` |

Les anciennes colonnes `participant1_id` / `participant2_id` et les tables
concurrentes `social_posts`, `post_comments` ou `conversation_members` ne sont
plus utilisées.

## MokChat — fonctions implémentées

- garde UUID avant toute écriture cloud ; aucun identifiant de mock ne peut être
  envoyé à PostgreSQL ;
- liste des conversations à partir de `conversation_participants` ;
- historique borné et paginé par `created_at`, trié côté serveur ;
- envoi texte optimiste avec états `pending`, `sending`, `sent`, `failed` et
  nouvelle tentative ;
- idempotence par UUID `client_message_id` et conflit
  `(sender_id, client_message_id)` ;
- conversations directes et groupes créés par la RPC `create_conversation` ;
- réactions persistées, épinglage, suppression logique et marquage de lecture ;
- annuaire par `search_public_profiles`, profils des participants par
  `get_public_profiles` ;
- présence initiale depuis `user_presence`, heartbeat, état absent/visible et
  mise à jour Realtime ;
- blocage/déblocage par `user_blocks` et signalement par `abuse_reports` ;
- cache local par utilisateur uniquement comme vue de secours hors ligne, jamais
  comme source cloud ni comme file d’écriture.

Fichiers principaux : `services/mokChat.ts`,
`components/MoocChatFloating.tsx`, `components/chat/ChatMessageItem.tsx`,
`components/chat/ChatReportModal.tsx`.

## Réseau Mok — fonctions implémentées

- pagination du fil `posts` et chargement groupé des commentaires/réactions ;
- création de posts, commentaires et réponses ;
- réaction unique par couple `(post_id, user_id)` avec upsert atomique ;
- auteurs chargés par `get_public_profiles`, sans email, rôle, crédits,
  téléphone ou paramètres privés ;
- stories expirant après 24 heures ;
- reels persistés comme posts vidéo et reconstruits depuis le fil cloud ;
- upload social avec liste MIME, limites de taille, nom de fichier généré,
  `upsert: false`, URL signée limitée à 24 heures et suppression de l’objet si
  l’écriture métier échoue ;
- révocation des URL `blob:` de prévisualisation ;
- mises à jour Realtime pour `posts`, `comments`, `post_reactions` et `stories` ;
- états explicites de chargement, vide, erreur, session absente et hors ligne ;
- signalement accessible avec catégorie/description et blocage facultatif de
  l’auteur, persistés côté backend.

Le chemin authentifié du fil ne fusionne plus `INITIAL_POSTS`, `MOCK_MEMBERS`,
`STORIES`, `REELS` ou `USER_PROFILE` avec les résultats Supabase.

Fichiers principaux : `services/socialNetwork.ts`,
`services/mediaStorage.ts`, `services/socialMediaPolicy.ts`,
`components/SocialFeed.tsx`, `components/MemberProfileModal.tsx`.

## MokTrust — calcul serveur implémenté

- score calculé dans PostgreSQL et persisté dans `mok_trust_scores` ;
- formule bornée et versionnée `community-v1`, fondée sur ancienneté,
  contributions et réactions reçues ;
- niveau de confiance distinct de la note ; en dessous du seuil, l’interface
  affiche « données insuffisantes » et masque le verdict numérique ;
- un blocage ou un signalement ouvert ne produit aucune pénalité ;
- seule une décision modérateur documentée et déclarée « fondée » par
  `record_mok_trust_finding` alimente l’ajustement de modération ;
- RLS : lecture du score et des décisions limitée au profil concerné ou à la
  modération, aucune écriture directe depuis le navigateur ;
- états chargement, erreur et hors ligne explicites, sans cache présenté comme
  une donnée serveur ;
- retrait du chemin actif qui affichait 98,6 %, de faux avis et de faux achats
  certifiés.

Cet indice est strictement communautaire. Il ne constitue ni KYC/KYB, ni
certification commerciale, ni garantie de paiement, livraison ou qualité.

Fichiers principaux : `services/mokTrust.ts`,
`components/MokTrustReputationHub.tsx`, `components/Shop.tsx`,
`supabase/migrations/20260827217000_mok_trust_server_score.sql`.

## Sécurité et limites de confiance

- La confidentialité dépend de la migration RLS versionnée : le client ne
  contourne jamais les policies et n’embarque aucune clé privilégiée.
- Les médias `social-media` sont privés et servis par URL signée ; une valeur de
  bucket arbitraire issue d’une ligne n’est pas suivie.
- Les labels KYC, empreintes de chiffrement et profils « vérifiés » non étayés ont
  été retirés des parcours modifiés.
- Un signalement enregistré n’est présenté que comme « en attente d’examen » ;
  l’interface ne prétend plus qu’un administrateur a déjà agi.

## Vérifications reproductibles

```bash
node --test tests/partial/mokchat-contract.test.mjs
node --test tests/partial/social-network-contract.test.mjs
node --test tests/partial/moktrust-contract.test.mjs
npx vitest run tests/unit/mokTrust.test.ts
npm run build
```

Résultat local du 27 août 2026 : 5/5 tests MokChat, 5/5 tests Réseau, 6/6 tests
MokTrust et build Vite réussis. Le contrôle TypeScript ciblé ne signale aucune
erreur dans les fichiers MokTrust. Le typecheck global du dépôt demeure non vert
à cause de modules hors de ce lot ; aucune validation E2E, application de
migration ni écriture de production n’a été effectuée.

## Hors périmètre de ce jalon

Conformément à la priorité « points partiels uniquement », ce lot ne termine ni
les pièces jointes durables MokChat, ni les appels WebRTC, ni le streaming live.
Les onglets Lives/Tribus historiques ne
constituent pas une preuve d’infrastructure live. Les abonnements et favoris ne
sont pas présentés comme synchronisés tant qu’un contrat backend n’existe pas.

## Recette encore requise

1. appliquer les migrations canoniques sur un environnement de test ;
2. vérifier deux comptes authentifiés : annuaire, conversation directe, groupe,
   RLS, réactions, blocage et signalement ;
3. vérifier posts public/network/private avec deux comptes ;
4. vérifier upload, lecture signée et expiration d’une story/reel ;
5. confirmer Realtime après ajout des tables à `supabase_realtime`.
6. appliquer la migration MokTrust sur un environnement de test puis vérifier un
   profil neuf, un profil établi et une décision modérateur fondée/dismissed.
