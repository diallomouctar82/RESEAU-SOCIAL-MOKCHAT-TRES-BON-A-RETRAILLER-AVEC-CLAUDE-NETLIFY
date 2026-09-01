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
