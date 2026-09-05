/**
 * SUPER-ADMIN — « Créer ou remplacer l'avatar vivant depuis une photo »
 * (Direction, 05/09/2026) : aperçu, validation, sauvegarde, retour arrière,
 * sans rien qui recouvre l'application. La carte réelle, avec une doublure
 * d'analyse (le moteur MediaPipe est prouvé au banc navigateur réel).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminArchitecteAvatarCard } from '../components/admin/AdminArchitecteAvatarCard';
import { DEFAULT_ARCHITECTE_AVATAR, sculptureMaskFor, type ArchitecteAvatarConfig } from '../services/architecte/architecteAvatar';
import { DEFAULT_PORTRAIT_RIG } from '../services/architecte/livingAvatar';
import { PhotoAvatarError } from '../services/architecte/photoAvatarEngine';
import type { PhotoAvatarCandidate } from '../services/architecte/photoAvatar';

const candidat: PhotoAvatarCandidate = {
    photoUrl: 'data:image/jpeg;base64,AAAA',
    maskUrl: 'data:image/png;base64,BBBB',
    rig: { ...DEFAULT_PORTRAIT_RIG, eyeLinePercent: 47 },
    mouthAnchor: { xPercent: 50, yPercent: 70, widthPercent: 17, tiltDeg: 0 },
    warnings: ['Tête inclinée : une photo bien droite donne un regard et une bouche plus justes.'],
    sourceName: 'direction.jpg',
    framing: { x: 0, y: 0, side: 100, coverage: 1 },
    landmarksFound: 478,
};

function monter(analyse: (file: File) => Promise<PhotoAvatarCandidate>, value: ArchitecteAvatarConfig = DEFAULT_ARCHITECTE_AVATAR) {
    const onChange = vi.fn();
    render(<AdminArchitecteAvatarCard value={value} adminName="Admin-Général" onChange={onChange} analysePhoto={analyse} />);
    return onChange;
}

function choisirPhoto() {
    const input = screen.getByTestId('avatar-photo-fichier') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'direction.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    return file;
}

describe("Créer ou remplacer l'avatar vivant depuis une photo", () => {
    it("l'option vit DANS la carte Super-Admin (aucun panneau, aucun fond par-dessus l'application) et analyse la photo choisie", async () => {
        const analyse = vi.fn(async () => candidat);
        monter(analyse);
        const section = screen.getByTestId('avatar-photo');
        expect(section.tagName).toBe('FIELDSET');
        expect(section.closest('section')).not.toBeNull();
        expect(document.querySelector('[class*="fixed"]')).toBeNull();
        expect(screen.queryByTestId('avatar-photo-apercu')).toBeNull();

        const file = choisirPhoto();
        expect(analyse).toHaveBeenCalledWith(file);
        expect(await screen.findByText(/Photo analysée \(478 repères du visage\)/)).toBeInTheDocument();
        // Aperçu vivant : l'actuel et le nouveau, avec le composant réel en variante sculpture.
        expect(screen.getByTestId('avatar-photo-apercu')).toBeInTheDocument();
        expect(screen.getByTestId('avatar-photo-actuel')).toHaveAttribute('data-variant', 'sculpture');
        expect(screen.getByTestId('avatar-photo-nouveau')).toHaveAttribute('data-variant', 'sculpture');
        expect(screen.getByTestId('avatar-photo-avertissements')).toHaveTextContent('Tête inclinée');
        // Le modèle vidéo validé ne vient pas de cette photo : dit clairement, avant validation.
        expect(screen.getByText(/parle par le portrait vivant/)).toBeInTheDocument();
        // Rien n'est enregistré tant que la personne n'a pas validé.
        expect(screen.queryByTestId('avatar-photo-retour')).toBeNull();
    });

    it('valider enregistre la photo, son rig, sa bouche et son masque ; l’avatar précédent reste disponible et revient d’un clic', async () => {
        const onChange = monter(async () => candidat);
        choisirPhoto();
        await screen.findByTestId('avatar-photo-apercu');
        fireEvent.click(screen.getByTestId('avatar-photo-valider'));

        expect(onChange).toHaveBeenCalledTimes(1);
        const enregistre = onChange.mock.calls[0][0] as ArchitecteAvatarConfig;
        expect(enregistre.photoUrl).toBe(candidat.photoUrl);
        expect(enregistre.rig.eyeLinePercent).toBe(47);
        expect(enregistre.mouthAnchor.yPercent).toBe(70);
        expect(enregistre.silhouetteMaskUrl).toBe(candidat.maskUrl);
        expect(sculptureMaskFor(enregistre)).toBe(candidat.maskUrl);
        expect(enregistre.previousAvatar?.photoUrl).toBe(DEFAULT_ARCHITECTE_AVATAR.photoUrl);
        expect(enregistre.updatedBy).toBe('Admin-Général');
        expect(screen.getByText(/Nouvel avatar enregistré/)).toBeInTheDocument();
        expect(screen.queryByTestId('avatar-photo-apercu')).toBeNull();

        fireEvent.click(screen.getByTestId('avatar-photo-retour'));
        expect(onChange).toHaveBeenCalledTimes(2);
        const retour = onChange.mock.calls[1][0] as ArchitecteAvatarConfig;
        expect(retour.photoUrl).toBe(DEFAULT_ARCHITECTE_AVATAR.photoUrl);
        expect(retour.silhouetteMaskUrl).toBe(DEFAULT_ARCHITECTE_AVATAR.silhouetteMaskUrl);
        expect(retour.previousAvatar).toBeNull();
        expect(screen.getByText(/Avatar précédent rétabli/)).toBeInTheDocument();
        expect(screen.queryByTestId('avatar-photo-retour')).toBeNull();
    });

    it('annuler abandonne le candidat sans rien enregistrer', async () => {
        const onChange = monter(async () => candidat);
        choisirPhoto();
        await screen.findByTestId('avatar-photo-apercu');
        fireEvent.click(screen.getByTestId('avatar-photo-annuler'));
        expect(screen.queryByTestId('avatar-photo-apercu')).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('sans visage net, ou moteur indisponible : le message exact est affiché, rien n’est enregistré, on peut réessayer', async () => {
        const analyse = vi
            .fn<(file: File) => Promise<PhotoAvatarCandidate>>()
            .mockRejectedValueOnce(new PhotoAvatarError('aucun_visage', 'Aucun visage net détecté : choisissez une photo de face, bien éclairée, sans lunettes de soleil.'))
            .mockResolvedValueOnce(candidat);
        const onChange = monter(analyse);
        choisirPhoto();
        expect(await screen.findByRole('alert')).toHaveTextContent('Aucun visage net détecté');
        expect(onChange).not.toHaveBeenCalled();
        choisirPhoto();
        await waitFor(() => expect(screen.getByTestId('avatar-photo-apercu')).toBeInTheDocument());
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
