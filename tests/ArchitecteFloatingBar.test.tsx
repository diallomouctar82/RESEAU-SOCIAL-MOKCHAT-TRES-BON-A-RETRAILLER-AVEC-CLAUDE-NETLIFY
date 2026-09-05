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
    generateSpeechDetailed: vi.fn(async () => ({ audioBase64: '', mimeType: 'audio/mpeg' })),
    AiGatewayNetworkError: class extends Error { readonly isNetwork = true; },
}));

import {
    ArchitecteFloatingBar,
    extractVideoQuery,
    isVideoRequest,
} from '../components/architecte/ArchitecteFloatingBar';
import { addSessionTurn, clearSession, getSessionTurns } from '../services/architecte/architecteSession';
import { generateJSON } from '../services/aiGateway';

const PROFIL: any = { id: 'u-test', name: 'Preuve Lazarus', level: 3 };
/** Personne déjà connue : fiche de consentement présente (accueil léger, §2/§22). */
const PROFIL_CONNU: any = {
    id: 'u-test', name: 'Preuve Lazarus', level: 3,
    privacySettings: { architecte: { callName: 'Mamadou', scope: 'limite', autoPrepare: false, consentAt: '2026-08-30T00:00:00Z' } },
};

// DS-M2 (menu « Miroir d'eau ») — la barre n'a plus de pastille flottante
// indépendante à cliquer/glisser (invariant Direction : l'Architecte vit
// dans la navigation principale, pas un second bouton flottant). Elle
// s'ouvre désormais quand `openSignal` augmente, exactement ce que fait
// Layout.tsx depuis le bouton central du dock et l'entrée de la sidebar —
// les tests simulent cela avec `rerender`, pas un clic/glissement.
let currentUtils: ReturnType<typeof render> | null = null;
let currentProps: React.ComponentProps<typeof ArchitecteFloatingBar> | null = null;
let currentSignal = 0;

function monter(props: Partial<React.ComponentProps<typeof ArchitecteFloatingBar>> = {}) {
    currentSignal = 0;
    currentProps = {
        userProfile: PROFIL,
        onNavigate: vi.fn(),
        onUpdateProfile: vi.fn(async () => true),
        openSignal: currentSignal,
        ...props,
    };
    currentUtils = render(<ArchitecteFloatingBar {...currentProps} />);
    return currentUtils;
}

/** Simule un appui sur le bouton central du dock / l'entrée de la sidebar. */
function ouvrir() {
    if (!currentUtils || !currentProps) throw new Error('monter() doit être appelé avant ouvrir()');
    currentSignal += 1;
    currentProps = { ...currentProps, openSignal: currentSignal };
    currentUtils.rerender(<ArchitecteFloatingBar {...currentProps} />);
}

beforeEach(() => {
    vi.clearAllMocks();
    voiceState.error = null;
    // La session de l'Architecte est un singleton de module : chaque test
    // repart d'un fil vierge.
    clearSession();
});

describe('État fermé', () => {
    it("rend une PRÉSENCE FLOTTANTE PERMANENTE au repos — inversion de rôles RO-3", () => {
        const { container } = monter();
        // DS-M2a avait supprimé toute présence au repos (`return null`) au nom
        // de « un seul flottant : la goutte messagerie ». La Direction a
        // inversé les deux rôles le 04/09/2026 : « L'architecte est le guide
        // permanent de toute la maison Moknet, donc bouton flottant visible en
        // permanence », la messagerie devenant une entrée FIXE du dock.
        // Ce test est donc l'exact opposé du précédent, volontairement.
        const pastille = screen.getByTestId('architecte-flottant');
        expect(pastille).toBeInTheDocument();
        // Depuis DEC-2026-062, cette présence est l'AVATAR VIVANT et non plus
        // une icône : son nom accessible porte donc aussi l'état, exigence du
        // playbook AI Core 15 (« aucun mouvement ne doit être le seul moyen
        // d'indiquer un statut »). L'action reste annoncée, un état s'y ajoute.
        expect(pastille).toHaveAttribute('aria-label', "L'Architecte — au repos. Ouvrir l'Architecte");
        // Le visage est réellement rendu au repos, sans aucune interaction :
        // c'est la différence entre une présence permanente et un avatar
        // caché derrière une ouverture (défaut relevé par la Direction).
        expect(pastille.querySelector('canvas[data-portrait-src]')).toBeInTheDocument();
        expect(container).not.toBeEmptyDOMElement();
    });

    it("la présence au repos OUVRE réellement l'Architecte au clic", async () => {
        monter();
        // Sans ce chemin, la pastille serait un décor : la barre ne s'ouvrirait
        // que depuis la navigation, ce que RO-3 remplace précisément.
        fireEvent.click(screen.getByTestId('architecte-flottant'));
        expect(await screen.findByText("L'Architecte")).toBeInTheDocument();
    });

    it("n'affiche PAS la barre tant qu'on n'a pas ouvert", () => {
        monter();
        // `queryBy*` renvoie null quand l'élément est absent — contrairement à
        // `getBy*` qui lève. C'est ce qu'il faut pour affirmer une ABSENCE.
        expect(screen.queryByText("L'Architecte")).toBeNull();
    });
});

describe('Ouverture', () => {
    it("un nouvel openSignal ouvre réellement la barre — assertion qui échoue si elle ne s'ouvre pas", async () => {
        const { container } = monter();
        ouvrir();

        // `findBy*` attend le rendu asynchrone et LÈVE si l'élément n'apparaît
        // pas : contrairement au `toBeDefined()` du paquet, ce test devient
        // rouge si l'ouverture cesse de fonctionner.
        expect(await screen.findByText("L'Architecte")).toBeInTheDocument();
        expect(container).not.toBeEmptyDOMElement();
    });

    it("un openSignal inchangé (même valeur au rendu suivant) n'ouvre rien — anti-réouverture parasite", () => {
        const { rerender } = monter();
        // Même props, même `openSignal` : un rendu React ordinaire (ex. le
        // parent qui re-rend pour une tout autre raison) ne doit jamais
        // rouvrir l'Architecte tout seul.
        rerender(<ArchitecteFloatingBar {...currentProps!} />);
        // Depuis RO-3 la pastille au repos est TOUJOURS là : l'absence
        // d'ouverture se prouve donc par l'absence de la BARRE, pas par un
        // conteneur vide — sinon le test redeviendrait vert même si la barre
        // s'ouvrait toute seule.
        expect(screen.getByTestId('architecte-flottant')).toBeInTheDocument();
        expect(screen.queryByText("L'Architecte")).toBeNull();
    });

    it("démarre l'écoute à l'ouverture — comportement natif de l'original", async () => {
        monter();
        ouvrir();
        await screen.findByText("L'Architecte");

        expect(setConversationalMode).toHaveBeenCalledWith(true);
        expect(startListening).toHaveBeenCalledTimes(1);
    });

    it('présente les trois boutons d\'action alignés', async () => {
        monter();
        ouvrir();
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
        ouvrir();
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
        ouvrir();
        await screen.findByText("L'Architecte");

        expect(screen.getByText('Bonjour Architecte')).toBeInTheDocument();
        expect(screen.getByText('Je vois votre photo.')).toBeInTheDocument();
        expect(screen.getByAltText('Photo prise à la caméra')).toBeInTheDocument();
    });
});

// L'ancien test d'accessibilité couvrait un gestionnaire clavier bricolé sur
// la pastille : elle s'ouvrait sur `pointerup` (pour permettre le
// glissement), donc Entrée/Espace — qui émettent un `click`, pas un
// événement pointeur — avaient besoin d'un `onKeyDown` dédié. DS-M2 retire
// cette pastille ; le point d'entrée est maintenant un `<button>` ordinaire
// dans Layout.tsx (dock/sidebar), nativement accessible au clavier sans
// code particulier — rien à tester ici pour ce comportement précis.

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
        ouvrir();
        await screen.findByText("L'Architecte");

        expect(
            await screen.findByText("Le micro n'a pas démarré — utilisez la saisie.")
        ).toBeInTheDocument();
    });
});

describe('Démontage', () => {
    it("relâche RÉELLEMENT le micro quand la barre est démontée alors qu'elle est ouverte", async () => {
        const { unmount } = monter();
        ouvrir();
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

/**
 * Ouvre la saisie clavier (si besoin — le bouton Écrire est une BASCULE)
 * et envoie un message — même session que la voix.
 */
async function ecrire(texte: string) {
    let input = screen.queryByLabelText("Saisie clavier de l'Architecte");
    if (!input) {
        fireEvent.click(screen.getByLabelText("Écrire à l'Architecte"));
        input = await screen.findByLabelText("Saisie clavier de l'Architecte");
    }
    fireEvent.change(input, { target: { value: texte } });
    fireEvent.submit(input.closest('form')!);
}

describe('Boucle 1 — accueil différencié (§1-2)', () => {
    it("première rencontre : l'Architecte se présente, souhaite la bienvenue et propose la fiche", async () => {
        monter(); // PROFIL sans fiche de consentement
        ouvrir();
        await screen.findByText("L'Architecte");

        expect(speak).toHaveBeenCalledWith(expect.stringContaining('bienvenue'));
        expect(speak).toHaveBeenCalledWith(expect.stringContaining('Voulez-vous'));
    });

    it('personne connue : accueil léger avec le nom choisi — jamais un onboarding rejoué', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");

        expect(speak).toHaveBeenCalledWith("Bonjour Mamadou. Que puis-je faire pour vous aujourd'hui ?");
        expect(speak).not.toHaveBeenCalledWith(expect.stringContaining('bienvenue'));
    });

    it("l'accueil se fait UNE fois par session de page — fermer puis rouvrir ne le rejoue pas", async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");
        const greetings = () => speak.mock.calls.filter(([m]) => String(m).startsWith('Bonjour Mamadou')).length;
        expect(greetings()).toBe(1);

        fireEvent.click(screen.getByLabelText('Fermer'));
        ouvrir();
        await screen.findByText("L'Architecte");
        expect(greetings()).toBe(1);
    });

    it("un « oui » court après l'accueil de première rencontre démarre la fiche de consentement", async () => {
        monter();
        ouvrir();
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
        ouvrir();
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
        ouvrir();
        await screen.findByText("L'Architecte");

        // Les tours existent en session mais ne s'affichent pas : la voix suffit.
        expect(screen.queryByText('Bonjour Architecte')).toBeNull();
    });

    it('une vraie production écrite (lettre, texte long) fait apparaître le panneau', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
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
        ouvrir();
        await screen.findByText("L'Architecte");

        await ecrire('Ouvre la caméra');

        // jsdom n'a pas de `mediaDevices` : la vérité, pas une simulation.
        const matches = await screen.findAllByText(/ne donne pas accès à la caméra/);
        expect(matches.length).toBeGreaterThan(0);
        expect(generateJSON).not.toHaveBeenCalled();
    });

    it("une demande de fichier explique le vrai geste requis — le navigateur exige un appui réel", async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");

        await ecrire('joins un fichier à la conversation');

        const matches = await screen.findAllByText(/Appuyez sur le bouton Fichier/);
        expect(matches.length).toBeGreaterThan(0);
        expect(generateJSON).not.toHaveBeenCalled();
    });
});

describe('Équipe C — surface visuelle adaptative (« la parole pilote l\'interface »)', () => {
    it('extrait le sujet d\'une demande de vidéo sans détruire le sens', () => {
        expect(isVideoRequest('Mets-moi la chanson Fatou Diop sur YouTube')).toBe(true);
        expect(extractVideoQuery('Mets-moi la chanson Fatou Diop sur YouTube')).toBe('Fatou Diop');
        expect(extractVideoQuery('mets-moi la vidéo qui explique comment remplacer la pièce'))
            .toBe('qui explique comment remplacer la pièce');
        expect(isVideoRequest('Emmène-moi sur le fil social')).toBe(false);
        expect(isVideoRequest('Rédige-moi une lettre')).toBe(false);
    });

    it('« Mets-moi une vidéo » ouvre le lecteur DANS la même surface — sans appel au modèle', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");
        await ecrire('Mets-moi une vidéo sur la mécanique automobile');

        const lecteur = await screen.findByTitle(/Vidéos pour/);
        expect(lecteur).toHaveAttribute(
            'src',
            expect.stringContaining('youtube-nocookie.com/embed?listType=search&list=')
        );
        expect((lecteur as HTMLIFrameElement).src).toContain(encodeURIComponent('sur la mécanique automobile'));
        // L'annonce est honnête : trouvé et affiché, jamais « lecture lancée ».
        const annonces = await screen.findAllByText(/appuyez sur lecture/);
        expect(annonces.length).toBeGreaterThan(0);
        expect(generateJSON).not.toHaveBeenCalled();

        // « Ferme la vidéo » : le besoin visuel est passé, la surface se retire.
        await ecrire('Ferme la vidéo');
        await waitFor(() => expect(screen.queryByTitle(/Vidéos pour/)).toBeNull());
        // La conversation, elle, continue — même barre, même Architecte.
        expect(screen.getByText("L'Architecte")).toBeInTheDocument();
    });

    it("« Montre-moi le document » sans document répond honnêtement — jamais un aperçu inventé", async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");
        await ecrire('Montre-moi le document');

        const matches = await screen.findAllByText(/Aucun document dans notre conversation/);
        expect(matches.length).toBeGreaterThan(0);
        expect(generateJSON).not.toHaveBeenCalled();
    });

    it('avec un document en session, la même surface devient son aperçu', async () => {
        addSessionTurn({
            role: 'utilisateur', kind: 'document',
            text: 'Document fourni : contrat.pdf',
            docName: 'contrat.pdf',
            docExcerpt: 'Article 1 — Le prix unitaire du ciment est de 85 000 GNF.',
        });
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");
        await ecrire('Montre-moi le document');

        expect(await screen.findByText(/Article 1 — Le prix unitaire du ciment/)).toBeInTheDocument();
        expect(generateJSON).not.toHaveBeenCalled();
    });

    it('fermer l\'Architecte referme aussi la surface visuelle — rien ne survit derrière une barre fermée', async () => {
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");
        await ecrire('Mets-moi une vidéo de musique guinéenne');
        await screen.findByTitle(/Vidéos pour/);

        fireEvent.click(screen.getByLabelText('Fermer'));
        ouvrir();
        await screen.findByText("L'Architecte");
        expect(screen.queryByTitle(/Vidéos pour/)).toBeNull();
    });

    it('les adresses citées par une réponse (sources de recherche) deviennent des liens cliquables', async () => {
        // Nettement au-dessus du seuil de production écrite (220) : le
        // panneau doit s'ouvrir pour que le lien soit réellement visible.
        const reponse = 'Voici les offres trouvées pour votre métier. ' +
            'Consultez notamment cette page très complète : https://exemple.org/offres-emploi ' +
            'ainsi que les résultats détaillés publiés cette semaine par les agences partenaires de la région, ' +
            'avec les conditions, les salaires proposés et les contacts des recruteurs pour chaque poste ouvert.';
        monter({ userProfile: PROFIL_CONNU });
        ouvrir();
        await screen.findByText("L'Architecte");
        addSessionTurn({ role: 'architecte', kind: 'texte', text: reponse });

        const lien = await screen.findByRole('link', { name: 'https://exemple.org/offres-emploi' });
        expect(lien).toHaveAttribute('href', 'https://exemple.org/offres-emploi');
        expect(lien).toHaveAttribute('target', '_blank');
    });
});

// ─────────────────────────────────────────────────────────────────────────
// PRÉSENTATION VIDÉO — le modèle validé par la Direction (05/09/2026)
// ─────────────────────────────────────────────────────────────────────────
import { ARCHITECTE_PRESENTATION, PRESENTATION_SEEN_KEY } from '../services/architecte/sequences';

describe('Présentation vidéo de l’Architecte dans la barre', () => {
    beforeEach(() => {
        Object.defineProperty(window.HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn(() => Promise.resolve()) });
        Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
        try { localStorage.removeItem(PRESENTATION_SEEN_KEY); } catch { /* sans stockage */ }
    });

    it('la barre ouverte propose la présentation une fois, puis la joue en grand dans le cadre au clic', async () => {
        monter();
        fireEvent.click(screen.getByTestId('architecte-flottant'));
        expect(await screen.findByTestId('architecte-presentation-invitation')).toBeInTheDocument();
        const bouton = screen.getByTestId('architecte-presentation-bouton');
        fireEvent.click(bouton);
        const fenetre = await screen.findByTestId('architecte-presentation-fenetre');
        expect(fenetre).toBeInTheDocument();
        expect(screen.queryByTestId('architecte-presentation-invitation')).toBeNull();
        const video = fenetre.querySelector('[data-testid="architecte-sequence-video"]') as HTMLVideoElement;
        expect(video).toHaveAttribute('data-sequence-slot', 'presentation');
        expect(video).toHaveAttribute('data-sequence-status', 'loading');
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
        expect(fenetre).toHaveTextContent(ARCHITECTE_PRESENTATION.text.slice(0, 24));
        expect(localStorage.getItem(PRESENTATION_SEEN_KEY)).toBe('1');
        // Fermer la fenêtre rend la main au rig.
        fireEvent.click(screen.getByLabelText('Fermer la fenêtre visuelle'));
        expect(screen.queryByTestId('architecte-presentation-fenetre')).toBeNull();
    });
});
