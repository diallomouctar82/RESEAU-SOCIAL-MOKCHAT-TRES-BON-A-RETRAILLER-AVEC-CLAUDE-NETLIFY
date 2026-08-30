import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests DOM de la barre flottante.
 *
 * Le paquet Architecte livrait deux tests pour ce composant. Aucun des deux ne
 * pouvait échouer utilement :
 *
 *   const overlay = document.getElementById('architect-voice-overlay');
 *   expect(overlay).toBeDefined();
 *
 * `getElementById` renvoie `null` quand l'élément est absent, et
 * `expect(null).toBeDefined()` PASSE — seul `undefined` échoue. L'assertion
 * était donc verte que l'overlay s'ouvre ou non. Le premier test cherchait par
 * ailleurs un libellé (`Navigation Vocale Temps Réel`) qui ne correspond pas à
 * celui de l'original (`Navigation Vocale`).
 *
 * Ci-dessous, chaque assertion échoue réellement si le comportement disparaît —
 * notamment la dernière, qui couvre la fuite de micro au démontage : c'est
 * exactement le défaut que l'absence d'outillage DOM avait laissé passer.
 */

const stopListening = vi.fn();
const stopSpeaking = vi.fn();
const startListening = vi.fn(async () => true);
const setConversationalMode = vi.fn();
// Mutable pour simuler, test par test, un signal d'erreur du moteur vocal
// (`vi.hoisted` : le bloc `vi.mock` est hissé au-dessus des `const`).
const voiceState = vi.hoisted(() => ({ error: null as string | null }));

vi.mock('../hooks/useVoiceAssistant', () => ({
    useVoiceAssistant: () => ({
        isListening: false,
        isSpeaking: false,
        isSupported: true,
        volume: 0,
        transcript: '',
        error: voiceState.error,
        startListening,
        stopListening,
        speak: vi.fn(async () => {}),
        stopSpeaking,
        setConversationalMode,
    }),
}));

// Les capacités touchent Supabase : hors sujet ici, et un test DOM ne doit
// jamais dépendre du réseau.
vi.mock('../services/architecte/taskCapabilityHandlers', () => ({
    registerTaskCapabilities: () => () => {},
}));
vi.mock('../services/architecte/settingsCapabilityHandlers', () => ({
    registerSettingsCapabilities: () => () => {},
}));
vi.mock('../services/architecte/searchCapabilityHandlers', () => ({
    registerSearchCapabilities: () => () => {},
}));
vi.mock('../services/aiGateway', () => ({
    analyzeImage: vi.fn(async () => 'Réponse de test'),
    generateText: vi.fn(async () => 'Réponse de test'),
}));

import { ArchitecteFloatingBar } from '../components/architecte/ArchitecteFloatingBar';

const PROFIL: any = { id: 'u-test', name: 'Preuve Lazarus', level: 3 };

function monter(props: Partial<React.ComponentProps<typeof ArchitecteFloatingBar>> = {}) {
    return render(
        <ArchitecteFloatingBar
            userProfile={PROFIL}
            onNavigate={vi.fn()}
            onUpdateProfile={vi.fn(async () => true)}
            onOpenTyped={vi.fn()}
            {...props}
        />
    );
}

const FAB = "Ouvrir L'Architecte et démarrer l'écoute vocale";

/**
 * La pastille s'ouvre sur `pointerup`, pas sur `click` : c'est ce qui permet
 * de la faire glisser sans déclencher l'Architecte. Un test qui utiliserait
 * `fireEvent.click` échouerait donc pour une mauvaise raison.
 */
function ouvrirALaSouris() {
    const fab = screen.getByLabelText(FAB);
    fireEvent.pointerDown(fab, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(fab, { clientX: 100, clientY: 100 });
}

beforeEach(() => {
    vi.clearAllMocks();
    voiceState.error = null;
});

describe('État fermé', () => {
    it('affiche la pastille flottante', () => {
        monter();
        expect(screen.getByLabelText(FAB)).toBeInTheDocument();
    });

    it("n'affiche PAS la barre tant qu'on n'a pas ouvert", () => {
        monter();
        // `queryBy*` renvoie null quand l'élément est absent — contrairement à
        // `getBy*` qui lève. C'est ce qu'il faut pour affirmer une ABSENCE.
        expect(screen.queryByText("L'Architecte")).toBeNull();
    });
});

describe('Ouverture', () => {
    it("ouvre réellement la barre au clic — assertion qui échoue si elle ne s'ouvre pas", async () => {
        monter();
        ouvrirALaSouris();

        // `findBy*` attend le rendu asynchrone et LÈVE si l'élément n'apparaît
        // pas : contrairement au `toBeDefined()` du paquet, ce test devient
        // rouge si l'ouverture cesse de fonctionner.
        expect(await screen.findByText("L'Architecte")).toBeInTheDocument();
        expect(screen.queryByLabelText(FAB)).toBeNull();
    });

    it("démarre l'écoute à l'ouverture — comportement natif de l'original", async () => {
        monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(setConversationalMode).toHaveBeenCalledWith(true);
        expect(startListening).toHaveBeenCalledTimes(1);
    });

    it('présente les trois boutons d\'action alignés', async () => {
        monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(screen.getByLabelText('Joindre un fichier')).toBeInTheDocument();
        expect(screen.getByLabelText("Écrire à l'Architecte")).toBeInTheDocument();
        expect(screen.getByLabelText('Activer la caméra')).toBeInTheDocument();
    });

    it("n'affiche pas le bouton Écrire quand aucune saisie clavier n'est fournie", async () => {
        monter({ onOpenTyped: undefined });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(screen.queryByLabelText("Écrire à l'Architecte")).toBeNull();
        // Les deux autres restent : ils ne dépendent d'aucune prop.
        expect(screen.getByLabelText('Joindre un fichier')).toBeInTheDocument();
        expect(screen.getByLabelText('Activer la caméra')).toBeInTheDocument();
    });
});

describe('Accessibilité', () => {
    it("s'ouvre aussi au CLAVIER — Entrée et Espace n'émettent pas d'événement pointeur", async () => {
        monter();
        fireEvent.keyDown(screen.getByLabelText(FAB), { key: 'Enter' });
        expect(await screen.findByText("L'Architecte")).toBeInTheDocument();
    });
});

describe('Échec micro signalé par le moteur', () => {
    it("affiche l'échec micro quand le moteur a définitivement abandonné — au lieu de rester sur « Connexion... »", async () => {
        // Défaut mesuré par l'audit du 30/08/2026 : le moteur bouclait en
        // silence sur `audio-capture`, la barre restait sur « Connexion... »
        // (le watchdog local était déjà annulé par le premier `onstart`
        // d'une reconnaissance condamnée). Le moteur émet désormais un
        // signal terminal ; la barre doit l'afficher.
        const { MIC_UNAVAILABLE_MESSAGE } = await import('../services/voiceEngine');
        voiceState.error = MIC_UNAVAILABLE_MESSAGE;

        monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(
            await screen.findByText("Le micro n'a pas démarré — utilisez la saisie.")
        ).toBeInTheDocument();
    });
});

describe('Démontage', () => {
    it("relâche RÉELLEMENT le micro quand la barre est démontée alors qu'elle est ouverte", async () => {
        const { unmount } = monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        stopListening.mockClear();
        stopSpeaking.mockClear();
        unmount();

        // C'est `stopListening` qui déclenche `stopVolumeMonitoring`, donc
        // l'arrêt des pistes du MediaStream et la fermeture de l'AudioContext.
        // Sans lui, la diode du micro reste allumée après la fermeture de la
        // page — le défaut trouvé en lisant le code, faute d'outillage DOM.
        expect(stopListening).toHaveBeenCalled();
        expect(stopSpeaking).toHaveBeenCalled();
        expect(setConversationalMode).toHaveBeenCalledWith(false);
    });

    it("ne coupe RIEN quand la barre est démontée fermée — le moteur vocal est partagé", () => {
        const { unmount } = monter();
        stopListening.mockClear();
        stopSpeaking.mockClear();

        unmount();

        // `voiceEngine` est un singleton partagé avec le LIVE et les coachs
        // Carrière/Campus : couper inconditionnellement au démontage
        // interromprait la session vocale d'un autre écran.
        expect(stopListening).not.toHaveBeenCalled();
        expect(stopSpeaking).not.toHaveBeenCalled();
    });
});
