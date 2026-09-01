// Web Push sans dépendance externe : chiffrement de la charge utile selon
// RFC 8291 (schéma aes128gcm de la RFC 8188) et authentification VAPID selon
// RFC 8292 (JWT ES256), entièrement sur WebCrypto (disponible dans Deno).
//
// Pourquoi ici et pas dans le navigateur : le navigateur ne peut pas réveiller
// un autre appareil. Seul un serveur qui détient la clé privée VAPID peut
// remettre une notification au service de push (Google, Mozilla, Apple) qui
// la délivre au téléphone du correspondant, application fermée ou en arrière-plan.

export interface PushSubscriptionKeys {
    endpoint: string;
    /** Clé publique P-256 de l'abonné (65 octets, point non compressé), base64url. */
    p256dh: string;
    /** Secret d'authentification de l'abonné (16 octets), base64url. */
    auth: string;
}

export interface VapidKeys {
    /** Clé publique P-256 brute (65 octets), base64url — celle donnée au navigateur. */
    publicKey: string;
    /** Clé privée au format JWK (kty EC, crv P-256, x, y, d). */
    privateJwk: JsonWebKey;
    /** Contact du serveur d'application : URL https ou mailto. */
    subject: string;
}

const enc = new TextEncoder();

export function b64urlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(value: string): Uint8Array {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) { out.set(p, offset); offset += p.length; }
    return out;
}

/** HKDF-SHA-256 (extraction + expansion) — RFC 5869, tel qu'exigé par RFC 8188/8291. */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8);
    return new Uint8Array(bits);
}

export interface EncryptOptions {
    /** Paire de clés éphémère du serveur (tests reproductibles uniquement ; aléatoire sinon). */
    asKeyPair?: CryptoKeyPair;
    /** Sel de 16 octets (tests reproductibles uniquement ; aléatoire sinon). */
    salt?: Uint8Array;
    recordSize?: number;
}

/**
 * Chiffre `plaintext` pour l'abonné : renvoie l'en-tête aes128gcm (sel,
 * taille d'enregistrement, clé publique éphémère du serveur) suivi du
 * chiffré AES-128-GCM d'un enregistrement unique. Le navigateur déchiffre
 * avec sa clé privée p256dh et son secret `auth`.
 */
export async function encryptPayload(
    sub: PushSubscriptionKeys,
    plaintext: Uint8Array,
    opts: EncryptOptions = {},
): Promise<Uint8Array> {
    const uaPublic = b64urlDecode(sub.p256dh);
    if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) throw new Error('Clé p256dh invalide (65 octets non compressés attendus).');
    const authSecret = b64urlDecode(sub.auth);
    if (authSecret.length !== 16) throw new Error('Secret auth invalide (16 octets attendus).');

    const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));
    if (salt.length !== 16) throw new Error('Sel invalide (16 octets attendus).');
    const asKeys = opts.asKeyPair ?? await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));

    // Secret partagé ECDH entre la clé éphémère du serveur et la clé de l'abonné.
    const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));

    // RFC 8291 §3.4 : IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info\0" || ua_public || as_public, 32)
    const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
    const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);
    // RFC 8188 §2.2 : CEK et NONCE dérivés du sel et de l'IKM.
    const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
    const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

    // Un seul enregistrement : données + délimiteur 0x02 (dernier enregistrement), sans remplissage.
    const rs = opts.recordSize ?? 4096;
    const record = concat(plaintext, new Uint8Array([0x02]));
    if (record.length + 16 > rs) throw new Error(`Charge utile trop grande (${plaintext.length} octets).`);
    const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, record));

    // En-tête RFC 8188 : salt(16) | rs(4, gros-boutiste) | idlen(1) | keyid(as_public, 65)
    const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
    header.set(salt, 0);
    new DataView(header.buffer).setUint32(16, rs, false);
    header[20] = asPublic.length;
    header.set(asPublic, 21);
    return concat(header, ciphertext);
}

/** Génère une paire de clés VAPID (ES256). La clé privée ne quitte jamais le serveur. */
export async function generateVapidKeys(): Promise<{ publicKey: string; privateJwk: JsonWebKey }> {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    return {
        publicKey: b64urlEncode(raw),
        privateJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d },
    };
}

/**
 * En-tête `Authorization: vapid t=<JWT ES256>, k=<clé publique>` (RFC 8292).
 * L'audience est l'origine du service de push (jamais l'endpoint complet).
 */
export async function vapidAuthorization(endpoint: string, vapid: VapidKeys, expiresInSeconds = 12 * 3600): Promise<string> {
    const aud = new URL(endpoint).origin;
    const header = b64urlEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const claims = b64urlEncode(enc.encode(JSON.stringify({
        aud,
        exp: Math.floor(Date.now() / 1000) + Math.min(expiresInSeconds, 24 * 3600),
        sub: vapid.subject,
    })));
    const signingInput = `${header}.${claims}`;
    const { kty, crv, x, y, d } = vapid.privateJwk;
    const key = await crypto.subtle.importKey('jwk', { kty, crv, x, y, d }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    // WebCrypto renvoie la signature au format brut r||s (64 octets) : exactement la forme JWS ES256.
    const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput)));
    return `vapid t=${signingInput}.${b64urlEncode(signature)}, k=${vapid.publicKey}`;
}

export interface SendOptions {
    /** Durée de rétention par le service de push si l'appareil est injoignable (secondes). */
    ttl?: number;
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    /** Sujet de remplacement : une nouvelle notification de même sujet remplace la précédente non délivrée. */
    topic?: string;
}

export interface SendResult {
    ok: boolean;
    status: number;
    /** 404/410 : l'abonnement n'existe plus chez le service de push — à supprimer. */
    gone: boolean;
    error?: string;
    durationMs: number;
}

/** Construit les en-têtes HTTP d'une remise Web Push (sans le corps). */
export async function buildPushHeaders(sub: PushSubscriptionKeys, vapid: VapidKeys, opts: SendOptions = {}): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': String(Math.max(0, Math.floor(opts.ttl ?? 60))),
        'Urgency': opts.urgency ?? 'high',
        'Authorization': await vapidAuthorization(sub.endpoint, vapid),
    };
    if (opts.topic) {
        // Topic : 32 caractères max, alphabet base64url uniquement.
        headers['Topic'] = opts.topic.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
    }
    return headers;
}

/** Chiffre puis remet la charge utile au service de push de l'abonné. */
export async function sendWebPush(
    sub: PushSubscriptionKeys,
    payload: Uint8Array,
    vapid: VapidKeys,
    opts: SendOptions = {},
): Promise<SendResult> {
    const started = Date.now();
    try {
        const body = await encryptPayload(sub, payload);
        const headers = await buildPushHeaders(sub, vapid, opts);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        let res: Response;
        try {
            res = await fetch(sub.endpoint, { method: 'POST', headers, body, signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
        const detail = res.ok ? '' : (await res.text().catch(() => '')).slice(0, 200);
        return {
            ok: res.ok,
            status: res.status,
            gone: res.status === 404 || res.status === 410,
            error: res.ok ? undefined : (detail || res.statusText || `HTTP ${res.status}`),
            durationMs: Date.now() - started,
        };
    } catch (err) {
        const message = (err as Error).name === 'AbortError' ? 'Délai dépassé (10 s).' : (err as Error).message;
        return { ok: false, status: 0, gone: false, error: message, durationMs: Date.now() - started };
    }
}
