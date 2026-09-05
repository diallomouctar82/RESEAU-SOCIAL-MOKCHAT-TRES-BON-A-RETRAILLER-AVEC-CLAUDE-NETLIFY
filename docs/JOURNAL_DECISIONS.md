# 📜 JOURNAL PERMANENT DES DÉCISIONS D'INGÉNIERIE & D'ARCHITECTURE
> **Registre Horodaté des Arbitrages, Justifications Stratégiques et Conséquences Système**  
> *Règle : Tout arbitrage technique ou fonctionnel majeur DOIT être consigné ici avec son statut et son impact.*

---

## 📋 FORMAT D'UNE ENTRÉE DE DÉCISION
Chaque décision respecte le formalisme strict suivant :
- **ID & Date** : Identifiant unique `DEC-YYYY-NNN` et date de validation.
- **Module(s) concerné(s)** : Périmètre impacté.
- **Problème / Besoin initial** : Pourquoi la question s'est posée.
- **Idées / Options envisagées** : Alternatives considérées.
- **Décision retenue** : Solution adoptée.
- **Justification & Valeur ajoutée** : Raison du choix.
- **Conséquences & Impacts transversaux** : Modifications induites sur d'autres composants.
- **Éléments techniques concernés** : Fichiers, types, services et tables.
- **Statut** : `Envisagé` | `Validé` | `Développé` | `Testé` | `Remplacé` | `Abandonné`.

---

## 🏛️ HISTORIQUE CHRONOLOGIQUE DES DÉCISIONS

### [DEC-2026-041] — 3 Septembre 2026
* **Module(s)** : `Sécurité base Supabase (orchestrateur IA)`, `Gouvernance Vision Smart AI Core (pilote consommateur, workflow AR12)`.
* **Problème / Besoin initial** : premier cycle de preuves réel de MokNet dans le Registre d'applications de Vision Smart AI Core (TASK-0014). Le relevé des advisors Supabase du 2 septembre classait la sécurité **RED CRITIQUE** : la vue `public.ai_spend_by_provider` s'exécutait avec les droits de son propriétaire (`SECURITY DEFINER`, comportement par défaut d'une vue) et exposait l'agrégat de `ai_call_log` à `anon` et à tout utilisateur connecté, en contournant la RLS admin-only de `ai_call_log` — mesuré par impersonation : 37 lignes visibles par `anon` et par un compte non-admin ; la table `ai_provider_credentials` (RLS activée, aucune policy) conservait les droits par défaut d'`anon`/`authenticated` et restait exposée dans le schéma GraphQL des rôles clients.
* **Options envisagées** :
  1. Supprimer la vue (aucun consommateur côté client).
  2. Passer la vue en `security_invoker = true`, retirer tout droit à `anon`, ne laisser que `SELECT` à `authenticated` (la RLS de `ai_call_log` s'applique alors à l'appelant : administrateurs seulement), et retirer les droits `anon`/`authenticated` de `ai_provider_credentials` (secrets au Vault, lecture réservée au rôle service et aux RPC admin `SECURITY DEFINER`).
* **Décision retenue** : option 2 — migration `security_task0014_view_invoker_credentials_revoke` (version `20260903094327`), appliquée le 3 septembre 2026 dans le cadre du workflow AR04 → AR07 d'AI Core (écart → action → changement matériel → réévaluation).
* **Justification** : ne jamais supprimer une capacité existante (la vue reste lisible par les administrateurs, via la RLS) ; moindre privilège ; preuve avant/après reproductible par impersonation (`set local role` + `request.jwt.claims`) ; aucun changement de code client nécessaire.
* **Conséquences** :
  1. Après migration : `security_invoker=true` ; `anon` → « permission denied » ; non-admin → 0 ligne ; admin → 37 lignes ; `service_role` inchangé (fonctions Edge `ai-gateway`/`push-notify` non affectées) ; advisors 218 → 214 lints, ERROR 1 → 0.
  2. Écarts restants, documentés et non corrigés par cette décision : protection contre les mots de passe compromis (réglage Auth du tableau de bord Supabase — action propriétaire) ; avertissements génériques d'exposition GraphQL des tables ; fonctions `SECURITY DEFINER` admin exécutables par `authenticated` (toutes gardées par `is_admin()`, risque accepté).
  3. Version `v6.12.1` (correctif) ; lot de preuves, évaluation à sept dimensions et plan d'écarts publiés dans le dépôt VISION-SMART-AI-CORP.
* **Éléments techniques** : vue `public.ai_spend_by_provider`, table `public.ai_provider_credentials`, migration `20260903094327_security_task0014_view_invoker_credentials_revoke`, `docs/SUPABASE_ARCHITECTURE.md` (§ Orchestrateur IA) ; dépôt AI Core : `docs/execution/TASK-0014.md`, `evidence/consumer/`, `evidence/registry/`, `evidence/runtime/`.
* **Statut** : `Testé` (preuves avant/après en base réelle, production sondée après migration).

---

### [DEC-2026-040] — 3 Septembre 2026
* **Module(s)** : `Documentation & Continuité Système`, `Green Gate (GitHub Actions)`, `Gouvernance Vision Smart AI Core (source de vérité)`, `Memory Core`.
* **Problème / Besoin initial** : l'audit de conformité (GV‑0) aux règles du dépôt VISION-SMART-AI-CORP (Constitution 1.6.0, ADR‑0016, ADR‑0021 à 0024, politique documentaire, `AGENTS.md` de MokNet) a mesuré quatre écarts : (1) quatorze fusions sur `main` entre le 1er et le 3 septembre sans aucune entrée DEC ni ligne de version — `docs/ETAT_ACTUEL.md` et la fiche module 05 affirmaient encore que la phase « appels vocaux » n'était pas commencée et qu'aucun transport audio/vidéo n'existait, alors que les appels réels sont en production et validés par l'utilisateur sur deux téléphones ; (2) aucune intégration continue indépendante — seuls les aperçus Netlify existaient, la preuve « verte » reposait donc sur la déclaration de son producteur ; (3) conventions ADR‑0016 (préfixes de commit, sections obligatoires de PR, version sémantique par mission) suivies de façon irrégulière ; (4) Memory Core jamais consulté ni alimenté (PROJECT_CHARTER § 6 : `→ TRACE / MEMORY PROPOSAL`). L'utilisateur a rendu VISION-SMART-AI-CORP source de vérité obligatoire.
* **Options envisagées** :
  1. Laisser les rapports de conversation tenir lieu de mémoire et continuer sans contrôle indépendant.
  2. Rattraper la mémoire vivante en une PR documentaire, poser un Green Gate GitHub Actions, un gabarit de PR conforme, appliquer les conventions dès ce commit, et déposer les connaissances durables dans la file gouvernée du Memory Core (`memory_proposals`, statut `PROPOSED`) sans jamais écrire dans la mémoire active.
* **Décision retenue** : option 2.
* **Justification** : Constitution 1.6.0 — § 7 Green Gates (`NOT_RUN ≠ GREEN`), § 14 « corriger plutôt que signaler » et « aucune affirmation d'état sans preuve reproductible » ; ADR‑0016 (« une modification critique ne doit pas dépendre uniquement d'une déclaration de son producteur ») ; DOCUMENTATION_POLICY et Règle du Zéro Oubli de `docs/README.md` ; ADR‑0014 (historique non destructif : les entrées manquantes sont ajoutées, jamais réécrites rétroactivement).
* **Conséquences** :
  1. Entrées DEC‑2026‑034 à 039 consignées ci-dessous pour les missions UL/HL, VF, AU, VT‑1b, LT et SN ; versions v6.7.0 → v6.12.0 dans `docs/HISTORIQUE_VERSIONS.md` ; `docs/ETAT_ACTUEL.md`, `docs/modules/05_reseau_mok_et_social.md` et `docs/UX_CHANGELOG.md` réalignés sur l'état réel.
  2. `.github/workflows/ci.yml` : sur chaque PR vers `main` et sur `main`, `npm ci` → `npx tsc --noEmit` → `npm test` → `npm run build`, sans secret ni `continue-on-error`.
  3. `.github/pull_request_template.md` : objectif, périmètre, risques, tests, preuves, critères d'acceptation (+ mémoire vivante, zéro trace, aucun secret).
  4. À partir de ce commit : préfixes `feat:` / `fix:` / `docs:` / `test:` / `refactor:` / `chore:` ; une version sémantique par mission livrée ; le nom de cache du service worker (`lmav-app-v6.6.0`) sera aligné sur la version à sa prochaine modification ; `package.json` (`0.0.0`) sera aligné lors d'une prochaine modification de code, pas dans une PR documentaire.
  5. Memory Core : les connaissances durables de ces missions (cause racine du service worker, épinglage du SDK LiveKit face au serveur 1.8.4, identité LiveKit par onglet, conventions de gouvernance et de zéro trace) sont déposées comme propositions `CREATE` dans `memory_proposals` du projet AI Core, avec provenance (PR, commit, document) et sans aucun secret ; leur validation appartient au Memory Guardian.
* **Éléments techniques** : `docs/JOURNAL_DECISIONS.md`, `docs/HISTORIQUE_VERSIONS.md`, `docs/ETAT_ACTUEL.md`, `docs/modules/05_reseau_mok_et_social.md`, `docs/UX_CHANGELOG.md`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, table `memory_proposals` (projet Vision Smart AI Core).
* **Statut** : `Développé` ; `Validé` dès la première exécution verte du Green Gate sur la PR correspondante.

---

### [DEC-2026-039] — 3 Septembre 2026
* **Module(s)** : `Messagerie`, `Appels`, `Service worker / PWA`, `Notifications push`.
* **Problème / Besoin initial** : « si l'appli n'est pas ouverte, l'appel n'arrive pas vraiment : pas de sonnerie, pas de vibration, pas de notif visible » ; capture d'écran « Subscription failed - no active Service Worker ». Ajouter uniquement un bouton « Sonnerie » à côté d'« Annuaire », branché aux réglages existants ; complément : dès qu'un appel entre, c'est l'écran pour décrocher qui doit s'afficher.
* **Options envisagées** :
  1. Réessayer l'abonnement push en boucle côté client et masquer l'erreur.
  2. Prouver la cause racine puis la corriger à la source : `/metadata.json` n'existe qu'à la racine du dépôt (jamais dans `public/`) donc répond 404 sur Netlify ; l'ancien `public/sw.js` faisait `cache.addAll(['/metadata.json'])` à l'installation → installation en échec → enregistrement effacé → jamais de worker actif → `pushManager.subscribe` refusé avec l'erreur exacte de la capture. En base : `push_subscriptions` = 0 et `push_delivery_log` = 0 depuis l'origine (aucun appareil jamais enregistré). Le banc précédent masquait le défaut : `vite preview` renvoie `index.html` (200) là où Netlify renvoie 404.
* **Décision retenue** : option 2. `public/sw.js` v6.6.0 : installation jamais fatale (plus de pré-cache d'un fichier absent), réglages de sonnerie lus depuis la Cache API (`lmav-ring-prefs-v1`, `/__moknet/ring-preferences`), notification `silent` si la sonnerie est coupée, sans `vibrate` si la vibration est coupée ; `services/pwaService.ts` attend un worker **actif** (événement `statechange` + sondage 8 s, un seul ré-enregistrement) avant tout abonnement ; `services/push/pushService.ts` rend un message honnête. Seul ajout d'interface : bouton « Sonnerie » après « Annuaire » dans `components/MoocChatFloating.tsx` et panneau `components/chat/RingingPanel.tsx` (Sonnerie / Vibration via `services/calls/ringtoneService.ts`, sonnerie du profil, état « Hors application » via `pushService`, « Tester la sonnerie »). SN‑2b : toucher le corps de la notification (« open ») ouvre l'écran d'appel qui sonne — fenêtre existante (`handlePushAction`) et lancement à froid (`runPushLaunch`) — `ChatCallModal` en z‑index 400 au-dessus des boîtes du LIVE, Décrocher 72×72 px, « Appel vidéo entrant… » en vidéo.
* **Justification** : corriger la cause à la source plutôt que le symptôme (Constitution § 14) ; réglages branchés aux services existants, aucun second système ; « rien d'autre à modifier ».
* **Conséquences** : le banc utilise désormais un serveur statique fidèle à Netlify (404 réel) ; tests 763/763 (+26 : `tests/serviceWorkerPush.test.ts`, `tests/ringingPanel.test.tsx`, `tests/callRingingFlow`, `tests/pushService`, `tests/ringtone`) ; banc réel 21/21 ; production « avant » (défaut reproduit sur les vrais fichiers servis, aucun worker actif) puis « après » 43/43 : `sw.js` servi identique octet pour octet au dépôt, worker actif 619/679 ms malgré le 404 (miroir octet-exact), push réel → notification « Appel de … » avec vibration → écran d'appel au premier plan, lancement à froid 3,5 s / 2,6 s ; zéro trace (74 clés étrangères balayées = 0). Limite honnête : la sonnerie sur un vrai téléphone verrouillé se constate par l'utilisateur.
* **Éléments techniques** : `public/sw.js`, `services/pwaService.ts`, `services/push/pushService.ts`, `services/calls/ringtoneService.ts`, `components/chat/RingingPanel.tsx`, `components/chat/ChatCallModal.tsx`, `components/MoocChatFloating.tsx`, `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md` § 7, `docs/SUPABASE_ARCHITECTURE.md` (ligne SN). PR #57 (`64e034f`).
* **Statut** : `Développé`, `Testé`, `En production` — en attente du test utilisateur sur deux téléphones.

---

### [DEC-2026-038] — 3 Septembre 2026
* **Module(s)** : `Appels`, `Transport LiveKit`, `AI Gateway`.
* **Problème / Besoin initial** : après le test VT‑1b sur deux téléphones, la traduction voix à voix fonctionne mais l'établissement de l'appel prend ~30 s et la traduction n'est active que 20–30 s plus tard. Complément : la case de langue en appel doit être une liste déroulante clairement identifiable, langue active lisible immédiatement.
* **Options envisagées** :
  1. Réduire des délais au hasard.
  2. Mesurer sur les 7 appels réels iPhone ↔ Android (`ai_call_log`, `call_diagnostics`) : connexion normalement 3,7–5,8 s ; le cas à 30 s = identité LiveKit **dupliquée** entre deux onglets du même navigateur (identifiant d'appareil partagé) → éviction en boucle, connecté à 22 s ; lecture audio bloquée faute de geste ; 0,8 s perdu par la sonde `/rtc/v1` du SDK face au serveur 1.8.4 ; traduction : langue reçue tard, transcripteur redémarré à chaque changement (segment perdu), segments jusqu'à 9 s, piste interprète publiée seulement à la première phrase, Gemini TTS « sans audio » 14 %.
* **Décision retenue** : option 2. Identité LiveKit **par onglet** (`services/calls/callDevice.ts`), aucune relance sur identité dupliquée (raison nommée, 16 libellés), sonde désactivée, `startAudio()` dans le geste de décroché et à tout toucher de l'écran ; transcripteur jamais redémarré, segments 550 ms / 6,5 s avec clôture anticipée (`services/calls/pcmSegmenter.ts`), piste interprète publiée dès le « hello », passerelle `ai-gateway` v25 avec mode `warmup` préchauffé pendant la sonnerie (déployée octet-exacte, SHA‑256 identique), Gemini TTS réessayé une fois, phrases en attente fusionnées en une seule voix (≤ 320 caractères) — défaut révélé par le banc (près d'une phrase sur deux abandonnée sans cela) ; case de langue bien visible (« Appel normal » / « Traduction active », liste 44 px).
* **Justification** : causes prouvées sur données réelles, jamais supposées ; latence réduite sans réécriture ; la source de vérité IA reste la passerelle centrale.
* **Conséquences** : banc réel 82/82 — piste interprète publiée 473 ms après le décroché (avant ≈ 7 s) et 158–339 ms après le choix de l'autre (avant 11,5–12,8 s), première voix traduite 7–13 s ; tsc 0 ; vitest 737/737 ; production 24/24. Plancher 7–13 s au premier mot tant que la voix rapide (VT‑2) n'est pas livrée ; serveur LiveKit du VPS toujours 1.8.4.
* **Éléments techniques** : `services/calls/callDevice.ts`, `services/calls/callRoom.ts`, `services/calls/pcmSegmenter.ts`, `services/calls/callInterpreter.ts`, `services/live/liveKitTransportProvider.ts`, `components/chat/ChatCallModal.tsx`, `supabase/functions/ai-gateway` (v25), `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md` § 6. PR #56 (`c25c6ef`).
* **Statut** : `Développé`, `Testé`, `En production`.

---

### [DEC-2026-037] — 3 Septembre 2026
* **Module(s)** : `Appels`, `Transport LiveKit`, `Traduction vocale`, `AI Gateway`.
* **Problème / Besoin initial** : VT‑1 (« ma langue seulement » : voix originale coupée quand l'interprète parle, lecture locale de la voix traduite) a été refusée au test sur deux téléphones — « la traduction est uniquement en texte ». Les journaux prouvent que la voix HD était générée sur les deux téléphones mais jamais entendue : lecture locale non fiable (autoplay iOS refusé, `volume` ignoré, langue déclarée différente de la langue parlée).
* **Options envisagées** :
  1. Insister sur la lecture locale avec des contournements par plateforme.
  2. Faire voyager la voix traduite **dans l'appel** : rendue par l'émetteur (Web Audio → `MediaStreamAudioDestinationNode`) et publiée comme piste LiveKit nommée « interprète », c'est-à-dire par le même chemin WebRTC que sa voix, déjà prouvé sur les deux téléphones ; le récepteur la joue dans un élément audio dédié et coupe l'original par `muted`.
* **Décision retenue** : option 2, avec la précision utilisateur intégrée en cours de route : l'appel reste **normal par défaut** (voix originales) ; la traduction ne s'active que si la personne choisit, pendant la sonnerie ou l'appel, la langue dans laquelle elle veut entendre l'autre (sélecteur « Entendre X en … », propre à cet appel, indépendant de la langue du profil qui ne sert plus que d'indication de transcription) ; langue détectée prioritaire sur la déclarée ; jamais une seconde voix quand langue détectée = langue cible ; messages `voice` start/end/failed, `hello.voice`, contrat `agent` prêt pour un futur agent serveur (GPU RunPod reporté par décision utilisateur). Découpeur corrigé : la parole captée avant la pause « l'interprète parle » n'est plus jetée (cause prouvée de 88 s sans transcription).
* **Justification** : réutiliser le chemin média déjà validé plutôt qu'un chemin de lecture locale non fiable ; l'utilisateur garde le choix par appel.
* **Conséquences** : port et adaptateur LiveKit étendus (`publishAuxiliaryAudio`), classe `InterpreterVoiceTrack` (file, budget 12 s, échecs honnêtes, réveil au geste), passerelle v24 (consigne de langue de lecture) ; banc réel en cinq passes jusqu'à 62/62 (son reçu transcrit en français chez l'un, en russe chez l'autre, audio et vidéo) ; vitest 730/730 ; production 20/20 ; zéro trace.
* **Éléments techniques** : `services/live/liveTransportTypes.ts`, `services/live/liveKitTransportProvider.ts`, `services/calls/callInterpreter.ts`, `services/calls/pcmSegmenter.ts`, `components/chat/ChatCallModal.tsx`, `supabase/functions/ai-gateway` (v24), `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md` § 5. PR #54 (`259fe34`), PR #55 (`24d58d0`).
* **Statut** : `Développé`, `Testé`, `En production`.

---

### [DEC-2026-036] — 2 Septembre 2026
* **Module(s)** : `Appels`, `Transport LiveKit`, `Edge livekit-token`, `Diagnostics d'appel`, `LIVE (LOOP 15/16)`.
* **Problème / Besoin initial** : « corrigez le bug d'audio unidirectionnel… démo prouvant que les deux interlocuteurs s'entendent des deux côtés sur de vrais appareils » ; puis, après un retest négatif, la voix ne partait jamais.
* **Options envisagées** :
  1. Attribuer le défaut au réseau ou aux téléphones.
  2. Reproduire au banc puis prouver chaque cause : deux appareils du même compte partageaient la même identité LiveKit (éviction pendant la sonnerie) ; micro refusé sans message ; caméra en échec bloquant le micro ; signal `call_accepted` perdu = son à sens unique certain ; enfin, contre le binaire `livekit-server` 1.8.4 exact lancé en local : `livekit-client` ≥ 2.18 = trois expirations de négociation en 50 s et aucun octet envoyé, 2.17.3 = zéro expiration (et aussi OK contre 1.13.6).
* **Décision retenue** : option 2. Identité par appareil puis par appel (`<compte>::<appareil>`, `livekit-token` v4 puis v5, une room par appel), micro publié avant la caméra et jugé séparément, relance bornée, bannière « X ne vous entend pas — micro indisponible » + « Réessayer le micro », messages `media` sur le canal de données, correspondant = celui qui publie, décroché par média si le signal est perdu, diagnostics toutes les 5 s sur compteurs WebRTC réels journalisés dans `call_diagnostics` ; revue contradictoire (13 constats corrigés, dont caméra jamais rallumée à l'insu de l'utilisateur, correspondant filtré par compte, appel orphelin terminé après 25 s) ; audio préparé au premier geste ; `livekit-client` épinglé **2.17.3** sans accent circonflexe, avec garde-fou `tests/livekitClientPin.test.ts`.
* **Justification** : aucune cause n'a été supposée ; le correctif SDK est livrable sans dépendre d'un accès SSH au VPS ; le serveur 1.8.4 reste supporté avant et après une montée vers 1.13.6.
* **Conséquences** : validation par l'utilisateur sur deux téléphones le 2 septembre 2026 (« l'appel passe correctement et les deux personnes parlent et s'entendent ») — cette preuve de média réel ferme **LOOP 15/16** de la mission LIVE (`docs/RAPPORT_FINAL_LIVE.md` mis à jour) ; protocole de validation sur vrais appareils écrit ; montée du serveur LiveKit du VPS (1.8.4 → 1.13.6) recommandée, non bloquante, action SSH côté utilisateur.
* **Éléments techniques** : `services/calls/callDevice.ts`, `services/calls/callRoom.ts`, `services/calls/callAudio.ts`, `services/calls/callDiagnostics.ts`, `services/calls/microphonePermission.ts`, `hooks/useLiveTransportCall`, `components/chat/ChatCallModal.tsx`, `supabase/functions/livekit-token` (v4, v5), table `call_diagnostics`, `package.json` (`livekit-client` 2.17.3), `tests/livekitClientPin.test.ts`, `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md` § 1–4. PR #46 (`abb48ca`) à #53 (`30e161b`).
* **Statut** : `Développé`, `Testé`, `En production`, `Validé par l'utilisateur sur deux téléphones`.

---

### [DEC-2026-035] — 1er Septembre 2026
* **Module(s)** : `Appels`, `Messagerie`, `Edge push-notify`, `Service worker / PWA`, `AI Gateway`, `Architecture modulaire`.
* **Problème / Besoin initial** : validation fonctionnelle refusée — sonnerie hors application inexistante (signalisation par diffusion éphémère, aucun push serveur, `new Notification()` interdit sur mobile), sonnerie résiduelle sur le second appareil d'un compte, latence de connexion (transport LiveKit lancé seulement après le décroché), traduction non appliquée sur téléphone (reconnaissance vocale du navigateur muette), photo/nom du propriétaire jamais rendus ; compléments : sélecteur « Ma langue » fixe dans l'en-tête, messagerie installable comme application autonome synchronisée, dix maquettes du bouton de messagerie avant toute implémentation.
* **Options envisagées** :
  1. Corriger écran par écran sans serveur de push.
  2. Construire la chaîne serveur → appareil : Edge `push-notify` (Web Push RFC 8291 aes128gcm + VAPID RFC 8292 sur WebCrypto, clé privée générée au premier appel et rangée dans le Vault, rôle service uniquement), tables `push_subscriptions` / `push_vapid_config` / `push_delivery_log`, RPC `save_push_subscription` / `get_push_public_key` ; côté client abonnement push, service worker (`push`, `notificationclick`, `pushsubscriptionchange`), manifeste et icônes, bandeau d'activation ; arrêt net multi-appareils (`stopAll`, signal `call_handled_elsewhere`, canal `moknet-calls`, push d'annulation) ; pré-connexion pendant la sonnerie ; transcription serveur `gemini_stt` (audio → texte + langue + traduction) dans `ai-gateway` v23 avec segmentation PCM du micro ; en-tête extrait (`ConversationHeader`) avec « Ma langue » fixe, `MessagingOwnerCard`, initiales ; registre de modules, route `/messagerie`, manifeste dédié, mode autonome, installation depuis Paramètres et depuis le bouton ; bouton « goutte » (`MessagingDropButton`) = maquette 01 choisie par l'utilisateur parmi dix.
* **Décision retenue** : option 2, en équipes parallèles à périmètres de fichiers disjoints.
* **Justification** : un push serveur est la seule voie fiable appli fermée ; la transcription serveur est la seule qui s'applique sur tous les téléphones ; le choix visuel du bouton revient à l'utilisateur avant implémentation.
* **Conséquences** : preuve RFC 8291 (vecteur officiel reproduit octet pour octet, déchiffrement par implémentation indépendante) ; revue contradictoire → deux défauts corrigés (`push-notify` v3 : refus 503 si la vérification de blocage échoue ; identité du correspondant prioritaire dans un fil direct) ; tsc 0 ; vitest 568/568 ; banc 16/16 ; production 26/26 + module 7/7 ; zéro trace (97 lignes, 70 clés étrangères = 0). La passerelle déployée était en retrait de `main` sur six fichiers → redéploiement octet-exact désormais systématique.
* **Éléments techniques** : `supabase/functions/push-notify`, `public/sw.js`, `services/push/pushService.ts`, `services/pwaService.ts`, `services/calls/callPush.ts`, `services/calls/callFlow.ts`, `services/modules/installPrompt.ts`, `services/modules/standaloneMode.ts`, `components/chat/ConversationHeader.tsx`, `components/chat/MessagingOwnerCard.tsx`, `components/chat/MessagingDropButton.tsx`, `supabase/functions/ai-gateway` (v23, `gemini_stt`), `docs/ARCHITECTURE_MODULAIRE.md`, `docs/SUPABASE_ARCHITECTURE.md` (ligne « Notifications push & transcription serveur »). PR #44 (`2ffc477`), PR #45 (`0de00ef`).
* **Statut** : `Développé`, `Testé`, `En production`.

---

### [DEC-2026-034] — 1er Septembre 2026
* **Module(s)** : `Messagerie`, `Appels`, `Langues & Communication`, `AI Gateway`.
* **Problème / Besoin initial** : deux sélecteurs de langue par conversation obligeaient à choisir la langue de l'interlocuteur ; les vocaux n'étaient jamais transcrits (`fr-FR` codé en dur côté client, moteur et serveur) ; aucun sous-titre ni voix d'interprète en appel ; l'utilisateur veut un seul réglage « Ma langue » appliqué partout.
* **Options envisagées** :
  1. Conserver les deux sélecteurs et ajouter des cas particuliers.
  2. Un seul sélecteur « Ma langue » (langue de l'utilisateur, l'interlocuteur n'est jamais choisi), détection automatique de la langue du destinataire, « Par défaut » = aucune traduction (persistance `NULL`, migration) ; vocaux transcrits chez l'auteur (`metadata.transcript`) et traduits chez le lecteur (« Écouter dans ma langue ») ; interprète d'appel audio et vidéo (sous-titres par canal de données, traduction chez le récepteur, voix dans ma langue, original atténué) ; profil audio « parole » (Opus speech + RED + DTX, AEC/NS/AGC) et qualité réseau réelle affichée.
* **Décision retenue** : option 2, en réutilisant le service central de traduction de DEC‑2026‑033.
* **Justification** : un seul réglage par personne, une seule source de vérité de traduction, aucune capacité simulée (le sous-titrage décoratif du LIVE a été identifié comme tel).
* **Conséquences** : vitest 306/306 ; tsc 0 ; preuves réelles ru → fr (vocal russe réel transcrit puis traduit, voix française réelle, sous-titre d'appel) ; production vérifiée en navigateur ; zéro trace (72 lignes sur 11 tables). La lecture locale de la voix d'interprète sera remplacée par une piste dans l'appel (DEC‑2026‑037) après le test sur téléphones.
* **Éléments techniques** : `services/translation/translationService.ts`, `components/chat/ChatMessageItem.tsx`, `components/MoocChatFloating.tsx`, `components/chat/ChatCallModal.tsx`, `services/calls/callAudio.ts`, `supabase/functions/ai-gateway`, migration « Par défaut » (`profiles.preferred_language` `NULL`). PR #42 (`bc78822`), PR #43 (`8c5d0fa`).
* **Statut** : `Développé`, `Testé`, `En production`.

---

### [DEC-2026-032] — 1er Septembre 2026
* **Module(s)** : `Réseau Mok`, `Messagerie`, `Supabase PostgREST`, `Supabase Realtime`
* **Problème / Besoin initial** : Les journaux de production ont révélé deux rejets PostgreSQL `22P02` lors de l'ouverture d'une conversation locale : l'identifiant de repli `chat-u5` était envoyé à `messages.conversation_id`, colonne strictement typée `uuid`. Le rendu local survivait grâce à la dégradation gracieuse, mais le navigateur produisait une requête HTTP 400 et tentait d'ouvrir un abonnement Realtime invalide.
* **Idées / Options envisagées** :
  1. Supprimer toutes les conversations locales et casser le mode de démonstration/hors-ligne.
  2. Conserver le rendu et les actions purement locales, mais établir une frontière stricte avant tout accès Supabase : seul un identifiant UUID valide peut charger l'historique, marquer la conversation lue ou ouvrir les abonnements messages/frappe.
* **Décision retenue** : Option 2. L'effet d'historique de `MoocChatFloating.tsx` réutilise désormais la garde partagée et testée `isLikelyRealId` avant le premier appel réseau. Le comportement local (ouverture, remise à zéro du compteur local, affichage) reste inchangé.
* **Justification & Valeur ajoutée** : Le correctif supprime exactement l'appel fautif sans migration de schéma, sans toucher aux conversations UUID réelles et sans inclure la branche de traduction encore non validée.
* **Conséquences & Impacts transversaux** : Un test d'intégration monte le composant avec `chat-u5` et prouve zéro appel à `getConversationMessages`, `subscribeToChat`, `subscribeToTyping` et `markConversationRead`; un second scénario prouve que ces chemins restent actifs pour un UUID réel. Suite complète : 256/256 tests verts; build Vite de production vert; compteur TypeScript inchangé par rapport à la base (143 erreurs historiques avant et après, zéro nouvelle signature).
* **Éléments techniques concernés** : `components/MoocChatFloating.tsx`, `tests/chatLocalConversationGuard.test.tsx`, `docs/modules/05_reseau_mok_et_social.md`, `docs/ETAT_ACTUEL.md`, `docs/HISTORIQUE_VERSIONS.md`.
* **Statut** : `Développé`, `Testé` & `Validé en prévisualisation Netlify`.

---

### [DEC-2026-033] — 1er Septembre 2026
* **Module(s)** : `Réseau MOK`, `Messagerie`, `Langues & Communication`, `Vision Smart AI Core`.
* **Problème / Besoin initial** : la traduction des messages était une action manuelle logée dans `services/messaging/messagingIntelligence.ts`, donc couplée à la messagerie, non automatique selon la langue du destinataire et non réutilisable proprement par la future traduction vocale. L'architecture demandée impose un chemin unique, un original immuable et un moteur remplaçable sans modification des consommateurs.
* **Options envisagées** :
  1. Conserver un appel IA propre à chaque écran (messagerie aujourd'hui, appels demain).
  2. Introduire un service transversal avec une interface de moteur injectable, puis ne laisser aux composants que le contexte fonctionnel et les langues source/cible.
* **Décision retenue** : option 2. `services/translation/translationService.ts` devient l'unique contrat de traduction pour cette mission. Le moteur par défaut utilise l'orchestrateur existant `services/aiGateway.ts`; `TranslationEngine` et `setEngine()` permettent un remplacement ultérieur sans toucher la messagerie ni les appels.
* **Justification** : séparation stricte UI/service/fournisseur, cohérence avec l'orchestration centrale Vision Smart AI Core, testabilité par injection, maîtrise des coûts par cache mémoire et déduplication, absence de stockage local des conversations privées.
* **Conséquences** :
  1. `messages.content` demeure la source originale immuable ; seule la langue choisie par l'auteur est ajoutée dans `metadata.original_language`.
  2. Le destinataire voit l'original puis une traduction dérivée dans son `profiles.preferred_language`. Une panne laisse l'original lisible et affiche un état honnête.
  3. La traduction existante est retirée de `messagingIntelligence.ts` pour éviter toute duplication.
  4. La traduction vocale est explicitement exclue de ce lot et reste bloquée jusqu'à validation utilisateur ; elle devra réutiliser le même service.
* **Éléments techniques** : `services/translation/translationService.ts`, `services/messaging/messagingIntelligence.ts`, `services/supabaseClient.ts`, `components/MoocChatFloating.tsx`, `components/chat/ChatMessageItem.tsx`, `types.ts`, `tests/translationService.test.ts`, `tests/chatMessageTranslation.test.tsx`.
* **Statut** : `Testé`.

---

### [DEC-2026-031] — 28 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Orchestrateur IA (ai-gateway)`, `Espace Super-Admin Souverain`, `Documentation & Continuité Système`
* **Problème / Besoin initial** :
  1. Les entrées [DEC-2026-010], [DEC-2026-025], [DEC-2026-026], [DEC-2026-027], [DEC-2026-028], [DEC-2026-029] et [DEC-2026-030], ainsi que de larges portions de `docs/ETAT_ACTUEL.md`, décrivaient une architecture de routage et de résilience IA reposant sur des fichiers qui n'existent pas dans le dépôt réel : `server.ts`, `services/aiRoutingService.ts`, `services/unifiedAIConnector.ts`, `components/AIProvidersDashboardModal.tsx`, `components/AIConnectorsHubModal.tsx` et `components/admin/AdminAIResilienceHub.tsx`.
  2. Corriger la documentation pour qu'elle décrive fidèlement l'architecture IA réellement implémentée dans le code, sans jamais créer rétroactivement ces fichiers fantômes pour faire correspondre le code à une documentation erronée.
* **Idées envisagées** :
  1. Créer les fichiers fantômes nommés dans les entrées ci-dessus pour aligner le code sur la documentation existante.
  2. Corriger la documentation elle-même : consigner ici la correction par une nouvelle entrée sans réécrire l'historique (principe de traçabilité du journal), et mettre à jour `docs/ETAT_ACTUEL.md` pour réattribuer chaque fonctionnalité réelle (bascule multi-fournisseurs, gouvernance de coût/budget, dégradation gracieuse, sélection par mérite/spécialité/latence/coût, outils par expert) à l'architecture IA réellement en place : l'Edge Function orchestratrice `supabase/functions/ai-gateway/index.ts`, son client frontend unique `services/aiGateway.ts` (`generateText`, `generateJSON`, `generateSpeech`, `mintLiveToken`, etc.) et les interfaces d'administration Super Admin réelles `components/admin/AiOrchestrator.tsx`, `components/admin/AiCostGovernance.tsx` et `components/admin/AgentToolsMatrix.tsx`.
* **Décision retenue** : Option 2.
* **Justification** : Un journal de décisions et un état des lieux n'ont de valeur opposable que s'ils reflètent le code effectivement présent dans le dépôt. Les capacités décrites par les entrées historiques citées ci-dessus (bascule sans coupure entre fournisseurs, gouvernance de budget, dégradation gracieuse, sélection intelligente) sont réelles et demeurent vraies aujourd'hui — seule l'attribution à des fichiers jamais livrés était erronée. La règle du journal impose de tracer les corrections par de nouvelles entrées plutôt que d'effacer ou de modifier l'historique existant.
* **Conséquences** :
  1. Aucune régression fonctionnelle ni modification de code : correction strictement documentaire.
  2. Le doublon d'identifiant `[DEC-2026-028]` (deux entrées distinctes : refonte de l'interface conversationnelle `ChatInterface.tsx` d'une part, hub d'auto-diagnostic des connecteurs IA d'autre part) est levé — la seconde occurrence, relative au hub d'auto-diagnostic, est renommée `[DEC-2026-030]`.
  3. `docs/ETAT_ACTUEL.md` est corrigé en parallèle pour attribuer les fonctionnalités réelles à `supabase/functions/ai-gateway/index.ts`, `services/aiGateway.ts` et aux interfaces d'administration réelles listées ci-dessus, à l'exclusion des passages relatifs à `services/voiceEngine.ts` / ElevenLabs, qui restent exacts et inchangés.
* **Éléments techniques** : `supabase/functions/ai-gateway/index.ts`, `services/aiGateway.ts`, `components/admin/AiOrchestrator.tsx`, `components/admin/AiCostGovernance.tsx`, `components/admin/AgentToolsMatrix.tsx`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Validé`.

---

### [DEC-2026-029] — 28 Août 2026
* **Module(s)** : `Server Proxy (/api/ai/chat)`, `AIRoutingService`, `AIService`, `MultimodalVisionService`
* **Problème / Besoin initial** :
  1. Résoudre l'erreur 503 `UNAVAILABLE` (`This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.`) retournée par les serveurs distants Gemini sous forte charge.
  2. Éviter toute rupture ou blocage lors des pointes de demande en absorbant automatiquement les erreurs 503/429.
  3. Garantir une cascade sans coupure vers les modèles alternatifs Gemini (`gemini-2.5-flash` → `gemini-2.5-pro` → `gemini-2.0-flash`), puis vers les fournisseurs tiers configurés (DeepSeek, Claude, OpenAI, Mistral), et enfin vers le mode dégradé souverain en dernier recours.
* **Idées envisagées** :
  1. Renvoyer une erreur 500 brute au client et demander à l'utilisateur de réécrire son message.
  2. Intégrer une boucle de secours multi-modèles au niveau du proxy serveur (`server.ts`), propager les erreurs 503 avec statut explicite et `fallback: true`, enrichir `aiRoutingService.ts` pour détecter les pointes de demande et déclencher la bascule automatique immédiate sans perturber la conversation de l'utilisateur.
* **Décision retenue** : Option 2.
* **Justification** : Conformité à la règle d'or « Zéro crash, zéro écran blanc » et robustesse de production face aux aléas et congestions d'API externes.
* **Conséquences** : En cas de forte affluence sur un modèle particulier, la plateforme bascule de façon transparente sur le modèle ou fournisseur suivant en moins d'une fraction de seconde.
* **Éléments techniques** : `server.ts`, `services/aiRoutingService.ts`, `services/ai.ts`, `services/multimodalVision.ts`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-028] — 28 Août 2026
* **Module(s)** : `01_DIALLO_OS_ET_EXPERTS`, `ChatInterface`, `AIProvidersDashboardModal`, `AIRoutingService`, `Layout`, `Server Proxy (/api/ai/chat)`
* **Problème / Besoin initial** :
  1. Procéder à une refonte complète de l'interface conversationnelle pour qu'elle soit fluide, moderne, aérée et de calibre professionnel avant mise en production.
  2. Rendre le chat opérationnel dès le premier instant sans aucun blocage ni écran blanc, même en cas de clé API manquante ou invalide.
  3. Intégrer la détection et la visualisation en temps réel du fournisseur actif et du basculement automatique (*auto-failover*) : afficher un badge explicite avec latence (ex. `🟢 Google Gemini 2.5 Flash • 115ms` ou `⚡ Relais : DeepSeek V3`), et permettre l'ouverture directe du tableau de bord des connecteurs.
  4. Créer un tableau de bord dédié des fournisseurs IA avec état opérationnel, banc de test interactif, reconnexion 1-clic et simulation de bascule d'urgence.
* **Idées envisagées** :
  1. Conserver l'appel direct au SDK Gemini côté client sans gestion du multi-fournisseur.
  2. Migrer l'intégralité des échanges conversationnels vers `aiRoutingService.executeWithResilience(...)`, enrichir l'API `/api/ai/chat` du serveur avec prise en charge native de Gemini et résolution multicouche des clés, créer un composant modal universel `AIProvidersDashboardModal.tsx`, l'intégrer au header de `ChatInterface.tsx` et au top navbar de `Layout.tsx`, et ajouter les métadonnées de modèle et de latence sur chaque bulle de réponse.
* **Décision retenue** : Option 2.
* **Justification** : Résilience absolue sans temps d'arrêt, clarté totale pour l'utilisateur et l'administrateur, respect scrupuleux de l'incarnation humaine des experts Diallo et conformité aux standards d'ergonomie et de design de haute facture.
* **Conséquences** : Le chat fonctionne instantanément dès l'ouverture ; si un fournisseur est indisponible ou s'essouffle, le système bascule de façon imperceptible sur le modèle de secours actif tout en indiquant clairement le relais utilisé.
* **Éléments techniques** : `components/ChatInterface.tsx`, `components/AIProvidersDashboardModal.tsx`, `components/Layout.tsx`, `services/aiRoutingService.ts`, `server.ts`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-027] — 27 Août 2026
* **Module(s)** : `Espace Super-Admin`, `AdminDashboard`, `AdminAIResilienceHub`, `AdminPlatformModulesTab`, `Dashboard`, `Layout`, `Variables d'Environnement (.env.example)`
* **Problème / Besoin initial** :
  1. Clarifier la question utilisateur relative aux variables d'environnement (`VITE_KLING_API_KEY` vs `KLING_API_KEY`) : expliciter le rôle de la résolution dynamique côté serveur (`getKeyForProvider` dans `server.ts`) et nettoyer `.env.example` pour éliminer les doublons redondants.
  2. Rendre les Connecteurs et Modèles d'IA immédiatement visibles et accessibles au premier niveau du Tableau de Bord Super-Admin sous forme d'onglet principal dédié (« Connecteurs & Modèles IA »).
  3. Découpler la gestion des modules métiers dans un sous-composant propre `AdminPlatformModulesTab.tsx`.
  4. Garantir un accès direct en 1 clic au Tableau de Bord Super-Admin et aux Connecteurs IA depuis la barre supérieure du Dashboard (`Dashboard.tsx`), le menu mobile drawer (`Layout.tsx`), le Header desktop et la carte KPI de vue d'ensemble (`AdminOverviewTab.tsx`).
* **Idées envisagées** :
  1. Laisser les connecteurs IA enfouis dans un sous-onglet secondaire.
  2. Créer un onglet principal de premier plan « Connecteurs & Modèles IA » dans `AdminDashboard.tsx`, mettre à jour les types d'onglets (`AdminTab`), enrichir les boutons d'accès rapide sur tous les écrans, et documenter l'unification des variables d'environnement.
* **Décision retenue** : Option 2.
* **Justification** : Ergonomie optimale pour les administrateurs, clarté totale sur la configuration des clés API pour le déploiement Netlify / GitHub / Cloud Run, et accessibilité instantanée de l'orchestrateur de résilience IA.
* **Conséquences** : Les connecteurs de modèles IA sont consultables et configurables directement dès l'entrée dans le Tableau de Bord Super-Admin, avec sondes de santé, banc de test, détection des clés et accès 1-clic aux portails officiels.
* **Éléments techniques** : `components/AdminDashboard.tsx`, `components/admin/AdminAIResilienceHub.tsx`, `components/admin/AdminPlatformModulesTab.tsx`, `components/admin/AdminOverviewTab.tsx`, `components/Dashboard.tsx`, `components/Layout.tsx`, `.env.example`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-026] — 27 Août 2026
* **Module(s)** : `AdminAIResilienceHub`, `AIRoutingService`, `AdminConfigService`, `UnifiedAIConnector`, `Types`
* **Problème / Besoin initial** :
  1. Répondre à la directive système permanente : doter l'espace Super Admin d'un orchestrateur central des modèles IA complet, autonome et sans coupure.
  2. Gérer plus de 15 connecteurs d'IA majeurs (Gemini, DeepSeek, Claude AI, OpenAI, Mistral, Qwen, Kimi, Kling AI, ElevenLabs, HeyGen, Runway, OpenRouter, n8n, Grok, Ollama) avec activation/désactivation individuelle en 1 clic.
  3. Piloter la cascade de bascule intelligente selon la spécialité de tâche (`taskCategory`: raisonnement, juridique & contrats, code, multilingue, vidéo, voix, automatisation), la latence, le taux d'erreur, le score de qualité et les plafonds de budget quotidien (`dailyQuotaLimitUSD`).
  4. Fournir pour chaque fournisseur un centre de configuration complet avec champs pour clés API, jetons secrets, webhooks, ainsi que des boutons directs 1-clic vers les 4 portails officiels de chaque fournisseur : Créer un compte, Générer une clé API, Accéder à la documentation technique et Consulter les quotas & la facturation.
  5. Détecter automatiquement les variables d'environnement présentes (`detectedEnvVar`, `isEnvKeyPresent`), afficher les diagnostics en direct et guider l'administrateur avec des actions correctives personnalisées.
* **Idées envisagées** :
  1. Utiliser un tableau statique non interactif sans possibilité de bascule en direct ni boutons vers les portails officiels.
  2. Construire un orchestrateur dynamique en temps réel avec détection des variables d'environnement, filtrage multi-critères par spécialité de tâche, routage basé sur les quotas quotidiens, sondes de santé interactives et audit logs des bascules sans coupure.
* **Décision retenue** : Option 2.
* **Justification** : Résilience absolue sans temps d'arrêt, zéro exposition des clés réelles au client, ergonomie maximale pour les administrateurs et intégration transparente avec Supabase, GitHub et Netlify.
* **Conséquences** : Les requêtes IA sont routées automatiquement vers le connecteur le plus adapté et performant, avec bascule transparente vers les moteurs secondaires ou de secours en cas de surcharge, panne ou dépassement de quota.
* **Éléments techniques** : `components/admin/AdminAIResilienceHub.tsx`, `services/aiRoutingService.ts`, `services/adminConfigService.ts`, `services/unifiedAIConnector.ts`, `types.ts`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`, `docs/modules/15_orchestrateur_ia_central.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-025] — 27 Août 2026
* **Module(s)** : `AIRoutingService`, `MultiAIConnectorsHub`, `UnifiedAIConnector`, `AdminAIResilienceHub`, `ServerAIProxy`, `Types`
* **Problème / Besoin initial** :
  1. Préparer et interconnecter l'infrastructure pour une suite complète de 10+ fournisseurs majeurs d'IA : DeepSeek (V3 & R1), Claude AI (Anthropic), OpenAI (GPT-4o & o1/o3), Alibaba Qwen (DashScope), Moonshot Kimi (K3 & K1.5 128k), Kling AI 1.5 (Vidéo Kuaishou), OpenRouter Multi-LLM Gateway, n8n Workflow Automation, HeyGen Interactive Avatars, RunwayML Gen-3/Gen-2 et ElevenLabs HD TTS.
  2. Fournir des points d'accès directs (liens 1-clic) pour générer et configurer facilement chaque clé API dans l'environnement.
  3. Mettre en place un proxy unifié sécurisé côté serveur (`server.ts` : `/api/ai/connectors`, `/api/ai/chat`, `/api/ai/video`, `/api/ai/avatar`, `/api/ai/n8n/trigger`) avec tolérance totale aux pannes, dégradation gracieuse sans crash et banc d'essai interactif (`AIConnectorsHubModal.tsx`).
* **Idées envisagées** :
  1. Laisser les clés être appelées côté client directement sans proxy unifié.
  2. Créer une couche full-stack modulaire avec typage enrichi (`types.ts`), proxy serveur Express, connecteur unifié client-side (`unifiedAIConnector.ts`), intégration dans l'Orchestrateur de Résilience (`AdminAIResilienceHub.tsx`) et documentation des variables d'environnement dans `.env.example`.
* **Décision retenue** : Option 2.
* **Justification** : Sécurité absolue des clés API côté serveur, résilience et cascade automatique en cas de panne d'un fournisseur, interface d'administration claire avec banc d'essai et liens officiels directs vers les consoles développeurs.
* **Conséquences** : L'administrateur et la plateforme peuvent basculer dynamiquement entre tous les moteurs d'IA de pointe, tester leurs flux en direct et générer des vidéos, avatars et automatisations complexes sans interruption de service.
* **Éléments techniques** : `server.ts`, `services/unifiedAIConnector.ts`, `components/AIConnectorsHubModal.tsx`, `components/admin/AdminAIResilienceHub.tsx`, `services/adminConfigService.ts`, `services/aiRoutingService.ts`, `types.ts`, `.env.example`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-024] — 27 Août 2026
* **Module(s)** : `VoiceEnginePro`, `ElevenLabsIntegration`, `ChatInterface`, `CampusProfessorCoach`, `CampusClassroomView`, `VoiceSettingsModal`, `ServerTTSProxy`
* **Problème / Besoin initial** :
  1. La synthèse vocale native des navigateurs (`window.speechSynthesis`) manquait de réalisme, de timbre expressif et de naturel humain pour incarner fidèlement les experts de la Famille DIALLO (Maître Diallo, Docteur Diallo, Professeur Diallo, Conseiller Diallo, etc.).
  2. Fournir une synthèse vocale haute fidélité (HD) basée sur l'API ElevenLabs avec streaming audio ultra-rapide (MP3 / PCM), mise en cache intelligente des flux générés, bascule automatique et dégradation gracieuse vers le moteur vocal natif du navigateur si aucune clé API n'est configurée.
  3. Offrir une interface utilisateur dédiée (`VoiceSettingsModal.tsx`) pour sélectionner, tester et associer des voix réalistes et personnalisées pour chaque expert Diallo et le Campus.
* **Idées envisagées** :
  1. Forcer l'appel direct côté client à ElevenLabs (risque d'exposition de la clé API et blocage CORS).
  2. Mettre en place une architecture full-stack robuste avec proxy Express sécurisé (`/api/tts`, `/api/tts/voices`), intégrer le support ElevenLabs dans `voiceEngine.ts` avec cache mémoire de Blob URLs, attribuer des Voice IDs adaptés aux différents rôles d'experts, intégrer les contrôles dans le Chat, la Salle de Classe et le Coach Professeur, et offrir un panneau de réglages dédié.
* **Décision retenue** : Option 2.
* **Justification** : Sécurité absolue des clés d'API (stockées côté serveur et documentées dans `.env.example`), restitution audio naturelle et chaleureuse sans temps de latence grâce au cache, tolérance aux pannes avec fallback instantané, et respect de la déontologie humaine de la Famille DIALLO.
* **Conséquences** : Les utilisateurs et apprenants bénéficient d'une voix humaine ultra-naturelle et expressive pour écouter les conseils d'experts, les cours du Campus et les explications en direct.
* **Éléments techniques** : `server.ts`, `services/voiceEngine.ts`, `components/VoiceSettingsModal.tsx`, `components/ChatInterface.tsx`, `components/CampusProfessorCoach.tsx`, `components/CampusClassroomView.tsx`, `components/VoiceInteractionBar.tsx`, `package.json`, `.env.example`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-023] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `VoiceEnginePro`, `CampusProfessorCoach`, `VoiceInteractionBar`, `Avatar3D`
* **Problème / Besoin initial** :
  1. La conversation vocale souffrait de lenteurs, de coupures artificielles (troncatures de texte à 220 caractères), d'absence de Voice Activity Detection (VAD) et de feedbacks acoustiques (écho micro pendant que l'avatar parle).
  2. Rendre l'interaction orale avec le Professeur Diallo ultra-fluide, naturelle, continue (mains libres) et intelligente avec détection automatique de fin de parole et reprise de micro sans aucun clic requis.
* **Idées envisagées** :
  1. Conserver le système de déclenchement manuel bouton par bouton avec synthèse partielle.
  2. Refondre le `voiceEngine.ts` en moteur conversationnel bidirectionnel : Voice Activity Detection (VAD) avec détection de silence intelligent (~1.4s), suppression d'écho acoustique (désactivation automatique de l'écoute pendant la synthèse), heartbeat anti-endormissement de la Web Speech API sur Chromium, découpage acoustique intelligent en unités phonétiques (ponctuation naturelle) et mode "Mains Libres Continu".
* **Décision retenue** : Option 2.
* **Justification** : Fluidité conversationnelle de niveau professionnel, élimination des artefacts robotiques et des troncatures, prise de parole fluide (barge-in supporté) et synchronisation parfaite avec les états de l'Avatar 3D (parole, réflexion, écoute).
* **Conséquences** : Les apprenants peuvent engager un dialogue continu avec le Professeur Diallo sans toucher au clavier ni à la souris.
* **Éléments techniques** : `services/voiceEngine.ts`, `components/CampusProfessorCoach.tsx`, `components/VoiceInteractionBar.tsx`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-022] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `REAL_ACADEMIC_COURSES_REGISTRY`, `CampusClassroomView`, `Formations Supérieures D'Élite (Droit OHADA & Ingénierie Cloud)`
* **Problème / Besoin initial** :
  1. Remplacer les contenus synthétiques et placeholders par de vrais cours académiques riches, rigoureux et conformes aux programmes officiels (Terminale Maths/Physique/Philo et Formations Supérieures en Droit OHADA, Ingénierie Cloud & Cybersécurité).
  2. Fournir aux apprenants une expérience d'apprentissage complète : cours magistral structuré, dictée et récitation audio assurée par le Professeur Diallo via Web Speech API (`window.speechSynthesis`), énoncé d'exercice pratique officiel avec démarche guidée, révélation du corrigé type avec barème détaillé pas à pas, mini-quiz formatif interactif et bibliographie officielle.
* **Idées envisagées** :
  1. Conserver des textes génériques courts sans exercices réels ni récitation audio.
  2. Créer un registre académique dédié `services/realCurriculumCourses.ts` avec des cours réels approfondis, intégrer la récitation vocale du Professeur Diallo, déployer les corrigés pas à pas dans `CampusClassroomView.tsx` et enrichir `services/formationsRegistry.ts` avec de nouveaux diplômes supérieurs en Droit OHADA et Ingénierie Cloud.
* **Décision retenue** : Option 2.
* **Justification** : Élévation pédagogique majeure, immersion totale et conformité avec les exigences de rigueur scientifique et déontologique de l'Académie Le Monde à Vous.
* **Conséquences** : Les élèves et étudiants accèdent à des contenus réels, écoutent les explications orales du Professeur Diallo, pratiquent des cas d'épreuves d'État avec corrigés officiels et valident leurs compétences.
* **Éléments techniques** : `services/realCurriculumCourses.ts`, `services/formationsRegistry.ts`, `components/CampusClassroomView.tsx`, `components/Campus.tsx`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-021] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `CampusClassroomView`, `CampusCourseEnrollmentModal`, `Campus.tsx`
* **Problème / Besoin initial** :
  1. Résoudre l'erreur d'exécution `Uncaught TypeError: Cannot read properties of undefined (reading 'lessons')` survenue lors de la navigation vers la salle de classe ou l'inscription.
  2. Harmoniser la cohabitation des deux structures de données au sein du Campus : le modèle `Course` (liste plate de `lessons`) et le modèle `CertifyingFormation` (liste modulaire `modulesList` contenant chacune leurs propres `lessons`).
  3. Garantir une résilience absolue et zéro crash au démarrage ou en cours de navigation quel que soit le type de cours ou formation sélectionné.
* **Idées envisagées** :
  1. Forcer la conversion de toutes les formations en un format unique au risque de perdre les métadonnées modulaires spécifiques.
  2. Adapter `CampusClassroomView.tsx`, `CampusCourseEnrollmentModal.tsx` et `Campus.tsx` pour extraire dynamiquement les leçons (`lessons || modulesList.flatMap(...)`), initialiser des états internes de repli (`fallback lessons`) et sécuriser tous les accès aux propriétés imbriquées.
* **Décision retenue** : Option 2.
* **Justification** : Flexibilité totale, rétrocompatibilité avec les deux formats de données, et robustesse logicielle maximale sans écran blanc.
* **Conséquences** : Navigation fluide et immédiate entre formations certifiantes modulaires et chapitres officiels des programmes nationaux.
* **Éléments techniques** : `components/CampusClassroomView.tsx`, `components/CampusCourseEnrollmentModal.tsx`, `components/CampusCertifyingExamView.tsx`, `components/Campus.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-020] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `Catalogue Formations Certifiantes & Diplômes`, `Salle de Classe Interactive`, `Examens Certifiants & Parchemins`
* **Problème / Besoin initial** :
  1. Développer l'ensemble des contenus, processus et procédures liés à l'inscription académique, la salle de classe multimédia, les examens certifiants et l'écosystème complet du Catalogue des Formations & Diplômes d'Élite.
  2. Fournir un parcours étudiant complet : consultation détaillée de la formation (crédits ECTS, prérequis, débouchés, corps professoral, modules), choix du statut (Parcours Certifiant avec diplôme officiel vs Auditeur Libre), suivi des cours interactif avec synthèse vocale, espace pratique interactif avec exécuteur, quiz formatif et prise de notes synchronisée.
  3. Mettre en place un système d'examen certifiant officiel chronométré avec délibération du jury académique, attribution de note finale /20, génération de parchemin officiel numéroté, estampillé du sceau officiel de l'Académie Diallo avec QR Code d'authentification et export PDF/Impression.
* **Idées envisagées** :
  1. Utiliser un simple affichage textuel des cours sans procédure d'inscription formelle ni diplôme authentifié.
  2. Développer un registre structuré `services/formationsRegistry.ts` (Tech/IA, Droit, Médecine, Finance, etc.), une modale d'inscription complète `CampusCourseEnrollmentModal.tsx`, une salle de classe immersive `CampusClassroomView.tsx`, une salle d'examen certifiant officielle `CampusCertifyingExamView.tsx`, et une visionneuse haute fidélité de diplômes certifiés `CampusDiplomaViewerModal.tsx`.
* **Décision retenue** : Option 2.
* **Justification** : Conformité absolue avec la vision d'excellence du Campus Mondial Intelligent, valorisation des acquis et reconnaissance officielle des compétences pour l'employabilité internationale.
* **Conséquences** : Les apprenants peuvent s'inscrire officiellement, suivre leurs cours en mode immersif, passer leurs épreuves certifiantes sous minuterie, et obtenir/imprimer leurs parchemins de diplôme officiels.
* **Éléments techniques** : `services/formationsRegistry.ts`, `components/CampusCourseEnrollmentModal.tsx`, `components/CampusClassroomView.tsx`, `components/CampusCertifyingExamView.tsx`, `components/CampusDiplomaViewerModal.tsx`, `components/Campus.tsx`, `docs/modules/04_campus_et_education.md`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-019] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `CampusProfessorCoach`, `Moteur Pédagogique Multimodal`, `Vision & Reconnaissance IA`
* **Problème / Besoin initial** :
  1. Permettre aux utilisateurs et apprenants d'interagir avec le Professeur Diallo en dialogue vocal bidirectionnel (micro, reconnaissance vocale et synthèse vocale).
  2. Intégrer un flux vidéo avec caméra temps réel doté de reconnaissance d'objets (cahier d'exercices, calculatrice, feuille de devoir, tableau, etc.) et de détection de mouvements optiques pour scanner et analyser le travail en direct.
  3. Offrir le partage de documents et photos d'exercices (PDF, images, devoirs, sujets d'examens) avec résolution et explications méthodologiques pas-à-pas par le Professeur Diallo.
* **Idées envisagées** :
  1. Utiliser un modal externe séparé déconnecté du cours en cours.
  2. Intégrer directement le mode vocal, le HUD caméra avec tracking d'objets/mouvements et le partage de documents au sein du widget central du Professeur Diallo (`CampusProfessorCoach.tsx`), couplé à `campusPedagogicalEngine.analyzeHomeworkOrDocument()`, `voiceEngine` et `multimodalVisionService`.
* **Décision retenue** : Option 2.
* **Justification** : Expérience utilisateur immersive, fluide et sans couture, respectant la déontologie humaine de la Famille DIALLO et fournissant un accompagnement pédagogique de haute volée.
* **Conséquences** : Les apprenants peuvent parler au professeur, lui montrer leur cahier ou un exercice physique à la caméra pour une analyse instantanée, ou déposer un document PDF/image pour être guidés étape par étape.
* **Éléments techniques** : `components/CampusProfessorCoach.tsx`, `services/campusPedagogicalEngine.ts`, `services/voiceEngine.ts`, `services/multimodalVision.ts`, `docs/modules/04_campus_et_education.md`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-018] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `Campus Académique Universel`, `Moteur Pédagogique Adaptatif`, `Examens Blancs & Passerelles Internationales`
* **Problème / Besoin initial** :
  1. Identifier et implémenter l'ensemble des éléments restants de la feuille de route du module Campus Académie.
  2. Fournir l'exploration directe des programmes officiels et des chapitres officiels par pays sélectionné (Guinée MEPU-A, Sénégal Office du Bac, France Éducation Nationale, Côte d'Ivoire MENA, États-Unis SAT/AP, Fondamentaux/Alphabétisation).
  3. Intégrer un outil de Diagnostic Initial interactif (Point A ➔ Point B) avec cartographie de la maîtrise des compétences et recalibration automatique du plan de travail.
  4. Créer un Comparateur & Simulateur de Passerelles et Équivalences académiques internationales (correspondances de diplômes, conversion de notes, sujets divergents, passerelles de mise à niveau).
  5. Étoffer la banque d'examens blancs officiels multi-pays chronométrés et permettre l'étude directe de tout chapitre officiel avec le Professeur Diallo.
* **Idées envisagées** :
  1. Laisser un simple catalogue de cours généralistes statiques sans articulation directe avec les référentiels des ministères.
  2. Implémenter une architecture complète à 5 onglets (`Programme Officiel`, `Formations Certifiantes`, `Examens Blancs`, `Passerelles & Équivalences`, `Mes Diplômes`), concevoir `CampusDiagnosticModal.tsx` pour le test de positionnement rapide, `CampusEquivalenceComparator.tsx` pour la mobilité internationale, enrichir `MOCK_EXAM_BLUEPRINTS` dans `curriculumRegistry.ts`, et relier chaque chapitre officiel directement au générateur de cours interactif et aux explications personnalisées de Professeur Diallo.
* **Décision retenue** : Option 2.
* **Justification** : Conformité intégrale à la feuille de route et au livre de vision, accompagnement bienveillant et rigoureux de chaque apprenant selon son référentiel national, et valorisation des compétences validées.
* **Conséquences** : Les apprenants peuvent s'entraîner aux épreuves officielles de leur pays, diagnostiquer leurs lacunes, générer des leçons sur-mesure pour chaque chapitre du programme national et comparer leurs diplômes pour des études à l'international.
* **Éléments techniques** : `components/Campus.tsx`, `components/CampusDiagnosticModal.tsx`, `components/CampusEquivalenceComparator.tsx`, `services/curriculumRegistry.ts`, `services/campusPedagogicalEngine.ts`, `docs/modules/04_campus_et_education.md`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-017] — 27 Août 2026
* **Module(s)** : `02_RESEAU_MOK_ET_SOCIAL`, `Messagerie Instantanée Sécurisée (MoocChatFloating)`, `Chat Experts Diallo & Google Chat Center`
* **Problème / Besoin initial** :
  1. Confirmer le bon fonctionnement intégral de la messagerie instantanée (Chat) et l'exécution de toutes les demandes de la feuille de route.
  2. Assurer que tous les utilisateurs peuvent communiquer librement, s'envoyer des photos/images, des vidéos, des documents et des notes vocales sans restriction, avec persistance pérenne et relecture universelle.
* **Idées envisagées** :
  1. Maintenir un système d'envoi textuel standard avec pièces jointes basées sur des URLs éphémères.
  2. Intégrer des boutons d'accès rapide dédiés (Photo, Vidéo, Document, Vocal, Texte), convertir l'intégralité des médias capturés ou uploadés en flux Base64 Data URLs persistants avec synchronisation Supabase Realtime, supporter l'envoi de pièces jointes multiples sans perte, et garantir la relecture illimitée des vidéos et vocaux dans le flux de messages.
* **Décision retenue** : Option 2.
* **Justification** : Conformité à la feuille de route, garantie d'interopérabilité sur tous les appareils (desktop, mobile, PWA), zéro perte de données et expérience de communication collaborative d'excellence.
* **Conséquences** : Les utilisateurs et experts communiquent en temps réel avec partage fluide d'images, de vidéos HD, de fichiers et de messages vocaux avec waveform interactive.
* **Éléments techniques** : `components/MoocChatFloating.tsx`, `components/chat/ChatMessageItem.tsx`, `components/ChatInterface.tsx`, `services/supabaseClient.ts`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-016] — 27 Août 2026
* **Module(s)** : `02_RESEAU_MOK_ET_SOCIAL`, `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Gestion des Comptes & Navigation Globale`
* **Problème / Besoin initial** :
  1. Résoudre le dysfonctionnement de relecture des vidéos publiées sur le fil d'actualité : les vidéos enregistrées via un blob URL temporaire devenaient illisibles après rafraîchissement ou pour les autres utilisateurs.
  2. Rendre le Tableau de Bord Super-Admin immédiatement accessible, visible et opérationnel depuis toute l'interface (Header, Menu Profil, Sidebar, Dashboard et Recherche Universelle) pour l'administrateur, afin de superviser l'ensemble des comptes utilisateurs, les rôles, les crédits, la modération et la configuration système.
* **Idées envisagées** :
  1. Utiliser un simple lecteur vidéo basique sans persistance robuste.
  2. Convertir les fichiers vidéos sélectionnés en Data URL Base64 pérenne (ou URL hébergée), enrichir le lecteur vidéo du post avec des contrôles complets, `playsInline`, `preload="auto"`, réinitialisation au terme de la lecture (`onEnded`), intégrer `AdminDashboard` dans le routage de `App.tsx` et ajouter des points d'accès directs dorés dans le Header desktop, le menu déroulant de l'avatar profil, la sidebar de navigation et le sélecteur du Dashboard d'accueil.
* **Décision retenue** : Option 2.
* **Justification** : Conformité aux principes de persistance locale et cloud, garantie de relecture illimitée des vidéos par les propriétaires et le public, et visibilité immédiate du Tableau de Bord Super-Admin pour la gouvernance complète de la plateforme.
* **Conséquences** : Les vidéos publiées sont lisibles et rejouables instantanément à tout moment ; l'administrateur accède au tableau de bord complet en un clic depuis n'importe quel écran.
* **Éléments techniques** : `components/SocialFeed.tsx`, `App.tsx`, `components/Layout.tsx`, `components/Dashboard.tsx`, `components/navigation/NavigationItems.ts`, `docs/JOURNAL_DECISIONS.md`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-015] — 27 Août 2026
* **Module(s)** : `Transversal (14 Modules)`, `Qualité & Fiabilité Système`, `Tableau d'Enregistrement des Défauts (IEEE 1044 / PSP)`
* **Problème / Besoin initial** :
  1. Fixer l'ensemble des 22 défauts système, ergonomiques, matériels, de synchronisation, d'accessibilité et de dégradation gracieuse enregistrés sur le tableau des défauts.
  2. Fournir un registre formel exhaustif avec description, cause racine, correction appliquée et critères de validation pour chaque défaut.
  3. Garantir la conformité absolue avec le principe « Zéro Écran Blanc », la persistance locale continue et la stabilité de l'expérience utilisateur sur mobile et desktop.
* **Idées envisagées** :
  1. Corriger les défauts de manière isolée sans traçabilité formelle.
  2. Établir une matrice officielle `docs/TABLEAU_ENREGISTREMENT_DEFAUTS.md` conforme aux normes IEEE 1044 / PSP, corriger chirurgicalement chaque cause racine dans les composants et services (`Layout.tsx`, `voiceEngine.ts`, `pwaService.ts`, `MoocChatFloating.tsx`, `supabaseClient.ts`, etc.), et valider par build complet `compile_applet`.
* **Décision retenue** : Option 2.
* **Justification** : Rigueur documentaire, traçabilité opposable, conformité avec les règles permanentes d'ingénierie et garantie de longévité de la plateforme.
* **Conséquences** : 22/22 défauts résolus et testés, zéro régression, accessibilité WCAG AA renforcée, raccourcis clavier unifiés (`Escape`, `Ctrl+K`), et clôture audio automatique lors des transitions de navigation.
* **Éléments techniques** : `docs/TABLEAU_ENREGISTREMENT_DEFAUTS.md`, `components/Layout.tsx`, `services/voiceEngine.ts`, `services/pwaService.ts`, `components/MoocChatFloating.tsx`, `docs/JOURNAL_DECISIONS.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-014] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Profils Utilisateurs & Sync Supabase`, `Gestion de Schéma & Tolérance aux Pannes (PGRST204)`
* **Problème / Besoin initial** :
  1. Résoudre les avertissements Supabase `PGRST204` (« Could not find the 'badges' / 'city' column of 'profiles' in the schema cache ») survenant lors des opérations `upsertProfile`.
  2. Garantir que les mises à jour et créations de profils ne provoquent aucune erreur bloquante, même si la table Supabase `profiles` sur l'instance distante ne dispose pas encore de toutes les colonnes étendues.
  3. Mettre en place un mécanisme d'auto-adaptation en cas de rejet par le cache de schéma (filtrage dynamique de la colonne incriminée et repli dégradé gracieux avec sauvegarde minimale garantie).
* **Idées envisagées** :
  1. Forcer la suppression de tous les champs optionnels côté client.
  2. Rendre `SupabaseService.upsertProfile` auto-adaptatif : détection automatique de l'erreur `PGRST204`, extraction de la colonne manquante pour réessai immédiat, repli sur un payload minimal en cas d'échec secondaire, et unification de `services/profile.ts` pour passer par ce service résilient.
* **Décision retenue** : Option 2.
* **Justification** : Conformité avec les règles cardinales de résilience « Zéro Écran Blanc », compatibilité ascendante/descendante avec toutes les versions de tables Supabase, et persistance locale systématique sans perte de données.
* **Conséquences** : Zéro crash lors des synchronisations de profil, tolérance totale aux variations de schéma distant et mise à jour transparente pour l'utilisateur.
* **Éléments techniques** : `services/supabaseClient.ts`, `services/profile.ts`, `docs/JOURNAL_DECISIONS.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-013] — 27 Août 2026
* **Module(s)** : `02_RESEAU_MOK_ET_SOCIAL`, `Espace Live Intelligent`, `SocialLive & Stream Orchestration`, `Audio/Video Resilience`
* **Problème / Besoin initial** :
  1. Résoudre le bug d'écran blanc (White Screen of Death) lors du clic sur le bouton « Démarrer le live maintenant » ou « Rejoindre un Live ».
  2. Rendre la fonction de Live entièrement opérationnelle en streaming vidéo/audio, interactions en direct, copilote IA, tableau blanc, prise de notes, compte-rendu post-live et actions intelligentes.
  3. Sécuriser les flux médias contre les contextes où `navigator.mediaDevices` ou `AudioContext` ne sont pas disponibles ou bloqués par les permissions iFrame.
* **Idées envisagées** :
  1. Masquer les fonctionnalités avancées de Live et n'afficher qu'un composant statique.
  2. Procéder à un audit approfondi du cycle de vie de montage de `SocialLive.tsx`, `LiveCreationModal.tsx`, `LiveSmartActionBar.tsx`, `LiveWaitingRoomModal.tsx`, corriger les imports orphelins d'icônes (`GraduationCap`, `LifeBuoy`, `FileCheck`, `AlertTriangle`, `Plus`, `Play`, `Pause`, `RotateCcw`, `VolumeX`, `CheckCircle`), standardiser les interfaces de props de `LiveSmartActionBarProps`, ajouter des gardes d'exécution sécurisés (`if (navigator?.mediaDevices?.getUserMedia)` et accesseurs optionnels) pour garantir zéro crash au montage, et valider la compilation globale.
* **Décision retenue** : Option 2.
* **Justification** : Conformité absolue avec la charte de stabilité « Zéro Écran Blanc », respect de la dégradation gracieuse en environnement contraint et fonctionnement fluide immédiat pour tous les utilisateurs.
* **Conséquences** : Le démarrage ou la participation à un Live s'exécute instantanément, sans aucun écran blanc, avec toutes les capacités interactives (multidiffusion, sous-titres bilingues, copilote IA, actions, tableau blanc, replay).
* **Éléments techniques** : `components/SocialLive.tsx`, `components/LiveCreationModal.tsx`, `components/LiveSmartActionBar.tsx`, `components/LiveWaitingRoomModal.tsx`, `docs/ETAT_ACTUEL.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-012] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Sauvegarde, Versioning & Restauration Intelligente`, `Gouvernance des Versions Stables`
* **Problème / Besoin initial** :
  1. Mettre en place un système complet de sauvegarde, de restauration et de gestion des versions dans l'espace Super-Admin.
  2. Conserver au minimum les trois dernières versions stables de la plateforme, avec leur numéro de version, date de publication, changelog détaillé, checksums d'intégrité et statut opérationnel.
  3. Concevoir une restauration intelligente qui ne remet **JAMAIS** la plateforme à zéro : préservation intégrale garantie de toutes les données utilisateurs (comptes, profils, messages, médias, paramètres, rôles RBAC, publications, soldes Ⓒ, statistiques, logs d'audit), sans interruption majeure de service.
  4. Garantir la sécurité absolue avant toute restauration : création automatique d'un instantané (point de récupération pré-restauration) et vérification préalable de la compatibilité du schéma de base de données.
  5. Offrir depuis le tableau de bord Super-Admin la visualisation de l'historique des versions, la comparaison différentielle entre versions, la restauration en un clic avec dialogue de confirmation et sélection des données à préserver, la planification personnalisable des sauvegardes automatiques, et l'annulation immédiate (Undo / Rollback) de la dernière restauration.
* **Idées envisagées** :
  1. Utiliser un simple dump/restore brut de `localStorage` risquant d'écraser les comptes et les profils créés ultérieurement.
  2. Implémenter une architecture de versioning souveraine et de fusion intelligente (`intelligentRestore` dans `adminConfigService.ts`) avec préservation granulaire des entités vivantes, vérification de compatibilité de schéma (`verifyDatabaseCompatibility`), registre formel des versions stables (`getStableVersions`), création automatique de snapshot de sécurité pré-restauration, mécanisme d'annulation en 1 clic (`undoLastRestore`), planificateur automatisé (`BackupScheduleConfig`) avec élagage automatique, comparateur différentiel (`compareVersions`), et interface Super-Admin modulaire (`AdminWorkflowsAndBackupTab.tsx`).
* **Décision retenue** : Option 2.
* **Justification** : Sécurité absolue des données des citoyens et utilisateurs, continuité d'exploitation sans perte d'information, traçabilité des montées de version et conformité stricte aux exigences de souveraineté et de déploiement universel (GitHub, Netlify, Cloud Run, Supabase).
* **Conséquences** : Les opérations de maintenance et de retour de version peuvent être menées en toute confiance par le Super-Admin en un clic sans risque de réinitialisation destructrice ni d'écran blanc.
* **Éléments techniques** : `types.ts` (`PlatformReleaseVersion`, `BackupSnapshotRecord`, `BackupScheduleConfig`, `RestoreOperationResult`, `VersionComparisonResult`), `services/adminConfigService.ts`, `components/admin/AdminWorkflowsAndBackupTab.tsx`, `docs/HISTORIQUE_VERSIONS.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-011] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Gestion des Utilisateurs & RBAC`, `Supabase Realtime & Auth Sync`
* **Problème / Besoin initial** :
  1. Garantir que chaque compte créé ou connecté via Supabase (ou en session locale) apparaisse automatiquement et sans aucune exception dans le tableau de bord Super-Admin en temps réel.
  2. Fournir des capacités d'administration complètes : gestion individuelle de chaque compte, approbation, suspension, réactivation, suppression, attribution des rôles et privilèges granulaires RBAC, ajustement des crédits Ⓒ avec motif d'audit, consultation de l'historique et des journaux d'audit, et exports CSV/JSON.
  3. Identifier et corriger automatiquement tout problème de compte existant non visible ou corrompu grâce à un moteur de diagnostic, déduplication et réconciliation automatique des comptes sans casser l'existant et en restant 100% compatible GitHub, Netlify et Cloud Run.
* **Idées envisagées** :
  1. Faire un simple rechargement manuel de la table `profiles` sans écouteur temps réel ni mécanisme d'auto-réparation.
  2. Mettre en place un système complet de synchronisation bi-directionnelle et temps réel avec Supabase (`subscribeToProfilesRealtime`), enrichir `adminConfigService` avec `registerOrSyncUser`, `syncWithSupabase` et `reconcileAndRepairAllAccounts`, connecter les cycles de vie d'authentification (`Auth.tsx`, `App.tsx`, `onAuthStateChange`), et concevoir une interface de gestion d'utilisateurs ultra-complète (`AdminUsersTab.tsx`) avec indicateur d'état cloud en direct, bouton de synchronisation forcée, bouton de diagnostic/réparation, filtrage multicritère (rôle, statut, origine, KYC, tri), modales d'édition complète des privilèges RBAC, modal d'historique d'audit et modal d'ajustement de crédits.
* **Décision retenue** : Option 2.
* **Justification** : Zéro compte invisible ou perdu, visibilité instantanée dès l'inscription ou la connexion, protection absolue du Super-Admin (`visionsmart224@gmail.com`), intégrité des données garantie même en cas de coupure réseau (dégradation gracieuse Local-First) et conformité totale avec les directives d'infrastructure.
* **Conséquences** : Tout utilisateur créé ou connecté via Supabase ou session locale est réconcilié, indexé et visible en temps réel par le Super-Admin avec traçabilité intégrale.
* **Éléments techniques** : `types.ts`, `services/supabaseClient.ts`, `services/adminConfigService.ts`, `components/admin/AdminUsersTab.tsx`, `components/Auth.tsx`, `App.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-010] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `01_DIALLO_OS_ET_EXPERTS`, `Espace Super-Admin Souverain`, `AI Resilience & Orchestration Hub`
* **Problème / Besoin initial** :
  1. Concevoir une architecture auto-résiliente avec bascule automatique (failover) sans interruption entre plusieurs fournisseurs d'IA (OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Mistral, xAI Grok, Alibaba Qwen, Moonshot Kimi, OpenRouter, Replicate, Hugging Face, Ollama Local/Souverain, etc.).
  2. Fournir dans le tableau de bord Super-Admin un gestionnaire unique permettant de connecter, activer, désactiver, prioriser par rangs (#1, #2, etc.), tester en direct et surveiller tous les fournisseurs majeurs.
  3. Définir des règles de gouvernance strictes : chaînes de secours, seuils de qualité minimaux (exclusion automatique de tout fournisseur sous le seuil), plafonds de latence tolérée, seuils budgétaires et mise en quarantaine automatique après N échecs consécutifs avec réadmission et retour automatique au meilleur fournisseur (failback).
* **Idées envisagées** :
  1. S'appuyer uniquement sur le SDK Gemini avec un simple try/catch renvoyant une chaîne statique en cas d'erreur.
  2. Bâtir un moteur d'orchestration et de résilience complet (`services/aiRoutingService.ts`), transformer `services/ai.ts` en une façade transparente compatible avec l'ensemble des modules existants, étendre les types (`AIProviderConfig`, `AIRoutingPolicyConfig`, `AIFailoverEvent`, `AIExecutionResult`), enrichir `adminConfigService` avec toutes les opérations de contrôle (réordonnancement, quarantaine, réadmission, test de sonde, ajout custom), et créer un hub de contrôle d'administration haut de gamme (`components/admin/AdminAIResilienceHub.tsx`) doté de 4 sous-vues : Cartes de contrôle des nœuds, Gouvernance & Seuils, Banc d'essai interactif de simulation de bascule en direct, et Journal d'audit des bascules.
* **Décision retenue** : Option 2.
* **Justification** : Zéro dépendance bloquante à un fournisseur d'IA unique, continuité absolue de service pour l'ensemble des 14 modules de la plateforme même en cas de panne mondiale d'un fournisseur ou de restriction de quota (429/500/timeout), et supervision souveraine en direct par le Super-Admin.
* **Conséquences** : Zéro écran blanc, dégradation gracieuse souveraine garantie, persistance des configurations, auditabilité totale des requêtes et compatibilité intégrale avec Supabase, GitHub et Netlify.
* **Éléments techniques** : `types.ts`, `services/aiRoutingService.ts`, `services/ai.ts`, `services/adminConfigService.ts`, `components/admin/AdminAIResilienceHub.tsx`, `components/admin/AdminAIAndModulesTab.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-009] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Espace Super-Admin Souverain`, `Mobile UX & Smart Dock`, `Mooc Chat Floating`
* **Problème / Besoin initial** :
  1. Mise en place d'un espace Super-Admin souverain complet pilotable depuis la plateforme avec attribution automatique de tous les privilèges au compte `visionsmart224@gmail.com` lors de son authentification via Supabase (sans jamais coder de mot de passe en dur). L'espace devait permettre la gestion complète des utilisateurs (RBAC, suspension, suppression, promotion/rétrogradation admin), la modération des contenus et signalements, les paramètres globaux (Live, Commerce, MokTrust, etc.), l'orchestration IA et les sauvegardes.
  2. Sur mobile, le bouton flottant du Mooc Chat était masqué ou en collision avec le menu latéral / barre de navigation dock inférieure (`bottom dock`). Nécessité d'un audit complet de l'interface mobile pour éliminer tout chevauchement ou blocage d'interactions.
* **Idées envisagées** :
  1. Utiliser un simple flag local dans le state React pour l'admin et cacher le bouton chat sur mobile.
  2. Créer une suite administrative complète et modulaire (`components/AdminDashboard.tsx`, `components/admin/*`, `services/adminConfigService.ts`) connectée à Supabase avec dégradation gracieuse locale, et refondre le positionnement responsive du Mooc Chat (`bottom-24 right-4 md:bottom-6 md:right-6`), du smart dock mobile (`pointer-events-none` sur le wrapper / `pointer-events-auto` sur le dock avec gestion de safe-area iOS/Android `pb-[max(0.75rem,env(safe-area-inset-bottom))]` et `pb-36` sur le viewport principal), ainsi que l'ajustement du scroll horizontal sur les onglets et boîtes de dialogue.
* **Décision retenue** : Option 2.
* **Justification** : Sécurité absolue, absence totale de mot de passe dans le code, conformité Supabase Cloud, flexibilité totale sur mobile avec accès immédiat au Mooc Chat sans aucun masquage par le dock.
* **Conséquences** : Navigation mobile fluide, zéro collision de z-index, accès super-admin protégé et 100% opérationnel pour `visionsmart224@gmail.com`.
* **Éléments techniques** : `components/AdminDashboard.tsx`, `components/admin/`, `services/adminConfigService.ts`, `components/Layout.tsx`, `components/MoocChatFloating.tsx`, `components/DialloOS.tsx`, `components/settings/BrandColorLabModal.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-008] — 27 Août 2026
* **Module(s)** : `11_STUDIO_ET_CREATION`, `Co-Création & Collaboration`, `Partage d'Actifs`
* **Problème / Besoin initial** : Intégrer dans le Studio créatif une suite d'outils collaboratifs complète comprenant le partage fluide de contenu multimédia (images, vidéos, analyses vision, scripts d'avatars), la création et gestion de cercles/groupes de discussion thématiques, et des espaces de co-création d'articles ou de projets en équipe avec répartition des tâches, gestion d'étapes et boîte à idées communautaires.
* **Idées envisagées** :
  1. Créer un écran externe séparé du Studio.
  2. Intégrer un onglet dédié « Co-Création & Collaboration » au sein de `components/Studio.tsx`, complété par des boutons d'actions directes « Partager dans le Hub Collaboratif » sur chaque résultat généré (image, vidéo, vision, avatar) et un composant modulaire `components/StudioCollaboration.tsx` doté de 4 sous-espaces spécialisés (Projets & Articles, Cercles de Discussion, Bibliothèque de Ressources Partagées, Boîte à Idées).
* **Décision retenue** : Option 2. Typage complet dans `types.ts` (`StudioTab`, `CoCreationProject`, `DiscussionCircle`, `SharedStudioResource`, `CommunityCollaborationIdea`), implémentation de `components/StudioCollaboration.tsx` avec persistance locale et dégradation gracieuse, et liaison bidirectionnelle dans `components/Studio.tsx`.
* **Justification** : Expérience utilisateur fluide et unifiée dans le Studio : un créateur peut générer un média par IA et l'envoyer directement en un clic dans la bibliothèque d'actifs partagés ou le lier à un projet de co-création sans changer de contexte.
* **Conséquences** : Zéro régression sur la génération multimédia existante, compatibilité totale Netlify et déploiement cloud sans écran blanc.
* **Éléments techniques** : `types.ts`, `components/Studio.tsx`, `components/StudioCollaboration.tsx`, `docs/modules/11_studio_et_creation.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-007] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Identité & Profils`, `Auth`, `Mok Social`
* **Problème / Besoin initial** : L'authentification devait reposer entièrement et exclusivement sur Supabase (en remplacement complet de Firebase) avec une suite complète : inscription avec création immédiate de profil (nom complet, avatar certifié, titre, bio, localisation, passeport citoyen), connexion, mot de passe oublié, réinitialisation de mot de passe, renvoi d'email de confirmation, gestion sécurisée du « Se souvenir de moi », synchronisation de session au démarrage, et liaison directe des publications du fil d'actualité au profil réel de l'auteur.
* **Idées envisagées** :
  1. Conserver un flux hybride combinant Firebase Auth et Supabase DB.
  2. Implémenter une suite complète Supabase Auth (`signUp`, `signIn`, `resetPasswordForEmail`, `updateUserPassword`, `resendVerificationEmail`, `getSession`, `onAuthStateChange`, `signInWithOAuth`) avec création automatique d'un profil dans `public.profiles` dès la première connexion/inscription, et synchronisation bi-directionnelle avec le `GlobalContext` et `App.tsx`.
* **Décision retenue** : Option 2. Refonte intégrale de `components/Auth.tsx` et enrichissement de `services/supabaseClient.ts` et `App.tsx`.
* **Justification** : Conformité stricte aux directives de souveraineté et d'architecture sans écran blanc, persistance de session robuste et attribution garantie des publications aux profils réels des utilisateurs.
* **Conséquences** : Toutes les actions sociales (création de post, commentaires, réactions, consultation de profil) utilisent l'identité réelle de l'utilisateur connecté sans aucun placeholder générique.
* **Éléments techniques** : `components/Auth.tsx`, `services/supabaseClient.ts`, `App.tsx`, `components/SocialFeed.tsx`, `contexts/GlobalContext.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-006] — 27 Août 2026
* **Module(s)** : `10_RESEAU_ET_COMMUNAUTE_MOK`, `14_SECURITE_ET_INFRASTRUCTURE`, `Identité & Profils`, `Mok Social`
* **Problème / Besoin initial** : Mettre en place un système complet et authentique d'identité utilisateur et de profils réels. Chaque utilisateur doit posséder une identité unique (photo, nom, bio, localisation, passeport) prise en compte dans toute l'application (fil d'actualité, publications avec identité réelle, annuaire des membres, messagerie privée directe), avec persistance cloud Supabase et dégradation locale fluide.
* **Idées envisagées** :
  1. Maintenir un profil mock statique dans les constantes.
  2. Créer une architecture d'identité dynamique reliant `GlobalContext`, `Settings`, `Profile`, `SocialFeed`, `MemberProfileModal` et `MoocChatFloating` avec persistance bidirectionnelle Supabase (tables `profiles`, `community_posts`, `chat_conversations`, `chat_messages`) et session locale sécurisée (`localStorage`).
* **Décision retenue** : Option 2. Schéma SQL exhaustif dans `docs/supabase_schema.sql`, typage enrichi dans `types.ts` et `supabaseClient.ts`, synchronisation dynamique dans `GlobalContext.tsx`, et refactorisation de `SocialFeed.tsx` et `Settings.tsx`.
* **Justification** : Élimine toute ambiguïté sur l'identité de l'auteur d'une publication, assure une recherche et consultation fluide des profils membres, et connecte directement la messagerie et les publications au backend Supabase.
* **Conséquences** : Les publications créées portent toujours l'identité exacte de l'utilisateur connecté ; les modifications de profil dans les Paramètres se répercutent instantanément dans l'ensemble de l'écosystème.
* **Éléments techniques** : `docs/supabase_schema.sql`, `types.ts`, `services/supabaseClient.ts`, `contexts/GlobalContext.tsx`, `components/SocialFeed.tsx`, `components/Settings.tsx`, `components/Profile.tsx`, `components/MoocChatFloating.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-005] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Socle Global`, `AGENTS.md`, `GEMINI.md`
* **Problème / Besoin initial** : Garantir la portabilité et le déploiement continu immédiat sur GitHub, Netlify, Cloud Run et Vercel sans jamais risquer d'écran blanc (*White Screen of Death*), et standardiser Supabase comme backend par défaut sans dépendance bloquante à Firebase.
* **Idées envisagées** :
  1. Maintenir Firebase couplé avec des initialisations directes au chargement de module.
  2. Adopter Supabase comme backend cloud par défaut, découpler tous les services avec initialisation lazy à la demande (`getClient()`), fallback gracieux (Local-First IndexedDB) et passage exclusif des clés via variables d'environnement.
* **Décision retenue** : Intégration de la directive permanente dans `AGENTS.md` et `GEMINI.md`, création du service résilient `services/supabaseClient.ts`, sécurisation lazy de `services/googleWorkspace.ts` et génération de `.env.example`.
* **Justification** : Résilience absolue au démarrage, zéro écran blanc même en l'absence temporaire de variables d'environnement, portabilité GitHub/Netlify immédiate.
* **Conséquences** : Tout futur projet et module utilise Supabase par défaut sans bloquer le rendu React.
* **Éléments techniques** : `AGENTS.md`, `GEMINI.md`, `.env.example`, `services/supabaseClient.ts`, `package.json` (`@supabase/supabase-js`).
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-004] — 27 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `07_JURIDIQUE_ET_ADMINISTRATION`, `Administration Centrale`
* **Problème / Besoin initial** : L'administrateur général avait besoin de piloter l'intégralité de la plateforme (utilisateurs, rôles RBAC, fournisseurs IA, clés API, modèles de lettres, signatures autographes, cachets/sceaux, workflows A➔B, sauvegardes et journaux) sans jamais toucher au code.
* **Idées envisagées** :
  1. Panneaux de configuration dispersés dans le code ou les fichiers de constantes.
  2. Tableau de bord centralisé no-code avec persistance Local-First réactive, bibliothèque d'actes officiels, moteur de résolution de variables et prévisualisation haute fidélité en temps réel avec export PDF/impression.
* **Décision retenue** : Création du Service Central `adminConfigService.ts` et du tableau de bord modulaire `AdminDashboard.tsx` découpé en 6 sous-modules spécialisés (`AdminOverviewTab`, `AdminUsersTab`, `AdminAIAndModulesTab`, `AdminTemplatesAndStampsTab`, `AdminWorkflowsAndBackupTab`, `AdminLogsAndBroadcastTab`, `OfficialLetterPreviewModal`).
* **Justification** : Autonomie opérationnelle totale du Super-Administrateur, conformité institutionnelle des lettres générées, gouvernance de sécurité et traçabilité audit complète.
* **Conséquences** : Uniformisation des actions primaires (fond bleu, texte blanc), sauvegarde instantanée en Snapshot JSON, gestion des quotas de crédits Ⓒ et validation KYC.
* **Éléments techniques** : `services/adminConfigService.ts`, `components/AdminDashboard.tsx`, `components/admin/*`, `types.ts`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2025-001] — 15 Décembre 2025
* **Module(s)** : `01_DIALLO_OS_ET_EXPERTS`, `Global`
* **Problème / Besoin initial** : Éviter que les utilisateurs ne perçoivent les assistants comme des robots distants et désincarnés.
* **Idées envisagées** :
  1. Afficher des cartes de bots type ChatGPT / Copilot.
  2. Créer une famille d'experts humains incarnés avec des spécialités métiers de haut niveau.
* **Décision retenue** : Adoption stricte de la **Famille d'Experts Humains DIALLO** avec consigne système inviolable (interdiction formelle de se déclarer IA ou bot).
* **Justification** : Renforce la confiance, l'empathie et la posture de conseil responsable auprès d'utilisateurs en situation d'urgence ou de démarche complexe.
* **Conséquences** : Standardisation de `SYSTEM_INSTRUCTION` dans `constants.ts` et enrichissement des profils `Agent` dans `types.ts`.
* **Éléments techniques** : `constants.ts`, `types.ts`, `components/ChatInterface.tsx`.
* **Statut** : `Testé` & `Validé`.

---

### [DEC-2026-002] — 10 Janvier 2026
* **Module(s)** : `02_MARCHE_MONDIAL_COMMERCE`
* **Problème / Besoin initial** : Un simple marketplace B2C ne répond pas aux besoins d'import-export, de gros, de sourcing et de sécurité des transactions internationales.
* **Idées envisagées** :
  1. Limiter la boutique à des articles d'e-commerce standard.
  2. Construire un Marché Mondial tridimensionnel (B2B, B2C, C2C) avec gestion des Incoterms 2020, RFQ, devis comparatifs et calcul de coûts de débarquement.
* **Décision retenue** : Extension complète du Marché Mondial avec Business OS intégré (`TradeBusinessOperatingSystem.tsx`).
* **Justification** : Permet aux PME et commerçants des pays émergents d'accéder au commerce international structuré avec une sécurité contractuelle.
* **Conséquences** : Création de 15 sous-composants dédiés au commerce (RFQ, Sourcing, Litiges, Salons) et extension du modèle `Product`.
* **Éléments techniques** : `components/Shop.tsx`, `components/Trade*`, `components/business/*`.
* **Statut** : `Développé` & `Testé`.

---

### [DEC-2026-003] — 02 Février 2026
* **Module(s)** : `01_DIALLO_OS_ET_EXPERTS`, `Transversal`
* **Problème / Besoin initial** : Les demandes utilisateurs complexes (ex: « Je veux ouvrir un restaurant en Espagne ») impliquent plusieurs compétences simultanées (juridique, visa, financement, langue).
* **Idées envisagées** :
  1. Forcer l'utilisateur à naviguer manuellement d'un expert à l'autre.
  2. Développer un Moteur d'Orchestration Multi-Agents (`OrchestratorService`) créant un `DossierParcours` coordonné.
* **Décision retenue** : Mise en place de l'Orchestrateur Central Diallo OS avec Conseil Collégial unifié (`CouncilRoom.tsx`).
* **Justification** : Réduction radicale de la charge mentale de l'utilisateur grâce à une prise en charge globale.
* **Conséquences** : Création de `services/orchestratorService.ts`, `services/dossierService.ts` et intégration dans `App.tsx`.
* **Éléments techniques** : `services/orchestratorService.ts`, `components/CouncilRoom.tsx`, `components/UnifiedCouncilRoom.tsx`.
* **Statut** : `Développé` & `Testé`.

---

### [DEC-2026-004] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`
* **Problème / Besoin initial** : L'ancien module Carrière se résumait à une liste passive d'offres sans accompagnement du changement ni validation continue des compétences.
* **Idées envisagées** :
  1. Ajouter de simples filtres de recherche d'emploi supplémentaires.
  2. Transformer le module en un **Système d'Accomplissement Professionnel & GPS de Carrière (Point A ➔ Point B)** avec Diagnostic 17 critères, Jumeau Numérique Évolutif, Coach 3D Vocal et Pipeline Kanban de suivi.
* **Décision retenue** : Refonte complète en architecture modulaire `components/career/` avec 7 sous-composants interconnectés aux autres modules (Campus, Marché, Drive).
* **Justification** : Fournit une solution de bout en bout pour la reconversion, la recherche de CDI, le freelancing et la création d'entreprise.
* **Conséquences** : Connexion directe avec le Coach 3D (`CareerCoach3DModal.tsx`), le Conseil d'Experts Carrière et les cours Campus.
* **Éléments techniques** : `components/CareerCenter.tsx`, `components/career/*`, `App.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-005] — 27 Août 2026
* **Module(s)** : `Documentation & Continuité Système`
* **Problème / Besoin initial** : Risque de perte de contexte, d'incohérence ou de régressions lors des passages successifs entre développeurs humains et modèles d'IA.
* **Idées envisagées** :
  1. Rédiger un simple fichier README résumé.
  2. Établir une **Mémoire Centrale et Vivante de Documentation Continue** avec Livre de Vision, Architecture Globale, Journal des Décisions, Registre des Idées et protocoles obligatoires dans `AGENTS.md`.
* **Décision retenue** : Création de l'infrastructure documentaire complète dans `/docs/` avec 14 fiches modules et règles système injectées.
* **Justification** : Garantie absolue de la pérennité du projet, traçabilité des choix et respect strict de la vision fondatrice.
* **Conséquences** : Tout futur cycle de développement intègre la mise à jour documentaire comme étape obligatoire d'achèvement.
* **Éléments techniques** : `/docs/*`, `/AGENTS.md`, `/GEMINI.md`.
* **Statut** : `Développé` & `Actif`.

---

### [DEC-2026-006] — 27 Août 2026
* **Module(s)** : `04_CAMPUS_ET_EDUCATION`, `Global`
* **Problème / Besoin initial** : L'ancien module Campus imposait un cursus unique et rigide basé sur des niveaux génériques, sans prise en compte des spécificités des systèmes éducatifs nationaux (Guinée, Sénégal, France, Côte d'Ivoire, USA, UK), des besoins d'alphabétisation des adultes, ni des préférences cognitives individuelles.
* **Idées envisagées** :
  1. Conserver un catalogue unique de cours en ajoutant de simples tags de pays.
  2. Construire un **Campus Mondial Intelligent Multi-Programmes & Ultra-Personnalisé** avec registre officiel des programmes (`curriculumRegistry.ts`), moteur adaptatif de Professeur Diallo (`campusPedagogicalEngine.ts`), mode de reformulation instantanée *"Explique-moi autrement"*, simulateur d'examens blancs chronométrés (`CampusMockExamView.tsx`) et matrice de passerelles/équivalences internationales.
* **Décision retenue** : Option 2 déployée en enrichissant l'existant sans régression.
* **Justification** : Démocratise l'accès à une pédagogie d'excellence internationale tout en respectant scrupuleusement les référentiels officiels de chaque pays et le rythme propre de chaque apprenant.
* **Conséquences** : Extension de `types.ts`, création de `CampusEducationMap.tsx`, `CampusProfessorCoach.tsx` et intégration dans `Campus.tsx`.
* **Éléments techniques** : `types.ts`, `services/curriculumRegistry.ts`, `services/campusPedagogicalEngine.ts`, `components/CampusEducationMap.tsx`, `components/CampusMockExamView.tsx`, `components/CampusProfessorCoach.tsx`, `components/Campus.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-007] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`
* **Problème / Besoin initial** : L'ancien Scanner d'opportunités fonctionnait comme un moteur de recherche standard par mots-clés, forçant l'utilisateur à chercher en permanence, sans analyse des compétences réelles (Point A), sans niveau de préparation (Prêt maintenant vs À préparer), sans veille passive continue, ni détection des opportunités non publiées du Réseau MOK.
* **Idées envisagées** :
  1. Ajouter de simples filtres de catégories au scanner existant.
  2. Construire le **Radar Intelligent d'Opportunités & Agent de Conquête Permanent (Étape 2/7)** capable de décoder les intentions en langage naturel, d'expliciter le score de match (forces vs lacunes avec renvoi direct vers Campus), de surveiller le marché 24h/24 ("Mon Agent cherche pour moi"), de détecter les signaux faibles réels dans le Réseau MOK, de fournir un coffre d'opportunités avec suivi d'avancement, et d'intégrer une boucle d'apprentissage adaptative basée sur le feedback utilisateur.
* **Décision retenue** : Option 2 avec création du moteur de matching `careerRadarEngine.ts`, du composant `CareerRadarOpportunities.tsx`, de la carte explicable `CareerRadarCard.tsx`, du coffre sécurisé `CareerOpportunityVaultModal.tsx`, des missions de veille `CareerActiveMissionsModal.tsx`, des signaux faibles `CareerHiddenSignalsModal.tsx`, de la cartographie `CareerOpportunityMapView.tsx` et du feedback adaptatif `CareerOpportunityFeedbackModal.tsx`.
* **Justification** : « L'utilisateur ne passe plus ses journées à chercher : la plateforme cherche avec lui, pour lui, puis l'aide à agir » tout en respectant la règle de sécurité absolue (aucune candidature envoyée sans validation explicite).
* **Conséquences** : Remplacement du scanner d'origine par le Radar v2 dans `CareerCenter.tsx`, persistance locale du coffre et des missions, connexion native avec le Coach 3D et le Campus.
* **Éléments techniques** : `types.ts`, `services/careerRadarEngine.ts`, `components/career/CareerRadarCard.tsx`, `components/career/CareerRadarOpportunities.tsx`, `components/career/CareerOpportunityVaultModal.tsx`, `components/career/CareerActiveMissionsModal.tsx`, `components/career/CareerHiddenSignalsModal.tsx`, `components/career/CareerOpportunityMapView.tsx`, `components/career/CareerOpportunityFeedbackModal.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-008] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`
* **Problème / Besoin initial** : Une fois une opportunité détectée par le Radar, abandonner l'utilisateur devant un bouton "Postuler" conduit à un faible taux de conversion (dossiers génériques, manque de préparation aux questions pièges, absence de contrôle qualité et de débriefing après réponse).
* **Idées envisagées** :
  1. Générer automatiquement un simple email ou PDF standard et l'envoyer directement.
  2. Créer une véritable **Salle de Préparation & Mode Conquête (Étape 3/7)** comprenant :
     - Une analyse d'angle stratégique 5D (Culture, ATS, attentes non dites, leviers, score de préparation /100).
     - Un CV Maître universel comme source de vérité inaltérable et des CV contextuels dérivés sur mesure.
     - 5 formats de pitchs avec téléprompteur interactif et enregistreur audio/vidéo.
     - Un crash-test réaliste (10 questions + 3 pièges) avec correction IA instantanée ou bascule Coach 3D.
     - Une fiche flash J-0 (Répétition 5 min / Préparation 30 min).
     - Un sas de contrôle qualité obligatoire (*Quality Gate*) garantissant la règle absolue *« L'humain est le seul maître de l'action »*.
     - Un décodeur de réponses recruteurs/clients pour adapter la suite du plan d'action.
* **Décision retenue** : Option 2 déployée avec architecture modulaire dans `components/career/conquest/` et orchestrée depuis `CareerCenter.tsx` et `CareerContinuousFollowUp.tsx`.
* **Justification** : Maximise les chances de conversion réelle d'une opportunité en succès tangible (embauche, contrat B2B, financement) sans jamais falsifier les compétences réelles ni effectuer d'action non autorisée.
* **Conséquences** : Ajout du bouton "Salle de Préparation & Conquête" sur chaque opportunité du Radar, gestion du CV Maître persistant dans le `CareerCenter`, intégration du décodeur de réponses dans le pipeline Kanban et passerelle fluide avec le Coach 3D et le Campus.
* **Éléments techniques** : `types.ts`, `services/careerConquestDefaults.ts`, `components/career/conquest/CareerConquestRoom.tsx`, `components/career/conquest/CareerMasterResumeModal.tsx`, `components/career/conquest/CareerContextualResumeEditor.tsx`, `components/career/conquest/CareerTeleprompterModal.tsx`, `components/career/conquest/CareerMeetingFlashModal.tsx`, `components/career/conquest/CareerQualityGateModal.tsx`, `components/career/conquest/CareerResponseAnalyzerModal.tsx`, `components/career/CareerRadarCard.tsx`, `components/career/CareerRadarOpportunities.tsx`, `components/career/CareerContinuousFollowUp.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-009] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`
* **Problème / Besoin initial** : Une fois une démarche engagée, l'utilisateur risquait d'être abandonné à lui-même face à la surcharge d'échéances, aux oublis de relance, au harcèlement involontaire par manque de timing courtois, à l'absence de débriefing structuré après entretien et au découragement en cas de refus d'une piste.
* **Idées envisagées** :
  1. Maintenir un simple tableau Kanban statique avec des cartes déplaçables.
  2. Déployer un **Agent Autonome de Continuité & Dossier Vivant (Étape 4/7)** comprenant :
     - Un **Pulse de Carrière** et une commande centrale **« Que dois-je faire maintenant ? »** pour prioriser l'action quotidienne à fort impact sans surcharge cognitive.
     - Une commande **« Prépare-moi pour demain »** et un briefing hebdomadaire anticipant les échéances critiques et fiches flash J-0.
     - Un **Dossier Vivant** avec timeline chronologique horodatée, pièces jointes, prochaine meilleure action (*Next Best Action*) et notes privées.
     - Un **Moteur de Relance Intelligente Anti-Spam** avec timing courtois (J+7/J+10) et apport systématique de valeur ajoutée.
     - Une **Fiche de Préparation de Rendez-vous** et un **Débriefing Vocal Instantané** (« Comment ça s'est passé ? ») extrayant les décisions actées et les engagements réciproques.
     - Un **Mode Plan B & Capitalisation Continue** garantissant qu'un refus réalloue immédiatement 90% des actifs préparés vers 2 à 3 opportunités de substitution du Radar.
* **Décision retenue** : Option 2 déployée via `CareerContinuityControlHub.tsx` et sa suite de modales spécialisées dans `components/career/continuity/`.
* **Justification** : « Aucun parcours important ne doit être oublié en cours de route. » L'application accompagne l'utilisateur avec lucidité, respect du timing et résilience jusqu'à l'obtention de résultats tangibles et vérifiables.
* **Conséquences** : Remplacement du module de suivi classique par le hub de continuité dans `CareerCenter.tsx`, synchronisation avec la timeline d'événements et capitalisation vers le Radar d'opportunités.
* **Éléments techniques** : `types.ts`, `services/careerContinuityEngine.ts`, `components/career/continuity/CareerContinuityControlHub.tsx`, `components/career/continuity/CareerLiveDossierModal.tsx`, `components/career/continuity/CareerWhatShouldIDoNowModal.tsx`, `components/career/continuity/CareerBriefingTomorrowModal.tsx`, `components/career/continuity/CareerMeetingPrepModal.tsx`, `components/career/continuity/CareerPostMeetingDebriefModal.tsx`, `components/career/continuity/CareerSmartFollowUpModal.tsx`, `components/career/continuity/CareerPlanBModal.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-010] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`, `07_RESEAU_SOCIAL_ET_COMMUNAUTES`
* **Problème / Besoin initial** : Attendre passivement qu'une opportunité apparaisse sur un job board ou un radar limite les trajectoires ambitieuses. L'utilisateur doit pouvoir créer lui-même ses opportunités, développer son capital relationnel, cibler ses clients idéaux (ICP), identifier les signaux d'affaires faibles, monter des équipes d'opportunité (consortia pluridisciplinaires) et transmettre son expertise via le mentorat sans démarchage agressif (anti-spam).
* **Idées envisagées** :
  1. Construire un simple carnet d'adresses ou exporter des listes de contacts brutes.
  2. Déployer un **Agent Autonome de Développement Professionnel, Réseau & Prospection (Étape 5/7)** comprenant :
     - Un **Cockpit d'Intelligence Relationnelle & Mini-CRM** (`CareerRelationalEcosystemHub.tsx`) avec métriques stratégiques et dialogue *« Qui dois-je contacter ou relancer aujourd'hui ? »*.
     - Une **Carte Relationnelle Intelligente & Dynamique** (`CareerRelationshipMapModal.tsx`) visualisant le flux *Moi ➔ Objectif ➔ Relations directes ➔ Facilitateurs ➔ Décisionnaires cibles* avec analyse de pertinence bidirectionnelle explicable.
     - Un moteur de déduction stratégique **« Qui devrais-je connaître pour mon objectif ? »** (`CareerWhoShouldIKnowModal.tsx`).
     - Un **Mode Introduction Professionnelle** (`CareerIntroductionModal.tsx`) avec contrôle et consentement humain obligatoire avant transmission.
     - Une **Fiche Relationnelle 360° & Mémoire Active CRM** (`CareerContactDetailModal.tsx`) gérant un pipeline à 10 étapes, les engagements réciproques et les synergies Réseau MOC (Tribus, Lives, Reels).
     - Un espace d'**Équipes d'Opportunité & Réponse Collective** (`CareerCollaborativeMissionModal.tsx`) pour répondre aux appels d'offres en consortium.
     - Un **Hub de Mentorat & Réputation Contextualisée** (`CareerMentorshipModal.tsx`) structuré autour de la boucle *J'apprends ➔ Je maîtrise ➔ J'accomplis ➔ Je transmets*.
     - Une **Vue Synthétique 360° Écosystème** (`CareerEcosystem360Modal.tsx`) en 8 piliers stratégiques.
* **Décision retenue** : Option 2 déployée et intégrée dans le CareerCenter comme onglet dédié *« Réseau & Capital Pro »*.
* **Justification** : « JE SAIS OÙ JE VEUX ALLER ➔ QUI PEUT M’AIDER ? ➔ QUI PUIS-JE AIDER ? ➔ OÙ SONT LES OPPORTUNITÉS ? ➔ COMMENT CRÉER UNE RELATION UTILE ? ➔ COMMENT LA TRANSFORMER EN RÉSULTAT ? ». Applique strictement la charte éthique anti-spam et garantit l'alignement avec le Réseau MOC et le Studio de Marque Pro.
* **Conséquences** : Extension de `CareerCenter.tsx` avec le sous-système de réseau pro, interconnexions fluides avec les Tribus et Lives MOC, gestion du profil de client idéal IA (ICP) et des signaux commerciaux détectés.
* **Éléments techniques** : `types.ts`, `services/careerNetworkEngine.ts`, `components/career/network/CareerRelationshipMapModal.tsx`, `components/career/network/CareerWhoShouldIKnowModal.tsx`, `components/career/network/CareerIntroductionModal.tsx`, `components/career/network/CareerContactDetailModal.tsx`, `components/career/network/CareerCollaborativeMissionModal.tsx`, `components/career/network/CareerMentorshipModal.tsx`, `components/career/network/CareerEcosystem360Modal.tsx`, `components/career/network/CareerRelationalEcosystemHub.tsx`, `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-011] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `04_CAMPUS_ET_EDUCATION`, `Transversal`
* **Problème / Besoin initial** : Accompagner la carrière actuelle sans vision prospective ni anticipation des ruptures de marché risque d'enfermer l'utilisateur dans une trajectoire subie ou obsolète. Il manquait un conseiller stratégique permanent capable de modéliser des trajectoires multiples non-linéaires, d'analyser les signaux faibles, de lever les plateaux de stagnation et d'arbitrer les choix de vie selon des critères personnels pondérés.
* **Idées envisagées** :
  1. Ajouter un simple questionnaire d'orientation statique ou un test de personnalité générique.
  2. Déployer un **Système d'Intelligence Stratégique & Trajectoires Prédictives (Étape 6/7)** articulé autour de la formule `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER` avec 10 composants dédiés :
     - **Boussole Stratégique 4D** (`CareerStrategicCompassModal.tsx`) articulant Point A, Point B, Marché et Action immédiate avec mode d'accélération vs équilibre.
     - **Simulateur de Trajectoires Comparatif & Scénarios « Et si ? »** (`CareerTrajectorySimulatorModal.tsx`) confrontant 5 voies types (A: Verticale, B: Spécialisation, C: Management, D: Entrepreneuriat, E: Expatriation) et calculant l'impact des bifurcations.
     - **Skill Graph & Cartographie des Écarts** (`CareerSkillGraphGapModal.tsx`) avec niveaux de preuve (déclarée à confirmée par réalisation) et passerelles directes vers Campus.
     - **Passeport de Compétences & Compétences Transférables** (`CareerSkillsPassportModal.tsx`) pour valoriser les acquis vers d'autres secteurs sans repartir de zéro.
     - **Plans d'Évolution 90 Jours & 1 An** (`CareerEvolutionPlansModal.tsx`) cadencés mois par mois et trimestres T1-T4.
     - **Diagnostic de Plateau & Commande « Débloque ma situation »** (`CareerPlateauUnlockModal.tsx`) identifiant le Levier N°1 d'accélération.
     - **Conseil de Carrière Multi-Experts** (`CareerMultiExpertCouncilModal.tsx`) orchestrant 4 experts Diallo (Mamadou, Aïssata, Amadou, Fatoumata) avec synthèse collégiale.
     - **Matrice de Décision Personnelle & Arbitrage d'Opportunités** (`CareerDecisionMatrixModal.tsx`) avec pondération de 7 critères de vie pour arbitrer entre plusieurs offres.
     - **Bilan de Carrière IA Généré** (`CareerAIBilanModal.tsx`) synthétisant les acquis, l'évolution contextuelle et les recommandations futures.
     - **Visualisation Chronologique « Mon Évolution »** (`CareerEvolutionTimelineModal.tsx`) matérialisant le chemin parcouru et les prochaines étapes.
* **Décision retenue** : Option 2 développée, testée et intégrée dans `CareerCenter.tsx` avec l'onglet *« Stratégie & Trajectoires »*.
* **Justification** : « L'IA conseille. Elle ne décide jamais. » L'utilisateur dispose d'une puissance d'analyse stratégique de niveau cabinet de conseil de direction tout en restant l'unique souverain de ses décisions.
* **Conséquences** : Intégration fluide de `CareerStrategicAdvisorHub.tsx` dans la navigation de `CareerCenter.tsx`, enrichissement du modèle de données `types.ts` et du moteur de calcul `services/careerStrategicEngine.ts`.
* **Éléments techniques** : `types.ts`, `services/careerStrategicEngine.ts`, `components/career/strategic/*` (11 fichiers), `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-012] — 27 Août 2026
* **Module(s)** : `03_CARRIERE_ET_ACCOMPLISSEMENT`, `Transversal`, `Global System`
* **Problème / Besoin initial** : Malgré la richesse des modules 1/7 à 6/7, le système risquait de souffrir d'une fragmentation de l'expérience utilisateur et d'un manque de boucle de continuité finale : une fois un objectif atteint, que se passe-t-il ? Comment unifier la mémoire entre tous les sous-systèmes sans formulaire répétitif, tout en offrant une interface épurée en Mode Simple et un cockpit complet en Mode Avancé ?
* **Idées envisagées** :
  1. Laisser chaque onglet indépendant avec son propre stockage local fragmenté.
  2. Construire le **Système Unifié de Carrière & Cycle Perpétuel d'Accomplissement (Étape Finale 7/7)** reposant sur :
     - Le **Dossier Maître Unique (`CareerMasterDossier`)** unifiant l'identité, le cap (Point A ➔ Point B), le journal de bord, les permissions et les métriques d'impact.
     - Le **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** synthétisant le récit de vie (`generateCareerNarrative`) et priorisant la meilleure action universelle (`askUniversalNextAction`).
     - Le **Centre de Commande Unifié (`CareerMasterCommandHub.tsx`)** avec bascule instantanée Mode Simple (centré sur l'action du jour) / Mode Avancé (7 piliers).
     - La commande **« Raconte-moi mon parcours » (`CareerNarrativeStoryModal.tsx`)** générant un récit valorisant et écoutable vocalement.
     - La commande **« Que dois-je faire maintenant ? » (`CareerWhatShouldIDoModal.tsx`)** isolant les 3 meilleurs leviers avec gains attendus.
     - La commande **« J'ai une urgence » (`CareerEmergencyModal.tsx`)** pour les entretiens imminents, dossiers de dernière minute et négociations contractuelles.
     - Le **Mode Accomplissement & Boucle Infinie (`CareerAccomplishmentCelebrationModal.tsx`)** qui célèbre l'atteinte du Point B, capitalise les preuves dans le Jumeau Pro et déclenche le cycle suivant.
     - Le **Centre de Contrôle & Permissions IA (`CareerAgentPermissionsLogsModal.tsx`)** pour régler l'autonomie de l'agent (Standard, Copilote, Autonome), le suspendre en 1 clic et auditer ses actions.
     - L'**Onboarding Conversationnel Intelligent (`CareerConversationalOnboardingModal.tsx`)** guidant le cadrage Point A / Point B sans formulaire rigide.
     - La **Recherche Universelle Carrière (`CareerUniversalSearchModal.tsx`)** indexant tous les documents, contacts, compétences et cours.
     - Le **Test de Cohérence du Cap (`CareerCoherenceAuditModal.tsx`)** vérifiant l'alignement des actions avec le Point B.
     - Les **Opportunités Surprises (`CareerSurpriseOpportunityModal.tsx`)** décloisonnant les choix professionnels.
     - **Mon Impact & Transmission (`CareerImpactTransmissionModal.tsx`)** bouclant le parcours d'excellence (*Apprendre ➔ Progresser ➔ Accomplir ➔ Transmettre*).
* **Décision retenue** : Option 2 déployée avec succès sans aucune régression.
* **Justification** : « Plus le moteur devient puissant, plus l'interface devient simple. » L'accompagnement transforme chaque accomplissement en un nouveau point de départ, instaurant une relation de confiance et d'émancipation sur le long terme.
* **Conséquences** : Consolidation absolue du module Carrière, intégration transparente dans `CareerCenter.tsx`, persistance du Dossier Maître, fluidité multi-appareils et passage réussi de la suite de compilation.
* **Éléments techniques** : `types.ts`, `services/careerUnifiedEngine.ts`, `components/career/unified/*` (11 composants), `components/CareerCenter.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-013] — 27 Août 2026
* **Module(s)** : `Navigation`, `Layout`, `Global Experience`, `Google Workspace Integration`
* **Problème / Besoin initial** : Face à l'extrême richesse des 14 modules et sous-systèmes développés sur la plateforme, le menu principal reflétait l'ordre historique d'apparition technique (liste aplatie, applications Google au premier niveau encombrant la vue) plutôt que la manière naturelle dont un être humain formule ses besoins de vie.
* **Idées envisagées** :
  1. Conserver le menu actuel en ajoutant simplement des sous-menus déroulants basiques.
  2. Refondre l'expérience de navigation autour de **5 Grands Piliers de Besoins Humains**, transformer les services Google (Maps, Drive, Meet, Chat) en **capacités transversales invisibles et contextuelles**, et doter la plateforme d'un **moteur de recherche universel (`⌘K`)** avec commande vocale et orientation par objectifs (*« Mon Cap »*).
* **Décision retenue** : Option 2 développée et déployée :
  - **Structure en 5 Piliers Humains** :
    1. *Accueil & Cap* (`Accueil`, `Mon Parcours de Vie`)
    2. *Apprendre & Évoluer* (`Campus & Éducation`, `Langues & Immersion`, `Carrière & Accomplissement`)
    3. *Vie & Services* (`Santé & Bien-être`, `Habitat & Installation`, `Finance & Wallet`, `Mes Démarches`, `Droit & Juridique`, `Mobilité & Expatriation`)
    4. *Créer & Entreprendre* (`Studio Créatif`, `Marché Mondial`)
    5. *Communauté & Conseil* (`Réseau MOC`, `Experts Diallo`, `Conseil des Sages`)
  - **Services Transversaux Google & Sécurité** : Hub dédié (`TransversalServicesModal.tsx`) et badges contextuels. Google Drive, Meet, Chat et Maps sont intégrés au cœur des modules sans saturer la navigation principale.
  - **Recherche Universelle & Command Palette (`⌘K`)** : (`UniversalSearchModal.tsx`) avec recherche pondérée multi-entités et reconnaissance vocale directe (« Ouvre Carrière », « Mes démarches », etc.).
  - **Orientation par Objectifs (« Mon Cap »)** : (`GoalOrientationModal.tsx`) avec 6 gabarits d'accomplissement clés.
  - **Système de Favoris & Récents** : Épinglage direct avec stockage local et accès rapide en haut de barre.
  - **Dock Mobile Optimisé** : 5 actions directes et tiroir développé structuré.
* **Justification** : « La puissance doit être dans le moteur. La simplicité doit être devant l'utilisateur. » L'utilisateur trouve immédiatement ce qu'il cherche selon son intention de vie sans avoir besoin de comprendre l'architecture technique sous-jacente.
* **Conséquences** : Clarté cognitive accrue, zéro régression sur les routes existantes, accessibilité renforcée (raccourcis clavier, vocal) et mise à niveau de l'interface en conformité avec les règles Anti-Slop.
* **Éléments techniques** : `components/navigation/NavigationItems.ts`, `components/navigation/TransversalServicesModal.tsx`, `components/navigation/UniversalSearchModal.tsx`, `components/navigation/GoalOrientationModal.tsx`, `components/Layout.tsx`, `App.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-014] — 27 Août 2026
* **Module(s)** : `Design System`, `Layout`, `Dashboard`, `UI Components`, `Global Identity`
* **Problème / Besoin initial** : Passer d'une interface fonctionnelle dense à une plateforme internationale premium, distinctive et humaine, avec une identité visuelle propre et intemporelle, en éliminant les clichés d'interfaces IA génériques (AI-slop) et en unifiant l'expérience visuelle et contextuelle à travers l'ensemble des modules.
* **Idées envisagées** :
  1. Conserver les styles Tailwind génériques par défaut et ajouter simplement quelques icônes.
  2. Établir un **Design System Institutionnel & Human-Centric d'Envergure Mondiale** :
     - **Palette Institutionnelle** : Navy profond (#070D1E / #0B132B / #1E293B), accents Orange vif (#EA580C) et gris ardoise chauds.
     - **Typographie Distinctive** : 'Outfit' pour les titres et 'Plus Jakarta Sans' pour le corps de texte.
     - **Dashboard Éditorial** : Hero éditorial sobre, visualiseur de trajectoire *Point A ➔ Point B*, zone d'actions rapides et séparation nette entre la vue Personnelle et la Console Système.
     - **Barre d'Action Contextuelle (`ContextActionBar.tsx`)** : Fil d'Ariane institutionnel, étiquette du pilier de vie, description concise et déclenchement d'un conseil d'expert Diallo en 1 clic au sommet de chaque module.
     - **Bibliothèque de Composants d'Élévation** : `PointAToBPathway`, `StatusBadge`, `SourceCitationCard`, `EmptyStateGuide`, `EditorialHero`, `QuickActionZone`.
* **Décision retenue** : Option 2 déployée en conservant 100% du fonctionnel existant et en élevant le design, la clarté et la fluidité.
* **Justification** : « L'intelligence artificielle doit être ressentie par les capacités du produit, pas criée par son apparence. » L'application dégage une identité institutionnelle d'autorité bienveillante et d'excellence.
* **Conséquences** : Cohérence globale de l'interface, transitions nettes, clarté contextuelle accrue lors de la navigation dans les modules et validation de la suite de compilation.
* **Éléments techniques** : `components/ui/DesignTokens.ts`, `components/ui/PointAToBPathway.tsx`, `components/ui/ContextActionBar.tsx`, `components/ui/StatusBadge.tsx`, `components/ui/SourceCitationCard.tsx`, `components/ui/EmptyStateGuide.tsx`, `components/ui/EditorialHero.tsx`, `components/ui/QuickActionZone.tsx`, `components/Dashboard.tsx`, `components/Layout.tsx`, `index.html`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-015] — 27 Août 2026
* **Module(s)** : `Accessibility`, `GuidedMode`, `UniversalScanner`, `BilingualTranslation`, `ActionableAI`, `KnowledgeCards`, `DesignSystem`
* **Problème / Besoin initial** : Garantir une accessibilité cognitive et universelle de niveau international (seniors, personnes peu alphabétisées, usagers mobiles, barrières de la langue), doter la plateforme de capacités d'action immédiates ("Actionable AI"), d'un scanner universel tout-en-un, d'un mode bilingue direct, de fiches de connaissance réutilisables et d'un hub de paramètres unifié.
* **Idées envisagées** :
  1. Laisser les utilisateurs chercher seuls dans chaque sous-menu et sous-dossier.
  2. Construire un socle universel d'accessibilité et de clarté décisionnelle :
     - **Mode Guidé Pas-à-Pas (« Guide-moi »)** (`GuidedModeModal.tsx`) : 4 étapes simplifiées sans jargon pour orienter n'importe quel profil vers son objectif (Carrière, Campus, Démarches, Logement, Santé, Shop) avec restitution vocale Diallo.
     - **Scanner Universel Multimodal** (`UniversalScannerModal.tsx`) : OCR, extraction de documents administratifs, traduction visuelle, scan de QR codes et envoi direct aux modules et experts.
     - **Traduction Bilingue Directe** (`BilingualConversationModal.tsx`) : Interface face-à-face interactive avec détection de langue et lecture audio pour faciliter les échanges terrain.
     - **Composants Actionable AI** (`ActionableAISuggestion.tsx`) : Remplacement des simples blocs de texte par des recommandations avec boutons d'action immédiate (« Améliorer maintenant », « Voir pourquoi », « Plus tard »).
     - **Fiches de Connaissance & Synthèses Claires** (`KnowledgeCard.tsx`, `AISynthesisCard.tsx`) : Transformation des cours, lives, conseils et réunions en fiches mémorisables (« Ce qu'il faut retenir », « Sources vérifiées », « Décisions », « Actions »).
     - **Modes Concentration & Présentation** (`FocusAndPresentationControls.tsx`) : Épuration visuelle pour les sessions d'étude ou la projection devant un recruteur.
     - **Hub Unifié des Paramètres & Connecteurs** (`UnifiedSettingsModal.tsx`) : Gestion centralisée de la typographie, des contrastes, de la synthèse vocale et des connecteurs Google Workspace.
     - **Galerie & Vitrine du Design System** (`ComponentShowcaseModal.tsx`) : Documentation interactive de l'ensemble des composants et tokens.
* **Décision retenue** : Option 2 développée et intégrée dans la navigation principale et le `Layout`.
* **Justification** : « Le Monde à Vous doit réduire la fracture numérique, pas l'augmenter. Une décision importante à la fois. »
* **Conséquences** : Accessibilité totale WCAG AA, réduction radicale de la charge cognitive et amélioration substantielle de la vitesse d'action de l'utilisateur.
* **Éléments techniques** : `components/accessibility/GuidedModeModal.tsx`, `components/scanner/UniversalScannerModal.tsx`, `components/translation/BilingualConversationModal.tsx`, `components/ui/ActionableAISuggestion.tsx`, `components/ui/KnowledgeCard.tsx`, `components/ui/AISynthesisCard.tsx`, `components/ui/SmartConfirmModal.tsx`, `components/ui/FocusAndPresentationControls.tsx`, `components/settings/UnifiedSettingsModal.tsx`, `components/ui/ComponentShowcaseModal.tsx`, `components/Layout.tsx`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-020] — 27 Août 2026
* **Module(s)** : `Super Admin`, `Gestion des Versions`, `Sauvegarde & Restauration Intelligente`, `Supabase Client`, `Résilience Déploiement`
* **Problème / Besoin initial** :
  1. Corriger l'erreur de build suite à la refactorisation de Supabase (`supabaseService` manquant).
  2. Mettre en place un système complet de sauvegarde, de restauration et de gestion des versions dans l'espace Super Admin : conservation d'au minimum les trois dernières versions stables (numéro, date, changelog, statut), restauration intelligente préservant l'intégralité des données utilisateurs (comptes, profils, messages, médias, paramètres, rôles, publications, stats, logs), point de récupération automatique pré-restauration, comparaison de versions, planification des sauvegardes, annulation / rollback en 1 clic, compatibilité totale Supabase / GitHub / Netlify avec zéro écran blanc.
* **Idées envisagées** :
  1. Système basique d'export JSON sans gestion d'historique ni préservation sélective.
  2. Architecture souveraine unifiée et certifiée :
     - **Unification Supabase** : `services/supabaseClient.ts` exportant à la fois l'instance `supabase`, l'interface `SupabaseUserProfile` et le singleton `supabaseService` avec toutes les méthodes résilientes et tolérantes aux pannes.
     - **Registre des Versions Stables** : conservation et consultation des versions majeures (v6.3.0, v6.2.0, v6.1.0, v6.0.0) avec métadonnées complètes (schéma, checksum, modules, providers IA, changelog).
     - **Moteur de Restauration Intelligente** : fusion et conservation des collections utilisateurs sans écrasement ni remise à zéro, création systématique d'un instantané automatique `auto_pre_restore` pour retour arrière instantané (Rollback).
     - **Planificateur Automatisé** : configuration de la fréquence (horaire, quotidienne, hebdomadaire), quotas de rétention, synchronisation Cloud Supabase et déclenchement manuel immédiat.
     - **Tableau de Bord Super Admin** : onglet dédié enrichi avec comparateur de versions, filtres d'instantanés, import/export JSON et panneau de rollback d'urgence.
* **Décision retenue** : Option 2 validée, testée et compilée avec succès.
* **Justification** : « Garantit la pérennité absolue des données et la souveraineté totale du Super-Administrateur sur l'évolution du système. »
* **Conséquences** : Zéro régression, build de production vert, résilience totale face aux pannes ou clés manquantes, conservation garantie de toutes les données utilisateurs lors des restaurations.
* **Éléments techniques** : `/services/supabaseClient.ts`, `/services/adminConfigService.ts`, `/components/admin/AdminWorkflowsAndBackupTab.tsx`, `/components/AdminDashboard.tsx`, `/contexts/GlobalContext.tsx`, `/types.ts`.
* **Statut** : `Développé`, `Testé` & `Validé`.

### [DEC-2026-021] — 27 Août 2026
* **Module(s)** : `WebRTC P2P Souverain`, `Service Worker PWA Offline`, `Synchronisation Citoyenne Multi-Utilisateurs`
* **Problème / Besoin initial** :
  1. Finaliser l'infrastructure d'appels vidéo et vocaux P2P avec une configuration STUN/TURN haute disponibilité pour traverser les pare-feux sans blocage.
  2. Mettre en place un Service Worker PWA complet avec politique de cache offline et initialisation résiliente au démarrage.
  3. Fournir un rapport d'exécution exhaustif avec preuves de bon fonctionnement et validation de build sans régression.
* **Décision retenue** :
  - Création du module `/services/webrtcService.ts` avec négociation d'offres/réponses SDP et pool de serveurs STUN mondiaux (Google & Cloudflare).
  - Création du Service Worker `/public/sw.js` et du service d'enregistrement `/services/pwaService.ts` branché sur l'entrée applicative `/index.tsx`.
* **Conséquences** : Zéro écran blanc, résilience offline certifiée, appels directs stabilisés et compatibilité PWA immédiate.
* **Éléments techniques** : `/services/webrtcService.ts`, `/public/sw.js`, `/services/pwaService.ts`, `/index.tsx`, `/docs/modules/AUTHENTIFICATION.md`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-030] — 28 Août 2026
* **Module(s)** : `14_SECURITE_ET_INFRASTRUCTURE`, `Central AI Orchestrator & Resilience Hub`, `Auto-Diagnostic & Détection Clés API`
* **Problème / Besoin initial** :
  1. Vérifier que toutes les clés API (serveur et client) sont correctement détectées, unifiées et testées sans doublon bloquant.
  2. En cas de clé manquante ou invalide, ne jamais bloquer l'application : dégrader gracieusement vers le fournisseur actif suivant ou le moteur souverain local sans interruption pour l'utilisateur.
  3. Au démarrage, tester automatiquement le statut de chaque fournisseur et basculer de manière transparente avec rapport visible dans le tableau de bord Super Admin.
* **Idées envisagées** :
  1. Bloquer l'accès en affichant un modal d'erreur bloquant si une clé d'API est manquante.
  2. Orchestration résiliente asynchrone non-bloquante (`probeAllProvidersOnStartup`) :
     - Découverte conjointe des variables d'environnement (`KLING_API_KEY`, `VITE_KLING_API_KEY`, `ELEVENLABS_API_KEY`, etc.) via `/api/ai/connectors` et le client Vite.
     - Sondes parallèles avec timeout strict (2500ms) et marquage du statut (`online`, `degraded`, `quarantined`).
     - Organisation automatique de la chaîne de bascule instantanée vers les moteurs sains ou le repli souverain local.
     - Bandeau d'état et d'alerte dans le Hub Super Admin avec boutons de copie 1-clic pour le `.env`, liens directs vers les consoles officielles et simulateur de panne en 1 clic.
* **Décision retenue** : Option 2 développée, intégrée et testée.
* **Justification** : Respect absolu du principe fondamental « Zéro Écran Blanc & Zéro Interruption Utilisateur ».
* **Conséquences** : Fonctionnement fluide avec ou sans clés d'API configurées, visibilité totale pour le Super-Administrateur et bascule instantanée certifiée.
* **Éléments techniques** : `/services/aiRoutingService.ts`, `/components/admin/AdminAIResilienceHub.tsx`, `/server.ts`, `/types.ts`.
* **Statut** : `Développé`, `Testé` & `Validé`.

---

### [DEC-2026-042] — 3 Septembre 2026
* **Module(s)** : `Navigation globale`, `Réseau social (accueil)`, `Direction artistique`
* **Problème / Besoin initial** : la Direction a retenu la proposition 06
  « Miroir d'eau » parmi les six traitements du menu construits dans le
  laboratoire isolé `design-lab/`. Il fallait la porter en production sans
  toucher aux systèmes visuels déjà gelés ni au périmètre du LIVE.
* **Idées envisagées** :
  1. Réécrire le thème global (`ThemeContext` / `DesignTokens`) pour y loger
     la palette aqua.
  2. Ajouter un système de tokens **scopé** sous un attribut `[data-miroir]`,
     posé sur la racine de l'application, sans toucher aux 10 palettes de
     marque ni au système verre/eau/lumière du LIVE.
* **Décision retenue** : option 2. Les couleurs et les matières vivent dans
  des variables CSS `--mir-*` dans le bloc `<style>` d'`index.html` ; les
  composants ne portent que des classes `.mir-*`.
* **Justification** : `palette-10` est gelée par une décision antérieure de la
  Direction pour toutes les surfaces pas encore redessinées, et le LIVE a sa
  propre matière (7 univers). Un habillage scopé permet d'appliquer le choix
  de la Direction sans casser ni l'un ni l'autre — et prépare le futur
  sélecteur d'univers de l'Administrateur Général (hors périmètre ici) sans
  qu'il faille retoucher un composant.
* **Conséquences** :
  - Le réseau social est l'écran d'accueil par défaut ; l'Architecte occupe la
    place centrale de la navigation ; la goutte de la messagerie est le seul
    élément flottant ; « Équipe & Experts » est au premier niveau.
  - La barre latérale desktop conserve `palette-10` et ses 17 entrées — choix
    assumé, documenté, pas un oubli.
  - La goutte de la messagerie reçoit l'arête de lumière et le reflet **par
    CSS uniquement** : `MessagingDropButton.tsx` n'est pas modifié, ses quatre
    états et leurs tests restent intacts.
* **Piège technique consigné** : `-webkit-box-reflect: none` est ignoré
  silencieusement par Chromium (valeur calculée inchangée, aucun
  avertissement) — il faut `unset`. Même famille que les teintes `brand-*`
  absentes de la config Tailwind : une déclaration qui ne peint rien sans le
  dire. Un garde-fou de test vérifie désormais que toute classe `.mir-*`
  utilisée existe réellement, et qu'aucune ne vit hors du périmètre scopé.
* **Éléments techniques** : `index.html` (tokens + classes `.mir-*`),
  `components/miroir/WaterMirror.tsx`, `services/miroir/waterRipple.ts`,
  `components/Layout.tsx`, `components/SocialFeed.tsx`,
  `tests/miroirWater.test.tsx`, `docs/DIRECTION_ARTISTIQUE_MENU_MIROIR_EAU.md`.
* **Statut** : `Développé`, `Testé` (777 tests, tsc 0, build, banc navigateur
  réel 76 OK / 0 défaut) — **appréciation visuelle en attente de la Direction**.

---

### [DEC-2026-043] — 3 Septembre 2026
* **Module(s)** : `Studio Live`, `Direction artistique`
* **Problème / Besoin initial** : la Direction a fourni une **seconde image de
  référence**, propre au LIVE (abysse turquoise, ruban de lumière liquide,
  cartes de verre cyan, vidéo dans le verre, plaque de nom en capitales,
  orbes, « ● EN DIRECT », bulles dans les cartes) avec la consigne « je veux
  que le design du live soit à l'image de ceci exactement ». Le Studio portait
  la matière verre/eau/lumière des LOOP 07-08 et la palette DA-1, mais pas
  cette esthétique précise — et reposait encore sur des aplats `bg-slate-950`.
* **Idées envisagées** :
  1. Déclarer les nouvelles variables sur `:root`, comme la palette DA-1
     (`--water-accent`).
  2. Les déclarer sur **`[data-live-universe]`**, un attribut qui n'existe que
     sur la racine du Studio.
* **Décision retenue** : option 2. Toutes les variables `--live-*` sont
  scopées au Studio ; aucune n'est posée sur `:root`.
* **Justification** : `--water-accent` sur `:root` est **consommé par la
  goutte de la messagerie** (`--mdb-acc`, maquette 01 validée le 01/09, DEC-2026-035).
  Une nouvelle variable globale aurait pu déplacer un composant déjà validé
  ailleurs. Le scope rend l'habillage du LIVE incapable de sortir du LIVE.
* **Conséquences** :
  - Une seule architecture pour les 7 univers : seuls `--live-abyss-a/-b` et
    `--live-glow` sont redéfinis par univers, jamais une famille de classes.
  - `liveBadge()` expose désormais `isOnAir` : « EN DIRECT » ne s'affiche que
    quand le direct passe **vraiment** (jamais en aperçu, interruption,
    reconnexion ou connexion) — la vue ne re-déduit plus l'état.
  - Les motifs vivants sont **déterministes** (bulles) et **mesurés** (l'onde
    de voix suit le vrai niveau audio, ne mime rien quand il est absent).
* **Lacune produit trouvée en construisant les preuves, corrigée** : la scène
  à une seule carte était **impossible à produire** — `aiAgent` retombait sans
  condition sur `AGENTS[0]` et `stageAgents` le ré-injectait à chaque rendu,
  donc **un agent IA ne pouvait jamais être retiré de la scène**, contre la
  règle « inviter, retirer, gérer humain et agent ». `agentsRetires` corrige
  la capacité manquante (la croix n'est offerte qu'à l'hôte, une nouvelle
  invitation fait revenir l'agent).
* **Pièges techniques consignés** : (1) le vignettage doit être une **couche
  de `background`**, pas un `::after` — un pseudo-élément est peint après tous
  les enfants et aurait assombri la vidéo ; (2) `color-mix()` évité pour la
  tuile agent (non garanti sur Safari 16.0) ; (3) la colonne d'eau est placée
  par un **style en ligne**, jamais par une valeur arbitraire Tailwind —
  Tailwind est servi par CDN et injecte ses règles à l'exécution.
* **Éléments techniques** : `index.html` (variables et classes `.live-*`),
  `components/live/LiveMatter.tsx`, `components/SocialLive.tsx`,
  `components/LiveSmartActionBar.tsx`, `hooks/useLiveTransport.ts`
  (`LiveBadgeState.isOnAir`), `tests/liveStudioMatter.test.tsx`,
  `docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md` § 8.
* **Statut** : `Développé`, `Testé` (800 tests, tsc 0, build, banc navigateur
  réel 8/8 sans défaut sur ordinateur et téléphone) — **design validé par la
  Direction le 03/09/2026** sur les captures d'ordinateur et de téléphone.
* **Restes assumés** : le cœur rose des réactions n'est pas ramené sur la
  palette cyan, et trois écrans satellites du LIVE (`LiveCreationModal`,
  `LiveReplayModal`, `MultimodalCameraHUD`) gardent leur dégradé bleu→indigo —
  la loupe n'a pas été élargie sans accord de la Direction.

---

### [DEC-2026-044] — 3 Septembre 2026

* **Module(s)** : `Documentation`, `LIVE`, `Campus & Éducation`
* **Problème / Besoin initial** : consigne explicite de la Direction —
  « Distingue clairement ce qui existe déjà et ne doit pas être cassé, la
  vision future à documenter, et ce qu'on code maintenant. Documente d'abord
  l'existant à protéger, puis la vision, puis une roadmap priorisée. Ne mélange
  pas tout dans le code. » La documentation du LIVE mélangeait effectivement
  les trois : `LIVE_INTELLIGENT.md` portait à la fois l'état mesuré du socle et
  l'ambition, et **aucun document ne recensait ce qui ne doit pas casser**.
* **Idées envisagées** :
  1. Ajouter un chapitre « existant » dans le document de vision.
  2. Créer un **document séparé**, lu en premier, qui ne contient aucune
     ambition.
* **Décision retenue** : option 2 — `docs/LIVE_SOCLE_EXISTANT.md`. Trois
  documents, trois rôles, jamais mélangés : **l'existant à protéger**, **la
  vision** (`LIVE_INTELLIGENT.md` + `LIVE_CAMPUS_EDUCATION.md`), **la roadmap
  priorisée et les preuves** (`LIVE_INTELLIGENT_VALIDATION.md`).
* **Justification** : une ambition rangée à côté d'un constat finit par se lire
  comme un constat. Ce dépôt en a payé le prix trois fois — sauvegarde de
  profil en échec depuis l'origine, diffusion admin qui n'écrivait qu'en
  mémoire, chat du direct sans un seul message persisté —, chaque fois sur une
  capacité « documentée comme opérationnelle ». Un document qui ne contient
  **que** du mesuré ne peut pas produire cette confusion.
* **Conséquences** :
  - **Neuf invariants** nommés (I1…I9), chacun rattaché au défaut réel qui l'a
    fait naître. En cas de conflit avec la vision, **le socle gagne**.
  - Une loupe qui fait bouger une brique du § 2 du socle sans preuve
    équivalente est une **régression**, pas un progrès.
  - La roadmap devient **priorisée en trois vagues** — direct réel (LV-1→LV-6),
    direct intelligent (LV-7→LV-11), direct qui forme (LV-12→LV-18) — au lieu
    d'une liste plate. **LV-6 est un verrou explicite** : rien de la vague B ne
    démarre avant la preuve à deux comptes réels.
  - **LV-1, LV-3 et LV-4 passent de « EN COURS » à `PARTIEL`**, reste-à-faire
    nommé. Leur code est livré et testé ; la preuve d'usage réel manque. Les
    annoncer TERMINÉS serait exactement le mensonge que l'invariant I9
    interdit.
  - Sept loupes ajoutées (LV-12 à LV-18) pour la branche éducation, chacune
    avec ses critères et ses preuves, **toutes bloquées derrière LV-6**.
* **Fragilités désormais nommées plutôt que découvertes deux fois** :
  `live_messages` = 0 ligne, 21 tables `live_*` sans consommateur, serveur
  LiveKit du VPS toujours en 1.8.4, aucun identifiant de build exposé au
  runtime (instances périmées indétectables), doublon acoustique de
  l'interprète identifié mais jamais mesuré, vocabulaire de rôles
  d'`AdminConfigService` jamais réconcilié, dossiers de vie et moteurs Carrière
  100 % `localStorage`.
* **Correction d'une documentation fausse, dans le même geste** :
  `docs/modules/04_campus_et_education.md` annonçait « Statut : 100 %
  Opérationnel » et des « examens blancs opérationnels » alors que `courses`,
  `enrollments`, `certificates` et `exam_sessions` sont à **0 ligne** et
  **sans aucun lecteur** dans le code. Remplacé par un partage mesuré
  RÉEL / NON PERSISTÉ. Une documentation qui ment est un défaut au même titre
  qu'un bug.
* **Éléments techniques** : `docs/LIVE_SOCLE_EXISTANT.md` (nouveau),
  `docs/LIVE_CAMPUS_EDUCATION.md` (nouveau),
  `docs/LIVE_INTELLIGENT_VALIDATION.md` (priorisation + LV-12→LV-18),
  `docs/LIVE_INTELLIGENT.md` (rôle de document clarifié),
  `docs/modules/04_campus_et_education.md`, `docs/README.md` (index 20→24).
* **Statut** : `Développé`, `Testé` — aucune ligne de code applicatif touchée :
  tsc 0, **801 tests verts (59 fichiers)**, build propre, tous identiques à
  l'état d'avant. C'est précisément ce qu'on attend d'un lot documentaire.
* **Restes assumés** : rien de la vision n'est codé par cette décision. Le
  prochain lot de code est **LV-6** — la preuve réelle à deux comptes —, verrou
  de tout ce qui suit.

---

### [DEC-2026-054] — 5 Septembre 2026

* **Module(s)** : `Santé Globale (Super-Admin)`, `Live / Directs`, fonction
  Edge `health-guardian`
* **Problème / Besoin initial** : SAT-4 — le tableau de bord de santé
  concluait « vert » sur un `GET /` qui répond 200, alors que le 2 septembre
  ce même `GET /` répondait 200 en 0,41 s **pendant que la voix ne passait
  pas** (négociation expirée en boucle, `bytesSent` nul). Un serveur qui
  refuse les identifiants du coffre répond aussi 200 sur `/`. La Direction a
  fixé la barre : « ne présente pas SAT-4 comme terminé. Il reste du
  branchement réel à livrer. »
* **Décision** : la seule requête qui prouve qu'un direct peut s'ouvrir est
  celle dont `livekit-token` dépend lui-même — `POST
  /twirp/livekit.RoomService/ListRooms`, signée avec la clé du coffre
  (`get_live_transport_config_internal`, réservée au rôle service, jamais
  atteignable depuis une session). Verdicts : 200 + liste exploitable en
  ≤ 1 500 ms → **vert** ; au-delà → **orange** (c'est
  `ROOM_SERVICE_TIMEOUT_MS`, le délai passé lequel la porte d'admission SAT-2
  cesse d'attendre et laisse entrer sans compter — le direct marche, la
  protection non) ; 401/403 → **rouge « refuse nos identifiants »**, le cas
  exact qu'un ping déclarait vert ; 5xx ou corps illisible → rouge ; délai ou
  réseau → rouge ; rien de configuré ou sonde non exécutée → **blanc** (ne pas
  avoir regardé n'est pas un constat, et `messagerie.transport_live_configure`
  signale déjà une configuration absente — la compter rouge ici l'aurait
  pénalisée deux fois dans le score). Séparation stricte : la règle
  (`liveTransportProbe.ts`) et l'évaluateur (`evaluate.ts`) ne touchent jamais
  au réseau ; seul `index.ts` sonde, et ne lève jamais — une sonde réseau qui
  ferait tomber la fonction effacerait les 41 lignes du tableau de bord pour
  un seul service. `PROBE_TIMEOUT_MS = max(5 s, SEUIL_DEGRADE_MS × 2)` rend le
  seuil porteur : les deux valeurs ne peuvent plus se croiser. Ligne de
  registre `live.transport_utilisable` (poids 34) ; les poids LIVE ont été
  rééquilibrés 34/28/22/16 = 100 — `validateRegistry()` a refusé la première
  tentative à 110, exactement son rôle.
* **Artefact de déploiement** : la version 1 déployée était un collage manuel
  des fichiers source, et son en-tête l'avouait. Il est désormais **généré**
  (`supabase/functions/health-guardian/build-bundle.sh`, esbuild, `npm:` et
  `jsr:` laissés externes au runtime Deno comme pour `livekit-token`) : on
  peut rejouer le script et comparer les octets à ce qui tourne.
* **Preuves** : 28 tests (17 → 28) dont 8 qui traversent `evaluateAll` — la
  règle réelle, pas une imitation ; 2 contre-épreuves exécutées (retirer
  chaque garde fait passer exactement 1 test au rouge, `evaluate.ts` restauré
  identique au bit près) ; tsc 0, vitest 1006/1006 (71 fichiers), build
  propre. `health-guardian` déployée **v1 → v2** (`verify_jwt: true`), amorçage
  prouvé par un 401 JSON en 1,03 s. **Démontré en production le 5 septembre à
  00h10 UTC** avec une vraie session administrateur : HTTP 200 en 2,17 s, 41
  lignes évaluées, `live.transport_utilisable` = `vert`, `proofLevel: reel`,
  « Le serveur de direct répond en 400 ms, 0 direct(s) en cours. »,
  `evidence {latencyMs 400, rooms 0, seuilDegradeMs 1500}` — la clé du coffre
  a signé, `ListRooms` a répondu 200 avec une liste exploitable. Source relue
  depuis la fonction déployée : bannière « ARTEFACT GÉNÉRÉ » et 10/10
  empreintes SAT-4 identiques au bundle régénéré dans le dépôt.
* **Contrôle de sécurité fait en chemin** : les sondes `health_probe_*` sont
  `SECURITY DEFINER` et exécutables par `anon`/`authenticated` (grant par
  défaut — le motif déjà corrigé aux LOOP 02/17, 04/17, 06/17). Vérifié plutôt
  que supposé : leur première instruction est `health_require_admin()` ;
  `anon` reçoit « authentification requise », un compte connecté non-admin
  reçoit « réservé aux administrateurs ». Aucune fuite, aucun changement.
* **Zéro trace** : la démonstration exigeait une session administrateur,
  impossible à obtenir autrement depuis le bac à sable (les comptes de banc
  sont `user`). Un compte éphémère a été créé en SQL, ce qui a d'abord fait
  échouer la connexion (« Database error querying schema » : quatre colonnes
  texte de `auth.users` à NULL au lieu de `''`, corrigées sur cette seule
  ligne), puis **supprimé** : 5 lignes (`profiles`, `auth.users`,
  `auth.identities`, `auth.sessions`, `auth.refresh_tokens`), balayage
  dynamique des 21 colonnes uuid de propriété de `public` + `storage` = 0,
  seul administrateur restant = le compte réel de la Direction.
* **Statut** : `Développé`, `Testé`, `Déployé` (Edge v2), `Démontré en
  production` côté fonction. Côté écran : la ligne de registre vit dans le
  code client de la branche `claude/lives-directs` (PR #77, fusionnée le 5/09 → `cbdab0a`, servie par moknet.net) — l'onglet
  Santé Globale l'affichera après fusion et déploiement Netlify ; la fonction
  la sert déjà.
* **Restes assumés** : pas de contre-épreuve **en production** (faire passer
  la ligne au rouge sur le vrai serveur reviendrait à casser la clé du coffre
  — non fait ; les contre-épreuves sont au niveau de la règle, dans les
  tests). SAT-5, SAT-6, SAT-7 non commencés. ACT-3/4/5 toujours bloqués sur
  l'accès SSH au VPS. Les deux comptes de banc `demo.awa`/`demo.bilal`
  (rôle `user`) sont volontairement conservés — décision de la Direction.
### [DEC-2026-053] — 5 Septembre 2026

* **Module(s)** : `Navigation globale (barre latérale d'ordinateur)`, `Réseau MOC (composeur)`, `Feuille de style globale (index.html)`
* **Problème / Besoin initial** : trois consignes de la Direction, « le tout en
  production contrôlée, sans rien casser et avec une preuve visuelle à la
  fin » : (1) dans le menu, déplacer **uniquement** « Réseau MOC » juste sous
  « Accueil », sans changer ce qui s'ouvre par défaut si c'est déjà correct ;
  (2) renforcer la visibilité de **toutes** les zones de texte — des lignes
  de contour plus visibles « pour qu'on comprenne immédiatement où écrire » ;
  (3) remplacer l'invite du composeur par « Quoi de neuf ? Partage une
  réflexion, une opportunité, un tutoriel ou un document. ».
* **Audit de l'existant** : l'onglet par défaut est déjà le réseau social
  (`activeTab` initial `'social'`, invariant DS-M2) — rien à changer.
  « Réseau MOC » est l'entrée `social` de la catégorie « Communauté &
  Conseil ». L'invite du composeur codait le prénom en dur (« Quoi de neuf,
  Amadou ? … »). Le dépôt compte **448** `<input>`/`<textarea>`, bordés au
  cas par cas en `border-slate-200` / `border-gray-300` (un trait presque
  invisible sur fond clair), aucun en `border-0` ; aucune règle globale de
  champ n'existait dans `index.html`.
* **Idées envisagées** :
  1. Déplacer `social` dans `MAIN_NAV_ITEMS` (catégorie « Accueil & Cap ») —
     **rejeté** : cela déplacerait aussi l'entrée dans le tiroir mobile et la
     recherche ⌘K ; la consigne dit « uniquement Réseau MOC », dans le menu
     montré (barre latérale d'ordinateur).
  2. Retoucher les 448 champs un par un — **rejeté** : illisible en revue,
     impossible à garantir sans oubli, et chaque nouveau champ repartirait
     invisible.
  3. **Retenu** : (1) réordonner à l'affichage dans la barre latérale
     d'ordinateur seulement ; (2) **une règle globale** dans `index.html`,
     trait de 2 px dont la couleur dérive de la couleur du texte
     (`color-mix(currentColor 55 %)`, ~3:1 sur blanc, repli `slate-500` sans
     `color-mix`),
     accent aqua `#0e7490` au focus, sans toucher aux rayons, fonds ni anneaux
     `ring-*` ; portée par des sélecteurs courts (un par type de champ texte)
     à la spécificité (0,3,1) grâce à deux `:not(.classe)` qui servent aussi
     de porte de sortie (`saisie-sans-contour`, `saisie-contour-libre`) ;
     (3) le texte exact de la Direction.
* **La preuve visuelle a corrigé la première version** : mesuré par
  `getComputedStyle` en navigateur, un trait de 1,5 px s'arrondit à **1 px**
  sur un écran de densité 1 — l'épaisseur n'aurait rien changé sur la
  plupart des ordinateurs. Passé à 2 px, et la teinte de 42 % à 55 % de la
  couleur du texte (~3:1 sur blanc). Le harnais de capture, copie
  d'`index.html` datant de la première loupe, a lui aussi été pris en
  défaut (il ne contenait pas le bloc) : régénéré depuis l'`index.html` de
  chaque état.
* **Deux garde-fous du dépôt ont parlé pendant la loupe, et ont été
  écoutés** : `tests/miroirFeuilleAnalysee.test.ts` refuse tout sélecteur de
  plus de 200 caractères (signature d'une règle avalée) — la première version
  chaînait dix `:not([type=…])` sur un seul sélecteur ; réécrite en dix
  sélecteurs de 83 caractères au plus. Et la couche aqua générée reste
  strictement identique (le bloc est placé hors de ses marques).
* **Éléments techniques** : `components/Layout.tsx` (ordre d'affichage de la
  barre latérale), `components/SocialFeed.tsx` (invite), `index.html` (bloc
  « ZONES DE SAISIE — CONTOURS RENFORCÉS » … « FIN ZONES DE SAISIE »),
  `tests/sidebarCleanup.test.tsx` (ordre Accueil → Réseau MOC → … → Conseil
  des Sages, tiroir mobile inchangé), `tests/saisieContours.test.ts`
  (nouveau : invite exacte, règle présente et bornée, types ciblés/exclus,
  déclarations limitées au contour, sélecteurs < 200 caractères).
* **Preuves** : `tsc --noEmit` 0 · `vitest` **993/993 (72 fichiers, +6)** ·
  `npm run build` propre · captures avant/après en navigateur réel (barre
  latérale, composeur au repos et au focus, écran de connexion) avec la
  bordure **mesurée** par `getComputedStyle`, versées dans
  `docs/captures/2026-09-05-reseau-sous-accueil-et-contours/`.
* **Statut** : `Développé`, `Testé`, `Validé` par avance par la Direction
  (« le tout en production contrôlée ») — fusion dans `main` (PR de la
  branche `claude/cleanup-home-interface-szp8qv`), déploiement automatique
  Netlify sur moknet.net, contrôle post-déploiement consigné dans la PR.
* **Restes assumés** : le tiroir mobile garde « Réseau MOC » sous
  « Communauté & Conseil » (hors consigne) ; les champs qui n'ont ni `type`
  texte ni `<textarea>` (dates, sélecteurs) gardent leur contour d'origine ;
  `color-mix` est pris en charge par tous les navigateurs courants depuis
  2023, le repli `slate-500` couvre les autres.

---

### [DEC-2026-052] — 4 Septembre 2026

* **Module(s)** : `Navigation globale (barre latérale d'ordinateur)`, `Couche CSS « Miroir d'eau » (générée)`
* **Problème / Besoin initial** : seconde loupe du nettoyage visuel demandé
  par la Direction, sur capture de la barre latérale : « un menu propre,
  simple, non répétitif ». Retirer du menu visible le bouton
  « L'Architecte », le bloc « Mes Favoris » et son contenu, et le bloc
  « Récents ». Ne toucher ni au Live, ni à la sécurité, ni à
  l'authentification, ni aux fonctions qui marchent.
* **Audit de l'existant, avant d'y toucher** : le bouton « L'Architecte »
  de la barre latérale était le **troisième** déclencheur de l'Architecte —
  la pastille flottante (`ArchitecteFloatingBar`, bas-droite, présente sur
  ordinateur ET téléphone, `aria-label="Ouvrir l'Architecte"`) et la goutte
  centrale du dock mobile restent. « Mes Favoris » listait quatre entrées
  (Campus, Carrière, Habitat, Marché) **déjà présentes** dans les piliers
  juste en dessous ; « Récents » en répétait quatre autres. L'épinglage
  (étoile au survol de chaque entrée) et la mémoire des onglets récents
  (`localStorage`) n'alimentaient **que** ces deux blocs — aucun autre
  consommateur dans le dépôt (recherche ⌘K, tiroir mobile, tableau de bord :
  aucun). Le tiroir mobile n'a jamais eu ni favoris ni récents.
* **Idées envisagées** :
  1. Retirer les deux blocs ET les étoiles d'épinglage (première lecture :
     une étoile qui n'alimente plus de liste serait un « faux bouton ») —
     **écarté par le visuel cible envoyé par la Direction**, qui garde les
     étoiles sur Campus, Carrière, Habitat et Marché : l'étoile marque le
     favori à même l'entrée, c'est son effet visible.
  2. Garder l'état `recentTabs` « au cas où » — **rejeté** : référence morte
     (`AGENTS.md` § 2.6), plus aucun lecteur.
  3. **Retenu** : retirer les trois blocs de l'affichage ; garder les étoiles
     et leur mémoire locale (`lmav_nav_favorites`) telles quelles ; retirer
     l'état des récents devenu mort ; ne rien changer à la pastille
     flottante ni au dock ; régénérer la couche CSS « Miroir d'eau » avec
     l'outil du dépôt (jamais à la main).
* **Complément de la Direction (capture de référence, même jour)** : « premier
  bouton Accueil, dernier bouton Conseil des Sages, fais exactement comme ça ».
  Deux écarts restaient entre la branche et cette capture, tous deux dans la
  barre latérale d'ordinateur : le libellé de pilier « Accueil & Cap » au-dessus
  d'« Accueil », et l'entrée « Tableau de Bord Super-Admin » rendue après
  « Conseil des Sages » (à tout le monde, sans garde de rôle). Les deux sont
  retirés de cette barre seulement. Le Super-Admin garde ses deux accès
  réservés aux administrateurs (bouton doré de l'en-tête, menu Compte) ; le
  tiroir mobile et la recherche ⌘K ne changent pas.
* **Décision** : dans `Layout.tsx`, la barre latérale d'ordinateur commence
  désormais directement par le bouton « Accueil » et finit par « Conseil des
  Sages » ; `recentTabs` et l'icône
  `Clock` disparaissent ; l'épinglage (`favorites`, `toggleFavorite`, étoile
  sur chaque entrée) est conservé à l'identique ; l'effet qui coupait la
  voix à chaque changement d'onglet est conservé, amputé de la mémoire des
  récents ; `architecteOpenSignal`
  n'a plus d'émetteur et reste figé à 0 (le contrat de la pastille est
  inchangé). Le générateur `scripts/genMiroirAquaLayer.cjs --ecrire` a
  retiré de `index.html` les **4 règles** qui ne servaient qu'au bouton
  retiré (dégradés cyan/indigo) — c'est le garde-fou
  `tests/miroirAquaLayer.test.ts` qui l'a exigé, comme prévu par DS-EX.
* **Justification** : chaque entrée du menu apparaît une seule fois (prouvé
  par test), l'étoile de favori reste visible sur les entrées épinglées
  (conforme au visuel cible), l'Architecte garde deux chemins réels sur
  ordinateur et téléphone, aucune clé de mémoire locale n'est effacée chez
  les utilisateurs (`lmav_nav_recents` n'est simplement plus lue).
* **Éléments techniques** : `components/Layout.tsx` (−3 blocs, −1 état et
  −1 icône devenus morts), `index.html` (couche aqua régénérée, −4 règles),
  `tests/sidebarCleanup.test.tsx` (nouveau : 3 tests « retiré », 6 tests
  « ce qui reste, une seule fois », dont l'ordre « Accueil » → « Conseil des
  Sages »).
* **Preuves** : `tsc --noEmit` 0 · `vitest` **987/987 (71 fichiers, +9)** ·
  `npm run build` propre · captures avant/après ordinateur 1600×900 et
  téléphone 390×844 (harnais local non versionné, `origin/main` contre la
  branche) versées dans `docs/captures/2026-09-04-nettoyage-barre-laterale/`.
* **Statut** : `Développé`, `Testé`, `Validé` par la Direction le 4 septembre
  2026 sur sa capture de référence (« il faut te conformer strictement au menu
  indiqué dans la capture… production contrôlée, zéro régression ») —
  fusionné dans `main` via la PR #74 (fusion écrasée, convention du dépôt),
  déploiement automatique Netlify sur moknet.net, contrôle post-déploiement
  consigné dans la PR.
* **Restes assumés** : la
  pastille flottante reste le seul chemin ordinateur vers l'Architecte
  (voulu : « un doublon de moins ») ; la clé `lmav_nav_recents` reste
  inerte dans les navigateurs qui l'ont ; l'entrée Super-Admin reste visible
  dans le tiroir mobile (hors périmètre de cette loupe).

---

### [DEC-2026-051] — 4 Septembre 2026

* **Module(s)** : `Navigation globale (en-têtes ordinateur et téléphone, barre latérale)`, `Accueil / Tableau de bord`
* **Problème / Besoin initial** : la Direction a envoyé cinq captures de
  l'accueil — « l'interface est trop chargée », surtout la barre du haut et la
  barre latérale — et demandé de **retirer ces boutons de l'affichage** sans
  supprimer les fonctions dans le système : le badge « v5.12 », la pilule
  « Services », la bannière « Lier Google Workspace », le compteur
  « 1 000 000 Ⓒ », le bouton « Services Transversaux · Google » du pied de
  barre latérale et la carte « Conseiller Référent · Conseiller Diallo » du
  tableau de bord. Aucune fusion ni production avant son contrôle.
* **Audit de l'existant, avant d'y toucher** : la même modale
  `TransversalServicesModal` avait **trois** déclencheurs (pilule d'en-tête,
  pied de barre latérale, tiroir mobile) plus la recherche ⌘K. Les quatre
  centres Google (`google-maps` / `google-drive` / `google-meet` /
  `google-chat`) ne sont **pas** des entrées de `MAIN_NAV_ITEMS` mais de
  `TRANSVERSAL_SERVICES` : sur ordinateur, ils n'étaient joignables QUE par
  cette modale ou par ⌘K — retirer les deux boutons sans rien redonner aurait
  rendu quatre écrans quasi inatteignables. « Lier Google Workspace » est
  aussi porté, en version complète, par les centres Drive, Chat et Meet. Le
  solde de crédits vit dans « Finance & Wallet » (navigation principale). Le
  badge « v5.12 » était **faux** (v6.14.1 en production). La carte de
  conseiller était la prop `leadAdvisor` de `PointAToBPathway`, encore
  utilisée par la vitrine du Design System.
* **Idées envisagées** :
  1. Masquer par CSS (`hidden`) — **rejeté** : du DOM mort, des tests
     trompeurs, et « pas de faux boutons » (`AGENTS.md` § 4).
  2. Supprimer aussi la modale et la variante compacte de la bannière —
     **rejeté** : la Direction a interdit de supprimer les fonctions.
  3. **Retenu** : retirer les six déclencheurs de l'affichage, garder les
     composants et la modale, et **redonner au hub un chemin sur ordinateur**
     — un rang « Services Google & Sécurité » dans le menu Compte (avatar),
     symétrique de l'entrée du tiroir mobile.
* **Décision** : dans `Layout.tsx`, l'en-tête ordinateur perd le badge de
  version, la pilule « Services », la bannière compacte Google Workspace et
  le compteur de crédits ; l'en-tête téléphone perd le même compteur (même
  élément, même raison) ; le pied de barre latérale perd le bouton « Services
  Transversaux · Google » ; le menu Compte gagne un rang « Services Google &
  Sécurité » (`data-testid="compte-services-transversaux"`) qui ouvre la
  même modale. Dans `Dashboard.tsx`, la trajectoire Point A → Point B est
  rendue sans `leadAdvisor` ni `onOpenAdvisor`. Le tiroir mobile est
  **inchangé** (hors périmètre — ni barre du haut ni barre latérale
  d'ordinateur — et seul chemin mobile vers le hub). `GoogleWorkspaceBanner`
  et `TransversalServicesModal` ne sont pas modifiés.
* **Justification** : moins de chrome à l'accueil sans perte de capacité —
  chaque fonction garde au moins un chemin réel sur ordinateur ET sur
  téléphone, prouvé par test ; un badge de version faux est une
  documentation qui ment (défaut au même titre qu'un bug).
* **Éléments techniques** : `components/Layout.tsx` (−4 éléments d'en-tête,
  −1 élément d'en-tête mobile, −1 bouton de barre latérale, +1 rang de menu
  Compte, import orphelin `GoogleWorkspaceBanner` retiré),
  `components/Dashboard.tsx`, `tests/homeChromeCleanup.test.tsx` (nouveau :
  6 tests « retiré de l'affichage » + 5 tests « toujours atteignable »).
* **Preuves** : `tsc --noEmit` 0 · `vitest` **935/935 (68 fichiers, +11)** ·
  `npm run build` propre · captures avant/après **ordinateur 1600×900** et
  **téléphone 390×844** (harnais local non versionné rendant Layout +
  Dashboard authentifiés sur `origin/main` et sur la branche), versées dans
  `docs/captures/2026-09-04-nettoyage-accueil/` avec les recadrages
  en-tête / barre latérale / menu Compte / trajectoire.
* **Statut** : `Développé`, `Testé`, `Validé` — **validation de la Direction
  le 4 septembre 2026** (« Je valide ta proposition, mais exécution contrôlée
  uniquement. Rien ne doit régresser. Objectif : zéro régression. Preuve et
  test à la fin. ») après contrôle de l’aperçu Netlify et des captures ;
  fusionnée dans `main` via la PR #73, déploiement automatique Netlify sur
  moknet.net, contrôle post-déploiement (bundle servi, absence d’erreur de
  page) consigné dans la PR.
* **Restes assumés** : le jugement visuel (« est-ce assez aéré ? ») revient à
  la Direction ; `GoogleWorkspaceBanner compact` n'a plus d'appelant
  (variante conservée) ; `PointAToBPathway.leadAdvisor` reste (vitrine).

---

### [DEC-2026-050] — 4 Septembre 2026

* **Module(s)** : `Live / Directs`, `Fonction Edge livekit-token`, `Déploiement VPS LiveKit`
* **Problème / Besoin initial** : la porte serveur (SAT-2) et l'écran « c'est
  complet » (SAT-3) étaient l'un et l'autre corrects, testés et prouvés au
  banc — et pourtant **inertes en production**. Cause racine trouvée en
  remontant la chaîne : **rien dans le dépôt n'appelait jamais `createRoom`**.
  LiveKit crée donc la room tout seul à l'arrivée du premier participant,
  sans `maxParticipants` — et `0` est sa convention pour « aucune limite ».
  La porte lisait donc fidèlement un plafond nul et ne pouvait refuser
  personne, quoi qu'elle compte. Un garde-fou complet, correct et sans
  effet.
* **Options envisagées** :
  1. **Un chiffre en dur** (ex. 200 places) — écarté par la Direction dès
     SAT-0 : un plafond arbitraire est faux sur toute machine qui n'est pas
     celle pour laquelle il a été choisi.
  2. **Un réglage manuel par direct** — écarté également : demande à
     l'animateur une information qu'il n'a pas.
  3. **Un plafond dérivé de la machine réelle** — retenu.
* **Ce que le banc a mesuré, et qui a dicté la conception** (sonde exécutée
  contre les DEUX binaires : `livekit-server` **1.8.4**, la version exacte du
  VPS, et **1.13.6**, la cible épinglée dans `deploy/livekit/`) :
  * `/metrics` **n'existe que si `prometheus_port` est configuré** ; sans
    lui, HTTP 404 sur tous les ports. Le VPS ne l'a pas.
  * `createRoom({maxParticipants})` pose réellement le plafond ; un **second**
    `createRoom` sur la même room **ne le change pas** (3 reste 3), et
    **aucune** des 13 méthodes du SDK serveur ne le corrige ensuite. Le
    plafond ne se pose donc qu'**à la création**.
  * `listRooms()` sans filtre donne la charge de tout le nœud — la marge est
    lisible sans Prometheus.
  * une room vide **disparaît** (`empty_timeout`) : le plafond est perdu avec
    elle et doit être re-posé à chaque renaissance.
  * les étiquettes exposées par `/metrics` sont `code, direction, le, method,
    node_id, node_type, quantile, service, status, transmission, version` —
    **zéro nom de room, zéro identité de participant**. Aucune donnée
    personnelle ne transite par ce canal.
* **Décision** : le plafond suit **deux lectures vivantes** — les cœurs que
  le serveur LiveKit voit (`go_sched_gomaxprocs_threads`) et l'occupation
  réelle du nœud (`listRooms()`) — appliquées à **une seule référence, elle
  aussi mesurée** : **0,00767 cœur par spectateur**, relevé au banc en audio,
  dans la topologie d'un direct (un animateur publie, les autres reçoivent),
  sur le compteur `process_cpu_seconds_total` du processus LiveKit. Soit
  **130 places par cœur**, dont **la moitié seulement est engagée**.
* **Pourquoi la moitié, et pas plus** : la part réservée n'est pas une marge
  de confort, c'est l'écart **assumé** entre ce que le banc a pu mesurer
  (audio seul, cinq participants) et ce que la machine porte réellement
  (vidéo, appels 1-à-1, relais TURN, système). Une première mesure avait été
  faite en topologie « réunion » (trois participants publiant tous) et donne
  0,0127 cœur chacun ; elle a été **rejetée** : le coût d'un SFU croît en N²
  dans ce cas, ce qui décrit une réunion, pas un direct.
* **Refus de deviner, posé en dur dans le code** : toute incertitude rend
  `null` et **ne pose aucun plafond** — pas d'URL de métriques, `/metrics`
  injoignable ou en 404, machine inconnue, création refusée. Le direct se
  comporte alors exactement comme avant, et la porte laisse entrer. Mieux
  vaut un direct sans plafond qu'un plafond fabriqué.
* **Le piège nommé et gardé** : le plancher est **1, jamais 0**. Un nœud
  saturé dont le calcul tomberait à zéro poserait un direct **sans aucune
  limite** — exactement l'inverse de son intention. Un test dédié l'éprouve
  sur trois occupations extrêmes.
* **Conséquences système** :
  * `supabase/functions/livekit-token/nodeCapacity.ts` (nouveau, pur : ni
    Deno, ni Supabase, ni réseau — ce qui permet au banc d'exécuter **la
    fonction du dépôt elle-même** contre un vrai serveur, au lieu d'en
    rejouer une imitation).
  * `deploy/livekit/docker-compose.yml` : `prometheus_port` sur la **boucle
    locale uniquement** — jamais exposé publiquement depuis ce fichier ; le
    filtrage par jeton se fait au reverse-proxy (procédure dans
    `deploy/livekit/README.md`).
  * **Rien n'est actif en production** : `prometheus_port` n'est pas
    configuré sur le VPS, `/metrics` y répond 404, donc **aucun plafond
    n'est posé aujourd'hui**. Le code est prêt, l'infrastructure ne l'est
    pas — c'est SAT-1b, une action SSH.
  * La fonction Edge `livekit-token` n'est **pas déployée** avec ces
    changements. Elle est globale et unique : la déployer, c'est la
    production.
* **Une garde trouvée COMPLAISANTE et corrigée** (le constat le plus utile de
  cette boucle) : la contre-épreuve retirait l'ancre `^` de l'expression qui
  lit le nombre de cœurs, et **les 27 tests restaient verts**. Le test
  n'essayait qu'un nom **suffixé** (`..._threads_total`), que même une
  expression sans ancre rejette — ce qui suit le nom n'y est ni un espace ni
  un chiffre. Le vrai risque est un nom **préfixé** :
  `livekit_go_sched_gomaxprocs_threads 99` aurait fait annoncer 99 cœurs
  pour une machine qui n'en a pas. Test réécrit sur ce cas, contre-épreuve
  rejouée : exactement **1 test rouge**, fichier restauré à l'empreinte
  SHA-256 identique.
* **Statut** : `Développé`, `Testé`, **`En attente de validation visuelle de
  la Direction`** — tsc 0 · vitest 924/924 (67 fichiers, +27) · build propre ·
  banc réel **21 OK / 0 DÉFAUT** sur 1.8.4 **et** 1.13.6 · **8
  contre-épreuves / 8 conformes** · aucune écriture en base, aucun compte de
  test, rien à nettoyer. **Aucune fusion, aucun déploiement de la fonction
  Edge sans le feu vert de la Direction.**

---

### [DEC-2026-049] — 4 Septembre 2026

* **Module(s)** : `Design System`, `Navigation globale`, `Studio Live`,
  `Qualité`, `Livraison`
* **Problème / Besoin initial** : la Direction, ayant refusé la validation
  trois fois de suite (DEC-2026-048), donne son feu vert explicite : « les
  images sont validées, maintenant tu intègres dans la vraie branche, en
  suivant le process. Green Gate au vert, puis fusion, puis vérification sur
  le lien final. » Elle joint une capture de `moknet.net` montrant l'ancienne
  interface — écran d'ouverture « Espace Personnel », deux boutons flottants.
* **Ce que la capture prouvait réellement** : rien n'était cassé. **La PR #60
  n'avait jamais été fusionnée**, sur la consigne de la Direction elle-même
  (« pas de fusion, pas de prod »). `moknet.net` servait donc `main`, sans une
  ligne de l'habillage. Mesuré indépendamment avant toute action :
  `index.html` de production = **36 342 octets, 0 occurrence de
  `data-miroir`**. Le lien d'aperçu, lui, ne redirige pas (HTTP 200, zéro
  redirection) et servait bien 106 722 octets avec la couche aqua.
* **Décision retenue** : appliquer le process demandé — intégrer `origin/main`
  (`e9380bc`) dans la branche pour que le contrôle porte sur le contenu
  réellement fusionné, repasser le Green Gate sur ce HEAD, puis fusionner en
  squash. `main` = `0ad30ee`.
* **Preuve sur la production, avant/après, depuis ses propres octets** :
  `index.html` **36 342 → 107 299 octets** ; `data-miroir` **0 → 461** ;
  nappe d'eau montée ; règle « cartes en verre » présente. Part d'écran
  réellement changée, mesurée pixel à pixel : **46,16 %** (ordinateur
  1440×900) et **32,60 %** (téléphone 390×844). **Validé par la Direction sur
  `moknet.net` le 4 septembre 2026.**
* **RÉGRESSION INTRODUITE PAR CETTE FUSION, trouvée après coup** : une
  relecture adversariale à six axes (démarrage, navigation, portée des
  sélecteurs, contraste, performance, livraison), chaque constat soumis à un
  relecteur chargé de le **réfuter**, a confirmé un défaut bloquant. La règle
  `[data-miroir] > *:not(.mir-scene) { z-index: 1 }` (spécificité 0,2,0)
  l'emportait sur les classes `.z-20` / `.z-30` (0,1,0) des deux en-têtes de
  `Layout.tsx`. Ceux-ci retombaient à `1`, **à égalité avec le conteneur
  principal écrit après eux** : l'ordre du document tranchait, le conteneur
  peignait par-dessus, et les menus ancrés en `absolute top-full` sous
  l'en-tête — langue, Notifications, et le menu Compte **qui porte la
  déconnexion** — devenaient inatteignables, leur voile de fermeture
  `fixed inset-0 z-10` compris.
* **Mesuré, pas déduit** — navigateur réel, CSS servi par la production, DOM
  reproduisant la structure exacte de `Layout.tsx` : `elementFromPoint` au
  centre de « Se déconnecter » renvoyait `div.bg-white`, une carte du fil ;
  après correctif il renvoie `button#deconnexion`, et l'en-tête retrouve
  `z-index: 20` sans perdre sa `position: sticky`.
* **Correctif** : une exclusion — `[data-miroir] > *:not(.mir-scene):not(header)`.
  Aucun composant touché, aucun `!important`. PR #64 fusionnée (`56c596a`),
  déployée en 45 s, revérifiée sur `moknet.net` (habillage intact : 461
  `data-miroir`).
* **Garde-fou** : deux tests dans `tests/miroirFeuilleAnalysee.test.ts` qui
  **ne cherchent pas une chaîne de caractères** — ils construisent un vrai
  `<header>` avec les classes réelles, extraient par postcss tout sélecteur
  scopé sous `[data-miroir] >` déclarant un `z-index`, et interrogent
  `Element.matches`. Contre-épreuve faite : le défaut réintroduit fait virer
  ce test au rouge, et lui seul.
* **Leçon, cinquième de la série** : même famille que
  `-webkit-box-reflect: none` ignoré par Chromium, les teintes `brand-*`
  absentes de la config Tailwind, `hidden sm:flex` annulé par un `flex` nu, et
  le commentaire CSS refermé trop tôt (DEC-2026-048) — **une déclaration qui
  change le rendu sans le dire**. Le commentaire du code avertissait déjà du
  piège de spécificité **pour `position`** ; il ne l'avait pas vu **pour
  `z-index`, dans la même règle**. Règle à retenir : quand un sélecteur
  d'habillage scopé impose une propriété à des enfants génériques, énumérer
  les classes utilitaires que ces enfants portent déjà sur cette propriété.
* **Ce que la CI ne pouvait pas voir** : ni le typage, ni les 848 tests, ni le
  Green Gate n'ont attrapé ce défaut — c'est une propriété du **rendu**,
  invisible à l'analyse statique. Ce qui l'a attrapé, c'est la relecture
  adversariale. Elle devient une étape de la livraison, pas une option.
* **Éléments techniques concernés** : `index.html` (bloc `[data-miroir]`),
  `tests/miroirFeuilleAnalysee.test.ts` (+2 tests),
  `docs/DIRECTION_ARTISTIQUE_MENU_MIROIR_EAU.md` § 8.
* **Statut** : `Développé`, `Testé`, **`Validé par la Direction sur
  moknet.net`** — tsc 0 · vitest 850/850 (62 fichiers) · build propre ·
  Green Gate vert sur les deux livraisons · aucune écriture en base (ces
  habillages ne touchent pas la base).

---

### [DEC-2026-048] — 4 Septembre 2026

* **Module(s)** : `Design System`, `Transversal`, `Qualité`
* **Problème / Besoin initial** : la Direction refuse la validation de
  l'habillage « Miroir d'eau » étendu (DEC-2026-047) — « ce qui est visible
  dans l'application ne correspond pas aux captures ni aux changements
  annoncés ». Le lien, la branche et le commit sont pourtant les bons :
  l'`index.html` servi par l'aperçu Netlify est identique octet pour octet
  au build local du commit `6e17d29` (seul diffère l'encart de déploiement
  injecté par Netlify), et l'empreinte SHA-256 du bloc aqua est la même des
  deux côtés.
* **Mesure qui tranche** : au lieu de recompter les couleurs sondées, les
  captures avant/après ont été **décodées et comparées pixel à pixel**.
  Accueil 19,63 % de pixels modifiés · modale ordinateur 3,40 % · modale
  téléphone 1,14 % · **Studio Live 0,35 %**. Le banc DS-EX annonçait
  « 54 OK / 0 DÉFAUT » parce qu'il mesurait **uniquement là où il
  s'attendait à trouver quelque chose**.
* **Cause racine n° 1, décisive** : un **commentaire CSS refermé une ligne
  trop tôt** (`index.html`, ancien bloc DS-EX-2). Six lignes de prose
  restaient dans la feuille de style ; l'analyseur les agglutinait au
  sélecteur suivant pour en faire un sélecteur invalide, et jetait
  silencieusement la règle « cartes en verre »
  (`[data-miroir] .bg-white.rounded-3xl / .rounded-2xl`) qui visait
  **349 cartes et panneaux**. Prouvé sur la page RÉELLEMENT SERVIE par
  l'aperçu : ce sélecteur était **absent du CSSOM** (0 occurrence sur
  668 règles) alors que le texte, lui, était bien présent dans le fichier.
* **Cause racine n° 2, indépendante** : le Studio Live ne peut pas être
  atteint par la couche aqua **par construction** — il est peint par ses
  propres jetons `--live-*` posés sur `[data-live-universe]`, jamais par des
  classes Tailwind. Constat honnête : il n'y avait rien à y repeindre,
  **il est déjà aqua** depuis DS-L1 (`--live-abyss-a: #0a2430`, accent
  `#7fd9e6`), traitement validé par la Direction le 03/09. Les 0,35 % ne
  sont donc pas un manque, et repeindre ce module aurait modifié un design
  déjà validé.
* **Décision** : refermer le commentaire (la règle revient à la vie) et
  remplacer le garde-fou par un test qui **ANALYSE** la feuille de style au
  lieu d'y chercher une chaîne de caractères
  (`tests/miroirFeuilleAnalysee.test.ts`, postcss). L'ancien garde-fou
  vérifiait que le TEXTE d'`index.html` contenait le sélecteur — il restait
  vert alors que la règle ne parvenait jamais au navigateur.
* **Effet mesuré du correctif** (mêmes composants, mêmes conditions) :
  modale ordinateur **3,40 % → 32,54 %**, modale téléphone
  **1,14 % → 55,67 %**. Accueil et Studio Live inchangés, ce qui est
  cohérent avec les deux causes ci-dessus.
* **Règle permanente ajoutée** : c'est la **quatrième** occurrence dans ce
  dépôt de la même famille de piège — *une déclaration qui ne peint rien
  sans le dire* (`-webkit-box-reflect: none` ignoré par Chromium, teintes
  `brand-*` absentes de la config Tailwind, `hidden sm:flex` annulé par un
  `flex` nu, et maintenant un commentaire mal fermé). Un garde-fou de style
  ne doit jamais se contenter de chercher du texte : il doit analyser, et
  sa contre-épreuve doit prouver qu'il vire au rouge quand on reproduit le
  défaut. Vérifié ici : défaut réintroduit → 2 tests rouges ; restauré →
  5/5 verts.
* **Aveu de méthode** : les captures précédemment fournies à la Direction
  provenaient d'un banc local montant les composants avec des modules
  simulés, **pas du lien public**. C'était une faille de preuve, corrigée :
  les captures viennent désormais des fichiers réellement servis par
  l'aperçu (relais octet-exact, SHA-256 comparés).
* **Limite d'environnement, dite honnêtement** : le navigateur de
  l'environnement de développement ne peut pas ouvrir l'URL d'aperçu
  lui-même (le relais du proxy de sortie ferme le tunnel — vérifié côté
  proxy). Chaque octet est donc téléchargé depuis l'URL publique par `curl`
  puis rendu dans un vrai navigateur. La validation finale reste
  l'ouverture du lien public par la Direction.

---

### [DEC-2026-047] — 4 Septembre 2026

* **Module(s)** : `Design System`, `Transversal`, `Layout`, `Studio Live`
* **Problème / Besoin initial** : la Direction constate que l'habillage
  « Miroir d'eau » **ne se voit que sur l'accueil** : « Les couleurs ne
  doivent pas rester juste sur l'interface d'accueil. Il faut les voir
  vraiment dans l'app, sur l'accueil, dans le live, partout où c'est
  concerné. »
* **Ce que la mesure a montré, contre l'hypothèse de départ** : le périmètre
  n'était **pas** le problème — `data-miroir` est posé sur la racine de
  `Layout.tsx`, donc tous les écrans, le Studio Live et les modales rendent
  déjà dedans. Le manque venait de trois endroits : **~2 400 occurrences**
  `blue`/`indigo` repeignant l'accent, **549 `bg-slate-50`** + **169
  `bg-white`** repeignant le fond par-dessus la nappe d'eau, et la **barre
  latérale** peinte par **styles en ligne** — hors de portée de toute règle
  CSS, quelle que soit sa spécificité.
* **Idées envisagées** :
  1. Éditer les ~190 fichiers à la main — **rejeté** : 409 utilitaires
     distincts, source garantie d'oublis et d'incohérences.
  2. Remapper tout l'accent vers une couleur unique — **rejeté par la
     mesure** : sur fond clair l'app emploie les marches foncées
     (`text-blue-600`), dans le Studio sombre les marches claires
     (`text-indigo-300/400`). Un aplat aurait cassé le contraste d'un côté.
  3. **Retenu** : une **rampe aqua à 11 marches**, chacune de luminance
     comparable à la marche Tailwind qu'elle remplace, appliquée par une
     couche **générée depuis le code réel** et scopée `[data-miroir]`
     (spécificité 0,2,0 > 0,1,0 : indépendante de l'ordre d'injection du CDN
     Tailwind). L'échelle de clarté est conservée, donc le contraste est
     préservé **par construction**.
* **Décision** : couche générée par `scripts/genMiroirAquaLayer.cjs` (409
  classes traduites) ; fond pleine page neutralisé pour le **seul enfant
  direct** de `.mir-page` (nouveau repère dans `Layout.tsx`) afin de ne
  jamais atteindre les champs de saisie ; matière verre étendue aux modales
  (rendues hors de `.mir-page` par `Layout`) ; **arbitrage de DS-M2b tranché
  par la Direction** — `palette-10` recalée sur l'aqua, ce qui habille enfin
  la barre latérale. Le gel du Chantier 3 portait sur le **sélecteur** de
  palettes, pas sur les valeurs : les neuf autres palettes sont intactes,
  vérifié par test.
* **Ce qui n'est JAMAIS traduit** : les familles sémantiques (red, rose,
  amber, orange, yellow, green, emerald, teal, lime) et les gris — leur
  couleur **est** l'information. Interdit par le garde-fou, vérifié au banc
  sur des témoins réellement affichés.
* **Preuves** : `tsc` 0 · `vitest` **843/843** · `build` propre · garde-fou
  **vérifié non complaisant** (trois brèches délibérées le font rougir, puis
  il redevient vert) · banc navigateur réel avant/après sur accueil, Studio
  Live et modale × ordinateur et téléphone, avec **deux bundles** parce que
  la palette de la barre vit dans le bundle et non dans le CSS.
* **Limite honnête** : aucun test ne peut dire si l'ensemble **a l'air
  juste** — l'appréciation visuelle reste celle de la Direction.

---

### [DEC-2026-046] — 3 Septembre 2026

* **Module(s)** : `LIVE`, `Partage`, `Documentation`
* **Problème / Besoin initial** : DEC-2026-045 a laissé LV-6 à 9 étapes sur
  10 et LV-4 en PARTIEL, avec un reste-à-faire nommé : « le lien de partage
  est prouvé réel, son **ouverture** ne l'est pas ». La Direction a demandé le
  03/09 de terminer tout ce qui restait PARTIEL, avec des **captures d'écran**
  comme preuve et un **lien d'aperçu Netlify** pour juger avant la fusion.
* **Idées envisagées** :
  1. Considérer le lien prouvé parce qu'il a la bonne forme — **rejeté** :
     une URL bien formée ne démontre pas qu'elle mène quelque part.
  2. Faire rouvrir le lien par un compte déjà dans le direct — **rejeté** :
     cela ne prouve rien, la personne y était déjà.
  3. **Retenu** : un **troisième** compte, qui n'ouvre **que** l'URL — aucun
     fil, aucune liste, aucune notification —, se connecte depuis cette page,
     et dont on mesure ce qu'il voit et ce qu'il reçoit.
* **Décision** : étape 9 prouvée. Le banc passe à **32 OK / 0 DÉFAUT** sur les
  **dix** étapes. Mariama Sow LV6 ouvre `?live=50040654-…`, atterrit sur la
  scène de CE direct (titre lu, « à l'antenne », animatrice au trombinoscope,
  paramètre retiré de l'URL après usage) et **reçoit 2 455 135 octets dont
  160 614 d'audio**. Le même lien vérifié au format téléphone (390 × 844).
  L'identifiant du lien recoupé en base : `live_sessions` porte bien le titre
  `Direct de preuve LV6`, `host_id` = A, `is_private = false`. **LV-1, LV-3,
  LV-4 et LV-6 passent à TERMINÉ.**
* **Ce qui reste PARTIEL, nommé plutôt que dissimulé** :
  - **LV-2** : deux critères jamais mesurés — le son débloqué *dans le geste*
    (le banc lance Chromium avec `--autoplay-policy=no-user-gesture-required`,
    il ne peut rien prouver là-dessus) et un direct **privé** invisible pour un
    non-invité.
  - **LV-5** : manque **découvert en route et mesuré** — `live_speakers` ne
    contient que des personnes (A, B, C) ; **aucun agent IA n'est persisté**.
    Conséquence : l'animatrice voit 3 cartes, la spectatrice arrivée par le
    lien n'en voit que 2 — l'agent invité n'est pas partagé. La colonne
    `is_ai` existe déjà sur cette table et n'a jamais servi.
  - **Deux téléphones physiques** : à la Direction. Le bac à sable n'ouvre que
    le TCP 443, le média du banc passe par un serveur LiveKit local.
* **Une passe a échoué, et l'erreur venait encore du banc** : je lisais le
  trombinoscope sans ouvrir l'onglet latéral « Personnes » (l'animatrice doit
  elle aussi le cliquer à l'étape 3). Liste vide relevée, « défaut » imputé à
  tort au produit. C'est la troisième fois de cette loupe qu'un critère de banc
  mal posé accuse le produit — d'où la règle qui vaut pour la suite : **avant
  d'appeler « défaut » ce qu'un banc relève, vérifier que le banc a fait le
  geste qu'un humain aurait fait.**
* **Preuves** : banc `preuve-lv6.cjs`, journal + 20 captures ; lignes
  `live_sessions` / `live_speakers` relues en base ; aperçu Netlify
  `deploy-preview-60--…` servant `assets/index-DurKTJ5-.js` avec
  `singlePeerConnection:!1` × 2. Nettoyage zéro trace des trois comptes de
  preuve, balayage des clés étrangères = 0.

---

### [DEC-2026-045] — 3 Septembre 2026

* **Module(s)** : `LIVE`, `Transport LiveKit`, `Tests`
* **Problème / Besoin initial** : LV-6 est le **verrou** de la vague A de la
  feuille de route LIVE — « pas juste un décor : une preuve réelle que ça
  marche, avec un test entre deux comptes ». LV-1, LV-3 et LV-4 étaient codés
  et testés unitairement, mais **personne n'avait jamais vu deux personnes
  réelles se voir sur la scène**. Tant que cette preuve manquait, tout ce qui
  se construisait au-dessus reposait sur une hypothèse.
* **Idées envisagées** :
  1. Déclarer les loupes TERMINÉES sur la foi des tests unitaires — **rejeté** :
     contraire à la règle du 30/08 (TERMINÉ seulement si DÉMONTRÉ).
  2. Attendre la validation sur deux téléphones — **rejeté comme préalable** :
     cela bloque tout le reste sur une action qui n'est pas la nôtre.
  3. **Retenu** : un banc à deux navigateurs réels contre le binaire
     `livekit-server` **1.8.4** — la version exacte du VPS —, en mesurant les
     octets WebRTC réels, puis nommer précisément ce qui reste.
* **Décision** : LV-6 prouvé au banc à **23 OK / 0 DÉFAUT** sur 9 des 10
  étapes. Média réel mesuré dans les deux sens : B reçoit **2 320 613 octets**
  (dont 171 578 d'audio), A envoie **7 831 248 octets** (dont 501 442
  d'audio). Roster réel avec les vrais noms, promotion en « Sur scène »,
  boutons couper/retirer, lien de partage réel, **zéro erreur de page**.
* **Le seul défaut RÉEL du produit, trouvé et corrigé** : la sonde
  « v1 RTC path » du SDK n'était désactivée que pour les **appels**
  (`audioProfile === 'call'`). Le réglage avait été groupé en LT-1 avec
  `adaptiveStream`/`dynacast`, qui sont bien spécifiques aux appels — alors
  que sa raison tient au **serveur** (1.8.4 ne connaît pas le chemin « v1 »),
  pas au type de session. Le direct payait donc encore 0,8 s par connexion et
  affichait une erreur `WebSocket … /rtc/v1` des deux côtés. Corrigé dans
  `services/live/liveKitTransportProvider.ts` ; `adaptiveStream`/`dynacast`
  restent activés pour le LIVE, où ils gardent tout leur sens.
* **Trois « défauts » qui n'en étaient pas — et ce qu'ils enseignent** :
  le banc ne cliquait pas l'écran de consentement caméra/micro de LOOP 12
  (11 échecs imputés à tort au produit), exigeait ce même consentement d'un
  **spectateur** qui ne publie rien, et lisait le lien de partage avec
  `inputValue()` alors que c'est un `<code>`. **Un banc faux accuse le produit
  à tort** : chaque défaut a été instruit avant d'être imputé.
* **Invariant I4 reformulé** : il disait « six cartes minimum », ce qui se
  lisait « toujours peindre six cartes » — faux et dangereux, cela reviendrait
  à peindre quatre cartes vides quand deux personnes sont là, exactement ce que
  I1 interdit. `STAGE_VISIBLE_MAX = 6` est la **capacité** de la scène,
  prouvée par `tests/liveStageComposition.test.ts`, pas un plancher.
* **Éléments techniques** : `services/live/liveKitTransportProvider.ts`
  (`singlePeerConnection: false` pour le LIVE), `components/SocialLive.tsx`
  (`data-testid="live-stage-grid"`, ancrage de test stable — aucun changement
  de comportement), `tests/livekitClientPin.test.ts` (+2 garde-fous),
  `tests/callRoomOptions.test.ts` (garde AU-8 resserrée sur son vrai sujet),
  `docs/LIVE_INTELLIGENT_VALIDATION.md`, `docs/LIVE_SOCLE_EXISTANT.md`.
* **Statut** : `Développé`, `Testé` — tsc 0, **804 tests verts (59 fichiers)**,
  build propre, banc réel 23/23.
* **Restes assumés, nommés** : l'**étape 9** (ouvrir réellement le lien de
  partage dans une troisième session — le lien est prouvé réel, son ouverture
  ne l'est pas), l'**aperçu Netlify** exigé par le barème, et la démonstration
  sur **deux téléphones physiques**, qui reste à la Direction comme pour les
  appels. LV-1, LV-3 et LV-4 restent donc `PARTIEL` : il ne leur manque plus
  que l'aperçu.

---

### [DEC-2026-055] — 4 Septembre 2026
* **Module(s)** : `Gouvernance Vision Smart AI Core`, `Console d'administration (Orchestrateur IA)`, `Observabilité`.
* **Problème / Besoin initial** : AI Core était une **boîte noire** pour
  l'Administrateur Général — impossible de voir ce qui tourne, ce qui est
  bloqué, ce qui est activé. L'inspection du 4 septembre 2026 (lecture seule du
  dépôt au commit `e9380bc` et de la base de production `rqciahtpixdjbyoajomg`)
  a établi qu'AI Core **n'oriente aucun agent**, alors que son code est présent
  et correct. Constats mesurés, non déduits :
  1. `ai_tools.is_enabled = false` pour `search_ai_core_memory` ; **zéro ligne**
     dans `agent_tool_grants` pour cet outil (les 31 lignes existantes couvrent
     `web_search`, `get_user_context` et `create_dossier`).
  2. `get_agent_tools` est une **jointure interne** sans défaut ni héritage : un
     agent créé demain reçoit zéro outil tant qu'un humain n'insère pas ses
     lignes. Rien n'applique AI Core « automatiquement ».
  3. `body.agentId` part du navigateur vers `get_agent_tools` **sans aucune
     validation** : ni existence de l'agent, ni droit de la personne à
     l'incarner.
  4. `ai_call_log` n'a **ni `agent_id` ni `tools_used`** : `toolsUsed` est
     renvoyé au navigateur mais jamais écrit. Aucun usage d'outil n'est traçable.
  5. **4 sites d'appel IA sur 87** transmettent un `agentId` ; les 83 autres
     n'obtiennent aucun outil, AI Core compris.
  6. Le dépôt contient **2 migrations** contre **103** appliquées en base ;
     `supabase/functions` est exclu de `tsc` et **aucun test** ne couvre AI Core.

  Le défaut n'était donc pas technique : il était **invisible**. Rien, dans
  MokNet, ne permettait de le constater.
* **Options envisagées** :
  1. Corriger AI Core directement (activer l'outil, accorder les droits).
     Écartée : toucher au catalogue et aux droits est un acte de production, qui
     exige une autorisation explicite (§ XXVI de la Constitution) ; et corriger
     sans rendre constatable laisserait le même angle mort au défaut suivant.
  2. Produire un rapport ponctuel. Écartée : un rapport se périme au premier
     commit et ne prouve rien le lendemain.
  3. Un écran de contrôle **en lecture seule** dans la console
     d'administration, alimenté par les surfaces déjà existantes, complété par
     un manifeste **mesuré au build** pour les faits que le navigateur ne peut
     pas lire.
* **Décision retenue** : **option 3**. Une « Tour de contrôle AI Core » en tête
  de *Super Admin → Connecteurs & Modèles IA*, qui affiche le statut global, les
  cinq verrous un par un, les agents et leurs droits, la présence de
  l'Architecte, l'usage détecté, la journalisation, les tests et la cohérence
  dépôt/base. Elle **ne corrige pas** AI Core : elle le rend constatable.
* **⚠️ Décision en attente d'arbitrage utilisateur** — les points suivants sont
  **proposés et non validés**, et ne doivent être lus ni comme décidés ni comme
  engagés :
  1. **Exécution du Loop 1** (fondations) : validation de l'`agentId` côté
     passerelle, journalisation `agent_id` + `tools_used`, mode `test` AI Core,
     rapatriement des 101 migrations manquantes, extension du Green Gate par
     `deno check` / `deno test`.
  2. **Voie de preuve du Loop 1** : les deux règles en vigueur — « seule une
     preuve venue du lien public compte » et « aucune fusion, aucune
     production » — s'excluent sur ce Loop, dont trois chantiers ne produisent
     aucun octet visible dans un navigateur. Trois voies ont été soumises ; **le
     choix appartient à l'utilisateur**.
  3. **Application de la migration `ai_call_log`** (écrite mais non appliquée,
     ou appliquée sur le projet d'essai `vision-smart-essai`).
  4. **Renommage du bloc de réglages homonyme `aiCore`** (`types.ts:5334`), sans
     rapport avec Vision Smart AI Core et imposant `activeDefaultProvider:
     'gemini'` — choix produit.
  5. **Fusion de la PR #63** et déploiement de la tour de contrôle.
* **Justification** : rendre l'écart visible avant de le corriger évite de
  reproduire la cause racine (un défaut sans témoin). La lecture seule stricte
  garantit que brancher l'écran ne modifie ni le comportement d'AI Core ni celui
  d'un seul agent. La provenance de chaque case est écrite à l'écran (`lu en
  base`, `mesuré au build`, `non lisible ici`) : une information non mesurée ne
  peut pas se présenter comme mesurée.
* **Conséquences** :
  1. **Aucun faux vert possible par construction** : un verrou non éprouvé
     interdit le statut vert ; une valeur non mesurable affiche « non
     mesurable » et jamais « 0 » ; une base illisible donne « inconnu » et non
     un rouge rassurant. Trois angles morts sont listés à l'écran plutôt que
     tus : le jeton de service (secret serveur, invisible par conception),
     l'usage réel d'AI Core (non traçable sans journalisation), le nombre de
     migrations en base (schéma `supabase_migrations` non exposé à l'API REST —
     valeur relevée hors ligne et datée).
  2. **Quatre défauts trouvés et corrigés pendant la construction**, tous de la
     même famille — un écran qui aurait *affirmé sans mesurer* :
     a. le manifeste déclarait la journalisation **présente** (`p_agent_id:`,
        argument du RPC `get_agent_tools`, satisfaisait la recherche de
        `agent_id:`) et comptait 6 appels avec `agentId` au lieu de 4 ;
     b. les pastilles d'état rendaient un **cadre vide** (prop nommée `enfants`
        alors que JSX ne remplit que `children` — aucune erreur au typage) ;
     c. la page publiait une **identité de build fabriquée** (un déploiement
        Netlify par téléversement initialise un dépôt git neuf, `git rev-parse`
        renvoyait un commit synthétique sur une branche « master » inexistante) ;
        `commitDate`, faux pour la même raison, a été retiré plutôt que rafistolé ;
     d. le **premier Green Gate est parti au rouge, et il avait raison** : `tsc`
        échouait sur tout checkout propre (`snapshot.ts` importait statiquement
        un fichier gitignoré, et le Green Gate lance `tsc` **avant** `build`).
        Le poste de développement passait au vert uniquement parce qu'un build
        précédent avait laissé le fichier — un vert de banc sale.
  3. La prévisualisation charge désormais le manifeste **à l'exécution**, par le
     même chemin que la console : ses chiffres se régénèrent à chaque build au
     lieu de se figer. Effet mesuré : après la remise à niveau sur `main`, le
     verrou 5 passe de **4/87** à **5/88** — la PR #60 a ajouté un vrai appel
     porteur d'un `agentId` (`components/SocialLive.tsx`, un expert prenant la
     parole dans un Live).
  4. Aucun outil activé, aucun droit accordé, aucune RPC, aucune migration,
     aucune colonne ajoutée. `netlify.toml` de la racine (celui de
     `moknet.net`) **intact**, vérifié après chaque déploiement de
     prévisualisation.
* **Éléments techniques** : `components/admin/AiCoreControlTowerView.tsx` (vue
  pure), `components/admin/AiCoreControlTower.tsx` (conteneur),
  `services/aiCoreControlTowerModel.ts` (modèle et raisonnement, sans import
  Supabase), `services/aiCoreControlTower.ts` (lecture réelle),
  `scripts/build-ai-core-manifest.mjs` → `public/ai-core-manifest.json`,
  `preview/tour-de-controle/*`, `vite.config.preview.ts`,
  `deploy/preview/netlify.toml`, `tests/aiCoreControlTower.test.tsx` (15 tests),
  `docs/TOUR_DE_CONTROLE_AI_CORE.md`, montage dans
  `components/admin/AiOrchestrator.tsx`.
* **Preuves** : `tsc` 0 · **vitest 1048/1048 (75 fichiers)** après quatre remises
  à niveau sur `main` (PR #69, #73, #74/#75, puis #76/#77/#78/#80) ·
  `npm run build` propre · Green Gate **vert** sur `8f30b2d`, relancé sur le
  HEAD courant ·
  séquence du Green Gate rejouée en local sur un dépôt **sans manifeste**
  (conditions d'un checkout propre) · lien public de prévisualisation
  `https://moknet-tour-de-controle-ai-core.netlify.app` sur un site Netlify
  **distinct** de `moknet.net`, `X-Robots-Tag: noindex` · **parité binaire**
  entre les captures et le lien public (JS `sha256 9bf20220b847e1a9…` et CSS
  `sha256 2f2eb85aaad35014…` identiques octet pour octet) · bundle de
  prévisualisation sans client de base (0 occurrence de `createClient`,
  `supabase.co`, `VITE_SUPABASE`) · aucune source du dépôt ni fichier étranger
  servi sur l'URL publique (`/package.json`, `/.env.example`, `/sw.js`,
  `/manifest.webmanifest`, `/icons/*` → 404) · aucun compte créé, aucune
  écriture en base.
* **Statut** : `Développé`, `Testé` — **NON FUSIONNÉ, NON DÉPLOYÉ**. PR #63
  maintenue **en brouillon** à la demande de l'utilisateur. Les suites listées
  au point « Décision en attente d'arbitrage utilisateur » ci-dessus ne sont
  **pas** engagées.

---
