import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle2, User, Video, Shield, 
  Sparkles, X, ChevronRight, ArrowRight, DollarSign, Globe
} from 'lucide-react';
import { AGENTS } from '../constants';
import { Agent, LiveStream } from '../types';

interface LiveExpertBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgent?: Agent;
  onConfirmBooking: (booking: {
    agent: Agent;
    date: string;
    slot: string;
    topic: string;
    isPaid: boolean;
  }) => void;
}

export const LiveExpertBookingModal: React.FC<LiveExpertBookingModalProps> = ({
  isOpen,
  onClose,
  selectedAgent = AGENTS[0],
  onConfirmBooking
}) => {
  const [activeAgent, setActiveAgent] = useState<Agent>(selectedAgent);
  const [selectedDate, setSelectedDate] = useState('Demain, 14h30');
  const [selectedSlot, setSelectedSlot] = useState('14:30 - 15:15 (45 min)');
  const [topic, setTopic] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const availableSlots = [
    { date: 'Aujourd\'hui, 17h00', slot: '17:00 - 17:45', isUrgent: true },
    { date: 'Demain, 10h00', slot: '10:00 - 10:45' },
    { date: 'Demain, 14h30', slot: '14:30 - 15:15' },
    { date: 'Jeudi, 11h15', slot: '11:15 - 12:00' },
    { date: 'Vendredi, 16h00', slot: '16:00 - 16:45' }
  ];

  const handleBook = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirmBooking({
        agent: activeAgent,
        date: selectedDate,
        slot: selectedSlot,
        topic: topic || 'Consultation stratégique & accompagnement de dossier',
        isPaid: false
      });
      setConfirmed(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0 animate-scale-in">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                <Calendar size={12} /> Réservation de Consultation Live
              </span>
              <span className="text-xs text-slate-400 font-bold">Accompagnement Personnalisé</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">Réserver une Séance 1-à-1 avec un Expert</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* 1. Expert Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Expert référent :</label>
            <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-2xl border border-white/10">
              <img src={activeAgent.avatarUrl} className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-white">{activeAgent.name}</h4>
                <p className="text-[11px] text-slate-400">{activeAgent.title} • {activeAgent.specialty}</p>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={11} /> Expert Certifié Réseau Mok
                </span>
              </div>
            </div>
          </div>

          {/* 2. Slot Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-400" /> Créneaux disponibles :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableSlots.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDate(s.date);
                    setSelectedSlot(s.slot);
                  }}
                  className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${selectedDate === s.date ? 'bg-indigo-600/30 border-indigo-500 text-white' : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'}`}
                >
                  <div>
                    <p className="text-xs font-bold">{s.date}</p>
                    <p className="text-[10px] text-slate-400">{s.slot}</p>
                  </div>
                  {s.isUrgent && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase rounded-md">
                      Urgent
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Purpose / Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Objet de la consultation / Dossier associé :
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Validation du plan de financement projet agritech..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Guarantee & Privacy */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-center gap-2.5 text-[11px] text-indigo-300">
            <Shield size={16} className="text-emerald-400 flex-shrink-0" />
            <span>Séance chiffrée, compte-rendu automatique par Diallo OS et rattachement à votre parcours.</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
          >
            Annuler
          </button>

          <button
            onClick={handleBook}
            disabled={confirmed}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-102"
          >
            {confirmed ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Rendez-vous Confirmé & Enregistré !</span>
              </>
            ) : (
              <>
                <Calendar size={14} />
                <span>Confirmer la Réservation</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
