# L'Architecte — orchestration par intention

Document de référence du sous-système Architecte de MokNet. Décrit ce qui
existe **réellement** dans le code, pas une cible. Toute capacité listée ici
est exécutable et testée ; ce qui ne l'est pas est dit comme tel.

---

## 1. Le principe

L'utilisateur exprime une intention en langage naturel ; l'Architecte la
traduit en une action **réelle** de MokNet, ou en navigation.

Trois règles gouvernent tout le sous-système :

1. **Le modèle n'agit jamais directement.** Il extrait une intention et des
   paramètres ; l'exécution est du code déterministe.
2. **Les permissions vivent dans le code, jamais seulement dans le prompt.**
   Un prompt peut être contourné ; une vérification en TypeScript non.
3. **Jamais de faux succès.** Un statut affiché correspond toujours à un état
   réel — si l'action n'a pas eu lieu, l'Architecte le dit.

---

## 2. Les pièces

| Fichier | Rôle |
|---|---|
| `services/architecte/capabilityRegistry.ts` | **Ce qui existe.** Agrège les 5 registres de domaine + 1 entrée synthétique = 55 capacités. Source unique de vérité. |
| `services/architecte/capabilityBus.ts` | **Ce qui est faisable maintenant.** Les écrans y déclarent leurs handlers ; l'Architecte exécute par identifiant. |
| `services/architecte/architecteBrain.ts` | **Le cerveau unique.** Prompt, garde-fous, confirmation, statuts. Partagé par les deux incarnations. |
| `services/architecte/taskCapabilityHandlers.ts` | Handlers réels du domaine Tâches, portés par l'Architecte lui-même. |
| `services/architecte/settingsCapabilityHandlers.ts` | Handlers réels des domaines Paramètres et Appareil, portés par l'Architecte lui-même. |
| `components/architecte/ArchitecteFloatingBar.tsx` | **Incarnation vocale** : barre flottante permanente, mobile et desktop. |
| `components/DialloOS.tsx` | **Incarnation clavier** : modal de saisie. |

Les registres de domaine (`services/{live,content,social,tasks,settings,search}/*VoiceCommands.ts`)
restent chacun la source de vérité de **leur** domaine. Le registre plateforme
les agrège sans les dupliquer : un changement de risque dans un registre de
domaine se répercute automatiquement, sans double maintenance.

---

## 3. L'inversion de dépendance

Le problème initial : les capacités vivaient dans leurs écrans et n'étaient
atteignables qu'en y étant déjà, micro ouvert. Un routeur central aurait exigé
de donner à l'Architecte l'accès à l'état interne de chaque écran — couplage
lourd et fragile.

**La solution retenue est l'inverse.** L'Architecte ne connaît rien de
l'intérieur des écrans. Ce sont eux qui déclarent, à leur montage :

```ts
useEffect(() => registerCapabilityHandlers({
  'content.post.publish': async (payload) => { /* … */ },
}), []);
```

et se retirent à leur démontage. Conséquence directe et voulue : **une capacité
dont l'écran porteur n'est pas monté est rapportée `unavailable`** — jamais
exécutée à moitié, jamais présentée comme réussie.

---

## 4. Les six statuts

`executeCapability(id, params, ctx)` ne renvoie jamais un simple booléen : la
nuance entre « refusé », « indisponible » et « échoué » est une information
utile pour l'utilisateur.

| Statut | Signification |
|---|---|
| `done` | Le handler réel a confirmé le succès. |
| `queued` | Hors-ligne : l'action n'a pas eu lieu mais n'est pas perdue — elle attend dans la file de synchronisation (§15) et partira au retour du réseau. |
| `failed` | Le handler a été appelé et a échoué. Le message porte la raison réelle. |
| `denied` | Permission refusée (ex. capacité réservée à l'hôte du Live). |
| `unavailable` | Capacité réelle et autorisée, mais l'écran qui la porte n'est pas ouvert. |
| `unknown` | Identifiant absent du registre — tentative de revendiquer une capacité inexistante. |

**Ordre des vérifications** — la présence du handler est testée **avant** la
permission. Sans écran porteur, la raison réelle est « l'écran n'est pas
ouvert », pas « vous n'avez pas le droit » : répondre `denied` dirait à un
utilisateur qui **est** hôte qu'il ne l'est pas. L'ordre inverse ne protégerait
rien de plus, puisque sans handler rien ne peut s'exécuter.

---

## 5. Le contexte de permission

L'Architecte est appelé depuis n'importe quel écran et ne peut pas savoir si
l'utilisateur est hôte d'un direct. Sans mécanisme, la vérification
s'exécuterait avec un contexte vide et refuserait toute capacité liée à un
rôle, **y compris à l'hôte légitime**.

L'écran porteur — seul à connaître la vérité — fournit donc ce contexte :

```ts
registerCapabilityHandlers(entries, () => ({ isHost, isUserOnStage }));
```

C'est un *getter*, donc juste après un changement de rôle en cours de session,
sans réenregistrement. Et **son contexte fait autorité sur celui de
l'appelant** : un appelant ne peut pas se déclarer hôte pour contourner la
règle. Vérifié par test.

---

## 6. Garde-fous anti-hallucination

- `assertCapabilityExists(id)` lève sur un identifiant inconnu. Appelée **à
  l'enregistrement** : un écran ne peut pas déclarer savoir exécuter une
  capacité qui n'existe pas — l'erreur apparaît au développement, pas à
  l'usage.
- Le catalogue proposé au modèle est construit à l'instant T à partir des
  handlers **réellement enregistrés** (`listExecutableCapabilities()`), pas des
  42 théoriques. Le modèle ne peut donc pas proposer une action qui échouerait
  aussitôt.
- « Qu'est-ce que tu peux faire ? » est traité **sans appel au modèle**, depuis
  le registre : la réponse ne peut pas contenir une capacité inventée.

---

## 7. Confirmation proportionnelle au risque

`confirmationRequired` est **dérivé** de `riskLevel` (tout ce qui n'est pas
`low`), jamais réécrit à la main par domaine. La confirmation est demandée
**avant** toute écriture, dans l'interface qui a le contexte pour la formuler —
le bus expose l'information mais n'invente pas de dialogue.

Elle n'est pas contournable, même si le modèle a formulé la demande comme une
évidence : la sécurité prime sur la préférence.

---

## 8. Couverture réelle

| Domaine | Capacités | Porteur |
|---|---|---|
| Tâches | 7 | L'Architecte lui-même — disponibles **partout** |
| Paramètres + Appareil | 13 | L'Architecte lui-même — disponibles **partout** |
| Contenu | 11 | `SocialFeed.tsx` |
| Social | 9 | `SocialFeed.tsx` |
| LIVE | 14 | `SocialLive.tsx`, **pendant un direct uniquement** |
| Recherche | 1 | L'Architecte lui-même (`searchCapabilityHandlers.ts`) — disponible **partout** |

**55 / 55 exécutables.**

`search.universal.search` était la dernière capacité sans handler — un défaut
relevé par l'audit navigateur du 30/08/2026 : la découverte l'annonçait
(« la recherche dans MokNet ») alors qu'aucune exécution n'existait. Son
handler appelle `universalSearch` (RPC `search_universal`, accent-insensible,
RLS de l'appelant) et distingue trois issues jamais confondues : échec
RPC (`ok: false`, « n'a pas pu aboutir ») ≠ zéro correspondance (`ok: true`,
« aucun résultat ») ≠ résultats listés avec leur compte exact. L'entrée du
registre reste synthétique (le fichier `searchVoiceCommands.ts` n'a jamais eu
de tableau structuré), mais elle est désormais réellement exécutable.

Les 14 capacités LIVE ne sont **pas** enregistrées hors direct, et c'est
délibéré : « donner la parole » n'a aucun sens sans session en cours. Le bus
répond `unavailable` avec son explication — c'est la réponse juste, pas une
lacune.

---

## 9. Domaine Tâches — résolution déterministe

Les 7 capacités `task.*` n'ont besoin d'aucun état d'écran : elles n'opèrent
que sur la table `tasks`. L'Architecte les porte donc directement, et elles
sont utilisables partout — alors qu'elles n'avaient **aucun** consommateur
auparavant.

Quand une commande désigne une tâche existante par son titre, la
correspondance est faite **en TypeScript**, contre les vraies lignes de
`getTasks`, jamais par le modèle. Casse et accents sont ignorés.

**Une correspondance ambiguë est refusée** avec la liste des candidates,
jamais tranchée au hasard : agir sur la mauvaise tâche est pire que ne rien
faire. Vérifié par test — aucune suppression ne part sur une ambiguïté.

---

## 10. Robustesse du JSON

`services/aiGateway.ts::parseLooseJson` tolère qu'un fournisseur encadre sa
réponse d'une clôture markdown ou d'une phrase d'introduction — comportement
courant, en particulier sur les fournisseurs de repli qui n'honorent pas
`jsonMode`.

Les 5 registres passant tous par `generateJSON`, une simple clôture faisait
auparavant échouer la commande entière : l'utilisateur voyait « je n'ai pas
compris » alors que le modèle avait parfaitement répondu.

Le chemin nominal est tenté en premier et se comporte exactement comme avant.
La fonction renvoie `undefined` — jamais un objet inventé — quand rien
d'exploitable n'est trouvé.

> Idée reprise et durcie du dépôt historique
> `ARCHITECTE-BON-INSPIRATION-POUR-MOKNET-2026` (`geminiService.ts::cleanJson`),
> **seul** élément de son Architecte réellement supérieur à l'existant ici.
> Ce dépôt reste par ailleurs à ne pas importer : un seul outil (`navigate`),
> aucun registre, aucune permission, aucune exécution, un visualiseur audio
> explicitement factice, et un `GET /api/config` qui expose la clé API au
> navigateur.

---

## 11. Tests

**131 tests réels, tous verts** — 72 hors navigateur via `esbuild` + Node, plus
**59 sous `vitest` + `@testing-library/react`** (voir §15), l'outillage DOM
que le dépôt n'avait pas jusqu'ici.

| Suite | Couvre |
|---|---|
| Bus (16) | Capacité inventée rejetée · enregistrement invalide qui lève · `unavailable` sans handler · `ok:false` → `failed` · exception → `failed` avec message réel · capacité hôte refusée puis autorisée · catalogue = réalité · retrait au démontage · confirmation dérivée du risque |
| Contexte (4) | Écran non-hôte → `denied` · devient hôte → autorisé sans réenregistrement · **un appelant ne peut pas se déclarer hôte** · après démontage → `unavailable` |
| Tâches (12) | Casse et accents · **titre ambigu refusé sans qu'aucune suppression ne parte** · titre inexistant · date non ISO jamais écrite · succès partiel annoncé honnêtement · auto-dépendance refusée |
| JSON (11) | Clôtures markdown · phrases avant/après · tableaux · imbrication préservée · `undefined` plutôt qu'un objet inventé |
| File hors-ligne (11) | Tâche conservée hors ligne · id UUID valide comme ancre · **tâche sans gestionnaire CONSERVÉE, jamais perdue** · tâche ajoutée pendant le traitement qui survit · pas de double passage concurrent · abandon signalé après 5 tentatives · refus définitif abandonné immédiatement · isolation stricte entre comptes |
| Barre flottante — DOM (10) | Pastille présente · barre absente avant ouverture · **ouverture réellement vérifiée** (et non `toBeDefined()` sur un `null`) · écoute démarrée à l'ouverture · les trois boutons d'action · **ouverture au clavier** · **micro relâché au démontage** · rien coupé quand la barre est fermée · **échec micro terminal affiché** (jamais « Connexion... » à l'infini) |
| Moteur vocal (5) | **Aucune relance après erreur fatale** (`audio-capture`, `not-allowed`) — fin de la boucle mesurée à 16 relances/5 s par l'audit du 30/08/2026 · relance légitime sur erreur transitoire isolée · plafond de relances (4) puis abandon signalé · nouveau `startListening` explicite = nouvelle chance · de l'audio réel réarme le compteur |
| Recherche (6) | Échec RPC ≠ zéro résultat ≠ résultats (trois issues jamais confondues) · compte exact et surplus annoncé · terme trop court refusé sans appel · tolérance aux formes de payload du modèle |
| Session (9) | Ordre et notification des tours · borne à 40 · dernière image retrouvée · contexte SANS les octets des images · **questions de vision reconnues, prompt qui interdit d'inventer un contenu visuel** (avec et sans image) · le cerveau inscrit lui-même commande et réponse |
| Extraction (7) | **Formats construits RÉELLEMENT puis relus** : .xlsx (SheetJS), .docx (ZIP XML + mammoth), .pptx, .zip · refus honnête des binaires hérités · fichier vide refusé plutôt que résumé |
| Consentement (5) | Déclencheurs réels · nom/portée/oui-non interprétés, relance si ambigu · récapitulatif fidèle avant toute écriture |
| Livrables (5) | Détection demande + format (PDF réorienté honnêtement) · **boucle complète .docx : générer puis relire avec mammoth** · échappement XML |
| Paramètres (29) | Registre à 55 sans doublon · confidentialité = confirmation requise · **6 écritures rapportées `ok:false` quand la persistance échoue** · clés `privacy_settings` voisines préservées · champ vide jamais écrit · valeur d'énumération inexistante refusée (`network` pour les demandes d'ami) · API appareil absente annoncée, jamais simulée |

---

## 12. Les deux incarnations, un seul cerveau

L'Architecte se présente sous deux formes, qui appellent **la même** fonction
`runArchitecteCommand` (`services/architecte/architecteBrain.ts`) :

| Incarnation | Fichier | Entrée |
|---|---|---|
| Barre flottante | `components/architecte/ArchitecteFloatingBar.tsx` | Voix, permanente, mobile et desktop |
| Modal | `components/DialloOS.tsx` | Clavier, ouvert à la demande |

Le cerveau a été **extrait** du modal au moment où la seconde incarnation est
apparue, pas réécrit : prompt, garde-fous anti-hallucination, confirmation
proportionnelle au risque et statuts d'exécution vivent en un seul endroit.
Sans cette extraction, la même logique aurait existé en double, avec la
certitude de diverger — ce qu'interdit la règle « une capacité, un registre,
plusieurs interfaces ».

### Conformité à l'Architecte historique

Présentation et comportement natif repris de
`ARCHITECTE-BON-INSPIRATION-POUR-MOKNET-2026`, `components/PlatformGuide.tsx` :
pastille cyan flottante en bas à droite avec halo `animate-ping` et icône de
compas ; à l'ouverture, barre-pilule centrée en bas (`#0f172a/90`,
`backdrop-blur-xl`, anneau cyan, `rounded-full`) portant une pastille
d'avatar 48 px, le libellé « L'ARCHITECTE » en capitales espacées avec point
vert pulsant, un sous-titre en police mono, un égaliseur à 5 barres et une
croix de fermeture. Comportement natif identique : **un appui ouvre la barre
et démarre l'écoute**, un second ferme et coupe la session.

**Trois écarts assumés, tous documentés dans l'en-tête du composant :**

1. L'égaliseur de l'original était explicitement factice (`Math.random()`,
   commenté « Fake Wave »). Ici il est alimenté par le vrai niveau sonore du
   micro — même langage visuel, donnée réelle.
2. L'original ouvrait une session audio native Gemini depuis le navigateur
   avec la clé API exposée par un `GET /api/config`. Ici la voix passe par
   `useVoiceAssistant` → `ai-gateway`, clés côté serveur.
3. Position mobile à `bottom-44` au lieu de `bottom-36` : MokNet possède un
   bouton de messagerie flottant que l'original n'avait pas, et à 36 la
   pastille arrivait à son contact.

Améliorations de fond : l'original ne pilotait qu'**un** outil (`navigate`) ;
ici la barre atteint les 54 capacités exécutables, avec permissions vérifiées
dans le code et statuts explicites. Un défaut du comportement d'origine a
aussi été corrigé : quand le micro ne démarrait pas, la barre restait
indéfiniment sur « Connexion... » — un état qui ressemble à une attente
normale alors que rien n'écoute. Une limite de 3 secondes le dit désormais
franchement, et le message s'efface de lui-même si l'écoute finit par
démarrer.

---

## 13. Paramètres par la voix — et la frontière du téléphone

13 capacités `settings.*` / `device.*`, portées par l'Architecte lui-même
(aucun état d'écran requis, donc disponibles partout) :

- **Réglages MokNet, persistés en base** : langue (`preferred_language`),
  mode silencieux, visibilité du profil, qui peut vous écrire, qui peut vous
  envoyer une demande d'ami, statut en ligne, champs de profil
  (nom/titre/bio/ville/pays), et lecture à voix haute des réglages actuels.
- **Appareil, via des API réellement exposées au navigateur** : vibration,
  plein écran, partage natif, écran maintenu allumé.

Les réglages de confidentialité sont classés `moderate` : ils changent qui
peut vous voir, vous écrire ou vous ajouter, donc une confirmation explicite
est exigée avant l'écriture. Jamais un basculement silencieux sur une phrase
mal comprise.

> **Ce que l'Architecte ne peut pas faire, et ne prétend pas faire.**
> MokNet est une application web. Le navigateur interdit, par conception, à
> toute page d'agir sur les réglages du **système** : volume, luminosité,
> Wi-Fi, Bluetooth, données mobiles, mode avion, applications tierces.
> Aucune capacité du registre ne le revendique, et une demande de ce type
> reçoit une réponse honnête plutôt qu'une fausse confirmation. Quand une
> API appareil existe mais que le navigateur ne la propose pas (cas courant
> sur ordinateur pour la vibration et le partage natif), le handler le dit —
> il ne simule jamais un succès.

Anti-faux-succès de bout en bout : `updateUserProfile` avalait auparavant
l'erreur de persistance (`catch { console.warn }`) et mettait quand même
l'état local à jour. L'Architecte aurait donc annoncé « c'est fait » à voix
haute sans que rien ne soit enregistré. Il renvoie désormais un booléen réel,
et les 6 écritures de réglages sont testées dans le cas où la persistance
échoue.


---

## 14. Ce qui reste ouvert

- **Mémoire inter-sessions** — l'Architecte ne se souvient de rien d'une
  session à l'autre. `user_memory` existe (LOOP 12-13/17) mais n'est pas
  consommée ici.
- **Plan multi-étapes** — une intention = une action. Une commande composée
  (« fais A puis B ») n'est pas décomposée en plan explicite.
- **Journal d'audit** — les exécutions ne sont pas tracées dans une table
  dédiée.
- ~~Documents bureautiques~~ — **comblé par la finalisation** (§17) :
  extraction réelle PDF/Word/Excel/PowerPoint/ZIP via `documentExtractor.ts`.
  Restent honnêtement refusés : les formats binaires hérités (.doc/.ppt/.xls
  d'avant 2007), .rar/.7z, et les scans sans texte extractible.
- **Médias hors-ligne** — une publication accompagnée d'un fichier local ne
  peut pas entrer dans la file (§15) : le fichier ne survivrait pas au
  rechargement, et le stockage du navigateur n'est pas dimensionné pour ça.
  Refusé avec un message explicite, jamais promis puis perdu.
- **Idempotence des traces** — `LOG_EVENT` et `SAVE_CONVERSATION` écrivent
  dans `user_memory` sans ancre d'idempotence : un rejeu après un échec
  ambigu peut y créer une ligne en double. Conséquence cosmétique (une ligne
  de journal répétée), contrairement à une publication ou un message qui,
  eux, sont protégés.

Aucun de ces points n'est bloquant pour l'usage actuel ; ils sont listés pour
qu'aucun ne soit confondu avec du déjà-fait.

---

## 15. La file de synchronisation hors-ligne — « Lazarus »

`services/architecte/syncQueue.ts` + `services/architecte/syncTaskHandlers.ts`

Reconstruction du `syncService.ts` du paquet Architecte fourni par
l'utilisateur (AI Studio). L'API publique d'origine est conservée telle
quelle — `addToQueue`, `processQueue`, `getQueueSize`, écoute de l'événement
`online` — parce que l'organisation du paquet est juste. C'est la seule pièce
qui comblait un manque réel : l'Architecte échouait honnêtement hors-ligne,
mais ne rejouait rien au retour du réseau.

**Quatre défauts du fichier reçu, corrigés** — chacun constaté en le lisant,
aucun supposé :

| Défaut mesuré | Correction |
|---|---|
| `CREATE_POST` déclaré dans le type mais sans `case` : tombait dans `default:` qui journalisait **sans lever**, donc la tâche était réputée réussie et retirée. Une publication faite hors-ligne disparaissait sans trace. | Les traitements sont fournis en `Record<SyncTaskAction, …>` **complet** : la compilation échoue si une action reste sans traitement. Et à l'exécution, une tâche sans gestionnaire est **conservée**, jamais supprimée. |
| `processQueue` réécrivait `localStorage` depuis son instantané de départ, effaçant toute tâche ajoutée pendant la boucle. | Aucune réécriture globale : chaque mutation relit l'état courant et n'agit que sur la tâche concernée, par identifiant. |
| Aucune idempotence — `addToQueue` et l'événement `online` déclenchaient tous deux `processQueue`. | Verrou anti-concurrence, plus l'`id` UUID de la tâche comme ancre d'idempotence serveur : `messages.client_message_id` (déjà en place) et `posts.client_post_id` (migration `architecte_sync_queue_post_idempotency_anchor`, colonne nullable + index unique **partiel** sur `(author_id, client_post_id)` — le chemin de publication normal n'est pas concerné). |
| Clé `localStorage` unique pour tout le navigateur : sur un appareil partagé, le second compte héritait des tâches du premier et les envoyait **sous son identité**. | Clé scindée par utilisateur (`setSyncQueueUser`), même convention que `memoryService`. |

**Un cinquième point**, propre à la discipline du dépôt : après épuisement des
tentatives, la tâche du paquet disparaissait sans que personne l'apprenne. Ici
elle passe dans une liste d'abandons consultable, avec la raison réelle
(`max_retries` ou `permanent`).

**Destinations des cinq actions.** `CREATE_POST` → `posts`, `SEND_MESSAGE` →
`messages`, `UPDATE_PROFILE` → `profiles`. Pour les deux dernières, le paquet
visait des tables écartées à l'audit : `LOG_EVENT` visait `audit_logs`, que
MokNet réserve délibérément au `service_role` (aucune policy — lui en ajouter
laisserait n'importe quel compte authentifié polluer ou forger le journal), et
`SAVE_CONVERSATION` visait `chat_history`, qui ferait doublon avec
`conversations`/`messages`/`ai_call_log`. Les deux écrivent donc dans
`user_memory` (RLS propriétaire-seul) : `scope='recent_activity'` pour le
journal, couche `conversational` — prévue depuis l'origine pour l'historique
de sessions — pour les conversations.

---

## 16. Les trois boutons d'action de la barre

À droite de la barre ouverte, trois pilules alignées. L'Architecte n'est pas
qu'une oreille : on peut lui donner quelque chose à lire ou à regarder.

| Bouton | Ce qu'il fait réellement |
|---|---|
| **Fichier** | Image → `analyzeImage` (vision `ai-gateway`) et l'image reste dans le fil de session. Document → **extraction réelle** par `documentExtractor.ts` (PDF via pdfjs, .docx via mammoth, .xlsx via SheetJS, .pptx/.zip via jszip, texte tel quel), injecté dans la session puis résumé — questions de suivi possibles. Refus honnête uniquement pour l'impossible (.doc/.ppt/.xls hérités, .rar/.7z, scans sans texte). |
| **Écrire** | Ouvre la saisie **dans la même barre** (chantier de finalisation) — même session, même fil, jamais une bascule vers une autre interface. |
| **Caméra** | `getUserMedia` réel, prévisualisation au-dessus de la barre, capture vers le même chemin d'analyse ; la photo **apparaît dans le fil et y reste** pour les questions de suivi. Flux attaché par effet React (un `setTimeout(0)` pouvait précéder le rendu — aperçu noir, corrigé). |

La caméra est explicitement relâchée à la fermeture **et** au démontage —
même discipline que le micro (§12), et couverte par les tests DOM.

L'emplacement et la forme reprennent le bouton « Module ZIP » de l'Architecte
d'origine. Ce bouton y téléchargeait l'archive du module ; ce fichier n'existe
pas dans MokNet et le bouton y serait mort.

---

## 17. La finalisation — un seul Architecte, multimodal de bout en bout

Chantier du 30/08/2026 (« FINALISATION COMPLÈTE DE L'ARCHITECTE ») : compléter
l'existant, jamais le dupliquer. Chaque lot a été prouvé en navigateur réel
avant d'être déclaré terminé.

| Lot | Ce qui a changé | Pièce |
|---|---|---|
| **Session unique** | `architecteSession.ts` : UN fil pour voix, clavier, photos et documents (40 tours max), injecté au prompt du cerveau, qui y inscrit lui-même chaque échange. Mémoire de SESSION uniquement (RAM) — l'inter-sessions reste ouvert (§14). | `services/architecte/architecteSession.ts` |
| **Clavier intégré** | Le bouton Écrire ouvre la saisie DANS la barre — plus jamais DialloOS (seconde expérience). DialloOS garde ses propres entrées (header) et partage le même cerveau et la même session. | `ArchitecteFloatingBar.tsx` |
| **Vision honnête** | Question de vision sans image → « je ne dispose d'aucune image » (déterministe, jamais le modèle texte). Avec image → VRAIE analyse de la dernière image montrée. Prompt durci : jamais affirmer un objet incertain. | `isVisionQuestion`, garde dans `handleCommand` |
| **Extraction documents** | PDF/Word/Excel/PowerPoint/ZIP réellement lus (imports dynamiques — zéro poids initial). | `documentExtractor.ts` (§16) |
| **Fiche de consentement** | Formulaire rempli question par question (nom d'appel, portée, préparation auto), récapitulatif → confirmation → UNE écriture réelle dans `profiles.privacy_settings.architecte`. | `consentFlow.ts` |
| **Livrables** | « Donne-le moi à télécharger en Word » → vrai `.docx` (jszip) téléchargé, contenu corrigé sans données inventées ; .txt/.md/.csv aussi ; PDF réorienté honnêtement (aucun générateur PDF dans le dépôt). | `deliverableBuilder.ts` |
| **Recherche Internet** | Déclencheur déterministe → l'outil serveur `web_search` DÉJÀ existant (grounding Gemini, sources, échec honnête), activé pour l'agent `architecte` par une ligne de droit (`agent_tool_grants`). Aucun second moteur. | migration `architecte_web_search_grant` |

Ordre de routage d'une commande dans la barre — chaque étage est
déterministe, le modèle n'arrive qu'en dernier :
consentement actif → déclencheur consentement → recherche Internet →
livrable → question de vision → cerveau (`runArchitecteCommand`).

---

## 18. Le comportement humain — Boucle 1 (équipes A/B/C/D)

Chantier du 30/08/2026 : figer l'identité comportementale AVANT toute
optimisation technique. Principe directeur, verbatim de la mission : « Ce
n'est pas l'utilisateur qui doit apprendre à utiliser l'Architecte. C'est
l'Architecte qui doit comprendre l'utilisateur et l'accompagner. »

### Équipe A — comportement

| Comportement | Mécanisme | Où |
|---|---|---|
| **Identité unique** | Le prompt impose « UNE SEULE IDENTITÉ » ; « Qui es-tu ? » reçoit une réponse stable et DÉTERMINISTE (`describeArchitecteIdentity`) — jamais le modèle. Les textes « Diallo OS »/« Cabinet Famille Diallo » visibles ont été unifiés. | `architecteBrain.ts`, `DialloOS.tsx` |
| **Accueil différencié** | À l'ouverture, l'Architecte parle EN PREMIER (`buildArchitecteGreeting`) : accueil complet + proposition de fiche à la première rencontre (marqueur : `privacy_settings.architecte` absent), accueil léger « Bonjour {nom}. Que puis-je faire pour vous aujourd'hui ? » ensuite. Une fois par session de page (`hasGreetedRef`), jamais un onboarding rejoué. | `ArchitecteFloatingBar.tsx::open()` |
| **Fiche proposée, pas cachée** | L'offre est faite dans l'accueil ; un « oui » court (`isAffirmativeReply`, borné aux réponses brèves) démarre la fiche. « Appelez-moi X » et autres tournures de politesse (tu/vous) sont nettoyées — défaut réel trouvé par la preuve navigateur, corrigé. | `consentFlow.ts` |
| **Besoin flou** | « Je ne sais pas trop » (énoncé PUR, sans sujet) → clarification stable par familles (`isVagueNeed`), sans appel au modèle ; les formulations plus riches passent au cerveau, encadrées par la directive BESOIN FLOU. | `architecteBrain.ts` |
| **Mémoire de la relation** | Le nom choisi est injecté au prompt (« ne le redemande jamais »), utilisé dans l'accueil, l'identité et la clarification. | `RunArchitecteOptions.callName` |
| **Rythme et ton** | Directives de conduite au prompt : pressé/direct → bref ; hésitant/débutant → accompagné ; expert → sans explications élémentaires ; bavard → laisser la place. Jamais de diagnostic psychologique, jamais d'émotions prétendues réelles. | prompt, RÈGLES DE CONDUITE |

### Équipe B — expérience conversationnelle

| Comportement | Mécanisme |
|---|---|
| **Fermé = silencieux (réel)** | `isOpenRef` synchrone : `close()` coupe la synthèse ET aucune réponse arrivée APRÈS la fermeture n'est prononcée — elle reste dans le fil. Testé DOM. |
| **Interruption naturelle (barge-in)** | Une vraie phrase (≥ 12 caractères) prononcée pendant que l'IA parle coupe `stopSpeaking()` et est entendue ; un fragment court (écho de la synthèse) est ignoré. Testé unitairement. |
| **Respiration par ponctuation** | Le repli navigateur découpe par phrases (existant conservé) ; la pause inter-phrase suit désormais la ponctuation terminale (`breathAfterPhrase` : question > point > articulation > virgule) au lieu d'un 120 ms uniforme. |
| **Identité vocale stable** | `sessionEngineLock` : une fois le repli navigateur utilisé dans une session conversationnelle, la session y RESTE (au pire UNE bascule, jamais un aller-retour HD↔système phrase après phrase). Le verrou saute à chaque nouvelle session et sur choix explicite du moteur. |
| **Pas de caricature** | Aucune hésitation fabriquée, aucun rire programmé : le naturel vient de la ponctuation, des pauses, du rythme et de l'interruption. |

### Équipe C — orchestration des outils

| Comportement | Mécanisme |
|---|---|
| **Texte quand il a une valeur** | `showConversationPanel` : le panneau n'apparaît que si la personne écrit, si le fil contient une image/un document, ou si la dernière réponse est une vraie production écrite (> 220 caractères). Une conversation vocale ordinaire garde l'interface légère. |
| **Production écrite complète** | Directive PRODUCTION ÉCRITE : « écris-moi une lettre » → le texte FINAL dans la réponse (jamais « je vais la préparer ») — qui déclenche mécaniquement le panneau. |
| **Caméra à la voix** | « Ouvre/ferme la caméra » routé déterministiquement (jamais le modèle) vers la vraie caméra ; confirmation APRÈS ouverture réelle. |
| **Fichier honnête** | « joins un fichier » → guidage vers le bouton Fichier (le navigateur exige un vrai appui — dit tel quel, jamais simulé). |
| **Proposition contextuelle** | Directive OUTILS AU BON MOMENT : problème visible → proposer la caméra ; document à vérifier → proposer le Fichier. Jamais un outil imposé que la tâche n'exige pas. |

### Équipe D — preuves

131 tests unitaires/DOM au total dont 26 comportementaux nouveaux
(85 dans `tests/` : brain/session 19, voiceEngine 10, barre 20, consentement
6, extracteur 7, livrables 5, recherche 6, sync 12 — plus les 46 tests bus/
capacités hors vitest). Parcours navigateur réel (compte éphémère, gateway
réelle, fake media) : première rencontre, « oui » → fiche remplie →
écriture vérifiée EN BASE (`callName='Preuve'` nettoyé), retour reconnu,
besoin flou, capacités, identité, objectif → chemin, interface légère,
lettre → panneau conservé, caméra à la demande — captures dans le journal de
preuve. Les scénarios purement audio (barge-in au micro réel, fermeture
pendant la synthèse) sont couverts par les tests unitaires/DOM — un
navigateur headless n'a pas de service de reconnaissance vocale.

---

## 19. La surface visuelle adaptative — « la parole pilote l'interface »

Complément Équipe C du 30/08/2026 : le centre de l'expérience n'est plus le
bouton mais la parole — l'utilisateur dit ce qu'il veut, l'Architecte choisit
l'outil, l'interface s'adapte. Les boutons restent disponibles (toucher en
support), ils ne sont plus le passage obligé.

UNE seule zone au-dessus de la barre — jamais un second assistant — qui
change de rôle selon la tâche :

| La personne dit | La surface devient | Mécanisme |
|---|---|---|
| « Ouvre la caméra » / « Je veux te montrer quelque chose » | Retour caméra (existant, conservé) | routage déterministe → `openCamera` |
| « Mets-moi une vidéo sur… » / « …sur YouTube » | Lecteur vidéo (recherche YouTube incorporée, `youtube-nocookie.com`, sans clé API) | `isVideoRequest` + `extractVideoQuery` (extraction minimale : le sens de la demande RESTE la recherche) → `mediaView.video` |
| « Montre-moi le document » | Aperçu du dernier document fourni (extrait réel) — honnête s'il n'y en a aucun | `getLastSessionDocument` → `mediaView.document` |
| « Cherche sur internet… » | Les résultats dans le fil, adresses citées rendues CLIQUABLES (`renderTextWithLinks`) ; le contexte récent de la session est fourni à la recherche (la recherche peut concerner la photo qui vient d'être montrée) | branche web-search existante + `buildSessionContext()` |
| « Ferme la vidéo / la fenêtre » | La surface se retire — retour à la barre légère | routage déterministe → `mediaView = null` |

Règles tenues : la surface n'apparaît QUE quand la tâche l'exige (politique
de panneau du §18 étendue à `mediaView`) ; fermer l'Architecte referme aussi
sa surface (rien ne survit derrière une barre fermée) ; l'annonce vidéo est
honnête (« vidéos trouvées — appuyez sur lecture », jamais « lecture
lancée » : les navigateurs bloquent l'auto-lecture) ; un seul contrôle
manuel ajouté (fermer la fenêtre) — pas de multiplication de boutons.

Preuves navigateur (compte éphémère réel, supprimé après) : P1 barre seule →
P2 caméra → P3 photo analysée dans le même fil → P4 lecteur vidéo à la
demande parlée → P5 recherche réelle affichée → P6 fenêtre retirée à la
voix → P7 après TOUS les outils, « Qui es-tu ? » répond L'Architecte et
« Que vois-tu ? » décrit la photo montrée trois outils plus tôt — même
identité, même contexte, aucune seconde conversation.

Différé honnêtement (« lorsque la technologie disponible le permet », dit la
spécification elle-même) : le mode conversation vidéo avec l'Architecte —
la surface unique le rend possible sans nouvelle architecture, mais il
dépend du chantier LIVE/LiveKit, distinct.
