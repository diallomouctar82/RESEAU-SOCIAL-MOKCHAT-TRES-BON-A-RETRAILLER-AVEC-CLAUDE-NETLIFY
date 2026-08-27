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
  - `components/SocialFeed.tsx` : Fil d'actualité, publications, stories.
  - `components/SocialLive.tsx` & `LiveSession.tsx` : Salle de streaming en direct.
  - `components/SmartReelViewer.tsx` & `ReelsCreator.tsx` : Lecteur et créateur de courtes vidéos.
  - `components/MokTrustCenter.tsx` & `MokTrustReputationHub.tsx` : Console de réputation et d'intégrité.
- **Modèles de Données (`types.ts`)** :
  - `Post`, `LiveStream`, `Story`, `Reel`, `LiveGift`, `LeaderboardUser`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Modération & Détection des Fraudes** : Mok Trust pénalise les comportements malveillants ou les fausses annonces.
- **Gestion des Dons & Achats en Direct** : Débit instantané et sécurisé via le solde de Crédits ou le Wallet.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Feed social, Stories, Lecteur de Reels avec produits liés, Live Streams interactifs avec cadeaux.
- **Partiel / En cours** : Diffusion vidéo WebRTC peer-to-peer en temps réel.
- **Évolutions Prévues** : Cercles d'entraide régionaux et tribus thématiques privées.
