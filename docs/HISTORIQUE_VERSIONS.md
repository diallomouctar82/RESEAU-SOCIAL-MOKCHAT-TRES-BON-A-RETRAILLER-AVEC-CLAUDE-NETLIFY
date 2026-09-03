# ⏱️ HISTORIQUE DES VERSIONS & CHANGELOG MAÎTRE
> **Traçabilité des Versions Déployées, Jalons Majeurs et Matrice d'Impacts**  
> *Plateforme : Le Monde à Vous*

---

## 📈 TABLEAU RÉCAPITULATIF DES VERSIONS

| Version | Date de Déploiement | Thématique Majeure | Modules Impactés | Auteur / Réf | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1.0** | Décembre 2025 | Fondations de la Plateforme & Équipe Diallo | Chat, Experts, Auth | Équipe Fondatrice | Archivé |
| **v2.0** | Janvier 2026 | Hub Social, Live Streams & Campus v1 | Social, Campus, Wallet | Core Team | Archivé |
| **v3.0** | Février 2026 | Diallo OS, Conseil Collégial & Multi-Agents | Experts, Council, Orchestrator | Core Team | Archivé |
| **v4.0** | Mai 2026 | Intégration Google Workspace & Multimodal HUD | Maps, Drive, Meet, Chat, Vision | Core Team | Archivé |
| **v5.0** | Juillet 2026 | Marché Mondial B2B/B2C & Business OS | Shop, Trade OS, RFQ, Salons | Core Team | Archivé |
| **v5.14** | 27 Août 2026 | Accessibilité Universelle & Actionable AI | Guide-moi, Scanner OCR, Traduction bilingue, Fiches savoir | AI Coding Agent | Archivé |
| **v6.0** | 27 Août 2026 | **Jalon Officiel — PREMIUM EXPERIENCE V1** | Design System V1 (26 chapitres), Manifeste, Golden Screens, Handoff | AI Coding Agent | Stable |
| **v6.1** | 27 Août 2026 | **Socle Cloud Supabase Lazy-Init & Persistance Résiliente** | Auth, Supabase Client, Local-First, Zero White Screen | AI Coding Agent | Stable |
| **v6.2** | 27 Août 2026 | **Architecture IA Auto-Résiliente (12 Fournisseurs) & Color Lab** | Super-Admin AI Hub, Failover, Auto-Quarantine, Color Lab | AI Coding Agent | Stable |
| **v6.3** | 27 Août 2026 | **Sauvegarde, Versioning & Restauration Intelligente + Realtime RBAC** | Super-Admin Versioning, Snapshots, Smart Restore, Realtime | AI Coding Agent | Stable |
| **v6.6.2** | 1er Septembre 2026 | **Hotfix Messagerie — Frontière UUID Supabase** | Mooc Chat, historique, Realtime | Codex | **Stable** |
| **v6.6.3** | 1er Septembre 2026 | **Traduction centralisée — Messagerie texte** | Messagerie, Profil, AI Gateway | Vision Smart AI Core / DEC-2026-033 | **Stable** |
| **v6.7.0** | 1er Septembre 2026 | **« Ma langue » harmonisée — texte, vocaux transcrits, interprète d'appel audio/vidéo** | Messagerie, Appels, AI Gateway | PR #42, #43 / DEC-2026-034 | **Stable** |
| **v6.8.0** | 1er Septembre 2026 | **Sonnerie hors application (Web Push serveur), arrêt net multi-appareils, pré-connexion, transcription serveur, identité du propriétaire, module messagerie installable, goutte** | Appels, Messagerie, Edge `push-notify`, Service worker, PWA | PR #44, #45 / DEC-2026-035 | **Stable** |
| **v6.9.0** | 2 Septembre 2026 | **Audio d'appel réellement bidirectionnel — validé sur deux téléphones ; SDK LiveKit épinglé 2.17.3** | Appels, Edge `livekit-token`, `call_diagnostics`, LIVE (LOOP 15/16 fermée) | PR #46 → #53 / DEC-2026-036 | **Stable** |
| **v6.10.0** | 3 Septembre 2026 | **Voix traduite DANS l'appel (piste « interprète »), appel normal par défaut, langue choisie par appel** | Appels, Transport LiveKit, AI Gateway v24 | PR #54, #55 / DEC-2026-037 | **Stable** |
| **v6.11.0** | 3 Septembre 2026 | **Connexion quasi immédiate, traduction dès les premiers mots (identité par onglet, préchauffe AI Gateway v25, case de langue)** | Appels, AI Gateway | PR #56 / DEC-2026-038 | **Stable** |
| **v6.12.0** | 3 Septembre 2026 | **Sonnerie et notification fiables appli fermée, bouton « Sonnerie », appel entrant au premier plan** | Service worker v6.6.0, Push, Messagerie, Appels | PR #57 / DEC-2026-039 | **Stable** |
| **v6.12.1** | 3 Septembre 2026 | **Sécurité base : vue `ai_spend_by_provider` en `security_invoker`, `ai_provider_credentials` retirée des rôles clients (pilote consommateur Vision Smart AI Core, TASK-0014)** | Supabase (orchestrateur IA), Gouvernance AI Core | Migration 20260903094327 / DEC-2026-041 | **Courante (Active)** |

---

## 🔍 DÉTAIL DES DERNIÈRES VERSIONS MAJEURES

> **Numérotation** : à partir de la v6.7.0, chaque mission livrée en production porte une version sémantique `MAJEUR.MINEUR.CORRECTIF` (ADR-0016 Vision Smart AI Core) — une capacité rétrocompatible = MINEUR, une correction seule = CORRECTIF. Les versions v6.7.0 à v6.12.0 ont été consignées le 3 septembre 2026 pour rattraper les fusions du 1er au 3 septembre restées sans entrée (décision DEC-2026-040) ; leurs preuves sont celles des PR citées et de `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md`.

### [Version 6.12.1] — 3 Septembre 2026 (Sécurité base — pilote consommateur Vision Smart AI Core, TASK-0014)
- **Objectif** : fermer le finding CRITIQUE relevé par le Registre d'applications d'AI Core (advisors Supabase : vue `SECURITY DEFINER` contournant la RLS, table de credentials exposée aux rôles clients) sans supprimer de capacité ni toucher au code client.
- **Réalisations** : migration `security_task0014_view_invoker_credentials_revoke` — `security_invoker = true` sur la vue `ai_spend_by_provider`, droits `anon` retirés, `authenticated` limité à `SELECT` (RLS admin-only de `ai_call_log` appliquée), droits `anon`/`authenticated` retirés de `ai_provider_credentials` (RLS et `service_role` intacts). La vue n'est référencée nulle part dans le code client : aucune régression possible côté application.
- **Validation** : impersonation avant/après — `anon` 37 lignes → « permission denied » ; non-admin 37 → 0 ; admin 37 → 37 · advisors 218 → 214 lints, ERROR 1 → 0 · production sondée après migration : `/`, `/manifest.webmanifest`, `/sw.js`, `/messagerie` HTTP 200, bundle `index-Drrg-NBT.js` inchangé.
- **Limite honnête** : la protection contre les mots de passe compromis (Auth) reste à activer dans le tableau de bord Supabase (action propriétaire) ; 208 avertissements génériques subsistent (exposition GraphQL des tables, fonctions `SECURITY DEFINER` admin gardées par `is_admin()`).

---

### [Version 6.12.0] — 3 Septembre 2026 (Sonnerie et notification fiables appli fermée, bouton « Sonnerie », appel entrant au premier plan — mission SN)
- **Objectif** : qu'un appel arrive vraiment quand l'application est fermée ou le téléphone verrouillé (sonnerie, vibration, notification visible), et que l'écran pour décrocher s'impose dès qu'un appel entre.
- **Cause racine prouvée** : `/metadata.json` répond 404 sur Netlify ; l'ancien service worker le pré-cachait à l'installation → installation en échec → aucun worker jamais actif → « Subscription failed - no active Service Worker » ; `push_subscriptions` = 0 en base depuis l'origine.
- **Réalisations** : `public/sw.js` v6.6.0 (installation jamais fatale, réglages de sonnerie lus depuis la Cache API, notification silencieuse ou sans vibration selon les réglages) ; attente du worker actif avant abonnement ; bouton « Sonnerie » après « Annuaire » et panneau `RingingPanel` branché aux réglages existants ; toucher la notification ouvre l'écran d'appel qui sonne (fenêtre existante et lancement à froid), Décrocher 72×72 px, écran au-dessus de toutes les boîtes.
- **Validation** : tsc 0 · vitest 763/763 · build · banc 21/21 · production « avant » (défaut reproduit sur les vrais fichiers servis) puis « après » 43/43 (worker actif sur miroir octet-exact, push réel → notification → écran d'appel, desktop + mobile) · zéro trace (74 clés étrangères balayées = 0).
- **Limite honnête** : la sonnerie sur un vrai téléphone verrouillé se constate par l'utilisateur (aucun service de push dans le bac à sable).

---

### [Version 6.11.0] — 3 Septembre 2026 (Connexion quasi immédiate, traduction dès les premiers mots — mission LT)
- **Objectif** : après le test utilisateur (établissement ~30 s, traduction 20–30 s plus tard), rendre la connexion quasi immédiate et la traduction active dès les premiers mots.
- **Causes mesurées sur 7 appels réels iPhone ↔ Android** : identité LiveKit dupliquée entre deux onglets → éviction en boucle ; lecture audio bloquée faute de geste ; 0,8 s perdu par sonde ; transcripteur redémarré à chaque changement de langue, segments jusqu'à 9 s, piste interprète publiée seulement à la première phrase.
- **Réalisations** : identité LiveKit par onglet, aucune relance sur identité dupliquée (raison nommée), son débloqué dans le geste de décroché ; transcripteur jamais redémarré, segments 550 ms / 6,5 s avec clôture anticipée, piste interprète publiée dès le « hello », passerelle `ai-gateway` v25 préchauffée pendant la sonnerie, phrases en attente fusionnées, case de langue bien visible (« Appel normal » / « Traduction active »).
- **Validation** : banc réel 82/82 (piste publiée 473 ms après le décroché, première voix traduite 7–13 s) · tsc 0 · vitest 737/737 · build · production 24/24 · zéro trace.

---

### [Version 6.10.0] — 3 Septembre 2026 (Voix traduite DANS l'appel, appel normal par défaut, langue par appel — mission VT‑1/VT‑1b)
- **Objectif** : la traduction voix à voix doit être entendue sur de vrais téléphones, pas seulement lue.
- **Constat** : VT‑1 (original coupé quand l'interprète parle, lecture locale) refusé au test utilisateur — la voix HD était générée mais jamais entendue (lecture locale non fiable sur téléphone).
- **Réalisations** : la voix traduite est rendue par l'émetteur et publiée dans l'appel comme piste LiveKit « interprète » (même chemin WebRTC que la voix) ; le récepteur la joue et coupe l'original par `muted` ; appel normal par défaut, traduction activée seulement par le choix « Entendre X en … » pendant la sonnerie ou l'appel, propre à cet appel ; langue détectée prioritaire ; découpeur corrigé (la parole d'avant la pause « l'interprète parle » n'est plus jetée) ; passerelle v24 (lecture dans la bonne langue).
- **Validation** : banc réel 62/62 (son reçu transcrit en français chez l'un, en russe chez l'autre, audio et vidéo) · vitest 730/730 · tsc 0 · build · production 20/20 · zéro trace.

---

### [Version 6.9.0] — 2 Septembre 2026 (Audio d'appel réellement bidirectionnel, validé sur deux téléphones — mission AU)
- **Objectif** : « corrigez le bug d'audio unidirectionnel ».
- **Causes prouvées** : même identité LiveKit pour deux appareils d'un compte (éviction), micro refusé sans message, caméra en échec bloquant le micro, signal d'acceptation perdu = son à sens unique ; puis, contre le binaire `livekit-server` 1.8.4 exact : `livekit-client` ≥ 2.18 = négociation en échec (aucun octet envoyé), 2.17.3 = OK.
- **Réalisations** : identité par appareil (`livekit-token` v4→v5), micro publié avant la caméra, relance bornée, bannière « Réessayer le micro », correspondant = celui qui publie, décroché par média, diagnostics sur compteurs WebRTC réels (`call_diagnostics`), revue contradictoire (caméra jamais rallumée à l'insu de l'utilisateur, appel orphelin terminé), une room par appel, audio préparé au premier geste, SDK épinglé 2.17.3 avec test garde-fou.
- **Validation** : utilisateur sur deux téléphones le 2 septembre 2026 — « l'appel passe correctement et les deux personnes parlent et s'entendent » ; cette même preuve ferme LOOP 15/16 de la mission LIVE. Reste recommandé, non bloquant : montée du serveur LiveKit du VPS de 1.8.4 à 1.13.6.

---

### [Version 6.8.0] — 1er Septembre 2026 (Sonnerie hors application, arrêt net, pré-connexion, transcription serveur, identité, module installable, goutte — mission VF)
- **Objectif** : lever le refus de validation (sonnerie hors app, sonnerie résiduelle, latence, traduction non appliquée sur téléphone, propriétaire non identifié).
- **Réalisations** : serveur Web Push `push-notify` (RFC 8291/8292, clé VAPID au Vault), abonnement push et service worker côté client ; arrêt net multi-appareils (`call_handled_elsewhere`, canal `moknet-calls`, push d'annulation) ; transport connecté dès la sonnerie ; transcription serveur `gemini_stt` (texte + langue + traduction) ; carte du propriétaire, avatar sur mes bulles, sélecteur « Ma langue » fixe dans l'en-tête ; messagerie exportable en module installable (`/messagerie`, manifeste dédié) ; bouton « goutte » (maquette 01 choisie par l'utilisateur parmi 10).
- **Validation** : tsc 0 · vitest 568/568 · build · banc 16/16 · production 26/26 + 7/7 · zéro trace (97 lignes, 70 clés étrangères = 0).

---

### [Version 6.7.0] — 1er Septembre 2026 (« Ma langue » harmonisée — texte, vocaux, appels — missions UL/HL)
- **Objectif** : un seul réglage de langue par personne, appliqué au texte, aux vocaux et aux appels, sans jamais choisir la langue de l'interlocuteur.
- **Réalisations** : sélecteur unique « Ma langue » avec détection automatique de la langue du destinataire, « Par défaut » = aucune traduction ; vocaux transcrits chez l'auteur et traduits chez le lecteur (« Écouter dans ma langue ») ; interprète d'appel audio et vidéo (sous-titres par canal de données, voix dans ma langue) ; profil audio « parole » et qualité réseau réelle affichée.
- **Validation** : vitest 306/306 · tsc 0 · build · preuves réelles ru → fr · production vérifiée en navigateur · zéro trace.

---

### [Version 6.6.3] — 1er Septembre 2026 (Traduction centralisée — Messagerie texte)
- **Objectif** : traduire automatiquement chaque message reçu dans la langue préférée du lecteur sans jamais remplacer ni supprimer le texte original.
- **Réalisations** : service unique `services/translation/translationService.ts`, moteur injectable et remplaçable, passage exclusif par `services/aiGateway.ts`, persistance de la langue source dans `messages.metadata.original_language`, rendu original + traduction dans `ChatMessageItem.tsx`, dégradation gracieuse et traduction différée aux bulles visibles.
- **Validation** : tests unitaires du contrat, du changement de moteur, du cache/dédoublonnage, du repli et tests DOM de l'affichage bilingue ; suite complète et build de production validés.
- **Périmètre exclu** : aucun développement de traduction vocale ; cette seconde fonctionnalité attend la validation explicite de la phase texte.

---

### [Version 6.6.2] — 1er Septembre 2026 (Hotfix Messagerie — Frontière UUID Supabase)
- **Incident** : l'ouverture d'un fil local `chat-u5` déclenchait un `GET /rest/v1/messages?...conversation_id=eq.chat-u5` rejeté en HTTP 400 / PostgreSQL `22P02`, car `conversation_id` attend un UUID.
- **Correction** : la messagerie conserve le fil local à l'écran mais arrête le chemin avant le chargement d'historique, le marquage de lecture et les abonnements Realtime tant que l'identifiant n'est pas un UUID réel.
- **Preuves** : 2 tests d'intégration dédiés, 256/256 tests globaux, build Vite réussi, prévisualisation Netlify publique `ready`, scan de secrets Netlify vide.
- **Périmètre** : 1 composant, 1 test; aucune migration, aucune donnée et aucun module hors messagerie.

---

### [Version 6.3] — 27 Août 2026 (Sauvegarde, Versioning, Restauration Intelligente & Realtime RBAC)
- **Objectif** : Mettre en place un système complet de sauvegarde, gestion des versions, comparaison et restauration intelligente sans perte de données dans l'espace Super Admin, avec synchronisation Realtime bidirectionnelle et diagnostic automatique des comptes.
- **Réalisations & Livrables** :
  - **Gestionnaire des Versions Stables** : Conservation garantie des 3 dernières versions stables (v6.3.0, v6.2.0, v6.1.0, v6.0.0) avec numéros, dates, changelogs détaillés, checksums et statuts.
  - **Moteur de Restauration Intelligente** : Restauration en 1 clic sans remise à zéro, préservation intégrale des comptes, profils, soldes Ⓒ, rôles et logs d'audit.
  - **Point de Récupération Automatique** : Instantané de sécurité généré immédiatement avant chaque restauration, avec bouton d'annulation (Undo / Rollback) en un clic.
  - **Planificateur Automatisé de Sauvegardes** : Fréquence personnalisable (quotidienne, hebdomadaire, horaire), heure d'exécution, rétention max et élagage automatique.
  - **Outil de Comparaison Différentielle** : Diff side-by-side entre deux versions (évolutions de fonctionnalités, schémas, et capacités IA).
  - **Synchronisation Realtime & Diagnostic des Comptes** : Abonnement en direct à la table `profiles` de Supabase, déduplication et réconciliation automatique (`reconcileAndRepairAllAccounts`).
  - **Compatibilité Universelle** : 100% compatible GitHub, Netlify, Cloud Run et Supabase, sans écran blanc.


### [Version 6.0] — 27 Août 2026 (Jalon Officiel — PREMIUM EXPERIENCE V1)
- **Objectif** : Figer le socle graphique et ergonomique officiel, consacrer les Golden Screens, rédiger le Manifeste et préparer le dossier de consolidation pour Claude Code.
- **Réalisations & Livrables** :
  - **Manifeste de l'Expérience Premium** (`docs/PREMIUM_EXPERIENCE_MANIFEST.md`) : 5 questions fondatrices et 8 principes d'or (*« Simple devant, intelligente derrière. Nous nous adaptons à vous, pas l'inverse »*).
  - **Design System V1 & UI Constitution** (`docs/DESIGN_SYSTEM_V1.md`) : 26 sections complètes (Tokens, Typographie Outfit/Plus Jakarta Sans, Couleurs Navy/Orange, Composants, Accessibilité WCAG AA, Motion, Sécurité).
  - **Glossaire Produit Officiel** (`docs/GLOSSAIRE_PRODUIT.md`) : Règle « Une fonction = Un nom unique », interdiction des termes IA/bots génériques.
  - **Inventaire des Écrans & Matrice de Cohérence** (`docs/INVENTAIRE_ECRANS_ET_MATRICE.md`) : Cartographie des 14 modules et 100% de conformité Premium V1.
  - **Golden Screens & Rapport Avant/Après** (`docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`) : 6 écrans de référence et mesures de réduction de charge cognitive.
  - **Registre des Composants & Changelog UX** (`docs/UX_CHANGELOG.md`).
  - **Registre de la Dette de Design** (`docs/DESIGN_DEBT_REGISTER.md`).
  - **Dossier de Passation & Consolidation Claude Code** (`docs/HANDOFF_CLAUDE_CODE.md`).
  - **Mise à Jour du Livre de Vision** (`docs/LIVRE_DE_VISION.md`).
- **Impact** : Expérience intemporelle, institutionnelle, humaniste et opposable, prête pour l'audit et la montée en charge.

---

### [Version 5.13] — 27 Août 2026 (Réorganisation Navigation 5 Piliers Humains & Hub Transversal)
- **Objectif** : Transformer une navigation technique aplatie en une expérience d'accomplissement humain structurée, intuitive, rapide et accessible.
- **Modifications Réalisées** :
  - **Structure en 5 Piliers de Besoins Humains** :
    1. *Accueil & Cap* (`Accueil`, `Mon Parcours de Vie`)
    2. *Apprendre & Évoluer* (`Campus & Éducation`, `Langues & Immersion`, `Carrière & Accomplissement`)
    3. *Vie & Services* (`Santé & Bien-être`, `Habitat & Installation`, `Finance & Wallet`, `Mes Démarches`, `Droit & Juridique`, `Mobilité & Expatriation`)
    4. *Créer & Entreprendre* (`Studio Créatif`, `Marché Mondial`)
    5. *Communauté & Conseil* (`Réseau MOC`, `Experts Diallo`, `Conseil des Sages`)
  - **Intégration Transversale Google Suite** : Retrait des applications Google isolées au 1er niveau ; création du Hub des Capacités Transversales (`TransversalServicesModal.tsx`) et badges contextuels.
  - **Recherche Universelle & Command Palette (`⌘K`)** : Recherche globale et commande vocale avec reconnaissance automatique d'intentions (`UniversalSearchModal.tsx`).
  - **Orientation par Objectifs (« Mon Cap »)** : Gabarits d'accomplissement avec étapes et assignation d'experts d'élite (`GoalOrientationModal.tsx`).
  - **Système de Favoris & Récents** : Épinglage direct avec persistance locale et mémorisation automatique des 4 derniers espaces consultés.
  - **Dock & Drawer Mobile Optimisés** : Barre d'accès rapide 5 boutons et tiroir accordéon fluide.
- **Impact** : Clarté immédiate pour l'utilisateur, temps d'accès aux modules divisé par deux, zéro régression sur les fonctionnalités existantes.

---

### [Version 5.12] — 27 Août 2026 (Carrière 7/7 : Consolidation Finale & Cycle Perpétuel d'Accomplissement)
- **Objectif** : Transformer les 6 étapes de Carrière en un seul système unifié, vivant, fluide et simple. L'accompagnement ne s'arrête jamais à l'action ou au résultat : il continue jusqu'à l'accomplissement réel, puis transforme ce résultat en un nouveau point de départ.
- **Modifications Réalisées** :
  - **Dossier Maître Unique (`CareerMasterDossier`)** : Unification complète de la mémoire de carrière (Identité, Objectif A➔B, Journal de bord, Permissions, Métriques).
  - **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** : Génération narrative du parcours (`generateCareerNarrative`) et arbitrage universel de la meilleure action (`askUniversalNextAction`).
  - **Centre de Commande Unifié (`CareerMasterCommandHub.tsx`)** : Cockpit central avec bascule instantanée entre le Mode Simple (Action du jour épurée) et le Mode Avancé (7 piliers complets).
  - **10 Modals & Commandes d'Accomplissement** :
    1. *« Raconte-moi mon parcours »* (`CareerNarrativeStoryModal.tsx`) : Récit valorisant et continu avec lecteur audio.
    2. *« Que dois-je faire maintenant ? »* (`CareerWhatShouldIDoModal.tsx`) : 3 meilleurs leviers du jour avec gains attendus et déclenchement direct.
    3. *« J'ai une urgence »* (`CareerEmergencyModal.tsx`) : Diagnostic commando express (entretien dans 1h, dossier ce soir, offre à négocier).
    4. *Mode Célébration & Nouveau Cap* (`CareerAccomplishmentCelebrationModal.tsx`) : Consécration du Point B, capitalisation des preuves et réenclenchement d'un nouveau cycle (90j, Nouvelle ambition, Pivot, International).
    5. *Centre de Contrôle & Permissions IA* (`CareerAgentPermissionsLogsModal.tsx`) : Matrice de souveraineté, suspension immédiate d'urgence et logs d'audit.
    6. *Onboarding Conversationnel Intelligent* (`CareerConversationalOnboardingModal.tsx`) : Cadrage fluide sans formulaire.
    7. *Recherche Universelle Carrière* (`CareerUniversalSearchModal.tsx`) : Indexation globale (dossiers, CVs, contacts, compétences, cours).
    8. *Test de Cohérence du Cap* (`CareerCoherenceAuditModal.tsx`) : Alignement des actions quotidiennes sur le Point B.
    9. *Opportunités Surprises* (`CareerSurpriseOpportunityModal.tsx`) : Décloisonnement sectoriel par compétences transférables.
    10. *Mon Impact & Transmission* (`CareerImpactTransmissionModal.tsx`) : Boucle d'utilité collective (*Apprendre ➔ Progresser ➔ Accomplir ➔ Transmettre*).
- **Impact** : Expérience fluide, zéro dispersion cognitive, souveraineté totale de l'utilisateur sur son agent et accompagnement pérenne tout au long de sa vie professionnelle.

---

## 🔍 DÉTAIL DES DERNIÈRES VERSIONS MAJEURES

### [Version 5.11] — 27 Août 2026 (Carrière 6/7 : Intelligence Stratégique & Trajectoires Prédictives)
- **Objectif** : Ne plus seulement accompagner la carrière actuelle de l'utilisateur : comprendre son évolution, anticiper les changements, détecter les meilleures trajectoires possibles et l'aider à accélérer vers son Point B via la formule `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER`.
- **Modifications Réalisées** :
  - **Hub Central d'Intelligence Stratégique** (`CareerStrategicAdvisorHub.tsx`) : Cockpit en 8 piliers articulé avec alertes d'orientation, calcul du rythme et accès aux modales d'ingénierie.
  - **Boussole Stratégique 4D** (`CareerStrategicCompassModal.tsx`) : 4 cadrans interactifs (Point A, Point B, Marché, Action Immédiate) avec mode d'accélération vs équilibre.
  - **Simulateur de Trajectoires Comparatif & Scénarios « Et si ? »** (`CareerTrajectorySimulatorModal.tsx`) : Comparaison de 5 voies (Verticale, Spécialisation, Management, Entrepreneuriat, Expatriation) et simulation de gains temporels/financiers.
  - **Skill Graph & Cartographie des Écarts** (`CareerSkillGraphGapModal.tsx`) : 6 catégories de compétences avec niveaux de preuve (déclarée à confirmée) et passerelles Campus.
  - **Passeport de Compétences & Mode Reconversion** (`CareerSkillsPassportModal.tsx`) : Détection des compétences transférables vers de nouveaux secteurs sans repartir de zéro.
  - **Plans d'Évolution 90 Jours & 1 An** (`CareerEvolutionPlansModal.tsx`) : Feuilles de route cadencées mois par mois et trimestres T1-T4.
  - **Diagnostic de Plateau & « Débloque ma situation »** (`CareerPlateauUnlockModal.tsx`) : Détection des stagnations et calcul du Levier N°1 d'accélération.
  - **Conseil de Carrière Multi-Experts** (`CareerMultiExpertCouncilModal.tsx`) : Orchestration collégiale des 4 experts de la Famille Diallo avec synthèse unifiée.
  - **Matrice de Décision Personnelle & Arbitrage d'Opportunités** (`CareerDecisionMatrixModal.tsx`) : Pondération de 7 valeurs de vie pour arbitrer entre plusieurs offres.
  - **Bilan de Carrière IA Généré** (`CareerAIBilanModal.tsx`) : Synthèse complète des réalisations et orientations du prochain cycle.
  - **Visualisation Chronologique « Mon Évolution »** (`CareerEvolutionTimelineModal.tsx`) : Timeline vivante du chemin parcouru jusqu'au Point B.
- **Impact** : Vision prospective à 360°, levée proactive des blocages de carrière, arbitrage multicritère transparent et accélération sécurisée vers l'accomplissement.

### [Version 5.10] — 27 Août 2026 (Carrière 5/7 : Capital Relationnel, Réseau & Prospection)
- **Objectif** : Ne plus attendre passivement qu'une opportunité apparaisse : donner à l'utilisateur les moyens de créer ses opportunités en activant son réseau stratégique, ses clients cibles (ICP), ses partenaires et son mentorat.
- **Modifications Réalisées** :
  - **Hub Central de l'Écosystème Relationnel** (`CareerRelationalEcosystemHub.tsx`) : Cockpit unifié de prospection, métriques relationnelles et arbitrage *« Qui contacter aujourd'hui ? »*.
  - **Carte Relationnelle Intelligente & Dynamique** (`CareerRelationshipMapModal.tsx`) : Visualisation hiérarchique du flux relationnel avec pertinence bidirectionnelle explicable.
  - **Moteur de Déduction « Qui devrais-je connaître ? »** (`CareerWhoShouldIKnowModal.tsx`) : Identification des profils clés nécessaires pour atteindre le Point B.
  - **Mode Introduction Professionnelle** (`CareerIntroductionModal.tsx`) : Messages d'approche qualifiés et respect de la validation humaine préalable.
  - **Fiche Relationnelle 360° & Mini-CRM** (`CareerContactDetailModal.tsx`) : Pipeline 10 étapes, mémoire des échanges, gestion des engagements réciproques et synergies avec le Réseau MOC (Tribus, Lives, Reels).
  - **Équipes d'Opportunité & Réponse Collective** (`CareerCollaborativeMissionModal.tsx`) : Consortia pluridisciplinaires pour répondre aux grands appels d'offres.
  - **Hub de Mentorat & Réputation Contextualisée** (`CareerMentorshipModal.tsx`) : Boucle d'apprentissage et de transmission de pair à pair avec réputation vérifiée par compétences.
  - **Vue Synthétique 360° Écosystème** (`CareerEcosystem360Modal.tsx`) : Synthèse en 8 piliers stratégiques.
- **Impact** : Maîtrise active du destin professionnel, prospection respectueuse et collaborative, passage d'un réseau passif à un capital d'opportunités concrètes.

---

### [Version 5.9] — 27 Août 2026 (Carrière 4/7 : Suivi Autonome & Agent de Continuité)
- **Objectif** : Éviter que l'utilisateur soit abandonné après avoir engagé une démarche, en transformant le suivi en un cockpit vivant de continuité proactif, anti-spam et résilient.
- **Modifications Réalisées** :
  - **Hub de Contrôle & Pulse de Carrière** (`CareerContinuityControlHub.tsx`) : 6 métriques clés, Next Best Action globale et 2 commandes d'arbitrage immédiates (*« Que dois-je faire maintenant ? »* et *« Prépare-moi pour demain »*).
  - **Dossier Vivant & Timeline Chronologique** (`CareerLiveDossierModal.tsx`) : Historique horodaté, prochaine meilleure action calculée en continu, pièces jointes et notes personnelles.
  - **Générateur de Relances Anti-Spam** (`CareerSmartFollowUpModal.tsx`) : Diagnostic anti-harcèlement strict (J+7/J+10) et obligation d'apport de valeur nouvelle.
  - **Préparation de RDV & Fiche Flash J-0** (`CareerMeetingPrepModal.tsx`) : Récapitulatif 3 arguments phares, questions pièges et questions à poser.
  - **Débriefing Vocal Instantané** (`CareerPostMeetingDebriefModal.tsx`) : Saisie/dictée d'après-rendez-vous avec qualification du sentiment, enregistrement des décisions et programmation automatique du prochain jalon.
  - **Mode Plan B & Capitalisation Continue** (`CareerPlanBModal.tsx`) : Réallocation instantanée de 90% des actifs vers 2 à 3 opportunités alternatives hautement compatibles du Radar.
- **Impact** : Accompagnement de bout en bout jusqu'au résultat tangible, élimination des oublis et de la surcharge cognitive.

---

### [Version 5.8] — 27 Août 2026 (Carrière 3/7 : Mode Conquête & Salle de Préparation)
- **Objectif** : Transformer chaque opportunité détectée en un résultat réel grâce à une préparation sur mesure de très haut niveau, tout en appliquant la règle stricte *« L'humain est le seul maître de l'action »*.
- **Modifications Réalisées** :
  - **Salle de Préparation Multi-Onglets** (`CareerConquestRoom.tsx`) : Diagnostic 5D, CV Contextuel, 5 pitchs avec téléprompteur/enregistreur, simulateur d'objections et checklist J-0.
  - **CV Maître Universel** (`CareerMasterResumeModal.tsx`) : Base de vérité inaltérable et source de projection des CV contextuels.
  - **Sas de Contrôle Qualité Obligatoire** (`CareerQualityGateModal.tsx`) : Vérification anti-faute, alignement et validation humaine explicite.
  - **Décodeur de Réponses Recruteur/Client** (`CareerResponseAnalyzerModal.tsx`) : Analyse sémantique des retours et adaptation du plan d'action.
- **Impact** : Taux de conversion démultiplié pour les candidatures, appels d'offres et levées de fonds.

---

### [Version 5.7] — 27 Août 2026 (Carrière 2/7 : Radar Intelligent Multi-Sources & Agent de Conquête)
- **Objectif** : Transformer la recherche d'opportunités en un radar permanent autonome et explicable.
- **Modifications Réalisées** : Moteur de décodage d'intentions, 4 univers de conquête, détection de signaux faibles dans le Réseau MOK, coffre sécurisé et boucle de feedback adaptatif.

---

### [Version 5.6] — 27 Août 2026 (Campus Mondial Intelligent & Multi-Programmes)
- **Objectif** : Adapter la formation aux référentiels nationaux officiels (Guinée, Sénégal, France, Côte d'Ivoire, USA, UK) et styles cognitifs individuels.
- **Modifications Réalisées** : Registre officiel des cursus, moteur pédagogique Professeur Diallo avec mode *"Explique-moi autrement"*, simulateur d'examens blancs chronométrés et matrice de passerelles internationales.

---

## 🔍 DÉTAIL DES DERNIÈRES VERSIONS MAJEURES

### [Version 5.5] — 27 Août 2026 (Mémoire Vivante & Documentation Continue)
- **Objectif** : Transformer la documentation en un processus permanent intégré au développement pour garantir la pérennité absolue du projet.
- **Modifications Réalisées** :
  - Création du Livre de Vision Maître (`docs/LIVRE_DE_VISION.md`).
  - Cartographie de l'Architecture Globale et des 14 modules (`docs/ARCHITECTURE_GLOBALE.md`).
  - Instauration du Journal Permanent des Décisions (`docs/JOURNAL_DECISIONS.md`).
  - Mise en place du Registre des Idées en réserve (`docs/REGISTRE_IDEES.md`).
  - Rédaction des fiches de spécification pour les 14 modules du système.
  - Injection des règles de continuité documentaire dans `AGENTS.md` et `GEMINI.md`.
- **Impact** : Zéro perte de mémoire, transmission fluide entre développeurs et agents IA, cohérence globale garantie.

---

### [Version 5.4] — 27 Août 2026 (Refonte Carrière & GPS d'Accomplissement)
- **Objectif** : Fournir une trajectoire complète de bout en bout du Point A au Point B pour l'emploi, le freelancing et la création d'entreprise.
- **Modifications Réalisées** :
  - Déploiement de 7 sous-composants modulaires dans `components/career/`.
  - Intégration du diagnostic 17 critères et de la matrice de correspondance.
  - Mise en place du Coach 3D Vocal interactif (`CareerCoach3DModal.tsx`).
  - Création du Jumeau Professionnel Évolutif et du pipeline Kanban interactif.
  - Établissement des passerelles vers Campus, Marché Mondial, Drive et Conseil d'Experts.
- **Impact** : Accomplissement concret et mesurable des objectifs professionnels des utilisateurs.

---

### [Version 5.0] — Juillet 2026 (Marché Mondial & Suite Commerciale B2B)
- **Objectif** : Ouvrir la plateforme au commerce international équitable et structuré.
- **Modifications Réalisées** :
  - Système d'exploitation commercial (`TradeBusinessOperatingSystem.tsx`).
  - Moteur de RFQ, sourcing, calcul de coûts de débarquement et gestion des litiges.
  - Salons d'affaires virtuels et pavillons mondiaux.
- **Impact** : Sécurisation des transactions import-export pour les entrepreneurs transfrontaliers.
