import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  History,
  Lock,
  RefreshCw,
  Send,
  Sparkles,
  Wallet as WalletIcon,
} from 'lucide-react';
import { CURRENCIES } from '../constants';
import { Currency, UserProfile } from '../types';
import { AIProxyClient } from '../services/aiProxy';
import { walletLedger, type WalletAccount, type WalletLedgerTransaction } from '../services/walletLedger';
import { useGlobal } from '../contexts/GlobalContext';

interface WalletProps {
  userProfile: UserProfile;
}

const errorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('AUTH_REQUIRED')) return 'Reconnectez-vous pour consulter le ledger.';
  if (message.includes('INSUFFICIENT_FUNDS')) return 'Solde insuffisant pour ce transfert.';
  if (message.includes('INVALID_RECIPIENT')) return 'Le bénéficiaire doit être identifié par son UUID MokChat.';
  if (message.includes('WALLET_BACKEND_UNAVAILABLE')) return 'Ledger Supabase non configuré.';
  return 'Le ledger n’a pas pu traiter la demande. Aucun débit n’a été enregistré.';
};

export const Wallet: React.FC<WalletProps> = ({ userProfile }) => {
  const { addNotification } = useGlobal();
  const [activeTab, setActiveTab] = useState<'ledger' | 'transfer' | 'exchange'>('ledger');
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [transactions, setTransactions] = useState<WalletLedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState(100);
  const [transferCurrency, setTransferCurrency] = useState('EUR');
  const [reference, setReference] = useState('Transfert MokChat');
  const [isTransferring, setIsTransferring] = useState(false);

  const [amountFrom, setAmountFrom] = useState(1);
  const [currencyFrom, setCurrencyFrom] = useState<Currency>(CURRENCIES[0] || { code: 'EUR', name: 'Euro', symbol: '€', rateToEuro: 1 });
  const [currencyTo, setCurrencyTo] = useState<Currency>(CURRENCIES[1] || CURRENCIES[0] || { code: 'USD', name: 'US Dollar', symbol: '$', rateToEuro: 0.92 });
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const refreshWallet = useCallback(async () => {
    setIsLoading(true);
    setLedgerError(null);
    try {
      const [nextAccounts, nextTransactions] = await Promise.all([
        walletLedger.listAccounts(),
        walletLedger.listTransactions(100),
      ]);
      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      if (nextAccounts.length > 0 && !nextAccounts.some((account) => account.currency === transferCurrency)) {
        setTransferCurrency(nextAccounts[0].currency);
      }
    } catch (error) {
      setAccounts([]);
      setTransactions([]);
      setLedgerError(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [transferCurrency]);

  useEffect(() => { void refreshWallet(); }, [refreshWallet]);

  const primaryAccount = accounts.find((account) => account.currency === 'EUR') ?? accounts[0];
  const transferBalance = accounts.find((account) => account.currency === transferCurrency)?.balance ?? 0;
  const resultExchange = useMemo(() => {
    if (!currencyFrom || !currencyTo) return 0;
    return amountFrom * ((1 / currencyFrom.rateToEuro) * currencyTo.rateToEuro);
  }, [amountFrom, currencyFrom, currencyTo]);

  const handleTransfer = async () => {
    setIsTransferring(true);
    try {
      await walletLedger.transfer({
        recipientId: recipientId.trim(),
        amount: transferAmount,
        currency: transferCurrency,
        reference: reference.trim().slice(0, 240),
        idempotencyKey: crypto.randomUUID(),
      });
      await refreshWallet();
      addNotification('Transfert enregistré', 'Le débit et le crédit ont été inscrits atomiquement dans le ledger MokChat.', 'success');
      setRecipientId('');
    } catch (error) {
      const message = errorMessage(error);
      setLedgerError(message);
      addNotification('Transfert refusé', message, 'alert');
    } finally {
      setIsTransferring(false);
    }
  };

  const getFinancialAdvice = async () => {
    setIsThinking(true);
    try {
      const balances = accounts.map((account) => `${account.balance.toFixed(2)} ${account.currency}`).join(', ') || 'aucun solde';
      const history = transactions.slice(0, 5).map((transaction) => `${transaction.type}: ${transaction.amount} ${transaction.currency}`).join(', ') || 'aucune écriture';
      const response = await new AIProxyClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Fournis trois pistes générales de gestion budgétaire, sans conseil financier réglementé ni décision automatisée. Profil: ${userProfile.name}. Soldes ledger: ${balances}. Écritures récentes: ${history}.`,
      });
      setCoachAdvice(response.text || 'Conseil non disponible.');
    } catch {
      setCoachAdvice('Coach non configuré. Les soldes du ledger restent disponibles sans analyse IA.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 animate-fade-up">
      <div className="bg-slate-900 p-8 pb-14 text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-300"><WalletIcon size={14} /> Ledger MokChat</div>
            <h1 className="text-3xl font-bold">Portefeuille interne</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Soldes issus d’écritures immuables. Ce service n’est ni une banque, ni une carte, ni un prestataire de paiement externe.</p>
          </div>
          <div className="flex gap-2 rounded-xl bg-white/10 p-1">
            {([['ledger', 'Ledger'], ['transfer', 'Transfert interne'], ['exchange', 'Conversion indicative']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`rounded-lg px-4 py-2 text-xs font-bold ${activeTab === id ? 'bg-brand-600 text-white' : 'text-slate-200 hover:bg-white/10'}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="-mt-7 flex-1 overflow-y-auto px-6 pb-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {ledgerError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={17} /> {ledgerError}</div>}

          {activeTab === 'ledger' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800 to-black p-7 text-white shadow-xl">
                <div className="flex items-start justify-between"><span className="font-bold tracking-widest">COMPTE LEDGER</span><button onClick={() => void refreshWallet()} disabled={isLoading} aria-label="Actualiser le ledger"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button></div>
                <div className="my-9"><div className="text-xs uppercase text-slate-400">Solde principal vérifié</div><div className="mt-1 text-3xl font-bold">{primaryAccount ? `${primaryAccount.balance.toFixed(2)} ${primaryAccount.currency}` : '—'}</div></div>
                <div className="text-xs text-slate-400">Titulaire authentifié</div><div className="font-medium uppercase">{userProfile.name}</div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {accounts.map((account) => <div key={account.currency} className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-400">{account.currency}</div><div className="font-bold">{account.balance.toFixed(2)}</div></div>)}
                  {!isLoading && accounts.length === 0 && <p className="col-span-2 text-sm text-slate-400">Aucune écriture dans le ledger.</p>}
                </div>
              </div>

              <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800"><History size={18} /> Écritures récentes</h3>
                <div className="max-h-[360px] space-y-2 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between rounded-xl border-b border-slate-100 p-3">
                      <div className="flex items-center gap-3"><div className={`rounded-full p-2 ${transaction.amount < 0 ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>{transaction.amount < 0 ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}</div><div><div className="text-sm font-bold text-slate-800">{transaction.reference || transaction.type}</div><div className="text-xs text-slate-400">{new Date(transaction.createdAt).toLocaleString('fr-FR')}</div></div></div>
                      <div className={`text-sm font-bold ${transaction.amount < 0 ? 'text-slate-800' : 'text-green-600'}`}>{transaction.amount > 0 ? '+' : ''}{transaction.amount} {transaction.currency}</div>
                    </div>
                  ))}
                  {!isLoading && transactions.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucune écriture récente.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
              <div className="bg-brand-600 p-6 text-center text-white"><Send className="mx-auto mb-2" /><h2 className="text-xl font-bold">Transfert entre comptes MokChat</h2><p className="text-sm text-brand-100">Aucun Mobile Money ou virement bancaire externe n’est simulé.</p></div>
              <div className="space-y-5 p-8">
                <label className="block text-xs font-bold uppercase text-slate-500">UUID Supabase du bénéficiaire<input value={recipientId} onChange={(event) => setRecipientId(event.target.value)} placeholder="00000000-0000-4000-8000-000000000000" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm normal-case" /></label>
                <label className="block text-xs font-bold uppercase text-slate-500">Référence<input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={240} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm normal-case" /></label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="mb-2 flex justify-between text-xs font-bold uppercase text-slate-500"><span>Montant</span><span>Solde : {transferBalance.toFixed(2)} {transferCurrency}</span></div><div className="flex gap-2"><input type="number" min="0.01" step="0.01" value={transferAmount} onChange={(event) => setTransferAmount(Number(event.target.value))} className="min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none" /><select value={transferCurrency} onChange={(event) => setTransferCurrency(event.target.value)} className="rounded-lg border bg-white px-3 font-bold">{(accounts.length ? accounts : [{ currency: 'EUR' }]).map((account) => <option key={account.currency}>{account.currency}</option>)}</select></div></div>
                <button onClick={() => void handleTransfer()} disabled={isTransferring || !recipientId || transferAmount <= 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white disabled:opacity-50">{isTransferring ? <RefreshCw className="animate-spin" /> : <Lock size={18} />}{isTransferring ? 'Écriture atomique…' : 'Confirmer dans le ledger'}</button>
              </div>
            </div>
          )}

          {activeTab === 'exchange' && (
            <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-slate-800"><ArrowRightLeft className="text-brand-600" /> Conversion indicative</h2>
              <p className="mb-6 text-sm text-amber-700">Aucun fournisseur de taux ni RPC de change n’est configuré : ce calcul local n’effectue aucune transaction.</p>
              <div className="grid gap-4 md:grid-cols-2"><div className="flex rounded-xl border p-2"><input type="number" value={amountFrom} onChange={(event) => setAmountFrom(Number(event.target.value))} className="min-w-0 flex-1 px-2 text-2xl font-bold outline-none" /><select value={currencyFrom.code} onChange={(event) => setCurrencyFrom(CURRENCIES.find((currency) => currency.code === event.target.value) || currencyFrom)}>{CURRENCIES.map((currency) => <option key={currency.code}>{currency.code}</option>)}</select></div><div className="flex rounded-xl border bg-slate-50 p-2"><div className="flex-1 px-2 text-2xl font-bold">{resultExchange.toFixed(2)}</div><select value={currencyTo.code} onChange={(event) => setCurrencyTo(CURRENCIES.find((currency) => currency.code === event.target.value) || currencyTo)}>{CURRENCIES.map((currency) => <option key={currency.code}>{currency.code}</option>)}</select></div></div>
              <button disabled className="mt-6 w-full rounded-xl bg-slate-300 py-3 font-bold text-slate-600">Change indisponible — fournisseur réglementé requis</button>
            </div>
          )}

          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-xl sm:flex-row sm:items-center"><div><h3 className="flex items-center gap-2 text-lg font-bold"><Sparkles size={20} className="text-yellow-300" /> Orientation budgétaire IA</h3><p className="mt-1 text-sm text-purple-100">Information générale, pas un conseil financier réglementé.</p></div><button onClick={() => void getFinancialAdvice()} disabled={isThinking || isLoading} className="rounded-xl bg-white px-6 py-3 font-bold text-purple-600 disabled:opacity-60">{isThinking ? 'Analyse…' : 'Analyser le ledger'}</button></div>
          {coachAdvice && <div className="whitespace-pre-line rounded-2xl border-l-4 border-purple-500 bg-white p-6 text-sm leading-relaxed text-slate-600 shadow-sm">{coachAdvice}</div>}
        </div>
      </div>
    </div>
  );
};
