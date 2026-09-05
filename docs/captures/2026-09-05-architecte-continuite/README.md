# Architecte — l'avatar accompagne TOUTE la conversation (C1, 5 septembre 2026)

**Constat de la Direction (production réelle, téléphone et ordinateur)** : « L'avatar est bien là, visible et vivant, mais après sa présentation, il ne porte plus la conversation. Il faut que l'avatar accompagne toute la conversation et soit synchronisé aux réponses. Corrige cela dans le même périmètre. »

**Niveau de preuve** : 🧪 banc Chromium 1194 (Playwright 1.56), harnais authentifié non versionné (`preview-harness.html`, Layout + Dashboard, Supabase absent), passerelle IA doublée par le banc : la **voix HD est un extrait réel de 3,2 s de la voix attitrée** (`public/architecte/vision-smart.wav`, rejoué pour chaque phrase), le cerveau renvoie deux réponses fixées, la reconnaissance vocale est un moteur factice auquel le banc souffle les phrases de la personne. Deux écrans : ordinateur 1440 × 900 et téléphone 390 × 844 (×2, tactile). **Avant** = `origin/main` `f6d9a16` (v6.42.1, en production) ; **après** = branche C1. Même script, mêmes doublures, même scénario.

## Scénario joué (identique avant / après)

1. Repos (sculpture seule) → **appui sur la sculpture** (geste réel) : présentation vidéo dans la sculpture, barre ouverte (le banc saute à la fin de la vidéo de 9,1 s).
2. **Accueil dit** par la voix HD (« Bonjour Amadou. Que puis-je faire pour vous aujourd'hui ? ») → écoute reprise toute seule.
3. La personne parle (« Que peut faire Vision Smart pour moi ? ») → réflexion → **réponse dite** → écoute.
4. Deuxième question ; **appui sur la sculpture PENDANT la réponse**.
5. Fermeture par le ✕ « Fermer » de la barre (après seulement : avant, tout est déjà fermé par l'appui).

## Captures

| Étape | Ordinateur 1440 × 900 | Téléphone 390 × 844 |
| :--- | :--- | :--- |
| Repos | `apres-ordinateur-1440x900-01-repos.jpg` | `apres-telephone-390x844-01-repos.jpg` |
| Présentation dans la sculpture | `apres-ordinateur-1440x900-02-presentation.jpg` | `apres-telephone-390x844-02-presentation.jpg` |
| Accueil dit (bouche en mouvement, sous-titre) | `apres-ordinateur-1440x900-03-accueil-parle.jpg` | `apres-telephone-390x844-03-accueil-parle.jpg` |
| Écoute reprise | `apres-ordinateur-1440x900-04-ecoute.jpg` | `apres-telephone-390x844-04-ecoute.jpg` |
| Réponse dite — **après** | `apres-ordinateur-1440x900-06-reponse-parle.jpg` | `apres-telephone-390x844-06-reponse-parle.jpg` |
| Réponse dite — avant | `avant-ordinateur-1440x900-06-reponse-parle.jpg` | `avant-telephone-390x844-06-reponse-parle.jpg` |
| Écoute après la réponse | `apres-ordinateur-1440x900-07-reecoute.jpg` | `apres-telephone-390x844-07-reecoute.jpg` |
| Appui pendant la réponse — **après** (« Je vous écoute. », barre ouverte) | `apres-ordinateur-1440x900-08-appui-reprise.jpg` | `apres-telephone-390x844-08-appui-reprise.jpg` |
| Appui pendant la réponse — avant (**tout est fermé**) | `avant-ordinateur-1440x900-08-appui-reprise.jpg` | `avant-telephone-390x844-08-appui-reprise.jpg` |
| Fermé par le ✕ | `apres-ordinateur-1440x900-09-ferme.jpg` | `apres-telephone-390x844-09-ferme.jpg` |

## Mesures (`*-mesures.json`, un fichier par écran et par état)

| Mesure | Avant (ordinateur / téléphone) | Après (ordinateur / téléphone) |
| :--- | :--- | :--- |
| Paroles HD entendues (accueil, réponse 1, réponse 2) | 3 / 3 | 3 / 3 |
| Moteur vocal utilisé | `elevenlabs` seul | `elevenlabs` seul (aucun repli) |
| Piste phonétique alignée sur chaque phrase | oui | oui |
| Liaisons d'un élément audio au graphe (une par `new Audio()`) | **5 / 5** | **1 / 1** (élément déverrouillé dans le geste, réutilisé) |
| Lecture déverrouillée dans le geste, contexte audio `running` | n/a (moteur avant C1) | oui / oui |
| Bouche pendant la parole : part des images ouvertes (> 0,05) — écart non expliqué, non attribué à C1 | 40 % / 41 % | 71 % / 72 % |
| Bouche pendant la parole : ouverture max / moyenne | 0,58 / 0,10 | 0,35 / 0,12 |
| Bouche hors parole : ouverture max | 0 | 0 |
| Appui sur la sculpture pendant la réponse | **barre fermée, présence `rest`, mode conversationnel coupé** | **barre ouverte, « Je vous écoute. », présence `listening`, voix tue** |
| Libellé de la sculpture ouverte | « Ouvrir l'Architecte » (après fermeture) | « Parler à l'Architecte » |
| Démarrages d'écoute | 2 / 2 | 3 / 3 (l'écoute repart après l'appui) |
| Erreurs JS (hors bruits connus) | 0 | 0 (un avertissement `navigator.vibrate` bloqué avant geste, préexistant) |

Chronologie « après » (ordinateur, ms depuis le chargement) : repos → appui 2 938 → présentation `speaking` 3 168 → accueil `speaking` 5 602 → `listening` 12 471 → question → réponse `speaking` 13 142 → `listening` 20 433 → question 2 → `speaking` 21 046 → appui 21 493 → `listening` 22 068 → ✕ → `rest` 22 979. Téléphone : même enchaînement à ±150 ms.

## Ce que ces mesures prouvent — et ce qu'elles ne prouvent pas

- **Prouvé** : après sa présentation, l'Architecte dit l'accueil, écoute, dit chaque réponse par la voix HD, la bouche bouge pendant qu'il parle et seulement à ce moment-là, l'écoute repart seule après chaque réponse ; toucher l'avatar pendant qu'il parle ne ferme plus rien (il se tait et écoute) ; fermer reste sur le ✕. Avant, l'appui fermait tout — c'est le geste naturel de quelqu'un qui veut lui parler, et le défaut vécu par la Direction.
- **Non reproductible sur ce banc** : le mutisme par contexte audio suspendu (Safari/iOS : `resume()` refusé hors geste ; l'élément « jouait » sans qu'aucun son sorte) — Chromium headless accorde l'activation collante dès le premier clic. Ce cas est couvert par les tests du moteur (`contexte qui ne démarre pas → élément non relié, voix en direct` ; `première phrase refusée → repli navigateur, jamais un silence pris pour un succès`). Sur iPhone / iPad, la voix sort en direct de l'élément audio (jamais par le graphe Web Audio, muet sous l'interrupteur silencieux) : non mesurable ici, à contrôler sur appareil réel.
- **Bouche** : l'extrait vocal est le même pour chaque phrase, la piste phonétique aligne le texte de la phrase sur cet extrait — la preuve porte sur le mouvement synchronisé avec la parole (0 hors parole), pas sur la justesse phonème par phonème.
- **« Réfléchit »** : avec une passerelle instantanée, l'état dure moins qu'un échantillon (50 ms) ; la tenue de la réflexion jusqu'au premier son est prouvée par test DOM (`tests/ArchitecteFloatingBar.test.tsx`).
- Le contrôle final sur téléphone réel appartient à la Direction (prochaine production contrôlée).

## Rejouer

```
# serveur de la branche : npx vite --port 5178 --host 127.0.0.1 (harnais preview-harness.* à la racine, non versionné)
BASE=http://127.0.0.1:5178 node preuve-c1.cjs <dossier> apres
# « avant » : même commande sur un worktree origin/main servi sur un autre port, étiquette avant
```

Le script `preuve-c1.cjs` attend `voix-3s.wav` à côté de lui (extrait de 3,2 s de `public/architecte/vision-smart.wav`, mono 22,05 kHz, produit par ffmpeg) et le harnais exposant `window.__voiceEngine`.
