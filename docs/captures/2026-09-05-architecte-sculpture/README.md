# Captures — la sculpture vivante de l'Architecte, zéro obstruction (DEC-2026-074, v6.37.0)

Essai navigateur réel du 5 septembre 2026 : banc `design-lab/banc/sculpture.html` (composant réel `ArchitecteFloatingBar` posé sur une page qui ressemble à MokNet : six cartes de contenu et, sur téléphone, le dock de navigation), servi par vite, Chromium de preuve, ordinateur 1280 × 800 et téléphone 390 × 844 (×2, tactile). Le script du banc enchaîne : repos → clic sur la sculpture → présentation (mesures à 2,5 s) → fin → flèche (panneau) → clic sur la sculpture (fermeture). `mesures.json` contient, pour chaque état, les rectangles de l'interface de l'Architecte, la **part de l'écran qu'elle couvre**, si le dock reste libre et combien de cartes de contenu restent entièrement dégagées.

| Étape | Ordinateur | Téléphone |
|---|---|---|
| 1. Repos : seule la sculpture, détourée, en bas à droite | `ordinateur-01-repos-sculpture-seule.jpg` | `telephone-01-repos-sculpture-seule.jpg` |
| 2. Clic : la vidéo validée parle dans la sculpture, la petite barre d'icônes s'ouvre à côté | `ordinateur-02-clic-presentation-petite-barre.jpg` | `telephone-02-clic-presentation-petite-barre.jpg` |
| 3. Fin de la vidéo : accueil prononcé, écoute demandée | `ordinateur-03-fin-accueil-ecoute.jpg` | `telephone-03-fin-accueil-ecoute.jpg` |
| 4. Flèche : le panneau étroit se déplie, à la demande | `ordinateur-04-fleche-panneau-etroit.jpg` | `telephone-04-fleche-panneau-etroit.jpg` |
| 5. Clic sur la sculpture : tout se referme, la sculpture reste | `ordinateur-05-ferme-sculpture-seule.jpg` | `telephone-05-ferme-sculpture-seule.jpg` |

## Obstruction mesurée (part de l'écran couverte par l'interface de l'Architecte)

| État | Ordinateur 1280 × 800 | Téléphone 390 × 844 | Dock (téléphone) | Cartes de contenu dégagées |
|---|---|---|---|---|
| Repos (sculpture seule) | 0,9 % | 2,1 % | libre, cliquable | 6/6 · 5/6 |
| Présentation + petite barre | 2,4 % | 6,8 % | libre | 6/6 · 5/6 |
| Après la vidéo (accueil, écoute) | 2,6 % | 6,8 % | libre | 6/6 · 5/6 |
| Panneau déplié (à la demande) | 7,8 % | 20,2 % | libre | 6/6 · 4/6 |
| Refermé | 1,0 % | 2,3 % | libre | 6/6 · 5/6 |

Autres résultats : lecture demandée dans le geste (`playing`, source `vision-smart-heygen.cutout.webm` 720 × 1440 sur ce Chromium sans H.264), canevas de la sculpture avec 46 % de pixels transparents et 50 % opaques (détourage réel), fin réelle à 8,17 s (`ended` vrai, état `idle` après 8,6 s), présence « parle » pendant la vidéo, accueil et écoute différés à la fin, 0 erreur de page ni de média. Le micro du banc est un faux périphérique : « Le micro n'a pas démarré — utilisez la saisie » est le comportement attendu.
