/**
 * Registre des modules exportables de MokNet.
 *
 * Un module « exportable » est un composant de la plateforme conçu pour vivre
 * DANS l'application principale (orchestrée par App.tsx / Layout.tsx) OU
 * seul, installé sur le téléphone comme une application indépendante — tout
 * en restant synchronisé avec le même compte et les mêmes données : même
 * origine, même session Supabase, mêmes tables, même Realtime, même service
 * worker (`/sw.js`, portée `/`) donc mêmes notifications push.
 *
 * La messagerie est le premier module de référence ; la forme de son entrée
 * est le modèle des suivants. Le contrat complet (registre, route autonome,
 * manifeste, composant plein écran, point d'installation, synchronisation,
 * limites iOS) est décrit dans docs/ARCHITECTURE_MODULAIRE.md.
 */

export type ExportableModuleId = 'messagerie';

export interface ExportableModule {
  /** Identifiant stable ; `"/" + id` est aussi l'`id` du manifeste du module. */
  id: ExportableModuleId;
  /** Nom complet — `name` du manifeste, titre de l'onglet en mode autonome. */
  name: string;
  /** Nom court — `short_name` du manifeste, libellé sous l'icône du téléphone. */
  shortName: string;
  /** Le module dans une phrase, article compris (« Installer la messagerie… »). */
  labelInSentence: string;
  description: string;
  /**
   * Route autonome : `start_url` du manifeste, réécrite vers index.html par
   * Netlify (netlify.toml) — l'application détecte cette route au démarrage
   * (services/modules/standaloneMode.ts) et ne rend que le module.
   */
  route: string;
  /**
   * Manifeste PROPRE au module (public/manifests/…). Substitué au manifeste
   * de l'application avant le premier rendu React (index.tsx) : c'est ce qui
   * fait de la messagerie une application installable DISTINCTE de MokNet
   * sur la même origine (`id` différent).
   */
  manifestPath: string;
  /** Icône 192 px du manifeste — générée par le chantier PWA, référencée par chemin. */
  icon: string;
  /** `theme_color` du manifeste ; doit rester égal à celui du fichier. */
  themeColor: string;
  /** `disponible` : installable aujourd'hui ; `en-preparation` : listé, pas encore détachable. */
  status: 'disponible' | 'en-preparation';
}

export const EXPORTABLE_MODULES: readonly ExportableModule[] = [
  {
    id: 'messagerie',
    name: 'Messagerie MokNet',
    shortName: 'Messagerie',
    labelInSentence: 'la messagerie',
    description:
      'Vos conversations, appels et messages vocaux MokNet dans une application dédiée — même compte, mêmes discussions, mêmes notifications, mêmes réglages.',
    route: '/messagerie',
    manifestPath: '/manifests/messagerie.webmanifest',
    icon: '/icons/icon-192.png',
    themeColor: '#2563eb',
    status: 'disponible',
  },
];

/** Chemin sans barre finale ni majuscules — `/Messagerie/` et `/messagerie` sont la même route. */
const normalisePath = (pathname: string): string => {
  const trimmed = (pathname || '').trim().toLowerCase().replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

export const findModuleById = (id: string): ExportableModule | null =>
  EXPORTABLE_MODULES.find((module) => module.id === (id || '').trim().toLowerCase()) ?? null;

/**
 * Module dont la route autonome correspond au chemin donné : `/messagerie`,
 * `/messagerie/` ou `/messagerie/…` — jamais `/messagerie-autre` ni `/`.
 */
export const findModuleByPath = (pathname: string): ExportableModule | null => {
  const path = normalisePath(pathname);
  return (
    EXPORTABLE_MODULES.find((module) => path === module.route || path.startsWith(`${module.route}/`)) ?? null
  );
};
