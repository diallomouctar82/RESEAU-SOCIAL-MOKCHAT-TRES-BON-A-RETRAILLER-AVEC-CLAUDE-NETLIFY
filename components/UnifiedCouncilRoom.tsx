import React, { useState } from 'react';
import { 
    Users, 
    Sparkles, 
    CheckCircle2, 
    RefreshCw, 
    Layers, 
    ArrowRight, 
    ShieldCheck, 
    AlertTriangle, 
    FileText, 
    Download, 
    Plus, 
    Trash2, 
    MessageSquare, 
    Check
} from 'lucide-react';
import { Agent, DossierParcours } from '../types';
import { AGENTS } from '../constants';
import { GoogleGenAI } from '@google/genai';

interface UnifiedCouncilRoomProps {
    onAttachStrategyToDossier?: (strategy: { title: string; content: string }) => void;
    onNotification: (title: string, message: string, type: 'success' | 'info' | 'warning') => void;
    activeDossier?: DossierParcours | null;
}

export const UnifiedCouncilRoom: React.FC<UnifiedCouncilRoomProps> = ({
    onAttachStrategyToDossier,
    onNotification,
    activeDossier
}) => {
    // Selected agents in council (default 3 core agents)
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['8', '2', '9']); // Directeur, Maître, Trésorier
    const [topic, setTopic] = useState(
        activeDossier 
            ? `Stratégie globale et sécurisation pour le dossier : "${activeDossier.title}". Objectif : ${activeDossier.goal}`
            : 'Création d’une filiale internationale avec mobilisation d’un prêt bancaire et conformité juridique des statuts'
    );
    const [isDeliberating, setIsDeliberating] = useState(false);
    const [dialogue, setDialogue] = useState<{ agentName: string; avatar: string; role: string; title: string; text: string }[]>([]);
    const [unifiedSynthesis, setUnifiedSynthesis] = useState<{
        consensus: string;
        actionPlan: { priority: string; action: string; owner: string }[];
        risksAndSafeguards: { risk: string; safeguard: string }[];
        requiredDocuments: string[];
        nextImmediateStep: string;
    } | null>(null);

    const toggleAgentSelection = (id: string) => {
        if (selectedAgentIds.includes(id)) {
            if (selectedAgentIds.length <= 2) {
                onNotification("Minimum Requis", "Le Conseil doit comporter au moins 2 experts.", "warning");
                return;
            }
            setSelectedAgentIds(prev => prev.filter(aId => aId !== id));
        } else {
            if (selectedAgentIds.length >= 5) {
                onNotification("Limite Atteinte", "Le Conseil est limité à 5 experts simultanés pour garantir la clarté.", "info");
                return;
            }
            setSelectedAgentIds(prev => [...prev, id]);
        }
    };

    const handleStartCouncil = async () => {
        if (!topic.trim()) return;
        setIsDeliberating(true);
        setDialogue([]);
        setUnifiedSynthesis(null);

        try {
            const activeAgents = AGENTS.filter(a => selectedAgentIds.includes(a.id));
            const ai = new GoogleGenAI();

            const prompt = `Tu es le Coordinateur Suprême "Diallo OS". 
            Organise une délibération collégiale entre les experts suivants :
            ${activeAgents.map(a => `- ${a.name} (${a.title} - Spécialité : ${a.specialty})`).join('\n')}

            Sujet / Problématique à traiter :
            "${topic}"

            Tu dois répondre STRICTEMENT au format JSON suivant :
            {
              "dialogue": [
                {
                  "agentId": "id",
                  "agentName": "Nom de l'expert",
                  "text": "Analyse experte directe, précise et argumentée (2-3 phrases percutantes)."
                }
              ],
              "unifiedSynthesis": {
                "consensus": "Stratégie globale unifiée et tranchée par le Conseil.",
                "actionPlan": [
                  { "priority": "P1 - Immédiat", "action": "Action concrète 1", "owner": "Nom expert responsable" },
                  { "priority": "P2 - Court terme", "action": "Action concrète 2", "owner": "Nom expert responsable" },
                  { "priority": "P3 - Consolidation", "action": "Action concrète 3", "owner": "Nom expert responsable" }
                ],
                "risksAndSafeguards": [
                  { "risk": "Risque majeur identifié", "safeguard": "Garde-fou et parade juridique/financière" }
                ],
                "requiredDocuments": [
                  "Document 1 requis",
                  "Document 2 requis"
                ],
                "nextImmediateStep": "La toute première action à exécuter dès aujourd'hui."
              }
            }`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const parsed = JSON.parse(res.text || '{}');
            
            // Format dialogue with agent profiles
            if (parsed.dialogue && Array.isArray(parsed.dialogue)) {
                const formattedDialogue = parsed.dialogue.map((d: any) => {
                    const matchedAgent = activeAgents.find(a => a.id === d.agentId || a.name.includes(d.agentName)) || activeAgents[0];
                    return {
                        agentName: matchedAgent.name,
                        avatar: matchedAgent.avatarUrl,
                        role: matchedAgent.role,
                        title: matchedAgent.title,
                        text: d.text
                    };
                });
                setDialogue(formattedDialogue);
            }

            if (parsed.unifiedSynthesis) {
                setUnifiedSynthesis(parsed.unifiedSynthesis);
            }

            onNotification("Conseil Conclu", "Le Conseil des Experts a formulé une stratégie unifiée.", "success");
        } catch (e: any) {
            onNotification("Erreur Délibération", e.message || "Erreur de communication", "warning");
        } finally {
            setIsDeliberating(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold">
                        <Users size={14} /> Diallo OS • Coordination Multi-Experts
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Chambre du Conseil des Experts
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Confrontez vos défis complexes à l'analyse croisée de vos experts. Le Conseil délibère et produit un plan stratégique unifié, sans contradictions.
                    </p>
                </div>
            </div>

            {/* Selection des Experts & Formulaire */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                        Composition du Conseil ({selectedAgentIds.length} experts sélectionnés) :
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {AGENTS.map(agent => {
                            const isSelected = selectedAgentIds.includes(agent.id);
                            return (
                                <button
                                    key={agent.id}
                                    type="button"
                                    onClick={() => toggleAgentSelection(agent.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-2 ${
                                        isSelected 
                                            ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20' 
                                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-60'
                                    }`}
                                >
                                    <div className="relative">
                                        <img src={agent.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs" />
                                        {isSelected && (
                                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-900 truncate w-full">{agent.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium truncate w-full">{agent.title}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Problématique / Défi Stratégique à Soumettre au Conseil :
                    </label>
                    <textarea 
                        rows={3}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Je souhaite ouvrir un restaurant bio à Dakar tout en obtenant un titre de séjour et en optimisant mes coûts de douane..."
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none leading-relaxed"
                    />
                </div>

                <div className="flex justify-between items-center pt-1">
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-bold self-center">Suggestions :</span>
                        {[
                            'Financement & Juridique',
                            'Immigration & Emploi',
                            'Éducation & Orientation',
                            'Achat Logement & Fiscalité'
                        ].map(preset => (
                            <button
                                key={preset}
                                onClick={() => setTopic(`Étude de faisabilité et plan d'action croisé pour : ${preset}`)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-medium"
                            >
                                {preset}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleStartCouncil}
                        disabled={isDeliberating || !topic.trim()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isDeliberating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        RÉUNIR LE CONSEIL
                    </button>
                </div>
            </div>

            {/* DÉLIBÉRATION EN DIRECT */}
            {dialogue.length > 0 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-up">
                    <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                        <MessageSquare size={18} className="text-indigo-600" />
                        Délibération Collégiale en Direct
                    </h3>

                    <div className="space-y-4">
                        {dialogue.map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3.5">
                                <img src={item.avatar} className="w-10 h-10 rounded-full object-cover border shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-slate-900">{item.agentName}</span>
                                        <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md">
                                            {item.title}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {item.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SYNTHÈSE STRATÉGIQUE UNIFIÉE */}
            {unifiedSynthesis && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-indigo-500/30 shadow-xl space-y-6 animate-fade-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">
                                    Consensus Atteint
                                </span>
                                <span className="text-xs text-slate-400 font-bold">• Décision Collégiale</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mt-1">
                                Feuille de Route Stratégique Unifiée
                            </h3>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (onAttachStrategyToDossier) {
                                        onAttachStrategyToDossier({
                                            title: `Stratégie Unifiée : ${topic.slice(0, 40)}...`,
                                            content: JSON.stringify(unifiedSynthesis, null, 2)
                                        });
                                    }
                                    onNotification("Stratégie Enregistrée", "Le plan du Conseil a été injecté dans vos dossiers actifs.", "success");
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                            >
                                <CheckCircle2 size={14} /> Injecter dans le Dossier
                            </button>
                        </div>
                    </div>

                    {/* 1. Consensus Global */}
                    <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1.5">
                        <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">🎯 1. Synthèse Globale & Consensus</h4>
                        <p className="text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                            {unifiedSynthesis.consensus}
                        </p>
                    </div>

                    {/* 2. Plan d'Action par Priorités */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">⚡ 2. Plan d'Action par Priorités</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {unifiedSynthesis.actionPlan.map((step, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                            {step.priority}
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-500">{step.owner}</span>
                                    </div>
                                    <p className="text-xs text-slate-800 font-bold">{step.action}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Risques & Garde-fous */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">⚖️ 3. Risques Identifiés & Garde-fous</h4>
                        <div className="space-y-2">
                            {unifiedSynthesis.risksAndSafeguards.map((item, idx) => (
                                <div key={idx} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-amber-900">Risque : {item.risk}</p>
                                        <p className="text-xs text-amber-800 font-medium">Garde-fou : {item.safeguard}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Documents Requis & Prochaine Action */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                            <h4 className="text-xs font-black uppercase text-slate-700">📋 Pièces & Documents à Réunir</h4>
                            <ul className="space-y-1.5 text-xs text-slate-700">
                                {unifiedSynthesis.requiredDocuments.map((doc, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span className="text-indigo-600 font-black">✓</span> {doc}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 flex flex-col justify-between">
                            <div>
                                <h4 className="text-xs font-black uppercase text-emerald-900">🚀 Prochaine Action Immédiate</h4>
                                <p className="text-xs sm:text-sm text-emerald-950 font-bold mt-1">
                                    {unifiedSynthesis.nextImmediateStep}
                                </p>
                            </div>
                            <button
                                onClick={() => onNotification("Action Lancée", `Lancement de : "${unifiedSynthesis.nextImmediateStep}"`, "success")}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs mt-3"
                            >
                                Exécuter Cette Action Immédiate <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
