// ═══════════════════════════════════════════════════════════════════════════
// 🎙️ VOICE ENGINE PRO + ELEVENLABS HD — SYNTHÈSE VOCALE HAUTE FIDÉLITÉ
// ═══════════════════════════════════════════════════════════════════════════

import { generateSpeech } from './aiGateway';

export interface VoiceEngineListener {
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onSpeechVolume?: (volume: number) => void;
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

    // ElevenLabs state & cache
    private currentAudioElement: HTMLAudioElement | null = null;
    private currentAudioUrl: string | null = null;
    private audioCache: Map<string, string> = new Map(); // Cache des URLs audio générées
    private isElevenLabsAvailable: boolean = true;
    private preferredEngine: 'auto' | 'elevenlabs' | 'browser' = 'auto';
    private currentActiveEngine: 'elevenlabs' | 'browser_native' = 'elevenlabs';

    // Browser Native Speech Queue fallback
    private speechQueue: string[] = [];
    private isProcessingQueue: boolean = false;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private heartbeatInterval: any = null;

    private constructor() {
        this.initSpeechRecognition();
        this.loadSettings();
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
                // Si l'assistant est en train de parler, ignorer pour éviter l'écho acoustique
                if (this.isSpeaking) return;

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

                if (currentText) {
                    this.lastSpokenTranscript = currentText;
                    this.listeners.forEach(l => l.onTranscript?.(currentText, !!finalTranscript));

                    // En mode conversationnel continu : réinitialiser le timer VAD
                    if (this.isConversationalMode) {
                        this.resetVadSilenceTimer();
                    }
                }
            };

            this.recognition.onerror = (event: any) => {
                if (event.error !== 'no-speech') {
                    console.warn('Notification reconnaissance vocale:', event.error);
                    this.listeners.forEach(l => l.onError?.(event.error));
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.listeners.forEach(l => l.onEnd?.());

                // Reprise automatique si le mode conversationnel est toujours actif et l'IA ne parle pas
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
        if (!enabled) {
            if (this.vadSilenceTimer) clearTimeout(this.vadSilenceTimer);
        }
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
            onStart?: () => void;
            onEnd?: () => void;
        }
    ) {
        if (!text || typeof window === 'undefined') return;

        // Arrêter toute diction en cours
        this.stopSpeaking();

        const cleanedText = this.formatForSpokenVoice(text);
        if (!cleanedText) return;

        const effectiveVoiceId = options?.voiceId || this.getVoiceIdForAgent(options?.voiceName);

        // Si l'utilisateur a forcé le moteur navigateur
        if (this.preferredEngine === 'browser') {
            this.fallbackToBrowserSpeech(cleanedText, options);
            return;
        }

        // Essayer d'abord la synthèse vocale ElevenLabs HD
        try {
            const success = await this.speakWithElevenLabs(cleanedText, effectiveVoiceId, options);
            if (!success) {
                console.log("ℹ️ Transition gracieuse vers le moteur vocal natif...");
                this.fallbackToBrowserSpeech(cleanedText, options);
            }
        } catch (e) {
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
    private async speakWithElevenLabs(
        text: string,
        voiceId: string,
        options?: {
            stability?: number;
            similarity_boost?: number;
            onStart?: () => void;
            onEnd?: () => void;
        }
    ): Promise<boolean> {
        const cacheKey = `${voiceId}_${text.slice(0, 80)}_${text.length}`;

        let audioBlobUrl = this.audioCache.get(cacheKey);

        if (!audioBlobUrl) {
            let audioBase64: string;
            try {
                audioBase64 = await generateSpeech(text, { voiceId });
            } catch (e) {
                console.warn("Synthèse vocale via l'orchestrateur indisponible:", e);
                return false;
            }
            if (!audioBase64) return false;

            audioBlobUrl = `data:audio/mpeg;base64,${audioBase64}`;
            this.audioCache.set(cacheKey, audioBlobUrl);
        }

        // Lecture de l'audio haute fidélité
        return new Promise<boolean>((resolve) => {
            try {
                // Pause du micro pendant la lecture
                if (this.isListening && this.recognition) {
                    try { this.recognition.stop(); } catch (e) {}
                }

                const audio = new Audio(audioBlobUrl);
                this.currentAudioElement = audio;
                this.currentAudioUrl = audioBlobUrl;

                this.isSpeaking = true;
                this.currentActiveEngine = 'elevenlabs';
                this.notifySpeakingState(true);
                this.notifyConversationalTurn('ai_speaking');
                this.listeners.forEach(l => l.onTtsEngineChange?.('elevenlabs'));
                options?.onStart?.();

                audio.onended = () => {
                    this.finishSpeakingElevenLabs(options);
                    resolve(true);
                };

                audio.onerror = (e) => {
                    console.warn("Erreur lecture audio ElevenLabs:", e);
                    this.finishSpeakingElevenLabs(options);
                    resolve(false);
                };

                audio.play().catch((err) => {
                    console.warn("Échec lecture autoplay audio:", err);
                    this.finishSpeakingElevenLabs(options);
                    resolve(false);
                });

            } catch (err) {
                console.warn("Erreur initialisation Audio ElevenLabs:", err);
                resolve(false);
            }
        });
    }

    private finishSpeakingElevenLabs(options?: { onEnd?: () => void }) {
        this.isSpeaking = false;
        this.currentAudioElement = null;
        this.notifySpeakingState(false);
        options?.onEnd?.();

        if (this.isConversationalMode) {
            this.notifyConversationalTurn('waiting_user');
            setTimeout(() => {
                if (this.isConversationalMode && !this.isSpeaking && !this.isListening) {
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

        if (this.isListening && this.recognition) {
            try { this.recognition.stop(); } catch (e) {}
        }

        this.speechQueue = phrases;
        this.isProcessingQueue = true;
        this.isSpeaking = true;
        this.currentActiveEngine = 'browser_native';
        this.notifySpeakingState(true);
        this.notifyConversationalTurn('ai_speaking');
        this.listeners.forEach(l => l.onTtsEngineChange?.('browser_native'));
        options?.onStart?.();

        this.startHeartbeat();
        this.processNextInQueue(options);
    }

    private splitIntoAcousticPhrases(text: string): string[] {
        const cleaned = this.formatForSpokenVoice(text);
        if (!cleaned) return [];

        const rawPhrases = cleaned.split(/(?<=[.!?;\n])\s+/);
        const phrases: string[] = [];

        for (const raw of rawPhrases) {
            const p = raw.trim();
            if (!p) continue;

            if (p.length > 140) {
                const subParts = p.split(/(?<=[,])\s+/);
                let currentChunk = '';
                for (const sub of subParts) {
                    if ((currentChunk + ' ' + sub).length > 140 && currentChunk) {
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
        utterance.pitch = options?.pitch || 1.0;

        const bestVoice = this.selectBestFrenchVoice(options?.voiceName);
        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        utterance.onend = () => {
            setTimeout(() => {
                if (this.isProcessingQueue) {
                    this.processNextInQueue(options);
                }
            }, 120);
        };

        utterance.onerror = (e) => {
            console.warn('Speech chunk notice:', e);
            if (this.isProcessingQueue) {
                this.processNextInQueue(options);
            }
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    private selectBestFrenchVoice(preferredName?: string): SpeechSynthesisVoice | null {
        if (typeof window === 'undefined' || !window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));

        if (frenchVoices.length === 0) return null;

        if (preferredName) {
            const exact = frenchVoices.find(v => v.name.toLowerCase().includes(preferredName.toLowerCase()));
            if (exact) return exact;
        }

        const naturalVoice = frenchVoices.find(v => 
            v.name.includes('Natural') || 
            v.name.includes('Google') || 
            v.name.includes('Henri') || 
            v.name.includes('Denise') || 
            v.name.includes('Thomas') || 
            v.name.includes('Audrey') || 
            v.name.includes('Siri')
        );

        return naturalVoice || frenchVoices[0];
    }

    private finishSpeakingBrowser(options?: { onEnd?: () => void }) {
        this.stopHeartbeat();
        this.isProcessingQueue = false;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifySpeakingState(false);
        options?.onEnd?.();

        if (this.isConversationalMode) {
            this.notifyConversationalTurn('waiting_user');
            setTimeout(() => {
                if (this.isConversationalMode && !this.isSpeaking && !this.isListening) {
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
