/**
 * AU-10 — « le micro à chaque appel demande d'être validé ou autorisé ».
 *
 * Ce que ce module NE fait PAS, et ne peut pas faire : supprimer la demande
 * du navigateur. L'autorisation micro appartient au système et au
 * navigateur, jamais à la page — aucune ligne de code de MokNet ne peut
 * décider à leur place. Prétendre le contraire serait une promesse fausse.
 *
 * Ce qu'il fait réellement, et qui règle le vécu décrit :
 *  1. LIRE l'état réel de l'autorisation (API Permissions quand elle existe,
 *     sinon les libellés des périphériques — un libellé non vide signifie que
 *     l'accès a été accordé pour cette session). L'origine de l'information
 *     est toujours dite (`measured`), jamais présentée comme certaine quand
 *     elle est déduite.
 *  2. Permettre de l'ACCORDER une fois, à froid, depuis les Paramètres —
 *     plutôt que d'être interrompu par la demande pendant la sonnerie, ce qui
 *     fait rater le début de l'appel et donne l'impression qu'elle revient
 *     « à chaque fois ».
 *  3. Expliquer la VRAIE raison quand elle revient malgré tout : sur iPhone,
 *     un onglet Safari n'est pas un site installé — l'autorisation y est
 *     rendue à la fin de la session. Ajouter MokNet à l'écran d'accueil la
 *     conserve. C'est la seule action qui change réellement quelque chose,
 *     et elle appartient à l'utilisateur.
 */

import { isIosDevice, isStandaloneDisplayMode } from '../push/pushService';
import { describeMediaError } from './callAudio';

export type MicPermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';

export interface MicPermissionStatus {
    state: MicPermissionState;
    /**
     * `true` : l'état vient de l'API Permissions du navigateur (mesuré).
     * `false` : il est DÉDUIT des libellés de périphériques — un libellé vide
     * dit seulement « pas accordé dans cette session », jamais si la demande
     * réapparaîtra ou a été refusée. L'interface doit rester prudente.
     */
    measured: boolean;
    /** Application lancée depuis l'écran d'accueil (l'autorisation y survit). */
    standalone: boolean;
    /** iPhone / iPad : l'autorisation d'un onglet ne survit pas à la session. */
    ios: boolean;
}

type PermissionsApi = { query: (d: { name: string }) => Promise<{ state: string }> };

const hasGetUserMedia = (): boolean =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';

/**
 * État réel de l'autorisation micro de CET appareil. Ne demande jamais rien à
 * l'utilisateur : lecture seule, sûre à appeler à l'ouverture d'un écran.
 */
export async function getMicrophonePermissionStatus(): Promise<MicPermissionStatus> {
    const context = { standalone: isStandaloneDisplayMode(), ios: isIosDevice() };
    if (!hasGetUserMedia()) return { state: 'unsupported', measured: true, ...context };

    const permissions = (navigator as Navigator & { permissions?: PermissionsApi }).permissions;
    if (permissions && typeof permissions.query === 'function') {
        try {
            const result = await permissions.query({ name: 'microphone' });
            if (result.state === 'granted' || result.state === 'denied' || result.state === 'prompt') {
                return { state: result.state, measured: true, ...context };
            }
        } catch {
            // Safari refuse le nom « microphone » : on retombe sur la déduction
            // par libellés ci-dessous, sans jamais inventer un état.
        }
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        if (inputs.length === 0) return { state: 'unsupported', measured: false, ...context };
        // Un libellé de périphérique n'est révélé qu'après un accès accordé.
        const named = inputs.some((d) => typeof d.label === 'string' && d.label.trim().length > 0);
        return { state: named ? 'granted' : 'prompt', measured: false, ...context };
    } catch {
        return { state: 'prompt', measured: false, ...context };
    }
}

export interface MicRequestResult {
    ok: boolean;
    /** Message déjà lisible par un humain (jamais un code technique brut). */
    error?: string;
}

/**
 * Demande l'autorisation UNE fois, à froid, puis relâche immédiatement le
 * micro : rien n'est enregistré, aucune piste ne reste ouverte. Doit être
 * appelée depuis un vrai geste de l'utilisateur (bouton), sinon les
 * navigateurs refusent d'afficher la demande.
 */
export async function requestMicrophoneOnce(): Promise<MicRequestResult> {
    if (!hasGetUserMedia()) return { ok: false, error: "Ce navigateur n'expose pas de micro à MokNet." };
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => {
            try { track.stop(); } catch { /* piste déjà arrêtée */ }
        });
        return { ok: true };
    } catch (err) {
        // `describeMediaError` raisonne sur le texte : le NOM de l'erreur
        // (NotAllowedError, NotFoundError…) porte l'information utile et
        // n'apparaît pas dans `message` — il doit donc être inclus.
        const text = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        return { ok: false, error: describeMediaError(text) };
    }
}

/**
 * Phrase honnête décrivant l'état ET ce qui se passera au prochain appel.
 * Le cas central de la plainte est `granted` + iPhone + hors écran d'accueil :
 * l'autorisation est bien accordée, et elle sera pourtant redemandée.
 */
export function describeMicrophonePermission(status: MicPermissionStatus): string {
    if (status.state === 'unsupported') {
        return "Ce navigateur ne donne accès à aucun micro : les appels ne pourront pas transmettre votre voix depuis cet appareil.";
    }
    if (status.state === 'denied') {
        return "Le micro est refusé pour ce site : votre correspondant ne vous entendra pas. Ouvrez les réglages du site dans votre navigateur (icône à gauche de l’adresse) → Micro → Autoriser, puis rechargez la page.";
    }
    if (status.state === 'prompt') {
        return status.measured
            ? "Le micro n’est pas encore autorisé : votre navigateur le demandera pendant la sonnerie du prochain appel. Autorisez-le ici, à froid, pour ne pas être interrompu à ce moment-là."
            : "Ce navigateur ne dit pas si le micro est déjà autorisé. Autorisez-le ici, à froid : s’il l’est déjà, rien ne vous sera demandé.";
    }
    // granted
    if (status.ios && !status.standalone) {
        return "Le micro est autorisé — mais pour cette session seulement. Sur iPhone et iPad, un onglet du navigateur rend l’autorisation à la fermeture : elle sera redemandée. Ajoutez MokNet à l’écran d’accueil (Partager → Sur l’écran d’accueil) et ouvrez-le depuis son icône : l’autorisation y est conservée.";
    }
    return "Le micro est autorisé sur cet appareil. Votre navigateur s’en souvient : il ne vous le redemandera pas à chaque appel.";
}
