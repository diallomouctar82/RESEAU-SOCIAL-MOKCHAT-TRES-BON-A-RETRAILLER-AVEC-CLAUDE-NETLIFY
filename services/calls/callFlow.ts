/**
 * Mission VF (appels) — fonctions PURES du flux d'appel.
 *
 * Trois défauts réels relevés à l'audit VF-0 :
 *  (1) latence de plusieurs secondes au décroché — le jeton LiveKit et la
 *      connexion ne démarraient qu'APRÈS l'acceptation (VF-3) ;
 *  (2) sonnerie résiduelle mêlée à la voix — la sonnerie n'était pas arrêtée
 *      sur tous les chemins, et un second appareil du MÊME compte qui sonnait
 *      n'était jamais prévenu du décroché (VF-2) ;
 *  (3) hors application, aucun appel n'arrivait — le signal d'appel est un
 *      broadcast éphémère (VF-1, notification push).
 *
 * Tout ce qui se DÉCIDE dans ces flux est ici, sans React, sans Supabase,
 * sans LiveKit, pour être testé unitairement (tests/callFlow.test.ts) :
 * MoocChatFloating et ChatCallModal ne font que consommer ces décisions.
 * Même discipline que `ringingStateForCall` (Équipe 8) : un seul point de
 * vérité, donc aucun chemin oublié.
 */

import type { ActiveCallSession } from '../../types';

/** Types de signaux d'appel (broadcast `call-signals:<userId>`). */
export type CallSignalKind =
    | 'call_invitation'
    | 'call_accepted'
    | 'call_rejected'
    | 'call_ended'
    | 'call_cancelled'
    | 'call_handled_elsewhere';

/** Horodatages (ms epoch, horloge LOCALE de cet appareil) posés le long d'un appel. */
export interface CallTimingMarks {
    /** Appelant : instant où l'invitation est partie. */
    offerSentAt?: number | null;
    /** Appelé : instant où la sonnerie a commencé ici. */
    ringStartedAt?: number | null;
    /** Décroché — clic local (appelé) ou réception de `call_accepted` (appelant). */
    acceptedAt?: number | null;
    /** Transport média connecté (état 'connected'), une fois l'appel accepté. */
    connectedAt?: number | null;
    /** Première piste audio distante réellement disponible après le décroché. */
    firstRemoteAudioAt?: number | null;
}

export interface CallLatency {
    /** Décroché → transport connecté (0 si déjà connecté pendant la sonnerie — c'est le but de la pré-connexion). */
    acceptToConnectedMs: number | null;
    /** Décroché → première voix distante disponible : ce que l'utilisateur ressent comme « connecté ». */
    acceptToAudioMs: number | null;
    /** Invitation émise / sonnerie reçue → voix distante (ou transport connecté à défaut). */
    totalMs: number | null;
}

const isMark = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Latences d'un appel. Chaque valeur est `null` tant que les deux instants
 * nécessaires ne sont pas connus — jamais un chiffre inventé. Un écart
 * négatif (transport connecté AVANT le décroché grâce à la pré-connexion)
 * vaut 0 : le délai ressenti est nul, pas négatif.
 */
export function computeCallLatency(marks: CallTimingMarks): CallLatency {
    const diff = (end: number | null | undefined, start: number | null | undefined): number | null =>
        isMark(end) && isMark(start) ? Math.max(0, end - start) : null;
    const origin = isMark(marks.offerSentAt) ? marks.offerSentAt : marks.ringStartedAt;
    const arrival = isMark(marks.firstRemoteAudioAt) ? marks.firstRemoteAudioAt : marks.connectedAt;
    return {
        acceptToConnectedMs: diff(marks.connectedAt, marks.acceptedAt),
        acceptToAudioMs: diff(marks.firstRemoteAudioAt, marks.acceptedAt),
        totalMs: diff(arrival, origin),
    };
}

/**
 * Durée lisible en français, une décimale, virgule décimale (« 0,9 s »).
 * Sous 100 ms — le cas normal quand le transport était déjà prêt — on
 * n'affiche pas un trompeur « 0,0 s » mais « moins de 0,1 s ». Entrée
 * invalide → « — », jamais « NaN s ».
 */
export function formatLatency(ms: number | null | undefined): string {
    if (!isMark(ms) || ms < 0) return '—';
    if (ms < 100) return 'moins de 0,1 s';
    return `${(Math.round(ms / 100) / 10).toFixed(1).replace('.', ',')} s`;
}

/**
 * Un signal reçu doit-il faire taire sonnerie ET retour d'appel ? Tout ce
 * qui n'est pas une invitation met fin à la phase sonore : accepté (l'autre
 * a décroché — le retour d'appel doit cesser AVANT que sa voix n'arrive),
 * refusé, terminé, annulé, ou pris en charge sur un autre appareil du même
 * compte. Un type inconnu ne fait rien — jamais une coupure sur un signal
 * que l'on ne comprend pas.
 */
export function shouldStopRingingFor(signalType: string | null | undefined): boolean {
    switch (signalType) {
        case 'call_accepted':
        case 'call_rejected':
        case 'call_ended':
        case 'call_cancelled':
        case 'call_handled_elsewhere':
            return true;
        default:
            return false;
    }
}

/**
 * `call_handled_elsewhere` vise-t-il l'appel qui SONNE ici ? Vrai seulement
 * si un appel est actif, que l'identifiant correspond et qu'il est encore en
 * sonnerie : si je l'ai moi-même décroché (status 'connected') ou déjà
 * fermé, c'est MOI qui l'ai pris en charge — un éventuel écho de mon propre
 * signal ne doit jamais couper mon appel.
 */
export function isHandledElsewhere(
    signal: { type?: string; callId?: string | null } | null | undefined,
    activeCall: Pick<ActiveCallSession, 'callId' | 'status'> | null | undefined,
): boolean {
    if (!signal || signal.type !== 'call_handled_elsewhere') return false;
    if (!activeCall || !signal.callId || activeCall.callId !== signal.callId) return false;
    return activeCall.status === 'ringing';
}

/** Taille maximale du registre d'identifiants vus (assez pour une session, borné pour ne jamais grossir sans fin). */
export const SEEN_CALL_IDS_MAX = 200;

/**
 * Déduplication par identifiant d'appel : un même appel peut arriver DEUX
 * fois (broadcast temps réel ET notification push relayée par le service
 * worker, ou un lancement depuis la notification puis le broadcast). Renvoie
 * `true` si l'identifiant est NOUVEAU (et le mémorise), `false` s'il a déjà
 * été vu ou s'il est vide. Le registre est borné : au-delà de
 * SEEN_CALL_IDS_MAX, le plus ancien sort (un Set conserve l'ordre d'insertion).
 */
export function dedupeCallId(seen: Set<string>, callId: string | null | undefined): boolean {
    if (typeof callId !== 'string' || callId.trim().length === 0) return false;
    if (seen.has(callId)) return false;
    seen.add(callId);
    while (seen.size > SEEN_CALL_IDS_MAX) {
        const oldest = seen.values().next().value;
        if (oldest === undefined) break;
        seen.delete(oldest);
    }
    return true;
}

/** Charge utile d'un push d'appel (contrat push-notify / service worker, v1). */
export interface CallPushPayloadLike {
    type: string;
    ts: number;
    callId: string | null;
    conversationId: string | null;
    from: { id: string; name: string; avatarUrl: string | null } | null;
    callType?: 'audio' | 'video' | null;
}

/**
 * Session d'appel ENTRANT construite depuis un push `incoming_call` —
 * exactement ce que produit un `call_invitation` reçu par broadcast, avec
 * l'appelant pris dans `payload.from`. `null` si la charge n'est pas un
 * appel entrant complet (identifiants manquants) : rien n'est inventé. Le
 * type d'appel absent vaut 'audio' — jamais une caméra allumée sans qu'elle
 * ait été demandée.
 */
export function sessionFromPushPayload(
    payload: CallPushPayloadLike | null | undefined,
    me: { id: string; name: string; avatarUrl: string },
    now: number,
): ActiveCallSession | null {
    if (!payload || payload.type !== 'incoming_call') return null;
    if (!payload.callId || !payload.conversationId || !payload.from?.id) return null;
    return {
        callId: payload.callId,
        conversationId: payload.conversationId,
        type: payload.callType === 'video' ? 'video' : 'audio',
        initiatorId: payload.from.id,
        initiatorName: payload.from.name || 'Un membre MokNet',
        initiatorAvatar: payload.from.avatarUrl || '',
        receiverId: me.id,
        receiverName: me.name,
        receiverAvatar: me.avatarUrl,
        status: 'ringing',
        durationSeconds: 0,
        ringStartedAt: now,
        origin: 'push',
    };
}
