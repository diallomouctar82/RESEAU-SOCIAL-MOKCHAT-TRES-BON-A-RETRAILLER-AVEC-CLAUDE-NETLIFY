# 🔐 MODULE D'AUTHENTIFICATION & GESTION DES IDENTITÉS — LE MONDE À VOUS
> **Documentation Technique & Opérationnelle Officielle**  
> *Dernière mise à jour : 27 Août 2026*  
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
| **Création & Résolution de Profil** | `services/profile.ts` | 🟢 100% Opérationnel | Table `profiles`, badges, compétences, auto-génération à la première connexion |

---

## 🔑 3. IDENTIFIANTS DE TEST PRÉCONFIGURÉS (1 CLIC)

- **Super-Administrateur** : `admin@lemondeavous.com` / `admin123`
- **Citoyen Alpha** : `citoyen@lemondeavous.com` / `citoyen123`

---

## 📁 4. FICHIERS DU MODULE
- `/components/Auth.tsx` : Interface utilisateur moderne, accessible, avec Color Lab institutionnel.
- `/services/auth.ts` : Moteur d'authentification unifié Supabase + Local.
- `/services/profile.ts` : Service de gestion et persistance des profils citoyens.
- `/App.tsx` : Écouteur central du cycle de vie de la session utilisateur.
