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
}));

vi.mock('../services/supabaseClient', () => ({
    setRememberMe: () => {},
    supabase: { auth: { getUser: (jwt?: string) => h.getUser(jwt), signOut: (options?: OptionsSignOut) => h.signOut(options) } },
}));

import { verifierSession, DELAI_VERIFICATION_SESSION_MS } from '../services/auth';

const utilisateur = { id: 'u-banc', aud: 'authenticated', email: 'banc@moknet.net' };
const session = { access_token: 'jeton-de-banc', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: utilisateur } as unknown as Session;

beforeEach(() => {
    h.getUser.mockReset();
    h.signOut.mockClear();
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
