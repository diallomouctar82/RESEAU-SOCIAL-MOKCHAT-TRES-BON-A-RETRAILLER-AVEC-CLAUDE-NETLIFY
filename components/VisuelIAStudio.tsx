import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Sparkles, SlidersHorizontal, Image as ImageIcon, Video, X, ScanFace, Sun, Clapperboard, Type, Film,
    Wand2, RotateCcw, Undo2, CheckCircle2, Loader2, ArrowUp, ChevronDown, Focus,
} from 'lucide-react';
import { analyzeImage, generateImage } from '../services/aiGateway';
import {
    CADRAGES, INTENTIONS, LOOKS, POLICES, REGLAGES_DEFAUT, SYSTEME_PROMPT_REGLAGES,
    ReglagesVisuel, dessinerTexte, dimensionsSortie, filtreCss, normaliserReglages, reglagesDepuisReponse, reglagesModifies, rendreImage,
} from '../services/visuelIA';

/**
 * Visuel IA — le studio de retouche intégré à la publication (DEC-2026-059,
 * variante B10 « Plein écran sombre » choisie par la Direction).
 *
 * Ce qu'il fait réellement :
 *   - Photo : les réglages (visage et cheveux, lumière, cinéma, texte,
 *     cadrage) sont rendus par un vrai pipeline de pixels (services/visuelIA)
 *     sur un canvas, en aperçu puis à pleine résolution à l'insertion. Le
 *     fichier inséré remplace la photo jointe ; la publication l'envoie comme
 *     n'importe quelle photo.
 *   - Prompt : la consigne et l'image sont envoyées à la passerelle IA
 *     (analyzeImage) qui renvoie des RÉGLAGES — l'image n'est jamais réinventée
 *     dans le dos du membre. Sans photo, « Générer depuis le texte » appelle
 *     generateImage (fournisseur actif de la plateforme).
 *   - Vidéo : aperçu avec les mêmes réglages (filtre CSS, texte), début / fin
 *     et vitesse ; à l'insertion, la vidéo est ré-encodée par le navigateur
 *     (canvas + MediaRecorder) quand il le permet ; sinon l'écran le dit et
 *     la vidéo d'origine reste telle quelle.
 *
 * Accessibilité : portail au-dessus de toute la coquille, racine inerte,
 * focus piégé, Échap ferme. Le grand Studio Créatif reste un lien discret.
 */

export interface ResultatVisuel {
    image?: { url: string; fichier: File };
    video?: { url: string; fichier: File };
}

interface VisuelIAStudioProps {
    ouvert: boolean;
    onFermer: () => void;
    image: string | null;
    video: string | null;
    texteDuPost: string;
    onInserer: (resultat: ResultatVisuel) => void;
    onOuvrirStudioCreatif?: () => void;
}

type Section = 'visage' | 'lumiere' | 'cinema' | 'texte' | 'video';
type Source = 'photo' | 'video';

const FOCALISABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const SECTIONS: { cle: Section; libelle: string; Icone: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { cle: 'visage', libelle: 'Visage & cheveux', Icone: ScanFace },
    { cle: 'lumiere', libelle: 'Lumière', Icone: Sun },
    { cle: 'cinema', libelle: 'Cinéma', Icone: Clapperboard },
    { cle: 'texte', libelle: 'Texte', Icone: Type },
    { cle: 'video', libelle: 'Vidéo', Icone: Film },
];
const APERCU_MAX = 720;
const EXPORT_MAX = 1600;
const ANALYSE_MAX = 512;

const racineApplication = () => (typeof document === 'undefined' ? null : document.getElementById('root'));

function chargerImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resoudre, rejeter) => {
        const img = new Image();
        if (!url.startsWith('blob:') && !url.startsWith('data:')) img.crossOrigin = 'anonymous';
        img.onload = () => resoudre(img);
        img.onerror = () => rejeter(new Error("L'image n'a pas pu être chargée."));
        img.src = url;
    });
}

function canvasEnFichier(canvas: HTMLCanvasElement, nom: string): Promise<File> {
    return new Promise((resoudre, rejeter) => {
        try {
            canvas.toBlob((blob) => {
                if (!blob) return rejeter(new Error("Le navigateur n'a pas pu produire l'image."));
                resoudre(new File([blob], nom, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.92);
        } catch (e) {
            rejeter(e instanceof Error ? e : new Error(String(e)));
        }
    });
}

const Curseur: React.FC<{ nom: string; valeur: number; min: number; max: number; onChange: (v: number) => void; unite?: string }> = ({ nom, valeur, min, max, onChange, unite }) => (
    <label className="vis-curseur">
        <span><b>{nom}</b><i>{valeur}{unite || ''}</i></span>
        <input type="range" min={min} max={max} value={valeur} aria-label={nom} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
);

export const VisuelIAStudio: React.FC<VisuelIAStudioProps> = ({ ouvert, onFermer, image, video, texteDuPost, onInserer, onOuvrirStudioCreatif }) => {
    const [source, setSource] = useState<Source>('photo');
    const [mode, setMode] = useState<'prompt' | 'manuel'>('prompt');
    const [section, setSection] = useState<Section>('visage');
    const [reglages, setReglages] = useState<ReglagesVisuel>(REGLAGES_DEFAUT);
    const [historique, setHistorique] = useState<ReglagesVisuel[]>([]);
    const [avant, setAvant] = useState(false);
    const [consigne, setConsigne] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(image);
    const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
    const [occupe, setOccupe] = useState<'' | 'analyse' | 'generation' | 'export'>('');
    const [message, setMessage] = useState<{ type: 'info' | 'erreur' | 'ok'; texte: string } | null>(null);
    const feuilleRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const rendezVous = useRef<number | null>(null);

    /* ouverture : source par défaut, racine inerte, focus, Échap */
    useEffect(() => {
        if (!ouvert) return;
        setSource(video && !image ? 'video' : 'photo');
        setImageUrl(image);
        setReglages(REGLAGES_DEFAUT);
        setHistorique([]);
        setAvant(false);
        setMessage(null);
        setMode('prompt');
        setSection('visage');
        const racine = racineApplication();
        racine?.setAttribute('inert', '');
        const t = window.setTimeout(() => {
            const premier = feuilleRef.current?.querySelector<HTMLElement>('.vis-fermer');
            premier?.focus();
        }, 30);
        const surTouche = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && feuilleRef.current?.contains(document.activeElement)) { e.stopPropagation(); onFermer(); }
        };
        document.addEventListener('keydown', surTouche, true);
        return () => {
            window.clearTimeout(t);
            document.removeEventListener('keydown', surTouche, true);
            racine?.removeAttribute('inert');
        };
    }, [ouvert, image, video, onFermer]);

    /* chargement de l'image source */
    useEffect(() => {
        if (!ouvert || !imageUrl) { setImageEl(null); return; }
        let vivant = true;
        chargerImage(imageUrl).then((img) => { if (vivant) setImageEl(img); }).catch((e: Error) => { if (vivant) { setImageEl(null); setMessage({ type: 'erreur', texte: e.message }); } });
        return () => { vivant = false; };
    }, [ouvert, imageUrl]);

    /* aperçu : rendu canvas, léger et différé */
    const rendreApercu = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageEl) return;
        const r = avant ? { ...REGLAGES_DEFAUT, cadrage: reglages.cadrage } : reglages;
        const ok = rendreImage(imageEl, imageEl.naturalWidth || imageEl.width, imageEl.naturalHeight || imageEl.height, r, canvas, APERCU_MAX);
        if (!ok) setMessage({ type: 'erreur', texte: "Ce navigateur ne permet pas le rendu de l'aperçu (canvas indisponible)." });
    }, [imageEl, reglages, avant]);
    useEffect(() => {
        if (!ouvert || source !== 'photo') return;
        if (rendezVous.current) window.clearTimeout(rendezVous.current);
        rendezVous.current = window.setTimeout(rendreApercu, 40);
        return () => { if (rendezVous.current) window.clearTimeout(rendezVous.current); };
    }, [ouvert, source, rendreApercu]);

    const pieger = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Tab' || !feuilleRef.current) return;
        const cibles = Array.from(feuilleRef.current.querySelectorAll(FOCALISABLES)) as HTMLElement[];
        if (!cibles.length) return;
        const premier = cibles[0], dernier = cibles[cibles.length - 1];
        if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
        else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    };

    const appliquer = (partiel: Partial<ReglagesVisuel>) => {
        setReglages((courant) => { setHistorique((h) => [...h.slice(-19), courant]); return normaliserReglages({ ...courant, ...partiel }, courant); });
        setAvant(false);
    };
    const annuler = () => {
        setHistorique((h) => { if (!h.length) return h; setReglages(h[h.length - 1]); return h.slice(0, -1); });
    };
    const reinitialiser = () => { setHistorique((h) => [...h.slice(-19), reglages]); setReglages(REGLAGES_DEFAUT); setAvant(false); };

    /* mode Prompt : l'IA renvoie des réglages ; sans photo, elle génère une image */
    const lancerPrompt = async () => {
        const texte = consigne.trim() || texteDuPost.trim();
        if (!texte) { setMessage({ type: 'info', texte: 'Écrivez une consigne (par exemple « portrait pro, lumière dorée, titre en haut »).' }); return; }
        setMessage(null);
        if (source === 'photo' && imageEl) {
            setOccupe('analyse');
            try {
                const petit = document.createElement('canvas');
                const dims = dimensionsSortie(imageEl.naturalWidth || imageEl.width, imageEl.naturalHeight || imageEl.height, 'original', ANALYSE_MAX);
                petit.width = dims.largeur; petit.height = dims.hauteur;
                const ctx = petit.getContext('2d');
                if (!ctx) throw new Error("Ce navigateur ne permet pas de préparer l'image pour l'analyse.");
                ctx.drawImage(imageEl, 0, 0, dims.largeur, dims.hauteur);
                const base64 = petit.toDataURL('image/jpeg', 0.8).split(',')[1];
                const reponse = await analyzeImage(base64, 'image/jpeg', `Consigne du membre : ${texte}`, { jsonMode: true, systemInstruction: SYSTEME_PROMPT_REGLAGES });
                const nouveaux = reglagesDepuisReponse(reponse, reglages);
                if (!nouveaux) throw new Error("L'IA n'a pas renvoyé de réglages exploitables. Réessayez ou passez en réglages manuels.");
                appliquer(nouveaux);
                setMessage({ type: 'ok', texte: 'Réglages appliqués par l\'IA — ajustez-les à la main si besoin, puis insérez.' });
            } catch (e) {
                setMessage({ type: 'erreur', texte: e instanceof Error ? e.message : "L'analyse a échoué." });
            } finally { setOccupe(''); }
            return;
        }
        if (source === 'photo') {
            setOccupe('generation');
            try {
                const url = await generateImage(texte);
                setImageUrl(url);
                setMessage({ type: 'ok', texte: 'Image générée. Vous pouvez la retoucher, puis l\'insérer.' });
            } catch (e) {
                setMessage({ type: 'erreur', texte: e instanceof Error ? e.message : 'La génération a échoué.' });
            } finally { setOccupe(''); }
            return;
        }
        setMessage({ type: 'info', texte: 'Pour la vidéo, le prompt n\'est pas encore relié à l\'IA : utilisez les réglages manuels (lumière, cinéma, texte, début / fin, vitesse).' });
    };

    /* insertion : photo rendue à pleine résolution, vidéo ré-encodée si possible */
    const inserer = async () => {
        setMessage(null);
        if (source === 'photo') {
            if (!imageEl) { setMessage({ type: 'info', texte: 'Ajoutez une photo ou générez-en une depuis le texte.' }); return; }
            setOccupe('export');
            try {
                const canvas = document.createElement('canvas');
                const ok = rendreImage(imageEl, imageEl.naturalWidth || imageEl.width, imageEl.naturalHeight || imageEl.height, reglages, canvas, EXPORT_MAX);
                if (!ok) throw new Error("Ce navigateur ne permet pas le rendu de l'image (canvas indisponible).");
                const fichier = await canvasEnFichier(canvas, 'visuel-ia.jpg');
                onInserer({ image: { url: URL.createObjectURL(fichier), fichier } });
                onFermer();
            } catch (e) {
                const msg = e instanceof Error ? e.message : "L'export a échoué.";
                setMessage({ type: 'erreur', texte: /tainted|insecure|SecurityError/i.test(msg) ? "Cette image vient d'un site qui n'autorise pas la retouche dans le navigateur. Enregistrez-la puis ajoutez-la avec « Photo »." : msg });
            } finally { setOccupe(''); }
            return;
        }
        const v = videoRef.current;
        if (!v || !video) { setMessage({ type: 'info', texte: 'Ajoutez une vidéo avec « Vidéo » pour la retoucher.' }); return; }
        const canvas = document.createElement('canvas');
        const capture = (canvas as unknown as { captureStream?: (fps?: number) => MediaStream }).captureStream;
        if (typeof capture !== 'function' || typeof MediaRecorder === 'undefined') {
            setMessage({ type: 'erreur', texte: "Ce navigateur ne sait pas ré-encoder la vidéo. La vidéo d'origine restera telle quelle ; les réglages ne sont pas appliqués." });
            return;
        }
        setOccupe('export');
        try {
            const dims = dimensionsSortie(v.videoWidth, v.videoHeight, reglages.cadrage, 1280);
            canvas.width = dims.largeur; canvas.height = dims.hauteur;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas indisponible.');
            const flux = capture.call(canvas, 30);
            const fluxSource = (v as unknown as { captureStream?: () => MediaStream }).captureStream?.();
            fluxSource?.getAudioTracks().forEach((piste) => flux.addTrack(piste));
            const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
            const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
            const enregistreur = new MediaRecorder(flux, mime ? { mimeType: mime } : undefined);
            const morceaux: Blob[] = [];
            enregistreur.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
            const fin = reglages.fin ?? v.duration;
            v.pause();
            v.currentTime = Math.min(reglages.debut, Math.max(0, v.duration - 0.1));
            await new Promise<void>((res) => { const h = () => { v.removeEventListener('seeked', h); res(); }; v.addEventListener('seeked', h); });
            v.playbackRate = reglages.vitesse / 100;
            const filtre = filtreCss(reglages);
            const termine = new Promise<void>((res) => { enregistreur.onstop = () => res(); });
            enregistreur.start(250);
            await v.play();
            await new Promise<void>((res) => {
                const boucle = () => {
                    if (v.ended || v.currentTime >= fin) { res(); return; }
                    try { (ctx as CanvasRenderingContext2D & { filter: string }).filter = filtre; } catch { /* filtre non pris en charge : image brute */ }
                    ctx.drawImage(v, dims.source.sx, dims.source.sy, dims.source.sw, dims.source.sh, 0, 0, dims.largeur, dims.hauteur);
                    (ctx as CanvasRenderingContext2D & { filter: string }).filter = 'none';
                    dessinerTexte(ctx, dims.largeur, dims.hauteur, reglages);
                    requestAnimationFrame(boucle);
                };
                boucle();
            });
            v.pause();
            enregistreur.stop();
            await termine;
            const blob = new Blob(morceaux, { type: mime || 'video/webm' });
            if (!blob.size) throw new Error("Le navigateur n'a rien enregistré.");
            const fichier = new File([blob], 'visuel-ia.webm', { type: blob.type });
            onInserer({ video: { url: URL.createObjectURL(fichier), fichier } });
            onFermer();
        } catch (e) {
            setMessage({ type: 'erreur', texte: e instanceof Error ? e.message : "L'export vidéo a échoué." });
        } finally { setOccupe(''); }
    };

    const filtreVideo = useMemo(() => (avant ? 'none' : filtreCss(reglages)), [avant, reglages]);
    const police = POLICES[reglages.policeTexte];

    if (!ouvert) return null;
    const portail = typeof document !== 'undefined' ? document.body : null;
    const modifie = reglagesModifies(reglages);

    const feuille = (
        <div className="vis-voile" data-testid="visuel-ia-studio">
            <div className="vis-feuille" role="dialog" aria-modal="true" aria-label="Visuel IA — studio de retouche" ref={feuilleRef} onKeyDown={pieger}>
                <header className="vis-tete">
                    <h2><span className="vis-orbe-or" aria-hidden="true"><Sparkles size={13} /></span>Visuel IA <small>· retouche dans la publication</small></h2>
                    <div className="vis-seg" role="group" aria-label="Source">
                        <button type="button" aria-pressed={source === 'photo'} onClick={() => setSource('photo')}><ImageIcon size={13} />Photo</button>
                        <button type="button" aria-pressed={source === 'video'} onClick={() => setSource('video')} disabled={!video} title={video ? undefined : 'Ajoutez une vidéo avec « Vidéo »'}><Video size={13} />Vidéo</button>
                    </div>
                    <button type="button" className="vis-fermer" aria-label="Fermer le studio" onClick={onFermer}><X size={16} /></button>
                </header>

                <div className="vis-apercu" data-source={source}>
                    {source === 'photo' ? (
                        imageEl ? (
                            <canvas ref={canvasRef} className="vis-canvas" aria-label="Aperçu de la retouche" />
                        ) : (
                            <div className="vis-vide">
                                {imageUrl ? <Loader2 size={22} className="animate-spin" /> : <ImageIcon size={26} />}
                                <p>{imageUrl ? 'Chargement de la photo…' : 'Aucune photo jointe. Décrivez le visuel voulu et générez-le depuis le texte, ou fermez et ajoutez une photo.'}</p>
                            </div>
                        )
                    ) : (
                        <div className="vis-video-cadre">
                            <video ref={videoRef} src={video || undefined} controls playsInline preload="metadata" className="vis-video" style={{ filter: filtreVideo }} />
                            {(reglages.titre || reglages.sousTitre) && !avant && (
                                <div className={`vis-titre-video pos-${reglages.positionTexte}`} style={{ fontFamily: police.css, fontWeight: police.poids, fontSize: `${0.8 + reglages.tailleTexte / 60}em` }}>
                                    <b>{reglages.titre}</b>{reglages.sousTitre && <small>{reglages.sousTitre}</small>}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="vis-avap" role="group" aria-label="Avant ou après">
                        <button type="button" aria-pressed={avant} onClick={() => setAvant(true)}>Avant</button>
                        <button type="button" aria-pressed={!avant} onClick={() => setAvant(false)}>Après</button>
                    </div>
                    <span className="vis-badge">{source === 'video' ? 'vidéo' : CADRAGES[reglages.cadrage].libelle}{reglages.look !== 'naturel' ? ` · ${LOOKS[reglages.look].libelle}` : ''}</span>
                </div>

                <nav className="vis-outils" aria-label="Familles de réglages">
                    {SECTIONS.map(({ cle, libelle, Icone }) => (
                        <button key={cle} type="button" aria-pressed={section === cle} onClick={() => { setSection(cle); setMode('manuel'); }} disabled={cle === 'video' && source !== 'video'}>
                            <Icone size={18} strokeWidth={1.9} /><span>{libelle}</span>
                        </button>
                    ))}
                </nav>

                <div className="vis-seg vis-modes" role="group" aria-label="Mode">
                    <button type="button" aria-pressed={mode === 'prompt'} onClick={() => setMode('prompt')}><Sparkles size={13} />Prompt</button>
                    <button type="button" aria-pressed={mode === 'manuel'} onClick={() => setMode('manuel')}><SlidersHorizontal size={13} />Réglages manuels</button>
                </div>

                {message && <p className={`vis-message ${message.type}`} role={message.type === 'erreur' ? 'alert' : 'status'}>{message.texte}</p>}

                {mode === 'prompt' ? (
                    <section className="vis-bloc vis-bloc-ia" aria-label="Prompt">
                        <h3><Sparkles size={13} />Prompt <span>une phrase suffit</span></h3>
                        <div className="vis-prompt">
                            <input type="text" value={consigne} onChange={(e) => setConsigne(e.target.value)} placeholder={source === 'photo' && imageEl ? 'Peau douce, lumière dorée, titre en haut, look cinéma' : 'Décrivez le visuel à générer'} aria-label="Consigne pour l'IA" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lancerPrompt(); } }} />
                            <button type="button" onClick={() => void lancerPrompt()} disabled={!!occupe}>
                                {occupe === 'analyse' || occupe === 'generation' ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                {source === 'photo' && !imageEl ? 'Générer depuis le texte' : 'Appliquer'}
                            </button>
                        </div>
                        <div className="vis-intentions">
                            {INTENTIONS.map((it) => (
                                <button key={it.cle} type="button" onClick={() => { appliquer(it.reglages); setMessage(null); }} disabled={source === 'photo' && !imageEl}>{it.libelle}</button>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section className="vis-bloc" aria-label={SECTIONS.find((s) => s.cle === section)?.libelle}>
                        {section === 'visage' && (
                            <>
                                <h3><ScanFace size={13} />Visage & cheveux <span>adoucissement, éclat, brillance</span></h3>
                                <div className="vis-curseurs">
                                    <Curseur nom="Peau douce" valeur={reglages.peauDouce} min={0} max={100} onChange={(v) => appliquer({ peauDouce: v })} />
                                    <Curseur nom="Éclat du regard" valeur={reglages.eclat} min={0} max={100} onChange={(v) => appliquer({ eclat: v })} />
                                    <Curseur nom="Brillance cheveux (tons foncés)" valeur={reglages.brillanceCheveux} min={0} max={100} onChange={(v) => appliquer({ brillanceCheveux: v })} />
                                    <Curseur nom="Netteté" valeur={reglages.nettete} min={0} max={100} onChange={(v) => appliquer({ nettete: v })} />
                                </div>
                                <p className="vis-note">Ces réglages s'appliquent à toute l'image, en douceur. Pour viser une zone précise (yeux, dents, mèche), décrivez-la dans le Prompt : l'IA regarde la photo et règle pour elle.</p>
                            </>
                        )}
                        {section === 'lumiere' && (
                            <>
                                <h3><Sun size={13} />Lumière <span>exposition, ombres, température</span></h3>
                                <div className="vis-curseurs">
                                    <Curseur nom="Exposition" valeur={reglages.exposition} min={-50} max={50} onChange={(v) => appliquer({ exposition: v })} />
                                    <Curseur nom="Contraste" valeur={reglages.contraste} min={-50} max={50} onChange={(v) => appliquer({ contraste: v })} />
                                    <Curseur nom="Ombres" valeur={reglages.ombres} min={-50} max={50} onChange={(v) => appliquer({ ombres: v })} />
                                    <Curseur nom="Hautes lumières" valeur={reglages.hautesLumieres} min={-50} max={50} onChange={(v) => appliquer({ hautesLumieres: v })} />
                                    <Curseur nom="Température" valeur={reglages.temperature} min={-50} max={50} onChange={(v) => appliquer({ temperature: v })} />
                                    <Curseur nom="Teinte" valeur={reglages.teinte} min={-50} max={50} onChange={(v) => appliquer({ teinte: v })} />
                                    <Curseur nom="Saturation" valeur={reglages.saturation} min={-50} max={50} onChange={(v) => appliquer({ saturation: v })} />
                                </div>
                            </>
                        )}
                        {section === 'cinema' && (
                            <>
                                <h3><Clapperboard size={13} />Cinéma <span>look, grain, vignette, flou des bords, cadrage</span></h3>
                                <div className="vis-puces" role="group" aria-label="Look">
                                    {(Object.keys(LOOKS) as (keyof typeof LOOKS)[]).map((k) => (
                                        <button key={k} type="button" aria-pressed={reglages.look === k} onClick={() => appliquer({ look: k })}><i style={{ background: LOOKS[k].couleur }} />{LOOKS[k].libelle}</button>
                                    ))}
                                </div>
                                <div className="vis-curseurs">
                                    <Curseur nom="Grain" valeur={reglages.grain} min={0} max={100} onChange={(v) => appliquer({ grain: v })} />
                                    <Curseur nom="Vignette" valeur={reglages.vignette} min={0} max={100} onChange={(v) => appliquer({ vignette: v })} />
                                    <Curseur nom="Flou des bords" valeur={reglages.flouBords} min={0} max={100} onChange={(v) => appliquer({ flouBords: v })} />
                                </div>
                                <div className="vis-puces" role="group" aria-label="Cadrage">
                                    {(Object.keys(CADRAGES) as (keyof typeof CADRAGES)[]).map((k) => (
                                        <button key={k} type="button" aria-pressed={reglages.cadrage === k} onClick={() => appliquer({ cadrage: k })}>{CADRAGES[k].libelle}</button>
                                    ))}
                                </div>
                            </>
                        )}
                        {section === 'texte' && (
                            <>
                                <h3><Type size={13} />Texte <span>titre, sous-titre, police, position</span></h3>
                                <div className="vis-texte">
                                    <input type="text" value={reglages.titre} maxLength={120} placeholder="Titre sur l'image" aria-label="Titre sur l'image" onChange={(e) => appliquer({ titre: e.target.value })} />
                                    <input type="text" value={reglages.sousTitre} maxLength={160} placeholder="Sous-titre (facultatif)" aria-label="Sous-titre" onChange={(e) => appliquer({ sousTitre: e.target.value })} />
                                </div>
                                <div className="vis-puces" role="group" aria-label="Police">
                                    {(Object.keys(POLICES) as (keyof typeof POLICES)[]).map((k) => (
                                        <button key={k} type="button" aria-pressed={reglages.policeTexte === k} onClick={() => appliquer({ policeTexte: k })}>{POLICES[k].libelle}</button>
                                    ))}
                                </div>
                                <div className="vis-puces" role="group" aria-label="Position">
                                    <button type="button" aria-pressed={reglages.positionTexte === 'bas'} onClick={() => appliquer({ positionTexte: 'bas' })}><ChevronDown size={13} />Bas</button>
                                    <button type="button" aria-pressed={reglages.positionTexte === 'haut'} onClick={() => appliquer({ positionTexte: 'haut' })}><ArrowUp size={13} />Haut</button>
                                    <button type="button" aria-pressed={reglages.positionTexte === 'centre'} onClick={() => appliquer({ positionTexte: 'centre' })}><Focus size={13} />Centre</button>
                                </div>
                                <div className="vis-curseurs">
                                    <Curseur nom="Taille du texte" valeur={reglages.tailleTexte} min={0} max={100} onChange={(v) => appliquer({ tailleTexte: v })} />
                                </div>
                            </>
                        )}
                        {section === 'video' && (
                            <>
                                <h3><Film size={13} />Vidéo <span>début, fin, vitesse</span></h3>
                                <div className="vis-curseurs">
                                    <Curseur nom="Début (s)" valeur={reglages.debut} min={0} max={Math.max(1, Math.floor(videoRef.current?.duration || 60))} onChange={(v) => appliquer({ debut: v })} />
                                    <Curseur nom="Fin (s)" valeur={reglages.fin ?? Math.floor(videoRef.current?.duration || 60)} min={1} max={Math.max(1, Math.floor(videoRef.current?.duration || 60))} onChange={(v) => appliquer({ fin: v })} />
                                    <Curseur nom="Vitesse" valeur={reglages.vitesse} min={50} max={200} unite=" %" onChange={(v) => appliquer({ vitesse: v })} />
                                </div>
                                <p className="vis-note">À l'insertion, la vidéo est ré-encodée par votre navigateur avec la lumière, le look, le texte, le début / la fin et la vitesse choisis. Si le navigateur ne le permet pas, l'écran le dira et la vidéo d'origine restera intacte.</p>
                            </>
                        )}
                    </section>
                )}

                <footer className="vis-pied">
                    <button type="button" className="vis-secondaire" onClick={reinitialiser} disabled={!modifie}><RotateCcw size={14} />Réinitialiser</button>
                    <button type="button" className="vis-secondaire" onClick={annuler} disabled={!historique.length}><Undo2 size={14} />Annuler</button>
                    {onOuvrirStudioCreatif && <button type="button" className="vis-lien" onClick={() => { onFermer(); onOuvrirStudioCreatif(); }}>Besoin de plus ? Studio Créatif</button>}
                    <button type="button" className="vis-inserer" onClick={() => void inserer()} disabled={!!occupe || (source === 'photo' && !imageEl) || (source === 'video' && !video)}>
                        {occupe === 'export' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Insérer dans la publication
                    </button>
                </footer>
            </div>
        </div>
    );
    return portail ? createPortal(feuille, portail) : feuille;
};
