
import React from 'react';
import { UserProfile } from '../types';
import {
  TrendingUp,
  Wallet,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Shield,
  Globe,
  FolderKanban,
  Layers
} from 'lucide-react';
import { DEFAULT_DOSSIERS } from '../constants';
import { useGoal } from '../contexts/GoalContext';
import { EditorialHero } from './ui/EditorialHero';
import { PointAToBPathway } from './ui/PointAToBPathway';
import { StatusBadge } from './ui/StatusBadge';
import { QuickActionZone } from './ui/QuickActionZone';

interface DashboardProps {
    userProfile: UserProfile;
    onNavigate: (tab: string, context?: any) => void;
    onOpenCapModal?: () => void;
    onOpenSearch?: () => void;
}

// Active une carte cliquable au clavier (Entrée / Espace) en plus du clic souris.
const handleCardKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        action();
    }
};

const CARD_FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate, onOpenCapModal, onOpenSearch }) => {
    const { currentGoal } = useGoal();

    return (
        <div className="p-4 sm:p-8 max-w-[1700px] mx-auto space-y-8 animate-fade-up bg-slate-50/60 min-h-full pb-36 font-sans">
            
            {/* 🎛️ TOP CONTROL BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Le Monde à Vous • Plateforme d'Accomplissement</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Espace Personnel & Décisionnel
                    </h2>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Réservé aux comptes admin/super-admin : pour un citoyen normal,
                        activeTab='admin' ne rend rien dans App.tsx (voir la garde de rôle
                        sur AdminDashboard) — afficher ce raccourci à tout le monde menait
                        donc à un écran vide pour la quasi-totalité des utilisateurs. */}
                    {(userProfile.role === 'admin' || (userProfile.role as string) === 'super_admin') && (
                        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
                            <button
                                onClick={() => onNavigate('admin')}
                                className={`px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-black flex items-center gap-1.5 transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-xs hover:scale-[1.02] ${CARD_FOCUS_RING}`}
                                title="Ouvrir le Tableau de Bord Super-Admin & Connecteurs IA Souverains"
                            >
                                <Shield size={14} className="fill-slate-950/20" /> Super-Admin & IA
                            </button>
                        </div>
                    )}

                    <QuickActionZone
                        onActionClick={onNavigate}
                        onOpenDialloOS={() => onNavigate('chat')}
                        onOpenSearch={onOpenSearch}
                        className="hidden md:flex"
                    />
                </div>
            </div>

            {/* ==================================================================================
                                            VUE PERSONNELLE ÉDITORIALE
               ================================================================================== */}
            <div className="space-y-8 animate-fade-up">
                {/* 1. HERO EDITORIAL PERSONNEL */}
                <EditorialHero 
                    userProfile={userProfile}
                    activeGoalTitle={currentGoal?.title || "Choisissez votre premier objectif"}
                    activeGoalCategory={currentGoal?.category || "Bienvenue sur Le Monde à Vous"}
                    nextBestAction={{
                        title: "Finaliser la simulation d'entretien 3D avec Coach Diallo",
                        description: "Votre CV Maître a été adapté à 94% à l'offre Tech Lead. Passez à l'oral pour consolider votre argumentaire salarial.",
                        targetTab: "career",
                        actionLabel: "Lancer la Simulation d'Entretien"
                    }}
                    lastActivity={{
                        label: "Module Carrière — Décodeur d'offres",
                        tab: "career",
                        timeAgo: "Il y a 2h"
                    }}
                    onNavigate={onNavigate}
                    onOpenCapModal={onOpenCapModal}
                />

                {/* 2. SIGNATURE VISUELLE : TRAJECTOIRE POINT A ➔ POINT B */}
                <PointAToBPathway 
                    origin={{
                        label: "Point A : Diagnostic Initial",
                        description: "Profil validé, 8 compétences clés identifiées.",
                    }}
                    destination={{
                        label: "Point B : Poste Validé & Installation",
                        impact: "Accomplissement professionnel avec contrat cadre et accompagnement installation complet.",
                    }}
                    currentStepIndex={1}
                    steps={[
                        {
                            id: 's1',
                            title: 'Diagnostic 360° & Trajectoire',
                            subtitle: 'Bilan de compétences et alignement stratégique.',
                            status: 'completed'
                        },
                        {
                            id: 's2',
                            title: 'CV Maître & Dossier Talents',
                            subtitle: 'Alignement aux standards recruteurs et marché caché.',
                            status: 'in_progress',
                            expertNote: 'Conseiller Diallo a optimisé 4 points d’impact majeurs.'
                        },
                        {
                            id: 's3',
                            title: 'Simulations & Négociation',
                            subtitle: 'Entraînement 3D et négociation salariale certifiée.',
                            status: 'upcoming'
                        },
                        {
                            id: 's4',
                            title: 'Signature & Installation',
                            subtitle: 'Validation juridique du contrat et visa d’installation.',
                            status: 'upcoming'
                        }
                    ]}
                    onStepClick={(idx) => onNavigate('career')}
                />
                {/* Nettoyage accueil (DEC-2026-051) : la carte « Conseiller
                    Référent · Conseiller Diallo » (prop `leadAdvisor`) n’est
                    plus affichée ici — elle doublonnait la Famille Diallo
                    déjà joignable par « Équipe & Experts » et l’Architecte.
                    Le composant PointAToBPathway garde la prop (vitrine du
                    Design System). */}

                {/* 3. GRILLE COMPLÉMENTAIRE : DOSSIERS VIVANTS & COMPTES */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Dossiers Vivants Actifs (8 cols) */}
                    <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2.5">
                                    <FolderKanban className="text-orange-600" size={22} />
                                    <span>Mes Dossiers Transversaux Vivants</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Accompagnement étape par étape avec la Famille Diallo</p>
                            </div>
                            <button 
                                onClick={() => onNavigate('parcours')}
                                className="text-xs font-bold text-slate-900 hover:text-orange-600 flex items-center gap-1 transition-colors"
                            >
                                <span>Voir tous les dossiers</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {DEFAULT_DOSSIERS.slice(0, 3).map((dossier, i) => (
                                <div
                                    key={dossier.id}
                                    onClick={() => onNavigate('chat')}
                                    onKeyDown={(e) => handleCardKeyDown(e, () => onNavigate('chat'))}
                                    role="button"
                                    tabIndex={0}
                                    className={`p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/20 transition-all cursor-pointer group flex flex-col justify-between ${CARD_FOCUS_RING}`}
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-2.5">
                                            <StatusBadge status={dossier.progress > 70 ? 'success' : 'in_progress'} label={dossier.category} size="sm" />
                                            <span className="text-xs font-black text-slate-900">{dossier.progress}%</span>
                                        </div>
                                        <h4 className="font-bold text-xs text-slate-900 mb-1.5 group-hover:text-orange-700 transition-colors line-clamp-1">
                                            {dossier.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                            {dossier.nextAction}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${dossier.progress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Portefeuille & Progression XP (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Wallet Card */}
                        <div
                            onClick={() => onNavigate('wallet')}
                            onKeyDown={(e) => handleCardKeyDown(e, () => onNavigate('wallet'))}
                            role="button"
                            tabIndex={0}
                            className={`bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-all group ${CARD_FOCUS_RING}`}
                        >
                            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-600/20 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-orange-400">
                                    <Wallet size={20} />
                                </div>
                                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/50 flex items-center gap-1">
                                    <TrendingUp size={12} /> +12% cette semaine
                                </span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">Solde de Crédits LMAV</div>
                            <div className="text-3xl font-black text-white tracking-tight my-1">
                                {userProfile.credits.toLocaleString()} Ⓒ
                            </div>
                            <div className="text-xs text-slate-300 flex items-center justify-between pt-3 border-t border-slate-800">
                                <span>Paiements sécurisés & séquestre</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-orange-400" />
                            </div>
                        </div>

                        {/* Progression & Rang */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut Accompli</span>
                                <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full">
                                    Niveau {userProfile.level}
                                </span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 mb-2">
                                {userProfile.xp.toLocaleString()} XP
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                                <div className="bg-orange-600 h-full w-3/4 rounded-full" />
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                                <span>Rang actuel : Bâtisseur</span>
                                <span>Objectif : Expert Mondial</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. HUB DES PILIERS CLÉS & SERVICES TRANSVERSAUX */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                            <Layers size={18} className="text-slate-600" />
                            <span>Capacités & Espaces Recommandés</span>
                        </h3>
                        <span className="text-xs text-slate-400">Services transversaux intégrés</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                            onClick={() => onNavigate('career')}
                            onKeyDown={(e) => handleCardKeyDown(e, () => onNavigate('career'))}
                            role="button"
                            tabIndex={0}
                            className={`bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${CARD_FOCUS_RING}`}
                        >
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Carrière Pro</h4>
                                    <p className="text-[11px] text-slate-500">Marché caché & CV</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                                Décodeur d'offres en temps réel et simulation d'entretiens.
                            </p>
                            <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Accéder à Carrière</span> <ArrowRight size={12} />
                            </div>
                        </div>

                        <div
                            onClick={() => onNavigate('campus')}
                            onKeyDown={(e) => handleCardKeyDown(e, () => onNavigate('campus'))}
                            role="button"
                            tabIndex={0}
                            className={`bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${CARD_FOCUS_RING}`}
                        >
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Campus & Cours</h4>
                                    <p className="text-[11px] text-slate-500">Certifications d'élite</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                                Programmes officiels et coaching individuel par Professeur Diallo.
                            </p>
                            <div className="text-[11px] font-bold text-purple-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Ouvrir Campus</span> <ArrowRight size={12} />
                            </div>
                        </div>

                        <div
                            onClick={() => onNavigate('shop')}
                            onKeyDown={(e) => handleCardKeyDown(e, () => onNavigate('shop'))}
                            role="button"
                            tabIndex={0}
                            className={`bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${CARD_FOCUS_RING}`}
                        >
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Marché B2B</h4>
                                    <p className="text-[11px] text-slate-500">Sourcing & RFQ</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                                Fournisseurs mondiaux certifiés, calcul Incoterms et séquestre.
                            </p>
                            <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Explorer le Marché</span> <ArrowRight size={12} />
                            </div>
                        </div>

                        <div
                            onClick={() => onNavigate('council')}
                            onKeyDown={(e) => handleCardKeyDown(e, () => onNavigate('council'))}
                            role="button"
                            tabIndex={0}
                            className={`bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${CARD_FOCUS_RING}`}
                        >
                            <div className="flex items-center gap-3.5 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Conseil des Sages</h4>
                                    <p className="text-[11px] text-slate-500">Arbitrage Collégial</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                                Réunion multi-experts Diallo pour délibérer sur vos enjeux clés.
                            </p>
                            <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Consulter le Conseil</span> <ArrowRight size={12} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
