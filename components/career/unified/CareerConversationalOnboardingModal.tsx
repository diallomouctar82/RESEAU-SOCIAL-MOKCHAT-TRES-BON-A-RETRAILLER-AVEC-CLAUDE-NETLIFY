import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  MessageSquare, 
  Volume2, 
  UserCheck, 
  Target,
  Briefcase,
  GraduationCap,
  Globe
} from 'lucide-react';

interface CareerConversationalOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onCompleteOnboarding: (pointA: string, pointB: string, track: string) => void;
}

export const CareerConversationalOnboardingModal: React.FC<CareerConversationalOnboardingModalProps> = ({
  isOpen,
  onClose,
  userName,
  onCompleteOnboarding
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [ambitionText, setAmbitionText] = useState('Je souhaite devenir Directeur Commercial International ou piloter des grands comptes export.');
  const [currentSituationText, setCurrentSituationText] = useState('Cadre commercial B2B avec 6 ans d\'expérience terrain.');
  const [topSkills, setTopSkills] = useState(['Négociation commerciale', 'Prospection B2B', 'Gestion de comptes']);
  const [selectedTrack, setSelectedTrack] = useState<'emploi' | 'clients' | 'international' | 'reconversion'>('emploi');

  if (!isOpen) return null;

  const handleFinish = () => {
    onCompleteOnboarding(currentSituationText, ambitionText, selectedTrack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-300">
                <Compass size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <Sparkles size={14} /> Accueil & Onboarding Personnalisé
                </div>
                <h2 className="text-2xl font-black tracking-tight">Bienvenue dans Carrière</h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1">
                  Une première conversation bienveillante pour définir votre cap sans formulaires interminables.
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

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= s ? 'bg-blue-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* STEP 1: L'Ambition (Point B) */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-3 bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
                <MessageSquare className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <p className="text-xs md:text-sm text-blue-950 leading-relaxed">
                  <strong>Conseiller Diallo OS :</strong> « Bonjour {userName}. Pour commencer simplement : <em>qu'aimeriez-vous accomplir professionnellement dans les 12 à 24 prochains mois ?</em> »
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Votre Ambition / Rêve Pro</label>
                <textarea
                  value={ambitionText}
                  onChange={(e) => setAmbitionText(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ex : Devenir Directeur Export, trouver 5 clients B2B réguliers, m'expatrier au Canada..."
                />
              </div>

              {/* Quick Archetype suggestions */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">Ou choisissez une orientation type :</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: '🏆 Emploi Stratégique & Direction', track: 'emploi' },
                    { label: '💼 Clients & Mandats Indépendants', track: 'clients' },
                    { label: '🌍 Mobilité Internationale & Expatriation', track: 'international' },
                    { label: '🔄 Reconversion & Nouveau Métier', track: 'reconversion' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedTrack(item.track as any);
                        setAmbitionText(item.label.substring(3));
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 text-left font-medium text-slate-700 hover:bg-blue-50/50 transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Le Point A */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-3 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
                <UserCheck className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                <p className="text-xs md:text-sm text-indigo-950 leading-relaxed">
                  <strong>Conseiller Diallo OS :</strong> « Très clair ! Maintenant, où en êtes-vous aujourd'hui ? Décrivez votre situation actuelle en 2 phrases simples. »
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Votre Situation Actuelle (Point A)</label>
                <textarea
                  value={currentSituationText}
                  onChange={(e) => setCurrentSituationText(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Ex : Commercial B2B depuis 4 ans, maîtrise du négoce, pas encore d'expérience formelle à l'international..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: Les Forces & Compétences */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
                <GraduationCap className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                <p className="text-xs md:text-sm text-emerald-950 leading-relaxed">
                  <strong>Conseiller Diallo OS :</strong> « Quelles sont vos 3 forces ou compétences majeures que nous allons valoriser immédiatement dans votre Jumeau Pro ? »
                </p>
              </div>

              <div className="space-y-2">
                {topSkills.map((sk, index) => (
                  <input
                    key={index}
                    type="text"
                    value={sk}
                    onChange={(e) => {
                      const updated = [...topSkills];
                      updated[index] = e.target.value;
                      setTopSkills(updated);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder={`Force #${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Synthèse & Validation */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-slate-900">Voici ce que nous avons cadré ensemble</h3>
                <p className="text-xs text-slate-500">Validez pour activer votre GPS et votre Radar personnalisé.</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs md:text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Point A (Situation de départ)</span>
                  <div className="font-bold text-slate-900 mt-0.5">{currentSituationText}</div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Point B (Cap Cible)</span>
                  <div className="font-bold text-blue-950 mt-0.5">{ambitionText}</div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Forces Immédiates</span>
                  <div className="text-slate-700 mt-0.5">{topSkills.join(' • ')}</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Retour
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition"
            >
              <span>Continuer</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <span>Activer mon parcours</span>
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
