
import React, { useEffect, useState } from 'react';
import { BrainCircuit, Mic, Image as ImageIcon, Loader2, CheckCircle2, XCircle, KeyRound, ChevronUp, ChevronDown } from 'lucide-react';
import {
    AiCategory,
    AiProviderRow,
    listProviders,
    setProviderEnabled,
    setProviderPriority,
    setProviderSecret,
    testProviderConnection,
} from '../../services/aiOrchestratorAdmin';

const CATEGORY_META: Record<AiCategory, { label: string; icon: React.ReactNode }> = {
    llm: { label: 'Modèles de langage (LLM)', icon: <BrainCircuit size={18} /> },
    voice: { label: 'Voix & audio', icon: <Mic size={18} /> },
    image_video: { label: 'Image & vidéo', icon: <ImageIcon size={18} /> },
};

const ProviderCard: React.FC<{ provider: AiProviderRow; onChanged: () => void }> = ({ provider, onChanged }) => {
    const [keyInput, setKeyInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
    const notConfigured = provider.status === 'not_implemented';

    const handleSaveKey = async () => {
        if (!keyInput.trim()) return;
        setSaving(true);
        try {
            await setProviderSecret(provider.id, keyInput.trim());
            setKeyInput('');
            onChanged();
        } catch (err: any) {
            setTestResult({ ok: false, message: err?.message || "Échec de l'enregistrement de la clé." });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEnabled = async () => {
        setSaving(true);
        try {
            await setProviderEnabled(provider.id, !provider.isEnabled);
            onChanged();
        } catch (err: any) {
            setTestResult({ ok: false, message: err?.message || "Échec du changement d'état." });
        } finally {
            setSaving(false);
        }
    };

    const handlePriority = async (delta: number) => {
        setSaving(true);
        try {
            await setProviderPriority(provider.id, provider.priority + delta);
            onChanged();
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await testProviderConnection(provider.id);
            setTestResult(result);
            onChanged();
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className={`bg-white border rounded-2xl p-5 space-y-3 ${notConfigured ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{provider.displayName}</h3>
                    {notConfigured ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Bientôt disponible</span>
                    ) : provider.isEnabled ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Actif</span>
                    ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Non configuré</span>
                    )}
                </div>
                {!notConfigured && (
                    <div className="flex items-center gap-1 text-slate-400">
                        <button onClick={() => handlePriority(-10)} disabled={saving} title="Prioriser (essayé plus tôt)" className="p-1 hover:text-slate-700 disabled:opacity-40">
                            <ChevronUp size={16} />
                        </button>
                        <span className="text-xs font-mono w-6 text-center">{provider.priority}</span>
                        <button onClick={() => handlePriority(10)} disabled={saving} title="Déprioriser (essayé plus tard)" className="p-1 hover:text-slate-700 disabled:opacity-40">
                            <ChevronDown size={16} />
                        </button>
                    </div>
                )}
            </div>

            {!notConfigured && (
                <>
                    {provider.models.length > 0 && (
                        <p className="text-xs text-slate-500">
                            Modèle par défaut : <span className="font-mono">{provider.models.find((m) => m.isDefault)?.modelId || provider.models[0].modelId}</span>
                        </p>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder={provider.keyHint ? `Clé enregistrée (…${provider.keyHint})` : 'Clé API'}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleSaveKey}
                            disabled={saving || !keyInput.trim()}
                            className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 disabled:opacity-40"
                        >
                            {provider.keyHint ? 'Faire tourner' : 'Enregistrer'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={provider.isEnabled}
                                disabled={saving || !provider.keyHint}
                                onChange={handleToggleEnabled}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-40"
                            />
                            Activer
                        </label>
                        <button
                            onClick={handleTest}
                            disabled={testing || !provider.keyHint}
                            className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-40 flex items-center gap-1"
                        >
                            {testing ? <Loader2 className="animate-spin" size={14} /> : null}
                            Tester la connexion
                        </button>
                    </div>

                    {testResult && (
                        <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${testResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {testResult.ok ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
                            {testResult.message}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export const AiOrchestrator: React.FC = () => {
    const [providers, setProviders] = useState<AiProviderRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setProviders(await listProviders());
            setError(null);
        } catch (err: any) {
            setError(err?.message || 'Échec du chargement du catalogue.');
        }
    };

    useEffect(() => { load(); }, []);

    if (error) {
        return <div className="p-6 text-red-600 text-sm">{error}</div>;
    }
    if (!providers) {
        return <div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" /> Chargement de l'orchestrateur…</div>;
    }

    const categories: AiCategory[] = ['llm', 'voice', 'image_video'];

    return (
        <div className="space-y-8 animate-fade-up">
            <p className="text-sm text-slate-500">
                Chaque catégorie bascule automatiquement sur le fournisseur suivant (par priorité) en cas d'échec,
                d'indisponibilité ou de quota dépassé. Les clés ne sont jamais réaffichées après enregistrement.
            </p>
            {categories.map((cat) => {
                const rows = providers.filter((p) => p.category === cat);
                return (
                    <div key={cat}>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-3">
                            {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {rows.map((p) => (
                                <ProviderCard key={p.id} provider={p} onChanged={load} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
