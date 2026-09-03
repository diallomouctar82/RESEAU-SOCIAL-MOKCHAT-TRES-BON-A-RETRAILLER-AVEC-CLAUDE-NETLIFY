import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mission VF (appels) — flux de sonnerie, pré-connexion et push, testés sur
 * les VRAIS composants (ChatCallModal, MoocChatFloating) : le transport
 * LiveKit est un double qui expose les options reçues et l'activation
 * différée, le service de sonnerie un enregistreur d'appels, le client
 * Supabase un double qui capture l'abonnement aux signaux. Ce qui est
 * vérifié est la logique réelle des composants :
 *  - VF-2 : sonnerie arrêtée AU décroché, avant l'activation du micro ;
 *    `call_accepted` arrête le retour d'appel côté appelant ; `call_handled_elsewhere`
 *    (signal Supabase ou canal inter-onglets) ferme sans « appel manqué » ;
 *    démontage = silence ;
 *  - VF-3 : transport activé dès la sonnerie — SANS publication chez
 *    l'appelé, avec micro (+ caméra) chez l'appelant ; média distant jamais
 *    rendu avant le décroché ; badge de latence après la première voix ;
 *  - VF-1 : push relayé par le service worker = même traitement qu'une
 *    invitation ; déduplication par callId ; action de notification périmée
 *    → « Cet appel a expiré. » ; lancement par notification ; notification
 *    système via le service worker (jamais le constructeur qui jette sur
 *    mobile) ; annulation/expiration → push « appel manqué ».
 */

const rig = vi.hoisted(() => {
    const audioTrack = { participantIdentity: 'peer', kind: 'audio', attach: vi.fn(), detach: vi.fn(), setVolume: vi.fn() };
    const videoTrack = { participantIdentity: 'peer', kind: 'video', attach: vi.fn(), detach: vi.fn() };
    return {
        log: [] as string[],
        options: null as any,
        state: { connectionState: 'connected', error: null as string | null, remoteAudio: false, remoteVideoOnly: false, remoteAccount: '33333333-3333-4333-8333-333333333333', mediaError: null as string | null, localAudioPublished: true, reconnectCount: 0 },
        audioTrack,
        videoTrack,
        publishMicrophone: vi.fn(async (_options?: { camera?: boolean }) => {}),
        getAudioStats: vi.fn(async () => ({ at: Date.now(), local: null, remote: [], canPlaybackAudio: true })),
        sendData: vi.fn(async (_payload: Uint8Array, _options?: unknown) => {}),
        stopAll: vi.fn(),
        startRinging: vi.fn(),
        startRingback: vi.fn(),
        notifyCallPush: vi.fn(async () => ({ ok: false, reason: 'no_subscription' })),
        pushHandlers: null as null | { onIncoming: (p: any) => void; onAction: (a: string, p: any) => void },
        launch: null as any,
        service: {
            getConversationsForUser: vi.fn(),
            getBlockedUserIds: vi.fn(),
            subscribeToPresence: vi.fn(),
            subscribeToCallSignals: vi.fn(),
            sendCallSignal: vi.fn<(toUserId: string, signal: any) => Promise<void>>(async () => {}),
            notifyMissedCall: vi.fn<(calleeId: string) => Promise<void>>(async () => {}),
            recordSelfNotification: vi.fn(async () => {}),
            getConversationMessages: vi.fn(),
            markConversationRead: vi.fn(),
            subscribeToChat: vi.fn(),
            subscribeToTyping: vi.fn(),
            subscribeToIncomingMessages: vi.fn(),
            isConfigured: vi.fn(() => true),
            sendTypingSignal: vi.fn(),
            getProfile: vi.fn(async () => null),
        },
    };
});

vi.mock('../hooks/useLiveTransport', () => ({
    useLiveTransport: (opts: any) => {
        rig.options = opts;
        return {
            connectionState: rig.state.connectionState,
            error: rig.state.error,
            connectionQuality: 'good',
            remoteConnectionQuality: 'good',
            sendData: rig.sendData,
            localVideoTrack: null,
            localScreenShareTrack: null,
            localIsSpeaking: false,
            activeSpeakerIds: [],
            // Revue AU-6 : identité PAR APPAREIL (`<compte>::<appareil>`) — le
            // correspondant est reconnu par son compte, jamais par égalité.
            remoteParticipants: rig.state.remoteAudio
                ? [{ participant: { identity: `${rig.state.remoteAccount}::dev1`, name: 'Ivan', isLocal: false, isSpeaking: false, audioEnabled: true, videoEnabled: false, isScreenSharing: false }, audioTrack: rig.audioTrack }]
                : rig.state.remoteVideoOnly
                    ? [{ participant: { identity: `${rig.state.remoteAccount}::dev1`, name: 'Ivan', isLocal: false, isSpeaking: false, audioEnabled: false, videoEnabled: true, isScreenSharing: false }, videoTrack: rig.videoTrack }]
                    : [],
            audioPlaybackBlocked: false,
            startAudio: vi.fn(),
            setCameraEnabled: vi.fn(),
            cameraFacing: 'user',
            switchCamera: vi.fn(),
            setMicrophoneEnabled: vi.fn(),
            publishMicrophone: rig.publishMicrophone,
            mediaError: rig.state.mediaError,
            localAudioPublished: rig.state.localAudioPublished,
            reconnectCount: rig.state.reconnectCount,
            getAudioStats: rig.getAudioStats,
            startScreenShare: vi.fn(),
            stopScreenShare: vi.fn(),
            disconnect: vi.fn(),
            retry: vi.fn(),
        };
    },
}));

vi.mock('../services/calls/ringtoneService', () => ({
    startRinging: rig.startRinging,
    stopRinging: vi.fn(),
    startRingback: rig.startRingback,
    stopRingback: vi.fn(),
    stopAll: rig.stopAll,
    // AU-11 : le composant arme le déverrouillage audio au montage — la
    // doublure doit exposer la fonction, sinon l'appel jette au rendu.
    primeRingtoneAudio: vi.fn(() => () => {}),
    // Mission SN : le panneau « Sonnerie » lit/écrit les réglages de l'appareil.
    getRingPreferences: () => ({ ringtoneEnabled: true, vibrationEnabled: true }),
    setRingPreferences: vi.fn((patch: Record<string, boolean>) => ({ ringtoneEnabled: true, vibrationEnabled: true, ...patch })),
    subscribeRingPreferences: () => () => {},
    canVibrateHere: () => false,
    getRingtones: () => [{ id: 'signature', name: 'Signature MokNet' }],
    getSelectedRingtoneId: () => 'signature',
    previewRingtone: vi.fn(async () => {}),
    stopPreview: vi.fn(),
}));

vi.mock('../services/supabaseClient', () => ({
    supabaseService: rig.service,
    isSupabaseConfigured: true,
}));
vi.mock('../services/adminConfigService', () => ({ adminConfigService: {} }));
/** Mission LT : la préchauffe de la passerelle ne fait jamais d'appel réseau depuis un test DOM. */
vi.mock('../services/aiGateway', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/aiGateway')>();
    return { ...real, warmUpAiGateway: vi.fn(async () => true) };
});
vi.mock('../services/messaging/messagingIntelligence', () => ({
    summarizeConversation: vi.fn(),
    assistRewriteMessage: vi.fn(),
    translateMessageText: vi.fn(),
}));
vi.mock('../services/calls/callPush', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/calls/callPush')>();
    return {
        ...real,
        notifyCallPush: rig.notifyCallPush,
        listenPushCallEvents: (handlers: any) => { rig.pushHandlers = handlers; return () => { rig.pushHandlers = null; }; },
        readPushLaunchParams: () => rig.launch,
    };
});

const { ChatCallModal } = await import('../components/chat/ChatCallModal');
const { MoocChatFloating } = await import('../components/MoocChatFloating');
const { decodeCallData, encodeCallData } = await import('../services/messaging/speechLanguage');

const ME = '11111111-1111-4111-8111-111111111111';
const CALLER = '33333333-3333-4333-8333-333333333333';
const CONV = '22222222-2222-4222-8222-222222222222';

const me = { id: ME, name: 'Amina', email: 'amina@example.invalid', avatarUrl: '/amina.png', role: 'citizen', preferredLanguage: null } as any;

const baseSession = {
    callId: 'call-1',
    conversationId: CONV,
    type: 'audio' as const,
    initiatorId: CALLER,
    initiatorName: 'Ivan',
    initiatorAvatar: '/ivan.png',
    receiverId: ME,
    receiverName: 'Amina',
    receiverAvatar: '/amina.png',
    status: 'ringing' as const,
    durationSeconds: 0,
};

const invitation = { type: 'call_invitation', callId: 'call-1', conversationId: CONV, callType: 'audio', callerId: CALLER, callerName: 'Ivan', callerAvatar: '/ivan.png' };

const remoteConversation = {
    id: CONV,
    is_group: false,
    title: null,
    last_message_preview: '',
    last_message_at: null,
    unread_count: 0,
    conversation_participants: [
        { user_id: ME, profiles: { name: 'Amina', avatar_url: '/amina.png', role: 'citizen' } },
        { user_id: CALLER, profiles: { name: 'Ivan', avatar_url: '/ivan.png', role: 'citizen' } },
    ],
};

/** Canal inter-onglets factice : enregistre les instances et les messages postés. */
class FakeBroadcastChannel {
    static instances: FakeBroadcastChannel[] = [];
    onmessage: ((event: { data: unknown }) => void) | null = null;
    posted: unknown[] = [];
    constructor(public readonly name: string) { FakeBroadcastChannel.instances.push(this); }
    postMessage(data: unknown) { this.posted.push(data); }
    close() {}
}

beforeEach(() => {
    rig.log.length = 0;
    rig.options = null;
    rig.state.connectionState = 'connected';
    rig.state.error = null;
    rig.state.remoteAudio = false;
    rig.state.remoteVideoOnly = false;
    rig.state.remoteAccount = CALLER;
    rig.state.mediaError = null;
    rig.state.localAudioPublished = true;
    rig.state.reconnectCount = 0;
    rig.getAudioStats.mockClear();
    rig.getAudioStats.mockImplementation(async () => ({ at: Date.now(), local: null, remote: [], canPlaybackAudio: true }));
    rig.sendData.mockClear();
    rig.pushHandlers = null;
    rig.launch = null;
    rig.publishMicrophone.mockClear();
    rig.publishMicrophone.mockImplementation(async () => { rig.log.push('publishMicrophone'); });
    rig.stopAll.mockClear();
    rig.stopAll.mockImplementation(() => { rig.log.push('stopAll'); });
    rig.startRinging.mockClear();
    rig.startRingback.mockClear();
    rig.notifyCallPush.mockClear();
    for (const fn of Object.values(rig.service)) (fn as ReturnType<typeof vi.fn>).mockClear();
    rig.service.getConversationsForUser.mockResolvedValue([]);
    rig.service.getBlockedUserIds.mockResolvedValue([]);
    rig.service.subscribeToPresence.mockReturnValue(() => {});
    rig.service.subscribeToCallSignals.mockReturnValue(() => {});
    rig.service.getConversationMessages.mockResolvedValue([]);
    rig.service.markConversationRead.mockResolvedValue(undefined);
    rig.service.subscribeToChat.mockReturnValue(() => {});
    rig.service.subscribeToTyping.mockReturnValue(() => {});
    rig.service.subscribeToIncomingMessages.mockReturnValue(() => {});
    rig.service.getProfile.mockResolvedValue(null);
    FakeBroadcastChannel.instances = [];
    (globalThis as any).BroadcastChannel = FakeBroadcastChannel;
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
    vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
    delete (globalThis as any).BroadcastChannel;
});

const noop = () => {};

describe('ChatCallModal — AU-8 : sur téléphone, l’appel occupe tout l’écran', () => {
    const callCard = (container: HTMLElement) => container.querySelector('[data-testid="call-screen"] > div') as HTMLElement;

    it('la carte d’appel a une hauteur pleine sur téléphone et ne dépend d’aucune proportion en dessous de 640 px', () => {
        const { container } = render(<ChatCallModal callSession={{ ...baseSession, type: 'video', status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        const card = callCard(container);
        expect(card).toBeTruthy();
        // Hauteur pleine sans condition de largeur : plus de bande étroite.
        expect(card.className).toContain('h-full');
        // La proportion et la largeur maximale ne s'appliquent qu'à partir de `sm` (ordinateur).
        expect(card.className).toContain('sm:aspect-square');
        expect(card.className).toContain('sm:max-w-lg');
        // Et surtout : plus aucune proportion en syntaxe Tailwind 4, ignorée par le Tailwind 3 du site.
        expect(/\baspect-\d+\/\d+/.test(card.className)).toBe(false);
    });

    it('la vignette de ma caméra garde une proportion VALIDE (syntaxe à crochets)', () => {
        rig.state.remoteAudio = true;
        const { container } = render(<ChatCallModal callSession={{ ...baseSession, type: 'video', status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        const pip = container.querySelector('[class*="aspect-[3/4]"]') as HTMLElement | null;
        expect(pip).toBeTruthy();
        expect(pip!.className).not.toMatch(/\baspect-3\/4\b/);
    });
});

describe('ChatCallModal — pré-connexion pendant la sonnerie (VF-3) et arrêt net (VF-2)', () => {
    it('appelé qui sonne : transport activé SANS aucune publication, même pour un appel vidéo', () => {
        render(<ChatCallModal callSession={{ ...baseSession, type: 'video' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(rig.options.enabled).toBe(true);
        // AU-12 : une room par APPEL, plus une room permanente par conversation.
        expect(rig.options.roomName).toBe(`call-${CONV}--call-1`);
        expect(rig.options.conversationId).toBe(CONV);
        expect(rig.options.publishAudioOnConnect).toBe(false);
        expect(rig.options.publishVideoOnConnect).toBe(false);
        expect(rig.publishMicrophone).not.toHaveBeenCalled();
        expect(screen.getByText('Appel vidéo entrant…')).toBeTruthy();
        expect(screen.getByText('Ligne prête')).toBeTruthy();
    });

    it('appelant qui sonne : transport activé AVEC micro (+ caméra si vidéo) pendant que ça sonne', () => {
        const { rerender } = render(<ChatCallModal callSession={baseSession} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(rig.options.enabled).toBe(true);
        expect(rig.options.publishAudioOnConnect).toBe(true);
        expect(rig.options.publishVideoOnConnect).toBe(false);
        expect(screen.getByText('Sonnerie en cours…')).toBeTruthy();
        rerender(<ChatCallModal callSession={{ ...baseSession, type: 'video' }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(rig.options.publishVideoOnConnect).toBe(true);
    });

    it('la voix de l’appelant, déjà souscrite pendant la sonnerie, n’est JAMAIS jouée avant le décroché', () => {
        rig.state.remoteAudio = true;
        const { container, rerender } = render(<ChatCallModal callSession={baseSession} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(container.querySelector('audio')).toBeNull();
        expect(rig.audioTrack.attach).not.toHaveBeenCalled();
        rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(container.querySelector('audio')).not.toBeNull();
        expect(rig.audioTrack.attach).toHaveBeenCalled();
    });

    it('décrocher : la sonnerie s’arrête AVANT le signal, puis le micro s’active (activation différée) — jamais l’inverse', async () => {
        const onAcceptCall = vi.fn(() => { rig.log.push('onAcceptCall'); });
        const { rerender } = render(<ChatCallModal callSession={baseSession} localName="Amina" isIncoming onAcceptCall={onAcceptCall} onRejectCall={noop} onEndCall={noop} />);
        fireEvent.click(screen.getByRole('button', { name: 'Décrocher' }));
        expect(rig.log).toEqual(['stopAll', 'onAcceptCall']);
        expect(rig.publishMicrophone).not.toHaveBeenCalled(); // pas de micro tant que le parent n'a pas posé 'connected'

        rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected', acceptedAt: Date.now() }} localName="Amina" isIncoming onAcceptCall={onAcceptCall} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledWith({ camera: false }));
        expect(rig.log.indexOf('publishMicrophone')).toBeGreaterThan(rig.log.lastIndexOf('stopAll'));
        expect(rig.publishMicrophone).toHaveBeenCalledTimes(1);
    });

    it('appel vidéo décroché : micro ET caméra activés', async () => {
        render(<ChatCallModal callSession={{ ...baseSession, type: 'video', status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledWith({ camera: true }));
    });

    it('appelant déjà connecté pendant la sonnerie : rien à réactiver au décroché ; pré-connexion en échec → relance', async () => {
        const { unmount } = render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(rig.stopAll).toHaveBeenCalled();
        expect(rig.publishMicrophone).not.toHaveBeenCalled();
        unmount();

        rig.state.connectionState = 'disconnected';
        rig.state.error = 'jeton refusé';
        render(<ChatCallModal callSession={{ ...baseSession, callId: 'call-2', status: 'connected' }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledWith({ camera: false }));
    });

    it('pré-connexion en échec pendant la sonnerie : message honnête, jamais « Média indisponible » avant le décroché', () => {
        rig.state.connectionState = 'disconnected';
        rig.state.error = 'jeton refusé';
        render(<ChatCallModal callSession={baseSession} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(screen.getByText('Ligne en attente : la connexion sera établie au décroché.')).toBeTruthy();
        expect(screen.queryByText(/Média indisponible/)).toBeNull();
        expect(screen.getByRole('button', { name: 'Décrocher' })).toBeTruthy();
    });

    it('appelant : call_accepted (status connected) arrête le retour d’appel ; première voix distante → silence + badge de latence', async () => {
        rig.state.remoteAccount = ME; // dans baseSession, l'appelant « Ivan » appelle ME (receiverId)
        const { rerender } = render(<ChatCallModal callSession={{ ...baseSession, offerSentAt: Date.now() - 3000 }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(rig.stopAll).not.toHaveBeenCalled();

        rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected', acceptedAt: Date.now() - 400 }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(rig.stopAll).toHaveBeenCalledTimes(1);

        rig.state.remoteAudio = true;
        rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected', acceptedAt: Date.now() - 400 }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.stopAll).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(/^Connecté en /)).toBeTruthy();
        expect(console.info).toHaveBeenCalledWith('[appel] latence', expect.objectContaining({ phase: 'audio', role: 'appelant', acceptToAudioMs: expect.any(Number) }));
    });

    it('refuser et raccrocher arrêtent la sonnerie avant de prévenir le parent ; le démontage aussi', () => {
        const onRejectCall = vi.fn(() => { rig.log.push('onRejectCall'); });
        const { unmount } = render(<ChatCallModal callSession={baseSession} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={onRejectCall} onEndCall={noop} />);
        fireEvent.click(screen.getByRole('button', { name: "Refuser l'appel" }));
        expect(rig.log).toEqual(['stopAll', 'onRejectCall']);

        rig.log.length = 0;
        unmount();
        expect(rig.log).toContain('stopAll');

        const onEndCall = vi.fn(() => { rig.log.push('onEndCall'); });
        rig.log.length = 0;
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={onEndCall} />);
        rig.log.length = 0;
        fireEvent.click(screen.getByRole('button', { name: 'Raccrocher' }));
        expect(rig.log).toEqual(['stopAll', 'onEndCall']);
    });
});

/**
 * Mission AU (audio bidirectionnel) — ce que l'écran d'appel fait quand un
 * sens manque : republier au décroché si mon micro n'est pas RÉELLEMENT
 * publié (quel que soit le rôle), bannière visible + « Réessayer le micro »,
 * état de micro annoncé au correspondant et avis reçu de lui, diagnostic sur
 * compteurs réels, et — côté appelant — média distant pendant la sonnerie =
 * signal d'acceptation perdu → appel connecté.
 */
describe('ChatCallModal — audio bidirectionnel (mission AU)', () => {
    const mediaMessages = () => rig.sendData.mock.calls.map((c) => decodeCallData(c[0] as Uint8Array)).filter((m): m is Extract<NonNullable<ReturnType<typeof decodeCallData>>, { t: 'media' }> => !!m && m.t === 'media');

    it('appelant connecté pendant la sonnerie mais micro NON publié (capture refusée) : republication au décroché', async () => {
        rig.state.localAudioPublished = false;
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledWith({ camera: false }));
    });

    it('micro refusé : bannière visible avec la cause en français, et « Réessayer le micro » relance la publication', async () => {
        rig.state.localAudioPublished = false;
        rig.state.mediaError = 'NotAllowedError: Permission denied';
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledTimes(1));
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Ivan ne vous entend pas');
        expect(alert.textContent).toContain('Le navigateur a refusé l’accès au micro');
        rig.publishMicrophone.mockClear();
        fireEvent.click(screen.getByRole('button', { name: /Réessayer le micro/ }));
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledWith({ camera: false }));
    });

    it('micro publié : aucune bannière, même avec une erreur caméra résiduelle', () => {
        rig.state.mediaError = 'NotFoundError: caméra absente';
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('j’annonce l’état RÉEL de mon micro au correspondant (media on / off / unavailable + raison)', async () => {
        const { rerender } = render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(mediaMessages().at(-1)).toEqual({ t: 'media', v: 1, mic: 'on' }));

        fireEvent.click(screen.getByTitle('Couper micro'));
        await waitFor(() => expect(mediaMessages().at(-1)).toEqual({ t: 'media', v: 1, mic: 'off' }));

        rig.state.localAudioPublished = false;
        rig.state.mediaError = 'NotAllowedError: Permission denied';
        rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(mediaMessages().at(-1)).toMatchObject({ t: 'media', mic: 'unavailable', reason: expect.stringContaining('refusé') }));
    });

    it('le correspondant annonce un micro indisponible → avis honnête à l’écran ; micro coupé → « a coupé son micro »', async () => {
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        act(() => { rig.options.onDataReceived(encodeCallData({ t: 'media', v: 1, mic: 'unavailable', reason: 'permission refusée' })); });
        expect(await screen.findByText(/Ivan n’a pas de micro actif \(permission refusée\)/)).toBeTruthy();
        act(() => { rig.options.onDataReceived(encodeCallData({ t: 'media', v: 1, mic: 'off' })); });
        expect(await screen.findByText('Ivan a coupé son micro.')).toBeTruthy();
        act(() => { rig.options.onDataReceived(encodeCallData({ t: 'media', v: 1, mic: 'on' })); });
        await waitFor(() => expect(screen.queryByText(/micro/i, { selector: '[role="status"] span' })).toBeNull());
    });

    it('diagnostic sur compteurs réels : mesure, puis « Votre voix part / Vous recevez sa voix », journal [appel] média', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            let bytes = 0;
            rig.getAudioStats.mockImplementation(async () => {
                bytes += 1000;
                return { at: Date.now(), local: { muted: false, bytesSent: bytes, packetsSent: bytes / 100, audioLevel: 0.2 }, remote: [{ identity: 'peer', bytesReceived: bytes * 2, packetsReceived: bytes / 50, concealedSamples: 0, audioLevel: 0.1 }], canPlaybackAudio: true };
            });
            rig.state.remoteAudio = true;
            render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
            await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
            const hud = await screen.findByTestId('audio-link-diagnostic');
            expect(hud.textContent).toContain('Micro : mesure…');
            await act(async () => { await vi.advanceTimersByTimeAsync(5100); });
            await waitFor(() => expect(screen.getByTestId('audio-link-diagnostic').textContent).toContain('Votre voix part'));
            expect(screen.getByTestId('audio-link-diagnostic').textContent).toContain('Vous recevez sa voix');
            expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/^\[appel\] média role=appelé envoi=ok réception=ok micro=publié octetsEnvoyés=\d+ pistesDistantes=1 octetsReçus=\d+ lecture=ok$/));
        } finally {
            vi.useRealTimers();
        }
    });

    it('diagnostic : rien ne part → « Votre voix ne part pas » reste visible', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            rig.getAudioStats.mockImplementation(async () => ({ at: Date.now(), local: { muted: false, bytesSent: 500, packetsSent: 5, audioLevel: 0 }, remote: [], canPlaybackAudio: true }));
            render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
            await act(async () => { await vi.advanceTimersByTimeAsync(6800); });
            await waitFor(() => expect(screen.getByTestId('audio-link-diagnostic').textContent).toContain('Votre voix ne part pas'));
            expect(screen.getByTestId('audio-link-diagnostic').textContent).toContain('Pas encore de micro en face');
            expect(screen.getByTestId('audio-link-diagnostic').className).toContain('opacity-100');
        } finally {
            vi.useRealTimers();
        }
    });

    it('appelant en sonnerie : la voix du correspondant arrive → onRemoteMediaStarted (signal call_accepted perdu) ; jamais chez l’appelé', () => {
        rig.state.remoteAudio = true;
        rig.state.remoteAccount = ME;
        const onRemoteMediaStarted = vi.fn();
        const { unmount } = render(<ChatCallModal callSession={baseSession} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} onRemoteMediaStarted={onRemoteMediaStarted} />);
        expect(onRemoteMediaStarted).toHaveBeenCalledTimes(1);
        unmount();
        onRemoteMediaStarted.mockClear();
        rig.state.remoteAccount = CALLER;
        render(<ChatCallModal callSession={baseSession} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} onRemoteMediaStarted={onRemoteMediaStarted} />);
        expect(onRemoteMediaStarted).not.toHaveBeenCalled();
    });

    it('revue AU-6 : seul le compte du CORRESPONDANT connecte l’appel — un autre appareil de MON compte ou un inconnu est ignoré ; une caméra seule (micro refusé) suffit', () => {
        const onRemoteMediaStarted = vi.fn();
        rig.state.remoteAudio = true;
        rig.state.remoteAccount = CALLER; // dans baseSession, l'appelant (isIncoming=false) est Ivan = CALLER : un participant de MON compte
        const { unmount } = render(<ChatCallModal callSession={baseSession} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} onRemoteMediaStarted={onRemoteMediaStarted} />);
        expect(onRemoteMediaStarted).not.toHaveBeenCalled();
        unmount();
        rig.state.remoteAccount = '99999999-9999-4999-8999-999999999999'; // inconnu
        const r2 = render(<ChatCallModal callSession={baseSession} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} onRemoteMediaStarted={onRemoteMediaStarted} />);
        expect(onRemoteMediaStarted).not.toHaveBeenCalled();
        r2.unmount();
        rig.state.remoteAudio = false;
        rig.state.remoteVideoOnly = true;
        rig.state.remoteAccount = ME;
        render(<ChatCallModal callSession={{ ...baseSession, type: 'video' }} localName="Ivan" isIncoming={false} onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} onRemoteMediaStarted={onRemoteMediaStarted} />);
        expect(onRemoteMediaStarted).toHaveBeenCalledTimes(1);
    });

    it('revue AU-6 : correspondant parti de la room depuis 25 s pendant un appel connecté → fin d’appel (onPeerLost) ; jamais s’il n’est pas encore arrivé', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        try {
            const onPeerLost = vi.fn();
            const onEndCall = vi.fn();
            // Appelé en attente : l'appelant n'a pas encore rejoint → pas de fin d'appel.
            const { rerender, unmount } = render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={onEndCall} onPeerLost={onPeerLost} />);
            await act(async () => { await vi.advanceTimersByTimeAsync(26000); });
            expect(onPeerLost).not.toHaveBeenCalled();
            // Il arrive, puis disparaît : 25 s après, l'appel se termine.
            rig.state.remoteAudio = true;
            rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={onEndCall} onPeerLost={onPeerLost} />);
            rig.state.remoteAudio = false;
            rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={onEndCall} onPeerLost={onPeerLost} />);
            await act(async () => { await vi.advanceTimersByTimeAsync(24000); });
            expect(onPeerLost).not.toHaveBeenCalled();
            await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
            expect(onPeerLost).toHaveBeenCalledTimes(1);
            expect(onEndCall).not.toHaveBeenCalled();
            unmount();
        } finally {
            vi.useRealTimers();
        }
    });

    it('revue AU-6 : « micro en cours d’activation » n’est PAS annoncé comme indisponible ; l’erreur CAMÉRA seule est expliquée en appel vidéo', async () => {
        rig.state.localAudioPublished = false;
        const { rerender } = render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalled());
        expect(mediaMessages()).toEqual([]); // rien tant que la demande est en vol sans erreur
        expect(screen.queryByRole('alert')).toBeNull();
        rig.state.localAudioPublished = true;
        rig.state.mediaError = 'NotFoundError: Requested device not found';
        rerender(<ChatCallModal callSession={{ ...baseSession, status: 'connected', type: 'video' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        await waitFor(() => expect(mediaMessages().at(-1)).toEqual({ t: 'media', v: 1, mic: 'on' }));
        expect(screen.queryByRole('alert')).toBeNull(); // micro OK : pas de bannière rouge
        expect(screen.getByText(/Caméra indisponible : Aucune caméra détectée/)).toBeTruthy();
    });

    it('revue AU-6 : « Réessayer le micro » sans ligne vivante → « Reconnexion… », bouton en attente', () => {
        rig.state.localAudioPublished = false;
        rig.state.connectionState = 'connecting';
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toContain('Reconnexion de la ligne et activation du micro…');
        expect((screen.getByRole('button', { name: /Reconnexion…/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('identité par appareil transmise au transport (deviceId), et le correspondant est celui qui publie du média', () => {
        render(<ChatCallModal callSession={{ ...baseSession, status: 'connected' }} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        // Mission LT : identité de SESSION = appareil stable (localStorage) + suffixe propre à l'onglet.
        expect(rig.options.deviceId).toMatch(/^[a-z0-9]{8,27}-[a-z0-9]{4}$/);
        const stable = window.localStorage.getItem('moknet_call_device_id');
        expect(stable).toMatch(/^[a-z0-9]{8,32}$/);
        expect(rig.options.deviceId.startsWith(`${stable}-`)).toBe(true);
    });
});

describe('MoocChatFloating — signaux, multi-appareils (VF-2) et push (VF-1)', () => {
    const renderChat = async (props: Record<string, unknown> = {}) => {
        const utils = render(<MoocChatFloating currentUser={me} {...props} />);
        await waitFor(() => expect(rig.service.subscribeToCallSignals).toHaveBeenCalled());
        const signal = rig.service.subscribeToCallSignals.mock.calls[0][1] as (s: any) => void;
        return { ...utils, signal: (s: any) => act(() => { signal(s); }) };
    };

    const signalCalls = (type: string): [string, any][] => rig.service.sendCallSignal.mock.calls.filter((c) => c[1]?.type === type);

    it('invitation → sonnerie ; décrocher → call_accepted à l’appelant, call_handled_elsewhere à MES appareils, push d’annulation, nom de l’APPELANT affiché', async () => {
        const { signal } = await renderChat();
        signal(invitation);
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        expect(rig.startRinging).toHaveBeenCalled();
        expect(rig.options.publishAudioOnConnect).toBe(false);

        fireEvent.click(screen.getByRole('button', { name: 'Décrocher' }));

        await waitFor(() => expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull());
        expect(signalCalls('call_accepted')).toEqual([[CALLER, { type: 'call_accepted', callId: 'call-1', conversationId: CONV }]]);
        expect(signalCalls('call_handled_elsewhere')).toEqual([[ME, { type: 'call_handled_elsewhere', callId: 'call-1', conversationId: CONV, reason: 'answered' }]]);
        expect(rig.notifyCallPush).toHaveBeenCalledWith({ topic: 'call_cancelled', targetUserId: ME, callId: 'call-1', payload: { reason: 'answered' } });
        expect(FakeBroadcastChannel.instances[0].posted).toEqual([{ type: 'call_handled_elsewhere', callId: 'call-1' }]);
        // L'appelé reste « l'appelé » : c'est bien Ivan qu'il voit, pas son propre nom (ancien défaut).
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
        expect(rig.options.publishAudioOnConnect).toBe(false);
        await waitFor(() => expect(rig.publishMicrophone).toHaveBeenCalledWith({ camera: false }));
        expect(rig.log.indexOf('publishMicrophone')).toBeGreaterThan(rig.log.lastIndexOf('stopAll'));

        // Une invitation en double (broadcast après push, ou rejouée) ne fait jamais re-sonner un appel déjà pris.
        signal(invitation);
        expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull();
    });

    it('mission AU — appel sortant : la voix de l’appelé arrive sans call_accepted → appel connecté, retour d’appel coupé', async () => {
        rig.service.getConversationsForUser.mockResolvedValue([remoteConversation]);
        const { rerender } = await renderChat({ activeConversationId: CONV });
        fireEvent.click(await screen.findByTitle('Appel Audio'));
        expect(await screen.findByText('Sonnerie en cours…')).toBeTruthy();
        rig.stopAll.mockClear();

        rig.state.remoteAudio = true;
        rerender(<MoocChatFloating currentUser={me} activeConversationId={CONV} />);
        await waitFor(() => expect(screen.queryByText('Sonnerie en cours…')).toBeNull());
        expect(rig.stopAll).toHaveBeenCalled();
        expect(signalCalls('call_accepted')).toEqual([]); // c'est l'appelé qui accepte ; ici seul son média a parlé
        expect(screen.getByRole('button', { name: 'Raccrocher' })).toBeTruthy();
    });

    it('call_handled_elsewhere (signal Supabase) pour l’appel qui sonne ici → silence et fermeture, sans « appel manqué »', async () => {
        const { signal } = await renderChat();
        signal(invitation);
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        rig.stopAll.mockClear();

        signal({ type: 'call_handled_elsewhere', callId: 'call-1', conversationId: CONV, reason: 'answered' });
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull());
        expect(rig.stopAll).toHaveBeenCalled();
        expect(rig.service.notifyMissedCall).not.toHaveBeenCalled();
        expect(rig.service.recordSelfNotification).not.toHaveBeenCalled();
        expect(signalCalls('call_rejected')).toEqual([]);
        expect(signalCalls('call_ended')).toEqual([]);
    });

    it('call_handled_elsewhere pour un AUTRE appel, ou reçu alors que j’ai déjà décroché ici → ignoré', async () => {
        const { signal } = await renderChat();
        signal(invitation);
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        signal({ type: 'call_handled_elsewhere', callId: 'call-autre' });
        expect(screen.getByRole('button', { name: 'Décrocher' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Décrocher' }));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull());
        signal({ type: 'call_handled_elsewhere', callId: 'call-1' }); // écho de mon propre signal
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
    });

    it('call_handled_elsewhere via le canal inter-onglets → même fermeture silencieuse', async () => {
        const { signal } = await renderChat();
        signal(invitation);
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        const channel = FakeBroadcastChannel.instances[0];
        expect(channel.name).toBe('moknet-calls');
        act(() => { channel.onmessage?.({ data: { type: 'call_handled_elsewhere', callId: 'call-1' } }); });
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull());
        expect(rig.service.notifyMissedCall).not.toHaveBeenCalled();
    });

    it('refuser → call_rejected à l’appelant + call_handled_elsewhere (motif rejected) à mes appareils', async () => {
        const { signal } = await renderChat();
        signal(invitation);
        fireEvent.click(await screen.findByRole('button', { name: "Refuser l'appel" }));
        await waitFor(() => expect(screen.queryByRole('button', { name: "Refuser l'appel" })).toBeNull());
        expect(signalCalls('call_rejected')).toEqual([[CALLER, { type: 'call_rejected', callId: 'call-1', conversationId: CONV }]]);
        expect(signalCalls('call_handled_elsewhere')[0][1]).toMatchObject({ reason: 'rejected' });
        expect(rig.notifyCallPush).toHaveBeenCalledWith({ topic: 'call_cancelled', targetUserId: ME, callId: 'call-1', payload: { reason: 'rejected' } });
    });

    it('appel sortant : push incoming_call en tâche de fond ; call_accepted arrête le retour d’appel ; annulation avant décroché → push « manqué »', async () => {
        rig.service.getConversationsForUser.mockResolvedValue([remoteConversation]);
        const { signal } = await renderChat({ activeConversationId: CONV });
        fireEvent.click(await screen.findByTitle('Appel Audio'));

        expect(await screen.findByText('Sonnerie en cours…')).toBeTruthy();
        expect(rig.startRingback).toHaveBeenCalled();
        expect(rig.options.enabled).toBe(true);
        expect(rig.options.publishAudioOnConnect).toBe(true);
        const [, offer] = signalCalls('call_invitation')[0];
        expect(offer).toMatchObject({ type: 'call_invitation', conversationId: CONV, callType: 'audio', callerId: ME, callerName: 'Amina' });
        expect(rig.notifyCallPush).toHaveBeenCalledWith({ topic: 'incoming_call', targetUserId: CALLER, conversationId: CONV, callId: offer.callId, payload: { callType: 'audio' } });

        rig.stopAll.mockClear();
        signal({ type: 'call_accepted', callId: offer.callId });
        expect(rig.stopAll).toHaveBeenCalled();
        await waitFor(() => expect(screen.queryByText('Sonnerie en cours…')).toBeNull());
        expect(rig.publishMicrophone).not.toHaveBeenCalled(); // déjà publié pendant la sonnerie : rien à réactiver

        // Deuxième appel, annulé par l'appelant avant le décroché.
        fireEvent.click(screen.getByRole('button', { name: 'Raccrocher' }));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Raccrocher' })).toBeNull());
        fireEvent.click(await screen.findByTitle('Appel Audio'));
        expect(await screen.findByText('Sonnerie en cours…')).toBeTruthy();
        const [, secondOffer] = signalCalls('call_invitation')[1];
        rig.notifyCallPush.mockClear();
        fireEvent.click(screen.getByRole('button', { name: 'Raccrocher' }));
        await waitFor(() => expect(screen.queryByText('Sonnerie en cours…')).toBeNull());
        expect(rig.service.notifyMissedCall).toHaveBeenCalledWith(CALLER);
        expect(rig.notifyCallPush).toHaveBeenCalledWith({ topic: 'call_cancelled', targetUserId: CALLER, conversationId: CONV, callId: secondOffer.callId, payload: { reason: 'missed' } });
    });

    it('push incoming_call relayé par le service worker (frais, non vu, aucun appel actif) → même écran qu’une invitation', async () => {
        await renderChat();
        expect(rig.pushHandlers).not.toBeNull();
        const payload = { v: 1, type: 'incoming_call', ts: Date.now() - 2000, callId: 'call-push', conversationId: CONV, from: { id: CALLER, name: 'Ivan', avatarUrl: '/ivan.png' }, callType: 'video', reason: null };
        act(() => { rig.pushHandlers!.onIncoming(payload); });
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        expect(screen.getByText('Appel vidéo entrant…')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
        expect(rig.startRinging).toHaveBeenCalledTimes(1);

        // Le même push rejoué, ou un push périmé, n'ouvre rien de plus.
        act(() => { rig.pushHandlers!.onIncoming({ ...payload, callId: 'call-vieux', ts: Date.now() - 60_000 }); });
        expect(screen.getAllByRole('button', { name: 'Décrocher' })).toHaveLength(1);

        // call_cancelled (appelant qui raccroche, ou mon autre appareil) → fermeture silencieuse.
        act(() => { rig.pushHandlers!.onIncoming({ ...payload, type: 'call_cancelled', reason: 'missed', ts: Date.now() }); });
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull());
        expect(rig.service.notifyMissedCall).not.toHaveBeenCalled();
    });

    it('action « Décrocher » de la notification : appel frais sans écran → accepté directement ; appel périmé → « Cet appel a expiré. »', async () => {
        await renderChat();
        const payload = { v: 1, type: 'incoming_call', ts: Date.now() - 1000, callId: 'call-action', conversationId: CONV, from: { id: CALLER, name: 'Ivan', avatarUrl: null }, callType: 'audio', reason: null };
        act(() => { rig.pushHandlers!.onAction('accept', payload); });
        await waitFor(() => expect(signalCalls('call_accepted')).toEqual([[CALLER, { type: 'call_accepted', callId: 'call-action', conversationId: CONV }]]));
        expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull();
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Raccrocher' }));
        await waitFor(() => expect(screen.queryByRole('button', { name: 'Raccrocher' })).toBeNull());

        act(() => { rig.pushHandlers!.onAction('accept', { ...payload, callId: 'call-perime', ts: Date.now() - 45_000 }); });
        expect(await screen.findByText('Cet appel a expiré.')).toBeTruthy();
        expect(signalCalls('call_accepted')).toHaveLength(1);
    });

    it('SN-2b : corps de la notification touché (« open ») sur un appel frais sans écran → l’écran d’appel SONNE (Décrocher visible), rien n’est accepté à l’aveugle', async () => {
        await renderChat();
        const payload = { v: 1, type: 'incoming_call', ts: Date.now() - 1500, callId: 'call-open', conversationId: CONV, from: { id: CALLER, name: 'Ivan', avatarUrl: null }, callType: 'audio', reason: null };
        act(() => { rig.pushHandlers!.onAction('open', payload); });
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        expect(screen.getByRole('button', { name: "Refuser l'appel" })).toBeTruthy();
        expect(screen.getByText('Appel audio entrant…')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
        expect(rig.startRinging).toHaveBeenCalledTimes(1);
        expect(signalCalls('call_accepted')).toEqual([]);
        // L'écran d'appel passe au-dessus de TOUT (boîtes de dialogue du LIVE comprises).
        expect(screen.getByTestId('call-screen').className).toContain('z-[400]');

        // Le même « open » rejoué n'ouvre pas un second écran ; un appel périmé n'en ouvre aucun.
        act(() => { rig.pushHandlers!.onAction('open', payload); });
        act(() => { rig.pushHandlers!.onAction('open', { ...payload, callId: 'call-open-vieux', ts: Date.now() - 50_000 }); });
        expect(screen.getAllByRole('button', { name: 'Décrocher' })).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: 'Décrocher' }));
        await waitFor(() => expect(signalCalls('call_accepted')).toEqual([[CALLER, { type: 'call_accepted', callId: 'call-open', conversationId: CONV }]]));
    });

    it('SN-2b : lancement par le corps de la notification (« open », fenêtre fermée) → conversation ouverte ET écran d’appel qui sonne, avec le nom réel de l’appelant', async () => {
        rig.service.getConversationsForUser.mockResolvedValue([remoteConversation]);
        rig.launch = { action: 'open', type: 'incoming_call', callId: 'call-launch-open', conversationId: CONV, fromUserId: CALLER, callType: 'video', ts: Date.now() - 3000 };
        await renderChat();
        expect(await screen.findByRole('button', { name: 'Décrocher' })).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
        expect(screen.getByText('Appel vidéo entrant…')).toBeTruthy(); // mise en page vidéo : l'appel entrant est nommé, pas « en attente de l'image »
        expect(screen.getByTitle('Appel Audio')).toBeTruthy(); // la conversation est ouverte derrière l'écran d'appel
        expect(signalCalls('call_accepted')).toEqual([]);
        expect(rig.startRinging).toHaveBeenCalled();
    });

    it('lancement par la notification (fenêtre fermée) : conversation ouverte, appel frais accepté avec le nom réel de l’appelant', async () => {
        rig.service.getConversationsForUser.mockResolvedValue([remoteConversation]);
        rig.launch = { action: 'accept', type: 'incoming_call', callId: 'call-launch', conversationId: CONV, fromUserId: CALLER, callType: 'audio', ts: Date.now() - 3000 };
        await renderChat();
        await waitFor(() => expect(signalCalls('call_accepted')).toEqual([[CALLER, { type: 'call_accepted', callId: 'call-launch', conversationId: CONV }]]));
        expect(screen.getByRole('heading', { name: 'Ivan' })).toBeTruthy();
        expect(screen.getByTitle('Appel Audio')).toBeTruthy(); // la conversation est ouverte derrière l'écran d'appel
        expect(signalCalls('call_handled_elsewhere')).toHaveLength(1);
    });

    it('lancement par la notification avec un appel périmé → message honnête, aucun signal', async () => {
        rig.service.getConversationsForUser.mockResolvedValue([remoteConversation]);
        rig.launch = { action: 'accept', type: 'incoming_call', callId: 'call-late', conversationId: CONV, fromUserId: CALLER, callType: 'audio', ts: Date.now() - 90_000 };
        await renderChat();
        expect(await screen.findByText('Cet appel a expiré.')).toBeTruthy();
        expect(signalCalls('call_accepted')).toEqual([]);
        expect(screen.queryByRole('button', { name: 'Décrocher' })).toBeNull();
    });

    it('onglet caché : la notification système passe par le service worker (jamais le constructeur, qui jette sur mobile)', async () => {
        const showNotification = vi.fn(async () => {});
        const construct = vi.fn();
        class FakeNotification { static permission = 'granted'; static requestPermission = vi.fn(); constructor(...args: unknown[]) { construct(...args); } }
        (globalThis as any).Notification = FakeNotification;
        Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { getRegistration: async () => ({ showNotification }), addEventListener: () => {}, removeEventListener: () => {} } });
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        try {
            const { signal } = await renderChat();
            signal(invitation);
            await waitFor(() => expect(showNotification).toHaveBeenCalledTimes(1));
            const [title, options] = showNotification.mock.calls[0] as unknown as [string, any];
            expect(title).toBe('Appel audio entrant');
            expect(options).toMatchObject({ body: 'Ivan vous appelle sur MokNet', tag: 'moknet-incoming-call' });
            expect(options.actions).toEqual([{ action: 'accept', title: 'Décrocher' }, { action: 'reject', title: 'Refuser' }]);
            expect(options.data).toMatchObject({ v: 1, type: 'incoming_call', callId: 'call-1', conversationId: CONV, from: { id: CALLER, name: 'Ivan' }, callType: 'audio' });
            expect(construct).not.toHaveBeenCalled();
        } finally {
            delete (globalThis as any).Notification;
            Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
            Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        }
    });
});

/**
 * AU-13 — la ligne qui se rétablit EN BOUCLE doit être NOMMÉE à l'écran.
 *
 * Motif relevé sur les rapports de diagnostic de deux vrais appareils
 * (public.call_diagnostics, 02/09/2026) : une reconnexion complète toutes les
 * ~16 s, des deux côtés, chacune coupant le son. L'écran n'affichait alors que
 * « Micro non publié » — et l'utilisateur en concluait, à tort, que son
 * téléphone était en cause.
 */
describe('ChatCallModal — ligne qui se rétablit en boucle (AU-13)', () => {
    const connected = { ...baseSession, status: 'connected' as const };

    it('deux rétablissements : rien ne s’affiche (un changement de réseau réel en produit autant)', () => {
        rig.state.reconnectCount = 2;
        render(<ChatCallModal callSession={connected} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(screen.queryByTestId('line-flapping-notice')).toBeNull();
    });

    it('trois rétablissements : l’écran dit que c’est la LIGNE, pas le micro, et donne le compte réel', () => {
        rig.state.reconnectCount = 3;
        render(<ChatCallModal callSession={connected} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        const notice = screen.getByTestId('line-flapping-notice');
        expect(notice.textContent).toContain('se rétablit en boucle (3 fois)');
        expect(notice.textContent).toContain('Ce n’est pas votre micro');
    });

    it('appel pas encore décroché : jamais ce message pendant la sonnerie', () => {
        rig.state.reconnectCount = 9;
        render(<ChatCallModal callSession={baseSession} localName="Amina" isIncoming onAcceptCall={noop} onRejectCall={noop} onEndCall={noop} />);
        expect(screen.queryByTestId('line-flapping-notice')).toBeNull();
    });
});

/**
 * Mission SN — bouton « Sonnerie » à côté d'« Annuaire » dans la barre de la
 * fenêtre de messagerie : il ouvre un petit panneau (sonnerie, vibration, état
 * hors application) et rien d'autre ne change dans la barre.
 */
describe('MoocChatFloating — bouton « Sonnerie » (mission SN)', () => {
    it('placé juste après « Annuaire », il ouvre puis ferme le panneau ; les quatre onglets existants restent intacts', async () => {
        render(<MoocChatFloating currentUser={me} standalone />);
        const directory = await screen.findByRole('button', { name: /^Annuaire \(/ });
        const tab = screen.getByTestId('ringing-tab');
        expect(directory.nextElementSibling).toBe(tab);
        expect(tab.textContent).toContain('Sonnerie');
        expect(tab.getAttribute('aria-expanded')).toBe('false');
        expect(screen.queryByTestId('ringing-panel')).toBeNull();
        const bar = directory.parentElement as HTMLElement;
        expect(Array.from(bar.children).map((el) => (el.textContent || '').trim().replace(/\s*\(\d+\)$/, ''))).toEqual(['Tout', 'Directs', 'Groupes', 'Annuaire', 'Sonnerie']);

        fireEvent.click(tab);

        expect(tab.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByTestId('ringing-panel').id).toBe('mooc-chat-ringing-panel');
        expect(screen.getByRole('switch', { name: 'Sonnerie' })).toBeTruthy();
        expect(screen.getByRole('switch', { name: 'Vibration' })).toBeTruthy();
        expect(await screen.findByText('Hors application')).toBeTruthy(); // utilisateur réel (uuid) → état hors application affiché

        fireEvent.click(screen.getByRole('button', { name: 'Fermer le panneau Sonnerie' }));
        expect(screen.queryByTestId('ringing-panel')).toBeNull();
        fireEvent.click(tab);
        expect(screen.getByTestId('ringing-panel')).toBeTruthy();
    });
});
