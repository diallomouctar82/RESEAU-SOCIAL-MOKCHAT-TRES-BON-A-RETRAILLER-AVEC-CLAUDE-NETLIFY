import React from 'react';
import { PlayCircle, MessageSquare, Plus, Search, Compass, Sparkles, LucideIcon } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  tabTarget: string;
  badge?: string;
  color?: string;
}

export interface QuickActionZoneProps {
  actions?: QuickAction[];
  onActionClick: (tabTarget: string) => void;
  onOpenDialloOS?: () => void;
  onOpenSearch?: () => void;
  className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'resume', label: 'Reprendre', icon: PlayCircle, tabTarget: 'career' },
  { id: 'ask-diallo', label: 'Demander à Diallo', icon: Sparkles, tabTarget: 'chat', color: 'text-blue-600' },
  { id: 'new-doc', label: 'Nouvelle démarche', icon: Plus, tabTarget: 'admin-procedures' },
  { id: 'search-all', label: 'Recherche universelle', icon: Search, tabTarget: 'search' },
];

export const QuickActionZone: React.FC<QuickActionZoneProps> = ({
  actions = DEFAULT_ACTIONS,
  onActionClick,
  onOpenDialloOS,
  onOpenSearch,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto py-1 no-scrollbar ${className}`}>
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={() => {
              if (act.id === 'ask-diallo' && onOpenDialloOS) {
                onOpenDialloOS();
              } else if (act.id === 'search-all' && onOpenSearch) {
                onOpenSearch();
              } else {
                onActionClick(act.tabTarget);
              }
            }}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 shadow-xs shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Icon size={14} className={act.color || 'text-slate-600'} />
            <span>{act.label}</span>
            {act.badge && (
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                {act.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
