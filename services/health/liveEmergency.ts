// SAT-6 — Vocabulaire CLIENT du bouton de secours du direct.
//
// Copie volontaire du catalogue porté par
// `supabase/functions/health-guardian/liveEmergency.ts` : l'application ne
// peut pas importer le code d'une fonction Edge (elle tourne sur Deno, hors
// du bundle). La parité est tenue par `tests/liveEmergency.test.ts`, qui
// exécute les deux côtés sur les mêmes identifiants — si l'un dérive, la
// suite vire au rouge au lieu de laisser un bouton envoyer un geste que le
// serveur ne connaît pas.

export type LiveEmergencyAction = 'relaunch_room' | 'close_session';

export interface LiveEmergencyGesture {
    id: LiveEmergencyAction;
    label: string;
    /** Ce que le geste fait, en français, AVANT confirmation. */
    consequence: string;
    /** Le mot du bouton de confirmation. */
    verb: string;
    reversible: boolean;
}

export const LIVE_EMERGENCY_CATALOGUE: Record<LiveEmergencyAction, LiveEmergencyGesture> = {
    relaunch_room: {
        id: 'relaunch_room',
        label: 'Relancer la room de ce direct',
        consequence:
            "La room est supprimée côté LiveKit. La ligne de chaque participant tombe puis se rétablit "
            + "seule dans une room neuve (SAT-5), en une à deux secondes. Le direct reste ouvert, personne "
            + "n'est mis dehors. C'est le geste contre une room dont l'état s'est abîmé alors que le serveur répond.",
        verb: 'Relancer la room',
        reversible: true,
    },
    close_session: {
        id: 'close_session',
        label: 'Clore ce direct',
        consequence:
            "Le direct est clos en base (ended_at) et sa room supprimée. Chaque écran lit « Ce direct est "
            + "terminé. » et ne redemande aucun jeton. Ce geste n'est pas réversible : le direct ne rouvrira pas.",
        verb: 'Clore le direct',
        reversible: false,
    },
};

/** Les gestes qui EXIGENT le VPS. Aucun bouton ne les promet : ils sont listés comme action humaine. */
export const LIVE_VPS_GESTURES: readonly { label: string; why: string }[] = [
    { label: 'Redémarrer le conteneur livekit-server', why: "Le cas du 2 septembre : `GET /` répondait 200 pendant que la voix ne passait pas." },
    { label: 'Refaire tourner une clé API qui a divergé', why: "SAT-4 le voit : rouge « refuse nos identifiants ». Le coffre et le VPS doivent porter la même clé." },
    { label: 'Rouvrir les ports UDP 50000-50100 / 30000-30100', why: 'Sans eux, le média ne passe plus alors que la signalisation répond.' },
    { label: 'Monter le serveur de 1.8.4 à 1.13.6', why: 'Recette dans deploy/livekit/README.md, quatre commandes, à faire par SSH.' },
];

/** Une ligne de l'état des directs, telle que le serveur la rend. */
export interface LiveEmergencySessionRow {
    id: string;
    title: string | null;
    hostId: string | null;
    hostName: string | null;
    startedAt: string | null;
    endedAt: string | null;
    /** `null` = LiveKit n'a pas répondu. */
    roomPresent: boolean | null;
    roomSid: string | null;
    participantCount: number | null;
    roomState: string;
}

export interface LiveEmergencyOverview {
    sessions: LiveEmergencySessionRow[];
    ranAt: string;
}

export interface LiveEmergencyPlan {
    action: LiveEmergencyAction;
    sessionId: string;
    session: { id: string; title: string | null; hostName: string | null; startedAt: string | null };
    roomPresent: boolean | null;
    participantCount: number | null;
    roomState: string;
    summary: string;
    nothingToDo: boolean;
    confirmationToken: string | null;
    expiresAt: string;
}

export type LiveEmergencyVerdict = 'verified' | 'unverified' | 'failed';

export interface LiveEmergencyResult {
    action: LiveEmergencyAction;
    sessionId: string;
    ok: boolean;
    verdict: LiveEmergencyVerdict;
    participantsBefore: number | null;
    roomSidBefore: string | null;
    roomSidAfter: string | null;
    endedAt: string | null;
    journalId: string | null;
    message: string;
    statusAfter: 'vert' | 'orange' | 'rouge';
}

/** Le libellé humain d'une entrée de journal produite par un geste de secours. */
export function emergencyJournalLabel(remediationId: string | null): string {
    if (remediationId === 'live.secours.relaunch_room') return LIVE_EMERGENCY_CATALOGUE.relaunch_room.label;
    if (remediationId === 'live.secours.close_session') return LIVE_EMERGENCY_CATALOGUE.close_session.label;
    return 'Secours du direct';
}
