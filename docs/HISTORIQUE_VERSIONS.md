# ⏱️ HISTORIQUE DES VERSIONS & CHANGELOG MAÎTRE
> **Traçabilité des Versions Déployées, Jalons Majeurs et Matrice d'Impacts**  
> *Plateforme : Le Monde à Vous*

---

## 📈 TABLEAU RÉCAPITULATIF DES VERSIONS

| Version | Date de Déploiement | Thématique Majeure | Modules Impactés | Auteur / Réf | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1.0** | Décembre 2025 | Fondations de la Plateforme & Équipe Diallo | Chat, Experts, Auth | Équipe Fondatrice | Archivé |
| **v2.0** | Janvier 2026 | Hub Social, Live Streams & Campus v1 | Social, Campus, Wallet | Core Team | Archivé |
| **v3.0** | Février 2026 | Diallo OS, Conseil Collégial & Multi-Agents | Experts, Council, Orchestrator | Core Team | Archivé |
| **v4.0** | Mai 2026 | Intégration Google Workspace & Multimodal HUD | Maps, Drive, Meet, Chat, Vision | Core Team | Archivé |
| **v5.0** | Juillet 2026 | Marché Mondial B2B/B2C & Business OS | Shop, Trade OS, RFQ, Salons | Core Team | Archivé |
| **v5.14** | 27 Août 2026 | Accessibilité Universelle & Actionable AI | Guide-moi, Scanner OCR, Traduction bilingue, Fiches savoir | AI Coding Agent | Archivé |
| **v6.0** | 27 Août 2026 | **Jalon Officiel — PREMIUM EXPERIENCE V1** | Design System V1 (26 chapitres), Manifeste, Golden Screens, Handoff | AI Coding Agent | Stable |
| **v6.1** | 27 Août 2026 | **Socle Cloud Supabase Lazy-Init & Persistance Résiliente** | Auth, Supabase Client, Local-First, Zero White Screen | AI Coding Agent | Stable |
| **v6.2** | 27 Août 2026 | **Architecture IA Auto-Résiliente (12 Fournisseurs) & Color Lab** | Super-Admin AI Hub, Failover, Auto-Quarantine, Color Lab | AI Coding Agent | Stable |
| **v6.3** | 27 Août 2026 | **Sauvegarde, Versioning & Restauration Intelligente + Realtime RBAC** | Super-Admin Versioning, Snapshots, Smart Restore, Realtime | AI Coding Agent | Stable |
| **v6.6.2** | 1er Septembre 2026 | **Hotfix Messagerie — Frontière UUID Supabase** | Mooc Chat, historique, Realtime | Codex | **Stable** |
| **v6.6.3** | 1er Septembre 2026 | **Traduction centralisée — Messagerie texte** | Messagerie, Profil, AI Gateway | Vision Smart AI Core / DEC-2026-033 | **Stable** |
| **v6.7.0** | 1er Septembre 2026 | **« Ma langue » harmonisée — texte, vocaux transcrits, interprète d'appel audio/vidéo** | Messagerie, Appels, AI Gateway | PR #42, #43 / DEC-2026-034 | **Stable** |
| **v6.8.0** | 1er Septembre 2026 | **Sonnerie hors application (Web Push serveur), arrêt net multi-appareils, pré-connexion, transcription serveur, identité du propriétaire, module messagerie installable, goutte** | Appels, Messagerie, Edge `push-notify`, Service worker, PWA | PR #44, #45 / DEC-2026-035 | **Stable** |
| **v6.9.0** | 2 Septembre 2026 | **Audio d'appel réellement bidirectionnel — validé sur deux téléphones ; SDK LiveKit épinglé 2.17.3** | Appels, Edge `livekit-token`, `call_diagnostics`, LIVE (LOOP 15/16 fermée) | PR #46 → #53 / DEC-2026-036 | **Stable** |
| **v6.10.0** | 3 Septembre 2026 | **Voix traduite DANS l'appel (piste « interprète »), appel normal par défaut, langue choisie par appel** | Appels, Transport LiveKit, AI Gateway v24 | PR #54, #55 / DEC-2026-037 | **Stable** |
| **v6.11.0** | 3 Septembre 2026 | **Connexion quasi immédiate, traduction dès les premiers mots (identité par onglet, préchauffe AI Gateway v25, case de langue)** | Appels, AI Gateway | PR #56 / DEC-2026-038 | **Stable** |
| **v6.12.0** | 3 Septembre 2026 | **Sonnerie et notification fiables appli fermée, bouton « Sonnerie », appel entrant au premier plan** | Service worker v6.6.0, Push, Messagerie, Appels | PR #57 / DEC-2026-039 | **Stable** |
| **v6.12.1** | 3 Septembre 2026 | **Sécurité base : vue `ai_spend_by_provider` en `security_invoker`, `ai_provider_credentials` retirée des rôles clients (pilote consommateur Vision Smart AI Core, TASK-0014)** | Supabase (orchestrateur IA), Gouvernance AI Core | Migration 20260903094327 / DEC-2026-041 | **Stable** |
| **v6.13.0** | 3 Septembre 2026 | **Menu « Miroir d'eau » (proposition 06 retenue par la Direction) — habillage verre/eau scopé, nappe d'eau animée avec onde à l'appui, Architecte en goutte au centre du dock** | Navigation globale, Accueil réseau social, Goutte messagerie | DS-M2a `61ca0fd` + DS-M2b `d54c7ec` / DEC-2026-042 | **Stable — en production (PR #60 → `0ad30ee`), validée par la Direction sur moknet.net le 4/09** |
| **v6.14.0** | 3 Septembre 2026 | **Studio Live à l'image de la seconde référence — abysse, colonne d'eau liquide, verre cyan, vidéo dans le verre, « ● EN DIRECT » honnête ; un agent IA peut enfin être retiré de la scène** | Studio Live, Barre d'actions du Live, Transport LiveKit (badge) | DS-L0 `2a57c92`+`72406a2` + DS-L1 `b118541` / DEC-2026-043 | **Stable — en production (PR #60 → `0ad30ee`), validée par la Direction sur moknet.net le 4/09** |
| **v6.14.1** | 4 Septembre 2026 | **Correctif : les menus de l'en-tête (langue, Notifications, Compte/déconnexion) redeviennent atteignables sur ordinateur — la règle d'habillage volait leur `z-index` aux en-têtes ; garde-fou par `Element.matches`** | Navigation globale (en-têtes), Design System | PR #64 → `56c596a` / DEC-2026-049 | **Stable** — remplacée en production par v6.15.0 le 4 septembre 2026 |
| **v6.15.0** | 4 Septembre 2026 | **La saturation d'un direct, de bout en bout : audit mesuré (SAT-0), plafond RÉELLEMENT posé à la création de la room d'après la machine réelle (SAT-1), porte de refus côté serveur (SAT-2), écran « Ce direct est complet » au lieu d'un « Connexion… » sans fin (SAT-3)** | Live / Directs, Fonction Edge `livekit-token`, Déploiement VPS LiveKit | PR #69 fusionnée → `8902cef` / DEC-2026-050 | **Stable** — remplacée comme version courante par v6.16.0 le 4 septembre 2026, mais son plan d'activation reste en cours. Code client en production sur `moknet.net` depuis le 4 septembre 2026 (bundle `index-DEDPIJvb.js`, étape 1 du plan d'activation). **Étape 2 faite le 4 septembre à 22h37 UTC : la fonction Edge `livekit-token` est passée en version 7** (fenêtre calme vérifiée, retour arrière octet-exact préparé, sonde avant/après sur 4 chemins → codes, jetons et message de refus identiques ; garde vérifié 7× par cas sur la fonction en ligne). **Mais SAT reste INERTE, et c'est prouvé et non déduit** : la même room sondée 8 fois voit son temps DESCENDRE (1 986 → 1 023 ms) au lieu de monter, donc aucune room n'est créée et aucun plafond n'est posé ; `prometheus_port` n'est toujours pas sur le VPS (`/metrics` = 404), `LIVE_NODE_METRICS_URL` n'existe pas, la porte ne refuse personne, zéro 409 émis. L'écran « Ce direct est complet » est dans le bundle et ne peut pas s'afficher. Étapes 3 à 5 en attente (`deploy/livekit/README.md` § SAT-1b). Reste à la charge de la Direction : un appel réel entre deux téléphones |
| **v6.16.0** | 4 Septembre 2026 | **Nettoyage de l’accueil : six déclencheurs retirés de l’affichage (badge « v5.12 », pilule « Services », « Lier Google Workspace », compteur de crédits, « Services Transversaux · Google », carte « Conseiller Référent ») sans supprimer aucune fonction ; le hub transversal gagne un rang dans le menu Compte** | Navigation globale (en-têtes, barre latérale), Accueil / Tableau de bord | PR #73 (`c562ea5`) / DEC-2026-051 | **Stable — validée par la Direction le 4 septembre 2026, fusionnée dans `main` (PR #73), vérifiée sur moknet.net** |
| **v6.17.0** | 4 Septembre 2026 | **Nettoyage de la barre latérale : bouton « L’Architecte », bloc « Mes Favoris » et bloc « Récents » retirés de l’affichage (les étoiles de favori restent sur chaque entrée), libellé « Accueil & Cap » et entrée Super-Admin retirés de la liste (« Accueil » → « Conseil des Sages », capture de la Direction) — menu non répétitif, l’Architecte reste joignable par sa pastille flottante et le dock ; couche CSS « Miroir d’eau » régénérée** | Navigation globale (barre latérale), index.html (couche aqua) | PR #74 / DEC-2026-052 | **Stable — validée par la Direction le 4 septembre 2026 sur capture de référence, fusionnée dans `main` (PR #74), vérifiée sur moknet.net** |
| **v6.18.0** | 5 Septembre 2026 | **« Réseau MOC » juste sous « Accueil » dans la barre latérale ; contours de toutes les zones de saisie renforcés par une règle globale (2 px, couleur dérivée du texte à 55 %, accent aqua au focus) ; nouvelle invite du composeur « Quoi de neuf ? Partage une réflexion, une opportunité, un tutoriel ou un document. »** | Navigation globale (barre latérale), Réseau MOC, index.html | PR de la branche `claude/cleanup-home-interface-szp8qv` / DEC-2026-053 | **Stable — production contrôlée demandée par la Direction, fusionnée dans `main`, vérifiée sur moknet.net** |
| **v6.19.0** | 5 Septembre 2026 | **SAT-4 — la Santé Globale dit si un direct peut VRAIMENT démarrer : `ListRooms` signé avec la clé du coffre, jamais un ping ; 401/403 = rouge, > 1 500 ms = orange (porte SAT-2 aveugle), non sondé = blanc ; artefact de déploiement généré au lieu d'assemblé à la main** | Santé Globale (Super-Admin), Edge `health-guardian` v2, Live / Directs | branche `claude/lives-directs` (`81bb818`, `89b15ee`, `febddbc`, `71d0920`), PR #77 fusionnée en squash → `cbdab0a` / DEC-2026-054 | **Courante (Active) — Edge en production et démontrée (5/09, 00h10 UTC : vert, 400 ms, preuve réelle) ; code client en production contrôlée depuis le 5/09 (Green Gate run 33933766630, moknet.net sert `index-SB3nxKwK.js` avec les empreintes SAT-4, ancien bundle 404)** |
| **v6.20.0** | 5 Septembre 2026 | **SAT-5 — récupération automatique d'un direct : relance bornée de la ligne, gardée par l'état réel en base (jamais sur un refus nommé, jamais après une éviction, trois fois au plus) ; clôture horaire des directs zombies par `pg_cron`, tracée dans `audit_logs`** | Live / Directs, Hook `useLiveTransport`, Base (`close_zombie_live_sessions`, cron) | branche `claude/lives-directs-sat5` (`9cb626b`) / DEC-2026-055 | **PARTIEL — code prouvé (tsc 0 · vitest 1042/1042 · 7 contre-épreuves) ; PR en brouillon ; migration cron NON appliquée ; rien de tout cela n'est en production** |

---

## 🔍 DÉTAIL DES DERNIÈRES VERSIONS MAJEURES

> **Numérotation** : à partir de la v6.7.0, chaque mission livrée en production porte une version sémantique `MAJEUR.MINEUR.CORRECTIF` (ADR-0016 Vision Smart AI Core) — une capacité rétrocompatible = MINEUR, une correction seule = CORRECTIF. Les versions v6.7.0 à v6.12.0 ont été consignées le 3 septembre 2026 pour rattraper les fusions du 1er au 3 septembre restées sans entrée (décision DEC-2026-040) ; leurs preuves sont celles des PR citées et de `docs/APPELS_AUDIO_VALIDATION_APPAREILS.md`.

### [Version 6.20.0] — 5 Septembre 2026 (SAT-5 — ce que l'application peut réparer seule, et ce qui exige le VPS)

* **La demande** : après SAT-4 (savoir qu'un direct est bloqué), SAT-5 —
  « récupération automatique : ce que l'application peut faire seule, et ce
  qui exige le VPS ». Tri de la Direction du 5 septembre : seuls les
  éléments finis partent en production ; SAT-5 continue séparément.
* **Ce que l'application fait seule, désormais (code)** :
  1. **La ligne d'un direct qui tombe se rétablit seule**, comme celle d'un
     appel depuis AU-1 (700 ms · 1,4 s · 2,8 s, trois relances au plus) —
     mais uniquement si l'écran fournit une garde `autoRecover` ET que cette
     garde relit **en base** que le direct est encore ouvert. Un direct
     clôturé par l'animateur répond « non » et l'écran dit « Ce direct est
     terminé. » ; un refus nommé du serveur (direct complet, SAT-3) ne
     relance jamais ; une éviction par identité dupliquée non plus ; une
     seule lecture en base à la fois ; la garde d'une tentative annulée ne
     parle plus. **Une base injoignable LÈVE** : le doute n'est pas une
     clôture. C'est pour cela que `SocialLive` appelle la nouvelle
     `isLiveSessionStillOpen()` et non `fetchLiveSession()`, qui répond
     `null` sur une erreur de lecture et aurait transformé une coupure réseau
     en faux « terminé ».
  2. **Les directs zombies se ferment seuls** (migration
     `20260905010000_live_sat5_close_zombie_sessions_cron.sql`) : la règle
     exacte de `health_remediation_spec('live.close_zombie_sessions')`
     (`ended_at` vide, démarré depuis plus de 24 h), jouée toutes les heures
     par `pg_cron` (`close-zombie-live-sessions`, minute 15) et tracée dans
     `audit_logs` (`health.auto_repair`, acteur vide, ids fermés) — seulement
     quand elle a changé quelque chose. Fonction réservée à `postgres` et
     `service_role`.
* **Ce que l'application ne peut PAS faire seule (frontière VPS, documentée
  dans `docs/LIVE_SATURATION_AUDIT.md` § 4)** : redémarrer le conteneur
  LiveKit, refaire tourner une clé du coffre qui a divergé, rouvrir un port
  UDP, monter le serveur de 1.8.4 à 1.13.6. SAT-4 les DÉTECTE (rouge), rien
  ne les répare sans SSH : c'est le périmètre du bouton de secours SAT-6 et
  des étapes ACT du plan d'activation, jamais d'une boucle client.
* **Preuves** : tsc 0 · vitest 1042/1042 (74 fichiers, +9 tests du hook sur
  un double de transport rejouant les événements réels du SDK) · build ·
  **7 contre-épreuves** (refus nommé, garde → false, LIVE sans garde, garde
  en vol unique, garde qui lève, tentative annulée, éviction) : chacune fait
  rougir exactement un test ; la seule ligne qu'aucune ne pouvait faire
  rougir (revérifier le budget après la garde) a été retirée. Migration
  jouée **à vide dans une transaction annulée** sur la base réelle : 13
  directs fermés, 0 au second passage (idempotence), 4 directs récents
  intacts, 1 ligne d'audit (`changedCount` 13), droits `postgres`/
  `service_role` seuls — puis rollback vérifié (13 toujours ouverts, audit
  vide, ni fonction ni job).
* **Pas en production, dit tel quel** : PR en brouillon sur
  `claude/lives-directs-sat5` ; migration NON appliquée (l'appliquer est un
  déploiement : il attend la liste de tri). Aucune preuve navigateur d'une
  relance réelle contre un LiveKit vivant — la preuve est au niveau du hook,
  comme pour AU-6.

---

### [Version 6.19.0] — 5 Septembre 2026 (SAT-4 — savoir si un direct peut démarrer, pas si le serveur répond)

* **La demande** : ne pas présenter SAT-4 comme terminé tant que le
  branchement réel n'est pas livré ; preuves, tests, zéro régression ; à
  chaque étape, ce qui est en production, ce qui ne l'est pas, ce qui reste
  partiel.
* **Ce qui change** : la ligne `live.transport_utilisable` du tableau de bord
  de santé n'interroge plus `GET /` (qui répond 200 même quand rien ne passe)
  mais `POST /twirp/livekit.RoomService/ListRooms`, signé avec la clé du
  coffre — l'appel dont dépend réellement l'ouverture d'un direct. Vert si
  200 + liste exploitable en ≤ 1 500 ms ; orange au-delà (la porte SAT-2 ne
  compte plus) ; rouge sur 401/403 (le serveur vit et refuse nos
  identifiants), 5xx, corps illisible, délai ou réseau ; blanc si rien n'est
  configuré ou si la sonde n'a pas tourné.
* **Où c'est** : règle pure `supabase/functions/health-guardian/liveTransportProbe.ts`
  (zéro réseau), évaluateur dans `evaluate.ts`, sonde confinée à `index.ts`
  (`observeLiveTransport`, ne lève jamais), ligne de registre
  `services/health/healthRegistry.ts` (poids LIVE 34/28/22/16 = 100).
  Artefact déployé désormais **généré** par `build-bundle.sh`.
* **En production** : fonction Edge `health-guardian` **v2** (déployée,
  amorçage prouvé, puis **démontrée** avec une vraie session administrateur :
  HTTP 200 en 2,17 s, 41 lignes, `live.transport_utilisable` vert / réel /
  400 ms / 0 direct, `seuilDegradeMs 1500`).
* **En production aussi, depuis le 5 septembre 2026** : le code client
  (ligne de registre) — PR #77 fusionnée en squash (`cbdab0a`) après un
  Green Gate vert sur l'arbre fusionné avec `main` (run 33933766630) ;
  moknet.net sert `index-SB3nxKwK.js`, où les empreintes « Un direct peut
  réellement démarrer », `live.transport_utilisable` et « refuse nos
  identifiants » sont présentes, l'ancien bundle répondant 404.
* **Partiel** : pas de contre-épreuve en production (les contre-épreuves sont
  dans les tests, au niveau de la règle) ; SAT-5/6/7 non commencés ;
  ACT-3/4/5 toujours bloqués sur l'accès SSH au VPS.
* **Preuves** : tsc 0 · vitest 1006/1006 (71 fichiers) · build · 28 tests SAT-4
  dont 2 contre-épreuves · source de production relue = 10/10 empreintes ·
  zéro trace du compte éphémère (balayage = 0). DEC-2026-054.

---

### [Version 6.18.0] — 5 Septembre 2026 (« Réseau MOC » sous « Accueil », contours des zones de saisie, invite du composeur)

* **La demande** : trois consignes de la Direction, en production contrôlée,
  zéro régression, preuve visuelle à la fin.
* **Ce qui change** : dans la barre latérale d'ordinateur, « Réseau MOC »
  vient juste sous « Accueil » (l'onglet par défaut reste le réseau social,
  le tiroir mobile et ⌘K ne bougent pas) ; toutes les zones de texte ont un
  contour de 2 px dont la couleur dérive de celle du texte (55 %), et un accent
  aqua au focus — une règle globale d'`index.html`, hors couche aqua
  générée, avec deux classes de sortie ; le composeur invite avec « Quoi de
  neuf ? Partage une réflexion, une opportunité, un tutoriel ou un
  document. » au lieu d'un prénom codé en dur.
* **Preuves** : `tsc --noEmit` 0 · `vitest` 993/993 (72 fichiers, +6 :
  `tests/saisieContours.test.ts`) · `npm run build` propre · captures
  avant/après avec bordure mesurée en navigateur réel (barre latérale,
  composeur, connexion) jointes à la PR.
* **Statut** : production contrôlée demandée par la Direction — fusion,
  déploiement Netlify, contrôle post-déploiement (DEC-2026-053).

---

### [Version 6.17.0] — 4 Septembre 2026 (Nettoyage de la barre latérale — « un menu propre, simple, non répétitif »)

* **La demande** : capture de la barre latérale, consigne de retirer du menu
  visible le bouton « L’Architecte », le bloc « Mes Favoris » et son contenu,
  et « Récents » — sans toucher au Live, à la sécurité, à l’authentification
  ni aux fonctions qui marchent.
* **Ce qui disparaît de l’écran** : les trois blocs en tête de barre
  latérale, le libellé « Accueil & Cap » au-dessus d’« Accueil » et l’entrée
  « Tableau de Bord Super-Admin » après « Conseil des Sages » (capture de
  référence de la Direction : premier bouton Accueil, dernier bouton Conseil
  des Sages). Les étoiles de favori restent sur les entrées épinglées.
* **Ce qui ne disparaît pas** : l’Architecte (pastille flottante bas-droite
  sur ordinateur et téléphone, goutte centrale du dock mobile), toutes les
  entrées des piliers de vie — désormais une seule fois chacune —, le pied
  de barre latérale (messagerie, compte), le tiroir mobile (inchangé).
* **Généré, pas écrit à la main** : `scripts/genMiroirAquaLayer.cjs
  --ecrire` a retiré de `index.html` les 4 règles de dégradé qui ne
  servaient qu’au bouton retiré ; le garde-fou `tests/miroirAquaLayer.test.ts`
  l’exigeait.
* **Preuves** : `tsc --noEmit` 0 · `vitest` 987/987 (71 fichiers, +9 :
  `tests/sidebarCleanup.test.tsx`) · `npm run build` propre · captures
  avant/après ordinateur (1600×900) et téléphone (390×844) jointes à la PR.
* **Statut** : validée par la Direction le 4 septembre 2026 sur sa capture
  de référence, fusionnée dans `main` (PR #74), production contrôlée sur
  moknet.net avec contrôle post-déploiement (DEC-2026-052).

---

### [Version 6.16.0] — 4 Septembre 2026 (Nettoyage de l’accueil — « l’interface est trop chargée »)

* **La demande** : cinq captures de la Direction, une consigne — retirer ces
  boutons de l’affichage à l’accueil (barre du haut, barre latérale), sans
  supprimer les fonctions dans le système.
* **Ce qui disparaît de l’écran** : en-tête ordinateur — badge « v5.12 »
  (faux : v6.14.1 en production), pilule « Services », bannière « Lier
  Google Workspace », compteur « 1 000 000 Ⓒ » ; en-tête téléphone — le même
  compteur ; pied de barre latérale — « Services Transversaux · Google » ;
  tableau de bord — carte « Conseiller Référent · Conseiller Diallo ».
* **Ce qui ne disparaît pas** : la modale du hub transversal (Maps, Drive,
  Meet, Chat, Coffre-fort) s’ouvre désormais depuis un rang du menu Compte
  sur ordinateur, comme depuis le tiroir mobile et la recherche ⌘K ; la
  liaison Google Workspace reste dans les centres Drive, Chat et Meet ; le
  solde reste dans « Finance & Wallet » ; la trajectoire Point A → Point B
  reste, sans sa carte de conseiller.
* **Preuves** : `tsc --noEmit` 0 · `vitest` 935/935 (68 fichiers, +11 :
  `tests/homeChromeCleanup.test.tsx`) · `npm run build` propre · captures
  avant/après ordinateur (1600×900) et téléphone (390×844) jointes à la PR.
* **Statut** : **validée par la Direction le 4 septembre 2026** (« Je valide
  ta proposition, mais exécution contrôlée uniquement. Rien ne doit
  régresser. ») après contrôle de l’aperçu de déploiement et des captures ;
  fusionnée dans `main` via la PR #73 (fusion écrasée, convention du dépôt),
  déploiement automatique Netlify sur moknet.net ; contrôle post-déploiement
  consigné dans la PR (DEC-2026-051).

---

### [Version 6.15.0] — 4 Septembre 2026 (Saturation des directs — mission SAT, boucles 0 à 3)

* **Le problème réel** : la porte (SAT-2) et l'écran (SAT-3) étaient corrects
  et prouvés au banc, et pourtant **sans effet**. Cause racine : rien
  n'appelait jamais `createRoom`, donc chaque room naissait avec
  `maxParticipants = 0` — la convention LiveKit pour « aucune limite ». Un
  garde-fou complet qui ne pouvait refuser personne.
* **SAT-1 — ce qui change** : `poseRoomCeiling()` pose le plafond **à la
  création** de la room (mesuré : aucune méthode du SDK ne le corrige
  ensuite, et une room vide disparaît par `empty_timeout`, donc le plafond
  est re-posé à chaque renaissance). Le chiffre suit **deux lectures
  vivantes** — cœurs du nœud (`go_sched_gomaxprocs_threads`) et occupation
  réelle (`listRooms()`) — appliquées à une référence **mesurée au banc** :
  0,00767 cœur par spectateur en audio dans la topologie d'un direct, soit
  130 places par cœur, dont la moitié seulement est engagée.
* **Refus de deviner** : toute incertitude (pas d'URL de métriques,
  `/metrics` en 404, machine inconnue, création refusée) ne pose **aucun**
  plafond — le direct se comporte comme avant. Plancher à **1**, jamais 0.
* **Preuves** : `tsc --noEmit` 0 · `vitest` 924/924 (67 fichiers, +27) ·
  `npm run build` propre · banc réel **21 OK / 0 DÉFAUT** contre les deux
  binaires (`livekit-server` **1.8.4**, la version exacte du VPS, et
  **1.13.6**, la cible) · **8 contre-épreuves / 8 conformes**, dont une
  garde trouvée **complaisante** et corrigée (le lecteur de métriques
  n'était éprouvé que sur un nom suffixé, jamais préfixé) · aucune écriture
  en base, aucun compte de test.
* **Ce qui n'est PAS actif** : `prometheus_port` n'est pas configuré sur le
  VPS (`/metrics` y répond 404), donc **aucun plafond n'est posé en
  production aujourd'hui** — c'est SAT-1b, une action SSH documentée dans
  `deploy/livekit/README.md`. La fonction Edge `livekit-token` n'est **pas
  déployée** avec ces changements.
* **Correctif d'hygiène du même lot** : un test de la mission SN
  (`callRingingFlow`, lancement à froid par notification) affirmait le
  démarrage de la sonnerie de façon synchrone alors qu'il est déclenché par
  un effet dérivé, un tour de boucle plus tard — vert presque toujours,
  rouge sous charge CPU. Passé en attente réelle ; contre-épreuve faite
  (sonnerie neutralisée → 4 tests rouges, fichier restauré à l'empreinte
  identique).

---

### [Version 6.14.0] — 3 Septembre 2026 (Studio Live à l'image de la seconde référence — mission DS, loupe LIVE)
- **Objectif** : appliquer au Studio Live la seconde image de référence fournie par la Direction (abysse turquoise, ruban de lumière liquide séparant scène et panneau, cartes de verre cyan, vidéo **dans** le verre avec pastille d'avatar et onde de voix, plaque de nom en capitales, orbes cyan, « ● EN DIRECT » à point vert, bulles montant à l'intérieur des cartes) — sans toucher à la matière déjà validée ailleurs.
- **Réalisations** :
  - **DS-L0** (`2a57c92`, `72406a2`) : jusqu'à six cartes sur la scène, humains et agents IA confondus dans la même grille ; commandes de scène atteignables sur téléphone.
  - **DS-L1** (`b118541`) : variables `--live-*` et classes `.live-*` **scopées sous `[data-live-universe]`** (jamais sur `:root` — `--water-accent` y est consommé par la goutte de la messagerie déjà validée) ; `.live-abyss` remplace les aplats `bg-slate-950` des quatre grilles ; `.live-current` (deux nappes qui dérivent derrière un flou, variante horizontale sur téléphone) ; `.live-pane`/`--agent`, `.live-orb`/`--active`/`--danger`, `.live-onair`, `.live-title`, `.live-wave`, `.live-nameplate`, `.live-bubbles` ; nouveau `components/live/LiveMatter.tsx` (bulles déterministes, onde de voix branchée sur le **vrai** niveau audio) ; `liveBadge()` expose `isOnAir` — « EN DIRECT » ne s'affiche que quand le direct passe vraiment.
  - **Capacité manquante corrigée** : un agent IA ne pouvait **jamais** être retiré de la scène (`aiAgent` retombait sans condition sur `AGENTS[0]`, `stageAgents` le ré-injectait à chaque rendu), contre la règle « inviter, retirer, gérer humain et agent ». Découvert en essayant de produire la scène à une seule carte pour les preuves.
- **Preuves** : `tsc` 0 · **vitest 800/800** (59 fichiers, +10 — le garde-fou vérifie que toute classe `.live-*` employée et toute variable `--live-*` référencée existent réellement ; il a échoué à sa première exécution, preuve qu'il n'est pas complaisant) · `npm run build` propre · **banc navigateur réel 8/8 sans défaut** (le vrai `SocialLive`, ordinateur 1440×900 + téléphone 390×844, scènes à 1/2/4/6 cartes dont un agent IA invité, vraie vidéo de canevas : abysse `#0a2430`, accent `#7fd9e6`, rayon 20 px, courant `blur(14px)`, 12 orbes, 6 plaques de nom, 0 erreur de page) · aucun compte ni écriture en base.
- **Statut** : **design validé par la Direction le 03/09/2026** sur les captures d'ordinateur et de téléphone ; aperçu de déploiement vérifié. **Pas encore sur `moknet.net`** — PR #60 en attente.
- **Restes assumés** : le cœur rose des réactions n'est pas ramené sur la palette cyan ; trois écrans satellites (`LiveCreationModal`, `LiveReplayModal`, `MultimodalCameraHUD`) gardent leur dégradé bleu→indigo. Détail : `docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md` § 8.

### [Version 6.13.0] — 3 Septembre 2026 (Menu « Miroir d'eau » — mission DS, loupe MENU)
- **Objectif** : porter en production la proposition 06 retenue par la Direction parmi les six traitements du menu construits dans le laboratoire isolé `design-lab/`.
- **Réalisations** : invariants structurels (`61ca0fd` — réseau social en écran d'accueil, Architecte au centre de la navigation et non plus un second flottant, « Équipe & Experts » au premier niveau) puis habillage verre/eau (`d54c7ec` — tokens `--mir-*` et classes `.mir-*` scopés sous `[data-miroir]`, nappe d'eau animée `WaterMirror` avec onde réelle à l'appui, dock en pilule de verre soufflé, Architecte en goutte, feuille de lecture à 94 % pour le texte).
- **Preuves** : `tsc` 0 · vitest 777/777 · build propre · banc navigateur réel 76 OK / 0 défaut (CSS effectivement servi par `dist/`, relu par `getComputedStyle`) · aucune écriture en base.
- **Statut** : **appréciation visuelle de la Direction toujours en attente** sur la moitié menu. Deux arbitrages ouverts : la ligne d'état « Réseau · en éveil » n'est portée que par l'en-tête mobile ; la barre latérale desktop conserve `palette-10` (gelée). Détail : `docs/DIRECTION_ARTISTIQUE_MENU_MIROIR_EAU.md`.

### [Version 6.12.1] — 3 Septembre 2026 (Sécurité base — pilote consommateur Vision Smart AI Core, TASK-0014)
- **Objectif** : fermer le finding CRITIQUE relevé par le Registre d'applications d'AI Core (advisors Supabase : vue `SECURITY DEFINER` contournant la RLS, table de credentials exposée aux rôles clients) sans supprimer de capacité ni toucher au code client.
- **Réalisations** : migration `security_task0014_view_invoker_credentials_revoke` — `security_invoker = true` sur la vue `ai_spend_by_provider`, droits `anon` retirés, `authenticated` limité à `SELECT` (RLS admin-only de `ai_call_log` appliquée), droits `anon`/`authenticated` retirés de `ai_provider_credentials` (RLS et `service_role` intacts). La vue n'est référencée nulle part dans le code client : aucune régression possible côté application.
- **Validation** : impersonation avant/après — `anon` 37 lignes → « permission denied » ; non-admin 37 → 0 ; admin 37 → 37 · advisors 218 → 214 lints, ERROR 1 → 0 · production sondée après migration : `/`, `/manifest.webmanifest`, `/sw.js`, `/messagerie` HTTP 200, bundle `index-Drrg-NBT.js` inchangé.
- **Limite honnête** : la protection contre les mots de passe compromis (Auth) reste à activer dans le tableau de bord Supabase (action propriétaire) ; 208 avertissements génériques subsistent (exposition GraphQL des tables, fonctions `SECURITY DEFINER` admin gardées par `is_admin()`).

---

### [Version 6.12.0] — 3 Septembre 2026 (Sonnerie et notification fiables appli fermée, bouton « Sonnerie », appel entrant au premier plan — mission SN)
- **Objectif** : qu'un appel arrive vraiment quand l'application est fermée ou le téléphone verrouillé (sonnerie, vibration, notification visible), et que l'écran pour décrocher s'impose dès qu'un appel entre.
- **Cause racine prouvée** : `/metadata.json` répond 404 sur Netlify ; l'ancien service worker le pré-cachait à l'installation → installation en échec → aucun worker jamais actif → « Subscription failed - no active Service Worker » ; `push_subscriptions` = 0 en base depuis l'origine.
- **Réalisations** : `public/sw.js` v6.6.0 (installation jamais fatale, réglages de sonnerie lus depuis la Cache API, notification silencieuse ou sans vibration selon les réglages) ; attente du worker actif avant abonnement ; bouton « Sonnerie » après « Annuaire » et panneau `RingingPanel` branché aux réglages existants ; toucher la notification ouvre l'écran d'appel qui sonne (fenêtre existante et lancement à froid), Décrocher 72×72 px, écran au-dessus de toutes les boîtes.
- **Validation** : tsc 0 · vitest 763/763 · build · banc 21/21 · production « avant » (défaut reproduit sur les vrais fichiers servis) puis « après » 43/43 (worker actif sur miroir octet-exact, push réel → notification → écran d'appel, desktop + mobile) · zéro trace (74 clés étrangères balayées = 0).
- **Limite honnête** : la sonnerie sur un vrai téléphone verrouillé se constate par l'utilisateur (aucun service de push dans le bac à sable).

---

### [Version 6.11.0] — 3 Septembre 2026 (Connexion quasi immédiate, traduction dès les premiers mots — mission LT)
- **Objectif** : après le test utilisateur (établissement ~30 s, traduction 20–30 s plus tard), rendre la connexion quasi immédiate et la traduction active dès les premiers mots.
- **Causes mesurées sur 7 appels réels iPhone ↔ Android** : identité LiveKit dupliquée entre deux onglets → éviction en boucle ; lecture audio bloquée faute de geste ; 0,8 s perdu par sonde ; transcripteur redémarré à chaque changement de langue, segments jusqu'à 9 s, piste interprète publiée seulement à la première phrase.
- **Réalisations** : identité LiveKit par onglet, aucune relance sur identité dupliquée (raison nommée), son débloqué dans le geste de décroché ; transcripteur jamais redémarré, segments 550 ms / 6,5 s avec clôture anticipée, piste interprète publiée dès le « hello », passerelle `ai-gateway` v25 préchauffée pendant la sonnerie, phrases en attente fusionnées, case de langue bien visible (« Appel normal » / « Traduction active »).
- **Validation** : banc réel 82/82 (piste publiée 473 ms après le décroché, première voix traduite 7–13 s) · tsc 0 · vitest 737/737 · build · production 24/24 · zéro trace.

---

### [Version 6.10.0] — 3 Septembre 2026 (Voix traduite DANS l'appel, appel normal par défaut, langue par appel — mission VT‑1/VT‑1b)
- **Objectif** : la traduction voix à voix doit être entendue sur de vrais téléphones, pas seulement lue.
- **Constat** : VT‑1 (original coupé quand l'interprète parle, lecture locale) refusé au test utilisateur — la voix HD était générée mais jamais entendue (lecture locale non fiable sur téléphone).
- **Réalisations** : la voix traduite est rendue par l'émetteur et publiée dans l'appel comme piste LiveKit « interprète » (même chemin WebRTC que la voix) ; le récepteur la joue et coupe l'original par `muted` ; appel normal par défaut, traduction activée seulement par le choix « Entendre X en … » pendant la sonnerie ou l'appel, propre à cet appel ; langue détectée prioritaire ; découpeur corrigé (la parole d'avant la pause « l'interprète parle » n'est plus jetée) ; passerelle v24 (lecture dans la bonne langue).
- **Validation** : banc réel 62/62 (son reçu transcrit en français chez l'un, en russe chez l'autre, audio et vidéo) · vitest 730/730 · tsc 0 · build · production 20/20 · zéro trace.

---

### [Version 6.9.0] — 2 Septembre 2026 (Audio d'appel réellement bidirectionnel, validé sur deux téléphones — mission AU)
- **Objectif** : « corrigez le bug d'audio unidirectionnel ».
- **Causes prouvées** : même identité LiveKit pour deux appareils d'un compte (éviction), micro refusé sans message, caméra en échec bloquant le micro, signal d'acceptation perdu = son à sens unique ; puis, contre le binaire `livekit-server` 1.8.4 exact : `livekit-client` ≥ 2.18 = négociation en échec (aucun octet envoyé), 2.17.3 = OK.
- **Réalisations** : identité par appareil (`livekit-token` v4→v5), micro publié avant la caméra, relance bornée, bannière « Réessayer le micro », correspondant = celui qui publie, décroché par média, diagnostics sur compteurs WebRTC réels (`call_diagnostics`), revue contradictoire (caméra jamais rallumée à l'insu de l'utilisateur, appel orphelin terminé), une room par appel, audio préparé au premier geste, SDK épinglé 2.17.3 avec test garde-fou.
- **Validation** : utilisateur sur deux téléphones le 2 septembre 2026 — « l'appel passe correctement et les deux personnes parlent et s'entendent » ; cette même preuve ferme LOOP 15/16 de la mission LIVE. Reste recommandé, non bloquant : montée du serveur LiveKit du VPS de 1.8.4 à 1.13.6.

---

### [Version 6.8.0] — 1er Septembre 2026 (Sonnerie hors application, arrêt net, pré-connexion, transcription serveur, identité, module installable, goutte — mission VF)
- **Objectif** : lever le refus de validation (sonnerie hors app, sonnerie résiduelle, latence, traduction non appliquée sur téléphone, propriétaire non identifié).
- **Réalisations** : serveur Web Push `push-notify` (RFC 8291/8292, clé VAPID au Vault), abonnement push et service worker côté client ; arrêt net multi-appareils (`call_handled_elsewhere`, canal `moknet-calls`, push d'annulation) ; transport connecté dès la sonnerie ; transcription serveur `gemini_stt` (texte + langue + traduction) ; carte du propriétaire, avatar sur mes bulles, sélecteur « Ma langue » fixe dans l'en-tête ; messagerie exportable en module installable (`/messagerie`, manifeste dédié) ; bouton « goutte » (maquette 01 choisie par l'utilisateur parmi 10).
- **Validation** : tsc 0 · vitest 568/568 · build · banc 16/16 · production 26/26 + 7/7 · zéro trace (97 lignes, 70 clés étrangères = 0).

---

### [Version 6.7.0] — 1er Septembre 2026 (« Ma langue » harmonisée — texte, vocaux, appels — missions UL/HL)
- **Objectif** : un seul réglage de langue par personne, appliqué au texte, aux vocaux et aux appels, sans jamais choisir la langue de l'interlocuteur.
- **Réalisations** : sélecteur unique « Ma langue » avec détection automatique de la langue du destinataire, « Par défaut » = aucune traduction ; vocaux transcrits chez l'auteur et traduits chez le lecteur (« Écouter dans ma langue ») ; interprète d'appel audio et vidéo (sous-titres par canal de données, voix dans ma langue) ; profil audio « parole » et qualité réseau réelle affichée.
- **Validation** : vitest 306/306 · tsc 0 · build · preuves réelles ru → fr · production vérifiée en navigateur · zéro trace.

---

### [Version 6.6.3] — 1er Septembre 2026 (Traduction centralisée — Messagerie texte)
- **Objectif** : traduire automatiquement chaque message reçu dans la langue préférée du lecteur sans jamais remplacer ni supprimer le texte original.
- **Réalisations** : service unique `services/translation/translationService.ts`, moteur injectable et remplaçable, passage exclusif par `services/aiGateway.ts`, persistance de la langue source dans `messages.metadata.original_language`, rendu original + traduction dans `ChatMessageItem.tsx`, dégradation gracieuse et traduction différée aux bulles visibles.
- **Validation** : tests unitaires du contrat, du changement de moteur, du cache/dédoublonnage, du repli et tests DOM de l'affichage bilingue ; suite complète et build de production validés.
- **Périmètre exclu** : aucun développement de traduction vocale ; cette seconde fonctionnalité attend la validation explicite de la phase texte.

---

### [Version 6.6.2] — 1er Septembre 2026 (Hotfix Messagerie — Frontière UUID Supabase)
- **Incident** : l'ouverture d'un fil local `chat-u5` déclenchait un `GET /rest/v1/messages?...conversation_id=eq.chat-u5` rejeté en HTTP 400 / PostgreSQL `22P02`, car `conversation_id` attend un UUID.
- **Correction** : la messagerie conserve le fil local à l'écran mais arrête le chemin avant le chargement d'historique, le marquage de lecture et les abonnements Realtime tant que l'identifiant n'est pas un UUID réel.
- **Preuves** : 2 tests d'intégration dédiés, 256/256 tests globaux, build Vite réussi, prévisualisation Netlify publique `ready`, scan de secrets Netlify vide.
- **Périmètre** : 1 composant, 1 test; aucune migration, aucune donnée et aucun module hors messagerie.

---

### [Version 6.3] — 27 Août 2026 (Sauvegarde, Versioning, Restauration Intelligente & Realtime RBAC)
- **Objectif** : Mettre en place un système complet de sauvegarde, gestion des versions, comparaison et restauration intelligente sans perte de données dans l'espace Super Admin, avec synchronisation Realtime bidirectionnelle et diagnostic automatique des comptes.
- **Réalisations & Livrables** :
  - **Gestionnaire des Versions Stables** : Conservation garantie des 3 dernières versions stables (v6.3.0, v6.2.0, v6.1.0, v6.0.0) avec numéros, dates, changelogs détaillés, checksums et statuts.
  - **Moteur de Restauration Intelligente** : Restauration en 1 clic sans remise à zéro, préservation intégrale des comptes, profils, soldes Ⓒ, rôles et logs d'audit.
  - **Point de Récupération Automatique** : Instantané de sécurité généré immédiatement avant chaque restauration, avec bouton d'annulation (Undo / Rollback) en un clic.
  - **Planificateur Automatisé de Sauvegardes** : Fréquence personnalisable (quotidienne, hebdomadaire, horaire), heure d'exécution, rétention max et élagage automatique.
  - **Outil de Comparaison Différentielle** : Diff side-by-side entre deux versions (évolutions de fonctionnalités, schémas, et capacités IA).
  - **Synchronisation Realtime & Diagnostic des Comptes** : Abonnement en direct à la table `profiles` de Supabase, déduplication et réconciliation automatique (`reconcileAndRepairAllAccounts`).
  - **Compatibilité Universelle** : 100% compatible GitHub, Netlify, Cloud Run et Supabase, sans écran blanc.


### [Version 6.0] — 27 Août 2026 (Jalon Officiel — PREMIUM EXPERIENCE V1)
- **Objectif** : Figer le socle graphique et ergonomique officiel, consacrer les Golden Screens, rédiger le Manifeste et préparer le dossier de consolidation pour Claude Code.
- **Réalisations & Livrables** :
  - **Manifeste de l'Expérience Premium** (`docs/PREMIUM_EXPERIENCE_MANIFEST.md`) : 5 questions fondatrices et 8 principes d'or (*« Simple devant, intelligente derrière. Nous nous adaptons à vous, pas l'inverse »*).
  - **Design System V1 & UI Constitution** (`docs/DESIGN_SYSTEM_V1.md`) : 26 sections complètes (Tokens, Typographie Outfit/Plus Jakarta Sans, Couleurs Navy/Orange, Composants, Accessibilité WCAG AA, Motion, Sécurité).
  - **Glossaire Produit Officiel** (`docs/GLOSSAIRE_PRODUIT.md`) : Règle « Une fonction = Un nom unique », interdiction des termes IA/bots génériques.
  - **Inventaire des Écrans & Matrice de Cohérence** (`docs/INVENTAIRE_ECRANS_ET_MATRICE.md`) : Cartographie des 14 modules et 100% de conformité Premium V1.
  - **Golden Screens & Rapport Avant/Après** (`docs/GOLDEN_SCREENS_ET_AVANT_APRES.md`) : 6 écrans de référence et mesures de réduction de charge cognitive.
  - **Registre des Composants & Changelog UX** (`docs/UX_CHANGELOG.md`).
  - **Registre de la Dette de Design** (`docs/DESIGN_DEBT_REGISTER.md`).
  - **Dossier de Passation & Consolidation Claude Code** (`docs/HANDOFF_CLAUDE_CODE.md`).
  - **Mise à Jour du Livre de Vision** (`docs/LIVRE_DE_VISION.md`).
- **Impact** : Expérience intemporelle, institutionnelle, humaniste et opposable, prête pour l'audit et la montée en charge.

---

### [Version 5.13] — 27 Août 2026 (Réorganisation Navigation 5 Piliers Humains & Hub Transversal)
- **Objectif** : Transformer une navigation technique aplatie en une expérience d'accomplissement humain structurée, intuitive, rapide et accessible.
- **Modifications Réalisées** :
  - **Structure en 5 Piliers de Besoins Humains** :
    1. *Accueil & Cap* (`Accueil`, `Mon Parcours de Vie`)
    2. *Apprendre & Évoluer* (`Campus & Éducation`, `Langues & Immersion`, `Carrière & Accomplissement`)
    3. *Vie & Services* (`Santé & Bien-être`, `Habitat & Installation`, `Finance & Wallet`, `Mes Démarches`, `Droit & Juridique`, `Mobilité & Expatriation`)
    4. *Créer & Entreprendre* (`Studio Créatif`, `Marché Mondial`)
    5. *Communauté & Conseil* (`Réseau MOC`, `Experts Diallo`, `Conseil des Sages`)
  - **Intégration Transversale Google Suite** : Retrait des applications Google isolées au 1er niveau ; création du Hub des Capacités Transversales (`TransversalServicesModal.tsx`) et badges contextuels.
  - **Recherche Universelle & Command Palette (`⌘K`)** : Recherche globale et commande vocale avec reconnaissance automatique d'intentions (`UniversalSearchModal.tsx`).
  - **Orientation par Objectifs (« Mon Cap »)** : Gabarits d'accomplissement avec étapes et assignation d'experts d'élite (`GoalOrientationModal.tsx`).
  - **Système de Favoris & Récents** : Épinglage direct avec persistance locale et mémorisation automatique des 4 derniers espaces consultés.
  - **Dock & Drawer Mobile Optimisés** : Barre d'accès rapide 5 boutons et tiroir accordéon fluide.
- **Impact** : Clarté immédiate pour l'utilisateur, temps d'accès aux modules divisé par deux, zéro régression sur les fonctionnalités existantes.

---

### [Version 5.12] — 27 Août 2026 (Carrière 7/7 : Consolidation Finale & Cycle Perpétuel d'Accomplissement)
- **Objectif** : Transformer les 6 étapes de Carrière en un seul système unifié, vivant, fluide et simple. L'accompagnement ne s'arrête jamais à l'action ou au résultat : il continue jusqu'à l'accomplissement réel, puis transforme ce résultat en un nouveau point de départ.
- **Modifications Réalisées** :
  - **Dossier Maître Unique (`CareerMasterDossier`)** : Unification complète de la mémoire de carrière (Identité, Objectif A➔B, Journal de bord, Permissions, Métriques).
  - **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** : Génération narrative du parcours (`generateCareerNarrative`) et arbitrage universel de la meilleure action (`askUniversalNextAction`).
  - **Centre de Commande Unifié (`CareerMasterCommandHub.tsx`)** : Cockpit central avec bascule instantanée entre le Mode Simple (Action du jour épurée) et le Mode Avancé (7 piliers complets).
  - **10 Modals & Commandes d'Accomplissement** :
    1. *« Raconte-moi mon parcours »* (`CareerNarrativeStoryModal.tsx`) : Récit valorisant et continu avec lecteur audio.
    2. *« Que dois-je faire maintenant ? »* (`CareerWhatShouldIDoModal.tsx`) : 3 meilleurs leviers du jour avec gains attendus et déclenchement direct.
    3. *« J'ai une urgence »* (`CareerEmergencyModal.tsx`) : Diagnostic commando express (entretien dans 1h, dossier ce soir, offre à négocier).
    4. *Mode Célébration & Nouveau Cap* (`CareerAccomplishmentCelebrationModal.tsx`) : Consécration du Point B, capitalisation des preuves et réenclenchement d'un nouveau cycle (90j, Nouvelle ambition, Pivot, International).
    5. *Centre de Contrôle & Permissions IA* (`CareerAgentPermissionsLogsModal.tsx`) : Matrice de souveraineté, suspension immédiate d'urgence et logs d'audit.
    6. *Onboarding Conversationnel Intelligent* (`CareerConversationalOnboardingModal.tsx`) : Cadrage fluide sans formulaire.
    7. *Recherche Universelle Carrière* (`CareerUniversalSearchModal.tsx`) : Indexation globale (dossiers, CVs, contacts, compétences, cours).
    8. *Test de Cohérence du Cap* (`CareerCoherenceAuditModal.tsx`) : Alignement des actions quotidiennes sur le Point B.
    9. *Opportunités Surprises* (`CareerSurpriseOpportunityModal.tsx`) : Décloisonnement sectoriel par compétences transférables.
    10. *Mon Impact & Transmission* (`CareerImpactTransmissionModal.tsx`) : Boucle d'utilité collective (*Apprendre ➔ Progresser ➔ Accomplir ➔ Transmettre*).
- **Impact** : Expérience fluide, zéro dispersion cognitive, souveraineté totale de l'utilisateur sur son agent et accompagnement pérenne tout au long de sa vie professionnelle.

---

## 🔍 DÉTAIL DES DERNIÈRES VERSIONS MAJEURES

### [Version 5.11] — 27 Août 2026 (Carrière 6/7 : Intelligence Stratégique & Trajectoires Prédictives)
- **Objectif** : Ne plus seulement accompagner la carrière actuelle de l'utilisateur : comprendre son évolution, anticiper les changements, détecter les meilleures trajectoires possibles et l'aider à accélérer vers son Point B via la formule `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER`.
- **Modifications Réalisées** :
  - **Hub Central d'Intelligence Stratégique** (`CareerStrategicAdvisorHub.tsx`) : Cockpit en 8 piliers articulé avec alertes d'orientation, calcul du rythme et accès aux modales d'ingénierie.
  - **Boussole Stratégique 4D** (`CareerStrategicCompassModal.tsx`) : 4 cadrans interactifs (Point A, Point B, Marché, Action Immédiate) avec mode d'accélération vs équilibre.
  - **Simulateur de Trajectoires Comparatif & Scénarios « Et si ? »** (`CareerTrajectorySimulatorModal.tsx`) : Comparaison de 5 voies (Verticale, Spécialisation, Management, Entrepreneuriat, Expatriation) et simulation de gains temporels/financiers.
  - **Skill Graph & Cartographie des Écarts** (`CareerSkillGraphGapModal.tsx`) : 6 catégories de compétences avec niveaux de preuve (déclarée à confirmée) et passerelles Campus.
  - **Passeport de Compétences & Mode Reconversion** (`CareerSkillsPassportModal.tsx`) : Détection des compétences transférables vers de nouveaux secteurs sans repartir de zéro.
  - **Plans d'Évolution 90 Jours & 1 An** (`CareerEvolutionPlansModal.tsx`) : Feuilles de route cadencées mois par mois et trimestres T1-T4.
  - **Diagnostic de Plateau & « Débloque ma situation »** (`CareerPlateauUnlockModal.tsx`) : Détection des stagnations et calcul du Levier N°1 d'accélération.
  - **Conseil de Carrière Multi-Experts** (`CareerMultiExpertCouncilModal.tsx`) : Orchestration collégiale des 4 experts de la Famille Diallo avec synthèse unifiée.
  - **Matrice de Décision Personnelle & Arbitrage d'Opportunités** (`CareerDecisionMatrixModal.tsx`) : Pondération de 7 valeurs de vie pour arbitrer entre plusieurs offres.
  - **Bilan de Carrière IA Généré** (`CareerAIBilanModal.tsx`) : Synthèse complète des réalisations et orientations du prochain cycle.
  - **Visualisation Chronologique « Mon Évolution »** (`CareerEvolutionTimelineModal.tsx`) : Timeline vivante du chemin parcouru jusqu'au Point B.
- **Impact** : Vision prospective à 360°, levée proactive des blocages de carrière, arbitrage multicritère transparent et accélération sécurisée vers l'accomplissement.

### [Version 5.10] — 27 Août 2026 (Carrière 5/7 : Capital Relationnel, Réseau & Prospection)
- **Objectif** : Ne plus attendre passivement qu'une opportunité apparaisse : donner à l'utilisateur les moyens de créer ses opportunités en activant son réseau stratégique, ses clients cibles (ICP), ses partenaires et son mentorat.
- **Modifications Réalisées** :
  - **Hub Central de l'Écosystème Relationnel** (`CareerRelationalEcosystemHub.tsx`) : Cockpit unifié de prospection, métriques relationnelles et arbitrage *« Qui contacter aujourd'hui ? »*.
  - **Carte Relationnelle Intelligente & Dynamique** (`CareerRelationshipMapModal.tsx`) : Visualisation hiérarchique du flux relationnel avec pertinence bidirectionnelle explicable.
  - **Moteur de Déduction « Qui devrais-je connaître ? »** (`CareerWhoShouldIKnowModal.tsx`) : Identification des profils clés nécessaires pour atteindre le Point B.
  - **Mode Introduction Professionnelle** (`CareerIntroductionModal.tsx`) : Messages d'approche qualifiés et respect de la validation humaine préalable.
  - **Fiche Relationnelle 360° & Mini-CRM** (`CareerContactDetailModal.tsx`) : Pipeline 10 étapes, mémoire des échanges, gestion des engagements réciproques et synergies avec le Réseau MOC (Tribus, Lives, Reels).
  - **Équipes d'Opportunité & Réponse Collective** (`CareerCollaborativeMissionModal.tsx`) : Consortia pluridisciplinaires pour répondre aux grands appels d'offres.
  - **Hub de Mentorat & Réputation Contextualisée** (`CareerMentorshipModal.tsx`) : Boucle d'apprentissage et de transmission de pair à pair avec réputation vérifiée par compétences.
  - **Vue Synthétique 360° Écosystème** (`CareerEcosystem360Modal.tsx`) : Synthèse en 8 piliers stratégiques.
- **Impact** : Maîtrise active du destin professionnel, prospection respectueuse et collaborative, passage d'un réseau passif à un capital d'opportunités concrètes.

---

### [Version 5.9] — 27 Août 2026 (Carrière 4/7 : Suivi Autonome & Agent de Continuité)
- **Objectif** : Éviter que l'utilisateur soit abandonné après avoir engagé une démarche, en transformant le suivi en un cockpit vivant de continuité proactif, anti-spam et résilient.
- **Modifications Réalisées** :
  - **Hub de Contrôle & Pulse de Carrière** (`CareerContinuityControlHub.tsx`) : 6 métriques clés, Next Best Action globale et 2 commandes d'arbitrage immédiates (*« Que dois-je faire maintenant ? »* et *« Prépare-moi pour demain »*).
  - **Dossier Vivant & Timeline Chronologique** (`CareerLiveDossierModal.tsx`) : Historique horodaté, prochaine meilleure action calculée en continu, pièces jointes et notes personnelles.
  - **Générateur de Relances Anti-Spam** (`CareerSmartFollowUpModal.tsx`) : Diagnostic anti-harcèlement strict (J+7/J+10) et obligation d'apport de valeur nouvelle.
  - **Préparation de RDV & Fiche Flash J-0** (`CareerMeetingPrepModal.tsx`) : Récapitulatif 3 arguments phares, questions pièges et questions à poser.
  - **Débriefing Vocal Instantané** (`CareerPostMeetingDebriefModal.tsx`) : Saisie/dictée d'après-rendez-vous avec qualification du sentiment, enregistrement des décisions et programmation automatique du prochain jalon.
  - **Mode Plan B & Capitalisation Continue** (`CareerPlanBModal.tsx`) : Réallocation instantanée de 90% des actifs vers 2 à 3 opportunités alternatives hautement compatibles du Radar.
- **Impact** : Accompagnement de bout en bout jusqu'au résultat tangible, élimination des oublis et de la surcharge cognitive.

---

### [Version 5.8] — 27 Août 2026 (Carrière 3/7 : Mode Conquête & Salle de Préparation)
- **Objectif** : Transformer chaque opportunité détectée en un résultat réel grâce à une préparation sur mesure de très haut niveau, tout en appliquant la règle stricte *« L'humain est le seul maître de l'action »*.
- **Modifications Réalisées** :
  - **Salle de Préparation Multi-Onglets** (`CareerConquestRoom.tsx`) : Diagnostic 5D, CV Contextuel, 5 pitchs avec téléprompteur/enregistreur, simulateur d'objections et checklist J-0.
  - **CV Maître Universel** (`CareerMasterResumeModal.tsx`) : Base de vérité inaltérable et source de projection des CV contextuels.
  - **Sas de Contrôle Qualité Obligatoire** (`CareerQualityGateModal.tsx`) : Vérification anti-faute, alignement et validation humaine explicite.
  - **Décodeur de Réponses Recruteur/Client** (`CareerResponseAnalyzerModal.tsx`) : Analyse sémantique des retours et adaptation du plan d'action.
- **Impact** : Taux de conversion démultiplié pour les candidatures, appels d'offres et levées de fonds.

---

### [Version 5.7] — 27 Août 2026 (Carrière 2/7 : Radar Intelligent Multi-Sources & Agent de Conquête)
- **Objectif** : Transformer la recherche d'opportunités en un radar permanent autonome et explicable.
- **Modifications Réalisées** : Moteur de décodage d'intentions, 4 univers de conquête, détection de signaux faibles dans le Réseau MOK, coffre sécurisé et boucle de feedback adaptatif.

---

### [Version 5.6] — 27 Août 2026 (Campus Mondial Intelligent & Multi-Programmes)
- **Objectif** : Adapter la formation aux référentiels nationaux officiels (Guinée, Sénégal, France, Côte d'Ivoire, USA, UK) et styles cognitifs individuels.
- **Modifications Réalisées** : Registre officiel des cursus, moteur pédagogique Professeur Diallo avec mode *"Explique-moi autrement"*, simulateur d'examens blancs chronométrés et matrice de passerelles internationales.

---

## 🔍 DÉTAIL DES DERNIÈRES VERSIONS MAJEURES

### [Version 5.5] — 27 Août 2026 (Mémoire Vivante & Documentation Continue)
- **Objectif** : Transformer la documentation en un processus permanent intégré au développement pour garantir la pérennité absolue du projet.
- **Modifications Réalisées** :
  - Création du Livre de Vision Maître (`docs/LIVRE_DE_VISION.md`).
  - Cartographie de l'Architecture Globale et des 14 modules (`docs/ARCHITECTURE_GLOBALE.md`).
  - Instauration du Journal Permanent des Décisions (`docs/JOURNAL_DECISIONS.md`).
  - Mise en place du Registre des Idées en réserve (`docs/REGISTRE_IDEES.md`).
  - Rédaction des fiches de spécification pour les 14 modules du système.
  - Injection des règles de continuité documentaire dans `AGENTS.md` et `GEMINI.md`.
- **Impact** : Zéro perte de mémoire, transmission fluide entre développeurs et agents IA, cohérence globale garantie.

---

### [Version 5.4] — 27 Août 2026 (Refonte Carrière & GPS d'Accomplissement)
- **Objectif** : Fournir une trajectoire complète de bout en bout du Point A au Point B pour l'emploi, le freelancing et la création d'entreprise.
- **Modifications Réalisées** :
  - Déploiement de 7 sous-composants modulaires dans `components/career/`.
  - Intégration du diagnostic 17 critères et de la matrice de correspondance.
  - Mise en place du Coach 3D Vocal interactif (`CareerCoach3DModal.tsx`).
  - Création du Jumeau Professionnel Évolutif et du pipeline Kanban interactif.
  - Établissement des passerelles vers Campus, Marché Mondial, Drive et Conseil d'Experts.
- **Impact** : Accomplissement concret et mesurable des objectifs professionnels des utilisateurs.

---

### [Version 5.0] — Juillet 2026 (Marché Mondial & Suite Commerciale B2B)
- **Objectif** : Ouvrir la plateforme au commerce international équitable et structuré.
- **Modifications Réalisées** :
  - Système d'exploitation commercial (`TradeBusinessOperatingSystem.tsx`).
  - Moteur de RFQ, sourcing, calcul de coûts de débarquement et gestion des litiges.
  - Salons d'affaires virtuels et pavillons mondiaux.
- **Impact** : Sécurisation des transactions import-export pour les entrepreneurs transfrontaliers.
