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
    gazeOffset,
    gazeSaccadeStarts,
    headDrift,
    idleBrowRaise,
    listeningNod,
    mouthWidthFactor,
    saccadeBlinkAmount,
    tableBlinkAmount,
    thinkingGaze,
    LIP_SHAPES,
    resolveLivingPose,
    restTilt,
    TILT_INTERVALS_MS,
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
            chinLinePercent: DEFAULT_PORTRAIT_RIG.chinLinePercent,
            eyeLeftXPercent: DEFAULT_PORTRAIT_RIG.eyeLeftXPercent,
            eyeRightXPercent: DEFAULT_PORTRAIT_RIG.eyeRightXPercent,
            eyeWidthPercent: DEFAULT_PORTRAIT_RIG.eyeWidthPercent,
        });
        // Un calage hérité (quatre champs) reçoit les nouveaux sans casser.
        expect(DEFAULT_PORTRAIT_RIG.chinLinePercent).toBeGreaterThan(DEFAULT_PORTRAIT_RIG.jawLinePercent);
        expect(DEFAULT_PORTRAIT_RIG.eyeRightXPercent).toBeGreaterThan(DEFAULT_PORTRAIT_RIG.eyeLeftXPercent);
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

    it('hoche la tête sur le PHRASÉ quand il parle — pas sur chaque syllabe', () => {
        const calme = resolveLivingPose({ ...base, speaking: true, mouthOpenness: 0.9, emphasis: 0 });
        const appuye = resolveLivingPose({ ...base, speaking: true, mouthOpenness: 0.9, emphasis: 0.9 });
        // Même ouverture de bouche instantanée : seule l'emphase (enveloppe
        // lente) fait bouger la tête — une tête qui sautille à chaque syllabe
        // est une marionnette (retour Direction, 04/09).
        expect(appuye.headY).toBeGreaterThan(calme.headY);
        expect(calme.headY).toBeCloseTo(resolveLivingPose({ ...base, speaking: true, mouthOpenness: 0, emphasis: 0 }).headY, 6);
        // Et le hochement reste petit : moins d'un pour cent du cadre.
        expect(appuye.headY - calme.headY).toBeLessThan(1);
    });

    it('déplace le regard par saccades brèves, puis revient sur l’interlocuteur', () => {
        let ecarts = 0, maxX = 0, retours = 0, dehors = false;
        for (let t = 0; t < 120_000; t += 20) {
            const g = gazeOffset(t);
            maxX = Math.max(maxX, Math.abs(g.x));
            const loin = Math.abs(g.x) > 0.3;
            if (loin && !dehors) ecarts += 1;
            if (!loin && dehors) retours += 1;
            dehors = loin;
        }
        expect(ecarts).toBeGreaterThanOrEqual(6); // plusieurs saccades en deux minutes
        expect(retours).toBe(ecarts); // chacune revient au centre
        expect(maxX).toBeLessThanOrEqual(1); // la pupille bouge, pas la tête
        expect(gazeOffset(0)).toEqual({ x: 0, y: 0 });
    });

    it('la bouche s’arrondit et s’étire en parlant, jamais au repos', () => {
        let min = 1, max = 1;
        for (let t = 0; t < 20_000; t += 16) {
            const w = mouthWidthFactor(t, true);
            min = Math.min(min, w);
            max = Math.max(max, w);
            expect(mouthWidthFactor(t, false)).toBe(1);
        }
        expect(min).toBeGreaterThan(0.8);
        expect(max).toBeLessThan(1.2);
        expect(max - min).toBeGreaterThan(0.15);
    });

    it('aucun à-coup entre parole et repos : la part de parole lissée pilote tout', () => {
        // Au milieu d'une inclinaison d'écoute, passer de parole à repos ne doit
        // rien faire sauter — la pose à blend 0,5 est entre les deux extrêmes.
        const t = TILT_INTERVALS_MS[0] + 1100;
        const repos = resolveLivingPose({ ...base, elapsedMs: t, speaking: false, speakingBlend: 0 });
        const parole = resolveLivingPose({ ...base, elapsedMs: t, speaking: true, speakingBlend: 1 });
        const milieu = resolveLivingPose({ ...base, elapsedMs: t, speaking: true, speakingBlend: 0.5 });
        // L'inclinaison d'écoute n'est plus coupée pendant la parole.
        expect(Math.abs(parole.headRotate - repos.headRotate)).toBeLessThan(2);
        for (const cle of ['breathScale', 'headX', 'mouthWidth'] as const) {
            const lo = Math.min(repos[cle], parole[cle]);
            const hi = Math.max(repos[cle], parole[cle]);
            expect(milieu[cle]).toBeGreaterThanOrEqual(lo - 1e-9);
            expect(milieu[cle]).toBeLessThanOrEqual(hi + 1e-9);
        }
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

describe('Comportement — ce qui fait une présence et non une animation', () => {
    const base = { elapsedMs: 2000, mouthOpenness: 0, animated: true, speaking: false };

    it('une saccade sur deux s’accompagne d’un clignement qui la précède de 40 ms', () => {
        const starts = gazeSaccadeStarts();
        expect(starts.length).toBeGreaterThanOrEqual(6);
        // Saccade paire : clignement présent juste avant ; saccade impaire : aucun.
        expect(saccadeBlinkAmount(starts[0].at - 40 + 60)).toBeGreaterThan(0.5);
        expect(saccadeBlinkAmount(starts[1].at - 40 + 60)).toBe(0);
        // Le clignement composé ne perd rien de la table fixe.
        for (let t = 0; t < 60_000; t += 25) expect(blinkAmount(t)).toBeGreaterThanOrEqual(tableBlinkAmount(t));
    });

    it('en réflexion, le regard part en haut de côté et y reste ; en écoute, il reste posé', () => {
        const pensif = resolveLivingPose({ ...base, attention: 'thinking', attentionBlend: 1 });
        expect(pensif.gazeX).toBeGreaterThan(0.5);
        expect(pensif.gazeY).toBeLessThan(-0.3);
        const g = thinkingGaze(5000);
        expect(Math.abs(g.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(g.y)).toBeLessThanOrEqual(1);
        // Part lissée à 0 : aucune influence, quelle que soit l'attention déclarée.
        const neutre = resolveLivingPose({ ...base, attention: 'thinking', attentionBlend: 0 });
        const repos = resolveLivingPose({ ...base });
        expect(neutre.gazeX).toBeCloseTo(repos.gazeX, 9);
    });

    it('en écoute, la tête fait de petits « oui » brefs et espacés — jamais plus d’un demi pour cent', () => {
        let max = 0, dessus = 0;
        for (let t = 0; t < 30_000; t += 16) { const v = listeningNod(t); max = Math.max(max, v); if (v > 0.1) dessus += 1; }
        expect(max).toBeGreaterThan(0.25);
        expect(max).toBeLessThanOrEqual(0.5);
        // Bref : moins d'un tiers du temps au-dessus du dixième.
        expect(dessus / (30_000 / 16)).toBeLessThan(0.34);
        const ecoute = resolveLivingPose({ ...base, elapsedMs: 675, attention: 'listening', attentionBlend: 1 });
        const repos = resolveLivingPose({ ...base, elapsedMs: 675 });
        expect(ecoute.headY).toBeGreaterThan(repos.headY);
    });

    it('les sourcils se haussent sur l’emphase et, au repos, de loin en loin seulement', () => {
        const calme = resolveLivingPose({ ...base, speaking: true, emphasis: 0 });
        const appuye = resolveLivingPose({ ...base, speaking: true, emphasis: 0.8 });
        expect(appuye.browRaise).toBeGreaterThan(calme.browRaise + 0.5);
        expect(appuye.browRaise).toBeLessThanOrEqual(1);
        let dessus = 0;
        for (let t = 0; t < 60_000; t += 20) if (idleBrowRaise(t) > 0.1) dessus += 1;
        expect(dessus / 3000).toBeLessThan(0.2);
    });

    it('la largeur de bouche fournie par l’appelant est respectée ; les formes de lèvres varient', () => {
        expect(resolveLivingPose({ ...base, speaking: true, mouthWidth: 0.86 }).mouthWidth).toBeCloseTo(0.86, 9);
        expect(Math.min(...LIP_SHAPES)).toBeGreaterThan(0.75);
        expect(Math.max(...LIP_SHAPES)).toBeLessThan(1.2);
        expect(new Set(LIP_SHAPES).size).toBeGreaterThanOrEqual(5);
    });
});
