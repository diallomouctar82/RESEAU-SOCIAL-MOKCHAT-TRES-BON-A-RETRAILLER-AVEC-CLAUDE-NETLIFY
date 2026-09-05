import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchitecteAvatar, ArchitecteIdentityBadge } from '../components/architecte/ArchitecteAvatar';
import { AdminArchitecteAvatarCard } from '../components/admin/AdminArchitecteAvatarCard';
import {
    DEFAULT_ARCHITECTE_AVATAR,
    type ArchitecteAvatarConfig,
} from '../services/architecte/architecteAvatar';

/**
 * AVATAR VIVANT DE L'ARCHITECTE — l'écran réellement rendu.
 *
 * Les règles sont prouvées dans `architecteAvatar.test.ts` ; ici on prouve
 * que le composant les RESPECTE : que l'état est lisible et pas seulement
 * animé, que l'animation s'arrête quand elle doit, que la bouche ne bouge
 * que sur une parole réelle, et que la console d'administration refuse ce que
 * le service refuse.
 */

const config = (over: Partial<ArchitecteAvatarConfig> = {}): ArchitecteAvatarConfig => ({
    ...DEFAULT_ARCHITECTE_AVATAR,
    ...over,
});

const renderAvatar = (props: Partial<React.ComponentProps<typeof ArchitecteAvatar>> = {}) =>
    render(
        <ArchitecteAvatar
            config={config()}
            presence="rest"
            ttsEngine={null}
            outputLevel={0}
            actionLabel="Ouvrir L'Architecte"
            {...props}
        />,
    );

const avatar = () => screen.getByTestId('architecte-avatar');

beforeEach(() => {
    // `matchMedia` et `IntersectionObserver` n'existent pas dans jsdom : sans
    // eux, le composant doit continuer de fonctionner (dégradation gracieuse).
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }),
    });
});

describe('L’avatar remplace bien un bouton — il en garde les devoirs', () => {
    it('reste un bouton actionnable, pas une image décorative', () => {
        const onClick = vi.fn();
        renderAvatar({ onClick });
        fireEvent.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('annonce l’identité, l’état ET l’action à un lecteur d’écran', () => {
        renderAvatar({ presence: 'speaking' });
        expect(avatar()).toHaveAttribute('aria-label', "L'Architecte — parle. Ouvrir L'Architecte");
    });

    it('l’état est écrit, jamais porté par la seule animation', () => {
        render(<ArchitecteIdentityBadge config={config()} presence="listening" />);
        expect(screen.getByTestId('architecte-state-text')).toHaveTextContent("L'Architecte vous écoute");
        expect(screen.getByText('Présence officielle MokNet')).toBeInTheDocument();
    });

    it('porte chaque état de la machine normative, hors ligne et mode allégé compris', () => {
        for (const presence of ['rest', 'listening', 'thinking', 'speaking', 'success', 'error', 'fallback', 'offline'] as const) {
            const { unmount } = renderAvatar({ presence });
            expect(avatar()).toHaveAttribute('data-presence', presence);
            unmount();
        }
    });
});

describe('Le bouton PERMANENT porte l’avatar — défaut relevé par la Direction le 04/09', () => {
    // Défaut réel : l'avatar n'avait été posé que dans la barre OUVERTE. Sur
    // l'écran d'accueil, le bouton toujours visible gardait son icône de
    // compas — « aucun changement, ton travail n'est pas visible ».
    it('l’avatar sait porter l’identifiant du bouton qu’il remplace', () => {
        renderAvatar({ testId: 'architecte-flottant', actionLabel: "Ouvrir l'Architecte" });
        const bouton = screen.getByTestId('architecte-flottant');
        expect(bouton).toBeInTheDocument();
        expect(bouton).toHaveAttribute('aria-label', "L'Architecte — au repos. Ouvrir l'Architecte");
    });

    it('rend un visage dès le repos, sans qu’aucune interaction soit nécessaire', () => {
        const { container } = renderAvatar({ testId: 'architecte-flottant' });
        // Le visage est là immédiatement : c'est toute la différence entre
        // une présence permanente et un avatar caché derrière une ouverture.
        // (Canvas depuis la refonte du 04/09 : le portrait est peint, pas un SVG.)
        expect(container.querySelector('canvas[data-portrait-src]')).toBeInTheDocument();
        expect(screen.getByTestId('architecte-flottant')).toHaveAttribute('data-presence', 'rest');
    });
});

describe('Animations — coupées quand elles doivent l’être', () => {
    it('animé par défaut', () => {
        renderAvatar();
        expect(avatar()).toHaveAttribute('data-animated', 'true');
    });

    it('immobile quand la Direction a coupé les animations', () => {
        renderAvatar({ config: config({ animationsEnabled: false }) });
        expect(avatar()).toHaveAttribute('data-animated', 'false');
    });

    it('immobile quand l’appareil demande de réduire le mouvement', () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            configurable: true,
            value: (query: string) => ({
                matches: true,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }),
        });
        renderAvatar();
        expect(avatar()).toHaveAttribute('data-animated', 'false');
    });
});

describe('Synchro labiale — seulement quand elle est réelle', () => {
    it('aucune synchro tant que l’Architecte ne parle pas, même avec un niveau audio résiduel', () => {
        renderAvatar({ presence: 'rest', ttsEngine: 'elevenlabs', outputLevel: 0.8 });
        expect(avatar()).toHaveAttribute('data-lipsync', 'aucune');
    });

    it('amplitude réelle avec le moteur qui donne accès au signal', () => {
        renderAvatar({ presence: 'speaking', ttsEngine: 'elevenlabs', outputLevel: 0.4 });
        expect(avatar()).toHaveAttribute('data-lipsync', 'amplitude_reelle');
    });

    it('visèmes alignés quand la piste phonétique pilote la bouche — annoncé pour ce qu’il est', () => {
        renderAvatar({ presence: 'speaking', ttsEngine: 'elevenlabs', voiceAligned: true });
        expect(avatar().getAttribute('data-lipsync')).toBe('visemes_alignes');
    });

    it('rythme des mots avec le moteur natif — annoncé pour ce qu’il est', () => {
        renderAvatar({ presence: 'speaking', ttsEngine: 'browser_native', outputLevel: 0 });
        expect(avatar()).toHaveAttribute('data-lipsync', 'rythme_des_mots');
    });

    it('coupée par le réglage Super-Admin, même en pleine parole', () => {
        renderAvatar({
            config: config({ lipSyncEnabled: false }),
            presence: 'speaking',
            ttsEngine: 'elevenlabs',
            outputLevel: 0.9,
        });
        expect(avatar()).toHaveAttribute('data-lipsync', 'aucune');
    });
});

describe('Photo et média synthétique', () => {
    it('par défaut, c’est une PHOTO qui est animée — pas un dessin', () => {
        // Refonte du 04/09 : la Direction a refusé l'androïde vectoriel.
        // L'avatar livré part d'un portrait photographique.
        const { container } = renderAvatar();
        // Depuis la refonte Canvas, la photo est peinte image par image ; le
        // canvas porte l'adresse du portrait qu'il anime.
        const portrait = container.querySelector('canvas');
        expect(portrait).toBeInTheDocument();
        expect(portrait).toHaveAttribute('data-portrait-src', DEFAULT_ARCHITECTE_AVATAR.photoUrl);
        expect(DEFAULT_ARCHITECTE_AVATAR.photoUrl).toMatch(/\.(webp|png|jpe?g)$/);
    });

    it('une autre photo prend la place de celle livrée', () => {
        const { container } = renderAvatar({ config: config({ photoUrl: 'https://cdn.moknet.app/visage.jpg' }) });
        expect(container.querySelector('canvas')).toHaveAttribute('data-portrait-src', 'https://cdn.moknet.app/visage.jpg');
    });

    it('sans AUCUNE photo, un repli technique évite le cadre vide', () => {
        const { container } = renderAvatar({ config: config({ photoUrl: '' }) });
        // Le tracé vectoriel n'est pas l'avatar : c'est un filet de sécurité.
        expect(container.querySelector('svg')).toBeInTheDocument();
        expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });

    it('une photo affiche la pastille « média synthétique », le repli non', () => {
        const { container: avecPhoto } = renderAvatar();
        expect(avecPhoto.querySelector('[title=\"Média synthétique\"]')).toBeInTheDocument();

        const { container: repli } = renderAvatar({ config: config({ photoUrl: '' }) });
        expect(repli.querySelector('[title=\"Média synthétique\"]')).not.toBeInTheDocument();
    });
});

describe('Console Super-Admin — les quatre réglages demandés', () => {
    const renderCard = (value = DEFAULT_ARCHITECTE_AVATAR) => {
        const onChange = vi.fn();
        render(<AdminArchitecteAvatarCard value={value} adminName="Admin-Général" onChange={onChange} />);
        return onChange;
    };

    it('1) changer l’avatar : accepte une adresse valide et l’horodate', () => {
        const onChange = renderCard();
        fireEvent.change(screen.getByLabelText(/Changer l’avatar/), {
            target: { value: 'https://cdn.moknet.app/architecte.png' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        const next = onChange.mock.calls[0][0] as ArchitecteAvatarConfig;
        expect(next.photoUrl).toBe('https://cdn.moknet.app/architecte.png');
        expect(next.updatedBy).toBe('Admin-Général');
        expect(Number.isNaN(Date.parse(next.updatedAt))).toBe(false);
    });

    it('1bis) refuse une adresse non conforme et n’enregistre rien', () => {
        const onChange = renderCard();
        fireEvent.change(screen.getByLabelText(/Changer l’avatar/), {
            target: { value: 'http://exemple.com/a.png' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));

        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent(/https/);
    });

    it('2) remettre l’avatar par défaut restaure le portrait livré', () => {
        const onChange = renderCard({ ...DEFAULT_ARCHITECTE_AVATAR, photoUrl: 'https://cdn.moknet.app/a.png' });
        fireEvent.click(screen.getByRole('button', { name: /Remettre l’avatar par défaut/ }));
        const suivant = onChange.mock.calls[0][0] as ArchitecteAvatarConfig;
        expect(suivant.photoUrl).toBe(DEFAULT_ARCHITECTE_AVATAR.photoUrl);
        // Le calage revient avec : une photo sans calage ne s'anime pas.
        expect(suivant.rig).toEqual(DEFAULT_ARCHITECTE_AVATAR.rig);
    });

    it('3) activer ou désactiver les animations', () => {
        const onChange = renderCard();
        fireEvent.click(screen.getByLabelText('Animations de l’avatar'));
        expect((onChange.mock.calls[0][0] as ArchitecteAvatarConfig).animationsEnabled).toBe(false);
    });

    it('4) régler la voix depuis le catalogue réel', () => {
        const onChange = renderCard();
        fireEvent.change(screen.getByLabelText(/Régler la voix/), { target: { value: 'directeur' } });
        expect((onChange.mock.calls[0][0] as ArchitecteAvatarConfig).voiceKey).toBe('directeur');
    });

    it('dit à la Direction ce que la synchro labiale fait réellement, sans la survendre', () => {
        renderCard();
        expect(screen.getByText(/ne donne pas accès au signal audio/)).toBeInTheDocument();
    });

    it('le calage du visage est réglable dès qu’une photo est en place', () => {
        // Sans ces réglages, une photo déposée par la Direction ne pourrait
        // pas être animée : le code ne devine pas où sont les yeux.
        render(<AdminArchitecteAvatarCard value={DEFAULT_ARCHITECTE_AVATAR} adminName="A" onChange={vi.fn()} />);
        expect(screen.getByLabelText('Ligne des yeux')).toBeInTheDocument();
        expect(screen.getByLabelText('Ligne de mâchoire')).toBeInTheDocument();
        expect(screen.getByLabelText('Ouverture mâchoire')).toBeInTheDocument();
        expect(screen.getByLabelText('Horizontale')).toBeInTheDocument();
    });

    it('sans photo, le calage disparaît — il n’y a rien à caler', () => {
        render(
            <AdminArchitecteAvatarCard
                value={{ ...DEFAULT_ARCHITECTE_AVATAR, photoUrl: '' }}
                adminName="A"
                onChange={vi.fn()}
            />,
        );
        expect(screen.queryByLabelText('Ligne des yeux')).not.toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────────────────────
// SÉQUENCE VIDÉO VALIDÉE (05/09/2026) — le modèle de la Direction dans le cadre
// ─────────────────────────────────────────────────────────────────────────
import { ARCHITECTE_PRESENTATION, createSequencePlayer } from '../services/architecte/sequences';

describe('Séquence vidéo validée dans le cadre de l’avatar', () => {
    beforeEach(() => {
        Object.defineProperty(window.HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn(() => Promise.resolve()) });
        Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
    });

    it('sans séquence, aucune couche vidéo : le rig seul, comme avant', () => {
        renderAvatar();
        expect(screen.queryByTestId('architecte-sequence-video')).toBeNull();
        expect(screen.getByTestId('architecte-avatar')).toHaveAttribute('data-sequence', 'idle');
    });

    it('avec la séquence, la couche vidéo est dans le cadre, invisible au repos, MP4 puis WebM, légendes en français', () => {
        renderAvatar({ sequence: ARCHITECTE_PRESENTATION, sequenceSlot: 'test' });
        const video = screen.getByTestId('architecte-sequence-video');
        expect(video).toHaveAttribute('data-sequence-status', 'idle');
        // Plus d'affiche sur la couche vidéo : elle ne serait jamais visible et coûtait un téléchargement.
        expect(video).not.toHaveAttribute('poster');
        expect(video).toHaveAttribute('playsinline');
        expect(video.className).toContain('opacity-0');
        const sources = video.querySelectorAll('source');
        expect(sources).toHaveLength(2);
        expect(sources[0]).toHaveAttribute('type', 'video/mp4');
        expect(sources[1]).toHaveAttribute('type', 'video/webm');
        expect(video.querySelector('track')).toHaveAttribute('srclang', 'fr');
        expect(screen.getByTestId('architecte-avatar')).toHaveAttribute('data-sequence', 'idle');
        // Le portrait vivant est toujours là, dessous : rien n'est supprimé.
        expect(document.querySelector('canvas')).toHaveAttribute('data-portrait-src', '/architecte/architecte.webp');
    });

    it('le réglage Super-Admin « désactivé » retire la vidéo sans toucher au rig', () => {
        renderAvatar({ config: config({ videoSequencesEnabled: false }), sequence: ARCHITECTE_PRESENTATION });
        expect(screen.queryByTestId('architecte-sequence-video')).toBeNull();
        expect(document.querySelector('canvas')).toBeInTheDocument();
    });

    it('une lecture demandée dans le geste devient visible, puis rend la main au rig à la fin', () => {
        const player = createSequencePlayer();
        renderAvatar({ sequence: ARCHITECTE_PRESENTATION, sequenceSlot: 'test', sequencePlayer: player });
        const video = screen.getByTestId('architecte-sequence-video') as HTMLVideoElement;
        act(() => { expect(player.play(ARCHITECTE_PRESENTATION.key, 'test')).toBe(true); });
        expect(video).toHaveAttribute('data-sequence-status', 'loading');
        act(() => { video.dispatchEvent(new Event('playing')); });
        expect(video).toHaveAttribute('data-sequence-status', 'playing');
        expect(video.className).toContain('opacity-100');
        expect(screen.getByTestId('architecte-avatar')).toHaveAttribute('data-sequence', 'playing');
        act(() => { video.dispatchEvent(new Event('error')); });
        expect(video).toHaveAttribute('data-sequence-status', 'failed');
        expect(video.className).toContain('opacity-0');
    });

    it('la carte Super-Admin expose la séquence validée : bascule, liste, prévisualisation', () => {
        const onChange = vi.fn();
        render(<AdminArchitecteAvatarCard value={DEFAULT_ARCHITECTE_AVATAR} adminName="Admin-Général" onChange={onChange} />);
        const bascule = screen.getByLabelText('Séquence vidéo validée (présentation)') as HTMLInputElement;
        expect(bascule.checked).toBe(true);
        expect(screen.getByText(/9,1 s · HeyGen, expressivité moyenne/)).toBeInTheDocument();
        expect(screen.getByTestId('architecte-sequences')).toHaveTextContent('validée le 5 septembre 2026 par Direction Vision Smart');
        fireEvent.click(screen.getByRole('button', { name: /Prévisualiser : Présentation/ }));
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
        fireEvent.click(bascule);
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ videoSequencesEnabled: false }));
    });
});
