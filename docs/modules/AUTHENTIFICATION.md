# 🔐 MODULE D'AUTHENTIFICATION & GESTION DES IDENTITÉS — LE MONDE À VOUS
> **Documentation Technique & Opérationnelle Officielle**  
> *Dernière mise à jour : 5 Septembre 2026 (DEC-2026-081 — verrou d'entrée vérifié par le serveur)*  
> *Statut : Production Ready & Local-First Resilient*

---

## 🏛️ 1. VUE D'ENSEMBLE & PRINCIPES MAÎTRES

Le système d'authentification de **Le Monde à Vous** est conçu pour offrir une sécurité maximale, une tolérance totale aux pannes réseau ou clés manquantes (*Zero White Screen of Death*), et une intégration hybride fluide entre **Supabase Cloud** (PostgreSQL Auth + RLS) et un **moteur Local-First souverain**.

### Principes Clés :
1. **Zéro Écran Blanc** : L'application démarre et permet la connexion, la déconnexion et la création de compte même sans configuration préalable de `VITE_SUPABASE_URL` ou en mode déconnecté.
2. **Attribution Citoyenne Automatique** : Toute création de compte génère instantanément un identifiant de passeport citoyen souverain (ex: `LMAV-GN-2026-XXXX`), 100 Crédits Ⓒ et 100 XP de bienvenue.
3. **Gestion Hybride des Sessions** : Prise en charge transparente de la persistance (`localStorage` si « Se souvenir de moi », `sessionStorage` si session temporaire).

---

## 🛠️ 2. FONCTIONNALITÉS IMPLÉMENTÉES & AUDITÉES

| Fonctionnalité | Composant / Service | Statut | Résilience |
|---|---|---|---|
| **Création de Compte** | `components/Auth.tsx` & `services/auth.ts` | 🟢 100% Opérationnel | Validation temps réel, force du mot de passe, auto-création de profil Supabase + Local |
| **Connexion Email & Mot de passe** | `components/Auth.tsx` & `services/auth.ts` | 🟢 100% Opérationnel | Supabase Auth avec fallback instantané sur comptes certifiés (Admin / Citoyen) |
| **Connexion Google OAuth** | `components/Auth.tsx` & `services/auth.ts` | 🟢 100% Opérationnel | OAuth Supabase redirigé vers l'origine avec fallback profil simulé gracieux |
| **Se Souvenir de Moi** | `services/auth.ts` | 🟢 100% Opérationnel | Gestionnaire de stockage persistant vs mémoire volatile |
| **Mot de passe Oublié** | `components/Auth.tsx` & `services/auth.ts` | 🟢 100% Opérationnel | Envoi de lien de réinitialisation sécurisé + formulaire de définition nouveau mot de passe |
| **Validation des Formulaires** | `components/Auth.tsx` | 🟢 100% Opérationnel | Regex emails, jauge de force du mot de passe (0 à 4), confirmation mot de passe, CGU |
| **Gestion des Sessions** | `App.tsx` & `services/auth.ts` | 🟢 100% Opérationnel | `getSession()`, `onAuthStateChange()`, synchronisation multi-onglets `StorageEvent` |
| **Verrou d'entrée — session vérifiée par le serveur** | `services/auth.ts#verifierSession` & `App.tsx` | 🟢 En production contrôlée depuis le 5/09/2026 à 17:01 UTC (DEC-2026-081, v6.42.0) | Toute session relue depuis l'appareil est confirmée par `GET /auth/v1/user` avant d'ouvrir l'interface ; refus → session effacée, écran de connexion ; serveur injoignable → tolérance dite (§ 5) |
| **Création & Résolution de Profil** | `services/profile.ts` | 🟢 100% Opérationnel | Table `profiles`, badges, compétences, auto-génération à la première connexion |

---

## 🔑 3. IDENTIFIANTS DE TEST PRÉCONFIGURÉS (1 CLIC)

- **Super-Administrateur** : `admin@lemondeavous.com` / `admin123`
- **Citoyen Alpha** : `citoyen@lemondeavous.com` / `citoyen123`

---

## 🔒 5. VERROU D'ENTRÉE — SESSION VÉRIFIÉE PAR LE SERVEUR (DEC-2026-081, 5 septembre 2026)

**Règle** (Direction, 05/09/2026) : l'accès direct à l'interface est strictement réservé aux sessions valides ; toute personne non connectée qui ouvre `moknet.net` — depuis un SMS, WhatsApp, Messenger, un navigateur mobile ou d'ordinateur, y compris les navigateurs intégrés des applications — arrive sur l'écran de connexion ou de création de compte ; une personne déjà connectée entre directement sur Réseau MokNet.

**Ce qui se passe à l'ouverture** (`App.tsx`, `services/auth.ts`) :

| Session gardée par l'appareil | Verdict de `verifierSession()` | Écran |
|---|---|---|
| Aucune | — (aucun appel serveur) | Connexion / création de compte |
| Présente, **confirmée** par le serveur (`GET /auth/v1/user` avec le jeton, même utilisateur) | `valide` | Réseau MokNet (comme avant) |
| Présente, **refusée** par Supabase lui-même (réponse JSON 401 : jeton périmé côté serveur, révoqué, forgé ; 403 : compte supprimé ou banni ; utilisateur différent) | `invalide` → `signOut({ scope: 'local' })` | Connexion / création de compte — **avant DEC-2026-081, l'interface s'ouvrait** |
| Présente, non expirée, **aucun verdict** (panne réseau, 5xx, 429, réponse non JSON d'un portail captif ou d'un proxy, 8 s sans réponse) | `non-verifiee` | Réseau MokNet avec la session locale — tolérance DITE pour les réseaux mobiles, jamais pour un refus du serveur |
| Présente, **expirée**, serveur injoignable | — (supabase-js échoue à rafraîchir : huit tentatives avec attente croissante, fenêtre de 30 s, puis `getSession()` rend `null`) | Roue de chargement ≈ 25 s, puis connexion / création de compte — l'interface ne s'ouvre jamais (mesuré sur le bundle de production, `docs/captures/2026-09-05-acces-public-authentification/cas-par-cas/`) |

- Le verdict est attaché au **jeton**, jamais à l'événement : `getSession()`, `INITIAL_SESSION`, `SIGNED_IN` (y compris rejoué par supabase-js au retour sur l'onglet ou depuis un autre onglet, sans appel serveur), `TOKEN_REFRESHED`, `USER_UPDATED` passent tous par le verdict de leur jeton, une seule fois par jeton (`App.tsx`, `verdictsRef`) ; un jeton refusé reste refusé. Une connexion coûte un `GET /auth/v1/user` avant l'entrée.
- Garde de course : une déconnexion ou une autre session survenue pendant le chargement du profil rend le traitement en vol caduc — l'interface ne s'ouvre pas après coup (`sessionCouranteRef`).
- L'effacement local d'une session refusée est lui aussi borné par le délai : le `POST /auth/v1/logout` qui traîne ne retient pas l'écran de connexion (la session locale est retirée quoi qu'il arrive) ; au pire, un refus prend deux fois le délai, soit 16 s, jamais sans fin ; la `Map` des verdicts garde au plus quatre jetons ; une exception de `getSession()` mène à l'écran de connexion, jamais à un chargement sans fin.
- Le jeton est passé explicitement à `getUser(jeton)` : pas de verrou multi-onglets, pas de relecture du stockage.
- Tests : `tests/sessionValidee.test.ts` (verdicts sur les réponses réelles de supabase-js), `tests/appEntreeReseau.test.tsx` (écrans), `tests/netlifyRedirectsCanoniques.test.ts` (domaine).
- **Liens privés** (`?live=…`, `?invite=…`, `/messagerie`, `?module=messagerie`, `#admin`) : même verrou — sans session valide, écran de connexion ; le Live ou le module ne s'ouvre qu'une fois `isAuthenticated` vrai, le code d'invitation est seulement mémorisé (`lmav_pending_invite`) et consommé côté serveur après connexion. Seule `/architecte` est rendue **avant** le verrou : page publique de démonstration décidée en DEC-2026-066, sans donnée de compte.
- **Déconnexion** (bouton « Se déconnecter » du tiroir sur téléphone, du menu de profil sur ordinateur et tablette) : écran de connexion immédiat, jeton Supabase et profil local `lmav_session_v2` effacés ; réouverture → connexion. Résidu dit : `lmav_chat_conversations_cache` et `lmav_enrolled_persons_v1` restent sur l'appareil (aucun accès n'en découle ; durcissement possible hors périmètre de DEC-2026-081).
- **Matrice cas par cas sur le bundle de production servi** (05/09/2026, ordinateur, téléphone, tablette ; navigation privée = stockage vide) : `docs/captures/2026-09-05-acces-public-authentification/cas-par-cas/README.md` — 54/54 mesures conformes, `/architecte` tracée comme exception.

**Domaine canonique** (`netlify.toml`) : `https://www.moknet.net/*`, `http://www.moknet.net/*` et `http://moknet.net/*` sont redirigés en 301 forcé vers `https://moknet.net/:splat`, avant que l'application ne démarre ; les majuscules (`Moknet.net`, `MOKNET.NET`, majuscule automatique d'un clavier) sont normalisées par le navigateur lui-même (norme URL) et par le DNS — aucune règle nécessaire, prouvé sur dix écritures. Garde-fou : si le domaine principal du site change, ces règles changent avec lui (sinon boucle avec la redirection automatique de Netlify).

**Limites dites** : un jeton d'accès encore valide (au plus 1 h) après une « déconnexion partout » depuis un autre appareil n'est pas révoqué par ce contrôle ; quand le client vient de rafraîchir le jeton à l'ouverture, ce jeton neuf est vérifié une fois de plus (un appel, bénin) ; la tolérance « serveur injoignable » peut être durcie sur décision de la Direction ; `/architecte` reste la page publique de démonstration (DEC-2026-066), sans donnée de compte.

## 📁 4. FICHIERS DU MODULE
- `/components/Auth.tsx` : Interface utilisateur moderne, accessible, avec Color Lab institutionnel.
- `/services/auth.ts` : Moteur d'authentification unifié Supabase + Local.
- `/services/profile.ts` : Service de gestion et persistance des profils citoyens.
- `/App.tsx` : Écouteur central du cycle de vie de la session utilisateur.
