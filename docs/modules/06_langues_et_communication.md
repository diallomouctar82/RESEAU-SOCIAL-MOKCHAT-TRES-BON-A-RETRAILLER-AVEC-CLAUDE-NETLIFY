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
  - `services/translation/translationService.ts` : contrat transversal unique pour toute nouvelle traduction Moknet, indépendant du moteur concret. La phase 1 de la messagerie texte est son premier consommateur ; les appels vocaux devront réutiliser exactement ce service après validation explicite, sans logique parallèle.
- **Modèles de Données (`types.ts`)** :
  - `Language`, `LanguageLesson`, `VocabularyCard`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Accent Authentique** : Utilisation prioritaire des voix natives du moteur de synthèse.
- **Approche Pédagogique Spaced Repetition** : Réactivation régulière des termes difficiles.
- **Unicité du chemin de traduction** : aucun composant de messagerie ou d'appel ne doit appeler directement un fournisseur. Le texte original est immuable et toute indisponibilité rend la source plutôt qu'un contenu inventé.
- **Couple de langues par conversation (messagerie texte)** : chaque conversation
  porte deux listes déroulantes — « Ma langue » et « Langue de mon interlocuteur ».
  Le choix est PERSONNEL (deux membres d'une même conversation peuvent avoir des
  couples différents, chacun lisant dans sa propre langue) et mémorisé côté
  serveur dans `user_memory` (`scope='durable_preference'`,
  `category='messaging_language'`, `key` = id de conversation) : il suit donc
  l'utilisateur d'un appareil à l'autre. L'index unique partiel déjà posé sur ce
  scope garantit qu'un nouveau choix REMPLACE le précédent au lieu d'empiler des
  lignes concurrentes — aucune migration n'a été nécessaire.
  Sens de traduction, porté par `targetLanguageForMessage()` (fonction pure,
  testée, pour qu'une inversion ne puisse pas passer inaperçue) :
  - message **reçu** → traduit vers **ma** langue ;
  - message **que j'envoie** → traduit vers **la sienne**, de sorte que je vois
    ce que mon interlocuteur lit réellement.
  Valeurs de départ tant que rien n'est choisi : ma préférence de profil pour moi,
  et pour l'autre la langue réellement déclarée par son dernier message — jamais
  une langue devinée ; à défaut, l'anglais.
  Le catalogue (`MESSAGING_LANGUAGES`, ~28 langues mondiales) est la SOURCE
  UNIQUE partagée par les sélecteurs et la normalisation du moteur : une langue
  proposée à l'écran ne peut pas être rejetée au moment de traduire. Il est
  volontairement distinct de `constants.ts::SUPPORTED_LANGUAGES`, qui pilote la
  langue de l'INTERFACE (adossée à `TRANSLATIONS`, limitée à fr/en) — y ajouter
  ces langues afficherait une UI non traduite.
- **Repli historique** : la langue de l'auteur voyage avec le message
  (`messages.metadata.original_language`, écrite à l'envoi) et sert d'indice ; quand elle
  est absente ou fausse, le moteur détecte réellement la langue source et c'est cette
  valeur détectée qui fait foi.
  Règles d'affichage, valables en conversation privée comme en groupe :
  - le texte de départ n'est jamais écrasé — il reste la source de vérité en base
    (`messages.content`) et se réaffiche d'un clic via « Voir le message original » ;
  - tant que la traduction n'est pas revenue, c'est l'original qui est affiché : la
    lecture n'est jamais bloquée par un appel réseau, et rien n'est masqué au lecteur ;
  - même langue des deux côtés, ou moteur indisponible : aucun bandeau, aucun bouton,
    aucun appel réseau — l'original s'affiche tel quel ;
  - seul le TEXTE est traduit. Les vocaux, images, vidéos et documents ne le sont pas.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : 40+ langues répertoriées, modules de vocabulaire interactifs, audio déclenchable.
- **Partiel / En cours** : Évaluation automatique de la prononciation de l'utilisateur par reconnaissance vocale.
- **En attente de validation** : traduction bidirectionnelle en temps réel des appels vocaux (sélecteurs « Ma langue » / « Langue de mon interlocuteur »). Aucun code de cette fonctionnalité n'est commencé avant validation de la traduction texte.
- **Évolutions Prévues** : Tandems linguistiques en direct avec d'autres apprenants du Réseau MOK.
