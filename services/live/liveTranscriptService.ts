import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * LP-7 — les NOTES VIVANTES du direct : la parole, transcrite une seule fois,
 * gardée quand — et seulement quand — l'animateur a activé l'enregistrement.
 *
 * C'est le socle de ce qui suit dans la mission LIVE PLANÉTAIRE : « me mettre
 * à jour », le compte-rendu structuré, les questions intelligentes, les
 * extraits. Chacune de ces fonctions lira CETTE matière ; aucune ne
 * re-transcrira le direct pour son propre compte.
 *
 * DEUX GARDE-FOUS, et ils comptent autant que la fonction elle-même :
 *
 *  1. Rien n'est gardé par défaut. `live_sessions.is_recording_enabled` vaut
 *     `false` à la création, et la policy d'insertion l'exige explicitement —
 *     un client modifié ne peut pas passer outre. Sans ce choix de
 *     l'animateur, la parole voyage dans la room (sous-titres) et ne se pose
 *     nulle part.
 *
 *  2. On garde les mots D'ORIGINE, jamais les traductions. Elles se
 *     recalculent à partir de l'original ; les stocker toutes multiplierait le
 *     volume par le nombre de langues pour zéro information nouvelle.
 */

export interface LiveTranscriptRow {
    id: string;
    sessionId: string;
    speakerId: string | null;
    speakerName: string | null;
    text: string;
    /** Langue DÉTECTÉE, `null` si la transcription ne l'a pas rendue. */
    language: string | null;
    spokenAt: string;
}

interface RawRow {
    id: string;
    session_id: string;
    speaker_id: string | null;
    speaker_name: string | null;
    text: string;
    language: string | null;
    spoken_at: string;
}

function mapRow(row: RawRow): LiveTranscriptRow {
    return {
        id: row.id,
        sessionId: row.session_id,
        speakerId: row.speaker_id,
        speakerName: row.speaker_name,
        text: row.text,
        language: row.language,
        spokenAt: row.spoken_at,
    };
}

/**
 * Garde une phrase du direct.
 *
 * Ne lève JAMAIS : une phrase non gardée ne doit pas interrompre la parole en
 * cours, qui est la vraie fonction du direct. Le refus attendu — l'animateur
 * n'a pas activé l'enregistrement — passe par la policy RLS et se traduit ici
 * par un simple `false`, pas par une erreur à afficher.
 *
 * Retourne `true` seulement si la ligne existe réellement en base : jamais un
 * succès supposé.
 */
export async function keepLiveTranscriptLine(input: {
    sessionId: string;
    speakerId: string;
    speakerName?: string | null;
    text: string;
    language?: string | null;
}): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    if (!input.text.trim()) return false;
    const { error } = await supabase.from('live_transcript_lines').insert({
        session_id: input.sessionId,
        speaker_id: input.speakerId,
        speaker_name: input.speakerName ?? null,
        text: input.text,
        language: input.language ?? null,
    });
    return !error;
}

/**
 * Relit la parole gardée d'un direct, dans l'ordre où elle a été prononcée.
 * Bornée : un direct de plusieurs heures ne doit pas revenir d'un bloc.
 */
export async function getLiveTranscript(
    sessionId: string,
    options?: { limit?: number; since?: string },
): Promise<LiveTranscriptRow[]> {
    if (!isSupabaseConfigured) return [];
    let query = supabase
        .from('live_transcript_lines')
        .select('id, session_id, speaker_id, speaker_name, text, language, spoken_at')
        .eq('session_id', sessionId)
        .order('spoken_at', { ascending: true })
        .limit(options?.limit ?? 500);
    if (options?.since) query = query.gt('spoken_at', options.since);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as RawRow[]).map(mapRow);
}
