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
| SAT-4 — détecter un blocage réel | **Partiellement** — les compteurs média sont côté client ; une sonde HTTP ne suffit pas |
| SAT-5 — récupération automatique | **Partiellement** — tout n'est pas récupérable sans redémarrer le serveur |
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
- **SAT-3** : l'écran côté client quand `409 live_full` arrive — il s'appuiera
  sur `code`, jamais sur un message destiné à un humain.
- **SAT-1** : poser réellement `maxParticipants` sur la room. Sans lui, cette
  porte est en place mais ne refusera jamais personne, faute de plafond.

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
