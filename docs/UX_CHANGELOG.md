# 📝 COMPONENT REGISTRY & UX CHANGELOG
> **Registre Officiel des Composants & Historique des Évolutions Visuelles**  
> *Version : 1.0.0 — Août 2026*  
> *Gouvernance : Aucun nouveau composant ne doit être créé sans vérification de ce registre.*

---

## 🗂️ 1. REGISTRE OFFICIEL DES COMPOSANTS (COMPONENT REGISTRY)

| Composant | Rôle & Fonction | Statut | Variantes & Propriétés Clés | Accessibilité | Modules Utilisateurs |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **`DesignTokens`** | Tokens maîtres (couleurs, rayons, typographies, ombres) | **ACTIVE** | `DESIGN_TOKENS.colors`, `.typography`, `.spacing` | Système | Transversal |
| **`EditorialHero`** | Bannière maîtresse du Dashboard | **ACTIVE** | `userName`, `quote`, `progressPercentage`, `onPrimaryAction` | WCAG AA | Dashboard |
| **`PointAToBPathway`** | Trajectoire d'accomplissement jalonné | **ACTIVE** | `currentPointALabel`, `targetPointBLabel`, `progressPercent`, `steps` | WCAG AA | Dashboard, Carrière, Mobilité |
| **`ContextActionBar`** | Fil d'Ariane contextuel & Appel expert | **ACTIVE** | `moduleTitle`, `pillarName`, `description`, `expertName`, `onConsultExpert` | WCAG AA | Transversal (Tous modules) |
| **`ActionableAISuggestion`** | Suggestion décisionnelle avec CTA | **ACTIVE** | `title`, `recommendation`, `whyExplanation`, `primaryActionLabel`, `onPrimaryAction` | WCAG AA | Diallo OS, Dashboard, Carrière |
| **`KnowledgeCard`** | Fiche de savoir mémorisable | **ACTIVE** | `category`, `title`, `takeaway`, `source`, `onDeepDive`, `onUseInProject` | WCAG AA | Campus, Santé, Logement |
| **`AISynthesisCard`** | Synthèse exécutive structurée | **ACTIVE** | `topic`, `sourceContext`, `summary`, `keyDecisions`, `actionItems`, `openQuestions` | WCAG AA | Diallo OS, MOC Lives, Réunions |
| **`SmartConfirmModal`** | Confirmation contextuelle sécurisée | **ACTIVE** | `isOpen`, `title`, `description`, `riskLevel`, `dataAffectedNotice`, `onConfirm` | WCAG AA | Shop, Wallet, Profil, Démarches |
| **`StatusBadge`** | Badge de statut sémantique | **ACTIVE** | `status` ('verified' \| 'official' \| 'in_progress' \| 'pending_review' \| 'action_required' \| 'completed') | WCAG AA | Transversal |
| **`SourceCitationCard`** | Preuve documentaire vérifiée | **ACTIVE** | `sourceName`, `institution`, `verifiedDate`, `referenceCode`, `verifiedUrl` | WCAG AA | Droit, Santé, Carrière |
| **`EmptyStateGuide`** | Guide bienveillant du Moment Zéro | **ACTIVE** | `title`, `description`, `quickSteps`, `onStartStep` | WCAG AA | Transversal |
| **`GuidedModeModal`** | Mode d'accompagnement pas-à-pas | **ACTIVE** | 4 étapes d'orientation, choix guidés, vocal Diallo | WCAG AA | Navigation principale |
| **`UniversalScannerModal`** | Numérisation multimodale OCR | **ACTIVE** | Caméra, téléversement de fichier, OCR automatique, envoi direct | WCAG AA | Barre d'outils universelle |
| **`BilingualConversationModal`**| Traduction face-à-face interactive | **ACTIVE** | Détection vocale, retranscription bilingue, audio instantané | WCAG AA | Barre d'outils universelle |
| **`FocusAndPresentationControls`**| Contrôles Concentration & Présentation | **ACTIVE** | `isFocusMode`, `isPresentationMode` | WCAG AA | Barre supérieure |
| **`UnifiedSettingsModal`** | Paramètres unifiés & Connecteurs | **ACTIVE** | Accessibilité (taille police, contraste, voix), Connecteurs Workspace | WCAG AA | Menu Profil & Paramètres |
| **`ComponentShowcaseModal`** | Vitrine interactive du Design System | **ACTIVE** | Navigation par onglets (Tokens, Cartes, Badges, Trajectoires, IA) | WCAG AA | Console & Paramètres |
| **`MessagingDropButton`** | « Goutte » : bouton flottant de la messagerie | **ACTIVE** | Niveau d'eau = non-lus réels, appel entrant = sonnerie, ouvert = croix, maintien long 500 ms = installer le module | WCAG AA (cible 44 px, libellé « Ouvrir la messagerie ») | Layout (transversal) |
| **`ConversationHeader`** | En-tête de conversation avec sélecteur « Ma langue » fixe | **ACTIVE** | Sélecteur unique de la langue du lecteur (immobile au défilement), identité du correspondant | WCAG AA | Messagerie |
| **`MessagingOwnerCard`** | Carte du propriétaire (« Vous ») en tête de liste | **ACTIVE** | Nom, avatar réel ou initiales (jamais de cliché) | WCAG AA | Messagerie |
| **`ChatCallModal`** | Écran d'appel audio/vidéo | **ACTIVE** | Sonnerie, Décrocher 72×72 px, case de langue « Entendre X en … » (« Appel normal » / « Traduction active »), diagnostics média réels, z-index 400 au-dessus des boîtes du LIVE | WCAG AA (cibles ≥ 44 px, états lisibles) | Messagerie, appels |
| **`RingingPanel`** | Panneau « Sonnerie » de la barre de messagerie | **ACTIVE** | Interrupteurs Sonnerie / Vibration (`role="switch"`), sonnerie du profil, état « Hors application » (Active / Incomplète / Non activée / Refusée / À installer / Indisponible), « Tester la sonnerie » | WCAG AA (focus visible, aria-checked) | Messagerie |

---

## 🔄 2. JOURNAL DES ÉVOLUTIONS UX/UI (UX CHANGELOG)

### [V1.1.0] — 3 Septembre 2026 — Messagerie et appels : goutte, « Ma langue », écran d'appel, panneau « Sonnerie »
* **Écrans / Modules concernés** : messagerie (`MoocChatFloating`), appels (`ChatCallModal`), Layout (bouton flottant).
* **Ancien comportement** : bouton de messagerie générique ; deux sélecteurs de langue par conversation ; écran d'appel sans média réel ni case de langue ; aucun réglage de sonnerie accessible depuis la messagerie ; toucher une notification d'appel n'ouvrait que la conversation.
* **Nouveau comportement** :
  - « Goutte » (`MessagingDropButton`, maquette 01 validée par l'utilisateur) : niveau d'eau = non-lus réels, sonnerie visible sur appel entrant, maintien long = installer le module messagerie.
  - Un seul sélecteur « Ma langue » fixé dans l'en-tête (`ConversationHeader`), carte du propriétaire (`MessagingOwnerCard`), initiales à la place du cliché.
  - Écran d'appel (`ChatCallModal`) : Décrocher 72×72 px, case de langue bien visible (« Appel normal » par défaut, « Traduction active » après choix), avis honnêtes (« X ne vous entend pas — micro indisponible », « Reconnexion… »), au-dessus de toutes les boîtes (z-index 400).
  - Barre de messagerie : bouton « Sonnerie » après « Annuaire », panneau `RingingPanel` (sonnerie / vibration, état hors application, test).
* **Justification** : réglages branchés aux services existants (`ringtoneService`, `pushService`), cibles tactiles ≥ 44 px, états lisibles avant toute action (Future UI/UX Standard : états vide/chargement/erreur/succès présents, aucun futurisme décoratif).
* **Statut** : **VALIDÉ ET TESTÉ EN PRODUCTION** (missions VF, AU, VT‑1b, LT, SN — captures `vf-preuve/prod/`).

### [V1.0.0] — 27 Août 2026 — Jalon Premium Experience V1
* **Écrans / Modules concernés** : Ensemble de la plateforme (14 modules, Layout, Dashboard, Navigation).
* **Ancien comportement** : Menu plat saturé de 18 entrées, cartes d'IA purement passives, alertes javascript intrusives, pas de mode pas-à-pas pour les débutants.
* **Nouveau comportement** :
  - Design System unifié basé sur `DesignTokens.ts` (Navy Deep `#070D1E`, Orange `#EA580C`, typographies Outfit & Plus Jakarta Sans).
  - Navigation par 5 Piliers avec barre supérieure interactive, recherche universelle (`Ctrl+K`), Scanner OCR et mode *"Guide-moi"*.
  - Composants décisionnels `ActionableAISuggestion`, `KnowledgeCard` et `AISynthesisCard`.
  - Contrôles de concentration (*Focus*) et de projection (*Présentation*).
  - Hub de paramètres centralisé avec gestion des connecteurs Google Workspace.
* **Justification** : Établissement de la référence UX/UI officielle, respect du Manifeste Premium (*« Simple devant, intelligente derrière »*) et conformité WCAG AA.
* **Statut** : **VALIDÉ ET TESTÉ EN PRODUCTION**.
