import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests du handler de la capacité Recherche (`search.universal.search`).
 *
 * Défaut relevé par l'audit du 30/08/2026 : la découverte annonçait « la
 * recherche dans MokNet (profils, publications, cours) » alors que la
 * capacité n'avait AUCUN handler — annoncée mais jamais exécutable.
 *
 * Les trois issues de `universalSearch` doivent rester distinctes :
 * échec réel (`degraded`) ≠ zéro résultat ≠ résultats — les confondre
 * reproduirait exactement la classe de faux succès que ce dépôt interdit.
 */

const universalSearch = vi.fn();
vi.mock('../services/supabaseClient', () => ({
    supabaseService: { universalSearch: (q: string) => universalSearch(q) },
}));

import { buildSearchCapabilityHandlers } from '../services/architecte/searchCapabilityHandlers';

const handler = buildSearchCapabilityHandlers()['search.universal.search'];

beforeEach(() => {
    universalSearch.mockReset();
});

describe('search.universal.search', () => {
    it('échec RPC (`degraded`) → ok:false, jamais présenté comme « aucun résultat »', async () => {
        universalSearch.mockResolvedValue({ results: [], degraded: true });
        const res = await handler({ query: 'fatou' });
        expect(res.ok).toBe(false);
        expect(res.message).toMatch(/n'a pas pu aboutir/);
        expect(res.message).not.toMatch(/Aucun résultat/);
    });

    it('zéro correspondance → ok:true avec une vraie réponse « aucun résultat »', async () => {
        universalSearch.mockResolvedValue({ results: [], degraded: false });
        const res = await handler({ query: 'xyzabsent' });
        expect(res.ok).toBe(true);
        expect(res.message).toMatch(/Aucun résultat pour « xyzabsent »/);
    });

    it('des correspondances → ok:true, compte exact et titres réels listés', async () => {
        universalSearch.mockResolvedValue({
            degraded: false,
            results: [
                { id: '1', type: 'profile', title: 'Fatou Diop', subtitle: 'Designer' },
                { id: '2', type: 'post', title: 'Évènement à Genève' },
            ],
        });
        const res = await handler({ query: 'fatou' });
        expect(res.ok).toBe(true);
        expect(res.message).toMatch(/^2 résultat\(s\)/);
        expect(res.message).toContain('profil : Fatou Diop (Designer)');
        expect(res.message).toContain('publication : Évènement à Genève');
    });

    it('au-delà de 5 résultats, le surplus est annoncé — jamais un compte tronqué en silence', async () => {
        universalSearch.mockResolvedValue({
            degraded: false,
            results: Array.from({ length: 7 }, (_, i) => ({ id: String(i), type: 'course', title: `Cours ${i}` })),
        });
        const res = await handler({ query: 'cours' });
        expect(res.message).toMatch(/^7 résultat\(s\)/);
        expect(res.message).toContain('et 2 autre(s)');
    });

    it('terme trop court → refus explicite, la RPC n\'est même pas appelée', async () => {
        const res = await handler({ query: 'a' });
        expect(res.ok).toBe(false);
        expect(universalSearch).not.toHaveBeenCalled();
    });

    it('tolère les formes de payload du modèle : `searchQuery`, `term`, ou une chaîne nue', async () => {
        universalSearch.mockResolvedValue({ results: [], degraded: false });
        await handler({ searchQuery: 'aa' });
        await handler({ term: 'bb' });
        await handler('cc');
        expect(universalSearch.mock.calls.map((c) => c[0])).toEqual(['aa', 'bb', 'cc']);
    });
});
