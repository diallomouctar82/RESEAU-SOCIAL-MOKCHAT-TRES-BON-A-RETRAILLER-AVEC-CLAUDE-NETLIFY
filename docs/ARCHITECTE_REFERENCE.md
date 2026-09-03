# Architecte MokNet — point d’entrée unique

L’Architecte **existe déjà**. Toute évolution de l’Architecte doit partir de ces deux documents, lus ensemble :

1. [`ARCHITECTE.md`](./ARCHITECTE.md) — **réalité technique** : capacités réellement exécutables, permissions, garde-fous, statuts, tests et architecture du sous-système.
2. [`ARCHITECTE_GUIDE_MAISON_MOKNET.md`](./ARCHITECTE_GUIDE_MAISON_MOKNET.md) — **mission humaine et produit** : accueil, posture, connaissance de la maison MokNet, argumentaires, scénarios de dialogue, limites et règles de cohérence.

## Règle de lecture

- Pour savoir **ce que l’Architecte peut réellement faire aujourd’hui**, lire `ARCHITECTE.md`.
- Pour savoir **comment il doit accueillir, expliquer et guider**, lire `ARCHITECTE_GUIDE_MAISON_MOKNET.md`.
- En cas de conflit entre un argumentaire et une capacité réelle, **la réalité technique gagne toujours**.
- Une idée future ne doit jamais être présentée comme une fonction disponible.

## Règle de maintenance

Quand une nouvelle capacité importante est ajoutée à MokNet :

1. elle doit être implantée et testée dans sa source de vérité ;
2. `ARCHITECTE.md` doit refléter la capacité réelle ;
3. le guide doit être mis à jour seulement si cette capacité change la façon d’accueillir, d’expliquer ou d’orienter ;
4. les deux documents doivent rester cohérents.

Ce fichier sert de boussole aux développeurs humains, aux agents IA et à toute personne qui reprend le projet.
