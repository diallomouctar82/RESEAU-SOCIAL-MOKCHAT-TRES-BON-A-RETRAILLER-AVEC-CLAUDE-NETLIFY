# Architecte MokNet — point d’entrée unique

L’Architecte **existe déjà**. Toute évolution doit partir de ce point d’entrée et lire les documents ci-dessous dans l’ordre.

## 1. Réalité technique — ce qui existe réellement

[`ARCHITECTE.md`](./ARCHITECTE.md)

Source documentaire de la réalité actuelle : architecture du sous-système, capacités exécutables, permissions, garde-fous, statuts d’exécution et tests.

Pour savoir **ce que l’Architecte peut réellement faire aujourd’hui**, commencer ici.

## 2. Guide de toute la maison MokNet

[`ARCHITECTE_GUIDE_MAISON_MOKNET.md`](./ARCHITECTE_GUIDE_MAISON_MOKNET.md)

Définit la posture d’accueil et la connaissance des pièces de MokNet : réseau social, messagerie, LIVE, Reels, Campus, langues, carrière, santé, habitat, finance/Wallet, démarches, droit, mobilité/expatriation, Studio, Marché mondial, tribus, Experts IA, Conseils de SAGE, tableau de bord, paramètres, sécurité et leurs relations.

Pour savoir **comment l’Architecte doit accueillir, expliquer et orienter**, lire ce guide.

## 3. Mission complète et trajectoire

[`ARCHITECTE_MISSION_COMPLETE_ET_TRAJECTOIRE.md`](./ARCHITECTE_MISSION_COMPLETE_ET_TRAJECTOIRE.md)

Définit le modèle mental complet :

- MokNet vient vers l’utilisateur ;
- agent conversationnel ;
- agent d’accueil ;
- guide de la maison ;
- agent promotionnel sans fausse promesse ;
- navigation et action internes ;
- recherche et exploitation de l’information ;
- agent d’objectif ;
- orchestration entre plusieurs pièces ;
- exemple complet agriculture/financement ;
- vision d’Architecte détachable ;
- permissions externes globales/personnalisées ;
- consentement, révocation, confirmations et contrôle utilisateur ;
- contrat d’intégration future dans le runtime.

Pour savoir **vers quoi l’Architecte doit évoluer sans être recréé**, lire ce document.

## 4. Suite validation, exécution future et mémoire

[`ARCHITECTE_SUITE_VALIDATION_EXECUTION_MEMOIRE.md`](./ARCHITECTE_SUITE_VALIDATION_EXECUTION_MEMOIRE.md)

Complète la trajectoire avec :

- connaissance de l’état réel de chaque module ;
- cartographie structurée de la maison ;
- distinction information/navigation/action/objectif ;
- mémoire contrôlée des objectifs ;
- états de suivi d’objectif ;
- proactivité non intrusive ;
- modes discret, guidé et accompagnement renforcé ;
- passage de relais vers experts ou professionnels ;
- réalisme des permissions Android/iOS/macOS/Windows ;
- registre de permissions ;
- journal des actions importantes ;
- échec honnête et résultat vérifiable ;
- multilinguisme transversal ;
- accessibilité ;
- visite guidée de MokNet ;
- contrat développeur ;
- critères de validation conceptuelle ;
- test conceptuel final ;
- règle de non-régression.

Pour savoir **comment transformer la vision en futures capacités testables, traçables et sûres**, lire cette suite.

## 5. Matrice de statuts

[`ARCHITECTE_STATUTS_CAPACITES.md`](./ARCHITECTE_STATUTS_CAPACITES.md)

Sépare explicitement :

- **EXISTANT / PRODUCTION** ;
- **PR / NON FUSIONNÉ** ;
- **PARTIEL** ;
- **SPÉCIFIÉ / À DÉVELOPPER** ;
- **VISION CIBLE**.

Pour savoir **si une promesse est réellement disponible ou seulement prévue**, consulter cette matrice puis vérifier le code.

## 6. La vraie “tête” runtime

La logique d’exécution actuelle n’est pas dans cette documentation. Elle est dans le code, principalement :

- `services/architecte/architecteBrain.ts` — cerveau partagé par les incarnations voix et clavier ;
- `services/architecte/capabilityRegistry.ts` — catalogue de capacités ;
- `services/architecte/capabilityBus.ts` — exécution réelle et contexte de permissions ;
- `services/architecte/architecteSession.ts` — continuité de session ;
- `services/architecte/consentFlow.ts` — consentements existants ;
- registres/handlers de domaine — actions réelles.

**Ne jamais remplacer aveuglément le prompt ou le cerveau runtime par le contenu d’un document conceptuel.** Toute modification de cette tête doit être une mission de développement séparée avec tests de non-régression.

## 7. Règle d’autorité

En cas de conflit :

1. la réalité du code et des permissions gagne ;
2. `ARCHITECTE.md` décrit cette réalité ;
3. la matrice indique son statut ;
4. le guide indique comment la présenter ;
5. la mission complète indique la trajectoire ;
6. la suite validation/mémoire précise comment cette trajectoire devra être rendue exploitable et sûre.

Une idée future ne doit jamais être présentée comme une fonction disponible.

## 8. Règle de maintenance

Quand une capacité importante est ajoutée :

1. elle est implantée dans sa source de vérité ;
2. elle reçoit les permissions et confirmations nécessaires ;
3. elle est testée ;
4. `ARCHITECTE.md` est mis à jour ;
5. son statut est mis à jour dans la matrice ;
6. le guide est ajusté si elle change l’accueil ou l’orientation ;
7. la mission/trajectoire est ajustée si elle change la vision d’ensemble ;
8. la suite validation/mémoire est ajustée si elle change le suivi, les permissions, la traçabilité, l’accessibilité ou les critères de preuve.

Ce fichier est la **boussole permanente** des développeurs humains, agents IA et futurs repreneurs du projet.