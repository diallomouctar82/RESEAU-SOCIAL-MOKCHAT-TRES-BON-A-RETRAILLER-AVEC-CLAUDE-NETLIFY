// SAT-4 — SAVOIR SI LE TRANSPORT DU DIRECT EST RÉELLEMENT UTILISABLE.
//
// ─── LE PIÈGE QUE CE FICHIER EXISTE POUR ÉVITER ────────────────────────────
//
// `GET https://live.moknet.net/` répond **200**. Ce 200 ne prouve RIEN sur la
// capacité à ouvrir un direct : il dit seulement qu'un processus écoute
// derrière le reverse-proxy.
//
// Mesuré sur la PRODUCTION le 4 septembre 2026, trois appels à la suite :
//
//   GET  /                                    → 200   en 0,65 s
//   POST /twirp/…/ListRooms  jeton invalide   → 401   « invalid authorization token »
//   POST /twirp/…/ListRooms  jeton réel       → 200   {"rooms":[]}  en 0,41 s
//
// Le cas du milieu est le scénario réel à craindre : si la clé API divergeait
// (rotation faite sur le VPS sans mise à jour du Vault, ou l'inverse), le
// serveur resterait « vivant » — 200 sur `/` — et **plus aucun direct ne
// pourrait démarrer**, parce que l'émission du jeton passe par cette même
// API. Une surveillance fondée sur le ping afficherait vert pendant une panne
// totale du LIVE.
//
// D'où la règle de ce fichier : on ne juge JAMAIS sur `/`. On juge sur
// `ListRooms`, c'est-à-dire sur l'appel que la fonction `livekit-token` fait
// réellement pour laisser entrer quelqu'un. Ce que la sonde éprouve est
// exactement ce dont dépend un direct.
//
// ─── POURQUOI CE FICHIER NE FAIT AUCUN RÉSEAU ──────────────────────────────
//
// Même choix que `capacityGate.ts` et `nodeCapacity.ts` : la décision est
// séparée de l'appel, donc la suite de tests exécute CETTE règle-ci, telle
// quelle, au lieu d'en rejouer une imitation. Une règle qu'on ne peut pas
// exécuter n'est pas prouvée.

/**
 * Délai au-delà duquel la porte d'admission (SAT-2) cesse d'attendre et
 * laisse entrer sans vérifier — `ROOM_SERVICE_TIMEOUT_MS` dans
 * `livekit-token/index.ts`.
 *
 * Ce n'est donc pas un seuil de confort choisi au jugé : au-delà, la porte
 * est **effectivement aveugle**. Un transport qui répond plus lentement que
 * ça fonctionne encore, mais la protection contre la saturation, elle, ne
 * fonctionne plus. C'est exactement ce que « dégradé » doit vouloir dire.
 */
export const SEUIL_DEGRADE_MS = 1500;

/** Ce que la sonde a réellement observé. Aucun jugement à ce stade. */
export interface RawLiveTransportProbe {
    /** `false` si aucune réponse HTTP n'est arrivée (réseau, TLS, délai). */
    reached: boolean;
    /** Code HTTP reçu, ou `null` si rien n'est arrivé. */
    httpStatus: number | null;
    /** Corps déjà décodé quand la réponse était du JSON ; `null` sinon. */
    body: unknown;
    /** Durée mesurée de l'appel, en millisecondes. */
    latencyMs: number;
    /** `true` uniquement quand l'échec est une expiration de délai. */
    timedOut: boolean;
}

export type LiveTransportHealth =
    /** L'API répond, la liste des rooms est lisible, dans le budget. */
    | { status: 'operational'; latencyMs: number; rooms: number }
    /** Répond et reste correcte, mais trop lentement pour que la porte tienne. */
    | { status: 'degraded'; latencyMs: number; rooms: number }
    /**
     * Le serveur est joignable et **refuse pourtant de servir**. C'est le cas
     * dangereux : `/` répondrait 200, et aucun direct ne pourrait démarrer.
     */
    | { status: 'unusable'; reason: 'rejected' | 'server_error' | 'unreadable'; httpStatus: number }
    /** Rien n'est arrivé du tout. */
    | { status: 'unreachable'; reason: 'timeout' | 'network' }
    /** Aucune configuration de transport active : il n'y a rien à sonder. */
    | { status: 'unconfigured' };

/**
 * Vrai uniquement si le corps est une réponse `ListRooms` exploitable.
 *
 * Ce contrôle n'est pas cosmétique. Un reverse-proxy mal configuré rend
 * volontiers **200 avec une page HTML** ; une sonde qui se contenterait du
 * code HTTP annoncerait « opérationnel » sur une panne complète. On exige donc
 * la forme réelle du contrat twirp : un objet portant `rooms` en tableau.
 *
 * `{"rooms":[]}` — zéro direct en cours — est une réponse parfaitement SAINE :
 * c'est l'état normal d'un nœud au repos, jamais un signe de panne.
 */
export function isRoomListing(body: unknown): body is { rooms: unknown[] } {
    if (typeof body !== 'object' || body === null) return false;
    const rooms = (body as { rooms?: unknown }).rooms;
    return Array.isArray(rooms);
}

/**
 * Le verdict, à partir de ce qui a été observé.
 *
 * `configured: false` court-circuite tout : sans configuration active, il n'y
 * a pas de panne à annoncer — il n'y a simplement rien de branché, et le dire
 * autrement serait une fausse alerte.
 */
export function judgeLiveTransport(
    probe: RawLiveTransportProbe | null,
    options: { configured: boolean },
): LiveTransportHealth {
    if (!options.configured) return { status: 'unconfigured' };
    if (!probe || !probe.reached) {
        return { status: 'unreachable', reason: probe?.timedOut ? 'timeout' : 'network' };
    }

    const httpStatus = probe.httpStatus ?? 0;

    // 401/403 : le serveur vit, mais la clé n'ouvre plus rien. Mesuré en
    // production : « invalid authorization token ». C'est LE cas qu'un ping
    // sur `/` déclarerait vert.
    if (httpStatus === 401 || httpStatus === 403) {
        return { status: 'unusable', reason: 'rejected', httpStatus };
    }
    if (httpStatus >= 500) {
        return { status: 'unusable', reason: 'server_error', httpStatus };
    }
    if (httpStatus !== 200 || !isRoomListing(probe.body)) {
        // Tout le reste — 404 d'un proxy qui a perdu la route, 200 avec une
        // page HTML, corps illisible — se range ici plutôt que d'être pris
        // pour un succès.
        return { status: 'unusable', reason: 'unreadable', httpStatus };
    }

    const rooms = probe.body.rooms.length;
    return probe.latencyMs > SEUIL_DEGRADE_MS
        ? { status: 'degraded', latencyMs: probe.latencyMs, rooms }
        : { status: 'operational', latencyMs: probe.latencyMs, rooms };
}

/**
 * L'URL de l'API serveur (twirp), déduite de l'URL de transport.
 *
 * La configuration porte l'URL du média (`wss://live.moknet.net`) ; l'API
 * serveur vit sur le même hôte, en HTTP.
 *
 * Copie volontaire de `livekit-token/capacityGate.ts::toLiveKitHttpUrl` : une
 * fonction Edge ne peut pas importer le dossier d'une autre. La copie est
 * tenue par un test de PARITÉ qui exécute les deux implémentations sur les
 * mêmes entrées — si l'une dérive, la suite vire au rouge au lieu de laisser
 * la sonde interroger une autre adresse que la porte d'admission.
 */
export function toLiveKitApiUrl(serverUrl: string): string {
    const trimmed = (serverUrl ?? '').trim().replace(/\/+$/, '');
    if (trimmed.startsWith('wss://')) return `https://${trimmed.slice('wss://'.length)}`;
    if (trimmed.startsWith('ws://')) return `http://${trimmed.slice('ws://'.length)}`;
    return trimmed;
}

/** Le verdict traduit dans le vocabulaire du tableau de bord de santé. */
export interface LiveTransportVerdict {
    status: 'vert' | 'jaune' | 'orange' | 'rouge';
    measured: string;
    gap?: string;
    evidence?: Record<string, unknown>;
}

/**
 * Du verdict technique à la ligne de santé.
 *
 * `unconfigured` n'apparaît pas ici, et c'est délibéré : « rien n'est branché »
 * n'est pas une panne du transport, c'est une ABSENCE DE MESURE. L'appelant
 * doit donc la traiter en BLANC (non éprouvé) plutôt que de la faire passer
 * pour un constat — la ligne « Transport temps réel configuré » dit déjà, et
 * elle seule, si une configuration existe. Rendre `unconfigured` rouge ici
 * compterait le même défaut deux fois dans la note.
 */
export function liveTransportVerdict(
    health: Exclude<LiveTransportHealth, { status: 'unconfigured' }>,
): LiveTransportVerdict {
    switch (health.status) {
        case 'operational':
            return {
                status: 'vert',
                measured: describeLiveTransport(health),
                evidence: { latencyMs: health.latencyMs, rooms: health.rooms, seuilDegradeMs: SEUIL_DEGRADE_MS },
            };
        case 'degraded':
            return {
                status: 'orange',
                measured: describeLiveTransport(health),
                gap:
                    `L'API répond, mais au-delà de ${SEUIL_DEGRADE_MS} ms la porte d'admission cesse ` +
                    "d'attendre et laisse entrer sans vérifier : le direct fonctionne, la protection " +
                    'contre la saturation non.',
                evidence: { latencyMs: health.latencyMs, rooms: health.rooms, seuilDegradeMs: SEUIL_DEGRADE_MS },
            };
        case 'unusable':
            return {
                status: 'rouge',
                measured: describeLiveTransport(health),
                gap: health.reason === 'rejected'
                    ? "Le serveur vit et refuse nos identifiants : c'est le cas qu'un simple ping sur `/` " +
                      'déclarerait vert. Vérifier que la clé API du VPS et celle du coffre sont bien la même.'
                    : "Le serveur est joignable mais ne rend pas la liste des directs : aucun direct ne peut démarrer.",
                evidence: { httpStatus: health.httpStatus, reason: health.reason },
            };
        case 'unreachable':
            return {
                status: 'rouge',
                measured: describeLiveTransport(health),
                gap: health.reason === 'timeout'
                    ? "Aucune réponse dans le délai imparti : aucun direct ne peut démarrer."
                    : "Aucune réponse du tout : aucun direct ne peut démarrer.",
                evidence: { reason: health.reason },
            };
    }
}

/**
 * Une phrase pour un humain, sans jargon et sans jamais promettre plus que ce
 * qui a été observé.
 */
export function describeLiveTransport(health: LiveTransportHealth): string {
    switch (health.status) {
        case 'unconfigured':
            return "Aucun serveur de direct configuré pour cet environnement — rien n'a été sondé.";
        case 'unreachable':
            return health.reason === 'timeout'
                ? "Le serveur de direct n'a pas répondu dans le délai imparti."
                : "Le serveur de direct est injoignable.";
        case 'unusable':
            if (health.reason === 'rejected') {
                return `Le serveur de direct répond mais REFUSE nos identifiants (HTTP ${health.httpStatus}) : aucun direct ne peut démarrer.`;
            }
            if (health.reason === 'server_error') {
                return `Le serveur de direct est en erreur (HTTP ${health.httpStatus}) : aucun direct ne peut démarrer.`;
            }
            return `Le serveur de direct a répondu ${health.httpStatus} sans liste de directs exploitable : aucun direct ne peut démarrer.`;
        case 'degraded':
            return `Le serveur de direct répond en ${health.latencyMs} ms — au-delà des ${SEUIL_DEGRADE_MS} ms que la porte d'admission peut attendre : la protection contre la saturation ne s'applique plus. ${health.rooms} direct(s) en cours.`;
        case 'operational':
            return `Le serveur de direct répond en ${health.latencyMs} ms, ${health.rooms} direct(s) en cours.`;
    }
}
