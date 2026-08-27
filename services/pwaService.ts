/**
 * Service d'enregistrement PWA et gestion du mode Hors-ligne souverain
 */

export const registerPwaServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker PWA LMAV enregistré avec succès:', reg.scope);
        })
        .catch((err) => {
          console.info('PWA Service Worker skipped/unavailable in current container environment:', err.message);
        });
    });
  }
};

export const checkNetworkStatus = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
