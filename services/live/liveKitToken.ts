import { supabase } from '../supabaseClient';

export interface LiveKitTokenResult {
    token: string;
    serverUrl: string;
}

/**
 * Demande un jeton LiveKit signé côté serveur (edge function livekit-token).
 * `canPublish=false` pour un spectateur pur — le serveur applique la même
 * restriction dans le jeton, indépendamment de ce que tente le client.
 */
export async function fetchLiveKitToken(
    roomName: string,
    participantName?: string,
    canPublish = true,
    /**
     * Mission AU : identifiant de CET appareil — pour une room d'appel
     * (`call-…`), le serveur en fait une identité LiveKit distincte par
     * appareil (`<userId>::<deviceId>`), sinon deux appareils du même compte
     * s'évincent pendant la sonnerie. Ignoré pour les rooms de LIVE.
     */
    deviceId?: string,
    /**
     * AU-12 : conversation à laquelle l'appel appartient. Le nom de room
     * contient désormais l'identifiant de l'APPEL (une room par appel, voir
     * services/calls/callRoom.ts) : le serveur ne peut donc plus le déduire du
     * nom seul et le reçoit explicitement pour vérifier l'appartenance.
     * Absent → le serveur retombe sur l'ancienne lecture du nom de room.
     */
    conversationId?: string,
): Promise<LiveKitTokenResult> {
    const body: Record<string, unknown> = { roomName, participantName, canPublish };
    if (deviceId) body.deviceId = deviceId;
    if (conversationId) body.conversationId = conversationId;
    const { data, error } = await supabase.functions.invoke('livekit-token', { body });
    if (error || !data?.token || !data?.serverUrl) {
        throw new Error(error?.message || "Impossible d'obtenir un accès au LIVE (transport vidéo).");
    }
    return { token: data.token, serverUrl: data.serverUrl };
}
