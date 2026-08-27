# 📜 JOURNAL PERMANENT DES DÉCISIONS D'INGÉNIERIE & D'ARCHITECTURE
> **Registre Horodaté des Arbitrages, Justifications Stratégiques et Conséquences Système**  
> *Règle : Tout arbitrage technique ou fonctionnel majeur DOIT être consigné ici avec son statut et son impact.*

---

## 📋 FORMAT D'UNE ENTRÉE DE DÉCISION
Chaque décision respecte le formalisme strict suivant :
- **ID & Date** : Identifiant unique `DEC-YYYY-NNN` et date de validation.
- **Module(s) concerné(s)** : Périmètre impacté.
- **Problème / Besoin initial** : Pourquoi la question s'est posée.
- **Idées / Options envisagées** : Alternatives considérées.
- **Décision retenue** : Solution adoptée.
- **Justification & Valeur ajoutée** : Raison du choix.
- **Conséquences & Impacts transversaux** : Modifications induites sur d'autres composants.
- **Éléments techniques concernés** : Fichiers, types, services et tables.
- **Statut** : `Envisagé` | `Validé` | `Développé` | `Testé` | `Remplacé` | `Abandonné`.

---

## 🏛️ HISTORIQUE CHRONOLOGIQUE DES DÉCISIONS

### [DEC-2025-001] — 15 Décembre 2025
* **Module(s)** : `01_DIALLO_OS_ET_EXPERTS`, `Global`
* **Problème / Besoin initial** : Éviter que les utilisateurs ne perçoivent les assistants comme des robots distants et désincarnés.
* **Idées envisagées** :
  1. Afficher des cartes de bots type ChatGPT / Copilot.
  2. Créer une famille d'experts humains incarnés avec des spécialités métiers de haut niveau.
* **Décision retenue** : Adoption stricte de la **Famille d'Experts Humains DIALLO** avec consigne système inviolable (interdiction formelle de se déclarer IA ou bot).
* **Justification** : Renforce la confiance, l'empathie et la posture de conseil responsable auprès d'utilisateurs en situation d'urgence ou de démarche complexe.
* **Conséquences** : Standardisation de `SYSTEM_INSTRUCTION` dans `constants.ts` et enrichissement des profils `Agent` dans `types.ts`.
* **Éléments techniques** : `constants.ts`, `types.ts`, `components/ChatInterface.tsx`.
* **Statut** : `Testé` & `Validé`.

---

### [DEC-2026-002] — 10 Janvier 2026
* **Module(s)** : `02_MARCHE_MONDIAL_COMMERCE`
* **Problème / Besoin initial** : Un simple marketplace B2C ne répond pas aux besoins d'import-export, de gros, de sourcing et de sécurité des transactions internationales.
* **Idées envisagées** :
  1. Limiter la boutique à des articles d'e-commerce standard.
  2. Construire un Marché Mondial tridimensionnel (B2B, B2C, C2C) avec gestion des Incoterms 2020, RFQ, devis comparatifs et calcul de coûts de débarquement.
* **Décision retenue** : Extension complète du Marché Mondial avec Business OS intégré (`TradeBusinessOperatingSystem.tsx`).
* **Justification** : Permet aux PME et commerçants des pays émergents d'accéder au commerce international structuré avec une sécurité contractuelle.
* **Conséquences** : Création de 15 sous-composants dédiés au commerce (RFQ, Sourcing, Litiges, Salons) et extension du modèle `Product`.
* **Éléments techniques** : `components/Shop.tsx`, `components/Trade*`, `components/business/*`.
* **Statut** : `Développé` & `Testé`.

---

### [DEC-2026-003] — 02 Février 2026
* **Module(s)** : `01_DIALLO_OS_ET_EXPERTS`, `Transversal`
* **Problème / Besoin initial** : Les demandes utilisateurs complexes (ex: « Je veux ouvrir un restaurant en Espagne ») impliquent plusieurs compétences simultanées (juridique, visa, financement, langue).
* **Idées envisagées** :
  1. Forcer l'utilisateur à naviguer manuellement d'un expert à l'autre.
  2. Développer un Moteur d'Orchestration Multi-Agents (`OrchestratorService`) créant un `DossierParcours` coordonné.
* **Décision retenue** : Mise en place de l'Orchestrateur Central Diallo OS avec Conseil Collégial unifié (`CouncilRoom.tsx`).
* **Justification** : Réduction radicale de la charge mentale de l'utilisateur grâce à une prise en charge globale.
* **Conséquences** : Création de `services/orchestratorService.ts`, `services/dossierService.ts` et intégration dans `App.tsx`.
* **Éléments techniques** : `services/orchestratorService.ts`, `components/CouncilRoom.tsx`, `components/UnifiedCouncilRoom.tsx`.
* **Statut** : `Développé` & `Testé`.

---

### [DEC-2026-004] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`
* **Problème / Besoin initial** : L'ancien module Carrière se résumait à une liste passive d'offres sans accompagnement du changement ni validation continue des compétences.
* **Idées envisagées** :
  1. Ajouter de simples filtres de recherche d'emploi supplémentaires.
  2. Transformer le module en un **Système d'Accomplissement Professionnel & GPS de Carrière (Point A ➔ Point B)** avec Diagnostic 17 critères, Jumeau Numérique Évolutif, Coach 3D Vocal et Pipeline Kanban de suivi.
* **Décision retenue** : Refonte complète en architecture modulaire `components/career/` avec 7 sous-composants interconnectés aux autres modules (Campus, Marché, Drive).
* **Justification** : Fournit une solution de bout en bout pour la reconversion, la recherche de CDI, le freelancing et la création d'entreprise.
* **Conséquences** : Connexion directe avec le Coach 3D (`CareerCoach3DModal.tsx`), le Conseil d'Experts Carrière et les cours Campus.
* **Éléments techniques** : `components/CareerCenter.tsx`, `components/career/*`, `App.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-005] — 27 Août 2026
* **Module(s)** : `Documentation & Continuité Système`
* **Problème / Besoin initial** : Risque de perte de contexte, d'incohérence ou de régressions lors des passages successifs entre développeurs humains et modèles d'IA.
* **Idées envisagées** :
  1. Rédiger un simple fichier README résumé.
  2. Établir une **Mémoire Centrale et Vivante de Documentation Continue** avec Livre de Vision, Architecture Globale, Journal des Décisions, Registre des Idées et protocoles obligatoires dans `AGENTS.md`.
* **Décision retenue** : Création de l'infrastructure documentaire complète dans `/docs/` avec 14 fiches modules et règles système injectées.
* **Justification** : Garantie absolue de la pérennité du projet, traçabilité des choix et respect strict de la vision fondatrice.
* **Conséquences** : Tout futur cycle de développement intègre la mise à jour documentaire comme étape obligatoire d'achèvement.
* **Éléments techniques** : `/docs/*`, `/AGENTS.md`, `/GEMINI.md`.
* **Statut** : `Développé` & `Actif`.

---

### [DEC-2026-006] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `Global`
* **Problème / Besoin initial** : L'ancien module Campus imposait un cursus unique et rigide basé sur des niveaux génériques, sans prise en compte des spécificités des systèmes éducatifs nationaux (Guinée, Sénégal, France, Côte d'Ivoire, USA, UK), des besoins d'alphabétisation des adultes, ni des préférences cognitives individuelles.
* **Idées envisagées** :
  1. Conserver un catalogue unique de cours en ajoutant de simples tags de pays.
  2. Construire un **Campus Mondial Intelligent Multi-Programmes & Ultra-Personnalisé** avec registre officiel des programmes (`curriculumRegistry.ts`), moteur adaptatif de Professeur Diallo (`campusPedagogicalEngine.ts`), mode de reformulation instantanée *"Explique-moi autrement"*, simulateur d'examens blancs chronométrés (`CampusMockExamView.tsx`) et matrice de passerelles/équivalences internationales.
* **Décision retenue** : Option 2 déployée en enrichissant l'existant sans régression.
* **Justification** : Démocratise l'accès à une pédagogie d'excellence internationale tout en respectant scrupuleusement les référentiels officiels de chaque pays et le rythme propre de chaque apprenant.
* **Conséquences** : Extension de `types.ts`, création de `CampusEducationMap.tsx`, `CampusProfessorCoach.tsx` et intégration dans `Campus.tsx`.
* **Éléments techniques** : `types.ts`, `services/curriculumRegistry.ts`, `services/campusPedagogicalEngine.ts`, `components/CampusEducationMap.tsx`, `components/CampusMockExamView.tsx`, `components/CampusProfessorCoach.tsx`, `components/Campus.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-007] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`
* **Problème / Besoin initial** : L'ancien Scanner d'opportunités fonctionnait comme un moteur de recherche standard par mots-clés, forçant l'utilisateur à chercher en permanence, sans analyse des compétences réelles (Point A), sans niveau de préparation (Prêt maintenant vs À préparer), sans veille passive continue, ni détection des opportunités non publiées du Réseau MOK.
* **Idées envisagées** :
  1. Ajouter de simples filtres de catégories au scanner existant.
  2. Construire le **Radar Intelligent d'Opportunités & Agent de Conquête Permanent (Étape 2/7)** capable de décoder les intentions en langage naturel, d'expliciter le score de match (forces vs lacunes avec renvoi direct vers Campus), de surveiller le marché 24h/24 ("Mon Agent cherche pour moi"), de détecter les signaux faibles réels dans le Réseau MOK, de fournir un coffre d'opportunités avec suivi d'avancement, et d'intégrer une boucle d'apprentissage adaptative basée sur le feedback utilisateur.
* **Décision retenue** : Option 2 avec création du moteur de matching `careerRadarEngine.ts`, du composant `CareerRadarOpportunities.tsx`, de la carte explicable `CareerRadarCard.tsx`, du coffre sécurisé `CareerOpportunityVaultModal.tsx`, des missions de veille `CareerActiveMissionsModal.tsx`, des signaux faibles `CareerHiddenSignalsModal.tsx`, de la cartographie `CareerOpportunityMapView.tsx` et du feedback adaptatif `CareerOpportunityFeedbackModal.tsx`.
* **Justification** : « L'utilisateur ne passe plus ses journées à chercher : la plateforme cherche avec lui, pour lui, puis l'aide à agir » tout en respectant la règle de sécurité absolue (aucune candidature envoyée sans validation explicite).
* **Conséquences** : Remplacement du scanner d'origine par le Radar v2 dans `CareerCenter.tsx`, persistance locale du coffre et des missions, connexion native avec le Coach 3D et le Campus.
* **Éléments techniques** : `types.ts`, `services/careerRadarEngine.ts`, `components/career/CareerRadarCard.tsx`, `components/career/CareerRadarOpportunities.tsx`, `components/career/CareerOpportunityVaultModal.tsx`, `components/career/CareerActiveMissionsModal.tsx`, `components/career/CareerHiddenSignalsModal.tsx`, `components/career/CareerOpportunityMapView.tsx`, `components/career/CareerOpportunityFeedbackModal.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-008] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`
* **Problème / Besoin initial** : Une fois une opportunité détectée par le Radar, abandonner l'utilisateur devant un bouton "Postuler" conduit à un faible taux de conversion (dossiers génériques, manque de préparation aux questions pièges, absence de contrôle qualité et de débriefing après réponse).
* **Idées envisagées** :
  1. Générer automatiquement un simple email ou PDF standard et l'envoyer directement.
  2. Créer une véritable **Salle de Préparation & Mode Conquête (Étape 3/7)** comprenant :
     - Une analyse d'angle stratégique 5D (Culture, ATS, attentes non dites, leviers, score de préparation /100).
     - Un CV Maître universel comme source de vérité inaltérable et des CV contextuels dérivés sur mesure.
     - 5 formats de pitchs avec téléprompteur interactif et enregistreur audio/vidéo.
     - Un crash-test réaliste (10 questions + 3 pièges) avec correction IA instantanée ou bascule Coach 3D.
     - Une fiche flash J-0 (Répétition 5 min / Préparation 30 min).
     - Un sas de contrôle qualité obligatoire (*Quality Gate*) garantissant la règle absolue *« L'humain est le seul maître de l'action »*.
     - Un décodeur de réponses recruteurs/clients pour adapter la suite du plan d'action.
* **Décision retenue** : Option 2 déployée avec architecture modulaire dans `components/career/conquest/` et orchestrée depuis `CareerCenter.tsx` et `CareerContinuousFollowUp.tsx`.
* **Justification** : Maximise les chances de conversion réelle d'une opportunité en succès tangible (embauche, contrat B2B, financement) sans jamais falsifier les compétences réelles ni effectuer d'action non autorisée.
* **Conséquences** : Ajout du bouton "Salle de Préparation & Conquête" sur chaque opportunité du Radar, gestion du CV Maître persistant dans le `CareerCenter`, intégration du décodeur de réponses dans le pipeline Kanban et passerelle fluide avec le Coach 3D et le Campus.
* **Éléments techniques** : `types.ts`, `services/careerConquestDefaults.ts`, `components/career/conquest/CareerConquestRoom.tsx`, `components/career/conquest/CareerMasterResumeModal.tsx`, `components/career/conquest/CareerContextualResumeEditor.tsx`, `components/career/conquest/CareerTeleprompterModal.tsx`, `components/career/conquest/CareerMeetingFlashModal.tsx`, `components/career/conquest/CareerQualityGateModal.tsx`, `components/career/conquest/CareerResponseAnalyzerModal.tsx`, `components/career/CareerRadarCard.tsx`, `components/career/CareerRadarOpportunities.tsx`, `components/career/CareerContinuousFollowUp.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-009] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`
* **Problème / Besoin initial** : Une fois une démarche engagée, l'utilisateur risquait d'être abandonné à lui-même face à la surcharge d'échéances, aux oublis de relance, au harcèlement involontaire par manque de timing courtois, à l'absence de débriefing structuré après entretien et au découragement en cas de refus d'une piste.
* **Idées envisagées** :
  1. Maintenir un simple tableau Kanban statique avec des cartes déplaçables.
  2. Déployer un **Agent Autonome de Continuité & Dossier Vivant (Étape 4/7)** comprenant :
     - Un **Pulse de Carrière** et une commande centrale **« Que dois-je faire maintenant ? »** pour prioriser l'action quotidienne à fort impact sans surcharge cognitive.
     - Une commande **« Prépare-moi pour demain »** et un briefing hebdomadaire anticipant les échéances critiques et fiches flash J-0.
     - Un **Dossier Vivant** avec timeline chronologique horodatée, pièces jointes, prochaine meilleure action (*Next Best Action*) et notes privées.
     - Un **Moteur de Relance Intelligente Anti-Spam** avec timing courtois (J+7/J+10) et apport systématique de valeur ajoutée.
     - Une **Fiche de Préparation de Rendez-vous** et un **Débriefing Vocal Instantané** (« Comment ça s'est passé ? ») extrayant les décisions actées et les engagements réciproques.
     - Un **Mode Plan B & Capitalisation Continue** garantissant qu'un refus réalloue immédiatement 90% des actifs préparés vers 2 à 3 opportunités de substitution du Radar.
* **Décision retenue** : Option 2 déployée via `CareerContinuityControlHub.tsx` et sa suite de modales spécialisées dans `components/career/continuity/`.
* **Justification** : « Aucun parcours important ne doit être oublié en cours de route. » L'application accompagne l'utilisateur avec lucidité, respect du timing et résilience jusqu'à l'obtention de résultats tangibles et vérifiables.
* **Conséquences** : Remplacement du module de suivi classique par le hub de continuité dans `CareerCenter.tsx`, synchronisation avec la timeline d'événements et capitalisation vers le Radar d'opportunités.
* **Éléments techniques** : `types.ts`, `services/careerContinuityEngine.ts`, `components/career/continuity/CareerContinuityControlHub.tsx`, `components/career/continuity/CareerLiveDossierModal.tsx`, `components/career/continuity/CareerWhatShouldIDoNowModal.tsx`, `components/career/continuity/CareerBriefingTomorrowModal.tsx`, `components/career/continuity/CareerMeetingPrepModal.tsx`, `components/career/continuity/CareerPostMeetingDebriefModal.tsx`, `components/career/continuity/CareerSmartFollowUpModal.tsx`, `components/career/continuity/CareerPlanBModal.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-010] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`, `07_RESEAU_SOCIAL_ET_COMMUNAUTES`
* **Problème / Besoin initial** : Attendre passivement qu'une opportunité apparaisse sur un job board ou un radar limite les trajectoires ambitieuses. L'utilisateur doit pouvoir créer lui-même ses opportunités, développer son capital relationnel, cibler ses clients idéaux (ICP), identifier les signaux d'affaires faibles, monter des équipes d'opportunité (consortia pluridisciplinaires) et transmettre son expertise via le mentorat sans démarchage agressif (anti-spam).
* **Idées envisagées** :
  1. Construire un simple carnet d'adresses ou exporter des listes de contacts brutes.
  2. Déployer un **Agent Autonome de Développement Professionnel, Réseau & Prospection (Étape 5/7)** comprenant :
     - Un **Cockpit d'Intelligence Relationnelle & Mini-CRM** (`CareerRelationalEcosystemHub.tsx`) avec métriques stratégiques et dialogue *« Qui dois-je contacter ou relancer aujourd'hui ? »*.
     - Une **Carte Relationnelle Intelligente & Dynamique** (`CareerRelationshipMapModal.tsx`) visualisant le flux *Moi ➔ Objectif ➔ Relations directes ➔ Facilitateurs ➔ Décisionnaires cibles* avec analyse de pertinence bidirectionnelle explicable.
     - Un moteur de déduction stratégique **« Qui devrais-je connaître pour mon objectif ? »** (`CareerWhoShouldIKnowModal.tsx`).
     - Un **Mode Introduction Professionnelle** (`CareerIntroductionModal.tsx`) avec contrôle et consentement humain obligatoire avant transmission.
     - Une **Fiche Relationnelle 360° & Mémoire Active CRM** (`CareerContactDetailModal.tsx`) gérant un pipeline à 10 étapes, les engagements réciproques et les synergies Réseau MOC (Tribus, Lives, Reels).
     - Un espace d'**Équipes d'Opportunité & Réponse Collective** (`CareerCollaborativeMissionModal.tsx`) pour répondre aux appels d'offres en consortium.
     - Un **Hub de Mentorat & Réputation Contextualisée** (`CareerMentorshipModal.tsx`) structuré autour de la boucle *J'apprends ➔ Je maîtrise ➔ J'accomplis ➔ Je transmets*.
     - Une **Vue Synthétique 360° Écosystème** (`CareerEcosystem360Modal.tsx`) en 8 piliers stratégiques.
* **Décision retenue** : Option 2 déployée et intégrée dans le CareerCenter comme onglet dédié *« Réseau & Capital Pro »*.
* **Justification** : « JE SAIS OÙ JE VEUX ALLER ➔ QUI PEUT M’AIDER ? ➔ QUI PUIS-JE AIDER ? ➔ OÙ SONT LES OPPORTUNITÉS ? ➔ COMMENT CRÉER UNE RELATION UTILE ? ➔ COMMENT LA TRANSFORMER EN RÉSULTAT ? ». Applique strictement la charte éthique anti-spam et garantit l'alignement avec le Réseau MOC et le Studio de Marque Pro.
* **Conséquences** : Extension de `CareerCenter.tsx` avec le sous-système de réseau pro, interconnexions fluides avec les Tribus et Lives MOC, gestion du profil de client idéal IA (ICP) et des signaux commerciaux détectés.
* **Éléments techniques** : `types.ts`, `services/careerNetworkEngine.ts`, `components/career/network/CareerRelationshipMapModal.tsx`, `components/career/network/CareerWhoShouldIKnowModal.tsx`, `components/career/network/CareerIntroductionModal.tsx`, `components/career/network/CareerContactDetailModal.tsx`, `components/career/network/CareerCollaborativeMissionModal.tsx`, `components/career/network/CareerMentorshipModal.tsx`, `components/career/network/CareerEcosystem360Modal.tsx`, `components/career/network/CareerRelationalEcosystemHub.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-011] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `04_CAMPUS_ET_EDUCATION`, `Transversal`
* **Problème / Besoin initial** : Accompagner la carrière actuelle sans vision prospective ni anticipation des ruptures de marché risque d'enfermer l'utilisateur dans une trajectoire subie ou obsolète. Il manquait un conseiller stratégique permanent capable de modéliser des trajectoires multiples non-linéaires, d'analyser les signaux faibles, de lever les plateaux de stagnation et d'arbitrer les choix de vie selon des critères personnels pondérés.
* **Idées envisagées** :
  1. Ajouter un simple questionnaire d'orientation statique ou un test de personnalité générique.
  2. Déployer un **Système d'Intelligence Stratégique & Trajectoires Prédictives (Étape 6/7)** articulé autour de la formule `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER` avec 10 composants dédiés :
     - **Boussole Stratégique 4D** (`CareerStrategicCompassModal.tsx`) articulant Point A, Point B, Marché et Action immédiate avec mode d'accélération vs équilibre.
     - **Simulateur de Trajectoires Comparatif & Scénarios « Et si ? »** (`CareerTrajectorySimulatorModal.tsx`) confrontant 5 voies types (A: Verticale, B: Spécialisation, C: Management, D: Entrepreneuriat, E: Expatriation) et calculant l'impact des bifurcations.
     - **Skill Graph & Cartographie des Écarts** (`CareerSkillGraphGapModal.tsx`) avec niveaux de preuve (déclarée à confirmée par réalisation) et passerelles directes vers Campus.
     - **Passeport de Compétences & Compétences Transférables** (`CareerSkillsPassportModal.tsx`) pour valoriser les acquis vers d'autres secteurs sans repartir de zéro.
     - **Plans d'Évolution 90 Jours & 1 An** (`CareerEvolutionPlansModal.tsx`) cadencés mois par mois et trimestres T1-T4.
     - **Diagnostic de Plateau & Commande « Débloque ma situation »** (`CareerPlateauUnlockModal.tsx`) identifiant le Levier N°1 d'accélération.
     - **Conseil de Carrière Multi-Experts** (`CareerMultiExpertCouncilModal.tsx`) orchestrant 4 experts Diallo (Mamadou, Aïssata, Amadou, Fatoumata) avec synthèse collégiale.
     - **Matrice de Décision Personnelle & Arbitrage d'Opportunités** (`CareerDecisionMatrixModal.tsx`) avec pondération de 7 critères de vie pour arbitrer entre plusieurs offres.
     - **Bilan de Carrière IA Généré** (`CareerAIBilanModal.tsx`) synthétisant les acquis, l'évolution contextuelle et les recommandations futures.
     - **Visualisation Chronologique « Mon Évolution »** (`CareerEvolutionTimelineModal.tsx`) matérialisant le chemin parcouru et les prochaines étapes.
* **Décision retenue** : Option 2 développée, testée et intégrée dans `CareerCenter.tsx` avec l'onglet *« Stratégie & Trajectoires »*.
* **Justification** : « L'IA conseille. Elle ne décide jamais. » L'utilisateur dispose d'une puissance d'analyse stratégique de niveau cabinet de conseil de direction tout en restant l'unique souverain de ses décisions.
* **Conséquences** : Intégration fluide de `CareerStrategicAdvisorHub.tsx` dans la navigation de `CareerCenter.tsx`, enrichissement du modèle de données `types.ts` et du moteur de calcul `services/careerStrategicEngine.ts`.
* **Éléments techniques** : `types.ts`, `services/careerStrategicEngine.ts`, `components/career/strategic/*` (11 fichiers), `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-012] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`, `Global System`
* **Problème / Besoin initial** : Malgré la richesse des modules 1/7 à 6/7, le système risquait de souffrir d'une fragmentation de l'expérience utilisateur et d'un manque de boucle de continuité finale : une fois un objectif atteint, que se passe-t-il ? Comment unifier la mémoire entre tous les sous-systèmes sans formulaire répétitif, tout en offrant une interface épurée en Mode Simple et un cockpit complet en Mode Avancé ?
* **Idées envisagées** :
  1. Laisser chaque onglet indépendant avec son propre stockage local fragmenté.
  2. Construire le **Système Unifié de Carrière & Cycle Perpétuel d'Accomplissement (Étape Finale 7/7)** reposant sur :
     - Le **Dossier Maître Unique (`CareerMasterDossier`)** unifiant l'identité, le cap (Point A ➔ Point B), le journal de bord, les permissions et les métriques d'impact.
     - Le **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** synthétisant le récit de vie (`generateCareerNarrative`) et priorisant la meilleure action universelle (`askUniversalNextAction`).
     - Le **Centre de Commande Unifié (`CareerMasterCommandHub.tsx`)** avec bascule instantanée Mode Simple (centré sur l'action du jour) / Mode Avancé (7 piliers).
     - La commande **« Raconte-moi mon parcours » (`CareerNarrativeStoryModal.tsx`)** générant un récit valorisant et écoutable vocalement.
     - La commande **« Que dois-je faire maintenant ? » (`CareerWhatShouldIDoModal.tsx`)** isolant les 3 meilleurs leviers avec gains attendus.
     - La commande **« J'ai une urgence » (`CareerEmergencyModal.tsx`)** pour les entretiens imminents, dossiers de dernière minute et négociations contractuelles.
     - Le **Mode Accomplissement & Boucle Infinie (`CareerAccomplishmentCelebrationModal.tsx`)** qui célèbre l'atteinte du Point B, capitalise les preuves dans le Jumeau Pro et déclenche le cycle suivant.
     - Le **Centre de Contrôle & Permissions IA (`CareerAgentPermissionsLogsModal.tsx`)** pour régler l'autonomie de l'agent (Standard, Copilote, Autonome), le suspendre en 1 clic et auditer ses actions.
     - L'**Onboarding Conversationnel Intelligent (`CareerConversationalOnboardingModal.tsx`)** guidant le cadrage Point A / Point B sans formulaire rigide.
     - La **Recherche Universelle Carrière (`CareerUniversalSearchModal.tsx`)** indexant tous les documents, contacts, compétences et cours.
     - Le **Test de Cohérence du Cap (`CareerCoherenceAuditModal.tsx`)** vérifiant l'alignement des actions avec le Point B.
     - Les **Opportunités Surprises (`CareerSurpriseOpportunityModal.tsx`)** décloisonnant les choix professionnels.
     - **Mon Impact & Transmission (`CareerImpactTransmissionModal.tsx`)** bouclant le parcours d'excellence (*Apprendre ➔ Progresser ➔ Accomplir ➔ Transmettre*).
* **Décision retenue** : Option 2 déployée avec succès sans aucune régression.
* **Justification** : « Plus le moteur devient puissant, plus l'interface devient simple. » L'accompagnement transforme chaque accomplissement en un nouveau point de départ, instaurant une relation de confiance et d'émancipation sur le long terme.
* **Conséquences** : Consolidation absolue du module Carrière, intégration transparente dans `CareerCenter.tsx`, persistance du Dossier Maître, fluidité multi-appareils et passage réussi de la suite de compilation.
* **Éléments techniques** : `types.ts`, `services/careerUnifiedEngine.ts`, `components/career/unified/*` (11 composants), `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-013] — 27 Août 2026
* **Module(s)** : `Navigation`, `Layout`, `Global Experience`, `Google Workspace Integration`
* **Problème / Besoin initial** : Face à l'extrême richesse des 14 modules et sous-systèmes développés sur la plateforme, le menu principal reflétait l'ordre historique d'apparition technique (liste aplatie, applications Google au premier niveau encombrant la vue) plutôt que la manière naturelle dont un être humain formule ses besoins de vie.
* **Idées envisagées** :
  1. Conserver le menu actuel en ajoutant simplement des sous-menus déroulants basiques.
  2. Refondre l'expérience de navigation autour de **5 Grands Piliers de Besoins Humains**, transformer les services Google (Maps, Drive, Meet, Chat) en **capacités transversales invisibles et contextuelles**, et doter la plateforme d'un **moteur de recherche universel (`⌘K`)** avec commande vocale et orientation par objectifs (*« Mon Cap »*).
* **Décision retenue** : Option 2 développée et déployée :
  - **Structure en 5 Piliers Humains** :
    1. *Accueil & Cap* (`Accueil`, `Mon Parcours de Vie`)
    2. *Apprendre & Évoluer* (`Campus & Éducation`, `Langues & Immersion`, `Carrière & Accomplissement`)
    3. *Vie & Services* (`Santé & Bien-être`, `Habitat & Installation`, `Finance & Wallet`, `Mes Démarches`, `Droit & Juridique`, `Mobilité & Expatriation`)
    4. *Créer & Entreprendre* (`Studio Créatif`, `Marché Mondial`)
    5. *Communauté & Conseil* (`Réseau MOC`, `Experts Diallo`, `Conseil des Sages`)
  - **Services Transversaux Google & Sécurité** : Hub dédié (`TransversalServicesModal.tsx`) et badges contextuels. Google Drive, Meet, Chat et Maps sont intégrés au cœur des modules sans saturer la navigation principale.
  - **Recherche Universelle & Command Palette (`⌘K`)** : (`UniversalSearchModal.tsx`) avec recherche pondérée multi-entités et reconnaissance vocale directe (« Ouvre Carrière », « Mes démarches », etc.).
  - **Orientation par Objectifs (« Mon Cap »)** : (`GoalOrientationModal.tsx`) avec 6 gabarits d'accomplissement clés.
  - **Système de Favoris & Récents** : Épinglage direct avec stockage local et accès rapide en haut de barre.
  - **Dock Mobile Optimisé** : 5 actions directes et tiroir développé structuré.
* **Justification** : « La puissance doit être dans le moteur. La simplicité doit être devant l'utilisateur. » L'utilisateur trouve immédiatement ce qu'il cherche selon son intention de vie sans avoir besoin de comprendre l'architecture technique sous-jacente.
* **Conséquences** : Clarté cognitive accrue, zéro régression sur les routes existantes, accessibilité renforcée (raccourcis clavier, vocal) et mise à niveau de l'interface en conformité avec les règles Anti-Slop.
* **Éléments techniques** : `components/navigation/NavigationItems.ts`, `components/navigation/TransversalServicesModal.tsx`, `components/navigation/UniversalSearchModal.tsx`, `components/navigation/GoalOrientationModal.tsx`, `components/Layout.tsx`, `App.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-014] — 27 Août 2026
* **Module(s)** : `Design System`, `Layout`, `Dashboard`, `UI Components`, `Global Identity`
* **Problème / Besoin initial** : Passer d'une interface fonctionnelle dense à une plateforme internationale premium, distinctive et humaine, avec une identité visuelle propre et intemporelle, en éliminant les clichés d'interfaces IA génériques (AI-slop) et en unifiant l'expérience visuelle et contextuelle à travers l'ensemble des modules.
* **Idées envisagées** :
  1. Conserver les styles Tailwind génériques par défaut et ajouter simplement quelques icônes.
  2. Établir un **Design System Institutionnel & Human-Centric d'Envergure Mondiale** :
     - **Palette Institutionnelle** : Navy profond (#070D1E / #0B132B / #1E293B), accents Orange vif (#EA580C) et gris ardoise chauds.
     - **Typographie Distinctive** : 'Outfit' pour les titres et 'Plus Jakarta Sans' pour le corps de texte.
     - **Dashboard Éditorial** : Hero éditorial sobre, visualiseur de trajectoire *Point A ➔ Point B*, zone d'actions rapides et séparation nette entre la vue Personnelle et la Console Système.
     - **Barre d'Action Contextuelle (`ContextActionBar.tsx`)** : Fil d'Ariane institutionnel, étiquette du pilier de vie, description concise et déclenchement d'un conseil d'expert Diallo en 1 clic au sommet de chaque module.
     - **Bibliothèque de Composants d'Élévation** : `PointAToBPathway`, `StatusBadge`, `SourceCitationCard`, `EmptyStateGuide`, `EditorialHero`, `QuickActionZone`.
* **Décision retenue** : Option 2 déployée en conservant 100% du fonctionnel existant et en élevant le design, la clarté et la fluidité.
* **Justification** : « L'intelligence artificielle doit être ressentie par les capacités du produit, pas criée par son apparence. » L'application dégage une identité institutionnelle d'autorité bienveillante et d'excellence.
* **Conséquences** : Cohérence globale de l'interface, transitions nettes, clarté contextuelle accrue lors de la navigation dans les modules et validation de la suite de compilation.
* **Éléments techniques** : `components/ui/DesignTokens.ts`, `components/ui/PointAToBPathway.tsx`, `components/ui/ContextActionBar.tsx`, `components/ui/StatusBadge.tsx`, `components/ui/SourceCitationCard.tsx`, `components/ui/EmptyStateGuide.tsx`, `components/ui/EditorialHero.tsx`, `components/ui/QuickActionZone.tsx`, `components/Dashboard.tsx`, `components/Layout.tsx`, `index.html`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-015] — 27 Août 2026
* **Module(s)** : `Accessibility`, `GuidedMode`, `UniversalScanner`, `BilingualTranslation`, `ActionableAI`, `KnowledgeCards`, `DesignSystem`
* **Problème / Besoin initial** : Garantir une accessibilité cognitive et universelle de niveau international (seniors, personnes peu alphabétisées, usagers mobiles, barrières de la langue), doter la plateforme de capacités d'action immédiates ("Actionable AI"), d'un scanner universel tout-en-un, d'un mode bilingue direct, de fiches de connaissance réutilisables et d'un hub de paramètres unifié.
* **Idées envisagées** :
  1. Laisser les utilisateurs chercher seuls dans chaque sous-menu et sous-dossier.
  2. Construire un socle universel d'accessibilité et de clarté décisionnelle :
     - **Mode Guidé Pas-à-Pas (« Guide-moi »)** (`GuidedModeModal.tsx`) : 4 étapes simplifiées sans jargon pour orienter n'importe quel profil vers son objectif (Carrière, Campus, Démarches, Logement, Santé, Shop) avec restitution vocale Diallo.
     - **Scanner Universel Multimodal** (`UniversalScannerModal.tsx`) : OCR, extraction de documents administratifs, traduction visuelle, scan de QR codes et envoi direct aux modules et experts.
     - **Traduction Bilingue Directe** (`BilingualConversationModal.tsx`) : Interface face-à-face interactive avec détection de langue et lecture audio pour faciliter les échanges terrain.
     - **Composants Actionable AI** (`ActionableAISuggestion.tsx`) : Remplacement des simples blocs de texte par des recommandations avec boutons d'action immédiate (« Améliorer maintenant », « Voir pourquoi », « Plus tard »).
     - **Fiches de Connaissance & Synthèses Claires** (`KnowledgeCard.tsx`, `AISynthesisCard.tsx`) : Transformation des cours, lives, conseils et réunions en fiches mémorisables (« Ce qu'il faut retenir », « Sources vérifiées », « Décisions », « Actions »).
     - **Modes Concentration & Présentation** (`FocusAndPresentationControls.tsx`) : Épuration visuelle pour les sessions d'étude ou la projection devant un recruteur.
     - **Hub Unifié des Paramètres & Connecteurs** (`UnifiedSettingsModal.tsx`) : Gestion centralisée de la typographie, des contrastes, de la synthèse vocale et des connecteurs Google Workspace.
     - **Galerie & Vitrine du Design System** (`ComponentShowcaseModal.tsx`) : Documentation interactive de l'ensemble des composants et tokens.
* **Décision retenue** : Option 2 développée et intégrée dans la navigation principale et le `Layout`.
* **Justification** : « Le Monde à Vous doit réduire la fracture numérique, pas l'augmenter. Une décision importante à la fois. »
* **Conséquences** : Accessibilité totale WCAG AA, réduction radicale de la charge cognitive et amélioration substantielle de la vitesse d'action de l'utilisateur.
* **Éléments techniques** : `components/accessibility/GuidedModeModal.tsx`, `components/scanner/UniversalScannerModal.tsx`, `components/translation/BilingualConversationModal.tsx`, `components/ui/ActionableAISuggestion.tsx`, `components/ui/KnowledgeCard.tsx`, `components/ui/AISynthesisCard.tsx`, `components/ui/SmartConfirmModal.tsx`, `components/ui/FocusAndPresentationControls.tsx`, `components/settings/UnifiedSettingsModal.tsx`, `components/ui/ComponentShowcaseModal.tsx`, `components/Layout.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-016] — 27 Août 2026
* **Module(s)** : `DesignSystem`, `UIConstitution`, `MasterDocumentation`, `Handoff`, `GoldenScreens`, `ProductGlossary`
* **Problème / Besoin initial** : Franchir le jalon officiel **PREMIUM EXPERIENCE V1**, figer les fondations ergonomiques et graphiques sans brider l'innovation future, formaliser la constitution UI en 26 sections, établir le glossaire sémantique unifié, cartographier l'ensemble des écrans et Golden Screens et préparer le dossier de passation et de consolidation pour Claude Code.
* **Idées envisagées** :
  1. Continuer sans documenter ni figer les règles, au risque de voir de futurs intervenants réintroduire d'anciennes palettes, du jargon robotique ou 18 boutons plats dans la barre de navigation.
  2. Créer une suite documentaire maîtresse normée et opposable :
     - **Manifeste de l'Expérience Premium** (`docs/PREMIUM_EXPERIENCE_MANIFEST.md`) répondant aux 5 questions fondatrices.
     - **Design System V1 & UI Constitution** (`docs/DESIGN_SYSTEM_V1.md`) structuré en 26 sections exhaustives.
     - **Glossaire Produit Officiel** (`docs/GLOSSAIRE_PRODUIT.md`) instaurant la règle « Une fonction = Un nom unique » et interdisant les termes bots/IA.
     - **Inventaire des Écrans & Matrice de Cohérence** (`docs/INVENTAIRE_ECRANS_ET_MATRICE.md`).
     - **Golden Screens & Rapport Avant/Après** (`docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`).
     - **Registre des Composants & Changelog UX** (`docs/UX_CHANGELOG.md`).
     - **Registre de la Dette de Design** (`docs/DESIGN_DEBT_REGISTER.md`).
     - **Dossier de Passation Claude Code** (`docs/HANDOFF_CLAUDE_CODE.md`).
     - **Mise à jour du Livre de Vision** (`docs/LIVRE_DE_VISION.md`) avec la philosophie UX (*« Cacher la complexité technique et révéler progressivement ce qui aide l’utilisateur à atteindre son objectif »*).
* **Décision retenue** : Option 2 intégralement exécutée et connectée au système central de mémoire.
* **Justification** : « La qualité de la plateforme est celle de son maillon visuel le plus faible. Figer les fondations permet d'accélérer l'innovation sans jamais régresser. »
* **Conséquences** : Référentiel opposable pour tous les futurs développements, cohérence absolue entre les 14 modules et passation transparente vers Claude Code.
* **Éléments techniques** : `/docs/PREMIUM_EXPERIENCE_MANIFEST.md`, `/docs/DESIGN_SYSTEM_V1.md`, `/docs/GLOSSAIRE_PRODUIT.md`, `/docs/INVENTAIRE_ECRANS_ET_MATRICE.md`, `/docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`, `/docs/UX_CHANGELOG.md`, `/docs/DESIGN_DEBT_REGISTER.md`, `/docs/HANDOFF_CLAUDE_CODE.md`, `/docs/LIVRE_DE_VISION.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.




