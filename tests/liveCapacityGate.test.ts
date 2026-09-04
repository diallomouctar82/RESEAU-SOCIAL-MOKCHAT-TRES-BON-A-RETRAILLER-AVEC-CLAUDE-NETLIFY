import { describe, expect, it } from 'vitest';

import {
    assessCapacity,
    decideWithRoster,
    liveSessionIdFromRoomName,
    toLiveKitHttpUrl,
} from '../supabase/functions/livekit-token/capacityGate';

/**
 * SAT-2 — la porte d'entrée d'un direct.
 *
 * Ces cas appellent la VRAIE fonction de décision, celle que la fonction Edge
 * importe. Ils ne cherchent pas une chaîne de caractères dans un fichier :
 * une garde qui ne peut pas virer au rouge ne prouve rien, et chacune de
 * celles-ci a été vérifiée en cassant ce qu'elle protège.
 */

const MOI = '11111111-1111-4111-8111-111111111111';
const TOI = '22222222-2222-4222-8222-222222222222';
const ELLE = '33333333-3333-4333-8333-333333333333';

describe("SAT-2 · l'animateur n'est jamais mis à la porte de son direct", () => {
    it('entre alors que la room est pleine à craquer', () => {
        expect(assessCapacity({ isHost: true, maxParticipants: 50 }))
            .toEqual({ outcome: 'admit', reason: 'host' });
    });

    it("entre même quand LiveKit n'a pas répondu", () => {
        expect(assessCapacity({ isHost: true, maxParticipants: null }))
            .toEqual({ outcome: 'admit', reason: 'host' });
    });
});

describe('SAT-2 · le plafond vient du serveur, jamais du code', () => {
    it("laisse entrer quand le plafond est illisible (LiveKit injoignable)", () => {
        expect(assessCapacity({ isHost: false, maxParticipants: null }))
            .toEqual({ outcome: 'admit', reason: 'cap_unknown' });
    });

    it('laisse entrer quand aucun plafond n\'est posé (0 = illimité chez LiveKit)', () => {
        expect(assessCapacity({ isHost: false, maxParticipants: 0 }))
            .toEqual({ outcome: 'admit', reason: 'no_limit' });
    });

    it('traite un plafond négatif ou absurde comme une absence de plafond', () => {
        for (const maxParticipants of [-1, Number.NaN, Number.NEGATIVE_INFINITY]) {
            expect(assessCapacity({ isHost: false, maxParticipants }))
                .toEqual({ outcome: 'admit', reason: 'no_limit' });
        }
    });

    it('ne compte les présents QUE lorsque un plafond existe vraiment', () => {
        expect(assessCapacity({ isHost: false, maxParticipants: 50 }))
            .toEqual({ outcome: 'needs_roster', capacity: 50 });
    });
});

describe('SAT-2 · on compte sur la liste réelle des présents', () => {
    it("laisse entrer tant qu'il reste une place", () => {
        expect(decideWithRoster({ capacity: 3, identities: [TOI, ELLE], identity: MOI }))
            .toEqual({ admitted: true, reason: 'seat_available' });
    });

    it('REFUSE à la place exacte du plafond, avec les chiffres réels', () => {
        expect(decideWithRoster({ capacity: 2, identities: [TOI, ELLE], identity: MOI }))
            .toEqual({ admitted: false, reason: 'full', occupied: 2, capacity: 2 });
    });

    it('refuse aussi quand la room a dépassé son plafond', () => {
        expect(decideWithRoster({ capacity: 2, identities: [TOI, ELLE, MOI + 'x'], identity: MOI }))
            .toEqual({ admitted: false, reason: 'full', occupied: 3, capacity: 2 });
    });

    it('laisse revenir une personne déjà dans la room, même pleine (reconnexion)', () => {
        expect(decideWithRoster({ capacity: 2, identities: [MOI, TOI], identity: MOI }))
            .toEqual({ admitted: true, reason: 'already_inside' });
    });

    it("laisse entrer si la liste des présents est illisible — on ne sait pas que c'est plein", () => {
        expect(decideWithRoster({ capacity: 2, identities: null, identity: MOI }))
            .toEqual({ admitted: true, reason: 'roster_unknown' });
    });

    it('une room vide sous plafond laisse entrer', () => {
        expect(decideWithRoster({ capacity: 2, identities: [], identity: MOI }))
            .toEqual({ admitted: true, reason: 'seat_available' });
    });
});

describe('SAT-2 · la porte ne touche que les directs', () => {
    const sessionId = '3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f';

    it("reconnaît l'identifiant de session d'un direct", () => {
        expect(liveSessionIdFromRoomName(sessionId)).toBe(sessionId);
        expect(liveSessionIdFromRoomName(`  ${sessionId}  `)).toBe(sessionId);
        expect(liveSessionIdFromRoomName(sessionId.toUpperCase())).toBe(sessionId.toUpperCase());
    });

    it("ignore une room d'APPEL, sous toutes ses formes", () => {
        expect(liveSessionIdFromRoomName(`call-${sessionId}`)).toBeNull();
        expect(liveSessionIdFromRoomName(`call-${sessionId}--abc123`)).toBeNull();
        expect(liveSessionIdFromRoomName('call-quoi-que-ce-soit')).toBeNull();
    });

    it("n'envoie JAMAIS vers la base un nom qui n'est pas un UUID", () => {
        // live_sessions.id est de type uuid : un cast raté rendrait un 22P02,
        // qui deviendrait un refus au lieu d'un « ce n'est pas un direct ».
        for (const roomName of ['', '   ', 'salon-general', '3f8a1c2e', `${sessionId}x`, 'null', 'undefined']) {
            expect(liveSessionIdFromRoomName(roomName)).toBeNull();
        }
    });
});

describe("SAT-2 · l'URL de l'API serveur se déduit de l'URL de transport", () => {
    it('convertit le transport chiffré en HTTPS', () => {
        expect(toLiveKitHttpUrl('wss://live.moknet.net')).toBe('https://live.moknet.net');
    });

    it('convertit le transport en clair en HTTP (serveur de développement)', () => {
        expect(toLiveKitHttpUrl('ws://localhost:7880')).toBe('http://localhost:7880');
    });

    it('laisse une URL déjà HTTP(S) intacte et retire la barre finale', () => {
        expect(toLiveKitHttpUrl('https://live.moknet.net/')).toBe('https://live.moknet.net');
        expect(toLiveKitHttpUrl('wss://live.moknet.net///')).toBe('https://live.moknet.net');
    });
});
