import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, Check, Loader2, RefreshCw, Share, SquarePlus, TriangleAlert } from 'lucide-react';
import {
    describePushDeviceState,
    getPushDeviceStatus,
    requestPushPermissionAndSubscribe,
    type PushDeviceStatus,
} from '../../services/push/pushService';

/**
 * AU-9 — « Sonnerie hors application », état PERMANENT et vérifiable de CET
 * appareil, dans les Paramètres.
 *
 * Pourquoi ici et pas seulement dans un bandeau : le bandeau d'invitation
 * (PushPermissionPrompt) s'efface pour sept jours d'un simple « Plus tard »,
 * et sur iPhone dans un onglet il ne propose aucun bouton — après quoi plus
 * rien, nulle part, ne dit que le téléphone ne sonnera pas. La table des
 * abonnements était vide : personne ne pouvait le constater.
 *
 * Ce que la carte affiche vient de `getPushDeviceStatus`, qui croise le
 * navigateur, la permission et l'enregistrement RÉEL côté serveur — jamais
 * « activé » sur la seule permission. Un échec de vérification est montré
 * tel quel, avec « Revérifier ».
 */

const stateTone: Record<PushDeviceStatus['state'], { badge: string; icon: React.ReactNode; label: string }> = {
    active: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Check size={16} />, label: 'Active sur cet appareil' },
    granted_not_registered: { badge: 'bg-amber-50 text-amber-800 border-amber-200', icon: <TriangleAlert size={16} />, label: 'Incomplète' },
    default: { badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: <BellRing size={16} />, label: 'Non activée' },
    denied: { badge: 'bg-red-50 text-red-700 border-red-200', icon: <TriangleAlert size={16} />, label: 'Refusée' },
    needs_ios_install: { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Share size={16} />, label: 'À installer sur l’écran d’accueil' },
    unsupported: { badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: <TriangleAlert size={16} />, label: 'Non disponible ici' },
};

interface OutsideAppRingingCardProps {
    userId: string | null;
}

export const OutsideAppRingingCard: React.FC<OutsideAppRingingCardProps> = ({ userId }) => {
    const [status, setStatus] = useState<PushDeviceStatus | null>(null);
    const [busy, setBusy] = useState<'checking' | 'activating' | null>('checking');
    const [actionError, setActionError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!userId) { setStatus(null); setBusy(null); return; }
        setBusy('checking');
        try {
            setStatus(await getPushDeviceStatus(userId));
        } finally {
            setBusy(null);
        }
    }, [userId]);

    useEffect(() => { void refresh(); }, [refresh]);

    const activate = useCallback(async () => {
        if (!userId) return;
        setBusy('activating');
        setActionError(null);
        try {
            const result = await requestPushPermissionAndSubscribe(userId);
            if (result.status === 'error') setActionError(result.error || 'Activation impossible.');
            setStatus(await getPushDeviceStatus(userId));
        } finally {
            setBusy(null);
        }
    }, [userId]);

    if (!userId) return null;

    const tone = status ? stateTone[status.state] : null;
    const canActivate = status ? status.state === 'default' || status.state === 'granted_not_registered' : false;

    return (
        <div data-testid="outside-app-ringing" className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                        <BellRing size={18} className="text-blue-600" />
                        <span className="text-sm font-bold text-slate-900">Sonnerie hors application</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        Pour qu'un appel vous atteigne quand MokNet est fermé ou que l'écran est verrouillé, cet appareil doit être enregistré auprès du serveur.
                    </p>
                </div>
                {tone && (
                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tone.badge}`}>
                        {tone.icon} {tone.label}
                    </span>
                )}
            </div>

            {busy === 'checking' && !status && (
                <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Vérification de cet appareil…</p>
            )}

            {status && (
                <>
                    <p className="text-xs text-slate-700 leading-snug">{describePushDeviceState(status.state)}</p>

                    {status.state === 'needs_ios_install' && (
                        <p className="text-[11px] text-slate-600 leading-snug">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800"><Share size={12} aria-hidden="true" /> Partager</span>
                            {' → '}
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800"><SquarePlus size={12} aria-hidden="true" /> Sur l'écran d'accueil</span>
                            , puis rouvrez MokNet depuis son icône et revenez ici.
                        </p>
                    )}

                    {status.state === 'denied' && (
                        <p className="text-[11px] text-slate-600 leading-snug">
                            Réglages du navigateur (icône à gauche de l'adresse) → Notifications → Autoriser pour ce site, puis rechargez la page.
                        </p>
                    )}

                    {/* Fait mesuré, jamais une estimation : combien d'appareils
                        de ce compte le serveur peut réellement joindre. */}
                    {status.deviceCount !== null && (
                        <p className="text-[11px] text-slate-500">
                            {status.deviceCount === 0
                                ? 'Aucun de vos appareils n’est enregistré pour l’instant.'
                                : `${status.deviceCount} appareil${status.deviceCount > 1 ? 's' : ''} enregistré${status.deviceCount > 1 ? 's' : ''} sur ce compte.`}
                        </p>
                    )}

                    {status.error && (
                        <p className="text-[11px] text-red-700 leading-snug break-words">Vérification impossible : {status.error}</p>
                    )}
                    {actionError && (
                        <p className="text-[11px] text-red-700 leading-snug break-words">{actionError}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {canActivate && (
                            <button
                                type="button"
                                onClick={activate}
                                disabled={busy !== null}
                                className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                            >
                                {busy === 'activating' ? 'Activation…' : 'Activer sur cet appareil'}
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
