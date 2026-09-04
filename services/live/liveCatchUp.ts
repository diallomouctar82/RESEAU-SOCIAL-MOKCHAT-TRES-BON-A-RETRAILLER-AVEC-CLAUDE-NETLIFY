/**
 * LP-8 — « ME METTRE À JOUR », DANS MA LANGUE, SUR CE QUI A ÉTÉ DIT.
 *
 * Ce que ce module corrige, mesuré avant d'être écrit :
 *
 * 1. Le rattrapage ne lisait QUE le chat tapé (`SocialLive.handleRequestCatchup`).
 *    La parole réellement prononcée — celle que LP-7 conserve dans
 *    `live_transcript_lines` — n'était jamais lue. Sur un direct où l'on parle
 *    vingt minutes sans que personne ne tape, il répondait « Aucun message n'a
 *    encore été échangé » alors que tout avait été dit ET gardé.
 * 2. Le résumé sortait toujours en français, quelle que soit la langue d'écoute
 *    choisie (LP-1). Un auditeur en russe lisait du français.
 * 3. L'assistant privé ne recevait que le TITRE du direct, et ses replis
 *    fabriquaient une réponse générique. Répondre avec assurance sur un contenu
 *    qu'on n'a pas est pire que ne pas répondre.
 *
 * Règles pures, sans réseau ni React : c'est ici que vit la décision, donc
 * c'est ici qu'elle se teste.
 */

/** Une ligne réellement PRONONCÉE, telle que LP-7 la conserve. */
export interface CatchUpSpokenLine {
    speakerName: string;
    text: string;
    spokenAt?: string;
}

/** Une ligne réellement TAPÉE dans le chat du direct. */
export interface CatchUpChatLine {
    authorName: string;
    text: string;
}

/**
 * Pourquoi il n'y a rien à résumer. La distinction est le cœur de l'honnêteté
 * de cette fonction : « personne n'a encore rien dit » et « des choses ont été
 * dites mais l'animateur n'a pas activé la conservation » ne sont PAS la même
 * chose, et laisser croire la première quand c'est la seconde est un mensonge
 * par omission.
 */
export type CatchUpEmptyReason = 'nothing-yet' | 'not-kept';

export type CatchUpMaterial =
    | { kind: 'ready'; source: string; spokenCount: number; chatCount: number }
    | { kind: 'empty'; reason: CatchUpEmptyReason };

/** Au-delà, on garde les plus RÉCENTES : un rattrapage sert à revenir dans le direct, pas à tout relire. */
const DEFAULT_MAX_LINES = 80;

function clean(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Rassemble la matière réelle du direct. La parole et le chat restent dans
 * DEUX sections distinctes et étiquetées : on ne connaît pas l'ordre relatif
 * exact des deux flux, donc on ne l'invente pas en les entrelaçant.
 */
export function buildCatchUpMaterial(params: {
    spoken: CatchUpSpokenLine[];
    chat: CatchUpChatLine[];
    /** L'animateur a-t-il activé la conservation de la parole (LP-7) ? */
    transcriptKept: boolean;
    maxLines?: number;
}): CatchUpMaterial {
    const max = params.maxLines ?? DEFAULT_MAX_LINES;
    const spoken = params.spoken.filter((l) => clean(l.text).length > 0);
    const chat = params.chat.filter((l) => clean(l.text).length > 0);

    if (spoken.length === 0 && chat.length === 0) {
        // Rien en magasin. La raison change ce qu'on a le droit d'affirmer.
        return { kind: 'empty', reason: params.transcriptKept ? 'nothing-yet' : 'not-kept' };
    }

    const sections: string[] = [];
    if (spoken.length > 0) {
        const lignes = spoken.slice(-max).map((l) => `${l.speakerName} : ${clean(l.text)}`);
        sections.push(`CE QUI A ÉTÉ DIT À VOIX HAUTE (dans l'ordre) :\n${lignes.join('\n')}`);
    }
    if (chat.length > 0) {
        const lignes = chat.slice(-max).map((l) => `${l.authorName} : ${clean(l.text)}`);
        sections.push(`CE QUI A ÉTÉ ÉCRIT DANS LE CHAT :\n${lignes.join('\n')}`);
    }

    return {
        kind: 'ready',
        source: sections.join('\n\n'),
        spokenCount: spoken.length,
        chatCount: chat.length,
    };
}

/**
 * La consigne de langue. `undefined` = l'auditeur écoute en version originale :
 * on ne force alors aucune langue de sortie, le modèle répond dans la langue
 * de la matière — c'est exactement ce que « Original » veut dire.
 */
function languageDirective(language?: string): string {
    if (!language) return '';
    return `\n\nRéponds INTÉGRALEMENT en « ${language} », y compris les puces. C'est la langue d'écoute choisie par cette personne.`;
}

/** Le prompt du rattrapage. Ne demande jamais autre chose que ce qui est dans la matière. */
export function catchUpPrompt(params: {
    material: Extract<CatchUpMaterial, { kind: 'ready' }>;
    title: string;
    language?: string;
}): string {
    return [
        `Voici la matière RÉELLE du direct « ${params.title} ».`,
        '',
        params.material.source,
        '',
        "Résume en 3 puces courtes ce qu'une personne qui arrive en retard doit savoir.",
        "Appuie-toi UNIQUEMENT sur la matière ci-dessus : n'ajoute aucun fait, aucun chiffre, aucun nom qui n'y figure pas.",
        "Si la matière est trop maigre pour trois puces, donne-en moins et dis-le.",
    ].join('\n') + languageDirective(params.language);
}

/**
 * Le prompt de l'assistant privé. Même exigence, plus une : il a le droit de
 * ne pas savoir. C'est ce droit qui manquait — sans lui, il inventait.
 */
export function assistantPrompt(params: {
    material: CatchUpMaterial;
    question: string;
    title: string;
    language?: string;
}): string {
    const matiere = params.material.kind === 'ready'
        ? params.material.source
        : '(aucune parole ni message conservé pour ce direct)';
    return [
        `Tu es l'assistant privé et discret d'une personne qui suit le direct « ${params.title} ».`,
        '',
        'MATIÈRE RÉELLE DU DIRECT :',
        matiere,
        '',
        `Cette personne te demande en aparté : « ${params.question} »`,
        '',
        "Réponds en 2 à 3 phrases maximum, en t'appuyant sur la matière ci-dessus.",
        "Si la réponse ne s'y trouve pas, dis-le simplement — par exemple « ça n'a pas encore été abordé dans ce direct » — et n'invente RIEN : ni définition, ni chiffre, ni procédure.",
    ].join('\n') + languageDirective(params.language);
}

/**
 * Ce qui s'affiche quand il n'y a rien à résumer. Deux phrases différentes pour
 * deux situations différentes — voir `CatchUpEmptyReason`.
 */
export function catchUpEmptyMessage(reason: CatchUpEmptyReason): string {
    return reason === 'nothing-yet'
        ? "Rien n'a encore été dit ni écrit dans ce direct — il n'y a pas de quoi faire un résumé pour l'instant."
        : "Ce direct n'enregistre pas la parole : ce qui a été dit avant votre arrivée n'a été conservé nulle part, et personne n'a écrit dans le chat. Il n'y a donc rien à résumer — ce n'est pas que rien ne s'est passé.";
}
