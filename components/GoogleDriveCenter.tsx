import React, { useState, useEffect } from 'react';
import { 
    HardDrive, Folder, File, FileText, Image as ImageIcon, Video, Music, 
    Upload, Plus, Search, Trash2, ExternalLink, RefreshCw, AlertCircle, 
    CheckCircle, Shield, ArrowLeft, Download, Eye, Sparkles, FolderPlus 
} from 'lucide-react';
import {
    listDriveFiles,
    uploadDriveFile,
    createDriveFolder,
    deleteDriveFile,
    GoogleDriveFile,
    getAccessToken
} from '../services/googleWorkspace';
import { hasWorkspaceCapabilities, subscribeToWorkspaceToken } from '../services/googleWorkspaceLink';
import { GoogleWorkspaceBanner } from './GoogleWorkspaceBanner';

export const GoogleDriveCenter: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [files, setFiles] = useState<GoogleDriveFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
    const [folderHistory, setFolderHistory] = useState<{ id?: string; name: string }[]>([
        { id: undefined, name: 'Mon Drive' }
    ]);

    // Modal state for creating folder
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Modal state for file upload
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

    // Modal state for deletion confirmation (MANDATORY User Confirmation)
    const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToWorkspaceToken((t) => {
            setToken(t && hasWorkspaceCapabilities(['drive']) ? t : null);
        });
        return () => unsubscribe();
    }, []);

    const fetchFiles = async (folderId?: string, query?: string) => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await listDriveFiles(folderId, query);
            setFiles(data);
        } catch (err: any) {
            console.error('Erreur Drive:', err);
            setError(err.message || 'Impossible de récupérer les fichiers Google Drive.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchFiles(currentFolderId, searchQuery);
        }
    }, [token, currentFolderId]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFiles(currentFolderId, searchQuery);
    };

    const handleOpenFolder = (folder: GoogleDriveFile) => {
        setCurrentFolderId(folder.id);
        setFolderHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
        setSearchQuery('');
    };

    const handleNavigateBreadcrumb = (index: number) => {
        const target = folderHistory[index];
        const newHistory = folderHistory.slice(0, index + 1);
        setFolderHistory(newHistory);
        setCurrentFolderId(target.id);
        setSearchQuery('');
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsCreatingFolder(true);
        try {
            await createDriveFolder(newFolderName.trim(), currentFolderId);
            setNewFolderName('');
            setIsCreateFolderOpen(false);
            await fetchFiles(currentFolderId);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création du dossier');
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        const file = fileList[0];
        setIsUploading(true);
        setError(null);
        try {
            await uploadDriveFile(file, currentFolderId);
            setUploadSuccess(`"${file.name}" a été ajouté avec succès à Google Drive !`);
            setTimeout(() => setUploadSuccess(null), 4000);
            await fetchFiles(currentFolderId);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du téléversement');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDriveFile(fileToDelete.id);
            setFileToDelete(null);
            await fetchFiles(currentFolderId);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la suppression');
        } finally {
            setIsDeleting(false);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('folder')) return <Folder className="text-amber-500 fill-amber-400/20" size={22} />;
        if (mimeType.includes('image')) return <ImageIcon className="text-purple-500" size={22} />;
        if (mimeType.includes('video')) return <Video className="text-rose-500" size={22} />;
        if (mimeType.includes('audio')) return <Music className="text-indigo-500" size={22} />;
        if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="text-blue-500" size={22} />;
        return <File className="text-slate-400" size={22} />;
    };

    const formatFileSize = (bytesStr?: string) => {
        if (!bytesStr) return '--';
        const bytes = parseInt(bytesStr, 10);
        if (isNaN(bytes)) return '--';
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <HardDrive size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Centre Google Drive</h1>
                            <p className="text-sm text-slate-500">
                                Stockage et gestion sécurisée de vos passeports, diplômes, visas et documents internationaux
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2">
                        <Upload size={16} />
                        <span>Téléverser</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileUpload} 
                            disabled={!token || isUploading} 
                        />
                    </label>
                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        disabled={!token}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                        <FolderPlus size={16} className="text-amber-500" />
                        <span>Nouveau Dossier</span>
                    </button>
                    <button
                        onClick={() => fetchFiles(currentFolderId, searchQuery)}
                        disabled={!token || isLoading}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl transition-all shadow-sm"
                        title="Actualiser"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Google Workspace Banner */}
            <GoogleWorkspaceBanner capabilities={['drive']} onAuthenticated={() => fetchFiles(currentFolderId)} />

            {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-up">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Breadcrumb and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 overflow-x-auto w-full md:w-auto">
                    {folderHistory.map((item, idx) => (
                        <React.Fragment key={item.id || 'root'}>
                            {idx > 0 && <span className="text-slate-300">/</span>}
                            <button
                                onClick={() => handleNavigateBreadcrumb(idx)}
                                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                                    idx === folderHistory.length - 1 
                                        ? 'bg-slate-100 font-bold text-slate-800' 
                                        : 'hover:bg-slate-50 text-slate-600'
                                }`}
                            >
                                {item.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-72">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher dans Drive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={!token}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                        />
                    </div>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); fetchFiles(currentFolderId, ''); }}
                            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                        >
                            Effacer
                        </button>
                    )}
                </form>
            </div>

            {/* Files Grid / List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[360px]">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                        <RefreshCw size={32} className="animate-spin text-brand-600" />
                        <p className="text-xs font-medium">Chargement des documents Google Drive...</p>
                    </div>
                ) : !token ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto space-y-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <HardDrive size={32} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">Google Drive non connecté</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Connectez votre compte Google pour parcourir, sauvegarder et synchroniser vos dossiers administratifs et professionnels en temps réel.
                        </p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                        <Folder size={40} className="text-slate-300 stroke-1" />
                        <p className="text-xs font-medium">Aucun fichier trouvé dans ce dossier.</p>
                        <p className="text-[11px] text-slate-400">Cliquez sur « Téléverser » pour ajouter un document.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <div className="col-span-6 md:col-span-5">Nom</div>
                            <div className="hidden md:block col-span-3">Dernière modification</div>
                            <div className="col-span-3 md:col-span-2">Taille</div>
                            <div className="col-span-3 md:col-span-2 text-right">Actions</div>
                        </div>

                        {/* Items */}
                        {files.map((file) => {
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                            return (
                                <div
                                    key={file.id}
                                    className="grid grid-cols-12 gap-4 px-6 py-3.5 hover:bg-slate-50/80 items-center transition-colors group"
                                >
                                    {/* Name */}
                                    <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden">
                                        <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                                        <div className="overflow-hidden">
                                            {isFolder ? (
                                                <button
                                                    onClick={() => handleOpenFolder(file)}
                                                    className="text-xs font-bold text-slate-800 hover:text-brand-600 truncate text-left block"
                                                >
                                                    {file.name}
                                                </button>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-800 truncate block">
                                                    {file.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="hidden md:block col-span-3 text-xs text-slate-500">
                                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        }) : '--'}
                                    </div>

                                    {/* Size */}
                                    <div className="col-span-3 md:col-span-2 text-xs text-slate-500">
                                        {isFolder ? 'Dossier' : formatFileSize(file.size)}
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-1">
                                        {file.webViewLink && (
                                            <a
                                                href={file.webViewLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Ouvrir dans Google Drive"
                                            >
                                                <ExternalLink size={15} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => setFileToDelete(file)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer le fichier"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Folder Modal */}
            {isCreateFolderOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-scale-in">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                            <FolderPlus size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Nouveau Dossier Drive</h3>
                        <p className="text-xs text-slate-500 mt-1">Créez un dossier pour organiser vos pièces justificatives.</p>

                        <form onSubmit={handleCreateFolder} className="mt-4 space-y-4">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Nom du dossier (ex: Visas, Diplômes 2026)"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateFolderOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newFolderName.trim() || isCreatingFolder}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                                >
                                    {isCreatingFolder && <RefreshCw size={12} className="animate-spin" />}
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Confirmation Dialog for Destructive Operations (MANDATORY REQUIREMENT) */}
            {fileToDelete && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 animate-scale-in">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Confirmer la suppression</h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-slate-900 font-semibold">« {fileToDelete.name} »</strong> de votre compte Google Drive ?
                        </p>
                        <p className="text-[11px] text-red-500 mt-1">
                            Cette action modifiera vos données Google Drive personnelles.
                        </p>

                        <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setFileToDelete(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 transition-all flex items-center gap-2"
                            >
                                {isDeleting && <RefreshCw size={12} className="animate-spin" />}
                                Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
