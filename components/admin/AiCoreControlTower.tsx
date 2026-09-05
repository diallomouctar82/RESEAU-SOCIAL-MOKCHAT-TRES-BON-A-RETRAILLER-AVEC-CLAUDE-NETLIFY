// Tour de contrôle Vision Smart AI Core — CONTENEUR.
//
// Il fait le seul travail que la vue ne fait pas : lire l'état réel en base et
// le lui passer. Aucun de ses boutons n'active un outil ni n'accorde un droit —
// « Actualiser » relit, rien de plus.

import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { AiCoreControlTowerView, Carte } from './AiCoreControlTowerView';
import { EtatTourDeControle, collecterEtatTourDeControle } from '../../services/aiCoreControlTower';

export const AiCoreControlTower: React.FC = () => {
    const [etat, setEtat] = useState<EtatTourDeControle | null>(null);
    const [chargement, setChargement] = useState(true);
    const [echec, setEchec] = useState<string | null>(null);

    const charger = async () => {
        setChargement(true);
        try {
            setEtat(await collecterEtatTourDeControle());
            setEchec(null);
        } catch (err: any) {
            setEchec(err?.message || "La tour de contrôle n'a pas pu établir l'état d'AI Core.");
        } finally {
            setChargement(false);
        }
    };

    useEffect(() => { charger(); }, []);

    if (chargement && !etat) {
        return (
            <div className="flex items-center gap-2 p-6 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Relevé de l'état d'AI Core…
            </div>
        );
    }

    if (echec && !etat) {
        return (
            <Carte className="p-4 border-rose-500/30">
                <p className="text-sm text-rose-300 font-bold">Relevé impossible</p>
                <p className="text-xs text-slate-400 mt-1">{echec}</p>
                <button
                    type="button"
                    onClick={charger}
                    className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                >
                    Réessayer
                </button>
            </Carte>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={charger}
                    disabled={chargement}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                    <RefreshCw size={12} className={chargement ? 'animate-spin' : ''} />
                    Actualiser le relevé
                </button>
            </div>
            {etat && <AiCoreControlTowerView etat={etat} />}
        </div>
    );
};
