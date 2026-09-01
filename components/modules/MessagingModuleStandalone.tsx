import React, { useEffect, useState } from 'react';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { MemberProfile, UserProfile } from '../../types';
import { MoocChatFloating } from '../MoocChatFloating';
import { findModuleById } from '../../modules/moduleRegistry';
import { isRunningInstalled } from '../../services/modules/standaloneMode';
import { InstallModuleButton } from './InstallModuleButton';

/**
 * La messagerie comme module autonome — ce que rend Layout.tsx à la place de
 * toute l'application quand l'URL est `/messagerie` (ou `?module=messagerie`).
 *
 * Même composant de messagerie que dans l'application principale
 * (<MoocChatFloating>), avec les MÊMES props/handlers que son montage normal
 * dans Layout.tsx : rien n'est dupliqué, la synchronisation est acquise par
 * construction (même session Supabase, mêmes tables, même Realtime, même
 * service worker). S'y ajoutent seulement une fine barre supérieure et un
 * écran de repli visible quand la fenêtre de conversation est fermée.
 */

interface MessagingModuleStandaloneProps {
  currentUser: UserProfile;
  onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<boolean> | void;
  pendingDirectChatMember?: MemberProfile;
  onConsumePendingDirectChatMember?: () => void;
  openWidgetSignal?: number;
  onLogout?: () => void;
}

const TOPBAR_HEIGHT_PX = 44;
/** Variable CSS lue par <MoocChatFloating standalone> pour se caler sous la barre. */
export const MODULE_TOPBAR_CSS_VAR = '--moknet-module-topbar';

const wantsInstallSheet = (): boolean => {
  try {
    return new URLSearchParams(window.location.search).get('installer') === '1';
  } catch {
    return false;
  }
};

export const MessagingModuleStandalone: React.FC<MessagingModuleStandaloneProps> = ({
  currentUser,
  onUpdateProfile,
  pendingDirectChatMember,
  onConsumePendingDirectChatMember,
  openWidgetSignal = 0,
  onLogout,
}) => {
  const module = findModuleById('messagerie');
  const installed = isRunningInstalled();
  // La croix de la liste des conversations ferme la fenêtre ; ici il n'y a
  // pas de bouton flottant pour la rouvrir — ce compteur rejoue le signal
  // d'ouverture que la messagerie connaît déjà (openWidgetSignal).
  const [reopenSignal, setReopenSignal] = useState(0);
  const [installSheetOpen, setInstallSheetOpen] = useState(wantsInstallSheet);

  useEffect(() => {
    if (!module) return undefined;
    const previousTitle = document.title;
    document.title = module.name;
    return () => {
      document.title = previousTitle;
    };
  }, [module]);

  if (!module) return null;

  return (
    <div
      className="h-screen flex flex-col bg-[#f0f2f5] font-sans text-slate-900"
      style={{ [MODULE_TOPBAR_CSS_VAR]: `calc(${TOPBAR_HEIGHT_PX}px + env(safe-area-inset-top, 0px))` } as React.CSSProperties}
      data-module={module.id}
    >
      <header
        role="banner"
        className="shrink-0 bg-slate-900 text-white flex items-center justify-between gap-2 px-3 border-b border-white/10"
        style={{ minHeight: TOPBAR_HEIGHT_PX, paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle size={16} className="text-indigo-300 shrink-0" aria-hidden="true" />
          <span className="text-xs font-extrabold tracking-tight whitespace-nowrap truncate">MokNet · {module.shortName}</span>
          {installed && (
            <span className="hidden sm:inline text-[10px] font-medium text-slate-400">Application installée</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <InstallModuleButton module={module} compact />
          <a
            href="/"
            aria-label="Ouvrir MokNet complet"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap text-white/90 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Ouvrir MokNet complet</span>
            <span className="sm:hidden">MokNet</span>
          </a>
        </div>
      </header>

      {installSheetOpen && (
        <div
          role="region"
          aria-label={`Installer ${module.labelInSentence}`}
          className="fixed inset-x-0 z-[75] px-3 pt-2"
          style={{ top: `var(${MODULE_TOPBAR_CSS_VAR})` }}
        >
          <div className="max-w-md mx-auto">
            <InstallModuleButton module={module} className="shadow-2xl" onClose={() => setInstallSheetOpen(false)} />
          </div>
        </div>
      )}

      {/* Visible seulement quand la fenêtre de conversation (fixed, au-dessus) est fermée. */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
            <MessageCircle size={22} aria-hidden="true" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Si {module.labelInSentence} est fermée, rouvrez-la ici — vos conversations sont conservées.
          </p>
          <button
            type="button"
            onClick={() => setReopenSignal((signal) => signal + 1)}
            className="min-h-[44px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Rouvrir {module.labelInSentence}
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="block mx-auto min-h-[44px] px-3 text-[11px] font-bold text-slate-500 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
            >
              Se déconnecter
            </button>
          )}
        </div>
      </main>

      <MoocChatFloating
        standalone
        currentUser={currentUser}
        onUpdateProfile={onUpdateProfile}
        pendingDirectChatMember={pendingDirectChatMember}
        onConsumePendingDirectChatMember={onConsumePendingDirectChatMember}
        openWidgetSignal={openWidgetSignal + reopenSignal}
      />
    </div>
  );
};
