import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { generateJSON } from '../aiGateway';
import {
    LiveSolidarityCause,
    LiveSolidarityLedgerEntry,
    LiveSolidarityProof,
    LiveSolidarityUpdate,
    SolidarityBeneficiaryType,
    SolidarityCauseVisibility,
    SolidarityProofType,
} from '../../types';

/**
 * Live Solidaire (LOOP 09/14 : création de la cause ; LOOP 14/16 : preuves
 * via vision, mises à jour de mission, ledger consommé pour la première
 * fois, niveaux de visibilité basiques, IA de détection d'anomalie). Le
 * ledger/preuves/donateurs n'ont jamais de mouvement réel de fonds — ce
 * sont des tables de suivi/traçabilité déclaratif (voir types.ts), le
 * transfert réel d'argent reste hors périmètre (prestataire de paiement
 * externe non branché dans ce sandbox).
 */

interface LiveSolidarityCauseRow {
    id: string;
    live_session_id: string;
    organizer_id: string;
    title: string;
    beneficiary_description: string;
    beneficiary_type: SolidarityBeneficiaryType;
    target_amount: number | null;
    currency: string;
    organizer_fee_percent: number;
    status: LiveSolidarityCause['status'];
    visibility: SolidarityCauseVisibility;
    created_at: string;
}

function mapRow(row: LiveSolidarityCauseRow): LiveSolidarityCause {
    return {
        id: row.id,
        liveSessionId: row.live_session_id,
        organizerId: row.organizer_id,
        title: row.title,
        beneficiaryDescription: row.beneficiary_description,
        beneficiaryType: row.beneficiary_type,
        targetAmount: row.target_amount ?? undefined,
        currency: row.currency,
        organizerFeePercent: row.organizer_fee_percent,
        status: row.status,
        visibility: row.visibility,
        createdAt: row.created_at,
    };
}

export interface CreateSolidarityCauseParams {
    liveSessionId: string;
    organizerId: string;
    title: string;
    beneficiaryDescription: string;
    beneficiaryType: SolidarityBeneficiaryType;
    targetAmount?: number;
    currency?: string;
}

/** Crée une cause réelle — organisateur = utilisateur courant (contrainte RLS live_solidarity_causes_insert). Visibilité par défaut : participants du LIVE. */
export async function createSolidarityCause(params: CreateSolidarityCauseParams): Promise<LiveSolidarityCause> {
    const { data, error } = await supabase
        .from('live_solidarity_causes')
        .insert({
            live_session_id: params.liveSessionId,
            organizer_id: params.organizerId,
            title: params.title,
            beneficiary_description: params.beneficiaryDescription,
            beneficiary_type: params.beneficiaryType,
            target_amount: params.targetAmount,
            currency: params.currency || 'XOF',
        })
        .select()
        .single();

    if (error || !data) throw new Error(error?.message || 'Échec de création de la mission solidaire.');
    return mapRow(data as LiveSolidarityCauseRow);
}

export async function fetchActiveSolidarityCause(liveSessionId: string): Promise<LiveSolidarityCause | null> {
    const { data, error } = await supabase
        .from('live_solidarity_causes')
        .select('*')
        .eq('live_session_id', liveSessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as LiveSolidarityCauseRow);
}

/** Niveaux de visibilité basiques (LOOP 14/16) — organisateur seulement, contrainte RLS live_solidarity_causes_update. */
export async function updateSolidarityCauseVisibility(causeId: string, visibility: SolidarityCauseVisibility): Promise<void> {
    const { error } = await supabase.from('live_solidarity_causes').update({ visibility }).eq('id', causeId);
    if (error) throw new Error(error.message || 'Échec de mise à jour de la visibilité.');
}

/** Diffuse en temps réel la création/mise à jour de la cause active d'une session (visibilité, statut...). */
export function subscribeToSolidarityCause(liveSessionId: string, onChange: (cause: LiveSolidarityCause) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-solidarity-cause:${liveSessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_solidarity_causes', filter: `live_session_id=eq.${liveSessionId}` }, (payload) => {
                onChange(mapRow(payload.new as LiveSolidarityCauseRow));
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_solidarity_causes', filter: `live_session_id=eq.${liveSessionId}` }, (payload) => {
                onChange(mapRow(payload.new as LiveSolidarityCauseRow));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}

// --- Ledger (append-only, saisie déclarative de l'organisateur — jamais un vrai mouvement de fonds) ---

interface LedgerRow {
    id: string;
    cause_id: string;
    entry_type: 'collected' | 'used';
    amount: number;
    description: string | null;
    created_by: string | null;
    created_at: string;
}

function mapLedgerRow(row: LedgerRow): LiveSolidarityLedgerEntry {
    return {
        id: row.id,
        causeId: row.cause_id,
        entryType: row.entry_type,
        amount: row.amount,
        description: row.description || undefined,
        createdBy: row.created_by || undefined,
        createdAt: row.created_at,
    };
}

export async function fetchSolidarityLedger(causeId: string): Promise<LiveSolidarityLedgerEntry[]> {
    const { data, error } = await supabase
        .from('live_solidarity_wallet_ledger')
        .select('*')
        .eq('cause_id', causeId)
        .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as LedgerRow[]).map(mapLedgerRow);
}

export async function addSolidarityLedgerEntry(params: {
    causeId: string;
    entryType: 'collected' | 'used';
    amount: number;
    description?: string;
    createdBy: string;
}): Promise<LiveSolidarityLedgerEntry> {
    const { data, error } = await supabase
        .from('live_solidarity_wallet_ledger')
        .insert({
            cause_id: params.causeId,
            entry_type: params.entryType,
            amount: params.amount,
            description: params.description,
            created_by: params.createdBy,
        })
        .select()
        .single();
    if (error || !data) throw new Error(error?.message || "Échec d'enregistrement de l'écriture.");
    return mapLedgerRow(data as LedgerRow);
}

// --- Preuves structurées (photo/facture/reçu/document), preuve de dépense via vision ---

interface ProofRow {
    id: string;
    cause_id: string;
    step_label: string;
    expense_description: string | null;
    amount: number | null;
    proof_type: SolidarityProofType;
    document_url: string | null;
    created_by: string | null;
    created_at: string;
}

function mapProofRow(row: ProofRow): LiveSolidarityProof {
    return {
        id: row.id,
        causeId: row.cause_id,
        stepLabel: row.step_label,
        expenseDescription: row.expense_description || undefined,
        amount: row.amount ?? undefined,
        proofType: row.proof_type,
        documentUrl: row.document_url || undefined,
        createdBy: row.created_by || undefined,
        createdAt: row.created_at,
    };
}

export async function fetchSolidarityProofs(causeId: string): Promise<LiveSolidarityProof[]> {
    const { data, error } = await supabase
        .from('live_solidarity_proofs')
        .select('*')
        .eq('cause_id', causeId)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as ProofRow[]).map(mapProofRow);
}

export async function addSolidarityProof(params: {
    causeId: string;
    stepLabel: string;
    expenseDescription?: string;
    amount?: number;
    proofType: SolidarityProofType;
    documentUrl?: string;
    createdBy: string;
}): Promise<LiveSolidarityProof> {
    const { data, error } = await supabase
        .from('live_solidarity_proofs')
        .insert({
            cause_id: params.causeId,
            step_label: params.stepLabel,
            expense_description: params.expenseDescription,
            amount: params.amount,
            proof_type: params.proofType,
            document_url: params.documentUrl,
            created_by: params.createdBy,
        })
        .select()
        .single();
    if (error || !data) throw new Error(error?.message || "Échec d'enregistrement de la preuve.");
    return mapProofRow(data as ProofRow);
}

export function subscribeToSolidarityProofs(causeId: string, onProof: (p: LiveSolidarityProof) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-solidarity-proofs:${causeId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_solidarity_proofs', filter: `cause_id=eq.${causeId}` }, (payload) => {
                onProof(mapProofRow(payload.new as ProofRow));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}

// --- Mises à jour de mission (organisateur) ---

interface UpdateRow {
    id: string;
    cause_id: string;
    author_id: string | null;
    text: string;
    created_at: string;
}

function mapUpdateRow(row: UpdateRow): LiveSolidarityUpdate {
    return {
        id: row.id,
        causeId: row.cause_id,
        authorId: row.author_id || undefined,
        text: row.text,
        createdAt: row.created_at,
    };
}

export async function fetchSolidarityUpdates(causeId: string): Promise<LiveSolidarityUpdate[]> {
    const { data, error } = await supabase
        .from('live_solidarity_updates')
        .select('*')
        .eq('cause_id', causeId)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as UpdateRow[]).map(mapUpdateRow);
}

export async function addSolidarityUpdate(causeId: string, authorId: string, text: string): Promise<LiveSolidarityUpdate> {
    const { data, error } = await supabase
        .from('live_solidarity_updates')
        .insert({ cause_id: causeId, author_id: authorId, text })
        .select()
        .single();
    if (error || !data) throw new Error(error?.message || "Échec de publication de la mise à jour.");
    return mapUpdateRow(data as UpdateRow);
}

export function subscribeToSolidarityUpdates(causeId: string, onUpdate: (u: LiveSolidarityUpdate) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-solidarity-updates:${causeId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_solidarity_updates', filter: `cause_id=eq.${causeId}` }, (payload) => {
                onUpdate(mapUpdateRow(payload.new as UpdateRow));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}

// --- IA de détection d'anomalies (LOOP 14/16) — toujours formulée en question, jamais en accusation ---

export interface SolidarityAnomalyCheck {
    /** false si l'IA était indisponible — dans ce cas `questions` est
     * toujours vide et ne doit JAMAIS être lu comme "rien à signaler",
     * pour ne pas transformer un échec silencieux en fausse tranquillité. */
    checked: boolean;
    questions: string[];
}

/**
 * Analyse les lignes réelles du ledger et des preuves d'une cause pour
 * repérer des incohérences (dépense sans justificatif, montant qui ne
 * correspond à aucune preuve, longue période sans mise à jour...).
 * Formule toujours en question neutre adressée à l'organisateur — jamais
 * une accusation automatique de fraude (spec Live Solidaire, point 22).
 */
export async function detectSolidarityAnomalies(
    cause: LiveSolidarityCause,
    ledger: LiveSolidarityLedgerEntry[],
    proofs: LiveSolidarityProof[],
): Promise<SolidarityAnomalyCheck> {
    if (ledger.length === 0 && proofs.length === 0) {
        return { checked: true, questions: [] };
    }
    const ledgerSummary = ledger.map((e) => `- [${e.entryType === 'collected' ? 'collecté' : 'utilisé'}] ${e.amount} ${cause.currency} — ${e.description || 'sans description'} (${e.createdAt})`).join('\n') || 'aucune écriture';
    const proofsSummary = proofs.map((p) => `- Étape "${p.stepLabel}" — ${p.amount ?? '?'} ${cause.currency} — ${p.expenseDescription || 'sans description'} — pièce jointe : ${p.documentUrl ? 'oui' : 'NON'} (${p.createdAt})`).join('\n') || 'aucune preuve';

    const prompt = `Mission de solidarité "${cause.title}" (${cause.beneficiaryType}), objectif ${cause.targetAmount ?? 'non fixé'} ${cause.currency}.

Écritures du ledger (déclaratif, saisi par l'organisateur) :
${ledgerSummary}

Preuves déposées :
${proofsSummary}

Identifie au maximum 3 points qui méritent une clarification de la part de l'organisateur (ex. dépense sans preuve jointe, montant d'une preuve qui ne correspond à aucune écriture "utilisé", écart notable entre collecté et utilisé). Formule CHAQUE point comme UNE question neutre et courte adressée à l'organisateur — jamais une affirmation, jamais une accusation, jamais le mot "fraude" ou "suspect". S'il n'y a rien à signaler, renvoie une liste vide.

Réponds UNIQUEMENT en JSON strict : { "questions": ["...", "..."] }`;

    try {
        const result = await generateJSON<{ questions?: string[] }>(prompt);
        const questions = Array.isArray(result?.questions) ? result.questions.filter((q) => typeof q === 'string' && q.trim().length > 0) : [];
        return { checked: true, questions: questions.slice(0, 3) };
    } catch {
        // Dégradation gracieuse : une IA indisponible ne doit jamais être
        // présentée comme "tout est en ordre" — `checked: false` le dit.
        return { checked: false, questions: [] };
    }
}
