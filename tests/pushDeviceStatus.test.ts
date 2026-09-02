import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AU-9 — état RÉEL de la sonnerie hors application, pour CET appareil.
 *
 * Le point vérifié ici est celui qui manquait : une permission accordée ne
 * suffit pas. Tant que le serveur n'a pas l'adresse de push de l'appareil,
 * il ne peut pas le joindre — l'état doit le dire (`granted_not_registered`)
 * au lieu d'annoncer « activées » sur la foi du seul navigateur.
 */

const rig = vi.hoisted(() => ({
    configured: true,
    permission: 'granted' as NotificationPermission,
    ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/120',
    standalone: false,
    endpoint: null as string | null,
    rows: [] as Array<{ endpoint: string; updated_at: string | null }>,
    selectError: null as { message: string } | null,
    registration: true,
}));

vi.mock('../services/supabaseClient', () => ({
    get isSupabaseConfigured() { return rig.configured; },
    supabase: {
        from: () => ({
            select: () => ({
                order: async () => ({ data: rig.selectError ? null : rig.rows, error: rig.selectError }),
            }),
        }),
    },
}));

vi.mock('../services/pwaService', () => ({
    getServiceWorkerRegistration: async () => (rig.registration
        ? { pushManager: { getSubscription: async () => (rig.endpoint ? { endpoint: rig.endpoint } : null) } }
        : null),
}));

const { describePushDeviceState, getPushDeviceStatus } = await import('../services/push/pushService');

beforeEach(() => {
    rig.configured = true; rig.permission = 'granted'; rig.standalone = false;
    rig.ua = 'Mozilla/5.0 (Linux; Android 14) Chrome/120';
    rig.endpoint = 'https://push.example.invalid/abc'; rig.rows = []; rig.selectError = null; rig.registration = true;
    vi.stubGlobal('navigator', { get userAgent() { return rig.ua; }, platform: 'Linux', maxTouchPoints: 5, serviceWorker: {}, standalone: undefined });
    vi.stubGlobal('window', {
        isSecureContext: true,
        PushManager: function PushManager() {},
        Notification: { get permission() { return rig.permission; } },
        matchMedia: () => ({ matches: rig.standalone }),
    });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('getPushDeviceStatus — croise navigateur, permission et enregistrement serveur', () => {
    it('permission accordée MAIS aucune ligne serveur pour cet appareil → il ne sonnera pas, et l’état le dit', async () => {
        rig.rows = [{ endpoint: 'https://push.example.invalid/AUTRE-APPAREIL', updated_at: '2026-09-01T10:00:00Z' }];
        const status = await getPushDeviceStatus('u-1');
        expect(status.state).toBe('granted_not_registered');
        expect(status.endpoint).toBe('https://push.example.invalid/abc');
        expect(status.deviceCount).toBe(1); // un autre appareil du compte est bien enregistré
        expect(describePushDeviceState(status.state)).toMatch(/n’est pas encore enregistré/);
    });

    it('la ligne serveur correspond à l’endpoint de cet appareil → actif, avec sa date', async () => {
        rig.rows = [{ endpoint: 'https://push.example.invalid/abc', updated_at: '2026-09-02T01:00:00Z' }];
        const status = await getPushDeviceStatus('u-1');
        expect(status.state).toBe('active');
        expect(status.registeredAt).toBe('2026-09-02T01:00:00Z');
        expect(describePushDeviceState('active')).toMatch(/sonnera même hors de l’application/);
    });

    it('aucun abonnement navigateur malgré la permission → jamais « actif »', async () => {
        rig.endpoint = null;
        rig.rows = [{ endpoint: 'https://push.example.invalid/abc', updated_at: '2026-09-02T01:00:00Z' }];
        expect((await getPushDeviceStatus('u-1')).state).toBe('granted_not_registered');
    });

    it('permission refusée ou jamais demandée : état honnête, aucune lecture serveur nécessaire', async () => {
        rig.permission = 'denied';
        expect((await getPushDeviceStatus('u-1')).state).toBe('denied');
        rig.permission = 'default';
        expect((await getPushDeviceStatus('u-1')).state).toBe('default');
    });

    it('iPhone dans un onglet : le push Web n’existe pas — consigne d’installation, jamais un bouton inerte', async () => {
        rig.ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari';
        const status = await getPushDeviceStatus('u-1');
        expect(status.state).toBe('needs_ios_install');
        expect(describePushDeviceState(status.state)).toMatch(/écran d’accueil/);
        // Une fois installé sur l'écran d'accueil, l'état redevient mesurable.
        rig.standalone = true;
        rig.rows = [{ endpoint: 'https://push.example.invalid/abc', updated_at: null }];
        expect((await getPushDeviceStatus('u-1')).state).toBe('active');
    });

    it('lecture serveur en échec : l’erreur réelle est rapportée, jamais un « actif » optimiste', async () => {
        rig.selectError = { message: 'réseau indisponible' };
        const status = await getPushDeviceStatus('u-1');
        expect(status.state).toBe('granted_not_registered');
        expect(status.error).toBe('réseau indisponible');
        expect(status.deviceCount).toBeNull();
    });
});
