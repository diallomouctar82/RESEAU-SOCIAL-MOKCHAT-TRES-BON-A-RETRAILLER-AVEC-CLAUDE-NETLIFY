import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ExpertsCatalogue, PHRASE_EXPERTS } from '../components/ExpertsCatalogue';
import { AGENTS } from '../constants';
import type { DossierParcours } from '../types';

/**
 * DEC-2026-055 — « Plateaux de cristal » (direction D choisie par la Direction).
 *
 * L'entrée de l'espace Experts ne montre plus qu'UNE phrase et les experts en
 * bulles de cristal ; le bandeau sombre, la recherche, les filtres et les
 * cartes ont disparu de l'affichage. Aucune fonction n'est supprimée : les
 * actions de l'ancienne carte vivent dans une fiche ouverte au clic.
 * Les tests de la mission Mobile (D1a/D3, fondations de index.html) sont
 * conservés en bas de fichier.
 */

const renderCatalogue = (props: Partial<React.ComponentProps<typeof ExpertsCatalogue>> = {}) => {
    const spies = {
        onSelectAgentForChat: vi.fn(),
        onStartCallWithAgent: vi.fn(),
        onStartVideoWithAgent: vi.fn(),
        onCreateDossierWithAgent: vi.fn(),
        onShareDocWithAgent: vi.fn()
    };
    const utils = render(<ExpertsCatalogue {...spies} dossiers={[]} {...props} />);
    return { ...utils, spies };
};

/** jsdom ne connaît pas PointerEvent : on émet un MouseEvent nommé pointermove, avec pointerType. */
const bougerPointeur = (cible: Element, clientX: number, clientY: number, pointerType: string) => {
    const ev = new MouseEvent('pointermove', { bubbles: true, cancelable: true, clientX, clientY });
    Object.defineProperty(ev, 'pointerType', { value: pointerType });
    cible.dispatchEvent(ev);
};

const plateauDe = (nom: string) =>
    screen.getByRole('button', { name: new RegExp(`^${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — `) });

describe('ExpertsCatalogue — les 13 spécialistes, tous présents', () => {
    it('le catalogue compte exactement 13 spécialistes (10 IA + 3 humains) — jamais « 14 »', () => {
        expect(AGENTS).toHaveLength(13);
        expect(AGENTS.filter((a) => !a.isHuman)).toHaveLength(10);
        expect(AGENTS.filter((a) => a.isHuman)).toHaveLength(3);
    });

    it('rend les 13 experts, chacun par son nom sous sa bulle, avec un plateau cliquable qui annonce une fiche', () => {
        const { container } = renderCatalogue();
        const noms = Array.from(container.querySelectorAll('.cristal-nom')).map((n) => n.textContent);
        expect(noms).toEqual(AGENTS.map((a) => a.name));
        const plateaux = container.querySelectorAll('button.cristal-plateau');
        expect(plateaux).toHaveLength(13);
        plateaux.forEach((p) => expect(p.getAttribute('aria-haspopup')).toBe('dialog'));
        // Un portrait dans chaque bulle, jamais un portrait sans bulle.
        expect(container.querySelectorAll('.cristal-bulle img')).toHaveLength(13);
    });

    it('sous chaque bulle, le rôle court (sans le préfixe « Expert ») — pas de description, pas de compétences, pas de notes', () => {
        const { container } = renderCatalogue();
        const roles = Array.from(container.querySelectorAll('.cristal-role')).map((r) => r.textContent);
        expect(roles[0]).toBe('Langues & Traduction');
        expect(roles[1]).toBe('Juridique & Droit');
        expect(roles.every((r) => !/^Expert\s/.test(r || ''))).toBe(true);
        // Le rôle des humains est leur titre complet (il ne commence pas par « Expert »).
        expect(roles[10]).toBe('Avocate au Barreau & Juriste Conseil');
        // Aucune note, aucun compteur d'avis, aucune compétence sur la scène.
        const scene = container.querySelector('.cristal-scene')!;
        expect(scene.textContent).not.toMatch(/4\.9|\(120\)|Compétences Clés|Humain Vérifié|Expert IA 24\/7/);
    });
});

describe('ExpertsCatalogue — une seule phrase, rien d\'autre au-dessus des bulles', () => {
    it('affiche exactement UNE fois la phrase choisie par la Direction, AVANT la scène', () => {
        const { container } = renderCatalogue();
        expect(PHRASE_EXPERTS).toBe(
            'Nos experts vous accompagnent avec des conseils fiables, des orientations pratiques et une assistance adaptée à vos besoins.'
        );
        const phrases = screen.getAllByText(PHRASE_EXPERTS);
        expect(phrases).toHaveLength(1);
        const phrase = phrases[0];
        const scene = container.querySelector('.cristal-scene')!;
        // eslint-disable-next-line no-bitwise
        expect(phrase.compareDocumentPosition(scene) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        // Rien d'autre que la phrase avant la scène.
        const panneau = container.querySelector('[data-testid="experts-cristal"]')!;
        const avantScene: string[] = [];
        for (const enfant of Array.from(panneau.children)) {
            if (enfant === scene) break;
            avantScene.push(enfant.textContent || '');
        }
        expect(avantScene).toEqual([PHRASE_EXPERTS]);
    });

    it("l'ancien bandeau, la recherche, les filtres et la bascule Tous/IA/Humains ne sont plus affichés", () => {
        const { container } = renderCatalogue();
        expect(screen.queryByText(/Accompagnement Continu & Multimodal de Vie/)).toBeNull();
        expect(screen.queryByText(/Écosystème des Experts/)).toBeNull();
        expect(screen.queryByText(/Chaque expert vous accompagne pas à pas/)).toBeNull();
        expect(screen.queryByPlaceholderText(/Rechercher par nom/)).toBeNull();
        expect(screen.queryByText(/Tous \(13\)/)).toBeNull();
        expect(screen.queryByText(/Toutes les Spécialités/)).toBeNull();
        // Aucune zone de saisie tant qu'aucune fiche n'est ouverte.
        expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
        // Aucun fond sombre : la Direction a refusé le fond de l'inspiration.
        expect(container.querySelector('.from-slate-900, .bg-slate-900')).toBeNull();
    });
});

describe('ExpertsCatalogue — la fiche au clic : toutes les actions conservées', () => {
    it("un clic sur la bulle ouvre une fiche (dialog modal) au nom de l'expert, avec les cinq actions d'un expert IA", () => {
        renderCatalogue();
        const agent = AGENTS[0];
        expect(screen.queryByRole('dialog')).toBeNull();
        fireEvent.click(plateauDe(agent.name));
        const fiche = screen.getByRole('dialog');
        expect(fiche.getAttribute('aria-modal')).toBe('true');
        expect(within(fiche).getByRole('heading', { level: 2 }).textContent).toBe(agent.name);
        expect(within(fiche).getByText(agent.title)).toBeInTheDocument();
        expect(within(fiche).getByText(agent.description)).toBeInTheDocument();
        for (const libelle of ['Discuter', 'Vocal', 'Vidéo', 'Nouveau dossier', 'Analyser un fichier']) {
            expect(within(fiche).getByRole('button', { name: new RegExp(libelle) })).toBeInTheDocument();
        }
        expect(within(fiche).queryByRole('button', { name: /Prendre RDV/ })).toBeNull();
        expect(within(fiche).getByText(/Expert IA 24\/7/)).toBeInTheDocument();
    });

    it('chaque action appelle le bon rappel AVEC le bon expert, puis referme la fiche', () => {
        const { spies } = renderCatalogue();
        const agent = AGENTS[2];
        const cas: Array<[RegExp, keyof typeof spies]> = [
            [/^Discuter$/, 'onSelectAgentForChat'],
            [/^Vocal$/, 'onStartCallWithAgent'],
            [/^Vidéo$/, 'onStartVideoWithAgent'],
            [/^Nouveau dossier$/, 'onCreateDossierWithAgent'],
            [/^Analyser un fichier$/, 'onShareDocWithAgent']
        ];
        for (const [libelle, spy] of cas) {
            fireEvent.click(plateauDe(agent.name));
            fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: libelle }));
            expect(spies[spy]).toHaveBeenCalledTimes(1);
            expect(spies[spy].mock.calls[0][0]).toBe(agent);
            expect(screen.queryByRole('dialog')).toBeNull();
        }
    });

    it('un expert humain propose « Prendre RDV » à la place de « Analyser un fichier », et le RDV ouvre le formulaire existant', () => {
        renderCatalogue();
        const humain = AGENTS.find((a) => a.isHuman)!;
        fireEvent.click(plateauDe(humain.name));
        const fiche = screen.getByRole('dialog');
        expect(within(fiche).getByText(/Humain vérifié/)).toBeInTheDocument();
        expect(within(fiche).getByText(new RegExp(`${humain.hourlyRate} €/h`))).toBeInTheDocument();
        expect(within(fiche).queryByRole('button', { name: /Analyser un fichier/ })).toBeNull();
        fireEvent.click(within(fiche).getByRole('button', { name: /Prendre RDV/ }));
        expect(screen.getByText(`Rendez-vous avec ${humain.name}`)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Valider la Réservation/ })).toBeInTheDocument();
        expect(screen.getByLabelText(/Objet de la Consultation/)).toBeInTheDocument();
    });

    it('Échap, le bouton Fermer et un clic sur le voile referment la fiche sans rien déclencher', () => {
        const { spies } = renderCatalogue();
        const agent = AGENTS[4];

        fireEvent.click(plateauDe(agent.name));
        fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();

        fireEvent.click(plateauDe(agent.name));
        fireEvent.click(screen.getByRole('button', { name: /Fermer la fiche/ }));
        expect(screen.queryByRole('dialog')).toBeNull();

        fireEvent.click(plateauDe(agent.name));
        fireEvent.click(screen.getByTestId('experts-fiche-voile'));
        expect(screen.queryByRole('dialog')).toBeNull();

        Object.values(spies).forEach((spy) => expect(spy).not.toHaveBeenCalled());
    });

    it('la fiche montre le dossier en cours dont cet expert est le référent', () => {
        const agent = AGENTS[7];
        const dossier = { id: 'd-test', title: 'Dossier de contrôle', leadAgentId: agent.id, progress: 42 } as unknown as DossierParcours;
        renderCatalogue({ dossiers: [dossier] });
        fireEvent.click(plateauDe(agent.name));
        const fiche = screen.getByRole('dialog');
        expect(within(fiche).getByText('Dossier de contrôle')).toBeInTheDocument();
        expect(within(fiche).getByText('42%')).toBeInTheDocument();
        // Un autre expert ne l'affiche pas.
        fireEvent.keyDown(document.activeElement || document.body, { key: 'Escape' });
        fireEvent.click(plateauDe(AGENTS[0].name));
        expect(within(screen.getByRole('dialog')).queryByText('Dossier de contrôle')).toBeNull();
    });
});

describe('ExpertsCatalogue — le mouvement des bulles', () => {
    it('chaque plateau reçoit ses propres phases de flottement et de halo (jamais toutes en chœur)', () => {
        const { container } = renderCatalogue();
        const styles = Array.from(container.querySelectorAll('button.cristal-plateau')).map((p) => p.getAttribute('style') || '');
        styles.forEach((s) => {
            expect(s).toMatch(/--tf:\s*\d+(\.\d+)?s/);
            expect(s).toMatch(/--df:\s*-?\d+(\.\d+)?s/);
            expect(s).toMatch(/--th:\s*\d+s/);
            expect(s).toMatch(/--dh:\s*-?\d+(\.\d+)?s/);
        });
        expect(new Set(styles).size).toBeGreaterThan(5);
    });

    it("l'inclinaison 3D suit le pointeur (variables CSS sur le plateau) et se relâche quand il sort", () => {
        renderCatalogue();
        const plateau = plateauDe(AGENTS[1].name) as HTMLButtonElement;
        plateau.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
        bougerPointeur(plateau, 150, 30, 'mouse');
        expect(plateau.style.getPropertyValue('--ry')).toBe('5.5deg');
        expect(plateau.style.getPropertyValue('--rx')).toBe('5.4deg');
        expect(plateau.style.getPropertyValue('--px')).toBe('-1.5px');
        fireEvent.pointerLeave(plateau);
        expect(plateau.style.getPropertyValue('--ry')).toBe('');
        expect(plateau.style.getPropertyValue('--rx')).toBe('');
    });

    it("au doigt (tactile), aucune inclinaison n'est appliquée", () => {
        renderCatalogue();
        const plateau = plateauDe(AGENTS[1].name) as HTMLButtonElement;
        plateau.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
        bougerPointeur(plateau, 150, 30, 'touch');
        expect(plateau.style.getPropertyValue('--ry')).toBe('');
    });
});

describe('index.html — le bloc « PLATEAUX DE CRISTAL »', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    const fin = html.indexOf('/* ===== FIN PLATEAUX DE CRISTAL ===== */');
    const titre = html.indexOf('EXPERTS — PLATEAUX DE CRISTAL (DEC-2026-055)');
    const debut = html.lastIndexOf('/*', titre);
    const bloc = html.slice(debut, fin);

    it('existe, est borné, et vit HORS de la couche aqua générée', () => {
        expect(titre).toBeGreaterThan(0);
        expect(fin).toBeGreaterThan(titre);
        expect(fin).toBeLessThan(html.indexOf('DÉBUT COUCHE AQUA GÉNÉRÉE'));
        expect(html.match(/FIN PLATEAUX DE CRISTAL/g)).toHaveLength(1);
    });

    it('définit la scène, le plateau, la bulle, ses reflets, la pastille et la fiche', () => {
        for (const sel of [
            '.cristal-panneau {', '.cristal-phrase {', '.cristal-scene {', '.cristal-expert:nth-child(2n)',
            '.cristal-plateau::before', '.cristal-plateau::after', '.cristal-flotteur {', '.cristal-bulle {',
            '.cristal-bulle::before', '.cristal-bulle::after', '.cristal-lumiere {', '.cristal-pastille {',
            '.cristal-nom {', '.cristal-role {', '.cristal-voile {', '.cristal-fiche {', '.cristal-action {'
        ]) {
            expect(bloc, sel).toContain(sel);
        }
        for (const anim of ['cristal-flotte', 'cristal-halo', 'cristal-tourne', 'cristal-pouls', 'cristal-surgit']) {
            expect(bloc).toContain(`@keyframes ${anim}`);
        }
    });

    it('le flottement et le survol vivent sur deux couches distinctes (le flottement ne peut pas annuler le survol)', () => {
        expect(bloc).toMatch(/\.cristal-flotteur \{[^}]*animation: cristal-flotte/);
        expect(bloc).toMatch(/\.cristal-bulle \{[^}]*transform: translateY\(var\(--lift, 0px\)\) scale\(var\(--sc, 1\)\) rotateX\(var\(--rx, 0deg\)\) rotateY\(var\(--ry, 0deg\)\)/);
        expect(bloc).toMatch(/\.cristal-plateau:hover \.cristal-flotteur \{ animation-play-state: paused; \}/);
    });

    it("s'adapte : 5 par rangée sur ordinateur, 3 sur tablette, 2 sur téléphone, décalage conservé", () => {
        expect(bloc).toMatch(/\.cristal-expert \{[^}]*flex: 0 0 20%/);
        expect(bloc).toMatch(/@media \(max-width: 1023px\) \{[^@]*flex-basis: 33\.333%/);
        expect(bloc).toMatch(/@media \(max-width: 639px\) \{[^@]*flex-basis: 50%/);
        expect(bloc).toMatch(/@media \(max-width: 639px\) \{[^@]*\.cristal-expert:nth-child\(2n\) \{ transform: translateY\(18px\); \}/);
    });

    it("respecte prefers-reduced-motion : plus aucune animation ni transition", () => {
        const reduit = bloc.slice(bloc.indexOf('@media (prefers-reduced-motion: reduce)'));
        expect(reduit).toMatch(/\.cristal-flotteur,[\s\S]*?\.cristal-lumiere,[\s\S]*?animation: none !important/);
        expect(reduit).toMatch(/\.cristal-bulle img,[\s\S]*?transition: none/);
    });

    it('ne comporte que des sélecteurs courts et sans accent (garde-fou miroirFeuilleAnalysee)', () => {
        const sansCommentaires = bloc.replace(/\/\*[\s\S]*?\*\//g, '');
        const selecteurs = Array.from(sansCommentaires.matchAll(/(^|\}|\{)\s*([^{}@]+?)\s*\{/g)).map((m) => m[2].trim());
        expect(selecteurs.length).toBeGreaterThan(40);
        for (const s of selecteurs) {
            expect(s.length, s).toBeLessThan(200);
            expect(s, s).not.toMatch(/[éèàçû«»`]/);
        }
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
