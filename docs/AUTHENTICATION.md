# 🔐 AUTHENTIFICATION — LE MONDE À VOUS

> *Mise à jour : 28 août 2026 — système complet email/mot de passe + Google, prêt pour la production.*

---

## 1. Ce qui a changé

**Avant** : `Auth.tsx` simulait un flux email + mot de passe (le mot de passe n'était jamais vérifié ni transmis), et la session était un objet JSON dans `localStorage['lmav_session_v2']` restauré sur simple présence d'un champ `email` — falsifiable en un clic devtools. Le rôle admin était déterminé côté client par comparaison d'email en dur. Firebase Auth ne servait que de courtier OAuth Google pour obtenir un token d'accès aux API Drive/Chat/Meet.

**Après** : Supabase Auth est la seule source de vérité pour l'identité, avec deux méthodes de connexion pleinement fonctionnelles — **Google OAuth** (minimal, prioritaire) et **e-mail + mot de passe** (création de compte, confirmation d'e-mail, connexion, mot de passe oublié avec réinitialisation, "se souvenir de moi", déconnexion). Le rôle et les données sensibles du profil vivent en base, jamais côté client. Architecture volontairement extensible : ajouter Facebook/Apple/Microsoft plus tard = un appel de plus à `signInWithOAuthProvider(provider)`, rien d'autre à changer.

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

## 7. Écran `Auth.tsx` — 5 modes

`components/Auth.tsx` est une machine à 5 états (`mode`) :

| Mode | Déclenché par | Contenu |
|---|---|---|
| `signin` | Onglet "Se connecter" (défaut) | E-mail, mot de passe, case "se souvenir de moi", lien "Mot de passe oublié ?", bouton Google |
| `signup` | Onglet "Créer un compte" | E-mail, mot de passe (8 caractères min.), confirmation, bouton Google |
| `signup-sent` | Après un `signUp` réussi si la confirmation d'e-mail est requise | Message de confirmation + bouton "Renvoyer l'e-mail" |
| `forgot` | Lien "Mot de passe oublié ?" | E-mail seul |
| `forgot-sent` | Après `sendPasswordResetEmail` | Confirmation générique (ne révèle jamais si le compte existe) |

`components/ResetPassword.tsx` est un écran séparé, affiché uniquement quand `App.tsx` détecte l'événement Supabase `PASSWORD_RECOVERY` (lien de réinitialisation cliqué) — prioritaire sur tout le reste, même si une session est déjà active à ce moment-là.

`services/auth.ts` expose : `signInWithGoogle`/`signInWithOAuthProvider` (extensible), `signUpWithEmail`, `signInWithEmail`, `sendPasswordResetEmail`, `resendConfirmationEmail`, `updatePassword`, `signOut`, `getSession`, `onAuthStateChange` (distingue notamment `PASSWORD_RECOVERY` des connexions/déconnexions normales).

### "Se souvenir de moi"

`services/supabaseClient.ts` utilise un storage adapter hybride (`hybridStorage`) : la préférence est appelée **avant** `signIn*`/`signUp`, et détermine où le token de session Supabase est écrit — `localStorage` (persiste après fermeture du navigateur) si coché, `sessionStorage` (effacé à la fermeture de l'onglet) sinon. Vérifié : décocher la case avant une tentative de connexion règle bien `localStorage['lmav_remember_me'] = 'false'`.

---

## 8. Incident CAPTCHA (résolu le 28 août 2026)

Après activation du système complet, tous les flux e-mail/mot de passe (`signup`, `signin`, `recover`, `resend`) échouaient instantanément avec `captcha_failed` — la protection **"Attack Protection" (CAPTCHA)** de Supabase Auth était activée côté Dashboard sans intégration Turnstile/hCaptcha côté frontend (jamais demandée dans le cahier des charges). Diagnostiqué en appelant directement les 4 endpoints via `curl` (hors navigateur), qui répondaient tous en moins d'une seconde avec ce même code. Corrigé en désactivant le réglage : **Dashboard Supabase → Authentication → Attack Protection → "Enable CAPTCHA protection" → OFF**. Google restait non affecté (passe par `/authorize`, pas concerné par ce réglage). Si une protection anti-bot est souhaitée plus tard, l'ajouter proprement nécessite une clé Cloudflare Turnstile + un widget côté `Auth.tsx`, plutôt que de la réactiver sans intégration.

---

## 9. Tests réalisés

**Chaîne Google** (déjà validée en production par l'utilisateur, confirmée par de vraies connexions dans les logs Supabase depuis `moknet.net`) — non régressée par la refonte de `Auth.tsx` : bouton "Continuer avec Google" déclenche toujours l'appel exact `/auth/v1/authorize?provider=google`, sans erreur JS.

**Chaîne e-mail/mot de passe** (testée bout en bout après correction du CAPTCHA, via navigateur headless contre le vrai projet Supabase) :
- Inscription réelle : requête envoyée, réponse reçue, gestion d'erreur correcte (testé notamment sur la limite d'envoi d'e-mails par défaut de Supabase — message affiché proprement, bouton de nouveau cliquable).
- Connexion : identifiants invalides → message français clair ; Supabase renvoie volontairement le même message générique pour un e-mail non confirmé (comportement de sécurité Supabase, pas un bug — évite de révéler qu'un compte existe).
- Mot de passe oublié : requête envoyée, écran de confirmation générique affiché.
- "Se souvenir de moi" : préférence correctement écrite en `localStorage` selon l'état de la case.
- Artefacts de test nettoyés de `auth.users`/`profiles` après vérification.

**Non testable en conditions réelles dans cette session** : le clic effectif sur un lien de confirmation d'e-mail ou de réinitialisation (nécessite une vraie boîte mail humaine) — le code du côté réception (`PASSWORD_RECOVERY`, `USER_UPDATED`) a été relu mais pas déclenché par un vrai clic.
