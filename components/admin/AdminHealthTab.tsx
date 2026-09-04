import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity, AlertTriangle, ChevronDown, ChevronRight, CircleHelp, ClipboardList,
    Loader2, Lock, RefreshCw, ShieldCheck, Stethoscope, Undo2, Wrench, XCircle,
} from 'lucide-react';
import {
    DiagnosisPlan, HealthJournalEntry, HealthLineState, HealthStatus,
} from '../../services/health/healthTypes';
import { isCertifiable, prioritisedLines, verdictSentence } from '../../services/health/healthScore';
import {
    HealthRank, HealthSnapshot, diagnose, loadJournal, repair, restore, runHealthCheck,
} from '../../services/health/healthService';

/**
 * Santé globale de MokNet — état de toute l'application, ligne par ligne, et
 * les actions contrôlées qui vont avec.
 *
 * Trois règles tenues par cette interface :
 *
 *   1. Aucun faux vert. Une ligne non mesurée s'affiche BLANCHE, et le score
 *      global est toujours accompagné de sa couverture. « 84/100 » seul
 *      laisserait croire que le reste a été contrôlé.
 *
 *   2. Aucun bouton qui ne peut pas aboutir. Réparer et restaurer n'existent
 *      que pour l'Admin Général ; pour les autres rangs, l'emplacement porte
 *      l'explication, pas un bouton qui échouerait.
 *
 *   3. Aucune action sans avoir montré son périmètre. Le bouton « Réparer »
 *      n'agit jamais directement : il ouvre un diagnostic qui dit combien
 *      d'éléments changeraient, dans quelles tables, avec un extrait réel —
 *      et la confirmation est liée à CE périmètre.
 */

// ─────────────────────────── Vocabulaire visuel ───────────────────────────

const STATUT: Record<HealthStatus, {
    label: string; pastille: string; texte: string; bordure: string; fond: string;
}> = {
    vert:   { label: 'Conforme',     pastille: 'bg-emerald-500', texte: 'text-emerald-700', bordure: 'border-emerald-200', fond: 'bg-emerald-50' },
    jaune:  { label: 'En attente',   pastille: 'bg-amber-400',   texte: 'text-amber-700',   bordure: 'border-amber-200',   fond: 'bg-amber-50' },
    orange: { label: 'À corriger',   pastille: 'bg-orange-500',  texte: 'text-orange-700',  bordure: 'border-orange-200',  fond: 'bg-orange-50' },
    rouge:  { label: 'Non conforme', pastille: 'bg-red-500',     texte: 'text-red-700',     bordure: 'border-red-200',     fond: 'bg-red-50' },
    blanc:  { label: 'Non éprouvé',  pastille: 'bg-slate-300',   texte: 'text-slate-600',   bordure: 'border-slate-200',   fond: 'bg-slate-50' },
};

const StatusPill: React.FC<{ status: HealthStatus }> = ({ status }) => {
    const s = STATUT[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${s.fond} ${s.texte} border ${s.bordure}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.pastille}`} />
            {s.label}
        </span>
    );
};

/** Jauge circulaire du score global. Le tracé suit le score, jamais l'inverse. */
const ScoreGauge: React.FC<{ score: number | null; status: HealthStatus }> = ({ score, status }) => {
    const RAYON = 52;
    const circonference = 2 * Math.PI * RAYON;
    const part = score === null ? 0 : (score / 100) * circonference;
    const couleur = status === 'vert' ? '#10b981'
        : status === 'orange' ? '#f97316'
        : status === 'rouge' ? '#ef4444'
        : status === 'jaune' ? '#f59e0b' : '#cbd5e1';

    return (
        <svg viewBox="0 0 130 130" className="w-32 h-32 shrink-0" role="img"
             aria-label={score === null ? 'Score indisponible' : `Score de santé : ${score} sur 100`}>
            <circle cx="65" cy="65" r={RAYON} fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <circle cx="65" cy="65" r={RAYON} fill="none" stroke={couleur} strokeWidth="12"
                    strokeDasharray={`${part} ${circonference - part}`}
                    transform="rotate(-90 65 65)" strokeLinecap="butt" />
            <text x="65" y="63" textAnchor="middle" className="fill-slate-900"
                  style={{ fontSize: 30, fontWeight: 800 }}>
                {score === null ? '—' : Math.round(score)}
            </text>
            <text x="65" y="82" textAnchor="middle" className="fill-slate-400"
                  style={{ fontSize: 11, fontWeight: 600 }}>
                {score === null ? 'non mesuré' : 'sur 100'}
            </text>
        </svg>
    );
};

// ─────────────────────────── Modale de confirmation ───────────────────────────

interface ConfirmState {
    line: HealthLineState;
    plan: DiagnosisPlan;
}

const ConfirmModal: React.FC<{
    state: ConfirmState;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ state, busy, onCancel, onConfirm }) => {
    const [accepte, setAccepte] = useState(false);
    const { line, plan } = state;
    const remediation = line.line.remediation!;
    const rienAFaire = plan.affectedCount === 0;
    const sansJeton = !plan.confirmationToken;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
             role="dialog" aria-modal="true" aria-labelledby="titre-confirmation">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="p-5 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle size={18} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Confirmation requise</span>
                    </div>
                    <h3 id="titre-confirmation" className="text-lg font-black text-slate-900 mt-1">
                        {remediation.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{line.line.title}</p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                            Ce qui va se passer
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{remediation.consequence}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Éléments concernés
                            </div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5">{plan.affectedCount}</div>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Tables touchées
                            </div>
                            <div className="text-xs font-mono text-slate-700 mt-1 break-words">
                                {plan.affectedTables?.length ? plan.affectedTables.join(', ') : '—'}
                            </div>
                        </div>
                    </div>

                    {plan.sample?.length > 0 && (
                        <details className="border border-slate-200 rounded-xl p-3">
                            <summary className="text-xs font-bold text-slate-600 cursor-pointer">
                                Extrait réel des éléments concernés ({plan.sample.length} affiché(s))
                            </summary>
                            <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 rounded-lg p-2 mt-2 overflow-x-auto max-h-48">
{JSON.stringify(plan.sample, null, 2)}
                            </pre>
                        </details>
                    )}

                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-900 leading-relaxed">
                            Une <strong>sauvegarde</strong> est prise avant toute modification, dans la même
                            transaction : il est impossible d'obtenir un changement sans sa sauvegarde.
                            L'action est <strong>restaurable</strong> depuis le journal, et une
                            <strong> vérification</strong> est rejouée juste après.
                        </p>
                    </div>

                    {rienAFaire && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            Aucun élément ne correspond actuellement : il n'y a rien à corriger.
                        </p>
                    )}

                    {sansJeton && !rienAFaire && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                            Votre rang ne permet pas d'appliquer cette réparation. Seul l'Admin Général
                            (super_admin) peut agir.
                        </p>
                    )}

                    {!rienAFaire && !sansJeton && (
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)}
                                   className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-slate-700">
                                Je confirme cette action sur <strong>{plan.affectedCount} élément(s)</strong> et
                                j'en assume l'effet en production.
                            </span>
                        </label>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
                    <button onClick={onCancel} disabled={busy}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                        Annuler
                    </button>
                    <button onClick={onConfirm} disabled={busy || !accepte || rienAFaire || sansJeton}
                            className="px-4 py-2 rounded-xl text-sm font-black text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2">
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <Wrench size={15} />}
                        Appliquer la réparation
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────── Une ligne du tableau ───────────────────────────

const LineRow: React.FC<{
    state: HealthLineState;
    rank: HealthRank;
    busyLineId: string | null;
    onDiagnose: (state: HealthLineState) => void;
}> = ({ state, rank, busyLineId, onDiagnose }) => {
    const { line, outcome } = state;
    const s = STATUT[outcome.status];
    const aBesoinAction = outcome.status === 'orange' || outcome.status === 'rouge';
    const enCours = busyLineId === line.id;

    return (
        <div className={`border-l-4 ${s.bordure.replace('border-', 'border-l-')} bg-white border-y border-r border-slate-200 rounded-r-xl p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{line.title}</h4>
                        <StatusPill status={outcome.status} />
                        {line.location === 'client' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                                mesuré navigateur
                            </span>
                        )}
                        {line.location === 'humain' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                                contrôle humain
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{line.why}</p>

                    <dl className="mt-2.5 space-y-1 text-xs">
                        <div className="flex gap-2">
                            <dt className="font-bold text-slate-400 shrink-0 w-16">Attendu</dt>
                            <dd className="text-slate-600">{line.expected}</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="font-bold text-slate-400 shrink-0 w-16">Obtenu</dt>
                            <dd className={`font-semibold ${s.texte}`}>{outcome.measured}</dd>
                        </div>
                        {outcome.gap && (
                            <div className="flex gap-2">
                                <dt className="font-bold text-slate-400 shrink-0 w-16">Écart</dt>
                                <dd className="text-slate-600">{outcome.gap}</dd>
                            </div>
                        )}
                    </dl>

                    {line.humanAction && aBesoinAction && (
                        <div className="mt-2.5 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            <CircleHelp size={14} className="text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <span className="font-bold text-slate-700">Action humaine — </span>
                                {line.humanAction}
                            </p>
                        </div>
                    )}
                    {line.humanAction && outcome.status === 'blanc' && (
                        <div className="mt-2.5 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            <CircleHelp size={14} className="text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-relaxed">{line.humanAction}</p>
                        </div>
                    )}
                </div>

                {/* Actions — uniquement quand une réparation existe ET que la ligne en a besoin. */}
                {line.remediation && aBesoinAction && (
                    <div className="flex flex-col items-stretch gap-1.5 shrink-0">
                        <button
                            onClick={() => onDiagnose(state)}
                            disabled={enCours}
                            className="px-3 py-2 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                        >
                            {enCours ? <Loader2 size={13} className="animate-spin" /> : <Stethoscope size={13} />}
                            Diagnostiquer
                        </button>
                        {!rank.canRepair && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold px-1">
                                <Lock size={10} /> Réparation : Admin Général
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────── Onglet ───────────────────────────

export const AdminHealthTab: React.FC = () => {
    const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);
    const [ouverts, setOuverts] = useState<Set<string>>(new Set());
    const [confirmation, setConfirmation] = useState<ConfirmState | null>(null);
    const [busyLineId, setBusyLineId] = useState<string | null>(null);
    const [actionEnCours, setActionEnCours] = useState(false);
    const [journal, setJournal] = useState<HealthJournalEntry[]>([]);
    const [dernierResultat, setDernierResultat] = useState<string | null>(null);

    const mesurer = useCallback(async () => {
        setChargement(true);
        setErreur(null);
        try {
            const resultat = await runHealthCheck();
            setSnapshot(resultat);
            // Ouvre d'office les domaines qui demandent une action.
            setOuverts(new Set(
                resultat.report.domains
                    .filter((d) => d.status === 'rouge' || d.status === 'orange')
                    .map((d) => d.domain.id),
            ));
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setChargement(false);
        }
    }, []);

    const rafraichirJournal = useCallback(async () => {
        try {
            setJournal(await loadJournal(25));
        } catch {
            // Le journal est un complément : son indisponibilité ne doit pas
            // masquer le tableau de bord lui-même.
            setJournal([]);
        }
    }, []);

    useEffect(() => { void mesurer(); void rafraichirJournal(); }, [mesurer, rafraichirJournal]);

    const lancerDiagnostic = useCallback(async (state: HealthLineState) => {
        if (!state.line.remediation) return;
        setBusyLineId(state.line.id);
        setErreur(null);
        try {
            const plan = await diagnose(state.line.id, state.line.remediation.id);
            setConfirmation({ line: state, plan });
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setBusyLineId(null);
        }
    }, []);

    const appliquer = useCallback(async () => {
        if (!confirmation?.plan.confirmationToken) return;
        setActionEnCours(true);
        setErreur(null);
        try {
            const resultat = await repair(
                confirmation.line.line.id,
                confirmation.plan.remediationId,
                confirmation.plan.confirmationToken,
            );
            setDernierResultat(
                `${resultat.message} Vérification après action : ${resultat.verification?.measured ?? 'non concluante'}`,
            );
            setConfirmation(null);
            await Promise.all([mesurer(), rafraichirJournal()]);
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setActionEnCours(false);
        }
    }, [confirmation, mesurer, rafraichirJournal]);

    const restaurer = useCallback(async (entry: HealthJournalEntry) => {
        if (!entry.snapshotId || !entry.lineId) return;
        setActionEnCours(true);
        setErreur(null);
        try {
            const resultat = await restore(entry.lineId, entry.snapshotId);
            setDernierResultat(
                `${resultat.message} Vérification après restauration : ${resultat.verification?.measured ?? 'non concluante'}`,
            );
            await Promise.all([mesurer(), rafraichirJournal()]);
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setActionEnCours(false);
        }
    }, [mesurer, rafraichirJournal]);

    const priorites = useMemo(
        () => (snapshot ? prioritisedLines(snapshot.report).slice(0, 6) : []),
        [snapshot],
    );

    const basculer = (id: string) => setOuverts((prev) => {
        const suivant = new Set(prev);
        if (suivant.has(id)) suivant.delete(id); else suivant.add(id);
        return suivant;
    });

    if (chargement && !snapshot) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 size={28} className="animate-spin mb-3" />
                <p className="text-sm font-semibold">Mesure de la santé de MokNet…</p>
            </div>
        );
    }

    const report = snapshot?.report;
    const rank = snapshot?.rank ?? { role: null, canRead: false, canRepair: false };

    return (
        <div className="space-y-5 animate-fade-up">

            {/* ── Verdict global ───────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
                    {report && <ScoreGauge score={report.score} status={report.status} />}

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                                Santé Globale MokNet
                            </span>
                            {report && (
                                <span className="text-xs text-slate-400 font-mono">
                                    couverture {Math.round(report.coverage * 100)} %
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
                            <Activity size={20} className="text-blue-600 shrink-0" />
                            {report && isCertifiable(report) ? 'État certifiable' : 'État non certifiable'}
                        </h2>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            {report ? verdictSentence(report) : 'Aucune mesure disponible.'}
                        </p>

                        {report && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {(['rouge', 'orange', 'jaune', 'blanc', 'vert'] as HealthStatus[]).map((st) => (
                                    <span key={st}
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUT[st].fond} ${STATUT[st].texte} ${STATUT[st].bordure}`}>
                                        <span className={`w-2 h-2 rounded-full ${STATUT[st].pastille}`} />
                                        {report.tally[st]} {STATUT[st].label.toLowerCase()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={() => void mesurer()} disabled={chargement}
                            className="px-4 py-2.5 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">
                        {chargement ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                        Relancer la mesure
                    </button>
                </div>

                {/* Rang de l'utilisateur : dit ce qui est possible AVANT d'essayer. */}
                <div className={`mt-4 flex items-start gap-2 rounded-xl p-3 border ${rank.canRepair ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    {rank.canRepair
                        ? <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        : <Lock size={16} className="text-slate-400 shrink-0 mt-0.5" />}
                    <p className="text-xs text-slate-700 leading-relaxed">
                        {rank.canRepair ? (
                            <>Vous êtes <strong>Admin Général</strong> : diagnostic, réparation et restauration
                            vous sont ouverts. Chaque action exige une confirmation, prend une sauvegarde,
                            se vérifie et se journalise.</>
                        ) : (
                            <>Rang actuel : <strong>{rank.role ?? 'inconnu'}</strong>. Le diagnostic reste
                            disponible ; la réparation et la restauration sont réservées à l'<strong>Admin
                            Général</strong> (rôle <code className="font-mono">super_admin</code>).</>
                        )}
                    </p>
                </div>

                {snapshot?.serverError && (
                    <div className="mt-3 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <CircleHelp size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600 leading-relaxed">
                            <strong className="text-slate-700">Sondes serveur indisponibles — </strong>
                            {snapshot.serverError}. Les lignes concernées restent <strong>non éprouvées</strong>
                            {' '}(blanches) : elles ne sont pas comptées comme conformes.
                        </p>
                    </div>
                )}
            </div>

            {erreur && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
                    <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-red-800">Action refusée</p>
                        <p className="text-xs text-red-700 mt-0.5 break-words">{erreur}</p>
                    </div>
                </div>
            )}

            {dernierResultat && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-2">
                    <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-emerald-900">Action terminée et vérifiée</p>
                        <p className="text-xs text-emerald-800 mt-0.5 break-words">{dernierResultat}</p>
                    </div>
                </div>
            )}

            {/* ── Priorités ────────────────────────────────────────────── */}
            {priorites.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-orange-500" />
                        À traiter en priorité
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            gravité, puis poids réel dans la note
                        </span>
                    </h3>
                    <div className="space-y-2">
                        {priorites.map((state) => (
                            <LineRow key={state.line.id} state={state} rank={rank}
                                     busyLineId={busyLineId} onDiagnose={lancerDiagnostic} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Domaines, ligne par ligne ────────────────────────────── */}
            <div className="space-y-3">
                {report?.domains.map((d) => {
                    const ouvert = ouverts.has(d.domain.id);
                    const s = STATUT[d.status];
                    return (
                        <div key={d.domain.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <button
                                onClick={() => basculer(d.domain.id)}
                                aria-expanded={ouvert}
                                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                            >
                                {ouvert ? <ChevronDown size={16} className="text-slate-400 shrink-0" />
                                        : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.pastille}`} />
                                <span className="min-w-0 flex-1">
                                    <span className="block font-black text-sm text-slate-900">{d.domain.title}</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">{d.domain.purpose}</span>
                                </span>
                                <span className="text-right shrink-0">
                                    <span className="block text-lg font-black text-slate-900 tabular-nums">
                                        {d.score === null ? '—' : Math.round(d.score)}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 font-semibold">
                                        poids {d.domain.weight} % · couverture {Math.round(d.coverage * 100)} %
                                    </span>
                                </span>
                            </button>

                            {ouvert && (
                                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                                    {d.lines.map((state) => (
                                        <LineRow key={state.line.id} state={state} rank={rank}
                                                 busyLineId={busyLineId} onDiagnose={lancerDiagnostic} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Journal ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                    <ClipboardList size={16} className="text-slate-400" />
                    Journal des actions de santé
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        qui, quoi, quand, et restaurable ou non
                    </span>
                </h3>

                {journal.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">
                        Aucune action enregistrée pour l'instant. Chaque réparation et chaque restauration
                        y apparaîtra, avec son auteur et sa sauvegarde.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {journal.map((entry) => (
                            <div key={entry.id} className="flex flex-wrap items-center gap-3 border border-slate-200 rounded-xl p-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    entry.action === 'health.restore' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'
                                }`}>
                                    {entry.action === 'health.restore' ? 'Restauration' : 'Réparation'}
                                </span>
                                <span className="text-xs font-mono text-slate-500">{entry.lineId}</span>
                                <span className="text-xs text-slate-600">
                                    {entry.changedCount ?? 0} élément(s)
                                    {entry.actorName ? ` · ${entry.actorName}` : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(entry.createdAt).toLocaleString('fr-FR')}
                                </span>
                                {entry.statusAfter && (
                                    <StatusPill status={entry.statusAfter} />
                                )}
                                <span className="flex-1" />
                                {entry.restorable && entry.action === 'health.repair' && rank.canRepair && (
                                    <button onClick={() => void restaurer(entry)} disabled={actionEnCours}
                                            className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1.5">
                                        <Undo2 size={12} />
                                        Restaurer
                                    </button>
                                )}
                                {!entry.restorable && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                        sauvegarde déjà restaurée ou purgée
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {confirmation && (
                <ConfirmModal
                    state={confirmation}
                    busy={actionEnCours}
                    onCancel={() => setConfirmation(null)}
                    onConfirm={() => void appliquer()}
                />
            )}
        </div>
    );
};
