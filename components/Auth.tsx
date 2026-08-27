import React, { useState, useEffect } from 'react';
import { 
    Globe, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    User as UserIcon, 
    Phone, 
    MapPin, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Loader2, 
    KeyRound, 
    ShieldCheck, 
    Sparkles, 
    Check, 
    X,
    Users
} from 'lucide-react';
import { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    resetPasswordForEmail, 
    updateUserPassword,
    getRememberMePreference,
    setRememberMePreference 
} from '../services/auth';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

export const Auth: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [country, setCountry] = useState('Guinée');
    const [phone, setPhone] = useState('');
    const [rememberMe, setRememberMe] = useState(getRememberMePreference());
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Quick test selector state
    const [showQuickFill, setShowQuickFill] = useState(false);

    // Detect if URL contains password recovery hash
    useEffect(() => {
        if (window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password')) {
            setMode('reset');
        }
    }, []);

    // Email validation helper
    const isValidEmail = (val: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    };

    // Password strength calculation (0 to 4)
    const calculatePasswordStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const passwordStrength = calculatePasswordStrength(password);
    const getStrengthLabel = (score: number) => {
        switch (score) {
            case 0: return { label: 'Très faible', color: 'bg-slate-200 text-slate-500' };
            case 1: return { label: 'Faible', color: 'bg-red-500 text-red-700' };
            case 2: return { label: 'Moyen', color: 'bg-amber-500 text-amber-700' };
            case 3: return { label: 'Robuste', color: 'bg-blue-500 text-blue-700' };
            case 4: return { label: 'Excellent', color: 'bg-emerald-500 text-emerald-700' };
            default: return { label: '', color: '' };
        }
    };

    const clearStatus = () => {
        setError(null);
        setSuccessMessage(null);
    };

    // Handle Email Sign In
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        clearStatus();

        if (!email.trim()) {
            setError('Veuillez saisir votre adresse email.');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Format d\'adresse email invalide (ex: contact@domaine.com).');
            return;
        }
        if (!password) {
            setError('Veuillez saisir votre mot de passe.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await signInWithEmail(email, password, rememberMe);
            if (!res.success) {
                setError(res.error || 'Identifiants incorrects. Veuillez réessayer.');
            } else {
                setSuccessMessage(res.message || 'Connexion réussie.');
                // Rechargement doux pour monter la session
                setTimeout(() => {
                    window.location.reload();
                }, 400);
            }
        } catch (err: any) {
            setError(err?.message || 'Une erreur inattendue est survenue lors de la connexion.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Sign Up
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        clearStatus();

        if (!fullName.trim() || fullName.trim().length < 2) {
            setError('Veuillez renseigner votre nom complet (au moins 2 caractères).');
            return;
        }
        if (!email.trim() || !isValidEmail(email)) {
            setError('Veuillez fournir une adresse email valide.');
            return;
        }
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }
        if (!agreeTerms) {
            setError('Veuillez accepter les Conditions d\'utilisation pour créer votre compte.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await signUpWithEmail({
                email,
                password,
                fullName,
                country,
                phone
            });

            if (!res.success) {
                setError(res.error || 'Échec de la création du compte.');
            } else {
                setSuccessMessage(res.message || 'Votre compte a été créé avec succès !');
                if (res.session || res.user) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 600);
                }
            }
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la création du compte.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google OAuth
    const handleGoogleLogin = async () => {
        clearStatus();
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            console.error('Erreur connexion Google:', err);
            setError(err?.message || 'Échec de la connexion avec Google. Vérifiez vos identifiants ou réessayez.');
            setIsLoading(false);
        }
    };

    // Handle Forgot Password
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        clearStatus();

        if (!email.trim() || !isValidEmail(email)) {
            setError('Veuillez saisir une adresse email valide.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await resetPasswordForEmail(email);
            if (!res.success) {
                setError(res.error || 'Impossible d\'envoyer le lien de réinitialisation.');
            } else {
                setSuccessMessage(res.message || 'Lien de réinitialisation transmis.');
            }
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la réinitialisation.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Reset Password (from recovery email)
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        clearStatus();

        if (password.length < 6) {
            setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await updateUserPassword(password);
            if (!res.success) {
                setError(res.error || 'Échec de la mise à jour du mot de passe.');
            } else {
                setSuccessMessage('Mot de passe mis à jour ! Vous pouvez maintenant vous connecter.');
                setTimeout(() => {
                    setMode('signin');
                    window.location.hash = '';
                }, 1200);
            }
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la mise à jour.');
        } finally {
            setIsLoading(false);
        }
    };

    // Pre-fill demo accounts for fast evaluation
    const fillDemoAccount = (role: 'admin' | 'citizen') => {
        if (role === 'admin') {
            setEmail('admin@lemondeavous.com');
            setPassword('admin123');
        } else {
            setEmail('citoyen@lemondeavous.com');
            setPassword('citoyen123');
        }
        setMode('signin');
        setShowQuickFill(false);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
            {/* Ambient Background Elements (Refined Institution Deep Blue) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

            <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100/80 p-8 md:p-10 relative z-10 animate-fade-up">
                
                {/* Header with Sovereign Emblem */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                        <Globe className="text-white" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {mode === 'signin' && 'Espace Citoyen & Membres'}
                        {mode === 'signup' && 'Créer un Compte Citoyen'}
                        {mode === 'forgot' && 'Mot de Passe Oublié'}
                        {mode === 'reset' && 'Nouveau Mot de Passe'}
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                        Plateforme souveraine internationale • <b>Le Monde à Vous</b>
                    </p>
                </div>

                {/* Notifications & Status Alerts */}
                {error && (
                    <div className="mb-5 flex items-start gap-2.5 text-red-700 text-xs md:text-sm bg-red-50 border border-red-200 rounded-xl p-3.5 animate-shake">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                        <div className="leading-snug">{error}</div>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-5 flex items-start gap-2.5 text-emerald-800 text-xs md:text-sm bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 animate-fade-in">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                        <div className="leading-snug">{successMessage}</div>
                    </div>
                )}

                {/* MODE: CONNEXION (SIGN IN) */}
                {mode === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Adresse Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ex: amadou.diallo@domaine.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Mot de passe
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { clearStatus(); setMode('forgot'); }}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => {
                                        setRememberMe(e.target.checked);
                                        setRememberMePreference(e.target.checked);
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-xs text-slate-600">Se souvenir de moi</span>
                            </label>
                            
                            <button
                                type="button"
                                onClick={() => setShowQuickFill(!showQuickFill)}
                                className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
                            >
                                <Users size={13} />
                                Comptes démo
                            </button>
                        </div>

                        {/* Quick Test Accounts Dropdown */}
                        {showQuickFill && (
                            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2 animate-fade-in">
                                <div className="font-semibold text-amber-900 flex items-center justify-between">
                                    <span>Identifiants de test préconfigurés :</span>
                                    <span className="text-[10px] text-amber-700">1 clic</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fillDemoAccount('admin')}
                                        className="p-2 bg-white rounded-lg border border-amber-200 text-left hover:border-amber-400 transition-all text-slate-800"
                                    >
                                        <div className="font-bold text-blue-700">Super-Admin</div>
                                        <div className="text-[10px] text-slate-500 truncate">admin@lemondeavous.com</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fillDemoAccount('citizen')}
                                        className="p-2 bg-white rounded-lg border border-amber-200 text-left hover:border-amber-400 transition-all text-slate-800"
                                    >
                                        <div className="font-bold text-emerald-700">Citoyen</div>
                                        <div className="text-[10px] text-slate-500 truncate">citoyen@lemondeavous.com</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <span>Se connecter</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-4 flex items-center justify-center">
                            <div className="border-t border-slate-200 w-full" />
                            <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-semibold">ou</span>
                        </div>

                        {/* Google OAuth Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 group shadow-sm"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Continuer avec Google</span>
                        </button>

                        {/* Switch to Sign Up */}
                        <div className="pt-2 text-center">
                            <p className="text-xs text-slate-500">
                                Pas encore de compte ?{' '}
                                <button
                                    type="button"
                                    onClick={() => { clearStatus(); setMode('signup'); }}
                                    className="font-semibold text-blue-600 hover:text-blue-800 underline ml-1"
                                >
                                    Créer un compte citoyen
                                </button>
                            </p>
                        </div>
                    </form>
                )}

                {/* MODE: INSCRIPTION (SIGN UP) */}
                {mode === 'signup' && (
                    <form onSubmit={handleSignUp} className="space-y-3.5">
                        {/* Welcome Bonus Callout */}
                        <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-900">
                            <Sparkles className="text-amber-500 shrink-0" size={18} />
                            <span>
                                <b>100 Crédits Ⓒ et 100 XP offerts</b> à l'attribution de votre Passeport Citoyen.
                            </span>
                        </div>

                        {/* Full Name Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Nom Complet
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="ex: Mamadou Diallo"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Adresse Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ex: mamadou@domaine.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Country & Phone Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Pays
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    >
                                        <option value="Guinée">🇬🇳 Guinée</option>
                                        <option value="France">🇫🇷 France</option>
                                        <option value="Sénégal">🇸🇳 Sénégal</option>
                                        <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                                        <option value="Mali">🇲🇱 Mali</option>
                                        <option value="Canada">🇨🇦 Canada</option>
                                        <option value="États-Unis">🇺🇸 États-Unis</option>
                                        <option value="Autre">🌍 International</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                    Téléphone (optionnel)
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+224 ..."
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password & Strength Indicator */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Au moins 6 caractères"
                                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>

                            {/* Dynamic Strength Bar */}
                            {password && (
                                <div className="mt-1.5 space-y-1">
                                    <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div
                                                key={step}
                                                className={`h-full flex-1 transition-all duration-300 ${
                                                    passwordStrength >= step
                                                        ? passwordStrength === 1 ? 'bg-red-500'
                                                        : passwordStrength === 2 ? 'bg-amber-500'
                                                        : passwordStrength === 3 ? 'bg-blue-500'
                                                        : 'bg-emerald-500'
                                                        : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Force du mot de passe :</span>
                                        <span className="font-semibold">{getStrengthLabel(passwordStrength).label}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Répétez votre mot de passe"
                                    className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                        confirmPassword && confirmPassword !== password 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : confirmPassword && confirmPassword === password 
                                            ? 'border-emerald-300 focus:ring-emerald-500' 
                                            : 'border-slate-200 focus:ring-blue-600'
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="pt-1">
                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-xs text-slate-600 leading-tight">
                                    J'accepte les <a href="#" className="text-blue-600 underline">Conditions d'Utilisation</a> et la <a href="#" className="text-blue-600 underline">Charte Citoyenne</a> de Le Monde à Vous.
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>Créer mon Compte Citoyen</span>
                                </>
                            )}
                        </button>

                        {/* Switch to Sign In */}
                        <div className="pt-2 text-center">
                            <p className="text-xs text-slate-500">
                                Vous avez déjà un compte ?{' '}
                                <button
                                    type="button"
                                    onClick={() => { clearStatus(); setMode('signin'); }}
                                    className="font-semibold text-blue-600 hover:text-blue-800 underline ml-1"
                                >
                                    Se connecter
                                </button>
                            </p>
                        </div>
                    </form>
                )}

                {/* MODE: MOT DE PASSE OUBLIÉ (FORGOT PASSWORD) */}
                {mode === 'forgot' && (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                            Saisissez votre adresse email. Nous vous transmettrons un lien sécurisé permettant de réinitialiser votre mot de passe instantanément.
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Adresse Email de Récupération
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ex: amadou@domaine.com"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <KeyRound size={18} />
                                    <span>Envoyer le lien de réinitialisation</span>
                                </>
                            )}
                        </button>

                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => { clearStatus(); setMode('signin'); }}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                ← Revenir à la page de connexion
                            </button>
                        </div>
                    </form>
                )}

                {/* MODE: NOUVEAU MOT DE PASSE (RESET PASSWORD VIA RECOVERY TOKEN) */}
                {mode === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                            Définissez votre nouveau mot de passe sécurisé pour finaliser la récupération de votre compte.
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Nouveau Mot de Passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                                Confirmer le Mot de Passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>Valider et Enregistrer</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* Footer Notice */}
                <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                    <p className="text-[11px] text-slate-400">
                        Protection des données certifiée • Chiffrement de bout-en-bout • Famille Diallo
                    </p>
                </div>
            </div>
        </div>
    );
};
