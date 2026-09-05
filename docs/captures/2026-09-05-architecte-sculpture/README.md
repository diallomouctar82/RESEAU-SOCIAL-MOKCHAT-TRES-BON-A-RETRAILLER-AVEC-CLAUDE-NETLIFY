# Captures — la sculpture vivante de l'Architecte (DEC-2026-072, v6.36.0)

Essai navigateur réel du 5 septembre 2026 : banc `design-lab/banc/sculpture.html` (composant réel `ArchitecteFloatingBar`, profil de banc, aucun compte ni réseau externe) servi par vite, Chromium de preuve, ordinateur 1280 × 800 et téléphone 390 × 844 (×2, tactile). Le script du banc (`essai-sculpture.cjs`) enchaîne : repos → clic sur la sculpture → présentation (mesures à 2,5 s) → fin → flèche (panneau) → clic sur la sculpture (fermeture). `mesures.json` contient les positions, l'état du lecteur, les pixels du canevas et les erreurs relevées.

| Étape | Ordinateur | Téléphone |
|---|---|---|
| 1. Repos : seule la sculpture, détourée, en bas à droite | `ordinateur-01-repos-sculpture-seule.jpg` | `telephone-01-repos-sculpture-seule.jpg` |
| 2. Clic : la vidéo validée parle dans la sculpture, la barre s'ouvre, panneau replié | `ordinateur-02-clic-presentation-detouree-barre.jpg` | `telephone-02-clic-presentation-detouree-barre.jpg` |
| 3. Fin de la vidéo : accueil prononcé, écoute demandée | `ordinateur-03-fin-accueil-ecoute.jpg` | `telephone-03-fin-accueil-ecoute.jpg` |
| 4. Flèche : la conversation se déplie | `ordinateur-04-fleche-panneau-deplie.jpg` | `telephone-04-fleche-panneau-deplie.jpg` |
| 5. Clic sur la sculpture : tout se referme, la sculpture reste | `ordinateur-05-ferme-sculpture-seule.jpg` | `telephone-05-ferme-sculpture-seule.jpg` |

Résultats clés (voir `mesures.json`) : lecture demandée dans le geste (`playing`, source `vision-smart-heygen.cutout.webm` 720 × 1440 sur ce Chromium sans H.264), canevas de la sculpture avec 46 % de pixels transparents et 50 % opaques (détourage réel), fin réelle à 8,17 s (`ended` vrai, état `idle` après 8,6 s), présence « parle » pendant la vidéo, accueil et écoute différés à la fin, 0 erreur de page ni de média (les seules erreurs sont les ressources externes volontairement coupées). Le micro du banc est un faux périphérique : « Le micro n'a pas démarré — utilisez la saisie » est le comportement attendu.
