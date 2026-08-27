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
  1. Authentification Google via Supabase Auth, avec scopes d'identité minimaux.
  2. Chargement d'un profil créé par le trigger Auth ; aucune promotion par adresse e-mail ou métadonnée client.
  3. Autorisation des opérations administratives par une Function Netlify qui vérifie le JWT, le rôle, le statut et les permissions à chaque requête.
  4. Journalisation persistante des créations, modifications, suspensions et suppressions dans `audit_logs`.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/Auth.tsx` : Écran de connexion (Google OAuth via Supabase Auth, permissions minimales).
  - `components/AdminDashboard.tsx` : Console d'administration et de supervision.
  - `components/Settings.tsx` : Paramètres de sécurité, profil, 2FA et préférences.
  - `metadata.json` : Déclaration des permissions iframe et capacités serveur.
  - `services/supabaseClient.ts`, `services/auth.ts` : Client et flux d'authentification Supabase.
  - `styles/accessibility.css` : focus visible, zones tactiles et réduction des mouvements.
  - `components/accessibility/useDialogAccessibility.ts` : confinement/restauration du focus et fermeture clavier des dialogues.
  - `contexts/GlobalContext.tsx`, `services/profile.ts` : source unique de session et mise à jour du profil propre par RPC allowlistée.
  - `services/adminApi.ts`, `netlify/functions/admin-users.ts` : contrat client et API privilégiée serveur.
  - `supabase/migrations/20260827213000_admin_directory_extension.sql` : statut, permissions, notes admin, garde de colonnes et quota partagé.
- **Modèles de Données (`types.ts` + Supabase `public.profiles`)** :
  - `UserRole` (`user | admin | expert | mentor | moderator | organization | super_admin`), `UserProfile`, `SecurityLog`, `DeviceSession`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Protection des Secrets Serveur** : Clés Gemini et API tierces isolées côté serveur, jamais transmises au navigateur. `service_role` Supabase jamais exposée au frontend (uniquement la clé `publishable`).
- **Principe du Moindre Privilège** : les rôles `user/admin/expert/mentor/moderator/organization/super_admin` proviennent de `profiles`. La création attribue toujours `user`; toute élévation passe par un contrat serveur audité. La clé `service_role` n'existe que dans l'environnement Netlify.
- **Séparation des responsabilités** : le navigateur peut mettre à jour seulement les champs personnels allowlistés via `update_my_profile`. La liste Auth, les rôles, permissions, suspensions et suppressions passent par `/api/admin/users`.
- **Défense opérationnelle** : UUID validés, cible administrative protégée, dernier `super_admin` protégé, lien d'invitation dérivé de l'URL Netlify et quota partagé de 30 mutations/minute/acteur.
- **Conformité RGPD** : Droit à l'oubli, exportation complète des données (`cloud.ts`) et chiffrement local.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé dans le code** : source unique session/profil sans upsert client, callback OAuth robuste, console riche atteignable, annuaire Auth réel, formulaires RBAC accessibles et API Netlify privilégiée. Le socle responsive/accessibilité est couvert par tests clavier, ARIA et axe.
- **Validé sur branche isolée** : migrations cœur appliquées, refus RLS couverts par pgTAP et types Supabase régénérés. La migration Admin complémentaire et les scénarios d'administration sont validés avant livraison.
- **Hors périmètre** : WebAuthn/Passkeys et email/mot de passe.
- **Évolutions Prévues** : Détection proactive des anomalies de connexion et alertes par notification push chiffrée ; activation de la protection "mots de passe compromis" de Supabase Auth une fois l'email/mot de passe implémenté.
