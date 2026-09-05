import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertTriangle, Bot, CheckCircle2, ChevronRight, CircleHelp, Crosshair, ExternalLink, Layers, ListChecks,
    Loader2, Lock, Mic, MicOff, OctagonX, RefreshCw, Send, Sparkles, Stethoscope, Undo2, Volume2, VolumeX,
    Wrench, X, XCircle,
} from 'lucide-react';
import { Avatar3D } from '../Avatar3D';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { ELEVENLABS_CURATED_VOICES } from '../../services/voiceEngine';
import { generateText } from '../../services/aiGateway';
import { HealthBlockId, HealthLineState, HealthStatus, RiskLevel } from '../../services/health/healthTypes';
import { HEALTH_BLOCKS } from '../../services/health/healthRegistry';
import {
    HealthCheckPhase, HealthRank, HealthSnapshot, diagnose, repair, restore,
} from '../../services/health/healthService';
import { SecurityReport } from '../../services/health/securityAudit';
import { resolveGuideUrl } from '../../services/health/healthGuide';
import {
    CampaignDeps, CampaignItemResult, CampaignItemStatus, CampaignPhase, CampaignPlan, CampaignProgress,
    CampaignResult, CampaignScope, ConsolidatedPlan, RollbackResult, planCampaign, rollbackCampaign, runCampaign,
} from '../../services/health/assistant/repairCampaign';
import {
    SYSTEM_PROMPT, contextForLlm, explainLine, helpText, narrateCampaign, narrateReport, parseIntent,
} from '../../services/health/assistant/assistantBrain';

/**
 * Assistant IA de Santé Globale — vocal et texte, avec l'avatar existant.
 *
 * QUI S'EN SERT : l'Admin Général (et les administrateurs, en diagnostic).
 * CE QU'IL FAIT : il ANALYSE tout, DIT le bilan (santé, sécurité, priorités),
 * RÉPARE une portée — tout le lot, les rouges seuls, les oranges seuls, un
 * domaine, un point — boucle par boucle avec le pourcentage à chaque boucle,
 * et quand une réparation échoue il donne LA CAUSE, LES ÉTAPES EXACTES et LE
 * LIEN vers l'endroit à corriger.
 *
 * CE QU'IL NE FAIT JAMAIS :
 *   • appliquer sans diagnostic préalable ni sans UNE confirmation du lot ;
 *   • continuer quand la situation devient incontrôlable : il s'arrête, dit
 *     pourquoi, et propose le retour à l'état stable (restauration du lot) ;
 *   • afficher « Réparer » quand le rang ne le permet pas : il écrit
 *     « Diagnostiquer » et le dit ;
 *   • inventer : le bilan vient des mesures, l'explication d'un point vient
 *     du registre, et ce qui vient de la passerelle IA est étiqueté « IA ».
 *
 * TOUT EST RÉUTILISÉ : le moteur vocal partagé (ElevenLabs HD, secours
 * navigateur annoncé), la reconnaissance vocale du navigateur, l'Avatar3D des
 * experts (Directeur Diallo), la passerelle IA, et le pipeline health-guardian
 * (diagnostic → jeton → sauvegarde → application → vérification → journal).
 */

// ─────────────────────────── Vocabulaire ───────────────────────────

const AVATAR_ID = '8'; // Directeur Diallo — vidéos idle / speaking / listening existantes.
const VOIX_ID = ELEVENLABS_CURATED_VOICES.directeur.id;
const CLE_VOIX = 'moknet.sante.assistant.voix';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

type Source = 'mesure' | 'moteur' | 'ia' | 'vous';

interface Message {
    id: number;
    source: Source;
    texte: string;
    at: string;
}

const LIBELLE_SOURCE: Record<Source, { texte: string; classe: string }> = {
    mesure: { texte: 'Bilan mesuré',                 classe: 'bg-slate-900 text-white' },
    moteur: { texte: 'Assistant',                    classe: 'bg-blue-600 text-white' },
    ia:     { texte: 'Réponse IA — à vérifier',      classe: 'bg-violet-600 text-white' },
    vous:   { texte: 'Vous',                         classe: 'bg-slate-200 text-slate-800' },
};

const LIBELLE_PHASE: Record<CampaignPhase, string> = {
    diagnostic: 'Diagnostic — aucune écriture',
    confirmation: 'Confirmation de la Direction',
    reparation: 'Réparation, point par point',
    termine: 'Terminé',
    arret: 'Arrêt',
};

const STYLE_RESULTAT: Record<CampaignItemStatus, { texte: string; classe: string; Icone: React.FC<{ size?: number; className?: string }> }> = {
    reparee:       { texte: 'Réparé et vérifié',        classe: 'bg-emerald-600 text-white',                     Icone: CheckCircle2 },
    echec:         { texte: 'Échec',                    classe: 'bg-red-600 text-white',                         Icone: XCircle },
    diagnostiquee: { texte: 'Diagnostiqué',             classe: 'bg-blue-600 text-white',                        Icone: Stethoscope },
    rien_a_faire:  { texte: 'Rien à corriger',          classe: 'bg-slate-200 text-slate-800',                   Icone: CheckCircle2 },
    manuelle:      { texte: 'Action manuelle requise',  classe: 'bg-amber-100 text-amber-900 border border-amber-300', Icone: CircleHelp },
    recommandee:   { texte: 'Action recommandée',       classe: 'bg-slate-100 text-slate-700 border border-slate-300', Icone: ListChecks },
    ignoree:       { texte: 'Non tenté',                classe: 'bg-slate-100 text-slate-500',                   Icone: OctagonX },
};

const MOT_STATUT: Record<HealthStatus, { mot: string; aplat: string }> = {
    rouge:  { mot: 'ROUGE',      aplat: 'bg-red-600 text-white' },
    orange: { mot: 'ORANGE',     aplat: 'bg-orange-500 text-white' },
    blanc:  { mot: 'NON MESURÉ', aplat: 'bg-slate-300 text-slate-900' },
    jaune:  { mot: 'JAUNE',      aplat: 'bg-amber-400 text-slate-900' },
    vert:   { mot: 'VERT',       aplat: 'bg-emerald-500 text-white' },
};

const RANG_RISQUE: Record<RiskLevel, number> = { critique: 0, eleve: 1, moyen: 2, faible: 3 };

const DEPS_REELLES: CampaignDeps = { diagnose, repair, restore };

const IA_REELLE = (prompt: string, systemInstruction: string): Promise<string> => generateText(prompt, { systemInstruction });

function lireVoix(): boolean {
    try { return window.localStorage.getItem(CLE_VOIX) !== '0'; } catch { return true; }
}

function ecrireVoix(active: boolean): void {
    try { window.localStorage.setItem(CLE_VOIX, active ? '1' : '0'); } catch { /* stockage indisponible : la préférence ne survit pas, l'assistant marche */ }
}

// ─────────────────────────── Propriétés ───────────────────────────

export interface HealthAssistantProps {
    snapshot: HealthSnapshot | null;
    securite: SecurityReport | null;
    rank: HealthRank;
    /** Analyse en cours (bouton Analyser ou « Relancer l'analyse »). */
    analysing: boolean;
    /** Phases déjà terminées de l'analyse en cours — la progression réelle. */
    phases: HealthCheckPhase[];
    onAnalyser: () => Promise<void>;
    onOuvrirLigne: (id: string) => void;
    /** Après une campagne ou une restauration qui a modifié des données : remesurer et rafraîchir le journal. */
    onApresCampagne: () => Promise<void>;
    /** Injectables pour les tests — par défaut, le vrai pipeline et la vraie passerelle. */
    deps?: CampaignDeps;
    ia?: (prompt: string, systemInstruction: string) => Promise<string>;
}

interface Campagne {
    plan: CampaignPlan;
    progress: CampaignProgress;
    result: CampaignResult | null;
    rollback: { enCours: boolean; fait: number; total: number; result: RollbackResult | null } | null;
}

interface ConfirmationLot {
    plan: ConsolidatedPlan;
    label: string;
    repondre: (ok: boolean) => void;
}

// ─────────────────────────── Composant ───────────────────────────

export const HealthAssistant: React.FC<HealthAssistantProps> = ({
    snapshot, securite, rank, analysing, phases, onAnalyser, onOuvrirLigne, onApresCampagne,
    deps = DEPS_REELLES, ia = IA_REELLE,
}) => {
    const report = snapshot?.report ?? null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [saisie, setSaisie] = useState('');
    const [voix, setVoix] = useState<boolean>(() => lireVoix());
    const [campagne, setCampagne] = useState<Campagne | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationLot | null>(null);
    const [occupe, setOccupe] = useState(false);
    const [iaEnCours, setIaEnCours] = useState(false);
    const [blocChoisi, setBlocChoisi] = useState<HealthBlockId>('securite');
    const [ligneChoisie, setLigneChoisie] = useState<string>('');

    const compteur = useRef(0);
    const abortRef = useRef(false);
    const voixRef = useRef(voix);
    const parlerProchainBilan = useRef(false);
    const derniereNarration = useRef<string | null>(null);
    const journalRef = useRef<HTMLDivElement>(null);

    useEffect(() => { voixRef.current = voix; }, [voix]);

    const ajouter = useCallback((source: Source, texte: string) => {
        compteur.current += 1;
        const message: Message = { id: compteur.current, source, texte, at: new Date().toISOString() };
        setMessages((prev) => [...prev, message].slice(-60));
    }, []);

    // ── Voix : moteur partagé, voix « Directeur », reconnaissance du navigateur.
    const executerRef = useRef<(texte: string) => Promise<void>>(async () => {});
    const {
        isListening, isSpeaking, isSupported, volume, transcript, error: erreurVoix, ttsEngine,
        startListening, stopListening, speak, stopSpeaking,
    } = useVoiceAssistant({
        voiceId: VOIX_ID,
        lang: 'fr-FR',
        onFinalTranscript: (texte) => { stopListening(); void executerRef.current(texte); },
    });

    const dire = useCallback(async (texte: string) => {
        if (!voixRef.current) return;
        try { await speak(texte); } catch { /* le moteur vocal a déjà signalé l'erreur via `error` */ }
    }, [speak]);

    const repondre = useCallback((texte: string) => {
        ajouter('moteur', texte);
        void dire(texte);
    }, [ajouter, dire]);

    const basculerVoix = () => {
        const suivant = !voix;
        setVoix(suivant);
        ecrireVoix(suivant);
        if (!suivant) stopSpeaking();
    };

    const basculerMicro = async () => {
        if (isListening) { stopListening(); return; }
        if (!isSupported) {
            ajouter('moteur', "Le micro n'est pas pris en charge par ce navigateur : écrivez votre consigne ci-dessous.");
            return;
        }
        stopSpeaking();
        const ok = await startListening('fr-FR');
        if (!ok) ajouter('moteur', "Le micro n'a pas pu démarrer (autorisation refusée ?). Écrivez votre consigne ci-dessous.");
    };

    // ── Index des lignes.
    const toutesLignes = useMemo(() => (report ? report.blocks.flatMap((b) => b.lines) : []), [report]);
    const parId = useMemo(() => new Map(toutesLignes.map((l) => [l.line.id, l])), [toutesLignes]);
    const aCorriger = useMemo(() => toutesLignes
        .filter((l) => l.outcome.status === 'rouge' || l.outcome.status === 'orange')
        .sort((a, b) => (a.outcome.status === 'rouge' ? 0 : 1) - (b.outcome.status === 'rouge' ? 0 : 1) || RANG_RISQUE[a.line.risk] - RANG_RISQUE[b.line.risk]),
    [toutesLignes]);
    const parBloc = useMemo(() => new Map(HEALTH_BLOCKS.map((b) => {
        const bs = report?.blocks.find((x) => x.block.id === b.id);
        return [b.id, bs ? bs.tally.rouge + bs.tally.orange : 0];
    })), [report]);

    useEffect(() => {
        if (aCorriger.length > 0 && !aCorriger.some((l) => l.line.id === ligneChoisie)) setLigneChoisie(aCorriger[0].line.id);
        const premierBloc = HEALTH_BLOCKS.find((b) => (parBloc.get(b.id) ?? 0) > 0);
        if (premierBloc && (parBloc.get(blocChoisi) ?? 0) === 0) setBlocChoisi(premierBloc.id);
    }, [aCorriger, parBloc, ligneChoisie, blocChoisi]);

    // ── Chaque nouveau bilan est DIT une fois : à l'écran toujours, à voix haute
    //    seulement quand la Direction a demandé l'analyse (jamais au chargement).
    useEffect(() => {
        if (!report) return;
        if (derniereNarration.current === report.generatedAt) return;
        derniereNarration.current = report.generatedAt;
        const texte = narrateReport({ report, securite, rank });
        ajouter('mesure', texte);
        if (parlerProchainBilan.current) {
            parlerProchainBilan.current = false;
            void dire(texte);
        }
    }, [report, securite, rank, ajouter, dire]);

    useEffect(() => {
        const el = journalRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    // ── Analyser : tout scanner, en disant où on en est (sondes serveur, navigateur).
    const analyser = useCallback(async () => {
        if (analysing) return;
        parlerProchainBilan.current = voixRef.current;
        stopSpeaking();
        await onAnalyser();
    }, [analysing, onAnalyser, stopSpeaking]);

    // ── Campagne : une portée, boucle par boucle, une confirmation pour le lot.
    const lancerCampagne = useCallback(async (scope: CampaignScope) => {
        if (!report || occupe) return;
        const plan = planCampaign(report, scope, rank);
        if (plan.items.length === 0) {
            repondre(`Aucun point rouge ni orange dans ${plan.label} : rien à réparer.`);
            return;
        }
        abortRef.current = false;
        const total = plan.autoItems.length * (plan.mode === 'reparation' ? 2 : 1);
        setCampagne({ plan, progress: { phase: 'diagnostic', loop: 0, total, percent: 0, current: null }, result: null, rollback: null });
        setOccupe(true);
        const manuels = plan.manualItems.length + plan.recommendedItems.length;
        ajouter('moteur', plan.mode === 'reparation'
            ? `Campagne sur ${plan.label} : ${plan.autoItems.length} réparation${plan.autoItems.length > 1 ? 's' : ''} automatique${plan.autoItems.length > 1 ? 's' : ''}, ${manuels} point${manuels > 1 ? 's' : ''} à traiter à la main. Je diagnostique d'abord, sans rien modifier, puis je vous demande une seule confirmation pour le lot.`
            : `Diagnostic sur ${plan.label} : ${plan.autoItems.length} point${plan.autoItems.length > 1 ? 's' : ''} diagnostiqué${plan.autoItems.length > 1 ? 's' : ''} sans rien modifier — votre rang (${rank.role ?? 'inconnu'}) ne permet pas d'appliquer.`);
        try {
            const result = await runCampaign(plan, deps, {
                onProgress: (progress) => setCampagne((c) => (c ? { ...c, progress } : c)),
                confirm: (consolide) => new Promise<boolean>((resolve) => {
                    setConfirmation({ plan: consolide, label: plan.label, repondre: (ok) => { setConfirmation(null); resolve(ok); } });
                }),
                isAborted: () => abortRef.current,
            });
            setCampagne((c) => (c ? { ...c, result } : c));
            const bilan = narrateCampaign(result);
            ajouter('moteur', bilan);
            void dire(bilan);
            if (result.counts.reparee > 0) {
                parlerProchainBilan.current = false;
                await onApresCampagne();
            }
        } finally {
            setOccupe(false);
        }
    }, [report, occupe, rank, deps, repondre, ajouter, dire, onApresCampagne]);

    const arreter = useCallback(() => {
        abortRef.current = true;
        stopSpeaking();
        if (confirmation) confirmation.repondre(false);
        ajouter('moteur', occupe
            ? "Arrêt demandé : je termine l'opération en cours puis je m'arrête. Rien d'autre ne sera appliqué."
            : 'Rien en cours à arrêter.');
    }, [confirmation, occupe, stopSpeaking, ajouter]);

    // ── Retour à l'état stable : les sauvegardes du lot, en ordre inverse.
    const restaurerLot = useCallback(async () => {
        const result = campagne?.result;
        if (!result || result.snapshots.length === 0 || occupe || campagne?.rollback) return;
        setOccupe(true);
        setCampagne((c) => (c ? { ...c, rollback: { enCours: true, fait: 0, total: result.snapshots.length, result: null } } : c));
        try {
            const rb = await rollbackCampaign(result, deps, (fait, total) =>
                setCampagne((c) => (c?.rollback ? { ...c, rollback: { ...c.rollback, fait, total } } : c)));
            setCampagne((c) => (c ? { ...c, rollback: { enCours: false, fait: rb.restored, total: result.snapshots.length, result: rb } } : c));
            repondre(rb.failed.length === 0
                ? `Retour à l'état stable : ${rb.restored} sauvegarde${rb.restored > 1 ? 's' : ''} restaurée${rb.restored > 1 ? 's' : ''} et vérifiée${rb.restored > 1 ? 's' : ''}.`
                : `Restauration partielle : ${rb.restored} restaurée${rb.restored > 1 ? 's' : ''}, ${rb.failed.length} échec${rb.failed.length > 1 ? 's' : ''} — ${rb.failed.map((f) => `${f.title} : ${f.cause}`).join(' ; ')}. Décision de la Direction requise.`);
            parlerProchainBilan.current = false;
            await onApresCampagne();
        } finally {
            setOccupe(false);
        }
    }, [campagne, occupe, deps, repondre, onApresCampagne]);

    // ── Question libre : la passerelle IA, avec les faits, étiquetée « IA ».
    const demanderIa = useCallback(async (question: string) => {
        if (!report) { repondre("Lancez d'abord l'analyse : je ne réponds qu'à partir de mesures réelles."); return; }
        setIaEnCours(true);
        try {
            const contexte = contextForLlm({ report, securite, rank });
            const reponse = await ia(`CONTEXTE (mesures réelles, JSON) :\n${contexte}\n\nQUESTION DE LA DIRECTION : ${question}`, SYSTEM_PROMPT);
            const texte = reponse.trim() || "La passerelle IA n'a rien répondu.";
            ajouter('ia', texte);
            void dire(texte);
        } catch (err) {
            repondre(`Passerelle IA indisponible : ${err instanceof Error ? err.message : String(err)}. Je reste disponible pour analyser, expliquer un point ou réparer.`);
        } finally {
            setIaEnCours(false);
        }
    }, [report, securite, rank, ia, ajouter, dire, repondre]);

    // ── Une consigne (voix ou texte) → une intention → une action. Jamais de portée devinée.
    const executer = useCallback(async (texte: string) => {
        const propre = texte.trim();
        if (!propre) return;
        ajouter('vous', propre);
        const intent = parseIntent(propre, report ?? undefined);
        switch (intent.kind) {
            case 'analyser': await analyser(); return;
            case 'reparer': await lancerCampagne(intent.scope); return;
            case 'preciser': repondre(intent.raison); return;
            case 'expliquer': {
                const state = intent.lineId ? parId.get(intent.lineId) : undefined;
                if (state) { repondre(explainLine(state, rank)); return; }
                await demanderIa(intent.query);
                return;
            }
            case 'restaurer':
                if (campagne?.result?.snapshots.length && !campagne.rollback) await restaurerLot();
                else repondre("Aucun lot restaurable : aucune réparation appliquée dans cette session. Les restaurations unitaires restent possibles depuis le journal.");
                return;
            case 'arreter': arreter(); return;
            case 'aide': repondre(helpText(rank)); return;
            case 'question': await demanderIa(intent.query); return;
        }
    }, [ajouter, report, analyser, lancerCampagne, repondre, parId, rank, demanderIa, campagne, restaurerLot, arreter]);
    useEffect(() => { executerRef.current = executer; }, [executer]);

    const envoyer = (e: React.FormEvent) => {
        e.preventDefault();
        const texte = saisie;
        setSaisie('');
        void executer(texte);
    };

    // ── Rendu.
    const verbe = rank.canRepair ? 'Réparer' : 'Diagnostiquer';
    const IconeVerbe = rank.canRepair ? Wrench : Stethoscope;
    const rouges = report?.tally.rouge ?? 0;
    const oranges = report?.tally.orange ?? 0;
    const inactif = occupe || analysing || !report;
    const avatarState: 'idle' | 'speaking' | 'thinking' = isSpeaking ? 'speaking' : (occupe || analysing || iaEnCours) ? 'thinking' : 'idle';
    const etat = isListening ? 'À l\'écoute' : isSpeaking ? 'Parle' : (occupe || analysing || iaEnCours) ? 'Réfléchit' : 'Prêt';
    const moteurVoix = !voix ? 'Voix coupée'
        : ttsEngine === 'browser_native' ? 'Voix du navigateur (secours)'
        : ttsEngine === 'elevenlabs' ? 'Voix HD ElevenLabs'
        : 'Voix HD ElevenLabs · secours navigateur';
    const progressionAnalyse = Math.round((phases.length / 2) * 100);

    return (
        <section aria-labelledby="assistant-titre" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)]">

                {/* ── Avatar existant (Directeur Diallo) ─────────────────── */}
                <div className="relative bg-slate-950 min-h-[15rem] lg:min-h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950" aria-hidden="true" />
                    <Avatar3D avatarId={AVATAR_ID} state={avatarState} audioLevel={isListening ? volume : 0} showHud={false} className="absolute inset-0" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                            <Bot size={12} /> Assistant IA
                        </span>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isListening ? 'bg-red-500 text-white animate-pulse' : isSpeaking ? 'bg-emerald-500 text-white' : avatarState === 'thinking' ? 'bg-amber-400 text-slate-900' : 'bg-white/15 text-white'
                        }`}>
                            {etat}
                        </span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 to-transparent">
                        <p className="text-sm font-black text-white">Directeur Diallo</p>
                        <p className="text-[11px] text-slate-300">Responsable de la santé globale de MokNet</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 inline-flex items-center gap-1">
                            {voix ? <Volume2 size={11} /> : <VolumeX size={11} />} {moteurVoix}
                        </p>
                    </div>
                </div>

                {/* ── Dialogue et commandes ─────────────────────────────── */}
                <div className="p-4 sm:p-5 space-y-4 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                            <h3 id="assistant-titre" className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-blue-600" /> Assistant Santé Globale
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Analyse tout, dit le bilan, répare sous contrôle — diagnostic, une confirmation par lot, sauvegarde, vérification, journal — jusqu'à une production vérifiable.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={basculerVoix} aria-pressed={voix}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                {voix ? <Volume2 size={14} /> : <VolumeX size={14} />} {voix ? 'Voix : activée' : 'Voix : coupée'}
                            </button>
                            <button type="button" onClick={() => void basculerMicro()} aria-pressed={isListening}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                        isListening ? 'bg-red-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}>
                                {isListening ? <MicOff size={14} /> : <Mic size={14} />} {isListening ? 'Arrêter le micro' : 'Parler'}
                            </button>
                        </div>
                    </div>

                    {erreurVoix && (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Voix : {erreurVoix}</p>
                    )}

                    {/* Journal du dialogue */}
                    <div ref={journalRef} aria-live="polite" aria-label="Dialogue avec l'assistant"
                         className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                        {messages.length === 0 ? (
                            <p className="px-3 py-4 text-xs text-slate-500">
                                {report ? 'Le bilan arrive.' : "Aucune mesure : cliquez « Analyser » pour tout scanner."}
                            </p>
                        ) : messages.map((m) => {
                            const s = LIBELLE_SOURCE[m.source];
                            return (
                                <div key={m.id} className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-2.5">
                                    <span className={`self-start shrink-0 sm:mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${s.classe}`}>{s.texte}</span>
                                    <p className={`text-sm leading-relaxed min-w-0 break-words ${m.source === 'vous' ? 'text-slate-600 italic' : 'text-slate-800'}`}>{m.texte}</p>
                                </div>
                            );
                        })}
                        {isListening && transcript && (
                            <div className="px-3 py-2 text-xs text-slate-500 italic">… {transcript}</div>
                        )}
                        {iaEnCours && (
                            <div className="px-3 py-2 text-xs text-violet-700 inline-flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> La passerelle IA rédige à partir des mesures…</div>
                        )}
                    </div>

                    {/* Consigne écrite — juste sous le dialogue, là où l'on répond à ce qu'on vient de lire */}
                    <form onSubmit={envoyer} className="flex items-center gap-2">
                        <label htmlFor="assistant-saisie" className="sr-only">Consigne ou question</label>
                        <input id="assistant-saisie" type="text" value={saisie} onChange={(e) => setSaisie(e.target.value)} autoComplete="off"
                               placeholder="Écrivez ici : « répare les rouges », « explique … », « restaure le lot », ou une question"
                               className="flex-1 min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" disabled={!saisie.trim()} aria-label="Envoyer"
                                className="px-3.5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <Send size={16} />
                        </button>
                    </form>

                    {/* Commandes */}
                    <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => void analyser()} disabled={analysing || occupe}
                                    className="px-4 py-2.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">
                                {analysing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                                {analysing ? `Analyse… ${progressionAnalyse} %` : 'Analyser'}
                            </button>
                            {analysing && (
                                <span className="text-[11px] font-bold text-slate-600 inline-flex items-center gap-2" aria-live="polite">
                                    <span className={phases.includes('serveur') ? 'text-emerald-700' : 'text-slate-400'}>{phases.includes('serveur') ? '✓' : '…'} sondes serveur</span>
                                    <span className={phases.includes('navigateur') ? 'text-emerald-700' : 'text-slate-400'}>{phases.includes('navigateur') ? '✓' : '…'} sondes navigateur</span>
                                </span>
                            )}
                            {!rank.canRepair && report && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                    <Lock size={12} /> Diagnostic seulement — rang {rank.role ?? 'inconnu'}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">{verbe}</span>
                            <button type="button" onClick={() => void lancerCampagne({ kind: 'tout' })} disabled={inactif || rouges + oranges === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                <IconeVerbe size={13} /> tout le lot <span className="tabular-nums opacity-80">({rouges + oranges})</span>
                            </button>
                            <button type="button" onClick={() => void lancerCampagne({ kind: 'rouges' })} disabled={inactif || rouges === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-black bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                                <IconeVerbe size={13} /> les rouges seuls <span className="tabular-nums opacity-80">({rouges})</span>
                            </button>
                            <button type="button" onClick={() => void lancerCampagne({ kind: 'oranges' })} disabled={inactif || oranges === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-black bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                                <IconeVerbe size={13} /> les oranges seuls <span className="tabular-nums opacity-80">({oranges})</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <label htmlFor="assistant-bloc" className="sr-only">Domaine</label>
                                <Layers size={14} className="text-slate-400 shrink-0" />
                                <select id="assistant-bloc" value={blocChoisi} onChange={(e) => setBlocChoisi(e.target.value as HealthBlockId)} disabled={inactif}
                                        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {HEALTH_BLOCKS.map((b) => (
                                        <option key={b.id} value={b.id}>{b.title} — {parBloc.get(b.id) ?? 0} à traiter</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => void lancerCampagne({ kind: 'bloc', blocId: blocChoisi })} disabled={inactif || (parBloc.get(blocChoisi) ?? 0) === 0}
                                        className="px-3 py-2 rounded-lg text-xs font-black bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                    <IconeVerbe size={13} /> ce domaine
                                </button>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                <label htmlFor="assistant-ligne" className="sr-only">Point</label>
                                <Crosshair size={14} className="text-slate-400 shrink-0" />
                                <select id="assistant-ligne" value={ligneChoisie} onChange={(e) => setLigneChoisie(e.target.value)} disabled={inactif || aCorriger.length === 0}
                                        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {aCorriger.length === 0 ? <option value="">Aucun point rouge ni orange</option> : aCorriger.map((l) => (
                                        <option key={l.line.id} value={l.line.id}>{MOT_STATUT[l.outcome.status].mot} · {l.line.title}{l.line.remediation ? '' : ' (manuel)'}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => ligneChoisie && void lancerCampagne({ kind: 'ligne', lineId: ligneChoisie })} disabled={inactif || !ligneChoisie}
                                        className="px-3 py-2 rounded-lg text-xs font-black bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                    <IconeVerbe size={13} /> ce point
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Progression de la campagne — le pourcentage à chaque boucle */}
                    {campagne && (
                        <Progression campagne={campagne} occupe={occupe} onArreter={arreter} />
                    )}
                </div>
            </div>

            {/* ── Résultats de la campagne, point par point ─────────────────── */}
            {campagne?.result && (
                <Resultats campagne={campagne} occupe={occupe} onOuvrirLigne={onOuvrirLigne} onRestaurer={() => void restaurerLot()} />
            )}

            {confirmation && (
                <ModaleLot confirmation={confirmation} />
            )}
        </section>
    );
};

// ─────────────────────────── Progression ───────────────────────────

const Progression: React.FC<{ campagne: Campagne; occupe: boolean; onArreter: () => void }> = ({ campagne, occupe, onArreter }) => {
    const { progress, plan } = campagne;
    const enCours = occupe && !campagne.result;
    const couleur = progress.phase === 'arret' ? 'bg-red-600' : progress.phase === 'termine' ? 'bg-emerald-600' : 'bg-blue-600';
    return (
        <div className="rounded-xl border border-slate-200 p-3.5 space-y-2" aria-live="polite">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{plan.mode === 'reparation' ? 'Campagne' : 'Diagnostic'} · {plan.label}</p>
                    <p className="text-sm font-black text-slate-900">
                        {LIBELLE_PHASE[progress.phase]}
                        <span className="text-slate-500 font-bold"> · Boucle {Math.min(progress.loop, progress.total)}/{progress.total} · </span>
                        <span className="tabular-nums">{progress.percent} %</span>
                    </p>
                    {progress.current && enCours && <p className="text-xs text-slate-600 truncate">En cours : {progress.current}</p>}
                </div>
                {enCours && (
                    <button type="button" onClick={onArreter}
                            className="px-3 py-1.5 rounded-lg text-xs font-black bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                        <OctagonX size={13} /> Arrêt
                    </button>
                )}
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-label="Progression de la campagne">
                <div className={`h-full rounded-full transition-all duration-300 ${couleur}`} style={{ width: `${progress.percent}%` }} />
            </div>
        </div>
    );
};

// ─────────────────────────── Résultats ───────────────────────────

const Resultats: React.FC<{
    campagne: Campagne;
    occupe: boolean;
    onOuvrirLigne: (id: string) => void;
    onRestaurer: () => void;
}> = ({ campagne, occupe, onOuvrirLigne, onRestaurer }) => {
    const result = campagne.result!;
    const c = result.counts;
    const resume = [
        c.reparee && `${c.reparee} réparé${c.reparee > 1 ? 's' : ''}`,
        c.diagnostiquee && `${c.diagnostiquee} diagnostiqué${c.diagnostiquee > 1 ? 's' : ''}`,
        c.rien_a_faire && `${c.rien_a_faire} sans rien à corriger`,
        c.echec && `${c.echec} échec${c.echec > 1 ? 's' : ''}`,
        c.manuelle && `${c.manuelle} manuel${c.manuelle > 1 ? 's' : ''}`,
        c.recommandee && `${c.recommandee} recommandé${c.recommandee > 1 ? 's' : ''}`,
        c.ignoree && `${c.ignoree} non tenté${c.ignoree > 1 ? 's' : ''}`,
    ].filter(Boolean).join(' · ');
    const restaurable = result.snapshots.length > 0 && !campagne.rollback;

    return (
        <div className="border-t border-slate-200">
            <div className="px-4 sm:px-5 py-3 flex items-center gap-2 flex-wrap">
                <ListChecks size={15} className="text-slate-400" />
                <h4 className="text-sm font-black text-slate-900">Résultats · {result.plan.label}</h4>
                <span className="text-[11px] text-slate-500">{resume || 'aucun point'}</span>
                <span className="flex-1" />
                {restaurable && (
                    <button type="button" onClick={onRestaurer} disabled={occupe}
                            className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <Undo2 size={13} /> Restaurer le lot ({result.snapshots.length})
                    </button>
                )}
            </div>

            {result.arret && (
                <div className="mx-4 sm:mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-start gap-2.5">
                    <AlertTriangle size={17} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-sm font-black text-red-900">
                            {result.arret.motif === 'incontrolable' ? 'Arrêt immédiat — situation incontrôlable' : result.arret.motif === 'refuse' ? 'Lot non confirmé' : 'Arrêt demandé'}
                        </p>
                        <p className="text-xs text-red-800 mt-0.5 break-words">{result.arret.detail}</p>
                        {result.snapshots.length > 0 && (
                            <p className="text-xs text-red-800 mt-1 font-semibold">
                                {campagne.rollback ? 'Retour à l\'état stable effectué (voir ci-dessous).' : 'Retour à l\'état stable initial : « Restaurer le lot » rejoue les sauvegardes en ordre inverse. Décision de la Direction.'}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {campagne.rollback && (
                <div className={`mx-4 sm:mx-5 mb-3 rounded-xl border p-3.5 ${campagne.rollback.result && campagne.rollback.result.failed.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`} aria-live="polite">
                    <p className="text-sm font-black text-slate-900 inline-flex items-center gap-2">
                        {campagne.rollback.enCours ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                        Retour à l'état stable · {campagne.rollback.fait}/{campagne.rollback.total} restauré{campagne.rollback.fait > 1 ? 's' : ''}
                    </p>
                    {campagne.rollback.result?.failed.map((f) => (
                        <p key={f.lineId} className="text-xs text-amber-900 mt-1"><strong>{f.title}</strong> : {f.cause}</p>
                    ))}
                </div>
            )}

            <div className="divide-y divide-slate-100 border-t border-slate-100">
                {result.items.map((r) => <LigneResultat key={r.item.state.line.id} r={r} mode={result.plan.mode} onOuvrirLigne={onOuvrirLigne} />)}
            </div>
        </div>
    );
};

const LigneResultat: React.FC<{ r: CampaignItemResult; mode: CampaignPlan['mode']; onOuvrirLigne: (id: string) => void }> = ({ r, mode, onOuvrirLigne }) => {
    const { line, outcome } = r.item.state;
    const style = STYLE_RESULTAT[r.status];
    const st = MOT_STATUT[outcome.status];
    const lien = resolveGuideUrl(r.link.manualUrl, { supabaseUrl: SUPABASE_URL });
    const montrerEtapes = r.steps.length > 0 && (r.status === 'echec' || r.status === 'manuelle' || r.status === 'recommandee' || r.status === 'ignoree');

    return (
        <div className="px-4 sm:px-5 py-3">
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${style.classe}`}>
                    <style.Icone size={10} /> {style.texte}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${st.aplat}`}>{st.mot}</span>
                <button type="button" onClick={() => onOuvrirLigne(line.id)} className="text-sm font-bold text-slate-900 hover:text-blue-700 hover:underline text-left">
                    {line.title}
                </button>
            </div>

            <div className="mt-1.5 text-xs text-slate-700 space-y-1.5">
                {r.status === 'reparee' && r.outcome && (
                    <p>
                        {r.outcome.changedCount} élément{r.outcome.changedCount > 1 ? 's' : ''} modifié{r.outcome.changedCount > 1 ? 's' : ''} ·
                        vérification : <strong>{r.verificationStatus ? MOT_STATUT[r.verificationStatus].mot : 'non concluante'}</strong> ·
                        {r.snapshotId ? ' sauvegarde prise, restaurable' : ' aucune sauvegarde renvoyée'}
                        {r.outcome.verification?.measured ? ` — ${r.outcome.verification.measured}` : ''}
                    </p>
                )}
                {(r.status === 'diagnostiquee' || r.status === 'rien_a_faire') && r.plan && (
                    <p>
                        {r.plan.summary || (r.status === 'rien_a_faire' ? "Le diagnostic n'a trouvé aucun élément à corriger." : '')}
                        {r.plan.affectedCount > 0 && <> · {r.plan.affectedCount} élément{r.plan.affectedCount > 1 ? 's' : ''}{r.plan.affectedTables.length ? ` · ${r.plan.affectedTables.join(', ')}` : ''}</>}
                        {mode === 'diagnostic' && r.status === 'diagnostiquee' && <strong> · rien n'a été modifié</strong>}
                    </p>
                )}
                {r.status === 'echec' && r.cause && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-red-700">Cause</p>
                        <p className="font-mono text-red-900 break-words">{r.cause}</p>
                    </div>
                )}
                {montrerEtapes && (
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{r.status === 'echec' ? 'Étapes exactes' : 'Étapes'}</p>
                        <ol className="list-decimal pl-4 space-y-0.5 mt-0.5">
                            {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button type="button" onClick={() => onOuvrirLigne(line.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <ChevronRight size={12} /> Ouvrir la fiche
                    </button>
                    {lien ? (
                        <a href={lien} target="_blank" rel="noopener noreferrer"
                           className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <ExternalLink size={12} /> Ouvrir l'endroit exact — {r.link.where}
                        </a>
                    ) : r.link.where ? (
                        <span className="text-[11px] text-slate-600">Où : <strong>{r.link.where}</strong></span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────── Confirmation du lot ───────────────────────────

const ModaleLot: React.FC<{ confirmation: ConfirmationLot }> = ({ confirmation }) => {
    const { plan, label, repondre } = confirmation;
    const [lu, setLu] = useState(false);
    const annulerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        annulerRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') repondre(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [repondre]);

    // Rendu dans document.body, comme la fiche et la modale unitaire (relevé
    // SAT-6) : les enveloppes de l'espace admin gardent un `transform` après
    // leur animation d'entrée, et un ancêtre transformé devient le cadre de
    // tout `position: fixed` — sans portail, la confirmation du lot se
    // cadrerait sur la boîte de l'onglet, pas sur la fenêtre.
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="lot-titre">
            <button type="button" className="absolute inset-0 bg-slate-900/50" onClick={() => repondre(false)} aria-label="Fermer sans appliquer" />
            <div className="relative w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto animate-fade-up">
                <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Une confirmation pour le lot</p>
                        <h3 id="lot-titre" className="text-base font-black text-slate-900 mt-0.5">Appliquer {label} ?</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Périmètre exact établi par le diagnostic. Rien n'a encore été modifié.</p>
                    </div>
                    <button type="button" onClick={() => repondre(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                        {plan.entries.map(({ item, plan: d }) => (
                            <li key={item.state.line.id} className="px-3 py-2.5">
                                <p className="text-sm font-bold text-slate-900">{item.state.line.title}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{item.state.line.remediation?.label} — {d.affectedCount} élément{d.affectedCount > 1 ? 's' : ''}{d.affectedTables.length ? ` · ${d.affectedTables.join(', ')}` : ''}{d.reversible ? ' · restaurable' : ' · NON restaurable'}</p>
                                {d.summary && <p className="text-[11px] text-slate-500 mt-0.5">{d.summary}</p>}
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm text-slate-800">
                        <strong>{plan.totalAffected}</strong> élément{plan.totalAffected > 1 ? 's' : ''} dans <strong>{plan.tables.length}</strong> table{plan.tables.length > 1 ? 's' : ''}{plan.tables.length ? ` (${plan.tables.join(', ')})` : ''}, en {plan.entries.length} point{plan.entries.length > 1 ? 's' : ''}.
                        Pour chaque point : sauvegarde avant, application, vérification après, journal. La campagne s'arrête d'elle-même à la première dérive.
                    </p>
                    <label className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                        <input type="checkbox" checked={lu} onChange={(e) => setLu(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span>J'ai lu le périmètre exact ci-dessus et j'autorise l'application du lot.</span>
                    </label>
                </div>

                <div className="px-5 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button ref={annulerRef} type="button" onClick={() => repondre(false)}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        Annuler — rien n'est appliqué
                    </button>
                    <button type="button" onClick={() => repondre(true)} disabled={!lu}
                            className="px-4 py-2.5 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                        <Wrench size={15} /> Appliquer le lot ({plan.entries.length})
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};
