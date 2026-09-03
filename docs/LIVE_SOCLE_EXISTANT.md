# Le socle existant — ce qui marche et ne doit pas être cassé

> **Ce document vient AVANT la vision.** Règle de la Direction (03/09/2026) :
> « Documente d'abord l'existant à protéger, puis la vision, puis une roadmap
> priorisée. Ne mélange pas tout dans le code. »
>
> Il ne décrit **aucune ambition**. Il décrit ce qui **fonctionne aujourd'hui**,
> comment on le sait, et ce qui empêche un futur lot de le casser. Toute
> ambition est ailleurs : `LIVE_INTELLIGENT.md` et `LIVE_CAMPUS_EDUCATION.md`.
> L'ordre d'exécution est ailleurs encore : `LIVE_INTELLIGENT_VALIDATION.md`.

---

## 0. Pourquoi ce document existe

Ce dépôt a accumulé beaucoup de spécifications ambitieuses. Le risque n'est pas
de manquer d'ambition : c'est de **casser silencieusement** une chose qui
marchait, en construisant la suivante. Trois fois déjà dans ce projet, une
capacité réputée acquise s'est révélée inexistante ou détruite :

- la sauvegarde de profil échouait **depuis toujours** (`GRANT UPDATE` absent) ;
- la diffusion d'une alerte admin n'écrivait **que** dans `localStorage` ;
- le chat du direct n'a **jamais** persisté un message.

Chacune était « documentée comme opérationnelle ». D'où cette règle, tenue ici :
**une brique n'entre dans ce document que si elle est mesurée**, avec la trace
de la mesure. Ce qui n'est pas mesuré est listé au § 6 comme fragilité, pas
comme acquis.

---

## 1. Les trois états à ne jamais confondre

| État | Ce que ça veut dire | Comment on le vérifie |
|---|---|---|
| **EN PRODUCTION** | Servi par `moknet.net`, empreintes retrouvées dans le bundle | Lecture du bundle servi + parcours navigateur réel |
| **SUR UNE PR** | Codé, testé, CI verte, aperçu Netlify — **mais pas fusionné** | Numéro de PR + aperçu de déploiement |
| **SPÉCIFIÉ SEULEMENT** | Écrit dans un document de vision, **zéro ligne de code** | Absence de consommateur (`grep`, tables à 0 ligne) |

Ne jamais annoncer un état supérieur à celui qui est prouvé. Un statut
« TERMINÉ » sans preuve d'usage réel reste **PARTIEL**, reste-à-faire nommé.

---

## 2. Ce qui est EN PRODUCTION — brique par brique

### 2.1 Appels audio et vidéo entre deux personnes réelles

**Validé par la Direction elle-même, sur deux téléphones, le 02/09/2026** :
« l'appel passe correctement et les deux personnes parlent et s'entendent ».
C'est la seule brique du projet portant une validation humaine sur du matériel
réel — elle a donc la priorité de protection la plus haute.

Ce qui la fait tenir, et qui ne doit pas bouger sans preuve équivalente :

| Élément | Valeur exacte | Pourquoi c'est ainsi |
|---|---|---|
| `livekit-client` | **`2.17.3`, épinglé sans `^`** | Prouvé contre le binaire `livekit-server` **1.8.4** du VPS : ≥ 2.18 → 3 expirations de négociation / 50 s et `bytesSent` null ; 2.17.3 → 0 expiration. 2.17.3 fonctionne **aussi** contre 1.13.6. |
| Identité LiveKit | `<userId>::<deviceId>` **par onglet** | Deux onglets/appareils du même compte s'évinçaient mutuellement en boucle (connexion à 22 s au lieu de 4 s). |
| Serveur | `wss://live.moknet.net` | VPS Hostinger, TLS par CloudPanel/nginx, LiveKit sur `127.0.0.1:7880`, TURN 30000-30100. |
| Chemin média mesuré | UDP direct srflx ↔ hôte VPS, RTT 95-187 ms | 72 h de `call_diagnostics` : **zéro** candidat relay/TURN — la connectivité directe suffit sur ces réseaux. |

**Garde-fou automatique** : `tests/livekitClientPin.test.ts` échoue si la
version est dépinglée ou changée.

### 2.2 Interprète d'appel — la voix traduite voyage dans l'appel

En production depuis la PR #55 (`24d58d0`). Règles à ne pas inverser :

- **L'appel est NORMAL par défaut.** Aucune traduction tant que la personne
  n'a pas choisi « Entendre X en … » dans l'écran d'appel. Ce choix est propre
  à **cet** appel, jamais hérité du profil.
- La voix traduite est **rendue chez l'émetteur** et publiée comme piste
  LiveKit nommée `interpreter` — même chemin WebRTC que sa voix, le seul
  prouvé sur deux téléphones. Elle n'est **pas** jouée localement chez le
  récepteur (autoplay iOS et `volume` ignoré par iOS l'avaient tuée).
- L'original est coupé par **`muted`**, jamais par `volume` seul.
- Retour en « Voix originale » = original entier **immédiatement**, même au
  milieu d'une phrase traduite en vol.
- Le découpeur émet la parole captée **avant** une pause « l'interprète parle »
  (raison `pause`, ≥ 350 ms de voix). Sans cela, une parole continue face à un
  interprète bavard ne clôt **jamais** un segment : 88 s sans transcription,
  mesuré en base.

### 2.3 Sonnerie et notification hors application

En production depuis la PR #57 (`64e034f`). Ce qui la fait tenir :

- `public/sw.js` v6.6.0 — **l'installation n'est jamais fatale**. La version
  précédente faisait `cache.addAll(['/metadata.json'])`, ce fichier répond 404
  sur `moknet.net`, l'installation échouait, aucun service worker n'était
  jamais actif, et l'abonnement push échouait avec
  « Subscription failed - no active Service Worker ». Conséquence mesurée :
  `push_subscriptions` = 0 et `push_delivery_log` = 0 depuis l'origine.
  **Ne jamais remettre un pré-cache bloquant dans l'installation.**
- Web Push RFC 8291 / VAPID RFC 8292 dans l'Edge Function `push-notify` ;
  clé privée au Vault, jamais transmise.
- Toucher le corps de la notification (`open`) ouvre l'écran d'appel **qui
  sonne**, fenêtre existante comme lancement à froid. Bouton Décrocher 72×72,
  écran `z-[400]`.
- Réglages Sonnerie/Vibration honorés par l'application **et** par le service
  worker (Cache API `lmav-ring-prefs-v1`).

### 2.4 Le socle LIVE proprement dit

Mesuré le 03/09/2026 sur `rqciahtpixdjbyoajomg` : **26 tables `live_*`**, dont
**4 portent des données** :

| Table | Lignes | Ce que ça prouve |
|---|---|---|
| `live_speakers` | 22 | Le roster est réel : des gens sont réellement montés sur scène |
| `live_sessions` | 12 | Des directs ont réellement été créés et démarrés |
| `live_transport_config` | 2 | `development` et `production` (celle-ci active, `wss://live.moknet.net`) |
| `live_reactions` | 2 | Les réactions écrivent réellement |

Fonctionne réellement, et doit continuer :

- transport LiveKit via le port `LiveTransportProvider` / adaptateur
  `LiveKitTransportProvider` — **aucun composant ne parle au SDK directement** ;
- création, démarrage et fin d'une session ;
- roster `live_speakers` relu en continu (Realtime **plus** un sondage de
  secours toutes les 4 s — le Realtime sur cette table n'est pas fiable dans
  cet environnement, le sondage n'est pas une redondance décorative) ;
- promotion en `speaker`, main levée, descente ;
- audio distant et déblocage de l'autoplay au geste ;
- lien de partage réel ;
- **six cartes minimum** sur la scène (`composeStage`), humains et agents mêlés.

**Correctif structurel à ne pas défaire** (`live_sessions_fix_insert_returning_visibility`) :
la policy `SELECT` teste `host_id = auth.uid()` **sur la ligne** avant d'appeler
`can_view_live_session(id)`. Sans cela, `INSERT ... RETURNING` échoue en `42501` :
la fonction relit la table, et une ligne insérée par la commande en cours n'est
pas visible dans l'instantané de cette même commande. **Toute création de direct
était impossible** avant ce correctif.

### 2.5 Droits — la règle vit dans la base, pas dans l'écran

| Policy / fonction | Ce qu'elle garantit |
|---|---|
| `live_speakers_write_host_or_moderator` (`ALL`) | L'hôte peut écrire n'importe quelle ligne de **sa** session → couper un micro et retirer quelqu'un ne demandent **aucune** migration |
| `live_speakers_select` → `can_view_live_session` | On ne lit le roster que d'un direct qu'on a le droit de voir |
| `notifications_owner` | Un utilisateur ne peut **pas** écrire une notification pour autrui — c'est exactement pourquoi « inviter un ami » n'existait nulle part, et pourquoi `invite_to_live_session` est une fonction `SECURITY DEFINER` étroite |
| `can_view_network_post`, `can_message_user`, `are_users_blocked`, `discover_profiles` | Blocage, confidentialité et découverte appliqués **dans la base** |

**Convention non négociable, née de quatre défauts identiques** (LOOP 02/17,
04/17, 06/17, puis `discover_profiles`) : toute fonction `SECURITY DEFINER`
révoque `EXECUTE` pour `public` et `anon` **dès sa création**, jamais après
coup. Supabase accorde `EXECUTE` à tous par défaut ; quatre fois, une fonction
sensible s'est retrouvée appelable par un visiteur non connecté.

### 2.6 Jobs planifiés — 4, et seulement 4

`fire-due-reminders` (5 min) · `publish-scheduled-posts` (5 min) ·
`send-daily-digest` (8h UTC) · `generate-recurring-tasks` (5 min).
Toutes les fonctions appelées sont `SECURITY DEFINER` avec `EXECUTE` révoqué
pour `anon`/`authenticated` : elles ne sont **jamais** appelables par un client.
Tout nouveau job doit être documenté ici, sinon il est non documenté par
construction.

### 2.7 Passerelle IA

`ai-gateway` v25 déployée, octet-exacte avec le dépôt (SHA-256 vérifié).
Clés au Vault, jamais dans le bundle. Bascule de fournisseur par santé
mesurée. **Aucun composant n'appelle un fournisseur IA directement.**

Limite réelle, à ne pas masquer : **ElevenLabs est en quota dépassé** — la voix
HD passe par `gemini_tts`. Ce n'est pas un défaut de code.

---

## 3. Ce qui existe mais n'est PAS encore servi

**PR #60 — « Miroir d'eau » (menu) et « abysse » (Studio Live).** CI verte,
aperçu Netlify vérifié, tests verts. **`moknet.net` ne sert ni l'un ni l'autre.**
La Direction n'a pas encore donné son appréciation visuelle finale sur la
moitié « menu » ; la PR ne doit pas être fusionnée avant.

Deux arbitrages restent ouverts, nommés :
1. la ligne d'état « Réseau · en éveil » n'existe que sur l'en-tête **mobile** ;
2. la **barre latérale desktop** garde ses 17 entrées et la palette gelée
   `palette-10` — l'habiller demanderait de lever ce gel.

Ne présenter aucune des deux comme livrée.

---

## 4. Les invariants — ce qu'aucun lot futur ne peut casser

Sept règles. Elles ne sont pas des préférences : chacune est née d'un défaut
réel de ce dépôt.

| # | Invariant | Le défaut qui l'a fait naître |
|---|---|---|
| **I1** | **Ne jamais simuler une capacité absente.** Marquer NON FAIT plutôt que fabriquer. | Deux bandeaux « chiffré de bout en bout » et une empreinte « SHA256-AES » constante affichés à de vrais utilisateurs, alors que `content` est en clair. |
| **I2** | **Les droits vivent dans la base**, jamais seulement dans l'écran ni dans un prompt. | La voix ne doit jamais être un niveau d'accès supérieur à l'interface. |
| **I3** | **Aucun faux succès.** Un échec d'écriture annule l'action et le dit. | Une publication échouée était ajoutée à l'état local et à IndexedDB « comme si » : l'auteur voyait son post, personne d'autre, et il disparaissait au premier vrai post. |
| **I4** | **Six cartes minimum** sur la scène du direct, humains et agents mêlés. | Demande explicite de la Direction. |
| **I5** | **Proposer n'est pas exécuter.** Préparer ≠ publier ≠ envoyer. | Principe transversal de l'Architecte, repris de sept lots de spécification. |
| **I6** | **Dégradation gracieuse.** Une couche IA indisponible ne bloque jamais le socle. | Chercher une personne ne doit pas devenir impossible parce qu'un fournisseur IA est en panne. |
| **I7** | **Confidentialité par défaut.** Aucune fuite par un titre, un extrait ou un simple compte de résultats. | `searchProfiles` lisait `profiles` en direct : blocage circulaire où il fallait déjà être ami pour être trouvé. |

Deux invariants d'exécution s'y ajoutent, hérités de la gouvernance :

- **I8 — Zéro trace.** Tout compte de démonstration est supprimé, avec balayage
  des clés étrangères vers `profiles`/`auth.users` = 0. Sans exception.
- **I9 — La documentation fait partie du développement.** Une fonctionnalité
  non documentée n'est pas terminée. Une documentation qui ment est un défaut
  au même titre qu'un bug — c'est ce qui a fait corriger le
  « Statut : 100 % Opérationnel » du Campus alors que ses quatre tables sont
  vides et sans lecteur.

---

## 5. Les garde-fous automatiques qui tiennent tout ça

Le socle n'est pas protégé par la bonne volonté : il l'est par des tests qui
échouent. **59 fichiers de test, 801 tests verts** (mesuré le 03/09/2026).
Les plus structurants :

| Fichier | Ce qu'il empêche |
|---|---|
| `livekitClientPin.test.ts` | Dépingler le SDK et rejouer AU-14 |
| `liveStudioMatter.test.tsx` | Une classe `.live-*` utilisée mais absente d'`index.html` — elle ne peindrait rien, **sans erreur ni avertissement** ; couvre aussi les 7 univers, le mouvement réduit et le badge « EN DIRECT » |
| `miroirWater.test.tsx` | Le même piège pour la famille `.mir-*` |
| `tailwindClassValidity.test.ts` | Une teinte Tailwind inexistante (`brand-300`, `py-0.2`) : ~150 classes ne peignaient rien |
| `liveStageComposition.test.ts` | La règle des six cartes |
| `liveStageResync.test.ts` | La resynchronisation de scène |
| `useLiveTransportCall.test.tsx` | La régression de la chaîne d'appel sur un double de transport |
| `callAudioLink.test.ts`, `interpreterVoice.test.ts`, `pcmSegmenter.test.ts` | Les règles pures de l'appel et de l'interprète |
| `serviceWorkerPush.test.ts`, `outsideAppRinging.test.tsx` | La sonnerie hors application |

**Le garde-fou de classes CSS mérite une note.** Une classe absente de la
feuille de style ne provoque aucune erreur : elle ne peint simplement rien.
C'est le mode de défaillance le plus silencieux du projet, rencontré trois
fois. Le test scanne les sources et vérifie l'existence réelle de chaque
classe — et **un test vérifie que le garde-fou mord encore**, pour qu'un
assouplissement futur ne le vide pas de sa substance sans le dire.

**Green Gate** (`.github/workflows/ci.yml`) : `npm ci` → `tsc --noEmit` →
`vitest` → `vite build`, sans secret, sans `continue-on-error`.

---

## 6. Fragilités connues — nommées, pas cachées

Ne pas les traiter comme des acquis. Ne pas non plus les découvrir deux fois.

| Fragilité | État réel |
|---|---|
| **`live_messages` = 0 ligne** | Le chat du direct n'a **jamais** persisté un message. L'écran existe, la table existe, le pont n'existe pas. |
| **21 tables `live_*` à 0 ligne, sans consommateur** | Sondages, questions, tableau blanc, replays, documents, cadeaux, présence, agenda, décisions, notes, produits, cartes-sources, solidarité. Schéma prêt, code absent. À classer SIMULÉ/PROTOTYPE, jamais opérationnel. |
| **Serveur LiveKit du VPS toujours en 1.8.4** | `deploy/livekit/docker-compose.yml` épingle 1.13.6. Le SDK 2.17.3 fonctionne avant **et** après ; la montée reste recommandée, non bloquante, et demande 4 commandes SSH (action Direction). |
| **TURN/TLS 5349 non activé** | Sans effet mesuré : zéro candidat relay en 72 h. Deviendrait bloquant sur un réseau plus fermé. |
| **Instances périmées côté clients** | Des onglets/PWA jamais rechargés tournent encore sur du code d'avant LT-1. L'application **n'expose aucun identifiant de build au runtime** : impossible de le détecter ou de forcer la mise à jour. |
| **Doublon acoustique de l'interprète** | Le transcripteur se met en pause pendant la lecture locale de l'interprète, **jamais** pendant que sa propre voix traduite joue en face. Deux téléphones dans la même pièce peuvent donc recapter la traduction. Mécanisme identifié, **jamais mesuré au banc**. |
| **Vocabulaire de rôles d'`AdminConfigService`** | `citizen`/`partner`/`guest` n'existent dans aucune ligne réelle (`profiles_role_check` : `user`/`admin`/`expert`/`mentor`/`moderator`/`organization`/`super_admin`). Mappé au plus proche, jamais réconcilié. |
| **Dossiers de vie et 6 moteurs Carrière** | 100 % `localStorage`. `dossier_tasks` porte une FK vers `dossiers` qui n'existe pas en base. |
| **`docs/supabase_schema.sql`** | Brouillon pré-migration ne correspondant à aucune table réelle. Marqué obsolète en tête, jamais réécrit. |
| **Bac à sable** | Chromium n'atteint pas `moknet.net` en direct ; seul le TCP 443 sort. Toute preuve « deux appareils réels » revient à la Direction. |

---

## 7. Avant chaque nouveau lot — la procédure

1. **Lire ce document.** Identifier quelles briques du § 2 le lot touche.
2. **Mesurer avant de coder** : requête en base, `grep` du consommateur réel.
   Ne jamais partir d'une documentation, y compris celle-ci — la vérifier.
3. Coder **un seul lot**, sans élargir.
4. `npx tsc --noEmit` = 0 · `npx vitest run` = suite entière verte ·
   `npm run build` propre.
5. Migration éventuelle → `get_advisors` relu : zéro nouvelle alerte ERROR,
   zéro fonction `SECURITY DEFINER` exécutable par `anon`.
6. Preuve réelle propre au lot.
7. **Zéro trace** (I8) et **documentation dans le même commit** (I9).
8. Si une brique du § 2 a bougé sans preuve équivalente : **c'est une
   régression**, pas un progrès. On revient en arrière.

---

## 8. Où va le reste

| Besoin | Document |
|---|---|
| Ce qu'on veut construire (LIVE intelligent) | `LIVE_INTELLIGENT.md` |
| Ce qu'on veut construire (branche éducation) | `LIVE_CAMPUS_EDUCATION.md` |
| Dans quel ordre, avec quelles preuves | `LIVE_INTELLIGENT_VALIDATION.md` |
| L'état réel de la base, domaine par domaine | `SUPABASE_ARCHITECTURE.md` |
| Le rapport final de la mission LIVE (16 loupes) | `RAPPORT_FINAL_LIVE.md` |
| La matière visuelle du Studio | `DIRECTION_ARTISTIQUE_STUDIO_LIVE.md` |
