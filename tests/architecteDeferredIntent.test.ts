import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests G1/G2/G5/G7 (Équipe 3, mission Architecte) — enchaînement
 * « naviguer PUIS exécuter », découverte honnête et mapping du target legacy.
 *
 * Garanties couvertes, chacune par une assertion qui échoue si le
 * comportement disparaît :
 *   - une intention en attente est consommée AU PLUS UNE FOIS, même si
 *     l'écran porteur réenregistre ses handlers à chaque rendu ;
 *   - une intention expirée n'est JAMAIS exécutée ;
 *   - une confirmation refusée n'exécute RIEN et le dit (`cancelled`) ;
 *   - un échec du handler est rapporté `failed` UNE fois — pas de boucle ;
 *   - le résultat RÉEL rejoint le fil de session (jamais un succès anticipé) ;
 *   - la découverte distingue l'exécutable ICI de « depuis l'écran concerné » ;
 *   - EXECUTE/target='create_dossier' (legacy) passe par la capacité de bus
 *     `task.dossier.create` — une seule implémentation d'écriture.
 */

vi.mock('../services/aiGateway', () => ({
    generateJSON: vi.fn(),
    generateText: vi.fn(async () => ''),
    analyzeImage: vi.fn(async () => ''),
}));
vi.mock('../services/supabaseClient', () => ({
    supabase: {},
    isSupabaseConfigured: false,
    supabaseService: { isConfigured: () => false },
}));

import {
    executeCapability,
    registerCapabilityHandlers,
    subscribeToDeferredOutcomes,
    type DeferredCapabilityOutcome,
} from '../services/architecte/capabilityBus';
import {
    clearPendingCapabilityIntent,
    clearSession,
    getPendingCapabilityIntent,
    getSessionTurns,
    setPendingCapabilityIntent,
    PENDING_CAPABILITY_INTENT_TTL_MS,
} from '../services/architecte/architecteSession';
import { describeCapabilitiesForHumans, getCapabilitiesByDomain, getCapability } from '../services/architecte/capabilityRegistry';
import { runArchitecteCommand } from '../services/architecte/architecteBrain';
import { generateJSON } from '../services/aiGateway';

/** Attend les micro/macro-tâches de la reprise différée (setTimeout 0 + exécution async). */
const flushDeferred = () => new Promise((r) => setTimeout(r, 25));

const outcomes: DeferredCapabilityOutcome[] = [];
let unsubscribe: (() => void) | null = null;
const cleanups: Array<() => void> = [];

/** Enregistre en gardant la fonction de retrait pour l'isolation entre tests. */
function register(entries: Parameters<typeof registerCapabilityHandlers>[0]) {
    const off = registerCapabilityHandlers(entries);
    cleanups.push(off);
    return off;
}

beforeEach(() => {
    clearSession(); // vide aussi l'intention en attente
    outcomes.length = 0;
    unsubscribe = subscribeToDeferredOutcomes((o) => outcomes.push(o));
});

afterEach(() => {
    unsubscribe?.();
    unsubscribe = null;
    while (cleanups.length) cleanups.pop()!();
    clearPendingCapabilityIntent();
    vi.useRealTimers();
});

describe('reprise d\'une intention en attente (G1)', () => {
    it("consommée UNE SEULE fois, même quand l'écran réenregistre ses handlers à chaque rendu", async () => {
        const handler = vi.fn(async () => ({ ok: true, message: 'Tâche « X » créée.' }));
        setPendingCapabilityIntent({ capabilityId: 'task.item.create', payload: { task: { title: 'X' } } });

        register({ 'task.item.create': handler });
        // Réclamée SYNCHRONEMENT à l'enregistrement — avant même l'exécution.
        expect(getPendingCapabilityIntent()).toBeNull();

        // L'effet d'un écran comme SocialFeed tourne à CHAQUE rendu : on
        // simule deux rendus supplémentaires.
        register({ 'task.item.create': handler });
        register({ 'task.item.create': handler });
        await flushDeferred();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ task: { title: 'X' } });
        expect(outcomes).toEqual([
            { capabilityId: 'task.item.create', status: 'done', message: 'Tâche « X » créée.' },
        ]);
        // Le RÉSULTAT RÉEL est inscrit dans le fil de session, rôle architecte.
        const turns = getSessionTurns();
        expect(turns.some((t) => t.role === 'architecte' && t.text === 'Tâche « X » créée.')).toBe(true);
    });

    it('une intention EXPIRÉE n\'est jamais exécutée — et disparaît', async () => {
        vi.useFakeTimers();
        const handler = vi.fn(async () => ({ ok: true, message: 'ne doit jamais arriver' }));
        setPendingCapabilityIntent({ capabilityId: 'task.item.create' });

        // Au-delà du TTL (45 s) : caduque.
        vi.advanceTimersByTime(PENDING_CAPABILITY_INTENT_TTL_MS + 1000);
        register({ 'task.item.create': handler });
        await vi.runAllTimersAsync();

        expect(handler).not.toHaveBeenCalled();
        expect(outcomes).toEqual([]);
        expect(getPendingCapabilityIntent()).toBeNull();
    });

    it('capacité à confirmation (moderate) : refus → `cancelled`, handler JAMAIS appelé', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const handler = vi.fn(async () => ({ ok: true, message: 'ne doit jamais arriver' }));
        setPendingCapabilityIntent({ capabilityId: 'content.post.publish' });

        register({ 'content.post.publish': handler });
        await flushDeferred();

        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(handler).not.toHaveBeenCalled();
        expect(outcomes).toEqual([
            { capabilityId: 'content.post.publish', status: 'cancelled', message: "Action annulée — rien n'a été modifié." },
        ]);
    });

    it('capacité à confirmation acceptée : exécution réelle, statut du handler', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const handler = vi.fn(async () => ({ ok: true, message: 'Publication enregistrée.' }));
        setPendingCapabilityIntent({ capabilityId: 'content.post.publish' });

        register({ 'content.post.publish': handler });
        await flushDeferred();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(outcomes[0]).toEqual({ capabilityId: 'content.post.publish', status: 'done', message: 'Publication enregistrée.' });
    });

    it('échec du handler → `failed` rapporté UNE fois, aucune nouvelle tentative', async () => {
        const handler = vi.fn(async () => ({ ok: false, message: "La création n'a pas abouti." }));
        setPendingCapabilityIntent({ capabilityId: 'task.item.create' });

        register({ 'task.item.create': handler });
        // Rendus supplémentaires après l'échec : rien ne doit boucler.
        register({ 'task.item.create': handler });
        await flushDeferred();
        register({ 'task.item.create': handler });
        await flushDeferred();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(outcomes).toEqual([
            { capabilityId: 'task.item.create', status: 'failed', message: "La création n'a pas abouti." },
        ]);
    });

    it("une intention pour un identifiant NON enregistré reste en attente (pas de consommation à blanc)", async () => {
        const handler = vi.fn(async () => ({ ok: true, message: 'ok' }));
        setPendingCapabilityIntent({ capabilityId: 'live.session.create' });

        register({ 'task.item.create': handler });
        await flushDeferred();

        expect(handler).not.toHaveBeenCalled();
        expect(outcomes).toEqual([]);
        expect(getPendingCapabilityIntent()?.capabilityId).toBe('live.session.create');
    });
});

describe('cerveau — NAVIGATE + then (G1/G2)', () => {
    it("mémorise l'intention AVANT de rendre la main, sans annoncer de succès", async () => {
        (generateJSON as any).mockResolvedValueOnce({
            type: 'NAVIGATE',
            target: 'social',
            explanation: "J'ouvre le fil social et je lance votre direct.",
            then: { capabilityId: 'live.session.create', payload: { title: 'Entrepreneuriat' } },
        });

        const outcome = await runArchitecteCommand('lance un live sur l\'entrepreneuriat', {
            userName: 'Test', userLevel: 1, confirm: async () => true,
        });

        // Aucune exécution encore : pas de champ execution, l'intention attend.
        expect(outcome.execution).toBeUndefined();
        expect(outcome.action?.type).toBe('NAVIGATE');
        const pending = getPendingCapabilityIntent();
        expect(pending?.capabilityId).toBe('live.session.create');
        expect(pending?.payload).toEqual({ title: 'Entrepreneuriat' });
        expect(pending?.announced).toBe(true);

        // L'écran porteur arrive (confirmation acceptée — risque moderate) :
        // l'exécution réelle a lieu, le résultat réel est publié.
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const handler = vi.fn(async (p: any) => ({ ok: true, message: `Live « ${p.title} » ouvert.` }));
        register({ 'live.session.create': handler });
        await flushDeferred();

        expect(handler).toHaveBeenCalledWith({ title: 'Entrepreneuriat' });
        expect(outcomes[0]).toEqual({ capabilityId: 'live.session.create', status: 'done', message: 'Live « Entrepreneuriat » ouvert.' });
    });

    it('un `then` inventé (capacité hors registre) → navigation seule + aveu `unsupported`, aucune intention posée', async () => {
        (generateJSON as any).mockResolvedValueOnce({
            type: 'NAVIGATE',
            target: 'social',
            explanation: "J'ouvre le fil social et je fais une chose magique.",
            then: { capabilityId: 'social.magie.inventee', payload: {} },
        });

        const outcome = await runArchitecteCommand('fais un truc', {
            userName: 'Test', userLevel: 1, confirm: async () => true,
        });

        expect(outcome.execution?.phase).toBe('unsupported');
        expect(outcome.action?.then).toBeUndefined();
        expect(getPendingCapabilityIntent()).toBeNull();
    });

    it('`then` sur une capacité DÉJÀ exécutable → exécution immédiate par le chemin unique', async () => {
        const handler = vi.fn(async () => ({ ok: true, message: 'Tâche créée.' }));
        register({ 'task.item.create': handler });
        (generateJSON as any).mockResolvedValueOnce({
            type: 'NAVIGATE',
            target: 'home',
            explanation: "J'ouvre l'accueil et je crée la tâche.",
            then: { capabilityId: 'task.item.create', payload: { task: { title: 'Y' } } },
        });

        const outcome = await runArchitecteCommand('crée la tâche Y', {
            userName: 'Test', userLevel: 1, confirm: async () => true,
        });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(outcome.execution).toEqual({ phase: 'done', message: 'Tâche créée.' });
        expect(getPendingCapabilityIntent()).toBeNull();
    });
});

describe('découverte honnête (G5)', () => {
    it("liste d'abord les domaines réellement exécutables, puis « depuis l'écran concerné »", () => {
        const text = describeCapabilitiesForHumans(['task.item.create']);
        expect(text).toContain('vos tâches personnelles');
        expect(text).toContain("depuis l'écran concerné");
        // Le domaine tâches (exécutable) apparaît AVANT la clause « écran
        // concerné » ; le domaine LIVE (non exécutable ici) après.
        expect(text.indexOf('vos tâches personnelles')).toBeLessThan(text.indexOf("depuis l'écran concerné"));
        expect(text.indexOf('les sessions LIVE')).toBeGreaterThan(text.indexOf("depuis l'écran concerné"));
        // Plus jamais le libellé périmé.
        expect(text).not.toContain('pas encore accessible');
    });

    it('rien d\'exécutable → guidance assumée, jamais une promesse d\'action immédiate', () => {
        const text = describeCapabilitiesForHumans([]);
        expect(text).toMatch(/^Ici, je peux surtout vous guider/);
        expect(text).toContain("Depuis l'écran concerné");
    });

    it('sans paramètre (appelant historique), le résumé global est conservé', () => {
        const text = describeCapabilitiesForHumans();
        expect(text).toMatch(/^Je peux vous aider avec :/);
        expect(text).not.toContain("depuis l'écran concerné");
    });
});

describe('registre — live.session.create (G3)', () => {
    it('existe au registre plateforme, risque moderate → confirmation requise', () => {
        const cap = getCapability('live.session.create');
        expect(cap?.domain).toBe('live');
        expect(cap?.riskLevel).toBe('moderate');
        expect(cap?.confirmationRequired).toBe(true);
        expect(cap?.requiredPermission).toBe('aucune (action personnelle)');
    });

    it("est EXCLUE de getCapabilitiesByDomain('live') — l'écran LIVE ne doit jamais déclarer un handler qu'il n'a pas", () => {
        const liveScreenCaps = getCapabilitiesByDomain('live');
        expect(liveScreenCaps.some((c) => c.id === 'live.session.create')).toBe(false);
        // Les capacités internes du direct, elles, restent toutes présentes.
        expect(liveScreenCaps.some((c) => c.id === 'live.microphone.toggle')).toBe(true);
        expect(liveScreenCaps.length).toBe(14);
    });
});

describe('create_dossier legacy → task.dossier.create (G7)', () => {
    it('EXECUTE/target=create_dossier passe par le bus — même handler, résultat réel', async () => {
        const handler = vi.fn(async (p: any) => ({ ok: true, message: `Dossier « ${p.titre} » créé avec succès.` }));
        register({ 'task.dossier.create': handler });
        (generateJSON as any).mockResolvedValueOnce({
            type: 'EXECUTE',
            target: 'create_dossier',
            explanation: 'Ouverture du dossier.',
            payload: { titre: 'Emploi Canada', categorie: 'emploi' },
        });

        const outcome = await runArchitecteCommand('ouvre-moi un dossier emploi Canada', {
            userName: 'Test', userLevel: 1, confirm: async () => true,
        });

        expect(handler).toHaveBeenCalledWith({ titre: 'Emploi Canada', categorie: 'emploi' });
        expect(outcome.execution).toEqual({ phase: 'done', message: 'Dossier « Emploi Canada » créé avec succès.' });
    });

    it("sans écran porteur ni handler enregistré : `unavailable` honnête, jamais un faux succès", async () => {
        (generateJSON as any).mockResolvedValueOnce({
            type: 'EXECUTE',
            target: 'create_dossier',
            explanation: 'Ouverture du dossier.',
            payload: { titre: 'X' },
        });

        const outcome = await runArchitecteCommand('ouvre un dossier X', {
            userName: 'Test', userLevel: 1, confirm: async () => true,
        });

        expect(outcome.execution?.phase).toBe('unsupported');
        expect(outcome.execution?.message).toContain("l'écran qui la porte");
    });
});
