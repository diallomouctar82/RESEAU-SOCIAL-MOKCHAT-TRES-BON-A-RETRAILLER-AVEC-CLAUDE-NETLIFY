import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * LE DROIT SANS LEQUEL LA TRADUCTION DU LIVE N'EXISTE PAS.
 *
 * La langue d'écoute de chacun voyage dans SES métadonnées de participant :
 * c'est ainsi, et seulement ainsi, que les intervenants savent quelles
 * langues produire. LiveKit refuse `setMetadata()` côté client si le jeton
 * ne porte pas `canUpdateOwnMetadata` — mesuré contre le binaire exact du
 * VPS (1.8.4) : « does not have permission to update own metadata ».
 *
 * Le défaut était invisible : l'erreur remontait dans un `catch` vide, donc
 * plus aucune langue n'était jamais demandée, plus aucune piste d'interprète
 * n'était produite, et chaque auditeur restait sur l'audio d'origine en
 * croyant attendre une voix qui ne venait pas. Rien dans les tests unitaires
 * ne pouvait le voir : ils remplacent le transport par un double qui accepte
 * tout.
 *
 * Ce garde-fou lit la fonction Edge RÉELLE sur le disque. Si quelqu'un
 * retire ce droit du grant, il vire au rouge — c'est sa seule raison d'être.
 * Il ne dépend d'aucun module applicatif, uniquement du fichier source.
 */

const source = readFileSync(resolve(__dirname, '../supabase/functions/livekit-token/index.ts'), 'utf8');

/**
 * Le bloc `at.addGrant({ … })` tel qu'il est réellement écrit, COMMENTAIRES
 * RETIRÉS : ce test juge les droits accordés, pas la prose qui les explique
 * (sans quoi le mot « roomAdmin » cité dans un commentaire suffirait à le
 * faire échouer, ou pire, à le faire passer).
 */
function grantBlock(): string {
    const start = source.indexOf('at.addGrant({');
    expect(start, 'la fonction Edge doit toujours poser un grant').toBeGreaterThan(-1);
    const end = source.indexOf('});', start);
    return source.slice(start, end)
        .split('\n')
        .map((l) => l.replace(/\/\/.*$/, ''))
        .join('\n');
}

describe('jeton LIVE : le droit de publier SA langue d’écoute', () => {
    it('le grant porte `canUpdateOwnMetadata` — sans lui, personne ne peut annoncer sa langue', () => {
        expect(grantBlock()).toContain('canUpdateOwnMetadata: true');
    });

    it('ce droit ne s’étend jamais à l’administration de la salle ni aux autres participants', () => {
        const bloc = grantBlock();
        // `canUpdateOwnMetadata` = MES métadonnées. `roomAdmin` /
        // `canUpdateMetadata` laisseraient écrire celles des autres : ce n'est
        // pas ce que la langue d'écoute demande, et ce serait une porte
        // ouverte sur le rôle et le nom d'autrui.
        expect(bloc).not.toContain('roomAdmin');
        expect(bloc).not.toContain('roomRecord');
        expect(bloc.replace('canUpdateOwnMetadata', '')).not.toContain('canUpdateMetadata');
    });

    it('un spectateur sans micro le reçoit aussi — c’est lui qui choisit sa langue sans rien publier', () => {
        const bloc = grantBlock();
        // `canPublish` dépend du rôle ; `canUpdateOwnMetadata` ne doit PAS en
        // dépendre, sinon un spectateur ne pourrait jamais demander de
        // traduction alors que c'est précisément lui qui choisit sa langue
        // d'écoute sans jamais rien publier.
        expect(bloc).toContain('canPublish: body.canPublish !== false');
        expect(bloc).not.toMatch(/canUpdateOwnMetadata:\s*body\./);
    });
});
