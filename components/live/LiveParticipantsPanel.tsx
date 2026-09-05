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
    /**
     * L4 — QUI EST INVITÉ : personnes que l'hôte a invitées ce direct et qui
     * ne sont pas encore entrées. Construit côté hôte à l'envoi de
     * l'invitation (l'hôte ne peut pas relire les notifications d'autrui),
     * jamais une supposition. Vide pour un spectateur.
     */
    invited?: { id: string; name: string; avatar?: string }[];
}

/**
 * MB-1 — Un geste de scène = une cible d'au moins 44 px QUI PORTE SON NOM.
 *
 * Avant : trois ronds de 32 px, icône seule, distingués par un `title` qu'un
 * téléphone n'affiche jamais (mesuré au banc, 390×844). « ↓ » et le rond rouge
 * se ressemblaient — or l'un GARDE la personne dans le direct et l'autre
 * l'EXPULSE. Le libellé n'est donc pas un ornement : c'est ce qui sépare deux
 * gestes aux conséquences opposées.
 *
 * `ton` porte cette différence dans la couleur, pas seulement dans le mot :
 * `primaire` = le geste qu'on attend (faire monter), `neutre` = un
 * ajustement réversible, `danger` = on sort quelqu'un du direct.
 */
const BoutonGeste: React.FC<{
    onClick: () => void;
    testId: string;
    ariaLabel: string;
    libelle: string;
    icone: React.ReactNode;
    ton?: 'primaire' | 'neutre' | 'danger';
}> = ({ onClick, testId, ariaLabel, libelle, icone, ton = 'neutre' }) => (
    <button
        type="button"
        onClick={onClick}
        data-testid={testId}
        aria-label={ariaLabel}
        className={`live-orb !rounded-xl min-h-[44px] px-3 py-2 flex items-center justify-center gap-1.5 text-[11px] font-bold whitespace-nowrap ${
            ton === 'primaire' ? 'live-orb--active' : ton === 'danger' ? 'live-orb--danger' : ''
        }`}
    >
        {icone}
        <span>{libelle}</span>
    </button>
);

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
            className="live-pane flex flex-wrap items-center gap-2.5 px-2.5 py-2 !rounded-2xl"
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
                <span className="flex items-center gap-1.5 text-[10px] mt-0.5" style={{ color: 'var(--live-ink-soft)' }}>
                    {/* MB-2 : le rôle devient une PASTILLE, pas une ligne grise de
                        10 px. C'est la première chose à lire sur une ligne de
                        personne — qui anime, qui est sur scène, qui regarde. Le
                        libellé vient de ROLE_LABELS, donc du rôle RÉEL de
                        `live_speakers` : jamais un rôle que la base ne porte pas. */}
                    <span
                        data-testid={`live-role-${p.id}`}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.06em]"
                        style={
                            p.role === 'host'
                                ? { background: 'var(--live-accent)', color: '#04202a' }
                                : { background: 'rgba(255,255,255,.08)', color: 'var(--live-ink)', border: '1px solid var(--live-line)' }
                        }
                    >
                        {ROLE_LABELS[p.role]}
                    </span>
                    {surScene && (p.isMuted
                        ? <MicOff size={12} aria-label="Micro coupé" />
                        : <Mic size={12} aria-label="Micro ouvert" />)}
                    {surScene && (p.isVideoOn
                        ? <Video size={12} aria-label="Caméra allumée" />
                        : <VideoOff size={12} aria-label="Caméra éteinte" />)}
                </span>
            </span>

            {/* MB-1 : les gestes passent sur leur PROPRE ligne, en pleine largeur.
                Serrés à droite du nom, ils ne pouvaient pas dépasser 32 px sur un
                téléphone ni porter de libellé — c'est la place qui manquait, pas
                la volonté. `basis-full` fait passer ce bloc à la ligne. */}
            {commandable && (
                <span className="basis-full flex items-center gap-2 flex-wrap">
                    {surScene ? (
                        <>
                            <BoutonGeste
                                onClick={() => props.onToggleMute(p.id, !p.isMuted)}
                                testId={`live-mute-${p.id}`}
                                ariaLabel={p.isMuted ? `Rendre le micro à ${p.name}` : `Couper le micro de ${p.name}`}
                                libelle={p.isMuted ? 'Rendre le micro' : 'Couper le micro'}
                                icone={p.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                                ton={p.isMuted ? 'danger' : 'neutre'}
                            />
                            <BoutonGeste
                                onClick={() => props.onDemote(p.id)}
                                testId={`live-demote-${p.id}`}
                                ariaLabel={`Faire descendre ${p.name} dans le public`}
                                libelle="Faire descendre"
                                icone={<ArrowDown size={14} />}
                            />
                        </>
                    ) : (
                        <BoutonGeste
                            onClick={() => props.onPromote(p.id)}
                            testId={`live-promote-${p.id}`}
                            ariaLabel={`Faire monter ${p.name} sur scène`}
                            libelle="Faire monter"
                            icone={<ArrowUp size={14} />}
                            ton="primaire"
                        />
                    )}
                    <BoutonGeste
                        onClick={() => props.onRemove(p.id)}
                        testId={`live-remove-${p.id}`}
                        ariaLabel={`Retirer ${p.name} du direct`}
                        libelle="Retirer du direct"
                        icone={<UserMinus size={14} />}
                        ton="danger"
                    />
                </span>
            )}

            {isHost && p.isAi && p.agentId && props.onRemoveAgent && (
                <span className="basis-full flex items-center gap-2">
                    <BoutonGeste
                        onClick={() => props.onRemoveAgent?.(p.agentId!)}
                        testId={`live-remove-agent-${p.agentId}`}
                        ariaLabel={`Retirer ${p.name} de la scène`}
                        libelle="Retirer de la scène"
                        icone={<UserMinus size={14} />}
                    />
                </span>
            )}
        </li>
    );
};

export const LiveParticipantsPanel: React.FC<LiveParticipantsPanelProps> = (props) => {
    const { participants, isHost, invited } = props;
    const surScene = participants.filter(p => isOnStageRole(p.role) || p.isAi);
    const dansLePublic = participants.filter(p => !isOnStageRole(p.role) && !p.isAi);
    const mainsLevees = dansLePublic.filter(p => p.isHandRaised).length;

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-4" data-testid="live-participants-panel">
            <button
                type="button"
                onClick={props.onInvite}
                data-testid="live-invite-open"
                className="w-full live-orb live-orb--active !rounded-xl min-h-[44px] px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
                <UserPlus size={16} /> Inviter quelqu’un
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

            {/* L4 — QUI EST INVITÉ. Séparé du public (qui regarde déjà) : une
                personne invitée n'est pas encore entrée. Réservé à l'hôte, qui
                seul connaît honnêtement la liste (les notifications d'autrui ne
                sont pas lisibles). Elle disparaît d'ici dès qu'elle rejoint. */}
            {isHost && (
                <section data-testid="live-invited-section">
                    <h4 className="live-title text-[10px] mb-2" data-testid="live-invited-heading">
                        Invité·e·s · {invited?.length ?? 0}
                    </h4>
                    {(!invited || invited.length === 0) ? (
                        <p className="text-[11px]" style={{ color: 'var(--live-ink-soft)' }} data-testid="live-invited-empty">
                            Personne d’invité pour l’instant. « Inviter quelqu’un » ci-dessus
                            envoie une vraie invitation.
                        </p>
                    ) : (
                        <ul className="space-y-1.5">
                            {invited.map(iv => (
                                <li
                                    key={iv.id}
                                    data-testid={`live-invited-${iv.id}`}
                                    className="live-pane flex items-center gap-2.5 px-2.5 py-2 !rounded-2xl"
                                >
                                    {iv.avatar
                                        ? <img src={iv.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                                        : (
                                            <span
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-light shrink-0 border"
                                                style={{ borderColor: 'var(--live-line)', color: 'var(--live-ink)', background: 'rgba(255,255,255,.06)' }}
                                            >
                                                {iv.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[12px] font-semibold truncate" style={{ color: 'var(--live-ink)' }}>{iv.name}</span>
                                        <span className="block text-[10px]" style={{ color: 'var(--live-ink-soft)' }}>Invité·e — en attente d’entrée</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

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
