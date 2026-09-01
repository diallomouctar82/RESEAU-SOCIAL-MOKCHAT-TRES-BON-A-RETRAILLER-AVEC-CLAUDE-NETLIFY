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
): Promise<LiveKitTokenResult> {
    const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: deviceId ? { roomName, participantName, canPublish, deviceId } : { roomName, participantName, canPublish },
    });
    if (error || !data?.token || !data?.serverUrl) {
        throw new Error(error?.message || "Impossible d'obtenir un accès au LIVE (transport vidéo).");
    }
    return { token: data.token, serverUrl: data.serverUrl };
}
