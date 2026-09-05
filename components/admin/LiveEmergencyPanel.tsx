import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, Lock, RadioTower, RefreshCw, ShieldCheck, Siren, Terminal, X, XCircle } from 'lucide-react';
import type { HealthRank } from '../../services/health/healthService';
import { applyLiveEmergency, diagnoseLiveEmergency, loadLiveEmergencyOverview } from '../../services/health/healthService';
import {
    LIVE_EMERGENCY_CATALOGUE,
    LIVE_VPS_GESTURES,
    type LiveEmergencyAction,
    type LiveEmergencyPlan,
    type LiveEmergencyResult,
    type LiveEmergencySessionRow,
} from '../../services/health/liveEmergency';

/**
 * SAT-6 — Le bouton de secours du direct, réservé à l'Admin Général.
 *
 * TROIS RÈGLES, les mêmes que pour le reste de la Santé Globale :
 *   • aucun bouton qui ne peut pas aboutir — les gestes n'existent que pour
 *     l'Admin Général, et le serveur relit ce rang de toute façon ;
 *   • aucun geste sans son périmètre montré d'abord — le diagnostic précède
 *     la confirmation, qui précède le geste ;
 *   • aucun succès déduit de l'écriture — le résultat affiché est une
 *     RE-MESURE (room disparue ou renouvelée, ended_at relu).
 *
 * Et une quatrième, propre à ce panneau : ce qui exige SSH est listé comme
 * action humaine, jamais promis par un bouton.
 */

/**
 * Après « Relancer la room », la relecture immédiate voit un trou : la room
 * vient d'être supprimée et les lignes SAT-5 ne se rétablissent qu'environ
 * 1,5 s plus tard (mesuré au banc). Une seconde relecture, après ce délai,
 * montre la room renée avec ses présents — l'effet réel du geste, pas l'état
 * intermédiaire qui inviterait à cliquer une seconde fois.
 */
export const RELECTURE_APRES_RELANCE_MS = 5000;

function depuis(iso: string | null | undefined): string {
    if (!iso) return '—';
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `depuis ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    return heures < 24 ? `depuis ${heures} h` : `depuis ${Math.floor(heures / 24)} j`;
}

interface Confirmation { action: LiveEmergencyAction; plan: LiveEmergencyPlan; }

const ModaleSecours: React.FC<{
    confirmation: Confirmation;
    occupe: boolean;
    onAnnuler: () => void;
    onConfirmer: () => void;
}> = ({ confirmation, occupe, onAnnuler, onConfirmer }) => {
    const [accepte, setAccepte] = useState(false);
    const geste = LIVE_EMERGENCY_CATALOGUE[confirmation.action];
    const { plan } = confirmation;
    const sansJeton = !plan.confirmationToken;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !occupe) onAnnuler(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onAnnuler, occupe]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
             role="dialog" aria-modal="true" aria-labelledby="titre-secours" data-testid="live-emergency-modal">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-full overflow-y-auto">
                <div className={`px-5 py-4 border-b border-slate-200 ${geste.reversible ? 'bg-orange-50' : 'bg-red-50'}`}>
                    <div className={`flex items-center gap-2 ${geste.reversible ? 'text-orange-700' : 'text-red-700'}`}>
                        <AlertTriangle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {geste.reversible ? 'Geste de secours — confirmation requise' : 'Geste NON réversible — confirmation requise'}
                        </span>
                    </div>
                    <h3 id="titre-secours" className="text-lg font-black text-slate-900 mt-1">{geste.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {plan.session.title ? `« ${plan.session.title} »` : 'Direct sans titre'}
                        {plan.session.hostName ? ` · animé par ${plan.session.hostName}` : ''}
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Présents (LiveKit)</div>
                            <div className="text-3xl font-black text-slate-900 mt-0.5 tabular-nums" data-testid="live-emergency-participants">
                                {plan.participantCount === null ? '?' : plan.participantCount}
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Room</div>
                            <div className="text-xs text-slate-700 mt-1.5">{plan.roomState}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Ce qui va se passer</div>
                        <p className="text-sm text-slate-700 leading-relaxed" data-testid="live-emergency-summary">{plan.summary}</p>
                    </div>

                    <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-900 leading-relaxed">
                            Le serveur <strong>relit votre rang en base</strong> et l'état du direct au moment du geste, puis
                            <strong> re-mesure</strong> avant de conclure. Le geste est <strong>journalisé</strong> avec
                            votre identité, le nombre de présents et le verdict.
                        </p>
                    </div>

                    {plan.nothingToDo && (
                        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                            Rien à relancer : aucune room active pour ce direct en ce moment.
                        </p>
                    )}

                    {sansJeton && !plan.nothingToDo && (
                        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <strong>Diagnostic seulement.</strong> Aucun jeton n'a été émis : votre rang ne permet pas ce geste.
                        </p>
                    )}

                    {!sansJeton && (
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)}
                                   data-testid="live-emergency-accept"
                                   className="mt-0.5 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                            <span className="text-sm text-slate-700">
                                Je confirme ce geste sur ce direct
                                {plan.participantCount !== null ? <> et ses <strong>{plan.participantCount} présent(s)</strong></> : null}
                                , et j'en assume l'effet en production.
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
                        <button onClick={onConfirmer} disabled={occupe || !accepte}
                                data-testid="live-emergency-confirm"
                                className={`px-4 py-2 rounded-xl text-sm font-black text-white disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 ${
                                    geste.reversible ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
                                }`}>
                            {occupe ? <Loader2 size={15} className="animate-spin" /> : <Siren size={15} />}
                            {geste.verb}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const LiveEmergencyPanel: React.FC<{
    rank: HealthRank;
    onJournalChanged?: () => void;
    /** Délai de la seconde relecture après une relance (défaut : RELECTURE_APRES_RELANCE_MS). */
    delaiRelectureApresRelanceMs?: number;
}> = ({ rank, onJournalChanged, delaiRelectureApresRelanceMs = RELECTURE_APRES_RELANCE_MS }) => {
    const [sessions, setSessions] = useState<LiveEmergencySessionRow[] | null>(null);
    const [ranAt, setRanAt] = useState<string | null>(null);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [resultat, setResultat] = useState<LiveEmergencyResult | null>(null);
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [occupe, setOccupe] = useState(false);
    const relectureDifferee = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (relectureDifferee.current) clearTimeout(relectureDifferee.current);
    }, []);

    const charger = useCallback(async () => {
        if (!rank.canRead) return;
        setChargement(true);
        setErreur(null);
        try {
            const o = await loadLiveEmergencyOverview();
            setSessions(o.sessions);
            setRanAt(o.ranAt);
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
            setSessions(null);
        } finally {
            setChargement(false);
        }
    }, [rank.canRead]);

    useEffect(() => { void charger(); }, [charger]);

    const diagnostiquer = useCallback(async (action: LiveEmergencyAction, sessionId: string) => {
        setOccupe(true);
        setErreur(null);
        setResultat(null);
        try {
            const plan = await diagnoseLiveEmergency(action, sessionId);
            setConfirmation({ action, plan });
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
            const r = await applyLiveEmergency(confirmation.action, confirmation.plan.sessionId, confirmation.plan.confirmationToken);
            setResultat(r);
            setConfirmation(null);
            onJournalChanged?.();
            await charger();
            if (r.action === 'relaunch_room' && r.verdict !== 'failed') {
                if (relectureDifferee.current) clearTimeout(relectureDifferee.current);
                relectureDifferee.current = setTimeout(() => {
                    relectureDifferee.current = null;
                    void charger();
                }, delaiRelectureApresRelanceMs);
            }
        } catch (err) {
            setErreur(err instanceof Error ? err.message : String(err));
        } finally {
            setOccupe(false);
        }
    }, [confirmation, charger, onJournalChanged, delaiRelectureApresRelanceMs]);

    if (!rank.canRead) return null;

    return (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden" data-testid="live-emergency-panel">
            <div className="px-4 py-3 border-b border-red-100 bg-red-50/60 flex flex-wrap items-center gap-2">
                <Siren size={15} className="text-red-600" />
                <h3 className="text-sm font-black text-slate-900">Secours du direct</h3>
                <span className="text-[11px] text-slate-500">deux gestes sans SSH, tracés, confirmés — Admin Général</span>
                <span className="flex-1" />
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg inline-flex items-center gap-1 ${
                    rank.canRepair ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`} data-testid="live-emergency-mode">
                    {rank.canRepair ? <Siren size={11} /> : <Lock size={11} />}
                    {rank.canRepair ? 'Secours activé' : 'Lecture seule'}
                </span>
                <button onClick={() => void charger()} disabled={chargement}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1.5">
                    {chargement ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                    Relire
                </button>
            </div>

            {erreur && (
                <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5" data-testid="live-emergency-error">
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 break-words flex-1">{erreur}</p>
                    <button onClick={() => setErreur(null)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                </div>
            )}

            {resultat && (
                <div className={`mx-4 mt-3 rounded-xl p-3 flex items-start gap-2.5 border ${
                    resultat.verdict === 'verified' ? 'bg-emerald-50 border-emerald-200'
                        : resultat.verdict === 'failed' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                }`} data-testid="live-emergency-result">
                    <ShieldCheck size={15} className={`shrink-0 mt-0.5 ${
                        resultat.verdict === 'verified' ? 'text-emerald-600' : resultat.verdict === 'failed' ? 'text-red-500' : 'text-amber-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900">
                            {resultat.verdict === 'verified' ? 'Geste appliqué et vérifié'
                                : resultat.verdict === 'failed' ? 'Geste sans effet vérifiable' : 'Geste appliqué, vérification incomplète'}
                            {' — '}{LIVE_EMERGENCY_CATALOGUE[resultat.action].label}
                        </p>
                        <p className="text-xs text-slate-700 mt-0.5 break-words">{resultat.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            présents avant : {resultat.participantsBefore ?? '?'} · journal : {resultat.journalId ? resultat.journalId.slice(0, 8) : 'ÉCHEC'}
                        </p>
                    </div>
                    <button onClick={() => setResultat(null)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
                </div>
            )}

            <div className="px-4 py-3">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Directs ouverts</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                        {ranAt ? `relu ${depuis(ranAt).replace('depuis ', 'il y a ')}` : ''}
                    </span>
                </div>

                {sessions === null ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                        {chargement ? 'Lecture des directs…' : 'État des directs indisponible.'}
                    </p>
                ) : sessions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center" data-testid="live-emergency-empty">
                        Aucun direct ouvert en ce moment : il n'y a rien à secourir.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {sessions.map((s) => (
                            <div key={s.id} className="px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2" data-testid={`live-emergency-row-${s.id}`}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <RadioTower size={13} className={s.roomPresent ? 'text-emerald-600' : s.roomPresent === null ? 'text-slate-400' : 'text-amber-600'} />
                                        <span className="text-sm font-bold text-slate-900 truncate">{s.title || 'Direct sans titre'}</span>
                                        <span className="text-[10px] text-slate-400">{s.hostName ? `· ${s.hostName}` : ''} · {depuis(s.startedAt)}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 mt-0.5">
                                        {s.roomState}
                                        {s.roomSid ? <span className="font-mono text-[10px] text-slate-400"> · {s.roomSid}</span> : null}
                                    </div>
                                </div>
                                {rank.canRepair ? (
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => void diagnostiquer('relaunch_room', s.id)} disabled={occupe}
                                                data-testid={`live-emergency-relaunch-${s.id}`}
                                                className="px-3 py-2 min-h-[44px] rounded-lg text-xs font-black text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 inline-flex items-center gap-1.5">
                                            <RefreshCw size={12} /> Relancer la room
                                        </button>
                                        <button onClick={() => void diagnostiquer('close_session', s.id)} disabled={occupe}
                                                data-testid={`live-emergency-close-${s.id}`}
                                                className="px-3 py-2 min-h-[44px] rounded-lg text-xs font-black text-red-700 bg-white border border-red-300 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1.5">
                                            <XCircle size={12} /> Clore
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-amber-800 inline-flex items-center gap-1 shrink-0">
                                        <Lock size={10} /> gestes réservés à l'Admin Général
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <details className="mt-3 border border-slate-200 rounded-xl">
                    <summary className="text-xs font-bold text-slate-600 cursor-pointer px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-1.5 w-full">
                        <Terminal size={12} /> Ce qu'aucun bouton ne peut faire — gestes SSH sur le VPS
                    </summary>
                    <ul className="px-3 pb-3 pt-1 space-y-1.5 border-t border-slate-200">
                        {LIVE_VPS_GESTURES.map((g) => (
                            <li key={g.label} className="text-xs">
                                <span className="font-bold text-slate-800">{g.label}</span>
                                <span className="text-slate-500"> — {g.why}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            </div>

            {/* Portail vers <body> : un ancêtre habillé (transform / filtre) ferait de `fixed inset-0`
                un cadre local — au banc (passe 1), la boîte se retrouvait hors de l'écran, seul le voile
                se voyait. Hors de l'arbre, la modale est cadrée par la fenêtre, où qu'on ait défilé. */}
            {confirmation && createPortal(
                <ModaleSecours
                    confirmation={confirmation}
                    occupe={occupe}
                    onAnnuler={() => setConfirmation(null)}
                    onConfirmer={() => void appliquer()}
                />,
                document.body,
            )}
        </div>
    );
};
