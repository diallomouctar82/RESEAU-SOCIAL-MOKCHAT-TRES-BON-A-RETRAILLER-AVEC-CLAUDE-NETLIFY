import { describe, expect, it } from 'vitest';
import {
    decodeCallData, encodeCallData, interpretationPlan, languageCodeFromTag, remoteVolumeFor,
    shouldCaptionMyVoice, speechTagFor, splitForInterpretation, DUCKED_REMOTE_VOLUME,
} from '../services/messaging/speechLanguage';
import { pickSynthesisVoice } from '../services/calls/callInterpreter';
import { describeConnectionQuality } from '../components/chat/ChatCallModal';
import { MESSAGING_LANGUAGES } from '../services/translation/translationService';

describe('Langue parlée — « Ma langue » pilote la voix', () => {
    it('chaque langue du catalogue a une étiquette de parole', () => {
        for (const lang of MESSAGING_LANGUAGES) {
            const tag = speechTagFor(lang.code);
            expect(tag.toLowerCase().startsWith(lang.code)).toBe(true);
        }
    });

    it('« Par défaut » → langue du navigateur, jamais un fr-FR imposé', () => {
        expect(speechTagFor(null, 'ru-RU')).toBe('ru-RU');
        expect(speechTagFor(undefined, 'en-GB')).toBe('en-GB');
        expect(speechTagFor('', undefined)).toBe('fr-FR');
        expect(speechTagFor('ru', 'en-US')).toBe('ru-RU');
    });

    it('ru-RU → ru (code catalogue), inconnu → undefined', () => {
        expect(languageCodeFromTag('ru-RU')).toBe('ru');
        expect(languageCodeFromTag('pt_BR')).toBe('pt');
        expect(languageCodeFromTag('xx-YY')).toBeUndefined();
        expect(languageCodeFromTag(null)).toBeUndefined();
    });
});

describe('Plan d’interprétation', () => {
    it('« Par défaut » → inactif : aucune traduction, aucune voix', () => {
        expect(interpretationPlan({ myLanguage: null, sourceLanguage: 'ru' })).toEqual({ active: false, needsTranslation: false });
    });
    it('langue choisie ≠ source → traduire vers ma langue', () => {
        expect(interpretationPlan({ myLanguage: 'fr', sourceLanguage: 'ru' })).toEqual({ active: true, targetLanguage: 'fr', needsTranslation: true });
    });
    it('même langue → actif mais rien à traduire', () => {
        expect(interpretationPlan({ myLanguage: 'fr', sourceLanguage: 'fr' })).toEqual({ active: true, targetLanguage: 'fr', needsTranslation: false });
    });
    it('source inconnue → on traduit quand même (le moteur détecte)', () => {
        expect(interpretationPlan({ myLanguage: 'fr', sourceLanguage: null }).needsTranslation).toBe(true);
    });
});

describe('Faut-il sous-titrer ma voix pendant l’appel ?', () => {
    it('personne n’a choisi de langue → appel strictement inchangé', () => {
        expect(shouldCaptionMyVoice({ myLanguage: null, peerLanguage: null })).toBe(false);
    });
    it('l’autre a choisi une langue → je sous-titre pour lui, même en « Par défaut »', () => {
        expect(shouldCaptionMyVoice({ myLanguage: null, peerLanguage: 'ru' })).toBe(true);
    });
    it('j’ai choisi une langue → je sous-titre', () => {
        expect(shouldCaptionMyVoice({ myLanguage: 'fr', peerLanguage: null })).toBe(true);
    });
});

describe('Volume de l’original pendant l’interprétation', () => {
    it('on n’entend que sa langue : original atténué pendant que l’interprète parle', () => {
        expect(remoteVolumeFor(true, false)).toBe(DUCKED_REMOTE_VOLUME);
        expect(remoteVolumeFor(false, false)).toBe(1);
        expect(remoteVolumeFor(true, true)).toBe(0);
    });
});

describe('Canal de données — codec des sous-titres', () => {
    it('aller-retour fidèle', () => {
        const msg = { t: 'caption' as const, v: 1 as const, id: 'a1', text: 'Привет, Амина!', lang: 'ru', final: true, ts: 123 };
        expect(decodeCallData(encodeCallData(msg))).toEqual(msg);
        const hello = { t: 'hello' as const, v: 1 as const, lang: null };
        expect(decodeCallData(encodeCallData(hello))).toEqual(hello);
    });
    it('paquet inconnu ou corrompu → null, jamais une exception', () => {
        expect(decodeCallData(new TextEncoder().encode('{"t":"other","v":1}'))).toBeNull();
        expect(decodeCallData(new TextEncoder().encode('not json'))).toBeNull();
        expect(decodeCallData(new TextEncoder().encode('{"t":"caption","v":2,"id":"x","text":"y"}'))).toBeNull();
    });
});

describe('Découpage pour l’interprète', () => {
    it('phrases courtes, jamais vides', () => {
        expect(splitForInterpretation('Bonjour Ivan. Tu vas bien ?  On se voit mardi !')).toEqual(['Bonjour Ivan.', 'Tu vas bien ?', 'On se voit mardi !']);
        expect(splitForInterpretation('   ')).toEqual([]);
    });
});

describe('Voix système par langue', () => {
    const voice = (name: string, lang: string) => ({ name, lang } as SpeechSynthesisVoice);
    it('choisit une voix de la bonne langue, jamais une autre langue', () => {
        const voices = [voice('Google français', 'fr-FR'), voice('Milena', 'ru-RU'), voice('Google русский', 'ru-RU')];
        expect(pickSynthesisVoice(voices, 'ru-RU')?.name).toBe('Google русский');
        expect(pickSynthesisVoice(voices, 'de-DE')).toBeNull();
    });
});

describe('Qualité réseau — libellés honnêtes', () => {
    it('faible/perdu portent un conseil, excellent/bon non', () => {
        expect(describeConnectionQuality('poor').hint).toBeTruthy();
        expect(describeConnectionQuality('lost').hint).toBeTruthy();
        expect(describeConnectionQuality('excellent').hint).toBeUndefined();
        expect(describeConnectionQuality('unknown').label).toBe('Réseau…');
    });
});
