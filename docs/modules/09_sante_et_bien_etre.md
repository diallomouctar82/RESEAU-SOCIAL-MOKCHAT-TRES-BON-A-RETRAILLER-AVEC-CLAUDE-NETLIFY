# 🏥 MODULE 09 — SANTÉ & BIEN-ÊTRE
> **Dossier Médical Sécurisé, Prévention Sanitaire & Orientation d'Urgence avec Docteur Diallo**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Promouvoir la santé préventive, l'éducation médicale et la sécurité sanitaire universelle, particulièrement pour les voyageurs et personnes éloignées du système de soins.
- **Objectif** : Tenir à jour son carnet de santé personnel (groupe sanguin, allergies, antécédents, traitements), comprendre les protocoles de soins et trouver rapidement les structures médicales appropriées.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Patients, voyageurs nécessitant des vaccins obligatoires, personnes sous traitement chronique.
- **Parcours Type** :
  1. Renseignement et consultation de sa fiche médicale d'urgence (`userProfile.medical`).
  2. Questionnement préventif auprès du Docteur Diallo sur une posologie ou une recommandation vaccinale.
  3. Orientation vers la pharmacie ou l'hôpital de garde le plus proche via Google Maps Explorer.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/HealthCenter.tsx` : Interface santé, carnet médical et conseils préventifs.
  - `services/ai.ts` : Moteur de conseil médical supervisé par les consignes déontologiques.
- **Modèles de Données (`types.ts`)** :
  - `UserProfile.medical (bloodType, allergies, conditions, medications, emergencyContact)`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Garde-fous Médicaux Absolus** : Interdiction stricte de poser des diagnostics définitifs ou de prescrire des ordonnances.
- **Orientation Urgences** : Rappel prioritaire des numéros d'urgence vitale (15, 112, 911 selon le pays détecté).

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Fiche médicale d'urgence, gestion des allergies et antécédents, conseils préventifs structurés.
- **Clôture du point partiel d'audit (août 2026)** : les orientations sont persistées dans `module_records`, accompagnées d'un avertissement médical obligatoire et d'une source OMS configurable. Les appels utilisent désormais des liens `tel:`, la position n'est affichée qu'après consentement du navigateur et la lecture vocale utilise réellement l'API de synthèse vocale.
- **Partiel / En cours** : Rappels automatiques de prises médicamenteuses.
- **Évolutions Prévues** : Interopérabilité sécurisée avec le standard de santé HL7/FHIR.
