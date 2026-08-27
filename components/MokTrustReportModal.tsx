import React, { useState } from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  UploadCloud, 
  X,
  Scale
} from 'lucide-react';
import { CounterfeitReport } from '../types';
import { MOCK_COUNTERFEIT_REPORTS } from '../constants';

interface MokTrustReportModalProps {
  initialListingId?: string;
  initialProductTitle?: string;
  onClose: () => void;
  onSubmitted?: (report: CounterfeitReport) => void;
}

export const MokTrustReportModal: React.FC<MokTrustReportModalProps> = ({
  initialListingId = 'prod-sample-01',
  initialProductTitle = 'Marchandise signalée',
  onClose,
  onSubmitted
}) => {
  const [productTitle, setProductTitle] = useState(initialProductTitle);
  const [rightHolderOrg, setRightHolderOrg] = useState('');
  const [ipType, setIpType] = useState<CounterfeitReport['intellectualPropertyType']>('trademark');
  const [reporterName, setReporterName] = useState('Cabinet Juridique / Titulaire de droits');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceDesc.trim()) return;

    const newReport: CounterfeitReport = {
      id: `rep-${Date.now()}`,
      targetListingId: initialListingId,
      targetProductTitle: productTitle,
      targetSellerName: 'Vendeur Signalé',
      reportedBy: reporterName,
      rightHolderOrganization: rightHolderOrg || 'Titulaire de la Marque',
      intellectualPropertyType: ipType,
      evidenceDescription: evidenceDesc,
      supportingUrls: officialUrl ? [officialUrl] : ['https://wipo.int/search'],
      reportedAt: 'Aujourd\'hui',
      status: 'soumis'
    };

    if (onSubmitted) {
      onSubmitted(newReport);
    }

    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <ShieldAlert size={22} />
            <h3 className="font-extrabold text-white text-base">Signaler une Contrefaçon / Atteinte aux Droits</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-lg">Signalement Enregistré</h4>
            <p className="text-xs text-slate-400">
              L'équipe conformité Mok Trust a gelé l'annonce à titre conservatoire pour examen des pièces justificatives.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-slate-400 leading-relaxed">
              La plateforme applique une tolérance zéro sur les contrefaçons, usurpations de marque et marchandises non autorisées.
            </p>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Produit / Annonce Ciblée :</label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Titulaire des Droits / Marque :</label>
                <input
                  type="text"
                  placeholder="Ex: L'Oréal SA, Sony Corp..."
                  value={rightHolderOrg}
                  onChange={(e) => setRightHolderOrg(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Type d'Atteinte :</label>
                <select
                  value={ipType}
                  onChange={(e) => setIpType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                >
                  <option value="trademark">Marque Déposée / Logo Usurpé</option>
                  <option value="patent">Brevet / Invention Protégée</option>
                  <option value="copyright">Droit d'Auteur / Photos Dérobées</option>
                  <option value="industrial_design">Dessin & Modèle Industriel</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Lien vers le Registre Officiel (OMPI, INPI, etc.) :</label>
              <input
                type="url"
                placeholder="https://wipo.int/branddb/..."
                value={officialUrl}
                onChange={(e) => setOfficialUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Preuves & Éléments Matériels :</label>
              <textarea
                rows={3}
                required
                placeholder="Détaillez les anomalies constatées (différences de packaging, numéros de série frauduleux, absence de licence du distributeur)..."
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-md shadow-amber-600/30"
              >
                Déposer le Signalement Formel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
