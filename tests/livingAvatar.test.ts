import { describe, expect, it } from 'vitest';
import {
    BLINK_DURATION_MS,
    BLINK_INTERVALS_MS,
    BREATH_PERIOD_MS,
    DEFAULT_PORTRAIT_RIG,
    STILL_POSE,
    blinkAmount,
    breathPhase,
    clampPortraitRig,
    headDrift,
    resolveLivingPose,
    restTilt,
} from '../services/architecte/livingAvatar';

/**
 * AVATAR VIVANT — ce qui fait qu'un portrait cesse d'être une image.
 *
 * Le point dur est prouvé ici : que le mouvement ne soit pas MÉCANIQUE.
 * C'est l'exigence explicite du playbook AI Core 15 § 3, et c'est
 * exactement ce qu'un rendu ne permet pas de juger à l'œil en quelques
 * secondes — d'où ces mesures.
 */

describe('Respiration — lente et non mécanique', () => {
    it('oscille bien entre inspiration et expiration', () => {
        expect(breathPhase(0)).toBeCloseTo(0, 5);
        expect(breathPhase(BREATH_PERIOD_MS / 4)).toBeGreaterThan(0.5);
        expect(breathPhase((BREATH_PERIOD_MS * 3) / 4)).toBeLessThan(-0.5);
    });

    it('reste dans une amplitude sobre : jamais un torse qui se gonfle', () => {
        for (let t = 0; t < 60_000; t += 97) {
            expect(Math.abs(breathPhase(t))).toBeLessThanOrEqual(1);
        }
    });

    it('NE SE RÉPÈTE PAS d’un cycle à l’autre — c’est ce qui la distingue d’une machine', () => {
        // Une sinusoïde pure redonnerait exactement la même valeur à chaque
        // période. La seconde onde, de période incommensurable, l’en empêche.
        const cycle1 = breathPhase(BREATH_PERIOD_MS * 1 + 500);
        const cycle2 = breathPhase(BREATH_PERIOD_MS * 2 + 500);
        const cycle3 = breathPhase(BREATH_PERIOD_MS * 3 + 500);
        expect(Math.abs(cycle1 - cycle2)).toBeGreaterThan(0.02);
        expect(Math.abs(cycle2 - cycle3)).toBeGreaterThan(0.02);
    });

    it('ignore un temps non numérique au lieu de propager NaN jusqu’au style', () => {
        expect(breathPhase(NaN)).toBe(0);
    });
});

describe('Clignement — discret, à variation naturelle', () => {
    it('œil ouvert entre deux clignements', () => {
        expect(blinkAmount(0)).toBe(0);
        expect(blinkAmount(1000)).toBe(0);
    });

    it('se ferme puis se rouvre complètement', () => {
        const debut = BLINK_INTERVALS_MS[0];
        expect(blinkAmount(debut - 1)).toBe(0);
        expect(blinkAmount(debut + BLINK_DURATION_MS * 0.35)).toBeCloseTo(1, 1);
        expect(blinkAmount(debut + BLINK_DURATION_MS)).toBeCloseTo(0, 5);
    });

    it('se ferme plus vite qu’il ne se rouvre — une courbe symétrique fait « poupée »', () => {
        const debut = BLINK_INTERVALS_MS[0];
        // À 20 % de la durée on est déjà à mi-fermeture ; à 80 %, l'œil est
        // encore partiellement clos.
        expect(blinkAmount(debut + BLINK_DURATION_MS * 0.2)).toBeGreaterThan(0.5);
        expect(blinkAmount(debut + BLINK_DURATION_MS * 0.8)).toBeLessThan(0.4);
    });

    it('les intervalles sont IRRÉGULIERS : un rythme régulier se remarque en quelques secondes', () => {
        const uniques = new Set(BLINK_INTERVALS_MS);
        expect(uniques.size).toBeGreaterThan(BLINK_INTERVALS_MS.length - 3);
        const min = Math.min(...BLINK_INTERVALS_MS);
        const max = Math.max(...BLINK_INTERVALS_MS);
        // Une plage large : ni tic nerveux, ni regard fixe.
        expect(min).toBeGreaterThanOrEqual(2000);
        expect(max).toBeLessThanOrEqual(7000);
        expect(max - min).toBeGreaterThan(3000);
    });

    it('reste borné entre 0 et 1 sur toute une session', () => {
        for (let t = 0; t < 200_000; t += 13) {
            const v = blinkAmount(t);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });

    it('cligne à une fréquence humaine — ni fixe, ni clignotant', () => {
        let clignements = 0;
        let dansUnClignement = false;
        for (let t = 0; t < 60_000; t += 5) {
            const ferme = blinkAmount(t) > 0.5;
            if (ferme && !dansUnClignement) clignements += 1;
            dansUnClignement = ferme;
        }
        // Un humain cligne ~10 à 20 fois par minute au repos.
        expect(clignements).toBeGreaterThanOrEqual(8);
        expect(clignements).toBeLessThanOrEqual(22);
    });
});

describe('Micro-mouvements de tête', () => {
    it('sont VISIBLES mais restent crédibles — encadrés des deux côtés', () => {
        let rotationMax = 0;
        for (let t = 0; t < 120_000; t += 211) {
            const d = headDrift(t);
            rotationMax = Math.max(rotationMax, Math.abs(d.rotate));
            // Plafond : au-delà de ~3°, la tête « flotte » et trahit le truc.
            expect(Math.abs(d.rotate)).toBeLessThanOrEqual(3);
            expect(Math.abs(d.x)).toBeLessThanOrEqual(1.5);
            expect(Math.abs(d.y)).toBeLessThanOrEqual(1);
        }
        // Plancher : une dérive imperceptible ne sert à rien. La Direction a
        // refusé deux versions parce qu'on ne voyait rien bouger.
        expect(rotationMax).toBeGreaterThan(2);
    });

    it('ne repassent pas par la même pose d’une minute à l’autre', () => {
        const a = headDrift(30_000);
        const b = headDrift(90_000);
        expect(Math.abs(a.rotate - b.rotate) + Math.abs(a.x - b.x)).toBeGreaterThan(0.05);
    });
});

describe('Calage du portrait — le code ne devine pas un visage', () => {
    it('borne un réglage hors cadre', () => {
        const r = clampPortraitRig({ eyeLinePercent: 300, eyeBandPercent: -4, jawLinePercent: 0, jawTravelPercent: 99 });
        expect(r.eyeLinePercent).toBe(95);
        expect(r.eyeBandPercent).toBe(2);
        expect(r.jawLinePercent).toBe(10);
        expect(r.jawTravelPercent).toBe(12);
    });

    it('retombe sur les valeurs par défaut devant une saisie non numérique', () => {
        expect(clampPortraitRig({ eyeLinePercent: NaN, jawLinePercent: NaN })).toMatchObject({
            eyeLinePercent: DEFAULT_PORTRAIT_RIG.eyeLinePercent,
            jawLinePercent: DEFAULT_PORTRAIT_RIG.jawLinePercent,
        });
    });
});

describe('Pose complète', () => {
    const base = { elapsedMs: 2000, mouthOpenness: 0, animated: true, speaking: false };

    it('respire, dérive et cligne quand l’avatar est vivant', () => {
        const pose = resolveLivingPose({ ...base, elapsedMs: 1075 });
        expect(pose.breathScale).not.toBe(1);
        expect(pose.headRotate).not.toBe(0);
    });

    it('FIGE TOUT quand l’animation est coupée — la bouche comprise', () => {
        const pose = resolveLivingPose({ ...base, animated: false, mouthOpenness: 0.9 });
        expect(pose).toEqual({ ...STILL_POSE, jawOpen: 0 });
    });

    it('cligne aussi en pleine phrase : un visage qui parle ne se fige pas', () => {
        const debut = BLINK_INTERVALS_MS[0] + BLINK_DURATION_MS * 0.35;
        expect(resolveLivingPose({ ...base, elapsedMs: debut }).eyelid).toBeCloseTo(1, 1);
        expect(resolveLivingPose({ ...base, elapsedMs: debut, speaking: true }).eyelid).toBeCloseTo(1, 1);
    });

    it('respire moins fort pendant la parole — le fond ne concurrence pas la bouche', () => {
        const t = BREATH_PERIOD_MS / 4;
        const repos = resolveLivingPose({ ...base, elapsedMs: t });
        const parle = resolveLivingPose({ ...base, elapsedMs: t, speaking: true });
        expect(Math.abs(parle.breathScale - 1)).toBeLessThan(Math.abs(repos.breathScale - 1));
    });

    it('la mâchoire suit la synchro labiale, bornée', () => {
        expect(resolveLivingPose({ ...base, mouthOpenness: 0.6 }).jawOpen).toBeCloseTo(0.6, 5);
        expect(resolveLivingPose({ ...base, mouthOpenness: 5 }).jawOpen).toBe(1);
        expect(resolveLivingPose({ ...base, mouthOpenness: -2 }).jawOpen).toBe(0);
        expect(resolveLivingPose({ ...base, mouthOpenness: NaN }).jawOpen).toBe(0);
    });

    it('la respiration se VOIT sans devenir un effet : entre 1 % et 3 %', () => {
        let amplitudeMax = 0;
        for (let t = 0; t < 30_000; t += 53) {
            const pose = resolveLivingPose({ ...base, elapsedMs: t });
            amplitudeMax = Math.max(amplitudeMax, Math.abs(pose.breathScale - 1));
            expect(Math.abs(pose.breathScale - 1)).toBeLessThan(0.03);
        }
        expect(amplitudeMax).toBeGreaterThan(0.01);
    });

    it('hoche la tête sur les syllabes quand il parle — la tête suit la voix', () => {
        const muet = resolveLivingPose({ ...base, speaking: true, mouthOpenness: 0 });
        const fort = resolveLivingPose({ ...base, speaking: true, mouthOpenness: 0.9 });
        expect(fort.headY).toBeGreaterThan(muet.headY);
    });

    it('incline la tête au repos, à intervalles irréguliers, en alternant le côté', () => {
        let gauche = false, droite = false, max = 0;
        for (let t = 0; t < 120_000; t += 40) {
            const v = restTilt(t);
            if (v > 0.5) droite = true;
            if (v < -0.5) gauche = true;
            max = Math.max(max, Math.abs(v));
        }
        expect(gauche && droite).toBe(true);
        expect(max).toBeLessThanOrEqual(4.5);
        // Et assez franche pour être vue : la Direction n'a rien vu bouger à ±3°.
        expect(max).toBeGreaterThan(3.5);
        expect(restTilt(0)).toBe(0);
    });
});
