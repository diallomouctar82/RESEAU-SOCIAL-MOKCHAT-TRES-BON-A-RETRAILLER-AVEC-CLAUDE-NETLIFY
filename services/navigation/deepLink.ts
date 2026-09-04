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

// ─── Survie du lien profond à la connexion OAuth ────────────────────────────
//
// Troisième défaut de la même famille. `signInWithOAuthProvider` renvoie vers
// `window.location.origin` : la connexion Google fait donc un aller-retour
// chez le fournisseur, et revient sur la RACINE, sans le hash. Quelqu'un qui
// ouvre `…/#super-admin/sante` puis se connecte avec Google atterrit sur
// l'onglet par défaut — il ne voit PAS l'écran qu'on lui a demandé de
// constater, alors même qu'il est sur la bonne version.
//
// On met donc la route de côté AVANT de partir, et on la reprend au retour.
// `sessionStorage` est le bon tiroir : il est propre à l'onglet du navigateur
// (l'aller-retour OAuth s'y déroule) et disparaît à sa fermeture.
//
// Limite assumée, dite plutôt que masquée : un lien de confirmation ouvert
// dans un AUTRE onglet ou un autre navigateur ne retrouvera rien. Ce cas
// retombe simplement sur l'onglet par défaut, sans erreur.

const MEMO_KEY = 'mok_lien_profond';
/** Au-delà, la route est périmée : elle ne doit pas rouvrir un écran des heures après. */
const MEMO_TTL_MS = 15 * 60 * 1000;

/**
 * Met la route courante de côté avant un départ vers un fournisseur externe.
 * Sans effet s'il n'y a pas de route, ou si le stockage est indisponible.
 */
export function rememberDeepLink(hash?: string): void {
    if (typeof window === 'undefined') return;
    const route = parseDeepLink(hash ?? window.location.hash);
    if (!route) return;
    try {
        sessionStorage.setItem(MEMO_KEY, JSON.stringify({ ...route, at: Date.now() }));
    } catch {
        // Stockage refusé (navigation privée stricte) : on perd la route,
        // jamais la connexion. Dégradation silencieuse acceptable.
    }
}

/**
 * Reprend la route mise de côté, et l'efface — elle ne doit servir qu'une
 * fois. Renvoie `null` si elle est absente, illisible ou périmée.
 */
export function consumeRememberedDeepLink(): DeepLinkRoute | null {
    if (typeof window === 'undefined') return null;
    let brut: string | null = null;
    try {
        brut = sessionStorage.getItem(MEMO_KEY);
        sessionStorage.removeItem(MEMO_KEY);
    } catch {
        return null;
    }
    if (!brut) return null;
    try {
        const v = JSON.parse(brut) as Partial<DeepLinkRoute> & { at?: number };
        if (typeof v.tab !== 'string' || !v.tab) return null;
        if (typeof v.at !== 'number' || Date.now() - v.at > MEMO_TTL_MS) return null;
        return { tab: v.tab, sub: typeof v.sub === 'string' ? v.sub : '' };
    } catch {
        return null;
    }
}

/**
 * Route demandée à l'ouverture de la page, figée au chargement du module.
 *
 * L'URL prime toujours : la route mise de côté ne sert que lorsque l'adresse
 * n'en porte aucune — c'est exactement le retour de connexion, où le hash est
 * soit vide, soit un fragment `#access_token…` que `parseDeepLink` écarte.
 *
 * `null` hors navigateur (tests Node) ou quand ni l'un ni l'autre n'existe.
 */
export const INITIAL_DEEP_LINK: DeepLinkRoute | null =
    typeof window !== 'undefined'
        ? parseDeepLink(window.location.hash) ?? consumeRememberedDeepLink()
        : null;

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
