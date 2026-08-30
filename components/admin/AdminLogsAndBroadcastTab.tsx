import React, { useState } from 'react';
import { 
  Activity, 
  Bell, 
  Send, 
  Search, 
  Filter, 
  Download, 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Users, 
  Radio, 
  Check,
  X
} from 'lucide-react';
import { SystemAuditLog, BroadcastNotification } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';

interface AdminLogsAndBroadcastTabProps {
  logs: SystemAuditLog[];
  notifications: BroadcastNotification[];
  onReload: () => void;
}

export const AdminLogsAndBroadcastTab: React.FC<AdminLogsAndBroadcastTabProps> = ({
  logs,
  notifications,
  onReload
}) => {
  const [subTab, setSubTab] = useState<'logs' | 'broadcast'>('logs');

  // Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [logCategory, setLogCategory] = useState<string>('all');

  // Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<BroadcastNotification['priority']>('info');
  const [broadcastAudience, setBroadcastAudience] = useState<BroadcastNotification['targetAudience']>('all');
  const [sentSuccess, setSentSuccess] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.actor.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.ipAddress.includes(logSearch);
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesCategory = logCategory === 'all' || log.category === logCategory;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    adminConfigService.sendBroadcastNotification({
      title: broadcastTitle,
      message: broadcastMessage,
      priority: broadcastPriority,
      targetAudience: broadcastAudience
    });

    setBroadcastTitle('');
    setBroadcastMessage('');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
    onReload();
  };

  const handleDeleteNotif = (id: string) => {
    adminConfigService.deleteBroadcastNotification(id);
    onReload();
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Horodatage', 'Niveau', 'Catégorie', 'Message', 'Acteur', 'IP'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.level,
      l.category,
      `"${l.message.replace(/"/g, '""')}"`,
      l.actor,
      l.ipAddress
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lmav-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header & Sub-tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-600" size={22} />
            Journaux d'Audit & Centre de Diffusion de Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité intégrale des actes administratifs et diffusion d'alertes globales instantanées.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setSubTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity size={14} />
            Journaux d'Audit ({logs.length})
          </button>
          <button
            onClick={() => setSubTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'broadcast' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio size={14} />
            Diffusion Générale ({notifications.length})
          </button>
        </div>
      </div>

      {/* 1. SOUS-ONGLET JOURNAUX D'AUDIT */}
      {subTab === 'logs' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Filtrer les journaux..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les Niveaux</option>
                <option value="info">Info</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
                <option value="security">Sécurité & Sceau</option>
              </select>

              <select
                value={logCategory}
                onChange={(e) => setLogCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes Catégories</option>
                <option value="auth">Authentification</option>
                <option value="document">Actes & Signatures</option>
                <option value="ai">Passerelle IA</option>
                <option value="payment">Wallet & Séquestre</option>
                <option value="admin">Administration</option>
                <option value="sync">Synchronisation</option>
              </select>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Horodatage</th>
                    <th className="py-3 px-4">Niveau</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Message d'Événement</th>
                    <th className="py-3 px-4">Acteur Responsable</th>
                    <th className="py-3 px-4 text-right">Adresse IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors font-sans">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase font-mono ${
                          log.level === 'security' ? 'bg-purple-100 text-purple-800' :
                          log.level === 'warning' ? 'bg-amber-100 text-amber-800' :
                          log.level === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.level}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-700 text-xs capitalize">
                        {log.category}
                      </td>

                      <td className="py-3 px-4 text-slate-900 font-medium text-xs">
                        {log.message}
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {log.actor}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SOUS-ONGLET DIFFUSION DE NOTIFICATIONS */}
      {subTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Composer */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Radio className="text-blue-600" size={18} />
                Émettre une Alerte Générale
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Diffusée instantanément sur les dashboards ciblés.</p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'Alerte *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Maintenance planifiée ou Nouveauté"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message d'information *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Rédigez les détails de l'annonce..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="info">Information</option>
                    <option value="warning">Avertissement</option>
                    <option value="urgent">Urgent</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Audience Cible</label>
                  <select
                    value={broadcastAudience}
                    onChange={(e) => setBroadcastAudience(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les Usagers</option>
                    <option value="citizens">Citoyens</option>
                    <option value="partners">Partenaires B2B</option>
                    <option value="admins">Administrateurs</option>
                  </select>
                </div>
              </div>

              {sentSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  Alerte diffusée avec succès sur toute la plateforme !
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <Send size={15} />
                Diffuser l'Annonce en Direct
              </button>
            </form>
          </div>

          {/* List of active broadcasts */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Alertes et Annonces en cours ({notifications.length})</h3>
            
            <div className="space-y-3">
              {notifications.map(notif => (
                <div key={notif.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        notif.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        notif.priority === 'warning' ? 'bg-amber-100 text-amber-800' :
                        notif.priority === 'maintenance' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notif.priority}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Cible : {notif.targetAudience}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteNotif(notif.id)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 -m-1 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Supprimer la notification"
                      aria-label="Supprimer la notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                    <span>Diffusée le : {notif.sentAt}</span>
                    <span>{notif.readCount} réceptions enregistrées</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
