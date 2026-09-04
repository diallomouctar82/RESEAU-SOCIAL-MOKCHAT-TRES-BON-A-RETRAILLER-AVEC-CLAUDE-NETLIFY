import { describe, it, expect } from 'vitest';
import { composeStage, stageGridClass, STAGE_VISIBLE_MAX } from '../hooks/useLiveTransport';

/**
 * DS-L0 — la scène d'un LIVE MokNet montre SIX cartes au minimum
 * (1 hôte + 5 invités), humains et agents IA confondus.
 *
 * Le test central est « un agent invité garde sa carte quand un humain
 * publie » : c'est exactement ce que l'ancienne scène ne faisait pas
 * (la carte de l'agent n'existait que `si aucun humain distant ne publiait`),
 * et c'est ce qui rendait la règle impossible à tenir à l'écran.
 */

const humain = (n: number) => ({ id: `h${n}`, name: `Humain ${n}` });
const agent = (nom: string) => ({ id: nom.toLowerCase(), name: nom });

describe('composition de la scène LIVE', () => {
    it('scène vide : un seul emplacement d’attente, jamais un écran noir', () => {
        const s = composeStage({ isUserOnStage: false, humans: [], agents: [] });
        expect(s.tiles).toHaveLength(1);
        expect(s.tiles[0].kind).toBe('placeholder');
        expect(s.presenceCount).toBe(0);
    });

    it('hôte seul : une carte pleine scène', () => {
        const s = composeStage({ isUserOnStage: true, selfName: 'Mamadou', humans: [], agents: [] });
        expect(s.tiles.map(t => t.kind)).toEqual(['self']);
        expect(s.tiles[0].name).toBe('Mamadou');
    });

    it('LE DÉFAUT CORRIGÉ : un agent invité garde sa carte quand un humain publie', () => {
        const s = composeStage({
            isUserOnStage: true,
            humans: [humain(1)],
            agents: [agent('Santé')],
        });
        expect(s.tiles.map(t => t.kind)).toEqual(['self', 'human', 'agent']);
        // L'ancienne scène n'affichait l'agent que si presentableRemotes.length === 0.
        expect(s.tiles.some(t => t.kind === 'agent')).toBe(true);
    });

    it('cinq agents de métiers différents cohabitent avec l’hôte : six cartes, zéro débordement', () => {
        const s = composeStage({
            isUserOnStage: true,
            selfName: 'Hôte',
            humans: [],
            agents: [agent('Santé'), agent('Enseignement'), agent('Partenariats'), agent('Commercial'), agent('Architecte')],
        });
        expect(s.tiles).toHaveLength(6);
        expect(s.overflow).toBe(0);
        expect(s.presenceCount).toBe(6);
        expect(s.tiles.filter(t => t.kind === 'agent')).toHaveLength(5);
    });

    it('mélange humains + agents jusqu’à six, dans l’ordre hôte → humains → agents', () => {
        const s = composeStage({
            isUserOnStage: true,
            humans: [humain(1), humain(2)],
            agents: [agent('Santé'), agent('Commercial'), agent('Architecte')],
        });
        expect(s.tiles.map(t => t.kind)).toEqual(['self', 'human', 'human', 'agent', 'agent', 'agent']);
        expect(s.overflow).toBe(0);
    });

    it('au-delà de six : six cartes visibles et un débordement EXACT, jamais un chiffre décoratif', () => {
        const s = composeStage({
            isUserOnStage: true,
            humans: [humain(1), humain(2), humain(3)],
            agents: [agent('A'), agent('B'), agent('C'), agent('D')],
        });
        expect(s.tiles).toHaveLength(STAGE_VISIBLE_MAX);
        expect(s.presenceCount).toBe(8);
        expect(s.overflow).toBe(2);
    });

    it('spectateur sans caméra : sa propre carte n’occupe jamais la scène', () => {
        const s = composeStage({ isUserOnStage: false, humans: [humain(1)], agents: [agent('Santé')] });
        expect(s.tiles.map(t => t.kind)).toEqual(['human', 'agent']);
        expect(s.tiles.some(t => t.kind === 'self')).toBe(false);
    });

    it('identifiants stables et distincts (clés de rendu)', () => {
        const s = composeStage({ isUserOnStage: true, humans: [humain(1)], agents: [agent('Santé')] });
        expect(new Set(s.tiles.map(t => t.id)).size).toBe(s.tiles.length);
        expect(s.tiles.map(t => t.id)).toEqual(['self', 'human:h1', 'agent:santé']);
    });
});

describe('grille de la scène', () => {
    it('1 à 4 cartes : comportement conservé (aucune régression)', () => {
        expect(stageGridClass(1)).toBe('grid-cols-1 grid-rows-1');
        expect(stageGridClass(2)).toBe('grid-cols-1 sm:grid-cols-2');
        expect(stageGridClass(3)).toBe('grid-cols-2');
        expect(stageGridClass(4)).toBe('grid-cols-2');
    });

    it('5 et 6 cartes : deux colonnes sur téléphone, trois sur ordinateur', () => {
        expect(stageGridClass(5)).toBe('grid-cols-2 md:grid-cols-3');
        expect(stageGridClass(6)).toBe('grid-cols-2 md:grid-cols-3');
    });

    it('au-delà de six, la grille s’adapte au lieu de figer trois colonnes', () => {
        expect(stageGridClass(7)).toContain('auto-fit');
    });
});
