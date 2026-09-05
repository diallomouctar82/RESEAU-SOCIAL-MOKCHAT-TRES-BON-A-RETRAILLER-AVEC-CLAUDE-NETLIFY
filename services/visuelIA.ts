/**
 * Visuel IA — le moteur de retouche du studio intégré à la publication
 * (DEC-2026-061, variante B10 choisie par la Direction).
 *
 * Tout ce qui est ici est PUR (aucun DOM, aucun réseau) et donc testable :
 * le modèle des réglages, leur normalisation (y compris ce que l'IA renvoie),
 * les « looks » cinéma, le filtre CSS de l'aperçu vidéo et le pipeline de
 * pixels appliqué par le canvas. Le composant `VisuelIAStudio` n'ajoute que
 * l'écran, le canvas et les appels à la passerelle IA.
 *
 * Honnêteté du périmètre : les réglages s'appliquent à l'image entière
 * (adoucissement, éclat, lumière, look, texte, cadrage). Le ciblage d'une
 * zone précise (yeux, dents, mèche de cheveux) demande une détection de
 * visage qui n'existe pas encore dans l'application ; il n'est ni simulé ni
 * promis par l'interface.
 */

export type Look = 'naturel' | 'teal' | 'golden' | 'noir' | 'pellicule' | 'editorial';
export type Cadrage = 'original' | '1:1' | '4:5' | '16:9' | '9:16';
export type PositionTexte = 'bas' | 'haut' | 'centre';
export type PoliceTexte = 'outfit' | 'elegante' | 'manuscrite';

export interface ReglagesVisuel {
    /* Lumière (−50 … 50) */
    exposition: number;
    contraste: number;
    ombres: number;
    hautesLumieres: number;
    temperature: number;
    teinte: number;
    saturation: number;
    /* Visage et cheveux (0 … 100) */
    peauDouce: number;
    eclat: number;
    brillanceCheveux: number;
    /* Cinéma */
    look: Look;
    grain: number;
    vignette: number;
    flouBords: number;
    nettete: number;
    cadrage: Cadrage;
    /* Texte */
    titre: string;
    sousTitre: string;
    positionTexte: PositionTexte;
    tailleTexte: number;
    policeTexte: PoliceTexte;
    /* Vidéo (secondes, vitesse en %) */
    debut: number;
    fin: number | null;
    vitesse: number;
}

export const REGLAGES_DEFAUT: ReglagesVisuel = Object.freeze({
    exposition: 0, contraste: 0, ombres: 0, hautesLumieres: 0, temperature: 0, teinte: 0, saturation: 0,
    peauDouce: 0, eclat: 0, brillanceCheveux: 0,
    look: 'naturel', grain: 0, vignette: 0, flouBords: 0, nettete: 0, cadrage: 'original',
    titre: '', sousTitre: '', positionTexte: 'bas', tailleTexte: 50, policeTexte: 'outfit',
    debut: 0, fin: null, vitesse: 100,
}) as ReglagesVisuel;

export const LOOKS: Record<Look, { libelle: string; couleur: string; ombres: [number, number, number]; hautes: [number, number, number]; force: number; saturation: number; contraste: number }> = {
    naturel: { libelle: 'Naturel', couleur: '#F5B841', ombres: [0, 0, 0], hautes: [0, 0, 0], force: 0, saturation: 0, contraste: 0 },
    teal: { libelle: 'Teal & orange', couleur: '#0F9EC2', ombres: [0, 120, 140], hautes: [255, 150, 70], force: 0.22, saturation: 8, contraste: 8 },
    golden: { libelle: 'Golden hour', couleur: '#F5B841', ombres: [90, 50, 20], hautes: [255, 200, 110], force: 0.2, saturation: 6, contraste: 4 },
    noir: { libelle: 'Noir doux', couleur: '#2B2B2B', ombres: [20, 20, 25], hautes: [235, 235, 240], force: 0.1, saturation: -100, contraste: 10 },
    pellicule: { libelle: 'Pellicule', couleur: '#B26A3B', ombres: [40, 60, 70], hautes: [250, 230, 190], force: 0.16, saturation: -12, contraste: -6 },
    editorial: { libelle: 'Éditorial', couleur: '#7A98A2', ombres: [30, 40, 50], hautes: [245, 245, 245], force: 0.12, saturation: -25, contraste: 12 },
};

export const CADRAGES: Record<Cadrage, { libelle: string; ratio: number | null }> = {
    original: { libelle: 'Original', ratio: null },
    '1:1': { libelle: '1:1', ratio: 1 },
    '4:5': { libelle: '4:5', ratio: 4 / 5 },
    '16:9': { libelle: '16:9', ratio: 16 / 9 },
    '9:16': { libelle: '9:16', ratio: 9 / 16 },
};

export const POLICES: Record<PoliceTexte, { libelle: string; css: string; poids: number }> = {
    outfit: { libelle: 'Outfit gras', css: "'Outfit', system-ui, sans-serif", poids: 800 },
    elegante: { libelle: 'Élégante', css: "'Plus Jakarta Sans', Georgia, serif", poids: 600 },
    manuscrite: { libelle: 'Manuscrite', css: "'Segoe Script', 'Bradley Hand', cursive", poids: 600 },
};

const borner = (v: unknown, min: number, max: number, defaut: number): number => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    if (!Number.isFinite(n)) return defaut;
    return Math.min(max, Math.max(min, Math.round(n)));
};
const parmi = <T extends string>(v: unknown, valeurs: readonly T[], defaut: T): T => (typeof v === 'string' && (valeurs as readonly string[]).includes(v) ? (v as T) : defaut);
const texte = (v: unknown, defaut: string, max: number): string => (typeof v === 'string' ? v.slice(0, max) : defaut);

/**
 * Ramène n'importe quel objet (réglages partiels de l'écran, JSON renvoyé par
 * l'IA) à des réglages complets et bornés. Rien d'inattendu ne passe.
 */
export function normaliserReglages(source: unknown, base: ReglagesVisuel = REGLAGES_DEFAUT): ReglagesVisuel {
    const s = (source && typeof source === 'object' ? source : {}) as Record<string, unknown>;
    const fin = s.fin === null ? null : borner(s.fin, 0, 3600, base.fin ?? -1);
    return {
        exposition: borner(s.exposition, -50, 50, base.exposition),
        contraste: borner(s.contraste, -50, 50, base.contraste),
        ombres: borner(s.ombres, -50, 50, base.ombres),
        hautesLumieres: borner(s.hautesLumieres, -50, 50, base.hautesLumieres),
        temperature: borner(s.temperature, -50, 50, base.temperature),
        teinte: borner(s.teinte, -50, 50, base.teinte),
        saturation: borner(s.saturation, -50, 50, base.saturation),
        peauDouce: borner(s.peauDouce, 0, 100, base.peauDouce),
        eclat: borner(s.eclat, 0, 100, base.eclat),
        brillanceCheveux: borner(s.brillanceCheveux, 0, 100, base.brillanceCheveux),
        look: parmi(s.look, Object.keys(LOOKS) as Look[], base.look),
        grain: borner(s.grain, 0, 100, base.grain),
        vignette: borner(s.vignette, 0, 100, base.vignette),
        flouBords: borner(s.flouBords, 0, 100, base.flouBords),
        nettete: borner(s.nettete, 0, 100, base.nettete),
        cadrage: parmi(s.cadrage, Object.keys(CADRAGES) as Cadrage[], base.cadrage),
        titre: texte(s.titre, base.titre, 120),
        sousTitre: texte(s.sousTitre, base.sousTitre, 160),
        positionTexte: parmi(s.positionTexte, ['bas', 'haut', 'centre'] as const, base.positionTexte),
        tailleTexte: borner(s.tailleTexte, 0, 100, base.tailleTexte),
        policeTexte: parmi(s.policeTexte, Object.keys(POLICES) as PoliceTexte[], base.policeTexte),
        debut: borner(s.debut, 0, 3600, base.debut),
        fin: fin === -1 ? null : fin,
        vitesse: borner(s.vitesse, 50, 200, base.vitesse),
    };
}

/** Vrai si au moins un réglage s'écarte de la base (pour « Réinitialiser » et l'avant / après). */
export function reglagesModifies(r: ReglagesVisuel, base: ReglagesVisuel = REGLAGES_DEFAUT): boolean {
    return (Object.keys(base) as (keyof ReglagesVisuel)[]).some((k) => r[k] !== base[k]);
}

/**
 * Ce que l'IA doit renvoyer en mode Prompt : des réglages, jamais une image
 * réinventée. Le message système est volontairement strict (JSON seul).
 */
export const SYSTEME_PROMPT_REGLAGES = [
    "Tu es le retoucheur d'un studio photo intégré à un réseau social. On te montre une image et une consigne en français.",
    'Tu réponds UNIQUEMENT par un objet JSON, sans texte autour, avec tout ou partie de ces clés :',
    'exposition, contraste, ombres, hautesLumieres, temperature, teinte, saturation (entiers de -50 à 50) ;',
    'peauDouce, eclat, brillanceCheveux, grain, vignette, flouBords, nettete, tailleTexte (entiers de 0 à 100) ;',
    'look ("naturel" | "teal" | "golden" | "noir" | "pellicule" | "editorial") ; cadrage ("original" | "1:1" | "4:5" | "16:9" | "9:16") ;',
    'titre et sousTitre (chaînes courtes, seulement si la consigne demande un texte) ; positionTexte ("bas" | "haut" | "centre") ; policeTexte ("outfit" | "elegante" | "manuscrite").',
    "Reste sobre : un rendu professionnel se joue sur de petites valeurs (5 à 25). N'invente pas de titre si la consigne n'en parle pas.",
].join(' ');

/** Interprète la réponse (JSON, éventuellement entouré de prose ou de ```). */
export function reglagesDepuisReponse(reponse: string, base: ReglagesVisuel): ReglagesVisuel | null {
    const brut = (reponse || '').trim();
    const debut = brut.indexOf('{');
    const fin = brut.lastIndexOf('}');
    if (debut < 0 || fin <= debut) return null;
    try {
        const objet = JSON.parse(brut.slice(debut, fin + 1));
        if (!objet || typeof objet !== 'object') return null;
        return normaliserReglages(objet, base);
    } catch {
        return null;
    }
}

/** Filtre CSS pour l'aperçu vidéo et le rendu en direct (approximation du pipeline de pixels). */
export function filtreCss(r: ReglagesVisuel): string {
    const look = LOOKS[r.look];
    const parties = [
        `brightness(${(1 + r.exposition / 100).toFixed(3)})`,
        `contrast(${(1 + (r.contraste + look.contraste) / 100).toFixed(3)})`,
        `saturate(${Math.max(0, 1 + (r.saturation + look.saturation) / 100).toFixed(3)})`,
    ];
    if (r.temperature !== 0) parties.push(`sepia(${(Math.abs(r.temperature) / 250).toFixed(3)})`);
    if (r.temperature < 0 || r.teinte !== 0) parties.push(`hue-rotate(${(r.temperature < 0 ? -r.temperature * 0.6 : 0) + r.teinte * 0.4}deg)`);
    if (r.look === 'noir') parties.push('grayscale(1)');
    if (r.peauDouce > 0) parties.push(`blur(${(r.peauDouce / 200).toFixed(2)}px)`);
    return parties.join(' ');
}

/** Rectangle source à découper pour un cadrage donné (centré). */
export function rectangleCadrage(largeur: number, hauteur: number, cadrage: Cadrage): { sx: number; sy: number; sw: number; sh: number } {
    const ratio = CADRAGES[cadrage].ratio;
    if (!ratio || largeur <= 0 || hauteur <= 0) return { sx: 0, sy: 0, sw: largeur, sh: hauteur };
    const actuel = largeur / hauteur;
    if (actuel > ratio) {
        const sw = Math.round(hauteur * ratio);
        return { sx: Math.round((largeur - sw) / 2), sy: 0, sw, sh: hauteur };
    }
    const sh = Math.round(largeur / ratio);
    return { sx: 0, sy: Math.round((hauteur - sh) / 2), sw: largeur, sh };
}

/** Flou de boîte séparable (rayon en pixels) — sert à l'adoucissement, à la netteté et au flou des bords. */
export function flouBoite(src: Uint8ClampedArray, largeur: number, hauteur: number, rayon: number): Uint8ClampedArray {
    const r = Math.max(1, Math.round(rayon));
    const tmp = new Uint8ClampedArray(src.length);
    const out = new Uint8ClampedArray(src.length);
    const n = 2 * r + 1;
    for (let y = 0; y < hauteur; y++) {
        for (let c = 0; c < 3; c++) {
            let somme = 0;
            for (let x = -r; x <= r; x++) somme += src[(y * largeur + Math.min(largeur - 1, Math.max(0, x))) * 4 + c];
            for (let x = 0; x < largeur; x++) {
                tmp[(y * largeur + x) * 4 + c] = somme / n;
                const sortant = Math.max(0, x - r), entrant = Math.min(largeur - 1, x + r + 1);
                somme += src[(y * largeur + entrant) * 4 + c] - src[(y * largeur + sortant) * 4 + c];
            }
        }
    }
    for (let x = 0; x < largeur; x++) {
        for (let c = 0; c < 3; c++) {
            let somme = 0;
            for (let y = -r; y <= r; y++) somme += tmp[(Math.min(hauteur - 1, Math.max(0, y)) * largeur + x) * 4 + c];
            for (let y = 0; y < hauteur; y++) {
                out[(y * largeur + x) * 4 + c] = somme / n;
                const sortant = Math.max(0, y - r), entrant = Math.min(hauteur - 1, y + r + 1);
                somme += tmp[(entrant * largeur + x) * 4 + c] - tmp[(sortant * largeur + x) * 4 + c];
            }
        }
    }
    for (let i = 3; i < src.length; i += 4) out[i] = src[i];
    return out;
}

/** Générateur pseudo-aléatoire déterministe (le grain ne « bouge » pas entre deux rendus). */
function bruit(graine: number): () => number {
    let s = graine >>> 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/**
 * Le pipeline de pixels, en place. Ordre : lumière (exposition, contraste,
 * ombres, hautes lumières, température, teinte, saturation) → look (virage
 * ombres / hautes lumières) → visage (adoucissement dans les tons de peau,
 * éclat, brillance des tons foncés) → netteté → flou des bords → vignette →
 * grain. Les valeurs sont pensées pour rester douces : 50 = fort, pas
 * caricatural.
 */
export function appliquerPixels(donnees: Uint8ClampedArray, largeur: number, hauteur: number, r: ReglagesVisuel): void {
    const look = LOOKS[r.look];
    const besoinFlou = r.peauDouce > 0 || r.nettete > 0 || r.flouBords > 0;
    const flou = besoinFlou ? flouBoite(donnees, largeur, hauteur, Math.max(1, Math.round(Math.min(largeur, hauteur) / 160))) : null;
    const expo = 1 + r.exposition / 100;
    const contr = 1 + (r.contraste + look.contraste) / 100;
    const sat = Math.max(0, 1 + (r.saturation + look.saturation) / 100);
    const temp = r.temperature / 50, teinte = r.teinte / 50;
    const kOmbres = r.ombres / 100, kHautes = r.hautesLumieres / 100;
    const kPeau = (r.peauDouce / 100) * 0.75, kEclat = (r.eclat / 100) * 0.35, kCheveux = (r.brillanceCheveux / 100) * 0.4, kNet = (r.nettete / 100) * 0.9;
    const kBords = r.flouBords / 100, kVign = (r.vignette / 100) * 0.8, kGrain = (r.grain / 100) * 28;
    const cx = largeur / 2, cy = hauteur / 2, rayonMax = Math.hypot(cx, cy);
    const alea = bruit(largeur * 7919 + hauteur);
    for (let y = 0; y < hauteur; y++) {
        for (let x = 0; x < largeur; x++) {
            const i = (y * largeur + x) * 4;
            let R = donnees[i], G = donnees[i + 1], B = donnees[i + 2];
            /* lumière */
            R *= expo; G *= expo; B *= expo;
            R = (R - 128) * contr + 128; G = (G - 128) * contr + 128; B = (B - 128) * contr + 128;
            let L = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
            if (kOmbres !== 0) { const poids = Math.max(0, 1 - L * 2); const d = kOmbres * 60 * poids; R += d; G += d; B += d; }
            if (kHautes !== 0) { const poids = Math.max(0, L * 2 - 1); const d = kHautes * 60 * poids; R += d; G += d; B += d; }
            if (temp !== 0) { R += temp * 22; B -= temp * 22; }
            if (teinte !== 0) { G -= teinte * 14; R += teinte * 6; B += teinte * 8; }
            if (sat !== 1) { const g = 0.299 * R + 0.587 * G + 0.114 * B; R = g + (R - g) * sat; G = g + (G - g) * sat; B = g + (B - g) * sat; }
            /* look : virage des ombres et des hautes lumières */
            if (look.force > 0) {
                L = Math.min(1, Math.max(0, (0.299 * R + 0.587 * G + 0.114 * B) / 255));
                const po = (1 - L) * look.force, ph = L * look.force;
                R = R * (1 - po - ph) + look.ombres[0] * po + look.hautes[0] * ph;
                G = G * (1 - po - ph) + look.ombres[1] * po + look.hautes[1] * ph;
                B = B * (1 - po - ph) + look.ombres[2] * po + look.hautes[2] * ph;
            }
            /* visage et cheveux, netteté, flou des bords */
            if (flou) {
                const fR = flou[i] * expo, fG = flou[i + 1] * expo, fB = flou[i + 2] * expo;
                L = Math.min(1, Math.max(0, (0.299 * R + 0.587 * G + 0.114 * B) / 255));
                if (kPeau > 0 && L > 0.22 && L < 0.92 && R > B) { const k = kPeau; R = R * (1 - k) + fR * k; G = G * (1 - k) + fG * k; B = B * (1 - k) + fB * k; }
                if (kNet > 0) { R += (R - fR) * kNet; G += (G - fG) * kNet; B += (B - fB) * kNet; }
                if (kBords > 0) { const d = Math.hypot(x - cx, y - cy) / rayonMax; const k = Math.max(0, (d - 0.45) / 0.55) * kBords; R = R * (1 - k) + fR * k; G = G * (1 - k) + fG * k; B = B * (1 - k) + fB * k; }
            }
            if (kEclat > 0) { L = Math.min(1, Math.max(0, (0.299 * R + 0.587 * G + 0.114 * B) / 255)); const d = (L - 0.5) * kEclat * 90; R += d; G += d; B += d; }
            if (kCheveux > 0) { L = Math.min(1, Math.max(0, (0.299 * R + 0.587 * G + 0.114 * B) / 255)); if (L < 0.35) { const d = (0.35 - L) * kCheveux * 120; R += d * 0.9; G += d * 0.85; B += d * 0.8; } }
            /* vignette et grain */
            if (kVign > 0) { const d = Math.hypot(x - cx, y - cy) / rayonMax; const k = 1 - Math.max(0, d - 0.35) * kVign; R *= k; G *= k; B *= k; }
            if (kGrain > 0) { const g = (alea() - 0.5) * kGrain; R += g; G += g; B += g; }
            donnees[i] = R < 0 ? 0 : R > 255 ? 255 : R;
            donnees[i + 1] = G < 0 ? 0 : G > 255 ? 255 : G;
            donnees[i + 2] = B < 0 ? 0 : B > 255 ? 255 : B;
        }
    }
}

/** Dessine le titre et le sous-titre sur un contexte 2D, à la taille du canvas. */
export function dessinerTexte(ctx: CanvasRenderingContext2D, largeur: number, hauteur: number, r: ReglagesVisuel): void {
    if (!r.titre.trim() && !r.sousTitre.trim()) return;
    const police = POLICES[r.policeTexte];
    const base = Math.min(largeur, hauteur);
    const taille = Math.round(base * (0.045 + (r.tailleTexte / 100) * 0.05));
    const marge = Math.round(largeur * 0.06);
    const interligne = Math.round(taille * 1.12);
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${police.poids} ${taille}px ${police.css}`;
    const lignes: string[] = [];
    for (const paragraphe of r.titre.trim().split('\n')) {
        let ligne = '';
        for (const mot of paragraphe.split(' ')) {
            const essai = ligne ? ligne + ' ' + mot : mot;
            if (ctx.measureText(essai).width > largeur - 2 * marge && ligne) { lignes.push(ligne); ligne = mot; } else ligne = essai;
        }
        if (ligne) lignes.push(ligne);
    }
    const sousTaille = Math.round(taille * 0.55);
    const hauteurBloc = lignes.length * interligne + (r.sousTitre.trim() ? sousTaille * 1.5 : 0);
    let y = r.positionTexte === 'haut' ? marge + taille : r.positionTexte === 'centre' ? (hauteur - hauteurBloc) / 2 + taille : hauteur - marge - hauteurBloc + taille;
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = Math.round(taille * 0.5); ctx.shadowOffsetY = Math.round(taille * 0.08);
    ctx.fillStyle = '#ffffff';
    for (const ligne of lignes) { ctx.fillText(ligne, marge, y); y += interligne; }
    if (r.sousTitre.trim()) {
        ctx.font = `500 ${sousTaille}px ${POLICES.elegante.css}`;
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.fillText(r.sousTitre.trim(), marge, y + sousTaille * 0.2);
    }
    ctx.restore();
}

/** Dimensions de sortie : on limite le grand côté pour rester fluide (aperçu) ou net (export). */
export function dimensionsSortie(largeur: number, hauteur: number, cadrage: Cadrage, grandCoteMax: number): { largeur: number; hauteur: number; source: { sx: number; sy: number; sw: number; sh: number } } {
    const source = rectangleCadrage(largeur, hauteur, cadrage);
    const echelle = Math.min(1, grandCoteMax / Math.max(source.sw, source.sh));
    return { largeur: Math.max(1, Math.round(source.sw * echelle)), hauteur: Math.max(1, Math.round(source.sh * echelle)), source };
}

/**
 * Rend l'image retouchée sur `cible`. Renvoie false si le navigateur ne
 * fournit pas de contexte 2D (jamais silencieux : l'écran le dira).
 */
export function rendreImage(source: CanvasImageSource, largeurSource: number, hauteurSource: number, r: ReglagesVisuel, cible: HTMLCanvasElement, grandCoteMax: number): boolean {
    const dims = dimensionsSortie(largeurSource, hauteurSource, r.cadrage, grandCoteMax);
    cible.width = dims.largeur; cible.height = dims.hauteur;
    const ctx = cible.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(source, dims.source.sx, dims.source.sy, dims.source.sw, dims.source.sh, 0, 0, dims.largeur, dims.hauteur);
    if (reglagesModifies({ ...r, titre: '', sousTitre: '', cadrage: 'original', positionTexte: 'bas', tailleTexte: 50, policeTexte: 'outfit', debut: 0, fin: null, vitesse: 100 })) {
        const image = ctx.getImageData(0, 0, dims.largeur, dims.hauteur);
        appliquerPixels(image.data, dims.largeur, dims.hauteur, r);
        ctx.putImageData(image, 0, 0);
    }
    dessinerTexte(ctx, dims.largeur, dims.hauteur, r);
    return true;
}

/** Les intentions guidées : une phrase, des réglages — pas de magie cachée. */
export const INTENTIONS: { cle: string; libelle: string; reglages: Partial<ReglagesVisuel> }[] = [
    { cle: 'portrait', libelle: 'Portrait pro', reglages: { peauDouce: 30, eclat: 18, nettete: 12, ombres: 10, contraste: 6, vignette: 14 } },
    { cle: 'doree', libelle: 'Lumière dorée', reglages: { look: 'golden', temperature: 14, exposition: 4, hautesLumieres: -6 } },
    { cle: 'cinema', libelle: 'Look cinéma', reglages: { look: 'teal', contraste: 8, grain: 10, vignette: 18, cadrage: '16:9' } },
    { cle: 'net', libelle: 'Plus net', reglages: { nettete: 35, eclat: 10 } },
    { cle: 'clair', libelle: 'Éclaircir', reglages: { exposition: 12, ombres: 18 } },
    { cle: 'titre', libelle: 'Titre en haut', reglages: { positionTexte: 'haut', tailleTexte: 60 } },
];
