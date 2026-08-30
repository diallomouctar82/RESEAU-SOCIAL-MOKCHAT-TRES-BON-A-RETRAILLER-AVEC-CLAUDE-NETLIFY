import React, { useState } from 'react';
import { 
  RadarOpportunityItem, 
  OpportunityFeedbackRecord 
} from '../../types';
import { 
  X, 
  ThumbsDown, 
  Sparkles, 
  CheckCircle, 
  DollarSign, 
  MapPin, 
  Compass, 
  Clock, 
  Building2 
} from 'lucide-react';

interface CareerOpportunityFeedbackModalProps {
  opportunity: RadarOpportunityItem;
  onSaveFeedback: (record: Omit<OpportunityFeedbackRecord, 'id' | 'timestamp'>) => void;
  onClose: () => void;
}

const REASONS: { id: OpportunityFeedbackRecord['declineReason']; label: string; icon: any }[] = [
  { id: 'salary_too_low', label: 'Rémunération / Budget insuffisant', icon: DollarSign },
  { id: 'location_unsuitable', label: 'Localisation / Déplacements inadaptés', icon: MapPin },
  { id: 'domain_mismatch', label: 'Secteur ou type de mission hors de mon Point B', icon: Compass },
  { id: 'level_mismatch', label: 'Niveau d\'expérience trop junior ou trop senior', icon: Building2 },
  { id: 'bad_timing', label: 'Échéance trop courte ou timing incompatible', icon: Clock },
  { id: 'company_reputation', label: 'Type d\'organisation non souhaité', icon: Building2 },
  { id: 'other', label: 'Autre motif', icon: Sparkles }
];

export const CareerOpportunityFeedbackModal: React.FC<CareerOpportunityFeedbackModalProps> = ({
  opportunity,
  onSaveFeedback,
  onClose
}) => {
  const [selectedReason, setSelectedReason] = useState<OpportunityFeedbackRecord['declineReason']>('salary_too_low');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFeedback({
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      action: 'declined',
      declineReason: selectedReason,
      feedbackNotes: notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider mb-1">
              <Sparkles size={14} /> Apprentissage du Radar Personnel
            </div>
            <h3 className="text-xl font-black">
              Pourquoi cette offre ne vous convient pas ?
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Votre retour affine instantanément les futurs calculs de pertinence de votre agent.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-slate-900 text-sm line-clamp-1">{opportunity.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{opportunity.entity} • {opportunity.location}</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Raison principale du désintérêt :</label>
            <div className="space-y-1.5">
              {REASONS.map(reason => {
                const isSelected = selectedReason === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <reason.icon size={15} />
                    <span>{reason.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Précision libre (Optionnel) :</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Je souhaite uniquement des contrats avec au moins 3 jours de télétravail par semaine..."
              className="w-full h-20 bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Enregistrer & Ajuster le Radar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
