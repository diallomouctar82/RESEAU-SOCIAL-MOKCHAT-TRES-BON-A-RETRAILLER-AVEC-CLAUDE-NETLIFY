# Captures avant / après — Composeur « A7, rail latéral » et studio « Visuel IA » (B10) du Réseau MOC (5 septembre 2026, DEC-2026-061)

Choix de la Direction : **A7** pour la zone de publication (parmi dix
variantes de la série A) et **B10 « Plein écran sombre »** pour le studio
Visuel IA intégré à la publication (parmi dix variantes de la série B).
Produites par le harnais local **non versionné** (Layout + SocialFeed rendus
sans Supabase, `?tab=social`) sur `origin/main` (**avant**, `0f384b3`) et sur
la branche (**après**), dans Chromium headless via Playwright, à **1440×900**
(ordinateur), **820×1180, densité 2** (tablette) et **390×844, densité 2**
(téléphone). Le composeur est amené en haut de la zone de contenu avant
chaque capture ; les fichiers `-composeur` sont la carte seule.

La photo utilisée pour le studio est `photo-demo.jpg`, une **scène
synthétique** dessinée pour la démonstration (aucune personne réelle).

| Écran | Avant | Après |
| :--- | :--- | :--- |
| Réseau MOC, ordinateur (page) | `avant-ordinateur.png` | `apres-ordinateur.png` |
| Le composeur seul, ordinateur (rail à gauche, étincelle dans le champ, quatre actions IA nommées, Brouillon \| Publier) | `avant-ordinateur-composeur.png` | `apres-ordinateur-composeur.png` |
| Ordinateur, texte saisi, orbe « Vidéo » survolée, compteur « 102 caractères », Brouillon et Publier actifs | — | `apres-ordinateur-saisie.png` |
| Ordinateur, orbe « Traduire » → modale IA existante ouverte directement sur l'onglet Traduire | — | `apres-ordinateur-modale-traduire.png` |
| Ordinateur, photo jointe par l'orbe « Photo » (aperçu inchangé) | — | `apres-ordinateur-photo-jointe.png` |
| Ordinateur, studio Visuel IA ouvert (mode Prompt, intentions guidées) | — | `apres-ordinateur-studio-prompt.png` |
| Ordinateur, studio en réglages manuels (Portrait pro + Golden hour + vignette 35 + titre et sous-titre) | — | `apres-ordinateur-studio-manuel.png` |
| Ordinateur, aperçu « Avant » / « Après » | — | `apres-ordinateur-studio-avant.png` / `apres-ordinateur-studio-apres.png` |
| Ordinateur, photo retouchée insérée dans la publication (studio fermé) | — | `apres-ordinateur-inseree.png` |
| Le composeur seul, tablette (carte de 500 px : médias sous le champ, libellés masqués) | `avant-tablette-composeur.png` | `apres-tablette-composeur.png` |
| Tablette, studio en réglages manuels | — | `apres-tablette-studio-manuel.png` |
| Réseau MOC, téléphone (page) | `avant-telephone.png` | `apres-telephone.png` |
| Le composeur seul, téléphone | `avant-telephone-composeur.png` | `apres-telephone-composeur.png` |
| Téléphone, texte saisi | — | `apres-telephone-saisie.png` |
| Téléphone, studio plein écran (Prompt, puis réglages manuels) | — | `apres-telephone-studio-prompt.png` / `apres-telephone-studio-manuel.png` |
| Téléphone, aperçu « Avant » / « Après » | — | `apres-telephone-studio-avant.png` / `apres-telephone-studio-apres.png` |
| Téléphone, photo retouchée insérée | — | `apres-telephone-inseree.png` |

Niveau de preuve : 🧪 banc (navigateur réel, données locales, Supabase non
configuré, passerelle IA non appelée dans le harnais — le mode Prompt et la
génération d'image sont couverts par les tests avec une passerelle
doublée ; polices de secours du bac à sable — Outfit et Plus Jakarta Sans
sont servies par Google Fonts en production ; l'avatar du harnais n'a pas
d'image, d'où le texte de remplacement). Le contrôle final dans
l'application appartient à la Direction.

## Mesures (`avant-mesures.json` / `apres-mesures.json`, DOM + `getComputedStyle`, Chromium)

| Mesure | Avant (`origin/main` 0f384b3) | Après (branche) |
| :--- | :--- | :--- |
| Avatar (logo VS) : classes | `w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20` | **identiques**, 44 × 44 px |
| Invite du champ | « Quoi de neuf ? Partage une réflexion, une opportunité, un tutoriel ou un document. » | **identique** |
| Boutons visibles dans le composeur, ordinateur | 7 (Assistant IA, Photo, Vidéo, Document, Voix, Brouillon, Publier) | **11** : Photo, Vidéo, Document, Voix (rail), Assistant IA Pré-Publication (étincelle), Améliorer le style, Traduire, Hashtags, Visuel IA, Brouillon, Publier |
| Boutons visibles, tablette et téléphone | 7 | 11 (les médias passent sous le champ) |
| Cibles de moins de 40 px de haut | **7 sur 7** (28 à 34 px ; 33 × 33 px sur téléphone) | **0** (orbes de 40 px dans des boutons d'au moins 44 px) |
| Hauteur du champ, ordinateur / tablette / téléphone | 67 / 67 / 67 px | 150 / 96 / 96 px |
| Hauteur de la carte, ordinateur / tablette / téléphone | 212 / 288 / 325 px | 382 / 404 / 404 px |
| Rail latéral / ligne de médias sous le champ | — | ordinateur : rail visible, ligne masquée ; tablette et téléphone : rail masqué, ligne visible |
| Compteur de caractères | — | ordinateur : « 0 caractère » puis « 102 caractères » ; masqué sur tablette et téléphone |
| Visibilité / catégorie par défaut | 🌐 Public / Tech & Innovation | **identiques** (mêmes `<select>`, mêmes options) |
| Orbe « Traduire » | — | modale « Assistant IA Pré-Publication Mooc » ouverte sur « Choisissez la langue cible » ; fermée ensuite |
| Studio Visuel IA (feuille) | — | ordinateur 1040 × 817 px centrée ; tablette 784 × 901 px ; téléphone **plein écran** 390 × 844 px ; racine `#root` inerte ; focus sur « Fermer le studio » |
| Studio : modes / familles | — | Prompt (actif) · Réglages manuels ; Visage & cheveux, Lumière, Cinéma, Texte, Vidéo (inactif sans vidéo) |
| Studio : aperçu | — | canvas 720 × 480 px (photo 1200 × 800 réduite), badge « Original · Golden hour » après réglages, Réinitialiser et Insérer actifs |
| Insertion | — | image `blob:` dans l'aperçu du composeur, studio fermé, `inert` retiré, Publier actif |
| Débordement horizontal de la page | non | non (les trois écrans) |
| Erreurs JS applicatives | aucune | aucune (seul un avis de Chromium sur `navigator.vibrate` avant tout geste, hors application) |
