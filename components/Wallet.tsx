
import React, { useState } from 'react';
import { CreditCard, RefreshCw, Send, History, Wallet as WalletIcon, TrendingUp, ArrowRightLeft, DollarSign, Globe, Lock, CheckCircle, Smartphone, Sparkles, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CURRENCIES } from '../constants';
import { Currency, UserProfile } from '../types';
import { generateText } from '../services/aiGateway';
import { useGlobal } from '../contexts/GlobalContext';

interface WalletProps {
    userProfile: UserProfile;
}

export const Wallet: React.FC<WalletProps> = ({ userProfile }) => {
    const { transactions, addTransaction, addNotification } = useGlobal();
    const [activeTab, setActiveTab] = useState<'cards' | 'transfer' | 'exchange' | 'coach'>('cards');
    
    // Exchange State
    const [amountFrom, setAmountFrom] = useState(1);
    const [currencyFrom, setCurrencyFrom] = useState<Currency>(CURRENCIES[0] || { code: 'EUR', name: 'Euro', symbol: '€', rateToEuro: 1 });
    const [currencyTo, setCurrencyTo] = useState<Currency>(CURRENCIES.length > 1 ? CURRENCIES[1] : (CURRENCIES[0] || { code: 'USD', name: 'US Dollar', symbol: '$', rateToEuro: 0.92 }));

    // Transfer State
    const [recipient, setRecipient] = useState('');
    const [transferAmount, setTransferAmount] = useState(100);
    const [transferCountry, setTransferCountry] = useState('Sénégal');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferSuccess, setTransferSuccess] = useState(false);

    // AI Coach
    const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const getExchangeRate = (from: Currency, to: Currency) => {
        if (!from || !to) return 0;
        return (1 / from.rateToEuro) * to.rateToEuro;
    };

    const resultExchange = amountFrom * getExchangeRate(currencyFrom, currencyTo);

    const handleTransfer = () => {
        if (transferAmount > 1250) { // Mock balance check
             addNotification("Solde insuffisant", "Vous n'avez pas assez de fonds pour ce transfert.", "alert");
             return;
        }
        
        setIsTransferring(true);
        setTimeout(() => {
            setIsTransferring(false);
            setTransferSuccess(true);
            
            // Execute Transaction
            addTransaction({
                id: `tx-${Date.now()}`,
                type: 'transfer',
                amount: -transferAmount,
                currency: 'EUR',
                date: new Date().toLocaleDateString(),
                description: `Transfert vers ${recipient} (${transferCountry})`,
                recipient: recipient,
                status: 'completed'
            });
            
            addNotification("Transfert Réussi", `${transferAmount}€ envoyés à ${recipient}.`, "success");

            setTimeout(() => {
                setTransferSuccess(false);
                setRecipient('');
                setTransferAmount(100);
            }, 3000);
        }, 2000);
    };

    const handleExchange = () => {
        addTransaction({
            id: `ex-${Date.now()}`,
            type: 'exchange',
            amount: -amountFrom,
            currency: currencyFrom.code,
            date: new Date().toLocaleDateString(),
            description: `Change: ${amountFrom} ${currencyFrom.code} -> ${resultExchange.toFixed(2)} ${currencyTo.code}`,
            status: 'completed'
        });
        addNotification("Change Effectué", "Votre portefeuille de devises a été mis à jour.", "success");
    };

    const getFinancialAdvice = async () => {
        setIsThinking(true);
        try {
            const prompt = `Agis comme un conseiller financier personnel.
            Profil : ${userProfile.name}.
            Solde actuel : 1250.00 €.
            Historique récent : ${transactions.slice(0, 3).map(t => `${t.description} (${t.amount})`).join(', ')}.

            Donne 3 conseils courts pour optimiser le budget.`;

            const text = await generateText(prompt);
            setCoachAdvice(text || "Conseil non disponible.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 pb-16 shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-brand-300 font-bold uppercase text-xs tracking-wider mb-2">
                            <WalletIcon size={14} /> Espace Finance
                        </div>
                        <h1 className="text-3xl font-bold">Banque Solidaire</h1>
                        <p className="text-slate-400 max-w-xl mt-2">
                            Gérez vos finances mondiales, envoyez de l'argent et économisez intelligemment.
                        </p>
                    </div>
                    
                    <div className="flex gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
                        <button onClick={() => setActiveTab('cards')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'cards' ? 'bg-brand-600 text-white shadow-md' : 'text-white hover:bg-white/10'}`}>Ma Carte</button>
                        <button onClick={() => setActiveTab('transfer')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'transfer' ? 'bg-brand-600 text-white shadow-md' : 'text-white hover:bg-white/10'}`}>Transfert</button>
                        <button onClick={() => setActiveTab('exchange')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'exchange' ? 'bg-brand-600 text-white shadow-md' : 'text-white hover:bg-white/10'}`}>Change</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 -mt-8">
                <div className="max-w-5xl mx-auto">
                    
                    {activeTab === 'cards' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Card Visual */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group transition-transform hover:scale-[1.02] cursor-pointer border border-slate-700">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="relative z-10 flex flex-col justify-between h-48">
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-lg tracking-widest flex items-center gap-2">
                                                <Globe size={20} className="text-brand-400" /> WORLD CARD
                                            </div>
                                            <div className="text-sm font-mono text-slate-400">DEBIT</div>
                                        </div>
                                        <div className="font-mono text-2xl tracking-widest text-slate-200 shadow-black drop-shadow-md">
                                            **** **** **** 8842
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Titulaire</div>
                                                <div className="font-medium uppercase tracking-wide">{userProfile.name}</div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Solde Global</div>
                                                <div className="text-2xl font-bold">1,250.00 €</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-slate-200">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">XOF</div>
                                        <div className="font-bold text-slate-800">150,000 F</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-slate-200">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">USD</div>
                                        <div className="font-bold text-slate-800">$45.00</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm text-center border border-slate-200">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">CREDITS</div>
                                        <div className="font-bold text-yellow-500">{userProfile.credits} Ⓒ</div>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions History */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-fit">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <History size={18} /> Historique Récent
                                </h3>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                    {transactions.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-8">Aucune transaction récente.</p>
                                    ) : (
                                        transactions.map((t) => (
                                            <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.amount < 0 ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>
                                                        {t.amount < 0 ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800 line-clamp-1">{t.description}</div>
                                                        <div className="text-xs text-slate-400">{t.date}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-bold text-sm ${t.amount < 0 ? 'text-slate-800' : 'text-green-600'}`}>
                                                    {t.amount > 0 ? '+' : ''}{t.amount} {t.currency}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'transfer' && (
                        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                            <div className="bg-brand-600 p-6 text-white text-center">
                                <Send size={32} className="mx-auto mb-2 opacity-80" />
                                <h2 className="text-xl font-bold">Transfert Express International</h2>
                                <p className="text-brand-100 text-sm">Envoyez de l'argent à vos proches instantanément.</p>
                            </div>
                            
                            {!transferSuccess ? (
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pays de destination</label>
                                        <select value={transferCountry} onChange={(e) => setTransferCountry(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                                            <option value="Sénégal">🇸🇳 Sénégal</option>
                                            <option value="Maroc">🇲🇦 Maroc</option>
                                            <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                                            <option value="Canada">🇨🇦 Canada</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bénéficiaire</label>
                                        <div className="flex gap-2">
                                            <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500"><Smartphone size={20} /></div>
                                            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Nom ou Numéro Mobile Money" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Montant à envoyer</label>
                                            <span className="text-xs font-bold text-brand-600">Solde: 1,250.00 €</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(Number(e.target.value))} className="flex-1 bg-transparent text-3xl font-bold text-slate-800 outline-none" />
                                            <span className="text-xl font-bold text-slate-400">EUR</span>
                                        </div>
                                        <div className="h-px bg-slate-200 my-3"></div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Ils reçoivent (Estimé)</span>
                                            <span className="font-bold text-slate-800">{(transferAmount * 655.957).toLocaleString()} XOF</span>
                                        </div>
                                    </div>
                                    <button onClick={handleTransfer} disabled={!recipient || isTransferring} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                                        {isTransferring ? <RefreshCw className="animate-spin" /> : <Lock size={18} />}
                                        {isTransferring ? 'Traitement sécurisé...' : 'Confirmer le transfert'}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-4 animate-fade-up">
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><CheckCircle size={48} /></div>
                                    <h2 className="text-2xl font-bold text-slate-800">Transfert Réussi !</h2>
                                    <p className="text-slate-500">{transferAmount}€ ont été envoyés à {recipient}.<br/>Un reçu a été sauvegardé dans l'historique.</p>
                                    <button onClick={() => setTransferSuccess(false)} className="text-brand-600 font-bold hover:underline mt-4">Faire un autre envoi</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'exchange' && (
                        <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><RefreshCw className="text-brand-600" /> Convertisseur de Devises</h2>
                            <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1">Je vends</label>
                                    <div className="flex gap-2 p-2 border border-slate-200 rounded-xl">
                                        <input type="number" value={amountFrom} onChange={(e) => setAmountFrom(Number(e.target.value))} className="flex-1 text-2xl font-bold outline-none pl-2" />
                                        <select className="font-bold bg-slate-100 rounded-lg px-2 text-sm outline-none" value={currencyFrom.code} onChange={(e) => setCurrencyFrom(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}>
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="bg-slate-100 p-3 rounded-full text-slate-500"><ArrowRightLeft size={20} /></div>
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1">J'achète</label>
                                    <div className="flex gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50">
                                        <div className="flex-1 text-2xl font-bold pl-2 flex items-center text-slate-700">{resultExchange.toFixed(2)}</div>
                                        <select className="font-bold bg-white border border-slate-200 rounded-lg px-2 text-sm outline-none" value={currencyTo.code} onChange={(e) => setCurrencyTo(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[1])}>
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleExchange} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700">Confirmer le change</button>
                        </div>
                    )}

                    <div className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
                        <div><h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20} className="text-yellow-300" /> Coach Financier IA</h3><p className="text-purple-100 text-sm mt-1 max-w-lg">Obtenez des conseils personnalisés pour optimiser votre budget.</p></div>
                        <button onClick={getFinancialAdvice} disabled={isThinking} className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold shadow-lg hover:bg-purple-50 transition-colors disabled:opacity-80">{isThinking ? 'Analyse...' : 'Analyser mon Budget'}</button>
                    </div>
                    {coachAdvice && <div className="mt-6 bg-white p-6 rounded-2xl border-l-4 border-purple-500 shadow-sm animate-fade-up"><h4 className="font-bold text-slate-800 mb-2">Conseils du Coach Diallo :</h4><div className="prose prose-sm text-slate-600 whitespace-pre-line leading-relaxed">{coachAdvice}</div></div>}
                </div>
            </div>
        </div>
    );
};
