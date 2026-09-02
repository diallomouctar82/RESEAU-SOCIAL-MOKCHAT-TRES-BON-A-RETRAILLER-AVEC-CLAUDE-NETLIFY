/**
 * Mission AU (AU-12) — NOM DE ROOM D'APPEL : une room par APPEL, plus une
 * room par conversation.
 *
 * Constat mesuré sur les rapports de diagnostic de deux vrais appareils
 * (public.call_diagnostics, appel `call-1788343781635`) : la room d'appel
 * s'appelait `call-{conversationId}` — donc la MÊME room pour tous les appels
 * jamais passés entre deux personnes. Conséquence observée : un participant
 * fantôme du compte de l'appelant (identité `<userId>` SANS suffixe
 * d'appareil, c'est-à-dire une session restée ouverte sur une version
 * antérieure du site) était encore dans la room et Y PUBLIAIT SON MICRO. Le
 * correspondant pouvait donc entendre ce que captait cette session-là — dont
 * sa propre sonnerie — mêlé à la voix réelle. C'est la plainte « après le
 * décrochage, la sonnerie ne s'arrête pas et se mélange à la voix ».
 *
 * Correctif structurel : le nom de room contient l'identifiant de l'APPEL.
 * Deux appels ne partagent plus jamais une room, donc aucune session d'un
 * appel précédent ne peut s'y trouver — le problème disparaît par
 * construction plutôt que d'être filtré après coup.
 *
 * L'autorisation reste inchangée dans son principe : la fonction Edge
 * `livekit-token` vérifie toujours que le demandeur est membre de la
 * conversation. Elle lit désormais l'identifiant de conversation dans le
 * CORPS de la requête (`conversationId`) ; l'ancienne lecture depuis le nom
 * de room reste en place pour les bundles déjà servis (compatibilité).
 */

/** Séparateur entre l'identifiant de conversation et celui de l'appel. */
export const CALL_ROOM_SEPARATOR = '--';

/**
 * Room LiveKit d'un appel 1-à-1 : `call-<conversationId>--<callId>`.
 * Les deux côtés la construisent à partir de la MÊME session d'appel
 * (`conversationId` et `callId` voyagent tous deux dans l'invitation), donc
 * ils tombent sur le même nom sans se le transmettre.
 *
 * Sans `callId` (session héritée d'un bundle antérieur), on retombe sur
 * l'ancien nom `call-<conversationId>` : un appel en cours au moment d'une
 * mise à jour n'est jamais cassé.
 */
export function callRoomName(conversationId: string, callId?: string | null): string {
    const conversation = (conversationId || '').trim();
    const call = (callId || '').trim();
    if (!conversation) return '';
    if (!call) return `call-${conversation}`;
    return `call-${conversation}${CALL_ROOM_SEPARATOR}${call}`;
}

/**
 * Identifiant de conversation porté par un nom de room d'appel — miroir exact
 * de la lecture faite par la fonction Edge `livekit-token`. Un nom qui n'est
 * pas une room d'appel renvoie une chaîne vide (jamais une valeur devinée).
 */
export function conversationIdFromCallRoom(roomName: string | null | undefined): string {
    const name = (roomName || '').trim();
    if (!name.startsWith('call-')) return '';
    const rest = name.slice('call-'.length);
    const idx = rest.indexOf(CALL_ROOM_SEPARATOR);
    return idx === -1 ? rest : rest.slice(0, idx);
}
