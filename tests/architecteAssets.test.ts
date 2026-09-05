/**
 * ACTIFS D'USINE DE L'ARCHITECTE — empreintes (revue indépendante de la v6.42.1,
 * constat 8f) : le portrait, sa silhouette et l'affiche de la présentation ne
 * sont pas signés par le registre des séquences (qui ne signe que les vidéos).
 * Ce test les signe : un remplacement silencieux d'un fichier d'usine se voit.
 * Mettre à jour les empreintes SEULEMENT avec le fichier régénéré par le moteur
 * de production (option Super-Admin) ou par la chaîne vidéo documentée.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Même résolution que `architecteSequences.test.ts` : la suite tourne depuis la racine du dépôt. */
const publicDir = path.join(process.cwd(), 'public', 'architecte') + path.sep;

/** Portrait d'usine, silhouette et affiche livrés avec la v6.42.1 (bande sombre corrigée). */
export const FACTORY_ASSETS = [
    { file: 'architecte.webp', sizeBytes: 21368, sha256: 'b24a16a47aec74c2bad39d1a5f0893cf701bf2c21b5c725bd281326810d717c1' },
    { file: 'architecte-silhouette.png', sizeBytes: 16953, sha256: 'dfec6ebfb778f6bfc73acf63878e2b1bd90da102d23183f027a7a45da99744a5' },
    { file: 'vision-smart-heygen.webp', sizeBytes: 6122, sha256: 'cc75d16ce8825beb5cac080500ab4fc3bb31348188fdd520c5d72a9f9c34666c' },
] as const;

describe('Actifs d’usine de l’Architecte — empreintes', () => {
    it.each(FACTORY_ASSETS)('$file est servi tel quel (taille et sha256 signés)', ({ file, sizeBytes, sha256 }) => {
        const bytes = readFileSync(publicDir + file);
        expect(bytes.length).toBe(sizeBytes);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256);
    });
});
