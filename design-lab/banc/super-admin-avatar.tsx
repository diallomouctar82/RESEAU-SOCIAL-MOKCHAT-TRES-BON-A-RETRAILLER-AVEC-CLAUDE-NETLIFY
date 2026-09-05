import React, { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminArchitecteAvatarCard } from '../../components/admin/AdminArchitecteAvatarCard';
import { ArchitecteFloatingBar } from '../../components/architecte/ArchitecteFloatingBar';
import { adminConfigService } from '../../services/adminConfigService';
import { mergeArchitecteAvatarConfig, type ArchitecteAvatarConfig } from '../../services/architecte/architecteAvatar';
import type { UserProfile } from '../../types';

/**
 * BANC DE PREUVE — l'option Super-Admin « Créer ou remplacer l'avatar vivant
 * depuis une photo » (Direction, 05/09/2026), avec en dessous l'application
 * (banc) et sa barre flottante RÉELLE, remontée après chaque enregistrement
 * comme le ferait un rechargement des réglages. Aucun compte ni réseau ; le
 * moteur MediaPipe est le vrai (modèles servis par l'application).
 */
const profil = {
    id: '',
    name: 'Banc de preuve',
    privacySettings: { architecte: { callName: 'Direction' } },
} as unknown as UserProfile;

const CARTES = [
    ['Réseau MOC', 'Trois nouvelles publications dans votre fil.'],
    ['Messagerie', 'Deux conversations non lues.'],
    ['Campus', 'Cours du jour : « Comptabilité des créances », 14 h 30.'],
    ['Carrière', 'Une offre correspond à votre profil.'],
];

function lireConfig(): ArchitecteAvatarConfig {
    return mergeArchitecteAvatarConfig(adminConfigService.getDetailedSettings().architecteAvatar);
}

function Banc() {
    const [config, setConfig] = useState<ArchitecteAvatarConfig>(() => lireConfig());
    const [version, setVersion] = useState(0);
    const onChange = useCallback((next: ArchitecteAvatarConfig) => {
        adminConfigService.updateDetailedSettings({ ...adminConfigService.getDetailedSettings(), architecteAvatar: next });
        setConfig(next);
        setVersion((v) => v + 1);
    }, []);
    (window as unknown as { __bancAvatar?: unknown }).__bancAvatar = { getConfig: () => config, version };
    return (
        <>
            <section className="bg-slate-100 text-slate-900 px-4 py-5">
                <h1 className="text-base font-bold mb-3">Super-Admin — Paramètres plateforme (banc)</h1>
                <AdminArchitecteAvatarCard value={config} adminName="Admin-Général" onChange={onChange} />
            </section>
            <section id="application" className="min-h-[100vh] px-4 pt-5 pb-28">
                <h2 className="text-lg font-bold">MokNet — l’application (banc), réglages version {version}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {CARTES.map(([titre, texte]) => (
                        <article key={titre} data-testid="banc-carte" className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-cyan-300/80">{titre}</h3>
                            <p className="mt-1 text-[13px] text-slate-200">{texte}</p>
                        </article>
                    ))}
                </div>
                <ArchitecteFloatingBar key={version} userProfile={profil} onNavigate={() => {}} onUpdateProfile={async () => true} openSignal={0} />
            </section>
        </>
    );
}

createRoot(document.getElementById('root')!).render(<Banc />);
