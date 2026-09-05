-- ============================================================================
-- COMPLÉMENTS HORS MIGRATIONS — kit de sauvegarde MokNet
-- Objets relevés sur le projet de production le 5 septembre 2026 qui
-- n'apparaissent dans AUCUNE des 110 migrations : créés à la main (tableau de
-- bord ou SQL direct). L'assistant de redéploiement les applique APRÈS les
-- migrations, avec une confirmation. Idempotent. Aucune donnée, aucun secret.
-- ============================================================================

-- 1. Bucket de stockage « mok bouker » (privé). Les buckets `public` et
--    `private` sont créés par 20260827140912_storage_buckets_and_policies.
insert into storage.buckets (id, name, public)
values ('mok bouker', 'mok bouker', false)
on conflict (id) do nothing;

-- 2. Les entrées du coffre (vault.secrets) ne sont PAS recréées ici : leurs
--    valeurs sont des secrets. Noms relevés en production (à recréer par
--    l'assistant ou par l'application elle-même) :
--      ai_provider:anthropic, ai_provider:deepgram, ai_provider:deepseek,
--      ai_provider:elevenlabs, ai_provider:gemini, ai_provider:heygen,
--      ai_provider:ideogram, ai_provider:kimi, ai_provider:kling,
--      ai_provider:openai, ai_provider:openrouter, ai_provider:runway,
--      ai_provider:veo                → saisis dans Super Admin → Connecteurs & Modèles IA
--                                        (RPC set_ai_provider_secret, jamais en clair ailleurs)
--      live_transport_dev_livekit,
--      livekit-production-secret      → étape « LiveKit » de l'assistant (vault.create_secret
--                                        + ligne public.live_transport_config)
--      push_vapid_private_<horodatage> → générée AUTOMATIQUEMENT par la fonction Edge
--                                        push-notify au premier envoi (store_push_vapid_internal)

-- 3. Lignes de configuration relevées (2 lignes dans public.live_transport_config :
--    development et production) : recréées par l'étape LiveKit de l'assistant,
--    jamais copiées ici (elles pointent vers des secrets du coffre).
