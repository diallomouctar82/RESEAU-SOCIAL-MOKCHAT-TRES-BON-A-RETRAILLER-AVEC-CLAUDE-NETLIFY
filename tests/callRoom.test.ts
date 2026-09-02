import { describe, expect, it } from 'vitest';
import { CALL_ROOM_SEPARATOR, callRoomName, conversationIdFromCallRoom } from '../services/calls/callRoom';

/**
 * AU-12 — une room par APPEL.
 *
 * Ce que les rapports de diagnostic de deux vrais appareils ont montré
 * (public.call_diagnostics, appel `call-1788343781635`) : la room s'appelait
 * `call-{conversationId}`, donc la MÊME pour tous les appels entre deux
 * personnes, et une session fantôme d'un appel précédent y publiait encore son
 * micro. Ces règles garantissent qu'un nom de room ne peut plus être partagé
 * par deux appels — et que la conversation à contrôler reste lisible dans le
 * nom, exactement comme la fonction Edge la lit en repli.
 */
describe('callRoomName / conversationIdFromCallRoom (AU-12)', () => {
    const CONV = '22222222-2222-4222-8222-222222222222';

    it('deux appels de la MÊME conversation n’ont jamais la même room', () => {
        const a = callRoomName(CONV, 'call-1788343653806');
        const b = callRoomName(CONV, 'call-1788343781635');
        expect(a).toBe(`call-${CONV}${CALL_ROOM_SEPARATOR}call-1788343653806`);
        expect(a).not.toBe(b);
    });

    it('les deux côtés d’un même appel tombent sur le même nom sans se le transmettre', () => {
        expect(callRoomName(CONV, 'call-42')).toBe(callRoomName(CONV, 'call-42'));
    });

    it('sans identifiant d’appel : ancien nom (un appel en cours pendant une mise à jour n’est pas cassé)', () => {
        expect(callRoomName(CONV)).toBe(`call-${CONV}`);
        expect(callRoomName(CONV, null)).toBe(`call-${CONV}`);
        expect(callRoomName(CONV, '   ')).toBe(`call-${CONV}`);
    });

    it('sans conversation : aucun nom deviné', () => {
        expect(callRoomName('')).toBe('');
        expect(callRoomName('   ', 'call-1')).toBe('');
    });

    it('la conversation reste lisible dans le nom — nouvelle forme comme ancienne', () => {
        expect(conversationIdFromCallRoom(callRoomName(CONV, 'call-9'))).toBe(CONV);
        expect(conversationIdFromCallRoom(`call-${CONV}`)).toBe(CONV);
    });

    it('un nom qui n’est pas une room d’appel ne rend aucune conversation', () => {
        expect(conversationIdFromCallRoom('live-abc')).toBe('');
        expect(conversationIdFromCallRoom('')).toBe('');
        expect(conversationIdFromCallRoom(null)).toBe('');
        expect(conversationIdFromCallRoom(undefined)).toBe('');
    });

    it('le nom reste sous la limite de 128 caractères de la fonction Edge', () => {
        expect(callRoomName(CONV, `call-${Date.now()}`).length).toBeLessThan(128);
    });
});
