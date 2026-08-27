
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

class AIService {
    private client: GoogleGenAI | null = null;
    private static instance: AIService;

    // Constructeur volontairement vide : le client Gemini ne doit jamais être
    // instancié pendant le chargement du module (voir getClient), sous peine
    // de faire planter tout le bundle si la clé API n'est pas configurée.
    private constructor() {}

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Crée le client Gemini à la demande, au premier appel réel d'une
     * fonctionnalité IA. GoogleGenAI lève une exception synchrone si la clé
     * API est absente ; construire le client ici garde cette erreur locale
     * aux méthodes ci-dessous (déjà couvertes par un try/catch) au lieu de
     * remonter jusqu'à l'évaluation du module et de bloquer tout React.
     */
    private getClient(): GoogleGenAI {
        if (!this.client) {
            if (!process.env.API_KEY) {
                throw new Error("Clé API Gemini manquante (GEMINI_API_KEY non configurée).");
            }
            this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        return this.client;
    }

    /**
     * Génère une réponse textuelle simple.
     * Gère les erreurs réseaux et log les problèmes.
     */
    async generateText(model: string, prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const response = await this.getClient().models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            return response.text || "";
        } catch (error) {
            console.error("❌ AI Service Error (Text):", error);
            throw new Error("Le service IA est momentanément indisponible.");
        }
    }

    /**
     * Génère une réponse structurée en JSON.
     * Inclut une tentative de réparation automatique si le JSON est malformé (Markdown backticks).
     */
    async generateJson<T>(model: string, prompt: string, schemaDescription?: string): Promise<T> {
        try {
            const response = await this.getClient().models.generateContent({
                model: model,
                contents: prompt + (schemaDescription ? `\n\nRespond strictly in JSON following this schema: ${schemaDescription}` : ""),
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const text = response.text || "{}";
            
            // Nettoyage robuste du JSON (enlève les ```json ... ``` si présents)
            const cleanJson = text.replace(/```json|```/g, '').trim();
            
            return JSON.parse(cleanJson) as T;
        } catch (error) {
            console.error("❌ AI Service Error (JSON):", error);
            // Fallback ou re-throw selon la stratégie critique
            throw new Error("Erreur lors du traitement des données structurées.");
        }
    }

    /**
     * Analyse multimodale (Vision/Audio + Texte)
     */
    async analyzeMedia(model: string, prompt: string, mimeType: string, base64Data: string): Promise<string> {
        try {
            const response = await this.getClient().models.generateContent({
                model: model,
                contents: {
                    parts: [
                        { inlineData: { mimeType: mimeType, data: base64Data } },
                        { text: prompt }
                    ]
                }
            });
            return response.text || "";
        } catch (error) {
            console.error("❌ AI Service Error (Media):", error);
            throw error;
        }
    }
}

export const aiService = AIService.getInstance();
