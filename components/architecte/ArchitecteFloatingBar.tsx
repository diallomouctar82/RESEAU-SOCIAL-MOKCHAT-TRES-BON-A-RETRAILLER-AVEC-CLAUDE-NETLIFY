import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, DraftingCompass, Keyboard, Loader2, Paperclip, ScanLine, X, UserRound } from 'lucide-react';
import { analyzeImage, generateText } from '../../services/aiGateway';
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
    // Hors-ligne, en attente d'envoi : ni le vert du succès, ni le rouge de
    // l'échec — l'action n'est ni faite ni perdue.
    queued: 'text-sky-300',
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

    // ─────────────────────────────────────────────────────────────────────
    // L'ARCHITECTE REGARDE — pièce jointe et caméra.
    //
    // Trois boutons alignés à droite de la barre : joindre un fichier, écrire,
    // ouvrir la caméra. Aucun n'est décoratif : l'image part réellement vers
    // `analyzeImage` (vision déjà branchée sur l'orchestrateur `ai-gateway`),
    // et l'Architecte répond à voix haute. Un format que le dépôt ne sait pas
    // lire le dit franchement plutôt que d'échouer en silence.
    // ─────────────────────────────────────────────────────────────────────

    /** Dit et affiche un résultat d'analyse, avec la même discipline que handleCommand. */
    const announce = useCallback((message: string, tone: string) => {
        setStatus(message);
        setStatusTone(tone);
        void speak(message);
    }, [speak]);

    const analyseVisual = useCallback(async (base64: string, mimeType: string, contexte: string) => {
        setIsThinking(true);
        setStatus('Je regarde...');
        setStatusTone('text-cyan-300/80');
        try {
            const reponse = await analyzeImage(
                base64,
                mimeType,
                `${contexte} Décris ce que tu vois et donne ton avis utile, en deux phrases maximum, en français.`,
                { systemInstruction: "Tu es L'Architecte de MokNet. Tu décris ce que tu vois RÉELLEMENT. Si l'image est floue, vide ou illisible, tu le dis au lieu d'inventer." }
            );
            announce(reponse?.trim() || "Je n'ai rien pu tirer de cette image.", reponse ? 'text-cyan-300/80' : 'text-amber-300');
        } catch (e: any) {
            announce(`L'analyse a échoué : ${e?.message || 'raison inconnue'}.`, 'text-red-300');
        } finally {
            setIsThinking(false);
        }
    }, [announce]);

    // --- Pièce jointe ---------------------------------------------------

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    /** Formats binaires qu'aucune bibliothèque du dépôt ne sait ouvrir. */
    const isUnreadableBinary = (file: File) =>
        /\.(xlsx|xls|docx|doc|pptx|ppt|zip|rar)$/i.test(file.name) ||
        file.type.includes('officedocument') ||
        file.type.includes('ms-excel') ||
        file.type.includes('msword');

    const handleFilePicked = useCallback(async (file: File | undefined) => {
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = String(reader.result || '');
                const base64 = dataUrl.split(',')[1];
                if (!base64) { announce("Ce fichier image n'a pas pu être lu.", 'text-amber-300'); return; }
                void analyseVisual(base64, file.type, `Voici une image que l'utilisateur me montre (fichier « ${file.name} »).`);
            };
            reader.onerror = () => announce("La lecture du fichier a échoué.", 'text-red-300');
            reader.readAsDataURL(file);
            return;
        }

        if (isUnreadableBinary(file)) {
            // Honnêteté : aucun analyseur Excel/Word/PowerPoint n'existe dans
            // ce dépôt. Le dire vaut mieux qu'un échec silencieux ou qu'une
            // réponse inventée à partir d'octets illisibles.
            announce(
                `Je ne sais pas encore ouvrir un fichier ${file.name.split('.').pop()?.toUpperCase()}. Exportez-le en PDF, en texte ou en image, et je le lirai.`,
                'text-amber-300'
            );
            return;
        }

        if (file.type === 'application/pdf') {
            announce("Je ne sais pas encore lire un PDF. Envoyez-moi une capture d'écran de la page qui vous intéresse.", 'text-amber-300');
            return;
        }

        // Texte lisible tel quel : txt, csv, json, markdown, code...
        try {
            const texte = (await file.text()).slice(0, 12000);
            if (!texte.trim()) { announce('Ce fichier est vide.', 'text-amber-300'); return; }
            setIsThinking(true);
            setStatus('Je lis le document...');
            setStatusTone('text-cyan-300/80');
            const reponse = await generateText(
                `Voici le contenu du fichier « ${file.name} » :\n\n${texte}\n\nRésume-le et donne ton avis utile, en deux phrases maximum, en français.`,
                { systemInstruction: "Tu es L'Architecte de MokNet. Tu t'appuies uniquement sur le contenu fourni et tu n'inventes rien." }
            );
            announce(reponse?.trim() || "Je n'ai rien pu tirer de ce document.", 'text-cyan-300/80');
        } catch (e: any) {
            announce(`La lecture a échoué : ${e?.message || 'raison inconnue'}.`, 'text-red-300');
        } finally {
            setIsThinking(false);
        }
    }, [analyseVisual, announce]);

    // --- Caméra ---------------------------------------------------------

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const closeCamera = useCallback(() => {
        // Relâcher réellement la caméra : sans cet arrêt explicite, la diode
        // reste allumée après la fermeture — le même défaut que celui corrigé
        // sur le micro au démontage de la barre.
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsCameraOpen(false);
    }, []);

    const openCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            announce("Ce navigateur ne donne pas accès à la caméra.", 'text-amber-300');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            streamRef.current = stream;
            setIsCameraOpen(true);
            // Le <video> n'existe qu'une fois le panneau rendu.
            setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } }, 0);
        } catch (e: any) {
            announce(
                e?.name === 'NotAllowedError'
                    ? "Accès à la caméra refusé. Autorisez-le dans votre navigateur pour me montrer quelque chose."
                    : "La caméra n'a pas pu démarrer.",
                'text-amber-300'
            );
        }
    }, [announce]);

    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) { announce("L'image n'est pas encore prête, réessayez.", 'text-amber-300'); return; }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        closeCamera();
        if (base64) void analyseVisual(base64, 'image/jpeg', "Voici ce que l'utilisateur me montre avec sa caméra.");
    }, [analyseVisual, announce, closeCamera]);

    // La caméra ne doit jamais survivre au démontage de la barre.
    useEffect(() => () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

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
                // Conforme à la référence de l'état FERMÉ/INACTIF fournie :
                // disque navy profond et mat, anneau cyan discret, compas de
                // dessinateur clair au centre. Volontairement calme — pas de
                // halo pulsant : au repos, l'Architecte ne réclame pas
                // l'attention, il se tient disponible.
                className="fixed bottom-44 md:bottom-24 right-4 md:right-8 z-[60] flex items-center justify-center w-14 h-14 rounded-full bg-[#16222f] hover:bg-[#1c2c3d] text-white border border-cyan-300/30 ring-1 ring-inset ring-white/[0.06] shadow-[0_0_26px_rgba(34,211,238,0.30),0_8px_28px_rgba(0,0,0,0.55)] transition-colors backdrop-blur-md"
                title="L'Architecte (Navigation Vocale)"
                aria-label="Ouvrir L'Architecte et démarrer l'écoute vocale"
            >
                <DraftingCompass size={24} className="text-cyan-100/90" strokeWidth={1.75} />
            </button>
        );
    }

    // Sous-titre : dernier retour réel, sinon transcription en cours, sinon
    // l'état de la session — exactement la cascade de l'original
    // (`lastTranscript || (isConnected ? "En écoute..." : "Connexion...")`).
    const subtitle = status || transcript || (isListening ? 'En écoute...' : 'Connexion...');
    /** Micro réellement en panne — pas simplement « pas encore démarré ». */
    const micFailed = status === MIC_TIMEOUT_MESSAGE;

    return (
        <>
        {/* Panneau caméra — AU-DESSUS de la barre, jamais à sa place : on voit
            ce que l'Architecte va regarder avant de le lui envoyer. */}
        {isCameraOpen && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[61] w-[90%] max-w-lg rounded-2xl overflow-hidden bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/40 ring-1 ring-cyan-500/40 shadow-[0_0_32px_rgba(34,211,238,0.25),0_18px_45px_rgba(0,0,0,0.6)]">
                <video ref={videoRef} playsInline muted className="w-full h-56 object-cover bg-black" />
                <div className="flex items-center justify-between gap-3 p-3">
                    <span className="text-[11px] font-mono text-cyan-300/80 truncate">
                        Cadrez ce que vous voulez me montrer.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={closeCamera}
                            className="rounded-full border border-slate-500/50 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-500/20 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={captureFrame}
                            className="flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-400/25 px-3.5 py-1.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/35 transition-colors"
                        >
                            <ScanLine size={13} />
                            Analyser
                        </button>
                    </div>
                </div>
            </div>
        )}
        <div
            // Halo cyan d'après la capture en contexte fournie ; largeur
            // portée à `max-w-2xl` parce que la barre porte désormais TROIS
            // boutons d'action : à 512px l'égaliseur se retrouvait écrasé
            // entre le titre et les boutons, ce qui n'est ni la référence ni
            // lisible.
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-cyan-500/30 rounded-full shadow-[0_0_32px_rgba(34,211,238,0.22),0_18px_45px_rgba(0,0,0,0.55)] flex items-center justify-between p-2 pr-4 ring-1 ring-cyan-500/50"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-4 min-w-0">
                <button
                    onClick={close}
                    // L'anneau rouge est réservé à un micro RÉELLEMENT en
                    // échec. Auparavant il s'affichait dès l'ouverture, avant
                    // même que l'écoute ait pu démarrer : la barre paraissait
                    // en panne à chaque ouverture, ce que la référence ne
                    // montre pas et ce qui n'était pas vrai.
                    className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${
                        isSpeaking
                            ? 'bg-cyan-500 shadow-[0_0_20px_#06b6d4] animate-pulse'
                            : micFailed
                                ? 'bg-red-500/20 border border-red-500 animate-pulse'
                                : 'bg-cyan-900/50 border border-cyan-500'
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

            {/* Trois boutons d'action alignés, à l'emplacement et dans la forme
                du « Module ZIP » de la référence — pilules bordées cyan.
                L'Architecte n'est pas seulement une oreille : on peut lui
                donner un fichier à lire, lui écrire, ou lui montrer quelque
                chose avec la caméra. Chacun exécute une action réelle. */}
            <div className="ml-3 flex items-center gap-2 shrink-0">
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.txt,.csv,.json,.md,.pdf,.xlsx,.xls,.docx,.doc"
                    onChange={(e) => { void handleFilePicked(e.target.files?.[0]); e.target.value = ''; }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                    title="Joindre un fichier à montrer à l'Architecte"
                    aria-label="Joindre un fichier"
                >
                    <Paperclip size={13} />
                    <span className="hidden sm:inline">Fichier</span>
                </button>

                {onOpenTyped && (
                    <button
                        onClick={() => { close(); onOpenTyped(); }}
                        className="flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/20 transition-colors"
                        title="Écrire au lieu de parler"
                        aria-label="Écrire à l'Architecte"
                    >
                        <Keyboard size={13} />
                        <span className="hidden sm:inline">Écrire</span>
                    </button>
                )}

                <button
                    onClick={() => (isCameraOpen ? closeCamera() : void openCamera())}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                        isCameraOpen
                            ? 'border-cyan-300 bg-cyan-400/25 text-cyan-100'
                            : 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20'
                    }`}
                    title="Montrer quelque chose à l'Architecte avec la caméra"
                    aria-label="Activer la caméra"
                >
                    <Camera size={13} />
                    <span className="hidden sm:inline">Caméra</span>
                </button>
            </div>

            <button onClick={close} className="ml-3 text-gray-400 hover:text-white transition-colors shrink-0" aria-label="Fermer">
                <X size={18} />
            </button>
        </div>
        </>
    );
};
