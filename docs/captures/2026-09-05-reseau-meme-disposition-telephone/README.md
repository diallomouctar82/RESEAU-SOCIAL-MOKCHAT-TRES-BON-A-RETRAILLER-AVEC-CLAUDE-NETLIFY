# Réseau MOC — même disposition des boutons sur ordinateur et téléphone (DEC-2026-078, v6.40.0)

Mission de la Direction (5 septembre 2026) : « Harmonise la disposition des boutons entre ordinateur et téléphone. Les actions de publication comme photo, vidéo, audio, expert, live et autres doivent être visibles et accessibles sans défilement horizontal gênant sur téléphone. Garde une présentation propre, raisonnable, facile à utiliser, sans rien casser. […] Périmètre strict : interface publication et options de Réseau Moknet ; la disposition des boutons sur ordinateur fait la même chose sur téléphone, comme sur la photo. »

Périmètre touché : le bloc CSS « COMPOSEUR A7 » et le bloc « BANDE AURORE » d'`index.html` (requêtes de conteneur avec repli `@supports`), les commentaires de `components/SocialFeed.tsx`, les gardes CSS des tests. **Aucun balisage modifié, aucun gestionnaire touché, avatar intouché** (aucune règle ne le vise ; même boîte et mêmes coordonnées avant et après sur les six écrans).

## Ce qui change (téléphones et tablette étroite seulement)

| Zone | Avant (DEC-2026-058 / 061) | Après (DEC-2026-078) |
| :--- | :--- | :--- |
| Composeur — médias (Photo, Vidéo, Document, Voix) | rail masqué, quatre icônes **sans libellé** en ligne sous le champ | rail **visible avec ses libellés**, sous l'avatar dans la première colonne, comme à gauche du champ sur ordinateur |
| Composeur — Assistant IA | intitulé masqué, quatre actions en 2 × 2 | intitulé « Assistant IA » affiché, **quatre actions nommées sur une ligne**, comme sur ordinateur |
| Composeur — champ | 262 px (390), 232 px (360), 247 px (375) | 249 px (390), 219 px (360), 234 px (375) ; saisie et compteur vérifiés |
| Composeur — Brouillon \| Publier | 216 px | 200 px avec les polices de secours (208 px calculés avec Outfit) : tient dans la colonne de droite d'un écran de 360 px |
| Bande Aurore (16 orbes) | rail horizontal aimanté : **12 orbes hors écran, défilement obligatoire** | **grille de 4 × 4**, damier conservé, libellés courts, **aucun défilement horizontal, 0 orbe hors écran**, dernière orbe dans la carte |
| Ordinateur | — | **identique** (mêmes mesures avant/après) |
| Carte très étroite : contenu ≤ 270 px, soit un écran de 344 px au plus (320 px) | ligne d'icônes sous le champ, intitulé IA masqué, champ 96 px | ligne d'icônes sous le champ conservée (repli), **intitulé « Assistant IA » désormais visible** et champ de 120 px comme sur les autres téléphones (rien ne disparaît ; composeur 555 → 599 px de haut) |

Seuil du repli : le conteneur `a7` mesure l'écran moins 74 px (marges 32, remplissage 40, bordure 2). Le seuil de 270 px vaut donc **écran ≤ 344 px** : 320 px (iPhone SE 1re génération) reçoit le repli ; **360 px (Android courant) et 375 px (iPhone SE / 8 / mini) reçoivent la disposition de l'ordinateur** — point relevé par la revue indépendante (le seuil initial de 300 px les excluait) et corrigé, mesures à l'appui.

## Captures

| Fichier | Écran | Contenu |
| :--- | :--- | :--- |
| `avant-ordinateur.png` / `apres-ordinateur.png` | 1440 × 900 | page entière : composeur + bande, identiques |
| `avant-tablette.png` / `apres-tablette.png` | 820 × 1180 | page entière (carte de 458 px de contenu : rail sous l'avatar, bande 4 × 4) |
| `avant-telephone.png` / `apres-telephone.png` | 390 × 844 | page entière, composeur en haut |
| `avant-telephone-composeur.png` / `apres-telephone-composeur.png` | 390 × 844 | le composeur seul : rail masqué → rail avec libellés sous l'avatar |
| `avant-telephone-bande.png` / `apres-telephone-bande-ecran.png` | 390 × 844 | la bande : rail défilant → grille 4 × 4 à l'écran |
| `apres-telephone-saisie.png` | 390 × 844 | texte saisi : compteur « 76 caractères », Publier actif |
| `avant-android360-composeur.png` / `apres-android360-composeur.png`, `apres-android360-bande-ecran.png` | 360 × 800 | Android courant : disposition de l'ordinateur, groupe Brouillon \| Publier dans sa colonne, bande 4 × 4 |
| `avant-iphone375-composeur.png` / `apres-iphone375-composeur.png` | 375 × 667 | iPhone SE / 8 / mini : disposition de l'ordinateur |
| `avant-etroit-composeur.png` / `apres-etroit-composeur.png` | 320 × 568 | repli « carte très étroite » : ligne d'icônes conservée |
| `avant-mesures.json` / `apres-mesures.json` | 6 écrans | mesures DOM complètes |
| `mesurer.cjs` | — | le script Playwright qui produit ces captures et ces JSON (commande exacte en tête du fichier) |

## Mesures (harnais Chromium 1.57, `preview-harness.html?tab=social` ; avant = `origin/main` `f64f7ee`, après = la branche)

| Écran (contenu du conteneur) | Composeur (avant → après) | Bande Aurore (avant → après) | Page |
| :--- | :--- | :--- | :--- |
| ordinateur 1440 × 900 (1078 px) | rail visible → visible ; libellés médias 4 → 4 ; ligne d'icônes non → non ; champ 927 → 927 px ; actions IA 1 → 1 rangée ; intitulé IA oui → oui ; Brouillon \| Publier 216 → 216 px ; avatar 325,132 44 × 44 → idem ; 11 → 11 boutons | 16 → 16 orbes ; défilement non → non ; hors écran 0 → 0 ; bulle 54 → 54 px ; hauteur 253 → 253 px | débordement non → non ; cibles < 44 px 3/0 → 3/0 ; erreurs JS 1 → 1 |
| tablette 820 × 1180 (458 px) | rail masqué → **visible** ; libellés 0 → **4** ; ligne d'icônes oui → non ; champ 404 → 391 px ; actions IA 2 → **1** rangée ; intitulé IA non → oui ; groupe 216 → 200 px, dans sa colonne ; avatar 325,164 44 × 44 → idem ; 11 → 11 | 16 → 16 ; défilement **OUI → non** ; hors écran **10 → 0** ; colonnes 16 → 4 ; bulle 46 → 46 px ; hauteur 115 → 398 px ; dernière orbe dans la carte oui | non → non ; 3/0 → 3/0 ; 1 → 1 |
| téléphone 390 × 844 (316 px) | rail masqué → **visible** ; libellés 0 → **4** ; ligne d'icônes oui → non ; champ 262 → 249 px ; actions IA 2 → **1** rangée ; intitulé IA non → oui ; groupe 216 → 200 px, dans sa colonne ; avatar 37,82 44 × 44 → idem ; 11 → 11 ; saisie : « 76 caractères », Publier actif | 16 → 16 ; défilement **OUI → non** ; hors écran **12 → 0** ; colonnes 16 → 4 ; bulle 46 → 46 px ; hauteur 115 → 398 px ; dernière orbe dans la carte oui | non → non ; 3/0 → 3/0 ; 1 → 1 |
| Android 360 × 800 (286 px) | rail masqué → **visible** ; libellés 0 → **4** ; ligne d'icônes oui → non ; champ 232 → 219 px ; actions IA 2 → **1** rangée ; intitulé IA non → oui ; groupe 216 → 200 px, dans sa colonne ; avatar 37,82 44 × 44 → idem ; 11 → 11 ; saisie : « 76 caractères », Publier actif | 16 → 16 ; défilement **OUI → non** ; hors écran **12 → 0** ; colonnes 16 → 4 ; bulle 46 → 46 px ; hauteur 115 → 398 px ; dernière orbe dans la carte oui | non → non ; 3/0 → 3/0 ; 1 → 1 |
| iPhone 375 × 667 (301 px) | rail masqué → **visible** ; libellés 0 → **4** ; ligne d'icônes oui → non ; champ 247 → 234 px ; actions IA 2 → **1** rangée ; intitulé IA non → oui ; groupe 216 → 200 px, dans sa colonne ; avatar 37,82 44 × 44 → idem ; 11 → 11 ; saisie : « 76 caractères », Publier actif | 16 → 16 ; défilement **OUI → non** ; hors écran **12 → 0** ; colonnes 16 → 4 ; bulle 46 → 46 px ; hauteur 115 → 398 px ; dernière orbe dans la carte oui | non → non ; 3/0 → 3/0 ; 1 → 1 |
| étroit 320 × 568 (246 px) | rail masqué → masqué (repli) ; ligne d'icônes oui → oui ; champ 192 → 192 px ; actions IA 2 → 2 rangées ; intitulé IA non → **oui** ; groupe 192 → 192 px ; avatar 37,82 44 × 44 → idem ; 11 → 11 ; saisie : « 76 caractères », Publier actif | 16 → 16 ; défilement **OUI → non** ; hors écran **13 → 0** ; colonnes 16 → 4 ; hauteur 115 → 410 px ; dernière orbe dans la carte oui | non → non ; 3/0 → 3/0 ; 1 → 1 |

Cibles sous 44 px : inchangées avant/après (l'étincelle de 42 px et le groupe Brouillon \| Publier de 41 px de haut existaient déjà ; aucune orbe de la bande ni du rail n'est sous 44 px). L'unique erreur de console, identique avant et après, est le blocage de `navigator.vibrate` avant tout geste utilisateur (harnais, hors périmètre). Sur ordinateur, les boîtes du composeur, du champ et de la bande sont strictement égales avant et après.

## Niveau de preuve et limites honnêtes

🧪 Banc : harnais local (Chromium headless 1.57, Supabase absent, polices de secours — la colonne du rail est dimensionnée par le mot « Document » à 10 px et peut varier de quelques pixels avec la police Outfit réelle ; le groupe Brouillon \| Publier mesure 200 px ici et 208 px calculés avec Outfit, pour une colonne de 219 px à 360 px). Le harnais prouve le rendu et la disposition ; la production prouvera que ce code est servi ; le contrôle visuel final dans l'application appartient à la Direction. Non vérifié ici : Safari iOS réel, appareil physique. Aucune production tant que le feu vert écrit n'est pas donné.
