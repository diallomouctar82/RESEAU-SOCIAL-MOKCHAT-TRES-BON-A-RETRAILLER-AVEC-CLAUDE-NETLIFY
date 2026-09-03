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
    /** Panne DÉFINITIVE (micro absent, capture impossible) — l'appelant bascule sur un repli, ou le dit à l'écran. */
    onUnavailable?: (reason: string) => void;
    /**
     * Mission VT : la passerelle échoue plusieurs fois d'affilée (réseau lent,
     * fournisseur en panne) — la transcription se met en pause `retryInMs`
     * puis RÉESSAIE d'elle-même, au lieu de mourir pour tout l'appel comme
     * avant (3 échecs = sous-titres perdus jusqu'au raccroché).
     */
    onDegraded?: (reason: string, retryInMs: number) => void;
    /** Un succès après une période dégradée. */
    onRecovered?: () => void;
    /** Vrai pendant que l'interprète parle dans mon haut-parleur : ce que mon micro capte alors n'est pas ma voix. */
    isPaused?: () => boolean;
}

/** Délai maximal d'attente de la publication du micro (elle suit la connexion de peu). */
const TRACK_WAIT_MS = 12_000;
const TRACK_POLL_MS = 250;
/** Au-delà, la passerelle est mise en pause (puis réessayée) pour cet appel. */
const MAX_CONSECUTIVE_FAILURES = 3;
/** Mission VT : pauses successives après 3 échecs d'affilée, puis nouvel essai — jamais un abandon définitif. */
export const STT_COOLDOWNS_MS = [8_000, 16_000, 30_000];
/**
 * Mission VT : budget de temps d'UNE transcription. Mesuré en production :
 * p50 1,4 s, p90 1,8 s — mais des requêtes de 30 s ont été vues en panne, et
 * une phrase qui arrive 30 s plus tard est périmée pour une conversation.
 * Au-delà, la requête compte comme un échec et la file continue.
 */
export const STT_REQUEST_TIMEOUT_MS = 8_000;
/**
 * Mission VT : segments en attente pendant qu'un autre est en vol — file
 * FIFO bornée (l'ancienne règle « le plus récent gagne » ne gardait qu'UN
 * segment : sur un serveur lent, des phrases entières disparaissaient).
 * Quand la file est pleine, le plus ancien cède la place : la conversation
 * reste actuelle, et la perte se limite au cas d'un serveur vraiment à
 * l'arrêt.
 */
export const MAX_QUEUED_SEGMENTS = 3;

export class ServerCaptioner {
    static isSupported(): boolean {
        return PcmSegmenter.isSupported();
    }

    private segmenter: PcmSegmenter | null = null;
    private active = false;
    private inFlight = false;
    /** Segments (WAV base64) en attente pendant qu'un autre est en vol — dans l'ordre de parole. */
    private queue: string[] = [];
    private consecutiveFailures = 0;
    /** Pause après une série d'échecs : les segments captés avant cet instant sont abandonnés, puis on réessaie. */
    private cooldownUntil = 0;
    private cooldownStep = 0;
    private degraded = false;
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
        this.queue = [];
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
        if (Date.now() < this.cooldownUntil) return; // passerelle en pause après une série d'échecs : on réessaie après
        const audioBase64 = bytesToBase64(encodeWav16kMono(pcm));
        if (this.inFlight) {
            if (this.queue.length >= MAX_QUEUED_SEGMENTS) this.queue.shift(); // file pleine : le plus ancien cède la place
            this.queue.push(audioBase64);
            return;
        }
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
                timeoutMs: STT_REQUEST_TIMEOUT_MS,
            });
            this.consecutiveFailures = 0;
            this.cooldownStep = 0;
            if (!this.active) return;
            if (this.degraded) { this.degraded = false; this.options.onRecovered?.(); }
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
                // Mission VT : pause puis nouvel essai (8 s, 16 s, 30 s…) — les
                // sous-titres reviennent d'eux-mêmes dès que la passerelle répond.
                const retryInMs = STT_COOLDOWNS_MS[Math.min(this.cooldownStep, STT_COOLDOWNS_MS.length - 1)];
                this.cooldownStep += 1;
                this.consecutiveFailures = 0;
                this.cooldownUntil = Date.now() + retryInMs;
                this.queue = [];
                this.degraded = true;
                const detail = err instanceof Error ? err.message : String(err);
                this.options.onDegraded?.(`Transcription serveur en difficulté (${detail})`, retryInMs);
            }
        } finally {
            this.inFlight = false;
            if (this.active) this.options.onInterim?.('');
            const next = this.queue.shift();
            if (next !== undefined && this.active) void this.transcribe(next);
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

/**
 * Mission VT : budget de la voix HD par phrase (mesuré en production : p50
 * 3,2 s, p90 7,5 s, jusqu'à 13,7 s, parfois « réponse sans audio »). Au-delà,
 * la voix du navigateur prend le relais — un silence qui s'allonge pendant
 * que l'autre parle est pire qu'une voix moins belle.
 */
export const HD_VOICE_BUDGET_MS = 6_000;
/**
 * Mission VT : nombre de phrases encore en attente à partir duquel la voix du
 * navigateur (immédiate) est préférée à la voix HD — l'interprète ne doit
 * jamais prendre plusieurs phrases de retard sur la conversation.
 */
export const VOICE_BACKLOG_THRESHOLD = 2;
/** Chien de garde d'une lecture HD : un élément audio qui ne finit jamais ne doit pas bloquer la file. */
const HD_PLAYBACK_WATCHDOG_MS = 30_000;

export class InterpreterVoice {
    private queue: string[] = [];
    private running = false;
    private stopped = false;
    /**
     * Mission VT : « l'interprète parle » = de l'audio SORT réellement du
     * haut-parleur (lecture HD lancée, ou voix du navigateur lancée) — plus
     * dès qu'une phrase entre dans la file. Avant, l'état passait à « parle »
     * pendant toute la GÉNÉRATION de la voix HD (jusqu'à 6 s par phrase) :
     * le micro d'appel, mis en pause tant que « l'interprète parle », jetait
     * ma propre voix pendant ce temps — des phrases entières perdues.
     */
    private speaking = false;
    /**
     * Mission VT : jeton d'époque — chaque stop() l'incrémente. Une file
     * arrêtée pendant qu'une phrase était en vol se termine en silence, sans
     * jamais reprendre ni redire « fin de parole » ; un speak() qui suit
     * aussitôt démarre une file NEUVE, seule à parler (même patron que
     * `speakEpoch` du moteur vocal de l'Architecte).
     */
    private epoch = 0;
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
        this.epoch += 1;
        this.queue = [];
        if (this.currentAudio) { try { this.currentAudio.pause(); } catch { /* déjà arrêté */ } this.currentAudio = null; }
        if (this.currentUtterance && typeof window !== 'undefined' && window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch { /* rien à annuler */ }
            this.currentUtterance = null;
        }
        this.running = false;
        this.setSpeaking(false);
    }

    private setSpeaking(value: boolean): void {
        if (this.speaking === value) return;
        this.speaking = value;
        this.options.onSpeakingChange?.(value);
    }

    private async drain(): Promise<void> {
        const epoch = this.epoch;
        this.running = true;
        while (!this.stopped && epoch === this.epoch && this.queue.length > 0) {
            const phrase = this.queue.shift()!;
            // En retard de plusieurs phrases : voix immédiate du navigateur plutôt qu'une voix HD qui creuse l'écart.
            const behind = this.queue.length >= VOICE_BACKLOG_THRESHOLD;
            const spokenHd = behind ? false : await this.speakHd(phrase, epoch);
            if (this.stopped || epoch !== this.epoch) break;
            if (!spokenHd) await this.speakBrowser(phrase, epoch);
        }
        // Arrêtée en vol : stop() a déjà tout signalé (et une file neuve parle peut-être déjà) — rien à redire.
        if (epoch !== this.epoch) return;
        this.running = false;
        this.setSpeaking(false);
    }

    private async speakHd(phrase: string, epoch: number): Promise<boolean> {
        let budgetTimer: ReturnType<typeof setTimeout> | undefined;
        try {
            // Budget local ET budget transmis à la passerelle : la phrase ne
            // reste jamais en attente au-delà de HD_VOICE_BUDGET_MS.
            const detail = await Promise.race([
                generateSpeechDetailed(phrase, { timeoutMs: HD_VOICE_BUDGET_MS }),
                new Promise<null>((resolve) => { budgetTimer = setTimeout(() => resolve(null), HD_VOICE_BUDGET_MS); }),
            ]);
            if (this.stopped || epoch !== this.epoch || !detail?.audioBase64) return false;
            return await new Promise<boolean>((resolve) => {
                const audio = new Audio(`data:${detail.mimeType || 'audio/mpeg'};base64,${detail.audioBase64}`);
                this.currentAudio = audio;
                let settled = false;
                const settle = (value: boolean) => { if (settled) return; settled = true; if (this.currentAudio === audio) this.currentAudio = null; this.setSpeaking(false); resolve(value); };
                audio.onended = () => settle(true);
                audio.onerror = () => settle(false);
                this.setSpeaking(true); // de l'audio sort maintenant — pas avant
                const play = audio.play();
                if (play && typeof play.catch === 'function') play.catch(() => settle(false));
                setTimeout(() => settle(true), HD_PLAYBACK_WATCHDOG_MS);
            });
        } catch {
            return false; // fournisseur indisponible ou budget dépassé : repli navigateur, jamais un silence inexpliqué.
        } finally {
            if (budgetTimer) clearTimeout(budgetTimer);
        }
    }

    private speakBrowser(phrase: string, epoch: number): Promise<void> {
        return new Promise((resolve) => {
            if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined' || epoch !== this.epoch) { resolve(); return; }
            const utterance = new SpeechSynthesisUtterance(phrase);
            utterance.lang = this.options.lang;
            const voice = pickSynthesisVoice(window.speechSynthesis.getVoices() || [], this.options.lang);
            if (voice) utterance.voice = voice;
            utterance.rate = 1.02;
            const done = () => { if (this.currentUtterance === utterance) { this.currentUtterance = null; this.setSpeaking(false); } resolve(); };
            utterance.onend = done;
            utterance.onerror = done;
            this.currentUtterance = utterance;
            this.setSpeaking(true); // la voix du navigateur démarre aussitôt
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
