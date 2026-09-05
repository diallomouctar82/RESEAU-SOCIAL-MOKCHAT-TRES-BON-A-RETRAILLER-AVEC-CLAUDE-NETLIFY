import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiveParticipantsPanel } from '../components/live/LiveParticipantsPanel';
import { LiveStageParticipant } from '../types';

/**
 * LV-2 (assainissement) L4 — le Studio clair : « qui est là / qui regarde /
 * QUI EST INVITÉ / inviter / faire monter / fermer », sur le VRAI composant.
 *
 * Ce que ces cas figent :
 *   • « Qui est invité » est une SECTION distincte du public (une personne
 *     invitée n'est pas encore entrée) — et réservée à l'hôte, seul à
 *     connaître honnêtement la liste (les notifications d'autrui ne sont pas
 *     lisibles) ; un spectateur ne la voit jamais ;
 *   • liste vide → une information honnête, pas un « on ne sait pas » ;
 *   • liste peuplée → une ligne par invité, « en attente d'entrée » ;
 *   • le bouton « Inviter quelqu'un » ouvre bien la fenêtre d'invitation.
 */

const INVITE_A = { id: 'inv-a', name: 'Fatou Diop' };
const INVITE_B = { id: 'inv-b', name: 'Awa Ndiaye', avatar: 'https://img/awa.png' };

function baseProps(over: Partial<React.ComponentProps<typeof LiveParticipantsPanel>> = {}) {
    return {
        participants: [] as LiveStageParticipant[],
        currentUserId: 'me',
        isHost: true,
        onPromote: vi.fn(),
        onDemote: vi.fn(),
        onToggleMute: vi.fn(),
        onRemove: vi.fn(),
        onInvite: vi.fn(),
        onRemoveAgent: vi.fn(),
        invited: [] as { id: string; name: string; avatar?: string }[],
        ...over,
    };
}

afterEach(() => cleanup());

describe('LV-2 L4 — LiveParticipantsPanel : qui est invité', () => {
    it('un spectateur ne voit JAMAIS la section « Invité·e·s » (la liste est propre à l\'hôte)', () => {
        render(<LiveParticipantsPanel {...baseProps({ isHost: false, invited: [INVITE_A] })} />);
        expect(screen.queryByTestId('live-invited-section')).toBeNull();
        expect(screen.queryByTestId(`live-invited-${INVITE_A.id}`)).toBeNull();
    });

    it('hôte, aucun invité : section présente, compte 0, message honnête (pas « on ne sait pas »)', () => {
        render(<LiveParticipantsPanel {...baseProps({ invited: [] })} />);
        expect(screen.getByTestId('live-invited-section')).toBeTruthy();
        expect(screen.getByTestId('live-invited-heading').textContent).toMatch(/Invité·e·s · 0/);
        expect(screen.getByTestId('live-invited-empty')).toBeTruthy();
    });

    it('hôte avec invités : une ligne par personne, nom lisible, « en attente d\'entrée »', () => {
        render(<LiveParticipantsPanel {...baseProps({ invited: [INVITE_A, INVITE_B] })} />);
        expect(screen.getByTestId('live-invited-heading').textContent).toMatch(/Invité·e·s · 2/);
        expect(screen.getByTestId(`live-invited-${INVITE_A.id}`).textContent).toContain('Fatou Diop');
        expect(screen.getByTestId(`live-invited-${INVITE_B.id}`).textContent).toContain('Awa Ndiaye');
        expect(screen.getAllByText(/en attente d’entrée/).length).toBe(2);
        expect(screen.queryByTestId('live-invited-empty')).toBeNull();
    });

    it('« Inviter quelqu\'un » ouvre la fenêtre d\'invitation', () => {
        const onInvite = vi.fn();
        render(<LiveParticipantsPanel {...baseProps({ onInvite })} />);
        fireEvent.click(screen.getByTestId('live-invite-open'));
        expect(onInvite).toHaveBeenCalledTimes(1);
    });

    it('les sections « Sur scène » et « Dans le public » restent présentes (non-régression LV-1/LV-3)', () => {
        render(<LiveParticipantsPanel {...baseProps({})} />);
        expect(screen.getByTestId('live-onstage-heading')).toBeTruthy();
        expect(screen.getByTestId('live-audience-heading')).toBeTruthy();
    });
});
