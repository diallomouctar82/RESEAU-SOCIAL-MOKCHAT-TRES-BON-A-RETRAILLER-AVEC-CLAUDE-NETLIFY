// Émet un jeton LiveKit signé côté serveur pour rejoindre une room du LIVE
// MokNet. Seul endroit qui déchiffre le secret API LiveKit
// (get_live_transport_config_internal, service_role uniquement) — le client
// (navigateur) ne reçoit jamais que le jeton final et l'URL du serveur.
//
// À ne pas confondre avec supabase/functions/mint-live-token/ : cette
// dernière émet des jetons éphémères Gemini Live (appels vocaux/vidéo IA),
// sans rapport avec le transport vidéo multi-participants LiveKit.

import { AccessToken, RoomServiceClient } from 'npm:livekit-server-sdk@2.18.0';
import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';
import {
    type AdmissionVerdict,
    assessCapacity,
    decideWithRoster,
    liveSessionIdFromRoomName,
    toLiveKitHttpUrl,
} from './capacityGate.ts';

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

/**
 * SAT-2 — plafond de temps accordé à l'API serveur de LiveKit.
 *
 * Cette porte s'ajoute au chemin d'entrée d'un direct, or LT-1 et LT-2 ont
 * gagné leur latence au dixième de seconde. Au-delà de ce délai on cesse
 * d'attendre et on laisse entrer : mieux vaut un direct un peu trop plein
 * qu'un direct où personne n'entre parce qu'un appel réseau traîne.
 */
const ROOM_SERVICE_TIMEOUT_MS = 1500;

/** Rend `null` plutôt que de propager un échec ou une attente sans fin. */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        work.catch((error) => {
            console.error('livekit-token: API serveur LiveKit injoignable', error);
            return null;
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
}

/**
 * SAT-2 — décide si cette personne entre dans ce direct.
 *
 * Un appel réseau sur le chemin normal (lire le plafond), un second
 * uniquement quand un plafond existe réellement — et ce second appel donne
 * d'un coup le compte EXACT et la liste des présents.
 *
 * On ne compte JAMAIS avec `numParticipants` : mesuré au banc, cet agrégat
 * met 1 à 3 s (serveur 1.8.4) et 3 à 6 s (1.13.6) à rattraper la réalité.
 * Une porte fondée dessus serait inopérante pendant une ruée. Détail complet
 * dans `capacityGate.ts`.
 */
async function decideLiveAdmission(
    rooms: RoomServiceClient,
    roomName: string,
    identity: string,
    isHost: boolean,
): Promise<AdmissionVerdict> {
    if (isHost) return { admitted: true, reason: 'host' };

    const listed = await withTimeout(rooms.listRooms([roomName]), ROOM_SERVICE_TIMEOUT_MS);

    // Trois cas distincts, et ils ne veulent pas dire la même chose :
    //  - `null`  : LiveKit n'a pas répondu → on ne sait pas → on laisse entrer.
    //  - `[]`    : la room n'existe pas encore → aucun plafond, personne dedans.
    //  - `[room]`: le plafond réellement porté par la room.
    const maxParticipants = listed === null
        ? null
        : Number(listed[0]?.maxParticipants ?? 0);

    const assessment = assessCapacity({ isHost, maxParticipants });
    if (assessment.outcome === 'admit') return { admitted: true, reason: assessment.reason };

    // Un plafond existe : on compte sur la liste réelle des présents. Elle
    // sert aussi à reconnaître la personne dont le réseau est tombé et qui
    // revient — sa place est encore occupée par elle-même, la refuser
    // l'expulserait d'un direct qu'elle n'a jamais quitté.
    const participants = await withTimeout(rooms.listParticipants(roomName), ROOM_SERVICE_TIMEOUT_MS);
    const identities = Array.isArray(participants)
        ? participants.map((participant) => participant.identity)
        : null;

    return decideWithRoster({ capacity: assessment.capacity, identities, identity });
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
        // `code` ajouté par SAT-2 : le client doit pouvoir distinguer « le
        // transport n'est pas configuré » d'« il n'y a plus de place », sans
        // lire un message destiné à un humain.
        return json({ error: "Aucune configuration de transport LIVE active pour cet environnement.", code: 'transport_unconfigured' }, 503);
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

    // SAT-2 — LA PORTE D'ENTRÉE DU DIRECT.
    //
    // Elle est ici, à l'émission du jeton, parce que c'est le seul point
    // qu'un client ne peut pas contourner : sans jeton signé, aucune room ne
    // s'ouvre, quoi que fasse le navigateur.
    //
    // Elle ne concerne QUE les directs — jamais les rooms d'appel, dont la
    // latence a été travaillée au dixième de seconde (LT-1, LT-2) et à
    // laquelle cette porte n'ajoute pas une seule lecture.
    const liveSessionId = liveSessionIdFromRoomName(roomName);
    if (liveSessionId) {
        const { data: session } = await service
            .from('live_sessions')
            .select('host_id')
            .eq('id', liveSessionId)
            .maybeSingle<{ host_id: string }>();

        // L'animateur passe avant tout appel réseau : il n'est jamais mis à
        // la porte de son propre direct, et il n'en paie pas la latence.
        const isHost = !!session && session.host_id === authData.user.id;

        const rooms = new RoomServiceClient(
            toLiveKitHttpUrl(config.server_url),
            config.api_key,
            config.api_secret,
        );
        const verdict = await decideLiveAdmission(rooms, roomName, identity, isHost);

        if (!verdict.admitted) {
            // Dire la vérité, avec les chiffres. SAT-3 s'appuiera sur `code`
            // pour montrer un écran honnête au lieu d'un « Connexion… » qui
            // tourne sans fin.
            return json({
                error: 'Ce direct est complet.',
                code: 'live_full',
                occupied: verdict.occupied,
                capacity: verdict.capacity,
            }, 409);
        }
    }

    const at = new AccessToken(config.api_key, config.api_secret, { identity, name });
    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: body.canPublish !== false,
        canSubscribe: true,
        canPublishData: true,
        // LIVE PLANÉTAIRE (LP-6) — SANS CE DROIT, LA TRADUCTION EST MORTE.
        //
        // La langue d'écoute de chacun voyage dans SES propres métadonnées de
        // participant : c'est ainsi que les intervenants savent quelles
        // langues produire (`requestedLanguageCounts`). Or LiveKit refuse
        // `setMetadata()` côté client tant que le jeton ne porte pas ce droit
        // — mesuré contre le binaire exact du VPS (1.8.4) : « does not have
        // permission to update own metadata ». L'erreur remontait sans bruit,
        // donc plus aucune langue n'était jamais demandée, plus aucune piste
        // d'interprète n'était produite, et chaque auditeur restait sur
        // l'audio d'origine en croyant attendre une voix qui ne venait pas.
        //
        // Ce droit ne concerne QUE ses propres métadonnées : personne ne peut
        // écrire celles d'un autre participant (`canUpdateOwnMetadata`, pas
        // `roomAdmin`). Un spectateur sans micro (`canPublish: false`) en a
        // besoin autant qu'un intervenant — c'est précisément lui qui choisit
        // sa langue d'écoute sans jamais rien publier.
        canUpdateOwnMetadata: true,
    });

    const token = await at.toJwt();

    return json({ token, serverUrl: config.server_url });
});
