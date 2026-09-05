alter table public.ai_providers
    add column api_key_url text,
    add column billing_url text;

update public.ai_providers set api_key_url = v.api_key_url, billing_url = v.billing_url
from (values
    ('openai',      'https://platform.openai.com/api-keys',                 'https://platform.openai.com/settings/organization/billing/overview'),
    ('anthropic',   'https://console.anthropic.com/settings/keys',          'https://console.anthropic.com/settings/billing'),
    ('gemini',      'https://aistudio.google.com/apikey',                   'https://console.cloud.google.com/billing'),
    ('deepseek',    'https://platform.deepseek.com/api_keys',               'https://platform.deepseek.com/usage'),
    ('qwen',        'https://bailian.console.alibabacloud.com/?apiKey=1',   'https://usercenter2.aliyun.com/finance/expenditure'),
    ('kimi',        'https://platform.moonshot.cn/console/api-keys',        'https://platform.moonshot.cn/console/pay'),
    ('mistral',     'https://console.mistral.ai/api-keys',                  'https://console.mistral.ai/billing'),
    ('grok',        'https://console.x.ai',                                 'https://console.x.ai/team/default/billing'),
    ('openrouter',  'https://openrouter.ai/keys',                           'https://openrouter.ai/credits'),
    ('together',    'https://api.together.ai/settings/api-keys',            'https://api.together.ai/settings/billing'),
    ('fireworks',   'https://fireworks.ai/account/api-keys',                'https://fireworks.ai/account/billing'),
    ('cerebras',    'https://cloud.cerebras.ai/platform/apikeys',           'https://cloud.cerebras.ai/platform/billing'),
    ('huggingface', 'https://huggingface.co/settings/tokens',               'https://huggingface.co/settings/billing'),
    ('replicate',   'https://replicate.com/account/api-tokens',             'https://replicate.com/account/billing'),
    ('sambanova',   'https://cloud.sambanova.ai/apis',                      'https://cloud.sambanova.ai/billing'),
    ('dashscope',   'https://dashscope.console.aliyun.com/apiKey',          'https://usercenter2.aliyun.com/finance/expenditure'),
    ('elevenlabs',  'https://elevenlabs.io/app/settings/api-keys',          'https://elevenlabs.io/app/subscription'),
    ('cartesia',    'https://play.cartesia.ai/keys',                        'https://play.cartesia.ai/billing'),
    ('playht',      'https://play.ht/studio/api-access',                    'https://play.ht/app/billing'),
    ('azure_speech','https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub', 'https://portal.azure.com/#view/Microsoft_Azure_GTM/ModernBillingMenuBlade'),
    ('google_tts',  'https://console.cloud.google.com/apis/credentials',    'https://console.cloud.google.com/billing'),
    ('polly',       'https://console.aws.amazon.com/iam/home#/security_credentials', 'https://console.aws.amazon.com/billing/home'),
    ('assemblyai',  'https://www.assemblyai.com/app/api-keys',              'https://www.assemblyai.com/app/account'),
    ('deepgram',    'https://console.deepgram.com/project/_/keys',          'https://console.deepgram.com/project/_/billing'),
    ('whisper',     'https://platform.openai.com/api-keys',                 'https://platform.openai.com/settings/organization/billing/overview'),
    ('flux',        'https://api.bfl.ml',                                   'https://api.bfl.ml'),
    ('ideogram',    'https://ideogram.ai/manage-api',                       'https://ideogram.ai/manage-plan'),
    ('recraft',     'https://www.recraft.ai/profile/api',                   'https://www.recraft.ai/profile/billing'),
    ('leonardo',    'https://app.leonardo.ai/api-access',                   'https://app.leonardo.ai/settings/subscription'),
    ('runway',      'https://dev.runwayml.com',                            'https://app.runwayml.com/account/billing'),
    ('heygen',      'https://app.heygen.com/settings?nav=API',              'https://app.heygen.com/settings?nav=Billing'),
    ('kling',       'https://app.klingai.com',                             'https://app.klingai.com/membership'),
    ('pika',        'https://pika.art',                                    'https://pika.art/my-account'),
    ('luma',        'https://lumalabs.ai/dream-machine/api/keys',          'https://lumalabs.ai/dream-machine/billing'),
    ('veo',         'https://aistudio.google.com/apikey',                  'https://console.cloud.google.com/billing')
) as v(id, api_key_url, billing_url)
where public.ai_providers.id = v.id;
