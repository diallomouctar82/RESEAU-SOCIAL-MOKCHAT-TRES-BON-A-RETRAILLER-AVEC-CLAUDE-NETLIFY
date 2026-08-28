import React, { useEffect, useState } from 'react';
import { Wallet, ShieldAlert, Loader2, AlertTriangle, Save, ScrollText, RefreshCw, Gift } from 'lucide-react';
import {
    AiBudget, getBudget, setBudget,
    RoutingDecision, listRoutingDecisions,
} from '../../services/aiOrchestratorAdmin';

// Gouvernance des coûts : plafonds, dépense courante, et journal d'audit des
// décisions de routage. Les valeurs sont relues par l'orchestrateur à chaque
// appel — un changement ici s'applique immédiatement, sans redéploiement.

const money = (n: number) => `${n.toFixed(n < 1 ? 4 : 2)} $`;

const STATUS_META: Record<RoutingDecision['status'], { label: string; tone: string }> = {
    success: { label: 'Retenu', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    error: { label: 'Échec', tone: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    skipped: { label: 'Écarté', tone: 'text-slate-300 bg-slate-700/40 border-slate-600' },
    blocked: { label: 'Bloqué', tone: 'text-red-300 bg-red-500/10 border-red-500/30' },
};

const Jauge: React.FC<{ libelle: string; depense: number; plafond: number | null }> = ({ libelle, depense, plafond }) => {
    const pct = plafond && plafond > 0 ? Math.min(100, (depense / plafond) * 100) : 0;
    const critique = pct >= 90;
    const eleve = pct >= 70;
    return (
        <div className="flex-1 min-w-[180px]">
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{libelle}</span>
                <span className={`text-xs font-bold ${critique ? 'text-red-300' : eleve ? 'text-amber-300' : 'text-slate-200'}`}>
                    {money(depense)}{plafond != null && <span className="text-slate-500"> / {money(plafond)}</span>}
                </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                {plafond != null ? (
                    <div
                        className={`h-full rounded-full transition-all ${critique ? 'bg-red-500' : eleve ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                ) : (
                    <div className="h-full w-full bg-slate-700/50" />
                )}
            </div>
            {plafond == null && <p className="text-[10px] text-slate-500 mt-1">Aucun plafond — dépense non limitée.</p>}
        </div>
    );
};

export const AiCostGovernance: React.FC = () => {
    const [budget, setBudgetState] = useState<AiBudget | null>(null);
    const [decisions, setDecisions] = useState<RoutingDecision[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [daily, setDaily] = useState('');
    const [monthly, setMonthly] = useState('');
    const [enforced, setEnforced] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const [b, d] = await Promise.all([getBudget(), listRoutingDecisions(60)]);
            setBudgetState(b);
            setDecisions(d);
            setDaily(b.dailyCapUsd == null ? '' : String(b.dailyCapUsd));
            setMonthly(b.monthlyCapUsd == null ? '' : String(b.monthlyCapUsd));
            setEnforced(b.enforced);
            setError(null);
        } catch (e: any) {
            setError(e?.message || 'Chargement impossible.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const save = async () => {
        setSaving(true);
        try {
            // Un champ vide signifie « pas de plafond », pas « plafond à zéro » :
            // confondre les deux couperait toute l'IA par accident.
            await setBudget(
                daily.trim() === '' ? null : Number(daily),
                monthly.trim() === '' ? null : Number(monthly),
                enforced,
            );
            await load();
        } catch (e: any) {
            setError(e?.message || "Échec de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-6 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Chargement de la gouvernance des coûts…
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0">
                    <Wallet size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">Gouvernance des coûts</h3>
                    <p className="text-xs text-slate-400 max-w-2xl">
                        Les fournisseurs en offre gratuite sont essayés en premier. Au plafond,
                        les appels s'arrêtent net. Chaque décision de routage est journalisée
                        ci-dessous pour audit.
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {/* Dépense courante */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex flex-wrap gap-5">
                    <Jauge libelle="Aujourd'hui" depense={budget?.spentToday ?? 0} plafond={budget?.dailyCapUsd ?? null} />
                    <Jauge libelle="Ce mois-ci" depense={budget?.spentMonth ?? 0} plafond={budget?.monthlyCapUsd ?? null} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                    <label className="block">
                        <span className="text-[11px] font-bold text-slate-400">Plafond journalier (USD)</span>
                        <input
                            value={daily}
                            onChange={(e) => setDaily(e.target.value)}
                            inputMode="decimal"
                            placeholder="Aucun plafond"
                            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                        />
                    </label>
                    <label className="block">
                        <span className="text-[11px] font-bold text-slate-400">Plafond mensuel (USD)</span>
                        <input
                            value={monthly}
                            onChange={(e) => setMonthly(e.target.value)}
                            inputMode="decimal"
                            placeholder="Aucun plafond"
                            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                        />
                    </label>
                    <div className="flex flex-col justify-end gap-2">
                        <button
                            onClick={() => setEnforced(!enforced)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                enforced
                                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                        >
                            <ShieldAlert size={13} />
                            {enforced ? 'Blocage actif' : 'Blocage suspendu'}
                        </button>
                        <button
                            onClick={save}
                            disabled={saving}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            Enregistrer
                        </button>
                    </div>
                </div>

                <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                    <Gift size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    Un champ vide signifie « aucun plafond », pas « plafond à zéro ». Un modèle
                    dont le tarif n'est pas renseigné est compté à 0 $ : sa dépense reste
                    invisible pour le budget.
                </p>
            </div>

            {/* Journal d'audit */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        <ScrollText size={15} className="text-indigo-400" /> Journal des décisions de routage
                    </span>
                    <button
                        onClick={load}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {decisions.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500">Aucun appel enregistré pour l'instant.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-900/60 text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 font-bold">Horodatage</th>
                                    <th className="px-3 py-2 font-bold">Fournisseur</th>
                                    <th className="px-3 py-2 font-bold">Statut</th>
                                    <th className="px-3 py-2 font-bold">Motif de la décision</th>
                                    <th className="px-3 py-2 font-bold text-right">Jetons</th>
                                    <th className="px-3 py-2 font-bold text-right">Coût</th>
                                </tr>
                            </thead>
                            <tbody>
                                {decisions.map((d, i) => {
                                    const meta = STATUS_META[d.status] ?? STATUS_META.skipped;
                                    return (
                                        <tr key={i} className="border-t border-slate-800/70">
                                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                                                {new Date(d.createdAt).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="px-3 py-2 text-slate-200 whitespace-nowrap">
                                                {d.providerId ?? '—'}
                                                {d.modelId && <span className="text-slate-500 block text-[10px]">{d.modelId}</span>}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.tone}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-slate-400 max-w-md">
                                                {d.decisionReason ?? d.errorMessage ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-400 whitespace-nowrap">
                                                {d.inputTokens != null || d.outputTokens != null
                                                    ? `${d.inputTokens ?? 0} / ${d.outputTokens ?? 0}`
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-200 whitespace-nowrap">
                                                {d.costUsd > 0 ? money(d.costUsd) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
