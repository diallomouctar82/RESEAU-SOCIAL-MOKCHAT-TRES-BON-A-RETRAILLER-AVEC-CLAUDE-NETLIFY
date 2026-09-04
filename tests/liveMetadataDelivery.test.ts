import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requestedLanguageCounts } from '../services/live/liveListeningLanguage';

/**
 * LP-6 — LA LANGUE D'ÉCOUTE DOIT ARRIVER JUSQU'À L'INTERVENANT.
 *
 * Le droit `canUpdateOwnMetadata` (voir liveMetadataGrant.test.ts) permet à
 * l'auditeur de PUBLIER son choix. Encore faut-il que l'intervenant le
 * REÇOIVE. Deux défauts distincts cassaient ce dernier mètre, tous deux
 * muets, tous deux mesurés pendant le banc LP-6 :
 *
 *  1. L'ADAPTATEUR TRANSMETTAIT L'ANCIENNE VALEUR. Le SDK émet
 *     `ParticipantMetadataChanged` avec la métadonnée PRÉCÉDENTE en premier
 *     argument ; l'adaptateur la nommait `metadata` et la relayait comme la
 *     nouvelle. Au tout premier choix (vide → « en »), on propageait donc la
 *     chaîne vide : aucune langue jamais demandée.
 *
 *  2. L'AMORÇAGE DU ROSTER JETAIT LES MÉTADONNÉES. Le snapshot de connexion
 *     ne passait que le handle. Un intervenant qui rejoint un direct où les
 *     auditeurs ont DÉJÀ choisi n'apprenait jamais leur langue —
 *     l'événement de changement ne couvre que les changements ultérieurs.
 *
 * Chacun seul suffit à laisser tous les auditeurs sur l'audio d'origine sans
 * la moindre erreur nulle part. Ce fichier les tient tous les deux.
 */

const adapter = readFileSync(resolve(__dirname, '../services/live/liveKitTransportProvider.ts'), 'utf8');
const hook = readFileSync(resolve(__dirname, '../hooks/useLiveTransport.ts'), 'utf8');

/** Le corps du gestionnaire `ParticipantMetadataChanged` tel qu'il est réellement écrit, commentaires retirés. */
function metadataHandler(): string {
    const withoutComments = adapter.replace(/^\s*\/\/.*$/gm, '');
    const at = withoutComments.indexOf('RoomEvent.ParticipantMetadataChanged');
    expect(at, "le gestionnaire ParticipantMetadataChanged doit exister dans l'adaptateur").toBeGreaterThan(-1);
    return withoutComments.slice(at, at + 400);
}

describe("LP-6 — l'adaptateur relaie la métadonnée COURANTE, jamais la précédente", () => {
    /**
     * Le test le plus important du fichier : il vérifie le contrat du SDK
     * INSTALLÉ, pas notre souvenir de ce contrat. Si LiveKit inversait un jour
     * ses arguments, ce test virerait au rouge et nous dirait de relire
     * l'adaptateur — au lieu de nous laisser un correctif devenu faux.
     */
    it("le SDK installé documente bien la valeur PRÉCÉDENTE en premier argument", () => {
        const events = readFileSync(
            resolve(__dirname, '../node_modules/livekit-client/dist/src/room/events.d.ts'),
            'utf8',
        );
        const at = events.indexOf('ParticipantMetadataChanged');
        expect(at).toBeGreaterThan(-1);
        // La doc du bloc qui précède la déclaration porte la signature.
        const doc = events.slice(Math.max(0, at - 600), at);
        expect(doc).toMatch(/args:\s*\(prevMetadata/);
    });

    it("lit `p.metadata` (la valeur courante) et non l'argument de l'événement", () => {
        const handler = metadataHandler();
        expect(handler).toContain('p.metadata');
    });

    it("ne transmet JAMAIS le premier argument de l'événement comme métadonnée", () => {
        const handler = metadataHandler();
        // C'était exactement l'ancienne ligne : `(p.identity, metadata)`.
        expect(handler).not.toMatch(/onParticipantMetadataChanged\?\.\(\s*p\.identity\s*,\s*metadata\s*\)/);
    });

    it("nomme le premier argument pour ce qu'il est, afin que personne ne s'y trompe à nouveau", () => {
        const handler = metadataHandler();
        expect(handler).toMatch(/_previousMetadata/);
    });
});

describe("LP-6 — l'amorçage du roster porte les métadonnées déjà publiées", () => {
    it('le snapshot de connexion passe `metadata` en plus du handle', () => {
        // On juge LA LIGNE de l'amorçage, pas une fenêtre approximative autour
        // d'elle : une fenêtre pouvait attraper un `metadata: p.metadata`
        // voisin et rester verte alors que le défaut était remis (vérifié).
        const lignes = hook.split('\n').filter((l) => l.includes('getRemoteParticipants()'));
        expect(lignes, "l'amorçage du roster doit exister, une seule fois").toHaveLength(1);
        expect(lignes[0]).toContain('metadata: p.metadata');
    });

    it("l'arrivée en cours de route, elle, portait déjà les métadonnées (non-régression)", () => {
        expect(hook).toMatch(/onParticipantConnected:.*metadata: p\.metadata/s);
    });
});

describe('LP-6 — ce que ces deux défauts produisaient, mesuré sur la règle réelle', () => {
    const CHOIX_ANGLAIS = JSON.stringify({ lpv: 1, lang: 'en' });

    it('une métadonnée VIDE (ancienne valeur relayée) ne demande aucune langue', () => {
        // Le premier changement d'un participant : l'ancienne valeur est vide.
        const compte = requestedLanguageCounts([{ identity: 'bilal', metadata: '' }]);
        expect(compte.size).toBe(0);
    });

    it('une métadonnée ABSENTE (roster amorcé sans elle) ne demande aucune langue non plus', () => {
        const compte = requestedLanguageCounts([{ identity: 'bilal', metadata: undefined }]);
        expect(compte.size).toBe(0);
    });

    it("la valeur COURANTE, elle, demande bien la langue — c'est tout l'enjeu", () => {
        const compte = requestedLanguageCounts([{ identity: 'bilal', metadata: CHOIX_ANGLAIS }]);
        expect(compte.get('en')).toBe(1);
    });

    it('deux auditeurs de la même langue restent UNE seule langue à produire (mutualisation)', () => {
        const compte = requestedLanguageCounts([
            { identity: 'bilal', metadata: CHOIX_ANGLAIS },
            { identity: 'chen', metadata: CHOIX_ANGLAIS },
        ]);
        expect(compte.size).toBe(1);
        expect(compte.get('en')).toBe(2);
    });
});
