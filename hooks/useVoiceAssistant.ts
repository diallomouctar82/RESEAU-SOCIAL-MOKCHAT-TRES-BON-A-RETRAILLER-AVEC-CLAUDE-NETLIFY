// Adaptateur React unique au-dessus de services/voiceEngine.ts. Chaque
// assistant vocal (DialloOS, Coach Carrière 3D, Coach Campus, Copilote
// Business...) passait par son propre câblage manuel du même singleton, ou
// pire, par sa propre reconnaissance vocale maison — ce hook centralise cet
// abonnement (une seule fois, pas une fois par composant) et la résolution
// de la voix, sans dupliquer la mécanique déjà correcte de voiceEngine.ts.

import type { MouthShape } from '../services/architecte/lipSync';
import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceEngine, type VoiceEngineListener, type VoiceTrackRef } from '../services/voiceEngine';
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
    /**
     * Niveau (0..1) de la voix que l'assistant PRONONCE — pour la synchro
     * labiale de l'avatar. Distinct de `volume`, qui mesure le micro de
     * l'utilisateur et se coupe précisément pendant que l'assistant parle.
     * Reste à 0 avec le moteur natif du navigateur, qui n'expose aucun flux.
     */
    outputVolume: number;
    /**
     * Le même niveau de sortie, par référence mutable mise à jour à chaque
     * image : pour l'avatar (lu dans sa boucle d'animation) — l'état
     * `outputVolume` n'est rafraîchi qu'à ~12 Hz, pour les jauges.
     */
    outputVolumeRef: { readonly current: number };
    /** Dernière frontière de mot de la voix intégrée du navigateur (repli) — par référence, pour l'avatar. */
    wordPulseRef: { readonly current: { at: number; length: number } | null };
    /** Forme de bouche mesurée sur la voix HD (visèmes), par référence, lue à chaque image par l'avatar. */
    mouthShapeRef: { readonly current: MouthShape | null };
    /** Piste phonétique alignée en cours de lecture (partition des gestes), par référence. */
    voiceTrackRef: { readonly current: VoiceTrackRef | null };
    /** `true` quand la bouche suit une piste phonétique alignée sur le texte (et non l'amplitude seule). */
    voiceAligned: boolean;
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
    const [outputVolume, setOutputVolume] = useState(0);
    const outputVolumeRef = useRef(0);
    const wordPulseRef = useRef<{ at: number; length: number } | null>(null);
    const mouthShapeRef = useRef<MouthShape | null>(null);
    const voiceTrackRef = useRef<VoiceTrackRef | null>(null);
    const [voiceAligned, setVoiceAligned] = useState(false);
    const outputVolumeUiAtRef = useRef(0);
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
            onWordBoundary: (pulse) => { wordPulseRef.current = pulse; },
            onMouthShape: (shape) => { mouthShapeRef.current = shape; },
            onVoiceTrack: (ref) => { voiceTrackRef.current = ref; },
            onLipSyncAligned: (aligned) => setVoiceAligned(aligned),
            onOutputVolume: (v) => {
                outputVolumeRef.current = v;
                // L'état React ne suit qu'à ~12 Hz (et tout de suite au retour à 0) :
                // à 60 Hz, il re-rendait toute la barre flottante à chaque image.
                const now = performance.now();
                if (v === 0 || now - outputVolumeUiAtRef.current > 80) {
                    outputVolumeUiAtRef.current = now;
                    setOutputVolume(v);
                }
            },
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
        outputVolume,
        outputVolumeRef,
        wordPulseRef,
        mouthShapeRef,
        voiceTrackRef,
        voiceAligned,
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
