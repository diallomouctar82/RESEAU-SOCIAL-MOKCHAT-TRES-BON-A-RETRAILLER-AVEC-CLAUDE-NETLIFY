import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HEALTH_LINES } from '../services/health/healthRegistry';
import { buildReport } from '../services/health/healthScore';
import { buildSecurityReport } from '../services/health/securityAudit';
import { DiagnosisPlan, HealthStatus, ProbeOutcome, RemediationOutcome } from '../services/health/healthTypes';
import { SYSTEM_PROMPT } from '../services/health/assistant/assistantBrain';

/**
 * Tests DOM de l'Assistant Santé Globale.
 *
 * Le moteur (repairCampaign) et le cerveau (assistantBrain) sont testés à
 * part ; ici on vérifie ce que la Direction VOIT et CLIQUE : les libellés
 * honnêtes selon le rang, la campagne « rouges seuls » de bout en bout
 * (diagnostic → une confirmation → réparation → 100 %), l'échec avec cause,
 * étapes et lien, l'arrêt immédiat quand c'est incontrôlable, les consignes
 * écrites et vocales, la question libre étiquetée « IA », la restauration du lot.
 */

const voix = vi.hoisted(() => ({
    speak: vi.fn(async (_t: string) => {}),
    startListening: vi.fn(async () => true),
    stopListening: vi.fn(),
    stopSpeaking: vi.fn(),
    onFinalTranscript: null as null | ((t: string) => void),
}));

vi.mock('../hooks/useVoiceAssistant', () => ({
    useVoiceAssistant: (options: { onFinalTranscript?: (t: string) => void }) => {
        voix.onFinalTranscript = options.onFinalTranscript ?? null;
        return {
            isListening: false, isSpeaking: false, isSupported: true, volume: 0, transcript: '', error: null,
            conversationalTurn: null, ttsEngine: null,
            startListening: voix.startListening, stopListening: voix.stopListening, speak: voix.speak, stopSpeaking: voix.stopSpeaking,
            setConversationalMode: vi.fn(), resolveVoiceId: () => 'voix',
        };
    },
}));
vi.mock('../components/Avatar3D', () => ({
    Avatar3D: ({ state }: { state: string }) => <div data-testid="avatar" data-state={state} />,
}));
vi.mock('../services/voiceEngine', () => ({
    ELEVENLABS_CURATED_VOICES: { directeur: { id: 'voix-directeur' } },
}));
vi.mock('../services/aiGateway', () => ({ generateText: vi.fn() }));
vi.mock('../services/health/healthService', () => ({ diagnose: vi.fn(), repair: vi.fn(), restore: vi.fn() }));

import { HealthAssistant } from '../components/admin/HealthAssistant';

// ── Fixture : deux rouges automatiques, un orange automatique, un rouge manuel.
const autos = HEALTH_LINES.filter((l) => l.remediation && l.location !== 'humain');
const manuels = HEALTH_LINES.filter((l) => !l.remediation && l.humanAction && l.location !== 'humain');
const ROUGE_A = autos[0].id;
const ROUGE_B = autos[1].id;
const ORANGE_A = autos[2].id;
const ROUGE_MANUEL = manuels[0].id;

const outcome = (lineId: string, status: HealthStatus): ProbeOutcome => ({
    lineId, status, proofLevel: status === 'blanc' ? 'non_eprouve' : 'reel', measured: `mesure ${status}`, ranAt: new Date().toISOString(),
});

function rapport() {
    const rouges = new Set([ROUGE_A, ROUGE_B, ROUGE_MANUEL]);
    const oranges = new Set([ORANGE_A]);
    return buildReport(HEALTH_LINES.map((l) => {
        if (l.location === 'humain') return outcome(l.id, 'blanc');
        if (rouges.has(l.id)) return outcome(l.id, 'rouge');
        if (oranges.has(l.id)) return outcome(l.id, 'orange');
        return outcome(l.id, 'vert');
    }));
}

const plan = (lineId: string, remediationId: string, affectedCount = 3): DiagnosisPlan => ({
    lineId, remediationId, summary: `${affectedCount} éléments à corriger`, affectedCount, affectedTables: ['public.table_test'],
    sample: [], reversible: true, confirmationToken: 'jeton', expiresAt: new Date(Date.now() + 300_000).toISOString(),
});

const ok = (lineId: string, remediationId: string): RemediationOutcome => ({
    lineId, remediationId, ok: true, snapshotId: `snap-${lineId}`, changedCount: 3,
    verification: outcome(lineId, 'vert'), message: 'Réparation appliquée.', journalId: 'j1',
});

function monter(overrides: Partial<React.ComponentProps<typeof HealthAssistant>> = {}) {
    const report = rapport();
    const deps = {
        diagnose: vi.fn(async (lineId: string, remediationId: string) => plan(lineId, remediationId)),
        repair: vi.fn(async (lineId: string, remediationId: string) => ok(lineId, remediationId)),
        restore: vi.fn(async (lineId: string, _snapshotId: string) => ({ ...ok(lineId, 'r'), message: 'Restauré.' })),
    };
    const props: React.ComponentProps<typeof HealthAssistant> = {
        snapshot: { report, rank: { role: 'super_admin', canRead: true, canRepair: true }, serverError: null },
        securite: buildSecurityReport(report),
        rank: { role: 'super_admin', canRead: true, canRepair: true },
        analysing: false,
        phases: [],
        onAnalyser: vi.fn(async () => {}),
        onOuvrirLigne: vi.fn(),
        onApresCampagne: vi.fn(async () => {}),
        deps,
        ia: vi.fn(async () => 'Réponse de la passerelle.'),
        ...overrides,
    };
    const utils = render(<HealthAssistant {...props} />);
    return { ...utils, props, deps, report };
}

async function confirmerLot() {
    const modale = await screen.findByRole('dialog');
    fireEvent.click(within(modale).getByRole('checkbox'));
    fireEvent.click(within(modale).getByRole('button', { name: /Appliquer le lot/ }));
}

beforeEach(() => {
    voix.speak.mockClear();
    voix.startListening.mockClear();
    voix.stopListening.mockClear();
    voix.stopSpeaking.mockClear();
    window.localStorage.clear();
});

describe('libellés honnêtes selon le rang', () => {
    it('dit le bilan à l\'écran au chargement, sans parler (aucune voix non demandée)', async () => {
        monter();
        expect(await screen.findByText(/Bilan de MokNet : état rouge/)).toBeInTheDocument();
        expect(voix.speak).not.toHaveBeenCalled();
    });

    it('en rang admin : « Diagnostiquer » partout, et le chip « Diagnostic seulement »', () => {
        monter({ rank: { role: 'admin', canRead: true, canRepair: false } });
        expect(screen.getByText(/Diagnostic seulement — rang admin/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /les rouges seuls/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Réparer/ })).toBeNull();
        expect(screen.getByText('Diagnostiquer')).toBeInTheDocument();
    });

    it('en rang Admin Général : les boutons portent les comptes réels (3 rouges, 1 orange, 4 au total)', () => {
        monter();
        expect(screen.getByRole('button', { name: /tout le lot \(4\)/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /les rouges seuls \(3\)/ })).toBeEnabled();
        expect(screen.getByRole('button', { name: /les oranges seuls \(1\)/ })).toBeEnabled();
    });
});

describe('campagne « les rouges seuls »', () => {
    it('diagnostique, demande UNE confirmation, répare, atteint 100 % et remesure', async () => {
        const { deps, props } = monter();
        fireEvent.click(screen.getByRole('button', { name: /les rouges seuls/ }));

        const modale = await screen.findByRole('dialog');
        expect(within(modale).getByText(/Appliquer les rouges seuls \?/)).toBeInTheDocument();
        expect(deps.diagnose).toHaveBeenCalledTimes(2);            // ROUGE_A, ROUGE_B — pas le manuel
        expect(deps.repair).not.toHaveBeenCalled();                // rien avant la confirmation
        const appliquer = within(modale).getByRole('button', { name: /Appliquer le lot \(2\)/ });
        expect(appliquer).toBeDisabled();                          // tant que le périmètre n'est pas lu
        fireEvent.click(within(modale).getByRole('checkbox'));
        fireEvent.click(appliquer);

        await waitFor(() => expect(deps.repair).toHaveBeenCalledTimes(2));
        expect(deps.repair).toHaveBeenCalledWith(ROUGE_A, autos[0].remediation!.id, 'jeton');
        await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100'));
        expect(screen.getByText(/Terminé/)).toBeInTheDocument();
        expect(screen.getAllByText('Réparé et vérifié')).toHaveLength(2);
        expect(screen.getByText('Action manuelle requise')).toBeInTheDocument();
        expect(screen.getAllByText(/2 réparés/).length).toBeGreaterThan(0);   // dit dans le dialogue ET dans le résumé
        await waitFor(() => expect(props.onApresCampagne).toHaveBeenCalledTimes(1));
        expect(screen.getByRole('button', { name: /Restaurer le lot \(2\)/ })).toBeInTheDocument();
    });

    it('lot refusé : rien n\'est appliqué, et on le dit', async () => {
        const { deps } = monter();
        fireEvent.click(screen.getByRole('button', { name: /les rouges seuls/ }));
        const modale = await screen.findByRole('dialog');
        fireEvent.click(within(modale).getByRole('button', { name: /Annuler — rien n'est appliqué/ }));
        expect(await screen.findByText('Lot non confirmé')).toBeInTheDocument();
        expect(deps.repair).not.toHaveBeenCalled();
        expect(screen.getAllByText('Non tenté')).toHaveLength(2);
    });
});

describe('échecs : cause, étapes exactes et lien', () => {
    it('un point qui échoue affiche sa cause, ses étapes et ouvre la fiche', async () => {
        const { deps, props } = monter();
        deps.repair.mockImplementation(async (lineId: string, remediationId: string) => {
            if (lineId === ROUGE_A) throw new Error('Contrainte violée sur table_test');
            return ok(lineId, remediationId);
        });
        fireEvent.click(screen.getByRole('button', { name: /les rouges seuls/ }));
        await confirmerLot();

        await screen.findByText('Échec');
        expect(screen.getByText('Contrainte violée sur table_test')).toBeInTheDocument();
        expect(screen.getByText('Étapes exactes')).toBeInTheDocument();
        expect(screen.getByText(/Relancer ce point seul/)).toBeInTheDocument();
        expect(screen.getByText('Réparé et vérifié')).toBeInTheDocument();  // le second point a continué
        const fiches = screen.getAllByRole('button', { name: /Ouvrir la fiche/ });
        fireEvent.click(fiches[0]);
        expect(props.onOuvrirLigne).toHaveBeenCalledWith(ROUGE_A);
    });

    it('situation incontrôlable (serveur) : arrêt immédiat, aucune réparation, retour à l\'état stable proposé', async () => {
        const { deps } = monter();
        deps.diagnose.mockRejectedValue(new Error('Edge Function returned a non-2xx status code'));
        fireEvent.click(screen.getByRole('button', { name: /tout le lot/ }));
        expect(await screen.findByText('Arrêt immédiat — situation incontrôlable')).toBeInTheDocument();
        expect(screen.getAllByText(/Diagnostic impossible sur/).length).toBeGreaterThan(0);
        // 3 points automatiques × 2 phases = 6 boucles ; l'arrêt survient après la première.
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(Math.round(100 / 6)));
        expect(deps.repair).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.getByText('Échec')).toBeInTheDocument();
        expect(screen.getAllByText('Non tenté').length).toBeGreaterThan(0);
    });
});

describe('consignes écrites et vocales', () => {
    function ecrire(texte: string) {
        const champ = screen.getByLabelText('Consigne ou question');
        fireEvent.change(champ, { target: { value: texte } });
        fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    }

    it('« répare » sans portée demande de préciser — jamais de portée devinée', async () => {
        const { deps } = monter();
        ecrire('répare');
        expect(await screen.findByText(/Précisez la portée/)).toBeInTheDocument();
        expect(deps.diagnose).not.toHaveBeenCalled();
    });

    it('« explique <point> » répond depuis le registre, avec cause, impact et risque', async () => {
        const { props } = monter();
        ecrire(`explique ${autos[0].title}`);
        expect(await screen.findByText(/Cause probable :/)).toBeInTheDocument();
        expect(props.ia).not.toHaveBeenCalled();
    });

    it('une question libre passe par la passerelle IA avec les mesures, et la réponse est étiquetée IA', async () => {
        const { props } = monter();
        ecrire('combien de temps dure une sauvegarde ?');
        expect(await screen.findByText('Réponse de la passerelle.')).toBeInTheDocument();
        expect(screen.getByText('Réponse IA — à vérifier')).toBeInTheDocument();
        const [prompt, system] = (props.ia as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(system).toBe(SYSTEM_PROMPT);
        expect(prompt).toMatch(/CONTEXTE \(mesures réelles, JSON\)/);
        expect(prompt).toMatch(/"etat":"rouge"/);
        expect(voix.speak).toHaveBeenCalledWith('Réponse de la passerelle.');
    });

    it('une consigne vocale finale coupe le micro et s\'exécute (« analyse tout » → onAnalyser)', async () => {
        const { props } = monter();
        expect(voix.onFinalTranscript).not.toBeNull();
        voix.onFinalTranscript!('analyse toute l\'application');
        await waitFor(() => expect(props.onAnalyser).toHaveBeenCalledTimes(1));
        expect(voix.stopListening).toHaveBeenCalled();
    });

    it('« Voix : coupée » n\'appelle jamais speak, et la préférence est conservée', async () => {
        monter();
        fireEvent.click(screen.getByRole('button', { name: /Voix : activée/ }));
        expect(voix.stopSpeaking).toHaveBeenCalled();
        expect(window.localStorage.getItem('moknet.sante.assistant.voix')).toBe('0');
        ecrire('aide');
        expect(await screen.findByText(/Je peux :/)).toBeInTheDocument();
        expect(voix.speak).not.toHaveBeenCalled();
    });
});

describe('retour à l\'état stable', () => {
    it('« Restaurer le lot » rejoue les sauvegardes en ordre inverse et remesure', async () => {
        const { deps, props } = monter();
        fireEvent.click(screen.getByRole('button', { name: /les rouges seuls/ }));
        await confirmerLot();
        const bouton = await screen.findByRole('button', { name: /Restaurer le lot \(2\)/ });
        fireEvent.click(bouton);
        await waitFor(() => expect(deps.restore).toHaveBeenCalledTimes(2));
        expect(deps.restore.mock.calls[0][0]).toBe(ROUGE_B);   // dernière réparée, première restaurée
        expect(deps.restore.mock.calls[1][0]).toBe(ROUGE_A);
        expect(await screen.findByText(/Retour à l'état stable : 2 sauvegardes restaurées/)).toBeInTheDocument();
        await waitFor(() => expect(props.onApresCampagne).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole('button', { name: /Restaurer le lot/ })).toBeNull();
    });
});
