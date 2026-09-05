# Guide de reconstruction Supabase — MokNet

> Ce guide décrit comment le kit reconstruit un projet Supabase identique en **structure** à la production (relevé du 5 septembre 2026, projet `rqciahtpixdjbyoajomg`). Il ne contient ni données ni secrets. L'assistant guidé (`assistant/redeployer.mjs`, étapes 4 à 9 et 12) exécute ces étapes lui-même ; ce guide sert à comprendre, contrôler et rejouer à la main si nécessaire.

## 1. Ce que contient ce dossier

| Élément | Rôle |
| :--- | :--- |
| `migrations/` | **110 migrations** reconstituées depuis `supabase_migrations.schema_migrations` de la base réelle (version, nom, instructions SQL). C'est l'historique de référence : le dépôt n'en versionne que 6, avec d'autres horodatages. |
| `prerequis.sql` | Extensions présentes en production mais jamais créées par une migration (`pg_cron`, `pgcrypto`, `uuid-ossp`, `supabase_vault`, `pg_graphql`, `pg_stat_statements`, `wrappers`). À jouer **avant** la première migration : cinq migrations appellent `cron.schedule`. |
| `complements-hors-migrations.sql` | Objets observés en production hors de tout historique : le bucket `mok bouker`. Les entrées du coffre et les lignes `live_transport_config` y sont décrites, jamais copiées. |
| `releve/` | Relevé machine : `tables.json`, `policies.json`, `functions.json`, `objets.json` (contraintes, index, déclencheurs, vues, RLS), `complement.json` (schémas, droits des fonctions, cron, buckets, temps réel, noms du coffre, estimations de lignes), `projet.json` (métadonnées). |
| `STRUCTURE.md` | Fiche lisible générée depuis le relevé (`generer-structure-md.mjs`). |
| `extraire-structure.sql` | Les requêtes exactes du relevé, pour le rafraîchir. |
| `fonctions-edge/` | Copie du code des 6 fonctions Edge (`supabase/functions/` du dépôt). |
| `rollback-depot/` | Scripts de retour arrière versionnés dans le dépôt pour trois migrations récentes. |

## 2. Ordre de reconstruction (ce que fait l'assistant)

1. **Projet cible** : un projet Supabase vide (région `eu-west-1` comme la production, Postgres 17). Jeton personnel d'accès (`sbp_…`) et référence du projet. Le projet de production est **refusé** comme cible sans `--autoriser-production` et le mot PRODUCTION tapé.
2. **Prérequis** : `prerequis.sql` (idempotent).
3. **Migrations** : chaque fichier de `migrations/` dans l'ordre des versions, chacune dans sa propre transaction, puis enregistrement de la version dans `supabase_migrations.schema_migrations` (mêmes numéros que la production, donc `supabase db pull/push` restent cohérents ensuite). Une version déjà présente est sautée. Une migration en échec arrête tout : rien après elle n'est appliqué, sa transaction est annulée.
4. **Compléments** : `complements-hors-migrations.sql` sur confirmation.
5. **Vérification** : comptes de tables, politiques, fonctions, déclencheurs, tâches cron, buckets, tables temps réel et migrations, comparés au relevé (ATTENDU / OBTENU / ÉCART).
6. **Fonctions Edge** : déploiement des 6 fonctions (`ai-gateway`, `discover-provider`, `health-guardian`, `livekit-token`, `mint-live-token`, `push-notify`), JWT vérifié, puis leurs secrets (`AI_CORE_*`, `LIVE_TRANSPORT_ENVIRONMENT`, `LIVE_NODE_METRICS_URL`, `HEALTH_ALLOWED_ORIGINS`) demandés un par un. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sont injectés par Supabase.
7. **Authentification** : `site_url`, liste des redirections autorisées, fournisseur Google (identifiant et secret client) ; l'URI `https://<ref>.supabase.co/auth/v1/callback` est à déclarer côté Google Cloud (action humaine, affichée au bon moment).
8. **LiveKit** (facultatif) : `vault.create_secret` + ligne `public.live_transport_config` (`environment`, `server_url`, `api_key`, `vault_secret_id`).
9. **Clés IA** : après la première connexion, Super Admin → Connecteurs & Modèles IA (RPC `set_ai_provider_secret`). Les 13 noms relevés : `ai_provider:anthropic`, `deepgram`, `deepseek`, `elevenlabs`, `gemini`, `heygen`, `ideogram`, `kimi`, `kling`, `openai`, `openrouter`, `runway`, `veo`.
10. **Premier Super Admin** : `update public.profiles set role = 'super_admin' where email = …` une fois le compte connecté (le profil est créé par le déclencheur `trg_on_auth_user_created` → `handle_new_user()`).
11. **VAPID (push)** : rien à faire, la paire est générée par `push-notify` au premier envoi.

## 3. Rejouer à la main (sans l'assistant)

Avec la CLI Supabase, dans un dossier vide :

```bash
mkdir -p espace/supabase/migrations && cd espace
printf 'project_id = "moknet-kit"\n' > supabase/config.toml
cp <kit>/supabase/prerequis.sql supabase/migrations/20260101000000_kit_prerequis.sql
cp <kit>/supabase/migrations/*.sql supabase/migrations/
cp <kit>/supabase/complements-hors-migrations.sql supabase/migrations/20991231235959_kit_complements.sql
SUPABASE_ACCESS_TOKEN=… npx --yes supabase@2 link --project-ref <ref>   # demande le mot de passe de la base
npx --yes supabase@2 db push
# Fonctions Edge, depuis le dépôt restauré (supabase/functions/) :
for f in ai-gateway discover-provider health-guardian livekit-token mint-live-token push-notify; do
  npx --yes supabase@2 functions deploy "$f" --project-ref <ref>
done
npx --yes supabase@2 secrets set LIVE_TRANSPORT_ENVIRONMENT=development HEALTH_ALLOWED_ORIGINS=https://<site> --project-ref <ref>
```

Avec l'éditeur SQL du tableau de bord : jouer `prerequis.sql`, puis chaque migration dans l'ordre, puis `complements-hors-migrations.sql` ; enregistrer chaque version dans `supabase_migrations.schema_migrations` (`version`, `name`, `statements`) pour garder l'historique cohérent.

## 4. Vérifier la structure obtenue

Rejouer `extraire-structure.sql` (sections B à E) sur le nouveau projet et comparer aux fichiers de `releve/`. Valeurs attendues au relevé : 89 tables, 186 politiques, 84 fonctions `public` (+ 2 `private`), 31 déclencheurs, 6 tâches cron, 3 buckets, 14 tables temps réel, 110 migrations, 1 déclencheur sur `auth.users`.

## 5. Ce que ce guide ne couvre pas (limites dites)

- Les **données** (utilisateurs `auth.users`, profils, messages, publications, journaux) et les **objets du stockage** : sauvegardes Supabase (plan Pro) ou export `pg_dump` autorisé par la Direction.
- Les **valeurs** des secrets du coffre et des fonctions Edge.
- Les réglages du tableau de bord non visibles dans le catalogue SQL (limites de taux d'authentification, modèles d'e-mails, domaines personnalisés, SMTP) : à comparer à la main avec le projet d'origine.
- Le serveur **LiveKit** auto-hébergé (`deploy/livekit/README.md`).
- La table `platform_settings` présente dans `supabase/migrations/` du dépôt n'existait pas en production au moment du relevé (chantier en cours) : elle n'est pas dans l'historique du kit ; l'appliquer depuis le dépôt quand elle sera en production.

## 6. Rafraîchir le relevé avant une nouvelle sauvegarde

1. Rejouer `extraire-structure.sql` (A à E) sur le projet de production, en lecture seule.
2. Écrire les résultats dans `releve/*.json` et `migrations/*.sql` (mêmes formats), mettre à jour `releve/projet.json` (`releve_le`, comptes).
3. `node kit-sauvegarde/supabase/generer-structure-md.mjs` puis `node kit-sauvegarde/creer-kit.mjs`.
