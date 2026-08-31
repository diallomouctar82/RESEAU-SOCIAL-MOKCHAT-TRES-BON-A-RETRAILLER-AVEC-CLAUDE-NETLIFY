import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AGENTS } from '../constants';
import { AgentToolsMatrix } from '../components/admin/AgentToolsMatrix';

/**
 * Équipe Mobile + Super Admin — défaut D7.
 *
 * La vue Super-Admin des assistants filtrait !isHuman (10/13 affichés) et
 * n'exposait ni le statut de disponibilité ni le moteur réellement utilisé.
 * Vérifié dans le code : ChatInterface appelle generateTextDetailed
 * (services/aiGateway) SANS modelId épinglé — l'orchestrateur central
 * choisit le fournisseur. Afficher le modelConfig.model historique
 * (gemini-*) serait donc une information fausse.
 */

vi.mock('../services/aiOrchestratorAdmin', () => ({
    listToolMatrix: vi.fn(async () => [
        {
            toolId: 'web_search',
            displayName: 'Recherche Web',
            description: 'Recherche d’informations à jour sur le web.',
            category: 'search' as const,
            requiresConfirmation: false,
            requiresAuth: false,
            toolEnabled: true,
            grants: { '1': true },
        },
    ]),
    setAgentToolEnabled: vi.fn(async () => {}),
    setToolEnabled: vi.fn(async () => {}),
}));

const HUMAN_BADGE = 'Humain — pas d’outils IA';
const ENGINE_LABEL = 'Orchestrateur central (sélection auto)';

const humanAgents = AGENTS.filter((a) => a.isHuman);
const aiAgents = AGENTS.filter((a) => !a.isHuman);

describe('AgentToolsMatrix — vue Super-Admin des 13 assistants', () => {
    it('affiche les 13 assistants : les humains présents et distinctement badgés', async () => {
        render(<AgentToolsMatrix />);
        // Fin du chargement : l'outil mocké est rendu.
        expect(await screen.findByText('Recherche Web')).toBeInTheDocument();

        for (const human of humanAgents) {
            // Roster + grille d'outils : chaque humain apparaît au moins une fois.
            expect(screen.getAllByText(human.name).length).toBeGreaterThanOrEqual(1);
        }
        // 3 badges dans le roster + 3 cellules inertes dans l'unique outil mocké.
        expect(screen.getAllByText(HUMAN_BADGE).length).toBeGreaterThanOrEqual(humanAgents.length);
    });

    it('les humains n’ont AUCUN interrupteur d’outil ; les experts IA en gardent un', async () => {
        render(<AgentToolsMatrix />);
        await screen.findByText('Recherche Web');

        for (const human of humanAgents) {
            for (const el of screen.getAllByText(human.name)) {
                expect(el.closest('button')).toBeNull();
            }
        }
        // Chaque expert IA a bien sa case-bouton dans la grille de l'outil.
        for (const ai of aiAgents) {
            const asButton = screen
                .getAllByText(ai.name)
                .some((el) => el.closest('button') !== null);
            expect(asButton).toBe(true);
        }
    });

    it('affiche le statut de disponibilité et le moteur RÉEL (orchestrateur central), jamais le modelConfig historique', async () => {
        render(<AgentToolsMatrix />);
        await screen.findByText('Recherche Web');

        // Un libellé moteur par expert IA (10), aucun pour les humains.
        expect(screen.getAllByText(ENGINE_LABEL)).toHaveLength(aiAgents.length);
        // Statuts réels du catalogue : 10 IA « available », 3 humains « appointment_only ».
        expect(screen.getAllByText('Disponible')).toHaveLength(10);
        expect(screen.getAllByText('Sur rendez-vous')).toHaveLength(3);
        // Jamais une info fausse : les modèles épinglés historiques ne sont pas affichés.
        expect(screen.queryByText(/gemini-2\.5-flash/)).toBeNull();
        expect(screen.queryByText(/gemini-3-pro-preview/)).toBeNull();
    });
});
