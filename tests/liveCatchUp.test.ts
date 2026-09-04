import { describe, it, expect } from 'vitest';
import {
    buildCatchUpMaterial,
    catchUpPrompt,
    assistantPrompt,
    catchUpEmptyMessage,
    type CatchUpMaterial,
} from '../services/live/liveCatchUp';

/**
 * LP-8 — « ME METTRE À JOUR » : ce qui doit RESTER vrai.
 *
 * Ces règles ne sont pas des détails d'implémentation : chacune répond à un
 * défaut mesuré dans l'écran avant d'écrire ce module (voir l'en-tête de
 * `services/live/liveCatchUp.ts`). Si l'une d'elles saute, le rattrapage se
 * remet à mentir — d'où un test par règle, et pas un test par fonction.
 */

const pret = (m: CatchUpMaterial) => {
    expect(m.kind, 'la matière devait être exploitable').toBe('ready');
    return m as Extract<CatchUpMaterial, { kind: 'ready' }>;
};

describe('LP-8 — pourquoi il n’y a rien à résumer', () => {
    it('« personne n’a encore parlé » et « la parole n’était pas gardée » ne sont PAS la même chose', () => {
        const rienDit = buildCatchUpMaterial({ spoken: [], chat: [], transcriptKept: true });
        const rienGarde = buildCatchUpMaterial({ spoken: [], chat: [], transcriptKept: false });

        expect(rienDit).toEqual({ kind: 'empty', reason: 'nothing-yet' });
        expect(rienGarde).toEqual({ kind: 'empty', reason: 'not-kept' });
        // La distinction ne sert à rien si les deux phrases se ressemblent.
        expect(catchUpEmptyMessage('nothing-yet')).not.toBe(catchUpEmptyMessage('not-kept'));
    });

    it('quand la parole n’était pas gardée, on le DIT — sans laisser croire qu’il ne s’est rien passé', () => {
        const phrase = catchUpEmptyMessage('not-kept');
        expect(phrase).toContain("n'enregistre pas la parole");
        expect(phrase).toContain("ce n'est pas que rien ne s'est passé");
    });

    it('des lignes vides ou blanches ne comptent pas comme de la matière', () => {
        const m = buildCatchUpMaterial({
            spoken: [{ speakerName: 'Awa', text: '   ' }],
            chat: [{ authorName: 'Sekou', text: '\n\t ' }],
            transcriptKept: true,
        });
        expect(m).toEqual({ kind: 'empty', reason: 'nothing-yet' });
    });
});

describe('LP-8 — la parole du direct entre enfin dans le résumé', () => {
    it('un direct où l’on a PARLÉ sans rien taper a bien de la matière', () => {
        // Le défaut d'origine : `handleRequestCatchup` ne lisait que le chat,
        // donc ce cas répondait « aucun message échangé » alors que tout avait
        // été dit ET gardé.
        const m = pret(buildCatchUpMaterial({
            spoken: [
                { speakerName: 'Awa', text: 'Le dossier part lundi.' },
                { speakerName: 'Ivan', text: 'Il manque la pièce 3.' },
            ],
            chat: [],
            transcriptKept: true,
        }));
        expect(m.spokenCount).toBe(2);
        expect(m.chatCount).toBe(0);
        expect(m.source).toContain('Le dossier part lundi.');
        expect(m.source).toContain('Awa');
    });

    it('la parole et le chat restent dans DEUX sections étiquetées, jamais entrelacées', () => {
        // On ne connaît pas l'ordre relatif exact des deux flux : les mélanger
        // reviendrait à inventer une chronologie.
        const m = pret(buildCatchUpMaterial({
            spoken: [{ speakerName: 'Awa', text: 'phrase-dite-1' }, { speakerName: 'Awa', text: 'phrase-dite-2' }],
            chat: [{ authorName: 'Sekou', text: 'phrase-tapee-1' }],
            transcriptKept: true,
        }));

        const debutChat = m.source.indexOf('CE QUI A ÉTÉ ÉCRIT DANS LE CHAT');
        expect(m.source).toContain('CE QUI A ÉTÉ DIT À VOIX HAUTE');
        expect(debutChat).toBeGreaterThan(-1);
        // TOUTE la parole passe avant l'en-tête du chat : c'est exactement ce
        // qu'un entrelacement casserait.
        expect(m.source.indexOf('phrase-dite-1')).toBeLessThan(debutChat);
        expect(m.source.indexOf('phrase-dite-2')).toBeLessThan(debutChat);
        expect(m.source.indexOf('phrase-tapee-1')).toBeGreaterThan(debutChat);
    });

    it('une section absente n’apparaît pas comme un titre vide', () => {
        const parleSeulement = pret(buildCatchUpMaterial({
            spoken: [{ speakerName: 'Awa', text: 'seulement à voix haute' }],
            chat: [],
            transcriptKept: true,
        }));
        expect(parleSeulement.source).not.toContain('CE QUI A ÉTÉ ÉCRIT DANS LE CHAT');

        const tapeSeulement = pret(buildCatchUpMaterial({
            spoken: [],
            chat: [{ authorName: 'Sekou', text: 'seulement tapé' }],
            transcriptKept: false,
        }));
        expect(tapeSeulement.source).not.toContain('CE QUI A ÉTÉ DIT À VOIX HAUTE');
        // Rien n'a été gardé côté parole, mais le chat suffit : ce n'est pas vide.
        expect(tapeSeulement.chatCount).toBe(1);
    });

    it('quand il y a trop de matière, on garde les lignes les plus RÉCENTES', () => {
        // Un rattrapage sert à revenir dans le direct, pas à relire trois heures.
        const spoken = Array.from({ length: 10 }, (_, i) => ({ speakerName: 'Awa', text: `ligne-${i}` }));
        const m = pret(buildCatchUpMaterial({ spoken, chat: [], transcriptKept: true, maxLines: 3 }));

        expect(m.source).toContain('ligne-9');
        expect(m.source).toContain('ligne-7');
        expect(m.source).not.toContain('ligne-6');
        expect(m.source).not.toContain('ligne-0');
    });
});

describe('LP-8 — le résumé sort dans MA langue d’écoute', () => {
    const matiere = pret(buildCatchUpMaterial({
        spoken: [{ speakerName: 'Awa', text: 'Le dossier part lundi.' }],
        chat: [],
        transcriptKept: true,
    }));

    it('une langue choisie devient une consigne explicite', () => {
        const p = catchUpPrompt({ material: matiere, title: 'Financement', language: 'русский' });
        expect(p).toContain('русский');
        expect(p).toContain('INTÉGRALEMENT');
    });

    it('en Original, AUCUNE langue de sortie n’est forcée', () => {
        // « Original » veut dire : le modèle répond dans la langue de la
        // matière. Forcer le français ici était le défaut n° 2.
        const p = catchUpPrompt({ material: matiere, title: 'Financement' });
        expect(p).not.toContain('INTÉGRALEMENT');
        expect(p).not.toContain("langue d'écoute choisie");
    });

    it('le prompt interdit d’ajouter ce qui n’est pas dans la matière', () => {
        const p = catchUpPrompt({ material: matiere, title: 'Financement' });
        expect(p).toContain('Le dossier part lundi.');
        expect(p).toContain('UNIQUEMENT');
        expect(p).toContain("n'ajoute aucun fait");
    });
});

describe('LP-8 — l’assistant privé a le droit de ne pas savoir', () => {
    it('il reçoit la matière RÉELLE du direct, pas seulement le titre', () => {
        const matiere = buildCatchUpMaterial({
            spoken: [{ speakerName: 'Awa', text: 'La pièce 3 est un extrait Kbis.' }],
            chat: [],
            transcriptKept: true,
        });
        const p = assistantPrompt({ material: matiere, question: 'c’est quoi la pièce 3 ?', title: 'Financement' });
        expect(p).toContain('La pièce 3 est un extrait Kbis.');
        expect(p).toContain('c’est quoi la pièce 3 ?');
    });

    it('il lui est TOUJOURS interdit d’inventer, matière ou pas', () => {
        // Le défaut le plus grave : deux replis fabriquaient des définitions
        // (« ce terme désigne la conformité légale obligatoire ») sur un direct
        // dont l'assistant ne connaissait que le titre.
        const avec = assistantPrompt({
            material: buildCatchUpMaterial({ spoken: [{ speakerName: 'Awa', text: 'x' }], chat: [], transcriptKept: true }),
            question: 'q', title: 't',
        });
        const sans = assistantPrompt({
            material: buildCatchUpMaterial({ spoken: [], chat: [], transcriptKept: false }),
            question: 'q', title: 't',
        });
        for (const p of [avec, sans]) {
            expect(p).toContain("n'invente RIEN");
            expect(p).toContain('dis-le simplement');
        }
    });

    it('sans matière, il le sait — au lieu de croire qu’on ne lui a rien transmis', () => {
        const p = assistantPrompt({
            material: buildCatchUpMaterial({ spoken: [], chat: [], transcriptKept: false }),
            question: 'q', title: 't',
        });
        expect(p).toContain('aucune parole ni message conservé');
    });

    it('lui aussi répond dans MA langue quand j’en ai choisi une', () => {
        const matiere = buildCatchUpMaterial({ spoken: [{ speakerName: 'Awa', text: 'x' }], chat: [], transcriptKept: true });
        expect(assistantPrompt({ material: matiere, question: 'q', title: 't', language: 'English' })).toContain('English');
        expect(assistantPrompt({ material: matiere, question: 'q', title: 't' })).not.toContain('INTÉGRALEMENT');
    });
});
