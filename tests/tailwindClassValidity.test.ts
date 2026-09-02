import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AU-8 — GARDE-FOU : le site charge Tailwind 3 (`cdn.tailwindcss.com` dans
 * index.html). Une classe écrite dans la syntaxe de Tailwind 4 n'est pas une
 * erreur : elle est ignorée EN SILENCE, et l'élément perd la propriété
 * concernée sans le moindre avertissement.
 *
 * C'est ce qui a réduit l'écran d'appel à une bande sur iPhone : une
 * proportion écrite sans crochets laissait la carte sans hauteur imposée en
 * dessous de 640 px, la variante `sm:` masquant le défaut sur ordinateur.
 * Même famille que les teintes `brand-*` absentes de la configuration, qui ne
 * peignaient rien.
 *
 * Ce test relit les sources et échoue si la syntaxe 4 réapparaît quelque part.
 */

/** Racine du dépôt : vitest s'exécute depuis celle-ci (`process.cwd()`). */
const ROOT = `${process.cwd()}/`;
const SCANNED_DIRS = ['components', 'hooks', 'services', 'contexts'];
const SCANNED_FILES = ['App.tsx', 'index.html'];
/** Proportion sans crochets — valide en Tailwind 4, ignorée par Tailwind 3. */
const V4_ASPECT = /\b(?:[a-z]+:)?aspect-\d+\/\d+/g;

function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry.startsWith('.')) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (/\.(tsx|ts|html)$/.test(entry)) out.push(full);
    }
    return out;
}

describe('classes Tailwind — la syntaxe doit correspondre à la version réellement chargée', () => {
    it('index.html charge bien Tailwind par le CDN 3 (prémisse de ce garde-fou)', () => {
        expect(readFileSync(join(ROOT, 'index.html'), 'utf8')).toContain('cdn.tailwindcss.com');
    });

    it('aucune proportion écrite sans crochets — elles sont ignorées en silence par Tailwind 3', () => {
        const files = [
            ...SCANNED_DIRS.flatMap((d) => walk(join(ROOT, d))),
            ...SCANNED_FILES.map((f) => join(ROOT, f)),
        ];
        const offenders: string[] = [];
        for (const file of files) {
            const found = readFileSync(file, 'utf8').match(V4_ASPECT);
            if (found) offenders.push(`${file.replace(ROOT, '')} → ${found.join(', ')}`);
        }
        expect(offenders).toEqual([]);
    });
});
