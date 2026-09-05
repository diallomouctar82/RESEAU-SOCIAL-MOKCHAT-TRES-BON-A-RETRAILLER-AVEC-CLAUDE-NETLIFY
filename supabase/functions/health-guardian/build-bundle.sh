#!/usr/bin/env bash
# Fabrique l'artefact déployé de `health-guardian`, à partir des sources.
#
# POURQUOI CE SCRIPT EXISTE
#
# La version 1 déployée de cette fonction était un assemblage écrit À LA MAIN
# des trois fichiers source, et son propre en-tête le disait :
# « ARTEFACT DE DÉPLOIEMENT … la SOURCE DE VÉRITÉ reste le dépôt ». Un
# assemblage manuel finit toujours par diverger de ce qu'il assemble, et
# personne ne s'en aperçoit — sauf le jour où le tableau de bord de santé
# ment sur la santé.
#
# Depuis SAT-4, l'artefact est GÉNÉRÉ. On peut donc vérifier, à tout moment,
# que ce qui tourne en production correspond au dépôt : on rejoue ce script
# et on compare les octets.
#
# Usage :
#   ./supabase/functions/health-guardian/build-bundle.sh [chemin/de/sortie.js]
#
# Le résultat est un module ESM unique, sans dépendance relative, prêt à être
# déployé comme `index.ts`. Les spécificateurs `npm:` et `jsr:` restent
# EXTERNES : c'est le runtime Deno de Supabase qui les résout, exactement
# comme pour `livekit-token`.

set -euo pipefail

ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RACINE="$(cd "$ICI/../../.." && pwd)"
SORTIE="${1:-$ICI/bundle.generated.js}"

cd "$RACINE"
npx --yes esbuild "supabase/functions/health-guardian/index.ts" \
    --bundle \
    --format=esm \
    --platform=neutral \
    --target=deno1 \
    --external:'npm:*' \
    --external:'jsr:*' \
    --legal-comments=none \
    --banner:js='// ARTEFACT GÉNÉRÉ — NE PAS MODIFIER ICI.
//
// Produit par supabase/functions/health-guardian/build-bundle.sh à partir de
// index.ts + evaluate.ts + supabase.ts + liveTransportProbe.ts.
// La source de vérité est le dépôt : pour vérifier que la production
// correspond, rejouer le script et comparer les octets.' \
    --outfile="$SORTIE"

echo "Artefact : $SORTIE"
sha256sum "$SORTIE"
