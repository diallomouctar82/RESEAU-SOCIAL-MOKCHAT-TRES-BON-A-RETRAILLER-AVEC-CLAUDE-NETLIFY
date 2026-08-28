import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CheckCircle2, 
  Circle, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  RotateCcw, 
  Maximize2,
  Volume2,
  Languages,
  AlertCircle,
  Download,
  Share2
} from 'lucide-react';
import { AIProxyClient } from '../services/aiProxy';
import { CommercialDossier, LiveInspectionSession } from '../types';

interface TradeLiveInspectionModalProps {
  dossier: CommercialDossier;
  isOpen: boolean;
  onClose: () => void;
  onSaveInspectionReport: (session: LiveInspectionSession) => void;
}

export const TradeLiveInspectionModal: React.FC<TradeLiveInspectionModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onSaveInspectionReport
}) => {
  const defaultItems = dossier.liveInspection?.inspectionItems || [
    { label: "Vérification des dimensions & tolérances au pied à coulisse", checked: true, notes: "Conforme au plan technique (120x60x40mm)" },
    { label: "Contrôle visuel de l'impression vernis UV & colorimétrie Pantone", checked: true, notes: "Brillance uniforme sans bavure" },
    { label: "Test de résistance mécanique & pliage des rabats", checked: false, notes: "À tester en direct à l'écran" },
    { label: "Vérification du collage des pattes d'assemblage", checked: false },
    { label: "Comptage aléatoire d'un carton d'emballage master", checked: false },
    { label: "Inspection de la palettisation et filmage étanche tropicalisé", checked: false }
  ];

  const [items, setItems] = useState(defaultItems);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&fit=crop"
  ]);
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string; time: string; translation: string }[]>([
    {
      speaker: dossier.sellerName,
      text: "您好！我们现在展示刚从流水线下线的第一批5000个药品包装盒。(Nǐ hǎo! Wǒmen xiànzài zhǎnshì...)",
      time: "11:02",
      translation: "Bonjour Dr. Camara ! Nous vous montrons le premier lot de 5 000 boîtes pharma tout juste sorti de la ligne de vernissage UV."
    },
    {
      speaker: dossier.buyerName,
      text: "Parfait. Pouvez-vous plier un carton devant la caméra et me montrer le fond automatique ?",
      time: "11:04",
      translation: "很好。您能在镜头前折叠一个盒子并展示自动底部吗？(Hěn hǎo. Nín néng zài jìngtóu qián...)"
    },
    {
      speaker: dossier.sellerName,
      text: "没问题，请看！卡扣完全稳固，耐潮测试也已通过。(Méi wèntí...)",
      time: "11:05",
      translation: "Aucun problème, regardez ! Le fond s'enclenche parfaitement et le test d'humidité à 80% RH est validé."
    }
  ]);

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryReport, setSummaryReport] = useState<string>(
    dossier.liveInspection?.aiGeneratedRecap || ''
  );

  if (!isOpen) return null;

  const toggleItem = (index: number) => {
    const updated = [...items];
    updated[index].checked = !updated[index].checked;
    setItems(updated);
  };

  const handleCapturePhoto = () => {
    const newPhoto = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&fit=crop";
    setCapturedPhotos([newPhoto, ...capturedPhotos]);
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const ai = new AIProxyClient();
      const prompt = `Tu es l'Inspecteur Qualité & Greffier Numérique de Diallo OS.
Rédige un compte-rendu officiel d'inspection en direct pour le dossier commercial suivant :
- Dossier : ${dossier.codeRef} (${dossier.productTitle})
- Vendeur : ${dossier.sellerName} (Chine)
- Acheteur : ${dossier.buyerName} (Guinée)
- Points de contrôle validés : ${items.filter(i => i.checked).map(i => i.label).join(', ')}
- Points restant à vérifier : ${items.filter(i => !i.checked).map(i => i.label).join(', ')}

Rédige un procès-verbal d'inspection clair, structuré avec mention de conformité, réserves éventuelles et feu vert de mise en conteneur.`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setSummaryReport(res.text || 'Compte-rendu d\'inspection validé.');
    } catch (e) {
      console.error(e);
      setSummaryReport(
        `RAPPORT OFFICIEL D'INSPECTION VIDÉO EN DIRECT\nRéférence : ${dossier.codeRef}\n\n1. CONFORMITÉ PRODUIT : 100% conforme aux spécifications techniques BPF.\n2. ASPECT VISUEL : Vernis UV régulier, aucun décalage d'impression.\n3. CONDITIONNEMENT EXPORT : Palettes cerclées avec film étanche tropicalisé et sachets déshydratants.\n\nCONCLUSION : FEU VERT VALIDÉ POUR EMPOTAGE EN CONTENEUR 20FT.`
      );
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleFinishAndSave = () => {
    const session: LiveInspectionSession = {
      id: dossier.liveInspection?.id || `live-insp-${Date.now()}`,
      dossierId: dossier.id,
      productTitle: dossier.productTitle,
      scheduledAt: 'Aujourd\'hui',
      durationMinutes: 25,
      sellerName: dossier.sellerName,
      buyerName: dossier.buyerName,
      status: 'completed',
      inspectionItems: items,
      aiGeneratedRecap: summaryReport || 'Inspection qualité vidéo réalisée et validée par les parties.'
    };

    onSaveInspectionReport(session);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-950 border border-white/10 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <Video size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Inspection Qualité en Direct (Live Usine)</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Canal Sécurisé Tripartite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dossier : <strong className="text-white">{dossier.codeRef}</strong> • {dossier.productTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCapturePhoto}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <Camera size={14} />
              <span>Capture Preuve HD</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Grid: Video Stream HUD (Left 7 cols) & Inspection Control Room (Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          
          {/* Left Column: Live Video Canvas */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-black flex flex-col justify-between relative min-h-[380px] lg:min-h-[500px]">
            
            {/* Stream HUD Top Overlay */}
            <div className="flex items-center justify-between z-10">
              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-mono font-bold">EN DIRECT</span>
                <span className="text-slate-400 text-[10px]">| Usine Guangzhou (1080p 60fps)</span>
              </div>

              <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[11px] text-slate-300 font-mono">
                Participants : {dossier.sellerName} & {dossier.buyerName}
              </div>
            </div>

            {/* Video Background Mockup */}
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&fit=crop"
                alt="Live Factory Inspection"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

              {/* Watermark / Cryptographic Timestamp */}
              <div className="absolute bottom-16 left-6 text-left font-mono text-[10px] text-white/70 bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <div>TIMESTAMP : 2026-02-26 11:06:42 GMT</div>
                <div>GEO-TAG : 23.1291° N, 113.2644° E (Guangzhou, CN)</div>
                <div>HASH INTÉGRITÉ : 7f83b1657ff1...</div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="z-10 flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-3 rounded-2xl border transition-colors ${
                    isMicOn 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                      : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  <Video size={18} />
                </button>

                <button
                  onClick={handleCapturePhoto}
                  className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                  title="Prendre une photo HD"
                >
                  <Camera size={18} />
                </button>
              </div>

              {/* Translation Badge */}
              <div className="px-3 py-1.5 bg-indigo-950/80 border border-indigo-500/30 rounded-xl flex items-center gap-2 text-indigo-300 text-xs">
                <Languages size={14} />
                <span className="font-medium">Traduction Live Active (ZH ⇄ FR)</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Checklist & AI Minutes */}
          <div className="lg:col-span-5 p-5 bg-slate-900 border-l border-white/10 flex flex-col justify-between space-y-4 overflow-y-auto">
            
            {/* Checklist Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Grille de Contrôle Interactive</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {items.filter(i => i.checked).length} / {items.length} validés
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleItem(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      item.checked
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-white'
                        : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-emerald-400">
                      {item.checked ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-slate-500" />}
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-semibold leading-tight">{item.label}</p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">{item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Dual-Subtitles & Dialogue Log */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Languages size={14} className="text-indigo-400" />
                <span>Transcription & Traduction Immédiate</span>
              </span>

              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 space-y-2 max-h-36 overflow-y-auto text-[11px]">
                {liveTranscript.map((log, idx) => (
                  <div key={idx} className="space-y-0.5 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-brand-300">{log.speaker}</span>
                      <span>{log.time}</span>
                    </div>
                    <p className="text-slate-200">{log.translation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary Minutes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-400" />
                  <span>Procès-Verbal Automatique</span>
                </span>
                <button
                  onClick={handleGenerateAISummary}
                  disabled={isGeneratingSummary}
                  className="text-[10px] font-bold text-brand-400 hover:text-brand-300 underline flex items-center gap-1"
                >
                  {isGeneratingSummary ? 'Génération...' : 'Générer PV officiel'}
                </button>
              </div>

              {summaryReport && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-200 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {summaryReport}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Quitter la session
              </button>
              <button
                type="button"
                onClick={handleFinishAndSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>Valider le Rapport d'Inspection</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
