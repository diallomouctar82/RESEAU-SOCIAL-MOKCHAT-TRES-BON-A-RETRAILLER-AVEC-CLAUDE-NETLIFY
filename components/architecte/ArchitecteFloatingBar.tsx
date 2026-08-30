import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Loader2, X, UserRound } from 'lucide-react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { runArchitecteCommand, type ArchitectePhase } from '../../services/architecte/architecteBrain';
import { registerTaskCapabilities } from '../../services/architecte/taskCapabilityHandlers';
import { registerSettingsCapabilities } from '../../services/architecte/settingsCapabilityHandlers';
import type { UserProfile } from '../../types';

/**
 * L'ARCHITECTE — présence flottante permanente.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CONFORMITÉ À L'ORIGINAL
 * ─────────────────────────────────────────────────────────────────────────
 * Présentation et comportement natif repris fidèlement de l'Architecte
 * historique du dépôt `ARCHITECTE-BON-INSPIRATION-POUR-MOKNET-2026`
 * (`components/PlatformGuide.tsx`), conformément à la demande explicite :
 * même présentation, même fonctionnement, plus les améliorations de la
 * feuille de route.
 *
 * Repris à l'identique :
 *   - état fermé : pastille circulaire flottante en bas à droite
 *     (`bottom-36 md:bottom-24 right-4 md:right-8`), cyan sur fond sombre,
 *     bordure `cyan-500/30`, halo `animate-ping`, icône de compas ;
 *   - état ouvert : barre-pilule centrée en bas
 *     (`bottom-8 left-1/2 -translate-x-1/2`, `w-[90%] max-w-md`), fond
 *     `#0f172a/90`, `backdrop-blur-xl`, `rounded-full`, anneau cyan ;
 *   - à gauche, pastille d'avatar 48 px : cyan pleine + halo quand
 *     l'Architecte parle, cyan sombre bordée quand la session est active,
 *     rouge pulsante quand elle ne l'est pas, spinner pendant la connexion ;
 *   - libellé « L'Architecte » en capitales espacées, point vert pulsant
 *     quand la session est active, et sous-titre en police mono :
 *     dernier retour, sinon « En écoute... », sinon « Connexion... » ;
 *   - à droite, égaliseur à 5 barres cyan ;
 *   - à l'extrême droite, fermeture par une croix ;
 *   - comportement natif : un appui ouvre la barre ET démarre immédiatement
 *     l'écoute ; un second appui ferme et coupe la session.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CE QUI EST AMÉLIORÉ (feuille de route)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. L'égaliseur de l'original était explicitement factice (`Math.random()`,
 *    commenté « Fake Wave »). Ici il est alimenté par le VRAI niveau sonore
 *    du micro (`volume`, déjà exposé par `useVoiceAssistant`) : même langage
 *    visuel, donnée réelle — aucun signal fabriqué.
 * 2. L'original ne pilotait qu'UN outil (`navigate`). Ici la barre passe par
 *    le cerveau partagé (`architecteBrain`), donc par le registre de
 *    capacités et le bus d'exécution : navigation ET actions réelles, avec
 *    vérification de permission dans le code, confirmation proportionnelle
 *    au risque, et statuts d'exécution explicites — jamais un succès
 *    annoncé qui n'a pas eu lieu.
 * 3. L'original ouvrait une session audio native Gemini depuis le
 *    navigateur avec une clé API exposée (`GET /api/config`). Ici la voix
 *    passe par `useVoiceAssistant` → `ai-gateway`, clés côté serveur.
 * 4. Présent sur mobile ET desktop, alors que le seul point d'entrée
 *    permanent de MokNet était jusqu'ici réservé au desktop.
 * 5. Déplaçable : la pastille fermée se glisse au doigt/à la souris pour ne
 *    jamais masquer un contenu — sa position est mémorisée.
 */

interface ArchitecteFloatingBarProps {
    userProfile: UserProfile;
    onNavigate: (tab: string, context?: any) => void;
    /** Persistance réelle d'un réglage — `false` = rien n'a été enregistré. */
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
    /** Ouvre le modal de saisie clavier (même cerveau, autre incarnation). */
    onOpenTyped?: () => void;
}

const POSITION_STORAGE_KEY = 'lmav_architecte_bar_pos_v1';
const MIC_TIMEOUT_MESSAGE = "Le micro n'a pas démarré — utilisez la saisie.";

/** Couleur du sous-titre selon l'issue réelle — jamais du vert sur un échec. */
const PHASE_TONE: Record<ArchitectePhase, string> = {
    running: 'text-cyan-300/80',
    done: 'text-emerald-300',
    failed: 'text-red-300',
    denied: 'text-amber-300',
    unsupported: 'text-amber-300',
    cancelled: 'text-slate-400',
};

export const ArchitecteFloatingBar: React.FC<ArchitecteFloatingBarProps> = ({
    userProfile,
    onNavigate,
    onUpdateProfile,
    onOpenTyped,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [statusTone, setStatusTone] = useState<string>('text-cyan-300/80');
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);
    const listenWatchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Lu depuis le watchdog, qui s'exécute hors du rendu et ne verrait sinon
    // que la valeur figée de `isListening` au moment de sa création.
    const listeningRef = useRef(false);

    // Le profil est relu à chaque appel de handler via cette ref : un réglage
    // modifié entre-temps ne doit jamais être écrasé par une valeur périmée
    // capturée au moment de l'enregistrement.
    const profileRef = useRef(userProfile);
    useEffect(() => { profileRef.current = userProfile; }, [userProfile]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(POSITION_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') setOffset(parsed);
            }
        } catch { /* position non mémorisée : la valeur par défaut suffit */ }
    }, []);

    // Capacités portées par l'Architecte lui-même (aucun état d'écran requis) :
    // elles restent donc disponibles partout dans l'application.
    useEffect(() => {
        if (!userProfile.id) return;
        return registerTaskCapabilities(userProfile.id);
    }, [userProfile.id]);

    useEffect(() => {
        return registerSettingsCapabilities({
            getProfile: () => profileRef.current,
            updateProfile: onUpdateProfile,
        });
    }, [onUpdateProfile]);

    const {
        isListening, isSpeaking, isSupported, volume,
        transcript, startListening, stopListening, speak, stopSpeaking, setConversationalMode,
    } = useVoiceAssistant({
        lang: 'fr-FR',
        onFinalTranscript: (text) => { void handleCommand(text); },
    });

    useEffect(() => {
        listeningRef.current = isListening;
        // L'écoute a fini par démarrer : annuler le watchdog encore en
        // attente, et effacer son message s'il a déjà été affiché — sans quoi
        // la barre afficherait simultanément le point vert « en écoute » et
        // « le micro n'a pas démarré », deux états qui se contredisent.
        if (isListening) {
            if (listenWatchdog.current) { clearTimeout(listenWatchdog.current); listenWatchdog.current = null; }
            setStatus((prev) => (prev === MIC_TIMEOUT_MESSAGE ? '' : prev));
            setStatusTone((prev) => (prev === 'text-amber-300' ? 'text-cyan-300/80' : prev));
        }
    }, [isListening]);
    /**
     * Nettoyage au démontage — micro réellement relâché.
     *
     * Sans ceci, un démontage pendant une session ouverte (déconnexion,
     * démontage du Layout) laissait la reconnaissance vocale tourner et le
     * flux micro actif : `stopListening()` est ce qui déclenche, en chaîne,
     * `stopVolumeMonitoring()` → `mediaStream.getTracks().forEach(t =>
     * t.stop())` et la fermeture de l'`AudioContext`. Le seul effet de
     * nettoyage présent auparavant n'annulait que le watchdog.
     *
     * Deux précautions :
     *  - la coupure n'a lieu QUE si CETTE barre avait une session ouverte.
     *    `voiceEngine` est un singleton partagé (LIVE, coachs Carrière et
     *    Campus) : couper inconditionnellement au démontage d'une barre
     *    fermée interromprait la session d'un autre écran.
     *  - le nettoyage passe par une ref réévaluée à chaque rendu, pour lire
     *    l'état courant sans réexécuter l'effet — et donc sans provoquer un
     *    arrêt du micro à chaque changement de `isOpen`.
     */
    const teardownRef = useRef<() => void>(() => {});
    useEffect(() => {
        teardownRef.current = () => {
            if (listenWatchdog.current) { clearTimeout(listenWatchdog.current); listenWatchdog.current = null; }
            if (!isOpen) return;
            stopListening();
            stopSpeaking();
            setConversationalMode(false);
        };
    });
    useEffect(() => () => teardownRef.current(), []);

    const handleCommand = useCallback(async (command: string) => {
        if (!command.trim()) return;
        setIsThinking(true);
        setStatus('Analyse...');
        setStatusTone('text-cyan-300/80');
        try {
            const outcome = await runArchitecteCommand(command, {
                userName: profileRef.current.name,
                userLevel: profileRef.current.level,
                confirm: (message) => window.confirm(message),
                onPhase: (phase, message) => { setStatus(message); setStatusTone(PHASE_TONE[phase]); },
            });

            // Ce qui est prononcé est toujours le RÉSULTAT réel quand il y en
            // a un — jamais l'intention annoncée par le modèle si l'exécution
            // a ensuite échoué, été refusée ou annulée.
            const spoken = outcome.execution?.message || outcome.spoken;
            if (spoken) {
                setStatus(spoken);
                setStatusTone(outcome.execution ? PHASE_TONE[outcome.execution.phase] : 'text-cyan-300/80');
                void speak(spoken);
            }

            if (outcome.action?.type === 'NAVIGATE' && outcome.action.target) {
                const target = outcome.action.target;
                const payload = outcome.action.payload;
                setTimeout(() => onNavigate(target, payload), 1200);
            }
        } catch {
            const message = "Je n'ai pas compris. Reformulez, s'il vous plaît.";
            setStatus(message);
            setStatusTone('text-amber-300');
            void speak(message);
        } finally {
            setIsThinking(false);
        }
    }, [onNavigate, speak]);

    const open = useCallback(async () => {
        setIsOpen(true);
        setStatus('');
        setStatusTone('text-cyan-300/80');
        // Comportement natif de l'original : l'ouverture DÉMARRE la session
        // d'écoute, elle ne se contente pas d'afficher une barre.
        setConversationalMode(true);
        const started = await startListening();
        if (!started) {
            // Dégradation gracieuse : la barre reste utilisable, le modal
            // clavier prend le relais — on ne laisse jamais un micro muet
            // passer pour une session active.
            setStatus(isSupported ? 'Micro refusé — utilisez la saisie.' : 'Voix indisponible ici — utilisez la saisie.');
            setStatusTone('text-amber-300');
            return;
        }
        // `startListening` peut répondre `true` sans que la reconnaissance
        // démarre réellement (moteur absent, onglet sans geste utilisateur,
        // périphérique muet). L'original restait alors bloqué indéfiniment
        // sur « Connexion... » — un état qui ressemble à une attente normale
        // alors que rien n'écoute. On borne cette attente et on le dit.
        if (listenWatchdog.current) clearTimeout(listenWatchdog.current);
        listenWatchdog.current = setTimeout(() => {
            if (!listeningRef.current) {
                setStatus(MIC_TIMEOUT_MESSAGE);
                setStatusTone('text-amber-300');
            }
        }, 3000);
    }, [setConversationalMode, startListening, isSupported]);

    const close = useCallback(() => {
        if (listenWatchdog.current) { clearTimeout(listenWatchdog.current); listenWatchdog.current = null; }
        setIsOpen(false);
        setIsThinking(false);
        setStatus('');
        stopListening();
        stopSpeaking();
        setConversationalMode(false);
    }, [stopListening, stopSpeaking, setConversationalMode]);

    // ── Déplacement de la pastille fermée ───────────────────────────────────
    const onPointerDown = (e: React.PointerEvent) => {
        dragState.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y, moved: false };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        const d = dragState.current;
        if (!d) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        // Seuil : sous 4 px, c'est un clic, pas un glissement — sans quoi un
        // appui un peu tremblant n'ouvrirait jamais l'Architecte.
        if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        d.moved = true;
        setOffset({ x: d.baseX + dx, y: d.baseY + dy });
    };
    const onPointerUp = () => {
        const d = dragState.current;
        dragState.current = null;
        if (!d) return;
        if (d.moved) {
            try { localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(offset)); } catch { /* non bloquant */ }
            return;
        }
        void open();
    };

    // ── État fermé : pastille flottante (fidèle à l'original) ───────────────
    if (!isOpen) {
        return (
            <button
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, touchAction: 'none' }}
                // `bottom-44` sur mobile au lieu du `bottom-36` de l'original :
                // MokNet possède un bouton de messagerie flottant que
                // l'application d'origine n'avait pas, et à 36 la pastille
                // arrivait au contact de sa pastille de compteur. Seul écart
                // de position assumé — l'exigence « entièrement visible »
                // prime sur une équivalence au pixel dans une mise en page
                // différente. Desktop inchangé (`md:bottom-24`).
                className="fixed bottom-44 md:bottom-24 right-4 md:right-8 z-[60] flex items-center justify-center bg-cyan-900/80 hover:bg-cyan-600 text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(8,145,178,0.45)] transition-colors border-2 border-cyan-500/30 backdrop-blur-md"
                title="L'Architecte (Navigation Vocale)"
                aria-label="Ouvrir L'Architecte et démarrer l'écoute vocale"
            >
                <span className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-cyan-400 opacity-20" />
                    <Compass size={22} className="relative z-10 text-cyan-100" />
                </span>
            </button>
        );
    }

    // Sous-titre : dernier retour réel, sinon transcription en cours, sinon
    // l'état de la session — exactement la cascade de l'original
    // (`lastTranscript || (isConnected ? "En écoute..." : "Connexion...")`).
    const subtitle = status || transcript || (isListening ? 'En écoute...' : 'Connexion...');

    return (
        <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md bg-[#0f172a]/90 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-2xl flex items-center justify-between p-2 pr-4 ring-1 ring-cyan-500/50"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-4 min-w-0">
                <button
                    onClick={close}
                    className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${
                        isSpeaking
                            ? 'bg-cyan-500 shadow-[0_0_20px_#06b6d4] animate-pulse'
                            : isListening
                                ? 'bg-cyan-900/50 border border-cyan-500'
                                : 'bg-red-500/20 border border-red-500 animate-pulse'
                    }`}
                    aria-label="Fermer L'Architecte"
                >
                    {isThinking
                        ? <Loader2 size={18} className="animate-spin text-cyan-200" />
                        : <UserRound size={18} className={isSpeaking ? 'text-white' : 'text-cyan-400'} />}
                </button>

                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        L'Architecte
                        {isListening && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    </span>
                    <span className={`text-[10px] font-mono truncate max-w-[180px] ${statusTone}`}>
                        {subtitle}
                    </span>
                </div>
            </div>

            {/* Égaliseur — même langage visuel que l'original, mais piloté par
                le VRAI niveau sonore du micro plutôt que par Math.random(). */}
            <div className="flex items-center gap-1 h-6 shrink-0" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => {
                    const active = isSpeaking || isListening;
                    // Les barres centrales réagissent plus fort que les
                    // extrêmes : une forme d'onde, pas cinq barres identiques.
                    const weight = [0.45, 0.75, 1, 0.75, 0.45][i];
                    const height = active ? Math.max(4, Math.min(20, 4 + volume * 40 * weight)) : 4;
                    return (
                        <div
                            key={i}
                            className={`w-1 bg-cyan-400 rounded-full transition-[height] duration-75 ${active ? '' : 'opacity-30'}`}
                            style={{ height: `${height}px` }}
                        />
                    );
                })}
            </div>

            {onOpenTyped && (
                <button
                    onClick={() => { close(); onOpenTyped(); }}
                    className="ml-3 text-[10px] font-bold uppercase tracking-wider text-cyan-300/70 hover:text-cyan-200 transition-colors shrink-0"
                    title="Écrire au lieu de parler"
                >
                    Écrire
                </button>
            )}

            <button onClick={close} className="ml-3 text-gray-400 hover:text-white transition-colors shrink-0" aria-label="Fermer">
                <X size={18} />
            </button>
        </div>
    );
};
