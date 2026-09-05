-- Active les 22 fournisseurs restants : adapter_kind réel + status='active'.
-- 3 LLM se branchent sur l'adaptateur openai_compatible déjà existant
-- (base_url mis à jour) ; les 19 autres utilisent leurs adaptateurs dédiés
-- déployés dans cette même mise à jour de ai-gateway.

update public.ai_providers set adapter_kind = 'openai_compatible', base_url = 'https://api.sambanova.ai/v1', status = 'active' where id = 'sambanova';
update public.ai_providers set adapter_kind = 'openai_compatible', base_url = 'https://dashscope.aliyuncs.com/compatible-mode/v1', status = 'active' where id = 'dashscope';
update public.ai_providers set adapter_kind = 'openai_compatible', base_url = 'https://router.huggingface.co/v1', status = 'active' where id = 'huggingface';
update public.ai_providers set adapter_kind = 'replicate', status = 'active' where id = 'replicate';

update public.ai_providers set adapter_kind = 'whisper', status = 'active' where id = 'whisper';
update public.ai_providers set adapter_kind = 'deepgram', status = 'active' where id = 'deepgram';
update public.ai_providers set adapter_kind = 'assemblyai', status = 'active' where id = 'assemblyai';
update public.ai_providers set adapter_kind = 'cartesia', status = 'active' where id = 'cartesia';
update public.ai_providers set adapter_kind = 'playht', status = 'active' where id = 'playht';
update public.ai_providers set adapter_kind = 'azure_speech', status = 'active' where id = 'azure_speech';
update public.ai_providers set adapter_kind = 'google_tts', status = 'active' where id = 'google_tts';
update public.ai_providers set adapter_kind = 'polly', status = 'active' where id = 'polly';

update public.ai_providers set adapter_kind = 'flux', status = 'active' where id = 'flux';
update public.ai_providers set adapter_kind = 'ideogram', status = 'active' where id = 'ideogram';
update public.ai_providers set adapter_kind = 'recraft', status = 'active' where id = 'recraft';
update public.ai_providers set adapter_kind = 'leonardo', status = 'active' where id = 'leonardo';
update public.ai_providers set adapter_kind = 'runway', status = 'active' where id = 'runway';
update public.ai_providers set adapter_kind = 'heygen', status = 'active' where id = 'heygen';
update public.ai_providers set adapter_kind = 'kling', status = 'active' where id = 'kling';
update public.ai_providers set adapter_kind = 'pika', status = 'active' where id = 'pika';
update public.ai_providers set adapter_kind = 'luma', status = 'active' where id = 'luma';
update public.ai_providers set adapter_kind = 'veo', status = 'active' where id = 'veo';

-- Modèle par défaut pour chaque fournisseur nouvellement actif (nécessaire :
-- ai-gateway refuse d'appeler un fournisseur sans modèle par défaut configuré).
insert into public.ai_models (provider_id, model_id, label, is_default, capabilities) values
('sambanova',   'Meta-Llama-3.3-70B-Instruct', 'Llama 3.3 70B (SambaNova)', true, '{"text":true,"json":true}'),
('dashscope',   'qwen-plus',                    'Qwen Plus (DashScope natif)', true, '{"text":true,"json":true}'),
('huggingface', 'meta-llama/Llama-3.3-70B-Instruct', 'Llama 3.3 70B (HF Router)', true, '{"text":true,"json":true}'),
('replicate',   'meta/meta-llama-3-70b-instruct', 'Llama 3 70B Instruct', true, '{"text":true}'),
('whisper',     'whisper-1', 'Whisper v1', true, '{"stt":true}'),
('deepgram',    'nova-2', 'Nova 2', true, '{"stt":true}'),
('assemblyai',  'default', 'Transcription standard', true, '{"stt":true}'),
('cartesia',    'sonic-2', 'Sonic 2', true, '{"tts":true}'),
('playht',      'PlayHT2.0', 'PlayHT 2.0', true, '{"tts":true}'),
('azure_speech','fr-FR-DeniseNeural', 'Denise (FR, neural)', true, '{"tts":true}'),
('google_tts',  'fr-FR-Neural2-A', 'Neural2 A (FR)', true, '{"tts":true}'),
('polly',       'Lea', 'Léa (FR, neural)', true, '{"tts":true}'),
('flux',        'flux-pro-1.1', 'Flux Pro 1.1', true, '{"image":true}'),
('ideogram',    'V_2', 'Ideogram V2', true, '{"image":true}'),
('recraft',     'recraftv3', 'Recraft V3', true, '{"image":true}'),
('leonardo',    '6bef9f1a-29cb-40c7-b9df-32b51c1f67d3', 'Leonardo Phoenix', true, '{"image":true}'),
('runway',      'gen3a_turbo', 'Gen-3 Alpha Turbo', true, '{"video":true}'),
('heygen',      'default', 'Avatar par défaut', true, '{"video":true}'),
('kling',       'kling-v1', 'Kling v1', true, '{"video":true}'),
('pika',        'pika-1.5', 'Pika 1.5', true, '{"video":true}'),
('luma',        'ray-2', 'Dream Machine Ray 2', true, '{"video":true}'),
('veo',         'veo-3.0-generate-001', 'Veo 3', true, '{"video":true}');
