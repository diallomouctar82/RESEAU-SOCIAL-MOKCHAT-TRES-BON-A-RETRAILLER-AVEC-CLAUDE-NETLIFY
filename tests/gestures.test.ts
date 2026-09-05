import { describe, expect, it } from 'vitest';
import {
    BEAT_MIN_GAP_MS,
    BLINK_MIN_GAP_MS,
    GESTURE_AT_REST,
    PAUSE_MS,
    SENTENCE_END_MS,
    createProsodyTracker,
    hash01,
    stepSpring,
    updateProsody,
    type GestureState,
} from '../services/architecte/gestures';
import { BLINK_DURATION_MS } from '../services/architecte/livingAvatar';

/** Voix de banc : syllabes à 4/s (ouvertes 120 ms), pauses aux instants donnés. */
function voix(t: number, pauses: [number, number][]): { open: number; loud: number } {
    if (pauses.some(([a, b]) => t >= a && t < b)) return { open: 0, loud: 0 };
    const phase = (t % 250) / 250;
    const open = phase < 0.48 ? Math.sin((phase / 0.48) * Math.PI) : 0;
    const loud = 0.55 + 0.45 * Math.sin(t / 900); // force qui varie lentement
    return { open, loud: open > 0.2 ? loud : 0.02 };
}

function jouer(duree: number, pauses: [number, number][], dt = 1000 / 60, speakingUntil = Infinity): GestureState[] {
    const tr = createProsodyTracker();
    const sortie: GestureState[] = [];
    for (let t = 0; t <= duree; t += dt) {
        const v = voix(t, pauses);
        const speaking = t < speakingUntil;
        sortie.push(updateProsody(tr, { t, open: speaking ? v.open : 0, loud: speaking ? v.loud : 0, speaking, dtMs: dt }));
    }
    return sortie;
}

describe('Gestes portés par la parole — déterministes, déclenchés par la voix', () => {
    it('le hachage est déterministe et bien réparti', () => {
        expect(hash01(3)).toBe(hash01(3));
        const valeurs = Array.from({ length: 200 }, (_, i) => hash01(i));
        expect(Math.min(...valeurs)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...valeurs)).toBeLessThan(1);
        expect(valeurs.filter((v) => v > 0.5).length).toBeGreaterThan(70);
        expect(valeurs.filter((v) => v > 0.5).length).toBeLessThan(130);
    });

    it('un ressort à amortissement critique rejoint sa cible sans jamais la dépasser, même à 100 ms par image', () => {
        for (const dt of [1000 / 120, 1000 / 60, 1000 / 30, 100]) {
            const s = { x: 0, v: 0 };
            let max = 0;
            for (let t = 0; t < 1500; t += dt) {
                stepSpring(s, 1, 24, dt);
                max = Math.max(max, s.x);
            }
            expect(s.x).toBeCloseTo(1, 3);
            expect(max).toBeLessThanOrEqual(1.0001);
        }
    });

    it('au repos, aucun geste : tout vaut zéro et aucun clignement n’est demandé', () => {
        const tr = createProsodyTracker();
        const g = updateProsody(tr, { t: 0, open: 0, loud: 0, speaking: false, dtMs: 16 });
        expect(g).toEqual(GESTURE_AT_REST);
    });

    it('début de phrase : sourcils qui se haussent brièvement et tête qui se relève — puis retour au calme', () => {
        const g = jouer(1500, []);
        const brow = g.map((x) => x.brow);
        expect(Math.max(...brow)).toBeGreaterThan(0.2);
        expect(Math.max(...brow)).toBeLessThan(0.7);
        // Après 1,2 s, le haussement est retombé.
        expect(brow.at(-1)!).toBeLessThan(0.05);
        expect(Math.min(...g.map((x) => x.liftY))).toBeLessThan(-0.25);
        expect(g.at(-1)!.liftY).toBeGreaterThan(-0.03);
    });

    it('les temps forts hochent la tête, jamais plus souvent que l’écart minimal, jamais tous', () => {
        const g = jouer(6000, []);
        const nod = g.map((x) => x.nodY);
        // Comptage des impulsions (passages au-dessus d'un seuil).
        let impulsions = 0;
        let dedans = false;
        const instants: number[] = [];
        nod.forEach((v, i) => {
            if (v > 0.08 && !dedans) { dedans = true; impulsions += 1; instants.push(i * (1000 / 60)); }
            if (v < 0.03) dedans = false;
        });
        expect(impulsions).toBeGreaterThan(3);
        // 24 syllabes en 6 s : pas une par syllabe.
        expect(impulsions).toBeLessThan(14);
        for (let i = 1; i < instants.length; i += 1) expect(instants[i] - instants[i - 1]).toBeGreaterThanOrEqual(BEAT_MIN_GAP_MS - 20);
        // Amplitude visible mais sobre : autour d'un pour cent du cadre, jamais plus.
        expect(Math.max(...nod)).toBeGreaterThan(0.3);
        expect(Math.max(...nod)).toBeLessThan(1.1);
    });

    it('une pause de la voix déclenche un clignement (espacés) et un regard qui s’échappe puis revient', () => {
        const g = jouer(5000, [[1500, 2000], [3400, 3800]]);
        const clignements = g.filter((x, i) => x.blinkStartedAt !== null && (i === 0 || g[i - 1].blinkStartedAt !== x.blinkStartedAt)).map((x) => x.blinkStartedAt!);
        expect(clignements.length).toBeGreaterThanOrEqual(1);
        // Le premier tombe dans la première pause, juste après le seuil de pause —
        // compté depuis la FIN du dernier son (la syllabe précédente s'éteint ~130 ms avant).
        expect(clignements[0]).toBeGreaterThanOrEqual(1500 - 150 + PAUSE_MS);
        expect(clignements[0]).toBeLessThan(1500 + PAUSE_MS + 120);
        for (let i = 1; i < clignements.length; i += 1) expect(clignements[i] - clignements[i - 1]).toBeGreaterThanOrEqual(BLINK_MIN_GAP_MS);
        // Le clignement demandé s'efface de lui-même après sa durée.
        const apres = g[Math.round((clignements[0] + BLINK_DURATION_MS + 200) / (1000 / 60))];
        expect(apres.blinkStartedAt).toBeNull();
        const regard = g.map((x) => Math.hypot(x.gazeX, x.gazeY));
        expect(Math.max(...regard)).toBeGreaterThan(0.2);
        expect(Math.max(...regard)).toBeLessThan(0.8);
        expect(regard.at(-1)!).toBeLessThan(0.05);
    });

    it('une fin de phrase (silence long) choisit une nouvelle inclinaison, lente, en alternant le côté', () => {
        const g = jouer(9000, [[2000, 2000 + SENTENCE_END_MS + 200], [5500, 5500 + SENTENCE_END_MS + 200]]);
        const tilt = g.map((x) => x.tilt);
        const t1 = tilt[Math.round(4500 / (1000 / 60))];
        const t2 = tilt[Math.round(8900 / (1000 / 60))];
        expect(Math.abs(t1)).toBeGreaterThan(0.5);
        expect(Math.abs(t1)).toBeLessThan(2.5);
        expect(Math.sign(t1)).not.toBe(Math.sign(t2));
    });

    it('CONTINUITÉ : aucun saut d’une image à l’autre — le mouvement est fait de ressorts, pas de marches', () => {
        const g = jouer(6000, [[1500, 2000], [3400, 3800]]);
        const saut = (k: keyof GestureState) => Math.max(...g.slice(1).map((x, i) => Math.abs((x[k] as number) - (g[i][k] as number))));
        expect(saut('nodY')).toBeLessThan(0.2);
        expect(saut('nodRotate')).toBeLessThan(0.17);
        expect(saut('liftY')).toBeLessThan(0.06);
        expect(saut('brow')).toBeLessThan(0.1);
        expect(saut('gazeX')).toBeLessThan(0.12);
        expect(saut('tilt')).toBeLessThan(0.03);
    });

    it('fin de parole : tout revient au repos sans coupure', () => {
        const g = jouer(6000, [], 1000 / 60, 3000);
        const fin = g.at(-1)!;
        expect(Math.abs(fin.nodY)).toBeLessThan(0.01);
        expect(Math.abs(fin.brow)).toBeLessThan(0.01);
        expect(Math.abs(fin.tilt)).toBeLessThan(0.05);
        expect(fin.blinkStartedAt).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────
// PARTITION : gestes planifiés sur une piste alignée (anticipation)
// ─────────────────────────────────────────────────────────────────────────
import {
    NOD_LEAD_MS,
    PHRASE_LEAD_MS,
    adoptSprings,
    buildProsodyScore,
    createScoreTracker,
    updateScore,
} from '../services/architecte/gestures';
import type { AlignedPhone, VoiceTrack } from '../services/architecte/alignment';
import { blinkAmount, resolveLivingPose } from '../services/architecte/livingAvatar';

/** Piste de synthèse : « Bonjour, je suis là. Merci. » — sans son, les temps sont posés à la main. */
function pisteDeSynthese(): VoiceTrack {
    const ph = (phone: AlignedPhone['phone'], start: number, end: number, wordIndex: number, stress = 0, punctuation: AlignedPhone['punctuation'] = ''): AlignedPhone =>
        ({ phone, cls: phone === '_' ? 'SIL' : 'V_OPEN', start, end, wordIndex, stress, punctuation });
    const phones: AlignedPhone[] = [
        ph('b', 100, 140, 0), ph('on', 140, 300, 0, 1), ph('Z', 300, 340, 0), ph('u', 340, 460, 0), ph('R', 460, 500, 0),
        ph('_', 500, 700, 0, 0, ','),
        ph('Z', 700, 740, 1), ph('@', 740, 800, 1),
        ph('s', 800, 900, 2), ph('H', 900, 930, 2), ph('i', 930, 1000, 2),
        ph('l', 1000, 1040, 3), ph('a', 1040, 1300, 3, 1),
        ph('_', 1300, 1700, 3, 0, '.'),
        ph('m', 1700, 1760, 4), ph('E', 1760, 1860, 4), ph('R', 1860, 1900, 4), ph('s', 1900, 1980, 4), ph('i', 1980, 2200, 4, 1),
        ph('_', 2200, 2600, 4, 0, '.'),
    ];
    const words: VoiceTrack['words'] = [
        { text: 'Bonjour', index: 0, start: 100, end: 500, punctuation: ',', syllables: 2 },
        { text: 'je', index: 1, start: 700, end: 800, punctuation: '', syllables: 1 },
        { text: 'suis', index: 2, start: 800, end: 1000, punctuation: '', syllables: 1 },
        { text: 'là', index: 3, start: 1000, end: 1300, punctuation: '.', syllables: 1 },
        { text: 'Merci', index: 4, start: 1700, end: 2200, punctuation: '.', syllables: 2 },
    ];
    return { text: 'Bonjour, je suis là. Merci.', durationMs: 2600, phones, words, levels: new Float32Array(260), keyframes: [] };
}

describe('Partition tirée de la piste : chaque geste a son heure, avant le son', () => {
    const piste = pisteDeSynthese();
    const score = buildProsodyScore(piste);
    const of = (kind: string) => score.events.filter((e) => e.kind === kind);

    it('sourcils et relèvement précèdent le premier mot de chaque phrase', () => {
        expect(of('lift').map((e) => e.t)).toEqual([100 - PHRASE_LEAD_MS, 1700 - PHRASE_LEAD_MS]);
        const brows = of('brow');
        expect(brows.filter((e) => e.amount >= 0.45).map((e) => e.t)).toEqual([100 - PHRASE_LEAD_MS, 1700 - PHRASE_LEAD_MS]);
        // Après la virgule : un haussement plus léger, juste avant « je ».
        expect(brows.some((e) => e.t === 700 - 100 && e.amount === 0.3)).toBe(true);
    });

    it('le hochement précède la syllabe accentuée de 90 ms, jamais deux à moins de 350 ms', () => {
        const nods = of('nod').map((e) => e.t);
        expect(nods).toContain(1040 - NOD_LEAD_MS);
        expect(nods).toContain(1980 - NOD_LEAD_MS);
        for (let i = 1; i < nods.length; i += 1) expect(nods[i] - nods[i - 1]).toBeGreaterThanOrEqual(350);
    });

    it('cligne dans les pauses de ponctuation (≥ 1,2 s d’écart), penche la tête à chaque point, revient droit à la fin', () => {
        const blinks = of('blink').map((e) => e.t);
        // Première pause (« Bonjour, », 200 ms) : clignement 40 ms dedans ; la
        // pause de « là. », 800 ms plus tard, n'en reçoit pas (écart minimal) ;
        // celle de « Merci. » oui.
        expect(blinks[0]).toBe(500 + 40);
        expect(blinks).not.toContain(1300 + 40);
        expect(blinks).toContain(2200 + 40);
        for (let i = 1; i < blinks.length; i += 1) expect(blinks[i] - blinks[i - 1]).toBeGreaterThanOrEqual(1200);
        const tilts = of('tilt');
        expect(tilts.map((e) => e.t)).toEqual([1400, 2300, 2200 + 400]);
        expect(tilts[0].amount * tilts[1].amount).toBeLessThan(0);
        expect(tilts[2].amount).toBe(0);
    });

    it('est triée dans le temps et déterministe', () => {
        for (let i = 1; i < score.events.length; i += 1) expect(score.events[i].t).toBeGreaterThanOrEqual(score.events[i - 1].t);
        expect(buildProsodyScore(piste)).toEqual(score);
    });
});

describe('Suiveur de partition : les ressorts jouent la partition, dans l’horloge de la pose', () => {
    const piste = pisteDeSynthese();
    const score = buildProsodyScore(piste);

    it('avant le premier événement, tout est au repos ; sur le hochement, la tête descend puis revient', () => {
        const tr = createScoreTracker(score);
        const rest = updateScore(tr, { t: -500, dtMs: 16, elapsedMs: 0 });
        expect(rest).toMatchObject({ nodY: 0, brow: 0, tilt: 0, blinkStartedAt: null });
        // On avance jusqu'au hochement de « là » (1040 − 90 = 950) puis 120 ms.
        let g = rest;
        for (let t = -500; t <= 1070; t += 16) g = updateScore(tr, { t, dtMs: 16, elapsedMs: t + 5000 });
        expect(g.nodY).toBeGreaterThan(0.3);
        for (let t = 1086; t <= 1600; t += 16) g = updateScore(tr, { t, dtMs: 16, elapsedMs: t + 5000 });
        expect(Math.abs(g.nodY)).toBeLessThan(0.05);
    });

    it('date le clignement dans l’horloge de la pose (origine différente de celle de la piste) et l’œil se ferme', () => {
        const tr = createScoreTracker(score);
        let g = updateScore(tr, { t: 0, dtMs: 16, elapsedMs: 9000 });
        for (let t = 16; t <= 560; t += 16) g = updateScore(tr, { t, dtMs: 16, elapsedMs: t + 9000 });
        expect(g.blinkStartedAt).not.toBeNull();
        // Clignement de la pause « Bonjour, » : à 540 ms de piste = 9 540 ms de pose.
        expect(g.blinkStartedAt).toBe(540 + 9000);
        const pose = resolveLivingPose({ elapsedMs: 540 + 70 + 9000, mouthOpenness: 0, animated: true, speaking: true, speakingBlend: 1, gesture: g });
        expect(pose.eyelid).toBeGreaterThan(0.5);
    });

    it('un retour en arrière de l’horloge rembobine la partition ; un saut en avant ne rejoue pas les vieux événements', () => {
        const tr = createScoreTracker(score);
        for (let t = 0; t <= 1000; t += 16) updateScore(tr, { t, dtMs: 16, elapsedMs: t });
        expect(tr.cursor).toBeGreaterThan(0);
        updateScore(tr, { t: 0, dtMs: 16, elapsedMs: 0 });
        // Rembobiné : seuls les événements d'avant le premier son (anticipations) sont repassés.
        expect(tr.cursor).toBe(score.events.filter((e) => e.t <= 0).length);
        // Saut de 0 à 3 000 ms : tous les événements sont dépassés de plus de 400 ms — aucun n'est rejoué.
        const jumped = updateScore(tr, { t: 3000, dtMs: 16, elapsedMs: 3000 });
        expect(jumped.blinkStartedAt).toBeNull();
        expect(tr.cursor).toBe(score.events.length);
    });

    it('la tête suit le regard (un quart du chemin) et les ressorts passent au suiveur réactif sans saut', () => {
        const tr = createScoreTracker(score);
        // Toute la partition jouée, puis une cible de regard tenue : on observe le couplage seul.
        let g = updateScore(tr, { t: 0, dtMs: 16, elapsedMs: 0 });
        for (let t = 16; t <= 3000; t += 16) g = updateScore(tr, { t, dtMs: 16, elapsedMs: t });
        tr.gazeTarget = { x: 0.6, y: -0.3 };
        tr.gazeUntil = Infinity;
        for (let t = 3016; t <= 4500; t += 16) g = updateScore(tr, { t, dtMs: 16, elapsedMs: t });
        expect(g.gazeX).toBeCloseTo(0.6, 1);
        expect(g.turnX).toBeCloseTo(0.15, 1);
        const reactive = createProsodyTracker();
        adoptSprings(tr, reactive);
        expect(reactive.gazeX.x).toBeCloseTo(tr.gazeX.x, 6);
        expect(reactive.tilt.x).toBeCloseTo(tr.tilt.x, 6);
    });
});

describe('Une seule horloge pour les clignements réactifs', () => {
    it('un clignement demandé dans une pause est daté dans l’horloge passée en `t` — la pose le lit avec la même', () => {
        // Régression du 05/09 : daté sur performance.now() mais lu sur le temps
        // écoulé de la pose, le clignement de parole n'était jamais joué dans le
        // navigateur (origine non nulle). Ici `t` EST le temps écoulé.
        const tr = createProsodyTracker();
        // Origine choisie hors de tout clignement de la table ou de saccade (le
        // suiveur ne double pas un clignement récent) : première origine, à
        // partir de 4 321 ms, dont la fenêtre de pause est vierge.
        let origine = 4321;
        const pauseAt = () => origine + 1656;
        while ([...Array(46).keys()].some((k) => blinkAmount(pauseAt() - k * 20) > 0)) origine += 100;
        let g = updateProsody(tr, { t: origine, open: 0, loud: 0, speaking: true, dtMs: 16, elapsedMs: origine });
        // 1,4 s de parole (le clignement de secours se compte depuis le début), puis une pause.
        for (let t = origine + 16; t <= origine + 1400; t += 16) g = updateProsody(tr, { t, open: 0.8, loud: 0.8, speaking: true, dtMs: 16, elapsedMs: t });
        for (let t = origine + 1416; t <= origine + 1800; t += 16) g = updateProsody(tr, { t, open: 0, loud: 0, speaking: true, dtMs: 16, elapsedMs: t });
        expect(g.blinkStartedAt).not.toBeNull();
        const debut = g.blinkStartedAt as number;
        const pose = resolveLivingPose({ elapsedMs: debut + 70, mouthOpenness: 0, animated: true, speaking: true, speakingBlend: 1, gesture: g });
        expect(pose.eyelid).toBeGreaterThan(0.5);
    });
});
