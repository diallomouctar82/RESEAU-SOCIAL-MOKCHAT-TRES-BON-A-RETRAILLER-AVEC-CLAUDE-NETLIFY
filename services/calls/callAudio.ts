/**
 * Mission AU (audio bidirectionnel) — décisions PURES sur l'état réel du
 * son pendant un appel, sans React ni LiveKit, testées unitairement
 * (tests/callAudioLink.test.ts). L'écran d'appel ne fait que les afficher.
 *
 * Principe : jamais « connecté » sur la foi d'un signal — ce qui compte est
 * ce qui transite réellement (octets envoyés, octets reçus) et ce qui est
 * réellement joué (lecture autorisée). Chaque sens est jugé séparément,
 * c'est précisément ce qui rend un audio UNIDIRECTIONNEL visible et
 * diagnosticable sur un vrai appareil.
 */

import type { CallDataMessage } from '../messaging/speechLanguage';
import { userIdFromIdentity } from './callDevice';

/**
 * Revue AU-6 : depuis l'identité par appareil, une room d'appel peut contenir
 * plusieurs participants d'un même compte (mes autres appareils, ceux du
 * correspondant). Seuls ceux du compte du CORRESPONDANT sont candidats —
 * jamais un de mes propres appareils, jamais un participant inattendu.
 */
export function remotesOfAccount<T extends { participant: { identity: string } }>(list: readonly T[], userId: string | null | undefined): T[] {
    if (!userId) return [];
    return list.filter((p) => userIdFromIdentity(p.participant.identity) === userId);
}

/** Photographie de la liaison audio à un instant (issue du transport). */
export interface AudioLinkSample {
    at: number;
    localPublished: boolean;
    localMuted: boolean;
    bytesSent: number | null;
    remoteAudioTracks: number;
    bytesReceived: number | null;
    canPlaybackAudio: boolean;
}

export type SendingVerdict = 'ok' | 'muted' | 'stalled' | 'absent' | 'unknown';
export type ReceivingVerdict = 'ok' | 'blocked' | 'stalled' | 'absent' | 'unknown';

export interface AudioLinkVerdict {
    sending: SendingVerdict;
    receiving: ReceivingVerdict;
}

const delta = (next: number | null, prev: number | null): number | null =>
    typeof next === 'number' && typeof prev === 'number' ? next - prev : null;

/**
 * Juge les deux sens entre deux photographies successives (quelques
 * secondes d'écart). `unknown` tant qu'une mesure manque — jamais un
 * verdict inventé : un « ok » ne s'affiche que sur des octets réellement
 * comptés par WebRTC.
 */
export function assessAudioLink(prev: AudioLinkSample | null, next: AudioLinkSample): AudioLinkVerdict {
    // Revue AU-6 : un delta NÉGATIF = compteurs remis à zéro (reconnexion,
    // nouvelle connexion WebRTC) — c'est une nouvelle référence, pas un
    // blocage : « mesure… », jamais un faux « ne part pas ».
    let sending: SendingVerdict;
    if (!next.localPublished) sending = 'absent';
    else if (next.localMuted) sending = 'muted';
    else {
        const sent = prev ? delta(next.bytesSent, prev.bytesSent) : null;
        sending = sent === null || sent < 0 ? 'unknown' : sent > 0 ? 'ok' : 'stalled';
    }

    let receiving: ReceivingVerdict;
    if (next.remoteAudioTracks === 0) receiving = 'absent';
    else if (!next.canPlaybackAudio) receiving = 'blocked';
    else {
        const received = prev ? delta(next.bytesReceived, prev.bytesReceived) : null;
        receiving = received === null || received < 0 ? 'unknown' : received > 0 ? 'ok' : 'stalled';
    }
    return { sending, receiving };
}

/**
 * Le correspondant d'un appel à deux : parmi les participants distants (deux
 * appareils du même compte peuvent être connectés pendant la sonnerie),
 * celui qui publie réellement du média, sinon le premier. L'ancien
 * `remoteParticipants[0]` pouvait désigner l'appareil qui ne décrochera
 * jamais.
 */
export function pickRemoteForCall<T extends { audioTrack?: unknown; videoTrack?: unknown; screenShareTrack?: unknown }>(list: readonly T[]): T | null {
    if (list.length === 0) return null;
    return list.find((p) => !!p.audioTrack) ?? list.find((p) => !!p.videoTrack || !!p.screenShareTrack) ?? list[0];
}

/** Explication en français d'un échec de capture micro/caméra, à partir du message brut du navigateur. */
export function describeMediaError(raw: string | null | undefined): string {
    const m = (raw || '').toLowerCase();
    if (/notallowed|permission denied|permission dismissed|not allowed/.test(m)) {
        return 'Le navigateur a refusé l’accès au micro. Autorisez le micro pour ce site (icône à gauche de l’adresse, ou Réglages → Safari/Chrome → Micro), puis réessayez.';
    }
    if (/notfound|requested device not found|devicenotfound/.test(m)) return 'Aucun micro détecté sur cet appareil.';
    if (/notreadable|could not start|trackstarterror|device in use|hardware/.test(m)) return 'Le micro est utilisé par une autre application. Fermez-la, puis réessayez.';
    if (/overconstrained/.test(m)) return 'Le micro ne prend pas en charge les réglages demandés. Réessayez.';
    if (/aborted/.test(m)) return 'La capture du micro a été interrompue. Réessayez.';
    return raw && raw.trim() ? raw.trim() : 'Micro indisponible.';
}

/** Revue AU-6 : même explication pour la CAMÉRA (appel vidéo, micro publié mais caméra en échec). */
export function describeCameraError(raw: string | null | undefined): string {
    const m = (raw || '').toLowerCase();
    if (/notallowed|permission denied|permission dismissed|not allowed/.test(m)) {
        return 'Le navigateur a refusé l’accès à la caméra. Autorisez la caméra pour ce site (icône à gauche de l’adresse, ou Réglages → Safari/Chrome → Caméra), puis réactivez-la.';
    }
    if (/notfound|requested device not found|devicenotfound/.test(m)) return 'Aucune caméra détectée sur cet appareil.';
    if (/notreadable|could not start|trackstarterror|device in use|hardware/.test(m)) return 'La caméra est utilisée par une autre application. Fermez-la, puis réactivez la caméra.';
    if (/overconstrained/.test(m)) return 'La caméra ne prend pas en charge les réglages demandés. Réessayez.';
    if (/aborted/.test(m)) return 'La capture de la caméra a été interrompue. Réactivez la caméra.';
    return raw && raw.trim() ? raw.trim() : 'Caméra indisponible.';
}

/** Message « media » reçu du correspondant → phrase honnête à afficher (null si tout va bien de son côté). */
export function peerMediaNotice(peerName: string, message: Extract<CallDataMessage, { t: 'media' }> | null | undefined): string | null {
    if (!message) return null;
    if (message.mic === 'unavailable') return `${peerName} n’a pas de micro actif${message.reason ? ` (${message.reason})` : ''} : vous ne l’entendrez pas tant que ce n’est pas réglé de son côté.`;
    if (message.mic === 'off') return `${peerName} a coupé son micro.`;
    return null;
}

/** Libellés courts du diagnostic affiché pendant l'appel (un par sens), avec un ton par gravité. */
export function describeAudioLink(verdict: AudioLinkVerdict): { sending: { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' }; receiving: { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' } } {
    const sending = (() => {
        switch (verdict.sending) {
            case 'ok': return { label: 'Votre voix part', tone: 'ok' as const };
            case 'muted': return { label: 'Micro coupé', tone: 'muted' as const };
            case 'stalled': return { label: 'Votre voix ne part pas', tone: 'bad' as const };
            case 'absent': return { label: 'Micro non publié', tone: 'bad' as const };
            default: return { label: 'Micro : mesure…', tone: 'warn' as const };
        }
    })();
    const receiving = (() => {
        switch (verdict.receiving) {
            case 'ok': return { label: 'Vous recevez sa voix', tone: 'ok' as const };
            case 'blocked': return { label: 'Son bloqué par le navigateur', tone: 'bad' as const };
            case 'stalled': return { label: 'Rien n’arrive de sa voix', tone: 'bad' as const };
            case 'absent': return { label: 'Pas encore de micro en face', tone: 'warn' as const };
            default: return { label: 'Réception : mesure…', tone: 'warn' as const };
        }
    })();
    return { sending, receiving };
}

/** Ligne de journal compacte (console `[appel] média`) — ce qu'un test sur vrai appareil doit relever. */
export function formatAudioLinkLog(role: 'appelant' | 'appelé', sample: AudioLinkSample, verdict: AudioLinkVerdict): string {
    const n = (v: number | null) => (v === null ? '?' : String(v));
    return `[appel] média role=${role} envoi=${verdict.sending} réception=${verdict.receiving} micro=${sample.localPublished ? (sample.localMuted ? 'coupé' : 'publié') : 'absent'} octetsEnvoyés=${n(sample.bytesSent)} pistesDistantes=${sample.remoteAudioTracks} octetsReçus=${n(sample.bytesReceived)} lecture=${sample.canPlaybackAudio ? 'ok' : 'bloquée'}`;
}
