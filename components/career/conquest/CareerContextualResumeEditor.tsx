import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Layers, 
  Layout, 
  Eye, 
  Edit3, 
  ShieldCheck,
  Zap,
  Download,
  RotateCcw
} from 'lucide-react';
import { ContextualResumeData, MasterResumeProfile, RadarOpportunityItem } from '../../../types';

interface CareerContextualResumeEditorProps {
  contextualResume: ContextualResumeData;
  masterResume: MasterResumeProfile;
  opportunity: RadarOpportunityItem;
  onUpdateContextualResume: (updated: ContextualResumeData) => void;
  onOpenMasterResume?: () => void;
}

export const CareerContextualResumeEditor: React.FC<CareerContextualResumeEditorProps> = ({
  contextualResume,
  masterResume,
  opportunity,
  onUpdateContextualResume,
  onOpenMasterResume
}) => {
  const [data, setData] = useState<ContextualResumeData>(contextualResume);
  const [isEditingHeadline, setIsEditingHeadline] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'diff'>('preview');

  const handleTemplateChange = (template: ContextualResumeData['layoutTemplate']) => {
    const updated = { ...data, layoutTemplate: template };
    setData(updated);
    onUpdateContextualResume(updated);
  };

  const handleCopyFormattedText = () => {
    const text = `
=== ${data.tailoredHeadline} ===
Candidat : ${masterResume.fullName} (${masterResume.email} | ${masterResume.phone})
Localisation : ${masterResume.location}

--- RÉSUMÉ EXÉCUTIF ---
${data.tailoredSummary}

--- MOTS-CLÉS & COMPÉTENCES PRIORITAIRES ---
${data.prioritizedSkills.join(' • ')}

--- EXPÉRIENCES CLÉS VALORISÉES ---
${masterResume.experiences
  .filter(e => data.highlightedExperienceIds.includes(e.id))
  .map(e => `
* ${e.role} chez ${e.company} (${e.startDate} - ${e.endDate})
  ${data.rephrasedAchievements[e.id]?.map(a => `  - ${a}`).join('\n') || e.keyAchievements.map(a => `  - ${a}`).join('\n')}
`).join('\n')}

--- FORMATION & CERTIFICATIONS ---
${masterResume.education.map(edu => `* ${edu.degree} - ${edu.institution} (${edu.graduationYear})`).join('\n')}
${masterResume.certifications.map(c => `* ${c.title} (${c.issuer}, ${c.year})`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 text-white space-y-5 shadow-xl">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">CV Intelligent & Contextualisé</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[10px] font-extrabold border border-blue-800/60 flex items-center gap-1">
              <Sparkles size={11} className="text-yellow-400" /> Ciblé pour {opportunity.entity}
            </span>
          </div>
          <h3 className="text-base font-black text-white mt-1">
            Version adaptée : « {opportunity.title} »
          </h3>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Template Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'moderne_executif', label: 'Moderne Exécutif' },
              { id: 'impact_commercial', label: 'Impact Commercial' },
              { id: 'technique_precis', label: 'Technique Précis' },
              { id: 'academique_fonds', label: 'Fonds / Bailleurs' }
            ].map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleTemplateChange(tmpl.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                  data.layoutTemplate === tmpl.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyFormattedText}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copié !' : 'Copier texte CV'}</span>
          </button>

          {onOpenMasterResume && (
            <button
              onClick={onOpenMasterResume}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-900/40 transition-all"
            >
              <ShieldCheck size={13} />
              <span>Voir CV Maître</span>
            </button>
          )}
        </div>
      </div>

      {/* KEYWORD ALIGNMENT BADGES */}
      <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap size={12} className="text-yellow-400" /> Mots-clés valorisés pour l'annonce :
        </span>
        {data.matchedKeywords.map((kw, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-blue-950/80 text-blue-300 border border-blue-800/50 rounded-lg text-[10px] font-semibold">
            {kw}
          </span>
        ))}
      </div>

      {/* CV DOCUMENT PREVIEW SHEET */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 text-slate-200 shadow-2xl relative overflow-hidden font-sans">
        
        {/* CV HEADER */}
        <div className="border-b border-slate-800 pb-5 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">{masterResume.fullName}</h2>
              {isEditingHeadline ? (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={data.tailoredHeadline}
                    onChange={(e) => setData({ ...data, tailoredHeadline: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none w-full"
                  />
                  <button 
                    onClick={() => { setIsEditingHeadline(false); onUpdateContextualResume(data); }}
                    className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-blue-400">{data.tailoredHeadline}</p>
                  <button onClick={() => setIsEditingHeadline(true)} className="text-slate-500 hover:text-slate-300 text-xs">
                    <Edit3 size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <p>{masterResume.email}</p>
              <p>{masterResume.phone}</p>
              <p>{masterResume.location}</p>
            </div>
          </div>
        </div>

        {/* TAILORED SUMMARY */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles size={12} /> Profil & Proposition de Valeur Ciblée
            </h4>
            <button onClick={() => setIsEditingSummary(!isEditingSummary)} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1">
              <Edit3 size={11} /> {isEditingSummary ? 'Fermer' : 'Éditer'}
            </button>
          </div>

          {isEditingSummary ? (
            <div className="space-y-2">
              <textarea
                value={data.tailoredSummary}
                onChange={(e) => setData({ ...data, tailoredSummary: e.target.value })}
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white resize-none"
              />
              <button 
                onClick={() => { setIsEditingSummary(false); onUpdateContextualResume(data); }}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Enregistrer
              </button>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
              {data.tailoredSummary}
            </p>
          )}
        </div>

        {/* HIGHLIGHTED EXPERIENCES */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Expériences Majeures en Résonance avec {opportunity.entity}
          </h4>

          <div className="space-y-4">
            {masterResume.experiences
              .filter(exp => data.highlightedExperienceIds.includes(exp.id))
              .map((exp) => (
                <div key={exp.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-sm text-white">{exp.role}</h5>
                      <p className="text-xs text-slate-400">{exp.company} · {exp.location}</p>
                    </div>
                    <span className="text-xs text-slate-400">{exp.startDate} → {exp.endDate}</span>
                  </div>

                  {/* Tailored Achievements Bullets */}
                  <ul className="space-y-1.5 pl-2">
                    {(data.rephrasedAchievements[exp.id] || exp.keyAchievements).map((ach, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-blue-400 font-bold">▪</span>
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        {/* SKILLS MATRIX */}
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Compétences Clés & Niveaux de Maîtrise
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.prioritizedSkills.map((sk, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold">
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* EDUCATION & CERTIFICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Formation</h4>
            {masterResume.education.map((edu) => (
              <div key={edu.id} className="text-xs">
                <p className="font-bold text-white">{edu.degree}</p>
                <p className="text-slate-400">{edu.institution} ({edu.graduationYear})</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Certifications Validées</h4>
            {masterResume.certifications.map((c, idx) => (
              <div key={idx} className="text-xs">
                <p className="font-bold text-white">{c.title}</p>
                <p className="text-slate-400">{c.issuer} · {c.year}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GUARANTEE FOOTER */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            Certifié conforme aux antécédents validés de la plateforme Le Monde à Vous
          </span>
          <span className="font-mono text-[10px]">ID: LMAV-{opportunity.id.slice(0, 8)}</span>
        </div>

      </div>

    </div>
  );
};
