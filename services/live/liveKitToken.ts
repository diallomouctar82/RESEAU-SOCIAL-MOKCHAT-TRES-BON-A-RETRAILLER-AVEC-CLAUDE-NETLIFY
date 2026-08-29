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
): Promise<LiveKitTokenResult> {
    const { data, error } = await supabase.functions.invoke('livekit-token', {
        body: { roomName, participantName, canPublish },
    });
    if (error || !data?.token || !data?.serverUrl) {
        throw new Error(error?.message || "Impossible d'obtenir un accès au LIVE (transport vidéo).");
    }
    return { token: data.token, serverUrl: data.serverUrl };
}
