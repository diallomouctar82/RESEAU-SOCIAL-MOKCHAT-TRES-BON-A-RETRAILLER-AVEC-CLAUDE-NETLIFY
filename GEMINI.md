# 🌍 DIRECTIVES PERMANENTES GEMINI — LE MONDE À VOUS
> **Guide d'Opération & Intégrité Système pour les Agents Gemini et Antigravity**

---

## 🏛️ 1. DIRECTIVES FONDAMENTALES DU PROJET

1. **Incarnation Humaine Déontologique** : Les experts sont des membres humains de la Famille DIALLO. Ils ne se présentent jamais comme des chatbots ou des intelligences artificialles.
2. **Qualité & Rigueur du Craft** : Design épuré, typographie hiérarchisée, contrastes respectés, accessibilité WCAG AA.
3. **Mémoire Vivante & Continuité** : La documentation située dans `/docs/` fait autorité. Elle doit être consultée au début de chaque mission et enrichie à la fin de chaque mission.
4. **Backend Supabase par Défaut** : Utiliser **Supabase** pour tout besoin backend/cloud (Auth, PostgreSQL, Storage). Ne jamais initier Firebase sauf demande explicite de l'utilisateur.
5. **Déploiement Garanti sans Écran Blanc (GitHub & Netlify)** :
   - Initialisation lazy à la demande (`getClient()`).
   - Dégradation gracieuse immédiate : l'application démarre et tourne même sans clé API.
   - Toutes les clés passent exclusivement par les variables d'environnement (`.env.example`).
   - Priorité constante : Stabilité > Déploiement réussi > Nouvelles fonctionnalités.

---

## 🧭 2. PROCÉDURE DE TRAVAIL OBLIGATOIRE

```
1. LIRE       ➔ /docs/LIVRE_DE_VISION.md et /docs/modules/...
2. CONTRÔLER  ➔ Éviter les contradictions, doublons, crashs au démarrage et régressions
3. EXÉCUTER   ➔ Développer avec modularité, typage strict et initialisation lazy
4. TESTER     ➔ compile_applet (vérifier zéro écran blanc et zéro crash)
5. DOCUMENTER ➔ Actualiser /docs/JOURNAL_DECISIONS.md, /docs/ETAT_ACTUEL.md et les modules
```

---

## 🗂️ 3. RÉFÉRENCES DIRECTES
- **Table des matières générale** : `/docs/README.md`
- **Vision Suprême** : `/docs/LIVRE_DE_VISION.md`
- **Cartographie & Flux** : `/docs/ARCHITECTURE_GLOBALE.md`
- **Journal des Décisions** : `/docs/JOURNAL_DECISIONS.md`
- **État Actuel** : `/docs/ETAT_ACTUEL.md`
- **Guide Opérationnel** : `/docs/GUIDE_CONTINUITE.md`

