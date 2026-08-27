# 🤝 DOSSIER DE PASSATION TECHNIQUE & CONSOLIDATION CLAUDE CODE (HANDOFF)
> **Guide Stratégique et Technique pour l'Audit, le Contrôle et la Consolidation par Claude Code**  
> *Version : Premium Experience V1.0 — Août 2026*  
> *Destinataire : Développeurs, Designers, Auditeurs & Instances Claude Code*

---

## 🎯 1. RÉSUMÉ DE LA VISION PRODUIT & UX
**Le Monde à Vous** est une plateforme mondiale d'accompagnement humain continu, réunissant 14 modules interactifs autour de l'expertise de la Famille Diallo, du Campus certifiant, du GPS de Carrière, du Marché Mondial sécurisé et du Réseau MOC.
- **Manifeste** : *« Simple devant, intelligente derrière. Nous nous adaptons à vous, pas l'inverse. »*
- **Règle absolue d'incarnation** : Les experts sont des humains professionnels d'élite (Directeur, Maître, Conseiller, Professeur, Docteur, Monsieur, Guide, Analyste Diallo). Ne jamais afficher de mentions *"Je suis une IA / un robot"*.

---

## 🎨 2. FONDATIONS DU DESIGN SYSTEM OFFICIEL
- **Tokens maîtres** : Situés dans `components/ui/DesignTokens.ts`.
- **Palette** :
  - Navy Deep : `#070D1E`
  - Navy Primary : `#0B132B`
  - Orange CTA : `#EA580C` (hover `#C2410C`)
  - Emerald Vérifié : `#059669`
  - Canvas Fond : `#F8FAFC`
- **Typographie** :
  - Titres & Display : `Outfit` (800 / 700 / 600)
  - Corps & Boutons : `Plus Jakarta Sans` (600 / 500 / 400)
- **Composants normalisés de référence** :
  - `EditorialHero.tsx`
  - `PointAToBPathway.tsx`
  - `ContextActionBar.tsx`
  - `ActionableAISuggestion.tsx`
  - `KnowledgeCard.tsx`
  - `AISynthesisCard.tsx`
  - `SmartConfirmModal.tsx`
  - `StatusBadge.tsx`
  - `SourceCitationCard.tsx`
  - `EmptyStateGuide.tsx`
  - `GuidedModeModal.tsx`
  - `UniversalScannerModal.tsx`
  - `BilingualConversationModal.tsx`
  - `FocusAndPresentationControls.tsx`
  - `UnifiedSettingsModal.tsx`
  - `ComponentShowcaseModal.tsx`

---

## 🧭 3. ARCHITECTURE DE NAVIGATION & CONNECTEURS
- **Navigation Piliers** : 14 modules ordonnés en 5 Piliers clairs dans `components/Layout.tsx` et `components/navigation/UniversalSearchModal.tsx`.
- **Services Google Workspace** : Ne plus les rajouter sous forme de 5 onglets distincts dans la barre principale ; ils sont accessibles via la modale transversale `components/navigation/TransversalGoogleServicesModal.tsx` et gérés dans `UnifiedSettingsModal.tsx`.

---

## 🔍 4. PLAN DE CONTRÔLE ET D'AUDIT RECOMMANDÉ POUR CLAUDE CODE

Lors de la reprise ou consolidation du code par Claude Code, prioriser les vérifications suivantes :

1. **Audit de duplication CSS & Classes inline** :
   - Vérifier que toutes les nuances de bleu/navy s'alignent sur les tokens officiels (`#070D1E`, `#0B132B`).
   - Éliminer d'éventuels dégradés violets ou cyans résiduels.
2. **Contrôle de conformité Accessibilité (WCAG AA)** :
   - Vérifier la présence systématique des `aria-label` sur les boutons à icône seule.
   - S'assurer que le focus clavier reste visible (`ring-2 ring-orange-500`).
3. **Consolidation des formulaires et validation de types** :
   - Auditer `types.ts` pour s'assurer que tous les états de démarches et statuts de transactions utilisent les types stricts.
4. **Vérification de la résilience réseau (Offline & Low Bandwidth)** :
   - Tester le comportement lorsque le signal réseau est dégradé ou inexistant.
5. **Protection de la mémoire documentaire** :
   - Maintenir à jour `/docs/JOURNAL_DECISIONS.md`, `/docs/UX_CHANGELOG.md` et `/docs/ETAT_ACTUEL.md` après chaque évolution.

---

## ⚠️ 5. DÉCISIONS À NE PAS REMETTRE EN CAUSE SANS MOTIF MAJEUR
- ❌ Ne pas réinjecter 18 onglets plats dans la barre de navigation.
- ❌ Ne pas transformer les experts Diallo en robots conversationnels génériques.
- ❌ Ne pas supprimer la barre d'action contextuelle (`ContextActionBar`) des modules.
- ❌ Ne pas casser la séparation entre la vue personnelle et la console administrative.
