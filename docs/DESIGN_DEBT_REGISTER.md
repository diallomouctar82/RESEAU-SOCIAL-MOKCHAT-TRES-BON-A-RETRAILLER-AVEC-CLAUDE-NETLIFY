# 📋 REGISTRE DE LA DETTE DE DESIGN & UX (DESIGN DEBT REGISTER)
> **Inventaire des Chantiers d'Optimisation Résiduels & Suivi de Rigueur**  
> *Version : 1.0 — Août 2026*  
> *Statut : Aucun point bloquant critique. Suivi des améliorations de confort futur.*

---

## 🔍 ÉVALUATION GLOBALE
Le socle fondamental **Premium Experience V1** est entièrement implémenté, cohérent et fonctionnel. Ce registre consigne les pistes d'amélioration non urgentes pour les futures itérations V1.1 / V1.2.

---

## 📑 TABLEAU DE CLASSIFICATION DE LA DETTE

| ID | Domaine | Priorité | Description du Point | Action Recommandée pour V1.1 / V1.2 | Statut |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **DEBT-01** | Dark Mode Graphiques | **Moyenne** | Certains diagrammes statistiques avancés dans le module Analytics restent optimisés pour fond clair. | Étendre les thèmes sombres de `Recharts` avec la palette Navy Deep `#070D1E`. | Planifié V1.1 |
| **DEBT-02** | Micro-interactions Haptiques | **Faible** | Sur mobile, absence de vibrations haptiques natives lors des validations de séquestre ou de jalon. | Intégrer l'API `navigator.vibrate` sur les boutons de confirmation critique. | Planifié V1.2 |
| **DEBT-03** | Cache d'images hors-ligne | **Faible** | Les photos de profil et vignettes de produits dépendent d'Unsplash si la connexion est coupée. | Prévoir un Service Worker avec mise en cache locale des avatars par défaut. | Planifié V1.1 |
| **DEBT-04** | Formulaires complexes multi-étapes | **Faible** | Certains formulaires longs de démarches consulaires pourraient bénéficier d'une sauvegarde automatique locale continue à chaque frappe clavier. | Utiliser un hook `useAutoSaveDraft` branché sur `localStorage`. | Planifié V1.1 |

---

## 🛡️ RÈGLE DE NON-RÉGRESSION
Aucun nouveau code ne doit introduire d'éléments classés en **Priorité Critique** ou **Priorité Haute**. Toute nouvelle PR / intervention doit maintenir le score de conformité WCAG AA et le respect des Design Tokens.
