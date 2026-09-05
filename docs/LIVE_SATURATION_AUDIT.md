# SAT-0 — Audit de la saturation des directs

**Périmètre** : Lives et Directs uniquement (LiveKit, VPS, saturation, stabilité).
**Base mesurée** : `main` à `97382a9`, branche `claude/lives-directs`.
**Méthode** : rien n'est supposé. Chaque ligne ci-dessous est soit une mesure
contre la base réelle (`rqciahtpixdjbyoajomg`), soit une sonde HTTP réelle
contre le VPS, soit une lecture de code avec fichier et ligne.

---

## 1. Avec quoi peut-on compter les gens dans un direct ?

C'est la première question, parce qu'une porte qui refuse l'entrée « quand
c'est plein » a besoin de savoir combien il y a de monde. Trois candidats
existaient. Deux sont morts.

| Candidat | Verdict | Preuve |
|---|---|---|
| `live_sessions.viewers_count` | **Inutilisable** | La colonne existe (`integer`, défaut `0`, non nul). Elle est **lue** à trois endroits (`services/live/liveSessionService.ts:21,88`, `components/SocialFeed.tsx:392`) et **écrite nulle part** — aucun `insert`/`update` ne la mentionne dans tout le dépôt. Elle vaut donc `0` en permanence, pour toutes les sessions. |
| `live_attendance` (table, 9 colonnes) | **Schéma mort** | **Zéro occurrence** dans tout le code applicatif. La table existe en base, rien ne l'écrit, rien ne la lit. |
| `live_speakers` | **Vivante, mais ce n'est pas ça** | Réellement écrite et lue (16 appels dans `liveSessionService.ts`). Mais elle décrit **qui est sur la scène** (intervenants, experts), pas qui regarde. Un direct à 4 000 spectateurs y aura toujours 2 ou 3 lignes. |

**Conséquence** : aucun compteur applicatif fiable n'existe aujourd'hui. Il
n'y a pas non plus la moindre notion de capacité dans le schéma — aucune
colonne `max_viewers`, `capacity` ou équivalent sur `live_sessions`
(48 colonnes vérifiées une à une), et aucune constante de plafond dans le
code du périmètre Live.

`live_sessions.is_waiting_room_enabled` existe également (booléen, défaut
`false`) et est mappé jusqu'au type client (`types.ts:726`), mais **n'a
aucun consommateur** : trois occurrences en tout, toutes des déclarations ou
du mapping. Salle d'attente : schéma prêt, jamais branché.

---

## 2. La découverte : LiveKit sait déjà compter, et il répond déjà

Sonde réelle, sans aucun identifiant, depuis cet environnement :

```
POST https://live.moknet.net/twirp/livekit.RoomService/ListRooms  ->  HTTP 401
POST https://live.moknet.net/rtc/validate                          ->  HTTP 401
GET  https://live.moknet.net/                                      ->  HTTP 200 (0,41 s)
```

**401, pas 404.** La différence est tout le sujet : nginx/CloudPanel route
bien l'API serveur (twirp) de LiveKit jusqu'au conteneur, et LiveKit répond
en refusant faute d'authentification. L'API est **déjà en ligne, déjà
routée, déjà joignable**.

Or la fonction Edge `livekit-token` détient déjà la clé et le secret LiveKit
(lus au Vault). Elle peut donc appeler `RoomService/ListParticipants` et
obtenir le **nombre réel de participants d'une room**, faisant autorité,
**sans aucune action de votre part sur le VPS**.

### Ce que cela corrige dans ce que j'avais annoncé

J'avais dit que la régulation exigeait d'abord d'exposer un point de lecture
sur le VPS. C'est vrai pour une partie seulement, et il faut distinguer les
deux :

| Signal | Disponible ? | Ce qu'il permet |
|---|---|---|
| **Occupation réelle** (participants, publieurs par room) | **OUI, déjà** — `RoomService`, routé, 401 sans auth | Compter juste, refuser l'entrée quand le seuil est atteint (SAT-1, SAT-2) |
| **Marge du nœud** (CPU, bande passante) | **NON** | Faire *suivre* la capacité quand l'infra grandit (SAT-1b) |

La configuration LiveKit du dépôt (`deploy/livekit/docker-compose.yml`) ne
définit **pas** `prometheus_port` : les métriques de nœud ne sont ni
produites ni routées. C'est le seul point qui demande encore une action SSH.

**En clair** : la régulation *réactive* (compter et refuser) est constructible
dès maintenant. La régulation *prédictive* (la capacité suit l'infra à la
hausse, sans qu'on touche à un chiffre) reste suspendue à SAT-1b.

---

## 3. La porte serveur n'existe pas encore

`supabase/functions/livekit-token/index.ts` fait 160 lignes. Elle contient
**un seul refus non lié à l'authentification** : `503` quand aucune
configuration de transport n'est active (ligne 115). Aucun contrôle de
capacité, aucun comptage, aucun `429`.

Aujourd'hui, un jeton est **toujours** délivré à qui est authentifié et
autorisé sur la session. Rien ne peut refuser l'entrée d'un direct saturé.

---

## 4. Il n'y a aucune récupération, seulement de l'observation

`services/live/liveKitTransportProvider.ts:189-191` écoute bien les trois
événements du SDK :

```
RoomEvent.Reconnecting        -> recordCallEvent('transport', 'SDK : reconnexion complète en cours')
RoomEvent.SignalReconnecting  -> recordCallEvent('transport', 'SDK : signalisation en reconnexion')
RoomEvent.Reconnected         -> recordCallEvent('transport', 'SDK : reconnecté')
```

Les trois **journalisent, et c'est tout**. `hooks/useLiveTransport.ts:138`
expose un `reconnectCount`, également informatif. Il n'existe **aucune
action applicative** de récupération : pas de nouvelle tentative pilotée par
l'application, pas de bascule, pas de relance de session.

Autrement dit : ce qui existe aujourd'hui, c'est la reconnexion **interne au
SDK LiveKit**. Quand elle échoue, ou quand le serveur répond mais ne sert
plus (le cas d'un blocage réel), rien ne se déclenche.

Point à retenir pour SAT-4 : `GET /` répond `HTTP 200` en 0,41 s **même
quand la voix ne passe pas** — c'est exactement le motif mesuré le 02/09
(négociation expirée en boucle, `bytesSent` toujours nul, pendant que le
serveur répondait normalement). **Une sonde de vie qui répond 200 ne prouve
rien.** La détection devra s'appuyer sur des compteurs de média réels, pas
sur la disponibilité HTTP.

**Suite — SAT-4 livré (5 septembre 2026, DEC-2026-054).** Les compteurs
média vivent côté client : une sonde serveur ne les voit pas. SAT-4 a donc
retenu l'appel dont dépend réellement l'ouverture d'un direct —
`POST /twirp/livekit.RoomService/ListRooms`, signé avec la clé du coffre —
et c'est précisément le motif ci-dessus qu'il sépare : un serveur qui répond
200 sur `/` mais refuse les identifiants (401/403) est **rouge**, un serveur
qui répond au-delà des 1 500 ms que la porte SAT-2 peut attendre est
**orange**, un serveur qui ne répond pas est rouge, un serveur non sondé est
**blanc** et jamais vert. Démontré en production : 400 ms, vert, 0 direct en
cours. La question « la voix passe-t-elle en ce moment ? » reste une question
client (rapports `call_diagnostics`), hors du périmètre de cette ligne.

**Suite — SAT-5 (5 septembre 2026, DEC-2026-055) : ce que l'application
répare seule, et la frontière VPS.** Deux réparations sont désormais
automatiques côté application (en production contrôlée depuis le 5/09, PR #81
et migration appliquée ; prouvé au banc réel 39/39 contre un LiveKit vivant — room supprimée, refus
`live_full`, serveur tué puis relancé, direct clôturé en base) : la relance
bornée d'un direct dont la ligne tombe — trois fois
au plus, uniquement si la base confirme que le direct est encore ouvert,
jamais sur un refus nommé (direct complet) ni après une éviction par identité
dupliquée, et sans jamais confondre « base injoignable » et « direct fermé »
— et la clôture horaire des directs zombies par `pg_cron`, tracée dans
`audit_logs`. **Frontière VPS — ce qu'aucune boucle client ni aucun cron ne
peut faire** : redémarrer le conteneur `livekit-server` (le cas du 2
septembre où `GET /` répondait 200 pendant que la voix ne passait pas),
refaire tourner une clé API qui a divergé entre le coffre et le VPS (SAT-4 le
voit : rouge « refuse nos identifiants »), rouvrir les ports UDP
50000-50100 / 30000-30100, monter le serveur de 1.8.4 à 1.13.6, poser
`prometheus_port` (SAT-1b). Ces gestes exigent SSH : ils reviennent au bouton
de secours SAT-6 (tracé, confirmé, réservé à l'Administrateur Général) et aux
étapes ACT-3/4/5 — un humain, jamais un automate.

---

## 5. Admin Général : la définition existe, mais côté client seulement

`services/adminConfigService.ts:1777` :

```ts
const isSuperAdmin = profile.email?.toLowerCase() === 'visionsmart224@gmail.com'
                  || profile.role === 'super_admin';
```

C'est une évaluation **dans le navigateur**. Elle convient pour afficher ou
masquer un bouton ; elle ne convient pas pour autoriser une action de
secours. SAT-6 devra vérifier le rôle **côté serveur** (fonction Edge ou
fonction Postgres `SECURITY DEFINER`), sans jamais se fier à ce booléen —
sinon n'importe qui peut déclencher le secours en modifiant son état local.

---

## 6. Écart de version du serveur, toujours ouvert

`deploy/livekit/docker-compose.yml:51` épingle `livekit/livekit-server:v1.13.6`.
Le conteneur qui tourne réellement sur le VPS est en **1.8.4** (mesuré le
02/09 dans les rapports de diagnostic de deux téléphones réels). Le dépôt est
donc en avance sur la machine : l'épinglage a été écrit, jamais appliqué.

C'est sans conséquence immédiate — `livekit-client` est délibérément épinglé
`2.17.3`, mesuré sans expiration de négociation contre 1.8.4 **et** contre
1.13.6. Mais cela reste une dette du périmètre, et elle touche SAT-4 : les
signaux de santé exposés diffèrent entre les deux versions.

---

## 7. Limite honnête de cet environnement

Le bac à sable ne sort qu'en **TCP 443**. Les ports 7881 (RTC/TCP),
3478 (TURN/UDP) et 50000-50100 (média) **ne sont pas sondables d'ici**. Tout
ce qui touche au chemin média réel se mesure au banc local contre le binaire
`livekit-server` 1.8.4 exact, ou par les rapports de diagnostic de vrais
appareils — jamais par une sonde depuis cet environnement.

---

## Ce que l'audit change pour la suite

| Tâche | Constructible sans action VPS ? |
|---|---|
| SAT-1 — capacité auto-régulée | **Oui**, sur l'occupation réelle lue via `RoomService` |
| SAT-2 — porte côté serveur | **Oui**, dans `livekit-token`, qui détient déjà les identifiants |
| SAT-3 — écran « complet » | **Oui** |
| SAT-4 — détecter un blocage réel | **Livré et démontré en production le 05/09/2026 (DEC-2026-054)** — non pas une sonde HTTP sur `/`, mais `ListRooms` signé avec la clé du coffre : 401/403 = rouge (le cas que le ping déclarait vert), > 1 500 ms = orange (porte SAT-2 aveugle), délai/réseau = rouge, non sondé = blanc. Les compteurs média côté client restent hors de cette ligne : elle juge « un direct peut-il démarrer », pas « la voix passe-t-elle en ce moment » |
| SAT-5 — récupération automatique | **Livré, démontré et EN PRODUCTION CONTRÔLÉE (5/09/2026, DEC-2026-055)** : la ligne d'un direct se relance seule, bornée et gardée par la base (`isLiveSessionStillOpen` — ouvert / fermé / injoignable, trois réponses distinctes), démontré au banc réel 39/39 contre un LiveKit vivant (rétablissement en 1,5 s, budget 3 puis « Réessayer », refus « complet » jamais martelé, direct clos = « Ce direct est terminé. · Quitter » sans un seul jeton) ; les zombies se ferment toutes les heures par `pg_cron` (migration jouée à vide en transaction annulée). Déployé le 5/09 : PR #81 fusionnée (`main` `880b5fa`, bundle SAT-5 servi par moknet.net), migration appliquée, première exécution réelle du cron à 02:15 UTC = 13 zombies fermés et tracés, 0 restant (détail `HISTORIQUE_VERSIONS` v6.20.0). Tout ce qui exige le VPS reste hors de portée : voir § 4 « Frontière VPS ». |
| SAT-6 — bouton Admin Général | **Oui**, à condition de vérifier le rôle côté serveur |
| SAT-1b — signal de marge (prédictif) | **Non** — demande `prometheus_port` et son routage sur le VPS |

---

---

# SAT-2 — La porte d'entrée, côté serveur

Construite sur le constat ci-dessus. Elle vit dans
`supabase/functions/livekit-token/`, à l'émission du jeton : c'est le seul
point qu'un client ne peut pas contourner, puisque sans jeton signé aucune
room ne s'ouvre.

## Le constat qui a changé la conception

La première version comptait avec `numParticipants` (rapporté par
`ListRooms`). Le banc l'a démentie. Mesure faite avec **deux vrais
navigateurs connectés à une vraie room**, sur les deux binaires :

| | 1.8.4 (le VPS) | 1.13.6 (la cible du dépôt) |
|---|---|---|
| `listRooms().numParticipants` | juste après **1–3 s** | juste après **3–6 s** |
| `listParticipants().length` | **exact immédiatement** | **exact immédiatement** |
| `maxParticipants` | exact immédiatement | exact immédiatement |

`numParticipants` est un agrégat à consistance différée. Une porte fondée
dessus aurait été **silencieusement inopérante pendant une ruée** — c'est-à-dire
au seul moment qui compte : le temps que le compteur rattrape, des dizaines de
personnes seraient déjà entrées, et rien à l'écran n'aurait signalé que la
porte ne servait à rien.

Conception retenue : **le plafond se lit dans `listRooms`, le comptage se fait
dans `listParticipants`** — qui donne du même coup la liste des identités
présentes, donc le nombre ET le contrôle de reconnexion en un seul appel.

## Le plafond ne vient jamais du code

Il vient de `maxParticipants`, porté par la room côté LiveKit. Aucun chiffre
n'est écrit en dur, et aucun réglage manuel n'existe — la Direction a écarté
les deux. Tant que rien n'a posé de plafond, LiveKit rapporte `0`, sa
convention pour « aucune limite », et **la porte ne refuse personne**.

C'est aussi le point d'accroche de SAT-1 : quand la capacité deviendra
auto-régulée, elle posera cette valeur sur la room et la porte suivra sans
qu'on la retouche.

## Les règles, et pourquoi

| Situation | Décision | Raison |
|---|---|---|
| Le demandeur est l'animateur | **entre**, sans aucun appel réseau | On ne met personne à la porte de son propre direct — et il n'en paie pas la latence |
| Plafond illisible (LiveKit muet) | **entre** | On ne sait pas : un direct un peu trop plein reste un direct, un direct qui refuse tout le monde est une panne |
| Plafond à 0 | **entre**, sans second appel | Aucune limite posée |
| Places disponibles | **entre** | — |
| Room pleine, personne déjà dedans | **entre** | Réseau tombé et reconnexion : sa place est encore occupée par elle-même |
| Room pleine, liste illisible | **entre** | On ne sait pas que c'est plein |
| Room pleine, nouvel arrivant | **REFUSÉ** — `409`, `code: 'live_full'`, avec `occupied` et `capacity` | Un plein **constaté** est ferme ; la tolérance ne vaut que pour le doute |

La distinction est délibérée : **on laisse entrer quand on ne sait pas, jamais
quand on sait que c'est plein.**

## Ce que la porte ne touche pas

- **Les appels (`call-…`)** : un appel à deux ne sature rien, et LT-1/LT-2 ont
  travaillé sa latence au dixième de seconde. La porte n'y ajoute pas une
  seule lecture.
- **Un nom de room qui n'est pas un UUID** : jamais envoyé vers la base.
  `live_sessions.id` est de type `uuid` ; un cast raté rendrait un `22P02` qui
  deviendrait un refus au lieu d'un « ce n'est pas un direct ».

## Coût en latence

Un appel réseau sur le chemin normal (lire le plafond), un second uniquement
quand un plafond existe réellement. Délai plafonné à **1,5 s** par appel :
au-delà, on cesse d'attendre et on laisse entrer.

## Preuves

- **18 cas unitaires** sur la vraie fonction de décision, plus **7
  contre-épreuves** : chaque règle cassée fait rougir exactement le cas qui la
  protège, fichier restauré à l'empreinte identique.
- **Banc d'intégration 18 OK / 0 DÉFAUT sur les DEUX binaires** (1.8.4 et
  1.13.6) : vrai serveur, vrais navigateurs connectés, vraie fonction de
  décision. Prouvé de bout en bout — le plafond lu du serveur, un nouvel
  arrivant refusé avec les chiffres réels, le revenant laissé entrer,
  l'animateur qui passe, la place libérée qui rouvre la porte aussitôt.

## Ce qui reste

- **La fonction Edge n'est pas déployée.** La déployer, c'est la production :
  elle est globale et unique. Elle attend la validation à l'écran de la
  Direction.
- **SAT-1** : poser réellement `maxParticipants` sur la room. Sans lui, cette
  porte est en place mais ne refusera jamais personne, faute de plafond.

---

# SAT-3 — L'écran quand le direct est complet

## Le refus n'arrivait pas jusqu'à l'écran

SAT-2 avait fermé la porte côté serveur, mais son refus mourait à la frontière
cliente. `supabase.functions.invoke` aplatit TOUT échec HTTP en une seule
phrase générique — « Edge Function returned a non-2xx status code » — et le
corps réel de la réponse n'existe plus que dans `error.context`, qui est
l'objet `Response` (vérifié dans le code de supabase-js :
`FunctionsClient.js` fait `throw new FunctionsHttpError(response)`).

Conséquence à l'écran : le 409 était indiscernable d'une panne, et
`SocialLive.tsx` affichait « Connexion au direct… » en boucle. La personne
fixait un point d'attente pour une place qui ne viendrait jamais. **Un refus
muet est pire qu'un refus** — il fait porter à l'utilisateur le soupçon que
son appareil est en panne.

## Ce qui a été construit

| Où | Quoi |
|---|---|
| `services/live/liveAccessError.ts` (nouveau) | La décision seule : `readLiveRefusal` (corps → refus typé), `LiveAccessError`, `isLiveFull`, `liveFullOccupancy`. Aucun Supabase, aucun réseau, aucun React — donc testable pour de vrai. |
| `services/live/liveKitToken.ts` | Lit le corps du 409 via `error.context.json()` et lève une `LiveAccessError` qui porte `code`, `occupied`, `capacity`. Tout le reste garde le chemin d'erreur historique, mot pour mot. |
| `hooks/useLiveTransport.ts` | Nouveau champ `refusal` — distinct de `error`. Effacé à chaque nouvelle tentative et par « Réessayer » : le refus n'est jamais figé. |
| `hooks/useLiveTransport.ts` (`liveBadge`) | Nouvel état **COMPLET**, placé AVANT « INTERROMPU » : un direct plein n'a pas été interrompu, on n'y est jamais entré. |
| `components/live/LiveFullNotice.tsx` (nouveau) | L'écran : « Ce direct est complet », les chiffres RÉELS du serveur, « Réessayer » et « Quitter ». |
| `components/SocialLive.tsx` | L'écran remplace le point d'attente ; la bannière rouge « Diffusion interrompue » reste réservée aux vraies pannes. |

## Les trois règles tenues

1. **Aucun chiffre inventé.** `liveFullOccupancy` ne rend les chiffres que si
   le serveur a donné les DEUX et que la capacité est positive. Sinon l'écran
   dit « Toutes les places sont prises » sans compteur. Un chiffre faux serait
   pire que pas de chiffre.
2. **Jamais une panne convertie en « complet ».** `readLiveRefusal` rend `null`
   dès que le corps ne porte pas de `code` : un 500, un HTML de passerelle ou
   une coupure réseau restent une erreur ordinaire.
3. **Une issue, jamais une impasse.** Réessayer a un sens réel : SAT-2 a mesuré
   que `listParticipants` est exact immédiatement, donc la porte rouvre dès
   qu'une place se libère.

## Preuves

- **26 tests unitaires et DOM** (`tests/liveAccessRefusal.test.ts`,
  `tests/liveFullScreen.test.tsx`) appelant les VRAIES fonctions, avec la
  vraie forme d'erreur de supabase-js (un `context` qui se lit une seule fois,
  comme une `Response`).
- **9 contre-épreuves** : chaque garde a été cassée une par une et vire au
  rouge sur exactement le cas visé ; les quatre fichiers ont été restaurés à
  l'octet près (SHA-256 identiques). Une garde s'est révélée **complaisante**
  et a dû être corrigée : compter les lignes d'un libellé par
  `getClientRects()` sur un `<span>` ne marche pas — un enfant direct de
  conteneur flex est un bloc, il ne rend qu'un rectangle même sur deux lignes.
  Mesure refaite sur une `Range` de texte, contre-épreuve refaite : 3 lignes
  détectées sur ordinateur, 2 sur téléphone.
- **Banc réel : 40 OK / 0 DÉFAUT** — vrai `livekit-server` 1.8.4 (la version
  du VPS), room réellement pleine remplie par de vrais navigateurs, VRAIE
  porte SAT-2 rendant un VRAI 409, chaîne cliente réelle
  (`fetchLiveKitToken` avec la vraie classe `FunctionsHttpError`), vraie
  `index.html` du dépôt, Chromium réel en ordinateur (1280×800) ET téléphone
  (390×844). Prouvé : le 409 devient un refus typé dans le navigateur, les
  chiffres affichés sont ceux que le serveur a comptés (2/2), aucun
  « Connexion… » ne tourne, Réessayer redemande vraiment au serveur, **une
  place libérée fait disparaître l'écran**, et sans chiffres du serveur
  l'écran n'en invente aucun. Boutons 44 px, aucun débordement, contraste
  **17,1:1** mesuré sur les PIXELS RÉELLEMENT PEINTS (le verre est
  semi-transparent : sa couleur effective ne se lit pas dans une feuille de
  style).

## Limites honnêtes

- Le banc sert la VRAIE `index.html`, mais Tailwind est chargé depuis une
  copie locale : le bac à sable ne laisse pas le navigateur sortir. Sans cela
  aucune classe ne serait compilée et les mesures porteraient sur une page
  nue — ce qui s'est produit à la première passe (8 défauts, tous dus à ça).
- L'écran est prouvé sur la chaîne cliente réelle, **pas** contre la fonction
  Edge de production : elle n'est toujours pas déployée. Tant qu'elle ne l'est
  pas, et tant que SAT-1 n'a pas posé de plafond, aucun direct réel ne peut
  rendre ce 409.

---

## Noté pour la santé globale — hors périmètre, non développé

Relevé en passant, sans y toucher, conformément au cadrage de la Direction :

- `public.call_diagnostics` porte déjà des mesures d'exécution réelles (RTT,
  octets envoyés et reçus, état ICE, lecture autorisée) remontées par de
  vrais appareils. C'est la matière la plus solide du dépôt pour un futur
  tableau de santé globale.
- `public.ai_call_log` porte les succès et échecs par fournisseur IA.
- `components/growth/GrowthDashboard` + `get_my_growth_stats` : seul tableau
  de mesures existant aujourd'hui. Il mesure la croissance, pas la santé.
- `live_attendance` et `is_waiting_room_enabled` : deux schémas morts, à
  trancher (brancher ou retirer) dans un autre chantier que celui-ci.

---

# SAT-1 — Le plafond des rooms, posé pour de vrai

## Le constat qui rendait SAT-2 et SAT-3 inertes

La porte (SAT-2) lit `maxParticipants` sur la room. L'écran (SAT-3) affiche le
refus. Mais **personne ne posait jamais de plafond** : `livekit-token` n'appelait
pas `createRoom`, donc LiveKit créait la room tout seul à l'arrivée du premier
participant — sans `maxParticipants`. Et `0`, chez LiveKit, veut dire « aucune
limite ». Les deux briques précédentes étaient donc en place et ne refusaient
personne, quoi qu'il arrive.

Vérifié au banc, avant d'écrire une ligne : une room auto-créée par un arrivant
porte bien `maxParticipants = 0`, et `assessCapacity` répond `no_limit`.

## Six questions mesurées avant toute conception

Sonde `/tmp/lkprobe/sat1/audit.mjs`, exécutée contre les DEUX binaires —
`livekit-server` **1.8.4** (la version du VPS) et **1.13.6** (la cible du dépôt).
Réponses identiques sur les deux.

| | Constat mesuré |
|---|---|
| **Q1** `/metrics` | N'existe QUE si `prometheus_port` est configuré. Sinon **HTTP 404**, sur le port principal comme ailleurs. Le VPS ne l'a pas. |
| **Q1 bis** contenu | `go_sched_gomaxprocs_threads` = nombre de cœurs · `process_cpu_seconds_total` · `livekit_participant_total` · `livekit_room_total`. **Aucun plafond n'est exposé** : LiveKit dit ce que la machine A, jamais ce qu'elle PEUT. |
| **Q2** poser | `createRoom({maxParticipants: 3})` → plafond relu à 3. |
| **Q3** corriger | Un **second** `createRoom({maxParticipants: 7})` sur la même room laisse **3**. Aucune des 13 méthodes du SDK ne modifie `maxParticipants` ensuite. |
| **Q4** room inconnue | `listRooms([nom])` → `[]`. |
| **Q5** charge du nœud | `listRooms()` sans filtre → toutes les rooms + leur occupation. Lisible **sans** prometheus. |
| **Q6** room vide | **Disparaît** (`empty_timeout`) — le plafond meurt avec elle. |

Q3 et Q6 dictent tout le reste : le plafond ne se pose qu'**à la création**, et
il faut le reposer **à chaque renaissance** du direct.

## D'où vient le chiffre — et pourquoi il n'est pas inventé

Le plafond suit la machine par `go_sched_gomaxprocs_threads` : si le VPS passe
de 2 à 8 cœurs, il double sans qu'on retouche une ligne. Restait à savoir ce que
COÛTE une place. Ce chiffre a été **mesuré**, pas supposé —
`/tmp/lkprobe/sat1/cout.cjs`, binaire 1.8.4 exact, vrais navigateurs, topologie
d'un direct (un animateur publie, les autres reçoivent), compteur
`process_cpu_seconds_total` du processus LiveKit :

```
repos (0 participant) .................... 0,0017 cœur
1 animateur + 4 spectateurs .............. 0,0323 cœur
coût marginal d'UN spectateur ............ 0,00767 cœur
→ PLACES PAR CŒUR ........................ 130
```

Première mesure écartée, et pourquoi : elle portait sur **3 personnes publiant
toutes** (0,0127 cœur/personne). Ce n'est pas un direct, c'est une réunion — et
le coût y croît en N². La mesure retenue est celle de la bonne topologie.

**Limites assumées de cette mesure**, et ce sont elles qui justifient la part
réservée : elle est faite en **audio seul** (une piste vidéo coûte nettement
plus), à **5 participants** et non à 500, sur une machine à 4 cœurs, et le nœud
sert aussi les appels 1-à-1, le relais TURN et le système. On n'engage donc que
**la moitié** de ce que la mesure autorise (`PART_ENGAGEE = 0.5`). Ce n'est pas
une marge de confort : c'est l'écart assumé entre ce qui a pu être mesuré ici et
ce que la vraie machine porte. La même sonde, lancée sur le VPS, donne le
chiffre de la vraie machine.

## La règle

```
plafond = ⌊ cœurs × 130 × 0,5 ⌋ − participants déjà présents sur le nœud
```

- **cœurs** : mesuré en direct sur `/metrics`. Suit la machine.
- **occupation** : mesurée en direct sur `listRooms()`. Suit la charge.
- **jamais `null` → jamais de plafond.** Pas d'URL de métriques, métriques
  illisibles, machine inconnue, création refusée : dans chacun de ces cas la
  room naît comme avant SAT-1 et la porte laisse entrer. On ne devine jamais la
  taille d'une machine.
- **jamais 0.** Le piège est mortel : `maxParticipants: 0` signifie « aucune
  limite » chez LiveKit. Un nœud saturé qui calculerait 0 poserait donc
  exactement l'inverse de ce qu'il croit poser. Plancher à 1, testé.

Le retard de `numParticipants` (1-3 s sur 1.8.4, 3-6 s sur 1.13.6, mesuré à
SAT-2) est sans conséquence ici : il s'agit d'une charge de nœud à l'échelle de
la minute, pas d'une ruée sur une seule room. C'est précisément pourquoi la
PORTE, elle, continue de compter sur `listParticipants`.

## Preuves

**Banc réel `preuve-sat1.cjs` — 21 OK / 0 DÉFAUT sur 1.8.4 ET sur 1.13.6.**
Il exécute la **vraie** fonction `poseRoomCeiling` du dépôt (transpilée depuis
`nodeCapacity.ts`, jamais recopiée) et la **vraie** porte `capacityGate.ts`,
contre un vrai serveur, avec de vrais navigateurs.

Prouvé : sans SAT-1 une room porte `0` · sans URL de métriques aucun plafond
n'est posé et aucune room fantôme n'est créée · le plafond posé vaut exactement
ce que la machine mesurée impose (4 cœurs → 260) · la room le porte réellement ·
un second appel ne le change pas · trois vraies personnes entrent sans gêne · un
second direct hérite de 257 = 260 − 3 (l'écart est exactement la charge mesurée) ·
la room vide disparaît et le plafond se repose à la renaissance.

**27 tests unitaires** sur la vraie fonction importée depuis la fonction Edge,
avec un extrait RÉEL de `/metrics` 1.8.4 comme donnée d'entrée.

**8 contre-épreuves**, fichier restauré à l'empreinte SHA-256 identique :
plafond pouvant tomber à 0 · machine devinée quand `/metrics` est muet · charge
du nœud non retranchée · plafond posé sans URL · échec de création présenté
comme un succès · machine engagée en entier · **CP7 : une garde trouvée
COMPLAISANTE et corrigée** — le test « métrique au nom voisin » n'essayait qu'un
nom SUFFIXÉ (`..._threads_total`), que même une expression sans ancre rejette ;
il restait vert alors que l'ancre venait d'être retirée. Le vrai risque est un
nom PRÉFIXÉ (`livekit_go_sched_gomaxprocs_threads 99` → 99 cœurs pour une
machine qui n'en a pas). Test réécrit, CP7-bis vire alors au rouge, seul ·
**CP8 : contre-épreuve du BANC lui-même** — plafond annoncé mais jamais posé →
le banc le voit (`maxParticipants` NaN), il n'est donc pas complaisant.

`tsc` 0 · `vitest` 924/924 (67 fichiers) · `npm run build` propre.

## Ce qui reste, et c'est dit sans détour

**Sur le VPS, SAT-1 ne pose aucun plafond aujourd'hui**, parce que
`prometheus_port` n'y est pas configuré — la machine ne dit pas sa taille, on ne
l'invente pas. Quatre commandes suffisent à l'activer
(`deploy/livekit/README.md`, section SAT-1) : recharger LiveKit avec la
configuration déjà présente dans le dépôt, publier `/metrics` derrière un jeton
au reverse-proxy, et poser `LIVE_NODE_METRICS_URL` sur la fonction Edge. C'est
SAT-1b, et c'est une action SSH.

Tant que ce n'est pas fait — et tant que la fonction Edge n'est pas déployée —
rien ne change pour personne : la porte reste ouverte, exactement comme avant.

Ce que le banc **ne peut pas** faire ici : remplir les 260 places calculées sur
cette machine à 4 cœurs. Le refus À CE PLAFOND-LÀ est donc prouvé par
composition — le plafond réellement posé est injecté dans la vraie porte SAT-2,
qui refuse avec les bons chiffres — et non par 260 navigateurs.
