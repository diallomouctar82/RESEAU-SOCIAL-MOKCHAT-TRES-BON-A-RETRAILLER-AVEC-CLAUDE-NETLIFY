import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AU-10 — l'état du micro doit être LU, jamais supposé. Le point sensible
 * testé ici : un iPhone dans un onglet peut être « autorisé » et redemander
 * quand même l'autorisation à la session suivante — l'explication donnée à
 * l'utilisateur doit dire cela, et pas « c'est bon, on ne vous redemandera
 * rien », qui serait faux.
 */

const rig = vi.hoisted(() => ({ standalone: false, ios: false }));

vi.mock('../services/push/pushService', () => ({
    isIosDevice: () => rig.ios,
    isStandaloneDisplayMode: () => rig.standalone,
}));

const {
    describeMicrophonePermission,
    getMicrophonePermissionStatus,
    requestMicrophoneOnce,
} = await import('../services/calls/microphonePermission');

type Devices = { kind: string; label: string }[];

const install = (options: {
    getUserMedia?: unknown;
    permissionState?: string;
    permissionThrows?: boolean;
    devices?: Devices;
    devicesThrow?: boolean;
}) => {
    const nav = globalThis.navigator as unknown as Record<string, unknown>;
    nav.mediaDevices = options.getUserMedia === null ? undefined : {
        getUserMedia: options.getUserMedia ?? vi.fn(async () => ({ getTracks: () => [] })),
        enumerateDevices: vi.fn(async () => {
            if (options.devicesThrow) throw new Error('refusé');
            return options.devices ?? [];
        }),
    };
    nav.permissions = options.permissionState === undefined && !options.permissionThrows
        ? undefined
        : { query: vi.fn(async () => {
            if (options.permissionThrows) throw new TypeError('nom inconnu');
            return { state: options.permissionState };
        }) };
};

beforeEach(() => {
    rig.standalone = false;
    rig.ios = false;
    if (!globalThis.navigator) (globalThis as Record<string, unknown>).navigator = {};
});
afterEach(() => vi.clearAllMocks());

describe('getMicrophonePermissionStatus (AU-10)', () => {
    it('API Permissions disponible : état réel, marqué comme mesuré', async () => {
        install({ permissionState: 'granted' });
        expect(await getMicrophonePermissionStatus()).toMatchObject({ state: 'granted', measured: true });
    });

    it('API Permissions refusant le nom « microphone » (Safari) : repli sur les libellés, jamais présenté comme mesuré', async () => {
        install({ permissionThrows: true, devices: [{ kind: 'audioinput', label: 'Micro intégré' }] });
        expect(await getMicrophonePermissionStatus()).toMatchObject({ state: 'granted', measured: false });
    });

    it('libellés vides : on ne conclut PAS « refusé », seulement « pas encore autorisé »', async () => {
        install({ permissionThrows: true, devices: [{ kind: 'audioinput', label: '' }] });
        expect(await getMicrophonePermissionStatus()).toMatchObject({ state: 'prompt', measured: false });
    });

    it('aucun micro sur la machine : non disponible, jamais un bouton inutile', async () => {
        install({ permissionThrows: true, devices: [{ kind: 'videoinput', label: 'Caméra' }] });
        expect(await getMicrophonePermissionStatus()).toMatchObject({ state: 'unsupported' });
    });

    it('navigateur sans getUserMedia : non disponible', async () => {
        install({ getUserMedia: null });
        expect(await getMicrophonePermissionStatus()).toMatchObject({ state: 'unsupported', measured: true });
    });

    it("le contexte d'exécution (iPhone, écran d'accueil) est rapporté tel quel", async () => {
        rig.ios = true;
        rig.standalone = true;
        install({ permissionState: 'prompt' });
        expect(await getMicrophonePermissionStatus()).toMatchObject({ ios: true, standalone: true });
    });
});

describe('requestMicrophoneOnce (AU-10)', () => {
    it('relâche immédiatement le micro : rien ne reste ouvert après la demande', async () => {
        const stop = vi.fn();
        install({ getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })) });
        expect(await requestMicrophoneOnce()).toEqual({ ok: true });
        expect(stop).toHaveBeenCalledTimes(1);
    });

    it('refus du navigateur : message humain, jamais un code technique brut', async () => {
        const err = new Error('Permission denied');
        err.name = 'NotAllowedError';
        install({ getUserMedia: vi.fn(async () => { throw err; }) });
        const result = await requestMicrophoneOnce();
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/refusé l’accès au micro/);
    });
});

describe('describeMicrophonePermission (AU-10)', () => {
    const status = (over: Record<string, unknown> = {}) =>
        ({ state: 'granted', measured: true, standalone: false, ios: false, ...over }) as never;

    it('iPhone dans un onglet ET autorisé : dit que ce sera REDEMANDÉ, et comment y remédier', () => {
        const text = describeMicrophonePermission(status({ ios: true, standalone: false }));
        expect(text).toMatch(/redemandée/);
        expect(text).toMatch(/écran d’accueil/);
    });

    it("iPhone installé sur l'écran d'accueil : plus de promesse d'être redemandé", () => {
        const text = describeMicrophonePermission(status({ ios: true, standalone: true }));
        expect(text).toMatch(/ne vous le redemandera pas/);
    });

    it('état déduit et non mesuré : la formulation reste prudente', () => {
        expect(describeMicrophonePermission(status({ state: 'prompt', measured: false })))
            .toMatch(/ne dit pas si le micro est déjà autorisé/);
    });

    it('refusé : conséquence réelle annoncée (le correspondant ne vous entend pas)', () => {
        expect(describeMicrophonePermission(status({ state: 'denied' }))).toMatch(/ne vous entendra pas/);
    });
});
