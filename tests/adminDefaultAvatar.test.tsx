import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminDefaultAvatarCard } from '../components/admin/AdminDefaultAvatarCard';
import { mergeDetailedSettings } from '../services/adminConfigService';
import type { DefaultAvatarPolicy } from '../services/studio/avatarStudio';

/**
 * AVATAR PAR DÉFAUT — console de l'Admin-Général.
 *
 * Deux choses à prouver ici :
 *  1. la carte refuse ce que le service refuse (elle ne peut pas contourner
 *     les garde-fous en n'appelant pas le contrôle) ;
 *  2. un `localStorage` enregistré AVANT l'existence de ce réglage ne casse
 *     pas la console — c'est la panne classique quand une section de
 *     paramètres gagne une clé.
 */

const EMPTY: DefaultAvatarPolicy = { photoUrl: '', label: '', updatedAt: '', updatedBy: '' };
const STOCK = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120';

const renderCard = (value: DefaultAvatarPolicy = EMPTY) => {
    const onChange = vi.fn();
    render(<AdminDefaultAvatarCard value={value} adminName="Admin-Général" onChange={onChange} />);
    return onChange;
};

const setUrl = (url: string) =>
    fireEvent.change(screen.getByLabelText('Adresse de la photo'), { target: { value: url } });

const submit = () => fireEvent.click(screen.getByRole('button', { name: /Définir l’avatar par défaut/ }));

describe('Définition de l’avatar par défaut', () => {
    it('enregistre une adresse valide, horodatée et attribuée', () => {
        const onChange = renderCard();
        setUrl('https://cdn.moknet.app/avatar-plateforme.png');
        fireEvent.change(screen.getByLabelText('Libellé interne'), {
            target: { value: 'Avatar institutionnel 2026' },
        });
        submit();

        expect(onChange).toHaveBeenCalledTimes(1);
        const next = onChange.mock.calls[0][0] as DefaultAvatarPolicy;
        expect(next.photoUrl).toBe('https://cdn.moknet.app/avatar-plateforme.png');
        expect(next.label).toBe('Avatar institutionnel 2026');
        expect(next.updatedBy).toBe('Admin-Général');
        expect(Number.isNaN(Date.parse(next.updatedAt))).toBe(false);
        expect(screen.getByText('Avatar par défaut mis à jour')).toBeInTheDocument();
    });

    it('accepte un chemin interne servi par l’application', () => {
        const onChange = renderCard();
        setUrl('/icons/icon-192.png');
        submit();
        expect((onChange.mock.calls[0][0] as DefaultAvatarPolicy).photoUrl).toBe('/icons/icon-192.png');
    });

    it('refuse le cliché de banque d’images, et n’enregistre rien', () => {
        const onChange = renderCard();
        setUrl(STOCK);
        submit();

        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent(/banque d’images/);
    });

    it('refuse http:// — et le dit', () => {
        const onChange = renderCard();
        setUrl('http://exemple.com/a.png');
        submit();
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent(/https/);
    });

    it('un champ vide est un choix assumé : aucun avatar imposé', () => {
        const onChange = renderCard({ ...EMPTY, photoUrl: 'https://cdn.moknet.app/ancien.png' });
        setUrl('');
        submit();

        const next = onChange.mock.calls[0][0] as DefaultAvatarPolicy;
        expect(next.photoUrl).toBe('');
        expect(next.label).toMatch(/nitiales/);
    });

    it('l’aperçu montre les initiales tant qu’aucun avatar n’est imposé', () => {
        renderCard();
        expect(screen.getByText('Initiales')).toBeInTheDocument();
        // Le repli est bien un vrai repli d'initiales, pas une image cassée.
        expect(screen.getByRole('img', { name: 'Nouveau Membre' })).toHaveTextContent('NM');
    });

    it('l’aperçu montre la photo dès qu’une adresse valide est saisie', () => {
        renderCard();
        setUrl('https://cdn.moknet.app/avatar-plateforme.png');
        expect(screen.getByAltText('Nouveau Membre')).toHaveAttribute(
            'src',
            'https://cdn.moknet.app/avatar-plateforme.png',
        );
    });
});

describe('Réglages enregistrés avant l’existence du réglage', () => {
    it('complète les clés absentes au lieu de laisser la console lire `undefined`', () => {
        // Exactement la forme d'un `localStorage` d'administrateur d'hier :
        // la section `studio` existe, sans `defaultAvatar`.
        const legacy = {
            studio: {
                maxDailyGenerationsPerUser: 42,
                defaultVisionModel: 'gemini-2.5-flash',
                defaultImageSize: '1024x1024',
                watermarkEnabled: false,
                allowVeoVideoGeneration: false,
            },
        };

        const merged = mergeDetailedSettings(legacy);

        expect(merged.studio.defaultAvatar).toBeDefined();
        expect(merged.studio.defaultAvatar.photoUrl).toBe('');
        // Les réglages réellement enregistrés par l'administrateur gagnent.
        expect(merged.studio.maxDailyGenerationsPerUser).toBe(42);
        expect(merged.studio.watermarkEnabled).toBe(false);
        // Les autres sections restent complètes.
        expect(merged.live).toBeDefined();
        expect(merged.aiCore).toBeDefined();
    });

    it('résiste à un contenu illisible sans faire tomber la console', () => {
        expect(mergeDetailedSettings(null).studio.defaultAvatar.photoUrl).toBe('');
        expect(mergeDetailedSettings('cassé').campus).toBeDefined();
    });

    it('conserve un avatar déjà défini', () => {
        const merged = mergeDetailedSettings({
            studio: { defaultAvatar: { photoUrl: '/icons/icon-192.png', label: 'X', updatedAt: 'hier', updatedBy: 'A' } },
        });
        expect(merged.studio.defaultAvatar.photoUrl).toBe('/icons/icon-192.png');
    });
});
