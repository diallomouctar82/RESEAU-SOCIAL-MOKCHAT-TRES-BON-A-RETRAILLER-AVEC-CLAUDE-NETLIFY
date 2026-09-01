import React, { useState } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Languages, 
  Eye, 
  Link2, 
  Sparkles, 
  ShieldCheck, 
  X, 
  Check, 
  HardDrive, 
  Calendar, 
  MapPin, 
  Video, 
  MessageSquare,
  Globe,
  Sliders,
  Type,
  Volume2,
  Smartphone
} from 'lucide-react';
import { UserProfile } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../constants';
import { RingtonePicker } from './RingtonePicker';
import { getSelectedRingtoneId } from '../../services/calls/ringtoneService';
import { ModulesSettingsSection } from '../modules/ModulesSettingsSection';

interface UnifiedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  /**
   * ÉQUIPE 9 (Audio & Sonneries) : type élargi (sans rien casser — Layout
   * passe déjà une fonction Promise<boolean>) pour pouvoir lire le résultat
   * réel de la persistance : le picker de sonnerie n'affiche « Enregistré »
   * que si la promesse a répondu `true`.
   */
  onUpdateProfile?: (updated: Partial<UserProfile>) => void | Promise<boolean>;
}

export const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile
}) => {
  const [activeSection, setActiveSection] = useState<'account' | 'accessibility' | 'connectors' | 'privacy' | 'notifications' | 'modules'>('accessibility');

  // Accessibility States
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);
  const [autoVoiceTTS, setAutoVoiceTTS] = useState(true);

  // Connectors States
  const [connectors, setConnectors] = useState({
    drive: true,
    calendar: true,
    maps: true,
    meet: true,
    chat: true
  });

  const toggleConnector = (key: keyof typeof connectors) => {
    setConnectors(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unified-settings-title"
    >
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
                <Settings size={20} />
              </div>
              <div>
                <h2 id="unified-settings-title" className="text-base font-black text-white">Paramètres</h2>
                <p className="text-[11px] text-slate-400">Le Monde à Vous • Préférences</p>
              </div>
            </div>

            <nav className="space-y-1.5" aria-label="Sections des paramètres">
              <button
                onClick={() => setActiveSection('accessibility')}
                aria-current={activeSection === 'accessibility' ? 'true' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  activeSection === 'accessibility'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye size={16} /> Accessibilité & Vue
              </button>

              <button
                onClick={() => setActiveSection('connectors')}
                aria-current={activeSection === 'connectors' ? 'true' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  activeSection === 'connectors'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Link2 size={16} /> Connecteurs & Services
              </button>

              <button
                onClick={() => setActiveSection('account')}
                aria-current={activeSection === 'account' ? 'true' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  activeSection === 'account'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <User size={16} /> Compte & Identité
              </button>

              <button
                onClick={() => setActiveSection('privacy')}
                aria-current={activeSection === 'privacy' ? 'true' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  activeSection === 'privacy'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck size={16} /> Confidentialité & IA
              </button>

              <button
                onClick={() => setActiveSection('notifications')}
                aria-current={activeSection === 'notifications' ? 'true' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  activeSection === 'notifications'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Bell size={16} /> Notifications & Alertes
              </button>

              {/* Architecture modulaire exportable : installer un module
                  (la messagerie d'abord) comme application autonome sur le
                  téléphone — section pilotée par modules/moduleRegistry.ts. */}
              <button
                onClick={() => setActiveSection('modules')}
                aria-current={activeSection === 'modules' ? 'true' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                  activeSection === 'modules'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Smartphone size={16} /> Modules & applications
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-medium">
            Version DS 1.0 • Accessibilité WCAG AA
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50">
          
          {/* Header Bar */}
          <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">
              {activeSection === 'accessibility' && "Accessibilité & Ergonomie Visuelle"}
              {activeSection === 'connectors' && "Gestion des Connecteurs & Intégrations"}
              {activeSection === 'account' && "Profil & Paramètres Personnels"}
              {activeSection === 'privacy' && "Confidentialité & Données IA"}
              {activeSection === 'notifications' && "Préférences de Notifications"}
              {activeSection === 'modules' && "Modules & Applications sur mon Téléphone"}
            </h3>

            <button
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label="Fermer les paramètres"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Panels */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            
            {/* ACCESSIBILITY PANEL */}
            {activeSection === 'accessibility' && (
              <div className="space-y-6">
                
                {/* Taille du Texte */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Type size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">Taille du Texte & Lisibilité</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ajuste la taille typographique globale de la plateforme pour un confort optimal.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['normal', 'large', 'xlarge'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setTextSize(size)}
                        aria-pressed={textSize === size}
                        className={`p-3 min-h-[44px] rounded-xl border text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                          textSize === size
                            ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {size === 'normal' && "Standard (100%)"}
                        {size === 'large' && "Agrandie (115%)"}
                        {size === 'xlarge' && "Très Grande (130%)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Synthèse Vocale & Audio */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Volume2 size={18} className="text-blue-600" />
                      <span className="text-sm font-bold text-slate-900">Lecture Audio Automatique (Diallo Voice)</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Permet à Diallo OS d'expliquer vocalement les synthèses et les étapes des démarches.
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoVoiceTTS(!autoVoiceTTS)}
                    role="switch"
                    aria-checked={autoVoiceTTS}
                    aria-label="Lecture Audio Automatique (Diallo Voice)"
                    className="p-2.5 -m-2.5 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <span className={`w-12 h-6 rounded-full transition-colors relative block ${
                      autoVoiceTTS ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        autoVoiceTTS ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </span>
                  </button>
                </div>

                {/* Contraste Élevé */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye size={18} className="text-blue-600" />
                      <span className="text-sm font-bold text-slate-900">Contraste Élevé & Bordures Renforcées</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Améliore la distinction visuelle des bordures, boutons et textes (Conformité WCAG AAA).
                    </p>
                  </div>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    role="switch"
                    aria-checked={highContrast}
                    aria-label="Contraste Élevé & Bordures Renforcées"
                    className="p-2.5 -m-2.5 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <span className={`w-12 h-6 rounded-full transition-colors relative block ${
                      highContrast ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        highContrast ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </span>
                  </button>
                </div>

              </div>
            )}

            {/* CONNECTORS PANEL */}
            {activeSection === 'connectors' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 text-xs text-blue-950 font-medium">
                  Les services Google Workspace sont intégrés au cœur des démarches et des échanges avec les experts Diallo.
                </div>

                {[
                  { key: 'drive', label: 'Google Drive LMAV', desc: 'Archivage sécurisé des diplômes, visas et factures', icon: HardDrive },
                  { key: 'calendar', label: 'Google Calendar', desc: 'Synchronisation des rendez-vous d\'experts et webinaires', icon: Calendar },
                  { key: 'maps', label: 'Google Maps & Lieux', desc: 'Cartographie des logements, ambassades et partenaires', icon: MapPin },
                  { key: 'meet', label: 'Google Meet', desc: 'Consultations vidéo directes avec les experts Diallo', icon: Video },
                  { key: 'chat', label: 'Google Chat & MOC', desc: 'Messagerie instantanée d\'équipe et de réseau', icon: MessageSquare }
                ].map((item) => {
                  const Icon = item.icon;
                  const isConnected = (connectors as any)[item.key];
                  return (
                    <div key={item.key} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{item.label}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isConnected ? 'Connecté' : 'Non connecté'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleConnector(item.key as any)}
                        className={`px-3.5 py-1.5 min-h-[44px] rounded-xl text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                          isConnected
                            ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isConnected ? 'Gérer' : 'Connecter'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ACCOUNT PANEL */}
            {activeSection === 'account' && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={userProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h4 className="text-base font-black text-slate-900">{userProfile.name}</h4>
                      <p className="text-xs text-slate-500">{userProfile.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {userProfile.role || 'Membre Titulaire'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LOOP 13/17 (mémoire contextuelle, préférence durable) :
                    `profiles.preferred_language` existe et est déjà lu
                    (ex. MoocChatFloating.tsx) mais n'avait jusqu'ici aucun
                    écran pour l'écrire — ce sélecteur est le premier. */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Languages size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">Langue Préférée</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => onUpdateProfile?.({ preferredLanguage: lang.code })}
                        aria-pressed={userProfile.preferredLanguage === lang.code}
                        className={`px-3 py-2 min-h-[44px] rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                          userProfile.preferredLanguage === lang.code
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <span>{lang.flag}</span> {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY PANEL */}
            {activeSection === 'privacy' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-600 leading-relaxed">
                <h4 className="text-sm font-bold text-slate-900">Souveraineté des Données & Éthique Diallo</h4>
                <p>
                  Vos documents personnels et dossiers administratifs sont chiffrés. Les interactions avec les experts de la Famille Diallo respectent la stricte déontologie humaine et professionnelle de la plateforme.
                </p>
              </div>
            )}

            {/* NOTIFICATIONS PANEL */}
            {activeSection === 'notifications' && (
              <div className="space-y-4">
                {/* LOOP 09/17 (notifications, orchestration proactive) : ce
                    panneau affichait un texte statique prétendant déjà
                    filtrer les alertes par criticité — aucun réglage
                    n'existait nulle part. Premier réglage réel, persisté
                    sur `profiles.privacy_settings`. */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell size={18} className="text-blue-600" />
                      <span className="text-sm font-bold text-slate-900">Mode Silencieux</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Éteint le badge rouge de la cloche pour réduire l'interruption. Chaque notification continue d'arriver normalement dans le panneau — rien n'est masqué ni supprimé.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateProfile?.({
                      privacySettings: {
                        ...userProfile.privacySettings,
                        notificationsMuted: !userProfile.privacySettings?.notificationsMuted,
                      },
                    })}
                    role="switch"
                    aria-checked={!!userProfile.privacySettings?.notificationsMuted}
                    aria-label="Mode Silencieux"
                    className="p-2.5 -m-2.5 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    <span className={`w-12 h-6 rounded-full transition-colors relative block ${
                      userProfile.privacySettings?.notificationsMuted ? 'bg-blue-600' : 'bg-slate-300'
                    }`}>
                      <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        userProfile.privacySettings?.notificationsMuted ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </span>
                  </button>
                </div>

                {/* ÉQUIPE 9 (Audio & Sonneries) : sonnerie d'appel entrant.
                    Même chemin de persistance que le mode silencieux
                    ci-dessus (onUpdateProfile → profiles.privacy_settings) ;
                    le picker tient de son côté le cache local
                    `lmav_ringtone_v1` lu par startRinging(). « Enregistré »
                    n'est affiché que si la promesse a répondu `true`. */}
                <RingtonePicker
                  selectedId={userProfile.privacySettings?.ringtoneId ?? getSelectedRingtoneId()}
                  onSelect={async (id: string) => {
                    if (!onUpdateProfile) return undefined; // aucun canal de persistance : ne rien prétendre
                    const ok = await Promise.resolve(onUpdateProfile({
                      privacySettings: {
                        ...userProfile.privacySettings,
                        ringtoneId: id,
                      },
                    }));
                    return ok === true;
                  }}
                />
              </div>
            )}

            {/* MODULES PANEL — modules exportables, installables comme
                applications autonomes (même compte, mêmes données). */}
            {activeSection === 'modules' && <ModulesSettingsSection />}

          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 min-h-[44px] rounded-xl transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Enregistrer & Fermer
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
