import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Mic, RefreshCw, Share, SquarePlus, TriangleAlert } from 'lucide-react';
import {
    describeMicrophonePermission,
    getMicrophonePermissionStatus,
    requestMicrophoneOnce,
    type MicPermissionStatus,
} from '../../services/calls/microphonePermission';

/**
 * AU-10 — « Autorisation du micro », état réel de CET appareil.
 *
 * Le but n'est pas d'ajouter un réglage : l'autorisation micro appartient au
 * navigateur, MokNet ne peut ni la donner ni la retirer. Le but est (1) de
 * pouvoir l'accorder À FROID, ici, plutôt que d'être interrompu par la
 * demande pendant la sonnerie — ce qui est très exactement le moment où elle
 * paraît « revenir à chaque appel » — et (2) de dire la vraie raison quand
 * elle revient malgré tout : sur iPhone, un onglet du navigateur rend
 * l'autorisation à la fin de la session, l'écran d'accueil la conserve.
 */

const tone: Record<MicPermissionStatus['state'], { badge: string; icon: React.ReactNode; label: string }> = {
    granted: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Check size={16} />, label: 'Autorisé' },
    prompt: { badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: <Mic size={16} />, label: 'Pas encore autorisé' },
    denied: { badge: 'bg-red-50 text-red-700 border-red-200', icon: <TriangleAlert size={16} />, label: 'Refusé' },
    unsupported: { badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: <TriangleAlert size={16} />, label: 'Non disponible ici' },
};

export const MicrophonePermissionCard: React.FC = () => {
    const [status, setStatus] = useState<MicPermissionStatus | null>(null);
    const [busy, setBusy] = useState<'checking' | 'requesting' | null>('checking');
    const [actionError, setActionError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setBusy('checking');
        try {
            setStatus(await getMicrophonePermissionStatus());
        } finally {
            setBusy(null);
        }
    }, []);

    useEffect(() => { void refresh(); }, [refresh]);

    const authorize = useCallback(async () => {
        setBusy('requesting');
        setActionError(null);
        try {
            const result = await requestMicrophoneOnce();
            if (!result.ok) setActionError(result.error || 'Autorisation impossible.');
            // L'état est RELU après la demande, jamais supposé à partir du
            // simple fait que l'appel n'a pas levé.
            setStatus(await getMicrophonePermissionStatus());
        } finally {
            setBusy(null);
        }
    }, []);

    const badge = status ? tone[status.state] : null;
    // Rien à proposer quand c'est déjà accordé et conservé, ni quand le
    // navigateur a refusé (un bouton n'y ouvrirait aucune demande) ni sans
    // micro du tout : un bouton inerte est pire que pas de bouton.
    const canAuthorize = !!status
        && status.state !== 'unsupported'
        && status.state !== 'denied'
        && !(status.state === 'granted' && (status.measured || !status.ios));
    const showIosHint = !!status && status.ios && !status.standalone && status.state !== 'unsupported';

    return (
        <div data-testid="microphone-permission" className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <Mic size={18} className="text-blue-600" />
                        <span className="text-sm font-bold text-slate-900">Autorisation du micro</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        Cette autorisation appartient à votre navigateur, pas à MokNet : elle peut être accordée ici, à froid, pour ne plus être demandée pendant la sonnerie d'un appel.
                    </p>
                </div>
                {badge && (
                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.badge}`}>
                        {badge.icon} {badge.label}
                    </span>
                )}
            </div>

            {busy === 'checking' && !status && (
                <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Lecture de l'état de cet appareil…</p>
            )}

            {status && (
                <>
                    <p className="text-xs text-slate-700 leading-snug">{describeMicrophonePermission(status)}</p>

                    {!status.measured && status.state !== 'unsupported' && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                            État déduit des périphériques audio : ce navigateur ne publie pas l'autorisation elle-même.
                        </p>
                    )}

                    {showIosHint && (
                        <p className="text-[11px] text-slate-600 leading-snug">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800"><Share size={12} aria-hidden="true" /> Partager</span>
                            {' → '}
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800"><SquarePlus size={12} aria-hidden="true" /> Sur l'écran d'accueil</span>
                            , puis ouvrez MokNet depuis son icône : l'autorisation y reste acquise d'un appel à l'autre.
                        </p>
                    )}

                    {actionError && (
                        <p className="text-[11px] text-red-700 leading-snug break-words">{actionError}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {canAuthorize && (
                            <button
                                type="button"
                                onClick={authorize}
                                disabled={busy !== null}
                                className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                            >
                                {busy === 'requesting' ? 'Demande en cours…' : 'Autoriser le micro maintenant'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={refresh}
                            disabled={busy !== null}
                            className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        >
                            <RefreshCw size={14} className={busy === 'checking' ? 'animate-spin' : ''} /> Revérifier
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
