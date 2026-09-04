// SAT-1 — LE PLAFOND D'UN DIRECT : ce que la machine peut réellement porter.
//
// SAT-2 a posé la porte, SAT-3 l'écran. Mais les deux étaient inertes, et pour
// une raison précise : **personne ne posait jamais de plafond**. La fonction
// Edge n'appelait pas `createRoom` ; LiveKit créait donc la room tout seul à
// l'arrivée du premier participant, sans `maxParticipants`. Or `0` signifie
// « aucune limite » — la porte ne refusait personne, quoi qu'il arrive.
//
// ─── CE QUE LE BANC A MESURÉ (et qui a dicté cette conception) ──────────────
//
// Sonde exécutée contre les DEUX binaires (1.8.4 = le VPS, 1.13.6 = la cible) :
//
//   Q1  /metrics n'existe QUE si `prometheus_port` est configuré.
//       Sans lui : HTTP 404 sur le port principal. Le VPS ne l'a pas.
//   Q2  createRoom({maxParticipants}) pose RÉELLEMENT le plafond.
//   Q3  un SECOND createRoom sur la même room NE CHANGE RIEN (3 reste 3).
//       → le plafond ne se pose qu'À LA CRÉATION, et aucune méthode du SDK
//         ne le corrige ensuite (createRoom, listRooms, deleteRoom,
//         updateRoomMetadata, listParticipants, getParticipant,
//         removeParticipant, forwardParticipant, moveParticipant,
//         mutePublishedTrack, updateParticipant, updateSubscriptions,
//         sendData — aucune ne touche maxParticipants).
//   Q5  listRooms() SANS filtre donne toutes les rooms du nœud et leur
//       occupation → la charge du nœud est lisible sans prometheus.
//   Q6  une room vide DISPARAÎT (empty_timeout) → le plafond est perdu et
//       doit être re-posé à la (re)création suivante.
//
// ─── D'OÙ VIENT LE CHIFFRE (et pourquoi il n'est pas inventé) ───────────────
//
// LiveKit n'expose AUCUN plafond. Il expose ce que la machine a :
// `go_sched_gomaxprocs_threads` — le nombre de cœurs que le serveur voit.
// C'est ce qui fait suivre l'infra toute seule : si le VPS passe de 2 à 8
// cœurs, le plafond suit sans qu'on retouche une ligne.
//
// Reste à savoir ce que COÛTE une place. Ce chiffre-là a été MESURÉ, pas
// supposé — banc du 04/09/2026, binaire 1.8.4 exact du VPS, vrais navigateurs
// dans une vraie room, topologie d'un direct (un animateur publie, les autres
// reçoivent), compteur `process_cpu_seconds_total` du processus LiveKit :
//
//   repos (0 participant) .................... 0,0017 cœur
//   1 animateur + 4 spectateurs .............. 0,0323 cœur
//   coût marginal d'UN spectateur ............ 0,00767 cœur
//   → PLACES PAR CŒUR ........................ 130
//
// Cette mesure est honnête sur ses limites, et c'est pour elles qu'existe la
// part réservée ci-dessous :
//   • elle est faite en AUDIO seul ; une piste vidéo coûte nettement plus ;
//   • elle est faite à 5 participants, pas à 500 ;
//   • le nœud sert aussi les appels 1-à-1, le relais TURN et le système.
//
// La part réservée n'est donc pas une marge de confort : c'est l'écart assumé
// entre ce qui a pu être mesuré et ce que la machine porte réellement.
// Le protocole de re-mesure est dans docs/LIVE_SATURATION_AUDIT.md — la même
// sonde, lancée sur le VPS, donne le chiffre de la vraie machine.

/** Places par cœur, MESURÉES au banc (voir l'encadré ci-dessus). */
export const PLACES_PAR_COEUR_MESUREES = 130;

/**
 * Part de la machine que le plafond ne réclame jamais.
 *
 * Décision de conception explicite, pas un réglage : la mesure est en audio
 * seul et à faible effectif, et le nœud porte aussi les appels, le TURN et le
 * système. On n'engage donc que la moitié de ce que la mesure autorise.
 */
export const PART_ENGAGEE = 0.5;

/**
 * Plancher absolu. **Jamais 0** : pour LiveKit, `maxParticipants: 0` veut dire
 * « AUCUNE limite ». Un calcul qui tomberait à zéro poserait donc exactement
 * l'inverse de ce qu'il croit poser — un direct sans plafond du tout.
 */
export const PLANCHER = 1;

/** Ce que le nœud dit de lui-même. */
export interface NodeMetrics {
    /** Cœurs vus par le serveur LiveKit (`go_sched_gomaxprocs_threads`). */
    cores: number;
}

/**
 * Lit les métriques du nœud dans la réponse Prometheus de LiveKit.
 *
 * Rend `null` dès que le chiffre n'est pas là : on ne devine pas la taille
 * d'une machine.
 */
export function readNodeMetrics(prometheusText: unknown): NodeMetrics | null {
    if (typeof prometheusText !== 'string' || !prometheusText) return null;
    // Format Prometheus : une métrique sans étiquette, valeur en fin de ligne.
    const ligne = prometheusText.match(/^go_sched_gomaxprocs_threads\s+([0-9.eE+-]+)\s*$/m);
    if (!ligne) return null;
    const cores = Number(ligne[1]);
    if (!Number.isFinite(cores) || cores <= 0) return null;
    return { cores: Math.trunc(cores) };
}

export interface CapacityInput {
    /** Métriques du nœud, ou `null` si /metrics n'a pas répondu. */
    metrics: NodeMetrics | null;
    /**
     * Participants DÉJÀ présents sur le nœud, toutes rooms confondues
     * (`listRooms()` sans filtre). `null` = lecture impossible.
     *
     * Ce compte vient de `numParticipants`, dont SAT-2 a mesuré le retard
     * (1-3 s sur 1.8.4, 3-6 s sur 1.13.6). Ce retard est sans conséquence
     * ICI : il s'agit d'une charge de nœud à l'échelle de la minute, pas d'une
     * ruée sur une seule room — c'est précisément pourquoi la PORTE, elle,
     * continue de compter sur `listParticipants`.
     */
    nodeOccupancy: number | null;
}

/**
 * Le plafond à poser sur une room qui va être créée — ou `null` quand on ne
 * sait pas.
 *
 * `null` n'est pas un échec : c'est le refus de deviner. Aucun plafond n'est
 * alors posé, la room se comporte exactement comme aujourd'hui, et la porte
 * SAT-2 laisse entrer. Mieux vaut un direct sans plafond qu'un plafond
 * fabriqué.
 */
export function computeRoomCapacity(input: CapacityInput): number | null {
    const cores = input.metrics?.cores;
    if (typeof cores !== 'number' || !Number.isFinite(cores) || cores <= 0) return null;

    const budget = Math.floor(cores * PLACES_PAR_COEUR_MESUREES * PART_ENGAGEE);
    if (budget < PLANCHER) return PLANCHER;

    const occupation = typeof input.nodeOccupancy === 'number'
        && Number.isFinite(input.nodeOccupancy)
        && input.nodeOccupancy > 0
        ? Math.trunc(input.nodeOccupancy)
        : 0;

    // Ce qui reste après ce que le nœud porte déjà : un nouveau direct ne
    // peut pas promettre des places que les directs en cours occupent.
    return Math.max(PLANCHER, budget - occupation);
}

/**
 * Somme des participants annoncés par toutes les rooms du nœud.
 *
 * Tolérant par construction : une room dont le compteur est illisible est
 * ignorée plutôt que de faire échouer toute la lecture.
 */
export function sumNodeOccupancy(rooms: unknown): number | null {
    if (!Array.isArray(rooms)) return null;
    let total = 0;
    for (const room of rooms) {
        const n = Number((room as { numParticipants?: unknown })?.numParticipants ?? 0);
        if (Number.isFinite(n) && n > 0) total += Math.trunc(n);
    }
    return total;
}

/**
 * Les trois seuls accès au monde extérieur dont la pose du plafond a besoin.
 *
 * Ils sont injectés plutôt qu'appelés directement pour une raison qui n'est pas
 * cosmétique : c'est ce qui permet au banc d'exécuter CETTE fonction-ci contre
 * un vrai serveur LiveKit, au lieu d'en rejouer une imitation. Une règle qu'on
 * ne peut pas exécuter telle quelle n'est pas prouvée.
 */
export interface CeilingDeps {
    /** Corps de `/metrics`, ou `null` si injoignable. Ne doit jamais lever. */
    readMetrics: () => Promise<string | null>;
    /** Toutes les rooms du nœud (`listRooms()` sans filtre). Ne doit jamais lever. */
    listAllRooms: () => Promise<unknown>;
    /** Crée la room avec ce plafond. Rend `false` en cas d'échec. Ne doit jamais lever. */
    createRoom: (name: string, maxParticipants: number) => Promise<boolean>;
}

/**
 * Pose le plafond sur une room qui n'existe pas encore, et rend la valeur
 * réellement posée — ou `null` quand rien n'a été posé.
 *
 * `null` couvre TOUS les cas d'incertitude, et c'est voulu : pas d'URL de
 * métriques, métriques illisibles, machine inconnue, création refusée. Dans
 * chacun, la room naîtra comme avant SAT-1, sans plafond, et la porte laissera
 * entrer. Jamais un chiffre fabriqué pour « faire quelque chose ».
 */
export async function poseRoomCeiling(roomName: string, deps: CeilingDeps | null): Promise<number | null> {
    if (!deps) return null;

    const metrics = readNodeMetrics(await deps.readMetrics());
    if (!metrics) return null;

    const capacity = computeRoomCapacity({
        metrics,
        nodeOccupancy: sumNodeOccupancy(await deps.listAllRooms()),
    });
    if (capacity === null) return null;

    return (await deps.createRoom(roomName, capacity)) ? capacity : null;
}
