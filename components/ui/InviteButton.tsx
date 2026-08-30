import React, { useEffect, useState } from 'react';
import { UserPlus, Copy, Check, Users, Loader2 } from 'lucide-react';
import { supabaseService } from '../../services/supabaseClient';
import { ShareButton } from './ShareButton';

/**
 * ÉQUIPE F6 — Bouton Inviter GLOBAL (réutilisable par tout module).
 *
 * Chaque membre dispose d'un lien et d'un code d'invitation personnels,
 * générés côté serveur (`get_or_create_invite_code`). Une inscription via
 * ce lien/code est rattachée au parrain en base (`accept_invitation`,
 * SECURITY DEFINER : refuse auto-parrainage et double parrainage) — le
 * suivi affiché est donc RÉEL : uniquement les comptes réellement créés
 * via l'invitation. Le « nombre d'envois » n'est volontairement pas
 * affiché : un lien collé dans WhatsApp est hors de portée d'une mesure
 * honnête.
 */

const PROD_ORIGIN = 'https://moknet.net';

export const InviteButton: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || 'w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs flex items-center gap-2 font-bold'}
        title="Inviter de nouveaux membres sur MokNet"
      >
        <UserPlus size={15} className="text-emerald-600" />
        {!compact && <span>Inviter des membres</span>}
      </button>
      {open && <InviteModal onClose={() => setOpen(false)} />}
    </>
  );
};

const InviteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'lien' | 'code' | null>(null);
  const [results, setResults] = useState<{ invitedName: string; acceptedAt: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [c, invits] = await Promise.all([
        supabaseService.getMyInviteCode(),
        supabaseService.getMyInvitations(),
      ]);
      if (cancelled) return;
      setCode(c);
      setResults(invits);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const inviteLink = code ? `${PROD_ORIGIN}/?invite=${code}` : null;

  const copy = async (value: string, which: 'lien' | 'code') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      alert('La copie a échoué — copiez manuellement : ' + value);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex items-center gap-2 font-black text-sm"><UserPlus size={18} /> Inviter sur MokNet</div>
          <p className="text-[11px] text-emerald-50 mt-1">
            Partagez votre lien ou votre code — chaque compte créé par ce chemin vous est rattaché, et vous le voyez ici.
          </p>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 py-6 justify-center">
              <Loader2 size={16} className="animate-spin" /> Génération de votre code…
            </div>
          ) : !code ? (
            <div className="text-rose-600 font-bold py-4 text-center">
              Impossible de générer votre code pour le moment — vérifiez votre connexion et réessayez.
            </div>
          ) : (
            <>
              <div>
                <div className="font-black text-slate-700 mb-1">Votre lien d'invitation</div>
                <div className="flex items-center gap-2">
                  <input readOnly value={inviteLink || ''} className="flex-1 px-3 py-2 bg-slate-100 rounded-xl text-[11px] text-slate-700 outline-none min-w-0" />
                  <button onClick={() => copy(inviteLink!, 'lien')} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700" title="Copier le lien">
                    {copied === 'lien' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <ShareButton
                    url={inviteLink!}
                    title="Rejoins-moi sur MokNet"
                    text="Crée ton compte avec mon lien d'invitation"
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center"
                    iconSize={14}
                  />
                </div>
              </div>

              <div>
                <div className="font-black text-slate-700 mb-1">Votre code (à saisir à l'inscription)</div>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-slate-900 text-emerald-300 rounded-xl font-mono font-black tracking-[0.25em] text-sm">{code}</span>
                  <button onClick={() => copy(code, 'code')} className="p-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300" title="Copier le code">
                    {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="font-black text-slate-700 mb-2 flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-600" />
                  Résultats réels : {results.length} membre{results.length > 1 ? 's' : ''} recruté{results.length > 1 ? 's' : ''}
                </div>
                {results.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">
                    Personne n'a encore rejoint via votre invitation. Ce compteur ne montre que des inscriptions réellement abouties — jamais une estimation.
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-36 overflow-y-auto">
                    {results.map((r, i) => (
                      <li key={i} className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 rounded-xl">
                        <span className="font-bold text-emerald-900">{r.invitedName}</span>
                        <span className="text-[10px] text-emerald-700">{new Date(r.acceptedAt).toLocaleDateString('fr-FR')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-bold text-slate-700">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
