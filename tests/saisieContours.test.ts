import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * DEC-2026-053 — deux consignes de la Direction, prouvées à la source :
 *  1. le composeur du réseau social invite avec le texte exact demandé ;
 *  2. TOUTES les zones de saisie ont un contour renforcé, par une règle
 *     globale d'index.html dont la spécificité domine les utilitaires
 *     Tailwind et la couche aqua générée, quel que soit l'ordre d'injection.
 *
 * jsdom n'applique pas les feuilles de style du CDN : la preuve visuelle
 * (bordure mesurée en navigateur réel) est dans les captures avant/après ;
 * ce test garde la règle et le texte contre une régression silencieuse.
 */
const RACINE = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
const feed = fs.readFileSync(path.join(RACINE, 'components', 'SocialFeed.tsx'), 'utf8');

describe('composeur du réseau social', () => {
    it('invite avec le texte exact de la Direction, et plus jamais avec le prénom codé en dur', () => {
        expect(feed).toContain('placeholder="Quoi de neuf ? Partage une réflexion, une opportunité, un tutoriel ou un document."');
        expect(feed).not.toContain('Quoi de neuf, Amadou');
    });
});

describe('contours des zones de saisie (index.html)', () => {
    const debut = html.indexOf('ZONES DE SAISIE — CONTOURS RENFORCÉS');
    // Du commentaire d'en-tête (inclus, pour que le retrait des commentaires le couvre) à la marque de fin.
    const bloc = html.slice(html.lastIndexOf('/*', debut), html.indexOf('FIN ZONES DE SAISIE'));

    it('existe, borné, hors de la couche aqua générée (le générateur ne doit jamais l’écraser)', () => {
        expect(debut).toBeGreaterThan(-1);
        expect(html.indexOf('FIN ZONES DE SAISIE')).toBeGreaterThan(debut);
        expect(html.indexOf('DÉBUT COUCHE AQUA GÉNÉRÉE')).toBeGreaterThan(html.indexOf('FIN ZONES DE SAISIE'));
        expect(bloc.length).toBeGreaterThan(200);
    });

    it('cible les champs texte et les textarea, jamais les cases, boutons radio, curseurs ou boutons', () => {
        for (const type of ['text', 'email', 'password', 'search', 'number', 'tel', 'url']) {
            expect(bloc).toContain(`input[type="${type}"]:not(.saisie-sans-contour)`);
        }
        expect(bloc).toContain('input:not([type]):not(.saisie-sans-contour)');
        expect(bloc).toMatch(/\n\s*textarea:not\(/);
        for (const type of ['checkbox', 'radio', 'range', 'file', 'submit', 'button']) {
            expect(bloc).not.toContain(`input[type="${type}"]`);
        }
    });

    it('reste sous la garde des 200 caractères par sélecteur (tests/miroirFeuilleAnalysee)', () => {
        const declarations = bloc.replace(/\/\*[\s\S]*?\*\//g, '');
        const selecteurs = declarations.split('{')[0].split(',').map((x) => x.trim()).filter(Boolean);
        expect(selecteurs.length).toBe(10);
        for (const s of selecteurs) expect(s.length).toBeLessThan(200);
    });

    it('pose un trait de 2 px dérivé de la couleur du texte (55 %), avec un repli sans color-mix, et un accent aqua au focus', () => {
        expect(bloc).toContain('border-width: 2px;');
        expect(bloc).toContain('border-style: solid;');
        expect(bloc).toContain('border-color: rgba(100, 116, 139, 0.85);');
        expect(bloc).toContain('border-color: color-mix(in srgb, currentColor 55%, transparent);');
        expect(bloc).toMatch(/:focus,?\s*[\s\S]*?\{\s*border-color: #0e7490;\s*\}/);
    });

    it('ne touche ni aux rayons, ni aux fonds, ni aux anneaux de focus', () => {
        // Seules les déclarations comptent : les commentaires sont retirés avant l'examen.
        const declarations = bloc.replace(/\/\*[\s\S]*?\*\//g, '');
        for (const prop of ['border-radius', 'background', 'box-shadow', 'outline']) {
            expect(declarations).not.toMatch(new RegExp(`^\\s*${prop}\\s*:`, 'm'));
        }
    });
});
