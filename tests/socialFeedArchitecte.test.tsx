import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests G3/G4 (Équipe 3, mission Architecte) — le fil social comme écran
 * porteur du bus de capacités.
 *
 *   - G4(b) : une action vocale visant un profil de DÉMONSTRATION
 *     (MOCK_MEMBERS, id non-UUID, aucune ligne réelle dans `profiles`) est
 *     refusée avec un message honnête — plus jamais un ok:true sans écriture
 *     en base ;
 *   - G3 : `live.session.create` crée réellement un direct NON programmé et
 *     l'ouvre (onOpenLive), par le même chemin que la modale de création ;
 *   - G1→G3 : une intention posée AVANT le montage du fil (« ouvre le fil
 *     social et lance un live ») est reprise UNE seule fois au montage,
 *     confirmée, exécutée, et son résultat réel est publié.
 */

vi.mock('../services/aiGateway', () => ({
    generateJSON: vi.fn(async () => null),
    generateText: vi.fn(async () => ''),
    analyzeImage: vi.fn(async () => ''),
}));

// Supabase volontairement NON configuré : les membres affichés sont les
// profils de démonstration (MOCK_MEMBERS), et la retentative serveur de la
// résolution de nom échoue proprement (null) — le cas exact du test G4.
vi.mock('../services/supabaseClient', () => {
    const base: Record<string, unknown> = { isConfigured: () => false };
    const service = new Proxy(base, {
        get(target, prop: string) {
            if (prop in target) return target[prop];
            return async () => [];
        },
    });
    return { supabaseService: service, isSupabaseConfigured: false, supabase: {} };
});

vi.mock('../services/cloud', () => ({
    cloudService: {
        getAllPosts: async () => [],
        savePost: async () => {},
        replaceAllPosts: async () => {},
    },
}));

vi.mock('../services/pwaService', () => ({ checkNetworkStatus: () => true }));

const speak = vi.fn();
vi.mock('../hooks/useVoiceAssistant', () => ({
    useVoiceAssistant: () => ({
        isListening: false,
        isSpeaking: false,
        isSupported: true,
        volume: 0,
        transcript: '',
        error: null,
        startListening: vi.fn(async () => true),
        stopListening: vi.fn(),
        speak,
        stopSpeaking: vi.fn(),
        setConversationalMode: vi.fn(),
    }),
}));

const PROFIL_TEST = {
    id: 'test-user',
    name: 'Testeur MokNet',
    avatarUrl: 'https://example.com/a.png',
    role: 'user',
    level: 3,
    credits: 10,
};
vi.mock('../contexts/GlobalContext', () => ({
    useGlobal: () => ({
        userProfile: PROFIL_TEST,
        isSupabaseConnected: false,
        updateUserProfile: vi.fn(),
    }),
}));

// Écrans enfants lourds : hors sujet ici — un test du pont d'exécution ne
// doit dépendre ni de la caméra, ni des visionneuses, ni de leurs services.
vi.mock('../components/ReelsCreator', () => ({ ReelsCreator: () => null }));
vi.mock('../components/SmartReelViewer', () => ({ SmartReelViewer: () => null }));
vi.mock('../components/UniversalCreator', () => ({ UniversalCreator: () => null }));
vi.mock('../components/AIPostAssistantModal', () => ({ AIPostAssistantModal: () => null }));
vi.mock('../components/MemberProfileModal', () => ({ MemberProfileModal: () => null }));
vi.mock('../components/StoryViewerModal', () => ({ StoryViewerModal: () => null }));
vi.mock('../components/LiveCreationModal', () => ({ LiveCreationModal: () => null }));
vi.mock('../components/LiveReplayModal', () => ({ LiveReplayModal: () => null }));
vi.mock('../components/ui/ShareButton', () => ({ ShareButton: () => null }));
vi.mock('../components/growth/GrowthDashboard', () => ({ GrowthDashboard: () => null }));

import { SocialFeed } from '../components/SocialFeed';
import {
    executeCapability,
    listExecutableCapabilityIds,
    subscribeToDeferredOutcomes,
    type DeferredCapabilityOutcome,
} from '../services/architecte/capabilityBus';
import {
    clearSession,
    getPendingCapabilityIntent,
    setPendingCapabilityIntent,
} from '../services/architecte/architecteSession';

function monterFeed() {
    const onOpenLive = vi.fn();
    const utils = render(<SocialFeed onOpenLive={onOpenLive} onOpenDirectChat={vi.fn()} />);
    return { onOpenLive, ...utils };
}

beforeEach(() => {
    vi.clearAllMocks();
    clearSession(); // vide aussi l'intention en attente
});

describe('G4 — anti-faux-succès sur les profils de démonstration', () => {
    it('une demande d\'ami vers un membre MOCK est refusée honnêtement (failed + message dédié)', async () => {
        monterFeed();
        await waitFor(() => expect(listExecutableCapabilityIds()).toContain('social.friend.request'));

        let res: Awaited<ReturnType<typeof executeCapability>>;
        await act(async () => {
            // « Sarah Koné » n'existe que dans MOCK_MEMBERS (id 'u2', non-UUID).
            res = await executeCapability('social.friend.request', { memberName: 'Sarah Koné' });
        });

        expect(res!.status).toBe('failed');
        expect(res!.message).toContain('profil de démonstration');
        expect(res!.message).toContain('pas à un vrai compte');
    });

    it('un nom introuvable (même après la retentative serveur) reste un échec explicite', async () => {
        monterFeed();
        await waitFor(() => expect(listExecutableCapabilityIds()).toContain('social.follow.start'));

        let res: Awaited<ReturnType<typeof executeCapability>>;
        await act(async () => {
            res = await executeCapability('social.follow.start', { memberName: 'Personne Inexistante Xyz' });
        });

        expect(res!.status).toBe('failed');
        expect(res!.message).toContain('Je ne trouve personne');
    });
});

describe('G3 — live.session.create depuis le fil social', () => {
    it('crée un direct NON programmé avec le titre énoncé et l\'ouvre réellement (onOpenLive)', async () => {
        const { onOpenLive } = monterFeed();
        await waitFor(() => expect(listExecutableCapabilityIds()).toContain('live.session.create'));

        let res: Awaited<ReturnType<typeof executeCapability>>;
        await act(async () => {
            res = await executeCapability('live.session.create', { title: 'Mon direct test' });
        });

        expect(res!.status).toBe('done');
        expect(res!.message).toContain('Mon direct test');
        expect(onOpenLive).toHaveBeenCalledTimes(1);
        const [liveId, live] = onOpenLive.mock.calls[0];
        expect(liveId).toBe(live.id);
        expect(live.title).toBe('Mon direct test');
        expect(live.isScheduled).toBe(false);
        expect(live.hostName).toBe('Testeur MokNet');
    });

    it('sans titre énoncé : titre horodaté par défaut, jamais un refus', async () => {
        const { onOpenLive } = monterFeed();
        await waitFor(() => expect(listExecutableCapabilityIds()).toContain('live.session.create'));

        let res: Awaited<ReturnType<typeof executeCapability>>;
        await act(async () => {
            res = await executeCapability('live.session.create', {});
        });

        expect(res!.status).toBe('done');
        expect(onOpenLive).toHaveBeenCalledTimes(1);
        expect(onOpenLive.mock.calls[0][1].title).toContain('Live de Testeur MokNet');
    });
});

describe('G1→G3 — reprise d\'une intention posée AVANT le montage du fil', () => {
    it('confirmée puis exécutée UNE seule fois au montage, résultat réel publié', async () => {
        const outcomes: DeferredCapabilityOutcome[] = [];
        const off = subscribeToDeferredOutcomes((o) => outcomes.push(o));
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        setPendingCapabilityIntent({
            capabilityId: 'live.session.create',
            payload: { title: 'Direct du soir' },
            announced: true,
        });

        const { onOpenLive } = monterFeed();

        await waitFor(() => expect(outcomes.length).toBe(1));
        // Confirmation posée (risque moderate) AVANT toute création.
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(outcomes[0].capabilityId).toBe('live.session.create');
        expect(outcomes[0].status).toBe('done');
        expect(outcomes[0].message).toContain('Direct du soir');
        expect(onOpenLive).toHaveBeenCalledTimes(1);
        expect(onOpenLive.mock.calls[0][1].title).toBe('Direct du soir');
        // Consommée : plus d'intention, et les rendus suivants ne relancent rien.
        expect(getPendingCapabilityIntent()).toBeNull();
        await new Promise((r) => setTimeout(r, 30));
        expect(onOpenLive).toHaveBeenCalledTimes(1);
        off();
    });

    it('confirmation refusée : rien n\'est créé, issue `cancelled` honnête', async () => {
        const outcomes: DeferredCapabilityOutcome[] = [];
        const off = subscribeToDeferredOutcomes((o) => outcomes.push(o));
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        setPendingCapabilityIntent({ capabilityId: 'live.session.create', payload: { title: 'Jamais' }, announced: true });

        const { onOpenLive } = monterFeed();

        await waitFor(() => expect(outcomes.length).toBe(1));
        expect(outcomes[0].status).toBe('cancelled');
        expect(onOpenLive).not.toHaveBeenCalled();
        expect(getPendingCapabilityIntent()).toBeNull();
        off();
    });
});
