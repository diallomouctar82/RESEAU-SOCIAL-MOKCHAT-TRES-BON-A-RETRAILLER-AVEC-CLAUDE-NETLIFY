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

---

## 🔄 2. JOURNAL DES ÉVOLUTIONS UX/UI (UX CHANGELOG)

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
