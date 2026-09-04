// SAT-2 — La porte d'entrée d'un direct, décidée CÔTÉ SERVEUR.
//
// Pourquoi ici et pas dans le navigateur : un client peut mentir. Tant que
// l'unique chose qui ouvre la room est le jeton signé, c'est l'émission du
// jeton qui doit refuser — pas un écran qu'on contourne en rechargeant la
// page.
//
// Ce fichier ne contient QUE la décision, sans réseau, sans Deno, sans
// Supabase. C'est délibéré : il est importable tel quel par la suite de
// tests, donc la règle est vérifiée pour de vrai au lieu d'être cherchée
// dans le texte du fichier.
//
// D'où vient le plafond (SAT-0, point décisif) : de LiveKit lui-même.
// `RoomService/ListRooms` renvoie `maxParticipants` pour chaque room. Aucun
// chiffre n'est inventé ici, et aucun n'est écrit en dur : quand SAT-1
// rendra la capacité auto-régulée, il posera cette valeur sur la room et
// cette porte suivra sans qu'on la retouche. C'est exactement « la capacité
// suit l'infra » — la Direction a écarté et la limite fixe et le réglage
// manuel.
//
// ─── POURQUOI ON NE COMPTE PAS AVEC `numParticipants` ───────────────────
//
// Mesuré au banc contre les DEUX binaires (deux vrais navigateurs
// connectés à une vraie room) :
//
//                              1.8.4 (le VPS)      1.13.6 (la cible)
//   listRooms.numParticipants  juste après 1-3 s   juste après 3-6 s
//   listParticipants().length  exact immédiatement exact immédiatement
//   maxParticipants            exact immédiatement exact immédiatement
//
// `numParticipants` est un agrégat à consistance différée. Une porte qui
// s'appuie dessus serait silencieusement inopérante pendant une RUÉE —
// c'est-à-dire précisément au moment qu'elle est censée tenir : le temps
// que le compteur rattrape, des dizaines de personnes seraient déjà
// entrées. On lit donc le plafond dans `listRooms`, et on COMPTE dans
// `listParticipants`, qui donne du même coup la liste des identités
// présentes — le nombre et le contrôle de reconnexion en un seul appel.

/** Première étape : ce que le seul plafond permet de trancher. */
export type CapacityAssessment =
    | { outcome: 'admit'; reason: 'host' | 'cap_unknown' | 'no_limit' }
    | { outcome: 'needs_roster'; capacity: number };

/** Verdict final rendu à l'appelant. */
export type AdmissionVerdict =
    | { admitted: true; reason: 'host' | 'cap_unknown' | 'no_limit' | 'roster_unknown' | 'already_inside' | 'seat_available' }
    | { admitted: false; reason: 'full'; occupied: number; capacity: number };

/**
 * Étape 1 — trancher sur le seul plafond, sans compter personne.
 *
 * Le plus fréquent, de loin : aucun plafond n'est posé, et l'on répond sans
 * payer le moindre appel supplémentaire.
 */
export function assessCapacity(input: {
    /** L'animateur n'est jamais mis à la porte de son propre direct. */
    isHost: boolean;
    /**
     * `maxParticipants` tel que LiveKit le rapporte. **`0` signifie « aucune
     * limite »** — c'est la convention de LiveKit, pas la nôtre. `null` =
     * LiveKit n'a pas répondu.
     */
    maxParticipants: number | null;
}): CapacityAssessment {
    if (input.isHost) return { outcome: 'admit', reason: 'host' };

    // PORTE OUVERTE EN CAS DE DOUTE. Si l'on n'a pas pu lire le plafond, on
    // laisse entrer. Un direct légèrement au-dessus de sa capacité reste un
    // direct ; un direct qui refuse tout le monde parce qu'un appel réseau a
    // hoqueté est une panne que personne ne comprend. Choix délibéré, testé.
    if (input.maxParticipants === null) return { outcome: 'admit', reason: 'cap_unknown' };

    const capacity = Math.trunc(input.maxParticipants);
    // 0 (ou négatif, ou non fini) = aucune limite posée sur cette room. Tant
    // que SAT-1 n'a rien posé, cette porte ne refuse donc personne.
    if (!Number.isFinite(capacity) || capacity <= 0) return { outcome: 'admit', reason: 'no_limit' };

    return { outcome: 'needs_roster', capacity };
}

/**
 * Étape 2 — un plafond existe : on compte, sur la liste réelle.
 *
 * `identities` vient de `listParticipants` : c'est la seule lecture exacte à
 * l'instant présent (voir l'encadré en tête de fichier). Elle sert à deux
 * choses d'un coup — le nombre, et le fait de savoir si cette personne est
 * DÉJÀ dans la room.
 *
 * Ce second point compte vraiment : quelqu'un dont le réseau tombe et qui se
 * reconnecte occupe déjà une place. Le refuser reviendrait à l'expulser d'un
 * direct qu'il n'a jamais quitté, et à laisser sa place bloquée jusqu'à
 * l'expiration côté serveur.
 */
export function decideWithRoster(input: {
    capacity: number;
    /** Identités réellement présentes, ou `null` si la lecture a échoué. */
    identities: readonly string[] | null;
    /** L'identité LiveKit du demandeur. */
    identity: string;
}): AdmissionVerdict {
    // Le plafond est connu mais pas l'occupation : on ne sait pas si c'est
    // plein, donc on laisse entrer. La fermeté ci-dessous ne s'applique qu'à
    // un plein CONSTATÉ.
    if (!input.identities) return { admitted: true, reason: 'roster_unknown' };

    if (input.identities.includes(input.identity)) return { admitted: true, reason: 'already_inside' };

    const occupied = input.identities.length;
    if (occupied < input.capacity) return { admitted: true, reason: 'seat_available' };

    return { admitted: false, reason: 'full', occupied, capacity: input.capacity };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * L'identifiant de session d'un direct, ou `null` si ce nom de room n'en est
 * pas un.
 *
 * Deux exclusions, chacune pour une raison précise :
 *
 * 1. Les rooms d'APPEL (`call-…`) sont hors sujet. Un appel à deux ne sature
 *    rien, et LT-1/LT-2 ont travaillé sa latence au dixième de seconde —
 *    cette porte ne doit rien y ajouter, pas même une lecture.
 * 2. Un nom qui n'est pas un UUID bien formé ne doit JAMAIS partir vers la
 *    base : `live_sessions.id` est de type `uuid`, et un cast raté rend un
 *    `22P02` qui deviendrait un refus au lieu d'un « ce n'est pas un direct ».
 *    Le même piège est déjà consigné côté client (`MoocChatFloating.tsx:82`).
 */
export function liveSessionIdFromRoomName(roomName: string): string | null {
    const trimmed = (roomName ?? '').trim();
    if (!trimmed || trimmed.startsWith('call-')) return null;
    return UUID_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * L'URL HTTP de l'API serveur de LiveKit, déduite de l'URL de transport.
 *
 * La configuration porte l'URL du média (`wss://live.moknet.net`) ; l'API
 * serveur (twirp) vit sur le même hôte, en HTTP. SAT-0 a mesuré qu'elle est
 * déjà routée : `POST /twirp/livekit.RoomService/ListRooms` répond 401 et non
 * 404 — le serveur est bien là, il demande seulement à être authentifié.
 */
export function toLiveKitHttpUrl(serverUrl: string): string {
    const trimmed = (serverUrl ?? '').trim().replace(/\/+$/, '');
    if (trimmed.startsWith('wss://')) return `https://${trimmed.slice('wss://'.length)}`;
    if (trimmed.startsWith('ws://')) return `http://${trimmed.slice('ws://'.length)}`;
    return trimmed;
}
