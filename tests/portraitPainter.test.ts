import { describe, expect, it } from 'vitest';
import {
    JAW_TAPER_PERCENT,
    LOWER_LIP_SHARE,
    NECK_BAND_PERCENT,
    jawColumnTaper,
    jawProfile,
    jawProfile2D,
    jawSpan,
    lipOpening,
} from '../services/architecte/portraitPainter';
import { DEFAULT_PORTRAIT_RIG } from '../services/architecte/livingAvatar';
import { DEFAULT_MOUTH_ANCHOR } from '../services/architecte/architecteAvatar';

/**
 * GÉOMÉTRIE DU PEINTRE — ce qui fait qu'une mâchoire se DÉFORME au lieu de
 * descendre d'un bloc. Refonte du 04/09 après « pas assez fluide ni naturel » :
 * la lèvre du bas suit 80 % du menton, le cou ne bouge pas, les joues
 * s'atténuent — sans couture nulle part.
 */
describe('Profil vertical de la mâchoire', () => {
    const rig = DEFAULT_PORTRAIT_RIG;
    const lip = DEFAULT_MOUTH_ANCHOR.yPercent;

    it('ne bouge rien au-dessus de la ligne des lèvres : la lèvre du haut est fixe', () => {
        expect(jawProfile(lip - 0.01, rig, lip)).toBe(0);
        expect(jawProfile(40, rig, lip)).toBe(0);
    });

    it('la lèvre du bas suit 80 % du menton, le menton 100 %', () => {
        expect(jawProfile(lip, rig, lip)).toBeCloseTo(LOWER_LIP_SHARE, 6);
        expect(jawProfile(rig.chinLinePercent, rig, lip)).toBeCloseTo(1, 6);
    });

    it('le cou ne bouge pas : retour à zéro sous le menton, en douceur', () => {
        const neck = rig.chinLinePercent + NECK_BAND_PERCENT;
        expect(jawProfile(neck, rig, lip)).toBe(0);
        expect(jawProfile(neck + 5, rig, lip)).toBe(0);
        const milieu = jawProfile(rig.chinLinePercent + NECK_BAND_PERCENT / 2, rig, lip);
        expect(milieu).toBeGreaterThan(0.4);
        expect(milieu).toBeLessThan(0.6);
    });

    it('est monotone de la lèvre au menton, puis décroissante : aucune couture possible', () => {
        let precedent = -1;
        for (let y = lip; y <= rig.chinLinePercent; y += 0.25) {
            const v = jawProfile(y, rig, lip);
            expect(v).toBeGreaterThanOrEqual(precedent);
            precedent = v;
        }
        precedent = jawProfile(rig.chinLinePercent, rig, lip);
        for (let y = rig.chinLinePercent; y <= rig.chinLinePercent + NECK_BAND_PERCENT; y += 0.25) {
            const v = jawProfile(y, rig, lip);
            expect(v).toBeLessThanOrEqual(precedent + 1e-9);
            precedent = v;
        }
    });

    it('un calage aberrant (menton au-dessus des lèvres) ne produit ni NaN ni division par zéro', () => {
        const casse = { ...rig, chinLinePercent: lip - 10 };
        for (let y = 0; y <= 100; y += 1) expect(Number.isFinite(jawProfile(y, casse, lip))).toBe(true);
    });
});

describe('Atténuation horizontale vers les joues', () => {
    const mouth = DEFAULT_MOUTH_ANCHOR;

    it('pleine sur la bouche, nulle sur les joues, continue entre les deux', () => {
        expect(jawColumnTaper(mouth.xPercent, mouth)).toBe(1);
        expect(jawColumnTaper(mouth.xPercent + mouth.widthPercent / 2, mouth)).toBe(1);
        const { left, right } = jawSpan(mouth);
        expect(jawColumnTaper(left, mouth)).toBe(0);
        expect(jawColumnTaper(right, mouth)).toBe(0);
        let precedent = 1;
        for (let x = mouth.xPercent; x <= right; x += 0.2) {
            const v = jawColumnTaper(x, mouth);
            expect(v).toBeLessThanOrEqual(precedent + 1e-9);
            expect(Math.abs(v - precedent)).toBeLessThan(0.08); // pas de marche visible
            precedent = v;
        }
    });

    it('est symétrique autour du centre de la bouche', () => {
        for (let d = 0; d < JAW_TAPER_PERCENT + 10; d += 0.5) {
            expect(jawColumnTaper(mouth.xPercent - d, mouth)).toBeCloseTo(jawColumnTaper(mouth.xPercent + d, mouth), 9);
        }
    });

    it('la zone redessinée reste dans le cadre', () => {
        const { left, right } = jawSpan({ ...mouth, xPercent: 3, widthPercent: 60 });
        expect(left).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(100);
    });
});

describe('Fente entre les lèvres et profil en deux dimensions', () => {
    const rig = DEFAULT_PORTRAIT_RIG;
    const mouth = DEFAULT_MOUTH_ANCHOR;
    const lip = mouth.yPercent;

    it('la fente est pleine au centre et NULLE aux commissures — les coins restent attachés', () => {
        expect(lipOpening(mouth.xPercent, mouth)).toBeCloseTo(1, 6);
        expect(lipOpening(mouth.xPercent + mouth.widthPercent / 2, mouth)).toBe(0);
        expect(lipOpening(mouth.xPercent - mouth.widthPercent, mouth)).toBe(0);
        // Une bouche qui s'étire (largeur > 1) ouvre plus loin vers les commissures.
        const presqueAuCoin = mouth.xPercent + mouth.widthPercent * 0.46;
        expect(lipOpening(presqueAuCoin, mouth, 1.1)).toBeGreaterThan(lipOpening(presqueAuCoin, mouth, 1));
    });

    it('rien ne bouge au-dessus de la ligne des lèvres, nulle part', () => {
        for (let x = 0; x <= 100; x += 2) expect(jawProfile2D(x, lip - 0.01, rig, lip, mouth)).toBe(0);
    });

    it('juste sous la ligne : 80 % au centre de la bouche, 0 aux commissures et sur les joues', () => {
        expect(jawProfile2D(mouth.xPercent, lip + 1e-6, rig, lip, mouth)).toBeCloseTo(LOWER_LIP_SHARE, 3);
        expect(jawProfile2D(mouth.xPercent + mouth.widthPercent / 2, lip + 1e-6, rig, lip, mouth)).toBeCloseTo(0, 3);
        expect(jawProfile2D(mouth.xPercent + 20, lip + 1e-6, rig, lip, mouth)).toBeCloseTo(0, 3);
    });

    it('au menton, tout descend d’un bloc quelle que soit la position horizontale', () => {
        for (let x = 30; x <= 75; x += 5) expect(jawProfile2D(x, rig.chinLinePercent, rig, lip, mouth)).toBeCloseTo(1, 6);
    });

    it('est continu sur la joue : aucune marche entre deux hauteurs voisines', () => {
        const x = mouth.xPercent + mouth.widthPercent / 2 + 3;
        let precedent = 0;
        for (let y = lip; y <= rig.chinLinePercent + NECK_BAND_PERCENT; y += 0.1) {
            const v = jawProfile2D(x, y, rig, lip, mouth);
            expect(Math.abs(v - precedent)).toBeLessThan(0.03);
            precedent = v;
        }
    });
});
