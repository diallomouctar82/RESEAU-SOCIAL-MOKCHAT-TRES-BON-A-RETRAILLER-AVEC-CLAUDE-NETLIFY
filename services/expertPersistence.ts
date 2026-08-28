import type { Message } from '../types';
import { moduleRepository, type ModuleRecord } from './moduleRepository';
import { supabase } from './supabaseClient';

export type PersistedExpertRole = 'user' | 'model';
export type ExpertResultKind = 'official_document' | 'assessment';

export interface CouncilDialogueEntry {
  agentId: string;
  agentName: string;
  text: string;
}

export interface CouncilSynthesis {
  consensus: string;
  actionPlan: Array<{ priority: string; action: string; owner: string }>;
  risksAndSafeguards: Array<{ risk: string; safeguard: string }>;
  requiredDocuments: string[];
  nextImmediateStep: string;
}

export interface CouncilResultPayload {
  schemaVersion: 1;
  topic: string;
  agentIds: string[];
  dialogue: CouncilDialogueEntry[];
  synthesis: CouncilSynthesis;
  dossierId?: string;
  generatedAt: string;
}

export interface CouncilSetup {
  selectedAgentIds: string[];
  introMessage: string;
  initialSteps: Array<{ title: string; description: string; assignedAgentId: string }>;
}

export interface OrchestrationAction {
  type: 'NAVIGATE' | 'ANSWER';
  target?: string;
  explanation: string;
  payload?: Record<string, unknown>;
}

export interface OrchestrationResultPayload {
  schemaVersion: 1;
  command: string;
  action: OrchestrationAction;
  generatedAt: string;
}

export interface ExpertResultPayload {
  schemaVersion: 1;
  kind: ExpertResultKind;
  agentId: string;
  title: string;
  content: string;
  dossierId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  generatedAt: string;
}

export interface AssessmentResult {
  score: number;
  status: 'acquis' | 'en_cours' | 'a_renforcer';
  feedback: string;
}

export class ExpertPersistenceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ExpertPersistenceError';
  }
}

const textValue = (value: unknown, field: string, max = 20_000): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', `Le champ ${field} est absent de la réponse.`);
  }
  const normalized = value.trim();
  if (normalized.length > max) {
    throw new ExpertPersistenceError('AI_RESULT_TOO_LARGE', `Le champ ${field} dépasse la taille autorisée.`);
  }
  return normalized;
};

const stringArray = (value: unknown, field: string, maxItems = 30): string[] => {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', `Le champ ${field} est invalide.`);
  }
  return value.map((entry, index) => textValue(entry, `${field}[${index}]`, 500));
};

const parseJson = (raw: string): Record<string, unknown> => {
  const normalized = textValue(raw, 'réponse', 100_000).replace(/^```(?:json)?\s*|\s*```$/gi, '').trim();
  try {
    const parsed = JSON.parse(normalized) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required');
    return parsed as Record<string, unknown>;
  } catch {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'Le service a renvoyé une réponse structurée invalide.');
  }
};

export const parseCouncilResponse = (raw: string): { dialogue: CouncilDialogueEntry[]; synthesis: CouncilSynthesis } => {
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed.dialogue) || parsed.dialogue.length === 0 || parsed.dialogue.length > 12) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'La délibération ne contient aucun avis exploitable.');
  }
  const dialogue = parsed.dialogue.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ExpertPersistenceError('INVALID_AI_RESULT', `L'avis ${index + 1} est invalide.`);
    }
    const item = entry as Record<string, unknown>;
    return {
      agentId: textValue(item.agentId, `dialogue[${index}].agentId`, 100),
      agentName: textValue(item.agentName, `dialogue[${index}].agentName`, 160),
      text: textValue(item.text, `dialogue[${index}].text`, 4_000),
    };
  });
  const rawSynthesis = parsed.unifiedSynthesis;
  if (!rawSynthesis || typeof rawSynthesis !== 'object' || Array.isArray(rawSynthesis)) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'La synthèse du Conseil est absente.');
  }
  const synthesisObject = rawSynthesis as Record<string, unknown>;
  const parsePairs = <T extends Record<string, string>>(
    value: unknown,
    field: string,
    keys: Array<keyof T>,
  ): T[] => {
    if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
      throw new ExpertPersistenceError('INVALID_AI_RESULT', `Le champ ${field} est invalide.`);
    }
    return value.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new ExpertPersistenceError('INVALID_AI_RESULT', `Le champ ${field}[${index}] est invalide.`);
      }
      const object = entry as Record<string, unknown>;
      return Object.fromEntries(keys.map((key) => [key, textValue(object[String(key)], `${field}[${index}].${String(key)}`, 2_000)])) as T;
    });
  };
  return {
    dialogue,
    synthesis: {
      consensus: textValue(synthesisObject.consensus, 'unifiedSynthesis.consensus', 8_000),
      actionPlan: parsePairs<CouncilSynthesis['actionPlan'][number]>(
        synthesisObject.actionPlan,
        'unifiedSynthesis.actionPlan',
        ['priority', 'action', 'owner'],
      ),
      risksAndSafeguards: parsePairs<CouncilSynthesis['risksAndSafeguards'][number]>(
        synthesisObject.risksAndSafeguards,
        'unifiedSynthesis.risksAndSafeguards',
        ['risk', 'safeguard'],
      ),
      requiredDocuments: stringArray(synthesisObject.requiredDocuments, 'unifiedSynthesis.requiredDocuments'),
      nextImmediateStep: textValue(synthesisObject.nextImmediateStep, 'unifiedSynthesis.nextImmediateStep', 2_000),
    },
  };
};

export const parseCouncilSetup = (raw: string, allowedAgentIds: ReadonlySet<string>): CouncilSetup => {
  const parsed = parseJson(raw);
  const selectedAgentIds = stringArray(parsed.selectedAgentIds, 'selectedAgentIds', 5);
  if (selectedAgentIds.length < 2 || selectedAgentIds.some((id) => !allowedAgentIds.has(id))) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'La composition du Conseil est invalide.');
  }
  if (!Array.isArray(parsed.initialSteps) || parsed.initialSteps.length === 0 || parsed.initialSteps.length > 20) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'Le plan initial du Conseil est invalide.');
  }
  const initialSteps = parsed.initialSteps.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new ExpertPersistenceError('INVALID_AI_RESULT', `L’étape ${index + 1} est invalide.`);
    }
    const item = entry as Record<string, unknown>;
    const assignedAgentId = textValue(item.assignedAgentId, `initialSteps[${index}].assignedAgentId`, 100);
    if (!selectedAgentIds.includes(assignedAgentId)) {
      throw new ExpertPersistenceError('INVALID_AI_RESULT', `L’étape ${index + 1} est assignée à un expert absent.`);
    }
    return {
      title: textValue(item.title, `initialSteps[${index}].title`, 300),
      description: textValue(item.description, `initialSteps[${index}].description`, 2_000),
      assignedAgentId,
    };
  });
  return {
    selectedAgentIds,
    introMessage: textValue(parsed.introMessage, 'introMessage', 4_000),
    initialSteps,
  };
};

export const parseOrchestrationAction = (raw: string, allowedTargets: ReadonlySet<string>): OrchestrationAction => {
  const parsed = parseJson(raw);
  if (parsed.type !== 'NAVIGATE' && parsed.type !== 'ANSWER') {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'Le type d’action proposé est invalide.');
  }
  const type = parsed.type;
  const target = parsed.target === undefined || parsed.target === null ? undefined : textValue(parsed.target, 'target', 80);
  if (type === 'NAVIGATE' && (!target || !allowedTargets.has(target))) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'La destination proposée par le service n’est pas autorisée.');
  }
  const payload = parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload)
    ? parsed.payload as Record<string, unknown>
    : undefined;
  return {
    type,
    target: type === 'NAVIGATE' ? target : undefined,
    explanation: textValue(parsed.explanation, 'explanation', 2_000),
    payload,
  };
};

export const parseAssessmentResult = (raw: string): AssessmentResult => {
  const parsed = parseJson(raw);
  if (typeof parsed.score !== 'number' || !Number.isFinite(parsed.score) || parsed.score < 0 || parsed.score > 100) {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'La note de l’évaluation est invalide.');
  }
  if (parsed.status !== 'acquis' && parsed.status !== 'en_cours' && parsed.status !== 'a_renforcer') {
    throw new ExpertPersistenceError('INVALID_AI_RESULT', 'Le statut de l’évaluation est invalide.');
  }
  return {
    score: Math.round(parsed.score),
    status: parsed.status,
    feedback: textValue(parsed.feedback, 'feedback', 8_000),
  };
};

const randomId = (): string => {
  if (!globalThis.crypto?.randomUUID) {
    throw new ExpertPersistenceError('UUID_UNAVAILABLE', 'La génération d’un identifiant sécurisé est indisponible.');
  }
  return globalThis.crypto.randomUUID();
};

const currentUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ExpertPersistenceError('AUTH_REQUIRED', 'Connectez-vous pour conserver cet échange.');
  return data.user.id;
};

const findSession = async (agentId: string, userId: string) => {
  const { data, error } = await supabase
    .from('agent_chat_sessions')
    .select('id,agent_id,user_id,created_at,updated_at')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .maybeSingle();
  if (error) throw new ExpertPersistenceError('SESSION_READ_FAILED', 'Impossible de charger la session de cet expert.');
  return data;
};

const ensureSession = async (agentId: string): Promise<string> => {
  const normalizedAgentId = textValue(agentId, 'agentId', 100);
  const userId = await currentUserId();
  const existing = await findSession(normalizedAgentId, userId);
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('agent_chat_sessions')
    .insert({ user_id: userId, agent_id: normalizedAgentId })
    .select('id')
    .single();
  if (!error && data) return data.id;
  if (error?.code === '23505') {
    const concurrent = await findSession(normalizedAgentId, userId);
    if (concurrent) return concurrent.id;
  }
  throw new ExpertPersistenceError(
    error?.code === '23503' ? 'EXPERT_NOT_AVAILABLE' : 'SESSION_CREATE_FAILED',
    error?.code === '23503' ? 'Cet expert n’est pas disponible dans le catalogue serveur.' : 'Impossible de créer la session de cet expert.',
  );
};

export const loadExpertMessages = async (agentId: string): Promise<Message[]> => {
  const normalizedAgentId = textValue(agentId, 'agentId', 100);
  const userId = await currentUserId();
  const session = await findSession(normalizedAgentId, userId);
  if (!session) return [];
  const { data, error } = await supabase
    .from('agent_chat_messages')
    .select('id,role,content,image_urls,created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });
  if (error) throw new ExpertPersistenceError('MESSAGE_READ_FAILED', 'Impossible de charger l’historique de cet expert.');
  return (data ?? []).flatMap((row) => {
    if ((row.role !== 'user' && row.role !== 'model') || !row.content.trim()) return [];
    return [{
      id: row.id,
      role: row.role,
      text: row.content,
      timestamp: new Date(row.created_at),
      images: row.image_urls?.filter((url) => /^https:\/\//i.test(url)) ?? undefined,
    } satisfies Message];
  });
};

export const persistExpertMessage = async (
  agentId: string,
  message: Pick<Message, 'id' | 'role' | 'text' | 'images'>,
): Promise<void> => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(message.id)) {
    throw new ExpertPersistenceError('INVALID_MESSAGE_ID', 'L’identifiant du message est invalide.');
  }
  const content = textValue(message.text, 'message', 20_000);
  const sessionId = await ensureSession(agentId);
  const safeImages = message.images?.filter((url) => /^https:\/\//i.test(url)).slice(0, 8) ?? null;
  const { error } = await supabase.from('agent_chat_messages').insert({
    id: message.id,
    session_id: sessionId,
    role: message.role,
    content,
    image_urls: safeImages,
    idempotency_key: message.id,
  });
  if (!error) return;
  if (error.code === '23505') {
    const { data: existing } = await supabase
      .from('agent_chat_messages')
      .select('role,content,session_id')
      .eq('id', message.id)
      .eq('session_id', sessionId)
      .maybeSingle();
    if (existing?.role === message.role && existing.content === content) return;
    throw new ExpertPersistenceError('MESSAGE_ID_CONFLICT', 'Un autre message utilise déjà cet identifiant.');
  }
  throw new ExpertPersistenceError('MESSAGE_SAVE_FAILED', 'Impossible de conserver ce message. Réessayez avant de continuer.');
};

const persistModuleResult = async <T extends object>(
  recordType: string,
  payload: T,
  id = randomId(),
): Promise<ModuleRecord<T>> => moduleRepository.upsert('experts', recordType, payload, {
  id,
  idempotencyKey: `${recordType}:${id}`,
});

export const saveCouncilResult = (payload: CouncilResultPayload, id?: string) =>
  persistModuleResult('council_result', payload, id);

export const listCouncilResults = () =>
  moduleRepository.list<CouncilResultPayload>('experts', 'council_result');

export const saveOrchestrationResult = (payload: OrchestrationResultPayload, id?: string) =>
  persistModuleResult('orchestration_result', payload, id);

export const listOrchestrationResults = () =>
  moduleRepository.list<OrchestrationResultPayload>('experts', 'orchestration_result');

export const saveExpertResult = (payload: ExpertResultPayload, id?: string) =>
  persistModuleResult('expert_result', payload, id);

export const listExpertResults = () =>
  moduleRepository.list<ExpertResultPayload>('experts', 'expert_result');

export const newExpertRecordId = randomId;
