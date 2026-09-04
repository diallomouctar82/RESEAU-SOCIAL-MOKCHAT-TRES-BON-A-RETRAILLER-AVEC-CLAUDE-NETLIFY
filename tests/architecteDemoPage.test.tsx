import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchitecteDemoPage } from '../components/architecte/ArchitecteDemoPage';

/**
 * PAGE PUBLIQUE DE DÉMONSTRATION — `/architecte`.
 *
 * Elle existe parce que la Direction ne pouvait pas constater l'avatar par
 * elle-même : toute l'application est derrière l'écran de connexion. Ce
 * test prouve qu'elle rend bien le composant réel, avec le portrait, et que
 * la commande « Le faire parler » est réelle.
 */

beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    });
});

describe('Page publique de démonstration de l’avatar', () => {
    it('rend l’avatar RÉEL, en grand, avec le portrait livré', () => {
        const { container } = render(<ArchitecteDemoPage />);
        const avatar = screen.getByTestId('architecte-avatar');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveStyle({ width: '340px', height: '340px' });
        expect(container.querySelector('svg image')).toHaveAttribute('href', '/architecte/architecte.webp');
    });

    it('annonce l’identité officielle et l’état en clair', () => {
        render(<ArchitecteDemoPage />);
        expect(screen.getByText('Présence officielle MokNet')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent(/L’Architecte/);
    });

    it('offre une commande réelle pour le faire parler', () => {
        render(<ArchitecteDemoPage />);
        const bouton = screen.getByRole('button', { name: /Le faire parler/ });
        expect(bouton).toBeInTheDocument();
        fireEvent.click(bouton);
        // La boucle automatique se coupe au profit de la lecture déclenchée.
        expect(screen.getByRole('button', { name: /Répéter en boucle/ })).toBeInTheDocument();
    });

    it('dit ce qu’elle est : une page de preuve, sans donnée de compte', () => {
        render(<ArchitecteDemoPage />);
        expect(screen.getByText(/aucune donnée de compte n’est lue ni écrite/i)).toBeInTheDocument();
    });
});
