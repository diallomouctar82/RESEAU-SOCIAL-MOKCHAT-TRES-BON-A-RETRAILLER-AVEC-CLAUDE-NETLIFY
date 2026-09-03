# LIVE MokNet — Spécification du Live Intelligent

> **Statut** : document de référence, écrit AVANT le développement (décision de
> la Direction, 03/09/2026 : « la doc fait partie du dev »). Toute étape de
> code doit correspondre à un chapitre de ce fichier et être prouvée selon
> `docs/LIVE_INTELLIGENT_VALIDATION.md`.
>
> **Règle de lecture** : ce document distingue en permanence ce qui **existe et
> est prouvé**, ce qui est **écrit mais jamais consommé**, et ce qui est **à
> construire**. Aucune ligne ne décrit une capacité comme acquise sans preuve.
>
> **Ce document est la VISION.** Il ne se lit pas seul. Trois documents, trois
> rôles, jamais mélangés (règle de la Direction, 03/09/2026) :
>
> | Rôle | Document |
> |---|---|
> | **1. L'existant à protéger** — à lire en premier | `LIVE_SOCLE_EXISTANT.md` |
> | **2. La vision** — celui-ci, et sa branche éducation | `LIVE_INTELLIGENT.md`, `LIVE_CAMPUS_EDUCATION.md` |
> | **3. La roadmap priorisée et les preuves** | `LIVE_INTELLIGENT_VALIDATION.md` |
>
> Une ambition écrite ici n'autorise **aucune** dérogation aux invariants
> I1…I9 du socle. En cas de conflit, le socle gagne.

---

## 0. Vision — pourquoi le LIVE n'est pas un module vidéo

Le LIVE MokNet n'est pas une salle où chacun parle puis disparaît. C'est une
**salle intelligente avec un objectif** : détecter des talents, faire
progresser les membres, organiser des communautés utiles, accompagner des
projets et produire des documents.

Quatre conséquences structurantes, qui commandent tout le reste :

1. **Le direct laisse une trace utile.** Une session qui se termine sans avoir
   rien produit (une compétence repérée, une orientation proposée, un
   document, une tribu formée) est un échec produit, même si la vidéo a
   parfaitement fonctionné.
2. **L'IA n'est pas un gadget posé à côté.** Elle écoute, recadre, conseille,
   se souvient et oriente — ou elle se tait. Elle n'est jamais un figurant
   décoratif sur une carte.
3. **La progression est symbolique, jamais un score social opaque.** Niveaux,
   badges et recommandations sont explicables ; il n'existe aucune note
   cachée qui influencerait secrètement les interactions.
4. **Apprendre et participer restent gratuits.** Seul l'accompagnement poussé
   est un service avancé payant, annoncé avant l'action.

### Invariants non négociables (valables dans TOUS les chapitres)

| # | Invariant | Pourquoi |
|---|---|---|
| I1 | **Jamais simuler une capacité absente.** Marquer NON FAIT ou PARTIEL plutôt que présenter un mock comme réel. | Règle transversale MokNet (reconnaissance faciale, chiffrement, métriques). |
| I2 | **Les droits vivent dans la base, pas à l'écran.** Toute action sensible est vérifiée par une policy RLS ou une fonction `SECURITY DEFINER`. | La voix et l'écran n'ont jamais plus de droits l'un que l'autre. |
| I3 | **Aucun faux succès.** Un échec d'écriture annule l'action à l'écran et affiche la vraie raison. | Motif déjà à l'origine des publications « disparues » (30/08). |
| I4 | **Six cartes minimum sur la scène**, humains et agents confondus. | Exigence explicite de la Direction (03/09). |
| I5 | **Proposer n'est pas exécuter.** L'IA suggère une tribu, un niveau, un projet ; l'humain décide. | Aucune affectation d'office. |
| I6 | **Dégradation gracieuse.** IA indisponible → le direct continue. Vision indisponible → le direct continue. | Architecture de dégradation du prompt 5/7. |
| I7 | **Confidentialité par défaut.** La mémoire de parcours n'est jamais publique, jamais exposée à un tiers sans règle explicite. | Chapitre 5. |

---

## 1. État réel du socle — ce sur quoi on construit

Mesuré en base le 03/09/2026 (`pg_class` + `pg_stat_user_tables`), pas supposé.

**26 tables `live_*`, toutes avec RLS activée. Quatre seulement portent des
données :**

| Table | Lignes | Verdict |
|---|---|---|
| `live_sessions` | 12 | **RÉEL** — création, démarrage (`started_at`), fin (`ended_at`), univers visuel |
| `live_speakers` | 22 | **RÉEL** — roster unique : rôle, micro, caméra, main levée, `left_at` |
| `live_reactions` | 2 | **RÉEL mais très peu utilisé** |
| `live_transport_config` | 2 | **RÉEL** — `development` + `production` (LiveKit `wss://live.moknet.net`) |
| `live_messages` | **0** | ⚠️ **Écrit, jamais persisté en production** — le chat du direct n'a jamais enregistré un seul message réel |
| 21 autres (`live_questions`, `live_polls`, `live_decisions`, `live_documents`, `live_replays`, `live_agenda_items`, `live_action_items`, `live_attendance`, `live_whiteboard_strokes`, `live_products`, `live_gifts_sent`, `live_personal_notes`, `live_source_cards`, `live_poll_*`, `live_question_upvotes`, `live_solidarity_*`) | 0 | **SCHÉMA PRÊT, AUCUN CONSOMMATEUR** — déjà classé SIMULÉ/PROTOTYPE dans `docs/RAPPORT_FINAL_LIVE.md` |

**Transport** : LiveKit auto-hébergé sur le VPS Hostinger
(`wss://live.moknet.net`), SDK `livekit-client` **épinglé 2.17.3** (cause
prouvée contre le binaire serveur 1.8.4 — voir `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md`).
Média réel validé par l'utilisateur sur deux téléphones le 02/09/2026.

**IA** : passerelle unique `services/aiGateway.ts` → Edge Function `ai-gateway`
(v25), clés en Vault, bascule multi-fournisseurs, journal `ai_call_log`.
`generateText`, `analyzeImage`, `generateSpeech`, `transcribeSpeech` sont
réels et branchés.

**Ce que ce tableau dit sans détour** : le LIVE avait une **plomberie réelle**
et une **salle vide**. La mission LV corrige la salle.

---

## 2. Les trois familles de live

Le type n'est pas une étiquette : il **pilote réellement** le comportement de
la scène et de l'IA.

### 2.1 Live LIBRE — l'ambiance et l'échange

- **Objectif** : se retrouver, parler, écouter. Aucune structure imposée.
- **Règles** : l'IA reste **silencieuse** par défaut ; elle n'intervient que si
  on l'appelle. Aucune évaluation, aucune notation, aucun rapport de fin
  imposé.
- **Données** : `live_sessions.type = 'free'`.
- **Actions** : parler, lever la main, réagir, inviter, partager.
- **Preuves attendues** : un direct libre de 5 minutes sans une seule
  intervention IA non sollicitée (journal `ai_call_log` filtré sur la session
  = 0 appel non déclenché par un humain).

### 2.2 Live À THÈME — un expert IA monte sur scène

- **Objectif** : un sujet est posé ; un expert IA **écoute, recadre et aide à
  améliorer les idées**.
- **Règles** :
  - L'expert IA occupe une **vraie carte** sur la scène (`.live-pane--agent`),
    pas une bulle de chat.
  - Il **recadre** quand la discussion s'éloigne du thème — une fois, avec
    tact, jamais en boucle.
  - Il **améliore** une idée en la reformulant et en posant une question, il
    ne la remplace pas.
  - Il **se tait** quand la conversation avance d'elle-même (I6 : savoir se
    taire fait partie de l'intelligence).
  - Il ne parle **jamais** au nom d'un participant.
- **Données** : `live_sessions.type = 'themed'`, `ai_assistant_id` = l'agent,
  `live_sessions.tags` = le thème. Ses interventions sont écrites dans
  `live_messages` avec un auteur clairement identifié comme agent.
- **Actions** : l'hôte choisit l'expert à la création ou l'invite en cours de
  direct ; l'hôte peut le retirer de la scène à tout moment (déjà livré,
  DS-L1).
- **Preuves attendues** : sur un direct à thème réel, une intervention de
  recadrage déclenchée par une digression réelle, et **aucune** sur cinq
  minutes de discussion dans le sujet.

### 2.3 Live CONDUIT PAR L'IA — cours interactif

- **Objectif** : l'IA anime. Questions, encouragements, niveaux,
  recommandations.
- **Règles** :
  - L'IA suit un **déroulé** (introduction → notions → questions →
    récapitulatif) et l'annonce au début.
  - Les questions sont **adressées** (à la salle, ou à quelqu'un qui a levé la
    main), jamais à une personne qui n'a rien demandé.
  - Les encouragements portent sur **ce qui a été fait**, jamais sur la
    personne (« ta réponse tient compte du contexte », pas « tu es doué »).
  - Un **niveau atteint** est annoncé avec ce qui l'a déclenché.
  - **Aucune note publique.** La progression est privée (chapitre 5).
- **Données** : `live_sessions.type = 'ai_led'`, déroulé et progression dans
  `live_agenda_items` (table existante, 0 ligne — premier consommateur réel).
- **Actions** : démarrer, poser une question, valider une réponse, passer à
  l'étape suivante, clore avec un récapitulatif.
- **Preuves attendues** : un cours réel de bout en bout dont le déroulé est
  **écrit en base** (`live_agenda_items` non vide) et dont le récapitulatif
  final cite uniquement ce qui s'est réellement passé.

> **Règle d'implantation commune** : `live_sessions.type` existe déjà (colonne
> réelle, mappée par `mapSessionRow`). Les trois familles se branchent dessus —
> **jamais** un second champ parallèle.

---

## 3. Logique sociale — le direct est habité

### 3.1 Visibilité : qui est là

- **Objectif** : chacun voit qui est en ligne, sur scène et dans le public.
- **Règles** :
  - La liste vient **exclusivement** de `live_speakers` (`left_at IS NULL`).
    Aucune personne inventée, jamais un participant fictif de démonstration.
  - Le compteur de spectateurs est le compte **réel** — jamais un nombre
    d'ambiance.
  - « Aucun spectateur » est une **information honnête**, pas un écran vide.
  - Les agents IA sont **visuellement distingués** des comptes humains.
- **Données** : `live_speakers` (`role`, `is_muted`, `is_video_on`,
  `is_hand_raised`, `left_at`), lues par `fetchActiveParticipants`.
  Rafraîchissement : abonnement Realtime **+ sondage de secours toutes les
  4 s** (Realtime sur `live_speakers` n'est pas fiable dans cet
  environnement — constat documenté depuis la LOOP 05/14).
- **Actions** : ouvrir l'onglet « Personnes », lire rôle / micro / caméra /
  main levée.
- **Preuves attendues** : avec deux comptes réels, le second apparaît dans la
  liste du premier **en moins de 5 s** après avoir rejoint, avec son vrai nom.

### 3.2 Rejoindre

- **Objectif** : voir un direct dans le fil, cliquer, être dedans, entendre.
- **Règles** :
  - Le fil ne liste que des directs **réellement démarrés et non terminés**
    (`started_at IS NOT NULL AND ended_at IS NULL AND is_private = false`).
  - Rejoindre écrit une ligne `live_speakers` en `role='viewer'` — c'est ce qui
    ouvre la lecture RLS de la session.
  - Le son est **débloqué dans le geste** de l'utilisateur (`startAudio()`),
    jamais espéré de l'autoplay.
  - Un spectateur muet **n'occupe pas de carte** ; son audio éventuel passe
    quand même par `RemoteAudioSink`.
- **Données** : `fetchActiveLiveSessions`, `joinLiveSession`, `leaveLiveSession`.
- **Actions** : rejoindre, quitter, activer le son.
- **Preuves attendues** : compte B voit le direct de A dans le fil, le
  rejoint, et **des octets audio sont réellement reçus** (compteurs WebRTC),
  pas seulement une carte affichée.

### 3.3 Monter, descendre, couper un micro, retirer

- **Objectif** : l'animateur tient réellement sa salle.
- **Règles** :
  - **Monter** = `role → 'speaker'` ; **descendre** = `role → 'viewer'`.
  - **Couper le micro** d'un tiers = `is_muted = true` **en base** ; la
    personne visée coupe **réellement** sa piste en relisant sa ligne. Une
    icône barrée pendant que la voix continue de partir est un mensonge à
    l'écran.
  - **On ne rend jamais un micro automatiquement.** Base ouverte + micro fermé
    localement = la personne s'est coupée elle-même ; la « rendre » serait une
    prise de parole non voulue.
  - **Retirer** = poser `left_at` (jamais supprimer la ligne : l'historique de
    présence est conservé). La personne visée quitte réellement le transport.
  - L'hôte ne peut pas s'appliquer ces commandes à lui-même (il a « Quitter »).
  - Ces droits sont **déjà** portés par la RLS : `live_speakers_write_host_or_moderator`
    couvre `ALL` sur `is_live_moderator_or_host(session_id) OR user_id = auth.uid()`.
    **Aucune migration n'est nécessaire** pour couper un micro ou retirer
    quelqu'un — seulement du code honnête des deux côtés.
- **Données** : `updateParticipantRole`, `setParticipantMuted`,
  `removeParticipant`, `setOwnMediaState`, décision pure `deriveSelfMediaDirective`.
- **Preuves attendues** : A coupe le micro de B → **la piste de B est
  réellement coupée** (octets envoyés à 0), B est prévenu ; A retire B → B
  quitte réellement, sa ligne porte `left_at`.

### 3.4 Six cartes minimum

- **Objectif** : la scène est peuplée, humains et agents confondus.
- **Règles** : `composeStage` est la **source unique** qui décide qui occupe la
  scène ; le rendu ne fait que la suivre. La pastille de débordement compte
  comme une cellule. Une carte d'agent n'est jamais conditionnée à l'absence
  d'humain.
- **Preuves attendues** : scène à 1, 2, 4 et 6 cartes captée sur ordinateur et
  téléphone, dont au moins un agent IA invité (déjà fourni en DS-L1, à rejouer
  avec de **vrais** participants).

### 3.5 Inviter et partager

- **Objectif** : faire venir quelqu'un.
- **Règles** — trois chemins distincts, aux conséquences différentes :
  1. **Un ami** → vraie notification chez lui, `target_action = 'live:<id>'`.
     Réservé à l'animateur. Blocage respecté. **Anti-doublon** : tant que
     l'invitation précédente n'est pas lue, on n'en crée pas une seconde.
  2. **Un agent IA** → il monte immédiatement. Un agent n'a pas de compte, ne
     reçoit pas de notification, ne « décide » pas de venir.
  3. **Le lien** → pour toute personne hors de mes amis.
- **Données** : fonction `invite_to_live_session(uuid, uuid)` (SECURITY
  DEFINER, `EXECUTE` révoqué pour `anon`). Elle est **nécessaire** : la policy
  `notifications_owner` interdit d'écrire une notification pour autrui — c'est
  exactement pourquoi l'invitation n'existait nulle part dans le produit.
- **Preuves attendues** : A invite B → **une ligne réelle** dans
  `notifications` chez B, avec le bon `target_action` ; deuxième clic → aucune
  seconde ligne ; un non-animateur reçoit `42501`.

---

## 4. Logique IA — écouter, recadrer, conseiller

- **Objectif** : l'IA rend le direct plus utile, sans le confisquer.
- **Règles** :
  - **Trois niveaux d'intelligence** : invisible (elle prépare sans se
    montrer), proactive (elle intervient quand c'est justifié), à la demande.
  - **Elle doit savoir se taire.** Le silence est un comportement attendu, pas
    une panne.
  - **Elle ne fabrique jamais.** Pas de résumé d'un chat vide, pas de
    compétence attribuée sans trace, pas de reconnaissance d'objet incertaine
    présentée comme sûre.
  - **Vision** : montrer un objet à la caméra → capture d'image réelle →
    `analyzeImage` → l'agent nomme ce qu'il voit **et son degré de
    certitude**. « Je ne reconnais pas » est une réponse valide et attendue.
    Jamais d'identification biométrique de personne.
  - **Résumés** : nourris du **vrai** chat et de la vraie transcription. Si
    rien n'a été échangé, le dire.
  - **Dégradation** : passerelle IA en panne → le direct continue, les
    fonctions IA s'annoncent indisponibles.
- **Données** : `services/aiGateway.ts`, journal `ai_call_log` (chaque appel
  réel est traçable), `live_messages` pour le matériau, `live_source_cards`
  pour les éléments cités.
- **Preuves attendues** : une image réellement capturée et envoyée
  (`ai_call_log` porte l'appel `analyzeImage` pour la session), la réponse de
  l'agent citant l'objet montré, et un cas où l'agent dit honnêtement qu'il
  n'est pas sûr.

---

## 5. Mémoire de parcours, progression, motivation

- **Objectif** : l'IA se souvient de ce qui aide — sujets suivis, progrès,
  badges, recommandations données — et rien de plus.
- **Règles** :
  - **Portée respectée** : une mémoire créée dans un direct reste rattachée à
    son contexte ; elle ne devient pas une règle globale.
  - **Déclaré > inféré** : une préférence observée a structurellement moins
    d'autorité qu'une préférence déclarée, et ne se fige jamais en vérité.
  - **Résultat ≠ identité** : un échec devient « difficulté sur cet
    exercice », jamais « mauvais en X ».
  - **Aucun score social global opaque.** Les signaux sont contextuels et
    explicables ; la popularité n'est jamais confondue avec la compétence.
  - **Consultable et corrigible** : l'utilisateur peut voir, corriger et
    supprimer ce qui est retenu de lui.
  - **Confidentialité** : la progression est privée par défaut. Un badge n'est
    public que si son porteur le veut.
- **Données** — **on réutilise l'existant, jamais un système parallèle** :
  - `user_memory` (scopes `recent_activity` / `project` / `durable_preference`
    / `explicit`, RLS strictement owner-only, index unique partiel sur les
    préférences) ;
  - `profile_skills` et `profile_badges`, qui portent **déjà** les colonnes de
    provenance `source_type` / `source_id` — ajoutées au Chantier 1
    précisément pour un enrichissement automatique par formations, projets et
    activités. Un badge gagné en direct s'écrit avec
    `source_type = 'activity'` et `source_id` = l'id de la session.
- **Preuves attendues** : après un live conduit par l'IA, une ligne réelle
  dans `profile_skills` ou `profile_badges` avec la bonne provenance ; la même
  ligne **invisible** pour un tiers (RLS vérifiée par impersonation) ; une
  correction utilisateur qui remplace la valeur au lieu de s'empiler.

---

## 6. Orientation — tribus et cursus

- **Objectif** : pendant le direct, repérer forces, besoins et
  complémentarités, puis orienter.
- **Règles** :
  - Les tribus ne sont plus seulement thématiques : aussi **par niveau** et
    **par objectif**.
  - Quand quelqu'un progresse, l'IA peut suggérer un **groupe plus avancé** ou
    une **mission adaptée** — toujours une proposition (I5).
  - Une complémentarité repérée (« ces deux personnes se complètent sur ce
    sujet ») est proposée aux **deux**, jamais exploitée dans le dos de l'une.
  - Une orientation est **explicable** : « pourquoi cette tribu ? » doit avoir
    une réponse tirée de faits observés dans le direct.
  - **Jamais de justification qui révèle une donnée privée d'un tiers.**
- **Données** : module Tribu existant (`constants.ts`,
  `careerRadarEngine.ts`…) + `courses` / `enrollments` / `certificates`
  (tables réelles). Le modèle de données « tribu par niveau/objectif » est à
  poser — il n'existe pas encore.
- **Preuves attendues** : une recommandation réelle produite à partir du
  contenu réel du direct, avec son explication, et le refus de l'utilisateur
  correctement pris en compte (aucune insistance).

---

## 7. Du live au projet — produire de vrais documents

- **Objectif** : ceux qui veulent construire ensemble sont accompagnés pour
  structurer, monter le projet et produire des documents.
- **Règles** :
  - Un projet naît d'une **décision explicite** de ses membres — jamais
    déduit d'une discussion (« on pourrait faire ça » n'est pas une décision).
  - Le document produit est **réel et téléchargeable**, rattaché au live
    d'origine et à son équipe. Pas un résumé jetable.
  - L'IA est **assistante de rédaction**, jamais autrice ni propriétaire.
  - Un extrait de live à plusieurs intervenants exige le **consentement** des
    intervenants concernés.
- **Données** : `live_documents` (table existante, 0 ligne — premier
  consommateur réel), `tasks` pour le suivi, `dossiers` pour le rattachement
  projet (aujourd'hui **100 % `localStorage`** — limite honnête, migration
  hors périmètre de cette mission).
- **Preuves attendues** : un document réellement produit et téléchargé, sa
  ligne en base, et son lien vers la session d'origine.

---

## 8. Coaching et accompagnement

- **Objectif** : le direct devient un moteur de progression et de coaching.
- **Règles** : le coaching s'appuie sur la mémoire de parcours (chapitre 5) et
  ne réinvente pas de mécanique parallèle. Il propose des étapes concrètes et
  atteignables, jamais un jugement de valeur sur la personne.
- **Preuves attendues** : une recommandation de coaching qui cite un fait réel
  du parcours de la personne, et qu'elle peut refuser sans conséquence.

---

## 9. Monétisation

- **Objectif** : gratuit pour apprendre et participer ; services avancés
  payants pour un accompagnement poussé.
- **Règles** :
  - **Toujours gratuit** : rejoindre, écouter, parler, lever la main,
    participer à un cours IA, recevoir des recommandations, gagner des badges.
  - **Service avancé (payant)** : accompagnement approfondi, production
    documentaire assistée sur la durée, suivi personnalisé.
  - La frontière est **annoncée avant l'action**, jamais découverte au milieu.
  - Aucune retenue cachée, aucun compte à rebours de culpabilisation.
- **Limite honnête, structurelle** : **le mouvement réel d'argent exige un
  prestataire de paiement autorisé** (compte + clé), indisponible dans cet
  environnement. Le produit peut porter la frontière, les droits et
  l'affichage ; l'encaissement reste « INTÉGRATION EXTERNE REQUISE » — même
  statut que le Live Solidaire (`docs/RAPPORT_FINAL_LIVE.md`).

---

## 10. Design — la matière du Studio

Le langage visuel est spécifié à part et **déjà validé par la Direction le
03/09/2026** : `docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md` (§ 8 — abysse,
colonne d'eau liquide, verre cyan, orbes, plaques de nom, bulles, « ● EN
DIRECT » honnête ; 7 univers ; variables `--live-*` scopées sous
`[data-live-universe]`).

Ce que la Direction a demandé en plus le 03/09 : **plus moderne, plus vivant,
plus futuriste, sur cette base validée**. Aucune régression de la base
validée n'est acceptable pour y parvenir.

---

## 11. Feuille de route

Le découpage en loupes, les critères de test et les preuves attendues loupe
par loupe sont dans **`docs/LIVE_INTELLIGENT_VALIDATION.md`**.

---

## 12. Ce que ce document ne couvre pas (et l'assume)

- La migration du système de dossiers (`localStorage` → Supabase, 7 tables) —
  chantier dédié, hors mission LV.
- L'encaissement réel (chapitre 9).
- Le serveur LiveKit du VPS reste en **1.8.4** alors que
  `deploy/livekit/docker-compose.yml` épingle 1.13.6 : montée recommandée, non
  bloquante (le SDK 2.17.3 fonctionne avant et après).
- La reconnaissance de personnes : hors périmètre par décision, définitivement.
  Le LIVE ne fait pas d'identification biométrique.
