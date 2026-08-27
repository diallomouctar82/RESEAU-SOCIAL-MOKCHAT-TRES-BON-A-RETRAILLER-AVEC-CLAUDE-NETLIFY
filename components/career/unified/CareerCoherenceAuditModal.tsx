import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Compass, 
  Target,
  ArrowRight
} from 'lucide-react';
import { CareerCoherenceAuditResult } from '../../../types';

interface CareerCoherenceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: CareerCoherenceAuditResult;
  onAdjustStrategy: () => void;
}

export const CareerCoherenceAuditModal: React.FC<CareerCoherenceAuditModalProps> = ({
  isOpen,
  onClose,
  audit,
  onAdjustStrategy
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
                <Target size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <Sparkles size={14} /> Diagnostic d'Alignement Continu
                </div>
                <h2 className="text-2xl font-black tracking-tight">Test de Cohérence du Parcours</h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1">
                  Vérification automatique : vos actions actuelles servent-elles réellement votre Point B ?
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition text-slate-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Score & Alignment Banner */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            audit.isCoherent ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${audit.isCoherent ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
                {audit.isCoherent ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {audit.isCoherent ? 'Trajectoire 100% Alignée' : 'Légère Dispersion Détectée'}
                </div>
                <div className="text-base font-black">
                  Indice de Cohérence Stratégique : {audit.coherenceScore}%
                </div>
              </div>
            </div>
          </div>

          {/* Goal Reminder */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Point B de Référence</div>
            <div className="text-sm font-bold text-slate-900">{audit.initialGoalReminder}</div>
          </div>

          {/* Diagnosis Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analyse de l'Orchestrateur</h4>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
              {audit.diagnosisDetail}
            </p>
          </div>

          {/* Guidelines */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
            <strong>Garantie Déontologique Diallo OS :</strong> L'IA ne vous contraint jamais. Si vous souhaitez explorer d'autres secteurs ou changer d'ambition, le système recalculera simplement un nouveau Point B adapté.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={() => {
              onAdjustStrategy();
              onClose();
            }}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5"
          >
            <span>Ajuster mon Point B</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition"
          >
            Conserver ce cap
          </button>
        </div>

      </div>
    </div>
  );
};
