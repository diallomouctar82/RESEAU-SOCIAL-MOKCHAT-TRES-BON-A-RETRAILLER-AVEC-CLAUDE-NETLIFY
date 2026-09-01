import React, { useEffect, useRef, useState } from 'react';

/**
 * Bouton flottant de la messagerie — « Goutte » (mission VF-10, maquette
 * n° 01 validée par le propriétaire le 1er septembre 2026).
 *
 * Une goutte de verre épais où flotte un niveau d'eau : plus il y a de
 * messages non lus, plus la goutte se remplit. C'est la matière du Studio
 * Live (verre épais, lumière par le haut, eau vivante — voir
 * docs/DIRECTION_ARTISTIQUE_STUDIO_LIVE.md, § 7) appliquée au premier objet
 * hors-live. Elle cohabite avec la pastille de l'Architecte (mate, navy,
 * cerclée de cyan) : la goutte, elle, est translucide et animée de
 * l'intérieur — même famille de matière, deux personnalités.
 *
 * Tout le rendu est CSS + SVG inline : les classes `.mdb-*` et les keyframes
 * `mdb-*` vivent dans le bloc <style> d'index.html (une seule source par
 * keyframe, convention du dépôt). Aucune bibliothèque, aucun WebGL.
 *
 * Quatre états, par ordre de priorité décroissante :
 *  - open   : messagerie ouverte → goutte pleine et calme, icône croix ;
 *  - call   : appel entrant → eau agitée teintée de vert, anneau qui se
 *             propage, icône combiné qui vibre ;
 *  - unread : non-lus → niveau d'eau proportionnel + compteur lisible ;
 *  - rest   : repos → niveau bas, respiration et micro-bulles.
 *
 * Aucun état n'est simulé : le niveau d'eau découle du VRAI `unreadCount`
 * reçu en prop, l'état d'appel n'existe que si `incomingCall` est fourni.
 *
 * Maintien long (500 ms, souris ou toucher) : l'étiquette « Installer la
 * messagerie sur mon téléphone » apparaît et `onInstallRequest` est appelé ;
 * le clic qui suit le relâchement n'ouvre PAS la messagerie. Sans
 * `onInstallRequest`, aucune affordance d'installation n'existe.
 */

export interface MessagingDropButtonProps {
  /** Messagerie ouverte → goutte pleine et calme, icône croix. */
  isOpen: boolean;
  /** Niveau d'eau (0 = bas, plafonné visuellement à 9+) + compteur numérique lisible. */
  unreadCount: number;
  /** Appel entrant → eau agitée + anneau + icône téléphone. */
  incomingCall?: { callerName: string; callType: 'audio' | 'video' } | null;
  /** Clic / Entrée / Espace. */
  onToggle: () => void;
  /** Maintien long 500 ms (souris ou toucher) → étiquette + rappel ; absent = pas d'affordance. */
  onInstallRequest?: () => void;
  /** Positionnement fourni par le parent (fixed / bottom / right / z-index). */
  className?: string;
  /** Défaut 'mooc-chat-toggle-btn' : les tests et bancs de preuve s'appuient sur cet id. */
  id?: string;
}

export type MessagingDropButtonState = 'rest' | 'unread' | 'call' | 'open';

/** Durée du maintien avant l'invitation à installer (souris ou toucher). */
export const LONG_PRESS_MS = 500;
/** Après le relâchement, l'étiquette reste lisible un court instant avant de se fermer. */
export const INSTALL_LABEL_LINGER_MS = 1500;
/** Au-delà, le compteur affiche « 9+ » (le libellé accessible garde le vrai nombre). */
export const UNREAD_BADGE_MAX = 9;

/**
 * Niveau d'eau (en % de la hauteur de la goutte) pour 0, 1, 2 … 9+ non-lus.
 * Calé sur la maquette validée : 30 % au repos, 64 % pour 3 non-lus ; la
 * courbe s'aplatit ensuite pour que l'icône reste lisible au-dessus de l'eau.
 */
const WATER_LEVELS: readonly number[] = [30, 44, 55, 64, 70, 75, 79, 82, 85, 88];
/** Pendant un appel, l'eau agitée doit rester visible même sans non-lus. */
const CALL_MIN_LEVEL = 52;
/** Messagerie ouverte : la goutte est pleine (au-delà du bord, la surface disparaît). */
const OPEN_LEVEL = 104;

const sanitizeUnread = (unreadCount: number): number =>
  Number.isFinite(unreadCount) && unreadCount > 0 ? Math.floor(unreadCount) : 0;

/** Niveau d'eau pour un nombre de non-lus (0 → 30 %, 3 → 64 %, 9 et plus → 88 %). */
export const waterLevelForUnread = (unreadCount: number): number => {
  const count = sanitizeUnread(unreadCount);
  return WATER_LEVELS[Math.min(count, WATER_LEVELS.length - 1)];
};

/** Texte du compteur : « 3 », « 9+ » — vide quand il n'y a rien à compter. */
export const formatUnreadBadge = (unreadCount: number): string => {
  const count = sanitizeUnread(unreadCount);
  if (count === 0) return '';
  return count > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : String(count);
};

/** Libellé accessible du bouton, dans l'ordre de priorité des états. */
export const messagingDropButtonLabel = (
  props: Pick<MessagingDropButtonProps, 'isOpen' | 'unreadCount' | 'incomingCall'>,
): string => {
  if (props.isOpen) return 'Fermer la messagerie';
  if (props.incomingCall) {
    const kind = props.incomingCall.callType === 'video' ? 'vidéo' : 'audio';
    const who = props.incomingCall.callerName?.trim() || 'un membre';
    return `Appel ${kind} entrant de ${who} — ouvrir`;
  }
  const count = sanitizeUnread(props.unreadCount);
  if (count === 1) return 'Ouvrir la messagerie, 1 message non lu';
  if (count > 1) return `Ouvrir la messagerie, ${count} messages non lus`;
  return 'Ouvrir la messagerie';
};

/** Icônes SVG inline (tracés de la maquette validée — bulle, croix, combiné, téléphone à installer). */
const SVG_PROPS = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' } as const;

export const MessagingDropButton: React.FC<MessagingDropButtonProps> = ({
  isOpen,
  unreadCount,
  incomingCall = null,
  onToggle,
  onInstallRequest,
  className,
  id = 'mooc-chat-toggle-btn',
}) => {
  const unread = sanitizeUnread(unreadCount);
  const state: MessagingDropButtonState = isOpen
    ? 'open'
    : incomingCall
      ? 'call'
      : unread > 0
        ? 'unread'
        : 'rest';
  const level = isOpen
    ? OPEN_LEVEL
    : state === 'call'
      ? Math.max(waterLevelForUnread(unread), CALL_MIN_LEVEL)
      : waterLevelForUnread(unread);
  const label = messagingDropButtonLabel({ isOpen, unreadCount: unread, incomingCall });
  const badge = state === 'unread' ? formatUnreadBadge(unread) : '';
  const icon = state === 'open' ? 'close' : state === 'call' ? 'phone' : 'bubble';
  const hasInstall = typeof onInstallRequest === 'function';
  const tooltipId = `${id}-install-label`;

  const hostRef = useRef<HTMLSpanElement>(null);
  const pressTimer = useRef<number | null>(null);
  const lingerTimer = useRef<number | null>(null);
  // Vrai entre la fin du maintien long et le clic qui suit le relâchement :
  // ce clic-là ne doit pas basculer la messagerie.
  const longPressed = useRef(false);
  const [installVisible, setInstallVisible] = useState(false);

  const clearPressTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };
  const clearLingerTimer = () => {
    if (lingerTimer.current !== null) {
      window.clearTimeout(lingerTimer.current);
      lingerTimer.current = null;
    }
  };
  const hideInstall = () => {
    clearLingerTimer();
    setInstallVisible(false);
  };

  // Démontage : aucun minuteur ne survit au composant (prouvé par test).
  useEffect(
    () => () => {
      clearPressTimer();
      clearLingerTimer();
    },
    [],
  );

  // Étiquette visible : un appui ailleurs ou Échap la ferme, où que soit le focus.
  useEffect(() => {
    if (!installVisible) return;
    const onDocumentPointerDown = (event: PointerEvent) => {
      const host = hostRef.current;
      if (host && event.target instanceof Node && host.contains(event.target)) return;
      hideInstall();
    };
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideInstall();
    };
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('keydown', onDocumentKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      document.removeEventListener('keydown', onDocumentKeyDown, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installVisible]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    // Un nouvel appui remet toujours le drapeau à zéro : si le navigateur
    // n'a pas émis de clic après le maintien précédent, le tap suivant doit
    // redevenir un clic normal.
    longPressed.current = false;
    if (!hasInstall) return;
    // Bouton principal / doigt uniquement (clic droit ou molette : jamais).
    // `button` est absent des événements génériques (jsdom) : on ne refuse
    // que les boutons secondaires explicitement identifiés.
    if (typeof event.button === 'number' && event.button > 0) return;
    clearPressTimer();
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      longPressed.current = true;
      clearLingerTimer();
      setInstallVisible(true);
      onInstallRequest?.();
    }, LONG_PRESS_MS);
  };

  const handlePointerRelease = () => {
    clearPressTimer();
    if (longPressed.current) {
      clearLingerTimer();
      lingerTimer.current = window.setTimeout(() => {
        lingerTimer.current = null;
        setInstallVisible(false);
      }, INSTALL_LABEL_LINGER_MS);
    }
  };

  const handleClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    onToggle();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      if (installVisible) {
        event.stopPropagation();
        hideInstall();
      }
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      // Bascule ici, et jamais aussi par le clic natif que le navigateur
      // synthétiserait sinon : une seule bascule par touche.
      event.preventDefault();
      if (event.repeat) return;
      onToggle();
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Spacebar') event.preventDefault();
  };

  return (
    <span ref={hostRef} className={`mdb-host${className ? ` ${className}` : ''}`}>
      <button
        id={id}
        type="button"
        className="mdb"
        data-state={state}
        data-level={level}
        data-unread={unread}
        style={{ '--mdb-lvl': `${level}%` } as React.CSSProperties}
        aria-label={label}
        aria-expanded={isOpen}
        aria-pressed={isOpen}
        aria-describedby={installVisible ? tooltipId : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
        onPointerLeave={handlePointerRelease}
        onContextMenu={hasInstall ? (event) => event.preventDefault() : undefined}
      >
        <span className="mdb-ring" aria-hidden="true" />
        <span className="mdb-glass" aria-hidden="true" />
        <span className="mdb-liquid" aria-hidden="true">
          <span className="mdb-wave" />
          <span className="mdb-wave mdb-w2" />
        </span>
        <span className="mdb-bubbles" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mdb-gloss" aria-hidden="true" />
        <span className="mdb-ico" data-icon={icon} aria-hidden="true">
          <svg className="mdb-i-bub" {...SVG_PROPS}>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9.3l-3.7 3.2A.9.9 0 0 1 4 18.6V5.5Z" />
            <path d="M8.6 9.8h.01M12 9.8h.01M15.4 9.8h.01" />
          </svg>
          <svg className="mdb-i-x" {...SVG_PROPS}>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
          <svg className="mdb-i-ph" {...SVG_PROPS}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </span>
        {badge && (
          <span className="mdb-badge" aria-hidden="true">
            {badge}
          </span>
        )}
      </button>
      {hasInstall && (
        <span
          id={tooltipId}
          role="tooltip"
          className="mdb-install"
          data-visible={installVisible ? 'true' : 'false'}
          aria-hidden={!installVisible}
        >
          <svg {...SVG_PROPS}>
            <rect x="7" y="2" width="10" height="20" rx="2.5" />
            <path d="M12 7v7M9 11l3 3 3-3" />
          </svg>
          <span>Installer la messagerie sur mon téléphone</span>
        </span>
      )}
    </span>
  );
};

export default MessagingDropButton;
