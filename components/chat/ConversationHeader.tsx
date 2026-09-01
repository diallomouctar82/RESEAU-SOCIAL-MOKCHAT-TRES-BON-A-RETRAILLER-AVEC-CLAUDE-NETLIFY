import React, { useId } from 'react';
import { ArrowLeft, Languages, Shield } from 'lucide-react';
import { MESSAGING_LANGUAGES } from '../../services/translation/translationService';
import { InitialsAvatar } from '../ui/InitialsAvatar';

export interface ConversationPeer {
  name: string;
  /** Photo réelle du correspondant ; absente ou cliché de repli → initiales. */
  avatarUrl?: string | null;
  verified?: boolean;
  presence?: 'online' | 'offline';
  /** Sous-titre quand il n'est pas en ligne (titre du membre, « Membre vérifié »…). */
  subtitle?: string;
}

export interface ConversationHeaderProps {
  peer: ConversationPeer;
  /** Ma langue (code du catalogue) ; vide ou absente = « Par défaut · aucune traduction ». */
  myLanguage?: string | null;
  /** Reçoit le code choisi, ou `''` pour « Par défaut ». */
  onLanguageChange: (code: string) => void;
  /** Libellé de la langue détectée chez le correspondant — fourni seulement si elle diffère de la mienne. */
  peerReadsIn?: string;
  onBack: () => void;
  /** Ouvre la fiche du correspondant (clic sur son nom / sa photo). */
  onOpenPeer?: () => void;
  /** Boutons d'action (IA, appel audio/vidéo, infos) : fournis par le parent, leurs handlers n'ont pas bougé. */
  children?: React.ReactNode;
}

/**
 * En-tête FIXE d'une conversation (VF-8) : le sélecteur « Ma langue » vit
 * ici, juste sous le nom du correspondant, et plus dans la zone de messages
 * qui défile — il ne bouge donc jamais, l'utilisateur ne le perd plus.
 *
 * Disposition (flex-wrap) : ligne 1 = ← · photo · nom/statut · actions ;
 * ligne 2 = « Ma langue » sur toute la largeur du MÊME bandeau fixe, à
 * toutes les largeurs d'écran. La fenêtre de messagerie ne dépasse jamais
 * 460 px : mettre le sélecteur sur la ligne du nom exigerait ≈ 506 px
 * (retour 30 + photo 46 + nom ≥ 90 + sélecteur ≥ 170 pour afficher « Par
 * défaut · aucune traduction » + 4 boutons 140 + espaces) pour 428 px
 * disponibles — le nom se tronquait en « Yaya … » et l'option par défaut
 * était coupée. Un seul `<select aria-label="Ma langue">` dans le DOM.
 */
export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  peer,
  myLanguage,
  onLanguageChange,
  peerReadsIn,
  onBack,
  onOpenPeer,
  children,
}) => {
  const selectId = useId();
  const isOnline = peer.presence === 'online';
  const peerName = peer.name?.trim() || 'Membre';

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 min-w-0 flex-1">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
        title="Retour à la liste"
        aria-label="Retour à la liste"
      >
        <ArrowLeft size={18} />
      </button>

      <div
        className={`flex items-center gap-2.5 min-w-0 flex-1 ${onOpenPeer ? 'cursor-pointer hover:opacity-90' : ''}`}
        onClick={onOpenPeer}
      >
        <div className="relative flex-shrink-0">
          <InitialsAvatar name={peerName} avatarUrl={peer.avatarUrl} size={36} className="ring-2 ring-indigo-400" />
          <span
            aria-hidden="true"
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
          />
        </div>

        <div className="min-w-0">
          <div className="font-extrabold text-xs text-white flex items-center gap-1.5 min-w-0">
            <span className="truncate">{peerName}</span>
            {peer.verified && <Shield size={12} className="text-blue-400 flex-shrink-0" aria-label="Membre vérifié" />}
          </div>
          <div className="text-[10px] text-slate-300 truncate">
            {isOnline ? 'En ligne' : (peer.subtitle || 'Membre vérifié')}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {children}
      </div>

      {/* Ma langue — unique réglage, seconde ligne du même bandeau fixe.
          « Par défaut » = aucune traduction (je lis et j'entends l'original).
          Dès qu'une langue est choisie, les messages reçus, les vocaux et les
          appels me sont rendus dans cette langue ; mon interlocuteur règle la
          sienne dans SA boîte, le système la détecte seul. L'original reste
          toujours accessible d'un clic. */}
      <div className="basis-full flex items-center gap-2 min-w-0">
        <label
          htmlFor={selectId}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-300 whitespace-nowrap flex-shrink-0"
        >
          <Languages size={13} className="text-indigo-300" aria-hidden="true" />
          <span>Ma langue</span>
        </label>
        <select
          id={selectId}
          value={myLanguage ?? ''}
          onChange={(event) => onLanguageChange(event.target.value)}
          aria-label="Ma langue"
          title="Ma langue : les messages, vocaux et appels me sont rendus dans cette langue"
          className="flex-1 min-w-[120px] min-h-[44px] px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/10 text-[11px] font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
        >
          <option value="" className="text-slate-900 bg-white">Par défaut · aucune traduction</option>
          {MESSAGING_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">{lang.flag} {lang.label}</option>
          ))}
        </select>
        {peerReadsIn && (
          <span
            className="text-[9px] font-bold text-slate-300 whitespace-nowrap truncate min-w-0"
            title="Langue détectée à partir des messages de votre interlocuteur"
          >
            Il lit en {peerReadsIn}
          </span>
        )}
      </div>
    </div>
  );
};
