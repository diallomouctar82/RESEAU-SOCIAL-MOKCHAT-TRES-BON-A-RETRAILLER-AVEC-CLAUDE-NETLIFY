import { AIProxyClient, aiProxy } from './aiProxy';

class AIService {
  private static instance: AIService;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) AIService.instance = new AIService();
    return AIService.instance;
  }

  async generateText(model: string, prompt: string, systemInstruction?: string): Promise<string> {
    return aiProxy.generateText(prompt, { model, systemInstruction });
  }

  async generateJson<T>(model: string, prompt: string, schemaDescription?: string): Promise<T> {
    const structuredPrompt = schemaDescription
      ? `${prompt}\n\nRéponds strictement en JSON valide selon ce contrat : ${schemaDescription}`
      : prompt;
    return aiProxy.generateJson<T>(structuredPrompt, { model });
  }

  async analyzeMedia(model: string, prompt: string, mimeType: string, base64Data: string): Promise<string> {
    const client = new AIProxyClient();
    const response = await client.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    });
    return response.text;
  }
}

export const aiService = AIService.getInstance();
