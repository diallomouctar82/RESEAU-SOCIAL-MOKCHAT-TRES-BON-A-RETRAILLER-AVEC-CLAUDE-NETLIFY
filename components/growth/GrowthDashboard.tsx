import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Heart, MessageSquare, Share2, UserPlus, Clock, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabaseClient';
import { generateJSON } from '../../services/aiGateway';
import { InviteButton } from '../ui/InviteButton';

/**
 * ÉQUIPE F7 — Agent Croissance & Diffusion + tableau de bord de croissance.
 *
 * Discipline anti-métrique-inventée : chaque nombre affiché vient de
 * `get_my_growth_stats()` (SECURITY INVOKER — la RLS s'applique, uniquement
 * les données du compte). Les conseils « automatiques » sont DÉTERMINISTES,
 * dérivés de ces mesures réelles ; le conseil IA optionnel reçoit UNIQUEMENT
 * ce résumé chiffré réel (budget contextuel minimal — jamais l'historique).
 */

type Stats = Record<string, number | null>;

const statCards: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'posts_publies', label: 'Publications', icon: <MessageSquare size={15} className="text-indigo-600" /> },
  { key: 'reactions_recues', label: 'Réactions reçues', icon: <Heart size={15} className="text-rose-600" /> },
  { key: 'commentaires_recus', label: 'Commentaires reçus', icon: <MessageSquare size={15} className="text-amber-600" /> },
  { key: 'partages_recus', label: 'Partages reçus', icon: <Share2 size={15} className="text-emerald-600" /> },
  { key: 'amis', label: 'Amis', icon: <Users size={15} className="text-sky-600" /> },
  { key: 'abonnes', label: 'Abonnés', icon: <Users size={15} className="text-violet-600" /> },
  { key: 'invitations_acceptees', label: 'Membres recrutés', icon: <UserPlus size={15} className="text-teal-600" /> },
];

/** Conseils déterministes — chaque phrase cite la mesure réelle qui la fonde. */
const deterministicAdvice = (s: Stats): string[] => {
  const advice: string[] = [];
  const posts = s.posts_publies ?? 0;
  const partages = s.partages_recus ?? 0;
  const invitations = s.invitations_acceptees ?? 0;
  const abonnes = s.abonnes ?? 0;
  const bestHour = s.meilleure_heure;

  if (posts === 0) advice.push("Vous n'avez encore aucune publication : publier est le premier levier de visibilité — le fil ne peut recommander que ce qui existe.");
  if (posts > 0 && partages === 0) advice.push(`Vos ${posts} publication${posts > 1 ? 's' : ''} n'ont encore reçu aucun partage : utilisez le bouton Partager pour les diffuser vous-même vers vos canaux avec un lien de retour.`);
  if (invitations === 0) advice.push("Aucun membre recruté pour l'instant : votre lien d'invitation personnel rattache réellement chaque inscription à votre compte — commencez par vos proches.");
  if (typeof bestHour === 'number') advice.push(`Vos publications reçoivent le plus de réactions autour de ${bestHour} h — publier dans ce créneau maximise vos chances d'être vu.`);
  if (posts > 0 && abonnes === 0) advice.push("Personne ne vous suit encore : commenter et réagir aux publications des autres est le chemin le plus court vers vos premiers abonnés.");
  if (advice.length === 0) advice.push('Vos indicateurs progressent — continuez à publier régulièrement et à inviter : chaque mesure ci-dessus est réelle, revenez la voir évoluer.');
  return advice;
};

export const GrowthDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const s = await supabaseService.getMyGrowthStats();
    setStats(s);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const askAgent = async () => {
    if (!stats || aiLoading) return;
    setAiLoading(true);
    setAiTip(null);
    try {
      // Budget contextuel minimal : UNIQUEMENT les mesures réelles.
      const res = await generateJSON<{ conseil: string }>(
        `Tu es l'agent Croissance & Diffusion de MokNet. Voici les mesures RÉELLES du membre (rien d'autre n'existe) : ${JSON.stringify(stats)}. ` +
        `Donne UN conseil concret et actionnable pour développer sa visibilité sur MokNet, fondé UNIQUEMENT sur ces chiffres — n'invente aucune donnée, aucun pourcentage, aucune comparaison à d'autres membres. ` +
        `Réponds en JSON strict : {"conseil": "..."} (2 phrases max, en français).`
      );
      setAiTip(res?.conseil || null);
      if (!res?.conseil) setAiTip("L'agent n'a pas pu formuler de conseil pour le moment — les conseils automatiques ci-dessus restent valables.");
    } catch {
      setAiTip("L'agent IA est indisponible pour le moment — les conseils automatiques ci-dessus restent valables.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-black text-sm"><TrendingUp size={17} /> Croissance & Diffusion</div>
          <p className="text-[11px] text-teal-50 mt-0.5">Chaque chiffre est mesuré en base — jamais estimé.</p>
        </div>
        <button onClick={() => void load()} className="p-2 bg-white/15 hover:bg-white/25 rounded-xl" title="Actualiser">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 py-8 justify-center text-xs">
            <Loader2 size={16} className="animate-spin" /> Mesure en cours…
          </div>
        ) : !stats ? (
          <p className="text-xs text-rose-600 font-bold py-4 text-center">
            Mesures indisponibles (hors ligne ?) — aucun chiffre n'est affiché plutôt qu'un chiffre inventé.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statCards.map((c) => (
                <div key={c.key} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">{c.icon}{c.label}</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{stats[c.key] ?? 0}</div>
                </div>
              ))}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><Clock size={15} className="text-slate-600" />Meilleure heure</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {typeof stats.meilleure_heure === 'number' ? `${stats.meilleure_heure} h` : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Conseils automatiques (fondés sur vos mesures)</div>
              {deterministicAdvice(stats).map((a, i) => (
                <div key={i} className="px-3 py-2 bg-teal-50 border border-teal-100 rounded-xl text-[11px] text-teal-900 leading-snug">{a}</div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => void askAgent()}
                disabled={aiLoading}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-teal-300" />}
                Conseil de l'agent (IA)
              </button>
              <InviteButton className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2" />
            </div>
            {aiTip && (
              <div className="px-3 py-2.5 bg-slate-900 rounded-2xl text-[11px] text-teal-100 leading-snug">
                <span className="font-black text-teal-300 block mb-0.5">Agent Croissance & Diffusion :</span>
                {aiTip}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
