// Gardien de santé MokNet — sondes de lecture et réparations contrôlées.
//
// Séquence imposée, sans raccourci possible :
//
//   DIAGNOSTIQUER → CONFIRMER → SAUVEGARDER → APPLIQUER → VÉRIFIER → JOURNALISER
//
// Ce que cette fonction ne fait JAMAIS :
//   • exécuter du SQL fourni par l'appelant — le seul paramètre d'une
//     réparation est une clé du catalogue fermé (migration health_guardian) ;
//   • appliquer une réparation sans sauvegarde — les deux vivent dans la même
//     transaction côté base, il est impossible d'obtenir l'une sans l'autre ;
//   • appliquer une réparation sans confirmation liée AU PÉRIMÈTRE EXACT
//     montré à la personne (voir le jeton signé plus bas) ;
//   • conclure sans re-mesurer — le verdict d'après action est renvoyé avec
//     le résultat, jamais déduit du succès de l'écriture.
//
// Rangs (contrôlés côté base, jamais ici) :
//   • lire / diagnostiquer → administrateur
//   • réparer / restaurer  → Admin Général (super_admin) uniquement

import { AccessToken, RoomServiceClient } from 'npm:livekit-server-sdk@2.18.0';
import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';
import { evaluateAll, ProbeOutcome, RawEdgeCorsMetrics, RawHttpProbe, RawMetrics, RawVpsMetrics } from './evaluate.ts';
import { SEUIL_DEGRADE_MS, type RawLiveTransportProbe, toLiveKitApiUrl } from './liveTransportProbe.ts';
import {
    apply as applyLiveEmergency,
    diagnose as diagnoseLiveEmergency,
    overview as liveEmergencyOverview,
    type EmergencyClaims,
    LIVE_EMERGENCY_JOURNAL_ACTION,
    LIVE_EMERGENCY_LINE_ID,
    type LiveEmergencyPorts,
    type LiveEmergencyRank,
    type LiveEmergencySession,
    type RoomObservation,
} from './liveEmergency.ts';

// ─────────────────────────── CORS ───────────────────────────
//
// Volontairement PAS de `*`, contrairement aux cinq fonctions Edge
// existantes : c'est le constat O-03 de l'audit du 04/09/2026, et une
// nouvelle fonction n'a aucune raison de reproduire un défaut connu.
// `HEALTH_ALLOWED_ORIGINS` (liste séparée par des virgules) porte les
// domaines MokNet. Tant qu'elle n'est pas définie, on se replie sur la liste
// des domaines MokNet CONNUS (moknet.net et les sites Netlify de l'équipe,
// avec leurs aperçus de déploiement) — jamais sur `*` : depuis le 05/09/2026,
// cette fonction mesure elle-même le CORS des fonctions, elle ne peut pas
// être la première à échouer à son propre contrôle. Le repli est dit dans
// les journaux, au démarrage.

const ALLOWED_ORIGINS = (Deno.env.get('HEALTH_ALLOWED_ORIGINS') ?? '')
    .split(',').map((o) => o.trim()).filter(Boolean);

/** Domaines MokNet connus, utilisés seulement en l'absence de HEALTH_ALLOWED_ORIGINS. */
const MOKNET_ORIGIN_RULES: RegExp[] = [
    /^https:\/\/(www\.)?moknet\.net$/,
    /^https:\/\/([a-z0-9-]+--)?(lovely-maamoul-478226|thunderous-cendol-32d226|incandescent-moxie-cbffe6|moknet)\.netlify\.app$/,
    /^http:\/\/localhost(:\d+)?$/,
];
const FALLBACK_ORIGIN = 'https://moknet.net';

if (ALLOWED_ORIGINS.length === 0) {
    console.warn(
        'health-guardian: HEALTH_ALLOWED_ORIGINS non définie — repli sur la liste des domaines MokNet ' +
        'connus (moknet.net et sites Netlify de l\'équipe). Définir la variable pour la restreindre.',
    );
}

function isMokNetOrigin(origin: string): boolean {
    return ALLOWED_ORIGINS.length > 0
        ? ALLOWED_ORIGINS.includes(origin)
        : MOKNET_ORIGIN_RULES.some((rule) => rule.test(origin));
}

function corsHeaders(origin: string | null): Record<string, string> {
    // Une origine inconnue reçoit une origine qui n'est pas la sienne : le
    // navigateur refuse alors la réponse. C'est le comportement attendu.
    const allow = origin && isMokNetOrigin(origin) ? origin : (ALLOWED_ORIGINS[0] ?? FALLBACK_ORIGIN);
    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

function json(body: unknown, status = 200, origin: string | null = null): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
}

// ───────────────────── JETON DE CONFIRMATION ─────────────────────
//
// Le jeton lie la confirmation de la personne à un périmètre PRÉCIS :
// (réparation, ligne, nombre de lignes concernées, auteur, expiration).
//
// Au moment d'appliquer, la fonction re-diagnostique et compare. Si le
// nombre de lignes a changé entre l'affichage et le clic — une story vient
// d'expirer, un direct vient de se clore — le jeton ne correspond plus et
// l'action est refusée : la personne doit revoir le nouveau périmètre et
// reconfirmer. Une confirmation ne peut donc pas être rejouée sur un
// périmètre qu'elle n'a jamais vu.

const CONFIRMATION_TTL_MS = 5 * 60_000;

async function hmacKey(): Promise<CryptoKey> {
    // Matière de clé : le secret de service, déjà présent dans
    // l'environnement de la fonction. Il ne sort jamais — seule la signature
    // circule, et une signature ne permet pas de remonter à la clé.
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    return crypto.subtle.importKey(
        'raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
    );
}

interface PlanClaims {
    remediationId: string;
    lineId: string;
    affectedCount: number;
    actorId: string;
    exp: number;
}

function canonical(claims: PlanClaims): string {
    return [claims.remediationId, claims.lineId, claims.affectedCount, claims.actorId, claims.exp].join('|');
}

async function signPlan(claims: PlanClaims): Promise<string> {
    const key = await hmacKey();
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical(claims)));
    const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return `${btoa(JSON.stringify(claims))}.${b64}`;
}

async function verifyPlan(token: string): Promise<PlanClaims | null> {
    try {
        const [payload, sig] = token.split('.');
        if (!payload || !sig) return null;
        const claims = JSON.parse(atob(payload)) as PlanClaims;
        const key = await hmacKey();
        const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical(claims)));
        // Comparaison à temps constant : une comparaison de chaînes qui
        // s'arrête au premier écart laisse mesurer la signature attendue.
        const got = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
        const exp = new Uint8Array(expected);
        if (got.length !== exp.length) return null;
        let diff = 0;
        for (let i = 0; i < exp.length; i++) diff |= got[i] ^ exp[i];
        if (diff !== 0) return null;
        if (Date.now() > claims.exp) return null;
        return claims;
    } catch {
        return null;
    }
}

// ─────────────────────────── SONDES ───────────────────────────

type UserClient = ReturnType<typeof createUserScopedClient>;

// ───────────── SAT-4 : LA SEULE SONDE QUI SORT DE LA BASE ─────────────
//
// Tout le reste de ce tableau de bord interroge Postgres. Celle-ci appelle le
// serveur LiveKit — parce que c'est le seul moyen de savoir si un direct peut
// réellement démarrer. La règle de décision, elle, vit dans
// `liveTransportProbe.ts` et ne fait aucun réseau : ici on OBSERVE, là-bas on
// JUGE. Les tests exécutent le jugement réel, pas une imitation.

/**
 * Délai au-delà duquel on abandonne l'appel.
 *
 * DÉRIVÉ du seuil de dégradation plutôt que choisi à part, et ce n'est pas un
 * détail : si on coupait AU seuil, l'état « dégradé » deviendrait
 * inobservable — un serveur qui répond en 2 s serait déclaré INJOIGNABLE
 * alors qu'il répond. La garde mentirait dans le sens alarmant, ce qui est
 * aussi grave qu'un faux vert. L'écrire comme un calcul, et non comme une
 * constante voisine, empêche les deux valeurs de se croiser un jour.
 */
const PROBE_TIMEOUT_MS = Math.max(5_000, SEUIL_DEGRADE_MS * 2);

/** Le jeton de la sonde : lecture seule, très court, et rien d'autre. */
const PROBE_TOKEN_TTL_S = 60;

interface LiveTransportConfigRow {
    server_url: string;
    api_key: string;
    api_secret: string;
}

/** Lit la configuration active du transport. `null` quand rien n'est branché. */
async function loadTransportConfig(): Promise<LiveTransportConfigRow | null> {
    const service = createServiceRoleClient();
    const environment = Deno.env.get('LIVE_TRANSPORT_ENVIRONMENT') ?? 'development';

    const { data: config } = await service
        .rpc('get_live_transport_config_internal', { p_environment: environment })
        .maybeSingle<LiveTransportConfigRow>();

    if (!config?.server_url || !config?.api_key || !config?.api_secret) return null;
    return config;
}

/**
 * Signe un jeton de sonde avec la clé du coffre. `null` si la signature est
 * impossible — un défaut de configuration, pas une panne du serveur : on le
 * dit sans accuser le transport.
 */
async function signProbeToken(
    config: LiveTransportConfigRow,
    grant: Record<string, unknown>,
): Promise<string | null> {
    try {
        const at = new AccessToken(config.api_key, config.api_secret, {
            identity: 'health-guardian',
            ttl: PROBE_TOKEN_TTL_S,
        });
        at.addGrant(grant);
        return await at.toJwt();
    } catch (err) {
        console.error('health-guardian: signature du jeton de sonde impossible', err);
        return null;
    }
}

/** Une requête HTTP bornée dans le temps, observée sans jugement. */
type ObservedRequest = RawHttpProbe & { body: unknown; headers: Headers | null };

async function timedRequest(url: string, init: RequestInit, timeoutMs: number): Promise<ObservedRequest> {
    const controller = new AbortController();
    const minuterie = setTimeout(() => controller.abort(), timeoutMs);
    const debut = Date.now();
    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        const texte = await res.text();
        // Le corps est lu SANS supposer qu'il est du JSON : un reverse-proxy
        // égaré rend volontiers une page HTML avec un 200.
        let corps: unknown = null;
        try { corps = JSON.parse(texte); } catch { corps = texte; }
        return { reached: true, httpStatus: res.status, latencyMs: Date.now() - debut, timedOut: false, body: corps, headers: res.headers };
    } catch (err) {
        const expire = err instanceof DOMException && err.name === 'AbortError';
        return { reached: false, httpStatus: null, latencyMs: Date.now() - debut, timedOut: expire, body: null, headers: null };
    } finally {
        clearTimeout(minuterie);
    }
}

/**
 * Observe le transport du direct. Ne juge pas, ne lève jamais.
 *
 * L'appel émis est exactement celui que `livekit-token` fait pour laisser
 * entrer quelqu'un (`POST /twirp/livekit.RoomService/ListRooms`), signé par le
 * même SDK et la même clé. Ce que la sonde éprouve est donc précisément ce
 * dont dépend un direct — pas une approximation.
 */
async function observeLiveTransport(
    config: LiveTransportConfigRow | null,
): Promise<{ configured: boolean; probe: RawLiveTransportProbe | null }> {
    if (!config) return { configured: false, probe: null };

    // `roomList` seul : la sonde peut LIRE la liste des directs, jamais en
    // créer un, en rejoindre un, ni publier quoi que ce soit.
    const jeton = await signProbeToken(config, { roomList: true });
    if (!jeton) return { configured: false, probe: null };

    const url = `${toLiveKitApiUrl(config.server_url)}/twirp/livekit.RoomService/ListRooms`;
    const r = await timedRequest(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
        body: '{}',
    }, PROBE_TIMEOUT_MS);
    return {
        configured: true,
        probe: { reached: r.reached, httpStatus: r.httpStatus, body: r.body, latencyMs: r.latencyMs, timedOut: r.timedOut },
    };
}

// ───────────── 05/09/2026 : LE VPS VU DE L'EXTÉRIEUR ─────────────
//
// Deux portes distinctes, qui tombent séparément : la façade HTTPS (nginx,
// certificat, port 443) et la porte des appareils (`/rtc/validate`), celle
// que frappent réellement les téléphones. `ListRooms` ci-dessus éprouve l'API
// d'administration ; ces deux-ci éprouvent le chemin des utilisateurs.

const VPS_TIMEOUT_MS = 3_000;

async function observeVps(config: LiveTransportConfigRow | null): Promise<RawVpsMetrics> {
    if (!config) return { configured: false, front: null, rtc: null };
    const base = toLiveKitApiUrl(config.server_url);

    // Jeton d'entrée dans une salle qui n'existe pas et n'existera pas :
    // `/rtc/validate` ne crée rien, il ne fait que valider la signature et les
    // droits. Ni publication ni abonnement : le jeton ne peut servir à rien.
    const jeton = await signProbeToken(config, {
        roomJoin: true, room: 'health-guardian-sonde', canPublish: false, canSubscribe: false,
    });

    const [front, rtc] = await Promise.all([
        timedRequest(`${base}/`, { method: 'GET' }, VPS_TIMEOUT_MS),
        jeton
            ? timedRequest(`${base}/rtc/validate?access_token=${encodeURIComponent(jeton)}`, { method: 'GET' }, VPS_TIMEOUT_MS)
            : Promise.resolve(null),
    ]);
    const strip = (r: ObservedRequest | null): RawHttpProbe | null =>
        r ? { reached: r.reached, httpStatus: r.httpStatus, latencyMs: r.latencyMs, timedOut: r.timedOut } : null;
    return { configured: true, front: strip(front), rtc: strip(rtc) };
}

// ───────────── 05/09/2026 : LE CORS DES FONCTIONS, MESURÉ ─────────────
//
// Constat O-03 de l'audit : cinq fonctions répondaient `*`. Plutôt que de le
// supposer réglé, on envoie à chaque fonction — celle-ci comprise — une
// requête de pré-vol depuis une origine inventée, et on lit ce qu'elle
// autorise. Une passerelle qui répond 404 à la place de la fonction n'est pas
// un constat sur la fonction : la ligne le dit.

const EDGE_FUNCTION_SLUGS = ['ai-gateway', 'discover-provider', 'livekit-token', 'mint-live-token', 'push-notify', 'health-guardian'];
const FOREIGN_ORIGIN = 'https://origine-inconnue.invalid';
const CORS_TIMEOUT_MS = 4_000;

async function observeEdgeCors(): Promise<RawEdgeCorsMetrics> {
    const base = Deno.env.get('SUPABASE_URL');
    if (!base) throw new Error('SUPABASE_URL absente : impossible de sonder les fonctions.');

    const functions = await Promise.all(EDGE_FUNCTION_SLUGS.map(async (slug) => {
        const r = await timedRequest(`${base}/functions/v1/${slug}`, {
            method: 'OPTIONS',
            headers: {
                Origin: FOREIGN_ORIGIN,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'authorization, content-type',
            },
        }, CORS_TIMEOUT_MS);
        // 404 = la passerelle a répondu à la place d'une fonction absente : ce
        // n'est pas un constat sur la fonction, on ne la compte pas atteinte.
        const reached = r.reached && r.httpStatus !== 404;
        return {
            slug,
            reached,
            httpStatus: r.httpStatus,
            allowOrigin: reached ? (r.headers?.get('access-control-allow-origin') ?? null) : null,
        };
    }));
    return { foreignOrigin: FOREIGN_ORIGIN, functions };
}

async function runProbes(userClient: UserClient): Promise<{ outcomes: ProbeOutcome[]; error?: string }> {
    const config = await loadTransportConfig().catch((err) => {
        console.error('health-guardian: configuration de transport illisible', err);
        return null;
    });

    // Aucune sonde réseau ne lève : une sonde qui casserait la fonction
    // entière ferait disparaître TOUTES les lignes du tableau de bord pour un
    // seul service indisponible. Ce qui échoue devient `undefined`, donc BLANC.
    const [cat, data, ops, liveTransport, vps, edgeCors] = await Promise.all([
        userClient.rpc('health_probe_catalogue'),
        userClient.rpc('health_probe_data'),
        userClient.rpc('health_probe_operations'),
        observeLiveTransport(config).catch((err) => {
            console.error('health-guardian: sonde de transport en échec', err);
            return undefined;
        }),
        observeVps(config).catch((err) => {
            console.error('health-guardian: sonde du VPS en échec', err);
            return undefined;
        }),
        observeEdgeCors().catch((err) => {
            console.error('health-guardian: sonde CORS en échec', err);
            return undefined;
        }),
    ]);

    // Une sonde en échec ne produit PAS de vert par défaut : on renvoie
    // l'erreur, et le client marque les lignes concernées en blanc (non
    // éprouvé). C'est la règle « aucun faux vert » appliquée au cas où la
    // mesure elle-même tombe.
    const failure = cat.error ?? data.error ?? ops.error;
    if (failure) {
        return { outcomes: [], error: failure.message };
    }

    const metrics: RawMetrics = {
        catalogue: (cat.data ?? {}) as Record<string, unknown>,
        data: (data.data ?? {}) as Record<string, unknown>,
        operations: (ops.data ?? {}) as Record<string, unknown>,
        liveTransport,
        vps,
        edgeCors,
    };
    return { outcomes: evaluateAll(metrics) };
}

/** Journalise dans `audit_logs`, qui n'est accessible qu'au service_role. */
async function journal(
    entry: {
        actorId: string;
        action: string;
        lineId: string;
        metadata: Record<string, unknown>;
    },
): Promise<string | null> {
    const service = createServiceRoleClient();
    const { data, error } = await service.from('audit_logs').insert({
        actor_id: entry.actorId,
        action: entry.action,
        entity_type: 'health',
        entity_id: entry.lineId,
        request_id: crypto.randomUUID(),
        metadata: entry.metadata,
    }).select('id').maybeSingle();

    if (error) {
        // Une action appliquée mais non journalisée doit se voir : elle est
        // signalée dans la réponse, jamais avalée.
        console.error('health-guardian: journalisation en échec', error.message);
        return null;
    }
    return (data as { id?: string } | null)?.id ?? null;
}

// ───────────────────── SAT-6 : PORTS DU SECOURS ─────────────────────
//
// Le flux vit dans `liveEmergency.ts` (pur, testé). Ici, seulement les
// accès au monde, chacun borné en temps et incapable de lever. La
// configuration de transport est celle de `loadTransportConfig()` : le
// secours parle au MÊME serveur avec la MÊME clé que la sonde SAT-4 et que
// `livekit-token`.

/** Même plafond que la porte d'admission (`livekit-token`) : au-delà, on ne sait pas. */
const EMERGENCY_ROOM_SERVICE_TIMEOUT_MS = 1500;

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        work.catch((error) => {
            console.error('health-guardian: API serveur LiveKit en échec', error);
            return null;
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
}

function emergencyCanonical(claims: EmergencyClaims): string {
    // Préfixe distinct de celui des réparations : un jeton de réparation ne
    // peut pas être rejoué comme un jeton de secours, et réciproquement.
    return ['secours', claims.action, claims.sessionId, claims.actorId, claims.exp].join('|');
}

async function signEmergency(claims: EmergencyClaims): Promise<string> {
    const key = await hmacKey();
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(emergencyCanonical(claims)));
    return `${btoa(JSON.stringify(claims))}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

async function verifyEmergency(token: string): Promise<EmergencyClaims | null> {
    try {
        const [payload, sig] = token.split('.');
        if (!payload || !sig) return null;
        const claims = JSON.parse(atob(payload)) as EmergencyClaims;
        const key = await hmacKey();
        const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(emergencyCanonical(claims))));
        const got = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
        if (got.length !== expected.length) return null;
        let diff = 0;
        for (let i = 0; i < expected.length; i++) diff |= got[i] ^ expected[i];
        return diff === 0 ? claims : null;
    } catch {
        return null;
    }
}

interface LiveSessionRow {
    id: string;
    title: string | null;
    host_id: string | null;
    host_name: string | null;
    started_at: string | null;
    ended_at: string | null;
}

function toEmergencySession(row: LiveSessionRow): LiveEmergencySession {
    return {
        id: row.id,
        title: row.title,
        hostId: row.host_id,
        hostName: row.host_name,
        startedAt: row.started_at,
        endedAt: row.ended_at,
    };
}

function buildEmergencyPorts(userClient: UserClient, config: LiveTransportConfigRow | null): LiveEmergencyPorts {
    const service = createServiceRoleClient();
    const rooms = config
        ? new RoomServiceClient(toLiveKitApiUrl(config.server_url), config.api_key, config.api_secret)
        : null;
    const SESSION_COLUMNS = 'id,title,host_id,host_name,started_at,ended_at';

    return {
        async rank() {
            const { data } = await userClient.rpc('health_my_rank');
            const r = (data ?? {}) as Partial<LiveEmergencyRank>;
            return { role: r.role ?? null, canRead: r.canRead === true, canRepair: r.canRepair === true };
        },
        async listOpenSessions() {
            // Lecture par le rôle service : le flux a DÉJÀ vérifié le rang, et
            // un direct privé doit rester visible de l'Admin Général qui le secourt.
            const { data } = await service
                .from('live_sessions')
                .select(SESSION_COLUMNS)
                .is('ended_at', null)
                .not('started_at', 'is', null)
                .order('started_at', { ascending: false })
                .limit(50);
            return ((data ?? []) as LiveSessionRow[]).map(toEmergencySession);
        },
        async readSession(sessionId) {
            const { data } = await service
                .from('live_sessions')
                .select(SESSION_COLUMNS)
                .eq('id', sessionId)
                .maybeSingle<LiveSessionRow>();
            return data ? toEmergencySession(data) : null;
        },
        async observeRoom(sessionId): Promise<RoomObservation> {
            if (!rooms) return 'unavailable';
            const listed = await withTimeout(rooms.listRooms([sessionId]), EMERGENCY_ROOM_SERVICE_TIMEOUT_MS);
            if (!Array.isArray(listed)) return 'unavailable';
            const room = listed[0];
            if (!room) return null;
            return { sid: String(room.sid ?? ''), creationTime: room.creationTime == null ? null : Number(room.creationTime) };
        },
        async listParticipants(sessionId) {
            if (!rooms) return null;
            const listed = await withTimeout(rooms.listParticipants(sessionId), EMERGENCY_ROOM_SERVICE_TIMEOUT_MS);
            if (!Array.isArray(listed)) return null;
            return listed.map((p) => String(p.identity));
        },
        async deleteRoom(sessionId) {
            if (!rooms) return false;
            const done = await withTimeout(rooms.deleteRoom(sessionId).then(() => true), 4_000);
            return done === true;
        },
        async closeSession(sessionId) {
            // Avec l'IDENTITÉ de l'appelant : la RLS de live_sessions n'accepte
            // que l'animateur ou un administrateur (is_live_host). Un non-admin
            // obtient zéro ligne — c'est la base qui refuse, pas cet écran.
            const { data, error } = await userClient
                .from('live_sessions')
                .update({ ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('id', sessionId)
                .is('ended_at', null)
                .select('ended_at');
            if (error) {
                console.error('health-guardian: clôture refusée', error.message);
                return { closed: false, endedAt: null };
            }
            const row = (data ?? [])[0] as { ended_at?: string } | undefined;
            return { closed: Boolean(row?.ended_at), endedAt: row?.ended_at ?? null };
        },
        async journal(entry) {
            return journal({
                actorId: entry.actorId,
                action: LIVE_EMERGENCY_JOURNAL_ACTION,
                lineId: LIVE_EMERGENCY_LINE_ID,
                metadata: entry.metadata,
            });
        },
        sign: signEmergency,
        verify: verifyEmergency,
        now: () => Date.now(),
    };
}

interface RequestBody {
    action?: 'probe' | 'diagnose' | 'repair' | 'restore' | 'journal'
        | 'live_emergency_overview' | 'live_emergency_diagnose' | 'live_emergency_apply';
    remediationId?: string;
    lineId?: string;
    confirmationToken?: string;
    snapshotId?: string;
    limit?: number;
    /** SAT-6 : geste de secours (`relaunch_room` | `close_session`) et direct visé. */
    emergencyAction?: string;
    sessionId?: string;
}

Deno.serve(async (req: Request) => {
    const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405, origin);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401, origin);
    const actorId = authData.user.id;

    let body: RequestBody;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête JSON invalide.' }, 400, origin);
    }

    // Rang de l'appelant : l'interface s'en sert pour n'afficher un bouton
    // d'action que s'il a une chance d'aboutir.
    const { data: rank } = await userClient.rpc('health_my_rank');
    const canRepair = (rank as { canRepair?: boolean } | null)?.canRepair === true;

    switch (body.action) {

        // ── LIRE ────────────────────────────────────────────────────────
        case 'probe': {
            const { outcomes, error } = await runProbes(userClient);
            if (error) return json({ error: `Sondes indisponibles : ${error}`, rank }, 403, origin);
            return json({ outcomes, rank, ranAt: new Date().toISOString() }, 200, origin);
        }

        case 'journal': {
            const { data, error } = await userClient.rpc('health_journal', { p_limit: body.limit ?? 50 });
            if (error) return json({ error: error.message }, 403, origin);
            return json({ entries: data ?? [], rank }, 200, origin);
        }

        // ── DIAGNOSTIQUER (aucune écriture) ─────────────────────────────
        case 'diagnose': {
            if (!body.remediationId || !body.lineId) {
                return json({ error: 'remediationId et lineId requis.' }, 400, origin);
            }
            const { data, error } = await userClient.rpc('health_diagnose_remediation', {
                p_remediation_id: body.remediationId,
            });
            if (error) return json({ error: error.message }, 403, origin);

            const plan = data as { affectedCount?: number; affectedTables?: string[]; sample?: unknown[] };
            const affectedCount = Number(plan?.affectedCount ?? 0);
            const claims: PlanClaims = {
                remediationId: body.remediationId,
                lineId: body.lineId,
                affectedCount,
                actorId,
                exp: Date.now() + CONFIRMATION_TTL_MS,
            };

            return json({
                lineId: body.lineId,
                remediationId: body.remediationId,
                summary: affectedCount === 0
                    ? "Rien à corriger : aucune ligne ne correspond actuellement."
                    : `${affectedCount} élément(s) seront modifiés, après sauvegarde.`,
                affectedCount,
                affectedTables: plan?.affectedTables ?? [],
                sample: plan?.sample ?? [],
                reversible: true,
                // Un jeton n'est émis que si l'appelant peut réellement agir :
                // inutile de faire miroiter une confirmation qui sera refusée.
                confirmationToken: canRepair && affectedCount > 0 ? await signPlan(claims) : null,
                expiresAt: new Date(claims.exp).toISOString(),
                rank,
            }, 200, origin);
        }

        // ── RÉPARER ─────────────────────────────────────────────────────
        case 'repair': {
            if (!body.remediationId || !body.lineId || !body.confirmationToken) {
                return json({ error: 'remediationId, lineId et confirmationToken requis.' }, 400, origin);
            }

            const claims = await verifyPlan(body.confirmationToken);
            if (!claims) {
                return json({ error: 'Confirmation invalide ou expirée. Relancez le diagnostic.' }, 400, origin);
            }
            if (claims.actorId !== actorId
                || claims.remediationId !== body.remediationId
                || claims.lineId !== body.lineId) {
                return json({ error: "Cette confirmation ne correspond pas à l'action demandée." }, 403, origin);
            }

            // Le périmètre a-t-il bougé depuis l'affichage ? Si oui, la
            // personne n'a pas confirmé CE qui serait fait maintenant.
            const { data: fresh, error: freshError } = await userClient.rpc('health_diagnose_remediation', {
                p_remediation_id: body.remediationId,
            });
            if (freshError) return json({ error: freshError.message }, 403, origin);
            const freshCount = Number((fresh as { affectedCount?: number })?.affectedCount ?? 0);
            if (freshCount !== claims.affectedCount) {
                return json({
                    error: `Le périmètre a changé depuis votre confirmation (${claims.affectedCount} → ${freshCount}). `
                        + `Relancez le diagnostic pour voir ce qui serait fait maintenant.`,
                }, 409, origin);
            }

            // SAUVEGARDER + APPLIQUER : une seule transaction côté base.
            const { data: applied, error: applyError } = await userClient.rpc('health_apply_remediation', {
                p_remediation_id: body.remediationId,
                p_line_id: body.lineId,
            });
            if (applyError) return json({ error: applyError.message }, 403, origin);

            const result = applied as { snapshotId?: string; changedCount?: number };

            // VÉRIFIER : on re-mesure, on ne déduit rien du succès de l'écriture.
            const { outcomes } = await runProbes(userClient);
            const verification = outcomes.find((o) => o.lineId === body.lineId) ?? null;

            const journalId = await journal({
                actorId,
                action: 'health.repair',
                lineId: body.lineId,
                metadata: {
                    remediationId: body.remediationId,
                    snapshotId: result?.snapshotId ?? null,
                    changedCount: result?.changedCount ?? 0,
                    statusAfter: verification?.status ?? null,
                    measuredAfter: verification?.measured ?? null,
                },
            });

            return json({
                lineId: body.lineId,
                remediationId: body.remediationId,
                ok: true,
                snapshotId: result?.snapshotId ?? null,
                changedCount: result?.changedCount ?? 0,
                verification,
                journalId,
                message: journalId
                    ? `${result?.changedCount ?? 0} élément(s) corrigé(s). Sauvegarde conservée pour restauration.`
                    : `${result?.changedCount ?? 0} élément(s) corrigé(s), mais la journalisation a échoué — à signaler.`,
                outcomes,
                rank,
            }, 200, origin);
        }

        // ── RESTAURER ───────────────────────────────────────────────────
        case 'restore': {
            if (!body.snapshotId || !body.lineId) {
                return json({ error: 'snapshotId et lineId requis.' }, 400, origin);
            }

            const { data: restored, error: restoreError } = await userClient.rpc('health_restore_snapshot', {
                p_snapshot_id: body.snapshotId,
            });
            if (restoreError) return json({ error: restoreError.message }, 403, origin);

            const { outcomes } = await runProbes(userClient);
            const verification = outcomes.find((o) => o.lineId === body.lineId) ?? null;

            const journalId = await journal({
                actorId,
                action: 'health.restore',
                lineId: body.lineId,
                metadata: {
                    snapshotId: body.snapshotId,
                    restoredCount: (restored as { restoredCount?: number })?.restoredCount ?? 0,
                    statusAfter: verification?.status ?? null,
                    measuredAfter: verification?.measured ?? null,
                },
            });

            return json({
                lineId: body.lineId,
                ok: true,
                snapshotId: body.snapshotId,
                changedCount: (restored as { restoredCount?: number })?.restoredCount ?? 0,
                verification,
                journalId,
                message: "État antérieur rétabli depuis la sauvegarde.",
                outcomes,
                rank,
            }, 200, origin);
        }

        // ── SAT-6 : SECOURS DU DIRECT (Admin Général) ───────────────────
        //
        // Le rang est contrôlé DANS le flux, à chaque étape, à partir de la
        // base — pas ici, et jamais à partir du corps de la requête.
        case 'live_emergency_overview': {
            const ports = buildEmergencyPorts(userClient, await loadTransportConfig().catch(() => null));
            const r = await liveEmergencyOverview(ports);
            return json(r.body, r.status, origin);
        }

        case 'live_emergency_diagnose': {
            const ports = buildEmergencyPorts(userClient, await loadTransportConfig().catch(() => null));
            const r = await diagnoseLiveEmergency(ports, {
                action: body.emergencyAction,
                sessionId: body.sessionId,
                actorId,
            });
            return json(r.body, r.status, origin);
        }

        case 'live_emergency_apply': {
            const ports = buildEmergencyPorts(userClient, await loadTransportConfig().catch(() => null));
            const r = await applyLiveEmergency(ports, {
                action: body.emergencyAction,
                sessionId: body.sessionId,
                confirmationToken: body.confirmationToken,
                actorId,
            });
            return json(r.body, r.status, origin);
        }

        default:
            return json({
                error: 'Action inconnue. Attendu : probe, diagnose, repair, restore, journal, '
                    + 'live_emergency_overview, live_emergency_diagnose, live_emergency_apply.',
            }, 400, origin);
    }
});
