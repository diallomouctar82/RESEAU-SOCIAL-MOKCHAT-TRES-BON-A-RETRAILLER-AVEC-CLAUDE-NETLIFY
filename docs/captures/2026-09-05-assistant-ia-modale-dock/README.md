# Assistant IA Pré-Publication : « Appliquer à ma publication » au-dessus du dock (DEC-2026-080, v6.40.2)

Constat de la Direction (capture iPhone du 5 septembre 2026) : sur téléphone, dans le parcours de publication, le bouton « Appliquer à ma publication » de la modale de l'assistant IA est masqué par la barre du bas (menu, messages). Demande : « Il faut que ce bouton reste visible et cliquable sur mobile. […] Je veux une correction prouvée sur téléphone, avec un parcours complet jusqu'à la publication. »

## Parcours rejoué (`parcours.cjs`, Playwright + Chromium, harnais `?tab=social` sur le même code que l'application)

1. Saisie de « Bonjour, soyez les bienvenus » dans le composeur ;
2. « Améliorer le style » → modale de l'assistant, version optimisée affichée (l'IA de secours répond quand la passerelle est absente) ;
3. clic **réel** au centre du bouton « Appliquer à ma publication » (`page.mouse.click`, jamais de clic forcé) ; juste avant, `document.elementFromPoint` dit quel élément est réellement sous le doigt à ce point ;
4. « Publier » → le texte doit apparaître dans le fil, hors du composeur.

Écrans : téléphone 390 × 844 (iPhone), Android 360 × 800, ordinateur 1440 × 900. `avant` = `origin/main` (`ba1ba7d`, v6.40.1 servie), `apres` = cette branche.

## Résultats (`avant-parcours.json`, `apres-parcours.json`)

| Écran | État | Élément sous le doigt au centre du bouton | Modale fermée après le clic réel | Texte publié dans le fil | Voile de la modale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 390 × 844 | avant | **le dock** (`.mir-dock`) | **non — parcours bloqué** | — | dans `#root`, z-index 50, commence à 24 px du haut |
| 390 × 844 | après | le bouton « Appliquer à ma publication » | oui, texte appliqué au champ | **oui** (1 occurrence) | sur `<body>`, z-index 2147482000, `#root` inerte, couvre toute la fenêtre |
| 360 × 800 | avant | **le dock** | **non — parcours bloqué** | — | idem avant |
| 360 × 800 | après | le bouton | oui | **oui** | idem après |
| 1440 × 900 | avant | le bouton (pas de dock sur ordinateur) | oui | oui | dans `#root`, z-index 50, décalé de 24 px |
| 1440 × 900 | après | le bouton | oui | oui | sur `<body>`, carte centrée |

Zéro erreur JavaScript relevée sur les six parcours. Métriques comparées avant/après (même sonde sur les deux serveurs) : 29 propriétés identiques (polices, dégradés d'en-tête, matière de la carte, hauteur, pied, bouton) ; seule la position verticale change de 12 px (la carte est désormais centrée sur la fenêtre, elle était décalée vers le bas).

## Fichiers

- `<etat>-<ecran>-1-saisie.png`, `-2-modale.png`, `-3-apres-clic.png`, `-4-publie.png` pour les deux téléphones (l'avant n'a pas d'étape 4 : la modale ne s'est pas fermée) ; pour l'ordinateur, `-2-modale.png` et `-4-publie.png` seulement (le parcours y passait déjà).
- `parcours.cjs` : rejouer avec `ETAT=avant|apres PORT=<port du serveur Vite> node parcours.cjs <dossier>` (le serveur Vite sert `preview-harness.html`, copie d'`index.html` qui charge le harnais de prévisualisation).

## Limites honnêtes

- Harnais local (même code, données de démonstration), pas l'application derrière l'authentification ; Chromium émulé, pas Safari iOS ni appareil réel : la zone sûre (`env(safe-area-inset-bottom)`) et l'unité `dvh` sont posées mais non mesurées sur iPhone réel.
- Pendant l'ouverture de la modale, tout `#root` est inerte et sous le voile (dock, barre flottante et sculpture de l'Architecte compris) : comportement de dialogue modal, identique au studio Visuel IA ; tout redevient actif et visible à la fermeture.
