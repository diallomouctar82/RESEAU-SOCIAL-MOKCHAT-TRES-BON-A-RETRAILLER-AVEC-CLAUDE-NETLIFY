import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * LIVE PLANÉTAIRE — le producteur.
 *
 * Ce qu'on prouve ici, c'est l'ÉCONOMIE de l'architecture, pas seulement
 * qu'elle marche : une transcription par intervenant quel que soit le nombre
 * de langues, une piste par langue quel que soit le nombre d'auditeurs, et
 * aucune traduction vers une langue déjà parlée.
 *
 * Les briques matérielles (micro, synthèse) sont remplacées par des doubles :
 * ce sont celles des APPELS, déjà éprouvées en production et testées ailleurs.
 */

// ── Doubles ───────────────────────────────────────────────────────────────

type CaptionHandler = (caption: { text: string; language: string; translated: string | null; targetLang: string | null }) => void;

const captionerSpies = { started: 0, stopped: 0 };
let emitCaption: CaptionHandler = () => {};
let lastTargetLanguage: (() => string | undefined) | undefined;

class FakeVoiceTrack {
    static instances: FakeVoiceTrack[] = [];
    spoken: Array<{ id: string; text: string }> = [];
    disposed = false;
    constructor(public readonly options: { lang: string }) { FakeVoiceTrack.instances.push(this); }
    start() { return { kind: 'audio' } as unknown as MediaStreamTrack; }
    speak(id: string, text: string) { this.spoken.push({ id, text }); }
    dispose() { this.disposed = true; }
}

vi.mock('../services/calls/callInterpreter', () => ({
    ServerCaptioner: class {
        static isSupported() { return true; }
        constructor(options: { onFinal: CaptionHandler; targetLanguage?: () => string | undefined }) {
            emitCaption = options.onFinal;
            lastTargetLanguage = options.targetLanguage;
        }
        start() { captionerSpies.started += 1; return true; }
        stop() { captionerSpies.stopped += 1; }
    },
    InterpreterVoiceTrack: class {
        static isSupported() { return true; }
        private inner: FakeVoiceTrack;
        constructor(options: { lang: string }) { this.inner = new FakeVoiceTrack(options); }
        start() { return this.inner.start(); }
        speak(id: string, text: string) { this.inner.speak(id, text); }
        dispose() { this.inner.dispose(); }
    },
}));

const translateSpy = vi.fn(async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => ({
    originalText: text,
    translatedText: `[${targetLanguage}] ${text}`,
    targetLanguage,
    targetLanguageLabel: targetLanguage,
    status: 'translated' as const,
    engineId: 'double',
}));

vi.mock('../services/translation/translationService', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/translation/translationService')>();
    return { ...real, translationService: { translateText: (r: { text: string; targetLanguage: string }) => translateSpy(r) } };
});

import { LiveInterpreterProducer } from '../services/live/liveInterpreterProducer';

// ── Harnais ───────────────────────────────────────────────────────────────

function harness(options?: { requested?: Map<string, number>; myLanguageHint?: string; max?: number }) {
    const published: string[] = [];
    const unpublished: string[] = [];
    const stages: Array<{ id: string; stage: string; language?: string }> = [];
    let requested = options?.requested ?? new Map<string, number>();
    const producer = new LiveInterpreterProducer({
        getLocalAudioTrack: () => ({ readyState: 'live' } as unknown as MediaStreamTrack),
        myLanguageHint: options?.myLanguageHint,
        getRequestedLanguages: () => requested,
        publishTrack: async (_t, name) => { published.push(name); },
        unpublishTrack: async (name) => { unpublished.push(name); },
        onStage: (s) => stages.push({ id: s.id, stage: s.stage, language: s.language }),
        maxLanguages: options?.max,
    });
    return {
        producer, published, unpublished, stages,
        setRequested: (next: Map<string, number>) => { requested = next; },
    };
}

/** Vide la file de micro-tâches : les voix sont produites en parallèle, chacune avec ses propres `await`. */
async function flush(): Promise<void> {
    for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
}

/** Une phrase captée, telle que la transcription serveur la rend. */
const caption = (text: string, language: string, translated: string | null = null, targetLang: string | null = null) =>
    ({ text, language, translated, targetLang });

beforeEach(() => {
    captionerSpies.started = 0;
    captionerSpies.stopped = 0;
    FakeVoiceTrack.instances = [];
    translateSpy.mockClear();
});

// ── Les preuves ───────────────────────────────────────────────────────────

describe('mutualisation : le nombre d’auditeurs ne change RIEN au coût', () => {
    it('4 000 anglophones = 1 piste publiée, 1 transcription, 1 voix', async () => {
        const h = harness({ requested: new Map([['en', 4000]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        emitCaption(caption('Bonjour à tous.', 'fr'));
        await flush();

        expect(h.published, 'une seule piste pour toute la foule').toEqual(['interpreter:en']);
        expect(captionerSpies.started, 'une seule transcription').toBe(1);
        expect(FakeVoiceTrack.instances).toHaveLength(1);
        expect(FakeVoiceTrack.instances[0].spoken).toHaveLength(1);
    });

    it('3 langues = 1 SEULE transcription, mais 3 pistes et 3 voix', async () => {
        const h = harness({ requested: new Map([['en', 5], ['es', 3], ['ar', 2]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        emitCaption(caption('Bonjour à tous.', 'fr'));
        await flush();

        expect(captionerSpies.started, 'la voix n’est transcrite qu’une fois').toBe(1);
        expect(h.published.sort()).toEqual(['interpreter:ar', 'interpreter:en', 'interpreter:es']);
        expect(FakeVoiceTrack.instances).toHaveLength(3);
        for (const voice of FakeVoiceTrack.instances) expect(voice.spoken).toHaveLength(1);
    });

    it('la langue la plus demandée voyage GRATUITEMENT avec la transcription', async () => {
        const h = harness({ requested: new Map([['en', 40], ['es', 2]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        // La passerelle rend texte + traduction anglaise dans la même réponse.
        expect(lastTargetLanguage?.(), 'on demande la plus demandée à la transcription').toBe('en');
        emitCaption(caption('Bonjour.', 'fr', 'Hello.', 'en'));
        await flush();

        expect(translateSpy, 'une seule traduction payée sur les deux langues').toHaveBeenCalledTimes(1);
        expect(translateSpy.mock.calls[0][0].targetLanguage).toBe('es');
        const anglaise = FakeVoiceTrack.instances.find((v) => v.options.lang.startsWith('en'));
        expect(anglaise?.spoken[0].text, 'la traduction offerte est utilisée telle quelle').toBe('Hello.');
    });
});

describe('ne rien produire d’inutile', () => {
    it('jamais vers la langue que je parle', async () => {
        const h = harness({ requested: new Map([['fr', 10], ['en', 2]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        expect(h.published, 'les francophones entendent déjà l’original').toEqual(['interpreter:en']);
        expect(h.producer.currentPlan.alreadySpoken).toEqual(['fr']);
    });

    it('la langue DÉTECTÉE corrige la langue déclarée, et le plan suit', async () => {
        // Je me suis déclaré francophone mais je parle anglais : produire vers
        // l'anglais n'aurait aucun sens, et le français en a un maintenant.
        const h = harness({ requested: new Map([['en', 5], ['fr', 5]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        expect(h.published).toEqual(['interpreter:en']);

        emitCaption(caption('Hello everyone.', 'en'));
        await flush();

        expect(h.producer.detectedLanguage).toBe('en');
        expect(h.published, 'la piste devenue utile est publiée').toContain('interpreter:fr');
        expect(h.unpublished, 'la piste devenue inutile est retirée').toContain('interpreter:en');
    });

    it('personne ne demande rien : aucune piste, aucune dépense', async () => {
        const h = harness({ requested: new Map(), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        emitCaption(caption('Bonjour.', 'fr'));
        await flush();
        expect(h.published).toEqual([]);
        expect(translateSpy).not.toHaveBeenCalled();
        expect(FakeVoiceTrack.instances).toHaveLength(0);
    });
});

describe('la salle bouge pendant le direct', () => {
    it('une langue qui entre est publiée, une langue qui sort est retirée ET libérée', async () => {
        const h = harness({ requested: new Map([['en', 1]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        expect(h.published).toEqual(['interpreter:en']);

        h.setRequested(new Map([['es', 1]]));
        await h.producer.refresh();

        expect(h.published).toEqual(['interpreter:en', 'interpreter:es']);
        expect(h.unpublished).toEqual(['interpreter:en']);
        const anglaise = FakeVoiceTrack.instances.find((v) => v.options.lang.startsWith('en'));
        expect(anglaise?.disposed, 'aucun contexte audio laissé derrière').toBe(true);
    });

    it('DÉFAUT RÉEL CORRIGÉ : deux rafraîchissements simultanés ne publient jamais deux fois la même piste', async () => {
        // Dans un direct, les rafraîchissements arrivent en rafale (plusieurs
        // personnes rejoignent ou changent de langue dans la même seconde).
        // Sans file d'attente, les deux lisent « la piste manque » avant que
        // l'un des deux ne l'ait enregistrée : `interpreter:en` était publiée
        // DEUX FOIS et un contexte audio restait orphelin.
        const h = harness({ requested: new Map([['en', 3], ['es', 2]]), myLanguageHint: 'fr' });
        h.producer.start();
        await Promise.all([h.producer.refresh(), h.producer.refresh(), h.producer.refresh()]);

        expect(h.published.sort(), 'une piste par langue, pas une par rafraîchissement')
            .toEqual(['interpreter:en', 'interpreter:es']);
        expect(FakeVoiceTrack.instances, 'aucun contexte audio en double').toHaveLength(2);
    });

    it('au-delà du plafond, les langues non servies sont NOMMÉES', async () => {
        const h = harness({
            requested: new Map([['en', 40], ['es', 30], ['ar', 20], ['de', 10], ['ja', 5]]),
            myLanguageHint: 'fr', max: 3,
        });
        h.producer.start();
        await h.producer.refresh();
        expect(h.published).toHaveLength(3);
        expect(h.producer.currentPlan.unserved, 'jamais un silence non expliqué').toEqual(['de', 'ja']);
    });

    it('quitter le direct retire TOUTES les pistes', async () => {
        const h = harness({ requested: new Map([['en', 1], ['es', 1]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        await h.producer.stop();
        expect(h.unpublished.sort()).toEqual(['interpreter:en', 'interpreter:es']);
        expect(FakeVoiceTrack.instances.every((v) => v.disposed)).toBe(true);
        expect(captionerSpies.stopped).toBe(1);
    });
});

describe('une panne ne contamine pas les autres langues', () => {
    it('une traduction qui échoue laisse les autres langues parler', async () => {
        const h = harness({ requested: new Map([['en', 5], ['es', 3]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        // L'anglais est servi gratuitement ; l'espagnol passe par le service, qui tombe.
        translateSpy.mockRejectedValueOnce(new Error('fournisseur indisponible'));
        emitCaption(caption('Bonjour.', 'fr', 'Hello.', 'en'));
        await flush();

        const anglaise = FakeVoiceTrack.instances.find((v) => v.options.lang.startsWith('en'));
        const espagnole = FakeVoiceTrack.instances.find((v) => v.options.lang.startsWith('es'));
        expect(anglaise?.spoken, 'l’anglais continue').toHaveLength(1);
        expect(espagnole?.spoken, 'l’espagnol se tait — l’auditeur garde la voix originale').toHaveLength(0);
        expect(h.stages.some((s) => s.stage === 'failed' && s.language === 'es'), 'et l’échec est dit').toBe(true);
    });
});

describe('mesures de latence', () => {
    it('chaque étape est chronométrée et rapportée', async () => {
        const h = harness({ requested: new Map([['en', 1]]), myLanguageHint: 'fr' });
        h.producer.start();
        await h.producer.refresh();
        emitCaption(caption('Bonjour.', 'fr', 'Hello.', 'en'));
        await flush();

        const etapes = h.stages.map((s) => s.stage);
        expect(etapes, 'transcription, traduction, voix — toutes mesurées').toEqual(
            expect.arrayContaining(['transcribed', 'translated', 'voiced']),
        );
    });
});
