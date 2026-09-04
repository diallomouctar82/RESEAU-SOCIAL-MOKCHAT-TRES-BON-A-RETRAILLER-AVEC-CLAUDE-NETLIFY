import { supabase } from '../supabaseClient';
import { LiveAccessError, type LiveAccessRefusal, readLiveRefusal } from './liveAccessError';

export interface LiveKitTokenResult {
    token: string;
    serverUrl: string;
}

const ACCES_IMPOSSIBLE = "Impossible d'obtenir un accès au LIVE (transport vidéo).";

/**
 * SAT-3 — Récupère le refus NOMMÉ que supabase-js a mis de côté.
 *
 * Sur un échec HTTP, `error.message` est toujours la même phrase générique
 * (« Edge Function returned a non-2xx status code ») : le corps réel — donc le
 * `code`, `occupied` et `capacity` du 409 de SAT-2 — n'existe plus que dans
 * `error.context`, l'objet `Response`. Sans cette lecture, un direct complet
 * est indiscernable d'une panne, et l'écran ne peut rien dire de vrai.
 *
 * Le corps ne se lit qu'UNE fois (`Response.json()` consomme le flux) : c'est
 * pour cela que la lecture vit ici, au seul endroit qui tient la réponse, et
 * que la décision vit dans `liveAccessError.ts`, sans réseau, donc testable.
 */
async function refusFromError(error: unknown): Promise<LiveAccessRefusal | null> {
    const context = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
    if (!context || typeof context.json !== 'function') return null;
    try {
        return readLiveRefusal(await context.json());
    } catch {
        // Corps illisible (déjà consommé, HTML d'une passerelle, réponse vide) :
        // on ne devine rien, l'erreur générique reprend son cours.
        return null;
    }
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
    if (error) {
        // SAT-3 : un refus NOMMÉ (direct complet, transport non configuré) doit
        // remonter tel quel jusqu'à l'écran ; tout le reste garde le chemin
        // d'erreur historique, mot pour mot.
        const refusal = await refusFromError(error);
        if (refusal) throw new LiveAccessError(refusal, ACCES_IMPOSSIBLE);
        throw new Error(error.message || ACCES_IMPOSSIBLE);
    }
    if (!data?.token || !data?.serverUrl) throw new Error(ACCES_IMPOSSIBLE);
    return { token: data.token, serverUrl: data.serverUrl };
}
