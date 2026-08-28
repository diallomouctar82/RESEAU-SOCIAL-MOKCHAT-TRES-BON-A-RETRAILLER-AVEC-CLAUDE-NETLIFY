import React, { useState } from 'react';
import { 
  Users, UserCheck, MessageSquare, Bot, Sparkles, Send, PhoneCall, 
  Mail, Calendar, ArrowRight, CheckCircle2, Clock, Filter, Search, 
  HelpCircle, ChevronRight, AlertTriangle, Building2, Globe
} from 'lucide-react';
import { CrmLeadClient, CrmFollowUp, CustomerSupportTicket } from '../../types';
import { AIProxyClient } from '../../services/aiProxy';

interface CrmAndSalesCopilotProps {
  clients: CrmLeadClient[];
  followUps: CrmFollowUp[];
  supportTickets: CustomerSupportTicket[];
  onAddFollowUp: (followUp: CrmFollowUp) => void;
  onUpdateClientStage: (clientId: string, newStage: CrmLeadClient['stage']) => void;
  onSendAiFollowUpMessage: (followUp: CrmFollowUp) => void;
  onResolveTicket: (ticketId: string, resolutionNotes: string) => void;
}

const PIPELINE_STAGES: { id: CrmLeadClient['stage']; label: string; color: string }[] = [
  { id: 'prospect', label: '1. Prospect', color: 'bg-slate-800 text-slate-300' },
  { id: 'contact_etabli', label: '2. Contact', color: 'bg-indigo-950 text-indigo-300' },
  { id: 'qualifie', label: '3. Qualifié', color: 'bg-blue-950 text-blue-300' },
  { id: 'rendez_vous', label: '4. RDV / Visio', color: 'bg-purple-950 text-purple-300' },
  { id: 'offre_envoyee', label: '5. Offre Émise', color: 'bg-amber-950 text-amber-300' },
  { id: 'negociation', label: '6. Négociation', color: 'bg-orange-950 text-orange-300' },
  { id: 'client_gagne', label: '7. Client Actif', color: 'bg-emerald-950 text-emerald-300' },
  { id: 'fidelisation', label: '8. Fidélisation', color: 'bg-teal-950 text-teal-300' }
];

export const CrmAndSalesCopilot: React.FC<CrmAndSalesCopilotProps> = ({
  clients,
  followUps,
  supportTickets,
  onAddFollowUp,
  onUpdateClientStage,
  onSendAiFollowUpMessage,
  onResolveTicket
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts_360' | 'ai_followups' | 'support_desk'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFor360, setSelectedClientFor360] = useState<CrmLeadClient | null>(null);

  // AI Follow-up Composer Modal
  const [selectedFollowUpForAi, setSelectedFollowUpForAi] = useState<CrmFollowUp | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

  // Ticket Modal
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<CustomerSupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Handle AI follow-up message generation
  const handleGenerateAiFollowUp = async (followUp: CrmFollowUp) => {
    setSelectedFollowUpForAi(followUp);
    setIsGeneratingMessage(true);
    setGeneratedMessage('');

    try {
      const ai = new AIProxyClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tu es l'Agent Commercial IA de l'entreprise exportatrice d'Amadou Diallo.
        Rédige un message de relance B2B chaleureux, professionnel et persuasif pour :
        - Client : ${followUp.clientName}
        - Contexte : ${followUp.context}
        - Type de relance : ${followUp.type}
        - Canal prévu : ${followUp.channel}

        Le message doit être poli, valoriser notre certification Mok Trust et encourager une réponse rapide sans être agressif. Max 60 mots.`
      });

      setGeneratedMessage(response.text || followUp.aiSuggestedMessage || '');
    } catch (e) {
      console.error(e);
      setGeneratedMessage(followUp.aiSuggestedMessage || 'Bonjour, je reviens vers vous concernant notre offre commerciale.');
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-brand-400" size={22} />
            <h2 className="text-xl font-black text-white">CRM & Copilote Commercial IA</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
              Pipeline 8 Étapes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez votre pipeline de vente, vos relances automatisées et vos tickets de support avec analyse de sentiment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ai_followups')}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-brand-600 hover:from-cyan-500 hover:to-brand-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
          >
            <Sparkles size={14} />
            <span>Relances IA en Attente ({followUps.filter(f => f.status === 'a_faire').length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'pipeline', label: 'Pipeline Visuel (8 Étapes)', icon: ArrowRight, count: clients.length },
          { id: 'contacts_360', label: 'Annuaire & Fiches 360°', icon: Building2, count: clients.length },
          { id: 'ai_followups', label: 'Relances Automatiques IA', icon: Bot, count: followUps.filter(f => f.status === 'a_faire').length },
          { id: 'support_desk', label: 'Support & Tickets Clients', icon: HelpCircle, count: supportTickets.filter(t => t.status === 'ouvert').length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: PIPELINE VISUEL 8 ÉTAPES */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none min-h-[500px]">
            {PIPELINE_STAGES.map(stage => {
              const stageClients = clients.filter(c => c.stage === stage.id);
              const totalEstimatedValue = stageClients.reduce((sum, c) => sum + (c.estimatedDealValue || 0), 0);

              return (
                <div key={stage.id} className="min-w-[280px] w-[280px] bg-slate-900/70 border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {stageClients.length}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Potentiel :</span>
                      <strong className="text-white font-mono">{totalEstimatedValue.toLocaleString()} €</strong>
                    </div>

                    {/* Stage Client Cards */}
                    <div className="space-y-2.5 pt-1">
                      {stageClients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClientFor360(client)}
                          className="p-3 bg-slate-950/80 hover:bg-slate-950 border border-white/5 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all space-y-2 group shadow-md"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {client.name}
                              </h4>
                              <p className="text-[10px] text-slate-400">{client.company} • {client.country}</p>
                            </div>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                              {client.mokTrustScore}% Trust
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                            <span className="font-mono text-cyan-300 font-bold">
                              {client.estimatedDealValue ? `${client.estimatedDealValue.toLocaleString()} €` : '-'}
                            </span>
                            <span>{client.lastInteractionDate}</span>
                          </div>
                        </div>
                      ))}

                      {stageClients.length === 0 && (
                        <div className="text-center py-8 text-[11px] text-slate-600 border border-dashed border-white/5 rounded-xl">
                          Aucun prospect
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => alert(`Déplacement d'opportunité vers l'étape : ${stage.label}`)}
                      className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      + Ajouter ici
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CONTACTS ET FICHES 360° */}
      {activeTab === 'contacts_360' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, entreprise, pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <div 
                key={client.id} 
                onClick={() => setSelectedClientFor360(client)}
                className="p-5 bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 rounded-2xl space-y-3 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{client.name}</h3>
                      <p className="text-xs text-slate-400">{client.company} ({client.country})</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase">
                      {client.stage.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 pt-1">
                    <div>Email : <span className="text-slate-200">{client.email}</span></div>
                    <div>Tél : <span className="text-slate-200">{client.phone}</span></div>
                    <div>Canal d'entrée : <span className="text-slate-200 font-semibold">{client.acquisitionChannel}</span></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Acheté : <strong className="text-emerald-400 font-mono">{client.totalPurchasedAmount.toLocaleString()} €</strong></span>
                  <span className="text-cyan-400 font-bold text-xs flex items-center gap-1">
                    <span>Fiche 360°</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: RELANCES AUTOMATIQUES IA */}
      {activeTab === 'ai_followups' && (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-xs text-cyan-200">
            <span>Ces relances ont été planifiées automatiquement par Diallo OS pour éviter l'abandon de devis ou stimuler le réachat.</span>
            <span className="font-bold">{followUps.filter(f => f.status === 'a_faire').length} relance(s) suggérée(s)</span>
          </div>

          <div className="space-y-3">
            {followUps.map(fu => (
              <div key={fu.id} className="p-4 bg-slate-900/80 border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase">
                      {fu.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      fu.priority === 'haute' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      Priorité {fu.priority}
                    </span>
                    <span className="text-xs text-slate-400">Canal : <strong>{fu.channel}</strong></span>
                  </div>

                  <h4 className="text-sm font-bold text-white">Relance : {fu.clientName}</h4>
                  <p className="text-xs text-slate-300">{fu.context}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateAiFollowUp(fu)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-900/30 whitespace-nowrap"
                  >
                    <Sparkles size={13} />
                    <span>Générer Message & Envoyer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: TICKETS DE SUPPORT & SENTIMENT ANALYSIS */}
      {activeTab === 'support_desk' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Réf. Ticket</th>
                  <th className="p-3.5">Client & Entreprise</th>
                  <th className="p-3.5">Objet de la Demande</th>
                  <th className="p-3.5 text-center">Sentiment IA</th>
                  <th className="p-3.5 text-center">Statut</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {supportTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{ticket.ticketNumber}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">{ticket.clientName}</div>
                      <div className="text-[10px] text-slate-400">{ticket.clientCompany}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{ticket.subject}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{ticket.messages[ticket.messages.length - 1]?.text}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ticket.sentiment === 'positif' ? 'bg-emerald-500/20 text-emerald-300' :
                        ticket.sentiment === 'negatif' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {ticket.sentiment}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedTicketForReply(ticket)}
                        className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        Répondre avec IA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI FOLLOW UP MODAL */}
      {selectedFollowUpForAi && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Relance IA : {selectedFollowUpForAi.clientName}</h3>
                <p className="text-xs text-slate-400">Canal : {selectedFollowUpForAi.channel} • Contexte : {selectedFollowUpForAi.context}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Message rédigé par l'Agent Commercial IA :</label>
              {isGeneratingMessage ? (
                <div className="p-6 bg-slate-950 rounded-xl text-center text-xs text-slate-400 animate-pulse">
                  Rédaction du message personnalisé en cours...
                </div>
              ) : (
                <textarea
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedFollowUpForAi(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onSendAiFollowUpMessage(selectedFollowUpForAi);
                  setSelectedFollowUpForAi(null);
                }}
                disabled={isGeneratingMessage || !generatedMessage}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/30"
              >
                <Send size={13} />
                <span>Envoyer au Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT 360 MODAL */}
      {selectedClientFor360 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedClientFor360.name}</h3>
                <p className="text-xs text-slate-400">{selectedClientFor360.company} • {selectedClientFor360.country}</p>
              </div>
              <button onClick={() => setSelectedClientFor360(null)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-400">Score Mok Trust :</span>
                <div className="text-emerald-400 font-bold font-mono text-sm mt-0.5">{selectedClientFor360.mokTrustScore}% Vérifié</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-400">Total Ventes Réalisées :</span>
                <div className="text-white font-bold font-mono text-sm mt-0.5">{selectedClientFor360.totalPurchasedAmount.toLocaleString()} €</div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Notes & Historique Commercial :</span>
              <p className="text-xs text-slate-300 p-3 bg-slate-950 rounded-xl border border-white/5 leading-relaxed">
                {selectedClientFor360.notes || "Client régulier sur les livraisons maritimes CIF Conakry / Dakar. Ponctualité exemplaire sur les déblocages de séquestre."}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClientFor360(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
