import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RingtonePicker } from '../components/settings/RingtonePicker';
import * as ringtoneService from '../services/calls/ringtoneService';

/**
 * ÉQUIPE 9 (Audio & Sonneries) — tests du sélecteur de sonnerie.
 *
 * Le service audio est doublé (le vrai catalogue est conservé, la lecture
 * WebAudio non) : ce qui est testé ici, c'est le CONTRAT UI — un seul
 * aperçu à la fois, sélection radio, et surtout l'honnêteté du statut :
 * « Enregistré » n'apparaît QUE si `onSelect` a répondu strictement `true`.
 */

vi.mock('../services/calls/ringtoneService', async () => {
    const catalog = await vi.importActual<typeof import('../services/calls/ringtones')>(
        '../services/calls/ringtones',
    );
    return {
        DEFAULT_RINGTONE_ID: catalog.DEFAULT_RINGTONE_ID,
        getRingtones: () => [...catalog.RINGTONES],
        previewRingtone: vi.fn(async () => {}),
        stopPreview: vi.fn(),
        setSelectedRingtoneId: vi.fn(),
        getSelectedRingtoneId: vi.fn(() => catalog.DEFAULT_RINGTONE_ID),
    };
});

const previewMock = vi.mocked(ringtoneService.previewRingtone);
const stopPreviewMock = vi.mocked(ringtoneService.stopPreview);
const setSelectedMock = vi.mocked(ringtoneService.setSelectedRingtoneId);

beforeEach(() => {
    previewMock.mockClear();
    previewMock.mockImplementation(async () => {});
    stopPreviewMock.mockClear();
    setSelectedMock.mockClear();
});

describe('affichage du catalogue', () => {
    it('liste les 5 sonneries, marque « Par défaut » et coche la sélection courante', () => {
        render(<RingtonePicker selectedId="kora" onSelect={() => {}} />);

        for (const name of ['Signature MokNet', 'Kora', 'Pulse', 'Aurore', 'Classique']) {
            expect(screen.getByRole('radio', { name: new RegExp(name) })).toBeInTheDocument();
        }
        expect(screen.getAllByText('Par défaut')).toHaveLength(1);
        expect(screen.getByRole('radio', { name: /Kora/ })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: /Signature MokNet/ })).toHaveAttribute(
            'aria-checked',
            'false',
        );
    });
});

describe('sélection et honnêteté du statut d’enregistrement', () => {
    it('sélectionner écrit le cache local, appelle onSelect, et n’affiche « Enregistré » qu’après un `true`', async () => {
        let resolveSave!: (value: boolean) => void;
        const onSelect = vi.fn(
            () => new Promise<boolean>((resolve) => { resolveSave = resolve; }),
        );
        render(<RingtonePicker selectedId="signature" onSelect={onSelect} />);

        fireEvent.click(screen.getByRole('radio', { name: /Kora/ }));

        expect(setSelectedMock).toHaveBeenCalledWith('kora'); // applicable immédiatement sur l'appareil
        expect(onSelect).toHaveBeenCalledWith('kora');
        expect(await screen.findByText('Enregistrement…')).toBeInTheDocument();
        expect(screen.queryByText('Enregistré')).not.toBeInTheDocument();

        await act(async () => {
            resolveSave(true);
        });
        expect(screen.getByText('Enregistré')).toBeInTheDocument();
    });

    it('onSelect répond false : l’échec est affiché, jamais « Enregistré »', async () => {
        const onSelect = vi.fn(async () => false);
        render(<RingtonePicker selectedId="signature" onSelect={onSelect} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('radio', { name: /Pulse/ }));
        });

        expect(screen.getByText(/Échec de l'enregistrement/)).toBeInTheDocument();
        expect(screen.queryByText('Enregistré')).not.toBeInTheDocument();
    });

    it('onSelect qui ne renvoie rien : aucune mention (ni succès ni échec) n’est affichée', async () => {
        const onSelect = vi.fn(() => undefined);
        render(<RingtonePicker selectedId="signature" onSelect={onSelect} />);

        await act(async () => {
            fireEvent.click(screen.getByRole('radio', { name: /Aurore/ }));
        });

        expect(screen.queryByText('Enregistré')).not.toBeInTheDocument();
        expect(screen.queryByText(/Échec/)).not.toBeInTheDocument();
    });

    it('re-cliquer la sonnerie déjà sélectionnée ne déclenche rien', () => {
        const onSelect = vi.fn();
        render(<RingtonePicker selectedId="kora" onSelect={onSelect} />);

        fireEvent.click(screen.getByRole('radio', { name: /Kora/ }));
        expect(onSelect).not.toHaveBeenCalled();
    });
});

describe('restaurer la sonnerie par défaut', () => {
    it('propose la restauration quand une autre sonnerie est choisie', async () => {
        const onSelect = vi.fn(async () => true);
        render(<RingtonePicker selectedId="kora" onSelect={onSelect} />);

        const restore = screen.getByRole('button', { name: /Restaurer la sonnerie par défaut/ });
        expect(restore).not.toBeDisabled();

        await act(async () => {
            fireEvent.click(restore);
        });
        expect(onSelect).toHaveBeenCalledWith('signature');
    });

    it('est désactivée quand la sonnerie par défaut est déjà active', () => {
        render(<RingtonePicker selectedId="signature" onSelect={() => {}} />);
        expect(
            screen.getByRole('button', { name: /Restaurer la sonnerie par défaut/ }),
        ).toBeDisabled();
    });
});

describe('aperçu', () => {
    it('▶ lance l’aperçu, ⏹ l’arrête — un seul aperçu à la fois', async () => {
        previewMock.mockReturnValue(new Promise<void>(() => {})); // aperçu « en cours »
        render(<RingtonePicker selectedId="signature" onSelect={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /Écouter un aperçu de Pulse/ }));
        expect(previewMock).toHaveBeenCalledWith('pulse');
        // Le service coupe toujours l'aperçu précédent avant d'en lancer un autre.
        expect(stopPreviewMock).toHaveBeenCalled();

        const stopButton = await screen.findByRole('button', { name: /Arrêter l'aperçu de Pulse/ });
        stopPreviewMock.mockClear();
        fireEvent.click(stopButton);

        expect(stopPreviewMock).toHaveBeenCalled();
        expect(
            await screen.findByRole('button', { name: /Écouter un aperçu de Pulse/ }),
        ).toBeInTheDocument();
    });

    it('le bouton revient de lui-même en ▶ quand l’aperçu se termine seul', async () => {
        let endPreview!: () => void;
        previewMock.mockReturnValue(new Promise<void>((resolve) => { endPreview = resolve; }));
        render(<RingtonePicker selectedId="signature" onSelect={() => {}} />);

        fireEvent.click(screen.getByRole('button', { name: /Écouter un aperçu de Kora/ }));
        expect(
            await screen.findByRole('button', { name: /Arrêter l'aperçu de Kora/ }),
        ).toBeInTheDocument();

        await act(async () => {
            endPreview(); // fin naturelle de l'itération
        });
        expect(
            screen.getByRole('button', { name: /Écouter un aperçu de Kora/ }),
        ).toBeInTheDocument();
    });

    it('le démontage du composant arrête l’aperçu — jamais de son orphelin', () => {
        const { unmount } = render(<RingtonePicker selectedId="signature" onSelect={() => {}} />);
        stopPreviewMock.mockClear();
        unmount();
        expect(stopPreviewMock).toHaveBeenCalled();
    });
});

describe('cohérence appareil ↔ affichage', () => {
    it('le cache local est aligné sur la sélection affichée dès le montage', () => {
        render(<RingtonePicker selectedId="aurore" onSelect={() => {}} />);
        expect(setSelectedMock).toHaveBeenCalledWith('aurore');
    });
});
