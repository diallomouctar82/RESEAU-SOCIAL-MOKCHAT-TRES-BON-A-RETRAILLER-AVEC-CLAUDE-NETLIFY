
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { PlayCircle, TrendingUp, ShieldAlert, FileText, Wallet, ArrowRight, BrainCircuit, Sun, CloudRain, Briefcase, GraduationCap, Plane, Clock, Sparkles, Zap, Users, Shield, HardDrive, Globe, CreditCard, Activity, RefreshCw, Database, Wifi, Search, Server } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { COURSES, LEGAL_PROCEDURES, JOBS } from '../constants';
import { cloudService } from '../services/cloud';

// Données Mock Admin intégrées localement pour la fusion
const MOCK_USERS_DB = [
    { id: 'u1', name: 'Alexandre Dupont', email: 'alex.d@example.com', role: 'Citoyen', status: 'active', country: 'France', joinDate: '12/01/2025', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
    { id: 'u2', name: 'Sarah Koné', email: 'sarah.k@example.com', role: 'Premium', status: 'active', country: 'Sénégal', joinDate: '10/02/2025', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: 'u3', name: 'Jean Martin', email: 'j.martin@test.com', role: 'Citoyen', status: 'suspended', country: 'Belgique', joinDate: '05/03/2025', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
    { id: 'u4', name: 'Aïcha Benali', email: 'aicha.b@maroc.ma', role: 'Ambassadeur', status: 'active', country: 'Maroc', joinDate: '15/01/2025', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop' },
];

interface DashboardProps {
    userProfile: UserProfile;
    onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, onNavigate }) => {
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
        <div className="p-6 max-w-[1800px] mx-auto space-y-6 animate-fade-up bg-slate-50 min-h-full pb-32">
            
            {/* 🎛️ SUPER HEADER (Toggle Mode) */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {viewMode === 'personal' ? 'Tableau de Bord' : 'Console Système'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {viewMode === 'personal' ? `Bienvenue, ${userProfile.name.split(' ')[0]}.` : 'Superviseur : Accès Root Actif.'}
                    </p>
                </div>

                {userProfile.role === 'admin' && (
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center">
                        <button 
                            onClick={() => setViewMode('personal')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'personal' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users size={16} /> Espace Citoyen
                        </button>
                        <button 
                            onClick={() => setViewMode('system')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'system' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Shield size={16} /> Mode Admin
                        </button>
                    </div>
                )}
            </div>

            {/* ==================================================================================
                                            VUE PERSONNELLE
               ================================================================================== */}
            {viewMode === 'personal' && (
                <div className="space-y-6 animate-fade-up">
                    {/* HUD Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[300px]">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600 rounded-full blur-[150px] opacity-20 animate-pulse-soft"></div>
                            <div className="relative z-10 max-w-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                                        <BrainCircuit className="text-brand-400" />
                                    </div>
                                    <span className="text-sm font-bold tracking-widest text-brand-200 uppercase">Briefing Quotidien</span>
                                </div>
                                <h2 className="text-5xl font-bold mb-6 leading-tight">
                                    Vos objectifs <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-white">sont à portée de main.</span>
                                </h2>
                                <p className="text-xl text-slate-300 font-light mb-8">
                                    "Votre dossier de visa a avancé de 20%. N'oubliez pas votre cours d'Anglais à 14h."
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button onClick={() => onNavigate('campus')} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors flex items-center gap-2">
                                        <PlayCircle size={20} /> Reprendre le Cours
                                    </button>
                                    <button onClick={() => onNavigate('council')} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 border border-white/10 shadow-lg shadow-indigo-500/30">
                                        <Users size={20} /> Réunir le Conseil
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 h-full">
                            {/* Wallet Widget */}
                            <div onClick={() => onNavigate('wallet')} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl cursor-pointer hover:scale-[1.02] transition-transform">
                                <Wallet className="absolute top-6 right-6 opacity-20" size={48} />
                                <div className="text-sm font-medium text-indigo-200 mb-1">Solde Actuel</div>
                                <div className="text-4xl font-bold mb-8">{userProfile.credits} Ⓒ</div>
                                <div className="flex items-center gap-2 text-sm bg-black/20 w-fit px-3 py-1 rounded-lg">
                                    <TrendingUp size={14} className="text-green-400" /> +12% cette semaine
                                </div>
                            </div>

                            {/* Quick Stat */}
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-green-50 rounded-2xl text-green-600"><Sparkles size={24} /></div>
                                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Niv. {userProfile.level}</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900 mb-1">{userProfile.xp} XP</div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full w-3/4"></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Prochain rang: Expert</p>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"><Briefcase /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Carrière</h3>
                                    <p className="text-xs text-slate-500">3 nouvelles offres</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><ShieldAlert /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Alertes</h3>
                                    <p className="text-xs text-slate-500">Visa expire dans 30j</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform"><Zap /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Quêtes</h3>
                                    <p className="text-xs text-slate-500">2/3 complétées</p>
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
                    <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
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
                            <BrainCircuit size={16} /> IA & API
                        </button>
                    </div>

                    {/* CLOUD TAB */}
                    {activeAdminTab === 'cloud' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Storage Visualization */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
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
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000"
                                                style={{ width: `${Math.max(1, storageStats.percent)}%` }}
                                            ></div>
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
                            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-[100px] opacity-10"></div>
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Wifi size={20} /> Connectivité</h2>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                        <span className="font-bold text-sm">Statut Réseau</span>
                                        <span className={`text-xs font-mono font-bold ${navigator.onLine ? 'text-green-400' : 'text-red-400'}`}>
                                            {navigator.onLine ? 'ONLINE' : 'OFFLINE'}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Topologie (Simulée)</p>
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
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.col}-600`}>
                                    <stat.icon size={60} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-${stat.col}-50 text-${stat.col}-600`}>
                                    <stat.icon size={24} />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {stat.change}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-800">{stat.val}</h3>
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
                                    <Search className="absolute left-3 top-1/2 -translate-x-1/2 text-slate-400" size={16} />
                                    <input 
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Rechercher un utilisateur..." 
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <button className="text-sm font-bold text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg">Exporter CSV</button>
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
                                                <img src={u.avatar} className="w-8 h-8 rounded-full bg-slate-200" />
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
                                                <button className="text-slate-400 hover:text-brand-600 font-bold">Gérer</button>
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
