# Réseau MOC — même disposition des boutons sur ordinateur et téléphone (DEC-2026-076, v6.39.0)

Mission de la Direction (5 septembre 2026) : « Harmonise la disposition des boutons entre ordinateur et téléphone. Les actions de publication comme photo, vidéo, audio, expert, live et autres doivent être visibles et accessibles sans défilement horizontal gênant sur téléphone. Garde une présentation propre, raisonnable, facile à utiliser, sans rien casser. […] Périmètre strict : interface publication et options de Réseau Moknet ; la disposition des boutons sur ordinateur fait la même chose sur téléphone, comme sur la photo. »

Périmètre touché : le bloc CSS « COMPOSEUR A7 » et le bloc « BANDE AURORE » d'`index.html` (requêtes de conteneur avec repli `@supports`), les commentaires de `components/SocialFeed.tsx`, les gardes CSS des tests. **Aucun balisage modifié, aucun gestionnaire touché, avatar intouché** (aucune règle ne le vise ; même boîte et mêmes coordonnées avant et après sur les quatre écrans).

## Ce qui change (téléphone et tablette étroite seulement)

| Zone | Avant (DEC-2026-058 / 061) | Après (DEC-2026-076) |
| :--- | :--- | :--- |
| Composeur — médias (Photo, Vidéo, Document, Voix) | rail masqué, quatre icônes **sans libellé** en ligne sous le champ | rail **visible avec ses libellés**, sous l'avatar dans la première colonne, comme à gauche du champ sur ordinateur |
| Composeur — Assistant IA | intitulé masqué, quatre actions en 2 × 2 | intitulé « Assistant IA » affiché, **quatre actions nommées sur une ligne**, comme sur ordinateur |
| Composeur — champ | 262 px | 245 px (téléphone 390) ; saisie et compteur vérifiés |
| Bande Aurore (16 orbes) | rail horizontal aimanté : **12 orbes hors écran, défilement obligatoire** | **grille de 4 × 4**, damier conservé, libellés courts, **aucun défilement horizontal, 0 orbe hors écran** |
| Ordinateur | — | **identique** (mêmes mesures avant/après) |
| Carte très étroite (≤ 300 px de largeur intérieure, écrans de 320 px) | ligne d'icônes sous le champ | inchangé : la ligne d'icônes reprend le relais (repli conservé, testé) |

## Captures

| Fichier | Écran | Contenu |
| :--- | :--- | :--- |
| `avant-ordinateur.png` / `apres-ordinateur.png` | 1440 × 900 | page entière : composeur + bande, identiques |
| `avant-tablette.png` / `apres-tablette.png` | 820 × 1180 | page entière (carte de 500 px : rail sous l'avatar, bande 4 × 4) |
| `avant-telephone.png` / `apres-telephone.png` | 390 × 844 | page entière, composeur en haut |
| `avant-telephone-composeur.png` / `apres-telephone-composeur.png` | 390 × 844 | le composeur seul : rail masqué → rail avec libellés sous l'avatar |
| `avant-telephone-bande.png` / `apres-telephone-bande-ecran.png` | 390 × 844 | la bande : rail défilant → grille 4 × 4 à l'écran |
| `apres-telephone-saisie.png` | 390 × 844 | texte saisi : compteur « 76 caractères », Publier actif |
| `avant-etroit-composeur.png` / `apres-etroit-composeur.png` | 320 × 568 | repli « carte très étroite » : ligne d'icônes conservée |
| `avant-mesures.json` / `apres-mesures.json` | 4 écrans | mesures DOM complètes |

## Mesures (harnais Chromium, `preview-harness.html?tab=social`)

| Écran | Composeur (avant → après) | Bande Aurore (avant → après) | Page |
| :--- | :--- | :--- | :--- |
| ordinateur 1440 × 900 | rail visible → visible ; libellés médias 4 → 4 ; ligne d'icônes non → non ; champ 927 → 927 px ; actions IA sur 1 → 1 rangée ; avatar 325,132 44 × 44 → 325,132 44 × 44 ; 11 → 11 boutons visibles | 16 → 16 orbes visibles ; défilement horizontal non → non ; 0 → 0 hors écran ; bulle 54 → 54 px ; hauteur 253 → 253 px | débordement non → non ; erreurs JS 1 → 1 (identique, hors périmètre) |
| tablette 820 × 1180 | rail masqué → **visible** ; libellés 0 → **4** ; ligne d'icônes oui → non ; champ 404 → 387 px ; actions IA 2 → **1** rangée ; avatar 325,164 44 × 44 → idem ; 11 → 11 | 16 → 16 ; défilement **OUI → non** ; hors écran **10 → 0** ; colonnes 16 → 4 ; bulle 46 → 46 px ; hauteur 115 → 398 px | non → non ; 1 → 1 |
| téléphone 390 × 844 | rail masqué → **visible** ; libellés 0 → **4** ; ligne d'icônes oui → non ; champ 262 → 245 px ; actions IA 2 → **1** rangée ; avatar 37,82 44 × 44 → idem ; 11 → 11 ; saisie : « 76 caractères », Publier actif | 16 → 16 ; défilement **OUI → non** ; hors écran **12 → 0** ; colonnes 16 → 4 ; bulle 46 → 46 px ; hauteur 115 → 398 px | non → non ; 1 → 1 |
| étroit 320 × 568 | rail masqué → masqué (repli) ; ligne d'icônes oui → oui ; champ 192 → 192 px ; actions IA 2 → 2 rangées ; avatar 37,82 44 × 44 → idem ; 11 → 11 | 16 → 16 ; défilement **OUI → non** ; hors écran **13 → 0** ; colonnes 16 → 4 ; hauteur 115 → 410 px | non → non ; 1 → 1 |

Cibles sous 44 px : inchangées avant/après (l'étincelle de 42 px et le groupe Brouillon | Publier de 41 px de haut existaient déjà ; aucune orbe de la bande ni du rail n'est sous 44 px). L'unique erreur de console, identique avant et après, est le blocage de `navigator.vibrate` avant tout geste utilisateur (harnais, hors périmètre).

## Niveau de preuve et limites honnêtes

🧪 Banc : harnais local (Chromium headless 1.57, Supabase absent, polices de secours, avatar factice du harnais). Le harnais prouve le rendu et la disposition ; la production prouvera que ce code est servi ; le contrôle visuel final dans l'application appartient à la Direction. Non vérifié ici : Safari iOS réel, appareil physique. Aucune production tant que le feu vert écrit n'est pas donné.
