
import React, { useState, useRef } from 'react';
import { Scale, FileText, Upload, AlertTriangle, Clock, Loader2, Send, ScanText, Sparkles, Copy, Check } from 'lucide-react';
import { LEGAL_PROCEDURES, USER_PROFILE } from '../constants';
import { LegalDocAnalysis, UserProfile } from '../types';
import { generateText, analyzeImage } from '../services/aiGateway';
import { StatusBadge } from './ui/StatusBadge';

interface LegalCenterProps {
    userProfile: UserProfile;
}

export const LegalCenter: React.FC<LegalCenterProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'writer'>('dashboard');
    
    // Scanner State
    const [scannedImage, setScannedImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<LegalDocAnalysis | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Writer State
    const [writerSubject, setWriterSubject] = useState('');
    const [isWriting, setIsWriting] = useState(false);
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [letterCopied, setLetterCopied] = useState(false);

    // État réel du dossier, calculé à partir des procédures existantes (aucune donnée inventée)
    const legalStats = {
        inProgress: LEGAL_PROCEDURES.filter(p => p.status === 'pending').length,
        actionRequired: LEGAL_PROCEDURES.filter(p => p.status === 'blocked').length,
        archived: LEGAL_PROCEDURES.filter(p => p.status === 'completed').length,
        avgProgress: LEGAL_PROCEDURES.length > 0
            ? Math.round(LEGAL_PROCEDURES.reduce((sum, p) => sum + p.progress, 0) / LEGAL_PROCEDURES.length)
            : 0
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setScannedImage(reader.result as string);
            reader.readAsDataURL(file);
            setScanResult(null);
        }
    };

    const handleAnalyzeDoc = async () => {
        if (!scannedImage) return;
        setIsScanning(true);
        setScanResult(null);

        try {
            const prompt = `Agis comme Maître Diallo. Analyse cette image de document officiel.

            Réponds en JSON strict :
            {
                "documentType": "Nom du document",
                "summary": "Résumé très simple en 1 phrase",
                "explanation": "Explication claire de ce que cela signifie pour l'utilisateur (vulgarisation)",
                "actionRequired": boolean,
                "deadline": "Date limite si trouvée ou 'Aucune'"
            }`;

            const resultText = await analyzeImage(scannedImage.split(',')[1], 'image/jpeg', prompt, { jsonMode: true });
            const result = JSON.parse(resultText || '{}');
            setScanResult(result);
        } catch (e) {
            console.error(e);
            alert("Erreur d'analyse. Assurez-vous que l'image est lisible.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleGenerateLetter = async () => {
        if (!writerSubject.trim()) return;
        setIsWriting(true);
        setGeneratedLetter('');

        try {
            const prompt = `Agis comme Maître Diallo. Rédige un courrier officiel et juridique pour ce sujet : "${writerSubject}".

            Profil :
            Nom : ${userProfile.name}
            ID : ${userProfile.citizenshipId}

            Le courrier doit être formel, poli, et citer les articles de loi si pertinent (invente des références réalistes pour l'exemple).
            `;

            const resText = await generateText(prompt);

            setGeneratedLetter(resText || "Erreur de génération.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsWriting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            {/* Header Unified Institutional */}
            <div className="bg-white border-b border-slate-200 text-slate-900 px-6 py-6 shadow-xs">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-blue-900 font-bold uppercase text-[11px] tracking-wider mb-1">
                            <Scale size={14} className="text-blue-700" /> Espace Juridique & Administratif
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Legal Guardian</h1>
                        <p className="text-xs text-slate-600 max-w-xl mt-1">
                            Votre avocat numérique personnel. Simplifiez, traduisez et gérez vos démarches administratives sans stress.
                        </p>
                    </div>

                    <div role="tablist" aria-label="Sections Juridique" className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          role="tab"
                          aria-selected={activeTab === 'dashboard'}
                          onClick={() => setActiveTab('dashboard')}
                          className={`min-h-11 px-4 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${activeTab === 'dashboard' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                        >
                            Mes Procédures
                        </button>
                        <button
                          role="tab"
                          aria-selected={activeTab === 'scanner'}
                          onClick={() => setActiveTab('scanner')}
                          className={`min-h-11 px-4 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${activeTab === 'scanner' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                        >
                            Scanner
                        </button>
                        <button
                          role="tab"
                          aria-selected={activeTab === 'writer'}
                          onClick={() => setActiveTab('writer')}
                          className={`min-h-11 px-4 py-2.5 rounded-lg font-bold text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 ${activeTab === 'writer' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-white'}`}
                        >
                            Rédiger
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">

                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Summary Card */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-full mb-4">
                                <h2 className="text-xl font-bold text-slate-800 mb-4">État des Lieux</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-blue-600">{legalStats.inProgress}</div>
                                        <div className="text-xs text-blue-400 font-bold uppercase">En cours</div>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-orange-600">{legalStats.actionRequired}</div>
                                        <div className="text-xs text-orange-400 font-bold uppercase">Action Requise</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-green-600">{legalStats.archived}</div>
                                        <div className="text-xs text-green-400 font-bold uppercase">Archivés</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-xl">
                                        <div className="text-2xl font-black text-purple-600">{legalStats.avgProgress}%</div>
                                        <div className="text-xs text-purple-400 font-bold uppercase">Progression Moyenne</div>
                                    </div>
                                </div>
                            </div>

                            {/* Procedure Cards */}
                            {LEGAL_PROCEDURES.map(proc => (
                                <div key={proc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                    <div className="h-2 bg-gray-100 w-full">
                                        <div className={`h-full ${proc.status === 'blocked' ? 'bg-red-500' : proc.status === 'completed' ? 'bg-green-500' : 'bg-brand-500'}`} style={{ width: `${proc.progress}%` }}></div>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${proc.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                                                {proc.category}
                                            </span>
                                            {proc.status === 'blocked' && <StatusBadge status="action_required" size="sm" />}
                                            {proc.status === 'completed' && <StatusBadge status="success" size="sm" />}
                                            {proc.status === 'pending' && <StatusBadge status="in_progress" size="sm" />}
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{proc.title}</h3>
                                        <p className="text-sm text-slate-500 mb-4">{proc.nextStep}</p>

                                        <div className="flex items-center text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                                            <span className="flex items-center gap-1"><Clock size={12} /> Échéance : {proc.deadline}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add New */}
                            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-6 min-h-[200px]">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                                    <span className="text-2xl text-slate-300">+</span>
                                </div>
                                <div className="font-bold text-sm">Nouvelle Procédure</div>
                                <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mt-1">Bientôt disponible</div>
                            </div>
                        </div>
                    )}

                    {/* SCANNER TAB */}
                    {activeTab === 'scanner' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <ScanText size={24} className="text-brand-600" /> Scanner de Courrier
                                    </h2>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Prenez en photo un document administratif. L'IA vous l'explique simplement.
                                    </p>
                                    
                                    <button
                                      type="button"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 cursor-pointer transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600"
                                    >
                                        {scannedImage ? (
                                            <img src={scannedImage} alt="Aperçu du document scanné" className="max-h-64 mx-auto rounded shadow-sm" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Upload size={40} />
                                                <span className="font-bold text-sm">Cliquez pour uploader une photo</span>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                    </button>

                                    <button
                                        onClick={handleAnalyzeDoc}
                                        disabled={!scannedImage || isScanning}
                                        className={`w-full mt-4 min-h-11 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600 ${!scannedImage || isScanning ? 'bg-slate-200 text-slate-400' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                                    >
                                        {isScanning ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        {isScanning ? 'Analyse intelligente...' : 'Traduire le Document'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {scanResult ? (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md animate-fade-up">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type détecté</div>
                                                <div className="font-bold text-xl text-slate-900">{scanResult.documentType}</div>
                                            </div>
                                            {scanResult.actionRequired && (
                                                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <AlertTriangle size={12} /> Action Requise
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 text-brand-900 mb-4">
                                            <h3 className="font-bold text-sm mb-1">Résumé Simple</h3>
                                            <p className="text-sm leading-relaxed">{scanResult.summary}</p>
                                        </div>

                                        <div className="space-y-4 text-sm text-slate-600">
                                            <div>
                                                <h3 className="font-bold text-slate-900 mb-1">Explication Détaillée</h3>
                                                <p>{scanResult.explanation}</p>
                                            </div>
                                            {scanResult.deadline && (
                                                <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 p-2 rounded-lg w-fit">
                                                    <Clock size={16} /> Date limite : {scanResult.deadline}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[300px]">
                                        <FileText size={48} className="mb-4 opacity-50" />
                                        <p>L'analyse apparaîtra ici.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WRITER TAB */}
                    {activeTab === 'writer' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <FileText className="text-brand-600" /> Assistant Rédaction
                                </h2>
                                <p className="text-sm text-slate-500 mb-6">
                                    Décrivez le courrier que vous devez envoyer. Maître Diallo le rédige pour vous avec le ton juridique approprié.
                                </p>

                                <div className="space-y-4">
                                    <textarea 
                                        value={writerSubject}
                                        onChange={(e) => setWriterSubject(e.target.value)}
                                        placeholder="Ex: Je dois écrire à la CAF pour contester un trop-perçu..."
                                        className="w-full h-40 p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none shadow-sm"
                                    />
                                    <button
                                        onClick={handleGenerateLetter}
                                        disabled={!writerSubject || isWriting}
                                        className={`w-full min-h-11 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 ${!writerSubject || isWriting ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                    >
                                        {isWriting ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        {isWriting ? 'Rédaction...' : 'Générer le Courrier'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] relative">
                                {generatedLetter ? (
                                    <div className="animate-fade-up h-full flex flex-col">
                                        <div className="flex-1 whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm">
                                            {generatedLetter}
                                        </div>
                                        <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedLetter);
                                                    setLetterCopied(true);
                                                    setTimeout(() => setLetterCopied(false), 2000);
                                                }}
                                                className="min-h-11 px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 rounded-lg"
                                            >
                                                {letterCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                {letterCopied ? 'Copié' : 'Copier'}
                                            </button>
                                            <button
                                                type="button"
                                                disabled
                                                title="Bientôt disponible"
                                                className="min-h-11 px-4 py-2 bg-slate-200 text-slate-500 rounded-lg text-sm font-bold cursor-not-allowed"
                                            >
                                                Télécharger PDF — Bientôt disponible
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                        <FileText size={64} className="mb-4 opacity-20" />
                                        <p>Le document s'affichera ici.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
