# Bande sombre au sommet du cadre rond de `/architecte` — avant / après (5 septembre 2026, DEC-2026-079, ajustement v6.41.2)

Niveau de preuve : 🧪 **banc navigateur réel** (Chromium 1.56 headless, `npx vite` sur le dépôt, Supabase absent, Tailwind servi localement, moteur MediaPipe **réel** pour la régénération du portrait) pour les captures « avant » et « après » ; 🚀 **production** pour les deux captures `production-avant-*` (`moknet.net`, 5/09 à 16:04 UTC, avant correction). Le contrôle visuel final dans l'application appartient à la Direction.

## Constat de la Direction

« Bande sombre en haut du cadre rond de la page /architecte. » Cause mesurée : la photo validée n'a pas de marge au-dessus du crâne ; le moteur de cadrage laissait le débord du cadre **transparent**, et l'export JPEG le rendait **noir**. Le modèle vidéo HeyGen, généré depuis ce portrait, portait la même bande ; l'affiche aussi.

| Fichier (v6.41.0) | Bande noire mesurée (lignes dont la luminance moyenne est < 40) |
| :--- | :--- |
| `architecte.webp` (768 px) | 95 px — 12,4 % |
| `vision-smart-heygen.mp4` (720 px) | 89 px — 12,4 % |
| `vision-smart-heygen.webp` (affiche 360 px) | 44 px — 12,2 % |

## Remède (dans le moteur de production, pas une retouche à la main)

- `photoAvatarEngine.drawFramed` comble le débord par un **prolongement adouci du fond** : bords de la photo reflétés dans la bande (miroir, sans couture), flou par sous-échantillonnage à 32 px puis ré-agrandissement lissé, fondu vers la teinte moyenne du bord concerné. Canvas 2D seulement (portable, sans `ctx.filter`). Le **masque de silhouette** garde son débord transparent : la sculpture détourée ne change pas.
- L'Admin-Général est **prévenu** dans l'option Super-Admin : « Photo trop serrée : le cadre déborde de la photo en haut (12,5 %) — le fond y est prolongé (adouci) dans le portrait ; le masque y reste transparent. » Auparavant, aucun avertissement sous 20 % de débord (`coverage < 0,8`) ; désormais dès 2 % d'un côté, côté nommé (`overflowBands`, `describeOverflow`, testés).
- **Portrait d'usine régénéré par ce moteur** dans Chromium réel (`design-lab/banc/super-admin-avatar.html`, MediaPipe réel, 478 repères) : `mesures-moteur-portrait-corrige.json`. Cadrage identique (pupilles 39,3 / 60,7 %, ligne des yeux 46,3 %) ; mâchoire, menton et bouche à ± 0,2 point (bruit du détecteur d'une exécution à l'autre) : **le calage d'usine est conservé tel quel**. Masque relevé dans la même exécution : 2 430 pixels sur 262 144 à plus de 16 d'écart avec l'ancien (écart moyen 0,81) — silhouettes visuellement identiques (`planche-portrait-avant-apres-et-silhouettes.jpg`).
- **Vidéo, sans nouveau crédit HeyGen** : la zone de bande de chacune des 228 images est recomposée sur le portrait corrigé **à travers la silhouette du détourage** (poids 1 jusqu'à 84 px, 0 à partir de 104 px) ; le reste des pixels HeyGen et le son AAC sont inchangés. Ré-encodage avec les mêmes réglages qu'avant (H.264 `crf 18`, VP9 `1800k / crf 30`), affiche 360 px `libwebp 82`. La silhouette n'entre jamais dans la bande (matte moyenne 0,0 % sur les images 1, 51, 101, 151, 228).

## Captures

| Écran | Avant (v6.41.0) | Après (corrigé) |
| :--- | :--- | :--- |
| Ordinateur 1440 × 900, au repos | `avant-ordinateur-1440x900-repos.jpg` | `apres-ordinateur-1440x900-repos.jpg` |
| Ordinateur 1440 × 900, vidéo en lecture | `avant-ordinateur-1440x900-video.jpg` | `apres-ordinateur-1440x900-video.jpg` |
| Tablette 820 × 1180, au repos | `avant-tablette-820x1180-repos.jpg` | `apres-tablette-820x1180-repos.jpg` |
| Téléphone 390 × 844, au repos | `avant-telephone-390x844-repos.jpg` | `apres-telephone-390x844-repos.jpg` |
| Téléphone 390 × 844, vidéo en lecture | `avant-telephone-390x844-video.jpg` | `apres-telephone-390x844-video.jpg` |
| Production `moknet.net`, 16:04 UTC | `production-avant-ordinateur-1280x800-16h04.jpg`, `production-avant-telephone-390x844-16h04.jpg` | après production : consigné par la PR de mémoire vivante suivante |

`planche-portrait-avant-apres-et-silhouettes.jpg` : portrait v6.41.0 (bande noire), portrait corrigé, silhouette détourée v6.41.0, silhouette corrigée.

## Mesures (`avant-mesures.json`, `apres-mesures.json`)

Luminance moyenne (0..255) lue sur le canevas du portrait vivant et sur l'image vidéo courante, colonnes centrales (35–65 % de la largeur), trois écrans :

| Zone (hauteur du cadre) | Portrait avant | Portrait après | Vidéo avant | Vidéo après |
| :--- | :--- | :--- | :--- | :--- |
| 2–8 % | 19–22 | 135–137 | 0 | 125 |
| 8–12 % (bande) | **0** | **131–132** | **0** | **131** |
| 14–20 % (sous la bande, référence) | 131–133 | 133 | 133 | 132 |

Aucune erreur JavaScript (hors bruits connus : Supabase absent, favicon). Vidéo `vision-smart-heygen.webm` en lecture (`playing`) sur les trois écrans, avant comme après.

## Actifs (`empreintes-actifs.txt`)

| Fichier | v6.41.0 | Corrigé |
| :--- | :--- | :--- |
| `architecte.webp` | 20 380 o | 21 368 o |
| `architecte-silhouette.png` | 17 507 o | 16 953 o |
| `vision-smart-heygen.mp4` | 1 558 047 o (228 images) | 1 400 595 o (227 images, 9,08 s) |
| `vision-smart-heygen.webm` | 445 523 o | 561 944 o |
| `vision-smart-heygen.webp` | 5 778 o | 6 190 o |
| `vision-smart-heygen.cutout.mp4` / `.cutout.webm` | 1 810 971 / 599 002 o | inchangés |

## Limites honnêtes

- Banc : page de démonstration sans compte (Supabase absent), polices de secours, Tailwind servi localement.
- Le prolongement du fond est une continuation adoucie du décor, pas une reconstruction de la scène : le sommet du cadre est une zone floue, dans les tons du décor.
- La vidéo plein cadre a une image de moins (227 au lieu de 228) : `-shortest` sur la piste son de 9,08 s, comme le détourage l'avait déjà (225 / 227 images).
- Non vérifié : Safari (`imageSmoothingQuality`), appareil réel.

## Scripts

`capture-architecte.cjs` (captures et mesures, trois écrans, repos + vidéo) ; régénération du portrait par le banc `design-lab/banc/super-admin-avatar.html` (script d'extraction du dossier `2026-09-05-architecte-photo-validee`) ; recomposition vidéo par PIL / numpy puis ffmpeg (réglages ci-dessus).
