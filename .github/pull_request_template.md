<!--
Gabarit imposé par ADR-0016 (Vision Smart AI Core) : une PR contient
objectif, périmètre, risques, tests, preuves et critères d'acceptation.
Remplir chaque section avec des faits vérifiables ; « non applicable » est
une réponse acceptable, une section vide ne l'est pas.
Ne jamais coller de clé, de jeton ni de contenu de `.env` ici.
-->

## Objectif
<!-- Le problème réel constaté (symptôme, cause racine prouvée) et ce que cette PR change pour l'utilisateur. -->

## Périmètre
<!-- Fichiers / modules / tables / fonctions Edge touchés. Ce qui est explicitement hors périmètre. -->

## Risques
<!-- Régressions possibles, données touchées, migrations, dépendances externes. Plan de retour arrière. -->

## Tests
<!-- Résultats chiffrés : `npx tsc --noEmit`, `npm test` (N/N), `npm run build`, tests réels (banc, base, navigateur). -->

## Preuves
<!-- Journaux, captures, requêtes de vérification en base, empreintes du bundle servi. Une affirmation sans preuve reproductible est un « NOT_RUN », pas un vert. -->

## Critères d'acceptation
- [ ] Green Gate CI vert sur ce SHA (typage, tests, build)
- [ ] Zéro régression sur l'existant (non-régression réelle, pas déclarée)
- [ ] Mémoire vivante à jour : `docs/JOURNAL_DECISIONS.md` (DEC), `docs/HISTORIQUE_VERSIONS.md`, `docs/ETAT_ACTUEL.md`, fiche module concernée
- [ ] Données de test supprimées zéro trace (comptes, journaux, lignes liées)
- [ ] Aucun secret dans le diff ni dans cette description
