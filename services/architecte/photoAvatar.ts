/**
 * AVATAR VIVANT DEPUIS UNE PHOTO — le domaine pur (aucun DOM, aucun modèle).
 *
 * Demande de la Direction (05/09/2026) : « ajoute dans Super Admin une option
 * permettant à l'Administrateur général de fournir une photo afin que l'avatar
 * vivant de l'Architecte prenne automatiquement la forme de cette photo, sans
 * masquer MokNet » — avec aperçu, validation, sauvegarde et retour arrière.
 *
 * Même technique que l'avatar validé : le rig 2D anime UNE photo cadrée comme
 * le portrait d'usine (pupilles à 46,3 % de la hauteur, écart entre les
 * pupilles = 21,5 % de la largeur), avec un masque de silhouette pour la
 * sculpture détourée. Ici : le cadrage carré, les repères du rig et la bouche
 * sont CALCULÉS à partir des 478 repères du visage (MediaPipe Face Landmarker),
 * le masque à partir de la segmentation personne / fond ; ce fichier ne
 * contient que les calculs, testables sans navigateur.
 */
import { clampPortraitRig, DEFAULT_PORTRAIT_RIG, type PortraitRig } from './livingAvatar';
import {
    clampMouthAnchor,
    type ArchitecteAvatarConfig,
    type ArchitecteAvatarSnapshot,
    type MouthAnchor,
} from './architecteAvatar';

/** Un repère, en fraction de l'image (0 = gauche / haut, 1 = droite / bas). */
export interface Point {
    x: number;
    y: number;
}

/** Indices des repères MediaPipe Face Landmarker (maillage 468 points + 10 points d'iris). */
export const LANDMARK = {
    /** Iris de l'œil DROIT du sujet — à GAUCHE d'une photo non inversée. */
    irisRight: 468,
    irisLeft: 473,
    eyeRightOuter: 33,
    eyeRightInner: 133,
    eyeRightTop: 159,
    eyeRightBottom: 145,
    eyeLeftInner: 362,
    eyeLeftOuter: 263,
    eyeLeftTop: 386,
    eyeLeftBottom: 374,
    browRight: 105,
    browLeft: 334,
    lipTopInner: 13,
    lipBottomInner: 14,
    mouthRight: 61,
    mouthLeft: 291,
    chin: 152,
    forehead: 10,
} as const;

/** Tailles de travail : analyse ≤ 1024 px, photo cadrée 768 px (comme le portrait d'usine), masque 512 px. */
export const ANALYSIS_LIMITS = { analysisMaxSide: 1024, outputSide: 768, maskSide: 512, jpegQuality: 0.86 } as const;

/** Nombre de repères attendu avec les iris ; sans eux (468), les pupilles sont estimées au centre des yeux. */
export const LANDMARKS_WITH_IRIS = 478;
export const LANDMARKS_MINIMUM = 468;

/** Le cadrage d'usine, reproduit sur toute nouvelle photo (relevé sur `architecte.webp`). */
export const FRAMING_TARGET = {
    eyeLinePercent: DEFAULT_PORTRAIT_RIG.eyeLinePercent,
    interPupilPercent: DEFAULT_PORTRAIT_RIG.eyeRightXPercent - DEFAULT_PORTRAIT_RIG.eyeLeftXPercent,
} as const;

/** Carré à découper dans l'image source, en pixels (peut déborder : le débord devient transparent). */
export interface SquareFraming {
    x: number;
    y: number;
    side: number;
    /** Part du carré réellement couverte par l'image (1 = tout le cadre est dans la photo). */
    coverage: number;
}

const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
const pct = (fraction: number): number => Math.round(fraction * 1000) / 10;

/** Les deux pupilles, ordonnées de gauche à droite DANS L'IMAGE. */
export function pupilsFrom(points: readonly Point[]): { left: Point; right: Point } {
    if (points.length < LANDMARKS_MINIMUM) {
        throw new Error(`Repères insuffisants : ${points.length} (minimum ${LANDMARKS_MINIMUM}).`);
    }
    const hasIris = points.length >= LANDMARKS_WITH_IRIS;
    const a = hasIris ? points[LANDMARK.irisRight] : mid(points[LANDMARK.eyeRightOuter], points[LANDMARK.eyeRightInner]);
    const b = hasIris ? points[LANDMARK.irisLeft] : mid(points[LANDMARK.eyeLeftInner], points[LANDMARK.eyeLeftOuter]);
    return a.x <= b.x ? { left: a, right: b } : { left: b, right: a };
}

/**
 * Le carré qui reproduit le cadrage d'usine : pupilles sur la ligne cible,
 * écart entre les pupilles à la largeur cible, centré sur le regard.
 */
export function framingFromPupils(left: Point, right: Point, imageWidth: number, imageHeight: number): SquareFraming {
    const interPx = Math.hypot((right.x - left.x) * imageWidth, (right.y - left.y) * imageHeight);
    const side = interPx / (FRAMING_TARGET.interPupilPercent / 100);
    const cx = ((left.x + right.x) / 2) * imageWidth;
    const cy = ((left.y + right.y) / 2) * imageHeight;
    const x = cx - side / 2;
    const y = cy - side * (FRAMING_TARGET.eyeLinePercent / 100);
    const ix = Math.max(0, Math.min(imageWidth, x + side) - Math.max(0, x));
    const iy = Math.max(0, Math.min(imageHeight, y + side) - Math.max(0, y));
    const coverage = side > 0 ? Math.round(((ix * iy) / (side * side)) * 1000) / 1000 : 0;
    return { x, y, side, coverage };
}

/** Un repère de l'image source exprimé dans le carré découpé (0..1). */
export function toFramed(point: Point, framing: SquareFraming, imageWidth: number, imageHeight: number): Point {
    return {
        x: (point.x * imageWidth - framing.x) / framing.side,
        y: (point.y * imageHeight - framing.y) / framing.side,
    };
}

export interface RigEstimate {
    rig: PortraitRig;
    mouthAnchor: MouthAnchor;
    /** Ce qui mérite un regard humain avant validation — jamais bloquant. */
    warnings: string[];
}

/**
 * Le rig 2D et l'ancre de bouche, mesurés sur les repères du visage exprimés
 * dans le carré découpé — exactement ce qui avait été relevé à la main sur le
 * portrait d'usine (pupilles, paupières, sourcils, ligne entre les lèvres,
 * menton, coins de la bouche).
 */
export function rigFromLandmarks(points: readonly Point[]): RigEstimate {
    const P = (index: number): Point => points[index];
    const { left: pupilLeft, right: pupilRight } = pupilsFrom(points);
    const warnings: string[] = [];

    const eyeLine = pct((pupilLeft.y + pupilRight.y) / 2);
    const openRight = Math.abs(P(LANDMARK.eyeRightTop).y - P(LANDMARK.eyeRightBottom).y);
    const openLeft = Math.abs(P(LANDMARK.eyeLeftTop).y - P(LANDMARK.eyeLeftBottom).y);
    // La bande de paupière d'usine (5,2 %) vaut 1,5 × l'ouverture mesurée de l'œil (3,5 %).
    const eyeBand = pct(((openRight + openLeft) / 2) * 1.5);
    const widthRight = dist(P(LANDMARK.eyeRightOuter), P(LANDMARK.eyeRightInner));
    const widthLeft = dist(P(LANDMARK.eyeLeftInner), P(LANDMARK.eyeLeftOuter));
    const eyeWidth = pct((widthRight + widthLeft) / 2);
    const brow = pct((P(LANDMARK.browRight).y + P(LANDMARK.browLeft).y) / 2);
    // La ligne de mâchoire d'usine est posée ENTRE LES LÈVRES : la lèvre du haut reste fixe.
    const lipLine = pct((P(LANDMARK.lipTopInner).y + P(LANDMARK.lipBottomInner).y) / 2);
    const chin = pct(P(LANDMARK.chin).y);
    const lowerFace = chin - lipLine;
    const jawTravel =
        DEFAULT_PORTRAIT_RIG.jawTravelPercent *
        (lowerFace > 0 ? lowerFace / (DEFAULT_PORTRAIT_RIG.chinLinePercent - DEFAULT_PORTRAIT_RIG.jawLinePercent) : 1);

    const cornerA = P(LANDMARK.mouthRight);
    const cornerB = P(LANDMARK.mouthLeft);
    const [cornerLeft, cornerRight] = cornerA.x <= cornerB.x ? [cornerA, cornerB] : [cornerB, cornerA];
    const mouthWidth = pct(Math.abs(cornerRight.x - cornerLeft.x) * 1.35);
    const tiltDeg = Math.round(((Math.atan2(cornerRight.y - cornerLeft.y, cornerRight.x - cornerLeft.x) * 180) / Math.PI) * 10) / 10;

    const eyeTilt = Math.abs(pupilRight.y - pupilLeft.y);
    if (eyeTilt > 0.03 || Math.abs(tiltDeg) > 8) warnings.push('Tête inclinée : une photo bien droite donne un regard et une bouche plus justes.');
    if (chin > 97) warnings.push('Le menton touche le bas du cadre : la mâchoire pourrait manquer de place pour s’ouvrir.');
    if (eyeLine < 35 || eyeLine > 55) warnings.push('Cadrage inhabituel : les yeux ne sont pas à la hauteur du portrait d’usine.');

    return {
        rig: clampPortraitRig({
            eyeLinePercent: eyeLine,
            eyeBandPercent: eyeBand,
            jawLinePercent: lipLine,
            jawTravelPercent: Math.round(jawTravel * 10) / 10,
            chinLinePercent: chin,
            eyeLeftXPercent: pct(pupilLeft.x),
            eyeRightXPercent: pct(pupilRight.x),
            eyeWidthPercent: eyeWidth,
            browLinePercent: brow,
        }),
        mouthAnchor: clampMouthAnchor({
            xPercent: pct((cornerLeft.x + cornerRight.x) / 2),
            yPercent: lipLine,
            widthPercent: mouthWidth,
            tiltDeg,
        }),
        warnings,
    };
}

export interface FeatherOptions {
    /** Rayon du flou de bord, en pixels (0 = bord net). */
    radius?: number;
    /** Sous ce niveau de confiance, transparent ; au-dessus de `high`, opaque ; entre les deux, dégradé. */
    low?: number;
    high?: number;
}

/**
 * De la confiance « personne » (0..1 ou 0..255) à un canal alpha 0..255 :
 * un flou de boîte séparable adoucit le bord, puis un dégradé entre `low` et
 * `high` — le détourage est franc au centre, doux sur le contour.
 */
export function featherAlpha(
    confidence: ArrayLike<number>,
    width: number,
    height: number,
    options: FeatherOptions = {}
): Uint8ClampedArray {
    const radius = Math.max(0, Math.round(options.radius ?? 2));
    const low = options.low ?? 0.35;
    const high = options.high ?? 0.65;
    const n = width * height;
    if (confidence.length !== n) throw new Error(`Masque de ${confidence.length} valeurs pour ${width}×${height}.`);
    let max = 0;
    for (let i = 0; i < n; i += 1) if (confidence[i] > max) max = confidence[i];
    const scale = max > 1 ? 1 / 255 : 1;
    let src = new Float32Array(n);
    for (let i = 0; i < n; i += 1) src[i] = confidence[i] * scale;

    if (radius > 0) {
        const tmp = new Float32Array(n);
        const window = radius * 2 + 1;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let sum = 0;
                for (let k = -radius; k <= radius; k += 1) {
                    const xx = Math.min(width - 1, Math.max(0, x + k));
                    sum += src[y * width + xx];
                }
                tmp[y * width + x] = sum / window;
            }
        }
        const out = new Float32Array(n);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let sum = 0;
                for (let k = -radius; k <= radius; k += 1) {
                    const yy = Math.min(height - 1, Math.max(0, y + k));
                    sum += tmp[yy * width + x];
                }
                out[y * width + x] = sum / window;
            }
        }
        src = out;
    }

    const alpha = new Uint8ClampedArray(n);
    const span = Math.max(1e-6, high - low);
    for (let i = 0; i < n; i += 1) {
        const t = Math.min(1, Math.max(0, (src[i] - low) / span));
        alpha[i] = Math.round(t * t * (3 - 2 * t) * 255);
    }
    return alpha;
}

/** Ce que l'analyse d'une photo produit — et ce que la validation enregistre. */
export interface PhotoAvatarCandidate {
    /** Photo cadrée comme le portrait d'usine (carré), prête à être animée. */
    photoUrl: string;
    /** Masque de silhouette (PNG avec alpha) relevé sur CETTE photo cadrée. */
    maskUrl: string;
    rig: PortraitRig;
    mouthAnchor: MouthAnchor;
    warnings: string[];
    sourceName: string;
    framing: SquareFraming;
    landmarksFound: number;
}

export function snapshotOf(config: ArchitecteAvatarConfig): ArchitecteAvatarSnapshot {
    return {
        photoUrl: config.photoUrl,
        rig: { ...config.rig },
        mouthAnchor: { ...config.mouthAnchor },
        silhouetteMaskUrl: config.silhouetteMaskUrl,
        silhouetteMaskForPhotoUrl: config.silhouetteMaskForPhotoUrl ?? config.photoUrl,
        videoSequencesEnabled: config.videoSequencesEnabled !== false,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
    };
}

/**
 * Validation : la photo, son rig, sa bouche et son masque deviennent l'avatar ;
 * l'avatar précédent est CONSERVÉ pour le retour arrière (une seule version,
 * la précédente — jamais une pile qui gonfle les réglages).
 */
export function applyPhotoAvatar(
    config: ArchitecteAvatarConfig,
    candidate: PhotoAvatarCandidate,
    adminName: string,
    now: string = new Date().toISOString()
): ArchitecteAvatarConfig {
    return {
        ...config,
        photoUrl: candidate.photoUrl,
        rig: { ...candidate.rig },
        mouthAnchor: { ...candidate.mouthAnchor },
        silhouetteMaskUrl: candidate.maskUrl,
        silhouetteMaskForPhotoUrl: candidate.photoUrl,
        previousAvatar: snapshotOf(config),
        updatedAt: now,
        updatedBy: adminName,
    };
}

/** Retour arrière : l'avatar précédent revient, sans rien perdre d'autre ; `null` s'il n'y a rien à quoi revenir. */
export function revertPhotoAvatar(
    config: ArchitecteAvatarConfig,
    adminName: string,
    now: string = new Date().toISOString()
): ArchitecteAvatarConfig | null {
    const previous = config.previousAvatar;
    if (!previous) return null;
    return {
        ...config,
        photoUrl: previous.photoUrl,
        rig: { ...previous.rig },
        mouthAnchor: { ...previous.mouthAnchor },
        silhouetteMaskUrl: previous.silhouetteMaskUrl,
        silhouetteMaskForPhotoUrl: previous.silhouetteMaskForPhotoUrl,
        videoSequencesEnabled: previous.videoSequencesEnabled,
        previousAvatar: null,
        updatedAt: now,
        updatedBy: adminName,
    };
}
