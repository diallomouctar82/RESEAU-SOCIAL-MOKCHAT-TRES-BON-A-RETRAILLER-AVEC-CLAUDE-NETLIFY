import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle, CheckCircle2, ClipboardCopy, ExternalLink, GitCommitHorizontal, History,
    RefreshCw, RotateCcw, ShieldCheck, XCircle,
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseClient';
import { isNewVersionAvailable } from '../../services/updateWatch';
import {
    REGISTRE_VERSIONS_STABLES, SITE_PRODUCTION, commitCourt, formaterUtc, identifierVersionServie,
    preControlesRestauration, procedureRestauration, urlCaptures, urlCommit, urlPr, verdictRestauration,
    versionServie, versionsFusionnees,
    type IdentificationServie, type PreControle, type Verdict, type VersionStable,
} from '../../services/versions/stableVersions';
import {
    construireOrdre, infoBuildCourant, journalRestaurations, lireProductionServie, nouvelIdOrdre, resumerServie,
    type AuteurOrdre, type JournalRestaurations, type LectureProductionDatee, type OrdreRestauration,
} from '../../services/versions/restaurationControlee';

/**
 * ONGLET SUPER-ADMIN « VERSIONS STABLES & RESTAURATION CONTRÔLÉE »
 * (Direction, 05/09/2026).
 *
 * Ce que l'Admin Général voit : les dernières versions livrées (nom, date,
 * commit, PR, module, statut de production, preuves), ce que `moknet.net`
 * sert RÉELLEMENT maintenant (relu sans cache), ce que son propre onglet
 * exécute, et — pour une régression — un ordre de restauration contrôlée :
 * pré-contrôles affichés un à un, confirmation par saisie exacte de la
 * version, motif obligatoire, reconnaissance des points orange, ordre
 * nominatif journalisé (réglage partagé + audit), procédure exacte (Netlify
 * ou Git) et vérification de la version servie après coup.
 *
 * Ce que cet onglet NE FAIT PAS, et le dit : basculer la production tout
 * seul. Aucun secret Netlify ou GitHub ne vit dans le navigateur. Il prépare,
 * trace et vérifie ; l'acte de publication reste manuel et nominatif.
 */
export interface AdminStableVersionsTabProps {
    adminName?: string;
    registre?: readonly VersionStable[];
    fetchImpl?: typeof fetch;
    journal?: JournalRestaurations;
    lireAuteur?: (nom: string) => Promise<AuteurOrdre>;
    maintenant?: () => Date;
}

const MOTIF_MINIMUM = 10;

async function auteurDepuisSession(nom: string): Promise<AuteurOrdre> {
    try {
        const u = await supabaseService.getCurrentUser();
        return { nom, email: u?.email ?? null, id: u?.id ?? null };
    } catch {
        return { nom, email: null, id: null };
    }
}

function heureCourte(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const TON: Record<Verdict | 'blanc', string> = {
    vert: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    orange: 'border-amber-200 bg-amber-50 text-amber-900',
    rouge: 'border-rose-200 bg-rose-50 text-rose-900',
    blanc: 'border-slate-200 bg-slate-50 text-slate-700',
};

function IconeVerdict({ verdict }: { verdict: Verdict | 'blanc' }) {
    if (verdict === 'vert') return <CheckCircle2 size={16} className="shrink-0 text-emerald-600" aria-hidden="true" />;
    if (verdict === 'orange') return <AlertTriangle size={16} className="shrink-0 text-amber-600" aria-hidden="true" />;
    if (verdict === 'rouge') return <XCircle size={16} className="shrink-0 text-rose-600" aria-hidden="true" />;
    return <ShieldCheck size={16} className="shrink-0 text-slate-500" aria-hidden="true" />;
}

function statutAffiche(v: VersionStable, servie: IdentificationServie | null): { libelle: string; classe: string } {
    if (v.statut === 'en-preparation') return { libelle: 'En préparation — cette livraison', classe: 'bg-slate-100 text-slate-700 border-slate-200' };
    const s = servie ? versionServie(servie) : null;
    if (s && s.version === v.version) return { libelle: `Servie par ${SITE_PRODUCTION.url.replace('https://', '')}`, classe: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
    if (s && s.fusionUtc && v.fusionUtc && v.fusionUtc > s.fusionUtc) return { libelle: 'Fusionnée après la version servie', classe: 'bg-amber-100 text-amber-900 border-amber-200' };
    if (s) return { libelle: 'Remplacée — ses changements sont inclus dans la version servie', classe: 'bg-slate-100 text-slate-700 border-slate-200' };
    return { libelle: `Fusionnée le ${formaterUtc(v.fusionUtc)}`, classe: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function Lien({ href, children, testid }: { href: string; children: React.ReactNode; testid?: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={testid}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
            {children}
            <ExternalLink size={11} aria-hidden="true" />
        </a>
    );
}

export const AdminStableVersionsTab: React.FC<AdminStableVersionsTabProps> = ({
    adminName = 'Admin-Général',
    registre = REGISTRE_VERSIONS_STABLES,
    fetchImpl,
    journal = journalRestaurations,
    lireAuteur = auteurDepuisSession,
    maintenant = () => new Date(),
}) => {
    const sectionRef = useRef<HTMLElement | null>(null);
    const build = useMemo(() => infoBuildCourant(), []);
    const fusionnees = useMemo(() => versionsFusionnees(registre), [registre]);
    const enPreparation = useMemo(() => registre.filter((v) => v.statut === 'en-preparation'), [registre]);

    const [lecture, setLecture] = useState<LectureProductionDatee | null>(null);
    const [lectureEnCours, setLectureEnCours] = useState(true);
    const servie = useMemo<IdentificationServie | null>(() => (lecture ? identifierVersionServie(lecture, registre) : null), [lecture, registre]);

    const [cible, setCible] = useState<VersionStable | null>(null);
    const [confirmation, setConfirmation] = useState('');
    const [motif, setMotif] = useState('');
    const [orangesReconnus, setOrangesReconnus] = useState(false);
    const [enregistrement, setEnregistrement] = useState<'repos' | 'en-cours' | 'fait' | 'erreur'>('repos');
    const [ordreEnCours, setOrdreEnCours] = useState<OrdreRestauration | null>(null);
    const [ordrePartage, setOrdrePartage] = useState<boolean | null>(null);
    const [verdictApres, setVerdictApres] = useState<{ verdict: Verdict | 'blanc'; message: string; le: string } | null>(null);
    const [verificationEnCours, setVerificationEnCours] = useState(false);
    const [ordres, setOrdres] = useState<OrdreRestauration[]>([]);
    const [journalPartage, setJournalPartage] = useState<boolean | null>(null);
    const [copie, setCopie] = useState<string | null>(null);

    // Téléphone et tablette : amener l'onglet en vue une fois à l'ouverture (même geste que l'onglet Avatar).
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        if (!window.matchMedia('(max-width: 1023px)').matches) return;
        sectionRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    }, []);

    // Lus par des refs : un parent qui passerait des fonctions inline ne doit
    // jamais relancer la lecture de la production à chaque rendu.
    const fetchRef = useRef(fetchImpl);
    fetchRef.current = fetchImpl;
    const maintenantRef = useRef(maintenant);
    maintenantRef.current = maintenant;

    const relire = useCallback(async () => {
        setLectureEnCours(true);
        const l = await lireProductionServie(fetchRef.current ?? fetch, maintenantRef.current);
        setLecture(l);
        setLectureEnCours(false);
        return l;
    }, []);

    useEffect(() => { void relire(); }, [relire]);

    useEffect(() => {
        let actif = true;
        journal.charger().then(({ ordres: o, partage }) => {
            if (!actif) return;
            setOrdres(o);
            setJournalPartage(partage);
        }).catch(() => { if (actif) setJournalPartage(false); });
        return () => { actif = false; };
    }, [journal]);

    const preControles = useMemo(() => (cible && servie ? preControlesRestauration(cible, servie, registre) : null), [cible, servie, registre]);
    const procedure = useMemo(() => (cible ? procedureRestauration(cible, registre) : null), [cible, registre]);

    const confirmationExacte = cible ? confirmation.trim() === cible.version : false;
    const motifSuffisant = motif.trim().length >= MOTIF_MINIMUM;
    const orangesOk = !preControles || preControles.oranges === 0 || orangesReconnus;
    const peutEnregistrer = Boolean(cible && preControles?.autorise && confirmationExacte && motifSuffisant && orangesOk && enregistrement !== 'en-cours' && enregistrement !== 'fait');

    const choisir = (v: VersionStable | null) => {
        setCible(v);
        setConfirmation('');
        setMotif('');
        setOrangesReconnus(false);
        setEnregistrement('repos');
        setOrdreEnCours(null);
        setOrdrePartage(null);
        setVerdictApres(null);
        setCopie(null);
    };

    const abandonner = () => choisir(null);

    const enregistrer = async () => {
        if (!cible || !servie || !preControles || !peutEnregistrer) return;
        setEnregistrement('en-cours');
        try {
            const par = await lireAuteur(adminName);
            const quand = maintenant();
            const ordre = construireOrdre({
                id: nouvelIdOrdre(quand),
                creeLe: quand.toISOString(),
                par,
                cible,
                servie,
                motif,
                controles: preControles.controles,
                orangesReconnus: preControles.oranges > 0 ? orangesReconnus : false,
            });
            const { partage } = await journal.enregistrer(ordre);
            setOrdreEnCours(ordre);
            setOrdrePartage(partage);
            setOrdres((prev) => [ordre, ...prev.filter((o) => o.id !== ordre.id)]);
            setEnregistrement('fait');
        } catch {
            setEnregistrement('erreur');
        }
    };

    const verifierApres = async () => {
        if (!cible || !ordreEnCours) return;
        setVerificationEnCours(true);
        const l = await relire();
        const id = identifierVersionServie(l, registre);
        const v = verdictRestauration(cible, id);
        const le = maintenant().toISOString();
        setVerdictApres({ ...v, le });
        const statut: OrdreRestauration['statut'] = v.verdict === 'vert' ? 'verifie-vert' : v.verdict === 'orange' || v.verdict === 'blanc' ? 'verifie-orange' : 'verifie-rouge';
        const { ordre } = await journal.marquerVerification(ordreEnCours.id, { le, message: v.message, servie: resumerServie(id) }, statut).catch(() => ({ partage: false, ordre: null }));
        if (ordre) {
            setOrdreEnCours(ordre);
            setOrdres((prev) => prev.map((o) => (o.id === ordre.id ? ordre : o)));
        }
        setVerificationEnCours(false);
    };

    const copier = async (texte: string, libelle: string) => {
        try {
            if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('presse-papiers indisponible');
            await navigator.clipboard.writeText(texte);
            setCopie(`${libelle} copiées dans le presse-papiers.`);
        } catch {
            setCopie(`Copie impossible dans ce navigateur : sélectionnez le texte des ${libelle.toLowerCase()} à la main.`);
        }
    };

    const nouvelleVersionEnLigne = Boolean(build?.bundle && lecture?.bundle && isNewVersionAvailable(build.bundle, lecture.bundle));

    return (
        <section ref={sectionRef} data-testid="admin-versions-stables-tab" className="space-y-4 scroll-mt-3">
            <header className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                    <span className="p-2.5 bg-amber-50 text-amber-800 rounded-2xl shrink-0"><History size={22} aria-hidden="true" /></span>
                    <div>
                        <h2 className="text-base font-black text-slate-900">Versions stables & restauration contrôlée</h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                            Les dernières versions livrées avec leurs preuves, ce que {SITE_PRODUCTION.url.replace('https://', '')} sert réellement maintenant,
                            et, en cas de régression, un ordre de restauration contrôlée : pré-contrôles, confirmation saisie, motif,
                            journal nominatif, procédure exacte, vérification. Jamais à l’aveugle.
                        </p>
                    </div>
                </div>
                <div
                    role="status"
                    aria-live="polite"
                    data-testid="versions-lecture-statut"
                    className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-bold ${lecture && !lectureEnCours ? (lecture.joignable ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800') : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                >
                    {lectureEnCours ? <RefreshCw size={15} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
                    {lectureEnCours ? 'Lecture de la production…' : lecture?.joignable ? `Production lue à ${heureCourte(lecture.luLe)}` : `Production injoignable à ${heureCourte(lecture?.luLe ?? maintenant().toISOString())}`}
                </div>
            </header>

            {/* ── Ce que le serveur sert maintenant ── */}
            <div data-testid="versions-production" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><GitCommitHorizontal size={16} className="text-blue-600" aria-hidden="true" />Ce que {SITE_PRODUCTION.url.replace('https://', '')} sert maintenant</h3>
                    <button
                        type="button"
                        onClick={() => void relire()}
                        disabled={lectureEnCours}
                        data-testid="versions-relire"
                        className="min-h-[44px] px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                    >
                        <RefreshCw size={14} className={lectureEnCours ? 'animate-spin' : ''} aria-hidden="true" />
                        Relire la production
                    </button>
                </div>
                {servie && (
                    <div data-testid="versions-production-verdict" data-etat={servie.etat} className={`rounded-2xl border px-4 py-3 text-xs flex items-start gap-2 ${servie.etat === 'identifiee' ? TON.vert : servie.etat === 'injoignable' ? TON.rouge : servie.etat === 'declaree' ? TON.orange : TON.blanc}`}>
                        <IconeVerdict verdict={servie.etat === 'identifiee' ? 'vert' : servie.etat === 'injoignable' ? 'rouge' : servie.etat === 'declaree' ? 'orange' : 'blanc'} />
                        <div className="space-y-0.5">
                            {servie.etat === 'identifiee' && <p className="font-bold">Version servie : {servie.version.version} — {servie.version.nom}</p>}
                            {servie.etat === 'declaree' && <p className="font-bold">Le code servi se déclare {servie.version.version}, mais son commit ({commitCourt(servie.commit)}) n’est pas celui consigné ({commitCourt(servie.version.commit)}) : documentation seule ou code postérieur non encore consigné au registre.</p>}
                            {servie.etat === 'inconnue-du-registre' && <p className="font-bold">Le code servi se déclare {servie.versionDeclaree}, absente de ce registre : le registre est en retard sur la production.</p>}
                            {servie.etat === 'non-identifiable' && <p className="font-bold">Version servie non identifiable : aucun version.json (déploiement antérieur au registre) et bundle {servie.bundle ?? 'inconnu'} non consigné.</p>}
                            {servie.etat === 'injoignable' && <p className="font-bold">Le serveur n’a pas répondu : on ne sait pas ce qui est servi. Aucune restauration ne sera autorisée tant que cette lecture échoue.</p>}
                            {'commit' in servie && (
                                <p className="font-mono text-[11px] opacity-90">
                                    commit {commitCourt(servie.commit)}{servie.deployId ? ` · déploiement ${servie.deployId}` : ''}{servie.bundle ? ` · bundle ${servie.bundle}` : ''}{servie.etat === 'identifiee' ? ` · source : ${servie.source}` : ''}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <p data-testid="versions-onglet-courant" className="text-[11px] text-slate-500 font-mono">
                    {build
                        ? `Votre onglet exécute ${build.version} · commit ${commitCourt(build.commit)}${build.deployId ? ` · déploiement ${build.deployId}` : ''}${build.bundle ? ` · ${build.bundle}` : ''}`
                        : 'Votre onglet exécute une version de développement (aucune carte d’identité de build).'}
                </p>
                {nouvelleVersionEnLigne && (
                    <p role="status" data-testid="versions-nouvelle-en-ligne" className={`rounded-2xl border px-4 py-2.5 text-xs font-bold ${TON.orange}`}>
                        Une version plus récente que celle de votre onglet est en ligne : rechargez la page avant tout ordre de restauration.
                    </p>
                )}
                <p className="text-[11px] text-slate-500">
                    Lecture sans cache de <span className="font-mono">/version.json</span> (carte d’identité écrite au build) puis de la page d’accueil (nom du bundle). Ce tableau ne bascule pas la production lui-même : aucun secret Netlify ou GitHub dans le navigateur. Il prépare, trace et vérifie.
                </p>
            </div>

            {/* ── Registre ── */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 px-1">
                    <ShieldCheck size={16} className="text-emerald-600" aria-hidden="true" />
                    Dernières versions stables livrées ({fusionnees.length}) — ordre de fusion, la plus récente d’abord
                </h3>
                <ul data-testid="versions-liste" className="grid grid-cols-1 gap-3 list-none p-0 m-0">
                    {[...enPreparation, ...fusionnees].map((v) => {
                        const statut = statutAffiche(v, servie);
                        const estServie = Boolean(servie && versionServie(servie)?.version === v.version);
                        const restaurable = v.statut === 'fusionnee' && Boolean(v.commit);
                        const bloque = !restaurable || estServie || lectureEnCours;
                        const raison = !restaurable ? 'Version non fusionnée : rien à restaurer.' : estServie ? 'C’est la version servie : rien à restaurer.' : lectureEnCours ? 'Lecture de la production en cours.' : undefined;
                        return (
                            <li key={v.version} data-testid={`versions-carte-${v.version}`} className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-sm space-y-3 ${estServie ? 'border-emerald-400 ring-2 ring-emerald-400/15' : 'border-slate-200'}`}>
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <span className={`px-3 py-2 rounded-2xl font-mono text-sm font-bold shrink-0 ${estServie ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'}`}>{v.version}</span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-sm leading-snug">{v.nom}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                <span className={`inline-block rounded-full border px-2 py-0.5 font-bold ${statut.classe}`} data-testid={`versions-statut-${v.version}`}>{statut.libelle}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => choisir(v)}
                                        disabled={bloque}
                                        title={raison}
                                        aria-label={`Restaurer la version ${v.version} — contrôle avant tout`}
                                        data-testid={`versions-choisir-${v.version}`}
                                        className="min-h-[44px] px-4 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                                    >
                                        <RotateCcw size={14} aria-hidden="true" />
                                        Restaurer cette version…
                                    </button>
                                </div>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                                    <div><dt className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Date de fusion (UTC)</dt><dd className="text-slate-800">{v.fusionUtc ? formaterUtc(v.fusionUtc) : 'non fusionnée'}</dd></div>
                                    <div><dt className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Commit</dt><dd>{v.commit ? <Lien href={urlCommit(v)!} testid={`versions-commit-${v.version}`}>{commitCourt(v.commit)}</Lien> : <span className="text-slate-500">—</span>}</dd></div>
                                    <div><dt className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">PR · décision</dt><dd>{v.pr ? <Lien href={urlPr(v)!}>#{v.pr}</Lien> : <span className="text-slate-500">PR à venir</span>} <span className="text-slate-500">· {v.dec}</span></dd></div>
                                    <div className="sm:col-span-2 xl:col-span-3"><dt className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Module(s)</dt><dd className="text-slate-800">{v.modules.join(' · ')}</dd></div>
                                    <div className="sm:col-span-2 xl:col-span-3">
                                        <dt className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Preuves</dt>
                                        <dd className="text-slate-800 space-y-0.5">
                                            <p>Typage {v.preuves.typage}{v.preuves.tests ? ` · tests ${v.preuves.tests}` : ' · tests : non consignés'}{v.preuves.greenGate?.length ? ` · Green Gate ${v.preuves.greenGate.join(', ')}` : ''}</p>
                                            {v.preuves.productionVerifiee && <p>Production vérifiée : {v.preuves.productionVerifiee}</p>}
                                            {v.preuves.revueIndependante && <p>Contrôle indépendant : {v.preuves.revueIndependante}</p>}
                                            {v.preuves.captures ? <p>Captures et mesures : <Lien href={urlCaptures(v)!}>{v.preuves.captures}</Lien></p> : <p className="text-slate-500">Captures : non versionnées</p>}
                                            {v.bundle && <p className="font-mono text-[11px] text-slate-600">bundle à la fusion : {v.bundle}</p>}
                                        </dd>
                                    </div>
                                    {(v.risque.note || v.risque.migrationsBase || v.risque.donneesTouchees || v.risque.configurationServie) && (
                                        <div className="sm:col-span-2 xl:col-span-3"><dt className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Portée et risques</dt><dd className="text-slate-800">{[v.risque.migrationsBase ? 'migration de base' : null, v.risque.donneesTouchees ? 'données touchées' : null, v.risque.configurationServie ? 'configuration servie' : null].filter(Boolean).join(' · ') || 'code seul'}{v.risque.note ? ` — ${v.risque.note}` : ''}</dd></div>
                                    )}
                                </dl>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* ── Restauration contrôlée ── */}
            {cible && preControles && procedure && (
                <div data-testid="restauration-panneau" className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2"><RotateCcw size={16} className="text-amber-700" aria-hidden="true" />Ordre de restauration vers {cible.version}</h3>
                            <p className="text-xs text-slate-500 mt-1">{cible.nom}</p>
                        </div>
                        <button type="button" onClick={abandonner} data-testid="restauration-abandonner" className="min-h-[44px] px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">Abandonner</button>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-2">Pré-contrôles</h4>
                        <ul className="space-y-1.5 list-none p-0 m-0">
                            {preControles.controles.map((c: PreControle) => (
                                <li key={c.id} data-testid={`restauration-precontrole-${c.id}`} data-verdict={c.verdict} className={`rounded-2xl border px-3.5 py-2.5 text-xs flex items-start gap-2 ${TON[c.verdict]}`}>
                                    <IconeVerdict verdict={c.verdict} />
                                    <div><p className="font-bold">{c.libelle}</p><p className="opacity-90">{c.detail}</p></div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {!preControles.autorise ? (
                        <p role="alert" data-testid="restauration-refusee" className={`rounded-2xl border px-4 py-3 text-xs font-bold ${TON.rouge}`}>
                            Restauration refusée : un pré-contrôle est rouge. Corrigez la cause (relire la production, choisir une autre version) avant tout ordre.
                        </p>
                    ) : enregistrement !== 'fait' ? (
                        <form
                            onSubmit={(e) => { e.preventDefault(); void enregistrer(); }}
                            className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            aria-describedby="restauration-aide"
                        >
                            <p id="restauration-aide" className="text-[11px] text-slate-600">
                                Cet ordre ne bascule pas la production : il trace, nominativement, la décision de revenir à {cible.version} et fournit la procédure exacte. La publication reste un geste manuel, vérifié ensuite ici.
                            </p>
                            <div>
                                <label htmlFor="restauration-confirmation" className="block text-xs font-bold text-slate-800">Saisissez exactement <span className="font-mono">{cible.version}</span> pour confirmer</label>
                                <input
                                    id="restauration-confirmation"
                                    data-testid="restauration-confirmation"
                                    value={confirmation}
                                    onChange={(e) => setConfirmation(e.target.value)}
                                    autoComplete="off"
                                    spellCheck={false}
                                    aria-invalid={confirmation.length > 0 && !confirmationExacte}
                                    className="mt-1 w-full min-h-[44px] rounded-xl border-2 border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="restauration-motif" className="block text-xs font-bold text-slate-800">Motif de la restauration (régression constatée, où, depuis quand) — {MOTIF_MINIMUM} caractères au moins</label>
                                <textarea
                                    id="restauration-motif"
                                    data-testid="restauration-motif"
                                    value={motif}
                                    onChange={(e) => setMotif(e.target.value)}
                                    rows={3}
                                    className="mt-1 w-full rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            {preControles.oranges > 0 && (
                                <label className="flex items-start gap-2 text-xs text-amber-900 font-bold">
                                    <input type="checkbox" data-testid="restauration-oranges" checked={orangesReconnus} onChange={(e) => setOrangesReconnus(e.target.checked)} className="mt-0.5 h-5 w-5 accent-amber-600" />
                                    J’ai lu les {preControles.oranges} point{preControles.oranges > 1 ? 's' : ''} orange ci-dessus et j’en prends la responsabilité.
                                </label>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={!peutEnregistrer}
                                    data-testid="restauration-enregistrer"
                                    className="min-h-[44px] px-5 rounded-xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                                >
                                    <ShieldCheck size={14} aria-hidden="true" />
                                    {enregistrement === 'en-cours' ? 'Enregistrement…' : 'Enregistrer l’ordre de restauration'}
                                </button>
                                {enregistrement === 'erreur' && <p role="alert" className="text-xs font-bold text-rose-700">L’ordre n’a pas pu être enregistré (journal indisponible). Rien n’a été fait.</p>}
                            </div>
                        </form>
                    ) : null}

                    {enregistrement === 'fait' && ordreEnCours && (
                        <div className="space-y-4">
                            <p role="status" data-testid="restauration-ordre-enregistre" className={`rounded-2xl border px-4 py-3 text-xs font-bold ${ordrePartage ? TON.vert : TON.orange}`}>
                                Ordre {ordreEnCours.id} enregistré le {formaterUtc(ordreEnCours.creeLe)} par {ordreEnCours.par.nom}{ordreEnCours.par.email ? ` (${ordreEnCours.par.email})` : ''} — cible {ordreEnCours.cible.version}, servie avant : {ordreEnCours.servieAvant.version ?? 'non identifiée'}.
                                {ordrePartage ? ' Journal partagé de la plateforme et journal d’audit mis à jour.' : ' Journal partagé indisponible : copie locale et journal d’audit seulement — le dire dans la mémoire vivante.'}
                            </p>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                <section className="rounded-2xl border border-slate-200 p-4 space-y-2" aria-labelledby="restauration-voie-a">
                                    <h4 id="restauration-voie-a" className="text-xs font-black text-slate-900">{procedure.voieNetlify.titre}</h4>
                                    <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-800">{procedure.voieNetlify.etapes.map((e, i) => <li key={i}>{e}</li>)}</ol>
                                    <a href={procedure.voieNetlify.lien} target="_blank" rel="noopener noreferrer" data-testid="restauration-lien-netlify" className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">
                                        Ouvrir les déploiements Netlify <ExternalLink size={12} aria-hidden="true" />
                                    </a>
                                </section>
                                <section className="rounded-2xl border border-slate-200 p-4 space-y-2" aria-labelledby="restauration-voie-b">
                                    <h4 id="restauration-voie-b" className="text-xs font-black text-slate-900">{procedure.voieGit.titre}</h4>
                                    <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-800">{procedure.voieGit.etapes.map((e, i) => <li key={i}>{e}</li>)}</ol>
                                    <pre data-testid="restauration-commandes" className="overflow-x-auto rounded-xl bg-slate-900 text-slate-100 text-[11px] p-3 leading-relaxed"><code>{procedure.voieGit.commandes.join('\n')}</code></pre>
                                    <button type="button" onClick={() => void copier(procedure.voieGit.commandes.join('\n'), 'Commandes')} data-testid="restauration-copier" className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">
                                        <ClipboardCopy size={14} aria-hidden="true" /> Copier les commandes
                                    </button>
                                    {copie && <p role="status" className="text-[11px] text-slate-600">{copie}</p>}
                                </section>
                            </div>

                            <section className="rounded-2xl border border-slate-200 p-4 space-y-2" aria-labelledby="restauration-verification-titre">
                                <h4 id="restauration-verification-titre" className="text-xs font-black text-slate-900">Après la publication : vérifier, puis consigner</h4>
                                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-800">{procedure.verificationApres.map((e, i) => <li key={i}>{e}</li>)}</ul>
                                <button
                                    type="button"
                                    onClick={() => void verifierApres()}
                                    disabled={verificationEnCours}
                                    data-testid="restauration-verifier"
                                    className="min-h-[44px] px-5 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                                >
                                    <RefreshCw size={14} className={verificationEnCours ? 'animate-spin' : ''} aria-hidden="true" />
                                    Vérifier la version servie maintenant
                                </button>
                                {verdictApres && (
                                    <p role="status" data-testid="restauration-verdict" data-verdict={verdictApres.verdict} className={`rounded-2xl border px-4 py-3 text-xs font-bold flex items-start gap-2 ${TON[verdictApres.verdict]}`}>
                                        <IconeVerdict verdict={verdictApres.verdict} />
                                        <span>{verdictApres.message} <span className="font-normal opacity-80">(vérifié à {heureCourte(verdictApres.le)})</span></span>
                                    </p>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            )}

            {/* ── Journal des ordres ── */}
            <div data-testid="restauration-journal" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><History size={16} className="text-slate-600" aria-hidden="true" />Ordres de restauration ({ordres.length})</h3>
                    <span className="text-[11px] text-slate-500">{journalPartage === null ? 'journal : lecture…' : journalPartage ? 'journal partagé de la plateforme' : 'journal partagé indisponible — copie locale'}</span>
                </div>
                {ordres.length === 0 ? (
                    <p className="text-xs text-slate-500">Aucun ordre de restauration enregistré.</p>
                ) : (
                    <ul className="space-y-2 list-none p-0 m-0">
                        {ordres.map((o) => (
                            <li key={o.id} data-testid={`restauration-ordre-${o.id}`} className="rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-800 space-y-0.5">
                                <p className="font-bold">{o.id} · {formaterUtc(o.creeLe)} · {o.par.nom}{o.par.email ? ` (${o.par.email})` : ''}</p>
                                <p>Cible {o.cible.version} (commit {commitCourt(o.cible.commit)}, PR #{o.cible.pr ?? '?'}) · servie avant : {o.servieAvant.version ?? 'non identifiée'}</p>
                                <p className="text-slate-600">Motif : {o.motif}</p>
                                <p className={`inline-block rounded-full border px-2 py-0.5 font-bold ${o.statut === 'verifie-vert' ? TON.vert : o.statut === 'verifie-rouge' ? TON.rouge : o.statut === 'verifie-orange' ? TON.orange : TON.blanc}`}>
                                    {o.statut === 'ordonne' ? 'Ordonné — publication et vérification à faire' : o.statut === 'verifie-vert' ? `Vérifié vert le ${formaterUtc(o.verification!.le)}` : o.statut === 'verifie-orange' ? `Vérifié sans conclusion le ${formaterUtc(o.verification!.le)}` : `Vérifié rouge le ${formaterUtc(o.verification!.le)}`}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
};
