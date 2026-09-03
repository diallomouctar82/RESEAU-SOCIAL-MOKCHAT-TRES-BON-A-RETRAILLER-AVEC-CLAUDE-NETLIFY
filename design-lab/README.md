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

| Fichier | Interface | État |
|---|---|---|
| `menus.html` | Écran d'accueil / navigation — 5 traitements | En attente de choix |

## La disposition est FIXE — seul le traitement change

Décision de la Direction : la disposition de la capture d'écran fournie ne
bouge pas. Les cinq traitements partagent **un seul et même générateur d'écran**
(`screen()` dans `menus.html`), ce qui garantit que la structure est
rigoureusement identique de 01 à 05 :

en-tête (logo · marque · pastille Architecte · recherche · palette 11 ·
crédits 1000000© · avatar) → sous-barre **Équipe & Experts** → carte
**Réseau Mooc** (onglets Fil d'actu / Reels / Lives / Tribus / Croissance +
bouton Mon Espace Personnel) → stories → fil social → goutte messagerie →
dock à cinq emplacements avec **Architecte central en relief**.

Ce qui change d'un traitement à l'autre, et rien d'autre : la **matière**, la
**forme des boutons**, la **couleur**, la **typographie** et le **mouvement**.

## Les cinq traitements

| # | Nom | Matière | Ce qui le distingue |
|---|---|---|---|
| 01 | Cristal | Verre net et froid | Arêtes fines, bleu électrique, un reflet oblique traverse l'écran |
| 02 | Aurore | Verre très transparent | Nappes rose/lilas/pêche/cyan qui dérivent, les plus grands rayons |
| 03 | Papier | Aucun verre, blanc pur | Géométrie nette, aplats francs, réglette tricolore animée |
| 04 | Prisme | Verre clair, arêtes irisées | La couleur vit sur le bord, jamais dans le fond |
| 05 | Eau claire | Verre humide | Rayons asymétriques, niveaux d'eau, marée qui respire |

## Règles de couleur et de mouvement (consignes de la Direction)

- **Aucune couleur sombre.** Fonds clairs, blancs, transparents. La luminance
  moyenne mesurée des surfaces de fond est vérifiée au-dessus de 0,55 dans les
  dix combinaisons (traitement × appareil).
- **Le blanc et le vert** portent la prospérité et la souveraineté. Chaque
  traitement déclare une variable `--pros` (vert) réellement appliquée.
- **Toujours de l'animation.** Une couche commune anime les cinq : poussière de
  lumière au canevas, éclat qui traverse les crédits et le bouton Experts,
  anneau vert tournant sur la story en direct, barre de progression qui avance,
  halo conique derrière l'Architecte, tuile Réseau Mooc qui respire, point
  rouge de l'onglet Lives, goutte messagerie qui flotte, filet lumineux sur la
  carte. Chaque traitement ajoute ensuite son propre mouvement de fond.

## Invariants que tout modèle doit respecter

Ces quatre points sont des décisions déjà prises, pas des propositions.

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
- **Aucune image externe.** Les portraits sont générés en SVG à partir du nom,
  de façon déterministe. Aucun visage n'est inventé ni emprunté.
- **Mouvement réduit respecté.** Sous `prefers-reduced-motion`, l'écran reste
  complet et lisible sans animation.
- **Contraste mesuré**, pas estimé : le contrôle remonte jusqu'à la première
  surface opaque réellement peinte derrière le texte.

## Vérification

Contrôle navigateur réel (Chromium, cinq traitements × deux appareils). Pour
chaque combinaison : disposition complète de la capture, Architecte central et
dominant dans le dock, un seul flottant, fond clair mesuré, contraste du texte
du fil, nombre d'éléments réellement animés (pseudo-éléments compris) plus le
canevas, vert de prospérité appliqué, en-tête sans débordement, aucun
défilement horizontal, dock ancré en bas et entièrement visible, goutte
entièrement dans l'écran, cibles tactiles sur téléphone, mouvement réduit.

Dernier passage : **187 contrôles verts**.

Quatre défauts réels trouvés par les captures et corrigés avant publication :
la classe `.bar` de la galerie écrasait la barre de progression des stories ;
`.t4` remettait le dock en flux normal, ce qui le renvoyait en haut de l'écran ;
l'en-tête débordait de la largeur du téléphone ; la pastille « 3 non lus » était
rognée par le débordement caché de la goutte.

Le seul écart restant est le chargement des polices Google, bloqué par le proxy
de sortie du bac à sable et sans effet dans un navigateur réel — la pile de
repli reste lisible.
