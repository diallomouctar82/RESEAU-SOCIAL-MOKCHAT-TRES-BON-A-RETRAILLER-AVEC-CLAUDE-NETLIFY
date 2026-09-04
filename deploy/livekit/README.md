# Déploiement LiveKit Server — VPS Hostinger (LOOP 15/16)

Ce dossier contient tout ce qui est nécessaire pour faire tourner en
production le même serveur LiveKit qui sert déjà de cible de développement
(`livekit-server --dev`, LOOP 01/16) — architecture "ports & adapters" :
aucun code applicatif ne change, seule une ligne de configuration change
dans Supabase une fois ce serveur en ligne (voir étape 4 ci-dessous).

**DÉPLOYÉ EN PRODUCTION le 30/08/2026** sur le VPS Hostinger de
l'utilisateur (qui a exécuté lui-même chaque commande, les identifiants SSH
n'ayant jamais été partagés) : `https://live.moknet.net`. Deux écarts par
rapport à la procédure d'origine, appliqués sur place : (1) Caddy retiré —
un site de production existant occupait déjà 80/443, TLS/reverse-proxy
délégués à CloudPanel/nginx vers LiveKit sur `127.0.0.1:7880` ; (2) plage
TURN bornée à `30000-30100` (la plage par défaut de 10 001 ports faisait
échouer le démarrage du conteneur — timeout du userland-proxy Docker).
Configuration `production` active dans `live_transport_config` (clé via
Vault) et `LIVE_TRANSPORT_ENVIRONMENT=production` posé sur l'Edge Function
`livekit-token`.

**Vérifié depuis le sandbox (30/08/2026, preuves conservées)** :
`GET /` → 200 nginx ; `/rtc/validate` avec un jeton signé par la clé réelle
(HMAC calculé en SQL depuis Vault, secret jamais sorti de la base) → 200 ;
jeton bidon → 401 « invalid authorization token » ; et un **join de room
réel au niveau signalisation** — WebSocket sortant Node → `wss://live.moknet.net/rtc`
ouvert, JoinResponse protobuf reçue, fermeture propre 1000. **Reste côté
utilisateur** : la preuve d'usage média à DEUX appareils réels (le trafic
UDP/ICE n'est pas établissable depuis ce sandbox).

## Étapes (une fois l'accès SSH fourni)

### 1. Prérequis sur le VPS
Docker + le plugin `docker compose` (`docker compose version` doit
répondre). Ports 80, 443, 7881/tcp, 50000-50100/udp et 3478/udp ouverts
dans le pare-feu du VPS.

### 2. Copier ce dossier sur le VPS
```bash
scp -r deploy/livekit utilisateur@vps:/opt/moknet-livekit
ssh utilisateur@vps
cd /opt/moknet-livekit
```

### 3. Configurer et déployer
```bash
cp .env.production.example .env.production
nano .env.production   # LIVEKIT_DOMAIN, LIVEKIT_API_KEY, LIVEKIT_API_SECRET (générés, jamais recopiés d'un exemple)
./deploy.sh
```
`deploy.sh` refuse de démarrer si les valeurs d'exemple n'ont pas été
remplacées — évite un serveur LiveKit exposé publiquement avec des
identifiants connus de tous.

### 4. Brancher MokNet sur ce serveur (aucune modification de code)
Une seule ligne à ajouter dans la table Supabase `live_transport_config`
(projet `rqciahtpixdjbyoajomg`), avec les mêmes clés que celles mises dans
`.env.production` :
```sql
-- Remplacer les 3 valeurs entre <> par les vraies (domaine + clés du .env.production) :
with secret as (
  select vault.create_secret('<LIVEKIT_API_SECRET>', 'livekit-production-secret') as id
)
insert into public.live_transport_config (provider, server_url, api_key, vault_secret_id, environment, is_active)
select 'livekit', 'wss://<LIVEKIT_DOMAIN>', '<LIVEKIT_API_KEY>', secret.id, 'production', true
from secret;
```
Puis activer la bascule (aucun redéploiement de code nécessaire, juste une
variable d'environnement sur l'Edge Function déjà déployée) :
```bash
supabase secrets set LIVE_TRANSPORT_ENVIRONMENT=production --project-ref rqciahtpixdjbyoajomg
```
(ou l'équivalent depuis le dashboard Supabase → Edge Functions → Secrets).

À partir de ce moment, `livekit-token` (déjà déployée, code inchangé — voir
`supabase/functions/livekit-token/index.ts`) lit automatiquement cette
nouvelle ligne au lieu de la ligne `development`, et tous les nouveaux LIVE
utilisent le VPS de production.

### 5. Vérifier
Ouvrir un LIVE réel depuis deux navigateurs/appareils différents et
confirmer que la vidéo/l'audio passent bien par le nouveau serveur (pas de
changement visible côté interface — c'est le but de cette architecture).

## Ce qui est volontairement hors de ce déploiement minimal

- **TURN over TLS (port 5349)** : seul le TURN UDP (port 3478) est activé
  ici — suffisant pour la grande majorité des réseaux. Le TURN/TLS demande
  de partager le certificat obtenu par Caddy avec LiveKit (mécanisme non
  standardisé entre les deux images officielles) ; à ajouter plus tard
  seulement si des participants sur des réseaux d'entreprise très
  restrictifs (bloquant tout UDP) sont réellement rencontrés en usage réel.
- **Haute disponibilité / plusieurs nœuds LiveKit** : ce déploiement est un
  seul serveur — suffisant pour démarrer en production, migration vers
  LiveKit Cloud ou un cluster multi-nœuds possible plus tard sans changer
  le code applicatif (même architecture "ports & adapters").
- **Sauvegarde automatisée de Redis** : le volume `redis-data` persiste
  entre redémarrages du conteneur, mais aucune sauvegarde externe n'est
  configurée (l'état Redis de LiveKit est reconstructible : rooms/tokens
  actifs uniquement, pas de données MokNet — la perte de ce volume ne perd
  aucune donnée applicative, seulement les sessions LIVE en cours).

---

## Version du serveur et version du SDK (AU-14)

**Pourquoi.** Le serveur déployé tourne en **1.8.4** (protocole 15) alors que le
site utilisait `livekit-client` **2.22.1** (protocole 17). Les rapports de
diagnostic de deux vrais appareils (`public.call_diagnostics`, 02/09/2026) le
disent explicitement, des deux côtés :

```
connected to Livekit Server ... version: 1.8.4, protocol: 15
Initial connection failed: v1 RTC path not found.
                           Consider upgrading your LiveKit server version
... puis toutes les ~16 s :
NegotiationError: negotiation timed out
```

À chaque expiration, **toutes** les pistes sont retirées, la ligne se
rétablit complètement, le micro est republié puis dépublié — et le compteur
`bytesSent` mesuré ne quitte jamais `null` : **la voix ne part jamais**. C'est
la cause unique des trois symptômes signalés (son absent d'un côté, son qui se
coupe et revient, connexion instable).

**Mesuré, pas supposé** — le binaire `livekit-server` **1.8.4 exact** (même
version que le VPS) a été lancé en local et chaque version du SDK y a publié un
micro factice pendant 50 s, en comptant les expirations de négociation :

| `livekit-client` | expirations / 50 s | rétablissements | octets envoyés |
|---|---|---|---|
| 2.22.1 (était en production) | **3** | 2 | **null** |
| 2.21.0 · 2.20.2 · 2.19.2 · 2.18.10 | 3 | 2 | null |
| **2.17.3** | **0** | 0 | **322 795** |
| 2.13.8 · 2.11.4 | 0 | 0 | ~150 000 |

Contre le serveur **1.13.6** (cible de montée de version), 2.17.3 **et** 2.22.1
négocient tous deux sans expiration.

**Ce qui est fait côté site, sans action sur le VPS** : `package.json`
épingle `livekit-client` à **2.17.3** exactement (dernière version qui parle au
serveur 1.8.4 sans expirer) — les appels fonctionnent avec le serveur tel qu'il
est déployé aujourd'hui, et continueront de fonctionner après sa montée de
version. Un test (`tests/livekitClientPin.test.ts`) empêche une remontée
accidentelle du SDK au-delà de 2.17.x ; toute montée future du SDK se décide
APRÈS vérification de la version du serveur réellement déployé.

**Validé en conditions réelles le 02/09/2026** : appel entre deux téléphones
réels à travers `live.moknet.net` (serveur 1.8.4 + SDK 2.17.3) — l'appel
passe, les deux personnes parlent et s'entendent. C'est la preuve d'usage
réel du média (UDP/ICE/TURN) de ce déploiement que le bac à sable ne pouvait
pas produire.

**Procédure de montée du serveur (recommandée, plus urgente : à exécuter sur
le VPS, dans le dossier du déploiement LiveKit).** Les quatre commandes sont
indépendantes du reste de votre configuration : elles ne changent QUE la
version de l'image.

```bash
# 1. Où en est-on aujourd'hui ?
docker compose ps
docker compose exec livekit /livekit-server --version   # attendu avant : 1.8.4

# 2. Épingler la nouvelle version (remplace l'étiquette flottante v1.8)
sed -i 's|livekit/livekit-server:v1\.8[^ ]*|livekit/livekit-server:v1.13.6|' docker-compose.yml
grep -n 'livekit-server:' docker-compose.yml    # doit afficher v1.13.6

# 3. Récupérer l'image et redémarrer LE SEUL service livekit
docker compose pull livekit
docker compose up -d livekit

# 4. Vérifier que le serveur répond bien dans la nouvelle version
docker compose exec livekit /livekit-server --version   # attendu après : 1.13.6
curl -sS -o /dev/null -w '%{http_code}\n' https://live.moknet.net/    # attendu : 200
docker compose logs --tail=40 livekit
```

**Ce qui ne change pas** : les clés `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
(donc rien à retoucher côté Supabase `live_transport_config` ni côté Vault), le
domaine, le reverse-proxy CloudPanel/nginx, la plage TURN, le site existant.
Aucune modification de code applicatif n'est nécessaire : l'architecture
ports & adapters fait que seule cette image bouge.

**Retour arrière** si quoi que ce soit se passe mal : remettre `v1.8.4` à la
ligne `image:` puis `docker compose up -d livekit`. L'état d'avant est
récupérable en une commande.

**Comment savoir que c'est réglé** — sans lire un journal : passez un appel,
et regardez l'écran d'appel. Avant, le diagnostic en bas à droite affichait
« Micro non publié » ; après, il doit afficher « Votre voix part » et
« Vous recevez sa voix », et le bandeau ambre « La ligne du serveur d'appel se
rétablit en boucle » ne doit jamais apparaître. Le rapport complet reste écrit
côté serveur dans `public.call_diagnostics` à chaque appel.

---

## SAT-1 — Activer le plafond automatique des directs

**Ce que cela change.** Aujourd'hui, aucune room LiveKit ne porte de plafond :
LiveKit la crée tout seul à l'arrivée du premier participant, sans
`maxParticipants`, et `0` signifie « aucune limite ». La porte SAT-2 et l'écran
SAT-3 sont donc en place mais **ne refusent personne**. SAT-1 pose un plafond
réel — calculé à partir du nombre de cœurs de CETTE machine — mais il lui faut
lire ce nombre, et il n'existe qu'un seul endroit qui le donne : l'endpoint
Prometheus de LiveKit.

**Mesuré au banc, pas supposé** (binaires 1.8.4 du VPS et 1.13.6 de la cible) :

| Question | Constat |
|---|---|
| `/metrics` sans `prometheus_port` | **HTTP 404**, sur le port principal comme ailleurs |
| `/metrics` avec `prometheus_port` | HTTP 200 · `go_sched_gomaxprocs_threads` = nombre de cœurs |
| Contenu | agrégats + compteurs Go · **zéro nom de room, zéro identité** |
| `createRoom({maxParticipants})` | pose réellement le plafond |
| un SECOND `createRoom` | **ne change plus rien** — le plafond ne se pose qu'à la création |
| room vide | **disparaît** (`empty_timeout`) → le plafond se repose à la renaissance |

La règle appliquée par `nodeCapacity.ts` :

```
plafond = plancher( cœurs × 130 × 0,5 ) − participants déjà présents sur le nœud
```

`130` = places par cœur, **mesuré** (0,00767 cœur par spectateur en audio, dans
la topologie d'un direct). `0,5` = la moitié de la machine seulement est
engagée — l'écart assumé entre ce que le banc a pu mesurer et ce que le nœud
porte réellement (vidéo, appels, TURN, système). Plancher absolu : **1, jamais
0** (0 voudrait dire « aucune limite »).

| `nproc` | Plafond attendu sur un nœud vide |
|---|---|
| 2 | 130 |
| 4 | 260 |
| 8 | 520 |

---

## SAT-1b — Plan d'activation en production

Rédigé à la demande de la Direction (4 septembre 2026), à partir des fichiers
réels et de la fonction Edge réellement en ligne — pas de mémoire.

### La propriété qui rend ce plan sûr

Les quatre premières étapes **ne changent rien au comportement**. Chacune est
inerte tant que la suivante n'est pas faite :

| # | Étape | Change le comportement ? | Retour arrière | Durée |
|---|---|---|---|---|
| 1 | Fusionner la PR #69 | **Non** — l'écran « complet » existe, mais aucun 409 ne peut être émis | `git revert` + push | ~3 min |
| 2 | Déployer `livekit-token` | **Non** — la porte lit `maxParticipants = 0` partout, ne refuse personne | redéployer depuis `main` | ~2 min |
| 3 | `prometheus_port` sur le VPS | **Non** — `/metrics` existe, personne ne le lit | commenter + relancer | ~1 min |
| 4 | Publier `/metrics` derrière un jeton | **Non** — joignable, mais la fonction n'a pas l'adresse | retirer le bloc nginx | ~1 min |
| 5 | Poser `LIVE_NODE_METRICS_URL` | **OUI — le seul** | **supprimer le secret** | **~30 s** |

Le seul geste qui engage quoi que ce soit est aussi le plus rapide à défaire.
On peut s'arrêter après n'importe quelle étape sans laisser d'état bancal.

### Étape 1 — Fusionner la PR #69

Le code client part sur `moknet.net`. L'écran « Ce direct est complet » entre
dans le bundle, mais ne peut jamais s'afficher : rien ne produit encore de
refus.

Sur GitHub : PR #69 → *Ready for review* → *Squash and merge*.

**Preuve constatable** — le bundle servi change :

```bash
curl -s https://moknet.net/ | grep -o 'index-[A-Za-z0-9_-]*\.js'
```

Puis ouvrir `moknet.net` : tout doit fonctionner exactement comme avant.

**Risque** : celui d'un déploiement front ordinaire (Green Gate vert, 924
tests, aucun changement de comportement attendu).

**Retour arrière** :

```bash
git revert <sha-du-commit-de-squash> && git push origin main
```

*Squash and merge* dépose sur `main` un commit ordinaire à **un seul parent** :
c'est bien son empreinte qu'on annule, pas celle d'un commit de fusion. Le
`-m 1` des retours arrière de fusion est donc **inutile ici** — vérifié sur le
`git` de ce dépôt (2.43) : il est accepté sans erreur sur un commit à un parent,
mais il n'apporte rien. Il ne redeviendrait nécessaire qu'avec une fusion faite
en *Create a merge commit*.

### Étape 2 — Déployer la fonction Edge `livekit-token`

La porte SAT-2 et le calcul SAT-1 arrivent sur le serveur, **toujours
inertes** : sans `LIVE_NODE_METRICS_URL`, `poseRoomCeiling` rend `null`, aucune
room ne reçoit de plafond, la porte lit `0` et laisse entrer.

```bash
supabase functions deploy livekit-token --project-ref rqciahtpixdjbyoajomg
```

**Preuve constatable** :

1. Tableau de bord Supabase → Edge Functions → `livekit-token` : la version
   passe de **6 à 7**, l'horodatage change.
2. **Tester un appel réel entre deux téléphones immédiatement après.**

**Risque — le plus élevé du plan.** Cette fonction émet les jetons des directs
**et des appels**. Le chemin appel (`call-…`) n'est pas touché par le code SAT
(le plafond et la porte ne vivent que dans la branche « direct »), mais le
fichier a été restructuré : d'où le test d'appel immédiat.

**Retour arrière — vérifié.** `main` contient exactement les 2 fichiers
déployés aujourd'hui (`index.ts`, `supabase.ts`) ; la branche en a 4
(+ `nodeCapacity.ts`, `capacityGate.ts`). Donc :

```bash
git checkout main
supabase functions deploy livekit-token --project-ref rqciahtpixdjbyoajomg
```

Supabase ne rembobine pas : ce redéploiement crée une version **suivante**
dont le contenu est celui d'aujourd'hui.

### Étape 3 — Activer les métriques sur le VPS

Le `docker-compose.yml` de ce dossier porte déjà `prometheus_port: 6789` et
publie ce port **sur la boucle locale uniquement** (`127.0.0.1:6789`).

```bash
cd /opt/moknet-livekit
docker compose up -d livekit
curl -s http://127.0.0.1:6789/metrics | grep gomaxprocs
nproc                                    # pour recouper soi-même
```

**Preuve constatable** : la ligne `go_sched_gomaxprocs_threads N` doit afficher
**le même N que `nproc`**.

**⚠️ Risque réel.** `docker compose up -d livekit` **recrée le conteneur** :
tous les appels et directs en cours **tombent**. À faire dans une fenêtre
calme. C'est le seul risque de coupure du plan, et il tient au redémarrage du
serveur média, pas à SAT-1.

**Retour arrière** : commenter `prometheus_port: 6789`, relancer
`docker compose up -d livekit` (nouvelle coupure).

### Étape 4 — Publier `/metrics`, derrière un jeton DANS LE CHEMIN

> **Correction du 4 septembre 2026.** Une version antérieure de ce README
> proposait ici un filtrage par en-tête HTTP (`X-Moknet-Metrics`). **Cela ne
> peut pas fonctionner** : la fonction Edge fait un `fetch(metricsUrl)` nu,
> sans aucun en-tête (`index.ts`, `poserPlafond`). Le jeton doit donc vivre
> dans le CHEMIN. La recette ci-dessous est la seule compatible avec le code.

La fonction Edge tourne chez Supabase : elle doit joindre cet endpoint depuis
Internet. **LiveKit ne protège pas `/metrics`** — c'est au reverse-proxy de le
faire. Sur ce VPS, le proxy est CloudPanel/nginx (Caddy a été retiré au profit
du site déjà en place, voir plus haut).

```bash
openssl rand -hex 24        # génère le jeton — le noter
```

Dans le vhost nginx de `live.moknet.net` :

```nginx
location = /m-LE_JETON_GENERE {
    proxy_pass http://127.0.0.1:6789/metrics;
}
```

```bash
systemctl reload nginx      # ou clpctl
```

**Preuve constatable**, depuis n'importe quelle machine :

```bash
curl -s https://live.moknet.net/m-LE_JETON | grep gomaxprocs            # la ligne, même N
curl -s -o /dev/null -w '%{http_code}\n' https://live.moknet.net/m-faux # 404
```

**Risque** : si le chemin fuite, quelqu'un lit la charge du nœud. **Aucune
donnée personnelle** — étiquettes vérifiées une par une au banc : `code,
direction, le, method, node_id, node_type, quantile, service, status,
transmission, version`. Zéro nom de room, zéro identité de participant.

**Retour arrière** : retirer le bloc `location`, recharger nginx. Pas de
coupure.

### Étape 5 — Le seul geste qui engage : poser l'adresse

À partir de cet instant, **chaque nouveau direct reçoit un plafond réel**.

Tableau de bord Supabase → Edge Functions → Secrets :

```
LIVE_NODE_METRICS_URL = https://live.moknet.net/m-LE_JETON
```

**Preuve constatable — et recalculable.** Ouvrir un direct, puis Supabase →
Edge Functions → `livekit-token` → **Logs** :

```
livekit-token: plafond 260 posé sur <nom-de-la-room>
```

> **Correction du 4 septembre 2026.** Une version antérieure de ce README
> annonçait `plafond N posé sur <room> (C cœurs)`. Le code n'écrit **pas** le
> nombre de cœurs. La ligne réelle est celle ci-dessus.

Le nombre affiché doit correspondre à la formule du haut de section appliquée
au `nproc` du VPS. S'ils concordent, la chaîne entière est prouvée de bout en
bout.

**Retour arrière — 30 secondes** : supprimer le secret. Le prochain direct créé
n'a plus de plafond. Les directs déjà ouverts gardent celui qu'ils ont reçu
jusqu'à leur fin — le plafond ne se pose qu'à la création.

### Ce qui n'est PAS constatable à la main

**Le refus à 260 personnes n'est pas observable sans 260 navigateurs.**

- Le plafond est réellement posé, avec le bon nombre → **constatable** (journal
  + `nproc`).
- La porte refuse réellement quand la room est pleine → prouvé au banc contre
  le binaire **1.8.4 exact du VPS**, avec un vrai 409 (18/18 puis 40/40).
- La jonction des deux **à 260 précisément** → jamais démontrée à l'écran.

Pour la voir : déployer temporairement une version à part engagée abaissée
(plafond 2 ou 3), ouvrir un direct depuis deux appareils, un troisième reçoit
l'écran « complet », puis restaurer. C'est un déploiement de production
supplémentaire — sur demande explicite de la Direction uniquement.

### Deux points de vigilance

1. **Les directs déjà en cours au moment de l'étape 5 restent sans plafond**
   jusqu'à leur fin (contrainte LiveKit mesurée : un second `createRoom` ne
   change rien).
2. **+2 appels réseau à l'ouverture d'un direct** (`/metrics`, `listRooms`),
   chacun plafonné à 1,5 s (`ROOM_SERVICE_TIMEOUT_MS`). Au pire +3 s pour
   ouvrir un direct. Les appels ne sont pas concernés.

### Ce qui se passe si vous ne faites rien

Rien ne casse. `LIVE_NODE_METRICS_URL` absente → aucun plafond posé → la porte
SAT-2 laisse entrer tout le monde, exactement comme aujourd'hui. C'est le
comportement voulu : **on ne devine jamais la taille d'une machine.**
