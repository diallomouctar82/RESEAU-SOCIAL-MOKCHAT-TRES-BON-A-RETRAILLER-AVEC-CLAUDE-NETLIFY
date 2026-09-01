/**
 * Invitation d'installation (PWA) des modules exportables.
 *
 * Le navigateur émet `beforeinstallprompt` UNE fois, tôt, quand la page est
 * installable ; si personne ne l'a retenu à ce moment-là, l'installation ne
 * peut plus être proposée depuis notre interface. Ce module est donc importé
 * par index.tsx avant tout rendu, uniquement pour son effet de capture.
 *
 * Point essentiel : une invitation appartient au manifeste lié à la page au
 * moment où elle est émise. Sur la page de l'application principale, c'est
 * MokNet qui s'installerait ; seule la page autonome du module
 * (`/messagerie`, manifeste substitué par index.tsx) produit une invitation
 * pour la messagerie. Le chemin du manifeste est donc mémorisé à la capture
 * et vérifié à chaque usage — jamais de « Installer la messagerie » qui
 * installerait autre chose.
 */

import { currentManifestPath, isIOS, isModulePage, isRunningInstalled } from './standaloneMode';
import { ExportableModule } from '../../modules/moduleRegistry';

export type InstallState =
  /** Le navigateur a émis une invitation POUR CE MODULE : `promptInstall()` l'affichera. */
  | 'installable'
  /** Déjà installée (invitation acceptée ici, `appinstalled` reçu, ou page ouverte dans l'application installée). */
  | 'installed'
  /** iPhone/iPad : pas d'invitation programmatique, l'ajout se fait via Partager → « Sur l'écran d'accueil ». */
  | 'ios-manual'
  /** Nous ne sommes pas sur la page du module : l'installation se propose depuis sa page autonome. */
  | 'via-module-page'
  /** Sur la page du module, sans invitation : navigateur sans prise en charge, critères non réunis, ou déjà installée sans que nous le sachions. */
  | 'unsupported';

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

const INSTALLED_FLAG_PREFIX = 'moknet_pwa_installed:';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
/** Manifeste de la page au moment de la capture — l'invitation vaut pour lui seul. */
let deferredPromptManifest: string | null = null;
/** Manifestes dont l'installation a été confirmée pendant cette session. */
const installedThisSession = new Set<string>();
const listeners = new Set<() => void>();

const manifestKey = (manifestPath: string | null): string => manifestPath ?? '(aucun manifeste)';

const notify = (): void => {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      /* un auditeur défaillant ne doit pas priver les autres */
    }
  }
};

const readInstalledFlag = (manifestPath: string | null): boolean => {
  try {
    return window.localStorage.getItem(INSTALLED_FLAG_PREFIX + manifestKey(manifestPath)) === '1';
  } catch {
    return false;
  }
};

const writeInstalledFlag = (manifestPath: string | null, installed: boolean): void => {
  try {
    const key = INSTALLED_FLAG_PREFIX + manifestKey(manifestPath);
    if (installed) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    /* stockage indisponible (navigation privée stricte) : l'état vivra le temps de la session */
  }
};

const onBeforeInstallPrompt = (event: Event): void => {
  // Pas de mini-barre du navigateur : l'installation se propose depuis nos
  // propres boutons, au moment choisi par l'utilisateur.
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  deferredPromptManifest = currentManifestPath();
  // Le navigateur propose d'installer cette application : elle n'est donc
  // pas (ou plus) installée dans ce profil — un drapeau résiduel serait faux.
  installedThisSession.delete(manifestKey(deferredPromptManifest));
  writeInstalledFlag(deferredPromptManifest, false);
  notify();
};

const onAppInstalled = (): void => {
  const manifest = deferredPromptManifest ?? currentManifestPath();
  deferredPrompt = null;
  deferredPromptManifest = null;
  installedThisSession.add(manifestKey(manifest));
  writeInstalledFlag(manifest, true);
  notify();
};

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
}

/**
 * État d'installation pour un module (ou, sans argument, pour l'application
 * dont le manifeste est lié à la page courante).
 */
export const getInstallState = (module?: ExportableModule): InstallState => {
  const manifest = module ? module.manifestPath : currentManifestPath();
  const onThisPage = module ? isModulePage(module) : true;

  if (onThisPage && isRunningInstalled()) return 'installed';
  if (installedThisSession.has(manifestKey(manifest))) return 'installed';
  if (deferredPrompt && deferredPromptManifest === manifest) return 'installable';
  if (readInstalledFlag(manifest)) return 'installed';
  if (isIOS()) return 'ios-manual';
  if (!onThisPage) return 'via-module-page';
  return 'unsupported';
};

/**
 * Affiche l'invitation native du navigateur. `unavailable` si aucune
 * invitation n'est disponible pour ce module — dont le cas, refusé
 * volontairement, où l'invitation capturée appartient à une autre application.
 */
export const promptInstall = async (module?: ExportableModule): Promise<InstallOutcome> => {
  const event = deferredPrompt;
  const manifest = module ? module.manifestPath : currentManifestPath();
  if (!event || deferredPromptManifest !== manifest) return 'unavailable';

  // Une même invitation ne se rejoue pas : elle est consommée dès maintenant.
  deferredPrompt = null;
  deferredPromptManifest = null;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice?.outcome === 'accepted') {
      installedThisSession.add(manifestKey(manifest));
      writeInstalledFlag(manifest, true);
      notify();
      return 'accepted';
    }
    notify();
    return 'dismissed';
  } catch {
    notify();
    return 'unavailable';
  }
};

/** Prévient à chaque changement d'état ; renvoie la fonction de désabonnement. */
export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
