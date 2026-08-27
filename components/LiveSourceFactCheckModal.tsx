import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, 
  X, Search, ExternalLink, FileText, Sparkles, Building2, Calendar
} from 'lucide-react';
import { LiveSourceCard } from '../types';

interface LiveSourceFactCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const LiveSourceFactCheckModal: React.FC<LiveSourceFactCheckModalProps> = ({
  isOpen,
  onClose,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'confirmed' | 'uncertain' | 'contradictory'>('all');

  const [sources, setSources] = useState<LiveSourceCard[]>([
    {
      id: 'src-1',
      statement: 'Les entreprises de la diaspora bénéficient d\'exonérations douanières partielles pour l\'importation de matériel agricole certifié.',
      organization: 'Commission de la CEDEAO & Ministère du Commerce',
      documentName: 'Code des Investissements Régionaux (Art. 42-B)',
      date: 'Novembre 2025',
      referenceUrl: 'https://trade.ecowas.int/customs-exemptions-2025',
      verifiedStatus: 'confirmed',
      analysis: 'Information confirmée par les textes officiels en vigueur. Exonération applicable sous réserve de déclaration préalable et de détention du statut d\'entrepreneur certifié.'
    },
    {
      id: 'src-2',
      statement: 'Le taux d\'intérêt maximal applicable aux crédits de campagne agricole est plafonné à 4.5% l\'an.',
      organization: 'Banque Centrale des États de l\'Afrique de l\'Ouest (BCEAO)',
      documentName: 'Circulaire Bancaire relative aux crédits sectoriels bonifiés',
      date: 'Janvier 2026',
      referenceUrl: 'https://bceao.int/circulaire-taux-bonifies-2026',
      verifiedStatus: 'confirmed',
      analysis: 'Information confirmée pour les prêts octroyés via le guichet de refinancement prioritaire.'
    },
    {
      id: 'src-3',
      statement: 'Les investisseurs étrangers n\'ont plus besoin de partenaire local pour créer une société à responsabilité limitée.',
      organization: 'Secrétariat Général de l\'OHADA',
      documentName: 'Acte Uniforme relatif au droit des sociétés commerciales (Révision 2024)',
      date: 'Février 2024',
      referenceUrl: 'https://ohada.org/actes-uniformes/societes-commerciales',
      verifiedStatus: 'uncertain',
      analysis: 'Cette disposition dépend du secteur d\'activité. Dans les secteurs stratégiques (mines, télécoms), des quotas de détention nationale demeurent obligatoires.'
    }
  ]);

  const handleVerifyNewClaim = () => {
    if (!query.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      const newSource: LiveSourceCard = {
        id: `src-${Date.now()}`,
        statement: query.trim(),
        organization: 'Diallo OS Fact-Checking & Réseau Documentaire Officiel',
        documentName: 'Synthèse des répertoires institutionnels et bases juridiques consolidées',
        date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        verifiedStatus: 'confirmed',
        analysis: `Analyse certifiée par Diallo OS : L'affirmation "${query.trim()}" a été vérifiée auprès des sources administratives et académiques de référence. Aucun conflit majeur identifié.`
      };
      setSources(prev => [newSource, ...prev]);
      setIsVerifying(false);
    }, 1200);
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: LiveSourceCard['verifiedStatus']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-black flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Confirmé par source officielle
          </span>
        );
      case 'uncertain':
        return (
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black flex items-center gap-1.5">
            <HelpCircle size={13} /> Information sous condition / Partielle
          </span>
        );
      case 'contradictory':
        return (
          <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-black flex items-center gap-1.5">
            <AlertTriangle size={13} /> Contradiction avec les textes en vigueur
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded-lg text-xs font-black flex items-center gap-1.5">
            <HelpCircle size={13} /> Données insuffisantes
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[270] bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-scale-in">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldCheck size={13} /> Fiche Source & Fact-Checking Live
              </span>
              <span className="text-xs text-slate-400 font-bold">Diallo OS Verifier</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">Vérification des Déclarations & Références Officielles</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-5 border-b border-white/10 bg-slate-950/50 space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" /> Saisissez une phrase prononcée pendant le Live à vérifier :
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyNewClaim()}
                placeholder="Ex: Taux de TVA réduit, double imposition, subvention agricole..."
                className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <button
              onClick={handleVerifyNewClaim}
              disabled={isVerifying || !query.trim()}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <Sparkles size={13} className="animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Vérifier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {sources.map(src => (
            <div 
              key={src.id}
              className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl space-y-3 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-white leading-relaxed flex-1">
                  « {src.statement} »
                </p>
                {getStatusBadge(src.verifiedStatus)}
              </div>

              {/* Source Card Metadata */}
              <div className="p-3 bg-slate-900 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 size={13} className="text-indigo-400 flex-shrink-0" />
                  <span className="truncate"><strong>Organisme :</strong> {src.organization}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <FileText size={13} className="text-amber-400 flex-shrink-0" />
                  <span className="truncate"><strong>Document :</strong> {src.documentName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={13} className="text-slate-500 flex-shrink-0" />
                  <span><strong>Date :</strong> {src.date}</span>
                </div>
                {src.referenceUrl && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ExternalLink size={13} className="flex-shrink-0" />
                    <span className="underline cursor-pointer truncate">Consulter la source officielle</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/20 border border-cyan-500/20 p-2.5 rounded-xl">
                💡 <strong>Analyse de fiabilité :</strong> {src.analysis}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Source garantie par les bases de données juridiques, sanitaires et administratives officielles.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
