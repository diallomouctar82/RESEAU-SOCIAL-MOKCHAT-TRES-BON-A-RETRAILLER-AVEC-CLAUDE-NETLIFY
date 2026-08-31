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
    generateSpeechDetailed: vi.fn(async () => ({ audioBase64: '', mimeType: 'audio/mpeg' })),
    AiGatewayNetworkError: class extends Error { readonly isNetwork = true; },
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
    buildArchitecteGreeting,
    buildArchitecteSystemPrompt,
    describeArchitecteIdentity,
    isAffirmativeReply,
    isIdentityQuestion,
    isVagueNeed,
    isVisionQuestion,
    runArchitecteCommand,
} from '../services/architecte/architecteBrain';
import { generateJSON } from '../services/aiGateway';

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

describe('Comportement humain (Boucle 1) — identité unique et déterministe', () => {
    it('reconnaît les questions d\'identité, en français réel', () => {
        for (const q of [
            'Qui es-tu ?',
            "t'es qui toi",
            'tu es qui',
            "comment tu t'appelles ?",
            'Présente-toi',
            "c'est quoi l'architecte ?",
        ]) {
            expect(isIdentityQuestion(q), q).toBe(true);
        }
        for (const q of ['Emmène-moi sur le fil social', 'qui est le président du Sénégal', 'crée une tâche']) {
            expect(isIdentityQuestion(q), q).toBe(false);
        }
    });

    it('la présentation est stable, se nomme L\'Architecte, et utilise le nom choisi', () => {
        const anonyme = describeArchitecteIdentity();
        expect(anonyme).toContain("L'Architecte");
        expect(anonyme).not.toContain('Diallo');
        const nomme = describeArchitecteIdentity('Mamadou');
        expect(nomme).toContain('Mamadou');
    });

    it('« Qui es-tu ? » est traité SANS appel au modèle et inscrit 2 tours en session', async () => {
        vi.mocked(generateJSON).mockClear();
        const outcome = await runArchitecteCommand('Qui es-tu ?', {
            userName: 'Test', userLevel: 1, confirm: () => true,
        });
        expect(outcome.handledLocally).toBe(true);
        expect(outcome.spoken).toContain("L'Architecte");
        expect(generateJSON).not.toHaveBeenCalled();
        expect(getSessionTurns()).toHaveLength(2);
    });

    it('le prompt du cerveau impose UNE SEULE identité — jamais « Diallo OS »', () => {
        const prompt = buildArchitecteSystemPrompt('Test', 1);
        expect(prompt).toContain("Tu es L'ARCHITECTE");
        expect(prompt).toContain('UNE SEULE IDENTITÉ');
        expect(prompt).not.toContain('Tu es Diallo OS');
        expect(prompt).not.toContain('Cabinet Famille Diallo');
    });

    it('le prompt porte les règles de conduite : besoin flou, rythme adapté, pas de récitation', () => {
        const prompt = buildArchitecteSystemPrompt('Test', 1);
        expect(prompt).toContain('BESOIN FLOU');
        expect(prompt).toContain('apprendre, travailler, communiquer, créer');
        expect(prompt).toContain('ADAPTE ton rythme');
        expect(prompt).toContain('Ne récite jamais spontanément');
    });

    it('le prompt exige la production écrite COMPLÈTE et propose les outils au bon moment (Équipe C)', () => {
        const prompt = buildArchitecteSystemPrompt('Test', 1);
        expect(prompt).toContain('PRODUCTION ÉCRITE');
        expect(prompt).toContain('PRODUCTION COMPLÈTE');
        expect(prompt).toContain('pas un résumé ni une promesse');
        expect(prompt).toContain('OUTILS AU BON MOMENT');
        expect(prompt).toContain('je peux ouvrir la caméra si vous voulez');
    });

    it('le nom choisi (fiche de consentement) est injecté et jamais redemandé', () => {
        const prompt = buildArchitecteSystemPrompt('Test', 1, 'Mamadou');
        expect(prompt).toContain('« Mamadou »');
        expect(prompt).toContain('ne le redemande jamais');
        expect(buildArchitecteSystemPrompt('Test', 1)).not.toContain('ne le redemande jamais');
    });
});

describe('Comportement humain (Boucle 1) — accueil différencié', () => {
    it('première rencontre (pas de fiche) : accueil complet qui se présente et propose la fiche', () => {
        const greeting = buildArchitecteGreeting(null, 'Mamadou');
        expect(greeting.firstMeeting).toBe(true);
        expect(greeting.text).toContain('bienvenue');
        expect(greeting.text).toContain("L'Architecte");
        expect(greeting.text).toContain('Voulez-vous');
    });

    it('personne connue (fiche existante) : accueil léger avec son nom, sans refaire l\'onboarding', () => {
        const greeting = buildArchitecteGreeting({ callName: 'Mamadou' }, 'Autre');
        expect(greeting.firstMeeting).toBe(false);
        expect(greeting.text).toBe("Bonjour Mamadou. Que puis-je faire pour vous aujourd'hui ?");
        expect(greeting.text).not.toContain('bienvenue');
    });

    it('le besoin flou PUR est reconnu — une phrase qui porte un sujet ne l\'est pas', () => {
        for (const v of ['Je ne sais pas trop.', 'je sais pas quoi faire', 'aucune idée', "j'hésite"]) {
            expect(isVagueNeed(v), v).toBe(true);
        }
        for (const c of ['je ne sais pas comment faire un CV', "je veux apprendre l'allemand", 'je ne sais pas si mon visa est prêt']) {
            expect(isVagueNeed(c), c).toBe(false);
        }
    });

    it('« Je ne sais pas trop. » reçoit UNE question douce par familles — sans appel au modèle', async () => {
        vi.mocked(generateJSON).mockClear();
        const outcome = await runArchitecteCommand('Je ne sais pas trop.', {
            userName: 'Test', userLevel: 1, callName: 'Mamadou', confirm: () => true,
        });
        expect(outcome.handledLocally).toBe(true);
        expect(outcome.spoken).toContain('Mamadou');
        expect(outcome.spoken).toContain('apprendre');
        expect(outcome.spoken).toContain('organiser');
        expect(generateJSON).not.toHaveBeenCalled();
    });

    it('un « oui » court est une acceptation — une phrase qui continue est une commande', () => {
        for (const yes of ['oui', 'Oui !', "d'accord", 'ok', 'vas-y', 'je veux bien']) {
            expect(isAffirmativeReply(yes), yes).toBe(true);
        }
        for (const no of ['oui je veux voyager au Canada', 'non', 'oui mais plus tard', 'ouvre le campus']) {
            expect(isAffirmativeReply(no), no).toBe(false);
        }
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
