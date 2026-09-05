import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * SAT-6 — le panneau « Secours du direct », sur le VRAI composant.
 *
 * Ce que ces cas fixent côté écran :
 *   • un rang sans lecture ne monte rien ; un administrateur simple voit
 *     l'état des directs mais AUCUN bouton de geste ;
 *   • l'Admin Général voit les deux gestes ; un clic ouvre la modale avec le
 *     périmètre RÉEL rendu par le serveur (présents, résumé) ;
 *   • le bouton de confirmation reste inerte tant que la case n'est pas
 *     cochée ; une fois confirmé, c'est le jeton du diagnostic qui part, tel
 *     quel ;
 *   • le résultat affiché est celui du serveur (verdict re-mesuré), et le
 *     journal est rechargé ;
 *   • un refus serveur (rang, 403) s'affiche tel quel, jamais avalé.
 */

const rig = vi.hoisted(() => ({
    overview: vi.fn(),
    diagnose: vi.fn(),
    apply: vi.fn(),
}));

vi.mock('../services/health/healthService', () => ({
    loadLiveEmergencyOverview: rig.overview,
    diagnoseLiveEmergency: rig.diagnose,
    applyLiveEmergency: rig.apply,
}));

import { LiveEmergencyPanel } from '../components/admin/LiveEmergencyPanel';

const SID = '11111111-2222-4333-8444-555555555555';
const SESSION = {
    id: SID, title: 'Direct de preuve', hostId: 'h', hostName: 'Awa', startedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    endedAt: null, roomPresent: true, roomSid: 'RM_x', participantCount: 2, roomState: 'Room active sur LiveKit (2 présent(s)).',
};

const ADMIN_GENERAL = { role: 'super_admin', canRead: true, canRepair: true };
const ADMIN_SIMPLE = { role: 'admin', canRead: true, canRepair: false };
const MEMBRE = { role: 'user', canRead: false, canRepair: false };

beforeEach(() => {
    rig.overview.mockReset().mockResolvedValue({ sessions: [SESSION], ranAt: new Date().toISOString() });
    rig.diagnose.mockReset();
    rig.apply.mockReset();
});
afterEach(() => cleanup());

describe('SAT-6 — panneau Secours du direct', () => {
    it('un membre ordinaire ne voit rien, et rien n\'est demandé au serveur', () => {
        const { container } = render(<LiveEmergencyPanel rank={MEMBRE} />);
        expect(container.querySelector('[data-testid="live-emergency-panel"]')).toBeNull();
        expect(rig.overview).not.toHaveBeenCalled();
    });

    it("un administrateur simple lit l'état des directs, sans aucun bouton de geste", async () => {
        render(<LiveEmergencyPanel rank={ADMIN_SIMPLE} />);
        await screen.findByText('Direct de preuve');
        expect(screen.getByTestId('live-emergency-mode').textContent).toMatch(/Lecture seule/);
        expect(screen.queryByTestId(`live-emergency-relaunch-${SID}`)).toBeNull();
        expect(screen.queryByTestId(`live-emergency-close-${SID}`)).toBeNull();
        expect(screen.getByText(/gestes réservés à l'Admin Général/)).toBeTruthy();
    });

    it("l'Admin Général : diagnostic → modale avec le périmètre réel → confirmation cochée → jeton du diagnostic envoyé → verdict affiché", async () => {
        rig.diagnose.mockResolvedValue({
            action: 'relaunch_room', sessionId: SID,
            session: { id: SID, title: 'Direct de preuve', hostName: 'Awa', startedAt: SESSION.startedAt },
            roomPresent: true, participantCount: 2, roomState: SESSION.roomState,
            summary: 'La room sera supprimée ; 2 présent(s) verront leur ligne se rétablir seule.',
            nothingToDo: false, confirmationToken: 'signed:JETON', expiresAt: new Date(Date.now() + 300_000).toISOString(),
        });
        rig.apply.mockResolvedValue({
            action: 'relaunch_room', sessionId: SID, ok: true, verdict: 'verified', participantsBefore: 2,
            roomSidBefore: 'RM_x', roomSidAfter: null, endedAt: null, journalId: 'JOURNAL-1',
            message: 'Room supprimée ; les participants se relancent seuls (SAT-5).', statusAfter: 'vert',
        });
        const onJournalChanged = vi.fn();
        render(<LiveEmergencyPanel rank={ADMIN_GENERAL} onJournalChanged={onJournalChanged} />);
        await screen.findByText('Direct de preuve');
        expect(screen.getByTestId('live-emergency-mode').textContent).toMatch(/Secours activé/);

        fireEvent.click(screen.getByTestId(`live-emergency-relaunch-${SID}`));
        await screen.findByTestId('live-emergency-modal');
        expect(rig.diagnose).toHaveBeenCalledWith('relaunch_room', SID);
        expect(screen.getByTestId('live-emergency-participants').textContent).toBe('2');
        expect(screen.getByTestId('live-emergency-summary').textContent).toMatch(/se rétablir seule/);

        const confirmer = screen.getByTestId('live-emergency-confirm') as HTMLButtonElement;
        expect(confirmer.disabled).toBe(true); // case non cochée : inerte
        fireEvent.click(screen.getByTestId('live-emergency-accept'));
        expect(confirmer.disabled).toBe(false);
        await act(async () => { fireEvent.click(confirmer); });

        await waitFor(() => expect(rig.apply).toHaveBeenCalledWith('relaunch_room', SID, 'signed:JETON'));
        const resultat = await screen.findByTestId('live-emergency-result');
        expect(resultat.textContent).toMatch(/Geste appliqué et vérifié/);
        expect(resultat.textContent).toMatch(/se relancent seuls/);
        expect(resultat.textContent).toMatch(/JOURNAL-/);
        expect(onJournalChanged).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('live-emergency-modal')).toBeNull();
    });

    it("« Clore » ouvre une modale NON réversible, et un refus serveur s'affiche tel quel", async () => {
        rig.diagnose.mockResolvedValue({
            action: 'close_session', sessionId: SID,
            session: { id: SID, title: 'Direct de preuve', hostName: 'Awa', startedAt: SESSION.startedAt },
            roomPresent: true, participantCount: 2, roomState: SESSION.roomState,
            summary: 'Ce geste n\'est pas réversible.', nothingToDo: false, confirmationToken: 'signed:J2',
            expiresAt: new Date(Date.now() + 300_000).toISOString(),
        });
        rig.apply.mockRejectedValue(new Error("Réservé à l'Admin Général (rôle super_admin) — votre rang selon la base : admin."));
        render(<LiveEmergencyPanel rank={ADMIN_GENERAL} />);
        await screen.findByText('Direct de preuve');
        fireEvent.click(screen.getByTestId(`live-emergency-close-${SID}`));
        const modale = await screen.findByTestId('live-emergency-modal');
        expect(modale.textContent).toMatch(/NON réversible/);
        fireEvent.click(screen.getByTestId('live-emergency-accept'));
        await act(async () => { fireEvent.click(screen.getByTestId('live-emergency-confirm')); });
        const erreur = await screen.findByTestId('live-emergency-error');
        expect(erreur.textContent).toMatch(/votre rang selon la base : admin/);
    });

    it("rien à relancer : la modale le dit et ne propose aucune confirmation", async () => {
        rig.diagnose.mockResolvedValue({
            action: 'relaunch_room', sessionId: SID,
            session: { id: SID, title: 'Direct de preuve', hostName: 'Awa', startedAt: SESSION.startedAt },
            roomPresent: false, participantCount: null, roomState: 'Aucune room active sur LiveKit pour ce direct.',
            summary: "Aucune room active : il n'y a rien à relancer.", nothingToDo: true, confirmationToken: null,
            expiresAt: new Date(Date.now() + 300_000).toISOString(),
        });
        render(<LiveEmergencyPanel rank={ADMIN_GENERAL} />);
        await screen.findByText('Direct de preuve');
        fireEvent.click(screen.getByTestId(`live-emergency-relaunch-${SID}`));
        await screen.findByTestId('live-emergency-modal');
        expect(screen.getByText(/Rien à relancer/)).toBeTruthy();
        expect(screen.queryByTestId('live-emergency-confirm')).toBeNull();
    });

    it("après une relance, le panneau relit l'état une seconde fois — quand les lignes SAT-5 ont eu le temps de revenir", async () => {
        const trou = { ...SESSION, roomPresent: false, roomSid: null, participantCount: null, roomState: 'Aucune room active sur LiveKit pour ce direct.' };
        const renee = { ...SESSION, roomSid: 'RM_neuve', roomState: 'Room active sur LiveKit (2 présent(s)).' };
        rig.overview.mockReset()
            .mockResolvedValueOnce({ sessions: [SESSION], ranAt: new Date().toISOString() }) // montage
            .mockResolvedValueOnce({ sessions: [trou], ranAt: new Date().toISOString() })    // relecture immédiate : le trou, montré tel quel
            .mockResolvedValue({ sessions: [renee], ranAt: new Date().toISOString() });      // relecture différée : la room renée
        rig.diagnose.mockResolvedValue({
            action: 'relaunch_room', sessionId: SID,
            session: { id: SID, title: 'Direct de preuve', hostName: 'Awa', startedAt: SESSION.startedAt },
            roomPresent: true, participantCount: 2, roomState: SESSION.roomState,
            summary: 'La room sera supprimée ; 2 présent(s) verront leur ligne se rétablir seule.',
            nothingToDo: false, confirmationToken: 'signed:JETON', expiresAt: new Date(Date.now() + 300_000).toISOString(),
        });
        rig.apply.mockResolvedValue({
            action: 'relaunch_room', sessionId: SID, ok: true, verdict: 'verified', participantsBefore: 2,
            roomSidBefore: 'RM_x', roomSidAfter: null, endedAt: null, journalId: 'JOURNAL-1',
            message: 'Room supprimée ; les participants se relancent seuls (SAT-5).', statusAfter: 'vert',
        });
        render(<LiveEmergencyPanel rank={ADMIN_GENERAL} delaiRelectureApresRelanceMs={30} />);
        await screen.findByText('Direct de preuve');
        fireEvent.click(screen.getByTestId(`live-emergency-relaunch-${SID}`));
        await screen.findByTestId('live-emergency-modal');
        fireEvent.click(screen.getByTestId('live-emergency-accept'));
        await act(async () => { fireEvent.click(screen.getByTestId('live-emergency-confirm')); });
        await screen.findByTestId('live-emergency-result');

        // Relecture immédiate : le trou est montré tel quel (jamais un état inventé).
        await waitFor(() => expect(rig.overview).toHaveBeenCalledTimes(2));
        expect(screen.getByTestId(`live-emergency-row-${SID}`).textContent).toMatch(/Aucune room active/);
        // Relecture différée : la room renée, avec ses présents — l'effet réel du geste.
        await waitFor(() => expect(rig.overview).toHaveBeenCalledTimes(3));
        await waitFor(() => expect(screen.getByTestId(`live-emergency-row-${SID}`).textContent).toMatch(/RM_neuve/));
        expect(screen.getByTestId(`live-emergency-row-${SID}`).textContent).toMatch(/2 présent/);
    });

    it("après « Clore », aucune relecture différée : le direct a disparu de la liste, il n'y a rien à attendre", async () => {
        rig.overview.mockReset()
            .mockResolvedValueOnce({ sessions: [SESSION], ranAt: new Date().toISOString() })
            .mockResolvedValue({ sessions: [], ranAt: new Date().toISOString() });
        rig.diagnose.mockResolvedValue({
            action: 'close_session', sessionId: SID,
            session: { id: SID, title: 'Direct de preuve', hostName: 'Awa', startedAt: SESSION.startedAt },
            roomPresent: true, participantCount: 2, roomState: SESSION.roomState,
            summary: 'Ce geste n\'est pas réversible.', nothingToDo: false, confirmationToken: 'signed:J2',
            expiresAt: new Date(Date.now() + 300_000).toISOString(),
        });
        rig.apply.mockResolvedValue({
            action: 'close_session', sessionId: SID, ok: true, verdict: 'verified', participantsBefore: 2,
            roomSidBefore: 'RM_x', roomSidAfter: null, endedAt: new Date().toISOString(), journalId: 'JOURNAL-2',
            message: 'Direct clos en base et room supprimée.', statusAfter: 'vert',
        });
        render(<LiveEmergencyPanel rank={ADMIN_GENERAL} delaiRelectureApresRelanceMs={30} />);
        await screen.findByText('Direct de preuve');
        fireEvent.click(screen.getByTestId(`live-emergency-close-${SID}`));
        await screen.findByTestId('live-emergency-modal');
        fireEvent.click(screen.getByTestId('live-emergency-accept'));
        await act(async () => { fireEvent.click(screen.getByTestId('live-emergency-confirm')); });
        await screen.findByTestId('live-emergency-empty');
        expect(rig.overview).toHaveBeenCalledTimes(2);
        await new Promise((r) => setTimeout(r, 120)); // bien au-delà du délai de 30 ms : rien ne doit repartir
        expect(rig.overview).toHaveBeenCalledTimes(2);
    });

    it('aucun direct ouvert : le panneau le dit, et la liste des gestes SSH reste visible comme action humaine', async () => {
        rig.overview.mockResolvedValue({ sessions: [], ranAt: new Date().toISOString() });
        render(<LiveEmergencyPanel rank={ADMIN_GENERAL} />);
        await screen.findByTestId('live-emergency-empty');
        expect(screen.getByText(/gestes SSH sur le VPS/)).toBeTruthy();
        expect(screen.getByText(/Redémarrer le conteneur livekit-server/)).toBeTruthy();
    });
});
