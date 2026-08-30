import { describe, expect, it } from 'vitest';
import {
    buildDocxArrayBuffer,
    deliverableFileName,
    detectDeliverableFormat,
    isDeliverableCommand,
} from '../services/architecte/deliverableBuilder';

/**
 * Tests des livrables (§15 — aller jusqu'au fichier final).
 *
 * Le test central est la BOUCLE COMPLÈTE du .docx : le fichier généré par
 * `buildDocxArrayBuffer` est relu par mammoth — le même lecteur que le
 * moteur d'extraction — et doit restituer exactement le texte. Un .docx qui
 * ne se rouvre pas serait un faux livrable.
 */

describe('Détection de la demande', () => {
    it('reconnaît les formulations réelles', () => {
        expect(isDeliverableCommand('Corrige-le et donne-le moi à télécharger')).toBe(true);
        expect(isDeliverableCommand('génère le document final en Word')).toBe(true);
        expect(isDeliverableCommand('recrée ce document proprement')).toBe(true);
        expect(isDeliverableCommand('quel est le prix du ciment ?')).toBe(false);
    });

    it('formats : Word/CSV/markdown/texte, et PDF réorienté honnêtement vers .docx', () => {
        expect(detectDeliverableFormat("en Word s'il te plaît")).toEqual({ format: 'docx', pdfRedirected: false });
        expect(detectDeliverableFormat('en CSV')).toEqual({ format: 'csv', pdfRedirected: false });
        expect(detectDeliverableFormat('en markdown')).toEqual({ format: 'md', pdfRedirected: false });
        expect(detectDeliverableFormat('donne-le moi en PDF')).toEqual({ format: 'docx', pdfRedirected: true });
    });

    it('nomme le fichier final depuis le document source', () => {
        expect(deliverableFileName('inventaire-preuve.xlsx', 'docx')).toBe('inventaire-preuve-final.docx');
        expect(deliverableFileName(undefined, 'md')).toBe('document-architecte-final.md');
    });
});

describe('Boucle complète .docx — générer puis RELIRE', () => {
    it('le .docx produit est un vrai document Word que mammoth restitue fidèlement', async () => {
        const contenu = 'Inventaire corrigé du 30 août.\nCiment : 120 sacs à 85 000 GNF.\nTotal général : 16 050 000 GNF.';
        const buffer = await buildDocxArrayBuffer(contenu);

        const mammoth = await import('mammoth');
        const relu = await mammoth.extractRawText({ buffer: Buffer.from(buffer) } as any);
        expect(relu.value).toContain('Inventaire corrigé du 30 août.');
        expect(relu.value).toContain('Ciment : 120 sacs à 85 000 GNF.');
        expect(relu.value).toContain('Total général : 16 050 000 GNF.');
    });

    it('échappe le XML — un contenu avec <, > et & ne corrompt jamais le paquet', async () => {
        const buffer = await buildDocxArrayBuffer('Si x < 10 & y > 2 alors « ok »');
        const mammoth = await import('mammoth');
        const relu = await mammoth.extractRawText({ buffer: Buffer.from(buffer) } as any);
        expect(relu.value).toContain('Si x < 10 & y > 2 alors « ok »');
    });
});
