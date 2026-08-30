import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { LiveStream, LiveStageParticipant, LiveType, LiveQualityMode, LiveVisualUniverse } from '../../types';

/**
 * Cycle de vie de session + rôles (LOOP 03/14). live_speakers sert de roster
 * unique pour tout participant connecté — un spectateur obtient une ligne
 * role='viewer' en la créant lui-même, is_hand_raised sur cette même ligne
 * EST la demande de parole, la promotion se fait en changeant `role` sur la
 * même ligne (jamais de réinsertion) — voir la migration
 * live_session_lifecycle_roles pour le détail du schéma.
 */

interface LiveSessionRow {
    id: string;
    host_id: string;
    title: string;
    description: string | null;
    type: LiveType | null;
    host_name: string | null;
    host_avatar: string | null;
    viewers_count: number;
    is_mixed: boolean;
    ai_assistant_id: string | null;
    started_at: string | null;
    ended_at: string | null;
    scheduled_for: string | null;
    timezone: string | null;
    is_scheduled: boolean;
    duration_minutes: number;
    is_paid: boolean;
    pricing: LiveStream['pricing'] | null;
    donation_goal: LiveStream['donationGoal'] | null;
    tags: string[];
    language: string | null;
    target_language: string | null;
    cover_image: string | null;
    is_private: boolean;
    allowed_member_ids: string[];
    tribe_id: string | null;
    tribe_name: string | null;
    expert_id: string | null;
    is_recording_enabled: boolean;
    is_translation_enabled: boolean;
    is_questions_enabled: boolean;
    is_screen_share_enabled: boolean;
    is_vision_enabled: boolean;
    is_data_saver: boolean;
    quality_mode: LiveQualityMode | null;
    dossier_id: string | null;
    dossier_title: string | null;
    is_waiting_room_enabled: boolean;
    course_module_id: string | null;
    interview_guest_name: string | null;
    interview_guest_bio: string | null;
    conf_tracks: string[];
    sensitive_data_alert: boolean;
    visual_universe: LiveVisualUniverse;
}

interface LiveSpeakerRow {
    id: string;
    session_id: string;
    user_id: string | null;
    agent_id: string | null;
    name: string;
    avatar: string | null;
    role: LiveStageParticipant['role'];
    is_muted: boolean;
    is_video_on: boolean;
    is_ai: boolean;
    is_verified: boolean;
    specialty: string | null;
    is_screen_sharing: boolean;
    is_hand_raised: boolean;
    joined_at: string;
    left_at: string | null;
}

function mapSessionRow(row: LiveSessionRow): LiveStream {
    return {
        id: row.id,
        title: row.title,
        description: row.description || undefined,
        type: row.type || undefined,
        hostId: row.host_id,
        hostName: row.host_name || '',
        hostAvatar: row.host_avatar || '',
        viewers: row.viewers_count,
        isMixed: row.is_mixed,
        aiAssistantId: row.ai_assistant_id || undefined,
        startedAt: row.started_at ? new Date(row.started_at) : new Date(),
        endedAt: row.ended_at || undefined,
        scheduledFor: row.scheduled_for || undefined,
        timezone: row.timezone || undefined,
        isScheduled: row.is_scheduled,
        duration: row.duration_minutes,
        isPaid: row.is_paid,
        pricing: row.pricing || undefined,
        donationGoal: row.donation_goal || undefined,
        tags: row.tags || [],
        language: row.language || undefined,
        targetLanguage: row.target_language || undefined,
        coverImage: row.cover_image || undefined,
        isPrivate: row.is_private,
        allowedMemberIds: row.allowed_member_ids || [],
        tribeId: row.tribe_id || undefined,
        tribeName: row.tribe_name || undefined,
        expertId: row.expert_id || undefined,
        isRecordingEnabled: row.is_recording_enabled,
        isTranslationEnabled: row.is_translation_enabled,
        isQuestionsEnabled: row.is_questions_enabled,
        isScreenShareEnabled: row.is_screen_share_enabled,
        isVisionEnabled: row.is_vision_enabled,
        isDataSaver: row.is_data_saver,
        qualityMode: row.quality_mode || undefined,
        dossierId: row.dossier_id || undefined,
        dossierTitle: row.dossier_title || undefined,
        isWaitingRoomEnabled: row.is_waiting_room_enabled,
        courseModuleId: row.course_module_id || undefined,
        interviewGuestName: row.interview_guest_name || undefined,
        interviewGuestBio: row.interview_guest_bio || undefined,
        confTracks: row.conf_tracks || [],
        sensitiveDataAlert: row.sensitive_data_alert,
        visualUniverse: row.visual_universe || 'crystal',
    };
}

function mapSpeakerRow(row: LiveSpeakerRow): LiveStageParticipant {
    return {
        id: row.user_id || row.agent_id || row.id,
        name: row.name,
        avatar: row.avatar || '',
        role: row.role,
        isMuted: row.is_muted,
        isVideoOn: row.is_video_on,
        isAi: row.is_ai,
        isVerified: row.is_verified,
        specialty: row.specialty || undefined,
        agentId: row.agent_id || undefined,
        isScreenSharing: row.is_screen_sharing,
        isHandRaised: row.is_hand_raised,
        joinedAt: row.joined_at ? new Date(row.joined_at) : undefined,
    };
}

export interface CreateLiveSessionParams {
    title: string;
    description?: string;
    type?: LiveType;
    isPrivate?: boolean;
    isQuestionsEnabled?: boolean;
    isScreenShareEnabled?: boolean;
    tribeId?: string;
    tribeName?: string;
    language?: string;
    // LOOP 15/17 (mission Architecte MOCnet) : scheduled_for/is_scheduled/
    // timezone existaient déjà en base et étaient lus (mapSessionRow
    // ci-dessus) mais jamais écrits — LiveCreationModal.tsx les calcule bien
    // mais l'appel réel de création (SocialLive.tsx) ne les transmettait
    // jamais, un Live "programmé" n'avait donc en réalité aucune date en
    // base. Voir docs/SUPABASE_ARCHITECTURE.md, ligne Tâches.
    isScheduled?: boolean;
    scheduledFor?: string;
    timezone?: string;
}

/** Crée une session réelle, hôte = utilisateur courant (contrainte RLS live_sessions_insert_own). */
export async function createLiveSession(
    hostId: string,
    hostName: string,
    hostAvatar: string,
    params: CreateLiveSessionParams,
): Promise<LiveStream> {
    const { data, error } = await supabase
        .from('live_sessions')
        .insert({
            host_id: hostId,
            host_name: hostName,
            host_avatar: hostAvatar,
            title: params.title,
            description: params.description,
            type: params.type,
            is_private: params.isPrivate ?? false,
            is_questions_enabled: params.isQuestionsEnabled ?? true,
            is_screen_share_enabled: params.isScreenShareEnabled ?? true,
            tribe_id: params.tribeId,
            tribe_name: params.tribeName,
            language: params.language,
            is_scheduled: params.isScheduled ?? false,
            scheduled_for: params.scheduledFor ?? null,
            timezone: params.timezone ?? null,
        })
        .select()
        .single();

    if (error || !data) throw new Error(error?.message || 'Échec de création de la session LIVE.');
    return mapSessionRow(data as LiveSessionRow);
}

export async function fetchLiveSession(sessionId: string): Promise<LiveStream | null> {
    const { data, error } = await supabase.from('live_sessions').select('*').eq('id', sessionId).maybeSingle();
    if (error || !data) return null;
    return mapSessionRow(data as LiveSessionRow);
}

/** Démarre le LIVE (started_at) — hôte uniquement (live_sessions_update_host). */
export async function startLiveSession(sessionId: string): Promise<void> {
    const { error } = await supabase.from('live_sessions').update({ started_at: new Date().toISOString() }).eq('id', sessionId);
    if (error) throw new Error(error.message);
}

/** Termine le LIVE (ended_at) — hôte uniquement. */
export async function endLiveSession(sessionId: string): Promise<void> {
    const { error } = await supabase.from('live_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId);
    if (error) throw new Error(error.message);
}

/**
 * Rejoint une session (spectateur par défaut) — upsert sur (session_id,
 * user_id) : un rejoin après déconnexion met à jour la ligne existante
 * (efface left_at) au lieu d'en créer une seconde (contrainte
 * live_speakers_session_user_key).
 */
export async function joinLiveSession(
    sessionId: string,
    participant: { id: string; name: string; avatar?: string },
    role: LiveStageParticipant['role'] = 'viewer',
): Promise<LiveStageParticipant> {
    const { data, error } = await supabase
        .from('live_speakers')
        .upsert(
            {
                session_id: sessionId,
                user_id: participant.id,
                name: participant.name,
                avatar: participant.avatar,
                role,
                left_at: null,
            },
            { onConflict: 'session_id,user_id' },
        )
        .select()
        .single();

    if (error || !data) throw new Error(error?.message || 'Échec pour rejoindre la session LIVE.');
    return mapSpeakerRow(data as LiveSpeakerRow);
}

/** Quitte la session — marque left_at sans supprimer la ligne (historique de présence conservé). */
export async function leaveLiveSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('live_speakers')
        .update({ left_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
}

/** Participants actuellement présents (left_at IS NULL) — tous rôles confondus, y compris 'viewer'. */
export async function fetchActiveParticipants(sessionId: string): Promise<LiveStageParticipant[]> {
    const { data, error } = await supabase
        .from('live_speakers')
        .select('*')
        .eq('session_id', sessionId)
        .is('left_at', null)
        .order('joined_at', { ascending: true });
    if (error || !data) return [];
    return (data as LiveSpeakerRow[]).map(mapSpeakerRow);
}

/**
 * Change le rôle d'un participant (promotion/rétrogradation) — hôte ou
 * modérateur uniquement (live_speakers_write_host_or_moderator), sauf pour
 * sa propre ligne qui reste toujours modifiable par soi-même.
 */
export async function updateParticipantRole(
    sessionId: string,
    targetUserId: string,
    role: LiveStageParticipant['role'],
): Promise<void> {
    const { error } = await supabase
        .from('live_speakers')
        .update({ role })
        .eq('session_id', sessionId)
        .eq('user_id', targetUserId);
    if (error) throw new Error(error.message);
}

/** Lève/baisse sa propre main — c'est la demande de parole (pas de table séparée). */
export async function setHandRaised(sessionId: string, userId: string, raised: boolean): Promise<void> {
    const { error } = await supabase
        .from('live_speakers')
        .update({ is_hand_raised: raised })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
    if (error) throw new Error(error.message);
}

/**
 * Change l'univers visuel actif (LOOP 08/14) — hôte uniquement
 * (live_sessions_update_host), s'applique à tous les participants via la
 * souscription Realtime ci-dessous.
 */
export async function updateVisualUniverse(sessionId: string, universe: LiveVisualUniverse): Promise<void> {
    const { error } = await supabase.from('live_sessions').update({ visual_universe: universe }).eq('id', sessionId);
    if (error) throw new Error(error.message);
}

/**
 * Diffuse les changements d'univers visuel décidés par l'hôte à tous les
 * participants — vérifié réel (Realtime `postgres_changes` UPDATE livré de
 * bout en bout, contrairement au trou d'infrastructure documenté sur
 * live_speakers au LOOP 05/14 : pas besoin de repli par sondage ici).
 */
export function subscribeToLiveSessionUniverse(sessionId: string, onChange: (universe: LiveVisualUniverse) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-session-universe:${sessionId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${sessionId}` },
                (payload) => onChange((payload.new as { visual_universe: LiveVisualUniverse }).visual_universe),
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}
