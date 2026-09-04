import { describe, it, expect } from 'vitest';
import { summarizeLiveLatency, describeLiveLatency } from '../services/live/liveLatency';
import type { LiveInterpreterStage } from '../services/live/liveInterpreterProducer';

/**
 * LP-5 — la latence en chiffres (§18).
 *
 * Ces tests protègent surtout contre les façons d'obtenir de BEAUX chiffres
 * qui ne veulent rien dire :
 *
 *  - compter une phrase abandonnée comme une latence de zéro (ce serait
 *    embellir précisément les moments où la chaîne va mal) ;
 *  - compter la traduction offerte par la transcription comme « une
 *    traduction en 0 ms » (ce n'est pas le traducteur qui a travaillé) ;
 *  - compter la transcription une fois par langue au lieu d'une fois par
 *    phrase (un intervenant écouté en trois langues verrait sa
 *    reconnaissance comptée trois fois) ;
 *  - afficher des zéros quand rien n'a été mesuré, ce qui se lit comme
 *    « instantané ».
 */

const etape = (s: Partial<LiveInterpreterStage> & { stage: LiveInterpreterStage['stage'] }): LiveInterpreterStage => ({
    id: 'p1', ms: 0, sinceCaptureMs: 0, ...s,
});

describe('LP-5 — mesure de latence', () => {
    it('ne dit pas « 0 ms » quand rien n’a été mesuré : elle dit qu’elle ne sait pas', () => {
        const r = summarizeLiveLatency([]);
        expect(r.voixTotale.n).toBe(0);
        expect(describeLiveLatency(r)).toContain('Aucune mesure');
    });

    it('donne la médiane ET le 90ᵉ centile — jamais une moyenne seule', () => {
        // Neuf phrases rapides et une très lente : une moyenne dirait ~1,9 s,
        // ce que personne ne vit. La médiane dit l'ordinaire, le p90 le
        // mauvais jour.
        const stages = [
            ...Array.from({ length: 9 }, (_, i) => etape({ id: `p${i}`, stage: 'voiced', sinceCaptureMs: 1000 })),
            etape({ id: 'plent', stage: 'voiced', sinceCaptureMs: 12000 }),
        ];
        const r = summarizeLiveLatency(stages);
        expect(r.voixTotale.n).toBe(10);
        expect(r.voixTotale.p50).toBe(1000);
        expect(r.voixTotale.p90).toBe(1000);
        expect(r.voixTotale.max).toBe(12000);
    });

    it('une phrase abandonnée n’a PAS une latence de zéro — elle est comptée à part', () => {
        const r = summarizeLiveLatency([
            etape({ id: 'a', stage: 'voiced', sinceCaptureMs: 2000 }),
            etape({ id: 'b', stage: 'failed', language: 'en', reason: 'voix indisponible' }),
        ]);
        expect(r.voixTotale.n, 'seule la phrase réellement dite est mesurée').toBe(1);
        expect(r.voixTotale.p50).toBe(2000);
        expect(r.abandonnees).toBe(1);
    });

    it('la traduction OFFERTE par la transcription ne compte pas comme « traduction en 0 ms »', () => {
        const r = summarizeLiveLatency([
            etape({ id: 'a', stage: 'translated', language: 'en', ms: 0 }),   // cadeau : aucun appel
            etape({ id: 'b', stage: 'translated', language: 'es', ms: 700 }), // vrai appel
        ]);
        expect(r.traduction.n, 'une seule traduction réellement payée').toBe(1);
        expect(r.traduction.p50).toBe(700);
    });

    it('la reconnaissance est comptée une fois par PHRASE, pas une fois par langue', () => {
        // Une phrase, trois langues produites : une seule étape `transcribed`
        // est émise par le producteur — ce test verrouille l'invariant côté
        // agrégation aussi.
        const r = summarizeLiveLatency([
            etape({ id: 'stt', stage: 'transcribed', sinceCaptureMs: 900 }),
            etape({ id: 'a', stage: 'translated', language: 'en', ms: 500 }),
            etape({ id: 'b', stage: 'translated', language: 'es', ms: 600 }),
            etape({ id: 'c', stage: 'translated', language: 'ar', ms: 700 }),
        ]);
        expect(r.reconnaissance.n).toBe(1);
        expect(r.langues).toEqual(['ar', 'en', 'es']);
    });

    it('les phrases LUES au lieu d’être dites sont comptées séparément des voix', () => {
        const r = summarizeLiveLatency([
            etape({ id: 'a', stage: 'voiced', language: 'en', sinceCaptureMs: 3000 }),
            etape({ id: 'b', stage: 'subtitled', language: 'en', sinceCaptureMs: 2500 }),
        ]);
        expect(r.voixTotale.n, 'un sous-titre n’est pas une voix').toBe(1);
        expect(r.sousTitrees).toBe(1);
        expect(describeLiveLatency(r)).toContain('lues au lieu');
    });

    it('la phrase lisible donne des secondes, pas des millisecondes brutes', () => {
        const r = summarizeLiveLatency([
            etape({ id: 'stt', stage: 'transcribed', sinceCaptureMs: 1200 }),
            etape({ id: 'a', stage: 'voiced', language: 'en', sinceCaptureMs: 5400 }),
        ]);
        const texte = describeLiveLatency(r);
        expect(texte).toContain('1.2 s');
        expect(texte).toContain('5.4 s');
        expect(texte).toContain('parole → voix traduite');
    });

    it('supporte le désordre et les doublons — un direct réel ne livre pas des mesures propres', () => {
        const r = summarizeLiveLatency([
            etape({ id: 'b', stage: 'voiced', sinceCaptureMs: 4000 }),
            etape({ id: 'a', stage: 'voiced', sinceCaptureMs: 1000 }),
            etape({ id: 'c', stage: 'voiced', sinceCaptureMs: 2000 }),
        ]);
        expect(r.voixTotale.p50).toBe(2000);
        expect(r.voixTotale.max).toBe(4000);
    });
});
