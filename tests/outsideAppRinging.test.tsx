import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AU-9 — la carte « Sonnerie hors application » dit l'état RÉEL de cet
 * appareil et propose l'action qui le corrige. Le point sensible testé ici :
 * une permission accordée sans enregistrement serveur ne doit JAMAIS
 * s'afficher comme active — c'est exactement le cas où le téléphone reste
 * muet alors que tout semble en ordre côté navigateur.
 */

const rig = vi.hoisted(() => ({
    status: null as any,
    statusCalls: 0,
    activateResult: { status: 'subscribed' } as any,
    activateCalls: 0,
}));

vi.mock('../services/push/pushService', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/push/pushService')>();
    return {
        ...real,
        getPushDeviceStatus: vi.fn(async () => { rig.statusCalls++; return rig.status; }),
        requestPushPermissionAndSubscribe: vi.fn(async () => { rig.activateCalls++; return rig.activateResult; }),
    };
});

const { OutsideAppRingingCard } = await import('../components/settings/OutsideAppRingingCard');

const status = (over: Record<string, unknown> = {}) => ({ state: 'active', endpoint: 'https://p/1', registeredAt: null, deviceCount: 1, ...over });

beforeEach(() => {
    rig.status = status();
    rig.statusCalls = 0;
    rig.activateCalls = 0;
    rig.activateResult = { status: 'subscribed' };
});
afterEach(() => vi.clearAllMocks());

describe('OutsideAppRingingCard', () => {
    it('permission accordée mais appareil NON enregistré : jamais « active », l’action est proposée', async () => {
        rig.status = status({ state: 'granted_not_registered', deviceCount: 0 });
        render(<OutsideAppRingingCard userId="u-1" />);
        expect(await screen.findByText('Incomplète')).toBeTruthy();
        expect(screen.getByText(/n’est pas encore enregistré/)).toBeTruthy();
        expect(screen.getByText('Aucun de vos appareils n’est enregistré pour l’instant.')).toBeTruthy();
        expect(screen.queryByText('Active sur cet appareil')).toBeNull();
        expect(screen.getByRole('button', { name: /Activer sur cet appareil/ })).toBeTruthy();
    });

    it('appareil réellement enregistré : état actif, aucun bouton d’activation à cliquer pour rien', async () => {
        rig.status = status({ state: 'active', deviceCount: 2 });
        render(<OutsideAppRingingCard userId="u-1" />);
        expect(await screen.findByText('Active sur cet appareil')).toBeTruthy();
        expect(screen.getByText('2 appareils enregistrés sur ce compte.')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Activer sur cet appareil/ })).toBeNull();
    });

    it('iPhone dans un onglet : consigne d’installation, jamais un bouton inerte', async () => {
        rig.status = status({ state: 'needs_ios_install', endpoint: null, deviceCount: null });
        render(<OutsideAppRingingCard userId="u-1" />);
        expect(await screen.findByText('À installer sur l’écran d’accueil')).toBeTruthy();
        expect(screen.getByText(/Sur l'écran d'accueil/)).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Activer sur cet appareil/ })).toBeNull();
    });

    it('l’activation relit l’état réel ensuite, et un échec est affiché tel quel', async () => {
        rig.status = status({ state: 'default', endpoint: null, deviceCount: 0 });
        render(<OutsideAppRingingCard userId="u-1" />);
        const button = await screen.findByRole('button', { name: /Activer sur cet appareil/ });
        rig.activateResult = { status: 'error', error: 'Clé publique push indisponible' };
        fireEvent.click(button);
        await waitFor(() => expect(rig.activateCalls).toBe(1));
        expect(await screen.findByText('Clé publique push indisponible')).toBeTruthy();
        expect(rig.statusCalls).toBe(2); // état relu APRÈS l'action, jamais supposé
    });

    it('échec de vérification : le message réel du serveur, pas un état optimiste', async () => {
        rig.status = status({ state: 'granted_not_registered', deviceCount: null, error: 'réseau indisponible' });
        render(<OutsideAppRingingCard userId="u-1" />);
        expect(await screen.findByText(/Vérification impossible : réseau indisponible/)).toBeTruthy();
    });

    it('sans utilisateur connecté, la carte ne s’affiche pas et n’interroge rien', () => {
        const { container } = render(<OutsideAppRingingCard userId={null} />);
        expect(container.querySelector('[data-testid="outside-app-ringing"]')).toBeNull();
        expect(rig.statusCalls).toBe(0);
    });
});
