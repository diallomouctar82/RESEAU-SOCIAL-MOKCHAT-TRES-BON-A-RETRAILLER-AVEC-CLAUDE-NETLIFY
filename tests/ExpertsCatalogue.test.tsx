import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ExpertsCatalogue } from '../components/ExpertsCatalogue';
import { AGENTS } from '../constants';

/**
 * Équipe Mobile + Super Admin — défauts D1/D2/D3/D8.
 *
 * « Le téléphone ne montre pas tous les experts » : les onglets/filtres
 * défilent horizontalement avec une barre masquée (.no-scrollbar) qui
 * n'était définie NULLE PART, sans aucune affordance de débordement, et la
 * bascule Tous/IA/Humains débordait de son conteneur nowrap sur mobile.
 * Ces tests verrouillent les correctifs.
 */

const noop = () => {};

const renderCatalogue = () =>
    render(
        <ExpertsCatalogue
            onSelectAgentForChat={noop}
            onStartCallWithAgent={noop}
            onStartVideoWithAgent={noop}
            onCreateDossierWithAgent={noop}
            dossiers={[]}
        />
    );

describe('ExpertsCatalogue — catalogue complet des 13 spécialistes', () => {
    it('le catalogue compte exactement 13 spécialistes (10 IA + 3 humains) — jamais « 14 »', () => {
        expect(AGENTS).toHaveLength(13);
        expect(AGENTS.filter((a) => !a.isHuman)).toHaveLength(10);
        expect(AGENTS.filter((a) => a.isHuman)).toHaveLength(3);
    });

    it('rend les 13 agents, chacun par son nom, avec les compteurs exacts de la bascule', () => {
        renderCatalogue();
        for (const agent of AGENTS) {
            expect(screen.getByText(agent.name)).toBeInTheDocument();
        }
        expect(screen.getByText(/Tous \(13\)/)).toBeInTheDocument();
        expect(screen.getByText(/Experts IA 24\/7 \(10\)/)).toBeInTheDocument();
        expect(screen.getByText(/Experts Humains Vérifiés \(3\)/)).toBeInTheDocument();
    });

    it('D2 — la bascule Tous/IA/Humains porte flex-wrap (plus de débordement sur 390px)', () => {
        renderCatalogue();
        const tousButton = screen.getByText(/Tous \(13\)/).closest('button');
        expect(tousButton).not.toBeNull();
        const toggleContainer = tousButton!.parentElement!;
        expect(toggleContainer.className).toContain('flex-wrap');
    });

    it('D1 — le strip des filtres garde no-scrollbar ET reçoit le voile dégradé mobile (affordance de débordement)', () => {
        const { container } = renderCatalogue();
        const strip = container.querySelector('.no-scrollbar.overflow-x-auto');
        expect(strip).not.toBeNull();
        // Le voile est un frère du strip dans un conteneur relatif : visible
        // uniquement en mobile, jamais interactif, jamais lu par un lecteur
        // d'écran.
        const fade = strip!.parentElement!.querySelector(
            '.pointer-events-none.bg-gradient-to-l'
        );
        expect(fade).not.toBeNull();
        expect(fade!.className).toContain('md:hidden');
        expect(fade!.getAttribute('aria-hidden')).toBe('true');
        expect(strip!.parentElement!.className).toContain('relative');
    });
});

describe('index.html — fondations mobiles (D1a, D3)', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');

    it('D1a — définit réellement .no-scrollbar/.scrollbar-none/.scrollbar-thin utilisées par ~30 composants', () => {
        expect(html).toMatch(/\.no-scrollbar[\s\S]*?scrollbar-width:\s*none/);
        expect(html).toMatch(/\.scrollbar-none[\s\S]*?scrollbar-width:\s*none/);
        expect(html).toMatch(/\.no-scrollbar::-webkit-scrollbar[\s\S]*?display:\s*none/);
        expect(html).toMatch(/\.scrollbar-thin\s*\{[\s\S]*?scrollbar-width:\s*thin/);
    });

    it('D3 — le meta viewport porte viewport-fit=cover (sinon env(safe-area-inset-*) vaut 0 sur iOS)', () => {
        expect(html).toMatch(/<meta\s+name="viewport"[^>]*viewport-fit=cover/);
    });
});
