import { generateSpeechDetailed, transcribeSpeechDetailed } from '../aiGateway';
import { languageCodeFromTag } from '../messaging/speechLanguage';
import { PcmSegmenter, blobToWav16kMono, bytesToBase64, encodeWav16kMono, readBlobBytes } from './pcmSegmenter';

/**
 * Interprète d'appel — les briques qui touchent au matériel :
 *
 * - `ServerCaptioner` (VF-4, chemin PRINCIPAL) : ma voix, découpée en segments
 *   par `PcmSegmenter`, est transcrite — et traduite dans la langue du
 *   correspondant — par la passerelle IA (services/aiGateway.ts,
 *   transcribeSpeechDetailed). Indépendant de la reconnaissance vocale du
 *   navigateur, absente ou muette sur la plupart des téléphones : c'était la
 *   cause réelle de « la traduction ne fonctionne pas » (audit VF-0 : zéro
 *   appel STT jamais journalisé).
 *
 * - `CallCaptioner` (repli) : reconnaissance vocale du navigateur (Web Speech
 *   API) sur MA voix, dans MA langue. Instance DÉDIÉE — jamais le singleton
 *   `voiceEngine` de l'Architecte : un appel entre deux personnes ne doit ni
 *   réveiller l'assistant ni hériter de ses états (barge-in, verrous de
 *   voix, propriété de session). Les segments finaux partent vers
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

// ── Transcription serveur (VF-4) ────────────────────────────────────────────

export interface ServerCaption {
    text: string;
    /** Langue de `text` : détectée par le serveur (code catalogue), sinon l'indication donnée, sinon chaîne vide. */
    language: string;
    /** Traduction faite dans la même réponse, dans `targetLang` — null si non demandée, même langue, ou fournisseur sans traduction. */
    translated: string | null;
    targetLang: string | null;
}

export interface ServerCaptionerOptions {
    /** Piste micro locale (LiveKit) — relue à intervalle tant qu'elle n'est pas publiée, et après un changement de micro. */
    getTrack: () => MediaStreamTrack | null;
    /** Ma langue effective (indication pour le serveur ; absente = détection seule). */
    languageHint?: string;
    /** Langue du correspondant quand elle diffère de la mienne : la traduction arrive avec la transcription. */
    targetLanguage?: string;
    /** État local honnête (« Transcription… » pendant l'aller-retour, '' ensuite) — jamais un texte partiel inventé. */
    onInterim?: (text: string) => void;
    onFinal: (caption: ServerCaption) => void;
    /** Panne définitive (micro absent, 3 échecs serveur d'affilée) — l'appelant bascule sur un repli, ou le dit à l'écran. */
    onUnavailable?: (reason: string) => void;
    /** Vrai pendant que l'interprète parle dans mon haut-parleur : ce que mon micro capte alors n'est pas ma voix. */
    isPaused?: () => boolean;
}

/** Délai maximal d'attente de la publication du micro (elle suit la connexion de peu). */
const TRACK_WAIT_MS = 12_000;
const TRACK_POLL_MS = 250;
/** Au-delà, la passerelle est considérée indisponible pour cet appel. */
const MAX_CONSECUTIVE_FAILURES = 3;

export class ServerCaptioner {
    static isSupported(): boolean {
        return PcmSegmenter.isSupported();
    }

    private segmenter: PcmSegmenter | null = null;
    private active = false;
    private inFlight = false;
    /** Segment en attente pendant qu'un autre est en vol — le plus récent seulement, pour garder la latence basse. */
    private queued: { audioBase64: string } | null = null;
    private consecutiveFailures = 0;
    private trackTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly options: ServerCaptionerOptions) {}

    start(): boolean {
        if (!ServerCaptioner.isSupported()) {
            this.options.onUnavailable?.('Capture audio non disponible sur ce navigateur.');
            return false;
        }
        if (this.active) return true;
        this.active = true;
        this.consecutiveFailures = 0;
        this.waitForTrack(Date.now());
        return true;
    }

    /** Arrêt net : plus aucun rappel après cet appel, même pour une requête encore en vol. */
    stop(): void {
        this.active = false;
        if (this.trackTimer) { clearTimeout(this.trackTimer); this.trackTimer = null; }
        const segmenter = this.segmenter;
        this.segmenter = null;
        segmenter?.stop();
        this.queued = null;
    }

    private fail(reason: string): void {
        this.stop();
        this.options.onUnavailable?.(reason);
    }

    private waitForTrack(startedAt: number): void {
        if (!this.active) return;
        const track = this.options.getTrack();
        if (track && track.readyState === 'live') { void this.attach(track); return; }
        if (Date.now() - startedAt >= TRACK_WAIT_MS) { this.fail('Micro indisponible pour la transcription.'); return; }
        this.trackTimer = setTimeout(() => { this.trackTimer = null; this.waitForTrack(startedAt); }, TRACK_POLL_MS);
    }

    private async attach(track: MediaStreamTrack): Promise<void> {
        const segmenter = new PcmSegmenter({
            track,
            isPaused: this.options.isPaused,
            onSegment: (pcm) => this.enqueue(pcm),
            onError: () => {
                // Piste terminée (changement de micro, reprise LiveKit) : on
                // se rattache à la nouvelle publication au lieu de se taire.
                if (this.segmenter !== segmenter) return;
                segmenter.stop();
                this.segmenter = null;
                if (this.active) this.waitForTrack(Date.now());
            },
        });
        this.segmenter = segmenter;
        try {
            await segmenter.start();
        } catch (err) {
            if (this.segmenter !== segmenter) return;
            this.segmenter = null;
            this.fail(err instanceof Error ? err.message : 'Capture audio impossible.');
        }
    }

    private enqueue(pcm: Int16Array): void {
        if (!this.active) return;
        if (this.options.isPaused?.()) return; // capté pendant que l'interprète parlait : pas ma voix
        const audioBase64 = bytesToBase64(encodeWav16kMono(pcm));
        if (this.inFlight) { this.queued = { audioBase64 }; return; } // le plus récent gagne, l'ancien est abandonné
        void this.transcribe(audioBase64);
    }

    private async transcribe(audioBase64: string): Promise<void> {
        this.inFlight = true;
        this.options.onInterim?.('Transcription…');
        try {
            const result = await transcribeSpeechDetailed({
                audioBase64,
                mimeType: 'audio/wav',
                languageHint: this.options.languageHint,
                targetLanguage: this.options.targetLanguage,
            });
            this.consecutiveFailures = 0;
            if (!this.active) return;
            const text = result.text.trim();
            if (!text) return; // silence ou bruit : rien à afficher, rien à inventer
            const detected = languageCodeFromTag(result.language);
            const translated = result.translated?.trim() || null;
            this.options.onFinal({
                text,
                language: detected ?? this.options.languageHint ?? '',
                translated,
                targetLang: translated ? (result.targetLanguage ?? this.options.targetLanguage ?? null) : null,
            });
        } catch (err) {
            if (!this.active) return;
            this.consecutiveFailures += 1;
            if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                const detail = err instanceof Error ? err.message : String(err);
                this.fail(`Transcription serveur indisponible (${detail}).`);
            }
        } finally {
            this.inFlight = false;
            if (this.active) this.options.onInterim?.('');
            const next = this.queued;
            this.queued = null;
            if (next && this.active) void this.transcribe(next.audioBase64);
        }
    }
}

/** Au-delà (≈ 7 min de WAV 16 kHz), le corps de requête dépasserait la limite serveur (20 Mo en base64). */
const MAX_VOICE_WAV_BYTES = 14 * 1024 * 1024;

export interface VoiceRecordingTranscription {
    text: string;
    /** Langue DÉTECTÉE (code catalogue) si le fournisseur la rapporte, sinon l'indication donnée. */
    language: string | undefined;
}

/**
 * VF-4 — transcription serveur d'un VOCAL enregistré (MediaRecorder), quand
 * la reconnaissance du navigateur est absente ou n'a rien produit. Le blob
 * est décodé, mélangé en mono, rééchantillonné à 16 kHz et envoyé en WAV —
 * même chemin que l'appel. Si le navigateur ne sait pas décoder son propre
 * conteneur, l'audio brut part tel quel avec son type MIME (les fournisseurs
 * acceptent ogg/aac/mp3…). Rejette avec un message clair sinon ; le vocal,
 * lui, n'est jamais bloqué par cette étape (voir MoocChatFloating).
 */
export async function transcribeVoiceRecording(blob: Blob, languageHint?: string): Promise<VoiceRecordingTranscription> {
    let audioBase64: string;
    let mimeType: string;
    try {
        const { wav } = await blobToWav16kMono(blob);
        if (wav.length > MAX_VOICE_WAV_BYTES) throw new Error('Vocal trop long pour la transcription.');
        audioBase64 = bytesToBase64(wav);
        mimeType = 'audio/wav';
    } catch (err) {
        if (err instanceof Error && /trop long/.test(err.message)) throw err;
        // Décodage impossible dans ce navigateur : audio brut, type réel.
        const raw = new Uint8Array(await readBlobBytes(blob));
        if (raw.length === 0) throw new Error('Enregistrement vide.');
        if (raw.length > MAX_VOICE_WAV_BYTES) throw new Error('Vocal trop long pour la transcription.');
        audioBase64 = bytesToBase64(raw);
        mimeType = (blob.type || 'audio/webm').split(';')[0].trim();
    }
    const result = await transcribeSpeechDetailed({ audioBase64, mimeType, languageHint });
    return { text: result.text.trim(), language: languageCodeFromTag(result.language) ?? languageHint };
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
