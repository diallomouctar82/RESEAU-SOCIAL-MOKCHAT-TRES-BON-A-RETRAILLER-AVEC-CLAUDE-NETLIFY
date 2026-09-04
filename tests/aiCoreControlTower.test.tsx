import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiCoreControlTowerView } from '../components/admin/AiCoreControlTowerView';
import {
    EntreesTourDeControle,
    construireEtat,
} from '../services/aiCoreControlTowerModel';

/**
 * Tour de contrôle AI Core — Administrateur Général.
 *
 * Ce que ces tests protègent, dans l'ordre d'importance :
 *
 *  1. AUCUN FAUX VERT. C'est la raison d'être de l'écran. Un tableau de bord
 *     qui affiche « tout va bien » alors qu'AI Core n'oriente aucun agent est
 *     pire que pas de tableau de bord du tout. Plusieurs cas ci-dessous
 *     échouent délibérément si un état non mesuré glissait vers le vert.
 *  2. Le libellé de chaque pastille. Le composant a été livré une première fois
 *     avec des pastilles VIDES — la prop s'appelait `enfants` alors que JSX ne
 *     remplit que `children`, sans la moindre erreur à l'écran ni au typage.
 *     Le test « le statut global est lisible » ferme cette porte.
 *  3. La lecture seule : aucune commande d'activation ne doit apparaître.
 */

/** Entrées minimales, toutes surfaces lisibles, tout ouvert. */
const entreesToutOuvert = (): EntreesTourDeControle => ({
    manifeste: {
        genereLe: '2026-09-04T06:00:00.000Z',
        commit: 'abc1234',
        branche: 'main',
        verrou1_executeur: { present: true, enregistre: true, fichier: 'x.ts' },
        verrou5_identiteAgent: { appelsLlmTotal: 10, appelsAvecAgentId: 10, fichiers: [] },
        journalisation: { agentIdEcrit: true, outilsEcrits: true },
        migrations: { dansLeDepot: 103, migrationsEnBase: 103, releveLe: '2026-09-04', methode: 'test' },
        tests: { fichiersVitest: 60, fichiersCouvrantAiCore: 2, fichiersDeno: 1 },
    },
    outils: [{ id: 'search_ai_core_memory', display_name: 'Mémoire institutionnelle', is_enabled: true }],
    droits: [{ agent_id: '1', tool_id: 'search_ai_core_memory', is_enabled: true }],
    agentsBase: [{ id: '1', name: 'Diallo', is_human: false, is_active: true }],
    sondeAgentId: { etat: 'ouvert', raison: '' },
    sondeToolsUsed: { etat: 'ouvert', raison: '' },
    appelsAiCore: { mesurable: true, nombre: 12, raison: 'compté' },
    echecs: {},
    releveLe: '2026-09-04T06:15:00.000Z',
});

/** L'état RÉEL relevé en production le 4 septembre 2026. */
const entreesReelles = (): EntreesTourDeControle => ({
    ...entreesToutOuvert(),
    manifeste: {
        ...entreesToutOuvert().manifeste!,
        verrou5_identiteAgent: { appelsLlmTotal: 87, appelsAvecAgentId: 4, fichiers: [] },
        journalisation: { agentIdEcrit: false, outilsEcrits: false },
        migrations: { dansLeDepot: 2, migrationsEnBase: 103, releveLe: '2026-09-04', methode: 'list_migrations' },
        tests: { fichiersVitest: 56, fichiersCouvrantAiCore: 0, fichiersDeno: 0 },
    },
    outils: [
        { id: 'web_search', display_name: 'Recherche web', is_enabled: true },
        { id: 'search_ai_core_memory', display_name: 'Mémoire institutionnelle', is_enabled: false },
    ],
    droits: [
        { agent_id: '1', tool_id: 'web_search', is_enabled: true },
        { agent_id: 'architecte', tool_id: 'web_search', is_enabled: true },
    ],
    agentsBase: [{ id: '1', name: 'Diallo', is_human: false, is_active: true }],
    sondeAgentId: { etat: 'ferme', raison: 'colonne absente' },
    sondeToolsUsed: { etat: 'ferme', raison: 'colonne absente' },
    appelsAiCore: { mesurable: false, nombre: null, raison: 'colonne tools_used absente' },
});

describe('Tour de contrôle AI Core — le calcul', () => {
    it("l'état réel du 4 septembre est ROUGE, pas orange ni vert", () => {
        const etat = construireEtat(entreesReelles());
        expect(etat.statutGlobal).toBe('rouge');
        expect(etat.resumeGlobal).toContain("n'oriente aucun agent");
    });

    it('un verrou non éprouvé ne peut JAMAIS produire un statut vert', () => {
        // Tout est ouvert et mesuré, sauf le jeton de service qui n'est pas
        // lisible depuis un navigateur : le verdict doit rester orange.
        const etat = construireEtat(entreesToutOuvert());
        const jeton = etat.verrous.find((v) => v.numero === 4)!;
        expect(jeton.etat).toBe('inconnu');
        expect(etat.statutGlobal).toBe('orange');
        expect(etat.statutGlobal).not.toBe('vert');
    });

    it('le verrou du catalogue suit `is_enabled`, pas la présence de la ligne', () => {
        const ferme = construireEtat(entreesReelles()).verrous.find((v) => v.numero === 2)!;
        expect(ferme.etat).toBe('ferme');
        const ouvert = construireEtat(entreesToutOuvert()).verrous.find((v) => v.numero === 2)!;
        expect(ouvert.etat).toBe('ouvert');
    });

    it("un droit accordé sur un outil coupé n'ouvre pas le verrou 3", () => {
        const entrees = entreesReelles();
        entrees.droits = [{ agent_id: '1', tool_id: 'search_ai_core_memory', is_enabled: true }];
        const etat = construireEtat(entrees);
        // Le droit existe : verrou 3 ouvert…
        expect(etat.verrous.find((v) => v.numero === 3)!.etat).toBe('ouvert');
        // …mais l'interrupteur global reste fermé, donc le statut reste rouge.
        expect(etat.verrous.find((v) => v.numero === 2)!.etat).toBe('ferme');
        expect(etat.statutGlobal).toBe('rouge');
    });

    it("un agent qui détient des droits sans exister en base est signalé, pas masqué", () => {
        const etat = construireEtat(entreesReelles());
        const architecte = etat.agents.find((a) => a.id === 'architecte')!;
        expect(architecte).toBeDefined();
        expect(architecte.presentEnBase).toBe(false);
        expect(etat.architecte.pilotableDepuisLaConsole).toBe(false);
        expect(etat.anglesMorts.join(' ')).toContain("n'est pas dans la table agents");
    });

    it("l'usage d'AI Core non traçable devient un angle mort déclaré, pas un zéro", () => {
        const etat = construireEtat(entreesReelles());
        expect(etat.appelsAiCore.mesurable).toBe(false);
        expect(etat.appelsAiCore.nombre).toBeNull();
        expect(etat.anglesMorts.join(' ')).toContain('non traçable');
    });

    it('une base illisible donne INCONNU, jamais un faux rouge rassurant', () => {
        const entrees = entreesReelles();
        entrees.echecs = { outils: 'permission denied', droits: 'permission denied' };
        const etat = construireEtat(entrees);
        expect(etat.statutGlobal).toBe('inconnu');
        expect(etat.erreurs.length).toBeGreaterThan(0);
    });

    it('la majorité des appels sans identité d\'agent ferme le verrou 5', () => {
        expect(construireEtat(entreesReelles()).verrous.find((v) => v.numero === 5)!.etat).toBe('ferme');
        expect(construireEtat(entreesToutOuvert()).verrous.find((v) => v.numero === 5)!.etat).toBe('ouvert');
    });
});

describe('Tour de contrôle AI Core — la vue', () => {
    it('le statut global est LISIBLE (les pastilles ne sont pas vides)', () => {
        render(<AiCoreControlTowerView etat={construireEtat(entreesReelles())} />);
        expect(screen.getByText('ROUGE — NON CONFORME')).toBeInTheDocument();
        // Régression protégée : la prop `children` des pastilles.
        expect(screen.getByText('Non éprouvé')).toBeInTheDocument();
        expect(screen.getByText('Lecture seule — aucune action possible ici')).toBeInTheDocument();
    });

    it('les cinq verrous sont rendus, chacun avec son état', () => {
        render(<AiCoreControlTowerView etat={construireEtat(entreesReelles())} />);
        for (const n of [1, 2, 3, 4, 5]) {
            expect(screen.getByText(`Verrou ${n}`)).toBeInTheDocument();
        }
        expect(screen.getByText('Exécuteur déployé')).toBeInTheDocument();
        expect(screen.getByText('Jeton de service AI Core')).toBeInTheDocument();
    });

    it("l'origine de chaque information est affichée, jamais implicite", () => {
        render(<AiCoreControlTowerView etat={construireEtat(entreesReelles())} />);
        expect(screen.getAllByText('mesuré au build').length).toBeGreaterThan(0);
        expect(screen.getAllByText('lu en base').length).toBeGreaterThan(0);
        expect(screen.getByText('non lisible ici')).toBeInTheDocument();
    });

    it("l'agent hors base porte un badge explicite dans le tableau des droits", () => {
        render(<AiCoreControlTowerView etat={construireEtat(entreesReelles())} />);
        expect(screen.getByText('Absent de la table agents')).toBeInTheDocument();
    });

    it('les angles morts sont affichés à l\'écran, pas seulement en donnée', () => {
        render(<AiCoreControlTowerView etat={construireEtat(entreesReelles())} />);
        expect(screen.getByText('Ce que cette console ne voit pas')).toBeInTheDocument();
    });

    it("la vue n'expose AUCUNE commande d'activation ou d'octroi de droit", () => {
        const { container } = render(<AiCoreControlTowerView etat={construireEtat(entreesReelles())} />);
        // La vue pure ne contient aucun bouton : « Actualiser » appartient au
        // conteneur, et il ne fait que relire.
        expect(container.querySelectorAll('button').length).toBe(0);
        expect(container.querySelectorAll('input, select').length).toBe(0);
        const texte = container.textContent || '';
        for (const interdit of ['Activer', 'Accorder', 'Déployer', 'Supprimer']) {
            expect(texte).not.toContain(interdit);
        }
    });

    it('les lectures en échec sont affichées, jamais avalées', () => {
        const entrees = entreesReelles();
        entrees.echecs = { outils: 'permission denied pour ai_tools' };
        render(<AiCoreControlTowerView etat={construireEtat(entrees)} />);
        const bloc = screen.getByText('Lectures en échec').closest('div')!;
        expect(within(bloc).getByText(/permission denied pour ai_tools/)).toBeInTheDocument();
    });
});
