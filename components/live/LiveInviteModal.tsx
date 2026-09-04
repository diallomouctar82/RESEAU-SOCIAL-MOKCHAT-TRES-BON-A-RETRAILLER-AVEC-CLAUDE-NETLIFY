import React from 'react';
import { X, UserPlus, Bot, Link2, Check, Loader2 } from 'lucide-react';
import { Agent } from '../../types';

/**
 * LV-4 — « Inviter quelqu'un » dans un direct.
 *
 * Trois chemins, volontairement distincts parce qu'ils n'ont pas les mêmes
 * conséquences :
 *
 * 1. **Un ami** → une VRAIE notification chez lui (fonction
 *    `invite_to_live_session`, droits vérifiés en base). Ce chemin n'existait
 *    nulle part : la policy `notifications_owner` interdit d'écrire une
 *    notification pour autrui, donc aucune invitation n'était possible.
 * 2. **Un agent IA** → il monte sur la scène tout de suite. Un agent n'a pas
 *    de compte, ne reçoit pas de notification, et ne « décide » pas de venir.
 * 3. **Le lien du direct** → pour toute personne hors de mes amis.
 *
 * Rien n'est annoncé comme fait avant de l'être : chaque invitation d'ami
 * passe par un état « en cours » puis « envoyée », et un échec réel s'affiche
 * tel quel.
 */

export interface LiveInviteFriend {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
}

export type InviteState = 'idle' | 'sending' | 'sent' | 'error';

export interface LiveInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Amis réels (relation acceptée), déjà résolus par l'appelant. */
    friends: LiveInviteFriend[];
    friendsLoading: boolean;
    /** État par ami — l'écran ne prétend jamais qu'une invitation est partie avant confirmation. */
    inviteStates: Record<string, InviteState>;
    inviteErrors: Record<string, string>;
    onInviteFriend: (friendId: string) => void;
    /** Agents disponibles, déjà filtrés de ceux qui sont sur scène. */
    agents: Agent[];
    onInviteAgent: (agent: Agent) => void;
    /** Lien réel du direct (déjà construit par l'appelant). */
    shareUrl: string;
    onCopyShareUrl: () => void;
    shareCopied: boolean;
    /** Seul l'animateur peut inviter un ami (règle appliquée EN BASE, rappelée ici). */
    canInviteFriends: boolean;
}

export const LiveInviteModal: React.FC<LiveInviteModalProps> = ({
    isOpen, onClose, friends, friendsLoading, inviteStates, inviteErrors,
    onInviteFriend, agents, onInviteAgent, shareUrl, onCopyShareUrl, shareCopied,
    canInviteFriends,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[320] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: 'rgba(2, 12, 18, 0.72)' }}
            data-testid="live-invite-modal"
        >
            <div className="live-pane w-full sm:max-w-lg max-h-[88vh] flex flex-col !rounded-t-3xl sm:!rounded-3xl">
                <header className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--live-line)' }}>
                    <h2 className="live-title text-[13px]">Inviter dans le direct</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        data-testid="live-invite-close"
                        className="live-orb w-9 h-9"
                    >
                        <X size={16} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* 1. LE LIEN — toujours disponible, même sans amis. */}
                    <section>
                        <h3 className="live-title text-[10px] mb-2">Le lien du direct</h3>
                        <div className="flex items-center gap-2">
                            <code
                                className="flex-1 min-w-0 truncate text-[11px] px-3 py-2 rounded-xl"
                                style={{ background: 'rgba(255,255,255,.05)', color: 'var(--live-ink-soft)', border: '1px solid var(--live-line)' }}
                                data-testid="live-invite-url"
                            >
                                {shareUrl}
                            </code>
                            <button
                                type="button"
                                onClick={onCopyShareUrl}
                                data-testid="live-invite-copy"
                                className={`live-orb ${shareCopied ? 'live-orb--active' : ''} !rounded-xl px-3 py-2 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap`}
                            >
                                {shareCopied ? <><Check size={13} /> Copié</> : <><Link2 size={13} /> Copier</>}
                            </button>
                        </div>
                    </section>

                    {/* 2. MES AMIS — le chemin qui manquait entièrement. */}
                    <section>
                        <h3 className="live-title text-[10px] mb-2">Mes amis</h3>
                        {!canInviteFriends ? (
                            <p className="text-[11px]" style={{ color: 'var(--live-ink-soft)' }} data-testid="live-invite-not-host">
                                Seul l’animateur peut envoyer une invitation. Partagez le lien ci-dessus.
                            </p>
                        ) : friendsLoading ? (
                            <p className="text-[11px] flex items-center gap-2" style={{ color: 'var(--live-ink-soft)' }}>
                                <Loader2 size={12} className="animate-spin" /> Chargement de vos amis…
                            </p>
                        ) : friends.length === 0 ? (
                            <p className="text-[11px]" style={{ color: 'var(--live-ink-soft)' }} data-testid="live-invite-no-friends">
                                Vous n’avez pas encore d’ami sur MokNet. Le lien ci-dessus fonctionne pour tout le monde.
                            </p>
                        ) : (
                            <ul className="space-y-1.5">
                                {friends.map(f => {
                                    const etat = inviteStates[f.id] || 'idle';
                                    return (
                                        <li key={f.id} className="flex items-center gap-2.5" data-testid={`live-invite-friend-${f.id}`}>
                                            {f.avatar
                                                ? <img src={f.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                                                : (
                                                    <span
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-light shrink-0 border"
                                                        style={{ borderColor: 'var(--live-line)', color: 'var(--live-ink)', background: 'rgba(255,255,255,.06)' }}
                                                    >
                                                        {f.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[12px] font-semibold truncate" style={{ color: 'var(--live-ink)' }}>{f.name}</span>
                                                {(f.title || etat === 'error') && (
                                                    <span className="block text-[10px] truncate" style={{ color: etat === 'error' ? '#fca5a5' : 'var(--live-ink-soft)' }}>
                                                        {etat === 'error' ? (inviteErrors[f.id] || 'Invitation impossible') : f.title}
                                                    </span>
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onInviteFriend(f.id)}
                                                disabled={etat === 'sending' || etat === 'sent'}
                                                data-testid={`live-invite-send-${f.id}`}
                                                className={`live-orb ${etat === 'sent' ? 'live-orb--active' : ''} !rounded-xl px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap disabled:opacity-70`}
                                            >
                                                {etat === 'sending' && <><Loader2 size={12} className="animate-spin" /> Envoi…</>}
                                                {etat === 'sent' && <><Check size={12} /> Invité</>}
                                                {(etat === 'idle' || etat === 'error') && <><UserPlus size={12} /> Inviter</>}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* 3. LES AGENTS IA — ils montent tout de suite, sans notification. */}
                    <section>
                        <h3 className="live-title text-[10px] mb-2">Agents IA</h3>
                        {agents.length === 0 ? (
                            <p className="text-[11px]" style={{ color: 'var(--live-ink-soft)' }} data-testid="live-invite-no-agent">
                                Tous les agents disponibles sont déjà sur la scène.
                            </p>
                        ) : (
                            <ul className="grid grid-cols-2 gap-1.5">
                                {agents.map(a => (
                                    <li key={a.id}>
                                        <button
                                            type="button"
                                            onClick={() => onInviteAgent(a)}
                                            data-testid={`live-invite-agent-${a.id}`}
                                            className="live-pane w-full flex items-center gap-2 px-2.5 py-2 !rounded-2xl text-left"
                                        >
                                            <Bot size={14} style={{ color: 'var(--live-accent)' }} className="shrink-0" />
                                            <span className="min-w-0">
                                                <span className="block text-[11px] font-semibold truncate" style={{ color: 'var(--live-ink)' }}>{a.name}</span>
                                                <span className="block text-[9px] truncate" style={{ color: 'var(--live-ink-soft)' }}>{a.specialty}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LiveInviteModal;
