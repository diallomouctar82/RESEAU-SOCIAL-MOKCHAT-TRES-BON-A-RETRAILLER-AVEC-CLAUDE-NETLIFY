import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiveInviteModal, LiveInviteFriend, InviteState } from '../components/live/LiveInviteModal';
import { Agent } from '../types';

/**
 * LV-2 (assainissement) L3 — « Inviter dans le direct », sur le VRAI composant.
 *
 * Ce que ces cas figent côté écran, exigence par exigence de la Direction :
 *   • le lien du direct est TOUJOURS proposé, même sans amis ;
 *   • seul l'animateur peut envoyer une invitation (règle appliquée en base,
 *     rappelée ici) — un spectateur ne voit que le lien ;
 *   • une recherche simple ouvre l'invitation AU-DELÀ des amis : champ vide →
 *     mes amis ; champ rempli → résultats ; mêmes lignes, même bouton ;
 *   • la machine d'état d'invitation ne prétend JAMAIS qu'une invitation est
 *     partie avant confirmation (idle → sending → sent), et un échec réel
 *     reste affiché tel quel, ré-essayable ;
 *   • un agent IA monte tout de suite (pas de notification, pas de compte).
 */

const AMI: LiveInviteFriend = { id: 'ami-1', name: 'Fatou Diop', title: 'Ingénieure' };
const AMI_2: LiveInviteFriend = { id: 'ami-2', name: 'Awa Ndiaye' };
const MEMBRE: LiveInviteFriend = { id: 'mem-9', name: 'Moussa (membre)', title: 'Nouveau' };

const AGENT = { id: 'agent-sante', name: 'Conseiller Santé', specialty: 'Santé' } as unknown as Agent;

function baseProps(over: Partial<React.ComponentProps<typeof LiveInviteModal>> = {}) {
    return {
        isOpen: true,
        onClose: vi.fn(),
        friends: [] as LiveInviteFriend[],
        friendsLoading: false,
        inviteStates: {} as Record<string, InviteState>,
        inviteErrors: {} as Record<string, string>,
        onInviteFriend: vi.fn(),
        agents: [] as Agent[],
        onInviteAgent: vi.fn(),
        shareUrl: 'https://moknet.net/?live=abc',
        onCopyShareUrl: vi.fn(),
        shareCopied: false,
        canInviteFriends: true,
        searchQuery: '',
        onSearchQueryChange: vi.fn(),
        searchResults: [] as LiveInviteFriend[],
        searchLoading: false,
        ...over,
    };
}

afterEach(() => cleanup());

describe('LV-2 L3 — LiveInviteModal', () => {
    it('fermé : ne rend rien du tout', () => {
        const { container } = render(<LiveInviteModal {...baseProps({ isOpen: false })} />);
        expect(container.querySelector('[data-testid="live-invite-modal"]')).toBeNull();
    });

    it('le lien du direct est toujours proposé, et « Copier » remonte l\'action', () => {
        const onCopyShareUrl = vi.fn();
        render(<LiveInviteModal {...baseProps({ onCopyShareUrl })} />);
        expect(screen.getByTestId('live-invite-url').textContent).toContain('moknet.net/?live=abc');
        fireEvent.click(screen.getByTestId('live-invite-copy'));
        expect(onCopyShareUrl).toHaveBeenCalledTimes(1);
    });

    it('« Copié » s\'affiche quand shareCopied est vrai', () => {
        render(<LiveInviteModal {...baseProps({ shareCopied: true })} />);
        expect(screen.getByTestId('live-invite-copy').textContent).toMatch(/Copié/);
    });

    it('un non-animateur ne peut pas inviter : message clair, aucun champ de recherche', () => {
        render(<LiveInviteModal {...baseProps({ canInviteFriends: false, friends: [AMI] })} />);
        expect(screen.getByTestId('live-invite-not-host')).toBeTruthy();
        expect(screen.queryByTestId('live-invite-search')).toBeNull();
        expect(screen.queryByTestId(`live-invite-friend-${AMI.id}`)).toBeNull();
    });

    it('champ vide + amis : sous-titre « Mes amis » et une ligne par ami', () => {
        render(<LiveInviteModal {...baseProps({ friends: [AMI, AMI_2] })} />);
        expect(screen.getByText('Mes amis')).toBeTruthy();
        expect(screen.getByTestId(`live-invite-friend-${AMI.id}`)).toBeTruthy();
        expect(screen.getByTestId(`live-invite-friend-${AMI_2.id}`)).toBeTruthy();
        expect(screen.getByTestId('live-invite-search')).toBeTruthy();
    });

    it('champ vide + aucun ami : message qui invite à chercher un membre', () => {
        render(<LiveInviteModal {...baseProps({ friends: [] })} />);
        expect(screen.getByTestId('live-invite-no-friends')).toBeTruthy();
    });

    it('champ vide + chargement des amis : état de chargement honnête', () => {
        render(<LiveInviteModal {...baseProps({ friends: [], friendsLoading: true })} />);
        expect(screen.getByText(/Chargement de vos amis/)).toBeTruthy();
    });

    it('taper dans le champ remonte la saisie à l\'appelant', () => {
        const onSearchQueryChange = vi.fn();
        render(<LiveInviteModal {...baseProps({ onSearchQueryChange })} />);
        fireEvent.change(screen.getByTestId('live-invite-search'), { target: { value: 'mou' } });
        expect(onSearchQueryChange).toHaveBeenCalledWith('mou');
    });

    it('recherche en cours : « Recherche… », jamais un faux « aucun résultat »', () => {
        render(<LiveInviteModal {...baseProps({ searchQuery: 'mou', searchLoading: true, searchResults: [] })} />);
        expect(screen.getByText(/Recherche…/)).toBeTruthy();
        expect(screen.queryByTestId('live-invite-search-empty')).toBeNull();
    });

    it('recherche terminée sans résultat : message qui renvoie vers le lien', () => {
        render(<LiveInviteModal {...baseProps({ searchQuery: 'zzz', searchLoading: false, searchResults: [] })} />);
        const vide = screen.getByTestId('live-invite-search-empty');
        expect(vide.textContent).toContain('zzz');
    });

    it('résultats de recherche : mêmes lignes/mêmes boutons que les amis (au-delà des amis)', () => {
        render(<LiveInviteModal {...baseProps({ searchQuery: 'mou', searchResults: [MEMBRE] })} />);
        expect(screen.getByTestId(`live-invite-friend-${MEMBRE.id}`)).toBeTruthy();
        expect(screen.getByTestId(`live-invite-send-${MEMBRE.id}`)).toBeTruthy();
    });

    it('inviter (idle) : bouton « Inviter », le clic déclenche l\'invitation réelle', () => {
        const onInviteFriend = vi.fn();
        render(<LiveInviteModal {...baseProps({ friends: [AMI], onInviteFriend })} />);
        const bouton = screen.getByTestId(`live-invite-send-${AMI.id}`);
        expect(bouton.textContent).toMatch(/Inviter/);
        expect((bouton as HTMLButtonElement).disabled).toBe(false);
        fireEvent.click(bouton);
        expect(onInviteFriend).toHaveBeenCalledWith(AMI.id);
    });

    it('invitation en cours : bouton désactivé, « Envoi… » — rien n\'est prétendu parti', () => {
        render(<LiveInviteModal {...baseProps({ friends: [AMI], inviteStates: { [AMI.id]: 'sending' } })} />);
        const bouton = screen.getByTestId(`live-invite-send-${AMI.id}`) as HTMLButtonElement;
        expect(bouton.disabled).toBe(true);
        expect(bouton.textContent).toMatch(/Envoi/);
    });

    it('invitation envoyée : « Invité », désactivé, état actif — confirmation seulement après coup', () => {
        render(<LiveInviteModal {...baseProps({ friends: [AMI], inviteStates: { [AMI.id]: 'sent' } })} />);
        const bouton = screen.getByTestId(`live-invite-send-${AMI.id}`) as HTMLButtonElement;
        expect(bouton.disabled).toBe(true);
        expect(bouton.textContent).toMatch(/Invité/);
        expect(bouton.className).toContain('live-orb--active');
    });

    it('échec réel : le message d\'erreur s\'affiche, l\'invitation reste ré-essayable', () => {
        render(<LiveInviteModal {...baseProps({
            friends: [AMI],
            inviteStates: { [AMI.id]: 'error' },
            inviteErrors: { [AMI.id]: 'Invitation impossible' },
        })} />);
        expect(screen.getByText('Invitation impossible')).toBeTruthy();
        const bouton = screen.getByTestId(`live-invite-send-${AMI.id}`) as HTMLButtonElement;
        expect(bouton.disabled).toBe(false);
        expect(bouton.textContent).toMatch(/Inviter/);
    });

    it('aucun agent disponible : message honnête, pas de fausse liste', () => {
        render(<LiveInviteModal {...baseProps({ agents: [] })} />);
        expect(screen.getByTestId('live-invite-no-agent')).toBeTruthy();
    });

    it('un agent IA monte tout de suite : le clic remonte l\'agent choisi', () => {
        const onInviteAgent = vi.fn();
        render(<LiveInviteModal {...baseProps({ agents: [AGENT], onInviteAgent })} />);
        fireEvent.click(screen.getByTestId(`live-invite-agent-${AGENT.id}`));
        expect(onInviteAgent).toHaveBeenCalledWith(AGENT);
    });

    it('fermer : le bouton croix remonte onClose', () => {
        const onClose = vi.fn();
        render(<LiveInviteModal {...baseProps({ onClose })} />);
        fireEvent.click(screen.getByTestId('live-invite-close'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
