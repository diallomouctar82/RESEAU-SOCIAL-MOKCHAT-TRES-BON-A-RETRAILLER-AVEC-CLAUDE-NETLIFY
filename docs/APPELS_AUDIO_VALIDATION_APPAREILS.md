# Appels audio — validation sur vrais appareils (mission AU, LOOP 1)

Ce document accompagne le correctif de l'audio **à sens unique** dans les
appels 1‑à‑1 de MokNet (messagerie → « Appel audio » / « Appel vidéo »). Il
donne : (1) ce qui a été corrigé et pourquoi, (2) ce que l'application
mesure et journalise désormais pendant un appel, (3) le protocole exact à
dérouler sur **deux vrais appareils** et les éléments à relever pour prouver
que les deux interlocuteurs s'entendent.

> Limite honnête : le bac à sable de développement ne contient ni téléphone
> ni micro physique. La chaîne complète a été prouvée sur un banc réel (deux
> navigateurs Chromium, serveur LiveKit réel, voix réelles injectées, son
> reçu enregistré puis transcrit par la passerelle IA) ; la preuve sur vrais
> appareils est celle décrite en §3, à relever par une personne.

## 1. Causes réelles d'un audio à sens unique (reproduites, puis corrigées)

| # | Cause reproduite au banc | Correctif | Où |
|---|---|---|---|
| B | Deux appareils du même compte (téléphone + ordinateur) se pré‑connectent pendant la sonnerie avec la **même identité LiveKit** (`profiles.id`). Le serveur n'admet qu'une connexion par identité : il évince l'un des deux. Décrocher sur l'appareil évincé laissait « Connexion… », 0 octet dans les deux sens, aucune relance. | Identité **par appareil** dans les rooms d'appel : `<userId>::<deviceId>` (identifiant aléatoire propre au navigateur, `localStorage.moknet_call_device_id`). Le LIVE garde `profiles.id`. | `supabase/functions/livekit-token/index.ts` (v4 déployée), `services/calls/callDevice.ts`, `hooks/useLiveTransport.ts` (`deviceId`) |
| B′ | La demande différée de micro (décroché) était **perdue** quand la tentative de connexion en vol échouait ensuite : une seule demande de jeton, jamais de seconde tentative. | Relance automatique de la ligne d'un **appel** (jeton + connexion, délai croissant, 3 essais) quand la connexion échoue ou tombe alors que du média est voulu ; « Réessayer » reste disponible ensuite. | `hooks/useLiveTransport.ts` (`scheduleCallRetry`) |
| C/D | Micro **refusé** d'un côté : l'autre n'entend rien, le message était caché sous la barre de commandes, aucun moyen de réessayer, et le correspondant ne pouvait pas distinguer « il se tait » de « son micro ne marche pas ». | Bannière rouge en haut de l'écran (« *Nom* ne vous entend pas — micro indisponible », cause en français) + bouton **« Réessayer le micro »** exécuté dans le geste utilisateur ; message `media` envoyé au correspondant par le canal de données (`on` / `off` / `unavailable` + raison) et affiché chez lui. | `components/chat/ChatCallModal.tsx`, `services/calls/callAudio.ts`, `services/messaging/speechLanguage.ts` |
| E | En appel **vidéo**, une caméra en échec (permission, poste sans webcam) bloquait la publication du micro (publication séquentielle, une seule erreur). | Micro publié **d'abord**, caméra ensuite, chaque média jugé séparément ; seule l'absence de micro est un échec pour l'appel. | `hooks/useLiveTransport.ts` (`publishWanted`) |
| F | Appelant dont la capture avait échoué pendant la sonnerie : jamais retentée au décroché (« déjà connecté = rien à faire »). | Au décroché, si le micro n'est **pas réellement publié** (événement du transport), il est (re)demandé quel que soit le rôle. | `ChatCallModal.tsx` (effet d'acceptation, `localAudioPublished`) |
| G | « Couper le micro » pendant la connexion n'était pas appliqué à la publication qui suivait. | Souhait mémorisé et appliqué après publication. | `useLiveTransport.ts` (`micWishRef`) |
| H | Piste micro terminée par le système (appel téléphonique, périphérique débranché) : jamais republiée, silence sans explication. | Republication bornée (2 par connexion), sinon message et « Réessayer le micro ». | `liveKitTransportProvider.ts` (`TrackEvent.Ended`), hook |
| I | Côté appelant, la lecture du son distant dépendait du seul signal `call_accepted` (broadcast éphémère). Signal perdu = l'appelé m'entend, je ne l'entends jamais. | Le **média réel prime** : la voix de l'appelé qui arrive pendant « sonnerie » passe l'appel en connecté (retour d'appel coupé, lecture démarrée). | `ChatCallModal.tsx` (`onRemoteMediaStarted`), `MoocChatFloating.tsx` |
| J | Le « correspondant » était `remoteParticipants[0]`, parfois un second appareil silencieux du même compte. | Le correspondant est celui qui **publie** du média. | `callAudio.ts` (`pickRemoteForCall`) |

## 2. Ce que l'application mesure et journalise pendant un appel

Toutes les 5 s pendant un appel accepté, l'écran interroge les **compteurs
WebRTC réels** (octets envoyés par ma piste micro, octets reçus de la piste
micro du correspondant, lecture autorisée ou non par le navigateur) et juge
chaque sens séparément — jamais une estimation :

- **À l'écran** (en bas à droite de l'écran d'appel) : deux lignes,
  `Votre voix part` / `Vous recevez sa voix` en vert quand les octets
  progressent ; `Votre voix ne part pas`, `Rien n’arrive de sa voix`,
  `Son bloqué par le navigateur`, `Micro non publié`, `Micro coupé` sinon.
  Ce diagnostic ne s'estompe pas tant qu'un sens est en défaut.
- **En console** (à relever pour un rapport) : une ligne par mesure

  ```
  [appel] média role=appelé envoi=ok réception=ok micro=publié octetsEnvoyés=48213 pistesDistantes=1 octetsReçus=51907 lecture=ok
  ```

  `envoi` ∈ ok | muted | stalled | absent | unknown ; `réception` ∈ ok |
  blocked | stalled | absent | unknown (`unknown` = première mesure ou
  compteur non fourni par le navigateur, jamais un verdict inventé).
- Autres lignes utiles : `[appel] latence` (décroché → transport → première
  voix), `[appel] média ligne perdue (…) — nouvelle tentative n/3`,
  `[appel] média piste micro terminée — republication`,
  `[appel] média voix du correspondant reçue pendant la sonnerie : signal
  d’acceptation perdu`.

## 3. Protocole de validation sur deux vrais appareils

Matériel : deux appareils distincts (par ex. un téléphone Android/iOS et un
ordinateur), deux comptes MokNet amis l'un de l'autre, connectés sur
`https://moknet.net`. Écouteurs recommandés sur au moins un appareil (évite
l'écho acoustique, qui n'est pas un défaut de transport).

1. **Appel audio A → B.** Sur A, ouvrir la conversation avec B, « Appel
   audio ». Sur B, décrocher.
   - Attendu : sonnerie coupée des deux côtés ; badge « Connecté en … » ;
     après ~7 s le diagnostic affiche `Votre voix part` et `Vous recevez sa
     voix` **sur les deux appareils**.
   - Chacun parle 10 s : l'autre l'entend. Si un appareil affiche « Son
     bloqué par le navigateur », toucher **« Activer le son »**.
2. **Micro refusé.** Sur B, refuser le micro (réglages du site) puis
   rappeler. Attendu sur B : bannière rouge « A ne vous entend pas — micro
   indisponible » + « Réessayer le micro » ; sur A : « B n’a pas de micro
   actif (…) ». Autoriser le micro sur B, toucher « Réessayer le micro » :
   les deux diagnostics passent au vert, A entend B.
3. **Deux appareils pour le même compte.** B connecté sur son téléphone
   **et** son ordinateur. A appelle B : les deux sonnent. Décrocher sur
   l'ordinateur, puis, sur un second appel, sur le téléphone. Attendu : les
   deux fois, audio dans les deux sens (diagnostics verts) ; l'autre
   appareil cesse de sonner immédiatement.
4. **Appel vidéo depuis un poste sans caméra** (ou caméra refusée).
   Attendu : la voix passe dans les deux sens ; la caméra absente est
   signalée mais ne bloque pas le micro.
5. **Coupure réseau courte** (mode avion 5 s sur B pendant l'appel).
   Attendu : « Reconnexion… », puis retour du son ; en cas d'échec définitif,
   message + bouton de relance, jamais un écran figé.
6. **Verrouillage / changement d'application** sur le téléphone pendant
   l'appel, puis retour. Attendu : le son reprend (republication
   automatique du micro si le système l'a coupé), sinon bannière « Réessayer
   le micro ».

À relever pour chaque scénario : capture d'écran des deux appareils
montrant le diagnostic, et les lignes `[appel] média …` de la console
(desktop : outils de développement ; Android : `chrome://inspect` ; iOS :
Safari → Développement). Un scénario est **validé** uniquement si les deux
diagnostics sont verts et que chaque personne a entendu l'autre.

## 4. Ce qui reste hors de portée du code de l'application

- **Routage audio iOS (écouteur / haut‑parleur)** : choisi par le système ;
  le web ne peut pas forcer la sortie. Si le son sort du haut‑parleur
  d'oreille, c'est un réglage de l'appareil, pas une absence d'audio.
- **Réseaux qui bloquent l'UDP** : le serveur LiveKit de production expose
  TURN en UDP (3478) et le média en UDP 50000‑50100 / TCP 7881. Derrière un
  pare‑feu qui n'autorise que HTTPS, l'appel peut échouer dans les deux
  sens ; l'ajout de TURN/TLS (443) côté serveur (`deploy/livekit`) est une
  action d'infrastructure sur le VPS, à faire par son administrateur.
- **Deux appareils physiques** : non disponibles dans l'environnement de
  développement ; le protocole ci‑dessus est la preuve à apporter.
