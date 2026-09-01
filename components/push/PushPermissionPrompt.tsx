import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, Check, Share, SquarePlus, TriangleAlert, X } from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import {
    getPushPermissionState,
    needsIosHomeScreenInstall,
    requestPushPermissionAndSubscribe,
} from '../../services/push/pushService';
import { isRealUserId } from '../../hooks/usePushNotifications';

/**
 * ÉQUIPE P (mission VF-1) — bandeau compact « Recevoir les appels et messages
 * même hors de l'application ».
 *
 * Visible seulement si : push supporté ET permission « default » ET
 * utilisateur réellement connecté (id Supabase, Supabase configuré) ET pas
 * de « Plus tard » de moins de 7 jours POUR CET UTILISATEUR. « Activer »
 * demande la permission dans le geste du clic (seul moment où le navigateur
 * l'accepte) puis abonne l'appareil ; chaque issue est affichée telle
 * quelle : activées, refusées (avec la marche à suivre pour réactiver dans
 * le navigateur), ou l'erreur réelle avec « Réessayer ».
 *
 * iPhone/iPad dans un simple onglet : le push Web n'existe qu'une fois l'app
 * ajoutée à l'écran d'accueil — la consigne « Partager → Sur l'écran
 * d'accueil » remplace le bouton, qui serait inerte.
 *
 * Position : bas de l'écran, au-dessus du dock mobile (bottom-24, comme le
 * bouton de messagerie `#mooc-chat-toggle-btn` — fixed bottom-24 right-4,
 * ~3.5 rem de large), en laissant sa colonne libre (right-[5.25rem]) ; la
 * pastille de l'Architecte (bottom-44 right-4) est dans la même colonne
 * libre. Desktop : coin bas-gauche (le chat est bas-droite, l'Architecte
 * bottom-24 right-8). z-30, sous le chat (z-40), le dock (z-50) et la barre
 * de l'Architecte (z-[60]) : le bandeau ne recouvre jamais ces commandes,
 * ce sont elles qui passent devant lui si elles s'ouvrent.
 *
 * Couleurs explicites (carte blanche, texte ardoise, bouton bleu marque) :
 * lisible quel que soit le fond de l'écran derrière, clair ou sombre.
 */

/** Préfixe du marqueur « Plus tard » — suffixé par l'id utilisateur, jamais partagé entre comptes. */
export const PUSH_PROMPT_DISMISS_PREFIX = 'lmav_push_prompt_later_v1:';

/** Durée pendant laquelle « Plus tard » est respecté. */
export const PUSH_PROMPT_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const PUSH_PROMPT_TEXT = "Recevoir les appels et messages même hors de l'application";

type View = 'hidden' | 'ask' | 'ios' | 'working' | 'enabled' | 'denied' | 'error';

const dismissKey = (userId: string): string => `${PUSH_PROMPT_DISMISS_PREFIX}${userId}`;

const isDismissed = (userId: string): boolean => {
    try {
        const raw = localStorage.getItem(dismissKey(userId));
        const dismissedAt = raw ? Number(raw) : Number.NaN;
        if (!Number.isFinite(dismissedAt)) return false;
        const age = Date.now() - dismissedAt;
        return age >= 0 && age < PUSH_PROMPT_DISMISS_TTL_MS;
    } catch {
        // Stockage indisponible : on redemandera, sans conséquence.
        return false;
    }
};

const rememberDismissal = (userId: string): void => {
    try {
        localStorage.setItem(dismissKey(userId), String(Date.now()));
    } catch (err) {
        console.info('Choix « Plus tard » non mémorisé :', err instanceof Error ? err.message : err);
    }
};

const initialView = (userId: string | null): View => {
    if (!isRealUserId(userId) || !isSupabaseConfigured) return 'hidden';
    if (isDismissed(userId)) return 'hidden';
    if (needsIosHomeScreenInstall()) return 'ios';
    return getPushPermissionState() === 'default' ? 'ask' : 'hidden';
};

interface PushPermissionPromptProps {
    userId: string | null;
}

export const PushPermissionPrompt: React.FC<PushPermissionPromptProps> = ({ userId }) => {
    const [view, setView] = useState<View>(() => initialView(userId));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [note, setNote] = useState<string | null>(null);

    // Autre compte connecté sur le même appareil : on repart de SES réglages.
    useEffect(() => {
        setView(initialView(userId));
        setErrorMessage(null);
        setNote(null);
    }, [userId]);

    // La confirmation disparaît seule ; les autres états attendent un geste.
    useEffect(() => {
        if (view !== 'enabled') return;
        const timer = setTimeout(() => setView('hidden'), 6000);
        return () => clearTimeout(timer);
    }, [view]);

    const dismissForAWhile = useCallback(() => {
        if (isRealUserId(userId)) rememberDismissal(userId);
        setView('hidden');
    }, [userId]);

    const activate = useCallback(async () => {
        if (!isRealUserId(userId)) return;
        setView('working');
        setErrorMessage(null);
        setNote(null);
        const result = await requestPushPermissionAndSubscribe(userId);
        switch (result.status) {
            case 'subscribed':
                setView('enabled');
                return;
            case 'denied':
                setView('denied');
                return;
            case 'default':
                setNote("Permission non accordée pour l'instant — vous pourrez réessayer.");
                setView('ask');
                return;
            case 'unsupported':
                setView('hidden');
                return;
            case 'error':
                setErrorMessage(result.error || 'Activation impossible.');
                setView('error');
                return;
        }
    }, [userId]);

    if (view === 'hidden') return null;

    const primaryButton =
        'min-h-[44px] px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';
    const secondaryButton =
        'min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';
    const closeButton =
        'shrink-0 -mr-1 -mt-1 w-11 h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600';

    return (
        <div
            role="status"
            aria-live="polite"
            data-testid="push-permission-prompt"
            className="fixed z-30 bottom-24 left-3 right-[5.25rem] md:bottom-6 md:left-6 md:right-auto md:w-[380px] pointer-events-none"
        >
            <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl shadow-slate-900/10 p-3 text-slate-900 animate-fade-up">
                {(view === 'ask' || view === 'working') && (
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-9 h-9 rounded-full bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center">
                            <BellRing size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-snug">{PUSH_PROMPT_TEXT}</p>
                            {note && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{note}</p>}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <button type="button" onClick={activate} disabled={view === 'working'} className={primaryButton}>
                                    {view === 'working' ? 'Activation…' : 'Activer'}
                                </button>
                                <button type="button" onClick={dismissForAWhile} disabled={view === 'working'} className={secondaryButton}>
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'ios' && (
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-9 h-9 rounded-full bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center">
                            <BellRing size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-snug">{PUSH_PROMPT_TEXT}</p>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                Sur iPhone et iPad, ajoutez d'abord MokNet à l'écran d'accueil :{' '}
                                <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                                    <Share size={12} aria-hidden="true" /> Partager
                                </span>
                                {' → '}
                                <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                                    <SquarePlus size={12} aria-hidden="true" /> Sur l'écran d'accueil
                                </span>
                                , puis rouvrez l'application depuis son icône.
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <button type="button" onClick={dismissForAWhile} className={secondaryButton}>
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'enabled' && (
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Check size={18} />
                        </span>
                        <p className="min-w-0 flex-1 text-xs font-semibold leading-snug pt-2">
                            Notifications activées : les appels et messages vous atteindront même hors de l'application.
                        </p>
                        <button type="button" onClick={() => setView('hidden')} aria-label="Fermer" className={closeButton}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {view === 'denied' && (
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-9 h-9 rounded-full bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
                            <TriangleAlert size={18} />
                        </span>
                        <div className="min-w-0 flex-1 pt-1">
                            <p className="text-xs font-bold leading-snug">Notifications refusées.</p>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                                Pour les réactiver : réglages du navigateur (icône à gauche de l'adresse) → Notifications → Autoriser pour ce site, puis rechargez.
                            </p>
                        </div>
                        <button type="button" onClick={() => setView('hidden')} aria-label="Fermer" className={closeButton}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {view === 'error' && (
                    <div className="flex items-start gap-3">
                        <span className="shrink-0 w-9 h-9 rounded-full bg-red-50 border border-red-100 text-red-700 flex items-center justify-center">
                            <TriangleAlert size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-snug">Activation impossible</p>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug break-words">{errorMessage}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <button type="button" onClick={activate} className={primaryButton}>
                                    Réessayer
                                </button>
                                <button type="button" onClick={dismissForAWhile} className={secondaryButton}>
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
