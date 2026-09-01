import { generateSpeechDetailed } from '../aiGateway';
import { languageCodeFromTag } from '../messaging/speechLanguage';

/**
 * Interprète d'appel — les deux briques qui touchent au matériel :
 *
 * - `CallCaptioner` : reconnaissance vocale du navigateur (Web Speech API)
 *   sur MA voix, dans MA langue, pendant un appel. Instance DÉDIÉE — jamais
 *   le singleton `voiceEngine` de l'Architecte : un appel entre deux personnes
 *   ne doit ni réveiller l'assistant ni hériter de ses états (barge-in,
 *   verrous de voix, propriété de session). Les segments finaux partent vers
 *   l'interlocuteur par le canal de données LiveKit ; c'est LUI qui les
 *   traduit dans SA langue.
 *
 * - `InterpreterVoice` : voix de synthèse qui lit, dans ma langue, la
 *   traduction de ce que dit l'autre. Voix HD par l'ai-gateway (même
 *   fournisseur vocal que le reste de l'app, avec bascule automatique), repli
 *   sur la synthèse du navigateur dans la bonne langue. File sérialisée :
 *   deux phrases ne se superposent jamais.
 *
 * Aucune de ces briques ne s'exécute en « Par défaut » — voir
 * services/messaging/speechLanguage.ts (shouldCaptionMyVoice / interpretationPlan).
 */

type RecognitionLike = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
};

function getRecognitionClass(): (new () => RecognitionLike) | null {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface CallCaptionerOptions {
    /** Étiquette BCP-47 de MA langue parlée (speechTagFor). */
    lang: string;
    onInterim?: (text: string) => void;
    onFinal: (text: string) => void;
    /** Erreur définitive (micro refusé, API absente) — l'appel continue sans sous-titres. */
    onUnavailable?: (reason: string) => void;
}

export class CallCaptioner {
    static isSupported(): boolean {
        return getRecognitionClass() !== null;
    }

    private recognition: RecognitionLike | null = null;
    private active = false;
    private restartTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly options: CallCaptionerOptions) {}

    start(): boolean {
        const Cls = getRecognitionClass();
        if (!Cls) {
            this.options.onUnavailable?.('Reconnaissance vocale non disponible sur ce navigateur.');
            return false;
        }
        if (this.active) return true;
        this.active = true;
        this.spawn(Cls);
        return true;
    }

    stop(): void {
        this.active = false;
        if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }
        const r = this.recognition;
        this.recognition = null;
        if (r) {
            r.onresult = null; r.onerror = null; r.onend = null;
            try { r.abort(); } catch { /* déjà arrêté */ }
        }
    }

    /**
     * Arrêt EN DOUCEUR (fin d'un vocal) : laisse le moteur livrer ses derniers
     * résultats finaux — `abort()` les jetterait — puis se résout, au plus
     * tard après `maxWaitMs`.
     */
    finish(maxWaitMs = 1500): Promise<void> {
        this.active = false;
        if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }
        const r = this.recognition;
        if (!r) return Promise.resolve();
        return new Promise((resolve) => {
            let done = false;
            const settle = () => { if (done) return; done = true; this.recognition = null; resolve(); };
            r.onend = settle;
            r.onerror = () => settle();
            try { r.stop(); } catch { settle(); }
            setTimeout(settle, maxWaitMs);
        });
    }

    private spawn(Cls: new () => RecognitionLike): void {
        const r = new Cls();
        r.lang = this.options.lang;
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const res = event.results[i];
                const transcript: string = (res[0]?.transcript || '').trim();
                if (!transcript) continue;
                if (res.isFinal) this.options.onFinal(transcript);
                else interim += (interim ? ' ' : '') + transcript;
            }
            if (interim) this.options.onInterim?.(interim);
        };
        r.onerror = (event: any) => {
            const code = String(event?.error || '');
            // Silences et redémarrages internes ne sont pas des pannes.
            if (code === 'no-speech' || code === 'aborted' || code === 'network') return;
            if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
                this.active = false;
                this.options.onUnavailable?.(code === 'audio-capture'
                    ? 'Micro indisponible pour la reconnaissance vocale.'
                    : 'Reconnaissance vocale refusée par le navigateur.');
            }
        };
        r.onend = () => {
            if (this.recognition !== r) return;
            this.recognition = null;
            // Chrome termine une session continue au bout de quelques dizaines
            // de secondes : on relance tant que l'appel est en cours.
            if (this.active) {
                this.restartTimer = setTimeout(() => {
                    this.restartTimer = null;
                    if (this.active) this.spawn(Cls);
                }, 250);
            }
        };
        this.recognition = r;
        try { r.start(); } catch {
            // start() lève si une session est déjà ouverte : on retente au prochain cycle.
            this.recognition = null;
            if (this.active) this.restartTimer = setTimeout(() => { this.restartTimer = null; if (this.active) this.spawn(Cls); }, 600);
        }
    }
}

export interface InterpreterVoiceOptions {
    /** Étiquette BCP-47 de MA langue (speechTagFor) — pilote la voix de repli. */
    lang: string;
    onSpeakingChange?: (speaking: boolean) => void;
}

/** Choisit la meilleure voix système pour une langue (préfixe BCP-47), sans jamais en imposer une autre. */
export function pickSynthesisVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
    const prefix = lang.split(/[-_]/)[0].toLowerCase();
    const candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    if (candidates.length === 0) return null;
    return candidates.find((v) => v.lang.toLowerCase() === lang.toLowerCase() && /google|natural|neural|premium/i.test(v.name))
        || candidates.find((v) => /google|natural|neural|premium/i.test(v.name))
        || candidates.find((v) => v.lang.toLowerCase() === lang.toLowerCase())
        || candidates[0];
}

export class InterpreterVoice {
    private queue: string[] = [];
    private running = false;
    private stopped = false;
    private currentAudio: HTMLAudioElement | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;

    constructor(private readonly options: InterpreterVoiceOptions) {}

    /** Ajoute une phrase à dire ; les phrases se suivent, jamais ne se chevauchent. */
    speak(text: string): void {
        const clean = text.trim();
        if (!clean) return;
        this.stopped = false;
        this.queue.push(clean);
        if (!this.running) void this.drain();
    }

    /** Coupe net (fin d'appel, changement de langue, interprète désactivé). */
    stop(): void {
        this.stopped = true;
        this.queue = [];
        if (this.currentAudio) { try { this.currentAudio.pause(); } catch { /* déjà arrêté */ } this.currentAudio = null; }
        if (this.currentUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch { /* rien à annuler */ }
            this.currentUtterance = null;
        }
        if (this.running) { this.running = false; this.options.onSpeakingChange?.(false); }
    }

    private async drain(): Promise<void> {
        this.running = true;
        this.options.onSpeakingChange?.(true);
        while (!this.stopped && this.queue.length > 0) {
            const phrase = this.queue.shift()!;
            const spokenHd = await this.speakHd(phrase);
            if (this.stopped) break;
            if (!spokenHd) await this.speakBrowser(phrase);
        }
        this.running = false;
        this.options.onSpeakingChange?.(false);
    }

    private async speakHd(phrase: string): Promise<boolean> {
        try {
            const detail = await generateSpeechDetailed(phrase);
            if (this.stopped || !detail?.audioBase64) return false;
            return await new Promise<boolean>((resolve) => {
                const audio = new Audio(`data:${detail.mimeType || 'audio/mpeg'};base64,${detail.audioBase64}`);
                this.currentAudio = audio;
                audio.onended = () => { this.currentAudio = null; resolve(true); };
                audio.onerror = () => { this.currentAudio = null; resolve(false); };
                audio.play().catch(() => { this.currentAudio = null; resolve(false); });
            });
        } catch {
            return false; // fournisseur indisponible : repli navigateur, jamais un silence inexpliqué.
        }
    }

    private speakBrowser(phrase: string): Promise<void> {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') { resolve(); return; }
            const utterance = new SpeechSynthesisUtterance(phrase);
            utterance.lang = this.options.lang;
            const voice = pickSynthesisVoice(window.speechSynthesis.getVoices() || [], this.options.lang);
            if (voice) utterance.voice = voice;
            utterance.rate = 1.02;
            const done = () => { if (this.currentUtterance === utterance) this.currentUtterance = null; resolve(); };
            utterance.onend = done;
            utterance.onerror = done;
            this.currentUtterance = utterance;
            try { window.speechSynthesis.speak(utterance); } catch { done(); }
            // Chien de garde : une utterance perdue par le navigateur ne doit jamais bloquer la file.
            setTimeout(() => { if (this.currentUtterance === utterance) done(); }, 15000);
        });
    }
}

/** Langue (code catalogue) réellement parlée par la reconnaissance, pour l'étiquette des sous-titres. */
export function captionLanguageFromTag(tag: string): string | null {
    return languageCodeFromTag(tag) ?? null;
}
