// Notifications push (Web Push) de MokNet — le seul chemin qui peut faire
// sonner le téléphone d'un correspondant qui N'EST PAS dans l'application
// (onglet fermé, écran verrouillé, arrière-plan). Le signal d'appel temps
// réel (broadcast Supabase) n'atteint que les onglets ouverts et abonnés :
// mesuré avant cette mission, un correspondant hors de l'application ne
// recevait jamais rien.
//
// Sécurité :
// - JWT requis : l'expéditeur est l'utilisateur authentifié, jamais un champ
//   du corps de requête ;
// - un envoi n'est possible que vers soi-même (autres appareils du même
//   compte) ou vers un membre d'une conversation partagée, vérifié ici ;
// - la clé privée VAPID est générée au premier appel (WebCrypto) et rangée
//   dans le Vault via store_push_vapid_internal (rôle service uniquement) :
//   elle n'est jamais renvoyée, ni journalisée, ni transmise au navigateur ;
// - la charge utile est chiffrée de bout en bout pour l'abonné (RFC 8291) :
//   le service de push (Google, Mozilla, Apple) ne peut pas la lire ;
// - un abonnement disparu (404/410) est supprimé ; chaque remise est
//   journalisée dans push_delivery_log avec le statut HTTP réel.

import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';
import {
    b64urlDecode, b64urlEncode, buildPushHeaders, encryptPayload, generateVapidKeys, sendWebPush,
    type PushSubscriptionKeys, type VapidKeys,
} from './webpush.ts';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

/** Exécute une écriture d'audit sans bloquer la réponse (même patron qu'ai-gateway).
 * Accepte un constructeur de requête Supabase (thenable sans `catch`) : il est
 * d'abord converti en vraie promesse. */
function fireAndForget(work: PromiseLike<unknown>) {
    const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
    const tracked = Promise.resolve(work).catch((err) => console.error('push-notify: écriture différée en échec', err));
    if (runtime?.waitUntil) runtime.waitUntil(tracked);
}

type Topic = 'incoming_call' | 'call_cancelled' | 'missed_call' | 'message';

/** Durée de rétention chez le service de push (secondes) : un appel qui n'a
 * pas pu être remis en 45 s n'a plus de sens ; un appel manqué peut attendre. */
const TOPIC_TTL: Record<Topic, number> = { incoming_call: 45, call_cancelled: 60, missed_call: 24 * 3600, message: 3600 };
const TOPIC_URGENCY: Record<Topic, 'high' | 'normal'> = { incoming_call: 'high', call_cancelled: 'high', missed_call: 'normal', message: 'normal' };
const MAX_PAYLOAD_BYTES = 3500;
const MAX_SENDS_PER_MINUTE = 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface NotifyBody {
    action?: 'public_key' | 'notify' | 'dry_run';
    topic?: Topic;
    targetUserId?: string;
    conversationId?: string;
    callId?: string;
    /** Champs libres, filtrés par liste blanche (voir sanitizePayload). */
    payload?: Record<string, unknown>;
    /** dry_run uniquement (admin) : abonnement fictif fourni par le testeur. */
    subscription?: PushSubscriptionKeys;
    test?: { asPrivateJwk?: JsonWebKey; salt?: string; plaintext?: string };
}

interface VapidRow { public_key: string; private_jwk: string; subject: string }
interface SubscriptionRow { id: string; endpoint: string; p256dh: string; auth: string }

// Cache module (le runtime reste chaud entre deux invocations) : la clé ne
// change jamais une fois créée, un TTL court suffit à absorber une rotation.
let vapidCache: { keys: VapidKeys; expiresAt: number } | null = null;
const VAPID_TTL_MS = 10 * 60_000;

// deno-lint-ignore no-explicit-any
async function loadVapid(service: any): Promise<VapidKeys> {
    if (vapidCache && vapidCache.expiresAt > Date.now()) return vapidCache.keys;
    const { data, error } = await service.rpc('get_push_vapid_internal').maybeSingle();
    if (error) throw new Error(`Lecture de la configuration VAPID impossible : ${error.message}`);
    let row = data as VapidRow | null;
    if (!row) {
        // Premier appel de l'histoire du projet : génération côté serveur.
        const generated = await generateVapidKeys();
        const { error: storeError } = await service.rpc('store_push_vapid_internal', {
            p_public_key: generated.publicKey,
            p_private_jwk: JSON.stringify(generated.privateJwk),
            p_subject: 'https://moknet.net',
        });
        if (storeError) throw new Error(`Stockage de la clé VAPID impossible : ${storeError.message}`);
        // Relecture : si un appel concurrent a gagné la course, on prend SA clé —
        // jamais deux clés en circulation.
        const { data: reread, error: rereadError } = await service.rpc('get_push_vapid_internal').maybeSingle();
        if (rereadError || !reread) throw new Error('Configuration VAPID introuvable après création.');
        row = reread as VapidRow;
    }
    const keys: VapidKeys = { publicKey: row.public_key, privateJwk: JSON.parse(row.private_jwk), subject: row.subject };
    vapidCache = { keys, expiresAt: Date.now() + VAPID_TTL_MS };
    return keys;
}

/** Liste blanche des champs libres acceptés dans la charge utile. */
function sanitizePayload(input: Record<string, unknown> | undefined): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (!input) return out;
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : undefined);
    const callType = str(input.callType, 8);
    if (callType === 'audio' || callType === 'video') out.callType = callType;
    const reason = str(input.reason, 32);
    if (reason) out.reason = reason;
    const title = str(input.title, 80);
    if (title) out.title = title;
    const bodyText = str(input.body, 200);
    if (bodyText) out.body = bodyText;
    const url = str(input.url, 200);
    if (url && url.startsWith('/')) out.url = url;
    const preview = str(input.messagePreview, 120);
    if (preview) out.messagePreview = preview;
    return out;
}

function hostOf(endpoint: string): string {
    try { return new URL(endpoint).host; } catch { return 'invalide'; }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401);
    const sender = authData.user;

    let body: NotifyBody;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête JSON invalide.' }, 400);
    }

    const service = createServiceRoleClient();
    const action = body.action ?? 'notify';

    // ── Clé publique (le navigateur en a besoin pour s'abonner) ──────────────
    if (action === 'public_key') {
        try {
            const vapid = await loadVapid(service);
            return json({ publicKey: vapid.publicKey });
        } catch (err) {
            console.error('push-notify: public_key', err);
            return json({ error: (err as Error).message }, 503);
        }
    }

    // ── Test à blanc (admin) : chiffrement + en-têtes, sans envoi ─────────────
    // Sert à prouver la conformité RFC 8291/8292 depuis l'extérieur : le
    // testeur fournit un abonnement fictif dont il détient la clé privée,
    // déchiffre le corps renvoyé et vérifie la signature VAPID.
    if (action === 'dry_run') {
        const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin');
        if (adminError || !isAdmin) return json({ error: 'Accès réservé aux administrateurs.' }, 403);
        const sub = body.subscription;
        if (!sub?.endpoint || !sub.p256dh || !sub.auth) return json({ error: 'subscription {endpoint, p256dh, auth} requise.' }, 400);
        try {
            const vapid = await loadVapid(service);
            const plaintext = new TextEncoder().encode(
                body.test?.plaintext ?? JSON.stringify({ v: 1, type: 'dry_run', ts: Date.now(), ...sanitizePayload(body.payload) }),
            );
            let asKeyPair: CryptoKeyPair | undefined;
            if (body.test?.asPrivateJwk) {
                const jwk = body.test.asPrivateJwk;
                const privateKey = await crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
                const publicKey = await crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
                asKeyPair = { privateKey, publicKey };
            }
            const salt = body.test?.salt ? b64urlDecode(body.test.salt) : undefined;
            const encrypted = await encryptPayload(sub, plaintext, { asKeyPair, salt });
            const headers = await buildPushHeaders(sub, vapid, { ttl: 60, urgency: 'high', topic: 'dryrun' });
            return json({ headers, bodyBase64Url: b64urlEncode(encrypted), vapidPublicKey: vapid.publicKey, plaintextLength: plaintext.length });
        } catch (err) {
            return json({ error: (err as Error).message }, 400);
        }
    }

    if (action !== 'notify') return json({ error: 'action inconnue.' }, 400);

    // ── Envoi réel ────────────────────────────────────────────────────────────
    const topic = body.topic;
    if (!topic || !(topic in TOPIC_TTL)) return json({ error: 'topic invalide.' }, 400);
    const targetUserId = (body.targetUserId ?? '').trim();
    if (!UUID_RE.test(targetUserId)) return json({ error: 'targetUserId requis.' }, 400);
    const conversationId = (body.conversationId ?? '').trim();
    if (conversationId && !UUID_RE.test(conversationId)) return json({ error: 'conversationId invalide.' }, 400);
    const callId = (body.callId ?? '').trim().slice(0, 64) || null;

    // Autorisation : soi-même (autres appareils du même compte) ou membre
    // réel d'une conversation partagée — jamais un tiers arbitraire.
    if (targetUserId !== sender.id) {
        if (!conversationId) return json({ error: 'conversationId requis pour notifier un autre membre.' }, 400);
        const { data: members, error: membersError } = await service
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .in('user_id', [sender.id, targetUserId]);
        const ids = new Set(((members ?? []) as { user_id: string }[]).map((m) => m.user_id));
        if (membersError || !ids.has(sender.id) || !ids.has(targetUserId)) {
            return json({ error: "Envoi réservé aux membres d'une conversation partagée." }, 403);
        }
        // Blocage : arguments nommés EXACTEMENT comme la fonction SQL
        // (are_users_blocked(p_user_a, p_user_b)) — un nom faux ferait échouer
        // l'appel sans bloquer personne. Fermé sur erreur : si la vérification
        // n'a pas pu avoir lieu, on n'envoie pas (jamais « autorisé par défaut »).
        const { data: blocked, error: blockedError } = await service.rpc('are_users_blocked', { p_user_a: sender.id, p_user_b: targetUserId });
        if (blockedError) {
            console.error('push-notify: vérification de blocage impossible', blockedError.message);
            return json({ error: 'Vérification de blocage impossible, envoi refusé.' }, 503);
        }
        if (blocked === true) return json({ error: 'Envoi impossible entre ces deux comptes.' }, 403);
    }

    // Garde-fou anti-abus : plafond d'envois par expéditeur et par minute.
    const { count: recentCount } = await service
        .from('push_delivery_log')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', sender.id)
        .gte('created_at', new Date(Date.now() - 60_000).toISOString());
    if ((recentCount ?? 0) >= MAX_SENDS_PER_MINUTE) return json({ error: 'Trop de notifications envoyées, réessayez dans une minute.' }, 429);

    const { data: subscriptions, error: subsError } = await service
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', targetUserId);
    if (subsError) return json({ error: `Lecture des abonnements impossible : ${subsError.message}` }, 500);
    const subs = (subscriptions ?? []) as SubscriptionRow[];
    if (subs.length === 0) {
        // Honnête : aucun appareil abonné — le correspondant ne peut pas être
        // réveillé par ce canal (le signal temps réel reste seul).
        return json({ total: 0, sent: 0, failed: 0, results: [], reason: 'no_subscription' });
    }

    let vapid: VapidKeys;
    try {
        vapid = await loadVapid(service);
    } catch (err) {
        console.error('push-notify: VAPID', err);
        return json({ error: (err as Error).message }, 503);
    }

    const { data: senderProfile } = await service
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', sender.id)
        .maybeSingle();

    const payloadObject = {
        v: 1,
        type: topic,
        ts: Date.now(),
        callId,
        conversationId: conversationId || null,
        from: {
            id: sender.id,
            name: (senderProfile as { name?: string } | null)?.name ?? 'Un membre MokNet',
            avatarUrl: (senderProfile as { avatar_url?: string } | null)?.avatar_url ?? null,
        },
        ...sanitizePayload(body.payload),
    };
    const payload = new TextEncoder().encode(JSON.stringify(payloadObject));
    if (payload.length > MAX_PAYLOAD_BYTES) return json({ error: 'Charge utile trop grande.' }, 413);

    const sendOptions = {
        ttl: TOPIC_TTL[topic],
        urgency: TOPIC_URGENCY[topic],
        // Un même appel remplace sa notification précédente non délivrée
        // (appel puis annulation : le téléphone ne reçoit pas les deux à la suite).
        topic: callId ? `call${callId.replace(/[^A-Za-z0-9_-]/g, '')}` : undefined,
    };

    const results = await Promise.all(subs.map(async (sub) => {
        const result = await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload, vapid, sendOptions);
        return { sub, result };
    }));

    const goneIds = results.filter((r) => r.result.gone).map((r) => r.sub.id);
    if (goneIds.length > 0) {
        fireAndForget(service.from('push_subscriptions').delete().in('id', goneIds));
    }
    fireAndForget(service.from('push_delivery_log').insert(results.map(({ sub, result }) => ({
        user_id: targetUserId,
        sender_id: sender.id,
        topic,
        call_id: callId,
        endpoint_host: hostOf(sub.endpoint),
        status_code: result.status,
        ok: result.ok,
        error: result.error ?? null,
        duration_ms: result.durationMs,
    }))));

    const sent = results.filter((r) => r.result.ok).length;
    return json({
        total: results.length,
        sent,
        failed: results.length - sent,
        results: results.map(({ sub, result }) => ({
            host: hostOf(sub.endpoint), status: result.status, ok: result.ok, gone: result.gone,
            error: result.error, durationMs: result.durationMs,
        })),
    });
});
