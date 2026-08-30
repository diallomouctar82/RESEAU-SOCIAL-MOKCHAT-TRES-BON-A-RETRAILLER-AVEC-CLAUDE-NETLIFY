/**
 * SESSION UNIQUE DE L'ARCHITECTE — l'historique que personne n'avait.
 *
 * Constat de l'inventaire de finalisation (30/08/2026) : les deux
 * incarnations de l'Architecte (barre vocale, modal clavier) partageaient
 * déjà UN cerveau (`architecteBrain.ts`) mais AUCUN historique — chaque
 * commande repartait de zéro, une photo analysée était oubliée à l'instant
 * même, et poser une deuxième question sur la même image était impossible.
 *
 * Ce module est LA mémoire de session, unique et partagée : « 1 Architecte,
 * 1 contexte, 1 historique » (exigence explicite de la mission de
 * finalisation). Volontairement en mémoire vive uniquement — la mémoire
 * inter-sessions (`user_memory`) reste un chantier distinct documenté dans
 * `docs/ARCHITECTE.md` §14 ; prétendre s'en souvenir « pour toujours » ici
 * serait une fausse capacité.
 *
 * Qui écrit ici :
 *   - `architecteBrain.runArchitecteCommand` (commandes + réponses) — le
 *     point de passage UNIQUE des deux incarnations, donc jamais de double
 *     écriture ;
 *   - la barre, pour les tours que le cerveau ne voit pas passer : photo
 *     capturée, document importé, réponse d'analyse visuelle.
 */

export interface ArchitecteTurn {
    role: 'utilisateur' | 'architecte';
    kind: 'texte' | 'image' | 'document';
    /** Ce qui a été dit/écrit/répondu — ou la légende d'une image/d'un document. */
    text: string;
    /** Data URL complète (affichage + réutilisation vision). Uniquement pour kind='image'. */
    imageDataUrl?: string;
    imageMimeType?: string;
    /** Nom du fichier importé. Uniquement pour kind='document'. */
    docName?: string;
    /** Extrait du texte réellement extrait du document (pour le contexte du cerveau). */
    docExcerpt?: string;
    at: number;
}

const MAX_TURNS = 40;

let turns: ArchitecteTurn[] = [];
const listeners = new Set<() => void>();

function notify(): void {
    listeners.forEach((l) => { try { l(); } catch { /* un abonné cassé ne doit pas bloquer les autres */ } });
}

export function addSessionTurn(turn: Omit<ArchitecteTurn, 'at'>): void {
    turns = [...turns, { ...turn, at: Date.now() }].slice(-MAX_TURNS);
    notify();
}

export function getSessionTurns(): ArchitecteTurn[] {
    return turns;
}

/** La dernière image montrée dans la session — pour les questions de suivi (« et là, que vois-tu ? »). */
export function getLastSessionImage(): { dataUrl: string; mimeType: string } | null {
    for (let i = turns.length - 1; i >= 0; i--) {
        const t = turns[i];
        if (t.kind === 'image' && t.imageDataUrl) {
            return { dataUrl: t.imageDataUrl, mimeType: t.imageMimeType || 'image/jpeg' };
        }
    }
    return null;
}

/** Le dernier document importé — pour « reprends le document », « corrige-le ». */
export function getLastSessionDocument(): { name: string; excerpt: string } | null {
    for (let i = turns.length - 1; i >= 0; i--) {
        const t = turns[i];
        if (t.kind === 'document' && t.docExcerpt) {
            return { name: t.docName || 'document', excerpt: t.docExcerpt };
        }
    }
    return null;
}

/**
 * Résumé du contexte récent, injecté dans le prompt du cerveau.
 *
 * Toujours borné : jamais tout l'historique dans chaque requête (principe de
 * budget contextuel de ce dépôt). Les images/documents apparaissent comme
 * mentions datées — le modèle sait qu'ils existent, sans recevoir leurs
 * octets.
 */
export function buildSessionContext(maxChars: number = 1600): string {
    if (turns.length === 0) return '';
    const lines: string[] = [];
    for (let i = turns.length - 1; i >= 0 && lines.join('\n').length < maxChars; i--) {
        const t = turns[i];
        const who = t.role === 'utilisateur' ? 'Utilisateur' : 'Architecte';
        if (t.kind === 'image') {
            lines.unshift(`[${who} a montré une image — ${t.text || 'sans légende'}]`);
        } else if (t.kind === 'document') {
            lines.unshift(`[${who} a fourni le document « ${t.docName} »${t.docExcerpt ? ` — extrait réel : ${t.docExcerpt.slice(0, 300)}` : ''}]`);
        } else {
            lines.unshift(`${who} : ${t.text.slice(0, 220)}`);
        }
    }
    return lines.join('\n').slice(-maxChars);
}

/** Y a-t-il une image dans la session ? (garde anti-hallucination visuelle) */
export function sessionHasImage(): boolean {
    return getLastSessionImage() !== null;
}

export function subscribeToSession(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

/** Réservé aux tests et à une future commande explicite « oublie cette conversation ». */
export function clearSession(): void {
    turns = [];
    notify();
}
