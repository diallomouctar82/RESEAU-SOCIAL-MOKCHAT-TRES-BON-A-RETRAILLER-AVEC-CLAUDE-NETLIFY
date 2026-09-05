# Accès public à MokNet — verrou d'entrée vérifié par le serveur (DEC-2026-081, v6.42.0)

Preuves avant / après de la mission « correction de l'accès public » (Direction, 5 septembre 2026). Généré le 2026-09-05 16:01 UTC.

## Niveau de preuve (honnête)

| Volet | Niveau | Ce qui est prouvé | Ce qui ne l'est pas |
| :--- | :--- | :--- | :--- |
| **Avant** | 🚀 page de production servie (`https://moknet.net`, bundle `index-Bm6woHcd.js`), rejouée en miroir local dans Chromium 1194 | Le comportement exact du code en production, à l'octet près | — |
| **Après** | 🧪 build de la branche (`vite build`) servi en local, même Chromium | Le comportement du code corrigé | Le bundle de production (il n'existe qu'après fusion) |
| **Canaux** | 🧪 émulation : viewport téléphone 390 × 844 ×2 (tactile) et **agent utilisateur réel** de chaque navigateur intégré (WebView Android `wv`, `WhatsApp/…`, `FB_IAB/Orca-Android`, `FBAN/MessengerForiOS`, SafariView iOS), contexte de stockage vierge comme dans ces navigateurs | L'application se comporte de la même façon quel que soit l'agent utilisateur et le stockage isolé | Le vrai WhatsApp / Messenger / SMS sur un vrai téléphone : contrôle final de la Direction |
| **Serveur d'authentification** | 🧪 réponses réelles de Supabase rejouées (401 `bad_jwt`, 403, 200 utilisateur, panne réseau) | Chaque verdict sur la réponse que le serveur donne | Le serveur Supabase de production lui-même (inaccessible depuis le banc) |
| **Domaine** | 🌐 `curl` sur la production réelle (`domaine-variantes-avant.txt`) + norme URL (Node) | Les chaînes de redirection de dix écritures, avant fusion | Les règles `netlify.toml` ne s'observent qu'en production, après fusion |

## Résultat

- **Session locale refusée par le serveur** (le trou) : **7/7 canaux ouvraient l'interface interne avant → 7/7 affichent l'écran de connexion après.**
- Appareil vierge ou profil local sans session : 28/28 écrans de connexion (avant comme après) — l'écran de connexion s'affichait déjà pour toute personne sans session.
- Session confirmée par le serveur : 14/14 entrées directes sur Réseau MokNet (aucune régression pour les personnes connectées).
- Serveur injoignable avec session locale non expirée : interface conservée avant comme après (tolérance dite, à durcir sur décision).

## Mesures (70 = 7 canaux × 5 états, avant → après)

Colonnes : verdict d'écran mesuré dans le DOM (champs e-mail + mot de passe sans navigation interne = écran de connexion ; `nav`/`aside`/composeur = interface interne), appels vers Supabase interceptés, erreurs JS (bruits connus filtrés).

| État de l'appareil | Canal | Attendu | Avant | Après | Appels Supabase | Erreurs JS |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Appareil vierge (aucune session) | Navigateur ordinateur (Chromium, 1440 × 900) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Appareil vierge (aucune session) | Navigateur mobile (Chrome Android, 390 × 844) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Appareil vierge (aucune session) | Lien depuis un SMS (WebView Android) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Appareil vierge (aucune session) | WhatsApp Android (navigateur intégré) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Appareil vierge (aucune session) | Messenger Android (navigateur intégré FB_IAB) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Appareil vierge (aucune session) | Messenger iOS (navigateur intégré FBAN) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Appareil vierge (aucune session) | WhatsApp iOS (SafariViewController) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | Navigateur ordinateur (Chromium, 1440 × 900) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | Navigateur mobile (Chrome Android, 390 × 844) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | Lien depuis un SMS (WebView Android) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | WhatsApp Android (navigateur intégré) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | Messenger Android (navigateur intégré FB_IAB) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | Messenger iOS (navigateur intégré FBAN) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Profil local gardé, aucune session Supabase | WhatsApp iOS (SafariViewController) | Écran de connexion | Écran de connexion | Écran de connexion ✅ | 1 → 1 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | Navigateur ordinateur (Chromium, 1440 × 900) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | Navigateur mobile (Chrome Android, 390 × 844) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | Lien depuis un SMS (WebView Android) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | WhatsApp Android (navigateur intégré) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | Messenger Android (navigateur intégré FB_IAB) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | Messenger iOS (navigateur intégré FBAN) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale REFUSÉE par le serveur (401/403) | WhatsApp iOS (SafariViewController) | Écran de connexion | Interface interne | Écran de connexion ✅ | 12 → 5 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | Navigateur ordinateur (Chromium, 1440 × 900) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | Navigateur mobile (Chrome Android, 390 × 844) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | Lien depuis un SMS (WebView Android) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | WhatsApp Android (navigateur intégré) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | Messenger Android (navigateur intégré FB_IAB) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | Messenger iOS (navigateur intégré FBAN) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale CONFIRMÉE par le serveur | WhatsApp iOS (SafariViewController) | Interface (Réseau MokNet) | Interface interne | Interface interne ✅ | 12 → 12 | 0 → 0 |
| Session locale non expirée, serveur injoignable | Navigateur ordinateur (Chromium, 1440 × 900) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |
| Session locale non expirée, serveur injoignable | Navigateur mobile (Chrome Android, 390 × 844) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |
| Session locale non expirée, serveur injoignable | Lien depuis un SMS (WebView Android) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |
| Session locale non expirée, serveur injoignable | WhatsApp Android (navigateur intégré) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |
| Session locale non expirée, serveur injoignable | Messenger Android (navigateur intégré FB_IAB) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |
| Session locale non expirée, serveur injoignable | Messenger iOS (navigateur intégré FBAN) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |
| Session locale non expirée, serveur injoignable | WhatsApp iOS (SafariViewController) | Interface (tolérance dite) | Interface interne | Interface interne ✅ | 12 → 12 | 2 → 2 |

Détail complet : `avant-mesures.json`, `apres-mesures.json` (URL, titre, h1 visibles, boutons visibles, clés de stockage, appels Supabase, agent utilisateur, erreurs).

## Captures choisies (JPG, regardées une fois)

| Fichier | Moment | État | Canal |
| :--- | :--- | :--- | :--- |
| `avant-session-invalide-navigateur-ordinateur.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | Navigateur ordinateur (Chromium, 1440 × 900) |
| `apres-session-invalide-navigateur-ordinateur.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | Navigateur ordinateur (Chromium, 1440 × 900) |
| `avant-session-invalide-navigateur-mobile.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | Navigateur mobile (Chrome Android, 390 × 844) |
| `apres-session-invalide-navigateur-mobile.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | Navigateur mobile (Chrome Android, 390 × 844) |
| `avant-session-invalide-sms-android-webview.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | Lien depuis un SMS (WebView Android) |
| `apres-session-invalide-sms-android-webview.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | Lien depuis un SMS (WebView Android) |
| `avant-session-invalide-whatsapp-android.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | WhatsApp Android (navigateur intégré) |
| `apres-session-invalide-whatsapp-android.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | WhatsApp Android (navigateur intégré) |
| `avant-session-invalide-messenger-android.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | Messenger Android (navigateur intégré FB_IAB) |
| `apres-session-invalide-messenger-android.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | Messenger Android (navigateur intégré FB_IAB) |
| `avant-session-invalide-messenger-ios.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | Messenger iOS (navigateur intégré FBAN) |
| `apres-session-invalide-messenger-ios.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | Messenger iOS (navigateur intégré FBAN) |
| `avant-session-invalide-whatsapp-ios-safariview.jpg` | Avant (production servie) | Session locale REFUSÉE par le serveur (401/403) | WhatsApp iOS (SafariViewController) |
| `apres-session-invalide-whatsapp-ios-safariview.jpg` | Après (build de la branche) | Session locale REFUSÉE par le serveur (401/403) | WhatsApp iOS (SafariViewController) |
| `avant-vierge-navigateur-ordinateur.jpg` | Avant (production servie) | Appareil vierge (aucune session) | Navigateur ordinateur (Chromium, 1440 × 900) |
| `apres-vierge-navigateur-ordinateur.jpg` | Après (build de la branche) | Appareil vierge (aucune session) | Navigateur ordinateur (Chromium, 1440 × 900) |
| `apres-session-valide-navigateur-ordinateur.jpg` | Après (build de la branche) | Session locale CONFIRMÉE par le serveur | Navigateur ordinateur (Chromium, 1440 × 900) |
| `avant-vierge-navigateur-mobile.jpg` | Avant (production servie) | Appareil vierge (aucune session) | Navigateur mobile (Chrome Android, 390 × 844) |
| `apres-vierge-navigateur-mobile.jpg` | Après (build de la branche) | Appareil vierge (aucune session) | Navigateur mobile (Chrome Android, 390 × 844) |
| `apres-session-valide-navigateur-mobile.jpg` | Après (build de la branche) | Session locale CONFIRMÉE par le serveur | Navigateur mobile (Chrome Android, 390 × 844) |

## Rejeu `SIGNED_IN` par supabase-js (constat bloquant du contrôle indépendant, corrigé)

supabase-js rejoue en `SIGNED_IN` la session lue dans le stockage — à l'initialisation, à chaque retour sur l'onglet (`visibilitychange`) et par BroadcastChannel depuis un autre onglet — **sans appel serveur**. Scénario : session refusée par le serveur (401) → puis le jeton est remis dans le stockage (comme le ferait un autre onglet) et un retour sur l'onglet est déclenché → supabase-js émet `SIGNED_IN` avec ce jeton.

| Moment | Canal | Premier écran | Après rejeu `SIGNED_IN` |
| :--- | :--- | :--- | :--- |
| Avant (production servie) | Navigateur ordinateur (Chromium, 1440 × 900) | Interface interne | Interface interne |
| Avant (production servie) | Navigateur mobile (Chrome Android, 390 × 844) | Interface interne | Interface interne |
| Après (build de la branche) | Navigateur ordinateur (Chromium, 1440 × 900) | Écran de connexion | Écran de connexion |
| Après (build de la branche) | Navigateur mobile (Chrome Android, 390 × 844) | Écran de connexion | Écran de connexion |

Avant : la session refusée ouvrait déjà l'interface au premier écran, et le rejeu la laissait ouverte. Après : écran de connexion au premier écran **et** après le rejeu (le verdict est attaché au jeton, un jeton refusé reste refusé — `apres-session-invalide-rejeu-*.jpg`, `apres-session-invalide-rejeu-*-apres-rejeu.jpg`, `*-rejeu-mesures.json`).

## Variantes d'écriture du domaine

`domaine-variantes-avant.txt` : chaîne complète des redirections pour `https://moknet.net/`, `https://www.moknet.net/`, `http://moknet.net/`, `http://www.moknet.net/`, `https://Moknet.net/`, `https://MOKNET.NET/`, `https://Www.Moknet.Net/`, `https://WWW.MOKNET.NET/`, `http://MOKNET.NET/`, `http://Www.moknet.net/` — toutes finissent sur `https://moknet.net/` (HTTP 200). Les majuscules envoyées telles quelles par `curl` sont servies par le même site (même `etag`) ; un navigateur ne les envoie jamais : `new URL('https://WWW.Moknet.NET/x').host === 'www.moknet.net'`. Après fusion, les trois règles de `netlify.toml` rendent ce comportement explicite et versionné (vérification en production dans le rapport de production contrôlée).

## Limites

- Navigateurs intégrés émulés (agent utilisateur + stockage isolé), pas de vrai appareil.
- `cdn.tailwindcss.com` et `cdn.jsdelivr.net` ne sont pas joignables depuis le banc : Tailwind Play est servi depuis une copie locale, MediaPipe est absent (sans effet sur l'entrée).
- Un jeton d'accès encore valide (≤ 1 h) après une « déconnexion partout » depuis un autre appareil n'est pas révoqué par ce contrôle (limite des jetons signés).
- Colonne « Erreurs JS » : les seules lignes non filtrées sont, avec une session confirmée, `Blocked call to navigator.vibrate` (Chromium refuse la vibration avant tout geste de l'utilisateur — bruit connu du banc, sans rapport avec l'entrée) et, serveur coupé, `Erreur chargement profil Supabase : Failed to fetch` (le réseau est volontairement coupé dans ce scénario).
