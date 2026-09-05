// SAT-6 — LE BOUTON DE SECOURS DU DIRECT, RÉSERVÉ À L'ADMIN GÉNÉRAL.
//
// ─── CE QU'IL FAIT, ET CE QU'IL NE PRÉTEND PAS FAIRE ───────────────────────
//
// SAT-5 a laissé une frontière nette : tout ce que l'application répare seule
// (relance bornée d'une ligne, clôture horaire des zombies) et tout ce qui
// exige SSH sur le VPS (redémarrer le conteneur, refaire tourner une clé,
// rouvrir des ports, monter de version). Entre les deux, il restait deux
// gestes qu'un humain doit pouvoir faire SANS SSH, parce que la fonction Edge
// détient déjà les identifiants de l'API serveur de LiveKit :
//
//   • RELANCER LA ROOM d'un direct — `DeleteRoom` côté LiveKit. Les lignes de
//     tous les participants tombent avec la raison ROOM_DELETED, et SAT-5 les
//     relance seul dans une room neuve, en ~1,5 s (mesuré au banc : cas C1).
//     C'est le geste contre une room dont l'état s'est abîmé alors que le
//     serveur, lui, répond.
//   • CLORE UN DIRECT — `ended_at` posé en base, puis la room supprimée. Chaque
//     écran lit « Ce direct est terminé. » et ne redemande AUCUN jeton (SAT-5,
//     cas C4).
//
// Ce fichier ne redémarre rien sur le VPS et ne le laisse pas croire : la
// liste des gestes SSH est portée par l'écran, à part, comme « action
// humaine ».
//
// ─── POURQUOI CE FICHIER NE FAIT AUCUN RÉSEAU ──────────────────────────────
//
// Même choix que `liveTransportProbe.ts` : la DÉCISION vit ici, les accès au
// monde (base, LiveKit, journal, signature) arrivent par des PORTS injectés.
// La suite de tests exécute donc ce flux tel quel, et le banc réel l'exécute
// aussi tel quel, avec de vrais ports — jamais une imitation.
//
// Séquence, la même que pour toute réparation du gardien :
//
//   DIAGNOSTIQUER → CONFIRMER (jeton signé, 5 min) → APPLIQUER → VÉRIFIER → JOURNALISER
//
// Et le rang n'est jamais lu dans une case d'interface : il vient de la base
// (`health_my_rank`, SECURITY DEFINER sur `profiles.role`), à CHAQUE étape,
// y compris au moment d'appliquer — un jeton volé à un Admin Général ne sert
// à rien à quelqu'un d'autre, et un Admin Général rétrogradé entre le
// diagnostic et le clic est refusé.

export type LiveEmergencyAction = 'relaunch_room' | 'close_session';

export const LIVE_EMERGENCY_ACTIONS: readonly LiveEmergencyAction[] = ['relaunch_room', 'close_session'];

/** Identifiant de journal : ce sous quoi chaque geste apparaît dans `audit_logs`. */
export const LIVE_EMERGENCY_LINE_ID = 'live.secours';
export const LIVE_EMERGENCY_JOURNAL_ACTION = 'health.emergency';

export const CONFIRMATION_TTL_MS = 5 * 60_000;

export interface LiveEmergencyRank {
    role: string | null;
    canRead: boolean;
    /** Vrai pour l'Admin Général (`super_admin`) seulement. */
    canRepair: boolean;
}

export interface LiveEmergencySession {
    id: string;
    title: string | null;
    hostId: string | null;
    hostName: string | null;
    startedAt: string | null;
    endedAt: string | null;
}

/** Ce que LiveKit rapporte d'une room. `null` = pas de room ; `'unavailable'` = LiveKit n'a pas répondu. */
export interface LiveEmergencyRoom {
    sid: string;
    creationTime: number | null;
}
export type RoomObservation = LiveEmergencyRoom | null | 'unavailable';

export interface EmergencyClaims {
    action: LiveEmergencyAction;
    sessionId: string;
    actorId: string;
    exp: number;
}

export interface LiveEmergencyPorts {
    /** Rang de l'appelant, tel que la BASE le rapporte. */
    rank(): Promise<LiveEmergencyRank>;
    listOpenSessions(): Promise<LiveEmergencySession[]>;
    readSession(sessionId: string): Promise<LiveEmergencySession | null>;
    observeRoom(sessionId: string): Promise<RoomObservation>;
    /** Identités présentes, ou `null` si LiveKit n'a pas répondu. */
    listParticipants(sessionId: string): Promise<string[] | null>;
    /** `true` si LiveKit a accepté la suppression. */
    deleteRoom(sessionId: string): Promise<boolean>;
    /** Pose `ended_at` AVEC l'identité de l'appelant (RLS : animateur ou admin). */
    closeSession(sessionId: string): Promise<{ closed: boolean; endedAt: string | null }>;
    journal(entry: { actorId: string; metadata: Record<string, unknown> }): Promise<string | null>;
    sign(claims: EmergencyClaims): Promise<string>;
    verify(token: string): Promise<EmergencyClaims | null>;
    now(): number;
}

export interface EmergencyReply {
    status: number;
    body: Record<string, unknown>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLiveEmergencyAction(value: unknown): value is LiveEmergencyAction {
    return typeof value === 'string' && (LIVE_EMERGENCY_ACTIONS as readonly string[]).includes(value);
}

function reply(status: number, body: Record<string, unknown>): EmergencyReply {
    return { status, body };
}

/**
 * Le refus, formulé avec le rang RÉEL renvoyé par la base. Jamais un
 * masquage d'interface : quelqu'un qui forge la requête reçoit exactement
 * ceci.
 */
function refuseRank(rank: LiveEmergencyRank): EmergencyReply {
    return reply(403, {
        error: `Réservé à l'Admin Général (rôle super_admin) — votre rang selon la base : ${rank.role ?? 'aucun'}.`,
        code: 'emergency_forbidden',
        rank,
    });
}

/** La room et ses présents, lus ensemble — ce que le diagnostic montre. */
async function observe(ports: LiveEmergencyPorts, sessionId: string) {
    const [room, participants] = await Promise.all([
        ports.observeRoom(sessionId),
        ports.listParticipants(sessionId),
    ]);
    return { room, participants };
}

export function describeRoom(room: RoomObservation, participants: string[] | null): string {
    if (room === 'unavailable') return "LiveKit n'a pas répondu : état de la room inconnu.";
    if (room === null) return 'Aucune room active sur LiveKit pour ce direct.';
    const n = participants === null ? 'nombre de présents inconnu' : `${participants.length} présent(s)`;
    return `Room active sur LiveKit (${n}).`;
}

// ─────────────────────────── ÉTAT DES DIRECTS ───────────────────────────

export async function overview(ports: LiveEmergencyPorts): Promise<EmergencyReply> {
    const rank = await ports.rank();
    if (!rank.canRead) {
        return reply(403, { error: `Lecture réservée aux administrateurs — votre rang selon la base : ${rank.role ?? 'aucun'}.`, rank });
    }
    const sessions = await ports.listOpenSessions();
    const rows = await Promise.all(sessions.map(async (session) => {
        const { room, participants } = await observe(ports, session.id);
        return {
            ...session,
            roomPresent: room === 'unavailable' ? null : room !== null,
            roomSid: room && room !== 'unavailable' ? room.sid : null,
            participantCount: participants === null ? null : participants.length,
            roomState: describeRoom(room, participants),
        };
    }));
    return reply(200, { sessions: rows, rank, ranAt: new Date(ports.now()).toISOString() });
}

// ─────────────────────────── DIAGNOSTIQUER ───────────────────────────

export interface DiagnoseInput {
    action: unknown;
    sessionId: unknown;
    actorId: string;
}

export async function diagnose(ports: LiveEmergencyPorts, input: DiagnoseInput): Promise<EmergencyReply> {
    if (!isLiveEmergencyAction(input.action)) {
        return reply(400, { error: `Geste de secours inconnu. Attendu : ${LIVE_EMERGENCY_ACTIONS.join(', ')}.` });
    }
    if (typeof input.sessionId !== 'string' || !UUID_PATTERN.test(input.sessionId)) {
        return reply(400, { error: 'sessionId (UUID du direct) requis.' });
    }
    const action = input.action;
    const sessionId = input.sessionId;

    // Le rang d'abord, AVANT la moindre lecture du direct : un non-admin ne
    // doit même pas apprendre si ce direct existe.
    const rank = await ports.rank();
    if (!rank.canRepair) return refuseRank(rank);

    const session = await ports.readSession(sessionId);
    if (!session) return reply(404, { error: 'Direct introuvable.', code: 'session_not_found' });
    if (session.endedAt) {
        return reply(409, { error: 'Ce direct est déjà clos : il n\'y a rien à secourir.', code: 'session_already_closed', session });
    }

    const { room, participants } = await observe(ports, sessionId);
    const participantCount = participants === null ? null : participants.length;

    // Relancer une room qui n'existe pas ne ferait rien : on le dit AVANT
    // la confirmation, pas après un clic sans effet.
    const nothingToDo = action === 'relaunch_room' && room === null;

    const claims: EmergencyClaims = { action, sessionId, actorId: input.actorId, exp: ports.now() + CONFIRMATION_TTL_MS };

    return reply(200, {
        action,
        sessionId,
        session,
        roomPresent: room === 'unavailable' ? null : room !== null,
        roomSid: room && room !== 'unavailable' ? room.sid : null,
        participantCount,
        roomState: describeRoom(room, participants),
        summary: summarize(action, session, room, participantCount),
        nothingToDo,
        confirmationToken: nothingToDo ? null : await ports.sign(claims),
        expiresAt: new Date(claims.exp).toISOString(),
        rank,
    });
}

export function summarize(
    action: LiveEmergencyAction,
    session: LiveEmergencySession,
    room: RoomObservation,
    participantCount: number | null,
): string {
    const titre = session.title ? `« ${session.title} »` : 'ce direct';
    const presents = participantCount === null ? 'un nombre inconnu de présents' : `${participantCount} présent(s)`;
    if (action === 'relaunch_room') {
        if (room === null) return `Aucune room active pour ${titre} : il n'y a rien à relancer.`;
        if (room === 'unavailable') return `LiveKit ne répond pas : la relance de ${titre} sera tentée sans connaître l'état actuel.`;
        return `La room de ${titre} sera supprimée côté LiveKit ; ${presents} verront leur ligne tomber puis se rétablir seule dans une room neuve (SAT-5), sans que le direct soit clos.`;
    }
    return `${titre} sera clos en base (ended_at) et sa room supprimée ; ${presents} liront « Ce direct est terminé. » et aucune ligne ne se relancera. Ce geste n'est pas réversible.`;
}

// ─────────────────────────── APPLIQUER ───────────────────────────

export interface ApplyInput {
    action: unknown;
    sessionId: unknown;
    confirmationToken: unknown;
    actorId: string;
}

export type EmergencyVerdict = 'verified' | 'unverified' | 'failed';

/**
 * Le verdict d'une relance : la room d'AVANT a-t-elle disparu ?
 *
 * Juste après `DeleteRoom`, deux observations sont possibles et toutes deux
 * prouvent la relance : soit la room est absente, soit une room NEUVE existe
 * déjà (les participants sont revenus si vite que LiveKit l'a recréée) — et
 * elle porte un autre `sid`. Seule une room au MÊME `sid` prouve que rien ne
 * s'est passé.
 */
export function judgeRelaunch(before: RoomObservation, after: RoomObservation): EmergencyVerdict {
    if (after === 'unavailable') return 'unverified';
    if (after === null) return 'verified';
    if (before && before !== 'unavailable' && before.sid === after.sid) return 'failed';
    return 'verified';
}

export function judgeClose(session: LiveEmergencySession | null): EmergencyVerdict {
    if (!session) return 'unverified';
    return session.endedAt ? 'verified' : 'failed';
}

export async function apply(ports: LiveEmergencyPorts, input: ApplyInput): Promise<EmergencyReply> {
    if (!isLiveEmergencyAction(input.action)) {
        return reply(400, { error: `Geste de secours inconnu. Attendu : ${LIVE_EMERGENCY_ACTIONS.join(', ')}.` });
    }
    if (typeof input.sessionId !== 'string' || !UUID_PATTERN.test(input.sessionId)) {
        return reply(400, { error: 'sessionId (UUID du direct) requis.' });
    }
    if (typeof input.confirmationToken !== 'string' || !input.confirmationToken) {
        return reply(400, { error: 'confirmationToken requis : le diagnostic précède toujours le geste.' });
    }
    const action = input.action;
    const sessionId = input.sessionId;

    const claims = await ports.verify(input.confirmationToken);
    if (!claims || claims.exp < ports.now()) {
        return reply(400, { error: 'Confirmation invalide ou expirée. Relancez le diagnostic.', code: 'confirmation_invalid' });
    }
    if (claims.actorId !== input.actorId || claims.action !== action || claims.sessionId !== sessionId) {
        return reply(403, { error: "Cette confirmation ne correspond pas au geste demandé.", code: 'confirmation_mismatch' });
    }

    // Le rang est RELU ici, pas seulement au diagnostic.
    const rank = await ports.rank();
    if (!rank.canRepair) return refuseRank(rank);

    const session = await ports.readSession(sessionId);
    if (!session) return reply(404, { error: 'Direct introuvable.', code: 'session_not_found' });
    if (session.endedAt) {
        return reply(409, { error: 'Ce direct a été clos entre votre confirmation et le geste : rien n\'a été fait.', code: 'session_already_closed', session });
    }

    const before = await observe(ports, sessionId);
    const participantsBefore = before.participants === null ? null : before.participants.length;
    const roomSidBefore = before.room && before.room !== 'unavailable' ? before.room.sid : null;

    let verdict: EmergencyVerdict;
    let measuredAfter: string;
    let roomSidAfter: string | null = null;
    let endedAt: string | null = null;
    let deleted = false;

    if (action === 'relaunch_room') {
        if (before.room === null) {
            return reply(409, { error: 'Aucune room active : il n\'y a rien à relancer. Rien n\'a été fait.', code: 'nothing_to_relaunch' });
        }
        deleted = await ports.deleteRoom(sessionId);
        const after = deleted ? await ports.observeRoom(sessionId) : 'unavailable';
        roomSidAfter = after && after !== 'unavailable' ? after.sid : null;
        verdict = deleted ? judgeRelaunch(before.room, after) : 'failed';
        measuredAfter = !deleted
            ? "LiveKit a refusé ou n'a pas répondu à la suppression : la room est inchangée."
            : verdict === 'verified'
                ? (after === null
                    ? 'Room supprimée ; les participants se relancent seuls (SAT-5).'
                    : 'Room supprimée et déjà recréée par les participants revenus (nouvel identifiant).')
                : verdict === 'failed'
                    ? "La room porte toujours le même identifiant : la suppression n'a pas eu d'effet."
                    : "Suppression acceptée, mais LiveKit n'a pas répondu à la vérification.";
    } else {
        const closing = await ports.closeSession(sessionId);
        endedAt = closing.endedAt;
        if (!closing.closed) {
            // La base a refusé (RLS : ni animateur, ni admin) ou la ligne a
            // bougé : on n'y touche pas davantage, et on ne supprime pas la room
            // d'un direct qui reste ouvert.
            return reply(403, {
                error: "La base n'a pas accepté la clôture : aucune ligne modifiée. Rien n'a été fait sur LiveKit.",
                code: 'close_refused_by_database',
            });
        }
        deleted = before.room === null ? true : await ports.deleteRoom(sessionId);
        const fresh = await ports.readSession(sessionId);
        verdict = judgeClose(fresh);
        const roomAfter = await ports.observeRoom(sessionId);
        roomSidAfter = roomAfter && roomAfter !== 'unavailable' ? roomAfter.sid : null;
        measuredAfter = verdict === 'verified'
            ? (deleted
                ? 'Direct clos en base et room supprimée : chaque écran lit « Ce direct est terminé. ».'
                : "Direct clos en base ; LiveKit n'a pas confirmé la suppression de la room — les lignes tomberont sans se relancer (la garde SAT-5 lit la base).")
            : verdict === 'failed'
                ? "La base ne montre pas ended_at après l'écriture : clôture non confirmée."
                : 'Relecture du direct impossible après la clôture.';
    }

    const statusAfter = verdict === 'verified' ? 'vert' : verdict === 'failed' ? 'rouge' : 'orange';

    const journalId = await ports.journal({
        actorId: input.actorId,
        metadata: {
            remediationId: `${LIVE_EMERGENCY_LINE_ID}.${action}`,
            action,
            sessionId,
            title: session.title,
            hostId: session.hostId,
            participantsBefore,
            roomSidBefore,
            roomSidAfter,
            roomDeleted: deleted,
            endedAt,
            verdict,
            statusAfter,
            measuredAfter,
            changedCount: verdict === 'failed' ? 0 : 1,
        },
    });

    return reply(200, {
        action,
        sessionId,
        ok: verdict !== 'failed',
        verdict,
        participantsBefore,
        roomSidBefore,
        roomSidAfter,
        endedAt,
        journalId,
        message: journalId
            ? measuredAfter
            : `${measuredAfter} Mais la journalisation a échoué — à signaler.`,
        statusAfter,
        rank,
    });
}
