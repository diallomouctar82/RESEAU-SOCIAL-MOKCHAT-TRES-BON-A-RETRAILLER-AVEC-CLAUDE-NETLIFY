import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    emitWaterRipple,
    emitWaterRippleFrom,
    subscribeWaterRipple,
    waterRippleListenerCount,
} from '../services/miroir/waterRipple';
import { WaterMirror, sampleStepForWidth, WATER_LINE_FRACTION } from '../components/miroir/WaterMirror';

/**
 * DS-M2b — habillage verre/eau du menu « Miroir d'eau ».
 *
 * Ce que ces tests couvrent réellement : le bus d'ondes (bornage, cycle de
 * vie des abonnements, robustesse) et le composant de nappe d'eau (montage,
 * dessin, respect de `prefers-reduced-motion`, nettoyage au démontage).
 *
 * Ce qu'ils ne couvrent PAS, et qu'aucun test ne peut couvrir ici : l'ASPECT
 * du rendu. jsdom n'a pas de moteur de rendu 2D — on peut vérifier que les
 * bonnes opérations de dessin sont émises, jamais que l'eau « a l'air
 * d'eau ». Le jugement visuel reste celui de la Direction, sur l'aperçu de
 * déploiement ou en production.
 */

/** Contexte 2D factice : jsdom n'implémente pas `getContext('2d')`. */
function fakeContext() {
    const gradient = { addColorStop: vi.fn() };
    return {
        calls: [] as string[],
        setTransform: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        clip: vi.fn(),
        createLinearGradient: vi.fn(() => gradient),
        createRadialGradient: vi.fn(() => gradient),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        shadowColor: '',
        shadowBlur: 0,
        globalCompositeOperation: 'source-over',
    };
}

let ctx: ReturnType<typeof fakeContext>;
let reduceMotion = false;
let rafCallbacks: FrameRequestCallback[];

beforeEach(() => {
    ctx = fakeContext();
    reduceMotion = false;
    rafCallbacks = [];

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
        ctx as unknown as CanvasRenderingContext2D,
    );
    // Une largeur/hauteur mesurable : jsdom rend tout à 0 px.
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { value: 390, configurable: true });
    Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { value: 812, configurable: true });

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion') ? reduceMotion : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    // On pilote la boucle d'animation à la main plutôt que de la laisser courir.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        rafCallbacks.push(cb);
        return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('bus d’ondes — services/miroir/waterRipple', () => {
    it('transmet la position et se désabonne proprement', () => {
        const seen: number[] = [];
        const before = waterRippleListenerCount();
        const off = subscribeWaterRipple(x => seen.push(x));
        expect(waterRippleListenerCount()).toBe(before + 1);

        emitWaterRipple(0.25);
        expect(seen).toEqual([0.25]);

        off();
        expect(waterRippleListenerCount()).toBe(before);
        emitWaterRipple(0.9);
        expect(seen).toEqual([0.25]); // plus rien après désabonnement
    });

    it('borne la position à [0, 1] et ramène une valeur non finie au milieu', () => {
        const seen: number[] = [];
        const off = subscribeWaterRipple(x => seen.push(x));
        emitWaterRipple(-3);
        emitWaterRipple(42);
        emitWaterRipple(Number.NaN);
        off();
        expect(seen).toEqual([0, 1, 0.5]);
    });

    it('un abonné qui lève n’empêche jamais les autres de recevoir l’onde', () => {
        const seen: number[] = [];
        const offBad = subscribeWaterRipple(() => {
            throw new Error('nappe absente');
        });
        const offGood = subscribeWaterRipple(x => seen.push(x));
        expect(() => emitWaterRipple(0.4)).not.toThrow();
        expect(seen).toEqual([0.4]);
        offBad();
        offGood();
    });

    it('emitWaterRippleFrom calcule le centre de l’élément, et retombe au milieu sans élément', () => {
        const seen: number[] = [];
        const off = subscribeWaterRipple(x => seen.push(x));
        Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });

        const el = document.createElement('button');
        el.getBoundingClientRect = () => ({ left: 90, width: 20, top: 0, height: 0, right: 110, bottom: 0, x: 90, y: 0, toJSON: () => ({}) });
        document.body.appendChild(el);
        emitWaterRippleFrom(el);
        expect(seen).toEqual([0.25]); // (90 + 10) / 400

        emitWaterRippleFrom(null);
        expect(seen).toEqual([0.25, 0.5]);
        off();
    });
});

describe('nappe d’eau — components/miroir/WaterMirror', () => {
    it('monte un canevas décoratif, jamais annoncé aux lecteurs d’écran', () => {
        const { getByTestId } = render(<WaterMirror />);
        const canvas = getByTestId('miroir-water-scene');
        expect(canvas.tagName).toBe('CANVAS');
        expect(canvas.getAttribute('aria-hidden')).toBe('true');
        expect(canvas.className).toContain('mir-scene');
    });

    it('dessine réellement le ciel, le corps de l’eau et la ligne de surface', () => {
        render(<WaterMirror />);
        // Une première image est peinte dès le montage via requestAnimationFrame.
        expect(rafCallbacks.length).toBe(1);
        rafCallbacks[0](16);

        expect(ctx.clearRect).toHaveBeenCalled();
        // Le ciel et le corps de l'eau sont deux dégradés linéaires distincts.
        expect(ctx.createLinearGradient.mock.calls.length).toBeGreaterThanOrEqual(2);
        // La nappe de lumière et la lueur du dock sont deux dégradés radiaux.
        expect(ctx.createRadialGradient.mock.calls.length).toBeGreaterThanOrEqual(2);
        // Les caustiques passent en composition additive puis reviennent.
        expect(ctx.globalCompositeOperation).toBe('source-over');
        expect(ctx.stroke).toHaveBeenCalled();
    });

    it('s’abonne aux ondes pendant qu’il est monté, et se désabonne au démontage', () => {
        const before = waterRippleListenerCount();
        const { unmount } = render(<WaterMirror />);
        expect(waterRippleListenerCount()).toBe(before + 1);
        // Une onde pendant que la nappe est vivante ne doit jamais lever.
        expect(() => emitWaterRipple(0.5)).not.toThrow();
        unmount();
        expect(waterRippleListenerCount()).toBe(before);
    });

    it('mouvement réduit : une seule image, aucune boucle, aucun abonnement', () => {
        reduceMotion = true;
        const before = waterRippleListenerCount();
        render(<WaterMirror />);
        expect(rafCallbacks.length).toBe(0);
        expect(ctx.clearRect).toHaveBeenCalledTimes(1);
        expect(waterRippleListenerCount()).toBe(before);
    });

    it('sans contexte 2D (navigateur sans canevas), le montage ne casse rien', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
        const before = waterRippleListenerCount();
        expect(() => render(<WaterMirror />)).not.toThrow();
        expect(waterRippleListenerCount()).toBe(before);
    });
});

describe('habillage « Miroir d’eau » — garde-fou des classes', () => {
    /**
     * Même famille de piège que les teintes `brand-*` absentes de la config
     * Tailwind (corrigées le 30/08) : une classe CSS inconnue n'est pas une
     * erreur, elle ne peint simplement RIEN, sans le moindre avertissement.
     * Ici les classes `.mir-*` sont écrites à la main dans le bloc <style>
     * d'index.html — une faute de frappe dans un composant passerait donc
     * totalement inaperçue. Ce test relit les deux côtés et les compare.
     */
    const ROOT = `${process.cwd()}/`;

    function walk(dir: string, out: string[] = []): string[] {
        for (const entry of readdirSync(dir)) {
            if (entry === 'node_modules' || entry.startsWith('.')) continue;
            const full = join(dir, entry);
            if (statSync(full).isDirectory()) walk(full, out);
            else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
        }
        return out;
    }

    it('toute classe .mir-* écrite dans un composant existe bien dans index.html', () => {
        const css = readFileSync(join(ROOT, 'index.html'), 'utf8');
        const defined = new Set(
            (css.match(/\.mir-[a-z-]+/g) ?? []).map(c => c.slice(1)),
        );
        expect(defined.size).toBeGreaterThan(0);

        const used = new Set<string>();
        for (const file of [...walk(join(ROOT, 'components')), ...walk(join(ROOT, 'services'))]) {
            const src = readFileSync(file, 'utf8');
            // Uniquement les occurrences en position de classe : on ignore les
            // variables CSS (`--mir-bg`) citées dans les commentaires.
            for (const m of src.match(/(?<![-\w])mir-[a-z-]+/g) ?? []) used.add(m);
        }

        const missing = [...used].filter(c => !defined.has(c)).sort();
        expect(missing).toEqual([]);
    });

    /**
     * DS-M2c — le défaut le plus coûteux de cette mission : l'habillage ne
     * vivait que dans `Layout`, c'est-à-dire APRÈS connexion. Quiconque
     * ouvrait un simple lien (un aperçu de déploiement est une autre origine,
     * aucune session n'y suit) arrivait sur `Auth` et voyait l'ancienne page —
     * « aucun changement visible ». Le code était livré, jamais peint.
     * Ces trois écrans d'avant-connexion doivent donc porter le monde.
     */
    it('les écrans d’avant-connexion portent l’habillage (sinon il est invisible sur un lien)', () => {
        for (const fichier of ['components/Auth.tsx', 'components/ResetPassword.tsx']) {
            const src = readFileSync(join(ROOT, fichier), 'utf8');
            expect(src, `${fichier} : data-miroir`).toMatch(/data-miroir/);
            expect(src, `${fichier} : nappe d’eau`).toMatch(/<WaterMirror\s*\/>/);
            expect(src, `${fichier} : ancien fond opaque retiré`).not.toMatch(/bg-\[#f0f2f5\]/);
        }
        // L'écran de chargement d'App.tsx, entre les deux, ne doit pas trancher.
        expect(readFileSync(join(ROOT, 'App.tsx'), 'utf8')).toMatch(/data-miroir className="h-screen/);
    });

    it('le périmètre est bien scopé : aucune règle .mir-* hors de [data-miroir]', () => {
        const css = readFileSync(join(ROOT, 'index.html'), 'utf8');
        const unscoped = (css.match(/^\s*\.mir-[a-z-]+/gm) ?? []).map(s => s.trim());
        expect(unscoped).toEqual([]);
    });
});

describe('échantillonnage de la ligne d’eau', () => {
    it('s’élargit sur les écrans larges pour ne pas peindre 480 points par image', () => {
        expect(sampleStepForWidth(390)).toBe(4);
        expect(sampleStepForWidth(520)).toBe(4);
        expect(sampleStepForWidth(900)).toBe(6);
        expect(sampleStepForWidth(1920)).toBe(8);
    });

    it('reste défensif sur une largeur absurde', () => {
        expect(sampleStepForWidth(0)).toBe(4);
        expect(sampleStepForWidth(-100)).toBe(4);
        expect(sampleStepForWidth(Number.NaN)).toBe(4);
    });

    it('garde la ligne d’eau à la hauteur de la maquette (58 %)', () => {
        expect(WATER_LINE_FRACTION).toBeCloseTo(0.58);
    });
});
