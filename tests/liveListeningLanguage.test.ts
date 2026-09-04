import { describe, expect, it } from 'vitest';
import {
    MAX_BROWSER_PRODUCED_LANGUAGES,
    decodeLiveParticipantMeta,
    encodeLiveParticipantMeta,
    interpreterTrackNameForLanguage,
    isInterpreterTrackForListener,
    languageFromInterpreterTrackName,
    languagesToProduce,
    listeningChoiceLabel,
    listeningLanguageCode,
    requestedLanguageCounts,
    speakerAudioDecision,
    subtitleForListener,
} from '../services/live/liveListeningLanguage';
import { isInterpreterTrackForMe } from '../services/messaging/speechLanguage';

/**
 * LIVE PLANÉTAIRE — les règles de la « langue d'écoute ».
 *
 * Ces tests portent sur la promesse produit, pas sur l'implémentation :
 * chacun choisit sa langue d'écoute, son choix ne déborde sur personne, et
 * on ne coupe jamais une voix avant d'avoir sa remplaçante.
 */

describe('langue d’écoute — Original est le défaut, et rien d’autre ne peut le devenir', () => {
    it('sans métadonnées, avec des métadonnées vides, illisibles ou hors catalogue : Original', () => {
        expect(decodeLiveParticipantMeta(undefined).lang).toBeNull();
        expect(decodeLiveParticipantMeta('').lang).toBeNull();
        expect(decodeLiveParticipantMeta('{ pas du json').lang).toBeNull();
        expect(decodeLiveParticipantMeta('[]').lang).toBeNull();
        expect(decodeLiveParticipantMeta(JSON.stringify({ lpv: 1, lang: 'klingon' })).lang).toBeNull();
        expect(decodeLiveParticipantMeta(JSON.stringify({ lpv: 1, lang: 42 })).lang).toBeNull();
    });

    it('n’accepte comme langue que des codes du catalogue', () => {
        expect(listeningLanguageCode('Anglais')).toBe('en');
        expect(listeningLanguageCode('en-US')).toBe('en');
        expect(listeningLanguageCode('中文')).toBe('zh');
        expect(listeningLanguageCode('zz')).toBeUndefined();
        expect(listeningLanguageCode('')).toBeUndefined();
        expect(listeningLanguageCode(null)).toBeUndefined();
    });

    it('un aller-retour conserve le choix, et Original reste Original', () => {
        expect(decodeLiveParticipantMeta(encodeLiveParticipantMeta('de')).lang).toBe('de');
        expect(decodeLiveParticipantMeta(encodeLiveParticipantMeta(null)).lang).toBeNull();
        // Une langue hors catalogue n'est jamais écrite : elle retombe sur Original.
        expect(decodeLiveParticipantMeta(encodeLiveParticipantMeta('klingon')).lang).toBeNull();
    });

    it('écrire ma langue ne détruit pas les clés que je ne connais pas', () => {
        // Contre-épreuve du réflexe « j'écris mon objet et voilà » : le canal des
        // métadonnées est libre aujourd'hui, il ne le restera pas.
        const existant = JSON.stringify({ role: 'moderator', badge: 'expert' });
        const apres = JSON.parse(encodeLiveParticipantMeta('es', existant));
        expect(apres.role, 'une clé voisine ne doit pas disparaître').toBe('moderator');
        expect(apres.badge).toBe('expert');
        expect(apres.lang).toBe('es');
    });
});

describe('nom de piste : le contrat que reprendra un agent serveur', () => {
    it('une piste par langue, aller-retour exact', () => {
        expect(interpreterTrackNameForLanguage('en')).toBe('interpreter:en');
        expect(interpreterTrackNameForLanguage('Anglais')).toBe('interpreter:en');
        expect(languageFromInterpreterTrackName('interpreter:en')).toBe('en');
        expect(languageFromInterpreterTrackName('interpreter:zh')).toBe('zh');
    });

    it('refuse d’inventer un nom pour une langue hors catalogue', () => {
        expect(() => interpreterTrackNameForLanguage('klingon')).toThrow(/hors catalogue/);
    });

    it('`interpreter` nu (convention des APPELS) ne désigne aucune langue de direct', () => {
        expect(languageFromInterpreterTrackName('interpreter')).toBeNull();
        expect(languageFromInterpreterTrackName('interpreter:')).toBeNull();
        expect(languageFromInterpreterTrackName('micro')).toBeNull();
        expect(languageFromInterpreterTrackName(undefined)).toBeNull();
    });

    it('les deux conventions coexistent sans se marcher dessus', () => {
        const idCompte = '11111111-2222-3333-4444-555555555555';
        // Convention des appels : destinée à un COMPTE.
        expect(isInterpreterTrackForMe(`interpreter:${idCompte}`, idCompte)).toBe(true);
        // La même piste ne doit jamais être prise pour une piste de langue.
        expect(languageFromInterpreterTrackName(`interpreter:${idCompte}`)).toBeNull();
        // Et une piste de langue n'est jamais prise pour celle d'un compte.
        expect(isInterpreterTrackForMe('interpreter:en', idCompte)).toBe(false);
    });

    it('je ne joue que la piste de MA langue ; en Original, aucune', () => {
        expect(isInterpreterTrackForListener('interpreter:en', 'en')).toBe(true);
        expect(isInterpreterTrackForListener('interpreter:en', 'es')).toBe(false);
        expect(isInterpreterTrackForListener('interpreter:en', null)).toBe(false);
        expect(isInterpreterTrackForListener(undefined, 'en')).toBe(false);
    });
});

describe('mutualisation : une production par LANGUE, jamais par auditeur', () => {
    const auditeurs = (choix: Array<[string, string | null]>) =>
        choix.map(([identity, lang]) => ({ identity, metadata: encodeLiveParticipantMeta(lang) }));

    it('compte les demandes, ignore Original, et ne compte jamais l’intervenant lui-même', () => {
        const counts = requestedLanguageCounts(
            auditeurs([['a', 'en'], ['b', 'en'], ['c', 'es'], ['d', null], ['moi', 'de']]),
            'moi',
        );
        expect(counts.get('en')).toBe(2);
        expect(counts.get('es')).toBe(1);
        expect(counts.has('de'), 'ma propre demande ne se produit pas pour moi-même').toBe(false);
        expect(counts.size).toBe(2);
    });

    it('4 000 anglophones ne font pas 4 000 productions — ils font UNE langue', () => {
        const foule = Array.from({ length: 4000 }, (_, i) => ({ identity: `u${i}`, metadata: encodeLiveParticipantMeta('en') }));
        const counts = requestedLanguageCounts(foule);
        expect(counts.get('en')).toBe(4000);
        const plan = languagesToProduce({ requested: counts, spokenLanguage: 'fr' });
        expect(plan.produce, 'une seule piste sert toute la foule').toEqual(['en']);
    });

    it('ne produit jamais vers la langue que l’intervenant parle déjà', () => {
        const counts = requestedLanguageCounts(auditeurs([['a', 'fr'], ['b', 'en']]));
        const plan = languagesToProduce({ requested: counts, spokenLanguage: 'fr' });
        expect(plan.produce).toEqual(['en']);
        expect(plan.alreadySpoken, 'les francophones entendent déjà l’original').toEqual(['fr']);
    });

    it('au-delà du plafond, les langues les plus demandées passent et les autres sont NOMMÉES', () => {
        const counts = new Map([['en', 40], ['es', 30], ['ar', 20], ['de', 10], ['ja', 5]]);
        const plan = languagesToProduce({ requested: counts, spokenLanguage: 'fr' });
        expect(plan.produce).toEqual(['en', 'es', 'ar']);
        expect(plan.produce).toHaveLength(MAX_BROWSER_PRODUCED_LANGUAGES);
        expect(plan.unserved, 'une langue non servie ne doit jamais être passée sous silence').toEqual(['de', 'ja']);
    });

    it('à égalité de demande, le plan est le même chez tout le monde', () => {
        const counts = new Map([['ja', 7], ['ar', 7], ['es', 7], ['en', 7]]);
        const a = languagesToProduce({ requested: counts, spokenLanguage: 'fr', max: 2 });
        const b = languagesToProduce({ requested: new Map([...counts].reverse()), spokenLanguage: 'fr', max: 2 });
        expect(a.produce).toEqual(b.produce);
        expect(a.produce, 'départage alphabétique, déterministe').toEqual(['ar', 'en']);
    });

    it('personne ne demande rien : aucune production', () => {
        const counts = requestedLanguageCounts(auditeurs([['a', null], ['b', null]]));
        expect(languagesToProduce({ requested: counts, spokenLanguage: 'fr' }).produce).toEqual([]);
    });
});

describe('ce que j’entends de CHAQUE intervenant', () => {
    it('Original : j’entends tout le monde tel quel', () => {
        const d = speakerAudioDecision({ myChoice: null, speakerLanguage: 'ru', interpreterAvailable: true });
        expect(d.originalVolume).toBe(1);
        expect(d.interpreted).toBe(false);
        expect(d.reason).toBe('original_choice');
    });

    it('il parle déjà ma langue : aucune traduction, aucune seconde voix', () => {
        const d = speakerAudioDecision({ myChoice: 'fr', speakerLanguage: 'fr', interpreterAvailable: true });
        expect(d.originalVolume).toBe(1);
        expect(d.interpreted).toBe(false);
        expect(d.reason).toBe('same_language');
    });

    it('la voix traduite est là : l’originale est COUPÉE, jamais seulement atténuée', () => {
        const d = speakerAudioDecision({ myChoice: 'en', speakerLanguage: 'fr', interpreterAvailable: true });
        expect(d.originalVolume, 'deux voix en même temps = incompréhensible').toBe(0);
        expect(d.interpreted).toBe(true);
    });

    it('LA RÈGLE QUI ÉVITE LE SILENCE : rien n’est coupé tant que la remplaçante n’existe pas', () => {
        // Défaut réellement rencontré côté appels : une voix coupée sur une
        // langue seulement DÉCLARÉE, alors qu'aucune traduction n'arrivait.
        const d = speakerAudioDecision({ myChoice: 'en', speakerLanguage: 'fr', interpreterAvailable: false });
        expect(d.originalVolume, 'un son incompris vaut mieux qu’un silence inexpliqué').toBe(1);
        expect(d.interpreted).toBe(false);
        expect(d.reason, 'et l’écran peut dire pourquoi').toBe('not_available_yet');
    });

    it('haut-parleur coupé : 0, quoi qu’il arrive', () => {
        expect(speakerAudioDecision({ myChoice: 'en', speakerLanguage: 'fr', interpreterAvailable: true, muted: true }).originalVolume).toBe(0);
        expect(speakerAudioDecision({ myChoice: null, speakerLanguage: 'fr', interpreterAvailable: false, muted: true }).originalVolume).toBe(0);
    });

    it('deux intervenants, deux décisions différentes en même temps', () => {
        // Le cœur de la différence avec l'appel à deux : une règle globale
        // « je suis en traduction » serait fausse ici.
        const francophone = speakerAudioDecision({ myChoice: 'fr', speakerLanguage: 'fr', interpreterAvailable: false });
        const sinophone = speakerAudioDecision({ myChoice: 'fr', speakerLanguage: 'zh', interpreterAvailable: true });
        expect(francophone.originalVolume).toBe(1);
        expect(francophone.interpreted).toBe(false);
        expect(sinophone.originalVolume).toBe(0);
        expect(sinophone.interpreted).toBe(true);
    });

    it('mon choix ne change rien pour les autres', () => {
        // Même intervenant, même instant, trois auditeurs : chacun sa décision.
        const commun = { speakerLanguage: 'fr', interpreterAvailable: true } as const;
        expect(speakerAudioDecision({ ...commun, myChoice: null }).interpreted).toBe(false);
        expect(speakerAudioDecision({ ...commun, myChoice: 'fr' }).interpreted).toBe(false);
        expect(speakerAudioDecision({ ...commun, myChoice: 'en' }).interpreted).toBe(true);
    });
});

describe('libellés', () => {
    it('Original porte son nom, une langue le sien', () => {
        expect(listeningChoiceLabel(null)).toBe('Original');
        expect(listeningChoiceLabel('klingon')).toBe('Original');
        expect(listeningChoiceLabel('en')).toBe('English');
        expect(listeningChoiceLabel('ar')).toBe('العربية');
    });
});

/**
 * LP-7 — le tri des sous-titres à l'arrivée.
 *
 * Un intervenant publie l'original PLUS une copie traduite par langue
 * produite. Sans tri, un auditeur verrait défiler les quatre versions de la
 * même phrase, et chaque personne qui choisit une langue en ajouterait une
 * de plus à l'écran de tout le monde.
 */
describe('LP-7 — quel sous-titre est pour moi', () => {
    const original = { text: 'Bonjour.', lang: 'fr' } as const;
    const versEn = { text: 'Bonjour.', lang: 'fr', translated: 'Hello.', targetLang: 'en' } as const;
    const versRu = { text: 'Bonjour.', lang: 'fr', translated: 'Привет.', targetLang: 'ru' } as const;

    it('en Original : je lis les mots d’origine, et RIEN d’autre', () => {
        expect(subtitleForListener({ caption: original, myChoice: null, speakerName: 'Awa' }))
            .toEqual({ speaker: 'Awa', text: 'Bonjour.' });
        expect(subtitleForListener({ caption: versEn, myChoice: null, speakerName: 'Awa' })).toBeNull();
        expect(subtitleForListener({ caption: versRu, myChoice: null, speakerName: 'Awa' })).toBeNull();
    });

    it('en anglais : je lis la version anglaise, jamais la russe', () => {
        expect(subtitleForListener({ caption: versEn, myChoice: 'en', speakerName: 'Awa' }))
            .toEqual({ speaker: 'Awa', text: 'Bonjour.', translated: 'Hello.' });
        expect(subtitleForListener({ caption: versRu, myChoice: 'en', speakerName: 'Awa' })).toBeNull();
    });

    it('la copie d’origine ne me sert pas quand j’ai choisi une AUTRE langue', () => {
        expect(subtitleForListener({ caption: original, myChoice: 'en', speakerName: 'Awa' })).toBeNull();
    });

    it('mais elle me sert quand l’intervenant parle DÉJÀ ma langue — rien à traduire', () => {
        // Le cas qu'un tri naïf casserait : aucune copie traduite n'existe
        // (on ne traduit jamais inutilement), donc l'original EST ma version.
        const enAnglais = { text: 'Good morning.', lang: 'en' } as const;
        expect(subtitleForListener({ caption: enAnglais, myChoice: 'en', speakerName: 'Chen' }))
            .toEqual({ speaker: 'Chen', text: 'Good morning.' });
    });

    it('trois auditeurs, une phrase : chacun en reçoit exactement une version', () => {
        const toutes = [original, versEn, versRu];
        const compte = (choix: string | null) =>
            toutes.filter((c) => subtitleForListener({ caption: c, myChoice: choix, speakerName: 'Awa' })).length;
        expect(compte(null)).toBe(1);
        expect(compte('en')).toBe(1);
        expect(compte('ru')).toBe(1);
        // Personne ne demande l'espagnol : ni original (langue différente), ni copie.
        expect(compte('es')).toBe(0);
    });

    it('un texte vide n’affiche jamais un sous-titre creux', () => {
        expect(subtitleForListener({ caption: { text: '   ', lang: 'fr' }, myChoice: null, speakerName: 'Awa' })).toBeNull();
    });

    it('le nom affiché est celui du roster, jamais un nom porté par le message', () => {
        const recu = subtitleForListener({ caption: original, myChoice: null, speakerName: 'Awa Ndiaye' });
        expect(recu?.speaker).toBe('Awa Ndiaye');
    });
});
