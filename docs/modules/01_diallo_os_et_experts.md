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
- **Code prêt et testé localement** : 8 Experts modélisés, Salle de conseil et orchestrateur reliés à une façade IA unique authentifiée (`/api/ai`). Aucun SDK ni secret fournisseur n'est embarqué dans le bundle Vite.
- **Dossiers de vie** : création, étapes, tâches et livrables sont persistés dans `module_records` sous RLS; IndexedDB ne sert qu'à la file de mutations hors ligne.
- **Persistance média** : les sorties image, audio et vidéo sont stockées dans le bucket Supabase privé `studio-generated`; les URL temporaires sont renouvelables après contrôle du propriétaire. Les opérations vidéo sont rattachées à l'utilisateur côté serveur.
- **Configuration externe requise** : `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` doivent être définies dans Netlify, puis la migration `20260827214000_ai_proxy_assets.sql` appliquée. Tant que ce n'est pas fait, le service échoue explicitement avec `PROVIDER_NOT_CONFIGURED`; aucun faux conseil n'est généré.
- **Non prouvé en production** : qualité des réponses fournisseur, quotas réels et parcours E2E Netlify/Supabase.
- **Évolutions Prévues** : Avatars 3D photo-réalistes animés en temps réel lors des sessions vocales.
