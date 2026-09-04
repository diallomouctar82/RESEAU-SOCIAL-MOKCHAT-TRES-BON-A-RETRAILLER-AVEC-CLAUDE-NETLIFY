import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import {
    listeningChoiceFlag,
    listeningChoiceLabel,
    listeningLanguageOptions,
    listeningStatusLine,
    type ListeningChoice,
} from '../../services/live/liveListeningLanguage';

/**
 * LIVE PLANÉTAIRE — « J'écoute en… », le seul endroit où l'on choisit sa
 * langue d'écoute.
 *
 * Trois règles de produit tiennent ce composant, et elles expliquent chaque
 * choix visuel :
 *
 * 1. **Le choix est PERSONNEL.** Rien ici ne change quoi que ce soit pour les
 *    autres. Dix mille personnes peuvent tenir dix mille choix différents au
 *    même instant. C'est pourquoi la pastille est discrète et vit dans le
 *    chrome du direct, pas dans les commandes d'animation : ce n'est pas un
 *    réglage de la diffusion, c'est un réglage de MON oreille.
 *
 * 2. **Le défaut est Original, et il le reste.** Aucune mémorisation
 *    silencieuse : rejoindre un direct ne réactive jamais une langue choisie
 *    ailleurs. Personne n'entend une traduction sans l'avoir demandée.
 *
 * 3. **Tout le monde y a droit.** Un spectateur sans micro ni caméra a
 *    exactement la même pastille qu'un animateur — la traduction ne dépend
 *    d'aucun droit de publication.
 *
 * Et une règle d'honnêteté : quand la langue demandée n'est pas encore
 * produite, ou quand la chaîne échoue, on le DIT et on laisse l'audio
 * d'origine continuer. Une panne de traduction ne doit jamais emporter le
 * direct avec elle.
 */

export interface ListeningLanguagePickerProps {
    choice: ListeningChoice;
    onChoose: (next: ListeningChoice) => void;
    /** J'ai demandé une langue, personne ne la produit encore. */
    waitingForMyLanguage?: boolean;
    /** La chaîne de production a échoué chez moi (dit à l'écran, jamais avalé). */
    producerError?: string | null;
    /** Mon choix n'a pas atteint les intervenants : personne ne produira ma langue (LP-6). */
    choiceBroadcastError?: string | null;
    /** `compact` : la pastille du bandeau (téléphone compris). */
    className?: string;
}

export const ListeningLanguagePicker: React.FC<ListeningLanguagePickerProps> = ({
    choice,
    onChoose,
    waitingForMyLanguage = false,
    producerError = null,
    choiceBroadcastError = null,
    className = '',
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const options = listeningLanguageOptions();
    const status = listeningStatusLine({ choice, waitingForMyLanguage, producerError, choiceBroadcastError });
    const active = !!listeningChoiceLabel(choice) && choice !== null;

    // Fermeture au clic extérieur et à Échap : la liste ne doit jamais rester
    // ouverte par-dessus la scène — on est DANS un direct, l'image prime.
    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('touchstart', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('touchstart', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const pick = useCallback((next: ListeningChoice) => {
        onChoose(next);
        setOpen(false); // « se referme au choix » — on retourne au direct, pas à un menu.
    }, [onChoose]);

    return (
        <div ref={rootRef} className={`relative ${className}`} data-testid="listening-language">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Langue d'écoute : ${listeningChoiceLabel(choice)}. Changer.`}
                title={`J'écoute en ${listeningChoiceLabel(choice)}`}
                data-testid="listening-language-pill"
                className={`px-2.5 py-1.5 min-h-[44px] shrink-0 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    active
                        ? 'bg-cyan-600/25 text-cyan-100 border-cyan-400/40 hover:bg-cyan-600/35'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
            >
                {/* Le drapeau porte l'information quand la place manque ; le
                    globe reste le repère d'« Original ». */}
                {active
                    ? <span aria-hidden="true" className="text-sm leading-none">{listeningChoiceFlag(choice)}</span>
                    : <Globe size={14} aria-hidden="true" />}
                <span className="hidden sm:inline whitespace-nowrap">{listeningChoiceLabel(choice)}</span>
                {/* Sur téléphone, deux lettres suffisent à savoir où l'on en
                    est sans manger la largeur du bandeau. */}
                <span className="sm:hidden uppercase">{choice ? choice.slice(0, 2) : ''}</span>
                {/* Un point d'attente discret plutôt qu'une alerte : la
                    traduction qui démarre n'est pas un incident. */}
                {status.tone !== 'neutre' && (
                    <span
                        aria-hidden="true"
                        className={`w-1.5 h-1.5 rounded-full ${status.tone === 'panne' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`}
                    />
                )}
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label="Langue d'écoute"
                    data-testid="listening-language-list"
                    className="absolute right-0 top-full mt-2 z-[220] w-64 max-w-[85vw] max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-1.5"
                >
                    <p className="px-2.5 py-2 text-[11px] text-slate-400 leading-relaxed">
                        Chacun choisit pour soi. Votre choix ne change rien pour les autres.
                    </p>
                    {options.map((opt) => {
                        const selected = (opt.value ?? null) === (choice ?? null);
                        return (
                            <button
                                key={opt.value ?? 'original'}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={(e) => { e.stopPropagation(); pick(opt.value); }}
                                data-testid={`listening-language-option-${opt.value ?? 'original'}`}
                                className={`w-full min-h-[44px] px-2.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-left transition-colors ${
                                    selected ? 'bg-cyan-600/25 text-cyan-100' : 'text-slate-200 hover:bg-white/10'
                                }`}
                            >
                                <span aria-hidden="true" className="text-base leading-none">{opt.flag}</span>
                                <span className="flex-1 truncate">{opt.label}</span>
                                {selected && <Check size={14} aria-hidden="true" className="shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* L'état honnête, sous la pastille — jamais un silence inexpliqué.
                `pointer-events-none` : c'est une information, pas une cible. */}
            {status.text && (
                <p
                    data-testid="listening-language-status"
                    className={`absolute right-0 top-full mt-1 z-[210] w-max max-w-[70vw] pointer-events-none px-2 py-1 rounded-lg text-[10px] leading-tight ${
                        status.tone === 'panne' ? 'bg-rose-950/80 text-rose-200' : 'bg-slate-950/80 text-amber-200'
                    } ${open ? 'hidden' : ''}`}
                >
                    {status.text}
                </p>
            )}
        </div>
    );
};
