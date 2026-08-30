# RAPPORT FINAL — MISSION LIVE MokNet (16 LOOP) — LOOP 16/16

> ÉQUIPE LIVE — 30 août 2026. Branche `claude/mokchat-blank-screen-fix-cd9o6o`,
> projet Supabase `rqciahtpixdjbyoajomg`, serveur LiveKit de production auto-hébergé
> `wss://live.moknet.net` (VPS Hostinger).
>
> **Discipline anti-faux-succès** : chaque affirmation ci-dessous est adossée soit à une
> sonde de `verification-loop15.md` (commande + sortie brute, même dossier), soit à une
> lecture de code citée par chemin de fichier, soit à la documentation du dépôt —
> explicitement signalée comme telle quand c'est la seule source. Rien n'est supposé.

---

## Synthèse exécutive

La mission LIVE (16 LOOP) livre un système de direct complet : transport WebRTC réel
(LiveKit auto-hébergé, architecture ports & adapters), sessions/rôles/chat/réactions
persistés et temps réel, copilote vocal à registre de capacités, Live Solidaire
(causes, ledger, preuves vision, IA d'anomalie), continuité Live→Contenu, appels 1-à-1.
Le serveur de production `wss://live.moknet.net` est **en ligne et vérifié depuis le bac
à sable jusqu'au join de room au niveau signalisation** (percée LOOP 15 : WebSocket Node
traverse le proxy — sondes 6-8). Le seul point non prouvable d'ici reste le **flux média
WebRTC réel entre deux appareils**, à vérifier côté utilisateur (instruction permanente,
répétée en fin de rapport).

**Passe de validation (LOOP 16, mesurée le 30/08/2026)** :
- `npx tsc --noEmit` → **140 erreurs** = baseline attendue exactement (toutes localisées
  dans `supabase/functions/*` — code Deno vérifié par un tsc Node : `jsr:` imports et
  global `Deno` inconnus ; zéro erreur applicative nouvelle).
- `npm run build` → **✅ passe** (`✓ built in 13.84s` ; avertissement de taille de chunk
  préexistant, non bloquant).
- `npx vitest run` → **✅ 105/105 tests, 10 fichiers** (dont `liveMaterialSystem.test.ts`
  6 tests — Duration 4.80s).

---

## 1. OPÉRATIONNEL (vérifié : code réel + base réelle + sondes production)

### Transport & production
| Capacité | Preuve |
|---|---|
| **Serveur LiveKit de production en ligne** (`wss://live.moknet.net`, nginx, VPS Hostinger) | Sonde 1 : HTTP/2 200 |
| **Pile RTC répond et authentifie** | Sondes 2/5 : `/rtc/validate` → 401 (jeton bidon) / **200 « success »** (jeton signé avec les clés de production stockées dans Supabase) |
| **Join de room réel au niveau signalisation depuis le bac à sable** | Sonde 8 : WS `/rtc` OPEN + 5 messages protobuf (JoinResponse) + close 1000 |
| **Bascule d'environnement sans changement de code** | Sonde 4 : `live_transport_config` porte `development` (`ws://localhost:7880`) ET `production` (`wss://live.moknet.net`), toutes deux actives ; sélection par `LIVE_TRANSPORT_ENVIRONMENT` sur l'Edge Function |
| **Émission de jeton protégée côté serveur** | Sonde 3 : `livekit-token` → 401 sans `Authorization` ; `services/live/liveKitToken.ts` (le client ne voit jamais clé/secret) |
| **Frontière ports & adapters** | `services/live/liveTransportTypes.ts` (port), `liveKitTransportProvider.ts` (seul fichier qui importe `livekit-client`), `hooks/useLiveTransport.ts` (pont React) — vérifié par lecture |
| **Caméra, micro, partage d'écran + SON du partage, mode audio seul, autoplay géré** | `useLiveTransport.ts` (pistes `screen_share_audio`, `audioPlaybackBlocked`/`startAudio`, `publishVideoOnConnect=false` pour appel audio), `liveKitTransportProvider.ts` (RoomEvent complets, adaptiveStream/dynacast) |
| **Appels 1-à-1 sur le même transport** | Room `call-{conversationId}` (`useLiveTransport.ts` l.21) ; Edge Function refuse 403 tout non-membre de la conversation (doc `SUPABASE_ARCHITECTURE.md`, ligne « Interactions (Équipe I) », vérifiée par REST lors de cette mission amont) |

### Sessions, chat, présence (Supabase + Realtime)
- **Cycle de session complet** : `createLiveSession` / `startLiveSession` / `endLiveSession` /
  `joinLiveSession` / `leaveLiveSession` / `fetchActiveParticipants` / `updateParticipantRole` /
  `setHandRaised` (`services/live/liveSessionService.ts`, tables `live_sessions`,
  `live_speakers`, `live_attendance`).
- **Chat de direct + réactions temps réel** : `sendLiveMessage` / `subscribeToLiveMessages` /
  `sendLiveReaction` / `subscribeToLiveReactions` / `subscribeToLiveSpeakerChanges`
  (`services/live/liveChatService.ts`, tables `live_messages`/`live_reactions` en Realtime).
- **Univers visuels partagés** : `updateVisualUniverse` + `subscribeToLiveSessionUniverse`
  (hôte seul, diffusion `postgres_changes` UPDATE, `live_sessions.visual_universe`) ;
  système « matière » verre/eau/lumière (`services/live/liveMaterialSystem.ts`,
  `LIVE_VISUAL_UNIVERSES` — source unique, testée : 6 tests vitest).
- **Notification de démarrage de Live** : trigger `notify_live_started()` — public → amis
  acceptés (blocages respectés), privé → invités seuls, programmé → rien (doc
  `SUPABASE_ARCHITECTURE.md` ligne « Interactions », testée en base réelle par la mission amont).
- **Continuité Live→Contenu** : `handleEndLive` (`components/SocialLive.tsx`) génère un
  résumé IA depuis les vrais messages du Live et le publie en **brouillon réel**
  (`format='live_extract'`, `source_type='live_session'`) — doc ligne « Social », LOOP 03/17.

### Copilote vocal (voir aussi la sous-section ARCHITECTE ci-dessous)
- Interprétation LLM (`interpretLiveVoiceCommand`, `generateJSON` via `ai-gateway`) →
  **exécution 100 % déterministe** dans `SocialLive.tsx::dispatchVoiceAction`
  (l.1297-1455) ; permissions vérifiées **une seule fois** contre le registre
  (`isVoiceCapabilityAllowed`) ; statut d'exécution honnête (jamais « c'est fait » avant
  l'écriture réelle — ex. GIVE_FLOOR, CREATE_SOLIDARITY_CAUSE) ; dégradation gracieuse
  (IA indisponible → UNKNOWN parlé, jamais un blocage du LIVE).

---

## 2. SIMULÉ / PROTOTYPE (UI présente, données locales ou factices — vérifié par grep repo-wide)

Un grep sur tout le dépôt (`*.ts`/`*.tsx`, hors `node_modules`) ne trouve **aucun
consommateur** des tables suivantes, pourtant créées et couvertes par RLS
(doc ligne « Live ») — les onglets correspondants de `SocialLive.tsx` vivent sur de
l'état React local, souvent pré-rempli de données d'exemple :

| Brique | Table(s) prête(s) non consommée(s) | Constat code |
|---|---|---|
| Q&R structurée + upvotes | `live_questions` (+upvotes) | `SocialLive.tsx` l.790+ : questions seedées en dur (« Fatou Diop », `q-1`…) |
| Sondages | `live_polls` (+options+votes) | aucun `.from('live_polls` dans le dépôt |
| Agenda / décisions / actions | `live_agenda_items`, `live_decisions`, `live_action_items` | idem — état local |
| Documents / cartes sources / notes perso | `live_documents`, `live_source_cards`, `live_personal_notes` | idem |
| Produits (commerce en direct) | `live_products` | idem |
| Cadeaux | `gift_catalog`, `live_gifts_sent` | idem |
| Replays | `live_replays` | idem |
| Tableau blanc | `live_whiteboard_strokes` | mode `whiteboard` de `mainStageMode` — dessin local, aucun stroke persisté |
| **Sous-titres bilingues temps réel** | — | `currentSubtitle` n'est **jamais mis à jour** (`setCurrentSubtitle` n'a aucun appelant hors du `useState`, `SocialLive.tsx` l.417) : la barre affiche une valeur initiale statique ; `SET_SUBTITLES_MODE` (vocal + bouton) change réellement le mode d'affichage, mais aucune reconnaissance vocale/traduction n'alimente le flux |
| Expert IA sur scène | — | `SUMMON_EXPERT` ouvre un modal (l.1392) ; l'expert est un agent IA, **pas un participant transport** (aucune piste LiveKit) |
| Modes de scène `council`/`meeting`/`commerce`/`masterclass` | — | mises en page locales (`mainStageMode`) |

> Ces briques sont d'honnêtes prototypes d'interface : le schéma serveur est prêt,
> le branchement réel est un chantier futur clairement délimité.

---

## 3. INTÉGRATION EXTERNE REQUISE

| Besoin | Détail | Source |
|---|---|---|
| **Mouvement réel de fonds (Live Solidaire)** | Aucune table ne détient de vrais fonds ; ledger = suivi **déclaratif** append-only. Le transfert d'argent réel exige un **prestataire de paiement externe** (mobile money / carte), non branché et non branchable depuis ce sandbox. | `services/live/liveSolidarityService.ts` (commentaire d'en-tête + section ledger), doc ligne « Live Solidaire » |
| TURN over TLS (port 5349) | Pour les réseaux d'entreprise bloquant tout UDP — demande le partage du certificat Caddy avec LiveKit sur le VPS ; à ajouter seulement si rencontré en usage réel. | `deploy/livekit/README.md` (« hors de ce déploiement minimal ») |
| Haute disponibilité / LiveKit Cloud | Un seul nœud aujourd'hui ; migration possible sans changer le code applicatif (même port de transport). | `deploy/livekit/README.md` |

---

## 4. RESTANT / LIMITATION

1. **⏳ INSTRUCTION PERMANENTE — preuve d'usage réel à deux appareils sur
   `live.moknet.net` : RESTANT, côté utilisateur.** Ouvrir un LIVE réel depuis deux
   navigateurs/appareils différents et constater que l'audio/vidéo passent par le serveur
   de production (étape 5 du `deploy/livekit/README.md`). Le bac à sable a prouvé tout le
   chemin jusqu'au **join de room en signalisation** (sonde 8) ; il ne peut pas établir de
   média WebRTC (UDP/ICE) ni faire vivre deux navigateurs réels. **Ce point est répété à
   chaque rapport tant qu'il n'est pas fait.**
2. **WebSockets Chromium via le proxy du bac à sable** : toujours morts en cours
   d'échange (mesure des missions précédentes, non re-testée ici) — mais **percée
   LOOP 15** : depuis **Node**, l'échange WS complet passe (sondes 6-8). Toute future
   vérification automatisée de la signalisation peut donc se faire en Node.
3. **Dérive documentaire mineure** : `deploy/livekit/README.md` dit encore « jamais
   exécuté contre le VPS réel » et illustre avec `live.lemondeavous.com` — périmé depuis
   le déploiement réussi sur `live.moknet.net` (sondes 1/2/5/8). À rafraîchir (aucun
   fichier modifié par cette équipe, contrainte de mission).
4. **Baseline TypeScript** : 140 erreurs `tsc --noEmit`, toutes dans
   `supabase/functions/*` (code Deno lu par un tsc Node) — connu, stable, non bloquant
   (le build Vite exclut ces fichiers et passe).
5. Appels 1-1 : la signalisation, le jeton 403 non-membre et le transport sont réels ;
   la **preuve navigateur** de la mission amont a utilisé un courtier local fidèle au
   protocole (WS Chromium morts dans le sandbox) — la confirmation 100 % production
   relève du même test à deux appareils que le point 1 (doc ligne « Interactions »).

---

## ARCHITECTE / ORCHESTRATION PAR INTENTION

Registre réel : `LIVE_VOICE_CAPABILITIES` (`services/live/liveVoiceCommands.ts`,
l.93-120) — **15 capacités** auto-descriptives (id stable `domaine.objet.verbe`,
description-prompt, rôle requis, niveau de risque), **source unique** partagée entre le
prompt LLM, la vérification de permission (`isVoiceCapabilityAllowed`) et le pont
Architecte (les identifiants sont lus depuis le registre, jamais recopiés —
`SocialLive.tsx` l.1457+ ; capacités déclarées **tant qu'une session est ouverte**,
sinon le bus répond honnêtement « indisponible »).

| Capacité (id) | Action | Rôle requis | Risque | Statut réel |
|---|---|---|---|---|
| `live.microphone.toggle` | TOGGLE_MIC | anyone | low | ✅ Opérationnel (pilote le vrai micro via transport) |
| `live.camera.toggle` | TOGGLE_VIDEO | anyone | low | ✅ Opérationnel (vraie caméra) |
| `live.screen_share.toggle` | TOGGLE_SCREEN_SHARE | on_stage | low | ✅ Opérationnel (vraie piste écran + son) |
| `live.hand.toggle` | RAISE_HAND | anyone | low | ✅ Opérationnel (`setHandRaised`, persisté + Realtime) |
| `live.participant.give_floor` | GIVE_FLOOR | host | moderate | ✅ Opérationnel (résolution de référence « elle »/« le dernier » par contexte ; écriture réelle avant confirmation parlée) |
| `live.sidebar.open_tab` | OPEN_TAB | anyone | low | ✅ Opérationnel (navigation) — mais certains onglets ciblés sont eux-mêmes SIMULÉS (voir §2) |
| `live.chat.send` | SEND_CHAT_MESSAGE | anyone | low | ✅ Opérationnel (`sendLiveMessage` → `live_messages`) |
| `live.summary.request` | REQUEST_SUMMARY | anyone | low | ✅ Opérationnel (résumé IA des vrais messages, dégradation honnête) |
| `live.subtitles.set_mode` | SET_SUBTITLES_MODE | anyone | low | ⚠️ Le réglage est réel, le **flux de sous-titres est SIMULÉ** (aucune reconnaissance branchée, §2) |
| `live.audio_only.toggle` | TOGGLE_AUDIO_ONLY | anyone | low | ✅ Opérationnel (économie de données) |
| `live.visual_universe.change` | CHANGE_VISUAL_UNIVERSE | host | moderate | ✅ Opérationnel (persisté + diffusé Realtime à tous) |
| `live.expert.summon` | SUMMON_EXPERT | host | moderate | ⚠️ Ouvre le modal réel ; l'expert est un agent IA, pas un participant transport (§2) |
| `live.solidarity.create` | CREATE_SOLIDARITY_CAUSE | host | moderate | ✅ Opérationnel (insert réel `live_solidarity_causes` ; `beneficiaryType` validé côté client contre la CHECK constraint — jamais confiance aveugle au LLM) |
| `live.solidarity.post_update` | ADD_SOLIDARITY_UPDATE | host | low | ✅ Opérationnel (insert réel + Realtime) |
| *(pseudo-actions hors registre)* | DISCOVER_CAPABILITIES / ASK_CLARIFICATION / UNKNOWN | — | — | ✅ Opérationnelles : découverte contextuelle filtrée par rôle, clarification à UNE question, incompréhension parlée — jamais bloquées par permission |

`END_LIVE` est **délibérément absent** du registre vocal (action à fort impact peu
réversible — reste un geste bouton explicite, `liveVoiceCommands.ts` l.13-16).

---

## LIVE SOLIDAIRE — statut brique par brique

Tables : `live_solidarity_causes`, `live_solidarity_wallet_ledger`,
`live_solidarity_proofs`, `live_solidarity_updates`, `live_solidarity_donors`
(RLS alignée sur `can_view_live_session()`, écriture organisateur/admin — doc ligne
« Live Solidaire »). Service : `services/live/liveSolidarityService.ts` (362 l.).

| Brique | Statut | Preuve code |
|---|---|---|
| **Création de cause (vocale + UI)** | ✅ OPÉRATIONNEL | `createSolidarityCause` (insert réel, RLS organisateur) ; dispatch vocal `CREATE_SOLIDARITY_CAUSE` avec validation du `beneficiaryType` et confirmation seulement après persistance (`SocialLive.tsx` l.1396-1421) ; clarification à une question si titre/bénéficiaire manquent |
| **Ledger (collecté / utilisé)** | ✅ OPÉRATIONNEL — **déclaratif** | `fetchSolidarityLedger` / `addSolidarityLedgerEntry` : append-only, saisi par l'organisateur, jamais un solde stocké (même principe que `wallet_transactions`) — **aucun fonds réel** |
| **Preuves structurées + capture vision** | ✅ OPÉRATIONNEL | `addSolidarityProof` / `subscribeToSolidarityProofs` ; `handleCaptureSolidarityProof` (`SocialLive.tsx` l.699-747) : frame caméra réelle → `analyzeImage` (ai-gateway, JSON strict) → montant/description extraits **seulement si lisibles** (« n'invente jamais un montant » ; échec vision = preuve quand même enregistrée, montant vide) |
| **Mises à jour de mission (vocales + UI)** | ✅ OPÉRATIONNEL | `addSolidarityUpdate` + Realtime ; vocal `ADD_SOLIDARITY_UPDATE` (hôte) |
| **IA de détection d'anomalie** | ✅ OPÉRATIONNEL | `detectSolidarityAnomalies` : relit ledger+preuves **frais** (jamais l'état local), max 3 **questions neutres** à l'organisateur — jamais une accusation, jamais « fraude » ; `checked:false` si IA indisponible, **jamais** confondu avec « rien à signaler » |
| **Niveaux de visibilité** | ✅ OPÉRATIONNEL (basique) | `updateSolidarityCauseVisibility` (organisateur seul, RLS) + diffusion Realtime de la cause |
| **Donateurs** | ⚠️ SCHÉMA PRÊT, NON CONSOMMÉ | `live_solidarity_donors` : aucun consommateur dans le dépôt (grep repo-wide zéro résultat) |
| **Mouvement réel de fonds** | ❌ **INTÉGRATION EXTERNE REQUISE** | Aucune de ces tables ne détient de vrais fonds ; le transfert d'argent réel exige un prestataire de paiement externe, hors périmètre du sandbox (commentaire d'en-tête du service + doc) — **le ledger est un registre de transparence, pas un porte-monnaie** |

---

## Passe de validation transversale (mesures réelles, 30/08/2026)

| Vérification | Commande | Résultat mesuré | Attendu | Verdict |
|---|---|---|---|---|
| Typage | `npx tsc --noEmit 2>&1 \| grep -c "error TS"` | **140** | 140 (baseline) | ✅ conforme, zéro régression |
| Build production | `npm run build` | `✓ built in 13.84s` | passe | ✅ |
| Tests | `npx vitest run` | **Tests 105 passed (105)**, 10 fichiers | 105 | ✅ |

Sondes production (détail complet : `verification-loop15.md`) : `GET /` **200** ·
`/rtc/validate` jeton bidon **401** · Edge Function sans auth **401** · `/rtc/validate`
jeton signé prod **200 success** · WS Node `/rtc` jeton bidon **401 à l'upgrade** ·
WS écho Node **échange complet** · WS Node `/rtc` jeton valide **OPEN + 5 signaux +
close 1000** (join de room réel).

---

## Conclusion

Le LIVE MokNet repose désormais sur un transport de production réel, vérifié depuis ce
bac à sable jusqu'au join de room en signalisation sur `wss://live.moknet.net`, avec une
frontière de transport qui permettra tout changement de fournisseur sans toucher à
l'application. Les briques d'interaction cœur (sessions, rôles, chat, réactions, univers,
voix, solidarité) sont opérationnelles et persistées ; les briques d'atelier (Q&R,
sondages, agenda, tableau blanc, cadeaux, replays, sous-titres) sont des prototypes UI
assumés dont le schéma serveur est prêt. **Il reste UNE étape, côté utilisateur, répétée
en instruction permanente : ouvrir un LIVE réel depuis deux appareils différents et
constater l'audio/vidéo via `live.moknet.net`.**
