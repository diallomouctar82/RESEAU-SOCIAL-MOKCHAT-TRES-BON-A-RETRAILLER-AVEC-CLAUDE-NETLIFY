import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    MessageSquare,
    Phone,
    Video,
    FolderPlus,
    Calendar,
    CheckCircle2,
    Upload,
    Globe2,
    Bot,
    UserCheck,
    X
} from 'lucide-react';
import { Agent, DossierParcours } from '../types';
import { AGENTS } from '../constants';

/**
 * DEC-2026-056 — « Plateaux de cristal » (direction D choisie par la Direction).
 *
 * L'écran d'entrée de l'espace Experts ne montre plus qu'une phrase et les
 * experts, chacun dans une bulle de cristal posée sur une lame de verre :
 * pas de bandeau sombre, pas de barre de recherche, pas de filtres, pas de
 * cartes. Toutes les actions qui existaient sur les anciennes cartes
 * (Discuter, Vocal, Vidéo, Nouveau dossier, Analyser un fichier, Prendre RDV)
 * sont conservées : elles s'ouvrent dans une fiche légère au clic sur la bulle.
 *
 * Le mouvement est purement CSS (flottement, halo, reflets) ; l'inclinaison 3D
 * au survol pose des variables CSS sur le plateau sans passer par un état
 * React, donc sans aucun re-rendu. Tout s'arrête sous
 * `prefers-reduced-motion: reduce` (voir index.html, bloc « PLATEAUX DE
 * CRISTAL »).
 */

export const PHRASE_EXPERTS =
    'Nos experts vous accompagnent avec des conseils fiables, des orientations pratiques et une assistance adaptée à vos besoins.';

interface ExpertsCatalogueProps {
    onSelectAgentForChat: (agent: Agent, prompt?: string) => void;
    onStartCallWithAgent: (agent: Agent) => void;
    onStartVideoWithAgent: (agent: Agent) => void;
    onCreateDossierWithAgent: (agent: Agent) => void;
    onShareDocWithAgent?: (agent: Agent) => void;
    dossiers: DossierParcours[];
}

const mouvementReduit = (): boolean =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Rôle court sous la bulle : le titre sans le préfixe « Expert ». */
const roleCourt = (agent: Agent): string => agent.title.replace(/^Expert\s+/i, '');

const libelleDisponibilite = (agent: Agent): string => {
    if (agent.availabilityStatus === 'available') return 'Disponible maintenant';
    if (agent.availabilityStatus === 'in_call') return 'En entretien';
    return 'Sur rendez-vous';
};

export const ExpertsCatalogue: React.FC<ExpertsCatalogueProps> = ({
    onSelectAgentForChat,
    onStartCallWithAgent,
    onStartVideoWithAgent,
    onCreateDossierWithAgent,
    onShareDocWithAgent,
    dossiers
}) => {
    // Fiche ouverte au clic sur une bulle (toutes les actions y vivent).
    const [ficheAgent, setFicheAgent] = useState<Agent | null>(null);
    const ficheRef = useRef<HTMLDivElement | null>(null);
    const declencheurRef = useRef<HTMLButtonElement | null>(null);

    // Prise de rendez-vous des experts humains (fonction conservée telle quelle).
    const [bookingAgent, setBookingAgent] = useState<Agent | null>(null);
    const [bookingDate, setBookingDate] = useState('2026-03-05');
    const [bookingTime, setBookingTime] = useState('14:00');
    const [bookingSubject, setBookingSubject] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const ouvrirFiche = (agent: Agent, bouton: HTMLButtonElement) => {
        declencheurRef.current = bouton;
        setFicheAgent(agent);
    };

    const fermerFiche = useCallback(() => {
        setFicheAgent(null);
        const bouton = declencheurRef.current;
        declencheurRef.current = null;
        if (bouton && typeof bouton.focus === 'function') bouton.focus();
    }, []);

    // Échap ferme la fiche ; le focus entre dans la fiche à l'ouverture.
    // Écoute en phase de capture sur le document : la coquille (Layout) pose
    // ses propres écouteurs Échap au niveau du document, et la fiche doit
    // se fermer quel que soit l'élément qui a le focus.
    useEffect(() => {
        if (!ficheAgent) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') fermerFiche();
        };
        document.addEventListener('keydown', onKey, true);
        ficheRef.current?.focus();
        return () => document.removeEventListener('keydown', onKey, true);
    }, [ficheAgent, fermerFiche]);

    // Inclinaison 3D et parallaxe du portrait, pilotées par le pointeur.
    const incliner = (e: React.PointerEvent<HTMLButtonElement>) => {
        if (mouvementReduit() || e.pointerType === 'touch') return;
        if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const s = e.currentTarget.style;
        s.setProperty('--ry', `${(x * 22).toFixed(1)}deg`);
        s.setProperty('--rx', `${(-y * 18).toFixed(1)}deg`);
        s.setProperty('--px', `${(x * -6).toFixed(1)}px`);
        s.setProperty('--py', `${(y * -6).toFixed(1)}px`);
    };
    const reposer = (e: React.PointerEvent<HTMLButtonElement>) => {
        const s = e.currentTarget.style;
        ['--rx', '--ry', '--px', '--py'].forEach((v) => s.removeProperty(v));
    };

    const action = (fn: (agent: Agent) => void) => () => {
        if (!ficheAgent) return;
        const agent = ficheAgent;
        setFicheAgent(null);
        declencheurRef.current = null;
        fn(agent);
    };

    const handleConfirmBooking = (e: React.FormEvent) => {
        e.preventDefault();
        setBookingSuccess(true);
        setTimeout(() => {
            setBookingSuccess(false);
            setBookingAgent(null);
            setBookingSubject('');
        }, 2000);
    };

    const dossierDeLaFiche = ficheAgent ? dossiers.find((d) => d.leadAgentId === ficheAgent.id) : undefined;

    return (
        <div className="cristal-panneau" data-testid="experts-cristal">
            <p className="cristal-phrase">{PHRASE_EXPERTS}</p>

            <ul className="cristal-scene" aria-label="Nos experts">
                {AGENTS.map((agent, i) => {
                    const vars = {
                        '--tf': `${(5.5 + (i % 5) * 0.8).toFixed(1)}s`,
                        '--df': `${(-i * 0.9).toFixed(1)}s`,
                        '--th': `${5 + (i % 4)}s`,
                        '--dh': `${(-i * 0.7).toFixed(1)}s`
                    } as React.CSSProperties;
                    return (
                        <li key={agent.id} className="cristal-expert">
                            <button
                                type="button"
                                className="cristal-plateau"
                                style={vars}
                                aria-haspopup="dialog"
                                aria-label={`${agent.name} — ${agent.title}`}
                                onClick={(e) => ouvrirFiche(agent, e.currentTarget)}
                                onPointerMove={incliner}
                                onPointerLeave={reposer}
                                onPointerCancel={reposer}
                            >
                                <span className="cristal-flotteur">
                                    <span className="cristal-bulle">
                                        <img src={agent.avatarUrl} alt="" loading="lazy" decoding="async" />
                                        <span className="cristal-lumiere" aria-hidden="true" />
                                        <span
                                            className="cristal-pastille"
                                            data-etat={agent.availabilityStatus || 'appointment_only'}
                                            title={libelleDisponibilite(agent)}
                                        />
                                    </span>
                                </span>
                                <span className="cristal-reflet" aria-hidden="true" />
                            </button>
                            <span className="cristal-nom">{agent.name}</span>
                            <span className="cristal-role">{roleCourt(agent)}</span>
                        </li>
                    );
                })}
            </ul>

            {/* Fiche légère : toutes les actions de l'ancienne carte, sur demande. */}
            {ficheAgent && (
                <div className="cristal-voile" onClick={fermerFiche} data-testid="experts-fiche-voile">
                    <div
                        ref={ficheRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cristal-fiche-nom"
                        tabIndex={-1}
                        className="cristal-fiche"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={fermerFiche}
                            className="cristal-fermer"
                            aria-label="Fermer la fiche"
                        >
                            <X size={18} />
                        </button>

                        <div className="cristal-fiche-tete">
                            <span className="cristal-bulle cristal-bulle-fiche">
                                <img src={ficheAgent.avatarUrl} alt="" />
                                <span className="cristal-lumiere" aria-hidden="true" />
                                <span
                                    className="cristal-pastille"
                                    data-etat={ficheAgent.availabilityStatus || 'appointment_only'}
                                    title={libelleDisponibilite(ficheAgent)}
                                />
                            </span>
                            <div className="min-w-0">
                                <h2 id="cristal-fiche-nom" className="cristal-fiche-nom">{ficheAgent.name}</h2>
                                <p className="cristal-fiche-titre">{ficheAgent.title}</p>
                                <p className="cristal-fiche-specialite">{ficheAgent.specialty}</p>
                                <p className="cristal-fiche-etat">
                                    {ficheAgent.isHuman ? (
                                        <><UserCheck size={13} /> Humain vérifié · {libelleDisponibilite(ficheAgent)}{ficheAgent.hourlyRate ? ` · ${ficheAgent.hourlyRate} €/h` : ''}</>
                                    ) : (
                                        <><Bot size={13} /> Expert IA 24/7 · {libelleDisponibilite(ficheAgent)}</>
                                    )}
                                </p>
                            </div>
                        </div>

                        <p className="cristal-fiche-texte">{ficheAgent.description}</p>

                        {ficheAgent.languages && ficheAgent.languages.length > 0 && (
                            <p className="cristal-fiche-langues">
                                <Globe2 size={13} aria-hidden="true" />
                                {ficheAgent.languages.slice(0, 5).map((lang) => (
                                    <span key={lang}>{lang}</span>
                                ))}
                                {ficheAgent.languages.length > 5 && <span>+{ficheAgent.languages.length - 5}</span>}
                            </p>
                        )}

                        {dossierDeLaFiche && (
                            <p className="cristal-fiche-dossier">
                                <FolderPlus size={13} aria-hidden="true" />
                                <span className="truncate">Dossier en cours : <strong>{dossierDeLaFiche.title}</strong></span>
                                <span className="cristal-fiche-progres">{dossierDeLaFiche.progress}%</span>
                            </p>
                        )}

                        <div className="cristal-actions">
                            <button
                                type="button"
                                onClick={action((a) => onSelectAgentForChat(a))}
                                className="cristal-action cristal-action-principale"
                                title="Ouvrir le chat interactif"
                            >
                                <MessageSquare size={15} /> Discuter
                            </button>
                            <button
                                type="button"
                                onClick={action(onStartCallWithAgent)}
                                className="cristal-action"
                                title="Lancer un appel vocal direct"
                            >
                                <Phone size={15} /> Vocal
                            </button>
                            <button
                                type="button"
                                onClick={action(onStartVideoWithAgent)}
                                className="cristal-action"
                                title="Lancer un appel vidéo / caméra"
                            >
                                <Video size={15} /> Vidéo
                            </button>
                            <button
                                type="button"
                                onClick={action(onCreateDossierWithAgent)}
                                className="cristal-action"
                            >
                                <FolderPlus size={15} /> Nouveau dossier
                            </button>
                            {ficheAgent.isHuman ? (
                                <button
                                    type="button"
                                    onClick={action((a) => setBookingAgent(a))}
                                    className="cristal-action cristal-action-rdv"
                                >
                                    <Calendar size={15} /> Prendre RDV
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={action((a) => onShareDocWithAgent && onShareDocWithAgent(a))}
                                    className="cristal-action"
                                >
                                    <Upload size={15} /> Analyser un fichier
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Prise de rendez-vous des experts humains — fonction inchangée. */}
            {bookingAgent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <img src={bookingAgent.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border" />
                                <div>
                                    <h3 className="font-black text-sm text-slate-900">Rendez-vous avec {bookingAgent.name}</h3>
                                    <p className="text-xs text-amber-700 font-bold">{bookingAgent.title} • {bookingAgent.hourlyRate}€ / heure</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setBookingAgent(null)} className="text-slate-400 hover:text-slate-600" aria-label="Fermer">✕</button>
                        </div>

                        {bookingSuccess ? (
                            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-800">
                                <CheckCircle2 size={32} className="mx-auto text-emerald-600 animate-bounce" />
                                <h4 className="font-bold text-sm">Rendez-vous Confirmé avec Succès !</h4>
                                <p className="text-xs text-emerald-700">Une invitation avec le lien sécurisé de visioconférence et confirmation a été ajoutée à votre agenda et envoyée à l'expert.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmBooking} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="rdv-date" className="block text-xs font-bold text-slate-700 mb-1">Date Souhaitée</label>
                                        <input
                                            id="rdv-date"
                                            type="date"
                                            required
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="rdv-creneau" className="block text-xs font-bold text-slate-700 mb-1">Créneau Horaire</label>
                                        <select
                                            id="rdv-creneau"
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                        >
                                            <option value="09:00">09:00 - 10:00 (GMT)</option>
                                            <option value="11:00">11:00 - 12:00 (GMT)</option>
                                            <option value="14:00">14:00 - 15:00 (GMT)</option>
                                            <option value="16:30">16:30 - 17:30 (GMT)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="rdv-objet" className="block text-xs font-bold text-slate-700 mb-1">Objet de la Consultation & Contexte</label>
                                    <textarea
                                        id="rdv-objet"
                                        rows={3}
                                        required
                                        value={bookingSubject}
                                        onChange={(e) => setBookingSubject(e.target.value)}
                                        placeholder="Décrivez précisément votre situation, questions juridiques/médicales/financières et pièces justificatives..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>

                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                                    🔒 <strong>Garantie Tiers de Confiance :</strong> Le montant de la consultation ({bookingAgent.hourlyRate}€) reste consigné de manière sécurisée et n'est débloqué qu'à l'issue de la consultation effective.
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setBookingAgent(null)}
                                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                                    >
                                        Valider la Réservation
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
