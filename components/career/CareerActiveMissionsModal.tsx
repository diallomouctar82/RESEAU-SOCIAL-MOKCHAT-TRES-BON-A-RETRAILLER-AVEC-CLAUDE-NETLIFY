import React, { useState } from 'react';
import { 
  ContinuousSearchMission, 
  OpportunityUniverse 
} from '../../types';
import { 
  X, 
  Radar, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Bell, 
  CheckCircle, 
  Sparkles, 
  Sliders, 
  MapPin, 
  DollarSign, 
  Briefcase 
} from 'lucide-react';

interface CareerActiveMissionsModalProps {
  missions: ContinuousSearchMission[];
  onCreateMission: (mission: Omit<ContinuousSearchMission, 'id' | 'foundCount' | 'newMatchesCount' | 'lastScannedAt'>) => void;
  onToggleMission: (missionId: string) => void;
  onDeleteMission: (missionId: string) => void;
  onClose: () => void;
}

export const CareerActiveMissionsModal: React.FC<CareerActiveMissionsModalProps> = ({
  missions,
  onCreateMission,
  onToggleMission,
  onDeleteMission,
  onClose
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuery, setNewQuery] = useState('');
  const [newUniverse, setNewUniverse] = useState<OpportunityUniverse>('emploi');
  const [newLocation, setNewLocation] = useState('');
  const [newMinBudget, setNewMinBudget] = useState('');
  const [newFrequency, setNewFrequency] = useState<'continuous' | 'daily' | 'weekly'>('continuous');
  const [newThreshold, setNewThreshold] = useState<number>(85);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuery.trim()) return;

    onCreateMission({
      title: newTitle,
      naturalQuery: newQuery,
      universe: newUniverse,
      targetLocation: newLocation || 'International & Local',
      minSalaryOrBudget: newMinBudget || 'Aligné sur le marché',
      status: 'active',
      frequency: newFrequency,
      matchingThreshold: newThreshold,
      alertChannels: {
        inApp: true,
        priorityDigest: true
      }
    });

    setNewTitle('');
    setNewQuery('');
    setNewLocation('');
    setNewMinBudget('');
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider mb-1">
              <Radar size={16} /> Agent de Conquête Permanent
            </div>
            <h2 className="text-2xl md:text-3xl font-black">
              Mon Agent Cherche Pour Moi
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Déléguez la surveillance passive des marchés, appels d'offres et opportunités cachées 24h/24.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Radar size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {missions.filter(m => m.status === 'active').length} mission(s) de veille active(s)
                </div>
                <div className="text-xs text-slate-500">
                  L'agent analyse en continu le Réseau MOK, les bourses, le Marché Mondial et les flux partenaires.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              {showCreateForm ? <X size={15} /> : <Plus size={15} />}
              <span>{showCreateForm ? 'Annuler' : 'Nouvelle Mission de Veille'}</span>
            </button>
          </div>

          {/* CREATE MISSION FORM */}
          {showCreateForm && (
            <form onSubmit={handleCreateSubmit} className="bg-white p-6 rounded-2xl border border-blue-300 shadow-lg space-y-4 animate-fade-up">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="text-blue-600" size={16} /> Configurer une mission de recherche automatisée
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Titre de la mission *</label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Veille Appels d'Offres Agro Dakar"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Univers de recherche *</label>
                  <select
                    value={newUniverse}
                    onChange={(e) => setNewUniverse(e.target.value as OpportunityUniverse)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="emploi">Emploi & Missions de Conseil</option>
                    <option value="clients">Clients B2B & Nouveaux Contrats</option>
                    <option value="fonds">Fonds, Subventions & Investisseurs</option>
                    <option value="achats">Achats, Grossistes & Sourcing</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Intention de recherche en langage naturel *</label>
                  <textarea
                    value={newQuery}
                    onChange={(e) => setNewQuery(e.target.value)}
                    placeholder="Ex: 'Je cherche des subventions non-dilutives pour un projet AgriTech en Afrique de l'Ouest avec un budget supérieur à 20 000 €'..."
                    required
                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Zone géographique cible</label>
                  <input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Côte d'Ivoire / Télétravail"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Seuil de compatibilité minimum</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="60"
                      max="95"
                      step="5"
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(Number(e.target.value))}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {newThreshold}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Activer la Mission
                </button>
              </div>
            </form>
          )}

          {/* MISSIONS LIST */}
          <div className="space-y-4">
            {missions.map(mission => (
              <div 
                key={mission.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-all"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      mission.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {mission.status === 'active' ? '● En cours de veille' : '❚❚ En pause'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Univers : {mission.universe}
                    </span>
                    <span className="text-xs text-slate-400">
                      Dernier scan : {mission.lastScannedAt}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base">{mission.title}</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{mission.naturalQuery}"
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                    <span>Zone : <strong>{mission.targetLocation || 'Global'}</strong></span>
                    <span>•</span>
                    <span>Seuil Match : <strong>≥ {mission.matchingThreshold}%</strong></span>
                    <span>•</span>
                    <span className="text-blue-600 font-bold">
                      {mission.foundCount} pistes détectées ({mission.newMatchesCount} nouvelles)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => onToggleMission(mission.id)}
                    title={mission.status === 'active' ? 'Mettre en pause' : 'Activer'}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      mission.status === 'active'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {mission.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
                    <span>{mission.status === 'active' ? 'Pause' : 'Reprendre'}</span>
                  </button>

                  <button
                    onClick={() => onDeleteMission(mission.id)}
                    title="Supprimer la mission"
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-600" />
            <span>Veille passive active respectant la vie privée et sans sollicitations abusives.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
