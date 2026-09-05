# Assistant IA Pré-Publication : « Appliquer à ma publication » au-dessus du dock (DEC-2026-080, v6.41.1)

Constat de la Direction (capture iPhone du 5 septembre 2026) : sur téléphone, dans le parcours de publication, le bouton « Appliquer à ma publication » de la modale de l'assistant IA est masqué par la barre du bas (menu, messages). Demande : « Il faut que ce bouton reste visible et cliquable sur mobile. […] Je veux une correction prouvée sur téléphone, avec un parcours complet jusqu'à la publication. »

## États comparés

- `avant` = `origin/main` `1c2daf6` (v6.41.0 servie, base de la PR #109) ;
- `apres` = tête fusionnée `1d4ffb8` de la branche `claude/cleanup-home-interface-szp8qv` (le commit qui ajoute ces captures ne touche ni code ni feuille).

Le SHA (déclaré par l'appelant), l'état, l'heure et le texte publié sont inscrits dans `_meta` de chaque JSON de parcours ; les JSON de sonde n'ont pas de `_meta`. Les deux serveurs Vite servent `preview-harness.html`, copie de l'`index.html` de l'état mesuré qui charge le harnais de prévisualisation (même code que l'application, données de démonstration).

## Parcours rejoué (`parcours.cjs`, Playwright + Chromium, harnais `?tab=social`)

1. Saisie de « Bonjour, soyez les bienvenus » dans le composeur ;
2. « Améliorer le style » → modale de l'assistant, version optimisée affichée (l'IA de secours répond quand la passerelle est absente) ;
3. clic **réel** au centre du bouton « Appliquer à ma publication » (`page.mouse.click`, jamais de clic forcé) ; juste avant, `document.elementFromPoint` dit quel élément est réellement sous le doigt à ce point ;
4. « Publier » → le texte doit apparaître dans le fil, hors du composeur ;
5. défilement jusqu'au texte publié dans le fil (capture `5-fil`).

Écrans : téléphone 390 × 844 (iPhone), Android 360 × 800, ordinateur 1440 × 900.

## Résultats (`avant-parcours.json`, `apres-parcours.json`)

| Écran | État | Élément sous le doigt au centre du bouton | Modale fermée après le clic réel | Texte publié dans le fil | Voile de la modale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 390 × 844 | avant | **le dock** (`.mir-dock`) | **non — parcours bloqué** | — | dans `#root`, z-index 50, commence à 24 px du haut |
| 390 × 844 | après | le bouton « Appliquer à ma publication » | oui, texte appliqué au champ | **oui** (1 occurrence, capture `5-fil`) | sur `<body>`, z-index 2147482000, `#root` inerte, couvre toute la fenêtre |
| 360 × 800 | avant | **le dock** | **non — parcours bloqué** | — | idem avant |
| 360 × 800 | après | le bouton | oui | **oui** | idem après |
| 1440 × 900 | avant | le bouton (pas de dock sur ordinateur) | oui | oui | dans `#root`, z-index 50, décalé de 24 px |
| 1440 × 900 | après | le bouton | oui | oui | sur `<body>`, carte centrée |

Zéro erreur JavaScript relevée sur les six parcours. Les JSON comptent deux `role="dialog"` après (un seul avant) : le second est le tiroir mobile « Menu des espaces MokNet » de `Layout`, toujours présent dans le DOM ; avant, la modale elle-même n'avait pas de rôle.

## Sonde de la modale (`sonde-modale.cjs` → `avant-sonde.json`, `apres-sonde.json` ; `comparer-sondes.cjs` → `sonde-comparaison.txt`)

Même sonde sur les deux serveurs, ordinateur 1440 × 900 et téléphone 390 × 844 : voile (position, hauteur, couleur, z-index, portail, `data-miroir`, ancêtres créant un bloc conteneur), carte (position, hauteur, `max-height`, police, fond, matière, ombre, bordure), enfants, titre (police), en-tête (dégradé), enveloppe des boutons du pied (position ; la zone sûre du pied `.ia-pied` est gardée par le test postcss, pas par la sonde), bouton (police, dégradé), et la couleur et le fond calculés de chacun des 31 textes de la modale.

| | Avant (`1c2daf6`) | Après (`1d4ffb8`) |
| :--- | :--- | :--- |
| Voile | y = 24 px, hauteur = fenêtre − 24 px, dans `#root`, z-index 50 | y = 0, hauteur = fenêtre, sur `<body>`, z-index 2147482000, `data-miroir` |
| Carte | 623 px (ordinateur) / 760 px (téléphone) de haut, y = 151 / 54 | même hauteur, y = 139 / 42 (centrée sur la fenêtre) |
| 31 textes | — | couleurs et fonds identiques (0 différence) |
| Bilan | **34 propriétés identiques, 11 différentes** sur chaque écran | les 11 sont attendues : position et hauteur du voile, z-index, portail, `data-miroir`, couleur héritée du voile (sans effet : aucun texte ne l'hérite), et les positions y décalées de 12 px (carte, enfants, titre, pied, bouton) |

Le voile « avant » commençait 24 px sous le haut de l'écran avec `top: 0` calculé : mécanisme non identifié (aucun ancêtre avec transformation, filtre, perspective, `contain` ni `content-visibility`, cf. `blocConteneur` vide dans la sonde) ; sans objet avec le portail.

## Fichiers

- `<etat>-<ecran>-1-saisie.png`, `-2-modale.png`, `-3-apres-clic.png`, `-4-publie.png`, `-5-fil.png` pour les deux téléphones (l'avant s'arrête à l'étape 3 : la modale ne s'est pas fermée) ; pour l'ordinateur, `-2-modale.png` et `-5-fil.png` seulement (le parcours y passait déjà).
- `parcours.cjs` : rejouer avec `SHA=<sha du code servi> ETAT=avant|apres PORT=<port du serveur Vite> node parcours.cjs <dossier>`.
- `sonde-modale.cjs` : `PORT=<port> node sonde-modale.cjs > <etat>-sonde.json` ; `comparer-sondes.cjs avant-sonde.json apres-sonde.json > sonde-comparaison.txt`.

## Limites honnêtes

- Harnais local (même code, données de démonstration), pas l'application derrière l'authentification ; Chromium émulé, pas Safari iOS ni appareil réel : la zone sûre (`env(safe-area-inset-bottom)`) et l'unité `dvh` sont posées mais non mesurées sur iPhone réel.
- Pendant l'ouverture de la modale, tout `#root` est inerte et sous le voile (dock, barre flottante et sculpture de l'Architecte compris) : comportement de dialogue modal, identique au studio Visuel IA ; tout redevient actif et visible à la fermeture.

## Production (5 septembre 2026)

Feu vert écrit de la Direction pour la PR #109 uniquement, sur la tête `e5ed7eb`. `main` vérifié inchangé (`1c2daf6`), aucune autre fusion en cours ; fusion squash sur la tête exacte → `main` `81c66c8` à **16:46:29 UTC**. `moknet.net` sert la nouvelle page depuis **16:47:11 UTC** : bundle `index-6ZrCib2c.js`, sept marqueurs présents (`production-verification.txt`), ancien bundle `index-Bvy0oNZ6.js` → 404, Green Gate vert sur `main` (run 33978900871). Sur le code fusionné `81c66c8` : typage 0 erreur, 1602/1602 tests (105 fichiers), build OK, parcours de publication réussi sur les trois écrans (`production-parcours-81c66c8.json`, harnais, zéro erreur JS). Limite honnête : l'écran authentifié n'est pas capturable sans compte ; le parcours en production réelle reste à confirmer par la Direction sur son téléphone.

Page servie par `moknet.net`, lue via miroir local et analysée par Chromium (`production-cssom.json`, captures `production-telephone.png` 390 × 844 et `production-ordinateur.png` 1440 × 900) : `.ia-fond` z-index 2147482000, `.ia-carte` 90dvh, pied avec zone sûre, studio Visuel IA à 2147483000 au-dessus, racine montée, bundle `index-6ZrCib2c.js`. La page visible est l'écran de connexion (le miroir ne relaie pas le CDN Tailwind, d'où un rendu sans habillage et l'erreur « tailwind is not defined », artefact connu du miroir).
