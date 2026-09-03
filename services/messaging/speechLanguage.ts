import { MESSAGING_LANGUAGES, normalizeLanguage } from '../translation/translationService';
import { myEffectiveLanguage } from './messageLanguage';

const CATALOGUE_CODES = new Set(MESSAGING_LANGUAGES.map((l) => l.code));

/**
 * Langue parlée — le pont entre « Ma langue » (un code ISO 639-1 du
 * catalogue MESSAGING_LANGUAGES) et les moteurs de la voix : reconnaissance
 * vocale du navigateur (attend une étiquette BCP-47 comme `ru-RU`), synthèse
 * vocale, et les sous-titres échangés pendant un appel.
 *
 * Fonctions PURES, sans DOM ni réseau — testées unitairement. Les classes qui
 * touchent au micro et au haut-parleur vivent dans services/calls/callInterpreter.ts.
 */

/** Étiquette de reconnaissance/synthèse par langue du catalogue (variante la plus répandue). */
export const SPEECH_TAGS: Record<string, string> = {
    fr: 'fr-FR', en: 'en-US', es: 'es-ES', pt: 'pt-BR', de: 'de-DE', ru: 'ru-RU',
    ar: 'ar-SA', zh: 'zh-CN', hi: 'hi-IN', bn: 'bn-BD', ur: 'ur-PK', id: 'id-ID',
    ja: 'ja-JP', ko: 'ko-KR', it: 'it-IT', tr: 'tr-TR', nl: 'nl-NL', pl: 'pl-PL',
    uk: 'uk-UA', vi: 'vi-VN', th: 'th-TH', fa: 'fa-IR', ms: 'ms-MY', ta: 'ta-IN',
    sw: 'sw-KE', ha: 'ha-NG', yo: 'yo-NG', wo: 'wo-SN',
};

/**
 * Étiquette de parole pour une langue choisie. Sans langue choisie (« Par
 * défaut »), on s'appuie sur la langue du navigateur — la meilleure
 * information réelle disponible, jamais un « fr-FR » imposé à un russophone.
 */
export function speechTagFor(language?: string | null, browserLanguage?: string): string {
    const code = myEffectiveLanguage(language);
    if (code && SPEECH_TAGS[code]) return SPEECH_TAGS[code];
    const fromBrowser = (browserLanguage || '').trim();
    if (fromBrowser) return fromBrowser;
    return 'fr-FR';
}

/** `ru-RU` → `ru` (code du catalogue uniquement), `undefined` si la langue n'est pas au catalogue — jamais une étiquette inventée. */
export function languageCodeFromTag(tag?: string | null): string | undefined {
    if (!tag) return undefined;
    const code = normalizeLanguage(tag.split(/[-_]/)[0]);
    return code && CATALOGUE_CODES.has(code) ? code : undefined;
}

export interface InterpretationPlan {
    /** Vrai dès que J'AI choisi une langue : l'interprétation me concerne. */
    active: boolean;
    /** Ma langue effective (cible), absente en « Par défaut ». */
    targetLanguage?: string;
    /** Vrai si ce qui arrive doit être traduit (langue source différente ou inconnue). */
    needsTranslation: boolean;
}

/**
 * Ce qu'il faut faire d'une parole/transcription reçue, selon MA langue et
 * la langue déclarée de la source. « Par défaut » → rien, jamais.
 */
export function interpretationPlan(params: { myLanguage?: string | null; sourceLanguage?: string | null }): InterpretationPlan {
    const target = myEffectiveLanguage(params.myLanguage);
    if (!target) return { active: false, needsTranslation: false };
    const source = myEffectiveLanguage(params.sourceLanguage);
    return { active: true, targetLanguage: target, needsTranslation: source !== target };
}

/**
 * Faut-il transcrire ma voix pendant l'appel ? Oui dès que L'UN des deux a
 * choisi une langue : mon interlocuteur a besoin de mes sous-titres même si,
 * moi, je suis « Par défaut ». Si personne n'a rien choisi, l'appel reste
 * strictement inchangé — aucune reconnaissance vocale n'est lancée.
 */
export function shouldCaptionMyVoice(params: { myLanguage?: string | null; peerLanguage?: string | null }): boolean {
    return Boolean(myEffectiveLanguage(params.myLanguage) || myEffectiveLanguage(params.peerLanguage));
}

/** Volume de l'audio distant pendant que l'interprète parle (on n'entend que sa langue). */
export const DUCKED_REMOTE_VOLUME = 0.12;
export function remoteVolumeFor(interpreterSpeaking: boolean, speakerMuted: boolean): number {
    if (speakerMuted) return 0;
    return interpreterSpeaking ? DUCKED_REMOTE_VOLUME : 1;
}

export interface OriginalVoiceVolumeInput {
    /** Ma langue (« Ma langue ») — null = « Par défaut ». */
    myLanguage?: string | null;
    /** Langue du correspondant : celle qu'il a DÉCLARÉE (hello), sinon celle DÉTECTÉE dans ses dernières paroles. */
    peerLanguage?: string | null;
    /** Voix de l'interprète activée (bouton « Voix » / « Sous-titres seuls »). */
    voiceEnabled: boolean;
    /** « Entendre aussi l'original » : l'original reste audible, atténué pendant que l'interprète parle. */
    hearOriginal: boolean;
    interpreterSpeaking: boolean;
    speakerMuted: boolean;
}

/**
 * Mission VT — règle PURE du volume de la voix ORIGINALE du correspondant.
 *
 * « J'active le français : même s'il me parle dans une autre langue, je
 * n'entends que le français. » Dès que l'interprète me concerne (j'ai une
 * langue, lui en parle une autre, la voix est activée), sa voix originale est
 * COUPÉE — pas seulement atténuée — sauf si j'ai demandé à l'entendre aussi
 * (alors atténuée pendant que l'interprète parle, comme avant). Sans
 * interprétation (même langue, « Par défaut », sous-titres seuls, langue de
 * l'autre encore inconnue), l'appel reste tel quel : original audible,
 * atténué seulement pendant qu'une voix d'interprète parle. Haut-parleur
 * coupé → 0, toujours.
 */
export function originalVoiceVolume(input: OriginalVoiceVolumeInput): number {
    if (input.speakerMuted) return 0;
    const mine = myEffectiveLanguage(input.myLanguage);
    const peer = myEffectiveLanguage(input.peerLanguage);
    const interpreting = !!mine && !!peer && peer !== mine && input.voiceEnabled;
    if (interpreting && !input.hearOriginal) return 0;
    return input.interpreterSpeaking ? DUCKED_REMOTE_VOLUME : 1;
}

/** Vrai quand la voix de l'interprète remplace celle du correspondant (mêmes conditions que `originalVoiceVolume` = 0 hors haut-parleur). */
export function isInterpreting(input: Pick<OriginalVoiceVolumeInput, 'myLanguage' | 'peerLanguage' | 'voiceEnabled'>): boolean {
    const mine = myEffectiveLanguage(input.myLanguage);
    const peer = myEffectiveLanguage(input.peerLanguage);
    return !!mine && !!peer && peer !== mine && input.voiceEnabled;
}

// ── Messages échangés sur le canal de données pendant un appel ─────────────

export interface CallCaptionMessage {
    t: 'caption';
    v: 1;
    id: string;
    text: string;
    /** Langue de `text` (déclarée par l'auteur ou DÉTECTÉE par la transcription serveur), null si inconnue. */
    lang: string | null;
    final: boolean;
    ts: number;
    /**
     * VF-4 : traduction de `text` déjà faite côté émetteur (transcription
     * serveur : texte + traduction dans la même réponse), dans la langue
     * `targetLang`. Facultatifs et tolérés absents : un pair sur une version
     * antérieure envoie/reçoit toujours des sous-titres, simplement traduits
     * chez le récepteur comme avant.
     */
    translated?: string;
    targetLang?: string;
}

/**
 * Mission AU : état RÉEL de mon micro annoncé au correspondant — 'on'
 * (publié), 'off' (coupé volontairement), 'unavailable' (permission refusée,
 * périphérique absent…). Sans lui, l'autre côté ne peut pas distinguer « il
 * se tait » de « son micro ne marche pas ».
 */
export interface CallMediaMessage {
    t: 'media';
    v: 1;
    mic: 'on' | 'off' | 'unavailable';
    reason?: string;
}

export type CallDataMessage =
    | { t: 'hello'; v: 1; lang: string | null }
    | CallCaptionMessage
    | CallMediaMessage;

const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

export function encodeCallData(message: CallDataMessage): Uint8Array {
    const json = JSON.stringify(message);
    if (encoder) return encoder.encode(json);
    return Uint8Array.from(Array.from(json).map((c) => c.charCodeAt(0) & 0xff));
}

/** Décodage tolérant : tout paquet inconnu/corrompu est ignoré (null), jamais une exception. */
export function decodeCallData(payload: Uint8Array): CallDataMessage | null {
    try {
        const json = decoder ? decoder.decode(payload) : String.fromCharCode(...Array.from(payload));
        const parsed = JSON.parse(json) as Partial<CallDataMessage> & { t?: string };
        if (!parsed || parsed.v !== 1) return null;
        if (parsed.t === 'hello') return { t: 'hello', v: 1, lang: typeof parsed.lang === 'string' ? parsed.lang : null };
        if (parsed.t === 'media') {
            const media = parsed as Partial<CallMediaMessage>;
            if (media.mic !== 'on' && media.mic !== 'off' && media.mic !== 'unavailable') return null;
            const message: CallMediaMessage = { t: 'media', v: 1, mic: media.mic };
            if (typeof media.reason === 'string' && media.reason.trim()) message.reason = media.reason.trim().slice(0, 160);
            return message;
        }
        if (parsed.t === 'caption' && typeof parsed.text === 'string' && typeof parsed.id === 'string') {
            const caption = parsed as Partial<CallCaptionMessage>;
            const message: CallCaptionMessage = {
                t: 'caption', v: 1, id: parsed.id, text: parsed.text,
                lang: typeof parsed.lang === 'string' ? parsed.lang : null,
                final: parsed.final === true,
                ts: typeof parsed.ts === 'number' ? parsed.ts : Date.now(),
            };
            // Traduction jointe : seulement si elle est réellement là ET que sa
            // langue cible est connue — une traduction sans langue ne se
            // laisse pas vérifier, on la traite comme absente.
            if (typeof caption.translated === 'string' && caption.translated.trim() && typeof caption.targetLang === 'string' && caption.targetLang.trim()) {
                message.translated = caption.translated;
                message.targetLang = caption.targetLang;
            }
            return message;
        }
        return null;
    } catch {
        return null;
    }
}

export interface ReceiverCaption {
    /** Ce que le récepteur affiche (et que l'interprète dit) — original ou traduction. */
    text: string;
    /** Vrai s'il faut encore traduire `text` (par translationService), comme avant VF-4. */
    needsTranslation: boolean;
    /** Vrai si `text` est la traduction faite chez l'émetteur, dans MA langue — zéro appel réseau. */
    translatedByPeer: boolean;
}

/**
 * VF-4 — règle PURE du récepteur : si le sous-titre arrive déjà traduit dans
 * ma langue effective (`translated` + `targetLang` = ma langue), on l'utilise
 * tel quel, sans aucun appel réseau. Sinon, comportement historique : même
 * langue → original tel quel ; langue différente ou inconnue → à traduire.
 * « Par défaut » chez moi → jamais rien à traduire (l'appelant n'affiche
 * d'ailleurs rien, voir interpretationPlan).
 */
export function captionForReceiver(
    message: Pick<CallCaptionMessage, 'text' | 'lang' | 'translated' | 'targetLang'>,
    myLanguage?: string | null,
): ReceiverCaption {
    const mine = myEffectiveLanguage(myLanguage);
    if (!mine) return { text: message.text, needsTranslation: false, translatedByPeer: false };
    const translated = typeof message.translated === 'string' ? message.translated.trim() : '';
    if (translated && myEffectiveLanguage(message.targetLang) === mine) {
        return { text: translated, needsTranslation: false, translatedByPeer: true };
    }
    if (myEffectiveLanguage(message.lang) === mine) return { text: message.text, needsTranslation: false, translatedByPeer: false };
    return { text: message.text, needsTranslation: true, translatedByPeer: false };
}

/**
 * Découpe une transcription finale en phrases courtes pour l'interprète :
 * une phrase traduite et dite tôt vaut mieux qu'un paragraphe entier plus
 * tard — c'est ce qui rend la conversation fluide. Jamais de phrase vide.
 */
export function splitForInterpretation(text: string): string[] {
    return text
        .split(/(?<=[.!?…])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
