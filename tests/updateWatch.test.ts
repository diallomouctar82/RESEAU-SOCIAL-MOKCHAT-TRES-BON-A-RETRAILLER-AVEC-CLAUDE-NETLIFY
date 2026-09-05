import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    extractEntryBundle, isNewVersionAvailable, runningEntryBundle,
    fetchServedEntryBundle, startUpdateWatch,
} from '../services/updateWatch';

/**
 * Constaté en production le 05/09/2026 : la Direction ne voyait pas un
 * onglet servi depuis deux déploiements, parce qu'un onglet resté ouvert
 * garde son code et que rien ne lui disait qu'une version plus récente
 * existait. Ces tests fixent le contrat de la veille qui corrige ça.
 */

const html = (bundle: string) =>
    `<!doctype html><html><head><script type="module" crossorigin src="${bundle}"></script></head><body></body></html>`;

describe('lecture du bundle d\'entrée', () => {
    it('extrait le chemin du bundle d\'un document construit', () => {
        expect(extractEntryBundle(html('/assets/index-B9mOh6Cy.js'))).toBe('/assets/index-B9mOh6Cy.js');
    });
    it('renvoie null quand il n\'y a pas de bundle (développement, page inattendue)', () => {
        expect(extractEntryBundle('<script type="module" src="/index.tsx"></script>')).toBeNull();
        expect(extractEntryBundle('')).toBeNull();
    });
    it('lit le bundle que la page exécute depuis son propre document', () => {
        document.head.innerHTML = '<script type="module" src="/assets/index-AAAA.js"></script>';
        expect(runningEntryBundle()).toBe('/assets/index-AAAA.js');
        document.head.innerHTML = '';
        expect(runningEntryBundle()).toBeNull();
    });
});

describe('décision', () => {
    it('signale uniquement quand les deux sont connus ET diffèrent', () => {
        expect(isNewVersionAvailable('/assets/index-A.js', '/assets/index-B.js')).toBe(true);
        expect(isNewVersionAvailable('/assets/index-A.js', '/assets/index-A.js')).toBe(false);
        // Jamais d'alerte sur une inconnue : un réseau en panne n'est pas une nouvelle version.
        expect(isNewVersionAvailable('/assets/index-A.js', null)).toBe(false);
        expect(isNewVersionAvailable(null, '/assets/index-B.js')).toBe(false);
    });
});

describe('lecture du bundle servi', () => {
    it('relit le document sans cache et en extrait le bundle', async () => {
        const f = vi.fn(async () => new Response(html('/assets/index-SERVI.js'), { status: 200 }));
        expect(await fetchServedEntryBundle(f as unknown as typeof fetch)).toBe('/assets/index-SERVI.js');
        expect(f).toHaveBeenCalledWith('/', expect.objectContaining({ cache: 'no-store' }));
    });
    it('renvoie null sur erreur réseau ou réponse non OK, sans lever', async () => {
        const ko = vi.fn(async () => new Response('', { status: 503 }));
        expect(await fetchServedEntryBundle(ko as unknown as typeof fetch)).toBeNull();
        const boom = vi.fn(async () => { throw new Error('offline'); });
        expect(await fetchServedEntryBundle(boom as unknown as typeof fetch)).toBeNull();
    });
});

describe('la veille', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        document.head.innerHTML = '<script type="module" src="/assets/index-VIEUX.js"></script>';
    });
    afterEach(() => { vi.useRealTimers(); document.head.innerHTML = ''; });

    const servant = (bundle: string) =>
        vi.fn(async () => new Response(html(bundle), { status: 200 })) as unknown as typeof fetch;

    it('prévient UNE fois quand le serveur sert un bundle différent', async () => {
        const f = servant('/assets/index-NOUVEAU.js');
        const cb = vi.fn();
        const stop = startUpdateWatch(cb, { fetchImpl: f, initialDelayMs: 100, periodMs: 1000, minIntervalMs: 0 });
        await vi.advanceTimersByTimeAsync(150);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith('/assets/index-NOUVEAU.js');
        await vi.advanceTimersByTimeAsync(5000);        // périodes suivantes : plus jamais
        expect(cb).toHaveBeenCalledTimes(1);
        stop();
    });

    it('reste muette quand le serveur sert le même bundle', async () => {
        const cb = vi.fn();
        const stop = startUpdateWatch(cb, { fetchImpl: servant('/assets/index-VIEUX.js'), initialDelayMs: 100, minIntervalMs: 0 });
        await vi.advanceTimersByTimeAsync(200);
        expect(cb).not.toHaveBeenCalled();
        stop();
    });

    it('vérifie quand la page redevient visible — le cas de l\'onglet qu\'on retrouve', async () => {
        const f = servant('/assets/index-NOUVEAU.js');
        const cb = vi.fn();
        const stop = startUpdateWatch(cb, { fetchImpl: f, initialDelayMs: 60_000, minIntervalMs: 0 });
        expect(cb).not.toHaveBeenCalled();
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(10);
        expect(cb).toHaveBeenCalledTimes(1);
        stop();
    });

    it('ne harcèle pas le serveur : respecte l\'intervalle minimal entre deux vérifications', async () => {
        const f = servant('/assets/index-VIEUX.js');
        const stop = startUpdateWatch(vi.fn(), { fetchImpl: f, initialDelayMs: 0, minIntervalMs: 60_000 });
        await vi.advanceTimersByTimeAsync(10);
        for (let i = 0; i < 5; i++) { window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(10); }
        expect(f).toHaveBeenCalledTimes(1);
        stop();
    });

    it('ne fait rien en développement (aucun bundle dans le document)', async () => {
        document.head.innerHTML = '<script type="module" src="/index.tsx"></script>';
        const f = servant('/assets/index-NOUVEAU.js');
        const stop = startUpdateWatch(vi.fn(), { fetchImpl: f, initialDelayMs: 0, minIntervalMs: 0 });
        await vi.advanceTimersByTimeAsync(100);
        expect(f).not.toHaveBeenCalled();
        stop();
    });

    it('s\'arrête proprement : plus aucune vérification après stop()', async () => {
        const f = servant('/assets/index-NOUVEAU.js');
        const cb = vi.fn();
        const stop = startUpdateWatch(cb, { fetchImpl: f, initialDelayMs: 100, minIntervalMs: 0 });
        stop();
        await vi.advanceTimersByTimeAsync(500);
        expect(cb).not.toHaveBeenCalled();
    });
});
