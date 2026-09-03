import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    captionForReceiver, decodeCallData, encodeCallData, interpretationPlan, isInterpreting, languageCodeFromTag, originalVoiceVolume, remoteVolumeFor,
    shouldCaptionMyVoice, speechTagFor, splitForInterpretation, DUCKED_REMOTE_VOLUME,
} from '../services/messaging/speechLanguage';
import { pickSynthesisVoice } from '../services/calls/callInterpreter';
import { describeConnectionQuality } from '../components/chat/ChatCallModal';
import { MESSAGING_LANGUAGES } from '../services/translation/translationService';
import { transcribeSpeechDetailed } from '../services/aiGateway';

// VF-4 : la passerelle est remplacée par un espion pour vérifier la FORME de
// la requête STT et la lecture des deux formes de réponse (avec/sans json).
const gateway = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({
    supabase: { functions: { invoke: gateway.invoke } },
    supabaseService: { isConfigured: () => false },
    isSupabaseConfigured: false,
}));

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

describe('Mission VT — volume de la voix ORIGINALE du correspondant (« ma langue seulement »)', () => {
    const base = { myLanguage: 'fr', peerLanguage: 'ru', voiceEnabled: true, hearOriginal: false, interpreterSpeaking: false, speakerMuted: false };

    it('j’ai choisi ma langue, il en parle une autre, la voix est activée → original COUPÉ, qu’il parle ou non', () => {
        expect(originalVoiceVolume(base)).toBe(0);
        expect(originalVoiceVolume({ ...base, interpreterSpeaking: true })).toBe(0);
        expect(isInterpreting(base)).toBe(true);
    });

    it('« Entendre aussi l’original » → audible, atténué seulement pendant que l’interprète parle', () => {
        expect(originalVoiceVolume({ ...base, hearOriginal: true })).toBe(1);
        expect(originalVoiceVolume({ ...base, hearOriginal: true, interpreterSpeaking: true })).toBe(DUCKED_REMOTE_VOLUME);
    });

    it('hors interprétation, l’appel reste tel quel : même langue, « Par défaut », sous-titres seuls, langue de l’autre inconnue', () => {
        expect(originalVoiceVolume({ ...base, peerLanguage: 'fr' })).toBe(1);
        expect(originalVoiceVolume({ ...base, myLanguage: null })).toBe(1);
        expect(originalVoiceVolume({ ...base, voiceEnabled: false })).toBe(1);
        expect(originalVoiceVolume({ ...base, peerLanguage: null })).toBe(1);
        expect(isInterpreting({ ...base, peerLanguage: null })).toBe(false);
        expect(isInterpreting({ ...base, voiceEnabled: false })).toBe(false);
        // Une voix d'interprète qui parle (sous-titre traduit) atténue quand même l'original — jamais deux voix à plein volume.
        expect(originalVoiceVolume({ ...base, peerLanguage: null, interpreterSpeaking: true })).toBe(DUCKED_REMOTE_VOLUME);
    });

    it('haut-parleur coupé → 0, toujours', () => {
        expect(originalVoiceVolume({ ...base, speakerMuted: true, hearOriginal: true })).toBe(0);
        expect(originalVoiceVolume({ ...base, speakerMuted: true, myLanguage: null })).toBe(0);
    });

    it('étiquettes régionales acceptées (fr-FR / ru-RU) comme partout ailleurs', () => {
        expect(originalVoiceVolume({ ...base, myLanguage: 'fr-FR', peerLanguage: 'ru-RU' })).toBe(0);
        expect(originalVoiceVolume({ ...base, myLanguage: 'fr-FR', peerLanguage: 'fr-CA' })).toBe(1);
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

    it('VF-4 : la traduction jointe (translated + targetLang) fait l\'aller-retour ; sans langue cible, elle est ignorée', () => {
        const msg = { t: 'caption' as const, v: 1 as const, id: 'a2', text: 'Привет, Амина!', lang: 'ru', final: true, ts: 5, translated: 'Bonjour, Amina !', targetLang: 'fr' };
        expect(decodeCallData(encodeCallData(msg))).toEqual(msg);
        const orphan = decodeCallData(new TextEncoder().encode('{"t":"caption","v":1,"id":"a3","text":"x","lang":"ru","final":true,"ts":1,"translated":"y"}'));
        expect(orphan).toEqual({ t: 'caption', v: 1, id: 'a3', text: 'x', lang: 'ru', final: true, ts: 1 });
        const blank = decodeCallData(new TextEncoder().encode('{"t":"caption","v":1,"id":"a4","text":"x","lang":"ru","final":true,"ts":1,"translated":"  ","targetLang":"fr"}'));
        expect(blank).not.toHaveProperty('translated');
    });
});

describe('transcribeSpeechDetailed — requête voix STT et lecture des deux formes de réponse (VF-4)', () => {
    beforeEach(() => { gateway.invoke.mockReset(); });

    it('envoie une requête voix avec audio, type MIME, indication et cible (sélection automatique du fournisseur STT)', async () => {
        gateway.invoke.mockResolvedValue({ data: { providerId: 'gemini_stt', result: { text: 'Привет', json: { text: 'Привет', language: 'ru', translated: 'Bonjour', targetLanguage: 'fr' } } }, error: null });
        const result = await transcribeSpeechDetailed({ audioBase64: 'UklGRg==', mimeType: 'audio/wav', languageHint: 'ru', targetLanguage: 'fr' });
        expect(gateway.invoke).toHaveBeenCalledWith('ai-gateway', {
            body: { mode: 'call', category: 'voice', request: { audioBase64: 'UklGRg==', audioMimeType: 'audio/wav', languageHint: 'ru', targetLanguage: 'fr' } },
        });
        expect(result).toEqual({ text: 'Привет', language: 'ru', translated: 'Bonjour', targetLanguage: 'fr', providerId: 'gemini_stt' });
    });

    it('fournisseur qui ne renvoie que `text` (Deepgram) : langue inconnue, aucune traduction inventée', async () => {
        gateway.invoke.mockResolvedValue({ data: { providerId: 'deepgram', result: { text: '  Bonjour à tous  ', raw: {} } }, error: null });
        const result = await transcribeSpeechDetailed({ audioBase64: 'UklGRg==', mimeType: 'audio/wav', languageHint: 'fr' });
        expect(result).toEqual({ text: 'Bonjour à tous', language: '', translated: null, targetLanguage: null, providerId: 'deepgram' });
        expect(gateway.invoke.mock.calls[0][1].body.request).not.toHaveProperty('targetLanguage', expect.anything());
    });

    it('même langue des deux côtés : translated null ; audio sans parole : texte vide, jamais de traduction', async () => {
        gateway.invoke.mockResolvedValue({ data: { providerId: 'gemini_stt', result: { text: 'Привет', json: { text: 'Привет', language: 'ru', translated: null, targetLanguage: 'ru' } } }, error: null });
        expect((await transcribeSpeechDetailed({ audioBase64: 'x', mimeType: 'audio/wav', targetLanguage: 'ru' })).translated).toBeNull();
        gateway.invoke.mockResolvedValue({ data: { providerId: 'gemini_stt', result: { text: '', json: { text: '', language: '', translated: 'inventé', targetLanguage: 'fr' } } }, error: null });
        const silent = await transcribeSpeechDetailed({ audioBase64: 'x', mimeType: 'audio/wav', targetLanguage: 'fr' });
        expect(silent.text).toBe('');
        expect(silent.translated).toBeNull();
    });

    it('erreur de la passerelle → exception avec le vrai message serveur', async () => {
        gateway.invoke.mockResolvedValue({ data: { error: 'Aucun fournisseur actif et configuré pour cette catégorie.' }, error: null });
        await expect(transcribeSpeechDetailed({ audioBase64: 'x', mimeType: 'audio/wav' })).rejects.toThrow('Aucun fournisseur actif');
    });

    it('Mission VT : budget de temps PAR requête (timeoutMs) → erreur réseau explicite, au lieu d’une attente de 45 s ; jamais transmis au serveur', async () => {
        gateway.invoke.mockImplementation(() => new Promise(() => {}));
        await expect(transcribeSpeechDetailed({ audioBase64: 'x', mimeType: 'audio/wav', timeoutMs: 40 })).rejects.toThrow(/délai imparti \(40 ms\)/);
        expect(gateway.invoke.mock.calls[0][1].body.request).not.toHaveProperty('timeoutMs');
    });
});

describe('Règle du récepteur — sous-titre déjà traduit chez l\'émetteur (VF-4)', () => {
    const caption = { text: 'Привет, Амина!', lang: 'ru', translated: 'Bonjour, Amina !', targetLang: 'fr' };

    it('traduction dans MA langue → utilisée telle quelle, zéro appel réseau', () => {
        expect(captionForReceiver(caption, 'fr')).toEqual({ text: 'Bonjour, Amina !', needsTranslation: false, translatedByPeer: true });
        expect(captionForReceiver(caption, 'fr-FR')).toEqual({ text: 'Bonjour, Amina !', needsTranslation: false, translatedByPeer: true });
    });

    it('traduction dans une AUTRE langue que la mienne → comportement historique : à traduire', () => {
        expect(captionForReceiver(caption, 'en')).toEqual({ text: 'Привет, Амина!', needsTranslation: true, translatedByPeer: false });
    });

    it('sans traduction jointe : même langue → original tel quel ; langue différente ou inconnue → à traduire', () => {
        expect(captionForReceiver({ text: 'Bonjour', lang: 'fr' }, 'fr')).toEqual({ text: 'Bonjour', needsTranslation: false, translatedByPeer: false });
        expect(captionForReceiver({ text: 'Привет', lang: 'ru' }, 'fr').needsTranslation).toBe(true);
        expect(captionForReceiver({ text: 'Привет', lang: null }, 'fr').needsTranslation).toBe(true);
    });

    it('« Par défaut » chez moi → jamais rien à traduire, la traduction jointe n\'est pas substituée', () => {
        expect(captionForReceiver(caption, null)).toEqual({ text: 'Привет, Амина!', needsTranslation: false, translatedByPeer: false });
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
