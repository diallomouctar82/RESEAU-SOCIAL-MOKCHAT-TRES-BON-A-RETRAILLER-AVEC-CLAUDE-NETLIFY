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
  - `components/MultimodalCameraHUD.tsx` : Interface caméra temps réel.
  - `services/multimodalVision.ts` : Traitement d'images et OCR.
- **Modèles de Données (`types.ts`)** :
  - `StudioTab` : `'image' | 'video' | 'vision' | 'avatar' | 'collaboration'`.
  - `CoCreationProject` : Projets de co-rédaction et de co-création avec contributeurs, étapes et jalons.
  - `DiscussionCircle` : Cercles de discussion et d'échange créatif avec salons et présence.
  - `SharedStudioResource` : Actifs partagés (prompts, presets, images, scripts, templates).
  - `CommunityCollaborationIdea` : Boîte à idées et votes communautaires.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Passerelle serveur obligatoire** : aucune clé IA n'est lue ou conservée par le navigateur. Les appels passent par `/api/ai`, avec session Supabase, allowlist de modèles/options, quota, taille maximale et délais bornés.
- **Actifs privés durables** : toute sortie binaire est retirée de la réponse inline, convertie si nécessaire (PCM vers WAV), enregistrée dans Supabase Storage et associée à son propriétaire. Une URL signée expirée est renouvelée uniquement après vérification serveur.
- **Échec explicite** : sans secrets Netlify ou migration Supabase, la génération est indisponible et l'interface ne fabrique aucun résultat de remplacement.
- **Respect du Droit d'Auteur** : Attribution claire de l'auteur original et des co-auteurs sur chaque article et projet co-créé.
- **Contrôle d'Accès** : Niveaux de visibilité flexibles (Public, Membres uniquement, Privé sur invitation).

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Code prêt, configuration requise** : génération image/vidéo/vision/avatar sécurisée et stockage privé implémentés. Le build Vite et les tests de frontières passent localement.
- **Co-création synchronisée** : projets, cercles, ressources et idées utilisent `module_records` sous RLS; IndexedDB sert uniquement de file d'attente hors ligne avec état explicite.
- **Bloqué E2E** : aucun secret IA ni `SUPABASE_SERVICE_ROLE_KEY` n'est actuellement configuré sur le site Netlify audité; il est donc interdit d'annoncer la génération fonctionnelle en production.
- **Évolutions Prévues** : Curseur collaboratif multi-utilisateurs et doublage multilingue direct.
