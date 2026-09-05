/**
 * `version.json` — la carte d'identité du déploiement servi.
 *
 * Constaté le 05/09/2026 : pour savoir quelle version `moknet.net` sert
 * vraiment, il fallait comparer le nom du bundle (`index-XXXX.js`) à la
 * mémoire vivante — un nom qui change à chaque construction, y compris pour
 * une documentation seule. Ce plugin écrit, à côté du bundle, un petit fichier
 * lisible par l'application (`/version.json`, relu sans cache) qui dit :
 * la version que le code déclare, le commit construit, l'identifiant du
 * déploiement Netlify, la branche, le contexte, l'heure de construction et
 * le bundle d'entrée. L'onglet Super-Admin « Versions stables » s'en sert
 * pour identifier la version réellement servie et vérifier une restauration.
 *
 * Variables lues (toutes optionnelles) : `COMMIT_REF`, `DEPLOY_ID`, `BRANCH`,
 * `CONTEXT` — posées par Netlify au build ; ailleurs (CI, poste local), le
 * commit est relevé par `git rev-parse HEAD` quand Git est disponible, sinon
 * `null`. Rien n'est inventé : une valeur inconnue reste `null`.
 *
 * Aucun secret n'entre ici : un commit et un identifiant de déploiement sont
 * déjà publics (dépôt public, adresses d'aperçu Netlify).
 */
import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';

export interface VersionJson {
    /** Version déclarée par le code (`VERSION_DU_CODE`). */
    version: string;
    /** Commit construit (SHA complet), `null` si inconnu. */
    commit: string | null;
    /** Identifiant du déploiement Netlify, `null` hors Netlify. */
    deployId: string | null;
    /** Branche construite, `null` si inconnue. */
    branche: string | null;
    /** Contexte Netlify : `production`, `deploy-preview`, `branch-deploy` ; `null` ailleurs. */
    contexte: string | null;
    /** Heure de construction, ISO 8601 UTC. */
    construitLe: string;
    /** Chemin du bundle d'entrée (`/assets/index-XXXX.js`), `null` si inconnu. */
    bundle: string | null;
}

export type EnvironnementBuild = Record<string, string | undefined>;

function nonVide(valeur: string | undefined): string | null {
    const v = (valeur ?? '').trim();
    return v.length > 0 ? v : null;
}

/** Commit relevé par Git quand l'environnement ne le fournit pas ; `null` sans Git. */
export function commitDepuisGit(executer: (commande: string) => string = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString()): string | null {
    try {
        const sha = executer('git rev-parse HEAD').trim();
        return /^[0-9a-f]{40}$/i.test(sha) ? sha : null;
    } catch {
        return null;
    }
}

/** Fonction pure : construit le contenu de `version.json` à partir de l'environnement. */
export function construireVersionJson(
    version: string,
    env: EnvironnementBuild,
    maintenant: Date,
    bundle: string | null,
    commitDeSecours: () => string | null = commitDepuisGit,
): VersionJson {
    return {
        version,
        commit: nonVide(env.COMMIT_REF) ?? commitDeSecours(),
        deployId: nonVide(env.DEPLOY_ID),
        branche: nonVide(env.BRANCH),
        contexte: nonVide(env.CONTEXT),
        construitLe: maintenant.toISOString(),
        bundle,
    };
}

/** Vrai pour le fragment d'entrée de l'application (`assets/index-XXXX.js`). */
export function estBundleDEntree(nomFichier: string, estEntree: boolean): boolean {
    return estEntree && /^assets\/index-[^/]+\.js$/.test(nomFichier);
}

/** Plugin Vite : émet `version.json` à la racine du build. */
export function versionJsonPlugin(version: string, env: EnvironnementBuild = process.env): Plugin {
    return {
        name: 'moknet-version-json',
        apply: 'build',
        generateBundle(_options, bundle) {
            let entree: string | null = null;
            for (const [nom, sortie] of Object.entries(bundle)) {
                if (sortie.type === 'chunk' && estBundleDEntree(nom, sortie.isEntry)) {
                    entree = `/${nom}`;
                    break;
                }
            }
            const contenu = construireVersionJson(version, env, new Date(), entree);
            this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(contenu, null, 2) + '\n' });
        },
    };
}
