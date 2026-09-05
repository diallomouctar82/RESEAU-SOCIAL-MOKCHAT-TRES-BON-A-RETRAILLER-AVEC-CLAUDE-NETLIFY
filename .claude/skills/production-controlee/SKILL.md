---
name: production-controlee
description: Méthode de référence Vision Smart pour conduire une évolution de MokNet jusqu'à la production contrôlée, zéro régression, preuve avant affirmation, producteur ≠ contrôleur. Validée par la Direction le 5 septembre 2026 (DEC-2026-058 et DEC-2026-061). À charger pour TOUTE mission qui touche le code livré. Réutilisable telle quelle ; améliorable seulement en plus strict, jamais en moins.
version: 1.0.0
canonical_key: visionsmart.moknet.methode.production-controlee
type: METHOD
status: ACTIVE
validated_by: Direction Vision Smart, 5 septembre 2026 (« cette approche est validée et doit être conservée telle quelle, améliorable, seulement en mieux, jamais en moins strict »)
provenance: PR #89 / #90 (bande « Aurore », DEC-2026-058) puis PR #93 / #94 (composeur A7 et studio Visuel IA B10, DEC-2026-061) sur diallomouctar82/RESEAU-SOCIAL-MOKCHAT-TRES-BON-A-RETRAILLER-AVEC-CLAUDE-NETLIFY
source_uri: .claude/skills/production-controlee/SKILL.md
ai_core_project_id: 6aeffdc5-e681-4ec4-ad36-7d9d71449d66
ai_core_entry_id: 159f024b-4982-4b79-a07b-9a883c948739
ai_core_version_id: b613605e-4d36-47ea-bb15-c4f419521721
ai_core_proposal_id: 9985f324-6d57-4b72-ba48-40ffeb5522fd
ai_core_published_at: 2026-09-05T13:11:18Z
---

# Production contrôlée — la méthode de référence

## 0. Règle d'usage

- Cette compétence s'applique **telle quelle** à toute mission qui modifie le code livré de MokNet (interface, services, CSS d'`index.html`, fonctions Edge). Elle complète la Constitution Vision Smart et le `docs/GUIDE_CONTINUITE.md` ; en cas de contradiction, la règle la plus stricte s'applique.
- **Amélioration** : on peut ajouter un contrôle, une preuve ou un garde-fou ; on ne peut **jamais** en retirer un, ni affaiblir un seuil, ni remplacer une preuve par une déclaration. Toute amélioration est consignée dans le journal des versions en fin de fichier, avec sa justification.
- **Celui qui produit ne se valide jamais seul** : la revue indépendante et la contre-vérification sont obligatoires avant toute fusion (§ 6).
- **Aucune production sans feu vert écrit** de la Direction, dans la mission elle-même ou dans un message explicite (§ 7.1). « Continue », « finalise », « mets tout au vert » ne sont pas un feu vert.
- Les scripts d'appui vivent dans `scripts/production-controlee/` (§ 9). Le harnais de capture n'est **jamais versionné** (`.git/info/exclude`) ; son gabarit est fourni.

## 1. Invariants (jamais)

1. **Rien ne disparaît.** Chaque élément, action, option, gestionnaire et libellé existant avant la mission existe encore après, sauf suppression demandée par écrit. La revue compare élément par élément avec `origin/main`.
2. **Aucun bouton factice.** Tout ce qui se voit agit ; un contrôle sans effet réel est retiré de la maquette avant l'implémentation (exemple : chevron de menu sur « Publier »).
3. **L'élément déclaré intouchable par la Direction reste identique à l'octet** (classes, attributs, boîte mesurée sur les trois écrans). Exemple : l'avatar / logo VS du composeur.
4. **Les chaînes contractuelles restent verbatim** quand un test ou la Direction les fige (invite du composeur, libellés imposés, ordre imposé).
5. **Jamais de faux vert** : un vert doit être mérité par une preuve rejouable au niveau annoncé (§ 8). Une erreur de la passerelle IA, un canvas souillé, un navigateur sans capacité produisent un **message honnête**, jamais un succès simulé.
6. **Une seule fusion ou production à la fois** sur le dépôt (§ 7.4). Chevauchement de fichiers ou d'étape avec une autre session : arrêt immédiat, celui qui est en cours termine, l'autre reprend après réintégration de `main`.
7. **Problème maîtrisable → corriger avant de continuer. Non maîtrisable → retour immédiat à l'état stable** (§ 7.5), puis déclaration claire pour décision de la Direction.
8. **Aucun secret** dans un diff, une PR, un journal ou une capture.

## 2. Les loops et leur avancement

Chaque mission est découpée en loops numérotées, affichées avec leur avancement (0 → 100 %) dans la liste de tâches et dans chaque compte rendu. Une loop n'est ouverte que quand la précédente est bouclée (résultat exploitable, testé, corrigé, documenté).

| Loop | Contenu | Sortie obligatoire |
| :--- | :--- | :--- |
| **P0 — Audit** | Lire l'existant (composant, gestionnaires, tests, CSS, capacités réelles des services), relever les identifiants libres (DEC, version), les invariants de la Direction, les tests qui figent des chaînes. | Liste des éléments à conserver, capacités réelles (jamais supposées), plan des loops. |
| **P1 — Implémentation** | Étendre l'existant, jamais repartir de zéro sans raison démontrée. | Code typé (`npx tsc --noEmit` = 0), couche aqua régénérée si `index.html` change. |
| **P2 — Tests** | Tests de comportement (jamais seulement de classes), gardes CSS analysées par postcss, service pur testé sur des pixels/valeurs réelles. | Suite complète verte, `tsc` relancé **après** l'écriture des tests. |
| **P3 — Captures et mesures** | Harnais local non versionné, Chromium headless, trois écrans (1440×900, 820×1180 ×2, 390×844 ×2), avant sur `origin/main` (worktree) et après sur la branche, mesures DOM en JSON. **Regarder les images une fois** avant de conclure. | Dossier `docs/captures/<date>-<sujet>/` avec README (tableau avant/après, mesures, niveau de preuve). |
| **P4 — PR, CI, preview, revue indépendante** | PR brouillon au gabarit ADR-0016, Green Gate vert, preview Netlify vérifié (page + bundle), miroir local ouvert dans Chromium, **revue indépendante** puis **contre-vérification** jusqu'à « PRÊT » ; chaque correction = nouveau cycle CI + preview. | Verdict « PRÊT » sur la tête finale, CI verte sur cette tête exacte. |
| **P5 — Production contrôlée** | Feu vert écrit, `main` inchangé, fusion squash sur la tête exacte, vérification immédiate de la production, documents de mémoire vivante finalisés par une PR de documentation, branche réalignée, rapport final. | Lien de production, preuves, rapport au format § 10. |

Après une loop de correction (revue, contre-vérification, production), on **ne rejoue pas mécaniquement tout** : on retest les zones touchées et leurs dépendances, et on refait les captures et mesures qui pouvaient être invalidées (§ XVII de la Constitution).

## 3. Loop P0 — Audit avant toute création

- `git fetch origin main` ; lire le bloc à modifier **en entier** et ses gestionnaires (`onClick`, `disabled`, `<select>` et options, entrées de fichier, aperçus, retours vocaux).
- Chercher les tests qui figent des chaînes ou des positions (`grep` de l'invite, `getByRole('button', { name })`) : ils font partie du contrat.
- Vérifier les **capacités réelles** avant de promettre : une passerelle IA (`services/aiGateway.ts`) renvoie du texte, une image ou une analyse ; ce qu'elle ne fait pas n'est pas simulé (exemple : retouche ciblée d'un visage → non simulée, l'écran le dit et renvoie vers le prompt).
- Relever le prochain identifiant libre **sur `origin/main`** : `grep -o "^### \[DEC-2026-0..\]" docs/JOURNAL_DECISIONS.md | head -1` et `grep -o "^| \*\*v6\...\.0\*\*" docs/HISTORIQUE_VERSIONS.md | tail -1`. Si `main` avance pendant la mission et prend l'identifiant, **renuméroter** (code, tests, CSS, README des captures, docs, titre et corps de PR) avant la fusion.
- Écrire le plan des loops avec pourcentage avant de coder.

## 4. Loop P1 — Implémentation

- Garder chaque gestionnaire d'origine (mêmes conditions `disabled`, mêmes options, mêmes entrées de fichier uniques et partagées). Un rendu double (rail ordinateur / ligne téléphone) sort d'**une seule fonction** ; la feuille n'en affiche jamais qu'un exemplaire (`display: none` retire l'autre de l'arbre d'accessibilité).
- CSS : un **bloc nommé** dans `index.html`, ouvert par `/* … NOM (DEC-XXXX) … */` et fermé par `/* ===== FIN NOM ===== */` ; commentaires **sans accent** dans le bloc (test `tests/miroirFeuilleAnalysee.test.ts`) ; sélecteurs préfixés propres au bloc ; `@container` **toujours** avec repli `@supports not (container-type: inline-size) { @media (max-width: …) }` ; survol uniquement sous `@media (hover: hover) and (pointer: fine)` ; `prefers-reduced-motion: reduce` qui arrête les animations ; `100dvh` avec repli `100vh`. **Une requête de conteneur ne peut pas styler son propre conteneur** : le conteneur est un parent, la grille un enfant.
- Après toute modification d'`index.html` : `node scripts/genMiroirAquaLayer.cjs --ecrire`.
- Dialogue plein écran : portail sur `document.body`, `#root` inerte, piège de focus, Échap capturé seulement si le focus est dedans, **focus rendu au déclencheur** à la fermeture, enfants de la feuille non compressibles (`> * { flex: none }`), effets d'ouverture dépendant de `[ouvert]` seul (gestionnaires et props lus par des refs) pour qu'un re-rendu du parent ne remette rien à zéro.
- Libellés masqués sur téléphone → `aria-label` porté par le bouton ; cibles ≥ 44 px (orbes de 40 px dans des boutons de 44) ; contraste ≥ 3:1 pour les icônes, calculé, pas estimé ; anneau de focus visible et non rogné.
- Toute URL `blob:` remplacée est révoquée ; tout historique d'annulation est par geste, sans effet de bord dans un updater React.

## 5. Loops P2 et P3 — Tests, captures, mesures

- Tests DOM avec les doublures existantes (`tests/accesRapideAurore.test.tsx` est le modèle des mocks : passerelle IA, Supabase en Proxy, cloud, PWA, assistant vocal, contexte global). Tester des **comportements** : clic → entrée de fichier, orbe → modale sur le bon onglet, disabled → enabled après saisie, focus rendu, réponse `{}` de la passerelle → erreur, re-rendu du parent → état conservé.
- Gardes CSS : parser `index.html` avec postcss, vérifier les règles **et** refuser les règles mortes (exemple : aucune règle `.a7-comp` dans `@container a7`).
- Harnais : `preview-harness.tsx` + `preview-harness.html` (gabarit dans `scripts/production-controlee/preview-harness.tsx.example`), exclus par `.git/info/exclude`, régénérés après chaque changement d'`index.html` : `sed -e 's#src="/index.tsx"#src="/preview-harness.tsx"#' -e 's#https://cdn.tailwindcss.com#/tailwind-play.js#' index.html > preview-harness.html`. Vite sur le port 3000 (après) et un worktree `origin/main` sur le port 3001 (avant).
- Script Playwright par mission (gabarit `capture-avant-apres.example.cjs`) : trois écrans, l'élément amené en haut, page + élément seul, **mesures** (boutons visibles et leurs noms, cibles < 40 px, éléments hors écran, débordement horizontal, erreurs JS filtrées des bruits connus, boîtes des éléments intouchables) écrites en JSON. Les mesures sont la preuve ; les images sont regardées une fois pour attraper ce que les mesures ne voient pas (aperçu rogné, barre écrasée).
- Photo de démonstration : scène synthétique, jamais une personne réelle.
- Dossier `docs/captures/<date>-<sujet>/` : PNG choisis (pas tous), `avant-mesures.json`, `apres-mesures.json`, `README.md` avec tableau des captures, tableau des mesures avant/après, niveau de preuve et limites honnêtes (polices de secours, avatar du harnais, Supabase absent).

## 6. Loop P4 — PR, CI, preview, revue indépendante

1. **Commit** : `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -F -` avec les deux pieds imposés (`Co-Authored-By`, `Claude-Session`). Titre `type(périmètre): … (DEC-XXXX, vX.Y.Z)`.
2. **Push** avec `git push -u origin <branche>` (4 reprises, 2/4/8/16 s).
3. **PR brouillon** au gabarit `.github/pull_request_template.md` (Objectif, Périmètre, Risques, Tests, Preuves, Critères d'acceptation), pied `🤖 Generated with [Claude Code](https://claude.com/claude-code)` + lien de session. `subscribe_pr_activity` immédiatement.
4. **Green Gate** : `scripts/production-controlee/poll-green-gate.sh <sha> <journal>` en arrière-plan ; un `pull_request` sans run = PR en conflit (`mergeable_state: dirty`) → fusionner `main` dans la branche (jamais de réécriture d'historique sur la branche d'un autre), résoudre, renuméroter si besoin, retester la suite **complète** sur l'arbre fusionné.
5. **Preview Netlify** (`https://deploy-preview-<N>--lovely-maamoul-478226.netlify.app`) : attendre le changement de bundle, puis `scripts/production-controlee/verif-page-servie.sh <url> <ancien-bundle> <fichier-marqueurs>` (marqueurs HTML des blocs CSS, marqueurs du bundle, chaînes de l'ancien code **absentes**, ancien bundle → 404).
6. **Miroir local** : `scripts/production-controlee/mirror-serve.py <port> <origine> <cache>` puis fumée Chromium (`smoke-miroir.example.cjs`) : racine React montée, règles CSS attendues analysées par le navigateur, `@container` présents, captures. Limite honnête : l'écran authentifié reste derrière Supabase ; le rendu de l'écran est prouvé par le harnais.
7. **Revue indépendante** (agent séparé, `Agent` general-purpose, jamais le producteur) avec le prompt § 9.3 : lit le diff complet et l'ancien code, exécute `tsc`, la suite et le build, compare élément par élément, cherche activement les défauts (accessibilité, CSS, fuites, effets, sécurité, faux verts des tests) et rend « PRÊT » ou « À CORRIGER » avec constats numérotés, gravité, fichier:ligne, correction proposée.
8. **Corrections** : tous les BLOQUANTS et IMPORTANTS avant production, les MINEURS à faible coût dans la foulée, les autres consignés pour arbitrage. Chaque correction : `tsc`, tests touchés, suite complète, captures et mesures refaites, commit, push, CI, preview, puis **contre-vérification** par le même contrôleur (`SendMessage`), jusqu'au verdict « PRÊT » sur la tête finale. Une correction peut introduire une régression (exemple : colonne de grille de 40 px qui écrasait l'avatar) : la contre-vérification est là pour ça, on ne la saute pas.
9. Le corps de la PR est remis au niveau des faits après chaque cycle (verdicts, runs CI, bundle du preview).

## 7. Loop P5 — Production contrôlée

### 7.1 Feu vert
Écrit, explicite, de la Direction : « prépare une production contrôlée », « feu vert pour avancer vers une production contrôlée ». Le consigner dans le journal (citation).

### 7.2 Séquence
1. `git fetch origin main` ; **`main` doit être identique** à la base testée par le dernier Green Gate, sinon fusionner `main`, retester, repasser CI et contre-vérification.
2. Aucune autre fusion en cours (`list_pull_requests`, derniers commits de `main`). Sinon attendre que l'autre termine.
3. PR marquée prête (`draft: false`), puis **`merge_pull_request` en squash avec `expectedHeadSha`** = tête vérifiée, titre `… (#N)`, message avec les preuves et les deux pieds.
4. **Vérification immédiate** : attendre le nouveau bundle sur `https://moknet.net` (boucle `curl` toutes les 20 s), `verif-page-servie.sh https://moknet.net <ancien-bundle> <marqueurs>` (marqueurs présents, ancien code absent, ancien bundle 404, en-têtes `cache-control` / `etag`), Green Gate sur `main`, miroir local + fumée Chromium.
5. `unsubscribe_pr_activity`, réalignement de la branche désignée sur `origin/main` (`git checkout -B <branche> origin/main`, push `--force-with-lease` seulement quand l'historique distant est entièrement fusionné).
6. **Documents de mémoire vivante** finalisés par une PR de documentation séparée (statut, bundle, heure UTC, runs, verdicts) : `docs/JOURNAL_DECISIONS.md` (entrée DEC complète : modules, besoin cité, options considérées, décision, contrôle indépendant, production, statut), `docs/HISTORIQUE_VERSIONS.md` (ligne + section, version précédente « Remplacée par … »), `docs/ETAT_ACTUEL.md` (ligne de version courante + paragraphe daté), `docs/modules/<module>.md` si le module change de comportement. Même règle de coordination pour cette PR.
7. **Rapport final** (§ 10) avec le lien de production, les captures envoyées, les tests, les commits, les PR, les risques résiduels, le verdict.

### 7.3 Étape par étape
Une étape à la fois, chacune vérifiée avant la suivante ; un compte rendu court à chaque étape franchie.

### 7.4 Coordination entre sessions
Une seule fusion ou production contrôlée à la fois sur le dépôt. Avant chaque fusion : `main` inchangé et aucune PR en cours de fusion. Chevauchement de fichiers ou d'étape : arrêt immédiat, celui qui a commencé termine, l'autre réintègre `main` puis reprend. Aucun écrasement, aucun contournement, jamais de `--force` sur une branche qui n'est pas la sienne.

### 7.5 Retour arrière
Problème maîtrisable (corrigeable sans toucher aux données, avec preuve) : corriger, retester, refaire le cycle. Non maîtrisable (production cassée, donnée touchée, cause inconnue après 30 minutes) : `git revert` du squash par PR immédiate, vérification de `moknet.net`, déclaration claire à la Direction (cause, impact, état, décision demandée). Aucune migration ni donnée réelle n'est touchée sans sauvegarde vérifiée.

## 8. Niveaux de preuve et formulations honnêtes

🧪 banc (jsdom, harnais Chromium, doublures) · 🗄️ environnement d'essai · 🌐 conditions réelles · 📱 appareil réel · 🚀 production (page et bundle servis, miroir Chromium). Ne jamais présenter un niveau pour un autre : « le harnais prouve le rendu de l'écran ; la production prouve que ce code est servi ; le contrôle visuel final dans l'application appartient à la Direction ». Ce qui n'a pas pu être vérifié (Safari, CORS d'un fournisseur, appareil réel) est **nommé** dans le rapport.

## 9. Outils et gabarits

### 9.1 `scripts/production-controlee/`
- `verif-page-servie.sh <url> <ancien-bundle> <fichier-marqueurs>` — page servie, bundle, marqueurs présents/absents, 404 de l'ancien bundle, en-têtes.
- `mirror-serve.py <port> <origine> <cache>` — miroir local d'un site servi (chaque chemin récupéré une fois par `curl`, via le proxy), pour l'ouvrir dans Chromium headless.
- `poll-green-gate.sh <sha> <journal> [owner/repo]` — suit le run « CI — Green Gate » d'un SHA jusqu'à `completed`.
- `preview-harness.tsx.example` — gabarit du harnais (à copier en `preview-harness.tsx`, non versionné).
- `capture-avant-apres.example.cjs` et `smoke-miroir.example.cjs` — gabarits Playwright (à copier dans un dossier hors dépôt disposant de `playwright`, Chromium en `/opt/pw-browsers/chromium`, `PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1`, proxy contourné pour `localhost`).

### 9.2 Pièges rencontrés (à ne pas reproduire)
- `pkill -f` / `pgrep -f` avec un motif présent dans la commande courante tuent ou reconnaissent le shell lui-même : mettre un crochet dans le motif **et** ne pas écrire la commande à lancer dans la même ligne.
- Une variable de shell non exportée est invisible dans `python3 - <<EOF` : mettre le chemin en dur ou `export`.
- `grep FAIL` attrape « SPEECH_OUTPUT_FAILED_MESSAGE » : lire le résumé de vitest avec `tail -12`.
- `s.count(motif)` compte aussi les sous-chaînes indentées différemment : remplacer les deux occurrences ou ancrer le motif.
- Un script Python qui échoue à une assertion après une écriture laisse les fichiers précédents modifiés : vérifier `git status` avant de commettre.
- Une requête de conteneur ne style jamais son propre conteneur ; une colonne de grille plus étroite que l'image l'écrase (`img { max-width: 100% }`).
- Un effet React qui dépend d'une fonction inline du parent rejoue à chaque rendu du parent.
- La passerelle IA en mode JSON renvoie `{}` sans JSON : refuser explicitement.
- `tsc` doit tourner **après** l'écriture des tests (callbacks postcss qui renvoient un nombre).
- Le dossier des vitest « stdout | … » contient des mots-clés : filtrer sur `^ *Test Files`.

### 9.3 Prompt de revue indépendante (à adapter, jamais à alléger)
« Tu es le CONTRÔLEUR indépendant (producteur ≠ contrôleur). NE MODIFIE AUCUN FICHIER. Lis `git diff origin/main -- <fichiers>` et les nouveaux fichiers entiers ; lis ce que le bloc remplaçait (`git show origin/main:<fichier> | sed -n a,bp`) et compare élément par élément (gestionnaires, conditions, options, entrées, aperçus, libellés). Exécute `npx tsc --noEmit`, `npx vitest run`, `npm run build` et rapporte les chiffres réels. Cherche activement : élément perdu, bouton factice, accessibilité (noms accessibles avec libellés masqués, `aria-pressed`, focus, tailles de cibles, contrastes calculés), rendu double, fuites (`URL.createObjectURL`), canvas souillé, effets et dépendances, z-index et `inert`, Échap, MediaRecorder/Safari, bornes et alpha d'un pipeline de pixels, CSS (`@container` + repli, hover sous `(hover: hover)`, reduced-motion, sélecteurs qui fuient, commentaires sans accent, règles mortes), TypeScript (casts, hooks), faux verts des tests, sécurité (données envoyées ailleurs que par la passerelle, JSON de l'IA). Rends des constats numérotés avec gravité BLOQUANT / IMPORTANT / MINEUR, fichier:ligne, observation, raison, correction proposée, ce que tu n'as pas pu vérifier, puis VERDICT « PRÊT » ou « À CORRIGER ». »

Contre-vérification : même contrôleur (`SendMessage`), diff depuis la tête revue, contre-épreuves rejouées sans modification, recherche de régressions introduites par les corrections, verdict final.

## 10. Rapport final (mission importante)

OBJECTIF · RÉALISÉ · PRODUCTION (lien, bundle, heure UTC, PR code et docs, identifiants) · PREUVES (typage, tests N/N, build, runs CI, captures et mesures, preview, production, miroir) · CONTRÔLES INDÉPENDANTS ET CORRECTIONS (verdicts, constats corrigés, régressions relevées et corrigées) · RISQUES RÉSIDUELS (non vérifié, arbitrages ouverts, retour arrière) · VERDICT (🟢 CERTIFIÉ sous réserve du contrôle visuel de la Direction, ou NON CERTIFIÉ avec la raison exacte).

Intervention humaine indispensable → format ACTION REQUISE (action, plateforme, lien, décision nécessaire, pourquoi, reprise).

## 11. Journal des versions de la compétence

| Version | Date | Changement | Sens |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 5 septembre 2026 | Première consolidation à partir des missions DEC-2026-058 et DEC-2026-061, validées par la Direction. Publiée le même jour dans le registre Vision Smart AI Core (entrée `159f024b-4982-4b79-a07b-9a883c948739`, statut ACTIVE, version `b613605e-4d36-47ea-bb15-c4f419521721`, empreinte SHA-256 du contenu publié `57d5c24afa872e1602c99fef159062059e71d31b34fcb7a7f55e3f754e37aa08`). | Référence |

Toute version suivante indique « plus strict » ou « ajout » dans la colonne Sens ; « moins strict » est interdit.
