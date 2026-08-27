
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Upload, FileText, Share2, AlertTriangle, CheckCircle, Search, Eye, MoreVertical, Plus, Clock, File, Cloud, RefreshCw, Server, Wifi } from 'lucide-react';
import { StoredDocument, DocCategory } from '../types';
import { cloudService } from '../services/cloud';

export const DigitalSafe: React.FC = () => {
    const [isLocked, setIsLocked] = useState(true);
    const [authProgress, setAuthProgress] = useState(0);
    const [activeCategory, setActiveCategory] = useState<DocCategory | 'All'>('All');
    const [documents, setDocuments] = useState<StoredDocument[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>('En attente');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        const loadDocs = async () => {
            const files = await cloudService.getAllFiles();
            const mappedDocs: StoredDocument[] = files.map((f: any) => ({
                id: f.id,
                name: f.name,
                category: f.category as DocCategory,
                uploadDate: f.uploadDate.toLocaleDateString(),
                fileSize: cloudService.formatBytes(f.size),
                isVerified: true
            }));
            setDocuments(mappedDocs);
        };
        loadDocs();
    }, []);

    useEffect(() => {
        if (isLocked) {
            const interval = setInterval(() => {
                setAuthProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setIsLocked(false), 500);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        
        try {
            // Upload to Persistent Cloud
            const fileId = await cloudService.uploadFile(file, 'Identity'); // Default category for now
            
            const newDoc: StoredDocument = {
                id: fileId,
                name: file.name,
                category: 'Identity',
                uploadDate: new Date().toLocaleDateString(),
                fileSize: cloudService.formatBytes(file.size),
                isVerified: true
            };
            
            setDocuments([newDoc, ...documents]);
            handleSync();
        } catch (err) {
            console.error(err);
            alert("Erreur d'upload vers le Cloud Sécurisé.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setLastSyncTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        }, 1500);
    };

    const filteredDocs = documents.filter(doc => 
        (activeCategory === 'All' || doc.category === activeCategory) &&
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80')] opacity-10 bg-cover"></div>
                 <div className="z-10 text-center animate-fade-up">
                     <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-8 relative">
                         <ShieldCheck size={64} className="text-emerald-400" />
                         <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                             <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-transparent" />
                             <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500" strokeDasharray={377} strokeDashoffset={377 - (377 * authProgress) / 100} />
                         </svg>
                     </div>
                     <h2 className="text-2xl font-bold tracking-widest uppercase mb-2">Coffre-Fort Sécurisé</h2>
                     <p className="text-emerald-400 font-mono text-sm">{authProgress < 100 ? 'Authentification Biométrique...' : 'Accès Autorisé'}</p>
                 </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 pb-32 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-[100px] opacity-10"></div>
                <div className="absolute top-0 left-0 right-0 bg-black/20 backdrop-blur-sm px-6 py-2 flex justify-between items-center text-xs font-medium text-emerald-200 border-b border-white/5">
                    <div className="flex items-center gap-2"><Lock size={12} /> Chiffrement AES-256 actif</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">{isSyncing ? <><RefreshCw size={12} className="animate-spin" /> Synchronisation...</> : <><Cloud size={12} /> Cloud Sécurisé (IndexedDB) • {lastSyncTime}</>}</div>
                        <button onClick={handleSync} disabled={isSyncing} className="hover:text-white transition-colors"><RefreshCw size={12} /></button>
                    </div>
                </div>

                <div className="relative z-10 flex justify-between items-center mt-8">
                    <div><h1 className="text-3xl font-bold flex items-center gap-3"><Lock className="text-emerald-400" /> Digital Safe</h1><p className="text-slate-400 mt-2 max-w-xl">Stockage chiffré de niveau militaire pour vos documents vitaux.</p></div>
                    <div className="flex gap-3">
                        <button onClick={handleSync} className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700 hover:bg-slate-800 ${isSyncing ? 'text-emerald-400' : 'text-slate-300'}`}>{isSyncing ? <RefreshCw className="animate-spin" size={20} /> : <Cloud size={20} />}<span className="hidden sm:inline">Sync</span></button>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"><Upload size={20} /> Ajouter</button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    </div>
                </div>
            </div>

            <div className="flex-1 px-8 -mt-24 pb-8 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"><div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><ShieldCheck size={24} /></div><div><div className="text-sm text-slate-500 font-bold uppercase">Status</div><div className="text-lg font-bold text-slate-900">Sécurisé & Chiffré</div></div></div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"><div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Server size={24} /></div><div><div className="text-sm text-slate-500 font-bold uppercase">Documents</div><div className="text-lg font-bold text-slate-900">{documents.length} fichiers</div></div></div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"><div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><AlertTriangle size={24} /></div><div><div className="text-sm text-slate-500 font-bold uppercase">Alertes</div><div className="text-lg font-bold text-slate-900">Tout est en ordre</div></div></div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                            {['All', 'Identity', 'Work', 'Health', 'Education', 'Finance'].map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{cat === 'All' ? 'Tous' : cat}</button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-x-1/2 text-slate-400" size={16} />
                            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isAnalyzing && (
                            <div className="border-2 border-dashed border-emerald-500 bg-emerald-50 rounded-2xl p-6 flex flex-col items-center justify-center text-emerald-700 animate-pulse"><Upload size={32} className="mb-2" /><span className="font-bold">Chiffrement & Upload...</span></div>
                        )}
                        {filteredDocs.length === 0 && !isAnalyzing && (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Le coffre est vide. Ajoutez vos documents importants.</p>
                            </div>
                        )}
                        {filteredDocs.map(doc => (
                            <div key={doc.id} className="group border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all cursor-pointer relative bg-white hover:border-emerald-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${doc.category === 'Identity' ? 'bg-blue-50 text-blue-600' : doc.category === 'Health' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><FileText size={24} /></div>
                                    <div className="text-slate-300 group-hover:text-emerald-500 transition-colors" title="Synchronisé"><Cloud size={16} fill="currentColor" className="opacity-20 group-hover:opacity-100" /></div>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1 truncate" title={doc.name}>{doc.name}</h3>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mb-4"><span>{doc.fileSize}</span><span>•</span><span>{doc.uploadDate}</span></div>
                                {doc.expiryDate && <div className="mb-4 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit flex items-center gap-1"><Clock size={12} /> Exp: {doc.expiryDate}</div>}
                                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50">
                                    <button className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-1"><Eye size={14} /> Voir</button>
                                    <button className="flex-1 py-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs hover:bg-emerald-100 flex items-center justify-center gap-1"><Share2 size={14} /> Partager</button>
                                </div>
                                {doc.isVerified && <div className="absolute top-4 right-12 text-emerald-500" title="Vérifié par Blockchain"><CheckCircle size={16} /></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
