# Kit global de sauvegarde et de redéploiement — MokNet

> **But** : un seul fichier zip qui permet de tout reconstruire ailleurs — le dépôt git complet avec son historique, le code source sans clés, les paramètres de build, le schéma des variables d'environnement sans valeurs secrètes, la structure Supabase (migrations et guides, sans données), l'état exact de l'application au moment de la sauvegarde, et un **assistant guidé** qui accompagne le redéploiement étape par étape, demande les clés une par une au bon moment et les installe lui-même.
>
> Chantier autonome : ce dossier ne modifie ni le code livré, ni `supabase/migrations/`, ni `package.json`. Il capitalise sur l'existant (CI Green Gate, `.env.example`, `netlify.toml`, fonctions Edge, méthode de production contrôlée) et le complète.

## 1. En deux commandes

```bash
# Créer le kit (depuis un clone du dépôt, sur le commit à sauvegarder)
node kit-sauvegarde/creer-kit.mjs                # → kit-sauvegarde-sorties/moknet-kit-<date>-<sha7>.zip (+ .sha256)

# Redéployer ailleurs (depuis le zip décompressé dans un dossier vide)
node assistant/redeployer.mjs --destination ../moknet-redeploye
```

Prérequis du poste : Node ≥ 22, npm, git, zip/unzip. Aucune CLI à installer à la main (`npx` télécharge la CLI Netlify pour le déploiement et la CLI Supabase seulement en mode `--mode-migrations cli`).

## 2. Ce que contient le zip

| Chemin | Contenu | Produit par |
| :--- | :--- | :--- |
| `LISEZ-MOI.md` | démarrage rapide | `lib/documents.mjs` |
| `ETAT_SAUVEGARDE.md` · `manifeste.json` | **état exact de l'application** : version, commit, branche, références, fichiers, pile, Supabase (comptes mesurés), Netlify, variables, contenu et empreintes, limites dites | `creer-kit.mjs` (mesuré, jamais recopié) |
| `SOMME_DE_CONTROLE.sha256` | empreinte SHA-256 de chaque fichier | `creer-kit.mjs` |
| `depot/moknet.bundle` · `depot/REFERENCES.txt` | **dépôt git complet** (`git bundle --all` : toutes les branches locales et distantes connues, étiquettes, tout l'historique), vérifié par `git bundle verify` | `creer-kit.mjs` |
| `source/moknet-source-<sha7>.tar.gz` | **code source sans clés** (`git archive` du commit : rien d'ignoré, donc jamais de `.env`) | `creer-kit.mjs` |
| `netlify/parametres-build.json` · `netlify/netlify.toml` | **paramètres de build** (installation, commande, dossier publié, Node, variables du site, en-têtes, redirections, domaine en dur) | relevé + copie |
| `env/schema-env.json` · `env/SCHEMA_ENV.md` · `env/.env.example` | **schéma des variables sans valeurs** : par fournisseur, où chaque clé est demandée, où elle est installée, par quoi elle est lue | `env/` + `lib/documents.mjs` |
| `supabase/migrations/` (110) · `supabase/prerequis.sql` · `supabase/complements-hors-migrations.sql` | **structure Supabase sous forme de migrations** : l'historique complet reconstitué depuis la base réelle, plus ce que les migrations ne créent pas | relevé (lecture seule) |
| `supabase/releve/*.json` · `supabase/STRUCTURE.md` · `supabase/extraire-structure.sql` · `supabase/GUIDE_SUPABASE.md` | relevé machine, fiche lisible, requêtes de relevé, **guide de reconstruction** | relevé + `generer-structure-md.mjs` |
| `supabase/fonctions-edge/` · `supabase/rollback-depot/` | code des 6 fonctions Edge et scripts de retour arrière du dépôt | copie |
| `assistant/redeployer.mjs` · `assistant/verifier-kit.mjs` · `assistant/lib/` | **assistant guidé** et vérificateur | copie de ce dossier |

Aucune donnée applicative, aucun objet de stockage, aucune valeur de secret : voir « Limites » (§ 7) et `ETAT_SAUVEGARDE.md` § 8.

## 3. Le parcours guidé de redéploiement (un seul, treize étapes)

| Étape | Ce que l'assistant fait | Ce qu'il demande, et où il le place |
| :---: | :--- | :--- |
| 0 | vérifie le kit (sommes de contrôle, bundle, absence de secrets) et **affiche l'état de l'application** sauvegardée | confirmation |
| 1 | contrôle Node ≥ 22, git, npm, npx, unzip | — |
| 2 | restaure le dépôt complet depuis le bundle, se place sur le commit sauvegardé, importe les branches distantes sous `origin-sauvegarde/*`, vérifie commit, références et nombre de fichiers | — |
| 3 | pousse vers un dépôt GitHub distant (facultatif) | URL du dépôt → `git remote add origin` (authentification du poste, aucun jeton écrit) |
| 4 | joint le projet Supabase cible, **refuse le projet de production** sans `--autoriser-production` + PRODUCTION tapé | jeton d'accès (mémoire), référence du projet |
| 5 | **reconstruit Supabase** : `prerequis.sql`, les 110 migrations une par une dans leur transaction (versions enregistrées comme en production), compléments, puis vérification ATTENDU/OBTENU des comptes | confirmation des compléments |
| 6 | déploie les 6 **fonctions Edge** (JWT vérifié) puis pose leurs **secrets** | `AI_CORE_*`, `LIVE_TRANSPORT_ENVIRONMENT`, `LIVE_NODE_METRICS_URL`, `HEALTH_ALLOWED_ORIGINS` → secrets des fonctions |
| 7 | configure l'**authentification** (URL du site, redirections, Google) et affiche l'URI de rappel à déclarer chez Google | URL du site, identifiant et secret client Google → configuration Auth |
| 8 | enregistre un serveur **LiveKit** (facultatif) | URL, clé, secret → coffre `vault.secrets` + `public.live_transport_config` |
| 9 | récupère la clé anon par l'API et écrit **`.env`** (0600, ignoré par git) | `VITE_GOOGLE_MAPS_API_KEY` (facultatif) → `.env` |
| 10 | `npm ci` → `tsc --noEmit` → `npm test` → `npm run build`, vérifie le bundle | — |
| 11 | **Netlify** : site (existant ou créé), paramètres de build posés par l'API, variables du site, déploiement d'aperçu, puis production **seulement si PRODUCTION est tapé** | jeton Netlify (mémoire), identifiant ou nom du site → variables Netlify |
| 12 | **détecte les autres fournisseurs** : toute variable lue par le code (`import.meta.env.*`, `Deno.env.get`) absente du schéma est demandée et placée selon sa portée ; liste les 13 clés IA à saisir dans Super Admin ; promeut le premier Super Admin | valeurs non répertoriées, e-mail du Super Admin |
| 13 | vérification finale (page servie, API REST, fonction Edge → 401) et **rapport** ATTENDU / OBTENU / ÉCART / VERDICT, actions humaines restantes | — |

Options : `--simulation` (aucun appel Supabase, Netlify ni GitHub ; les commandes locales tournent), `--reponses fichier.json` (réponses préparées, rejeu et tests), `--reprendre` (continue un parcours interrompu ; l'état de reprise ne contient jamais de secret), `--sans-tests`, `--sans-build`, `--mode-migrations cli` (`supabase link` + `db push` au lieu de l'API de gestion).

Règles : un secret ne passe jamais en argument de commande, n'est jamais journalisé (masqué), n'est écrit que dans sa cible ; le rapport et l'état de reprise n'en contiennent pas ; rien n'est publié en production Netlify sans le mot PRODUCTION ; la cible Supabase de production est refusée par défaut.

## 4. Preuves (🧪 banc local)

Le test de bout en bout `tests/test-kit-local.sh` crée le kit, le décompresse dans un dossier vierge, le vérifie, lance l'assistant en simulation avec des réponses préparées (clés factices), puis contrôle indépendamment : commit restauré identique au manifeste, empreintes git de chaque fichier identiques au dépôt d'origine, `.env` écrit avec les bonnes valeurs aux bons endroits et ignoré par git, `npm ci` / `tsc` / `build` réels, aucun secret (même factice) dans le journal, le rapport ni l'état de reprise, aucun contrôle rouge. Les journaux et le rapport de la dernière exécution sont dans `docs/captures/2026-09-05-kit-sauvegarde-redeploiement/`.

Les garde-fous permanents (`tests/kitSauvegarde.test.ts`, exécutés par le Green Gate) vérifient que chaque variable lue par le code est répertoriée dans le schéma, que l'historique des migrations embarqué est complet et ordonné, que les prérequis créent `pg_cron` avant les migrations qui l'utilisent, que le scanner anti-secrets sait rougir et qu'aucun secret bloquant n'est dans le kit.

**Ce qui n'est pas prouvé ici** : les étapes réseau (API de gestion Supabase, déploiement des fonctions Edge, API et CLI Netlify, `git push`) n'ont tourné qu'en simulation — le rapport les marque ⬜ « non éprouvé ». Leur première exécution réelle est une **épreuve de restauration** à mener sur un projet Supabase d'essai et un site Netlify d'essai (jamais la production), avec le rapport comme preuve.

## 5. Où va chaque clé

| Clé | Demandée à l'étape | Installée dans |
| :--- | :---: | :--- |
| Jeton personnel Supabase, mot de passe de base (mode cli) | 4 | mémoire seulement |
| Référence du projet Supabase | 4 | `.env` (`VITE_SUPABASE_URL`), variables Netlify |
| Clé anon | 9 (récupérée par l'API) | `.env`, variables Netlify |
| Secrets des fonctions Edge | 6 | Supabase → Edge Functions → Secrets |
| Google OAuth (identifiant, secret) | 7 | Supabase Auth ; identifiant aussi dans `.env`/Netlify (`VITE_GOOGLE_OAUTH_CLIENT_ID`) |
| LiveKit (URL, clé, secret) | 8 | coffre `vault.secrets` + `live_transport_config` |
| Google Maps | 9 | `.env`, variables Netlify |
| Jeton personnel Netlify | 11 | mémoire seulement |
| Clés des 13 fournisseurs IA | après la première connexion | coffre, via Super Admin → Connecteurs & Modèles IA |
| VAPID (push) | jamais | générée automatiquement par `push-notify` |

Détail : `env/SCHEMA_ENV.md`.

## 6. Comparaison avec l'épreuve de restauration Vision Smart (ERP, 16 août 2026)

La référence interne la plus proche est le procès-verbal « Épreuve de restauration » (Vision Smart ERP, lot 1). Ce kit en reprend les principes : **le socle porte la forme, l'instantané porte le contenu** (ici : les migrations portent la forme ; le contenu reste hors kit, dit comme tel) ; **une sauvegarde se juge à ce qu'elle refuse** (fichier `.env` interdit, secret bloquant, kit altéré, cible = production, publication sans mot PRODUCTION) ; **empreintes par fichier et vérification sans restaurer** ; **chaque nombre mesuré** ; **limites dites**. Différences assumées : le kit MokNet sauvegarde le dépôt et la structure, pas les données (décision de périmètre de la Direction, données couvertes par Supabase) ; il ajoute l'assistant guidé et la détection des fournisseurs.

Un référentiel nommé « AITOPIA » a été cherché sans succès dans le dépôt, son historique, les dépôts accessibles, les sessions, les artefacts, Google Drive, Notion et la mémoire du projet. Si ce référentiel existe ailleurs, le fournir permettra une comparaison point par point.

## 7. Limites dites

- Pas de données ni d'objets de stockage : sauvegardes Supabase (plan Pro) ou export `pg_dump` autorisé par la Direction.
- Pas de valeurs de secrets, par construction.
- Le serveur LiveKit auto-hébergé (`deploy/livekit/`) et les réglages du tableau de bord Supabase invisibles du catalogue SQL ne sont pas relevés.
- Le domaine `moknet.net` est en dur dans six fichiers du code : un redéploiement sous un autre domaine doit les adapter (liste dans `netlify/parametres-build.json`).
- Le relevé Supabase est daté (`supabase/releve/projet.json`) ; § 8 pour le rafraîchir.

## 8. Maintenance

- **Rafraîchir le relevé Supabase** : rejouer `supabase/extraire-structure.sql` (lecture seule) sur le projet de production, réécrire `supabase/releve/*.json` et `supabase/migrations/`, mettre à jour `releve/projet.json`, puis `node kit-sauvegarde/supabase/generer-structure-md.mjs`.
- **Nouvelle variable dans le code** : l'ajouter à `env/schema-env.json` (le test `kitSauvegarde` échoue tant qu'elle n'y est pas).
- **Nouvelle sauvegarde** : `node kit-sauvegarde/creer-kit.mjs` sur le commit voulu ; conserver le zip et son `.sha256` hors du dépôt (stockage chiffré de la Direction), jamais dans git.

## 9. Fichiers de ce dossier

`creer-kit.mjs` · `redeployer.mjs` · `verifier-kit.mjs` · `lib/commun.mjs` (journal, exécution, questionnaire, scan anti-secrets) · `lib/documents.mjs` · `env/schema-env.json` · `netlify/parametres-build.json` · `supabase/` (voir § 2) · `tests/test-kit-local.sh`. Garde-fous CI : `tests/kitSauvegarde.test.ts` à la racine du dépôt.
