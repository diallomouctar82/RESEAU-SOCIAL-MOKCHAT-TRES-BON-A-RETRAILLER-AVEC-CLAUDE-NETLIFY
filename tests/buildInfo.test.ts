import { describe, it, expect } from 'vitest';
import {
    BUILD, buildKind, buildLabel, shortCommit, isNonProduction,
    type BuildIdentity,
} from '../services/build/buildInfo';

const faire = (p: Partial<BuildIdentity>): BuildIdentity => ({
    contexte: null, commit: null, branche: null, pr: null, construitLe: '', ...p,
});

describe('identité de la version affichée', () => {
    it("ne lève pas quand __MOK_BUILD__ n'existe pas (cas des tests)", () => {
        // C'est le piège qui aurait fait tomber toute la console Super Admin :
        // une constante injectée au build, lue sans garde ailleurs.
        expect(BUILD).toBeDefined();
        expect(buildKind(BUILD)).toBe('local');
    });

    it('distingue production, aperçu, branche et local', () => {
        expect(buildKind(faire({ contexte: 'production' }))).toBe('production');
        expect(buildKind(faire({ contexte: 'deploy-preview' }))).toBe('apercu');
        expect(buildKind(faire({ contexte: 'branch-deploy' }))).toBe('branche');
        expect(buildKind(faire({}))).toBe('local');
    });

    it('nomme un aperçu par son numéro de PR, pas par le jargon du constructeur', () => {
        const label = buildLabel(faire({
            contexte: 'deploy-preview', pr: '70', commit: '35019ca69ccb08af9e3db46193afe3c216b03a98',
        }));
        expect(label).toBe('Aperçu PR #70 · 35019ca');
        expect(label).not.toContain('deploy-preview');
    });

    it('affiche la production sobrement, avec son commit', () => {
        expect(buildLabel(faire({ contexte: 'production', commit: 'abcdef1234567' })))
            .toBe('Production · abcdef1');
    });

    it("dit « local » plutôt que d'inventer une identité absente", () => {
        expect(buildLabel(faire({}))).toBe('Développement local');
        expect(shortCommit(faire({}))).toBeNull();
    });

    it('signale toute version qui n\'est PAS la production', () => {
        expect(isNonProduction(faire({ contexte: 'production' }))).toBe(false);
        expect(isNonProduction(faire({ contexte: 'deploy-preview' }))).toBe(true);
        expect(isNonProduction(faire({ contexte: 'branch-deploy' }))).toBe(true);
        expect(isNonProduction(faire({}))).toBe(true);
    });

    it('tronque un SHA à 7 caractères sans casser un SHA déjà court', () => {
        expect(shortCommit(faire({ commit: '35019ca69ccb08af' }))).toBe('35019ca');
        expect(shortCommit(faire({ commit: 'abc' }))).toBe('abc');
    });
});

describe('le bandeau ne peut plus être identique partout', () => {
    it('production et aperçu produisent deux libellés différents', () => {
        const prod = buildLabel(faire({ contexte: 'production', commit: '1111111aaaa' }));
        const apercu = buildLabel(faire({ contexte: 'deploy-preview', pr: '70', commit: '1111111aaaa' }));
        // Le défaut d'origine : « Diallo OS v2.5 » au bit près des deux côtés.
        expect(prod).not.toBe(apercu);
    });
});
