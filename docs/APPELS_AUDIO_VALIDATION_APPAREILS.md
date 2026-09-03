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
LiveKit 1.8.4 exact, passerelle réelle v24, voix française et russe réelles,
03/09/2026 — cinq passes, la dernière à 62 OK / 0 défaut).** Sélecteur
visible chez l'appelante 3 ms après la sonnerie ; côté sans choix = appel
normal (original `muted=false`, volume 1, ≈ 16–17 000 octets / 3 s reçus) ;
chez l'auditrice : langue russe **détectée** en 7–8 s (rien déclaré),
original muet, piste interprète reçue 0–250 ms après sa publication, son
reçu (niveau RMS 0,15–0,20 sur 5 s) transcrit par la passerelle en
**français** ; choix « ru » pendant l'appel côté Ivan : original coupé en
2 ms, piste interprète d'Amina publiée 11,5 s après ce choix et reçue
aussitôt, voix reçue transcrite en **russe** ; identique en appel vidéo ;
retour à « Voix originale » = original entier aussitôt ; aucune voix de
secours utilisée. Voix HD `gemini_tts` : 5,7 à 10,7 s par phrase sous
charge → décalage d'interprétation consécutive de l'ordre de 8 à 12 s par
phrase ; c'est l'objet de la tâche 2 (voix rapide).

**Défaut trouvé par la passe 4 et corrigé — prouvé, pas supposé.** Après le
choix d'Ivan, la piste d'Amina n'était publiée qu'au bout de 88 s. En base
(`ai_call_log`, `call_diagnostics`) : pendant ces 88 s, aucune
transcription d'Amina n'atteint la passerelle, alors que celles d'Ivan
continuent toutes les 9 s — le réseau n'y est pour rien. Pendant qu'une
voix d'interprète joue dans mon haut-parleur, mon micro est « en pause »
(ce qu'il capte alors n'est pas ma voix) ; or le découpeur jetait, à
l'entrée en pause, le segment entamé juste avant — de la parole captée
AVANT que cette voix n'atteigne le haut-parleur (le message « début »
précède le son). Face à un interprète qui parle 60 % du temps (phrases de
8–10 s, silences de 6–7 s), une parole continue ne se clôt jamais dans la
fenêtre (ni 700 ms de silence, ni 9 s) : zéro phrase envoyée. Désormais la
parole d'avant la pause est close et émise (raison `pause`, au moins
350 ms de voix) et seul ce qui arrive pendant la pause est jeté
(`SegmenterCore`, `ServerCaptioner`, quatre tests dont « parole continue
face à un interprète bavard : trois fenêtres, trois segments — avant,
zéro »). Sur deux téléphones, c'est le cas où l'on répond pendant que
l'interprète finit la phrase précédente : le début de la réponse n'est plus
perdu.

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

## 6. Connexion quasi immédiate, traduction active dès les premiers mots (mission LT, 03/09)

**Ce que les vrais téléphones montraient (LT‑0, sept appels iPhone ↔ Android
lus dans `call_diagnostics` et `ai_call_log`).** Connexion : « connecté »
normalement en 3,7–5,8 s ; le cas à 30 s était une **éviction en boucle par
identité LiveKit dupliquée** — deux onglets du même navigateur partageaient
l'identifiant d'appareil, la seconde session évinçait la première (raison 2
du SDK, « DUPLICATE_IDENTITY »), la tentative suivante mourait en délai ICE,
la relance automatique recommençait, connecté à 22 s ; lecture audio bloquée
(« NotAllowed ») jusqu'à 23,6 s faute de geste ; 0,8 s perdu à chaque
connexion par la sonde « v1 RTC path » du SDK 2.17 face au serveur 1.8.4.
Traduction : première voix 10–20 s après le micro — langue du correspondant
reçue tard, transcripteur redémarré à chaque changement de langue (segment
en cours perdu), segments jusqu'à 9 s, piste interprète publiée seulement à
la première phrase traduite, Gemini TTS « réponse sans audio » dans 14 % des
cas → phrase perdue (ElevenLabs, fournisseur suivant, impayé).

**Correctifs LT‑1 (connexion).** Identité LiveKit **par onglet**
(`services/calls/callDevice.ts` : préfixe stable de l'appareil + suffixe
d'onglet, motif `^[a-z0-9]{8,27}-[a-z0-9]{4}$`, accepté tel quel par
`livekit-token` v5) — deux onglets du même navigateur ne s'évincent plus ;
sur une éviction pour identité dupliquée, **aucune relance automatique** :
l'écran dit « Connexion remplacée par une autre session de cet appel
(identité dupliquée) » et le rapport nomme la raison (`describeDisconnectReason`,
libellés des seize raisons du SDK) au lieu de relancer une ligne
condamnée ; `singlePeerConnection: false` sur la room d'appel — le SDK
n'essaie plus `/rtc/v1` avant `/rtc` (le serveur 1.8.4 ne connaît que le
second) ; `startAudio()` du transport **dans le geste** de décroché et à
tout toucher de l'écran d'appel.

**Correctifs LT‑2 (traduction).** Transcripteur **jamais redémarré** : la
langue cible est lue à chaque segment (`targetLanguage` sous forme de
fonction) ; segments 550 ms de silence / 6,5 s au plus, **clôture anticipée**
après 2,5 s de parole et un creux de 320 ms ; piste interprète **publiée dès
le « hello »** du correspondant (langue ajustable en cours d'appel sur la
même piste, `setLanguage`), l'agent serveur restant prioritaire s'il est
présent ; passerelle IA **préchauffée** (`ai-gateway` v25, mode `warmup` :
classement des candidats et secrets du premier TTS et du premier STT mis en
cache côté serveur) dès qu'une traduction devient probable — pendant la
sonnerie si la langue est choisie à ce moment ; Gemini TTS **réessayé une
fois** sur « réponse sans audio » ; phrases arrivées pendant qu'une voix se
rend **fusionnées en une seule synthèse** (≤ 320 caractères) — révélé par
le banc : avec des segments courts et une parole continue, la file de trois
phrases débordait et près d'une phrase sur deux était abandonnée puis dite
par la voix de secours du correspondant ; sélecteur de langue devenu une
**case bien visible** : état « Traduction active » / « Appel normal » lisible
d'un coup d'œil, liste déroulante de 44 px « Entendre *X* en », choix affiché
avec son drapeau, un geste pour changer.

**Mesuré au banc (deux navigateurs à lecture automatique stricte, serveur
LiveKit 1.8.4 exact, passerelle réelle v25, voix française et russe réelles,
03/09/2026 — passe 2 : 82 OK / 0 défaut).**

| Mesure | Avant (banc VT‑1b passe 5 · téléphones LT‑0) | Après (banc LT passe 2) |
|---|---|---|
| Décroché → écran « connecté » | 99–110 ms au banc · 3,7–5,8 s, 22 s sur éviction (téléphones) | 233 / 471 ms (audio), 436 / 1 207 ms (vidéo) ; identifiant par onglet transmis à la fonction jeton, 0 éviction |
| Passerelle IA préchauffée | jamais | pendant la sonnerie, 1 130 ms, 2,1 s après le clic d'appel |
| Piste interprète publiée après le décroché (Ivan → Amina) | à la première phrase traduite (≈ 7 s) | 473 ms |
| Piste publiée après le choix de langue de l'autre (Amina) | 11 512 ms | 158 ms (audio) · 314 / 339 ms (vidéo) |
| Première voix traduite | 10–20 s après le micro (téléphones) · 16 s (banc vidéo) | 13,2 s après le décroché · 7,3–12,0 s après le choix de l'autre |
| Génération d'une voix HD | 6,7–10,7 s | 2,9–5,8 s (médianes 4,2–5,4 s) |
| Phrases abandonnées → voix de secours | 0 (segments longs) ; passe 1 LT : 6 + 2 | 0 |

**Limites honnêtes.** Une phrase traduite ne peut pas précéder la fin de la
phrase, sa transcription (2–4 s) et sa voix HD (4–6 s) : 7–13 s au premier
mot ; c'est la voix rapide (tâche VT‑2) qui abaissera ce plancher. Lecture
Gemini en anglais d'une phrase française : observée une fois sur onze voix
au banc, 0 sur 12 en A/B REST avec deux consignes — aléa du fournisseur,
non reproductible, aucune consigne ne l'a mesurablement corrigé. Le serveur
LiveKit du VPS reste en 1.8.4 (montée recommandée, action SSH). Aucun
abonnement Web Push n'existait sur les deux téléphones du test LT‑0. Le
constat sur deux vrais téléphones reste à faire par l'utilisateur.

**Protocole sur deux téléphones (ajout).** (1) A appelle B et choisit la
langue **pendant la sonnerie** : dès le décroché, B lit « A vous entend
en … » et la case de langue de A affiche « Traduction active » ; la voix
traduite arrive après la première phrase de B. (2) B change de langue en
cours d'appel : sa case passe à « Traduction active » aussitôt, la voix
traduite de A suit en moins de 15 s. (3) Deux onglets ouverts sur le même
téléphone : plus d'éviction en boucle ; s'il y en a une, l'écran dit
« Connexion remplacée par une autre session de cet appel (identité
dupliquée) » sans relancer. (4) Journaux à relever : `[appel] passerelle IA
préchauffée`, `[appel] piste interprète publiée`, `[appel] voix interprète
générée {generateMs, durationMs, merged}`, et en base les événements
`transport` (raison de déconnexion nommée) et `voice` de `call_diagnostics`.

## 7. Sonnerie et notification fiables appli fermée, bouton « Sonnerie », appel entrant au premier plan (mission SN, 03/09)

**Plainte.** « Si l'appli n'est pas ouverte, l'appel n'arrive pas vraiment :
pas de sonnerie, pas de vibration, pas de notif visible, et parfois la
sonnerie n'est perçue que d'un seul côté. » La capture jointe montrait
l'erreur exacte : `Failed to execute 'subscribe' on 'PushManager':
Subscription failed - no active Service Worker`.

**Cause racine, prouvée (SN‑0).** `/metadata.json` n'existe qu'à la racine
du dépôt, pas dans `public/` : moknet.net (Netlify) répond **404**. Or
l'ancien `public/sw.js` faisait `cache.addAll(['/metadata.json'])` à
l'installation : l'installation échouait, le navigateur effaçait
l'enregistrement, aucun worker n'était jamais actif, et
`pushManager.subscribe` refusait avec l'erreur de la capture. Conséquence
mesurée en base : `push_subscriptions` = 0 ligne, `push_delivery_log` =
0 ligne — aucun appareil n'a jamais été enregistré, aucun push n'a jamais
été tenté. Le serveur d'envoi (`push-notify`, prouvé 15/15 en VF‑1) n'avait
simplement aucun abonné. Le banc ne l'avait pas vu parce que `vite preview`
renvoie `index.html` en 200 pour un fichier absent, là où Netlify renvoie un
vrai 404 : le banc SN sert désormais `dist/` avec un serveur statique fidèle
à Netlify (404 réel, réécritures de `netlify.toml` seulement).

**Correctifs.**

- **SN‑1 — la chaîne push tient sans dépendre d'un fichier.** `public/sw.js`
  (cache `lmav-app-v6.6.0`) n'installe plus rien en pré-cache et son
  installation ne peut plus échouer (un cache inaccessible est journalisé,
  jamais fatal). `services/pwaService.ts` attend un worker **actif**
  (`statechange` + sondage, 8 s), ré-enregistre `/sw.js` une fois si
  nécessaire, sinon renvoie `null` ; `services/push/pushService.ts` dit
  alors la vérité : « Service worker inactif : notifications push
  impossibles pour l'instant (rechargez la page, puis réessayez) ».
- **SN‑2 — un bouton « Sonnerie », branché aux réglages existants.** Dans
  la barre de la fenêtre de messagerie, après « Annuaire » : Tout · Directs
  · Groupes · Annuaire · **Sonnerie**. Le panneau
  (`components/chat/RingingPanel.tsx`) offre deux interrupteurs — Sonnerie
  et Vibration — lus et écrits par `ringtoneService` (`lmav_ring_prefs_v1`,
  honorés par `startRinging` : sonnerie coupée = appel silencieux mais
  l'écran d'appel sonne toujours, vibration coupée = aucune vibration), le
  nom de la sonnerie du profil (se change dans les Paramètres, comme avant),
  l'état « Hors application » lu par `pushService` (Active · Incomplète ·
  Non activée · Refusée · À installer · Indisponible, avec « Activer sur
  cet appareil » et « Revérifier »), et « Tester la sonnerie ». Les réglages
  sont aussi publiés pour le service worker (Cache API
  `lmav-ring-prefs-v1`, entrée `/__moknet/ring-preferences`) : la
  notification d'appel appli fermée est **silencieuse** si la sonnerie est
  coupée et **sans vibration** si la vibration est coupée.
- **SN‑2b — quand ça sonne, on voit où décrocher.** Toucher le **corps** de
  la notification (action « open ») n'ouvrait que la conversation ; appli
  fermée, le signal temps réel de l'appel est perdu, donc aucun
  « Décrocher » n'apparaissait. Désormais l'écran d'appel **sonne** dans les
  deux chemins (fenêtre existante par le message `moknet-push-action`,
  lancement à froid par `?pushAction=open…`), avec le bouton Décrocher de
  72 × 72 px ; l'écran d'appel passe en `z-[400]`, au-dessus des boîtes de
  dialogue du LIVE (z‑260/300), et le toast d'appel en `z-[402]` ; en vidéo,
  la sonnerie affiche « Appel vidéo entrant… » au lieu d'un libellé de
  connexion.

**Mesuré au banc (Chromium Playwright avec service worker réel, serveur
statique fidèle à Netlify — `/metadata.json` en vrai 404 —, Supabase réel,
comptes de preuve réels, 03/09/2026 — passe 2 : 21 OK / 0 défaut).**

| Mesure | Avant (ancien `sw.js`, 404) | Après |
|---|---|---|
| Worker de service actif | jamais — enregistrement effacé après l'échec d'installation | actif (`activated`) 608 ms après le début de la navigation, malgré le 404 |
| `pushManager.subscribe` | « Subscription failed - no active Service Worker » (défaut de la capture reproduit) | passe la barrière du worker ; en headless, seul refus possible « Registration failed - permission denied » (pas de service de push) ; avec un service de push simulé côté page (même règle que le navigateur), 1 ligne réelle écrite dans `push_subscriptions` par `save_push_subscription`, panneau « Active » |
| Barre de la messagerie | Tout · Directs · Groupes · Annuaire | + Sonnerie (mobile 390 px : bouton 89 px, aucun débordement, panneau 369/390 px) |
| Réglages Sonnerie / Vibration | — | écrits pour l'appli (`localStorage`) **et** pour le worker (Cache API) |
| Notification d'appel du worker, sonnerie coupée | toujours sonore, avec vibration | `silent = true`, vibration `[]`, persistante, actions Répondre / Refuser |
| Notification, sonnerie et vibration remises | — | `silent = false`, vibration `[300,150,300,800,300,150,300]` |
| Push livré au worker → écran d'appel | — | Décrocher visible, z‑index 400, 72 × 72 px dans l'écran, touchable au centre (mobile : y = 721 sur 844) |
| Corps de la notification touché, fenêtre ouverte | conversation seule, pas de Décrocher | écran d'appel qui sonne, Décrocher visible |
| Lancement à froid par la notification | conversation seule | écran d'appel qui sonne 2 198 ms après l'ouverture, appelant nommé |

Tests automatisés : tsc 0, vitest 763/763 (56 fichiers ; +26 : installation
et activation du worker, réglages lus par le worker, attente du worker
actif, panneau Sonnerie, écran d'appel sur « open » et au lancement à
froid).

**Limites honnêtes.** Le bac à sable n'a pas de service de push :
l'abonnement accepté par le navigateur et la remise réelle d'un push sur un
téléphone appli fermée ou verrouillée se constatent sur de vrais appareils.
Sur iPhone, les notifications Web Push exigent l'application ajoutée à
l'écran d'accueil (iOS 16.4 et plus) ; sur Android, l'autorisation
« Notifications » du site. Le son de la notification appli fermée est celui
du système, pas la sonnerie MokNet (limite du Web Push) ; la sonnerie MokNet
démarre dès que l'écran d'appel s'ouvre. Sonnerie coupée ⇒ la notification
est aussi sans vibration (`silent` et `vibrate` ne se combinent pas dans le
navigateur). « La sonnerie n'est perçue que d'un seul côté » : côté
appelant, le retour d'appel est joué par l'application ouverte (inchangé) ;
côté appelé appli fermée, tout dépend de l'abonnement de cet appareil — le
panneau « Hors application » doit afficher « Active ».

**Protocole sur deux téléphones.** (1) Sur chaque téléphone, ouvrir la
messagerie → « Sonnerie » : « Hors application » doit afficher « Active »
(sinon « Activer sur cet appareil » et accorder l'autorisation ; sur iPhone,
d'abord « Ajouter à l'écran d'accueil » et ouvrir l'application depuis
l'icône). (2) Fermer complètement l'application sur B, ou verrouiller le
téléphone ; A appelle B : B reçoit la notification « Appel de A » avec le
son et la vibration du système et les actions Répondre / Refuser ; toucher
le corps de la notification ouvre l'écran d'appel qui sonne avec
« Décrocher ». (3) Sur B, couper la sonnerie dans le panneau, rappeler : la
notification arrive silencieuse ; remettre la sonnerie. (4) B avec
l'application ouverte : couper la vibration, rappeler : sonnerie sans
vibration. (5) À relever en base : `push_subscriptions` (une ligne par
appareil) et `push_delivery_log` (`ok = true` à chaque appel) ; dans le
navigateur, les lignes `[sw]` et « Service Worker PWA LMAV enregistré ».
