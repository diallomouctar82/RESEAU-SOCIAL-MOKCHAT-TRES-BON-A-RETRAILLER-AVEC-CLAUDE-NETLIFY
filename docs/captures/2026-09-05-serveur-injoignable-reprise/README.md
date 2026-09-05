# Serveur injoignable : fermé par défaut, écran de reprise, reprise sans ressaisie — matrice cas par cas (DEC-2026-083, v6.44.0)

Date : 2026-09-05 · build de la branche (tête 93a1aad, instantané index-C-LctbG5.js, même code que le preview index-CjApmOfd.js) · Chromium Playwright, ordinateur + téléphone + tablette, Supabase intercepté par état (coupé, confirmé, refusé) avec bascule en cours de scénario pour rejouer le retour du serveur.

## Niveau de preuve (honnête)

- 🧪 Build de la branche (puis 🌐 preview Netlify et 🚀 production, consignés dans le README au fil des étapes), navigateurs **émulés** (Chromium avec agent utilisateur, viewport, tactile et densité de pixels de chaque support). Ce n’est **pas** un téléphone ni une tablette physiques — ce banc reproduit le code exécuté, pas le matériel.
- Le serveur Supabase est **intercepté** par scénario (réponses 401, session confirmée, connexion refusée) pour rendre chaque état reproductible sans compte réel ni secret.
- Navigation privée = stockage vide au démarrage : c’est exactement le scénario « vierge ».

## Résultat cas par cas

| Cas | Scénario | Ordinateur | Téléphone | Tablette | Attendu |
|---|---|---|---|---|---|
| A — Utilisateur déjà connecté, session valide (serveur joignable) | Session locale CONFIRMÉE par le serveur | ✅ Interface interne | ✅ Interface interne | ✅ Interface interne | Interface interne (inchangé) |
| A — Utilisateur déjà connecté, session valide (serveur joignable) | Lien privé ?live=… avec session confirmée | ✅ Interface interne | ✅ Interface interne | ✅ Interface interne | Interface interne (inchangé) |
| B — Serveur injoignable, session non vérifiable : FERMÉ PAR DÉFAUT | Session locale non expirée, serveur injoignable | ✅ Écran de reprise | ✅ Écran de reprise | ✅ Écran de reprise | Écran de reprise « MokNet est momentanément injoignable, veuillez réessayer. », jamais l’interface, session locale conservée |
| B — Serveur injoignable, session non vérifiable : FERMÉ PAR DÉFAUT | Lien privé ?live=… avec session, serveur injoignable | ✅ Écran de reprise | ✅ Écran de reprise | ✅ Écran de reprise | Écran de reprise « MokNet est momentanément injoignable, veuillez réessayer. », jamais l’interface, session locale conservée |
| B — Serveur injoignable, session non vérifiable : FERMÉ PAR DÉFAUT | Session locale EXPIRÉE, serveur injoignable | ✅ Écran de reprise (après 8.1 s, 6 appels) | ✅ Écran de reprise (après 8.1 s, 6 appels) | ✅ Écran de reprise (après 8.1 s, 6 appels) | Écran de reprise « MokNet est momentanément injoignable, veuillez réessayer. », jamais l’interface, session locale conservée |
| C — Reprise sans ressaisie dès que le serveur répond | Serveur injoignable, puis retour du réseau (événement online) | ✅ Écran de reprise → événement online : ✅ Interface interne en 1.0 s, jeton conservé avant reprise | ✅ Écran de reprise → événement online : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | ✅ Écran de reprise → événement online : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | Interface interne, sans saisie d’identifiants |
| C — Reprise sans ressaisie dès que le serveur répond | Serveur injoignable, puis retour sur la page (visibilitychange) | ✅ Écran de reprise → événement visibilitychange : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | ✅ Écran de reprise → événement visibilitychange : ✅ Interface interne en 1.0 s, jeton conservé avant reprise | ✅ Écran de reprise → événement visibilitychange : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | Interface interne, sans saisie d’identifiants |
| C — Reprise sans ressaisie dès que le serveur répond | Serveur injoignable, puis bouton « Réessayer », serveur revenu | ✅ Écran de reprise → bouton Réessayer : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | ✅ Écran de reprise → bouton Réessayer : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | ✅ Écran de reprise → bouton Réessayer : ✅ Interface interne en 1.1 s, jeton conservé avant reprise | Interface interne, sans saisie d’identifiants |
| C — Reprise sans ressaisie dès que le serveur répond | Session EXPIRÉE, serveur injoignable, puis retour du réseau (online) pendant les reprises internes de supabase-js | ✅ Écran de reprise (après 8.1 s, 37 appels) → événement online : ✅ Interface interne en 4.1 s, jeton conservé avant reprise | ✅ Écran de reprise (après 8.1 s, 37 appels) → événement online : ✅ Interface interne en 4.0 s, jeton conservé avant reprise | ✅ Écran de reprise (après 8.1 s, 37 appels) → événement online : ✅ Interface interne en 4.0 s, jeton conservé avant reprise | Interface interne, sans saisie d’identifiants |
| C — Reprise sans ressaisie dès que le serveur répond | Session EXPIRÉE, réseau rétabli 35 s après l’ouverture (reprises internes épuisées, cache d’échec de 60 s) | ✅ Écran de reprise (après 8.1 s, 34 appels) → événement online (réseau rétabli à +35 s) : ✅ Interface interne en 41.9 s, jeton conservé avant reprise | ✅ Écran de reprise (après 8.1 s, 34 appels) → événement online (réseau rétabli à +35 s) : ✅ Interface interne en 41.8 s, jeton conservé avant reprise | ✅ Écran de reprise (après 8.1 s, 34 appels) → événement online (réseau rétabli à +35 s) : ✅ Interface interne en 41.8 s, jeton conservé avant reprise | Interface interne, sans saisie d’identifiants |
| D — Serveur toujours injoignable ou session refusée à la reprise | Serveur injoignable, bouton « Réessayer », serveur toujours injoignable | ✅ Écran de reprise → bouton Réessayer : ✅ Écran de reprise en 16.9 s, jeton conservé avant reprise | ✅ Écran de reprise → bouton Réessayer : ✅ Écran de reprise en 16.9 s, jeton conservé avant reprise | ✅ Écran de reprise → bouton Réessayer : ✅ Écran de reprise en 16.9 s, jeton conservé avant reprise | Écran de reprise maintenu / écran de connexion (session effacée) |
| D — Serveur toujours injoignable ou session refusée à la reprise | Serveur injoignable, bouton « Réessayer », serveur revenu et REFUSE la session | ✅ Écran de reprise → bouton Réessayer : ✅ Écran de connexion en 4.9 s, jeton conservé avant reprise | ✅ Écran de reprise → bouton Réessayer : ✅ Écran de connexion en 4.9 s, jeton conservé avant reprise | ✅ Écran de reprise → bouton Réessayer : ✅ Écran de connexion en 4.9 s, jeton conservé avant reprise | Écran de reprise maintenu / écran de connexion (session effacée) |
| E — Compte existant mais déconnecté | Déconnexion par le bouton « Se déconnecter » puis réouverture | ✅ Interface interne → après clic : connexion ; réouverture : connexion | ✅ Interface interne → après clic : connexion ; réouverture : connexion | ✅ Interface interne → après clic : connexion ; réouverture : connexion | Écran de connexion |
| E — Compte existant mais déconnecté | Profil local gardé, aucune session Supabase | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| F — Session expirée ou invalide (serveur joignable) | Session locale REFUSÉE par le serveur (401) | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Effacement + écran de connexion |
| F — Session expirée ou invalide (serveur joignable) | Session locale EXPIRÉE (refresh refusé) | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Effacement + écran de connexion |
| F — Session expirée ou invalide (serveur joignable) | Session refusée puis rejeu SIGNED_IN (retour au premier plan) | ✅ Écran de connexion → rejeu : Écran de connexion | ✅ Écran de connexion → rejeu : Écran de connexion | ✅ Écran de connexion → rejeu : Écran de connexion | Effacement + écran de connexion |
| F — Session expirée ou invalide (serveur joignable) | Lien privé ?live=… avec session refusée | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Effacement + écran de connexion |
| G — Sans compte / jamais connecté / navigation privée | Appareil vierge (aucune session, = navigation privée) | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion (onglet « Créer un compte ») |
| G — Sans compte / jamais connecté / navigation privée | Aucune session, serveur injoignable | ✅ Écran de connexion (après 0.1 s, 4 appels) | ✅ Écran de connexion (après 0.1 s, 4 appels) | ✅ Écran de connexion (après 0.1 s, 4 appels) | Écran de connexion (onglet « Créer un compte ») |
| H — Liens privés ouverts sans session | Lien privé ?live=… sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| H — Liens privés ouverts sans session | Lien d’invitation ?invite=… sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| H — Liens privés ouverts sans session | Lien /messagerie sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| H — Liens privés ouverts sans session | Lien ?module=messagerie sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| H — Liens privés ouverts sans session | Lien #admin sans session | ✅ Écran de connexion | ✅ Écran de connexion | ✅ Écran de connexion | Écran de connexion |
| I — Page publique de démonstration /architecte (DEC-2026-066, confirmée par la Direction : démonstration sans donnée ni fonction sensible) | Lien /architecte sans session | ⚠️ Page démo publique | ⚠️ Page démo publique | ⚠️ Page démo publique | Page de démonstration, sans session |

## Planches (une image par scénario : ordinateur · téléphone · tablette)

- `planche-session-valide.jpg`
- `planche-lien-prive-live-session-valide.jpg`
- `planche-session-reseau-coupe.jpg`
- `planche-lien-prive-live-reseau-coupe.jpg`
- `planche-session-expiree-serveur-injoignable.jpg`
- `planche-session-reseau-coupe-puis-retour.jpg`
- `planche-session-reseau-coupe-puis-visibilite.jpg`
- `planche-session-reseau-coupe-puis-bouton.jpg`
- `planche-session-expiree-serveur-injoignable-puis-retour.jpg`
- `planche-session-expiree-serveur-injoignable-retour-tardif.jpg`
- `planche-session-reseau-coupe-bouton-toujours-coupe.jpg`
- `planche-session-reseau-coupe-puis-refus.jpg`
- `planche-deconnexion.jpg`
- `planche-profil-local-sans-session.jpg`
- `planche-session-invalide.jpg`
- `planche-session-expiree.jpg`
- `planche-session-invalide-rejeu.jpg`
- `planche-lien-prive-live-session-invalide.jpg`
- `planche-vierge.jpg`
- `planche-serveur-injoignable-vierge.jpg`
- `planche-lien-prive-live-vierge.jpg`
- `planche-lien-prive-invitation-vierge.jpg`
- `planche-lien-prive-messagerie-vierge.jpg`
- `planche-lien-prive-module-messagerie-vierge.jpg`
- `planche-lien-prive-admin-vierge.jpg`
- `planche-lien-architecte-vierge.jpg`
- `planche-deconnexion-etapes-navigateur-mobile.jpg`
- `planche-deconnexion-etapes-navigateur-ordinateur.jpg`
- `planche-rejeu-etapes-navigateur-mobile.jpg`
- `planche-rejeu-etapes-navigateur-ordinateur.jpg`

## Appels Supabase observés par scénario (téléphone)

- **Session locale CONFIRMÉE par le serveur** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_session_v2', 'lmav_chat_conversations_cache']
- **Lien privé ?live=… avec session confirmée** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_session_v2', 'lmav_chat_conversations_cache']
- **Session locale non expirée, serveur injoignable** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Lien privé ?live=… avec session, serveur injoignable** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Session locale EXPIRÉE, serveur injoignable** : `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Serveur injoignable, puis retour du réseau (événement online)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Serveur injoignable, puis retour sur la page (visibilitychange)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Serveur injoignable, puis bouton « Réessayer », serveur revenu** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Session EXPIRÉE, serveur injoignable, puis retour du réseau (online) pendant les reprises internes de supabase-js** : `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Session EXPIRÉE, réseau rétabli 35 s après l’ouverture (reprises internes épuisées, cache d’échec de 60 s)** : `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token`, `POST /auth/v1/token?grant_type=refresh_token` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Serveur injoignable, bouton « Réessayer », serveur toujours injoignable** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Serveur injoignable, bouton « Réessayer », serveur revenu et REFUSE la session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token']
- **Déconnexion par le bouton « Se déconnecter » puis réouverture** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `GET /rest/v1/profiles?select=*&id=eq.11111111-2222-4333-8444-`, `GET /rest/v1/profile_skills?select=name%2Cprogress&profile_id=eq.11` · stockage local après : ['lmav_enrolled_persons_v1', 'sb-rqciahtpixdjbyoajomg-auth-token', 'lmav_session_v2', 'lmav_chat_conversations_cache']
- **Profil local gardé, aucune session Supabase** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_session_v2', 'lmav_enrolled_persons_v1']
- **Session locale REFUSÉE par le serveur (401)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `POST /auth/v1/logout?scope=local`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Session locale EXPIRÉE (refresh refusé)** : `POST /auth/v1/token?grant_type=refresh_token`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Session refusée puis rejeu SIGNED_IN (retour au premier plan)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `POST /auth/v1/logout?scope=local`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien privé ?live=… avec session refusée** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /auth/v1/user`, `GET /auth/v1/user`, `GET /rest/v1/notifications?select=*&user_id=eq.11111111-2222-4333-`, `POST /auth/v1/logout?scope=local`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Appareil vierge (aucune session, = navigation privée)** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Aucune session, serveur injoignable** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*`, `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien privé ?live=… sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien d’invitation ?invite=… sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_pending_invite', 'lmav_enrolled_persons_v1']
- **Lien /messagerie sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien ?module=messagerie sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien #admin sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']
- **Lien /architecte sans session** : `GET /rest/v1/platform_settings?select=value%2Cupdated_at&key=eq.archit`, `GET /rest/v1/profiles?select=*` · stockage local après : ['lmav_enrolled_persons_v1']

## Constats à retenir

- **Fermé par défaut** : sans verdict du serveur (réseau coupé), l’interface ne s’ouvre jamais — écran de reprise avec le message exact de la Direction et un bouton « Réessayer » ; le jeton Supabase reste dans le stockage (non refusé, non effacé).
- **Reprise sans ressaisie** : retour du réseau (`online`), retour sur la page (`visibilitychange`) ou bouton — dès que le serveur confirme le jeton, l’interface s’ouvre ; le banc ne saisit jamais d’identifiants. Session expirée : le rafraîchissement aboutit au retour du réseau, puis le verdict, puis l’interface.
- **Plafond** : jeton expiré hors ligne, l’écran de reprise s’affiche sous 8 s (avant : roue de chargement 25 s puis écran de connexion, jeton perdu pour la reprise).
- **Session expirée, retour tardif du réseau** : supabase-js garde 60 s en cache l’échec de rafraîchissement du même jeton ; une tentative est programmée juste après cette fenêtre — la colonne « retour tardif » mesure le délai réel entre le retour du réseau et l’interface (limite dite sur l’écran : jusqu’à une minute).
- **Serveur toujours injoignable** à la tentative : écran de reprise maintenu, verdict redemandé à chaque tentative (jamais mémorisé). **Session refusée** à la tentative : effacement et écran de connexion.
- Tous les autres cas (connecté, déconnecté, sans compte, navigation privée, session invalide/expirée, liens privés, `/architecte`) : inchangés par rapport au contrôle du 5/09 18:40 UTC.

## Rejouer

```
python3 serve-dist-spa.py 3021 dist   # ou mirror-serve.py <port> <preview|production> <cache>
node scenarios-entree.cjs <sortie> http://127.0.0.1:3021/ durci-supports supports tous
```

Miroir : `python3 scripts/production-controlee/mirror-serve.py 3019 https://moknet.net <cache>` (les chemins sans extension sont servis en `text/html`, comme la réécriture SPA de Netlify). Script Playwright : `scenarios-entree.cjs` (ce dossier ; dépendance `playwright` avec le Chromium préinstallé, Tailwind Play servi depuis une copie locale `../tailwind-play.js`). Par rapport au banc initial de la mission : canal tablette, chemin par scénario (liens privés), déclencheurs réels de déconnexion, semis du stockage une seule fois par contexte, capture avant déconnexion, budget d’attente et chronométrage par scénario. Le jeton de banc est un JWT factice non signé : aucun secret.
