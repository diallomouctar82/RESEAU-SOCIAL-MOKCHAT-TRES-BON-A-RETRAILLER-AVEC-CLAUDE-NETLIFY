
import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, CheckCircle, AlertCircle, Key, RefreshCw } from 'lucide-react';
import { hasWorkspaceCapabilities, linkGoogleWorkspace, unlinkGoogleWorkspace, subscribeToWorkspaceToken, type WorkspaceCapability } from '../services/googleWorkspaceLink';
import { useGlobal } from '../contexts/GlobalContext';

interface GoogleWorkspaceBannerProps {
    compact?: boolean;
    onAuthenticated?: () => void;
    capabilities?: WorkspaceCapability[];
}

export const GoogleWorkspaceBanner: React.FC<GoogleWorkspaceBannerProps> = ({ compact = false, onAuthenticated, capabilities }) => {
    const { userProfile } = useGlobal();
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestedCapabilities = capabilities ?? ['drive'];

    useEffect(() => {
        const unsubscribe = subscribeToWorkspaceToken((t) => {
            setToken(t);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await linkGoogleWorkspace(requestedCapabilities);
            onAuthenticated?.();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Échec de la connexion à Google Workspace.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        unlinkGoogleWorkspace();
    };

    const isConnected = Boolean(token) && hasWorkspaceCapabilities(requestedCapabilities);
    const capabilityLabel = requestedCapabilities.map((capability) => ({ drive: 'Drive', chat: 'Chat', meet: 'Meet' })[capability]).join(', ');

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {isConnected ? (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                        <CheckCircle size={14} className="text-emerald-600" />
                        <span className="truncate max-w-[120px]">{userProfile.name || userProfile.email}</span>
                        <button
                            onClick={handleLogout}
                            title="Se déconnecter de Google Workspace"
                            className="hover:text-red-600 ml-1 p-0.5 rounded transition-colors"
                        >
                            <LogOut size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all hover:border-brand-500"
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {isLoading ? 'Connexion...' : 'Lier Google Workspace'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-7 h-7" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Connexion Google Workspace</h3>
                            {isConnected ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    <CheckCircle size={12} /> Connecté
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                                    <Key size={12} /> Autorisation Requise
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                            {isConnected
                                ? `${capabilityLabel} autorisé pour ${userProfile.email} pendant la durée du jeton en mémoire.`
                                : `Autorisez explicitement ${capabilityLabel}. Le fonctionnement dépend aussi des APIs et de l’écran de consentement configurés dans Google Cloud.`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {isConnected ? (
                        <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                            <LogOut size={14} /> Déconnecter
                        </button>
                    ) : (
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                        >
                            {isLoading ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <LogIn size={14} />
                            )}
                            {isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-3 p-2.5 bg-red-100/80 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};
