import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, Sparkles, ShieldCheck, FileCheck } from 'lucide-react';

export type StatusVariant = 
  | 'success' 
  | 'in_progress' 
  | 'pending' 
  | 'action_required' 
  | 'danger' 
  | 'verified' 
  | 'ai_suggestion'
  | 'neutral';

export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  icon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_CONFIG: Record<StatusVariant, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  success: {
    label: 'Validé',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={12} className="text-emerald-600" />
  },
  in_progress: {
    label: 'En cours',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Clock size={12} className="text-blue-600" />
  },
  pending: {
    label: 'En attente',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: <Clock size={12} className="text-slate-500" />
  },
  action_required: {
    label: 'Action requise',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <AlertTriangle size={12} className="text-amber-600" />
  },
  danger: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <AlertCircle size={12} className="text-rose-600" />
  },
  verified: {
    label: 'Source vérifiée',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <ShieldCheck size={12} className="text-blue-600" />
  },
  ai_suggestion: {
    label: 'Suggestion Diallo',
    bg: 'bg-slate-900',
    text: 'text-slate-100',
    border: 'border-slate-800',
    icon: <Sparkles size={12} className="text-blue-400" />
  },
  neutral: {
    label: 'Standard',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: null
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  icon = true,
  size = 'md',
  className = ''
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.neutral;
  const displayLabel = label || config.label;

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span 
      className={`inline-flex items-center font-bold rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className} whitespace-nowrap`}
    >
      {icon && config.icon}
      <span>{displayLabel}</span>
    </span>
  );
};
