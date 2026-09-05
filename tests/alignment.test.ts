import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    ACOUSTIC_MODELS,
    buildVoiceTrack,
    extractFeatures,
    mixToMono,
    trackLevelAt,
    trackShapeAt,
    type VoiceTrack,
} from '../services/architecte/alignment';
import { buildProsodyScore } from '../services/architecte/gestures';
import { BLINK_MIN_GAP_MS } from '../services/architecte/gestures';
import { MOUTH_AT_REST } from '../services/architecte/lipSync';

/**
 * ALIGNEMENT TEXTE ↔ SON sur le VRAI fichier de voix HD de la Direction
 * (`public/architecte/vision-smart.wav`, 8,19 s), pas un signal de synthèse.
 *
 * Preuve au format du playbook 15 (« Mesures et preuves attendues ») :
 * BASELINE = bouche déduite du spectre seul (v6.27) ; TEST_SET = la phrase
 * Vision Smart ; METRIC = fermetures aux b/p/m dans des creux d'énergie,
 * pauses aux ponctuations, repos aux silences ; THRESHOLD = ci-dessous ;
 * RESULT = ce que ces tests mesurent. Les mesures de contrôle (énergie
 * relative) ne servent PAS au score de l'aligneur : elles sont indépendantes.
 */
const PHRASE = 'Bonjour, je suis l’avatar de Vision Smart. Je suis ici pour accompagner, expliquer et guider les utilisateurs avec une voix claire, naturelle et professionnelle.';

function readWav(): { samples: Float32Array; sampleRate: number } {
    const wav = fs.readFileSync(path.resolve(process.cwd(), 'public/architecte/vision-smart.wav'));
    let p = 12;
    let channels = 1;
    let sampleRate = 44100;
    let data: Buffer | null = null;
    while (p < wav.length) {
        const id = wav.toString('ascii', p, p + 4);
        const n = wav.readUInt32LE(p + 4);
        if (id === 'fmt ') {
            channels = wav.readUInt16LE(p + 10);
            sampleRate = wav.readUInt32LE(p + 12);
        }
        if (id === 'data') {
            data = wav.subarray(p + 8, p + 8 + n);
            break;
        }
        p += 8 + n + (n & 1);
    }
    if (!data) throw new Error('wav sans données');
    const frames = data.length / (channels * 2);
    const samples = new Float32Array(frames);
    for (let i = 0; i < frames; i += 1) {
        let s = 0;
        for (let c = 0; c < channels; c += 1) s += data.readInt16LE((i * channels + c) * 2) / 32768;
        samples[i] = s / channels;
    }
    return { samples, sampleRate };
}

const audio = readWav();
const track = buildVoiceTrack(audio.samples, audio.sampleRate, PHRASE) as VoiceTrack;
const features = extractFeatures(audio.samples, audio.sampleRate);

const phonesOf = (word: string) => {
    const w = track.words.find((x) => x.text === word);
    if (!w) throw new Error(`mot absent : ${word}`);
    return track.phones.filter((p) => p.wordIndex === w.index && p.phone !== '_');
};
const meanOver = (arr: Float32Array, startMs: number, endMs: number): number => {
    let s = 0;
    let n = 0;
    for (let k = Math.floor(startMs / 10); k < Math.floor(endMs / 10); k += 1) {
        s += arr[k];
        n += 1;
    }
    return n ? s / n : 0;
};

describe('Le fichier réel est aligné sur son texte', () => {
    it('couvre toute la phrase : 24 mots dans l’ordre, du premier au dernier son', () => {
        expect(track).not.toBeNull();
        expect(track.words).toHaveLength(24);
        expect(track.durationMs).toBeGreaterThan(8000);
        for (let i = 1; i < track.words.length; i += 1) expect(track.words[i].start).toBeGreaterThanOrEqual(track.words[i - 1].end);
        expect(track.words[0].start).toBeLessThan(120);
        expect(track.words[23].end).toBeGreaterThan(7700);
        // 104 phonèmes transcrits ; un schwa faible (« je », « de ») peut être élidé par la voix — et par l'aligneur.
        const prononces = track.phones.filter((p) => p.phone !== '_').length;
        expect(prononces).toBeGreaterThanOrEqual(102);
        expect(prononces).toBeLessThanOrEqual(104);
    });

    it('les deux vraies pauses tombent sur la ponctuation (mesure indépendante : énergie < 5 % de la crête)', () => {
        // Relevé hors moteur (explore.cjs, 05/09) : pauses ≥ 120 ms à [1,79–2,09] et [6,13–6,50].
        const smart = track.words.find((w) => w.text === 'Smart')!;
        const claire = track.words.find((w) => w.text === 'claire')!;
        expect(Math.abs(smart.end - 1800)).toBeLessThanOrEqual(60);
        expect(Math.abs(track.words[7].start - 2090)).toBeLessThanOrEqual(60); // « Je »
        expect(Math.abs(claire.end - 6130)).toBeLessThanOrEqual(60);
        expect(Math.abs(track.words[21].start - 6500)).toBeLessThanOrEqual(60); // « naturelle »
        const pauses = track.phones.filter((p) => p.phone === '_' && (p.punctuation === '.' || p.punctuation === ',') && p.end - p.start >= 60);
        expect(pauses.length).toBeGreaterThanOrEqual(3);
        for (const pause of pauses) expect(meanOver(features.level, pause.start + 30, pause.end - 30)).toBeLessThan(-22);
    });

    it('chaque fermeture labiale (b, p, m) tombe dans un creux d’énergie : lèvres jointes au bon moment', () => {
        const closures = track.phones.filter((p) => p.phone === 'b' || p.phone === 'p' || p.phone === 'm');
        // Bonjour, Smart, pour, accompagner, expliquer, professionnelle.
        expect(closures.map((p) => p.phone).join('')).toBe('bmpppp');
        for (const c of closures) {
            // Contrôle indépendant : la proéminence (énergie − maximum des ± 60 ms voisines) n'entre pas dans le score.
            expect(meanOver(features.relative, c.start, c.end)).toBeLessThan(-6);
            const centre = (c.start + c.end) / 2;
            const forme = trackShapeAt(track, centre);
            expect(forme.closed).toBeGreaterThanOrEqual(0.9);
            expect(forme.open).toBeLessThanOrEqual(0.05);
        }
        // « pour » : la fermeture précède la voyelle « ou », arrondie.
        const pour = phonesOf('pour');
        expect(pour.map((p) => p.phone)).toEqual(['p', 'u', 'R']);
        expect(trackShapeAt(track, (pour[1].start + pour[1].end) / 2).width).toBeLessThan(0.9);
    });

    it('les voyelles ouvertes ouvrent, les fricatives montrent les dents, les silences reposent', () => {
        const smart = phonesOf('Smart');
        const a = smart.find((p) => p.phone === 'a')!;
        expect(trackShapeAt(track, (a.start + a.end) / 2).open).toBeGreaterThan(0.3);
        const s = smart.find((p) => p.phone === 's')!;
        expect(trackShapeAt(track, (s.start + s.end) / 2).teeth).toBeGreaterThan(0.5);
        expect(trackShapeAt(track, -200)).toEqual(MOUTH_AT_REST);
        expect(trackShapeAt(track, 1960)).toMatchObject({ open: 0, closed: 1 });
        expect(trackShapeAt(track, 9000).closed).toBe(1);
        expect(trackLevelAt(track, 1960)).toBeLessThan(0.15);
        expect(trackLevelAt(track, (a.start + a.end) / 2)).toBeGreaterThan(0.4);
        for (let t = 0; t < 8200; t += 50) {
            const l = trackLevelAt(track, t);
            expect(l).toBeGreaterThanOrEqual(0);
            expect(l).toBeLessThanOrEqual(1);
        }
    });

    it('la bouche PRÉCÈDE la fermeture : elle se ferme pendant la fin de la voyelle qui précède un « p »', () => {
        const pro = phonesOf('professionnelle');
        const p = pro[0];
        expect(p.phone).toBe('p');
        // 30 ms avant le début acoustique de « p », la bouche est déjà plus qu'à moitié fermée.
        expect(trackShapeAt(track, p.start - 30).open).toBeLessThan(trackShapeAt(track, p.start - 120).open);
        expect(trackShapeAt(track, p.start + 10).closed).toBeGreaterThan(0.8);
    });

    it('est déterministe et assez rapide pour précéder la lecture (8 s de son)', () => {
        const t0 = performance.now();
        const again = buildVoiceTrack(audio.samples, audio.sampleRate, PHRASE)!;
        expect(performance.now() - t0).toBeLessThan(1500);
        expect(again.phones).toEqual(track.phones);
    });

    it('refuse proprement ce qu’il ne peut pas aligner', () => {
        expect(buildVoiceTrack(audio.samples, audio.sampleRate, '— … !')).toBeNull();
        expect(buildVoiceTrack(new Float32Array(100), audio.sampleRate, PHRASE)).toBeNull();
    });

    it('mixToMono moyenne les canaux', () => {
        const buffer = {
            numberOfChannels: 2,
            length: 3,
            getChannelData: (c: number) => (c === 0 ? new Float32Array([1, 0, -1]) : new Float32Array([0, 0, 1])),
        };
        expect(Array.from(mixToMono(buffer))).toEqual([0.5, 0, 0]);
        expect(mixToMono({ numberOfChannels: 1, length: 2, getChannelData: () => new Float32Array([0.2, 0.4]) })).toEqual(new Float32Array([0.2, 0.4]));
    });

    it('les signatures des classes sont celles relevées : sifflante aiguë, silence sourd, voyelle pleine', () => {
        expect(ACOUSTIC_MODELS.FRIC_S.logZcr[0]).toBeGreaterThan(ACOUSTIC_MODELS.V_OPEN.logZcr[0] + 1.5);
        expect(ACOUSTIC_MODELS.SIL.level[0]).toBeLessThan(ACOUSTIC_MODELS.STOP_U.level[0]);
        expect(ACOUSTIC_MODELS.V_OPEN.level[0]).toBeGreaterThan(ACOUSTIC_MODELS.NASAL.level[0]);
    });
});

describe('La partition des gestes, tirée de la même piste', () => {
    const score = buildProsodyScore(track);
    const of = (kind: string) => score.events.filter((e) => e.kind === kind);

    it('cligne dans les pauses de la voix, jamais deux fois à moins de 1,2 s', () => {
        const blinks = of('blink').map((e) => e.t).sort((a, b) => a - b);
        expect(blinks.length).toBeGreaterThanOrEqual(3);
        for (let i = 1; i < blinks.length; i += 1) expect(blinks[i] - blinks[i - 1]).toBeGreaterThanOrEqual(BLINK_MIN_GAP_MS);
        // Après « Smart. » et après « claire, » : 40 ms dans la pause.
        expect(blinks.some((t) => Math.abs(t - (track.words[6].end + 40)) <= 80)).toBe(true);
        expect(blinks.some((t) => Math.abs(t - (track.words[20].end + 40)) <= 80)).toBe(true);
    });

    it('hoche AVANT chaque syllabe accentuée (anticipation), à des amplitudes variées', () => {
        const nods = of('nod');
        expect(nods.length).toBeGreaterThanOrEqual(5);
        const smartA = phonesOf('Smart').find((p) => p.phone === 'a')!;
        expect(nods.some((e) => e.t === smartA.start - 90)).toBe(true);
        expect(new Set(nods.map((e) => e.amount.toFixed(2))).size).toBeGreaterThan(2);
        for (const n of nods) expect(n.amount).toBeLessThanOrEqual(1);
    });

    it('relève la tête et hausse les sourcils avant le premier mot de chaque phrase, penche la tête à chaque point', () => {
        const lifts = of('lift');
        expect(lifts.map((e) => e.t)).toEqual([track.words[0].start - 150, track.words[7].start - 150]);
        expect(of('brow').filter((e) => e.amount >= 0.45).length).toBe(2);
        const tilts = of('tilt');
        expect(tilts.length).toBe(3);
        expect(Math.sign(tilts[0].amount)).toBe(-Math.sign(tilts[1].amount));
        expect(tilts[2].amount).toBe(0);
        expect(score.events.every((e, i, arr) => i === 0 || e.t >= arr[i - 1].t)).toBe(true);
    });
});
