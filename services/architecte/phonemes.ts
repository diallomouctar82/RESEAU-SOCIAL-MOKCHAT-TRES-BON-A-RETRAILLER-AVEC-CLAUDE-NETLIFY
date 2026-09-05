/**
 * PHONÈMES ET VISÈMES DU FRANÇAIS — le texte que l'Architecte va dire, avant
 * qu'il le dise.
 *
 * Playbook 15 § 5 (AI Core) : « TTS avec horodatage de sortie ; visèmes
 * fournis par le moteur, ou fallback d'animation simple liée à l'activité
 * audio » et « une synchro bouche approximative ne doit pas être présentée
 * comme une synchronisation phonétique exacte ». La chaîne vocale du
 * Super-Admin rend un CLIP COMPLET avant sa lecture : le texte est connu, le
 * son est connu. Ce module fournit le côté TEXTE : une transcription
 * phonétique par règles (graphème → phonème du français), la ponctuation
 * (pauses), le rythme (syllabes accentuées) et, pour chaque phonème, la forme
 * de bouche visée (visème). Le côté SON — caler ces phonèmes sur le clip —
 * est dans `alignment.ts`.
 *
 * Ce que c'est : un transcripteur par RÈGLES (pas un dictionnaire complet ni
 * un modèle appris), suffisant pour les visèmes : ce qui compte pour l'œil,
 * c'est la CLASSE du son — lèvres jointes (b, p, m), dents (f, v, s), bouche
 * ouverte (a), étirée (i), arrondie (ou) — bien plus que la nuance exacte
 * d'une voyelle. Les limites connues sont dites en bas du fichier.
 *
 * Module pur, sans dépendance : testable ligne à ligne.
 */

/** Phonèmes du français, en ASCII (proche du SAMPA) : `an` = ɑ̃, `en` = ɛ̃, `on` = ɔ̃, `un` = œ̃, `2` = ø, `9` = œ, `@` = ə, `S` = ʃ, `Z` = ʒ, `J` = ɲ, `R` = ʁ, `H` = ɥ. */
export type Phone =
    | 'a' | 'e' | 'E' | 'i' | 'o' | 'O' | 'u' | 'y' | '2' | '9' | '@' | 'an' | 'en' | 'on' | 'un'
    | 'p' | 'b' | 't' | 'd' | 'k' | 'g' | 'f' | 'v' | 's' | 'z' | 'S' | 'Z' | 'm' | 'n' | 'J' | 'N' | 'l' | 'R'
    | 'j' | 'w' | 'H';

export const VOWELS: ReadonlySet<string> = new Set(['a', 'e', 'E', 'i', 'o', 'O', 'u', 'y', '2', '9', '@', 'an', 'en', 'on', 'un']);

export function isVowelPhone(p: string): boolean {
    return VOWELS.has(p);
}

/**
 * Classe acoustique d'un phonème — ce que l'aligneur peut réellement
 * distinguer dans le signal (énergie, taux de passages par zéro, part
 * haute) : une voyelle ouverte d'une fermée, une nasale d'une occlusive,
 * une sifflante d'une fricative faible, un silence de tout le reste.
 */
export type AcousticClass =
    | 'V_OPEN' | 'V_MID' | 'V_CLOSE' | 'SCHWA' | 'GLIDE' | 'NASAL' | 'LIQUID'
    | 'STOP_U' | 'STOP_V' | 'FRIC_S' | 'FRIC_Z' | 'FRIC_F' | 'SIL';

export function acousticClass(p: Phone | '_'): AcousticClass {
    switch (p) {
        case 'a': case 'an': case 'O': return 'V_OPEN';
        case 'e': case 'E': case 'en': case 'on': case 'un': case 'o': case '2': case '9': return 'V_MID';
        case 'i': case 'y': case 'u': return 'V_CLOSE';
        case '@': return 'SCHWA';
        case 'j': case 'w': case 'H': return 'GLIDE';
        case 'm': case 'n': case 'J': case 'N': return 'NASAL';
        case 'l': case 'R': return 'LIQUID';
        case 'p': case 't': case 'k': return 'STOP_U';
        case 'b': case 'd': case 'g': return 'STOP_V';
        case 's': case 'S': return 'FRIC_S';
        case 'z': case 'Z': return 'FRIC_Z';
        case 'f': case 'v': return 'FRIC_F';
        default: return 'SIL';
    }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. VISÈMES : forme de bouche visée par phonème
// ─────────────────────────────────────────────────────────────────────────

/**
 * Cible de bouche d'un phonème. `open` en unités « a = 1 » (une voyelle « a »
 * franche), à ramener à l'amplitude de parole par l'appelant ; `width` en
 * facteur de la largeur de la photo ; `teeth` dents visibles ; `closed`
 * lèvres jointes.
 */
export interface VisemeTarget {
    open: number;
    width: number;
    teeth: number;
    closed: number;
}

const V = (open: number, width: number, teeth = 0, closed = 0): VisemeTarget => ({ open, width, teeth, closed });

const VISEMES: Record<Phone | '_', VisemeTarget> = {
    a: V(1, 1), an: V(0.9, 0.98), O: V(0.65, 0.86), o: V(0.55, 0.84), on: V(0.6, 0.84),
    E: V(0.62, 1.1), e: V(0.5, 1.12), en: V(0.6, 1.08), un: V(0.5, 0.95),
    i: V(0.32, 1.2), y: V(0.3, 0.8), u: V(0.35, 0.78), '2': V(0.42, 0.9), '9': V(0.48, 0.9), '@': V(0.4, 0.95),
    j: V(0.3, 1.15), w: V(0.3, 0.78), H: V(0.3, 0.8),
    // Lèvres JOINTES : la fermeture que l'œil attend sur « b », « p », « m ».
    p: V(0, 1, 0, 1), b: V(0, 1, 0, 1), m: V(0, 1, 0, 1),
    // Dents sur la lèvre (« f », « v ») ; sifflantes étirées ; chuintantes arrondies.
    f: V(0.12, 1.02, 0.9), v: V(0.12, 1.02, 0.9),
    s: V(0.16, 1.08, 0.7), z: V(0.16, 1.08, 0.7),
    S: V(0.2, 0.86, 0.5), Z: V(0.2, 0.86, 0.5),
    t: V(0.25, 1.02), d: V(0.25, 1.02), n: V(0.25, 1.02), l: V(0.25, 1.02),
    k: V(0.35, 1), g: V(0.35, 1), N: V(0.35, 1), R: V(0.35, 1), J: V(0.28, 1.02),
    _: V(0, 1, 0, 1),
};

export function visemeTarget(p: Phone | '_'): VisemeTarget {
    return VISEMES[p] ?? VISEMES._;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. GRAPHÈME → PHONÈME (règles du français)
// ─────────────────────────────────────────────────────────────────────────

const VOWEL_LETTERS = 'aeiouyàâäéèêëîïôöùûüœæ';
const isV = (c: string): boolean => c !== '' && VOWEL_LETTERS.includes(c);

/** Mots dont l'orthographe trompe les règles (grammaticaux, finales prononcées, marques). */
const LEXICON: Record<string, Phone[]> = {
    et: ['e'], est: ['E'], es: ['E'], ai: ['e'], as: ['a'],
    les: ['l', 'e'], des: ['d', 'e'], mes: ['m', 'e'], tes: ['t', 'e'], ses: ['s', 'e'], ces: ['s', 'e'],
    je: ['Z', '@'], de: ['d', '@'], le: ['l', '@'], me: ['m', '@'], te: ['t', '@'], se: ['s', '@'], ce: ['s', '@'], ne: ['n', '@'], que: ['k', '@'],
    un: ['un'], une: ['y', 'n'], en: ['an'], on: ['on'], eu: ['y'], a: ['a'], à: ['a'], y: ['i'], ou: ['u'], où: ['u'],
    il: ['i', 'l'], ils: ['i', 'l'], elle: ['E', 'l'], elles: ['E', 'l'], nous: ['n', 'u'], vous: ['v', 'u'],
    femme: ['f', 'a', 'm'], monsieur: ['m', '@', 's', 'j', '2'], messieurs: ['m', 'e', 's', 'j', '2'],
    ville: ['v', 'i', 'l'], mille: ['m', 'i', 'l'], tranquille: ['t', 'R', 'an', 'k', 'i', 'l'],
    question: ['k', 'E', 's', 't', 'j', 'on'], second: ['s', '@', 'g', 'on'], fils: ['f', 'i', 's'], plus: ['p', 'l', 'y', 's'], tous: ['t', 'u', 's'],
    temps: ['t', 'an'], longtemps: ['l', 'on', 't', 'an'], corps: ['k', 'O', 'R'], sept: ['s', 'E', 't'], huit: ['H', 'i', 't'], dix: ['d', 'i', 's'], six: ['s', 'i', 's'],
    cinq: ['s', 'en', 'k'], neuf: ['n', '9', 'f'], deux: ['d', '2'], trois: ['t', 'R', 'w', 'a'], quatre: ['k', 'a', 't', 'R'], zéro: ['z', 'e', 'R', 'o'],
    // Marques et mots techniques prononcés à l'anglaise ou avec finale sonore.
    smart: ['s', 'm', 'a', 'R', 't'], moknet: ['m', 'O', 'k', 'n', 'E', 't'], mokchat: ['m', 'O', 'k', 't', 'S', 'a', 't'], net: ['n', 'E', 't'],
    internet: ['en', 't', 'E', 'R', 'n', 'E', 't'], web: ['w', 'E', 'b'], wifi: ['w', 'i', 'f', 'i'], mail: ['m', 'E', 'l'], email: ['i', 'm', 'E', 'l'],
    ok: ['o', 'k', 'e'], google: ['g', 'u', 'g', '9', 'l'], chat: ['t', 'S', 'a', 't'], club: ['k', 'l', '9', 'b'], bug: ['b', '9', 'g'],
};

/** Élisions : « l’avatar », « j’ai », « qu’il »… la consonne se colle au mot suivant. */
const CONTRACTIONS: Record<string, Phone[]> = {
    l: ['l'], d: ['d'], j: ['Z'], n: ['n'], m: ['m'], t: ['t'], s: ['s'], c: ['s'], qu: ['k'],
};

const DIGIT_WORDS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];

/** Noms et adjectifs en « -ent » (prononcé ɑ̃) ; les autres « -ent » après consonne sont lus comme des verbes (muets). */
const ENT_NOUNS = new Set([
    'argent', 'urgent', 'présent', 'absent', 'parent', 'accident', 'différent', 'content', 'récent', 'agent', 'incident', 'évident',
    'excellent', 'intelligent', 'permanent', 'transparent', 'compétent', 'précédent', 'moment', 'comment', 'document', 'élément',
    'paiement', 'abonnement', 'événement', 'vraiment', 'également', 'seulement', 'rapidement', 'simplement', 'souvent', 'lent', 'dent', 'vent', 'cent',
]);

/**
 * Transcrit un mot (lettres, apostrophes, traits d'union) en phonèmes.
 * Renvoie une liste vide pour un mot sans lettre.
 */
export function wordToPhones(raw: string): Phone[] {
    let w = raw.normalize('NFC').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^a-zàâäéèêëîïôöùûüçœæ0-9'-]/g, '');
    if (!w) return [];
    if (/\d/.test(w)) {
        // Un nombre se lit chiffre par chiffre (limite connue : « 2026 » n'est pas « deux mille vingt-six »).
        return [...w].flatMap((c) => (/\d/.test(c) ? wordToPhones(DIGIT_WORDS[Number(c)]) : wordToPhones(c)));
    }
    const contraction = /^(l|d|j|n|m|t|s|c|qu)'(.+)$/.exec(w);
    if (contraction) return [...CONTRACTIONS[contraction[1]], ...wordToPhones(contraction[2])];
    w = w.replace(/'/g, '');
    if (w.includes('-')) return w.split('-').flatMap((part) => wordToPhones(part));
    const lex = LEXICON[w];
    if (lex) return [...lex];
    return rulesToPhones(w);
}

function nasalAt(w: string, i: number): { phones: Phone[]; len: number } | null {
    const n = w.length;
    const nasalEnd = (k: number): boolean => k >= n || (!isV(w[k]) && w[k] !== 'n' && w[k] !== 'm' && w[k] !== 'h');
    const tryPattern = (pattern: string, phones: Phone[]): { phones: Phone[]; len: number } | null =>
        w.startsWith(pattern, i) && nasalEnd(i + pattern.length) ? { phones, len: pattern.length } : null;
    return (
        tryPattern('oin', ['w', 'en']) ||
        tryPattern('ien', ['j', 'en']) ||
        tryPattern('éen', ['e', 'en']) ||
        tryPattern('ain', ['en']) || tryPattern('aim', ['en']) || tryPattern('ein', ['en']) || tryPattern('eim', ['en']) ||
        tryPattern('an', ['an']) || tryPattern('am', ['an']) || tryPattern('en', ['an']) || tryPattern('em', ['an']) ||
        tryPattern('in', ['en']) || tryPattern('im', ['en']) || tryPattern('yn', ['en']) || tryPattern('ym', ['en']) ||
        tryPattern('on', ['on']) || tryPattern('om', ['on']) ||
        tryPattern('un', ['un']) || tryPattern('um', ['un'])
    );
}

function rulesToPhones(w: string): Phone[] {
    const out: Phone[] = [];
    const n = w.length;
    const push = (...ps: Phone[]) => {
        for (const p of ps) {
            // Deux consonnes identiques de suite n'en font qu'une (« excellent » : k s s → k s).
            if (!isVowelPhone(p) && out.length && out[out.length - 1] === p) continue;
            out.push(p);
        }
    };
    let i = 0;
    while (i < n) {
        const c = w[i];
        const c1 = w[i + 1] ?? '';
        const c2 = w[i + 2] ?? '';
        const r = w.slice(i);

        // ── Finales ──────────────────────────────────────────────────────
        if (i > 0) {
            if (r === 'er' && n > 2) { push('e'); break; }
            if (r === 'ez') { push('e'); break; }
            if (r === 'et') { push('E'); break; }
            if (r === 'ent' && n > 3) {
                if (w[i - 1] === 'm' || ENT_NOUNS.has(w)) push('an');
                else if (w[i - 1] === 'i') push('an'); // « client », « patient » (le « i » a déjà donné « j »)
                break; // verbe (« accompagnent ») : muet
            }
            if (r === 'e' || r === 'es') break;
            if (r === 'ée' || r === 'ées') { push('e'); break; }
            if (r === 'ie' || r === 'ies') { push('i'); break; }
            if (r === 'ue' || r === 'ues') { if (w[i - 1] !== 'q' && w[i - 1] !== 'g') push('y'); break; }
            if (/^[tdpgxzs]s?$/.test(r) || r === 'ct' || r === 'st') break; // consonnes finales muettes (« temps », « Smart » : lexique)
        }

        // ── Voyelles nasales ─────────────────────────────────────────────
        const nasal = nasalAt(w, i);
        if (nasal) { push(...nasal.phones); i += nasal.len; continue; }

        // ── Digrammes de voyelles ────────────────────────────────────────
        // « travail », « soleil », « fauteuil », « fenouil » (+ « -le(s) ») : voyelle + yod.
        const yodTail = /^(a|e|eu|ou)il(le?s?)?$/.exec(r);
        if (yodTail && i > 0 || (yodTail && yodTail[1] !== 'e')) {
            push(({ a: 'a', e: 'E', eu: '9', ou: 'u' } as Record<string, Phone>)[yodTail[1]], 'j');
            break;
        }
        if (r.startsWith('eau')) { push('o'); i += 3; continue; }
        if (r.startsWith('au')) { push('o'); i += 2; continue; }
        if (c === 'o' && (c1 === 'u' || c1 === 'ù' || c1 === 'û')) {
            if (isV(c2) && c2 !== 'u') { push('w'); i += 2; continue; }
            push('u'); i += 2; continue;
        }
        if (c === 'o' && (c1 === 'i' || c1 === 'î')) { push('w', 'a'); i += 2; continue; }
        if (c === 'o' && c1 === 'y' && isV(c2)) { push('w', 'a', 'j'); i += 2; continue; }
        if ((c === 'a' && (c1 === 'i' || c1 === 'î')) || (c === 'e' && c1 === 'i')) {
            push(r === 'ai' ? 'e' : 'E'); i += 2; continue;
        }
        if (c === 'a' && c1 === 'y') { push('E', 'j'); i += 2; continue; }
        if (c === 'e' && (c1 === 'u' || c1 === 'û')) {
            const next = c2;
            const pronounced = next !== '' && !isV(next) && !(i + 2 === n - 1 && 'sxzdtp'.includes(next));
            push(pronounced ? '9' : '2'); i += 2; continue;
        }
        if (c === 'œ') { push('9'); i += c1 === 'u' ? 2 : 1; continue; }
        if (c === 'æ') { push('e'); i += 1; continue; }
        // « ill », « ail », « eil », « euil », « ouil » : le « i » devient un yod.
        if (c === 'i' && c1 === 'l' && c2 === 'l') {
            if (i > 0 && isV(w[i - 1])) push('j');
            else push('i', 'j');
            i += 3; continue;
        }
        if (c === 'i' && c1 === 'l' && i + 2 === n && i > 0 && isV(w[i - 1])) { push('j'); i += 2; continue; }
        if (c === 'y') {
            if (i > 0 && isV(w[i - 1]) && isV(c1)) push('j'); else push('i');
            i += 1; continue;
        }
        if (c === 'i' || c === 'î' || c === 'ï') {
            if (isV(c1) && c1 !== 'i' && c1 !== 'î') { push('j'); i += 1; continue; }
            push('i'); i += 1; continue;
        }
        if (c === 'u' || c === 'û' || c === 'ù' || c === 'ü') {
            if (isV(c1) && c1 !== 'u' && !(i > 0 && (w[i - 1] === 'q' || w[i - 1] === 'g'))) { push('H'); i += 1; continue; }
            push('y'); i += 1; continue;
        }
        if (c === 'a' || c === 'à' || c === 'â' || c === 'ä') { push('a'); i += 1; continue; }
        if (c === 'é') { push('e'); i += 1; continue; }
        if (c === 'è' || c === 'ê' || c === 'ë') { push('E'); i += 1; continue; }
        if (c === 'ô' || c === 'ö') { push('o'); i += 1; continue; }
        if (c === 'o') {
            const beforeVoicedS = c1 === 's' && isV(c2);
            const beforeConsonant = c1 !== '' && !isV(c1) && !beforeVoicedS && !(i + 1 === n - 1 && 'sxzdtp'.includes(c1));
            push(beforeConsonant ? 'O' : 'o'); i += 1; continue;
        }
        if (c === 'e') {
            if (c1 === 'x') { push('E'); i += 1; continue; }
            const twoConsonants = c1 !== '' && !isV(c1) && c1 !== 'h' && c2 !== '' && !isV(c2)
                && !((c1 === 'c' || c1 === 'p' || c1 === 't') && c2 === 'h') && !(c1 === 'g' && c2 === 'n')
                && !((c2 === 'r' || c2 === 'l') && c1 !== 'r' && c1 !== 'l');
            const consonantThenEnd = c1 !== '' && !isV(c1) && (i + 1 === n - 1 || /^[a-zç]s?$/.test(w.slice(i + 1)) && (i + 2 === n - 1 && 'sxzdtp'.includes(c2)));
            if (twoConsonants || consonantThenEnd) push('E');
            else if (c1 !== '' && !isV(c1) && isV(c2)) push('@');
            else push('E');
            i += 1; continue;
        }

        // ── Consonnes ────────────────────────────────────────────────────
        if (c === 'b') { push('b'); i += c1 === 'b' ? 2 : 1; continue; }
        if (c === 'c') {
            if (c1 === 'h') {
                const hard = c2 === 'r' || c2 === 'l' || (c2 !== '' && !isV(c2) && c2 !== 'h');
                push(hard ? 'k' : 'S'); i += 2; continue;
            }
            if (c1 === 'c') { if ('eiyéèê'.includes(c2) && c2 !== '') push('k', 's'); else push('k'); i += 2; continue; }
            if (c1 === 'k' || c1 === 'q') { push('k'); i += 2; continue; }
            if ('eiyéèêë'.includes(c1) && c1 !== '') { push('s'); i += 1; continue; }
            push('k'); i += 1; continue;
        }
        if (c === 'ç') { push('s'); i += 1; continue; }
        if (c === 'd') { push('d'); i += c1 === 'd' ? 2 : 1; continue; }
        if (c === 'f') { push('f'); i += c1 === 'f' ? 2 : 1; continue; }
        if (c === 'g') {
            if (c1 === 'n') { push('J'); i += 2; continue; }
            if (c1 === 'u' && isV(c2)) { push('g'); i += 2; continue; }
            if (c1 === 'g') { push('g'); i += 2; continue; }
            if ('eiyéèê'.includes(c1) && c1 !== '') { push('Z'); i += 1; continue; }
            push('g'); i += 1; continue;
        }
        if (c === 'h') { i += 1; continue; }
        if (c === 'j') { push('Z'); i += 1; continue; }
        if (c === 'k') { push('k'); i += c1 === 'k' ? 2 : 1; continue; }
        if (c === 'l') { push('l'); i += c1 === 'l' ? 2 : 1; continue; }
        if (c === 'm') { push('m'); i += c1 === 'm' ? 2 : 1; continue; }
        if (c === 'n') { push('n'); i += c1 === 'n' ? 2 : 1; continue; }
        if (c === 'p') {
            if (c1 === 'h') { push('f'); i += 2; continue; }
            push('p'); i += c1 === 'p' ? 2 : 1; continue;
        }
        if (c === 'q') { push('k'); i += c1 === 'u' ? 2 : 1; continue; }
        if (c === 'r') { push('R'); i += c1 === 'r' ? 2 : 1; continue; }
        if (c === 's') {
            if (c1 === 's') { push('s'); i += 2; continue; }
            if (c1 === 'h') { push('S'); i += 2; continue; }
            if (c1 === 'c' && 'eiyéèê'.includes(c2) && c2 !== '') { push('s'); i += 2; continue; }
            if (i > 0 && isV(w[i - 1]) && isV(c1)) { push('z'); i += 1; continue; }
            push('s'); i += 1; continue;
        }
        if (c === 't') {
            if (c1 === 'h') { push('t'); i += 2; continue; }
            if (c1 === 't') { push('t'); i += 2; continue; }
            const tion = c1 === 'i' && isV(c2) && c2 !== 'i' && w[i - 1] !== 's' && !(c2 === 'e' && i + 3 >= n);
            push(tion ? 's' : 't'); i += 1; continue;
        }
        if (c === 'v') { push('v'); i += 1; continue; }
        if (c === 'w') { push('w'); i += 1; continue; }
        if (c === 'x') {
            if (i === 1 && w[0] === 'e' && isV(c1)) push('g', 'z');
            else push('k', 's');
            i += 1; continue;
        }
        if (c === 'z') { push('z'); i += 1; continue; }
        i += 1; // caractère inconnu : ignoré
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. PARTITION D'UN TEXTE : mots, ponctuation, syllabes accentuées
// ─────────────────────────────────────────────────────────────────────────

/** Ponctuation qui suit un mot : `,` (proposition), `.` (phrase), ou rien. */
export type Punctuation = '' | ',' | '.';

export interface ScriptWord {
    text: string;
    phones: Phone[];
    /** Nombre de voyelles (≈ syllabes). */
    syllables: number;
    punctuation: Punctuation;
    /**
     * Poids d'accent par phonème (0 sauf sur des voyelles) : 1 = accent de
     * groupe (dernière voyelle pleine avant une ponctuation), 0.5 = accent de
     * mot (dernière voyelle d'un mot de deux syllabes ou plus).
     */
    stress: number[];
}

/**
 * Découpe un texte en mots phonétisés, garde la ponctuation comme pauses et
 * pose l'accent rythmique du français : sur la dernière syllabe pleine de
 * chaque groupe (avant une virgule ou un point), plus un accent de mot plus
 * léger sur les mots longs.
 */
export function scriptFromText(text: string): ScriptWord[] {
    const tokens = text
        .normalize('NFC')
        .replace(/[«»"“”()[\]{}*_#]/g, ' ')
        .replace(/…/g, '.')
        .split(/\s+/)
        .filter(Boolean);
    const words: ScriptWord[] = [];
    for (const token of tokens) {
        const match = /^(.*?)([.!?]+|[,;:]+|[—–-]+)?$/.exec(token);
        const core = match ? match[1] : token;
        const mark = match && match[2] ? match[2] : '';
        const punctuation: Punctuation = /[.!?]/.test(mark) ? '.' : mark ? ',' : '';
        const phones = wordToPhones(core);
        if (phones.length === 0) {
            // Ponctuation isolée (« — ») : elle marque la pause après le mot précédent.
            if (punctuation && words.length) words[words.length - 1].punctuation = words[words.length - 1].punctuation === '.' ? '.' : punctuation;
            continue;
        }
        words.push({ text: core, phones, syllables: phones.filter(isVowelPhone).length, punctuation, stress: phones.map(() => 0) });
    }
    if (words.length) words[words.length - 1].punctuation = '.';
    // Accents : dernière voyelle pleine du dernier mot de chaque groupe (1), dernière voyelle des mots longs (0,5).
    for (let k = 0; k < words.length; k += 1) {
        const word = words[k];
        const lastFull = lastFullVowel(word.phones);
        if (lastFull < 0) continue;
        if (word.punctuation) word.stress[lastFull] = 1;
        else if (word.syllables >= 2) word.stress[lastFull] = 0.5;
    }
    return words;
}

/** Index de la dernière voyelle pleine (pas un schwa) d'une suite de phonèmes, ou la dernière voyelle, ou −1. */
export function lastFullVowel(phones: Phone[]): number {
    for (let i = phones.length - 1; i >= 0; i -= 1) if (isVowelPhone(phones[i]) && phones[i] !== '@') return i;
    for (let i = phones.length - 1; i >= 0; i -= 1) if (isVowelPhone(phones[i])) return i;
    return -1;
}

/** Transcription lisible (tests, planches) : phonèmes séparés par des espaces, mots par « | ». */
export function scriptToString(words: ScriptWord[]): string {
    return words.map((w) => w.phones.join(' ') + (w.punctuation ? ` ${w.punctuation}` : '')).join(' | ');
}

// LIMITES CONNUES (dites, pas cachées) :
//  - « -ent » final après consonne est lu comme un verbe (muet), sauf les noms
//    et adverbes du petit lexique ; les nombres se lisent chiffre par chiffre ;
//  - les liaisons ne sont pas faites, les h aspirés ne sont pas distingués ;
//  - les mots étrangers hors lexique suivent les règles du français.
// Pour les visèmes, ces écarts changent au plus une voyelle ou une consonne
// de classe voisine ; l'aligneur (alignment.ts) absorbe les petits décalages.
