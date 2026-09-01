import { describe, expect, it, vi } from 'vitest';
import {
    TranslationService,
    type TranslationEngine,
} from '../services/translation/translationService';

const createEngine = (
    id: string,
    translate: TranslationEngine['translate'],
): TranslationEngine => ({ id, translate });

describe('TranslationService — contrat central Moknet', () => {
    it('conserve exactement l’original et restitue séparément la traduction', async () => {
        const translate = vi.fn(async () => ({
            translatedText: 'Hello 👋',
            detectedSourceLanguage: 'fr',
        }));
        const service = new TranslationService(createEngine('engine-a', translate));

        const result = await service.translateText({
            text: '  Bonjour 👋  ',
            sourceLanguage: 'fr-FR',
            targetLanguage: 'English',
            context: 'messaging',
        });

        expect(result).toMatchObject({
            originalText: '  Bonjour 👋  ',
            translatedText: 'Hello 👋',
            sourceLanguage: 'fr',
            targetLanguage: 'en',
            targetLanguageLabel: 'English',
            status: 'translated',
            engineId: 'engine-a',
        });
        expect(translate).toHaveBeenCalledWith({
            text: '  Bonjour 👋  ',
            sourceLanguage: 'fr',
            targetLanguage: 'en',
            context: 'messaging',
        });
    });

    it('n’appelle aucun moteur lorsque auteur et lecteur ont la même langue', async () => {
        const translate = vi.fn(async () => ({ translatedText: 'inutile' }));
        const service = new TranslationService(createEngine('engine-a', translate));

        const result = await service.translateText({
            text: 'Message original',
            sourceLanguage: 'français',
            targetLanguage: 'fr-FR',
            context: 'messaging',
        });

        expect(translate).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            originalText: 'Message original',
            translatedText: 'Message original',
            status: 'unchanged',
        });
    });

    it('garde l’original lisible si le moteur est indisponible', async () => {
        const translate = vi.fn(async () => {
            throw new Error('fournisseur indisponible');
        });
        const service = new TranslationService(createEngine('engine-a', translate));

        await expect(service.translateText({
            text: 'Texte à ne jamais perdre',
            sourceLanguage: 'fr',
            targetLanguage: 'en',
            context: 'messaging',
        })).resolves.toMatchObject({
            originalText: 'Texte à ne jamais perdre',
            translatedText: 'Texte à ne jamais perdre',
            status: 'unavailable',
        });
    });

    it('permet de changer de moteur sans modifier le contrat des appelants', async () => {
        const firstTranslate = vi.fn(async () => ({
            translatedText: 'First engine',
            detectedSourceLanguage: 'fr',
        }));
        const secondTranslate = vi.fn(async () => ({
            translatedText: 'Second engine',
            detectedSourceLanguage: 'fr',
        }));
        const service = new TranslationService(createEngine('engine-a', firstTranslate));
        const request = {
            text: 'Même appel applicatif',
            sourceLanguage: 'fr',
            targetLanguage: 'en',
            context: 'messaging' as const,
        };

        expect((await service.translateText(request)).translatedText).toBe('First engine');
        service.setEngine(createEngine('engine-b', secondTranslate));
        const result = await service.translateText(request);

        expect(result.translatedText).toBe('Second engine');
        expect(result.engineId).toBe('engine-b');
        expect(firstTranslate).toHaveBeenCalledTimes(1);
        expect(secondTranslate).toHaveBeenCalledTimes(1);
    });

    it('isole le cache lorsqu’un moteur est remplacé pendant une requête en vol', async () => {
        let resolveFirst!: (value: { translatedText: string; detectedSourceLanguage: string }) => void;
        const firstTranslate = vi.fn(() => new Promise<{
            translatedText: string;
            detectedSourceLanguage: string;
        }>((resolve) => {
            resolveFirst = resolve;
        }));
        const secondTranslate = vi.fn(async () => ({
            translatedText: 'Réponse du nouveau moteur',
            detectedSourceLanguage: 'fr',
        }));
        const service = new TranslationService(createEngine('engine-a', firstTranslate));
        const request = {
            text: 'Bonjour',
            sourceLanguage: 'fr',
            targetLanguage: 'en',
            context: 'messaging' as const,
        };

        const oldRequest = service.translateText(request);
        service.setEngine(createEngine('engine-b', secondTranslate));
        resolveFirst({ translatedText: 'Réponse de l’ancien moteur', detectedSourceLanguage: 'fr' });
        expect((await oldRequest).engineId).toBe('engine-a');

        const newResult = await service.translateText(request);
        expect(newResult).toMatchObject({
            translatedText: 'Réponse du nouveau moteur',
            engineId: 'engine-b',
        });
        expect(secondTranslate).toHaveBeenCalledTimes(1);
    });

    it('mutualise les demandes identiques en vol et les résultats en mémoire', async () => {
        let resolveTranslation!: (value: { translatedText: string; detectedSourceLanguage: string }) => void;
        const translate = vi.fn(() => new Promise<{
            translatedText: string;
            detectedSourceLanguage: string;
        }>((resolve) => {
            resolveTranslation = resolve;
        }));
        const service = new TranslationService(createEngine('engine-a', translate));
        const request = {
            text: 'Bonjour',
            sourceLanguage: 'fr',
            targetLanguage: 'en',
            context: 'messaging' as const,
        };

        const first = service.translateText(request);
        const concurrent = service.translateText(request);
        resolveTranslation({ translatedText: 'Hello', detectedSourceLanguage: 'fr' });

        expect((await first).translatedText).toBe('Hello');
        expect((await concurrent).translatedText).toBe('Hello');
        expect((await service.translateText(request)).translatedText).toBe('Hello');
        expect(translate).toHaveBeenCalledTimes(1);
    });
});
