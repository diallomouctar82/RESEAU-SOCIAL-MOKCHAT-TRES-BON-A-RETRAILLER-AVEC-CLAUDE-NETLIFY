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
| Navigation vocale vers toute la maison telle que définie dans le guide | PARTIEL | Plusieurs destinations sont déjà cartographiées, mais la couverture complète et les aliases restent à valider/implémenter. |

## 3. Connaissance et accueil de toute la maison

| Capacité | Statut | Remarque |
|---|---|---|
| Documentation complète des pièces MokNet | EXISTANT / PRODUCTION côté documentation | `ARCHITECTE_GUIDE_MAISON_MOKNET.md` + mission complète. Ce statut ne signifie pas que le runtime injecte toute cette connaissance à chaque tour. |
| Explication de MokNet en cinq minutes adaptée au besoin | PARTIEL | L’accueil existe, mais la visite complète personnalisée nécessite des tests/runtime supplémentaires. |
| Visite complète « Fais-moi visiter MokNet » | SPÉCIFIÉ / À DÉVELOPPER | Intention et comportement attendus documentés dans la suite validation/mémoire. |
| Raisonnement transversal entre plusieurs pièces | SPÉCIFIÉ / À DÉVELOPPER | Modèle mental documenté ; implémentation runtime non régressive à concevoir. |
| Cartographie structurée module→route→rôle→actions→statut | SPÉCIFIÉ / À DÉVELOPPER | À concevoir à partir des sources de vérité existantes, sans dupliquer arbitrairement le registre. |
| Agent promotionnel de toute la maison | SPÉCIFIÉ / À DÉVELOPPER | Doit rester basé sur l’état réel et ne pas devenir un texte marketing hallucinatoire. |
| Multilinguisme transversal de l’Architecte | PARTIEL | Les briques linguistiques existent dans MokNet ; couverture intégrale de toute la maison à prouver. |
| Adaptation accessibilité / vocabulaire simplifié / usage vocal | PARTIEL | Voix et interfaces existent ; la couverture complète de la vision d’accessibilité reste à tester. |

## 4. Recherche et exploitation de l’information

| Capacité | Statut | Remarque |
|---|---|---|
| Détection de demande de recherche Internet | EXISTANT / PRODUCTION | Détection déterministe visible dans `architecteBrain.ts`. |
| Identité d’agent et mécanisme de droit pour recherche web | EXISTANT / PRODUCTION d’après le code/documentation actuelle | Le cerveau documente le grant via l’orchestrateur existant. |
| Transformer une recherche en accompagnement d’objectif long | PARTIEL | La recherche existe ; la boucle objectif→suivi complet est une extension. |

## 5. Agent d’objectif et mémoire

| Capacité | Statut | Remarque |
|---|---|---|
| Comprendre qu’une demande peut être un objectif multi-étapes | SPÉCIFIÉ / À DÉVELOPPER | Formalisé dans la mission complète. |
| Distinguer information / navigation / action / objectif | SPÉCIFIÉ / À DÉVELOPPER | Contrat fonctionnel documenté ; les intentions existantes ne couvrent pas encore cette vision complète. |
| Construire un plan transversal | SPÉCIFIÉ / À DÉVELOPPER | À intégrer au runtime avec limites et tests. |
| États persistants d’objectif (clarifié, en cours, attente tiers, réussi, etc.) | VISION CIBLE | Nomenclature indicative ; nécessite modèle de données et orchestration. |
| Mémoire durable et consentie d’un objectif | VISION CIBLE | La session existe, mais la mémoire long terme contrôlée décrite dans la vision n’est pas démontrée. |
| Proactivité non intrusive liée à un objectif | VISION CIBLE | Nécessite préférences, notifications, règles de fréquence et consentement. |
| Modes discret / guidé / accompagnement renforcé | VISION CIBLE | Niveaux d’assistance documentés, non revendiqués comme implémentés. |
| Suivre un objectif jusqu’au résultat/blocage | VISION CIBLE | Nécessite mémoire, état de progression, outils et permissions cohérents. |
| Exemple agriculture + financement | SPÉCIFIÉ / À DÉVELOPPER | Cas de référence documentaire, pas preuve d’automatisation existante. |

## 6. Documents et préparation d’actions

| Capacité | Statut | Remarque |
|---|---|---|
| Extraction de certains documents | EXISTANT / PRODUCTION | Décrit dans `ARCHITECTE.md` avec tests réels. |
| Construction de livrables documentaires couverts | EXISTANT / PRODUCTION | `deliverableBuilder.ts` et tests mentionnés. |
| Préparer des documents dans une démarche d’objectif | PARTIEL | Briques existent ; orchestration complète multi-étapes à développer. |

## 7. Délégation et passage de relais

| Capacité | Statut | Remarque |
|---|---|---|
| Orienter vers Experts IA | PARTIEL | Navigation/experts existent, mais la délégation structurée avec retour au fil d’objectif reste à développer. |
| Passer le relais à un professionnel humain ou source officielle tout en gardant le contexte | VISION CIBLE | Nécessite mémoire d’objectif, règles de confidentialité et connecteurs adaptés. |

## 8. Vision détachable et actions hors MokNet

| Capacité | Statut | Remarque |
|---|---|---|
| Architecte détachable hors écran MokNet | VISION CIBLE | Widget/raccourci/extension/overlay selon OS, non revendiqué comme existant. |
| Autorisation externe globale | VISION CIBLE | Doit être explicite, visible, révocable. |
| Autorisation externe application par application | VISION CIBLE | Nécessite architecture de permissions dédiée. |
| Registre utilisateur des permissions externes | VISION CIBLE | Doit indiquer applications autorisées/interdites, permissions système et révocations. |
| Action dans Gmail/calendrier/navigateur/autres apps | VISION CIBLE | Aucune capacité sans connecteur, permission et action réelle. |
| Révocation des permissions externes | VISION CIBLE | Exigence obligatoire avant activation de l’action externe. |
| Journal des actions externes sensibles | VISION CIBLE | Demande originale, confirmation, outil, heure, résultat et erreur selon conservation applicable. |
| Respect des limitations Android/iOS/macOS/Windows et API tierces | SPÉCIFIÉ / À DÉVELOPPER | Exigence architecturale : aucune stratégie normale de contournement des protections. |

## 9. Niveaux d’action obligatoires

Chaque fonction future doit annoncer explicitement son niveau :

1. **EXPLIQUER** — information seulement ;
2. **GUIDER** — indiquer les étapes / naviguer si possible ;
3. **PRÉPARER** — fabriquer un contenu ou plan sans l’envoyer ;
4. **PROPOSER L’ACTION** — action prête, attente de validation ;
5. **EXÉCUTER** — capacité technique + permissions + confirmations satisfaites.

Une phrase du modèle ne peut jamais faire passer une action du niveau 3 au niveau 5.

## 10. Actions toujours sensibles dans la vision externe

Même si une permission externe globale existe un jour, publication publique, envoi engageant, suppression, achat, transfert d’argent, contrat, donnée sensible, mot de passe, nouvelle permission ou action difficilement réversible doivent conserver une confirmation spécifique appropriée.

## 11. Critères de preuve futurs

Une capacité ne peut passer à **EXISTANT / PRODUCTION** qu’après preuve de :

- intention comprise ;
- route/API/capacité réelle ;
- permissions ;
- confirmation lorsque requise ;
- résultat vérifié ;
- communication honnête de l’échec ;
- journal adapté lorsque nécessaire ;
- tests de non-régression ;
- mise à jour documentaire.

## 12. Règle pour les futurs développeurs

Avant toute modification runtime :

1. partir de `ARCHITECTE_REFERENCE.md` ;
2. lire la suite validation/mémoire ;
3. vérifier le statut ici ;
4. vérifier le code et les tests ;
5. ne jamais implémenter une vision comme si elle était déjà un droit accordé ;
6. mettre à jour ce tableau uniquement après preuve technique.
