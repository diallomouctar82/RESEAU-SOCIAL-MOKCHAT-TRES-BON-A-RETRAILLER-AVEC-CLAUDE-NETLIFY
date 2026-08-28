const CONNECTORS = [
  ['gemini', 'Google Gemini', ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'API_KEY'], 'https://aistudio.google.com/app/apikey'],
  ['openai', 'OpenAI', ['OPENAI_API_KEY'], 'https://platform.openai.com/api-keys'],
  ['deepseek', 'DeepSeek', ['DEEPSEEK_API_KEY'], 'https://platform.deepseek.com/api_keys'],
  ['claude', 'Anthropic Claude', ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'], 'https://console.anthropic.com/settings/keys'],
  ['qwen', 'Qwen / DashScope', ['QWEN_API_KEY', 'DASHSCOPE_API_KEY'], 'https://dashscope.console.aliyun.com/'],
  ['kimi', 'Kimi / Moonshot', ['KIMI_API_KEY', 'MOONSHOT_API_KEY'], 'https://platform.moonshot.cn/console/api-keys'],
  ['mistral', 'Mistral', ['MISTRAL_API_KEY'], 'https://console.mistral.ai/api-keys/'],
  ['grok', 'xAI Grok', ['XAI_API_KEY', 'GROK_API_KEY'], 'https://console.x.ai/'],
  ['openrouter', 'OpenRouter', ['OPENROUTER_API_KEY'], 'https://openrouter.ai/keys'],
  ['elevenlabs', 'ElevenLabs', ['ELEVENLABS_API_KEY'], 'https://elevenlabs.io/app/settings/api-keys']
] as const;

export default async () => {
  const connectors = CONNECTORS.map(([id, name, envNames, portalUrl]) => {
    const configuredEnv = envNames.find(key => !!process.env[key]?.trim());
    return {
      id,
      provider: id,
      name,
      envKey: envNames[0],
      acceptedEnvKeys: envNames,
      portalUrl,
      isConfigured: !!configuredEnv,
      detectedEnvVar: configuredEnv || null,
      maskedKey: configuredEnv ? '••••••••configured••••' : null
    };
  });

  return new Response(JSON.stringify({
    total: connectors.length,
    configuredCount: connectors.filter(c => c.isConfigured).length,
    connectors
  }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
