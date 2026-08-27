import React, { useState } from 'react';
import { 
  AlertCircle, Sparkles, MessageSquare, Video, Calendar, 
  UserCheck, ArrowRight, X, Shield, Clock, CheckCircle2, Zap
} from 'lucide-react';
import { AGENTS } from '../constants';
import { Agent } from '../types';

interface LiveInstantHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchLiveWithAgent: (agent: Agent) => void;
  onOpenMokChat: (agent: Agent) => void;
  onBookHumanExpert: (agent: Agent) => void;
}

export const LiveInstantHelpModal: React.FC<LiveInstantHelpModalProps> = ({
  isOpen,
  onClose,
  onLaunchLiveWithAgent,
  onOpenMokChat,
  onBookHumanExpert
}) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<'legal' | 'project' | 'finance' | 'health' | 'housing'>('project');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<{
    matchedAgent: Agent;
    urgencyLevel: 'haute' | 'moyenne' | 'standard';
    reason: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAnalyzeHelp = () => {
    if (!problemDescription.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      let matched = AGENTS[0];
      if (selectedDomain === 'legal') matched = AGENTS.find(a => a.id === '3') || AGENTS[0];
      if (selectedDomain === 'finance') matched = AGENTS.find(a => a.id === '4') || AGENTS[0];
      if (selectedDomain === 'health') matched = AGENTS.find(a => a.id === '2') || AGENTS[0];
      if (selectedDomain === 'housing') matched = AGENTS.find(a => a.id === '5') || AGENTS[0];

      setRecommendation({
        matchedAgent: matched,
        urgencyLevel: 'haute',
        reason: `Dossier prioritaire identifié. L'assistant ${matched.name} dispose des compétences requises en ${matched.specialty} pour débloquer votre situation immédiatement.`
      });
      setIsAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-scale-in">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-b border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                <Zap size={13} className="animate-bounce text-amber-300" /> AIDE-MOI MAINTENANT
              </span>
              <span className="text-xs text-slate-400 font-bold">Assistance Immédiate Multi-Canaux</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">Résolution d'Urgence & Accompagnement Instantané</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Step 1: Describe issue */}
          {!recommendation && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Dans quel domaine rencontrez-vous une difficulté bloquante ?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'project', label: 'Projet', icon: '🚀' },
                    { id: 'legal', label: 'Juridique', icon: '⚖️' },
                    { id: 'finance', label: 'Finance', icon: '💳' },
                    { id: 'health', label: 'Santé', icon: '🩺' },
                    { id: 'housing', label: 'Logement', icon: '🏠' }
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDomain(d.id as any)}
                      className={`p-2.5 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${selectedDomain === d.id ? 'bg-rose-600/20 border-rose-500 text-white shadow-md' : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'}`}
                    >
                      <span className="text-base">{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Expliquez en quelques mots ce qui bloque :
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Ex: Mon dossier de financement bancaire est refusé pour manque de garantie, ou j'ai un problème urgent avec mon titre de séjour..."
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleAnalyzeHelp}
                disabled={isAnalyzing || !problemDescription.trim()}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles size={14} className="animate-spin" />
                    <span>Analyse du parcours et affectation de l'expert en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Trouver la Meilleure Solution Immédiate</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: 4 Instant Resolution Paths */}
          {recommendation && (
            <div className="space-y-4 animate-scale-in">
              
              <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                <img src={recommendation.matchedAgent.avatarUrl} className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-500/40 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-white">{recommendation.matchedAgent.name}</h4>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-md">
                      Expert Recommandé
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {recommendation.reason}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Choisissez votre mode d'intervention :</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option A: Expert IA Immédiatement (Live Instantané) */}
                  <div 
                    onClick={() => {
                      onClose();
                      onLaunchLiveWithAgent(recommendation.matchedAgent);
                    }}
                    className="p-4 bg-slate-950/80 hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                        <Video size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">Instantané (0 sec)</span>
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-rose-300">Live IA Immédiat</h5>
                    <p className="text-[11px] text-slate-400">
                      Entrez en appel audio & visuel direct avec le copilote IA dédié.
                    </p>
                  </div>

                  {/* Option B: Mok Chat Permanent */}
                  <div 
                    onClick={() => {
                      onClose();
                      onOpenMokChat(recommendation.matchedAgent);
                    }}
                    className="p-4 bg-slate-950/80 hover:bg-indigo-950/20 border border-white/10 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <MessageSquare size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400">Chat & Vocaux</span>
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-indigo-300">Continuer dans Mok Chat</h5>
                    <p className="text-[11px] text-slate-400">
                      Échangez par messages écrits, vocaux et partage de documents.
                    </p>
                  </div>

                  {/* Option C: Rejoindre la Permanence Live Collective */}
                  <div 
                    onClick={() => {
                      onClose();
                      onLaunchLiveWithAgent(recommendation.matchedAgent);
                    }}
                    className="p-4 bg-slate-950/80 hover:bg-amber-950/20 border border-white/10 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-amber-400">Espace Conseil</span>
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-amber-300">Session Conseil & Diagnostic</h5>
                    <p className="text-[11px] text-slate-400">
                      Mobiliser le Conseil collégial d'experts en 6 étapes structurées.
                    </p>
                  </div>

                  {/* Option D: Expert Humain sur Rendez-vous */}
                  <div 
                    onClick={() => {
                      onClose();
                      onBookHumanExpert(recommendation.matchedAgent);
                    }}
                    className="p-4 bg-slate-950/80 hover:bg-purple-950/20 border border-white/10 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-purple-400">Humain Certifié</span>
                    </div>
                    <h5 className="text-xs font-bold text-white group-hover:text-purple-300">Rendez-vous Humain</h5>
                    <p className="text-[11px] text-slate-400">
                      Réservez un créneau avec un professionnel certifié de l'écosystème.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Shield size={13} className="text-emerald-400" />
            <span>Assistance confidentielle & sécurisée</span>
          </div>
          {recommendation && (
            <button
              onClick={() => setRecommendation(null)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Modifier la demande
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
