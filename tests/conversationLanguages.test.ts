import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/supabaseClient', () => ({
    supabaseService: {
        getMemoryByKey: vi.fn(),
        upsertMemory: vi.fn(),
    },
}));

import { supabaseService } from '../services/supabaseClient';
import {
    MESSAGING_LANGUAGES,
    normalizeLanguage,
    getLanguageLabel,
} from '../services/translation/translationService';
import {
    loadConversationLanguages,
    saveConversationLanguages,
    targetLanguageForMessage,
    MESSAGING_LANGUAGE_CATEGORY,
} from '../services/messaging/conversationLanguagePrefs';

const getMemoryByKey = supabaseService.getMemoryByKey as ReturnType<typeof vi.fn>;
const upsertMemory = supabaseService.upsertMemory as ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Catalogue des langues de conversation', () => {
    it('couvre les principales langues mondiales demandées', () => {
        const codes = MESSAGING_LANGUAGES.map((l) => l.code);
        for (const attendu of ['fr', 'en', 'es', 'pt', 'de', 'ru', 'ar', 'zh', 'hi']) {
            expect(codes).toContain(attendu);
        }
        // « et autres langues largement utilisées »
        for (const attendu of ['bn', 'ur', 'id', 'ja', 'ko', 'it', 'tr', 'vi']) {
            expect(codes).toContain(attendu);
        }
        expect(codes.length).toBeGreaterThanOrEqual(24);
    });

    it('n’expose aucun code en double et chaque entrée est complète', () => {
        const codes = MESSAGING_LANGUAGES.map((l) => l.code);
        expect(new Set(codes).size).toBe(codes.length);
        for (const lang of MESSAGING_LANGUAGES) {
            expect(lang.label.trim().length).toBeGreaterThan(0);
            expect(lang.flag.trim().length).toBeGreaterThan(0);
        }
    });

    it('toute langue proposée à l’écran est comprise par le moteur', () => {
        // Le sélecteur et la normalisation partagent la même source : une
        // langue offerte ne peut pas être rejetée au moment de traduire.
        for (const lang of MESSAGING_LANGUAGES) {
            expect(normalizeLanguage(lang.code)).toBe(lang.code);
            expect(getLanguageLabel(lang.code)).toBe(lang.label);
        }
    });

    it('normalise les formes réellement rencontrées (variantes, noms, casse)', () => {
        expect(normalizeLanguage('pt-BR')).toBe('pt');
        expect(normalizeLanguage('Russian')).toBe('ru');
        expect(normalizeLanguage('russe')).toBe('ru');
        expect(normalizeLanguage('हिन्दी')).toBe('hi');
        expect(normalizeLanguage('zh-Hans')).toBe('zh');
        expect(normalizeLanguage('Deutsch')).toBe('de');
        expect(normalizeLanguage('  ESPAGNOL  ')).toBe('es');
    });
});

describe('Sens de traduction (entrant / sortant)', () => {
    const pair = { mine: 'fr', theirs: 'ru' };

    it('un message REÇU est traduit vers MA langue', () => {
        expect(targetLanguageForMessage(pair, false)).toBe('fr');
    });

    it('un message que J’ENVOIE est traduit vers la langue de mon interlocuteur', () => {
        expect(targetLanguageForMessage(pair, true)).toBe('ru');
    });

    it('les deux sens ne sont jamais confondus', () => {
        expect(targetLanguageForMessage(pair, true)).not.toBe(targetLanguageForMessage(pair, false));
    });
});

describe('Mémorisation du couple de langues', () => {
    it('enregistre le couple sous la conversation, en préférence durable', async () => {
        upsertMemory.mockResolvedValue({ id: 'm1' });
        const ok = await saveConversationLanguages('user-1', 'conv-1', { mine: 'fr', theirs: 'zh' });

        expect(ok).toBe(true);
        expect(upsertMemory).toHaveBeenCalledTimes(1);
        const [userId, row] = upsertMemory.mock.calls[0];
        expect(userId).toBe('user-1');
        expect(row.scope).toBe('durable_preference');
        expect(row.category).toBe(MESSAGING_LANGUAGE_CATEGORY);
        expect(row.key).toBe('conv-1');
        expect(JSON.parse(row.value)).toEqual({ mine: 'fr', theirs: 'zh' });
    });

    it('relit le couple mémorisé pour cette conversation', async () => {
        getMemoryByKey.mockResolvedValue({ value: JSON.stringify({ mine: 'ar', theirs: 'pt' }) });
        await expect(loadConversationLanguages('user-1', 'conv-1')).resolves.toEqual({ mine: 'ar', theirs: 'pt' });
        expect(getMemoryByKey).toHaveBeenCalledWith('user-1', 'durable_preference', MESSAGING_LANGUAGE_CATEGORY, 'conv-1');
    });

    it('normalise à la relecture (une variante stockée reste exploitable)', async () => {
        getMemoryByKey.mockResolvedValue({ value: JSON.stringify({ mine: 'fr-FR', theirs: 'pt-BR' }) });
        await expect(loadConversationLanguages('user-1', 'conv-1')).resolves.toEqual({ mine: 'fr', theirs: 'pt' });
    });

    it('ne renvoie rien plutôt qu’une valeur douteuse quand la langue est inconnue', async () => {
        getMemoryByKey.mockResolvedValue({ value: JSON.stringify({ mine: 'fr', theirs: '' }) });
        await expect(loadConversationLanguages('user-1', 'conv-1')).resolves.toBeNull();
    });

    it('refuse d’enregistrer une langue non reconnue', async () => {
        const ok = await saveConversationLanguages('user-1', 'conv-1', { mine: 'fr', theirs: '' });
        expect(ok).toBe(false);
        expect(upsertMemory).not.toHaveBeenCalled();
    });

    it('aucun réglage mémorisé → null, sans erreur (l’appelant garde ses défauts)', async () => {
        getMemoryByKey.mockResolvedValue(null);
        await expect(loadConversationLanguages('user-1', 'conv-1')).resolves.toBeNull();
    });

    it('une panne de stockage ne casse jamais la conversation', async () => {
        getMemoryByKey.mockRejectedValue(new Error('réseau indisponible'));
        await expect(loadConversationLanguages('user-1', 'conv-1')).resolves.toBeNull();

        upsertMemory.mockRejectedValue(new Error('réseau indisponible'));
        await expect(saveConversationLanguages('user-1', 'conv-1', { mine: 'fr', theirs: 'en' })).resolves.toBe(false);
    });
});
