import { describe, expect, it } from 'vitest';
import {
    acousticClass,
    isVowelPhone,
    lastFullVowel,
    scriptFromText,
    scriptToString,
    visemeTarget,
    wordToPhones,
} from '../services/architecte/phonemes';

/**
 * TEXTE → PHONÈMES → VISÈMES (playbook 15 § 5 : visèmes réellement produits).
 *
 * La phrase de référence de la Direction, mot à mot : ce que l'œil attend —
 * lèvres jointes sur b, p, m ; dents sur f, v, s ; bouche ouverte sur a — doit
 * sortir de la transcription, sinon la bouche ne peut pas être juste.
 */
const PHRASE = 'Bonjour, je suis l’avatar de Vision Smart. Je suis ici pour accompagner, expliquer et guider les utilisateurs avec une voix claire, naturelle et professionnelle.';

describe('Graphème → phonème : la phrase Vision Smart', () => {
    it.each([
        ['Bonjour', 'b on Z u R'],
        ['je', 'Z @'],
        ['suis', 's H i'],
        ['l’avatar', 'l a v a t a R'],
        ['de', 'd @'],
        ['Vision', 'v i z j on'],
        ['Smart', 's m a R t'],
        ['ici', 'i s i'],
        ['pour', 'p u R'],
        ['accompagner', 'a k on p a J e'],
        ['expliquer', 'E k s p l i k e'],
        ['et', 'e'],
        ['guider', 'g i d e'],
        ['les', 'l e'],
        ['utilisateurs', 'y t i l i z a t 9 R'],
        ['avec', 'a v E k'],
        ['une', 'y n'],
        ['voix', 'v w a'],
        ['claire', 'k l E R'],
        ['naturelle', 'n a t y R E l'],
        ['professionnelle', 'p R O f E s j O n E l'],
    ])('%s → %s', (mot, attendu) => {
        expect(wordToPhones(mot).join(' ')).toBe(attendu);
    });

    it('transcrit toute la phrase : 24 mots, 45 syllabes, ponctuation gardée comme pauses', () => {
        const script = scriptFromText(PHRASE);
        expect(script).toHaveLength(24);
        expect(script.reduce((n, w) => n + w.syllables, 0)).toBe(45);
        expect(script[0].punctuation).toBe(',');   // Bonjour,
        expect(script[6].punctuation).toBe('.');   // Smart.
        expect(script[11].punctuation).toBe(',');  // accompagner,
        expect(script[20].punctuation).toBe(',');  // claire,
        expect(script[23].punctuation).toBe('.');  // professionnelle.
        expect(script.filter((w) => w.punctuation === '').length).toBe(19);
        expect(scriptToString(script)).toContain('s m a R t .');
    });

    it('pose l’accent de groupe sur la dernière voyelle avant une ponctuation, un accent de mot sur les mots longs', () => {
        const script = scriptFromText(PHRASE);
        const smart = script[6];
        expect(smart.stress[smart.phones.indexOf('a')]).toBe(1);
        const avatar = script[3];
        expect(avatar.stress[lastFullVowel(avatar.phones)]).toBe(0.5);
        const je = script[1];
        expect(je.stress.every((s) => s === 0)).toBe(true);
        const pro = script[23];
        expect(pro.stress[lastFullVowel(pro.phones)]).toBe(1);
        expect(pro.phones[lastFullVowel(pro.phones)]).toBe('E');
    });
});

describe('Règles générales du français (échantillon)', () => {
    it.each([
        ['exemple', 'E g z an p l'],
        ['attention', 'a t an s j on'],
        ['travail', 't R a v a j'],
        ['fille', 'f i j'],
        ['moment', 'm O m an'],
        ['peuvent', 'p 9 v'],
        ['question', 'k E s t j on'],
        ['oui', 'w i'],
        ['bien', 'b j en'],
        ['premier', 'p R @ m j e'],
        ['membres', 'm an b R'],
        ['photo', 'f O t o'],
        ['réseau', 'R e z o'],
        ['aujourd’hui', 'o Z u R d H i'],
        ['MokNet', 'm O k n E t'],
        ['3', 't R w a'],
        ['2026', 'd 2 z e R o d 2 s i s'],
    ])('%s → %s', (mot, attendu) => {
        expect(wordToPhones(mot).join(' ')).toBe(attendu);
    });

    it('ignore ce qui n’est pas un mot et garde une ponctuation isolée comme pause', () => {
        expect(wordToPhones('—')).toEqual([]);
        expect(wordToPhones('')).toEqual([]);
        const script = scriptFromText('Bonjour — je suis là');
        expect(script.map((w) => w.text)).toEqual(['Bonjour', 'je', 'suis', 'là']);
        expect(script[0].punctuation).toBe(',');
        expect(script[3].punctuation).toBe('.');
    });
});

describe('Visèmes : ce que l’œil attend de chaque son', () => {
    it('b, p, m : lèvres jointes, bouche fermée', () => {
        for (const p of ['b', 'p', 'm'] as const) {
            expect(visemeTarget(p)).toMatchObject({ open: 0, closed: 1 });
        }
    });
    it('f, v, s, z : dents visibles ; « a » grand ouvert ; « i » étiré ; « ou » arrondi', () => {
        expect(visemeTarget('f').teeth).toBeGreaterThanOrEqual(0.8);
        expect(visemeTarget('s').teeth).toBeGreaterThanOrEqual(0.6);
        expect(visemeTarget('a').open).toBe(1);
        expect(visemeTarget('i').width).toBeGreaterThan(1.1);
        expect(visemeTarget('u').width).toBeLessThan(0.85);
        expect(visemeTarget('_')).toMatchObject({ open: 0, closed: 1, teeth: 0 });
    });
    it('classes acoustiques : ce que l’aligneur peut distinguer', () => {
        expect(acousticClass('a')).toBe('V_OPEN');
        expect(acousticClass('i')).toBe('V_CLOSE');
        expect(acousticClass('m')).toBe('NASAL');
        expect(acousticClass('p')).toBe('STOP_U');
        expect(acousticClass('b')).toBe('STOP_V');
        expect(acousticClass('s')).toBe('FRIC_S');
        expect(acousticClass('Z')).toBe('FRIC_Z');
        expect(acousticClass('f')).toBe('FRIC_F');
        expect(acousticClass('_')).toBe('SIL');
        expect(isVowelPhone('on')).toBe(true);
        expect(isVowelPhone('R')).toBe(false);
    });
});
