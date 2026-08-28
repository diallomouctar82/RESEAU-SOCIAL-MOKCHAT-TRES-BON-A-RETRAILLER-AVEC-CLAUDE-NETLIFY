# 🌐 MODULE 13 — INTÉGRATION GOOGLE WORKSPACE & SUITE OUTILS
> **Bannière Unifiée, Google Drive, Google Meet, Google Chat & Google Maps Explorer**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Proposer un environnement de travail et d'échange professionnel mondial parfaitement intégré aux standards industriels de collaboration (Google Workspace).
- **Objectif** : Permettre aux membres et experts d'échanger par visioconférence (Meet), de dialoguer en messagerie instantanée (Chat), de stocker leurs pièces et dossiers (Drive) et d'explorer la planète (Maps).

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Tous les membres collaborant sur des projets, acheteurs/vendeurs en salon mondial, élèves suivant des tutorats.
- **Parcours Type** :
  1. Ouverture d'un salon Meet depuis une fiche de salon mondial B2B ou une consultation expert.
  2. Partage de pièces jointes et modèles de contrats directement enregistrés dans Drive.
  3. Repérage géographique précis d'entreprises, d'ambassades ou d'écoles via Maps Explorer.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/GoogleWorkspaceBanner.tsx` : En-tête d'accès rapide aux 4 applications.
  - `components/GoogleDriveCenter.tsx` : Explorateur de fichiers et dossiers partagés.
  - `components/GoogleMeetCenter.tsx` : Salle de réunion et d'appels vidéo.
  - `components/GoogleChatCenter.tsx` : Messagerie d'équipe et canaux thématiques.
  - `components/GoogleMapsExplorer.tsx` : Carte interactive alimentée par `@vis.gl/react-google-maps`.
  - `services/googleWorkspace.ts` : Pont de communication avec les APIs Google.
  - `services/googleWorkspaceLink.ts` : consentement incrémental Drive/Chat/Meet et jeton éphémère en mémoire.
  - `netlify/functions/google-workspace-proxy.ts` : proxy authentifié à endpoints Google fixes.
- **Modèles de Données (`types.ts`)** :
  - `ChatConversation`, `DeviceSession`, `StoredDocument`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Consentement incrémental** : chaque écran demande uniquement sa capacité (`drive.file`, lecture/création Chat, création/lecture Meet). Un jeton Drive ne marque pas Chat ou Meet comme connecté.
- **Jeton éphémère** : le jeton GIS reste en mémoire, expire automatiquement et n'est écrit ni en `localStorage`, ni en base.
- **Proxy fermé** : toutes les requêtes REST passent par `/api/google-workspace`, avec JWT Supabase, quota, actions/URLs fixes, validation, limite de taille et timeout. Aucun CORS générique.
- **Échec honnête** : Meet ne fabrique plus de lien après une erreur fournisseur. L'interface affiche une configuration/autorisation manquante.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Implémenté et testé localement** : Drive (liste/dossier/upload/suppression), Chat (espaces/messages) et Meet (création/lecture) via proxy same-origin; tests de frontières et build Vite réussis.
- **Configuration externe requise** : variables Netlify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; `VITE_GOOGLE_OAUTH_CLIENT_ID`; écran de consentement, origines autorisées, APIs Drive/Chat/Meet et vérification éventuelle des scopes dans Google Cloud.
- **E2E non prouvé** : aucun test fournisseur ne peut être annoncé tant que ces paramètres ne sont pas configurés sur le site Netlify et un compte Google de test n'a pas consenti.
- **Maps séparé** : conserve son SDK public et nécessite `VITE_GOOGLE_MAPS_API_KEY` restreinte par origine/API. Calendar, enregistrement et transcription Meet ne sont pas implémentés dans ce lot.
