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
  - `components/MoocChatFloating.tsx` : Messagerie privée directe persistée et connectée en temps réel à Supabase (`chat_conversations`, `chat_messages`) avec fallback local gracieux et orchestration complète des échanges.
  - `components/chat/ChatMessageItem.tsx` : Rendu riche des bulles de messages (textes, photos, vidéos, documents téléchargeables, messages vocaux avec lecteur waveform HD, réactions emoji, citations et accusés de lecture).
  - `components/chat/ChatCallModal.tsx` : Modal immersive d'appels vocaux et vidéo avec flux média réels, partage d'écran, mute, plein écran et signalisation WebRTC.
  - `components/chat/ChatMemberInfoModal.tsx` : Fiche détaillée de l'interlocuteur, badges de vérification KYC, empreinte de chiffrement SHA256-AES et contrôle de confidentialité.
  - `components/chat/ChatReportModal.tsx` : Modal de signalement d'abus et fraude reliée directement au centre de modération Super-Admin (`adminConfigService`).
  - `components/Settings.tsx` & `Profile.tsx` : Gestion et affichage du passeport citoyen, bio, localisation, téléphone et portfolio.
  - `components/SocialLive.tsx` & `LiveCreationModal.tsx` : Espace Live Intelligent haute résilience (zéro écran blanc), streaming vidéo/audio réel avec bascule gracieuse, sélection de Copilotes IA Diallo OS, sous-titres bilingues, protection des données sensibles (vision IA), dock d'actions intelligentes (`LiveSmartActionBar`), salle d'attente technique (`LiveWaitingRoomModal`), tableau blanc collaboratif (`LiveWhiteboard`) et synthèse post-live téléchargeable (`LivePostContinuityModal`).
  - `components/SmartReelViewer.tsx` & `ReelsCreator.tsx` : Lecteur et créateur de courtes vidéos.
  - `components/MokTrustCenter.tsx` & `MokTrustReputationHub.tsx` : Console de réputation et d'intégrité.
- **Modèles de Données & Tables Supabase (`types.ts`, `docs/supabase_schema.sql`)** :
  - Tables : `profiles`, `community_posts`, `post_comments`, `chat_conversations`, `chat_messages`, `chat_call_logs`.
  - Types : `UserProfile`, `ChatConversation`, `ChatMessage`, `ActiveCallSession`, `Post`, `LiveStream`, `Story`, `Reel`, `LiveGift`, `LeaderboardUser`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Identité Réelle & Transparence** : Aucune publication anonyme ou factice ; chaque post et message est signé avec le nom, l'avatar, le titre et l'identifiant citoyen unique de l'utilisateur connecté.
- **Modération & Détection des Fraudes** : Mok Trust pénalise les comportements malveillants ou les fausses annonces. Tout message abusif peut être immédiatement signalé via `ChatReportModal` et transmis dans la console de modération Super-Admin (`adminConfigService.addUserReport`).
- **Sécurité des Échanges & Chiffrement** : RLS (Row Level Security) protège les messages privés et les conversations. Les flux d'appels bénéficient d'une signalisation chiffrée.
- **Gestion des Dons & Achats en Direct** : Débit instantané et sécurisé via le solde de Crédits ou le Wallet.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** :
  - Système complet d'identité unique et profils personnalisables synchronisés Supabase / Local.
  - Fil d'actualité persistant avec identité réelle de l'auteur, réactions et commentaires.
  - Annuaire des membres avec moteur de recherche en temps réel et fiches profils.
  - Messagerie privée souveraine moderne en temps réel (Supabase Realtime + WebRTC Audio/Vidéo + Partage d'écran + Médias + Lecteur Vocal Waveform HD + Modération Super-Admin).
  - Feed social, Stories, Lecteur de Reels avec produits liés.
  - **Espace Live Intelligent 100% Opérationnel** : Création instantanée et programmation sans écran blanc, streaming WebRTC/Hardware résilient, sous-titrage bilingue en temps réel, copilotes IA Diallo OS, tableau blanc interactif, intégration des actions d'apprentissage/projet et compte-rendu post-session.
- **Évolutions Prévues** : Cercles d'entraide régionaux et tribus thématiques privées.
