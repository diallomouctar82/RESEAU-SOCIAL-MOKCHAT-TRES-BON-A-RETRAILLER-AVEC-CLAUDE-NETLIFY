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
- **Code prêt** : dialogues, scénario actif et progression sont synchronisés dans Supabase `module_records`; les modifications hors ligne sont placées dans une file IndexedDB et l'état est visible dans l'interface.
- **Configuration requise** : migration `20260827216000_module_records.sql` et session Supabase valides.
- **Partiel / en cours** : l'évaluation autoritative de la prononciation n'est pas implémentée; aucune note de prononciation fictive n'est affichée.
- **Évolutions Prévues** : Tandems linguistiques en direct avec d'autres apprenants du Réseau MOK.
