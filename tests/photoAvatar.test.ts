/**
 * AVATAR VIVANT DEPUIS UNE PHOTO — domaine pur (Direction, 05/09/2026).
 * Un visage synthétique aux repères connus : le cadrage reproduit le portrait
 * d'usine, le rig et la bouche tombent où sont les yeux et les lèvres, le
 * masque s'adoucit sur le bord, la validation conserve l'avatar précédent.
 */
import { describe, it, expect } from 'vitest';
import {
    ANALYSIS_LIMITS,
    FRAMING_TARGET,
    LANDMARK,
    LANDMARKS_WITH_IRIS,
    applyPhotoAvatar,
    featherAlpha,
    framingFromPupils,
    pupilsFrom,
    revertPhotoAvatar,
    rigFromLandmarks,
    snapshotOf,
    toFramed,
    type PhotoAvatarCandidate,
    type Point,
} from '../services/architecte/photoAvatar';
import { DEFAULT_ARCHITECTE_AVATAR, sculptureMaskFor } from '../services/architecte/architecteAvatar';
import { ARCHITECTE_PRESENTATION, sequenceFitsPhoto } from '../services/architecte/sequences';
import { DEFAULT_PORTRAIT_RIG } from '../services/architecte/livingAvatar';

/** Visage de face, centré dans une image 1000 × 1000 : pupilles à (0,40 ; 0,45) et (0,60 ; 0,45). */
function visageSynthetique(overrides: Partial<Record<number, Point>> = {}): Point[] {
    const pts: Point[] = Array.from({ length: LANDMARKS_WITH_IRIS }, () => ({ x: 0.5, y: 0.5 }));
    const set = (i: number, x: number, y: number) => { pts[i] = { x, y }; };
    set(LANDMARK.irisRight, 0.40, 0.45); set(LANDMARK.irisLeft, 0.60, 0.45);
    set(LANDMARK.eyeRightOuter, 0.355, 0.45); set(LANDMARK.eyeRightInner, 0.445, 0.45);
    set(LANDMARK.eyeRightTop, 0.40, 0.435); set(LANDMARK.eyeRightBottom, 0.40, 0.465);
    set(LANDMARK.eyeLeftInner, 0.555, 0.45); set(LANDMARK.eyeLeftOuter, 0.645, 0.45);
    set(LANDMARK.eyeLeftTop, 0.60, 0.435); set(LANDMARK.eyeLeftBottom, 0.60, 0.465);
    set(LANDMARK.browRight, 0.40, 0.40); set(LANDMARK.browLeft, 0.60, 0.40);
    set(LANDMARK.lipTopInner, 0.5, 0.68); set(LANDMARK.lipBottomInner, 0.5, 0.69);
    set(LANDMARK.mouthRight, 0.44, 0.685); set(LANDMARK.mouthLeft, 0.56, 0.685);
    set(LANDMARK.chin, 0.5, 0.80); set(LANDMARK.forehead, 0.5, 0.20);
    for (const [k, v] of Object.entries(overrides)) pts[Number(k)] = v as Point;
    return pts;
}

describe('Cadrage au portrait d’usine', () => {
    it('la cible est celle du portrait livré : pupilles à 46,3 % de la hauteur, écart de 21,5 % de la largeur', () => {
        expect(FRAMING_TARGET.eyeLinePercent).toBe(DEFAULT_PORTRAIT_RIG.eyeLinePercent);
        expect(FRAMING_TARGET.interPupilPercent).toBeCloseTo(21.5, 5);
        expect(ANALYSIS_LIMITS.outputSide).toBe(768);
    });

    it('les pupilles sont ordonnées de gauche à droite DANS L’IMAGE, iris en priorité', () => {
        const { left, right } = pupilsFrom(visageSynthetique());
        expect(left.x).toBe(0.40);
        expect(right.x).toBe(0.60);
        // Sans iris (468 repères) : centre des coins de l'œil.
        const sansIris = visageSynthetique().slice(0, 468);
        const p = pupilsFrom(sansIris);
        expect(p.left.x).toBeCloseTo(0.40, 5);
        expect(p.right.x).toBeCloseTo(0.60, 5);
        expect(() => pupilsFrom(sansIris.slice(0, 100))).toThrow(/Repères insuffisants/);
    });

    it('le carré place les pupilles sur la ligne cible et à l’écart cible, et dit s’il déborde', () => {
        const { left, right } = pupilsFrom(visageSynthetique());
        const f = framingFromPupils(left, right, 1000, 1000);
        expect(f.side).toBeCloseTo(200 / 0.215, 1);
        expect(f.x).toBeCloseTo(500 - f.side / 2, 1);
        expect(f.y).toBeCloseTo(450 - f.side * 0.463, 1);
        expect(f.coverage).toBe(1);
        const gauche = toFramed(left, f, 1000, 1000);
        const droite = toFramed(right, f, 1000, 1000);
        expect(gauche.y * 100).toBeCloseTo(46.3, 1);
        expect((droite.x - gauche.x) * 100).toBeCloseTo(21.5, 1);
        // Photo trop serrée : le carré déborde, la couverture le dit.
        const serre = framingFromPupils({ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 }, 400, 400);
        expect(serre.coverage).toBeLessThan(0.8);
    });
});

describe('Rig et bouche mesurés sur les repères', () => {
    it('yeux, sourcils, lèvres, menton et bouche tombent où sont les repères — dans le carré cadré', () => {
        const pts = visageSynthetique();
        const { left, right } = pupilsFrom(pts);
        const f = framingFromPupils(left, right, 1000, 1000);
        const framed = pts.map((p) => toFramed(p, f, 1000, 1000));
        const { rig, mouthAnchor, warnings } = rigFromLandmarks(framed);
        expect(rig.eyeLinePercent).toBeCloseTo(46.3, 0);
        expect(rig.eyeLeftXPercent).toBeCloseTo(39.3, 0);
        expect(rig.eyeRightXPercent).toBeCloseTo(60.8, 0);
        expect(rig.eyeRightXPercent - rig.eyeLeftXPercent).toBeCloseTo(21.5, 0);
        expect(rig.browLinePercent).toBeCloseTo(40.9, 0);
        expect(rig.jawLinePercent).toBeCloseTo(71.6, 0);
        expect(rig.chinLinePercent).toBeCloseTo(83.9, 0);
        expect(rig.eyeWidthPercent).toBeCloseTo(9.7, 0);
        expect(rig.eyeBandPercent).toBeCloseTo(4.8, 0);
        expect(rig.jawTravelPercent).toBeGreaterThan(4);
        expect(rig.jawTravelPercent).toBeLessThan(6);
        expect(mouthAnchor.xPercent).toBeCloseTo(50, 0);
        expect(mouthAnchor.yPercent).toBe(rig.jawLinePercent);
        expect(mouthAnchor.widthPercent).toBeCloseTo(17.4, 0);
        expect(mouthAnchor.tiltDeg).toBe(0);
        expect(warnings).toEqual([]);
    });

    it('une tête inclinée ou un menton coupé sont SIGNALÉS, jamais bloqués ; les valeurs restent bornées', () => {
        const incline = visageSynthetique({ [LANDMARK.mouthLeft]: { x: 0.56, y: 0.72 } });
        const { warnings, mouthAnchor } = rigFromLandmarks(incline);
        expect(warnings.some((w) => /inclinée/.test(w))).toBe(true);
        expect(Math.abs(mouthAnchor.tiltDeg ?? 0)).toBeLessThanOrEqual(15);
        const coupe = visageSynthetique({ [LANDMARK.chin]: { x: 0.5, y: 0.995 } });
        expect(rigFromLandmarks(coupe).warnings.some((w) => /menton/.test(w))).toBe(true);
        expect(rigFromLandmarks(coupe).rig.chinLinePercent).toBeLessThanOrEqual(99);
    });
});

describe('Masque adouci', () => {
    it('confiance 0..1 ou 0..255 : opaque au centre, transparent au fond, dégradé sur le bord', () => {
        const w = 8, h = 4;
        const conf = new Float32Array(w * h);
        for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) conf[y * w + x] = x < 4 ? 1 : 0;
        const net = featherAlpha(conf, w, h, { radius: 0 });
        expect(net[0]).toBe(255);
        expect(net[7]).toBe(0);
        // Rayon 2 (celui du moteur) : la marche devient une pente sur quatre pixels.
        const doux = featherAlpha(conf, w, h, { radius: 2 });
        expect(doux[0]).toBe(255);
        expect(doux[7]).toBe(0);
        expect(doux[3]).toBeGreaterThan(0);
        expect(doux[3]).toBeLessThan(255);
        expect(doux[4]).toBeGreaterThan(0);
        expect(doux[4]).toBeLessThan(255);
        expect(doux[3]).toBeGreaterThan(doux[4]);
        const octets = Uint8Array.from(conf, (v) => v * 255);
        expect(Array.from(featherAlpha(octets, w, h, { radius: 0 }))).toEqual(Array.from(net));
        expect(() => featherAlpha(conf, 3, 3)).toThrow(/Masque/);
    });
});

describe('Validation, sauvegarde et retour arrière', () => {
    const candidat: PhotoAvatarCandidate = {
        photoUrl: 'data:image/jpeg;base64,AAAA',
        maskUrl: 'data:image/png;base64,BBBB',
        rig: { ...DEFAULT_PORTRAIT_RIG, eyeLinePercent: 47 },
        mouthAnchor: { xPercent: 50, yPercent: 70, widthPercent: 17, tiltDeg: 0 },
        warnings: [],
        sourceName: 'direction.jpg',
        framing: { x: 0, y: 0, side: 100, coverage: 1 },
        landmarksFound: 478,
    };

    it('valider = la photo devient l’avatar, détourée par SON masque ; l’avatar précédent est conservé', () => {
        const suivant = applyPhotoAvatar(DEFAULT_ARCHITECTE_AVATAR, candidat, 'Admin-Général', '2026-09-05T14:00:00Z');
        expect(suivant.photoUrl).toBe(candidat.photoUrl);
        expect(suivant.rig.eyeLinePercent).toBe(47);
        expect(suivant.mouthAnchor.yPercent).toBe(70);
        expect(suivant.silhouetteMaskUrl).toBe(candidat.maskUrl);
        expect(suivant.silhouetteMaskForPhotoUrl).toBe(candidat.photoUrl);
        expect(sculptureMaskFor(suivant)).toBe(candidat.maskUrl);
        expect(suivant.previousAvatar).toEqual(snapshotOf(DEFAULT_ARCHITECTE_AVATAR));
        expect(suivant.updatedBy).toBe('Admin-Général');
        // Le modèle vidéo validé vient du portrait d'usine : il ne se joue pas sur la nouvelle photo.
        expect(sequenceFitsPhoto(ARCHITECTE_PRESENTATION, suivant.photoUrl)).toBe(false);
        expect(sequenceFitsPhoto(ARCHITECTE_PRESENTATION, DEFAULT_ARCHITECTE_AVATAR.photoUrl)).toBe(true);
    });

    it('revenir = l’avatar précédent revient tel quel, et il n’y a plus rien à quoi revenir', () => {
        const suivant = applyPhotoAvatar(DEFAULT_ARCHITECTE_AVATAR, candidat, 'Admin-Général', '2026-09-05T14:00:00Z');
        const retour = revertPhotoAvatar(suivant, 'Admin-Général', '2026-09-05T14:05:00Z');
        expect(retour).not.toBeNull();
        expect(retour!.photoUrl).toBe(DEFAULT_ARCHITECTE_AVATAR.photoUrl);
        expect(retour!.rig).toEqual(DEFAULT_ARCHITECTE_AVATAR.rig);
        expect(retour!.silhouetteMaskUrl).toBe(DEFAULT_ARCHITECTE_AVATAR.silhouetteMaskUrl);
        expect(sculptureMaskFor(retour!)).toBe(DEFAULT_ARCHITECTE_AVATAR.silhouetteMaskUrl);
        expect(retour!.previousAvatar).toBeNull();
        expect(revertPhotoAvatar(retour!, 'Admin-Général')).toBeNull();
    });

    it('une autre adresse de photo sans masque relevé garde le cadre rond — jamais un détourage faux', () => {
        expect(sculptureMaskFor({ ...DEFAULT_ARCHITECTE_AVATAR, photoUrl: 'https://exemple.org/autre.jpg' })).toBeNull();
        // Configuration ancienne (sans le champ) : le masque d'usine ne vaut que pour le portrait d'usine.
        const ancienne = { ...DEFAULT_ARCHITECTE_AVATAR } as Record<string, unknown>;
        delete ancienne.silhouetteMaskForPhotoUrl;
        expect(sculptureMaskFor({ ...(ancienne as typeof DEFAULT_ARCHITECTE_AVATAR) })).toBe(DEFAULT_ARCHITECTE_AVATAR.silhouetteMaskUrl);
    });
});

// ── Moteur (parties pures) ──
import { orientPersonMask, PhotoAvatarError, MEDIAPIPE_WASM_BASE, FACE_LANDMARKER_MODEL_URL, SELFIE_SEGMENTER_MODEL_URL } from '../services/architecte/photoAvatarEngine';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Moteur — parties sans navigateur', () => {
    it('lit la confiance « personne » dans le bon sens : centre du visage haut, bords bas — sinon elle est inversée', () => {
        const w = 64, h = 64;
        const personne = new Float32Array(w * h);
        for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) personne[y * w + x] = Math.hypot(x - 32, y - 29) < 18 ? 0.95 : 0.05;
        expect(orientPersonMask(personne, w, h)).toBe(personne);
        const fond = Float32Array.from(personne, (v) => 1 - v);
        const corrige = orientPersonMask(fond, w, h);
        expect(corrige).not.toBe(fond);
        expect(corrige[29 * w + 32]).toBeCloseTo(0.95, 5);
        expect(corrige[0]).toBeCloseTo(0.05, 5);
    });

    it('les modèles sont servis avec l’application, intacts (empreintes), et le wasm vient d’un CDN épinglé', () => {
        const racine = resolve(__dirname, '..', 'public');
        const empreinte = (p: string) => createHash('sha256').update(readFileSync(resolve(racine, p.replace(/^\//, '')))).digest('hex');
        expect(empreinte(FACE_LANDMARKER_MODEL_URL)).toMatch(/^64184e229b263107/);
        expect(empreinte(SELFIE_SEGMENTER_MODEL_URL)).toMatch(/^191ac9529ae506ee/);
        expect(MEDIAPIPE_WASM_BASE).toBe('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm');
        const erreur = new PhotoAvatarError('aucun_visage', 'x');
        expect(erreur.code).toBe('aucun_visage');
        expect(erreur.name).toBe('PhotoAvatarError');
    });
});
