import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXPORTABLE_MODULES } from '../modules/moduleRegistry';
import {
    applyModuleManifest,
    currentManifestPath,
    detectStandaloneModule,
    isIOS,
    isModulePage,
    isRunningInstalled,
} from '../services/modules/standaloneMode';

/**
 * ÉQUIPE X (architecture modulaire) — détection du mode module autonome,
 * bascule du manifeste, lecture du contexte d'exécution.
 */

const messagerie = EXPORTABLE_MODULES.find((m) => m.id === 'messagerie')!;

const setNavigatorProperty = (name: string, value: unknown) => {
    Object.defineProperty(window.navigator, name, { configurable: true, get: () => value });
};
const resetNavigatorProperty = (name: string) => {
    delete (window.navigator as unknown as Record<string, unknown>)[name];
};

afterEach(() => {
    vi.unstubAllGlobals();
    for (const name of ['userAgent', 'platform', 'maxTouchPoints', 'standalone']) resetNavigatorProperty(name);
    document.querySelectorAll('link[rel="manifest"]').forEach((link) => link.remove());
});

describe('detectStandaloneModule', () => {
    it('reconnaît la route autonome du module', () => {
        expect(detectStandaloneModule('/messagerie', '')).toBe(messagerie);
        expect(detectStandaloneModule('/messagerie/', '')).toBe(messagerie);
        expect(detectStandaloneModule('/messagerie/fil/12', '?x=1')).toBe(messagerie);
    });

    it('reconnaît la forme de repli `?module=messagerie`, même parmi d’autres paramètres', () => {
        expect(detectStandaloneModule('/', '?module=messagerie')).toBe(messagerie);
        expect(detectStandaloneModule('/', '?foo=1&module=Messagerie&bar=2')).toBe(messagerie);
        expect(detectStandaloneModule('/index.html', '?module=messagerie')).toBe(messagerie);
    });

    it('rend null pour l’application principale, un module inconnu ou un paramètre vide', () => {
        expect(detectStandaloneModule('/', '')).toBeNull();
        expect(detectStandaloneModule('/', '?live=abc')).toBeNull();
        expect(detectStandaloneModule('/', '?module=inconnu')).toBeNull();
        expect(detectStandaloneModule('/', '?module=')).toBeNull();
        expect(detectStandaloneModule('/social', '')).toBeNull();
    });
});

describe('applyModuleManifest', () => {
    it('crée le <link rel="manifest"> quand le document n’en a pas', () => {
        expect(currentManifestPath()).toBeNull();
        const link = applyModuleManifest(messagerie);
        expect(link).not.toBeNull();
        expect(document.head.contains(link)).toBe(true);
        expect(link!.getAttribute('href')).toBe('/manifests/messagerie.webmanifest');
        expect(link!.getAttribute('data-module')).toBe('messagerie');
        expect(currentManifestPath()).toBe(messagerie.manifestPath);
        expect(isModulePage(messagerie)).toBe(true);
    });

    it('remplace le manifeste de l’application principale — un seul <link> reste', () => {
        const existing = document.createElement('link');
        existing.setAttribute('rel', 'manifest');
        existing.setAttribute('href', '/manifest.webmanifest');
        document.head.appendChild(existing);
        expect(isModulePage(messagerie)).toBe(false);

        const link = applyModuleManifest(messagerie);
        expect(link).toBe(existing);
        expect(document.querySelectorAll('link[rel="manifest"]')).toHaveLength(1);
        expect(existing.getAttribute('href')).toBe(messagerie.manifestPath);
        expect(isModulePage(messagerie)).toBe(true);
    });

    it('currentManifestPath résout un href relatif ou absolu en chemin', () => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'manifest');
        link.setAttribute('href', `${window.location.origin}/manifest.webmanifest?v=3`);
        document.head.appendChild(link);
        expect(currentManifestPath()).toBe('/manifest.webmanifest');
    });
});

describe('isRunningInstalled', () => {
    it('faux dans un onglet de navigateur ordinaire (pas de matchMedia, pas de navigator.standalone)', () => {
        expect(isRunningInstalled()).toBe(false);
    });

    it('vrai quand `display-mode: standalone` correspond', () => {
        vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({ matches: query.includes('standalone') })));
        expect(isRunningInstalled()).toBe(true);
    });

    it('faux quand matchMedia répond « ne correspond pas »', () => {
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
        expect(isRunningInstalled()).toBe(false);
    });

    it('vrai dans une application ajoutée à l’écran d’accueil iOS (navigator.standalone)', () => {
        setNavigatorProperty('standalone', true);
        expect(isRunningInstalled()).toBe(true);
    });
});

describe('isIOS', () => {
    it('reconnaît iPhone, iPad et iPod par leur user agent', () => {
        expect(isIOS({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' })).toBe(true);
        expect(isIOS({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)' })).toBe(true);
        expect(isIOS({ userAgent: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)' })).toBe(true);
    });

    it('reconnaît l’iPad récent qui se présente comme un Mac tactile', () => {
        expect(isIOS({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
        expect(isIOS({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
    });

    it('ne prend ni Android ni un bureau pour iOS', () => {
        expect(isIOS({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0', platform: 'Linux armv8l', maxTouchPoints: 5 })).toBe(false);
        expect(isIOS({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', platform: 'Win32', maxTouchPoints: 0 })).toBe(false);
    });

    it('lit le navigateur courant quand aucun indice n’est fourni', () => {
        expect(isIOS()).toBe(false); // jsdom : ni iPhone, ni Mac tactile
        setNavigatorProperty('userAgent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
        expect(isIOS()).toBe(true);
    });
});
