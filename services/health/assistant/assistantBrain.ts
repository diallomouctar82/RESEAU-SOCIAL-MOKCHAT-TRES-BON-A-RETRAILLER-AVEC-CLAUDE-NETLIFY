// Le « cerveau » de l'Assistant Santé Globale — la partie qui parle et qui
// comprend, sans réseau.
//
//   • narrateReport   : dit le bilan en français, pour l'écran et pour la voix ;
//   • narrateCampaign : dit ce qu'une campagne a fait, boucle par boucle ;
//   • parseIntent     : comprend une consigne (voix ou texte) — analyser,
//                       réparer une portée, expliquer un point, restaurer,
//                       arrêter — sans jamais deviner une portée de réparation
//                       ambiguë : « répare » sans précision demande de préciser ;
//   • contextForLlm   : le bilan compact, pour qu'une question libre puisse
//                       être posée à la passerelle IA existante avec les faits,
//                       jamais de mémoire.
//
// Tout est déterministe et testé ; ce qui vient d'un modèle de langage est
// toujours présenté comme tel par l'interface.

import { HealthLineState, HealthReport, HealthStatus } from '../healthTypes';
import { HEALTH_BLOCKS } from '../healthRegistry';
import { SecurityReport } from '../securityAudit';
import { CampaignResult, CampaignScope, CampaignRank } from './repairCampaign';

export interface BrainContext {
    report: HealthReport;
    securite: SecurityReport | null;
    rank: CampaignRank;
}

const MOT: Record<HealthStatus, string> = {
    rouge: 'rouge — critique ou bloquant',
    orange: 'orange — partiel ou fragile',
    blanc: 'non mesuré',
    jaune: 'jaune — en attente',
    vert: 'vert — conforme',
};

const RISQUE: Record<string, string> = { critique: 'risque critique', eleve: 'risque élevé', moyen: 'risque moyen', faible: 'risque faible' };

const pct = (v: number | null | undefined) => (v === null || v === undefined ? 'non mesurée' : `${Math.round(v)} %`);

function lignes(report: HealthReport): HealthLineState[] {
    return report.domains.flatMap((d) => d.lines);
}

function prioritaires(report: HealthReport, n: number): HealthLineState[] {
    const rang: Record<string, number> = { critique: 0, eleve: 1, moyen: 2, faible: 3 };
    return lignes(report)
        .filter((l) => l.outcome.status === 'rouge' || l.outcome.status === 'orange')
        .sort((a, b) => {
            const s = (a.outcome.status === 'rouge' ? 0 : 1) - (b.outcome.status === 'rouge' ? 0 : 1);
            if (s !== 0) return s;
            return rang[a.line.risk] - rang[b.line.risk];
        })
        .slice(0, n);
}

/** Le bilan, dit en français — court pour être écouté, complet pour être lu. */
export function narrateReport(ctx: BrainContext): string {
    const { report, securite, rank } = ctx;
    const t = report.tally;
    const phrases: string[] = [];

    if (report.score === null) {
        phrases.push("Bilan de MokNet : aucune ligne n'a pu être mesurée. La santé est inconnue, pas bonne.");
    } else {
        phrases.push(`Bilan de MokNet : état ${MOT[report.status]}.`);
        phrases.push(`Santé ${pct(report.score)} sur ${Math.round(report.coverage * 100)} % du périmètre mesuré.`);
        if (securite) {
            phrases.push(
                `Sécurité ${pct(securite.score)} aujourd'hui, contre ${securite.reference.score} % à l'audit du ${securite.reference.dateLabel}.`,
            );
        }
        phrases.push(`${t.rouge} rouge${t.rouge > 1 ? 's' : ''}, ${t.orange} orange${t.orange > 1 ? 's' : ''}, ${t.blanc} non mesuré${t.blanc > 1 ? 's' : ''}, ${t.vert} vert${t.vert > 1 ? 's' : ''}.`);
    }

    const top = prioritaires(report, 3);
    if (top.length > 0) {
        phrases.push(`Priorités : ${top.map((l) => `${l.line.title} (${RISQUE[l.line.risk] ?? l.line.risk})`).join(' ; ')}.`);
    }

    const aCorriger = lignes(report).filter((l) => l.outcome.status === 'rouge' || l.outcome.status === 'orange');
    const auto = aCorriger.filter((l) => l.line.remediation).length;
    const manuelles = aCorriger.length - auto;
    if (aCorriger.length > 0) {
        phrases.push(`${auto} réparation${auto > 1 ? 's' : ''} automatique${auto > 1 ? 's' : ''} possible${auto > 1 ? 's' : ''}, ${manuelles} point${manuelles > 1 ? 's' : ''} à traiter à la main.`);
    } else if (report.score !== null) {
        phrases.push('Aucun point rouge ni orange : rien à réparer.');
    }

    phrases.push(rank.canRepair
        ? 'Votre rang permet de réparer : dites « répare les rouges », « répare tout », ou choisissez un domaine.'
        : `Votre rang (${rank.role ?? 'inconnu'}) permet de mesurer et de diagnostiquer ; réparer exige le rang Admin Général, je peux vous guider pour l'activer.`);

    return phrases.join(' ');
}

/** Ce qu'une campagne a fait, dit sans détour. */
export function narrateCampaign(result: CampaignResult): string {
    const c = result.counts;
    const phrases: string[] = [];
    const mode = result.plan.mode === 'diagnostic' ? 'Diagnostic' : 'Campagne';
    phrases.push(`${mode} sur ${result.plan.label} : ${result.percent} % parcouru.`);
    if (result.plan.items.length === 0) {
        phrases.push('Aucun point rouge ni orange dans cette portée : rien à faire.');
        return phrases.join(' ');
    }
    const parts: string[] = [];
    if (c.reparee) parts.push(`${c.reparee} réparé${c.reparee > 1 ? 's' : ''} et vérifié${c.reparee > 1 ? 's' : ''}`);
    if (c.diagnostiquee) parts.push(`${c.diagnostiquee} diagnostiqué${c.diagnostiquee > 1 ? 's' : ''} sans rien modifier`);
    if (c.rien_a_faire) parts.push(`${c.rien_a_faire} sans rien à corriger`);
    if (c.echec) parts.push(`${c.echec} échec${c.echec > 1 ? 's' : ''}`);
    if (c.manuelle) parts.push(`${c.manuelle} à faire à la main`);
    if (c.recommandee) parts.push(`${c.recommandee} avec une action recommandée`);
    if (c.ignoree) parts.push(`${c.ignoree} non tenté${c.ignoree > 1 ? 's' : ''}`);
    if (parts.length) phrases.push(parts.join(', ') + '.');
    if (result.arret) {
        phrases.push(result.arret.motif === 'incontrolable'
            ? `Arrêt : ${result.arret.detail} Les points déjà réparés restent restaurables d'un clic.`
            : result.arret.detail);
    }
    if (c.echec) phrases.push('Pour chaque échec, la cause exacte, les étapes et le lien sont affichés.');
    if (c.manuelle) phrases.push("Pour chaque action manuelle, l'endroit exact et les étapes sont affichés.");
    return phrases.join(' ');
}

// ─────────────────────────── Intentions ───────────────────────────

export type Intent =
    | { kind: 'analyser' }
    | { kind: 'reparer'; scope: CampaignScope }
    | { kind: 'preciser'; raison: string }
    | { kind: 'expliquer'; lineId: string | null; query: string }
    | { kind: 'restaurer' }
    | { kind: 'arreter' }
    | { kind: 'aide' }
    | { kind: 'question'; query: string };

export function normaliser(texte: string): string {
    return texte
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[’']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const MOTS_VIDES = new Set(['le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'au', 'aux', 'par', 'sur', 'pour', 'dans', 'sans', 'non', 'pas', 'que', 'qui', 'a', 'd', 'l']);

function jetons(texte: string): string[] {
    return normaliser(texte).split(/[^a-z0-9]+/).filter((m) => m.length >= 3 && !MOTS_VIDES.has(m));
}

/** Trouve le point dont le titre correspond le mieux à la phrase, ou null si trop incertain. */
export function findLineByText(texte: string, report: HealthReport): HealthLineState | null {
    const mots = new Set(jetons(texte));
    if (mots.size === 0) return null;
    let meilleur: { state: HealthLineState; score: number } | null = null;
    for (const state of lignes(report)) {
        const titre = jetons(state.line.title);
        if (titre.length === 0) continue;
        const communs = titre.filter((m) => mots.has(m)).length;
        const score = communs / titre.length;
        if (communs >= 2 && score >= 0.5 && (!meilleur || score > meilleur.score)) meilleur = { state, score };
    }
    return meilleur?.state ?? null;
}

function findBlocByText(texte: string): CampaignScope | null {
    const n = normaliser(texte);
    const alias: Record<string, string[]> = {
        securite: ['securite'],
        application: ['application', 'navigateur'],
        connecteurs: ['connecteur'],
        live: ['live', 'direct'],
        vps: ['vps', 'serveur de direct'],
        base: ['base de donnees', 'base', 'donnees'],
        externes: ['service externe', 'services externes', 'externe'],
    };
    for (const bloc of HEALTH_BLOCKS) {
        if ((alias[bloc.id] ?? [normaliser(bloc.title)]).some((a) => n.includes(a))) return { kind: 'bloc', blocId: bloc.id };
    }
    return null;
}

/** Comprend une consigne. Une réparation à portée ambiguë demande de préciser — jamais de portée devinée. */
export function parseIntent(texte: string, report?: HealthReport): Intent {
    const n = normaliser(texte);
    if (!n) return { kind: 'aide' };

    if (/\b(stop|stoppe|arret|arrete|arreter|pause|annule)\b/.test(n)) return { kind: 'arreter' };
    if (/\b(restaur|retour a l etat|reviens en arriere|annuler les reparations)/.test(n)) return { kind: 'restaurer' };
    if (/\b(aide|help|commandes|que sais tu|que peux tu)\b/.test(n)) return { kind: 'aide' };
    if (/\b(analys|scann|scan|mesur|verifi|relance|lance l analyse|bilan|etat de sante)/.test(n) && !/\b(repar|corrig)/.test(n)) {
        return { kind: 'analyser' };
    }

    if (/\b(repar|corrig)/.test(n)) {
        if (/\brouge/.test(n)) return { kind: 'reparer', scope: { kind: 'rouges' } };
        if (/\borange/.test(n)) return { kind: 'reparer', scope: { kind: 'oranges' } };
        if (/\b(tout|lot|ensemble|global|complet)\b/.test(n)) return { kind: 'reparer', scope: { kind: 'tout' } };
        const bloc = /\b(domaine|brique|bloc)\b/.test(n) || true ? findBlocByText(n) : null;
        if (bloc && /\b(domaine|brique|bloc|securite|application|connecteur|live|vps|base|donnees|externe)/.test(n)) return { kind: 'reparer', scope: bloc };
        if (report) {
            const ligne = findLineByText(n, report);
            if (ligne) return { kind: 'reparer', scope: { kind: 'ligne', lineId: ligne.line.id } };
        }
        return { kind: 'preciser', raison: 'Précisez la portée : « tout le lot », « les rouges », « les oranges », un domaine (sécurité, application, connecteurs, live, VPS, base de données, services externes) ou le nom d\'un point.' };
    }

    if (/\b(expliqu|pourquoi|c est quoi|qu est ce|detail|cause|impact)/.test(n)) {
        const ligne = report ? findLineByText(n, report) : null;
        return { kind: 'expliquer', lineId: ligne?.line.id ?? null, query: texte };
    }

    if (report) {
        const ligne = findLineByText(n, report);
        if (ligne) return { kind: 'expliquer', lineId: ligne.line.id, query: texte };
    }
    return { kind: 'question', query: texte };
}

/** Réponse locale, sans modèle de langage, quand l'intention le permet. */
export function explainLine(state: HealthLineState, rank: CampaignRank): string {
    const { line, outcome } = state;
    const phrases: string[] = [];
    phrases.push(`${line.title} : ${MOT[outcome.status]}.`);
    phrases.push(`Constaté : ${outcome.measured}`);
    if (outcome.gap) phrases.push(`Écart : ${outcome.gap}`);
    if (outcome.status === 'rouge' || outcome.status === 'orange') {
        phrases.push(`Cause probable : ${line.cause}`);
        phrases.push(`Impact : ${line.impact}`);
        phrases.push(`Niveau de risque : ${RISQUE[line.risk] ?? line.risk}.`);
        if (line.remediation) {
            phrases.push(rank.canRepair
                ? `Réparation automatique disponible : ${line.remediation.label}. Dites « répare ${line.title} » pour la lancer, après diagnostic et confirmation.`
                : `Réparation automatique disponible (${line.remediation.label}), mais votre rang ne permet que le diagnostic.`);
        } else if (line.manual) {
            phrases.push(`Action manuelle requise — ${line.manual.where}. Étapes : ${line.manual.steps.join(' ')}`);
        } else if (line.recommendedAction) {
            phrases.push(`Action recommandée : ${line.recommendedAction}`);
        }
    } else if (outcome.status === 'blanc') {
        phrases.push(outcome.probeError ? `Non mesuré : ${outcome.probeError}` : 'Non mesuré.');
        if (line.manual) phrases.push(`Pour le mesurer ou le corriger — ${line.manual.where} : ${line.manual.steps.join(' ')}`);
    } else {
        phrases.push('Rien à faire.');
    }
    return phrases.join(' ');
}

export function helpText(rank: CampaignRank): string {
    return [
        'Je peux : « analyser » (tout scanner), « répare tout », « répare les rouges », « répare les oranges », « répare le domaine live », « répare <nom d\'un point> », « explique <nom d\'un point> », « restaure le lot », « stop ».',
        rank.canRepair
            ? 'Chaque réparation passe par un diagnostic, une seule confirmation pour le lot, une sauvegarde, une vérification et le journal.'
            : 'Avec votre rang, les réparations se font en diagnostic seulement (rien n\'est modifié) ; je vous guide pour activer le rang Admin Général.',
    ].join(' ');
}

// ─────────────────────────── Contexte pour la passerelle IA ───────────────────────────

export const SYSTEM_PROMPT =
    "Tu es l'Assistant Santé Globale de MokNet, au service de la Direction. Tu réponds en français, en trois phrases au plus, " +
    "uniquement à partir du CONTEXTE JSON fourni (mesures réelles). Si l'information n'y est pas, dis « je ne l'ai pas mesuré » ; " +
    "n'invente jamais un chiffre ni une réparation. Une réparation ne s'applique que par le bouton Réparer, après diagnostic et confirmation ; " +
    "si canRepair est faux, rappelle que réparer exige le rang Admin Général. Ton : professionnel, calme, précis.";

/** Le bilan compact, pour une question libre : que les faits, jamais le registre entier. */
export function contextForLlm(ctx: BrainContext): string {
    const { report, securite, rank } = ctx;
    const nonVertes = lignes(report)
        .filter((l) => l.outcome.status !== 'vert')
        .map((l) => ({
            id: l.line.id,
            titre: l.line.title,
            bloc: l.line.bloc,
            statut: l.outcome.status,
            risque: l.line.risk,
            constate: l.outcome.measured,
            ecart: l.outcome.gap ?? null,
            voie: l.line.remediation ? `réparation automatique : ${l.line.remediation.label}` : l.line.humanAction ? `action manuelle : ${l.line.manual?.where ?? ''}` : l.line.recommendedAction ?? null,
        }));
    return JSON.stringify({
        etat: report.status,
        sante: report.score,
        couverture: Math.round(report.coverage * 100),
        securite: securite ? { aujourdhui: securite.score, audit: securite.reference.score, dateAudit: securite.reference.dateLabel } : null,
        comptes: report.tally,
        rang: rank,
        lignesNonVertes: nonVertes,
    });
}
