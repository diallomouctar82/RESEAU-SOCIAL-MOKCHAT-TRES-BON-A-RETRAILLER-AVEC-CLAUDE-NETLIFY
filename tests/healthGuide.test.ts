import { describe, expect, it } from 'vitest';
import { REPO_URL, resolveGuideUrl, supabaseDashboardUrl } from '../services/health/healthGuide';

describe('liens des guides d\'action manuelle', () => {
    it('déduit la console Supabase du projet réellement servi', () => {
        expect(supabaseDashboardUrl('https://rqciahtpixdjbyoajomg.supabase.co'))
            .toBe('https://supabase.com/dashboard/project/rqciahtpixdjbyoajomg');
    });

    it('ne fabrique aucun lien vers un projet inventé', () => {
        expect(supabaseDashboardUrl('placeholder')).toBeNull();
        expect(supabaseDashboardUrl('https://placeholder')).toBeNull();
        expect(supabaseDashboardUrl(undefined)).toBeNull();
        expect(resolveGuideUrl('{supabase}/sql/new', { supabaseUrl: 'placeholder' })).toBeNull();
    });

    it('résout {supabase} et {repo}', () => {
        expect(resolveGuideUrl('{supabase}/sql/new', { supabaseUrl: 'https://rqciahtpixdjbyoajomg.supabase.co' }))
            .toBe('https://supabase.com/dashboard/project/rqciahtpixdjbyoajomg/sql/new');
        expect(resolveGuideUrl('{repo}/blob/main/index.html', { supabaseUrl: null }))
            .toBe(`${REPO_URL}/blob/main/index.html`);
    });

    it('laisse passer un lien https complet et refuse le reste', () => {
        expect(resolveGuideUrl('https://example.org/x', { supabaseUrl: null })).toBe('https://example.org/x');
        expect(resolveGuideUrl('javascript:alert(1)', { supabaseUrl: null })).toBeNull();
        expect(resolveGuideUrl(undefined, { supabaseUrl: null })).toBeNull();
    });
});
