# Assistant IA Pré-Publication : panneau toujours dans l'écran sur téléphone (DEC-2026-082, v6.42.1)

Constat de la Direction (5 septembre 2026) : « Quand j'écris un message puis que j'appuie sur "améliorer", le panneau assistant / pré-publication s'ouvre trop grand et sort du cadre. L'utilisateur ne doit pas avoir à rétrécir manuellement. Il faut que le panneau soit dimensionné correctement sur tous les téléphones, avec défilement interne si besoin, mais toujours dans l'écran, et les boutons importants doivent rester visibles et utilisables. »

## Cause mesurée (`avant-taille.json`, `main` `a440309`)

- Sans zoom, la carte tient déjà dans l'écran sur toutes les tailles (320 × 568 à 412 × 915, et 390 × 500 clavier ouvert).
- Le champ du composeur est à **12 px** sur téléphone : Safari iOS zoome automatiquement la page quand un champ de moins de 16 px reçoit le focus. Le panneau s'ouvre ensuite dans une page zoomée : avec un zoom de 1,33 ou 1,5 (émulé ici par `Emulation.setPageScaleFactor`, l'équivalent du zoom d'iOS), **la carte et le bouton « Appliquer » sortent de la zone visible** — c'est le « trop grand, hors cadre », et le pincement pour rétrécir.
- Révélé en largeur étroite : l'en-tête et le pied ne se rétrécissaient pas (largeur minimale supérieure à la carte) et le focus sur « Fermer » faisait défiler la carte horizontalement malgré `overflow-hidden` ; les parties fixes écrasaient les onglets et faisaient déborder le pied sous la carte.

## Correctif (modale et champ du composeur seulement)

1. Champ du composeur à **16 px** (interligne 1,4) sur pointeur tactile ou fenêtre étroite : plus de zoom automatique ; ordinateur inchangé (12 px).
2. Le voile de la modale **suit la zone réellement visible** (`window.visualViewport` : zoom volontaire, clavier ouvert) ; sans cette API, `inset-0` suffit.
3. Carte bornée à **90 % du voile** (96 % quand le voile fait moins de 560 px de haut : clavier, zoom) ; `overflow: clip` (jamais défilée par un focus).
4. En-tête, onglets et pied **jamais compressés** ; seule la zone de contenu défile.
5. En-tête et pied **repliables** (`min-w-0`, `flex-wrap`, `break-words`) et **compacts** quand le voile fait moins de 320 px de large (titre 16 px, marges réduites) ; rien n'est retiré.

## Résultats de la sonde (`taille.cjs` → `avant-taille.json` / `apres-taille.json`)

| Cas | Champ avant → après | Carte dans la zone visible avant → après | Bouton « Appliquer » dans la zone visible et sous le doigt avant → après | Débordement horizontal après | Bouton rogné après |
| :--- | :--- | :--- | :--- | :--- | :--- |
| iPhone SE 1 — 320 × 568 | 12 → 16 px | oui → oui | oui → oui | non | non |
| Android — 360 × 640 | 12 → 16 px | oui → oui | oui → oui | non | non |
| iPhone SE — 375 × 667 | 12 → 16 px | oui → oui | oui → oui | non | non |
| iPhone — 390 × 844 | 12 → 16 px | oui → oui | oui → oui | non | non |
| Android — 412 × 915 | 12 → 16 px | oui → oui | oui → oui | non | non |
| iPhone 390 × 500 (clavier ouvert) | 12 → 16 px | oui → oui | oui → oui | non | non |
| iPhone 390 × 844, **zoom 1,5** | 12 → 16 px | **non → oui** | **non → oui** | non | non |
| iPhone 375 × 667, **zoom 1,33** | 12 → 16 px | **non → oui** | **non → oui** | non | non |
| Ordinateur 1440 × 900 | 12 → 12 px (inchangé) | oui → oui | oui → oui | non | non |

Sur les neuf cas après : zone de contenu défilante là où le contenu dépasse (pas sur ordinateur, où tout tient), aucune erreur JavaScript. Parcours complet (`parcours.cjs` → `apres-parcours.json`, captures `apres-telephone-2-modale`, `apres-telephone-5-fil`, `apres-ordinateur-2-modale`) : sur 390 × 844, 360 × 800 et 1440 × 900, le bouton est sous le doigt, la modale se ferme, le texte est appliqué et publié dans le fil.

## Fichiers

- `avant-<cas>.png` (quatre cas significatifs : les deux zooms, 320 × 568, clavier) et `apres-<cas>.png` (les neuf cas) : captures de la zone visible.
- `taille.cjs` : `SHA=<sha> ETAT=avant|apres PORT=<port du serveur Vite> node taille.cjs <dossier>` ; `parcours.cjs` : même usage.

## Limites honnêtes

- Zoom de page émulé par Chromium (`Emulation.setPageScaleFactor`) : fidèle à la géométrie, mais le zoom automatique d'iOS lui-même ne s'émule pas ; le seuil de 16 px est celui documenté par Apple. Harnais local sur le même code, pas l'écran authentifié ; pas d'appareil réel.
- Sur les cartes de moins de 320 px (zoom volontaire fort), la zone de contenu ne fait que quelques dizaines de pixels de haut : elle défile, l'en-tête et les boutons restent entiers ; c'est le compromis choisi pour ne rien retirer.
