import React, { useEffect, useRef, useState } from 'react';
import { Share2, Link2, Mail, MessageCircle, Send, Check, Smartphone } from 'lucide-react';

/**
 * ÉQUIPE F5 — Bouton Partager GLOBAL (réutilisable par tout module).
 *
 * Diffuse un contenu vers les canaux RÉELLEMENT joignables depuis un
 * navigateur : partage natif (Web Share API, si le navigateur l'offre),
 * WhatsApp, Facebook, X, LinkedIn, Telegram, e-mail, copie de lien.
 * Aucun canal simulé : chaque entrée ouvre le vrai point d'entrée public
 * du réseau concerné.
 *
 * Chaque lien diffusé est un LIEN DE RETOUR : l'URL du contenu porte des
 * paramètres de provenance (`ref=partage&via=<canal>`) pour que les retours
 * soient attribuables — jamais une réécriture du contenu lui-même.
 */

export interface ShareButtonProps {
  /** URL canonique du contenu (sans paramètres de provenance). */
  url: string;
  title: string;
  text?: string;
  /** Canal réellement utilisé — sert à l'appelant pour compter un partage réel. */
  onShared?: (channel: string) => void;
  /** Avertissement honnête affiché en tête (ex. contenu réservé aux abonnés). */
  visibilityWarning?: string;
  count?: number;
  className?: string;
  iconSize?: number;
  label?: string;
}

const withReturnRef = (url: string, channel: string): string => {
  try {
    const u = new URL(url);
    u.searchParams.set('ref', 'partage');
    u.searchParams.set('via', channel);
    return u.toString();
  } catch {
    return url;
  }
};

export const ShareButton: React.FC<ShareButtonProps> = ({
  url, title, text, onShared, visibilityWarning, count, className, iconSize = 16, label,
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const openChannel = (channel: string, buildHref: (link: string) => string) => {
    const link = withReturnRef(url, channel);
    const href = buildHref(link);
    if (href.startsWith('sms:') || href.startsWith('mailto:')) {
      // Protocoles d'application (Messages, e-mail) : window.open laisserait
      // un onglet vide ou serait bloqué — la navigation directe déclenche le
      // gestionnaire de l'appareil sans quitter la page.
      window.location.href = href;
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    onShared?.(channel);
    setOpen(false);
  };

  const nativeShare = async () => {
    const link = withReturnRef(url, 'natif');
    try {
      await (navigator as any).share({ title, text: text || title, url: link });
      onShared?.('natif');
      setOpen(false);
    } catch {
      // partage natif annulé par la personne — jamais compté comme un partage.
    }
  };

  const copyLink = async () => {
    const link = withReturnRef(url, 'lien');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      onShared?.('lien');
      setTimeout(() => { setCopied(false); setOpen(false); }, 1200);
    } catch {
      alert('La copie a échoué — copiez le lien manuellement : ' + link);
    }
  };

  const shareMessage = `${title}${text ? ' — ' + text : ''}`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  const rows: { key: string; label: string; icon: React.ReactNode; action: () => void }[] = [
    ...(canNativeShare ? [{
      key: 'natif', label: 'Partage de l\'appareil', icon: <Smartphone size={15} className="text-slate-600" />, action: nativeShare,
    }] : []),
    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={15} className="text-emerald-600" />, action: () => openChannel('whatsapp', (l) => `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${l}`)}`) },
    { key: 'facebook', label: 'Facebook', icon: <Share2 size={15} className="text-blue-600" />, action: () => openChannel('facebook', (l) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(l)}`) },
    { key: 'x', label: 'X (Twitter)', icon: <Share2 size={15} className="text-slate-800" />, action: () => openChannel('x', (l) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(l)}`) },
    { key: 'linkedin', label: 'LinkedIn', icon: <Share2 size={15} className="text-sky-700" />, action: () => openChannel('linkedin', (l) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(l)}`) },
    { key: 'telegram', label: 'Telegram', icon: <Send size={15} className="text-sky-500" />, action: () => openChannel('telegram', (l) => `https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(shareMessage)}`) },
    { key: 'email', label: 'E-mail', icon: <Mail size={15} className="text-amber-600" />, action: () => openChannel('email', (l) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareMessage}\n\n${l}`)}`) },
    // SMS (demande utilisateur, F5) : ouvre la vraie app Messages de
    // l'appareil avec le lien pré-rempli — le destinataire qui clique et
    // n'est pas connecté atterrit directement sur l'écran
    // d'authentification MokNet (création de compte ou connexion), le lien
    // de retour étant conservé. `sms:?&body=` est la forme comprise à la
    // fois par iOS et Android.
    { key: 'sms', label: 'SMS', icon: <Smartphone size={15} className="text-lime-600" />, action: () => openChannel('sms', (l) => `sms:?&body=${encodeURIComponent(`${shareMessage} ${l}`)}`) },
  ];

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={className || 'p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1'}
        title="Partager"
      >
        <Share2 size={iconSize} />
        {label && <span className="text-xs font-bold">{label}</span>}
        {(count ?? 0) > 0 && <span className="text-[11px] font-bold">{count}</span>}
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 min-w-[210px] z-[80] text-xs text-slate-700 animate-scale-up">
          {visibilityWarning && (
            <div className="px-3 py-1.5 mb-1 text-[10px] leading-snug text-amber-800 bg-amber-50 border-b border-amber-100">
              {visibilityWarning}
            </div>
          )}
          {rows.map((row) => (
            <button
              key={row.key}
              onClick={row.action}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2.5 font-semibold"
            >
              {row.icon}
              <span>{row.label}</span>
            </button>
          ))}
          <button
            onClick={copyLink}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2.5 font-semibold border-t border-slate-100 mt-1 pt-2"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Link2 size={15} className="text-indigo-600" />}
            <span>{copied ? 'Lien copié !' : 'Copier le lien de retour'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
