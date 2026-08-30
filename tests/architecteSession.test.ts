import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de la session unique de l'Architecte (mission de finalisation).
 *
 * « 1 Architecte, 1 contexte, 1 historique » : le fil est partagé entre la
 * voix, le clavier, les photos et les documents — et le cerveau y inscrit
 * chaque échange lui-même, garantissant qu'aucune incarnation ne peut
 * diverger.
 */

vi.mock('../services/aiGateway', () => ({
    generateJSON: vi.fn(async () => null),
    generateText: vi.fn(async () => ''),
    analyzeImage: vi.fn(async () => ''),
    generateSpeech: vi.fn(async () => null),
    parseLooseJson: (t: string) => { try { return JSON.parse(t); } catch { return undefined; } },
}));
vi.mock('../services/supabaseClient', () => ({
    supabaseService: {},
    isSupabaseConfigured: false,
}));

import {
    addSessionTurn,
    buildSessionContext,
    clearSession,
    getLastSessionImage,
    getSessionTurns,
    sessionHasImage,
    subscribeToSession,
} from '../services/architecte/architecteSession';
import {
    buildArchitecteSystemPrompt,
    isVisionQuestion,
    runArchitecteCommand,
} from '../services/architecte/architecteBrain';

beforeEach(() => clearSession());

describe('Session unique', () => {
    it('conserve les tours dans l\'ordre et notifie les abonnés', () => {
        const seen: number[] = [];
        const un = subscribeToSession(() => seen.push(getSessionTurns().length));
        addSessionTurn({ role: 'utilisateur', kind: 'texte', text: 'un' });
        addSessionTurn({ role: 'architecte', kind: 'texte', text: 'deux' });
        expect(getSessionTurns().map((t) => t.text)).toEqual(['un', 'deux']);
        expect(seen).toEqual([1, 2]);
        un();
    });

    it('est bornée : jamais plus de 40 tours — le budget contextuel avant tout', () => {
        for (let i = 0; i < 50; i++) addSessionTurn({ role: 'utilisateur', kind: 'texte', text: `t${i}` });
        expect(getSessionTurns()).toHaveLength(40);
        expect(getSessionTurns()[0].text).toBe('t10');
    });

    it('retrouve la DERNIÈRE image montrée — pour les questions de suivi', () => {
        expect(getLastSessionImage()).toBeNull();
        addSessionTurn({ role: 'utilisateur', kind: 'image', text: 'photo 1', imageDataUrl: 'data:image/jpeg;base64,AAA', imageMimeType: 'image/jpeg' });
        addSessionTurn({ role: 'architecte', kind: 'texte', text: 'vu' });
        addSessionTurn({ role: 'utilisateur', kind: 'image', text: 'photo 2', imageDataUrl: 'data:image/png;base64,BBB', imageMimeType: 'image/png' });
        expect(getLastSessionImage()).toEqual({ dataUrl: 'data:image/png;base64,BBB', mimeType: 'image/png' });
    });

    it('le contexte injecté au cerveau mentionne images et documents sans leurs octets', () => {
        addSessionTurn({ role: 'utilisateur', kind: 'texte', text: 'Bonjour' });
        addSessionTurn({ role: 'utilisateur', kind: 'image', text: 'Photo prise à la caméra', imageDataUrl: 'data:image/jpeg;base64,' + 'X'.repeat(5000), imageMimeType: 'image/jpeg' });
        addSessionTurn({ role: 'utilisateur', kind: 'document', text: 'doc', docName: 'budget.xlsx', docExcerpt: 'contenu' });
        const ctx = buildSessionContext();
        expect(ctx).toContain('Utilisateur : Bonjour');
        expect(ctx).toContain('a montré une image');
        expect(ctx).toContain('budget.xlsx');
        expect(ctx).not.toContain('XXXX');
    });
});

describe('Garde anti-hallucination visuelle', () => {
    it('reconnaît les questions de vision, en français réel', () => {
        for (const q of [
            "Qu'est-ce que tu vois ?",
            'que vois-tu ici',
            'Regarde ça',
            'décris cette photo',
            'sur cette image, il y a quoi ?',
        ]) {
            expect(isVisionQuestion(q), q).toBe(true);
        }
        for (const q of ['Emmène-moi sur le fil social', 'crée une tâche', 'quelle heure est-il']) {
            expect(isVisionQuestion(q), q).toBe(false);
        }
    });

    it("SANS image en session, le prompt du cerveau interdit explicitement d'inventer un contenu visuel", () => {
        const prompt = buildArchitecteSystemPrompt('Test', 1);
        expect(prompt).toContain("AUCUNE image n'a été montrée");
        expect(prompt).toContain("n'invente JAMAIS");
    });

    it('AVEC image en session, le prompt le dit — mais interdit de décrire ses pixels de mémoire', () => {
        addSessionTurn({ role: 'utilisateur', kind: 'image', text: 'photo', imageDataUrl: 'data:image/jpeg;base64,AAA', imageMimeType: 'image/jpeg' });
        expect(sessionHasImage()).toBe(true);
        const prompt = buildArchitecteSystemPrompt('Test', 1);
        expect(prompt).toContain('ont été montrées');
        expect(prompt).toContain('ne décris jamais leur contenu de mémoire');
    });
});

describe('Le cerveau tient lui-même l\'historique', () => {
    it('la découverte (sans LLM) inscrit la commande ET la réponse dans la session', async () => {
        await runArchitecteCommand("qu'est-ce que tu peux faire ?", {
            userName: 'Test',
            userLevel: 1,
            confirm: () => true,
        });
        const turns = getSessionTurns();
        expect(turns).toHaveLength(2);
        expect(turns[0]).toMatchObject({ role: 'utilisateur', text: "qu'est-ce que tu peux faire ?" });
        expect(turns[1].role).toBe('architecte');
        expect(turns[1].text.length).toBeGreaterThan(50);
    });

    it('le contexte de session est réellement présent dans le prompt suivant', async () => {
        await runArchitecteCommand("qu'est-ce que tu peux faire ?", {
            userName: 'Test', userLevel: 1, confirm: () => true,
        });
        const prompt = buildArchitecteSystemPrompt('Test', 1);
        expect(prompt).toContain('Contexte récent de la conversation');
        expect(prompt).toContain("qu'est-ce que tu peux faire ?");
    });
});
