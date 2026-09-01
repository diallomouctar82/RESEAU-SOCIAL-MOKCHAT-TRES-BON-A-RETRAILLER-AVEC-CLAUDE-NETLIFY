/**
 * Mission AU (audio bidirectionnel) — identité d'APPAREIL pour les appels.
 *
 * Défaut reproduit au banc : deux appareils du même compte (téléphone +
 * ordinateur) se pré-connectent à la room d'appel pendant la sonnerie avec
 * la MÊME identité LiveKit (`profiles.id`). Le serveur n'admet qu'une
 * connexion par identité : il évince la première. Si l'on décroche sur
 * l'appareil évincé, l'écran reste « Connexion… », rien n'est publié ni
 * reçu — un appel sans son, dans un sens ou dans les deux.
 *
 * Correctif : dans une room d'APPEL (`call-…`), l'identité LiveKit devient
 * `<userId>::<deviceId>` — chaque appareil a la sienne, aucun n'évince
 * l'autre. Le LIVE garde strictement `profiles.id` (rôles, chat, IA du LIVE
 * s'appuient sur cette correspondance). L'identifiant d'appareil est
 * aléatoire, sans donnée personnelle, propre à ce navigateur, conservé pour
 * que l'appareil reste reconnaissable d'un appel à l'autre.
 */

const STORAGE_KEY = 'moknet_call_device_id';
const DEVICE_ID_PATTERN = /^[a-z0-9]{8,32}$/;
let memoryFallback: string | null = null;

function randomDeviceId(): string {
    const bytes = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (b) => (b % 36).toString(36)).join('');
}

/** Identifiant stable de CET appareil/navigateur pour les appels — créé au premier usage. */
export function getCallDeviceId(): string {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && DEVICE_ID_PATTERN.test(stored)) return stored;
        const fresh = randomDeviceId();
        window.localStorage.setItem(STORAGE_KEY, fresh);
        return fresh;
    } catch {
        // Stockage indisponible (navigation privée stricte) : identité stable le temps de la session.
        memoryFallback ??= randomDeviceId();
        return memoryFallback;
    }
}

export const CALL_IDENTITY_SEPARATOR = '::';

/** Identité LiveKit d'un appareil dans une room d'appel — miroir exact de la fonction Edge `livekit-token`. */
export function callIdentity(userId: string, deviceId: string): string {
    return `${userId}${CALL_IDENTITY_SEPARATOR}${deviceId}`;
}

/** Identifiant de compte (profiles.id) porté par une identité LiveKit, suffixée d'appareil ou non. */
export function userIdFromIdentity(identity: string | null | undefined): string {
    if (!identity) return '';
    const idx = identity.indexOf(CALL_IDENTITY_SEPARATOR);
    return idx === -1 ? identity : identity.slice(0, idx);
}

/** Deux identités LiveKit désignent-elles le MÊME compte (appareils différents compris) ? */
export function isSameAccountIdentity(a: string | null | undefined, b: string | null | undefined): boolean {
    const ua = userIdFromIdentity(a);
    return ua.length > 0 && ua === userIdFromIdentity(b);
}
