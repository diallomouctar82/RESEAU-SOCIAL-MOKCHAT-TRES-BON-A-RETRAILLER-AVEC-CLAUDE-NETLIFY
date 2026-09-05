import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { startUpdateWatch } from '../services/updateWatch';

/**
 * Bandeau « nouvelle version disponible ».
 *
 * Existe parce qu'une application à page unique restée ouverte ne sait pas
 * qu'elle est périmée (voir services/updateWatch.ts). Il prévient et propose
 * d'actualiser ; il n'impose jamais le rechargement — une personne en appel
 * ou en pleine saisie ne doit pas être coupée par une mise à jour.
 *
 * « Plus tard » ferme le bandeau pour la session courante seulement : au
 * prochain rechargement, si une version plus récente existe encore, il
 * reviendra. Ce n'est pas un refus définitif, c'est un report.
 */
export const UpdateBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [reloading, setReloading] = useState(false);

    useEffect(() => startUpdateWatch(() => setVisible(true)), []);

    if (!visible) return null;

    const actualiser = () => {
        setReloading(true);
        window.location.reload();
    };

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
        >
            <div className="pointer-events-auto flex items-center gap-3 max-w-xl w-full rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/60 px-4 py-3">
                <RefreshCw size={18} className="shrink-0 text-blue-300" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight">Nouvelle version de MokNet disponible.</p>
                    <p className="text-xs text-slate-300 leading-tight mt-0.5">Actualisez pour l'utiliser — ou plus tard, rien n'est perdu.</p>
                </div>
                <button
                    type="button"
                    onClick={actualiser}
                    disabled={reloading}
                    className="shrink-0 min-h-[40px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                    {reloading ? 'Actualisation…' : 'Actualiser'}
                </button>
                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    aria-label="Plus tard"
                    title="Plus tard"
                    className="shrink-0 min-h-[40px] min-w-[40px] grid place-items-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};
