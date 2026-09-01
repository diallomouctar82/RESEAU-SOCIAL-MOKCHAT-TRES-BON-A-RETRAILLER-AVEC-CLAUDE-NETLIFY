import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
    AVATAR_PALETTE,
    InitialsAvatar,
    avatarColorFor,
    getInitials,
    isStockPlaceholderAvatar,
    realAvatarUrl,
} from '../components/ui/InitialsAvatar';

const STOCK_PLACEHOLDER = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop';

/** jsdom sérialise une couleur hexadécimale en `rgb(r, g, b)`. */
const hexToRgb = (hex: string): string => {
    const value = parseInt(hex.slice(1), 16);
    return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};

describe('InitialsAvatar — initiales et couleur stables', () => {
    it('extrait les initiales des deux premiers mots du nom', () => {
        expect(getInitials('Yaya Diallo')).toBe('YD');
        expect(getInitials('  aïcha   bah  ')).toBe('AB');
        expect(getInitials('Mamadou Saliou Diallo')).toBe('MS');
        expect(getInitials('Aïcha')).toBe('A');
        expect(getInitials('')).toBe('?');
        expect(getInitials(undefined)).toBe('?');
    });

    it('dérive une couleur déterministe du nom, toujours prise dans la palette', () => {
        const color = avatarColorFor('Yaya Diallo');
        expect(avatarColorFor('Yaya Diallo')).toBe(color);
        expect(avatarColorFor('  yaya diallo ')).toBe(color);
        expect(AVATAR_PALETTE).toContain(color);
        expect(AVATAR_PALETTE).toContain(avatarColorFor(''));
        // Deux membres différents ne partagent pas systématiquement la même teinte.
        const distinct = new Set(['Yaya Diallo', 'Amadou Diallo', 'Fatoumata Camara', 'Ibrahima Sow'].map(avatarColorFor));
        expect(distinct.size).toBeGreaterThan(1);
    });

    it('ne considère jamais le cliché de banque d’images comme la photo d’un membre', () => {
        expect(isStockPlaceholderAvatar(STOCK_PLACEHOLDER)).toBe(true);
        expect(realAvatarUrl(STOCK_PLACEHOLDER)).toBeUndefined();
        expect(realAvatarUrl('')).toBeUndefined();
        expect(realAvatarUrl('   ')).toBeUndefined();
        expect(realAvatarUrl(null)).toBeUndefined();
        expect(realAvatarUrl(undefined)).toBeUndefined();
        expect(realAvatarUrl(' /avatars/yaya.png ')).toBe('/avatars/yaya.png');
    });

    it('rend la photo réelle avec alt et title = nom, à la taille demandée', () => {
        render(<InitialsAvatar name="Yaya Diallo" avatarUrl="/avatars/yaya.png" size={40} />);
        const image = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(image.tagName).toBe('IMG');
        expect(image).toHaveAttribute('src', '/avatars/yaya.png');
        expect(image).toHaveAttribute('title', 'Yaya Diallo');
        expect(image).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('rend des initiales accessibles (nom complet annoncé) quand la photo est absente', () => {
        render(<InitialsAvatar name="Yaya Diallo" size={28} />);
        const avatar = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(avatar.tagName).toBe('SPAN');
        expect(avatar).toHaveTextContent('YD');
        expect(avatar).toHaveAttribute('title', 'Yaya Diallo');
        expect(avatar).toHaveStyle({ width: '28px', height: '28px' });
        expect(avatar.style.backgroundColor).toBe(hexToRgb(avatarColorFor('Yaya Diallo')));
    });

    it('retombe sur les initiales si l’image ne se charge pas', () => {
        render(<InitialsAvatar name="Yaya Diallo" avatarUrl="/avatars/cassee.png" />);
        fireEvent.error(screen.getByRole('img', { name: 'Yaya Diallo' }));
        const avatar = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(avatar.tagName).toBe('SPAN');
        expect(avatar).toHaveTextContent('YD');
    });

    it('remplace le cliché Unsplash de repli par les initiales', () => {
        const { container } = render(<InitialsAvatar name="Membre Inconnu" avatarUrl={STOCK_PLACEHOLDER} />);
        expect(container.querySelector('img')).toBeNull();
        expect(container.innerHTML).not.toContain('unsplash');
        expect(screen.getByRole('img', { name: 'Membre Inconnu' })).toHaveTextContent('MI');
    });
});
