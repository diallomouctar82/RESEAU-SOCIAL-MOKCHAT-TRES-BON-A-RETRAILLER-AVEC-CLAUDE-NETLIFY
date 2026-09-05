/**
 * AVATAR VIVANT DEPUIS UNE PHOTO — le moteur navigateur.
 *
 * Décode la photo, trouve le visage (MediaPipe Face Landmarker, 478 repères),
 * découpe le carré au cadrage d'usine, calcule le rig et la bouche
 * (`photoAvatar.ts`), relève la silhouette (MediaPipe Image Segmenter) et
 * rend deux fichiers prêts à l'emploi : la photo cadrée (JPEG, le débord d'une
 * photo trop serrée comblé par un prolongement adouci du fond) et son masque
 * (PNG avec alpha). Tout se passe dans le navigateur de l'Admin-Général —
 * aucune photo n'est envoyée à un service tiers.
 *
 * Le code WebAssembly (`@mediapipe/tasks-vision`) est chargé à la demande
 * depuis jsDelivr ; les modèles sont servis avec l'application
 * (`public/architecte/modeles/`). Les dépendances sont injectables pour les
 * tests et les bancs.
 */
import {
    ANALYSIS_LIMITS,
    describeOverflow,
    featherAlpha,
    framingFromPupils,
    overflowBands,
    pupilsFrom,
    rigFromLandmarks,
    toFramed,
    type PhotoAvatarCandidate,
    type Point,
} from './photoAvatar';

export const MEDIAPIPE_VERSION = '1.0.1';
export const MEDIAPIPE_WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const FACE_LANDMARKER_MODEL_URL = '/architecte/modeles/face_landmarker.task';
export const SELFIE_SEGMENTER_MODEL_URL = '/architecte/modeles/selfie_segmenter.tflite';

export type PhotoAvatarErrorCode = 'lecture' | 'aucun_visage' | 'moteur';

export class PhotoAvatarError extends Error {
    constructor(public readonly code: PhotoAvatarErrorCode, message: string) {
        super(message);
        this.name = 'PhotoAvatarError';
    }
}

/** Ce que le moteur attend de la vision — MediaPipe en production, une doublure dans les tests. */
export interface PhotoAnalysisDeps {
    /** Tous les visages trouvés, chacun comme liste de repères normalisés (0..1) dans l'image donnée. */
    detectFaces(image: HTMLCanvasElement): Promise<Point[][]>;
    /** Confiance « personne » par pixel (0..1), même taille que le canevas donné. */
    segmentPerson(image: HTMLCanvasElement): Promise<Float32Array>;
}

let depsPromise: Promise<PhotoAnalysisDeps> | null = null;

/** Charge MediaPipe une seule fois par page ; un échec ne reste pas mémorisé (on peut réessayer). */
export function loadMediapipeDeps(options: { wasmBase?: string } = {}): Promise<PhotoAnalysisDeps> {
    if (!depsPromise) {
        depsPromise = (async (): Promise<PhotoAnalysisDeps> => {
            const vision = await import('@mediapipe/tasks-vision');
            const fileset = await vision.FilesetResolver.forVisionTasks(options.wasmBase ?? MEDIAPIPE_WASM_BASE);
            const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL },
                runningMode: 'IMAGE',
                numFaces: 3,
            });
            const segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: SELFIE_SEGMENTER_MODEL_URL },
                runningMode: 'IMAGE',
                outputCategoryMask: false,
                outputConfidenceMasks: true,
            });
            return {
                async detectFaces(image) {
                    const result = landmarker.detect(image);
                    return (result.faceLandmarks ?? []).map((face) => face.map((p) => ({ x: p.x, y: p.y })));
                },
                async segmentPerson(image) {
                    const result = segmenter.segment(image);
                    const masks = result.confidenceMasks ?? [];
                    if (masks.length === 0) throw new PhotoAvatarError('moteur', 'La segmentation n’a rien renvoyé.');
                    const chosen = masks.length > 1 ? masks[1] : masks[0];
                    const data = Float32Array.from(chosen.getAsFloat32Array());
                    result.close();
                    return orientPersonMask(data, image.width, image.height);
                },
            };
        })().catch((error) => {
            depsPromise = null;
            throw error;
        });
    }
    return depsPromise;
}

/**
 * Le modèle « selfie » rend une confiance qui peut être celle de la personne
 * OU celle du fond selon la version : on la lit dans le bon sens en comparant
 * le centre de l'image (le visage cadré) à ses bords.
 */
export function orientPersonMask(confidence: Float32Array, width: number, height: number): Float32Array {
    const sample = (x0: number, y0: number, x1: number, y1: number): number => {
        let sum = 0;
        let count = 0;
        for (let y = y0; y < y1; y += 4) {
            for (let x = x0; x < x1; x += 4) {
                sum += confidence[y * width + x];
                count += 1;
            }
        }
        return count ? sum / count : 0;
    };
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height * 0.45);
    const r = Math.floor(Math.min(width, height) * 0.12);
    const centre = sample(cx - r, cy - r, cx + r, cy + r);
    const bord = (sample(0, 0, width, Math.max(1, Math.floor(height * 0.06))) +
        sample(0, 0, Math.max(1, Math.floor(width * 0.06)), height) +
        sample(width - Math.max(1, Math.floor(width * 0.06)), 0, width, height)) / 3;
    if (centre >= bord) return confidence;
    const flipped = new Float32Array(confidence.length);
    for (let i = 0; i < confidence.length; i += 1) flipped[i] = 1 - confidence[i];
    return flipped;
}

async function decodeToCanvas(file: Blob, maxSide: number): Promise<HTMLCanvasElement> {
    let source: ImageBitmap | HTMLImageElement;
    try {
        if (typeof createImageBitmap === 'function') {
            source = await createImageBitmap(file);
        } else {
            source = await new Promise<HTMLImageElement>((resolve, reject) => {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
                img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image illisible')); };
                img.src = url;
            });
        }
    } catch {
        throw new PhotoAvatarError('lecture', 'Cette image n’a pas pu être lue. Choisissez un fichier JPEG, PNG ou WebP.');
    }
    const w = 'naturalWidth' in source ? source.naturalWidth : source.width;
    const h = 'naturalHeight' in source ? source.naturalHeight : source.height;
    if (!w || !h) throw new PhotoAvatarError('lecture', 'Cette image est vide.');
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoAvatarError('moteur', 'Canevas indisponible dans ce navigateur.');
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    if ('close' in source && typeof source.close === 'function') source.close();
    return canvas;
}

/** Basse résolution du prolongement du fond : le ré-agrandissement lissé tient lieu de flou fort, sans `ctx.filter` (absent de Safari). */
const OVERFLOW_LOWRES_SIDE = 32;
/** Opacité du fondu vers la teinte moyenne du bord, atteinte au bord extérieur du cadre. */
const OVERFLOW_FADE_ALPHA = 0.8;

/** La partie de la photo qui tombe dans le cadre : dans la source (s*) et dans le carré rendu (d*), en pixels. */
interface PhotoRect {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
}

/** Teinte moyenne (« r, g, b ») de chaque bord de la photo, lue sur l'anneau d'un pixel du carré basse résolution. */
function edgeTones(low: CanvasRenderingContext2D, p: { x: number; y: number; w: number; h: number }, L: number): Record<'top' | 'bottom' | 'left' | 'right', string> {
    const clamp = (v: number): number => Math.min(L - 1, Math.max(0, v));
    const x0 = clamp(Math.round(p.x));
    const y0 = clamp(Math.round(p.y));
    const x1 = clamp(Math.max(x0, Math.round(p.x + p.w) - 1));
    const y1 = clamp(Math.max(y0, Math.round(p.y + p.h) - 1));
    const data = low.getImageData(0, 0, L, L).data;
    const mean = (points: Array<[number, number]>): string => {
        let r = 0;
        let g = 0;
        let b = 0;
        for (const [x, y] of points) {
            const i = (y * L + x) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        const n = Math.max(1, points.length);
        return `${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)}`;
    };
    const row = (y: number): Array<[number, number]> => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]);
    const col = (x: number): Array<[number, number]> => Array.from({ length: y1 - y0 + 1 }, (_, i) => [x, y0 + i]);
    return { top: mean(row(y0)), bottom: mean(row(y1)), left: mean(col(x0)), right: mean(col(x1)) };
}

/**
 * Comble le débord du cadre hors de la photo (photo trop serrée) par un
 * prolongement du fond : les bords de la photo sont reflétés dans les bandes
 * manquantes, fortement adoucis, puis fondus vers la teinte moyenne du bord
 * concerné. Sans cela le débord, transparent, devenait une bande noire une
 * fois le portrait exporté en JPEG (constat de la Direction sur /architecte,
 * 05/09/2026). Canvas 2D seulement, portable. Le masque de silhouette n'est
 * pas concerné : son débord reste transparent (voir `analysePhotoFile`).
 */
function fillOverflow(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, r: PhotoRect, side: number): void {
    const bands = { top: r.dy, left: r.dx, bottom: side - (r.dy + r.dh), right: side - (r.dx + r.dw) };
    if (bands.top <= 0.5 && bands.left <= 0.5 && bands.bottom <= 0.5 && bands.right <= 0.5) return;
    const L = OVERFLOW_LOWRES_SIDE;
    const low = document.createElement('canvas');
    low.width = L;
    low.height = L;
    const l = low.getContext('2d');
    if (!l) return;
    const k = L / side;
    const p = { x: r.dx * k, y: r.dy * k, w: Math.max(1e-3, r.dw * k), h: Math.max(1e-3, r.dh * k) };
    // 1. Le carré entier en basse résolution : la photo à sa place, ses bords reflétés tout autour (miroir, sans couture).
    for (const fx of [-1, 0, 1]) {
        for (const fy of [-1, 0, 1]) {
            l.save();
            l.translate(p.x + fx * p.w + (fx ? p.w : 0), p.y + fy * p.h + (fy ? p.h : 0));
            l.scale(fx ? -1 : 1, fy ? -1 : 1);
            l.drawImage(source, r.sx, r.sy, r.sw, r.sh, 0, 0, p.w, p.h);
            l.restore();
        }
    }
    const tones = edgeTones(l, p, L);
    // 2. Ré-agrandi lissé sur tout le carré : la basse résolution tient lieu de flou.
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(low, 0, 0, L, L, 0, 0, side, side);
    ctx.restore();
    // 3. Chaque bande fond vers la teinte de son bord : transparent contre la photo, OVERFLOW_FADE_ALPHA au bord du cadre.
    const fade = (x: number, y: number, w: number, h: number, from: [number, number], to: [number, number], tone: string): void => {
        const g = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
        g.addColorStop(0, `rgba(${tone}, 0)`);
        g.addColorStop(1, `rgba(${tone}, ${OVERFLOW_FADE_ALPHA})`);
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
    };
    if (bands.top > 0.5) fade(0, 0, side, r.dy, [0, r.dy], [0, 0], tones.top);
    if (bands.bottom > 0.5) fade(0, r.dy + r.dh, side, bands.bottom, [0, r.dy + r.dh], [0, side], tones.bottom);
    if (bands.left > 0.5) fade(0, 0, r.dx, side, [r.dx, 0], [0, 0], tones.left);
    if (bands.right > 0.5) fade(r.dx + r.dw, 0, bands.right, side, [r.dx + r.dw, 0], [side, 0], tones.right);
}

function drawFramed(source: HTMLCanvasElement, framing: { x: number; y: number; side: number }, side: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoAvatarError('moteur', 'Canevas indisponible dans ce navigateur.');
    ctx.clearRect(0, 0, side, side);
    // On ne dessine que l'intersection du cadre et de la photo, à la même
    // échelle ; le débord (photo trop serrée) est comblé sous la photo par un
    // prolongement adouci de son fond, jamais laissé transparent (→ noir au JPEG).
    const sx = Math.max(0, framing.x);
    const sy = Math.max(0, framing.y);
    const ex = Math.min(source.width, framing.x + framing.side);
    const ey = Math.min(source.height, framing.y + framing.side);
    if (ex > sx && ey > sy) {
        const scale = side / framing.side;
        const rect: PhotoRect = { sx, sy, sw: ex - sx, sh: ey - sy, dx: (sx - framing.x) * scale, dy: (sy - framing.y) * scale, dw: (ex - sx) * scale, dh: (ey - sy) * scale };
        fillOverflow(ctx, source, rect, side);
        ctx.drawImage(source, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);
    }
    return canvas;
}

function largestFace(faces: Point[][]): Point[] {
    let best = faces[0];
    let bestSpan = -1;
    for (const face of faces) {
        try {
            const { left, right } = pupilsFrom(face);
            const span = Math.hypot(right.x - left.x, right.y - left.y);
            if (span > bestSpan) { best = face; bestSpan = span; }
        } catch {
            // visage incomplet : ignoré
        }
    }
    return best;
}

export interface AnalysePhotoOptions {
    sourceName?: string;
}

/**
 * La photo → un candidat prêt à être prévisualisé puis validé. Lève
 * `PhotoAvatarError` avec un message destiné à l'Admin-Général.
 */
export async function analysePhotoFile(
    file: Blob,
    deps: PhotoAnalysisDeps,
    options: AnalysePhotoOptions = {}
): Promise<PhotoAvatarCandidate> {
    const analysis = await decodeToCanvas(file, ANALYSIS_LIMITS.analysisMaxSide);
    let faces: Point[][];
    try {
        faces = await deps.detectFaces(analysis);
    } catch (error) {
        throw new PhotoAvatarError('moteur', `Détection automatique indisponible (${error instanceof Error ? error.message : 'erreur'}). Réglez la position à la main, ou réessayez avec le réseau.`);
    }
    if (!faces.length) {
        throw new PhotoAvatarError('aucun_visage', 'Aucun visage net détecté : choisissez une photo de face, bien éclairée, sans lunettes de soleil.');
    }
    const warnings: string[] = [];
    if (faces.length > 1) warnings.push(`${faces.length} visages détectés : le plus grand a été retenu.`);
    const face = largestFace(faces);
    const { left, right } = pupilsFrom(face);
    const framing = framingFromPupils(left, right, analysis.width, analysis.height);
    const overflow = describeOverflow(overflowBands(framing, analysis.width, analysis.height));
    if (overflow.length) warnings.push(`Photo trop serrée : le cadre déborde de la photo ${overflow.join(', ')} — le fond y est prolongé (adouci) dans le portrait ; le masque y reste transparent.`);

    const crop = drawFramed(analysis, framing, ANALYSIS_LIMITS.outputSide);
    const framedPoints = face.map((p) => toFramed(p, framing, analysis.width, analysis.height));
    const estimate = rigFromLandmarks(framedPoints);
    warnings.push(...estimate.warnings);

    const maskInput = drawFramed(analysis, framing, ANALYSIS_LIMITS.maskSide);
    let confidence: Float32Array;
    try {
        confidence = await deps.segmentPerson(maskInput);
    } catch (error) {
        throw new PhotoAvatarError('moteur', `Détourage automatique indisponible (${error instanceof Error ? error.message : 'erreur'}).`);
    }
    const side = ANALYSIS_LIMITS.maskSide;
    // Hors de la photo source (débord du cadre) : transparent, quoi qu'en dise le
    // modèle — le prolongement du fond n'existe que dans le portrait, jamais dans le masque.
    for (let y = 0; y < side; y += 1) {
        for (let x = 0; x < side; x += 1) {
            const sx = framing.x + (x / side) * framing.side;
            const sy = framing.y + (y / side) * framing.side;
            if (sx < 0 || sy < 0 || sx >= analysis.width || sy >= analysis.height) confidence[y * side + x] = 0;
        }
    }
    const alpha = featherAlpha(confidence, side, side);
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = side;
    maskCanvas.height = side;
    const mctx = maskCanvas.getContext('2d');
    if (!mctx) throw new PhotoAvatarError('moteur', 'Canevas indisponible dans ce navigateur.');
    const image = mctx.createImageData(side, side);
    for (let i = 0; i < side * side; i += 1) {
        image.data[i * 4] = 255;
        image.data[i * 4 + 1] = 255;
        image.data[i * 4 + 2] = 255;
        image.data[i * 4 + 3] = alpha[i];
    }
    mctx.putImageData(image, 0, 0);

    return {
        photoUrl: crop.toDataURL('image/jpeg', ANALYSIS_LIMITS.jpegQuality),
        maskUrl: maskCanvas.toDataURL('image/png'),
        rig: estimate.rig,
        mouthAnchor: estimate.mouthAnchor,
        warnings,
        sourceName: options.sourceName ?? ('name' in file && typeof (file as File).name === 'string' ? (file as File).name : 'photo'),
        framing,
        landmarksFound: face.length,
    };
}
