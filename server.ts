import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Catalogue des voix ElevenLabs recommandées pour les experts Diallo
const CURATED_VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "Professeur Diallo (George)", specialty: "Éducation & Cours Supérieurs", gender: "male", preview: "Chaleureux, savant et posé" },
  { id: "ErXwobaYiN019PkySvjV", name: "Professeur Diallo (Antoni)", specialty: "Pédagogie & Méthode", gender: "male", preview: "Clair et structuré" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Directeur Diallo (Adam)", specialty: "Direction & Stratégie", gender: "male", preview: "Grave, autoritaire et bienveillant" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Maître Diallo (Roger)", specialty: "Juridique & Contentieux", gender: "male", preview: "Distingué et éloquent" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Conseiller Diallo (Callum)", specialty: "Emploi & Carrières", gender: "male", preview: "Dynamique et motivant" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Dr Diallo (Liam)", specialty: "Santé & Médecine", gender: "male", preview: "Rassurant et précis" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Monsieur Diallo (Daniel)", specialty: "Logement & Vie Pratique", gender: "male", preview: "Pragmatique et accessible" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Guide Diallo (Arnold)", specialty: "Voyages & Démarches", gender: "male", preview: "Engageant et dynamique" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Analyste Diallo (Bill)", specialty: "Finance & Marchés", gender: "male", preview: "Rationnel et précis" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Docteure Diallo (Rachel)", specialty: "Consultation & Langues", gender: "female", preview: "Douce, claire et posée" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Conseillère Diallo (Bella)", specialty: "Orientation & Jeunesse", gender: "female", preview: "Expressive et chaleureuse" }
];

// Métadonnées & Portails des Connecteurs IA
const AI_CONNECTORS_METADATA = [
  {
    id: "deepseek",
    name: "DeepSeek AI (V3 & R1)",
    category: "llm_reasoning",
    portalUrl: "https://platform.deepseek.com/api_keys",
    envKey: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    endpoint: "https://api.deepseek.com/chat/completions",
    type: "openai_compatible",
    capabilities: ["chat", "code", "reasoning"]
  },
  {
    id: "claude",
    name: "Anthropic Claude (3.5 Sonnet / Haiku)",
    category: "llm_reasoning",
    portalUrl: "https://console.anthropic.com/settings/keys",
    envKey: "ANTHROPIC_API_KEY",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    endpoint: "https://api.anthropic.com/v1/messages",
    type: "anthropic",
    capabilities: ["chat", "code", "reasoning", "vision"]
  },
  {
    id: "openai",
    name: "OpenAI (GPT-4o & o1/o3)",
    category: "llm_reasoning",
    portalUrl: "https://platform.openai.com/api-keys",
    envKey: "OPENAI_API_KEY",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o3-mini"],
    endpoint: "https://api.openai.com/v1/chat/completions",
    type: "openai_compatible",
    capabilities: ["chat", "code", "reasoning", "vision"]
  },
  {
    id: "qwen",
    name: "Alibaba Qwen / DashScope (2.5 72B)",
    category: "llm_reasoning",
    portalUrl: "https://dashscope.console.aliyun.com/",
    envKey: "QWEN_API_KEY",
    defaultModel: "qwen-plus",
    models: ["qwen-plus", "qwen-max", "qwen-turbo", "qwen2.5-72b-instruct"],
    endpoint: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
    type: "openai_compatible",
    capabilities: ["chat", "code", "reasoning"]
  },
  {
    id: "kimi",
    name: "Moonshot Kimi K3 & K1.5 (128k)",
    category: "llm_reasoning",
    portalUrl: "https://platform.moonshot.cn/console/api-keys",
    envKey: "KIMI_API_KEY",
    defaultModel: "moonshot-v1-32k",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    type: "openai_compatible",
    capabilities: ["chat", "reasoning"]
  },
  {
    id: "openrouter",
    name: "OpenRouter Multi-LLM Gateway (200+ Modèles)",
    category: "llm_reasoning",
    portalUrl: "https://openrouter.ai/keys",
    envKey: "OPENROUTER_API_KEY",
    defaultModel: "anthropic/claude-3.5-sonnet",
    models: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "deepseek/deepseek-r1", "meta-llama/llama-3.3-70b-instruct"],
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    type: "openai_compatible",
    capabilities: ["chat", "code", "reasoning", "vision"]
  },
  {
    id: "kling",
    name: "Kling AI 1.5 (Génération Vidéo Cinématique)",
    category: "video_generation",
    portalUrl: "https://klingai.com/",
    envKey: "KLING_API_KEY",
    defaultModel: "kling-v1.5-pro",
    models: ["kling-v1.5-pro", "kling-v1-standard"],
    endpoint: "https://api.klingai.com/v1/videos/text2video",
    type: "kling_video",
    capabilities: ["text_to_video", "image_to_video"]
  },
  {
    id: "runway",
    name: "RunwayML Gen-3 Alpha & Gen-2 (Vidéo Studio)",
    category: "video_generation",
    portalUrl: "https://app.runwayml.com/settings/api-keys",
    envKey: "RUNWAY_API_KEY",
    defaultModel: "gen3a_turbo",
    models: ["gen3a_turbo", "gen3_alpha", "gen2"],
    endpoint: "https://api.runwayml.com/v1/tasks",
    type: "runway_video",
    capabilities: ["text_to_video", "image_to_video"]
  },
  {
    id: "heygene",
    name: "HeyGen Interactive Avatar & Talking Photo",
    category: "avatar_speech",
    portalUrl: "https://app.heygen.com/settings?nav=API",
    envKey: "HEYGEN_API_KEY",
    defaultModel: "avatar_v2_streaming",
    models: ["avatar_v2_streaming", "talking_photo_hd"],
    endpoint: "https://api.heygen.com/v2/video/generate",
    type: "heygen_avatar",
    capabilities: ["talking_avatar", "voice_synthesis"]
  },
  {
    id: "n8n",
    name: "n8n Workflow Automation & Pipeline Engine",
    category: "workflow_automation",
    portalUrl: "https://n8n.io/",
    envKey: "N8N_WEBHOOK_URL",
    defaultModel: "webhook-pipeline-v1",
    models: ["webhook-pipeline-v1", "autonomous-agent-flow"],
    endpoint: "custom_webhook",
    type: "n8n_webhook",
    capabilities: ["workflow_webhook"]
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs Studio HD Multilingual TTS",
    category: "avatar_speech",
    portalUrl: "https://elevenlabs.io/app/settings/api-keys",
    envKey: "ELEVENLABS_API_KEY",
    defaultModel: "eleven_multilingual_v2",
    models: ["eleven_multilingual_v2", "eleven_turbo_v2_5"],
    endpoint: "https://api.elevenlabs.io/v1/text-to-speech",
    type: "elevenlabs_tts",
    capabilities: ["voice_synthesis"]
  },
  {
    id: "gemini",
    name: "Google Gemini Core (Natif Multimodal)",
    category: "multimodal",
    portalUrl: "https://aistudio.google.com/app/apikey",
    envKey: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"],
    endpoint: "google_genai_native",
    type: "gemini_native",
    capabilities: ["chat", "code", "reasoning", "vision"]
  }
];

function getKeyForProvider(envKey: string): string | undefined {
  if (envKey === 'GEMINI_API_KEY') {
    return process.env.GEMINI_API_KEY || 
           process.env.API_KEY || 
           process.env.VITE_GEMINI_API_KEY || 
           process.env.VITE_API_KEY;
  }
  return process.env[envKey] || 
         process.env[`VITE_${envKey}`] || 
         (envKey === 'ANTHROPIC_API_KEY' ? (process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY) : undefined) ||
         (envKey === 'QWEN_API_KEY' ? (process.env.DASHSCOPE_API_KEY || process.env.VITE_QWEN_API_KEY) : undefined) ||
         (envKey === 'KIMI_API_KEY' ? (process.env.MOONSHOT_API_KEY || process.env.VITE_KIMI_API_KEY) : undefined) ||
         (envKey === 'KLING_API_KEY' ? (process.env.KLING_ACCESS_KEY || process.env.VITE_KLING_API_KEY) : undefined);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // 1. Healthcheck
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 2. Info ElevenLabs & Voix Disponibles
  app.get("/api/tts/voices", (_req, res) => {
    const apiKey = getKeyForProvider("ELEVENLABS_API_KEY");
    res.json({
      isConfigured: !!apiKey,
      defaultModel: "eleven_multilingual_v2",
      voices: CURATED_VOICES
    });
  });

  // 3. Connecteurs IA Disponibles & Statuts
  app.get("/api/ai/connectors", (_req, res) => {
    const connectors = AI_CONNECTORS_METADATA.map((meta) => {
      const key = getKeyForProvider(meta.envKey);
      return {
        ...meta,
        isConfigured: !!key,
        maskedKey: key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : null
      };
    });

    res.json({
      total: connectors.length,
      configuredCount: connectors.filter(c => c.isConfigured).length,
      connectors
    });
  });

  // 4. Proxy Universel Chat & Raisonnement (DeepSeek, Claude, OpenAI, Qwen, Kimi, OpenRouter)
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { 
        provider = "deepseek", 
        model, 
        messages = [], 
        temperature = 0.7, 
        max_tokens = 4096,
        systemPrompt
      } = req.body;

      const connectorMeta = AI_CONNECTORS_METADATA.find(c => c.id === provider);
      if (!connectorMeta) {
        return res.status(400).json({ error: `Fournisseur non supporté : ${provider}`, fallback: true });
      }

      const apiKey = getKeyForProvider(connectorMeta.envKey);
      if (!apiKey) {
        return res.status(503).json({
          error: `Clé API ${connectorMeta.envKey} non configurée`,
          provider,
          fallback: true,
          portalUrl: connectorMeta.portalUrl,
          message: `Veuillez renseigner ${connectorMeta.envKey} ou utiliser le mode dégradé.`
        });
      }

      const selectedModel = model || connectorMeta.defaultModel;

      // 4.0 Traitement pour GOOGLE GEMINI NATIF
      if (connectorMeta.type === "gemini_native" || provider === "gemini") {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const contents = messages.map((m: any) => ({
          role: (m.role === "assistant" || m.role === "model") ? "model" : "user",
          parts: [{ text: m.content || m.text || "" }]
        }));

        // Modèles de repli pour absorber les pointes de charge 503 / 429
        const geminiModelsToTry = [
          selectedModel,
          "gemini-2.5-flash",
          "gemini-2.5-pro",
          "gemini-2.0-flash"
        ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

        let lastGeminiErr: any = null;
        for (const targetModel of geminiModelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: targetModel,
              contents: contents.length > 0 ? contents : [{ role: "user", parts: [{ text: "Bonjour" }] }],
              config: {
                systemInstruction: systemPrompt || undefined,
                temperature: Number(temperature) || 0.7
              }
            });

            const outputText = response.text || "";
            return res.json({ 
              text: outputText, 
              raw: response, 
              provider: "gemini", 
              model: targetModel,
              wasFailover: targetModel !== selectedModel
            });
          } catch (gErr: any) {
            lastGeminiErr = gErr;
            const errMsg = String(gErr?.message || gErr || "");
            const isDemandSpike = errMsg.includes("503") || 
                                 errMsg.includes("UNAVAILABLE") || 
                                 errMsg.includes("high demand") || 
                                 errMsg.includes("429") || 
                                 errMsg.includes("RESOURCE_EXHAUSTED");
            if (isDemandSpike) {
              console.warn(`[Gemini Proxy] Modèle ${targetModel} en forte affluence (503/429), bascule vers le modèle suivant...`);
              continue;
            } else {
              break;
            }
          }
        }

        const isSpike = String(lastGeminiErr?.message || "").includes("503") || 
                        String(lastGeminiErr?.message || "").includes("high demand") || 
                        String(lastGeminiErr?.message || "").includes("UNAVAILABLE");

        return res.status(503).json({
          error: isSpike 
            ? "Les serveurs Gemini sont temporairement en forte demande. Basculement de résilience vers le fournisseur suivant." 
            : (lastGeminiErr?.message || "Erreur service Gemini"),
          status: 503,
          provider: "gemini",
          fallback: true,
          isOverload: isSpike
        });
      }

      // 4.1 Traitement pour ANTHROPIC CLAUDE
      if (connectorMeta.type === "anthropic") {
        const formattedMessages = messages.map((m: any) => ({
          role: m.role === "system" ? "user" : (m.role === "assistant" || m.role === "model" ? "assistant" : "user"),
          content: m.content || m.text || ""
        }));

        const claudePayload: any = {
          model: selectedModel,
          max_tokens: max_tokens,
          temperature: temperature,
          messages: formattedMessages
        };
        if (systemPrompt) {
          claudePayload.system = systemPrompt;
        }

        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify(claudePayload)
        });

        if (!claudeRes.ok) {
          const errBody = await claudeRes.text().catch(() => "");
          return res.status(claudeRes.status).json({ error: `Erreur Claude [${claudeRes.status}]`, details: errBody, fallback: true });
        }

        const data: any = await claudeRes.json();
        const outputText = data.content?.[0]?.text || "";
        return res.json({ text: outputText, raw: data, provider, model: selectedModel });
      }

      // 4.2 Traitement pour OPENAI COMPATIBLE (DeepSeek, OpenAI, Qwen, Kimi, OpenRouter)
      const formattedMessages = [...messages];
      if (systemPrompt && !formattedMessages.some((m: any) => m.role === "system")) {
        formattedMessages.unshift({ role: "system", content: systemPrompt });
      }

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "https://lemondeavous.org";
        headers["X-Title"] = "Le Monde a Vous";
      }

      const response = await fetch(connectorMeta.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: selectedModel,
          messages: formattedMessages,
          temperature,
          max_tokens
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return res.status(response.status).json({
          error: `Erreur ${connectorMeta.name} [${response.status}]`,
          details: errText,
          fallback: true
        });
      }

      const data: any = await response.json();
      const outputText = data.choices?.[0]?.message?.content || "";
      return res.json({ text: outputText, raw: data, provider, model: selectedModel });

    } catch (err: any) {
      const errMsg = String(err?.message || err || "");
      const isDemandSpike = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("429");
      if (isDemandSpike) {
        console.warn("⚠️ Proxy Chat IA: Modèle temporairement surchargé (503/429), renvoi vers le moteur de bascule.");
        return res.status(503).json({ 
          error: "Modèle en forte affluence temporaire (503). Basculement automatique en cours.", 
          details: errMsg, 
          fallback: true,
          isOverload: true 
        });
      }
      console.warn("Proxy Chat IA: Exception capturée avec dégradation gracieuse:", errMsg);
      return res.status(500).json({ error: err.message || "Erreur interne Proxy Chat IA", fallback: true });
    }
  });

  // 5. Proxy Génération Vidéo (Kling AI & Runway)
  app.post("/api/ai/video", async (req, res) => {
    try {
      const { provider = "kling", prompt, aspectRatio = "16:9", duration = 5, imageUrl } = req.body;
      const meta = AI_CONNECTORS_METADATA.find(c => c.id === provider);
      const apiKey = meta ? getKeyForProvider(meta.envKey) : undefined;

      if (!apiKey) {
        return res.status(503).json({
          error: `Clé API ${meta?.envKey || provider} non configurée`,
          portalUrl: meta?.portalUrl,
          fallback: true,
          message: "Mode dégradé vidéo : simulation ou fallback Veo actif."
        });
      }

      // 5.1 Kling AI Video Text2Video
      if (provider === "kling") {
        const klingRes = await fetch("https://api.klingai.com/v1/videos/text2video", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model_name: "kling-v1.5-pro",
            prompt,
            aspect_ratio: aspectRatio,
            duration: `${duration}`,
            image_url: imageUrl || undefined
          })
        });

        const data: any = await klingRes.json();
        return res.json({ success: klingRes.ok, data, provider: "kling" });
      }

      // 5.2 RunwayML Gen-3 Video Task
      if (provider === "runway") {
        const runwayRes = await fetch("https://api.runwayml.com/v1/tasks", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-Runway-Version": "2024-11-06",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            taskType: "gen3a_turbo",
            promptText: prompt,
            duration: Number(duration) || 5,
            ratio: aspectRatio === "9:16" ? "768:1280" : "1280:768"
          })
        });

        const data: any = await runwayRes.json();
        return res.json({ success: runwayRes.ok, data, provider: "runway" });
      }

      return res.status(400).json({ error: `Provider vidéo ${provider} non supporté` });
    } catch (err: any) {
      console.error("Erreur serveur Vidéo IA:", err);
      return res.status(500).json({ error: err.message || "Erreur interne Proxy Vidéo", fallback: true });
    }
  });

  // 6. Proxy HeyGen Interactive Avatar & Talking Photo
  app.post("/api/ai/avatar", async (req, res) => {
    try {
      const { text, avatarId = "Daisy-inskirt-20220818", voiceId, title = "Diallo Expert Guidance" } = req.body;
      const apiKey = getKeyForProvider("HEYGEN_API_KEY");

      if (!apiKey) {
        return res.status(503).json({
          error: "Clé HEYGEN_API_KEY non configurée",
          portalUrl: "https://app.heygen.com/settings?nav=API",
          fallback: true
        });
      }

      const heygenRes = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          video_inputs: [{
            character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
            voice: { type: "text", input_text: text, voice_id: voiceId || "2d5b0e6cf36f460aa7fc47e3eee4ba54" }
          }],
          title: title,
          dimension: { width: 1280, height: 720 }
        })
      });

      const data: any = await heygenRes.json();
      return res.json({ success: heygenRes.ok, data, provider: "heygene" });
    } catch (err: any) {
      console.error("Erreur serveur HeyGen Avatar:", err);
      return res.status(500).json({ error: err.message || "Erreur interne Proxy HeyGen", fallback: true });
    }
  });

  // 7. Déclencheur de Workflow n8n & Webhook Inbound
  app.post("/api/ai/n8n/trigger", async (req, res) => {
    try {
      const { webhookUrl, eventName, payload } = req.body;
      const targetUrl = webhookUrl || process.env.N8N_WEBHOOK_URL || process.env.VITE_N8N_WEBHOOK_URL;

      if (!targetUrl) {
        return res.status(503).json({
          error: "N8N_WEBHOOK_URL non configuré",
          portalUrl: "https://n8n.io/",
          fallback: true,
          message: "Mode dégradé : exécution locale simulée du workflow."
        });
      }

      const n8nApiKey = process.env.N8N_API_KEY;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (n8nApiKey) {
        headers["X-N8N-API-KEY"] = n8nApiKey;
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          source: "LeMondeAVous_Platform",
          timestamp: new Date().toISOString(),
          eventName: eventName || "default_action",
          data: payload || {}
        })
      });

      const responseData = await response.text().catch(() => "");
      return res.json({
        success: response.ok,
        status: response.status,
        response: responseData,
        triggeredAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Erreur serveur n8n trigger:", err);
      return res.status(500).json({ error: err.message || "Erreur interne déclencheur n8n", fallback: true });
    }
  });

  // 8. Proxy Haute Fidélité ElevenLabs TTS
  app.post("/api/tts", async (req, res) => {
    try {
      const apiKey = getKeyForProvider("ELEVENLABS_API_KEY");
      const { 
        text, 
        voiceId = "JBFqnCBsd6RMkjVDRZzb", // Par défaut : George (Professeur Diallo)
        modelId = "eleven_multilingual_v2", 
        stability = 0.5, 
        similarity_boost = 0.8 
      } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Texte requis pour la synthèse", fallback: true });
      }

      if (!apiKey) {
        return res.status(503).json({ 
          error: "ELEVENLABS_API_KEY non configurée", 
          fallback: true,
          message: "Mode dégradé : utilisation automatique de la synthèse vocale standard du navigateur." 
        });
      }

      // Appel sécurisé vers l'API ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: modelId,
          voice_settings: {
            stability: Number(stability) || 0.5,
            similarity_boost: Number(similarity_boost) || 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`ElevenLabs API error [${response.status}]:`, errText);
        return res.status(response.status).json({ 
          error: `Erreur ElevenLabs: ${response.statusText}`, 
          fallback: true,
          details: errText 
        });
      }

      // Renvoyer le flux audio MP3 directement
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", buffer.length.toString());
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache 24h pour les phrases récurrentes
      return res.send(buffer);

    } catch (error: any) {
      console.error("Erreur serveur TTS ElevenLabs:", error);
      return res.status(500).json({ 
        error: error.message || "Erreur interne lors de la synthèse vocale", 
        fallback: true 
      });
    }
  });

  // Vite middleware pour le développement ou fichiers statiques en production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Le Monde à Vous démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Échec critique du démarrage serveur:", err);
});
