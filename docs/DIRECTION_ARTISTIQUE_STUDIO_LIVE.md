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
