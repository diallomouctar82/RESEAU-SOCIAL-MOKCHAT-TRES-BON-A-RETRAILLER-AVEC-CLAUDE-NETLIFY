type ProviderId = 'gemini' | 'openai' | 'deepseek' | 'claude' | 'qwen' | 'kimi' | 'mistral' | 'grok' | 'openrouter';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

const env = (name: string) => process.env[name]?.trim();

const providerConfig: Record<ProviderId, {
  keyNames: string[];
  endpoint?: string;
  defaultModel: string;
  kind: 'openai' | 'anthropic' | 'gemini';
}> = {
  gemini: { keyNames: ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'API_KEY'], defaultModel: 'gemini-2.5-flash', kind: 'gemini' },
  openai: { keyNames: ['OPENAI_API_KEY'], endpoint: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o-mini', kind: 'openai' },
  deepseek: { keyNames: ['DEEPSEEK_API_KEY'], endpoint: 'https://api.deepseek.com/chat/completions', defaultModel: 'deepseek-chat', kind: 'openai' },
  claude: { keyNames: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'], endpoint: 'https://api.anthropic.com/v1/messages', defaultModel: 'claude-3-5-sonnet-20241022', kind: 'anthropic' },
  qwen: { keyNames: ['QWEN_API_KEY', 'DASHSCOPE_API_KEY'], endpoint: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', defaultModel: 'qwen-plus', kind: 'openai' },
  kimi: { keyNames: ['KIMI_API_KEY', 'MOONSHOT_API_KEY'], endpoint: 'https://api.moonshot.cn/v1/chat/completions', defaultModel: 'moonshot-v1-32k', kind: 'openai' },
  mistral: { keyNames: ['MISTRAL_API_KEY'], endpoint: 'https://api.mistral.ai/v1/chat/completions', defaultModel: 'mistral-small-latest', kind: 'openai' },
  grok: { keyNames: ['XAI_API_KEY', 'GROK_API_KEY'], endpoint: 'https://api.x.ai/v1/chat/completions', defaultModel: 'grok-3-mini', kind: 'openai' },
  openrouter: { keyNames: ['OPENROUTER_API_KEY'], endpoint: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: 'openai/gpt-4o-mini', kind: 'openai' }
};

function getKey(names: string[]) {
  for (const name of names) {
    const value = env(name);
    if (value) return value;
  }
  return undefined;
}

async function callProvider(provider: ProviderId, body: any) {
  const cfg = providerConfig[provider];
  const apiKey = getKey(cfg.keyNames);
  if (!apiKey) throw new Error(`Clé serveur absente pour ${provider}`);
  const model = body.model || cfg.defaultModel;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const systemPrompt = body.systemPrompt || '';

  if (cfg.kind === 'gemini') {
    const parts = messages.map((m: any) => `${m.role || 'user'}: ${m.content || m.text || ''}`).join('\n');
    const prompt = systemPrompt ? `${systemPrompt}\n\n${parts}` : parts;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt || 'Bonjour' }] }] })
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    return { text, model };
  }

  if (cfg.kind === 'anthropic') {
    const response = await fetch(cfg.endpoint!, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: Number(body.max_tokens) || 2048,
        system: systemPrompt || undefined,
        messages: messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content || m.text || '' }))
      })
    });
    const data: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Anthropic HTTP ${response.status}`);
    return { text: data?.content?.[0]?.text || '', model };
  }

  const openAiMessages: any[] = [];
  if (systemPrompt) openAiMessages.push({ role: 'system', content: systemPrompt });
  openAiMessages.push(...messages.map((m: any) => ({ role: m.role === 'model' ? 'assistant' : (m.role || 'user'), content: m.content || m.text || '' })));
  const response = await fetch(cfg.endpoint!, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? { 'HTTP-Referer': 'https://lemondeavous.com', 'X-Title': 'Le Monde a Vous' } : {})
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      temperature: Number(body.temperature) || 0.7,
      max_tokens: Number(body.max_tokens) || 2048
    })
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `${provider} HTTP ${response.status}`);
  return { text: data?.choices?.[0]?.message?.content || '', model };
}

export default async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body: any = await request.json();
    const requested = String(body.provider || 'gemini').toLowerCase() as ProviderId;
    if (!providerConfig[requested]) return json({ error: `Fournisseur non supporté: ${requested}` }, 400);

    const result = await callProvider(requested, body);
    return json({ ...result, provider: requested, wasFailover: false });
  } catch (error: any) {
    console.error('[ai-chat]', error);
    return json({ error: error?.message || 'Erreur fournisseur IA', fallback: true }, 503);
  }
};
