import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ÉQUIPE V — continuité vocale de l'Architecte (mission « voix saccadée »).
 *
 * Les deux défauts majeurs identifiés par l'audit du 30/08/2026 :
 * 1. La génération HD est asynchrone (1-4 s) et n'était PAS annulable :
 *    fermer la barre ou relancer un `speak` pendant cette attente laissait la
 *    promesse continuer — l'audio partait quand même quelques secondes plus
 *    tard (la « phrase fantôme »), et deux `speak` rapprochés se
 *    SUPERPOSAIENT (l'impression de plusieurs intervenants).
 * 2. Le texte ENTIER partait en une seule synthèse : long silence avant le
 *    premier son. Désormais la première phrase part seule (premier son
 *    rapide mais toujours une phrase complète — jamais un faux départ), la
 *    suite est générée PENDANT la lecture et enchaînée avec la respiration
 *    par ponctuation.
 */

const gateway = vi.hoisted(() => ({
    generateSpeech: vi.fn(async (_t: string): Promise<string> => 'QVVESU8='),
}));
vi.mock('../services/aiGateway', () => ({
    generateSpeech: gateway.generateSpeech,
    // Le moteur consomme désormais la variante détaillée (MIME réel) — le
    // mock DÉLÈGUE au mock historique pour préserver toutes les assertions
    // de comptage/mockImplementationOnce existantes.
    generateSpeechDetailed: vi.fn(async (t: string, o?: unknown) => ({
        audioBase64: await gateway.generateSpeech(t, o),
        mimeType: 'audio/mpeg',
    })),
    generateText: vi.fn(async () => ''),
    generateJSON: vi.fn(async () => null),
    analyzeImage: vi.fn(async () => ''),
    AiGatewayNetworkError: class extends Error { readonly isNetwork = true; },
}));

class FakeAudio {
    static instances: FakeAudio[] = [];
    static playedSources: string[] = [];
    src: string;
    currentTime = 0;
    onended: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onpause: (() => void) | null = null;
    constructor(src: string) {
        this.src = src;
        FakeAudio.instances.push(this);
    }
    play() { FakeAudio.playedSources.push(this.src); return Promise.resolve(); }
    pause() { this.onpause?.(); }
}

const fakeSpeechSynthesis = {
    cancel: vi.fn(), speak: vi.fn(), pause: vi.fn(), resume: vi.fn(),
    getVoices: () => [], speaking: false,
};

const { voiceEngine } = await import('../services/voiceEngine');

beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
    (window as any).speechSynthesis = fakeSpeechSynthesis;
    (window as any).SpeechSynthesisUtterance = class {
        text: string; lang = ''; rate = 1; pitch = 1; voice: unknown = null;
        onend: (() => void) | null = null; onerror: ((e: unknown) => void) | null = null;
        constructor(text: string) { this.text = text; }
    };
    FakeAudio.instances = [];
    FakeAudio.playedSources = [];
    fakeSpeechSynthesis.speak.mockClear();
    gateway.generateSpeech.mockClear();
    gateway.generateSpeech.mockImplementation(async () => 'QVVESU8=');
    (voiceEngine as any).audioCache = new Map();
});

afterEach(() => {
    voiceEngine.stopSpeaking();
    vi.unstubAllGlobals();
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
});

describe('découpage HD — première phrase vite audible, jamais un faux départ', () => {
    it('la première phrase part SEULE, la suite est regroupée en blocs', () => {
        const segments = (voiceEngine as any).splitForHdSynthesis(
            'Bonjour, et bienvenue ! Voici la première étape du parcours. Ensuite nous verrons la suite ensemble.'
        );
        expect(segments[0]).toBe('Bonjour, et bienvenue !');
        expect(segments).toHaveLength(2);
        expect(segments[1]).toContain('première étape');
        expect(segments[1]).toContain('la suite ensemble');
    });

    it('une réponse à une seule phrase reste un seul segment — pas de découpe inutile', () => {
        const segments = (voiceEngine as any).splitForHdSynthesis('Je vous écoute.');
        expect(segments).toEqual(['Je vous écoute.']);
    });
});

describe('repli navigateur — les virgules restent dans la phrase (fin des coupures entre mots)', () => {
    it("une phrase ordinaire avec plusieurs virgules reste UN SEUL énoncé", () => {
        const phrases = (voiceEngine as any).splitIntoAcousticPhrases(
            'Dans un premier temps, nous allons créer votre profil, puis votre premier dossier, tranquillement.'
        );
        expect(phrases).toHaveLength(1);
        expect(phrases[0]).toContain('tranquillement');
    });

    it('la coupe à la virgule ne reste que pour les phrases anormalement longues (garde-fou moteur)', () => {
        const tresLongue = Array.from({ length: 10 }, (_, i) => `ceci est le morceau numéro ${i + 1} de la phrase`).join(', ') + '.';
        const phrases = (voiceEngine as any).splitIntoAcousticPhrases(tresLongue);
        expect(phrases.length).toBeGreaterThan(1);
        for (const p of phrases) expect(p.length).toBeLessThanOrEqual(240);
    });
});

describe('annulation — plus jamais de phrase fantôme ni de superposition', () => {
    it("fermer pendant la génération HD = SILENCE : l'audio résolu après coup ne joue jamais, et aucun repli ne parle à sa place", async () => {
        let resolveGen: (v: string) => void = () => {};
        gateway.generateSpeech.mockImplementationOnce(() => new Promise<string>((r) => { resolveGen = r; }));

        const p = voiceEngine.speak('Voici une réponse qui arrive trop tard.');
        await Promise.resolve();
        voiceEngine.stopSpeaking(); // fermeture de la barre pendant la génération

        resolveGen('RkFOVE9NRQ=='); // le fournisseur répond... trop tard
        await p;

        expect(FakeAudio.playedSources).toHaveLength(0);
        expect(fakeSpeechSynthesis.speak).not.toHaveBeenCalled();
        expect(voiceEngine.getIsSpeaking()).toBe(false);
    });

    it("un second `speak` pendant la génération du premier : SEULE la seconde réponse joue — jamais deux voix superposées", async () => {
        let resolveA: (v: string) => void = () => {};
        gateway.generateSpeech.mockImplementationOnce(() => new Promise<string>((r) => { resolveA = r; }));
        const pA = voiceEngine.speak('Première réponse dépassée.');
        await Promise.resolve();

        gateway.generateSpeech.mockImplementationOnce(async () => 'U0VDT05ERQ==');
        const pB = voiceEngine.speak('Seconde réponse actuelle.');

        await vi.waitFor(() => { expect(FakeAudio.instances).toHaveLength(1); });
        resolveA('UFJFTUlFUkU='); // la première se termine après coup : ignorée
        await pA;

        FakeAudio.instances[0].onended?.();
        await pB;

        expect(FakeAudio.playedSources).toHaveLength(1);
        expect(FakeAudio.playedSources[0]).toContain('U0VDT05ERQ==');
    });

    it('barge-in pendant la lecture : arrêt net, le segment suivant déjà généré ne part JAMAIS', async () => {
        gateway.generateSpeech.mockImplementation(async (t: string) => (t.includes('Première') ? 'QkxPQzE=' : 'QkxPQzI='));
        const p = voiceEngine.speak('Première phrase du monologue. Deuxième phrase qui ne doit jamais partir après l\'interruption.');

        await vi.waitFor(() => { expect(FakeAudio.instances).toHaveLength(1); });
        voiceEngine.stopSpeaking(); // la personne reprend la parole
        await p;

        expect(FakeAudio.instances).toHaveLength(1);
        expect(FakeAudio.playedSources).toHaveLength(1);
        expect(voiceEngine.getIsSpeaking()).toBe(false);
    });
});

describe('enchaînement — une seule intention vocale continue', () => {
    it('deux segments joués dans l\'ordre, le second généré PENDANT la lecture du premier, fin propre', async () => {
        gateway.generateSpeech.mockImplementation(async (t: string) => (t.startsWith('Bonjour') ? 'QkxPQzE=' : 'QkxPQzI='));
        const p = voiceEngine.speak('Bonjour, je suis là pour vous. Nous allons avancer ensemble, une étape à la fois.');

        await vi.waitFor(() => { expect(FakeAudio.instances).toHaveLength(1); });
        // Le second bloc est déjà en génération pendant la lecture du premier.
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(2);

        FakeAudio.instances[0].onended?.();
        await vi.waitFor(() => { expect(FakeAudio.instances).toHaveLength(2); }, { timeout: 2000 });
        FakeAudio.instances[1].onended?.();
        await p;

        expect(FakeAudio.playedSources[0]).toContain('QkxPQzE=');
        expect(FakeAudio.playedSources[1]).toContain('QkxPQzI=');
        expect(voiceEngine.getIsSpeaking()).toBe(false);
    });
});
