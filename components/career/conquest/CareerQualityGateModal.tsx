import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Send, 
  FileText, 
  UserCheck, 
  Lock, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { QualityControlVerification, ConquestWarRoomDossier } from '../../../types';

interface CareerQualityGateModalProps {
  dossier: ConquestWarRoomDossier;
  onConfirmAction: () => void;
  onClose: () => void;
}

export const CareerQualityGateModal: React.FC<CareerQualityGateModalProps> = ({
  dossier,
  onConfirmAction,
  onClose
}) => {
  const [qc, setQc] = useState<QualityControlVerification>(dossier.qualityControl);
  const [userConfirmedCheck, setUserConfirmedCheck] = useState(false);

  const isAllVerified = 
    qc.isTargetRecipientVerified &&
    qc.isOpportunityMatchingVerified &&
    qc.areAllRequiredDocsAttached &&
    qc.isLanguageAndSpellingClean &&
    qc.isPersonalDataProtected &&
    qc.isFormatCompliant &&
    userConfirmedCheck;

  const handleToggle = (key: keyof QualityControlVerification) => {
    setQc(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 text-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* HEADER */}
        <div className="p-5 md:p-6 bg-slate-950 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 rounded-2xl">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Contrôle Qualité & Autorisation</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-extrabold border border-emerald-800/60 flex items-center gap-1">
                  <Lock size={10} /> Humain Maître de l'Action
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black">
                Validation Finale Avant Transmission
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-3 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 space-y-5 text-xs">
          
          {/* SUMMARY OF ACTION */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dossier Cible :</span>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-white">{dossier.opportunity.title}</h4>
                <p className="text-xs text-blue-400">{dossier.opportunity.entity} · {dossier.opportunity.location}</p>
              </div>
              <span className="px-2.5 py-1 bg-blue-950 text-blue-300 rounded-lg text-xs font-bold border border-blue-800/50 capitalize">
                {dossier.opportunity.universe}
              </span>
            </div>
          </div>

          {/* CHECKLIST GATE */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" /> Points de Contrôle de Conformité
            </h4>

            {[
              {
                key: 'isTargetRecipientVerified',
                label: 'Bon destinataire et contact qualifié',
                desc: `Adresse et canal confirmés (${dossier.opportunity.entity}).`
              },
              {
                key: 'isOpportunityMatchingVerified',
                label: 'Adéquation des termes et de l\'offre',
                desc: 'Le CV et la proposition répondent précisément aux critères demandés.'
              },
              {
                key: 'areAllRequiredDocsAttached',
                label: 'Pièces requises et justificatifs inclus',
                desc: 'CV contextualisé, lettre/offre et attestations vérifiées Le Monde à Vous.'
              },
              {
                key: 'isLanguageAndSpellingClean',
                label: 'Qualité linguistique et orthographe soignée',
                desc: 'Texte révisé et structuré selon les standards d\'élite Diallo.'
              },
              {
                key: 'isPersonalDataProtected',
                label: 'Protection des données privées & coordonnées sécurisées',
                desc: 'Aucune donnée sensible superflue n\'est exposée.'
              },
              {
                key: 'isFormatCompliant',
                label: 'Format et canaux conformes',
                desc: 'Format PDF/texte respectant les spécifications de l\'organisation.'
              }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => handleToggle(item.key as any)}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  (qc as any)[item.key]
                    ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`mt-0.5 rounded-lg p-1 ${
                  (qc as any)[item.key] ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">{item.label}</span>
                  <span className="text-[11px] text-slate-400">{item.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {/* FINAL HUMAN CONSENT */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={userConfirmedCheck}
                onChange={(e) => setUserConfirmedCheck(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
              <div className="text-xs text-slate-200 leading-snug">
                <strong className="block text-emerald-300 font-bold">Autorisation explicite de l'utilisateur :</strong>
                J'ai relu les documents de ce dossier et j'autorise formellement l'engagement de cette démarche et son enregistrement dans mon Suivi de Carrière.
              </div>
            </label>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            Revenir à l'Atelier
          </button>

          <button
            onClick={onConfirmAction}
            disabled={!isAllVerified}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Send size={14} />
            <span>Valider l'action & Passer en Suivi Continu</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};
