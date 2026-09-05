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
  - `services/health/healthRegistry.ts` : registre du tableau de bord « Santé Globale » (53 lignes, 12 domaines, poids par domaine = 100 sous garde).
  - `supabase/functions/health-guardian/` : fonction Edge de sondage (`index.ts` seul au réseau, `evaluate.ts` et `liveTransportProbe.ts` purs), artefact déployé généré par `build-bundle.sh`.
- **Modèles de Données (`types.ts` + Supabase `public.profiles`)** :
  - `UserRole` (`user | admin | expert | mentor | moderator | organization | super_admin`), `UserProfile`, `SecurityLog`, `DeviceSession`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Protection des Secrets Serveur** : Clés Gemini et API tierces isolées côté serveur, jamais transmises au navigateur. `service_role` Supabase jamais exposée au frontend (uniquement la clé `publishable`).
- **Principe du Moindre Privilège** : Les fonctions d'administration et de modération globale sont réservées au rôle `admin`, fixé **côté base** (trigger serveur), plus jamais calculé côté client. Row Level Security activé sur toutes les tables (voir `docs/SUPABASE_ARCHITECTURE.md`).
- **Conformité RGPD** : Droit à l'oubli, exportation complète des données (`cloud.ts`) et chiffrement local.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Authentification Supabase (Google OAuth), gestion des rôles server-side avec RLS, tableau de bord admin. **Tableau de bord « Santé Globale » (Super-Admin, 4 septembre 2026)** : 41 lignes évaluées côté serveur, aucun vert non mesuré (un évaluateur qui lève = blanc), réparation avec sauvegarde, journal et restauration ; **SAT-4 (5 septembre 2026, DEC-2026-054)** : la ligne « un direct peut réellement démarrer » interroge `ListRooms` avec la clé du coffre au lieu d'un ping — fonction Edge `health-guardian` v2 en production et démontrée (vert, 400 ms), ligne côté écran en production (PR #77, 5 septembre 2026). *(27 août 2026 : migration complète depuis l'ancienne session `localStorage` falsifiable — voir `docs/AUTHENTICATION.md`.)*
- **Terminé et en production contrôlée (5 septembre 2026, DEC-2026-055, v6.20.0)** : **SAT-5** — relance automatique bornée d'un direct gardée par l'état réel en base, écran « Ce direct est terminé. » sur un direct clos, et clôture horaire des directs zombies par `pg_cron` (première exécution réelle : 13 fermés, tracés dans `audit_logs`) ; prouvé au banc réel 39/39 contre un LiveKit vivant ; la frontière VPS (conteneur, clé, ports, version) reste à SAT-6/ACT.
- **Livré sur branche, EN PR, NON DÉPLOYÉ (5 septembre 2026, DEC-2026-057, v6.22.0)** : **SAT-6** — le bouton de secours du direct, réservé à l'Admin Général : relancer la room d'un direct ou le clore depuis la Santé Globale, sans SSH ; rang relu **en base** (`health_my_rank`) avant toute lecture et de nouveau au geste, diagnostic qui compte les présents réels, confirmation signée (HMAC, cinq minutes, liée au geste, au direct et à l'acteur), re-mesure avant verdict, journal `audit_logs` (`health.emergency`) ; la clôture passe par la RLS avec l'identité de l'appelant, jamais par le rôle service ; les gestes SSH (conteneur, clé, ports UDP, version) sont listés comme action humaine. Le banc réel a aussi fait corriger deux défauts pré-existants : les modales de l'espace admin (tiroir de détail, modale de réparation) étaient cadrées sur l'onglet et non sur la fenêtre — un `transform` identité laissé par l'animation d'entrée piège tout `position:fixed`, désormais rendues par portail — et un spectateur pouvait être éjecté à son arrivée par une course du roster du direct. Ni la fonction Edge (v3) ni le client ne sont déployés : validation Direction requise, fonction Edge avant le client.
- **Partiel / En cours** : Authentification biométrique WebAuthn / Passkeys ; email/mot de passe réel (reporté, Google restait prioritaire).
- **Évolutions Prévues** : Détection proactive des anomalies de connexion et alertes par notification push chiffrée ; activation de la protection "mots de passe compromis" de Supabase Auth une fois l'email/mot de passe implémenté.
