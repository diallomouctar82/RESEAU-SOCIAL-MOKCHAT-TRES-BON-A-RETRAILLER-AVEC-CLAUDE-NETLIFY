# Architecte MokNet — Statuts des capacités et trajectoire

Ce document empêche de confondre **réalité actuelle** et **vision**.

> Source technique principale : `docs/ARCHITECTE.md` + `services/architecte/*`.
>
> Règle : un statut ne devient jamais « EXISTANT » parce qu’il est écrit ici. Il doit être démontré par le code, les permissions et les tests.

## Légende

- **EXISTANT / PRODUCTION** : présent sur `main` et décrit comme réellement exécutable/testé.
- **PARTIEL** : une partie existe, mais la promesse complète de la vision n’est pas démontrée.
- **SPÉCIFIÉ / À DÉVELOPPER** : défini fonctionnellement, pas encore démontré comme capacité complète.
- **VISION CIBLE** : direction future.

## 1. Noyau Architecte

| Capacité | Statut | Référence / remarque |
|---|---|---|
| Un Architecte unique partagé voix + clavier | EXISTANT / PRODUCTION | `architecteBrain.ts` est le cerveau partagé décrit dans `ARCHITECTE.md`. |
| Identité stable | EXISTANT / PRODUCTION | Réponse d’identité déterministe dans `architecteBrain.ts`. |
| Accueil premier contact / utilisateur connu | EXISTANT / PRODUCTION | `buildArchitecteGreeting`. |
| Clarification d’un besoin vague | EXISTANT / PRODUCTION | Détection déterministe + réponse dédiée. |
| Continuité de session | EXISTANT / PRODUCTION | `architecteSession.ts`. |
| Catalogue de capacités | EXISTANT / PRODUCTION | `capabilityRegistry.ts`. |
| Exécution avec statuts réels | EXISTANT / PRODUCTION | `capabilityBus.ts`; statuts done/queued/failed/denied/unavailable/unknown documentés. |
| Permissions dans le code | EXISTANT / PRODUCTION | Principe explicitement documenté dans `ARCHITECTE.md`. |
| Confirmation selon risque | EXISTANT / PRODUCTION | Documenté et testé dans `ARCHITECTE.md`. |
| Absence de faux succès | EXISTANT / PRODUCTION | Principe fondamental existant. |

## 2. Capacités internes

| Domaine | Statut | Remarque |
|---|---|---|
| Tâches | EXISTANT / PRODUCTION | Capacités documentées comme exécutables partout. |
| Paramètres / appareil | EXISTANT / PRODUCTION | Capacités documentées comme exécutables partout avec limites honnêtes. |
| Contenu | EXISTANT / PRODUCTION | Capacités portées par l’écran social selon le registre. |
| Social | EXISTANT / PRODUCTION | Capacités portées par l’écran social selon le registre. |
| LIVE — commandes internes déjà enregistrées | EXISTANT / PRODUCTION | Les capacités documentées existent pendant un direct ; cela ne signifie pas que toute la vision LIVE future est terminée. |
| Recherche universelle interne | EXISTANT / PRODUCTION | Handler documenté dans `ARCHITECTE.md`. |
| Navigation vers les modules déjà cartographiés dans `NAVIGATION_MODULES` | EXISTANT / PRODUCTION | Liste runtime dans `architecteBrain.ts`. |
| Navigation vocale vers **toute** la maison telle que définie dans le guide | PARTIEL | Plusieurs destinations sont déjà cartographiées, mais la couverture complète et les aliases de toute la maison restent à valider/implémenter. |

## 3. Connaissance et accueil de toute la maison

| Capacité | Statut | Remarque |
|---|---|---|
| Documentation complète des pièces MokNet | EXISTANT / PRODUCTION côté documentation | `ARCHITECTE_GUIDE_MAISON_MOKNET.md` + mission complète. Ce statut ne signifie pas que le runtime injecte encore toute cette connaissance à chaque tour. |
| Explication de MokNet en cinq minutes adaptée au besoin | PARTIEL | L’accueil existe, mais la visite complète personnalisée décrite dans la vision nécessite des tests/runtime supplémentaires. |
| Raisonnement transversal entre plusieurs pièces | SPÉCIFIÉ / À DÉVELOPPER | Modèle mental documenté ; implémentation runtime déterministe/non régressive à concevoir. |
| Agent promotionnel de toute la maison | SPÉCIFIÉ / À DÉVELOPPER | Doit rester basé sur l’état réel et ne pas devenir un texte marketing hallucinatoire. |

## 4. Recherche et exploitation de l’information

| Capacité | Statut | Remarque |
|---|---|---|
| Détection de demande de recherche Internet | EXISTANT / PRODUCTION | Détection déterministe visible dans `architecteBrain.ts`. |
| Identité d’agent et mécanisme de droit pour recherche web | EXISTANT / PRODUCTION d’après le code/documentation actuelle | Le cerveau documente le grant via l’orchestrateur existant. |
| Transformer une recherche en accompagnement d’objectif long | PARTIEL | La recherche existe ; la boucle objectif→suivi complet est une extension. |

## 5. Agent d’objectif

| Capacité | Statut | Remarque |
|---|---|---|
| Comprendre qu’une demande peut être un objectif multi-étapes | SPÉCIFIÉ / À DÉVELOPPER | Formalisé dans la mission complète. |
| Construire un plan transversal | SPÉCIFIÉ / À DÉVELOPPER | À intégrer au runtime avec limites et tests. |
| Suivre un objectif jusqu’au résultat/blocage | VISION CIBLE | Nécessite mémoire, état de progression, outils et permissions cohérents. |
| Exemple agriculture + financement | SPÉCIFIÉ / À DÉVELOPPER | Cas de référence documentaire, pas preuve d’automatisation existante. |

## 6. Documents et préparation d’actions

| Capacité | Statut | Remarque |
|---|---|---|
| Extraction de certains documents | EXISTANT / PRODUCTION | Décrit dans `ARCHITECTE.md` avec tests réels. |
| Construction de livrables documentaires documentés | EXISTANT / PRODUCTION pour les formats couverts | `deliverableBuilder.ts` et tests mentionnés. |
| Préparer des documents dans une démarche d’objectif | PARTIEL | Briques existent ; orchestration complète multi-étapes à développer. |

## 7. Vision détachable et actions hors MokNet

| Capacité | Statut | Remarque |
|---|---|---|
| Architecte détachable hors écran MokNet | VISION CIBLE | Widget/raccourci/extension/overlay selon OS, non revendiqué comme existant. |
| Autorisation externe globale | VISION CIBLE | Doit être explicite, visible, révocable. |
| Autorisation externe application par application | VISION CIBLE | Nécessite architecture de permissions dédiée. |
| Action dans Gmail/calendrier/navigateur/autres apps | VISION CIBLE | Aucune capacité ne doit être revendiquée sans connecteur, permission et action réelle. |
| Révocation des permissions externes | VISION CIBLE | Exigence obligatoire avant activation de l’action externe. |
| Traçabilité des actions externes sensibles | VISION CIBLE | À concevoir avant exécution. |

## 8. Niveaux d’action obligatoires

Chaque fonction future doit annoncer explicitement son niveau :

1. **EXPLIQUER** — information seulement ;
2. **GUIDER** — indiquer les étapes / naviguer si possible ;
3. **PRÉPARER** — fabriquer un contenu ou plan sans l’envoyer ;
4. **PROPOSER L’ACTION** — action prête, attente de validation ;
5. **EXÉCUTER** — capacité technique + permissions + confirmations satisfaites.

Une phrase du modèle ne peut jamais faire passer une action du niveau 3 au niveau 5.

## 9. Actions toujours sensibles dans la vision externe

Même si un jour une permission externe globale existe, les actions suivantes doivent être conçues avec confirmation spécifique appropriée : publication publique, envoi engageant, suppression, achat, transfert d’argent, contrat, donnée sensible, mot de passe, nouvelle permission ou autre action difficilement réversible.

## 10. Règle pour les futurs développeurs

Avant toute modification runtime :

1. partir de `ARCHITECTE_REFERENCE.md` ;
2. vérifier le statut ici ;
3. vérifier le code et les tests ;
4. ne jamais implémenter une vision comme si elle était déjà un droit accordé ;
5. mettre à jour ce tableau uniquement après preuve technique.