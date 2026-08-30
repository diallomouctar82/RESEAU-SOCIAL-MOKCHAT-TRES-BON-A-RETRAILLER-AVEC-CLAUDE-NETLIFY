import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Pause, 
  Play, 
  X, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sliders, 
  Eye,
  FileText
} from 'lucide-react';
import { CareerAgentPermissionConfig, CareerAgentActivityLogItem } from '../../../types';

interface CareerAgentPermissionsLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: CareerAgentPermissionConfig;
  logs: CareerAgentActivityLogItem[];
  onUpdatePermissions: (updated: CareerAgentPermissionConfig) => void;
  onClearLogs?: () => void;
}

export const CareerAgentPermissionsLogsModal: React.FC<CareerAgentPermissionsLogsModalProps> = ({
  isOpen,
  onClose,
  permissions,
  logs,
  onUpdatePermissions,
  onClearLogs
}) => {
  const [currentConfig, setCurrentConfig] = useState<CareerAgentPermissionConfig>(permissions);
  const [activeTab, setActiveTab] = useState<'permissions' | 'logs'>('permissions');

  if (!isOpen) return null;

  const handleTogglePause = () => {
    const updated = {
      ...currentConfig,
      isAgentPaused: !currentConfig.isAgentPaused,
      lastPausedAt: !currentConfig.isAgentPaused ? new Date().toLocaleTimeString() : undefined
    };
    setCurrentConfig(updated);
    onUpdatePermissions(updated);
  };

  const handleModeChange = (mode: 'standard' | 'copilot' | 'auto_pilot') => {
    const updated = { ...currentConfig, autonomousMode: mode };
    setCurrentConfig(updated);
    onUpdatePermissions(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <Sliders size={14} /> Centre de Contrôle & Transparence
                </div>
                <h2 className="text-2xl font-black tracking-tight">Permissions de l'Agent IA & Activité</h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1">
                  Vous gardez le contrôle souverain : paramétrez les autorisations et auditez chaque action de l'Agent.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-full transition text-slate-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub-tabs Switcher */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10 flex-wrap gap-3">
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'permissions' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders size={14} />
                <span>Règles d'Autorisation</span>
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye size={14} />
                <span>Journal d'Activité IA ({logs.length})</span>
              </button>
            </div>

            {/* Bouton PAUSE TOUT */}
            <button
              onClick={handleTogglePause}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
                currentConfig.isAgentPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {currentConfig.isAgentPaused ? <Play size={14} /> : <Pause size={14} />}
              <span>{currentConfig.isAgentPaused ? 'Reprendre l\'Agent' : 'Pause de l\'Agent (Suspendre)'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* TAB 1: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              
              {/* Agent Status Notice */}
              {currentConfig.isAgentPaused ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-900 text-xs md:text-sm">
                  <Pause size={20} className="text-amber-600 shrink-0" />
                  <div>
                    <strong>Agent en pause :</strong> Les veilles automatiques et préparations d'arrière-plan sont suspendues. Vos données et parcours restent intacts.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs md:text-sm">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <strong>Agent opérationnel en mode {currentConfig.autonomousMode.toUpperCase()} :</strong> Il surveille les opportunités et prépare vos dossiers selon vos autorisations.
                  </div>
                </div>
              )}

              {/* Mode Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Niveau d'autonomie accordé à l'Agent
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'standard', title: 'Standard (Conseil)', desc: 'L\'agent n\'agit que lorsque vous lui demandez explicitement.' },
                    { id: 'copilot', title: 'Copilote (Recommandé)', desc: 'Veille continue + pré-génération des dossiers, validation obligatoire pour agir.' },
                    { id: 'auto_pilot', title: 'Pilote Automatique', desc: 'Automatise les relances courtoises non engageantes et la mise à jour du dossier.' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleModeChange(m.id as any)}
                      className={`p-4 rounded-2xl border text-left transition ${
                        currentConfig.autonomousMode === m.id
                          ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs md:text-sm text-slate-900">{m.title}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Pillars of Permissions Matrix */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Matrice de Contrôle Déontologique (Inviolable)
                </label>
                
                <div className="space-y-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">Analyse & Veille d'Opportunités</div>
                        <div className="text-xs text-slate-500">Scanner les bases d'appels d'offres et réseaux autorisés.</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      Toujours autorisé
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">Préparation de Dossiers & Notes de Cadrage</div>
                        <div className="text-xs text-slate-500">Générer les brouillons de candidature sur mesure.</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                      Pré-génération active
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">Envoi de Messages & Candidatures Externes</div>
                        <div className="text-xs text-slate-500">Transmission d'emails ou soumission d'offres.</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                      Validation Obligatoire
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                        4
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">Partage de Documents Privés & Identité</div>
                        <div className="text-xs text-slate-500">Données bancaires, pièces d'identité, CV non anonymisé.</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock size={12} /> Strictement Interdit
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LOGS / CE QUE MON AGENT A FAIT */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-500 flex-wrap gap-2">
                <span>Journal d'exécution temps réel</span>
                <div className="flex items-center gap-3">
                  <span>Transparence totale des requêtes internes</span>
                  {onClearLogs && logs.length > 0 && (
                    <button
                      onClick={onClearLogs}
                      className="text-rose-600 hover:text-rose-800 font-bold underline decoration-dotted underline-offset-2"
                    >
                      Vider le journal
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {logs.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                    Aucune activité enregistrée pour le moment.
                  </div>
                )}
                {logs.map(log => (
                  <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-600 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs md:text-sm font-bold text-slate-900">{log.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {log.outcomeBadge}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {log.isAutomatic ? '⚡ Exécution automatique autorisée' : '👤 Déclenché par l\'utilisateur'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            « L'IA propose et exécute ce qui est autorisé. Vous restez l'unique décideur. »
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition"
          >
            Enregistrer & Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
