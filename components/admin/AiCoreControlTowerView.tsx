// Tour de contrôle Vision Smart AI Core — VUE pure.
//
// Séparée du conteneur pour n'importer QUE le modèle : ce fichier ne connaît
// ni Supabase, ni session, ni réseau. C'est ce qui permet à la page de
// prévisualisation publique de le rendre tel quel, sans embarquer le client de
// base ni prétendre à un accès qu'elle n'a pas.
//
// Ce que cet écran est : une VITRE. Il lit, il montre, il n'agit pas. Aucun
// bouton n'active un outil, n'accorde un droit ni ne déclenche un appel
// fournisseur. Ouvrir AI Core reste un geste délibéré, fait ailleurs.
//
// Ce que cet écran refuse de faire : afficher du vert par défaut. Chaque case
// dit d'où vient son information — base, dépôt, ou relevé hors ligne — et une
// information non lisible s'affiche « inconnu » avec sa raison, jamais en vert
// optimiste. La section « ce que cette console ne voit pas » est en bas, à
// hauteur d'yeux, pas en note de bas de page.

import React, { useEffect, useState } from 'react';
import {
    Activity, AlertTriangle, Bot, CheckCircle2, Database, EyeOff, FileCode2,
    FlaskConical, GitBranch, HelpCircle, Lock, LockOpen,
    ShieldQuestion, UserCheck, XCircle,
} from 'lucide-react';
import {
    AgentTour, EtatTourDeControle, EtatVerrou, Source, StatutGlobal, Verrou,
} from '../../services/aiCoreControlTowerModel';

// ── Vocabulaire visuel ───────────────────────────────────────────────────────
// Les quatre statuts de la Constitution Vision Smart (§ XV). Aucun dégradé
// violet/bleu : le Design System l'interdit explicitement (§ 03.1).
const STATUT_GLOBAL: Record<StatutGlobal, { libelle: string; puce: string; cadre: string; texte: string }> = {
    vert: { libelle: 'VERT — VALIDÉ', puce: 'bg-emerald-400', cadre: 'border-emerald-500/40 bg-emerald-500/10', texte: 'text-emerald-300' },
    orange: { libelle: 'ORANGE — PARTIEL', puce: 'bg-amber-400', cadre: 'border-amber-500/40 bg-amber-500/10', texte: 'text-amber-300' },
    rouge: { libelle: 'ROUGE — NON CONFORME', puce: 'bg-rose-400', cadre: 'border-rose-500/40 bg-rose-500/10', texte: 'text-rose-300' },
    inconnu: { libelle: 'INCONNU — NON ÉPROUVÉ', puce: 'bg-slate-400', cadre: 'border-slate-600 bg-slate-800/60', texte: 'text-slate-300' },
};

const ETAT_VERROU: Record<EtatVerrou, { libelle: string; classe: string; Icone: typeof Lock }> = {
    ouvert: { libelle: 'Ouvert', classe: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', Icone: LockOpen },
    ferme: { libelle: 'Fermé', classe: 'border-rose-500/30 bg-rose-500/10 text-rose-300', Icone: Lock },
    inconnu: { libelle: 'Non éprouvé', classe: 'border-slate-600 bg-slate-800 text-slate-300', Icone: ShieldQuestion },
};

const SOURCE_LIBELLE: Record<Source, string> = {
    base: 'lu en base',
    depot: 'mesuré au build',
    'hors-ligne': 'relevé hors ligne',
    indisponible: 'non lisible ici',
};

// `children` et pas un nom traduit : JSX ne remplit QUE `children`. Avec un
// autre nom, la pastille rend un cadre vide — sans erreur, sans avertissement.
const Puce: React.FC<{ children: React.ReactNode; classe: string }> = ({ children, classe }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${classe}`}>{children}</span>
);

const Carte: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`rounded-2xl bg-slate-950/60 border border-slate-800 ${className}`}>{children}</div>
);

const TitreSection: React.FC<{ icone: React.ReactNode; titre: string; sous?: string }> = ({ icone, titre, sous }) => (
    <div className="flex items-start gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
            {icone}
        </div>
        <div>
            <h4 className="text-sm font-bold text-white leading-tight">{titre}</h4>
            {sous && <p className="text-[11px] text-slate-400 max-w-2xl mt-0.5">{sous}</p>}
        </div>
    </div>
);

// ── Verrou ───────────────────────────────────────────────────────────────────
const CarteVerrou: React.FC<{ verrou: Verrou }> = ({ verrou }) => {
    const meta = ETAT_VERROU[verrou.etat];
    const bordure = verrou.etat === 'ouvert' ? 'border-t-emerald-500'
        : verrou.etat === 'ferme' ? 'border-t-rose-500' : 'border-t-slate-600';
    return (
        <div className={`rounded-2xl bg-slate-950/60 border border-slate-800 border-t-4 ${bordure} p-3 flex flex-col gap-1.5`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-500">Verrou {verrou.numero}</span>
                <Puce classe={meta.classe}>
                    <span className="inline-flex items-center gap-1"><meta.Icone size={10} /> {meta.libelle}</span>
                </Puce>
            </div>
            <h5 className="text-xs font-bold text-white leading-snug">{verrou.titre}</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{verrou.detail}</p>
            {verrou.raisonInconnue && (
                <p className="text-[10px] text-amber-300/80 leading-relaxed border-t border-slate-800 pt-1.5">
                    {verrou.raisonInconnue}
                </p>
            )}
            <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">
                {SOURCE_LIBELLE[verrou.source]}
            </span>
        </div>
    );
};

// ── Agents ───────────────────────────────────────────────────────────────────
const LigneAgent: React.FC<{ agent: AgentTour }> = ({ agent }) => (
    <tr className="border-b border-slate-800 last:border-0 hover:bg-slate-900/40">
        <td className="py-2 px-3">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{agent.nom}</span>
                <span className="text-[10px] font-mono text-slate-500">{agent.id}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {agent.estHumain
                    ? <Puce classe="border-amber-500/30 bg-amber-500/10 text-amber-300"><span className="inline-flex items-center gap-1"><UserCheck size={10} /> Humain</span></Puce>
                    : <Puce classe="border-blue-500/30 bg-blue-500/10 text-blue-300"><span className="inline-flex items-center gap-1"><Bot size={10} /> Expert IA</span></Puce>}
                {!agent.presentEnBase && (
                    <Puce classe="border-rose-500/30 bg-rose-500/10 text-rose-300">Absent de la table agents</Puce>
                )}
                {agent.presentEnBase && !agent.actif && (
                    <Puce classe="border-slate-600 bg-slate-800 text-slate-400">Inactif</Puce>
                )}
            </div>
        </td>
        {agent.droits.map((droit) => (
            <td key={droit.toolId} className="py-2 px-3 text-center">
                {droit.accorde ? (
                    <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${droit.outilActif ? 'text-emerald-300' : 'text-amber-300'}`}
                        title={droit.outilActif ? 'Accordé et actif' : "Accordé, mais l'outil est coupé au catalogue"}
                    >
                        <CheckCircle2 size={12} />
                        {droit.outilActif ? 'Oui' : 'Coupé'}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
                        <XCircle size={12} /> Non
                    </span>
                )}
            </td>
        ))}
    </tr>
);

// ── Vue pure ─────────────────────────────────────────────────────────────────
// Séparée du chargement pour être testable et prévisualisable avec un
// instantané réel, sans base ni session.
export const AiCoreControlTowerView: React.FC<{ etat: EtatTourDeControle }> = ({ etat }) => {
    const statut = STATUT_GLOBAL[etat.statutGlobal];
    const colonnes = etat.agents[0]?.droits ?? [];
    const agentsAvecAiCore = etat.agents.filter((a) => a.aAiCore).length;

    return (
        <div className="space-y-5">

            {/* Bandeau d'identité et statut global */}
            <div className={`rounded-2xl border p-4 ${statut.cadre}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white shrink-0">
                            <Activity size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white leading-tight">Tour de contrôle Vision Smart AI Core</h3>
                            <p className="text-xs text-slate-300 max-w-3xl mt-1">{etat.resumeGlobal}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statut.puce}`} />
                        <span className={`text-xs font-black tracking-wide ${statut.texte}`}>{statut.libelle}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <Puce classe="border-slate-600 bg-slate-900/60 text-slate-300">Lecture seule — aucune action possible ici</Puce>
                    <Puce classe="border-slate-600 bg-slate-900/60 text-slate-300">
                        Relevé le {new Date(etat.releveLe).toLocaleString('fr-FR')}
                    </Puce>
                    {etat.manifeste?.commit && (
                        <Puce classe="border-slate-600 bg-slate-900/60 text-slate-300">
                            <span className="inline-flex items-center gap-1"><GitBranch size={10} /> {etat.manifeste.commit}</span>
                        </Puce>
                    )}
                </div>
            </div>

            {etat.erreurs.length > 0 && (
                <Carte className="p-3 border-rose-500/30">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-rose-300 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-rose-300">Lectures en échec</h4>
                            <ul className="text-[11px] text-slate-300 mt-1 space-y-0.5 list-disc list-inside">
                                {etat.erreurs.map((e) => <li key={e}>{e}</li>)}
                            </ul>
                        </div>
                    </div>
                </Carte>
            )}

            {/* Les cinq verrous */}
            <div>
                <TitreSection
                    icone={<Lock size={15} />}
                    titre="Les cinq verrous d'AI Core"
                    sous="Les cinq doivent être ouverts en même temps pour qu'un expert atteigne la mémoire institutionnelle. Un seul fermé suffit à la rendre invisible, sans message d'erreur."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                    {etat.verrous.map((v) => <CarteVerrou key={v.numero} verrou={v} />)}
                </div>
            </div>

            {/* Agents et droits */}
            <div>
                <TitreSection
                    icone={<Bot size={15} />}
                    titre={`Agents et droits — ${etat.agents.length} identifiants, ${agentsAvecAiCore} avec AI Core`}
                    sous="Croisement réel de la table des agents et des autorisations par outil. Un agent absent de la table n'apparaît dans aucune autre console."
                />
                <Carte className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent</th>
                                {colonnes.map((c) => (
                                    <th key={c.toolId} className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                                        <span className="block">{c.libelle}</span>
                                        {!c.outilActif && (
                                            <span className="text-[9px] font-bold text-amber-400/80 normal-case">coupé au catalogue</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {etat.agents.map((a) => <LigneAgent key={a.id} agent={a} />)}
                        </tbody>
                    </table>
                </Carte>
            </div>

            {/* Architecte + observabilité */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <Carte className="p-3">
                    <TitreSection icone={<FileCode2 size={15} />} titre="L'Architecte" />
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                        <p className="flex items-center gap-1.5">
                            {etat.architecte.presentEnBase
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <XCircle size={12} className="text-rose-400 shrink-0" />}
                            Table <span className="font-mono text-slate-400">agents</span> :{' '}
                            {etat.architecte.presentEnBase ? 'présent' : 'absent'}
                        </p>
                        <p className="flex items-center gap-1.5">
                            {etat.architecte.aDesDroits
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <XCircle size={12} className="text-rose-400 shrink-0" />}
                            Droits accordés : {etat.architecte.droits.length > 0 ? etat.architecte.droits.join(', ') : 'aucun'}
                        </p>
                        <p className="flex items-center gap-1.5">
                            {etat.architecte.pilotableDepuisLaConsole
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <AlertTriangle size={12} className="text-amber-400 shrink-0" />}
                            Pilotable depuis la console : {etat.architecte.pilotableDepuisLaConsole ? 'oui' : 'non'}
                        </p>
                        {!etat.architecte.pilotableDepuisLaConsole && (
                            <p className="text-[10px] text-amber-300/80 border-t border-slate-800 pt-1.5 mt-1.5">
                                Il détient des droits sans exister comme agent : ils ne se modifient qu'en SQL.
                            </p>
                        )}
                    </div>
                </Carte>

                <Carte className="p-3">
                    <TitreSection icone={<Database size={15} />} titre="Journalisation et usage" />
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                        <p className="flex items-center gap-1.5">
                            {etat.journalisation.colonneAgentId === 'ouvert'
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <XCircle size={12} className="text-rose-400 shrink-0" />}
                            Colonne <span className="font-mono text-slate-400">agent_id</span> :{' '}
                            {etat.journalisation.colonneAgentId === 'ouvert' ? 'présente' : 'absente'}
                        </p>
                        <p className="flex items-center gap-1.5">
                            {etat.journalisation.colonneToolsUsed === 'ouvert'
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <XCircle size={12} className="text-rose-400 shrink-0" />}
                            Colonne <span className="font-mono text-slate-400">tools_used</span> :{' '}
                            {etat.journalisation.colonneToolsUsed === 'ouvert' ? 'présente' : 'absente'}
                        </p>
                        <p className="text-[11px] border-t border-slate-800 pt-1.5 mt-1.5">
                            <span className="font-bold text-white">Appels AI Core détectés : </span>
                            {etat.appelsAiCore.mesurable
                                ? <span className="text-emerald-300 font-bold">{etat.appelsAiCore.nombre}</span>
                                : <span className="text-slate-400">non mesurable</span>}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{etat.appelsAiCore.raison}</p>
                    </div>
                </Carte>

                <Carte className="p-3">
                    <TitreSection icone={<FlaskConical size={15} />} titre="Tests et cohérence" />
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                        <p className="flex items-center gap-1.5">
                            {etat.tests.couvreAiCore
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <XCircle size={12} className="text-rose-400 shrink-0" />}
                            {etat.tests.fichiersCouvrantAiCore} test(s) couvrant AI Core sur {etat.tests.fichiersVitest} fichiers
                        </p>
                        <p className="flex items-center gap-1.5">
                            {etat.tests.fichiersDeno > 0
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <XCircle size={12} className="text-rose-400 shrink-0" />}
                            {etat.tests.fichiersDeno} test(s) Deno sur les fonctions Edge
                        </p>
                        <p className="flex items-center gap-1.5 border-t border-slate-800 pt-1.5 mt-1.5">
                            {etat.coherence.alignees
                                ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                : <AlertTriangle size={12} className="text-rose-400 shrink-0" />}
                            Migrations : <span className="font-bold text-white">{etat.coherence.migrationsDepot}</span> au dépôt
                            {' '}contre <span className="font-bold text-white">{etat.coherence.migrationsBase}</span> en base
                        </p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            Nombre en base relevé le {etat.coherence.releveLe} — {etat.coherence.methode}. Pas une lecture en direct.
                        </p>
                    </div>
                </Carte>
            </div>

            {/* Angles morts */}
            <Carte className="p-3 border-slate-700">
                <TitreSection
                    icone={<EyeOff size={15} />}
                    titre="Ce que cette console ne voit pas"
                    sous="Listé ici plutôt que passé sous silence : une case absente de ce tableau de bord n'est pas une case verte."
                />
                <ul className="space-y-1">
                    {etat.anglesMorts.map((angle) => (
                        <li key={angle} className="flex items-start gap-2 text-[11px] text-slate-400">
                            <HelpCircle size={12} className="text-slate-500 mt-0.5 shrink-0" />
                            <span>{angle}</span>
                        </li>
                    ))}
                </ul>
            </Carte>
        </div>
    );
};


export { Carte };
