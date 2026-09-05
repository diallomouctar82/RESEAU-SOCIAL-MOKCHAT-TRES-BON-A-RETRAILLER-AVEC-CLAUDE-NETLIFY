-- Catalogue complet des fournisseurs demandés (35 au total : 16 LLM, 9 voix, 10 image/vidéo).
-- 13 actifs et réellement implémentés (12 LLM + ElevenLabs), 22 enregistrés en 'not_implemented'
-- (emplacement de configuration prêt, adaptateur à ajouter plus tard).

insert into public.ai_providers (id, category, display_name, adapter_kind, base_url, priority, status) values
-- LLM actifs (openai_compatible : un seul adaptateur, paramétré par base_url)
('openai',      'llm', 'OpenAI',              'openai_compatible', 'https://api.openai.com/v1',                     10, 'active'),
('anthropic',   'llm', 'Anthropic (Claude)',  'anthropic',          'https://api.anthropic.com',                     20, 'active'),
('gemini',      'llm', 'Google Gemini',       'gemini',             'https://generativelanguage.googleapis.com',     30, 'active'),
('deepseek',    'llm', 'DeepSeek',            'openai_compatible', 'https://api.deepseek.com/v1',                   40, 'active'),
('qwen',        'llm', 'Qwen (DashScope)',    'openai_compatible', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 50, 'active'),
('kimi',        'llm', 'Kimi (Moonshot)',     'openai_compatible', 'https://api.moonshot.cn/v1',                    60, 'active'),
('mistral',     'llm', 'Mistral',             'openai_compatible', 'https://api.mistral.ai/v1',                     70, 'active'),
('grok',        'llm', 'Grok (xAI)',          'openai_compatible', 'https://api.x.ai/v1',                           80, 'active'),
('openrouter',  'llm', 'OpenRouter',          'openai_compatible', 'https://openrouter.ai/api/v1',                  90, 'active'),
('together',    'llm', 'Together AI',         'openai_compatible', 'https://api.together.xyz/v1',                  100, 'active'),
('fireworks',   'llm', 'Fireworks AI',        'openai_compatible', 'https://api.fireworks.ai/inference/v1',        110, 'active'),
('cerebras',    'llm', 'Cerebras',            'openai_compatible', 'https://api.cerebras.ai/v1',                   120, 'active'),
-- LLM non configurés (catalogue prêt, adaptateur à venir)
('huggingface', 'llm', 'Hugging Face',        'unimplemented', null, 200, 'not_implemented'),
('replicate',   'llm', 'Replicate',           'unimplemented', null, 210, 'not_implemented'),
('sambanova',   'llm', 'SambaNova',           'unimplemented', null, 220, 'not_implemented'),
('dashscope',   'llm', 'DashScope (natif)',   'unimplemented', null, 230, 'not_implemented'),
-- Voix actif
('elevenlabs',  'voice', 'ElevenLabs',        'elevenlabs',         'https://api.elevenlabs.io/v1',                  10, 'active'),
-- Voix non configurés
('cartesia',      'voice', 'Cartesia',        'unimplemented', null, 100, 'not_implemented'),
('playht',        'voice', 'PlayHT',          'unimplemented', null, 110, 'not_implemented'),
('azure_speech',  'voice', 'Azure Speech',    'unimplemented', null, 120, 'not_implemented'),
('google_tts',    'voice', 'Google TTS',      'unimplemented', null, 130, 'not_implemented'),
('polly',         'voice', 'Amazon Polly',    'unimplemented', null, 140, 'not_implemented'),
('assemblyai',    'voice', 'AssemblyAI',      'unimplemented', null, 150, 'not_implemented'),
('deepgram',      'voice', 'Deepgram',        'unimplemented', null, 160, 'not_implemented'),
('whisper',       'voice', 'Whisper',         'unimplemented', null, 170, 'not_implemented'),
-- Image / vidéo non configurés
('flux',      'image_video', 'Flux',          'unimplemented', null, 100, 'not_implemented'),
('ideogram',  'image_video', 'Ideogram',      'unimplemented', null, 110, 'not_implemented'),
('recraft',   'image_video', 'Recraft',       'unimplemented', null, 120, 'not_implemented'),
('leonardo',  'image_video', 'Leonardo',      'unimplemented', null, 130, 'not_implemented'),
('runway',    'image_video', 'Runway',        'unimplemented', null, 140, 'not_implemented'),
('heygen',    'image_video', 'HeyGen',        'unimplemented', null, 150, 'not_implemented'),
('kling',     'image_video', 'Kling',         'unimplemented', null, 160, 'not_implemented'),
('pika',      'image_video', 'Pika',          'unimplemented', null, 170, 'not_implemented'),
('luma',      'image_video', 'Luma',          'unimplemented', null, 180, 'not_implemented'),
('veo',       'image_video', 'Veo',           'unimplemented', null, 190, 'not_implemented');

insert into public.ai_models (provider_id, model_id, label, is_default, capabilities) values
('openai',     'gpt-4o',                                              'GPT-4o',                       true,  '{"text":true,"json":true,"vision":true,"streaming":true}'),
('openai',     'gpt-4o-mini',                                         'GPT-4o mini',                  false, '{"text":true,"json":true,"vision":true,"streaming":true}'),
('anthropic',  'claude-sonnet-4-5-20250929',                          'Claude Sonnet 4.5',            true,  '{"text":true,"json":true,"vision":true,"streaming":true}'),
('anthropic',  'claude-haiku-4-5-20251001',                           'Claude Haiku 4.5',             false, '{"text":true,"json":true,"vision":true,"streaming":true}'),
('gemini',     'gemini-2.5-flash',                                    'Gemini 2.5 Flash',             true,  '{"text":true,"json":true,"vision":true,"streaming":true}'),
('gemini',     'gemini-3-pro-preview',                                'Gemini 3 Pro (preview)',       false, '{"text":true,"json":true,"vision":true,"streaming":true}'),
('deepseek',   'deepseek-chat',                                       'DeepSeek Chat',                true,  '{"text":true,"json":true}'),
('qwen',       'qwen-plus',                                           'Qwen Plus',                    true,  '{"text":true,"json":true}'),
('kimi',       'moonshot-v1-8k',                                      'Moonshot v1 8k',               true,  '{"text":true,"json":true}'),
('mistral',    'mistral-large-latest',                                'Mistral Large',                true,  '{"text":true,"json":true}'),
('grok',       'grok-3',                                              'Grok 3',                       true,  '{"text":true,"json":true}'),
('openrouter', 'openai/gpt-4o',                                       'GPT-4o (via OpenRouter)',      true,  '{"text":true,"json":true}'),
('together',   'meta-llama/Llama-3.3-70B-Instruct-Turbo',             'Llama 3.3 70B Turbo',          true,  '{"text":true,"json":true}'),
('fireworks',  'accounts/fireworks/models/llama-v3p3-70b-instruct',   'Llama 3.3 70B (Fireworks)',    true,  '{"text":true,"json":true}'),
('cerebras',   'llama3.1-70b',                                        'Llama 3.1 70B (Cerebras)',     true,  '{"text":true,"json":true}'),
('elevenlabs', 'eleven_multilingual_v2',                              'Eleven Multilingual v2',       true,  '{"tts":true}');
