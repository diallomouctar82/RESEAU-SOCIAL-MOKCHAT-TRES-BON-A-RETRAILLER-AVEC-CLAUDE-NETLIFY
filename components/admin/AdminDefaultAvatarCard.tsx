import React, { useState } from 'react';
import { Check, ImageOff, ShieldCheck, UserCircle2 } from 'lucide-react';
import { InitialsAvatar } from '../ui/InitialsAvatar';
import {
    validateDefaultAvatarUrl,
    resolveNewAccountAvatarUrl,
    type DefaultAvatarPolicy,
} from '../../services/studio/avatarStudio';

/**
 * AVATAR PAR DÉFAUT DE LA PLATEFORME — carte de la console Admin-Général.
 *
 * L'Admin-Général définit ici la photo appliquée à TOUT nouveau compte. Deux
 * garde-fous tenus par le service (pas par cet écran) :
 *  - le cliché de banque d'images hérité est refusé, l'application le traitant
 *    déjà comme « avatar absent » ;
 *  - une adresse ni `https://` ni interne est refusée.
 *
 * L'aperçu montre EXACTEMENT ce que verra un nouveau compte, initiales
 * comprises quand aucun avatar n'est imposé — pas une vignette décorative.
 */

export interface AdminDefaultAvatarCardProps {
    value: DefaultAvatarPolicy;
    /** Nom de l'administrateur, tracé dans `updatedBy`. */
    adminName: string;
    onChange: (next: DefaultAvatarPolicy) => void;
}

export const AdminDefaultAvatarCard: React.FC<AdminDefaultAvatarCardProps> = ({
    value,
    adminName,
    onChange,
}) => {
    const [url, setUrl] = useState(value.photoUrl);
    const [label, setLabel] = useState(value.label);
    const [error, setError] = useState<string | null>(null);
    const [applied, setApplied] = useState(false);

    const previewUrl = resolveNewAccountAvatarUrl({ ...value, photoUrl: url });

    const apply = () => {
        const trimmed = url.trim();
        setApplied(false);

        // Vider le champ est un choix légitime : « aucun avatar imposé ».
        if (!trimmed) {
            setError(null);
            onChange({
                photoUrl: '',
                label: label.trim() || 'Aucun avatar imposé (initiales du membre)',
                updatedAt: new Date().toISOString(),
                updatedBy: adminName,
            });
            setApplied(true);
            return;
        }

        const rejection = validateDefaultAvatarUrl(trimmed);
        if (rejection) {
            setError(rejection.message);
            return;
        }
        setError(null);
        onChange({
            photoUrl: trimmed,
            label: label.trim() || 'Avatar par défaut de la plateforme',
            updatedAt: new Date().toISOString(),
            updatedBy: adminName,
        });
        setApplied(true);
    };

    return (
        <section
            aria-labelledby="admin-default-avatar-title"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-1">
                <UserCircle2 className="text-indigo-600" size={20} />
                <h3 id="admin-default-avatar-title" className="text-base font-bold text-slate-900">
                    Avatar par défaut des nouveaux comptes
                </h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
                Appliqué à chaque compte créé. Les membres Pro peuvent le remplacer par leur propre photo
                depuis le Studio Avatar ; les autres comptes le conservent.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
                {/* Aperçu réel : exactement ce que verra un nouveau compte. */}
                <div className="flex flex-col items-center gap-2">
                    <InitialsAvatar
                        name="Nouveau Membre"
                        avatarUrl={previewUrl}
                        size={88}
                        className="ring-4 ring-slate-100"
                    />
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        {previewUrl ? 'Aperçu' : 'Initiales'}
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="default-avatar-url"
                            className="block text-xs font-bold text-slate-700 mb-1.5"
                        >
                            Adresse de la photo
                        </label>
                        <input
                            id="default-avatar-url"
                            type="text"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError(null);
                                setApplied(false);
                            }}
                            placeholder="https://… ou /icons/avatar-plateforme.png"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Laissez vide pour n’imposer aucun avatar : les nouveaux comptes afficheront leurs initiales.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="default-avatar-label"
                            className="block text-xs font-bold text-slate-700 mb-1.5"
                        >
                            Libellé interne
                        </label>
                        <input
                            id="default-avatar-label"
                            type="text"
                            value={label}
                            onChange={(e) => {
                                setLabel(e.target.value);
                                setApplied(false);
                            }}
                            placeholder="Avatar institutionnel MokNet 2026"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5"
                        >
                            <ImageOff size={15} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={apply}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                        >
                            <ShieldCheck size={14} />
                            Définir l’avatar par défaut
                        </button>
                        {applied && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <Check size={15} /> Avatar par défaut mis à jour
                            </span>
                        )}
                    </div>

                    {value.updatedAt && (
                        <p className="text-[11px] text-slate-400">
                            Dernière modification : {new Date(value.updatedAt).toLocaleString('fr-FR')}
                            {value.updatedBy ? ` — ${value.updatedBy}` : ''}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};
