# Accès public MokNet — matrice cas par cas sur le bundle de production servi

Date : 2026-09-05 · bundle servi par https://moknet.net : `index-C8Y6seFM.js` (v6.42.0, DEC-2026-081) · miroir local du site servi, Chromium Playwright.

## Niveau de preuve (honnête)

- 🌐 Bundle **réellement servi en production** (miroir local du site, même fichiers, même hachage), navigateurs **émulés** (Chromium avec agent utilisateur, viewport, tactile et densité de pixels de chaque support). Ce n’est **pas** un téléphone ni une tablette physiques — ce banc reproduit le code exécuté, pas le matériel.
- Le serveur Supabase est **intercepté** par scénario (réponses 401, session confirmée, connexion refusée) pour rendre chaque état reproductible sans compte réel ni secret.
- Navigation privée = stockage vide au démarrage : c’est exactement le scénario « vierge ».

## Résultat cas par cas

| Cas | Scénario | Ordinateur | Téléphone | Tablette | Attendu |
|---|---|---|---|---|---|
| A — Utilisateur déjà connecté, session valide | Session locale CONFIRMÉE par le serveur | ✅ Interface interne | ✅ Interface interne | ✅ Interface interne | Interface interne (Réseau MokNet) |
| A — Utilisateur déjà connecté, session valide | Lien privé ?live=… avec session confirmée | ✅ Interface interne | ✅ Interface interne | ✅ Interface interne | Interface interne (Réseau MokNet) |
| B — Compte existant mais déconnecté | Déconnexion par le bouton « Se déconnecter » puis réouverture | ✅ Interface interne → après clic : connexion ; réouverture : connexion | ✅ Interface interne → après clic : connexion ; réouverture : connexion | ✅ Interface interne → après clic : connexion ; réouverture : connexion | Écran de connexion |
| B — Compte existant mais déconnecté | Profil local gardé, aucune session Supabase | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| C — Session expirée ou invalide | Session locale REFUSÉE par le serveur (401) | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Effacement + écran de connexion |
| C — Session expirée ou invalide | Session locale EXPIRÉE (refresh refusé) | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Effacement + écran de connexion |
| C — Session expirée ou invalide | Session refusée puis rejeu SIGNED_IN (retour au premier plan) | ✅ Écran de connexion → rejeu : Écran de connexion | ✅ Écran de connexion → rejeu : Écran de connexion | ✅ Écran de connexion → rejeu : Écran de connexion | Effacement + écran de connexion |
| C — Session expirée ou invalide | Lien privé ?live=… avec session refusée | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Effacement + écran de connexion |
| D — Sans compte / jamais connecté / navigation privée | Appareil vierge (aucune session, = navigation privée) | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion (avec onglet « Créer un compte ») |
| E — Lien privé ouvert sans session | Lien privé ?live=… sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| E — Lien privé ouvert sans session | Lien d’invitation ?invite=… sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| E — Lien privé ouvert sans session | Lien /messagerie sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| E — Lien privé ouvert sans session | Lien ?module=messagerie sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| E — Lien privé ouvert sans session | Lien #admin sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| F — Serveur d'authentification injoignable | Aucune session, serveur injoignable | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Sans session ou session expirée : écran de connexion. Session locale non expirée : tolérance dite (interface) |
| F — Serveur d'authentification injoignable | Session locale EXPIRÉE, serveur injoignable (budget 60 s) | ✅ Écran de connexion (après 25.5 s, 12 appels) | ✅ Écran de connexion (après 25.5 s, 12 appels) | ✅ Écran de connexion (après 25.5 s, 12 appels) | Sans session ou session expirée : écran de connexion. Session locale non expirée : tolérance dite (interface) |
| F — Serveur d'authentification injoignable | Session locale non expirée, serveur injoignable | ✅ Interface interne | ✅ Interface interne | ✅ Interface interne | Sans session ou session expirée : écran de connexion. Session locale non expirée : tolérance dite (interface) |
| G — Page publique de démonstration /architecte (DEC-2026-066) | Lien /architecte sans session | ⚠️ Page démo publique | ⚠️ Page démo publique | ⚠️ Page démo publique | Page de démonstration, sans session (exception à soumettre) |

## Planches (une image par scénario : ordinateur · téléphone · tablette)

- `planche-session-valide.jpg`
- `planche-lien-prive-live-session-valide.jpg`
- `planche-deconnexion.jpg`
- `planche-profil-local-sans-session.jpg`
- `planche-session-invalide.jpg`
- `planche-session-expiree.jpg`
- `planche-session-invalide-rejeu.jpg`
- `planche-lien-prive-live-session-invalide.jpg`
- `planche-vierge.jpg`
- `planche-lien-prive-live-vierge.jpg`
- `planche-lien-prive-invitation-vierge.jpg`
- `planche-lien-prive-messagerie-vierge.jpg`
- `planche-lien-prive-module-messagerie-vierge.jpg`
- `planche-lien-prive-admin-vierge.jpg`
- `planche-serveur-injoignable-vierge.jpg`
- `planche-session-expiree-serveur-injoignable.jpg`
- `planche-session-reseau-coupe.jpg`
- `planche-lien-architecte-vierge.jpg`
- `planche-deconnexion-etapes-navigateur-mobile.jpg`
- `planche-deconnexion-etapes-navigateur-ordinateur.jpg`
- `planche-rejeu-etapes-navigateur-mobile.jpg`
- `planche-rejeu-etapes-navigateur-ordinateur.jpg`

## Appels Supabase observés par scénario (téléphone)

- **Session locale CONFIRMÉE par le serveur** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_session_v2', 'lmav_chat_conversations_cache', 'lmav_enrolled_persons_v1']
- **Lien privé ?live=… avec session confirmée** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_session_v2', 'lmav_chat_conversations_cache', 'lmav_enrolled_persons_v1']
- **Déconnexion par le bouton « Se déconnecter » puis réouverture** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_session_v2', 'lmav_chat_conversations_cache']
- **Profil local gardé, aucune session Supabase** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_session_v2', 'lmav_enrolled_persons_v1']
- **Session locale REFUSÉE par le serveur (401)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `POST /auth/v1/logout?scope=local`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Session locale EXPIRÉE (refresh refusé)** : `POST /auth/v1/token?grant_type=refresh_token`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Session refusée puis rejeu SIGNED_IN (retour au premier plan)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `POST /auth/v1/logout?scope=local`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien privé ?live=… avec session refusée** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `POST /auth/v1/logout?scope=local`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Appareil vierge (aucune session, = navigation privée)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien privé ?live=… sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien d’invitation ?invite=… sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_pending_invite', 'lmav_enrolled_persons_v1']
- **Lien /messagerie sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien ?module=messagerie sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien #admin sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Aucune session, serveur injoignable** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Session locale EXPIRÉE, serveur injoignable (budget 60 s)** : `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Session locale non expirée, serveur injoignable** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_chat_conversations_cache', 'lmav_enrolled_persons_v1']
- **Lien /architecte sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']

## Constats à retenir

- **Déconnexion** (téléphone : bouton « Ouvrir le menu » puis « Se déconnecter » du tiroir ; ordinateur et tablette 820 px : avatar de profil puis « Se déconnecter ») : écran de connexion immédiat, jeton Supabase et profil local (`lmav_session_v2`) effacés ; après réouverture, toujours l’écran de connexion.
- **Résidu après déconnexion** : `lmav_chat_conversations_cache` (cache des conversations) et `lmav_enrolled_persons_v1` (personnes enrôlées pour le scanner) restent dans le stockage local de l’appareil. Aucun accès n’en découle (connexion obligatoire), mais sur un appareil partagé ce cache survit à la déconnexion — point de durcissement hors périmètre de cette mission (messagerie), signalé à la Direction.
- **Session expirée + serveur injoignable** : supabase-js tente huit rafraîchissements avec attente croissante (fenêtre de 30 s), puis l’application affiche l’écran de connexion après ≈ 25,5 s ; l’interface ne s’ouvre jamais. Le jeton expiré reste dans le stockage (le serveur ne l’a pas refusé, il est simplement périmé et inutilisable sans rafraîchissement).
- **Session non expirée + serveur injoignable** : tolérance dite (DEC-2026-081) — l’interface s’ouvre avec la session locale, mais toute donnée reste inaccessible (erreurs « Failed to fetch » sur le profil). Bornée par la durée de vie du jeton d’accès (1 h par défaut Supabase). Durcissement possible sur décision de la Direction.
- **/architecte** : page publique de démonstration décidée par la Direction (DEC-2026-066), rendue avant le verrou ; aucune donnée de compte, aucune fonction de l’application. Exception à confirmer ou à fermer.
- **Lien d’invitation** `?invite=` : le code est mémorisé (`lmav_pending_invite`) puis l’écran de connexion s’affiche ; il n’est consommé qu’une fois la session établie (`accept_invitation`, côté serveur).

## Rejouer

```
node scenarios-entree.cjs <sortie> http://127.0.0.1:3019/ production-supports supports tous
node scenarios-entree.cjs <sortie> http://127.0.0.1:3019/ production-supports supports session-expiree-serveur-injoignable
```

Miroir : `python3 scripts/production-controlee/mirror-serve.py 3019 https://moknet.net <cache>` (les chemins sans extension sont servis en `text/html`, comme la réécriture SPA de Netlify). Script Playwright : `scenarios-entree.cjs` (ce dossier ; dépendance `playwright` avec le Chromium préinstallé, Tailwind Play servi depuis une copie locale `../tailwind-play.js`). Par rapport au banc initial de la mission : canal tablette, chemin par scénario (liens privés), déclencheurs réels de déconnexion, semis du stockage une seule fois par contexte, capture avant déconnexion, budget d’attente et chronométrage par scénario. Le jeton de banc est un JWT factice non signé : aucun secret.
