
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  PlayCircle, 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  Wallet, 
  ArrowRight, 
  BrainCircuit, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  Users, 
  Shield, 
  HardDrive, 
  Globe, 
  CreditCard, 
  Activity, 
  RefreshCw, 
  Database, 
  Wifi, 
  Search, 
  FolderKanban, 
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Clock
} from 'lucide-react';
import { DEFAULT_DOSSIERS } from '../constants';
import { cloudService } from '../services/cloud';
import { EditorialHero } from './ui/EditorialHero';
import { PointAToBPathway } from './ui/PointAToBPathway';
import { StatusBadge } from './ui/StatusBadge';
import { QuickActionZone } from './ui/QuickActionZone';

// Données Mock Admin intégrées localement pour la fusion
const MOCK_USERS_DB = [
    { id: 'u1', name: 'Alexandre Dupont', email: 'alex.d@example.com', role: 'Citoyen', status: 'active', country: 'France', joinDate: '12/01/2025', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
    { id: 'u2', name: 'Sarah Koné', email: 'sarah.k@example.com', role: 'Premium', status: 'active', country: 'Sénégal', joinDate: '10/02/2025', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: 'u3', name: 'Jean Martin', email: 'j.martin@test.com', role: 'Citoyen', status: 'suspended', country: 'Belgique', joinDate: '05/03/2025', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
    { id: 'u4', name: 'Aïcha Benali', email: 'aicha.b@maroc.ma', role: 'Ambassadeur', status: 'active', country: 'Maroc', joinDate: '15/01/2025', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop' },
];

interface DashboardProps {
    userProfile: UserProfile;
    onNavigate: (tab: string, context?: any) => void;
    onOpenCapModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate, onOpenCapModal }) => {
    // STATE: DASHBOARD MODE (Personal vs System)
    const [viewMode, setViewMode] = useState<'personal' | 'system'>('personal');

    // STATE: ADMIN
    const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'ai-config' | 'users' | 'cloud'>('cloud');
    const [storageStats, setStorageStats] = useState<{used: number, quota: number, percent: number} | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        if (viewMode === 'system') {
            loadStorageStats();
        }
    }, [viewMode]);

    const loadStorageStats = async () => {
        setIsRefreshing(true);
        const stats = await cloudService.getStorageUsage();
        setStorageStats(stats);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const filteredUsers = MOCK_USERS_DB.filter(user => 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.country.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-8 max-w-[1700px] mx-auto space-y-8 animate-fade-up bg-slate-50/60 min-h-full pb-36 font-sans">
            
            {/* 🎛️ TOP CONTROL BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Le Monde à Vous • Plateforme d'Accomplissement</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {viewMode === 'personal' ? 'Espace Personnel & Décisionnel' : 'Console Système & Supervision'}
                    </h2>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
                        <button 
                            onClick={() => setViewMode('personal')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'personal' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users size={14} /> Citoyen
                        </button>
                        <button 
                            onClick={() => setViewMode('system')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${viewMode === 'system' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Activity size={14} /> Métriques
                        </button>
                        <button 
                            onClick={() => onNavigate('admin')}
                            className="px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-xs hover:scale-[1.02]"
                            title="Ouvrir le Tableau de Bord Super-Admin & Connecteurs IA Souverains"
                        >
                            <Shield size={14} className="fill-slate-950/20" /> Super-Admin & IA
                        </button>
                    </div>

                    <QuickActionZone 
                        onActionClick={onNavigate} 
                        onOpenDialloOS={() => onNavigate('chat')} 
                        className="hidden md:flex"
                    />
                </div>
            </div>

            {/* ==================================================================================
                                            VUE PERSONNELLE ÉDITORIALE
               ================================================================================== */}
            {viewMode === 'personal' && (
                <div className="space-y-8 animate-fade-up">
                    {/* 1. HERO EDITORIAL PERSONNEL */}
                    <EditorialHero 
                        userProfile={userProfile}
                        activeGoalTitle="Décrocher un poste clé en Europe & Valider le Visa Talents"
                        activeGoalCategory="Carrière & Accomplissement"
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
                        leadAdvisor={{
                            name: "Conseiller Diallo",
                            role: "Stratège Carrière & Marché",
                        }}
                        onStepClick={(idx) => onNavigate('career')}
                        onOpenAdvisor={() => onNavigate('chat')}
                    />

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
                                        className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-orange-300 hover:bg-orange-50/20 transition-all cursor-pointer group flex flex-col justify-between"
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
                                className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-all group"
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
                                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
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
                                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
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
                                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
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
                                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
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
            )}

            {/* ==================================================================================
                                            VUE SYSTEM (ADMIN)
               ================================================================================== */}
            {viewMode === 'system' && (
                <div className="space-y-6 animate-fade-up">
                    
                    {/* Admin Nav */}
                    <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-xs border border-slate-200 overflow-x-auto">
                        <button 
                            onClick={() => setActiveAdminTab('cloud')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeAdminTab === 'cloud' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <HardDrive size={16} /> Cloud & Réseau
                        </button>
                        <button 
                            onClick={() => setActiveAdminTab('overview')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${activeAdminTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Activity size={16} /> Métriques
                        </button>
                        <button 
                            onClick={() => setActiveAdminTab('users')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeAdminTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Users size={16} /> Utilisateurs
                        </button>
                        <button 
                            onClick={() => setActiveAdminTab('ai-config')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeAdminTab === 'ai-config' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <BrainCircuit size={16} /> IA & Supervision
                        </button>
                    </div>

                    {/* CLOUD TAB */}
                    {activeAdminTab === 'cloud' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Storage Visualization */}
                            <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                        <Database className="text-blue-500" /> Stockage Local (IndexedDB)
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={loadStorageStats} 
                                            className={`p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                                            title="Actualiser les données"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase">Appareil</span>
                                    </div>
                                </div>
                                
                                {storageStats ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium">Données Application</p>
                                                <p className="text-3xl font-black text-slate-900">{cloudService.formatBytes(storageStats.used)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 font-medium">Quota Navigateur</p>
                                                <p className="text-xl font-bold text-slate-700">{cloudService.formatBytes(storageStats.quota)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                            <div 
                                                className="h-full bg-slate-900 transition-all duration-1000"
                                                style={{ width: `${Math.max(1, storageStats.percent)}%` }}
                                            />
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-center text-xs text-slate-500 leading-relaxed">
                                                <span className="font-bold">Architecture Local-First :</span> Vos données sont stockées sur cet appareil avant d'être synchronisées.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">Chargement...</div>
                                )}
                            </div>

                            {/* Network Status */}
                            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-[100px] opacity-10" />
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wifi size={20} /> Connectivité</h2>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                        <span className="font-bold text-sm">Statut Réseau</span>
                                        <span className={`text-xs font-mono font-bold ${navigator.onLine ? 'text-green-400' : 'text-red-400'}`}>
                                            {navigator.onLine ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Topologie</p>
                                        <div className="flex items-center justify-between p-2 border-b border-white/5">
                                            <span className="text-sm opacity-70">Nœud Europe (Paris)</span>
                                            <span className="text-xs text-slate-500">Relais</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 border-b border-white/5">
                                            <span className="text-sm opacity-70">Nœud Afrique (Dakar)</span>
                                            <span className="text-xs text-slate-500">Principal</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OVERVIEW TAB */}
                    {activeAdminTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                            { label: 'Utilisateurs Actifs', val: '14,203', icon: Users, col: 'blue', change: '+12%' },
                            { label: 'Revenu Mensuel', val: '42,390 €', icon: CreditCard, col: 'green', change: '+8.5%' },
                            { label: 'Requêtes IA / sec', val: '342', icon: BrainCircuit, col: 'purple', change: '-2%' },
                            { label: 'Pays Couverts', val: '84', icon: Globe, col: 'orange', change: '+3' },
                            ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-slate-100 text-slate-800">
                                    <stat.icon size={24} />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {stat.change}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900">{stat.val}</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">{stat.label}</p>
                            </div>
                            ))}
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeAdminTab === 'users' && (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Rechercher un utilisateur..." 
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                </div>
                                <button className="text-sm font-bold text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                    Exporter CSV
                                </button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Utilisateur</th>
                                        <th className="px-6 py-3">Rôle</th>
                                        <th className="px-6 py-3">Pays</th>
                                        <th className="px-6 py-3">Statut</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img src={u.avatar} className="w-8 h-8 rounded-full bg-slate-200" alt={u.name} />
                                                <div>
                                                    <div className="font-bold text-slate-900">{u.name}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold text-xs">{u.role}</span></td>
                                            <td className="px-6 py-4 text-slate-600">{u.country}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-slate-900 font-bold">Gérer</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
