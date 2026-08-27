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

### [DEC-2026-012] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Sauvegarde, Versioning & Restauration Intelligente`, `Gouvernance des Versions Stables`
* **Problème / Besoin initial** :
  1. Mettre en place un système complet de sauvegarde, de restauration et de gestion des versions dans l'espace Super-Admin.
  2. Conserver au minimum les trois dernières versions stables de la plateforme, avec leur numéro de version, date de publication, changelog détaillé, checksums d'intégrité et statut opérationnel.
  3. Concevoir une restauration intelligente qui ne remet **JAMAIS** la plateforme à zéro : préservation intégrale garantie de toutes les données utilisateurs (comptes, profils, messages, médias, paramètres, rôles RBAC, publications, soldes Ⓒ, statistiques, logs d'audit), sans interruption majeure de service.
  4. Garantir la sécurité absolue avant toute restauration : création automatique d'un instantané (point de récupération pré-restauration) et vérification préalable de la compatibilité du schéma de base de données.
  5. Offrir depuis le tableau de bord Super-Admin la visualisation de l'historique des versions, la comparaison différentielle entre versions, la restauration en un clic avec dialogue de confirmation et sélection des données à préserver, la planification personnalisable des sauvegardes automatiques, et l'annulation immédiate (Undo / Rollback) de la dernière restauration.
* **Idées envisagées** :
  1. Utiliser un simple dump/restore brut de `localStorage` risquant d'écraser les comptes et les profils créés ultérieurement.
  2. Implémenter une architecture de versioning souveraine et de fusion intelligente (`intelligentRestore` dans `adminConfigService.ts`) avec préservation granulaire des entités vivantes, vérification de compatibilité de schéma (`verifyDatabaseCompatibility`), registre formel des versions stables (`getStableVersions`), création automatique de snapshot de sécurité pré-restauration, mécanisme d'annulation en 1 clic (`undoLastRestore`), planificateur automatisé (`BackupScheduleConfig`) avec élagage automatique, comparateur différentiel (`compareVersions`), et interface Super-Admin modulaire (`AdminWorkflowsAndBackupTab.tsx`).
* **Décision retenue** : Option 2.
* **Justification** : Sécurité absolue des données des citoyens et utilisateurs, continuité d'exploitation sans perte d'information, traçabilité des montées de version et conformité stricte aux exigences de souveraineté et de déploiement universel (GitHub, Netlify, Cloud Run, Supabase).
* **Conséquences** : Les opérations de maintenance et de retour de version peuvent être menées en toute confiance par le Super-Admin en un clic sans risque de réinitialisation destructrice ni d'écran blanc.
* **Éléments techniques** : `types.ts` (`PlatformReleaseVersion`, `BackupSnapshotRecord`, `BackupScheduleConfig`, `RestoreOperationResult`, `VersionComparisonResult`), `services/adminConfigService.ts`, `components/admin/AdminWorkflowsAndBackupTab.tsx`, `docs/HISTORIQUE_VERSIONS.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-011] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Gestion des Utilisateurs & RBAC`, `Supabase Realtime & Auth Sync`
* **Problème / Besoin initial** :
  1. Garantir que chaque compte créé ou connecté via Supabase (ou en session locale) apparaisse automatiquement et sans aucune exception dans le tableau de bord Super-Admin en temps réel.
  2. Fournir des capacités d'administration complètes : gestion individuelle de chaque compte, approbation, suspension, réactivation, suppression, attribution des rôles et privilèges granulaires RBAC, ajustement des crédits Ⓒ avec motif d'audit, consultation de l'historique et des journaux d'audit, et exports CSV/JSON.
  3. Identifier et corriger automatiquement tout problème de compte existant non visible ou corrompu grâce à un moteur de diagnostic, déduplication et réconciliation automatique des comptes sans casser l'existant et en restant 100% compatible GitHub, Netlify et Cloud Run.
* **Idées envisagées** :
  1. Faire un simple rechargement manuel de la table `profiles` sans écouteur temps réel ni mécanisme d'auto-réparation.
  2. Mettre en place un système complet de synchronisation bi-directionnelle et temps réel avec Supabase (`subscribeToProfilesRealtime`), enrichir `adminConfigService` avec `registerOrSyncUser`, `syncWithSupabase` et `reconcileAndRepairAllAccounts`, connecter les cycles de vie d'authentification (`Auth.tsx`, `App.tsx`, `onAuthStateChange`), et concevoir une interface de gestion d'utilisateurs ultra-complète (`AdminUsersTab.tsx`) avec indicateur d'état cloud en direct, bouton de synchronisation forcée, bouton de diagnostic/réparation, filtrage multicritère (rôle, statut, origine, KYC, tri), modales d'édition complète des privilèges RBAC, modal d'historique d'audit et modal d'ajustement de crédits.
* **Décision retenue** : Option 2.
* **Justification** : Zéro compte invisible ou perdu, visibilité instantanée dès l'inscription ou la connexion, protection absolue du Super-Admin (`visionsmart224@gmail.com`), intégrité des données garantie même en cas de coupure réseau (dégradation gracieuse Local-First) et conformité totale avec les directives d'infrastructure.
* **Conséquences** : Tout utilisateur créé ou connecté via Supabase ou session locale est réconcilié, indexé et visible en temps réel par le Super-Admin avec traçabilité intégrale.
* **Éléments techniques** : `types.ts`, `services/supabaseClient.ts`, `services/adminConfigService.ts`, `components/admin/AdminUsersTab.tsx`, `components/Auth.tsx`, `App.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-010] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `01_DIALLO_OS_ET_EXPERTS`, `Espace Super-Admin Souverain`, `AI Resilience & Orchestration Hub`
* **Problème / Besoin initial** :
  1. Concevoir une architecture auto-résiliente avec bascule automatique (failover) sans interruption entre plusieurs fournisseurs d'IA (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Mistral, xAI Grok, Alibaba Qwen, Moonshot Kimi, OpenRouter, Replicate, Hugging Face, Ollama Local/Souverain, etc.).
  2. Fournir dans le tableau de bord Super-Admin un gestionnaire unique permettant de connecter, activer, désactiver, prioriser par rangs (#1, #2, etc.), tester en direct et surveiller tous les fournisseurs majeurs.
  3. Définir des règles de gouvernance strictes : chaînes de secours, seuils de qualité minimaux (exclusion automatique de tout fournisseur sous le seuil), plafonds de latence tolérée, seuils budgétaires et mise en quarantaine automatique après N échecs consécutifs avec réadmission et retour automatique au meilleur fournisseur (failback).
* **Idées envisagées** :
  1. S'appuyer uniquement sur le SDK Gemini avec un simple try/catch renvoyant une chaîne statique en cas d'erreur.
  2. Bâtir un moteur d'orchestration et de résilience complet (`services/aiRoutingService.ts`), transformer `services/ai.ts` en une façade transparente compatible avec l'ensemble des modules existants, étendre les types (`AIProviderConfig`, `AIRoutingPolicyConfig`, `AIFailoverEvent`, `AIExecutionResult`), enrichir `adminConfigService` avec toutes les opérations de contrôle (réordonnancement, quarantaine, réadmission, test de sonde, ajout custom), et créer un hub de contrôle d'administration haut de gamme (`components/admin/AdminAIResilienceHub.tsx`) doté de 4 sous-vues : Cartes de contrôle des nœuds, Gouvernance & Seuils, Banc d'essai interactif de simulation de bascule en direct, et Journal d'audit des bascules.
* **Décision retenue** : Option 2.
* **Justification** : Zéro dépendance bloquante à un fournisseur d'IA unique, continuité absolue de service pour l'ensemble des 14 modules de la plateforme même en cas de panne mondiale d'un fournisseur ou de restriction de quota (429/500/timeout), et supervision souveraine en direct par le Super-Admin.
* **Conséquences** : Zéro écran blanc, dégradation gracieuse souveraine garantie, persistance des configurations, auditabilité totale des requêtes et compatibilité intégrale avec Supabase, GitHub et Netlify.
* **Éléments techniques** : `types.ts`, `services/aiRoutingService.ts`, `services/ai.ts`, `services/adminConfigService.ts`, `components/admin/AdminAIResilienceHub.tsx`, `components/admin/AdminAIAndModulesTab.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-009] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Mobile UX & Smart Dock`, `Mooc Chat Floating`
* **Problème / Besoin initial** :
  1. Mise en place d'un espace Super-Admin souverain complet pilotable depuis la plateforme avec attribution automatique de tous les privilèges au compte `visionsmart224@gmail.com` lors de son authentification via Supabase (sans jamais coder de mot de passe en dur). L'espace devait permettre la gestion complète des utilisateurs (RBAC, suspension, suppression, promotion/rétrogradation admin), la modération des contenus et signalements, les paramètres globaux (Live, Commerce, MokTrust, etc.), l'orchestration IA et les sauvegardes.
  2. Sur mobile, le bouton flottant du Mooc Chat était masqué ou en collision avec le menu latéral / barre de navigation dock inférieure (`bottom dock`). Nécessité d'un audit complet de l'interface mobile pour éliminer tout chevauchement ou blocage d'interactions.
* **Idées envisagées** :
  1. Utiliser un simple flag local dans le state React pour l'admin et cacher le bouton chat sur mobile.
  2. Créer une suite administrative complète et modulaire (`components/AdminDashboard.tsx`, `components/admin/*`, `services/adminConfigService.ts`) connectée à Supabase avec dégradation gracieuse locale, et refondre le positionnement responsive du Mooc Chat (`bottom-24 right-4 md:bottom-6 md:right-6`), du smart dock mobile (`pointer-events-none` sur le wrapper / `pointer-events-auto` sur le dock avec gestion de safe-area iOS/Android `pb-[max(0.75rem,env(safe-area-inset-bottom))]` et `pb-36` sur le viewport principal), ainsi que l'ajustement du scroll horizontal sur les onglets et boîtes de dialogue.
* **Décision retenue** : Option 2.
* **Justification** : Sécurité absolue, absence totale de mot de passe dans le code, conformité Supabase Cloud, flexibilité totale sur mobile avec accès immédiat au Mooc Chat sans aucun masquage par le dock.
* **Conséquences** : Navigation mobile fluide, zéro collision de z-index, accès super-admin protégé et 100% opérationnel pour `visionsmart224@gmail.com`.
* **Éléments techniques** : `components/AdminDashboard.tsx`, `components/admin/`, `services/adminConfigService.ts`, `components/Layout.tsx`, `components/MoocChatFloating.tsx`, `components/DialloOS.tsx`, `components/settings/BrandColorLabModal.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-008] — 27 Août 2026
* **Module(s)** : `11_STUDIO_ET_CREATION`, `Co-Création & Collaboration`, `Partage d'Actifs`
* **Problème / Besoin initial** : Intégrer dans le Studio créatif une suite d'outils collaboratifs complète comprenant le partage fluide de contenu multimédia (images, vidéos, analyses vision, scripts d'avatars), la création et gestion de cercles/groupes de discussion thématiques, et des espaces de co-création d'articles ou de projets en équipe avec répartition des tâches, gestion d'étapes et boîte à idées communautaires.
* **Idées envisagées** :
  1. Créer un écran externe séparé du Studio.
  2. Intégrer un onglet dédié « Co-Création & Collaboration » au sein de `components/Studio.tsx`, complété par des boutons d'actions directes « Partager dans le Hub Collaboratif » sur chaque résultat généré (image, vidéo, vision, avatar) et un composant modulaire `components/StudioCollaboration.tsx` doté de 4 sous-espaces spécialisés (Projets & Articles, Cercles de Discussion, Bibliothèque de Ressources Partagées, Boîte à Idées).
* **Décision retenue** : Option 2. Typage complet dans `types.ts` (`StudioTab`, `CoCreationProject`, `DiscussionCircle`, `SharedStudioResource`, `CommunityCollaborationIdea`), implémentation de `components/StudioCollaboration.tsx` avec persistance locale et dégradation gracieuse, et liaison bidirectionnelle dans `components/Studio.tsx`.
* **Justification** : Expérience utilisateur fluide et unifiée dans le Studio : un créateur peut générer un média par IA et l'envoyer directement en un clic dans la bibliothèque d'actifs partagés ou le lier à un projet de co-création sans changer de contexte.
* **Conséquences** : Zéro régression sur la génération multimédia existante, compatibilité totale Netlify et déploiement cloud sans écran blanc.
* **Éléments techniques** : `types.ts`, `components/Studio.tsx`, `components/StudioCollaboration.tsx`, `docs/modules/11_studio_et_creation.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-007] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Identité & Profils`, `Auth`, `Mok Social`
* **Problème / Besoin initial** : L'authentification devait reposer entièrement et exclusivement sur Supabase (en remplacement complet de Firebase) avec une suite complète : inscription avec création immédiate de profil (nom complet, avatar certifié, titre, bio, localisation, passeport citoyen), connexion, mot de passe oublié, réinitialisation de mot de passe, renvoi d'email de confirmation, gestion sécurisée du « Se souvenir de moi », synchronisation de session au démarrage, et liaison directe des publications du fil d'actualité au profil réel de l'auteur.
* **Idées envisagées** :
  1. Conserver un flux hybride combinant Firebase Auth et Supabase DB.
  2. Implémenter une suite complète Supabase Auth (`signUp`, `signIn`, `resetPasswordForEmail`, `updateUserPassword`, `resendVerificationEmail`, `getSession`, `onAuthStateChange`, `signInWithOAuth`) avec création automatique d'un profil dans `public.profiles` dès la première connexion/inscription, et synchronisation bi-directionnelle avec le `GlobalContext` et `App.tsx`.
* **Décision retenue** : Option 2. Refonte intégrale de `components/Auth.tsx` et enrichissement de `services/supabaseClient.ts` et `App.tsx`.
* **Justification** : Conformité stricte aux directives de souveraineté et d'architecture sans écran blanc, persistance de session robuste et attribution garantie des publications aux profils réels des utilisateurs.
* **Conséquences** : Toutes les actions sociales (création de post, commentaires, réactions, consultation de profil) utilisent l'identité réelle de l'utilisateur connecté sans aucun placeholder générique.
* **Éléments techniques** : `components/Auth.tsx`, `services/supabaseClient.ts`, `App.tsx`, `components/SocialFeed.tsx`, `contexts/GlobalContext.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-006] — 27 Août 2026
* **Module(s)** : `10_RESEAU_ET_COMMUNAUTE_MOK`, `14_SECURITE_ET_INFRASTRUCTURE`, `Identité & Profils`, `Mok Social`
* **Problème / Besoin initial** : Mettre en place un système complet et authentique d'identité utilisateur et de profils réels. Chaque utilisateur doit posséder une identité unique (photo, nom, bio, localisation, passeport) prise en compte dans toute l'application (fil d'actualité, publications avec identité réelle, annuaire des membres, messagerie privée directe), avec persistance cloud Supabase et dégradation locale fluide.
* **Idées envisagées** :
  1. Maintenir un profil mock statique dans les constantes.
  2. Créer une architecture d'identité dynamique reliant `GlobalContext`, `Settings`, `Profile`, `SocialFeed`, `MemberProfileModal` et `MoocChatFloating` avec persistance bidirectionnelle Supabase (tables `profiles`, `community_posts`, `chat_conversations`, `chat_messages`) et session locale sécurisée (`localStorage`).
* **Décision retenue** : Option 2. Schéma SQL exhaustif dans `docs/supabase_schema.sql`, typage enrichi dans `types.ts` et `supabaseClient.ts`, synchronisation dynamique dans `GlobalContext.tsx`, et refactorisation de `SocialFeed.tsx` et `Settings.tsx`.
* **Justification** : Élimine toute ambiguïté sur l'identité de l'auteur d'une publication, assure une recherche et consultation fluide des profils membres, et connecte directement la messagerie et les publications au backend Supabase.
* **Conséquences** : Les publications créées portent toujours l'identité exacte de l'utilisateur connecté ; les modifications de profil dans les Paramètres se répercutent instantanément dans l'ensemble de l'écosystème.
* **Éléments techniques** : `docs/supabase_schema.sql`, `types.ts`, `services/supabaseClient.ts`, `contexts/GlobalContext.tsx`, `components/SocialFeed.tsx`, `components/Settings.tsx`, `components/Profile.tsx`, `components/MoocChatFloating.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-005] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Socle Global`, `AGENTS.md`, `GEMINI.md`
* **Problème / Besoin initial** : Garantir la portabilité et le déploiement continu immédiat sur GitHub, Netlify, Cloud Run et Vercel sans jamais risquer d'écran blanc (*White Screen of Death*), et standardiser Supabase comme backend par défaut sans dépendance bloquante à Firebase.
* **Idées envisagées** :
  1. Maintenir Firebase couplé avec des initialisations directes au chargement de module.
  2. Adopter Supabase comme backend cloud par défaut, découpler tous les services avec initialisation lazy à la demande (`getClient()`), fallback gracieux (Local-First IndexedDB) et passage exclusif des clés via variables d'environnement.
* **Décision retenue** : Intégration de la directive permanente dans `AGENTS.md` et `GEMINI.md`, création du service résilient `services/supabaseClient.ts`, sécurisation lazy de `services/googleWorkspace.ts` et génération de `.env.example`.
* **Justification** : Résilience absolue au démarrage, zéro écran blanc même en l'absence temporaire de variables d'environnement, portabilité GitHub/Netlify immédiate.
* **Conséquences** : Tout futur projet et module utilise Supabase par défaut sans bloquer le rendu React.
* **Éléments techniques** : `AGENTS.md`, `GEMINI.md`, `.env.example`, `services/supabaseClient.ts`, `package.json` (`@supabase/supabase-js`).
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-004] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `07_JURIDIQUE_ET_ADMINISTRATION`, `Administration Centrale`
* **Problème / Besoin initial** : L'administrateur général avait besoin de piloter l'intégralité de la plateforme (utilisateurs, rôles RBAC, fournisseurs IA, clés API, modèles de lettres, signatures autographes, cachets/sceaux, workflows A➔B, sauvegardes et journaux) sans jamais toucher au code.
* **Idées envisagées** :
  1. Panneaux de configuration dispersés dans le code ou les fichiers de constantes.
  2. Tableau de bord centralisé no-code avec persistance Local-First réactive, bibliothèque d'actes officiels, moteur de résolution de variables et prévisualisation haute fidélité en temps réel avec export PDF/impression.
* **Décision retenue** : Création du Service Central `adminConfigService.ts` et du tableau de bord modulaire `AdminDashboard.tsx` découpé en 6 sous-modules spécialisés (`AdminOverviewTab`, `AdminUsersTab`, `AdminAIAndModulesTab`, `AdminTemplatesAndStampsTab`, `AdminWorkflowsAndBackupTab`, `AdminLogsAndBroadcastTab`, `OfficialLetterPreviewModal`).
* **Justification** : Autonomie opérationnelle totale du Super-Administrateur, conformité institutionnelle des lettres générées, gouvernance de sécurité et traçabilité audit complète.
* **Conséquences** : Uniformisation des actions primaires (fond bleu, texte blanc), sauvegarde instantanée en Snapshot JSON, gestion des quotas de crédits Ⓒ et validation KYC.
* **Éléments techniques** : `services/adminConfigService.ts`, `components/AdminDashboard.tsx`, `components/admin/*`, `types.ts`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

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

### [DEC-2026-020] — 27 Août 2026
* **Module(s)** : `Super Admin`, `Gestion des Versions`, `Sauvegarde & Restauration Intelligente`, `Supabase Client`, `Résilience Déploiement`
* **Problème / Besoin initial** :
  1. Corriger l'erreur de build suite à la refactorisation de Supabase (`supabaseService` manquant).
  2. Mettre en place un système complet de sauvegarde, de restauration et de gestion des versions dans l'espace Super Admin : conservation d'au minimum les trois dernières versions stables (numéro, date, changelog, statut), restauration intelligente préservant l'intégralité des données utilisateurs (comptes, profils, messages, médias, paramètres, rôles, publications, stats, logs), point de récupération automatique pré-restauration, comparaison de versions, planification des sauvegardes, annulation / rollback en 1 clic, compatibilité totale Supabase / GitHub / Netlify avec zéro écran blanc.
* **Idées envisagées** :
  1. Système basique d'export JSON sans gestion d'historique ni préservation sélective.
  2. Architecture souveraine unifiée et certifiée :
     - **Unification Supabase** : `services/supabaseClient.ts` exportant à la fois l'instance `supabase`, l'interface `SupabaseUserProfile` et le singleton `supabaseService` avec toutes les méthodes résilientes et tolérantes aux pannes.
     - **Registre des Versions Stables** : conservation et consultation des versions majeures (v6.3.0, v6.2.0, v6.1.0, v6.0.0) avec métadonnées complètes (schéma, checksum, modules, providers IA, changelog).
     - **Moteur de Restauration Intelligente** : fusion et conservation des collections utilisateurs sans écrasement ni remise à zéro, création systématique d'un instantané automatique `auto_pre_restore` pour retour arrière instantané (Rollback).
     - **Planificateur Automatisé** : configuration de la fréquence (horaire, quotidienne, hebdomadaire), quotas de rétention, synchronisation Cloud Supabase et déclenchement manuel immédiat.
     - **Tableau de Bord Super Admin** : onglet dédié enrichi avec comparateur de versions, filtres d'instantanés, import/export JSON et panneau de rollback d'urgence.
* **Décision retenue** : Option 2 validée, testée et compilée avec succès.
* **Justification** : « Garantit la pérennité absolue des données et la souveraineté totale du Super-Administrateur sur l'évolution du système. »
* **Conséquences** : Zéro régression, build de production vert, résilience totale face aux pannes ou clés manquantes, conservation garantie de toutes les données utilisateurs lors des restaurations.
* **Éléments techniques** : `/services/supabaseClient.ts`, `/services/adminConfigService.ts`, `/components/admin/AdminWorkflowsAndBackupTab.tsx`, `/components/AdminDashboard.tsx`, `/contexts/GlobalContext.tsx`, `/types.ts`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---






