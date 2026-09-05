/**
 * AVATAR VIVANT DEPUIS UNE PHOTO — le moteur navigateur.
 *
 * Décode la photo, trouve le visage (MediaPipe Face Landmarker, 478 repères),
 * découpe le carré au cadrage d'usine, calcule le rig et la bouche
 * (`photoAvatar.ts`), relève la silhouette (MediaPipe Image Segmenter) et
 * rend deux fichiers prêts à l'emploi : la photo cadrée (JPEG) et son masque
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
    featherAlpha,
    framingFromPupils,
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

function drawFramed(source: HTMLCanvasElement, framing: { x: number; y: number; side: number }, side: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoAvatarError('moteur', 'Canevas indisponible dans ce navigateur.');
    ctx.clearRect(0, 0, side, side);
    // Le débord du cadre hors de la photo reste transparent : on ne dessine que
    // l'intersection, à la même échelle.
    const sx = Math.max(0, framing.x);
    const sy = Math.max(0, framing.y);
    const ex = Math.min(source.width, framing.x + framing.side);
    const ey = Math.min(source.height, framing.y + framing.side);
    if (ex > sx && ey > sy) {
        const scale = side / framing.side;
        ctx.drawImage(source, sx, sy, ex - sx, ey - sy, (sx - framing.x) * scale, (sy - framing.y) * scale, (ex - sx) * scale, (ey - sy) * scale);
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
    if (framing.coverage < 0.8) warnings.push('Photo trop serrée : une partie du cadre déborde de la photo (le débord reste transparent).');

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
    // Hors de la photo source (débord du cadre) : transparent, quoi qu'en dise le modèle.
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
