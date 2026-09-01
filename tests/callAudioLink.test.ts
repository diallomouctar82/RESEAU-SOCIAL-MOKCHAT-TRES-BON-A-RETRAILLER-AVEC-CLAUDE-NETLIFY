import { describe, expect, it } from 'vitest';
import {
    assessAudioLink, describeAudioLink, describeMediaError, formatAudioLinkLog, peerMediaNotice, pickRemoteForCall,
    type AudioLinkSample,
} from '../services/calls/callAudio';
import { CALL_IDENTITY_SEPARATOR, callIdentity, isSameAccountIdentity, userIdFromIdentity } from '../services/calls/callDevice';
import { decodeCallData, encodeCallData } from '../services/messaging/speechLanguage';

/**
 * Mission AU (audio bidirectionnel) — règles PURES qui rendent un audio à
 * sens unique visible et diagnosticable : chaque sens est jugé séparément
 * sur des compteurs réels, jamais sur une intention.
 */

const sample = (over: Partial<AudioLinkSample> = {}): AudioLinkSample => ({
    at: 1000, localPublished: true, localMuted: false, bytesSent: 1000, remoteAudioTracks: 1, bytesReceived: 2000, canPlaybackAudio: true, ...over,
});

describe('assessAudioLink — chaque sens jugé sur des octets réels', () => {
    it('première mesure : inconnu (jamais un « ok » sans delta)', () => {
        expect(assessAudioLink(null, sample())).toEqual({ sending: 'unknown', receiving: 'unknown' });
    });
    it('les deux sens progressent → ok / ok', () => {
        expect(assessAudioLink(sample(), sample({ at: 6000, bytesSent: 5000, bytesReceived: 9000 }))).toEqual({ sending: 'ok', receiving: 'ok' });
    });
    it('rien ne part (compteur figé) → envoi bloqué ; rien n’arrive → réception bloquée', () => {
        expect(assessAudioLink(sample(), sample({ at: 6000 }))).toEqual({ sending: 'stalled', receiving: 'stalled' });
    });
    it('micro non publié → absent ; micro coupé → muted (jamais « bloqué » à tort)', () => {
        expect(assessAudioLink(sample(), sample({ localPublished: false })).sending).toBe('absent');
        expect(assessAudioLink(sample(), sample({ localMuted: true })).sending).toBe('muted');
    });
    it('aucune piste distante → absent ; lecture interdite par le navigateur → blocked, même si des octets arrivent', () => {
        expect(assessAudioLink(sample(), sample({ remoteAudioTracks: 0 })).receiving).toBe('absent');
        expect(assessAudioLink(sample(), sample({ bytesReceived: 9000, canPlaybackAudio: false })).receiving).toBe('blocked');
    });
    it('mesure manquante (null) → unknown, jamais un verdict inventé', () => {
        expect(assessAudioLink(sample(), sample({ bytesSent: null, bytesReceived: null }))).toEqual({ sending: 'unknown', receiving: 'unknown' });
    });
});

describe('pickRemoteForCall — le correspondant est celui qui publie', () => {
    type Media = { participant: { identity: string }; audioTrack?: unknown; videoTrack?: unknown; screenShareTrack?: unknown };
    const silent: Media = { participant: { identity: 'u1::phone' } };
    const withAudio: Media = { participant: { identity: 'u1::laptop' }, audioTrack: {} };
    const withVideo: Media = { participant: { identity: 'u1::tablet' }, videoTrack: {} };
    it('préfère la piste audio, puis vidéo/écran, sinon le premier', () => {
        expect(pickRemoteForCall([silent, withVideo, withAudio])).toBe(withAudio);
        expect(pickRemoteForCall([silent, withVideo])).toBe(withVideo);
        expect(pickRemoteForCall([silent])).toBe(silent);
        expect(pickRemoteForCall([])).toBeNull();
    });
});

describe('describeMediaError — explication en français, jamais un code brut seul', () => {
    it('permission refusée / périphérique absent / occupé / contraintes / interrompu', () => {
        expect(describeMediaError('NotAllowedError: Permission denied')).toMatch(/refusé l’accès au micro/);
        expect(describeMediaError('NotFoundError: Requested device not found')).toBe('Aucun micro détecté sur cet appareil.');
        expect(describeMediaError('NotReadableError: Could not start audio source')).toMatch(/utilisé par une autre application/);
        expect(describeMediaError('OverconstrainedError')).toMatch(/réglages demandés/);
        expect(describeMediaError('AbortError: aborted')).toMatch(/interrompue/);
    });
    it('message inconnu conservé tel quel ; vide → « Micro indisponible. »', () => {
        expect(describeMediaError('Erreur bizarre 42')).toBe('Erreur bizarre 42');
        expect(describeMediaError('')).toBe('Micro indisponible.');
        expect(describeMediaError(null)).toBe('Micro indisponible.');
    });
});

describe('peerMediaNotice / describeAudioLink — libellés honnêtes', () => {
    it('micro indisponible (avec/sans raison), coupé, ou tout va bien (null)', () => {
        expect(peerMediaNotice('Ivan', { t: 'media', v: 1, mic: 'unavailable', reason: 'permission refusée' })).toBe('Ivan n’a pas de micro actif (permission refusée) : vous ne l’entendrez pas tant que ce n’est pas réglé de son côté.');
        expect(peerMediaNotice('Ivan', { t: 'media', v: 1, mic: 'unavailable' })).toMatch(/^Ivan n’a pas de micro actif :/);
        expect(peerMediaNotice('Ivan', { t: 'media', v: 1, mic: 'off' })).toBe('Ivan a coupé son micro.');
        expect(peerMediaNotice('Ivan', { t: 'media', v: 1, mic: 'on' })).toBeNull();
        expect(peerMediaNotice('Ivan', null)).toBeNull();
    });
    it('un sens en défaut est marqué « bad », une mesure en cours « warn », un micro coupé « muted »', () => {
        expect(describeAudioLink({ sending: 'stalled', receiving: 'blocked' })).toEqual({
            sending: { label: 'Votre voix ne part pas', tone: 'bad' }, receiving: { label: 'Son bloqué par le navigateur', tone: 'bad' },
        });
        expect(describeAudioLink({ sending: 'unknown', receiving: 'absent' })).toEqual({
            sending: { label: 'Micro : mesure…', tone: 'warn' }, receiving: { label: 'Pas encore de micro en face', tone: 'warn' },
        });
        expect(describeAudioLink({ sending: 'muted', receiving: 'ok' }).sending.tone).toBe('muted');
    });
    it('journal compact, une ligne, préfixe [appel] média', () => {
        expect(formatAudioLinkLog('appelant', sample({ bytesReceived: null }), { sending: 'ok', receiving: 'unknown' }))
            .toBe('[appel] média role=appelant envoi=ok réception=unknown micro=publié octetsEnvoyés=1000 pistesDistantes=1 octetsReçus=? lecture=ok');
    });
});

describe('identité par appareil — miroir exact de la fonction Edge livekit-token', () => {
    it('compose <userId>::<deviceId> et retrouve le compte, avec ou sans suffixe', () => {
        expect(CALL_IDENTITY_SEPARATOR).toBe('::');
        expect(callIdentity('u-1', 'abc12345')).toBe('u-1::abc12345');
        expect(userIdFromIdentity('u-1::abc12345')).toBe('u-1');
        expect(userIdFromIdentity('u-1')).toBe('u-1');
        expect(userIdFromIdentity(undefined)).toBe('');
    });
    it('deux appareils du même compte = même compte ; comptes différents ou identité vide = non', () => {
        expect(isSameAccountIdentity('u-1::phone', 'u-1::laptop')).toBe(true);
        expect(isSameAccountIdentity('u-1::phone', 'u-1')).toBe(true);
        expect(isSameAccountIdentity('u-1::phone', 'u-2::phone')).toBe(false);
        expect(isSameAccountIdentity('', '')).toBe(false);
    });
});

describe('message « media » du canal de données', () => {
    it('aller-retour, raison tronquée à 160 caractères, valeur inconnue rejetée', () => {
        expect(decodeCallData(encodeCallData({ t: 'media', v: 1, mic: 'off' }))).toEqual({ t: 'media', v: 1, mic: 'off' });
        const long = 'x'.repeat(200);
        expect(decodeCallData(encodeCallData({ t: 'media', v: 1, mic: 'unavailable', reason: long }))).toEqual({ t: 'media', v: 1, mic: 'unavailable', reason: 'x'.repeat(160) });
        expect(decodeCallData(new TextEncoder().encode(JSON.stringify({ t: 'media', v: 1, mic: 'loud' })))).toBeNull();
        expect(decodeCallData(new TextEncoder().encode(JSON.stringify({ t: 'media', v: 1, mic: 'on', reason: '   ' })))).toEqual({ t: 'media', v: 1, mic: 'on' });
    });
});
