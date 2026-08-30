/**
 * FICHE DE CONSENTEMENT ET D'ENGAGEMENT DE L'ARCHITECTE — le formulaire que
 * l'Architecte remplit RÉELLEMENT, question par question, à la voix comme au
 * clavier (mission de finalisation, §9 et §18).
 *
 * Logique pure, sans état React ni écriture directe : la barre pilote le
 * déroulé et fait l'unique écriture finale (via `onUpdateProfile`, donc
 * `profiles.privacy_settings` — colonne réelle, modifiable et révocable
 * depuis les Paramètres). Rien n'est écrit avant la confirmation explicite
 * du récapitulatif : vérifier → corriger → confirmer, jamais l'inverse.
 */

import type { UserProfile } from '../../types';

export type ArchitecteConsent = NonNullable<UserProfile['privacySettings']['architecte']>;

export interface ConsentStep {
    key: keyof Omit<ArchitecteConsent, 'consentAt'>;
    question: string;
    /** Convertit la réponse énoncée en valeur ; `undefined` = pas comprise, la question est reposée. */
    parse: (answer: string) => string | boolean | undefined;
    /** Message de relance quand la réponse n'est pas comprise. */
    reprompt: string;
}

const normalize = (text: string) =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const CONSENT_STEPS: ConsentStep[] = [
    {
        key: 'callName',
        question: 'Commençons votre fiche. Comment souhaitez-vous que je vous appelle ?',
        parse: (answer) => {
            const cleaned = answer.replace(/^(appelle[- ]?moi|je m'appelle|mon nom est|c'est)\s+/i, '').trim();
            return cleaned.length >= 2 && cleaned.length <= 60 ? cleaned : undefined;
        },
        reprompt: "Je n'ai pas saisi le nom. Dites simplement le nom que je dois utiliser.",
    },
    {
        key: 'scope',
        question: 'Voulez-vous m’autoriser en mode personnalisé — limité aux fonctions que vous choisissez — ou en mode étendu ?',
        parse: (answer) => {
            const n = normalize(answer);
            if (/(etendu|global|large|tout)/.test(n)) return 'etendu';
            if (/(personnalise|limite|restreint|choisi|certaines)/.test(n)) return 'limite';
            return undefined;
        },
        reprompt: 'Répondez « personnalisé » ou « étendu ».',
    },
    {
        key: 'autoPrepare',
        question: 'Voulez-vous que je puisse préparer certaines actions automatiquement — toujours sans les exécuter sans vous ?',
        parse: (answer) => {
            const n = normalize(answer);
            if (/(^|\s)(oui|ouais|d'accord|daccord|ok|volontiers|bien sur)(\s|$|[.,!])/.test(n)) return true;
            if (/(^|\s)(non|pas|jamais|refuse)(\s|$|[.,!])/.test(n)) return false;
            return undefined;
        },
        reprompt: 'Répondez simplement oui ou non.',
    },
];

export function buildConsentRecap(a: Omit<ArchitecteConsent, 'consentAt'>): string {
    return (
        `Récapitulatif de votre fiche : je vous appelle « ${a.callName} », ` +
        `mode ${a.scope === 'etendu' ? 'étendu' : 'personnalisé (limité)'}, ` +
        `préparation automatique ${a.autoPrepare ? 'autorisée' : 'désactivée'}. ` +
        `Ces choix restent modifiables et révocables à tout moment. J'enregistre ?`
    );
}

/** Phrases qui démarrent la fiche — détection déterministe, jamais le modèle. */
const CONSENT_TRIGGERS = [
    /fiche de consentement/i,
    /configur\w* (mes|les) autorisations/i,
    /param[eè]tr\w* (mes|les|tes) autorisations/i,
    /remplir (ma|la) fiche/i,
];

export function isConsentCommand(command: string): boolean {
    return CONSENT_TRIGGERS.some((p) => p.test(command));
}
