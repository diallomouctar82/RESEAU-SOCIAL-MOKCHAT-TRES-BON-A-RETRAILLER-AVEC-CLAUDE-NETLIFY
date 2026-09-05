# Captures avant / après — Bande « Aurore » du Réseau MOC (5 septembre 2026, DEC-2026-058)

Variante **3 « Aurore »** choisie par la Direction parmi les dix variantes
proposées sur la base « Orbes lumineux » (elle-même choisie parmi dix
directions). Produites par le harnais local **non versionné** (Layout +
SocialFeed rendus sans Supabase, `?tab=social`) sur `origin/main` (**avant**,
`551ea65`) et sur la branche (**après**, `8adffb1`), dans Chromium headless via
Playwright, à **1440×900** (ordinateur), **820×1180, densité 2** (tablette) et
**390×844, densité 2** (téléphone). La bande est amenée en haut de la zone de
contenu avant chaque capture ; les fichiers `-bande` sont la carte seule.

| Écran | Avant | Après |
| :--- | :--- | :--- |
| Réseau MOC, ordinateur (la bande sous l'en-tête) | `avant-ordinateur.png` | `apres-ordinateur.png` |
| La carte seule, ordinateur (deux rangées de huit, damier) | `avant-ordinateur-bande.png` | `apres-ordinateur-bande.png` |
| Orbe « Équipe & Experts » au survol (soulèvement, anneau, lueur) | — | `apres-ordinateur-survol.png` |
| La carte seule, tablette (rail horizontal, libellés courts) | `avant-tablette-bande.png` | `apres-tablette-bande.png` |
| Réseau MOC, téléphone | `avant-telephone.png` | `apres-telephone.png` |
| La carte seule, téléphone (rail aimanté) | — | `apres-telephone-bande.png` |

Niveau de preuve : 🧪 banc (navigateur réel, données locales, Supabase non
configuré, polices de secours du bac à sable — Outfit est servie par Google
Fonts en production). Le contrôle final dans l'application appartient à la
Direction.

## Mesures (`avant-mesures.json` / `apres-mesures.json`, DOM + `getComputedStyle`, Chromium)

| Mesure | Avant (`origin/main` 551ea65) | Après (branche) |
| :--- | :--- | :--- |
| Boutons dans la carte, ordinateur | 7 | **16**, dans l'ordre imposé |
| Boutons par rangée, ordinateur | 7 | 8 (deux rangées) |
| Décalage en damier entre deux orbes voisines | 0 | 10 px |
| Orbe (largeur × hauteur, rayon) | — | 54 × 54 px, 50 % |
| Animation du halo (`::before`) | — | `aurore-halo` |
| Teintes `--h` des seize entrées | — | 196, 204, 212, 262, 14, 158, 330, 186, 230, 350, 150, 42, 200, 176, 280, 30 |
| Hauteur de la carte, ordinateur | 113 px | 253 px |
| Tablette (carte de 500 px) | 7 boutons sur une ligne | rail horizontal de 16 orbes de 46 px, libellés courts (« Experts ») |
| Téléphone (carte de 358 px) | grille 4 × 2 | rail horizontal de 16 orbes de 46 px, libellés courts |
| Débordement horizontal de la page | non | non (les trois écrans) |
| Erreurs JS applicatives | aucune | aucune |
