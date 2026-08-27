import React, { useEffect, useRef, useState } from 'react';
import {
    AlertOctagon, AlertTriangle, ExternalLink, FileText, Home, Loader2,
    MapPin, Search, ShieldAlert, Sparkles, Trash2,
} from 'lucide-react';
import { UserProfile, ScamAnalysis } from '../types';
import { AIProxyClient } from '../services/aiProxy';
import { useModuleRecords } from '../hooks/useModuleRecords';
import { LIFE_OFFICIAL_SOURCES, LEGAL_DISCLAIMER } from '../services/lifeSources';
import { ModuleSyncStatus } from './life/ModuleSyncStatus';

interface HousingCenterProps { userProfile: UserProfile; }
interface HousingSearchRecord { country: string; city: string; monthlyBudget: number; rooms: number; createdAt: string; }
interface HousingScamRecord { excerpt: string; result: ScamAnalysis; createdAt: string; }
interface HousingDossierRecord { letter: string; createdAt: string; }

export const HousingCenter: React.FC<HousingCenterProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'scam-check' | 'dossier'>('search');
    const [country, setCountry] = useState('France');
    const [city, setCity] = useState('');
    const [monthlyBudget, setMonthlyBudget] = useState('');
    const [rooms, setRooms] = useState('1');
    const [formError, setFormError] = useState<string | null>(null);
    const [adText, setAdText] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scamResult, setScamResult] = useState<ScamAnalysis | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [dossierText, setDossierText] = useState<string | null>(null);
    const dossierHydratedRef = useRef(false);
    const scamHydratedRef = useRef(false);

    const searches = useModuleRecords<HousingSearchRecord>('housing', 'saved_search', userProfile.id);
    const scamChecks = useModuleRecords<HousingScamRecord>('housing', 'scam_check', userProfile.id);
    const dossiers = useModuleRecords<HousingDossierRecord>('housing', 'tenant_letter', userProfile.id);

    useEffect(() => {
        if (dossierHydratedRef.current || dossiers.isLoading) return;
        dossierHydratedRef.current = true;
        const latest = dossiers.records[0]?.payload.letter;
        if (latest) setDossierText(latest);
    }, [dossiers.isLoading, dossiers.records]);

    useEffect(() => {
        if (scamHydratedRef.current || scamChecks.isLoading) return;
        scamHydratedRef.current = true;
        const latest = scamChecks.records[0]?.payload;
        if (latest) {
            setAdText(latest.excerpt);
            setScamResult(latest.result);
        }
    }, [scamChecks.isLoading, scamChecks.records]);

    const handleSaveSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        const budget = Number(monthlyBudget);
        const roomCount = Number(rooms);
        if (!city.trim() || !Number.isFinite(budget) || budget <= 0 || !Number.isInteger(roomCount) || roomCount < 1) {
            setFormError('Indiquez une ville, un budget mensuel positif et un nombre de pièces valide.');
            return;
        }
        setFormError(null);
        try {
            await searches.save({ country: country.trim(), city: city.trim(), monthlyBudget: budget, rooms: roomCount, createdAt: new Date().toISOString() });
            setCity('');
            setMonthlyBudget('');
        } catch { /* Le statut partagé expose l'erreur de synchronisation. */ }
    };

    const handleScamCheck = async () => {
        if (!adText.trim()) return;
        setIsScanning(true);
        setScamResult(null);
        setActionError(null);
        try {
            const ai = new AIProxyClient();
            const prompt = `Agis comme Monsieur Diallo, expert logement. Analyse uniquement les signaux de risque du texte suivant, sans certifier l'annonce ni l'identité de son auteur :
            "${adText.slice(0, 1000)}"
            Recherche les paiements anticipés, mandats cash, urgence artificielle, propriétaire absent, prix incohérent et refus de visite.
            Réponds en JSON strict : { "riskScore": number, "verdict": "Safe" | "Suspicious" | "Scam", "redFlags": ["signal vérifiable"], "advice": "mesure de prudence sans garantie" }`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
            const result = JSON.parse(response.text || '{}') as ScamAnalysis;
            if (!Number.isFinite(result.riskScore) || !['Safe', 'Suspicious', 'Scam'].includes(result.verdict) || !Array.isArray(result.redFlags)) throw new Error('INVALID_SCAM_ANALYSIS');
            setScamResult(result);
            await scamChecks.save({ excerpt: adText.slice(0, 500), result, createdAt: new Date().toISOString() });
        } catch (error) {
            console.error(error);
            setActionError("L'analyse n'a pas abouti. Ne versez aucun paiement avant une visite et une vérification d'identité.");
        } finally { setIsScanning(false); }
    };

    const handleGenerateDossier = async () => {
        setIsGeneratingDossier(true);
        setActionError(null);
        try {
            const ai = new AIProxyClient();
            const prompt = `Agis comme Monsieur Diallo. Rédige une lettre factuelle de présentation pour un dossier de location.
            Nom : ${userProfile.name}
            Titre : ${userProfile.title}
            N'invente ni revenu, ni garant, ni pièce justificative, ni référence juridique. Prévois des champs [À COMPLÉTER] quand une donnée manque. Ton professionnel, sobre et respectueux.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const letter = response.text?.trim();
            if (!letter) throw new Error('EMPTY_LETTER');
            setDossierText(letter);
            await dossiers.save({ letter, createdAt: new Date().toISOString() });
        } catch (error) {
            console.error(error);
            setActionError("La lettre n'a pas pu être générée. Aucune information n'a été inventée ni enregistrée.");
        } finally { setIsGeneratingDossier(false); }
    };

    const downloadLetter = () => {
        if (!dossierText) return;
        const url = URL.createObjectURL(new Blob([dossierText], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'lettre-dossier-locataire.txt';
        link.click();
        URL.revokeObjectURL(url);
    };

    const phases = [searches.syncPhase, scamChecks.syncPhase, dossiers.syncPhase];
    const syncPhase = phases.includes('error') ? 'error' : phases.includes('offline') ? 'offline' : phases.includes('syncing') ? 'syncing' : 'idle';
    const retryHousingSync = async () => {
        await searches.retrySync();
        await Promise.all([scamChecks.reload(), dossiers.reload()]);
    };

    return (
        <div className="flex h-full flex-col bg-slate-50 animate-fade-up">
            <div className="border-b border-slate-200 bg-white px-6 py-6 text-slate-900 shadow-xs">
                <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div><div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-900"><Home size={14} className="text-blue-700" /> Logement & Installation</div><h1 className="text-2xl font-black">Préparez votre recherche de logement</h1><p className="mt-1 max-w-xl text-xs text-slate-600">Recherches enregistrées, dossier locataire factuel et repérage des risques d'arnaque.</p></div>
                    <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
                        {([['search', 'Recherche'], ['scam-check', 'Anti-Arnaque'], ['dossier', 'Mon Dossier']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`px-4 py-2 text-xs font-bold ${activeTab === id ? 'rounded-lg bg-blue-900 text-white' : 'text-slate-700'}`}>{label}</button>)}
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-5xl px-6 pt-4"><ModuleSyncStatus phase={syncPhase} isLoading={searches.isLoading || scamChecks.isLoading || dossiers.isLoading} error={searches.error || scamChecks.error || dossiers.error} hasQueuedChanges={searches.hasQueuedChanges || scamChecks.hasQueuedChanges || dossiers.hasQueuedChanges} onRetry={() => void retryHousingSync()} /></div>

            <div className="flex-1 overflow-y-auto p-6"><div className="mx-auto max-w-5xl">
                {activeTab === 'search' && <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <form onSubmit={handleSaveSearch} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                        <h2 className="flex items-center gap-2 text-xl font-bold"><Search size={20} /> Enregistrer une recherche</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-sm font-bold text-slate-700">Pays<input value={country} onChange={(event) => setCountry(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" /></label>
                            <label className="text-sm font-bold text-slate-700">Ville ou zone<input value={city} onChange={(event) => setCity(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" required /></label>
                            <label className="text-sm font-bold text-slate-700">Budget mensuel<input type="number" min="1" value={monthlyBudget} onChange={(event) => setMonthlyBudget(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" required /></label>
                            <label className="text-sm font-bold text-slate-700">Pièces minimum<input type="number" min="1" step="1" value={rooms} onChange={(event) => setRooms(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" required /></label>
                        </div>
                        {formError && <p role="alert" className="text-sm font-semibold text-red-700">{formError}</p>}
                        <button type="submit" className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white">Enregistrer la recherche</button>
                    </form>
                    <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-bold">Aides et droits officiels</h3><p className="text-sm text-slate-600">Aucun montant d'aide n'est estimé sans le calculateur de l'autorité compétente.</p><a href={LIFE_OFFICIAL_SOURCES.housing.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-sm font-bold text-white">Ouvrir le portail officiel <ExternalLink size={15} /></a><p className="text-xs text-slate-500">{LIFE_OFFICIAL_SOURCES.housing.scope}</p></aside>
                    <section className="space-y-3 lg:col-span-3" aria-labelledby="saved-housing-searches"><h2 id="saved-housing-searches" className="text-lg font-bold">Mes recherches enregistrées</h2>{!searches.isLoading && searches.records.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Aucune recherche enregistrée.</p>}{searches.records.map((record) => <article key={record.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"><div><p className="font-bold"><MapPin size={15} className="mr-1 inline" />{record.payload.city}, {record.payload.country}</p><p className="text-sm text-slate-500">Budget : {record.payload.monthlyBudget} / mois · {record.payload.rooms} pièce(s) minimum</p></div><button type="button" onClick={() => void searches.remove(record.id)} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-bold text-red-700"><Trash2 size={15} /> Supprimer</button></article>)}</section>
                </div>}

                {activeTab === 'scam-check' && <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-6 text-center"><ShieldAlert size={40} className="mx-auto mb-3 text-red-600" /><h2 className="text-2xl font-bold">Repérer les signaux d'arnaque</h2><p className="text-sm text-slate-500">L'analyse ne certifie jamais une annonce.</p></div><textarea value={adText} onChange={(event) => setAdText(event.target.value)} className="mb-4 h-40 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm" placeholder="Collez le texte de l'annonce…" /><button type="button" onClick={handleScamCheck} disabled={!adText.trim() || isScanning} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">{isScanning ? <Loader2 className="animate-spin" /> : <AlertOctagon />} {isScanning ? 'Analyse en cours…' : "Vérifier l'annonce"}</button>{actionError && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{actionError}</p>}{scamResult && <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6"><h3 className="text-xl font-black">Risque estimé : {scamResult.riskScore}/100</h3><p className="font-bold">{scamResult.verdict}</p><ul className="space-y-2">{scamResult.redFlags.map((flag) => <li key={flag} className="flex gap-2 text-sm text-red-700"><AlertTriangle size={15} /> {flag}</li>)}</ul><p className="text-sm text-slate-700">{scamResult.advice}</p><p className="text-xs font-semibold text-amber-900">Une visite, la vérification de l'identité et un contrat restent indispensables.</p></div>}</div>}

                {activeTab === 'dossier' && <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2"><div><h2 className="mb-4 text-2xl font-bold">Votre dossier locataire</h2><p className="mb-6 text-slate-500">La lettre utilise uniquement votre nom et votre titre. Les éléments manquants restent explicitement à compléter.</p><button type="button" onClick={handleGenerateDossier} disabled={isGeneratingDossier} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white disabled:bg-slate-300">{isGeneratingDossier ? <Loader2 className="animate-spin" /> : <Sparkles />} {isGeneratingDossier ? 'Rédaction…' : 'Générer ma lettre'}</button>{actionError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{actionError}</p>}<p className="mt-4 text-xs text-slate-500">{LEGAL_DISCLAIMER}</p></div><div className="min-h-[400px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">{dossierText ? <div className="flex h-full flex-col"><div className="flex-1 whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-800">{dossierText}</div><div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"><button type="button" onClick={() => void navigator.clipboard.writeText(dossierText)} className="rounded-lg px-4 py-2 text-sm font-bold">Copier</button><button type="button" onClick={downloadLetter} className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-bold text-white">Télécharger</button></div></div> : <div className="flex h-full flex-col items-center justify-center text-center text-slate-400"><FileText size={48} className="mb-4 opacity-30" /><p>Aucune lettre enregistrée.</p></div>}</div></div>}
            </div></div>
        </div>
    );
};
