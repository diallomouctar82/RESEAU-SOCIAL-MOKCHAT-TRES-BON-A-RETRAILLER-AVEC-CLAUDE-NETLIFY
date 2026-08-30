import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, DraftingCompass, Keyboard, Loader2, Paperclip, ScanLine, Send, X, UserRound } from 'lucide-react';
import { analyzeImage, generateText } from '../../services/aiGateway';
import {
    addSessionTurn,
    buildSessionContext,
    getLastSessionDocument,
    getLastSessionImage,
    getSessionTurns,
    subscribeToSession,
    type ArchitecteTurn,
} from '../../services/architecte/architecteSession';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { ELEVENLABS_CURATED_VOICES, MIC_UNAVAILABLE_MESSAGE } from '../../services/voiceEngine';

// Identité vocale de l'Architecte (Équipe V) — constantes de module :
// une référence STABLE (jamais un littéral re-créé à chaque rendu, qui
// invaliderait le `useCallback` du hook vocal à chaque frappe).
const ARCHITECTE_VOICE_ID = ELEVENLABS_CURATED_VOICES.professor.id;
const ARCHITECTE_VOICE_SETTINGS = { stability: 0.55, similarity_boost: 0.8, style: 0.15 } as const;
import {
    ARCHITECTE_AGENT_ID,
    buildArchitecteGreeting,
    isAffirmativeReply,
    isVisionQuestion,
    isWebSearchCommand,
    runArchitecteCommand,
    type ArchitectePhase,
} from '../../services/architecte/architecteBrain';
import { extractDocumentText, UnsupportedDocumentError } from '../../services/architecte/documentExtractor';
import { buildConsentRecap, CONSENT_STEPS, isConsentCommand, type ArchitecteConsent } from '../../services/architecte/consentFlow';
import {
    buildDeliverableBlob,
    deliverableFileName,
    detectDeliverableFormat,
    isDeliverableCommand,
    triggerDownload,
} from '../../services/architecte/deliverableBuilder';
import { registerTaskCapabilities } from '../../services/architecte/taskCapabilityHandlers';
import { registerSettingsCapabilities } from '../../services/architecte/settingsCapabilityHandlers';
import { registerSearchCapabilities } from '../../services/architecte/searchCapabilityHandlers';
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
}

const POSITION_STORAGE_KEY = 'lmav_architecte_bar_pos_v1';
const MIC_TIMEOUT_MESSAGE = "Le micro n'a pas démarré — utilisez la saisie.";

/**
 * SURFACE VISUELLE ADAPTATIVE (complément Équipe C — « la parole pilote
 * l'interface ») : UNE seule zone au-dessus de la barre, qui change de rôle
 * selon la tâche — retour caméra (déjà existant), lecteur vidéo, aperçu de
 * document, fil de conversation. Jamais un second assistant : le contenu
 * affiché appartient au même Architecte, même session, même contexte.
 */
type ArchitecteMediaView =
    | { kind: 'video'; query: string }
    | { kind: 'document'; name: string; excerpt: string };

/**
 * Extrait le sujet d'une demande de vidéo. Volontairement MINIMAL : seuls le
 * verbe déclencheur, la politesse et les mots « vidéo/chanson/youtube... »
 * sont retirés — le reste EST la recherche (« qui explique comment remplacer
 * la pièce » porte le sens, il doit rester).
 */
export function extractVideoQuery(command: string): string {
    return command
        .replace(/\b(mets?|lance|joue|montre|passe|cherche|trouve)[- ]?(moi|nous)?\b/gi, ' ')
        .replace(/\bs'il (te|vous) pla[îi]t\b/gi, ' ')
        .replace(/\b(une?|le|la|les|cette?|des)\s+(vid[ée]o|chanson|musique|clip)s?\b/gi, ' ')
        .replace(/\b(vid[ée]o|chanson|musique|clip)s?\b/gi, ' ')
        .replace(/\bsur youtube\b/gi, ' ')
        .replace(/\byoutube\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s.,!?:;-]+|[\s.,!?:;-]+$/g, '')
        .trim();
}

/** Demande de vidéo/musique — détection déterministe, jamais le modèle. */
export function isVideoRequest(command: string): boolean {
    return /\b(mets?|lance|joue|montre|passe)[^.!?]{0,60}\b(vid[ée]o|youtube|chanson|musique|clip)s?\b/i.test(command)
        || /\bsur youtube\b/i.test(command);
}

/** Le texte des tours peut contenir des adresses (recherche web citée) : les rendre cliquables. */
export function renderTextWithLinks(text: string): React.ReactNode {
    const parts = text.split(/(https?:\/\/[^\s)\]}>«»"']+)/g);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-cyan-300 hover:text-cyan-200 break-all">
                {part}
            </a>
        ) : (
            part
        )
    );
}

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
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [statusTone, setStatusTone] = useState<string>('text-cyan-300/80');
    // ── Session unique de l'Architecte ──────────────────────────────────
    // La barre affiche le fil réel (voix, clavier, photos, documents) tenu
    // par `architecteSession.ts` — le même que celui injecté au cerveau.
    // Exigence de la mission de finalisation : « 1 contexte, 1 historique »,
    // et le clavier ne bascule PLUS vers une seconde expérience (DialloOS) :
    // la saisie se fait ICI, dans la même barre, la même session.
    const [sessionTurns, setSessionTurns] = useState<ArchitecteTurn[]>(() => getSessionTurns());
    useEffect(() => subscribeToSession(() => setSessionTurns(getSessionTurns())), []);
    const [isTypingOpen, setIsTypingOpen] = useState(false);
    // Surface visuelle adaptative : un seul emplacement, un rôle par tâche
    // (lecteur vidéo, aperçu document) — apparaît quand la parole l'exige,
    // disparaît quand il n'y a plus qu'à parler.
    const [mediaView, setMediaView] = useState<ArchitecteMediaView | null>(null);
    const [typedText, setTypedText] = useState('');
    const typedInputRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (isTypingOpen) typedInputRef.current?.focus();
    }, [isTypingOpen]);
    // Le fil suit la conversation : toujours défiler vers le dernier tour.
    const conversationRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const el = conversationRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [sessionTurns]);
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

    // ── Comportement humain (Boucle 1) ──────────────────────────────────
    // `isOpenRef` : lu par les chemins asynchrones — fermé signifie
    // RÉELLEMENT silencieux, y compris pour une réponse arrivée après la
    // fermeture (§14). `hasGreetedRef` : l'accueil se fait UNE fois par
    // session de page, jamais à chaque ouverture (§2). `consentOfferRef` :
    // l'offre de configuration faite à la première rencontre — un « oui »
    // court l'accepte, toute autre réponse la laisse tomber sans insister
    // (savoir se taire, §8).
    const isOpenRef = useRef(false);
    useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    const hasGreetedRef = useRef(false);
    const consentOfferRef = useRef(false);
    // Les commandes vocales caméra sont routées via cette ref (les callbacks
    // caméra sont définis plus bas dans le fichier).
    const cameraControlRef = useRef<{ open: () => void; close: () => void }>({ open: () => {}, close: () => {} });

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

    // Recherche : lecture seule, RLS de la session — dernière capacité du
    // registre qui restait sans handler (défaut relevé par l'audit du
    // 30/08/2026 : annoncée par la découverte, jamais exécutable).
    useEffect(() => registerSearchCapabilities(), []);

    const {
        isListening, isSpeaking, isSupported, volume,
        transcript, error: voiceError, startListening, stopListening, speak, stopSpeaking, setConversationalMode,
    } = useVoiceAssistant({
        lang: 'fr-FR',
        // Identité vocale ATTITRÉE de l'Architecte (Équipe V §2/§9/§10) :
        // la même voix que le Professeur Diallo (George — « chaleureux,
        // érudit et posé »), la référence de stabilité citée par la mission,
        // déclarée explicitement au lieu de dépendre du repli par défaut.
        // Les réglages inclinent vers le calme et la proximité : stabilité
        // relevée (débit posé, moins de variations brusques), similarité
        // haute (timbre constant d'une phrase à l'autre), style léger
        // (de la vie, jamais de théâtre).
        voiceId: ARCHITECTE_VOICE_ID,
        voiceSettings: ARCHITECTE_VOICE_SETTINGS,
        onFinalTranscript: (text) => { void handleCommand(text); },
    });

    // Le moteur vocal a définitivement abandonné (autorisation micro refusée,
    // aucun périphérique de capture, ou plafond de relances atteint) : sans
    // ce relais, la barre restait sur « Connexion... » indéfiniment — le
    // watchdog local ayant déjà été annulé par le premier `onstart` d'une
    // reconnaissance qui échoue ensuite. Défaut mesuré par l'audit du
    // 30/08/2026 : 16 relances silencieuses en ~5 s, zéro signal visible.
    useEffect(() => {
        if (!isOpen || voiceError !== MIC_UNAVAILABLE_MESSAGE) return;
        if (listenWatchdog.current) { clearTimeout(listenWatchdog.current); listenWatchdog.current = null; }
        setStatus(MIC_TIMEOUT_MESSAGE);
        setStatusTone('text-amber-300');
    }, [voiceError, isOpen]);

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

    // ─────────────────────────────────────────────────────────────────────
    // L'ARCHITECTE REGARDE — pièce jointe et caméra.
    //
    // Trois boutons alignés à droite de la barre : joindre un fichier, écrire,
    // ouvrir la caméra. Aucun n'est décoratif : l'image part réellement vers
    // `analyzeImage` (vision déjà branchée sur l'orchestrateur `ai-gateway`),
    // et l'Architecte répond à voix haute. Un format que le dépôt ne sait pas
    // lire le dit franchement plutôt que d'échouer en silence.
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Dit et affiche un résultat, et l'inscrit dans le fil de la session.
     *
     * Fermé = RÉELLEMENT silencieux (§14) : une réponse qui arrive après la
     * fermeture (commande encore en vol) est conservée dans le fil mais
     * n'est JAMAIS prononcée — l'Architecte ne monologue pas en arrière-plan.
     */
    const announce = useCallback((message: string, tone: string) => {
        setStatus(message);
        setStatusTone(tone);
        addSessionTurn({ role: 'architecte', kind: 'texte', text: message });
        if (isOpenRef.current) void speak(message);
    }, [speak]);

    const analyseVisual = useCallback(async (base64: string, mimeType: string, contexte: string) => {
        setIsThinking(true);
        setStatus('Je regarde...');
        setStatusTone('text-cyan-300/80');
        try {
            const reponse = await analyzeImage(
                base64,
                mimeType,
                `${contexte} Réponds de façon utile et brève (trois phrases maximum), en français.`,
                {
                    // Règle absolue de la mission de finalisation : INTERDICTION
                    // D'INVENTER CE QU'IL VOIT. Constaté en usage réel : une
                    // « montre » affirmée alors qu'aucune n'était présente.
                    systemInstruction:
                        "Tu es L'Architecte de MokNet. Règles de vision absolues : " +
                        "1) Décris UNIQUEMENT ce qui est réellement et clairement visible dans l'image. " +
                        "2) N'affirme JAMAIS la présence d'un objet dont tu n'es pas certain — en cas de doute, dis explicitement « je ne suis pas sûr ». " +
                        "3) Si l'on te demande un élément qui n'apparaît pas dans l'image, réponds qu'il n'y apparaît pas. " +
                        "4) Image floue, sombre, vide ou illisible : dis-le au lieu d'inventer.",
                }
            );
            announce(reponse?.trim() || "Je n'ai rien pu tirer de cette image.", reponse ? 'text-cyan-300/80' : 'text-amber-300');
        } catch (e: any) {
            announce(`L'analyse a échoué : ${e?.message || 'raison inconnue'}.`, 'text-red-300');
        } finally {
            setIsThinking(false);
        }
    }, [announce]);

    // ── Fiche de consentement — formulaire rempli RÉELLEMENT, question par
    // question (§9/§18 de la mission de finalisation). L'état vit dans une
    // ref : les réponses arrivent par les mêmes canaux (voix, clavier) et
    // sont routées vers la fiche tant qu'elle est active. AUCUNE écriture
    // avant la confirmation du récapitulatif.
    const consentRef = useRef<{ step: number; answers: Partial<Omit<ArchitecteConsent, 'consentAt'>> } | null>(null);

    const handleConsentAnswer = useCallback(async (answer: string) => {
        addSessionTurn({ role: 'utilisateur', kind: 'texte', text: answer });
        if (/\b(annule|laisse tomber|stop|abandonne)\b/i.test(answer)) {
            consentRef.current = null;
            announce("Fiche annulée — rien n'a été enregistré.", 'text-slate-400');
            return;
        }
        const state = consentRef.current!;
        const step = CONSENT_STEPS[state.step];
        const value = step.parse(answer);
        if (value === undefined) {
            announce(step.reprompt, 'text-amber-300');
            return;
        }
        (state.answers as any)[step.key] = value;

        if (state.step + 1 < CONSENT_STEPS.length) {
            state.step += 1;
            announce(CONSENT_STEPS[state.step].question, 'text-cyan-300/80');
            return;
        }

        // Toutes les réponses sont là : récapitulatif, PUIS confirmation,
        // PUIS l'unique écriture réelle — dans cet ordre, jamais un autre.
        consentRef.current = null;
        const answers = state.answers as Omit<ArchitecteConsent, 'consentAt'>;
        const recap = buildConsentRecap(answers);
        announce(recap, 'text-cyan-300/80');
        if (!window.confirm(recap)) {
            announce('Fiche non enregistrée — dites « configure mes autorisations » pour recommencer.', 'text-slate-400');
            return;
        }
        const ok = await onUpdateProfile({
            privacySettings: {
                ...profileRef.current.privacySettings,
                architecte: { ...answers, consentAt: new Date().toISOString() },
            },
        });
        announce(
            ok
                ? `C'est enregistré, ${answers.callName}. Ces choix restent modifiables et révocables à tout moment.`
                : "L'enregistrement a échoué — rien n'a été conservé. Réessayez dans un instant.",
            ok ? 'text-emerald-300' : 'text-red-300'
        );
    }, [announce, onUpdateProfile]);

    /**
     * Commande (voix OU clavier — même session, même cerveau).
     *
     * Routage vision DÉTERMINISTE avant tout appel au modèle texte :
     *  - question de vision + image en session → VRAIE analyse de la dernière
     *    image montrée (suivi de conversation sur la même photo) ;
     *  - question de vision SANS image → aveu honnête, jamais un modèle texte
     *    laissé libre d'inventer un contenu visuel (la « montre » constatée
     *    en usage réel venait exactement de là).
     */
    const handleCommand = useCallback(async (command: string) => {
        if (!command.trim()) return;

        // Offre de configuration en attente (première rencontre) : un « oui »
        // court l'accepte et démarre la fiche ; toute autre réponse la laisse
        // tomber SANS insister et se traite normalement.
        if (consentOfferRef.current) {
            consentOfferRef.current = false;
            if (isAffirmativeReply(command)) {
                addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
                consentRef.current = { step: 0, answers: {} };
                announce(CONSENT_STEPS[0].question, 'text-cyan-300/80');
                return;
            }
        }

        // Fiche de consentement active : la réponse va à la fiche, pas au
        // cerveau — même canal, même session, zéro second assistant.
        if (consentRef.current) {
            await handleConsentAnswer(command.trim());
            return;
        }

        // Outils à la voix (§18) : la caméra s'ouvre et se ferme sans que la
        // personne ait à trouver le bouton. Le sélecteur de fichiers, lui, ne
        // peut pas s'ouvrir sans un vrai clic (règle des navigateurs) — on le
        // dit honnêtement au lieu de simuler.
        if (/\b(ouvre|active|lance|allume)\b[^.!?]{0,30}\bcam[ée]ra\b/i.test(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            cameraControlRef.current.open();
            return;
        }
        if (/\bferme\b[^.!?]{0,30}\bcam[ée]ra\b/i.test(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            cameraControlRef.current.close();
            announce('Caméra fermée.', 'text-slate-400');
            return;
        }
        if (/\b(joins?|joindre|importe[rz]?|t[ée]l[ée]verse[rz]?|envoie[- ]moi)\b[^.!?]{0,40}\b(fichier|document)\b/i.test(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            announce("Appuyez sur le bouton Fichier, juste en dessous, et choisissez votre document — je le lirai immédiatement. (Le navigateur exige un vrai appui pour ouvrir le sélecteur.)", 'text-cyan-300/80');
            return;
        }

        // ── Surface visuelle adaptative (« la parole pilote l'interface ») ──
        // Fermer la fenêtre : le besoin visuel est passé, retour à la barre.
        if (/\bferme\b[^.!?]{0,30}\b(la |le |l')?(vid[ée]o|fen[êe]tre|lecteur|aper[çc]u|[ée]cran)\b/i.test(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            setMediaView(null);
            announce('Fenêtre refermée.', 'text-slate-400');
            return;
        }
        // Vidéo/musique : la même surface devient lecteur — l'utilisateur ne
        // fait pas lui-même YouTube → recherche → résultat → lecteur.
        if (isVideoRequest(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            const query = extractVideoQuery(command);
            if (query.length < 2) {
                announce('Quelle vidéo voulez-vous voir ?', 'text-cyan-300/80');
                return;
            }
            setMediaView({ kind: 'video', query });
            // Honnête : les vidéos sont TROUVÉES et affichées ; la lecture
            // démarre d'un appui (les navigateurs bloquent l'auto-lecture).
            announce(`Voici les vidéos trouvées pour « ${query} » — appuyez sur lecture, je reste à l'écoute.`, 'text-cyan-300/80');
            return;
        }
        // Aperçu du dernier document fourni, dans la même surface.
        if (/\b(montre|affiche|fais[- ]voir|r[ée]ouvre|ouvre)\b[^.!?]{0,40}\b(document|aper[çc]u)\b/i.test(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            const doc = getLastSessionDocument();
            if (!doc) {
                announce("Aucun document dans notre conversation pour l'instant — appuyez sur le bouton Fichier pour m'en donner un, je l'afficherai ici.", 'text-amber-300');
                return;
            }
            setMediaView({ kind: 'document', name: doc.name, excerpt: doc.excerpt });
            announce(`Voici l'aperçu de « ${doc.name} ». Dites-moi ce que vous voulez en faire.`, 'text-cyan-300/80');
            return;
        }
        if (isConsentCommand(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            consentRef.current = { step: 0, answers: {} };
            announce(CONSENT_STEPS[0].question, 'text-cyan-300/80');
            return;
        }

        // Recherche Internet : la VRAIE recherche web de l'orchestrateur
        // (outil serveur `web_search`, grounding + sources) — l'Architecte
        // fait la recherche, il ne dit jamais « vous pouvez chercher sur
        // Internet ». En cas d'indisponibilité, l'outil serveur impose déjà
        // au modèle de le dire au lieu de répondre de mémoire.
        if (isWebSearchCommand(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            setIsThinking(true);
            setStatus('Je cherche sur le web...');
            setStatusTone('text-cyan-300/80');
            try {
                // Continuité du contexte (« la parole pilote l'interface »,
                // §16) : la recherche peut concerner la photo ou le document
                // qui vient d'être montré — le fil récent est fourni.
                const sessionContext = buildSessionContext();
                const reponse = await generateText(command.trim(), {
                    agentId: ARCHITECTE_AGENT_ID,
                    systemInstruction:
                        "Tu es L'Architecte de MokNet. Utilise l'outil de recherche web pour répondre avec des faits À JOUR. " +
                        "Réponds en français, brièvement, et CITE tes sources (titre et adresse) quand elles sont disponibles. " +
                        "Si la recherche est indisponible ou échoue, dis-le clairement — ne réponds jamais de mémoire en le présentant comme un résultat de recherche." +
                        (sessionContext ? `\n\nContexte récent de la conversation (la recherche peut s'y référer) :\n${sessionContext}` : ''),
                });
                announce(reponse?.trim() || "La recherche n'a rien donné.", reponse ? 'text-cyan-300/80' : 'text-amber-300');
            } catch (e: any) {
                announce(`La recherche web a échoué : ${e?.message || 'raison inconnue'}.`, 'text-red-300');
            } finally {
                setIsThinking(false);
            }
            return;
        }

        // Livrable : produire un VRAI fichier final téléchargeable à partir
        // du dernier document (ou d'une photo transcrite) — §15 : aller
        // jusqu'au livrable, pas s'arrêter à une explication.
        if (isDeliverableCommand(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            const doc = getLastSessionDocument();
            const img = doc ? null : getLastSessionImage();
            if (!doc && !img) {
                announce("Montrez-moi d'abord ce que je dois transformer — un document via le bouton Fichier, ou une photo via la caméra.", 'text-amber-300');
                return;
            }
            setIsThinking(true);
            setStatus('Je prépare votre fichier...');
            setStatusTone('text-cyan-300/80');
            try {
                let source: string | null = null;
                if (doc) {
                    source = doc.excerpt;
                } else if (img) {
                    // Photo d'un document : transcription visuelle réelle d'abord.
                    const base64 = img.dataUrl.split(',')[1];
                    source = await analyzeImage(base64, img.mimeType,
                        'Transcris fidèlement TOUT le texte lisible de cette image, dans l\'ordre. Réponds uniquement avec le texte transcrit.',
                        { systemInstruction: "Tu transcris ce qui est réellement lisible. Ce qui est illisible est marqué [illisible] — jamais inventé." });
                }
                if (!source?.trim()) {
                    announce("Je n'ai pas pu obtenir de contenu exploitable pour produire le fichier.", 'text-amber-300');
                    return;
                }
                const content = await generateText(
                    `Contenu source (extrait réel${doc ? ` du document « ${doc.name} »` : " d'une photo transcrite"}) :\n\n${source}\n\nDemande de l'utilisateur : « ${command.trim()} ».\nProduis la version finale demandée (corrigée, bien structurée). Réponds UNIQUEMENT avec le contenu du document final — aucun commentaire autour.`,
                    { systemInstruction: "Tu es L'Architecte de MokNet. Tu corriges et structures le contenu FOURNI — tu n'inventes jamais une donnée absente ; ce qui manque reste absent." }
                );
                if (!content?.trim()) {
                    announce("La préparation du fichier a échoué — rien n'a été généré.", 'text-red-300');
                    return;
                }
                const { format, pdfRedirected } = detectDeliverableFormat(command);
                const filename = deliverableFileName(doc?.name, format);
                triggerDownload(await buildDeliverableBlob(content.trim(), format), filename);
                announce(
                    `${pdfRedirected ? "Je ne sais pas encore produire un PDF — je vous l'ai préparé en Word (.docx). " : ''}` +
                    `Votre fichier « ${filename} » est prêt : le téléchargement vient de démarrer.`,
                    'text-emerald-300'
                );
            } catch (e: any) {
                announce(`La préparation du fichier a échoué : ${e?.message || 'raison inconnue'}.`, 'text-red-300');
            } finally {
                setIsThinking(false);
            }
            return;
        }

        if (isVisionQuestion(command)) {
            addSessionTurn({ role: 'utilisateur', kind: 'texte', text: command.trim() });
            const lastImage = getLastSessionImage();
            if (!lastImage) {
                announce(
                    "Je ne dispose d'aucune image dans notre conversation — montrez-moi quelque chose avec la caméra ou le bouton Fichier, et je vous dirai ce que j'y vois réellement.",
                    'text-amber-300'
                );
                return;
            }
            const base64 = lastImage.dataUrl.split(',')[1];
            if (base64) {
                await analyseVisual(base64, lastImage.mimeType, `Question de l'utilisateur sur l'image déjà montrée : « ${command.trim()} ».`);
            }
            return;
        }

        setIsThinking(true);
        setStatus('Analyse...');
        setStatusTone('text-cyan-300/80');
        try {
            const outcome = await runArchitecteCommand(command, {
                userName: profileRef.current.name,
                userLevel: profileRef.current.level,
                // Mémoire de la relation (§22) : le nom choisi dans la fiche
                // est utilisé, jamais redemandé.
                callName: profileRef.current.privacySettings?.architecte?.callName,
                confirm: (message) => window.confirm(message),
                onPhase: (phase, message) => { setStatus(message); setStatusTone(PHASE_TONE[phase]); },
            });

            // Ce qui est prononcé est toujours le RÉSULTAT réel quand il y en
            // a un — jamais l'intention annoncée par le modèle si l'exécution
            // a ensuite échoué, été refusée ou annulée. Et jamais barre
            // fermée (§14) : une réponse arrivée après la fermeture reste
            // dans le fil, silencieuse.
            const spoken = outcome.execution?.message || outcome.spoken;
            if (spoken) {
                setStatus(spoken);
                setStatusTone(outcome.execution ? PHASE_TONE[outcome.execution.phase] : 'text-cyan-300/80');
                if (isOpenRef.current) void speak(spoken);
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
    }, [onNavigate, speak, announce, analyseVisual, handleConsentAnswer]);

    // --- Pièce jointe ---------------------------------------------------

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFilePicked = useCallback(async (file: File | undefined) => {
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = String(reader.result || '');
                const base64 = dataUrl.split(',')[1];
                if (!base64) { announce("Ce fichier image n'a pas pu être lu.", 'text-amber-300'); return; }
                // L'image entre dans le fil de la session : affichée dans la
                // conversation, et réutilisable pour les questions de suivi.
                addSessionTurn({
                    role: 'utilisateur', kind: 'image',
                    text: `Image importée : ${file.name}`,
                    imageDataUrl: dataUrl, imageMimeType: file.type,
                });
                void analyseVisual(base64, file.type, `Voici une image que l'utilisateur me montre (fichier « ${file.name} »).`);
            };
            reader.onerror = () => announce("La lecture du fichier a échoué.", 'text-red-300');
            reader.readAsDataURL(file);
            return;
        }

        // Extraction RÉELLE du texte — PDF, Word, Excel, PowerPoint, ZIP,
        // texte : le moteur d'extraction (`documentExtractor.ts`) remplace
        // les anciens refus. Le document rejoint la session : l'Architecte
        // peut en discuter immédiatement, à la voix comme au clavier.
        try {
            setIsThinking(true);
            setStatus('Je lis le document...');
            setStatusTone('text-cyan-300/80');
            const doc = await extractDocumentText(file);
            addSessionTurn({
                role: 'utilisateur', kind: 'document',
                text: `Document fourni : ${doc.name}`,
                docName: doc.name,
                // Assez long pour produire un livrable fidèle depuis la
                // session ; le contexte injecté au cerveau reste borné à part.
                docExcerpt: doc.text.slice(0, 6000),
            });
            const reponse = await generateText(
                `Voici le contenu réellement extrait du ${doc.kindLabel} « ${doc.name} »${doc.truncated ? ' (tronqué)' : ''} :\n\n${doc.text}\n\nRésume l'essentiel en deux ou trois phrases, en français, puis propose UNE suite utile (correction, réorganisation, réponse à une question...).`,
                { systemInstruction: "Tu es L'Architecte de MokNet. Tu t'appuies UNIQUEMENT sur le contenu fourni et tu n'inventes rien — si le contenu est partiel, dis-le." }
            );
            announce(reponse?.trim() || "Je n'ai rien pu tirer de ce document.", 'text-cyan-300/80');
        } catch (e: any) {
            if (e instanceof UnsupportedDocumentError) {
                announce(e.message, 'text-amber-300');
            } else {
                announce(`La lecture de « ${file.name} » a échoué : ${e?.message || 'raison inconnue'}.`, 'text-red-300');
            }
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
            // Confirmation APRÈS l'ouverture réelle — jamais avant (§21).
            announce('La caméra est ouverte — cadrez ce que vous voulez me montrer, puis dites-moi ou appuyez sur Analyser.', 'text-cyan-300/80');
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        closeCamera();
        if (!base64) return;
        // La photo apparaît dans la conversation et y RESTE : l'utilisateur
        // peut continuer à en parler à la voix (« et à droite, c'est quoi ? »)
        // — la prise de photo n'interrompt jamais la session vocale.
        addSessionTurn({
            role: 'utilisateur', kind: 'image',
            text: 'Photo prise à la caméra',
            imageDataUrl: dataUrl, imageMimeType: 'image/jpeg',
        });
        void analyseVisual(base64, 'image/jpeg', "Voici ce que l'utilisateur me montre avec sa caméra.");
    }, [analyseVisual, announce, closeCamera]);

    // Les commandes vocales « ouvre/ferme la caméra » (routées tôt dans
    // handleCommand, défini avant ces callbacks) passent par cette ref.
    useEffect(() => {
        cameraControlRef.current = { open: () => { void openCamera(); }, close: closeCamera };
    }, [openCamera, closeCamera]);

    // Attacher le flux au <video> APRÈS le rendu du panneau — un
    // `setTimeout(0)` pouvait s'exécuter avant le commit React (rendu
    // asynchrone), laissant `videoRef.current` à null et l'aperçu
    // définitivement noir. Défaut réel constaté par la preuve navigateur du
    // chantier de finalisation.
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            void videoRef.current.play();
        }
    }, [isCameraOpen]);

    // La caméra ne doit jamais survivre au démontage de la barre.
    useEffect(() => () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    const open = useCallback(async () => {
        setIsOpen(true);
        // Mise à jour SYNCHRONE : l'accueil ci-dessous doit pouvoir parler
        // avant que l'effet qui synchronise la ref ait tourné.
        isOpenRef.current = true;
        setStatus('');
        setStatusTone('text-cyan-300/80');

        // ── L'ARCHITECTE VA VERS LA PERSONNE (§1-2) ──
        // Une fois par session de page : accueil complet à la première
        // rencontre (et proposition de configuration), accueil léger avec le
        // nom choisi pour une personne déjà connue. Jamais une interface
        // froide qui attend une commande — et jamais un onboarding rejoué à
        // chaque ouverture.
        if (!hasGreetedRef.current) {
            hasGreetedRef.current = true;
            const greeting = buildArchitecteGreeting(
                profileRef.current.privacySettings?.architecte,
                profileRef.current.name
            );
            if (greeting.firstMeeting) consentOfferRef.current = true;
            announce(greeting.text, 'text-cyan-300/80');
        }
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
        // Synchrone : dès cet instant, plus AUCUNE parole ne part (§14) —
        // y compris une réponse encore en vol.
        isOpenRef.current = false;
        setIsThinking(false);
        setStatus('');
        // Fermer l'Architecte referme aussi sa surface visuelle : aucune
        // vidéo ni aperçu ne survit derrière une barre fermée.
        setMediaView(null);
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
                // L'ouverture se fait sur `pointerup` pour qu'un glissement ne
                // déclenche pas l'Architecte. Conséquence non voulue : Entrée
                // et Espace émettent un `click`, pas d'événement pointeur — la
                // pastille était donc inatteignable au clavier. Ce gestionnaire
                // rétablit l'accès sans réintroduire de double ouverture : un
                // clic souris ne passe jamais par ici.
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        dragState.current = null;
                        void open();
                    }
                }}
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

    // ── Voix par défaut, texte quand il apporte une vraie valeur (§16-17) ──
    // Le panneau de transcription ne s'impose pas à chaque phrase : il
    // apparaît quand la personne écrit, quand le fil contient une image ou un
    // document (à VOIR), ou quand la dernière réponse est une vraie
    // production écrite (lettre, liste, résumé long). Une simple réponse
    // vocale reste vocale — l'interface minimale suffit.
    const lastTurn = sessionTurns[sessionTurns.length - 1];
    const hasRichTurns = sessionTurns.some((t) => t.kind !== 'texte');
    const lastIsWrittenProduction = !!lastTurn && lastTurn.role === 'architecte' && lastTurn.text.length > 220;
    // La surface visuelle adaptative ouvre le panneau quand la parole a
    // demandé quelque chose À VOIR (vidéo, aperçu) — et lui seul.
    const showConversationPanel = isTypingOpen || hasRichTurns || lastIsWrittenProduction || mediaView !== null;

    return (
        <>
        {/* Fil de conversation — LA session unique de l'Architecte : voix,
            clavier, photos et documents dans le même échange, sans jamais
            basculer vers une autre interface. Masqué pendant que la caméra
            occupe le même emplacement. */}
        {!isCameraOpen && showConversationPanel && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[61] w-[92%] max-w-2xl rounded-2xl overflow-hidden bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/30 ring-1 ring-cyan-500/40 shadow-[0_0_32px_rgba(34,211,238,0.18),0_18px_45px_rgba(0,0,0,0.6)]">
                {/* Surface visuelle adaptative : le « petit écran » de
                    l'Architecte — lecteur vidéo ou aperçu de document selon
                    la tâche, jamais un second assistant. Une seule commande
                    manuelle (fermer) : la voix reste le pilote. */}
                {mediaView && (
                    <div className="relative p-2 pb-0">
                        {mediaView.kind === 'video' ? (
                            <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-cyan-400/40 bg-black">
                                <iframe
                                    title={`Vidéos pour : ${mediaView.query}`}
                                    src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(mediaView.query)}`}
                                    className="absolute inset-0 h-full w-full"
                                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="max-h-52 overflow-y-auto rounded-xl border border-cyan-400/30 bg-slate-900/70 p-3">
                                <div className="mb-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300/70">{mediaView.name}</div>
                                <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-200">{mediaView.excerpt}</div>
                            </div>
                        )}
                        <button
                            onClick={() => setMediaView(null)}
                            className="absolute right-3 top-3 z-10 rounded-full border border-slate-500/60 bg-[#0f172a]/85 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-600/40 transition-colors"
                            aria-label="Fermer la fenêtre visuelle"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
                {sessionTurns.length > 0 && (
                    <div ref={conversationRef} className="max-h-60 overflow-y-auto p-3 space-y-2">
                        {sessionTurns.slice(-8).map((t, i) => (
                            <div key={`${t.at}-${i}`} className={`flex ${t.role === 'utilisateur' ? 'justify-end' : 'justify-start'}`}>
                                {t.kind === 'image' && t.imageDataUrl ? (
                                    <figure className="max-w-[70%]">
                                        <img
                                            src={t.imageDataUrl}
                                            alt={t.text}
                                            className="max-h-36 rounded-xl border border-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,0.15)]"
                                        />
                                        <figcaption className="mt-1 text-[10px] font-mono text-cyan-300/70">{t.text}</figcaption>
                                    </figure>
                                ) : (
                                    <span
                                        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[12px] leading-relaxed ${
                                            t.role === 'utilisateur'
                                                ? 'bg-cyan-400/15 border border-cyan-400/30 text-cyan-100'
                                                : 'bg-slate-800/80 border border-white/10 text-slate-200'
                                        }`}
                                    >
                                        {/* Les sources citées par la recherche web deviennent
                                            cliquables : la surface montre, l'utilisateur agit. */}
                                        {renderTextWithLinks(t.text)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {isTypingOpen && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const t = typedText.trim();
                            if (!t) return;
                            setTypedText('');
                            void handleCommand(t);
                        }}
                        className={`flex items-center gap-2 p-2 ${sessionTurns.length > 0 ? 'border-t border-cyan-500/20' : ''}`}
                    >
                        <input
                            ref={typedInputRef}
                            value={typedText}
                            onChange={(e) => setTypedText(e.target.value)}
                            placeholder="Écrivez à l'Architecte — même conversation que la voix"
                            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none px-2"
                            aria-label="Saisie clavier de l'Architecte"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded-full border border-cyan-300 bg-cyan-400/25 px-3 py-1.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-400/35 transition-colors"
                            aria-label="Envoyer le message écrit"
                        >
                            <Send size={13} />
                        </button>
                    </form>
                )}
            </div>
        )}
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
                    accept="image/*,.txt,.csv,.json,.md,.pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.zip"
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

                <button
                    // FINALISATION : ce bouton ouvrait auparavant DialloOS —
                    // une SECONDE expérience conversationnelle, avec sa propre
                    // identité visuelle et sans historique commun. Désormais la
                    // saisie s'ouvre ICI, dans la même barre, la même session,
                    // le même Architecte. (Exigence explicite : « il ne doit
                    // jamais arriver qu'un bouton ouvre un autre assistant ».)
                    onClick={() => setIsTypingOpen((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                        isTypingOpen
                            ? 'border-cyan-300 bg-cyan-400/25 text-cyan-100'
                            : 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20'
                    }`}
                    title="Écrire à l'Architecte — même conversation que la voix"
                    aria-label="Écrire à l'Architecte"
                >
                    <Keyboard size={13} />
                    <span className="hidden sm:inline">Écrire</span>
                </button>

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
