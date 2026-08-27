# 🎨 LE MONDE À VOUS — DESIGN SYSTEM V1
> **Référentiel Officiel & Norme Graphique et Ergonomique**  
> *Version : 1.0.0 (Production Stable) — Août 2026*  
> *Statut : Fondations Figées & Évolution Versionnée*

---

## 📑 TABLE DES MATIÈRES
- **01 — Brand & Vision**
- **02 — Premium Experience Manifest**
- **03 — UI Constitution**
- **04 — Design Tokens**
- **05 — Typography**
- **06 — Colors & Palette**
- **07 — Component Library**
- **08 — Navigation & Information Architecture**
- **09 — Motion & Transitions**
- **10 — Accessibility (WCAG AA)**
- **11 — Responsive & Breakpoints**
- **12 — Voice, OCR & Camera Experience**
- **13 — AI Interaction Patterns (Actionable AI)**
- **14 — Module Variations & Specialized Hubs**
- **15 — Trust, Provenance & Permissions**
- **16 — UX Writing & Terminology**
- **17 — Golden Screens**
- **18 — Testing & QA Checklist**
- **19 — Decisions & Governance**
- **20 — Internationalisation (40+ Langues)**
- **21 — Mobile & Low Bandwidth Optimization**
- **22 — Connectors & Contextual Google Workspace Integrations**
- **23 — User Journeys (Point A ➔ Point B)**
- **24 — Before / After Matrix**
- **25 — Known Issues & Design Debt**
- **26 — Future Evolution Roadmap**

---

### 01 — Brand & Vision
**Le Monde à Vous** est une plateforme mondiale d'émancipation et d'accompagnement humain continu. L'identité visuelle incarne l'autorité bienveillante d'une institution internationale moderne, combinée à la proximité chaleureuse de la Famille Diallo.

### 02 — Premium Experience Manifest
Voir `/docs/PREMIUM_EXPERIENCE_MANIFEST.md`.  
*« Simple devant, intelligente derrière. Nous nous adaptons à vous, pas l'inverse. »*

### 03 — UI Constitution
1. **Pas de dégradé violet/bleu cliché d'IA**.
2. **Pas de cartes imbriquées dans des cartes sans logique optique**.
3. **Chaque bouton doit être relié à une action réelle**.
4. **Le rayon de courbure intérieur respecte la règle optique :** $R_{int} = R_{ext} - Padding$.
5. **Contraste minimal 4.5:1 sur tous les textes de contenu (WCAG AA)**.
6. **Boutons : padding horizontal = 2x padding vertical**.
7. **Pas d'icônes orphelines sans label ou tooltip accessible**.

### 04 — Design Tokens
Tokens centralisés dans `components/ui/DesignTokens.ts` :
- **Surface Neutrals** : Navy Deep `#070D1E`, Navy Primary `#0B132B`, Slate 900 `#0F172A`, Pure White `#FFFFFF`, Background Canvas `#F8FAFC`.
- **Accent Tokens** : Orange Éclat `#EA580C` (hover: `#C2410C`, light: `#FFF7ED`), Emerald Vérifié `#059669`, Indigo Transversal `#4F46E5`, Rose Alerte `#E11D48`.
- **Spacing Scale** : 4px (xs), 8px (sm), 12px (md), 16px (lg), 24px (xl), 32px (2xl), 48px (3xl).
- **Radius Scale** : 8px (sm), 12px (md), 16px (lg), 24px (2xl / Cartes), 32px (3xl / Modales), 9999px (full / Pills).

### 05 — Typography
- **Display & Headings** : `Outfit`, sans-serif (800 ExtraBold, 700 Bold, 600 SemiBold). Tracking serré `-0.02em`.
- **Body & Controls** : `Plus Jakarta Sans`, sans-serif (400 Regular, 500 Medium, 600 SemiBold, 700 Bold). Line-height `1.6`.
- **Échelle Typographique (Major Second 1.125 / Perfect Fourth 1.333)** :
  - H1 : `text-2xl` à `text-4xl` (28px - 36px), font-black.
  - H2 : `text-xl` à `text-2xl` (20px - 24px), font-extrabold.
  - H3 : `text-base` à `text-lg` (16px - 18px), font-bold.
  - Body : `text-sm` (14px) ou `text-base` (16px), font-medium.
  - Caption / Micro : `text-xs` (12px) et `text-[10px]`, font-bold, uppercase tracking-wider.

### 06 — Colors & Semantic Roles
| Rôle | Hex | Utilisations |
| :--- | :--- | :--- |
| **Navy Background** | `#070D1E` | Barre latérale, modales sombres, bannières statutaires |
| **Navy Card/Header** | `#0B132B` | En-têtes d'experts, cartes de synthèse, cartes décisionnelles |
| **Accent Orange** | `#EA580C` | Boutons d'action primaire, CTA stratégiques, points focaux |
| **Success Emerald** | `#059669` | Statut vérifié, certifications obtenues, séquestres débloqués |
| **Alert Rose** | `#E11D48` | Actions irréversibles, échéances critiques, suppressions |
| **Surface Off-White**| `#F8FAFC` | Fond principal de l'application (Canvas) |

### 07 — Component Library
- **`EditorialHero`** : Bannière maîtresse du Dashboard avec citation, métrique de vie et raccourci immédiat.
- **`PointAToBPathway`** : Trajectoire visuelle avec progression chiffrée et jalons.
- **`ContextActionBar`** : Fil d'Ariane institutionnel, pilier de vie et déclencheur de consultation Expert.
- **`ActionableAISuggestion`** : Boîte de suggestion avec explication *"Pourquoi"* et CTA direct.
- **`KnowledgeCard`** : Fiche mémorisable *"Ce qu'il faut retenir"*, source certifiée et CTA *"Utiliser"*.
- **`AISynthesisCard`** : Synthèse exécutive structurée (Résumé, Décisions clés, Plan d'actions).
- **`StatusBadge`** : Badges sémantiques normalisés (Vérifié, Officiel, En cours, Relecture, Alerte).
- **`SourceCitationCard`** : Preuve juridique/institutionnelle avec date de fraîcheur et lien officiel.
- **`SmartConfirmModal`** : Confirmation contextuelle avec niveau de risque et impact explicite.
- **`EmptyStateGuide`** : Guidage chaleureux du Moment Zéro avec 3 étapes concrètes d'initialisation.

### 08 — Navigation & Information Architecture
- **Barre Supérieure Flottante** : Logo institutionnel, Recherche Universelle (`Ctrl+K`), Bouton *"Guide-moi"*, Indicateur de Cap, Scanner, Micro Diallo, Contrôles Focus/Présentation, Sélecteur de Langue, Hub Transversal et Profil.
- **Menu des Modules (Dock / Drawer)** : 14 modules segmentés en 5 Piliers clairs (Experts, Éducation & Carrière, Commerce & Marché, Services de Vie, Social & Confiance).
- **Console d'Administration & Métriques** : Séparée de la vue personnelle de l'utilisateur.

### 09 — Motion & Transitions
- Durée standard : `200ms` à `300ms`.
- Easing : `cubic-bezier(0.16, 1, 0.3, 1)` (Out-Expo adouci).
- Entrées de modales : `scale-up` (`0.96` ➔ `1.0`) et `fade-in`.
- Respect du mode *"Réduire les animations"* (`prefers-reduced-motion`).

### 10 — Accessibility (WCAG AA)
- Contrastes mesurés $\ge 4.5:1$ pour le texte normal, $\ge 3:1$ pour les grands titres.
- Navigation au clavier complète avec `focus-visible:ring-2 ring-orange-500`.
- Attributs `aria-label`, `aria-expanded`, `role="dialog"`, `role="navigation"`.
- Support d'agrandissement de police (100%, 115%, 130%) dans le hub de paramètres.

### 11 — Responsive & Breakpoints
- **Mobile (< 640px)** : Navigation au pouce, cibles tactiles $\ge 44px$, tiroir bas (*bottom sheet*), masquage des détails secondaires.
- **Tablette (640px - 1024px)** : Grille à 2 colonnes adaptative, dock compact.
- **Desktop (1024px - 1536px)** : Affichage complet avec barre contextuelle et panneaux latéraux.
- **Ultra-Wide (> 1536px)** : Conteneurs `max-w-7xl` avec marges automatiques pour préserver la lisibilité.

### 12 — Voice, OCR & Camera Experience
- **Micro Diallo** : Retranscription vocale immédiate, guidage audio et synthèse vocale.
- **Scanner Universel** : OCR haute précision pour titres de séjour, diplômes, factures, analyses médicales et QR codes.
- **Mode Bilingue Face-à-Face** : Traduction vocale et textuelle alternée pour rendez-vous d'ambassade et entretiens.

### 13 — AI Interaction Patterns (Actionable AI)
- Chaque retour d'IA propose une action immédiate (`onPrimaryAction`).
- Transparence intégrée : bouton *"Pourquoi cette recommandation ?"*.
- Contrôle utilisateur : option *"Plus tard"* ou *"Ignorer"*.

### 14 — Module Variations & Specialized Hubs
Chaque module hérite du layout parent et personnalise sa barre contextuelle (`ContextActionBar`) avec son pilier d'appartenance et son expert de référence.

### 15 — Trust, Provenance & Permissions
- Indicateur de fraîcheur des données (*"Vérifié le JJ/MM/AAAA"*).
- Badge Mok Trust et séquestres financiers.
- Distinction explicite des données : **Privé**, **Partagé**, **Public**, **Analysé par Diallo OS**.

### 16 — UX Writing & Terminology
- Ton : Chaleureux, digne, rigoureux, encourageant et professionnel.
- Termes bannis : *"Supercharger"*, *"Révolutionnaire"*, *"Je suis un robot IA"*.
- Termes officiels : Voir `/docs/GLOSSAIRE_PRODUIT.md`.

### 17 — Golden Screens
Voir `/docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`.  
Écrans maîtres : Dashboard Accueil, Diallo OS, GPS Carrière, Campus MOOC, Marché Mondial, Réseau MOC.

### 18 — Testing & QA Checklist
1. Pas d'erreurs console.
2. Build propre sans avertissement TypeScript (`compile_applet`).
3. Responsive testé de 360px à 1920px.
4. Navigation clavier et focus states visibles.
5. Gestion propre des états de chargement (skeletons) et des erreurs (bannières sobres).

### 19 — Decisions & Governance
Toute modification doit être enregistrée dans `/docs/JOURNAL_DECISIONS.md` et `/docs/UX_CHANGELOG.md`.

### 20 — Internationalisation (40+ Langues)
Support des langues majeures (Français, Anglais, Espagnol, Arabe, Peul/Pulaar, Mandingue/Bambara, Wolof, Swahili, Portugais, Chinois, Allemand, etc.).

### 21 — Mobile & Low Bandwidth Optimization
- Chargement différé (*lazy loading*) des médias lourds.
- Mode données réduites avec désactivation des flux vidéo automatiques.
- Cache local résilient pour navigation hors-ligne.

### 22 — Connectors & Contextual Google Workspace Integrations
Les services Google (Drive, Calendar, Maps, Meet, Chat, Sheets) sont accessibles comme connecteurs transversaux sans encombrer la navigation principale.

### 23 — User Journeys (Point A ➔ Point B)
Chaque parcours décompose la trajectoire en étapes validées, étape active et prochaines actions.

### 24 — Before / After Matrix
Voir `/docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`.

### 25 — Known Issues & Design Debt
Voir `/docs/DESIGN_DEBT_REGISTER.md`.

### 26 — Future Evolution Roadmap
- V1.1 : Amélioration des micro-interactions haptiques sur mobile.
- V1.2 : Thème sombre étendu complet à tous les sous-composants graphiques.
- V2.0 : Négociation B2B automatisée et passeport numérique biométrique.
