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
