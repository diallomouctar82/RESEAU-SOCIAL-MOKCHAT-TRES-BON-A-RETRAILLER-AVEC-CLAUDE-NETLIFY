# Enregistrer un direct MokNet — architecture légère (LP-12)

> **Statut : architecture seulement.** Aucun code d'enregistrement n'est écrit,
> aucune migration n'est appliquée, rien n'est déployé. Ce document existe pour
> être discuté avant construction, conformément à la demande : « commence par
> une architecture légère, fallback inclus, et des tests mobiles ».

---

## 1. Ce que le bouton fait, vu de la personne

Un bouton **Enregistrer** dans le direct.

```
1er clic  →  l'enregistrement démarre (pastille rouge visible, durée qui court)
2e clic   →  il s'arrête
             ↓
      ┌─────────────────────────────────────────────┐
      │  Votre enregistrement · 2 min 14 s · 18 Mo  │
      │                                             │
      │   [ Publier ]   [ Sauvegarder ]  [ Modifier ]│
      │                                             │
      │  Rien n'est envoyé à MokNet tant que vous   │
      │  n'avez pas choisi « Publier ».             │
      └─────────────────────────────────────────────┘
```

**Rien n'est stocké chez MokNet par défaut.** Le fichier vit dans la mémoire du
navigateur jusqu'à ce que la personne décide. Fermer la fenêtre sans choisir le
perd — et la fenêtre le dit avant de se fermer.

| Parcours | Ce qui se passe réellement |
|---|---|
| **Sauvegarder** | Le fichier descend sur l'appareil. Rien ne part sur le réseau. |
| **Publier** | Le fichier est téléversé **une seule fois, sur ce geste explicite**, et devient un brouillon de publication rattaché au direct (`source_type='live_session'`, la voie déjà en place depuis LOOP 01/17). Ce n'est pas « le stockage plateforme activé » — c'est la personne qui publie, comme elle publierait une photo. La fenêtre le dit en une phrase. |
| **Modifier** | Ouvre le mini studio (§4), puis ramène aux deux autres parcours. |

---

## 2. Ce qui est réellement enregistré — et le piège à ne pas se tendre

Trois façons de capturer un direct, et elles ne se valent pas :

| Voie | Ce qu'elle donne | Ce qu'elle coûte |
|---|---|---|
| **A · `getDisplayMedia`** (capture d'onglet) | Exactement ce que l'écran montre | Un sélecteur système à chaque fois, **et rien du tout sur iOS Safari** : l'API n'existe pas. Sur Android, partiel selon le navigateur. |
| **B · Composition locale** : un `canvas` qui redessine la scène + un mixage WebAudio des pistes auxquelles je suis abonné, le tout donné à `MediaRecorder` | Marche sur téléphone comme sur ordinateur, et **respecte ma langue d'écoute** : si j'écoute en français, c'est l'interprète français qui est enregistré, pas l'original | Coût CPU réel pendant tout le direct ; il faut redessiner la scène à 24-30 images/s |
| **C · Mon seul micro + ma caméra** | Presque gratuit (c'est déjà ce que fait `ReelsCreator`) | **Ce n'est pas le direct** — c'est moi. À ne pas faire passer pour un enregistrement du direct. |

**Décision proposée : B en cible, A en raccourci sur ordinateur, C jamais seul.**
La voie B est la seule qui tienne la promesse sur téléphone, et c'est la seule
qui respecte le fait que chacun entend le direct dans SA langue.

**Le piège déjà rencontré ici, à ne pas répéter** :
`ReelsCreator.tsx:145` étiquette son Blob `video/mp4` alors que le navigateur a
souvent encodé du `video/webm` — un fichier au type menteur, illisible ailleurs.
C'est exactement le défaut que l'équipe F1 avait dû corriger pour les vocaux
(`MoocChatFloating.tsx:871`, `pickSupportedAudioMime`). L'enregistrement du
direct négociera donc son format avec `MediaRecorder.isTypeSupported` et
étiquettera le Blob avec le type **effectif** du recorder, jamais un type
souhaité.

---

## 3. Réglage de l'hôte : autoriser ou non l'enregistrement par les spectateurs

Une colonne sur la session, lue par tout le monde :

```sql
alter table public.live_sessions
  add column allow_viewer_recording boolean not null default false;
```

- **Par défaut : non autorisé.** Aujourd'hui personne ne peut enregistrer ;
  livrer la fonction avec « autorisé » l'accorderait rétroactivement à tous les
  directs existants sans que leur hôte l'ait décidé.
- L'hôte peut toujours enregistrer **son propre** direct.
- Le réglage est visible des participants : le bouton est absent, avec une
  raison lisible (« l'animateur n'autorise pas l'enregistrement »), jamais un
  bouton qui échoue en silence.

> **Honnêteté nécessaire** : c'est une **règle sociale, pas une garantie
> technique**. N'importe qui peut filmer son écran avec son téléphone. Le
> réglage exprime une intention et la fait respecter dans MokNet ; il ne
> l'impose pas au monde. Ne jamais laisser croire l'inverse à un hôte.

**Migration NON appliquée** à ce stade : elle touche la base de production.
Elle attend la validation.

---

## 4. Mini studio — et ce que « découper » coûte vraiment

Découpe début/fin, pré-visualisation, son ou voix off éventuels, export.

La pré-visualisation est immédiate : deux bornes sur un `<video>`, aucune
transformation du fichier.

**L'export, lui, n'est pas gratuit, et il faut le dire :** couper un WebM ou un
MP4 dans un navigateur, sans bibliothèque, n'existe pas. Deux voies seulement :

| Voie | Coût |
|---|---|
| **Ré-enregistrer la portion choisie** (lecture → canvas + WebAudio → `MediaRecorder`) | Temps réel : un extrait de 2 minutes met 2 minutes à s'exporter. Aucune dépendance nouvelle. |
| **`ffmpeg.wasm`** | Découpe quasi instantanée, mais ~25 Mo à télécharger, et une charge mémoire que beaucoup de téléphones ne tiennent pas. |

**Décision proposée : ré-enregistrement, avec la durée annoncée AVANT de
lancer** (« l'export prendra environ 2 minutes »), et une barre d'avancement
réelle. C'est lent mais honnête, sans dépendance, et ça marche sur téléphone.
La voix off et le son ajouté passent par le même mixage — donc sans coût
supplémentaire une fois cette voie choisie.

---

## 5. Stockage plateforme — désactivé, et prévu pour plus tard

Rien n'est stocké par défaut. Ce qui est **préparé** sans être construit :

- un réglage d'administration **désactivé par défaut** ;
- une fois activé : quota gratuit par compte, puis option payante ;
- le fichier ne quitte l'appareil que sur « Publier », et cela reste vrai que
  le stockage plateforme soit activé ou non.

Ce qu'il ne faut **pas** faire maintenant : créer le bucket, la table de quota
et l'écran d'administration « en prévision ». Ce dépôt a déjà rencontré trois
fois le motif inverse — `stories`, `post_documents`, `courses` : schéma prêt
depuis l'origine, jamais consommé, personne ne s'en souvenait. On construira le
stockage le jour où il servira.

---

## 6. Replis explicites — jamais un bouton qui échoue en silence

| Situation | Ce que voit la personne |
|---|---|
| `MediaRecorder` absent (vieux navigateur) | Bouton absent + raison au survol/tap |
| Aucun format supporté | « Ce navigateur ne sait pas enregistrer de vidéo » — pas un bouton mort |
| `getDisplayMedia` refusé ou indisponible (iOS) | Bascule silencieuse sur la voie B, sans message d'échec : la personne obtient son enregistrement |
| L'application passe en arrière-plan (téléphone) | Le navigateur gèle l'onglet et l'enregistrement s'arrête. **Le fichier partiel est conservé** et proposé, jamais perdu sans le dire |
| Mémoire saturée sur un long direct | Avertissement au-delà d'un seuil de durée, et arrêt propre plutôt qu'un plantage d'onglet |
| L'hôte n'autorise pas | Bouton absent + raison |

Règle qui les couvre tous : **un enregistrement qui échoue le dit et rend ce
qu'il a**. C'est la même discipline que « ne jamais afficher *envoyé* avant la
confirmation du serveur ».

---

## 7. Tests prévus

**Règles pures** (aucun DOM, aucun réseau) — négociation de format, choix de la
voie de capture selon les capacités déclarées, autorisation hôte/spectateur,
bornes de découpe, seuils de durée.

**DOM** — deux clics = démarrer/arrêter ; la fenêtre à trois parcours apparaît ;
« Sauvegarder » ne déclenche aucun appel réseau (vérifié par espion) ;
« Publier » en déclenche exactement un ; bouton absent quand l'hôte refuse.

**Banc navigateur réel, format téléphone 390×844** — c'est la partie qui compte
et que jsdom ne peut pas rendre :
- les trois boutons de la fenêtre ≥ 44 px et **dans** l'écran, pas coupés ;
- la fenêtre entière visible sans défilement horizontal ;
- la pastille d'enregistrement visible pendant le direct sans recouvrir une
  commande (le motif exact du défaut MB-1) ;
- passage en arrière-plan puis retour : le fichier partiel est bien proposé ;
- l'export d'un extrait court va réellement jusqu'au bout et produit un fichier
  lisible (type MIME vérifié, pas supposé).

---

## 8. Ce qui reste à trancher avant de construire

1. **Voie de capture** — la composition locale (B) est la seule qui marche sur
   iPhone et la seule qui respecte la langue d'écoute de chacun. Elle coûte du
   CPU pendant tout le direct. Est-ce acceptable ?
2. **Défaut du réglage hôte** — « non autorisé » proposé ci-dessus. À confirmer.
3. **Export lent mais sans dépendance**, ou ~25 Mo de `ffmpeg.wasm` ?
4. **« Publier »** téléverse un fichier : à confirmer que ce n'est pas ce que
   vous appelez « stockage plateforme », qui reste bien désactivé.
