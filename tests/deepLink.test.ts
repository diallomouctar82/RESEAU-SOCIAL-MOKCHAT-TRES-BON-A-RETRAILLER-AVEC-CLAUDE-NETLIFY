import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseDeepLink } from '../services/navigation/deepLink';

/**
 * Le lien profond existe pour une raison précise, constatée le 04/09/2026 :
 * l'application écrivait `#onglet` dans l'URL depuis la LOOP I4 mais ne le
 * relisait jamais au démarrage. Aucune adresse ne pouvait donc ouvrir un
 * écran donné — et une consigne « ouvrez #super-admin » était intenable.
 *
 * Ces tests fixent le contrat, en particulier le cas qui casserait le plus
 * silencieusement : un hash d'authentification Supabase pris pour une route.
 */

describe('analyse du lien profond', () => {
    it('lit un onglet simple', () => {
        expect(parseDeepLink('#social')).toEqual({ tab: 'social', sub: '' });
        expect(parseDeepLink('social')).toEqual({ tab: 'social', sub: '' });
    });

    it('lit un onglet et son sous-onglet', () => {
        expect(parseDeepLink('#super-admin/sante')).toEqual({ tab: 'super-admin', sub: 'sante' });
    });

    it('conserve un sous-chemin à plusieurs niveaux', () => {
        expect(parseDeepLink('#super-admin/sante/securite')).toEqual({
            tab: 'super-admin', sub: 'sante/securite',
        });
    });

    it('ignore un hash vide', () => {
        expect(parseDeepLink('')).toBeNull();
        expect(parseDeepLink('#')).toBeNull();
        expect(parseDeepLink('   ')).toBeNull();
    });

    it("ignore les fragments d'authentification Supabase — jamais des routes", () => {
        // Les prendre pour un onglet enverrait la personne sur un écran vide
        // juste après avoir cliqué un lien de connexion ou de récupération.
        expect(parseDeepLink('#access_token=eyJhbGciOi&expires_in=3600')).toBeNull();
        expect(parseDeepLink('#refresh_token=abc123')).toBeNull();
        expect(parseDeepLink('#type=recovery&token=xyz')).toBeNull();
        expect(parseDeepLink('#error_description=Invalid+login')).toBeNull();
    });

    it('tolère la casse des fragments d\'authentification', () => {
        expect(parseDeepLink('#ACCESS_TOKEN=abc')).toBeNull();
    });
});

describe('sélection de l\'onglet de départ', () => {
    // `initialTab` et `initialSubTab` s'appuient sur un hash figé à l'import
    // du module ; on teste ici la logique de liste blanche telle qu'elle est
    // appliquée, via l'analyseur qui la nourrit.
    const AUTORISES = new Set(['social', 'super-admin', 'home']);

    const choisir = (hash: string, defaut = 'social') => {
        const route = parseDeepLink(hash);
        return route && AUTORISES.has(route.tab) ? route.tab : defaut;
    };

    it('retient un onglet connu', () => {
        expect(choisir('#super-admin/sante')).toBe('super-admin');
    });

    it('retombe sur le défaut pour un onglet inconnu — jamais un écran vide', () => {
        expect(choisir('#onglet-qui-nexiste-pas')).toBe('social');
        expect(choisir('#recherche')).toBe('social');
    });

    it('retombe sur le défaut pour un fragment d\'authentification', () => {
        expect(choisir('#access_token=abc&expires_in=3600')).toBe('social');
    });
});

describe('capture du hash au chargement — le mécanisme réellement utilisé', () => {
    /**
     * `INITIAL_DEEP_LINK` est figé à l'import du module. Pour l'éprouver, on
     * pose le hash PUIS on réimporte le module : c'est exactement la séquence
     * que vit le navigateur au chargement de la page.
     */
    const chargerAvecHash = async (hash: string) => {
        window.location.hash = hash;
        vi.resetModules();
        return import('../services/navigation/deepLink');
    };

    it('#super-admin/sante ouvre bien le sous-onglet « sante » de la console', async () => {
        const m = await chargerAvecHash('#super-admin/sante');
        expect(m.INITIAL_DEEP_LINK).toEqual({ tab: 'super-admin', sub: 'sante' });
        expect(m.initialSubTab('super-admin')).toBe('sante');
        expect(m.initialTab(new Set(['social', 'super-admin']), 'social')).toBe('super-admin');
    });

    it('ne rend le sous-onglet qu\'à l\'onglet qui l\'a demandé', async () => {
        const m = await chargerAvecHash('#super-admin/sante');
        expect(m.initialSubTab('social')).toBeNull();
        expect(m.initialSubTab('admin')).toBeNull();
    });

    it('sans sous-onglet, la console garde son onglet par défaut', async () => {
        const m = await chargerAvecHash('#super-admin');
        expect(m.initialSubTab('super-admin')).toBeNull();
        expect(m.initialTab(new Set(['super-admin']), 'social')).toBe('super-admin');
    });

    it('un retour de connexion Supabase ne détourne pas la navigation', async () => {
        const m = await chargerAvecHash('#access_token=eyJhbGciOi&expires_in=3600');
        expect(m.INITIAL_DEEP_LINK).toBeNull();
        expect(m.initialTab(new Set(['social', 'super-admin']), 'social')).toBe('social');
    });
});

/**
 * Troisième défaut de la même famille, trouvé le 04/09/2026 en suivant le
 * parcours réel de connexion : `signInWithOAuth` renvoie sur la RACINE
 * (`redirectTo: window.location.origin`). Le hash ne survit donc pas à
 * l'aller-retour chez Google. Quelqu'un qui ouvre `…/#super-admin/sante`
 * puis se connecte atterrissait sur l'onglet par défaut — il ne voyait PAS
 * l'écran qu'on lui demandait de constater, tout en étant sur la bonne
 * version. Exactement le symptôme qu'on cherchait à faire disparaître.
 */
describe('survie du lien profond à la connexion OAuth', () => {
    const charger = async (hash: string) => {
        vi.resetModules();
        window.location.hash = hash;
        return import('../services/navigation/deepLink');
    };

    beforeEach(() => {
        sessionStorage.clear();
        window.location.hash = '';
    });

    it('reprend la route mise de côté quand le retour de connexion n\'a plus de hash', async () => {
        const aller = await charger('#super-admin/sante');
        aller.rememberDeepLink();

        const retour = await charger('');           // retour OAuth : racine nue
        expect(retour.INITIAL_DEEP_LINK).toEqual({ tab: 'super-admin', sub: 'sante' });
    });

    it("reprend la route même quand le retour porte un fragment d'authentification", async () => {
        const aller = await charger('#super-admin/sante');
        aller.rememberDeepLink();

        const retour = await charger('#access_token=eyJhbGciOi&expires_in=3600');
        expect(retour.INITIAL_DEEP_LINK).toEqual({ tab: 'super-admin', sub: 'sante' });
    });

    it("l'URL prime toujours sur la route mise de côté", async () => {
        const aller = await charger('#super-admin/sante');
        aller.rememberDeepLink();

        const retour = await charger('#wallet');
        expect(retour.INITIAL_DEEP_LINK).toEqual({ tab: 'wallet', sub: '' });
    });

    it('ne sert qu\'une fois : un second chargement ne rouvre pas le même écran', async () => {
        const aller = await charger('#super-admin/sante');
        aller.rememberDeepLink();

        const premier = await charger('');
        expect(premier.INITIAL_DEEP_LINK).not.toBeNull();

        const second = await charger('');
        expect(second.INITIAL_DEEP_LINK).toBeNull();
    });

    it('ignore une route périmée plutôt que de rouvrir un écran des heures après', async () => {
        sessionStorage.setItem('mok_lien_profond', JSON.stringify({
            tab: 'super-admin', sub: 'sante', at: Date.now() - 16 * 60 * 1000,
        }));
        const m = await charger('');
        expect(m.INITIAL_DEEP_LINK).toBeNull();
    });

    it('ignore un contenu illisible sans faire tomber le démarrage', async () => {
        sessionStorage.setItem('mok_lien_profond', 'ceci n\'est pas du JSON');
        const m = await charger('');
        expect(m.INITIAL_DEEP_LINK).toBeNull();
    });

    it('ne met rien de côté quand il n\'y a pas de route à retenir', async () => {
        const m = await charger('');
        m.rememberDeepLink();
        expect(sessionStorage.getItem('mok_lien_profond')).toBeNull();
    });
});
