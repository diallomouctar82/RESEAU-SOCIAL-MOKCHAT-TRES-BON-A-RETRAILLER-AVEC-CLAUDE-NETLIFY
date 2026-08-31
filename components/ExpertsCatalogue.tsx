import React, { useState } from 'react';
import { 
    Search, 
    Filter, 
    Sparkles, 
    MessageSquare, 
    Phone, 
    Video, 
    FolderPlus, 
    Calendar, 
    ShieldCheck, 
    Star, 
    Globe2, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    Award, 
    FileText, 
    UserCheck,
    Bot,
    User,
    Upload,
    Check
} from 'lucide-react';
import { Agent, DossierParcours } from '../types';
import { AGENTS } from '../constants';

interface ExpertsCatalogueProps {
    onSelectAgentForChat: (agent: Agent, prompt?: string) => void;
    onStartCallWithAgent: (agent: Agent) => void;
    onStartVideoWithAgent: (agent: Agent) => void;
    onCreateDossierWithAgent: (agent: Agent) => void;
    onShareDocWithAgent?: (agent: Agent) => void;
    dossiers: DossierParcours[];
}

export const ExpertsCatalogue: React.FC<ExpertsCatalogueProps> = ({
    onSelectAgentForChat,
    onStartCallWithAgent,
    onStartVideoWithAgent,
    onCreateDossierWithAgent,
    onShareDocWithAgent,
    dossiers
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'ai' | 'human'>('all');
    
    // Booking modal for human experts
    const [bookingAgent, setBookingAgent] = useState<Agent | null>(null);
    const [bookingDate, setBookingDate] = useState('2026-03-05');
    const [bookingTime, setBookingTime] = useState('14:00');
    const [bookingSubject, setBookingSubject] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Filter agents
    const filteredAgents = AGENTS.filter(agent => {
        // Type filter
        if (typeFilter === 'ai' && agent.isHuman) return false;
        if (typeFilter === 'human' && !agent.isHuman) return false;

        // Role filter
        if (selectedRoleFilter !== 'all' && agent.role !== selectedRoleFilter) return false;

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesName = agent.name.toLowerCase().includes(q);
            const matchesTitle = agent.title.toLowerCase().includes(q);
            const matchesSpecialty = agent.specialty.toLowerCase().includes(q);
            const matchesDesc = agent.description.toLowerCase().includes(q);
            const matchesSkills = agent.skills?.some(s => s.toLowerCase().includes(q));
            const matchesLang = agent.languages?.some(l => l.toLowerCase().includes(q));
            if (!matchesName && !matchesTitle && !matchesSpecialty && !matchesDesc && !matchesSkills && !matchesLang) {
                return false;
            }
        }

        return true;
    });

    const handleConfirmBooking = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingSuccess(true);
        setTimeout(() => {
            setBookingSuccess(false);
            setBookingAgent(null);
            setBookingSubject('');
        }, 2000);
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
            
            {/* 1. HERO BANNER & MISSION */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold tracking-wide">
                        <Sparkles size={14} className="animate-spin" /> Écosystème des Experts Diallo & Réseau Mok
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                        Accompagnement Continu & Multimodal de Vie
                    </h1>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Chaque expert vous accompagne pas à pas : du diagnostic initial à l'exécution, avec mémoire active, livrables certifiés, appels audio/vidéo et suivi longitudinal.
                    </p>
                </div>
            </div>

            {/* 2. SEARCH & FILTER CONTROLS */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                
                {/* Search & Type Switch */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par nom, spécialité, langue (ex: Arabe, Visas, Finance, Droit, Projet)..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* AI vs Human Toggle — flex-wrap : sur mobile les 3
                        libellés longs débordaient du conteneur nowrap. */}
                    <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 shrink-0">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Sparkles size={14} /> Tous ({AGENTS.length})
                        </button>
                        <button
                            onClick={() => setTypeFilter('ai')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                typeFilter === 'ai' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Bot size={14} /> Experts IA 24/7 ({AGENTS.filter(a => !a.isHuman).length})
                        </button>
                        <button
                            onClick={() => setTypeFilter('human')}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                typeFilter === 'human' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <UserCheck size={14} /> Experts Humains Vérifiés ({AGENTS.filter(a => a.isHuman).length})
                        </button>
                    </div>
                </div>

                {/* Role Tabs — le voile dégradé (mobile) signale qu'il y a
                    d'autres filtres à faire défiler : la barre est masquée
                    (no-scrollbar) et rien n'indiquait le débordement. */}
                <div className="relative">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                        {[
                            { id: 'all', label: 'Toutes les Spécialités' },
                            { id: 'projet', label: '🚀 Projet & Financement' },
                            { id: 'juridique', label: '⚖️ Juridique & Droit' },
                            { id: 'administration', label: '📑 Administratif & Visas' },
                            { id: 'emploi', label: '💼 Emploi & Carrière' },
                            { id: 'education', label: '🎓 Éducation & Soutien' },
                            { id: 'sante', label: '🩺 Santé & Prévention' },
                            { id: 'finance', label: '💰 Finance & Commerce' },
                            { id: 'logement', label: '🏠 Logement & Habitat' },
                            { id: 'coach', label: '🌐 Langues & Traduction' },
                            { id: 'voyage', label: '✈️ Voyage & Mobilité' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedRoleFilter(tab.id)}
                                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                                    selectedRoleFilter === tab.id
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div aria-hidden="true" className="md:hidden pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
                </div>
            </div>

            {/* 3. EXPERTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map(agent => {
                    const activeDossierForAgent = dossiers.find(d => d.leadAgentId === agent.id);

                    return (
                        <div 
                            key={agent.id}
                            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                        >
                            {/* Card Header & Profile */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="relative">
                                        <img 
                                            src={agent.avatarUrl} 
                                            alt={agent.name}
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:scale-105 transition-all"
                                        />
                                        <span 
                                            className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                                                agent.availabilityStatus === 'available' ? 'bg-emerald-500 animate-pulse' :
                                                agent.availabilityStatus === 'in_call' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`}
                                            title={agent.availabilityStatus === 'available' ? 'Disponible Immédiatement' : 'Sur rendez-vous'}
                                        />
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-col items-end gap-1.5">
                                        {agent.isHuman ? (
                                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                <UserCheck size={12} className="text-amber-600" /> Humain Vérifié
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                                                <Bot size={12} className="text-blue-600" /> Expert IA 24/7
                                            </span>
                                        )}
                                        
                                        <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                                            <Star size={13} fill="currentColor" />
                                            <span>{agent.rating || 4.9}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">({agent.reviewsCount || 120})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Identity & Specialty */}
                                <div>
                                    <h3 className="font-black text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                                        {agent.name}
                                    </h3>
                                    <p className="text-xs font-bold text-blue-600 mb-1">{agent.title}</p>
                                    <p className="text-xs text-slate-500 font-medium">{agent.specialty}</p>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                    {agent.description}
                                </p>

                                {/* Spoken Languages */}
                                {agent.languages && (
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        <Globe2 size={12} className="text-slate-400 shrink-0" />
                                        {agent.languages.slice(0, 4).map(lang => (
                                            <span key={lang} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                                {lang}
                                            </span>
                                        ))}
                                        {agent.languages.length > 4 && (
                                            <span className="text-[10px] text-slate-400 font-bold">+{agent.languages.length - 4}</span>
                                        )}
                                    </div>
                                )}

                                {/* Key Skills */}
                                {agent.skills && (
                                    <div className="space-y-1 pt-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compétences Clés</p>
                                        <div className="flex flex-wrap gap-1">
                                            {agent.skills.slice(0, 3).map((skill, idx) => (
                                                <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                                                    ✓ {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Associated Active Dossier Banner */}
                                {activeDossierForAgent && (
                                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium flex items-center justify-between">
                                        <span className="truncate flex items-center gap-1">
                                            <FolderPlus size={13} className="text-emerald-600 shrink-0" />
                                            Dossier: <strong>{activeDossierForAgent.title}</strong>
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                            {activeDossierForAgent.progress}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => onSelectAgentForChat(agent)}
                                        className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                                        title="Ouvrir le chat interactif"
                                    >
                                        <MessageSquare size={14} /> Discuter
                                    </button>
                                    <button
                                        onClick={() => onStartCallWithAgent(agent)}
                                        className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                        title="Lancer un appel vocal direct"
                                    >
                                        <Phone size={14} /> Vocal
                                    </button>
                                    <button
                                        onClick={() => onStartVideoWithAgent(agent)}
                                        className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                        title="Lancer un appel vidéo / caméra"
                                    >
                                        <Video size={14} /> Vidéo
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        onClick={() => onCreateDossierWithAgent(agent)}
                                        className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                                    >
                                        <FolderPlus size={13} className="text-purple-600" /> Nouveau Dossier
                                    </button>

                                    {agent.isHuman ? (
                                        <button
                                            onClick={() => setBookingAgent(agent)}
                                            className="py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-xs"
                                        >
                                            <Calendar size={13} /> Prendre RDV ({agent.hourlyRate}€/h)
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onShareDocWithAgent && onShareDocWithAgent(agent)}
                                            className="py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                                        >
                                            <Upload size={13} className="text-emerald-600" /> Analyser Fichier
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. MODAL DE PRISE DE RENDEZ-VOUS POUR EXPERTS HUMAINS */}
            {bookingAgent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <img src={bookingAgent.avatarUrl} className="w-10 h-10 rounded-full object-cover border" />
                                <div>
                                    <h3 className="font-black text-sm text-slate-900">Rendez-vous avec {bookingAgent.name}</h3>
                                    <p className="text-xs text-amber-700 font-bold">{bookingAgent.title} • {bookingAgent.hourlyRate}€ / heure</p>
                                </div>
                            </div>
                            <button onClick={() => setBookingAgent(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {bookingSuccess ? (
                            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-800">
                                <CheckCircle2 size={32} className="mx-auto text-emerald-600 animate-bounce" />
                                <h4 className="font-bold text-sm">Rendez-vous Confirmé avec Succès !</h4>
                                <p className="text-xs text-emerald-700">Une invitation avec le lien sécurisé de visioconférence et confirmation a été ajoutée à votre agenda et envoyée à l'expert.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmBooking} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Date Souhaitée</label>
                                        <input 
                                            type="date" 
                                            required
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Créneau Horaire</label>
                                        <select 
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                        >
                                            <option value="09:00">09:00 - 10:00 (GMT)</option>
                                            <option value="11:00">11:00 - 12:00 (GMT)</option>
                                            <option value="14:00">14:00 - 15:00 (GMT)</option>
                                            <option value="16:30">16:30 - 17:30 (GMT)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Objet de la Consultation & Contexte</label>
                                    <textarea 
                                        rows={3}
                                        required
                                        value={bookingSubject}
                                        onChange={(e) => setBookingSubject(e.target.value)}
                                        placeholder="Décrivez précisément votre situation, questions juridiques/médicales/financières et pièces justificatives..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>

                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                                    🔒 <strong>Garantie Tiers de Confiance :</strong> Le montant de la consultation ({bookingAgent.hourlyRate}€) reste consigné de manière sécurisée et n'est débloqué qu'à l'issue de la consultation effective.
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setBookingAgent(null)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                                    >
                                        Valider la Réservation
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
