import React from 'react';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';

/**
 * ÉCRAN DE REPRISE — serveur d'authentification injoignable (Direction,
 * 05/09/2026, DEC-2026-083). FERMÉ PAR DÉFAUT : quand la session gardée par
 * l'appareil ne peut pas être vérifiée (réseau coupé, serveur sans réponse),
 * l'interface ne s'ouvre pas. La session locale n'est PAS effacée (elle n'a
 * pas été refusée) ; dès que le serveur répond, l'entrée reprend sans
 * ressaisie : bouton « Réessayer », retour du réseau, retour sur la page,
 * minuterie (App.tsx).
 */
export const MESSAGE_SERVEUR_INJOIGNABLE = 'MokNet est momentanément injoignable, veuillez réessayer.';

interface ServeurInjoignableProps {
    /** Détail technique du dernier échec (journal), affiché en petit. */
    raison?: string | null;
    /** Une nouvelle tentative est en cours : bouton neutralisé, état annoncé. */
    tentativeEnCours: boolean;
    onReessayer: () => void;
}

export const ServeurInjoignable: React.FC<ServeurInjoignableProps> = ({ raison, tentativeEnCours, onReessayer }) => (
    <div data-miroir className="fixed inset-0 flex items-center justify-center font-sans overflow-y-auto py-10">
        <div
            data-testid="ecran-serveur-injoignable"
            role="alert"
            aria-live="polite"
            aria-busy={tentativeEnCours}
            className="w-[calc(100%-2.5rem)] max-w-[440px] mir-sheet rounded-3xl p-6 md:p-10 border flex flex-col items-center text-center animate-fade-up my-auto"
        >
            <div className="w-12 h-12 bg-gradient-to-tr from-slate-600 to-slate-800 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <WifiOff className="text-white" size={24} aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">{MESSAGE_SERVEUR_INJOIGNABLE}</h1>
            <p className="mt-3 text-sm text-gray-600">
                Votre session sur cet appareil est conservée. Dès que la connexion revient, vous reprenez sans vous reconnecter.
            </p>
            <button
                type="button"
                onClick={onReessayer}
                disabled={tentativeEnCours}
                className="mt-6 w-full min-h-[44px] bg-blue-600 text-white py-3 px-6 rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
                {tentativeEnCours ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}
                {tentativeEnCours ? 'Nouvelle tentative en cours…' : 'Réessayer'}
            </button>
            <p className="mt-4 text-xs text-gray-500">
                Nouvelle tentative automatique dès que le réseau revient, au retour sur cette page et toutes les 30 secondes.
            </p>
            {raison ? (
                <p className="mt-2 text-[11px] text-gray-400 break-words" data-testid="raison-injoignable">
                    Détail technique : {raison}
                </p>
            ) : null}
        </div>
    </div>
);
