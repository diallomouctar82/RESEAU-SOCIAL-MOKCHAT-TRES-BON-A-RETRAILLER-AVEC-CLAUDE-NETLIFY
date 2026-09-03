import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mission SN — le petit panneau « Sonnerie » de la messagerie ne fait que
 * piloter des réglages qui existent : les préférences sonnerie/vibration de
 * l'appareil (ringtoneService, lues par startRinging et par le service
 * worker) et l'état RÉEL « hors application » (pushService, même logique que
 * la carte des Paramètres). Testé ici : chaque bascule écrit vraiment le
 * réglage, la vibration indisponible est dite telle quelle (jamais un
 * interrupteur inerte), l'activation hors application relit l'état après
 * l'action, et un aperçu est un geste explicite.
 */

const rig = vi.hoisted(() => ({
    status: null as any,
    statusCalls: 0,
    activateResult: { status: 'subscribed' } as any,
    activateCalls: 0,
    previewCalls: [] as string[],
}));

vi.mock('../services/push/pushService', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/push/pushService')>();
    return {
        ...real,
        getPushDeviceStatus: vi.fn(async () => { rig.statusCalls++; return rig.status; }),
        requestPushPermissionAndSubscribe: vi.fn(async () => { rig.activateCalls++; return rig.activateResult; }),
    };
});

vi.mock('../services/calls/ringtoneService', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/calls/ringtoneService')>();
    return {
        ...real,
        previewRingtone: vi.fn(async (id: string) => { rig.previewCalls.push(id); }),
    };
});

const { RingingPanel } = await import('../components/chat/RingingPanel');
const { __resetRingtoneServiceForTests, getRingPreferences, RING_PREFERENCES_STORAGE_KEY, setRingPreferences } = await import('../services/calls/ringtoneService');

const USER = 'a1b2c3d4-0000-4000-8000-000000000001';
const status = (over: Record<string, unknown> = {}) => ({ state: 'active', endpoint: 'https://p/1', registeredAt: null, deviceCount: 1, ...over });

beforeEach(() => {
    rig.status = status();
    rig.statusCalls = 0;
    rig.activateCalls = 0;
    rig.activateResult = { status: 'subscribed' };
    rig.previewCalls = [];
    window.localStorage.removeItem(RING_PREFERENCES_STORAGE_KEY);
});

afterEach(() => {
    __resetRingtoneServiceForTests();
    delete (window.navigator as any).vibrate;
    vi.clearAllMocks();
});

describe('RingingPanel (mission SN)', () => {
    it('bascule « Sonnerie » : écrit réellement le réglage lu par startRinging, et dit ce qui change appli fermée', () => {
        render(<RingingPanel userId={null} ringtoneId="signature" onClose={() => {}} />);
        const ringtone = screen.getByTestId('ringing-toggle-ringtone');
        expect(ringtone.getAttribute('aria-checked')).toBe('true');
        expect(screen.getByText(/Signature MokNet · se change dans les Paramètres/)).toBeTruthy();

        fireEvent.click(ringtone);

        expect(ringtone.getAttribute('aria-checked')).toBe('false');
        expect(getRingPreferences().ringtoneEnabled).toBe(false);
        expect(screen.getByText('Coupée : l’appel s’affiche sans son')).toBeTruthy();
        expect(screen.getByText(/notification d’appel reste affichée, mais silencieuse/)).toBeTruthy();

        fireEvent.click(ringtone);
        expect(getRingPreferences().ringtoneEnabled).toBe(true);
    });

    it('vibration indisponible (iPhone) : interrupteur désactivé et raison affichée — jamais un réglage inerte', () => {
        render(<RingingPanel userId={null} onClose={() => {}} />);
        const vibration = screen.getByTestId('ringing-toggle-vibration') as HTMLButtonElement;
        expect(vibration.disabled).toBe(true);
        expect(vibration.getAttribute('aria-checked')).toBe('false');
        expect(screen.getByText('Non disponible sur cet appareil')).toBeTruthy();
        fireEvent.click(vibration);
        expect(getRingPreferences().vibrationEnabled).toBe(true); // rien n'a bougé
    });

    it('vibration disponible : la bascule écrit le réglage, et un changement venu d’ailleurs est reflété', () => {
        Object.defineProperty(window.navigator, 'vibrate', { configurable: true, writable: true, value: vi.fn(() => true) });
        render(<RingingPanel userId={null} onClose={() => {}} />);
        const vibration = screen.getByTestId('ringing-toggle-vibration') as HTMLButtonElement;
        expect(vibration.disabled).toBe(false);
        expect(screen.getByText('À chaque appel entrant')).toBeTruthy();

        fireEvent.click(vibration);
        expect(getRingPreferences().vibrationEnabled).toBe(false);
        expect(screen.getByText('Coupée')).toBeTruthy();

        act(() => { setRingPreferences({ vibrationEnabled: true }); }); // ex. depuis un autre panneau
        expect(vibration.getAttribute('aria-checked')).toBe('true');
        expect(screen.getByText('À chaque appel entrant')).toBeTruthy();
    });

    it('hors application : état réel, « Activer sur cet appareil » relit l’état après l’action, un échec est affiché tel quel', async () => {
        rig.status = status({ state: 'granted_not_registered', deviceCount: 0 });
        render(<RingingPanel userId={USER} onClose={() => {}} />);
        expect(await screen.findByText('Incomplète')).toBeTruthy();
        expect(screen.getByText(/n’est pas encore enregistré/)).toBeTruthy();
        const button = screen.getByRole('button', { name: /Activer sur cet appareil/ });

        rig.activateResult = { status: 'error', error: 'Service worker inactif : notifications push impossibles pour l’instant' };
        fireEvent.click(button);

        await waitFor(() => expect(rig.activateCalls).toBe(1));
        expect(await screen.findByText(/Service worker inactif/)).toBeTruthy();
        expect(rig.statusCalls).toBe(2);
    });

    it('appareil déjà actif : aucun bouton d’activation, « Revérifier » relit l’état', async () => {
        rig.status = status({ state: 'active' });
        render(<RingingPanel userId={USER} onClose={() => {}} />);
        expect(await screen.findByText('Active')).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Activer sur cet appareil/ })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Revérifier/ }));
        await waitFor(() => expect(rig.statusCalls).toBe(2));
    });

    it('sans utilisateur réel : pas de section « Hors application », aucune lecture serveur', () => {
        render(<RingingPanel userId={null} onClose={() => {}} />);
        expect(screen.queryByText('Hors application')).toBeNull();
        expect(rig.statusCalls).toBe(0);
    });

    it('« Tester la sonnerie » joue la sonnerie effective (profil, sinon celle de l’appareil), « Fermer » ferme', async () => {
        const onClose = vi.fn();
        render(<RingingPanel userId={null} ringtoneId="kora" onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /Tester la sonnerie/ }));
        await waitFor(() => expect(rig.previewCalls).toEqual(['kora']));
        fireEvent.click(screen.getByRole('button', { name: 'Fermer le panneau Sonnerie' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
