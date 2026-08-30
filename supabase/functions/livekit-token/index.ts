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
}

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
        const conversationId = roomName.slice('call-'.length);
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
    const identity = authData.user.id;
    const name = (body.participantName ?? '').trim() || identity;

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
