# Bande sombre au sommet du cadre rond de `/architecte` — avant / après (5 septembre 2026, DEC-2026-079, ajustement v6.42.1)

Niveau de preuve : 🧪 **banc navigateur réel** (Chromium headless, build `chromium-1194` de Playwright 1.56, `npx vite` sur le dépôt, Supabase absent, Tailwind servi localement, moteur MediaPipe **réel** pour la régénération du portrait) pour les captures « avant » (arbre de travail `1c2daf6`, v6.41.0) et « après » (arbre livré) ; 🚀 **production** pour les deux captures `production-avant-*` (`moknet.net`, 5/09 à 16:04 UTC, avant correction). Le contrôle visuel final dans l'application appartient à la Direction.

## Constat de la Direction

« Bande sombre en haut du cadre rond de la page /architecte. » Cause mesurée : la photo validée n'a pas de marge au-dessus du crâne ; le moteur de cadrage laissait le débord du cadre **transparent**, et l'export JPEG le rendait **noir**. Le modèle vidéo HeyGen, généré depuis ce portrait, portait la même bande ; l'affiche aussi.

| Fichier (v6.41.0) | Bande noire mesurée (lignes dont la luminance moyenne est < 40) |
| :--- | :--- |
| `architecte.webp` (768 px) | 95 px — 12,4 % |
| `vision-smart-heygen.mp4` (720 px) | 89 px — 12,4 % (lignes 0 à 88) |
| `vision-smart-heygen.webp` (affiche 360 px) | 44 px — 12,2 % |

## Remède (dans le moteur de production, pas une retouche à la main)

- `photoAvatarEngine.drawFramed` comble le débord par un **prolongement adouci du fond** : socle = la photo étirée sur tout le carré (aucune zone ne reste transparente, même sur une photo coupée très serrée), puis bords de la photo reflétés dans la bande (miroir, sans couture — géométrie des neuf tuiles dans `mirrorTilePlacements`, fonction pure testée), flou par sous-échantillonnage à 32 px puis ré-agrandissement lissé, fondu vers la teinte moyenne du bord concerné. Canvas 2D seulement (portable, sans `ctx.filter`). Le **masque de silhouette** garde son débord transparent : la sculpture détourée ne change pas.
- L'Admin-Général est **prévenu** dans l'option Super-Admin : « Photo trop serrée : le cadre déborde de la photo en haut (12,5 %) — le fond y est prolongé (adouci) dans le portrait ; le masque y reste transparent. » Auparavant, aucun avertissement sous 20 % de débord (`coverage < 0,8`) ; désormais dès 2 % d'un côté, côté nommé (`overflowBands`, `describeOverflow`, testés).
- **Portrait d'usine régénéré par ce moteur** dans Chromium réel (`design-lab/banc/super-admin-avatar.html`, MediaPipe réel, 478 repères) : `mesures-moteur-portrait-corrige.json` ; sortie du moteur = JPEG 768 px (43 583 o), converti en `architecte.webp` par Pillow (`quality=88, method=6`, 21 368 o) comme le portrait de la v6.41.0. Le `architecte.webp` livré est celui produit par le moteur à la première tête de la PR, avant l'ajout du socle du prolongement (revue indépendante, constat 5) : pour cette photo les tuiles reflétées couvrent tout le carré, le socle ne change aucun pixel (profil plat 139–141 aux lignes 86–103, vérifié par le contrôleur), aucune régénération n'était nécessaire. Cadrage identique (pupilles 39,3 / 60,7 %, ligne des yeux 46,3 %) ; mâchoire, menton et bouche à ± 0,2 point (bruit du détecteur d'une exécution à l'autre) : **le calage d'usine est conservé tel quel**. Masque relevé dans la même exécution : 2 430 pixels sur 262 144 à plus de 16 d'écart avec l'ancien (écart moyen 0,81), alpha nul sur les 63 premières lignes dans les deux — silhouettes visuellement identiques (`planche-portrait-avant-apres-et-silhouettes.jpg`).
- **Vidéo, sans nouveau crédit HeyGen** : la zone de bande de chacune des 228 images générées est recomposée sur le portrait corrigé (768 → 720 px, Lanczos) **à travers la silhouette du détourage** — poids 1 jusqu'à la ligne 92, 0 à partir de la ligne 112 ; la silhouette n'entre jamais avant la ligne 115 (matte 0,00 % sur les lignes 0–104). Le reste des pixels HeyGen et le son AAC (copié du MP4 généré) sont inchangés. Ré-encodage aux mêmes réglages qu'avant (H.264 `-preset medium -crf 18`, VP9 `-b:v 1800k -crf 30`), 227 images (`-shortest` sur la piste son de 9,08 s, comme les vidéos détourées 225 / 227), affiche 360 px `libwebp -quality 82`.

## Revue indépendante (contrôleur séparé, avant fusion)

Huit constats, tous traités avant la fusion :

1. **Filet sombre résiduel dans la vidéo et l'affiche** (IMPORTANT) : la première recomposition faisait commencer la rampe de fondu à la ligne 84, cinq lignes **avant** la fin de la bande noire (0–88) ; les lignes 85–88 recevaient 5 à 20 % de noir (écart ligne à ligne 26,7 à la ligne 88, filet de 1–2 px visible sur la capture vidéo ordinateur). Corrigé : rampe 92 → 112 ; écart ligne à ligne maximal entre 10 et 14 % de la hauteur = **1,2 à 1,4** (mp4 et webm à 0,5 / 4 / 8,5 s), 0 ligne < 40. Métrique : différence absolue entre les luminances moyennes de deux lignes consécutives, colonnes centrales 35–65 % ; mesurée par pixel, la même zone donne 3,7 à 4,3, niveau de la texture du portrait lui-même (4,25) — le fichier précédent donnait 25,5 dans les deux métriques.
2. **Chiffres de preuve** : ceux de l'arbre livré (ci-dessous), pas ceux de la première tête.
3. **Cible mouvante** : `main` a avancé deux fois pendant le contrôle (v6.41.1 puis v6.42.0) ; les réintégrations ont été faites, la contre-vérification porte sur une tête gelée.
4. **Numéro** : v6.42.1 (v6.42.0 prise par `main` avant la livraison) ; la ligne « Version Courante » de `main` n'est pas touchée par cette PR.
5. **Socle du prolongement** : bande plus large que l'étendue reflétée → plus aucune zone transparente.
6. **Géométrie des tuiles** extraite en fonction pure, testée.
7. **Capture vidéo téléphone** : le sommet du cadre est amené à l'écran avant la capture.
8. **Traçabilité** : versions exactes de Chromium / Playwright, chaîne JPEG → WebP documentée, registre à 227 images, chemins du script paramétrables, empreintes du portrait, de la silhouette et de l'affiche signées par `tests/architecteAssets.test.ts`.

## Captures

| Écran | Avant (v6.41.0, `1c2daf6`) | Après (arbre livré) |
| :--- | :--- | :--- |
| Ordinateur 1440 × 900, au repos | `avant-ordinateur-1440x900-repos.jpg` | `apres-ordinateur-1440x900-repos.jpg` |
| Ordinateur 1440 × 900, vidéo en lecture (cadre à l'écran) | `avant-ordinateur-1440x900-video.jpg` | `apres-ordinateur-1440x900-video.jpg` |
| Tablette 820 × 1180, au repos | `avant-tablette-820x1180-repos.jpg` | `apres-tablette-820x1180-repos.jpg` |
| Téléphone 390 × 844, au repos | `avant-telephone-390x844-repos.jpg` | `apres-telephone-390x844-repos.jpg` |
| Téléphone 390 × 844, vidéo en lecture (cadre à l'écran) | `avant-telephone-390x844-video.jpg` | `apres-telephone-390x844-video.jpg` |
| Production `moknet.net` | avant (16:04 UTC) : `production-avant-ordinateur-1280x800-16h04.jpg`, `production-avant-telephone-390x844-16h04.jpg` | après (17:48 UTC, bundle `index-C8Y6seFM.js`) : `production-apres-ordinateur-1440x900-repos-17h48.jpg`, `production-apres-ordinateur-1440x900-video-17h48.jpg`, `production-apres-telephone-390x844-repos-17h48.jpg`, `production-apres-telephone-390x844-video-17h48.jpg` |

`planche-portrait-avant-apres-et-silhouettes.jpg` : portrait v6.41.0 (bande noire), portrait corrigé, silhouette détourée v6.41.0, silhouette corrigée.

## Mesures (`avant-mesures.json`, `apres-mesures.json`)

Luminance moyenne (0..255, Rec. 709) lue sur le canevas du portrait vivant et sur l'image vidéo courante, colonnes centrales (35–65 % de la largeur), trois écrans :

| Zone (hauteur du cadre) | Portrait avant | Portrait après | Vidéo avant | Vidéo après |
| :--- | :--- | :--- | :--- | :--- |
| 2–8 % | 19–22 | 135–136 | 0 | 125 |
| 8–12 % (bande) | **0** | **131–132** | **0** | **132** |
| 14–20 % (sous la bande, référence) | 132–133 | 133 | 131 | 130 |

Profil des fichiers livrés (mp4 et webm à 0,5 / 4 / 8,5 s ; affiche) : 2–8 % = 124 (affiche 126), 8–12 % = 130 (131), 14–20 % = 128–130, **écart ligne à ligne maximal entre 10 et 14 % = 1,2–1,4** (affiche 2,3 ; métrique : luminances moyennes de lignes consécutives, colonnes centrales), 0 ligne sombre. Aucune erreur JavaScript (hors bruits connus : Supabase absent, favicon). Vidéo `vision-smart-heygen.webm` en lecture (`playing`) sur les trois écrans, avant comme après.

## Production (🚀, 5 septembre 2026)

PR #111 fusionnée en squash → `main` `f6d9a16` à 17:47 UTC (Green Gate vert sur `d5550ed`, run 33981843750 ; `main` vérifié inchangé `e9595e5` ; contre-vérification indépendante « PRÊT »). `moknet.net` sert `index-C8Y6seFM.js` depuis 17:48 UTC : marqueurs du remède présents, nouvelles empreintes présentes, anciennes absentes, neuf actifs aux tailles exactes, ancien bundle `index-C_IAplN2.js` → 404 (`production-apres-verification-17h48.txt`). Fumée Chromium sur la page servie (`production-apres-fumee-17h48.json`, transport réseau par le client Node de Playwright) :

| Écran | Portrait 8–12 % | Vidéo 8–12 % (en lecture) | Sous la bande |
| :--- | :--- | :--- | :--- |
| Ordinateur 1440 × 900 | 132 | 132 | 135 / 131 |
| Téléphone 390 × 844 | 132 | 132 | 134 / 131 |

Green Gate sur `main` : run 33982039577.

## Actifs (`empreintes-actifs.txt`)

| Fichier | v6.41.0 | Livré |
| :--- | :--- | :--- |
| `architecte.webp` | 20 380 o | 21 368 o |
| `architecte-silhouette.png` | 17 507 o | 16 953 o |
| `vision-smart-heygen.mp4` | 1 558 047 o (228 images) | 1 391 269 o (227 images, 9,08 s) |
| `vision-smart-heygen.webm` | 445 523 o | 561 306 o |
| `vision-smart-heygen.webp` | 5 778 o | 6 122 o |
| `vision-smart-heygen.cutout.mp4` / `.cutout.webm` | 1 810 971 / 599 002 o | inchangés |

Tests sur l'arbre livré : typage 0 erreur, **1642 / 1642** tests (109 fichiers), build ✓ — dont `tests/photoAvatar.test.ts` (bandes de débord, géométrie des tuiles), `tests/architecteSequences.test.ts` (empreintes des vidéos) et `tests/architecteAssets.test.ts` (empreintes du portrait, de la silhouette et de l'affiche).

## Limites honnêtes

- Banc : page de démonstration sans compte (Supabase absent), polices de secours, Tailwind servi localement.
- Le prolongement du fond est une continuation adoucie du décor, pas une reconstruction de la scène : le sommet du cadre est une zone floue, dans les tons du décor.
- La vidéo plein cadre a une image de moins (227 au lieu de 228) : `-shortest` sur la piste son de 9,08 s, comme le détourage l'avait déjà (225 / 227 images).
- Non vérifié : Safari et Firefox (`imageSmoothingQuality` ignoré, rendu bilinéaire), appareil réel.

## Scripts

`capture-architecte.cjs` (captures et mesures, trois écrans, repos + vidéo avec le cadre amené à l'écran ; chemins `CHROMIUM` et `TAILWIND_STUB` paramétrables) ; régénération du portrait par le banc `design-lab/banc/super-admin-avatar.html` (script d'extraction du dossier `2026-09-05-architecte-photo-validee`) ; recomposition vidéo par Pillow / numpy puis ffmpeg (réglages ci-dessus).
