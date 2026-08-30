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

## 4. Les cinq statuts

`executeCapability(id, params, ctx)` ne renvoie jamais un simple booléen : la
nuance entre « refusé », « indisponible » et « échoué » est une information
utile pour l'utilisateur.

| Statut | Signification |
|---|---|
| `done` | Le handler réel a confirmé le succès. |
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
| Recherche | 1 | *Non branchée* |

**54 / 55 exécutables.**

La 42ᵉ (`search.universal.search`) est une entrée **synthétique** du registre :
`services/search/searchVoiceCommands.ts` n'a jamais eu de tableau structuré
(3 actions codées en dur dans son prompt, sans `id` ni `riskLevel`). Elle est
documentée comme telle depuis sa création plutôt que fabriquée à partir d'une
source qui n'existe pas.

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

72 tests réels, tous verts, exécutés hors navigateur via `esbuild` + Node.

| Suite | Couvre |
|---|---|
| Bus (16) | Capacité inventée rejetée · enregistrement invalide qui lève · `unavailable` sans handler · `ok:false` → `failed` · exception → `failed` avec message réel · capacité hôte refusée puis autorisée · catalogue = réalité · retrait au démontage · confirmation dérivée du risque |
| Contexte (4) | Écran non-hôte → `denied` · devient hôte → autorisé sans réenregistrement · **un appelant ne peut pas se déclarer hôte** · après démontage → `unavailable` |
| Tâches (12) | Casse et accents · **titre ambigu refusé sans qu'aucune suppression ne parte** · titre inexistant · date non ISO jamais écrite · succès partiel annoncé honnêtement · auto-dépendance refusée |
| JSON (11) | Clôtures markdown · phrases avant/après · tableaux · imbrication préservée · `undefined` plutôt qu'un objet inventé |
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

- **Recherche** — 1 capacité non branchée (voir §8).
- **Mémoire inter-sessions** — l'Architecte ne se souvient de rien d'une
  session à l'autre. `user_memory` existe (LOOP 12-13/17) mais n'est pas
  consommée ici.
- **Plan multi-étapes** — une intention = une action. Une commande composée
  (« fais A puis B ») n'est pas décomposée en plan explicite.
- **Journal d'audit** — les exécutions ne sont pas tracées dans une table
  dédiée.

Aucun de ces points n'est bloquant pour l'usage actuel ; ils sont listés pour
qu'aucun ne soit confondu avec du déjà-fait.
