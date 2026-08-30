#!/usr/bin/env bash
# Déploiement LiveKit Server sur le VPS Hostinger (LOOP 15/16).
# À exécuter DIRECTEMENT sur le VPS, avec Docker + le plugin "docker compose"
# déjà installés, depuis ce dossier (deploy/livekit/).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -f .env.production ]; then
  echo "Erreur : .env.production introuvable." >&2
  echo "Copiez .env.production.example en .env.production et renseignez les vraies valeurs avant de relancer." >&2
  exit 1
fi

# Refuse de démarrer avec les valeurs d'exemple non modifiées — évite un
# serveur LiveKit accessible publiquement avec des identifiants connus.
if grep -qE '^(LIVEKIT_API_KEY|LIVEKIT_API_SECRET)=changeme' .env.production; then
  echo "Erreur : .env.production contient encore une valeur d'exemple (changeme...)." >&2
  echo "Générez de vraies valeurs avant de déployer (voir les commentaires du fichier)." >&2
  exit 1
fi

echo "→ Récupération des images (livekit-server, redis, caddy)..."
docker compose --env-file .env.production pull

echo "→ Démarrage des conteneurs..."
docker compose --env-file .env.production up -d

echo
echo "✅ LiveKit Server est démarré."
echo
echo "Étape suivante (à faire une seule fois, hors de ce serveur — voir README.md) :"
echo "  enregistrer wss://\$LIVEKIT_DOMAIN comme configuration 'production' dans"
echo "  la table Supabase live_transport_config, puis activer"
echo "  LIVE_TRANSPORT_ENVIRONMENT=production sur l'Edge Function livekit-token."
