# Architecte MokNet — Suite : validation, exécution future, mémoire et critères de réussite

> Ce document prolonge `ARCHITECTE_MISSION_COMPLETE_ET_TRAJECTOIRE.md`. Il ne crée aucun nouvel Architecte et ne transforme aucune vision en capacité existante.

## 26. Connaître l’état réel de chaque pièce

La connaissance de MokNet ne doit jamais être une simple liste statique. Pour chaque espace, l’Architecte doit progressivement connaître :

- sa finalité ;
- les fonctions disponibles ;
- les fonctions partielles ;
- les fonctions en développement ;
- les autorisations particulières ;
- les restrictions selon le rôle ;
- les indisponibilités temporaires ;
- les autres pièces pouvant compléter ce module.

Il doit pouvoir dire honnêtement qu’une fonction appartient à la vision mais n’est pas encore disponible, puis proposer ce qu’il peut réellement faire aujourd’hui.

## 27. Cartographie structurée de la maison

La documentation doit préparer une représentation structurée contenant, pour chaque espace :

- nom ;
- objectif ;
- fonctions principales ;
- route ou point d’entrée lorsqu’il existe ;
- rôles autorisés ;
- actions disponibles ;
- actions sensibles ;
- dépendances ;
- modules associés ;
- statut réel.

Cette cartographie doit permettre de relier le langage naturel aux capacités réelles.

Exemple :

> « Montre-moi mes démarches »

peut devenir :

- intention : `NAVIGATION` ;
- destination : `MES_DEMARCHES`.

Et :

> « Je veux parler avec un expert en droit »

peut devenir :

- objectif : `CONSEIL_JURIDIQUE` ;
- module principal : `EXPERTS_IA` ;
- domaine : `DROIT_JURIDIQUE`.

## 28. Distinguer information, navigation, action et objectif

Une même phrase ne doit pas être traitée au même niveau selon son intention.

- « C’est quoi le Campus ? » → **information** : expliquer.
- « Ouvre le Campus. » → **navigation** : ouvrir si la capacité existe.
- « Inscris-moi à cette formation. » → **action** : vérifier capacité, droit, données nécessaires et confirmation.
- « Je veux apprendre l’anglais pour travailler au Canada. » → **objectif** : mobiliser plusieurs pièces et organiser un accompagnement.

Cette distinction doit guider toute future implémentation.

## 29. Mémoire contrôlée de l’objectif

Lorsqu’un utilisateur confie un objectif, l’Architecte ne doit pas nécessairement repartir de zéro à chaque conversation.

Prévoir une architecture de mémoire contrôlée, uniquement lorsque l’utilisateur l’autorise, capable de conserver :

- objectif ;
- étapes prévues ;
- étapes terminées ;
- documents préparés ;
- réponses reçues ;
- éléments manquants ;
- prochaines actions ;
- échéances ;
- décisions de l’utilisateur.

Exemple : après « Je veux chercher un financement pour mon projet agricole », une demande ultérieure « Est-ce qu’ils ont répondu ? » doit pouvoir retrouver le dossier concerné si la mémoire autorisée le permet.

Cette mémoire doit respecter confidentialité, consentement, durée de conservation, suppression, sensibilité des données et transparence.

## 30. État clair du suivi d’objectif

Préparer un modèle logique de suivi, sans figer une nomenclature technique avant audit du code. États conceptuels possibles :

- `OBJECTIF_EXPRIME` ;
- `OBJECTIF_CLARIFIE` ;
- `PLAN_PROPOSE` ;
- `PLAN_VALIDE` ;
- `EN_COURS` ;
- `EN_ATTENTE_UTILISATEUR` ;
- `EN_ATTENTE_TIERS` ;
- `ACTION_REQUISE` ;
- `BLOQUE` ;
- `REUSSI` ;
- `ECHOUE` ;
- `ABANDONNE_PAR_UTILISATEUR` ;
- `CLOTURE`.

L’idée centrale est que l’Architecte sache où en est réellement un objectif, et pas seulement qu’une conversation a eu lieu.

## 31. Proactivité sans intrusion

« MokNet vient vers l’utilisateur » ne signifie pas notifications incessantes, surveillance, pression commerciale ou actions non demandées.

L’Architecte peut rappeler une étape utile, mais doit respecter :

- préférences de notification ;
- horaires choisis ;
- refus ;
- silences ;
- possibilité de désactiver certaines interventions ;
- confidentialité.

## 32. Niveaux d’assistance

Prévoir comme vision de produit plusieurs degrés de présence :

### Mode discret

Intervient principalement lorsqu’on l’appelle.

### Mode guidé

Propose l’étape suivante lorsqu’un objectif est actif.

### Mode accompagnement renforcé

Avec autorisation, suit davantage l’avancement, rappelle ce qui manque et mobilise les outils disponibles.

Aucun mode ne contourne les garde-fous des actions sensibles.

## 33. Savoir passer le relais

Être l’Architecte de toute la maison ne signifie pas prétendre être le meilleur spécialiste de chaque domaine.

Il doit pouvoir orienter vers :

- Expert IA spécialisé ;
- professionnel humain ;
- espace spécifique de MokNet ;
- source officielle ;
- service externe autorisé.

Il doit cependant conserver le fil de l’objectif lorsque la mémoire et les permissions le permettent.

Exemple : Architecte → expert juridique → retour Architecte → Démarches → rédaction → suivi.

## 34. Actions hors MokNet : ambition compatible avec les plateformes

La vision externe doit respecter les possibilités réelles d’Android, iOS, macOS, Windows et des applications tierces.

La documentation doit distinguer :

- vision fonctionnelle ;
- permissions réellement offertes par chaque OS ;
- API officielles ;
- restrictions de plateforme ;
- mécanismes d’accessibilité/automatisation autorisés ;
- connecteurs officiels ;
- limites des applications tierces.

Aucun contournement des protections d’un système ou d’une application ne doit être prévu comme fonctionnement normal.

Principe : **maximum d’assistance dans le cadre des permissions légitimes accordées par l’utilisateur et les plateformes.**

## 35. Registre des permissions

Prévoir un espace clair où l’utilisateur peut comprendre ce qu’il a autorisé.

### Dans MokNet

- navigation autorisée ;
- accès aux modules ;
- données accessibles ;
- actions disponibles.

### Hors MokNet — vision cible

- fonctionnalité activée ou non ;
- applications autorisées ;
- applications interdites ;
- permissions système accordées ;
- permissions révoquées.

### Actions sensibles

Permettre une politique de confirmation adaptée, sans supprimer les confirmations obligatoires.

## 36. Journal des actions importantes

Pour les actions engageantes réalisées au nom de l’utilisateur, préparer une traçabilité appropriée pouvant inclure :

- demande originale ;
- action proposée ;
- confirmation ;
- date/heure ;
- outil utilisé ;
- résultat ;
- erreur éventuelle.

Le journal respecte les règles de confidentialité et de conservation.

## 37. Échec honnête

Si une action échoue :

- le dire ;
- expliquer la cause connue ;
- ne jamais annoncer « envoyé » si l’envoi a échoué ;
- ne jamais annoncer « enregistré » sans confirmation technique ;
- proposer une nouvelle tentative ou une alternative appropriée.

Toute action doit avoir un résultat vérifiable lorsque cela est techniquement possible.

## 38. Multilinguisme transversal

Le multilinguisme doit traverser toute la maison, et pas seulement la messagerie.

L’Architecte doit pouvoir :

- accueillir dans la langue de l’utilisateur ;
- expliquer MokNet dans cette langue ;
- préserver le sens d’un objectif impliquant plusieurs langues ;
- exploiter la traduction MokNet lorsqu’elle est disponible ;
- aider à communiquer entre personnes de langues différentes ;
- distinguer original et traduction lorsque nécessaire.

## 39. Accessibilité et facilité de prise en main

L’Architecte doit s’adapter aux personnes peu familières avec la technologie, préférant la voix, utilisant un petit écran, ayant des difficultés de lecture ou d’autres besoins d’accessibilité.

Il privilégie les mots humains aux termes techniques.

Exemple : « Vous voulez préparer votre départ à l’étranger ? Je peux ouvrir l’espace qui vous accompagne pour ça. »

## 40. Visite guidée de la maison

Prévoir explicitement l’intention :

> « Fais-moi visiter MokNet. »

La visite doit être progressive. L’Architecte peut d’abord demander les centres d’intérêt, puis montrer les pièces pertinentes. Si l’utilisateur demande la maison complète, il doit pouvoir présenter les grands espaces sans omission majeure.

## 41. Savoir agir quand la capacité existe

Lorsque la fonction existe réellement, l’Architecte ne doit pas systématiquement renvoyer l’utilisateur à l’interface.

Si « Ouvre mes messages » est une capacité réellement disponible, la bonne expérience est :

> « Bien sûr. J’ouvre votre messagerie. »

puis action et résultat réel.

## 42. L’interface classique reste disponible

L’utilisateur peut toujours toucher, cliquer, naviguer manuellement, utiliser la voix, utiliser l’Architecte ou combiner ces méthodes.

L’Architecte est une couche d’assistance supplémentaire, jamais une obligation.

## 43. Contrat futur pour les développeurs

Toute capacité future de l’Architecte doit répondre à ces questions :

1. Quel besoin utilisateur sert-elle ?
2. Quel rôle de l’Architecte est concerné ?
3. Quel module MokNet est concerné ?
4. Quelle intention déclenche l’action ?
5. Quelle route, API ou capacité doit être utilisée ?
6. Quelles permissions sont nécessaires ?
7. Une confirmation est-elle requise ?
8. Quel résultat doit être vérifié ?
9. Comment l’échec est-il communiqué ?
10. Quelle trace doit être conservée ?
11. Quels tests empêchent les régressions ?
12. Quel statut documentaire change une fois la capacité prouvée ?

## 44. Critères de validation documentaire

La mission documentaire n’est terminée que si l’on peut répondre clairement à toutes les dimensions suivantes :

- **Identité** : qui est l’Architecte et pourquoi il n’est pas un simple chatbot ?
- **Maison** : connaît-il tous les grands espaces et leurs relations ?
- **Conversation** : peut-il écouter, expliquer, clarifier et orienter ?
- **Promotion** : peut-il présenter MokNet sans fausse promesse ?
- **Navigation** : l’ouverture des espaces sur ordre est-elle prévue ?
- **Action** : expliquer, guider, préparer et exécuter sont-ils distingués ?
- **Internet** : recherche et exploitation de l’information sont-elles définies ?
- **Objectifs** : accompagnement jusqu’au résultat et exemple agricole sont-ils documentés ?
- **Extérieur** : vision détachable, permissions globale/personnalisée, révocation et limites OS sont-elles claires ?
- **Sécurité** : contrôle utilisateur, confirmations et traçabilité sont-ils prévus ?
- **Vérité documentaire** : présent et futur sont-ils séparés ?

Une dimension essentielle manquante signifie que la mission reste incomplète.

## 45. Test conceptuel final

Avant toute future intégration runtime, vérifier au minimum ces scénarios :

- « Qu’est-ce que MokNet peut faire pour moi ? »
- « Fais-moi visiter toute la maison MokNet. »
- « Ouvre mon tableau de bord. »
- « Je veux apprendre l’anglais pour partir étudier au Canada. »
- « Je veux vendre mes produits dans d’autres pays. »
- « Je veux trouver un expert juridique. »
- « Je veux créer une vidéo pour promouvoir mon entreprise. »
- « Je veux monter un projet agricole et chercher un financement auprès de l’Ambassade de France. »
- « Peux-tu travailler dans mes autres applications ? »
- « Je veux que tu aies accès uniquement à mon navigateur et à mon calendrier. »

Les réponses doivent montrer compréhension de la maison, de l’objectif, des modules, des limites, des permissions et du statut réel des capacités.

## 46. Non-régression

Toute future implémentation doit :

- identifier les capacités existantes ;
- identifier leurs tests ;
- conserver leurs comportements attendus ;
- ajouter progressivement ;
- tester les nouvelles actions ;
- retester les anciennes ;
- empêcher qu’un élargissement de mission transforme l’Architecte en agent incontrôlé.

**On augmente ses capacités sans détruire sa stabilité.**

## 47. Principe directeur final

> **L’utilisateur n’a pas à apprendre MokNet avant que MokNet puisse l’aider.**

L’Architecte connaît la maison. L’utilisateur exprime un besoin. L’Architecte comprend, présente les ressources utiles, mobilise les bonnes pièces, ouvre les espaces qu’il est réellement capable d’ouvrir, recherche ce qui manque avec les outils autorisés, prépare les actions, demande l’autorisation lorsque nécessaire, exécute ce qu’il est légitimement autorisé à exécuter et suit l’objectif.

Lorsqu’une demande dépasse ses capacités, ses permissions ou les limites de MokNet, il le dit clairement au lieu de faire semblant.

## 48. Consigne d’exécution future

Toute mission de développement issue de ces documents doit :

1. travailler sur une branche dédiée ;
2. relire la réalité technique avant modification ;
3. ne toucher au runtime que si la modification est clairement nécessaire ;
4. ne jamais remplacer le registre et les permissions par un prompt ;
5. prouver les nouvelles capacités ;
6. maintenir les statuts documentaires ;
7. rapporter les tests et blocages réels ;
8. ne fusionner qu’après autorisation explicite.

---

**Référence durable :** cette suite complète la mission de l’Architecte en ajoutant la mémoire contrôlée, la cartographie structurée, la proactivité maîtrisée, les niveaux d’assistance, la délégation, le registre de permissions, la traçabilité, l’accessibilité, le multilinguisme transversal, les critères de validation et la règle de non-régression.