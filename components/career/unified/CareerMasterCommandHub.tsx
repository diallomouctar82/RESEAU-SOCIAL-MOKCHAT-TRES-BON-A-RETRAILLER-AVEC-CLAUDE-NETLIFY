import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Search, 
  HelpCircle, 
  Flame, 
  BookOpen, 
  ShieldCheck, 
  Trophy, 
  Lightbulb, 
  HeartHandshake, 
  Sliders, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Video, 
  Users, 
  Radar, 
  BriefcaseBusiness, 
  UserCheck, 
  Navigation, 
  Play, 
  Pause,
  AlertTriangle,
  Zap,
  TrendingUp,
  FileText,
  Eye
} from 'lucide-react';
import { CareerMasterDossier, Opportunity } from '../../../types';

interface CareerMasterCommandHubProps {
  dossier: CareerMasterDossier;
  userName: string;
  userRole: string;
  opportunities: Opportunity[];
  activeViewTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenSearch: () => void;
  onOpenWhatShouldIDo: () => void;
  onOpenEmergency: () => void;
  onOpenNarrativeStory: () => void;
  onOpenPermissionsLogs: () => void;
  onOpenCelebration: () => void;
  onOpenSurpriseOpportunities: () => void;
  onOpenImpactTransmission: () => void;
  onOpenCoherenceAudit: () => void;
  onOpenCoach3D: () => void;
  onOpenMasterResume: () => void;
  onToggleAgentPause: () => void;
}

export const CareerMasterCommandHub: React.FC<CareerMasterCommandHubProps> = ({
  dossier,
  userName,
  userRole,
  opportunities,
  activeViewTab,
  onSelectTab,
  onOpenSearch,
  onOpenWhatShouldIDo,
  onOpenEmergency,
  onOpenNarrativeStory,
  onOpenPermissionsLogs,
  onOpenCelebration,
  onOpenSurpriseOpportunities,
  onOpenImpactTransmission,
  onOpenCoherenceAudit,
  onOpenCoach3D,
  onOpenMasterResume,
  onToggleAgentPause
}) => {
  const [interfaceMode, setInterfaceMode] = useState<'simple' | 'advanced'>('simple');
  const [checklist, setChecklist] = useState(dossier.dailyCommand.quickChecklist);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const hotOpportunities = opportunities.filter(o => o.status === 'detected' || o.status === 'preparing' || o.status === 'contacted').slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* 🌟 BARRE DE COMMANDE SUPÉRIEURE INTELLIGENTE */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        
        {/* Ligne 1 : Statut du Cap, Mode Simple/Avancé & Commandes Universelles */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Cap & Point B */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                <Compass size={12} /> Point B Actuel
              </span>
              <button 
                onClick={onOpenCoherenceAudit}
                className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition flex items-center gap-1"
                title="Vérifier la cohérence de vos actions"
              >
                <CheckCircle2 size={11} /> Alignement 92%
              </button>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 line-clamp-1">
              {dossier.pointBSummary}
            </h2>
          </div>

          {/* Contrôles Principaux & Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            
            {/* Mode Simple vs Avancé */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setInterfaceMode('simple')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  interfaceMode === 'simple' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode Simple
              </button>
              <button
                onClick={() => setInterfaceMode('advanced')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  interfaceMode === 'advanced' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode Avancé
              </button>
            </div>

            {/* Bouton Recherche Universelle */}
            <button
              onClick={onOpenSearch}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
              title="Recherche universelle dans Carrière"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Recherche</span>
            </button>

            {/* Bouton Agent Pause/Play */}
            <button
              onClick={onToggleAgentPause}
              className={`p-2.5 rounded-xl transition text-xs font-bold flex items-center gap-1.5 ${
                dossier.permissions.isAgentPaused
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
              title={dossier.permissions.isAgentPaused ? "L'agent est en pause" : "L'agent veille activement"}
            >
              {dossier.permissions.isAgentPaused ? <Play size={15} /> : <Pause size={15} />}
              <span className="hidden sm:inline">{dossier.permissions.isAgentPaused ? 'Agent en Pause' : 'Agent Actif'}</span>
            </button>

            {/* Bouton Urgence Carrière */}
            <button
              onClick={onOpenEmergency}
              className="px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition animate-pulse"
              title="Assistance tactique immédiate pour entretien ou dossier urgent"
            >
              <Flame size={14} />
              <span>J'ai une urgence</span>
            </button>
          </div>
        </div>

        {/* Ligne 2 : Ruban des Raccourcis Stratégiques & Accomplissement */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Que dois-je faire maintenant ? */}
            <button
              onClick={onOpenWhatShouldIDo}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition flex items-center gap-1.5"
            >
              <HelpCircle size={13} />
              <span>Que dois-je faire maintenant ?</span>
            </button>

            {/* Raconte-moi mon parcours */}
            <button
              onClick={onOpenNarrativeStory}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition flex items-center gap-1.5"
            >
              <BookOpen size={13} />
              <span>Raconte-moi mon parcours</span>
            </button>

            {/* Opportunités Surprises */}
            <button
              onClick={onOpenSurpriseOpportunities}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl border border-purple-200 transition flex items-center gap-1.5"
            >
              <Lightbulb size={13} />
              <span>Opportunités Surprises (2)</span>
            </button>

            {/* Mon Impact */}
            <button
              onClick={onOpenImpactTransmission}
              className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-xl border border-pink-200 transition flex items-center gap-1.5"
            >
              <HeartHandshake size={13} />
              <span>Mon Impact ({dossier.impactData.peopleHelpedCount} aidés)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Permissions & Logs IA */}
            <button
              onClick={onOpenPermissionsLogs}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5"
            >
              <ShieldCheck size={13} />
              <span>Permissions & IA</span>
            </button>

            {/* Célébration / Prochaine Ambition */}
            <button
              onClick={onOpenCelebration}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Trophy size={13} />
              <span>Objectif Atteint (Célébrer)</span>
            </button>
          </div>

        </div>

      </div>

      {/* 🌟 VUE EN MODE SIMPLE (CENTRÉ SUR L'ESSENTIEL) */}
      {interfaceMode === 'simple' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* SECTION 1 : MA JOURNÉE CARRIÈRE (NEXT BEST ACTION) */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <Calendar size={14} /> Ma Journée Carrière • {dossier.dailyCommand.dateStr}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white/10 px-2.5 py-1 rounded-full text-blue-200">
                    {dossier.dailyCommand.todayInterviewsCount} entretien aujourd'hui
                  </span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-full text-emerald-300">
                    {dossier.dailyCommand.urgentOpportunitiesCount} prioritaires
                  </span>
                </div>
              </div>

              {/* Next Best Action Spotlight */}
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 inline-block">
                      Action N°1 Recommandée
                    </span>
                    <h3 className="text-base md:text-lg font-black text-white">
                      {dossier.dailyCommand.nextBestAction.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => onSelectTab(dossier.dailyCommand.nextBestAction.targetTab)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/30 transition shrink-0 self-end sm:self-auto"
                  >
                    <span>Agir</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                  <strong>Pourquoi maintenant ?</strong> {dossier.dailyCommand.nextBestAction.whyNow}
                </p>
              </div>

              {/* Checklist Rapide du Jour */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Votre feuille de route du jour :
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {checklist.map(item => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition ${
                        item.done 
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 line-through' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">{item.text}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30'
                      }`}>
                        {item.done && <CheckCircle2 size={12} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2 : 3 CARTES D'ACCOMPLISSEMENT (PROGRESSION / OPPORTUNITÉS / COACH 3D) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Progression & Jumeau Pro */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avancement vers Point B</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {dossier.overallProgressPercentage}%
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">Jumeau Pro Évolutif</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Votre profil détient 6 compétences certifiées et un capital preuve niveau 5 audité Mok Trust.
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${dossier.overallProgressPercentage}%` }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectTab('gps')}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition text-center"
                >
                  Voir l'Itinéraire GPS
                </button>
                <button
                  onClick={() => onSelectTab('twin')}
                  className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition text-center"
                >
                  Jumeau
                </button>
              </div>
            </div>

            {/* 2. Opportunités Chaudes */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Radar & Conquête</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {hotOpportunities.length} actives
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900">Dossiers en Négociation</h4>
                
                <div className="space-y-1.5">
                  {hotOpportunities.map(opp => (
                    <div key={opp.id} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 truncate">{opp.title}</span>
                      <span className="text-[10px] text-blue-600 font-bold shrink-0 ml-1">{opp.matchScore}% match</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectTab('hunter')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition text-center"
              >
                Ouvrir la Salle de Conquête
              </button>
            </div>

            {/* 3. Coach 3D Vocal */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-300 uppercase tracking-wider">Compagnon Permanent</span>
                  <span className="bg-indigo-500/30 px-2 py-0.5 rounded-full text-indigo-200 font-bold">Fenrir Vocal</span>
                </div>
                <h4 className="text-base font-black text-white">Coach 3D Professionnel</h4>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Préparez vos simulations d'entretiens, testez vos arguments salariaux et faites le point vocalement.
                </p>
              </div>

              <button
                onClick={onOpenCoach3D}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition"
              >
                <Video size={15} />
                <span>Lancer la Simulation Vocale</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 🌟 VUE EN MODE AVANCÉ (COCKPIT COMPLET DES 7 ÉTAPES) */}
      {interfaceMode === 'advanced' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900">Cockpit Stratégique Intégré (7 Piliers)</h3>
              <p className="text-xs text-slate-500">Accès direct aux modules d'ingénierie et de pilotage fin de votre parcours.</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
              Système Diallo OS v5.12
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { id: 'gps', label: 'GPS & Objectif', desc: 'Point A ➔ Point B et étapes', icon: Navigation, color: 'blue' },
              { id: 'twin', label: 'Jumeau Pro', desc: 'Preuves & certifications auditées', icon: UserCheck, color: 'emerald' },
              { id: 'hunter', label: 'Radar & Conquête', desc: 'Opportunités et War Room', icon: Radar, color: 'indigo' },
              { id: 'network', label: 'Réseau & ICP', desc: 'Capital relationnel & mentorat', icon: Users, color: 'purple' },
              { id: 'pipeline', label: 'Suivi Continu', desc: 'Dossiers vivants & relances', icon: BriefcaseBusiness, color: 'amber' },
              { id: 'strategic', label: 'Stratégie & Trajectoires', desc: 'Boussole 4D & Skill Graph', icon: Compass, color: 'teal' },
              { id: 'simulator', label: 'Coach 3D Vocal', desc: 'Entraînement immersif', icon: Video, color: 'rose' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-3 ${
                  activeViewTab === tab.id
                    ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 w-fit shadow-2xs">
                  <tab.icon size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-xs md:text-sm text-slate-900">{tab.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tab.desc}</div>
                </div>
              </button>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
