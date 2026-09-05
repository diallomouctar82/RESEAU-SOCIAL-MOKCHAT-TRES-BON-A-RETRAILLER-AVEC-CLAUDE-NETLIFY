#!/usr/bin/env bash
# Test local de bout en bout du kit de sauvegarde et de redéploiement MokNet.
#
#   bash kit-sauvegarde/tests/test-kit-local.sh [dossier-de-preuves]
#
# 1. crée le kit (zip) depuis le dépôt courant ;
# 2. l'extrait dans un dossier vierge et le vérifie (sommes de contrôle, bundle, secrets) ;
# 3. lance l'assistant guidé en SIMULATION avec des réponses préparées (clés factices) :
#    restauration réelle depuis le bundle, .env réellement écrit, npm ci / tsc / tests / build RÉELS,
#    aucun appel Supabase, Netlify ni GitHub ;
# 4. contrôle les résultats et écrit les preuves (journaux, rapport, empreintes) dans le dossier de preuves.
# Niveau de preuve : 🧪 banc local (les étapes réseau sont simulées et dites telles).
set -euo pipefail
RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PREUVES="${1:-$RACINE/kit-sauvegarde-sorties/preuves-$(date -u +%Y%m%d-%H%M%S)}"
mkdir -p "$PREUVES"
TRAVAIL="$(mktemp -d "${TMPDIR:-/tmp}/moknet-kit-test-XXXXXX")"
trap 'rm -rf "$TRAVAIL"' EXIT
echo "Preuves : $PREUVES"; echo "Travail : $TRAVAIL"

echo; echo "══ 1. Création du kit"
node "$RACINE/kit-sauvegarde/creer-kit.mjs" --sortie "$TRAVAIL/sortie" --sans-fetch 2>&1 | tee "$PREUVES/01-creation.log"
ZIP="$(ls "$TRAVAIL"/sortie/*.zip)"
cp "$ZIP.sha256" "$PREUVES/02-zip.sha256"
( cd "$(dirname "$ZIP")" && sha256sum -c "$(basename "$ZIP").sha256" ) | tee "$PREUVES/02-zip-sha256-verifie.log"
unzip -tq "$ZIP" | tee "$PREUVES/03-unzip-test.log"

echo; echo "══ 2. Extraction et vérification dans un dossier vierge"
mkdir -p "$TRAVAIL/kit" && unzip -q "$ZIP" -d "$TRAVAIL/kit"
node "$TRAVAIL/kit/assistant/verifier-kit.mjs" "$TRAVAIL/kit" 2>&1 | tee "$PREUVES/04-verification-kit.log"
cp "$TRAVAIL/kit/ETAT_SAUVEGARDE.md" "$PREUVES/05-ETAT_SAUVEGARDE.md"
cp "$TRAVAIL/kit/manifeste.json" "$PREUVES/05-manifeste.json"
cp "$TRAVAIL/kit/env/SCHEMA_ENV.md" "$PREUVES/05-SCHEMA_ENV.md"
( cd "$TRAVAIL/kit" && find . -type f | sort > "$PREUVES/06-contenu-du-kit.txt" )
if grep -rIl --exclude-dir=depot --exclude-dir=source -E 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.|sk-[A-Za-z0-9_-]{20,}|sbp_[a-f0-9]{30,}' "$TRAVAIL/kit" > "$PREUVES/07-grep-secrets.txt"; then echo "SECRET DÉTECTÉ PAR grep INDÉPENDANT"; cat "$PREUVES/07-grep-secrets.txt"; exit 1; else echo "grep indépendant : aucun motif de secret" | tee "$PREUVES/07-grep-secrets.txt"; fi

echo; echo "══ 3. Assistant guidé en simulation (réponses préparées, clés factices)"
# Les valeurs factices ne doivent ressembler à AUCUN format réel (préfixes sbp_, nfp_, GOCSPX-, suffixe apps.googleusercontent.com…) :
# la protection anti-secrets de GitHub bloque un push qui en contient, même factices — c'est voulu, et le kit fait de même.
cat > "$TRAVAIL/reponses.json" <<'JSON'
{
  "kit.continuer": "oui",
  "github.pousser": "oui",
  "github.url": "https://github.com/exemple/moknet-redeploye.git",
  "SUPABASE_ACCESS_TOKEN": "simulation-jeton-supabase-0123456789",
  "supabase.ref": "abcdefghijklmnopqrst",
  "supabase.projet_vide": "oui",
  "supabase.complements": "oui",
  "AI_CORE_SERVICE_TOKEN": "simulation-jeton-ai-core-0123456789",
  "secret.AI_CORE_BASE_URL": "https://ai-core.moknet.net",
  "secret.AI_CORE_PROJECT_ID": "6aeffdc5-e681-4ec4-ad36-7d9d71449d66",
  "secret.LIVE_TRANSPORT_ENVIRONMENT": "development",
  "secret.LIVE_NODE_METRICS_URL": "",
  "secret.HEALTH_ALLOWED_ORIGINS": "https://simulation.netlify.app",
  "auth.site_url": "https://simulation.netlify.app",
  "auth.google_client_id": "simulation-identifiant-client-google",
  "GOOGLE_OAUTH_CLIENT_SECRET": "simulation-secret-client-google-0123456789",
  "livekit.configurer": "oui",
  "livekit.environnement": "development",
  "livekit.url": "wss://live.exemple.test",
  "livekit.api_key": "simulation-cle-livekit",
  "LIVEKIT_API_SECRET": "simulation-secret-livekit-0123456789",
  "env.VITE_GOOGLE_MAPS_API_KEY": "",
  "NETLIFY_AUTH_TOKEN": "simulation-jeton-netlify-0123456789",
  "netlify.site_id": "",
  "netlify.nom": "moknet-simulation",
  "netlify.compte": "",
  "netlify.production": "",
  "admin.email": "direction@exemple.test"
}
JSON
node "$TRAVAIL/kit/assistant/redeployer.mjs" --destination "$TRAVAIL/redeploye" --simulation --reponses "$TRAVAIL/reponses.json" --sans-tests 2>&1 | tee "$PREUVES/08-assistant-simulation.log"
cp "$TRAVAIL/redeploye/rapport-redeploiement.md" "$PREUVES/09-rapport-redeploiement.md"
cp "$TRAVAIL/redeploye/.kit-redeploiement-etat.json" "$PREUVES/10-etat-reprise.json"

echo; echo "══ 4. Contrôles indépendants du résultat"
ATTENDU="$(node -e "console.log(require('$TRAVAIL/kit/manifeste.json').depot.head)")"
OBTENU="$(git -C "$TRAVAIL/redeploye/moknet" rev-parse HEAD)"
echo "commit attendu $ATTENDU / obtenu $OBTENU" | tee "$PREUVES/11-controles.log"
[ "$ATTENDU" = "$OBTENU" ]
echo "références restaurées : $(git -C "$TRAVAIL/redeploye/moknet" for-each-ref --format='%(refname)' refs/heads refs/remotes refs/tags | grep -vc '/HEAD$')" | tee -a "$PREUVES/11-controles.log"
git -C "$TRAVAIL/redeploye/moknet" for-each-ref --format='%(refname:short) %(objectname:short)' refs/heads refs/remotes refs/tags > "$PREUVES/12-references-restaurees.txt"
echo "fichiers suivis restaurés : $(git -C "$TRAVAIL/redeploye/moknet" ls-files | wc -l) (dépôt d'origine au commit sauvegardé : $(git -C "$RACINE" ls-tree -r --name-only "$ATTENDU" | wc -l))" | tee -a "$PREUVES/11-controles.log"
# Comparaison au COMMIT sauvegardé (pas à l'arbre de travail) : liste des fichiers, puis empreinte git de chacun. Bloquant.
if diff <(git -C "$RACINE" ls-tree -r --name-only "$ATTENDU" | sort) <(git -C "$TRAVAIL/redeploye/moknet" ls-files | sort) > "$PREUVES/13-diff-fichiers-suivis.txt"; then echo "liste des fichiers suivis : identique au commit sauvegardé" | tee -a "$PREUVES/11-controles.log"; else echo "LISTE DES FICHIERS DIFFÉRENTE (voir 13-diff-fichiers-suivis.txt)"; exit 1; fi
if diff <(git -C "$RACINE" ls-tree -r "$ATTENDU" --format='%(objectname) %(path)' | sort) <(git -C "$TRAVAIL/redeploye/moknet" ls-tree -r HEAD --format='%(objectname) %(path)' | sort) > "$PREUVES/14-diff-empreintes-blobs.txt"; then echo "empreintes git de chaque fichier : identiques au commit sauvegardé" | tee -a "$PREUVES/11-controles.log"; else echo "EMPREINTES DIFFÉRENTES (voir 14-diff-empreintes-blobs.txt)"; exit 1; fi
echo "commits accessibles dans le dépôt restauré : $(git -C "$TRAVAIL/redeploye/moknet" rev-list --count HEAD) (dépôt d'origine : $(git -C "$RACINE" rev-list --count "$ATTENDU"))" | tee -a "$PREUVES/11-controles.log"
[ "$(git -C "$TRAVAIL/redeploye/moknet" rev-list --count HEAD)" = "$(git -C "$RACINE" rev-list --count "$ATTENDU")" ]
ENV="$TRAVAIL/redeploye/moknet/.env"
echo "droits .env : $(stat -c '%a' "$ENV") ; ignoré par git : $(git -C "$TRAVAIL/redeploye/moknet" check-ignore -q .env && echo oui || echo NON)" | tee -a "$PREUVES/11-controles.log"
sed -E 's/=(.{3}).*/=\1…(masqué)/' "$ENV" > "$PREUVES/15-env-masque.txt"
grep -q '^VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co$' "$ENV"
grep -q '^VITE_SUPABASE_ANON_KEY=SIMULATION-ANON-KEY-abcdefghijklmnopqrst$' "$ENV"
grep -q '^VITE_GOOGLE_OAUTH_CLIENT_ID=simulation-identifiant-client-google$' "$ENV"
echo ".env : URL, clé anon et identifiant OAuth placés aux bons endroits" | tee -a "$PREUVES/11-controles.log"
BUNDLE="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$TRAVAIL/redeploye/moknet/dist/index.html" | head -1)"
echo "build réel : dist/index.html → $BUNDLE ($(du -sh "$TRAVAIL/redeploye/moknet/dist" | cut -f1))" | tee -a "$PREUVES/11-controles.log"
[ -n "$BUNDLE" ]
if grep -qE 'simulation-jeton-supabase|simulation-jeton-netlify|simulation-secret-client-google|simulation-secret-livekit|simulation-jeton-ai-core' "$PREUVES/08-assistant-simulation.log" "$PREUVES/09-rapport-redeploiement.md" "$PREUVES/10-etat-reprise.json"; then echo "FUITE : un secret factice apparaît dans un journal, le rapport ou l'état"; exit 1; fi
echo "aucun secret (même factice) dans le journal, le rapport ni l'état de reprise" | tee -a "$PREUVES/11-controles.log"
# Seules les lignes du tableau des contrôles comptent (la légende du rapport cite chaque pastille).
LIGNES="$(grep -E '^\| [0-9]+ \|' "$PREUVES/09-rapport-redeploiement.md")"
echo "contrôles dans le rapport : $(echo "$LIGNES" | wc -l) — verts : $(echo "$LIGNES" | grep -c '🟢 |$' || true) ; simulés (non éprouvés) : $(echo "$LIGNES" | grep -c '⬜ |$' || true) ; reportés : $(echo "$LIGNES" | grep -c '🟡 |$' || true) ; partiels : $(echo "$LIGNES" | grep -c '🟠 |$' || true) ; rouges : $(echo "$LIGNES" | grep -c '🔴 |$' || true)" | tee -a "$PREUVES/11-controles.log"
if echo "$LIGNES" | grep -q '🔴 |$'; then echo "un contrôle rouge dans le rapport"; echo "$LIGNES" | grep '🔴 |$'; exit 1; fi
if echo "$LIGNES" | grep -q '🟠 |$'; then echo "un contrôle partiel dans le rapport"; echo "$LIGNES" | grep '🟠 |$'; exit 1; fi
echo; echo "TEST LOCAL DU KIT : SUCCÈS — preuves dans $PREUVES" | tee -a "$PREUVES/11-controles.log"
