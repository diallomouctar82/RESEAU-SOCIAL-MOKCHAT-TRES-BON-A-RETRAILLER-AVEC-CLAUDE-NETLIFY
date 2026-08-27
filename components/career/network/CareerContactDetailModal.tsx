import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Plus, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Share2, 
  Tv, 
  Film, 
  Users,
  Send
} from 'lucide-react';
import { RelationalNode, RelationshipPipelineStage } from '../../../types';

interface CareerContactDetailModalProps {
  contact: RelationalNode;
  onUpdateContact: (updated: RelationalNode) => void;
  onOpenIntroduction: (contact: RelationalNode) => void;
  onOpenCampusOrMoc?: (type: 'tribe' | 'live' | 'reel', idOrTitle: string) => void;
  onClose: () => void;
}

export const CareerContactDetailModal: React.FC<CareerContactDetailModalProps> = ({
  contact,
  onUpdateContact,
  onOpenIntroduction,
  onOpenCampusOrMoc,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'commitments' | 'synergies'>('overview');
  const [newNote, setNewNote] = useState('');
  const [newCommitmentText, setNewCommitmentText] = useState('');
  const [commitmentByWhom, setCommitmentByWhom] = useState<'user' | 'contact'>('user');

  const pipelineStages: { id: RelationshipPipelineStage; label: string }[] = [
    { id: 'identifiee', label: 'Identifiée' },
    { id: 'a_etudier', label: 'À étudier' },
    { id: 'introduction', label: 'Introduction' },
    { id: 'contact_initial', label: 'Contact initial' },
    { id: 'echange_en_cours', label: 'Échange' },
    { id: 'rendez_vous', label: 'Rendez-vous' },
    { id: 'opportunite_ouverte', label: 'Opportunité' },
    { id: 'negociation', label: 'Négociation' },
    { id: 'resultat_signe', label: 'Résultat signé' },
    { id: 'relation_a_entretenir', label: 'Fidélisation' }
  ];

  const handleStageChange = (newStage: RelationshipPipelineStage) => {
    const updated: RelationalNode = {
      ...contact,
      stage: newStage,
      lastInteractionDate: 'Aujourd\'hui'
    };
    onUpdateContact(updated);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updated: RelationalNode = {
      ...contact,
      notes: [newNote.trim(), ...(contact.notes || [])]
    };
    onUpdateContact(updated);
    setNewNote('');
  };

  const handleAddCommitment = () => {
    if (!newCommitmentText.trim()) return;
    const newCom = {
      id: `com-${Date.now()}`,
      text: newCommitmentText.trim(),
      byWhom: commitmentByWhom,
      completed: false,
      deadline: 'Prochainement'
    };
    const updated: RelationalNode = {
      ...contact,
      agreedCommitments: [newCom, ...(contact.agreedCommitments || [])]
    };
    onUpdateContact(updated);
    setNewCommitmentText('');
  };

  const handleToggleCommitment = (comId: string) => {
    const updatedComs = (contact.agreedCommitments || []).map(c => 
      c.id === comId ? { ...c, completed: !c.completed } : c
    );
    onUpdateContact({
      ...contact,
      agreedCommitments: updatedComs
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Header with Profile Summary */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-4">
            <img 
              src={contact.avatarUrl} 
              alt={contact.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-xl" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{contact.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  {contact.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{contact.role}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Building2 size={13} className="text-indigo-400" /> {contact.organization}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-400" /> {contact.location}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {pipelineStages.map((st, idx) => {
              const isActive = contact.stage === st.id;
              const isPast = pipelineStages.findIndex(s => s.id === contact.stage) >= idx;
              return (
                <button
                  key={st.id}
                  onClick={() => handleStageChange(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : isPast
                      ? 'bg-slate-800/80 text-blue-300 hover:bg-slate-800'
                      : 'bg-slate-900/60 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800 flex gap-2">
          {[
            { id: 'overview', label: 'Vue Générale & Valeur' },
            { id: 'memory', label: 'Mémoire & Notes' },
            { id: 'commitments', label: `Engagements (${contact.agreedCommitments?.length || 0})` },
            { id: 'synergies', label: 'Synergies Réseau MOC' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Next Best Action Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/40 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Sparkles size={13} /> Prochaine Meilleure Action (Next Best Action)
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">{contact.nextBestAction || 'Maintenir un contact courtois.'}</h4>
                  <p className="text-xs text-slate-300 mt-1">Échéance recommandée : <strong className="text-blue-300">{contact.nextActionDueDate || 'Non définie'}</strong></p>
                </div>

                {contact.stage === 'introduction' && (
                  <button
                    onClick={() => onOpenIntroduction(contact)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all whitespace-nowrap"
                  >
                    Lancer l'Introduction
                  </button>
                )}
              </div>

              {/* "Pourquoi nous devrions nous parler" */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Pourquoi nous devrions nous parler
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {contact.whyWeShouldTalk}
                </p>
              </div>

              {/* Bidirectional Value Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 block">✨ Ce que cette personne peut apporter :</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {contact.bidirectionalValue.whatTheyCanBring.map((val, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{val}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-blue-400 block">🤝 Ce que vous lui apportez :</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {contact.bidirectionalValue.whatYouCanBring.map((val, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-blue-400 shrink-0 mt-0.5" />
                        <span>{val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MEMORY & NOTES */}
          {activeTab === 'memory' && (
            <div className="space-y-5">
              
              {/* Question: "Où en étais-je avec cette personne ?" */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Clock size={14} /> Mémoire Relationnelle Active
                </span>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>• Dernière interaction enregistrée : <strong className="text-white">{contact.lastInteractionDate || 'Aucune interaction passée'}</strong></p>
                  <p>• Documents échangés : <strong className="text-white">{contact.documentsExchanged?.length || 0} document(s)</strong></p>
                </div>
              </div>

              {/* Add Note Input */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ajouter une note privée</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Note ou compte-rendu rapide..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Historique des notes</span>
                {(contact.notes || []).length > 0 ? (
                  contact.notes?.map((note, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                      {note}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Aucune note pour le moment.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: COMMITMENTS */}
          {activeTab === 'commitments' && (
            <div className="space-y-5">
              
              {/* Add Commitment */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Enregistrer un engagement mutuel</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setCommitmentByWhom('user')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        commitmentByWhom === 'user' ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Mon Engagement
                    </button>
                    <button
                      onClick={() => setCommitmentByWhom('contact')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        commitmentByWhom === 'contact' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Son Engagement
                    </button>
                  </div>
                  <input 
                    type="text"
                    placeholder="Ex: Envoyer la proposition avant vendredi..."
                    value={newCommitmentText}
                    onChange={(e) => setNewCommitmentText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddCommitment}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
                  >
                    Valider
                  </button>
                </div>
              </div>

              {/* Commitments List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Engagements en cours</span>
                {(contact.agreedCommitments || []).length > 0 ? (
                  contact.agreedCommitments?.map(com => (
                    <div 
                      key={com.id}
                      onClick={() => handleToggleCommitment(com.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        com.completed 
                          ? 'bg-slate-950/40 border-slate-800 opacity-60' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          com.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'
                        }`}>
                          {com.completed && <Check size={13} />}
                        </div>
                        <div>
                          <span className={`text-xs ${com.completed ? 'line-through text-slate-500' : 'text-white font-medium'}`}>
                            {com.text}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Porteur : <strong className={com.byWhom === 'user' ? 'text-blue-400' : 'text-indigo-400'}>
                              {com.byWhom === 'user' ? 'Vous' : contact.name}
                            </strong>
                            {com.deadline && ` • Échéance : ${com.deadline}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Aucun engagement acté pour le moment.</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: MOC SYNERGIES */}
          {activeTab === 'synergies' && (
            <div className="space-y-5">
              
              {/* Tribes Suggested */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Users size={14} /> Tribus Réseau MOC Recommandées
                </span>
                <div className="space-y-2">
                  {contact.mocSynergies?.tribesSuggested?.map(tr => (
                    <div key={tr.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">{tr.name}</h5>
                        <p className="text-[11px] text-slate-400">{tr.reason}</p>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-bold px-2 py-1 bg-indigo-950 rounded border border-indigo-800/40">
                        {tr.membersCount} membres
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lives as Opportunity Source */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <Tv size={14} /> Lives Intelligents Utiles
                </span>
                <div className="space-y-2">
                  {contact.mocSynergies?.relevantLives?.map(lv => (
                    <div key={lv.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">{lv.title}</h5>
                        <p className="text-[11px] text-slate-400">Animé par {lv.host} • {lv.date}</p>
                      </div>
                      <span className="text-[10px] text-rose-300 font-bold px-2.5 py-1 bg-rose-950 rounded border border-rose-800/40">
                        Live MOC
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reels as Professional Showcase */}
              {contact.mocSynergies?.reelsPortfolioIdea && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Film size={14} /> Idée de Vitrine Pro (Micro-Démo Reel)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {contact.mocSynergies.reelsPortfolioIdea}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
