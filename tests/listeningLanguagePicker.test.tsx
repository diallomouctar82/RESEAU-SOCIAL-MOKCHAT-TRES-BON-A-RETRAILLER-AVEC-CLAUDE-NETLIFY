import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ListeningLanguagePicker } from '../components/live/ListeningLanguagePicker';
import { listeningLanguageOptions, listeningStatusLine } from '../services/live/liveListeningLanguage';

/**
 * LP-4 — « J'écoute en… », le seul endroit où l'on choisit sa langue d'écoute.
 *
 * Ce que ces tests protègent, et pourquoi chacun existe :
 *
 * - **Original par défaut** : c'est la promesse la plus facile à casser sans
 *   s'en apercevoir. Une valeur initiale « intelligente » (la langue du
 *   profil, la dernière utilisée) ferait entendre une traduction à quelqu'un
 *   qui n'a rien demandé.
 * - **Le retour à Original est en tête de liste** : quand on n'entend plus
 *   rien de bon, on ne cherche pas — on remonte.
 * - **La liste se referme au choix** : on est DANS un direct, l'image prime.
 * - **L'état d'attente est DIT** : une traduction qui n'arrive pas encore
 *   doit s'annoncer, jamais laisser croire à une panne de son.
 * - **Aucune mémorisation silencieuse** : ce composant n'écrit nulle part.
 *
 * Ce qu'aucun test ici ne couvre : l'aspect réel et la taille des cibles à
 * l'écran — jsdom n'a pas de moteur de rendu. La mesure en pixels appartient
 * au banc navigateur (LP-6), comme pour MB-1.
 */

const ROOT = join(__dirname, '..');
const STUDIO = readFileSync(join(ROOT, 'components/SocialLive.tsx'), 'utf8');

afterEach(cleanup);

describe('LP-4 — la pastille « J\'écoute en… »', () => {
    it('affiche Original quand aucune langue n\'est choisie', () => {
        render(<ListeningLanguagePicker choice={null} onChoose={() => {}} />);
        expect(screen.getByTestId('listening-language-pill')).toHaveTextContent('Original');
    });

    it('affiche la langue choisie, en toutes lettres', () => {
        render(<ListeningLanguagePicker choice="en" onChoose={() => {}} />);
        expect(screen.getByTestId('listening-language-pill')).toHaveTextContent('English');
    });

    it('n\'ouvre la liste qu\'au clic, et la referme dès qu\'un choix est fait', () => {
        const onChoose = vi.fn();
        render(<ListeningLanguagePicker choice={null} onChoose={onChoose} />);
        expect(screen.queryByTestId('listening-language-list')).toBeNull();

        fireEvent.click(screen.getByTestId('listening-language-pill'));
        expect(screen.getByTestId('listening-language-list')).toBeTruthy();

        fireEvent.click(screen.getByTestId('listening-language-option-fr'));
        expect(onChoose).toHaveBeenCalledWith('fr');
        expect(screen.queryByTestId('listening-language-list')).toBeNull();
    });

    it('propose le retour à Original EN TÊTE de liste, pas noyé dans le catalogue', () => {
        const options = listeningLanguageOptions();
        expect(options[0].value).toBeNull();
        expect(options[0].label).toBe('Original');
        // et il rend bien `null` — le retour à l'audio d'origine, pas une langue
        const onChoose = vi.fn();
        render(<ListeningLanguagePicker choice="ru" onChoose={onChoose} />);
        fireEvent.click(screen.getByTestId('listening-language-pill'));
        fireEvent.click(screen.getByTestId('listening-language-option-original'));
        expect(onChoose).toHaveBeenCalledWith(null);
    });

    it('dit que la traduction n\'est pas encore là, au lieu de laisser croire à une panne de son', () => {
        render(<ListeningLanguagePicker choice="en" onChoose={() => {}} waitingForMyLanguage />);
        const status = screen.getByTestId('listening-language-status');
        expect(status.textContent).toContain("audio d'origine");
        expect(status.textContent).toContain('English');
    });

    it('dit la panne de production sans couper le direct pour autant', () => {
        render(<ListeningLanguagePicker choice="en" onChoose={() => {}} producerError="chaîne indisponible" />);
        expect(screen.getByTestId('listening-language-status').textContent).toContain('indisponible');
    });

    it('ne dit rien quand tout va bien — un direct ne clignote pas sans raison', () => {
        render(<ListeningLanguagePicker choice="en" onChoose={() => {}} />);
        expect(screen.queryByTestId('listening-language-status')).toBeNull();
    });

    it('n\'écrit RIEN nulle part : aucune mémorisation silencieuse du choix', () => {
        const source = readFileSync(join(ROOT, 'components/live/ListeningLanguagePicker.tsx'), 'utf8');
        expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    });
});

describe('LP-4 — l\'état d\'écoute, dit honnêtement', () => {
    it('Original ne produit aucun message : rien à signaler', () => {
        expect(listeningStatusLine({ choice: null, waitingForMyLanguage: true, producerError: 'x' }).text).toBeNull();
    });

    it('la panne prime sur l\'attente — la cause la plus grave est celle qu\'on montre', () => {
        const line = listeningStatusLine({ choice: 'en', waitingForMyLanguage: true, producerError: 'boom' });
        expect(line.tone).toBe('panne');
    });

    it('une traduction qui démarre est une attente, jamais une alerte', () => {
        expect(listeningStatusLine({ choice: 'en', waitingForMyLanguage: true }).tone).toBe('attente');
    });
});

describe('LP-4 — un seul sélecteur, et la barre de sous-titres ne ment plus', () => {
    it('le Studio monte la pastille HORS du chrome qui s\'efface au repos', () => {
        // §15 : atteignable PENDANT le direct. Si la pastille était placée
        // dans `contextualChromeClass`, elle deviendrait `pointer-events-none`
        // dès que les commandes s'effacent — injoignable sans réveiller le
        // chrome, ce qui n'est pas « atteignable ».
        const montage = STUDIO.match(/<ListeningLanguagePicker[\s\S]{0,400}?\/>/);
        expect(montage).not.toBeNull();
        const avant = STUDIO.slice(0, STUDIO.indexOf('<ListeningLanguagePicker'));
        const dernierBloc = avant.slice(-600);
        expect(dernierBloc).not.toContain('contextualChromeClass');
    });

    it('l\'ancien sélecteur décoratif à sept libellés a bien disparu', () => {
        // Il n'a JAMAIS changé ni les sous-titres ni l'audio : il affichait
        // une notification. Le laisser à côté du vrai réintroduirait
        // exactement l'ambiguïté que la messagerie a dû défaire (UL-1).
        expect(STUDIO).not.toContain('selectedViewerLang');
        expect(STUDIO).not.toContain('Sous-titres synchronisés en');
    });

    it('la barre de sous-titres n\'affiche plus de phrase inventée', () => {
        // L'ancien état initial était le texte affiché, pour toujours :
        // `setCurrentSubtitle` n'est appelé nulle part dans ce fichier.
        expect(STUDIO).not.toContain('Nous abordons maintenant la structuration du plan de financement');
        expect(STUDIO).not.toContain('We are now covering the structure of the financing plan');
        expect(STUDIO).toContain("Aucun sous-titre pour l'instant.");
    });
});
