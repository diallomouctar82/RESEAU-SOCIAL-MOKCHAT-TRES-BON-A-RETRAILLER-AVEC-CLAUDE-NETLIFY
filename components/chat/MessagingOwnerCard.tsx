import React from 'react';
import { InitialsAvatar } from '../ui/InitialsAvatar';

export type OwnerPresence = 'online' | 'offline';

export interface MessagingOwnerCardProps {
  /** Nom du propriétaire du compte connecté (`currentUser.name`). */
  name: string;
  /** Photo réelle du profil (`currentUser.avatarUrl`) ; absente → initiales. */
  avatarUrl?: string | null;
  /** Présence Realtime du propriétaire lui-même ; absente → aucun statut affiché (rien n'est inventé). */
  presence?: OwnerPresence;
  className?: string;
}

/**
 * Carte d'identité du propriétaire du compte, en tête de la liste des
 * conversations (VF-7) : jusqu'ici l'en-tête n'affichait qu'une icône et le
 * titre « Messagerie Privée » — la personne connectée ne se voyait jamais.
 * Rendue sur le bandeau sombre de la fenêtre de messagerie : texte blanc /
 * slate-200, mention « Vous » pour lever toute ambiguïté avec un correspondant.
 */
export const MessagingOwnerCard: React.FC<MessagingOwnerCardProps> = ({
  name,
  avatarUrl,
  presence,
  className = '',
}) => {
  const displayName = name?.trim() || 'Membre';
  const isOnline = presence === 'online';

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <div className="relative flex-shrink-0">
        <InitialsAvatar name={displayName} avatarUrl={avatarUrl} size={40} className="ring-2 ring-indigo-400" />
        {presence && (
          <span
            aria-hidden="true"
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-extrabold text-xs sm:text-sm text-white truncate">{displayName}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[9px] font-bold uppercase tracking-wide text-slate-200 flex-shrink-0">
            Vous
          </span>
        </div>
        <p className="text-[10px] text-slate-300 flex items-center gap-1.5 min-w-0">
          <span className="truncate" title="Visible uniquement par les membres de chaque discussion">Messagerie Privée</span>
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-mono flex-shrink-0">
            Realtime
          </span>
          {presence && (
            <span className={`flex-shrink-0 font-semibold ${isOnline ? 'text-emerald-300' : 'text-slate-400'}`}>
              {isOnline ? '· En ligne' : '· Hors ligne'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
