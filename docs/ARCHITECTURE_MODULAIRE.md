# 🧩 ARCHITECTURE MODULAIRE EXPORTABLE
> **Des modules autonomes, détachables, installables sur le téléphone — synchronisés avec le même compte et les mêmes données.**  
> *Premier module de référence : la messagerie (`/messagerie`). Mission VF-9.*

---

## 1. PRINCIPE

Chaque module de la plateforme est conçu comme un composant **autonome, détachable et exportable** : il fonctionne
à l'intérieur de l'application principale (qui orchestre l'ensemble) **ou** seul, installé sur le téléphone comme
une application indépendante, tout en restant **synchronisé** — même compte, mêmes données, mêmes notifications,
mêmes réglages, expérience identique.

Le socle technique est celui des applications web installables (PWA) : une **même origine** (`moknet.net`), une
**même session**, un **même code** ; ce qui change, c'est la coquille rendue et le **manifeste** qui décrit
l'application installée. Deux applications installables peuvent coexister sur la même origine dès lors que leurs
manifestes ont des `id` distincts (`"/"` pour MokNet, `"/messagerie"` pour la messagerie).

---

## 2. CONTRAT D'UN MODULE EXPORTABLE (à respecter pour chaque module suivant)

| # | Pièce | Où | Ce qu'elle apporte |
| :-- | :-- | :-- | :-- |
| 1 | **Entrée au registre** | `modules/moduleRegistry.ts` → `EXPORTABLE_MODULES` | Identité stable (`id`, `name`, `shortName`, `labelInSentence`, `description`, `route`, `manifestPath`, `icon`, `themeColor`, `status`). Le registre pilote la section Paramètres, la détection d'URL et la cohérence avec le manifeste (test `tests/moduleRegistry.test.ts`). |
| 2 | **Route autonome** | `netlify.toml` (réécritures `/<route>` et `/<route>/*` → `/index.html`, 200) + `services/modules/standaloneMode.ts` → `detectStandaloneModule` | L'URL que l'icône installée ouvre (`start_url`). L'application détecte cette route (ou `?module=<id>`, forme de repli) **au démarrage** et ne rend que le module. |
| 3 | **Manifeste propre** | `public/manifests/<id>.webmanifest` | `id` distinct de l'application principale, `start_url` = route, `scope: "/"` (le service worker `/sw.js` couvre le module), `display: standalone`, `lang: fr`, couleurs cohérentes, icônes **partagées** avec l'application (`/icons/…`, générées par le chantier PWA). Substitué à `<link rel="manifest">` par `applyModuleManifest()` dans `index.tsx`, **avant** le premier rendu React. |
| 4 | **Composant plein écran** | `components/modules/<Module>Standalone.tsx`, rendu par `components/Layout.tsx` quand `standaloneModule` est fourni par `App.tsx` | Le **même** composant fonctionnel que dans l'application (ici `<MoocChatFloating standalone>`), avec les **mêmes props et handlers** que son montage normal — rien n'est dupliqué. S'y ajoutent une fine barre « MokNet · Module » (lien « Ouvrir MokNet complet », point d'installation compact) et un écran de repli si la fenêtre est fermée. Navigation, dock, Architecte et modales de l'application ne sont **pas** rendus. |
| 5 | **Point d'installation** | `components/modules/InstallModuleButton.tsx` (réutilisable), monté dans `ModulesSettingsSection.tsx` (Paramètres → « Modules & applications ») et dans la barre du module | Un seul composant pour tous les points d'entrée — y compris, demain, le bouton de messagerie lui-même. Il lit l'état **réel** (`services/modules/installPrompt.ts`) et n'affiche jamais un bouton qui ne ferait rien. |
| 6 | **Authentification** | inchangée (`App.tsx`) | Non connecté → l'écran de connexion habituel s'affiche tel quel sur la route du module, puis le module se rend une fois la session établie. |
| 7 | **Tests** | `tests/moduleRegistry.test.ts`, `tests/standaloneMode.test.ts`, `tests/installPrompt.test.ts` | Registre ↔ manifeste, détection, bascule du manifeste, états d'installation, événement `beforeinstallprompt` simulé, rendu du bouton par état. |

Ajouter un module = une entrée au registre, un manifeste, deux lignes dans `netlify.toml`, un composant `*Standalone.tsx`
et son rendu conditionnel dans `Layout.tsx`. La section Paramètres et le bouton d'installation le prennent en charge
sans modification.

---

## 3. FLUX AU DÉMARRAGE

```
URL /messagerie  (réécriture Netlify → index.html)      ou      /?module=messagerie
        │
        ▼
index.tsx ── import services/modules/installPrompt   → capture globale de `beforeinstallprompt`
          ── detectStandaloneModule(pathname, search) → module ou null
          ── applyModuleManifest(module)              → <link rel="manifest" href="/manifests/messagerie.webmanifest">
          ── registerPwaServiceWorker()               → /sw.js (portée « / », couvre aussi le module)
        │
        ▼
App.tsx ── session Supabase (identique) ── non connecté → <Auth /> ── connecté → <Layout standaloneModule={…}>
        │
        ▼
Layout.tsx ── standaloneModule.id === 'messagerie'
              → <MessagingModuleStandalone currentUser onUpdateProfile pendingDirectChatMember … />
                  → barre « MokNet · Messagerie » + <MoocChatFloating standalone … />   (rien d'autre)
```

`MoocChatFloating` reçoit une seule prop nouvelle, `standalone` : fenêtre ouverte d'emblée, bouton flottant masqué,
conteneur `fixed` plein écran calé sous la barre du module (variable CSS `--moknet-module-topbar`), sans bordure ni ombre
de fenêtre flottante. Tout le reste du composant est inchangé.

---

## 4. INSTALLATION SUR LE TÉLÉPHONE

### 4.1 Une invitation appartient à un manifeste
Le navigateur émet `beforeinstallprompt` **pour le manifeste lié à la page** au moment de l'émission. Sur la page de
l'application principale, cette invitation installerait **MokNet** ; seule la page autonome du module (`/messagerie`,
manifeste substitué avant le rendu) produit une invitation **pour la messagerie**. `installPrompt.ts` mémorise donc le
chemin du manifeste à la capture et refuse (`unavailable`) tout `promptInstall(module)` qui ne lui correspond pas —
aucun « Installer la messagerie » ne peut installer autre chose.

Conséquence assumée dans l'interface : depuis les Paramètres de l'application, le bouton « Installer la messagerie
sur mon téléphone » **conduit** à `/messagerie?installer=1`, où la fiche d'installation s'ouvre avec l'invitation
propre au module. C'est un geste de plus, mais c'est le seul chemin exact.

### 4.2 États (`getInstallState(module)`)
| État | Sens | Rendu |
| :-- | :-- | :-- |
| `installable` | invitation capturée **pour ce module** | bouton « Installer … sur mon téléphone » → invitation native ; résultat rapporté (lancée / annulée) |
| `installed` | page ouverte dans l'application installée (`display-mode: standalone`, `navigator.standalone`), `appinstalled` reçu, ou installation confirmée ici auparavant (drapeau local) | « Déjà installée » + « Ouvrir » ; « Version installée » quand on y est |
| `ios-manual` | iPhone/iPad | fiche en 3 étapes : Partager → « Sur l'écran d'accueil » → Ajouter (précédée, hors page du module, de « ouvrir la messagerie en plein écran dans Safari ») — aucun bouton inerte |
| `via-module-page` | pas sur la page du module | bouton qui ouvre `/messagerie?installer=1` + explication |
| `unsupported` | sur la page du module, aucune invitation après un délai de vérification (3 s) | phrase honnête : navigateur sans prise en charge, critères non réunis, ou déjà installée sans que nous le sachions |

Le drapeau local (`moknet_pwa_installed:<manifeste>`) est **auto-correcteur** : si le navigateur propose à nouveau
l'installation (`beforeinstallprompt`), l'application a été désinstallée et le drapeau est effacé. Un refus de
l'invitation est affiché comme tel (« Installation annulée »), jamais comme « non pris en charge ».

### 4.3 Par plateforme
- **Android / Chrome, Edge, Samsung Internet ; bureau Chrome/Edge** : invitation native depuis nos boutons, icône
  « Messagerie » distincte de « MokNet ». Critères du navigateur : HTTPS, manifeste valide, icônes **réellement
  servies** (192 et 512 px), service worker.
- **iOS / iPadOS (Safari)** : pas d'invitation programmatique — ajout manuel guidé (fiche). L'application ajoutée à
  l'écran d'accueil a **son propre stockage** : l'utilisateur se connecte **une fois** dans l'application installée ;
  ensuite tout est synchronisé par le compte. Les notifications push Web sur iOS supposent iOS 16.4+ **et** une
  application installée (chantier PWA/push).
- **Firefox bureau, Safari bureau** : pas d'installation d'application web ; le module reste utilisable en plein écran
  (`/messagerie`), la fiche le dit.

---

## 5. SYNCHRONISATION « PAR CONSTRUCTION »

| Quoi | Comment | Même chose dans l'app et dans le module ? |
| :-- | :-- | :-- |
| Compte / session | même origine, même client Supabase, même stockage local du jeton — partagé entre le navigateur et l'application installée sur Android/Chrome | ✅ (iOS : une reconnexion, une seule fois) |
| Conversations, messages, appels, vocaux | mêmes tables (`conversations`, `messages`, …), même Realtime, même Storage | ✅ |
| Présence, « en train d'écrire », lu/non lu | mêmes canaux Realtime | ✅ |
| Notifications push | même service worker `/sw.js` (portée `/`), même abonnement push par compte/appareil (chantier P) | ✅ |
| Réglages : langue « Ma langue » | `onUpdateProfile` → `profiles.preferred_language`, même chaîne App → Layout → module | ✅ |
| Réglages : sonnerie, mode silencieux | `profiles.privacy_settings` (compte) + cache local `lmav_ringtone_v1` | ✅ sur Android/Chrome ; sur iOS, le cache local de la sonnerie repart de la valeur par défaut tant que le sélecteur des Paramètres n'a pas été rouvert (le profil, lui, est bon) |
| Blocages, signalements | mêmes tables (`user_blocks`, …) | ✅ |

Le mode module ne crée **aucune** donnée, aucun cache ni aucun canal qui lui soit propre.

---

## 6. LIMITES HONNÊTES (état au 1er septembre 2026)

- **Installation réelle sur téléphone non prouvable ici** : le bac à sable n'a ni téléphone ni Chrome interactif.
  Preuves fournies : manifeste servi et valide (`200`, `application/manifest+json`), route autonome rendue avec
  le `<link rel="manifest">` du module, rendu plein écran, tous les états du bouton dans un vrai Chromium
  (événement `beforeinstallprompt` simulé avec `prompt()`/`userChoice`), tests unitaires.
- **Icônes** : `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/maskable-512.png` sont générées par le chantier
  PWA (autre branche). Sur cette branche seule, elles ne sont pas servies : Chrome ne considérera la page installable
  qu'après fusion. Le manifeste les référence par chemin, volontairement.
- **`/messagerie` dépend de la réécriture Netlify** ajoutée dans `netlify.toml` ; `vite preview` sert `index.html`
  par son propre repli SPA (testé), le développement local peut aussi utiliser `/?module=messagerie`.
- **`scope: "/"` partagé** : depuis l'application « Messagerie » installée, « Ouvrir MokNet complet » navigue dans la
  même fenêtre (sans barre d'adresse). C'est le comportement voulu par le manifeste ; un `scope` restreint à
  `/messagerie` ouvrirait MokNet dans un onglet navigateur à la place.
- **Croix « fermer » de la liste des conversations** (zone du chantier M) : en mode module, elle ferme la fenêtre ;
  un écran de repli « Rouvrir la messagerie » prend le relais (signal `openWidgetSignal` existant), sans bouton
  flottant.
- **Affordance dans le bouton de messagerie lui-même** : livrée avec la goutte (`components/chat/MessagingDropButton.tsx`,
  maquette 01 validée) — un **maintien long de 500 ms** (souris ou toucher) affiche « Installer la messagerie sur mon
  téléphone » et appelle `handleInstallMessagingModule` (`MoocChatFloating.tsx`) : invitation native si elle est
  disponible pour ce module, sinon ouverture de `/messagerie?installer=1` (où l'invitation ou la fiche iPhone
  l'attend) ; module déjà installé → ouverture de `/messagerie`. Le clic qui suit le maintien n'ouvre pas la messagerie.

---

## 7. MODULES CANDIDATS SUIVANTS (même contrat)

| Module | Route | Composant existant | Point d'attention |
| :-- | :-- | :-- | :-- |
| Appels (audio/vidéo, interprète) | `/appels` | `ChatCallModal` + transport d'appels | déjà porté par la messagerie : commencer par un raccourci vers `/messagerie` plutôt qu'un second module |
| Réseau MOK / fil social | `/reseau` | `SocialFeed`, `SocialLive` | ouvrir une conversation depuis le fil → `pendingDirectChatMember` déjà remonté à `Layout` |
| Campus | `/campus` | `Campus` | contenus lourds : découpage des chunks avant export |
| Marché & Boutique | `/marche` | `Shop`, `MyShop` | paiements : même Wallet, même compte |
| Wallet | `/wallet` | `Wallet` | confidentialité renforcée (verrouillage à l'ouverture) |
| Architecte (vocal) | `/architecte` | `ArchitecteFloatingBar`, `DialloOS` | micro en arrière-plan : dépend des capacités de l'application installée |

---

## 8. FICHIERS

`modules/moduleRegistry.ts` · `services/modules/standaloneMode.ts` · `services/modules/installPrompt.ts` ·
`components/modules/InstallModuleButton.tsx` · `components/modules/ModulesSettingsSection.tsx` ·
`components/modules/MessagingModuleStandalone.tsx` · `public/manifests/messagerie.webmanifest` · `netlify.toml` ·
`index.tsx` · `App.tsx` · `components/Layout.tsx` · `components/settings/UnifiedSettingsModal.tsx` ·
`components/MoocChatFloating.tsx` (prop `standalone`) · `tests/moduleRegistry.test.ts` · `tests/standaloneMode.test.ts` ·
`tests/installPrompt.test.ts`.
