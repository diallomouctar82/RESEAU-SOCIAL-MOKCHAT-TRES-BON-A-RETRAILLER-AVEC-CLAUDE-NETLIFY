
import React, { useState, useEffect, useRef } from 'react';
import { Command, Mic, Sparkles, ArrowRight, X, Zap, Globe, Briefcase, Home, Activity, Scale, StopCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { generateJSON } from '../services/aiGateway';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom'; // Assuming routing context, or passed prop
import { UserProfile } from '../types';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { describeCapabilitiesForHumans } from '../services/architecte/capabilityRegistry';

// LOOP 16/17 (Capability Registry plateforme, mission Architecte MOCnet) :
// « qu'est-ce que tu peux faire ? » est traité de façon 100% déterministe,
// sans appel LLM — la réponse ne peut donc jamais contenir une capacité
// inventée, uniquement ce que PLATFORM_CAPABILITY_REGISTRY contient
// réellement. Formulations volontairement précises (pas de simple "aide"
// seul, trop générique et qui intercepterait de vraies commandes de
// navigation contenant ce mot, ex. "aide-moi à trouver un emploi").
const DISCOVERY_PHRASES = [
    'que peux-tu faire',
    "qu'est-ce que tu peux faire",
    "qu'est ce que tu peux faire",
    'quelles sont tes capacités',
    'que sais-tu faire',
    "qu'est-ce que tu sais faire",
];

interface DialloOSProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: string, context?: any) => void;
    userProfile: UserProfile;
}

type AIAction = {
    type: 'NAVIGATE' | 'NOTIFICATION' | 'EXECUTE';
    target?: string;
    payload?: any;
    explanation: string;
};

// Sous-ensemble VOLONTAIREMENT restreint de capacités réellement exécutables
// depuis Diallo OS, sans dépendre de l'état interne d'un écran déjà monté.
// Toute cible EXECUTE hors de cette liste est explicitement refusée (voir
// handleExecute plus bas) plutôt que silencieusement ignorée ou faussement
// présentée comme réussie. Étendre cette liste = ajouter une entrée ici ET
// un cas dans handleExecute ; ce n'est PAS un routeur générique vers le
// registre de capacités (chantier explicitement hors périmètre).
const EXECUTABLE_TARGETS = new Set(['create_dossier']);

type ExecutionPhase = 'running' | 'done' | 'failed' | 'unsupported';
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
    const [activeAction, setActiveAction] = useState<AIAction | null>(null);
    const [execution, setExecution] = useState<ExecutionState | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

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

        const normalizedCommand = command.trim().toLowerCase();
        if (DISCOVERY_PHRASES.some((phrase) => normalizedCommand.includes(phrase))) {
            const summary = describeCapabilitiesForHumans();
            setAiResponse(summary);
            if (viaVoice) speak(summary);
            setIsThinking(false);
            return;
        }

        try {
            // SYSTEM PROMPT FOR OS CONTROL
            const systemPrompt = `Tu es Diallo OS, le système d'exploitation intelligent de l'application 'Le Monde à Vous'.
            L'utilisateur est : ${userProfile.name}, Niveau ${userProfile.level}.
            
            Ta mission : Analyser la demande de l'utilisateur et déterminer l'action UI à effectuer dans l'application.
            
            Les modules disponibles (target) sont :
            - 'home' (Dashboard)
            - 'social' (Réseau, Feed)
            - 'world' (Mobilité, Visas, Simulation voyage)
            - 'career' (Emploi, CV, Recrutement)
            - 'campus' (Formation, Cours)
            - 'wallet' (Banque, Transfert)
            - 'legal' (Juridique, Documents)
            - 'health' (Santé, SOS)
            - 'housing' (Logement)
            - 'chat' (Experts IA)
            - 'live' (Appel direct)
            - 'studio' (Création contenu)

            Réponds UNIQUEMENT en JSON strict au format suivant :
            {
                "type": "NAVIGATE",
                "target": "id_du_module",
                "explanation": "Court texte futuriste expliquant l'action (ex: 'Initialisation du protocole de recherche de logement...')",
                "payload": { "searchQuery": "..." } // Optionnel, données contextuelles
            }

            Exemple User: "Je veux partir travailler au Canada"
            Réponse JSON: { "type": "NAVIGATE", "target": "world", "explanation": "Activation du simulateur de mobilité vers le Canada.", "payload": { "country": "Canada", "intent": "work" } }

            Tu peux aussi déclencher UNE action réelle avec le type "EXECUTE" (écriture réelle, pas une simulation), mais UNIQUEMENT pour cette cible précise :
            - target: "create_dossier" — ouvre un vrai dossier de suivi pour la personne.
              payload attendu : { "titre": "Titre court et explicite", "categorie": "emploi|logement|sante|juridique|education|voyage|administration", "description": "Objectif en une phrase (optionnel)" }
              N'utilise "EXECUTE"/"create_dossier" QUE si la personne demande explicitement d'ouvrir, créer ou démarrer un dossier/suivi pour sa démarche (ex: "ouvre-moi un dossier pour chercher un emploi au Canada", "crée un suivi pour mon logement"). Dans le doute, préfère "NAVIGATE" vers le module concerné.
              Aucune autre valeur de "target" n'est exécutable avec "EXECUTE" pour l'instant : ne l'utilise jamais pour autre chose que "create_dossier".

            Exemple User: "Ouvre-moi un dossier pour chercher un emploi au Canada"
            Réponse JSON: { "type": "EXECUTE", "target": "create_dossier", "explanation": "Ouverture d'un dossier de suivi pour votre recherche d'emploi au Canada.", "payload": { "titre": "Recherche d'emploi au Canada", "categorie": "emploi", "description": "Trouver un emploi et préparer les démarches d'installation au Canada." } }
            `;

            const result = (await generateJSON<AIAction>(`Commande utilisateur : "${command}"`, {
                systemInstruction: systemPrompt
            })) || ({} as AIAction);
            
            setAiResponse(result.explanation);
            setActiveAction(result);
            // La classification est terminée : on arrête l'indicateur "en
            // réflexion" ici plutôt que d'attendre le `finally`, pour que
            // l'avancement réel d'une action EXECUTE (ci-dessous) reste
            // visible pendant son exécution au lieu d'être masqué par
            // l'animation de réflexion. Sans effet observable sur NAVIGATE :
            // aucun `await` ne séparait ce point du `finally` auparavant, qui
            // continue de plus de l'appeler (filet de sécurité inchangé).
            setIsThinking(false);

            if (viaVoice && result.explanation) {
                speak(result.explanation);
            }

            // Execute Navigation with delay for effect
            if (result.type === 'NAVIGATE' && result.target) {
                setTimeout(() => {
                    onNavigate(result.target!, result.payload);
                    onClose();
                }, 2000);
            } else if (result.type === 'EXECUTE' && result.target) {
                if (!EXECUTABLE_TARGETS.has(result.target)) {
                    // Honnêteté : jamais prétendre avoir exécuté une capacité
                    // hors du périmètre réellement câblé — on le dit clairement
                    // plutôt que de rester silencieux ou de simuler un succès.
                    setExecution({
                        phase: 'unsupported',
                        message: `Cette action ("${result.target}") n'est pas encore exécutable directement depuis Diallo OS.`,
                    });
                } else if (result.target === 'create_dossier') {
                    setExecution({ phase: 'running', message: 'Ouverture du dossier en cours...' });
                    const outcome = await createRealDossier(userProfile.id, result.payload || {});
                    // Comparaison explicite (`=== true`), pas une simple
                    // troncature de vérité : dans cet environnement TS, un
                    // `if (outcome.ok)` bare ne discrimine pas correctement
                    // cette union par ailleurs standard (vérifié isolément,
                    // indépendamment de la config du projet).
                    if (outcome.ok === true) {
                        setExecution({ phase: 'done', message: `Dossier « ${outcome.title} » créé avec succès.` });
                    } else {
                        setExecution({ phase: 'failed', message: outcome.error });
                    }
                }
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
                                            execution.phase === 'failed' ? 'text-red-300 bg-red-500/10 border-red-500/30' :
                                            'text-amber-300 bg-amber-500/10 border-amber-500/30'
                                        }`}>
                                            {execution.phase === 'running' && <Loader2 size={14} className="animate-spin" />}
                                            {execution.phase === 'done' && <CheckCircle2 size={14} />}
                                            {(execution.phase === 'failed' || execution.phase === 'unsupported') && <AlertTriangle size={14} />}
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
