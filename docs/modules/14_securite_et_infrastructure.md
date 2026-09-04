# 🔒 MODULE 14 — SÉCURITÉ, RÔLES & INFRASTRUCTURE SYSTÈME
> **Contrôle d'Accès RBAC, Authentification, Protection des Données & Résilience d'Exécution**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Garantir la souveraineté numérique de chaque citoyen de la plateforme, préserver la stricte confidentialité de ses données de vie et assurer une disponibilité sans faille du service.
- **Objectif** : Appliquer un contrôle d'accès basé sur les rôles (RBAC), sécuriser les clés d'API serveur, chiffrer les pièces sensibles et maintenir un journal d'audit complet.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Administrateurs système, superviseurs d'experts, utilisateurs généraux.
- **Parcours Type** :
  1. Authentification sécurisée via `components/Auth.tsx` (avec distinction automatique du compte superviseur `visionsmart224@gmail.com`).
  2. Attribution des droits, jetons de session et permissions d'interface.
  3. Journalisation transparente des événements de sécurité dans le Coffre-fort numérique (`SecurityLog`).

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/Auth.tsx` : Écran de connexion (Google OAuth via Supabase Auth, permissions minimales).
  - `components/AdminDashboard.tsx` : Console d'administration et de supervision.
  - `components/Settings.tsx` : Paramètres de sécurité, profil, 2FA et préférences.
  - `metadata.json` : Déclaration des permissions iframe et capacités serveur.
  - `services/supabaseClient.ts`, `services/auth.ts` : Client et flux d'authentification Supabase.
- **Modèles de Données (`types.ts` + Supabase `public.profiles`)** :
  - `UserRole` (`user | admin | expert | mentor | moderator | organization | super_admin`), `UserProfile`, `SecurityLog`, `DeviceSession`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Protection des Secrets Serveur** : Clés Gemini et API tierces isolées côté serveur, jamais transmises au navigateur. `service_role` Supabase jamais exposée au frontend (uniquement la clé `publishable`).
- **Principe du Moindre Privilège** : Les fonctions d'administration et de modération globale sont réservées au rôle `admin`, fixé **côté base** (trigger serveur), plus jamais calculé côté client. Row Level Security activé sur toutes les tables (voir `docs/SUPABASE_ARCHITECTURE.md`).
- **Conformité RGPD** : Droit à l'oubli, exportation complète des données (`cloud.ts`) et chiffrement local.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Authentification Supabase (Google OAuth), gestion des rôles server-side avec RLS, tableau de bord admin. *(27 août 2026 : migration complète depuis l'ancienne session `localStorage` falsifiable — voir `docs/AUTHENTICATION.md`.)*
- **Partiel / En cours** : Authentification biométrique WebAuthn / Passkeys ; email/mot de passe réel (reporté, Google restait prioritaire).
- **Évolutions Prévues** : Détection proactive des anomalies de connexion et alertes par notification push chiffrée ; activation de la protection "mots de passe compromis" de Supabase Auth une fois l'email/mot de passe implémenté.

---

## 🩺 6. SANTÉ GLOBALE — CONSOLE DE MESURE ET DE RÉPARATION CONTRÔLÉE

*(DEC-2026-050 — 4 septembre 2026. Statut : base déployée, écran en essai, non fusionné.)*

### 6.1. Pourquoi elle existe

Un audit produit un état des lieux figé : utile une fois, périmé le lendemain.
Pire, deux des constats les plus graves du 4 septembre — la forge de crédits
(`award_xp_and_credits` exécutable par tout compte connecté) et le crédit de
portefeuille auto-déclaré — **n'étaient pas visibles dans le code source**.
Ils n'apparaissaient qu'en interrogeant la base réelle. Cette console regarde
la production, pas ce que le dépôt prétend.

### 6.2. Le principe directeur : aucun faux vert

- Une ligne non mesurée est **blanche**, jamais verte.
- Le score voyage **toujours** avec sa couverture.
- Une sonde qui tombe fait **baisser la couverture**, jamais monter la note.
- La certification exige zéro rouge, zéro orange **et** zéro blanc.

### 6.3. Architecture

| Couche | Rôle |
| :--- | :--- |
| `services/health/healthRegistry.ts` | Source de vérité : 12 domaines, 52 lignes, pondérations. |
| `services/health/healthScore.ts` | Notation pure. Un domaine non mesuré sort du dénominateur. |
| `services/health/healthService.ts` | 8 sondes navigateur réelles (en-têtes servis, CSP, scripts tiers exécutés, HSTS, service worker, manifestes, stockage local). |
| `supabase/functions/health-guardian/` | Dispatcher `probe \| diagnose \| repair \| restore \| journal`. CORS restreint par conception. |
| `supabase/migrations/20260904150000_health_guardian.sql` | `health_snapshots` (coffre), 13 fonctions `health_*`, catalogue fermé de 15 réparations. |
| `components/admin/AdminHealthTab.tsx` | L'écran : anneaux score/couverture, matrice des 12 domaines, file de travail, journal. |

### 6.4. Ce qui empêche une réparation de mal tourner

1. **Catalogue fermé** — le navigateur n'envoie qu'un identifiant : jamais une
   table, une condition, ni du SQL. `health_remediation_spec` est révoquée à
   `anon` et `authenticated`.
2. **Sauvegarde et action dans la même transaction** — il est impossible
   d'obtenir un changement sans sa sauvegarde. Restauration en un clic.
3. **Jeton signé lié au périmètre affiché** — si le nombre d'éléments concernés
   bouge entre l'affichage et le clic, l'application est refusée (HTTP 409).
4. **Rang Admin Général** — l'écriture exige `super_admin`
   (`health_require_general_admin`). `is_admin()` ne convenait pas : il répond
   vrai pour `admin` **comme** pour `super_admin`.
5. **Coffre inaccessible au navigateur** — `health_snapshots` : RLS activée,
   **aucune policy**, droits révoqués à `anon` et `authenticated`, charge utile
   bornée à 8 Mo.

### 6.5. Ce que la construction a appris

- **Les orphelins supposés étaient impossibles.** Toutes les relations visées
  sont protégées par une clé étrangère `ON DELETE CASCADE`. Les boutons de
  purge ont été retirés : ils n'auraient jamais rien purgé et auraient masqué
  la vraie cause.
- **Deux défauts réels ont été trouvés puis laissés ouverts.** L'URL n'ouvre
  aucun écran (le hash est écrit depuis la LOOP I4, jamais relu), et le
  bandeau Super Admin affiche une chaîne écrite en dur, identique au bit près
  en production et dans un aperçu. Les deux corrections ont été construites,
  puis retirées : elles touchent `App.tsx`, `services/auth.ts` et l'en-tête,
  c'est-à-dire du code qui fonctionne déjà, alors que la mission était limitée
  à l'implantation du bouton. Elles restent à traiter, séparément.

### 6.6. Retour arrière

`supabase/rollback/20260904150000_health_guardian_rollback.sql`. La migration
ne contient aucune écriture visant un objet préexistant : supprimer ce qu'elle
a créé remet la base dans son état antérieur.

### 6.7. Réserves connues

- `HEALTH_ALLOWED_ORIGINS` non définie : repli CORS sur `*`, journalisé. À
  restreindre aux domaines MokNet.
- **Aucun compte `super_admin`** : le diagnostic fonctionne, « Réparer » et
  « Restaurer » refuseront tant qu'un compte ne sera pas promu.
