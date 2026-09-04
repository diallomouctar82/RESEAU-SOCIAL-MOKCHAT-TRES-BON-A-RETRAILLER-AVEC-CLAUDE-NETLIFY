import { MESSAGING_LANGUAGES, normalizeLanguage } from '../translation/translationService';

/**
 * LIVE PLANÉTAIRE — la « langue d'écoute », règles PURES.
 *
 * Le principe produit, en une phrase : **chacun parle sa langue, chacun
 * choisit la langue dans laquelle il ENTEND les autres, et son choix ne
 * change rien pour personne d'autre.** Aucun hôte n'impose une langue au
 * direct ; aucun intervenant ne choisit comment on l'entend.
 *
 * Ce que ce fichier N'EST PAS : il ne touche ni au micro, ni au haut-parleur,
 * ni au réseau. Les briques matérielles sont celles des APPELS, réutilisées
 * telles quelles (services/calls/callInterpreter.ts : PcmSegmenter,
 * ServerCaptioner, InterpreterVoiceTrack).
 *
 * ── La différence avec l'appel à deux, et pourquoi elle change tout ────────
 *
 * Dans un appel, l'émetteur connaît LA langue de son unique correspondant et
 * rend une voix pour lui : une piste `interpreter`. Dans un direct, un
 * intervenant peut être écouté par des milliers de personnes réparties sur
 * plusieurs langues. Rendre une voix par AUDITEUR serait ruineux et
 * impossible à tenir : 4 000 auditeurs anglophones n'ont pas besoin de 4 000
 * synthèses de la même phrase anglaise.
 *
 * La règle d'architecture est donc : **une production par LANGUE DEMANDÉE,
 * jamais par auditeur.**
 *
 *     1 micro
 *       → 1 découpage             (une seule fois)
 *       → 1 transcription         (une seule fois : texte + langue détectée)
 *       → N traductions texte     (N = langues demandées, pas auditeurs)
 *       → N voix de synthèse
 *       → N pistes `interpreter:<langue>`
 *            ↳ tous les auditeurs « en » s'abonnent à la MÊME `interpreter:en`
 *
 * Le nom de piste est le contrat : `interpreter:<code de langue>`. Il est
 * volontairement identique à celui qu'un AGENT serveur (GPU) publierait —
 * l'agent pourra donc remplacer le producteur navigateur plus tard sans
 * qu'une ligne du côté auditeur ne change.
 *
 * ── Ce que ces règles refusent de faire ───────────────────────────────────
 *
 * - Couper la voix originale de quelqu'un AVANT que sa remplaçante existe
 *   réellement (leçon des appels : un correspondant avait déclaré parler
 *   anglais mais parlait français — sa voix était coupée alors qu'il n'y
 *   avait rien à interpréter : silence total).
 * - Traduire vers la langue que la personne parle déjà.
 * - Laisser croire qu'une langue est diffusée quand le producteur a atteint
 *   son plafond : elle est nommée comme non servie, jamais passée sous
 *   silence.
 */

const CATALOGUE_CODES = new Set(MESSAGING_LANGUAGES.map((l) => l.code));

/**
 * Code de langue du CATALOGUE uniquement — `undefined` pour tout le reste.
 *
 * `normalizeLanguage` de la messagerie renvoie la valeur telle quelle quand
 * elle ne connaît pas d'alias (`'zz'` → `'zz'`) : elle ne peut donc pas servir
 * de garde. Ici, une langue inconnue n'entre jamais dans un nom de piste.
 */
export function listeningLanguageCode(value?: string | null): string | undefined {
    const code = normalizeLanguage(value ?? undefined);
    return code && CATALOGUE_CODES.has(code) ? code : undefined;
}

/**
 * Le choix d'un auditeur : un code de langue, ou `null` pour **Original** —
 * la valeur par défaut, celle qui laisse le direct exactement tel qu'il est.
 */
export type ListeningChoice = string | null;

/** Préfixe partagé avec les appels (`INTERPRETER_TRACK_NAME`), même famille de pistes. */
const INTERPRETER_PREFIX = 'interpreter';

/** Nom de la piste qui porte la voix d'un intervenant dans `language`. */
export function interpreterTrackNameForLanguage(language: string): string {
    const code = listeningLanguageCode(language);
    if (!code) throw new Error(`Langue hors catalogue : ${language}`);
    return `${INTERPRETER_PREFIX}:${code}`;
}

/**
 * Langue portée par un nom de piste, ou `null`. Volontairement strict :
 * `interpreter` tout court est la piste des APPELS (rendue pour l'unique
 * correspondant) — dans un direct elle ne désigne aucune langue et ne doit
 * jamais être jouée au hasard.
 */
export function languageFromInterpreterTrackName(name?: string | null): string | null {
    if (!name || !name.startsWith(`${INTERPRETER_PREFIX}:`)) return null;
    return listeningLanguageCode(name.slice(INTERPRETER_PREFIX.length + 1)) ?? null;
}

/**
 * Cette piste est-elle celle que J'ai demandée ? Distinct de
 * `isInterpreterTrackForMe` des appels, qui compare à `interpreter:<compte>` :
 * ici on compare à `interpreter:<langue>`. Les deux conventions coexistent
 * sans se gêner — un direct et un appel ne partagent jamais une room.
 */
export function isInterpreterTrackForListener(name: string | undefined | null, myChoice: ListeningChoice): boolean {
    const mine = listeningLanguageCode(myChoice);
    if (!mine) return false; // Original : aucune piste d'interprète ne me concerne
    return languageFromInterpreterTrackName(name) === mine;
}

// ── L'état partagé : qui écoute dans quelle langue ─────────────────────────
//
// Porté par les MÉTADONNÉES de participant du transport, et non par un
// message ponctuel : c'est un ÉTAT, pas un événement. Le serveur les
// retransmet à qui rejoint plus tard — un intervenant qui arrive en cours de
// route connaît donc aussitôt les langues à produire, sans que personne ait à
// ré-annoncer quoi que ce soit.

/** Métadonnées de participant du LIVE. Version explicite : un pair plus ancien est simplement « Original ». */
export interface LiveParticipantMeta {
    /** Version du format. */
    lpv: 1;
    /** Langue d'écoute choisie, ou null pour Original. */
    lang: string | null;
    /**
     * Langue que cette personne PARLE réellement, telle que la transcription
     * de sa propre voix l'a détectée (jamais une déclaration seule).
     *
     * Elle sert à l'auditeur pour une décision qu'il ne peut pas prendre
     * autrement : « cet intervenant parle-t-il déjà ma langue ? » — auquel cas
     * il n'y a rien à interpréter et sa voix originale reste entière.
     */
    spoken: string | null;
}

/**
 * Écrit ma langue d'écoute dans mes métadonnées **en préservant les clés que
 * je ne connais pas** : ce canal est libre aujourd'hui, il ne le restera pas,
 * et écraser l'objet entier ferait disparaître silencieusement l'état d'une
 * fonctionnalité voisine.
 */
export function encodeLiveParticipantMeta(choice: ListeningChoice, existing?: string | null): string {
    return mergeMeta(existing, { lpv: 1, lang: listeningLanguageCode(choice) ?? null });
}

/**
 * Inscrit la langue que je PARLE (détectée par la transcription de ma propre
 * voix) sans toucher à ma langue d'écoute ni aux clés d'autrui — les deux
 * informations vivent dans le même objet mais changent à des moments
 * différents.
 */
export function encodeSpokenLanguageMeta(spoken: string | null | undefined, existing?: string | null): string {
    return mergeMeta(existing, { lpv: 1, spoken: listeningLanguageCode(spoken) ?? null });
}

/** Fusion non destructive : ce canal est libre aujourd'hui, il ne le restera pas. */
function mergeMeta(existing: string | null | undefined, patch: Record<string, unknown>): string {
    let base: Record<string, unknown> = {};
    if (existing && existing.trim()) {
        try {
            const parsed = JSON.parse(existing);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) base = parsed as Record<string, unknown>;
        } catch { /* métadonnées illisibles : on repart d'un objet propre plutôt que d'échouer */ }
    }
    return JSON.stringify({ ...base, ...patch });
}

/** Lecture tolérante : tout ce qui n'est pas une langue du catalogue vaut Original. Ne lève jamais. */
export function decodeLiveParticipantMeta(metadata?: string | null): LiveParticipantMeta {
    const empty: LiveParticipantMeta = { lpv: 1, lang: null, spoken: null };
    if (!metadata || !metadata.trim()) return empty;
    try {
        const parsed = JSON.parse(metadata) as { lang?: unknown; spoken?: unknown };
        return {
            lpv: 1,
            lang: typeof parsed?.lang === 'string' ? listeningLanguageCode(parsed.lang) ?? null : null,
            spoken: typeof parsed?.spoken === 'string' ? listeningLanguageCode(parsed.spoken) ?? null : null,
        };
    } catch {
        return empty;
    }
}

export interface RoomListener {
    identity: string;
    metadata?: string | null;
}

/**
 * Combien de personnes demandent chaque langue, **hors moi**.
 *
 * Le compte sert à trancher quand le producteur ne peut pas tout produire
 * (voir `languagesToProduce`) — jamais à révéler qui a demandé quoi : la
 * fonction rend des nombres, pas des identités.
 */
export function requestedLanguageCounts(listeners: RoomListener[], excludeIdentity?: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const listener of listeners) {
        if (excludeIdentity && listener.identity === excludeIdentity) continue;
        const lang = decodeLiveParticipantMeta(listener.metadata).lang;
        if (!lang) continue; // Original : rien à produire pour cette personne
        counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }
    return counts;
}

/**
 * Plafond du producteur NAVIGATEUR : chaque langue supplémentaire coûte à
 * l'intervenant une traduction, une synthèse et une piste publiée de plus,
 * sur son propre appareil. Mesuré côté appels, la synthèse d'une phrase tient
 * en 4 à 7 secondes ; au-delà de trois langues simultanées, les voix
 * arriveraient après la conversation. Un agent serveur (GPU) lèvera ce
 * plafond sans changer le contrat de nom de piste — c'est tout l'intérêt de
 * l'avoir posé ici.
 */
export const MAX_BROWSER_PRODUCED_LANGUAGES = 3;

export interface ProductionPlan {
    /** Langues réellement produites pour cet intervenant, par demande décroissante. */
    produce: string[];
    /** Langues demandées mais NON produites — nommées, jamais tues (plafond atteint). */
    unserved: string[];
    /** Langues demandées qui n'ont besoin d'aucune production : l'intervenant les parle déjà. */
    alreadySpoken: string[];
}

/**
 * Ce qu'un intervenant doit produire, sachant la langue qu'il parle
 * réellement et les langues demandées autour de lui.
 *
 * Trois refus délibérés :
 * - on ne produit jamais vers la langue que la personne PARLE (§9 : l'auditeur
 *   qui l'a demandée entend déjà l'original, une seconde voix par-dessus
 *   serait un doublon) ;
 * - on ne produit jamais pour une langue que personne n'écoute ;
 * - quand la demande dépasse le plafond, les langues les plus demandées
 *   passent et les autres sont RENDUES dans `unserved`, pour que l'écran
 *   puisse le dire à ceux qui les avaient choisies.
 *
 * Départage à égalité de demande : ordre alphabétique — le plan doit être
 * identique chez tous les participants qui le calculent.
 */
export function languagesToProduce(params: {
    requested: Map<string, number>;
    spokenLanguage?: string | null;
    max?: number;
}): ProductionPlan {
    const spoken = listeningLanguageCode(params.spokenLanguage);
    const max = params.max ?? MAX_BROWSER_PRODUCED_LANGUAGES;
    const alreadySpoken: string[] = [];
    const candidates: Array<{ lang: string; count: number }> = [];
    for (const [lang, count] of params.requested) {
        if (spoken && lang === spoken) { alreadySpoken.push(lang); continue; }
        candidates.push({ lang, count });
    }
    candidates.sort((a, b) => (b.count - a.count) || a.lang.localeCompare(b.lang));
    return {
        produce: candidates.slice(0, Math.max(0, max)).map((c) => c.lang),
        unserved: candidates.slice(Math.max(0, max)).map((c) => c.lang),
        alreadySpoken: alreadySpoken.sort(),
    };
}

// ── Côté auditeur : ce que j'entends de CHAQUE intervenant ─────────────────

export interface SpeakerAudioDecision {
    /** Volume de la voix ORIGINALE de cet intervenant (0 = coupée). */
    originalVolume: number;
    /** Vrai si j'écoute cet intervenant par la voix de l'interprète. */
    interpreted: boolean;
    /** Pourquoi j'entends encore l'original alors que j'ai choisi une langue — pour le dire à l'écran, honnêtement. */
    reason: 'original_choice' | 'same_language' | 'not_available_yet' | 'interpreted';
}

/**
 * Décision PAR INTERVENANT — et c'est la vraie nouveauté par rapport à
 * l'appel à deux : dans un direct, je peux très bien entendre l'un en version
 * originale (il parle déjà ma langue) et l'autre par l'interprète, en même
 * temps. Une règle globale « je suis en traduction » serait fausse.
 *
 * L'original n'est coupé QUE lorsque sa remplaçante est réellement reçue
 * (`interpreterAvailable`). Tant qu'elle n'arrive pas — production pas encore
 * démarrée, plafond atteint, panne du fournisseur — j'entends la voix
 * originale : un son que je ne comprends pas vaut mieux qu'un silence
 * inexpliqué, et l'écran peut dire pourquoi (`reason`).
 */
export function speakerAudioDecision(params: {
    myChoice: ListeningChoice;
    /** Langue réellement DÉTECTÉE dans la parole de cet intervenant, sinon celle qu'il a déclarée. */
    speakerLanguage?: string | null;
    /** Une piste `interpreter:<ma langue>` de CET intervenant est-elle réellement souscrite ? */
    interpreterAvailable: boolean;
    /** Haut-parleur coupé par l'auditeur : 0 quoi qu'il arrive. */
    muted?: boolean;
}): SpeakerAudioDecision {
    if (params.muted) return { originalVolume: 0, interpreted: false, reason: 'original_choice' };
    const mine = listeningLanguageCode(params.myChoice);
    if (!mine) return { originalVolume: 1, interpreted: false, reason: 'original_choice' };
    const speaker = listeningLanguageCode(params.speakerLanguage);
    if (speaker && speaker === mine) return { originalVolume: 1, interpreted: false, reason: 'same_language' };
    if (!params.interpreterAvailable) return { originalVolume: 1, interpreted: false, reason: 'not_available_yet' };
    return { originalVolume: 0, interpreted: true, reason: 'interpreted' };
}

/** Libellé d'une langue d'écoute pour l'écran — « Original » quand rien n'est choisi. */
export function listeningChoiceLabel(choice: ListeningChoice): string {
    const code = listeningLanguageCode(choice);
    if (!code) return 'Original';
    return MESSAGING_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

/** Drapeau associé, ou le globe pour Original. */
export function listeningChoiceFlag(choice: ListeningChoice): string {
    const code = listeningLanguageCode(choice);
    if (!code) return '🌐';
    return MESSAGING_LANGUAGES.find((l) => l.code === code)?.flag ?? '🌐';
}

/** Une entrée du sélecteur. `value === null` = Original, toujours en tête. */
export interface ListeningLanguageOption {
    value: ListeningChoice;
    label: string;
    flag: string;
}

/**
 * Ce que la liste propose : **Original en premier**, puis le catalogue.
 *
 * Original ouvre la liste parce que c'est le défaut et le retour en arrière :
 * quelqu'un qui n'entend plus rien de bon doit retrouver l'audio d'origine en
 * haut de la liste, sans chercher (§17 — « permettre le retour immédiat à
 * l'original »).
 */
export function listeningLanguageOptions(): ListeningLanguageOption[] {
    return [
        { value: null, label: 'Original', flag: '🌐' },
        ...MESSAGING_LANGUAGES.map((l) => ({ value: l.code as ListeningChoice, label: l.label, flag: l.flag })),
    ];
}

/**
 * L'état d'écoute, dit honnêtement — jamais « ça marche » quand ça n'arrive
 * pas encore.
 *
 * Quatre situations, dans l'ordre de gravité :
 *  - la chaîne a échoué chez un intervenant → on le dit et on renvoie vers
 *    Original, jamais un silence inexpliqué ;
 *  - j'ai demandé une langue que personne ne produit encore → je continue
 *    d'entendre l'original, et l'écran le dit plutôt que de me laisser
 *    attendre une voix qui ne vient pas ;
 *  - une langue est bien demandée et servie → rien à signaler ;
 *  - Original → rien à signaler non plus.
 *
 * `tone` sépare ce qui informe de ce qui alerte : un direct ne doit pas
 * clignoter en rouge parce qu'une traduction met trois secondes à démarrer.
 */
export interface ListeningStatusLine {
    text: string | null;
    tone: 'neutre' | 'attente' | 'panne';
}

export function listeningStatusLine(params: {
    choice: ListeningChoice;
    waitingForMyLanguage: boolean;
    producerError?: string | null;
}): ListeningStatusLine {
    const code = listeningLanguageCode(params.choice);
    if (!code) return { text: null, tone: 'neutre' };
    if (params.producerError) {
        return { text: `Traduction indisponible pour l'instant — vous entendez l'audio d'origine.`, tone: 'panne' };
    }
    if (params.waitingForMyLanguage) {
        return {
            text: `Traduction en ${listeningChoiceLabel(params.choice)} pas encore disponible — vous entendez l'audio d'origine.`,
            tone: 'attente',
        };
    }
    return { text: null, tone: 'neutre' };
}
