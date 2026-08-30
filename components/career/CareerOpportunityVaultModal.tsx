import React, { useState } from 'react';
import { 
  RadarOpportunityItem, 
  OpportunityVaultStatus, 
  OpportunityUniverse 
} from '../../types';
import { 
  X, 
  Bookmark, 
  FolderLock, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Send, 
  Trash2, 
  Search, 
  Filter, 
  ExternalLink, 
  Mail, 
  Video, 
  Sparkles,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';

interface CareerOpportunityVaultModalProps {
  opportunities: RadarOpportunityItem[];
  onUpdateStatus: (opportunityId: string, newStatus: OpportunityVaultStatus, notes?: string) => void;
  onGenerateApproach: (opportunity: RadarOpportunityItem, actionType: any) => void;
  onOpenCoach3D: (opportunity: RadarOpportunityItem) => void;
  onClose: () => void;
}

const VAULT_STATUS_TABS: { id: OpportunityVaultStatus | 'all'; label: string; countColor: string }[] = [
  { id: 'all', label: 'Toutes les sauvegardes', countColor: 'bg-slate-200 text-slate-800' },
  { id: 'a_etudier', label: 'À étudier', countColor: 'bg-blue-100 text-blue-800' },
  { id: 'a_preparer', label: 'À préparer', countColor: 'bg-amber-100 text-amber-800' },
  { id: 'prete', label: 'Prête à agir', countColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'action_engagee', label: 'Action engagée', countColor: 'bg-purple-100 text-purple-800' },
  { id: 'en_attente', label: 'En attente retour', countColor: 'bg-indigo-100 text-indigo-800' },
  { id: 'reussie', label: 'Succès / Conclu', countColor: 'bg-green-100 text-green-800' },
  { id: 'refusee', label: 'Refusée / Rejet', countColor: 'bg-rose-100 text-rose-800' },
  { id: 'expiree', label: 'Expirée', countColor: 'bg-gray-100 text-gray-600' }
];

export const CareerOpportunityVaultModal: React.FC<CareerOpportunityVaultModalProps> = ({
  opportunities,
  onUpdateStatus,
  onGenerateApproach,
  onOpenCoach3D,
  onClose
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<OpportunityVaultStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEditingNotesId, setActiveEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Filter opportunities in the vault (excluding plain 'decouverte' unless explicitly saved or marked)
  const savedOpportunities = opportunities.filter(o => 
    o.isFavorite || (o.vaultStatus !== 'decouverte' && o.vaultStatus !== 'abandonnee')
  );

  const filteredOpportunities = savedOpportunities.filter(o => {
    if (selectedStatusTab !== 'all' && o.vaultStatus !== selectedStatusTab) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = o.title.toLowerCase().includes(q) || 
                    o.entity.toLowerCase().includes(q) || 
                    (o.userNotes && o.userNotes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getStatusCount = (statusId: OpportunityVaultStatus | 'all') => {
    if (statusId === 'all') return savedOpportunities.length;
    return savedOpportunities.filter(o => o.vaultStatus === statusId).length;
  };

  const handleSaveNotes = (oppId: string) => {
    onUpdateStatus(oppId, opportunities.find(o => o.id === oppId)?.vaultStatus || 'a_etudier', editingNotesText);
    setActiveEditingNotesId(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* TOP HEADER */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider mb-1">
              <FolderLock size={16} /> Coffre d'Opportunités Personnel
            </div>
            <h2 className="text-2xl md:text-3xl font-black">
              Vos Opportunités Enregistrées & Suivi d'Action
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Conservez, priorisez, annotez et pilotez l'avancement de chaque piste vers votre Point B.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* SEARCH & STATUS TABS */}
        <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, entreprise, mot-clé ou note personnelle..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Status Tabs Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {VAULT_STATUS_TABS.map(tab => {
              const count = getStatusCount(tab.id);
              if (count === 0 && tab.id !== 'all' && selectedStatusTab !== tab.id) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedStatusTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${tab.countColor}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VAULT ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-100/50">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <FolderLock size={48} className="mx-auto text-slate-300 opacity-60" />
              <p className="font-bold text-base text-slate-600">Aucune opportunité dans cette vue.</p>
              <p className="text-xs max-w-md mx-auto">
                Cliquez sur l'icône Signet (Bookmark) sur une carte du Radar pour la conserver dans votre coffre.
              </p>
            </div>
          ) : (
            filteredOpportunities.map(opp => (
              <div 
                key={opp.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all"
              >
                {/* Upper line */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                        {opp.universe}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Enregistré le {opp.savedAt || 'Récemment'}
                      </span>
                      {opp.deadlineDate && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200 flex items-center gap-1">
                          <Calendar size={11} /> {opp.deadlineDate}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base">{opp.title}</h4>
                    <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <Building2 size={12} className="text-slate-400" /> {opp.entity} • {opp.location} {opp.countryFlag}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <label className="text-xs font-bold text-slate-500">Statut :</label>
                    <select
                      value={opp.vaultStatus}
                      onChange={(e) => onUpdateStatus(opp.id, e.target.value as OpportunityVaultStatus)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="a_etudier">À étudier</option>
                      <option value="a_preparer">À préparer</option>
                      <option value="prete">Prête à agir</option>
                      <option value="action_engagee">Action engagée</option>
                      <option value="en_attente">En attente retour</option>
                      <option value="reussie">Succès / Conclu</option>
                      <option value="refusee">Refusée / Rejet</option>
                      <option value="expiree">Expirée</option>
                    </select>
                  </div>
                </div>

                {/* Personal Notes Section */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs">
                  {activeEditingNotesId === opp.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingNotesText}
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        placeholder="Ajouter une note personnelle (contact établi, relance prévue, documents à réunir...)"
                        className="w-full h-20 p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setActiveEditingNotesId(null)}
                          className="px-3 py-1 text-slate-500 hover:text-slate-700 font-bold"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={() => handleSaveNotes(opp.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold"
                        >
                          Enregistrer la note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold text-slate-700">Note personnelle : </span>
                        <span className="text-slate-600 italic">
                          {opp.userNotes || 'Aucune note pour le moment.'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveEditingNotesId(opp.id);
                          setEditingNotesText(opp.userNotes || '');
                        }}
                        className="text-blue-600 hover:underline font-bold text-[11px] shrink-0"
                      >
                        {opp.userNotes ? 'Modifier' : '+ Ajouter une note'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Fast Action Buttons */}
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => onOpenCoach3D(opp)}
                    className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Video size={14} /> Simuler Entretien 3D
                  </button>
                  <button
                    onClick={() => onGenerateApproach(opp, opp.universe === 'achats' ? 'devis' : 'mail')}
                    className="px-4 py-2 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Mail size={14} /> Préparer Dossier / Relance
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            {savedOpportunities.length} opportunité(s) conservée(s) dans votre coffre sécurisé.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Fermer le Coffre
          </button>
        </div>

      </div>
    </div>
  );
};
