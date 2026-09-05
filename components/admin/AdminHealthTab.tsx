import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity, AlertTriangle, ChevronRight, CircleHelp, ClipboardList, Database, ExternalLink, Filter,
    Globe, ListChecks, Loader2, Lock, MonitorSmartphone, Plug, Radio, RefreshCw, Search, Server,
    ShieldAlert, ShieldCheck, Stethoscope, Undo2, Wrench, X, XCircle,
} from 'lucide-react';
import {
    BlockScore, DiagnosisPlan, HealthBlockId, HealthJournalEntry, HealthLineState, HealthStatus, RiskLevel,
} from '../../services/health/healthTypes';
import { isCertifiable, verdictSentence } from '../../services/health/healthScore';
import { HEALTH_BLOCKS, HEALTH_LINES } from '../../services/health/healthRegistry';
import {
    HealthRank, HealthSnapshot, diagnose, loadJournal, repair, restore, runHealthCheck,
} from '../../services/health/healthService';
import { SecurityReport, buildSecurityReport } from '../../services/health/securityAudit';
import { resolveGuideUrl } from '../../services/health/healthGuide';
import { emergencyJournalLabel } from '../../services/health/liveEmergency';
import { LiveEmergencyPanel } from './LiveEmergencyPanel';

/**
 * Santé Globale — console d'exploitation de MokNet.
 *
 * QUI S'EN SERT : l'Admin Général et les administrateurs. Pas des
 * développeurs : des responsables qui doivent savoir en quelques secondes si
 * la plateforme va bien, ce qui ne va pas, et quoi faire.
 *
 * CADRE FIXÉ PAR LA DIRECTION LE 05/09/2026 :
 *   1. dès la fin de l'analyse : la SANTÉ et la SÉCURITÉ en pour cent, des
 *      graphiques clairs, la progression de chaque vague de correctifs ;
 *   2. trois blocs de couleur — ROUGE critique ou bloquant, ORANGE partiel ou
 *      fragile, VERT conforme — jamais tout dans une seule liste ;
 *   3. sept domaines de lecture : Sécurité, Application, Connecteurs, Live,
 *      VPS, Base de données, Services externes ;
 *   4. pour chaque problème : le problème, la cause, l'impact, le niveau de
 *      risque et l'action recommandée ;
 *   5. un bouton Réparer qui répare VRAIMENT quand c'est possible ; l'action
 *      manuelle n'apparaît que quand aucune réparation automatique n'existe,
 *      et elle redirige vers l'endroit exact, pas à pas. Jamais de faux bouton.
 *
 * TROIS RÈGLES TENUES DEPUIS LA PREMIÈRE VERSION :
 *   • Aucun faux vert — une ligne non mesurée est BLANCHE, et un score ne
 *     s'affiche jamais sans sa couverture.
 *   • Aucun bouton qui ne peut pas aboutir — réparer et restaurer n'existent
 *     que pour l'Admin Général ; sinon on écrit « Diagnostic seulement ».
 *   • Aucune action sans son périmètre montré d'abord.
 */

// ─────────────────────────── Vocabulaire visuel ───────────────────────────

interface StatutStyle {
    label: string;
    court: string;
    aplat: string;
    texte: string;
    fond: string;
    bord: string;
    rang: number;
    /** Le mot affiché sur chaque carte et dans le badge global : lisible sans légende. */
    mot: string;
    /** Couleur SVG pour les graphiques. */
    hex: string;
}

const STATUT: Record<HealthStatus, StatutStyle> = {
    rouge:  { label: 'Critique ou bloquant', court: 'Rouge',  aplat: 'bg-red-600',     texte: 'text-red-700',     fond: 'bg-red-50',     bord: 'border-red-200',     rang: 0, mot: 'ROUGE',      hex: '#dc2626' },
    orange: { label: 'Partiel ou fragile',   court: 'Orange', aplat: 'bg-orange-500',  texte: 'text-orange-700',  fond: 'bg-orange-50',  bord: 'border-orange-200',  rang: 1, mot: 'ORANGE',     hex: '#f97316' },
    blanc:  { label: 'Non mesuré',           court: 'Blanc',  aplat: 'bg-slate-300',   texte: 'text-slate-600',   fond: 'bg-slate-100',  bord: 'border-slate-200',   rang: 2, mot: 'NON MESURÉ', hex: '#cbd5e1' },
    jaune:  { label: 'En attente',           court: 'Jaune',  aplat: 'bg-amber-400',   texte: 'text-amber-700',   fond: 'bg-amber-50',   bord: 'border-amber-200',   rang: 3, mot: 'JAUNE',      hex: '#f59e0b' },
    vert:   { label: 'Conforme',             court: 'Vert',   aplat: 'bg-emerald-500', texte: 'text-emerald-700', fond: 'bg-emerald-50', bord: 'border-emerald-200', rang: 4, mot: 'VERT',       hex: '#10b981' },
};

const ORDRE_STATUTS: HealthStatus[] = ['rouge', 'orange', 'blanc', 'jaune', 'vert'];

const RISQUE: Record<RiskLevel, { label: string; classe: string; rang: number }> = {
    critique: { label: 'Risque critique', classe: 'bg-red-100 text-red-800 border-red-200',          rang: 0 },
    eleve:    { label: 'Risque élevé',    classe: 'bg-orange-100 text-orange-800 border-orange-200', rang: 1 },
    moyen:    { label: 'Risque moyen',    classe: 'bg-amber-100 text-amber-800 border-amber-200',    rang: 2 },
    faible:   { label: 'Risque faible',   classe: 'bg-slate-100 text-slate-700 border-slate-200',    rang: 3 },
};

const PORTEE_LIBELLE: Record<string, string> = { serveur: 'Serveur', client: 'Navigateur', humain: 'Humain' };

type Icone = React.FC<{ size?: number; className?: string }>;

const ICONE_BLOC: Record<HealthBlockId, Icone> = {
    securite: ShieldAlert,
    application: MonitorSmartphone,
    connecteurs: Plug,
    live: Radio,
    vps: Server,
    base: Database,
    externes: Globe,
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

/** Horodatage court et lisible — « il y a 3 min » plutôt qu'une date ISO. */
function depuis(iso: string | undefined): string {
    if (!iso) return '—';
    const secondes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (secondes < 60) return "à l'instant";
    const minutes = Math.round(secondes / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const heures = Math.round(minutes / 60);
    if (heures < 24) return `il y a ${heures} h`;
    return `il y a ${Math.round(heures / 24)} j`;
}

const pct = (value: number | null | undefined): string => (value === null || value === undefined ? '—' : `${Math.round(value)} %`);

// ─────────────────────────── Voie d'action ───────────────────────────
//
// Ce qu'une ligne PEUT proposer à CETTE personne — une seule voie à la fois,
// jamais un bouton qui ment :
//   • réparer      : réparation automatique, ET rang qui permet de l'appliquer ;
//   • diagnostic   : réparation automatique, mais rang insuffisant → lecture seule ;
//   • manuelle     : aucune réparation automatique n'existe → guide pas à pas ;
//   • recommandee  : rien d'automatisable, pas de guide : la recommandation ;
//   • aucune       : conforme, rien à faire.

type VoieKind = 'reparer' | 'diagnostic' | 'manuelle' | 'recommandee' | 'aucune';

interface Voie {
    kind: VoieKind;
    texte: string;
    classe: string;
    Icone: Icone;
}

function voieAction(state: HealthLineState, rank: HealthRank): Voie {
    const { line, outcome } = state;
    const aCorriger = outcome.status === 'rouge' || outcome.status === 'orange';
    const nonMesure = outcome.status === 'blanc';
    if (line.remediation && aCorriger) {
        return rank.canRepair
            ? { kind: 'reparer', texte: 'Réparer', classe: 'text-blue-700', Icone: Wrench }
            : { kind: 'diagnostic', texte: 'Diagnostic seulement', classe: 'text-amber-700', Icone: Stethoscope };
    }
    if (line.humanAction && (aCorriger || nonMesure)) {
        return { kind: 'manuelle', texte: 'Action manuelle requise', classe: 'text-slate-700', Icone: CircleHelp };
    }
    if (line.recommendedAction && aCorriger) {
        return { kind: 'recommandee', texte: 'Action recommandée', classe: 'text-slate-600', Icone: ListChecks };
    }
    return { kind: 'aucune', texte: '', classe: 'text-slate-400', Icone: ShieldCheck };
}

// ─────────────────────────── Anneau de score ───────────────────────────

/**
 * Deux anneaux concentriques : la NOTE à l'extérieur, la COUVERTURE à
 * l'intérieur. Les deux chiffres voyagent toujours ensemble — un score seul
 * laisserait croire que tout a été contrôlé.
 */
const AnneauScore: React.FC<{
    score: number | null;
    coverage: number;
    status: HealthStatus;
    libelle: string;
    ariaSujet: string;
}> = ({ score, coverage, status, libelle, ariaSujet }) => {
    const R_NOTE = 54;
    const R_COUV = 40;
    const cNote = 2 * Math.PI * R_NOTE;
    const cCouv = 2 * Math.PI * R_COUV;
    const partNote = score === null ? 0 : (score / 100) * cNote;
    const partCouv = coverage * cCouv;
    const couleur = STATUT[status].hex;

    return (
        <svg viewBox="0 0 140 140" className="w-[124px] h-[124px] sm:w-[132px] sm:h-[132px] shrink-0" role="img"
             aria-label={score === null
                 ? `${ariaSujet} indisponible, aucune ligne mesurée`
                 : `${ariaSujet} ${Math.round(score)} %, sur ${Math.round(coverage * 100)} % du périmètre mesuré`}>
            <circle cx="70" cy="70" r={R_NOTE} fill="none" stroke="#1e293b" strokeWidth="9" opacity="0.35" />
            <circle cx="70" cy="70" r={R_NOTE} fill="none" stroke={couleur} strokeWidth="9"
                    strokeDasharray={`${partNote} ${cNote - partNote}`}
                    transform="rotate(-90 70 70)" strokeLinecap="round" />
            <circle cx="70" cy="70" r={R_COUV} fill="none" stroke="#1e293b" strokeWidth="4" opacity="0.35" />
            <circle cx="70" cy="70" r={R_COUV} fill="none" stroke="#60a5fa" strokeWidth="4"
                    strokeDasharray={`${partCouv} ${cCouv - partCouv}`}
                    transform="rotate(-90 70 70)" strokeLinecap="round" />
            <text x="70" y="68" textAnchor="middle" fill="#f8fafc"
                  style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {score === null ? '—' : `${Math.round(score)} %`}
            </text>
            <text x="70" y="86" textAnchor="middle" fill="#94a3b8"
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>
                {score === null ? 'NON MESURÉ' : libelle}
            </text>
        </svg>
    );
};

// ─────────────────────────── Graphiques ───────────────────────────

/** Barre empilée : la forme se lit sans chiffre, les chiffres sont à côté. */
const BarreEmpilee: React.FC<{ tally: Record<HealthStatus, number>; hauteur?: string }> = ({ tally, hauteur = 'h-2.5' }) => {
    const total = ORDRE_STATUTS.reduce((n, st) => n + tally[st], 0);
    return (
        <div className={`flex gap-px ${hauteur} rounded-full overflow-hidden bg-slate-100`} aria-hidden="true">
            {ORDRE_STATUTS.map((st) => tally[st] > 0 && (
                <span key={st} className={STATUT[st].aplat}
                      style={{ width: `${(tally[st] / Math.max(total, 1)) * 100}%` }} />
            ))}
        </div>
    );
};

const GraphiqueBlocs: React.FC<{ blocks: BlockScore[]; onAller: (id: HealthBlockId) => void }> = ({ blocks, onAller }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-baseline justify-between gap-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Santé par domaine</h3>
            <span className="text-[10px] text-slate-400">7 domaines · cliquer pour y aller</span>
        </div>
        <ul className="space-y-2.5">
            {blocks.map((b) => {
                const IconeBloc = ICONE_BLOC[b.block.id];
                const s = STATUT[b.status];
                return (
                    <li key={b.block.id}>
                        <button onClick={() => onAller(b.block.id)}
                                className="w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
                            <div className="flex items-center gap-2">
                                <IconeBloc size={13} className="text-slate-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex-1 truncate">{b.block.title}</span>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${s.aplat} ${b.status === 'blanc' ? 'text-slate-800' : 'text-white'}`}>
                                    {s.mot}
                                </span>
                                <span className="text-sm font-black tabular-nums text-slate-900 w-14 text-right whitespace-nowrap">{pct(b.score)}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="flex-1"><BarreEmpilee tally={b.tally} /></div>
                                <span className="text-[10px] text-slate-400 tabular-nums w-28 text-right">
                                    {b.tally.rouge} R · {b.tally.orange} O · {b.tally.vert} V
                                    {b.tally.blanc + b.tally.jaune > 0 ? ` · ${b.tally.blanc + b.tally.jaune} ?` : ''}
                                </span>
                            </div>
                        </button>
                    </li>
                );
            })}
        </ul>
    </div>
);

const GraphiqueSecurite: React.FC<{ securite: SecurityReport }> = ({ securite }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
            Sécurité : audit du {securite.reference.dateLabel} → aujourd'hui
        </h3>
        <p className="text-[10px] text-slate-400 mb-3">
            Référence <strong className="text-slate-600">{securite.reference.score} %</strong> (audit indépendant, lecture seule) ·
            aujourd'hui <strong className="text-slate-600">{pct(securite.score)}</strong> sur {Math.round(securite.coverage * 100)} % mesuré.
        </p>
        <ul className="space-y-2">
            {securite.domains.map((d) => {
                const s = STATUT[d.status];
                return (
                    <li key={d.domain.id}>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-800 flex-1 truncate" title={d.domain.auditNote}>{d.domain.title}</span>
                            <span className="text-[10px] text-slate-400 tabular-nums">poids {d.domain.weight}</span>
                            <span className="text-xs font-black tabular-nums text-slate-900 w-20 text-right">
                                <span className="text-slate-400 font-bold">{d.domain.auditScore}</span>
                                <span className="text-slate-300"> → </span>
                                <span className={s.texte}>{d.score === null ? '—' : Math.round(d.score)}</span>
                            </span>
                        </div>
                        <div className="mt-1 space-y-0.5" aria-hidden="true">
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <span className="block h-full bg-slate-300" style={{ width: `${d.domain.auditScore}%` }} />
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                {d.score === null
                                    ? <span className="block h-full w-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#e2e8f0 0,#e2e8f0 4px,transparent 4px,transparent 8px)' }} />
                                    : <span className={`block h-full ${s.aplat}`} style={{ width: `${d.score}%` }} />}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
        <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-slate-300" /> audit</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-emerald-500" /> aujourd'hui (couleur = statut mesuré)</span>
        </div>
    </div>
);

const GraphiqueVagues: React.FC<{ securite: SecurityReport; onOuvrirLigne: (id: string) => void }> = ({ securite, onOuvrirLigne }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-baseline justify-between gap-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Progression des vagues de correctifs</h3>
            <span className="text-[10px] text-slate-400">{securite.findings.filter((f) => f.resolved).length} / {securite.findings.length} constats résolus</span>
        </div>
        <ul className="space-y-3">
            {securite.loops.map((l) => (
                <li key={l.loop.id}>
                    <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-white bg-slate-800 rounded px-1.5 py-0.5">{l.loop.id}</span>
                        <span className="text-xs font-bold text-slate-800 flex-1 truncate">{l.loop.title}</span>
                        <span className="text-sm font-black tabular-nums text-slate-900">{l.percent} %</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar"
                         aria-valuenow={l.percent} aria-valuemin={0} aria-valuemax={100}
                         aria-label={`${l.loop.title} : ${l.resolved} sur ${l.total} constats résolus`}>
                        <span className={`block h-full ${l.percent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${l.percent}%` }} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-400 mr-1">{l.resolved}/{l.total} résolus · {l.loop.horizon}</span>
                        {l.findings.map((f) => {
                            const s = STATUT[f.status];
                            return (
                                <button key={f.finding.ref}
                                        onClick={() => f.lines[0] && onOuvrirLigne(f.lines[0].line.id)}
                                        title={f.finding.title}
                                        className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${s.bord} ${s.fond} ${s.texte} hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
                                    {f.finding.ref}{f.resolved ? ' ✓' : ''}
                                </button>
                            );
                        })}
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

// ─────────────────────────── Carte de contrôle ───────────────────────────

const CarteControle: React.FC<{ state: HealthLineState; rank: HealthRank; onOuvrir: (s: HealthLineState) => void }> = ({ state, rank, onOuvrir }) => {
    const { line, outcome } = state;
    const s = STATUT[outcome.status];
    const voie = voieAction(state, rank);
    return (
        <button onClick={() => onOuvrir(state)}
                className={`w-full text-left rounded-xl border ${s.bord} bg-white p-3 hover:shadow-sm hover:border-slate-300 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 leading-snug">{line.title}</span>
                <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${s.aplat} ${outcome.status === 'blanc' ? 'text-slate-800' : 'text-white'}`}>
                    {s.mot}
                </span>
            </div>
            <p className={`text-xs mt-1 ${outcome.status === 'vert' ? 'text-slate-500' : `font-semibold ${s.texte}`}`}
               style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {outcome.measured}
            </p>
            <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                {outcome.status !== 'vert'
                    ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RISQUE[line.risk].classe}`}>{RISQUE[line.risk].label}</span>
                    : <span className="text-[10px] text-slate-400">rien à faire</span>}
                {voie.kind !== 'aucune' && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black ${voie.classe}`}>
                        <voie.Icone size={11} /> {voie.texte}
                    </span>
                )}
            </div>
        </button>
    );
};

// ─────────────────────────── Section d'un bloc ───────────────────────────

const COLONNES: { statuts: HealthStatus[]; titre: string; sousTitre: string; couleur: HealthStatus }[] = [
    { statuts: ['rouge'],  titre: 'Rouge',  sousTitre: 'critique ou bloquant', couleur: 'rouge' },
    { statuts: ['orange'], titre: 'Orange', sousTitre: 'partiel ou fragile',   couleur: 'orange' },
    { statuts: ['vert'],   titre: 'Vert',   sousTitre: 'conforme',             couleur: 'vert' },
];

function trierParGravite(a: HealthLineState, b: HealthLineState): number {
    const parRisque = RISQUE[a.line.risk].rang - RISQUE[b.line.risk].rang;
    if (parRisque !== 0) return parRisque;
    return b.line.weight - a.line.weight;
}

const SectionBloc: React.FC<{
    bloc: BlockScore;
    visibles: HealthLineState[];
    rank: HealthRank;
    filtreActif: boolean;
    onOuvrir: (s: HealthLineState) => void;
}> = ({ bloc, visibles, rank, filtreActif, onOuvrir }) => {
    const IconeBloc = ICONE_BLOC[bloc.block.id];
    const s = STATUT[bloc.status];
    const nonMesurees = visibles.filter((l) => l.outcome.status === 'blanc' || l.outcome.status === 'jaune').sort(trierParGravite);

    return (
        <section id={`bloc-${bloc.block.id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-4"
                 aria-labelledby={`titre-bloc-${bloc.block.id}`}>
            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.fond} ${s.texte}`}><IconeBloc size={16} /></span>
                    <div className="min-w-0">
                        <h3 id={`titre-bloc-${bloc.block.id}`} className="text-sm font-black text-slate-900 leading-tight">{bloc.block.title}</h3>
                        <p className="text-[11px] text-slate-500 leading-tight">{bloc.block.question}</p>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${s.aplat} ${bloc.status === 'blanc' ? 'text-slate-800' : 'text-white'}`}>{s.mot}</span>
                    <div className="text-right">
                        <div className="text-lg font-black tabular-nums text-slate-900 leading-none">{pct(bloc.score)}</div>
                        <div className="text-[10px] text-slate-400">mesuré à {Math.round(bloc.coverage * 100)} % · {bloc.lines.length} contrôles</div>
                    </div>
                </div>
            </div>

            {visibles.length === 0 ? (
                <p className="px-4 py-6 text-xs text-slate-400 text-center">
                    {filtreActif ? 'Aucun contrôle de ce domaine ne correspond aux filtres.' : 'Aucun contrôle.'}
                </p>
            ) : (
                <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {COLONNES.map((col) => {
                        const lignes = visibles.filter((l) => col.statuts.includes(l.outcome.status)).sort(trierParGravite);
                        const c = STATUT[col.couleur];
                        return (
                            <div key={col.titre} className={`rounded-xl border ${c.bord} ${c.fond} p-2.5`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${c.aplat}`} aria-hidden="true" />
                                    <span className={`text-[11px] font-black uppercase tracking-wider ${c.texte}`}>{col.titre}</span>
                                    <span className="text-[10px] text-slate-500">{col.sousTitre}</span>
                                    <span className="ml-auto text-xs font-black tabular-nums text-slate-700">{lignes.length}</span>
                                </div>
                                {lignes.length === 0
                                    ? <p className="text-[11px] text-slate-400 px-1 py-2">Aucun contrôle {col.titre.toLowerCase()}.</p>
                                    : <div className="space-y-2">{lignes.map((l) => <CarteControle key={l.line.id} state={l} rank={rank} onOuvrir={onOuvrir} />)}</div>}
                            </div>
                        );
                    })}
                </div>
            )}

            {nonMesurees.length > 0 && (
                <div className="px-3 pb-3">
                    <div className="rounded-xl border border-dashed border-slate-300 p-2.5">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" aria-hidden="true" />
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Ni rouge, ni vert</span>
                            <span className="text-[10px] text-slate-500">non mesuré ou en attente — ne compte pas dans la note</span>
                            <span className="ml-auto text-xs font-black tabular-nums text-slate-700">{nonMesurees.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {nonMesurees.map((l) => <CarteControle key={l.line.id} state={l} rank={rank} onOuvrir={onOuvrir} />)}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

// ─────────────────────────── Fiche problème ───────────────────────────

const Rubrique: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
    <div>
        <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{titre}</dt>
        <dd className="text-sm text-slate-700 mt-0.5 leading-relaxed">{children}</dd>
    </div>
);

const FicheProbleme: React.FC<{
    state: HealthLineState;
    rank: HealthRank;
    occupe: boolean;
    onFermer: () => void;
    onDiagnostiquer: (s: HealthLineState) => void;
    onOuvrirLigne: (id: string) => void;
}> = ({ state, rank, occupe, onFermer, onDiagnostiquer, onOuvrirLigne }) => {
    const { line, outcome } = state;
    const s = STATUT[outcome.status];
    const voie = voieAction(state, rank);
    const conforme = outcome.status === 'vert';
    const fermerRef = useRef<HTMLButtonElement>(null);
    const bloc = HEALTH_BLOCKS.find((b) => b.id === line.bloc);
    const lienGuide = resolveGuideUrl(line.manual?.url, { supabaseUrl: SUPABASE_URL });

    useEffect(() => {
        fermerRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onFermer]);

    // Rendu dans document.body : les enveloppes de l'espace admin gardent un
    // `transform` identité après leur animation d'entrée (animate-fade-up), et
    // un ancêtre transformé devient le cadre de tout `position: fixed` — la
    // fiche se cadrait alors sur la boîte de l'onglet, pas sur la fenêtre
    // (relevé du banc SAT-6). Le portail rend la fenêtre au cadre.
    return createPortal(
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="titre-detail"
             data-testid="health-detail-drawer">
            <button className="absolute inset-0 bg-slate-900/40" onClick={onFermer} aria-label="Fermer la fiche" />
            <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl animate-fade-up">
                <div className={`px-5 py-4 border-b border-slate-200 ${s.fond}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${s.aplat} ${outcome.status === 'blanc' ? 'text-slate-800' : 'text-white'}`}>
                                    {s.mot}
                                </span>
                                <span className={`text-[10px] font-bold ${s.texte}`}>{s.label}</span>
                                {!conforme && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${RISQUE[line.risk].classe}`}>{RISQUE[line.risk].label}</span>
                                )}
                            </div>
                            <h3 id="titre-detail" className="text-base font-black text-slate-900 mt-1.5">{line.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {bloc?.title ?? line.bloc} · {PORTEE_LIBELLE[line.location]} · mesuré {depuis(outcome.ranAt)}
                            </p>
                        </div>
                        <button ref={fermerRef} onClick={onFermer}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <dl className="space-y-3">
                        <Rubrique titre="Problème">
                            <span className={`font-semibold ${conforme ? 'text-slate-700' : s.texte}`}>{outcome.measured}</span>
                            {outcome.gap && <span className="block text-slate-600 mt-0.5">Écart : {outcome.gap}</span>}
                            <span className="block text-xs text-slate-500 mt-1">Attendu : {line.expected}</span>
                        </Rubrique>
                        <Rubrique titre="Pourquoi ça compte">{line.why}</Rubrique>
                        {!conforme && <Rubrique titre="Cause probable">{line.cause}</Rubrique>}
                        {!conforme && <Rubrique titre="Impact">{line.impact}</Rubrique>}
                        {!conforme && (
                            <Rubrique titre="Niveau de risque">
                                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border ${RISQUE[line.risk].classe}`}>{RISQUE[line.risk].label}</span>
                                <span className="block text-xs text-slate-500 mt-1">
                                    Le niveau de risque qualifie le problème, écrit avant toute mesure ; la couleur vient du statut mesuré.
                                </span>
                            </Rubrique>
                        )}
                    </dl>

                    {outcome.probeError && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Pourquoi cette ligne n'est pas mesurée</div>
                            <p className="text-xs text-slate-600 font-mono break-words">{outcome.probeError}</p>
                        </div>
                    )}

                    {/* ── ACTION — une seule voie, dite sans détour ── */}
                    {voie.kind === 'reparer' && line.remediation && (
                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-800 mb-1.5">
                                <Wrench size={11} /> Réparation automatique disponible
                            </div>
                            <p className="text-sm font-bold text-slate-800">{line.remediation.label}</p>
                            <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">{line.remediation.consequence}</p>
                            <button onClick={() => onDiagnostiquer(state)} disabled={occupe}
                                    className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-black inline-flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">
                                {occupe ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
                                Réparer — diagnostic, puis confirmation
                            </button>
                            <p className="text-[10px] text-slate-500 font-semibold mt-2">
                                Le diagnostic précède toujours l'action : vous verrez le périmètre exact avant de confirmer. Sauvegarde, vérification et journal sont automatiques.
                            </p>
                        </div>
                    )}

                    {voie.kind === 'diagnostic' && line.remediation && (
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1.5">
                                <Lock size={11} /> Diagnostic seulement
                            </div>
                            <p className="text-sm font-bold text-slate-800">{line.remediation.label}</p>
                            <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                                Une réparation automatique existe pour ce contrôle. Le diagnostic montre exactement ce qu'elle ferait
                                — nombre d'éléments, tables, extrait réel — <strong>sans rien modifier</strong>. Son application est
                                réservée à l'Admin Général ; votre rang ({rank.role ?? 'inconnu'}) ne le permet pas encore.
                            </p>
                            <button onClick={() => onDiagnostiquer(state)} disabled={occupe}
                                    className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-black inline-flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">
                                {occupe ? <Loader2 size={15} className="animate-spin" /> : <Stethoscope size={15} />}
                                Lancer le diagnostic (lecture seule)
                            </button>
                            {line.id !== 'gouvernance.rang_admin_general' && (
                                <button onClick={() => onOuvrirLigne('gouvernance.rang_admin_general')}
                                        className="mt-2 w-full text-left text-[11px] font-bold text-amber-900 inline-flex items-center gap-1 hover:underline">
                                    <ChevronRight size={12} /> Pour activer Réparer : voir « Un Admin Général reconnu par la base »
                                </button>
                            )}
                        </div>
                    )}

                    {voie.kind === 'manuelle' && line.manual && (
                        <div className="border border-slate-300 bg-slate-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                <CircleHelp size={11} /> Action manuelle requise
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Aucune réparation automatique n'existe pour ce contrôle : {line.humanAction}
                            </p>
                            <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Où</div>
                                <p className="text-sm font-bold text-slate-800 mt-0.5">{line.manual.where}</p>
                                {lienGuide ? (
                                    <a href={lienGuide} target="_blank" rel="noopener noreferrer"
                                       className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-slate-800 text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                        <ExternalLink size={12} /> Ouvrir l'endroit exact
                                    </a>
                                ) : line.manual.url ? (
                                    <p className="text-[10px] text-slate-400 mt-1">Lien indisponible depuis cet environnement : suivre le chemin ci-dessus.</p>
                                ) : null}
                            </div>
                            <ol className="mt-3 space-y-2">
                                {line.manual.steps.map((etape, i) => (
                                    <li key={i} className="flex gap-2.5 text-xs text-slate-700 leading-relaxed">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                                        <span className="break-words min-w-0">{etape}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {voie.kind === 'recommandee' && line.recommendedAction && (
                        <div className="border border-slate-300 bg-slate-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                <ListChecks size={11} /> Action recommandée
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{line.recommendedAction}</p>
                        </div>
                    )}

                    {voie.kind === 'aucune' && conforme && !(line.id === 'gouvernance.rang_admin_general' && !rank.canRepair) && (
                        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3.5 flex items-start gap-2">
                            <ShieldCheck size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-900 leading-relaxed">
                                Conforme : il n'y a rien à faire.
                                {line.remediation ? ` La réparation « ${line.remediation.label} » reste disponible si ce contrôle se dégrade.` : ''}
                            </p>
                        </div>
                    )}

                    {/* Cas particulier assumé : la base peut reconnaître UN Admin Général
                        (ligne verte) sans que ce soit VOUS. La personne qui lit cette fiche
                        depuis « Mode : Diagnostic seulement » veut savoir comment activer
                        Réparer pour son propre compte : le guide reste visible. */}
                    {line.id === 'gouvernance.rang_admin_general' && conforme && !rank.canRepair && line.manual && (
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1.5">
                                <Lock size={11} /> Votre compte n'a pas ce rang
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                La base reconnaît un Admin Général, mais votre compte est « {rank.role ?? 'inconnu'} » : pour vous,
                                Réparer et Restaurer restent en diagnostic seulement. Pour activer le rang sur votre compte :
                            </p>
                            <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Où</div>
                                <p className="text-sm font-bold text-slate-800 mt-0.5">{line.manual.where}</p>
                                {lienGuide && (
                                    <a href={lienGuide} target="_blank" rel="noopener noreferrer"
                                       className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-slate-800 text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                                        <ExternalLink size={12} /> Ouvrir l'endroit exact
                                    </a>
                                )}
                            </div>
                            <ol className="mt-3 space-y-2">
                                {line.manual.steps.map((etape, i) => (
                                    <li key={i} className="flex gap-2.5 text-xs text-slate-700 leading-relaxed">
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                                        <span className="break-words min-w-0">{etape}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {outcome.evidence && Object.keys(outcome.evidence).length > 0 && (
                        <details className="border border-slate-200 rounded-lg">
                            <summary className="text-xs font-bold text-slate-600 cursor-pointer px-3 py-2 hover:bg-slate-50">Éléments mesurés</summary>
                            <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-3 overflow-x-auto max-h-56 border-t border-slate-200">
{JSON.stringify(outcome.evidence, null, 2)}
                            </pre>
                        </details>
                    )}

                    <p className="text-[10px] text-slate-400 font-mono">{line.id} · poids {line.weight} / 100 dans son domaine technique</p>
                </div>
            </div>
        </div>,
        document.body,
    );
};

// ─────────────────────────── Modale de confirmation ───────────────────────────

interface ConfirmState { line: HealthLineState; plan: DiagnosisPlan; }

const ModaleConfirmation: React.FC<{
    state: ConfirmState;
    occupe: boolean;
    onAnnuler: () => void;
    onConfirmer: () => void;
}> = ({ state, occupe, onAnnuler, onConfirmer }) => {
    const [accepte, setAccepte] = useState(false);
    const { line, plan } = state;
    const remediation = line.line.remediation!;
    const rienAFaire = plan.affectedCount === 0;
    const sansJeton = !plan.confirmationToken;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !occupe) onAnnuler(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onAnnuler, occupe]);

    // Même portail que la fiche : hors de l'arbre transformé de l'espace
    // admin, la modale se centre sur la fenêtre et non sur l'onglet.
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
             role="dialog" aria-modal="true" aria-labelledby="titre-confirmation"
             data-testid="health-confirm-modal">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-full overflow-y-auto">
                <div className={`px-5 py-4 border-b border-slate-200 ${sansJeton ? 'bg-amber-50' : 'bg-orange-50'}`}>
                    <div className={`flex items-center gap-2 ${sansJeton ? 'text-amber-800' : 'text-orange-700'}`}>
                        {sansJeton ? <Lock size={16} /> : <AlertTriangle size={16} />}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {sansJeton ? 'Diagnostic seulement — lecture seule' : 'Confirmation requise'}
                        </span>
                    </div>
                    <h3 id="titre-confirmation" className="text-lg font-black text-slate-900 mt-1">{remediation.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{line.line.title}</p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Éléments concernés</div>
                            <div className="text-3xl font-black text-slate-900 mt-0.5 tabular-nums">{plan.affectedCount}</div>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tables touchées</div>
                            <div className="text-xs font-mono text-slate-700 mt-1.5 break-words">
                                {plan.affectedTables?.length ? plan.affectedTables.join(', ') : '—'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Ce qui va se passer</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{remediation.consequence}</p>
                    </div>

                    {plan.sample?.length > 0 && (
                        <details className="border border-slate-200 rounded-xl">
                            <summary className="text-xs font-bold text-slate-600 cursor-pointer px-3 py-2 hover:bg-slate-50">
                                Extrait réel des éléments concernés ({plan.sample.length} affiché(s))
                            </summary>
                            <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-3 overflow-x-auto max-h-44 border-t border-slate-200">
{JSON.stringify(plan.sample, null, 2)}
                            </pre>
                        </details>
                    )}

                    <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-900 leading-relaxed">
                            Une <strong>sauvegarde</strong> est prise avant toute modification, dans la même
                            transaction : il est impossible d'obtenir un changement sans elle. L'action est
                            <strong> restaurable</strong> depuis le journal, et une <strong>vérification</strong>
                            {' '}est rejouée juste après.
                        </p>
                    </div>

                    {rienAFaire && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            Aucun élément ne correspond actuellement : il n'y a rien à corriger.
                        </p>
                    )}

                    {sansJeton && !rienAFaire && (
                        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
                            <strong>Diagnostic seulement.</strong> Ce plan est exact et n'a rien modifié. Votre rang
                            ne permet pas de l'appliquer : la réparation est réservée à l'Admin Général.
                        </p>
                    )}

                    {!rienAFaire && !sansJeton && (
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)}
                                   className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
                            <span className="text-sm text-slate-700">
                                Je confirme cette action sur <strong>{plan.affectedCount} élément(s)</strong> et
                                j'en assume l'effet en production.
                            </span>
                        </label>
                    )}
                </div>

                <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
                    <button onClick={onAnnuler} disabled={occupe}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                        Annuler
                    </button>
                    {!sansJeton && (
                        <button onClick={onConfirmer} disabled={occupe || !accepte || rienAFaire}
                                className="px-4 py-2 rounded-xl text-sm font-black text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2">
                            {occupe ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
                            Appliquer la réparation
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

// ─────────────────────────── Journal ───────────────────────────

// Quatre natures d'entrée, quatre mots : une réparation, une restauration,
// une réparation automatique (cron) et un geste de SECOURS (SAT-6) ne se
// lisent pas de la même façon.
const LIBELLE_ACTION: Record<string, { texte: string; classe: string }> = {
    'health.repair':      { texte: 'Réparation',             classe: 'bg-blue-50 text-blue-700' },
    'health.restore':     { texte: 'Restauration',           classe: 'bg-slate-100 text-slate-600' },
    'health.auto_repair': { texte: 'Réparation automatique', classe: 'bg-emerald-50 text-emerald-700' },
    'health.emergency':   { texte: 'Secours',                classe: 'bg-red-50 text-red-700' },
};

// ─────────────────────────── Onglet ───────────────────────────

export const AdminHealthTab: React.FC = () => {
    const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);
    const [succes, setSucces] = useState<string | null>(null);

    const [filtres, setFiltres] = useState<Set<HealthStatus>>(new Set());
    const [recherche, setRecherche] = useState('');

    const [selection, setSelection] = useState<HealthLineState | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmState | null>(null);
    const [occupe, setOccupe] = useState(false);
    const [journal, setJournal] = useState<HealthJournalEntry[]>([]);

    const mesurer = useCallback(async () => {
        setChargement(true);
        setErreur(null);
        try {
            setSnapshot(await runHealthCheck());
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setChargement(false);
        }
    }, []);

    const rafraichirJournal = useCallback(async () => {
        try { setJournal(await loadJournal(25)); } catch { setJournal([]); }
    }, []);

    useEffect(() => { void mesurer(); void rafraichirJournal(); }, [mesurer, rafraichirJournal]);

    const lancerDiagnostic = useCallback(async (state: HealthLineState) => {
        if (!state.line.remediation) return;
        setOccupe(true);
        setErreur(null);
        try {
            const plan = await diagnose(state.line.id, state.line.remediation.id);
            setConfirmation({ line: state, plan });
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setOccupe(false);
        }
    }, []);

    const appliquer = useCallback(async () => {
        if (!confirmation?.plan.confirmationToken) return;
        setOccupe(true);
        setErreur(null);
        try {
            const r = await repair(confirmation.line.line.id, confirmation.plan.remediationId, confirmation.plan.confirmationToken);
            setSucces(`${r.message} Vérification : ${r.verification?.measured ?? 'non concluante'}`);
            setConfirmation(null);
            setSelection(null);
            await Promise.all([mesurer(), rafraichirJournal()]);
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setOccupe(false);
        }
    }, [confirmation, mesurer, rafraichirJournal]);

    const restaurer = useCallback(async (entry: HealthJournalEntry) => {
        if (!entry.snapshotId || !entry.lineId) return;
        setOccupe(true);
        setErreur(null);
        try {
            const r = await restore(entry.lineId, entry.snapshotId);
            setSucces(`${r.message} Vérification : ${r.verification?.measured ?? 'non concluante'}`);
            await Promise.all([mesurer(), rafraichirJournal()]);
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setOccupe(false);
        }
    }, [mesurer, rafraichirJournal]);

    const report = snapshot?.report;
    const rank = snapshot?.rank ?? { role: null, canRead: false, canRepair: false };
    const securite = useMemo(() => (report ? buildSecurityReport(report) : null), [report]);

    const toutesLignes = useMemo(() => (report ? report.blocks.flatMap((b) => b.lines) : []), [report]);
    const parId = useMemo(() => new Map(toutesLignes.map((l) => [l.line.id, l])), [toutesLignes]);

    const ouvrirLigne = useCallback((id: string) => {
        const cible = parId.get(id);
        if (cible) setSelection(cible);
    }, [parId]);

    const allerAuBloc = useCallback((id: HealthBlockId) => {
        document.getElementById(`bloc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const filtreActif = filtres.size > 0 || recherche.trim() !== '';
    const q = recherche.trim().toLowerCase();
    const estVisible = useCallback((state: HealthLineState) => {
        if (filtres.size > 0 && !filtres.has(state.outcome.status)) return false;
        if (!q) return true;
        return state.line.title.toLowerCase().includes(q)
            || state.line.id.toLowerCase().includes(q)
            || state.outcome.measured.toLowerCase().includes(q);
    }, [filtres, q]);

    const basculerFiltre = (st: HealthStatus) => setFiltres((prev) => {
        const suivant = new Set(prev);
        if (suivant.has(st)) suivant.delete(st); else suivant.add(st);
        return suivant;
    });
    const reinitialiser = () => { setFiltres(new Set()); setRecherche(''); };

    const aReparer = useMemo(() => toutesLignes.filter((l) => l.line.remediation && (l.outcome.status === 'rouge' || l.outcome.status === 'orange')).length, [toutesLignes]);
    const aFaireALaMain = useMemo(() => toutesLignes.filter((l) => !l.line.remediation && (l.outcome.status === 'rouge' || l.outcome.status === 'orange')).length, [toutesLignes]);

    if (chargement && !snapshot) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 size={30} className="animate-spin mb-3" />
                <p className="text-sm font-semibold">Analyse de MokNet en cours…</p>
                <p className="text-xs text-slate-400 mt-1">{HEALTH_LINES.length} contrôles · {HEALTH_BLOCKS.length} domaines · santé et sécurité</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-up">

            {/* ── BARRE DE COMMANDEMENT ─────────────────────────────────── */}
            <div className="rounded-2xl bg-slate-900 text-white overflow-hidden shadow-sm">
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center gap-5">
                    {report && securite && (
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <AnneauScore score={report.score} coverage={report.coverage} status={report.status} libelle="SANTÉ" ariaSujet="Santé" />
                            <AnneauScore score={securite.score} coverage={securite.coverage} status={securite.status} libelle="SÉCURITÉ" ariaSujet="Sécurité" />
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-600 rounded text-[10px] font-black uppercase tracking-wider">Santé Globale</span>
                            <span className="text-xs text-slate-400 font-mono">analysé {depuis(report?.generatedAt)}</span>
                        </div>

                        {report && (
                            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider ${STATUT[report.status].aplat} ${report.status === 'blanc' ? 'text-slate-900' : 'text-white'}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${report.status === 'blanc' ? 'bg-slate-600' : 'bg-white/90'}`} aria-hidden="true" />
                                    {STATUT[report.status].mot}
                                </span>
                                <span className="text-sm font-bold text-slate-200">{STATUT[report.status].label}</span>
                            </div>
                        )}
                        <h2 className="text-2xl font-black mt-1.5 flex items-center gap-2">
                            <Activity size={22} className="text-blue-400 shrink-0" />
                            {report && isCertifiable(report) ? 'État certifiable' : 'État non certifiable'}
                        </h2>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                            {report ? verdictSentence(report) : 'Aucune mesure disponible.'}
                        </p>

                        {report && securite && (
                            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Santé globale</div>
                                    <div className="text-lg font-black tabular-nums">
                                        {pct(report.score)}<span className="text-xs text-slate-400 font-semibold"> sur ce qui est mesuré</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sécurité</div>
                                    <div className="text-lg font-black tabular-nums">
                                        {pct(securite.score)}<span className="text-xs text-slate-400 font-semibold"> aujourd'hui · audit du {securite.reference.dateLabel} : {securite.reference.score} %</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Périmètre mesuré</div>
                                    <div className="text-lg font-black tabular-nums text-blue-300">
                                        {Math.round(report.coverage * 100)} %<span className="text-xs text-slate-400 font-semibold"> des {toutesLignes.length} contrôles, en poids</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">À traiter</div>
                                    <div className="text-lg font-black tabular-nums">
                                        {report.tally.rouge + report.tally.orange}
                                        <span className="text-xs text-slate-400 font-semibold"> · {aReparer} réparable{aReparer > 1 ? 's' : ''} automatiquement · {aFaireALaMain} à traiter à la main</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-stretch gap-2 shrink-0 w-full lg:w-auto">
                        <button onClick={() => void mesurer()} disabled={chargement}
                                className="px-4 py-2.5 rounded-xl text-sm font-black bg-blue-600 hover:bg-blue-500 disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                            {chargement ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                            {chargement ? 'Analyse en cours…' : "Relancer l'analyse"}
                        </button>
                        <span className={`text-[11px] font-black text-center px-2.5 py-1.5 rounded-lg inline-flex items-center justify-center gap-1.5 ${
                            rank.canRepair ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        }`}>
                            {rank.canRepair ? <Wrench size={12} /> : <Lock size={12} />}
                            {rank.canRepair ? 'Mode : Réparation activée' : 'Mode : Diagnostic seulement'}
                        </span>
                        {!rank.canRepair && (
                            <button onClick={() => ouvrirLigne('gouvernance.rang_admin_general')}
                                    className="text-[10px] text-slate-400 hover:text-white text-center leading-tight max-w-[16rem] underline-offset-2 hover:underline">
                                Votre rang ({rank.role ?? 'inconnu'}) permet de mesurer et de diagnostiquer. Réparer et restaurer exigent
                                le rang Admin Général — voir comment l'activer.
                            </button>
                        )}
                    </div>
                </div>

                {/* Compteurs = FILTRES. Cliquer restreint les cartes affichées. */}
                {report && (
                    <div className="border-t border-slate-800 px-5 sm:px-6 py-3 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-1 inline-flex items-center gap-1">
                            <Filter size={11} /> Filtrer
                        </span>
                        {ORDRE_STATUTS.map((st) => {
                            const actif = filtres.has(st);
                            return (
                                <button key={st} onClick={() => basculerFiltre(st)} aria-pressed={actif}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                            actif ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}>
                                    <span className={`w-2 h-2 rounded-full ${STATUT[st].aplat}`} />
                                    <span className="tabular-nums">{report.tally[st]}</span>
                                    {STATUT[st].court}
                                </button>
                            );
                        })}
                        <div className="relative ml-auto">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
                                   placeholder="Rechercher un contrôle…" aria-label="Rechercher un contrôle"
                                   className="pl-8 pr-3 py-1.5 w-44 sm:w-60 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        {filtreActif && (
                            <button onClick={reinitialiser} className="text-xs font-bold text-slate-400 hover:text-white inline-flex items-center gap-1">
                                <X size={12} /> Tout afficher
                            </button>
                        )}
                    </div>
                )}
            </div>

            {snapshot?.serverError && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-2.5">
                    <CircleHelp size={17} className="text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700">Sondes serveur indisponibles</p>
                        <p className="text-xs text-slate-600 mt-0.5 break-words">
                            {snapshot.serverError} — les lignes concernées restent <strong>non mesurées</strong>, elles ne sont pas comptées comme conformes.
                        </p>
                    </div>
                </div>
            )}

            {erreur && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2.5">
                    <XCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-red-800">Action refusée</p>
                        <p className="text-xs text-red-700 mt-0.5 break-words">{erreur}</p>
                    </div>
                    <button onClick={() => setErreur(null)} className="text-red-400 hover:text-red-600 shrink-0"><X size={15} /></button>
                </div>
            )}

            {succes && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2.5">
                    <ShieldCheck size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-900">Action terminée et vérifiée</p>
                        <p className="text-xs text-emerald-800 mt-0.5 break-words">{succes}</p>
                    </div>
                    <button onClick={() => setSucces(null)} className="text-emerald-500 hover:text-emerald-700 shrink-0"><X size={15} /></button>
                </div>
            )}

            {/* ── GRAPHIQUES ────────────────────────────────────────────── */}
            {report && securite && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <GraphiqueBlocs blocks={report.blocks} onAller={allerAuBloc} />
                    <GraphiqueSecurite securite={securite} />
                    <GraphiqueVagues securite={securite} onOuvrirLigne={ouvrirLigne} />
                </div>
            )}

            {/* ── LES SEPT DOMAINES, TROIS BLOCS DE COULEUR CHACUN ──────── */}
            {report && report.blocks.map((bloc) => (
                <SectionBloc key={bloc.block.id} bloc={bloc} visibles={bloc.lines.filter(estVisible)}
                             rank={rank} filtreActif={filtreActif} onOuvrir={setSelection} />
            ))}

            {/* ── SECOURS DU DIRECT (SAT-6) ─────────────────────────────── */}
            <LiveEmergencyPanel rank={rank} onJournalChanged={() => void rafraichirJournal()} />

            {/* ── JOURNAL ───────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <ClipboardList size={15} className="text-slate-400" />
                    <h3 className="text-sm font-black text-slate-900">Journal des actions</h3>
                    <span className="text-[11px] text-slate-400">qui, quoi, quand, restaurable ou non</span>
                </div>

                {journal.length === 0 ? (
                    <p className="px-4 py-8 text-xs text-slate-400 text-center">
                        Aucune action enregistrée. Chaque réparation — manuelle ou automatique — et chaque restauration apparaîtra ici, avec son auteur et sa sauvegarde.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {journal.map((entry) => {
                            const libelle = LIBELLE_ACTION[entry.action] ?? { texte: entry.action, classe: 'bg-slate-100 text-slate-600' };
                            const auteur = entry.actorName ?? (entry.action === 'health.auto_repair' ? 'la base (tâche planifiée)' : null);
                            return (
                                <div key={entry.id} className="px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${libelle.classe}`}>{libelle.texte}</span>
                                    {entry.action === 'health.emergency' ? (
                                        // Un geste de secours ne vise aucune ligne du registre : le libellé
                                        // vient du geste lui-même (Relancer / Clore), jamais d'un id brut.
                                        <span className="font-mono text-slate-500 truncate max-w-[16rem]">
                                            {emergencyJournalLabel(entry.remediationId)}
                                        </span>
                                    ) : (
                                        <button onClick={() => entry.lineId && ouvrirLigne(entry.lineId)}
                                                className="font-mono text-slate-500 truncate max-w-[16rem] hover:text-blue-700 hover:underline text-left">
                                            {parId.get(entry.lineId ?? '')?.line.title ?? entry.lineId}
                                        </button>
                                    )}
                                    <span className="text-slate-600 tabular-nums">{entry.changedCount ?? 0} élément(s)</span>
                                    {auteur && <span className="text-slate-500">{auteur}</span>}
                                    <span className="text-[10px] text-slate-400 font-mono">{depuis(entry.createdAt)}</span>
                                    {entry.statusAfter && (
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${STATUT[entry.statusAfter].texte}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${STATUT[entry.statusAfter].aplat}`} />
                                            {STATUT[entry.statusAfter].court} après
                                        </span>
                                    )}
                                    <span className="flex-1" />
                                    {entry.restorable && entry.action === 'health.repair' && rank.canRepair ? (
                                        <button onClick={() => void restaurer(entry)} disabled={occupe}
                                                className="px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1.5">
                                            <Undo2 size={11} /> Restaurer
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-slate-400">
                                            {entry.action === 'health.auto_repair'
                                                ? 'appliquée par la base, sans clic'
                                                : entry.action === 'health.emergency'
                                                    ? 'geste de secours, sans sauvegarde : non restaurable'
                                                    : entry.restorable ? "restauration réservée à l'Admin Général" : 'sauvegarde déjà restaurée ou purgée'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selection && (
                <FicheProbleme state={selection} rank={rank} occupe={occupe}
                               onFermer={() => setSelection(null)} onDiagnostiquer={lancerDiagnostic} onOuvrirLigne={ouvrirLigne} />
            )}

            {confirmation && (
                <ModaleConfirmation state={confirmation} occupe={occupe}
                                    onAnnuler={() => setConfirmation(null)} onConfirmer={() => void appliquer()} />
            )}
        </div>
    );
};
