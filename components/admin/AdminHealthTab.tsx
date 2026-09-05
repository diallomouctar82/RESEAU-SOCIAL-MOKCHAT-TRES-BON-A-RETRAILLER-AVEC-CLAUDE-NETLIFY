import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity, AlertTriangle, ArrowUpDown, CircleHelp, ClipboardList, Filter,
    Loader2, Lock, RefreshCw, Search, ShieldCheck, Stethoscope, Undo2, Wrench, X, XCircle,
} from 'lucide-react';
import {
    DiagnosisPlan, HealthDomainId, HealthJournalEntry, HealthLineState, HealthStatus,
} from '../../services/health/healthTypes';
import { isCertifiable, verdictSentence } from '../../services/health/healthScore';
import { HEALTH_LINES } from '../../services/health/healthRegistry';
import {
    HealthRank, HealthSnapshot, diagnose, loadJournal, repair, restore, runHealthCheck,
} from '../../services/health/healthService';
import { emergencyJournalLabel } from '../../services/health/liveEmergency';
import { LiveEmergencyPanel } from './LiveEmergencyPanel';

/**
 * Santé Globale — console d'exploitation de MokNet.
 *
 * QUI S'EN SERT : l'Admin Général et les administrateurs. Pas des
 * développeurs : des responsables qui doivent savoir en quelques secondes si
 * la plateforme va bien, ce qui ne va pas, et quoi faire.
 *
 * HIÉRARCHIE VOULUE, dans cet ordre exact :
 *   1. le verdict global — vu en premier, sans avoir à lire ;
 *   2. la matrice des 12 domaines — où ça fait mal, d'un coup d'œil ;
 *   3. la file de travail filtrable — 52 lignes qui se balaient, pas qui se lisent ;
 *   4. le détail d'une ligne, à la demande, dans un panneau ;
 *   5. le journal des actions.
 *
 * CE QUE LA PREMIÈRE VERSION RATAIT (corrigé ici) : 52 lignes empilées en
 * accordéons ne se balaient pas ; des compteurs de statut décoratifs ne
 * servent à rien tant qu'ils ne filtrent pas ; et un score sans horodatage
 * ne dit pas s'il est encore d'actualité.
 *
 * TROIS RÈGLES TENUES :
 *   • Aucun faux vert — une ligne non mesurée est BLANCHE, et le score ne
 *     s'affiche jamais sans sa couverture.
 *   • Aucun bouton qui ne peut pas aboutir — réparer et restaurer n'existent
 *     que pour l'Admin Général.
 *   • Aucune action sans son périmètre montré d'abord.
 */

// ─────────────────────────── Vocabulaire visuel ───────────────────────────
//
// Une seule table de vérité pour la gravité : la couleur, le libellé et le
// poids d'affichage en sortent tous. Sans elle, chaque bloc réinventait sa
// nuance et l'écran perdait sa lisibilité.

interface StatutStyle {
    label: string;
    court: string;
    /** Aplat de la pastille et de la barre de gravité. */
    aplat: string;
    texte: string;
    fond: string;
    bord: string;
    /** Teinte de rangée, pour que la gravité se voie sans lire. */
    rangee: string;
    rang: number;
    /** Le mot affiché sur chaque ligne et dans le badge global : lisible sans légende. */
    mot: string;
}

const STATUT: Record<HealthStatus, StatutStyle> = {
    rouge:  { label: 'Non conforme', court: 'Rouge',  aplat: 'bg-red-600',     texte: 'text-red-700',     fond: 'bg-red-50',     bord: 'border-red-200',     rangee: 'bg-red-50/40',     rang: 0, mot: 'ROUGE' },
    orange: { label: 'À corriger',   court: 'Orange', aplat: 'bg-orange-500',  texte: 'text-orange-700',  fond: 'bg-orange-50',  bord: 'border-orange-200',  rangee: 'bg-orange-50/40',  rang: 1, mot: 'ORANGE' },
    blanc:  { label: 'Non éprouvé',  court: 'Blanc',  aplat: 'bg-slate-300',   texte: 'text-slate-600',   fond: 'bg-slate-100',  bord: 'border-slate-200',   rangee: '',                 rang: 2, mot: 'NON MESURÉ' },
    jaune:  { label: 'En attente',   court: 'Jaune',  aplat: 'bg-amber-400',   texte: 'text-amber-700',   fond: 'bg-amber-50',   bord: 'border-amber-200',   rangee: '',                 rang: 3, mot: 'JAUNE' },
    vert:   { label: 'Conforme',     court: 'Vert',   aplat: 'bg-emerald-500', texte: 'text-emerald-700', fond: 'bg-emerald-50', bord: 'border-emerald-200', rangee: '',                 rang: 4, mot: 'VERT' },
};

const ORDRE_STATUTS: HealthStatus[] = ['rouge', 'orange', 'blanc', 'jaune', 'vert'];

const PORTEE_LIBELLE: Record<string, string> = {
    serveur: 'Serveur',
    client: 'Navigateur',
    humain: 'Humain',
};

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

// ─────────────────────────── Anneau de score ───────────────────────────

/**
 * Deux anneaux concentriques : la NOTE à l'extérieur, la COUVERTURE à
 * l'intérieur. Les deux chiffres voyagent toujours ensemble — un score seul
 * laisserait croire que tout a été contrôlé.
 */
const AnneauScore: React.FC<{ score: number | null; coverage: number; status: HealthStatus }> = ({
    score, coverage, status,
}) => {
    const R_NOTE = 54;
    const R_COUV = 40;
    const cNote = 2 * Math.PI * R_NOTE;
    const cCouv = 2 * Math.PI * R_COUV;
    const partNote = score === null ? 0 : (score / 100) * cNote;
    const partCouv = coverage * cCouv;
    const couleur = status === 'vert' ? '#10b981'
        : status === 'orange' ? '#f97316'
        : status === 'rouge' ? '#dc2626'
        : status === 'jaune' ? '#f59e0b' : '#cbd5e1';

    return (
        <svg viewBox="0 0 140 140" className="w-[132px] h-[132px] shrink-0" role="img"
             aria-label={score === null
                 ? 'Santé indisponible, aucune ligne mesurée'
                 : `Santé ${Math.round(score)} %, sur ${Math.round(coverage * 100)} % du périmètre mesuré`}>
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
                {score === null ? 'NON MESURÉ' : 'SANTÉ MESURÉE'}
            </text>
        </svg>
    );
};

// ─────────────────────────── Tuile de domaine ───────────────────────────

const TuileDomaine: React.FC<{
    id: HealthDomainId;
    titre: string;
    poids: number;
    score: number | null;
    coverage: number;
    status: HealthStatus;
    repartition: Record<HealthStatus, number>;
    actif: boolean;
    onClick: () => void;
}> = ({ titre, poids, score, coverage, status, repartition, actif, onClick }) => {
    const s = STATUT[status];
    const total = ORDRE_STATUTS.reduce((n, st) => n + repartition[st], 0);

    return (
        <button
            onClick={onClick}
            aria-pressed={actif}
            className={`text-left rounded-xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                actif
                    ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 leading-tight">{titre}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${s.aplat}`} aria-hidden="true" />
            </div>

            <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">
                    {score === null ? '—' : `${Math.round(score)} %`}
                </span>
                {score === null && <span className="text-[10px] text-slate-400 font-semibold">non mesuré</span>}
                <span className="ml-auto text-[10px] text-slate-400 font-mono" title="Poids du domaine dans la santé globale">poids {poids}</span>
            </div>

            {/* Répartition des lignes par gravité : la forme se lit sans chiffre. */}
            <div className="flex gap-px h-1.5 mt-2 rounded-full overflow-hidden bg-slate-100">
                {ORDRE_STATUTS.map((st) => repartition[st] > 0 && (
                    <span key={st} className={STATUT[st].aplat}
                          style={{ width: `${(repartition[st] / Math.max(total, 1)) * 100}%` }} />
                ))}
            </div>

            <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                couverture {Math.round(coverage * 100)} %
            </div>
        </button>
    );
};

// ─────────────────────────── Panneau de détail ───────────────────────────

const PanneauDetail: React.FC<{
    state: HealthLineState;
    rank: HealthRank;
    occupe: boolean;
    onFermer: () => void;
    onDiagnostiquer: (s: HealthLineState) => void;
}> = ({ state, rank, occupe, onFermer, onDiagnostiquer }) => {
    const { line, outcome } = state;
    const s = STATUT[outcome.status];
    const aBesoinAction = outcome.status === 'orange' || outcome.status === 'rouge';
    const fermerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        fermerRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onFermer]);

    // Rendu dans document.body : les enveloppes de l'espace admin gardent un
    // `transform` identité après leur animation d'entrée (animate-fade-up), et
    // un ancêtre transformé devient le cadre de tout `position: fixed` — le
    // panneau se cadrait alors sur la boîte de l'onglet, pas sur la fenêtre
    // (relevé du banc SAT-6, passe 1). Le portail rend la fenêtre au cadre.
    return createPortal(
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true"
             aria-labelledby="titre-detail" data-testid="health-detail-drawer">
            <button className="absolute inset-0 bg-slate-900/40" onClick={onFermer} aria-label="Fermer le détail" />
            <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl animate-fade-up">
                <div className={`px-5 py-4 border-b border-slate-200 ${s.fond}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${s.texte}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${s.aplat}`} />
                                    {s.label}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{line.id}</span>
                            </div>
                            <h3 id="titre-detail" className="text-base font-black text-slate-900 mt-1.5">
                                {line.title}
                            </h3>
                        </div>
                        <button ref={fermerRef} onClick={onFermer}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">{line.why}</p>

                    <dl className="space-y-2.5">
                        <div>
                            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Attendu</dt>
                            <dd className="text-sm text-slate-700 mt-0.5">{line.expected}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Obtenu</dt>
                            <dd className={`text-sm font-semibold mt-0.5 ${s.texte}`}>{outcome.measured}</dd>
                        </div>
                        {outcome.gap && (
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Écart</dt>
                                <dd className="text-sm text-slate-700 mt-0.5">{outcome.gap}</dd>
                            </div>
                        )}
                        <div className="flex gap-6 pt-1">
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mesuré</dt>
                                <dd className="text-sm text-slate-700 mt-0.5">{depuis(outcome.ranAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Portée</dt>
                                <dd className="text-sm text-slate-700 mt-0.5">{PORTEE_LIBELLE[line.location]}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">Poids</dt>
                                <dd className="text-sm text-slate-700 mt-0.5 tabular-nums">{line.weight} / 100</dd>
                            </div>
                        </div>
                    </dl>

                    {outcome.probeError && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Pourquoi cette ligne n'est pas mesurée
                            </div>
                            <p className="text-xs text-slate-600 font-mono break-words">{outcome.probeError}</p>
                        </div>
                    )}

                    {outcome.evidence && Object.keys(outcome.evidence).length > 0 && (
                        <details className="border border-slate-200 rounded-lg">
                            <summary className="text-xs font-bold text-slate-600 cursor-pointer px-3 py-2 hover:bg-slate-50">
                                Éléments mesurés
                            </summary>
                            <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-3 overflow-x-auto max-h-56 border-t border-slate-200">
{JSON.stringify(outcome.evidence, null, 2)}
                            </pre>
                        </details>
                    )}

                    {line.humanAction && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                                <CircleHelp size={12} /> Action humaine requise
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{line.humanAction}</p>
                        </div>
                    )}

                    {/* Ce que cette ligne PEUT faire, dit en toutes lettres. Un bouton
                        grisé laisse croire qu'une réparation existe pour vous : il n'en
                        est rien tant que le rang ne le permet pas. On l'écrit. */}
                    {line.remediation && aBesoinAction && !rank.canRepair && (
                        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1.5">
                                <Lock size={11} /> Diagnostic seulement
                            </div>
                            <p className="text-sm font-bold text-slate-800">{line.remediation.label}</p>
                            <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                                Le diagnostic montre exactement ce que cette réparation ferait — nombre d'éléments,
                                tables, extrait réel — <strong>sans rien modifier</strong>. L'application est
                                réservée à l'Admin Général ; votre rang ({rank.role ?? 'inconnu'}) ne le permet pas.
                            </p>
                            <button
                                onClick={() => onDiagnostiquer(state)}
                                disabled={occupe}
                                className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-black inline-flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                            >
                                {occupe ? <Loader2 size={15} className="animate-spin" /> : <Stethoscope size={15} />}
                                Lancer le diagnostic (lecture seule)
                            </button>
                        </div>
                    )}

                    {line.remediation && aBesoinAction && rank.canRepair && (
                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-800 mb-1.5">
                                <Wrench size={11} /> Réparation disponible
                            </div>
                            <p className="text-sm font-bold text-slate-800">{line.remediation.label}</p>
                            <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                                {line.remediation.consequence}
                            </p>
                            <button
                                onClick={() => onDiagnostiquer(state)}
                                disabled={occupe}
                                className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-black inline-flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                            >
                                {occupe ? <Loader2 size={15} className="animate-spin" /> : <Stethoscope size={15} />}
                                Diagnostiquer, puis réparer
                            </button>
                            <p className="text-[10px] text-slate-500 font-semibold mt-2">
                                Le diagnostic précède toujours l'action : vous verrez le périmètre exact avant de confirmer.
                            </p>
                        </div>
                    )}

                    {line.remediation && !aBesoinAction && (
                        <div className="border border-slate-200 rounded-lg p-3.5">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                Réparation disponible
                            </div>
                            <p className="text-sm font-bold text-slate-800">{line.remediation.label}</p>
                            <p className="text-xs text-slate-400 mt-2">Cette ligne est conforme : il n'y a rien à réparer.</p>
                        </div>
                    )}

                    {!line.remediation && aBesoinAction && (
                        <div className="border border-slate-200 bg-slate-50 rounded-lg p-3.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                                <Stethoscope size={11} /> Diagnostic seulement
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Aucune réparation automatique n'existe pour ce contrôle : ce tableau le mesure et
                                l'explique, la correction se fait à la main.
                                {line.humanAction ? ' La marche à suivre est indiquée ci-dessus.' : ''}
                            </p>
                        </div>
                    )}
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

    // Même portail que le panneau de détail : hors de l'arbre transformé de
    // l'espace admin, la modale se centre sur la fenêtre et non sur l'onglet.
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
                    <h3 id="titre-confirmation" className="text-lg font-black text-slate-900 mt-1">
                        {remediation.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{line.line.title}</p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Éléments concernés
                            </div>
                            <div className="text-3xl font-black text-slate-900 mt-0.5 tabular-nums">
                                {plan.affectedCount}
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Tables touchées
                            </div>
                            <div className="text-xs font-mono text-slate-700 mt-1.5 break-words">
                                {plan.affectedTables?.length ? plan.affectedTables.join(', ') : '—'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Ce qui va se passer
                        </div>
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

// ─────────────────────────── Onglet ───────────────────────────

type Tri = 'gravite' | 'poids' | 'domaine';

export const AdminHealthTab: React.FC = () => {
    const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);
    const [succes, setSucces] = useState<string | null>(null);

    const [filtres, setFiltres] = useState<Set<HealthStatus>>(new Set());
    const [domaine, setDomaine] = useState<HealthDomainId | null>(null);
    const [recherche, setRecherche] = useState('');
    const [tri, setTri] = useState<Tri>('gravite');

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
            const r = await repair(
                confirmation.line.line.id,
                confirmation.plan.remediationId,
                confirmation.plan.confirmationToken,
            );
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

    /** Toutes les lignes, à plat, avec le poids réel de chacune dans la note. */
    const toutesLignes = useMemo(() => {
        if (!report) return [] as { state: HealthLineState; poidsReel: number; domaineTitre: string }[];
        return report.domains.flatMap((d) => d.lines.map((state) => ({
            state,
            poidsReel: (d.domain.weight * state.line.weight) / 100,
            domaineTitre: d.domain.title,
        })));
    }, [report]);

    const lignesFiltrees = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        const filtrees = toutesLignes.filter(({ state, domaineTitre }) => {
            if (filtres.size > 0 && !filtres.has(state.outcome.status)) return false;
            if (domaine && state.line.domain !== domaine) return false;
            if (!q) return true;
            return (
                state.line.title.toLowerCase().includes(q)
                || state.line.id.toLowerCase().includes(q)
                || state.outcome.measured.toLowerCase().includes(q)
                || domaineTitre.toLowerCase().includes(q)
            );
        });
        return filtrees.sort((a, b) => {
            if (tri === 'poids') return b.poidsReel - a.poidsReel;
            if (tri === 'domaine') return a.domaineTitre.localeCompare(b.domaineTitre, 'fr');
            const parGravite = STATUT[a.state.outcome.status].rang - STATUT[b.state.outcome.status].rang;
            return parGravite !== 0 ? parGravite : b.poidsReel - a.poidsReel;
        });
    }, [toutesLignes, filtres, domaine, recherche, tri]);

    const basculerFiltre = (st: HealthStatus) => setFiltres((prev) => {
        const suivant = new Set(prev);
        if (suivant.has(st)) suivant.delete(st); else suivant.add(st);
        return suivant;
    });

    const filtreActif = filtres.size > 0 || domaine !== null || recherche.trim() !== '';
    const reinitialiser = () => { setFiltres(new Set()); setDomaine(null); setRecherche(''); };

    if (chargement && !snapshot) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 size={30} className="animate-spin mb-3" />
                <p className="text-sm font-semibold">Mesure de la santé de MokNet…</p>
                <p className="text-xs text-slate-400 mt-1">{HEALTH_LINES.length} contrôles sur 12 domaines</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-up">

            {/* ── BARRE DE COMMANDEMENT ─────────────────────────────────── */}
            <div className="rounded-2xl bg-slate-900 text-white overflow-hidden shadow-sm">
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center gap-5">
                    {report && (
                        <AnneauScore score={report.score} coverage={report.coverage} status={report.status} />
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-600 rounded text-[10px] font-black uppercase tracking-wider">
                                Santé Globale
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                mesuré {depuis(report?.generatedAt)}
                            </span>
                        </div>

                        {/* Le statut global, en MOT et en COULEUR pleine — lisible sans légende. */}
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

                        {/* Deux chiffres, jamais l'un sans l'autre. */}
                        {report && (
                            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Santé globale</div>
                                    <div className="text-lg font-black tabular-nums">
                                        {report.score === null ? '—' : `${Math.round(report.score)} %`}
                                        <span className="text-xs text-slate-400 font-semibold"> sur ce qui est mesuré</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Périmètre mesuré</div>
                                    <div className="text-lg font-black tabular-nums text-blue-300">
                                        {Math.round(report.coverage * 100)} %
                                        <span className="text-xs text-slate-400 font-semibold"> des {toutesLignes.length} contrôles, en poids</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Contrôles</div>
                                    <div className="text-lg font-black tabular-nums">
                                        {toutesLignes.length} <span className="text-xs text-slate-400 font-semibold">sur 12 domaines</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-stretch gap-2 shrink-0 w-full lg:w-auto">
                        <button onClick={() => void mesurer()} disabled={chargement}
                                className="px-4 py-2.5 rounded-xl text-sm font-black bg-blue-600 hover:bg-blue-500 disabled:opacity-50 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                            {chargement ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                            Relancer la mesure
                        </button>
                        {/* Le MODE, dit sans détour : soit on répare, soit on ne fait que diagnostiquer. */}
                        <span className={`text-[11px] font-black text-center px-2.5 py-1.5 rounded-lg inline-flex items-center justify-center gap-1.5 ${
                            rank.canRepair ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        }`}>
                            {rank.canRepair ? <Wrench size={12} /> : <Lock size={12} />}
                            {rank.canRepair
                                ? 'Mode : Réparation activée'
                                : 'Mode : Diagnostic seulement'}
                        </span>
                        {!rank.canRepair && (
                            <span className="text-[10px] text-slate-400 text-center leading-tight max-w-[15rem]">
                                Votre rang ({rank.role ?? 'inconnu'}) permet de mesurer et de diagnostiquer.
                                Réparer et restaurer exigent le rang Admin Général.
                            </span>
                        )}
                    </div>
                </div>

                {/* Compteurs = FILTRES. Cliquer restreint la file de travail. */}
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
                        {filtreActif && (
                            <button onClick={reinitialiser}
                                    className="ml-auto text-xs font-bold text-slate-400 hover:text-white inline-flex items-center gap-1">
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
                            {snapshot.serverError} — les lignes concernées restent <strong>non éprouvées</strong>,
                            elles ne sont pas comptées comme conformes.
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
                    <button onClick={() => setErreur(null)} className="text-red-400 hover:text-red-600 shrink-0">
                        <X size={15} />
                    </button>
                </div>
            )}

            {succes && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2.5">
                    <ShieldCheck size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-900">Action terminée et vérifiée</p>
                        <p className="text-xs text-emerald-800 mt-0.5 break-words">{succes}</p>
                    </div>
                    <button onClick={() => setSucces(null)} className="text-emerald-500 hover:text-emerald-700 shrink-0">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* ── MATRICE DES DOMAINES ──────────────────────────────────── */}
            {report && (
                <div>
                    <div className="flex items-baseline gap-2 mb-2.5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                            Les 12 domaines
                        </h3>
                        <span className="text-[11px] text-slate-400">
                            cliquez pour filtrer la file de travail
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                        {report.domains.map((d) => {
                            const repartition = ORDRE_STATUTS.reduce((acc, st) => {
                                acc[st] = d.lines.filter((l) => l.outcome.status === st).length;
                                return acc;
                            }, {} as Record<HealthStatus, number>);
                            return (
                                <TuileDomaine
                                    key={d.domain.id}
                                    id={d.domain.id}
                                    titre={d.domain.title}
                                    poids={d.domain.weight}
                                    score={d.score}
                                    coverage={d.coverage}
                                    status={d.status}
                                    repartition={repartition}
                                    actif={domaine === d.domain.id}
                                    onClick={() => setDomaine(domaine === d.domain.id ? null : d.domain.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── FILE DE TRAVAIL ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-black text-slate-900">
                        File de travail
                        <span className="ml-2 text-xs font-bold text-slate-400 tabular-nums">
                            {lignesFiltrees.length} sur {toutesLignes.length}
                        </span>
                    </h3>

                    <div className="relative ml-auto">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            placeholder="Rechercher un contrôle…"
                            aria-label="Rechercher un contrôle"
                            className="pl-8 pr-3 py-1.5 w-48 sm:w-64 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <label className="inline-flex items-center gap-1.5 text-xs">
                        <ArrowUpDown size={13} className="text-slate-400" />
                        <span className="sr-only">Trier par</span>
                        <select
                            value={tri}
                            onChange={(e) => setTri(e.target.value as Tri)}
                            className="rounded-lg border border-slate-200 text-xs py-1.5 pl-2 pr-7 font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="gravite">Gravité</option>
                            <option value="poids">Poids dans la note</option>
                            <option value="domaine">Domaine</option>
                        </select>
                    </label>
                </div>

                {lignesFiltrees.length === 0 ? (
                    <div className="py-14 text-center">
                        <ShieldCheck size={26} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-600">Aucun contrôle ne correspond</p>
                        <p className="text-xs text-slate-400 mt-1">
                            {filtreActif ? 'Élargissez les filtres pour revoir la liste complète.' : 'Relancez la mesure.'}
                        </p>
                        {filtreActif && (
                            <button onClick={reinitialiser}
                                    className="mt-3 text-xs font-black text-blue-600 hover:text-blue-700">
                                Tout afficher
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {lignesFiltrees.map(({ state, poidsReel, domaineTitre }) => {
                            const s = STATUT[state.outcome.status];
                            const aCorriger = state.outcome.status === 'rouge' || state.outcome.status === 'orange';
                            const agissable = Boolean(state.line.remediation) && aCorriger;
                            // Ce que CETTE ligne peut faire pour CETTE personne — jamais un bouton qui ment.
                            const mention = !aCorriger ? null
                                : agissable && rank.canRepair ? { texte: 'Réparer', classe: 'text-blue-600', Icone: Wrench }
                                : agissable ? { texte: 'Diagnostic seulement', classe: 'text-amber-700', Icone: Stethoscope }
                                : state.line.humanAction ? { texte: 'Action humaine', classe: 'text-slate-600', Icone: CircleHelp }
                                : { texte: 'Diagnostic seulement', classe: 'text-slate-500', Icone: Stethoscope };
                            return (
                                <button
                                    key={state.line.id}
                                    onClick={() => setSelection(state)}
                                    className={`w-full text-left flex items-stretch gap-0 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${s.rangee}`}
                                >
                                    {/* Barre de gravité : la couleur porte l'information, pas un badge. */}
                                    <span className={`w-1 shrink-0 ${s.aplat}`} aria-hidden="true" />

                                    <span className="flex-1 min-w-0 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                                        <span className="min-w-0 sm:flex-1">
                                            <span className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-slate-900">{state.line.title}</span>
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${s.aplat} ${state.outcome.status === 'blanc' ? 'text-slate-800' : 'text-white'}`}>
                                                    {s.mot}
                                                </span>
                                            </span>
                                            <span className={`block text-xs mt-0.5 truncate ${
                                                state.outcome.status === 'vert' ? 'text-slate-500' : `font-semibold ${s.texte}`
                                            }`}>
                                                {state.outcome.measured}
                                            </span>
                                        </span>

                                        <span className="flex items-center gap-3 shrink-0 text-[10px]">
                                            <span className="text-slate-400 font-semibold w-24 truncate hidden sm:block">
                                                {domaineTitre}
                                            </span>
                                            <span className="text-slate-400 font-mono w-16 hidden md:block">
                                                {PORTEE_LIBELLE[state.line.location]}
                                            </span>
                                            <span className="text-slate-400 font-mono tabular-nums w-10 text-right hidden md:block"
                                                  title="Poids réel dans la note globale">
                                                {poidsReel.toFixed(1)}
                                            </span>
                                            {mention ? (
                                                <span className={`inline-flex items-center gap-1 font-black whitespace-nowrap ${mention.classe}`}>
                                                    <mention.Icone size={11} /> {mention.texte}
                                                </span>
                                            ) : (
                                                <span className="w-14" />
                                            )}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

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
                        Aucune action enregistrée. Chaque réparation et chaque restauration apparaîtra ici,
                        avec son auteur et sa sauvegarde.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {journal.map((entry) => (
                            <div key={entry.id} className="px-4 py-2.5 flex flex-wrap items-center gap-3 text-xs">
                                {/* Quatre natures d'entrée, quatre mots : une réparation, une
                                    restauration, une réparation automatique (cron) et un geste de
                                    SECOURS (SAT-6) ne se lisent pas de la même façon. */}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    entry.action === 'health.restore' ? 'bg-slate-100 text-slate-600'
                                        : entry.action === 'health.emergency' ? 'bg-red-50 text-red-700'
                                        : entry.action === 'health.auto_repair' ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-blue-50 text-blue-700'
                                }`}>
                                    {entry.action === 'health.restore' ? 'Restauration'
                                        : entry.action === 'health.emergency' ? 'Secours'
                                        : entry.action === 'health.auto_repair' ? 'Automatique'
                                        : 'Réparation'}
                                </span>
                                <span className="font-mono text-slate-500 truncate max-w-[16rem]">
                                    {entry.action === 'health.emergency' ? emergencyJournalLabel(entry.remediationId) : entry.lineId}
                                </span>
                                <span className="text-slate-600 tabular-nums">{entry.changedCount ?? 0} élément(s)</span>
                                {entry.actorName && <span className="text-slate-500">{entry.actorName}</span>}
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
                                        {entry.action === 'health.emergency' || entry.action === 'health.auto_repair'
                                            ? 'sans sauvegarde : geste non restaurable'
                                            : entry.restorable ? 'restauration réservée à l\'Admin Général' : 'sauvegarde déjà restaurée ou purgée'}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selection && (
                <PanneauDetail
                    state={selection}
                    rank={rank}
                    occupe={occupe}
                    onFermer={() => setSelection(null)}
                    onDiagnostiquer={lancerDiagnostic}
                />
            )}

            {confirmation && (
                <ModaleConfirmation
                    state={confirmation}
                    occupe={occupe}
                    onAnnuler={() => setConfirmation(null)}
                    onConfirmer={() => void appliquer()}
                />
            )}
        </div>
    );
};
