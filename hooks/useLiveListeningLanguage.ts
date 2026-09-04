import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UseLiveTransportResult } from './useLiveTransport';
import {
    decodeLiveParticipantMeta,
    encodeLiveParticipantMeta,
    encodeSpokenLanguageMeta,
    listeningLanguageCode,
    requestedLanguageCounts,
    type ListeningChoice,
    type ProductionPlan,
} from '../services/live/liveListeningLanguage';
import { LiveInterpreterProducer, type LiveInterpreterStage, type LiveTranscriptLine } from '../services/live/liveInterpreterProducer';
import { summarizeLiveLatency, type LiveLatencyReport } from '../services/live/liveLatency';
import { encodeCallData } from '../services/messaging/speechLanguage';

/**
 * LIVE PLANÉTAIRE — le pont entre l'écran du direct et la traduction.
 *
 * Il tient les deux moitiés de la promesse, séparées :
 *
 * - CÔTÉ AUDITEUR (tout le monde, y compris un spectateur sans micro ni
 *   caméra) : mon choix de langue, publié dans mes métadonnées pour que les
 *   intervenants sachent quelles langues produire. Rien d'autre n'est
 *   partagé : les autres apprennent qu'« une personne écoute en anglais »,
 *   jamais qui.
 *
 * - CÔTÉ INTERVENANT (seulement quand je suis sur scène, micro publié) : le
 *   producteur qui transforme ma parole en une voix par langue demandée.
 *
 * Une même personne est presque toujours les deux à la fois — un animateur
 * écoute aussi ses invités. Les deux moitiés restent pourtant indépendantes :
 * un spectateur traduit sans jamais rien produire, un intervenant produit même
 * s'il reste, lui, en « Original ».
 *
 * PAR DÉFAUT : Original. Personne n'entend une traduction sans l'avoir
 * demandée, et rien n'est produit tant que personne n'en demande.
 */

export interface UseLiveListeningLanguageOptions {
    transport: Pick<UseLiveTransportResult,
        'connectionState' | 'remoteParticipants' | 'publishLocalMetadata' | 'getLocalMetadata'
        | 'publishInterpreterAudio' | 'unpublishInterpreterAudio' | 'getLocalAudioTrack' | 'localAudioPublished'
        | 'sendData'>;
    /** Je suis sur scène ET mon micro est réellement publié : je peux produire. */
    canProduce: boolean;
    /** Ma langue de profil — simple indication de départ pour la transcription ; la détection prime. */
    myLanguageHint?: string;
    /** Vrai pendant qu'une voix d'interprète sort de mon haut-parleur (mon micro capte alors autre chose que ma voix). */
    isInterpreterAudible?: () => boolean;
    /**
     * LP-7 — ma parole vient d'être transcrite (et, ligne suivante, traduite).
     * Le crochet l'a DÉJÀ envoyée aux autres par le canal de données ; ceci
     * est le second usage, celui qui la GARDE. L'appelant décide s'il y a
     * lieu de la conserver — ce n'est jamais automatique.
     */
    onTranscript?: (line: LiveTranscriptLine) => void;
}

export interface UseLiveListeningLanguageResult {
    /** Ma langue d'écoute, `null` = Original. */
    choice: ListeningChoice;
    /** Changer de langue — à chaud, sans quitter le direct ni se reconnecter. */
    choose: (next: ListeningChoice) => void;
    /** Ce que JE produis pour les autres (vide si je ne suis pas sur scène). */
    plan: ProductionPlan;
    /** Ma langue d'écoute est demandée mais AUCUN intervenant ne la produit encore. */
    waitingForMyLanguage: boolean;
    /** Dernières étapes mesurées de ma propre production — pour le diagnostic de latence. */
    stages: LiveInterpreterStage[];
    /**
     * La latence, en chiffres SÉPARÉS (§18) : reconnaissance, traduction,
     * et parole → voix traduite. « Le temps réel fonctionne » n'est pas une
     * mesure ; ceci en est une.
     */
    latency: LiveLatencyReport;
    /** La chaîne de production a échoué chez moi (dit à l'écran, jamais avalé). */
    producerError: string | null;
    /**
     * Mon choix de langue n'a PAS pu être annoncé aux intervenants (LP-6).
     * Sans cette annonce, personne ne produit ma langue : l'écran doit le
     * dire au lieu de me laisser attendre une voix qui ne viendra jamais.
     */
    choiceBroadcastError: string | null;
}

const EMPTY_PLAN: ProductionPlan = { produce: [], unserved: [], alreadySpoken: [] };
/** On ne garde que les dernières mesures : un direct long ne doit pas gonfler la mémoire. */
const MAX_STAGES = 40;

export function useLiveListeningLanguage(options: UseLiveListeningLanguageOptions): UseLiveListeningLanguageResult {
    const { transport, canProduce, myLanguageHint, isInterpreterAudible, onTranscript } = options;
    const [choice, setChoice] = useState<ListeningChoice>(null); // Original, toujours, au départ
    const [plan, setPlan] = useState<ProductionPlan>(EMPTY_PLAN);
    const [stages, setStages] = useState<LiveInterpreterStage[]>([]);
    const [producerError, setProducerError] = useState<string | null>(null);
    const [choiceBroadcastError, setChoiceBroadcastError] = useState<string | null>(null);

    // Les langues demandées autour de moi, telles que les métadonnées des
    // participants les portent. Un ÉTAT, donc juste : un arrivant tardif est
    // compté dès que le serveur relaie ses métadonnées, sans ré-annonce.
    const requested = useMemo(
        () => requestedLanguageCounts(transport.remoteParticipants.map((p) => ({
            identity: p.participant.identity,
            metadata: p.metadata,
        }))),
        [transport.remoteParticipants],
    );
    const requestedRef = useRef(requested);
    requestedRef.current = requested;

    const audibleRef = useRef(isInterpreterAudible);
    audibleRef.current = isInterpreterAudible;

    // Ces deux-là changent à chaque rendu ; les lire par référence évite de
    // détruire et recréer le producteur (donc de couper la transcription en
    // cours) à chaque fois que le composant se redessine.
    const sendDataRef = useRef(transport.sendData);
    sendDataRef.current = transport.sendData;
    const onTranscriptRef = useRef(onTranscript);
    onTranscriptRef.current = onTranscript;

    // ── Moitié auditeur : publier MON choix ────────────────────────────────
    //
    // Republié à chaque (re)connexion : un choix fait avant d'être connecté, ou
    // pendant une coupure, doit finir par atteindre les intervenants — sinon
    // personne ne produit ma langue et j'attends une voix qui ne viendra pas.
    useEffect(() => {
        if (transport.connectionState !== 'connected') return;
        let annule = false;
        void transport.publishLocalMetadata(encodeLiveParticipantMeta(choice, transport.getLocalMetadata()))
            .then(() => { if (!annule) setChoiceBroadcastError(null); })
            .catch((e: unknown) => {
                // LP-6 : cet échec était AVALÉ. Il ne l'est plus, parce qu'il
                // est le seul qui rende la traduction impossible en silence :
                // si mon choix n'atteint pas les intervenants, personne ne
                // produit ma langue et j'attends indéfiniment une voix qui ne
                // viendra jamais — l'écran doit le dire, pas me laisser croire
                // que ça arrive. Le prochain changement de langue ou de
                // connexion republie de toute façon.
                if (!annule) setChoiceBroadcastError(e instanceof Error ? e.message : String(e));
            });
        return () => { annule = true; };
    }, [choice, transport.connectionState, transport.publishLocalMetadata, transport.getLocalMetadata]);

    // ── Moitié intervenant : produire pour les autres ──────────────────────

    const producerRef = useRef<LiveInterpreterProducer | null>(null);

    useEffect(() => {
        // Le producteur ne démarre QUE si je suis réellement sur scène avec un
        // micro publié : sans piste à écouter, il n'aurait rien à transcrire.
        //
        // LP-6 : ces trois conditions étaient muettes. Quand aucune traduction
        // ne sort, la première question est « laquelle des trois manque ? » —
        // sans cette ligne, elle ne se répond qu'en devinant.
        if (!canProduce || !transport.localAudioPublished || transport.connectionState !== 'connected') {
            console.log(`[live-interprète] producteur en attente — sur scène avec consentement: ${canProduce}`
                + ` · micro publié: ${transport.localAudioPublished} · connexion: ${transport.connectionState}`);
            return;
        }
        console.log('[live-interprète] producteur démarré (sur scène, micro publié, connecté)');
        const producer = new LiveInterpreterProducer({
            getLocalAudioTrack: transport.getLocalAudioTrack,
            myLanguageHint,
            getRequestedLanguages: () => requestedRef.current,
            publishTrack: (track, name) => transport.publishInterpreterAudio(track, name),
            unpublishTrack: (name) => transport.unpublishInterpreterAudio(name),
            isPaused: () => audibleRef.current?.() ?? false,
            // LP-7 — la parole part par le canal de données de la room, le
            // même chemin que les appels utilisent depuis HL-4 (`caption`,
            // encodé par `encodeCallData`). Réutiliser ce format plutôt que
            // d'en inventer un second, c'est éviter deux protocoles à
            // maintenir pour exactement la même chose : un texte, sa langue,
            // et sa traduction éventuelle.
            //
            // `reliable: true` — un sous-titre perdu ne se rattrape pas, et
            // le volume est celui d'une phrase, pas d'un flux audio.
            publishTranscript: (line) => {
                void sendDataRef.current(encodeCallData({
                    t: 'caption', v: 1,
                    id: line.targetLanguage ? `${line.id}:${line.targetLanguage}` : line.id,
                    text: line.text,
                    lang: line.language,
                    final: true,
                    ts: Date.now(),
                    ...(line.translated && line.targetLanguage
                        ? { translated: line.translated, targetLang: line.targetLanguage }
                        : {}),
                }), { reliable: true }).catch(() => {
                    // Un sous-titre non distribué n'interrompt jamais la
                    // voix : elle voyage, elle, par la piste audio.
                });
                onTranscriptRef.current?.(line);
            },
            onPlanChanged: (p) => {
                setPlan(p);
                // Même convention de journal que les appels (`[appel] …`) : sans
                // cette ligne, « pourquoi personne n'entend ma traduction ? » ne
                // se diagnostique qu'en devinant. Elle ne nomme JAMAIS qui a
                // demandé quoi — seulement les langues et leur nombre.
                console.log(`[live-interprète] langues produites: ${p.produce.join(', ') || 'aucune'}`
                    + ` · non servies: ${p.unserved.join(', ') || 'aucune'}`
                    + ` · déjà parlées: ${p.alreadySpoken.join(', ') || 'aucune'}`);
            },
            onStage: (stage) => setStages((prev) => [...prev.slice(-(MAX_STAGES - 1)), stage]),
            onUnavailable: (reason) => setProducerError(reason),
        });
        producerRef.current = producer;
        setProducerError(null);
        producer.start();
        return () => {
            producerRef.current = null;
            setPlan(EMPTY_PLAN);
            void producer.stop();
        };
    }, [canProduce, transport.localAudioPublished, transport.connectionState,
        transport.getLocalAudioTrack, transport.publishInterpreterAudio, transport.unpublishInterpreterAudio, myLanguageHint]);

    // Quelqu'un a choisi, changé ou quitté une langue : le plan de production
    // suit, en direct, sans interrompre la transcription en cours.
    useEffect(() => {
        void producerRef.current?.refresh();
    }, [requested]);

    // J'annonce la langue que je PARLE (détectée dans ma propre voix) pour que
    // les auditeurs sachent quand il n'y a rien à interpréter chez moi.
    const lastSpokenRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        const detected = producerRef.current?.detectedLanguage;
        if (!detected || detected === lastSpokenRef.current) return;
        if (transport.connectionState !== 'connected') return;
        lastSpokenRef.current = detected;
        void transport.publishLocalMetadata(encodeSpokenLanguageMeta(detected, transport.getLocalMetadata()))
            .catch(() => { /* réessayé au prochain changement */ });
    }, [stages, transport.connectionState, transport.publishLocalMetadata, transport.getLocalMetadata]);

    // ── Ce que l'écran doit pouvoir dire honnêtement ───────────────────────

    /**
     * J'ai demandé une langue, mais aucun intervenant ne publie encore de
     * piste dans cette langue : l'écran le dit plutôt que de me laisser
     * attendre une voix qui n'arrive pas (production pas encore démarrée,
     * plafond du producteur atteint, ou tout le monde parle déjà ma langue).
     */
    const waitingForMyLanguage = useMemo(() => {
        const mine = listeningLanguageCode(choice);
        if (!mine) return false;
        const somebodyElseSpeaksAnother = transport.remoteParticipants.some((p) => {
            const spoken = decodeLiveParticipantMeta(p.metadata).spoken;
            return !!p.audioTrack && !!spoken && spoken !== mine;
        });
        if (!somebodyElseSpeaksAnother) return false;
        return !transport.remoteParticipants.some((p) => !!p.interpreterTracksByLanguage?.[mine]);
    }, [choice, transport.remoteParticipants]);

    const choose = useCallback((next: ListeningChoice) => {
        setChoice(listeningLanguageCode(next) ?? null);
    }, []);

    const latency = useMemo(() => summarizeLiveLatency(stages), [stages]);

    return { choice, choose, plan, waitingForMyLanguage, stages, latency, producerError, choiceBroadcastError };
}
