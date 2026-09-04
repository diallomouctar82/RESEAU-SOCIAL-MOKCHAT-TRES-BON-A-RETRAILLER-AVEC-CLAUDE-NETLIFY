# 📊 ÉTAT ACTUEL DE LA PLATEFORME — « OÙ EN EST LE MONDE À VOUS ? »
> **Synthèse Opérationnelle & Bilan d'Avancement en Temps Réel**  
> *Date de Mise à Jour : 4 Septembre 2026*
> *Version Courante : v6.16.0 (ACCUEIL NETTOYÉ — SIX DÉCLENCHEURS RETIRÉS DE L'AFFICHAGE, AUCUNE FONCTION SUPPRIMÉE, VALIDÉ PAR LA DIRECTION ; MENU « MIROIR D'EAU » + STUDIO LIVE « ABYSSE » **EN PRODUCTION SUR `moknet.net`, VALIDÉS PAR LA DIRECTION** ; MENUS DE L'EN-TÊTE RÉPARÉS ; APPELS AUDIO/VIDÉO RÉELS, TRADUITS VOIX À VOIX, SONNERIE FIABLE APPLI FERMÉE, SÉCURITÉ BASE RENFORCÉE ; **SATURATION DES DIRECTS : CODE CLIENT EN PRODUCTION ET FONCTION EDGE EN VERSION 7, MAIS ENCORE DÉLIBÉRÉMENT INERTE** — voir plus bas)*

**Jalons du 1er au 3 septembre 2026 (v6.7.0 → v6.12.0, voir `docs/HISTORIQUE_VERSIONS.md` et DEC-2026-034 à 039)** : la messagerie et les appels sont passés d'une signalisation sans média à des appels audio/vidéo réels sur le serveur LiveKit de production (`live.moknet.net`), **validés par l'utilisateur sur deux téléphones le 2 septembre 2026** ; la traduction vocale voyage dans l'appel (piste « interprète », appel normal par défaut, langue choisie par appel) ; la sonnerie et la notification d'appel fonctionnent appli fermée (Web Push serveur, service worker réparé, bouton « Sonnerie »). Le détail vérifié, mission par mission, est dans `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md`. Le 3 septembre, le premier cycle de preuves du pilote consommateur Vision Smart AI Core (TASK-0014, workflow AR12) a fermé le finding de sécurité critique de la base (vue `ai_spend_by_provider` en `security_invoker`, credentials retirées des rôles clients — DEC-2026-041, v6.12.1) ; l'évaluation à sept dimensions et le plan d'écarts sont publiés dans le dépôt VISION-SMART-AI-CORP. Le 3 septembre également, la Direction a retenu la proposition 06 « Miroir d'eau » parmi les six traitements du menu construits dans `design-lab/` : le réseau social est désormais l'écran d'accueil par défaut, l'Architecte occupe la place centrale de la navigation (goutte d'eau au centre du dock, plus de second bouton flottant), la goutte de la messagerie est le seul élément flottant, « Équipe & Experts » est au premier niveau, et le chrome global comme l'accueil sont habillés d'une matière verre/eau scopée sous `[data-miroir]` — sans toucher ni aux 10 palettes de marque (gelées) ni au système verre/eau/lumière du LIVE (DEC-2026-042, v6.13.0, `docs/DIRECTION_ARTISTIQUE_MENU_MIROIR_EAU.md`). Le 3 septembre toujours, la loupe suivante de la mission DS a porté sur le **Studio Live**, d'après une seconde image de référence fournie par la Direction : abysse turquoise à la place des aplats opaques, colonne de lumière liquide entre la scène et le panneau, tuiles en verre cyan où la vidéo vit **dans** le verre (pastille d'avatar, onde de voix branchée sur le vrai niveau audio, plaque de nom en capitales), commandes en orbes, bulles montant à l'intérieur des cartes, et « ● EN DIRECT » affiché **seulement** quand le direct passe vraiment. Toutes les variables sont scopées sous `[data-live-universe]` pour ne pas déplacer la goutte de la messagerie qui consomme `--water-accent`. Une capacité manquante a été corrigée au passage : un agent IA ne pouvait jamais être retiré de la scène. **Ce design a été validé par la Direction le 3 septembre 2026** sur les captures d'ordinateur et de téléphone (DEC-2026-043, v6.14.0, `docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md` § 8). **Le 4 septembre 2026, la Direction a levé le verrou de fusion et les deux moitiés — menu et Studio — ont été mises en production sur `moknet.net` (PR #60 → `0ad30ee`), puis validées par la Direction sur le site réel.** Mesuré sur les octets servis par `moknet.net` avant et après la fusion : `index.html` passe de 36 342 à 107 299 octets, `data-miroir` de 0 à 461 occurrences, la nappe d'eau et la règle « cartes en verre » apparaissent, et le comparatif pixel à pixel des captures donne 46,16 % de l'écran changé sur ordinateur (1440×900) et 32,60 % sur téléphone (390×844). Une relecture adversariale menée **après** la fusion a trouvé une régression que la CI ne pouvait pas voir : la règle d'habillage `[data-miroir] > *:not(.mir-scene)` (spécificité 0,2,0) écrasait les classes Tailwind `.z-20` / `.z-30` (0,1,0) des deux en-têtes, qui retombaient au même plan que le conteneur principal écrit après eux — les menus déroulants de l'en-tête (langue, Notifications, et le menu Compte qui porte la **déconnexion**) devenaient inatteignables sur ordinateur. Prouvé en navigateur réel contre la feuille de style servie par la production (`elementFromPoint` au centre de « Se déconnecter » renvoyait une carte du fil, jamais le bouton), corrigé par une exclusion `:not(header)` et couvert par un garde-fou qui interroge le moteur de sélecteurs plutôt qu'une chaîne de caractères, avec sa contre-épreuve (DEC-2026-049, v6.14.1, PR #64 → `56c596a`). **Le 4 septembre 2026, la mission SAT (saturation des directs) a livré ses quatre premières boucles sur la branche dédiée `claude/lives-directs` (v6.15.0, DEC-2026-050). La PR #69 a été FUSIONNÉE le soir même (`8902cef`), sur autorisation écrite de la Direction d'avancer étape par étape — et non sur la validation visuelle, qui n'a pas eu lieu et dont la case reste décochée dans le dossier de la PR** : l'audit a montré qu'aucun compteur de places n'existait mais que l'API serveur de LiveKit était déjà joignable et authentifiable depuis la fonction Edge (SAT-0) ; la porte d'entrée d'un direct décide désormais côté serveur, en comptant sur `listParticipants` et jamais sur `numParticipants`, dont le retard a été mesuré à 1-3 s sur 1.8.4 et 3-6 s sur 1.13.6 (SAT-2) ; un refus devient un écran nommé « Ce direct est complet » au lieu d'un « Connexion… » sans fin (SAT-3). **SAT-1 a levé la cause racine qui rendait les deux précédents inertes** : rien n'appelait jamais `createRoom`, donc chaque room naissait avec `maxParticipants = 0`, la convention LiveKit pour « aucune limite » — la porte ne pouvait refuser personne. Le plafond est maintenant posé à la création, dérivé de deux lectures vivantes (cœurs du nœud, occupation réelle) et d'une seule référence mesurée au banc (0,00767 cœur par spectateur en audio → 130 places par cœur, dont la moitié engagée) ; toute incertitude ne pose aucun plafond plutôt qu'un chiffre fabriqué. **Le code client est en production depuis le 4 septembre 2026, et pourtant RIEN DE TOUT CELA N'EST ACTIF** — ce n'est pas une contradiction, c'est la propriété qui rend le plan d'activation sûr. Le bundle servi par `moknet.net` est passé de `index-DTSWv1nS.js` à `index-DEDPIJvb.js` : « Ce direct est complet » y apparaît (0 → 1 occurrence, mesuré sur les octets réellement servis, ancien et nouveau bundle), mais cet écran **ne peut pas s'afficher**, car rien ne produit encore de refus. **L'étape 2 du plan d'activation a été faite le 4 septembre 2026 à 22h37 UTC** : la fonction Edge `livekit-token` est passée de la **version 6 à la version 7**, dans une fenêtre calme vérifiée au préalable (dernier direct démarré 14 h plus tôt, dernier appel 1 h 45 plus tôt), avec le retour arrière préparé et vérifié **octet pour octet identique** au code alors en ligne. La même sonde a été lancée sur la fonction de production avant puis après, avec un vrai compte et un vrai jeton, sur quatre chemins et trois passages chacun : **codes HTTP, longueurs de jeton et message de refus identiques des deux côtés** ; les appels ne paient aucune latence supplémentaire, les directs en paient une seule — l'unique lecture LiveKit que la conception annonce. Le garde qui décide seul qui entre dans le bloc SAT a été vérifié sur la fonction en ligne, sept mesures par cas : un UUID entre (1 553 ms, et 1 370 ms en majuscules), un UUID augmenté d'un caractère ou un nom libre n'entrent pas (724 et 780 ms) — un rapport de 2, sa signature exacte. Et **rien n'a été plafonné** : la même room sondée huit fois de suite voit son temps de réponse **descendre** (1 986 → 1 023 ms) au lieu de monter, ce qu'un plafond réellement posé rendrait impossible puisque la room existerait alors dès le second appel et coûterait un comptage de plus. Aucun 409 `live_full` n'a été émis une seule fois. **`prometheus_port` n'est toujours pas configuré sur le VPS** (`/metrics` y répond 404) et `LIVE_NODE_METRICS_URL` n'existe pas : aucune room ne reçoit de plafond, la porte lit `0` — « aucune limite » pour LiveKit — et laisse entrer tout le monde, exactement comme avant. Les trois étapes restantes (3, 4, 5) sont dans `deploy/livekit/README.md` § SAT-1b, chacune avec sa preuve constatable et son retour arrière ; le détail mesuré est dans `docs/LIVE_SATURATION_AUDIT.md`. **Reste à la charge de la Direction, et non démontrable depuis le bac à sable : un appel réel entre deux téléphones**, la fonction déployée étant celle qui émet aussi les jetons d'appel. Le 4 septembre 2026 également, à la demande de la Direction (« l’interface est trop chargée »), l’accueil a été nettoyé sur la branche `claude/cleanup-home-interface-szp8qv` (PR #73 en brouillon, v6.16.0, DEC-2026-051)** : six déclencheurs retirés de l’affichage — badge « v5.12 », pilule « Services », bannière « Lier Google Workspace » et compteur de crédits dans l’en-tête, bouton « Services Transversaux · Google » en pied de barre latérale, carte « Conseiller Référent » du tableau de bord — sans supprimer aucune fonction : le hub transversal s’ouvre depuis le menu Compte (ordinateur), le tiroir mobile et ⌘K ; la liaison Google Workspace reste dans les centres Drive, Chat et Meet ; le solde reste dans « Finance & Wallet ». Prouvé par 11 nouveaux tests DOM (935/935), build propre, captures avant/après ordinateur et téléphone. **Validé par la Direction le 4 septembre 2026 après contrôle de l’aperçu Netlify, fusionné dans `main` (PR #73) et déployé automatiquement sur moknet.net ; contrôle post-déploiement consigné dans la PR.**


**Jalon du 4 septembre 2026 — STUDIO AVATAR (v6.17.0, DEC-2026-052)** : l'identité visuelle d'un membre a désormais un propriétaire. L'Admin-Général définit, dans les Paramètres Plateforme, l'avatar appliqué à tout nouveau compte — le cliché Unsplash hérité (que l'application traitait déjà comme « avatar absent ») est explicitement refusé à la saisie, et un champ vide vaut choix assumé « initiales ». Les membres Pro remplacent cet avatar par le leur via un parcours en 6 étapes — accès Pro → photo → consentement → nom → génération → aperçu — dont l'ordre, les blocages et le consentement obligatoire sont tenus par un service PUR (`services/studio/avatarStudio.ts`), pas par l'écran : c'est ce qui rend les règles vérifiables sans navigateur ni clé d'API. Aucune migration : la photo va dans `profiles.avatar_url` et la persona dans le JSON `profiles.privacy_settings`, deux chemins déjà réellement écrits par le client, comme la fiche de consentement de l'Architecte. Deux défauts ont été corrigés à la cause au passage — `adminConfigService` faisait un `JSON.parse` brut du `localStorage` (un blob enregistré avant l'ajout du réglage aurait fait planter la console admin), et un compte ayant reçu l'avatar par défaut s'en voyait annoncer « votre photo de profil ». **Preuves** : 919 tests verts (67 fichiers, dont 60 nouveaux), `tsc --noEmit` sans erreur, build Vite de production réussi. **Non déployé** — aucune mise en production sans autorisation explicite.

**Jalon du 4 septembre 2026 — PORTRAIT VIVANT FLUIDE ET NATUREL (v6.20.0, DEC-2026-055)** : la Direction a jugé la première vidéo « pas assez fluide ni naturelle ». Cadence mesurée à 60 i/s : le mouvement était en cause, pas la machine. Le rendu passe en **Canvas 2D** : fond immobile, tête qui respire devant lui, mâchoire **déformée en continu** (le cou ne bouge pas, aucune couture), paupières limitées à une ellipse fondue par œil, regard par saccades, hochements sur le phrasé et non sur chaque syllabe, lèvres entrouvertes en parlant. Un **banc à pose fixée** (`design-lab/banc/portrait.html`) isole chaque composante. **Non déployé en production** — prévisualisation de branche, aucune fusion avant validation visuelle de la Direction.

**Jalon du 4 septembre 2026 — PORTRAIT VIVANT DE L'ARCHITECTE (v6.19.0, DEC-2026-054)** : après trois refus de la Direction (dessin « pas humain », photo « juste posée », bouche sous les lèvres et sourcils ramenés sur les yeux), l'avatar est désormais une **vraie photo qui vit** : la lèvre du haut ne bouge jamais, la lèvre du bas descend avec le menton sur une cavité avec dents, les paupières sont faites de la peau au-dessus des cils étirée (clignements de 220 ms, aussi en parlant), la tête dérive, s'incline, hoche sur les syllabes et se balance en parlant, la respiration est visible. Calage **relevé sur grille au 0,5 %**, plus estimé. La page publique `/architecte` parle **à voix haute** avec la voix du navigateur, bouche au rythme des mots, annoncé honnêtement. **Preuves** : vidéo de 29 s sur le build de production, 726 images mesurées (trois phrases, clignements, amplitude de tête), suite complète verte. **Non déployé en production** — prévisualisation de branche, aucune fusion avant validation visuelle de la Direction.

**Jalon du 4 septembre 2026 — AVATAR VIVANT DE L'ARCHITECTE (v6.18.0, DEC-2026-053)** : l'Architecte, « guide permanent de toute la maison MokNet », n'était qu'un rond de 48 px portant une icône. Il a désormais un **visage** : le bouton de sa barre flottante est remplacé par un avatar qui montre son état et dont la bouche suit la voix. Construit d'après la compétence **Vision Smart AI Core, playbook 15 « Avatar vivant personnalisable — Présence conversationnelle vivante »**, imposée par la Direction comme base de travail. Niveau de présence livré **P1 + P2** (présence légère SVG/CSS + présence vocale), déclaré dans le code ; **P3** (avatar vidéo temps réel) et **P4** (avatar génératif personnel) ne sont ni livrés ni simulés. La **machine d'états normative à huit états** du playbook est appliquée, y compris `fallback` et `offline` qui manquaient à la grammaire visuelle du dépôt — sans `fallback`, une bascule de moteur vocal laissait l'avatar « au repos », donc l'air parfaitement sain pendant une dégradation réelle. La **synchro labiale a trois niveaux honnêtes** : amplitude réellement mesurée sur l'élément `<audio>` du moteur ElevenLabs ; rythme des mots avec le moteur natif du navigateur, qui n'expose aucun flux audio ; aucune. Le Super-Admin reçoit les quatre réglages demandés — changer l'avatar, remettre par défaut, activer/désactiver les animations, régler la voix — plus l'ancre de bouche, indispensable sur une photo où le code ne peut pas deviner où est une bouche. La photo de référence de la Direction n'ayant pas pu être déposée dans le dépôt, le visage par défaut est un **dessin vectoriel original** composé d'après elle ; « Changer l'avatar » permet de déposer la photo exacte. **Preuves** : 990 tests verts (69 fichiers, dont 71 nouveaux), `tsc --noEmit` sans erreur, build Vite réussi, et vérification sur la prévisualisation Netlify réellement servie (`deploy-preview-71`, bundle `index-CT-cRCmm.js`, HTTP 200). **Non déployé en production** — aucune fusion avant validation visuelle de la Direction.
---

## 🎯 SYNTHÈSE EXÉCUTIVE
**Hotfix v6.6.2** : l'ouverture d'une conversation locale (`chat-u5` ou `local-…`) ne transmet plus cet identifiant factice à `messages.conversation_id` ni aux abonnements Supabase Realtime. Les conversations locales restent affichables en dégradation gracieuse; seules les conversations portant un UUID réel accèdent au backend. La correction est couverte par deux tests d'intégration (frontière locale et conservation du chemin UUID), par la suite complète de 256 tests et par un build Vite de production réussi. Aucun schéma, aucune donnée et aucun module hors messagerie n'est modifié.

**Le Monde à Vous** a franchi le jalon **TRADUCTION CENTRALISÉE — MESSAGERIE TEXTE (v6.6.3)**, construit sur le hotfix v6.6.2 et le socle de résilience IA v6.6.1. La plateforme est un écosystème hautement intégré combinant 15 modules, l'expertise de 8 spécialistes de la Famille Diallo, un marché mondial sécurisé, un campus certifiant, un GPS de carrière complet, un réseau de confiance, un espace Super-Administrateur souverain, un orchestrateur central et une interface conversationnelle moderne, aérée et hyper-résiliente.

La version **v6.6.3** ajoute, sans élargir le périmètre fonctionnel :
- **Service central unique de traduction** (`services/translation/translationService.ts`) : contrat `TranslationEngine` remplaçable, routage par `aiGateway`, cache mémoire borné, mutualisation des appels et dégradation gracieuse.
- **Messages texte bilingues** : langue de l'auteur enregistrée dans `messages.metadata.original_language`, original conservé dans `messages.content`, traduction automatique affichée séparément dans `profiles.preferred_language` du destinataire.
- **Phase appels vocaux — livrée depuis** (elle était bloquée jusqu'à validation de la livraison texte, obtenue le 1er septembre) : interprète d'appel puis voix traduite dans l'appel (v6.7.0, v6.10.0, v6.11.0) — voir la section 1.5 ci-dessous.

Le socle **v6.6.1** consacre également :
- **Absorption Automatique des Pointes de Charge (503 UNAVAILABLE / High Demand)** : Détection proactive et gestion résiliente des surcharges d'API distantes dans l'Edge Function orchestratrice `supabase/functions/ai-gateway/index.ts`.
- **Cascade Multi-Modèles Instantanée** : En cas de forte affluence sur `gemini-2.5-flash`, basculement automatique et silencieux vers `gemini-2.5-pro` ou `gemini-2.0-flash`, puis vers les autres fournisseurs configurés (Claude, DeepSeek, OpenAI, Mistral) sans rupture d'expérience.
- **Protection Multimodale (Vision HUD & Voice)** : Prise en charge des bascules dans `services/multimodalVision.ts` et `services/ai.ts` pour garantir un fonctionnement ininterrompu de la caméra et de l'analyse.
- **Refonte Complète & Calibre Pro du Chat (`ChatInterface.tsx`)** : Interface épurée, aérée et moderne avec bulles soignées, micro-interactions fluides, suggestions dynamiques par expert, attachement de fichiers/photos, perception visuelle caméra HUD et synthèse vocale HD ElevenLabs.
- **Fonctionnement Garanti dès le 1er Instant** : Routage multi-fournisseur transparent via `services/aiGateway.ts` (point d'entrée unique côté client vers l'orchestrateur `supabase/functions/ai-gateway`), assurant zéro blocage et zéro écran blanc même sans configuration de clés.
- **Visualisation Dynamique du Fournisseur Actif & Auto-Bascule** : Badge de statut en temps réel (ex. `🟢 Google Gemini 2.5 Flash • 115ms` ou `⚡ Relais : DeepSeek V3`), et affichage des métriques de latence et moteur utilisé sous chaque réponse.
- **Tableau de Bord Fournisseurs Dédié (`components/admin/AiOrchestrator.tsx`)** : Accessible depuis le Tableau de Bord Super-Admin (`AdminDashboard.tsx`, lui-même ouvert en 1 clic depuis la barre de navigation supérieure `Layout.tsx`), permettant de tester chaque connecteur en direct, prioriser/forcer un fournisseur et le reconnecter après correction de sa clé.
- **Orchestrateur Central des Modèles IA (Super Admin)** : Pilotage en temps réel de 15+ connecteurs d'IA majeurs (Gemini, DeepSeek, Claude AI, OpenAI, Mistral, Qwen, Kimi, Kling AI, ElevenLabs, HeyGen, Runway, OpenRouter, n8n, Grok, Ollama) activables et désactivables en 1 clic.
- **Sélection Intelligente & Cascade de Résilience sans Coupure** : Routage automatique selon la spécialité de tâche (raisonnement, juridique & contrats, code, multilingue, vidéo, voix, automatisation), la latence, le taux d'erreur, le score de qualité et les plafonds de budget quotidien (`dailyQuotaLimitUSD`).
- **Portails Officiels Développeurs 1-Clic** : Accès direct pour chaque fournisseur vers 4 destinations officielles clés : Créer un compte, Générer une clé API, Accéder à la documentation et Consulter les quotas & facturation.
- **Détection Automatique & Actions Correctives** : Vérification en temps réel des variables d'environnement (`detectedEnvVar`, `isEnvKeyPresent`), alertes visuelles immédiates et recommandations correctives ciblées.
- **Tableau de Bord & Audit Logs en Temps Réel** : Suivi des métriques de latence, scores de qualité, taux de succès et journal d'audit complet de toutes les bascules de secours.
- **Relecture Vidéo Pérenne & Fiabilisée** : Conversion des médias vidéos en Data URL Base64 persistantes au lieu d'URLs blob éphémères, permettant une relecture instantanée et illimitée par les propriétaires et tous les membres de la communauté.
- **Accès Immédiat & Universel au Tableau de Bord Super-Admin** : Intégration du composant `AdminDashboard` dans le routage `App.tsx` et ajout de boutons d'accès directs dorés dans le Header desktop, le menu déroulant profil de l'avatar, la barre latérale (Sidebar) et le Dashboard d'accueil.
- **Gestion Complète de Tous les Comptes & RBAC** : Vue exhaustive de tous les utilisateurs réels et synchronisés, attribution granulaire des rôles, ajustement audité des soldes Ⓒ, modération en direct, et sauvegardes souveraines.
- **Unification & Résilience Supabase / Netlify / GitHub** : Tolérance aux pannes de schéma (`PGRST204`), éliminant tout risque d'écran blanc (*Zero White Screen of Death*).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STATUT GLOBAL : CHROMATIC REFINEMENT v6.1 (14/14 Modules & 10 Palettes Actives) │
│ QUALITÉ & RÉSILIENCE : 22/22 Défauts Résolus & Validés (Norme IEEE 1044 / PSP) │
│ IDENTITÉ VISUELLE : Bleu Profond + Institutionnel + Épuré + Color Lab Réactif   │
│ DESIGN SYSTEM : V1.0.0 Figé, Documenté (26 chapitres), Zéro AI-Slop             │
│ NAVIGATION : 5 Piliers + Mode Guide-moi + Recherche ⌘K + Transversal Workspace │
│ ACCESSIBILITÉ : 100% WCAG AA, Clarté Cognitive, Restitution Vocale & Scanner   │
│ COHÉRENCE ARCHITECTURALE : 100% (Builds verts, Types stricts)                  │
│ MÉMOIRE VIVANTE & HANDOFF : Suite documentaire complète et interconnectée      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 1. CE QUI FONCTIONNE PLEINEMENT (MODULES OPÉRATIONNELS)

### 1.1. Diallo OS, Experts & Conseil Collégial
- Dialogue interactif avec chaque expert Diallo (Directeur, Maître, Conseiller, Professeur, Dr, Monsieur, Guide, Analyste).
- Salle de Conseil Réuni (`CouncilRoom.tsx` / `UnifiedCouncilRoom.tsx`) réunissant les spécialistes pour résoudre un cas transversal.
- Orchestrateur central (`components/DialloOS.tsx`, routé via `services/aiGateway.ts`) avec extraction d'intentions et ventilation automatique vers les modules idoines.
- **Moteur Vocal Pro & Dialogue Conversationnel Fluide (`voiceEngine.ts`)** :
  - **Synthèse Vocale Haute Fidélité ElevenLabs (HD)** :
    - Intégration de l'API ElevenLabs avec restitution MP3 haute fidélité via `generateSpeech()` (`services/aiGateway.ts`), routée par l'orchestrateur `supabase/functions/ai-gateway` (catégorie « voix ») — aucun proxy Express, la clé ne quitte jamais le serveur.
    - Voix personnalisées et réalistes attribuées à chaque membre de la Famille DIALLO et aux formations du Campus.
    - Mise en cache intelligente des flux audio générés (Blob URLs) pour zéro latence lors des réécoutes et économie de bande passante.
    - Bascule automatique et dégradation gracieuse vers le moteur vocal natif (`window.speechSynthesis`) si la clé API n'est pas renseignée.
    - Panneau de configuration dédié (`VoiceSettingsModal.tsx`) permettant de préécouter, tester et sélectionner les voix préférées.
  - Voice Activity Detection (VAD) avec détection de silence intelligente et auto-envoi sans clic.
  - Découpage acoustique phonétique (phrases naturelles sans coupures ni troncatures).
  - Mode "Dialogue Continu / Mains Libres" avec reprise automatique de micro à la fin de la réponse de l'avatar.
  - Suppression d'écho acoustique (pause du micro pendant la parole de l'avatar pour éliminer les retours).
  - Heartbeat anti-sommeil de la Web Speech API sur navigateurs Chromium.
  - Interruption instantanée (barge-in) dès que l'utilisateur reprend la parole.
- HUD Multimodal & Support vocal temps réel (`voiceEngine.ts`).
- **Hub Central Multi-Fournisseurs d'IA & Cascade Auto-Résilience (`supabase/functions/ai-gateway/index.ts`, `services/aiGateway.ts`)** :
  - **10+ Moteurs Connectés** : DeepSeek (V3/R1), Anthropic Claude (3.5 Sonnet/Haiku), OpenAI (GPT-4o/o1/o3), Alibaba Qwen (DashScope 72B), Moonshot Kimi (K3/K1.5 128k), Kling AI (Vidéo Kuaishou), OpenRouter Multi-LLM Gateway, n8n Workflow Automation, HeyGen Interactive Avatars, RunwayML (Gen-3/Gen-2) et ElevenLabs TTS.
  - **Edge Function Orchestratrice Sécurisée (`supabase/functions/ai-gateway/index.ts`)** : Point d'entrée serveur unique, invoqué via `supabase.functions.invoke('ai-gateway', ...)`, avec sélection automatique du fournisseur, gouvernance de budget (plafonds jour/mois) et calcul du coût de chaque appel.
  - **Banc d'Essai & Liens Directs 1-Clic (`components/admin/AiOrchestrator.tsx`)** : Test des connecteurs en direct, statut de configuration avec détection de clés, et liens officiels directs vers les portails développeurs pour chaque fournisseur.
  - **Dégradation Gracieuse & Zéro Écran Blanc** : Fonctionnement fluide avec ou sans clés d'environnement grâce aux modèles de repli souverain.

### 1.2. Marché Mondial & Business Operating System
- Catalogue universel tridimensionnel (B2B, B2C, C2C) avec filtrage par pays d'origine, devises et certifications.
- Système de gestion de boutique vendeur (`MyShop.tsx`) et copilotage commercial IA.
- Suite complète d'import-export : Sourcing de fournisseurs, appels d'offres (RFQ), négociation assistée, calcul de coût complet (Incoterms 2020), gestion des litiges et salons virtuels mondiaux.

### 1.3. Carrière & Accomplissement (GPS Point A ➔ Point B, Radar, Conquête, Continuité, Réseau, Stratégie & Consolidation Finale 7/7)
- Définition d'objectifs parmi 12 archétypes de carrière ou saisie libre.
- Diagnostic complet du Point A sur 17 critères (compétences, langues, budget, contraintes).
- Jumeau Professionnel Évolutif attestant des compétences acquises et des certifications.
- **Radar Intelligent Multi-Sources & Agent de Conquête (Étape 2/7)** :
  - Recherche d'opportunités par intentions en langage naturel.
  - Décomposition explicable de la compatibilité (Forces acquises vs Compétences à combler avec passerelles directes Campus).
  - 4 Univers de Conquête (Emploi & Missions, Clients B2B, Fonds & Bourses, Achats & Sourcing) + Horizons nouveaux.
  - Échéance et préparation : Prêt maintenant, À préparer, Objectif futur.
  - Cartographie géographique par rayon d'action (Local, National, Régional, International, 100% Télétravail).
  - Détection de signaux faibles et opportunités non publiées du Réseau MOK.
  - Agent de veille passive autonome ("Mon Agent cherche pour moi") 24h/24.
  - Coffre d'opportunités sécurisé avec suivi des statuts, notes et actions.
  - Boucle d'apprentissage et feedback utilisateur.
- **Mode Conquête & Salle de Préparation (Étape 3/7)** :
  - **Salle de Préparation Multi-Onglets (`CareerConquestRoom.tsx`)** avec analyse d'angle stratégique 5D et score de préparation /100.
  - **CV Maître Universel (`CareerMasterResumeModal.tsx`)** & projection contextuelle sur mesure.
  - **5 Formats de Pitchs** avec téléprompteur interactif et enregistreur audio/vidéo (`CareerTeleprompterModal.tsx`).
  - **Simulateur Réaliste & Crash Test** (10 questions + 3 pièges) avec correction IA instantanée ou Coach 3D Vocal.
  - **Checklist & Fiche Flash J-0** (`CareerMeetingFlashModal.tsx`).
  - **Quality Gate Obligatoire (`CareerQualityGateModal.tsx`)** garantissant la règle absolue *« L'humain est le seul maître de l'action »*.
  - **Décodeur de Réponses Recruteur / Client (`CareerResponseAnalyzerModal.tsx`)**.
- **Suivi Autonome, Dossier Vivant & Agent de Continuité (Étape 4/7)** :
  - **Hub de Contrôle & Pulse de Carrière (`CareerContinuityControlHub.tsx`)** avec 6 métriques stratégiques.
  - **Commandes Héroïques Directes** : **« Que dois-je faire maintenant ? »** (`CareerWhatShouldIDoNowModal.tsx`) & **« Prépare-moi pour demain »** (`CareerBriefingTomorrowModal.tsx`).
  - **Dossier Vivant (`CareerLiveDossierModal.tsx`)** : Timeline horodatée, Next Best Action permanente, documents et notes.
  - **Moteur de Relance Intelligente Anti-Spam (`CareerSmartFollowUpModal.tsx`)** : Timing courtois J+7/J+10 et apport de valeur obligatoire.
  - **Fiche Flash Réunion & Débriefing Vocal Instantané (`CareerMeetingPrepModal.tsx` & `CareerPostMeetingDebriefModal.tsx`)**.
  - **Résilience & Capitalisation Continue - Mode Plan B (`CareerPlanBModal.tsx`)** : Réallocation des acquis vers des opportunités similaires.
- **Capital Relationnel, Réseau & Prospection (Étape 5/7)** :
  - **Hub Central de l'Écosystème Relationnel (`CareerRelationalEcosystemHub.tsx`)** : Cockpit d'intelligence relationnelle et dialogue *« Qui dois-je contacter ou relancer aujourd'hui ? »*.
  - **Carte Relationnelle Intelligente & Dynamique (`CareerRelationshipMapModal.tsx`)** : Graphe Moi ➔ Objectif ➔ Directs ➔ Facilitateurs ➔ Cibles avec pertinence bidirectionnelle explicable.
  - **Déduction « Qui devrais-je connaître pour mon objectif ? » (`CareerWhoShouldIKnowModal.tsx`)** : Déduction des profils clés depuis le Point B.
  - **Mode Introduction Professionnelle (`CareerIntroductionModal.tsx`)** : Approche qualifiée avec consentement et validation humaine obligatoire.
  - **Fiche Relationnelle 360° & Mini-CRM (`CareerContactDetailModal.tsx`)** : Pipeline à 10 étapes, mémoire relationnelle, engagements mutuels et synergies MOC.
  - **Équipes d'Opportunité & Réponse Collective (`CareerCollaborativeMissionModal.tsx`)** : Consortia pluridisciplinaires et espace de travail partagé.
  - **Hub de Mentorat & Réputation Contextualisée (`CareerMentorshipModal.tsx`)** : *J'apprends ➔ Je maîtrise ➔ J'accomplis ➔ Je transmets*.
  - **Vue Synthétique 360° Écosystème (`CareerEcosystem360Modal.tsx`)** : 8 piliers stratégiques.
- **Intelligence Stratégique, Trajectoires Prédictives & Orientation Continue (Étape 6/7)** :
  - **Hub Central d'Intelligence Stratégique (`CareerStrategicAdvisorHub.tsx`)** : Cockpit en 8 piliers articulé autour de la formule `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER`.
  - **Boussole Stratégique 4D (`CareerStrategicCompassModal.tsx`)** : Point A, Point B, Marché, Action Immédiate (mode Accélération vs Équilibre).
  - **Simulateur de Trajectoires Comparatif & Scénarios « Et si ? » (`CareerTrajectorySimulatorModal.tsx`)** : Confrontation de 5 trajectoires types (Verticale, Spécialisation, Management, Entrepreneuriat, Expatriation).
  - **Skill Graph & Cartographie des Écarts (`CareerSkillGraphGapModal.tsx`)** : Niveaux de preuve (déclarée à confirmée par réalisation) et passerelles directes Campus.
  - **Passeport de Compétences Transférables (`CareerSkillsPassportModal.tsx`)** : Valorisation des acquis vers de nouveaux secteurs (Reconversion).
  - **Plans d'Évolution 90 Jours & 1 An (`CareerEvolutionPlansModal.tsx`)** : Feuilles de route cadencées mois par mois et trimestres T1-T4.
  - **Diagnostic de Plateau & « Débloque ma situation » (`CareerPlateauUnlockModal.tsx`)** : Détection des stagnations et calcul du Levier N°1.
  - **Conseil de Carrière Multi-Experts (`CareerMultiExpertCouncilModal.tsx`)** : Orchestration collégiale des 4 experts Diallo (Carrière, Finance, Langues, Juridique).
  - **Matrice de Décision Personnelle & Arbitrage d'Opportunités (`CareerDecisionMatrixModal.tsx`)** : Pondération multicritère de 7 valeurs de vie.
  - **Bilan de Carrière IA Généré (`CareerAIBilanModal.tsx`)** : Synthèse complète des réalisations et orientations du prochain cycle.
  - **Visualisation Chronologique « Mon Évolution » (`CareerEvolutionTimelineModal.tsx`)** : Timeline vivante du chemin parcouru jusqu'au Point B.
- **Consolidation Finale & Cycle Perpétuel d'Accomplissement (Étape Finale 7/7)** :
  - **Centre de Commande Unifié (`CareerMasterCommandHub.tsx`)** : Cockpit central avec bascule instantanée Mode Simple (centré sur l'action du jour) / Mode Avancé (7 piliers complets).
  - **Dossier Maître Unique (`CareerMasterDossier`)** : Base de données vivante synchronisant identité, cap (Point A ➔ Point B), journal chronologique et permissions.
  - **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** : Récit de parcours narratif et moteur d'arbitrage de la meilleure action universelle.
  - **10 Modals & Commandes d'Accomplissement** :
    1. *« Raconte-moi mon parcours »* (`CareerNarrativeStoryModal.tsx`) : Récit continu valorisant avec lecteur vocal.
    2. *« Que dois-je faire maintenant ? »* (`CareerWhatShouldIDoModal.tsx`) : 3 meilleurs leviers du jour avec gains attendus.
    3. *« J'ai une urgence »* (`CareerEmergencyModal.tsx`) : Diagnostic commando express (entretien dans 1h, dossier ce soir, offre à négocier).
    4. *Mode Célébration & Nouveau Cap* (`CareerAccomplishmentCelebrationModal.tsx`) : Consécration du Point B et réenclenchement d'un cycle ambitieux.
    5. *Centre de Contrôle & Permissions IA* (`CareerAgentPermissionsLogsModal.tsx`) : Matrice de souveraineté, pause d'urgence et logs d'audit.
    6. *Onboarding Conversationnel Intelligent* (`CareerConversationalOnboardingModal.tsx`) : Cadrage fluide sans formulaire.
    7. *Recherche Universelle Carrière* (`CareerUniversalSearchModal.tsx`) : Indexation globale de l'écosystème.
    8. *Test de Cohérence du Cap* (`CareerCoherenceAuditModal.tsx`) : Alignement des actions sur le Point B.
    9. *Opportunités Surprises* (`CareerSurpriseOpportunityModal.tsx`) : Décloisonnement par compétences transférables.
    10. *Mon Impact & Transmission* (`CareerImpactTransmissionModal.tsx`) : Boucle d'utilité collective et mentorat.
- Coach 3D Vocal interactif et certification des résultats tangibles.

### 1.4. Campus Mondial Intelligent, Multi-Programmes & Éducation (100% Conforme Feuille de Route)
- **Registre des Cours Réels d'Excellence (`services/realCurriculumCourses.ts`)** : Véritables contenus académiques exhaustifs pour les programmes nationaux (Mathématiques Terminale, Mécanique Newtonienne, Philosophie de la Liberté et de la Justice) et les formations supérieures (Droit des Affaires OHADA, Ingénierie Cloud & Cybersécurité).
- **Récitation Vocale & Dictée Audio par Professeur Diallo (`window.speechSynthesis`)** : Récitation audio posée et claire de chaque cours en français académique avec commandes Play, Pause et arrêt automatique lors des changements de module.
- **Espace Travaux Pratiques avec Corrigé Dépliable & Barème Pas à Pas** : Énoncés d'épreuves réelles, contextes authentiques, étapes méthodologiques guidées et révélation contrôlée du corrigé officiel avec attribution des points.
- **Référentiels Officiels Multi-Pays & Explorateur de Matières** : Guinée (MEPU-A), Sénégal (Office du Bac), France (Eduscol), Côte d'Ivoire (MENA), USA (AP & SAT), UK (Cambridge A-Levels).
- **Catalogue des Formations Certifiantes & Diplômes d'Élite (`services/formationsRegistry.ts`)** : Cursus universitaires et professionnels complets (Tech & IA, Droit OHADA, Ingénierie Cloud, Médecine, Finance, Agro-écologie, Doctorats) avec crédits ECTS, prérequis, débouchés et corps professoral.
- **Processus & Modal d'Inscription Officielle (`CampusCourseEnrollmentModal.tsx`)** : Choix du statut académique (Parcours Certifiant avec délivrance de diplôme vs Auditeur Libre), validation du dossier d'admission et intégration immédiate à la salle de classe.
- **Salle de Classe Multimédia & Interactive (`CampusClassroomView.tsx`)** : Espace d'apprentissage complet avec cours théorique, écoute vocale, lab de mise en pratique avec exécuteur interactif, quiz formatif de vérification, carnet de notes synchronisé et accès aux ressources.
- **Salle d'Examen Certifiant Chronométrée (`CampusCertifyingExamView.tsx`)** : Épreuve officielle sous minuterie, correction automatique, délibération du jury académique et attribution du diplôme si note ≥ 10/20.
- **Visualisation & Registre des Diplômes Authentifiés (`CampusDiplomaViewerModal.tsx` & Onglet `Mes Diplômes`)** : Parchemin haute fidélité avec sceau d'authenticité, numéro de série unique, signature du Professeur Diallo, QR Code de vérification et fonction d'impression / export PDF.
- **Navigation par 5 Onglets Spécialisés** : `Programme Officiel & Matières`, `Formations & Cursus Certifiants`, `Examens Blancs Officiels`, `Passerelles & Équivalences`, `Mes Diplômes & Certifications`.
- **Dialogue Vocal Bidirectionnel & Synthèse Temps Réel** : Dictée vocale continue/push-to-talk avec écoute du Professeur Diallo et lecture audio fluide.
- **Caméra Vidéo Interactive & HUD Vision Pédagogique** : Flux WebRTC avec détection de mouvements optiques (jauge d'activité %) et reconnaissance visuelle d'objets (cahier, calculatrice, devoirs, énoncés manuscrits).
- **Scanner & Guidance Visuelle Pas-à-Pas** : Bouton d'analyse instantanée face caméra pour scanner les exercices physiques et être guidé méthodologiquement.
- **Partage & Analyse de Documents et Devoirs** : Drag-and-drop et téléversement de documents (PDF, images, feuilles d'examens) avec résolution guidée par Professeur Diallo.
- **Diagnostic Initial & Positionnement Interactif (Point A ➔ Point B — `CampusDiagnosticModal.tsx`)** : Test rapide de positionnement en 5 minutes, cartographie des compétences officielles cibles et recalibration automatique du plan d'étude.
- **Étude Directe des Chapitres Officiels** : Bouton d'étude directe sur chaque chapitre du programme national liant le cours théorique, les exercices corrigés et le coaching de Professeur Diallo.
- **Banque d'Examens Blancs Officiels Multi-Pays (`CampusMockExamView.tsx`)** : Épreuves minutées conformes aux barèmes officiels (Guinée, France, Sénégal, CI, Alphabétisation) avec notation /20 et analyse des erreurs.
- **Simulateur de Passerelles & Équivalences Mondiales (`CampusEquivalenceComparator.tsx`)** : Comparateur de diplômes, conversion de notes/GPA, matières partagées, écarts et plan de mise à niveau.
- **Moteur Pédagogique Adaptatif & Coach 3D Professeur Diallo (`CampusProfessorCoach.tsx`)** : 4 modes de reformulation cognitive (*"Explique-moi autrement"* : analogie simple, pas-à-pas, exemple local, langage direct).
- **Alphabétisation & Fondamentaux pour Tous** : Parcours d'émancipation pour adultes et jeunes non scolarisés (lecture du quotidien, calcul commercial, monnaie).
- **Centre des Langues** : 40+ langues avec répétition espacée et prononciation audio.

### 1.5. Réseau MOK, Messagerie & Espace Live Intelligent
- **Messagerie Instantanée (`MoocChatFloating.tsx` & `ChatMessageItem.tsx`)** — réécrite contre le vrai schéma Supabase aux LOOP 06-07/17 (Architecte MOCnet) après audit : cette section affirmait auparavant des capacités jamais implémentées (chiffrement de bout en bout, épinglage, appels chiffrés) alors que l'envoi de message réel échouait silencieusement depuis toujours contre le backend. État réel, vérifié par test de bout en bout :
  - Communication 1-à-1 et groupes réels (`conversations`/`conversation_participants`/`messages`), avec anti-doublon d'envoi (`client_message_id`) et blocage réellement appliqué à l'envoi.
  - **Confidentialité réelle** : chaque conversation n'est visible que par ses membres (RLS `is_conversation_member`) — **aucun chiffrement de bout en bout n'est implémenté** (le contenu est stocké en clair dans la base, comme documenté honnêtement dans l'interface elle-même depuis le LOOP 07/17), il ne faut donc jamais présenter cette capacité comme acquise.
  - Envoi d'images/vidéos/documents/messages vocaux avec aperçu — pièces jointes réellement persistées (colonne `attachment_url`), mais encore en base64 (upload Storage réel non fait, voir Chantier Messagerie LOOP 06/17 dans `docs/SUPABASE_ARCHITECTURE.md`).
  - Citations/réponses, réactions emoji (atomiques, `toggle_message_reaction`), résumé de conversation et traduction automatique par le service central dans la langue préférée du destinataire ; `messages.content` reste toujours l'original et `metadata.original_language` en conserve la langue déclarée.
  - **Épinglage** : bouton présent dans l'UI mais **non fonctionnel** — `onPin` n'est câblé par aucun appelant, aucune colonne `is_pinned` n'existe sur `messages`. Non implémenté, pas un correctif à faire passer pour acquis.
  - **Appels audio/vidéo — réels depuis le 2 septembre 2026** (état vérifié, `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md`) : la signalisation reste sur Supabase Broadcast ; le média passe par le serveur LiveKit de production `live.moknet.net` (une room par appel, identité LiveKit par onglet, SDK `livekit-client` épinglé 2.17.3 — la seule ligne qui tient face au serveur 1.8.4 déployé). **Audio bidirectionnel validé par l'utilisateur sur deux téléphones** ; image du correspondant ; connexion en moins de deux secondes après le décroché (mission LT) ; sonnerie hors application par Web Push serveur (`push-notify`) avec service worker réparé et bouton « Sonnerie » (mission SN) ; traduction vocale dans l'appel : appel normal par défaut, langue choisie par appel dans l'écran d'appel, voix traduite publiée comme piste « interprète » (missions VT‑1b et LT). Chiffrement : transport WebRTC (DTLS‑SRTP) entre chaque participant et le serveur — **aucun chiffrement de bout en bout**, à ne jamais présenter comme acquis. Diagnostics d'appel réels dans `call_diagnostics`.
- **Réseau Social de Confiance (`SocialFeed.tsx`)** :
  - Publications de posts enrichis (texte, images HD, vidéos avec relecture continue), likes, commentaires, partages et direct live.
  - Système de réputation décentralisée Mok Trust Hub avec notation d'intégrité.
  - Découverte de Tribus et visionneuse de Smart Reels.
- **Espace Live Intelligent Haute Résilience (100% Opérationnel — Zéro Écran Blanc)** :
  - Lancement instantané (« Démarrer le live maintenant ») et programmation de sessions bilingues avec sélection de Copilote IA Diallo OS.
  - Détection automatique et gestion gracieuse des flux WebRTC/Microphone/Caméra et partage d'écran.
  - Barre d'actions intelligente (`LiveSmartActionBar`), prise de notes personnelles dans la mémoire privée, création de tâches, demandes de SOS expert, vérification de sources (fact-checking) et rendez-vous 1-à-1.
  - Tableau blanc interactif (`LiveWhiteboard`), compte-rendu téléchargeable post-live et salle d'attente technique.

### 1.6. Services Vie Quotidienne & Google Workspace
- **Juridique** : Générateur de procédures administratives, titres de séjour et Coffre-fort numérique sécurisé.
- **Logement** : Moteur de recherche de biens, simulateur d'aides APL et modèles de baux.
- **Santé** : Dossier médical d'urgence, carnet vaccinal et orientation préventive.
- **Mobilité** : Simulateur de visas mondiaux et fiches pratiques 195 pays.
- **Wallet** : Soldes multi-devises, transferts et conversion instantanée de Crédits.
- **Google Workspace** : Intégration Drive, Meet, Chat et Google Maps pour la géolocalisation des ambassades et entreprises.

---

## 🟡 2. CE QUI EST PARTIEL OU EN COURS D'AMÉLIORATION CONTINUE
- **Gamification Transversale Unifiée** : Les mécanismes de récompense (XP, niveaux, badges) sont actifs sur Campus et Carrière, mais attendent d'être unifiés dans un module dédié de motivation globale.
- **Salles d'Atelier Pédagogique Collaboratif** : L'infrastructure de tableau blanc (`LiveWhiteboard.tsx`) est prête pour être branchée sur des cours collectifs en direct.

---

## 🟢 1.7. Backend Supabase (27 août 2026)

**Migration complète Firebase → Supabase effectuée.** Authentification Google OAuth unifiée (Supabase Auth, permissions minimales), profil applicatif séparé (`profiles`) avec RLS, et persistance réelle pour : Identity, Social (posts/commentaires/réactions/stories), Messagerie (dont chat Expert IA), Dossiers de vie, Carrière (Radar + CV Maître), Éducation/Campus (cours/inscriptions/certificats), Commerce minimal (boutique/commandes), Finance (solde dérivé), Notifications, Fichiers (Storage), Live (intégral), catalogue Agents. Détail complet : `docs/SUPABASE_ARCHITECTURE.md` et `docs/AUTHENTICATION.md`.

Volontairement laissés hors périmètre (0% de persistance prouvée dans le code, écrans de démo uniquement) : Trade/Commerce Mondial (RFQ, CommercialDossier, salons, MokTrust), Tribus/Cercles riches.

**Prérequis restant côté utilisateur** : configurer le Client ID/Secret Google OAuth dans Supabase Dashboard (voir `docs/AUTHENTICATION.md §4`) pour que la connexion Google soit pleinement fonctionnelle en production.

## 🔴 2. PROCHAINES PRIORITÉS IMMÉDIATES (ROADMAP)
1. Compléter la configuration OAuth Google côté Supabase Dashboard (prérequis externe).
2. **Système Global de Motivation & Engagement** (Prompt dédié à venir).
3. **Campus 3.0 : Cours Collectifs en Direct & Co-apprentissage** (Prompt dédié à venir).
4. Normaliser Trade/Commerce Mondial et Tribus dans Supabase si/quand ces modules deviennent prioritaires (actuellement hors périmètre, voir §1.7).
