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
