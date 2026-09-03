import { generateSpeechDetailed, transcribeSpeechDetailed, type SpeechResult } from '../aiGateway';
import { languageCodeFromTag } from '../messaging/speechLanguage';
import { PcmSegmenter, blobToWav16kMono, bytesToBase64, encodeWav16kMono, readBlobBytes, type SegmentClose } from './pcmSegmenter';

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
    /**
     * Langue du correspondant quand elle diffère de la mienne : la traduction
     * arrive avec la transcription. Mission LT : peut être une FONCTION, lue à
     * chaque requête — la langue du correspondant arrive souvent APRÈS le
     * début de la capture (il la choisit une fois décroché) et peut changer en
     * cours d'appel ; avant, chaque changement REDÉMARRAIT la transcription et
     * jetait le segment en cours (audit LT-0 : première voix traduite 10–20 s
     * après le micro).
     */
    targetLanguage?: string | (() => string | undefined);
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
            onSegment: (pcm, _durationMs, closedBy) => this.enqueue(pcm, closedBy),
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

    private enqueue(pcm: Int16Array, closedBy?: SegmentClose): void {
        if (!this.active) return;
        // Capté pendant que l'interprète parlait : pas ma voix. Exception : un
        // segment que le découpeur clôt PARCE QUE la pause commence contient ma
        // voix d'AVANT — il est transcrit (mission VT, banc VT-1b).
        if (closedBy !== 'pause' && this.options.isPaused?.()) return;
        if (Date.now() < this.cooldownUntil) return; // passerelle en pause après une série d'échecs : on réessaie après
        const audioBase64 = bytesToBase64(encodeWav16kMono(pcm));
        if (this.inFlight) {
            if (this.queue.length >= MAX_QUEUED_SEGMENTS) this.queue.shift(); // file pleine : le plus ancien cède la place
            this.queue.push(audioBase64);
            return;
        }
        void this.transcribe(audioBase64);
    }

    /** Langue cible au moment de la requête (mission LT : lue à chaque segment, jamais figée au démarrage). */
    private currentTargetLanguage(): string | undefined {
        const target = this.options.targetLanguage;
        const value = typeof target === 'function' ? target() : target;
        return value && value.trim() ? value : undefined;
    }

    private async transcribe(audioBase64: string): Promise<void> {
        this.inFlight = true;
        this.options.onInterim?.('Transcription…');
        const targetLanguage = this.currentTargetLanguage();
        try {
            const result = await transcribeSpeechDetailed({
                audioBase64,
                mimeType: 'audio/wav',
                languageHint: this.options.languageHint,
                targetLanguage,
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
                targetLang: translated ? (result.targetLanguage ?? targetLanguage ?? null) : null,
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
    private queue: Array<{ text: string; browserOnly: boolean }> = [];
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

    /**
     * Ajoute une phrase à dire ; les phrases se suivent, jamais ne se chevauchent.
     * `browserOnly` (Mission VT) : repli quand l'ÉMETTEUR n'a pas pu rendre la
     * voix dans la piste de l'appel — la voix de l'appareil, tout de suite,
     * sans redemander une voix HD qui vient d'échouer chez lui.
     */
    speak(text: string, options?: { browserOnly?: boolean }): void {
        const clean = text.trim();
        if (!clean) return;
        this.stopped = false;
        this.queue.push({ text: clean, browserOnly: !!options?.browserOnly });
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
            const item = this.queue.shift()!;
            // En retard de plusieurs phrases : voix immédiate du navigateur plutôt qu'une voix HD qui creuse l'écart.
            const behind = this.queue.length >= VOICE_BACKLOG_THRESHOLD;
            const spokenHd = behind || item.browserOnly ? false : await this.speakHd(item.text, epoch);
            if (this.stopped || epoch !== this.epoch) break;
            if (!spokenHd) await this.speakBrowser(item.text, epoch);
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
                generateSpeechDetailed(phrase, { timeoutMs: HD_VOICE_BUDGET_MS, language: this.options.lang }),
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

// ── Mission VT : la voix de l'interprète rendue PAR L'ÉMETTEUR, dans l'appel ──
//
// Retour du test sur deux téléphones (03/09) : la voix HD était bien générée
// des deux côtés (dix synthèses réussies dans le journal de la passerelle)
// mais JAMAIS entendue — la lecture locale d'un fichier audio sur téléphone
// dépend de la politique d'autoplay, du volume « média » distinct du volume
// d'appel, et iPhone ignore le réglage de volume. Ce qui a fonctionné sur ces
// mêmes téléphones, c'est la voix de l'appel : une piste WebRTC. La voix de
// l'interprète emprunte donc ce chemin : l'ÉMETTEUR rend la voix HD (dans la
// langue de son correspondant) dans un contexte Web Audio dont la sortie est
// un MediaStreamTrack, publié dans la room comme piste `interpreter`. Le
// récepteur la joue exactement comme la voix originale, qu'il coupe.

export type InterpreterPhraseReport =
    /** `merged` (mission LT) : nombre de phrases rendues ENSEMBLE dans cette voix (absent = une seule). */
    | { id: string; status: 'generated'; generateMs: number; bytes: number; durationMs: number; merged?: number }
    | { id: string; status: 'started'; durationMs: number }
    | { id: string; status: 'ended' }
    | { id: string; status: 'failed'; reason: string };

export interface InterpreterVoiceTrackOptions {
    /** Étiquette BCP-47 de la langue du CORRESPONDANT — celle de la voix rendue (informative aujourd'hui, pilote la voix par langue demain). */
    lang: string;
    /** Du son sort réellement dans la piste (début/fin de chaque phrase). */
    onSpeakingChange?: (speaking: boolean) => void;
    /** Ce qui s'est passé pour chaque phrase — pour prévenir le correspondant et le rapport de diagnostic ; jamais le texte. */
    onPhrase?: (report: InterpreterPhraseReport) => void;
}

type AudioContextCtor = new () => AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    return w.AudioContext || w.webkitAudioContext || null;
}

/** Base64 → octets (l'inverse de bytesToBase64), sans dépasser la pile d'arguments. */
export function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
}

/** Décodage par le navigateur (WAV, MP3, OGG…) — forme à rappel ET promesse (anciens WebKit). */
function decodeAudioBytes(context: AudioContext, bytes: Uint8Array): Promise<AudioBuffer> {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Promise((resolve, reject) => {
        const maybe = context.decodeAudioData(buffer, resolve, reject);
        if (maybe && typeof (maybe as Promise<AudioBuffer>).then === 'function') (maybe as Promise<AudioBuffer>).then(resolve, reject);
    });
}

/** Attente maximale du réveil d'un contexte suspendu avant de déclarer la phrase en échec. */
const CONTEXT_RESUME_WAIT_MS = 1500;
/**
 * Budget de la voix HD rendue DANS l'appel — plus large que celui de la voix
 * locale : ici, une phrase déclarée en échec ne bascule pas sur une voix
 * immédiate chez moi, elle est renvoyée au correspondant qui la dira avec la
 * voix de son appareil (peu fiable sur téléphone). Mesuré au banc : la
 * passerelle met 4,8–7,5 s par phrase sous charge — un budget de 6 s
 * abandonnait la plupart des phrases. 12 s couvre le p90 mesuré ; la voix
 * rapide (tâche VT-2) ramènera ce délai.
 */
export const TRACK_VOICE_BUDGET_MS = 12_000;
/** Phrases en attente au maximum : au-delà, la plus ancienne est abandonnée (dite en échec) pour rester en temps réel. */
export const TRACK_QUEUE_MAX = 3;
/**
 * Mission LT : les phrases qui attendent pendant qu'une voix se rend sont
 * FUSIONNÉES en une seule synthèse (le coût d'une voix HD est surtout un
 * délai fixe de 4 à 6 s, quelle que soit la longueur). Mesuré au banc : avec
 * des segments courts et une parole continue, rendre les phrases une par une
 * faisait déborder la file — près d'une phrase sur deux abandonnée et dite
 * par la voix de secours du correspondant. Longueur maximale d'une voix
 * fusionnée, pour rester en temps réel.
 */
export const TRACK_BATCH_MAX_CHARS = 320;
/** Contextes vivants — réveillés au prochain geste utilisateur par `unlockInterpreterAudio`. */
const liveVoiceTracks = new Set<InterpreterVoiceTrack>();

export class InterpreterVoiceTrack {
    /** Web Audio avec sortie vers un MediaStream — c'est ce qui permet de publier la voix dans l'appel. */
    static isSupported(): boolean {
        const Ctx = getAudioContextCtor();
        return !!Ctx && typeof MediaStream !== 'undefined'
            && typeof (Ctx.prototype as { createMediaStreamDestination?: unknown }).createMediaStreamDestination === 'function';
    }

    private context: AudioContext | null = null;
    private destination: MediaStreamAudioDestinationNode | null = null;
    private queue: Array<{ id: string; text: string }> = [];
    private running = false;
    private epoch = 0;
    private speaking = false;
    private currentSource: AudioBufferSourceNode | null = null;
    private disposed = false;
    /** Langue de rendu courante (mission LT : modifiable en cours d'appel, la piste reste la même). */
    private lang: string;

    constructor(private readonly options: InterpreterVoiceTrackOptions) {
        this.lang = options.lang;
    }

    /** Langue (étiquette BCP-47) dans laquelle les prochaines phrases sont rendues. */
    get language(): string {
        return this.lang;
    }

    /**
     * Mission LT : le correspondant change de langue d'écoute en cours d'appel
     * — la piste déjà publiée continue, seules les prochaines phrases changent
     * de langue (avant : la langue était figée à la création de la piste).
     */
    setLanguage(lang: string): void {
        const clean = lang.trim();
        if (clean) this.lang = clean;
    }

    /** Crée (une fois) le contexte et sa sortie ; renvoie la piste à publier. */
    start(): MediaStreamTrack {
        if (this.disposed) throw new Error('Rendu de la voix déjà libéré.');
        if (!this.context || !this.destination) {
            const Ctx = getAudioContextCtor();
            if (!Ctx) throw new Error('Web Audio indisponible sur ce navigateur.');
            const context = new Ctx();
            this.context = context;
            this.destination = context.createMediaStreamDestination();
            liveVoiceTracks.add(this);
        }
        this.resume();
        const track = this.destination.stream.getAudioTracks()[0];
        if (!track) throw new Error('Aucune piste audio produite pour la voix de l’interprète.');
        return track;
    }

    get track(): MediaStreamTrack | null {
        return this.destination?.stream.getAudioTracks()[0] ?? null;
    }

    get isSpeaking(): boolean {
        return this.speaking;
    }

    /** Réveil d'un contexte suspendu (iOS : possible dans un geste utilisateur, ou dès que la page capture le micro). */
    resume(): void {
        const context = this.context;
        if (!context || context.state === 'running' || context.state === 'closed') return;
        try { void context.resume().catch(() => { /* retenté au prochain geste */ }); } catch { /* idem */ }
    }

    /** Rend une phrase (identifiant du sous-titre) dans la piste ; les phrases se suivent, jamais ne se chevauchent. */
    speak(id: string, text: string): void {
        const clean = text.trim();
        if (!clean || this.disposed) return;
        // File bornée : une conversation ne doit jamais prendre plusieurs phrases
        // de retard — la plus ancienne en attente est abandonnée, et le
        // correspondant en est prévenu (il la lit, ou la dit lui-même).
        while (this.queue.length >= TRACK_QUEUE_MAX) {
            const dropped = this.queue.shift()!;
            this.options.onPhrase?.({ id: dropped.id, status: 'failed', reason: `en retard de ${TRACK_QUEUE_MAX} phrases — abandonnée pour rester en temps réel` });
        }
        this.queue.push({ id, text: clean });
        if (!this.running) void this.drain();
    }

    /** Coupe net : file vidée, phrase en cours arrêtée, aucune voix fantôme d'une génération encore en vol. */
    stop(): void {
        this.epoch += 1;
        this.queue = [];
        const source = this.currentSource;
        this.currentSource = null;
        if (source) { try { source.stop(); } catch { /* déjà arrêtée */ } }
        this.running = false;
        this.setSpeaking(false);
    }

    /** Fin d'appel : arrête tout, libère la piste et le contexte. */
    dispose(): void {
        this.stop();
        this.disposed = true;
        liveVoiceTracks.delete(this);
        try { this.destination?.stream.getTracks().forEach((t) => t.stop()); } catch { /* rien à arrêter */ }
        const context = this.context;
        this.context = null;
        this.destination = null;
        if (context && context.state !== 'closed') { try { void context.close().catch(() => { /* déjà fermé */ }); } catch { /* idem */ } }
    }

    private setSpeaking(value: boolean): void {
        if (this.speaking === value) return;
        this.speaking = value;
        this.options.onSpeakingChange?.(value);
    }

    private async drain(): Promise<void> {
        const epoch = this.epoch;
        this.running = true;
        while (epoch === this.epoch && this.queue.length > 0) {
            await this.render(this.takeBatch(), epoch);
        }
        if (epoch !== this.epoch) return;
        this.running = false;
        this.setSpeaking(false);
    }

    /** La prochaine voix à rendre : la phrase la plus ancienne, plus celles qui la suivent tant que la longueur reste raisonnable (mission LT). */
    private takeBatch(): Array<{ id: string; text: string }> {
        const first = this.queue.shift()!;
        const batch = [first];
        let chars = first.text.length;
        while (this.queue.length > 0 && chars + 1 + this.queue[0].text.length <= TRACK_BATCH_MAX_CHARS) {
            const next = this.queue.shift()!;
            batch.push(next);
            chars += 1 + next.text.length;
        }
        return batch;
    }

    private async render(batch: Array<{ id: string; text: string }>, epoch: number): Promise<void> {
        const ids = batch.map((item) => item.id);
        const text = batch.map((item) => item.text).join(' ');
        const fail = (reason: string) => { for (const id of ids) this.options.onPhrase?.({ id, status: 'failed', reason }); };
        const t0 = Date.now();
        let budgetTimer: ReturnType<typeof setTimeout> | undefined;
        let detail: SpeechResult | null;
        try {
            // Budget de la piste (TRACK_VOICE_BUDGET_MS) : au-delà, la phrase est
            // déclarée en échec et le correspondant la dit avec sa propre voix d'appareil.
            // La langue de lecture est TRANSMISE : une voix pilotée par un modèle de
            // langage peut sinon « traduire » en parlant (mesuré au banc).
            detail = await Promise.race([
                generateSpeechDetailed(text, { timeoutMs: TRACK_VOICE_BUDGET_MS, language: this.lang }),
                new Promise<null>((resolve) => { budgetTimer = setTimeout(() => resolve(null), TRACK_VOICE_BUDGET_MS); }),
            ]);
        } catch (err) {
            if (epoch !== this.epoch) return;
            fail(err instanceof Error ? err.message : 'voix HD indisponible');
            return;
        } finally {
            if (budgetTimer) clearTimeout(budgetTimer);
        }
        if (epoch !== this.epoch) return;
        if (!detail?.audioBase64) { fail(`voix HD au-delà du budget (${Math.round(TRACK_VOICE_BUDGET_MS / 1000)} s)`); return; }
        const context = this.context;
        const destination = this.destination;
        if (!context || !destination) { fail('rendu audio non démarré'); return; }
        if (context.state !== 'running') {
            try {
                await Promise.race([context.resume(), new Promise<void>((resolve) => setTimeout(resolve, CONTEXT_RESUME_WAIT_MS))]);
            } catch { /* jugé sur l'état ci-dessous */ }
        }
        if (epoch !== this.epoch) return;
        if (context.state !== 'running') { fail('contexte audio suspendu — un toucher de l’écran le réveille'); return; }
        let buffer: AudioBuffer;
        try {
            buffer = await decodeAudioBytes(context, base64ToBytes(detail.audioBase64));
        } catch (err) {
            if (epoch !== this.epoch) return;
            fail(`audio HD illisible (${err instanceof Error ? err.message : 'décodage'})`);
            return;
        }
        if (epoch !== this.epoch) return;
        const durationMs = Math.round(buffer.duration * 1000);
        this.options.onPhrase?.({ id: ids[0], status: 'generated', generateMs: Date.now() - t0, bytes: detail.audioBase64.length, durationMs, ...(ids.length > 1 ? { merged: ids.length } : {}) });
        await new Promise<void>((resolve) => {
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(destination);
            let settled = false;
            const settle = () => {
                if (settled) return;
                settled = true;
                if (this.currentSource === source) this.currentSource = null;
                this.setSpeaking(false);
                for (const id of ids) this.options.onPhrase?.({ id, status: 'ended' });
                resolve();
            };
            source.onended = settle;
            this.currentSource = source;
            this.setSpeaking(true); // du son entre dans la piste maintenant — pas avant
            for (const id of ids) this.options.onPhrase?.({ id, status: 'started', durationMs });
            try { source.start(); } catch { settle(); return; }
            setTimeout(settle, durationMs + 2000); // chien de garde : une source qui ne finit jamais ne bloque pas la file
        });
    }
}

let speechSynthesisPrimed = false;

/**
 * Mission VT — à appeler DANS un geste utilisateur (décrocher, appeler,
 * toucher l'écran d'appel) : réveille les contextes audio de l'interprète
 * (iOS les laisse suspendus hors geste) et « amorce » la synthèse vocale du
 * navigateur, muette sur iOS tant qu'aucune phrase n'a été demandée dans un
 * geste — le repli local en dépend. Idempotent, jamais d'exception.
 */
export function unlockInterpreterAudio(): void {
    for (const track of liveVoiceTracks) track.resume();
    if (speechSynthesisPrimed || typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
    speechSynthesisPrimed = true;
    try {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
    } catch { /* synthèse absente : le repli local sera simplement muet, ce que l'écran dit */ }
}

/** Tests uniquement. */
export function __resetInterpreterAudioForTests(): void {
    speechSynthesisPrimed = false;
    liveVoiceTracks.clear();
}
