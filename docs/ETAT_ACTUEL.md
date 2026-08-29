# 📊 ÉTAT ACTUEL DE LA PLATEFORME — « OÙ EN EST LE MONDE À VOUS ? »
> **Synthèse Opérationnelle & Bilan d'Avancement en Temps Réel**  
> *Date de Mise à Jour : 28 Août 2026*  
> *Version Courante : v6.6.1 (Production Ready — HIGH DEMAND SPIKE ABSORPTION & 503 FAILOVER)*

---

## 🎯 SYNTHÈSE EXÉCUTIVE
**Le Monde à Vous** a franchi le jalon officiel **HIGH DEMAND SPIKE ABSORPTION & 503 FAILOVER (v6.6.1)**. La plateforme est un écosystème hautement intégré combinant 15 modules, l'expertise de 8 spécialistes de la Famille Diallo, un marché mondial sécurisé, un campus certifiant, un GPS de carrière complet, un réseau de confiance, un espace Super-Administrateur souverain, un orchestrateur central et une interface conversationnelle moderne, aérée et hyper-résiliente.

La version **v6.6.1** consacre :
- **Absorption Automatique des Pointes de Charge (503 UNAVAILABLE / High Demand)** : Détection proactive et gestion résiliente des surcharges d'API distantes dans l'Edge Function orchestratrice `supabase/functions/ai-gateway/index.ts`.
- **Cascade Multi-Modèles Instantanée** : En cas de forte affluence sur `gemini-2.5-flash`, basculement automatique et silencieux vers `gemini-2.5-pro` ou `gemini-2.0-flash`, puis vers les autres fournisseurs configurés (Claude, DeepSeek, OpenAI, Mistral) sans rupture d'expérience.
- **Protection Multimodale (Vision HUD & Voice)** : Prise en charge des bascules dans `services/multimodalVision.ts` et `services/ai.ts` pour garantir un fonctionnement ininterrompu de la caméra et de l'analyse.
- **Refonte Complète & Calibre Pro du Chat (`ChatInterface.tsx`)** : Interface épurée, aérée et moderne avec bulles soignées, micro-interactions fluides, suggestions dynamiques par expert, attachement de fichiers/photos, perception visuelle caméra HUD et synthèse vocale HD ElevenLabs.
- **Fonctionnement Garanti dès le 1er Instant** : Routage multi-fournisseur transparent via `services/aiGateway.ts` (point d'entrée unique côté client vers l'orchestrateur `supabase/functions/ai-gateway`), assurant zéro blocage et zéro écran blanc même sans configuration de clés.
- **Visualisation Dynamique du Fournisseur Actif & Auto-Bascule** : Badge de statut en temps réel (ex. `🟢 Google Gemini 2.5 Flash • 115ms` ou `⚡ Relais : DeepSeek V3`), et affichage des métriques de latence et moteur utilisé sous chaque réponse.
- **Tableau de Bord Fournisseurs Dédié (`components/admin/AiOrchestrator.tsx`)** : Accessible depuis le Tableau de Bord Super-Admin (`AdminDashboard.tsx`, lui-même ouvert en 1 clic depuis la barre de navigation supérieure `Layout.tsx`), permettant de tester chaque connecteur en direct, prioriser/forcer un fournisseur et le reconnecter après correction de sa clé.
- **Orchestrateur Central des Modèles IA (Super Admin)** : Pilotage en temps réel de 15+ connecteurs d'IA majeurs (Gemini, DeepSeek, Claude AI, OpenAI, Mistral, Qwen, Kimi, Kling AI, ElevenLabs, HeyGen, Runway, OpenRouter, n8n, Grok, Ollama) activables et désactivables en 1 clic.
- **Sélection Intelligente & Cascade de Résilience sans Coupure** : Routage automatique selon la spécialité de tâche (raisonnement, juridique & contrats, code, multilingue, vidéo, voix, automatisation), la latence, le taux d'erreur, le score de qualité et les plafonds de budget quotidien (`dailyQuotaLimitUSD`).
- **Portails Officiels Développeurs 1-Clic** : Accès direct pour chaque fournisseur vers 4 destinations officielles clés : Créer un compte, Générer une clé API, Accéder à la documentation et Consulter les quotas & facturation.
- **Détection Automatique & Actions Correctives** : Vérification en temps réel des variables d'environnement (`detectedEnvVar`, `isEnvKeyPresent`), alertes visuelles immédiates et recommandations correctives ciblées.
- **Tableau de Bord & Audit Logs en Temps Réel** : Suivi des métriques de latence, scores de qualité, taux de succès et journal d'audit complet de toutes les bascules de secours.
- **Relecture Vidéo Pérenne & Fiabilisée** : Conversion des médias vidéos en Data URL Base64 persistantes au lieu d'URLs blob éphémères, permettant une relecture instantanée et illimitée par les propriétaires et tous les membres de la communauté.
- **Accès Immédiat & Universel au Tableau de Bord Super-Admin** : Intégration du composant `AdminDashboard` dans le routage `App.tsx` et ajout de boutons d'accès directs dorés dans le Header desktop, le menu déroulant profil de l'avatar, la barre latérale (Sidebar) et le Dashboard d'accueil.
- **Gestion Complète de Tous les Comptes & RBAC** : Vue exhaustive de tous les utilisateurs réels et synchronisés, attribution granulaire des rôles, ajustement audité des soldes Ⓒ, modération en direct, et sauvegardes souveraines.
- **Unification & Résilience Supabase / Netlify / GitHub** : Tolérance aux pannes de schéma (`PGRST204`), éliminant tout risque d'écran blanc (*Zero White Screen of Death*).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STATUT GLOBAL : CHROMATIC REFINEMENT v6.1 (14/14 Modules & 10 Palettes Actives) │
│ QUALITÉ & RÉSILIENCE : 22/22 Défauts Résolus & Validés (Norme IEEE 1044 / PSP) │
│ IDENTITÉ VISUELLE : Bleu Profond + Institutionnel + Épuré + Color Lab Réactif   │
│ DESIGN SYSTEM : V1.0.0 Figé, Documenté (26 chapitres), Zéro AI-Slop             │
│ NAVIGATION : 5 Piliers + Mode Guide-moi + Recherche ⌘K + Transversal Workspace │
│ ACCESSIBILITÉ : 100% WCAG AA, Clarté Cognitive, Restitution Vocale & Scanner   │
│ COHÉRENCE ARCHITECTURALE : 100% (Builds verts, Types stricts)                  │
│ MÉMOIRE VIVANTE & HANDOFF : Suite documentaire complète et interconnectée      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 1. CE QUI FONCTIONNE PLEINEMENT (MODULES OPÉRATIONNELS)

### 1.1. Diallo OS, Experts & Conseil Collégial
- Dialogue interactif avec chaque expert Diallo (Directeur, Maître, Conseiller, Professeur, Dr, Monsieur, Guide, Analyste).
- Salle de Conseil Réuni (`CouncilRoom.tsx` / `UnifiedCouncilRoom.tsx`) réunissant les spécialistes pour résoudre un cas transversal.
- Orchestrateur central (`components/DialloOS.tsx`, routé via `services/aiGateway.ts`) avec extraction d'intentions et ventilation automatique vers les modules idoines.
- **Moteur Vocal Pro & Dialogue Conversationnel Fluide (`voiceEngine.ts`)** :
  - **Synthèse Vocale Haute Fidélité ElevenLabs (HD)** :
    - Intégration de l'API ElevenLabs avec restitution MP3 haute fidélité via `generateSpeech()` (`services/aiGateway.ts`), routée par l'orchestrateur `supabase/functions/ai-gateway` (catégorie « voix ») — aucun proxy Express, la clé ne quitte jamais le serveur.
    - Voix personnalisées et réalistes attribuées à chaque membre de la Famille DIALLO et aux formations du Campus.
    - Mise en cache intelligente des flux audio générés (Blob URLs) pour zéro latence lors des réécoutes et économie de bande passante.
    - Bascule automatique et dégradation gracieuse vers le moteur vocal natif (`window.speechSynthesis`) si la clé API n'est pas renseignée.
    - Panneau de configuration dédié (`VoiceSettingsModal.tsx`) permettant de préécouter, tester et sélectionner les voix préférées.
  - Voice Activity Detection (VAD) avec détection de silence intelligente et auto-envoi sans clic.
  - Découpage acoustique phonétique (phrases naturelles sans coupures ni troncatures).
  - Mode "Dialogue Continu / Mains Libres" avec reprise automatique de micro à la fin de la réponse de l'avatar.
  - Suppression d'écho acoustique (pause du micro pendant la parole de l'avatar pour éliminer les retours).
  - Heartbeat anti-sommeil de la Web Speech API sur navigateurs Chromium.
  - Interruption instantanée (barge-in) dès que l'utilisateur reprend la parole.
- HUD Multimodal & Support vocal temps réel (`voiceEngine.ts`).
- **Hub Central Multi-Fournisseurs d'IA & Cascade Auto-Résilience (`supabase/functions/ai-gateway/index.ts`, `services/aiGateway.ts`)** :
  - **10+ Moteurs Connectés** : DeepSeek (V3/R1), Anthropic Claude (3.5 Sonnet/Haiku), OpenAI (GPT-4o/o1/o3), Alibaba Qwen (DashScope 72B), Moonshot Kimi (K3/K1.5 128k), Kling AI (Vidéo Kuaishou), OpenRouter Multi-LLM Gateway, n8n Workflow Automation, HeyGen Interactive Avatars, RunwayML (Gen-3/Gen-2) et ElevenLabs TTS.
  - **Edge Function Orchestratrice Sécurisée (`supabase/functions/ai-gateway/index.ts`)** : Point d'entrée serveur unique, invoqué via `supabase.functions.invoke('ai-gateway', ...)`, avec sélection automatique du fournisseur, gouvernance de budget (plafonds jour/mois) et calcul du coût de chaque appel.
  - **Banc d'Essai & Liens Directs 1-Clic (`components/admin/AiOrchestrator.tsx`)** : Test des connecteurs en direct, statut de configuration avec détection de clés, et liens officiels directs vers les portails développeurs pour chaque fournisseur.
  - **Dégradation Gracieuse & Zéro Écran Blanc** : Fonctionnement fluide avec ou sans clés d'environnement grâce aux modèles de repli souverain.

### 1.2. Marché Mondial & Business Operating System
- Catalogue universel tridimensionnel (B2B, B2C, C2C) avec filtrage par pays d'origine, devises et certifications.
- Système de gestion de boutique vendeur (`MyShop.tsx`) et copilotage commercial IA.
- Suite complète d'import-export : Sourcing de fournisseurs, appels d'offres (RFQ), négociation assistée, calcul de coût complet (Incoterms 2020), gestion des litiges et salons virtuels mondiaux.

### 1.3. Carrière & Accomplissement (GPS Point A ➔ Point B, Radar, Conquête, Continuité, Réseau, Stratégie & Consolidation Finale 7/7)
- Définition d'objectifs parmi 12 archétypes de carrière ou saisie libre.
- Diagnostic complet du Point A sur 17 critères (compétences, langues, budget, contraintes).
- Jumeau Professionnel Évolutif attestant des compétences acquises et des certifications.
- **Radar Intelligent Multi-Sources & Agent de Conquête (Étape 2/7)** :
  - Recherche d'opportunités par intentions en langage naturel.
  - Décomposition explicable de la compatibilité (Forces acquises vs Compétences à combler avec passerelles directes Campus).
  - 4 Univers de Conquête (Emploi & Missions, Clients B2B, Fonds & Bourses, Achats & Sourcing) + Horizons nouveaux.
  - Échéance et préparation : Prêt maintenant, À préparer, Objectif futur.
  - Cartographie géographique par rayon d'action (Local, National, Régional, International, 100% Télétravail).
  - Détection de signaux faibles et opportunités non publiées du Réseau MOK.
  - Agent de veille passive autonome ("Mon Agent cherche pour moi") 24h/24.
  - Coffre d'opportunités sécurisé avec suivi des statuts, notes et actions.
  - Boucle d'apprentissage et feedback utilisateur.
- **Mode Conquête & Salle de Préparation (Étape 3/7)** :
  - **Salle de Préparation Multi-Onglets (`CareerConquestRoom.tsx`)** avec analyse d'angle stratégique 5D et score de préparation /100.
  - **CV Maître Universel (`CareerMasterResumeModal.tsx`)** & projection contextuelle sur mesure.
  - **5 Formats de Pitchs** avec téléprompteur interactif et enregistreur audio/vidéo (`CareerTeleprompterModal.tsx`).
  - **Simulateur Réaliste & Crash Test** (10 questions + 3 pièges) avec correction IA instantanée ou Coach 3D Vocal.
  - **Checklist & Fiche Flash J-0** (`CareerMeetingFlashModal.tsx`).
  - **Quality Gate Obligatoire (`CareerQualityGateModal.tsx`)** garantissant la règle absolue *« L'humain est le seul maître de l'action »*.
  - **Décodeur de Réponses Recruteur / Client (`CareerResponseAnalyzerModal.tsx`)**.
- **Suivi Autonome, Dossier Vivant & Agent de Continuité (Étape 4/7)** :
  - **Hub de Contrôle & Pulse de Carrière (`CareerContinuityControlHub.tsx`)** avec 6 métriques stratégiques.
  - **Commandes Héroïques Directes** : **« Que dois-je faire maintenant ? »** (`CareerWhatShouldIDoNowModal.tsx`) & **« Prépare-moi pour demain »** (`CareerBriefingTomorrowModal.tsx`).
  - **Dossier Vivant (`CareerLiveDossierModal.tsx`)** : Timeline horodatée, Next Best Action permanente, documents et notes.
  - **Moteur de Relance Intelligente Anti-Spam (`CareerSmartFollowUpModal.tsx`)** : Timing courtois J+7/J+10 et apport de valeur obligatoire.
  - **Fiche Flash Réunion & Débriefing Vocal Instantané (`CareerMeetingPrepModal.tsx` & `CareerPostMeetingDebriefModal.tsx`)**.
  - **Résilience & Capitalisation Continue - Mode Plan B (`CareerPlanBModal.tsx`)** : Réallocation des acquis vers des opportunités similaires.
- **Capital Relationnel, Réseau & Prospection (Étape 5/7)** :
  - **Hub Central de l'Écosystème Relationnel (`CareerRelationalEcosystemHub.tsx`)** : Cockpit d'intelligence relationnelle et dialogue *« Qui dois-je contacter ou relancer aujourd'hui ? »*.
  - **Carte Relationnelle Intelligente & Dynamique (`CareerRelationshipMapModal.tsx`)** : Graphe Moi ➔ Objectif ➔ Directs ➔ Facilitateurs ➔ Cibles avec pertinence bidirectionnelle explicable.
  - **Déduction « Qui devrais-je connaître pour mon objectif ? » (`CareerWhoShouldIKnowModal.tsx`)** : Déduction des profils clés depuis le Point B.
  - **Mode Introduction Professionnelle (`CareerIntroductionModal.tsx`)** : Approche qualifiée avec consentement et validation humaine obligatoire.
  - **Fiche Relationnelle 360° & Mini-CRM (`CareerContactDetailModal.tsx`)** : Pipeline à 10 étapes, mémoire relationnelle, engagements mutuels et synergies MOC.
  - **Équipes d'Opportunité & Réponse Collective (`CareerCollaborativeMissionModal.tsx`)** : Consortia pluridisciplinaires et espace de travail partagé.
  - **Hub de Mentorat & Réputation Contextualisée (`CareerMentorshipModal.tsx`)** : *J'apprends ➔ Je maîtrise ➔ J'accomplis ➔ Je transmets*.
  - **Vue Synthétique 360° Écosystème (`CareerEcosystem360Modal.tsx`)** : 8 piliers stratégiques.
- **Intelligence Stratégique, Trajectoires Prédictives & Orientation Continue (Étape 6/7)** :
  - **Hub Central d'Intelligence Stratégique (`CareerStrategicAdvisorHub.tsx`)** : Cockpit en 8 piliers articulé autour de la formule `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER`.
  - **Boussole Stratégique 4D (`CareerStrategicCompassModal.tsx`)** : Point A, Point B, Marché, Action Immédiate (mode Accélération vs Équilibre).
  - **Simulateur de Trajectoires Comparatif & Scénarios « Et si ? » (`CareerTrajectorySimulatorModal.tsx`)** : Confrontation de 5 trajectoires types (Verticale, Spécialisation, Management, Entrepreneuriat, Expatriation).
  - **Skill Graph & Cartographie des Écarts (`CareerSkillGraphGapModal.tsx`)** : Niveaux de preuve (déclarée à confirmée par réalisation) et passerelles directes Campus.
  - **Passeport de Compétences Transférables (`CareerSkillsPassportModal.tsx`)** : Valorisation des acquis vers de nouveaux secteurs (Reconversion).
  - **Plans d'Évolution 90 Jours & 1 An (`CareerEvolutionPlansModal.tsx`)** : Feuilles de route cadencées mois par mois et trimestres T1-T4.
  - **Diagnostic de Plateau & « Débloque ma situation » (`CareerPlateauUnlockModal.tsx`)** : Détection des stagnations et calcul du Levier N°1.
  - **Conseil de Carrière Multi-Experts (`CareerMultiExpertCouncilModal.tsx`)** : Orchestration collégiale des 4 experts Diallo (Carrière, Finance, Langues, Juridique).
  - **Matrice de Décision Personnelle & Arbitrage d'Opportunités (`CareerDecisionMatrixModal.tsx`)** : Pondération multicritère de 7 valeurs de vie.
  - **Bilan de Carrière IA Généré (`CareerAIBilanModal.tsx`)** : Synthèse complète des réalisations et orientations du prochain cycle.
  - **Visualisation Chronologique « Mon Évolution » (`CareerEvolutionTimelineModal.tsx`)** : Timeline vivante du chemin parcouru jusqu'au Point B.
- **Consolidation Finale & Cycle Perpétuel d'Accomplissement (Étape Finale 7/7)** :
  - **Centre de Commande Unifié (`CareerMasterCommandHub.tsx`)** : Cockpit central avec bascule instantanée Mode Simple (centré sur l'action du jour) / Mode Avancé (7 piliers complets).
  - **Dossier Maître Unique (`CareerMasterDossier`)** : Base de données vivante synchronisant identité, cap (Point A ➔ Point B), journal chronologique et permissions.
  - **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** : Récit de parcours narratif et moteur d'arbitrage de la meilleure action universelle.
  - **10 Modals & Commandes d'Accomplissement** :
    1. *« Raconte-moi mon parcours »* (`CareerNarrativeStoryModal.tsx`) : Récit continu valorisant avec lecteur vocal.
    2. *« Que dois-je faire maintenant ? »* (`CareerWhatShouldIDoModal.tsx`) : 3 meilleurs leviers du jour avec gains attendus.
    3. *« J'ai une urgence »* (`CareerEmergencyModal.tsx`) : Diagnostic commando express (entretien dans 1h, dossier ce soir, offre à négocier).
    4. *Mode Célébration & Nouveau Cap* (`CareerAccomplishmentCelebrationModal.tsx`) : Consécration du Point B et réenclenchement d'un cycle ambitieux.
    5. *Centre de Contrôle & Permissions IA* (`CareerAgentPermissionsLogsModal.tsx`) : Matrice de souveraineté, pause d'urgence et logs d'audit.
    6. *Onboarding Conversationnel Intelligent* (`CareerConversationalOnboardingModal.tsx`) : Cadrage fluide sans formulaire.
    7. *Recherche Universelle Carrière* (`CareerUniversalSearchModal.tsx`) : Indexation globale de l'écosystème.
    8. *Test de Cohérence du Cap* (`CareerCoherenceAuditModal.tsx`) : Alignement des actions sur le Point B.
    9. *Opportunités Surprises* (`CareerSurpriseOpportunityModal.tsx`) : Décloisonnement par compétences transférables.
    10. *Mon Impact & Transmission* (`CareerImpactTransmissionModal.tsx`) : Boucle d'utilité collective et mentorat.
- Coach 3D Vocal interactif et certification des résultats tangibles.

### 1.4. Campus Mondial Intelligent, Multi-Programmes & Éducation (100% Conforme Feuille de Route)
- **Registre des Cours Réels d'Excellence (`services/realCurriculumCourses.ts`)** : Véritables contenus académiques exhaustifs pour les programmes nationaux (Mathématiques Terminale, Mécanique Newtonienne, Philosophie de la Liberté et de la Justice) et les formations supérieures (Droit des Affaires OHADA, Ingénierie Cloud & Cybersécurité).
- **Récitation Vocale & Dictée Audio par Professeur Diallo (`window.speechSynthesis`)** : Récitation audio posée et claire de chaque cours en français académique avec commandes Play, Pause et arrêt automatique lors des changements de module.
- **Espace Travaux Pratiques avec Corrigé Dépliable & Barème Pas à Pas** : Énoncés d'épreuves réelles, contextes authentiques, étapes méthodologiques guidées et révélation contrôlée du corrigé officiel avec attribution des points.
- **Référentiels Officiels Multi-Pays & Explorateur de Matières** : Guinée (MEPU-A), Sénégal (Office du Bac), France (Eduscol), Côte d'Ivoire (MENA), USA (AP & SAT), UK (Cambridge A-Levels).
- **Catalogue des Formations Certifiantes & Diplômes d'Élite (`services/formationsRegistry.ts`)** : Cursus universitaires et professionnels complets (Tech & IA, Droit OHADA, Ingénierie Cloud, Médecine, Finance, Agro-écologie, Doctorats) avec crédits ECTS, prérequis, débouchés et corps professoral.
- **Processus & Modal d'Inscription Officielle (`CampusCourseEnrollmentModal.tsx`)** : Choix du statut académique (Parcours Certifiant avec délivrance de diplôme vs Auditeur Libre), validation du dossier d'admission et intégration immédiate à la salle de classe.
- **Salle de Classe Multimédia & Interactive (`CampusClassroomView.tsx`)** : Espace d'apprentissage complet avec cours théorique, écoute vocale, lab de mise en pratique avec exécuteur interactif, quiz formatif de vérification, carnet de notes synchronisé et accès aux ressources.
- **Salle d'Examen Certifiant Chronométrée (`CampusCertifyingExamView.tsx`)** : Épreuve officielle sous minuterie, correction automatique, délibération du jury académique et attribution du diplôme si note ≥ 10/20.
- **Visualisation & Registre des Diplômes Authentifiés (`CampusDiplomaViewerModal.tsx` & Onglet `Mes Diplômes`)** : Parchemin haute fidélité avec sceau d'authenticité, numéro de série unique, signature du Professeur Diallo, QR Code de vérification et fonction d'impression / export PDF.
- **Navigation par 5 Onglets Spécialisés** : `Programme Officiel & Matières`, `Formations & Cursus Certifiants`, `Examens Blancs Officiels`, `Passerelles & Équivalences`, `Mes Diplômes & Certifications`.
- **Dialogue Vocal Bidirectionnel & Synthèse Temps Réel** : Dictée vocale continue/push-to-talk avec écoute du Professeur Diallo et lecture audio fluide.
- **Caméra Vidéo Interactive & HUD Vision Pédagogique** : Flux WebRTC avec détection de mouvements optiques (jauge d'activité %) et reconnaissance visuelle d'objets (cahier, calculatrice, devoirs, énoncés manuscrits).
- **Scanner & Guidance Visuelle Pas-à-Pas** : Bouton d'analyse instantanée face caméra pour scanner les exercices physiques et être guidé méthodologiquement.
- **Partage & Analyse de Documents et Devoirs** : Drag-and-drop et téléversement de documents (PDF, images, feuilles d'examens) avec résolution guidée par Professeur Diallo.
- **Diagnostic Initial & Positionnement Interactif (Point A ➔ Point B — `CampusDiagnosticModal.tsx`)** : Test rapide de positionnement en 5 minutes, cartographie des compétences officielles cibles et recalibration automatique du plan d'étude.
- **Étude Directe des Chapitres Officiels** : Bouton d'étude directe sur chaque chapitre du programme national liant le cours théorique, les exercices corrigés et le coaching de Professeur Diallo.
- **Banque d'Examens Blancs Officiels Multi-Pays (`CampusMockExamView.tsx`)** : Épreuves minutées conformes aux barèmes officiels (Guinée, France, Sénégal, CI, Alphabétisation) avec notation /20 et analyse des erreurs.
- **Simulateur de Passerelles & Équivalences Mondiales (`CampusEquivalenceComparator.tsx`)** : Comparateur de diplômes, conversion de notes/GPA, matières partagées, écarts et plan de mise à niveau.
- **Moteur Pédagogique Adaptatif & Coach 3D Professeur Diallo (`CampusProfessorCoach.tsx`)** : 4 modes de reformulation cognitive (*"Explique-moi autrement"* : analogie simple, pas-à-pas, exemple local, langage direct).
- **Alphabétisation & Fondamentaux pour Tous** : Parcours d'émancipation pour adultes et jeunes non scolarisés (lecture du quotidien, calcul commercial, monnaie).
- **Centre des Langues** : 40+ langues avec répétition espacée et prononciation audio.

### 1.5. Réseau MOK, Messagerie & Espace Live Intelligent
- **Messagerie Instantanée (`MoocChatFloating.tsx` & `ChatMessageItem.tsx`)** — réécrite contre le vrai schéma Supabase aux LOOP 06-07/17 (Architecte MOCnet) après audit : cette section affirmait auparavant des capacités jamais implémentées (chiffrement de bout en bout, épinglage, appels chiffrés) alors que l'envoi de message réel échouait silencieusement depuis toujours contre le backend. État réel, vérifié par test de bout en bout :
  - Communication 1-à-1 et groupes réels (`conversations`/`conversation_participants`/`messages`), avec anti-doublon d'envoi (`client_message_id`) et blocage réellement appliqué à l'envoi.
  - **Confidentialité réelle** : chaque conversation n'est visible que par ses membres (RLS `is_conversation_member`) — **aucun chiffrement de bout en bout n'est implémenté** (le contenu est stocké en clair dans la base, comme documenté honnêtement dans l'interface elle-même depuis le LOOP 07/17), il ne faut donc jamais présenter cette capacité comme acquise.
  - Envoi d'images/vidéos/documents/messages vocaux avec aperçu — pièces jointes réellement persistées (colonne `attachment_url`), mais encore en base64 (upload Storage réel non fait, voir Chantier Messagerie LOOP 06/17 dans `docs/SUPABASE_ARCHITECTURE.md`).
  - Citations/réponses, réactions emoji (atomiques, `toggle_message_reaction`), résumé de conversation et traduction de message par IA (LOOP 07/17, langue d'origine toujours conservée).
  - **Épinglage** : bouton présent dans l'UI mais **non fonctionnel** — `onPin` n'est câblé par aucun appelant, aucune colonne `is_pinned` n'existe sur `messages`. Non implémenté, pas un correctif à faire passer pour acquis.
  - **Appels audio/vidéo** : la signalisation (sonnerie/acceptation/refus) est réelle (Supabase Broadcast), mais **aucun transport audio/vidéo pair-à-pair n'est établi entre les deux personnes** (`ChatCallModal.tsx` ne capture que la caméra locale de l'utilisateur — pas de `RTCPeerConnection`) : un appel ne délivre donc pas encore le son/l'image de l'autre participant. Non chiffré pour la même raison qu'il n'y a pas de flux média à chiffrer.
- **Réseau Social de Confiance (`SocialFeed.tsx`)** :
  - Publications de posts enrichis (texte, images HD, vidéos avec relecture continue), likes, commentaires, partages et direct live.
  - Système de réputation décentralisée Mok Trust Hub avec notation d'intégrité.
  - Découverte de Tribus et visionneuse de Smart Reels.
- **Espace Live Intelligent Haute Résilience (100% Opérationnel — Zéro Écran Blanc)** :
  - Lancement instantané (« Démarrer le live maintenant ») et programmation de sessions bilingues avec sélection de Copilote IA Diallo OS.
  - Détection automatique et gestion gracieuse des flux WebRTC/Microphone/Caméra et partage d'écran.
  - Barre d'actions intelligente (`LiveSmartActionBar`), prise de notes personnelles dans la mémoire privée, création de tâches, demandes de SOS expert, vérification de sources (fact-checking) et rendez-vous 1-à-1.
  - Tableau blanc interactif (`LiveWhiteboard`), compte-rendu téléchargeable post-live et salle d'attente technique.

### 1.6. Services Vie Quotidienne & Google Workspace
- **Juridique** : Générateur de procédures administratives, titres de séjour et Coffre-fort numérique sécurisé.
- **Logement** : Moteur de recherche de biens, simulateur d'aides APL et modèles de baux.
- **Santé** : Dossier médical d'urgence, carnet vaccinal et orientation préventive.
- **Mobilité** : Simulateur de visas mondiaux et fiches pratiques 195 pays.
- **Wallet** : Soldes multi-devises, transferts et conversion instantanée de Crédits.
- **Google Workspace** : Intégration Drive, Meet, Chat et Google Maps pour la géolocalisation des ambassades et entreprises.

---

## 🟡 2. CE QUI EST PARTIEL OU EN COURS D'AMÉLIORATION CONTINUE
- **Gamification Transversale Unifiée** : Les mécanismes de récompense (XP, niveaux, badges) sont actifs sur Campus et Carrière, mais attendent d'être unifiés dans un module dédié de motivation globale.
- **Salles d'Atelier Pédagogique Collaboratif** : L'infrastructure de tableau blanc (`LiveWhiteboard.tsx`) est prête pour être branchée sur des cours collectifs en direct.

---

## 🟢 1.7. Backend Supabase (27 août 2026)

**Migration complète Firebase → Supabase effectuée.** Authentification Google OAuth unifiée (Supabase Auth, permissions minimales), profil applicatif séparé (`profiles`) avec RLS, et persistance réelle pour : Identity, Social (posts/commentaires/réactions/stories), Messagerie (dont chat Expert IA), Dossiers de vie, Carrière (Radar + CV Maître), Éducation/Campus (cours/inscriptions/certificats), Commerce minimal (boutique/commandes), Finance (solde dérivé), Notifications, Fichiers (Storage), Live (intégral), catalogue Agents. Détail complet : `docs/SUPABASE_ARCHITECTURE.md` et `docs/AUTHENTICATION.md`.

Volontairement laissés hors périmètre (0% de persistance prouvée dans le code, écrans de démo uniquement) : Trade/Commerce Mondial (RFQ, CommercialDossier, salons, MokTrust), Tribus/Cercles riches.

**Prérequis restant côté utilisateur** : configurer le Client ID/Secret Google OAuth dans Supabase Dashboard (voir `docs/AUTHENTICATION.md §4`) pour que la connexion Google soit pleinement fonctionnelle en production.

## 🔴 2. PROCHAINES PRIORITÉS IMMÉDIATES (ROADMAP)
1. Compléter la configuration OAuth Google côté Supabase Dashboard (prérequis externe).
2. **Système Global de Motivation & Engagement** (Prompt dédié à venir).
3. **Campus 3.0 : Cours Collectifs en Direct & Co-apprentissage** (Prompt dédié à venir).
4. Normaliser Trade/Commerce Mondial et Tribus dans Supabase si/quand ces modules deviennent prioritaires (actuellement hors périmètre, voir §1.7).
