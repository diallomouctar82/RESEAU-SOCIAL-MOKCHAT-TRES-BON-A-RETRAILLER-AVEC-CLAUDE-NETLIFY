import React from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import type { SyncPhase } from '../../services/moduleRepository';

interface ModuleSyncStatusProps {
  phase: SyncPhase;
  isLoading?: boolean;
  error?: string | null;
  hasQueuedChanges?: boolean;
  onRetry: () => void;
}

export const ModuleSyncStatus: React.FC<ModuleSyncStatusProps> = ({
  phase,
  isLoading = false,
  error,
  hasQueuedChanges = false,
  onRetry,
}) => {
  const waiting = phase === 'syncing' || isLoading;
  const offline = phase === 'offline' || hasQueuedChanges;
  const failed = phase === 'error' || Boolean(error);

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
        failed
          ? 'border-red-200 bg-red-50 text-red-800'
          : offline
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
      role={failed ? 'alert' : 'status'}
      aria-live="polite"
    >
      {waiting ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        : failed ? <AlertTriangle size={14} aria-hidden="true" />
          : offline ? <CloudOff size={14} aria-hidden="true" />
            : <CheckCircle2 size={14} aria-hidden="true" />}
      <span className="font-semibold">
        {waiting
          ? 'Chargement et synchronisation…'
          : failed
            ? error || 'Synchronisation interrompue.'
            : offline
              ? 'Enregistré sur cet appareil, synchronisation Supabase en attente.'
              : 'Données synchronisées avec Supabase.'}
      </span>
      {(failed || offline) && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg bg-white px-3 font-bold shadow-sm"
        >
          <RefreshCw size={13} aria-hidden="true" /> Réessayer
        </button>
      )}
    </div>
  );
};
