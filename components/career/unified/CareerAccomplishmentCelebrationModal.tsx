import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Award, 
  TrendingUp, 
  Users, 
  Globe, 
  Briefcase, 
  HeartHandshake, 
  Flame,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { CareerAccomplishmentCelebration } from '../../../types';
import { INITIAL_CELEBRATION_DATA } from '../../../services/careerUnifiedEngine';

interface CareerAccomplishmentCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebration?: CareerAccomplishmentCelebration;
  celebrationData?: CareerAccomplishmentCelebration;
  achievedGoalTitle?: string;
  userName: string;
  onSelectNextAmbition: (ambitionTitle: string, pace: string, modeType: string) => void;
}

export const CareerAccomplishmentCelebrationModal: React.FC<CareerAccomplishmentCelebrationModalProps> = ({
  isOpen,
  onClose,
  celebration,
  celebrationData,
  achievedGoalTitle,
  userName,
  onSelectNextAmbition
}) => {
  const activeCelebration = celebration || celebrationData || INITIAL_CELEBRATION_DATA;
  const [selectedAmbitionId, setSelectedAmbitionId] = useState(activeCelebration.nextSuggestedAmbitions[0]?.id || 'next-1');
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const handleConfirmNextCycle = () => {
    setIsActivating(true);
    const chosen = activeCelebration.nextSuggestedAmbitions.find(a => a.id === selectedAmbitionId);
    if (chosen) {
      onSelectNextAmbition(chosen.title, chosen.recommendedPace, chosen.type);
    }
    setTimeout(() => {
      setIsActivating(false);
      onClose();
    }, 600);
  };

  const getAmbitionIcon = (type: string) => {
    switch (type) {
      case '90_first_days': return <Zap className="text-amber-500" size={20} />;
      case 'promotion': return <TrendingUp className="text-blue-500" size={20} />;
      case 'entrepreneurship': return <Briefcase className="text-emerald-500" size={20} />;
      case 'international': return <Globe className="text-indigo-500" size={20} />;
      case 'mentorship_transmission': return <HeartHandshake className="text-rose-500" size={20} />;
      default: return <Trophy className="text-amber-500" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-amber-200 overflow-hidden my-8">
        
        {/* Celebration Banner */}
        <div className="bg-amber-600 text-white p-6 md:p-8 relative text-center">
          <div className="absolute top-2 right-2">
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-16 h-16 bg-white/20 border-2 border-white/40 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg backdrop-blur-md">
            <Trophy size={36} className="text-yellow-200 animate-bounce" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-xs font-bold uppercase tracking-wider text-amber-100 mb-2">
            <Sparkles size={14} /> Consécration & Accomplissement Validé
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Félicitations, {userName} !
          </h2>
          <p className="text-amber-100 text-xs md:text-sm mt-1 max-w-xl mx-auto">
            Vous avez atteint votre Point B. Votre parcours s'est transformé en capital réel opposable.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Victory Card */}
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-3">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Résultat Majeur Validé</div>
            <div className="text-lg md:text-xl font-black text-slate-900">{activeCelebration.achievedResultTitle}</div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200/60 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-center">
                <div className="text-slate-500 text-[10px]">Temps de parcours</div>
                <div className="font-bold text-slate-900">{activeCelebration.totalDurationWeeks} semaines</div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-center">
                <div className="text-slate-500 text-[10px]">Jalons franchis</div>
                <div className="font-bold text-emerald-700">{activeCelebration.milestonesPassedCount} validés</div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-center">
                <div className="text-slate-500 text-[10px]">Relations créées</div>
                <div className="font-bold text-indigo-700">{activeCelebration.relationshipsCreatedCount} décideurs</div>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-center">
                <div className="text-slate-500 text-[10px]">Capital Preuve</div>
                <div className="font-bold text-amber-700">Mok Trust Niv. 5</div>
              </div>
            </div>
          </div>

          {/* Automatic Twin & Profile Enrichment */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} /> Ce que ce parcours a définitivement changé dans votre profil
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {activeCelebration.twinGainsSummary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Compétences verrouillées</div>
                <div className="text-slate-200 mt-0.5">{activeCelebration.skillsAcquired.join(' • ')}</div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Défis & Résilience</div>
                <div className="text-slate-200 mt-0.5">{activeCelebration.difficultiesOvercome[0]}</div>
              </div>
            </div>
          </div>

          {/* Prochaine Ambition : La boucle d'accomplissement */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={18} /> Quelle est maintenant votre prochaine ambition ?
              </h3>
              <span className="text-xs text-slate-500">Choisissez votre prochain Point B</span>
            </div>
            
            <div className="space-y-3">
              {activeCelebration.nextSuggestedAmbitions.map(ambition => (
                <button
                  key={ambition.id}
                  onClick={() => setSelectedAmbitionId(ambition.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                    selectedAmbitionId === ambition.id
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 shrink-0 shadow-xs">
                    {getAmbitionIcon(ambition.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">{ambition.title}</h4>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full shrink-0 ml-2">
                        {ambition.recommendedPace}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ambition.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <span className="text-xs text-slate-500">
            « Carrière ne s'arrête jamais : chaque résultat devient le Point A du prochain sommet. »
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs md:text-sm font-bold transition"
            >
              Conserver ce statut
            </button>
            <button
              onClick={handleConfirmNextCycle}
              disabled={isActivating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <span>{isActivating ? 'Activation en cours...' : 'Enclencher ce nouveau cycle'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
