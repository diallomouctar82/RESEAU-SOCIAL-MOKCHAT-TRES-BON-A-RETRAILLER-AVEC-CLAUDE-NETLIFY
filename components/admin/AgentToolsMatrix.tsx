import React, { useEffect, useState } from 'react';
import { Wrench, Globe, FolderOpen, Zap, ShieldCheck, Loader2, AlertTriangle, Check, Bot, UserCheck, Cpu } from 'lucide-react';
import { listToolMatrix, setAgentToolEnabled, setToolEnabled, ToolMatrixRow } from '../../services/aiOrchestratorAdmin';
import { AGENTS } from '../../constants';
import { Agent } from '../../types';

// Matrice experts x outils. Chaque case est une autorisation stockée en base :
// la modifier prend effet au prochain appel de l'expert concerné, sans
// redéploiement ni modification de code.

const CATEGORY_META: Record<ToolMatrixRow['category'], { label: string; icon: React.ReactNode; tone: string }> = {
    search: { label: 'Recherche', icon: <Globe size={13} />, tone: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
    read: { label: 'Lecture', icon: <FolderOpen size={13} />, tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    action: { label: 'Action', icon: <Zap size={13} />, tone: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
};

const AVAILABILITY_META: Record<NonNullable<Agent['availabilityStatus']>, { label: string; tone: string }> = {
    available: { label: 'Disponible', tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
    in_call: { label: 'En appel', tone: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
    appointment_only: { label: 'Sur rendez-vous', tone: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
};

// Moteur RÉEL des experts IA : ChatInterface passe par generateTextDetailed
// (services/aiGateway) SANS modelId épinglé — c'est l'orchestrateur central
// (registre Super-Admin) qui sélectionne le fournisseur actif. Le
// modelConfig.model historique de constants.ts n'est PAS utilisé par le chat :
// l'afficher ici serait une information fausse.
const AI_ENGINE_LABEL = 'Orchestrateur central (sélection auto)';

const HUMAN_BADGE_LABEL = 'Humain — pas d’outils IA';

export const AgentToolsMatrix: React.FC = () => {
    const [rows, setRows] = useState<ToolMatrixRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    // La vue Super-Admin couvre les 13 assistants du catalogue : les experts
    // humains y apparaissent distinctement badgés, sans interrupteur d'outil
    // (un humain n'utilise pas d'outil de l'orchestrateur).
    const allAgents = AGENTS;
    const aiAgentsCount = AGENTS.filter((a) => !a.isHuman).length;

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
                        Les {allAgents.length} assistants du catalogue ({aiAgentsCount} experts IA, {allAgents.length - aiAgentsCount} humains vérifiés).
                        Chaque case autorise un outil pour un expert IA — la modification prend effet
                        au prochain échange, sans redéploiement. Les outils marqués « Action »
                        écrivent dans l'application et demandent toujours l'accord de la personne
                        avant de s'exécuter. Les experts humains n'ont pas d'outils IA.
                    </p>
                </div>
            </div>

            {/* Effectif complet : statut de disponibilité et moteur réel de
                chaque assistant. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allAgents.map((agent) => {
                    const availability = agent.availabilityStatus ? AVAILABILITY_META[agent.availabilityStatus] : null;
                    return (
                        <div key={`roster-${agent.id}`} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-white truncate">{agent.name}</span>
                                {agent.isHuman ? (
                                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center gap-1">
                                        <UserCheck size={11} /> {HUMAN_BADGE_LABEL}
                                    </span>
                                ) : (
                                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-300 flex items-center gap-1">
                                        <Bot size={11} /> Expert IA
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate block mt-0.5">{agent.specialty}</span>
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                {availability && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${availability.tone}`}>
                                        {availability.label}
                                    </span>
                                )}
                                {!agent.isHuman && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300 flex items-center gap-1">
                                        <Cpu size={11} /> {AI_ENGINE_LABEL}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
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
                                className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 disabled:opacity-50 ${
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
                            {allAgents.map((agent) => {
                                // Expert humain : cellule inerte, badge distinctif,
                                // jamais d'interrupteur d'outil.
                                if (agent.isHuman) {
                                    return (
                                        <div
                                            key={agent.id}
                                            className="p-2.5 rounded-xl border border-dashed border-amber-500/25 bg-slate-900/40 text-left"
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[11px] font-bold truncate text-slate-400">{agent.name}</span>
                                                <UserCheck size={12} className="text-amber-400/70 shrink-0" />
                                            </div>
                                            <span className="text-[10px] text-amber-300/70 truncate block">{HUMAN_BADGE_LABEL}</span>
                                        </div>
                                    );
                                }
                                const granted = row.grants[agent.id] === true;
                                const key = `${agent.id}:${row.toolId}`;
                                return (
                                    <button
                                        key={agent.id}
                                        onClick={() => toggleGrant(row, agent.id, !granted)}
                                        disabled={saving === key}
                                        className={`p-2.5 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 disabled:opacity-50 ${
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
