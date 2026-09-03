import React from 'react';
import { Mic, MicOff, Hand, UserPlus, UserMinus, ArrowUp, ArrowDown, Bot, ShieldCheck, Video, VideoOff } from 'lucide-react';
import { LiveStageParticipant } from '../../types';

/**
 * LV-1 / LV-3 — Le panneau « Personnes » du Studio Live.
 *
 * Il répond à la première exigence de la Direction (03/09/2026) : « voir qui
 * est en ligne, rejoindre, inviter, gérer les micros, retirer quelqu'un ».
 *
 * Ce composant n'invente RIEN : il reçoit la liste telle qu'elle vient de
 * `live_speakers` (humains réellement présents, `left_at IS NULL`) et la liste
 * des agents IA convoqués — et il les distingue à l'écran, parce que ce ne
 * sont pas la même chose : un agent n'a pas de compte, ne « rejoint » pas, et
 * ne peut pas être retiré du direct de la même manière.
 *
 * Aucune action n'est offerte qui ne soit réellement exécutable : les
 * commandes d'animation n'apparaissent que pour l'hôte, jamais pour soi-même
 * (on ne se retire pas de son propre direct depuis cette liste — il y a
 * « Quitter » pour ça), et jamais sur un agent.
 */

export const SCENE_ROLES: LiveStageParticipant['role'][] = [
    'host', 'cohost', 'speaker', 'guest', 'expert_human', 'moderator',
];

/** Une personne est « sur scène » quand son rôle l'autorise à publier. */
export function isOnStageRole(role: LiveStageParticipant['role']): boolean {
    return SCENE_ROLES.includes(role);
}

export const ROLE_LABELS: Record<LiveStageParticipant['role'], string> = {
    host: 'Animateur',
    cohost: 'Co-animateur',
    moderator: 'Modérateur',
    speaker: 'Sur scène',
    guest: 'Invité',
    expert_human: 'Expert',
    viewer: 'Spectateur',
    expert_ai: 'Agent IA',
    secretary_ai: 'Agent IA',
    moderator_ai: 'Agent IA',
    director_ai: 'Agent IA',
};

export interface LiveParticipantsPanelProps {
    participants: LiveStageParticipant[];
    currentUserId: string;
    isHost: boolean;
    /** Monter quelqu'un sur scène (role → 'speaker'). */
    onPromote: (participantId: string) => void;
    /** Redescendre quelqu'un dans le public (role → 'viewer'). */
    onDemote: (participantId: string) => void;
    /** Couper/rendre le micro de quelqu'un — écrit en base, appliqué chez la personne. */
    onToggleMute: (participantId: string, nextMuted: boolean) => void;
    /** Retirer quelqu'un du direct. */
    onRemove: (participantId: string) => void;
    /** Ouvrir la fenêtre d'invitation (amis / agents). */
    onInvite: () => void;
    /** Retirer un agent IA de la scène (hôte seulement). */
    onRemoveAgent?: (agentId: string) => void;
}

const Ligne: React.FC<{
    p: LiveStageParticipant;
    props: LiveParticipantsPanelProps;
}> = ({ p, props }) => {
    const { currentUserId, isHost } = props;
    const cestMoi = p.id === currentUserId;
    const surScene = isOnStageRole(p.role);
    // L'hôte commande tout le monde SAUF lui-même. Un agent se retire par son
    // propre chemin (il n'a pas de ligne live_speakers à modifier).
    const commandable = isHost && !cestMoi && !p.isAi;

    return (
        <li
            data-testid={`live-participant-${p.id}`}
            className="live-pane flex items-center gap-2.5 px-2.5 py-2 !rounded-2xl"
        >
            <span className="relative shrink-0">
                {p.avatar
                    ? <img src={p.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : (
                        <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-light border"
                            style={{ borderColor: 'var(--live-line)', color: 'var(--live-ink)', background: 'rgba(255,255,255,.06)' }}
                        >
                            {p.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                {p.isHandRaised && (
                    <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--live-accent)', color: '#04202a' }}
                        title="Demande la parole"
                        data-testid={`live-hand-${p.id}`}
                    >
                        <Hand size={9} />
                    </span>
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--live-ink)' }}>
                        {p.name}{cestMoi ? ' · vous' : ''}
                    </span>
                    {p.isAi && <Bot size={11} style={{ color: 'var(--live-accent)' }} aria-label="Agent IA" />}
                    {p.isVerified && !p.isAi && <ShieldCheck size={11} style={{ color: 'var(--live-accent)' }} aria-label="Vérifié" />}
                </span>
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--live-ink-soft)' }}>
                    <span>{ROLE_LABELS[p.role]}</span>
                    {surScene && (p.isMuted
                        ? <MicOff size={10} aria-label="Micro coupé" />
                        : <Mic size={10} aria-label="Micro ouvert" />)}
                    {surScene && (p.isVideoOn
                        ? <Video size={10} aria-label="Caméra allumée" />
                        : <VideoOff size={10} aria-label="Caméra éteinte" />)}
                </span>
            </span>

            {commandable && (
                <span className="flex items-center gap-1 shrink-0">
                    {surScene ? (
                        <>
                            <button
                                type="button"
                                onClick={() => props.onToggleMute(p.id, !p.isMuted)}
                                data-testid={`live-mute-${p.id}`}
                                title={p.isMuted ? 'Rendre le micro' : 'Couper le micro'}
                                aria-label={p.isMuted ? `Rendre le micro à ${p.name}` : `Couper le micro de ${p.name}`}
                                className={`live-orb w-8 h-8 ${p.isMuted ? 'live-orb--danger' : ''}`}
                            >
                                {p.isMuted ? <MicOff size={13} /> : <Mic size={13} />}
                            </button>
                            <button
                                type="button"
                                onClick={() => props.onDemote(p.id)}
                                data-testid={`live-demote-${p.id}`}
                                title="Redescendre dans le public"
                                aria-label={`Redescendre ${p.name} dans le public`}
                                className="live-orb w-8 h-8"
                            >
                                <ArrowDown size={13} />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => props.onPromote(p.id)}
                            data-testid={`live-promote-${p.id}`}
                            title="Monter sur scène"
                            aria-label={`Monter ${p.name} sur scène`}
                            className="live-orb live-orb--active w-8 h-8"
                        >
                            <ArrowUp size={13} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => props.onRemove(p.id)}
                        data-testid={`live-remove-${p.id}`}
                        title="Retirer du direct"
                        aria-label={`Retirer ${p.name} du direct`}
                        className="live-orb live-orb--danger w-8 h-8"
                    >
                        <UserMinus size={13} />
                    </button>
                </span>
            )}

            {isHost && p.isAi && p.agentId && props.onRemoveAgent && (
                <button
                    type="button"
                    onClick={() => props.onRemoveAgent?.(p.agentId!)}
                    data-testid={`live-remove-agent-${p.agentId}`}
                    title="Retirer l’agent de la scène"
                    aria-label={`Retirer ${p.name} de la scène`}
                    className="live-orb w-8 h-8 shrink-0"
                >
                    <UserMinus size={13} />
                </button>
            )}
        </li>
    );
};

export const LiveParticipantsPanel: React.FC<LiveParticipantsPanelProps> = (props) => {
    const { participants, isHost } = props;
    const surScene = participants.filter(p => isOnStageRole(p.role) || p.isAi);
    const dansLePublic = participants.filter(p => !isOnStageRole(p.role) && !p.isAi);
    const mainsLevees = dansLePublic.filter(p => p.isHandRaised).length;

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4" data-testid="live-participants-panel">
            <button
                type="button"
                onClick={props.onInvite}
                data-testid="live-invite-open"
                className="w-full live-orb live-orb--active !rounded-xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
                <UserPlus size={14} /> Inviter quelqu’un
            </button>

            <section>
                <h4 className="live-title text-[10px] mb-2" data-testid="live-onstage-heading">
                    Sur scène · {surScene.length}
                </h4>
                {surScene.length === 0 ? (
                    <p className="text-[11px]" style={{ color: 'var(--live-ink-soft)' }}>
                        Personne ne diffuse encore.
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {surScene.map(p => <Ligne key={p.id} p={p} props={props} />)}
                    </ul>
                )}
            </section>

            <section>
                <h4 className="live-title text-[10px] mb-2" data-testid="live-audience-heading">
                    Dans le public · {dansLePublic.length}
                    {mainsLevees > 0 && (
                        <span className="ml-2 normal-case tracking-normal font-normal" style={{ color: 'var(--live-accent)' }}>
                            {mainsLevees} main{mainsLevees > 1 ? 's' : ''} levée{mainsLevees > 1 ? 's' : ''}
                        </span>
                    )}
                </h4>
                {dansLePublic.length === 0 ? (
                    <p className="text-[11px]" style={{ color: 'var(--live-ink-soft)' }} data-testid="live-audience-empty">
                        {/* Honnêteté : « aucun spectateur » est une information, pas un
                            échec — et surtout ce n'est PAS la même chose que « on ne
                            sait pas », que l'ancien écran laissait croire. */}
                        Aucun spectateur pour l’instant. Partagez le lien du direct pour en accueillir.
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {dansLePublic.map(p => <Ligne key={p.id} p={p} props={props} />)}
                    </ul>
                )}
            </section>

            {!isHost && (
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--live-ink-soft)' }}>
                    Seul l’animateur peut monter quelqu’un sur scène, couper un micro ou
                    retirer une personne du direct.
                </p>
            )}
        </div>
    );
};

export default LiveParticipantsPanel;
