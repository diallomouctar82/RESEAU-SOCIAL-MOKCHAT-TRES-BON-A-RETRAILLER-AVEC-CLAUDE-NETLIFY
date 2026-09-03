import React, { useCallback, useEffect, useState } from 'react';
import { BellRing, Loader2, Play, RefreshCw, Smartphone, X } from 'lucide-react';
import {
    canVibrateHere,
    getRingPreferences,
    getRingtones,
    getSelectedRingtoneId,
    previewRingtone,
    setRingPreferences,
    stopPreview,
    subscribeRingPreferences,
    type RingPreferences,
} from '../../services/calls/ringtoneService';
import {
    describePushDeviceState,
    getPushDeviceStatus,
    requestPushPermissionAndSubscribe,
    type PushDeviceStatus,
} from '../../services/push/pushService';

/**
 * Mission SN — petit panneau « Sonnerie » de la fenêtre de messagerie (ouvert
 * par le bouton du même nom, à côté d'« Annuaire »).
 *
 * Il n'invente aucun réglage : il pilote ceux qui existent.
 *  - Sonnerie / Vibration : réglages de CET appareil tenus par
 *    `ringtoneService` (lus par `startRinging` pour l'appli ouverte, et par
 *    `public/sw.js` — via la Cache API — pour la notification d'appel quand
 *    l'appli est fermée). La mélodie affichée est celle choisie dans les
 *    Paramètres (profil) ; elle se change là-bas, pas ici.
 *  - Hors application : le même état RÉEL que la carte des Paramètres
 *    (`getPushDeviceStatus`, croisement navigateur + permission +
 *    enregistrement serveur) et la même action (`requestPushPermissionAndSubscribe`).
 *    Indispensable ici parce que le module de messagerie autonome n'a pas de
 *    Paramètres.
 *  - Tester : un aperçu de la sonnerie — c'est aussi le geste qui déverrouille
 *    l'audio de l'appareil (AU-11), donc la façon la plus simple de vérifier
 *    qu'un appel pourra réellement sonner ici.
 */

interface RingingPanelProps {
    /** Identifiant réel (uuid) de l'utilisateur connecté ; `null` masque la partie « hors application ». */
    userId: string | null;
    /** Sonnerie choisie dans le profil, sinon celle du cache local de l'appareil. */
    ringtoneId?: string;
    onClose: () => void;
}

const STATE_LABEL: Record<PushDeviceStatus['state'], { label: string; tone: string }> = {
    active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    granted_not_registered: { label: 'Incomplète', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
    default: { label: 'Non activée', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
    denied: { label: 'Refusée', tone: 'bg-red-50 text-red-700 border-red-200' },
    needs_ios_install: { label: 'À installer', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
    unsupported: { label: 'Indisponible', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const SwitchRow: React.FC<{
    label: string;
    hint: string;
    checked: boolean;
    disabled?: boolean;
    testId: string;
    onToggle: () => void;
}> = ({ label, hint, checked, disabled = false, testId, onToggle }) => (
    <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
            <div className="font-bold text-slate-800">{label}</div>
            <div className="text-[11px] text-slate-500 leading-snug">{hint}</div>
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={onToggle}
            data-testid={testId}
            className="p-2.5 -m-2.5 rounded-full shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
            <span className={`w-11 h-6 rounded-full transition-colors relative block ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${checked ? 'right-0.5' : 'left-0.5'}`} />
            </span>
        </button>
    </div>
);

export const RingingPanel: React.FC<RingingPanelProps> = ({ userId, ringtoneId, onClose }) => {
    const [prefs, setPrefs] = useState<RingPreferences>(() => getRingPreferences());
    const [status, setStatus] = useState<PushDeviceStatus | null>(null);
    const [busy, setBusy] = useState<'checking' | 'activating' | null>(userId ? 'checking' : null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);

    const vibrationAvailable = canVibrateHere();
    const effectiveRingtoneId = ringtoneId ?? getSelectedRingtoneId();
    const ringtoneName = getRingtones().find((ringtone) => ringtone.id === effectiveRingtoneId)?.name ?? effectiveRingtoneId;

    useEffect(() => subscribeRingPreferences(setPrefs), []);
    // Démontage : jamais un aperçu qui continue à jouer derrière un panneau fermé.
    useEffect(() => stopPreview, []);

    const refresh = useCallback(async () => {
        if (!userId) return;
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
            setStatus(await getPushDeviceStatus(userId)); // état relu, jamais supposé
        } finally {
            setBusy(null);
        }
    }, [userId]);

    const toggle = (key: keyof RingPreferences) => {
        setPrefs(setRingPreferences({ [key]: !prefs[key] }));
    };

    const test = async () => {
        setTesting(true);
        try {
            await previewRingtone(effectiveRingtoneId);
        } finally {
            setTesting(false);
        }
    };

    const stateInfo = status ? STATE_LABEL[status.state] : null;
    const canActivate = status ? status.state === 'default' || status.state === 'granted_not_registered' : false;

    return (
        <div
            id="mooc-chat-ringing-panel"
            data-testid="ringing-panel"
            role="region"
            aria-label="Sonnerie"
            className="mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2.5 text-xs"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BellRing size={14} className="text-indigo-600" aria-hidden="true" /> Sonnerie
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le panneau Sonnerie"
                    className="p-2 -m-2 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                    <X size={14} />
                </button>
            </div>

            <SwitchRow
                label="Sonnerie"
                hint={prefs.ringtoneEnabled ? `${ringtoneName} · se change dans les Paramètres` : 'Coupée : l’appel s’affiche sans son'}
                checked={prefs.ringtoneEnabled}
                testId="ringing-toggle-ringtone"
                onToggle={() => toggle('ringtoneEnabled')}
            />
            <SwitchRow
                label="Vibration"
                hint={
                    !vibrationAvailable
                        ? 'Non disponible sur cet appareil'
                        : prefs.vibrationEnabled
                            ? 'À chaque appel entrant'
                            : 'Coupée'
                }
                checked={vibrationAvailable && prefs.vibrationEnabled}
                disabled={!vibrationAvailable}
                testId="ringing-toggle-vibration"
                onToggle={() => toggle('vibrationEnabled')}
            />
            {!prefs.ringtoneEnabled && (
                <p className="text-[11px] text-slate-500 leading-snug">
                    Appli fermée : la notification d’appel reste affichée, mais silencieuse (sans vibration non plus, limite du navigateur).
                </p>
            )}

            {userId && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Smartphone size={13} aria-hidden="true" /> Hors application
                        </span>
                        {stateInfo && (
                            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${stateInfo.tone}`}>
                                {stateInfo.label}
                            </span>
                        )}
                    </div>
                    {busy === 'checking' && !status && (
                        <p className="text-slate-500 flex items-center gap-1.5">
                            <Loader2 size={12} className="animate-spin" aria-hidden="true" /> Vérification de cet appareil…
                        </p>
                    )}
                    {status && <p className="text-slate-600 leading-snug">{describePushDeviceState(status.state)}</p>}
                    {status?.error && <p className="text-red-700 leading-snug break-words">Vérification impossible : {status.error}</p>}
                    {actionError && <p className="text-red-700 leading-snug break-words">{actionError}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                        {canActivate && (
                            <button
                                type="button"
                                onClick={activate}
                                disabled={busy !== null}
                                className="min-h-[40px] px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                            >
                                {busy === 'activating' ? 'Activation…' : 'Activer sur cet appareil'}
                            </button>
                        )}
                        {status && (
                            <button
                                type="button"
                                onClick={refresh}
                                disabled={busy !== null}
                                className="min-h-[40px] px-2.5 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                            >
                                <RefreshCw size={12} className={busy === 'checking' ? 'animate-spin' : ''} aria-hidden="true" /> Revérifier
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={test}
                    disabled={testing}
                    className="min-h-[40px] px-3 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                    <Play size={12} aria-hidden="true" /> {testing ? 'Sonnerie en cours…' : 'Tester la sonnerie'}
                </button>
                <span className="text-[10px] text-slate-400">Réglages de cet appareil</span>
            </div>
        </div>
    );
};
