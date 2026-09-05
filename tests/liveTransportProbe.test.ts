// SAT-4 — la règle qui distingue « le serveur répond » de « le direct peut
// démarrer ». Les trois premiers cas sont les MESURES RÉELLES faites contre
// la production le 4 septembre 2026 (voir l'encadré de liveTransportProbe.ts).

import { describe, expect, it } from 'vitest';
import {
    SEUIL_DEGRADE_MS,
    describeLiveTransport,
    isRoomListing,
    judgeLiveTransport,
    liveTransportVerdict,
    toLiveKitApiUrl,
    type RawLiveTransportProbe,
} from '../supabase/functions/health-guardian/liveTransportProbe';
import { toLiveKitHttpUrl } from '../supabase/functions/livekit-token/capacityGate';
import { EVALUATORS, evaluateAll, type RawMetrics } from '../supabase/functions/health-guardian/evaluate';

const CONFIGURE = { configured: true };

function sonde(partial: Partial<RawLiveTransportProbe>): RawLiveTransportProbe {
    return {
        reached: true,
        httpStatus: 200,
        body: { rooms: [] },
        latencyMs: 410,
        timedOut: false,
        ...partial,
    };
}

describe('SAT-4 — ce qui a été RÉELLEMENT mesuré en production', () => {
    it("le vrai jeton rend 200 {\"rooms\":[]} en 410 ms → opérationnel, et zéro direct n'est PAS une panne", () => {
        const verdict = judgeLiveTransport(
            sonde({ httpStatus: 200, body: { rooms: [] }, latencyMs: 410 }),
            CONFIGURE,
        );
        expect(verdict).toEqual({ status: 'operational', latencyMs: 410, rooms: 0 });
    });

    it('LE CAS DÉCISIF — un jeton refusé (401) n\'est JAMAIS opérationnel, alors que GET / rend 200', () => {
        const verdict = judgeLiveTransport(
            sonde({ httpStatus: 401, body: null, latencyMs: 667 }),
            CONFIGURE,
        );
        // Si cette assertion tombait, la surveillance afficherait « vert »
        // pendant qu'aucun direct ne peut démarrer — le défaut exact que
        // SAT-4 existe pour empêcher.
        expect(verdict.status).toBe('unusable');
        expect(verdict).toEqual({ status: 'unusable', reason: 'rejected', httpStatus: 401 });
        expect(describeLiveTransport(verdict)).toContain('aucun direct ne peut démarrer');
    });

    it('403 est traité comme 401 : joignable, mais rien ne s\'ouvre', () => {
        expect(judgeLiveTransport(sonde({ httpStatus: 403, body: null }), CONFIGURE))
            .toEqual({ status: 'unusable', reason: 'rejected', httpStatus: 403 });
    });
});

describe('SAT-4 — un 200 ne suffit pas', () => {
    it('200 avec une page HTML (proxy égaré) est INUTILISABLE, pas opérationnel', () => {
        const verdict = judgeLiveTransport(
            sonde({ httpStatus: 200, body: '<!doctype html><h1>Not Found</h1>' }),
            CONFIGURE,
        );
        expect(verdict).toEqual({ status: 'unusable', reason: 'unreadable', httpStatus: 200 });
    });

    it('200 avec un objet sans « rooms » est INUTILISABLE', () => {
        expect(judgeLiveTransport(sonde({ body: { ok: true } }), CONFIGURE).status).toBe('unusable');
    });

    it('200 avec « rooms » qui n\'est pas un tableau est INUTILISABLE', () => {
        expect(judgeLiveTransport(sonde({ body: { rooms: 3 } }), CONFIGURE).status).toBe('unusable');
    });

    it('404 (route perdue) est INUTILISABLE et porte son code', () => {
        expect(judgeLiveTransport(sonde({ httpStatus: 404, body: null }), CONFIGURE))
            .toEqual({ status: 'unusable', reason: 'unreadable', httpStatus: 404 });
    });

    it('500 est distingué d\'un refus d\'identifiants', () => {
        expect(judgeLiveTransport(sonde({ httpStatus: 503, body: null }), CONFIGURE))
            .toEqual({ status: 'unusable', reason: 'server_error', httpStatus: 503 });
    });
});

describe('SAT-4 — lenteur : le seuil est celui de la porte, pas un confort', () => {
    it('juste sous le seuil reste opérationnel', () => {
        const verdict = judgeLiveTransport(
            sonde({ body: { rooms: [{}, {}] }, latencyMs: SEUIL_DEGRADE_MS }),
            CONFIGURE,
        );
        expect(verdict).toEqual({ status: 'operational', latencyMs: SEUIL_DEGRADE_MS, rooms: 2 });
    });

    it('au-delà du seuil : dégradé — la porte d\'admission est devenue aveugle', () => {
        const verdict = judgeLiveTransport(
            sonde({ body: { rooms: [{}] }, latencyMs: SEUIL_DEGRADE_MS + 1 }),
            CONFIGURE,
        );
        expect(verdict).toEqual({ status: 'degraded', latencyMs: SEUIL_DEGRADE_MS + 1, rooms: 1 });
        expect(describeLiveTransport(verdict)).toContain('protection contre la saturation');
    });
});

describe('SAT-4 — rien reçu, et rien de configuré, ne se confondent pas', () => {
    it('expiration de délai', () => {
        expect(judgeLiveTransport(sonde({ reached: false, httpStatus: null, timedOut: true }), CONFIGURE))
            .toEqual({ status: 'unreachable', reason: 'timeout' });
    });

    it('échec réseau', () => {
        expect(judgeLiveTransport(sonde({ reached: false, httpStatus: null, timedOut: false }), CONFIGURE))
            .toEqual({ status: 'unreachable', reason: 'network' });
    });

    it('sonde absente = injoignable, jamais opérationnel', () => {
        expect(judgeLiveTransport(null, CONFIGURE).status).toBe('unreachable');
    });

    it('aucune configuration active : ce n\'est PAS une panne', () => {
        expect(judgeLiveTransport(null, { configured: false })).toEqual({ status: 'unconfigured' });
        // Et même une sonde en échec ne doit pas transformer « rien de
        // branché » en alerte.
        expect(judgeLiveTransport(sonde({ reached: false }), { configured: false }).status)
            .toBe('unconfigured');
    });
});

describe('SAT-4 — contre-épreuves : la garde peut réellement virer au rouge', () => {
    it('AUCUN état non opérationnel ne se décrit comme opérationnel', () => {
        const nonOperationnels = [
            judgeLiveTransport(sonde({ httpStatus: 401, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ httpStatus: 503, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ body: '<html>' }), CONFIGURE),
            judgeLiveTransport(sonde({ reached: false, timedOut: true }), CONFIGURE),
            judgeLiveTransport(null, { configured: false }),
        ];
        for (const verdict of nonOperationnels) {
            expect(verdict.status).not.toBe('operational');
            expect(describeLiveTransport(verdict)).not.toMatch(/direct\(s\) en cours\.$/);
        }
    });

    it("isRoomListing refuse tout ce qui n'est pas la forme réelle du contrat", () => {
        expect(isRoomListing({ rooms: [] })).toBe(true);
        expect(isRoomListing({ rooms: [{ name: 'x' }] })).toBe(true);
        for (const faux of [null, undefined, 0, '', 'rooms', [], { rooms: null }, { rooms: {} }]) {
            expect(isRoomListing(faux)).toBe(false);
        }
    });

    it("l'adresse sondée est la MÊME que celle de la porte d'admission", () => {
        // La sonde vit dans une fonction Edge, la porte dans une autre : elles
        // ne peuvent pas partager le fichier. Si les deux conversions
        // divergeaient, SAT-4 interrogerait une autre machine que celle qui
        // laisse réellement entrer — et jugerait donc autre chose.
        for (const entree of [
            'wss://live.moknet.net',
            'wss://live.moknet.net/',
            'wss://live.moknet.net///',
            'ws://localhost:7880',
            'https://deja-en-http.example',
            '  wss://espaces.example  ',
            '',
        ]) {
            expect(toLiveKitApiUrl(entree)).toBe(toLiveKitHttpUrl(entree));
        }
        // Et la conversion attendue, écrite en clair pour qu'une dérive
        // SIMULTANÉE des deux copies ne passe pas inaperçue.
        expect(toLiveKitApiUrl('wss://live.moknet.net/')).toBe('https://live.moknet.net');
    });

    it('un seul chemin mène à « operational » : 200 + liste + dans le budget', () => {
        // On fait varier UN facteur à la fois depuis le cas sain ; chacun doit
        // suffire à faire tomber le verdict.
        const sain = judgeLiveTransport(sonde({}), CONFIGURE);
        expect(sain.status).toBe('operational');
        expect(judgeLiveTransport(sonde({ httpStatus: 401 }), CONFIGURE).status).not.toBe('operational');
        expect(judgeLiveTransport(sonde({ body: {} }), CONFIGURE).status).not.toBe('operational');
        expect(judgeLiveTransport(sonde({ latencyMs: 9999 }), CONFIGURE).status).not.toBe('operational');
        expect(judgeLiveTransport(sonde({ reached: false }), CONFIGURE).status).not.toBe('operational');
        expect(judgeLiveTransport(sonde({}), { configured: false }).status).not.toBe('operational');
    });
});

// ─────────────────────────────────────────────────────────────────────────
// SAT-4 — LE BRANCHEMENT RÉEL.
//
// Les tests ci-dessus prouvent la RÈGLE. Ceux qui suivent prouvent qu'elle
// est effectivement CÂBLÉE : que la ligne du tableau de bord existe, qu'elle
// est alimentée par l'observation réseau, et surtout qu'elle reste BLANCHE
// quand la sonde n'a pas tourné — au lieu de virer au vert par défaut.
// ─────────────────────────────────────────────────────────────────────────

const LIGNE = 'live.transport_utilisable';

/** Les trois blocs de base, vides : cette ligne n'en dépend pas. */
function metriques(liveTransport?: RawMetrics['liveTransport']): RawMetrics {
    return { catalogue: {}, data: {}, operations: {}, liveTransport };
}

function resultat(liveTransport?: RawMetrics['liveTransport']) {
    const trouve = evaluateAll(metriques(liveTransport)).find((o) => o.lineId === LIGNE);
    if (!trouve) throw new Error(`La ligne ${LIGNE} est absente des verdicts.`);
    return trouve;
}

describe('SAT-4 — la règle est réellement branchée sur le tableau de bord', () => {
    it("la ligne existe dans les évaluateurs du gardien de santé", () => {
        expect(Object.keys(EVALUATORS)).toContain(LIGNE);
    });

    it('un transport sain rend la ligne VERTE, avec les chiffres mesurés', () => {
        const verdict = resultat({
            configured: true,
            probe: { reached: true, httpStatus: 200, body: { rooms: [] }, latencyMs: 410, timedOut: false },
        });
        expect(verdict.status).toBe('vert');
        expect(verdict.proofLevel).toBe('reel');
        expect(verdict.measured).toContain('410');
        expect(verdict.evidence).toMatchObject({ latencyMs: 410, rooms: 0 });
        expect(verdict.gap).toBeUndefined();
    });

    it('LE CAS DÉCISIF CÂBLÉ — un 401 rend la ligne ROUGE, jamais verte', () => {
        const verdict = resultat({
            configured: true,
            probe: { reached: true, httpStatus: 401, body: null, latencyMs: 667, timedOut: false },
        });
        expect(verdict.status).toBe('rouge');
        expect(verdict.measured).toContain('aucun direct ne peut démarrer');
        expect(verdict.gap).toContain('clé API');
        expect(verdict.evidence).toMatchObject({ httpStatus: 401, reason: 'rejected' });
    });

    it('un transport lent rend la ligne ORANGE et nomme la protection perdue', () => {
        const verdict = resultat({
            configured: true,
            probe: {
                reached: true, httpStatus: 200, body: { rooms: [{}] },
                latencyMs: SEUIL_DEGRADE_MS + 1, timedOut: false,
            },
        });
        expect(verdict.status).toBe('orange');
        expect(verdict.gap).toContain('saturation');
    });

    it('une expiration de délai rend la ligne ROUGE', () => {
        const verdict = resultat({
            configured: true,
            probe: { reached: false, httpStatus: null, body: null, latencyMs: 5000, timedOut: true },
        });
        expect(verdict.status).toBe('rouge');
        expect(verdict.evidence).toMatchObject({ reason: 'timeout' });
    });

    it("SONDE NON EXÉCUTÉE = BLANC, jamais vert — ne pas avoir regardé n'est pas un constat", () => {
        const verdict = resultat(undefined);
        expect(verdict.status).toBe('blanc');
        expect(verdict.proofLevel).toBe('non_eprouve');
        expect(verdict.probeError).toContain("n'a pas été exécutée");
    });

    it("AUCUNE configuration active = BLANC, jamais rouge — c'est une absence de mesure, pas une panne", () => {
        // La ligne « Transport temps réel configuré » dit déjà, et elle seule,
        // qu'aucune configuration n'existe. Compter rouge ici pénaliserait
        // deux fois le même défaut dans la note globale.
        const verdict = resultat({ configured: false, probe: null });
        expect(verdict.status).toBe('blanc');
        expect(verdict.proofLevel).toBe('non_eprouve');
        expect(verdict.probeError).toContain('Aucun serveur de direct configuré');
    });

    it('les autres lignes continuent de vivre quand la sonde de transport manque', () => {
        // Contre-épreuve du filet : une sonde réseau absente ne doit jamais
        // faire tomber le reste du tableau de bord.
        const verdicts = evaluateAll(metriques(undefined));
        expect(verdicts.length).toBe(Object.keys(EVALUATORS).length);
        expect(verdicts.filter((o) => o.lineId !== LIGNE).some((o) => o.status !== 'blanc')).toBe(true);
    });
});

describe('SAT-4 — contre-épreuves du verdict de tableau de bord', () => {
    it('AUCUN état non opérationnel ne peut produire un vert', () => {
        const rouges = [
            judgeLiveTransport(sonde({ httpStatus: 401, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ httpStatus: 503, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ httpStatus: 404, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ body: '<html>' }), CONFIGURE),
            judgeLiveTransport(sonde({ reached: false, timedOut: true }), CONFIGURE),
            judgeLiveTransport(sonde({ reached: false, timedOut: false }), CONFIGURE),
            judgeLiveTransport(sonde({ latencyMs: SEUIL_DEGRADE_MS + 1 }), CONFIGURE),
        ];
        for (const health of rouges) {
            if (health.status === 'unconfigured') throw new Error('cas hors périmètre');
            expect(liveTransportVerdict(health).status).not.toBe('vert');
        }
    });

    it('tout verdict non vert porte un écart écrit — jamais un rouge muet', () => {
        for (const health of [
            judgeLiveTransport(sonde({ httpStatus: 403, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ httpStatus: 500, body: null }), CONFIGURE),
            judgeLiveTransport(sonde({ body: {} }), CONFIGURE),
            judgeLiveTransport(sonde({ reached: false }), CONFIGURE),
            judgeLiveTransport(sonde({ latencyMs: 9999 }), CONFIGURE),
        ]) {
            if (health.status === 'unconfigured') throw new Error('cas hors périmètre');
            const verdict = liveTransportVerdict(health);
            expect(verdict.status).not.toBe('vert');
            expect(verdict.gap && verdict.gap.length > 20).toBe(true);
        }
    });
});
