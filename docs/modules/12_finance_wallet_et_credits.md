# 💰 MODULE 12 — FINANCE, WALLET & MONNAIES
> **Ledger interne multi-devises et séquestre logique — aucun statut bancaire ou paiement externe**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Permettre des échanges économiques fluides et sans frontières en s'affranchissant de la volatilité monétaire et des frais bancaires prohibitifs pour les transferts internationaux.
- **Objectif** : Gérer les soldes en devises traditionnelles (EUR, USD, XOF, etc.), le solde de Crédits LMAV (Ⓒ), convertir les montants en temps réel et sécuriser les transactions commerciales via un tiers de confiance (*Escrow*).

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Tous les utilisateurs effectuant des achats (cours, produits, abonnements), vendeurs encaissant des revenus, étudiants recevant des récompenses d'études.
- **Parcours Type** :
  1. Consultation du solde global et de la répartition par devise dans `Wallet.tsx`.
  2. Transfert atomique entre deux UUID utilisateurs MokChat authentifiés.
  3. Suivi de l'historique détaillé des débits, crédits et fonds bloqués sous séquestre commercial.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/Wallet.tsx` : lecture du ledger et transfert interne sans mutation locale du solde.
  - `services/walletLedger.ts` : accès typé aux RPC de solde et transfert.
  - `supabase/migrations/20260827213100_wallet_commerce.sql` : ledger immuable, verrous atomiques, idempotence et escrow commerce.
- **Modèles de Données (`types.ts`)** :
  - `Currency`, `WalletTransaction`, `UserProfile.credits`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Règle de Séquestre Commercial** : Tout montant engagé dans un accord B2B ou RFQ reste bloqué sur le compte de séquestre jusqu'à la signature de conformité du bon de livraison.
- **Transparence Absolue** : Horodatage immuable et libellé explicite de chaque flux financier.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Implémenté dans le code** : solde dérivé de toutes les écritures, historique Supabase, ledger non modifiable, transfert débit/crédit atomique et idempotent, séquestre logique relié aux commandes.
- **Testé localement** : tests ciblés et build Vite.
- **Configuration requise** : migrations cœur puis `20260827213100_wallet_commerce.sql`; données et utilisateurs de test Supabase pour l'E2E.
- **Non revendiqué** : carte bancaire, recharge, retrait, change réel, crédit, Mobile Money et paiement externe. Le convertisseur est explicitement indicatif et ne produit aucune écriture.
