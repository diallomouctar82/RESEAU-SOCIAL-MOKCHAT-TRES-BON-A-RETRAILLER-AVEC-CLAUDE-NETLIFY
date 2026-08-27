# 🤖 MODULE 01 — DIALLO OS, EXPERTS & CONSEIL COLLÉGIAL
> **Noyau d'Intelligence Humanisée, Hub Multi-Agents et Orchestration Transversale**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Remplacer l'assistance robotique froide par une famille d'experts humains chevronnés (Famille DIALLO) qui accompagnent chaque utilisateur avec déontologie, précision et chaleur humaine.
- **Objectif** : Analyser les besoins transversaux des usagers, décomposer leurs projets de vie en étapes concrètes et coordonner les interventions des spécialistes métiers.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Tout citoyen du monde, étudiant, migrant, entrepreneur ou particulier cherchant un conseil spécialisé ou une feuille de route globale.
- **Parcours Type** :
  1. L'utilisateur pose une question ou exprime un projet (texte, voix, document).
  2. L'orchestrateur analyse l'intention et identifie l'expert leader et les collaborateurs.
  3. L'expert répond selon le format standardisé en 5 points (Analyse, Solutions, Démarches, Points d'attention, Actions immédiates).
  4. Si le sujet est complexe, la Salle de Conseil Collégial (`CouncilRoom.tsx`) est convoquée pour un avis concerté.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/ExpertsHub.tsx` : Annuaire des experts, dossiers actifs et historique.
  - `components/ChatInterface.tsx` : Espace de discussion interactif unifié.
  - `components/CouncilRoom.tsx` & `UnifiedCouncilRoom.tsx` : Salon de délibération collégiale.
  - `components/DialloOS.tsx` : Console système et coordination.
  - `services/orchestratorService.ts` : Moteur de routage et découpage d'intentions.
  - `services/voiceEngine.ts` : Synthèse et reconnaissance vocale.
- **Modèles de Données (`types.ts`)** :
  - `Agent`, `AgentRole`, `DossierParcours`, `DossierStep`, `DossierTask`, `DialloOrchestrationResult`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Règle Absolue d'Incarnation** : Interdiction formelle de se déclarer IA ou robot.
- **Limites Déontologiques** : Pas de diagnostic médical définitif, pas de conseil juridique engageant la responsabilité légale.
- **Garde-fous Géographiques** : Adaptation obligatoire des réponses au pays de résidence de l'usager.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : 8 Experts modélisés, Salle de conseil opérationnelle, Orchestrateur fonctionnel, Synthèse vocale multilingue.
- **Partiel / En cours** : Intégration d'un historique de délibération persistant sous Cloud Firestore.
- **Évolutions Prévues** : Avatars 3D photo-réalistes animés en temps réel lors des sessions vocales.
