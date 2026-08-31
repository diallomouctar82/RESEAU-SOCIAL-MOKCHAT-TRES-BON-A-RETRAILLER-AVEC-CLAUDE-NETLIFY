import { describe, expect, it, vi } from 'vitest';

/**
 * ÉQUIPE 8 — appel entrant (loops 2+3+6) : logiques pures du flux de
 * sonnerie/notification, extraites de MoocChatFloating.tsx.
 *
 * - `ringingStateForCall` est LE mapping signaux → sonnerie/arrêt : l'effet
 *   unique de MoocChatFloating démarre startRinging/startRingback du service
 *   quand la phase est 'ring'/'ringback' et arrête LES DEUX canaux dès que
 *   la phase devient 'silent'. Tester ce mapping, c'est tester tous les
 *   chemins d'arrêt (décrocher, refuser, call_ended/call_rejected reçus,
 *   expiration 35 s, raccrochage).
 * - `resolveIncomingRingtoneId` fixe la priorité : choix PROFIL
 *   (privacySettings.ringtoneId) → sinon le service décide (cache local puis
 *   Signature MokNet).
 * - `decideIncomingCallNotification` : notification navigateur UNIQUEMENT
 *   onglet caché, permission demandée UNE fois au premier appel (jamais au
 *   chargement), refus = rien d'autre simulé (limites web honnêtes : onglet
 *   fermé = pas d'appel, il n'existe aucun push serveur ici).
 *
 * Même scaffolding que tests/chatCallLogic.test.ts : le module hôte est
 * importé pour de vrai, ses dépendances lourdes sont neutralisées.
 */

vi.mock('../hooks/useLiveTransport', () => ({
    useLiveTransport: () => {
        throw new Error('useLiveTransport ne doit pas être invoqué dans ces tests purs');
    },
}));
vi.mock('../services/supabaseClient', () => ({
    supabaseService: {},
    isSupabaseConfigured: false,
}));
vi.mock('../services/adminConfigService', () => ({
    adminConfigService: {},
}));
vi.mock('../services/messaging/messagingIntelligence', () => ({
    summarizeConversation: vi.fn(),
    assistRewriteMessage: vi.fn(),
    translateMessageText: vi.fn(),
}));

const {
    ringingStateForCall,
    resolveIncomingRingtoneId,
    decideIncomingCallNotification,
    incomingCallNotificationText,
} = await import('../components/MoocChatFloating');

type Status = 'ringing' | 'connected' | 'ended';
const session = (status: Status) => ({ status } as { status: Status });

describe('ringingStateForCall (loop 6 — mapping signaux → sonnerie/arrêts)', () => {
    it('call_invitation REÇUE (session ringing, entrant) → sonnerie du service', () => {
        expect(ringingStateForCall(session('ringing'), true)).toBe('ring');
    });

    it('invitation ÉMISE (session ringing, sortant) → tonalité de retour côté appelant', () => {
        expect(ringingStateForCall(session('ringing'), false)).toBe('ringback');
    });

    it('décrocher local / call_accepted reçu (status connected) → arrêt immédiat des deux canaux', () => {
        expect(ringingStateForCall(session('connected'), true)).toBe('silent');
        expect(ringingStateForCall(session('connected'), false)).toBe('silent');
    });

    it('refus, raccrochage, call_ended/call_rejected reçus, expiration 35 s (session nulle) → silence', () => {
        expect(ringingStateForCall(null, true)).toBe('silent');
        expect(ringingStateForCall(null, false)).toBe('silent');
    });

    it('statut inattendu (ended) → jamais une sonnerie orpheline', () => {
        expect(ringingStateForCall(session('ended'), true)).toBe('silent');
        expect(ringingStateForCall(session('ended'), false)).toBe('silent');
    });

    it('scénario appelé complet : invitation → sonne ; décrocher → silence ; fin → silence', () => {
        // call_invitation reçue
        expect(ringingStateForCall(session('ringing'), true)).toBe('ring');
        // décrocher (status connected localement + signal call_accepted émis)
        expect(ringingStateForCall(session('connected'), false)).toBe('silent');
        // call_ended reçu → session nulle
        expect(ringingStateForCall(null, false)).toBe('silent');
    });

    it('scénario appelant complet : émission → ringback ; call_accepted → silence ; call_rejected → silence', () => {
        expect(ringingStateForCall(session('ringing'), false)).toBe('ringback');
        expect(ringingStateForCall(session('connected'), false)).toBe('silent');
        expect(ringingStateForCall(null, false)).toBe('silent');
    });
});

describe('resolveIncomingRingtoneId (loop 6 — le choix profil prime, sinon le service décide)', () => {
    it('transmet un id profil valide tel quel', () => {
        expect(resolveIncomingRingtoneId('signature')).toBe('signature');
        expect(resolveIncomingRingtoneId('kora')).toBe('kora');
    });

    it("absence de choix profil → undefined (le service retombe sur son cache local puis le défaut)", () => {
        expect(resolveIncomingRingtoneId(undefined)).toBeUndefined();
        expect(resolveIncomingRingtoneId(null)).toBeUndefined();
        expect(resolveIncomingRingtoneId('')).toBeUndefined();
        expect(resolveIncomingRingtoneId('   ')).toBeUndefined();
    });

    it('valeur non-texte (donnée profil corrompue) → undefined, jamais une exception', () => {
        expect(resolveIncomingRingtoneId(42)).toBeUndefined();
        expect(resolveIncomingRingtoneId({ id: 'signature' })).toBeUndefined();
        expect(resolveIncomingRingtoneId(true)).toBeUndefined();
    });
});

describe('decideIncomingCallNotification (loop 3 — arrière-plan, limites web honnêtes)', () => {
    it('onglet VISIBLE → jamais de notification (le modal plein écran suffit)', () => {
        expect(decideIncomingCallNotification(false, 'granted')).toBe('none');
        expect(decideIncomingCallNotification(false, 'default')).toBe('none');
        expect(decideIncomingCallNotification(false, 'denied')).toBe('none');
        expect(decideIncomingCallNotification(false, 'unsupported')).toBe('none');
    });

    it('onglet caché + permission accordée → afficher la notification', () => {
        expect(decideIncomingCallNotification(true, 'granted')).toBe('show');
    });

    it("onglet caché + permission jamais demandée → la demander (au PREMIER appel, jamais au chargement)", () => {
        expect(decideIncomingCallNotification(true, 'default')).toBe('request');
    });

    it('permission refusée → rien : on ne simule pas autre chose, la sonnerie joue si l\'onglet vit', () => {
        expect(decideIncomingCallNotification(true, 'denied')).toBe('none');
    });

    it('API Notification absente → rien, jamais une exception', () => {
        expect(decideIncomingCallNotification(true, 'unsupported')).toBe('none');
    });
});

describe('incomingCallNotificationText (loop 3 — nom réel + type d\'appel)', () => {
    it('titre selon le type, corps avec le nom réel de l\'appelant', () => {
        expect(incomingCallNotificationText('Aïssatou Diallo', 'video')).toEqual({
            title: 'Appel vidéo entrant',
            body: 'Aïssatou Diallo vous appelle sur MokNet',
        });
        expect(incomingCallNotificationText('Mamadou Bah', 'audio')).toEqual({
            title: 'Appel audio entrant',
            body: 'Mamadou Bah vous appelle sur MokNet',
        });
    });

    it('nom manquant → repli neutre, jamais « undefined vous appelle »', () => {
        expect(incomingCallNotificationText('', 'audio').body).toBe('Un membre vous appelle sur MokNet');
    });
});
