/**
 * IDENTITÉ VISUELLE D'UN MEMBRE — source unique de vérité sur « cette URL
 * d'avatar est-elle une vraie photo ? ».
 *
 * Ces trois helpers vivaient dans `components/ui/InitialsAvatar.tsx`. Le
 * Studio Avatar en a besoin côté service (il doit refuser d'enregistrer le
 * cliché de banque d'images comme avatar par défaut de la plateforme), et un
 * service n'a pas à dépendre d'un composant React. Ils sont donc remontés
 * ici ; `InitialsAvatar` les réexporte pour que tous ses appelants — et ses
 * tests — restent inchangés.
 */

/**
 * Cliché Unsplash injecté depuis des années comme repli « avatar absent »
 * (fil social, paramètres, messagerie…). C'est la photo d'un inconnu : la
 * traiter comme absente évite de la présenter comme celle d'un membre, même
 * quand une couche amont l'a déjà substituée à une URL vide.
 */
export const STOCK_PLACEHOLDER_MARKERS = ['photo-1534528741775-53994a69daeb'];

export const isStockPlaceholderAvatar = (url?: string | null): boolean =>
  !!url && STOCK_PLACEHOLDER_MARKERS.some((marker) => url.includes(marker));

/** URL réellement exploitable : `undefined` si vide ou s'il s'agit du cliché de repli. */
export const realAvatarUrl = (url?: string | null): string | undefined => {
  const trimmed = url?.trim();
  if (!trimmed || isStockPlaceholderAvatar(trimmed)) return undefined;
  return trimmed;
};

/** Initiales des deux premiers mots (« Yaya Diallo » → « YD », « Aïcha » → « A », vide → « ? »). */
export const getInitials = (name?: string | null): string => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0]!.toUpperCase())
    .join('');
};
