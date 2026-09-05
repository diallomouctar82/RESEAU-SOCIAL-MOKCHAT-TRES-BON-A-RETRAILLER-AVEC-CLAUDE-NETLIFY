/**
 * LA VERSION QUE CE CODE DÉCLARE ÊTRE.
 *
 * Source de vérité unique, lue par trois consommateurs :
 *   - le registre des versions stables (`stableVersions.ts`), dont l'entrée la
 *     plus récente doit porter exactement cette valeur (test `stableVersions`) ;
 *   - le build Vite (`vite-plugins/versionJson.ts`), qui l'écrit dans
 *     `/version.json` avec le commit et l'identifiant de déploiement Netlify ;
 *   - l'application elle-même (`__MOKNET_BUILD__`), pour dire à l'Admin
 *     Général quelle version SON onglet exécute et laquelle le serveur SERT.
 *
 * Règle (production contrôlée, § 7.2) : toute mission qui livre du code
 * ajoute son entrée au registre ET avance cette constante, dans la même PR.
 * Sans import, sans dépendance : ce fichier doit rester lisible par la
 * configuration Vite (Node) comme par le navigateur.
 */
export const VERSION_DU_CODE = 'v6.45.0';
