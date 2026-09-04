
import React, { useState } from 'react';
import { Globe, Loader2, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { updatePassword } from '../services/auth';
import { WaterMirror } from './miroir/WaterMirror';

interface ResetPasswordProps {
    onDone: () => void;
}

/**
 * Affiché uniquement après un événement Supabase PASSWORD_RECOVERY (lien
 * "mot de passe oublié" cliqué depuis l'e-mail) — voir App.tsx. Une fois le
 * mot de passe mis à jour, Supabase émet USER_UPDATED, que App.tsx traite
 * comme une connexion normale ; onDone() est un filet de sécurité.
 */
export const ResetPassword: React.FC<ResetPasswordProps> = ({ onDone }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
        if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
        setIsLoading(true);
        try {
            await updatePassword(password);
            onDone();
        } catch (err: any) {
            console.error('Erreur mise à jour mot de passe:', err);
            setError(err?.message || 'Échec de la mise à jour du mot de passe.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // DS-M2c : même monde que l'écran de connexion — voir Auth.tsx.
        <div data-miroir className="fixed inset-0 flex items-center justify-center font-sans">
            <WaterMirror />
            <div className="w-[calc(100%-2.5rem)] max-w-[440px] mir-sheet rounded-3xl p-6 md:p-10 border flex flex-col items-center animate-fade-up">
                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Globe className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
                    <p className="text-gray-500 mt-2">Choisis un nouveau mot de passe pour ton compte.</p>
                </div>
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nouveau mot de passe (8 caractères min.)" autoComplete="new-password" autoFocus
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl outline-none text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme le mot de passe" autoComplete="new-password"
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5" role="alert">
                            <AlertCircle size={16} className="shrink-0" /> {error}
                        </div>
                    )}
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Mettre à jour le mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
};
