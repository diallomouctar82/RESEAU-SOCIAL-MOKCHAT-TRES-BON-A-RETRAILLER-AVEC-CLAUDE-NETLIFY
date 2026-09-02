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
