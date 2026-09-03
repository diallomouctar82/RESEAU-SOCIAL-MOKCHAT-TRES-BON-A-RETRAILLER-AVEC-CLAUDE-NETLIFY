import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { LiveBubbles, LiveVoiceWave } from '../components/live/LiveMatter';
import { LIVE_VISUAL_UNIVERSES } from '../services/live/liveMaterialSystem';
import { liveBadge } from '../hooks/useLiveTransport';

/**
 * DS-L1 — matière du Studio Live, d'après l'image de référence du 03/09/2026.
 *
 * Le garde-fou central est le même que celui posé pour « Miroir d'eau » et
 * pour les teintes `brand-*` : une classe utilisée dans le code mais ABSENTE
 * de la feuille de style ne peint rien, sans erreur ni avertissement. Ce
 * fichier vérifie donc que chaque `.live-*` employée par le Studio existe
 * réellement, et que chacun des sept univers redéfinit bien la teinte de
 * l'abysse (sinon un univers se retrouverait avec le fond d'un autre).
 *
 * Ce qu'aucun test ici ne couvre : l'ASPECT. jsdom n'a pas de moteur de
 * rendu — le jugement visuel reste celui de la Direction, sur l'aperçu.
 */

const ROOT = join(__dirname, '..');
const INDEX = readFileSync(join(ROOT, 'index.html'), 'utf8');
const STUDIO = readFileSync(join(ROOT, 'components/SocialLive.tsx'), 'utf8');
const MATTER = readFileSync(join(ROOT, 'components/live/LiveMatter.tsx'), 'utf8');
// La barre d'actions vit DANS le Studio : elle consomme les mêmes variables,
// et doit donc être couverte par le même garde-fou.
const BARRE = readFileSync(join(ROOT, 'components/LiveSmartActionBar.tsx'), 'utf8');

afterEach(() => cleanup());

describe('DS-L1 — la matière du Studio existe réellement dans la feuille de style', () => {
    it('chaque classe .live-* utilisée par le Studio est définie dans index.html', () => {
        const utilisees = new Set<string>();
        for (const source of [STUDIO, MATTER, BARRE]) {
            // Le `(?<!-)` écarte les VARIABLES (`--live-line`) : elles sont
            // vérifiées séparément juste en dessous, avec un autre critère.
            for (const m of source.matchAll(/(?<!-)\blive-[a-z-]+(?:--[a-z]+)?/g)) {
                // `live-universe` vient de l'attribut data-live-universe, pas d'une classe.
                if (m[0] === 'live-universe') continue;
                utilisees.add(m[0]);
            }
        }
        expect(utilisees.size).toBeGreaterThan(5);
        for (const classe of utilisees) {
            expect(INDEX, `.${classe} utilisée mais jamais définie — elle ne peindrait rien`)
                .toContain(`.${classe}`);
        }
    });

    it('chaque variable --live-* référencée est réellement déclarée', () => {
        const referencees = new Set<string>();
        for (const source of [STUDIO, MATTER, BARRE, INDEX]) {
            for (const m of source.matchAll(/var\((--live-[a-z-]+)/g)) referencees.add(m[1]);
        }
        expect(referencees.size).toBeGreaterThan(3);
        for (const variable of referencees) {
            expect(INDEX, `${variable} référencée mais jamais déclarée — la valeur de repli passerait inaperçue`)
                .toMatch(new RegExp(`${variable}\\s*:`));
        }
    });

    it('les sept univers redéfinissent la teinte de l’abysse (aucun n’hérite du fond d’un autre)', () => {
        for (const univers of LIVE_VISUAL_UNIVERSES) {
            if (univers.id === 'crystal') {
                // La référence est portée par le bloc générique [data-live-universe].
                expect(INDEX).toMatch(/\[data-live-universe\]\s*\{[^}]*--live-abyss-a/);
                continue;
            }
            const bloc = new RegExp(
                `\\[data-live-universe="${univers.id}"\\][^{]*\\{[^}]*--live-abyss-a`,
                's',
            );
            expect(INDEX, `univers ${univers.id} : abysse non redéfini`).toMatch(bloc);
        }
    });

    it('le mouvement réduit fige la matière (colonne d’eau, bulles, onde, point « en direct »)', () => {
        const bloc = INDEX.slice(INDEX.indexOf('@media (prefers-reduced-motion: reduce)'));
        for (const selecteur of ['.live-current', '.live-bubbles span', '.live-wave i', '.live-onair::before']) {
            expect(bloc.slice(0, 900)).toContain(selecteur);
        }
    });

    it('la scène ne repose plus sur un aplat opaque : l’abysse est le fond du Studio', () => {
        expect(STUDIO).toContain('live-abyss');
        expect(STUDIO, 'un aplat slate-950 plein masquerait l’abysse')
            .not.toMatch(/gap-[34] bg-slate-950/);
    });
});

describe('DS-L1 — « ● EN DIRECT » ne s’affiche que quand le direct passe vraiment', () => {
    it('à l’antenne : petites capitales, jamais la pastille rouge', () => {
        expect(liveBadge(true, 'connected', false).isOnAir).toBe(true);
    });

    it('aperçu, interruption, reconnexion, connexion : l’anomalie garde sa pastille', () => {
        expect(liveBadge(false, 'connected', false).isOnAir).toBe(false);
        expect(liveBadge(true, 'connected', true).isOnAir).toBe(false);
        expect(liveBadge(true, 'reconnecting', false).isOnAir).toBe(false);
        expect(liveBadge(true, 'connecting', false).isOnAir).toBe(false);
    });
});

describe('DS-L1 — bulles et onde de voix', () => {
    it('les bulles sont déterministes : deux rendus donnent exactement les mêmes positions', () => {
        const { container } = render(<LiveBubbles />);
        const premier = Array.from(container.querySelectorAll('span span')).map(n => (n as HTMLElement).style.left);
        cleanup();
        const { container: second } = render(<LiveBubbles />);
        const suivant = Array.from(second.querySelectorAll('span span')).map(n => (n as HTMLElement).style.left);
        expect(premier).toEqual(suivant);
        expect(premier.length).toBe(5);
    });

    it('l’onde suit le VRAI niveau audio quand on l’a, et ne mime rien quand on ne l’a pas', () => {
        const { container } = render(<LiveVoiceWave level={100} />);
        const barre = container.querySelector('i') as HTMLElement;
        expect(barre.style.transform).toBe('scaleY(1)');
        cleanup();

        const { container: sansMesure } = render(<LiveVoiceWave />);
        expect((sansMesure.querySelector('i') as HTMLElement).style.transform).toBe('');
    });

    it('micro coupé : l’onde est visiblement au repos, jamais une fausse parole', () => {
        const { container } = render(<LiveVoiceWave level={90} muted />);
        expect(container.querySelector('span')?.className).toContain('live-wave--muted');
        expect((container.querySelector('i') as HTMLElement).style.transform).toBe('');
    });
});
