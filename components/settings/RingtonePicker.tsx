import React, { useEffect, useRef, useState } from 'react';
import { Check, PhoneIncoming, Play, RotateCcw, Square } from 'lucide-react';
import {
    DEFAULT_RINGTONE_ID,
    getRingtones,
    previewRingtone,
    setSelectedRingtoneId,
    stopPreview,
} from '../../services/calls/ringtoneService';

/**
 * ÉQUIPE 9 (Audio & Sonneries) — sélecteur de sonnerie d'appel.
 *
 * Composant volontairement « bête » côté persistance : il affiche le
 * catalogue, joue les aperçus (un seul à la fois) et remonte la sélection
 * via `onSelect`. La sauvegarde RÉELLE du profil est faite par le parent
 * (UnifiedSettingsModal, même chemin que notificationsMuted :
 * onUpdateProfile → profiles.privacy_settings). Le picker n'affiche
 * « Enregistré » QUE si `onSelect` a répondu strictement `true` — jamais de
 * faux succès. Il tient aussi à jour le cache local (`lmav_ringtone_v1`)
 * que `startRinging()` lit quand le flux d'appel ne passe pas d'id : ce qui
 * est affiché coché ici est ce qui sonnera sur cet appareil.
 */

interface RingtonePickerProps {
    /** Id de la sonnerie actuellement choisie (profil, ou cache local). */
    selectedId: string;
    /**
     * Appelé à chaque sélection. Renvoyer `true` = persistance profil
     * réussie (affiche « Enregistré »), `false` ou une exception = échec
     * affiché, `void`/`undefined` = aucune persistance disponible (aucune
     * mention n'est alors affichée).
     */
    onSelect: (id: string) => void | boolean | Promise<void | boolean>;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export const RingtonePicker: React.FC<RingtonePickerProps> = ({ selectedId, onSelect }) => {
    const ringtones = getRingtones();
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    // Une sélection plus récente rend le résultat des précédentes obsolète.
    const saveSeq = useRef(0);

    // Le cache local suit toujours la sélection affichée : c'est lui que lit
    // startRinging() sans argument — l'écran et l'oreille restent d'accord,
    // y compris quand le profil a été changé depuis un autre appareil.
    useEffect(() => {
        setSelectedRingtoneId(selectedId);
    }, [selectedId]);

    // Démontage : jamais un aperçu qui continue à jouer derrière un modal fermé.
    useEffect(() => stopPreview, []);

    const handleSelect = async (id: string) => {
        if (id === selectedId) return;
        const seq = ++saveSeq.current;
        setSelectedRingtoneId(id); // applicable immédiatement sur cet appareil
        setSaveState('saving');
        try {
            const result = await Promise.resolve(onSelect(id));
            if (seq !== saveSeq.current) return;
            setSaveState(result === true ? 'saved' : result === false ? 'error' : 'idle');
        } catch {
            if (seq !== saveSeq.current) return;
            setSaveState('error');
        }
    };

    const togglePreview = async (id: string) => {
        if (previewingId === id) {
            stopPreview();
            setPreviewingId(null);
            return;
        }
        stopPreview();
        setPreviewingId(id);
        await previewRingtone(id); // se résout à la fin OU sur stopPreview()
        setPreviewingId((current) => (current === id ? null : current));
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
                <PhoneIncoming size={18} className="text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Sonnerie d'appel</span>
            </div>
            <p className="text-xs text-slate-500">
                Choisis la mélodie jouée quand un appel MokNet arrive. Le bouton lecture
                donne un aperçu d'une itération.
            </p>

            <div role="radiogroup" aria-label="Sonnerie d'appel" className="space-y-2 pt-1">
                {ringtones.map((ringtone) => {
                    const isSelected = ringtone.id === selectedId;
                    const isPreviewing = previewingId === ringtone.id;
                    return (
                        <div
                            key={ringtone.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                isSelected
                                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                        >
                            <button
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => handleSelect(ringtone.id)}
                                className="flex-1 min-h-[44px] flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                                    }`}
                                >
                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </span>
                                <span>
                                    <span className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                                            {ringtone.name}
                                        </span>
                                        {ringtone.id === DEFAULT_RINGTONE_ID && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                Par défaut
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">
                                        {ringtone.description}
                                    </span>
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => togglePreview(ringtone.id)}
                                aria-label={
                                    isPreviewing
                                        ? `Arrêter l'aperçu de ${ringtone.name}`
                                        : `Écouter un aperçu de ${ringtone.name}`
                                }
                                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                                    isPreviewing
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {isPreviewing ? <Square size={14} /> : <Play size={14} />}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => handleSelect(DEFAULT_RINGTONE_ID)}
                    disabled={selectedId === DEFAULT_RINGTONE_ID}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                    <RotateCcw size={14} /> Restaurer la sonnerie par défaut
                </button>

                <span aria-live="polite" className="text-[11px] font-bold">
                    {saveState === 'saving' && <span className="text-slate-500">Enregistrement…</span>}
                    {saveState === 'saved' && (
                        <span className="text-emerald-700 flex items-center gap-1">
                            <Check size={13} /> Enregistré
                        </span>
                    )}
                    {saveState === 'error' && (
                        <span className="text-red-600">
                            Échec de l'enregistrement du profil (appliquée sur cet appareil)
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
};
