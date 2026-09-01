import { describe, expect, it, vi } from 'vitest';

/**
 * ÉQUIPE 7 — appels 1-à-1 : logiques pures extraites des correctifs A1/A5.
 *
 * A1 : la garde `isLikelyRealId` protège désormais handleStartCall — une
 * conversation de repli locale (`chat-<memberId>`, membre de démonstration
 * ou création serveur échouée) produirait une room `call-chat-...` que
 * l'Edge Function livekit-token rejette en 403 (cast uuid, erreur 22P02) :
 * l'appel « sonnait » pour toujours sans qu'aucun média ne puisse JAMAIS
 * passer. Ces tests fixent la frontière exacte de la garde.
 *
 * A5 : `formatCallDuration` est la durée affichée dans l'interface d'appel
 * (badge mm:ss) — sortie du composant pour être testable, avec un
 * comportement défini sur TOUTES les entrées (jamais « NaN:NaN » à l'écran).
 *
 * Les modules hôtes sont importés pour de vrai (ce sont leurs exports qui
 * sont sous test), mais leurs dépendances lourdes — transport LiveKit,
 * client Supabase, services d'intelligence — sont neutralisées : aucun test
 * ici ne rend le composant ni ne touche le réseau.
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
}));

const { formatCallDuration } = await import('../components/chat/ChatCallModal');
const { isLikelyRealId } = await import('../components/MoocChatFloating');

describe('formatCallDuration (A5 — durée d\'appel mm:ss)', () => {
    it('affiche 00:00 au décroché', () => {
        expect(formatCallDuration(0)).toBe('00:00');
    });

    it('remplit les secondes sur deux chiffres', () => {
        expect(formatCallDuration(7)).toBe('00:07');
        expect(formatCallDuration(59)).toBe('00:59');
    });

    it('bascule en minutes à 60 s', () => {
        expect(formatCallDuration(60)).toBe('01:00');
        expect(formatCallDuration(61)).toBe('01:01');
        expect(formatCallDuration(600)).toBe('10:00');
    });

    it('laisse les minutes croître au-delà d\'une heure — jamais une remise à zéro trompeuse', () => {
        expect(formatCallDuration(3600)).toBe('60:00');
        expect(formatCallDuration(3661)).toBe('61:01');
    });

    it('ne produit jamais « NaN:NaN » : entrées invalides → 00:00, fractions tronquées', () => {
        expect(formatCallDuration(-5)).toBe('00:00');
        expect(formatCallDuration(Number.NaN)).toBe('00:00');
        expect(formatCallDuration(Number.POSITIVE_INFINITY)).toBe('00:00');
        expect(formatCallDuration(12.9)).toBe('00:12');
    });
});

describe('isLikelyRealId (A1 — garde d\'appel : uuid réel ou pas d\'appel)', () => {
    it('accepte un uuid Supabase réel (minuscules et majuscules)', () => {
        expect(isLikelyRealId('a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d')).toBe(true);
        expect(isLikelyRealId('A3F1C2D4-5E6F-4A7B-8C9D-0E1F2A3B4C5D')).toBe(true);
    });

    it('refuse les conversations de repli locales `chat-…` — la cause du 403 systématique', () => {
        // Même préfixée d'un uuid réel de membre, la conversation elle-même
        // n'existe pas dans conversation_participants.
        expect(isLikelyRealId('chat-a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d')).toBe(false);
        expect(isLikelyRealId('chat-u1')).toBe(false);
        expect(isLikelyRealId('local-42')).toBe(false);
    });

    it('refuse les identifiants de démonstration de l\'Annuaire local', () => {
        expect(isLikelyRealId('u1')).toBe(false);
        expect(isLikelyRealId('member-1')).toBe(false);
        expect(isLikelyRealId('1')).toBe(false);
    });

    it('refuse absent, vide et presque-uuid', () => {
        expect(isLikelyRealId(undefined)).toBe(false);
        expect(isLikelyRealId('')).toBe(false);
        // Un groupe trop court…
        expect(isLikelyRealId('a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5')).toBe(false);
        // …un caractère hors hexadécimal…
        expect(isLikelyRealId('g3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d')).toBe(false);
        // …ou un uuid noyé dans un texte plus long : rien ne passe.
        expect(isLikelyRealId('xa3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5dx')).toBe(false);
    });
});
