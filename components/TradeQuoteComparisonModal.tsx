import React from 'react';
import { 
  X, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { CommercialDossier } from '../types';

interface TradeQuoteComparisonModalProps {
  dossier: CommercialDossier;
  isOpen: boolean;
  onClose: () => void;
  onSelectQuote?: (quoteId: string) => void;
}

export const TradeQuoteComparisonModal: React.FC<TradeQuoteComparisonModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onSelectQuote
}) => {
  if (!isOpen) return null;

  // Comparison items
  const quotes = [
    {
      id: 'q1-sinopack',
      supplierName: 'SinoPack Industrial Ltd',
      country: 'Chine',
      flag: '🇨🇳',
      tier: 'Vérifié Entreprise',
      isCurrentWinner: true,
      unitPrice: 0.35,
      totalAmount: 3500,
      currency: 'EUR',
      incoterm: 'CIF Port de Conakry',
      leadTimeDays: 24,
      transportMode: 'Maritime FCL (20ft)',
      landedCostUnit: 0.549, // 0.549 EUR rendu tout compris
      paymentTerms: '30% Acompte Séquestre / 70% Connaissement (B/L)',
      documentsIncluded: ['Facture Pro Forma', 'Certificat BPF & ISO 9001', 'Packing List', 'Connaissement Maritime'],
      inspectionAllowed: true,
      sampleProvided: true,
      samplePrice: 'Gratuit (Fret 65€)',
      rating: 4.9
    },
    {
      id: 'q2-guangdong-print',
      supplierName: 'Guangdong ColorPack Co.',
      country: 'Chine',
      flag: '🇨🇳',
      tier: 'Vérifié Profil',
      isCurrentWinner: false,
      unitPrice: 0.38,
      totalAmount: 3800,
      currency: 'EUR',
      incoterm: 'FOB Port de Shenzhen',
      leadTimeDays: 30,
      transportMode: 'Maritime FOB (Fret à la charge de l\'acheteur)',
      landedCostUnit: 0.615,
      paymentTerms: '50% Acompte / 50% avant départ usine',
      documentsIncluded: ['Facture Pro Forma', 'Certificat ISO 9001'],
      inspectionAllowed: true,
      sampleProvided: true,
      samplePrice: '50€ + Fret',
      rating: 4.4
    },
    {
      id: 'q3-india-flex',
      supplierName: 'Mumbai Pharma Packaging Ltd',
      country: 'Inde',
      flag: '🇮🇳',
      tier: 'Vérifié Documents',
      isCurrentWinner: false,
      unitPrice: 0.37,
      totalAmount: 3700,
      currency: 'EUR',
      incoterm: 'CFR Port de Conakry',
      leadTimeDays: 28,
      transportMode: 'Maritime CFR',
      landedCostUnit: 0.582,
      paymentTerms: '30% Acompte / 70% Lettre de Crédit (L/C)',
      documentsIncluded: ['Facture Pro Forma', 'Certificat OMS GMP', 'Certificat d\'origine'],
      inspectionAllowed: false,
      sampleProvided: true,
      samplePrice: '100€ tout compris',
      rating: 4.7
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/20 text-brand-400 rounded-2xl">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Tableau Comparatif des Devis Fournisseurs</h3>
              <p className="text-xs text-slate-300">
                Analyse multi-critères : Coût rendu (Landed Cost), Incoterms, délais, garanties et conditions de paiement.
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

        {/* Comparison Matrix Table */}
        <div className="p-6 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-slate-400 font-bold uppercase tracking-wider text-[11px] w-1/4">Critères d'évaluation</th>
                {quotes.map((q) => (
                  <th key={q.id} className="p-3 text-slate-200 font-bold text-sm w-1/4">
                    <div className="flex items-center gap-1.5">
                      <span>{q.flag}</span>
                      <span className="truncate">{q.supplierName}</span>
                    </div>
                    {q.isCurrentWinner && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                        <Sparkles size={10} />
                        Offre Retenue
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-slate-300">
              
              {/* Prix Unitaire & Total */}
              <tr>
                <td className="p-3 font-semibold text-white">Prix Unitaire / Total</td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3 font-mono font-bold text-emerald-400">
                    <div>{q.unitPrice.toFixed(2)} {q.currency} / unité</div>
                    <div className="text-[11px] text-slate-400 font-normal">Total : {q.totalAmount.toLocaleString()} {q.currency}</div>
                  </td>
                ))}
              </tr>

              {/* Incoterm */}
              <tr>
                <td className="p-3 font-semibold text-white">Incoterm & Lieu</td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3 font-medium text-amber-300">
                    {q.incoterm}
                  </td>
                ))}
              </tr>

              {/* Coût Rendu Global Estimé */}
              <tr className="bg-brand-950/20">
                <td className="p-3 font-bold text-brand-300 flex items-center gap-1.5">
                  <TrendingDown size={14} />
                  <span>Coût Rendu Entrepôt (Landed)</span>
                </td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3 font-mono font-extrabold text-white text-sm">
                    {q.landedCostUnit.toFixed(3)} {q.currency} / unité
                  </td>
                ))}
              </tr>

              {/* Délai de Fabrication & Transit */}
              <tr>
                <td className="p-3 font-semibold text-white">Délai Global de Livraison</td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3">
                    <span className="flex items-center gap-1 text-slate-200">
                      <Clock size={12} className="text-slate-400" />
                      <span>{q.leadTimeDays} jours</span>
                    </span>
                  </td>
                ))}
              </tr>

              {/* Modalités de Paiement */}
              <tr>
                <td className="p-3 font-semibold text-white">Sécurité Paiement & Acompte</td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3 text-[11px] leading-relaxed">
                    {q.paymentTerms}
                  </td>
                ))}
              </tr>

              {/* Documents & Certifications */}
              <tr>
                <td className="p-3 font-semibold text-white">Documents Inclus</td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3 space-y-1">
                    {q.documentsIncluded.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-300">
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Inspection Live */}
              <tr>
                <td className="p-3 font-semibold text-white">Inspection Live Usine Autorisée</td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3">
                    {q.inspectionAllowed ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        <span>Oui (Inclus)</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <XCircle size={14} />
                        <span>Non / Avec surcoût</span>
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action row */}
              <tr>
                <td className="p-3"></td>
                {quotes.map((q) => (
                  <td key={q.id} className="p-3">
                    {q.isCurrentWinner ? (
                      <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-xl text-center">
                        ✓ Actuellement Sélectionné
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (onSelectQuote) onSelectQuote(q.id);
                          onClose();
                        }}
                        className="w-full px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-center transition-colors"
                      >
                        Basculer sur cette offre
                      </button>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* AI Insight Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-brand-400" />
            <span>
              <strong>Verdict Diallo OS :</strong> L'offre de SinoPack Industrial Ltd offre le meilleur ratio Coût Rendu / Sécurité grâce à l'Incoterm CIF et l'accord d'inspection en direct.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
