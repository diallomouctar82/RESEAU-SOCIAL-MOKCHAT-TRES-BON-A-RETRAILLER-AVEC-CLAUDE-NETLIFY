// ═══════════════════════════════════════════════════════════════════════════
// 🎙️ VOICE ENGINE - SYNTHÈSE VOCALE & RECONNAISSANCE VOCALE FLUIDE
// ═══════════════════════════════════════════════════════════════════════════

export interface VoiceEngineListener {
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onSpeechVolume?: (volume: number) => void;
}

export class VoiceEngine {
    private static instance: VoiceEngine;
    private recognition: any = null;
    private isListening: boolean = false;
    private isSpeaking: boolean = false;
    private listeners: Set<VoiceEngineListener> = new Set();
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private analyser: AnalyserNode | null = null;
    private animationFrameId: number | null = null;

    private constructor() {
        this.initSpeechRecognition();
    }

    public static getInstance(): VoiceEngine {
        if (!VoiceEngine.instance) {
            VoiceEngine.instance = new VoiceEngine();
        }
        return VoiceEngine.instance;
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

                if (finalTranscript) {
                    this.listeners.forEach(l => l.onTranscript?.(finalTranscript.trim(), true));
                } else if (interimTranscript) {
                    this.listeners.forEach(l => l.onTranscript?.(interimTranscript.trim(), false));
                }
            };

            this.recognition.onerror = (event: any) => {
                console.warn('Voice Engine Recognition event:', event.error);
                if (event.error !== 'no-speech') {
                    this.listeners.forEach(l => l.onError?.(event.error));
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.listeners.forEach(l => l.onEnd?.());
            };
        }
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
            this.recognition.start();
            this.startVolumeMonitoring();
            return true;
        } catch (e) {
            console.error("Erreur démarrage écoute vocale:", e);
            return false;
        }
    }

    public stopListening() {
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
     * Synthèse vocale fluide avec voix adaptée à l'expert Diallo
     */
    public speak(text: string, options?: { voiceName?: string; rate?: number; pitch?: number; onEnd?: () => void }) {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        // Arrêter la voix en cours
        window.speechSynthesis.cancel();

        // Nettoyer les emojis et symboles superflus pour une lecture naturelle
        const cleanText = text
            .replace(/[*#_`~]/g, '')
            .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/━━━━/g, '')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        utterance.rate = options?.rate || 1.05;
        utterance.pitch = options?.pitch || 1.0;

        const voices = window.speechSynthesis.getVoices();
        const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));

        if (frenchVoices.length > 0) {
            // Préférer les voix naturelles Google ou Thomas / Audrey
            const preferredVoice = frenchVoices.find(v => 
                v.name.includes('Natural') || 
                v.name.includes('Google') || 
                v.name.includes('Thomas') || 
                v.name.includes('Henri')
            ) || frenchVoices[0];
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            options?.onEnd?.();
        };

        utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            this.isSpeaking = false;
            options?.onEnd?.();
        };

        window.speechSynthesis.speak(utterance);
    }

    public stopSpeaking() {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
        }
    }

    private async startVolumeMonitoring() {
        try {
            if (!navigator.mediaDevices?.getUserMedia) return;
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
                if (!this.analyser || !this.isListening) return;
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
            console.warn("Volume monitoring inactive:", e);
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
