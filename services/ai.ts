import { generateText as gatewayGenerateText, generateJSON as gatewayGenerateJSON, analyzeImage as gatewayAnalyzeImage } from "./aiGateway";

// Compatibilité : garde la même interface publique qu'avant (nom des méthodes,
// paramètres, type de retour) pour ne rien casser chez les composants qui
// l'utilisent déjà (AIPostAssistantModal, HealthCenter). Route désormais
// directement vers le registre IA central (services/aiGateway.ts) — seul
// chemin officiel, plus de routeur parallèle intermédiaire.
class AIService {
    private static instance: AIService;

    private constructor() {}

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Génère une réponse textuelle via l'orchestrateur central.
     */
    async generateText(model: string, prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const text = await gatewayGenerateText(prompt, { systemInstruction, modelId: model });
            return text || "Aucune réponse n'a pu être générée. Réessayez dans un instant.";
        } catch (error) {
            console.error("Erreur AI Service (texte) :", error);
            return "Aucune réponse n'a pu être générée. Réessayez dans un instant.";
        }
    }

    /**
     * Génère une réponse structurée en JSON via l'orchestrateur central.
     */
    async generateJson<T>(model: string, prompt: string, schemaDescription?: string): Promise<T> {
        const fullPrompt = prompt + (schemaDescription ? `\n\nRespond strictly in valid JSON following this schema: ${schemaDescription}` : "");
        return gatewayGenerateJSON<T>(fullPrompt, { modelId: model });
    }

    /**
     * Analyse multimodale (vision) via l'orchestrateur central.
     */
    async analyzeMedia(model: string, prompt: string, mimeType: string, base64Data: string): Promise<string> {
        try {
            const response = await gatewayAnalyzeImage(base64Data, mimeType, prompt, { modelId: model });
            return response || "";
        } catch (error) {
            console.error("Erreur AI Service (média) :", error);
            return "L'analyse de ce média a échoué. Réessayez dans un instant.";
        }
    }
}

export const aiService = AIService.getInstance();
