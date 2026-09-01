/**
 * Service d'enregistrement PWA et gestion du mode Hors-ligne souverain
 */

const SERVICE_WORKER_URL = '/sw.js';

/**
 * Borne d'attente d'un service worker ACTIF : `navigator.serviceWorker.ready`
 * ne se résout que lorsqu'un worker est activé, ce qui peut ne jamais arriver
 * (ancienne version bloquée en `waiting`, navigateur qui refuse le fichier).
 * Jamais une promesse suspendue à vie derrière un bouton « Activer ».
 */
const READY_TIMEOUT_MS = 10_000;

const isServiceWorkerSupported = (): boolean =>
  typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

const registerServiceWorker = (): Promise<ServiceWorkerRegistration> =>
  navigator.serviceWorker.register(SERVICE_WORKER_URL);

export const registerPwaServiceWorker = () => {
  if (!isServiceWorkerSupported()) return;
  const register = () => {
    registerServiceWorker()
      .then((reg) => {
        console.log('✅ Service Worker PWA LMAV enregistré avec succès:', reg.scope);
      })
      .catch((err) => {
        console.info('PWA Service Worker skipped/unavailable in current container environment:', err.message);
      });
  };
  // `load` déjà passé (module chargé tard) : l'événement ne se rejouera pas,
  // on enregistre tout de suite — même comportement, sans dépendre du moment
  // où ce module est évalué.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
};

/**
 * Enregistrement du service worker `/sw.js` à la demande — réutilise celui
 * qui existe, sinon l'enregistre — résolu avec un worker ACTIF :
 * `pushManager.subscribe()` refuse un worker encore en installation
 * (« no active Service Worker »).
 *
 * Nécessaire aux notifications push (Équipe P, mission VF-1) : l'abonnement
 * est créé quand l'utilisateur touche « Activer », bien après l'événement
 * `load` sur lequel `registerPwaServiceWorker` s'appuie. `null` si le
 * navigateur ne supporte pas les service workers ou si l'enregistrement
 * échoue (contexte non sécurisé, fichier absent…) : l'appelant décide quoi
 * afficher, jamais une exception qui remonte jusqu'à l'écran.
 */
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) return null;
  try {
    const container = navigator.serviceWorker;
    const registration = (await container.getRegistration('/')) ?? (await registerServiceWorker());
    if (registration.active) return registration;
    await Promise.race([
      container.ready,
      new Promise<void>((resolve) => setTimeout(resolve, READY_TIMEOUT_MS)),
    ]);
    return registration;
  } catch (err) {
    console.info('Service Worker PWA indisponible dans cet environnement :', err instanceof Error ? err.message : err);
    return null;
  }
};

export const checkNetworkStatus = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
