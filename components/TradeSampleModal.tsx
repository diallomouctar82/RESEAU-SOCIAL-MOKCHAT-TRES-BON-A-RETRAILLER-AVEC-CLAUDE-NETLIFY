import React, { useState } from 'react';
import { 
  X, 
  Package, 
  Truck, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  DollarSign, 
  MapPin, 
  Clock, 
  Camera,
  ShieldCheck
} from 'lucide-react';
import { CommercialDossier, SampleRequest } from '../types';

interface TradeSampleModalProps {
  dossier: CommercialDossier;
  isOpen: boolean;
  onClose: () => void;
  onSaveSampleRequest: (sample: SampleRequest) => void;
}

export const TradeSampleModal: React.FC<TradeSampleModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onSaveSampleRequest
}) => {
  const existing = dossier.sampleRequest;

  const [quantity, setQuantity] = useState<number>(existing?.quantityRequested || 50);
  const [unit, setUnit] = useState<string>(existing?.unit || 'unités');
  const [sampleFee, setSampleFee] = useState<number>(existing?.sampleFee || 0);
  const [shippingFee, setShippingFee] = useState<number>(existing?.shippingFee || 65);
  const [currency, setCurrency] = useState<string>(existing?.currency || dossier.currency || 'EUR');
  const [shippingAddress, setShippingAddress] = useState<string>(
    existing?.shippingAddress || `${dossier.buyerName}, Quartier Almamya, Conakry, Guinée`
  );
  const [trackingNumber, setTrackingNumber] = useState<string>(existing?.trackingNumber || 'DHL-EXP-8829104');
  const [status, setStatus] = useState<SampleRequest['status']>(existing?.status || 'delivered');

  // Evaluation Form
  const [rating, setRating] = useState<number>(existing?.buyerEvaluation?.rating || 5);
  const [decision, setDecision] = useState<'accepted' | 'rejected' | 'changes_required'>(
    existing?.buyerEvaluation?.decision || 'accepted'
  );
  const [evalComments, setEvalComments] = useState<string>(
    existing?.buyerEvaluation?.comments || 
    'Échantillon reçu et testé en conditions réelles. Résistance thermique et vernis UV conformes au cahier des charges.'
  );

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SampleRequest = {
      id: existing?.id || `smp-${Date.now()}`,
      dossierId: dossier.id,
      productTitle: `Échantillons : ${dossier.productTitle}`,
      quantityRequested: quantity,
      unit,
      sampleFee,
      shippingFee,
      currency,
      shippingAddress,
      trackingNumber,
      status,
      buyerEvaluation: {
        rating,
        decision,
        comments: evalComments,
        photos: existing?.buyerEvaluation?.photos || [
          "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400"
        ]
      },
      requestedAt: existing?.requestedAt || '10/02/2026'
    };

    onSaveSampleRequest(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
              <Package size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Échantillon Physique & Bon à Tirer (BAT)</h3>
              <p className="text-xs text-slate-400">
                Validation technique préalable avant lancement de la production en série.
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs text-slate-300">
          
          {/* Step 1: Sample Specs & Costs */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Package size={16} className="text-brand-400" />
              <span>Détails & Frais d'Échantillonnage</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Quantité Demandée</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Unité</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Coût Échantillon ({currency})</label>
                <input
                  type="number"
                  value={sampleFee}
                  onChange={(e) => setSampleFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Fret Express ({currency})</label>
                <input
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Adresse de Réception Express (DHL / FedEx / Aramex)</label>
              <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-transparent text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Numéro de Suivi Express</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-2">
                  <Truck size={14} className="text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-transparent text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Statut d'Acheminement</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand-500"
                >
                  <option value="requested">Demandé au fournisseur</option>
                  <option value="cost_agreed">Frais validés & payés</option>
                  <option value="shipped">Expédié par avion</option>
                  <option value="delivered">Reçu par l'acheteur</option>
                  <option value="evaluated">Évalué & Validé (BAT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Evaluation & Decision */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Verdict & Évaluation Qualité</span>
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${rating >= star ? 'text-amber-400' : 'text-slate-600'}`}
                  >
                    <Star size={16} fill={rating >= star ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('accepted')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === 'accepted'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                ✓ Conforme (Valider BAT)
              </button>

              <button
                type="button"
                onClick={() => setDecision('changes_required')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === 'changes_required'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                ⚠ Ajustements requis
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === 'rejected'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                ✗ Non-conforme (Refus)
              </button>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Rapport & Remarques Techniques</label>
              <textarea
                rows={3}
                value={evalComments}
                onChange={(e) => setEvalComments(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              Enregistrer l'évaluation de l'échantillon
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
