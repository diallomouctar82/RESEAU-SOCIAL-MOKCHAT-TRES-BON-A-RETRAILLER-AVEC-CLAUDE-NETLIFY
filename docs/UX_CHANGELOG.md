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
| **`WaterMirror`** | Nappe d'eau vivante du menu « Miroir d'eau » | **ACTIVE** | Canevas décoratif plein écran (`aria-hidden`, non cliquable) : ciel dégradé, ligne d'eau à 58 %, caustiques, étincelles, onde réelle à l'appui | Décoratif — jamais annoncé aux lecteurs d'écran ; image unique et figée sous `prefers-reduced-motion` | Transversal (chrome global) |
| **`.mir-*` (habillage Miroir d'eau)** | Matière verre/eau scopée sous `[data-miroir]` | **ACTIVE** | `mir-band` (en-têtes), `mir-glass` 44 % (panneaux), `mir-sheet` 94 % (surfaces de lecture), `mir-exp`, `mir-dock`, `mir-edge` (arête de lumière 9 s), `mir-reflect`, `mir-orb` (Architecte en goutte), `mir-tab-active`, `mir-mode` | Verre opaque sous `prefers-reduced-transparency` ; animations éteintes sous `prefers-reduced-motion` ; texte de lecture à 94 % d'opacité | Navigation globale, Accueil réseau social |
| **`LiveBubbles`** | Bulles qui montent **à l'intérieur** d'une carte du Studio | **ACTIVE** | `count` (défaut 5) — positions, tailles et retards **déterministes** (dérivés de l'index) : un re-rendu ne les redistribue jamais | Décoratif (`aria-hidden`) ; jamais posé sur du texte dense ni sur une vraie vidéo ; figé sous `prefers-reduced-motion` | Studio Live |
| **`LiveVoiceWave`** | Onde de voix à côté de la pastille d'avatar | **ACTIVE** | `level` (vrai niveau audio 0-100), `muted`, `bars` (défaut 5) — **n'anime rien de simulé** quand le niveau n'est pas mesuré ; micro coupé = barres au repos | Décoratif (`aria-hidden`) — l'information d'état reste portée par le texte et les orbes ; figé sous `prefers-reduced-motion` | Studio Live |
| **`.live-*` (matière du Studio Live)** | Abysse, colonne d'eau et verre cyan, scopés sous `[data-live-universe]` | **ACTIVE** | `live-abyss` (fond + vignettage **en couche de fond**), `live-current`/`--h` (colonne de lumière liquide), `live-pane`/`--agent` (verre des tuiles), `live-orb`/`--active`/`--danger` (commandes 44 px), `live-onair` (point vert), `live-title`, `live-wave`/`--muted`, `live-nameplate`, `live-bubbles` | Cibles ≥ 44 px ; « EN DIRECT » affiché **seulement** quand le direct passe vraiment (`liveBadge().isOnAir`) ; toute la matière figée sous `prefers-reduced-motion` | Studio Live, Barre d'actions du Live |

---

## 🔄 2. JOURNAL DES ÉVOLUTIONS UX/UI (UX CHANGELOG)

### [V1.3.0] — 3 Septembre 2026 — Studio Live : l'abysse, la colonne d'eau et le verre cyan
* **Écrans / Modules concernés** : Studio Live (`SocialLive`), barre d'actions du Live (`LiveSmartActionBar`).
* **Ancien comportement** : scène posée sur un aplat opaque `bg-slate-950` ; tuiles en cartes `slate` à bordure grise ; commandes du dock en boutons ronds gris ; badge d'état toujours une pastille colorée, même à l'antenne ; boutons d'action en dégradé violet/indigo et ambre, hors palette du Live ; **aucun moyen de retirer un agent IA de la scène**.
* **Nouveau comportement** :
  - **L'abysse** remplace l'aplat : halo haut, dégradé vertical, vignettage **en couche de fond** (un `::after` aurait assombri la vidéo elle-même).
  - **Une colonne de lumière liquide** sépare la scène du panneau — verticale sur ordinateur, horizontale sur téléphone où la couture l'est aussi. Deux nappes qui dérivent à 22 s et 31 s derrière un flou : c'est le décalage qui fait « courant » et non « dégradé animé ».
  - **Les tuiles deviennent du verre cyan** (rayon 20 px, arête haute éclairée, lueur intérieure) ; la vidéo vit **dans** le verre, avec pastille d'avatar et onde de voix en haut à gauche et **plaque de nom** en capitales espacées en pied. Une présence IA se distingue par une arête plus vive, **jamais par une couleur étrangère à l'univers**.
  - **Des bulles montent à l'intérieur des cartes** — seulement là où il n'y a pas de vraie vidéo.
  - **Les commandes deviennent des orbes** de 44 px dont le halo s'intensifie au survol : la lumière confirme, elle ne décore pas.
  - **« ● EN DIRECT » ne s'affiche que quand le direct passe vraiment** (`liveBadge().isOnAir`) ; aperçu, interruption, reconnexion et connexion gardent leur pastille d'anomalie.
  - **L'hôte peut enfin retirer un agent IA de la scène** — capacité qui manquait, découverte en essayant de produire la scène à une seule carte.
* **Justification** : seconde image de référence fournie par la Direction pour le LIVE (DEC-2026-043), validée par elle le 03/09/2026 sur les captures d'ordinateur et de téléphone. Toutes les variables `--live-*` sont **scopées sous `[data-live-universe]`**, jamais sur `:root` : `--water-accent` y est consommé par la goutte de la messagerie déjà validée (V1.1.0) — habiller le LIVE ne peut pas déplacer un composant validé ailleurs. Une seule architecture pour les 7 univers : seuls l'abysse et la lueur changent.
* **Statut** : **DÉVELOPPÉ ET TESTÉ** (800 tests, tsc 0, build, banc navigateur réel 8/8 sans défaut sur ordinateur et téléphone, 1 à 6 cartes) — **design validé par la Direction**, pas encore sur `moknet.net` (PR #60). Restes assumés : cœur rose des réactions et trois écrans satellites du LIVE. Détail : `docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md` § 8.

### [V1.2.0] — 3 Septembre 2026 — Menu « Miroir d'eau » : le chrome global et l'accueil passent au verre/eau
* **Écrans / Modules concernés** : navigation globale (`Layout`), accueil réseau social (`SocialFeed`), goutte de la messagerie (par CSS uniquement).
* **Ancien comportement** : fond gris plat `#f0f2f5`, en-têtes blancs opaques, dock blanc posé sur un voile dégradé gris, Architecte en disque dégradé cyan/indigo cerclé de gris, cartes blanches à bordure `slate-100`.
* **Nouveau comportement** :
  - Une **nappe d'eau animée** (`WaterMirror`) sous toute l'application : ligne d'eau à 58 %, caustiques, étincelles, lueur sous le dock — et une **onde réelle** là où le doigt se pose sur le dock.
  - En-têtes en **bandeau de verre** translucide (44 %) avec flou d'arrière-plan ; ligne d'état « Réseau · en éveil » sur l'en-tête mobile.
  - Dock en **pilule de verre soufflé** qui flotte sur l'eau, avec une arête de lumière qui tourne en 9 s et son reflet ; emplacement actif marqué par la couleur accent et un point de lumière vert.
  - **L'Architecte devient une goutte d'eau** au centre du dock (géométrie non circulaire, lumière interne radiale, point spéculaire, anneau qui respire).
  - Accueil : carte Réseau Mooc et rail des stories en verre (44 %) ; publications du fil en **feuille de lecture** (94 %) — un paragraphe ne se lit pas à travers de l'eau.
* **Justification** : proposition 06 retenue par la Direction (DEC-2026-042). Tokens `--mir-*` **scopés** sous `[data-miroir]` : ni `palette-10` (gelée) ni le système verre/eau/lumière du LIVE ne sont touchés, et le futur sélecteur d'univers de l'Administrateur Général devient possible sans retoucher un composant. Accessibilité : verre opaque sous `prefers-reduced-transparency`, toutes les animations décoratives éteintes sous `prefers-reduced-motion`.
* **Statut** : **DÉVELOPPÉ ET TESTÉ** (777 tests, tsc 0, build, banc navigateur réel 76 OK / 0 défaut sur le CSS effectivement servi par `dist/`) — **appréciation visuelle en attente de la Direction**. Détail : `docs/DIRECTION_ARTISTIQUE_MENU_MIROIR_EAU.md`.

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
