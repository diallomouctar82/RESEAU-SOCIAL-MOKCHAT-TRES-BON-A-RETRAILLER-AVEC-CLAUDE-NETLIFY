# 🏠 MODULE 08 — LOGEMENT & HABITAT
> **Recherche Immobilière, Baux Locatifs, Droits des Locataires & Simulateur d'Aides avec Monsieur Diallo**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Garantir à chacun l'accès à un habitat digne et sécurisé en évitant les arnaques locatives et en facilitant l'accès aux aides au logement.
- **Objectif** : Trouver un logement adapté à son budget, simuler ses droits aux allocations (APL, aides locales), analyser la conformité des baux et obtenir une assistance en cas de litige bailleur.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Locataires, étudiants, familles en recherche d'installation, personnes en situation de précarité résidentielle.
- **Parcours Type** :
  1. Recherche d'annonces de logements selon la zone géographique et le budget.
  2. Simulation du montant estimé des aides sociales / APL.
  3. Vérification des clauses du contrat de bail par Monsieur Diallo avant signature.
  4. Localisation des services de proximité (transports, écoles, commerces).

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/HousingCenter.tsx` : Console logement et simulateur d'aides.
  - `components/GoogleMapsExplorer.tsx` : Cartographie interactive des quartiers.
- **Modèles de Données (`types.ts`)** :
  - `HousingListing`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Anti-Arnaque** : Détection des demandes illégales de cautions préalables en espèces.
- **Protection Locative** : Rappel des plafonds de loyers et des obligations d'isolation thermique par pays.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Moteur de recherche d'annonces, simulateur de budget locatif, guides de droits locataires.
- **Clôture du point partiel d'audit (août 2026)** : les fausses annonces et estimations d'aides ont été retirées. Les recherches, analyses anti-arnaque et lettres locataires sont persistées dans `module_records`; les aides renvoient vers une source officielle HTTPS configurable et aucune donnée financière absente n'est inventée.
- **Partiel / En cours** : Générateur d'état des lieux numérique contradictoire avec photos horodatées.
- **Évolutions Prévues** : Dépôt direct de dossier locataire certifié (*Garantie LMAV*).
