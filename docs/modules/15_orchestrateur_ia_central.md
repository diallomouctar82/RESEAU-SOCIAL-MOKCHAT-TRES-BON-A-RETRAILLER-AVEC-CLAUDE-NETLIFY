# 🧠 MODULE 15 — ORCHESTRATEUR CENTRAL DES MODÈLES IA & RÉSILIENCE MULTI-FOURNISSEURS
> **Cockpit Super Admin, Connecteurs Indépendants, Bascule Automatique sans Coupure & Liens Directs Développeurs**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Offrir une souveraineté et une continuité de service absolue à travers une orchestration intelligente, temps réel et tolérante aux pannes de plus de 15 fournisseurs d'intelligence artificielle.
- **Objectif** :
  1. Piloter dynamiquement tous les moteurs d'IA : Google Gemini, DeepSeek (V3/R1), Claude AI (Anthropic), OpenAI (GPT-4o/o1), Mistral AI, Alibaba Qwen (DashScope), Moonshot Kimi, Kling AI (Vidéo), ElevenLabs (Audio), HeyGen (Avatars), Runway (Cinéma), OpenRouter, n8n, xAI Grok et Ollama Local.
  2. Gérer la cascade de bascule automatique selon la spécialité de tâche (`taskCategory`), les quotas quotidiens (`dailyQuotaLimitUSD`), les temps de latence, les taux de succès et les scores de qualité.
  3. Fournir une interface de configuration enrichie avec détection automatique des variables d'environnement et 4 boutons directs 1-clic par fournisseur (Créer un compte, Générer une clé API, Documentation technique, Quotas & Facturation).

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Super Administrateurs (`visionsmart224@gmail.com`), Ingénieurs d'infrastructure.
- **Parcours Type** :
  1. L'administrateur accède au **Cockpit d'Orchestration IA** dans l'Espace Super Admin (`AdminAIResilienceHub.tsx`).
  2. Il visualise le statut en temps réel de chaque connecteur (En ligne, Dégradé, En Quarantaine, Désactivé), avec l'état de détection de la variable d'environnement (`VITE_...`).
  3. Il peut activer/désactiver un connecteur en 1 clic, modifier son rang de priorité, ajuster ses clés API / secrets / webhooks, ou cliquer sur les boutons officiels pour créer un compte ou consulter ses quotas.
  4. Il lance des simulations directes via le **Banc d'Essai** pour vérifier la cascade de résilience et consulte l'**Audit Log** des bascules sans coupure.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/admin/AdminAIResilienceHub.tsx` : Interface de pilotage, filtres par spécialité, cartes de connecteurs avec liens directs 1-clic et modales d'ajustement.
  - `services/aiRoutingService.ts` : Moteur de sélection, calcul des rangs de priorité dynamiques, filtrage par seuil budgétaire quotidien et bascule automatique en cascade (`executeWithResilience`).
  - `services/adminConfigService.ts` : Gestion des états de configuration, détection dynamique des variables d'environnement (`isEnvKeyPresent`), persistance locale sécurisée et réadmission de quarantaine.
  - `services/unifiedAIConnector.ts` : Métadonnées exhaustives des 15 fournisseurs (`AI_PORTAL_LINKS`), actions correctives et points de terminaison.
  - `server.ts` : Proxy sécurisé côté serveur pour toutes les requêtes IA avec protection absolue des clés d'API.
  - `types.ts` : Typage TypeScript complet (`AIProviderConfig`, `AIPortalLinks`, `TaskSpecialty`, `AIRoutingPolicyConfig`, `AIFailoverLog`).

---

## 🛡️ 4. RÈGLES DE RÉSILIENCE & GOUVERNANCE
1. **Zéro Écran Blanc & Tolérance aux Clés Manquantes** : Aucune clé manquante ne bloque l'application ; le système dégrade gracieusement et privilégie les connecteurs disponibles ou le fallback souverain.
2. **Priorité par Spécialité Métier** : Les requêtes juridiques favorisent Claude ou DeepSeek R1 ; la génération vidéo cible Runway ou Kling AI ; la voix haute fidélité cible ElevenLabs.
3. **Plafond Budgétaire Quotidien** : Tout fournisseur dont la consommation du jour dépasse le plafond configuré (`dailyQuotaLimitUSD`) est temporairement écarté de la cascade active jusqu'au jour suivant.
4. **Audit Transparent** : Tout incident de latence ou d'erreur réseau génère un log d'audit horodaté permettant de tracer chaque étape de la bascule.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT
- **Terminé** :
  - 15+ connecteurs d'IA intégrés et typés.
  - Moteur de bascule automatique avec bonus par spécialité de tâche et vérification de budget quotidien.
  - Boutons 1-clic vers les portails développeurs officiels.
  - Détection automatique des variables d'environnement.
  - Banc d'essai interactif et journal d'audit des bascules.
  - Compilation validée sans aucune erreur.
