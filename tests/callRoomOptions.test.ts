import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * AU-8 — l'image du correspondant qui apparaît puis disparaît.
 *
 * Le flux adaptatif du SDK observe l'élément <video> auquel la piste est
 * attachée et SE DÉSABONNE quand il le juge invisible (taille nulle, hors
 * écran) ; le SDK émet alors `TrackUnsubscribed`, la piste est retirée de
 * l'état et l'écran d'appel retombe sur la vignette d'attente. Pour un appel
 * à deux, ce flux n'est pas un contenu qu'on peut mettre en pause : c'est
 * tout le contenu. Pour le LIVE, avec N vignettes dont beaucoup hors écran,
 * il garde tout son sens — ce test verrouille les deux comportements.
 */

const rig = vi.hoisted(() => ({ optionsPassees: [] as Record<string, unknown>[] }));

vi.mock('livekit-client', async (importOriginal) => {
    const real = await importOriginal<typeof import('livekit-client')>();
    class RoomEspion {
        localParticipant = { identity: 'moi' };
        canPlaybackAudio = true;
        constructor(options: Record<string, unknown> = {}) { rig.optionsPassees.push(options); }
        on() { return this; }
        off() { return this; }
        async connect() { /* aucune connexion réseau dans un test */ }
        async disconnect() { /* rien à fermer */ }
    }
    return { ...real, Room: RoomEspion };
});

const { LiveKitTransportProvider } = await import('../services/live/liveKitTransportProvider');

const connecter = async (audioProfile?: 'call') => {
    const provider = new LiveKitTransportProvider();
    await provider.connect(
        { serverUrl: 'wss://exemple.invalide', token: 'jeton-de-test', ...(audioProfile ? { audioProfile } : {}) } as never,
        {} as never,
    );
    return rig.optionsPassees[rig.optionsPassees.length - 1];
};

beforeEach(() => { rig.optionsPassees = []; });

describe('options de la room selon le profil (AU-8)', () => {
    it('appel : le flux adaptatif est DÉSACTIVÉ — la vidéo du correspondant ne peut plus être désabonnée toute seule', async () => {
        const options = await connecter('call');
        expect(options.adaptiveStream).toBe(false);
        expect(options.dynacast).toBe(false);
    });

    it('appel : les réglages audio « parole » de la mission précédente restent en place (aucune régression)', async () => {
        const options = await connecter('call');
        expect(options.audioCaptureDefaults).toMatchObject({ echoCancellation: true, noiseSuppression: true, autoGainControl: true });
        expect(options.publishDefaults).toMatchObject({ dtx: true, red: true });
    });

    it('appel (mission LT) : la sonde « v1 RTC path » du SDK est désactivée — connexion directe sur le chemin v0 du serveur 1.8.4 (0,8 s de moins)', async () => {
        const options = await connecter('call');
        expect(options.singlePeerConnection).toBe(false);
    });

    it('LIVE : le flux adaptatif reste ACTIVÉ — des dizaines de vignettes, dont beaucoup hors écran', async () => {
        const options = await connecter();
        expect(options.adaptiveStream).toBe(true);
        expect(options.dynacast).toBe(true);
    });

    /**
     * LV-6 — correction d'un partage de réglage trop étroit.
     *
     * Ce test exigeait auparavant `singlePeerConnection === undefined` pour le
     * LIVE, au motif que le réglage était « spécifique aux appels ». Il ne
     * l'est pas : il tient au SERVEUR (1.8.4 ne connaît pas le chemin « v1 »),
     * et le banc LV-6 a relevé la même erreur `WebSocket … /rtc/v1` des deux
     * côtés d'un direct — donc les mêmes 0,8 s perdus avant le premier octet.
     * Ce qui reste bien propre aux appels, et que le test ci-dessus continue
     * de garder, c'est `adaptiveStream`/`dynacast`.
     */
    it('LIVE (mission LV-6) : la sonde « v1 RTC path » est désactivée là aussi — la raison tient au serveur, pas au type de session', async () => {
        const options = await connecter();
        expect(options.singlePeerConnection).toBe(false);
    });
});
