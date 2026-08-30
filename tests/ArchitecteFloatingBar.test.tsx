import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
// Nommé (et non inline) : les tests Boucle 1 vérifient CE QUI est prononcé —
// l'accueil, et surtout ce qui ne doit JAMAIS l'être barre fermée (§14).
const speak = vi.fn(async (_texte: string) => {});
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
        speak,
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
    // Le cerveau (`architecteBrain`) passe par ici pour toute commande non
    // déterministe : les tests Boucle 1 le contrôlent (réponse différée pour
    // le scénario « fermé pendant que la réponse est en vol »).
    generateJSON: vi.fn(async () => ({ type: 'NOTIFICATION', explanation: 'Réponse de test.' })),
}));

import { ArchitecteFloatingBar } from '../components/architecte/ArchitecteFloatingBar';
import { addSessionTurn, clearSession, getSessionTurns } from '../services/architecte/architecteSession';
import { generateJSON } from '../services/aiGateway';

const PROFIL: any = { id: 'u-test', name: 'Preuve Lazarus', level: 3 };
/** Personne déjà connue : fiche de consentement présente (accueil léger, §2/§22). */
const PROFIL_CONNU: any = {
    id: 'u-test', name: 'Preuve Lazarus', level: 3,
    privacySettings: { architecte: { callName: 'Mamadou', scope: 'limite', autoPrepare: false, consentAt: '2026-08-30T00:00:00Z' } },
};

function monter(props: Partial<React.ComponentProps<typeof ArchitecteFloatingBar>> = {}) {
    return render(
        <ArchitecteFloatingBar
            userProfile={PROFIL}
            onNavigate={vi.fn()}
            onUpdateProfile={vi.fn(async () => true)}
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
    // La session de l'Architecte est un singleton de module : chaque test
    // repart d'un fil vierge.
    clearSession();
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

    it("le bouton Écrire ouvre la saisie DANS la même barre — jamais un second assistant", async () => {
        // Exigence de la mission de finalisation : « il ne doit jamais arriver
        // qu'un bouton ouvre un autre assistant ». Avant : le bouton fermait
        // la barre et ouvrait DialloOS. Désormais : un champ de saisie
        // apparaît dans la même session, la barre reste ouverte.
        monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        fireEvent.click(screen.getByLabelText("Écrire à l'Architecte"));

        expect(await screen.findByLabelText("Saisie clavier de l'Architecte")).toBeInTheDocument();
        // La barre est TOUJOURS là — aucune bascule d'expérience.
        expect(screen.getByText("L'Architecte")).toBeInTheDocument();
        expect(screen.getByLabelText('Joindre un fichier')).toBeInTheDocument();
        expect(screen.getByLabelText('Activer la caméra')).toBeInTheDocument();
    });

    it('le fil de session affiche les tours existants — y compris une image, avec sa vignette', async () => {
        addSessionTurn({ role: 'utilisateur', kind: 'texte', text: 'Bonjour Architecte' });
        addSessionTurn({
            role: 'utilisateur', kind: 'image', text: 'Photo prise à la caméra',
            imageDataUrl: 'data:image/jpeg;base64,AAAA', imageMimeType: 'image/jpeg',
        });
        addSessionTurn({ role: 'architecte', kind: 'texte', text: 'Je vois votre photo.' });

        monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(screen.getByText('Bonjour Architecte')).toBeInTheDocument();
        expect(screen.getByText('Je vois votre photo.')).toBeInTheDocument();
        expect(screen.getByAltText('Photo prise à la caméra')).toBeInTheDocument();
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

// ─────────────────────────────────────────────────────────────────────────
// BOUCLE 1 — comportement humain de l'Architecte.
// ─────────────────────────────────────────────────────────────────────────

/** Ouvre la saisie clavier et envoie un message — même session que la voix. */
async function ecrire(texte: string) {
    fireEvent.click(screen.getByLabelText("Écrire à l'Architecte"));
    const input = await screen.findByLabelText("Saisie clavier de l'Architecte");
    fireEvent.change(input, { target: { value: texte } });
    fireEvent.submit(input.closest('form')!);
}

describe('Boucle 1 — accueil différencié (§1-2)', () => {
    it("première rencontre : l'Architecte se présente, souhaite la bienvenue et propose la fiche", async () => {
        monter(); // PROFIL sans fiche de consentement
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(speak).toHaveBeenCalledWith(expect.stringContaining('bienvenue'));
        expect(speak).toHaveBeenCalledWith(expect.stringContaining('Voulez-vous'));
    });

    it('personne connue : accueil léger avec le nom choisi — jamais un onboarding rejoué', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        expect(speak).toHaveBeenCalledWith("Bonjour Mamadou. Que puis-je faire pour vous aujourd'hui ?");
        expect(speak).not.toHaveBeenCalledWith(expect.stringContaining('bienvenue'));
    });

    it("l'accueil se fait UNE fois par session de page — fermer puis rouvrir ne le rejoue pas", async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");
        const greetings = () => speak.mock.calls.filter(([m]) => String(m).startsWith('Bonjour Mamadou')).length;
        expect(greetings()).toBe(1);

        fireEvent.click(screen.getByLabelText('Fermer'));
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");
        expect(greetings()).toBe(1);
    });

    it("un « oui » court après l'accueil de première rencontre démarre la fiche de consentement", async () => {
        monter();
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        await ecrire('oui');

        const matches = await screen.findAllByText(/Commençons votre fiche/);
        expect(matches.length).toBeGreaterThan(0);
        // Déterministe de bout en bout : aucun appel au modèle.
        expect(generateJSON).not.toHaveBeenCalled();
    });
});

describe('Boucle 1 — fermé signifie RÉELLEMENT silencieux (§14)', () => {
    it("une réponse arrivée APRÈS la fermeture reste dans le fil mais n'est JAMAIS prononcée", async () => {
        let livrerReponse!: (v: any) => void;
        vi.mocked(generateJSON).mockImplementationOnce(
            () => new Promise((res) => { livrerReponse = res; })
        );

        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");
        await ecrire('Emmène-moi au campus');
        await waitFor(() => expect(generateJSON).toHaveBeenCalled());

        // La personne ferme la barre pendant que la réponse est en vol.
        fireEvent.click(screen.getByLabelText('Fermer'));
        speak.mockClear();
        livrerReponse({ type: 'NOTIFICATION', explanation: 'Réponse arrivée après fermeture.' });

        // La réponse est bien CONSERVÉE dans la session…
        await waitFor(() =>
            expect(getSessionTurns().map((t) => t.text)).toContain('Réponse arrivée après fermeture.')
        );
        // …mais l'Architecte ne monologue pas en arrière-plan.
        expect(speak).not.toHaveBeenCalled();
    });
});

describe('Boucle 1 — voix par défaut, texte quand il apporte une valeur (§16-17)', () => {
    it("une simple conversation vocale n'ouvre PAS le panneau de texte", async () => {
        addSessionTurn({ role: 'utilisateur', kind: 'texte', text: 'Bonjour Architecte' });
        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        // Les tours existent en session mais ne s'affichent pas : la voix suffit.
        expect(screen.queryByText('Bonjour Architecte')).toBeNull();
    });

    it('une vraie production écrite (lettre, texte long) fait apparaître le panneau', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        // `.trim()` : Testing Library normalise les blancs du DOM — un espace
        // final dans la chaîne attendue ferait échouer la comparaison exacte.
        const lettre = ('Voici votre lettre de motivation : ' +
            'Madame, Monsieur, je vous adresse ma candidature pour le poste proposé. '.repeat(4)).trim();
        addSessionTurn({ role: 'architecte', kind: 'texte', text: lettre });

        expect(await screen.findByText(lettre)).toBeInTheDocument();
    });
});

describe('Boucle 1 — outils proposés et pilotés à la voix (§18-19)', () => {
    it('« Ouvre la caméra » est routé sans modèle — et son indisponibilité est dite honnêtement', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        await ecrire('Ouvre la caméra');

        // jsdom n'a pas de `mediaDevices` : la vérité, pas une simulation.
        const matches = await screen.findAllByText(/ne donne pas accès à la caméra/);
        expect(matches.length).toBeGreaterThan(0);
        expect(generateJSON).not.toHaveBeenCalled();
    });

    it("une demande de fichier explique le vrai geste requis — le navigateur exige un appui réel", async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrirALaSouris();
        await screen.findByText("L'Architecte");

        await ecrire('joins un fichier à la conversation');

        const matches = await screen.findAllByText(/Appuyez sur le bouton Fichier/);
        expect(matches.length).toBeGreaterThan(0);
        expect(generateJSON).not.toHaveBeenCalled();
    });
});
