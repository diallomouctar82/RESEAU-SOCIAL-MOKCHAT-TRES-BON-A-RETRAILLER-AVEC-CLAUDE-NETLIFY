import { describe, expect, it } from 'vitest';
import { buildConsentRecap, CONSENT_STEPS, isConsentCommand } from '../services/architecte/consentFlow';

/**
 * Tests de la fiche de consentement (§9/§18 — formulaire réellement rempli
 * par la voix). La logique d'interprétation des réponses est déterministe et
 * testée ici ; l'écriture réelle (unique, après confirmation) est prouvée
 * dans le navigateur avec vérification en base.
 */

const step = (key: string) => CONSENT_STEPS.find((s) => s.key === key)!;

describe('Déclenchement', () => {
    it('reconnaît les formulations réelles', () => {
        expect(isConsentCommand('Je veux configurer mes autorisations')).toBe(true);
        expect(isConsentCommand('remplis ma fiche de consentement')).toBe(true);
        expect(isConsentCommand('paramètre tes autorisations')).toBe(true);
        expect(isConsentCommand('Emmène-moi sur le fil social')).toBe(false);
    });
});

describe('Réponses interprétées — jamais devinées', () => {
    it('nom : nettoie les tournures de politesse, refuse le vide', () => {
        expect(step('callName').parse('Appelle-moi Mamadou')).toBe('Mamadou');
        expect(step('callName').parse('Mon nom est Fatou Diop')).toBe('Fatou Diop');
        expect(step('callName').parse('a')).toBeUndefined();
    });

    it('portée : « étendu » vs « personnalisé/limité », relance sinon', () => {
        expect(step('scope').parse('le mode étendu')).toBe('etendu');
        expect(step('scope').parse('plutôt personnalisé')).toBe('limite');
        expect(step('scope').parse('limité aux fonctions choisies')).toBe('limite');
        expect(step('scope').parse('euh je ne sais pas')).toBeUndefined();
    });

    it('préparation automatique : oui/non réels, ambiguïté relancée', () => {
        expect(step('autoPrepare').parse('Oui, volontiers')).toBe(true);
        expect(step('autoPrepare').parse("Non, pas pour l'instant")).toBe(false);
        expect(step('autoPrepare').parse('peut-être')).toBeUndefined();
    });
});

describe('Récapitulatif — ce qui sera écrit, dit AVANT de l\'écrire', () => {
    it('reflète exactement les réponses données', () => {
        const recap = buildConsentRecap({ callName: 'Mamadou', scope: 'etendu', autoPrepare: true });
        expect(recap).toContain('« Mamadou »');
        expect(recap).toContain('mode étendu');
        expect(recap).toContain('autorisée');
        expect(recap).toContain('révocables');
        expect(recap).toContain("J'enregistre ?");
    });
});
