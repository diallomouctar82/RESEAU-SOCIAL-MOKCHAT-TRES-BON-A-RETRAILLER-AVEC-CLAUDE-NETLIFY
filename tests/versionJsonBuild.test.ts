/**
 * `version.json` et `__MOKNET_BUILD__` — la carte d'identité du déploiement.
 * Fonctions pures du plugin Vite : rien d'inventé, une valeur inconnue reste
 * `null` ; le commit vient de l'environnement Netlify (`COMMIT_REF`) ou, à
 * défaut, de Git ; le fichier est émis à la racine du build avec le bundle
 * d'entrée.
 */
import { describe, expect, it, vi } from 'vitest';
import { commitDepuisGit, construireVersionJson, estBundleDEntree, versionJsonPlugin } from '../vite-plugins/versionJson';

const quand = new Date('2026-09-05T20:00:00.000Z');

describe('construireVersionJson', () => {
    it('lit COMMIT_REF, DEPLOY_ID, BRANCH, CONTEXT posés par Netlify', () => {
        const v = construireVersionJson('v6.45.0', { COMMIT_REF: 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e', DEPLOY_ID: '6a9c6540a62aa9000714444b', BRANCH: 'main', CONTEXT: 'production' }, quand, '/assets/index-ABCD.js', () => 'jamais');
        expect(v).toEqual({
            version: 'v6.45.0', commit: 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e', deployId: '6a9c6540a62aa9000714444b',
            branche: 'main', contexte: 'production', construitLe: '2026-09-05T20:00:00.000Z', bundle: '/assets/index-ABCD.js',
        });
    });

    it('sans COMMIT_REF, demande le commit à Git ; sans Git, null — jamais une valeur inventée', () => {
        const git = vi.fn(() => 'daa6575f6a5aa6d2159dda51b4fe5c94e32d5cd8');
        expect(construireVersionJson('v6.45.0', {}, quand, null, git).commit).toBe('daa6575f6a5aa6d2159dda51b4fe5c94e32d5cd8');
        expect(git).toHaveBeenCalledTimes(1);
        const sans = construireVersionJson('v6.45.0', { COMMIT_REF: '   ' }, quand, null, () => null);
        expect(sans.commit).toBeNull();
        expect(sans.deployId).toBeNull();
        expect(sans.branche).toBeNull();
        expect(sans.contexte).toBeNull();
        expect(sans.bundle).toBeNull();
    });
});

describe('commitDepuisGit', () => {
    it('n’accepte qu’un SHA complet ; une commande qui échoue donne null', () => {
        expect(commitDepuisGit(() => 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e\n')).toBe('f6d9a168ed4bffbddb3a8dde593b6e059327f74e');
        expect(commitDepuisGit(() => 'fatal: not a git repository')).toBeNull();
        expect(commitDepuisGit(() => { throw new Error('git absent'); })).toBeNull();
    });
});

describe('plugin Vite', () => {
    it('reconnaît le fragment d’entrée et émet version.json à la racine avec son chemin', () => {
        expect(estBundleDEntree('assets/index-BVbYhx9t.js', true)).toBe(true);
        expect(estBundleDEntree('assets/index-Chzw7cpa.js', false)).toBe(false);
        expect(estBundleDEntree('assets/vendor-abc.js', true)).toBe(false);

        const plugin = versionJsonPlugin('v6.45.0', { COMMIT_REF: 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e', CONTEXT: 'deploy-preview' });
        expect(plugin.apply).toBe('build');
        const emitFile = vi.fn();
        const generateBundle = plugin.generateBundle as unknown as (this: { emitFile: typeof emitFile }, options: unknown, bundle: Record<string, unknown>) => void;
        generateBundle.call({ emitFile }, {}, {
            'assets/index-Chzw7cpa.js': { type: 'chunk', isEntry: false },
            'assets/index-BVbYhx9t.js': { type: 'chunk', isEntry: true },
            'index.html': { type: 'asset' },
        });
        expect(emitFile).toHaveBeenCalledTimes(1);
        const appel = emitFile.mock.calls[0][0] as { type: string; fileName: string; source: string };
        expect(appel.type).toBe('asset');
        expect(appel.fileName).toBe('version.json');
        const contenu = JSON.parse(appel.source);
        expect(contenu.version).toBe('v6.45.0');
        expect(contenu.commit).toBe('f6d9a168ed4bffbddb3a8dde593b6e059327f74e');
        expect(contenu.contexte).toBe('deploy-preview');
        expect(contenu.bundle).toBe('/assets/index-BVbYhx9t.js');
    });
});
