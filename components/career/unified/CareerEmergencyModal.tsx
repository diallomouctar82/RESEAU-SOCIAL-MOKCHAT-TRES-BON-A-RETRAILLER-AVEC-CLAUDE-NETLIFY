import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  Video, 
  Zap, 
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CareerEmergencySituation } from '../../../types';
import { INITIAL_EMERGENCY_PRESETS } from '../../../services/careerUnifiedEngine';

interface CareerEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: () => void;
  onOpenCoachSimulation?: () => void;
  onOpenMasterResume?: () => void;
  onOpenQualityGate?: () => void;
}

export const CareerEmergencyModal: React.FC<CareerEmergencyModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
  onOpenCoachSimulation,
  onOpenMasterResume,
  onOpenQualityGate
}) => {
  const handleSimulator = onOpenCoachSimulation || onOpenSimulator || (() => {});

  const [selectedType, setSelectedType] = useState<'interview_soon' | 'dossier_urgent' | 'contract_offer' | 'client_meeting'>('interview_soon');
  const [activePreset, setActivePreset] = useState<CareerEmergencySituation>(INITIAL_EMERGENCY_PRESETS.interview_soon);
  const [stepsState, setStepsState] = useState(INITIAL_EMERGENCY_PRESETS.interview_soon.emergencySteps);

  if (!isOpen) return null;

  const handleSelectPreset = (type: 'interview_soon' | 'dossier_urgent' | 'contract_offer' | 'client_meeting') => {
    setSelectedType(type);
    const preset = INITIAL_EMERGENCY_PRESETS[type] || {
      isActive: true,
      emergencyType: type,
      headline: type === 'contract_offer' ? 'Proposition de Contrat Reçue (À auditer)' : 'Réunion Client / Partenaire Imprévue',
      targetEntity: 'Partenaire Stratégique',
      minutesRemaining: 45,
      emergencySteps: [
        { id: 'es1', instruction: 'Vérifier la clause d\'exclusivité et le montant net', completed: false },
        { id: 'es2', instruction: 'Consulter la grille de rémunération de référence', completed: false },
        { id: 'es3', instruction: 'Formuler la contre-proposition en 3 points', completed: false }
      ],
      keyTalkingPoints: ['« Merci pour votre offre, je souhaite clarifier le périmètre des primes de performance. »'],
      pitfallsToAvoid: ['Accepter sous la pression sans avoir relu les annexes.']
    };
    setActivePreset(preset);
    setStepsState(preset.emergencySteps);
  };

  const toggleStep = (stepId: string) => {
    setStepsState(prev => prev.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-rose-200 overflow-hidden my-8">
        
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 border border-rose-400/40 rounded-2xl text-rose-300 animate-pulse">
                <Flame size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
                  <Zap size={14} /> Mode Urgence Carrière Déclenché
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">Assistance Tactique Immédiate</h2>
                <p className="text-rose-200 text-xs md:text-sm mt-1">
                  Suspension des tâches secondaires : concentration totale sur votre échéance critique.
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

          {/* Emergency Selector Pills */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {[
              { id: 'interview_soon', label: 'Entretien < 30 min', icon: Clock },
              { id: 'dossier_urgent', label: 'Candidature urgente', icon: FileText },
              { id: 'contract_offer', label: 'Offre reçue', icon: ShieldAlert },
              { id: 'client_meeting', label: 'Réunion client', icon: Video }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSelectPreset(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
                  selectedType === tab.id
                    ? 'bg-white text-rose-950 shadow-md font-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Cible active</div>
              <div className="text-base font-black text-rose-950">{activePreset.targetEntity} — {activePreset.headline}</div>
            </div>
            {activePreset.minutesRemaining && (
              <div className="px-3.5 py-1.5 bg-rose-600 text-white font-black text-xs md:text-sm rounded-xl shadow-xs shrink-0 flex items-center gap-1.5">
                <Clock size={15} /> ~{activePreset.minutesRemaining} min
              </div>
            )}
          </div>

          {/* Checklist d'urgence */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={14} className="text-rose-600" /> Protocole d'action immédiat (À cocher)
            </h4>
            <div className="space-y-2">
              {stepsState.map(step => (
                <button
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    step.completed 
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through' 
                      : 'bg-white border-slate-200 text-slate-800 hover:border-rose-300'
                  }`}
                >
                  <span className="text-xs md:text-sm font-semibold">{step.instruction}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    step.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {step.completed && <CheckCircle2 size={14} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Antisèche Flash: 3 Points Clés à Dire */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> Vos 3 Arguments Chocs & Formules Gagnantes
            </div>
            <ul className="space-y-2 text-xs md:text-sm text-slate-200">
              {activePreset.keyTalkingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <span className="text-amber-400 font-bold">#{i+1}</span>
                  <span className="italic">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pièges à éviter absolument */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-700" /> Pièges mortels à éviter maintenant
            </div>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {activePreset.pitfallsToAvoid.map((pitfall, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">✗</span>
                  <span>{pitfall}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Action Directe */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleSimulator();
                onClose();
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-md shadow-rose-600/20 transition"
            >
              <Video size={15} />
              <span>Simulateur Vocal 3D</span>
            </button>

            <button
              onClick={() => {
                onOpenMasterResume();
                onClose();
              }}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition"
            >
              <FileText size={15} />
              <span>Antisèche & CV</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition"
          >
            Je suis prêt
          </button>
        </div>

      </div>
    </div>
  );
};
