import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    INSTALL_LABEL_LINGER_MS,
    LONG_PRESS_MS,
    MessagingDropButton,
    formatUnreadBadge,
    messagingDropButtonLabel,
    waterLevelForUnread,
} from '../components/chat/MessagingDropButton';

/**
 * ÉQUIPE B (mission VF-10) — bouton de messagerie « Goutte ».
 *
 * Ce qui est testé ici, c'est le CONTRAT du composant tel que le
 * coordinateur le montera à la place de l'ancien `#mooc-chat-toggle-btn` :
 * l'id, le libellé accessible qui change avec l'état, le niveau d'eau qui
 * découle du VRAI nombre de non-lus (jamais d'état simulé), l'appel entrant
 * qui n'existe que si la prop le dit, la bascule au clic et au clavier, et le
 * maintien long qui invite à installer SANS ouvrir la messagerie. Le rendu
 * (gradients, vagues) vit dans le CSS d'index.html, hors de portée de jsdom :
 * on vérifie donc les attributs et le style inline qui le pilotent.
 */

const button = () => screen.getByRole('button', { name: /messagerie|appel/i });

describe('rendu par défaut (repos)', () => {
    it('porte l’id attendu, le libellé « Ouvrir la messagerie » et le niveau bas', () => {
        render(<MessagingDropButton isOpen={false} unreadCount={0} onToggle={() => {}} />);

        const btn = button();
        expect(btn).toHaveAttribute('id', 'mooc-chat-toggle-btn');
        expect(btn).toHaveAttribute('type', 'button');
        expect(btn).toHaveAttribute('aria-label', 'Ouvrir la messagerie');
        expect(btn).toHaveAttribute('aria-expanded', 'false');
        expect(btn).toHaveAttribute('aria-pressed', 'false');
        expect(btn).toHaveAttribute('data-state', 'rest');
        expect(btn).toHaveAttribute('data-level', '30');
        expect(btn.style.getPropertyValue('--mdb-lvl')).toBe('30%');
        expect(btn.querySelector('.mdb-ico')).toHaveAttribute('data-icon', 'bubble');
        expect(btn.querySelector('.mdb-badge')).toBeNull();
    });

    it('accepte un id personnalisé et la classe de positionnement du parent', () => {
        const { container } = render(
            <MessagingDropButton
                id="goutte-test"
                className="fixed bottom-6 right-6 z-40"
                isOpen={false}
                unreadCount={0}
                onToggle={() => {}}
            />,
        );
        expect(screen.getByRole('button')).toHaveAttribute('id', 'goutte-test');
        expect(container.firstElementChild).toHaveClass('mdb-host', 'fixed', 'bottom-6', 'right-6', 'z-40');
    });
});

describe('niveau d’eau et compteur = vrais non-lus', () => {
    it('3 non-lus : compteur « 3 » visible, libellé complet, niveau plus haut que 0', () => {
        render(<MessagingDropButton isOpen={false} unreadCount={3} onToggle={() => {}} />);

        const btn = button();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(btn).toHaveAttribute('aria-label', 'Ouvrir la messagerie, 3 messages non lus');
        expect(btn).toHaveAttribute('data-state', 'unread');
        expect(btn).toHaveAttribute('data-unread', '3');
        expect(btn).toHaveAttribute('data-level', '64');
        expect(btn.style.getPropertyValue('--mdb-lvl')).toBe('64%');
        expect(Number(btn.getAttribute('data-level'))).toBeGreaterThan(waterLevelForUnread(0));
    });

    it('1 non-lu : accord au singulier dans le libellé', () => {
        render(<MessagingDropButton isOpen={false} unreadCount={1} onToggle={() => {}} />);
        expect(button()).toHaveAttribute('aria-label', 'Ouvrir la messagerie, 1 message non lu');
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('12 non-lus : compteur « 9+ », le libellé garde le vrai nombre, niveau plafonné', () => {
        render(<MessagingDropButton isOpen={false} unreadCount={12} onToggle={() => {}} />);

        const btn = button();
        expect(screen.getByText('9+')).toBeInTheDocument();
        expect(btn).toHaveAttribute('aria-label', 'Ouvrir la messagerie, 12 messages non lus');
        expect(btn).toHaveAttribute('data-level', String(waterLevelForUnread(9)));
    });

    it('le niveau monte strictement de 0 à 9 puis plafonne', () => {
        for (let n = 1; n <= 9; n += 1) {
            expect(waterLevelForUnread(n)).toBeGreaterThan(waterLevelForUnread(n - 1));
        }
        expect(waterLevelForUnread(9)).toBe(waterLevelForUnread(50));
        expect(waterLevelForUnread(-4)).toBe(waterLevelForUnread(0));
        expect(waterLevelForUnread(Number.NaN)).toBe(waterLevelForUnread(0));
    });

    it('formatUnreadBadge : vide à 0, nombre exact jusqu’à 9, « 9+ » au-delà', () => {
        expect(formatUnreadBadge(0)).toBe('');
        expect(formatUnreadBadge(7)).toBe('7');
        expect(formatUnreadBadge(9)).toBe('9');
        expect(formatUnreadBadge(10)).toBe('9+');
    });
});

describe('appel entrant (uniquement si la prop le dit)', () => {
    it('affiche l’état d’appel, le nom de l’appelant et l’icône combiné', () => {
        render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                incomingCall={{ callerName: 'Fatou', callType: 'audio' }}
                onToggle={() => {}}
            />,
        );

        const btn = screen.getByRole('button', { name: 'Appel audio entrant de Fatou — ouvrir' });
        expect(btn).toHaveAttribute('data-state', 'call');
        expect(btn.querySelector('.mdb-ico')).toHaveAttribute('data-icon', 'phone');
        expect(btn.querySelector('svg.mdb-i-ph')).toBeInTheDocument();
        // L'eau agitée doit rester visible même sans non-lus.
        expect(Number(btn.getAttribute('data-level'))).toBeGreaterThan(waterLevelForUnread(0));
    });

    it('appel vidéo : le libellé le dit ; appelant vide → « un membre »', () => {
        expect(
            messagingDropButtonLabel({
                isOpen: false,
                unreadCount: 0,
                incomingCall: { callerName: 'Mamadou', callType: 'video' },
            }),
        ).toBe('Appel vidéo entrant de Mamadou — ouvrir');
        expect(
            messagingDropButtonLabel({
                isOpen: false,
                unreadCount: 2,
                incomingCall: { callerName: '  ', callType: 'audio' },
            }),
        ).toBe('Appel audio entrant de un membre — ouvrir');
    });

    it('incomingCall à null : aucun état d’appel, même avec des non-lus', () => {
        render(
            <MessagingDropButton isOpen={false} unreadCount={2} incomingCall={null} onToggle={() => {}} />,
        );
        const btn = button();
        expect(btn).toHaveAttribute('data-state', 'unread');
        expect(btn.querySelector('.mdb-ico')).toHaveAttribute('data-icon', 'bubble');
    });
});

describe('messagerie ouverte', () => {
    it('icône croix, goutte pleine, aria-expanded/aria-pressed à true, libellé « Fermer »', () => {
        render(
            <MessagingDropButton
                isOpen
                unreadCount={5}
                incomingCall={{ callerName: 'Fatou', callType: 'audio' }}
                onToggle={() => {}}
            />,
        );

        const btn = screen.getByRole('button', { name: 'Fermer la messagerie' });
        expect(btn).toHaveAttribute('aria-expanded', 'true');
        expect(btn).toHaveAttribute('aria-pressed', 'true');
        expect(btn).toHaveAttribute('data-state', 'open');
        expect(btn.querySelector('.mdb-ico')).toHaveAttribute('data-icon', 'close');
        expect(Number(btn.getAttribute('data-level'))).toBeGreaterThanOrEqual(100);
        // Ouverte, la messagerie montre déjà les conversations : pas de compteur sur la goutte.
        expect(btn.querySelector('.mdb-badge')).toBeNull();
    });
});

describe('bascule : clic et clavier', () => {
    it('un clic appelle onToggle exactement une fois', () => {
        const onToggle = vi.fn();
        render(<MessagingDropButton isOpen={false} unreadCount={0} onToggle={onToggle} />);

        fireEvent.click(button());
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('Entrée et Espace appellent onToggle (une fois chacun, jamais en répétition de touche)', () => {
        const onToggle = vi.fn();
        render(<MessagingDropButton isOpen={false} unreadCount={0} onToggle={onToggle} />);

        const btn = button();
        fireEvent.keyDown(btn, { key: 'Enter' });
        expect(onToggle).toHaveBeenCalledTimes(1);
        fireEvent.keyDown(btn, { key: ' ' });
        expect(onToggle).toHaveBeenCalledTimes(2);
        fireEvent.keyDown(btn, { key: 'Enter', repeat: true });
        expect(onToggle).toHaveBeenCalledTimes(2);
        fireEvent.keyDown(btn, { key: 'Tab' });
        expect(onToggle).toHaveBeenCalledTimes(2);
    });
});

describe('maintien long → installer la messagerie', () => {
    beforeEach(() => {
        // Seuls les minuteurs du composant sont simulés : on veut compter les
        // siens, pas ceux de l'ordonnanceur de React.
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('après 500 ms : étiquette visible + onInstallRequest appelé, onToggle NON appelé', () => {
        const onToggle = vi.fn();
        const onInstallRequest = vi.fn();
        render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                onToggle={onToggle}
                onInstallRequest={onInstallRequest}
            />,
        );

        const btn = button();
        expect(screen.queryByRole('tooltip')).toBeNull(); // cachée tant qu'on ne maintient pas
        fireEvent.pointerDown(btn, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS - 1);
        });
        expect(onInstallRequest).not.toHaveBeenCalled();
        act(() => {
            vi.advanceTimersByTime(1);
        });

        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('Installer la messagerie sur mon téléphone');
        expect(tooltip).toHaveAttribute('data-visible', 'true');
        expect(btn).toHaveAttribute('aria-describedby', tooltip.id);
        expect(onInstallRequest).toHaveBeenCalledTimes(1);

        // Le relâchement puis le clic que le navigateur émet ne basculent pas la messagerie.
        fireEvent.pointerUp(btn, { button: 0 });
        fireEvent.click(btn);
        expect(onToggle).not.toHaveBeenCalled();

        // L'étiquette reste lisible un instant, puis se ferme d'elle-même.
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        act(() => {
            vi.advanceTimersByTime(INSTALL_LABEL_LINGER_MS);
        });
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(btn).not.toHaveAttribute('aria-describedby');

        // Le tap suivant redevient un clic normal.
        fireEvent.pointerDown(btn, { button: 0 });
        fireEvent.pointerUp(btn, { button: 0 });
        fireEvent.click(btn);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('relâchement avant 500 ms : clic normal, ni étiquette ni onInstallRequest', () => {
        const onToggle = vi.fn();
        const onInstallRequest = vi.fn();
        render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                onToggle={onToggle}
                onInstallRequest={onInstallRequest}
            />,
        );

        const btn = button();
        fireEvent.pointerDown(btn, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(200);
        });
        fireEvent.pointerUp(btn, { button: 0 });
        fireEvent.click(btn);
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS * 2);
        });

        expect(onToggle).toHaveBeenCalledTimes(1);
        expect(onInstallRequest).not.toHaveBeenCalled();
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('le pointeur qui quitte le bouton annule le maintien', () => {
        const onInstallRequest = vi.fn();
        render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                onToggle={() => {}}
                onInstallRequest={onInstallRequest}
            />,
        );

        const btn = button();
        fireEvent.pointerDown(btn, { button: 0 });
        fireEvent.pointerLeave(btn);
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS * 2);
        });
        expect(onInstallRequest).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('Échap ferme l’étiquette ; un appui ailleurs aussi', () => {
        const onInstallRequest = vi.fn();
        render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                onToggle={() => {}}
                onInstallRequest={onInstallRequest}
            />,
        );

        const btn = button();
        fireEvent.pointerDown(btn, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS);
        });
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.keyDown(btn, { key: 'Escape' });
        expect(screen.queryByRole('tooltip')).toBeNull();

        fireEvent.pointerUp(btn, { button: 0 });
        fireEvent.pointerDown(btn, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS);
        });
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole('tooltip')).toBeNull();
        expect(onInstallRequest).toHaveBeenCalledTimes(2);
    });

    it('sans onInstallRequest : aucune étiquette, même après un long maintien', () => {
        const onToggle = vi.fn();
        const { container } = render(
            <MessagingDropButton isOpen={false} unreadCount={0} onToggle={onToggle} />,
        );

        const btn = button();
        expect(container.querySelector('[role="tooltip"]')).toBeNull();
        fireEvent.pointerDown(btn, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS * 3);
        });
        expect(container.querySelector('[role="tooltip"]')).toBeNull();
        expect(vi.getTimerCount()).toBe(0);

        fireEvent.pointerUp(btn, { button: 0 });
        fireEvent.click(btn);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('démontage en plein maintien : aucun minuteur ne survit', () => {
        const onInstallRequest = vi.fn();
        const { unmount } = render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                onToggle={() => {}}
                onInstallRequest={onInstallRequest}
            />,
        );

        fireEvent.pointerDown(button(), { button: 0 });
        expect(vi.getTimerCount()).toBe(1);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS * 2);
        });
        expect(onInstallRequest).not.toHaveBeenCalled();
    });

    it('démontage pendant que l’étiquette s’attarde : aucun minuteur ne survit', () => {
        const { unmount } = render(
            <MessagingDropButton
                isOpen={false}
                unreadCount={0}
                onToggle={() => {}}
                onInstallRequest={() => {}}
            />,
        );

        const btn = button();
        fireEvent.pointerDown(btn, { button: 0 });
        act(() => {
            vi.advanceTimersByTime(LONG_PRESS_MS);
        });
        fireEvent.pointerUp(btn, { button: 0 });
        expect(vi.getTimerCount()).toBe(1); // le minuteur d'attardement
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
