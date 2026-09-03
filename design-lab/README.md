# Design Lab MokNet — laboratoire de direction artistique

Dossier **isolé**. Rien ici n'entre dans le build de production : `vite.config.ts`
n'a qu'un seul point d'entrée (`index.html` à la racine) et aucun fichier de ce
dossier n'est importé par l'application. Ouvrir un fichier d'ici ne modifie donc
jamais moknet.net.

## Méthode

Une interface à la fois, cinq visuels à chaque fois. La Direction choisit, le
modèle retenu est implanté dans l'application, poussé en production, vérifié —
puis on passe à l'interface suivante. Ordre prévu : menu, Équipe & Experts,
appel vidéo, Live/Studio, agents IA, messagerie, fil social.

## Fichiers

| Fichier | Interface | État |
|---|---|---|
| `menus.html` | Navigation principale — 5 directions | En attente de choix |

## Invariants que tout modèle doit respecter

Ces quatre points sont des décisions déjà prises, pas des propositions. Un
modèle qui en casse un est refusé quelle que soit sa qualité visuelle.

1. **Le réseau social est l'écran d'accueil.** Jamais une page institutionnelle,
   un moteur de recherche ou une liste de fonctionnalités.
2. **L'Architecte vit dans la navigation principale**, à la place centrale.
   Il n'est plus un second bouton flottant.
3. **Un seul élément flottant à l'écran : la goutte messagerie.**
4. **Équipe & Experts est au premier niveau**, et l'écran montre les personnes
   avant tout texte.

## Contrat de thème

Chaque modèle expose ses valeurs sous forme de variables CSS sur la racine de la
scène : fond et profondeur, matière, lumière, liquide, géométrie, typographie,
mouvement. Aucun composant ne code une couleur en dur. C'est ce qui permettra,
après la sélection, de généraliser un modèle retenu à toute l'application sans
le réécrire, et à terme d'en faire un thème sélectionnable par l'Administrateur
Général.

## Contraintes techniques tenues

- **Aucune dépendance ajoutée.** Pas de bibliothèque d'animation, pas de 3D.
  Le dépôt n'en installe aucune et cette mission n'en introduit pas.
- **Aucune image externe.** Les portraits sont générés en SVG à partir du nom,
  de façon déterministe. Aucun visage n'est inventé ni emprunté.
- **Mouvement réduit respecté.** Sous `prefers-reduced-motion`, chaque modèle
  reste lisible et utilisable sans animation.
- **Contraste mesuré**, pas estimé : le contrôle vérifie le rapport réel du
  libellé actif sur le fond réellement peint derrière lui.

## Vérification

Le contrôle navigateur réel (Chromium, cinq modèles × deux appareils) vérifie
pour chaque combinaison : navigation rendue, Architecte dans la navigation,
un seul flottant, réseau social en fond, Experts au premier niveau, appui qui
change réellement l'espace actif, cibles tactiles suffisantes sur téléphone,
contraste du libellé actif, et absence d'erreur de page.

Dernier passage : **77 contrôles verts**. Le seul écart restant est le
chargement des polices Google, bloqué par le proxy de sortie du bac à sable et
sans effet sur un navigateur réel — la pile de repli reste lisible.
