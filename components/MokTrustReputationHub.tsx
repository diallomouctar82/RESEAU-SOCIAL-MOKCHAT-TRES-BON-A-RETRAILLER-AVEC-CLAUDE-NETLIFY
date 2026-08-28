import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Info,
  MessageSquare,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { mokTrustService, type MokTrustScore } from '../services/mokTrust';

interface MokTrustReputationHubProps {
  onOpenExpertChat?: (agentId?: string, initialPrompt?: string) => void;
}

type ViewState = 'loading' | 'ready' | 'error' | 'offline';

const statusCopy: Record<MokTrustScore['status'], { title: string; detail: string; tone: string }> = {
  insufficient_data: {
    title: 'Données insuffisantes',
    detail: 'Le serveur conserve le calcul, mais ne publie pas encore de verdict fiable.',
    tone: 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  },
  provisional: {
    title: 'Indice provisoire',
    detail: 'Des signaux existent, mais l’indice doit encore gagner en profondeur.',
    tone: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  },
  established: {
    title: 'Indice établi',
    detail: 'Le volume de signaux atteint le seuil de confiance de l’algorithme.',
    tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  },
};

const formatCalculationDate = (value: string): string => {
  if (!value) return 'Date indisponible';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date indisponible';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

export const MokTrustReputationHub: React.FC<MokTrustReputationHubProps> = ({ onOpenExpertChat }) => {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [score, setScore] = useState<MokTrustScore | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadScore = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setViewState('offline');
      return;
    }

    setViewState('loading');
    setErrorMessage('');
    try {
      const nextScore = await mokTrustService.refreshMyScore();
      setScore(nextScore);
      setViewState('ready');
    } catch (error) {
      setScore(null);
      setErrorMessage(error instanceof Error ? error.message : 'Le calcul MokTrust est indisponible.');
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    void loadScore();
    const handleOnline = () => { void loadScore(); };
    const handleOffline = () => setViewState('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadScore]);

  const retryButton = (
    <button
      type="button"
      onClick={() => { void loadScore(); }}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
    >
      <RefreshCw size={15} aria-hidden="true" />
      Recalculer
    </button>
  );

  return (
    <section className="space-y-6" aria-labelledby="moktrust-title" aria-busy={viewState === 'loading'}>
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-300">
              <ShieldCheck size={14} aria-hidden="true" />
              MokTrust · calcul serveur
            </span>
            <h2 id="moktrust-title" className="text-2xl font-black text-white sm:text-3xl">
              Indice de confiance communautaire
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Cet indice mesure des signaux observables dans Mok : ancienneté du compte,
              contributions et réactions reçues. Le calcul est effectué puis horodaté par
              Supabase ; le navigateur ne peut ni choisir ni modifier la note.
            </p>
          </div>
          {viewState === 'ready' && retryButton}
        </div>
      </div>

      <div aria-live="polite">
        {viewState === 'loading' && (
          <div className="flex min-h-48 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-300">
            <RefreshCw size={20} className="mr-3 animate-spin text-indigo-400" aria-hidden="true" />
            Calcul serveur en cours…
          </div>
        )}

        {viewState === 'offline' && (
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold">Indice indisponible hors ligne</h3>
                  <p className="mt-1 text-xs text-amber-100/80">
                    Aucun score local ou ancien n’est affiché comme s’il provenait du serveur.
                  </p>
                </div>
                {retryButton}
              </div>
            </div>
          </div>
        )}

        {viewState === 'error' && (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-rose-300" aria-hidden="true" />
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold">Calcul non disponible</h3>
                  <p className="mt-1 text-xs text-rose-100/80">{errorMessage}</p>
                </div>
                {retryButton}
              </div>
            </div>
          </div>
        )}

        {viewState === 'ready' && score && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Indice actuel</p>
                <div className="mt-3 text-5xl font-black text-indigo-300">
                  {score.status === 'insufficient_data' ? '—' : score.score}
                  <span className="text-lg text-slate-500"> / 100</span>
                </div>
                <div className={`mx-auto mt-4 max-w-xs rounded-2xl border p-3 ${statusCopy[score.status].tone}`}>
                  <p className="text-sm font-black">{statusCopy[score.status].title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed opacity-80">{statusCopy[score.status].detail}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white">Confiance statistique</h3>
                    <p className="mt-1 text-xs text-slate-400">Quantité de signaux disponibles, distincte de la note.</p>
                  </div>
                  <span className="text-xl font-black text-white">{score.confidence}%</span>
                </div>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label="Confiance statistique du score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={score.confidence}
                >
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${score.confidence}%` }} />
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: CalendarDays, label: 'Ancienneté', value: `${score.accountAgeDays} j` },
                    { icon: MessageSquare, label: 'Contributions', value: score.contributionsCount },
                    { icon: Users, label: 'Réactions reçues', value: score.reactionsReceivedCount },
                    { icon: Scale, label: 'Décisions fondées', value: score.confirmedFindingsCount },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                        <Icon size={12} aria-hidden="true" /> {label}
                      </dt>
                      <dd className="mt-2 text-lg font-black text-white">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" aria-hidden="true" />
                <h3 className="font-bold text-white">Décomposition vérifiable</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: 'Base neutre', value: score.components.neutralBase, max: 35 },
                  { label: 'Ancienneté', value: score.components.accountMaturity, max: 20 },
                  { label: 'Contributions', value: score.components.communityContributions, max: 25 },
                  { label: 'Retours pairs', value: score.components.peerFeedback, max: 20 },
                  { label: 'Modération fondée', value: score.components.moderationAdjustment, max: 0 },
                ].map((component) => (
                  <div key={component.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-[11px] font-bold text-slate-400">{component.label}</p>
                    <p className={`mt-2 text-xl font-black ${component.value < 0 ? 'text-rose-300' : 'text-indigo-300'}`}>
                      {component.value > 0 ? '+' : ''}{component.value}
                      {component.max > 0 && <span className="text-xs text-slate-600"> / {component.max}</span>}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
                Les blocages et signalements ouverts ne pénalisent jamais le score. Seule une décision
                documentée « fondée », enregistrée par un modérateur, produit un ajustement.
              </p>
            </div>

            <div className="rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5 text-xs text-sky-100">
              <div className="flex items-start gap-3">
                <Info size={18} className="mt-0.5 shrink-0 text-sky-300" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-bold">Portée exacte de MokTrust</p>
                  <p className="leading-relaxed text-sky-100/75">
                    Cet indice n’est ni une vérification d’identité, ni une certification d’entreprise,
                    ni une garantie de paiement, de livraison ou de qualité commerciale.
                  </p>
                  <p className="text-[10px] text-sky-200/60">
                    Algorithme {score.algorithmVersion} · calculé le {formatCalculationDate(score.calculatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {onOpenExpertChat && (
              <button
                type="button"
                onClick={() => onOpenExpertChat('1', 'Aidez-moi à comprendre les signaux de mon indice MokTrust communautaire.')}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <Sparkles size={15} aria-hidden="true" />
                Comprendre mon indice
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
