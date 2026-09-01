import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../types';
import { detectRecipientLanguage, myEffectiveLanguage, targetLanguageForMessage } from '../services/messaging/messageLanguage';
import { MESSAGING_LANGUAGES, normalizeLanguage, getLanguageLabel } from '../services/translation/translationService';

const ME = 'me';
const THEM = 'them';

const msg = (senderId: string, originalLanguage?: string, id = Math.random().toString(36).slice(2)): ChatMessage => ({
    id,
    senderId,
    text: 'x',
    originalLanguage,
    timestamp: new Date('2026-09-01T10:00:00Z'),
    isRead: true,
    status: 'delivered',
});

describe('Détection de la langue du destinataire — jamais choisie, jamais devinée', () => {
    it('prend la langue déclarée par le DERNIER message de l’interlocuteur', () => {
        const messages = [msg(THEM, 'en'), msg(ME, 'fr'), msg(THEM, 'ru')];
        expect(detectRecipientLanguage(messages, ME)).toBe('ru');
    });

    it('ignore mes propres messages, quelle que soit leur langue', () => {
        const messages = [msg(THEM, 'ar'), msg(ME, 'fr'), msg(ME, 'fr')];
        expect(detectRecipientLanguage(messages, ME)).toBe('ar');
    });

    it('renvoie undefined tant que l’interlocuteur n’a rien écrit — rien n’est inventé', () => {
        expect(detectRecipientLanguage([msg(ME, 'fr')], ME)).toBeUndefined();
        expect(detectRecipientLanguage([], ME)).toBeUndefined();
    });

    it('saute un message de l’interlocuteur sans langue déclarée et remonte au précédent', () => {
        const messages = [msg(THEM, 'pt'), msg(THEM, undefined)];
        expect(detectRecipientLanguage(messages, ME)).toBe('pt');
    });

    it('normalise la variante déclarée (pt-BR → pt)', () => {
        expect(detectRecipientLanguage([msg(THEM, 'pt-BR')], ME)).toBe('pt');
    });
});

describe('Langue d’affichage d’un message', () => {
    it('un message REÇU est toujours affiché dans MA langue', () => {
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: 'ru', isMine: false })).toBe('fr');
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: undefined, isMine: false })).toBe('fr');
    });

    it('un message ENVOYÉ est affiché dans la langue détectée de l’interlocuteur', () => {
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: 'ru', isMine: true })).toBe('ru');
    });

    it('un message ENVOYÉ reste tel quel si la langue de l’interlocuteur est inconnue', () => {
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: undefined, isMine: true })).toBeUndefined();
    });

    it('un message ENVOYÉ reste tel quel si l’interlocuteur lit déjà ma langue', () => {
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: 'fr', isMine: true })).toBeUndefined();
    });

    it('dans un groupe, mes messages restent tels quels (pas UN destinataire)', () => {
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: 'ru', isMine: true, isGroup: true })).toBeUndefined();
        // mais les messages reçus sont toujours traduits vers ma langue
        expect(targetLanguageForMessage({ myLanguage: 'fr', recipientLanguage: 'ru', isMine: false, isGroup: true })).toBe('fr');
    });

    it('« Par défaut » (aucune langue choisie) → aucune traduction, dans aucun sens', () => {
        for (const mine of ['', null, undefined] as const) {
            expect(targetLanguageForMessage({ myLanguage: mine, recipientLanguage: 'ru', isMine: false })).toBeUndefined();
            expect(targetLanguageForMessage({ myLanguage: mine, recipientLanguage: 'ru', isMine: true })).toBeUndefined();
        }
        expect(myEffectiveLanguage(null)).toBeUndefined();
        expect(myEffectiveLanguage('')).toBeUndefined();
        expect(myEffectiveLanguage('pt-BR')).toBe('pt');
    });
});

describe('Catalogue « Ma langue »', () => {
    it('couvre les principales langues mondiales demandées', () => {
        const codes = MESSAGING_LANGUAGES.map((l) => l.code);
        for (const c of ['fr', 'en', 'es', 'pt', 'de', 'ru', 'ar', 'zh', 'hi']) expect(codes).toContain(c);
        expect(new Set(codes).size).toBe(codes.length);
    });

    it('toute langue proposée est comprise par le moteur (source unique)', () => {
        for (const lang of MESSAGING_LANGUAGES) {
            expect(normalizeLanguage(lang.code)).toBe(lang.code);
            expect(getLanguageLabel(lang.code)).toBe(lang.label);
        }
    });
});
