import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { CheckCircle2, Download, ExternalLink, Info, Share, Smartphone, SquarePlus, X } from 'lucide-react';
import { ExportableModule } from '../../modules/moduleRegistry';
import {
  InstallOutcome,
  InstallState,
  getInstallState,
  promptInstall,
  subscribe,
} from '../../services/modules/installPrompt';
import { isModulePage, isRunningInstalled } from '../../services/modules/standaloneMode';

/**
 * Point d'installation réutilisable d'un module exportable.
 *
 * Un seul composant pour tous les points d'entrée (Paramètres aujourd'hui,
 * barre du module, futur bouton de messagerie) : il lit l'état réel de
 * l'installation et n'affiche jamais un bouton qui ne ferait rien —
 * quand l'installation n'est pas proposée, il le dit.
 *
 *  - `installable`     → « Installer … sur mon téléphone » (invitation native)
 *  - `installed`       → « Déjà installée » + « Ouvrir »
 *  - `ios-manual`      → fiche en 3 étapes (Partager → Sur l'écran d'accueil → Ajouter)
 *  - `via-module-page` → ouvre la page autonome du module, où l'invitation est la sienne
 *  - `unsupported`     → phrase honnête, après un court délai de vérification
 *
 * Toujours, hors page du module : un lien « Ouvrir … en plein écran ».
 */

interface InstallModuleButtonProps {
  module: ExportableModule;
  /** Barre du module : un seul bouton « Installer » ; la fiche iOS s'ouvre en panneau. */
  compact?: boolean;
  /**
   * `beforeinstallprompt` arrive souvent APRÈS le chargement : avant
   * d'affirmer « non proposé », on laisse ce délai (ms) au navigateur.
   */
  unsupportedGraceMs?: number;
  className?: string;
  /** Fiche affichée en feuille refermable (barre du module) : bouton « fermer » dans son en-tête. */
  onClose?: () => void;
}

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

const useInstallState = (module: ExportableModule): InstallState =>
  useSyncExternalStore(subscribe, () => getInstallState(module));

const openRoute = (module: ExportableModule, withInstallSheet: boolean): void => {
  const target = withInstallSheet ? `${module.route}?installer=1` : module.route;
  try {
    window.location.assign(target);
  } catch {
    /* navigation refusée : le lien secondaire reste disponible */
  }
};

const IosSteps: React.FC<{ module: ExportableModule; onModulePage: boolean }> = ({ module, onModulePage }) => (
  <div className="space-y-2">
    <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-700 leading-relaxed">
      {!onModulePage && (
        <li>
          Ouvrez {module.labelInSentence} en plein écran dans <strong>Safari</strong> (lien ci-dessous).
        </li>
      )}
      <li>
        <Share size={14} className="inline-block -mt-0.5 mr-1 text-blue-600" aria-hidden="true" />
        Touchez le bouton <strong>Partager</strong> de Safari (le carré avec une flèche vers le haut).
      </li>
      <li>
        <SquarePlus size={14} className="inline-block -mt-0.5 mr-1 text-blue-600" aria-hidden="true" />
        Choisissez <strong>« Sur l'écran d'accueil »</strong>.
      </li>
      <li>
        Touchez <strong>« Ajouter »</strong> : l'icône « {module.shortName} » apparaît sur votre écran d'accueil.
      </li>
    </ol>
    <p className="text-[11px] text-slate-500 leading-relaxed">
      Sur iPhone et iPad, l'application installée a son propre espace de stockage : à sa première
      ouverture, connectez-vous une fois avec votre compte MokNet — ensuite, conversations,
      notifications et réglages restent synchronisés par le compte.
    </p>
  </div>
);

export const InstallModuleButton: React.FC<InstallModuleButtonProps> = ({
  module,
  compact = false,
  unsupportedGraceMs = 3000,
  className = '',
  onClose,
}) => {
  const state = useInstallState(module);
  const onModulePage = isModulePage(module);
  const [busy, setBusy] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<InstallOutcome | null>(null);
  const [iosPanelOpen, setIosPanelOpen] = useState(false);
  const [graceOver, setGraceOver] = useState(unsupportedGraceMs <= 0);

  useEffect(() => {
    if (unsupportedGraceMs <= 0) return undefined;
    const timer = window.setTimeout(() => setGraceOver(true), unsupportedGraceMs);
    return () => window.clearTimeout(timer);
  }, [unsupportedGraceMs]);

  const handleInstall = async () => {
    setBusy(true);
    try {
      setLastOutcome(await promptInstall(module));
    } finally {
      setBusy(false);
    }
  };

  const outcomeMessage: Record<InstallOutcome, string> = {
    accepted: `Installation lancée : l'icône « ${module.shortName} » apparaît sur votre écran d'accueil.`,
    dismissed: 'Installation annulée. Vous pourrez réessayer après avoir rechargé la page.',
    unavailable: "L'invitation d'installation n'est plus disponible — rechargez la page pour réessayer.",
  };

  /* ─── Variante compacte (barre du module) ─── */
  if (compact) {
    if (lastOutcome) {
      return (
        <span role="status" className={`text-[11px] font-bold text-white/90 px-2 ${className}`}>
          {lastOutcome === 'accepted' ? 'Installation lancée' : 'Installation annulée'}
        </span>
      );
    }
    if (state === 'installable') {
      return (
        <button
          type="button"
          onClick={handleInstall}
          disabled={busy}
          className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 ${FOCUS_RING} focus-visible:ring-offset-slate-900 ${className}`}
        >
          <Download size={14} aria-hidden="true" />
          <span>{busy ? 'Installation…' : 'Installer'}</span>
        </button>
      );
    }
    if (state === 'ios-manual') {
      return (
        <>
          <button
            type="button"
            onClick={() => setIosPanelOpen((open) => !open)}
            aria-expanded={iosPanelOpen}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors ${FOCUS_RING} focus-visible:ring-offset-slate-900 ${className}`}
          >
            <Download size={14} aria-hidden="true" />
            <span>Installer</span>
          </button>
          {iosPanelOpen && (
            <div
              role="dialog"
              aria-label={`Installer ${module.labelInSentence} sur iPhone ou iPad`}
              className="fixed inset-x-3 z-[75] max-w-md ml-auto rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl p-4 space-y-3"
              style={{ top: 'calc(var(--moknet-module-topbar, 44px) + 8px)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Smartphone size={16} className="text-blue-600" aria-hidden="true" />
                  Sur l'écran d'accueil
                </div>
                <button
                  type="button"
                  onClick={() => setIosPanelOpen(false)}
                  aria-label="Fermer les consignes d'installation"
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 ${FOCUS_RING}`}
                >
                  <X size={18} />
                </button>
              </div>
              <IosSteps module={module} onModulePage={onModulePage} />
            </div>
          )}
        </>
      );
    }
    return null;
  }

  /* ─── Variante fiche (Paramètres, feuille d'installation du module) ─── */
  // Après un refus (ou une invitation devenue indisponible), le navigateur ne
  // propose plus rien pour cette page : l'état retombe sur `unsupported`, mais
  // la vérité à afficher est le refus — pas « votre navigateur ne propose pas ».
  const declinedOutcome = state === 'unsupported' && lastOutcome && lastOutcome !== 'accepted' ? lastOutcome : null;
  const statusLabel: Record<InstallState, string> = {
    installable: 'Installation proposée',
    installed: isRunningInstalled() && onModulePage ? 'Version installée' : 'Déjà installée',
    'ios-manual': 'iPhone / iPad',
    'via-module-page': 'Depuis la messagerie',
    unsupported: declinedOutcome ? 'Installation annulée' : graceOver ? 'Non proposée ici' : 'Vérification…',
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Smartphone size={18} className="text-blue-600" aria-hidden="true" />
          <span>Sur mon téléphone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              state === 'installed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {statusLabel[state]}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fiche d'installation"
              className={`-m-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 ${FOCUS_RING}`}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {state === 'installable' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleInstall}
            disabled={busy}
            className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 ${FOCUS_RING}`}
          >
            <Download size={16} aria-hidden="true" />
            <span>{busy ? 'Installation en cours…' : `Installer ${module.labelInSentence} sur mon téléphone`}</span>
          </button>
          {lastOutcome && (
            <p role="status" className="text-[11px] text-slate-600 leading-relaxed">
              {outcomeMessage[lastOutcome]}
            </p>
          )}
        </div>
      )}

      {state === 'installed' && (
        <div className="space-y-2">
          <p className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              {isRunningInstalled() && onModulePage
                ? `Vous utilisez ${module.labelInSentence} dans sa version installée.`
                : `${module.name} est installée sur cet appareil.`}
            </span>
          </p>
          {lastOutcome === 'accepted' && (
            <p role="status" className="text-[11px] text-slate-600 leading-relaxed">
              {outcomeMessage.accepted}
            </p>
          )}
          {!(isRunningInstalled() && onModulePage) && (
            <button
              type="button"
              onClick={() => openRoute(module, false)}
              className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors ${FOCUS_RING}`}
            >
              <ExternalLink size={16} aria-hidden="true" />
              <span>Ouvrir {module.labelInSentence}</span>
            </button>
          )}
        </div>
      )}

      {state === 'ios-manual' && <IosSteps module={module} onModulePage={onModulePage} />}

      {state === 'via-module-page' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => openRoute(module, true)}
            className={`w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors ${FOCUS_RING}`}
          >
            <Download size={16} aria-hidden="true" />
            <span>Installer {module.labelInSentence} sur mon téléphone</span>
          </button>
          <p className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-relaxed">
            <Info size={14} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
            <span>
              L'installation se propose depuis {module.labelInSentence} en plein écran : ce bouton vous y
              conduit, et l'invitation d'installation vous y attend.
            </span>
          </p>
        </div>
      )}

      {state === 'unsupported' && (
        <p role="status" className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
          <Info size={14} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
          <span>
            {declinedOutcome
              ? outcomeMessage[declinedOutcome]
              : graceOver
                ? "Votre navigateur ne propose pas l'installation de cette page pour le moment — soit il ne prend pas en charge l'installation d'applications web, soit l'application est déjà installée. Vous pouvez continuer à utiliser " +
                  module.labelInSentence +
                  ' en plein écran.'
                : "Vérification de la possibilité d'installation…"}
          </span>
        </p>
      )}

      {!onModulePage && (
        <a
          href={module.route}
          className={`inline-flex items-center gap-1.5 min-h-[44px] text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline rounded-lg ${FOCUS_RING}`}
        >
          <ExternalLink size={14} aria-hidden="true" />
          <span>Ouvrir {module.labelInSentence} en plein écran</span>
        </a>
      )}
    </div>
  );
};
