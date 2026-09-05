import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitecteFloatingBar } from '../../components/architecte/ArchitecteFloatingBar';
import type { UserProfile } from '../../types';
import { addSessionTurn } from '../../services/architecte/architecteSession';

/**
 * BANC DE PREUVE — la sculpture vivante de l'Architecte dans une page qui
 * ressemble à l'application (fil de contenu, dock de navigation sur téléphone),
 * sans compte ni réseau : le profil est celui d'un banc, les capacités qui
 * touchent la base ne sont pas enregistrées (identifiant vide). Ce qui est
 * montré est le composant réel, à sa vraie place, à sa vraie taille — et ce
 * qui doit rester visible autour : le contenu et la navigation de MokNet.
 */
const profil = {
    id: '',
    name: 'Banc de preuve',
    privacySettings: { architecte: { displayName: 'Mamadou' } },
} as unknown as UserProfile;

const CARTES = [
    ['Réseau MOC', 'Trois nouvelles publications dans votre fil — Diallo, Aminata et le Campus.'],
    ['Messagerie', 'Deux conversations non lues. Appel vidéo possible depuis chaque fil.'],
    ['Campus', 'Cours du jour : « Comptabilité des créances », 14 h 30.'],
    ['Carrière', 'Une offre correspond à votre profil : chargé de projet, Conakry.'],
    ['Studio', 'Votre avatar personnel est prêt à être généré.'],
    ['Santé Globale', 'Tableau de bord : 95 % de santé mesurée, 0 rouge.'],
];

function Banc() {
    return (
        <>
            <main className="mx-auto max-w-3xl px-4 pt-5 pb-28 md:pb-10">
                <h1 className="text-lg font-bold">MokNet — page d'application (banc)</h1>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                    Le fond et toutes les fonctions restent visibles : l'avatar flotte en bas à droite, sobre ; au clic il
                    n'ouvre qu'une petite barre à côté de lui, jamais un écran qui cache l'application.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {CARTES.map(([titre, texte]) => (
                        <article key={titre} data-testid="banc-carte" className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-cyan-300/80">{titre}</h2>
                            <p className="mt-1 text-[13px] text-slate-200">{texte}</p>
                            <button type="button" className="mt-3 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold text-cyan-200">
                                Ouvrir
                            </button>
                        </article>
                    ))}
                </div>
            </main>
            {/* Dock de navigation de MokNet (téléphone) : il doit rester entièrement cliquable. */}
            <nav
                data-testid="banc-dock"
                aria-label="Navigation (banc)"
                className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t border-cyan-500/20 bg-[#0f172a]/95 md:hidden"
            >
                {['Accueil', 'Réseau', 'Architecte', 'Messages', 'Profil'].map((n) => (
                    <button key={n} type="button" data-testid="banc-dock-bouton" className="rounded-full px-3 py-1.5 text-[11px] font-bold text-cyan-200">
                        {n}
                    </button>
                ))}
            </nav>
            <ArchitecteFloatingBar userProfile={profil} onNavigate={() => {}} onUpdateProfile={async () => true} openSignal={0} />
        </>
    );
}

// Crochet de PREUVE (banc seulement) : injecter un tour de l'Architecte sans
// modèle ni réseau — pour démontrer qu'une réponse longue n'ouvre JAMAIS le
// panneau toute seule (zéro obstruction strict, Direction 05/09/2026).
(window as unknown as { __bancArchitecte?: unknown }).__bancArchitecte = { addSessionTurn };

createRoot(document.getElementById('root')!).render(<Banc />);
