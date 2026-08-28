import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Send, Plus, RefreshCw, Hash, Users, Sparkles, 
    AlertCircle, CheckCircle, Lock, User as UserIcon, Shield, MessageCircle, 
    Smile, Paperclip
} from 'lucide-react';
import {
    listChatSpaces,
    createChatSpace,
    listChatMessages,
    sendChatMessage,
    GoogleChatSpace,
    GoogleChatMessage,
    getAccessToken
} from '../services/googleWorkspace';
import { hasWorkspaceCapabilities, subscribeToWorkspaceToken } from '../services/googleWorkspaceLink';
import { GoogleWorkspaceBanner } from './GoogleWorkspaceBanner';

export const GoogleChatCenter: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [spaces, setSpaces] = useState<GoogleChatSpace[]>([]);
    const [selectedSpace, setSelectedSpace] = useState<GoogleChatSpace | null>(null);
    const [messages, setMessages] = useState<GoogleChatMessage[]>([]);
    
    const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [newMessageText, setNewMessageText] = useState('');
    
    // Modal for creating a new Google Chat Space
    const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [newSpaceDescription, setNewSpaceDescription] = useState('');
    const [isCreatingSpace, setIsCreatingSpace] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeToWorkspaceToken((t) => {
            setToken(t && hasWorkspaceCapabilities(['chat']) ? t : null);
        });
        return () => unsubscribe();
    }, []);

    const fetchSpaces = async () => {
        if (!token) return;
        setIsLoadingSpaces(true);
        setError(null);
        try {
            const data = await listChatSpaces();
            setSpaces(data);
            if (data.length > 0 && !selectedSpace) {
                setSelectedSpace(data[0]);
            }
        } catch (err: any) {
            console.error('Erreur Google Chat Spaces:', err);
            setError(err.message || 'Impossible de récupérer les espaces Google Chat.');
        } finally {
            setIsLoadingSpaces(false);
        }
    };

    const fetchMessages = async (spaceName: string) => {
        if (!token) return;
        setIsLoadingMessages(true);
        setError(null);
        try {
            const data = await listChatMessages(spaceName);
            setMessages(data);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err: any) {
            console.error('Erreur messages Google Chat:', err);
            setError(err.message || 'Impossible de lire les messages de cet espace.');
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSpaces();
        }
    }, [token]);

    useEffect(() => {
        if (token && selectedSpace) {
            fetchMessages(selectedSpace.name);
        }
    }, [token, selectedSpace]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim() || !selectedSpace || !token) return;

        const textToSend = newMessageText.trim();
        setIsSending(true);
        try {
            await sendChatMessage(selectedSpace.name, textToSend);
            setNewMessageText('');
            await fetchMessages(selectedSpace.name);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'envoi du message Google Chat');
        } finally {
            setIsSending(false);
        }
    };

    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSpaceName.trim() || !token) return;
        setIsCreatingSpace(true);
        setError(null);
        try {
            const created = await createChatSpace(newSpaceName.trim(), newSpaceDescription.trim() || undefined);
            setNewSpaceName('');
            setNewSpaceDescription('');
            setIsCreateSpaceOpen(false);
            await fetchSpaces();
            setSelectedSpace(created);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création de l\'espace Google Chat');
        } finally {
            setIsCreatingSpace(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Espaces Google Chat</h1>
                            <p className="text-sm text-slate-500">
                                Salons de discussion officiels, groupes d'entraide et messagerie collaborative connectés à Google Workspace
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateSpaceOpen(true)}
                        disabled={!token}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} />
                        <span>Créer un Espace Chat</span>
                    </button>
                    <button
                        onClick={fetchSpaces}
                        disabled={!token || isLoadingSpaces}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl transition-all shadow-sm"
                        title="Actualiser les espaces"
                    >
                        <RefreshCw size={16} className={isLoadingSpaces ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Google Workspace Banner */}
            <GoogleWorkspaceBanner capabilities={['chat']} onAuthenticated={fetchSpaces} />

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Main Chat Interface */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[560px]">
                {/* Spaces List (Sidebar) */}
                <div className="md:col-span-4 border-r border-slate-100 p-4 flex flex-col justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-slate-200/60">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Vos Espaces Chat ({spaces.length})
                            </span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                Google Chat
                            </span>
                        </div>

                        {!token ? (
                            <div className="py-12 text-center px-4 space-y-2">
                                <Lock size={28} className="mx-auto text-slate-400" />
                                <p className="text-xs text-slate-500 font-medium">Connectez votre compte Google pour voir vos espaces de discussion.</p>
                            </div>
                        ) : isLoadingSpaces ? (
                            <div className="py-12 text-center text-slate-400 space-y-2">
                                <RefreshCw size={24} className="animate-spin mx-auto text-emerald-600" />
                                <p className="text-xs">Chargement des espaces...</p>
                            </div>
                        ) : spaces.length === 0 ? (
                            <div className="py-12 text-center px-4 space-y-3">
                                <MessageCircle size={32} className="mx-auto text-slate-300" />
                                <p className="text-xs text-slate-500 font-medium">Aucun espace de discussion trouvé.</p>
                                <button
                                    onClick={() => setIsCreateSpaceOpen(true)}
                                    className="text-xs text-emerald-600 font-bold hover:underline"
                                >
                                    Créer votre premier espace
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1 overflow-y-auto max-h-[440px] pr-1">
                                {spaces.map((space) => {
                                    const isSelected = selectedSpace?.name === space.name;
                                    return (
                                        <button
                                            key={space.name}
                                            onClick={() => setSelectedSpace(space)}
                                            className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                    : 'hover:bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                <Hash size={16} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                    {space.displayName || 'Espace sans nom'}
                                                </h4>
                                                <p className={`text-[11px] truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                    {space.spaceDetails?.description || 'Google Chat Workspace'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2 mt-4">
                        <Sparkles size={14} className="text-emerald-600 shrink-0" />
                        <span>Synchronisé avec l'infrastructure officielle Google Chat v1</span>
                    </div>
                </div>

                {/* Chat Messages Area */}
                <div className="md:col-span-8 flex flex-col justify-between h-[560px] p-4 bg-white">
                    {/* Active Space Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                <Hash size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    {selectedSpace?.displayName || 'Sélectionnez un espace'}
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    {selectedSpace?.spaceDetails?.description || 'Messages en direct'}
                                </p>
                            </div>
                        </div>

                        {selectedSpace && (
                            <button
                                onClick={() => fetchMessages(selectedSpace.name)}
                                disabled={isLoadingMessages}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                title="Rafraîchir les messages"
                            >
                                <RefreshCw size={14} className={isLoadingMessages ? 'animate-spin' : ''} />
                            </button>
                        )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                        {!token ? (
                            <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs">
                                Connectez votre compte Google pour lire et envoyer des messages.
                            </div>
                        ) : !selectedSpace ? (
                            <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs">
                                Veuillez choisir ou créer un espace Google Chat à gauche.
                            </div>
                        ) : isLoadingMessages ? (
                            <div className="h-full flex items-center justify-center text-slate-400 space-y-2 flex-col">
                                <RefreshCw size={24} className="animate-spin text-emerald-600" />
                                <span className="text-xs">Chargement des messages...</span>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                                <MessageSquare size={32} className="text-slate-300" />
                                <p className="text-xs font-medium">Aucun message pour l'instant dans cet espace.</p>
                                <p className="text-[11px] text-slate-400">Soyez le premier à envoyer un message !</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const senderName = msg.sender?.displayName || msg.sender?.name || 'Participant';
                                const timeFormatted = msg.createTime 
                                    ? new Date(msg.createTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
                                    : '';

                                return (
                                    <div key={msg.name || index} className="flex items-start gap-3 group animate-fade-up">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200">
                                            {msg.sender?.avatarUrl ? (
                                                <img src={msg.sender.avatarUrl} alt={senderName} className="w-full h-full object-cover" />
                                            ) : (
                                                senderName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 max-w-[85%]">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-800">{senderName}</span>
                                                <span className="text-[10px] text-slate-400">{timeFormatted}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed shadow-sm">
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Composer */}
                    <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <input
                            type="text"
                            placeholder={selectedSpace ? `Envoyer un message dans #${selectedSpace.displayName || 'espace'}...` : 'Sélectionnez un espace d\'abord'}
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            disabled={!selectedSpace || !token || isSending}
                            className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessageText.trim() || !selectedSpace || !token || isSending}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
                        >
                            {isSending ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <Send size={14} />
                            )}
                            <span>Envoyer</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Create Space Modal */}
            {isCreateSpaceOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Créer un Espace Google Chat</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Créez un salon de discussion pour collaborer avec vos conseillers, collègues ou camarades de promotion.
                        </p>

                        <form onSubmit={handleCreateSpace} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nom de l'espace *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Projet Mobilité Canada 2026"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Description (optionnelle)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Échanges sur les démarches de visa et préparation du départ"
                                    value={newSpaceDescription}
                                    onChange={(e) => setNewSpaceDescription(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateSpaceOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newSpaceName.trim() || isCreatingSpace}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
                                >
                                    {isCreatingSpace && <RefreshCw size={12} className="animate-spin" />}
                                    Créer l'Espace
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
