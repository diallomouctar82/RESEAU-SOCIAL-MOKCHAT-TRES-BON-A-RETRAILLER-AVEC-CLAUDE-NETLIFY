/**
 * Veille de nouvelle version.
 *
 * Constaté le 05/09/2026, en production : la Direction ne voyait pas un
 * onglet pourtant servi par moknet.net depuis deux déploiements. Sa capture
 * portait encore une pastille de version retirée du code la veille. Cause :
 * une application à page unique restée ouverte (onglet, fenêtre installée)
 * garde son JavaScript jusqu'au prochain rechargement complet — et RIEN ne
 * lui disait qu'une version plus récente existait. `registerPwaServiceWorker`
 * enregistre le worker et s'arrête là.
 *
 * Principe : comparer le bundle que la page EXÉCUTE (la balise
 * `<script type="module" src="/assets/index-XXXX.js">` de son propre
 * document) au bundle que le serveur SERT MAINTENANT (le même document,
 * relu sans cache). S'ils diffèrent, une nouvelle version est en ligne.
 *
 * Pourquoi cette méthode et pas `updatefound` du service worker : le worker
 * ne se réinstalle que si `sw.js` change d'octets, ce qui n'arrive pas à
 * chaque déploiement. Le nom du bundle, lui, change à CHAQUE construction —
 * c'est le signal fiable.
 *
 * Ce module ne recharge jamais la page de lui-même : un rechargement
 * imposé pendant un appel ou une saisie serait une régression. Il prévient ;
 * la personne décide.
 */

const ENTRY_RE = /<script[^>]+src="(\/assets\/index-[^"]+\.js)"/;

/** Extrait le chemin du bundle d'entrée d'un document HTML. `null` s'il n'y en a pas. */
export function extractEntryBundle(html: string): string | null {
    const m = ENTRY_RE.exec(html ?? '');
    return m ? m[1] : null;
}

/**
 * Le bundle que CETTE page exécute. `null` hors navigateur ou en
 * développement (Vite sert `/index.tsx`, pas un bundle) — la veille reste
 * alors muette, ce qui est le comportement voulu.
 */
export function runningEntryBundle(doc: Document | null = typeof document !== 'undefined' ? document : null): string | null {
    if (!doc) return null;
    const s = doc.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]');
    if (!s) return null;
    try {
        return new URL(s.getAttribute('src') ?? '', doc.baseURI).pathname;
    } catch {
        return s.getAttribute('src');
    }
}

/** Le bundle que le serveur sert MAINTENANT. `null` si injoignable ou illisible. */
export async function fetchServedEntryBundle(fetchImpl: typeof fetch = fetch): Promise<string | null> {
    try {
        const res = await fetchImpl('/', { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) return null;
        return extractEntryBundle(await res.text());
    } catch {
        return null;
    }
}

/** Vrai seulement quand les DEUX sont connus et diffèrent : jamais d'alerte sur une inconnue. */
export function isNewVersionAvailable(running: string | null, served: string | null): boolean {
    return Boolean(running && served && running !== served);
}

export interface UpdateWatchOptions {
    /** Ne pas revérifier plus souvent que ceci (ms). */
    minIntervalMs?: number;
    /** Vérification périodique tant que la page est visible (ms). */
    periodMs?: number;
    /** Première vérification après ce délai (ms), pour ne pas concurrencer le démarrage. */
    initialDelayMs?: number;
    fetchImpl?: typeof fetch;
    doc?: Document;
    win?: Window;
}

/**
 * Démarre la veille. `onAvailable` est appelé UNE seule fois, avec le chemin
 * du nouveau bundle. Renvoie une fonction d'arrêt.
 *
 * Moments de vérification : après un court délai au démarrage, quand la page
 * redevient visible (c'est LE cas de l'onglet qu'on retrouve), quand la
 * fenêtre reprend le focus, et périodiquement tant qu'elle est visible.
 */
export function startUpdateWatch(
    onAvailable: (servedBundle: string) => void,
    opts: UpdateWatchOptions = {},
): () => void {
    const {
        minIntervalMs = 60_000,
        periodMs = 10 * 60_000,
        initialDelayMs = 15_000,
        fetchImpl = fetch,
        doc = typeof document !== 'undefined' ? document : undefined,
        win = typeof window !== 'undefined' ? window : undefined,
    } = opts;
    if (!doc || !win) return () => {};

    const running = runningEntryBundle(doc);
    if (!running) return () => {};           // développement ou document inattendu : rien à surveiller

    let stopped = false;
    let announced = false;
    let lastCheck = 0;
    let inFlight = false;

    const check = async (force = false) => {
        if (stopped || announced || inFlight) return;
        const now = Date.now();
        if (!force && now - lastCheck < minIntervalMs) return;
        lastCheck = now;
        inFlight = true;
        try {
            const served = await fetchServedEntryBundle(fetchImpl);
            if (!stopped && !announced && isNewVersionAvailable(running, served)) {
                announced = true;
                onAvailable(served as string);
            }
        } finally {
            inFlight = false;
        }
    };

    const onVisible = () => { if (doc.visibilityState === 'visible') void check(); };
    const onFocus = () => { void check(); };

    const initial = win.setTimeout(() => { void check(true); }, initialDelayMs);
    const period = win.setInterval(() => { if (doc.visibilityState === 'visible') void check(); }, periodMs);
    doc.addEventListener('visibilitychange', onVisible);
    win.addEventListener('focus', onFocus);

    return () => {
        stopped = true;
        win.clearTimeout(initial);
        win.clearInterval(period);
        doc.removeEventListener('visibilitychange', onVisible);
        win.removeEventListener('focus', onFocus);
    };
}
