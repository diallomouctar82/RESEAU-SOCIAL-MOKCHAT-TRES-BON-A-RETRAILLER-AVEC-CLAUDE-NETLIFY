import type { LivingPose, PortraitRig } from './livingAvatar';
import type { MouthAnchor } from './architecteAvatar';

/**
 * PEINTRE DU PORTRAIT VIVANT — rendu Canvas 2D d'une photo animée.
 *
 * Pourquoi Canvas et non SVG (refonte du 04/09, après le retour « pas assez
 * fluide ni naturel ») : en SVG, chaque partie mobile était une COPIE ENTIÈRE
 * de la photo translatée d'un bloc sous un masque — la lèvre du bas, le
 * menton, le cou et le col descendaient ensemble, la tête et le fond de
 * bureau pivotaient ensemble. Rien ne se DÉFORME dans une image translatée ;
 * or un visage qui parle se déforme. Ici :
 *
 *  1. le FOND reste immobile ; seule la tête (découpe fondue) respire, dérive
 *     et s'incline devant lui ;
 *  2. la MÂCHOIRE est redessinée en fines bandes dont le décalage varie —
 *     80 % du mouvement à la lèvre du bas, 100 % au menton, 0 au cou — et
 *     s'atténue vers les joues : aucune couture, le cou ne bouge pas ;
 *  3. les PAUPIÈRES sont la peau au-dessus des cils, étirée ;
 *  4. le REGARD se déplace dans deux ellipses fondues autour des yeux.
 *
 * Le peintre ne décide de rien : il reçoit une pose calculée par
 * `livingAvatar.ts`. La géométrie (profil de mâchoire, atténuation) est
 * exportée en fonctions pures, testables sans navigateur.
 */

/** Part du mouvement du menton que suit la lèvre du bas. */
export const LOWER_LIP_SHARE = 0.8;
/**
 * Sous le menton, la peau se comprime vers le cou sur cette hauteur (% du
 * cadre). Assez haute pour que la compression reste douce (≈ 35 % au maximum)
 * et descende dans le col, uniforme, plutôt que de plisser le cou.
 */
export const NECK_BAND_PERCENT = 12;
/** Demi-largeur du cou (% du cadre) : sous le menton, seul le cou suit, pas les épaules ni le col. */
export const NECK_HALF_PERCENT = 10;
export const NECK_TAPER_PERCENT = 5;
/**
 * Marge de mâchoire de part et d'autre de la bouche, avant atténuation (% du
 * cadre) : la zone qui bouge d'un bloc doit couvrir TOUT le menton, sinon
 * l'atténuation coupe l'arête de la mâchoire en marches d'escalier.
 */
export const JAW_MARGIN_PERCENT = 7;
/** Largeur de la zone d'atténuation vers les joues et les cheveux (% du cadre). */
export const JAW_TAPER_PERCENT = 14;
/** Rangées redessinées : lèvres → menton, puis menton → cou. */
export const JAW_ROWS = { face: 14, neck: 10 } as const;
/** Largeur d'une colonne dans les zones d'atténuation (% du cadre). */
export const JAW_COLUMN_PERCENT = 1;
/** Part de la largeur de bouche qui s'ouvre réellement (les commissures restent attachées). */
export const LIP_OPENING_SHARE = 0.97;
/** La lèvre du HAUT se soulève d'une part du mouvement de mâchoire (une bouche qui s'ouvre n'ouvre pas que le bas). */
export const UPPER_LIP_SHARE = 0.14;
/** Hauteur de peau au-dessus des lèvres qui accompagne ce soulèvement, en fondu (% du cadre). */
export const UPPER_LIP_BAND_PERCENT = 4.5;
/** Rangées redessinées au-dessus des lèvres. */
export const UPPER_LIP_ROWS = 6;
/** Sourcils : hauteur maximale du haussement (% du cadre) et bande de peau entraînée. */
export const BROW_RAISE_PERCENT = 0.7;
/** Bande des coins de lèvres : largeur et hauteur en multiples de la largeur de bouche, grille et fondu vertical. */
export const LIP_BAND_WIDTH_FACTOR = 1.7;
export const LIP_BAND_HEIGHT_FACTOR = 0.6;
export const LIP_BAND_COLUMNS = 24;
export const LIP_BAND_ROWS = 8;
/** Part centrale de la bande mise à l'échelle (le reste rattrape jusqu'aux bords). */
export const LIP_BAND_INNER = 0.55;
/** Fondu vertical (part de la hauteur) où le déplacement s'éteint vers le haut et le bas. */
export const LIP_BAND_FEATHER = 0.35;
export const BROW_BAND_ABOVE = 3.2;
export const BROW_BAND_BELOW = 1.4;
export const BROW_ROWS = 8;
/** Épaisseur de la bande de peau de paupière étirée pour fermer l'œil (% du cadre). */
export const LID_SOURCE_HEIGHT = 1.3;
/** Découpe de la tête devant le fond fixe : ellipse et début du fondu (fraction du rayon). */
export const HEAD_ELLIPSE = { cx: 50, cy: 54, rx: 46, ry: 52, fadeFrom: 0.74 } as const;

const smoothstep = (s: number) => s * s * (3 - 2 * s);

/**
 * Décalage vertical relatif (0..1) d'un point de la mâchoire, selon sa hauteur.
 * Nul au-dessus de la ligne des lèvres, 80 % à la lèvre du bas, 100 % au
 * menton, puis retombe doucement à 0 dans la bande de cou.
 */
export function jawProfile(yPercent: number, rig: PortraitRig, lipLine: number): number {
    const chin = Math.max(rig.chinLinePercent, lipLine + 1);
    const neck = chin + NECK_BAND_PERCENT;
    if (!Number.isFinite(yPercent) || yPercent < lipLine) return 0;
    if (yPercent <= chin) return LOWER_LIP_SHARE + (1 - LOWER_LIP_SHARE) * ((yPercent - lipLine) / (chin - lipLine));
    if (yPercent >= neck) return 0;
    return 1 - smoothstep((yPercent - chin) / (neck - chin));
}

/**
 * Ouverture de la fente entre les lèvres selon la position horizontale : 1 au
 * centre, 0 aux commissures (demi-ellipse). Les commissures restent attachées
 * quand une bouche s'ouvre — c'est ce qui la distingue d'un clapet.
 */
export function lipOpening(xPercent: number, mouth: MouthAnchor, mouthWidth = 1): number {
    const half = (mouth.widthPercent / 2) * LIP_OPENING_SHARE * (Number.isFinite(mouthWidth) ? mouthWidth : 1);
    if (half <= 0) return 0;
    const r = (xPercent - mouth.xPercent) / half;
    if (!Number.isFinite(r) || Math.abs(r) >= 1) return 0;
    return Math.sqrt(1 - r * r);
}

/**
 * Décalage vertical relatif (0..1) d'un point de la mâchoire, en DEUX
 * dimensions. Rien ne bouge au-dessus de la ligne des lèvres. Juste dessous,
 * la lèvre du bas s'écarte de 80 % du mouvement au centre et de rien aux
 * commissures ; ce déficit se résorbe linéairement jusqu'au menton, qui
 * descend d'un bloc. La SEULE discontinuité est donc la fente elle-même,
 * que la cavité recouvre exactement : aucune couture sur la peau.
 */
export function jawProfile2D(
    xPercent: number, yPercent: number, rig: PortraitRig, lipLine: number, mouth: MouthAnchor, mouthWidth = 1,
): number {
    if (yPercent < lipLine) {
        // Au-dessus de la ligne : la lèvre du haut se SOULÈVE (valeur négative),
        // pleinement à la ligne, plus du tout en haut de la bande — et seulement
        // là où la fente s'ouvre.
        const top = lipLine - UPPER_LIP_BAND_PERCENT;
        if (yPercent <= top) return 0;
        const k = (yPercent - top) / UPPER_LIP_BAND_PERCENT;
        const lo = lipOpening(xPercent, mouth, mouthWidth);
        if (lo <= 0) return 0;
        return -UPPER_LIP_SHARE * lo * k;
    }
    const base = jawProfile(yPercent, rig, lipLine);
    if (base <= 0) return 0;
    const chin = Math.max(rig.chinLinePercent, lipLine + 1);
    if (yPercent >= chin) return base;
    const t = (yPercent - lipLine) / (chin - lipLine);
    const deficit = LOWER_LIP_SHARE * (1 - lipOpening(xPercent, mouth, mouthWidth)) * (1 - t);
    return Math.max(0, base - deficit);
}

/**
 * Atténuation horizontale (0..1) : pleine sur la mâchoire, nulle sur les
 * joues. Sous le menton (`yPercent` fourni), la zone pleine se resserre à la
 * largeur du cou : les épaules et le col ne suivent pas la mâchoire.
 */
export function jawColumnTaper(xPercent: number, mouth: MouthAnchor, yPercent?: number, rig?: PortraitRig): number {
    let half = mouth.widthPercent / 2 + JAW_MARGIN_PERCENT;
    let taper = JAW_TAPER_PERCENT;
    if (rig && Number.isFinite(yPercent!) && yPercent! > rig.chinLinePercent) {
        const k = Math.min(1, (yPercent! - rig.chinLinePercent) / NECK_BAND_PERCENT);
        half = half + (Math.min(half, NECK_HALF_PERCENT) - half) * k;
        taper = taper + (NECK_TAPER_PERCENT - taper) * k;
    }
    const d = Math.abs(xPercent - mouth.xPercent);
    if (!Number.isFinite(d) || d >= half + taper) return 0;
    if (d <= half) return 1;
    return 1 - smoothstep((d - half) / taper);
}

/** Bornes horizontales de la zone de mâchoire redessinée (% du cadre). */
export function jawSpan(mouth: MouthAnchor): { left: number; right: number } {
    const reach = mouth.widthPercent / 2 + JAW_MARGIN_PERCENT + JAW_TAPER_PERCENT;
    return { left: Math.max(0, mouth.xPercent - reach), right: Math.min(100, mouth.xPercent + reach) };
}

export interface PortraitPainter {
    /** Peint la pose donnée. Sans effet tant que la photo n'est pas chargée. */
    draw(pose: LivingPose, rig: PortraitRig, mouth: MouthAnchor, accent: string): void;
    /** `true` dès que la photo est décodée. */
    isReady(): boolean;
    onReady(callback: () => void): void;
    /** Facteur de qualité (0,5..1) appliqué à la résolution : baissé quand l'appareil n'atteint pas la cadence. */
    setQuality(quality: number): void;
    /** Budget de pixels du canevas (voir `CANVAS_PIXEL_BUDGET`). */
    setPixelBudget(pixels: number): void;
    dispose(): void;
}

/**
 * BUDGET DE PIXELS du portrait animé : 420 × 420. Le portrait est repeint à
 * chaque image ; ce que coûte réellement chaque image, ce n'est pas le calcul
 * (2 à 6 ms) mais la rastérisation et l'envoi au compositeur d'un canevas
 * de cette taille. Mesuré le 05/09/2026 sur le navigateur de preuve (rendu
 * logiciel, le cas d'un téléphone modeste) pendant la phrase Vision Smart :
 * 800 × 800 → 45 images/s, 30 % d'images à 33 ms (saccades visibles) ;
 * 600 × 600 → 53 ; 400 × 400 → 60 images/s, aucune image lente. Playbook 15
 * § 3 : « la fréquence d'images est mesurée avant toute déclaration de
 * qualité ». Un petit avatar (56 px) reste en pleine résolution.
 */
export const CANVAS_PIXEL_BUDGET = 420 * 420;

/** Résolution retenue (pixels par pixel CSS) : ratio de l'appareil, plafonné à 2, borné par le budget, fois la qualité. */
export function fitDpr(cssPx: number, devicePixelRatio: number, pixelBudget: number = CANVAS_PIXEL_BUDGET, quality: number = 1): number {
    if (!Number.isFinite(cssPx) || cssPx <= 0) return 1;
    const device = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
    const budget = Number.isFinite(pixelBudget) && pixelBudget > 0 ? Math.sqrt(pixelBudget) / cssPx : Infinity;
    const q = Number.isFinite(quality) ? Math.min(1, Math.max(0.5, quality)) : 1;
    return Math.max(0.5, Math.min(2, device, budget) * q);
}

interface CoverRect { dx: number; dy: number; dw: number; dh: number; scale: number }

export interface PortraitPainterOptions {
    pixelBudget?: number;
}

export function createPortraitPainter(canvas: HTMLCanvasElement, photoUrl: string, options: PortraitPainterOptions = {}): PortraitPainter {
    let ctx: CanvasRenderingContext2D | null = null;
    try {
        // `desynchronized` : le canevas se présente sans attendre le compositeur (moins de saccades sur les appareils qui le supportent).
        ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d', { desynchronized: true }) : null;
    } catch {
        ctx = null; // environnement sans Canvas (tests) : le peintre reste inerte
    }
    let quality = 1;
    let pixelBudget = options.pixelBudget ?? CANVAS_PIXEL_BUDGET;
    let ready = false;
    let disposed = false;
    const readyCallbacks: Array<() => void> = [];
    const image = typeof Image !== 'undefined' ? new Image() : null;
    if (image) {
        image.decoding = 'async';
        image.onload = () => {
            ready = true;
            readyCallbacks.splice(0).forEach((cb) => cb());
        };
        image.src = photoUrl;
    }

    let size = 0;
    let dpr = 1;
    let head: HTMLCanvasElement | null = null;
    let scratch: HTMLCanvasElement | null = null;
    let scratchMask: HTMLCanvasElement | null = null;
    let lipScratch: HTMLCanvasElement | null = null;

    const makeCanvas = () => {
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        return c;
    };

    /** Adapte la résolution du canvas à sa taille CSS ; `false` si aucune taille. */
    const fitSize = (): boolean => {
        const css = canvas.clientWidth || 0;
        if (!css) return false;
        const nextDpr = fitDpr(css, (typeof window !== 'undefined' && window.devicePixelRatio) || 1, pixelBudget, quality);
        const px = Math.max(1, Math.round(css * nextDpr));
        if (px !== size || nextDpr !== dpr) {
            size = px;
            dpr = nextDpr;
            canvas.width = px;
            canvas.height = px;
            head = null;
            scratch = null;
            scratchMask = null;
            lipScratch = null;
        }
        return true;
    };

    /** La photo couvre le carré (comme `object-fit: cover`), centrée. */
    const cover = (): CoverRect => {
        const iw = image!.naturalWidth || 1;
        const ih = image!.naturalHeight || 1;
        const scale = Math.max(size / iw, size / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        return { dx: (size - dw) / 2, dy: (size - dh) / 2, dw, dh, scale };
    };
    const drawCover = (c: CanvasRenderingContext2D) => {
        const r = cover();
        c.drawImage(image!, r.dx, r.dy, r.dw, r.dh);
    };
    /** Copie une zone du cadre (en % du cadre) vers une destination en px, avec décalage vertical en px. */
    const buildHead = () => {
        head = makeCanvas();
        const h = head.getContext('2d');
        if (!h) return;
        drawCover(h);
        const u = size / 100;
        h.globalCompositeOperation = 'destination-in';
        h.save();
        h.translate(HEAD_ELLIPSE.cx * u, HEAD_ELLIPSE.cy * u);
        h.scale(1, HEAD_ELLIPSE.ry / HEAD_ELLIPSE.rx);
        const r = HEAD_ELLIPSE.rx * u;
        const g = h.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(HEAD_ELLIPSE.fadeFrom, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        h.fillStyle = g;
        h.fillRect(-r, -r, 2 * r, 2 * r);
        h.restore();
        h.globalCompositeOperation = 'source-over';
    };

    const drawGaze = (c: CanvasRenderingContext2D, pose: LivingPose, rig: PortraitRig) => {
        if (Math.abs(pose.gazeX) + Math.abs(pose.gazeY) < 0.03) return;
        if (!scratch) scratch = makeCanvas();
        if (!scratchMask) scratchMask = makeCanvas();
        const s = scratch.getContext('2d');
        const m = scratchMask.getContext('2d');
        if (!s || !m) return;
        const u = size / 100;
        const rx = (rig.eyeWidthPercent / 2) * 1.1 * u;
        const ry = rig.eyeBandPercent * 0.45 * u;
        const left = (rig.eyeLeftXPercent - rig.eyeWidthPercent) * u;
        const width = (rig.eyeRightXPercent - rig.eyeLeftXPercent + 2 * rig.eyeWidthPercent) * u;
        const top = (rig.eyeLinePercent - rig.eyeBandPercent) * u;
        const height = 2 * rig.eyeBandPercent * u;
        s.clearRect(left, top, width, height);
        s.save();
        s.beginPath();
        s.rect(left, top, width, height);
        s.clip();
        s.translate(pose.gazeX * u, pose.gazeY * u);
        drawCover(s);
        s.restore();
        m.clearRect(left, top, width, height);
        for (const ex of [rig.eyeLeftXPercent, rig.eyeRightXPercent]) {
            m.save();
            m.translate(ex * u, rig.eyeLinePercent * u);
            m.scale(1, ry / rx);
            const g = m.createRadialGradient(0, 0, 0, 0, 0, rx);
            g.addColorStop(0, 'rgba(0,0,0,1)');
            g.addColorStop(0.62, 'rgba(0,0,0,1)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            m.fillStyle = g;
            m.fillRect(-rx, -rx, 2 * rx, 2 * rx);
            m.restore();
        }
        s.save();
        s.globalCompositeOperation = 'destination-in';
        s.drawImage(scratchMask, left, top, width, height, left, top, width, height);
        s.restore();
        c.drawImage(scratch, left, top, width, height, left, top, width, height);
    };

    const drawMouth = (c: CanvasRenderingContext2D, pose: LivingPose, rig: PortraitRig, mouth: MouthAnchor) => {
        const jawOffset = rig.jawTravelPercent * pose.jawOpen;
        if (jawOffset < 0.02) return;
        const u = size / 100;
        const lip = mouth.yPercent;
        const cx = mouth.xPercent;
        const half = (mouth.widthPercent / 2) * LIP_OPENING_SHARE * pose.mouthWidth;
        const lowerLip = jawOffset * LOWER_LIP_SHARE;
        const upperLip = jawOffset * UPPER_LIP_SHARE;
        c.save();
        c.translate(cx * u, lip * u);
        c.rotate(((mouth.tiltDeg ?? 0) * Math.PI) / 180);
        c.translate(-cx * u, -lip * u);
        // Cavité = la fente exactement : bord haut sur la lèvre du haut, bord
        // bas là où la lèvre du bas (redessinée par-dessus) arrive, plus une
        // marge qu'elle recouvre. Les commissures restent fermées.
        const cavite = (marge: number) => {
            // Bord haut : la lèvre du haut, soulevée là où la fente s'ouvre ;
            // bord bas : la lèvre du bas déplacée. Chacun avec une marge que la
            // lèvre redessinée par-dessus recouvre.
            c.beginPath();
            const n = 24;
            for (let i = 0; i <= n; i += 1) {
                const x = cx - half + (2 * half * i) / n;
                const y = lip - (upperLip + marge * 0.6) * lipOpening(x, mouth, pose.mouthWidth) - 0.1;
                if (i === 0) c.moveTo(x * u, y * u);
                else c.lineTo(x * u, y * u);
            }
            for (let i = 0; i <= n; i += 1) {
                const x = cx + half - (2 * half * i) / n;
                const y = lip + (lowerLip + marge) * lipOpening(x, mouth, pose.mouthWidth);
                c.lineTo(x * u, y * u);
            }
            c.closePath();
        };
        cavite(0.9);
        const g = c.createLinearGradient(0, (lip - upperLip) * u, 0, (lip + lowerLip + 0.9) * u);
        g.addColorStop(0, '#120608');
        g.addColorStop(0.55, '#2A0E12');
        g.addColorStop(1, '#4A1B22');
        c.fillStyle = g;
        c.fill();
        // Dents : un soupçon, seulement quand la bouche s'ouvre franchement.
        // Dents : un soupçon quand la bouche s'ouvre franchement, et une ligne
        // claire entre des lèvres à peine entrouvertes sur une fricative.
        const fricative = Number.isFinite(pose.mouthTeeth) ? Math.min(1, Math.max(0, pose.mouthTeeth)) : 0;
        const teethHeight = Math.max(Math.min(1.35, lowerLip * 0.32), fricative * 0.45);
        const teethOpacity = Math.max(Math.min(1, Math.max(0, (pose.jawOpen - 0.25) * 3)) * 0.68, fricative * 0.7);
        if (teethOpacity > 0.02 && teethHeight > 0.1) {
            c.save();
            cavite(0);
            c.clip();
            const dentsY = lip - upperLip * 0.9 + 0.1;
            c.beginPath();
            c.moveTo((cx - half * 0.55) * u, dentsY * u);
            c.lineTo((cx + half * 0.55) * u, dentsY * u);
            c.quadraticCurveTo(cx * u, (dentsY + teethHeight * 1.6) * u, (cx - half * 0.55) * u, dentsY * u);
            c.closePath();
            const t = c.createLinearGradient(0, dentsY * u, 0, (dentsY + teethHeight) * u);
            t.addColorStop(0, '#F4EFE7');
            t.addColorStop(1, '#BDB4A8');
            c.globalAlpha = teethOpacity;
            c.fillStyle = t;
            c.fill();
            c.restore();
        }
        // Ombre portée de la lèvre du haut sur l'intérieur de la bouche, découpée à la cavité.
        const shadowHeight = Math.min(0.9, (lowerLip + 0.9) * 0.35);
        c.save();
        cavite(0.9);
        c.clip();
        const sg = c.createLinearGradient(0, (lip - upperLip) * u, 0, (lip - upperLip + shadowHeight) * u);
        sg.addColorStop(0, 'rgba(0,0,0,0.65)');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = sg;
        c.fillRect((cx - half) * u, (lip - upperLip - 0.5) * u, 2 * half * u, (shadowHeight + 0.5) * u);
        c.restore();
        c.restore();
    };

    /**
     * Déformation continue par rangées : chaque cellule est un parallélogramme
     * cisaillé dont les bords coïncident avec ses voisines (décalage évalué aux
     * BORDS de colonnes, haut et bas) — aucune marche, aucune strie. Sert à la
     * mâchoire comme aux sourcils.
     */
    const warpRows = (
        c: CanvasRenderingContext2D,
        edges: readonly number[],
        left: number,
        right: number,
        offsetAt: (xPercent: number, yPercent: number) => number,
    ) => {
        const u = size / 100;
        const columns = Math.max(1, Math.round((right - left) / JAW_COLUMN_PERCENT));
        const colW = (right - left) / columns;
        const eps = 1e-4;
        const near = (a: number, b: number) => Math.abs(a - b) < 0.004;
        const r = cover();
        const tops = new Float64Array(columns + 1);
        const bottoms = new Float64Array(columns + 1);
        for (let i = 0; i < edges.length - 1; i += 1) {
            const y0 = edges[i];
            const y1 = edges[i + 1];
            const h = y1 - y0;
            for (let k = 0; k <= columns; k += 1) {
                const x = left + k * colW;
                tops[k] = offsetAt(x, y0 + eps);
                bottoms[k] = offsetAt(x, y1 - eps);
            }
            let k = 0;
            while (k < columns) {
                const tL = tops[k];
                const bL = bottoms[k];
                let kEnd = k + 1;
                if (near(tops[kEnd], tL) && near(bottoms[kEnd], bL)) {
                    while (kEnd < columns && near(tops[kEnd + 1], tL) && near(bottoms[kEnd + 1], bL)) kEnd += 1;
                }
                const tR = tops[kEnd];
                const bR = bottoms[kEnd];
                if (Math.abs(tL) > 0.004 || Math.abs(tR) > 0.004 || Math.abs(bL) > 0.004 || Math.abs(bR) > 0.004) {
                    const xPct = left + k * colW;
                    const wPct = (kEnd - k) * colW;
                    const shear = (tR - tL) / wPct;
                    const scaleY = (h + (bL + bR) / 2 - (tL + tR) / 2) / h;
                    const sx = (xPct * u - r.dx) / r.scale;
                    const sy = (y0 * u - r.dy) / r.scale;
                    const sw = (wPct * u) / r.scale;
                    const sh = (h * u) / r.scale;
                    c.save();
                    c.translate(xPct * u, (y0 + tL) * u);
                    c.transform(1, shear, 0, scaleY, 0, 0);
                    c.drawImage(image!, sx, sy, sw + 0.5 / r.scale, sh + 0.5 / r.scale, 0, 0, wPct * u + 0.5, h * u + 0.5);
                    c.restore();
                }
                k = kEnd;
            }
        }
    };

    const drawJaw = (c: CanvasRenderingContext2D, pose: LivingPose, rig: PortraitRig, mouth: MouthAnchor) => {
        const jawOffset = rig.jawTravelPercent * pose.jawOpen;
        if (jawOffset < 0.02) return;
        const lip = mouth.yPercent;
        const chin = Math.max(rig.chinLinePercent, lip + 1);
        const neck = Math.min(100, chin + NECK_BAND_PERCENT);
        // Bords de rangées ALIGNÉS sur la ligne des lèvres et le menton : la
        // fente reste une fente (recouverte par la cavité), tout le reste est
        // continu. Au-dessus des lèvres, la peau accompagne le soulèvement de
        // la lèvre du haut.
        const edges: number[] = [];
        const ajouter = (a: number, b: number, n: number, skipFirst: boolean) => {
            for (let i = skipFirst ? 1 : 0; i <= n; i += 1) edges.push(a + ((b - a) * i) / n);
        };
        ajouter(Math.max(0, lip - UPPER_LIP_BAND_PERCENT), lip, UPPER_LIP_ROWS, false);
        ajouter(lip, chin, JAW_ROWS.face, true);
        ajouter(chin, neck, JAW_ROWS.neck, true);
        const { left, right } = jawSpan(mouth);
        warpRows(c, edges, left, right, (x, y) =>
            jawOffset * jawProfile2D(x, y, rig, lip, mouth, pose.mouthWidth) * jawColumnTaper(x, mouth));
    };

    /**
     * COINS DES LÈVRES : les lèvres s'ARRONDISSENT (« ou », « o ») et
     * s'ÉTIRENT (« i », « é ») pour de vrai — pas seulement la cavité. Une
     * bande autour de la bouche, telle qu'elle vient d'être dessinée (lèvres,
     * cavité, mâchoire), est redessinée par cellules : la partie centrale est
     * mise à l'échelle horizontale, les flancs rattrapent jusqu'aux bords de
     * la bande (identité), et le déplacement s'éteint vers le haut et le bas
     * de la bande — aucune couture avec la peau autour. La cavité reçoit la
     * racine carrée du facteur, la bande l'autre racine : le produit est le
     * facteur de largeur de la pose, comme avant.
     */
    const drawLipCorners = (c: CanvasRenderingContext2D, pose: LivingPose, mouth: MouthAnchor) => {
        const scale = Math.sqrt(Number.isFinite(pose.mouthWidth) && pose.mouthWidth > 0 ? pose.mouthWidth : 1);
        if (Math.abs(scale - 1) < 0.015) return;
        if (typeof DOMPoint === 'undefined' || typeof c.getTransform !== 'function') return;
        const u = size / 100;
        const m = c.getTransform();
        const centre = m.transformPoint(new DOMPoint(mouth.xPercent * u, mouth.yPercent * u));
        const bw = mouth.widthPercent * LIP_BAND_WIDTH_FACTOR * u * Math.abs(m.a);
        const bh = mouth.widthPercent * LIP_BAND_HEIGHT_FACTOR * u * Math.abs(m.d);
        const x0 = Math.round(centre.x - bw / 2);
        const y0 = Math.round(centre.y - bh / 2);
        const w = Math.round(bw);
        const h = Math.round(bh);
        if (w < 8 || h < 4) return;
        if (!lipScratch) lipScratch = makeCanvas();
        const s = lipScratch.getContext('2d');
        if (!s) return;
        s.setTransform(1, 0, 0, 1, 0, 0);
        s.clearRect(x0, y0, w, h);
        s.drawImage(canvas, x0, y0, w, h, x0, y0, w, h);
        c.save();
        c.setTransform(1, 0, 0, 1, 0, 0);
        const half = w / 2;
        const inner = LIP_BAND_INNER;
        const edgeIn = inner * scale;
        // t ∈ [−1, 1] (demi-largeurs depuis le centre) → t' : centre à l'échelle, flancs jusqu'à l'identité aux bords.
        const map = (t: number): number => {
            const a = Math.abs(t);
            if (a <= inner) return t * scale;
            const k = (a - inner) / (1 - inner);
            return Math.sign(t) * (edgeIn + (1 - edgeIn) * k);
        };
        for (let r = 0; r < LIP_BAND_ROWS; r += 1) {
            const yA = y0 + (h * r) / LIP_BAND_ROWS;
            const yB = y0 + (h * (r + 1)) / LIP_BAND_ROWS;
            const yMid = ((yA + yB) / 2 - y0) / h;
            const fy = smoothstep(Math.min(1, Math.min(yMid, 1 - yMid) / LIP_BAND_FEATHER));
            for (let k = 0; k < LIP_BAND_COLUMNS; k += 1) {
                const tA = -1 + (2 * k) / LIP_BAND_COLUMNS;
                const tB = -1 + (2 * (k + 1)) / LIP_BAND_COLUMNS;
                const sxA = centre.x + tA * half;
                const sxB = centre.x + tB * half;
                const dA = centre.x + (tA + (map(tA) - tA) * fy) * half;
                const dB = centre.x + (tB + (map(tB) - tB) * fy) * half;
                c.drawImage(lipScratch, sxA, yA, sxB - sxA, yB - yA, dA, yA, dB - dA + 0.35, yB - yA);
            }
        }
        c.restore();
    };

    /**
     * Sourcils : la bande de front au-dessus des sourcils descend jusqu'à eux
     * en s'y accrochant, la bande juste dessous se détend vers l'œil qui,
     * lui, ne bouge pas. Pleinement sur les yeux, atténué vers les tempes.
     */
    const drawBrows = (c: CanvasRenderingContext2D, pose: LivingPose, rig: PortraitRig) => {
        const raise = BROW_RAISE_PERCENT * Math.min(1, Math.max(0, pose.browRaise));
        if (raise < 0.02) return;
        const brow = rig.browLinePercent;
        const top = Math.max(0, brow - BROW_BAND_ABOVE);
        const bottom = brow + BROW_BAND_BELOW;
        const edges: number[] = [];
        for (let i = 0; i <= BROW_ROWS; i += 1) edges.push(top + ((bottom - top) * i) / BROW_ROWS);
        const left = Math.max(0, rig.eyeLeftXPercent - rig.eyeWidthPercent * 1.4);
        const right = Math.min(100, rig.eyeRightXPercent + rig.eyeWidthPercent * 1.4);
        const fade = rig.eyeWidthPercent * 0.6;
        warpRows(c, edges, left, right, (x, y) => {
            const vertical = y <= brow ? (y - top) / (brow - top) : 1 - (y - brow) / (bottom - brow);
            const dl = (x - left) / fade;
            const dr = (right - x) / fade;
            const horizontal = smoothstep(Math.min(1, Math.max(0, Math.min(dl, dr))));
            return -raise * Math.max(0, vertical) * horizontal;
        });
    };

    const drawLids = (c: CanvasRenderingContext2D, pose: LivingPose, rig: PortraitRig) => {
        if (pose.eyelid < 0.05) return;
        if (!scratch) scratch = makeCanvas();
        if (!scratchMask) scratchMask = makeCanvas();
        const s = scratch.getContext('2d');
        const m = scratchMask.getContext('2d');
        if (!s || !m) return;
        const u = size / 100;
        const lidTop = rig.eyeLinePercent - rig.eyeBandPercent / 2;
        const srcTop = lidTop - LID_SOURCE_HEIGHT;
        const coverH = rig.eyeBandPercent * pose.eyelid;
        const contentH = LID_SOURCE_HEIGHT + coverH;
        // Zone de travail : autour des deux yeux seulement.
        const left = rig.eyeLeftXPercent - rig.eyeWidthPercent * 1.2;
        const width = rig.eyeRightXPercent - rig.eyeLeftXPercent + 2.4 * rig.eyeWidthPercent;
        const top = srcTop - 1;
        const height = contentH + rig.eyeBandPercent + 2;
        const r = cover();
        const sx = (left * u - r.dx) / r.scale;
        const sy = (srcTop * u - r.dy) / r.scale;
        const sw = (width * u) / r.scale;
        const sh = (LID_SOURCE_HEIGHT * u) / r.scale;
        s.clearRect(left * u, top * u, width * u, height * u);
        // La bande de peau au-dessus des cils, ÉTIRÉE jusqu'au bord de la
        // paupière : ce bord est net, comme celui d'une vraie paupière.
        s.drawImage(image!, sx, sy, sw, sh, left * u, srcTop * u, width * u, contentH * u);
        // Masque : une ellipse fondue par œil. Une bande rectangulaire pleine
        // largeur posait un « patch » plat sur les tempes et l'arête du nez.
        m.clearRect(left * u, top * u, width * u, height * u);
        const rx = rig.eyeWidthPercent * 1.0 * u;
        const ry = rig.eyeBandPercent * 0.95 * u;
        for (const ex of [rig.eyeLeftXPercent, rig.eyeRightXPercent]) {
            m.save();
            m.translate(ex * u, (rig.eyeLinePercent + 0.2) * u);
            m.scale(1, ry / rx);
            const g = m.createRadialGradient(0, 0, 0, 0, 0, rx);
            g.addColorStop(0, 'rgba(0,0,0,1)');
            g.addColorStop(0.5, 'rgba(0,0,0,1)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            m.fillStyle = g;
            m.fillRect(-rx, -rx, 2 * rx, 2 * rx);
            m.restore();
        }
        s.save();
        s.globalCompositeOperation = 'destination-in';
        s.drawImage(scratchMask, left * u, top * u, width * u, height * u, left * u, top * u, width * u, height * u);
        s.restore();
        c.drawImage(scratch, left * u, top * u, width * u, height * u, left * u, top * u, width * u, height * u);
    };

    return {
        isReady: () => ready,
        onReady: (cb) => { if (ready) cb(); else readyCallbacks.push(cb); },
        setQuality: (q) => { quality = Number.isFinite(q) ? Math.min(1, Math.max(0.5, q)) : 1; },
        setPixelBudget: (px) => { pixelBudget = Number.isFinite(px) && px > 0 ? px : CANVAS_PIXEL_BUDGET; },
        dispose: () => {
            disposed = true;
            if (image) { image.onload = null; }
        },
        draw: (pose, rig, mouth, accent) => {
            if (!ctx || !image || !ready || disposed || !fitSize()) return;
            const S = size;
            const u = S / 100;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, S, S);
            ctx.save();
            ctx.beginPath();
            ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
            ctx.clip();
            // 1. Le fond, immobile.
            drawCover(ctx);
            // 2. La tête, découpée et fondue, devant le fond : respiration, dérive, inclinaison.
            if (!head) buildHead();
            ctx.save();
            ctx.translate((pose.headX + 50) * u, (pose.headY + pose.breathY + 50) * u);
            ctx.rotate((pose.headRotate * Math.PI) / 180);
            ctx.scale(pose.breathScale, pose.breathScale);
            ctx.translate(-50 * u, -50 * u);
            if (head) ctx.drawImage(head, 0, 0);
            // 3. Regard, bouche, mâchoire, paupières — dans le repère de la tête.
            drawGaze(ctx, pose, rig);
            // Largeur de bouche : la cavité et la mâchoire en prennent la racine carrée, les coins des lèvres l'autre racine.
            const poseLevres = { ...pose, mouthWidth: Math.sqrt(Number.isFinite(pose.mouthWidth) && pose.mouthWidth > 0 ? pose.mouthWidth : 1) };
            drawMouth(ctx, poseLevres, rig, mouth);
            drawJaw(ctx, poseLevres, rig, mouth);
            drawLipCorners(ctx, pose, mouth);
            drawBrows(ctx, pose, rig);
            drawLids(ctx, pose, rig);
            ctx.restore();
            ctx.restore();
            // 4. Liseré d'état — la lumière comme langage, posée sur la photo.
            ctx.beginPath();
            ctx.arc(S / 2, S / 2, 49 * u, 0, Math.PI * 2);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2 * u;
            ctx.globalAlpha = 0.55;
            ctx.stroke();
            ctx.globalAlpha = 1;
            // Pose lisible de l'extérieur (bancs de preuve, QA) — arrondie pour
            // ne muter l'attribut que quand la valeur change vraiment.
            const jaw = pose.jawOpen.toFixed(2);
            if (canvas.dataset.jaw !== jaw) canvas.dataset.jaw = jaw;
            const lid = pose.eyelid.toFixed(2);
            if (canvas.dataset.eyelid !== lid) canvas.dataset.eyelid = lid;
            const tilt = pose.headRotate.toFixed(1);
            if (canvas.dataset.tilt !== tilt) canvas.dataset.tilt = tilt;
            // Gestes et regard, pour vérifier au banc qu'ils tombent aux moments de parole.
            const headY = pose.headY.toFixed(2);
            if (canvas.dataset.headY !== headY) canvas.dataset.headY = headY;
            const headX = pose.headX.toFixed(2);
            if (canvas.dataset.headX !== headX) canvas.dataset.headX = headX;
            const gaze = `${pose.gazeX.toFixed(2)},${pose.gazeY.toFixed(2)}`;
            if (canvas.dataset.gaze !== gaze) canvas.dataset.gaze = gaze;
            const brow = pose.browRaise.toFixed(2);
            if (canvas.dataset.brow !== brow) canvas.dataset.brow = brow;
            const resolution = `${size}@${dpr.toFixed(2)}`;
            if (canvas.dataset.resolution !== resolution) canvas.dataset.resolution = resolution;
        },
    };
}
