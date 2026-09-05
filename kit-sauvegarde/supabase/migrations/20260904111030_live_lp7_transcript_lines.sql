-- LP-7 — la parole du direct, transcrite UNE fois, GARDÉE.
--
-- Une ligne par phrase captée, en append-only. C'est le socle de tout ce qui
-- suit dans la mission LIVE PLANÉTAIRE : « me mettre à jour », compte-rendu
-- structuré, questions intelligentes, extraits. Sans cette matière, chacune
-- de ces fonctions devrait re-transcrire le direct pour son propre compte —
-- ce que la mutualisation interdit précisément.
--
-- POURQUOI PAS `live_replays.transcript` (jsonb, déjà là) : c'est un bloc
-- écrit UNE fois à la fin. Y ajouter une phrase pendant le direct
-- demanderait de relire et réécrire tout le bloc à chaque fois — deux
-- intervenants qui parlent en même temps s'écraseraient mutuellement. Le
-- replay reste la destination ; ceci en est la source.
--
-- POURQUOI PAS `live_personal_notes` : sa forme (catégorie, module cible,
-- rappel) est celle d'une note écrite À LA MAIN par quelqu'un pour
-- lui-même. Ce n'est pas de la parole transcrite.
create table if not exists public.live_transcript_lines (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.live_sessions(id) on delete cascade,
    -- NULL = un expert IA ou un agent : ils parlent, ils n'ont pas de compte.
    speaker_id uuid references public.profiles(id) on delete set null,
    -- Dénormalisé, même convention que live_messages.author_name : un expert
    -- IA n'a pas de ligne dans profiles, et un compte supprimé ne doit pas
    -- rendre le compte-rendu illisible.
    speaker_name text,
    -- Les mots d'origine, tels que prononcés. Jamais une traduction : elles
    -- se recalculent, la parole non.
    text text not null,
    -- Langue DÉTECTÉE par la transcription, NULL si elle ne l'a pas rendue.
    -- Jamais la langue déclarée du profil : ce serait une supposition.
    language text,
    spoken_at timestamptz not null default now()
);

create index if not exists live_transcript_lines_session_idx
    on public.live_transcript_lines (session_id, spoken_at);

alter table public.live_transcript_lines enable row level security;

-- Lecture : exactement le même périmètre que le chat du direct.
create policy live_transcript_lines_select on public.live_transcript_lines
    for select using (can_view_live_session(session_id));

-- Écriture : par la personne elle-même, et SEULEMENT si l'animateur a activé
-- l'enregistrement de ce direct. C'est la réponse à « ne jamais stocker
-- inutilement la totalité de la conversation vocale » : par défaut
-- (`is_recording_enabled` = false), la parole voyage dans la room et ne se
-- pose nulle part. La garder est une décision, pas un effet de bord.
create policy live_transcript_lines_insert_own on public.live_transcript_lines
    for insert with check (
        speaker_id = (select auth.uid())
        and can_view_live_session(session_id)
        and exists (
            select 1 from public.live_sessions s
            where s.id = session_id and s.is_recording_enabled
        )
    );

-- Ni UPDATE ni DELETE côté client : une parole gardée ne se réécrit pas.
-- L'animateur efface le direct entier (cascade) ; la rétention ci-dessous
-- fait le reste.

-- Rétention : un direct terminé depuis plus de 30 jours n'a plus besoin de sa
-- transcription mot à mot — le compte-rendu et le replay, eux, restent.
-- Sans ce ménage, « gardée » finirait par vouloir dire « pour toujours ».
create or replace function public.purge_expired_live_transcripts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    supprimees integer;
begin
    delete from public.live_transcript_lines l
    using public.live_sessions s
    where l.session_id = s.id
      and s.ended_at is not null
      and s.ended_at < now() - interval '30 days';
    get diagnostics supprimees = row_count;
    return supprimees;
end;
$$;

revoke execute on function public.purge_expired_live_transcripts() from public, anon, authenticated;

select cron.schedule(
    'purge-expired-live-transcripts',
    '30 3 * * *',
    $$select public.purge_expired_live_transcripts();$$
);

comment on table public.live_transcript_lines is
    'LP-7 — parole du direct transcrite une seule fois, gardée uniquement si l''animateur a activé l''enregistrement (live_sessions.is_recording_enabled). Append-only, purgée 30 jours après la fin du direct.';
