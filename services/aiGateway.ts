import { supabase } from './supabaseClient';

/**
 * Point d'entrée UNIQUE vers l'orchestrateur IA (Edge Function ai-gateway).
 *
 * C'est le registre global demandé : dès qu'un admin active un fournisseur
 * (clé + interrupteur) dans Super Admin → Connecteurs & Modèles IA, TOUT code
 * qui appelle une fonction de ce fichier en bénéficie immédiatement, sans
 * redéploiement — sélection automatique du meilleur fournisseur actif par
 * catégorie, avec bascule en cas d'échec/quota/indisponibilité.
 *
 * Règle : plus aucun composant ne doit instancier `new GoogleGenAI(...)` ni
 * lire une clé API directement. Tout passe par les fonctions ci-dessous (ou
 * par mint-live-token pour l'appel vocal en direct, seul cas où le navigateur
 * a besoin d'un jeton — voir components/LiveSession.tsx).
 */

export interface AiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    /** Vision/OCR : joint une image à ce message (analyse de photo, document...). */
    imageBase64?: string;
    imageMimeType?: string;
}

const toMessages = (prompt: string | AiMessage[], systemInstruction?: string): AiMessage[] => {
    const base: AiMessage[] = typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt;
    return systemInstruction ? [{ role: 'system', content: systemInstruction }, ...base] : base;
};

/**
 * `error.message` de supabase-js pour un échec HTTP (FunctionsHttpError) est
 * toujours le texte générique "Edge Function returned a non-2xx status code"
 * — le vrai message (`{error: "..."}`) renvoyé par la fonction est dans le
 * corps de la réponse, accessible via `error.context` (l'objet Response).
 * Sans cette lecture, l'utilisateur ne voit jamais que ce vrai message.
 */
async function readFunctionErrorMessage(error: any): Promise<string | undefined> {
    try {
        const body = await error?.context?.json?.();
        return body?.error;
    } catch {
        return undefined;
    }
}

/**
 * Erreur de TRANSPORT (réseau coupé, délai dépassé) — distincte d'une erreur
 * du fournisseur IA. Les interfaces peuvent la reconnaître (`isNetwork`) pour
 * afficher un état « reconnexion » honnête au lieu de « je n'ai pas compris »
 * (défaut mesuré par l'audit du 31/08/2026 : une coupure réseau était
 * présentée comme une incompréhension).
 */
export class AiGatewayNetworkError extends Error {
    readonly isNetwork = true;
    constructor(message: string) { super(message); this.name = 'AiGatewayNetworkError'; }
}

/** Budget de temps CLIENT par appel — sans lui, le pire cas était
 * `nb_fournisseurs × 30 s` en série sans aucun plafond visible. */
const GATEWAY_TIMEOUT_MS = 45_000;

interface InvokeOptions {
    /**
     * Mission VT : budget de temps propre à CET appel (l'interprète d'appel ne
     * peut pas attendre 45 s une transcription ou une voix : au-delà de
     * quelques secondes, la phrase est périmée). Borné au budget global.
     */
    timeoutMs?: number;
}

async function invokeGateway(body: Record<string, unknown>, options?: InvokeOptions): Promise<any> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new AiGatewayNetworkError('Aucune connexion Internet — je réessaierai dès que la connexion revient.');
    }
    const budgetMs = options?.timeoutMs && options.timeoutMs > 0 ? Math.min(options.timeoutMs, GATEWAY_TIMEOUT_MS) : GATEWAY_TIMEOUT_MS;
    const budgetLabel = budgetMs >= 1000 ? `${Math.round(budgetMs / 100) / 10} s` : `${budgetMs} ms`;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
            () => reject(new AiGatewayNetworkError(`Le service IA n'a pas répondu dans le délai imparti (${budgetLabel}).`)),
            budgetMs
        );
    });
    try {
        const { data, error } = await Promise.race([
            supabase.functions.invoke('ai-gateway', { body }),
            timeout,
        ]);
        if (error) {
            // `Failed to fetch` / TypeError = transport, pas fournisseur.
            const detail = await readFunctionErrorMessage(error);
            if (!detail && /fetch|network|load failed/i.test(error.message || '')) {
                throw new AiGatewayNetworkError('La connexion au service IA a échoué — vérifiez votre réseau.');
            }
            throw new Error(detail || error.message || "Échec de l'appel à l'orchestrateur IA.");
        }
        if (data?.error) throw new Error(data.error as string);
        return data;
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
}

/**
 * Action que l'expert souhaite exécuter dans l'application et qui ATTEND
 * l'accord explicite de la personne. Rien n'a encore été écrit : l'orchestrateur
 * a interrompu son tour et ne reprendra que si `confirmedAction` lui est
 * renvoyé. Refuser revient simplement à ne pas rappeler la fonction.
 */
export interface PendingAction {
    toolId: string;
    /** Résumé lisible de ce qui sera fait, rédigé côté serveur. */
    label: string;
    args: Record<string, unknown>;
}

export interface TextResult {
    text: string;
    /** Outils réellement utilisés pour produire cette réponse (traçabilité). */
    toolsUsed?: string[];
    /** Présent si l'expert demande l'autorisation d'agir. */
    pendingAction?: PendingAction;
}

interface TextOptions {
    systemInstruction?: string;
    providerId?: string;
    modelId?: string;
    /**
     * Expert à l'origine de l'appel. C'est lui qui détermine les outils
     * disponibles (recherche web, dossier de la personne, actions), selon les
     * autorisations définies par l'administrateur dans Super Admin. Omettre cet
     * identifiant revient à appeler le modèle sans aucun outil.
     */
    agentId?: string;
    /** Action validée par la personne : seul moyen de déclencher une écriture. */
    confirmedAction?: { toolId: string; args: Record<string, unknown> };
}

/** Génération de texte simple. Remplace `ai.models.generateContent({contents: prompt})`. */
export const generateText = async (
    prompt: string | AiMessage[],
    options?: TextOptions
): Promise<string> => {
    const { text } = await generateTextDetailed(prompt, options);
    return text;
};

/**
 * Variante renvoyant le détail : outils utilisés et éventuelle action en
 * attente de confirmation. À utiliser dès qu'une interface veut afficher les
 * sources consultées ou demander l'accord avant d'agir.
 */
export const generateTextDetailed = async (
    prompt: string | AiMessage[],
    options?: TextOptions
): Promise<TextResult> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'llm',
        providerId: options?.providerId,
        modelId: options?.modelId,
        agentId: options?.agentId,
        confirmedAction: options?.confirmedAction,
        request: { messages: toMessages(prompt, options?.systemInstruction) },
    });
    return {
        text: data?.result?.text ?? '',
        toolsUsed: data?.toolsUsed,
        pendingAction: data?.pendingAction,
    };
};

/**
 * Génération JSON stricte. Remplace `config: { responseMimeType: 'application/json' }`.
 * Décrivez la forme attendue dans le prompt (comme avant) ; le résultat est
 * automatiquement parsé. Lève une erreur claire si le fournisseur n'a pas
 * renvoyé de JSON valide (l'appelant peut alors afficher un message ou
 * réessayer, comme pour toute autre erreur réseau).
 */
export const generateJSON = async <T = any>(
    prompt: string | AiMessage[],
    options?: { systemInstruction?: string; providerId?: string; modelId?: string; agentId?: string }
): Promise<T> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'llm',
        providerId: options?.providerId,
        modelId: options?.modelId,
        // `agentId` détermine côté serveur les outils autorisés (recherche
        // web...) : sans lui, les droits d'outils accordés à l'Architecte
        // n'avaient AUCUN effet sur son chemin principal (audit 31/08/2026).
        agentId: options?.agentId,
        request: { messages: toMessages(prompt, options?.systemInstruction), jsonMode: true },
    });
    if (data?.result?.json !== undefined) return data.result.json as T;
    const text = data?.result?.text ?? '';
    const parsed = parseLooseJson<T>(text);
    if (parsed === undefined) {
        throw new Error("Réponse du fournisseur IA non conforme au format JSON attendu.");
    }
    return parsed;
};

/**
 * Extraction JSON tolérante — idée reprise (et durcie) du dépôt historique
 * `ARCHITECTE-BON-INSPIRATION-POUR-MOKNET-2026` (`services/geminiService.ts::cleanJson`),
 * seul élément de son Architecte réellement supérieur à l'existant ici.
 *
 * Problème réel qu'elle corrige : `JSON.parse(text)` échouait dès qu'un
 * fournisseur encadrait sa réponse d'une clôture markdown (```json ... ```) ou
 * d'une phrase d'introduction — comportement courant, en particulier sur les
 * fournisseurs de repli qui n'honorent pas `jsonMode`. Comme les 5 registres
 * de l'Architecte (Live, Contenu, Social, Tâches, Recherche) et DialloOS
 * passent TOUS par `generateJSON`, une simple clôture markdown faisait échouer
 * la commande entière : l'utilisateur voyait « je n'ai pas compris » alors que
 * le modèle avait parfaitement répondu.
 *
 * Strictement additive : le chemin nominal (JSON déjà valide) est tenté en
 * premier et se comporte exactement comme avant — aucune réponse qui
 * fonctionnait ne change de résultat. Renvoie `undefined` (jamais un objet
 * inventé) quand rien d'exploitable n'est trouvé, pour que l'appelant garde
 * la main sur l'échec.
 */
export function parseLooseJson<T = any>(raw: string): T | undefined {
    if (typeof raw !== 'string' || !raw.trim()) return undefined;

    // 1. Chemin nominal, inchangé.
    try {
        return JSON.parse(raw) as T;
    } catch { /* on tente les formes tolérantes ci-dessous */ }

    // 2. Retrait d'une clôture markdown (```json ... ``` ou ``` ... ```).
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
        try {
            return JSON.parse(fenced[1]) as T;
        } catch { /* continue */ }
    }

    // 3. Découpe entre la première et la dernière accolade/crochet — couvre
    //    le cas « phrase d'introduction + objet JSON ». On retient la forme
    //    (objet ou tableau) qui commence le plus tôt dans le texte.
    const candidates: Array<[number, number]> = [];
    const objStart = raw.indexOf('{');
    const objEnd = raw.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) candidates.push([objStart, objEnd]);
    const arrStart = raw.indexOf('[');
    const arrEnd = raw.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd > arrStart) candidates.push([arrStart, arrEnd]);

    candidates.sort((a, b) => a[0] - b[0]);
    for (const [start, end] of candidates) {
        try {
            return JSON.parse(raw.slice(start, end + 1)) as T;
        } catch { /* candidat suivant */ }
    }

    return undefined;
}

/** Analyse d'une image (vision/OCR) : image + question -> texte (ou JSON si jsonMode). */
export const analyzeImage = async (
    imageBase64: string,
    imageMimeType: string,
    prompt: string,
    options?: { jsonMode?: boolean; systemInstruction?: string; providerId?: string; modelId?: string }
): Promise<string> => {
    const messages: AiMessage[] = [
        ...(options?.systemInstruction ? [{ role: 'system' as const, content: options.systemInstruction }] : []),
        { role: 'user', content: prompt, imageBase64, imageMimeType },
    ];
    const data = await invokeGateway({
        mode: 'call',
        category: 'llm',
        providerId: options?.providerId,
        modelId: options?.modelId,
        request: { messages, jsonMode: options?.jsonMode },
    });
    return options?.jsonMode
        ? JSON.stringify(data?.result?.json ?? JSON.parse(data?.result?.text || '{}'))
        : (data?.result?.text ?? '');
};

/**
 * Génération d'image. Retourne l'URL hébergée par le fournisseur actif
 * (Leonardo, Flux, Ideogram, Recraft...) — bascule automatique entre eux.
 */
export const generateImage = async (
    prompt: string,
    options?: { params?: Record<string, unknown>; providerId?: string; modelId?: string }
): Promise<string> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'image_video',
        providerId: options?.providerId,
        modelId: options?.modelId,
        request: { prompt, params: options?.params },
    });
    const assetUrl = data?.result?.assetUrl;
    if (!assetUrl) throw new Error("Le fournisseur n'a pas renvoyé d'image (job encore en cours ou réponse inattendue).");
    return assetUrl as string;
};

/**
 * Génération vidéo. Retourne l'URL hébergée par le fournisseur actif (Runway,
 * HeyGen, Kling, Luma...). Le sondage (job asynchrone) est déjà géré côté
 * serveur — pas besoin de boucle de polling ici.
 */
export const generateVideo = async (
    prompt: string,
    options?: { params?: Record<string, unknown>; providerId?: string; modelId?: string }
): Promise<string> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'image_video',
        providerId: options?.providerId,
        modelId: options?.modelId,
        request: { prompt, params: options?.params },
    });
    const assetUrl = data?.result?.assetUrl;
    if (!assetUrl) throw new Error("Le fournisseur n'a pas renvoyé de vidéo (job encore en cours ou réponse inattendue).");
    return assetUrl as string;
};

export interface SpeechOptions {
    voiceId?: string;
    providerId?: string;
    modelId?: string;
    /** Réglages fins du fournisseur (ElevenLabs : stability/similarity_boost/style). Optionnels — sans eux, les défauts du fournisseur s'appliquent, comme avant. */
    voiceSettings?: { stability?: number; similarity_boost?: number; style?: number };
    /** Mission VT : budget de temps de CET appel (voix d'interprète : au-delà, repli sur la voix du navigateur). Absent = budget global (45 s). */
    timeoutMs?: number;
    /**
     * Mission VT : langue dans laquelle le texte doit être LU (code catalogue ou
     * étiquette BCP‑47). Une voix pilotée par un modèle de langage peut sinon
     * « traduire » en parlant (mesuré au banc : phrase française lue en
     * anglais). Optionnelle — sans elle, comportement inchangé.
     */
    language?: string;
}

export interface SpeechResult {
    audioBase64: string;
    /** Type MIME réel du fournisseur retenu (audio/mpeg pour ElevenLabs,
     * audio/wav pour le secours Gemini TTS...) — indispensable pour jouer
     * l'audio correctement quel que soit le fournisseur de bascule. */
    mimeType: string;
}

/** Synthèse vocale (TTS) avec le type MIME réel de l'audio. */
export const generateSpeechDetailed = async (
    text: string,
    options?: SpeechOptions
): Promise<SpeechResult> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'voice',
        providerId: options?.providerId,
        modelId: options?.modelId,
        request: { text, voiceId: options?.voiceId, voiceSettings: options?.voiceSettings, ...(options?.language ? { language: options.language } : {}) },
    }, { timeoutMs: options?.timeoutMs });
    const audioBase64 = data?.result?.audioBase64;
    if (!audioBase64) throw new Error("Le fournisseur n'a pas renvoyé d'audio.");
    return {
        audioBase64: audioBase64 as string,
        mimeType: (data?.result?.audioMimeType as string) || 'audio/mpeg',
    };
};

/** Synthèse vocale (TTS). Retourne l'audio en base64 (mp3 historique). */
export const generateSpeech = async (
    text: string,
    options?: SpeechOptions
): Promise<string> => {
    const { audioBase64 } = await generateSpeechDetailed(text, options);
    return audioBase64;
};

/** Transcription (parole -> texte). audioBase64 = audio brut encodé en base64. */
export const transcribeAudio = async (
    audioBase64: string,
    audioMimeType: string,
    options?: { providerId?: string; modelId?: string }
): Promise<string> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'voice',
        providerId: options?.providerId,
        modelId: options?.modelId,
        request: { audioBase64, audioMimeType },
    });
    return data?.result?.text ?? '';
};

export interface SpeechTranscriptionInput {
    /** Audio encodé en base64 — WAV 16 kHz mono 16 bits de préférence (voir services/calls/pcmSegmenter.ts). */
    audioBase64: string;
    mimeType: string;
    /** Langue probablement parlée (code catalogue) — une indication, jamais une contrainte : le serveur transcrit la langue réellement entendue. */
    languageHint?: string;
    /** Langue cible d'une traduction demandée dans la MÊME réponse (interprète d'appel) — absente = transcription seule. */
    targetLanguage?: string;
    /** Mission VT : budget de temps de CET appel (interprète d'appel : une phrase qui arrive 30 s plus tard est périmée). Absent = budget global (45 s). */
    timeoutMs?: number;
}

export interface SpeechTranscription {
    /** Transcription exacte ; chaîne vide s'il n'y a aucune parole intelligible. */
    text: string;
    /** Langue DÉTECTÉE (code ISO 639-1) ; chaîne vide si le fournisseur ne la rapporte pas. */
    language: string;
    /** Traduction dans `targetLanguage`, ou null (pas demandée, même langue, ou fournisseur sans traduction). */
    translated: string | null;
    targetLanguage: string | null;
    /** Fournisseur réellement retenu par la bascule (traçabilité, tests de preuve). */
    providerId: string | null;
}

/**
 * Transcription DÉTAILLÉE (mission VF-4) : texte + langue détectée + traduction
 * facultative en un seul aller-retour. C'est ce qui rend l'interprète d'appel
 * et les vocaux indépendants de la reconnaissance vocale du navigateur,
 * absente ou muette sur la plupart des téléphones.
 *
 * Deux formes de réponse sont gérées, selon le fournisseur STT retenu par la
 * bascule : `result.json` ({ text, language, translated, targetLanguage }) pour
 * le fournisseur multimodal ; un simple `result.text` pour les autres
 * (Deepgram, Whisper…) — la langue est alors inconnue (chaîne vide) et rien
 * n'est inventé : l'appelant traduit ensuite par le service de traduction.
 */
export const transcribeSpeechDetailed = async (input: SpeechTranscriptionInput): Promise<SpeechTranscription> => {
    const data = await invokeGateway({
        mode: 'call',
        category: 'voice',
        request: {
            audioBase64: input.audioBase64,
            audioMimeType: input.mimeType,
            languageHint: input.languageHint || undefined,
            targetLanguage: input.targetLanguage || undefined,
        },
    }, { timeoutMs: input.timeoutMs });
    const providerId = typeof data?.providerId === 'string' ? data.providerId : null;
    const json = data?.result?.json;
    if (json && typeof json === 'object' && typeof (json as { text?: unknown }).text === 'string') {
        const j = json as { text: string; language?: unknown; translated?: unknown; targetLanguage?: unknown };
        const text = j.text.trim();
        const translated = typeof j.translated === 'string' && j.translated.trim() ? j.translated.trim() : null;
        return {
            text,
            language: typeof j.language === 'string' ? j.language.trim().toLowerCase() : '',
            // Une traduction sans texte source n'a pas de sens ; on ne la propage jamais.
            translated: text ? translated : null,
            targetLanguage: typeof j.targetLanguage === 'string' && j.targetLanguage ? j.targetLanguage : (translated ? input.targetLanguage ?? null : null),
            providerId,
        };
    }
    const text = typeof data?.result?.text === 'string' ? data.result.text.trim() : '';
    return { text, language: '', translated: null, targetLanguage: null, providerId };
};

/**
 * Jeton éphémère pour l'appel vocal en direct (Gemini Live, Experts IA) — le
 * seul cas où le navigateur a besoin d'une forme de clé, à courte durée de
 * vie et à usage limité. Voir supabase/functions/mint-live-token.
 */
export interface LiveTokenGrant {
    token: string;
    /**
     * Modèle réellement retenu par le serveur : il peut différer de celui
     * demandé (noms de modèles Live en préversion, renouvelés régulièrement).
     * Le client DOIT se connecter avec ce modèle-là, sinon le jeton — qui est
     * lié au modèle — est refusé.
     */
    model: string;
}

export const mintLiveToken = async (model?: string): Promise<LiveTokenGrant> => {
    const { data, error } = await supabase.functions.invoke('mint-live-token', { body: { model } });
    if (error) throw new Error((await readFunctionErrorMessage(error)) || error.message || "Impossible de préparer l'appel vocal.");
    if (data?.error) throw new Error(data.error as string);
    if (!data?.token) throw new Error("Jeton d'appel introuvable dans la réponse du serveur.");
    return { token: data.token as string, model: (data.model as string) || (model ?? '') };
};

/** @deprecated utilisez generateText — conservé pour compatibilité. */
export const callAiGatewayText = generateText;
