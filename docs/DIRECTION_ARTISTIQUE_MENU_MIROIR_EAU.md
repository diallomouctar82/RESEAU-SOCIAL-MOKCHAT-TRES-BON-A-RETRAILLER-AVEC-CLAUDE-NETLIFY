# 💧 DIRECTION ARTISTIQUE — MENU « MIROIR D'EAU »
> **Proposition 06, choisie par la Direction le 3 septembre 2026**
> *Mission DS · loupe « menu » · tâches DS-M2a (structure) et DS-M2b (habillage)*

---

## 1. Ce qui a été choisi, et pourquoi ce document existe

La Direction a examiné six traitements du menu construits dans le laboratoire
isolé `design-lab/` (mission DS-M1) et a retenu la **proposition 06 « Miroir
d'eau »** : une nappe d'eau vivante sur laquelle flotte un dock de verre
soufflé, l'Architecte matérialisé en goutte d'eau au centre de la navigation.

La maquette de référence est `design-lab/menu-06-miroir-eau.html` (thème
`.t6`). Elle reste dans le dépôt : c'est la **source de vérité visuelle** de
cet habillage. Toute évolution se compare à elle.

L'implantation s'est faite en deux temps délibérément séparés, pour que la
Direction puisse juger la structure avant la matière :

| Étape | Objet | Livraison |
| :--- | :--- | :--- |
| **DS-M2a** | Les invariants **structurels** (où vivent les choses) | commit `61ca0fd` |
| **DS-M2b** | L'habillage **visuel** verre/eau (de quoi elles ont l'air) | ce document |

---

## 2. Les quatre invariants fixés par la Direction (DS-M2a)

Ils ne sont pas négociables et doivent survivre à tout habillage futur :

1. **Le réseau social est l'écran d'accueil par défaut** — `App.tsx`,
   `useState('social')`. Le Dashboard `home` reste atteignable comme
   n'importe quel autre onglet, simplement plus par défaut.
2. **L'Architecte vit dans la navigation principale, à la place centrale** —
   bouton central du dock (mobile) et entrée dédiée de la barre latérale
   (desktop), dans `Layout.tsx`. Ce n'est plus un second bouton flottant.
3. **Un seul élément flottant à l'écran : la goutte de la messagerie.** La
   pastille indépendante de l'Architecte a été retirée
   (`ArchitecteFloatingBar` ne rend plus rien au repos).
4. **« Équipe & Experts » au premier niveau**, visible sans défilement, avant
   la carte Réseau Mooc (`SocialFeed.tsx`).

---

## 3. L'habillage (DS-M2b) — où vit quoi

### 3.1 Les tokens, scopés sous `[data-miroir]`

Tout le CSS de l'habillage vit dans le bloc `<style>` d'`index.html`, sous le
sélecteur `[data-miroir]` posé par `Layout.tsx` sur la racine de
l'application. Les valeurs sont des **variables CSS**, jamais des couleurs en
dur : c'est ce qui permettra plus tard à l'Administrateur Général de proposer
d'autres univers sans retoucher un seul composant.

| Token | Valeur | Rôle |
| :--- | :--- | :--- |
| `--mir-bg` | `#EAF7FB` | fond aqua de la maquette |
| `--mir-ink` | `#0B3A46` | encre, bleu profond |
| `--mir-acc` | `#0F9EC2` | accent eau (onglet actif, liens) |
| `--mir-pros` | `#12A579` | vert « prospect » (point de lumière) |
| `--mir-band` | `rgba(255,255,255,.44)` | bandeau des en-têtes |
| `--mir-panel` | `rgba(255,255,255,.44)` | panneaux de verre (Réseau Mooc, stories, dock) |
| `--mir-sheet` | `rgba(255,255,255,.94)` | **feuilles de lecture** (publications du fil) |
| `--mir-exp` | `rgba(255,255,255,.58)` | sous-barre « Équipe & Experts » |
| `--mir-blur` | `blur(20px) saturate(1.2)` | flou d'arrière-plan du verre |
| `--mir-arch-shape` | `50% 50% 46% 46% / 58% 58% 42% 42%` | géométrie de la goutte de l'Architecte |

**Pourquoi 0,44 pour les panneaux mais 0,94 pour les publications** : c'est la
maquette elle-même qui fait cette distinction (`.glass` vs `.sheet`). Un
paragraphe ne se lit pas à travers de l'eau. Le verre très transparent est
réservé au chrome et aux surfaces qu'on survole ; les surfaces où l'on **lit**
restent quasi opaques.

### 3.2 Les classes

| Classe | Appliquée à | Effet |
| :--- | :--- | :--- |
| `.mir-scene` | le canevas de la nappe d'eau | `fixed`, `z-0`, jamais cliquable |
| `.mir-band` | les deux en-têtes | verre translucide + flou, bordure de lumière |
| `.mir-glass` | carte Réseau Mooc, rail des stories, dock | verre soufflé + reflet spéculaire `::before` |
| `.mir-sheet` | publications du fil, composeur, états vides | feuille de lecture quasi opaque |
| `.mir-exp` | bouton « Équipe & Experts » | verre intermédiaire, pilule |
| `.mir-dock` | la pilule du dock | verre + ombre portée teintée eau |
| `.mir-edge` | dock (et `.mdb` pour la goutte) | arête de lumière conique qui tourne en 9 s |
| `.mir-reflect` | dock (et `.mdb`) | reflet dans l'eau (`-webkit-box-reflect`) |
| `.mir-orb` | bouton Architecte du dock | goutte : lumière radiale, point spéculaire, anneau qui respire |
| `.mir-tab-active` | emplacement actif du dock | couleur accent + point de lumière vert |
| `.mir-mode` | ligne d'état de l'en-tête mobile | « Réseau · en éveil », capitales espacées |

### 3.3 La nappe d'eau

`components/miroir/WaterMirror.tsx` — portage fidèle du moteur `waterScene()`
de la maquette : ciel dégradé, ligne d'eau à **58 %** de la hauteur qui ondule
(deux sinusoïdes de périodes différentes), nappe de lumière qui dérive, trois
passes de caustiques en composition additive, étincelles sur les crêtes, lueur
sous le dock.

`services/miroir/waterRipple.ts` — un bus minuscule (un `Set` d'abonnés, une
fraction horizontale) pour qu'un appui sur le dock envoie une **vraie onde**
là où le doigt s'est posé, sans faire descendre une fonction par les props à
travers tout l'arbre.

Décisions propres à la mise en production, absentes de la maquette (qui ne
vivait que dans un cadre de 390 px) :

- **`prefers-reduced-motion`** : une seule image fixe est peinte, aucune
  boucle d'animation n'est lancée, aucun abonnement aux ondes n'est pris.
  L'arête de lumière, l'anneau de l'Architecte et les reflets sont éteints.
- **Onglet en arrière-plan** : la boucle s'arrête et reprend au retour.
- **Écrans larges** : le pas d'échantillonnage de la ligne s'élargit
  (4 px sur téléphone, 8 px au-delà de 1 200 px) — à 1 920 px, un pas de 4 px
  demanderait 480 points × 4 passes à chaque image.
- **Densité de pixels plafonnée à 1,5**, comme dans la maquette.
- **Sans contexte 2D** (navigateur sans canevas), l'application reste
  entièrement utilisable : le fond `--mir-bg` prend le relais.

### 3.4 Ce qui n'a PAS été touché, volontairement

- **`contexts/ThemeContext.tsx` / `components/ui/DesignTokens.ts`** — les 10
  palettes de marque, `palette-10` par défaut, sont **gelées** par une
  décision antérieure de la Direction pour toutes les surfaces pas encore
  redessinées. La barre latérale desktop continue donc de tirer ses couleurs
  de `palette-10` : c'est un choix, pas un oubli. Elle conserve ses **17
  entrées** et sa richesse fonctionnelle — la maquette montre un dock
  simplifié à 5 icônes en mode « desktop », le dégrader aurait appauvri la
  navigation réelle.
- **Le système verre/eau/lumière du LIVE** (`[data-live-universe]`, classes
  `.water-*`, 7 univers) — il a sa propre matière et son propre périmètre.
- **La goutte de la messagerie** (`MessagingDropButton.tsx`, VF-10) — elle
  était **déjà** en matière d'eau. Elle ne reçoit ici que l'arête de lumière
  et le reflet qui lui manquaient, **par CSS uniquement** (`[data-miroir] .mdb`) :
  aucune ligne du composant n'est modifiée, ses quatre états
  (repos / non-lus / appel / ouvert) et leurs tests restent intacts.
- **Le contenu interne des autres écrans** — seuls le chrome global et
  l'écran d'accueil sont habillés à ce stade.
- **Le sélecteur d'univers pour l'Administrateur Général** — explicitement
  hors périmètre (lot 1, point 3). L'architecture en variables CSS le rend
  possible plus tard sans retoucher les composants.

---

## 4. Un piège CSS trouvé au banc, à retenir

`-webkit-box-reflect: none` est **ignoré silencieusement par Chromium** : la
valeur calculée reste le reflet précédent, sans le moindre avertissement. Le
reflet survivait donc à une demande de mouvement réduit. Il faut écrire
`unset` (ou `initial`).

C'est la même famille de piège que les teintes `brand-*` absentes de la
configuration Tailwind (corrigées le 30 août) : **une déclaration qui ne peint
rien sans le dire**. Un garde-fou de test a été ajouté en conséquence — voir
§ 5.

---

## 5. Preuves

### 5.1 Tests automatisés

`tests/miroirWater.test.tsx` — 14 tests :

- **Bus d'ondes** : transmission, désabonnement, bornage à `[0, 1]`, valeur
  non finie ramenée au milieu, un abonné qui lève n'empêche pas les autres,
  calcul du centre depuis un élément.
- **Nappe d'eau** : canevas décoratif (`aria-hidden`), dessin réel du ciel /
  du corps de l'eau / de la ligne de surface, abonnement pendant le montage et
  désabonnement au démontage, mouvement réduit (une seule image, aucune
  boucle, aucun abonnement), absence de contexte 2D non fatale.
- **Garde-fou des classes** : toute classe `.mir-*` écrite dans un composant
  existe bien dans `index.html`, et aucune règle `.mir-*` ne vit hors du
  périmètre `[data-miroir]`. *Ce garde-fou a été vérifié comme non complaisant :
  en injectant volontairement une classe inexistante, il échoue.*
- **Échantillonnage** : pas adaptatif à la largeur, défensif sur une largeur
  absurde, ligne d'eau à 58 %.

Suite complète : **777 tests** (57 fichiers) · `tsc --noEmit` **0 erreur** ·
`npm run build` propre.

### 5.2 Banc navigateur réel — **76 OK / 0 défaut**

Tout le CSS de cet habillage étant **inline dans `index.html`**, il ne dépend
d'aucun CDN : il est donc vérifiable en vrai navigateur dans ce bac à sable,
contrairement aux parcours qui exigent Supabase.

- **Le CSS réellement servi par `dist/index.html`** (desktop + mobile) : les
  10 tokens et les 11 classes relus par `getComputedStyle` — verre à 44 %,
  feuille à 94 %, flou réel, ombre teintée eau, reflet spéculaire, arête de
  lumière animée en 9 s avec son masque de contour, goutte de l'Architecte
  avec sa géométrie non circulaire et son point spéculaire, reflets, arête de
  la goutte décalée de 4 s.
- **Accessibilité** : sous `prefers-reduced-motion`, arêtes éteintes, anneau
  figé, reflets retirés.
- **La nappe d'eau peinte par le VRAI composant** (bundle esbuild du fichier
  du dépôt, monté dans une page vierge) : ciel et eau mesurés au pixel, ligne
  d'eau détectée à **57,2 %** (mobile) et **57,9 %** (desktop), caustiques
  prouvées par comparaison à un témoin plat, et un appui qui perturbe la zone
  touchée **4,7×** plus que la zone témoin (mobile) / **1,7×** (desktop),
  contre ~1,0× au repos — mesure appariée, la houle de fond s'annule.
- **Mouvement réduit** : l'image est figée sur 900 ms, mais une image a bien
  été peinte.

Captures : `scratchpad/dsm2b/captures/`.

### 5.3 Ce qui reste à votre jugement

Aucun test ne peut dire si l'eau **a l'air d'eau**. Le banc prouve que les
bonnes opérations de dessin sont émises et que les bonnes valeurs sont
appliquées ; l'appréciation visuelle et le confort de lecture sur un vrai
téléphone restent votre décision, sur l'aperçu de déploiement ou en
production.

Deux points sur lesquels votre avis est explicitement attendu :

1. **La ligne d'état « Réseau · en éveil »** n'est portée que par l'en-tête
   **mobile**. Sur desktop, l'en-tête est déjà dense (logo, navigation,
   recherche, palette, crédits, avatar) et une ligne de plus déborderait. Si
   vous la voulez aussi sur ordinateur, il faudra libérer de la place.
2. ~~**La barre latérale desktop garde la palette gelée.**~~ **TRANCHÉ par la
   Direction le 04/09/2026** — voir § 6.


---

## 6. L'habillage étendu à toute l'application (DS-EX, 04/09/2026)

### 6.1 Ce que la Direction a constaté

« Les couleurs ne doivent pas rester juste sur l'interface d'accueil. Il faut
les voir vraiment dans l'app, sur l'accueil, dans le live, partout où c'est
concerné. »

### 6.2 Ce que la mesure a montré — le périmètre n'était pas le problème

`data-miroir` est posé sur la **racine de `Layout.tsx`** : tous les écrans,
le Studio Live et les modales rendent déjà à l'intérieur. Le manque venait
d'ailleurs, et il était massif :

- **~2 400 occurrences** des familles de marque `blue`/`indigo` dans
  `components/` (215 utilitaires distincts, 409 en comptant les variantes) ;
- **549 `bg-slate-50`** et **169 `bg-white`** repeignant un fond par-dessus
  la nappe d'eau ;
- la **barre latérale** peinte par **styles en ligne** issus de `palette-10`,
  donc hors de portée de toute règle CSS quelle que soit sa spécificité.

### 6.3 La mesure qui a déterminé la méthode

Sur fond clair l'application emploie les marches **foncées**
(`text-blue-600`) ; dans le Studio Live, qui est sombre, les marches
**claires** (`text-indigo-300/400`, 32 occurrences). **Un remplacement à plat
par une seule couleur d'accent aurait cassé le contraste d'un côté ou de
l'autre.** La traduction retenue conserve donc l'échelle de clarté et ne
change que la famille de teinte : une rampe aqua à 11 marches dont chacune a
une **luminance comparable** à la marche Tailwind qu'elle remplace. Le
contraste est préservé *par construction*, pas par chance — et le garde-fou
le recalcule au lieu de faire confiance à ce paragraphe.

| Marche | Aqua | Remplace | Contraste vérifié |
|---|---|---|---|
| 600 | `#0A7590` | `blue-600` | 5,35:1 sur blanc · 5,01:1 sur aqua-50 |
| 300 | `#5ECBE7` | `indigo-300` | 8,59:1 sur l'abysse du Studio |
| 950 | `#06262F` | `blue-950` | fond sombre |

### 6.4 Un générateur, pas du CSS écrit à la main

`scripts/genMiroirAquaLayer.cjs` lit le code réel et émet la couche.
Écrite à la main, elle aurait deux défauts certains : des **règles mortes**
(une classe remappée qui n'existe plus) et des **oublis** (une classe ajoutée
plus tard qui reste bleue au milieu d'un écran aqua). Le garde-fou régénère
et compare : une classe bleue ajoutée demain fait échouer la suite.

**La spécificité plutôt que l'ordre** : Tailwind est servi par CDN et injecte
ses règles à l'exécution. Les règles générées sont préfixées `[data-miroir]`,
soit (0,2,0) contre (0,1,0) — elles gagnent quel que soit l'ordre d'injection.

**Ce qui n'est jamais traduit** : les familles sémantiques (red, rose, amber,
orange, yellow, green, emerald, teal, lime) et les gris. Leur couleur **est**
l'information — les repeindre en aqua l'effacerait. Le garde-fou l'interdit,
et le banc le vérifie sur des témoins réels à l'écran.

### 6.5 Les deux endroits qui ne relèvent pas du CSS

1. **Le fond pleine page de chaque écran.** Neutralisé pour le seul **enfant
   direct** de `.mir-page`, un repère ajouté dans `Layout.tsx`. Le `>` est ce
   qui empêche la règle d'atteindre les champs de saisie et les listes
   déroulantes, qui emploient les mêmes classes plus bas dans l'arbre — là où
   l'opacité sert directement la lisibilité.
2. **La barre latérale.** Styles en ligne : seule une retouche des **valeurs**
   de `palette-10` pouvait l'atteindre. Le gel décidé au Chantier 3 portait
   sur le **sélecteur** de palettes, pas sur les valeurs de la palette
   retenue ; les neuf autres palettes sont intactes (vérifié par test), et le
   futur sélecteur de l'Administrateur Général reste possible.

### 6.6 Preuves

- `tsc --noEmit` **0 erreur** · `npm run build` propre · **vitest 843/843**
  (61 fichiers, +14 dans `tests/miroirAquaLayer.test.ts`).
- **Garde-fou vérifié non complaisant** : trois brèches délibérées le font
  rougir — une classe `bg-sky-700` ajoutée ailleurs (couche périmée), une
  règle `bg-red-600` injectée (famille sémantique), une marche remplacée par
  un cyan clair (planchers de contraste **et** échelle décroissante). Rétabli
  → 14/14 vert.
- **Banc navigateur réel, avant/après sur les mêmes composants** : accueil,
  Studio Live et modale × ordinateur (1440×900) et téléphone (390×844).
  L'« avant » sert l'ancienne feuille de style **et** l'ancien bundle, parce
  que la palette de la barre vit dans le bundle : sans ça la comparaison
  serait faussée en faveur du correctif.

### 6.7 Ce qui reste à votre jugement

Aucun test ne peut dire si l'ensemble **a l'air juste**. Le banc prouve que
les bonnes valeurs sont calculées par le navigateur sur les vrais composants,
et que rien de sémantique n'a bougé. L'appréciation reste la vôtre.

---

## 7. La règle qui ne peignait rien (04/09/2026) — refus de validation et correctif

La Direction a refusé la validation : « ce qui est visible dans l'application
ne correspond pas aux captures ni aux changements annoncés ». Elle avait
raison, et pour deux raisons distinctes.

### 7.1 Ce qui n'était PAS en cause

Le lien, la branche et le commit étaient les bons. L'`index.html` servi par
l'aperçu est identique octet pour octet au build local du commit — seul
diffère l'encart de déploiement que Netlify injecte — et l'empreinte SHA-256
du bloc aqua est la même des deux côtés. Le cache et le service worker sont
également hors de cause : la couche voyage entièrement dans le document, et
le document est servi en « réseau d'abord » avec `max-age=0`.

### 7.2 La mesure qui tranche

Le banc annonçait « 54 OK / 0 DÉFAUT ». Il mesurait **uniquement là où il
s'attendait à trouver quelque chose** : la couleur calculée d'une poignée
d'éléments choisis. En décodant les captures et en comparant **pixel à
pixel**, la réalité apparaît : accueil 19,63 %, modale ordinateur 3,40 %,
modale téléphone 1,14 %, **Studio Live 0,35 %**.

### 7.3 Cause n° 1 — un commentaire refermé une ligne trop tôt

Le commentaire du bloc de matière se fermait à sa cinquième ligne. Les six
lignes de prose suivantes restaient **dans la feuille de style** ;
l'analyseur les agglutinait au sélecteur suivant pour en faire un sélecteur
invalide, et jetait silencieusement la règle « cartes en verre »
(`[data-miroir] .bg-white.rounded-3xl / .rounded-2xl`) — **349 cartes et
panneaux**. Prouvé sur la page réellement servie : ce sélecteur était
**absent du CSSOM** (0 occurrence sur 668 règles).

Effet mesuré du correctif, mêmes composants et mêmes conditions :

| Écran | Avant correctif | Après correctif |
|---|---|---|
| Modale ordinateur | 3,40 % | **32,54 %** |
| Modale téléphone | 1,14 % | **55,67 %** |
| Accueil ordinateur | 19,63 % | 19,68 % |
| Studio Live | 0,35 % | 0,42 % |

### 7.4 Cause n° 2 — le Studio Live était déjà aqua

Le Studio n'est pas peint par des classes Tailwind mais par ses propres
jetons `--live-*` posés sur `[data-live-universe]`. La couche aqua ne
pouvait donc pas l'atteindre — et n'avait rien à y faire : son abysse est
déjà `#0a2430` avec l'accent `#7fd9e6` depuis DS-L1, traitement validé par
la Direction le 03/09. Les 0,35 % ne sont pas un manque ; repeindre ce
module aurait modifié un design déjà validé.

### 7.5 Le garde-fou, refait

L'ancien vérifiait que le **texte** d'`index.html` contenait le sélecteur :
il restait vert alors que la règle ne parvenait jamais au navigateur.
`tests/miroirFeuilleAnalysee.test.ts` **analyse** désormais la feuille
(postcss) : aucun sélecteur ne peut contenir de prose, aucun ne peut
dépasser une longueur invraisemblable, et les règles de matière doivent
exister **après analyse**. Contre-épreuve faite : défaut réintroduit →
2 tests rouges ; restauré → 5/5 verts.

**Quatrième occurrence de la même famille de piège** dans ce dépôt — une
déclaration qui ne peint rien sans le dire : `-webkit-box-reflect: none`
ignoré par Chromium, teintes `brand-*` absentes de la config Tailwind,
`hidden sm:flex` annulé par un `flex` nu, et maintenant un commentaire mal
fermé.

### 7.6 Aveu de méthode sur les preuves

Les captures précédemment fournies venaient d'un banc local montant les
composants avec des modules simulés, **pas du lien public**. C'était une
faille de preuve. Les captures viennent désormais des fichiers réellement
servis par l'aperçu (relais octet-exact, SHA-256 comparés). Limite dite
franchement : le navigateur de l'environnement de développement ne peut pas
ouvrir l'URL lui-même — le relais du proxy de sortie ferme le tunnel — donc
chaque octet est téléchargé depuis l'URL publique par `curl` puis rendu dans
un vrai navigateur. **La validation reste l'ouverture du lien public par la
Direction.**
