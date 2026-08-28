import React, { useEffect, useState } from 'react';
import { Wrench, Globe, FolderOpen, Zap, ShieldCheck, Loader2, AlertTriangle, Check } from 'lucide-react';
import { listToolMatrix, setAgentToolEnabled, setToolEnabled, ToolMatrixRow } from '../../services/aiOrchestratorAdmin';
import { AGENTS } from '../../constants';

// Matrice experts x outils. Chaque case est une autorisation stockée en base :
// la modifier prend effet au prochain appel de l'expert concerné, sans
// redéploiement ni modification de code.

const CATEGORY_META: Record<ToolMatrixRow['category'], { label: string; icon: React.ReactNode; tone: string }> = {
    search: { label: 'Recherche', icon: <Globe size={13} />, tone: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    read: { label: 'Lecture', icon: <FolderOpen size={13} />, tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    action: { label: 'Action', icon: <Zap size={13} />, tone: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
};

export const AgentToolsMatrix: React.FC = () => {
    const [rows, setRows] = useState<ToolMatrixRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    // Seuls les experts IA sont concernés : un expert humain n'utilise pas
    // d'outil de l'orchestrateur.
    const experts = AGENTS.filter((a) => !a.isHuman);

    const load = async () => {
        try {
            setLoading(true);
            setRows(await listToolMatrix());
            setError(null);
        } catch (e: any) {
            setError(e?.message || "Impossible de charger la boîte à outils.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const toggleGrant = async (row: ToolMatrixRow, agentId: string, next: boolean) => {
        const key = `${agentId}:${row.toolId}`;
        setSaving(key);
        // Mise à jour optimiste : la matrice peut être large, attendre le
        // serveur à chaque case rendrait le réglage pénible.
        setRows((prev) => prev.map((r) =>
            r.toolId === row.toolId ? { ...r, grants: { ...r.grants, [agentId]: next } } : r
        ));
        try {
            await setAgentToolEnabled(agentId, row.toolId, next);
        } catch (e: any) {
            setError(e?.message || "Échec de l'enregistrement.");
            await load();
        } finally {
            setSaving(null);
        }
    };

    const toggleGlobal = async (row: ToolMatrixRow, next: boolean) => {
        setSaving(row.toolId);
        setRows((prev) => prev.map((r) => (r.toolId === row.toolId ? { ...r, toolEnabled: next } : r)));
        try {
            await setToolEnabled(row.toolId, next);
        } catch (e: any) {
            setError(e?.message || "Échec de l'enregistrement.");
            await load();
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-6 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Chargement de la boîte à outils…
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0">
                    <Wrench size={18} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">Boîte à outils des experts</h3>
                    <p className="text-xs text-slate-400 max-w-2xl">
                        Chaque case autorise un outil pour un expert. La modification prend effet
                        au prochain échange, sans redéploiement. Les outils marqués « Action »
                        écrivent dans l'application et demandent toujours l'accord de la personne
                        avant de s'exécuter.
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {rows.map((row) => {
                const meta = CATEGORY_META[row.category];
                return (
                    <div key={row.toolId} className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800/80 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-white">{row.displayName}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.tone}`}>
                                        {meta.icon} {meta.label}
                                    </span>
                                    {row.requiresConfirmation && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-1">
                                            <ShieldCheck size={11} /> Confirmation obligatoire
                                        </span>
                                    )}
                                    {row.requiresAuth && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300">
                                            Connexion requise
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{row.description}</p>
                            </div>

                            <button
                                onClick={() => toggleGlobal(row, !row.toolEnabled)}
                                disabled={saving === row.toolId}
                                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                                    row.toolEnabled
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title="Interrupteur global : coupe l'outil pour tous les experts"
                            >
                                {row.toolEnabled ? 'Actif globalement' : 'Coupé globalement'}
                            </button>
                        </div>

                        <div className={`p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 ${row.toolEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                            {experts.map((agent) => {
                                const granted = row.grants[agent.id] === true;
                                const key = `${agent.id}:${row.toolId}`;
                                return (
                                    <button
                                        key={agent.id}
                                        onClick={() => toggleGrant(row, agent.id, !granted)}
                                        disabled={saving === key}
                                        className={`p-2.5 rounded-xl border text-left transition-all ${
                                            granted
                                                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-[11px] font-bold truncate">{agent.name}</span>
                                            {granted && <Check size={12} className="text-blue-400 shrink-0" />}
                                        </div>
                                        <span className="text-[10px] text-slate-500 truncate block">{agent.specialty}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
