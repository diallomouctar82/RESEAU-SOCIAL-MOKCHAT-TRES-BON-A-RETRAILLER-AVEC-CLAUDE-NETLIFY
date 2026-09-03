# Design Lab MokNet — laboratoire de direction artistique

Dossier **isolé**. Rien ici n'entre dans le build de production : `vite.config.ts`
n'a qu'un seul point d'entrée (`index.html` à la racine) et aucun fichier de ce
dossier n'est importé par l'application. Ouvrir un fichier d'ici ne modifie donc
jamais moknet.net.

## Méthode

Une interface à la fois, cinq visuels à chaque fois. La Direction choisit, le
modèle retenu est implanté dans l'application, poussé en production, vérifié —
puis on passe à l'interface suivante. Ordre prévu : menu, Live, messagerie,
agents.

## Fichiers

| Fichier | Rôle |
|---|---|
| `menus.html` | Écran d'accueil / navigation — 5 traitements, chacun construit sur une image de référence de la Direction. Autonome (les images y sont incorporées). En attente de choix. |
| `refs/*.webp` | Les sept images de référence fournies par la Direction, telles quelles (provenance). |

## Les cinq traitements viennent des images de la Direction, pas d'une palette

Consigne reçue : « Inspire-toi des images que je t'ai données, tu choisis
là-bas et tu me donnes ces scènes-là. Je ne veux pas les changements de
couleur. » Chaque traitement prend donc pour SCÈNE l'image de référence
elle-même, et pour signature ce que cette image fait de particulier — pas une
teinte différente.

| # | Nom | Image source (`refs/`) | Ce que le traitement reprend de l'image |
|---|---|---|---|
| 01 | Monolithe | `C-menu-monolithe.webp` — « Model 14 : Monolithe » | La brume sur le lac et le monolithe de cristal en scène ; verre dépoli à filets fins ; **la lumière dit où l'on est** (point lumineux sur l'onglet actif, sur l'entrée active du dock) ; ligne d'état « Mode : Réseau » en tête ; prisme sur l'arête de l'orbe Architecte ; dock et goutte reflétés dans l'eau |
| 02 | Organza | `D-menu-organza.webp` — « Model 36 : Voile de verre organza et eau calme » | Le voile et le pavillon sur l'eau en scène, palette crème et pêche d'aube ; serif Playfair ; **la matière passe devant le chrome** (voile animé au canevas devant la bande du haut) ; couple bouton plein / bouton fantôme ; pellicule perforée pour les stories ; bâtonnet d'actif sur l'onglet |
| 03 | Bio-verre | `E-menu-bioverre.webp` — « Model 20 Bio-verre végétal » | La forêt et l'eau en scène, verre vert profond ; **une seule feuille organique** (carte Mooc et stories jointes par des courbes) ; rosée qui se condense (gouttelettes sur les entrées du dock, gouttes qui glissent au canevas) ; portraits en sphères de verre ; Cormorant ; petites capitales |
| 04 | Verre sur la mer | `G-live-verre-mer.webp` — « style pour les lives » | La mer au crépuscule et la brume en scène, interface CLAIRE ; **arêtes lumineuses** qui courent sur les bords des panneaux (conique animée, 11 s) ; pilule flottante pour le dock ; **reflet de l'interface dans l'eau** ; titre en capitales fines |
| 05 | Nébuleuse | `A-experts-nebuleuse.webp` — « M26 nébuleuse indigo et verre saphir fluide » | Indigo profond, alcôves de verre en pétale (story active dans une alcôve), sphères d'énergie pour les portraits, sol d'eau ondulée, noms en capitales espacées. **Rendue au canevas** et non collée : l'image d'origine est couverte de visages et de noms à chaque endroit, il n'en existe aucune zone propre à cadrer |

## La disposition est FIXE — seul le traitement change

Décision de la Direction : la disposition de la capture d'écran fournie ne
bouge pas. Les cinq traitements partagent **un seul et même générateur d'écran**
(`screen()` dans `menus.html`), ce qui garantit une structure rigoureusement
identique de 01 à 05 :

en-tête (logo · marque · pastille Architecte · recherche · palette 11 ·
crédits 1000000© · avatar) → sous-barre **Équipe & Experts** → carte
**Réseau Mooc** (onglets Fil d'actu / Reels / Lives / Tribus / Croissance +
bouton Mon Espace Personnel) → stories → fil social → goutte messagerie →
dock à cinq emplacements avec **Architecte central en relief**.

Ce qui change d'un traitement à l'autre : la scène, la matière, la forme des
boutons, la typographie, le mouvement.

## Comment l'image devient la scène (sans que ses textes cuits ne réapparaissent)

Les images de référence sont des rendus finis : elles contiennent leurs propres
titres, menus, vignettes et pastilles. Deux mécanismes les tiennent hors de
l'écran :

1. **Cadrage** (`REGION` dans `menus.html`) — pour chaque traitement et chaque
   appareil, une zone de l'image en pixels source (1030 × 594) est choisie pour
   ne contenir que la scène propre (le voile et le pavillon, le tronc et l'eau,
   la mer et la brume). `fitScene()` la met à l'échelle pour couvrir le cadre.
2. **Dépoli masqué** (`.frost`, ordinateur) — sur grand écran, la scène ne
   peut pas être entièrement propre : le contenu MokNet occupe la zone où
   l'image porte ses textes. Une couche de verre dépoli (flou d'arrière-plan
   masqué par un dégradé) recouvre la zone de contenu et laisse la colonne
   libre nette. C'est exactement le geste des images elles-mêmes : un panneau
   de verre posé sur la scène. Sur téléphone, le cadrage suffit.

Pour Organza et Bio-verre, la colonne libre est à gauche et le contenu à
droite, comme dans les deux images (le voile à gauche, la forêt à gauche).

## Règles tenues (Gate AI Core « Future UI/UX » + UI/UX Pro Max)

- **Le verre habille la navigation et les contrôles ; le contenu est posé sur
  une feuille lisible** (`.sheet`, contraste mesuré ≥ 4,5:1 dans les dix
  combinaisons). Pas de « glassmorphism appliqué partout ».
- **Deux mouvements porteurs de sens par vue** : la scène (dérive lente 46 s,
  canevas) et la présence de l'Architecte (halo). Les autres mouvements sont
  des états (anneau vert de la story en direct, point rouge des Lives, barre de
  progression). Aucune animation décorative empilée.
- **Aucune icône sans libellé** : l'Architecte porte son nom sous l'orbe, chaque
  entrée du dock aussi.
- **Mouvement réduit** et **transparence réduite** respectés
  (`prefers-reduced-motion`, `prefers-reduced-transparency` → panneaux opaques,
  dépoli retiré).
- **Cibles tactiles ≥ 44 px** sur téléphone, en-tête sans débordement, aucun
  défilement horizontal.

## Invariants que tout modèle doit respecter

1. **Le réseau social est l'écran d'accueil.**
2. **L'Architecte vit dans la navigation principale**, à la place centrale.
3. **Un seul élément flottant à l'écran : la goutte messagerie.**
4. **Équipe & Experts est au premier niveau**, visible sans défilement.

## Contrat de thème

Chaque traitement expose ses valeurs sous forme de variables CSS sur la racine
de la scène : fond, matière, lumière, géométrie, typographie, mouvement. Aucun
composant ne code une couleur en dur. C'est ce qui permettra, après la
sélection, de généraliser le modèle retenu à toute l'application sans le
réécrire, et à terme d'en faire un thème sélectionnable par l'Administrateur
Général.

## Contraintes techniques tenues

- **Aucune dépendance ajoutée.** Pas de bibliothèque d'animation, pas de 3D.
- **Aucune image externe.** Les scènes sont les images de la Direction,
  incorporées dans le fichier ; les portraits sont générés en SVG à partir du
  nom. Aucun visage n'est inventé ni emprunté.
- **Reconstruction** : `menus.html` est produit à partir d'un gabarit où les
  quatre images sont injectées en base64 (`refs/C`, `D`, `E`, `G`).

## Vérification

Contrôle navigateur réel (Chromium, cinq traitements × deux appareils). Pour
chaque combinaison : disposition complète de la capture, Architecte central et
dominant dans le dock, un seul flottant, luminance mesurée (informative pour
les deux scènes profondes), contraste du texte du fil, nombre d'éléments
réellement animés plus le canevas, vert de prospérité appliqué, en-tête sans
débordement, aucun défilement horizontal, dock ancré en bas et entièrement
visible, goutte entièrement dans l'écran, scène = image de référence
(ou canevas pour la nébuleuse), Architecte avec libellé, cibles tactiles,
mouvement réduit.

Dernier passage : **207 contrôles verts**.

Le seul écart restant est le chargement des polices Google, bloqué par le proxy
de sortie du bac à sable et sans effet dans un navigateur réel — la pile de
repli reste lisible.

## Limites honnêtes

- Les images de référence font 1030 px de large ; sur ordinateur elles sont
  agrandies (×1,3 à ×2) — la scène est donc plus douce que l'original. C'est
  visible surtout pour Bio-verre, dont l'image est déjà brumeuse.
- La nébuleuse (05) est un rendu au canevas inspiré de l'image, pas l'image :
  il n'y a aucune zone sans visage à cadrer dans « M26 ».
- Ce sont des écrans de laboratoire : les onglets et le dock réagissent, le fil
  ne charge pas de données réelles.
