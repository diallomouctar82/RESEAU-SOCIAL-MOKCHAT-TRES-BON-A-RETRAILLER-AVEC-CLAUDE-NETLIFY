import React from 'react';
import { Users, RotateCw, LogOut } from 'lucide-react';
import { type LiveAccessRefusal, liveFullOccupancy } from '../../services/live/liveAccessError';

/**
 * SAT-3 — L'écran quand le direct est complet.
 *
 * Ce que cet écran remplace : un « Connexion au direct… » qui pulsait
 * indéfiniment. Le serveur avait déjà refusé (SAT-2, 409 `live_full`), mais
 * rien ne le disait : la personne fixait un point d'attente pour une place qui
 * ne viendrait jamais. Un refus muet est pire qu'un refus — il fait porter à
 * l'utilisateur le soupçon que SON appareil est en panne.
 *
 * Trois règles tenues ici :
 *
 * 1. **Aucun chiffre inventé.** Les chiffres viennent de `listParticipants`,
 *    lus par la porte serveur à l'instant du refus. Quand le serveur ne les a
 *    pas donnés (`liveFullOccupancy` rend `null`), l'écran dit « complet »
 *    sans compteur plutôt qu'un nombre plausible. Un chiffre faux serait pire
 *    que pas de chiffre.
 * 2. **Une issue, pas une impasse.** Réessayer a un sens réel : une place se
 *    libère dès que quelqu'un part, et la porte rouvre AUSSITÔT (mesuré au
 *    banc SAT-2 : `listParticipants` est exact immédiatement). Le bouton n'est
 *    donc pas décoratif.
 * 3. **Le chiffre est daté.** « à l'instant » — l'occupation change pendant
 *    que l'écran est affiché ; le compteur est une photo, pas un direct.
 */

export interface LiveFullNoticeProps {
    /** Le refus tel que le hook de transport l'a reçu du serveur. */
    refusal: LiveAccessRefusal;
    /** Nouvelle tentative complète (jeton + connexion). */
    onRetry: () => void;
    /** Quitter le direct — toujours proposé : rester bloqué n'est pas une option. */
    onLeave?: () => void;
}

export const LiveFullNotice: React.FC<LiveFullNoticeProps> = ({ refusal, onRetry, onLeave }) => {
    const occupancy = liveFullOccupancy(refusal);

    return (
        <div
            data-testid="live-full-notice"
            role="alert"
            className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
        >
            <div className="live-pane w-full max-w-md p-6 sm:p-8 text-center flex flex-col items-center gap-4">
                <span
                    aria-hidden="true"
                    className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-500/15 border border-amber-400/30"
                >
                    <Users size={26} className="text-amber-300" />
                </span>

                <h2 className="text-lg sm:text-xl font-extrabold text-white">Ce direct est complet</h2>

                {occupancy ? (
                    <p data-testid="live-full-counts" className="text-sm text-slate-200">
                        <span className="font-extrabold text-white tabular-nums">
                            {occupancy.occupied}
                        </span>
                        {' '}
                        {occupancy.occupied > 1 ? 'personnes y sont' : 'personne y est'} à l'instant, pour{' '}
                        <span className="font-extrabold text-white tabular-nums">{occupancy.capacity}</span>
                        {' '}
                        {occupancy.capacity > 1 ? 'places' : 'place'}.
                    </p>
                ) : (
                    /* Le serveur n'a pas donné les deux chiffres : on le dit ainsi
                       plutôt que d'en afficher un seul, ou pire, d'en inventer. */
                    <p data-testid="live-full-no-counts" className="text-sm text-slate-200">
                        Toutes les places sont prises pour le moment.
                    </p>
                )}

                <p className="text-xs text-slate-400 leading-relaxed">
                    Vous n'avez pas été déconnecté : l'entrée est simplement fermée tant qu'aucune
                    place ne se libère. Dès que quelqu'un quitte le direct, réessayer suffit.
                </p>

                <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
                    {/* Le libellé reprend le mot du texte ci-dessus (« réessayer
                        suffit ») : une action, un seul mot, du corps du message
                        jusqu'au bouton. `whitespace-nowrap` parce qu'un libellé
                        cassé en deux lignes déséquilibrait la paire sur
                        ordinateur — mesuré au banc, pas supposé. */}
                    <button
                        type="button"
                        onClick={onRetry}
                        data-testid="live-full-retry"
                        className="flex-1 min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                    >
                        <RotateCw size={16} /> <span data-testid="live-full-retry-label">Réessayer</span>
                    </button>
                    {onLeave && (
                        <button
                            type="button"
                            onClick={onLeave}
                            data-testid="live-full-leave"
                            className="flex-1 min-h-[44px] px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-100 text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                        >
                            <LogOut size={16} /> <span data-testid="live-full-leave-label">Quitter</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveFullNotice;
