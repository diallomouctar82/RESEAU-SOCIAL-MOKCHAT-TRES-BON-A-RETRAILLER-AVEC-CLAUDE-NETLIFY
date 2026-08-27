# Authentification Supabase

> État vérifié le 28 août 2026.

## Flux réel

Supabase Auth est l'unique source d'identité de l'application. La connexion Google utilise PKCE et ne demande que les permissions d'identité ; l'autorisation Google Workspace (Drive/Chat/Meet) reste un consentement séparé.

1. `Auth.tsx` appelle `signInWithGoogle()`.
2. Supabase redirige vers Google, reçoit le callback puis renvoie vers l'origine autorisée.
3. `handle_new_user()` crée une seule ligne `profiles` lors de la première inscription.
4. L'événement `INITIAL_SESSION` ou `SIGNED_IN` hydrate le contexte via `fetchUserProfile()`.
5. `SIGNED_OUT` efface l'état React ; `signOut()` n'est appelé qu'une seule fois.

Le contexte global ne restaure plus une pseudo-session depuis `localStorage` et ne lance plus un deuxième listener Auth. Le chargement d'un profil est distinct de son édition : hydrater `id`, `role`, `credits` ou `xp` ne déclenche aucune écriture en base.

## Preuve observée

Les journaux Auth des dernières 24 heures du projet actif montraient :

- 36 événements provider Google ;
- 12 connexions OAuth et 2 inscriptions ;
- 15 callbacks redirigés, 23 lectures `/user` réussies et 9 échanges `/token` réussis.

Le flux principal Google fonctionne donc réellement sur `moknet.net`. Deux callbacks anciens ou relancés ont produit `OAuth state not found or expired` et `OAuth state parameter missing`. Le client consomme désormais ces paramètres une seule fois, nettoie l'URL avec `history.replaceState` et propose de relancer proprement la connexion.

## Profil et rôles

Le navigateur ne crée jamais `profiles`. La fonction trigger :

- copie uniquement un nom et un avatar depuis `raw_user_meta_data` ;
- attribue toujours `role = user` ;
- ne crédite aucun solde initial privilégié ;
- conserve les données déjà renseignées lors d'un nouvel événement Auth idempotent.

Le rôle n'est jamais déduit de l'adresse email. Une promotion utilise une RPC administrative auditée. Les champs personnels modifiables passent par `update_my_profile` avec une liste explicite ; email, rôle, crédits, XP et niveau sont refusés.

## Configuration publique

| Variable | Usage |
|---|---|
| `VITE_SUPABASE_URL` | URL publique du projet |
| `VITE_SUPABASE_ANON_KEY` | clé publishable/anon, jamais `service_role` |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | intégrations Google côté navigateur quand nécessaire |

Si URL ou clé publique manque, le client Supabase reste lazy et l'application ne plante pas à l'import. Le bouton explique que la connexion est indisponible.

Dans Supabase Auth, l'opérateur doit maintenir `https://moknet.net/**` et les previews approuvées dans les Redirect URLs. Le callback Google autorisé côté Google Cloud est celui du projet Supabase. Le secret OAuth reste exclusivement dans la configuration du provider Supabase.

## Scénarios de validation

| Scénario | État |
|---|---|
| Google OAuth sur le domaine actif | prouvé par logs Auth |
| callback expiré/manquant sans boucle ni écran blanc | corrigé côté client ; test navigateur à rejouer |
| création profil unique par trigger | couvert par migration et test SQL à exécuter |
| tentative de changement rôle/crédits depuis un compte normal | cas de refus pgTAP écrit, exécution distante attendue |
| déconnexion et restauration de session PKCE | code unifié ; test E2E navigateur attendu |

Un test écrit mais non exécuté n'est jamais compté comme réussi.
