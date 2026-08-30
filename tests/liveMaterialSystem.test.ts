import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIVE_VISUAL_UNIVERSES, spawnWaterRipple } from '../services/live/liveMaterialSystem';

/**
 * Direction artistique Studio Live (30/08/2026) — la matière vivante.
 * L'onde d'appui est décorative : elle doit naître à l'endroit exact du
 * contact, disparaître seule, et surtout ne JAMAIS s'imposer à un
 * utilisateur qui demande une réduction du mouvement (prefers-reduced-motion)
 * — ce dernier point est intestable en navigateur headless classique, d'où
 * sa preuve ici.
 */

const setReducedMotion = (matches: boolean) => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
};

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = '';
});

describe('spawnWaterRipple — onde d\'appui', () => {
    it('crée un point d\'onde aux coordonnées exactes du contact, relatives à l\'hôte', () => {
        setReducedMotion(false);
        const host = document.createElement('div');
        document.body.appendChild(host);
        host.getBoundingClientRect = () => ({ left: 100, top: 50, right: 0, bottom: 0, width: 0, height: 0, x: 100, y: 50, toJSON: () => ({}) });

        spawnWaterRipple({ clientX: 340, clientY: 210 }, host);

        const dot = host.querySelector<HTMLSpanElement>('.water-ripple-dot');
        expect(dot).not.toBeNull();
        expect(dot!.style.left).toBe('240px');
        expect(dot!.style.top).toBe('160px');
    });

    it('retire le point à la fin de son animation (animationend)', () => {
        setReducedMotion(false);
        const host = document.createElement('div');
        document.body.appendChild(host);

        spawnWaterRipple({ clientX: 10, clientY: 10 }, host);
        const dot = host.querySelector('.water-ripple-dot');
        expect(dot).not.toBeNull();

        dot!.dispatchEvent(new Event('animationend'));
        expect(host.querySelector('.water-ripple-dot')).toBeNull();
    });

    it('filet de sécurité : retire le point après ~900ms même sans animationend (onglet en arrière-plan)', () => {
        setReducedMotion(false);
        vi.useFakeTimers();
        const host = document.createElement('div');
        document.body.appendChild(host);

        spawnWaterRipple({ clientX: 10, clientY: 10 }, host);
        expect(host.querySelector('.water-ripple-dot')).not.toBeNull();

        vi.advanceTimersByTime(950);
        expect(host.querySelector('.water-ripple-dot')).toBeNull();
    });

    it('no-op complet sous prefers-reduced-motion — la matière n\'impose rien', () => {
        setReducedMotion(true);
        const host = document.createElement('div');
        document.body.appendChild(host);

        spawnWaterRipple({ clientX: 340, clientY: 210 }, host);
        expect(host.querySelector('.water-ripple-dot')).toBeNull();
    });

    it('no-op silencieux sans hôte (écran démonté entre l\'appui et le rendu)', () => {
        setReducedMotion(false);
        expect(() => spawnWaterRipple({ clientX: 0, clientY: 0 }, null)).not.toThrow();
    });
});

describe('LIVE_VISUAL_UNIVERSES — les 7 univers de l\'image de référence', () => {
    it('expose exactement 7 univers, identifiants uniques, incluant les 2 nouveaux (solaire_chaud, rose_doux)', () => {
        const ids = LIVE_VISUAL_UNIVERSES.map((u) => u.id);
        expect(ids).toHaveLength(7);
        expect(new Set(ids).size).toBe(7);
        expect(ids).toContain('solaire_chaud');
        expect(ids).toContain('rose_doux');
        expect(ids).toContain('crystal');
    });
});
