# Déploiement LiveKit Server — VPS Hostinger (LOOP 15/16)

Ce dossier contient tout ce qui est nécessaire pour faire tourner en
production le même serveur LiveKit qui sert déjà de cible de développement
(`livekit-server --dev`, LOOP 01/16) — architecture "ports & adapters" :
aucun code applicatif ne change, seule une ligne de configuration change
dans Supabase une fois ce serveur en ligne (voir étape 4 ci-dessous).

**Développé et validé localement dans ce sandbox** (syntaxe `docker
compose`, cohérence des variables d'environnement, schéma de configuration
LiveKit) — **jamais exécuté contre le VPS réel**, faute d'accès SSH/
identifiants dans cet environnement. C'est le seul point d'arrêt de toute
la mission LIVE : tout le reste a été développé et testé de bout en bout.

## Ce qu'il faut pour aller plus loin (à fournir)

1. Un accès SSH au VPS Hostinger (utilisateur + clé ou mot de passe).
2. Un nom de domaine (ou sous-domaine) pointant vers l'IP publique du VPS —
   ex. `live.lemondeavous.com` avec un enregistrement DNS de type A.

Sans ces deux éléments, aucune des étapes ci-dessous ne peut être
appliquée depuis cet environnement — mais tous les fichiers sont prêts.

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
