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
- **Un seul réglage : ma langue (texte, vocaux, appels)** : chaque conversation
  affiche une unique liste déroulante « Ma langue », liée à
  `profiles.preferred_language` (mémorisée sur le profil, donc retrouvée d'un
  appareil à l'autre — même chaîne d'écriture que le réglage des Paramètres :
  App → Layout → messagerie → `updateUserProfile`). **« Par défaut »
  (`NULL`, état initial de tout compte) n'a aucun rôle de traduction** : on lit
  et on entend l'original, dans les deux sens, aucun appel réseau. Dès qu'une
  langue est choisie, elle pilote TOUT — texte (ci-dessous), vocaux et appels
  (mission « Harmonisation de la langue », HL) :
  - **vocaux** : la transcription est faite chez l'AUTEUR pendant
    l'enregistrement, par la reconnaissance vocale de son navigateur dans SA
    langue (`services/calls/callInterpreter.ts::CallCaptioner`, instance
    dédiée — jamais le moteur de l'Architecte), et voyage avec le message
    (`messages.metadata.transcript` + `transcript_language`). Le lecteur la
    traduit dans SA langue exactement comme un texte (même mécanique
    `ChatMessageItem`), l'audio original reste intact, et un bouton « Écouter
    dans ma langue » lit la traduction (`InterpreterVoice`, voix HD via
    l'ai-gateway, repli synthèse navigateur dans la bonne langue). Navigateur
    sans reconnaissance (Firefox) : le vocal part sans texte, jamais bloqué.
  - **appels audio et vidéo** (`components/chat/ChatCallModal.tsx`) : chaque
    côté transcrit SA voix dans SA langue et envoie les segments par le canal
    de données LiveKit (`sendData`/`onDataReceived`, exposés par
    `hooks/useLiveTransport.ts`) ; le RÉCEPTEUR traduit dans SA langue
    (`interpretationPlan`), affiche les sous-titres (original + traduction)
    et entend une voix dans sa langue pendant que l'original est atténué
    (`remoteVolumeFor`, on n'entend que sa langue). Un côté « Par défaut »
    ne traduit rien ; il ne transcrit sa voix que si l'autre a choisi une
    langue (`shouldCaptionMyVoice`). Personne n'a rien choisi → l'appel est
    strictement inchangé. Fluidité (HL-3) : rooms d'appel en profil audio
    « parole » (Opus speech + RED + DTX, AEC/NS/AGC explicites) et qualité
    réseau RÉELLE affichée (mesurée par le transport, jamais estimée).
  **On ne choisit jamais la langue de l'interlocuteur** :
  le système la DÉTECTE (`services/messaging/messageLanguage.ts::
  detectRecipientLanguage`) à partir de la langue qu'il a lui-même déclarée dans
  son dernier message (`messages.metadata.original_language`, écrite à chaque
  envoi) — une donnée réelle, jamais devinée. Tant qu'il n'a rien écrit, elle est
  inconnue et rien n'est inventé. Aucune table ni migration.
  Langue d'affichage, portée par `targetLanguageForMessage()` (fonction pure,
  testée) :
  - message **reçu** → toujours traduit vers **ma** langue ;
  - message **que j'envoie** → affiché dans la langue détectée de l'interlocuteur
    (je vois ce qu'il lit), uniquement en conversation directe et seulement si
    elle est connue — sinon tel que je l'ai écrit ;
  - groupe : messages reçus traduits vers ma langue ; les miens restent tels
    quels (il n'y a pas UN destinataire).
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
