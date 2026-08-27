# 💰 MODULE 12 — FINANCE, WALLET & MONNAIES
> **Portefeuille Multi-Devises, Crédits LMAV, Conversion Instantanée & Séquestre Sécurisé (Escrow)**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Permettre des échanges économiques fluides et sans frontières en s'affranchissant de la volatilité monétaire et des frais bancaires prohibitifs pour les transferts internationaux.
- **Objectif** : Gérer les soldes en devises traditionnelles (EUR, USD, XOF, etc.), le solde de Crédits LMAV (Ⓒ), convertir les montants en temps réel et sécuriser les transactions commerciales via un tiers de confiance (*Escrow*).

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Tous les utilisateurs effectuant des achats (cours, produits, abonnements), vendeurs encaissant des revenus, étudiants recevant des récompenses d'études.
- **Parcours Type** :
  1. Consultation du solde global et de la répartition par devise dans `Wallet.tsx`.
  2. Rechargement du compte en Crédits ou retrait des gains vers un compte tiers.
  3. Suivi de l'historique détaillé des débits, crédits et fonds bloqués sous séquestre commercial.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/Wallet.tsx` : Espace bancaire et gestionnaire de portefeuille.
  - `contexts/GlobalContext.tsx` : Méthodes `updateUserCredits`, `addTransaction`.
- **Modèles de Données (`types.ts`)** :
  - `Currency`, `WalletTransaction`, `UserProfile.credits`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Règle de Séquestre Commercial** : Tout montant engagé dans un accord B2B ou RFQ reste bloqué sur le compte de séquestre jusqu'à la signature de conformité du bon de livraison.
- **Transparence Absolue** : Horodatage immuable et libellé explicite de chaque flux financier.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Portefeuille multi-devises, gestion des Crédits Ⓒ, historique des transactions, simulation de conversion.
- **Partiel / En cours** : Intégration de passerelles directes Mobile Money (Orange Money, Wave, M-Pesa).
- **Évolutions Prévues** : Micro-crédit d'honneur communautaire pour financer des bourses d'études Campus.
