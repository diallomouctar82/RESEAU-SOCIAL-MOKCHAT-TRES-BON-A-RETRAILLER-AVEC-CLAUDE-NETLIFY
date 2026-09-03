# 📚 MÉMOIRE CENTRALE & TABLE DES MATIÈRES — LE MONDE À VOUS
> **Portail d'Accès Universel à la Documentation Vivante et Continue**  
> *Version du Référentiel : v5.5 (Août 2026)*  
> *Statut : Actif, Permanent & Obligatoire pour tout contributeur (Humain & IA)*

---

## 🧭 INTRODUCTION & PRINCIPE DU RÉFÉRENTIEL

Ce référentiel documentaire constitue la **mémoire vivante, stratégique, fonctionnelle et technique** de la plateforme **Le Monde à Vous**.

La documentation n'est pas un rapport rédigé a posteriori : elle est le **socle opérationnel continu** qui garantit l'intégrité architecturale, la conservation de la vision fondatrice et la cohérence de chaque développement futur.

```
                  ┌──────────────────────────────────────────────┐
                  │          BOUCLE DE CONTINUITÉ PERMANENTE     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │ CONSULTER MÉMOIRE │
                               └─────────┬─────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │  DÉCIDER & CADRER │
                               └─────────┬─────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │ DÉVELOPPER & TEST │
                               └─────────┬─────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │ METTRE À JOUR DOC │
                               └─────────┬─────────┘
                                         │
                                         ▼
                               ┌───────────────────┐
                               │  ÉVOLUTION SUIV.  │
                               └───────────────────┘
```

---

## 🗂️ STRUCTURE DU SYSTÈME DOCUMENTAIRE

| Section / Document | Description & Rôle | Lien d'Accès |
| :--- | :--- | :--- |
| **01. Livre de Vision** | Vision générale, philosophie, colonne vertébrale, règles absolues, anthropomorphisme expert. | [`docs/LIVRE_DE_VISION.md`](./LIVRE_DE_VISION.md) |
| **02. Architecture Globale** | Cartographie des 14 modules, diagramme de flux, services partagés, graphe de données. | [`docs/ARCHITECTURE_GLOBALE.md`](./ARCHITECTURE_GLOBALE.md) |
| **03. Journal des Décisions** | Registre horodaté des arbitrages d'ingénierie, justifications et impacts. | [`docs/JOURNAL_DECISIONS.md`](./JOURNAL_DECISIONS.md) |
| **04. Registre des Idées** | Backlog des innovations futures, opportunités et idées en réserve. | [`docs/REGISTRE_IDEES.md`](./REGISTRE_IDEES.md) |
| **05. État Actuel** | Synthèse opérationnelle : « Où en est Le Monde à Vous aujourd'hui ? ». | [`docs/ETAT_ACTUEL.md`](./ETAT_ACTUEL.md) |
| **06. Historique des Versions** | Traçabilité des versions déployées, jalons clés et matrice des changements. | [`docs/HISTORIQUE_VERSIONS.md`](./HISTORIQUE_VERSIONS.md) |
| **07. Guide de Continuité** | Protocole opérationnel imposé à tout agent d'exécution ou développeur. | [`docs/GUIDE_CONTINUITE.md`](./GUIDE_CONTINUITE.md) |
| **08. Manifeste Premium Experience** | Les 5 réponses fondatrices et les 8 principes d'or UX/UI. | [`docs/PREMIUM_EXPERIENCE_MANIFEST.md`](./PREMIUM_EXPERIENCE_MANIFEST.md) |
| **09. Design System V1 (26 sections)** | Référentiel graphique, tokens, composants et constitution UI. | [`docs/DESIGN_SYSTEM_V1.md`](./DESIGN_SYSTEM_V1.md) |
| **10. Glossaire Produit Officiel** | Définitions normalisées et table des termes bannis. | [`docs/GLOSSAIRE_PRODUIT.md`](./GLOSSAIRE_PRODUIT.md) |
| **11. Inventaire Écrans & Matrice** | Cartographie de tous les écrans et matrice de conformité. | [`docs/INVENTAIRE_ECRANS_ET_MATRICE.md`](./INVENTAIRE_ECRANS_ET_MATRICE.md) |
| **12. Golden Screens & Avant/Après** | Écrans de référence et mesures d'impact de transformation UX. | [`docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`](./GOLDEN_SCREENS_ET_AVANT_APRES.md) |
| **13. Component Registry & Changelog** | Registre officiel des composants et journal des évolutions UI. | [`docs/UX_CHANGELOG.md`](./UX_CHANGELOG.md) |
| **14. Registre Dette de Design** | Suivi et priorisation des chantiers d'optimisation futurs. | [`docs/DESIGN_DEBT_REGISTER.md`](./DESIGN_DEBT_REGISTER.md) |
| **15. Tableau d'Enregistrement des Défauts** | Matrice formelle des 22 défauts résolus et certifiés (Norme IEEE 1044 / PSP). | [`docs/TABLEAU_ENREGISTREMENT_DEFAUTS.md`](./TABLEAU_ENREGISTREMENT_DEFAUTS.md) |
| **16. Passation Claude Code (Handoff)** | Guide stratégique pour l'audit et la consolidation future. | [`docs/HANDOFF_CLAUDE_CODE.md`](./HANDOFF_CLAUDE_CODE.md) |
| **17. Dossiers par Module** | Spécifications complètes des 14 modules fonctionnels de la plateforme. | [`docs/modules/`](./modules/) |
| **18. Architecture Supabase** | État réel de la base (tables, RLS, fonctions, jobs planifiés) domaine par domaine — décrit ce qui existe, jamais une cible. | [`docs/SUPABASE_ARCHITECTURE.md`](./SUPABASE_ARCHITECTURE.md) |
| **19. L'Architecte** | Orchestration par intention : registre de capacités, bus d'exécution, permissions, statuts. Couverture réelle et limites. | [`docs/ARCHITECTE.md`](./ARCHITECTE.md) |
| **20. LIVE Intelligent — spécification** | Le LIVE comme salle intelligente : vision, trois familles de live, logique sociale, logique IA, mémoire de parcours, tribus et cursus, documents, coaching, monétisation. Écrit AVANT le développement. | [`docs/LIVE_INTELLIGENT.md`](./LIVE_INTELLIGENT.md) |
| **21. LIVE Intelligent — validation** | Feuille de route par loupes, critères de test et **preuves attendues** loupe par loupe. Barème de statut : rien n'est TERMINÉ sans preuve. | [`docs/LIVE_INTELLIGENT_VALIDATION.md`](./LIVE_INTELLIGENT_VALIDATION.md) |
| **22. Direction artistique du Studio Live** | Matière verre/eau/lumière, 7 univers, et § 8 l'abysse validé par la Direction le 03/09/2026. | [`docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md`](./DIRECTION_ARTISTIQUE_STUDIO_LIVE.md) |

---

## 📦 INDEX DÉTAILLÉ DES 14 MODULES FONCTIONNELS

Chaque module dispose d'une fiche normalisée `POURQUOI → QUOI → COMMENT` :

1. **[`01. Diallo OS & Hub des Experts`](./modules/01_diallo_os_et_experts.md)**  
   *Famille d'experts humains IA, Orchestration multi-agents, Conseil collégial, HUD multimodal.*
2. **[`02. Marché Mondial & Commerce International`](./modules/02_marche_mondial_et_commerce.md)**  
   *B2B/B2C/C2C, Business OS, Sourcing, RFQ, Négociation intelligente, Gestion des litiges, Salons mondiaux.*
3. **[`03. Carrière & Accomplissement`](./modules/03_carriere_et_accomplissement.md)**  
   *GPS de Carrière, Diagnostic Point A, Jumeau Numérique Évolutif, Coach 3D Vocal, Pipeline Kanban.*
4. **[`04. Campus & Éducation`](./modules/04_campus_et_education.md)**  
   *MOOCs certifiants, Examens progressifs, Validations d'acquis, Gain d'XP & Crédits.*
5. **[`05. Réseau MOK & Social Live`](./modules/05_reseau_mok_et_social.md)**  
   *Réseau de confiance Mok Trust, Feed social, Reels éducatifs/commerciaux, Live streaming interactif.*
6. **[`06. Langues & Communication`](./modules/06_langues_et_communication.md)**  
   *Apprentissage immersif de 40+ langues, fiches de vocabulaire, synthèse vocale native.*
7. **[`07. Juridique & Administration`](./modules/07_juridique_et_administration.md)**  
   *Procédures administratives, titres de séjour, rédaction d'actes, Coffre-fort numérique.*
8. **[`08. Logement & Habitat`](./modules/08_logement_et_habitat.md)**  
   *Recherche de biens, baux locatifs, droits des locataires, simulation d'aides (APL).*
9. **[`09. Santé & Bien-Être`](./modules/09_sante_et_bien_etre.md)**  
   *Prévention santé, carnet médical sécurisé, orientation d'urgence, conseils nutrition/bien-être.*
10. **[`10. Mobilité & Voyage International`](./modules/10_mobilite_et_voyage.md)**  
    *World Hub, simulateur de visas, formalités frontalières, sécurité des voyageurs.*
11. **[`11. Studio Créatif & Multimodal`](./modules/11_studio_et_creation.md)**  
    *Génération de médias, Universal Creator, assistant script & vidéo, OCR documentaire.*
12. **[`12. Finance, Wallet & Monnaies`](./modules/12_finance_wallet_et_credits.md)**  
    *Portefeuille multi-devises, Crédits LMAV, séquestre commercial (Escrow), flux bancaires.*
13. **[`13. Intégration Google Workspace`](./modules/13_google_workspace_integration.md)**  
    *Drive, Meet, Chat, Maps Explorer pour ambassades, centres de visas et entreprises.*
14. **[`14. Sécurité, Rôles & Infrastructure`](./modules/14_securite_et_infrastructure.md)**  
    *Contrôle d'accès RBAC, conformité RGPD, isolation des clés API serveur, résilience.*

---

## 🛡️ RÈGLES DE GOUVERNANCE DOCUMENTAIRE

1. **Règle du Zéro Oubli** : Toute modification apportée au code source doit faire l'objet d'une mise à jour corrélative dans le journal des décisions et la documentation du module ciblé.
2. **Règle de Non-Écrasement** : Lorsqu'un concept est remplacé ou ajusté, la version précédente est archivée dans l'historique avec la justification du changement.
3. **Règle d'Accessibilité Double** : La documentation est rédigée pour être comprise sans ambiguïté par un ingénieur humain et par un agent d'ingénierie IA (Claude Code, Gemini Code Assist, etc.).
