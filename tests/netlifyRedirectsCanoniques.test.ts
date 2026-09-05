/**
 * DOMAINE CANONIQUE (Direction, 05/09/2026 — DEC-2026-079) : toutes les
 * écritures du domaine (`www`, `http`) sont ramenées à `https://moknet.net`
 * par le serveur, avant l'application. Ce test lit `netlify.toml` tel qu'il
 * est déployé : les trois règles existent, dans la bonne forme (301, forcées,
 * `:splat` conservé), aucune règle ne repart de `https://moknet.net` (aucune
 * boucle possible), et les réécritures existantes (`/architecte`,
 * `/messagerie`) sont intactes.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Regle = Record<string, string | number | boolean>;

/** Lecture minimale des blocs `[[redirects]]` (clé = valeur, une par ligne). */
const lireRedirections = (toml: string): Regle[] => {
    const regles: Regle[] = [];
    let courante: Regle | null = null;
    for (const brute of toml.split('\n')) {
        const ligne = brute.trim();
        if (!ligne || ligne.startsWith('#')) continue;
        if (ligne === '[[redirects]]') { courante = {}; regles.push(courante); continue; }
        if (ligne.startsWith('[')) { courante = null; continue; }
        if (!courante) continue;
        const m = /^([A-Za-z_]+)\s*=\s*(.+)$/.exec(ligne);
        if (!m) continue;
        const [, cle, valeurBrute] = m;
        const v = valeurBrute.trim();
        courante[cle] = /^".*"$/.test(v) ? v.slice(1, -1) : v === 'true' ? true : v === 'false' ? false : Number(v);
    }
    return regles;
};

const toml = readFileSync(resolve(__dirname, '..', 'netlify.toml'), 'utf8');
const regles = lireRedirections(toml);
const parOrigine = (from: string) => regles.find((r) => r.from === from);

describe('netlify.toml — normalisation du domaine vers https://moknet.net', () => {
    it.each([
        ['https://www.moknet.net/*'],
        ['http://www.moknet.net/*'],
        ['http://moknet.net/*'],
    ])('%s → https://moknet.net/:splat, 301, forcée', (from) => {
        const regle = parOrigine(from);
        expect(regle, `règle absente pour ${from}`).toBeDefined();
        expect(regle).toMatchObject({ to: 'https://moknet.net/:splat', status: 301, force: true });
    });

    it('aucune règle ne repart du domaine canonique (aucune boucle possible)', () => {
        const depuisCanonique = regles.filter((r) => typeof r.from === 'string' && /^https:\/\/moknet\.net\//.test(r.from));
        expect(depuisCanonique).toEqual([]);
        const versWww = regles.filter((r) => typeof r.to === 'string' && /www\.moknet\.net/.test(r.to));
        expect(versWww).toEqual([]);
    });

    it('les réécritures existantes de l\'application sont intactes (/architecte, /messagerie)', () => {
        for (const from of ['/architecte', '/messagerie', '/messagerie/*']) {
            expect(parOrigine(from), from).toMatchObject({ to: '/index.html', status: 200 });
        }
    });

    it('les règles de domaine précèdent les réécritures de chemin', () => {
        const idxDomaine = regles.findIndex((r) => r.from === 'https://www.moknet.net/*');
        const idxChemin = regles.findIndex((r) => r.from === '/architecte');
        expect(idxDomaine).toBeGreaterThanOrEqual(0);
        expect(idxDomaine).toBeLessThan(idxChemin);
    });
});
