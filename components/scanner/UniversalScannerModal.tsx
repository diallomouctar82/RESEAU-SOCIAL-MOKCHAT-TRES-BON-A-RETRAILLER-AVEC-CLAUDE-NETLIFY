import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  X, 
  Languages, 
  HeartPulse, 
  Globe, 
  Palette, 
  QrCode, 
  RefreshCw,
  Eye
} from 'lucide-react';

export type ScannerContext = 'general' | 'languages' | 'procedures' | 'health' | 'shop' | 'studio';

interface UniversalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: ScannerContext;
  onApplyResult?: (result: any) => void;
}

interface ScanAnalysisResult {
  detectedType: string;
  confidence: number;
  detectedText: string;
  surePoints: string[];
  verificationNeeded: string[];
  suggestedActions: Array<{
    id: string;
    label: string;
    targetTab?: string;
    actionType: string;
  }>;
}

export const UniversalScannerModal: React.FC<UniversalScannerModalProps> = ({
  isOpen,
  onClose,
  initialContext = 'general',
  onApplyResult
}) => {
  const [context, setContext] = useState<ScannerContext>(initialContext);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScanAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getContextMeta = () => {
    switch (context) {
      case 'languages':
        return {
          title: 'Scanner pour Traduction Immédiate',
          desc: 'Vision IA textuelle et détection multilingue avec traduction instantanée.',
          badgeColor: 'bg-indigo-100 text-indigo-800',
          icon: Languages
        };
      case 'procedures':
        return {
          title: 'Scanner un Document Consulaire / Légal',
          desc: 'Extraction automatique des mentions légales, dates de validité et visas.',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: FileText
        };
      case 'health':
        return {
          title: 'Scanner un Document de Santé / Ordonnance',
          desc: 'Lecture sécurisée confidentielle et orientation médicale avec Dr. Diallo.',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          icon: HeartPulse
        };
      case 'shop':
        return {
          title: 'Scanner un Produit ou Document Commercial B2B',
          desc: 'Analyse fiche technique, étiquette produit, Incoterm et codes douaniers.',
          badgeColor: 'bg-amber-100 text-amber-800',
          icon: Globe
        };
      case 'studio':
        return {
          title: 'Scanner pour Création & Studio',
          desc: 'Capture d\'inspiration, textures visuelles et extraction de palettes.',
          badgeColor: 'bg-purple-100 text-purple-800',
          icon: Palette
        };
      default:
        return {
          title: 'Scanner Universel avec Le Monde à Vous',
          desc: 'Reconnaissance intelligente de documents, textes, formulaires et QR codes.',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: Scan
        };
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        simulateAIAnalysis(context, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAIAnalysis = (activeCtx: ScannerContext, fileName: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      
      if (activeCtx === 'languages') {
        setAnalysisResult({
          detectedType: 'Document Multilingue (Anglais ➔ Français)',
          confidence: 96,
          detectedText: "Official Admission Letter - Faculty of Applied Sciences, University of Montreal. Fall Semester 2026.",
          surePoints: [
            "Langue source identifiée : Anglais (Canada)",
            "Émetteur officiel : Université de Montréal",
            "Session académique : Automne 2026"
          ],
          verificationNeeded: [
            "Date limite exacte de confirmation de candidature",
            "Mention des frais d'inscription requis"
          ],
          suggestedActions: [
            { id: 'translate', label: 'Traduire en Français Certifié', actionType: 'translate' },
            { id: 'save-drive', label: 'Archiver dans Google Drive / Dossier Visa', targetTab: 'google-drive', actionType: 'navigate' },
            { id: 'ask-diallo', label: 'Faire relire par Conseiller Diallo', targetTab: 'chat', actionType: 'chat' }
          ]
        });
      } else if (activeCtx === 'procedures') {
        setAnalysisResult({
          detectedType: 'Passeport / Pièce d\'Identité Internationale',
          confidence: 98,
          detectedText: "PASSPORT / PASSEPORT — RÉPUBLIQUE DE GUINÉE — EXP: 14 NOV 2029",
          surePoints: [
            "Document d'identité authentique et lisible",
            "Validité supérieure à 6 mois (Conforme normes ICAO/IATA)",
            "Zone de lecture optique (MRZ) nette"
          ],
          verificationNeeded: [
            "Conformité avec les exigences biométriques consulaires du pays de destination"
          ],
          suggestedActions: [
            { id: 'add-dossier', label: 'Attacher au Dossier de Visa en cours', targetTab: 'admin-procedures', actionType: 'navigate' },
            { id: 'check-compliance', label: 'Vérifier la conformité consulaire', targetTab: 'admin-procedures', actionType: 'navigate' }
          ]
        });
      } else {
        setAnalysisResult({
          detectedType: 'Document d\'Affaires / Synthèse Commerciale',
          confidence: 94,
          detectedText: "Proforma Invoice #2026-884 - Sourcing Matières Premières & Export Maritime.",
          surePoints: [
            "Type : Facture Proforma internationale",
            "Conditions de livraison : Incoterm CIF stipulé",
            "Montant total calculé et devise identifiée"
          ],
          verificationNeeded: [
            "Certification du compte séquestre de paiement"
          ],
          suggestedActions: [
            { id: 'b2b-escrow', label: 'Sécuriser le paiement sous séquestre LMAV', targetTab: 'shop', actionType: 'navigate' },
            { id: 'ask-diallo', label: 'Analyser les clauses juridiques', targetTab: 'chat', actionType: 'chat' }
          ]
        });
      }
    }, 1200);
  };

  if (!isOpen) return null;

  const meta = getContextMeta();
  const Icon = meta.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="universal-scanner-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
              <Icon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${meta.badgeColor}`}>
                  Vision IA Transparente
                </span>
              </div>
              <h2 id="universal-scanner-title" className="text-xl font-bold text-white tracking-tight">
                {meta.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer le scanner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* Mode Selector & Context Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contexte actif :</span>
              <select
                value={context}
                onChange={(e) => {
                  const newCtx = e.target.value as ScannerContext;
                  setContext(newCtx);
                  if (capturedImage) simulateAIAnalysis(newCtx, 'current_scan');
                }}
                className="text-xs font-bold bg-slate-100 text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none"
              >
                <option value="general">Général (Documents & OCR)</option>
                <option value="languages">Langues & Traduction</option>
                <option value="procedures">Démarches & Visas</option>
                <option value="health">Santé & Ordonnances</option>
                <option value="shop">Marché Mondial & B2B</option>
                <option value="studio">Studio & Création</option>
              </select>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload size={14} /> Importer
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera size={14} /> Caméra Directe
              </button>
            </div>
          </div>

          {/* Upload or Camera Zone */}
          {!capturedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*,.pdf" 
                className="hidden" 
              />
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Scan size={32} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Déposez votre document ou cliquez pour capturer
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Supporte passeports, diplômes, factures, contrats, textes ou photos en haute définition.
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-100/80 px-3 py-1 rounded-full">
                Traitement sécurisé et confidentiel
              </span>
            </div>
          )}

          {/* Image preview & Loading */}
          {capturedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <img src={capturedImage} alt="Capture numérisée" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  <div>
                    <span className="text-xs font-bold text-slate-900">Document capturé</span>
                    <p className="text-[10px] text-slate-500">Prêt pour l'analyse optique</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center gap-1"
                >
                  <RefreshCw size={14} /> Nouveau scan
                </button>
              </div>

              {isAnalyzing && (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h4 className="font-bold text-slate-900 text-sm">Vision IA en cours d'analyse...</h4>
                  <p className="text-xs text-slate-500">Détection des caractères, structure légale et vérification de conformité.</p>
                </div>
              )}

              {/* 4 VOLETS DE TRANSPARENCE VISION IA */}
              {analysisResult && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* 1. CE QUE J'AI DÉTECTÉ */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <Eye size={14} className="text-blue-600" /> 1. Ce que j'ai détecté
                      </span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        Confiance : {analysisResult.confidence}%
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base">{analysisResult.detectedType}</h4>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                      "{analysisResult.detectedText}"
                    </p>
                  </div>

                  {/* 2 & 3. CE DONT JE SUIS SÛR / CE QUI NÉCESSITE VÉRIFICATION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ce dont je suis sûr */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                      <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" /> 2. Ce dont je suis sûr
                      </span>
                      <ul className="space-y-1.5">
                        {analysisResult.surePoints.map((pt, i) => (
                          <li key={i} className="text-xs text-emerald-950 flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ce qui nécessite vérification */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                      <span className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-600" /> 3. Ce qui nécessite vérification
                      </span>
                      <ul className="space-y-1.5">
                        {analysisResult.verificationNeeded.map((pt, i) => (
                          <li key={i} className="text-xs text-amber-950 flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">!</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 4. QUE VEUX-TU FAIRE MAINTENANT ? */}
                  <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                      <Sparkles size={14} /> 4. Que veux-tu faire maintenant ?
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {analysisResult.suggestedActions.map((act) => (
                        <button
                          key={act.id}
                          onClick={() => {
                            if (onApplyResult) onApplyResult(analysisResult);
                            onClose();
                          }}
                          className="bg-white/10 hover:bg-white/20 border border-white/10 hover:border-blue-500/50 p-3 rounded-xl text-left text-xs font-bold text-white flex items-center justify-between group transition-all"
                        >
                          <span>{act.label}</span>
                          <ArrowRight size={14} className="text-blue-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 text-xs font-bold hover:bg-slate-100 transition-all"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
