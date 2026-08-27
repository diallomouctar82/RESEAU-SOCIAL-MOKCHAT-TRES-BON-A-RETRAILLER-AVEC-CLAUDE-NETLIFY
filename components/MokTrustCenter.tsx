import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Lock, 
  Key, 
  Smartphone, 
  Laptop, 
  FileText, 
  Building2, 
  UserCheck, 
  Globe, 
  Eye, 
  AlertOctagon, 
  RefreshCw, 
  UploadCloud, 
  Plus, 
  ExternalLink, 
  LogOut, 
  Sliders, 
  Info, 
  Bot, 
  Sparkles,
  ChevronRight,
  Fingerprint,
  FileCheck,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { 
  MokTrustLevel, 
  MokTrustBadge, 
  KycDocument, 
  CompanyKybProfile, 
  SecuritySession, 
  InternalRiskSignal, 
  ProductCompliancePolicy, 
  SecurityAuditLog 
} from '../types';
import { 
  MOCK_MOK_TRUST_BADGES, 
  MOCK_KYC_DOCUMENTS, 
  MOCK_COMPANY_KYB_PROFILE, 
  MOCK_SECURITY_SESSIONS, 
  MOCK_INTERNAL_RISK_SIGNALS, 
  MOCK_PRODUCT_COMPLIANCE_POLICIES, 
  MOCK_SECURITY_AUDIT_LOGS 
} from '../constants';

interface MokTrustCenterProps {
  onOpenExpertChat?: (agentId?: string, initialPrompt?: string) => void;
  onOpenDisputeCenter?: () => void;
  onOpenReportModal?: (listingId?: string, productTitle?: string) => void;
}

export const MokTrustCenter: React.FC<MokTrustCenterProps> = ({
  onOpenExpertChat,
  onOpenDisputeCenter,
  onOpenReportModal
}) => {
  // Navigation inside Mok Trust
  const [activeTrustTab, setActiveTrustTab] = useState<
    'overview' | 'badges' | 'kyc_vault' | 'kyb_company' | 'sessions_mfa' | 'risk_radar' | 'compliance_policies' | 'audit_logs'
  >('overview');

  // State
  const [trustLevel, setTrustLevel] = useState<MokTrustLevel>(3); // Level 3: Entreprise vérifiée
  const [badgesList, setBadgesList] = useState<MokTrustBadge[]>(MOCK_MOK_TRUST_BADGES);
  const [kycDocs, setKycDocs] = useState<KycDocument[]>(MOCK_KYC_DOCUMENTS);
  const [kybProfile, setKybProfile] = useState<CompanyKybProfile>(MOCK_COMPANY_KYB_PROFILE);
  const [sessions, setSessions] = useState<SecuritySession[]>(MOCK_SECURITY_SESSIONS);
  const [riskSignals, setRiskSignals] = useState<InternalRiskSignal[]>(MOCK_INTERNAL_RISK_SIGNALS);
  const [policies] = useState<ProductCompliancePolicy[]>(MOCK_PRODUCT_COMPLIANCE_POLICIES);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>(MOCK_SECURITY_AUDIT_LOGS);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Compromised Account Modal state
  const [showCompromisedModal, setShowCompromisedModal] = useState(false);
  const [isAccountLocked, setIsAccountLocked] = useState(false);

  // New Document Upload form state
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [newDocType, setNewDocType] = useState<KycDocument['documentType']>('commercial_license');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocExpires, setNewDocExpires] = useState('2027-12-31');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}`,
      action: 'Révocation à distance d\'une session de connexion',
      category: 'account_security',
      actorName: 'Amadou Diallo',
      actorRole: 'user',
      timestamp: 'À l\'instant',
      ipAddress: '197.149.88.42',
      status: 'reussi',
      details: `Session ID ${sessionId} déconnectée de force.`
    };
    setAuditLogs([newLog, ...auditLogs]);
    showToast('Session révoquée avec succès. L\'appareil distant a été déconnecté.');
  };

  const handleUploadKycDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: KycDocument = {
      id: `kyc-doc-${Date.now()}`,
      title: newDocTitle,
      documentType: newDocType,
      documentNumber: newDocNumber || 'DOC-2026-VAL',
      issuedCountry: 'Guinée',
      issuedAt: 'Aujourd\'hui',
      expiresAt: newDocExpires,
      status: 'en_verification',
      fileSize: '2.1 MB',
      confidentialityLevel: 'strictly_confidential',
      sha256Hash: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`
    };

    setKycDocs([newDoc, ...kycDocs]);
    setIsUploadDocOpen(false);
    setNewDocTitle('');
    setNewDocNumber('');
    showToast(`Document « ${newDocTitle} » déposé dans le coffre-fort sécurisé. Vérification automatique en cours.`);
  };

  const handleTriggerEmergencyCompromised = () => {
    setIsAccountLocked(true);
    setSessions(sessions.filter(s => s.isCurrentDevice));
    const newLog: SecurityAuditLog = {
      id: `log-${Date.now()}`,
      action: 'PROTOCOLE D\'URGENCE : COMPTE SIGNALÉ COMPROMIS',
      category: 'account_security',
      actorName: 'Amadou Diallo',
      actorRole: 'user',
      timestamp: 'À l\'instant',
      ipAddress: '197.149.88.42',
      status: 'alerte',
      details: 'Toutes les sessions secondaires révoquées. Virements et paiements temporairement gelés. Ticket d\'investigation priorité P0 ouvert.'
    };
    setAuditLogs([newLog, ...auditLogs]);
    setShowCompromisedModal(false);
    showToast('URGENCE ACTIVÉE : Toutes les sessions secondaires ont été détruites et les opérations financières ont été sécurisées.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Account Locked Banner if Emergency triggered */}
      {isAccountLocked && (
        <div className="p-5 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} className="text-rose-400 shrink-0" />
            <div>
              <h4 className="font-extrabold text-white text-sm sm:text-base">
                Verrouillage de Sécurité Actif (Compte en Protection Prioritaire)
              </h4>
              <p className="text-xs text-rose-200">
                Toutes les sessions distantes ont été révoquées et les flux financiers sont placés sous séquestre le temps de l'audit.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAccountLocked(false);
              showToast('Compte déverrouillé après ré-authentification 2FA réussie.');
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shrink-0"
          >
            Déverrouiller avec Clé 2FA
          </button>
        </div>
      )}

      {/* Main Header / Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-emerald-500/30">
                <ShieldCheck size={14} className="text-emerald-400" />
                MOK TRUST ENGINE
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                Niveau {trustLevel} : Entreprise Vérifiée (RCCM / Greffe)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Centre de Confiance, Identité & Conformité Mondiale
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Mok Trust garantit l'intégrité des échanges sur le Marché Mondial : authentification juridique des entreprises, validation des représentants légaux, coffre-fort KYC/KYB crypté, et surveillance anti-fraude sans condamnation arbitraire.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCompromisedModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <AlertOctagon size={16} />
              Mon compte a été piraté
            </button>
            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Pouvez-vous auditer mon dossier KYB et mes licences d\'exportation pour le marché européen ?')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Bot size={16} />
              Auditer avec l'Expert Juriste
            </button>
          </div>
        </div>

        {/* 5-Level Progressive Verification Track */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Échelle de Confiance & Vérification Commerciale :</span>
            <span className="text-indigo-400 font-bold">Éligible aux transactions internationales jusqu'à 500 000 EUR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { level: 0, title: 'Niveau 0', label: 'Non vérifié', desc: 'Compte standard' },
              { level: 1, title: 'Niveau 1', label: 'Identité vérifiée', desc: 'Passeport / CNI' },
              { level: 2, title: 'Niveau 2', label: 'Pro vérifié', desc: 'Activité & Coordonnées' },
              { level: 3, title: 'Niveau 3', label: 'Entreprise vérifiée', desc: 'RCCM, NIF & Statuts' },
              { level: 4, title: 'Niveau 4', label: 'Vérification Renforcée', desc: 'Audit sur site & AML' }
            ].map((lvl) => {
              const isCurrent = lvl.level === trustLevel;
              const isPassed = lvl.level <= trustLevel;
              return (
                <div
                  key={lvl.level}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                      : isPassed 
                        ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                        : 'bg-slate-950/30 border-slate-900 text-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">{lvl.title}</span>
                    {isPassed ? (
                      <CheckCircle2 size={14} className={isCurrent ? 'text-indigo-400' : 'text-emerald-400'} />
                    ) : (
                      <Lock size={12} className="text-slate-600" />
                    )}
                  </div>
                  <div className="font-bold text-xs">{lvl.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Subtabs inside Mok Trust */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Vue Globale', icon: Eye },
          { id: 'badges', label: `Badges Transparents (${badgesList.filter(b => b.isObtained).length}/${badgesList.length})`, icon: Award },
          { id: 'kyc_vault', label: `Coffre-Fort Documents (${kycDocs.length})`, icon: FileCheck },
          { id: 'kyb_company', label: 'Profil Entreprise & Signataire', icon: Building2 },
          { id: 'sessions_mfa', label: `Sessions & 2FA (${sessions.length})`, icon: Smartphone },
          { id: 'risk_radar', label: 'Radar de Risque & Signaux', icon: Sliders },
          { id: 'compliance_policies', label: 'Conformité & Produits', icon: AlertTriangle },
          { id: 'audit_logs', label: 'Journal d\'Audit', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTrustTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTrustTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: VUE GLOBALE & TABLEAU DE BORD DE CONFIANCE
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Trust Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Score de Réputation</span>
                <Award size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">98.6 / 100</div>
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> 142 transactions sans litige
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Statut KYB Entreprise</span>
                <Building2 size={16} className="text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">RCCM Validé</div>
              <p className="text-[11px] text-slate-400">
                Greffe du Tribunal de Commerce
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Protection Séquestre</span>
                <Lock size={16} className="text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">Actif & Garanti</div>
              <p className="text-[11px] text-slate-400">
                Paiements libérés à la livraison
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Indicateur de Risque Interne</span>
                <Sliders size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">Faible</div>
              <p className="text-[11px] text-slate-400">
                Aucune anomalie critique détectée
              </p>
            </div>
          </div>

          {/* Transparent Badges Quick Preview & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Badges de Confiance Certifiés</h3>
                  <p className="text-xs text-slate-400">Visibles par vos partenaires et acheteurs B2B</p>
                </div>
                <button
                  onClick={() => setActiveTrustTab('badges')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Voir tous les badges
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badgesList.map(b => (
                  <div
                    key={b.type}
                    className={`p-4 rounded-2xl border flex items-start gap-3 ${
                      b.isObtained ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      b.isObtained ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {b.isObtained ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-white text-xs">{b.label}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{b.description}</p>
                      {b.isObtained && (
                        <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                          ✓ Certifié le {b.verifiedAt}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Security Center */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Fingerprint size={18} className="text-indigo-400" />
                  Santé de Sécurité du Compte
                </h3>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Authentification Double Facteur (2FA) :</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      Activée (Appli)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Sessions Actives :</span>
                    <span className="text-white font-bold text-xs">{sessions.length} appareils</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Dernier Audit Sécurité :</span>
                    <span className="text-white font-bold text-xs">Aujourd'hui</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTrustTab('kyc_vault')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck size={14} className="text-indigo-400" />
                      Gérer mes Documents KYC/KYB
                    </span>
                    <ChevronRight size={14} />
                  </button>

                  <button
                    onClick={() => onOpenDisputeCenter && onOpenDisputeCenter()}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      Centre de Résolution des Litiges
                    </span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                <strong>Principe Mok Trust :</strong> Plus une transaction est volumineuse, plus les niveaux de séquestre et de vérification sont renforcés automatiquement.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: BADGES TRANSPARENTS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'badges' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-bold text-white">Transparence des Vérifications Mok Trust</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Nous n'affichons jamais un simple « ✓ Vérifié » opaque. Chaque badge détaille exactement ce qui a été vérifié, la date d'authentification et l'organisme ou prestataire tiers accrédité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badgesList.map(badge => (
              <div
                key={badge.type}
                className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 transition-all shadow-md ${
                  badge.isObtained 
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40' 
                    : 'bg-slate-900/50 border-slate-900 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`p-3 rounded-2xl ${
                      badge.isObtained ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Award size={20} />
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      badge.isObtained 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {badge.isObtained ? 'Vérifié & Actif' : 'Non Requis / En Attente'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base">{badge.label}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{badge.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Organisme :</span>
                    <span className="text-slate-200 font-semibold">{badge.issuerOrProvider}</span>
                  </div>
                  {badge.verifiedAt && (
                    <div className="flex justify-between text-slate-400">
                      <span>Date de certification :</span>
                      <span className="text-emerald-400 font-semibold">{badge.verifiedAt}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: COFFRE-FORT KYC / KYB CRYPTÉ
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'kyc_vault' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileCheck size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">Coffre-Fort de Vérification Documentaire</h3>
              </div>
              <p className="text-xs text-slate-400">
                Espace confidentiel et crypté. Les documents d'identité et fiscaux ne sont jamais rendus publics.
              </p>
            </div>

            <button
              onClick={() => setIsUploadDocOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <UploadCloud size={16} />
              Déposer un Document
            </button>
          </div>

          {/* Upload modal / form */}
          {isUploadDocOpen && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-white text-sm">Ajouter un Document au Coffre-Fort</h4>
                <button onClick={() => setIsUploadDocOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleUploadKycDoc} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Type de Document :</label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      <option value="commercial_license">Licence d'Exportation / Agrément</option>
                      <option value="rccm_kbis">Extrait RCCM / Statuts Entreprise</option>
                      <option value="passport">Passeport / CNI Représentant</option>
                      <option value="tax_certificate">Attestation Fiscale / NIF</option>
                      <option value="power_of_attorney">Pouvoir de Signature Mandatée</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Intitulé du Document :</label>
                    <input
                      type="text"
                      placeholder="Ex: Agrément Exportation Café 2026-2027"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                    >
                    </input>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Numéro Officiel / Référence :</label>
                    <input
                      type="text"
                      placeholder="Ex: N° EXP-2026-991"
                      value={newDocNumber}
                      onChange={(e) => setNewDocNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold">Date d'Expiration :</label>
                    <input
                      type="date"
                      value={newDocExpires}
                      onChange={(e) => setNewDocExpires(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadDocOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Chiffrer & Soumettre
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Documents Table */}
          <div className="space-y-3">
            {kycDocs.map(doc => (
              <div
                key={doc.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950 text-indigo-400 shrink-0 mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{doc.title}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] font-mono">
                        {doc.documentNumber}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Délivré en {doc.issuedCountry}</span>
                      <span>•</span>
                      <span>Émis le {doc.issuedAt}</span>
                      <span>•</span>
                      <span className={doc.status === 'expire' || doc.status === 'renouvellement_requis' ? 'text-amber-400 font-bold' : ''}>
                        Expire le {doc.expiresAt}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono text-[10px]">SHA-256: {doc.sha256Hash}</span>
                    </div>
                    {doc.rejectionReason && (
                      <p className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 mt-1">
                        ⚠️ {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    doc.status === 'valide' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    doc.status === 'en_verification' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    doc.status === 'renouvellement_requis' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {doc.status === 'valide' ? '✓ Validé' :
                     doc.status === 'en_verification' ? '⏳ En vérification' :
                     doc.status === 'renouvellement_requis' ? '⚠️ Renouvellement Requis' : 'Rejeté'}
                  </span>

                  {doc.status === 'renouvellement_requis' && (
                    <button
                      onClick={() => {
                        setKycDocs(kycDocs.map(d => d.id === doc.id ? { ...d, status: 'en_verification', rejectionReason: undefined, expiresAt: '31/12/2027' } : d));
                        showToast(`Nouveau scan transmis pour « ${doc.title} ». Audit en cours.`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all"
                    >
                      Renouveler Scan
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: PROFIL KYB ENTREPRISE & REPRÉSENTANT MANDATÉ
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'kyb_company' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{kybProfile.countryFlag}</span>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl">{kybProfile.legalName}</h3>
                </div>
                <p className="text-xs text-indigo-400 font-semibold">Nom Commercial : {kybProfile.tradeName}</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold border border-emerald-500/30">
                KYB Niveau 3 Certifié
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Company Legal Registrations */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-400" />
                  Immatriculation & Siège Social
                </h4>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Numéro RCCM :</span>
                    <span className="font-mono text-white">{kybProfile.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Numéro d'Identification Fiscale (NIF) :</span>
                    <span className="font-mono text-white">{kybProfile.taxIdentificationNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Adresse de l'Établissement :</span>
                    <span className="text-right text-white max-w-xs">{kybProfile.headquartersAddress}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Vérification de l'Adresse :</span>
                    <span className="text-emerald-400 font-bold">✓ Audit & Justificatif Valide</span>
                  </div>
                </div>
              </div>

              {/* Legal Representative & Mandate */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                  <UserCheck size={16} className="text-indigo-400" />
                  Représentant Légal & Pouvoirs
                </h4>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Titulaire du Mandat :</span>
                    <span className="font-bold text-white">{kybProfile.legalRepresentative.fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Qualité / Rôle Statutaire :</span>
                    <span className="text-white">{kybProfile.legalRepresentative.role}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Pouvoir d'Engager Juridiquement :</span>
                    <span className="text-emerald-400 font-bold">✓ Mandataire Agréé</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Contrôle Identité du Dirigeant :</span>
                    <span className="text-emerald-400 font-bold">✓ Passeport Certifié</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payout & Escrow Account */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Compte de Règlement & Séquestre :</span>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock size={15} className="text-emerald-400" />
                  {kybProfile.payoutAccount.bankName} ({kybProfile.payoutAccount.ibanOrAccountMasked})
                </div>
                <p className="text-xs text-slate-400">Titulaire : {kybProfile.payoutAccount.accountHolder}</p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                ✓ Conforme AML / KYC Bancaire
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: SESSIONS ACTIVES & AUTHENTIFICATION FORTE (2FA)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'sessions_mfa' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-base sm:text-lg">Sécurité des Sessions & Appareils Connectés</h3>
                <p className="text-xs text-slate-400">
                  Gérez vos connexions actives et révoquez à distance les appareils inconnus ou partagés.
                </p>
              </div>

              <button
                onClick={() => {
                  setSessions(sessions.filter(s => s.isCurrentDevice));
                  showToast('Toutes les autres sessions distantes ont été révoquées.');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold transition-all border border-slate-700"
              >
                Déconnecter tous les autres appareils
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    session.isCurrentDevice ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                      session.isCurrentDevice ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {session.deviceName.includes('Phone') ? <Smartphone size={20} /> : <Laptop size={20} />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-xs sm:text-sm">{session.deviceName}</h4>
                        {session.isCurrentDevice && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase">
                            Appareil Actuel
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                        <span>{session.browser}</span>
                        <span>•</span>
                        <span>IP : {session.ipAddress}</span>
                        <span>•</span>
                        <span>{session.location}</span>
                        <span>•</span>
                        <span className="text-slate-300">{session.lastActive}</span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrentDevice && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all flex items-center gap-1.5"
                    >
                      <LogOut size={13} />
                      Déconnecter
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: RADAR DE RISQUE & SIGNAUX D'ANOMALIES
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'risk_radar' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sliders size={14} />
                Moteur d'Analyse des Signaux de Risque
              </span>
              <h3 className="text-xl font-bold text-white">Principe Anti-Fraude : Anomalie ≠ Condamnation</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Mok Trust n'accuse jamais automatiquement. Lorsqu'un signal inhabituel (changement de compte, vélocité anormale, nouvelle adresse IP) apparaît, le système ralentit l'opération ou sollicite une confirmation 2FA / revue humaine sans pénaliser la réputation du commerçant.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {riskSignals.map(sig => (
              <div
                key={sig.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${
                    sig.scoreLevel === 'eleve' || sig.scoreLevel === 'revue_necessaire' 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : sig.scoreLevel === 'modere' 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{sig.title}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-extrabold ${
                        sig.scoreLevel === 'modere' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        Niveau {sig.scoreLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{sig.description}</p>
                    <span className="text-[10px] text-slate-500 block">Détecté : {sig.detectedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRiskSignals(riskSignals.map(s => s.id === sig.id ? { ...s, status: 'cleared' } : s));
                      showToast(`Signal « ${sig.title} » clôturé après vérification.`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                  >
                    Marquer Conforme
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: CONFORMITÉ PRODUITS & POLITIQUES
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'compliance_policies' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Politiques de Conformité des Marchandises</h3>
              <p className="text-xs text-slate-400">
                Classification des catégories sensibles, obligations documentaires et protection contre la contrefaçon.
              </p>
            </div>

            <button
              onClick={() => onOpenReportModal && onOpenReportModal()}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <AlertTriangle size={16} />
              Signaler une Contrefaçon / Atteinte IP
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map(pol => (
              <div key={pol.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{pol.categoryName}</h4>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    pol.status === 'autorise' ? 'bg-emerald-500/20 text-emerald-300' :
                    pol.status === 'soumis_verification' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {pol.status === 'autorise' ? 'Autorisé' :
                     pol.status === 'soumis_verification' ? 'Contrôle Requis' : 'Interdit'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{pol.description}</p>

                {pol.mandatoryDocuments.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Documents Obligatoires :</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                      {pol.mandatoryDocuments.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 8: JOURNAL D'AUDIT SÉCURITÉ
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTrustTab === 'audit_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base">Journal d'Audit Immuable</h3>
              <p className="text-xs text-slate-400">Traçabilité complète des actions sensibles et accès sécurisés.</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Total {auditLogs.length} événements</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px] uppercase">
                      {log.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">{log.details}</p>
                </div>

                <div className="text-right shrink-0 text-slate-500 text-[11px]">
                  <div>{log.timestamp}</div>
                  <div className="font-mono text-[10px]">Par {log.actorName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: PROTOCOLE MON COMPTE A ÉTÉ PIRATÉ
         ══════════════════════════════════════════════════════════════════════ */}
      {showCompromisedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-4">
              <ShieldAlert size={28} />
              <div>
                <h3 className="font-black text-white text-lg">Protocole d'Urgence : Compte Compromis</h3>
                <p className="text-xs text-rose-300">Action immédiate de protection de vos actifs commerciaux</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>En déclenchant cette procédure d'urgence :</p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <li>Toutes les sessions connectées (mobiles, ordinateurs) sont <strong>immédiatement révoquées</strong>.</li>
                <li>Les ordres de virement bancaire et modifications de coordonnées sont <strong>gelés sous séquestre 48h</strong>.</li>
                <li>Un mot de passe temporaire à usage unique (OTP) sera exigé à votre prochaine reconnexion.</li>
                <li>L'équipe Sentinel & Support Diallo OS prend en charge l'investigation sous priorité maximale.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCompromisedModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleTriggerEmergencyCompromised}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
              >
                Confirmer l'Urgence & Sécuriser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
