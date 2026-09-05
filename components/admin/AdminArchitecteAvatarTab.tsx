import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { adminConfigService } from '../../services/adminConfigService';
import { mergeArchitecteAvatarConfig, type ArchitecteAvatarConfig } from '../../services/architecte/architecteAvatar';
import { AdminArchitecteAvatarCard } from './AdminArchitecteAvatarCard';

/**
 * ONGLET SUPER-ADMIN « AVATAR DE L'ARCHITECTE » (Direction, 05/09/2026).
 *
 * Avant : la carte vivait en sixième position de l'onglet « Paramètres
 * Plateforme », derrière un bouton « Enregistrer » global — la Direction ne
 * l'a pas trouvée, et un avatar validé sans ce bouton était perdu en quittant
 * l'onglet. Maintenant : un onglet à part entière, à un clic depuis le
 * tableau de bord, et CHAQUE validation ou retour arrière est enregistré
 * immédiatement dans les réglages de la plateforme (même chemin que le bouton
 * global : `adminConfigService.updateDetailedSettings`).
 */
export interface AdminArchitecteAvatarTabProps {
    architecteAvatar: ArchitecteAvatarConfig;
    adminName?: string;
    onReload: () => void;
}

function heureCourte(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const AdminArchitecteAvatarTab: React.FC<AdminArchitecteAvatarTabProps> = ({
    architecteAvatar,
    adminName = 'Admin-Général',
    onReload,
}) => {
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const sectionRef = useRef<HTMLElement | null>(null);
    const config = useMemo(() => mergeArchitecteAvatarConfig(architecteAvatar), [architecteAvatar]);

    // Téléphone et tablette : l'en-tête du tableau de bord occupe presque tout
    // l'écran ; à l'ouverture de l'onglet, l'option est amenée en vue une fois.
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        if (!window.matchMedia('(max-width: 1023px)').matches) return;
        sectionRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    }, []);

    const handleChange = useCallback(
        (next: ArchitecteAvatarConfig) => {
            adminConfigService.updateDetailedSettings({ architecteAvatar: next });
            setSavedAt(new Date().toISOString());
            onReload();
        },
        [onReload],
    );

    return (
        <section ref={sectionRef} data-testid="admin-architecte-avatar-tab" className="space-y-4 scroll-mt-3">
            <header className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                    <span className="p-2.5 bg-cyan-50 text-cyan-700 rounded-2xl shrink-0">
                        <Sparkles size={22} />
                    </span>
                    <div>
                        <h2 className="text-base font-black text-slate-900">Avatar de l’Architecte</h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                            Gérez ici le visage vivant de l’Architecte de Vision Smart : créez ou remplacez l’avatar depuis
                            une photo, vérifiez l’aperçu vivant, validez, et revenez à l’avatar précédent à tout moment.
                            L’Architecte reste un assistant : il ne recouvre jamais MokNet.
                        </p>
                    </div>
                </div>
                <div
                    role="status"
                    aria-live="polite"
                    data-testid="admin-architecte-avatar-enregistrement"
                    className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold ${
                        savedAt
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                >
                    {savedAt ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
                    {savedAt
                        ? `Enregistré dans les réglages de la plateforme à ${heureCourte(savedAt)}`
                        : 'Chaque validation est enregistrée immédiatement — aucun autre bouton à cliquer.'}
                </div>
            </header>

            <AdminArchitecteAvatarCard value={config} adminName={adminName} onChange={handleChange} />
        </section>
    );
};
