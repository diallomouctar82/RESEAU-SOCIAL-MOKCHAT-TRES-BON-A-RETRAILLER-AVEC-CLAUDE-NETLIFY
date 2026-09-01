# 🤝 MODULE 05 — RÉSEAU MOK & SOCIAL LIVE
> **Réseau de Confiance Décentralisé, Mok Trust, Feed Communautaire, Reels & Live Streaming B2B/B2C**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Restaurer la confiance dans les interactions humaines et commerciales grâce à un réseau social éthique, centré sur l'entraide, le partage de compétences et la réputation vérifiée.
- **Objectif** : Permettre aux membres d'échanger des contenus instructifs (Reels/Stories), de diffuser des sessions interactives en direct (Social Live) et de nouer des partenariats fiables évalués par le score Mok Trust.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Citoyens du réseau, créateurs de contenus, experts, commerçants diffusant des démonstrations en direct.
- **Parcours Type** :
  1. Consultation du fil d'actualités et visionnage de Reels éducatifs ou de produits.
  2. Participation à un Live Stream avec possibilité d'interagir par chat, d'envoyer des dons/cadeaux ou d'acheter en un clic un article présenté.
  3. Évaluation réciproque de confiance sur le Mok Trust Center.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/SocialFeed.tsx` : Fil d'actualité relié à Supabase (`community_posts`), annuaire des membres avec recherche plein texte, modal de publication avec identité certifiée de l'auteur.
  - `components/MemberProfileModal.tsx` : Consultation exhaustive du profil citoyen (bio, compétences, réputation, coordonnées et déclenchement de message privé).
  - `components/MoocChatFloating.tsx` : Messagerie privée directe persistée et connectée en temps réel à Supabase (`conversations`, `conversation_participants`, `messages` — réécrite au LOOP 06/17, mission Architecte MOCnet, contre le vrai schéma ; les noms `chat_conversations`/`chat_messages` d'une version antérieure de cette fiche n'ont jamais existé en base). Résumé de conversation et traduction de message par IA ajoutés au LOOP 07/17 (langue d'origine toujours conservée, jamais un remplacement silencieux).
  - `components/chat/ChatMessageItem.tsx` : Rendu riche des bulles de messages (textes, photos, vidéos, documents téléchargeables, messages vocaux avec lecteur waveform HD, réactions emoji réellement persistées, citations). L'épinglage affiché dans l'UI n'est pas câblé à une donnée réelle (aucune colonne `is_pinned` sur `messages`) — non fonctionnel.
  - `components/chat/ChatCallModal.tsx` : Modal d'appel avec signalisation réelle (sonnerie/acceptation/refus via Supabase Broadcast) — **le transport audio/vidéo entre les deux personnes n'est pas implémenté** (capture uniquement la caméra locale de l'appelant, aucune connexion pair-à-pair) ; ne pas présenter comme un appel fonctionnel de bout en bout.
  - `components/chat/ChatMemberInfoModal.tsx` : Fiche détaillée de l'interlocuteur et contrôle de confidentialité. L'« empreinte de chiffrement SHA256-AES » affichée avant le LOOP 07/17 était une chaîne fixe jamais réellement calculée — retirée (aucun chiffrement de bout en bout n'est implémenté).
  - `components/chat/ChatReportModal.tsx` : Modal de signalement d'abus et fraude reliée directement au centre de modération Super-Admin (`adminConfigService`).
  - `components/Settings.tsx` & `Profile.tsx` : Gestion et affichage du passeport citoyen, bio, localisation, téléphone et portfolio.
  - `components/SocialLive.tsx` & `LiveCreationModal.tsx` : Espace Live Intelligent haute résilience (zéro écran blanc), streaming vidéo/audio réel avec bascule gracieuse, sélection de Copilotes IA Diallo OS, sous-titres bilingues, protection des données sensibles (vision IA), dock d'actions intelligentes (`LiveSmartActionBar`), salle d'attente technique (`LiveWaitingRoomModal`), tableau blanc collaboratif (`LiveWhiteboard`) et synthèse post-live téléchargeable (`LivePostContinuityModal`).
  - `components/SmartReelViewer.tsx` & `ReelsCreator.tsx` : Lecteur et créateur de courtes vidéos.
  - `components/MokTrustCenter.tsx` & `MokTrustReputationHub.tsx` : Console de réputation et d'intégrité.
- **Modèles de Données & Tables Supabase réelles (`types.ts`, `docs/SUPABASE_ARCHITECTURE.md`)** :
  - Tables : `profiles`, `posts`, `comments`, `post_reactions`, `friendships`, `follows`, `user_blocks`, `conversations`, `conversation_participants`, `messages` (pas de table `chat_call_logs` — aucun historique d'appel n'est persisté).
  - Types : `UserProfile`, `ChatConversation`, `ChatMessage`, `ActiveCallSession`, `Post`, `LiveStream`, `Story`, `Reel`, `LiveGift`, `LeaderboardUser`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Identité Réelle & Transparence** : Aucune publication anonyme ou factice ; chaque post et message est signé avec le nom, l'avatar, le titre et l'identifiant citoyen unique de l'utilisateur connecté.
- **Modération & Détection des Fraudes** : Mok Trust pénalise les comportements malveillants ou les fausses annonces. Tout message abusif peut être immédiatement signalé via `ChatReportModal` et transmis dans la console de modération Super-Admin (`adminConfigService.addUserReport`).
- **Sécurité des Échanges** : RLS (Row Level Security) restreint chaque conversation à ses seuls membres (`is_conversation_member`), et l'envoi de message respecte le blocage (`are_users_blocked`) et le réglage « qui peut m'écrire » du destinataire (`can_message_user`, LOOP 07/17). La signalisation d'appel transite par l'API Supabase (HTTPS/WSS standard) — **aucun chiffrement de bout en bout n'est implémenté** pour le contenu des messages ou un éventuel flux média, à ne jamais présenter comme acquis.
- **Gestion des Dons & Achats en Direct** : Débit instantané et sécurisé via le solde de Crédits ou le Wallet.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** :
  - Système complet d'identité unique et profils personnalisables synchronisés Supabase / Local.
  - Fil d'actualité persistant avec identité réelle de l'auteur, réactions et commentaires.
  - Annuaire des membres avec moteur de recherche en temps réel et fiches profils.
  - Messagerie privée en temps réel (Supabase Realtime + envoi de médias/messages vocaux + réactions + réponses + résumé et traduction par IA + modération/signalement Super-Admin). **Correctif production du 1er septembre 2026** : les identifiants de conversations locales (`chat-…`/`local-…`) restent dans le mode local et sont désormais bloqués avant les API Supabase typées UUID; les conversations réelles conservent intégralement leur historique et leurs abonnements Realtime. **Restant** : appels audio/vidéo (signalisation réelle, transport pair-à-pair non implémenté), upload Storage réel des pièces jointes (encore en base64) — voir `docs/SUPABASE_ARCHITECTURE.md` (ligne Messagerie) pour le détail exact vérifié.
  - Feed social, Stories, Lecteur de Reels avec produits liés.
  - **Espace Live Intelligent 100% Opérationnel** : Création instantanée et programmation sans écran blanc, streaming WebRTC/Hardware résilient, sous-titrage bilingue en temps réel, copilotes IA Diallo OS, tableau blanc interactif, intégration des actions d'apprentissage/projet et compte-rendu post-session.
- **Évolutions Prévues** : Cercles d'entraide régionaux et tribus thématiques privées.
