import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  HelpCircle,
  Video,
  FileText,
  Users,
  GraduationCap
} from 'lucide-react';
import { CareerMasterDossier } from '../../../types';
import { askUniversalNextAction } from '../../../services/careerUnifiedEngine';

interface CareerWhatShouldIDoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: CareerMasterDossier;
  onExecuteAction?: (tabTarget: string, actionTitle: string) => void;
  onSelectAction?: (tabTarget: string, actionTitle: string) => void;
}

export const CareerWhatShouldIDoModal: React.FC<CareerWhatShouldIDoModalProps> = ({
  isOpen,
  onClose,
  dossier,
  onExecuteAction,
  onSelectAction
}) => {
  const handleAction = onExecuteAction || onSelectAction || (() => {});

  if (!isOpen) return null;

  const recommendation = askUniversalNextAction(dossier);

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'simulator': return <Video size={18} className="text-blue-600" />;
      case 'pipeline': return <Clock size={18} className="text-amber-600" />;
      case 'campus': return <GraduationCap size={18} className="text-emerald-600" />;
      case 'network': return <Users size={18} className="text-indigo-600" />;
      default: return <FileText size={18} className="text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-300">
                <HelpCircle size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <Sparkles size={14} /> Arbitrage Décisionnel Immédiat
                </div>
                <h2 className="text-2xl font-black tracking-tight">Que dois-je faire maintenant ?</h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1">
                  Priorisation instantanée par Diallo OS : pas de listes interminables, seulement vos 3 meilleurs leviers.
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
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 max-h-[65vh] overflow-y-auto">
          
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
            <TrendingUp className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <div className="text-xs md:text-sm text-blue-950 leading-relaxed">
              <strong>Conseiller Diallo OS :</strong> « En analysant votre Point B (<em>{dossier.pointBSummary}</em>), vos échéances du jour et vos opportunités chaudes, voici exactement où focaliser votre énergie : »
            </div>
          </div>

          {/* Top 3 Prioritized Actions */}
          <div className="space-y-4">
            {recommendation.topActions.map((action, idx) => (
              <div 
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition bg-white space-y-3 relative group"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {action.priority}
                    </span>
                    <div className="flex items-center gap-2">
                      {getTabIcon(action.tabTarget)}
                      <h4 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {action.title}
                      </h4>
                    </div>
                  </div>
                  
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    action.badge.includes('Urgent') ? 'bg-rose-100 text-rose-800' :
                    action.badge.includes('Relationnel') ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {action.badge}
                  </span>
                </div>

                {/* Why Now */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-blue-600" /> Pourquoi maintenant ?
                  </div>
                  <p>{action.reasonWhyNow}</p>
                </div>

                {/* Expected Gain & Action Button */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2">
                  <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Gain attendu : {action.expectedGain}
                  </div>

                  <button
                    onClick={() => {
                      handleAction(action.tabTarget, action.title);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition self-end sm:self-auto"
                  >
                    <span>Exécuter maintenant</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Recommandation mise à jour en temps réel
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs md:text-sm font-bold transition"
          >
            Compris
          </button>
        </div>

      </div>
    </div>
  );
};
