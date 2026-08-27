import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Scale, 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle, 
  DollarSign, 
  MessageSquare, 
  Bot,
  UserCheck
} from 'lucide-react';
import { CommercialDossier } from '../types';

interface TradeDisputeMediationModalProps {
  dossier: CommercialDossier;
  isOpen: boolean;
  onClose: () => void;
  onSubmitDispute: (disputeData: NonNullable<CommercialDossier['disputeData']>) => void;
  onOpenExpertChat?: (agentId?: string, prompt?: string) => void;
}

export const TradeDisputeMediationModal: React.FC<TradeDisputeMediationModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onSubmitDispute,
  onOpenExpertChat
}) => {
  const existing = dossier.disputeData;

  const [reason, setReason] = useState<NonNullable<CommercialDossier['disputeData']>['reason']>(
    existing?.reason || 'damage'
  );
  const [claimAmount, setClaimAmount] = useState<number>(existing?.claimAmount || 450);
  const [description, setDescription] = useState<string>(
    existing?.mediationNotes?.[0] || '120 boîtes présentent une déchirure lors de la manutention portuaire. Demande d\'avoir ou réexpédition.'
  );
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>(
    existing?.evidenceDocs || [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'
    ]
  );
  const [proposedSolution, setProposedSolution] = useState<'partial_refund' | 'reshipment' | 'credit_note' | 'full_refund'>('credit_note');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dispute: NonNullable<CommercialDossier['disputeData']> = {
      id: existing?.id || `disp-${Date.now()}`,
      openedBy: 'buyer',
      openedAt: existing?.openedAt || 'Aujourd\'hui',
      reason,
      status: 'under_mediation',
      claimAmount,
      evidenceDocs: evidencePhotos,
      mediationNotes: [
        description,
        `Solution proposée : ${proposedSolution === 'credit_note' ? 'Avoir commercial sur prochaine commande' : proposedSolution === 'reshipment' ? 'Réexpédition par avion' : 'Remboursement sur compte séquestre'}.`,
        'Médiateur Diallo OS : Notification envoyée aux deux parties avec séquestre conservatoire des fonds résiduels.'
      ]
    };

    onSubmitDispute(dispute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <Scale size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Espace Litige & Médiation Commerciale</h3>
              <p className="text-xs text-slate-400">
                Dossier : <strong className="text-white">{dossier.codeRef}</strong> • Règlement amiable assisté
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-300">
          
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200 leading-relaxed">
              L'ouverture d'un litige bloque temporairement la libération automatique des fonds séquestrés (Escrow) et active la médiation documentaire Diallo OS.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-white block mb-1">Motif Principal de la Réclamation</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-rose-500"
            >
              <option value="damage">Avarie / Marchandise endommagée au transport</option>
              <option value="quantity">Manquant / Quantité livrée inférieure à la commande</option>
              <option value="wrong_product">Non-conformité aux spécifications techniques / BAT</option>
              <option value="delay">Retard excessif non justifié impactant l'activité</option>
              <option value="document_missing">Documents douaniers ou sanitaires manquants</option>
              <option value="payment_issue">Différend sur les frais bancaires ou change</option>
              <option value="other">Autre litige commercial</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-white block mb-1">
                Montant Réclamé / Préjudice ({dossier.currency})
              </label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-rose-400 outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-white block mb-1">
                Solution Amiable Préférée
              </label>
              <select
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value as any)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              >
                <option value="credit_note">Avoir commercial à valoir sur prochaine commande</option>
                <option value="reshipment">Réexpédition express du lot de remplacement</option>
                <option value="partial_refund">Remboursement partiel immédiat depuis le séquestre</option>
                <option value="full_refund">Annulation de commande & remboursement total</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-white block mb-1">
              Description Détaillée & Constat Contradictoire
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expliquez précisément les faits constatés lors du déballage..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          {/* Evidence uploads */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-white block">Preuves Photographiques & Documents (PV de constat)</span>
            <div className="flex items-center gap-3">
              {evidencePhotos.map((photo, idx) => (
                <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-white/20 relative group">
                  <img src={photo} alt="Preuve" className="w-full h-full object-cover" />
                </div>
              ))}
              <label className="w-16 h-16 rounded-xl border border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5">
                <Camera size={16} className="text-slate-400" />
                <span className="text-[9px] text-slate-400 mt-1">+ Photo</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => onOpenExpertChat && onOpenExpertChat('2', `Demande d'assistance juridique pour litige commercial : Dossier ${dossier.codeRef}`)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <UserCheck size={14} className="text-emerald-400" />
              <span>Consulter Maître Diallo en privé</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
              >
                Déposer la réclamation officielle
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
