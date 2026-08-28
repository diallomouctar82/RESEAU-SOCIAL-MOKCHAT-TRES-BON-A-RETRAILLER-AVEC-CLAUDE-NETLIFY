const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

export default async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return json({ error: 'ELEVENLABS_API_KEY non configurée', fallback: true }, 503);

  try {
    const body: any = await request.json();
    const text = String(body.text || '').trim();
    const voiceId = String(body.voiceId || '').trim();
    if (!text || !voiceId) return json({ error: 'text et voiceId sont obligatoires' }, 400);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'xi-api-key': apiKey,
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: body.modelId || 'eleven_multilingual_v2',
        voice_settings: {
          stability: Number(body.stability ?? 0.5),
          similarity_boost: Number(body.similarity_boost ?? 0.8),
          style: Number(body.style ?? 0.15),
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      return json({ error: `ElevenLabs HTTP ${response.status}`, details: details.slice(0, 400), fallback: true }, 502);
    }

    return new Response(await response.arrayBuffer(), {
      status: 200,
      headers: {
        'content-type': response.headers.get('content-type') || 'audio/mpeg',
        'cache-control': 'private, max-age=300'
      }
    });
  } catch (error: any) {
    console.error('[tts]', error);
    return json({ error: error?.message || 'Erreur TTS', fallback: true }, 500);
  }
};
