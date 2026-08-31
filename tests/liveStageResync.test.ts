import { describe, expect, it } from 'vitest';
import {
    hasPresentableMedia,
    nextCameraFacing,
    stageGridClass,
    liveBadge,
    realViewerCount,
    shouldStartPanelCollapsed,
    type RemoteParticipantMedia,
} from '../hooks/useLiveTransport';
import type { LiveTrackHandle, LiveTrackKind } from '../services/live/liveTransportTypes';
import {
    isStageRole,
    deriveSelfStagePresence,
    mergeLiveStreamWithRealSession,
} from '../services/live/liveSessionService';
import type { LiveStream } from '../types';

/**
 * Équipe 10 (mission Appels/Live, loops 8-12) — logique pure extraite des
 * correctifs L1/L3/L4 :
 *  - L1 : resynchronisation de MA présence sur scène depuis ma ligne
 *    live_speakers (promotion/rétrogradation) ;
 *  - L3 : filtre des tuiles (média réellement publié) et grille dérivée du
 *    nombre réel de tuiles ; panneau replié par défaut sur mobile ;
 *  - L4 : badge d'état réel, compteur de spectateurs honnête, fusion de la
 *    ligne live_sessions réelle dans l'état d'affichage.
 */

const fakeTrack = (kind: LiveTrackKind): LiveTrackHandle => ({
    participantIdentity: 'user-1',
    kind,
    attach: () => {},
    detach: () => {},
});

const media = (extra: Partial<RemoteParticipantMedia> = {}): RemoteParticipantMedia => ({
    participant: {
        identity: 'user-1',
        name: 'Awa',
        isLocal: false,
        isSpeaking: false,
        audioEnabled: true,
        videoEnabled: true,
        isScreenSharing: false,
    },
    ...extra,
});

describe('hasPresentableMedia — filtre des tuiles de scène (L3)', () => {
    it('refuse une tuile à un spectateur connecté sans aucun média', () => {
        expect(hasPresentableMedia(media())).toBe(false);
    });

    it('accorde une tuile à qui publie sa caméra', () => {
        expect(hasPresentableMedia(media({ videoTrack: fakeTrack('video') }))).toBe(true);
    });

    it("accorde une tuile à qui publie un partage d'écran", () => {
        expect(hasPresentableMedia(media({ screenShareTrack: fakeTrack('screen_share') }))).toBe(true);
    });

    it('accorde une tuile à qui est sur scène en audio seul (micro publié)', () => {
        expect(hasPresentableMedia(media({ audioTrack: fakeTrack('audio') }))).toBe(true);
    });

    it("ne fait pas une tuile du seul SON d'un partage d'écran (joué par le puits audio)", () => {
        expect(hasPresentableMedia(media({ screenShareAudioTrack: fakeTrack('screen_share_audio') }))).toBe(false);
    });
});

describe('stageGridClass — grille dérivée du nombre réel de tuiles (L3)', () => {
    it('1 tuile : pleine scène (le présentateur seul domine l\'écran)', () => {
        const cls = stageGridClass(1);
        expect(cls).toContain('grid-cols-1');
        expect(cls).toContain('grid-rows-1');
    });

    it('0 tuile (cas limite) : même disposition pleine scène', () => {
        expect(stageGridClass(0)).toBe(stageGridClass(1));
    });

    it('2 tuiles : empilées sur mobile (pleine largeur), deux colonnes ensuite', () => {
        const cls = stageGridClass(2);
        expect(cls).toContain('grid-cols-1');
        expect(cls).toContain('sm:grid-cols-2');
    });

    it('3 et 4 tuiles : 2x2', () => {
        expect(stageGridClass(3)).toBe('grid-cols-2');
        expect(stageGridClass(4)).toBe('grid-cols-2');
    });

    it('au-delà de 4 : auto-fit', () => {
        const cls = stageGridClass(5);
        expect(cls).toContain('auto-fit');
        expect(stageGridClass(9)).toBe(cls);
    });
});

describe('isStageRole / deriveSelfStagePresence — resynchronisation du rôle (L1)', () => {
    it('reconnaît les rôles de scène (host, speaker, moderator) et refuse les autres', () => {
        expect(isStageRole('host')).toBe(true);
        expect(isStageRole('speaker')).toBe(true);
        expect(isStageRole('moderator')).toBe(true);
        expect(isStageRole('viewer')).toBe(false);
        expect(isStageRole('expert_ai')).toBe(false);
        expect(isStageRole(null)).toBe(false);
        expect(isStageRole(undefined)).toBe(false);
        expect(isStageRole('')).toBe(false);
    });

    it("promeut l'invité dont la ligne passe à role='speaker' (c'est ainsi qu'il APPREND sa promotion)", () => {
        expect(
            deriveSelfStagePresence({ role: 'speaker', leftAt: null, isCurrentlyOnStage: false, isHost: false }),
        ).toBe('promote');
    });

    it('ne repromeut pas en boucle quelqu\'un déjà sur scène (le polling répète la ligne toutes les 4 s)', () => {
        expect(
            deriveSelfStagePresence({ role: 'speaker', leftAt: null, isCurrentlyOnStage: true, isHost: false }),
        ).toBe('none');
    });

    it("rétrograde qui redevient 'viewer' en base alors qu'il était sur scène", () => {
        expect(
            deriveSelfStagePresence({ role: 'viewer', leftAt: null, isCurrentlyOnStage: true, isHost: false }),
        ).toBe('demote');
    });

    it("ne rétrograde JAMAIS l'hôte réel sur une ligne 'viewer'", () => {
        expect(
            deriveSelfStagePresence({ role: 'viewer', leftAt: null, isCurrentlyOnStage: true, isHost: true }),
        ).toBe('none');
    });

    it('ignore une ligne marquée sortie (left_at non nul)', () => {
        expect(
            deriveSelfStagePresence({ role: 'speaker', leftAt: '2026-08-31T10:00:00Z', isCurrentlyOnStage: false, isHost: false }),
        ).toBe('none');
    });

    it("un spectateur qui reste 'viewer' hors scène : rien à faire", () => {
        expect(
            deriveSelfStagePresence({ role: 'viewer', leftAt: null, isCurrentlyOnStage: false, isHost: false }),
        ).toBe('none');
    });
});

describe("liveBadge — badge dérivé de l'état réel (L4)", () => {
    it('aperçu de démonstration (aucune session réelle) : jamais un LIVE rouge', () => {
        const badge = liveBadge(false, 'connected', false);
        expect(badge.label).toBe('APERÇU');
        expect(badge.className).not.toContain('bg-red-600');
    });

    it('connecté : LIVE rouge pulsant', () => {
        const badge = liveBadge(true, 'connected', false);
        expect(badge.label).toBe('LIVE');
        expect(badge.className).toContain('bg-red-600');
        expect(badge.className).toContain('animate-pulse');
    });

    it('reconnexion : état distinct, pas un faux LIVE', () => {
        const badge = liveBadge(true, 'reconnecting', false);
        expect(badge.label).toBe('RECONNEXION');
        expect(badge.className).not.toContain('bg-red-600');
    });

    it("erreur de transport : INTERROMPU prime sur l'état de connexion", () => {
        const badge = liveBadge(true, 'connected', true);
        expect(badge.label).toBe('INTERROMPU');
    });

    it('connexion initiale (connecting/disconnected) : CONNEXION', () => {
        expect(liveBadge(true, 'connecting', false).label).toBe('CONNEXION');
        expect(liveBadge(true, 'disconnected', false).label).toBe('CONNEXION');
    });
});

describe('realViewerCount — compteur de spectateurs honnête (L4)', () => {
    it('connecté au transport : moi + les participants distants réels', () => {
        expect(
            realViewerCount({ hasRealSession: true, connectionState: 'connected', remoteParticipantCount: 3, dbViewers: 1420 }),
        ).toBe(4);
    });

    it('session réelle pas encore connectée : repli sur le compteur persisté en base', () => {
        expect(
            realViewerCount({ hasRealSession: true, connectionState: 'connecting', remoteParticipantCount: 0, dbViewers: 7 }),
        ).toBe(7);
    });

    it('aperçu de démonstration : RIEN plutôt que le 1420 fictif', () => {
        expect(
            realViewerCount({ hasRealSession: false, connectionState: 'disconnected', remoteParticipantCount: 0, dbViewers: 1420 }),
        ).toBeNull();
    });

    it('session réelle sans compteur exploitable : rien non plus', () => {
        expect(
            realViewerCount({ hasRealSession: true, connectionState: 'disconnected', remoteParticipantCount: 0, dbViewers: undefined }),
        ).toBeNull();
    });
});

describe('mergeLiveStreamWithRealSession — la ligne réelle alimente l\'affichage (L4)', () => {
    const demoStream: LiveStream = {
        id: 'live-demo',
        title: 'Masterclass de démonstration',
        hostName: 'Sarah Koné',
        hostAvatar: 'https://example.com/avatar-demo.jpg',
        viewers: 1420,
        isMixed: true,
        startedAt: new Date('2026-08-31T09:00:00Z'),
        duration: 45,
        isPaid: false,
        tags: ['#Demo'],
        coverImage: 'https://example.com/cover-demo.jpg',
    };

    const realStream: LiveStream = {
        id: 'a3f0c9d2-0000-4000-8000-000000000001',
        title: 'Vrai direct : financer son projet',
        hostId: 'host-uuid-1',
        hostName: '',
        hostAvatar: '',
        viewers: 3,
        isMixed: false,
        startedAt: new Date('2026-08-31T10:00:00Z'),
        duration: 60,
        isPaid: false,
        tags: [],
    };

    it('la base gagne sur le contenu réel : id, titre, compteur, hôte réel', () => {
        const merged = mergeLiveStreamWithRealSession(demoStream, realStream);
        expect(merged.id).toBe(realStream.id);
        expect(merged.title).toBe('Vrai direct : financer son projet');
        expect(merged.viewers).toBe(3);
        expect(merged.hostId).toBe('host-uuid-1');
    });

    it("les champs de présentation vides retombent sur l'affichage précédent (jamais une UI cassée)", () => {
        const merged = mergeLiveStreamWithRealSession(demoStream, realStream);
        expect(merged.hostName).toBe('Sarah Koné');
        expect(merged.hostAvatar).toBe('https://example.com/avatar-demo.jpg');
        expect(merged.coverImage).toBe('https://example.com/cover-demo.jpg');
        expect(merged.tags).toEqual(['#Demo']);
    });

    it('un champ de présentation réellement renseigné en base est conservé', () => {
        const merged = mergeLiveStreamWithRealSession(demoStream, {
            ...realStream,
            hostName: 'Mamadou Diallo',
            tags: ['#Reel'],
        });
        expect(merged.hostName).toBe('Mamadou Diallo');
        expect(merged.tags).toEqual(['#Reel']);
    });
});

describe('shouldStartPanelCollapsed — la vidéo domine le mobile (L3)', () => {
    it('replié sous le point de rupture md', () => {
        expect(shouldStartPanelCollapsed(375)).toBe(true);
        expect(shouldStartPanelCollapsed(767)).toBe(true);
    });

    it('ouvert à partir de md (tablette/desktop)', () => {
        expect(shouldStartPanelCollapsed(768)).toBe(false);
        expect(shouldStartPanelCollapsed(1440)).toBe(false);
    });
});

describe('nextCameraFacing — bascule avant/arrière (loop 7 des appels)', () => {
    it("un simple aller-retour : avant → arrière → avant, jamais un troisième état", () => {
        expect(nextCameraFacing('user')).toBe('environment');
        expect(nextCameraFacing('environment')).toBe('user');
        expect(nextCameraFacing(nextCameraFacing('user'))).toBe('user');
    });
});

describe('port transport — la bascule caméra fait partie du contrat (loop 7)', () => {
    it("LiveKitTransportProvider expose setCameraFacing et refuse HONNÊTEMENT avant connect()", async () => {
        // Import dynamique : livekit-client est chargé mais aucune room n'est
        // ouverte — on vérifie le contrat d'erreur claire, jamais un no-op
        // silencieux qui ferait croire à une bascule réussie.
        const { LiveKitTransportProvider } = await import('../services/live/liveKitTransportProvider');
        const provider = new LiveKitTransportProvider();
        expect(typeof provider.setCameraFacing).toBe('function');
        await expect(provider.setCameraFacing('environment')).rejects.toThrow(/avant connect/);
    });
});
