/**
 * Identité de la version affichée à l'écran.
 *
 * Un tableau de bord d'administration doit pouvoir répondre à une question
 * bête et vitale : « est-ce que je regarde la production, ou un essai ? »
 * Tant que le bandeau affichait une chaîne écrite en dur, la réponse était
 * la même partout — et une fonctionnalité livrée dans un aperçu pouvait être
 * déclarée « invisible » alors qu'elle était simplement ailleurs.
 *
 * Les valeurs viennent du constructeur (Netlify), gelées dans le bundle par
 * `vite.config.ts`. Aucune n'est devinée : ce qui manque est dit manquant.
 */

export interface BuildIdentity {
    /** `production` | `deploy-preview` | `branch-deploy`, ou null hors Netlify. */
    contexte: string | null;
    /** SHA complet du commit construit, ou null. */
    commit: string | null;
    branche: string | null;
    /** Numéro de la pull request, pour un aperçu. */
    pr: string | null;
    construitLe: string;
}

const VIDE: BuildIdentity = {
    contexte: null, commit: null, branche: null, pr: null, construitLe: '',
};

declare const __MOK_BUILD__: BuildIdentity | undefined;

/**
 * `__MOK_BUILD__` n'existe pas sous vitest (qui ne passe pas par la config
 * Vite de l'application) : le `typeof` évite un ReferenceError qui ferait
 * tomber tout écran l'important.
 */
export const BUILD: BuildIdentity =
    typeof __MOK_BUILD__ !== 'undefined' && __MOK_BUILD__ ? __MOK_BUILD__ : VIDE;

export type BuildKind = 'production' | 'apercu' | 'branche' | 'local' | 'inconnu';

export function buildKind(b: BuildIdentity = BUILD): BuildKind {
    if (!b.contexte) return 'local';
    if (b.contexte === 'production') return 'production';
    if (b.contexte === 'deploy-preview') return 'apercu';
    if (b.contexte === 'branch-deploy') return 'branche';
    return 'inconnu';
}

/** Sept caractères de SHA : assez pour identifier, assez court pour être lu. */
export function shortCommit(b: BuildIdentity = BUILD): string | null {
    return b.commit && b.commit.length >= 7 ? b.commit.slice(0, 7) : b.commit || null;
}

/**
 * Le libellé montré dans le bandeau. Nomme ce que la personne reconnaît
 * (« Production », « Aperçu PR #70 »), pas la mécanique du constructeur.
 */
export function buildLabel(b: BuildIdentity = BUILD): string {
    const sha = shortCommit(b);
    const suffixe = sha ? ` · ${sha}` : '';
    switch (buildKind(b)) {
        case 'production': return `Production${suffixe}`;
        case 'apercu':     return `Aperçu${b.pr ? ` PR #${b.pr}` : ''}${suffixe}`;
        case 'branche':    return `Branche ${b.branche ?? '?'}${suffixe}`;
        case 'local':      return 'Développement local';
        default:           return `${b.contexte}${suffixe}`;
    }
}

/**
 * Vrai dès qu'on n'est PAS en production : le bandeau doit alors se voir,
 * pour qu'un essai ne soit jamais confondu avec l'application réelle.
 */
export function isNonProduction(b: BuildIdentity = BUILD): boolean {
    return buildKind(b) !== 'production';
}
