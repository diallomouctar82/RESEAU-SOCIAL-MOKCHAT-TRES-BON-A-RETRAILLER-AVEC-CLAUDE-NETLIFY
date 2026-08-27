import React from 'react';
import { ShieldCheck, ExternalLink, Calendar, BookOpen, Building2 } from 'lucide-react';

export interface SourceCitationCardProps {
  sourceName: string;
  sourceType: 'Loi & Code Juridique' | 'Consulat / Ministère' | 'Université & Organisme' | 'Incoterm & Chambre Commerce' | 'Organisation Médicale';
  referenceDate?: string;
  articleOrCode?: string;
  summary: string;
  url?: string;
  className?: string;
}

export const SourceCitationCard: React.FC<SourceCitationCardProps> = ({
  sourceName,
  sourceType,
  referenceDate,
  articleOrCode,
  summary,
  url,
  className = ''
}) => {
  return (
    <div className={`bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 text-slate-800 text-xs transition-all hover:bg-slate-50 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>{sourceName}</span>
          <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            {sourceType}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {referenceDate && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {referenceDate}
            </span>
          )}
          {articleOrCode && (
            <span className="font-mono bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
              {articleOrCode}
            </span>
          )}
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed">
        {summary}
      </p>

      {url && (
        <div className="mt-2 text-right">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-[11px]"
          >
            <span>Consulter le texte officiel</span>
            <ExternalLink size={11} />
          </a>
        </div>
      )}
    </div>
  );
};
