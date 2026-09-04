import { describe, expect, it } from 'vitest';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_PRESENCE_LEVEL,
    ARCHITECTE_STATE_LABEL,
    DEFAULT_ARCHITECTE_AVATAR,
    DEFAULT_MOUTH_ANCHOR,
    PRESENCE_TO_GRAMMAR,
    clampMouthAnchor,
    mergeArchitecteAvatarConfig,
    needsSyntheticMediaNotice,
    resolveArchitectePresence,
    resolveArchitecteVoiceId,
    shouldAnimate,
    validateArchitectePhotoUrl,
    type ArchitecteRuntimeSignals,
} from '../services/architecte/architecteAvatar';
import {
    LIP_SYNC_LEVEL_LABEL,
    amplitudeToOpenness,
    averageAmplitude,
    resolveLipSyncLevel,
    resolveMouthOpenness,
    smoothOpenness,
    wordEnvelopeOpenness,
} from '../services/architecte/lipSync';

/**
 * AVATAR VIVANT DE L'ARCHITECTE — règles métier.
 *
 * Ce qui décide de ce que la Direction verra à l'écran : quel état, quelle
 * ouverture de bouche, quel niveau de synchro réellement atteint, ce que le
 * Super-Admin accepte. Vérifiable sans navigateur, sans audio et sans clé.
 */

const STOCK = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120';

const signals = (over: Partial<ArchitecteRuntimeSignals> = {}): ArchitecteRuntimeSignals => ({
    isSpeaking: false,
    isListening: false,
    isThinking: false,
    micFailed: false,
    ...over,
});

// ─────────────────────────────────────────────────────────────────────────
describe('Machine d’états de présence — les 8 états normatifs d’AI Core', () => {
    it('au repos par défaut', () => {
        expect(resolveArchitectePresence(signals())).toBe('rest');
    });

    it('parle, écoute, réfléchit', () => {
        expect(resolveArchitectePresence(signals({ isSpeaking: true }))).toBe('speaking');
        expect(resolveArchitectePresence(signals({ isListening: true }))).toBe('listening');
        expect(resolveArchitectePresence(signals({ isThinking: true }))).toBe('thinking');
    });

    it('HORS LIGNE passe avant tout : inutile de montrer une écoute attentive quand rien ne peut partir', () => {
        expect(resolveArchitectePresence(signals({ online: false, isListening: true, isSpeaking: true }))).toBe('offline');
    });

    it('un micro réellement en échec passe devant : jamais l’air serein pendant qu’on parle dans le vide', () => {
        expect(resolveArchitectePresence(signals({ micFailed: true, isSpeaking: true, isListening: true }))).toBe('error');
    });

    it('MODE ALLÉGÉ : une dégradation réelle est montrée, au lieu de laisser l’avatar paraître sain', () => {
        expect(resolveArchitectePresence(signals({ degraded: true }))).toBe('fallback');
    });

    it('la dégradation ne coupe pas la parole en cours : elle s’affiche une fois l’échange au calme', () => {
        expect(resolveArchitectePresence(signals({ degraded: true, isSpeaking: true }))).toBe('speaking');
    });

    it('ce qui se passe maintenant prime sur ce qui vient de se terminer', () => {
        expect(resolveArchitectePresence(signals({ isSpeaking: true, lastOutcome: 'succes' }))).toBe('speaking');
        expect(resolveArchitectePresence(signals({ isListening: true, lastOutcome: 'erreur' }))).toBe('listening');
    });

    it('le dernier résultat n’apparaît qu’une fois l’Architecte redevenu inactif', () => {
        expect(resolveArchitectePresence(signals({ lastOutcome: 'succes' }))).toBe('success');
        expect(resolveArchitectePresence(signals({ lastOutcome: 'erreur' }))).toBe('error');
        expect(resolveArchitectePresence(signals({ lastOutcome: 'incertitude' }))).toBe('fallback');
    });

    it('chaque état a une phrase lisible — le mouvement n’est jamais la seule information', () => {
        const states = Object.keys(ARCHITECTE_STATE_LABEL) as (keyof typeof ARCHITECTE_STATE_LABEL)[];
        expect(states).toHaveLength(8);
        for (const state of states) expect(ARCHITECTE_STATE_LABEL[state].length).toBeGreaterThan(2);
    });

    it('chaque état emprunte une teinte de la grammaire DÉJÀ en place — aucun second système inventé', () => {
        const states = Object.keys(ARCHITECTE_STATE_LABEL) as (keyof typeof PRESENCE_TO_GRAMMAR)[];
        for (const state of states) expect(PRESENCE_TO_GRAMMAR[state]).toBeTruthy();
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Divulgation et anti-usurpation (playbook 15, principes non négociables)', () => {
    it('le niveau de présence réellement atteint est déclaré, jamais surévalué', () => {
        // P1 (présence légère) + P2 (présence vocale). P3 vidéo temps réel et
        // P4 avatar génératif ne sont ni livrés ni simulés.
        expect(ARCHITECTE_PRESENCE_LEVEL).toBe('P2');
    });

    it('une étiquette d’identité officielle existe et ne se fait passer pour personne', () => {
        expect(ARCHITECTE_DISCLOSURE).toMatch(/officielle MokNet/);
    });

    it('l’avatar livré étant une PHOTO, la mention de média synthétique est obligatoire', () => {
        // Refonte du 04/09 : l'avatar par défaut n'est plus un dessin mais un
        // portrait photoréaliste. Une confusion redevient donc possible, et le
        // playbook § 9 impose la mention. C'est le sens de ce test.
        expect(needsSyntheticMediaNotice(DEFAULT_ARCHITECTE_AVATAR)).toBe(true);
    });

    it('le repli vectoriel, lui, n’en a pas besoin — rien d’humain à confondre', () => {
        expect(needsSyntheticMediaNotice({ ...DEFAULT_ARCHITECTE_AVATAR, photoUrl: '' })).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Réglage « activer ou désactiver les animations »', () => {
    const visible = { prefersReducedMotion: false, documentVisible: true, onScreen: true };

    it('anime quand la Direction l’autorise et que rien ne s’y oppose', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, visible)).toBe(true);
    });

    it('n’anime pas quand la Direction a coupé', () => {
        expect(shouldAnimate({ ...DEFAULT_ARCHITECTE_AVATAR, animationsEnabled: false }, visible)).toBe(false);
    });

    it('n’anime pas quand le système demande de réduire le mouvement — l’accessibilité prime sur le réglage', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, { ...visible, prefersReducedMotion: true })).toBe(false);
    });

    it('s’arrête sur un onglet caché : une boucle que personne ne voit ne consomme pas de batterie', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, { ...visible, documentVisible: false })).toBe(false);
    });

    it('s’arrête hors écran — exigence explicite du playbook 15 § 3', () => {
        expect(shouldAnimate(DEFAULT_ARCHITECTE_AVATAR, { ...visible, onScreen: false })).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Réglage « changer l’avatar » — ce que le Super-Admin accepte', () => {
    it('accepte https, un chemin interne et une image importée', () => {
        expect(validateArchitectePhotoUrl('https://cdn.moknet.app/architecte.png')).toBeNull();
        expect(validateArchitectePhotoUrl('/architecte/reference.jpg')).toBeNull();
        expect(validateArchitectePhotoUrl('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
    });

    it('refuse le cliché de banque d’images hérité', () => {
        expect(validateArchitectePhotoUrl(STOCK)?.code).toBe('placeholder');
    });

    it('refuse http:// et une adresse relative ambiguë', () => {
        expect(validateArchitectePhotoUrl('http://exemple.com/a.png')?.code).toBe('protocole');
        expect(validateArchitectePhotoUrl('architecte.png')?.code).toBe('protocole');
    });

    it('un champ vide renvoie vers « remettre l’avatar par défaut »', () => {
        expect(validateArchitectePhotoUrl('   ')?.code).toBe('vide');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Ancre de bouche — le code ne devine pas où est une bouche', () => {
    it('borne un réglage hors cadre au lieu de placer la bouche hors du visage', () => {
        expect(clampMouthAnchor({ xPercent: 300, yPercent: -50, widthPercent: 900 })).toEqual({
            xPercent: 100,
            yPercent: 0,
            widthPercent: 60,
            tiltDeg: DEFAULT_MOUTH_ANCHOR.tiltDeg,
        });
    });

    it('retombe sur la valeur par défaut devant une saisie non numérique', () => {
        expect(clampMouthAnchor({ xPercent: NaN, yPercent: NaN, widthPercent: NaN })).toEqual(DEFAULT_MOUTH_ANCHOR);
    });

    it('conserve un réglage valide', () => {
        expect(clampMouthAnchor({ xPercent: 42, yPercent: 71, widthPercent: 18 })).toEqual({
            xPercent: 42,
            yPercent: 71,
            widthPercent: 18,
            tiltDeg: DEFAULT_MOUTH_ANCHOR.tiltDeg,
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Configuration héritée', () => {
    it('complète les clés absentes plutôt que de laisser l’écran lire `undefined`', () => {
        const merged = mergeArchitecteAvatarConfig({ photoUrl: '/a.png' });
        expect(merged.photoUrl).toBe('/a.png');
        expect(merged.animationsEnabled).toBe(true);
        expect(merged.mouthAnchor).toEqual(DEFAULT_MOUTH_ANCHOR);
    });

    it('complète une ancre partielle sans perdre ce qui est réglé', () => {
        const merged = mergeArchitecteAvatarConfig({ mouthAnchor: { yPercent: 80 } });
        expect(merged.mouthAnchor.yPercent).toBe(80);
        expect(merged.mouthAnchor.xPercent).toBe(DEFAULT_MOUTH_ANCHOR.xPercent);
    });

    it('résiste à un contenu illisible', () => {
        expect(mergeArchitecteAvatarConfig(null)).toEqual(DEFAULT_ARCHITECTE_AVATAR);
        expect(mergeArchitecteAvatarConfig('cassé').displayName).toBe("L'Architecte");
    });

    it('l’usine livre un vrai PORTRAIT, et son calage avec — sinon rien ne s’anime', () => {
        expect(DEFAULT_ARCHITECTE_AVATAR.photoUrl).toMatch(/^\/architecte\/.+\.(webp|png|jpe?g)$/);
        expect(DEFAULT_ARCHITECTE_AVATAR.rig.eyeLinePercent).toBeGreaterThan(0);
        expect(DEFAULT_ARCHITECTE_AVATAR.rig.jawLinePercent).toBeGreaterThan(
            DEFAULT_ARCHITECTE_AVATAR.rig.eyeLinePercent,
        );
        // La ligne de mâchoire est à la commissure des lèvres (± 3 %) : la
        // lèvre du haut reste fixe, celle du bas descend. Un calage incohérent
        // ouvrirait la bouche au milieu du front ou ferait descendre le nez.
        expect(Math.abs(DEFAULT_MOUTH_ANCHOR.yPercent - DEFAULT_ARCHITECTE_AVATAR.rig.jawLinePercent)).toBeLessThanOrEqual(3);
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Réglage « régler la voix »', () => {
    const catalogue = { professor: { id: 'voice-george' }, directeur: { id: 'voice-adam' } };

    it('utilise la voix choisie', () => {
        const config = { ...DEFAULT_ARCHITECTE_AVATAR, voiceKey: 'directeur' };
        expect(resolveArchitecteVoiceId(config, catalogue, 'voice-defaut')).toBe('voice-adam');
    });

    it('un réglage vide ou inconnu ne rend jamais l’Architecte muet', () => {
        expect(resolveArchitecteVoiceId(DEFAULT_ARCHITECTE_AVATAR, catalogue, 'voice-defaut')).toBe('voice-defaut');
        const inconnue = { ...DEFAULT_ARCHITECTE_AVATAR, voiceKey: 'nexiste-pas' };
        expect(resolveArchitecteVoiceId(inconnue, catalogue, 'voice-defaut')).toBe('voice-defaut');
    });
});

// ─────────────────────────────────────────────────────────────────────────
describe('Synchro labiale — niveau réellement atteint, jamais surévalué', () => {
    const base = { isSpeaking: true, lipSyncEnabled: true, prefersReducedMotion: false };

    it('ElevenLabs donne accès au signal : amplitude réelle', () => {
        expect(resolveLipSyncLevel({ ...base, engine: 'elevenlabs' })).toBe('amplitude_reelle');
    });

    it('le moteur natif du navigateur n’expose aucun flux : rythme des mots, et c’est dit', () => {
        expect(resolveLipSyncLevel({ ...base, engine: 'browser_native' })).toBe('rythme_des_mots');
        expect(LIP_SYNC_LEVEL_LABEL.rythme_des_mots).toMatch(/pas le volume/);
    });

    it('bouche close quand l’Architecte ne parle pas', () => {
        expect(resolveLipSyncLevel({ ...base, isSpeaking: false, engine: 'elevenlabs' })).toBe('aucune');
    });

    it('le réglage Super-Admin coupe la synchro', () => {
        expect(resolveLipSyncLevel({ ...base, lipSyncEnabled: false, engine: 'elevenlabs' })).toBe('aucune');
    });

    it('« réduire le mouvement » coupe aussi la bouche — une bouche qui s’agite reste du mouvement', () => {
        expect(resolveLipSyncLevel({ ...base, prefersReducedMotion: true, engine: 'elevenlabs' })).toBe('aucune');
    });

    it('aucun moteur identifié = aucune animation inventée', () => {
        expect(resolveLipSyncLevel({ ...base, engine: null })).toBe('aucune');
    });
});

describe('Synchro labiale — de l’amplitude à l’ouverture', () => {
    it('reste close sur le bruit de fond : pas de bouche qui tremble en silence', () => {
        expect(amplitudeToOpenness(0)).toBe(0);
        expect(amplitudeToOpenness(0.03)).toBe(0);
    });

    it('s’ouvre progressivement puis sature', () => {
        const faible = amplitudeToOpenness(0.15);
        const fort = amplitudeToOpenness(0.45);
        expect(faible).toBeGreaterThan(0);
        expect(fort).toBeGreaterThan(faible);
        expect(amplitudeToOpenness(0.9)).toBe(1);
    });

    it('la courbe relève le bas de l’échelle, où une voix passe l’essentiel de son temps', () => {
        // Sans correction, une amplitude au quart de la plage donnerait 0,25 :
        // la bouche resterait presque fermée pendant toute la phrase.
        const quart = amplitudeToOpenness(0.04 + (0.55 - 0.04) * 0.25);
        expect(quart).toBeCloseTo(0.5, 2);
    });

    it('ignore une valeur non numérique au lieu de propager NaN jusqu’au style CSS', () => {
        expect(amplitudeToOpenness(NaN)).toBe(0);
    });

    it('moyenne un tampon d’analyse fréquentielle, tampon vide compris', () => {
        expect(averageAmplitude([255, 255, 255, 255])).toBe(1);
        expect(averageAmplitude([0, 0])).toBe(0);
        expect(averageAmplitude([])).toBe(0);
    });

    it('lisse : ouverture rapide à l’attaque, fermeture plus lente', () => {
        const montee = smoothOpenness(0, 1);
        const descente = smoothOpenness(1, 0);
        expect(montee).toBeCloseTo(0.55, 5);
        expect(1 - descente).toBeCloseTo(0.25, 5);
        // La montée est plus franche que la descente : une bouche a de l'inertie.
        expect(montee).toBeGreaterThan(1 - descente);
    });
});

describe('Synchro labiale — rythme des mots (moteur natif)', () => {
    it('s’ouvre, culmine, puis se referme sur la durée du mot', () => {
        expect(wordEnvelopeOpenness(0, 5)).toBeCloseTo(0, 5);
        const milieu = wordEnvelopeOpenness(130, 5);
        expect(milieu).toBeGreaterThan(0.7);
        expect(wordEnvelopeOpenness(260, 5)).toBe(0);
    });

    it('un mot long tient la bouche ouverte plus longtemps qu’un monosyllabe', () => {
        expect(wordEnvelopeOpenness(300, 12)).toBeGreaterThan(0);
        expect(wordEnvelopeOpenness(300, 2)).toBe(0);
    });

    it('ne dépasse jamais 0,8 : une bouche constamment grande ouverte trahit l’animation', () => {
        for (let ms = 0; ms < 600; ms += 10) {
            expect(wordEnvelopeOpenness(ms, 8)).toBeLessThanOrEqual(0.8);
        }
    });

    it('reste close avant le premier mot et devant une valeur absurde', () => {
        expect(wordEnvelopeOpenness(Infinity, 5)).toBe(0);
        expect(wordEnvelopeOpenness(-10, 5)).toBe(0);
    });
});

describe('Point d’entrée unique du composant', () => {
    it('route vers la bonne règle selon le niveau, et ferme la bouche sinon', () => {
        expect(resolveMouthOpenness('amplitude_reelle', { amplitude: 0.45 })).toBeGreaterThan(0);
        expect(resolveMouthOpenness('rythme_des_mots', { elapsedMs: 100, wordLength: 6 })).toBeGreaterThan(0);
        expect(resolveMouthOpenness('aucune', { amplitude: 1, elapsedMs: 0 })).toBe(0);
    });

    it('sans source exploitable, bouche close plutôt qu’animation fabriquée', () => {
        expect(resolveMouthOpenness('amplitude_reelle', {})).toBe(0);
        expect(resolveMouthOpenness('rythme_des_mots', {})).toBe(0);
    });
});
