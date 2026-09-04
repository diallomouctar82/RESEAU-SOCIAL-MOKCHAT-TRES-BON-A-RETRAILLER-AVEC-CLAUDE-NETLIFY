# Direction artistique du Studio Live — verre & eau, matière vivante

Référence : image fournie le 30/08/2026 (7 verres d'eau éclairés, chacun
identifié par un anneau lumineux de couleur). Le Studio Live est le premier
domaine à porter cette identité ; une fois validée, elle servira de
référence pour le reste de la plateforme — c'est l'ordre voulu par la
mission, pas une limitation technique.

## 1. Principes

- **Le verre est une matière**, pas un effet : épaisseur perçue (bordure
  claire en haut = lumière), profondeur (dégradé vers le bas), netteté du
  contenu jamais compromise (le flou reste sur le fond).
- **L'interface respire** : mouvements lents, presque imperceptibles,
  jamais de rupture visuelle ni de mouvement brusque.
- **La couleur signature identifie l'univers** : chaque univers a un accent
  (l'anneau lumineux de l'image) consommé par l'onde d'appui, les
  micro-gouttelettes et les reflets — jamais une couleur codée en dur par
  composant.
- **Hiérarchie** (prompt 3/7, inchangée) : Expérience → Lisibilité →
  Intelligence → Matière → Effet visuel. Aucune gouttelette sur une zone de
  texte dense ; aucune animation décorative sous `prefers-reduced-motion`.

## 2. Les 7 univers (source unique : `LIVE_VISUAL_UNIVERSES`)

| N° image | id | Accent (`--water-accent`) | Caractère |
|---|---|---|---|
| 9 | `crystal` (référence) | `#7DD3FC` | Glassmorphism Crystal Water, matière de base |
| 1 | `futuristic_blue` | `#38BDF8` | Bleu électrique, nuit profonde |
| 2 | `natural_fresh` | `#4ADE80` | Vert vivant, verre végétal |
| 4 | `solaire_chaud` **(nouveau)** | `#F59E0B` | Ambre doré, fin de journée |
| 5 | `violet_luxe` | `#C084FC` | Violet profond, reflet doré |
| 6 | `deep_ocean` | `#2DD4BF` | Sarcelle sombre, calme marin |
| 7 | `rose_doux` **(nouveau)** | `#F472B6` | Rose poudré, verre le plus clair |

Chaque univers = un bloc `[data-live-universe="…"]` dans `index.html` qui
redéfinit les variables `--glass-*` + `--water-accent`/`--water-accent-soft`.
Toujours les 2 mêmes classes (`.glass-crystal`, `.glass-crystal-surface`) —
une architecture, jamais 7 refontes. La contrainte
`live_sessions_visual_universe_check` en base accepte les 7 valeurs
(migration `live_sessions_da_add_solaire_chaud_rose_doux_universes`).

## 3. La matière vivante (animations)

| Effet | Où il vit | Comportement |
|---|---|---|
| `animate-water-breathe` | Tailwind config (`index.html`) | Respiration ~9s, scale 1→1.0035 + brightness — header et dock du studio |
| `animate-water-undulate` | Tailwind config | Ondulation verticale infime (±0.7px, 11s) — barre de sous-titres |
| `.water-droplets` | CSS plein (`index.html`) | 3 points de lumière teintés `--water-accent-soft`, dérive 14s — chrome sans texte dense uniquement |
| `.water-ripple-dot` + `spawnWaterRipple()` | CSS plein + `services/live/liveMaterialSystem.ts` | Onde d'appui : goutte née aux coordonnées exactes du contact, 0.65s, auto-retirée |

Règles techniques apprises (à respecter pour toute extension) :

- **Jamais de transform/filter animé sur un conteneur ayant un descendant
  `position: fixed`** (il en deviendrait le référentiel) — c'est pourquoi la
  barre latérale du studio ne respire pas : elle contient l'overlay de
  fermeture du menu « Plus ».
- `droplet-float`/`water-press` sont définis **uniquement** dans le bloc
  `<style>` (consommés par les classes pleines) ; `water-breathe`/
  `water-undulate` **uniquement** dans la config Tailwind (consommés en
  utilitaires) — une seule source de vérité par keyframe.
- `@media (prefers-reduced-motion: reduce)` désactive toutes les animations
  décoratives de la matière ; les animations d'ÉTAT (succès/erreur), qui
  portent du sens, restent. `spawnWaterRipple()` est un no-op complet dans
  ce cas.

## 4. Câblage dans le Studio Live (`components/SocialLive.tsx`)

- Racine du LIVE : `ref` + `onPointerDown` → `spawnWaterRipple` (chaque
  pression, où qu'elle soit, fait naître une goutte).
- Header et dock : `animate-water-breathe` + couche `.water-droplets`.
- Barre de sous-titres : `animate-water-undulate` (texte à lire → pas de
  gouttelettes).
- Sélecteur d'univers (hôte) : pastilles avec anneau
  `inset 0 0 0 2px var(--water-accent)` — l'identité de l'image de
  référence ; les 7 univers apparaissent automatiquement (map sur
  `LIVE_VISUAL_UNIVERSES`).
- Liste vocale des univers (`liveVoiceCommands.ts::UNIVERSES`) : dérivée de
  `LIVE_VISUAL_UNIVERSES` — la liste codée en dur avait silencieusement
  oublié les nouveaux univers.

## 5. Preuves (30/08/2026)

- Tests unitaires `tests/liveMaterialSystem.test.ts` (6) : coordonnées de
  l'onde, retrait à `animationend`, filet 900ms, no-op reduced-motion, no-op
  sans hôte, 7 univers uniques. Suite complète : 97/97.
- Navigateur réel (build local du commit, base de production, comptes
  éphémères supprimés après — zéro trace vérifiée) : studio ouvert, 2
  couches de gouttelettes, 2 surfaces en respiration, onde née au
  pointerdown, bascule réelle vers Solaire & Chaud puis Rose Doux puis Océan
  Profond (écrite en base à travers la nouvelle contrainte), sortie complète
  Quitter → compte-rendu → Fermer, et fiche membre qui passe à « Abonné(e) »
  en place sans être rouverte (correctif DA-0, `SocialFeed.tsx`).

## 6. Extension au reste de la plateforme (à venir, après validation)

Le langage est prêt à s'étendre : `--water-accent`/`--glass-*` sur `:root`
valent partout, `spawnWaterRipple` accepte n'importe quel hôte positionné.
L'extension hors du Studio Live attend la validation explicite de
l'utilisateur sur le studio (« Tu commences par le studio live, une fois
validé, ce langage visuel sera étendu au reste de l'application »).

## 7. Bouton de messagerie — Goutte (mission VF-10, 01/09/2026)

Premier objet hors-live à porter la matière : le bouton flottant qui ouvre
Mooc Chat (`components/chat/MessagingDropButton.tsx`, maquette n° 01
« Goutte » validée par le propriétaire parmi dix pistes). Une goutte de
verre épais où flotte un niveau d'eau : **plus il y a de messages non lus,
plus la goutte se remplit**. Elle cohabite avec la pastille de l'Architecte
(mate, navy, cerclée de cyan) sans jamais lui ressembler : la goutte est
translucide, lumineuse, animée de l'intérieur — même famille de matière,
deux personnalités. Le vert est réservé à l'appel entrant ; aucun anneau
cyan sur disque mat.

### États (par priorité décroissante, jamais simulés)

| État (`data-state`) | Déclencheur (props) | Eau | Anneau | Icône | Libellé accessible |
|---|---|---|---|---|---|
| `open` | `isOpen` | pleine (104 %), vague très lente (16 s) | posé, opacité 0,8 | croix | « Fermer la messagerie » |
| `call` | `incomingCall` | agitée (1,5 s), teinte verte, niveau ≥ 52 % | propagation `mdb-ring` 1,4 s, vert | combiné qui vibre | « Appel audio/vidéo entrant de Fatou — ouvrir » |
| `unread` | `unreadCount > 0` | niveau 44 → 88 % (table ci-dessous) | — | bulle | « Ouvrir la messagerie, 3 messages non lus » |
| `rest` | — | 30 %, vague lente (7 s), micro-bulles | — | bulle | « Ouvrir la messagerie » |

Niveau d'eau `waterLevelForUnread(n)` : 0 → 30 %, 1 → 44, 2 → 55, 3 → 64
(valeur de la maquette), 4 → 70, 5 → 75, 6 → 79, 7 → 82, 8 → 85, 9 et plus →
88 % (l'icône reste lisible au-dessus de l'eau). Le compteur affiche le
nombre exact jusqu'à 9 puis « 9+ » ; le libellé accessible garde toujours le
vrai nombre. Le compteur n'est rendu que dans l'état `unread` (ouverte, la
messagerie montre déjà les conversations ; en appel, le combiné prime).

Micro-interactions : survol (pointeur fin uniquement, `@media (hover:
hover)`) → la goutte gonfle (scale 1,05), l'eau monte de 8 %, l'onde
s'éloigne (anneau à 0,55) ; appui → scale 0,96 ; maintien long 500 ms
(souris ou toucher, `LONG_PRESS_MS`) → étiquette « Installer la messagerie
sur mon téléphone » (`role="tooltip"`, reliée par `aria-describedby`) +
`onInstallRequest()`, et le clic qui suit le relâchement n'ouvre PAS la
messagerie ; l'étiquette s'attarde 1,5 s après le relâchement
(`INSTALL_LABEL_LINGER_MS`), se ferme aussitôt sur Échap ou un appui
ailleurs. Sans `onInstallRequest`, aucune affordance n'existe. Entrée et
Espace basculent (une fois par touche, jamais en répétition) ; focus
visible : liseré 3 px `--mdb-focus` décalé de 5 px.

### Tokens et keyframes (bloc `<style>` d'`index.html`, préfixe `mdb-`)

| Variable | Rôle | Défaut |
|---|---|---|
| `--mdb-lvl` | niveau d'eau, posé en style inline par le composant | `30%` |
| `--mdb-lift` | gonflement de l'eau au survol | `0%` → `8%` |
| `--mdb-wv` | période de la vague | `7s` (appel `1.5s`, ouvert `16s`) |
| `--mdb-acc` | accent : anneau et compteur | `var(--water-accent, #7dd3fc)` |
| `--mdb-call` | vert réservé à l'appel entrant | `#059669` |
| `--mdb-focus` | liseré de focus | `#1d4ed8` |
| `--mdb-badge-ring` | cerclage du compteur = couleur du fond de page | `#f9fafb` (à redéfinir sur fond sombre) |
| `--mdb-install-bg` / `-ink` / `-line` / `-shadow` | étiquette d'installation | blanc / navy / `#dce3ee` |

Keyframes, définis **uniquement** dans le bloc `<style>` (classes pleines) :
`mdb-turn` (rotation des deux ellipses d'eau), `mdb-bubble` (micro-bulles),
`mdb-ring` (propagation de l'anneau d'appel), `mdb-phone-ring` (vibration du
combiné), `mdb-badge-in` (apparition du compteur), `mdb-pulse` (repli sous
mouvement réduit). Couches, de l'arrière vers l'avant : `.mdb-ring` (0),
`.mdb-glass` (1), `.mdb-liquid > .mdb-wave ×2` (2), `.mdb-bubbles` (3),
`.mdb-gloss` (4), `.mdb-ico` (5), `.mdb-badge` (6). La cible fait 64 px ;
le conteneur `.mdb-host` reçoit la classe de position du parent
(`:where()` à spécificité nulle, la classe `fixed` du parent gagne toujours).

`prefers-reduced-motion: reduce` : eau immobile, pas de bulles, pas de
vibration du combiné, transitions à 0,15 s ; le niveau d'eau et les états
restent lisibles, l'appel devient une lente pulsation d'opacité de l'anneau
(`mdb-pulse`, 2,2 s) — l'information n'est jamais perdue.

### Preuves (01/09/2026)

Tests DOM `tests/messagingDropButton.test.tsx` (20) : id et libellés,
niveau = vrais non-lus (3 → 64 %, 12 → « 9+ »), appel entrant uniquement
sur prop, ouvert (croix, `aria-expanded`), clic et clavier, maintien long
(500 ms, minuteurs factices) avec et sans `onInstallRequest`, aucun minuteur
survivant au démontage. Navigateur réel (banc esbuild avec la config
Tailwind et le bloc `<style>` d'`index.html` copiés tels quels, fond clair et
sombre, à côté de la pastille de l'Architecte) : captures des 5 états +
maintien long + mobile 390 px, survol réel, clic et clavier réels,
mouvement réduit émulé.

## 8. L'abysse — deuxième image de référence (DS-L0 + DS-L1, 03/09/2026)

Une **seconde image de référence** a été fournie par la Direction le
03/09/2026, propre au LIVE : abysse turquoise très sombre, ruban de lumière
liquide vertical séparant deux zones, cartes de verre cyan bioluminescent,
vidéo **dans** le verre avec pastille d'avatar et onde de voix, plaque de nom
en capitales espacées, commandes en orbes cyan, « ● EN DIRECT » à point vert,
bulles qui montent **à l'intérieur** des cartes.

Elle ne remplace pas les sections 1 à 6 : la matière verre/eau/lumière et les
7 univers restent la fondation. Elle **précise l'aspect du Studio** — ce que
les sections précédentes ne disaient pas. La Direction a validé le résultat
sur les captures du banc (ordinateur et téléphone) le 03/09/2026.

### 8.1 Portée et périmètre de scope (décision structurante)

`--water-accent` sur `:root` est consommé par la **goutte de la messagerie**
(`--mdb-acc: var(--water-accent, #7dd3fc)`, § 7, maquette validée le 01/09).
Toutes les variables `--live-*` sont donc déclarées sur
**`[data-live-universe]`** — un attribut qui n'existe que sur la racine du
Studio — et **jamais sur `:root`**. Habiller le LIVE ne peut pas déplacer un
composant déjà validé ailleurs.

Même architecture que les 7 univers : seuls `--live-abyss-a`,
`--live-abyss-b` et `--live-glow` sont redéfinis par univers ; jamais une
famille de classes par univers.

| Variable | Rôle | Valeur de référence (`crystal`) |
|---|---|---|
| `--live-abyss-a` / `-b` | haut / bas de l'abysse | `#0a2430` / `#04121a` |
| `--live-glow` | lueur de l'univers (halo, courant, lueur interne) | `rgba(127,217,230,.18)` |
| `--live-line` / `-line-top` | filet du verre / arête haute éclairée | `rgba(160,235,245,.2)` / `rgba(214,248,253,.42)` |
| `--live-pane-a` / `-b` | haut / bas du panneau de verre | `rgba(255,255,255,.055)` / `rgba(9,38,48,.42)` |
| `--live-ink` / `-ink-soft` | encre principale / atténuée | `#e6f8fb` / `#93bcc7` |
| `--live-accent` | accent (orbe actif, onde de voix) | `var(--water-accent, #7fd9e6)` |

### 8.2 Les classes (bloc `<style>` d'`index.html`)

| Classe | Ce qu'elle peint |
|---|---|
| `.live-abyss` | Fond du Studio : halo haut, dégradé vertical, **vignettage en couche de fond** |
| `.live-current` | Colonne d'eau : deux nappes qui dérivent (22 s / 31 s) derrière `blur(14px)`, masquée en haut et en bas, `z-index: 1` |
| `.live-current--h` | Variante horizontale — sur téléphone la couture scène/panneau est horizontale |
| `.live-pane` / `--agent` | Verre des tuiles : rayon 20 px, arête haute claire, lueur intérieure, ombre portée. La variante agent se distingue par une arête plus vive, **jamais par une couleur étrangère à l'univers** |
| `.live-orb` / `--active` / `--danger` | Commandes rondes ; le halo s'intensifie au survol — la lumière confirme, elle ne décore pas |
| `.live-onair` | « EN DIRECT » en petites capitales espacées, point vert qui pulse (2,4 s) |
| `.live-title` | Titres en capitales espacées, graisse 300 |
| `.live-wave` / `--muted` | Onde de voix : 5 barres ; micro coupé = repos visible |
| `.live-nameplate` | Plaque de nom en pied de tuile, dégradé montant |
| `.live-bubbles` | Bulles qui montent **dans** la carte |

Deux pièges consignés, tous deux du même genre que le
`-webkit-box-reflect: none` du menu (§ DIRECTION_ARTISTIQUE_MENU) :

- **Le vignettage est une couche de `background`, pas un `::after`.** Un
  pseudo-élément est peint **après** tous les enfants : il aurait assombri la
  vidéo elle-même.
- **`color-mix()` évité** pour la tuile agent (non garanti sur Safari 16.0) —
  remplacé par l'arête `--live-line-top` et une lueur interne plus marquée.

La colonne d'eau est positionnée par un **style en ligne**
(`right: isPanelCollapsed ? -65 : 319`), jamais par une valeur arbitraire
Tailwind : Tailwind est servi par CDN et injecte ses règles à l'exécution —
rien ne doit dépendre de l'ordre des feuilles de style.

### 8.3 Les deux motifs vivants (`components/live/LiveMatter.tsx`)

- `LiveBubbles` — positions, tailles et retards **déterministes** (dérivés de
  l'index) : un re-rendu React ne redistribue jamais les bulles. Rendu
  uniquement là où il n'y a **pas** de vraie vidéo, jamais sur du texte dense.
- `LiveVoiceWave` — suit le **vrai** niveau audio quand il est mesuré
  (`level`), et n'anime rien de simulé quand il ne l'est pas. Micro coupé =
  barres au repos, jamais une fausse parole.

### 8.4 Câblage (`components/SocialLive.tsx`)

- Racine : `.live-abyss` (remplace l'aplat `bg-slate-950`) ; les 4 grilles de
  scène n'ont plus d'aplat opaque.
- En-tête : `.live-onair` **seulement quand le direct passe vraiment** —
  `liveBadge()` expose désormais `isOnAir`, la vue ne re-déduit plus l'état.
  Aperçu, interruption, reconnexion et connexion gardent leur pastille.
- Espace de travail : `.live-current` verticale sur ordinateur, `--h`
  horizontale sur téléphone quand le panneau est ouvert.
- Tuiles : `.live-pane` (+ `--agent`), pastille d'avatar et onde de voix en
  haut à gauche, `.live-nameplate` en pied, bulles seulement sans vidéo.
- Dock : orbes de 44 px (`--danger` micro/caméra coupés, `--active` partage
  d'écran et voix).
- Chrome harmonisé sur l'accent : sélecteur de mode, « Appeler un Expert »,
  bandeau de suggestion, onglets du panneau, « Transformer en Parcours »,
  « Continuer en Privé » — `whitespace-nowrap` pour qu'aucun libellé ne se
  coupe.

### 8.5 Une lacune produit trouvée en construisant les preuves

Impossible de produire la scène **à une seule carte** : `aiAgent` retombait
sans condition sur `AGENTS[0]` et `stageAgents` le ré-injectait à chaque
rendu — **un agent IA ne pouvait jamais être retiré de la scène**, ce qui
contredit la règle de la Direction « inviter, retirer, gérer humain et
agent ». Corrigé : `agentsRetires` retire l'agent de `stageAgents` ; une
nouvelle invitation le fait revenir ; la croix n'est offerte qu'à l'hôte.
Ce n'est pas un ajustement visuel — c'est une capacité qui manquait.

### 8.6 Preuves (03/09/2026)

- `tsc --noEmit` **0 erreur** · `npm run build` propre · **vitest 800/800**
  (59 fichiers, +10 dans `tests/liveStudioMatter.test.tsx`).
- Le garde-fou de `tests/liveStudioMatter.test.tsx` vérifie que **toute
  classe `.live-*` employée existe réellement** dans `index.html`, que
  **toute variable `--live-*` référencée est déclarée**, que les 7 univers
  redéfinissent bien l'abysse, et que le mouvement réduit fige la matière.
  Il a **échoué à sa première exécution** (il confondait les variables
  `--live-line`/`--live-ink` avec des classes) : la preuve qu'il n'est pas
  complaisant.
- **Banc navigateur réel 8/8 sans défaut** (le vrai `SocialLive`, bundle
  esbuild, ordinateur 1440×900 + téléphone 390×844, scènes à 1, 2, 4 et 6
  cartes dont un agent IA invité, vraie vidéo de canevas dans 4 tuiles) :
  abysse mesuré `#0a2430`, accent `#7fd9e6`, rayon des tuiles 20 px, filet
  `rgba(214,248,253,.42)`, courant `blur(14px)`, 12 orbes, 6 plaques de nom,
  largeur de page 1440 (aucun défilement horizontal), 0 erreur de page.
- **Aucun compte ni écriture en base** : cet habillage ne touche pas la base.

### 8.7 Ce qui reste ouvert

- La **teinte rose du cœur des réactions** n'a pas été ramenée sur la palette
  cyan — décision de la Direction, pas un oubli.
- Trois écrans **satellites** du LIVE gardent leur dégradé bleu→indigo :
  `LiveCreationModal.tsx`, `LiveReplayModal.tsx`, `MultimodalCameraHUD.tsx`.
  Vérifié absent de `SocialLive.tsx` et `LiveSmartActionBar.tsx`. La loupe
  n'a pas été élargie sans accord.
- Aucun test ne peut dire si l'abysse **a l'air d'un abysse** : le banc prouve
  que les bonnes valeurs sont appliquées, l'appréciation reste humaine.
