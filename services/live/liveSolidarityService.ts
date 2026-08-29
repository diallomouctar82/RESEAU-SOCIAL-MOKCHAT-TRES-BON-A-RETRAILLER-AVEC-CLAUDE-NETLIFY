import { supabase } from '../supabaseClient';
import { LiveSolidarityCause, SolidarityBeneficiaryType } from '../../types';

/**
 * Live Solidaire (LOOP 09/14) — création réelle d'une cause depuis le LIVE
 * (typiquement par la voix, voir handleVoiceCommand dans SocialLive.tsx).
 * Le ledger/preuves/mises à jour/donateurs (schéma déjà migré,
 * live_solidarity_schema) n'ont pas encore de consommateur ici — arrivera
 * aux LOOPs 11/12 (preuves via vision, permissions/confidentialité).
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

/** Crée une cause réelle — organisateur = utilisateur courant (contrainte RLS live_solidarity_causes_insert). */
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
