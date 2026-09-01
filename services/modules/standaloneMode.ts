/**
 * Mode « module autonome » : détection de la route d'un module exportable,
 * bascule du manifeste vers celui du module, et lecture du contexte
 * d'exécution (application installée ? iOS ?).
 *
 * Ces fonctions sont pures vis-à-vis de React : `applyModuleManifest` est
 * appelée dans index.tsx AVANT le premier rendu, pour que le navigateur
 * évalue l'installabilité de la page avec le manifeste du module et non
 * celui de l'application principale.
 */

import { EXPORTABLE_MODULES, ExportableModule, findModuleByPath } from '../../modules/moduleRegistry';

/** `/?module=messagerie` : forme de repli quand la route réécrite n'est pas servie (aperçu local). */
export const MODULE_QUERY_PARAM = 'module';

/**
 * Module autonome demandé par l'URL : la route (`/messagerie`, servie par la
 * redirection Netlify) ou le paramètre `?module=messagerie`. `null` sinon —
 * l'application principale se rend normalement.
 */
export const detectStandaloneModule = (pathname: string, search: string): ExportableModule | null => {
  const byPath = findModuleByPath(pathname);
  if (byPath) return byPath;
  try {
    const wanted = new URLSearchParams(search || '').get(MODULE_QUERY_PARAM);
    if (!wanted) return null;
    const id = wanted.trim().toLowerCase();
    return EXPORTABLE_MODULES.find((module) => module.id === id) ?? null;
  } catch {
    return null;
  }
};

/**
 * Vrai quand la page tourne dans une application installée (fenêtre sans
 * barre d'adresse) : `display-mode: standalone` (Android/Chrome, bureau) ou
 * `navigator.standalone` (Safari iOS, ajout à l'écran d'accueil).
 */
export const isRunningInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)')?.matches) {
      return true;
    }
  } catch {
    /* matchMedia indisponible ou capricieux : on ne conclut rien */
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav?.standalone === true;
};

/** Chemin (pathname) du manifeste actuellement lié au document, `null` s'il n'y en a pas. */
export const currentManifestPath = (): string | null => {
  if (typeof document === 'undefined') return null;
  const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.getAttribute('href');
  if (!href) return null;
  try {
    return new URL(href, window.location.href).pathname;
  } catch {
    return href;
  }
};

/** Vrai quand le document lie le manifeste de CE module — c'est-à-dire sur sa page autonome. */
export const isModulePage = (module: ExportableModule): boolean => currentManifestPath() === module.manifestPath;

/**
 * Remplace (ou crée) `<link rel="manifest">` pour pointer vers le manifeste du
 * module. À appeler avant le rendu React : le navigateur associe la page — et
 * donc l'invitation d'installation — au manifeste lié à ce moment-là.
 */
export const applyModuleManifest = (module: ExportableModule): HTMLLinkElement | null => {
  if (typeof document === 'undefined' || !document.head) return null;
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'manifest');
    document.head.appendChild(link);
  }
  link.setAttribute('href', module.manifestPath);
  link.setAttribute('data-module', module.id);
  return link;
};

interface DeviceHints {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}

/**
 * iPhone, iPad ou iPod — y compris l'iPad récent qui se présente comme un Mac
 * (« MacIntel ») et que seul son écran tactile trahit. Les indices sont
 * injectables pour les tests ; par défaut, ceux du navigateur courant.
 */
export const isIOS = (hints: DeviceHints = {}): boolean => {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const userAgent = hints.userAgent ?? nav?.userAgent ?? '';
  const platform = hints.platform ?? nav?.platform ?? '';
  const maxTouchPoints = hints.maxTouchPoints ?? nav?.maxTouchPoints ?? 0;
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return platform === 'MacIntel' && maxTouchPoints > 1;
};
