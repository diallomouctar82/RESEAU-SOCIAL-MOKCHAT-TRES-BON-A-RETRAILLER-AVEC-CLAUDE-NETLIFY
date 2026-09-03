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

### 1 bis. Revue contradictoire du correctif (AU‑6) — défauts résiduels corrigés

Une relecture adversariale en quatre angles (régression du LIVE, machine à
états du hook, écran d'appel, fonction Edge / identité par appareil) du code
livré a produit 13 constats, tous traités avant toute nouvelle fusion :

| # | Constat (réel sur la version fusionnée `abb48ca`) | Correctif |
|---|---|---|
| K | **Majeur.** Une caméra coupée par l'utilisateur n'était qu'une mise en sourdine côté SDK ; la relance automatique de la ligne et « Réessayer le micro » la **rallumaient à son insu** (aperçu local « Caméra coupée », correspondant qui voit l'image). | Souhait caméra mémorisé (`camWishRef`) : jamais republiée par le hook ; `camera: false` explicite ne rallume rien. Réservé aux appels, LIVE inchangé. |
| L | **Majeur.** Avec l'identité par appareil, plusieurs participants d'un même compte coexistent : `pickRemoteForCall` ne filtrait pas par compte — un de **mes** appareils ou un inconnu pouvait « connecter » l'appel ou capter l'élément audio. | `remotesOfAccount()` : seuls les appareils du compte du correspondant (`initiatorId`/`receiverId`) sont candidats. |
| M | **Majeur.** L'éviction par identité partagée servait de nettoyage implicite : un `call_ended` perdu laissait désormais un appel « connecté » sans correspondant, micro publié, sans fin. | Correspondant absent de la room 25 s après y avoir été présent → fin d'appel + « Correspondant déconnecté — appel terminé. » |
| N | Un échec de `Room.connect` émet `Disconnected` **puis** rejette : compté deux fois par la relance (2 relances réelles au lieu de 3). | Pas de relance depuis `onDisconnected` tant que la tentative est en vol. |
| O | Fin de piste micro traitée aussi pour le LIVE (doublon avec la relance interne du SDK : « micro coupé » diffusé aux spectateurs). | Réservé aux appels ; écouteur `on` durable retiré à la dépublication (la 2ᵉ coupure atteint bien le hook). |
| P | Après une reconnexion, compteurs WebRTC remis à zéro → delta négatif → faux « Votre voix ne part pas ». | Delta négatif = « mesure… », jamais un verdict. |
| Q | Accept‑by‑media ignorait une piste vidéo seule (appelé au micro refusé + signal perdu = appelant bloqué). | Tout média du correspondant compte. |
| R | « micro en cours d'activation » annoncé comme indisponible à chaque début d'appel (avis alarmant chez l'autre). | Rien n'est annoncé tant que la demande est en vol sans erreur. |
| S | Erreur caméra seule (micro OK) plus expliquée nulle part. | Ligne « Caméra indisponible : … » (`describeCameraError`). |
| T | Chevauchements sur 390 px (bannière, avis, conseil réseau, bouton son, diagnostic sous la carte interprète). | Avis empilés dans un seul conteneur ; diagnostic remonté quand l'interprète est actif. |
| U | « Réessayer le micro » sans ligne vivante : ancienne erreur réaffichée, bouton actif pendant la reconnexion. | Erreur effacée à la relance ; « Reconnexion… », bouton en attente. |
| V | Transcription serveur abandonnée après 12 s sans micro, jamais relancée après un « Réessayer » réussi. | L'effet redémarre quand le micro est réellement publié. |

Preuves : `tests/useLiveTransportCall.test.tsx` (8 scénarios sur un double de
transport rejouant les événements réels du SDK), 6 scénarios DOM
supplémentaires dans `tests/callRingingFlow.test.tsx`, règles pures dans
`tests/callAudioLink.test.ts` ; banc réel rejoué (cas idéal, A–E).

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

## 3 bis. Retour du test réel sur deux téléphones (AU‑7 / AU‑8, 02/09)

Test conduit par l'utilisateur : un côté entend l'autre, l'autre n'a aucun
retour de son, et l'appel se coupe seul après environ une minute. Captures
d'écran (iPhone, Safari) : « Micro non publié », « Reconnexion… », puis
`UnexpectedConnectionState: pcManager is not ready`.

**Ce qui a été mesuré, pas supposé.**

| Fait | Mesure |
|---|---|
| Le serveur retire un participant dont le média n'est jamais établi | LEAVE `reason=7` (JOIN_FAILURE) à 61 s, deux sondes indépendantes sur `wss://live.moknet.net` |
| Le serveur annonce bien son adresse publique | candidats `udp 185.170.58.86:50026` et `tcp 185.170.58.86:7881` |
| Le repli TCP est joignable de l'extérieur | port 7881 ouvert depuis 4 pays |
| Un relais TURN est proposé | `turn:185.170.58.86:3478?transport=udp` |

Le serveur n'est donc pas en cause : c'est la publication du micro qui
n'aboutit jamais sur ce téléphone, et la coupure « à la minute » en est la
conséquence mécanique.

**Corrigé dans l'application.**

- **Publier pendant que la ligne se rétablit** levait `pcManager is not
  ready` et le micro ne partait jamais. La demande attend désormais le retour
  à l'état connecté et s'exécute à ce moment‑là ; aucune connexion n'est
  lancée par‑dessus celle que le SDK rétablit déjà.
- **L'écran s'éteignait** au bout de 30 s à 1 min, ce qui suspend la page sur
  téléphone. L'écran reste allumé pendant tout l'appel (verrou d'écran), et
  le verrou est repris au retour au premier plan.
- **Message honnête** : une erreur d'état du transport n'est plus affichée
  brute, elle est expliquée et n'accuse plus le micro.
- **Rapport de diagnostic automatique** : chaque appel dépose son journal
  technique dans `call_diagnostics` (états, raisons de reconnexion données
  par le SDK, chemin réseau négocié, verdicts audio). Aucun contenu audio,
  aucun jeton, aucune adresse locale. C'est ce qui permet de lire ce qui se
  passe sur un vrai téléphone sans console.

**Écran d'appel réduit à une bande sur iPhone (AU‑8).** Le site charge
Tailwind 3 ; l'écran d'appel imposait sa hauteur avec une proportion écrite
dans la syntaxe de Tailwind 4, ignorée en silence. En dessous de 640 px la
carte n'avait donc aucune hauteur et se réduisait à son contenu, la variante
`sm:` masquant le défaut sur ordinateur. L'appel occupe désormais tout
l'écran du téléphone. Garde‑fou de non‑régression :
`tests/tailwindClassValidity.test.ts`.

## 3 ter. Résultat final sur deux téléphones (AU‑12 à AU‑14, 02/09) — ✅ VALIDÉ

Second retest utilisateur, après les correctifs AU‑7/AU‑8 : la voix restait
mêlée à la sonnerie et la connexion se perdait. Les rapports `call_diagnostics`
des deux appareils donnaient la cause, côté infrastructure : serveur LiveKit
du VPS en **1.8.4** (protocole 15) face à un SDK `livekit-client` **2.22.1**
(protocole 17) — négociation de publication qui expire toutes les ~16 s,
`bytesSent` jamais autre chose que `null`.

Corrigé en trois temps, sans dépendre d'une action SSH sur le VPS :

- **Une room par appel** (`call-<conversationId>--<callId>`) : plus aucune
  session fantôme d'un appel précédent ne peut publier son micro dans la
  room (c'était la « sonnerie mêlée à la voix »).
- **L'écran dit la vraie cause** : « la ligne du serveur d'appel se rétablit
  en boucle (N fois) » au lieu d'accuser le micro.
- **SDK épinglé à 2.17.3**, mesuré contre le binaire `livekit-server` 1.8.4
  exact (2.18 et au‑delà : 3 expirations / 50 s, 0 octet ; 2.17.3 :
  0 expiration, octets envoyés) et contre 1.13.6 (cible de montée de
  version). Table complète dans `deploy/livekit/README.md`.

**Test utilisateur du 02/09/2026, deux téléphones réels, serveur de
production `live.moknet.net` : l'appel passe, les deux personnes parlent et
s'entendent correctement. Mission déclarée close par l'utilisateur.** C'est
la preuve que le bac à sable ne pouvait pas produire (§ 4) ; elle ferme aussi
le dernier point ouvert de la mission LIVE (`docs/RAPPORT_FINAL_LIVE.md`).

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
  développement ; le protocole ci‑dessus est la preuve à apporter — **apportée
  le 02/09/2026** (§ 3 ter). À rejouer après toute montée de version du
  serveur LiveKit ou du SDK.

## 5. Traduction vocale DANS l'appel, voix à voix — audio ET vidéo (mission VT, tâche 1b, 03/09)

**Pourquoi 1b.** La tâche 1 (voix de l'interprète jouée LOCALEMENT sur le
téléphone qui écoute) a été refusée au test sur deux téléphones : les
journaux prouvaient que la voix était bien générée des deux côtés, mais la
lecture locale d'un fichier audio sur téléphone n'est pas fiable
(lecture automatique refusée par iOS, `volume` ignoré, langue déclarée
différente de la langue parlée). La voix traduite voyage désormais **dans
l'appel**, par le même chemin WebRTC que la voix — celui validé sur deux
téléphones le 02/09.

**Ce que ça fait.** Par défaut, l'appel est **normal** : chacun entend la
voix originale de l'autre, comme dans un appel classique. Dans l'écran
d'appel — pendant la sonnerie ou pendant l'appel — le sélecteur
« Entendre *X* en … » permet de choisir la langue dans laquelle je veux
entendre mon correspondant. Ce choix ne vaut que pour cet appel et ne dépend
pas de « Ma langue » du profil (qui ne sert plus qu'à aider la
transcription de ma propre voix). Dès que je choisis une langue, la voix
originale de *X* est **coupée** (`muted`, et non le seul volume que
l'iPhone ignore) et je n'entends qu'une voix dans ma langue, rendue chez
l'ÉMETTEUR (WebAudio → piste LiveKit nommée `interpreter`) et reçue chez moi
dans un élément audio dédié. Chaque côté choisit pour lui‑même : *X* voit
« *Moi* vous entend en Français (voix traduite) ». « Voix originale · appel
normal » rétablit l'original **entier aussitôt**, même si une phrase
traduite est encore en vol ; « Original aussi » garde l'original atténué
sous la voix traduite. Langue de *X* : celle qu'il **parle réellement**
(détectée) prime sur celle qu'il a déclarée ; jamais de seconde voix quand
il parle déjà ma langue.

**Sous le capot.** Émetteur : segments micro → transcription + traduction
serveur (`gemini_stt`) → voix HD (`gemini_tts`, avec la **langue de
lecture** : ce modèle de langage traduisait sinon en parlant ; budget 12 s,
file de 3 phrases dont la plus ancienne est abandonnée pour rester en temps
réel) → rendue dans la piste `interpreter`. Messages `voice`
(start/end/failed) sur le canal de données : le récepteur ne bascule sur la
voix de son appareil **que** sur un échec signalé, jamais par défaut. Le
contrat est prêt pour un agent serveur (piste `interpreter:<compte>`,
message `agent`) — renfort GPU reporté après validation de la base.

**Mesuré au banc (deux navigateurs à lecture automatique STRICTE, serveur
LiveKit 1.8.4 exact, passerelle réelle, voix française et russe réelles,
03/09/2026 — passe finale : voir le rapport de fin de tâche).** Sélecteur
visible chez l'appelante 3 ms après la sonnerie ; côté sans choix = appel
normal (original `muted=false`, volume 1, ≈ 17 000 octets / 3 s reçus) ;
chez l'auditrice : langue russe **détectée** en 7–8 s (rien déclaré),
original muet, piste interprète reçue 250 ms après sa publication, son reçu
(niveau RMS 0,18–0,20 sur 5 s) transcrit par la passerelle en **français** ;
choix « ru » pendant l'appel côté Ivan : original coupé en 2 ms, voix reçue
transcrite en **russe** ; identique en appel vidéo. Voix HD `gemini_tts` :
5,7 à 7,1 s par phrase sous charge → décalage d'interprétation consécutive
de l'ordre de 8 à 12 s par phrase ; c'est l'objet de la tâche 2 (voix
rapide).

**Protocole sur deux téléphones.** (1) A appelle B (audio). Pendant la
sonnerie, sur A : « Entendre *B* en » → Français. (2) B décroche sans rien
choisir : B entend la voix normale de A. (3) B parle sa langue : sur A, on
n'entend **pas** la voix de B, mais quelques secondes plus tard une voix
française qui dit la même chose ; « *B* parle… » pendant qu'il parle ; le
panneau affiche « Interprète IA · *langue de B* → Français ». Sur B, le
panneau dit « *A* vous entend en Français (voix traduite) ». (4) Sur B, en
cours d'appel : « Entendre *A* en » → sa langue : la voix de A est coupée et
remplacée par une voix traduite. (5) Sur A : « Original aussi » (voix de B
atténuée sous l'interprète) puis « Ma langue seule » ; puis « Voix
originale · appel normal » : la voix de B revient entière aussitôt.
(6) Raccrocher, refaire un **appel vidéo**, choisir les langues pendant
l'appel : mêmes attentes. (7) En cas d'écart : message ambre du panneau,
journaux console `[appel] piste interprète …` / `[appel] voix …`, et en
base les événements `voice` du rapport `call_diagnostics`.

**Limites honnêtes.** Délai de 8 à 12 s par phrase tant que la voix rapide
(tâche 2) n'est pas livrée ; sur un appareil dont le rendu audio n'est pas
encore réveillé, le premier toucher de l'écran d'appel le réveille (message
dédié) ; si la publication de la piste est impossible, le correspondant
l'entend par la voix de son propre appareil — repli signalé, jamais un
silence inexpliqué.
