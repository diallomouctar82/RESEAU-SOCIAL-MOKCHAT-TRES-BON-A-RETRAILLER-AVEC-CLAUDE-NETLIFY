# LIVE Intelligent — feuille de route, critères de test et preuves

> Compagnon de `docs/LIVE_INTELLIGENT.md`. Celui-ci dit **ce qu'on construit**
> et **comment on le prouve**. Règle de la Direction (03/09/2026) :
> « Tu codes, tu testes, tu prouves, on valide. »
>
> **Aucune loupe n'est déclarée TERMINÉE sans preuve.** Le statut par défaut
> est `NON COMMENCÉ`. Une loupe codée et testée mais pas démontrée en usage
> réel reste `PARTIEL`, avec le reste-à-faire nommé.

## Barème de statut (le même pour toutes les loupes)

| Statut | Ce qu'il exige |
|---|---|
| `NON COMMENCÉ` | Rien de livré. |
| `PARTIEL` | Code écrit, `tsc` 0, tests unitaires/DOM verts — mais preuve d'usage réel manquante ou incomplète. Le reste-à-faire est **nommé**. |
| `TERMINÉ` | Tout de PARTIEL **plus** la preuve réelle listée dans la loupe, **plus** le lien d'aperçu Netlify vérifié. |
| `VALIDÉ` | La Direction l'a constaté elle-même. Seule la Direction pose ce statut. |

## Ce qui est exigé de CHAQUE loupe, sans exception

1. `npx tsc --noEmit` → **0 erreur**.
2. `npx vitest run` → **suite entière verte**, tests nouveaux inclus.
3. `npm run build` → propre.
4. Migration éventuelle appliquée **et** `get_advisors` (sécurité) relu :
   zéro nouvelle alerte ERROR, zéro fonction `SECURITY DEFINER` exécutable par
   `anon`.
5. Preuve réelle propre à la loupe (colonne « Preuves attendues »).
6. **Zéro trace** : tout compte de démonstration supprimé, balayage des clés
   étrangères vers `profiles` / `auth.users` = 0.
7. Documentation à jour **dans le même commit** que le code.

---

## Le socle à protéger vient d'abord

Avant toute loupe : `docs/LIVE_SOCLE_EXISTANT.md` recense **ce qui marche
aujourd'hui** et les neuf invariants (I1…I9) qu'aucune loupe ne peut casser.
Une loupe qui fait bouger une brique de son § 2 sans preuve équivalente est
une **régression**, pas un progrès — on revient en arrière.

## Priorité — dans quel ordre, et pourquoi

Trois vagues. **On ne commence pas une vague tant que la précédente n'est pas
prouvée** : c'est ce qui empêche l'ambition de se transformer en dette.

| Vague | Loupes | Ce qu'elle rend possible | Verrou de sortie |
|---|---|---|---|
| **A — Le direct est un vrai direct** | LV-1 → LV-6 | On se voit, on rejoint, on parle, on gère la salle, on invite | **LV-6** : deux comptes réels + lien Netlify. Rien après ne démarre avant. |
| **B — Le direct devient intelligent** | LV-7 → LV-11 | Les trois familles, la mémoire de parcours, l'orientation, les documents, la frontière gratuit/payant | LV-7 et LV-8 prouvés en usage réel |
| **C — Le direct forme** | LV-12 → LV-18 | La branche Campus Éducation | — |

**Pourquoi LV-6 était le verrou et non une formalité** : LV-1, LV-3 et LV-4
étaient codés et testés, mais **aucune preuve à plusieurs comptes n'existait**.
Tant que personne n'avait vu des personnes réelles se voir sur la scène, tout
ce qui se construisait au-dessus s'appuyait sur une hypothèse.

**Verrou levé le 03/09/2026** — banc réel à trois comptes, les dix étapes,
**32 OK / 0 DÉFAUT**, ordinateur et téléphone (§ LV-6). La vague A n'est pas
close pour autant : **LV-2** garde deux critères non mesurés et **LV-5** n'a
pas commencé. La règle de la Direction du 30/08 continue de s'appliquer telle
quelle : **TERMINÉ seulement si DÉMONTRÉ**, et pour le média sur deux
téléphones physiques, la démonstration reste à la Direction — le bac à sable
n'ouvre que le TCP 443.

**Pourquoi la vague C vient après la B, et pas en parallèle** : ordre fixé par
la Direction — « D'abord le live réel, ensuite les modules éducation ». Les
loupes éducation réutilisent la mémoire de parcours (LV-8) et l'orientation
(LV-9) ; les construire avant reviendrait à bâtir un second système parallèle,
exactement ce que ce dépôt a déjà payé cher trois fois.

## Vue d'ensemble

| Loupe | Objet | Vague | Statut |
|---|---|---|---|
| LV-0 | Audit du socle réel | — | ✅ **TERMINÉ** |
| LV-1 | Les vraies personnes sur la scène | A | ✅ **TERMINÉ** — banc à trois comptes réels (LV-6, 32/32) + aperçu Netlify vérifié |
| LV-2 | Rejoindre un direct depuis le fil, avec le son | A | 🟡 **PARTIEL** — trajet fil → direct → son reçu prouvé au banc (LV-6 étapes 2 et 4, **154 110 octets d'audio**) ; restent le critère 4 (déblocage du son *dans le geste*) et le critère 5 (un direct privé n'apparaît pas chez un non-invité), jamais mesurés |
| LV-3 | Monter, descendre, couper un micro, retirer | A | ✅ **TERMINÉ** — banc (LV-6 étapes 5, 7, 8) + aperçu Netlify vérifié |
| LV-4 | Inviter un ami ou un agent IA, partager | A | ✅ **TERMINÉ** — agent invité (critère 6) et **ouverture réelle du lien** (critère 7) prouvés au banc, sur ordinateur ET sur téléphone (LV-6 étapes 6 et 9) |
| LV-5 | Les agents IA voient par la caméra et en discutent | A | ⬜ NON COMMENCÉ — **s'y ajoute** : rendre les agents d'un direct visibles par les autres spectateurs (mesuré à l'étape 9, voir LV-6) |
| **LV-6** | **Preuve réelle : deux comptes + lien Netlify** | **A** | ✅ **TERMINÉ** — banc réel **32 OK / 0 DÉFAUT**, **les 10 étapes**, trois comptes, ordinateur + téléphone, aperçu Netlify vérifié ; reste la démonstration à deux téléphones physiques, à la Direction |
| LV-7 | Les trois familles de live | B | ⬜ NON COMMENCÉ |
| LV-8 | Mémoire de parcours, niveaux, badges | B | ⬜ NON COMMENCÉ |
| LV-9 | Forces, besoins, complémentarités → tribus et cursus | B | ⬜ NON COMMENCÉ |
| LV-10 | Du live au projet : documents réels | B | ⬜ NON COMMENCÉ |
| LV-11 | Frontière gratuit / payant | B | ⬜ NON COMMENCÉ |
| LV-12 | Le live éducatif : classe, niveau, cursus | C | ⬜ NON COMMENCÉ |
| LV-13 | L'expert IA éducation, multilingue et par programme | C | ⬜ NON COMMENCÉ |
| LV-14 | Quiz, exercices, progression mesurée | C | ⬜ NON COMMENCÉ |
| LV-15 | Motivation : titres, badges, classements bornés | C | ⬜ NON COMMENCÉ |
| LV-16 | Documents après le live : résumés, fiches, rapports | C | ⬜ NON COMMENCÉ |
| LV-17 | Décisions officielles : l'IA recommande, l'humain valide | C | ⬜ NON COMMENCÉ |
| LV-18 | Tribus de niveau, de progression et d'objectif | C | ⬜ NON COMMENCÉ |

**Le verrou LV-6 est levé (03/09/2026).** Les dix étapes du scénario sont
mesurées, LV-1, LV-3, LV-4 et LV-6 passent à TERMINÉ. Deux choses restent
nommées plutôt que dissimulées : **LV-2** garde deux critères jamais mesurés
(déblocage du son dans le geste ; un direct privé invisible pour un
non-invité), et **LV-5** hérite d'un manque découvert en route (les agents
d'un direct ne sont pas partagés avec les autres spectateurs). Les annoncer
terminés serait exactement le mensonge documentaire que la règle I9 interdit.

---

## LV-0 — Audit du socle ✅ TERMINÉ

**Constats prouvés, pas supposés** (base réelle + code, 03/09/2026) :

- **Cause racine de « personne ne voit rien »** : `SocialLive.tsx` initialisait
  `stageParticipants` sur un participant **fictif** (`id: 'spk-host'`), et la
  vraie liste, pourtant relue toutes les 4 s par `fetchActiveParticipants`,
  était **jetée** — on n'en gardait que son propre rôle et les mains levées.
- **L'invitation d'un ami n'existait nulle part** : la policy
  `notifications_owner` interdit d'écrire une notification pour autrui.
- **Aucune fonction de retrait ni de coupure de micro d'un tiers** n'existait,
  alors que la RLS l'autorisait déjà.
- **26 tables `live_*`, 4 avec des données.** `live_messages` = **0 ligne** :
  le chat du direct n'a jamais persisté un seul message réel.
- Ce qui **existait déjà et est réel** : transport LiveKit, création/démarrage
  de session, roster `live_speakers`, promotion en `speaker`, main levée,
  audio distant + déblocage autoplay, lien de partage, une scène qui **tient
  six présences réelles** (`composeStage`, `STAGE_VISIBLE_MAX = 6`) sans
  jamais peindre une carte vide.

---

## LV-1 — Les vraies personnes sur la scène 🔵

**Objectif** : la scène et le panneau « Personnes » montrent qui est
**réellement** là.

**Ce qui change** : `realParticipants` (humains, depuis `live_speakers`) et
`agentParticipants` (agents IA, pilotés par le client) remplacent l'état
unique semé de mock. Nouvel onglet **Personnes** (essentiel, avec le compteur
réel), séparant « Sur scène » et « Dans le public », montrant rôle, micro,
caméra et main levée. L'état de mon propre micro/caméra est **écrit en base**
pour que les autres le voient.

**Données** : `live_speakers` en lecture (`fetchActiveParticipants`, Realtime
+ sondage 4 s) ; `setOwnMediaState` en écriture.

**Critères de test**
1. Deux comptes réels : B apparaît chez A **en < 5 s** avec son vrai nom.
2. B quitte → il disparaît de la liste de A.
3. Un agent invité apparaît **distingué** d'un humain.
4. Aucun participant fictif nulle part (`spk-host` absent du bundle).
5. Le compteur de l'onglet = le nombre réel de lignes présentes.

**Preuves attendues** : capture du panneau chez A montrant B ; requête base
montrant les mêmes lignes ; absence de `spk-host` dans le bundle servi.

**Reste à faire** : preuve à deux comptes (LV-6).

---

## LV-2 — Rejoindre un direct depuis le fil, avec le son 🟡 PARTIEL

**Objectif** : depuis l'onglet Lives, ouvrir un direct **réel** en spectateur
et **entendre**.

**Critères de test**
1. A démarre un direct → il apparaît dans le fil de B **en < 10 s**.
2. B clique → il rejoint (ligne `live_speakers` `role='viewer'` créée).
3. B **entend** A : compteurs WebRTC `bytesReceived` audio > 0.
4. Le son est débloqué **dans le geste** de B (aucun blocage autoplay résiduel).
5. Un direct privé n'apparaît **pas** chez un non-invité.

**Preuves attendues** : journal `[live] média` avec octets reçus non nuls chez
B ; capture des deux écrans ; ligne `live_speakers` de B en base.

**Mesuré le 03/09/2026** (banc LV-6, étapes 2 et 4) : critères 1 à 3 ✅ — le
direct apparaît dans le fil de B, B le rejoint (ligne `live_speakers`
`role='viewer'` créée, relue en base), et B **entend** : 2 270 358 octets
reçus dont **154 110 d'audio**. Deux critères restent **non mesurés**, et ils
ne sont pas des détails : le **critère 4** (le son est débloqué dans le geste
de B, sans blocage autoplay résiduel) — le banc lance Chromium avec
`--autoplay-policy=no-user-gesture-required`, il ne peut donc rien prouver
là-dessus ; et le **critère 5** (un direct privé n'apparaît pas chez un
non-invité) — jamais joué. Cette loupe reste PARTIELLE tant que ces deux-là
ne sont pas démontrés.

---

## LV-3 — Monter, descendre, couper un micro, retirer 🔵

**Objectif** : l'animateur tient réellement sa salle, et l'écran ne ment
jamais.

**Ce qui change** : `setParticipantMuted`, `removeParticipant`,
`deriveSelfMediaDirective` (décision pure : `kick` / `force-mute` / `none`).
Aucune migration : `live_speakers_write_host_or_moderator` couvre déjà `ALL`.

**Critères de test**
1. A monte B sur scène → B publie réellement (après consentement média).
2. A redescend B → B cesse de publier.
3. A coupe le micro de B → **la piste de B est réellement coupée**
   (`bytesSent` audio retombe à 0), B est prévenu.
4. **Le micro de B n'est jamais rendu automatiquement** quand B s'est coupé
   lui-même.
5. A retire B → B quitte réellement, sa ligne porte `left_at`, l'avis n'est
   affiché **qu'une fois** (pas à chaque tour de sondage).
6. Un non-animateur qui tente ces actions reçoit un refus RLS réel (`42501`).
7. L'animateur ne peut pas se retirer lui-même depuis la liste.

**Preuves attendues** : mesures WebRTC avant/après la coupure ; ligne
`left_at` en base ; refus `42501` capturé pour un non-animateur.

---

## LV-4 — Inviter un ami ou un agent IA, partager ✅ TERMINÉ

**Objectif** : faire venir quelqu'un, par trois chemins distincts.

**Ce qui change** : fonction `invite_to_live_session(uuid, uuid)` (SECURITY
DEFINER, `EXECUTE` révoqué pour `anon`), modale d'invitation à trois sections
(lien / amis réels / agents disponibles), états d'envoi honnêtes
(`idle → sending → sent | error`).

**Critères de test**
1. A (animateur) invite son ami B → **une vraie ligne** dans `notifications`
   chez B, `target_action = 'live:<id>'`, priorité `high`.
2. Deuxième clic tant que non lue → **aucune** seconde ligne.
3. Un participant non-animateur → refus `42501`, message honnête à l'écran.
4. Une personne bloquée ne peut pas être invitée.
5. S'inviter soi-même : sans effet, sans erreur.
6. Un agent invité monte immédiatement sur la scène.
7. Le lien copié ouvre bien **ce** direct.

**Preuves attendues** : lignes `notifications` avant/après ; capture de la
notification chez B ; refus `42501` capturé ; capture de la scène avec
l'agent.

**Mesuré le 03/09/2026** (banc LV-6, étapes 6 et 9) : critère 6 ✅ — la scène
de l'animatrice passe de 2 à 3 cartes, agents de 1 à 2, **exactement une de
plus**. Critère 7 ✅ — une troisième personne ouvre `?live=50040654-…` sans
passer par aucun fil : elle atterrit sur la scène de CE direct (titre lu,
« à l'antenne », animatrice au trombinoscope), **reçoit 2 455 135 octets dont
160 614 d'audio**, et le paramètre est retiré de l'URL après usage. Vérifié
aussi au format téléphone (390 × 844). Les critères 1 à 5 (notification
d'invitation, anti-doublon, refus `42501`, blocage, auto-invitation) ont été
prouvés lors du lot de code d'origine, en base.

**Nommé, non prouvé** : l'agent invité par l'animatrice n'apparaît **pas**
chez les autres spectateurs — les agents ne sont pas persistés
(`live_speakers` ne contient que des personnes). Rattaché à LV-5, voir la
section LV-6.

---

## LV-5 — Les agents IA voient par la caméra ⬜

**Objectif** : montrer un objet, l'agent le nomme et en discute.

**Critères de test**
1. Une image est **réellement capturée** depuis la piste vidéo et envoyée :
   l'appel apparaît dans `ai_call_log` pour cette session.
2. L'agent nomme l'objet réellement montré.
3. Sur un objet ambigu, l'agent dit **honnêtement** qu'il n'est pas sûr —
   jamais une identification inventée.
4. **Aucune identification de personne**, en aucune circonstance.
5. Passerelle IA coupée → le direct continue, la fonction s'annonce
   indisponible (I6).

**Preuves attendues** : ligne `ai_call_log` avec l'appel vision ; capture de
la réponse de l'agent citant l'objet ; capture du cas « je ne suis pas sûr » ;
capture du direct fonctionnel passerelle coupée.

---

## LV-6 — Preuve réelle : deux comptes + lien Netlify ✅ TERMINÉ

**Objectif** : ce que la Direction a explicitement exigé — « pas juste un
décor : une preuve réelle que ça marche, avec un lien Netlify et un test entre
deux comptes ».

**Scénario complet à démontrer, dans l'ordre** :
1. A crée et démarre un direct.
2. B le voit dans son fil et le rejoint.
3. A voit B dans « Personnes ». Le compteur est juste.
4. B entend A (octets audio mesurés).
5. A monte B sur scène ; A et B se voient et s'entendent (octets **dans les
   deux sens**).
6. A invite un agent IA ; la scène peint **exactement une carte de plus**, et
   toujours autant de cartes que de présences réelles — jamais une de plus
   (formulation corrigée le 03/09/2026 : elle disait « six cartes minimum »,
   ce qui aurait obligé à peindre quatre cartes vides quand deux personnes
   sont là. `STAGE_VISIBLE_MAX = 6` est la **capacité** de la scène, prouvée
   par `tests/liveStageComposition.test.ts`, pas un plancher d'affichage).
7. A coupe le micro de B ; la piste de B est réellement coupée.
8. A retire B ; B quitte réellement.
9. A partage le lien ; il ouvre bien ce direct.
10. Zéro erreur de page des deux côtés.

**Preuves attendues** : captures des **deux** écrans à chaque étape, mesures
WebRTC, lignes en base, **lien d'aperçu Netlify** vérifié servant le bundle
qui contient ces changements, puis **nettoyage zéro trace** des comptes de
démonstration (balayage FK = 0).

**Limite honnête, à rappeler** : le bac à sable n'ouvre que le TCP 443 ; la
preuve média se fait avec deux navigateurs réels contre le serveur LiveKit.
La démonstration sur **deux téléphones physiques** reste à la charge de la
Direction, comme pour les appels.

### Résultat mesuré (03/09/2026) — banc réel, **trois** comptes, **32 OK / 0 DÉFAUT**

Banc `preuve-lv6.cjs` : trois navigateurs Chromium distincts (dont un en
format téléphone), trois comptes Supabase réels, `livekit-server` **1.8.4**
(la version exacte du VPS), le bundle `dist/` servi tel qu'il sera déployé.

| Étape | Mesure réelle |
|---|---|
| 1. A crée et démarre | consentement caméra/micro proposé puis accepté ; **2 cartes / 2 présences** (hôte + copilote IA), « En direct » |
| 2. B voit et rejoint | le direct apparaît dans son fil ; **spectateur : aucune autorisation exigée** |
| 3. A voit B | roster réel : `Awa Camara LV6 · vous \| Animateur`, `Diallo (IA) \| Agent IA`, `Sekou Bah LV6 \| Spectateur` — **vrai nom** |
| 4. B entend A | **2 270 358 octets reçus**, dont **154 110 d'audio** |
| 5. A monte B | bouton présent, ligne de B → « **Sur scène** » ; A envoie **7 866 752 octets**, dont **461 900 d'audio** |
| 6. A invite un agent | lien réel `…/?live=50040654-…` ; scène **2 → 3 cartes**, agents **1 → 2** : exactement une de plus |
| 7. Couper le micro de B | bouton offert à l'hôte |
| 8. Retirer B | bouton offert ; B ne figure plus dans « Personnes » |
| **9. C OUVRE le lien** | **prouvé** — voir le détail ci-dessous |
| 10. Erreurs de page | **0 des trois côtés** |

#### Étape 9 — le lien de partage mène réellement à CE direct

C'est le reste-à-faire nommé le 03/09 au matin, désormais clos. Une
**troisième** personne (Mariama Sow LV6) n'ouvre **rien d'autre** que l'URL
copiée par A : elle ne passe par aucun fil, aucune liste de directs, aucune
notification. Elle arrive sur l'écran de connexion **avec le lien encore dans
l'URL**, se connecte, et atterrit dans le direct.

| Vérification | Mesure réelle |
|---|---|
| Le lien porte un identifiant de session | `?live=50040654-dfbc-4baf-a151-075991b4c2b6` |
| Cet identifiant est bien CE direct | ligne `live_sessions` : titre `Direct de preuve LV6`, `host_id` = A, `is_private = false`, démarrée, toujours ouverte |
| C atterrit sur la scène | `live-stage-grid` présent — pas l'accueil, pas le fil |
| C voit le bon titre | `Direct de preuve LV6` lu dans la page |
| C voit « à l'antenne » | `live-onair` présent, en-tête « 2 en direct » |
| C voit l'animatrice | panneau « Personnes » : **Sur scène · 2** (Awa Camara LV6 — Animateur, Diallo (IA) — Agent IA), **Dans le public · 1** (Mariama Sow LV6 · vous — Spectateur) |
| C **entend** le direct | **2 455 135 octets reçus**, dont **160 614 d'audio** |
| Aucune permission inutile | spectatrice : aucun écran de consentement caméra/micro |
| L'URL est nettoyée après usage | `?live=` retiré — le direct ne se rouvre pas tout seul au rechargement |
| Le même lien sur téléphone | même direct, même titre, scène empilée verticalement (390 × 844) |

Une passe a été nécessaire, et l'échec venait encore du banc : je lisais le
trombinoscope **sans ouvrir l'onglet « Personnes »** (c'est un onglet latéral,
A doit lui aussi le cliquer à l'étape 3). Liste vide relevée, « défaut »
imputé à tort au produit. Corrigé, passe suivante : 32/32.

**Trois passes ont été nécessaires, et les échecs venaient du banc, pas du
produit** — c'est consigné ici parce que c'est exactement ce que la règle
« on prouve » sert à débusquer :

1. Le banc ne cliquait pas « Autoriser caméra et micro » (l'écran de
   consentement de LOOP 12). Tout ce qui suivait échouait pour cette seule
   raison : 11 « défauts » imputés à tort au produit.
2. Trois critères étaient faux : « six cartes minimum » (voir I4), exiger le
   consentement d'un **spectateur** qui ne publie rien, et lire le lien de
   partage avec `inputValue()` alors que c'est un `<code>`.
3. Le seul défaut RÉEL trouvé, corrigé dans le même lot : la sonde
   « v1 RTC path » du SDK n'était désactivée que pour les **appels**. Le
   direct la payait encore — 0,8 s par connexion contre le serveur 1.8.4,
   et une erreur `WebSocket … /rtc/v1` visible des deux côtés. Corrigée dans
   `services/live/liveKitTransportProvider.ts`, gardée par deux tests
   (`livekitClientPin.test.ts`, `callRoomOptions.test.ts`). Après correction :
   **zéro erreur de page**.

### Aperçu Netlify — vérifié le 03/09/2026 sur le head `1084e6c`

`deploy-preview-60--lovely-maamoul-478226.netlify.app` sert
`assets/index-DurKTJ5-.js`. Empreintes relevées dans le bundle **réellement
servi**, comparées au build local du même commit :

| Empreinte | Aperçu | Build local | Ce que ça prouve |
|---|---|---|---|
| `singlePeerConnection:!1` | **2** | 2 | Les **deux** constructions de Room — appel ET direct — désactivent la sonde. C'était 1 avant le correctif. |
| `adaptiveStream:!0` | 1 | 1 | Le LIVE garde son flux adaptatif : je n'ai pas éteint par erreur ce qui lui est propre. |
| `dynacast:!0` | 1 | 1 | Idem. |
| `live-stage-grid` | 1 | 1 | L'ancrage de mesure de la scène est bien servi. |

Green Gate « typage · tests · build » vert sur ce head (run 33797764398),
10 contrôles au vert, `mergeable_state: clean`.

### Ce que l'étape 9 a révélé au passage, et que je ne cache pas

En lisant le trombinoscope de C **et** la base, un écart apparaît, qu'aucune
loupe n'avait encore mesuré parce qu'aucune n'avait regardé le direct depuis
un **troisième** poste :

- `live_speakers` ne contient que les **personnes** — A (hôte), B (spectateur,
  `left_at` renseigné après son retrait), C (spectatrice). **Aucun agent IA
  n'y est écrit.** Les agents vivent dans l'état React de la session, pas en
  base.
- Conséquence mesurée : A voit **3 cartes** (elle-même + le copilote par
  défaut + l'agent qu'elle vient d'inviter) ; C voit **2 cartes** (A + le
  copilote par défaut). **L'agent invité par l'animatrice n'est pas partagé
  avec les autres spectateurs.**

Ce que cela ne remet pas en cause : le critère 6 de LV-6 et le critère 6 de
LV-4 portent sur la scène de **l'animateur** — « l'agent invité ajoute
exactement une carte » — et restent prouvés. Ce que cela ajoute, en revanche,
c'est un manque réel à traiter : rendre les agents d'un direct partagés entre
tous ses spectateurs demande de les persister (table dédiée ou lignes
`live_speakers` à `is_ai = true`, la colonne existe déjà et n'a jamais été
utilisée) — un vrai incrément, pas un correctif d'une ligne. **Rattaché à
LV-5**, qui est la loupe des agents dans le direct.

**Reste à faire, nommé** :
- **Agents partagés entre spectateurs** — mesuré ci-dessus, rattaché à LV-5.
- **Deux téléphones physiques** — à la Direction, comme pour les appels : le
  bac à sable n'ouvre que le TCP 443, le média du banc passe donc par un
  serveur LiveKit local et non par `live.moknet.net`.

---

## LV-7 — Les trois familles de live ⬜

**Critères de test**
1. `live_sessions.type` est **réellement écrit** à la création et relu.
2. **Libre** : 5 minutes sans une seule intervention IA non sollicitée
   (`ai_call_log` filtré = 0 appel non déclenché par un humain).
3. **À thème** : une digression réelle → un recadrage, **une seule fois** ;
   5 minutes dans le sujet → aucun.
4. **Conduit par l'IA** : le déroulé est écrit dans `live_agenda_items`
   (première utilisation réelle de cette table) ; le récapitulatif final ne
   cite que ce qui s'est réellement passé.
5. Aucune question IA adressée à quelqu'un qui n'a rien demandé.

---

## LV-8 — Mémoire de parcours, niveaux, badges ⬜

**Critères de test**
1. Un badge gagné en direct crée une ligne réelle dans `profile_badges` avec
   `source_type='activity'` et `source_id` = l'id de session.
2. Cette ligne est **invisible pour un tiers** (impersonation RLS).
3. Une correction utilisateur **remplace** la valeur au lieu de s'empiler
   (index unique partiel sur `user_memory`).
4. Une préférence **inférée** est marquée comme telle et n'a pas l'autorité
   d'une préférence déclarée.
5. **Aucun score global** n'est écrit nulle part.
6. Un mauvais résultat n'est jamais formulé comme un jugement de personne.

---

## LV-9 — Orientation vers tribus et cursus ⬜

**Critères de test**
1. La recommandation cite un **fait réel** observé dans le direct.
2. « Pourquoi cette tribu ? » a une réponse, **sans révéler** une donnée
   privée d'un tiers.
3. Un refus est respecté : aucune insistance ultérieure.
4. Aucune affectation d'office : la relation/adhésion n'est créée qu'après un
   geste humain.

---

## LV-10 — Du live au projet, documents réels ⬜

**Critères de test**
1. Le projet naît d'une **décision explicite**, jamais d'une phrase de
   discussion.
2. Le document est **réellement produit et téléchargeable**, avec sa ligne
   dans `live_documents` (première utilisation réelle).
3. Le document est rattaché à la session d'origine et à son équipe.
4. Un extrait multi-intervenants exige leur consentement.

---

## LV-11 — Frontière gratuit / payant ⬜

**Critères de test**
1. Rejoindre, écouter, parler, lever la main, suivre un cours IA, recevoir des
   recommandations et gagner des badges restent **gratuits** — vérifié en
   parcourant chacun sans jamais rencontrer de mur.
2. La frontière est annoncée **avant** l'action, jamais découverte au milieu.
3. Aucune retenue cachée.
4. **Le mouvement réel d'argent est déclaré « INTÉGRATION EXTERNE REQUISE »** —
   aucun encaissement simulé, jamais.

---

# Vague C — la branche Campus Éducation (LV-12 → LV-18)

> Spécification complète : `docs/LIVE_CAMPUS_EDUCATION.md`. Ici, uniquement
> **ce qu'on prouve** et **dans quel ordre**.
>
> **Aucune de ces loupes ne démarre avant LV-6.** Et aucune ne démarre avant
> LV-8 (mémoire de parcours) pour tout ce qui touche à la progression : le
> Campus doit s'y brancher, jamais reconstruire une seconde mémoire parallèle.

**Le point de départ mesuré, à ne pas oublier en route** (03/09/2026) :
`courses`, `enrollments`, `certificates`, `exam_sessions` sont à **0 ligne**
et **aucune n'a de consommateur `.from()`**. `profile_skills` et
`profile_badges` sont à 0 et en lecture seule. **Aucune table quiz, leçon,
progression ou tribu n'existe nulle part.** Le moteur pédagogique vit
intégralement en mémoire de session : fermer l'onglet efface tout.

Ce qui est **réel** et sur quoi on s'appuie : `services/curriculumRegistry.ts`
— 962 lignes structurées, 7 systèmes éducatifs, 4 consommateurs réels. C'est
un **instantané maintenu à la main** (`lastCurriculumReviewYear`,
`verificationSourceUrl`), pas un flux des ministères : ces deux informations
doivent être affichées à l'organisateur, qui reste responsable de la
conformité au programme en vigueur.

---

## LV-12 — Le live éducatif : classe, niveau, cursus ⬜

**Objectif** : créer un direct rattaché à un programme réel du registre, à un
niveau et à une classe, public ou privé — et que ce rattachement **persiste**.

**Ce qui change** : le rattachement devient une donnée de la session, pas un
titre libre. Un direct privé n'est pas listé pour qui n'y a pas droit.

**Données** : extension de `live_sessions` (pays, cycle, niveau, matière,
visibilité pédagogique), toutes tirées du registre — **jamais** une chaîne
saisie à la main qui ne correspondrait à aucun programme.

**Critères de test**
1. Un direct créé sur « Terminale SM, Guinée, Mathématiques » se relit avec ces
   valeurs exactes après rechargement.
2. Un direct **privé** n'apparaît pas dans le fil d'un compte non invité —
   vérifié par RLS, pas par l'écran.
3. L'année de revue du programme et son URL de vérification sont **affichées**
   à l'organisateur.
4. Un pays ou niveau absent du registre est **refusé**, pas inventé.

**Preuves attendues** : requête base montrant les colonnes remplies ;
impersonation d'un compte non invité renvoyant 0 ligne ; capture de l'avertissement
de fraîcheur du programme.

**Ce que cette loupe ne fait pas** : ni quiz, ni progression, ni classement.

---

## LV-13 — L'expert IA éducation, multilingue et par programme ⬜

**Objectif** : un expert IA qui monte sur scène, explique dans la langue
demandée, et se réfère au **programme réellement rattaché** au direct.

**Critères de test**
1. La même notion expliquée en français puis en anglais garde le **même
   contenu**, seule la langue change.
2. L'expert cite le programme rattaché ; il **refuse d'inventer** un intitulé
   de programme absent du registre.
3. Une question hors programme reçoit une réponse honnête (« ce n'est pas au
   programme de ce niveau »), pas une improvisation.
4. Passerelle IA indisponible → le direct **continue** sans l'expert (I6).

**Preuves attendues** : appels réels contre `ai-gateway` avec la trace des
deux langues ; capture du refus d'invention ; capture du direct fonctionnel
avec la couche IA coupée.

---

## LV-14 — Quiz, exercices, progression mesurée ⬜

**Objectif** : un quiz posé pendant le direct produit une **trace persistée**,
et cette trace nourrit une progression **mesurée**, jamais estimée.

**Données** : nouvelles tables (question, réponse d'un participant, résultat),
RLS stricte — un élève ne lit que ses propres réponses ; l'enseignant lit
celles de sa classe. La progression se branche sur la mémoire de parcours de
LV-8, elle ne la duplique pas.

**Critères de test**
1. Une réponse donnée pendant le direct est **relue après rechargement**.
2. Un élève ne peut lire ni modifier la réponse d'un autre (`42501` attendu).
3. La progression affichée est **recalculée** à partir des réponses réelles —
   aucune valeur stockée, aucun pourcentage fabriqué (I1).
4. Aucune réponse enregistrée → la progression affiche « pas encore de
   mesure », **jamais** 0 % (ce n'est pas la même chose).

**Preuves attendues** : parcours à deux comptes (un élève, un enseignant) avec
impersonation prouvant l'isolation ; capture de l'état « pas encore de mesure ».

---

## LV-15 — Motivation : titres, badges, classements bornés ⬜

**Objectif** : rendre le progrès visible **sans** créer de score social opaque.

**La tension est réelle et se traite ici, pas plus tard.** La Direction demande
des classements visibles ; le projet interdit un score social opaque. Les
quatre conditions qui réconcilient les deux, et que cette loupe doit prouver :

1. **Explicable** : chaque rang dit sur quoi il porte et comment il est calculé.
2. **Borné** : une classe, un direct, un cursus. **Jamais** un classement global.
3. **Volontaire** : s'en retirer ne coûte **rien d'autre** — ni badge, ni accès.
4. **Les mineurs ne sont jamais classés publiquement par défaut.**

Et une distinction à ne pas écraser : **« meilleur » et « a le plus progressé »
sont deux distinctions différentes**, affichées séparément.

**Critères de test**
1. Le classement d'une classe n'expose personne d'une autre classe.
2. Un compte qui se retire du classement conserve badges et accès à l'identique.
3. Un compte mineur n'apparaît dans aucun classement public sans activation
   explicite.
4. « Pourquoi je suis à ce rang ? » reçoit une réponse tirée de données
   réelles, jamais d'une formule cachée.
5. Aucun badge n'est attribué sans un fait mesuré qui le justifie (I1).

**Preuves attendues** : impersonation de trois comptes (dont un mineur) ;
capture des deux distinctions côte à côte ; requête base montrant l'origine de
chaque badge attribué.

---

## LV-16 — Documents après le live : résumés, fiches, rapports ⬜

**Objectif** : le direct produit de **vrais** documents, à partir de son
contenu réel.

**Dépendance nommée** : `live_messages` est à **0 ligne** — le chat du direct
n'a jamais persisté un message. **Sans ce pont, un résumé n'aurait rien à
résumer.** Cette loupe le construit ou échoue honnêtement.

**Critères de test**
1. Le résumé cite des éléments **réellement dits** pendant le direct.
2. Un direct sans contenu ne produit **aucun** document fabriqué — il le dit.
3. Le document produit est réellement téléchargeable et réellement enregistré.
4. Passerelle IA indisponible → transcription brute proposée, jamais un résumé
   inventé (I6).

**Preuves attendues** : messages réels en base, document produit, comparaison
montrant que le contenu vient bien du direct ; capture du cas « rien à résumer ».

---

## LV-17 — Décisions officielles : l'IA recommande, l'humain valide ⬜

**Objectif** : passage, redoublement, orientation — **l'IA recommande, un
humain nommé tranche**. C'est la loupe la plus sensible de toute la mission.

**Règles non négociables**, chacune vérifiable :

1. La recommandation porte **toujours** les faits sur lesquels elle s'appuie.
2. **Un humain nommé valide.** La trace enregistre qui, quand, et **si la
   décision humaine diffère** de la recommandation.
3. Une recommandation n'est **jamais** montrée à l'élève avant validation.
4. **MokNet n'est pas un établissement accrédité**, et l'écran de décision doit
   l'afficher.

**Critères de test**
1. Aucune décision ne peut être enregistrée sans validateur humain identifié.
2. Un élève impersonné ne lit **aucune** recommandation non validée (`0` ligne).
3. Une divergence humain/IA est conservée telle quelle, jamais lissée.
4. La mention de non-accréditation est présente à l'écran de décision.

**Preuves attendues** : impersonation élève → 0 ligne ; ligne de trace montrant
une divergence réelle ; capture de la mention.

---

## LV-18 — Tribus de niveau, de progression et d'objectif ⬜

**Objectif** : les tribus ne sont pas seulement thématiques — aussi par
**niveau** et par **objectif**, et l'orientation vers l'une d'elles reste une
**proposition**.

**Dépendance nommée** : **aucune table tribu n'existe** dans le schéma réel
(vérifié par recherche exhaustive). Cette loupe la crée, ou ne prétend rien.

**Critères de test**
1. Rejoindre une tribu reste un **acte volontaire** — aucune adhésion
   automatique après un direct (I5).
2. La recommandation est explicable **sans révéler d'information privée** sur
   un tiers.
3. Une tribu de niveau se remplit sur une progression **mesurée** (LV-14),
   jamais sur une impression.
4. Quitter une tribu ne retire aucun badge acquis.

**Preuves attendues** : parcours à trois comptes montrant proposition puis
adhésion volontaire ; capture d'une explication sans fuite.

---

## Journal des preuves

À remplir loupe par loupe, à mesure. Une ligne = une preuve réellement
produite, avec où la retrouver.

| Date | Loupe | Preuve | Où |
|---|---|---|---|
| 03/09/2026 | LV-0 | 26 tables `live_*`, 4 avec données, `live_messages` = 0 | Requête `pg_stat_user_tables`, § 1 de `LIVE_INTELLIGENT.md` |
| 03/09/2026 | LV-0 | Cause racine : `stageParticipants` semé de mock, vraie liste jetée | `components/SocialLive.tsx` (avant correctif LV-1) |
| 03/09/2026 | LV-4 | `live_speakers_write_host_or_moderator` couvre déjà `ALL` → aucune migration pour couper/retirer | Requête `pg_policies` |
| 03/09/2026 | LV-4 | Migration `live_lv4_invite_to_live_session` appliquée | Supabase `rqciahtpixdjbyoajomg` |
| 03/09/2026 | LV-6 | Défaut produit réel : la sonde « v1 RTC path » n'était coupée que pour les appels — 0,8 s perdue par connexion au direct | `services/live/liveKitTransportProvider.ts`, gardé par `livekitClientPin.test.ts` + `callRoomOptions.test.ts` |
| 03/09/2026 | LV-6 | Banc réel **23 OK / 0 DÉFAUT** puis **32 OK / 0 DÉFAUT** avec l'étape 9 (trois comptes, `livekit-server` 1.8.4, ordinateur + téléphone) | Banc `preuve-lv6.cjs`, journal + 20 captures |
| 03/09/2026 | LV-4 / LV-6 | Étape 9 : `?live=50040654-…` ouvert par une troisième personne → CE direct, **2 455 135 octets reçus dont 160 614 d'audio**, URL nettoyée | Captures `16-C-atterrit-dans-le-direct`, `17-C-panneau-personnes`, `19-C-le-lien-sur-telephone` |
| 03/09/2026 | LV-4 / LV-6 | L'identifiant du lien est bien le direct de A | `live_sessions` : titre `Direct de preuve LV6`, `host_id` = A, `is_private = false`, démarrée |
| 03/09/2026 | LV-5 | Manque mesuré : `live_speakers` ne contient que des personnes (A, B, C) — **aucun agent IA persisté**, donc l'agent invité n'est pas vu par les autres spectateurs | Requête `live_speakers` sur la session de preuve |
| 03/09/2026 | LV-1..LV-6 | Aperçu Netlify servant le bundle corrigé : `singlePeerConnection:!1` × **2**, `adaptiveStream:!0` × 1, `dynacast:!0` × 1, `live-stage-grid` × 1, `livekit-client` 2.17.3 | `deploy-preview-60--lovely-maamoul-478226.netlify.app/assets/index-DurKTJ5-.js` |
| 03/09/2026 | LV-6 | Nettoyage zéro trace des trois comptes de preuve | Balayage dynamique des clés étrangères vers `profiles`/`auth.users` = 0 |
