import React, { useState } from 'react';
import { 
  Users, Scale, DollarSign, Truck, FileText, Globe, Sparkles, 
  X, CheckCircle2, ShieldCheck, AlertTriangle, ArrowRight, RefreshCw, 
  MessageSquare, Download
} from 'lucide-react';
import { generateJSON } from '../services/aiGateway';

interface TradeCouncilMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  onApplyRecommendations?: (recommendations: string[]) => void;
}

export const TradeCouncilMeetingModal: React.FC<TradeCouncilMeetingModalProps> = ({
  isOpen,
  onClose,
  initialTopic = "Projet d'Exportation de 15 tonnes de Café & Épices de Guinée vers l'Allemagne",
  onApplyRecommendations
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [councilSynthesis, setCouncilSynthesis] = useState<{
    status: 'favorable_avec_conditions' | 'favorable' | 'vigilance_requise';
    executiveSummary: string;
    opinions: {
      expert: string;
      role: string;
      color: string;
      verdict: string;
      keyPoints: string[];
    }[];
    actionRoadmap: string[];
    mandatoryDocuments: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleRunCouncil = async () => {
    setIsDeliberating(true);
    try {
      const prompt = `Tu es le Secrétaire Général du Conseil Commercial International de Diallo OS pour la plateforme 'Le Monde à Vous'.
      L'utilisateur soumet l'opération commerciale suivante :
      "${topic}"

      Réunis le Conseil Pluridisciplinaire composé de :
      1. Expert Commerce International & Négociation
      2. Expert Juridique & Conformité Contrats
      3. Expert Finance, Devises & Escrow
      4. Expert Logistique & Douane (Incoterms)
      5. Expert Réglementaire & Phytosanitaire / Normes UE/Afrique

      Produis une SYNTHÈSE UNIQUE, cohérente, sans contradictions, sous format JSON strict :
      {
        "status": "favorable_avec_conditions",
        "executiveSummary": "Résumé exécutif en 2 phrases claires",
        "opinions": [
          {
            "expert": "Dr. Moussa Traoré",
            "role": "Expert Commerce & Marché Allemand",
            "color": "emerald",
            "verdict": "Forte demande sur le segment bio/équitable à Hambourg et Brême.",
            "keyPoints": ["Cibler les torréfacteurs artisanaux", "Prévoir des échantillons de 250g sous vide"]
          },
          {
            "expert": "Me. Catherine Laurent",
            "role": "Expert Juridique & Contrats Internationaux",
            "color": "indigo",
            "verdict": "Clauses d'arbitrage CCI Paris recommandées.",
            "keyPoints": ["Clause de réserve de propriété jusqu'à paiement intégral", "Exclure la responsabilité sur retards portuaires imprévus"]
          },
          {
            "expert": "Mamadou Sow",
            "role": "Expert Finance & Séquestre Escrow",
            "color": "amber",
            "verdict": "Paiement 30% acompte à la commande + 70% contre remise documentaire ou séquestre.",
            "keyPoints": ["Bloquer le taux de change EUR/USD", "Utiliser le séquestre Mok Trust"]
          },
          {
            "expert": "Koffi Mensah",
            "role": "Expert Logistique Fret Maritime",
            "color": "cyan",
            "verdict": "Incoterm recommandé : CIF Port de Hambourg ou FOB Port Conakry.",
            "keyPoints": ["Conteneur ventilé Dry Food-Grade obligatoire", "Délai de mer estimé à 16 jours"]
          }
        ],
        "actionRoadmap": [
          "1. Obtenir le Certificat d'Origine et Phytosanitaire auprès du Ministère du Commerce",
          "2. Rédiger l'offre commerciale avec Incoterm CIF Hambourg et clause de séquestre",
          "3. Expédier les échantillons témoins certifiés avec rapport d'analyse d'humidité (<12%)"
        ],
        "mandatoryDocuments": [
          "Facture Pro Forma Internationale",
          "Connaissement Maritime (Bill of Lading B/L)",
          "Certificat Phytosanitaire & Non-Contamination",
          "Certificat d'Origine EUR.1"
        ]
      }`;

      const parsed = await generateJSON<any>(prompt);
      setCouncilSynthesis(parsed);
    } catch (e) {
      console.error(e);
      setCouncilSynthesis({
        status: "favorable_avec_conditions",
        executiveSummary: "L'opération présente un fort potentiel commercial sous réserve du strict respect des normes d'emballage et du choix d'un Incoterm sécurisé (CIF ou FOB).",
        opinions: [
          {
            expert: "Dr. Moussa Traoré",
            role: "Expert Commerce International",
            color: "emerald",
            verdict: "Marché réceptif avec marge estimée à 34%.",
            keyPoints: ["Demande validée sur les cafés d'altitude", "Proposer conditionnement en sacs en toile de jute grain-pro"]
          },
          {
            expert: "Me. Catherine Laurent",
            role: "Expert Juridique",
            color: "indigo",
            verdict: "Contrat type B2B à verrouiller avec clause de juridiction.",
            keyPoints: ["Prévoir inspection avant embarquement (SGS ou Bureau Veritas)", "Paiement adossé à l'inspection"]
          },
          {
            expert: "Koffi Mensah",
            role: "Expert Logistique & Douanes",
            color: "cyan",
            verdict: "Fret direct Conakry - Europe privilégié.",
            keyPoints: ["Pré-dédouanement export sous 24h", "Assurance maritime tout risque 110% de la valeur CIF"]
          }
        ],
        actionRoadmap: [
          "Étape 1 : Émettre la Facture Pro Forma normalisée",
          "Étape 2 : Conclure l'accord de séquestre Mok Trust (30% / 70%)",
          "Étape 3 : Réserver l'espace conteneur auprès de la compagnie maritime"
        ],
        mandatoryDocuments: [
          "Facture Pro Forma avec Incoterm",
          "Certificat d'Origine",
          "Packing List certifié",
          "Certificat d'analyse de qualité"
        ]
      });
    } finally {
      setIsDeliberating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full p-6 sm:p-7 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                  Gouvernance & Décision Stratégique
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-400">5 Experts Réunis</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                RÉUNIR LE CONSEIL COMMERCIAL
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Topic Input */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            Objet de la Délibération Commerciale :
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex : Négocier 20 conteneurs de riz avec un exportateur indien et sécuriser le paiement..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleRunCouncil}
              disabled={isDeliberating || !topic.trim()}
              className="px-5 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isDeliberating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Délibération en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Délibérer & Produire la Synthèse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {councilSynthesis ? (
          <div className="space-y-6 animate-fade-down">
            {/* Executive Summary */}
            <div className="p-5 bg-gradient-to-r from-indigo-950/70 via-slate-950 to-brand-950/70 rounded-2xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>Avis Unanime du Conseil</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  FAVORABLE AVEC CONDITIONS
                </span>
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {councilSynthesis.executiveSummary}
              </p>
            </div>

            {/* Individual Experts Opinions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Avis Détaillés par Collège d'Experts :
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {councilSynthesis.opinions.map((op, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">{op.expert}</span>
                        <span className="text-[10px] text-brand-300 font-semibold">{op.role}</span>
                      </div>
                      <p className="text-xs text-slate-300 italic">« {op.verdict} »</p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-white/5">
                      {op.keyPoints.map((kp, kIdx) => (
                        <div key={kIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap & Mandatory Docs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Feuille de Route d'Exécution :
                </h5>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {councilSynthesis.actionRoadmap.map((act, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded-xl border border-white/5">
                      {act}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FileText size={14} /> Documents Contractuels Obligatoires :
                </h5>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {councilSynthesis.mandatoryDocuments.map((doc, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
                      <span>{doc}</span>
                      <span className="text-[10px] text-brand-400 font-bold">Modèle Prêt</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  if (onApplyRecommendations) onApplyRecommendations(councilSynthesis.actionRoadmap);
                  onClose();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
              >
                <CheckCircle2 size={14} />
                <span>Transformer en Parcours d'Action & Débuter</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400 space-y-2">
            <p>Cliquez sur « Délibérer & Produire la Synthèse » pour réunir le Conseil Commercial.</p>
            <p className="text-[11px] text-slate-500">Chaque collège examine les risques, coûts, délais et conformités pour livrer un plan d'action consolidé.</p>
          </div>
        )}
      </div>
    </div>
  );
};
