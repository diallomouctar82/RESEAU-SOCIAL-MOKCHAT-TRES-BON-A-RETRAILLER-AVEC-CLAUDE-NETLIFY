// Service Worker PWA Souverain - Le Monde à Vous (LMAV)
// Fichier servi tel quel par le navigateur (jamais transpilé par Vite) :
// JavaScript pur obligatoire, aucune syntaxe TypeScript ici.
const CACHE_NAME = 'lmav-app-v6.6.0';

// Mission SN (sonnerie hors application) — réglages « sonnerie » /
// « vibration » de CET appareil, écrits par la page (Cache API) et lus ici
// avant d'afficher une notification d'appel. Ce cache survit aux mises à
// jour du worker : il n'est jamais purgé à l'activation. Les deux valeurs
// doivent rester identiques à services/calls/ringtoneService.ts.
const RING_PREFERENCES_CACHE = 'lmav-ring-prefs-v1';
const RING_PREFERENCES_URL = '/__moknet/ring-preferences';

self.addEventListener('install', (event) => {
  // Mission SN — l'installation ne dépend d'AUCUN fichier. Constaté en
  // production (03/09/2026) : l'ancien `cache.addAll(['/metadata.json'])`
  // échouait (le fichier répond 404 sur moknet.net), l'installation
  // échouait avec lui, aucun worker n'était jamais actif, et
  // `pushManager.subscribe()` refusait avec « Subscription failed - no
  // active Service Worker » : aucun téléphone ne pouvait s'enregistrer pour
  // sonner hors application. Les fichiers sont désormais mis en cache au
  // fil des requêtes (gestionnaire fetch ci-dessous) ; ouvrir le cache ici
  // ne fait que le créer, et même cet échec-là ne bloque pas l'activation.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .catch((err) => {
        console.warn('[sw] ouverture du cache impossible à l\'installation (sans conséquence) :', err);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RING_PREFERENCES_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Requêtes vers d'autres origines (API Supabase, passerelle IA, polices, CDN) :
  // le service worker ne s'en mêle pas. Elles n'étaient de toute façon jamais
  // mises en cache (réponses non « basic »), mais leur passage par ce
  // gestionnaire transformait toute panne réseau en fausse réponse « 503
  // Offline » servie à l'application — qui retombait alors sur le profil de
  // démonstration au lieu de signaler l'erreur. Réseau direct, comportement
  // natif du navigateur.
  const ownOrigin = self.location ? self.location.origin : null;
  if (ownOrigin && url.origin !== ownOrigin) return;

  // Navigation (le document HTML) : toujours réseau d'abord — jamais servir un
  // index.html en cache qui référencerait des fichiers JS/CSS hashés qui
  // n'existent plus après un nouveau déploiement (source du fameux "écran
  // blanc après mise à jour" avec un service worker cache-first).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets statiques (JS/CSS hashés, images) : cache d'abord, avec
  // rafraîchissement en arrière-plan.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' }));

      return cachedResponse || fetchPromise;
    })
  );
});

// ─── Notifications push (Équipe P — mission VF-1) ───────────────────────────
// Charge utile déchiffrée par le navigateur (envoyée par la fonction Edge
// push-notify) :
//   { v:1, type:'incoming_call'|'call_cancelled'|'missed_call'|'message'|'friend_request',
//     ts:<ms epoch>, callId, conversationId, from:{ id, name, avatarUrl|null },
//     callType?:'audio'|'video', reason?:'answered'|'cancelled'|'missed'|'rejected',
//     title?, body?, url?, messagePreview? }
// Contrat avec l'application (messages postés aux fenêtres ouvertes) :
//   { type:'moknet-push', payload }                  — toute charge utile reçue,
//                                                      un onglet ouvert qui a raté
//                                                      le signal temps réel doit
//                                                      sonner / s'arrêter aussi ;
//   { type:'moknet-push-action', action, payload }   — clic sur une notification
//                                                      (action 'accept'|'reject'|'open') ;
//   { type:'moknet-push-resubscribed', endpoint }    — l'abonnement a changé, la
//                                                      page doit le ré-enregistrer.
// Sans fenêtre ouverte, le clic ouvre
//   /?pushAction=<accept|reject|open>&pushType=<type>&callId=..&conv=..&from=..&callType=..&ts=..

/** Un appel plus vieux que 40 s ne sonne plus : décrocher ferait tomber dans le vide. */
const CALL_MAX_AGE_MS = 40000;
const DEFAULT_ICON = '/icons/icon-192.png';
const BADGE_ICON = '/icons/badge-72.png';
const CALL_VIBRATION = [300, 150, 300, 800, 300, 150, 300];

function senderName(payload) {
  const from = payload && payload.from;
  const name = from && typeof from.name === 'string' ? from.name.trim() : '';
  return name || 'Un membre MokNet';
}

function senderIcon(payload) {
  const from = payload && payload.from;
  return from && typeof from.avatarUrl === 'string' && from.avatarUrl ? from.avatarUrl : DEFAULT_ICON;
}

function callTag(payload) {
  return 'call-' + String(payload.callId || '');
}

function parsePushData(data) {
  if (!data) return null;
  try {
    const parsed = data.json();
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    console.warn('[sw] charge utile push illisible (JSON attendu) :', err);
    return null;
  }
}

async function postToWindowClients(message) {
  try {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windowClients.forEach((client) => {
      try {
        client.postMessage(message);
      } catch (err) {
        console.warn('[sw] postMessage vers une fenêtre impossible :', err);
      }
    });
    return windowClients.length;
  } catch (err) {
    console.warn('[sw] énumération des fenêtres impossible :', err);
    return 0;
  }
}

async function closeNotificationsByTag(tag) {
  if (!tag) return;
  try {
    const shown = await self.registration.getNotifications({ tag: tag });
    shown.forEach((notification) => notification.close());
  } catch (err) {
    console.warn('[sw] fermeture de notification impossible :', err);
  }
}

function isStaleCall(payload) {
  const ts = Number(payload.ts);
  return Number.isFinite(ts) && Date.now() - ts > CALL_MAX_AGE_MS;
}

/**
 * Mission SN — réglages « sonnerie » / « vibration » posés par la page dans
 * la Cache API (bouton « Sonnerie » de la messagerie). Sans réglage, ou si la
 * lecture échoue : sonnerie ET vibration, comme avant. Un réglage ne peut
 * jamais empêcher la notification elle-même : elle s'affiche toujours.
 */
async function readRingPreferences() {
  const defaults = { ringtoneEnabled: true, vibrationEnabled: true };
  try {
    const cache = await caches.open(RING_PREFERENCES_CACHE);
    const stored = await cache.match(RING_PREFERENCES_URL);
    if (!stored) return defaults;
    const parsed = await stored.json();
    if (!parsed || typeof parsed !== 'object') return defaults;
    return {
      ringtoneEnabled: parsed.ringtoneEnabled !== false,
      vibrationEnabled: parsed.vibrationEnabled !== false
    };
  } catch (err) {
    console.warn('[sw] réglages de sonnerie illisibles, valeurs par défaut :', err);
    return defaults;
  }
}

async function showIncomingCall(payload) {
  const isVideo = payload.callType === 'video';
  const title = (isVideo ? 'Appel vidéo de ' : 'Appel de ') + senderName(payload);
  const prefs = await readRingPreferences();
  const options = {
    body: 'Touchez pour répondre',
    tag: callTag(payload),
    renotify: true,
    requireInteraction: true,
    icon: senderIcon(payload),
    badge: BADGE_ICON,
    actions: [
      { action: 'accept', title: 'Répondre' },
      { action: 'reject', title: 'Refuser' }
    ],
    data: payload
  };
  if (!prefs.ringtoneEnabled) {
    // Sonnerie coupée : notification silencieuse. Le navigateur interdit de
    // combiner `silent` et un motif de vibration — une sonnerie coupée coupe
    // donc aussi la vibration de la notification (dit tel quel dans le panneau).
    options.silent = true;
  } else if (prefs.vibrationEnabled) {
    options.vibrate = CALL_VIBRATION;
  }
  await self.registration.showNotification(title, options);
}

async function showMissedCall(payload) {
  await self.registration.showNotification('Appel manqué de ' + senderName(payload), {
    body: 'Touchez pour ouvrir la conversation',
    tag: 'missed-' + String(payload.callId || ''),
    icon: senderIcon(payload),
    badge: BADGE_ICON,
    data: payload
  });
}

async function showMessage(payload) {
  const title = typeof payload.title === 'string' && payload.title
    ? payload.title
    : 'Nouveau message de ' + senderName(payload);
  const body = typeof payload.body === 'string' && payload.body
    ? payload.body
    : (typeof payload.messagePreview === 'string' ? payload.messagePreview : '');
  const conversationKey = payload.conversationId || (payload.from && payload.from.id) || 'moknet';
  await self.registration.showNotification(title, {
    body: body,
    tag: 'message-' + String(conversationKey),
    icon: senderIcon(payload),
    badge: BADGE_ICON,
    data: payload
  });
}

// AU-10 : demande d'ami. Le titre est composé ICI à partir du nom que LE
// SERVEUR a lu dans `profiles` (payload.from.name) — jamais d'un texte fourni
// par l'expéditeur, qui pourrait alors écrire n'importe quoi sur l'écran
// verrouillé de quelqu'un d'autre. Vibration courte : c'est une invitation,
// pas un appel.
async function showFriendRequest(payload) {
  const fromId = (payload.from && payload.from.id) || 'moknet';
  await self.registration.showNotification(senderName(payload) + ' souhaite vous ajouter', {
    body: 'Nouvelle demande d’ami sur MokNet',
    tag: 'friend-request-' + String(fromId),
    icon: senderIcon(payload),
    badge: BADGE_ICON,
    vibrate: [200, 100, 200],
    data: payload
  });
}

async function handlePush(payload) {
  const type = payload.type;

  if (type === 'incoming_call') {
    if (isStaleCall(payload)) return;
    await Promise.all([
      showIncomingCall(payload),
      postToWindowClients({ type: 'moknet-push', payload: payload })
    ]);
    return;
  }

  // Les autres types sont aussi transmis aux fenêtres ouvertes : un onglet qui
  // sonne suite à un push doit s'arrêter sur l'annulation, et peut rafraîchir
  // ses compteurs sur un message.
  await postToWindowClients({ type: 'moknet-push', payload: payload });

  if (type === 'call_cancelled') {
    await closeNotificationsByTag(callTag(payload));
    if (payload.reason === 'missed') await showMissedCall(payload);
    return;
  }
  if (type === 'missed_call') {
    await closeNotificationsByTag(callTag(payload));
    await showMissedCall(payload);
    return;
  }
  if (type === 'message') {
    await showMessage(payload);
    return;
  }
  if (type === 'friend_request') {
    await showFriendRequest(payload);
    return;
  }
  console.warn('[sw] type de notification push inconnu :', type);
}

self.addEventListener('push', (event) => {
  const payload = parsePushData(event.data);
  if (!payload) return;
  event.waitUntil(
    handlePush(payload).catch((err) => {
      console.warn('[sw] traitement de la notification push en échec :', err);
    })
  );
});

function buildOpenUrl(action, payload) {
  const from = payload.from && typeof payload.from === 'object' ? payload.from.id : undefined;
  const params = [
    ['pushAction', action],
    ['pushType', payload.type],
    ['callId', payload.callId],
    ['conv', payload.conversationId],
    ['from', from],
    ['callType', payload.callType],
    ['ts', payload.ts]
  ];
  const query = params
    .filter((pair) => pair[1] !== undefined && pair[1] !== null && pair[1] !== '')
    .map((pair) => encodeURIComponent(pair[0]) + '=' + encodeURIComponent(String(pair[1])))
    .join('&');
  return '/?' + query;
}

function pickWindowClient(windowClients) {
  if (!windowClients || windowClients.length === 0) return null;
  const focused = windowClients.find((client) => client.focused);
  if (focused) return focused;
  const visible = windowClients.find((client) => client.visibilityState === 'visible');
  return visible || windowClients[0];
}

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const payload = notification && notification.data && typeof notification.data === 'object' ? notification.data : {};
  const action = event.action || 'open';
  try {
    if (notification) notification.close();
  } catch (err) {
    console.warn('[sw] fermeture de la notification cliquée impossible :', err);
  }
  event.waitUntil((async () => {
    try {
      const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const target = pickWindowClient(windowClients);
      if (target) {
        if (typeof target.focus === 'function') {
          try {
            await target.focus();
          } catch (err) {
            console.warn('[sw] mise au premier plan refusée :', err);
          }
        }
        target.postMessage({ type: 'moknet-push-action', action: action, payload: payload });
        return;
      }
      if (typeof self.clients.openWindow === 'function') {
        await self.clients.openWindow(buildOpenUrl(action, payload));
      }
    } catch (err) {
      console.warn('[sw] clic de notification en échec :', err);
    }
  })());
});

// Le service de push a invalidé l'abonnement (rotation, expiration) : on se
// ré-abonne avec la même clé serveur, puis on prévient les fenêtres ouvertes —
// le worker n'a pas de session Supabase, seule la page peut enregistrer le
// nouvel endpoint (ensurePushSubscription avec force). Sans clé connue, la
// page est prévenue quand même : elle se réabonnera elle-même.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const oldSubscription = event.oldSubscription;
      const applicationServerKey = oldSubscription && oldSubscription.options
        ? oldSubscription.options.applicationServerKey
        : null;
      if (!applicationServerKey) {
        console.warn('[sw] pushsubscriptionchange sans clé serveur : ré-abonnement laissé à l\'application');
        await postToWindowClients({ type: 'moknet-push-resubscribed', endpoint: null });
        return;
      }
      const fresh = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      await postToWindowClients({ type: 'moknet-push-resubscribed', endpoint: fresh.endpoint });
    } catch (err) {
      console.warn('[sw] ré-abonnement push en échec :', err);
    }
  })());
});
