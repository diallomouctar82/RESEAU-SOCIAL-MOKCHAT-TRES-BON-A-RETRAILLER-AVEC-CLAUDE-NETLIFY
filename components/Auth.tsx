
import React, { useState } from 'react';
import { Globe, Loader2, AlertCircle, CheckCircle2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { WaterMirror } from './miroir/WaterMirror';
import {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordResetEmail,
    resendConfirmationEmail,
} from '../services/auth';

type Mode = 'signin' | 'signup' | 'signup-sent' | 'forgot' | 'forgot-sent';

// Registre des providers sociaux affichés sur les écrans connexion/inscription.
// Ajouter Facebook/Apple/Microsoft plus tard = ajouter une entrée ici, rien
// d'autre à changer (services/auth.ts#signInWithOAuthProvider gère déjà tous
// les providers Supabase de façon générique).
const SOCIAL_PROVIDERS: { id: 'google'; label: string; icon: React.ReactNode }[] = [
    {
        id: 'google',
        label: 'Continuer avec Google',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        ),
    },
];

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5" role="alert">
        <AlertCircle size={16} className="shrink-0" /> {message}
    </div>
);

const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5" role="status">
        <CheckCircle2 size={16} className="shrink-0" /> {message}
    </div>
);

export const Auth: React.FC = () => {
    const [mode, setMode] = useState<Mode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resetFeedback = () => setError(null);

    const switchMode = (next: Mode) => {
        resetFeedback();
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setMode(next);
    };

    // Redirection en cours (Google) : cette promesse ne se résout normalement
    // jamais, le navigateur navigue avant. Seule une erreur AVANT la
    // redirection (provider mal configuré, réseau) atterrit dans ce catch.
    const handleSocialLogin = async (providerId: 'google') => {
        setLoadingProvider(providerId);
        resetFeedback();
        try {
            if (providerId === 'google') await signInWithGoogle(rememberMe);
        } catch (err: any) {
            console.error(`Erreur connexion ${providerId}:`, err);
            setError(err?.message || `Échec de la connexion avec ${providerId}. Réessaie.`);
            setLoadingProvider(null);
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        if (!email.includes('@')) { setError('Adresse e-mail invalide.'); return; }
        if (!password) { setError('Saisis ton mot de passe.'); return; }
        setIsLoading(true);
        try {
            await signInWithEmail(email, password, rememberMe);
            // Succès : onAuthStateChange (App.tsx) prend le relais et monte l'app.
        } catch (err: any) {
            console.error('Erreur connexion email:', err);
            const msg = err?.message?.includes('Invalid login credentials')
                ? 'E-mail ou mot de passe incorrect.'
                : err?.message?.includes('Email not confirmed')
                ? 'Adresse e-mail non confirmée — vérifie ta boîte de réception.'
                : err?.message || 'Échec de la connexion.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        if (!email.includes('@')) { setError('Adresse e-mail invalide.'); return; }
        if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
        if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
        setIsLoading(true);
        try {
            const { needsEmailConfirmation } = await signUpWithEmail(email, password);
            if (needsEmailConfirmation) {
                setMode('signup-sent');
            }
            // Sinon (confirmation désactivée côté Supabase) : onAuthStateChange connecte directement.
        } catch (err: any) {
            console.error('Erreur inscription:', err);
            const msg = err?.message?.includes('already registered') || err?.message?.includes('User already registered')
                ? 'Un compte existe déjà avec cette adresse — connecte-toi plutôt.'
                : err?.message || "Échec de la création du compte.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        resetFeedback();
        if (!email.includes('@')) { setError('Adresse e-mail invalide.'); return; }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(email);
            setMode('forgot-sent');
        } catch (err: any) {
            console.error('Erreur réinitialisation:', err);
            setError(err?.message || "Échec de l'envoi du lien de réinitialisation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendConfirmation = async () => {
        resetFeedback();
        setIsLoading(true);
        try {
            await resendConfirmationEmail(email);
            setError(null);
        } catch (err: any) {
            setError(err?.message || "Échec de l'envoi.");
        } finally {
            setIsLoading(false);
        }
    };

    const socialButtons = (
        <div className="w-full space-y-3">
            {SOCIAL_PROVIDERS.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSocialLogin(p.id)}
                    disabled={loadingProvider !== null}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-medium py-3 px-4 rounded-full transition-all duration-200 group"
                >
                    {loadingProvider === p.id ? <Loader2 className="animate-spin" size={20} /> : <span className="group-hover:scale-110 transition-transform">{p.icon}</span>}
                    {loadingProvider === p.id ? 'Connexion en cours…' : p.label}
                </button>
            ))}
        </div>
    );

    const divider = (
        <div className="relative flex py-1 items-center w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold tracking-wider">Ou</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>
    );

    return (
        // DS-M2c : l'habillage « Miroir d'eau » commence ICI, au tout premier
        // écran. Il vivait jusqu'ici uniquement dans `Layout`, c'est-à-dire
        // APRÈS connexion — donc invisible pour quiconque ouvre un simple lien
        // (un aperçu de déploiement est une autre origine : aucune session n'y
        // suit, on arrive toujours sur cet écran-là).
        <div data-miroir className="fixed inset-0 flex items-center justify-center font-sans overflow-y-auto py-10">
            <WaterMirror />
            {/* La carte laisse volontairement l'eau respirer sur les quatre côtés :
                à pleine largeur sur téléphone, elle masquait la ligne d'eau et
                l'habillage redevenait invisible — le défaut même qu'on corrige. */}
            <div className="w-[calc(100%-2.5rem)] max-w-[440px] mir-sheet rounded-3xl p-6 md:p-10 border flex flex-col items-center animate-fade-up my-auto">

                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Globe className="text-white" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {mode === 'signin' && 'Se connecter'}
                        {mode === 'signup' && 'Créer un compte'}
                        {mode === 'signup-sent' && 'Vérifie ta boîte mail'}
                        {mode === 'forgot' && 'Mot de passe oublié'}
                        {mode === 'forgot-sent' && 'E-mail envoyé'}
                    </h1>
                    {(mode === 'signin' || mode === 'signup') && (
                        <p className="text-gray-500 mt-2">Pour continuer vers <b>Le Monde à Vous</b></p>
                    )}
                </div>

                {/* Onglets Se connecter / Créer un compte */}
                {(mode === 'signin' || mode === 'signup') && (
                    <div className="w-full grid grid-cols-2 gap-1 bg-gray-100 rounded-full p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => switchMode('signin')}
                            className={`py-2 rounded-full text-sm font-bold transition-colors ${mode === 'signin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Se connecter
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode('signup')}
                            className={`py-2 rounded-full text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Créer un compte
                        </button>
                    </div>
                )}

                {mode === 'signin' && (
                    <div className="w-full space-y-5">
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Adresse e-mail" autoComplete="email" autoFocus
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mot de passe" autoComplete="current-password"
                                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl outline-none text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    Se souvenir de moi
                                </label>
                                <button type="button" onClick={() => switchMode('forgot')} className="text-blue-600 font-semibold hover:underline">
                                    Mot de passe oublié ?
                                </button>
                            </div>

                            {error && <ErrorBanner message={error} />}

                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Se connecter'}
                            </button>
                        </form>

                        {divider}
                        {socialButtons}
                    </div>
                )}

                {mode === 'signup' && (
                    <div className="w-full space-y-5">
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Adresse e-mail" autoComplete="email" autoFocus
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mot de passe (8 caractères min.)" autoComplete="new-password"
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

                            {error && <ErrorBanner message={error} />}

                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Créer mon compte'}
                            </button>
                        </form>

                        {divider}
                        {socialButtons}
                    </div>
                )}

                {mode === 'signup-sent' && (
                    <div className="w-full space-y-5 text-center">
                        <SuccessBanner message={`Un e-mail de confirmation a été envoyé à ${email}. Clique sur le lien pour activer ton compte.`} />
                        {error && <ErrorBanner message={error} />}
                        <button onClick={handleResendConfirmation} disabled={isLoading} className="text-blue-600 font-semibold text-sm hover:underline disabled:opacity-60">
                            {isLoading ? 'Envoi…' : "Renvoyer l'e-mail"}
                        </button>
                        <button onClick={() => switchMode('signin')} className="flex items-center justify-center gap-1 text-gray-500 text-sm hover:text-gray-700 mx-auto">
                            <ArrowLeft size={14} /> Retour à la connexion
                        </button>
                    </div>
                )}

                {mode === 'forgot' && (
                    <div className="w-full space-y-5">
                        <p className="text-sm text-gray-500 text-center -mt-2">Indique ton adresse e-mail, on t'envoie un lien pour réinitialiser ton mot de passe.</p>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Adresse e-mail" autoComplete="email" autoFocus
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl outline-none text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {error && <ErrorBanner message={error} />}
                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-3 rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2">
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Envoyer le lien'}
                            </button>
                        </form>
                        <button onClick={() => switchMode('signin')} className="flex items-center justify-center gap-1 text-gray-500 text-sm hover:text-gray-700 mx-auto">
                            <ArrowLeft size={14} /> Retour à la connexion
                        </button>
                    </div>
                )}

                {mode === 'forgot-sent' && (
                    <div className="w-full space-y-5 text-center">
                        <SuccessBanner message={`Si un compte existe pour ${email}, un lien de réinitialisation vient d'être envoyé.`} />
                        <button onClick={() => switchMode('signin')} className="flex items-center justify-center gap-1 text-gray-500 text-sm hover:text-gray-700 mx-auto">
                            <ArrowLeft size={14} /> Retour à la connexion
                        </button>
                    </div>
                )}

                <div className="mt-10 text-center">
                    <p className="text-xs text-gray-400">
                        En continuant, vous acceptez les <a href="#" className="text-gray-600 underline">Conditions d'utilisation</a> et la <a href="#" className="text-gray-600 underline">Politique de confidentialité</a> de Le Monde à Vous.
                    </p>
                </div>
            </div>
        </div>
    );
};
