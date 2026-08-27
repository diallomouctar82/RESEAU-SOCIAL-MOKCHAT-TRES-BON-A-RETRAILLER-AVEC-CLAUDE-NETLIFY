import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  QrCode, 
  Check, 
  FileText, 
  Sparkles,
  Award,
  Layers
} from 'lucide-react';
import { OfficialDocumentTemplate, OfficialSignature, OfficialStamp } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';

interface OfficialLetterPreviewModalProps {
  template: OfficialDocumentTemplate;
  onClose: () => void;
}

export const OfficialLetterPreviewModal: React.FC<OfficialLetterPreviewModalProps> = ({
  template,
  onClose
}) => {
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    template.variables.forEach(v => {
      init[v.key] = v.defaultValue;
    });
    return init;
  });

  const [selectedSignerId, setSelectedSignerId] = useState(template.defaultSignerId);
  const [selectedStampId, setSelectedStampId] = useState(template.defaultStampId);

  const signatures = adminConfigService.getSignatures();
  const stamps = adminConfigService.getStamps();

  const selectedSignature = signatures.find(s => s.id === selectedSignerId) || signatures[0];
  const selectedStamp = stamps.find(s => s.id === selectedStampId) || stamps[0];

  const resolved = adminConfigService.resolveTemplate(template.id, customValues);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-100 rounded-3xl border border-slate-300 shadow-2xl max-w-5xl w-full flex flex-col max-h-[95vh] overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none">
        
        {/* Top Modal Header */}
        <div className="bg-white p-4 px-6 border-b border-slate-200 flex justify-between items-center print:hidden shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Générateur & Aperçu Haute Définition
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{template.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Printer size={15} />
              Imprimer / Exporter PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body: Left Variable Customizer, Right Live Letter View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Panel: Variable Inputs & Stamp/Signature Selectors */}
          <div className="w-full lg:w-80 bg-white p-5 border-r border-slate-200 overflow-y-auto space-y-4 print:hidden shrink-0">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                Variables Dynamiques
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Modifiez les champs ci-dessous pour actualiser la lettre en direct.</p>
            </div>

            <div className="space-y-3">
              {template.variables.map(v => (
                <div key={v.key}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    {v.label} <span className="font-mono text-[9px] text-blue-600">({`{{${v.key}}}`})</span>
                  </label>
                  <input
                    type="text"
                    value={customValues[v.key] ?? ''}
                    onChange={(e) => setCustomValues({ ...customValues, [v.key]: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Signataire Officiel Assigné</label>
                <select
                  value={selectedSignerId}
                  onChange={(e) => setSelectedSignerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  {signatures.map(sig => (
                    <option key={sig.id} value={sig.id}>{sig.signerName} ({sig.signerTitle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Cachet / Sceau Apposé</label>
                <select
                  value={selectedStampId}
                  onChange={(e) => setSelectedStampId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  {stamps.map(stamp => (
                    <option key={stamp.id} value={stamp.id}>{stamp.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Panel: The Official Document (A4 Styling) */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-200 flex justify-center items-start print:p-0 print:bg-white">
            <div className="bg-white w-full max-w-[760px] min-h-[960px] p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-300 relative text-slate-900 font-serif leading-relaxed flex flex-col justify-between print:shadow-none print:border-none print:p-8 print:w-full print:rounded-none">
              
              {/* Official Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
                <span className="text-7xl font-black rotate-[-30deg] tracking-widest text-slate-900 uppercase">
                  {template.watermarkText || 'LE MONDE À VOUS'}
                </span>
              </div>

              {/* Document Header */}
              <div className="relative z-10 border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-sans font-black text-sm">
                        LV
                      </div>
                      <h1 className="text-sm sm:text-base font-sans font-black tracking-wider text-slate-900 uppercase">
                        {template.headerTitle}
                      </h1>
                    </div>
                    <p className="text-xs font-sans text-slate-600 font-medium">
                      {template.headerSubtitle}
                    </p>
                  </div>

                  {template.qrCodeVerification && (
                    <div className="text-center font-sans">
                      <div className="w-14 h-14 border border-slate-300 bg-slate-50 rounded-lg p-1 flex items-center justify-center shadow-inner">
                        <QrCode size={44} className="text-slate-800" />
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 block mt-0.5">Sceau Certifié</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Body */}
              <div className="relative z-10 flex-1 whitespace-pre-wrap text-xs sm:text-sm text-slate-800 font-serif leading-loose my-4">
                {resolved.renderedBody}
              </div>

              {/* Signatures & Stamps Footer Area */}
              <div className="relative z-10 mt-8 pt-6 border-t border-slate-200 font-sans">
                <div className="grid grid-cols-2 gap-6 items-end">
                  
                  {/* Official Stamp Visual */}
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                      Sceau d'Authenticité Numérique
                    </span>
                    {selectedStamp && (
                      <div 
                        className="w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center p-2 text-center relative rotate-[-6deg] shadow-sm"
                        style={{ borderColor: selectedStamp.color, color: selectedStamp.color }}
                      >
                        <div className="text-[8px] font-black uppercase tracking-tighter leading-tight">
                          {selectedStamp.institution}
                        </div>
                        <div className="my-1">
                          <ShieldCheck size={26} />
                        </div>
                        <div className="text-[7px] font-mono font-bold uppercase tracking-widest leading-none">
                          {selectedStamp.motto}
                        </div>
                        <div className="text-[6px] font-mono text-slate-500 mt-1">
                          {selectedStamp.securityHash}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Signer Visual */}
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                      Signature Autographe & Électronique
                    </span>
                    <div className="font-serif font-bold text-slate-900 text-sm">
                      {selectedSignature?.signerName}
                    </div>
                    <div className="text-xs text-slate-600 italic">
                      {selectedSignature?.signerTitle}
                    </div>

                    {/* Vector Signature Image */}
                    {selectedSignature?.signatureSvgOrDataUrl && (
                      <div className="my-2">
                        <img 
                          src={selectedSignature.signatureSvgOrDataUrl} 
                          alt="Signature Autographe" 
                          className="h-12 w-auto object-contain"
                        />
                      </div>
                    )}

                    <div className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      SHA256 : {selectedSignature?.hashSha256.substring(0, 18)}...
                    </div>
                  </div>
                </div>

                {/* Bottom Legal Mention */}
                <div className="mt-8 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400 font-sans">
                  {template.footerLegalText}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
