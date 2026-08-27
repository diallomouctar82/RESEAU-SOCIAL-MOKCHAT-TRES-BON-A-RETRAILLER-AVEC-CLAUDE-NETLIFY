import React from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  X, 
  Users, 
  Award, 
  Video, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { CareerProfessionalImpactData } from '../../../types';

interface CareerImpactTransmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  impact: CareerProfessionalImpactData;
  userName: string;
  onOpenMentorshipHub: () => void;
  onOpenTribes: () => void;
}

export const CareerImpactTransmissionModal: React.FC<CareerImpactTransmissionModalProps> = ({
  isOpen,
  onClose,
  impact,
  userName,
  onOpenMentorshipHub,
  onOpenTribes
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-rose-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-pink-950 to-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-2xl text-rose-300">
                <HeartHandshake size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider">
                  <Sparkles size={14} /> Accomplissement & Boucle de Contribution
                </div>
                <h2 className="text-2xl font-black tracking-tight">Mon Impact Professionnel</h2>
                <p className="text-rose-200 text-xs md:text-sm mt-1">
                  Apprendre ➔ Progresser ➔ Accomplir ➔ Transmettre : valorisez ce que vous apportez aux autres.
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

          {/* Key Impact Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-center">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-2xl font-black text-white">{impact.peopleHelpedCount}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Personnes Aidées</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-2xl font-black text-rose-300">{impact.projectsCompletedCount}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Projets Livrés</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-2xl font-black text-amber-300">{impact.knowledgeTransmittedCount}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Notions Transmises</div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="text-2xl font-black text-emerald-300">{impact.mentorshipLiveSessionsCount}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">Sessions Mentorat</div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
            <ShieldCheck size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-rose-950 leading-relaxed">
              <strong>Philosophie Diallo OS :</strong> « La réussite professionnelle prend tout son sens lorsqu'elle inspire et hisse la communauté vers le haut. Chaque mentorat enrichit votre réputation certifiée Mok Trust. »
            </p>
          </div>

          {/* Active Tribes & Transmission Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users size={14} className="text-rose-600" /> Vos Espaces Actifs de Transmission & Tribus
            </h4>
            <div className="space-y-2">
              {impact.tribesActiveContribution.map((tribu, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs md:text-sm font-bold text-slate-900">{tribu}</div>
                      <div className="text-xs text-slate-500">Membre actif et mentor référent</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenTribes();
                      onClose();
                    }}
                    className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-xl transition"
                  >
                    Ouvrir la Tribu
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 space-y-2">
              <h5 className="text-xs md:text-sm font-bold text-indigo-950 flex items-center gap-2">
                <HeartHandshake size={16} className="text-indigo-600" /> Proposer un créneau de mentorat
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Offrez 30 minutes de coaching bénévole à un jeune professionnel du réseau.
              </p>
              <button
                onClick={() => {
                  onOpenMentorshipHub();
                  onClose();
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Gérer mes mentorats</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 space-y-2">
              <h5 className="text-xs md:text-sm font-bold text-amber-950 flex items-center gap-2">
                <Video size={16} className="text-amber-600" /> Organiser un Live Thématique
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Partagez un cas pratique d'export ou de négociation avec votre Tribu.
              </p>
              <button
                onClick={() => {
                  onOpenTribes();
                  onClose();
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Planifier un Live</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            « Qui transmet son savoir multiplie son influence. »
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
