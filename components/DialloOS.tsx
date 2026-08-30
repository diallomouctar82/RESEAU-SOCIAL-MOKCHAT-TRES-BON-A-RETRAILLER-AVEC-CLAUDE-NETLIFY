
import React, { useState, useEffect, useRef } from 'react';
import { Command, Mic, Sparkles, ArrowRight, X, Zap, Globe, Briefcase, Home, Activity, Scale, StopCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom'; // Assuming routing context, or passed prop
import { UserProfile } from '../types';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { describeCapabilitiesForHumans } from '../services/architecte/capabilityRegistry';
import {
    isDiscoveryCommand,
    runArchitecteCommand,
    type ArchitecteAction,
} from '../services/architecte/architecteBrain';

// « Qu'est-ce que tu peux faire ? » reste traité de façon 100% déterministe,
// sans appel LLM — la réponse ne peut donc jamais contenir une capacité
// inventée. La liste des formulations reconnues vit désormais dans le cerveau
// partagé (`isDiscoveryCommand`), pour que la barre flottante vocale réponde
// exactement comme ce modal.

interface DialloOSProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: string, context?: any) => void;
    userProfile: UserProfile;
}

// Cas d'exécution historique, antérieur au bus de capacités : `create_dossier`
// écrit directement dans `dossiers` depuis ce composant (voir
// createRealDossier plus bas). Conservé tel quel — il fonctionne, il est
// testé, et le migrer vers le bus n'apporterait rien à l'utilisateur.
// Toute AUTRE exécution passe désormais par le registre + le bus.
const LEGACY_EXECUTABLE_TARGETS = new Set(['create_dossier']);

type ExecutionPhase = 'running' | 'done' | 'failed' | 'unsupported' | 'denied' | 'cancelled';
interface ExecutionState {
    phase: ExecutionPhase;
    message: string;
}

/**
 * Ouvre réellement un dossier de suivi dans Supabase (table `dossiers`) —
 * même schéma et mêmes colonnes que l'outil serveur `create_dossier` de
 * l'orchestrateur IA (voir supabase/functions/ai-gateway/tools/actions.ts).
 * Écriture directe depuis le client, protégée par la policy RLS
 * `dossiers_insert_own` (with_check: owner_id = auth.uid()) : ni simulation
 * ni mock — le succès/échec renvoyé ici est celui réellement produit par
 * Supabase, jamais une confirmation optimiste affichée par avance.
 */
async function createRealDossier(
    ownerId: string,
    payload: { titre?: string; categorie?: string; description?: string }
): Promise<{ ok: true; title: string } | { ok: false; error: string }> {
    if (!isSupabaseConfigured) {
        return { ok: false, error: "Supabase n'est pas configuré dans cet environnement : aucun dossier réel ne peut être créé." };
    }
    const titre = typeof payload?.titre === 'string' ? payload.titre.trim() : '';
    if (!titre) {
        return { ok: false, error: "Titre manquant : impossible d'ouvrir le dossier." };
    }
    try {
        const { data, error } = await supabase
            .from('dossiers')
            .insert({
                owner_id: ownerId,
                title: titre,
                objective: typeof payload?.description === 'string' ? payload.description : null,
                category: typeof payload?.categorie === 'string' ? payload.categorie : null,
                status: 'active',
            })
            .select('id, title')
            .maybeSingle();

        if (error || !data) {
            return { ok: false, error: error?.message || 'La création du dossier a échoué.' };
        }
        return { ok: true, title: data.title as string };
    } catch (e: any) {
        return { ok: false, error: e?.message || 'La création du dossier a échoué (erreur réseau).' };
    }
}

export const DialloOS: React.FC<DialloOSProps> = ({ isOpen, onClose, onNavigate, userProfile }) => {
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [activeAction, setActiveAction] = useState<ArchitecteAction | null>(null);
    const [execution, setExecution] = useState<ExecutionState | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Les capacités portées par l'Architecte lui-même (Tâches, Paramètres,
    // Appareil — aucune ne dépend d'un état d'écran) sont enregistrées UNE
    // SEULE FOIS, depuis `ArchitecteFloatingBar`, qui est toujours montée.
    // Les enregistrer ici aussi créerait deux inscriptions concurrentes du
    // même identifiant, susceptibles de se désenregistrer mutuellement au
    // démontage. Les domaines Live/Contenu/Social, eux, dépendent réellement
    // de l'état de leur écran et s'enregistrent depuis celui-ci.

    const { isListening, startListening, stopListening, speak } = useVoiceAssistant({
        lang: 'fr-FR',
        onFinalTranscript: (transcript) => {
            setInput(transcript);
            handleExecute(transcript, true);
        },
    });

    const handleExecute = async (overrideInput?: string, viaVoice: boolean = false) => {
        const command = overrideInput || input;
        if (!command.trim()) return;

        setIsThinking(true);
        setAiResponse(null);
        setActiveAction(null);
        setExecution(null);

        if (isDiscoveryCommand(command)) {
            const summary = describeCapabilitiesForHumans();
            setAiResponse(summary);
            if (viaVoice) speak(summary);
            setIsThinking(false);
            return;
        }

        try {
            // Le prompt, les garde-fous anti-hallucination, la confirmation
            // proportionnelle au risque et les statuts d'exécution vivent
            // désormais dans le cerveau partagé — le modal (saisie clavier) et
            // la barre flottante (voix) sont deux incarnations d'une seule
            // logique, jamais deux implémentations qui pourraient diverger.
            const outcome = await runArchitecteCommand(command, {
                userName: userProfile.name,
                userLevel: userProfile.level,
                confirm: (message) => window.confirm(message),
                runLegacyTarget: async (target, payload) => {
                    if (!LEGACY_EXECUTABLE_TARGETS.has(target)) {
                        return { ok: false, message: "Cette action directe n'est pas reconnue." };
                    }
                    const res = await createRealDossier(userProfile.id, payload);
                    // Comparaison explicite (`=== true`), pas une simple
                    // troncature de vérité : dans cet environnement TS, un
                    // `if (res.ok)` bare ne discrimine pas correctement cette
                    // union par ailleurs standard.
                    return res.ok === true
                        ? { ok: true, message: `Dossier « ${res.title} » créé avec succès.` }
                        : { ok: false, message: res.error };
                },
                onPhase: (phase, message) => setExecution({ phase, message }),
            });

            setAiResponse(outcome.spoken);
            if (outcome.action) setActiveAction(outcome.action);
            // La classification est terminée : on arrête l'indicateur « en
            // réflexion » ici plutôt que dans le `finally`, pour que
            // l'avancement réel d'une exécution reste visible au lieu d'être
            // masqué par l'animation de réflexion.
            setIsThinking(false);

            if (viaVoice && outcome.spoken) speak(outcome.spoken);

            if (outcome.execution) {
                setExecution(outcome.execution);
                if (viaVoice) speak(outcome.execution.message);
            }

            if (outcome.action?.type === 'NAVIGATE' && outcome.action.target) {
                const target = outcome.action.target;
                const payload = outcome.action.payload;
                setTimeout(() => {
                    onNavigate(target, payload);
                    onClose();
                }, 2000);
            }

        } catch (e) {
            console.error(e);
            setAiResponse("Commande non reconnue. Veuillez reformuler.");
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl transition-opacity duration-300" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-black rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in">
                {/* Animated Gradient Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 opacity-20 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                
                <div className="relative z-10 p-2">
                    {/* Search Bar */}
                    <div className="flex items-center gap-4 bg-slate-900/90 rounded-2xl p-4 border border-white/10">
                        <div className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-600 text-white'}`}>
                            {isThinking ? <Loader2 className="animate-spin" /> : <Command size={24} />}
                        </div>
                        
                        <input 
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                            placeholder="Demandez à Diallo OS... (ex: 'Trouve-moi un job au Canada')"
                            className="flex-1 bg-transparent text-xl font-medium text-white placeholder-slate-500 outline-none"
                        />
                        
                        <button onClick={() => (isListening ? stopListening() : startListening())} className="text-slate-400 hover:text-white transition-colors">
                            <Mic size={24} className={isListening ? 'text-red-500' : ''} />
                        </button>
                        
                        <button onClick={() => onClose()} className="text-slate-400 hover:text-white transition-colors ml-2">
                            <X size={24} />
                        </button>
                    </div>

                    {/* AI Feedback Area */}
                    <div className="min-h-[150px] p-6 flex flex-col justify-center items-center text-center">
                        {isThinking ? (
                            <div className="space-y-4">
                                <div className="flex gap-2 justify-center">
                                    <span className="w-3 h-3 bg-brand-400 rounded-full animate-bounce"></span>
                                    <span className="w-3 h-3 bg-brand-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-3 h-3 bg-brand-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                                <p className="text-brand-300 font-mono text-sm uppercase tracking-widest">Coordination Famille Diallo en cours...</p>
                            </div>
                        ) : aiResponse ? (
                            <div className="animate-fade-up space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
                                    <Sparkles size={12} /> Cabinet Famille Diallo
                                </div>
                                <h3 className="text-2xl font-bold text-white leading-relaxed">
                                    "{aiResponse}"
                                </h3>
                                {activeAction?.type === 'NAVIGATE' && activeAction?.target && (
                                    <div className="flex justify-center mt-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-4 py-2 rounded-lg">
                                            <span>Redirection vers :</span>
                                            <span className="font-bold text-white uppercase">{activeAction.target}</span>
                                            <ArrowRight size={14} className="animate-pulse" />
                                        </div>
                                    </div>
                                )}

                                {execution && (
                                    <div className="flex justify-center mt-4">
                                        <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border ${
                                            execution.phase === 'running' ? 'text-brand-300 bg-white/5 border-white/10' :
                                            execution.phase === 'done' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' :
                                            execution.phase === 'failed' || execution.phase === 'denied' ? 'text-red-300 bg-red-500/10 border-red-500/30' :
                                            execution.phase === 'cancelled' ? 'text-slate-300 bg-white/5 border-white/10' :
                                            'text-amber-300 bg-amber-500/10 border-amber-500/30'
                                        }`}>
                                            {execution.phase === 'running' && <Loader2 size={14} className="animate-spin" />}
                                            {execution.phase === 'done' && <CheckCircle2 size={14} />}
                                            {execution.phase === 'cancelled' && <X size={14} />}
                                            {(execution.phase === 'failed' || execution.phase === 'unsupported' || execution.phase === 'denied') && <AlertTriangle size={14} />}
                                            <span>{execution.message}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full opacity-50">
                                {[
                                    { label: 'Carrière', icon: Briefcase, cmd: 'Cherche un emploi...' },
                                    { label: 'Voyage', icon: Globe, cmd: 'Simule mon visa...' },
                                    { label: 'Santé', icon: Activity, cmd: 'J\'ai de la fièvre...' },
                                    { label: 'Logement', icon: Home, cmd: 'Trouve un appart...' },
                                ].map((item, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { setInput(item.cmd); handleExecute(item.cmd); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        <item.icon className="text-slate-300" />
                                        <span className="text-xs font-bold text-slate-400">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Decorative Footer */}
                <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-purple-600 to-brand-500"></div>
            </div>
        </div>
    );
};
