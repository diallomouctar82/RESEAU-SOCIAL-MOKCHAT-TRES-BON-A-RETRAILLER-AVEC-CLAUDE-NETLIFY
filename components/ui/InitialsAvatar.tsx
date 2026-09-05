import React, { useState } from 'react';

/**
 * Avatar d'identité (messagerie, VF-7) : la VRAIE photo quand elle existe,
 * sinon les INITIALES du nom sur un fond de couleur stable — jamais une photo
 * de banque d'images présentée comme celle d'un membre.
 *
 * Règles :
 *  - `avatarUrl` vide, blanc, ou égal au cliché de repli historique → initiales ;
 *  - image qui ne se charge pas (URL cassée, hors ligne) → initiales, jamais
 *    l'icône « image brisée » du navigateur ;
 *  - initiales = première lettre des deux premiers mots du nom ;
 *  - couleur de fond déterministe (dérivée du nom) : un même membre garde la
 *    même couleur d'un écran à l'autre, d'une session à l'autre ;
 *  - `role="img"` + `aria-label` = nom complet, pour que le lecteur d'écran
 *    annonce la personne et non deux lettres.
 */

/**
 * Identité visuelle : définitions remontées dans `services/studio/avatarIdentity.ts`
 * quand le Studio Avatar a eu besoin des mêmes règles côté service (un service
 * ne dépend pas d'un composant). Réexportées ici pour que tous les appelants
 * historiques de ce module continuent d'importer au même endroit.
 */
import { getInitials, realAvatarUrl } from '../../services/studio/avatarIdentity';

export {
  STOCK_PLACEHOLDER_MARKERS,
  isStockPlaceholderAvatar,
  realAvatarUrl,
  getInitials,
} from '../../services/studio/avatarIdentity';

/**
 * Teintes 700 des familles déjà employées dans l'app (indigo/bleu du chat,
 * navy institutionnel `brand-900`, accents) : toutes gardent un contraste
 * ≥ 4,5:1 avec du texte blanc.
 */
export const AVATAR_PALETTE = [
  '#4338CA', // indigo-700
  '#1D4ED8', // blue-700
  '#0369A1', // sky-700
  '#0F766E', // teal-700
  '#047857', // emerald-700
  '#B45309', // amber-700
  '#BE123C', // rose-700
  '#6D28D9', // violet-700
  '#A21CAF', // fuchsia-700
  '#334155', // slate-700
  '#0B254E', // navy institutionnel (brand-900)
  '#C2410C', // orange-700 (accent hover)
] as const;

/** Couleur de fond déterministe : même nom → même couleur, quel que soit l'écran. */
export const avatarColorFor = (name?: string | null): string => {
  const key = (name ?? '').trim().toLowerCase();
  let hash = 5381;
  for (let index = 0; index < key.length; index += 1) {
    hash = ((hash * 33) ^ key.charCodeAt(index)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

export interface InitialsAvatarProps {
  /** Nom complet — source des initiales, de la couleur et du libellé accessible. */
  name: string;
  avatarUrl?: string | null;
  /** Diamètre en pixels (36 par défaut). */
  size?: number;
  /** Classes additionnelles (anneau, marges…) appliquées à la photo comme aux initiales. */
  className?: string;
  /** Info-bulle ; par défaut le nom. */
  title?: string;
}

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  avatarUrl,
  size = 36,
  className = '',
  title,
}) => {
  const src = realAvatarUrl(avatarUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const label = name?.trim() || 'Membre';
  const tooltip = title ?? label;
  const dimensions = { width: size, height: size };

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={label}
        title={tooltip}
        width={size}
        height={size}
        style={dimensions}
        onError={() => setFailedSrc(src)}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      title={tooltip}
      style={{
        ...dimensions,
        backgroundColor: avatarColorFor(label),
        fontSize: Math.max(10, Math.round(size * 0.38)),
      }}
      className={`inline-flex items-center justify-center rounded-full flex-shrink-0 font-extrabold uppercase tracking-wide text-white select-none leading-none ${className}`}
    >
      {getInitials(label)}
    </span>
  );
};
