# 🌍 MODULE 02 — MARCHÉ MONDIAL & COMMERCE INTERNATIONAL
> **Plateforme Commerciale Universelle B2B / B2C / C2C, Suite Import-Export & Business OS**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Démocratiser le commerce mondial en offrant aux artisans, PME, importateurs et distributeurs du monde entier une infrastructure sécurisée, transparente et équitable.
- **Objectif** : Couvrir l'intégralité du cycle commercial (sourcing, cotation, négociation contractuelle, Incoterms, logistique, dédouanement, salons virtuels et résolution des litiges).

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Acheteurs particuliers (B2C/C2C), grossistes, fabricants industriels, exportateurs, courtiers en fret, investisseurs.
- **Parcours Type** :
  1. L'acheteur explore le catalogue ou publie un appel d'offres (RFQ).
  2. Le vendeur soumet un devis intégrant les Incoterms 2020 (EXW, FOB, CIF, DDP).
  3. L'assistant de négociation IA guide les deux parties vers un accord équitable.
  4. La commande est validée sous séquestre Wallet (*Escrow*), la logistique est tracée et les litiges éventuels sont médiés par Maître Diallo.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/Shop.tsx` : Vitrine générale et exploration multi-catégories.
  - `components/MyShop.tsx` : Espace de gestion vendeur / boutique.
  - `components/TradeBusinessOperatingSystem.tsx` : Console complète B2B & Import-Export.
  - `components/Trade*` (15 modules de cotation, sourcing, litiges, salons, etc.).
  - `components/business/*` (CRM, stocks, rentabilité, commandes).
- **Modèles de Données (`types.ts`)** :
  - `Product`, `TradeDealNegotiation`, `BuyRequestRFQ`, `CommercialDossier`, `SupplierScorecard`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Contrats Normés** : Tous les échanges B2B intègrent les standards internationaux de la Chambre de Commerce Internationale (Incoterms 2020).
- **Sécurité Financière** : Blocage des fonds en séquestre jusqu'à validation de la conformité de la marchandise à la livraison.
- **Mok Trust** : Notation obligatoire des parties après chaque transaction complétée.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : Catalogue tridimensionnel, Calculateur de coût complet (*Landed Cost*), Système de RFQ, Négociation assistée, Salons virtuels.
- **Partiel / En cours** : Intégration de documents douaniers officiels scannés par OCR.
- **Évolutions Prévues** : Agents autonomes de négociation pour pré-traiter les demandes 24h/24.
