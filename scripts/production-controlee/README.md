# Outils de la production contrôlée

Appui de la compétence `.claude/skills/production-controlee/SKILL.md` (méthode de référence validée par la Direction le 5 septembre 2026). Aucun secret, aucun appel autre que la page servie et l'API publique GitHub.

| Fichier | Rôle | Usage |
| :--- | :--- | :--- |
| `verif-page-servie.sh` | Vérifie qu'un preview ou la production sert bien une version : marqueurs HTML, marqueurs du bundle, chaînes de l'ancien code absentes, ancien bundle → 404, en-têtes. | `verif-page-servie.sh https://moknet.net index-ANCIEN.js marqueurs.txt` |
| `marqueurs.example.txt` | Exemple de fichier de marqueurs (une ligne par contrôle : `html:`, `js:`, `absent-js:`). | à copier et adapter par mission |
| `mirror-serve.py` | Miroir local d'un site servi (chaque chemin récupéré une fois par `curl`, via le proxy) pour l'ouvrir dans Chromium headless. | `python3 mirror-serve.py 3007 https://moknet.net /tmp/cache` |
| `poll-green-gate.sh` | Suit le run « CI — Green Gate » d'un SHA jusqu'à son terme. | `poll-green-gate.sh <sha> journal.log` (en arrière-plan) |
| `preview-harness.tsx.example` | Gabarit du harnais de capture (Layout + écran, sans Supabase). | copier en `preview-harness.tsx` à la racine, exclure de git |
| `capture-avant-apres.example.cjs` | Gabarit Playwright : trois écrans, page + élément, mesures JSON, gestes (saisie, modale, studio, insertion). | copier hors dépôt, adapter les sélecteurs |
| `smoke-miroir.example.cjs` | Gabarit Playwright de fumée sur un miroir local : racine React montée, règles CSS analysées, `@container`, captures. | copier hors dépôt, adapter les sélecteurs |

Prérequis des gabarits Playwright : un dossier hors dépôt avec `playwright` installé, Chromium en `/opt/pw-browsers/chromium`, `PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1`, proxy contourné pour `localhost,127.0.0.1`. Le harnais est régénéré après chaque modification d'`index.html` :

```
sed -e 's#src="/index.tsx"#src="/preview-harness.tsx"#' -e 's#https://cdn.tailwindcss.com#/tailwind-play.js#' index.html > preview-harness.html
```
