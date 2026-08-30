/**
 * LIVRABLES DE L'ARCHITECTE — aller jusqu'au fichier final, pas s'arrêter à
 * une explication (mission de finalisation, §15).
 *
 * Formats RÉELLEMENT générables ici, sans simulation :
 *   - .txt / .md / .csv : texte encodé tel quel ;
 *   - .docx : un vrai paquet Office Open XML construit avec jszip
 *     ([Content_Types].xml + _rels/.rels + word/document.xml) — le même
 *     format que notre moteur d'extraction sait relire, ce que les tests
 *     vérifient en boucle complète (générer → relire avec mammoth).
 *
 * PDF : AUCUNE bibliothèque de génération PDF n'existe dans ce dépôt
 * (pdfjs-dist ne fait que lire). Plutôt que de fabriquer un faux bouton, la
 * demande « en PDF » est réorientée honnêtement vers le .docx.
 */

export type DeliverableFormat = 'txt' | 'md' | 'csv' | 'docx';

const DELIVERABLE_TRIGGERS: RegExp[] = [
    /donne[- ]?(le\s*)?moi.*t[ée]l[ée]charg/i,
    /\bà t[ée]l[ée]charger\b/i,
    /g[ée]n[èe]re (le|un|moi le) (document|fichier)/i,
    /pr[ée]pare (le|un) (document|fichier) final/i,
    /recr[ée]e (le|ce) document/i,
    /version (finale|corrig[ée]e) .*(fichier|document|t[ée]l[ée]charg)/i,
];

export function isDeliverableCommand(command: string): boolean {
    return DELIVERABLE_TRIGGERS.some((p) => p.test(command));
}

/** Le format demandé, ou un repli honnête. `pdfRedirected` signale la réorientation PDF→DOCX à annoncer. */
export function detectDeliverableFormat(command: string): { format: DeliverableFormat; pdfRedirected: boolean } {
    const n = command.toLowerCase();
    if (/\bcsv\b/.test(n)) return { format: 'csv', pdfRedirected: false };
    if (/\bmarkdown\b|\.md\b/.test(n)) return { format: 'md', pdfRedirected: false };
    if (/\bword\b|docx/.test(n)) return { format: 'docx', pdfRedirected: false };
    if (/\bpdf\b/.test(n)) return { format: 'docx', pdfRedirected: true };
    if (/\btexte?\b|\btxt\b/.test(n)) return { format: 'txt', pdfRedirected: false };
    return { format: 'docx', pdfRedirected: false };
}

const escapeXml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Construit un .docx réel : un paragraphe Word par ligne du contenu.
 * Exporté séparément pour que les tests puissent relire le paquet avec
 * mammoth (boucle complète générer → relire).
 */
export async function buildDocxArrayBuffer(content: string): Promise<ArrayBuffer> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '</Types>');
    zip.file('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>');
    const paragraphs = content
        .split(/\r?\n/)
        .map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
        .join('');
    zip.file('word/document.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        `<w:body>${paragraphs}</w:body></w:document>`);
    return zip.generateAsync({ type: 'arraybuffer' });
}

const MIME: Record<DeliverableFormat, string> = {
    txt: 'text/plain;charset=utf-8',
    md: 'text/markdown;charset=utf-8',
    csv: 'text/csv;charset=utf-8',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function buildDeliverableBlob(content: string, format: DeliverableFormat): Promise<Blob> {
    if (format === 'docx') {
        return new Blob([await buildDocxArrayBuffer(content)], { type: MIME.docx });
    }
    return new Blob([content], { type: MIME[format] });
}

/** Nom de fichier final à partir du document d'origine (ou d'un défaut). */
export function deliverableFileName(sourceName: string | undefined, format: DeliverableFormat): string {
    const base = (sourceName || 'document-architecte').replace(/\.[^.]+$/, '');
    return `${base}-final.${format}`;
}

/** Déclenche un VRAI téléchargement navigateur — jamais un faux bouton. */
export function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
