# Captures avant / après — Espace Experts « Plateaux de cristal » (5 septembre 2026, DEC-2026-056)

Direction **D « Plateaux de cristal »** choisie par la Direction parmi les cinq
directions proposées. Produites par le harnais local **non versionné** (Layout +
ExpertsHub rendus sans Supabase) sur `origin/main` (**avant**, `e56b6ce`) et sur
la branche (**après**), dans Chromium headless via Playwright, à **1440×900**
(ordinateur) et **390×844, densité 2** (téléphone). Les portraits Unsplash sont
servis en local (le bac à sable ne laisse pas Chromium sortir), ce sont les
mêmes fichiers que ceux référencés par `constants.ts`.

| Écran | Avant | Après |
| :--- | :--- | :--- |
| Entrée de l'espace Experts, ordinateur | `avant-ordinateur.png` | `apres-ordinateur.png` |
| Bas du panneau, ordinateur (les 13 experts, dont la 3e rangée : les trois experts humains vérifiés) | — | `apres-ordinateur-bas.png` |
| Bulle au survol (soulèvement + inclinaison 3D) | — | `apres-ordinateur-survol.png` |
| Fiche ouverte au clic (expert IA, cinq actions) | — | `apres-ordinateur-fiche.png` |
| Formulaire de rendez-vous ouvert depuis la fiche d'un expert humain | — | `apres-ordinateur-rdv.png` |
| Entrée de l'espace Experts, téléphone | `avant-telephone.png` | `apres-telephone.png` |
| Fiche ouverte, téléphone | — | `apres-telephone-fiche.png` |
| Bas du panneau, téléphone (experts humains) | — | `apres-telephone-bas.png` |

Niveau de preuve : 🧪 banc (navigateur réel, données locales, Supabase non
configuré). Le contrôle final dans l'application appartient à la Direction.

## Mesures (`mesures.json`, DOM + `getComputedStyle`, Chromium)

| Mesure | Avant (`origin/main` e56b6ce) | Après (branche) |
| :--- | :--- | :--- |
| Titre « Espace Experts & Parcours de Vie » affiché | oui | non (titre `sr-only` « Espace Experts », lecteurs d’écran seulement) |
| Sous-titre « Accompagnement continu, mémoire active… » | oui | non |
| Bandeau sombre « Accompagnement Continu & Multimodal de Vie » | oui | non |
| Champ « Rechercher par nom, spécialité, langue… » | oui | non |
| Bascule « Tous (13) / Experts IA / Experts Humains » | oui | non |
| Cartes blanches d’experts | 13 | 0 |
| Phrase unique au-dessus des bulles | 0 | 1 — « Nos experts vous accompagnent avec des conseils fiables, des orientations pratiques et une assistance adaptée à vos besoins. » |
| Bulles de cristal / plateaux cliquables | 0 / 0 | 13 / 13 |
| Experts par rangée (ordinateur 1440 px / téléphone 390 px) | — | 5 / 2 |
| Décalage en damier de la 2e bulle (ordinateur / téléphone) | — | 22 px / 18 px |
| Animations calculées (flotteur / lumière / pastille) | — | cristal-flotte / cristal-tourne / cristal-pouls |
| Inclinaison au survol (variables posées / matrice 3D) | — | --rx:4.5deg --ry:4.8deg --px:-1.3px --py:1.5px / matrix3d(…) |
| Fiche au clic : nom / actions (expert IA) | — | Maître Diallo / Discuter, Vocal, Vidéo, Nouveau dossier, Analyser un fichier |
| Fiche d’un expert humain : actions | — | Discuter, Vocal, Vidéo, Nouveau dossier, Prendre RDV |
| « Prendre RDV » ouvre le formulaire existant | — | oui |
| Le focus entre dans la fiche à l’ouverture | — | oui |
| prefers-reduced-motion : animation du flotteur / de la lumière | — | none / none |
| Échap referme la fiche et rend le focus au bouton de l'expert | — | oui (`.cristal-fiche` = 0 après Échap) |
| Clic sur le voile referme la fiche | — | oui |
| **Revue indépendante** — le voile de la fiche est rendu dans `<body>` et couvre toute la fenêtre | — | oui |
| Ce qui se trouve sous le pointeur au-dessus de la barre latérale, fiche ouverte (`elementFromPoint`) | — | `cristal-voile` (la coquille n'est plus cliquable) |
| Racine `#root` inerte pendant la fiche / libérée après Échap | — | oui / oui |
| Pastille de disponibilité : dans le flotteur, hors du cercle, parent sans `overflow: hidden`, taille entière | — | oui / 3 coins hors du cercle sans rognage / `visible` / 14×14 px |
| Pouls de disponibilité : sur l'élément / sur `::after` (compositeur) | — | `none` / `cristal-pouls` |

Note : un autre `[role="dialog"]` existe toujours dans la page — c'est le
tiroir de navigation mobile de la coquille (`Layout`), toujours présent dans le
DOM ; il ne fait pas partie de cet écran.

Les captures « après » ont été refaites après la revue indépendante (fiche par
portail au-dessus de toute la coquille, pastille hors du cercle, survol réservé
aux vrais pointeurs) ; les captures « avant » sont inchangées.

## Ce qui n'a pas été touché

Le Live et le Studio Live, la barre flottante de l'Architecte, l'en-tête et la
barre latérale de la coquille, la Santé Globale, les autres onglets du hub
(Parcours & Dossiers, Entretien Multimodal, Chef de Projet, Conseil des
Experts, Bureau Numérique, École Numérique, Mémoire Active), les données des
experts.
