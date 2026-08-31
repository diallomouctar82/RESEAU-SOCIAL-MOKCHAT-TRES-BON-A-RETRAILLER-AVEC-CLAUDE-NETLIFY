// Adaptateur React unique au-dessus de services/voiceEngine.ts. Chaque
// assistant vocal (DialloOS, Coach Carrière 3D, Coach Campus, Copilote
// Business...) passait par son propre câblage manuel du même singleton, ou
// pire, par sa propre reconnaissance vocale maison — ce hook centralise cet
// abonnement (une seule fois, pas une fois par composant) et la résolution
// de la voix, sans dupliquer la mécanique déjà correcte de voiceEngine.ts.

import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceEngine, type VoiceEngineListener } from '../services/voiceEngine';
import { Agent } from '../types';

export interface UseVoiceAssistantOptions {
    // Sert à résoudre une voix par défaut cohérente avec l'expert quand
    // aucun voiceId explicite n'est fourni à speak().
    agent?: Agent;
    voiceId?: string;
    /** Réglages fins du fournisseur HD (ElevenLabs). Optionnels — les écrans
     * qui n'en passent pas gardent les défauts du fournisseur, inchangés. */
    voiceSettings?: { stability?: number; similarity_boost?: number; style?: number };
    lang?: string;
    onFinalTranscript?: (transcript: string) => void;
    onInterimTranscript?: (transcript: string) => void;
}

export interface UseVoiceAssistantResult {
    isListening: boolean;
    isSpeaking: boolean;
    isSupported: boolean;
    volume: number;
    transcript: string;
    error: string | null;
    conversationalTurn: 'user_speaking' | 'ai_thinking' | 'ai_speaking' | 'waiting_user' | null;
    /** Moteur vocal réellement en train de parler (HD ou voix de secours du
     * navigateur) — permet à l'interface de dire honnêtement quelle voix
     * parle au lieu d'une bascule invisible. */
    ttsEngine: 'elevenlabs' | 'browser_native' | null;
    startListening: (lang?: string) => Promise<boolean>;
    stopListening: () => void;
    speak: (text: string, opts?: { voiceId?: string; onStart?: () => void; onEnd?: () => void }) => Promise<void>;
    stopSpeaking: () => void;
    setConversationalMode: (enabled: boolean) => void;
    resolveVoiceId: (explicit?: string) => string;
}

let voiceAssistantInstanceCounter = 0;

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}): UseVoiceAssistantResult {
    const { agent, voiceId, voiceSettings, lang = 'fr-FR' } = options;
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [conversationalTurn, setConversationalTurn] = useState<UseVoiceAssistantResult['conversationalTurn']>(null);
    const [ttsEngine, setTtsEngine] = useState<UseVoiceAssistantResult['ttsEngine']>(null);

    // Identité stable de CETTE instance du hook — sert de propriétaire de la
    // session vocale (voir voiceEngine : un seul écran reçoit les
    // transcriptions à la fois, fin du « plusieurs assistants répondent à la
    // même phrase »).
    const ownerIdRef = useRef<string>('');
    if (!ownerIdRef.current) {
        voiceAssistantInstanceCounter += 1;
        ownerIdRef.current = `voice-owner-${voiceAssistantInstanceCounter}`;
    }

    // Les callbacks passés en options changent souvent de référence d'un
    // rendu à l'autre (fonctions inline) : les lire depuis une ref évite de
    // désabonner/réabonner voiceEngine à chaque rendu du composant appelant.
    const onFinalRef = useRef(options.onFinalTranscript);
    const onInterimRef = useRef(options.onInterimTranscript);
    useEffect(() => { onFinalRef.current = options.onFinalTranscript; }, [options.onFinalTranscript]);
    useEffect(() => { onInterimRef.current = options.onInterimTranscript; }, [options.onInterimTranscript]);

    useEffect(() => {
        const myId = ownerIdRef.current;
        const listener: VoiceEngineListener = {
            onStart: () => setIsListening(true),
            onEnd: () => setIsListening(false),
            onError: (err) => setError(err),
            onSpeechVolume: (v) => setVolume(v),
            onSpeakingStateChange: (speaking) => setIsSpeaking(speaking),
            onConversationalTurnChange: (turn) => setConversationalTurn(turn),
            // Bascule de moteur vocal VISIBLE : l'interface peut dire quand la
            // voix de secours du navigateur remplace la voix HD (l'audit du
            // 31/08/2026 avait mesuré une bascule totalement invisible).
            onTtsEngineChange: (engine) => setTtsEngine(engine),
            onTranscript: (text, isFinal) => {
                // FILTRE DE PROPRIÉTÉ (mission Architecte §5) : quand un écran
                // possède la session vocale, LUI SEUL reçoit les
                // transcriptions — sans ce filtre, chaque écran monté
                // exécutait sa propre réponse à la même phrase (plusieurs
                // « intervenants » constatés en usage réel).
                const owner = voiceEngine.getTranscriptOwner();
                if (owner && owner !== myId) return;
                setTranscript(text);
                if (isFinal) onFinalRef.current?.(text);
                else onInterimRef.current?.(text);
            },
        };
        const remove = voiceEngine.addListener(listener);
        return () => {
            remove();
            // Démontage : ne jamais laisser un propriétaire fantôme.
            voiceEngine.releaseTemporaryOwnership(myId);
            voiceEngine.releaseConversationalOwnership(myId);
        };
    }, []);

    const resolveVoiceId = useCallback((explicit?: string): string => {
        return explicit || voiceId || agent?.metaProfile?.voiceId || voiceEngine.getVoiceIdForAgent(agent?.role);
    }, [agent, voiceId]);

    const startListening = useCallback((overrideLang?: string) => {
        setError(null);
        setTranscript('');
        // L'écran qui démarre l'écoute prend la main sur les transcriptions.
        voiceEngine.claimTemporaryOwnership(ownerIdRef.current);
        return voiceEngine.startListening(overrideLang || lang);
    }, [lang]);

    const stopListening = useCallback(() => {
        voiceEngine.releaseTemporaryOwnership(ownerIdRef.current);
        voiceEngine.stopListening();
    }, []);

    const speak = useCallback(async (text: string, opts?: { voiceId?: string; onStart?: () => void; onEnd?: () => void }) => {
        await voiceEngine.speak(text, { ...(voiceSettings ?? {}), ...opts, voiceId: resolveVoiceId(opts?.voiceId) });
    }, [resolveVoiceId, voiceSettings]);

    const stopSpeaking = useCallback(() => {
        voiceEngine.stopSpeaking();
    }, []);

    const setConversationalMode = useCallback((enabled: boolean) => {
        if (enabled) voiceEngine.claimConversationalOwnership(ownerIdRef.current);
        else voiceEngine.releaseConversationalOwnership(ownerIdRef.current);
        voiceEngine.setConversationalMode(enabled);
    }, []);

    return {
        isListening,
        isSpeaking,
        isSupported: voiceEngine.isSpeechRecognitionSupported(),
        volume,
        transcript,
        error,
        conversationalTurn,
        ttsEngine,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        setConversationalMode,
        resolveVoiceId,
    };
}
