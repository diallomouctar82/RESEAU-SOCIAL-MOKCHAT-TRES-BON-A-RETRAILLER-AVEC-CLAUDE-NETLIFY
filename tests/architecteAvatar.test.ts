import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_PRESENCE_LEVEL,
    ARCHITECTE_STATE_LABEL,
    DEFAULT_ARCHITECTE_AVATAR,
    DEFAULT_MOUTH_ANCHOR,
    PRESENCE_TO_GRAMMAR,
    clampMouthAnchor,
    mergeArchitecteAvatarConfig,
    needsSyntheticMediaNotice,
    resolveArchitectePresence,
    resolveArchitecteVoiceId,
    shouldAnimate,
    validateArchitectePhotoUrl,
    type ArchitecteRuntimeSignals,
} from '../services/architecte/architecteAvatar';
import {
    LIP_SYNC_LEVEL_LABEL,
    amplitudeToOpenness,
    createVoiceEnvelope,
    rmsAmplitude,
    voiceEnvelopeOpenness,
    VOICE_PEAK_MIN,
    VOICE_REFERENCE_RMS,
    LIP_SYNC_LOOKAHEAD_MS,
    resolveLipSyncLevel,
    resolveMouthOpenness,
    smoothOpenness,
    wordEnvelopeOpenness,
} from '../services/architecte/lipSync';

/**
 * AVATAR VIVANT DE L'ARCHITECTE — règles métier.
 *
 * Ce qui décide de ce que la Direction verra à l'écran : quel état, quelle
 * ouverture de bouche, quel niveau de synchro réellement atteint, ce que le
 * Super-Admin accepte. Vérifiable sans navigateur, sans audio et sans clé.
 */

const STOCK = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120';

const signals = (over: Partial<ArchitecteRuntimeSignals> = {}): ArchitecteRuntimeSignals => ({
    isSpeaking: false,
    isListening: false,
    isThinking: false,
    micFailed: false,
    ...over,
});

// ─────────────────────────────────────────────────────────────────────────
describe('Machine d’états de présence — les 8 états normatifs d’AI Core', () => {
    it('au repos par défaut', () => {
        expect(resolveArchitectePresence(signals())).toBe('rest');
    });

    it('parle, écoute, réfléchit', () => {
        expect(resolveArchitectePresence(signals({ isSpeaking: true }))).toBe('speaking');
        expect(resolveArchitectePresence(signals({ isListening: true }))).toBe('listening');
        expect(resolveArchitectePresence(signals({ isThinking: true }))).toBe('thinking');
    });

    it('HORS LIGNE passe avant tout : inutile de montrer une écoute attentive quand rien ne peut partir', () => {
        expect(resolveArchitectePresence(signals({ online: false, isListening: true, isSpeaking: true }))).toBe('offline');
    });

    it('un micro réellement en échec passe devant : jamais l’air serein pendant qu’on parle dans le vide', () => {
        expect(resolveArchitectePresence(signals({ micFailed: true, isSpeaking: true, isListening: true }))).toBe('error');
    });

    it('MODE ALLÉGÉ : une dégradation réelle est montrée, au lieu de laisser l’avatar paraître sain', () => {
        expect(resolveArchitectePresence(signals({ degraded: true }))).toBe('fallback');
    });

    it('la dégradation ne coupe pas la parole en cours : elle s’affiche une fois l’échange au calme', () => {
        expect(resolveArchitectePresence(signals({ degraded: true, isSpeaking: true }))).toBe('speaking');
    });

    it('ce qui se passe maintenant prime sur ce qui vient de se terminer', () => {
        expect(resolveArchitectePresence(signals({ isSpeaking: true, lastOutcome: 'succes' }))).toBe('speaking');
        expect(resolveArchitectePresence(signals({ isListening: true, lastOutcome: 'erreur' }))).toBe('listening');
    });

    it('le dernier résultat n’apparaît qu’une fois l’Architecte redevenu inactif', () => {
        expect(resolveArchitectePresence(signals({ lastOutcome: 'succes' }))).toBe('success');
        expect(resolveArchitectePresence(signals({ lastOutcome: 'erreur' }))).toBe('error');
        expect(resolveArchitectePresence(signals({ lastOutcome: 'incertitude' }))).toBe('fallback');
    });

    it('chaque état a une phrase lisible — le mouvement n’est jamais la seule information', () => {
        const states = Object.keys(ARCHITECTE_STATE_LABEL) as (keyof typeof ARCHITECTE_STATE_LABEL)[];
        expect(states).toHaveLength(8);
        for (const state of states) expect(ARCHITECTE_STATE_LABEL[state].length).toBeGreaterThan(2);
    });

    it('chaque état emprunte une teinte de la grammaire DÉJÀ en place — aucun second système inventé', () => {
        const states = Object.keys(ARCHITECTE_STATE_LABEL) as (keyof typeof PRESENCE_TO_GRAMMAR)[];
        for (const state of states) expect(PRESENCE_TO_GRAMMAR[state]).toBeTruthy();
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Divulgation et anti-usurpation (playbook 15, principes non négociables)', () => {
    it('le niveau de présence réellement atteint est déclaré, jamais surévalué', () => {
        // P1 (présence légère) + P2 (présence vocale). P3 vidéo temps réel et
        // P4 avatar génératif ne sont ni livrés ni simulés.
        expect(ARCHITECTE_PRESENCE_LEVEL).toBe('P2');
    });

    it('une étiquette d’identité officielle existe et ne se fait passer pour personne', () => {
        expect(ARCHITECTE_DISCLOSURE).toMatch(/officielle MokNet/);
    });

    it('l’avatar livré étant une PHOTO, la mention de média synthétique est obligatoire', () => {
        // Refonte du 04/09 : l'avatar par défaut n'est plus un dessin mais un
        // portrait photoréaliste. Une confusion redevient donc possible, et le
        // playbook § 9 impose la mention. C'est le sens de ce test.
        expect(needsSyntheticMediaNotice(DEFAULT_ARCHITECTE_AVATAR)).toBe(true);
    });

    it('le repli vectoriel, lui, n’en a pas besoin — rien d’humain à confondre', () => {
        expect(needsSyntheticMediaNotice({ ...DEFAULT_ARCHITECTE_AVATAR, photoUrl: '' })).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Réglage « activer ou désactiver les animations »', () => {
    const visible = { prefersReducedMotion: false, documentVisible: true, onScreen: true };

    it('anime quand la Direction l’autorise et que rien ne s’y oppose', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, visible)).toBe(true);
    });

    it('n’anime pas quand la Direction a coupé', () => {
        expect(shouldAnimate({ ...DEFAULT_ARCHITECTE_AVATAR, animationsEnabled: false }, visible)).toBe(false);
    });

    it('n’anime pas quand le système demande de réduire le mouvement — l’accessibilité prime sur le réglage', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, { ...visible, prefersReducedMotion: true })).toBe(false);
    });

    it('s’arrête sur un onglet caché : une boucle que personne ne voit ne consomme pas de batterie', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, { ...visible, documentVisible: false })).toBe(false);
    });

    it('s’arrête hors écran — exigence explicite du playbook 15 § 3', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, { ...visible, onScreen: false })).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Réglage « changer l’avatar » — ce que le Super-Admin accepte', () => {
    it('accepte https, un chemin interne et une image importée', () => {
        expect(validateArchitectePhotoUrl('https://cdn.moknet.app/architecte.png')).toBeNull();
        expect(validateArchitectePhotoUrl('/architecte/reference.jpg')).toBeNull();
        expect(validateArchitectePhotoUrl('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
    });

    it('refuse le cliché de banque d’images hérité', () => {
        expect(validateArchitectePhotoUrl(STOCK)?.code).toBe('placeholder');
    });

    it('refuse http:// et une adresse relative ambiguë', () => {
        expect(validateArchitectePhotoUrl('http://exemple.com/a.png')?.code).toBe('protocole');
        expect(validateArchitectePhotoUrl('architecte.png')?.code).toBe('protocole');
    });

    it('un champ vide renvoie vers « remettre l’avatar par défaut »', () => {
        expect(validateArchitectePhotoUrl('   ')?.code).toBe('vide');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Ancre de bouche — le code ne devine pas où est une bouche', () => {
    it('borne un réglage hors cadre au lieu de placer la bouche hors du visage', () => {
        expect(clampMouthAnchor({ xPercent: 300, yPercent: -50, widthPercent: 900 })).toEqual({
            xPercent: 100,
            yPercent: 0,
            widthPercent: 60,
            tiltDeg: DEFAULT_MOUTH_ANCHOR.tiltDeg,
        });
    });

    it('retombe sur la valeur par défaut devant une saisie non numérique', () => {
        expect(clampMouthAnchor({ xPercent: NaN, yPercent: NaN, widthPercent: NaN })).toEqual(DEFAULT_MOUTH_ANCHOR);
    });

    it('conserve un réglage valide', () => {
        expect(clampMouthAnchor({ xPercent: 42, yPercent: 71, widthPercent: 18 })).toEqual({
            xPercent: 42,
            yPercent: 71,
            widthPercent: 18,
            tiltDeg: DEFAULT_MOUTH_ANCHOR.tiltDeg,
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Configuration héritée', () => {
    it('complète les clés absentes plutôt que de laisser l’écran lire `undefined`', () => {
        const merged = mergeArchitecteAvatarConfig({ photoUrl: '/a.png' });
        expect(merged.photoUrl).toBe('/a.png');
        expect(merged.animationsEnabled).toBe(true);
        expect(merged.mouthAnchor).toEqual(DEFAULT_MOUTH_ANCHOR);
    });

    it('complète une ancre partielle sans perdre ce qui est réglé', () => {
        const merged = mergeArchitecteAvatarConfig({ mouthAnchor: { yPercent: 80 } });
        expect(merged.mouthAnchor.yPercent).toBe(80);
        expect(merged.mouthAnchor.xPercent).toBe(DEFAULT_MOUTH_ANCHOR.xPercent);
    });

    it('résiste à un contenu illisible', () => {
        expect(mergeArchitecteAvatarConfig(null)).toEqual(DEFAULT_ARCHITECTE_AVATAR);
        expect(mergeArchitecteAvatarConfig('cassé').displayName).toBe("L'Architecte");
    });

    it('l’usine livre un vrai PORTRAIT, et son calage avec — sinon rien ne s’anime', () => {
        expect(DEFAULT_ARCHITECTE_AVATAR.photoUrl).toMatch(/^\/architecte\/.+\.(webp|png|jpe?g)$/);
        expect(DEFAULT_ARCHITECTE_AVATAR.rig.eyeLinePercent).toBeGreaterThan(0);
        expect(DEFAULT_ARCHITECTE_AVATAR.rig.jawLinePercent).toBeGreaterThan(
            DEFAULT_ARCHITECTE_AVATAR.rig.eyeLinePercent,
        );
        // La ligne de mâchoire est à la commissure des lèvres (± 3 %) : la
        // lèvre du haut reste fixe, celle du bas descend. Un calage incohérent
        // ouvrirait la bouche au milieu du front ou ferait descendre le nez.
        expect(Math.abs(DEFAULT_MOUTH_ANCHOR.yPercent - DEFAULT_ARCHITECTE_AVATAR.rig.jawLinePercent)).toBeLessThanOrEqual(3);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Réglage « régler la voix »', () => {
    const catalogue = { professor: { id: 'voice-george' }, directeur: { id: 'voice-adam' } };

    it('utilise la voix choisie', () => {
        const config = { ...DEFAULT_ARCHITECTE_AVATAR, voiceKey: 'directeur' };
        expect(resolveArchitecteVoiceId(config, catalogue, 'voice-defaut')).toBe('voice-adam');
    });

    it('un réglage vide ou inconnu ne rend jamais l’Architecte muet', () => {
        expect(resolveArchitecteVoiceId(DEFAULT_ARCHITECTE_AVATAR, catalogue, 'voice-defaut')).toBe('voice-defaut');
        const inconnue = { ...DEFAULT_ARCHITECTE_AVATAR, voiceKey: 'nexiste-pas' };
        expect(resolveArchitecteVoiceId(inconnue, catalogue, 'voice-defaut')).toBe('voice-defaut');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Synchro labiale — niveau réellement atteint, jamais surévalué', () => {
    const base = { isSpeaking: true, lipSyncEnabled: true, prefersReducedMotion: false };

    it('ElevenLabs donne accès au signal : amplitude réelle', () => {
        expect(resolveLipSyncLevel({ ...base, engine: 'elevenlabs' })).toBe('amplitude_reelle');
    });

    it('le moteur natif du navigateur n’expose aucun flux : rythme des mots, et c’est dit', () => {
        expect(resolveLipSyncLevel({ ...base, engine: 'browser_native' })).toBe('rythme_des_mots');
        expect(LIP_SYNC_LEVEL_LABEL.rythme_des_mots).toMatch(/pas le volume/);
    });

    it('bouche close quand l’Architecte ne parle pas', () => {
        expect(resolveLipSyncLevel({ ...base, isSpeaking: false, engine: 'elevenlabs' })).toBe('aucune');
    });

    it('le réglage Super-Admin coupe la synchro', () => {
        expect(resolveLipSyncLevel({ ...base, lipSyncEnabled: false, engine: 'elevenlabs' })).toBe('aucune');
    });

    it('« réduire le mouvement » coupe aussi la bouche — une bouche qui s’agite reste du mouvement', () => {
        expect(resolveLipSyncLevel({ ...base, prefersReducedMotion: true, engine: 'elevenlabs' })).toBe('aucune');
    });

    it('aucun moteur identifié = aucune animation inventée', () => {
        expect(resolveLipSyncLevel({ ...base, engine: null })).toBe('aucune');
    });
});

describe('Synchro labiale — de la voix mesurée à l’ouverture', () => {
    it('amplitude efficace : sinusoïde pleine échelle ≈ 0,707, silence = 0, tampon vide = 0', () => {
        const sinus = Array.from({ length: 2048 }, (_, i) => Math.sin((i / 2048) * Math.PI * 2 * 16));
        expect(rmsAmplitude(sinus)).toBeCloseTo(Math.SQRT1_2, 3);
        expect(rmsAmplitude(new Float32Array(2048))).toBe(0);
        expect(rmsAmplitude([])).toBe(0);
    });

    it('reste close sur le silence et le souffle : jamais de bouche qui tremble entre deux phrases', () => {
        const env = createVoiceEnvelope();
        expect(voiceEnvelopeOpenness(env, 0, 16)).toBe(0);
        expect(voiceEnvelopeOpenness(env, 0.004, 16)).toBe(0); // souffle d'un fichier de voix (≈ −50 dB)
        expect(voiceEnvelopeOpenness(env, NaN, 16)).toBe(0);
    });

    it('une syllabe à la crête ouvre en grand, une consonne au-dessous du seuil referme', () => {
        const env = createVoiceEnvelope();
        expect(voiceEnvelopeOpenness(env, 0.25, 16)).toBe(1);
        expect(env.peak).toBeCloseTo(0.25, 6);
        expect(voiceEnvelopeOpenness(env, 0.03, 16)).toBe(0); // 0,03 / 0,25 = 0,12 < seuil de fermeture
        const mi = voiceEnvelopeOpenness(env, 0.12, 16);
        expect(mi).toBeGreaterThan(0.3);
        expect(mi).toBeLessThan(0.9);
    });

    it('s’adapte à une voix plus douce : après ~3 s, ses propres crêtes ouvrent en grand', () => {
        const env = createVoiceEnvelope();
        expect(env.peak).toBe(VOICE_REFERENCE_RMS);
        let derniere = 0;
        for (let i = 0; i < 200; i += 1) derniere = voiceEnvelopeOpenness(env, 0.08, 16); // 3,2 s à 0,08
        expect(env.peak).toBeCloseTo(0.08, 6);
        expect(derniere).toBe(1);
    });

    it('n’amplifie jamais un souffle jusqu’à ouvrir la bouche : la crête ne descend pas sous le minimum', () => {
        const env = createVoiceEnvelope();
        for (let i = 0; i < 600; i += 1) voiceEnvelopeOpenness(env, 0, 16); // 10 s de silence
        expect(env.peak).toBeCloseTo(VOICE_PEAK_MIN, 2);
        expect(voiceEnvelopeOpenness(env, 0.005, 16)).toBe(0);
    });

    it('la phrase Vision Smart RÉELLEMENT mesurée : bouche corrélée au son, fermée sur les silences, ouverte sur les voyelles', () => {
        // RMS relevé image par image dans la page réelle (voix HD, 04/09/2026).
        const fixture = JSON.parse(readFileSync('tests/fixtures/vision-smart-rms.json', 'utf8')) as {
            dt_ms: number;
            rms: number[];
        };
        const env = createVoiceEnvelope();
        let ouverture = 0;
        const bouche = fixture.rms.map((rms) => {
            const cible = voiceEnvelopeOpenness(env, rms, fixture.dt_ms);
            ouverture = smoothOpenness(ouverture, cible, fixture.dt_ms);
            return ouverture;
        });
        const moyenne = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
        const ma = moyenne(fixture.rms);
        const mb = moyenne(bouche);
        let sab = 0;
        let saa = 0;
        let sbb = 0;
        fixture.rms.forEach((a, i) => {
            sab += (a - ma) * (bouche[i] - mb);
            saa += (a - ma) ** 2;
            sbb += (bouche[i] - mb) ** 2;
        });
        const correlation = sab / Math.sqrt(saa * sbb);
        // Avant correction (spectre en octets) : 0,15 et bouche ouverte sur 98 % des images.
        expect(correlation).toBeGreaterThan(0.75);
        const fermees = bouche.filter((v) => v < 0.12).length / bouche.length;
        const ouvertes = bouche.filter((v) => v > 0.6).length / bouche.length;
        expect(fermees).toBeGreaterThan(0.15);
        expect(ouvertes).toBeGreaterThan(0.2);
        expect(ouvertes).toBeLessThan(0.7);
    });

    it('borne le niveau publié et ignore une valeur non numérique au lieu de propager NaN jusqu’au rendu', () => {
        expect(amplitudeToOpenness(NaN)).toBe(0);
        expect(amplitudeToOpenness(-1)).toBe(0);
        expect(amplitudeToOpenness(0.4)).toBeCloseTo(0.4, 6);
        expect(amplitudeToOpenness(3)).toBe(1);
    });

    it('retard volontaire du son : couvre la chaîne mesurée plus l’avance visuelle et la fenêtre, sans devenir une attente', () => {
        expect(LIP_SYNC_LOOKAHEAD_MS).toBeGreaterThanOrEqual(RENDER_LATENCY_MS + VISUAL_LEAD_MS + COARTICULATION_WINDOW_MS);
        expect(LIP_SYNC_LOOKAHEAD_MS).toBeLessThanOrEqual(250);
        // Lecture du tampon : dans le passé, toute la fenêtre de coarticulation
        // déjà mesurée, et jamais plus loin qu'un huitième de seconde.
        const lecture = mouthReadTime(1000, LIP_SYNC_LOOKAHEAD_MS);
        expect(lecture + COARTICULATION_WINDOW_MS).toBeLessThanOrEqual(1000);
        expect(lecture).toBeGreaterThanOrEqual(1000 - 125);
        // Casque lent : la lecture recule d'autant.
        expect(mouthReadTime(1000, 400)).toBeLessThan(mouthReadTime(1000, LIP_SYNC_LOOKAHEAD_MS));
    });

    it('lisse : ouverture rapide à l’attaque, fermeture presque aussi vive', () => {
        const montee = smoothOpenness(0, 1);
        const descente = smoothOpenness(1, 0);
        // ~4 images à 60 i/s pour 80 % de l'ouverture (≈ 70 ms), comme une
        // lèvre. Un facteur de 0,55 ouvrait en deux images et claquait —
        // mesuré par simulation de la boucle réelle le 04/09. La fermeture
        // (48 ms) doit sceller les lèvres à temps sur un « p » de 50 ms
        // (à 67 ms, elles ne l'étaient plus — pixels du film, 05/09).
        expect(montee).toBeCloseTo(0.35, 2);
        expect(1 - descente).toBeCloseTo(0.29, 2);
        // La montée reste un peu plus franche que la descente : une bouche a de l'inertie.
        expect(montee).toBeGreaterThan(1 - descente);
    });

    it('lisse EN TEMPS : quatre images à 60 Hz = une image à 15 Hz, la bouche ne dépend pas de la cadence', () => {
        let a = 0;
        for (let i = 0; i < 4; i += 1) a = smoothOpenness(a, 1, 1000 / 60);
        const b = smoothOpenness(0, 1, 4000 / 60);
        expect(a).toBeCloseTo(b, 9);
        // Une image interminable (onglet caché) n'est pas extrapolée à l'infini.
        expect(smoothOpenness(0, 1, 5000)).toBeCloseTo(smoothOpenness(0, 1, 100), 9);
        expect(smoothOpenness(0, 1, NaN)).toBeCloseTo(smoothOpenness(0, 1), 9);
    });
});

describe('Synchro labiale — rythme des mots (moteur natif)', () => {
    it('s’ouvre, culmine, puis se referme sur la durée du mot', () => {
        expect(wordEnvelopeOpenness(0, 5)).toBeCloseTo(0, 5);
        const milieu = wordEnvelopeOpenness(130, 5);
        expect(milieu).toBeGreaterThan(0.7);
        expect(wordEnvelopeOpenness(260, 5)).toBe(0);
    });

    it('un mot long tient la bouche ouverte plus longtemps qu’un monosyllabe', () => {
        expect(wordEnvelopeOpenness(300, 12)).toBeGreaterThan(0);
        expect(wordEnvelopeOpenness(300, 2)).toBe(0);
    });

    it('ne dépasse jamais 0,8 : une bouche constamment grande ouverte trahit l’animation', () => {
        for (let ms = 0; ms < 600; ms += 10) {
            expect(wordEnvelopeOpenness(ms, 8)).toBeLessThanOrEqual(0.8);
        }
    });

    it('reste close avant le premier mot et devant une valeur absurde', () => {
        expect(wordEnvelopeOpenness(Infinity, 5)).toBe(0);
        expect(wordEnvelopeOpenness(-10, 5)).toBe(0);
    });
});

describe('Point d’entrée unique du composant', () => {
    it('route vers la bonne règle selon le niveau, et ferme la bouche sinon', () => {
        expect(resolveMouthOpenness('amplitude_reelle', { amplitude: 0.45 })).toBeGreaterThan(0);
        expect(resolveMouthOpenness('rythme_des_mots', { elapsedMs: 100, wordLength: 6 })).toBeGreaterThan(0);
        expect(resolveMouthOpenness('aucune', { amplitude: 1, elapsedMs: 0 })).toBe(0);
    });

    it('sans source exploitable, bouche close plutôt qu’animation fabriquée', () => {
        expect(resolveMouthOpenness('amplitude_reelle', {})).toBe(0);
        expect(resolveMouthOpenness('rythme_des_mots', {})).toBe(0);
    });
});


// ─────────────────────────────────────────────────────────────────────────
// Visèmes acoustiques : du spectre à la forme de la bouche
// ─────────────────────────────────────────────────────────────────────────
import {
    MAX_SPEECH_OPENNESS,
    MOUTH_AT_REST,
    createVoiceEnvelope as nouvelleEnveloppe,
    mouthShapeFromBands,
    smoothMouthShape,
    spectralBands,
    type SpectralBands,
} from '../services/architecte/lipSync';

/** Spectre de banc en dB par bande, pour un tampon de 1 024 bandes à 44,1 kHz. */
function spectre(regle: (hz: number) => number): Float32Array {
    const out = new Float32Array(1024);
    for (let i = 0; i < out.length; i += 1) out[i] = regle((i * 44100) / 2048);
    return out;
}
const voyelleA = spectre((hz) => (hz >= 250 && hz <= 900 ? -20 : -95));
const voyelleI = spectre((hz) => (hz >= 250 && hz <= 350 ? -22 : hz >= 2100 && hz <= 2600 ? -26 : -95));
const voyelleOU = spectre((hz) => (hz >= 250 && hz <= 380 ? -20 : hz >= 900 && hz <= 1100 ? -30 : -95));
const fricativeS = spectre((hz) => (hz >= 3500 && hz <= 7500 ? -30 : -95));
const nasaleM = spectre((hz) => (hz >= 100 && hz <= 300 ? -35 : -95));
const rien = spectre(() => -140);
const tampon = (amplitude: number) => new Float32Array(2048).fill(amplitude);

describe('Visèmes acoustiques — la forme de la bouche vient du spectre, pas du volume seul', () => {
    it('lit les bandes et les centroïdes du spectre en dB ; tampon vide = rien', () => {
        const b = spectralBands(voyelleA, tampon(0.2), 44100);
        expect(b.rms).toBeCloseTo(0.2, 6);
        expect(b.f1).toBeGreaterThan(b.high * 1000);
        expect(b.cF1).toBeGreaterThan(500);
        expect(b.cF1).toBeLessThan(700);
        const vide = spectralBands(new Float32Array(0), [], 44100);
        expect(vide).toEqual({ rms: 0, low: 0, f1: 0, mid: 0, high: 0, cF1: 0, cF2: 0 });
    });

    it('« a » ouvre la mâchoire à l’amplitude de parole, jamais jusqu’au cri', () => {
        const env = nouvelleEnveloppe();
        const forme = mouthShapeFromBands(spectralBands(voyelleA, tampon(0.2), 44100), env, 16);
        expect(forme.open).toBeGreaterThan(0.35);
        expect(forme.open).toBeLessThanOrEqual(MAX_SPEECH_OPENNESS + 0.01);
        expect(forme.closed).toBeLessThan(0.1);
        expect(forme.teeth).toBeLessThan(0.1);
    });

    it('« i » étire les lèvres et garde la mâchoire presque close ; « ou » les arrondit', () => {
        const env = nouvelleEnveloppe();
        const i = mouthShapeFromBands(spectralBands(voyelleI, tampon(0.15), 44100), env, 16);
        expect(i.width).toBeGreaterThan(1.1);
        expect(i.open).toBeLessThan(0.2);
        const ou = mouthShapeFromBands(spectralBands(voyelleOU, tampon(0.15), 44100), env, 16);
        expect(ou.width).toBeLessThan(0.97);
    });

    it('« s » montre les dents entre des lèvres à peine entrouvertes ; « m » joint les lèvres ; le silence aussi', () => {
        const env = nouvelleEnveloppe();
        mouthShapeFromBands(spectralBands(voyelleA, tampon(0.2), 44100), env, 16); // étalonne la crête
        const s = mouthShapeFromBands(spectralBands(fricativeS, tampon(0.02), 44100), env, 16);
        expect(s.teeth).toBeGreaterThan(0.5);
        expect(s.open).toBeLessThan(0.18);
        expect(s.open).toBeGreaterThan(0.05);
        const m = mouthShapeFromBands(spectralBands(nasaleM, tampon(0.025), 44100), env, 16);
        expect(m.closed).toBeGreaterThan(0.8);
        expect(m.open).toBeLessThan(0.02);
        const silence = mouthShapeFromBands(spectralBands(rien, tampon(0), 44100), env, 16);
        expect(silence.open).toBe(0);
        expect(silence.closed).toBeGreaterThan(0.9);
        expect(silence.level).toBe(0);
    });

    it('le lissage de forme est en temps et borné ; le niveau suit sans inertie', () => {
        const cible = { open: 0.5, width: 1.2, teeth: 1, closed: 0, level: 0.8 };
        const une = smoothMouthShape(MOUTH_AT_REST, cible, 16);
        expect(une.open).toBeGreaterThan(0);
        expect(une.open).toBeLessThan(0.5);
        expect(une.width).toBeGreaterThan(1);
        expect(une.width).toBeLessThan(1.2);
        expect(une.level).toBe(0.8);
        let s = MOUTH_AT_REST;
        for (let i = 0; i < 120; i += 1) s = smoothMouthShape(s, cible, 16);
        expect(s.open).toBeCloseTo(0.5, 2);
        expect(s.width).toBeCloseTo(1.2, 2);
        expect(s.teeth).toBeCloseTo(1, 2);
    });

    it('la phrase Vision Smart RÉELLEMENT analysée : voyelles ouvertes, « i » étirés, « s » avec les dents, « m »/« p » jointes, silences fermés, jamais grand ouverte', () => {
        // Traits relevés image par image par l'analyseur du navigateur (05/09/2026).
        const fixture = JSON.parse(readFileSync('tests/fixtures/vision-smart-bands.json', 'utf8')) as {
            fps: number;
            frames: (SpectralBands & { t: number })[];
        };
        const env = nouvelleEnveloppe();
        let lisse = MOUTH_AT_REST;
        const dt = 1000 / fixture.fps;
        const suite = fixture.frames.map((f) => {
            const brute = mouthShapeFromBands(f, env, dt);
            lisse = smoothMouthShape(lisse, brute, dt);
            return { t: f.t, brute, lisse };
        });
        const a = (t: number) => suite.reduce((p, c) => (Math.abs(c.t - t) < Math.abs(p.t - t) ? c : p));
        // « a » de « l'avatar », « pour », « -sa- » : mâchoire franchement ouverte.
        for (const t of [0.8, 1.07, 2.9, 4.9]) expect(a(t).brute.open).toBeGreaterThan(0.4);
        // « i » de « Vision », « ici », « gui- » : lèvres étirées, mâchoire presque close.
        for (const t of [1.4, 2.47, 4.2]) {
            expect(a(t).brute.width).toBeGreaterThan(1.1);
            expect(a(t).brute.open).toBeLessThan(0.2);
        }
        // « ou » de « Bonjour » : arrondie.
        expect(a(0.37).brute.width).toBeLessThan(0.95);
        // « s » de « suis », « Smart », « ici » : dents.
        for (const t of [0.6, 1.6, 2.57]) expect(a(t).brute.teeth).toBeGreaterThan(0.5);
        // « m » de « Smart », « p » de « pour », « m » de « accompagner », silence entre les phrases : lèvres jointes.
        for (const t of [1.7, 2.75, 3.1, 2.0]) {
            expect(a(t).brute.closed).toBeGreaterThan(0.9);
            expect(a(t).brute.open).toBeLessThan(0.01);
        }
        // Amplitude « pro » : jamais grand ouverte, l'essentiel du temps entrouverte ou close.
        const ouvertures = suite.filter((s) => s.t > 0.05 && s.t < 8.1).map((s) => s.lisse.open);
        expect(Math.max(...ouvertures)).toBeLessThan(0.65);
        expect(ouvertures.filter((o) => o > 0.4).length / ouvertures.length).toBeLessThan(0.15);
        expect(ouvertures.filter((o) => o < 0.08).length / ouvertures.length).toBeGreaterThan(0.3);
    });
});

import { COARTICULATION_WINDOW_MS, MouthShapeBuffer, RENDER_LATENCY_MS, VISUAL_LEAD_MS, mouthReadTime } from '../services/architecte/lipSync';

describe('Anticipation et coarticulation — la bouche précède le son, sans à-coups', () => {
    const forme = (open: number): typeof MOUTH_AT_REST => ({ open, width: 1, teeth: 0, closed: open === 0 ? 1 : 0, level: open });

    it('vide = repos ; une seule mesure = cette mesure, quel que soit l’instant demandé', () => {
        const b = new MouthShapeBuffer();
        expect(b.at(100)).toEqual(MOUTH_AT_REST);
        b.push(1000, forme(0.5));
        expect(b.at(1000).open).toBeCloseTo(0.5, 9);
        expect(b.at(5000).open).toBeCloseTo(0.5, 9);
        expect(b.at(NaN).open).toBeCloseTo(0.5, 9);
    });

    it('lit une forme EN AVANCE sur le son entendu : l’avance est réelle et courte', () => {
        expect(VISUAL_LEAD_MS).toBeGreaterThanOrEqual(40);
        expect(VISUAL_LEAD_MS).toBeLessThanOrEqual(100);
        const b = new MouthShapeBuffer();
        for (let t = 0; t <= 400; t += 16) b.push(t, forme(t >= 200 ? 0.6 : 0)); // la voyelle commence à 200 ms
        // L'appelant affiche à l'instant entendu T la forme de T + avance : à
        // T = 200 − avance, la bouche s'ouvre déjà ; à T = 100, rien encore.
        expect(b.at(200 - VISUAL_LEAD_MS + VISUAL_LEAD_MS).open).toBeGreaterThanOrEqual(0.25);
        expect(b.at(100 + VISUAL_LEAD_MS).open).toBe(0);
        // Avant toute mesure : repos (le son n'avait pas commencé).
        expect(b.at(-500).open).toBe(0);
    });

    it('coarticule : une marche brute devient une pente sur la fenêtre, sans retard de phase', () => {
        const b = new MouthShapeBuffer();
        for (let t = 0; t <= 600; t += 8) b.push(t, forme(t >= 300 ? 0.6 : 0));
        const avant = b.at(300 - COARTICULATION_WINDOW_MS - 8).open;
        const milieu = b.at(300).open;
        const apres = b.at(300 + COARTICULATION_WINDOW_MS + 8).open;
        expect(avant).toBe(0);
        expect(milieu).toBeGreaterThan(0.2);
        expect(milieu).toBeLessThan(0.4); // à la marche : à mi-chemin, ni en avance ni en retard
        expect(apres).toBeCloseTo(0.6, 6);
    });

    it('oublie ce qui est trop vieux et repart proprement si l’horloge recule', () => {
        const b = new MouthShapeBuffer();
        for (let t = 0; t <= 3000; t += 16) b.push(t, forme(0.3));
        expect(b.size).toBeLessThan(80);
        b.push(10, forme(0));
        expect(b.size).toBe(1);
        // Au montage, on garde toute la phrase.
        const long = new MouthShapeBuffer(60000);
        for (let t = 0; t <= 9000; t += 33) long.push(t, forme(0.3));
        expect(long.size).toBeGreaterThan(250);
        expect(long.at(100).open).toBeCloseTo(0.3, 9);
    });
});

// ─────────────────────────────────────────────────────────────────────────
// Horloge du son et niveau « visèmes alignés »
// ─────────────────────────────────────────────────────────────────────────
import { LIP_SYNC_LEVEL_LABEL as LABELS, createAudioClock, resolveLipSyncLevel as niveau } from '../services/architecte/lipSync';

describe('Horloge du son : position lissée entre deux paliers de `currentTime`', () => {
    it('suit une position qui avance par paliers de 40 ms avec moins de 25 ms d’écart, sans jamais reculer', () => {
        const clock = createAudioClock();
        let worst = 0;
        let previous = -Infinity;
        for (let now = 0; now <= 2000; now += 16) {
            const media = Math.floor(now / 40) * 40; // ce que rend un navigateur à paliers
            const estimate = clock.update(media, now);
            worst = Math.max(worst, Math.abs(estimate - now));
            expect(estimate).toBeGreaterThanOrEqual(previous);
            previous = estimate;
        }
        expect(worst).toBeLessThan(25);
    });

    it('saute franchement sur un grand écart (retour en arrière) et repart de zéro après `reset`', () => {
        const clock = createAudioClock();
        clock.update(1000, 0);
        clock.update(1016, 16);
        expect(clock.update(200, 32)).toBe(200);
        clock.reset();
        expect(clock.update(5000, 100)).toBe(5000);
        expect(clock.update(Number.NaN, 116)).toBe(5000);
    });
});

describe('Niveau « visèmes alignés » : annoncé seulement quand la piste existe', () => {
    const base = { isSpeaking: true, engine: 'elevenlabs' as const, lipSyncEnabled: true, prefersReducedMotion: false };
    it('voix HD alignée → visèmes ; non alignée → amplitude ; navigateur → rythme des mots même si « aligné »', () => {
        expect(niveau({ ...base, aligned: true })).toBe('visemes_alignes');
        expect(niveau({ ...base, aligned: false })).toBe('amplitude_reelle');
        expect(niveau({ ...base })).toBe('amplitude_reelle');
        expect(niveau({ ...base, engine: 'browser_native', aligned: true })).toBe('rythme_des_mots');
        expect(niveau({ ...base, aligned: true, lipSyncEnabled: false })).toBe('aucune');
    });
    it('a un libellé qui dit ce que c’est, sans prétendre plus', () => {
        expect(LABELS.visemes_alignes).toMatch(/phonétiques/);
        expect(LABELS.visemes_alignes).toMatch(/calé sur le son/);
        expect(LABELS.visemes_alignes).toMatch(/b, p, m/);
    });
});
