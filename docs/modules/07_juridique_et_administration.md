# ⚖️ MODULE 07 — JURIDIQUE & ADMINISTRATION
> **Accompagnement Législatif, Procédures Administratives, Titres de Séjour & Coffre-Fort Numérique avec Maître Diallo**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Rendre le droit compréhensible et accessible, afin que chaque citoyen connaisse ses droits et puisse surmonter les démarches administratives complexes sans crainte.
- **Objectif** : Guider l'utilisateur dans ses démarches (titres de séjour, naturalisation, contrats, litiges, création de société) et sécuriser ses pièces d'identité dans un coffre-fort numérique crypté.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Étrangers en cours de régularisation, justiciables, entrepreneurs rédigeant des contrats, usagers administratifs.
- **Parcours Type** :
  1. Choix d'une procédure administrative dans le catalogue officiel.
  2. Analyse des critères d'éligibilité et constitution de la liste des pièces justificatives.
  3. Rédaction assistée de courriers officiels ou de recours gracieux.
  4. Sauvegarde sécurisée des documents dans le Coffre-fort numérique (`DigitalSafe.tsx`).

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/LegalCenter.tsx` : Portail des démarches et conseils juridiques.
  - `components/DigitalSafe.tsx` : Coffre-fort numérique de documents.
- **Modèles de Données (`types.ts`)** :
  - `LegalProcedure`, `StoredDocument`, `SecurityLog`, `DeviceSession`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Limites Déontologiques** : Maître Diallo fournit des conseils doctrinaux et des modèles types sans se substituer à la représentation par un avocat assermenté au barreau.
- **Chiffrement des Données** : Les documents sensibles déposés dans le Coffre-fort sont chiffrés localement.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Catalogue des procédures courantes, générateur de courriers types, Coffre-fort avec journal de sécurité.
- **Clôture du point partiel d'audit (août 2026)** : procédures, analyses de documents et courriers sont persistés dans `module_records` avec RLS propriétaire, reprise de synchronisation et états vide/chargement/erreur. Les contenus interdisent les références inventées, affichent leur limite non autoritative et renvoient vers une source officielle HTTPS configurable.
- **Partiel / En cours** : Intégration directe avec les portails gouvernementaux de téléprocédure.
- **Évolutions Prévues** : Signature électronique certifiée eIDAS des actes générés.
