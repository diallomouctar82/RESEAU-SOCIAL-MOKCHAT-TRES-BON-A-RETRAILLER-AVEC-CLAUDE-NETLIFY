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
        expect(avatar).toHaveStyle({ width: '400px', height: '400px' });
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

    it('sans voix intégrée, retombe sur la démonstration muette et le DIT plutôt que de parler bouche close', () => {
        // jsdom n'a pas de `speechSynthesis` : c'est exactement le cas d'un
        // navigateur sans voix.
        render(<ArchitecteDemoPage />);
        fireEvent.click(screen.getByRole('button', { name: /Le faire parler/ }));
        expect(screen.getByTestId('demo-voix')).toHaveTextContent(/indisponible/);
    });

    it('avec la voix intégrée, annonce honnêtement une synchro AU RYTHME DES MOTS, pas à l’amplitude', () => {
        const lectures: any[] = [];
        class FausseLecture { text: string; lang = ''; rate = 1; voice: any = null; onstart: any; onboundary: any; onend: any; onerror: any; constructor(t: string) { this.text = t; lectures.push(this); } }
        (window as any).SpeechSynthesisUtterance = FausseLecture;
        (window as any).speechSynthesis = { cancel: vi.fn(), getVoices: () => [{ lang: 'fr-FR' }], speak: (l: any) => l.onstart && l.onstart() };
        try {
            render(<ArchitecteDemoPage />);
            fireEvent.click(screen.getByRole('button', { name: /Le faire parler/ }));
            expect(lectures[0].lang).toBe('fr-FR');
            expect(screen.getByTestId('architecte-avatar')).toHaveAttribute('data-lipsync', 'rythme_des_mots');
            expect(screen.getByTestId('demo-voix')).toHaveTextContent(/rythme des mots/);
            expect(screen.getByRole('status')).toHaveTextContent(/parle/);
        } finally {
            delete (window as any).SpeechSynthesisUtterance;
            delete (window as any).speechSynthesis;
        }
    });

    it('dit ce qu’elle est : une page de preuve, sans donnée de compte', () => {
        render(<ArchitecteDemoPage />);
        expect(screen.getByText(/aucune donnée de compte n’est lue ni écrite/i)).toBeInTheDocument();
    });
});
