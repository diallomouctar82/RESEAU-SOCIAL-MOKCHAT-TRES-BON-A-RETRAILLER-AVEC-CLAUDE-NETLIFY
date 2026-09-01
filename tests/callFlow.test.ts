import { describe, expect, it } from 'vitest';
import {
    computeCallLatency,
    dedupeCallId,
    formatLatency,
    isHandledElsewhere,
    SEEN_CALL_IDS_MAX,
    sessionFromPushPayload,
    shouldStopRingingFor,
} from '../services/calls/callFlow';

/**
 * Mission VF (appels) — fonctions pures du flux d'appel.
 *
 * Chaque test fixe un engagement précis :
 *  - VF-3 : la latence est calculée depuis des instants RÉELS, jamais
 *    inventée (null tant qu'un instant manque), et un transport connecté
 *    AVANT le décroché (pré-connexion) donne 0, pas un négatif ;
 *  - VF-2 : tout signal autre qu'une invitation fait taire la sonnerie et
 *    le retour d'appel ; `call_handled_elsewhere` ne ferme que l'appel qui
 *    SONNE ici (jamais celui que j'ai moi-même décroché) ;
 *  - VF-1 : un même appel (broadcast + push) n'ouvre qu'un seul écran ; une
 *    session construite depuis un push porte l'identité réelle de
 *    `payload.from` et jamais une caméra non demandée.
 */

describe('computeCallLatency (VF-3 — instants réels, jamais inventés)', () => {
    it('décroché → transport → voix : les trois délais, total depuis l’invitation', () => {
        expect(computeCallLatency({ offerSentAt: 1000, acceptedAt: 5000, connectedAt: 5400, firstRemoteAudioAt: 5900 })).toEqual({
            acceptToConnectedMs: 400,
            acceptToAudioMs: 900,
            totalMs: 4900,
        });
    });

    it('pré-connexion : transport connecté AVANT le décroché → 0 ms, jamais un délai négatif', () => {
        const latency = computeCallLatency({ ringStartedAt: 1000, acceptedAt: 6000, connectedAt: 2500, firstRemoteAudioAt: 6050 });
        expect(latency.acceptToConnectedMs).toBe(0);
        expect(latency.acceptToAudioMs).toBe(50);
        expect(latency.totalMs).toBe(5050);
    });

    it('instant manquant → null pour le délai concerné (aucun chiffre inventé)', () => {
        expect(computeCallLatency({ acceptedAt: 5000 })).toEqual({ acceptToConnectedMs: null, acceptToAudioMs: null, totalMs: null });
        expect(computeCallLatency({ acceptedAt: 5000, connectedAt: 5300 })).toEqual({ acceptToConnectedMs: 300, acceptToAudioMs: null, totalMs: null });
        expect(computeCallLatency({})).toEqual({ acceptToConnectedMs: null, acceptToAudioMs: null, totalMs: null });
    });

    it('total : origine = invitation émise (appelant) sinon sonnerie reçue (appelé) ; arrivée = voix sinon transport', () => {
        expect(computeCallLatency({ offerSentAt: 100, ringStartedAt: 900, acceptedAt: 2000, connectedAt: 2200 }).totalMs).toBe(2100);
        expect(computeCallLatency({ ringStartedAt: 900, acceptedAt: 2000, connectedAt: 2200 }).totalMs).toBe(1300);
    });

    it('valeurs non finies (NaN, Infinity) traitées comme absentes', () => {
        expect(computeCallLatency({ acceptedAt: Number.NaN, connectedAt: 5300 }).acceptToConnectedMs).toBeNull();
        expect(computeCallLatency({ acceptedAt: 5000, firstRemoteAudioAt: Number.POSITIVE_INFINITY }).acceptToAudioMs).toBeNull();
    });
});

describe('formatLatency (VF-3 — « 0,9 s », virgule décimale)', () => {
    it('une décimale, virgule française', () => {
        expect(formatLatency(900)).toBe('0,9 s');
        expect(formatLatency(1234)).toBe('1,2 s');
        expect(formatLatency(1250)).toBe('1,3 s');
        expect(formatLatency(12345)).toBe('12,3 s');
        expect(formatLatency(100)).toBe('0,1 s');
    });

    it('sous 100 ms (transport déjà prêt) : jamais un trompeur « 0,0 s »', () => {
        expect(formatLatency(0)).toBe('moins de 0,1 s');
        expect(formatLatency(49)).toBe('moins de 0,1 s');
        expect(formatLatency(99)).toBe('moins de 0,1 s');
    });

    it('entrée invalide → « — », jamais « NaN s »', () => {
        expect(formatLatency(null)).toBe('—');
        expect(formatLatency(undefined)).toBe('—');
        expect(formatLatency(Number.NaN)).toBe('—');
        expect(formatLatency(-5)).toBe('—');
    });
});

describe('shouldStopRingingFor (VF-2 — tout sauf une invitation fait taire)', () => {
    it('accepté, refusé, terminé, annulé, pris en charge ailleurs → arrêt', () => {
        for (const type of ['call_accepted', 'call_rejected', 'call_ended', 'call_cancelled', 'call_handled_elsewhere']) {
            expect(shouldStopRingingFor(type)).toBe(true);
        }
    });

    it('invitation ou signal inconnu → aucun arrêt (jamais une coupure sur un signal incompris)', () => {
        expect(shouldStopRingingFor('call_invitation')).toBe(false);
        expect(shouldStopRingingFor('typing')).toBe(false);
        expect(shouldStopRingingFor(undefined)).toBe(false);
        expect(shouldStopRingingFor(null)).toBe(false);
    });
});

describe('isHandledElsewhere (VF-2 — ne ferme que l’appel qui sonne ICI)', () => {
    const signal = { type: 'call_handled_elsewhere', callId: 'call-7' };

    it('appel qui sonne ici avec le même identifiant → pris en charge ailleurs', () => {
        expect(isHandledElsewhere(signal, { callId: 'call-7', status: 'ringing' })).toBe(true);
    });

    it("appel déjà décroché ICI (connected) → c'est moi qui l'ai pris : un écho de mon signal ne coupe rien", () => {
        expect(isHandledElsewhere(signal, { callId: 'call-7', status: 'connected' })).toBe(false);
    });

    it('autre appel, aucun appel, identifiant manquant, autre type de signal → rien', () => {
        expect(isHandledElsewhere(signal, { callId: 'call-8', status: 'ringing' })).toBe(false);
        expect(isHandledElsewhere(signal, null)).toBe(false);
        expect(isHandledElsewhere({ type: 'call_handled_elsewhere', callId: null }, { callId: 'call-7', status: 'ringing' })).toBe(false);
        expect(isHandledElsewhere({ type: 'call_ended', callId: 'call-7' }, { callId: 'call-7', status: 'ringing' })).toBe(false);
        expect(isHandledElsewhere(null, { callId: 'call-7', status: 'ringing' })).toBe(false);
    });
});

describe('dedupeCallId (VF-1 — un seul écran par appel, registre borné)', () => {
    it('nouveau → true et mémorisé ; déjà vu → false', () => {
        const seen = new Set<string>();
        expect(dedupeCallId(seen, 'call-1')).toBe(true);
        expect(dedupeCallId(seen, 'call-1')).toBe(false);
        expect(dedupeCallId(seen, 'call-2')).toBe(true);
        expect(seen.has('call-1')).toBe(true);
    });

    it('identifiant vide ou absent → false, jamais mémorisé', () => {
        const seen = new Set<string>();
        expect(dedupeCallId(seen, '')).toBe(false);
        expect(dedupeCallId(seen, '   ')).toBe(false);
        expect(dedupeCallId(seen, null)).toBe(false);
        expect(dedupeCallId(seen, undefined)).toBe(false);
        expect(seen.size).toBe(0);
    });

    it('le registre ne grossit jamais au-delà de la borne : le plus ancien sort', () => {
        const seen = new Set<string>();
        for (let i = 0; i < SEEN_CALL_IDS_MAX + 5; i += 1) dedupeCallId(seen, `call-${i}`);
        expect(seen.size).toBe(SEEN_CALL_IDS_MAX);
        expect(seen.has('call-0')).toBe(false);
        expect(seen.has(`call-${SEEN_CALL_IDS_MAX + 4}`)).toBe(true);
    });
});

describe('sessionFromPushPayload (VF-1 — même session qu’un call_invitation)', () => {
    const me = { id: '11111111-1111-4111-8111-111111111111', name: 'Amina', avatarUrl: '/amina.png' };
    const payload = {
        type: 'incoming_call',
        ts: 1_700_000_000_000,
        callId: 'call-42',
        conversationId: '22222222-2222-4222-8222-222222222222',
        from: { id: '33333333-3333-4333-8333-333333333333', name: 'Ivan', avatarUrl: '/ivan.png' },
        callType: 'video' as const,
    };

    it('construit une session entrante qui sonne, appelant = payload.from, moi = destinataire', () => {
        const session = sessionFromPushPayload(payload, me, 1_700_000_000_500);
        expect(session).toMatchObject({
            callId: 'call-42',
            conversationId: payload.conversationId,
            type: 'video',
            initiatorId: payload.from.id,
            initiatorName: 'Ivan',
            initiatorAvatar: '/ivan.png',
            receiverId: me.id,
            receiverName: 'Amina',
            receiverAvatar: '/amina.png',
            status: 'ringing',
            durationSeconds: 0,
            ringStartedAt: 1_700_000_000_500,
            origin: 'push',
        });
    });

    it('type absent → audio (jamais une caméra allumée sans demande) ; nom absent → repli neutre', () => {
        const session = sessionFromPushPayload({ ...payload, callType: null, from: { ...payload.from, name: '', avatarUrl: null } }, me, 1);
        expect(session?.type).toBe('audio');
        expect(session?.initiatorName).toBe('Un membre MokNet');
        expect(session?.initiatorAvatar).toBe('');
    });

    it('charge incomplète ou d’un autre type → null, rien n’est inventé', () => {
        expect(sessionFromPushPayload({ ...payload, type: 'call_cancelled' }, me, 1)).toBeNull();
        expect(sessionFromPushPayload({ ...payload, callId: null }, me, 1)).toBeNull();
        expect(sessionFromPushPayload({ ...payload, conversationId: null }, me, 1)).toBeNull();
        expect(sessionFromPushPayload({ ...payload, from: null }, me, 1)).toBeNull();
        expect(sessionFromPushPayload(null, me, 1)).toBeNull();
    });
});
