// Page de prévisualisation de la Tour de contrôle AI Core.
//
// Elle rend le composant RÉEL (`AiCoreControlTowerView`) avec les entrées
// RÉELLES relevées en production, passées par la fonction RÉELLE de calcul
// (`construireEtat`). Rien n'est redessiné pour la démonstration : si le
// composant change, cette page change avec lui.
//
// Ce qu'elle ne fait pas : se connecter à Supabase, porter une session,
// exposer une clé. Elle est publique parce qu'elle ne contient rien qui ne
// puisse l'être.

import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import { AiCoreControlTowerView } from '../../components/admin/AiCoreControlTowerView';
import { construireEtat } from '../../services/aiCoreControlTowerModel';
import { INSTANTANE, ORIGINE_INSTANTANE } from './snapshot';

const etat = construireEtat(INSTANTANE);

const Page: React.FC = () => (
    <div className="min-h-screen bg-[#070D1E] text-slate-200">
        <div className="max-w-[1180px] mx-auto px-4 py-8 space-y-6">

            {/* Bandeau de nature : ce que cette page est, et ce qu'elle n'est pas. */}
            <header className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/40 bg-amber-500/10 text-amber-300">
                        PRÉVISUALISATION — PAS LA PRODUCTION
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700 bg-slate-900 text-slate-400">
                        moknet.net n'est pas modifié
                    </span>
                </div>
                <h1 className="font-display text-xl font-extrabold text-white">
                    Tour de contrôle AI Core — prévisualisation
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed">
                    Cet écran est le composant réel de la console d'administration MokNet, rendu avec un
                    instantané en lecture seule de la base de production ({ORIGINE_INSTANTANE.date}, projet{' '}
                    <span className="font-mono text-slate-300">{ORIGINE_INSTANTANE.projet}</span>, tables{' '}
                    <span className="font-mono text-slate-300">{ORIGINE_INSTANTANE.tables}</span>). Les valeurs
                    affichées ne sont pas des exemples : ce sont les vôtres, figées à cette date.
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
                    Aucun outil n'a été activé, aucun droit n'a été accordé, aucune migration n'a été appliquée,
                    rien n'a été déployé en production. Cette page ne porte aucune session et n'interroge
                    aucune base.
                </p>
            </header>

            <AiCoreControlTowerView etat={etat} />

            <footer className="text-[11px] text-slate-500 border-t border-slate-800 pt-4 flex flex-wrap gap-x-4 gap-y-1 justify-between">
                <span>
                    Composant : <span className="font-mono">components/admin/AiCoreControlTowerView.tsx</span> ·
                    Calcul : <span className="font-mono">services/aiCoreControlTowerModel.ts</span>
                </span>
                <span>Instantané figé au {new Date(etat.releveLe).toLocaleString('fr-FR')}</span>
            </footer>
        </div>
    </div>
);

createRoot(document.getElementById('racine')!).render(<Page />);
