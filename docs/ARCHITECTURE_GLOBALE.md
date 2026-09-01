# 🗺️ CARTE D'ARCHITECTURE FONCTIONNELLE & TECHNIQUE GLOBALE
> **Cartographie du Système, Flux Inter-Modules, Services Partagés et Modèle de Données**  
> *Plateforme : Le Monde à Vous (v5.5)*

---

## 🏛️ 1. VUE EN COUCHES DU SYSTÈME (ARCHITECTURE 4-TIERS)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             1. COUCHE EXPÉRIENCE UTILISATEUR                     │
│  [Layout Principal] ── [Barre Navigation] ── [Notifications] ── [HUD Multimodal] │
│  ├─ Dashboard        ├─ Experts/Chat      ├─ Marché Mondial   ├─ Career Center  │
│  ├─ Campus Éducation ├─ Social Live/MOK   ├─ Language Center  ├─ Legal & Safe   │
│  ├─ Housing Center   ├─ Health Center     ├─ World Hub        ├─ Studio Créatif │
│  └─ Wallet & Finance └─ Google Workspace  └─ Conseil Réuni    └─ Admin Console  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         2. COUCHE CONTEXTE & ORCHESTRATION                       │
│  ├─ GlobalContext (UserProfile, Sessions, Notifications, Crédits, XP, Wallet)    │
│  ├─ OrchestratorService (Décomposition d'objectifs, Routing, Multi-Agents)      │
│  └─ DossierService (Parcours de vie transversaux, Étapes, Jalons, Tâches)       │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            3. COUCHE SERVICES CORE & IA                          │
│  ├─ aiGateway (client unique vers l'orchestrateur IA serveur multi-moteurs)    │
│  ├─ translationService (contrat unique, moteur injectable, original immuable) │
│  ├─ voiceEngine (Web Speech API, Synthèse multilingue, Reconnaissance vocale)   │
│  ├─ multimodalVision (Analyse caméra temps réel, OCR documents, Détection flux)  │
│  ├─ memoryService (Mémoire vectorielle simulée, Faits actifs, Préférences)      │
│  └─ googleWorkspaceService (Drive, Meet, Chat, Maps Platform, OAuth Bridge)     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     4. COUCHE PERSISTANCE & IDENTITÉ DISTRIBUÉE                  │
│  ├─ Supabase Auth (identité unique, Google OAuth prioritaire, RLS partout)      │
│  ├─ Supabase Postgres (profiles, social, dossiers, carrière, éducation, live…) │
│  ├─ Supabase Storage (buckets public/private, signed URLs pour le privé)        │
│  └─ LocalStorage résiduel (préférences UI uniquement : favoris, récents)         │
└──────────────────────────────────────────────────────────────────────────────────┘

*(Migration Firebase → Supabase effectuée le 27 août 2026 — voir docs/SUPABASE_ARCHITECTURE.md
et docs/AUTHENTICATION.md pour le détail. Firebase Auth ne servait que de courtier OAuth Google ;
Firestore n'a jamais été réellement câblé malgré ce que suggérait ce diagramme.)*
```

---

## 📊 2. MATRICE COMPLÈTE DES 14 MODULES

| N° | Identifiant Module | Composant Racine | Responsabilités Primaires | Dépendances Majeures |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `chat` / `experts` / `council` | `ExpertsHub.tsx`, `CouncilRoom.tsx`, `DialloOS.tsx` | Dialogue avec la famille Diallo, conseil collégial, pilotage multi-experts, analyse de dossier. | `aiService`, `voiceEngine`, `orchestratorService`, `memoryService` |
| **02** | `shop` / `my-shop` | `Shop.tsx`, `MyShop.tsx`, `TradeBusinessOperatingSystem.tsx` | Marché B2B/B2C/C2C, négociation assistée, RFQ, devis, IncoTerms, litiges, salons mondiaux. | `GlobalContext`, `Trade*` modals, `aiService`, `Wallet` |
| **03** | `career` | `CareerCenter.tsx`, `CareerGPSNavigator.tsx`, `CareerCoach3DModal.tsx` | GPS trajectoire A➔B, diagnostic 17 critères, Jumeau Numérique, simulateur d'entretiens 3D, Kanban. | `GlobalContext`, `Campus`, `aiService`, `voiceEngine` |
| **04** | `campus` | `Campus.tsx`, `MoocChatFloating.tsx` | MOOCs interactifs, évaluations académiques, examens avec Professeur Diallo, certification XP. | `GlobalContext`, `Professeur Diallo`, `types.Course` |
| **05** | `social` / `live` | `SocialFeed.tsx`, `SocialLive.tsx`, `SmartReelViewer.tsx`, `MoocChatFloating.tsx` | Réseau de confiance Mok, messagerie privée multilingue, flux social, Reels vidéo interactifs, streaming live avec achats directs. | `GlobalContext`, `translationService`, `MokTrustCenter`, `LiveSession` |
| **06** | `languages` | `LanguageCenter.tsx` | 40+ langues, fiches mnémotechniques, audio natif, immersion quotidienne avec Professeur Diallo. | `voiceEngine`, `aiService`, `types.LanguageLesson` |
| **07** | `legal` / `admin-procedures` | `LegalCenter.tsx`, `DigitalSafe.tsx` | Assistance administrative, titres de séjour, contrats, coffre-fort de pièces officielles. | `Maître Diallo`, `DigitalSafe`, `GoogleDriveCenter` |
| **08** | `housing` | `HousingCenter.tsx` | Annonces de logements, baux, simulateur APL, conseils locatifs par Monsieur Diallo. | `Monsieur Diallo`, `GoogleMapsExplorer` |
| **09** | `health` | `HealthCenter.tsx` | Dossier médical personnel, carnet de santé, conseils préventifs du Docteur Diallo, urgences. | `Docteur Diallo`, `GlobalContext (medical)` |
| **10** | `world` | `WorldHub.tsx` | Simulateur de visas, formalités d'expatriation, fiches 195 pays avec Guide Diallo. | `Guide Diallo`, `GoogleMapsExplorer`, `Travel` |
| **11** | `studio` | `Studio.tsx`, `UniversalCreator.tsx`, `VideoGenerator.tsx` | Création de contenus, scripts, visuels IA, vidéos pour réseaux sociaux et fiches produits. | `aiService`, `multimodalVision` |
| **12** | `wallet` | `Wallet.tsx` | Soldes multi-devises, Crédits LMAV, conversion de devises, historique des transactions, séquestre. | `GlobalContext`, `types.WalletTransaction` |
| **13** | `transversal` | `TransversalServicesModal.tsx`, `GoogleWorkspaceBanner.tsx` | Capacités transversales partagées (Google Maps, Drive, Meet, Chat, Coffre-fort, Diallo OS). | `googleWorkspaceService`, `react-google-maps` |
| **14** | `settings` / `admin` | `Settings.tsx`, `AdminDashboard.tsx`, `Auth.tsx` | Profil utilisateur, rôles RBAC (user/admin), sécurité 2FA, clés API, monitoring système. | `GlobalContext`, `types.UserProfile` |

---

## 🧭 3. NOUVELLE ARCHITECTURE DE NAVIGATION PAR BESOINS HUMAINS (v5.12)

La navigation ne reflète plus l'ordre technique ou historique d'ajout des modules, mais les 5 piliers cardinaux d'accomplissement humain :

1. **Accueil & Cap** :
   - `Accueil` (`home`) : Briefing quotidien, priorité active, jauge d'accomplissement.
   - `Mon Parcours de Vie` (`parcours`) : Pilotage des dossiers de vie transversaux, étapes et jalons.
2. **Apprendre & Évoluer** :
   - `Campus & Éducation` (`campus`) : MOOCs, cours certifiants, examens.
   - `Langues & Immersion` (`languages`) : Pratique de 40+ langues du monde.
   - `Carrière & Accomplissement` (`career`) : Trajectoire A➔B, CV Maître, simulateur 3D, conquête d'opportunités.
3. **Vie & Services du Quotidien** :
   - `Santé & Bien-être` (`health`) : Suivi préventif, carnet de santé, conseils Docteur Diallo.
   - `Habitat & Installation` (`housing`) : Recherche, baux, simulateur APL, installation.
   - `Finance & Wallet` (`wallet`) : Devises, crédits LMAV, séquestre.
   - `Mes Démarches` (`admin-procedures`) : Dossiers administratifs, titres de séjour, formulaires publics.
   - `Droit & Juridique` (`legal`) : Relecture contrats, droits civiques, conseil certifié.
   - `Mobilité & Expatriation` (`world`) : Visas, formalités consulaires 195 pays.
4. **Créer & Entreprendre** :
   - `Studio Créatif` (`studio`) : Visuels IA, scripts, vidéos, formats courts.
   - `Marché Mondial` (`shop` / `my-shop`) : Import-export, RFQ, devis B2B, logistique.
5. **Communauté & Conseil** :
   - `Réseau MOC` (`social` / `live`) : Communauté de confiance, tribus, lives interactifs.
   - `Experts Diallo` (`chat` / `experts`) : Consultation des 14 spécialistes d'élite.
   - `Conseil des Sages` (`council`) : Arbitrage collégial multi-experts.

### 🌟 Capacités transversales & Moteurs partagés :
- **Recherche Universelle & Palette de Commande (`⌘K`)** : Recherche pondérée dans tous les modules, cours, emplois, démarches et commande vocale intégrée.
- **Hub des Services Transversaux** (`TransversalServicesModal.tsx`) : Google Maps, Drive, Meet, Chat, Sécurité/Coffre-fort appelés à la demande dans chaque module métier.
- **Orientation par Objectifs (« Mon Cap »)** (`GoalOrientationModal.tsx`) : 6 grands gabarits de vie guidés par des experts.
- **Favoris & Récents** : Épinglage direct avec persistance locale et mémorisation automatique des parcours récents.

---

## 🔄 3. DIAGRAMME DE FLUX INTER-SERVICES

```
                         [ INTERACTION UTILISATEUR ]
                                      │
                                      ▼
                           [ OrchestratorService ]
                         /           │           \
                        /            │            \
                       ▼             ▼             ▼
               [ AI Service ]  [ DossierService ] [ MemoryService ]
               (Gemini Calls)  (Parcours/Tasks)   (Context/History)
                       │             │             │
                       \             │            /
                        \            │           /
                         ▼           ▼          ▼
                           [ GlobalContext State ]
                         /           │           \
                        /            │            \
                       ▼             ▼             ▼
              [ Module Carrière ] [ Marché B2B ] [ Campus / MOOC ]
```

---

## 🗃️ 4. MODÈLE DE DONNÉES CLÉ (ENTITÉS FONDAMENTALES)

1. **`UserProfile`** : Identité, Citoyenneté LMAV, Rôle (Admin/User), Niveau, XP, Crédits, Compétences (Skills), Badges, Boutique attachée, Dossier Médical d'urgence.
2. **`Agent`** : Spécialité Diallo, Rôle, Description, Avatar, Voix, Prompt système, Disponibilité, Dossiers actifs.
3. **`DossierParcours`** : Projet de vie structuré, Objectif, Catégorie, Agent leader, Agents collaborateurs, Étapes (`DossierStep`), Tâches (`DossierTask`), Livrables, Blocages et Plan B.
4. **`Product` / `TradeDealNegotiation`** : Catalogue universel B2B/B2C, Dimensions de vente, Incoterms, MOQ, Délais de livraison, Estimations douanières et logistiques, Clauses de litige.
5. **`Course` / `LanguageLesson`** : Cursus pédagogique, Leçons, Quiz, Durée, Validation certifiante et attribution d'XP/Crédits.
6. **`WalletTransaction`** : Mouvements de fonds (Crédits Ⓒ, EUR €, USD $, etc.), Type (Dépense, Gain, Séquestre), Référence d'achat ou de prestation.

---

## ⚙️ 5. SERVICES PARTAGÉS DU DOSSIER `/services`

- **`ai.ts`** : Client singleton `GoogleGenAI` gérant la génération de texte, l'extraction de JSON strict et l'analyse multimodale avec fallback d'erreur.
- **`translation/translationService.ts`** : point d'entrée unique des traductions Moknet. Il expose un contrat indépendant du fournisseur (`TranslationEngine`), conserve toujours le texte source, normalise les langues, mutualise les appels identiques en mémoire et se dégrade vers l'original sans bloquer l'interface. Le moteur actuel passe par `aiGateway`; son remplacement se fait uniquement via `setEngine`, sans modification de la messagerie ni des futurs appels.
- **`orchestratorService.ts`** : Moteur intelligent analysant les intentions pour déclencher les parcours et coordonner les agents.
- **`dossierService.ts`** : Gestionnaire de persistance et de cycle de vie des dossiers de vie de l'utilisateur.
- **`memory.ts`** : Gestionnaire de la mémoire contextuelle (faits appris, préférences retenues, historique des conversations).
- **`voiceEngine.ts`** : Moteur de synthèse vocale et d'écoute micro pour les interactions vivantes avec les avatars 3D et le Coach Carrière.
- **`multimodalVision.ts`** : Service d'analyse visuelle et de reconnaissance d'images (webcam, HUD, documents d'identité).
- **`googleWorkspace.ts`** : Couche REST pure d'interaction avec les APIs Google (Drive, Chat, Meet) — ne dépend plus de Firebase, le token d'accès vient de `googleWorkspaceLink.ts`.
- **`googleWorkspaceLink.ts`** : Lien Workspace optionnel (scopes larges Drive/Chat/Meet), volontairement découplé de l'authentification (`auth.ts`) qui reste minimale.
- **`auth.ts`** : Connexion Supabase Auth (Google OAuth, identité minimale), session, déconnexion.
- **`profile.ts`** : Chargement du profil applicatif (`profiles` + compétences + badges) depuis Supabase.
- **`supabaseClient.ts`** : Client Supabase singleton (initialisation résiliente — jamais de crash si mal configuré).
- **`cloud.ts`** : Interface d'export et de sauvegarde décentralisée (IndexedDB, indépendant de Supabase).
