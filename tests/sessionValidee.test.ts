/**
 * VERROU D'ENTRÉE (Direction, 05/09/2026 — DEC-2026-081) : une session relue
 * depuis le stockage local est vérifiée auprès du serveur d'authentification
 * avant d'ouvrir l'interface. Ce test isole `verifierSession` : le client
 * Supabase est une doublure, chaque verdict est éprouvé sur la réponse réelle
 * que supabase-js renverrait (refus 401/403 = AuthApiError, panne réseau ou
 * 5xx = AuthRetryableFetchError, utilisateur différent, délai dépassé).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

type OptionsSignOut = { scope: 'global' | 'local' | 'others' };

const h = vi.hoisted(() => ({
    getUser: vi.fn<(jwt?: string) => Promise<unknown>>(),
    signOut: vi.fn<(options?: { scope: 'global' | 'local' | 'others' }) => Promise<unknown>>(async () => ({ error: null })),
    getSession: vi.fn<() => Promise<unknown>>(async () => ({ data: { session: null }, error: null })),
}));

vi.mock('../services/supabaseClient', () => ({
    setRememberMe: () => {},
    supabase: { auth: { getUser: (jwt?: string) => h.getUser(jwt), signOut: (options?: OptionsSignOut) => h.signOut(options), getSession: () => h.getSession() } },
}));

import { verifierSession, relireSession, DELAI_VERIFICATION_SESSION_MS, DELAI_CACHE_ECHEC_RAFRAICHISSEMENT_MS, INTERVALLE_REPRISE_MS } from '../services/auth';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const utilisateur = { id: 'u-banc', aud: 'authenticated', email: 'banc@moknet.net' };
const session = { access_token: 'jeton-de-banc', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: utilisateur } as unknown as Session;

beforeEach(() => {
    h.getUser.mockReset();
    h.signOut.mockClear();
    h.getSession.mockReset();
    h.getSession.mockResolvedValue({ data: { session: null }, error: null });
});

describe('verifierSession — verdict du serveur sur une session locale', () => {
    it('jeton accepté par le serveur pour le même utilisateur → valide, session conservée', async () => {
        h.getUser.mockResolvedValue({ data: { user: utilisateur }, error: null });
        const verdict = await verifierSession(session);
        expect(verdict).toEqual({ statut: 'valide', session });
        // La vérification porte sur CE jeton (passé explicitement, sans relire le stockage).
        expect(h.getUser).toHaveBeenCalledWith('jeton-de-banc');
        expect(h.signOut).not.toHaveBeenCalled();
    });

    it('refus 401 du serveur (jeton périmé, révoqué, forgé) → invalide, session locale effacée', async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthApiError('invalid JWT: unable to parse or verify signature', 401, 'bad_jwt') });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('invalide');
        expect((verdict as { raison: string }).raison).toContain('invalid JWT');
        expect(h.signOut).toHaveBeenCalledTimes(1);
        expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('compte supprimé ou banni (403 / user not found) → invalide, session locale effacée', async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthApiError('User from sub claim in JWT does not exist', 403, 'user_not_found') });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('invalide');
        expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('le serveur répond pour un AUTRE utilisateur que celui de la session locale → invalide', async () => {
        h.getUser.mockResolvedValue({ data: { user: { ...utilisateur, id: 'quelqu-un-d-autre' } }, error: null });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('invalide');
        expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('serveur injoignable (panne réseau, status 0) → non vérifiée, session conservée, RIEN effacé', async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError('Failed to fetch', 0) });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('non-verifiee');
        expect((verdict as { session: Session }).session).toBe(session);
        expect(h.signOut).not.toHaveBeenCalled();
    });

    it('serveur en panne (503) → non vérifiée, session conservée', async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError('Service Unavailable', 503) });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('non-verifiee');
        expect(h.signOut).not.toHaveBeenCalled();
    });

    it('429 (trop de requêtes) du serveur → non vérifiée, session conservée : ce n\'est pas un refus du jeton', async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthApiError('Too many requests', 429, 'over_request_rate_limit') });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('non-verifiee');
        expect(h.signOut).not.toHaveBeenCalled();
    });

    it('réponse non JSON d\'un intermédiaire (portail captif, proxy renvoyant une page 403) → non vérifiée, rien effacé', async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthUnknownError('Unexpected token < in JSON', new Error('html')) });
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('non-verifiee');
        expect(h.signOut).not.toHaveBeenCalled();
    });

    it('serveur sans réponse dans le délai → non vérifiée (jamais « invalide » sans verdict du serveur)', async () => {
        h.getUser.mockImplementation(() => new Promise(() => {}));
        const verdict = await verifierSession(session, 30);
        expect(verdict.statut).toBe('non-verifiee');
        expect((verdict as { raison: string }).raison).toContain('30 ms');
        expect(h.signOut).not.toHaveBeenCalled();
        expect(DELAI_VERIFICATION_SESSION_MS).toBeGreaterThanOrEqual(5000);
    });

    it('session locale incomplète (sans jeton) → invalide, sans appel au serveur', async () => {
        const verdict = await verifierSession({ ...session, access_token: '' } as Session);
        expect(verdict.statut).toBe('invalide');
        expect(h.getUser).not.toHaveBeenCalled();
        expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it("l'effacement local qui ne répond pas (POST /logout pendant) ne retient pas le verdict au-delà du délai", async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthApiError('invalid JWT', 401, 'bad_jwt') });
        h.signOut.mockImplementationOnce(() => new Promise(() => {}));
        const debut = Date.now();
        const verdict = await verifierSession(session, 40);
        expect(verdict.statut).toBe('invalide');
        expect(Date.now() - debut).toBeLessThan(1000);
        expect(h.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it("l'effacement local qui échoue ne masque pas le refus du serveur", async () => {
        h.getUser.mockResolvedValue({ data: { user: null }, error: new AuthApiError('invalid JWT', 401, 'bad_jwt') });
        h.signOut.mockRejectedValueOnce(new Error('stockage indisponible'));
        const verdict = await verifierSession(session);
        expect(verdict.statut).toBe('invalide');
    });
});

describe("relireSession — relecture détaillée de la session gardée par l'appareil (DEC-2026-083)", () => {
    const session = { access_token: 'jeton-de-banc', user: { id: 'u-1' } } as unknown as Session;

    it("session présente : « session », telle que relue", async () => {
        h.getSession.mockResolvedValue({ data: { session }, error: null });
        await expect(relireSession()).resolves.toEqual({ statut: 'session', session });
    });

    it("aucune session : « aucune »", async () => {
        h.getSession.mockResolvedValue({ data: { session: null }, error: null });
        await expect(relireSession()).resolves.toEqual({ statut: 'aucune' });
    });

    it("jeton expiré que supabase-js n'a pas pu rafraîchir (serveur injoignable, AuthRetryableFetchError) : « injoignable », session locale NON effacée", async () => {
        h.getSession.mockResolvedValue({ data: { session: null }, error: new AuthRetryableFetchError('Failed to fetch', 0) });
        const relecture = await relireSession();
        expect(relecture.statut).toBe('injoignable');
        expect(relecture.statut === 'injoignable' && relecture.raison).toContain('Failed to fetch');
        expect(h.signOut).not.toHaveBeenCalled();
    });

    it("erreur non liée au réseau (refus du jeton de rafraîchissement, déjà retiré par supabase-js) : « aucune »", async () => {
        const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            h.getSession.mockResolvedValue({ data: { session: null }, error: new AuthApiError('Invalid Refresh Token: Refresh Token Not Found', 400, 'refresh_token_not_found') });
            await expect(relireSession()).resolves.toEqual({ statut: 'aucune' });
        } finally {
            silence.mockRestore();
        }
    });
});

describe("garde-fous des délais de reprise (DEC-2026-083)", () => {
    it("DELAI_CACHE_ECHEC_RAFRAICHISSEMENT_MS suit REFRESH_FAILURE_COOLDOWN_MS de supabase-js (sinon la tentative programmée tomberait dans la fenêtre du cache)", () => {
        const source = readFileSync(resolve(__dirname, '..', 'node_modules', '@supabase', 'auth-js', 'dist', 'module', 'lib', 'constants.js'), 'utf8');
        const tick = /AUTO_REFRESH_TICK_DURATION_MS = ([0-9 *]+);/.exec(source);
        const cooldown = /REFRESH_FAILURE_COOLDOWN_MS = ([0-9 *]+) \* AUTO_REFRESH_TICK_DURATION_MS;/.exec(source);
        expect(tick, 'AUTO_REFRESH_TICK_DURATION_MS introuvable dans auth-js').not.toBeNull();
        expect(cooldown, 'REFRESH_FAILURE_COOLDOWN_MS introuvable dans auth-js').not.toBeNull();
        const produit = (expr: string) => expr.split('*').map((n) => Number(n.trim())).reduce((a, b) => a * b, 1);
        expect(DELAI_CACHE_ECHEC_RAFRAICHISSEMENT_MS).toBe(produit(cooldown![1]) * produit(tick![1]));
    });

    it("la minuterie de reprise est plus courte que la fenêtre du cache et le plafond de relecture plus court que la minuterie", () => {
        expect(INTERVALLE_REPRISE_MS).toBeLessThan(DELAI_CACHE_ECHEC_RAFRAICHISSEMENT_MS);
        expect(DELAI_VERIFICATION_SESSION_MS).toBeLessThan(INTERVALLE_REPRISE_MS);
    });
});
