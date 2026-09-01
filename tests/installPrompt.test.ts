import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPORTABLE_MODULES } from '../modules/moduleRegistry';

/**
 * ÉQUIPE X (architecture modulaire) — invitation d'installation et bouton
 * d'installation d'un module.
 *
 * Le service porte un état de module (invitation capturée à l'import) :
 * chaque test recharge le module (`vi.resetModules` + import dynamique) pour
 * partir d'une capture vierge. L'événement `beforeinstallprompt` est simulé
 * avec `prompt()` et `userChoice`, comme le fait Chrome.
 *
 * Ce qui est vérifié avant tout : aucun faux succès — une invitation capturée
 * pour l'application principale ne sert JAMAIS à « installer la messagerie ».
 */

type InstallPromptModule = typeof import('../services/modules/installPrompt');
type StandaloneModeModule = typeof import('../services/modules/standaloneMode');
type ButtonModule = typeof import('../components/modules/InstallModuleButton');

const messagerie = EXPORTABLE_MODULES.find((m) => m.id === 'messagerie')!;
const MAIN_APP_MANIFEST = '/manifest.webmanifest';

const setManifestLink = (href: string) => {
    document.querySelectorAll('link[rel="manifest"]').forEach((link) => link.remove());
    const link = document.createElement('link');
    link.setAttribute('rel', 'manifest');
    link.setAttribute('href', href);
    document.head.appendChild(link);
};

const setNavigatorProperty = (name: string, value: unknown) => {
    Object.defineProperty(window.navigator, name, { configurable: true, get: () => value });
};

const fireBeforeInstallPrompt = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: ReturnType<typeof vi.fn>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    };
    event.prompt = vi.fn(async () => {});
    event.userChoice = Promise.resolve({ outcome, platform: 'web' });
    window.dispatchEvent(event);
    return event;
};

let installPrompt: InstallPromptModule;
let standaloneMode: StandaloneModeModule;

beforeEach(async () => {
    vi.resetModules();
    document.querySelectorAll('link[rel="manifest"]').forEach((link) => link.remove());
    standaloneMode = await import('../services/modules/standaloneMode');
    installPrompt = await import('../services/modules/installPrompt');
});

afterEach(() => {
    vi.unstubAllGlobals();
    for (const name of ['userAgent', 'platform', 'maxTouchPoints', 'standalone']) {
        delete (window.navigator as unknown as Record<string, unknown>)[name];
    }
    document.querySelectorAll('link[rel="manifest"]').forEach((link) => link.remove());
});

describe('getInstallState — sur la page du module', () => {
    beforeEach(() => {
        standaloneMode.applyModuleManifest(messagerie);
    });

    it('`unsupported` tant que le navigateur n’a rien proposé', () => {
        expect(installPrompt.getInstallState(messagerie)).toBe('unsupported');
    });

    it('`installable` dès que `beforeinstallprompt` est capturé — mini-barre du navigateur neutralisée, auditeurs prévenus', () => {
        const listener = vi.fn();
        installPrompt.subscribe(listener);

        const event = fireBeforeInstallPrompt();

        expect(event.defaultPrevented).toBe(true);
        expect(installPrompt.getInstallState(messagerie)).toBe('installable');
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('`installed` quand la page tourne déjà dans l’application installée (display-mode standalone)', () => {
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
        expect(installPrompt.getInstallState(messagerie)).toBe('installed');
    });

    it('`ios-manual` sur iPhone sans invitation, `installed` une fois ajoutée à l’écran d’accueil', () => {
        setNavigatorProperty('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
        expect(installPrompt.getInstallState(messagerie)).toBe('ios-manual');
        setNavigatorProperty('standalone', true);
        expect(installPrompt.getInstallState(messagerie)).toBe('installed');
    });

    it('`appinstalled` mémorise l’installation pour ce manifeste ; un nouveau `beforeinstallprompt` la contredit et l’efface', () => {
        fireBeforeInstallPrompt();
        window.dispatchEvent(new Event('appinstalled'));
        expect(installPrompt.getInstallState(messagerie)).toBe('installed');
        expect(window.localStorage.getItem('moknet_pwa_installed:/manifests/messagerie.webmanifest')).toBe('1');

        // Le navigateur propose à nouveau l'installation : elle a été désinstallée.
        fireBeforeInstallPrompt();
        expect(installPrompt.getInstallState(messagerie)).toBe('installable');
        expect(window.localStorage.getItem('moknet_pwa_installed:/manifests/messagerie.webmanifest')).toBeNull();
    });

    it('le drapeau d’installation survit à un rechargement (nouvelle instance du service)', async () => {
        window.localStorage.setItem('moknet_pwa_installed:/manifests/messagerie.webmanifest', '1');
        vi.resetModules();
        const fresh = await import('../services/modules/installPrompt');
        expect(fresh.getInstallState(messagerie)).toBe('installed');
    });
});

describe('getInstallState — depuis l’application principale (manifeste MokNet lié)', () => {
    beforeEach(() => {
        setManifestLink(MAIN_APP_MANIFEST);
    });

    it('`via-module-page` : l’installation du module se propose depuis sa propre page', () => {
        expect(installPrompt.getInstallState(messagerie)).toBe('via-module-page');
    });

    it('une invitation capturée ici appartient à MokNet, jamais au module', () => {
        fireBeforeInstallPrompt();
        expect(installPrompt.getInstallState()).toBe('installable'); // l'application de la page
        expect(installPrompt.getInstallState(messagerie)).toBe('via-module-page');
    });

    it('`ios-manual` sur iPhone, même hors page du module (les consignes commencent par l’ouvrir)', () => {
        setNavigatorProperty('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
        expect(installPrompt.getInstallState(messagerie)).toBe('ios-manual');
    });

    it('un drapeau d’installation du module reste lu depuis l’application principale', () => {
        window.localStorage.setItem('moknet_pwa_installed:/manifests/messagerie.webmanifest', '1');
        expect(installPrompt.getInstallState(messagerie)).toBe('installed');
    });
});

describe('promptInstall', () => {
    it('`unavailable` sans invitation capturée', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        await expect(installPrompt.promptInstall(messagerie)).resolves.toBe('unavailable');
    });

    it('acceptée : prompt() appelé une fois, état `installed`, invitation consommée', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        const event = fireBeforeInstallPrompt('accepted');
        const listener = vi.fn();
        installPrompt.subscribe(listener);

        await expect(installPrompt.promptInstall(messagerie)).resolves.toBe('accepted');

        expect(event.prompt).toHaveBeenCalledTimes(1);
        expect(installPrompt.getInstallState(messagerie)).toBe('installed');
        expect(listener).toHaveBeenCalled();
        // Une même invitation ne se rejoue pas.
        await expect(installPrompt.promptInstall(messagerie)).resolves.toBe('unavailable');
        expect(event.prompt).toHaveBeenCalledTimes(1);
    });

    it('refusée : `dismissed`, aucun drapeau d’installation posé', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        fireBeforeInstallPrompt('dismissed');
        await expect(installPrompt.promptInstall(messagerie)).resolves.toBe('dismissed');
        expect(installPrompt.getInstallState(messagerie)).toBe('unsupported');
        expect(window.localStorage.getItem('moknet_pwa_installed:/manifests/messagerie.webmanifest')).toBeNull();
    });

    it('refuse d’installer MokNet quand on demande la messagerie : `unavailable`, prompt() jamais appelé', async () => {
        setManifestLink(MAIN_APP_MANIFEST);
        const event = fireBeforeInstallPrompt('accepted');
        await expect(installPrompt.promptInstall(messagerie)).resolves.toBe('unavailable');
        expect(event.prompt).not.toHaveBeenCalled();
        // L'invitation de MokNet, elle, reste utilisable pour MokNet.
        expect(installPrompt.getInstallState()).toBe('installable');
    });

    it('prompt() qui lève : `unavailable`, sans faux « installée »', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        const event = fireBeforeInstallPrompt('accepted');
        event.prompt.mockImplementation(async () => {
            throw new Error('NotAllowedError');
        });
        await expect(installPrompt.promptInstall(messagerie)).resolves.toBe('unavailable');
        expect(installPrompt.getInstallState(messagerie)).toBe('unsupported');
    });
});

describe('subscribe', () => {
    it('se désabonner arrête les notifications', () => {
        standaloneMode.applyModuleManifest(messagerie);
        const listener = vi.fn();
        const unsubscribe = installPrompt.subscribe(listener);
        fireBeforeInstallPrompt();
        expect(listener).toHaveBeenCalledTimes(1);
        unsubscribe();
        fireBeforeInstallPrompt();
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe('InstallModuleButton — un rendu honnête par état', () => {
    let InstallModuleButton: ButtonModule['InstallModuleButton'];

    beforeEach(async () => {
        ({ InstallModuleButton } = await import('../components/modules/InstallModuleButton'));
    });

    const renderButton = (props: Partial<React.ComponentProps<typeof InstallModuleButton>> = {}) =>
        render(React.createElement(InstallModuleButton, { module: messagerie, unsupportedGraceMs: 0, ...props }));

    it('`installable` : le bouton lance l’invitation native et rapporte le résultat', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        renderButton();
        expect(screen.queryByRole('button', { name: /Installer la messagerie sur mon téléphone/ })).not.toBeInTheDocument();

        let event!: ReturnType<typeof fireBeforeInstallPrompt>;
        await act(async () => {
            event = fireBeforeInstallPrompt('accepted');
        });
        const button = screen.getByRole('button', { name: /Installer la messagerie sur mon téléphone/ });

        await act(async () => {
            fireEvent.click(button);
        });
        expect(event.prompt).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Déjà installée/)).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(/Installation lancée/);
        // Sur la page du module : pas de lien « en plein écran » vers soi-même.
        expect(screen.queryByRole('link', { name: /en plein écran/ })).not.toBeInTheDocument();
    });

    it('`installable` refusée : message d’annulation, jamais « installée »', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        renderButton();
        await act(async () => {
            fireBeforeInstallPrompt('dismissed');
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Installer la messagerie sur mon téléphone/ }));
        });
        expect(screen.getByRole('status')).toHaveTextContent(/Installation annulée/);
        expect(screen.queryByText(/Déjà installée/)).not.toBeInTheDocument();
    });

    it('`installed` : « Déjà installée » et un bouton « Ouvrir » qui mène à la route du module', () => {
        setManifestLink(MAIN_APP_MANIFEST);
        window.localStorage.setItem('moknet_pwa_installed:/manifests/messagerie.webmanifest', '1');
        const assign = vi.fn();
        vi.stubGlobal('location', { ...window.location, assign, href: window.location.href });

        renderButton();

        expect(screen.getByText('Déjà installée')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Ouvrir la messagerie/ }));
        expect(assign).toHaveBeenCalledWith('/messagerie');
    });

    it('`ios-manual` : trois consignes (Partager → Sur l’écran d’accueil → Ajouter), aucun bouton inerte', () => {
        setManifestLink(MAIN_APP_MANIFEST);
        setNavigatorProperty('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
        renderButton();

        expect(screen.getByText(/Partager/)).toBeInTheDocument();
        expect(screen.getByText(/Sur l'écran d'accueil/)).toBeInTheDocument();
        expect(screen.getByText(/Ajouter/)).toBeInTheDocument();
        // Hors page du module : première consigne, l'ouvrir dans Safari (« Safari » est en gras, donc un nœud à part).
        expect(screen.getByText(/Ouvrez la messagerie en plein écran dans/)).toBeInTheDocument();
        expect(screen.getByText('Safari')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Ouvrir la messagerie en plein écran/ })).toHaveAttribute('href', '/messagerie');
    });

    it('`via-module-page` : le bouton conduit à la page du module avec la fiche d’installation', () => {
        setManifestLink(MAIN_APP_MANIFEST);
        const assign = vi.fn();
        vi.stubGlobal('location', { ...window.location, assign, href: window.location.href });
        renderButton();

        fireEvent.click(screen.getByRole('button', { name: /Installer la messagerie sur mon téléphone/ }));
        expect(assign).toHaveBeenCalledWith('/messagerie?installer=1');
        expect(screen.getByText(/se propose depuis la messagerie en plein écran/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Ouvrir la messagerie en plein écran/ })).toHaveAttribute('href', '/messagerie');
    });

    it('`unsupported` : une phrase honnête, aucun bouton d’installation', () => {
        standaloneMode.applyModuleManifest(messagerie);
        renderButton();
        expect(screen.getByRole('status')).toHaveTextContent(/ne propose pas l'installation/);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('`unsupported` : pendant le délai de vérification, on ne conclut pas encore', () => {
        standaloneMode.applyModuleManifest(messagerie);
        renderButton({ unsupportedGraceMs: 60_000 });
        expect(screen.getByRole('status')).toHaveTextContent(/Vérification/);
        expect(screen.queryByText(/ne propose pas/)).not.toBeInTheDocument();
    });

    it('variante compacte : rien tant que l’installation n’est pas proposée, un bouton « Installer » ensuite', async () => {
        standaloneMode.applyModuleManifest(messagerie);
        const { container } = renderButton({ compact: true });
        expect(container).toBeEmptyDOMElement();

        await act(async () => {
            fireBeforeInstallPrompt('accepted');
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /^Installer$/ }));
        });
        expect(screen.getByRole('status')).toHaveTextContent('Installation lancée');
    });
});
