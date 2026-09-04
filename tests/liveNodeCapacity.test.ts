import { describe, expect, it } from 'vitest';
import {
    type CeilingDeps,
    PART_ENGAGEE,
    PLACES_PAR_COEUR_MESUREES,
    PLANCHER,
    computeRoomCapacity,
    poseRoomCeiling,
    readNodeMetrics,
    sumNodeOccupancy,
} from '../supabase/functions/livekit-token/nodeCapacity';

/**
 * SAT-1 — le plafond d'un direct.
 *
 * Ces tests portent sur la VRAIE fonction importée depuis la fonction Edge,
 * pas sur une copie : si la règle change là-bas, ils virent au rouge ici.
 *
 * Le texte ci-dessous est un extrait RÉEL de la réponse `/metrics` du binaire
 * `livekit-server` 1.8.4 (celui du VPS), relevée au banc — commentaires
 * `# HELP`/`# TYPE` compris, parce que c'est exactement ce que la fonction
 * devra traverser en production.
 */
const METRIQUES_REELLES_1_8_4 = `# HELP go_memstats_sys_bytes Number of bytes obtained from system.
# TYPE go_memstats_sys_bytes gauge
go_memstats_sys_bytes 3.5738888e+07
# HELP go_sched_gomaxprocs_threads The current runtime.GOMAXPROCS setting, or the number of operating system threads that can execute user-level Go code simultaneously. Sourced from /sched/gomaxprocs:threads
# TYPE go_sched_gomaxprocs_threads gauge
go_sched_gomaxprocs_threads 4
# HELP go_threads Number of OS threads created.
# TYPE go_threads gauge
go_threads 10
# HELP livekit_participant_total
# TYPE livekit_participant_total counter
livekit_participant_total{node_id="ND_AmvT5VZnVCw4",node_type="SERVER"} 0
process_cpu_seconds_total 0.41
`;

/** Réponse réelle du même binaire quand `prometheus_port` n'est PAS configuré. */
const SANS_PROMETHEUS = '404 page not found\n';

describe('SAT-1 — lecture des métriques du nœud', () => {
    it('lit le nombre de cœurs dans une VRAIE réponse /metrics de 1.8.4', () => {
        expect(readNodeMetrics(METRIQUES_REELLES_1_8_4)).toEqual({ cores: 4 });
    });

    it("rend null quand /metrics n'existe pas (prometheus_port absent — le cas du VPS)", () => {
        expect(readNodeMetrics(SANS_PROMETHEUS)).toBeNull();
    });

    it('rend null plutôt que de deviner quand la métrique est absente', () => {
        expect(readNodeMetrics('go_threads 10\nprocess_cpu_seconds_total 0.41\n')).toBeNull();
    });

    it('rend null sur une réponse vide, non lue, ou qui n’est pas du texte', () => {
        expect(readNodeMetrics('')).toBeNull();
        expect(readNodeMetrics(null)).toBeNull();
        expect(readNodeMetrics(undefined)).toBeNull();
        expect(readNodeMetrics({ cores: 8 })).toBeNull();
    });

    it('refuse un nombre de cœurs absurde au lieu de le propager', () => {
        expect(readNodeMetrics('go_sched_gomaxprocs_threads 0\n')).toBeNull();
        expect(readNodeMetrics('go_sched_gomaxprocs_threads -2\n')).toBeNull();
        expect(readNodeMetrics('go_sched_gomaxprocs_threads NaN\n')).toBeNull();
    });

    it('ne se laisse pas prendre par une métrique au nom voisin', () => {
        // Ce test a d'abord été COMPLAISANT : il n'essayait qu'un nom SUFFIXÉ
        // (`..._threads_total`), que même une expression sans ancre rejette —
        // ce qui suit le nom n'y est ni un espace ni un chiffre. La
        // contre-épreuve CP7 est restée verte alors que l'ancre venait d'être
        // retirée : la garde ne gardait rien.
        //
        // Le vrai risque est un nom PRÉFIXÉ : sans `^`, l'expression trouve
        // « go_sched_gomaxprocs_threads 99 » à l'INTÉRIEUR d'une autre série et
        // rend 99 cœurs pour une machine qui n'en a pas. C'est ce cas-là qu'il
        // faut éprouver.
        expect(readNodeMetrics('livekit_go_sched_gomaxprocs_threads 99\n')).toBeNull();
        expect(readNodeMetrics('autre_prefixe_go_sched_gomaxprocs_threads 512\n')).toBeNull();
        expect(readNodeMetrics('go_sched_gomaxprocs_threads_total 99\n')).toBeNull();
        // …et la vraie série reste évidemment lue, préfixes ou pas dans le lot.
        expect(readNodeMetrics('livekit_go_sched_gomaxprocs_threads 99\ngo_sched_gomaxprocs_threads 4\n'))
            .toEqual({ cores: 4 });
    });

    it('suit la machine : 8 cœurs se lisent comme 8, sans rien changer au code', () => {
        expect(readNodeMetrics('go_sched_gomaxprocs_threads 8\n')).toEqual({ cores: 8 });
    });
});

describe('SAT-1 — occupation réelle du nœud', () => {
    it('additionne les participants de toutes les rooms', () => {
        expect(sumNodeOccupancy([
            { name: 'a', numParticipants: 12 },
            { name: 'b', numParticipants: 3 },
        ])).toBe(15);
    });

    it('rend 0 pour un nœud vide, et null quand la lecture a échoué', () => {
        expect(sumNodeOccupancy([])).toBe(0);
        expect(sumNodeOccupancy(null)).toBeNull();
        expect(sumNodeOccupancy(undefined)).toBeNull();
    });

    it('ignore une room au compteur illisible au lieu de tout perdre', () => {
        expect(sumNodeOccupancy([
            { name: 'a', numParticipants: 5 },
            { name: 'b' },
            { name: 'c', numParticipants: 'beaucoup' },
            { name: 'd', numParticipants: -3 },
        ])).toBe(5);
    });
});

describe('SAT-1 — le plafond posé sur un direct', () => {
    const coeurs = (n: number) => ({ cores: n });

    it('ne pose AUCUN plafond quand la machine est inconnue — il ne l’invente pas', () => {
        expect(computeRoomCapacity({ metrics: null, nodeOccupancy: 0 })).toBeNull();
    });

    it('suit le nombre de cœurs : doubler la machine double le plafond', () => {
        const petit = computeRoomCapacity({ metrics: coeurs(2), nodeOccupancy: 0 });
        const grand = computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: 0 });
        expect(petit).toBe(Math.floor(2 * PLACES_PAR_COEUR_MESUREES * PART_ENGAGEE));
        expect(grand).toBe(2 * (petit as number));
    });

    it('retranche ce que le nœud porte déjà', () => {
        const vide = computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: 0 }) as number;
        expect(computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: 100 })).toBe(vide - 100);
    });

    it('NE REND JAMAIS 0 — pour LiveKit, 0 signifie « aucune limite »', () => {
        // Le piège exact : un nœud saturé qui rendrait 0 poserait un direct
        // SANS AUCUN plafond, soit l'inverse de l'intention.
        for (const occupation of [999, 10_000, Number.MAX_SAFE_INTEGER]) {
            const plafond = computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: occupation });
            expect(plafond).toBe(PLANCHER);
            expect(plafond).toBeGreaterThan(0);
        }
    });

    it('traite une occupation illisible comme inconnue, sans faire échouer le calcul', () => {
        const vide = computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: 0 });
        expect(computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: null })).toBe(vide);
    });

    it('rend toujours un entier — `maxParticipants` n’accepte pas une fraction', () => {
        for (const c of [1, 2, 3, 5, 7, 16]) {
            const plafond = computeRoomCapacity({ metrics: coeurs(c), nodeOccupancy: 3 }) as number;
            expect(Number.isInteger(plafond)).toBe(true);
        }
    });

    it('engage seulement la part assumée de la machine, jamais la mesure brute', () => {
        const plafond = computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: 0 }) as number;
        expect(plafond).toBeLessThan(4 * PLACES_PAR_COEUR_MESUREES);
    });

    it('reste cohérent avec la mesure du banc : 4 cœurs → 260 places', () => {
        // 0,00767 cœur par spectateur mesuré sur 1.8.4 → 130 places/cœur,
        // dont la moitié est engagée : 4 × 130 × 0,5 = 260.
        expect(computeRoomCapacity({ metrics: coeurs(4), nodeOccupancy: 0 })).toBe(260);
    });
});

describe('SAT-1 — la pose du plafond de bout en bout', () => {
    /** Espionne les trois accès extérieurs pour vérifier ce qui est RÉELLEMENT appelé. */
    function greffon(overrides: Partial<CeilingDeps> = {}) {
        const creations: { name: string; max: number }[] = [];
        const deps: CeilingDeps = {
            readMetrics: async () => METRIQUES_REELLES_1_8_4,
            listAllRooms: async () => [],
            createRoom: async (name, max) => { creations.push({ name, max }); return true; },
            ...overrides,
        };
        return { deps, creations };
    }

    it('pose sur la room le plafond EXACT qu’elle a calculé', async () => {
        const { deps, creations } = greffon();
        const plafond = await poseRoomCeiling('direct-abc', deps);
        expect(plafond).toBe(260);
        expect(creations).toEqual([{ name: 'direct-abc', max: 260 }]);
    });

    it('retranche la charge déjà portée par le nœud', async () => {
        const { deps, creations } = greffon({
            listAllRooms: async () => [
                { name: 'autre-direct', numParticipants: 40 },
                { name: 'appel', numParticipants: 2 },
            ],
        });
        expect(await poseRoomCeiling('direct-abc', deps)).toBe(260 - 42);
        expect(creations[0].max).toBe(218);
    });

    it('ne crée RIEN quand aucune URL de métriques n’est configurée (l’état du VPS aujourd’hui)', async () => {
        const plafond = await poseRoomCeiling('direct-abc', null);
        expect(plafond).toBeNull();
    });

    it('ne crée RIEN quand /metrics est injoignable — pas de plafond fabriqué', async () => {
        const { deps, creations } = greffon({ readMetrics: async () => null });
        expect(await poseRoomCeiling('direct-abc', deps)).toBeNull();
        expect(creations).toHaveLength(0);
    });

    it('ne crée RIEN quand /metrics répond 404 (prometheus_port absent)', async () => {
        const { deps, creations } = greffon({ readMetrics: async () => SANS_PROMETHEUS });
        expect(await poseRoomCeiling('direct-abc', deps)).toBeNull();
        expect(creations).toHaveLength(0);
    });

    it('rend null — et non un faux succès — si la création échoue', async () => {
        const { deps } = greffon({ createRoom: async () => false });
        expect(await poseRoomCeiling('direct-abc', deps)).toBeNull();
    });

    it('pose quand même un plafond si la charge du nœud est illisible, sans se bloquer', async () => {
        const { deps, creations } = greffon({ listAllRooms: async () => null });
        expect(await poseRoomCeiling('direct-abc', deps)).toBe(260);
        expect(creations).toHaveLength(1);
    });

    it('ne pose JAMAIS 0, même sur un nœud saturé — 0 voudrait dire « aucune limite »', async () => {
        const { deps, creations } = greffon({
            listAllRooms: async () => [{ name: 'saturé', numParticipants: 99999 }],
        });
        expect(await poseRoomCeiling('direct-abc', deps)).toBe(PLANCHER);
        expect(creations[0].max).toBeGreaterThan(0);
    });

    it('suit la machine : sur un nœud à 8 cœurs le plafond double, sans toucher au code', async () => {
        const { deps, creations } = greffon({
            readMetrics: async () => 'go_sched_gomaxprocs_threads 8\n',
        });
        expect(await poseRoomCeiling('direct-abc', deps)).toBe(520);
        expect(creations[0].max).toBe(520);
    });
});
