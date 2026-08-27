import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageSquare, 
  ShoppingBag, 
  Video, 
  FileText, 
  Check, 
  X, 
  Filter, 
  Search, 
  Award, 
  UserX, 
  Lock, 
  ExternalLink,
  ShieldCheck,
  Building2,
  BadgeCheck,
  RefreshCw
} from 'lucide-react';
import { ContentModerationItem, UserReportItem, MokTrustAuditItem } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';

interface AdminModerationTabProps {
  moderationItems: ContentModerationItem[];
  reports: UserReportItem[];
  mokTrustAudits: MokTrustAuditItem[];
  onReload: () => void;
}

type SubSection = 'contents' | 'reports' | 'moktrust';

export const AdminModerationTab: React.FC<AdminModerationTabProps> = ({
  moderationItems,
  reports,
  mokTrustAudits,
  onReload
}) => {
  const [activeSection, setActiveSection] = useState<SubSection>('contents');
  const [contentFilter, setContentFilter] = useState<'all' | 'pending' | 'approved' | 'flagged' | 'hidden'>('all');
  const [search, setSearch] = useState('');

  // Action modals
  const [selectedReport, setSelectedReport] = useState<UserReportItem | null>(null);
  const [reportActionNotes, setReportActionNotes] = useState('');
  const [reportActionType, setReportActionType] = useState<'warn_user' | 'delete_content' | 'suspend_user'>('warn_user');

  const [selectedAudit, setSelectedAudit] = useState<MokTrustAuditItem | null>(null);
  const [auditNotes, setAuditNotes] = useState('');

  // Filtered Content
  const filteredContents = moderationItems.filter(item => {
    const matchesStatus = contentFilter === 'all' || item.status === contentFilter;
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.authorName.toLowerCase().includes(search.toLowerCase()) ||
      item.contentSnippet.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const pendingAuditsCount = mokTrustAudits.filter(a => a.status === 'pending').length;
  const flaggedContentsCount = moderationItems.filter(m => m.status === 'flagged').length;

  const handleApproveContent = (id: string) => {
    adminConfigService.approveModerationItem(id);
    onReload();
  };

  const handleHideContent = (id: string) => {
    adminConfigService.hideModerationItem(id);
    onReload();
  };

  const handleDeleteContent = (id: string, title: string) => {
    if (window.confirm(`Supprimer définitivement le contenu "${title}" ?`)) {
      adminConfigService.deleteModerationItem(id);
      onReload();
    }
  };

  const handleApplyReportAction = () => {
    if (!selectedReport) return;
    adminConfigService.actionUserReport(selectedReport.id, reportActionType, reportActionNotes || 'Mesure administrative validée.');
    setSelectedReport(null);
    setReportActionNotes('');
    onReload();
  };

  const handleDismissReport = (id: string) => {
    adminConfigService.dismissUserReport(id);
    onReload();
  };

  const handleApproveAudit = (id: string) => {
    adminConfigService.approveMokTrustBadge(id, auditNotes);
    setSelectedAudit(null);
    setAuditNotes('');
    onReload();
  };

  const handleRejectAudit = (id: string) => {
    if (!auditNotes) {
      alert('Veuillez spécifier un motif de rejet.');
      return;
    }
    adminConfigService.rejectMokTrustBadge(id, auditNotes);
    setSelectedAudit(null);
    setAuditNotes('');
    onReload();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Top Banner with Sub-Navigation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-blue-600" size={22} />
            Centre de Modération, Signalements & Conformité MokTrust
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Garantissez la probité des transactions B2B, filtrez les contenus illicites et auditez les vendeurs certifiés.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveSection('contents')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeSection === 'contents'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            Contenus & Commentaires ({moderationItems.length})
            {flaggedContentsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full font-black">
                {flaggedContentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeSection === 'reports'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle size={14} />
            Signalements ({reports.length})
            {pendingReportsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded-full font-black animate-pulse">
                {pendingReportsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('moktrust')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeSection === 'moktrust'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BadgeCheck size={14} />
            Audits MokTrust ({mokTrustAudits.length})
            {pendingAuditsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-600 text-white rounded-full font-black">
                {pendingAuditsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: MODÉRATION DES CONTENUS */}
      {activeSection === 'contents' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par titre, auteur ou extrait..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'flagged', 'pending', 'approved', 'hidden'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setContentFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                    contentFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Tous' : st === 'flagged' ? 'Signalés' : st === 'pending' ? 'En attente' : st === 'approved' ? 'Approuvés' : 'Masqués'}
                </button>
              ))}
            </div>
          </div>

          {/* Content Items List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredContents.map(item => (
              <div 
                key={item.id} 
                className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all ${
                  item.status === 'flagged' 
                    ? 'border-amber-300 bg-amber-50/20' 
                    : item.status === 'hidden'
                    ? 'border-slate-300 opacity-60 bg-slate-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${
                      item.type === 'post' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'listing' ? 'bg-emerald-100 text-emerald-700' :
                      item.type === 'live_stream' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.type === 'post' && <FileText size={15} />}
                      {item.type === 'listing' && <ShoppingBag size={15} />}
                      {item.type === 'live_stream' && <Video size={15} />}
                      {item.type === 'comment' && <MessageSquare size={15} />}
                    </span>

                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                      {item.moduleOrigin}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'flagged' ? 'bg-amber-100 text-amber-800' :
                      item.status === 'hidden' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.status}
                    </span>

                    {item.reportsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle size={11} />
                        {item.reportsCount} signalement(s)
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {item.createdAt}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 font-sans italic">
                  "{item.contentSnippet}"
                </p>

                {item.flagsReason.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {item.flagsReason.map((reason, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-medium">
                        ⚠️ {reason}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Auteur : <span className="font-bold text-slate-800">{item.authorName}</span> ({item.authorEmail})
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status !== 'approved' && (
                      <button
                        onClick={() => handleApproveContent(item.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        Approuver
                      </button>
                    )}

                    {item.status !== 'hidden' ? (
                      <button
                        onClick={() => handleHideContent(item.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <EyeOff size={13} />
                        Masquer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveContent(item.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye size={13} />
                        Démasquer
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteContent(item.id, item.title)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: SIGNALEMENTS UTILISATEURS */}
      {activeSection === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {reports.map(rep => (
              <div 
                key={rep.id} 
                className={`bg-white p-5 rounded-2xl border ${
                  rep.status === 'pending' ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                      <AlertTriangle size={16} />
                    </span>
                    <span className="text-xs font-black uppercase text-red-700 font-mono">
                      Signalement #{rep.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      rep.status === 'pending' ? 'bg-red-100 text-red-800' :
                      rep.status === 'actioned' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rep.status === 'pending' ? 'En attente d’arbitrage' : rep.status === 'actioned' ? 'Sanction appliquée' : 'Classé sans suite'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">{rep.createdAt}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Cible signalée :</span>
                    <p className="font-bold text-slate-900">{rep.targetTitle}</p>
                    <p className="text-slate-500">Utilisateur incriminé : <span className="font-semibold text-rose-700">{rep.reportedUserName}</span></p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Signalé par :</span>
                    <p className="font-bold text-slate-900">{rep.reporterName}</p>
                    <p className="text-slate-500">{rep.reporterEmail}</p>
                  </div>
                </div>

                <div className="mb-3 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Motif : {rep.reason.toUpperCase()}</span>
                  <p className="italic">{rep.details}</p>
                </div>

                {rep.resolutionNotes && (
                  <div className="mb-3 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-bold">Décision Super-Admin : </span>
                    {rep.resolutionNotes}
                  </div>
                )}

                {rep.status === 'pending' && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleDismissReport(rep.id)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Classer sans suite
                    </button>

                    <button
                      onClick={() => setSelectedReport(rep)}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <UserX size={14} />
                      Appliquer une Sanction / Mesure
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: AUDITS MOKTRUST */}
      {activeSection === 'moktrust' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mokTrustAudits.map(audit => (
              <div key={audit.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <Building2 size={20} />
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{audit.companyName}</h4>
                        <p className="text-xs text-slate-500">{audit.sellerName} ({audit.businessType})</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      audit.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      audit.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {audit.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl text-xs border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Badge sollicité :</span>
                      <span className="font-bold text-blue-700">{audit.requestedBadge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Score de Confiance :</span>
                      <span className="font-black text-emerald-700">{audit.trustScore} / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Documents KYC :</span>
                      <span className="font-medium text-slate-800">{audit.kycDocType}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-400 block text-[11px] mb-0.5">Rapport d'audit :</span>
                      <p className="text-slate-700 italic text-[11px]">{audit.auditNotes}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  {audit.status !== 'approved' && (
                    <button
                      onClick={() => handleApproveAudit(audit.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck size={15} />
                      Certifier MokTrust
                    </button>
                  )}

                  {audit.status !== 'rejected' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Motif du rejet ou suspension MokTrust :');
                        if (reason) {
                          adminConfigService.rejectMokTrustBadge(audit.id, reason);
                          onReload();
                        }
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                    >
                      Rejeter / Suspendre
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Report Resolution Action */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="text-red-600" size={20} />
                  Résolution du Signalement #{selectedReport.id}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Appliquez une mesure de rétorsion ou de modération.</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Action disciplinaire à exécuter</label>
                <select
                  value={reportActionType}
                  onChange={(e) => setReportActionType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                >
                  <option value="warn_user">Avertissement officiel à l'utilisateur</option>
                  <option value="delete_content">Suppression immédiate du contenu incriminé</option>
                  <option value="suspend_user">Suspension et blocage du compte utilisateur</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes de clôture / Justification administrative</label>
                <textarea
                  rows={3}
                  value={reportActionNotes}
                  onChange={(e) => setReportActionNotes(e.target.value)}
                  placeholder="ex: Violation répétée des règles d’export et du séquestre MokTrust. Compte suspendu 30 jours."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyReportAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Check size={14} />
                Exécuter la Mesure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
