-- ÉQUIPE 2 / AO-2 — Secours TTS haute définition réel.
-- Contexte mesuré : ElevenLabs à quota épuisé (0/39611) depuis le 30/08 —
-- tous les utilisateurs entendaient la voix de synthèse du navigateur.
-- Gemini possède une API TTS native (modèles *-tts) et sa clé est déjà
-- configurée et fonctionnelle : on déclare un fournisseur logique distinct
-- 'gemini_tts' (catégorie voice) dont la credential POINTE LE MÊME secret
-- Vault que 'gemini' — aucun secret dupliqué, aucune nouvelle clé à saisir.

insert into public.ai_providers (id, category, display_name, adapter_kind, priority, status, cost_tier, docs_url, api_key_url)
values (
  'gemini_tts', 'voice', 'Gemini TTS (Google)', 'gemini_tts', 100, 'active', 'free',
  'https://ai.google.dev/gemini-api/docs/speech-generation',
  'https://aistudio.google.com/apikey'
)
on conflict (id) do update set
  category = excluded.category,
  adapter_kind = excluded.adapter_kind,
  status = 'active';

insert into public.ai_models (provider_id, model_id, label, is_default, capabilities, input_cost_per_million, output_cost_per_million, cost_per_call)
select 'gemini_tts', 'gemini-2.5-flash-preview-tts', 'Gemini 2.5 Flash TTS (préversion)', true, '["tts"]'::jsonb, 0, 0, 0
where not exists (
  select 1 from public.ai_models where provider_id = 'gemini_tts' and model_id = 'gemini-2.5-flash-preview-tts'
);

-- Credential : réutilise le secret Vault de gemini (jamais dupliqué en clair).
insert into public.ai_provider_credentials (provider_id, vault_secret_id, key_hint, is_enabled)
select 'gemini_tts', c.vault_secret_id, coalesce(c.key_hint, '') || ' (partagée avec Gemini)', true
from public.ai_provider_credentials c
where c.provider_id = 'gemini' and c.is_enabled
  and not exists (select 1 from public.ai_provider_credentials x where x.provider_id = 'gemini_tts')
limit 1;
