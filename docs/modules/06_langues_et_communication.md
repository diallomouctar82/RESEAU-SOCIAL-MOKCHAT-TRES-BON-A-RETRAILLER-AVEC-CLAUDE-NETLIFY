# 🗣️ MODULE 06 — LANGUES & COMMUNICATION INTERCULTURELLE
> **Centre Polyglotte (40+ Langues), Immersion Quotidienne & Pédagogie Audio avec Professeur Diallo**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Faire tomber la barrière linguistique qui isole les individus dans leur pays d'accueil ou freine les échanges internationaux.
- **Objectif** : Proposer un apprentissage immersif, rapide et pragmatique du vocabulaire quotidien, des structures grammaticales clés et de la prononciation authentique.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Migrants, expatriés, étudiants en mobilité internationale, négociateurs commerciaux.
- **Parcours Type** :
  1. Sélection de la langue cible (Anglais, Espagnol, Arabe, Mandarin, Wolof, etc.).
  2. Révision de cartes mémoires (Flashcards) avec prononciation audio native via `voiceEngine.ts`.
  3. Pratique de dialogues thématiques (aéroport, administration, entretien, marché).

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/LanguageCenter.tsx` : Interface d'apprentissage polyglotte.
  - `services/voiceEngine.ts` : Moteur de synthèse vocale multilingue.
- **Modèles de Données (`types.ts`)** :
  - `Language`, `LanguageLesson`, `VocabularyCard`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Accent Authentique** : Utilisation prioritaire des voix natives du moteur de synthèse.
- **Approche Pédagogique Spaced Repetition** : Réactivation régulière des termes difficiles.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : 40+ langues répertoriées, modules de vocabulaire interactifs, audio déclenchable.
- **Partiel / En cours** : Évaluation automatique de la prononciation de l'utilisateur par reconnaissance vocale.
- **Évolutions Prévues** : Tandems linguistiques en direct avec d'autres apprenants du Réseau MOK.
