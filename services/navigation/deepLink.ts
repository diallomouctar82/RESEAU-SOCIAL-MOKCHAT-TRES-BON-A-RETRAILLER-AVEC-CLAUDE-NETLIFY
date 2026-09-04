// Lien profond — ouvrir un écran précis depuis une URL.
//
// L'application écrivait déjà le hash à chaque changement d'onglet
// (Équipe I / LOOP I4, navigation avant/arrière), mais ne l'a JAMAIS relu au
// démarrage : `activeTab` partait toujours de 'social'. Conséquence mesurée
// le 04/09/2026 : aucune URL ne pouvait ouvrir un écran donné, et une
// consigne du type « ouvrez #super-admin » était intenable pour la personne
// à qui on la donnait.
//
// Forme retenue : `#onglet` ou `#onglet/sous-onglet`.
//   #super-admin        → console Super Admin, onglet par défaut
//   #super-admin/sante  → console Super Admin, onglet « Santé Globale »
//
// DEUX PRÉCAUTIONS, chacune pour un défaut réel :
//
// 1. Le hash est capturé UNE SEULE FOIS, à l'import du module — donc avant
//    que l'effet d'historique de App.tsx ne réécrive `#onglet` et n'efface le
//    sous-onglet. Lire `window.location.hash` plus tard dans le cycle de vie
//    d'un composant donnerait un résultat dépendant de l'ordre de montage.
//
// 2. Les hash d'authentification Supabase (#access_token…, #type=recovery)
//    sont ignorés : ce ne sont pas des routes, et supabase-js les consomme
//    puis les nettoie. Les interpréter comme un onglet enverrait la personne
//    sur un écran vide au retour d'un lien de connexion.

/** Fragments propres à l'authentification : jamais une route applicative. */
const AUTH_HASH = /access_token|refresh_token|provider_token|type=recovery|error_description/i;

export interface DeepLinkRoute {
    /** Onglet applicatif demandé, ex. `super-admin`. */
    tab: string;
    /** Sous-onglet éventuel, ex. `sante`. Chaîne vide s'il n'y en a pas. */
    sub: string;
}

/**
 * Analyse un hash. Renvoie `null` quand il n'y a pas de route exploitable —
 * hash vide, ou fragment d'authentification.
 */
export function parseDeepLink(hash: string): DeepLinkRoute | null {
    const raw = (hash ?? '').replace(/^#/, '').trim();
    if (!raw || AUTH_HASH.test(raw)) return null;

    const [tab, ...rest] = raw.split('/');
    if (!tab) return null;
    return { tab, sub: rest.join('/') };
}

/**
 * Route demandée à l'ouverture de la page, figée au chargement du module.
 * `null` hors navigateur (tests Node) ou sans hash exploitable.
 */
export const INITIAL_DEEP_LINK: DeepLinkRoute | null =
    typeof window !== 'undefined' ? parseDeepLink(window.location.hash) : null;

/**
 * Onglet de départ : la route demandée si elle désigne un onglet CONNU,
 * sinon le défaut. La liste blanche est indispensable — un onglet inconnu ne
 * correspond à aucun rendu et laisserait l'écran vide, exactement le défaut
 * que le gestionnaire `popstate` d'App.tsx évite déjà de son côté.
 */
export function initialTab(allowed: ReadonlySet<string>, fallback: string): string {
    const route = INITIAL_DEEP_LINK;
    return route && allowed.has(route.tab) ? route.tab : fallback;
}

/**
 * Sous-onglet demandé pour un onglet donné, ou `null`. Sert aux écrans à
 * onglets internes (console Super Admin) pour s'ouvrir au bon endroit.
 */
export function initialSubTab(tab: string): string | null {
    const route = INITIAL_DEEP_LINK;
    if (!route || route.tab !== tab || !route.sub) return null;
    return route.sub;
}
