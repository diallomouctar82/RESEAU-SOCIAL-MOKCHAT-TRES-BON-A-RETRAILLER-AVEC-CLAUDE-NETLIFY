import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../types';
import { AvatarStudio } from '../components/studio/AvatarStudio';
import type { DefaultAvatarPolicy } from '../services/studio/avatarStudio';

/**
 * STUDIO AVATAR — l'écran réellement rendu.
 *
 * Les règles sont prouvées dans `avatarStudioFlow.test.ts` ; ici on prouve
 * que l'écran les RESPECTE : qu'un compte non Pro ne peut pas entrer, que le
 * parcours va bien de la photo à l'aperçu, que le consentement ne peut pas
 * être sauté, et qu'un enregistrement raté n'affiche jamais un succès.
 */

const DEFAULT_AVATAR: DefaultAvatarPolicy = {
    photoUrl: 'https://cdn.moknet.app/avatar-plateforme.png',
    label: 'Avatar institutionnel MokNet',
    updatedAt: '2026-09-01T08:00:00.000Z',
    updatedBy: 'Admin-Général',
};

const profile = (over: Partial<UserProfile> = {}): UserProfile =>
    ({
        id: 'u1',
        email: 'membre@example.com',
        name: 'Aïssatou Bah',
        role: 'user',
        avatarUrl: '',
        privacySettings: {},
        ...over,
    }) as UserProfile;

const photoFile = () => new File(['photo-bytes'], 'moi.jpg', { type: 'image/jpeg' });

/** Déroule le parcours jusqu'à l'aperçu, en partant d'un écran déjà rendu. */
async function walkToPreview(): Promise<void> {
    fireEvent.change(screen.getByLabelText('Choisir une photo'), {
        target: { files: [photoFile()] },
    });

    // Consentement : les deux clauses obligatoires + la parole.
    await screen.findByText(/Votre consentement/);
    const boxes = screen.getAllByRole('checkbox');
    boxes.forEach((box) => fireEvent.click(box));
    fireEvent.click(screen.getByRole('button', { name: /Je consens/ }));

    // Nom.
    await screen.findByText(/Le nom de votre avatar/);
    fireEvent.change(screen.getByLabelText('Nom affiché'), { target: { value: 'Appelez-moi Aïssatou' } });
    fireEvent.click(screen.getByRole('button', { name: /Valider le nom/ }));

    // Génération.
    await screen.findByText(/Génération de votre avatar/);
    fireEvent.click(screen.getByRole('button', { name: /Générer mon avatar/ }));
    await screen.findByRole('button', { name: /Activer cet avatar/ });
}

describe('Accès — le verrou Pro est tenu par l’écran, pas seulement par le service', () => {
    it('un compte standard voit l’offre et l’avatar qu’il porte, sans aucun champ du parcours', () => {
        render(
            <AvatarStudio
                profile={profile()}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
            />,
        );

        expect(screen.getByRole('heading', { name: /réservé aux membres Pro/i })).toBeInTheDocument();
        // Aucun moyen de contourner : les commandes du parcours ne sont pas rendues.
        expect(screen.queryByLabelText('Choisir une photo')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Générer mon avatar/ })).not.toBeInTheDocument();
        // L'avatar par défaut de la plateforme lui est bien montré.
        expect(screen.getByText('Avatar défini par la plateforme')).toBeInTheDocument();
    });

    it('un compte suspendu ne se voit proposer aucune offre', () => {
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro', accountStatus: 'suspended' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
            />,
        );
        expect(screen.getByRole('status')).toHaveTextContent(/suspendu/i);
    });

    it('un membre Pro entre directement sur l’étape photo', () => {
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
            />,
        );
        expect(screen.getByRole('heading', { name: 'Votre photo' })).toBeInTheDocument();
        expect(screen.getByLabelText('Choisir une photo')).toBeInTheDocument();
    });
});

describe('Parcours complet — photo → consentement → nom → génération → aperçu', () => {
    it('mène jusqu’à l’aperçu et enregistre réellement l’avatar personnel', async () => {
        const onUpdateProfile = vi.fn().mockResolvedValue(true);
        const onUploadPhoto = vi.fn().mockResolvedValue('https://cdn.moknet.app/u1/moi.jpg');

        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={onUpdateProfile}
                onUploadPhoto={onUploadPhoto}
            />,
        );

        await walkToPreview();

        // La photo est bien passée par le téléversement réel.
        expect(onUploadPhoto).toHaveBeenCalledTimes(1);

        // L'aperçu montre le nom nettoyé et la salutation prononcée.
        expect(screen.getByText('Aïssatou')).toBeInTheDocument();
        expect(screen.getByText(/Bonjour, je suis Aïssatou/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Activer cet avatar/ }));

        await waitFor(() => expect(onUpdateProfile).toHaveBeenCalledTimes(1));
        const updates = onUpdateProfile.mock.calls[0][0];
        expect(updates.avatarUrl).toBe('https://cdn.moknet.app/u1/moi.jpg');
        expect(updates.privacySettings.avatarStudio.displayName).toBe('Aïssatou');
        expect(updates.privacySettings.avatarStudio.speaks).toBe(true);
        expect(updates.privacySettings.avatarStudio.consent.ownsImage).toBe(true);

        expect(await screen.findByText('Avatar personnel actif')).toBeInTheDocument();
    });

    it('sans téléversement disponible, le parcours reste entier — dégradation gracieuse', async () => {
        const onUpdateProfile = vi.fn().mockResolvedValue(true);

        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={onUpdateProfile}
                onUploadPhoto={vi.fn().mockRejectedValue(new Error('réseau indisponible'))}
            />,
        );

        await walkToPreview();
        fireEvent.click(screen.getByRole('button', { name: /Activer cet avatar/ }));

        await waitFor(() => expect(onUpdateProfile).toHaveBeenCalledTimes(1));
        // La photo a été conservée localement plutôt que perdue.
        expect(onUpdateProfile.mock.calls[0][0].avatarUrl).toMatch(/^data:image\//);
    });

    it('propose d’écouter la salutation quand la parole a été autorisée', async () => {
        const onSpeak = vi.fn();
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
                onUploadPhoto={vi.fn().mockResolvedValue('https://cdn.moknet.app/u1/moi.jpg')}
                onSpeak={onSpeak}
            />,
        );

        await walkToPreview();
        fireEvent.click(screen.getByRole('button', { name: /Écouter/ }));
        expect(onSpeak).toHaveBeenCalledWith('Bonjour, je suis Aïssatou. Je vous accompagne dans MokNet.');
    });
});

describe('Garde-fous — ce que l’écran refuse', () => {
    it('refuse une photo au mauvais format et reste sur l’étape photo', () => {
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
            />,
        );

        fireEvent.change(screen.getByLabelText('Choisir une photo'), {
            target: { files: [new File(['%PDF'], 'contrat.pdf', { type: 'application/pdf' })] },
        });

        expect(screen.getByRole('alert')).toHaveTextContent(/JPEG/);
        expect(screen.getByRole('heading', { name: 'Votre photo' })).toBeInTheDocument();
    });

    it('ne laisse pas passer un consentement dont une clause obligatoire manque', async () => {
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
                onUploadPhoto={vi.fn().mockResolvedValue('https://cdn.moknet.app/u1/moi.jpg')}
            />,
        );

        fireEvent.change(screen.getByLabelText('Choisir une photo'), { target: { files: [photoFile()] } });
        await screen.findByText(/Votre consentement/);

        // Seule la clause facultative (la parole) est cochée.
        fireEvent.click(screen.getAllByRole('checkbox')[2]);
        fireEvent.click(screen.getByRole('button', { name: /Je consens/ }));

        expect(screen.getByRole('alert')).toHaveTextContent(/obligatoires/);
        expect(screen.getByText(/Votre consentement/)).toBeInTheDocument();
    });

    it('refuse un nom qui n’en est pas un et reste sur l’étape nom', async () => {
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(true)}
                onUploadPhoto={vi.fn().mockResolvedValue('https://cdn.moknet.app/u1/moi.jpg')}
            />,
        );

        fireEvent.change(screen.getByLabelText('Choisir une photo'), { target: { files: [photoFile()] } });
        await screen.findByText(/Votre consentement/);
        screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box));
        fireEvent.click(screen.getByRole('button', { name: /Je consens/ }));

        await screen.findByText(/Le nom de votre avatar/);
        fireEvent.change(screen.getByLabelText('Nom affiché'), { target: { value: 'https://exemple.com' } });
        fireEvent.click(screen.getByRole('button', { name: /Valider le nom/ }));

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Le nom de votre avatar/)).toBeInTheDocument();
    });

    it('un enregistrement raté ne produit jamais un faux succès', async () => {
        const onUpdateProfile = vi.fn().mockResolvedValue(false);
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro' })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={onUpdateProfile}
                onUploadPhoto={vi.fn().mockResolvedValue('https://cdn.moknet.app/u1/moi.jpg')}
            />,
        );

        await walkToPreview();
        fireEvent.click(screen.getByRole('button', { name: /Activer cet avatar/ }));

        expect(await screen.findByRole('alert')).toHaveTextContent(/n'a pas abouti/);
        expect(screen.queryByText('Avatar personnel actif')).not.toBeInTheDocument();
    });
});

describe('Révocation', () => {
    const persona = {
        photoUrl: 'https://cdn.moknet.app/u1/moi.jpg',
        displayName: 'Aïssatou',
        consent: {
            ownsImage: true,
            allowsDisplay: true,
            allowsVoiceGuidance: true,
            acceptedAt: '2026-09-04T10:30:00.000Z',
        },
        createdAt: '2026-09-04T10:30:00.000Z',
        greeting: 'Bonjour, je suis Aïssatou. Je vous accompagne dans MokNet.',
        guidance: ['Aïssatou vous ouvre le fil social.'],
        speaks: true,
    };

    it('rend l’avatar de la plateforme quand le membre révoque le sien', async () => {
        const onUpdateProfile = vi.fn().mockResolvedValue(true);
        render(
            <AvatarStudio
                profile={profile({
                    plan: 'pro',
                    avatarUrl: persona.photoUrl,
                    privacySettings: { profileVisibility: 'public', avatarStudio: persona } as never,
                })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={onUpdateProfile}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Révoquer mon avatar/ }));

        await waitFor(() => expect(onUpdateProfile).toHaveBeenCalledTimes(1));
        const updates = onUpdateProfile.mock.calls[0][0];
        expect(updates.privacySettings.avatarStudio).toBeUndefined();
        expect(updates.avatarUrl).toBe(DEFAULT_AVATAR.photoUrl);
        expect(updates.privacySettings.profileVisibility).toBe('public');
    });

    it('une révocation ratée le dit, au lieu de laisser croire que l’avatar est retiré', async () => {
        render(
            <AvatarStudio
                profile={profile({ plan: 'pro', privacySettings: { avatarStudio: persona } as never })}
                defaultAvatar={DEFAULT_AVATAR}
                onUpdateProfile={vi.fn().mockResolvedValue(false)}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Révoquer mon avatar/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent(/toujours actif/);
    });
});
