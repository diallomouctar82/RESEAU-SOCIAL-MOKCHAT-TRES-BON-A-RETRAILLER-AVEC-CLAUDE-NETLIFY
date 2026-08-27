# 🔐 AUTHENTIFICATION — LE MONDE À VOUS

> *Mise à jour : 27 août 2026 — migration Firebase → Supabase Auth.*

---

## 1. Ce qui a changé

**Avant** : `Auth.tsx` simulait un flux email + mot de passe (le mot de passe n'était jamais vérifié ni transmis), et la session était un objet JSON dans `localStorage['lmav_session_v2']` restauré sur simple présence d'un champ `email` — falsifiable en un clic devtools. Le rôle admin était déterminé côté client par comparaison d'email en dur. Firebase Auth ne servait que de courtier OAuth Google pour obtenir un token d'accès aux API Drive/Chat/Meet.

**Après** : Supabase Auth est la seule source de vérité pour l'identité. Google OAuth est le provider prioritaire (email/mot de passe reporté à une mission ultérieure, regroupé avec Facebook/Apple/Microsoft/OTP). Le rôle et les données sensibles du profil vivent en base, jamais côté client.

---

## 2. Deux flux Google distincts (ne pas confondre)

| | Connexion (`services/auth.ts`) | Lien Google Workspace (`services/googleWorkspaceLink.ts`) |
|---|---|---|
| Déclenché par | Bouton "Continuer avec Google" (`Auth.tsx`) | Bouton "Lier Google Workspace" (`GoogleWorkspaceBanner.tsx`), optionnel |
| Scopes demandés | Identité minimale (email, profil) | Drive + Chat + Meet (larges) |
| Mécanisme | `supabase.auth.signInWithOAuth({ provider: 'google' })` — redirection complète, crée la session app | Google Identity Services (`initTokenClient`), token en mémoire uniquement |
| Résultat | Session Supabase (`profiles` chargé) | `access_token` Google Workspace pour les appels REST Drive/Chat/Meet |

**Pourquoi séparer les deux** : la connexion doit rester minimale (permission la plus faible nécessaire — principe explicite du cahier des charges). Mais `services/googleWorkspace.ts` (Drive/Chat/Meet) est une intégration REST **réelle**, pas un mock, et nécessite ces scopes larges. Les confondre aurait soit cassé Drive/Chat/Meet, soit affiché un écran de consentement Google intimidant à chaque connexion.

---

## 3. Flux détaillé

1. Utilisateur clique "Continuer avec Google" → `signInWithGoogle()` → redirection vers Google.
2. Google redirige vers `https://rqciahtpixdjbyoajomg.supabase.co/auth/v1/callback` (configuré côté Google Cloud).
3. Supabase échange le code, crée/retrouve la ligne `auth.users`, redirige vers l'app (`redirectTo`).
4. **Première connexion uniquement** : le trigger serveur `handle_new_user()` crée automatiquement la ligne `profiles` (nom/avatar depuis `raw_user_meta_data` fourni par Google ; rôle `admin` uniquement si l'email correspond à l'admin bootstrap, sinon `user`).
5. `App.tsx` détecte la session via `onAuthStateChange`, charge le profil (`fetchUserProfile`), l'app est utilisable.
6. Déconnexion : `signOut()` (Supabase) — la session est invalidée serveur, pas juste effacée localement.

---

## 4. Prérequis pour une connexion Google fonctionnelle (action manuelle requise)

Le code est prêt ; il manque la configuration du provider côté Google Cloud + Supabase (aucun outil ne permet de le faire par API dans cette mission) :

1. Google Cloud Console (projet `gen-lang-client-0283381376`, déjà lié à Gemini) → **APIs & Services → Credentials** → Client OAuth existant (`696305097958-het97su4mr1qru48q6ja9q9a6atki5qd.apps.googleusercontent.com`, déjà utilisé pour Maps/Workspace) ou nouveau client.
2. Ajouter dans **Authorized redirect URIs** : `https://rqciahtpixdjbyoajomg.supabase.co/auth/v1/callback`.
3. Copier Client ID + Client Secret dans **Supabase Dashboard → Authentication → Providers → Google**.
4. Ajouter les URLs Netlify à la liste **Redirect URLs** de Supabase Auth. **Deux sites Netlify sont liés à ce même dépôt GitHub** (déploient tous les deux automatiquement à chaque push sur `main`) — ajouter les deux :
   - `https://lovely-maamoul-478226.netlify.app/**`
   - `https://incandescent-moxie-cbffe6.netlify.app/**`

   *(27 août 2026 : un premier test a révélé que les variables d'environnement Supabase n'étaient configurées que sur `lovely-maamoul-478226` — `incandescent-moxie-cbffe6` recevait donc l'URL de repli `placeholder.supabase.co`. Corrigé : les 4 variables sont désormais posées sur les deux sites, un déploiement a été redéclenché sur `incandescent-moxie-cbffe6`, et le bundle réellement servi a été vérifié. Si un troisième site Netlify pour ce dépôt apparaît un jour, penser à répéter cette configuration.)*

Tant que cette étape n'est pas faite, le bouton Google affiche une erreur propre et catchée (pas un écran blanc) — vérifié par test automatisé (build + navigateur headless, avec et sans configuration).

---

## 5. Variables d'environnement (frontend, jamais de secret serveur)

| Variable | Usage | Sensible ? |
|---|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Non |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (`publishable`) | Non (jamais `service_role`) |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | Client ID pour le lien Workspace (Google Identity Services) | Non (un Client ID OAuth n'est pas secret ; le Client Secret, lui, ne quitte jamais Supabase Dashboard) |
| `VITE_GOOGLE_MAPS_API_KEY` | Clé Google Maps (extraite de l'ancien `firebase-applet-config.json`, supprimé) | Non |

Toutes déjà configurées sur Netlify (site `lovely-maamoul-478226`).

---

## 6. Rôles

Voir `docs/SUPABASE_ARCHITECTURE.md §3`. Résumé : `role` est une colonne serveur protégée (`profiles.role`), jamais recalculée côté client. Valeurs préparées pour l'avenir : `user`, `admin`, `expert`, `mentor`, `moderator`, `organization`, `super_admin`.

---

## 7. Tests réalisés vs à faire

**Fait (automatisé, cette mission)** : build sans variables d'environnement (l'app démarre quand même, erreur catchée) ; build avec variables réelles + clic "Continuer avec Google" → vérifié que l'appel réseau exact (`/auth/v1/authorize?provider=google`) part sans erreur JS.

**À faire une fois le prérequis §4 complété** (nécessite une vraie session Google, donc un navigateur humain) : première connexion réelle (création profil), reconnexion, déconnexion, session multi-appareils, révocation/erreur provider, comportement mobile. Voir la checklist complète du cahier des charges (section "Tests Auth").
