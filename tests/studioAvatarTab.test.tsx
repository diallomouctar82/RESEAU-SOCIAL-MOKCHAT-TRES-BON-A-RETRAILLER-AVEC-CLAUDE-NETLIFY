import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Studio } from '../components/Studio';
import { GlobalProvider } from '../contexts/GlobalContext';
import { adminConfigService } from '../services/adminConfigService';

/**
 * BRANCHEMENT RÉEL — le Studio Avatar dans le Studio.
 *
 * Les composants sont prouvés isolément ailleurs. Ce test prouve le CÂBLAGE :
 * l'onglet existe vraiment dans le Studio, il rend le parcours avec le profil
 * du contexte global, et l'avatar défini par l'Admin-Général traverse bien
 * `adminConfigService` jusqu'à l'écran du membre. C'est précisément ce qu'un
 * test de composant isolé ne peut pas montrer.
 */

const openAvatarTab = () => {
    render(
        <GlobalProvider>
            <Studio />
        </GlobalProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Mon Avatar/ }));
};

describe('Onglet « Mon Avatar » du Studio', () => {
    beforeEach(() => {
        adminConfigService.updateDetailedSettings({
            studio: {
                ...adminConfigService.getDetailedSettings().studio,
                defaultAvatar: {
                    photoUrl: 'https://cdn.moknet.app/avatar-plateforme.png',
                    label: 'Avatar institutionnel MokNet',
                    updatedAt: '2026-09-01T08:00:00.000Z',
                    updatedBy: 'Admin-Général',
                },
            },
        });
    });

    it('est présent dans la barre d’onglets du Studio', () => {
        render(
            <GlobalProvider>
                <Studio />
            </GlobalProvider>,
        );
        expect(screen.getByRole('button', { name: /Mon Avatar/ })).toBeInTheDocument();
        // L'onglet « Avatar 3D » historique n'a pas été remplacé.
        expect(screen.getByRole('button', { name: /Avatar 3D/ })).toBeInTheDocument();
    });

    it('affiche le parcours au profil du contexte global — ici un compte standard', () => {
        openAvatarTab();
        expect(screen.getByRole('heading', { name: /réservé aux membres Pro/i })).toBeInTheDocument();
    });

    it('sert à un compte sans photo l’avatar réellement défini par l’Admin-Général', () => {
        // Session d'un compte fraîchement créé : aucune photo à lui. C'est
        // exactement le cas que l'avatar par défaut doit couvrir — et il doit
        // traverser adminConfigService → GlobalProvider → écran du membre.
        window.localStorage.setItem(
            'lmav_session_v2',
            JSON.stringify({ id: 'u-neuf', email: 'neuf@example.com', name: 'Nouveau Membre', avatarUrl: '' }),
        );

        openAvatarTab();

        expect(screen.getByText('Avatar défini par la plateforme')).toBeInTheDocument();
        expect(screen.getByAltText('Nouveau Membre')).toHaveAttribute(
            'src',
            'https://cdn.moknet.app/avatar-plateforme.png',
        );
    });

    it('un membre qui a sa propre photo n’est pas écrasé par l’avatar de la plateforme', () => {
        window.localStorage.setItem(
            'lmav_session_v2',
            JSON.stringify({
                id: 'u-photo',
                email: 'photo@example.com',
                name: 'Aïssatou Bah',
                avatarUrl: 'https://cdn.moknet.app/ma-photo.png',
            }),
        );

        openAvatarTab();

        expect(screen.getByText('Votre photo de profil')).toBeInTheDocument();
        expect(screen.getByAltText('Aïssatou Bah')).toHaveAttribute('src', 'https://cdn.moknet.app/ma-photo.png');
    });
});
