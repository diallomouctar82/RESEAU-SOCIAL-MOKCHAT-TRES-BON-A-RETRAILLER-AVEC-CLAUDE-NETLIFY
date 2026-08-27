
import React, { useState } from 'react';
import { ChevronRight, Globe, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

interface AuthProps {
    onLogin: (email: string) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [step, setStep] = useState<'email' | 'password' | 'loading'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Simulation Google Sign In
    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Simulation d'un délai réseau pour l'UX
        setTimeout(() => {
            // Par défaut, si l'utilisateur clique sur Google, on le connecte avec l'email admin pour la démo
            // ou on pourrait ouvrir une modale pour choisir. Ici on simplifie pour l'UX "fluide".
            onLogin('visionsmart224@gmail.com');
        }, 1500);
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setError('Veuillez saisir une adresse email valide.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setTimeout(() => {
            setStep('password');
            setIsLoading(false);
        }, 800);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError('Veuillez saisir votre mot de passe.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            onLogin(email);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-[#f0f2f5] flex items-center justify-center font-sans">
            <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-xl p-10 md:p-12 border border-gray-100 flex flex-col items-center animate-fade-up">
                
                {/* Logo & Header */}
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Globe className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Se connecter</h1>
                    <p className="text-gray-500">Pour continuer vers <b>Le Monde à Vous</b></p>
                </div>

                {step === 'email' && (
                    <div className="w-full space-y-6">
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div>
                                <div className={`relative border rounded-lg px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}`}>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Adresse e-mail</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full outline-none text-gray-900 text-base bg-transparent"
                                        autoFocus
                                    />
                                </div>
                                {error && <div className="flex items-center gap-1 text-red-600 text-xs mt-2"><AlertCircle size={12} /> {error}</div>}
                            </div>

                            <div className="flex justify-end">
                                <button type="button" className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                    Créer un compte
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-md ml-4 flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Suivant'}
                                </button>
                            </div>
                        </form>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold tracking-wider">Ou</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <button 
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-full transition-all duration-200 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continuer avec Google
                        </button>
                    </div>
                )}

                {step === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="w-full space-y-6 animate-fade-up">
                        <div className="flex items-center justify-center p-2 border border-gray-200 rounded-full w-fit mx-auto mb-4 cursor-pointer hover:bg-gray-50" onClick={() => setStep('email')}>
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mr-2">
                                {email.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 font-medium mr-2">{email}</span>
                            <ChevronRight size={14} className="text-gray-400" />
                        </div>

                        <div>
                            <div className="relative border border-gray-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mot de passe</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full outline-none text-gray-900 text-base"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                {error && <div className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle size={12} /> {error}</div>}
                                <button type="button" className="text-blue-600 font-bold text-xs hover:underline ml-auto">Mot de passe oublié ?</button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="remember" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" defaultChecked />
                                <label htmlFor="remember" className="text-sm text-gray-600">Se souvenir de moi</label>
                            </div>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-600 text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Connexion'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer Info */}
                <div className="mt-12 text-center">
                    <p className="text-xs text-gray-400">
                        En continuant, vous acceptez les <a href="#" className="text-gray-600 underline">Conditions d'utilisation</a> et la <a href="#" className="text-gray-600 underline">Politique de confidentialité</a> de Le Monde à Vous.
                    </p>
                </div>
            </div>
        </div>
    );
};
