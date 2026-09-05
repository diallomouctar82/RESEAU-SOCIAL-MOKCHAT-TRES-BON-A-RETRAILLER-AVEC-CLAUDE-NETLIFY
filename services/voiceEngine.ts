// ═══════════════════════════════════════════════════════════════════════════
// 🎙️ VOICE ENGINE PRO + ELEVENLABS HD — SYNTHÈSE VOCALE HAUTE FIDÉLITÉ
// ═══════════════════════════════════════════════════════════════════════════

import { generateSpeechDetailed } from './aiGateway';
import {
    ANALYSER_FFT_SIZE,
    LIP_SYNC_LOOKAHEAD_MS,
    MOUTH_AT_REST,
    createVoiceEnvelope,
    mouthShapeFromBands,
    spectralBands,
    type MouthShape,
} from './architecte/lipSync';

export interface VoiceEngineListener {
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onSpeechVolume?: (volume: number) => void;
    /**
     * Niveau (0..1) de la voix que l'Architecte est en train de PRONONCER —
     * à ne pas confondre avec `onSpeechVolume`, qui mesure le micro de
     * l'utilisateur et se coupe précisément pendant que l'on parle.
     *
     * Mesuré sur l'élément `<audio>` du moteur ElevenLabs, seul chemin où le
     * navigateur donne accès au signal. Le moteur natif (`speechSynthesis`)
     * n'expose aucun flux : il n'émet donc jamais sur cet écouteur, et la
     * synchro labiale retombe honnêtement sur le rythme des mots.
     */
    onOutputVolume?: (volume: number) => void;
    /**
     * Forme de bouche mesurée sur la voix HD à chaque image (visèmes
     * acoustiques) — pour l'avatar vivant. Le niveau seul reste publié par
     * `onOutputVolume` pour les jauges.
     */
    onMouthShape?: (shape: MouthShape) => void;
    /** Voix intégrée du navigateur : une frontière de mot vient d'être franchie (instant `performance.now()`, longueur du mot). */
    onWordBoundary?: (pulse: { at: number; length: number }) => void;
    onSpeakingStateChange?: (isSpeaking: boolean) => void;
    onConversationalTurnChange?: (turn: 'user_speaking' | 'ai_thinking' | 'ai_speaking' | 'waiting_user') => void;
    onTtsEngineChange?: (engine: 'elevenlabs' | 'browser_native') => void;
}

export interface VoiceOption {
    id: string;
    name: string;
    specialty: string;
    gender: 'male' | 'female';
    preview?: string;
}

export const ELEVENLABS_CURATED_VOICES: Record<string, VoiceOption> = {
    'professor': {
        id: 'JBFqnCBsd6RMkjVDRZzb', // George
        name: 'Professeur Diallo (George)',
        specialty: 'Éducation Supérieure & Pédagogie',
        gender: 'male',
        preview: 'Chaleureux, érudit et posé'
    },
    'professor_alt': {
        id: 'ErXwobaYiN019PkySvjV', // Antoni
        name: 'Professeur Diallo (Antoni)',
        specialty: 'Sciences & Méthodologie',
        gender: 'male',
        preview: 'Clair, analytique et posé'
    },
    'directeur': {
        id: 'pNInz6obpgDQGcFmaJgB', // Adam
        name: 'Directeur Diallo (Adam)',
        specialty: 'Direction & Stratégie',
        gender: 'male',
        preview: 'Grave, autoritaire et rassurant'
    },
    'juridique': {
        id: 'CwhRBWXzGAHq8TQ4Fs17', // Roger
        name: 'Maître Diallo (Roger)',
        specialty: 'Droit OHADA & Juridiction',
        gender: 'male',
        preview: 'Éloquent, distingué et formel'
    },
    'emploi': {
        id: 'N2lVS1w4EtoT3dr4eOWO', // Callum
        name: 'Conseiller Diallo (Callum)',
        specialty: 'Emploi & Entrepreneuriat',
        gender: 'male',
        preview: 'Dynamique, motivant et inspirant'
    },
    'sante': {
        id: 'TX3LPaxmHKxFdv7VOQHJ', // Liam
        name: 'Docteur Diallo (Liam)',
        specialty: 'Santé & Prévention',
        gender: 'male',
        preview: 'Calme, empathique et bienveillant'
    },
    'logement': {
        id: 'onwK4e9ZLuTAKqWW03F9', // Daniel
        name: 'Monsieur Diallo (Daniel)',
        specialty: 'Logement & Gestion Pratique',
        gender: 'male',
        preview: 'Pragmatique et convivial'
    },
    'voyage': {
        id: 'VR6AewLTigWG4xSOukaG', // Arnold
        name: 'Guide Diallo (Arnold)',
        specialty: 'Voyage, Visas & Mobilité',
        gender: 'male',
        preview: 'Vif, aventurier et chaleureux'
    },
    'finance': {
        id: 'pqHfZKP75CvOlQylNhV4', // Bill
        name: 'Analyste Diallo (Bill)',
        specialty: 'Marchés Mondiaux & B2B',
        gender: 'male',
        preview: 'Précis, rigoureux et stratégique'
    },
    'female_academic': {
        id: '21m00Tcm4TlvDq8ikWAM', // Rachel
        name: 'Docteure Diallo (Rachel)',
        specialty: 'Langues & Coopération',
        gender: 'female',
        preview: 'Douce, limpide et pédagogique'
    }
};

/**
 * Signal terminal émis (via `onError`) quand la reconnaissance vocale a
 * définitivement abandonné : erreur fatale du micro, ou plafond de relances
 * atteint. Exporté pour que les interfaces (barre Architecte, coachs)
 * puissent le reconnaître et afficher leur état « micro indisponible » au
 * lieu de rester sur « Connexion... » pendant que rien ne viendra.
 */
export const MIC_UNAVAILABLE_MESSAGE =
    "Le micro est indisponible — vérifiez l'autorisation micro du navigateur, ou utilisez la saisie.";

/**
 * Signal terminal distinct quand l'abandon vient d'erreurs RÉSEAU répétées de
 * la reconnaissance vocale (et non du micro lui-même) : l'ancien message
 * unique « micro indisponible » posait un diagnostic FAUX sur une coupure de
 * connexion — l'utilisateur vérifiait ses autorisations alors que c'était son
 * réseau. La reprise automatique (événement `online`) redonne une chance dès
 * que la connexion revient.
 */
export const LISTEN_NETWORK_MESSAGE =
    "La connexion réseau interrompt l'écoute — je reprendrai dès que la connexion revient.";

// Task force P0 (S3-B) : la synthèse navigateur n'a réussi à dire AUCUNE
// phrase (environnement sans voix utilisable) — signalé plutôt qu'un faux
// « j'ai parlé » silencieux, la réponse reste lisible à l'écran.
export const SPEECH_OUTPUT_FAILED_MESSAGE =
    "La voix n'a pas pu être jouée sur cet appareil — ma réponse reste affichée à l'écran.";

export class VoiceEngine {
    private static instance: VoiceEngine;
    private recognition: any = null;
    private isListening: boolean = false;
    private isSpeaking: boolean = false;
    private isConversationalMode: boolean = false;
    private listeners: Set<VoiceEngineListener> = new Set();
    
    // Audio analysis & VAD (Voice Activity Detection)
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private analyser: AnalyserNode | null = null;
    private animationFrameId: number | null = null;
    private vadSilenceTimer: any = null;
    private lastSpokenTranscript: string = '';
    private silenceDelayMs: number = 1400; // Silence time before auto-sending

    // Garde-fou contre la boucle de relance : quand le micro échoue de façon
    // non transitoire (`audio-capture`, `not-allowed`...), la reprise
    // automatique de `onend` relançait la reconnaissance toutes les ~300 ms,
    // indéfiniment — l'échec restait invisible pour l'utilisateur pendant que
    // la console se remplissait. Mesuré : 16 relances en ~5 s.
    private consecutiveRecognitionFailures: number = 0;
    private recognitionGaveUp: boolean = false;
    /** L'abandon en cours vient-il d'erreurs `network` (et non du micro) ? */
    private gaveUpBecauseOfNetwork: boolean = false;
    private lastRecognitionErrorWasNetwork: boolean = false;

    // ── PROPRIÉTÉ DE LA SESSION VOCALE (mission Architecte §5) ──────────
    // Le moteur est un singleton partagé : sans propriétaire, chaque écran
    // monté (barre Architecte, fil social, DialloOS, coachs) recevait le
    // MÊME transcript final et déclenchait SON propre traitement — plusieurs
    // assistants répondaient à la même phrase (« impression de parler à
    // plusieurs intervenants », défaut mesuré par l'audit du 31/08/2026).
    // Deux niveaux : le propriétaire conversationnel (posé par l'écran qui
    // ouvre une session continue) et le propriétaire temporaire (dictée
    // ponctuelle qui prend brièvement la main puis la rend). Le hook
    // `useVoiceAssistant` filtre les transcriptions selon ce propriétaire.
    private conversationalOwnerId: string | null = null;
    private temporaryOwnerId: string | null = null;

    // Voix de synthèse navigateur : `getVoices()` renvoie souvent [] au tout
    // premier appel après le chargement de la page (chargement asynchrone) —
    // sans écoute de `voiceschanged`, le repli parlait avec la voix système
    // par défaut, potentiellement non francophone. Cache rafraîchi par
    // l'événement.
    private cachedSynthesisVoices: SpeechSynthesisVoice[] = [];
    private static readonly FATAL_RECOGNITION_ERRORS = new Set([
        'audio-capture', 'not-allowed', 'service-not-allowed', 'language-not-supported',
    ]);
    private static readonly MAX_CONSECUTIVE_RECOGNITION_FAILURES = 4;

    // ElevenLabs state & cache
    private currentAudioElement: HTMLAudioElement | null = null;
    /**
     * Chaîne d'analyse de la voix de sortie (synchro labiale de l'avatar de
     * l'Architecte). `MediaElementAudioSourceNode` ne peut être créé QU'UNE
     * FOIS par élément `<audio>` : le nœud est donc mémorisé avec l'élément
     * qui lui correspond, et le contexte est réutilisé d'un segment à l'autre.
     */
    private outputAudioContext: AudioContext | null = null;
    private outputAnalyser: AnalyserNode | null = null;
    private outputSourceElement: HTMLAudioElement | null = null;
    private outputRafId: number | null = null;
    /**
     * Retard à appliquer à la BOUCHE quand la sortie audio de l'appareil est
     * plus lente que l'avance voulue (casque Bluetooth…) : sans lui, la bouche
     * parlerait bien avant le son.
     */
    private mouthDelayMs = 0;
    private mouthQueue: { at: number; shape: MouthShape }[] = [];
    private currentAudioUrl: string | null = null;
    private audioCache: Map<string, string> = new Map(); // Cache des URLs audio générées
    // JETON D'ANNULATION (Équipe V §3/§14) : la génération HD est asynchrone
    // (1 à 4 s) — sans jeton, un `stopSpeaking()` (fermeture de la barre,
    // barge-in) ou un second `speak()` pendant cette attente n'empêchait PAS
    // la promesse de continuer : l'audio partait quand même quelques secondes
    // plus tard (la « phrase fantôme » après fermeture) et deux `speak()`
    // rapprochés se SUPERPOSAIENT. Chaque annulation incrémente l'époque ;
    // toute continuation asynchrone vérifie que son époque est toujours la
    // courante avant de produire le moindre son.
    private speakEpoch: number = 0;
    private isElevenLabsAvailable: boolean = true;
    private preferredEngine: 'auto' | 'elevenlabs' | 'browser' = 'auto';
    private currentActiveEngine: 'elevenlabs' | 'browser_native' = 'elevenlabs';
    // IDENTITÉ VOCALE STABLE (Équipe B §9) : en session conversationnelle,
    // une fois le repli navigateur utilisé, on y RESTE jusqu'à la fin de la
    // session. Sans ce verrou, chaque réponse retentait le fournisseur HD :
    // selon sa disponibilité du moment, la voix alternait phrase après
    // phrase entre deux identités sonores — la « succession de voix »
    // constatée en usage réel. Une seule bascule par session au pire, jamais
    // un aller-retour. Le verrou saute à chaque nouvelle session (ouverture/
    // fermeture de la barre) et si la personne change son moteur préféré.
    private sessionEngineLock: 'browser_native' | null = null;
    // Task force P0 (S3-A) : le verrou éternel posé au PREMIER hoquet du
    // fournisseur HD condamnait toute la session à la voix navigateur alors
    // que le HD refonctionnait 70 % du temps. Le verrou expire (TTL) : passé
    // ce délai, la prochaine réponse redonne UNE chance au HD.
    private sessionEngineLockAt = 0;
    private static readonly ENGINE_LOCK_TTL_MS = 60_000;
    // Task force P0 (S2-C) : retentative espacée après un abandon réseau de
    // la reconnaissance (Chrome émet des erreurs `network` sans jamais
    // repasser par l'événement `online`).
    private lastNetworkRetryAt = 0;
    // Task force P0 (S2) : filet « jamais bloqué » du mode conversationnel.
    private conversationalWatchdog: any = null;

    // Browser Native Speech Queue fallback
    private speechQueue: string[] = [];
    private isProcessingQueue: boolean = false;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private heartbeatInterval: any = null;
    // Task force P0 (S3-B) : au moins une phrase du repli navigateur a-t-elle
    // RÉELLEMENT commencé à être dite pendant ce tour de parole ?
    private browserRunHadStart = false;

    /**
     * Journal des transitions de la boucle conversationnelle (mission P0) :
     * horodatage + délai depuis la transition précédente. console.debug —
     * visible en ouvrant la console, jamais un coût pour l'utilisateur.
     */
    private lastTraceAt = 0;
    private trace(step: string, extra?: Record<string, unknown>) {
        try {
            const now = Date.now();
            const dtMs = this.lastTraceAt ? now - this.lastTraceAt : 0;
            this.lastTraceAt = now;
            console.debug(`[VoixArchitecte] ${step}`, { dtMs, ...(extra || {}) });
        } catch { /* jamais bloquant */ }
    }

    private constructor() {
        this.initSpeechRecognition();
        this.loadSettings();
        if (typeof window !== 'undefined') {
            // Préchargement des voix de synthèse (voir cachedSynthesisVoices).
            if (window.speechSynthesis) {
                try {
                    this.cachedSynthesisVoices = window.speechSynthesis.getVoices();
                    window.speechSynthesis.onvoiceschanged = () => {
                        this.cachedSynthesisVoices = window.speechSynthesis.getVoices();
                    };
                } catch { /* synthèse absente : le repli échouera proprement ailleurs */ }
            }
            // RECONNEXION PROPRE (mission Architecte §19) : si l'écoute a été
            // abandonnée à cause du réseau et que la connexion revient pendant
            // une session conversationnelle encore active, on redonne une
            // chance automatiquement — jamais un assistant resté muet sans
            // explication après une coupure passagère.
            window.addEventListener('online', () => {
                if (this.recognitionGaveUp && this.gaveUpBecauseOfNetwork && this.isConversationalMode) {
                    this.recognitionGaveUp = false;
                    this.gaveUpBecauseOfNetwork = false;
                    this.consecutiveRecognitionFailures = 0;
                    if (!this.isSpeaking && !this.isListening) {
                        void this.startListening('fr-FR');
                    }
                }
            });
        }
    }

    public static getInstance(): VoiceEngine {
        if (!VoiceEngine.instance) {
            VoiceEngine.instance = new VoiceEngine();
        }
        return VoiceEngine.instance;
    }

    private loadSettings() {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('lmav_tts_engine_preference');
                if (saved === 'browser' || saved === 'elevenlabs' || saved === 'auto') {
                    this.preferredEngine = saved as any;
                }
            } catch (e) {
                // ignore
            }
        }
    }

    public setPreferredEngine(engine: 'auto' | 'elevenlabs' | 'browser') {
        this.preferredEngine = engine;
        // Choix explicite de la personne : il prime sur le verrou de session.
        this.sessionEngineLock = null;
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('lmav_tts_engine_preference', engine);
            } catch (e) {}
        }
    }

    public getPreferredEngine(): 'auto' | 'elevenlabs' | 'browser' {
        return this.preferredEngine;
    }

    public getCurrentActiveEngine(): 'elevenlabs' | 'browser_native' {
        return this.currentActiveEngine;
    }

    private initSpeechRecognition() {
        if (typeof window === 'undefined') return;
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognitionClass) {
            this.recognition = new SpeechRecognitionClass();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'fr-FR';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.notifyConversationalTurn('user_speaking');
                this.listeners.forEach(l => l.onStart?.());
            };

            this.recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const currentText = (finalTranscript || interimTranscript).trim();

                // INTERRUPTION NATURELLE (barge-in, Boucle 1 §15) : si la
                // personne parle vraiment pendant que l'IA parle, l'IA se
                // tait immédiatement et écoute — une conversation n'est pas
                // une succession de monologues. L'ancien comportement JETAIT
                // cette parole (`if (isSpeaking) return`). Le seuil de
                // longueur écarte les fragments d'écho de la voix de
                // synthèse captés par le micro.
                if (this.isSpeaking) {
                    if (currentText.length >= 12) {
                        this.stopSpeaking();
                    } else {
                        return;
                    }
                }

                if (currentText) {
                    // De l'audio réel arrive : le micro fonctionne, les échecs
                    // précédents étaient transitoires.
                    this.consecutiveRecognitionFailures = 0;
                    this.recognitionGaveUp = false;
                    this.gaveUpBecauseOfNetwork = false;

                    if (finalTranscript) {
                        // FINAL DU MOTEUR : émis UNE seule fois, et le timer
                        // VAD est neutralisé. L'ancien code réarmait le timer
                        // avec `lastSpokenTranscript` encore rempli : 1,4 s
                        // plus tard, le MÊME texte repartait en final — chaque
                        // commande vocale s'exécutait DEUX fois (double appel
                        // au cerveau, double exécution possible d'une action).
                        // Défaut de premier ordre mesuré par l'audit du
                        // 31/08/2026.
                        this.lastSpokenTranscript = '';
                        if (this.vadSilenceTimer) { clearTimeout(this.vadSilenceTimer); this.vadSilenceTimer = null; }
                        if (this.isConversationalMode) this.notifyConversationalTurn('ai_thinking');
                        this.listeners.forEach(l => l.onTranscript?.(currentText, true));
                    } else {
                        this.lastSpokenTranscript = currentText;
                        this.listeners.forEach(l => l.onTranscript?.(currentText, false));
                        // Le timer VAD ne finalise QUE les interimaires jamais
                        // conclus par le moteur (silence prolongé).
                        if (this.isConversationalMode) {
                            this.resetVadSilenceTimer();
                        }
                    }
                }
            };

            this.recognition.onerror = (event: any) => {
                // `no-speech` (personne n'a parlé) et `aborted` (arrêt voulu)
                // sont des non-événements : ni comptés, ni notifiés.
                if (event.error === 'no-speech' || event.error === 'aborted') return;

                console.warn('Notification reconnaissance vocale:', event.error);
                this.listeners.forEach(l => l.onError?.(event.error));

                // Erreur fatale (pas de périphérique, autorisation refusée...) :
                // la relance reproduirait exactement la même erreur. On abandonne
                // tout de suite. Les erreurs a priori transitoires (`network`)
                // ont droit à quelques relances, puis on abandonne aussi —
                // sans plafond, la boucle mesurée tournait sans fin.
                this.consecutiveRecognitionFailures += 1;
                this.lastRecognitionErrorWasNetwork = event.error === 'network';
                const fatal = VoiceEngine.FATAL_RECOGNITION_ERRORS.has(event.error);
                if (fatal || this.consecutiveRecognitionFailures >= VoiceEngine.MAX_CONSECUTIVE_RECOGNITION_FAILURES) {
                    this.recognitionGaveUp = true;
                    // Diagnostic HONNÊTE : une rafale d'erreurs `network`
                    // n'est pas un micro en panne — le message et la reprise
                    // automatique (événement `online`) diffèrent.
                    this.gaveUpBecauseOfNetwork = !fatal && this.lastRecognitionErrorWasNetwork;
                    // La première retentative espacée du filet part ~15 s
                    // après CET abandon — jamais immédiatement (le service
                    // vient d'échouer 4 fois de suite).
                    this.lastNetworkRetryAt = Date.now();
                    this.trace('écoute abandonnée', { cause: this.gaveUpBecauseOfNetwork ? 'réseau' : event.error });
                    this.listeners.forEach(l => l.onError?.(
                        this.gaveUpBecauseOfNetwork ? LISTEN_NETWORK_MESSAGE : MIC_UNAVAILABLE_MESSAGE
                    ));
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.listeners.forEach(l => l.onEnd?.());

                // Task force P0 (S2-B, propriétaire fantôme) : une dictée
                // ponctuelle qui se termine d'elle-même (silence, jamais de
                // bouton « stop ») gardait la main temporaire À VIE — la
                // session conversationnelle d'un AUTRE écran continuait
                // d'écouter mais tous ses transcripts étaient filtrés :
                // micro « actif » et assistant sourd pour toujours. La prise
                // de main temporaire expire avec la session de reconnaissance
                // qui l'a portée, dès lors que la session conversationnelle
                // appartient à quelqu'un d'autre.
                if (this.isConversationalMode && this.temporaryOwnerId
                    && this.temporaryOwnerId !== this.conversationalOwnerId) {
                    this.trace('propriétaire temporaire expiré (fin de reconnaissance)');
                    this.temporaryOwnerId = null;
                }

                // Reprise automatique si le mode conversationnel est toujours
                // actif, que l'IA ne parle pas, ET que le micro n'a pas été
                // déclaré indisponible — sinon la reprise relançait à l'infini
                // une reconnaissance condamnée à échouer.
                if (this.recognitionGaveUp) return;
                if (this.isConversationalMode && !this.isSpeaking) {
                    setTimeout(() => {
                        if (this.isConversationalMode && !this.isSpeaking && !this.isListening) {
                            try {
                                this.recognition.start();
                                this.isListening = true;
                            } catch (e) {
                                // reprise silencieuse
                            }
                        }
                    }, 300);
                }
            };
        }
    }

    private resetVadSilenceTimer() {
        if (this.vadSilenceTimer) {
            clearTimeout(this.vadSilenceTimer);
        }

        this.vadSilenceTimer = setTimeout(() => {
            if (this.lastSpokenTranscript.trim() && this.isConversationalMode && !this.isSpeaking) {
                const finalQuery = this.lastSpokenTranscript.trim();
                this.lastSpokenTranscript = '';
                this.notifyConversationalTurn('ai_thinking');
                
                // Émettre la transcription finale
                this.listeners.forEach(l => l.onTranscript?.(finalQuery, true));
            }
        }, this.silenceDelayMs);
    }

    public setConversationalMode(enabled: boolean) {
        this.isConversationalMode = enabled;
        // Nouvelle session = nouvelle chance pour le moteur HD ; fin de
        // session = plus rien à verrouiller. Dans les deux cas, le verrou
        // d'identité vocale ne survit jamais à la session qui l'a posé.
        this.sessionEngineLock = null;
        this.sessionEngineLockAt = 0;
        if (this.conversationalWatchdog) {
            clearInterval(this.conversationalWatchdog);
            this.conversationalWatchdog = null;
        }
        if (!enabled) {
            if (this.vadSilenceTimer) clearTimeout(this.vadSilenceTimer);
            return;
        }
        this.trace('session conversationnelle ouverte');
        // Task force P0 (S2) — FILET « jamais bloqué » : quelle que soit la
        // panne qui a laissé la session ni parlante ni écoutante (utterance
        // perdue, exception imprévue, relance ratée), la boucle se répare
        // toute seule. Un abandon micro (permission/périphérique) ne se
        // relance jamais tout seul ; un abandon RÉSEAU est retenté toutes
        // les ~15 s (Chrome émet des erreurs `network` de son service de
        // reconnaissance SANS jamais repasser par l'événement `online` —
        // démontré par l'audit P0, S2-C).
        this.conversationalWatchdog = setInterval(() => {
            if (!this.isConversationalMode || this.isSpeaking || this.isListening) return;
            if (this.recognitionGaveUp) {
                if (this.gaveUpBecauseOfNetwork && Date.now() - this.lastNetworkRetryAt > 15_000) {
                    this.lastNetworkRetryAt = Date.now();
                    this.trace('retentative d\'écoute après abandon réseau');
                    void this.startListening('fr-FR');
                }
                return;
            }
            this.trace('filet de reprise : écoute relancée');
            void this.startListening('fr-FR');
        }, 5000);
    }

    public getIsConversationalMode(): boolean {
        return this.isConversationalMode;
    }

    public notifyConversationalTurn(turn: 'user_speaking' | 'ai_thinking' | 'ai_speaking' | 'waiting_user') {
        this.listeners.forEach(l => l.onConversationalTurnChange?.(turn));
    }

    public addListener(listener: VoiceEngineListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // ── Propriété de la session vocale (voir champs plus haut) ──────────
    /** Prise de main ponctuelle (dictée) : dure jusqu'au release correspondant. */
    public claimTemporaryOwnership(ownerId: string) { this.temporaryOwnerId = ownerId; }
    public releaseTemporaryOwnership(ownerId: string) {
        if (this.temporaryOwnerId === ownerId) this.temporaryOwnerId = null;
    }
    /** Session conversationnelle continue (barre Architecte, coachs). */
    public claimConversationalOwnership(ownerId: string) { this.conversationalOwnerId = ownerId; }
    public releaseConversationalOwnership(ownerId: string) {
        if (this.conversationalOwnerId === ownerId) this.conversationalOwnerId = null;
    }
    /**
     * Propriétaire effectif des transcriptions : la prise de main ponctuelle
     * l'emporte sur la session continue ; `null` = aucun filtre (comportement
     * historique conservé pour tout écran qui n'a rien réclamé).
     */
    public getTranscriptOwner(): string | null {
        return this.temporaryOwnerId ?? this.conversationalOwnerId;
    }

    public isSpeechRecognitionSupported(): boolean {
        return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    }

    public async startListening(lang: string = 'fr-FR'): Promise<boolean> {
        if (!this.recognition) {
            this.initSpeechRecognition();
            if (!this.recognition) {
                this.listeners.forEach(l => l.onError?.("La reconnaissance vocale n'est pas supportée sur ce navigateur."));
                return false;
            }
        }

        // Un démarrage explicite est une nouvelle chance honnête : la personne
        // (ou l'écran) redemande l'écoute, peut-être après avoir accordé
        // l'autorisation micro — le verdict précédent ne doit pas l'en priver.
        this.recognitionGaveUp = false;
        this.consecutiveRecognitionFailures = 0;

        try {
            if (this.isListening) {
                this.stopListening();
            }

            this.recognition.lang = lang;
            this.lastSpokenTranscript = '';
            this.recognition.start();
            this.startVolumeMonitoring();
            return true;
        } catch (e) {
            console.error("Erreur démarrage écoute vocale:", e);
            return false;
        }
    }

    public stopListening() {
        if (this.vadSilenceTimer) clearTimeout(this.vadSilenceTimer);
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn(e);
            }
        }
        this.stopVolumeMonitoring();
        this.isListening = false;
    }

    public getIsListening(): boolean {
        return this.isListening;
    }

    public getIsSpeaking(): boolean {
        return this.isSpeaking;
    }

    /**
     * Résout l'ID de voix ElevenLabs correspondant à l'expert ou au contexte
     */
    public getVoiceIdForAgent(agentRoleOrId?: string): string {
        if (!agentRoleOrId) return ELEVENLABS_CURATED_VOICES.professor.id;

        const role = agentRoleOrId.toLowerCase();
        if (role.includes('prof') || role.includes('campus') || role.includes('education')) {
            return ELEVENLABS_CURATED_VOICES.professor.id;
        }
        if (role.includes('direct') || role.includes('general')) {
            return ELEVENLABS_CURATED_VOICES.directeur.id;
        }
        if (role.includes('juri') || role.includes('maitre') || role.includes('ohada') || role.includes('avocat')) {
            return ELEVENLABS_CURATED_VOICES.juridique.id;
        }
        if (role.includes('emploi') || role.includes('conseil') || role.includes('rh') || role.includes('carriere')) {
            return ELEVENLABS_CURATED_VOICES.emploi.id;
        }
        if (role.includes('sant') || role.includes('med') || role.includes('doc')) {
            return ELEVENLABS_CURATED_VOICES.sante.id;
        }
        if (role.includes('log') || role.includes('habit') || role.includes('monsieur')) {
            return ELEVENLABS_CURATED_VOICES.logement.id;
        }
        if (role.includes('voyag') || role.includes('visa') || role.includes('guide')) {
            return ELEVENLABS_CURATED_VOICES.voyage.id;
        }
        if (role.includes('finan') || role.includes('analyst') || role.includes('march') || role.includes('b2b')) {
            return ELEVENLABS_CURATED_VOICES.finance.id;
        }
        if (role.includes('coach') || role.includes('langue')) {
            return ELEVENLABS_CURATED_VOICES.professor_alt.id;
        }

        return ELEVENLABS_CURATED_VOICES.professor.id;
    }

    /**
     * 🗣️ Convertit tout texte académique ou technique en français oral fluide
     */
    public formatForSpokenVoice(rawText: string): string {
        if (!rawText) return '';

        let text = rawText;

        // 1. Supprimer les blocs de code volumineux
        text = text.replace(/```[\s\S]*?```/g, ' Voici le code correspondant. ');

        // 2. Remplacer les notations mathématiques courantes par leur prononciation
        text = text
            .replace(/\\lim_\{n\s*\\to\s*\\infty\}/gi, " limite quand n tend vers l'infini ")
            .replace(/\\lim_\{x\s*\\to\s*([^\}]+)\}/gi, " limite quand x tend vers $1 ")
            .replace(/\\lim/gi, ' limite ')
            .replace(/\\sqrt\{([^\}]+)\}/gi, ' racine carrée de $1 ')
            .replace(/\\sqrt\(([^)]+)\)/gi, ' racine carrée de $1 ')
            .replace(/\\Delta|\\delta/gi, ' delta ')
            .replace(/\\forall/gi, ' pour tout ')
            .replace(/\\exists/gi, ' il existe ')
            .replace(/\\in/gi, ' appartient à ')
            .replace(/\\sum/gi, ' somme de ')
            .replace(/\\int/gi, ' intégrale de ')
            .replace(/\\infty|\+?\\infty/gi, " l'infini ")
            .replace(/-\s*\\infty/gi, " moins l'infini ")
            .replace(/f'\(([^\)]+)\)/gi, ' f prime de $1 ')
            .replace(/([a-zA-Z0-9]+)\^2|\b([a-zA-Z0-9]+)²\b/gi, ' $1 au carré ')
            .replace(/([a-zA-Z0-9]+)\^3|\b([a-zA-Z0-9]+)³\b/gi, ' $1 au cube ')
            .replace(/([a-zA-Z0-9]+)\^n/gi, ' $1 puissance n ')
            .replace(/\\times/gi, ' fois ')
            .replace(/\\div/gi, ' divisé par ')
            .replace(/\\leq|\\le|<=/gi, ' inférieur ou égal à ')
            .replace(/\\geq|\\ge|>=/gi, ' supérieur ou égal à ')
            .replace(/\\neq|!=/gi, ' différent de ')
            .replace(/\\iff|<=>/gi, ' équivaut à ')
            .replace(/\\implies|=>/gi, ' implique que ')
            .replace(/1\/2/g, ' un demi ')
            .replace(/1\/3/g, ' un tiers ')
            .replace(/1\/4/g, ' un quart ')
            .replace(/3\/4/g, ' trois quarts ')
            .replace(/%/g, ' pour cent ');

        // 3. Remplacer les sigles & acronymes par leur formulation phonétique
        text = text
            .replace(/\bOHADA\b/g, "l'Ohada")
            .replace(/\bCCJA\b/g, "la C-C-J-A")
            .replace(/\bSAS\b/g, "S-A-S")
            .replace(/\bSARL\b/g, "S-A-R-L")
            .replace(/\bIA\b/g, "intelligence artificielle")
            .replace(/\bAPI\b/g, "A-P-I")
            .replace(/\bmTLS\b/g, "M-T-L-S")
            .replace(/\bCAP\b/g, "C-A-P")
            .replace(/\bPDF\b/g, "P-D-F")
            .replace(/\bMEPU-A\b/g, "Ministère de l'Éducation Pré-Universitaire")
            .replace(/\bMENA\b/g, "Ministère de l'Éducation Nationale")
            .replace(/\bBAC\b/g, "Baccalauréat")
            .replace(/\bN°\s*([0-9]+)/gi, 'numéro $1')
            .replace(/\bPr\.\b/g, 'Professeur')
            .replace(/\bDr\.\b/g, 'Docteur');

        // 4. Nettoyer les balises Markdown, tableaux, puces et symboles
        text = text
            .replace(/^#+\s+/gm, '')
            .replace(/\|.*?\|/g, ' ')
            .replace(/[-*+]\s+/g, '')
            .replace(/[*_~`#]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '')
            .replace(/━━━━|════|────/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        return text;
    }

    /**
     * 🎙️ SYNTHÈSE VOCALE PRINCIPALE (ElevenLabs HD avec Fallback Navigateur Transparent)
     */
    public async speak(
        text: string,
        options?: {
            voiceId?: string;
            voiceName?: string;
            rate?: number;
            pitch?: number;
            stability?: number;
            similarity_boost?: number;
            style?: number;
            onStart?: () => void;
            onEnd?: () => void;
        }
    ) {
        if (!text || typeof window === 'undefined') return;

        // Arrêter toute diction en cours — et prendre l'époque APRÈS :
        // toute continuation asynchrone d'un `speak` antérieur devient stale.
        this.stopSpeaking();
        const epoch = this.speakEpoch;

        const cleanedText = this.formatForSpokenVoice(text);
        if (!cleanedText) return;

        const effectiveVoiceId = options?.voiceId || this.getVoiceIdForAgent(options?.voiceName);

        // Si l'utilisateur a forcé le moteur navigateur
        if (this.preferredEngine === 'browser') {
            this.fallbackToBrowserSpeech(cleanedText, options);
            return;
        }

        // Identité vocale stable (Équipe B §9) : la session a déjà basculé
        // sur la voix navigateur — on n'alterne pas entre deux voix au gré
        // de la disponibilité du fournisseur HD.
        if (this.isConversationalMode && this.sessionEngineLock === 'browser_native') {
            // Task force P0 (S3-A) : le verrou expire — le HD marche la
            // plupart du temps, un seul hoquet ne condamne plus la session.
            if (Date.now() - this.sessionEngineLockAt < VoiceEngine.ENGINE_LOCK_TTL_MS) {
                this.fallbackToBrowserSpeech(cleanedText, options);
                return;
            }
            this.sessionEngineLock = null;
            this.trace('verrou voix navigateur expiré — nouvelle chance au HD');
        }

        // Essayer d'abord la synthèse vocale ElevenLabs HD
        try {
            const success = await this.speakWithElevenLabs(cleanedText, effectiveVoiceId, epoch, options);
            // Annulé pendant la génération (fermeture, barge-in, nouveau
            // `speak`) : silence — jamais une voix fantôme ni un repli tardif.
            if (epoch !== this.speakEpoch) return;
            if (!success) {
                console.log("ℹ️ Transition gracieuse vers le moteur vocal natif...");
                this.fallbackToBrowserSpeech(cleanedText, options);
            }
        } catch (e) {
            if (epoch !== this.speakEpoch) return;
            console.warn("ElevenLabs TTS non disponible, bascule sur la synthèse système:", e);
            this.fallbackToBrowserSpeech(cleanedText, options);
        }
    }

    /**
     * 🚀 Synthèse vocale via l'orchestrateur IA central (Super Admin → Connecteurs
     * IA, catégorie "voix" — ElevenLabs ou tout autre fournisseur vocal actif,
     * avec bascule automatique). Remplace l'ancien proxy /api/tts (backend Express
     * jamais exécuté en production sur cet hébergement statique).
     */
    /**
     * Découpage HD (Équipe V §11/§12) : la première phrase part SEULE en
     * synthèse — le premier son arrive donc après la génération d'une phrase,
     * pas de toute la réponse — mais c'est toujours une phrase complète et
     * cohérente qui commence (jamais une syllabe isolée ni un faux départ).
     * La suite est regroupée en blocs de phrases (~360 caractères) générés
     * PENDANT la lecture du bloc courant : la voix enchaîne sans blanc de
     * génération, avec la même respiration par ponctuation que le repli
     * navigateur — une seule intention vocale continue.
     */
    private splitForHdSynthesis(text: string): string[] {
        const sentences = text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
        if (sentences.length <= 1) return sentences;
        const segments: string[] = [sentences[0]];
        let current = '';
        for (const s of sentences.slice(1)) {
            // 700 (au lieu de 360) : chaque segment est UN appel au fournisseur
            // TTS — le palier gratuit du secours Gemini TTS a une limite de
            // débit basse (429 mesurés en rafale le 31/08/2026), et moins
            // d'appels par réponse = moins de risques de la toucher, sans
            // changer la sensation (le bloc suivant est généré PENDANT la
            // lecture du courant).
            if (current && (current.length + s.length + 1) > 700) {
                segments.push(current);
                current = s;
            } else {
                current = current ? `${current} ${s}` : s;
            }
        }
        if (current) segments.push(current);
        return segments;
    }

    private segmentCacheKey(
        segment: string,
        voiceId: string,
        options?: { stability?: number; similarity_boost?: number; style?: number }
    ): string {
        const settings = this.buildVoiceSettings(options);
        const settingsKey = settings ? `_s${settings.stability ?? ''}i${settings.similarity_boost ?? ''}y${settings.style ?? ''}` : '';
        return `${voiceId}${settingsKey}_${segment.slice(0, 80)}_${segment.length}`;
    }

    // Task force P0 (S1) : cache PERSISTANT des audios préchauffés (l'accueil
    // de l'Architecte est un texte déterministe — le regénérer à chaque
    // chargement de page gaspillait 2,5-4 s ET le quota du fournisseur
    // gratuit). Quelques entrées seulement, jamais un entrepôt.
    private static readonly PREWARM_STORE_KEY = 'lmav_tts_prewarm_v1';
    private readPrewarmStore(): Record<string, string> {
        try { return JSON.parse(localStorage.getItem(VoiceEngine.PREWARM_STORE_KEY) || '{}'); }
        catch { return {}; }
    }

    /**
     * Préchauffe la synthèse d'un texte connu d'avance (l'accueil) : chaque
     * segment est généré en tâche de fond et rangé dans le cache mémoire ET
     * le cache persistant — l'ouverture suivante parle immédiatement.
     * Silencieux et sans conséquence en cas d'échec (le chemin normal
     * reprendra sa génération habituelle).
     */
    public async prewarmSpeech(
        text: string,
        options?: { voiceId?: string; voiceName?: string; stability?: number; similarity_boost?: number; style?: number }
    ): Promise<void> {
        try {
            const cleaned = this.formatForSpokenVoice(text);
            if (!cleaned) return;
            const voiceId = options?.voiceId || this.getVoiceIdForAgent(options?.voiceName);
            const segments = this.splitForHdSynthesis(cleaned);
            const store = this.readPrewarmStore();
            let storeChanged = false;
            for (const segment of segments) {
                const key = this.segmentCacheKey(segment, voiceId, options);
                if (this.audioCache.get(key)) continue;
                if (store[key]) { this.audioCache.set(key, store[key]); continue; }
                const url = await this.generateSegmentAudio(segment, voiceId, options);
                if (!url) return; // fournisseur indisponible : on n'insiste pas
                store[key] = url;
                storeChanged = true;
            }
            if (storeChanged) {
                // Borne stricte : au-delà de 6 entrées (variantes d'accueil),
                // on repart d'un magasin frais plutôt que de grossir sans fin.
                const keys = Object.keys(store);
                const bounded = keys.length > 6
                    ? Object.fromEntries(keys.slice(-6).map((k) => [k, store[k]]))
                    : store;
                try { localStorage.setItem(VoiceEngine.PREWARM_STORE_KEY, JSON.stringify(bounded)); }
                catch { /* quota localStorage plein : le cache mémoire suffit pour cette page */ }
                this.trace('accueil préchauffé', { segments: segments.length });
            }
        } catch { /* préchauffage best-effort, jamais bloquant */ }
    }

    /** Génère (ou relit du cache) l'audio d'UN segment. Retourne null en cas d'échec — jamais une exception. */
    private async generateSegmentAudio(
        segment: string,
        voiceId: string,
        options?: { stability?: number; similarity_boost?: number; style?: number }
    ): Promise<string | null> {
        const settings = this.buildVoiceSettings(options);
        const cacheKey = this.segmentCacheKey(segment, voiceId, options);

        const cached = this.audioCache.get(cacheKey);
        if (cached) return cached;
        // Cache persistant du préchauffage (S1) — hydrate le cache mémoire.
        try {
            const persisted = this.readPrewarmStore()[cacheKey];
            if (persisted) { this.audioCache.set(cacheKey, persisted); return persisted; }
        } catch { /* localStorage indisponible : chemin normal */ }

        try {
            const t0 = Date.now();
            const detail = await generateSpeechDetailed(segment, { voiceId, voiceSettings: settings });
            if (!detail?.audioBase64) {
                this.trace('segment TTS sans audio', { ms: Date.now() - t0, chars: segment.length });
                return null;
            }
            this.trace('segment TTS généré', { ms: Date.now() - t0, chars: segment.length });
            // Type MIME RÉEL du fournisseur (mp3 ElevenLabs, wav Gemini...) —
            // l'ancien `audio/mpeg` codé en dur aurait fait échouer la lecture
            // d'un WAV de secours sur certains navigateurs.
            const url = `data:${detail.mimeType || 'audio/mpeg'};base64,${detail.audioBase64}`;
            // Cache borné : sans éviction, des data-URL MP3 complètes
            // s'accumulaient pour toute la vie de l'onglet.
            if (this.audioCache.size >= 40) {
                const oldest = this.audioCache.keys().next().value;
                if (oldest !== undefined) this.audioCache.delete(oldest);
            }
            this.audioCache.set(cacheKey, url);
            return url;
        } catch (e) {
            console.warn("Synthèse vocale via l'orchestrateur indisponible:", e);
            return null;
        }
    }

    /** Ne transmet des réglages de voix que si l'appelant en fournit — les autres écrans (Experts Diallo) restent strictement inchangés. */
    private buildVoiceSettings(options?: { stability?: number; similarity_boost?: number; style?: number }):
        { stability?: number; similarity_boost?: number; style?: number } | undefined {
        if (!options) return undefined;
        const { stability, similarity_boost, style } = options;
        if (stability === undefined && similarity_boost === undefined && style === undefined) return undefined;
        return {
            ...(stability !== undefined ? { stability } : {}),
            ...(similarity_boost !== undefined ? { similarity_boost } : {}),
            ...(style !== undefined ? { style } : {}),
        };
    }

    /**
     * Branche l'analyse d'amplitude sur la voix en cours de lecture, pour la
     * synchro labiale de l'avatar de l'Architecte.
     *
     * Entièrement optionnel : si le navigateur refuse l'`AudioContext`, si le
     * flux est d'une autre origine, ou si quoi que ce soit échoue, la lecture
     * de la voix continue normalement et l'avatar retombe sur une bouche
     * close. Jamais une fonctionnalité d'affichage ne doit pouvoir empêcher
     * l'Architecte de parler.
     */
    private attachOutputAnalyser(audio: HTMLAudioElement): void {
        // Personne n'écoute le niveau de sortie : ne pas ouvrir de contexte
        // audio pour rien (coûteux, et bloqué tant qu'il n'y a pas eu de geste
        // utilisateur sur certains navigateurs).
        let wanted = false;
        this.listeners.forEach(l => { if (l.onOutputVolume || l.onMouthShape) wanted = true; });
        if (!wanted) return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            if (!this.outputAudioContext) this.outputAudioContext = new AudioContextClass();
            const context = this.outputAudioContext;
            if (context.state === 'suspended') void context.resume().catch(() => {});

            // Un élément déjà relié garde son nœud : re-créer une source sur le
            // même élément lève une exception et couperait le son.
            if (this.outputSourceElement !== audio) {
                const source = context.createMediaElementSource(audio);
                // Prise de mesure TEMPORELLE (RMS sur ~46 ms) : le spectre en
                // octets tenait la bouche ouverte sur le souffle (voir lipSync).
                const analyser = context.createAnalyser();
                analyser.fftSize = ANALYSER_FFT_SIZE;
                // Spectre brut à chaque image : le lissage temporel est dans l'avatar.
                analyser.smoothingTimeConstant = 0;
                source.connect(analyser);
                // La voix entendue passe par un court retard : la bouche, qui
                // lit le signal non retardé, prend de l'avance et compense le
                // retard de la chaîne (fenêtre, image, inertie de la lèvre).
                // La latence de sortie de l'appareil compte déjà comme retard
                // du son : on la retranche ; si elle dépasse l'avance voulue,
                // c'est la bouche qu'on retarde (file `mouthQueue`).
                // Indispensable : sans ce chemin jusqu'à la sortie, brancher
                // la source sur l'analyseur REND LA VOIX MUETTE.
                const ctxLatence = context as AudioContext & { outputLatency?: number };
                const latenceSortieMs = Math.max(0, (Number.isFinite(ctxLatence.outputLatency!) ? ctxLatence.outputLatency! : context.baseLatency || 0) * 1000);
                this.mouthDelayMs = Math.max(0, latenceSortieMs - LIP_SYNC_LOOKAHEAD_MS);
                const delay = context.createDelay(1);
                delay.delayTime.value = Math.max(0, LIP_SYNC_LOOKAHEAD_MS - latenceSortieMs) / 1000;
                source.connect(delay);
                delay.connect(context.destination);
                this.outputAnalyser = analyser;
                this.outputSourceElement = audio;
            }
            this.startOutputLevelLoop();
        } catch (err) {
            console.warn('Analyse du niveau de sortie indisponible (la voix continue):', err);
        }
    }

    /** Boucle de mesure : une seule à la fois, arrêtée dès que la parole cesse. */
    private startOutputLevelLoop(): void {
        if (this.outputRafId !== null || !this.outputAnalyser) return;
        const analyser = this.outputAnalyser;
        const samples = new Float32Array(analyser.fftSize);
        const spectrum = new Float32Array(analyser.frequencyBinCount);
        const sampleRate = this.outputAudioContext?.sampleRate || 44100;
        // Crête ré-étalonnée à chaque prise de parole : une voix plus douce
        // ouvre la bouche autant qu'une voix forte.
        const envelope = createVoiceEnvelope();
        let lastAt = performance.now();
        this.mouthQueue = [];
        const tick = () => {
            if (!this.outputAnalyser || !this.isSpeaking) {
                this.outputRafId = null;
                this.publishMouth(MOUTH_AT_REST);
                return;
            }
            this.outputAnalyser.getFloatTimeDomainData(samples);
            this.outputAnalyser.getFloatFrequencyData(spectrum);
            const now = performance.now();
            const shape = mouthShapeFromBands(spectralBands(spectrum, samples, sampleRate), envelope, now - lastAt);
            lastAt = now;
            if (this.mouthDelayMs < 8) {
                this.publishMouth(shape);
            } else {
                // Sortie audio en retard sur l'avance voulue : la bouche attend le son.
                this.mouthQueue.push({ at: now, shape });
                let due: MouthShape | null = null;
                while (this.mouthQueue.length && this.mouthQueue[0].at <= now - this.mouthDelayMs) due = this.mouthQueue.shift()!.shape;
                if (due) this.publishMouth(due);
            }
            this.outputRafId = requestAnimationFrame(tick);
        };
        this.outputRafId = requestAnimationFrame(tick);
    }

    /** Publie une forme de bouche et son niveau à tous les auditeurs. */
    private publishMouth(shape: MouthShape): void {
        this.listeners.forEach(l => {
            l.onMouthShape?.(shape);
            l.onOutputVolume?.(shape.level);
        });
    }

    /** Arrête la mesure et remet la bouche au repos — appelé avec l'arrêt de la parole. */
    private stopOutputLevelLoop(): void {
        if (this.outputRafId !== null) {
            cancelAnimationFrame(this.outputRafId);
            this.outputRafId = null;
        }
        this.mouthQueue = [];
        this.publishMouth(MOUTH_AT_REST);
    }

    /** Joue une URL audio. Résout à la fin naturelle (true), sur erreur (false), ou immédiatement si l'époque a été annulée (false). */
    private playAudioUrl(audioUrl: string, epoch: number): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            try {
                const audio = new Audio(audioUrl);
                this.currentAudioElement = audio;
                this.currentAudioUrl = audioUrl;
                this.attachOutputAnalyser(audio);
                audio.onended = () => resolve(true);
                // `stopSpeaking()` met l'audio en pause : l'événement pause
                // avec une époque périmée signifie « coupé net » — on résout
                // tout de suite au lieu de laisser une promesse pendante.
                audio.onpause = () => { if (epoch !== this.speakEpoch) resolve(false); };
                audio.onerror = (e) => { console.warn('Erreur lecture audio ElevenLabs:', e); resolve(false); };
                audio.play().catch((err) => { console.warn('Échec lecture autoplay audio:', err); resolve(false); });
            } catch (err) {
                console.warn('Erreur initialisation Audio ElevenLabs:', err);
                resolve(false);
            }
        });
    }

    private waitMs(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async speakWithElevenLabs(
        text: string,
        voiceId: string,
        epoch: number,
        options?: {
            stability?: number;
            similarity_boost?: number;
            style?: number;
            onStart?: () => void;
            onEnd?: () => void;
        }
    ): Promise<boolean> {
        const segments = this.splitForHdSynthesis(text);
        if (segments.length === 0) return true;

        // §12 : aucun son avant qu'une phrase complète soit prête.
        let currentUrl = await this.generateSegmentAudio(segments[0], voiceId, options);
        if (epoch !== this.speakEpoch) return true; // annulé pendant la génération : silence
        if (!currentUrl) return false; // rien n'a pu être dit → le repli peut prendre le relais

        // Pause du micro pendant la lecture
        if (this.isListening && this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }

        this.isSpeaking = true;
        this.currentActiveEngine = 'elevenlabs';
        this.notifySpeakingState(true);
        this.notifyConversationalTurn('ai_speaking');
        this.listeners.forEach(l => l.onTtsEngineChange?.('elevenlabs'));
        options?.onStart?.();

        for (let i = 0; i < segments.length; i++) {
            // Pré-générer le segment suivant PENDANT la lecture du courant.
            const nextPromise = i + 1 < segments.length
                ? this.generateSegmentAudio(segments[i + 1], voiceId, options)
                : null;

            const played = await this.playAudioUrl(currentUrl, epoch);
            if (epoch !== this.speakEpoch) return true; // coupé net (barge-in/fermeture) : rien d'autre ne part
            if (!played) break; // erreur de lecture : fin propre, jamais une superposition

            if (nextPromise) {
                // Respiration entre deux blocs, selon la ponctuation réelle.
                await this.waitMs(VoiceEngine.breathAfterPhrase(segments[i]));
                if (epoch !== this.speakEpoch) return true;
                let nextUrl = await nextPromise;
                if (epoch !== this.speakEpoch) return true;
                if (!nextUrl) {
                    // Une seule relance — puis fin PROPRE dans la même voix :
                    // basculer sur la voix navigateur au milieu d'une réponse
                    // serait précisément la « succession de voix » à bannir
                    // (§9). Le texte complet reste affiché à l'écran.
                    nextUrl = await this.generateSegmentAudio(segments[i + 1], voiceId, options);
                    if (epoch !== this.speakEpoch) return true;
                }
                if (!nextUrl) break;
                currentUrl = nextUrl;
            }
        }

        this.finishSpeakingElevenLabs(options);
        return true;
    }

    private finishSpeakingElevenLabs(options?: { onEnd?: () => void }) {
        this.isSpeaking = false;
        this.currentAudioElement = null;
        this.notifySpeakingState(false);
        options?.onEnd?.();

        this.trace('voix HD : lecture terminée');
        if (this.isConversationalMode) {
            this.notifyConversationalTurn('waiting_user');
            setTimeout(() => {
                if (this.isConversationalMode && !this.isSpeaking && !this.isListening) {
                    this.trace('micro relancé après réponse');
                    this.startListening('fr-FR');
                }
            }, 350);
        }
    }

    /**
     * 🌐 Fallback Synthèse Système (Web Speech API) avec Découpage Acoustique
     */
    private fallbackToBrowserSpeech(
        text: string, 
        options?: { 
            voiceName?: string; 
            rate?: number; 
            pitch?: number; 
            onStart?: () => void; 
            onEnd?: () => void; 
        }
    ) {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const phrases = this.splitIntoAcousticPhrases(text);
        if (phrases.length === 0) return;

        // Task force P0 (S3-A) : le verrou d'identité vocale (§9) n'est plus
        // posé ICI mais au premier `utterance.onstart` réel — une voix qui
        // n'a jamais parlé ne verrouille pas la session sur du silence.

        if (this.isListening && this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }

        this.speechQueue = phrases;
        this.isProcessingQueue = true;
        this.isSpeaking = true;
        this.browserRunHadStart = false;
        this.currentActiveEngine = 'browser_native';
        this.notifySpeakingState(true);
        this.notifyConversationalTurn('ai_speaking');
        this.listeners.forEach(l => l.onTtsEngineChange?.('browser_native'));
        options?.onStart?.();
        this.trace('repli navigateur : lecture demandée', { phrases: phrases.length });

        this.startHeartbeat();
        // Task force P0 (S2-A) : `stopSpeaking()` vient d'appeler
        // `speechSynthesis.cancel()` dans ce même tick — certains navigateurs
        // PERDENT silencieusement une utterance lancée immédiatement après
        // (ni onstart, ni onend, ni onerror : voix muette ET micro jamais
        // relancé, démontré par la reproduction de l'audit). Court différé.
        setTimeout(() => { if (this.isProcessingQueue) this.processNextInQueue(options); }, 80);
    }

    private splitIntoAcousticPhrases(text: string): string[] {
        const cleaned = this.formatForSpokenVoice(text);
        if (!cleaned) return [];

        const rawPhrases = cleaned.split(/(?<=[.!?;\n])\s+/);
        const phrases: string[] = [];

        for (const raw of rawPhrases) {
            const p = raw.trim();
            if (!p) continue;

            // ÉQUIPE V §3 : une phrase ordinaire reste UN SEUL énoncé — les
            // virgules restent DEDANS et le moteur de synthèse y respire tout
            // seul, naturellement. L'ancien seuil (140) découpait presque
            // chaque phrase à ses virgules en énoncés séparés : chaque
            // redémarrage du moteur + la pause fixe ajoutée donnaient les
            // « coupures entre mots » entendues. La coupe à la virgule ne
            // reste qu'en garde-fou pour les phrases anormalement longues
            // (certains moteurs système se figent au-delà de ~250 caractères).
            if (p.length > 240) {
                const subParts = p.split(/(?<=[,])\s+/);
                let currentChunk = '';
                for (const sub of subParts) {
                    if ((currentChunk + ' ' + sub).length > 240 && currentChunk) {
                        phrases.push(currentChunk.trim());
                        currentChunk = sub;
                    } else {
                        currentChunk = currentChunk ? `${currentChunk} ${sub}` : sub;
                    }
                }
                if (currentChunk.trim()) phrases.push(currentChunk.trim());
            } else {
                phrases.push(p);
            }
        }

        return phrases;
    }

    private processNextInQueue(options?: { voiceName?: string; rate?: number; pitch?: number; onEnd?: () => void }) {
        if (!this.isProcessingQueue || this.speechQueue.length === 0) {
            this.finishSpeakingBrowser(options);
            return;
        }

        const phrase = this.speechQueue.shift();
        if (!phrase) {
            this.finishSpeakingBrowser(options);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = 'fr-FR';
        utterance.rate = options?.rate || 1.02;
        // Synchro labiale du repli : `speechSynthesis` n'expose aucun signal
        // audio, mais il annonce chaque frontière de mot — la bouche suit ce
        // rythme (niveau « rythme_des_mots », dit tel quel à l'écran).
        utterance.onboundary = (e: SpeechSynthesisEvent) => {
            if (e.name && e.name !== 'word') return;
            const longueur = e.charLength && e.charLength > 0
                ? e.charLength
                : ((utterance.text || '').slice(e.charIndex).match(/^\S+/)?.[0].length ?? 5);
            const pulse = { at: performance.now(), length: longueur };
            this.listeners.forEach(l => l.onWordBoundary?.(pulse));
        };
        utterance.pitch = options?.pitch || 1.0;

        const bestVoice = this.selectBestFrenchVoice(options?.voiceName);
        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        // RESPIRATION (Équipe B §2) : la pause entre deux phrases suit la
        // ponctuation réellement écrite — une virgule ne respire pas comme un
        // point, une question laisse à l'autre le temps d'exister. L'ancienne
        // pause unique (120 ms partout) donnait la lecture d'un seul bloc.
        const breath = VoiceEngine.breathAfterPhrase(phrase);

        // Task force P0 (S2-A, démontré par reproduction) : une utterance peut
        // être PERDUE par le navigateur — aucun de ses événements ne part
        // jamais. Sans chien de garde, `isSpeaking` restait true pour
        // toujours : voix muette ET micro jamais relancé (blocage
        // irrécupérable). Si rien n'a démarré sous 2 s, on passe à la suite.
        const lostWatchdog = setTimeout(() => {
            if (this.currentUtterance === utterance && this.isProcessingQueue) {
                this.trace('utterance perdue — chien de garde', { phrase: phrase.slice(0, 40) });
                this.processNextInQueue(options);
            }
        }, 2000);

        utterance.onstart = () => {
            clearTimeout(lostWatchdog);
            this.browserRunHadStart = true;
            // Task force P0 (S3-A) : le verrou d'identité vocale (§9) ne se
            // pose que sur une voix qui a RÉELLEMENT commencé à parler.
            if (this.isConversationalMode && this.sessionEngineLock !== 'browser_native') {
                this.sessionEngineLock = 'browser_native';
                this.sessionEngineLockAt = Date.now();
                this.trace('verrou voix navigateur posé (voix réellement audible)');
            }
        };

        utterance.onend = () => {
            clearTimeout(lostWatchdog);
            setTimeout(() => {
                if (this.isProcessingQueue) {
                    this.processNextInQueue(options);
                }
            }, breath);
        };

        utterance.onerror = (e) => {
            clearTimeout(lostWatchdog);
            console.warn('Speech chunk notice:', e);
            if (this.isProcessingQueue) {
                this.processNextInQueue(options);
            }
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Durée de la respiration après une phrase, selon sa ponctuation
     * terminale. Valeurs courtes et sobres : le but est un rythme naturel,
     * pas une théâtralisation — et jamais de fausses hésitations fabriquées.
     */
    static breathAfterPhrase(phrase: string): number {
        const trimmed = phrase.trim();
        if (/\?$/.test(trimmed)) return 320;   // une question laisse la place à l'autre
        if (/!$/.test(trimmed)) return 280;
        if (/\.$/.test(trimmed)) return 250;   // fin d'idée
        if (/[;:]$/.test(trimmed)) return 190; // articulation
        return 130;                            // virgule ou coupe de longueur
    }

    private selectBestFrenchVoice(preferredName?: string): SpeechSynthesisVoice | null {
        if (typeof window === 'undefined' || !window.speechSynthesis) return null;
        // Le cache (rafraîchi par `voiceschanged`) évite le [] du premier
        // appel ; on retente un getVoices() direct en dernier recours.
        const voices = this.cachedSynthesisVoices.length
            ? this.cachedSynthesisVoices
            : window.speechSynthesis.getVoices();
        const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));

        if (frenchVoices.length === 0) return null;

        if (preferredName) {
            const exact = frenchVoices.find(v => v.name.toLowerCase().includes(preferredName.toLowerCase()));
            if (exact) return exact;
        }

        // Ordre de préférence RÉFLÉCHI (l'ancien `frenchVoices[0]` retombait
        // souvent, sur Android, sur une voix compacte de basse qualité) :
        // 1. voix réseau de qualité (Google français sur Chrome, Natural/
        //    Neural sur Edge) ; 2. voix nommées réputées ; 3. fr-FR avant les
        //    autres variantes ; 4. sinon la première disponible.
        const byQuality =
            frenchVoices.find(v => /google.*fran|fran.*google/i.test(v.name)) ||
            frenchVoices.find(v => /natural|neural/i.test(v.name)) ||
            frenchVoices.find(v =>
                v.name.includes('Henri') ||
                v.name.includes('Denise') ||
                v.name.includes('Thomas') ||
                v.name.includes('Audrey') ||
                v.name.includes('Siri')
            ) ||
            frenchVoices.find(v => v.lang === 'fr-FR');

        return byQuality || frenchVoices[0];
    }

    private finishSpeakingBrowser(options?: { onEnd?: () => void }) {
        this.stopHeartbeat();
        const wasRunning = this.isProcessingQueue || this.isSpeaking;
        this.isProcessingQueue = false;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifySpeakingState(false);
        options?.onEnd?.();

        // Task force P0 (S3-B) : la file s'est vidée sans qu'UNE SEULE phrase
        // ait réellement démarré (environnement sans voix utilisable,
        // utterances toutes perdues) — jamais un faux « j'ai parlé » : l'échec
        // est signalé, la réponse reste lisible à l'écran, et le verrou
        // d'identité n'a pas été posé (la prochaine réponse retente le HD).
        if (wasRunning && !this.browserRunHadStart) {
            this.trace('repli navigateur : AUCUNE phrase dite — échec signalé');
            this.listeners.forEach(l => l.onError?.(SPEECH_OUTPUT_FAILED_MESSAGE));
        } else if (wasRunning) {
            this.trace('repli navigateur : lecture terminée');
        }

        if (this.isConversationalMode) {
            this.notifyConversationalTurn('waiting_user');
            setTimeout(() => {
                if (this.isConversationalMode && !this.isSpeaking && !this.isListening) {
                    this.trace('micro relancé après réponse');
                    this.startListening('fr-FR');
                }
            }, 350);
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }, 12000);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    public stopSpeaking() {
        // Invalide toute continuation asynchrone en vol (génération HD,
        // enchaînement de segments) : rien de ce qui a été demandé avant cet
        // arrêt ne produira plus jamais de son (§14 — fermeture nette).
        this.speakEpoch += 1;
        this.stopHeartbeat();
        this.speechQueue = [];
        this.isProcessingQueue = false;

        // Arrêt Audio Element ElevenLabs
        if (this.currentAudioElement) {
            try {
                this.currentAudioElement.pause();
                this.currentAudioElement.currentTime = 0;
            } catch (e) {}
            this.currentAudioElement = null;
        }

        // Arrêt Synthèse Système
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }

        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifySpeakingState(false);
    }

    private notifySpeakingState(speaking: boolean) {
        // Synchro labiale : un seul point de vérité. Quel que soit le chemin
        // qui met fin à la parole — fin naturelle, `stopSpeaking()`, erreur —
        // la mesure s'arrête ici et la bouche se referme. Sans cela, une
        // boucle d'animation survivrait à la voix.
        if (!speaking) this.stopOutputLevelLoop();
        this.listeners.forEach(l => l.onSpeakingStateChange?.(speaking));
    }

    private async startVolumeMonitoring() {
        try {
            if (!navigator.mediaDevices?.getUserMedia) return;
            if (this.mediaStream) return;

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                if (!this.analyser || !this.isListening || this.isSpeaking) {
                    this.listeners.forEach(l => l.onSpeechVolume?.(0));
                    if (this.isListening) {
                        this.animationFrameId = requestAnimationFrame(updateVolume);
                    }
                    return;
                }

                this.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / bufferLength;
                const normalized = Math.min(100, Math.round((avg / 128) * 100));
                this.listeners.forEach(l => l.onSpeechVolume?.(normalized));

                this.animationFrameId = requestAnimationFrame(updateVolume);
            };

            updateVolume();
        } catch (e) {
            console.warn("Volume monitoring notice:", e);
        }
    }

    private stopVolumeMonitoring() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.listeners.forEach(l => l.onSpeechVolume?.(0));
    }
}

export const voiceEngine = VoiceEngine.getInstance();
