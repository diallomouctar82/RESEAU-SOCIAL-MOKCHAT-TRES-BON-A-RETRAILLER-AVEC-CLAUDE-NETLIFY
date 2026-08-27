import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  CheckCircle2, 
  Share2, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export interface KnowledgeCardProps {
  id?: string;
  category: string;
  title: string;
  takeaway: string;
  source: {
    institution: string;
    verifiedDate: string;
    url?: string;
  };
  deepDiveUrl?: string;
  onDeepDive?: () => void;
  onUseInProject?: () => void;
  onShare?: () => void;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  category,
  title,
  takeaway,
  source,
  deepDiveUrl,
  onDeepDive,
  onUseInProject,
  onShare
}) => {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 space-y-4 flex flex-col justify-between group">
      
      <div className="space-y-3">
        {/* Category & Save Action */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/50">
            {category}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-slate-50 transition-colors ${
                isSaved ? 'text-orange-600' : ''
              }`}
              title={isSaved ? "Enregistré dans ma mémoire" : "Enregistrer cette fiche"}
              aria-label="Enregistrer la fiche de connaissance"
            >
              {isSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>

            {onShare && (
              <button
                onClick={onShare}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                aria-label="Partager la fiche"
              >
                <Share2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base font-black text-slate-900 leading-snug group-hover:text-orange-600 transition-colors">
          {title}
        </h4>

        {/* Ce qu'il faut retenir */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            Ce qu'il faut retenir
          </span>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {takeaway}
          </p>
        </div>

        {/* Source Vérifiée */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span className="truncate">Source : <strong className="text-slate-700 font-semibold">{source.institution}</strong> • {source.verifiedDate}</span>
        </div>
      </div>

      {/* Action Buttons: Approfondir & Utiliser */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onDeepDive}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 transition-colors"
        >
          <BookOpen size={14} />
          <span>Approfondir</span>
        </button>

        <button
          onClick={onUseInProject}
          className="bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-xs"
        >
          <span>Utiliser</span>
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  );
};
