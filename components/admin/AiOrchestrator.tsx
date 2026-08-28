
import React, { useEffect, useState } from 'react';
import { BrainCircuit, Mic, Image as ImageIcon, Loader2, CheckCircle2, XCircle, KeyRound, ChevronUp, ChevronDown, ExternalLink, CreditCard, BookOpen, Sparkles, AlertTriangle, Search } from 'lucide-react';
import { AgentToolsMatrix } from './AgentToolsMatrix';
import {
    AiCategory,
    AiProviderRow,
    completeDiscoveredProvider,
    discoverProvider,
    listProviders,
    saveKeyTestAndActivate,
    setProviderEnabled,
    setProviderPriority,
    testProviderConnection,
} from '../../services/aiOrchestratorAdmin';

const AUTH_METHOD_LABEL: Record<string, string> = {
    api_key: 'Clé API',
    oauth2: 'OAuth2 (échange de jeton)',
    webhook: 'Webhook',
    mcp: 'Serveur MCP',
    unknown: 'Authentification inconnue',
};

// Assistant de découverte automatique : l'admin colle une URL, le système explore
// le site du fournisseur et fait apparaître une fiche prête à l'emploi plus bas
// dans la liste (catégorie détectée), sans qu'aucun code n'ait été écrit pour lui.
const ProviderDiscoveryPanel: React.FC<{ onDiscovered: () => void }> = ({ onDiscovered }) => {
    const [url, setUrl] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

    const handleAnalyze = async () => {
        if (!url.trim()) return;
        setAnalyzing(true);
        setResult(null);
        try {
            const r = await discoverProvider(url.trim());
            const categoryLabel = r.category === 'llm' ? 'Modèles de langage' : r.category === 'voice' ? 'Voix & audio' : 'Image & vidéo';
            const details = [
                r.modelsDetected > 0 ? `${r.modelsDetected} modèle(s) détecté(s)` : null,
                r.pricingSummary ? `tarifs : ${r.pricingSummary}` : null,
                `auth : ${AUTH_METHOD_LABEL[r.authMethod] ?? r.authMethod}`,
            ].filter(Boolean).join(' · ');
            setResult({
                ok: true,
                message: r.discoveryStatus === 'ready'
                    ? `« ${r.displayName} » analysé et prêt (${categoryLabel}). ${details}. Collez sa clé API ci-dessous : elle sera testée et le fournisseur activé automatiquement si elle est valide.`
                    : `« ${r.displayName} » repéré (${categoryLabel}), mais certaines informations restent à préciser (voir sa fiche ci-dessous). ${details}.`,
            });
            setUrl('');
            onDiscovered();
        } catch (err: any) {
            setResult({ ok: false, message: err?.message || "Échec de l'analyse du site." });
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Sparkles size={18} /> Ajouter un fournisseur automatiquement
            </div>
            <p className="text-sm text-blue-800/80">
                Collez uniquement l'URL du site du fournisseur (ex. <span className="font-mono">heygen.com</span>). Le système explore le site,
                retrouve la doc développeur, la création de compte, la génération de clé, les tarifs et l'endpoint principal — puis génère une
                fiche prête à l'emploi, sans écrire de code.
            </p>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                        placeholder="https://exemple-fournisseur.com"
                        className="w-full pl-9 pr-3 py-2 border border-blue-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={analyzing || !url.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center gap-2 shrink-0"
                >
                    {analyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                    {analyzing ? 'Analyse en cours…' : 'Analyser'}
                </button>
            </div>
            {result && (
                <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {result.ok ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
                    {result.message}
                </div>
            )}
        </div>
    );
};

// Mini-assistant affiché uniquement pour un fournisseur découvert dont la config
// technique est incomplète : liste ce qui manque, laisse l'admin fournir la seule
// information impossible à deviner automatiquement (forme exacte de l'endpoint).
const MissingInfoForm: React.FC<{ provider: AiProviderRow; onSaved: () => void }> = ({ provider, onSaved }) => {
    const [advancedJson, setAdvancedJson] = useState('{\n  "path": "/v1/generate",\n  "method": "POST",\n  "responseTextPath": "data.text"\n}');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const patch = JSON.parse(advancedJson);
            await completeDiscoveredProvider(provider.id, patch);
            onSaved();
        } catch (err: any) {
            setError(err?.message || 'JSON invalide ou échec de l\'enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <AlertTriangle size={14} /> Informations manquantes pour activer ce fournisseur
            </div>
            <ul className="text-xs text-amber-900/80 space-y-1 list-disc list-inside">
                {provider.missingFields.map((f) => (
                    <li key={f.key}><span className="font-semibold">{f.label}</span> — {f.hint}</li>
                ))}
            </ul>
            <p className="text-[11px] text-amber-700">
                Complétez la configuration technique ci-dessous (consultez la doc du fournisseur — bouton « Doc » ci-dessus) puis enregistrez.
            </p>
            <textarea
                value={advancedJson}
                onChange={(e) => setAdvancedJson(e.target.value)}
                rows={5}
                className="w-full font-mono text-[11px] border border-amber-300 rounded-lg p-2 bg-white"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 disabled:opacity-40"
            >
                {saving ? 'Enregistrement…' : 'Enregistrer et activer'}
            </button>
        </div>
    );
};

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
    const needsDiscoveryInfo = provider.adapterKind === 'generic_http' && provider.discoveryStatus === 'needs_info';
    const notConfigured = provider.status === 'not_implemented' && !needsDiscoveryInfo;

    // Enregistre la clé, la teste immédiatement et active le fournisseur si le
    // test réussit — l'admin n'a rien d'autre à faire pour qu'il devienne
    // opérationnel dans toute l'application.
    const handleSaveKey = async () => {
        if (!keyInput.trim()) return;
        setSaving(true);
        setTestResult(null);
        try {
            const result = await saveKeyTestAndActivate(provider.id, keyInput.trim());
            setKeyInput('');
            setTestResult(result.ok
                ? { ok: true, message: `${result.message} Fournisseur activé — utilisable partout dans l'application.` }
                : { ok: false, message: `${result.message} La clé est enregistrée mais le fournisseur n'a pas été activé automatiquement — corrigez puis testez à nouveau.` });
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
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">{provider.displayName}</h3>
                    {provider.adapterKind === 'generic_http' && (
                        <span title="Ajouté par découverte automatique" className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                            <Sparkles size={11} /> Auto
                        </span>
                    )}
                    {provider.docsUrl && (
                        <a
                            href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
                            title="Documentation développeur"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:underline"
                        >
                            <BookOpen size={11} /> Doc <ExternalLink size={10} />
                        </a>
                    )}
                    {provider.apiKeyUrl && (
                        <a
                            href={provider.apiKeyUrl} target="_blank" rel="noopener noreferrer"
                            title="Créer / gérer la clé API chez ce fournisseur"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                        >
                            <KeyRound size={11} /> Clé API <ExternalLink size={10} />
                        </a>
                    )}
                    {provider.billingUrl && (
                        <a
                            href={provider.billingUrl} target="_blank" rel="noopener noreferrer"
                            title="Facturation / recharge de crédits / abonnement chez ce fournisseur"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline"
                        >
                            <CreditCard size={11} /> Facturation <ExternalLink size={10} />
                        </a>
                    )}
                    {provider.adapterKind === 'generic_http' && provider.authMethod !== 'unknown' && (
                        <span
                            title={provider.authMethod === 'api_key' ? 'Authentification par clé statique — gérée automatiquement.' : 'Ce mode d\'authentification nécessite une intervention manuelle (voir la fiche ci-dessous).'}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${provider.authMethod === 'api_key' ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-700'}`}
                        >
                            {AUTH_METHOD_LABEL[provider.authMethod]}
                        </span>
                    )}
                    {needsDiscoveryInfo ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Info technique manquante</span>
                    ) : notConfigured ? (
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

            {needsDiscoveryInfo && <MissingInfoForm provider={provider} onSaved={onChanged} />}

            {!notConfigured && (
                <>
                    {provider.models.length > 0 && (
                        <p className="text-xs text-slate-500">
                            Modèle par défaut : <span className="font-mono">{provider.models.find((m) => m.isDefault)?.modelId || provider.models[0].modelId}</span>
                            {provider.models.length > 1 && <span className="text-slate-400"> (+{provider.models.length - 1} autre{provider.models.length > 2 ? 's' : ''})</span>}
                        </p>
                    )}
                    {provider.pricingSummary && (
                        <p className="text-xs text-slate-500 italic">Tarifs : {provider.pricingSummary}</p>
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
            <ProviderDiscoveryPanel onDiscovered={load} />
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

            <div className="pt-2 border-t border-slate-200">
                <AgentToolsMatrix />
            </div>
        </div>
    );
};
