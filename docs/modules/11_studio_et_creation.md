# 🎨 MODULE 11 — STUDIO CRÉATIF, MULTIMODAL & CO-CRÉATION
> **Générateur de Contenus, Universal Creator, Suite de Co-Création & Outils Collaboratifs**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Doter chaque membre d'une agence de création multimédia et collaborative complète dans sa poche pour valoriser ses produits, ses cours, ses projets collectifs ou son profil professionnel.
- **Objectif** : Générer des scripts percutants, des visuels produits attractifs, des vidéos, analyser des images/documents via l'intelligence multimodale, et permettre la co-création de projets et d'articles en temps réel avec des cercles de discussion thématiques et le partage fluide de ressources créatives.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Vendeurs du Marché Mondial, formateurs Campus, créateurs de contenus, équipes de recherche, co-auteurs d'articles et projets.
- **Parcours Type** :
  1. **Génération Multimodale** : Création d'actifs (images, vidéos, analyses vision, scripts d'avatars 3D).
  2. **Partage Immédiat** : Envoi en 1 clic d'un actif généré vers la bibliothèque d'actifs collaboratifs partagés (`SharedStudioResource`).
  3. **Co-Création de Projets & Articles** : Lancement d'un espace de travail partagé avec statuts d'étapes (Brief, Rédaction, Révision, Prêt à publier), invitations de collaborateurs, tâches assignées et éditeur de contenu collaboratif.
  4. **Cercles de Discussion & Salons Vocaux** : Échanges contextualisés par projet ou thématique créative avec indicateurs de présence active et canaux de discussion.
  5. **Boîte à Idées & Retours** : Proposer, voter et débattre d'initiatives collaboratives pour la communauté.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/Studio.tsx` : Console centrale de création et point d'entrée vers la suite collaborative.
  - `components/StudioCollaboration.tsx` : Suite complète de collaboration (Co-projets & articles, Cercles d'échange, Bibliothèque partagée, Boîte à idées).
  - `components/UniversalCreator.tsx` : Moteur de génération multi-formats.
  - `components/VideoGenerator.tsx` : Assistant scénarisation et montage vidéo.
  - `components/Avatar3D.tsx` : Prévisualisation d'influenceurs et avatars 3D.
  - `components/studio/AvatarStudio.tsx` : **Studio Avatar** — parcours du membre Pro (accès → photo → consentement → nom → génération → aperçu).
  - `services/studio/avatarStudio.ts` : logique métier PURE du Studio Avatar (droit d'accès, validations, progression, génération de la persona, ordre de priorité d'affichage, révocation) — aucune dépendance React, réseau ou stockage.
  - `services/studio/avatarIdentity.ts` : source unique de vérité sur « cette URL d'avatar est-elle une vraie photo ? » (réexportée par `components/ui/InitialsAvatar.tsx`).
  - `components/admin/AdminDefaultAvatarCard.tsx` : réglage de l'Admin-Général — avatar par défaut de tous les nouveaux comptes.
  - `components/MultimodalCameraHUD.tsx` : Interface caméra temps réel.
  - `services/multimodalVision.ts` : Traitement d'images et OCR.
- **Modèles de Données (`types.ts`)** :
  - `StudioTab` : `'image' | 'video' | 'vision' | 'avatar' | 'avatar_studio' | 'collaboration'` (`avatar_studio` = onglet « Mon Avatar » ; `avatar` reste le catalogue d'influenceurs 3D existant).
  - `UserProfile.plan` : `'free' | 'pro'` — **optionnel**, l'absence vaut compte standard.
  - `UserProfile.privacySettings.avatarStudio` : avatar personnel persisté (photo, nom, consentement daté, salutation, guidage), dans la colonne réelle `profiles.privacy_settings`.
  - `PlatformDetailedModuleSettings.studio.defaultAvatar` : avatar par défaut de la plateforme.
  - `CoCreationProject` : Projets de co-rédaction et de co-création avec contributeurs, étapes et jalons.
  - `DiscussionCircle` : Cercles de discussion et d'échange créatif avec salons et présence.
  - `SharedStudioResource` : Actifs partagés (prompts, presets, images, scripts, templates).
  - `CommunityCollaborationIdea` : Boîte à idées et votes communautaires.

---

## 🖼️ 3bis. STUDIO AVATAR — IDENTITÉ DU MEMBRE
Deux niveaux d'identité, une seule règle de priorité.

- **Avatar par défaut (Admin-Général)** : défini une fois dans les Paramètres Plateforme, appliqué à tout nouveau compte. Le cliché de banque d'images hérité et les adresses non `https://` sont refusés à la saisie (`validateDefaultAvatarUrl`). Champ vide = choix assumé « aucun avatar imposé » : le membre affiche ses initiales, jamais une photo d'inconnu.
- **Avatar personnel (membres Pro)** : remplace le précédent. Parcours en 6 étapes — **accès Pro → photo → consentement → nom → génération → aperçu** — dont l'ordre et les blocages sont tenus par le service, pas par l'écran.
- **Consentement** : deux clauses obligatoires (droits sur la photo, autorisation d'affichage) et une facultative (prise de parole). Une clause obligatoire refusée ne produit AUCUN consentement — jamais d'accord partiel qui aurait l'air valide. Horodaté au clic, révocable à tout moment.
- **Priorité d'affichage** : avatar personnel Pro → photo de profil du membre → avatar par défaut de la plateforme → initiales. Le cliché de banque d'images n'est jamais une réponse.
- **Parole** : seul un avatar personnel dont la clause de parole a été acceptée prend la voix (`speaks`). L'avatar par défaut de la plateforme est un visage institutionnel : il reste muet.
- **Révocation** : retire l'avatar personnel, conserve les autres réglages de confidentialité et rend l'avatar de la plateforme.
- **Limite assumée** : la génération assemble une persona (photo, nom, salutation, lignes de guidage) rendue par les composants existants — ni vidéo ni voix clonée.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Résilience & Mode Dégradé** : Persistance immédiate local-first avec compatibilité cloud Supabase, tolérance totale aux clés manquantes.
- **Respect du Droit d'Auteur** : Attribution claire de l'auteur original et des co-auteurs sur chaque article et projet co-créé.
- **Contrôle d'Accès** : Niveaux de visibilité flexibles (Public, Membres uniquement, Privé sur invitation).

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : **Studio Avatar (parcours Pro complet + avatar par défaut Admin-Général, 60 tests dédiés — DEC-2026-053)**, Générateur d'images/vidéos/vision/avatar, Onglet dédié Co-Création & Collaboration, Co-projets d'articles et de campagnes avec éditeur et tâches, Cercles de discussion thématiques, Bibliothèque partagée de ressources et boîte à idées communautaires.
- **En cours** : Synchronisation temps réel via les canaux Supabase Realtime (`postgres_changes` / `presence`).
- **Évolutions Prévues** : Curseur collaboratif multi-utilisateurs et doublage multilingue direct.

