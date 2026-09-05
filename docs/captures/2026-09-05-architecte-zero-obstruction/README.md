# Preuves — zéro obstruction strict de l'Architecte (5 septembre 2026, DEC-2026-075, v6.38.0)

Consigne ferme de la Direction : « Tu ne masques jamais l'écran de fond ni les options de MokNet. Aucun panneau, aucun fond ne doit couvrir l'application. Au clic, une petite zone de communication au maximum, repliable, sans jamais cacher MokNet. Photo de preuve obligatoire. »

**Niveau de preuve : 🗄️ banc navigateur réel** — `design-lab/banc/sculpture.html` servi par vite (composant réel `ArchitecteFloatingBar`, profil de banc sans compte ni réseau, page qui ressemble à MokNet : six cartes de contenu, dock de navigation sur téléphone), Chromium 1194 piloté par Playwright, ordinateur 1280 × 800 et téléphone 390 × 844 (iPhone 13, ×2). Script : `essai-zero-obstruction.cjs` (scratchpad de session, même méthode que `scripts/production-controlee/`). Mesures brutes : `mesures.json`.

« Part couverte » = part de l'écran occupée par l'interface de l'Architecte (sculpture, légende, barre, ligne de saisie, panneau), grille de 4 px. La réponse longue (324 caractères) est injectée sans modèle par le crochet de banc `window.__bancArchitecte.addSessionTurn` : c'est exactement le cas qui, en v6.37.0, ouvrait le panneau tout seul.

| Étape | Ordinateur | Téléphone |
|---|---|---|
| 1 — Repos : seule la sculpture | `ordinateur-1-repos.jpg` — 0,9 %, aucun panneau, cartes libres 6/6 | `mobile-1-repos.jpg` — 2,1 %, aucun panneau, cartes libres 5/6, dock libre |
| 2 — Clic : la présentation validée parle dans la sculpture, petite barre | `ordinateur-2-presentation.jpg` — 2,4 %, aucun panneau, cartes libres 6/6 | `mobile-2-presentation.jpg` — 6,8 %, aucun panneau, cartes libres 5/6, dock libre |
| 3 — Fin de la présentation, accueil dit | `ordinateur-3-apres-presentation.jpg` — 2,6 %, aucun panneau, cartes libres 6/6 | `mobile-3-apres-presentation.jpg` — 6,8 %, aucun panneau, cartes libres 5/6, dock libre |
| 4 — Réponse longue reçue : RIEN ne s'ouvre, la flèche signale | `ordinateur-4-reponse-longue.jpg` — 2,6 %, aucun panneau, point d'invitation, cartes libres 6/6 | `mobile-4-reponse-longue.jpg` — 6,8 %, aucun panneau, point d'invitation, cartes libres 5/6, dock libre |
| 5 — Écrire : une seule ligne | `ordinateur-5-saisie.jpg` — 3,9 %, aucun panneau, ligne de saisie, point d'invitation, cartes libres 6/6 | `mobile-5-saisie.jpg` — 9,7 %, aucun panneau, ligne de saisie, point d'invitation, cartes libres 5/6, dock libre |
| 6 — La personne déplie elle-même (flèche) | `ordinateur-6-panneau-deplie.jpg` — 9,7 %, panneau, cartes libres 5/6 | `mobile-6-panneau-deplie.jpg` — 22,7 %, panneau, cartes libres 4/6, dock libre |
| 7 — La personne replie | `ordinateur-7-replie.jpg` — 3,9 %, aucun panneau, ligne de saisie, point d'invitation, cartes libres 6/6 | `mobile-7-replie.jpg` — 9,7 %, aucun panneau, ligne de saisie, point d'invitation, cartes libres 5/6, dock libre |
| 8 — Fermé | `ordinateur-8-ferme.jpg` — 1,0 %, aucun panneau, cartes libres 6/6 | `mobile-8-ferme.jpg` — 2,3 %, aucun panneau, cartes libres 5/6, dock libre |

**Lecture** : à aucune étape l'Architecte n'ouvre quelque chose de lui-même ; la seule étape où un panneau existe est celle où la personne l'a déplié (6), et elle le replie d'un appui (7). Sur téléphone, le dock reste libre et cliquable du début à la fin.

**Ce que ce banc ne prouve pas** : l'état après connexion sur `moknet.net` (aucun compte disponible pour l'essai — contrôle visuel de la Direction demandé), Safari/iOS.
