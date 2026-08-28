import { AIProxyClient } from './aiProxy';
import { 
    DetectedObject, 
    MotionDetectionResult, 
    OcrBlock, 
    SceneUnderstanding, 
    RecognizedPerson, 
    EnrolledPerson, 
    MultimodalVisionAnalysis,
    BoundingBox
} from '../types';

const ENROLLED_PERSONS_KEY = 'lmav_enrolled_persons_v1';

export class MultimodalVisionService {
    private static instance: MultimodalVisionService;
    private prevCanvas: HTMLCanvasElement | null = null;
    private prevImageData: ImageData | null = null;
    private lastAnalysisTime: number = 0;
    private isAnalyzingAI: boolean = false;

    private constructor() {
        this.initDefaultEnrolledPersons();
    }

    public static getInstance(): MultimodalVisionService {
        if (!MultimodalVisionService.instance) {
            MultimodalVisionService.instance = new MultimodalVisionService();
        }
        return MultimodalVisionService.instance;
    }

    /**
     * Initialise une liste par défaut de personnes de confiance enrôlées
     */
    private initDefaultEnrolledPersons() {
        const stored = localStorage.getItem(ENROLLED_PERSONS_KEY);
        if (!stored) {
            const defaults: EnrolledPerson[] = [
                {
                    id: 'p-1',
                    name: 'Amadou Diallo',
                    role: 'Utilisateur Titulaire',
                    isAuthorized: true,
                    enrolledAt: new Date().toISOString(),
                    notes: 'Accès biométrique autorisé - Profil Principal'
                },
                {
                    id: 'p-2',
                    name: 'Fatoumata Barry',
                    role: 'Collaboratrice / Conjoint(e)',
                    isAuthorized: true,
                    enrolledAt: new Date().toISOString(),
                    notes: 'Membre famille enregistré'
                }
            ];
            localStorage.setItem(ENROLLED_PERSONS_KEY, JSON.stringify(defaults));
        }
    }

    public getEnrolledPersons(): EnrolledPerson[] {
        try {
            const data = localStorage.getItem(ENROLLED_PERSONS_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    public saveEnrolledPerson(person: Omit<EnrolledPerson, 'id' | 'enrolledAt'>): EnrolledPerson {
        const persons = this.getEnrolledPersons();
        const newPerson: EnrolledPerson = {
            ...person,
            id: `p-${Date.now()}`,
            enrolledAt: new Date().toISOString()
        };
        persons.push(newPerson);
        localStorage.setItem(ENROLLED_PERSONS_KEY, JSON.stringify(persons));
        return newPerson;
    }

    public deleteEnrolledPerson(id: string) {
        const persons = this.getEnrolledPersons().filter(p => p.id !== id);
        localStorage.setItem(ENROLLED_PERSONS_KEY, JSON.stringify(persons));
    }

    public togglePersonAuthorization(id: string) {
        const persons = this.getEnrolledPersons().map(p => {
            if (p.id === id) {
                return { ...p, isAuthorized: !p.isAuthorized };
            }
            return p;
        });
        localStorage.setItem(ENROLLED_PERSONS_KEY, JSON.stringify(persons));
    }

    /**
     * Analyse optique ultra-rapide des mouvements en temps réel (Client-side Canvas)
     * Fonctionne à 30-60 FPS sans appel serveur pour une réactivité instantanée.
     */
    public detectMotion(videoElement: HTMLVideoElement): MotionDetectionResult {
        if (!videoElement || videoElement.videoWidth === 0) {
            return { hasMotion: false, motionLevel: 0, activeZones: [], timestamp: Date.now() };
        }

        const width = 64;
        const height = 48;

        if (!this.prevCanvas) {
            this.prevCanvas = document.createElement('canvas');
            this.prevCanvas.width = width;
            this.prevCanvas.height = height;
        }

        const ctx = this.prevCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return { hasMotion: false, motionLevel: 0, activeZones: [], timestamp: Date.now() };

        ctx.drawImage(videoElement, 0, 0, width, height);
        const currentData = ctx.getImageData(0, 0, width, height);

        if (!this.prevImageData) {
            this.prevImageData = currentData;
            return { hasMotion: false, motionLevel: 0, activeZones: [], timestamp: Date.now() };
        }

        const cur = currentData.data;
        const prev = this.prevImageData.data;
        let diffCount = 0;
        let sumX = 0;
        let sumY = 0;
        const threshold = 35; // Seuil de sensibilité par pixel
        const activeBlocks: { x: number; y: number }[] = [];

        // Grid scan
        for (let y = 0; y < height; y += 4) {
            for (let x = 0; x < width; x += 4) {
                const idx = (y * width + x) * 4;
                const rDiff = Math.abs(cur[idx] - prev[idx]);
                const gDiff = Math.abs(cur[idx + 1] - prev[idx + 1]);
                const bDiff = Math.abs(cur[idx + 2] - prev[idx + 2]);
                const avgDiff = (rDiff + gDiff + bDiff) / 3;

                if (avgDiff > threshold) {
                    diffCount++;
                    sumX += x;
                    sumY += y;
                    activeBlocks.push({ x, y });
                }
            }
        }

        // Sauvegarder pour la prochaine frame
        this.prevImageData = currentData;

        const totalSamples = (width / 4) * (height / 4);
        const motionRatio = diffCount / totalSamples;
        const motionLevel = Math.min(100, Math.round(motionRatio * 350));
        const hasMotion = motionLevel > 8;

        const activeZones: BoundingBox[] = [];
        if (hasMotion && activeBlocks.length > 0) {
            let minX = width;
            let maxX = 0;
            let minY = height;
            let maxY = 0;

            for (const block of activeBlocks) {
                if (block.x < minX) minX = block.x;
                if (block.x > maxX) maxX = block.x;
                if (block.y < minY) minY = block.y;
                if (block.y > maxY) maxY = block.y;
            }

            activeZones.push({
                ymin: Math.max(0, Math.round((minY / height) * 1000)),
                xmin: Math.max(0, Math.round((minX / width) * 1000)),
                ymax: Math.min(1000, Math.round(((maxY + 4) / height) * 1000)),
                xmax: Math.min(1000, Math.round(((maxX + 4) / width) * 1000))
            });
        }

        const avgX = diffCount > 0 ? sumX / diffCount : width / 2;
        const avgY = diffCount > 0 ? sumY / diffCount : height / 2;

        return {
            hasMotion,
            motionLevel,
            activeZones,
            motionVector: {
                x: Math.round(((avgX / width) - 0.5) * 100),
                y: Math.round(((avgY / height) - 0.5) * 100)
            },
            timestamp: Date.now()
        };
    }

    /**
     * Capture une frame de la vidéo sous forme de chaîne JPEG Base64
     */
    public captureFrame(videoElement: HTMLVideoElement, maxWidth = 800): string | null {
        if (!videoElement || videoElement.videoWidth === 0) return null;

        const scale = Math.min(1, maxWidth / videoElement.videoWidth);
        const targetWidth = Math.round(videoElement.videoWidth * scale);
        const targetHeight = Math.round(videoElement.videoHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    /**
     * Analyse Multimodale Globale via Gemini 2.5 Flash
     * Détection d'objets + OCR + Compréhension de scène + Personnes autorisées
     */
    public async analyzeFrame(
        base64Jpeg: string, 
        expertContext?: { name: string; specialty: string; title: string },
        allowPersonRecognition: boolean = true
    ): Promise<MultimodalVisionAnalysis> {
        if (this.isAnalyzingAI) {
            throw new Error('Une analyse est déjà en cours.');
        }

        this.isAnalyzingAI = true;
        this.lastAnalysisTime = Date.now();

        try {
            const ai = new AIProxyClient();
            const enrolledPersons = this.getEnrolledPersons();
            const enrolledNames = enrolledPersons.map(p => `${p.name} (${p.role}${p.isAuthorized ? ' - Autorisé' : ' - Non autorisé'})`).join(', ');

            const base64Data = base64Jpeg.includes(',') ? base64Jpeg.split(',')[1] : base64Jpeg;

            const prompt = `Tu es le moteur de perception visuelle multimodale en temps réel de la plateforme 'Le Monde à Vous'.
Expert actif consultant ce flux : ${expertContext?.name || 'Diallo'} (${expertContext?.title || 'Expert Polyglotte'}).

Analyse avec une très haute précision cette image vidéo et fournis une réponse STRICTEMENT sous format JSON avec la structure suivante :

{
  "objects": [
    {
      "id": "obj-1",
      "label": "Passport / Laptop / Person / etc.",
      "labelFr": "Nom de l'objet en français",
      "confidence": 0.95,
      "category": "document | électronique | meuble | personne | vêtement | autre",
      "box": { "ymin": 120, "xmin": 340, "ymax": 580, "xmax": 720 } 
    }
  ],
  "ocrBlocks": [
    {
      "id": "ocr-1",
      "text": "Texte lu fidèlement sur le document ou panneau",
      "type": "document | heading | text | form_field | sign",
      "language": "fr | en | es | etc.",
      "confidence": 0.98,
      "box": { "ymin": 200, "xmin": 150, "ymax": 310, "xmax": 850 }
    }
  ],
  "scene": {
    "summary": "Description concise et professionnelle de l'environnement visible (2-3 phrases)",
    "environmentType": "intérieur | extérieur | bureau | véhicule | espace public | document | inconnu",
    "lighting": "lumineux | sombre | naturel | artificiel | optimal",
    "spatialContext": ["Ex: bureau ordonné", "document posé à plat", "bonne clarté"],
    "suggestedActions": [
      "Action 1 recommandée à l'expert (ex: Traduire le titre détecté)",
      "Action 2 (ex: Vérifier le numéro de passeport)",
      "Action 3 (ex: Archiver dans Google Drive)"
    ],
    "riskScore": 0
  },
  "recognizedPersons": [
    {
      "id": "pers-1",
      "name": "Nom identifié ou 'Personne non répertoriée'",
      "role": "Rôle supposé ou attribué",
      "isAuthorized": ${allowPersonRecognition ? 'true/false si match' : 'false'},
      "confidence": 0.90,
      "box": { "ymin": 50, "xmin": 200, "ymax": 700, "xmax": 600 },
      "notes": "Détails physiques ou expression faciale bienveillante"
    }
  ],
  "executiveSummary": "Synthèse rapide pour l'expert Diallo en 1 phrase percutante."
}

RÈGLES CRUCIALES POUR LES BOÎTES ENCADRANTES (Bounding Boxes) :
- Les coordonnées "box" (ymin, xmin, ymax, xmax) doivent être des entiers normalisés entre 0 et 1000 (où 0 est le bord supérieur/gauche et 1000 le bord inférieur/droit).
- Sois exhaustif sur les textes lisibles (OCR) et les documents administratifs / diplômes / passeports / formulaires.
- Personnes de confiance connues dans la base de données : ${enrolledNames || 'Amadou Diallo'}. Si une personne semble correspondre à l'utilisateur titulaire, mentionne-la avec son statut d'autorisation.
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                        { text: prompt }
                    ]
                },
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const rawText = response.text || '{}';
            const cleanJson = rawText.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Assignation des valeurs sûres
            const analysis: MultimodalVisionAnalysis = {
                timestamp: Date.now(),
                objects: Array.isArray(parsed.objects) ? parsed.objects : [],
                motion: { hasMotion: false, motionLevel: 0, activeZones: [], timestamp: Date.now() },
                ocrBlocks: Array.isArray(parsed.ocrBlocks) ? parsed.ocrBlocks : [],
                scene: parsed.scene || {
                    summary: "Scène analysée avec succès.",
                    environmentType: "intérieur",
                    lighting: "optimal",
                    spatialContext: ["Espace de travail"],
                    suggestedActions: ["Consulter l'expert"],
                    riskScore: 0
                },
                recognizedPersons: Array.isArray(parsed.recognizedPersons) ? parsed.recognizedPersons : [],
                executiveSummary: parsed.executiveSummary || "Analyse multimodale terminée."
            };

            return analysis;
        } catch (error) {
            console.error("❌ Erreur analyse vision Gemini:", error);
            throw error;
        } finally {
            this.isAnalyzingAI = false;
        }
    }
}

export const multimodalVisionService = MultimodalVisionService.getInstance();
