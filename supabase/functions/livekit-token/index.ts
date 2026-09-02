// Émet un jeton LiveKit signé côté serveur pour rejoindre une room du LIVE
// MokNet. Seul endroit qui déchiffre le secret API LiveKit
// (get_live_transport_config_internal, service_role uniquement) — le client
// (navigateur) ne reçoit jamais que le jeton final et l'URL du serveur.
//
// À ne pas confondre avec supabase/functions/mint-live-token/ : cette
// dernière émet des jetons éphémères Gemini Live (appels vocaux/vidéo IA),
// sans rapport avec le transport vidéo multi-participants LiveKit.

import { AccessToken } from 'npm:livekit-server-sdk@2.18.0';
import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

interface LiveTransportConfigRow {
    server_url: string;
    api_key: string;
    api_secret: string;
}

interface TokenRequestBody {
    roomName?: string;
    participantName?: string;
    /** 'true' uniquement pour les rôles animateur/modérateur — sinon lecture seule (spectateur). */
    canPublish?: boolean;
    /**
     * Mission AU : identifiant de l'APPAREIL (aléatoire, propre au
     * navigateur, sans donnée personnelle). Pris en compte UNIQUEMENT pour
     * une room d'appel `call-…` : l'identité LiveKit devient
     * `<userId>::<deviceId>`, une par appareil — deux appareils du même
     * compte qui se pré-connectent pendant la sonnerie ne s'évincent plus.
     * Les rooms de LIVE gardent `profiles.id` (rôles, chat, IA).
     */
    deviceId?: string;
    /**
     * AU-12 : conversation à laquelle l'appel appartient. Le nom de room porte
     * maintenant l'identifiant de l'APPEL, la conversation ne s'en déduit donc
     * plus seule. Ce champ n'accorde AUCUN droit par lui-même : c'est
     * exactement lui qui est vérifié contre `conversation_participants`, comme
     * l'était auparavant la valeur lue dans le nom de room.
     */
    conversationId?: string;
}

const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{4,32}$/;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401);

    let body: TokenRequestBody = {};
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête invalide.' }, 400);
    }

    const roomName = (body.roomName ?? '').trim();
    if (!roomName || roomName.length > 128) {
        return json({ error: 'roomName requis (1-128 caractères).' }, 400);
    }

    const service = createServiceRoleClient();

    // Rooms d'APPEL 1-à-1 (Équipe I / LOOP I1) : `call-{conversationId}` est
    // une room PRIVÉE — seuls les membres réels de la conversation peuvent
    // obtenir un jeton (les rooms de LIVE restent joignables comme avant,
    // leur visibilité est gérée par la RLS de live_sessions côté données).
    if (roomName.startsWith('call-')) {
        // AU-12 : le nom de room est désormais `call-<conversationId>--<callId>`
        // (une room par APPEL, plus une room permanente par conversation — voir
        // services/calls/callRoom.ts). La conversation à contrôler arrive donc
        // dans le CORPS ; à défaut, on relit le nom comme avant, ce qui garde
        // valides les bundles déjà servis (`call-<conversationId>` seul) ET la
        // nouvelle forme (tout ce qui précède le séparateur).
        const fromBody = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
        const rest = roomName.slice('call-'.length);
        const separatorAt = rest.indexOf('--');
        const conversationId = fromBody || (separatorAt === -1 ? rest : rest.slice(0, separatorAt));
        const { data: membership, error: membershipError } = await service
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .eq('user_id', authData.user.id)
            .maybeSingle();
        if (membershipError || !membership) {
            return json({ error: "Cet appel est réservé aux membres de la conversation." }, 403);
        }
    }

    // 'development' pour l'instant (serveur LiveKit local sans compte) —
    // deviendra configurable par variable d'environnement au LOOP 13
    // (déploiement VPS), sans changer cette fonction.
    const environment = Deno.env.get('LIVE_TRANSPORT_ENVIRONMENT') ?? 'development';

    const { data: config, error: configError } = await service
        .rpc('get_live_transport_config_internal', { p_environment: environment })
        .maybeSingle<LiveTransportConfigRow>();

    if (configError || !config) {
        console.error('livekit-token: config de transport introuvable', configError);
        return json({ error: "Aucune configuration de transport LIVE active pour cet environnement." }, 503);
    }

    // L'identité correspond à profiles.id — voir LiveParticipantHandle.identity
    // (services/live/liveTransportTypes.ts) : le reste du système (rôles,
    // chat, IA) s'appuie sur cette correspondance stable.
    // Mission AU : dans une room d'appel, une identité PAR APPAREIL (voir
    // TokenRequestBody.deviceId et services/calls/callDevice.ts côté client,
    // qui reconstruit le même format). Un deviceId absent ou mal formé →
    // comportement historique (identité = compte).
    const deviceRaw = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
    const deviceId = DEVICE_ID_PATTERN.test(deviceRaw) ? deviceRaw : null;
    const identity = roomName.startsWith('call-') && deviceId ? `${authData.user.id}::${deviceId}` : authData.user.id;
    const name = (body.participantName ?? '').trim() || authData.user.id;

    const at = new AccessToken(config.api_key, config.api_secret, { identity, name });
    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: body.canPublish !== false,
        canSubscribe: true,
        canPublishData: true,
    });

    const token = await at.toJwt();

    return json({ token, serverUrl: config.server_url });
});
