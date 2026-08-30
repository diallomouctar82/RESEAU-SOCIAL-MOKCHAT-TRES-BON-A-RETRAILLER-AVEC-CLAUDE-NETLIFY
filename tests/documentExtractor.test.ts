import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { extractDocumentText, UnsupportedDocumentError } from '../services/architecte/documentExtractor';

/**
 * Tests du moteur d'extraction : chaque format est construit RÉELLEMENT
 * (un vrai classeur écrit par SheetJS, un vrai ZIP XML pour Word/PowerPoint)
 * puis relu par le moteur — jamais un simple mock qui prouverait seulement
 * que le mock fonctionne. Le PDF, qui exige le worker pdfjs, est prouvé dans
 * le navigateur réel (script de preuve), pas ici.
 */

function toFile(bytes: ArrayBuffer | Uint8Array | string, name: string): File {
    const file = new File([bytes as any], name);
    // jsdom n'implémente pas File.arrayBuffer() (tous les navigateurs réels
    // l'ont) : polyfill de TEST via FileReader, sans toucher au code appli.
    if (typeof (file as any).arrayBuffer !== 'function') {
        (file as any).arrayBuffer = () =>
            new Promise<ArrayBuffer>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result as ArrayBuffer);
                r.onerror = () => reject(r.error);
                r.readAsArrayBuffer(file);
            });
    }
    return file;
}

describe('Excel (.xlsx)', () => {
    it('extrait les feuilles et les cellules réelles', async () => {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet([
                ['Produit', 'Quantité', 'Prix'],
                ['Ciment', 120, 8500],
                ['Tôle', 45, 12000],
            ]),
            'Stock'
        );
        const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

        const doc = await extractDocumentText(toFile(bytes, 'inventaire.xlsx'));
        expect(doc.kindLabel).toBe('tableur Excel');
        expect(doc.text).toContain('Feuille « Stock »');
        expect(doc.text).toContain('Ciment,120,8500');
        expect(doc.text).toContain('Tôle,45,12000');
    });
});

describe('Word (.docx)', () => {
    it('extrait le texte réel du document', async () => {
        const zip = new JSZip();
        zip.file('_rels/.rels',
            '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
        zip.file('word/document.xml',
            '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:body><w:p><w:r><w:t>Attestation de preuve du moteur Word de MokNet.</w:t></w:r></w:p></w:body></w:document>');
        const bytes = await zip.generateAsync({ type: 'arraybuffer' });

        const doc = await extractDocumentText(toFile(bytes, 'attestation.docx'));
        expect(doc.kindLabel).toBe('document Word');
        expect(doc.text).toContain('Attestation de preuve du moteur Word de MokNet.');
    });
});

describe('PowerPoint (.pptx)', () => {
    it('extrait le texte des diapositives dans l\'ordre', async () => {
        const zip = new JSZip();
        zip.file('ppt/slides/slide1.xml', '<p:sld><a:t>Titre : plan MokNet</a:t></p:sld>');
        zip.file('ppt/slides/slide2.xml', '<p:sld><a:t>Étape 2 : lancement</a:t></p:sld>');
        const bytes = await zip.generateAsync({ type: 'arraybuffer' });

        const doc = await extractDocumentText(toFile(bytes, 'plan.pptx'));
        expect(doc.text).toContain('[Diapositive 1] Titre : plan MokNet');
        expect(doc.text).toContain('[Diapositive 2] Étape 2 : lancement');
    });
});

describe('Archive (.zip)', () => {
    it('liste le contenu et extrait les fichiers texte lisibles', async () => {
        const zip = new JSZip();
        zip.file('notes.txt', 'Réunion du 30 août : valider le déploiement.');
        zip.file('photo.png', new Uint8Array([137, 80, 78, 71]));
        const bytes = await zip.generateAsync({ type: 'arraybuffer' });

        const doc = await extractDocumentText(toFile(bytes, 'dossier.zip'));
        expect(doc.text).toContain('2 fichier(s)');
        expect(doc.text).toContain('- notes.txt');
        expect(doc.text).toContain('- photo.png');
        expect(doc.text).toContain('Réunion du 30 août : valider le déploiement.');
    });
});

describe('Refus honnêtes — jamais une invention sur des octets illisibles', () => {
    it("refuse l'ancien format binaire .doc avec la marche à suivre", async () => {
        await expect(extractDocumentText(toFile('binaire', 'vieux.doc')))
            .rejects.toThrow(UnsupportedDocumentError);
        await expect(extractDocumentText(toFile('binaire', 'vieux.doc')))
            .rejects.toThrow(/Réenregistrez le fichier en \.docx/);
    });

    it('refuse un fichier texte vide plutôt que de résumer du néant', async () => {
        await expect(extractDocumentText(toFile('   ', 'vide.txt')))
            .rejects.toThrow(/aucun texte extractible/);
    });
});

describe('Texte brut', () => {
    it('lit un CSV tel quel', async () => {
        const doc = await extractDocumentText(toFile('nom,ville\nFatou,Genève', 'membres.csv'));
        expect(doc.text).toBe('nom,ville\nFatou,Genève');
        expect(doc.truncated).toBe(false);
    });
});
