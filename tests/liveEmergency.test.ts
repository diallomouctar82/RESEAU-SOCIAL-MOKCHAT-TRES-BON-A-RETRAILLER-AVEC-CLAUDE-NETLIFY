import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    apply,
    CONFIRMATION_TTL_MS,
    diagnose,
    isLiveEmergencyAction,
    judgeClose,
    judgeRelaunch,
    LIVE_EMERGENCY_ACTIONS,
    LIVE_EMERGENCY_LINE_ID,
    overview,
    type EmergencyClaims,
    type LiveEmergencyPorts,
    type LiveEmergencyRank,
    type LiveEmergencySession,
    type RoomObservation,
} from '../supabase/functions/health-guardian/liveEmergency';
import { LIVE_EMERGENCY_CATALOGUE } from '../services/health/liveEmergency';

/**
 * SAT-6 — le bouton de secours du direct, réservé à l'Admin Général.
 *
 * Le flux Edge est exécuté ICI, tel quel, avec des ports factices qui
 * ENREGISTRENT ce qui leur est demandé. Ce que ces tests fixent :
 *
 *   • le rang vient de la base à CHAQUE étape, jamais du corps de la requête ;
 *   • un non-admin ne déclenche jamais un port d'écriture — pas même une
 *     lecture du direct ;
 *   • la confirmation est liée au geste, au direct et à la personne ;
 *   • le verdict vient d'une re-mesure, jamais du succès de l'écriture ;
 *   • tout geste appliqué est journalisé, avec ses chiffres.
 *
 * Contre-épreuves : plusieurs `it` retirent une garde par une entrée
 * adverse et vérifient que le flux la refuse — un test qui ne pourrait pas
 * rougir ne prouverait rien.
 */

const ADMIN: LiveEmergencyRank = { role: 'super_admin', canRead: true, canRepair: true };
const ADMIN_SIMPLE: LiveEmergencyRank = { role: 'admin', canRead: true, canRepair: false };
const MEMBRE: LiveEmergencyRank = { role: 'user', canRead: false, canRepair: false };

const SID = '11111111-2222-4333-8444-555555555555';
const ACTOR = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function session(over: Partial<LiveEmergencySession> = {}): LiveEmergencySession {
    return { id: SID, title: 'Direct de preuve', hostId: 'h', hostName: 'Awa', startedAt: '2026-09-05T08:00:00Z', endedAt: null, ...over };
}

interface FakeOptions {
    rank?: LiveEmergencyRank | LiveEmergencyRank[];
    session?: LiveEmergencySession | null;
    room?: RoomObservation | RoomObservation[];
    participants?: string[] | null;
    deleteOk?: boolean;
    closeOk?: boolean;
    journalId?: string | null;
    now?: number;
}

/** Ports factices : chaque appel est consigné dans `calls`. */
function fakePorts(opts: FakeOptions = {}) {
    const calls: string[] = [];
    const ranks = Array.isArray(opts.rank) ? [...opts.rank] : [opts.rank ?? ADMIN];
    const rooms = Array.isArray(opts.room) ? [...opts.room] : null;
    let current = opts.session === undefined ? session() : opts.session;
    const journalEntries: Record<string, unknown>[] = [];
    const now = opts.now ?? 1_700_000_000_000;
    const ports: LiveEmergencyPorts = {
        async rank() { calls.push('rank'); return ranks.length > 1 ? ranks.shift()! : ranks[0]; },
        async listOpenSessions() { calls.push('listOpenSessions'); return current && !current.endedAt ? [current] : []; },
        async readSession(id) { calls.push(`readSession:${id}`); return current && current.id === id ? current : null; },
        async observeRoom(id) {
            calls.push(`observeRoom:${id}`);
            if (rooms) return rooms.length > 1 ? rooms.shift()! : rooms[0];
            return opts.room === undefined ? { sid: 'RM_avant', creationTime: 1 } : (opts.room as RoomObservation);
        },
        async listParticipants(id) { calls.push(`listParticipants:${id}`); return opts.participants === undefined ? ['a', 'b'] : opts.participants; },
        async deleteRoom(id) { calls.push(`deleteRoom:${id}`); return opts.deleteOk !== false; },
        async closeSession(id) {
            calls.push(`closeSession:${id}`);
            if (opts.closeOk === false) return { closed: false, endedAt: null };
            current = current ? { ...current, endedAt: '2026-09-05T09:00:00Z' } : null;
            return { closed: true, endedAt: '2026-09-05T09:00:00Z' };
        },
        async journal(entry) { calls.push('journal'); journalEntries.push(entry.metadata); return opts.journalId === undefined ? 'J1' : opts.journalId; },
        async sign(claims) { return `signed:${JSON.stringify(claims)}`; },
        async verify(token) {
            if (!token.startsWith('signed:')) return null;
            try { return JSON.parse(token.slice('signed:'.length)) as EmergencyClaims; } catch { return null; }
        },
        now: () => now,
    };
    return { ports, calls, journalEntries, now };
}

const ecritures = (calls: string[]) => calls.filter((c) => /^(deleteRoom|closeSession|journal)/.test(c));

describe('SAT-6 — catalogue et parité client / Edge', () => {
    it('deux gestes, ni plus ni moins, et le client en connaît exactement les mêmes', () => {
        expect([...LIVE_EMERGENCY_ACTIONS]).toEqual(['relaunch_room', 'close_session']);
        expect(Object.keys(LIVE_EMERGENCY_CATALOGUE).sort()).toEqual([...LIVE_EMERGENCY_ACTIONS].sort());
        expect(isLiveEmergencyAction('relaunch_room')).toBe(true);
        expect(isLiveEmergencyAction('restart_vps')).toBe(false); // un geste SSH n'existe pas ici
        expect(isLiveEmergencyAction(undefined)).toBe(false);
    });

    it("le journal porte un identifiant de ligne dédié, que l'écran sait nommer", () => {
        expect(LIVE_EMERGENCY_LINE_ID).toBe('live.secours');
        const ecran = readFileSync(join(resolve(__dirname, '..'), 'components/admin/AdminHealthTab.tsx'), 'utf8');
        expect(ecran).toContain("'health.emergency'");
    });
});

describe('SAT-6 — état des directs (lecture)', () => {
    it('un membre ordinaire est refusé AVANT toute lecture, avec son rang réel', async () => {
        const { ports, calls } = fakePorts({ rank: MEMBRE });
        const r = await overview(ports);
        expect(r.status).toBe(403);
        expect(String(r.body.error)).toContain('user');
        expect(calls).toEqual(['rank']);
    });

    it('un administrateur lit, et voit la room et ses présents', async () => {
        const { ports } = fakePorts({ rank: ADMIN_SIMPLE });
        const r = await overview(ports);
        expect(r.status).toBe(200);
        const rows = r.body.sessions as { roomPresent: boolean | null; participantCount: number | null; roomSid: string | null }[];
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ roomPresent: true, participantCount: 2, roomSid: 'RM_avant' });
    });

    it("LiveKit muet → « inconnu », jamais « absent » (on ne déclare pas une room morte faute de réponse)", async () => {
        const { ports } = fakePorts({ room: 'unavailable', participants: null });
        const r = await overview(ports);
        const rows = r.body.sessions as { roomPresent: boolean | null; participantCount: number | null; roomState: string }[];
        expect(rows[0].roomPresent).toBeNull();
        expect(rows[0].participantCount).toBeNull();
        expect(rows[0].roomState).toMatch(/inconnu/);
    });
});

describe('SAT-6 — diagnostic', () => {
    it("un geste inconnu ou un identifiant mal formé sont refusés sans toucher à la base", async () => {
        const { ports, calls } = fakePorts();
        expect((await diagnose(ports, { action: 'restart_vps', sessionId: SID, actorId: ACTOR })).status).toBe(400);
        expect((await diagnose(ports, { action: 'relaunch_room', sessionId: "'; drop table", actorId: ACTOR })).status).toBe(400);
        expect(calls).toEqual([]);
    });

    it("un administrateur SIMPLE (pas Admin Général) est refusé par le rang de la base, avant de lire le direct", async () => {
        const { ports, calls } = fakePorts({ rank: ADMIN_SIMPLE });
        const r = await diagnose(ports, { action: 'relaunch_room', sessionId: SID, actorId: ACTOR });
        expect(r.status).toBe(403);
        expect(r.body.code).toBe('emergency_forbidden');
        expect(String(r.body.error)).toContain('admin');
        expect(calls).toEqual(['rank']);
    });

    it("l'Admin Général obtient le périmètre exact et un jeton lié (geste, direct, personne, expiration)", async () => {
        const { ports, now } = fakePorts();
        const r = await diagnose(ports, { action: 'relaunch_room', sessionId: SID, actorId: ACTOR });
        expect(r.status).toBe(200);
        expect(r.body.participantCount).toBe(2);
        expect(r.body.nothingToDo).toBe(false);
        const claims = JSON.parse(String(r.body.confirmationToken).slice('signed:'.length)) as EmergencyClaims;
        expect(claims).toEqual({ action: 'relaunch_room', sessionId: SID, actorId: ACTOR, exp: now + CONFIRMATION_TTL_MS });
        expect(String(r.body.summary)).toMatch(/se rétablir seule/);
    });

    it('un direct déjà clos ne se secourt pas (409), et une room absente ne se relance pas (aucun jeton)', async () => {
        const clos = fakePorts({ session: session({ endedAt: '2026-09-05T08:30:00Z' }) });
        expect((await diagnose(clos.ports, { action: 'close_session', sessionId: SID, actorId: ACTOR })).status).toBe(409);

        const sansRoom = fakePorts({ room: null, participants: null });
        const r = await diagnose(sansRoom.ports, { action: 'relaunch_room', sessionId: SID, actorId: ACTOR });
        expect(r.status).toBe(200);
        expect(r.body.nothingToDo).toBe(true);
        expect(r.body.confirmationToken).toBeNull();
    });

    it("clore un direct sans room active reste possible : la clôture est un geste de base d'abord", async () => {
        const { ports } = fakePorts({ room: null, participants: null });
        const r = await diagnose(ports, { action: 'close_session', sessionId: SID, actorId: ACTOR });
        expect(r.body.nothingToDo).toBe(false);
        expect(r.body.confirmationToken).not.toBeNull();
        expect(String(r.body.summary)).toMatch(/pas réversible/);
    });
});

async function jetonPour(ports: LiveEmergencyPorts, action: string, sessionId = SID, actorId = ACTOR) {
    const d = await diagnose(ports, { action, sessionId, actorId });
    return String(d.body.confirmationToken);
}

describe('SAT-6 — appliquer : les gardes', () => {
    it('sans jeton, ou avec un jeton forgé, rien ne part', async () => {
        const { ports, calls } = fakePorts();
        expect((await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: '', actorId: ACTOR })).status).toBe(400);
        expect((await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: 'forgé', actorId: ACTOR })).status).toBe(400);
        expect(ecritures(calls)).toEqual([]);
    });

    it("un jeton expiré est refusé", async () => {
        const a = fakePorts({ now: 1_000 });
        const token = await jetonPour(a.ports, 'relaunch_room');
        const b = fakePorts({ now: 1_000 + CONFIRMATION_TTL_MS + 1 });
        const r = await apply(b.ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(400);
        expect(r.body.code).toBe('confirmation_invalid');
        expect(ecritures(b.calls)).toEqual([]);
    });

    it("CONTRE-ÉPREUVE — un jeton diagnostiqué pour RELANCER ne clôt pas ; pour CE direct ne touche pas un autre ; pour CETTE personne ne sert pas à une autre", async () => {
        const { ports, calls } = fakePorts();
        const token = await jetonPour(ports, 'relaunch_room');
        const autreGeste = await apply(ports, { action: 'close_session', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        const autreDirect = await apply(ports, { action: 'relaunch_room', sessionId: '99999999-2222-4333-8444-555555555555', confirmationToken: token, actorId: ACTOR });
        const autrePersonne = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee' });
        for (const r of [autreGeste, autreDirect, autrePersonne]) {
            expect(r.status).toBe(403);
            expect(r.body.code).toBe('confirmation_mismatch');
        }
        expect(ecritures(calls)).toEqual([]);
    });

    it("CONTRE-ÉPREUVE — Admin Général au diagnostic, rétrogradé au clic : la base refuse, rien ne part", async () => {
        const { ports, calls } = fakePorts({ rank: [ADMIN, MEMBRE] });
        const token = await jetonPour(ports, 'relaunch_room');
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(403);
        expect(r.body.code).toBe('emergency_forbidden');
        expect(ecritures(calls)).toEqual([]);
    });

    it('le direct clos entre la confirmation et le clic : 409, rien ne part', async () => {
        const { ports, calls } = fakePorts();
        const token = await jetonPour(ports, 'relaunch_room');
        await ports.closeSession(SID); // quelqu'un d'autre l'a clos entre-temps
        calls.length = 0;
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(409);
        expect(r.body.code).toBe('session_already_closed');
        expect(ecritures(calls)).toEqual([]);
    });
});

describe('SAT-6 — relancer la room', () => {
    it("supprime la room, re-mesure, journalise : room absente après = relance vérifiée", async () => {
        const { ports, calls, journalEntries } = fakePorts({ room: [{ sid: 'RM_avant', creationTime: 1 }, { sid: 'RM_avant', creationTime: 1 }, null] });
        const token = await jetonPour(ports, 'relaunch_room');
        calls.length = 0;
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(200);
        expect(r.body.ok).toBe(true);
        expect(r.body.verdict).toBe('verified');
        expect(r.body.participantsBefore).toBe(2);
        expect(r.body.journalId).toBe('J1');
        // L'ordre : rang relu → direct relu → observation → suppression → re-mesure → journal.
        expect(calls.filter((c) => !c.startsWith('listParticipants'))).toEqual([
            'rank', `readSession:${SID}`, `observeRoom:${SID}`, `deleteRoom:${SID}`, `observeRoom:${SID}`, 'journal',
        ]);
        expect(journalEntries[0]).toMatchObject({
            remediationId: 'live.secours.relaunch_room', sessionId: SID, participantsBefore: 2,
            roomSidBefore: 'RM_avant', roomSidAfter: null, verdict: 'verified', statusAfter: 'vert', changedCount: 1,
        });
    });

    it("une room NEUVE déjà recréée par les participants revenus prouve aussi la relance (autre identifiant)", async () => {
        const { ports } = fakePorts({ room: [{ sid: 'RM_avant', creationTime: 1 }, { sid: 'RM_avant', creationTime: 1 }, { sid: 'RM_neuve', creationTime: 2 }] });
        const token = await jetonPour(ports, 'relaunch_room');
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.body.verdict).toBe('verified');
        expect(r.body.roomSidAfter).toBe('RM_neuve');
        expect(String(r.body.message)).toMatch(/recréée/);
    });

    it("CONTRE-ÉPREUVE — la même room au même identifiant après la suppression = ÉCHEC, jamais un succès déduit de l'écriture", async () => {
        const { ports, journalEntries } = fakePorts({ room: { sid: 'RM_avant', creationTime: 1 } });
        const token = await jetonPour(ports, 'relaunch_room');
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(200);
        expect(r.body.ok).toBe(false);
        expect(r.body.verdict).toBe('failed');
        expect(journalEntries[0]).toMatchObject({ verdict: 'failed', statusAfter: 'rouge', changedCount: 0 });
    });

    it("LiveKit refuse la suppression → échec dit tel quel ; LiveKit muet à la re-mesure → « non vérifié », pas vert", async () => {
        const refus = fakePorts({ deleteOk: false });
        const t1 = await jetonPour(refus.ports, 'relaunch_room');
        const r1 = await apply(refus.ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: t1, actorId: ACTOR });
        expect(r1.body.verdict).toBe('failed');
        expect(String(r1.body.message)).toMatch(/refusé ou n'a pas répondu/);

        const muet = fakePorts({ room: [{ sid: 'RM_avant', creationTime: 1 }, { sid: 'RM_avant', creationTime: 1 }, 'unavailable'] });
        const t2 = await jetonPour(muet.ports, 'relaunch_room');
        const r2 = await apply(muet.ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: t2, actorId: ACTOR });
        expect(r2.body.verdict).toBe('unverified');
        expect(r2.body.statusAfter).toBe('orange');
    });

    it('la room a disparu entre le diagnostic et le clic : 409, rien à relancer, rien de journalisé', async () => {
        const { ports, calls } = fakePorts({ room: [{ sid: 'RM_avant', creationTime: 1 }, null] });
        const token = await jetonPour(ports, 'relaunch_room');
        calls.length = 0;
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(409);
        expect(r.body.code).toBe('nothing_to_relaunch');
        expect(ecritures(calls)).toEqual([]);
    });

    it('la journalisation en échec est DITE dans la réponse, jamais avalée', async () => {
        const { ports } = fakePorts({ journalId: null, room: [{ sid: 'RM_avant', creationTime: 1 }, { sid: 'RM_avant', creationTime: 1 }, null] });
        const token = await jetonPour(ports, 'relaunch_room');
        const r = await apply(ports, { action: 'relaunch_room', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.body.journalId).toBeNull();
        expect(String(r.body.message)).toMatch(/journalisation a échoué/);
    });
});

describe('SAT-6 — clore un direct', () => {
    it("clôt en base AVEC l'identité de l'appelant, puis supprime la room, puis re-lit la base", async () => {
        const { ports, calls, journalEntries } = fakePorts({ room: [{ sid: 'RM', creationTime: 1 }, { sid: 'RM', creationTime: 1 }, null] });
        const token = await jetonPour(ports, 'close_session');
        calls.length = 0;
        const r = await apply(ports, { action: 'close_session', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(200);
        expect(r.body.verdict).toBe('verified');
        expect(r.body.endedAt).toBe('2026-09-05T09:00:00Z');
        const ordre = calls.filter((c) => /^(closeSession|deleteRoom|readSession|journal)/.test(c));
        expect(ordre).toEqual([`readSession:${SID}`, `closeSession:${SID}`, `deleteRoom:${SID}`, `readSession:${SID}`, 'journal']);
        expect(journalEntries[0]).toMatchObject({ remediationId: 'live.secours.close_session', verdict: 'verified', roomDeleted: true });
        expect(String(r.body.message)).toMatch(/Ce direct est terminé/);
    });

    it("CONTRE-ÉPREUVE — la base refuse la clôture (RLS : ni animateur ni admin) → 403, et la room n'est PAS supprimée", async () => {
        const { ports, calls } = fakePorts({ closeOk: false });
        const token = await jetonPour(ports, 'close_session');
        calls.length = 0;
        const r = await apply(ports, { action: 'close_session', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.status).toBe(403);
        expect(r.body.code).toBe('close_refused_by_database');
        expect(calls.some((c) => c.startsWith('deleteRoom'))).toBe(false);
        expect(calls.includes('journal')).toBe(false);
    });

    it("sans room active, la clôture est un geste de base seul, et reste vérifiée", async () => {
        const { ports, calls } = fakePorts({ room: null, participants: null });
        const token = await jetonPour(ports, 'close_session');
        const r = await apply(ports, { action: 'close_session', sessionId: SID, confirmationToken: token, actorId: ACTOR });
        expect(r.body.verdict).toBe('verified');
        expect(calls.some((c) => c.startsWith('deleteRoom'))).toBe(false);
    });
});

describe('SAT-6 — les verdicts, en isolation', () => {
    it('relance : absent → vérifié ; autre sid → vérifié ; même sid → échec ; muet → non vérifié', () => {
        const avant: RoomObservation = { sid: 'A', creationTime: 1 };
        expect(judgeRelaunch(avant, null)).toBe('verified');
        expect(judgeRelaunch(avant, { sid: 'B', creationTime: 2 })).toBe('verified');
        expect(judgeRelaunch(avant, { sid: 'A', creationTime: 1 })).toBe('failed');
        expect(judgeRelaunch(avant, 'unavailable')).toBe('unverified');
        // Sans observation d'avant, on ne peut pas prouver l'échec : une room présente est prise pour neuve.
        expect(judgeRelaunch('unavailable', { sid: 'A', creationTime: 1 })).toBe('verified');
    });

    it('clôture : ended_at posé → vérifié ; absent → échec ; relecture impossible → non vérifié', () => {
        expect(judgeClose(session({ endedAt: 'x' }))).toBe('verified');
        expect(judgeClose(session())).toBe('failed');
        expect(judgeClose(null)).toBe('unverified');
    });
});
