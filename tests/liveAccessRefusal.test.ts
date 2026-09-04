import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * SAT-3 — le refus du serveur survit-il jusqu'au client ?
 *
 * SAT-2 a fermé la porte côté serveur, mais `supabase.functions.invoke`
 * aplatit tout échec HTTP en une phrase générique et range le corps réel dans
 * `error.context`. Ces cas vérifient la chaîne complète : lecture du corps →
 * refus typé → badge de scène. Aucun n'est un test de chaîne de caractères :
 * ils appellent les vraies fonctions, avec la vraie forme d'erreur de
 * supabase-js (un objet portant un `context` qui se lit comme une `Response`).
 */

const rig = vi.hoisted(() => ({
    invoke: vi.fn<(name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }>>(),
}));

vi.mock('../services/supabaseClient', () => ({
    get isSupabaseConfigured() { return true; },
    supabase: { functions: { invoke: rig.invoke } },
    supabaseService: {},
}));

const {
    LIVE_FULL_CODE,
    LiveAccessError,
    isLiveFull,
    liveFullOccupancy,
    readLiveRefusal,
} = await import('../services/live/liveAccessError');
const { fetchLiveKitToken } = await import('../services/live/liveKitToken');
const { liveBadge } = await import('../hooks/useLiveTransport');

/** Le 409 exact que la fonction Edge renvoie (supabase/functions/livekit-token/index.ts). */
const CORPS_409 = { error: 'Ce direct est complet.', code: 'live_full', occupied: 12, capacity: 12 };

/**
 * L'erreur telle que supabase-js la construit sur un non-2xx : message
 * GÉNÉRIQUE, corps accessible seulement par `context.json()` — et une seule
 * fois, comme une vraie `Response`.
 */
function erreurHttp(corps: unknown, dejaLue = false): Error & { context: { json: () => Promise<unknown> } } {
    let lue = dejaLue;
    const err = new Error('Edge Function returned a non-2xx status code') as Error & { context: { json: () => Promise<unknown> } };
    err.name = 'FunctionsHttpError';
    err.context = {
        json: async () => {
            if (lue) throw new TypeError('Body is unusable: Body has already been read');
            lue = true;
            return corps;
        },
    };
    return err;
}

beforeEach(() => {
    rig.invoke.mockReset();
});

describe('SAT-3 · lire le refus dans le corps de la réponse', () => {
    it('reconnaît le 409 « direct complet » avec ses chiffres', () => {
        expect(readLiveRefusal(CORPS_409)).toEqual({
            code: 'live_full', message: 'Ce direct est complet.', occupied: 12, capacity: 12,
        });
    });

    it('reconnaît un refus sans chiffres (transport non configuré, 503)', () => {
        expect(readLiveRefusal({ error: 'Aucune configuration de transport LIVE active pour cet environnement.', code: 'transport_unconfigured' }))
            .toEqual({ code: 'transport_unconfigured', message: 'Aucune configuration de transport LIVE active pour cet environnement.' });
    });

    it("ne fabrique JAMAIS un refus depuis un corps sans code — une panne reste une panne", () => {
        for (const corps of [
            null, undefined, 'plein', 42, [],
            {},
            { error: 'Erreur interne du serveur.' }, // 500 sans code
            { code: '' }, { code: '   ' }, { code: 42 },
        ]) {
            expect(readLiveRefusal(corps)).toBeNull();
        }
    });

    it('ignore des chiffres absurdes plutôt que de les propager', () => {
        const refus = readLiveRefusal({ code: 'live_full', occupied: -3, capacity: Number.NaN });
        expect(refus).toEqual({ code: 'live_full', message: '' });
    });
});

describe('SAT-3 · les chiffres affichables — jamais inventés', () => {
    it('rend les deux chiffres quand le serveur les a donnés', () => {
        expect(liveFullOccupancy(readLiveRefusal(CORPS_409))).toEqual({ occupied: 12, capacity: 12 });
    });

    it("ne rend RIEN quand il en manque un — « 12 sur ? » ne veut rien dire", () => {
        expect(liveFullOccupancy({ code: LIVE_FULL_CODE, message: '', occupied: 12 })).toBeNull();
        expect(liveFullOccupancy({ code: LIVE_FULL_CODE, message: '', capacity: 12 })).toBeNull();
        expect(liveFullOccupancy({ code: LIVE_FULL_CODE, message: '' })).toBeNull();
    });

    it('ne rend rien pour une capacité nulle (0 = « aucune limite » chez LiveKit, jamais « zéro place »)', () => {
        expect(liveFullOccupancy({ code: LIVE_FULL_CODE, message: '', occupied: 0, capacity: 0 })).toBeNull();
    });

    it("ne rend rien pour un refus qui n'est pas « complet »", () => {
        expect(liveFullOccupancy({ code: 'transport_unconfigured', message: '', occupied: 12, capacity: 12 })).toBeNull();
        expect(liveFullOccupancy(null)).toBeNull();
        expect(isLiveFull(null)).toBe(false);
        expect(isLiveFull({ code: 'transport_unconfigured', message: '' })).toBe(false);
    });
});

describe('SAT-3 · fetchLiveKitToken remonte le refus au lieu de la phrase générique', () => {
    it('un 409 « complet » devient une LiveAccessError qui porte le code ET les chiffres', async () => {
        rig.invoke.mockResolvedValue({ data: null, error: erreurHttp(CORPS_409) });
        const err = await fetchLiveKitToken('3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f', 'Awa', false).catch((e) => e);
        expect(err).toBeInstanceOf(LiveAccessError);
        expect((err as InstanceType<typeof LiveAccessError>).refusal).toEqual({
            code: 'live_full', message: 'Ce direct est complet.', occupied: 12, capacity: 12,
        });
        // Le message du serveur remplace « Edge Function returned a non-2xx status code ».
        expect((err as Error).message).toBe('Ce direct est complet.');
    });

    it('une panne SANS code reste une erreur ordinaire — jamais convertie en « complet »', async () => {
        rig.invoke.mockResolvedValue({ data: null, error: erreurHttp({ error: 'Erreur interne du serveur.' }) });
        const err = await fetchLiveKitToken('3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f').catch((e) => e);
        expect(err).not.toBeInstanceOf(LiveAccessError);
        expect((err as Error).message).toBe('Edge Function returned a non-2xx status code');
    });

    it('un corps illisible (déjà consommé) ne fait pas échouer la lecture — repli sur le message générique', async () => {
        rig.invoke.mockResolvedValue({ data: null, error: erreurHttp(CORPS_409, true) });
        const err = await fetchLiveKitToken('3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f').catch((e) => e);
        expect(err).not.toBeInstanceOf(LiveAccessError);
        expect((err as Error).message).toBe('Edge Function returned a non-2xx status code');
    });

    it('une erreur réseau (sans context lisible) garde son message', async () => {
        rig.invoke.mockResolvedValue({ data: null, error: Object.assign(new Error('Failed to send a request to the Edge Function'), { context: { requestId: 'abc' } }) });
        const err = await fetchLiveKitToken('3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f').catch((e) => e);
        expect(err).not.toBeInstanceOf(LiveAccessError);
        expect((err as Error).message).toBe('Failed to send a request to the Edge Function');
    });

    it('le chemin nominal est inchangé : jeton et URL rendus tels quels', async () => {
        rig.invoke.mockResolvedValue({ data: { token: 'jwt', serverUrl: 'wss://live.moknet.net' }, error: null });
        await expect(fetchLiveKitToken('3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f', 'Awa', true, 'dev-1'))
            .resolves.toEqual({ token: 'jwt', serverUrl: 'wss://live.moknet.net' });
        expect(rig.invoke).toHaveBeenCalledWith('livekit-token', {
            body: { roomName: '3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f', participantName: 'Awa', canPublish: true, deviceId: 'dev-1' },
        });
    });

    it('une réponse 200 mais sans jeton reste une erreur explicite', async () => {
        rig.invoke.mockResolvedValue({ data: { serverUrl: 'wss://live.moknet.net' }, error: null });
        await expect(fetchLiveKitToken('3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f'))
            .rejects.toThrow("Impossible d'obtenir un accès au LIVE");
    });
});

describe('SAT-3 · le badge de scène dit COMPLET, jamais INTERROMPU', () => {
    it('« complet » passe avant « interrompu » — on n’y est jamais entré', () => {
        const badge = liveBadge(true, 'disconnected', true, true);
        expect(badge.label).toBe('COMPLET');
        expect(badge.isOnAir).toBe(false);
    });

    it('sans refus, les états historiques sont strictement inchangés', () => {
        expect(liveBadge(true, 'connected', false).label).toBe('LIVE');
        expect(liveBadge(true, 'connected', true).label).toBe('INTERROMPU');
        expect(liveBadge(true, 'reconnecting', false).label).toBe('RECONNEXION');
        expect(liveBadge(true, 'connecting', false).label).toBe('CONNEXION');
        expect(liveBadge(false, 'connected', false).label).toBe('APERÇU');
    });

    it("un aperçu de démonstration reste un aperçu, même marqué complet", () => {
        expect(liveBadge(false, 'disconnected', true, true).label).toBe('APERÇU');
    });
});
