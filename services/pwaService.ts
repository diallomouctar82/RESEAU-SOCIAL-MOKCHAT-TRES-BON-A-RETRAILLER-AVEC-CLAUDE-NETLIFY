/**
 * Service d'enregistrement PWA et gestion du mode Hors-ligne souverain
 */

const SERVICE_WORKER_URL = '/sw.js';

/**
 * Borne d'attente d'un service worker ACTIF, par tentative : un worker peut
 * ne jamais s'activer (installation en échec, fichier refusé, réseau coupé).
 * Jamais une promesse suspendue à vie derrière un bouton « Activer ».
 */
const READY_TIMEOUT_MS = 8_000;

/** Cadence de relecture de l'état du worker (filet si `statechange` n'est pas émis). */
const STATE_POLL_MS = 250;

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
 * Mission SN — attend que le worker en cours d'installation (ou en attente)
 * de `registration` devienne ACTIF. Résout `true` dès qu'un worker actif
 * existe, `false` si le worker devient redondant (installation en échec) ou
 * si le délai est écoulé sans activation. Ne lève jamais.
 *
 * Pourquoi c'est nécessaire : `pushManager.subscribe()` refuse un
 * enregistrement sans worker actif (« Subscription failed - no active
 * Service Worker »). L'ancienne attente sur `navigator.serviceWorker.ready`
 * rendait l'enregistrement après 10 s quel que soit son état ; l'abonnement
 * échouait alors avec ce message exact, vu en production sur téléphone.
 */
export const waitForActiveServiceWorker = (
  registration: ServiceWorkerRegistration,
  timeoutMs: number = READY_TIMEOUT_MS,
): Promise<boolean> =>
  new Promise((resolve) => {
    if (registration.active) {
      resolve(true);
      return;
    }
    const worker = registration.installing ?? registration.waiting;
    if (!worker) {
      resolve(false);
      return;
    }
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const check = () => {
      if (registration.active || worker.state === 'activated') finish(true);
      else if (worker.state === 'redundant') finish(false);
    };
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      if (poll !== null) clearInterval(poll);
      if (typeof worker.removeEventListener === 'function') {
        try { worker.removeEventListener('statechange', check); } catch { /* écouteur déjà retiré */ }
      }
      resolve(ok);
    };
    timer = setTimeout(() => finish(!!registration.active), timeoutMs);
    poll = setInterval(check, STATE_POLL_MS);
    if (typeof worker.addEventListener === 'function') {
      try { worker.addEventListener('statechange', check); } catch { /* écoute impossible : la relecture périodique suffit */ }
    }
    check();
  });

/**
 * Enregistrement du service worker `/sw.js` à la demande — réutilise celui
 * qui existe, sinon l'enregistre — résolu avec un worker ACTIF :
 * `pushManager.subscribe()` refuse un worker encore en installation
 * (« no active Service Worker »).
 *
 * Nécessaire aux notifications push (Équipe P, mission VF-1) : l'abonnement
 * est créé quand l'utilisateur touche « Activer », bien après l'événement
 * `load` sur lequel `registerPwaServiceWorker` s'appuie.
 *
 * Mission SN : si l'enregistrement trouvé n'a pas de worker actif et que le
 * sien n'aboutit pas (installation en échec — le cas de production), `/sw.js`
 * est ré-enregistré UNE fois : le navigateur retélécharge le fichier et
 * relance l'installation, ce qui rétablit la situation dès qu'une version
 * corrigée est en ligne. `null` seulement si aucun worker actif n'existe à
 * l'issue de cette seconde tentative, si le navigateur ne supporte pas les
 * service workers ou si l'enregistrement échoue (contexte non sécurisé,
 * fichier absent…) : l'appelant décide quoi afficher, jamais une exception
 * qui remonte jusqu'à l'écran.
 */
export const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) return null;
  try {
    const container = navigator.serviceWorker;
    const registration = (await container.getRegistration('/')) ?? (await registerServiceWorker());
    if (registration.active) return registration;
    if (await waitForActiveServiceWorker(registration)) return registration;

    console.info('Service Worker PWA sans worker actif : nouvel enregistrement de', SERVICE_WORKER_URL);
    const fresh = await registerServiceWorker();
    if (fresh.active) return fresh;
    if (await waitForActiveServiceWorker(fresh)) return fresh;

    console.info('Service Worker PWA toujours inactif après un nouvel enregistrement (installation en échec ?).');
    return null;
  } catch (err) {
    console.info('Service Worker PWA indisponible dans cet environnement :', err instanceof Error ? err.message : err);
    return null;
  }
};

export const checkNetworkStatus = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
