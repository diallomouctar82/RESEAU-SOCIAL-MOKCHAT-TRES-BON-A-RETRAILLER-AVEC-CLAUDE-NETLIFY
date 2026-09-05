import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { ArchitecteSequenceCutout, composeCutoutFrame } from '../components/architecte/ArchitecteSequenceCutout';
import { ARCHITECTE_PRESENTATION, createSequencePlayer } from '../services/architecte/sequences';

describe('Couche vidéo détourée de la sculpture', () => {
    beforeEach(() => {
        Object.defineProperty(window.HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn(() => Promise.resolve()) });
        Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
    });

    it('recompose une image : les couleurs du haut prennent l’alpha (luminance) du matte du bas', () => {
        const colour = new Uint8ClampedArray([10, 20, 30, 255, 200, 210, 220, 255]);
        const matte = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
        const out = new Uint8ClampedArray(8);
        composeCutoutFrame(colour, matte, out);
        expect(Array.from(out)).toEqual([10, 20, 30, 0, 200, 210, 220, 255]);
    });

    it('livre la vidéo empilée (MP4 puis WebM) cachée, et un canevas invisible au repos, attachés au lecteur', () => {
        const player = createSequencePlayer();
        render(<ArchitecteSequenceCutout sequence={ARCHITECTE_PRESENTATION} slot="sculpture" player={player} />);
        const video = screen.getByTestId('architecte-sequence-video');
        expect(video).toHaveAttribute('data-sequence-layer', 'cutout');
        expect(video).toHaveAttribute('data-sequence-slot', 'sculpture');
        const sources = video.querySelectorAll('source');
        expect(sources).toHaveLength(2);
        expect(sources[0]).toHaveAttribute('src', '/architecte/vision-smart-heygen.cutout.mp4');
        expect(sources[1]).toHaveAttribute('type', 'video/webm');
        const canvas = screen.getByTestId('architecte-sequence-cutout');
        expect(canvas.className).toContain('opacity-0');
        // Attaché : une demande de lecture sur ce cadre est acceptée.
        let accepted = false;
        act(() => { accepted = player.play(ARCHITECTE_PRESENTATION.key, 'sculpture'); });
        expect(accepted).toBe(true);
        expect(canvas).toHaveAttribute('data-sequence-status', 'loading');
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });
});
