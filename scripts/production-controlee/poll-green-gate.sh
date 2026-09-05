#!/usr/bin/env bash
# Suit le run « CI — Green Gate » d'un SHA jusqu'à son terme (20 min au plus).
# usage : poll-green-gate.sh <sha> <journal> [owner/repo]
# Écrit une ligne horodatée par relevé dans <journal> ; termine à « completed ».
# Un SHA de PR sans aucun run après plusieurs minutes signale une PR en conflit
# (GitHub ne lance pas les workflows pull_request sur une tête non fusionnable).
SHA="${1:?sha}"; OUT="${2:?journal}"; REPO="${3:-diallomouctar82/RESEAU-SOCIAL-MOKCHAT-TRES-BON-A-RETRAILLER-AVEC-CLAUDE-NETLIFY}"
for i in $(seq 1 60); do
  J=$(curl -s "https://api.github.com/repos/$REPO/actions/runs?head_sha=$SHA&per_page=5")
  LIGNE=$(echo "$J" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const r=(j.workflow_runs||[]).map(x=>`${x.name}|${x.id}|${x.status}|${x.conclusion}`);console.log(r.join(" ; ")||"aucun run");}catch(e){console.log("erreur json")}})')
  echo "$(date -u +%H:%M:%S) $LIGNE" >> "$OUT"
  case "$LIGNE" in *"|completed|"*) exit 0;; esac
  sleep 20
done
echo "$(date -u +%H:%M:%S) délai dépassé" >> "$OUT"; exit 2
