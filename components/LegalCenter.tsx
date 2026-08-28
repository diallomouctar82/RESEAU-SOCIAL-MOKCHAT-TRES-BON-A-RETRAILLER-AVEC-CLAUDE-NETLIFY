import React, { useEffect, useRef, useState } from 'react';
import {
    AlertTriangle, CheckCircle, Clock, ExternalLink, FileText, Loader2,
    Plus, Scale, ScanText, Sparkles, Trash2, Upload,
} from 'lucide-react';
import { LegalDocAnalysis, UserProfile } from '../types';
import { AIProxyClient } from '../services/aiProxy';
import { useModuleRecords } from '../hooks/useModuleRecords';
import { LIFE_OFFICIAL_SOURCES, LEGAL_DISCLAIMER } from '../services/lifeSources';
import { ModuleSyncStatus } from './life/ModuleSyncStatus';

interface LegalCenterProps { userProfile: UserProfile; }
interface ProcedureRecord { title: string; category: string; status: 'pending' | 'blocked' | 'completed'; progress: number; nextStep: string; deadline: string; sourceUrl: string; createdAt: string; }
interface LegalScanRecord { fileName: string; result: LegalDocAnalysis; sourceUrl: string; createdAt: string; }
interface LegalLetterRecord { subject: string; letter: string; sourceUrl: string; createdAt: string; }

export const LegalCenter: React.FC<LegalCenterProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'writer'>('dashboard');
    const [showProcedureForm, setShowProcedureForm] = useState(false);
    const [procedureTitle, setProcedureTitle] = useState('');
    const [procedureCategory, setProcedureCategory] = useState('Démarche administrative');
    const [procedureNextStep, setProcedureNextStep] = useState('');
    const [procedureDeadline, setProcedureDeadline] = useState('');
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<LegalDocAnalysis | null>(null);
    const [writerSubject, setWriterSubject] = useState('');
    const [isWriting, setIsWriting] = useState(false);
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const letterHydratedRef = useRef(false);
    const scanHydratedRef = useRef(false);

    const procedures = useModuleRecords<ProcedureRecord>('legal', 'procedure', userProfile.id);
    const scans = useModuleRecords<LegalScanRecord>('legal', 'document_analysis', userProfile.id);
    const letters = useModuleRecords<LegalLetterRecord>('legal', 'official_letter', userProfile.id);

    useEffect(() => {
        if (letterHydratedRef.current || letters.isLoading) return;
        letterHydratedRef.current = true;
        const latest = letters.records[0]?.payload.letter;
        if (latest) setGeneratedLetter(latest);
    }, [letters.isLoading, letters.records]);

    useEffect(() => {
        if (scanHydratedRef.current || scans.isLoading) return;
        scanHydratedRef.current = true;
        const latest = scans.records[0]?.payload.result;
        if (latest) setScanResult(latest);
    }, [scans.isLoading, scans.records]);

    const saveProcedure = async (event: React.FormEvent) => {
        event.preventDefault();
        setActionError(null);
        if (!procedureTitle.trim() || !procedureNextStep.trim()) {
            setActionError('Le titre et la prochaine étape sont obligatoires.');
            return;
        }
        try {
            await procedures.save({
                title: procedureTitle.trim(), category: procedureCategory.trim(), status: 'pending', progress: 0,
                nextStep: procedureNextStep.trim(), deadline: procedureDeadline || 'Non renseignée',
                sourceUrl: LIFE_OFFICIAL_SOURCES.legal.url, createdAt: new Date().toISOString(),
            });
            setProcedureTitle(''); setProcedureNextStep(''); setProcedureDeadline(''); setShowProcedureForm(false);
        } catch { /* Le statut partagé expose l'erreur. */ }
    };

    const advanceProcedure = async (id: string, record: ProcedureRecord) => {
        const progress = Math.min(100, record.progress + 25);
        await procedures.save({ ...record, progress, status: progress === 100 ? 'completed' : 'pending' }, { id, status: progress === 100 ? 'completed' : 'active' });
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setActionError(null);
        setScanResult(null);
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            setActionError('Sélectionnez une image JPEG, PNG ou WebP de 5 Mo maximum.');
            return;
        }
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setScannedImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAnalyzeDoc = async () => {
        if (!scannedImage || !selectedFile) return;
        setIsScanning(true); setScanResult(null); setActionError(null);
        try {
            const ai = new AIProxyClient();
            const prompt = `Agis comme Maître Diallo. Aide à comprendre ce document sans rendre d'avis juridique définitif.
            N'invente aucune date, obligation, autorité, référence ou voie de recours. Si une information est illisible ou incertaine, indique explicitement "À vérifier sur le document original ou auprès de l'autorité".
            Réponds en JSON strict : { "documentType": "type ou inconnu", "summary": "résumé factuel", "explanation": "explication prudente", "actionRequired": boolean, "deadline": "date visible ou À vérifier" }`;
            const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [{ inlineData: { mimeType: selectedFile.type, data: scannedImage.split(',')[1] } }, { text: prompt }] }, config: { responseMimeType: 'application/json' } });
            const result = JSON.parse(response.text || '{}') as LegalDocAnalysis;
            if (!result.documentType || !result.summary || !result.explanation || typeof result.actionRequired !== 'boolean') throw new Error('INVALID_LEGAL_ANALYSIS');
            setScanResult(result);
            await scans.save({ fileName: selectedFile.name, result, sourceUrl: LIFE_OFFICIAL_SOURCES.legal.url, createdAt: new Date().toISOString() });
        } catch (error) {
            console.error(error);
            setActionError("Le document n'a pas pu être analysé. Vérifiez directement l'original et contactez l'autorité émettrice.");
        } finally { setIsScanning(false); }
    };

    const handleGenerateLetter = async () => {
        if (!writerSubject.trim()) return;
        setIsWriting(true); setGeneratedLetter(''); setActionError(null);
        try {
            const ai = new AIProxyClient();
            const prompt = `Agis comme Maître Diallo. Rédige un modèle de courrier administratif pour le sujet suivant : "${writerSubject.slice(0, 1000)}".
            Expéditeur : ${userProfile.name}.
            N'invente aucune adresse, date, numéro de dossier, fait, article de loi ou jurisprudence. Utilise [À COMPLÉTER] pour les informations absentes. Ajoute une phrase invitant à vérifier la procédure sur ${LIFE_OFFICIAL_SOURCES.legal.url}.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const letter = response.text?.trim();
            if (!letter) throw new Error('EMPTY_LEGAL_LETTER');
            setGeneratedLetter(letter);
            await letters.save({ subject: writerSubject.trim(), letter, sourceUrl: LIFE_OFFICIAL_SOURCES.legal.url, createdAt: new Date().toISOString() });
        } catch (error) {
            console.error(error);
            setActionError("Le modèle n'a pas pu être produit. Aucun contenu juridique n'a été inventé ni enregistré.");
        } finally { setIsWriting(false); }
    };

    const downloadLetter = () => {
        if (!generatedLetter) return;
        const url = URL.createObjectURL(new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'courrier-administratif.txt'; link.click(); URL.revokeObjectURL(url);
    };

    const phases = [procedures.syncPhase, scans.syncPhase, letters.syncPhase];
    const syncPhase = phases.includes('error') ? 'error' : phases.includes('offline') ? 'offline' : phases.includes('syncing') ? 'syncing' : 'idle';
    const inProgress = procedures.records.filter(({ payload }) => payload.status === 'pending').length;
    const blocked = procedures.records.filter(({ payload }) => payload.status === 'blocked').length;
    const completed = procedures.records.filter(({ payload }) => payload.status === 'completed').length;
    const retryLegalSync = async () => {
        await procedures.retrySync();
        await Promise.all([scans.reload(), letters.reload()]);
    };

    return <div className="flex h-full flex-col bg-slate-50 animate-fade-up">
        <div className="bg-slate-900 p-8 text-white shadow-lg"><div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300"><Scale size={14} /> Espace juridique & administratif</div><h1 className="text-3xl font-bold">Démarches accompagnées</h1><p className="mt-2 max-w-xl text-slate-300">Suivi persistant, modèles prudents et accès aux sources officielles configurées.</p></div><div className="flex gap-2 rounded-xl bg-white/10 p-1">{([['dashboard', 'Mes procédures'], ['scanner', 'Scanner'], ['writer', 'Rédiger']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`rounded-lg px-5 py-2 text-sm font-bold ${activeTab === id ? 'bg-brand-600 text-white' : 'text-white'}`}>{label}</button>)}</div></div></div>
        <div className="mx-auto w-full max-w-5xl px-6 pt-4"><ModuleSyncStatus phase={syncPhase} isLoading={procedures.isLoading || scans.isLoading || letters.isLoading} error={procedures.error || scans.error || letters.error} hasQueuedChanges={procedures.hasQueuedChanges || scans.hasQueuedChanges || letters.hasQueuedChanges} onRetry={() => void retryLegalSync()} /></div>
        <div className="flex-1 overflow-y-auto p-6"><div className="mx-auto max-w-5xl">
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">{LEGAL_DISCLAIMER}</p><a href={LIFE_OFFICIAL_SOURCES.legal.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold underline">{LIFE_OFFICIAL_SOURCES.legal.label} <ExternalLink size={13} /></a><p className="mt-1 text-xs">{LIFE_OFFICIAL_SOURCES.legal.scope}</p></div>
            {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{actionError}</p>}

            {activeTab === 'dashboard' && <div className="space-y-6"><div className="grid grid-cols-3 gap-4"><div className="rounded-xl bg-blue-50 p-4"><div className="text-2xl font-black text-blue-700">{inProgress}</div><div className="text-xs font-bold uppercase text-blue-500">En cours</div></div><div className="rounded-xl bg-orange-50 p-4"><div className="text-2xl font-black text-orange-700">{blocked}</div><div className="text-xs font-bold uppercase text-orange-500">Bloquées</div></div><div className="rounded-xl bg-green-50 p-4"><div className="text-2xl font-black text-green-700">{completed}</div><div className="text-xs font-bold uppercase text-green-500">Terminées</div></div></div>
                <button type="button" onClick={() => setShowProcedureForm((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white"><Plus size={17} /> Nouvelle procédure</button>
                {showProcedureForm && <form onSubmit={saveProcedure} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2"><label className="text-sm font-bold">Titre<input value={procedureTitle} onChange={(event) => setProcedureTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" required /></label><label className="text-sm font-bold">Catégorie<input value={procedureCategory} onChange={(event) => setProcedureCategory(event.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label><label className="text-sm font-bold">Prochaine étape<input value={procedureNextStep} onChange={(event) => setProcedureNextStep(event.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" required /></label><label className="text-sm font-bold">Échéance connue<input type="date" value={procedureDeadline} onChange={(event) => setProcedureDeadline(event.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label><button type="submit" className="rounded-xl bg-brand-600 py-3 font-bold text-white md:col-span-2">Enregistrer</button></form>}
                {!procedures.isLoading && procedures.records.length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-slate-500">Aucune procédure enregistrée.</div>}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{procedures.records.map((record) => { const procedure = record.payload; return <article key={record.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="h-2 bg-slate-100"><div className="h-full bg-brand-600" style={{ width: `${procedure.progress}%` }} /></div><div className="space-y-3 p-5"><div className="flex justify-between"><span className="rounded bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase text-brand-700">{procedure.category}</span>{procedure.status === 'completed' ? <CheckCircle size={17} className="text-green-600" /> : <Clock size={17} className="text-slate-500" />}</div><h3 className="font-bold">{procedure.title}</h3><p className="text-sm text-slate-600">{procedure.nextStep}</p><p className="text-xs text-slate-500">Échéance : {procedure.deadline}</p><div className="flex gap-2"><button type="button" disabled={procedure.status === 'completed'} onClick={() => void advanceProcedure(record.id, procedure)} className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">{procedure.status === 'completed' ? 'Terminée' : 'Valider une étape'}</button><button type="button" onClick={() => void procedures.remove(record.id)} className="rounded-lg px-3 text-red-700" aria-label={`Supprimer ${procedure.title}`}><Trash2 size={16} /></button></div></div></article>; })}</div>
            </div>}

            {activeTab === 'scanner' && <div className="grid gap-8 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="mb-2 flex items-center gap-2 text-xl font-bold"><ScanText className="text-brand-600" /> Comprendre un document</h2><p className="mb-6 text-sm text-slate-500">L'image reste en mémoire de session ; seule l'analyse textuelle est enregistrée.</p><button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-52 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-5">{scannedImage ? <img src={scannedImage} alt="Document sélectionné" className="max-h-64" /> : <span className="flex flex-col items-center gap-2 text-slate-500"><Upload size={38} /> Sélectionner une image</span>}</button><input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/jpeg,image/png,image/webp" className="hidden" /><button type="button" onClick={handleAnalyzeDoc} disabled={!selectedFile || isScanning} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">{isScanning ? <Loader2 className="animate-spin" /> : <Sparkles />} {isScanning ? 'Analyse…' : 'Analyser prudemment'}</button></div><div className="rounded-2xl border border-slate-200 bg-white p-6">{scanResult ? <div className="space-y-4"><h3 className="text-xl font-bold">{scanResult.documentType}</h3>{scanResult.actionRequired && <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 font-bold text-red-700"><AlertTriangle size={16} /> Action potentielle à vérifier</div>}<p className="rounded-xl bg-brand-50 p-4 text-sm">{scanResult.summary}</p><p className="text-sm text-slate-700">{scanResult.explanation}</p><p className="text-sm font-bold">Échéance : {scanResult.deadline || 'À vérifier'}</p></div> : <div className="flex h-full min-h-72 flex-col items-center justify-center text-slate-400"><FileText size={48} /><p className="mt-3">Aucune analyse enregistrée dans cette session.</p></div>}</div></div>}

            {activeTab === 'writer' && <div className="grid gap-8 lg:grid-cols-2"><div><h2 className="mb-4 text-xl font-bold">Modèle de courrier</h2><textarea value={writerSubject} onChange={(event) => setWriterSubject(event.target.value)} placeholder="Décrivez les faits et l'objectif du courrier…" className="h-40 w-full resize-none rounded-xl border border-slate-200 bg-white p-4" /><button type="button" onClick={handleGenerateLetter} disabled={!writerSubject.trim() || isWriting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white disabled:bg-slate-200 disabled:text-slate-500">{isWriting ? <Loader2 className="animate-spin" /> : <Sparkles />} {isWriting ? 'Rédaction…' : 'Générer le modèle'}</button></div><div className="min-h-[480px] rounded-2xl border border-slate-200 bg-white p-8">{generatedLetter ? <div className="flex h-full flex-col"><div className="flex-1 whitespace-pre-wrap font-serif text-sm leading-relaxed">{generatedLetter}</div><div className="mt-6 flex justify-end gap-2 border-t pt-4"><button type="button" onClick={() => void navigator.clipboard.writeText(generatedLetter)} className="rounded-lg px-4 py-2 text-sm font-bold">Copier</button><button type="button" onClick={downloadLetter} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">Télécharger</button></div></div> : <div className="flex h-full items-center justify-center text-slate-400">Aucun courrier enregistré.</div>}</div></div>}
        </div></div>
    </div>;
};
