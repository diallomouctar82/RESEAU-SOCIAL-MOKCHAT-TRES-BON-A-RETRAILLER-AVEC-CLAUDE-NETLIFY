# ✈️ MODULE 10 — MOBILITÉ & VOYAGE INTERNATIONAL
> **World Hub, Simulateur de Visas, Guide des 195 Pays & Itinéraires Sécurisés avec Guide Diallo**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Permettre à chaque citoyen du monde de circuler, voyager, s'expatrier ou commercer à l'international avec une visibilité totale sur les contraintes consulaires et sécuritaires.
- **Objectif** : Fournir un simulateur de visas instantané (par nationalité et pays de destination), des fiches pratiques sur 195 pays et des conseils logistiques plus performants que les plateformes classiques.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Voyageurs d'affaires, touristes, étudiants boursiers, candidats à l'expatriation.
- **Parcours Type** :
  1. Sélection du pays d'origine et du pays de destination dans le World Hub.
  2. Simulation du type de visa requis (tourisme, travail, affaires, transit) et des délais consulaires.
  3. Visualisation cartographique des ambassades, consulats et aéroports clés.
  4. Consultation des conseils de sécurité et recommandations locales avec Guide Diallo.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/WorldHub.tsx` : Explorateur mondial et simulateur consulaire.
  - `components/GoogleMapsExplorer.tsx` : Cartographie interactive mondiale.
- **Modèles de Données (`types.ts`)** :
  - `Country`, `CountrySalesAnalytics`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Fraîcheur des Données Consulaires** : Vigilance permanente sur les accords de réciprocité de visas et alertes sanitaires aux frontières.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Fiches pays complètes, simulateur d'exigences de visas, cartographie d'ambassades.
- **Partiel / En cours** : Intégration d'un comparateur de vols éco-responsables.
- **Évolutions Prévues** : Suivi en temps réel des créneaux de rendez-vous de visas consulaires (VFS/TLS).
