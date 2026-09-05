#!/usr/bin/env bash
# Vérifie qu'une page servie (preview Netlify ou production) porte bien une version.
# usage : verif-page-servie.sh <url> <ancien-bundle.js> <fichier-marqueurs>
# Le fichier de marqueurs contient une ligne par contrôle :
#   html: <texte attendu dans la page servie>
#   js: <texte attendu dans le bundle principal>
#   absent-js: <texte de l'ancien code qui doit avoir disparu du bundle>
# Sortie : chaque contrôle avec son compte (attendu 1 ou plus pour html/js, 0 pour absent-js),
# le code HTTP de l'ancien bundle (attendu 404) et les en-têtes de cache du bundle servi.
set -u
H="${1:?url}"; ANCIEN="${2:?ancien bundle}"; MARQUEURS="${3:?fichier de marqueurs}"; T=$(mktemp -d)
code=$(curl -sS -o "$T/index.html" -w "%{http_code}" -H 'Cache-Control: no-cache' "$H/")
echo "GET $H/ -> $code ($(wc -c < "$T/index.html") octets) $(date -u +%H:%M:%S) UTC"
js=$(grep -o 'assets/index-[A-Za-z0-9_-]*\.js' "$T/index.html" | head -1)
echo "bundle principal : $js"
curl -sS -o "$T/b.js" -w "  GET bundle -> %{http_code} (%{size_download} octets)\n" "$H/$js"
ko=0
while IFS= read -r ligne; do
  [ -z "$ligne" ] && continue
  case "$ligne" in
    "html: "*) m="${ligne#html: }"; n=$(grep -c -F -- "$m" "$T/index.html"); [ "$n" -ge 1 ] || ko=1; echo "  html '$m' : $n" ;;
    "js: "*) m="${ligne#js: }"; n=$(grep -a -c -F -- "$m" "$T/b.js"); [ "$n" -ge 1 ] || ko=1; echo "  js '$m' : $n" ;;
    "absent-js: "*) m="${ligne#absent-js: }"; n=$(grep -a -c -F -- "$m" "$T/b.js"); [ "$n" -eq 0 ] || ko=1; echo "  js ABSENT '$m' : $n (attendu 0)" ;;
    \#*) ;;
    *) echo "  ligne ignorée : $ligne" ;;
  esac
done < "$MARQUEURS"
c=$(curl -sS -o /dev/null -w "%{http_code}" "$H/assets/$ANCIEN"); [ "$c" = "404" ] || ko=1
echo "  ancien bundle $ANCIEN -> $c (attendu 404)"
curl -sS -o /dev/null -D - "$H/$js" 2>/dev/null | grep -i -E "^(cache-control|etag|x-nf-request-id|date):" | sed 's/^/  /'
rm -rf "$T"
if [ "$ko" = "0" ]; then echo "VERDICT : conforme"; else echo "VERDICT : NON CONFORME (au moins un contrôle en écart)"; exit 1; fi
