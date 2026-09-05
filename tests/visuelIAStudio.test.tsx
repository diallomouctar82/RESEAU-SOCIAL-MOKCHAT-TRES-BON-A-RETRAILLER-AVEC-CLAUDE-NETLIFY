import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * DEC-2026-061 — le studio « Visuel IA » intégré à la publication (variante
 * B10 « Plein écran sombre » choisie par la Direction).
 *
 * Ce que ces tests gardent :
 *   - deux modes obligatoires, Prompt et Réglages manuels, cinq familles
 *     (visage & cheveux, lumière, cinéma, texte, vidéo) ;
 *   - en mode Prompt l'IA renvoie des RÉGLAGES (analyzeImage, JSON seul) —
 *     jamais une image réinventée ; sans photo, l'image est générée par la
 *     passerelle (generateImage) ;
 *   - l'insertion renvoie un vrai fichier JPEG rendu à pleine résolution ;
 *   - un canvas « souillé » ou un navigateur sans ré-encodage vidéo
 *     produisent un message honnête, jamais un faux succès ;
 *   - portail, racine inerte, focus, Échap, lien discret vers le grand
 *     Studio Créatif.
 *
 * jsdom n'a pas de canvas ni de chargement d'images : on remplace les deux
 * par des doublures minimales qui enregistrent ce qui leur est demandé.
 */

vi.mock('../services/aiGateway', () => ({
  analyzeImage: vi.fn(async () => '{"peauDouce": 30, "look": "golden"}'),
  generateImage: vi.fn(async () => 'https://exemple.test/genere.png'),
  generateText: vi.fn(async () => ''),
  generateJSON: vi.fn(async () => null),
}));

import { analyzeImage, generateImage } from '../services/aiGateway';
import { SYSTEME_PROMPT_REGLAGES } from '../services/visuelIA';
import { VisuelIAStudio, type ResultatVisuel } from '../components/VisuelIAStudio';

const PHOTO = 'blob:moknet/photo';
const VIDEO = 'blob:moknet/video';

class ImageFactice {
  naturalWidth = 320; naturalHeight = 240; width = 320; height = 240;
  crossOrigin = '';
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  private _src = '';
  get src() { return this._src; }
  set src(v: string) {
    this._src = v;
    setTimeout(() => (v.includes('casse') ? this.onerror?.() : this.onload?.()), 0);
  }
}

const journal = { putImageData: 0, drawImage: 0, fillText: 0 };
function contexteFactice(): CanvasRenderingContext2D {
  const ctx = {
    drawImage: () => { journal.drawImage++; },
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(128), width: w, height: h }),
    putImageData: () => { journal.putImageData++; },
    fillText: () => { journal.fillText++; },
    measureText: (t: string) => ({ width: t.length * 8 }),
    save: () => {}, restore: () => {}, fillRect: () => {},
    font: '', fillStyle: '', textBaseline: '', shadowColor: '', shadowBlur: 0, shadowOffsetY: 0, filter: 'none',
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

let toBlobLance: Error | null = null;
beforeEach(() => {
  journal.putImageData = 0; journal.drawImage = 0; journal.fillText = 0;
  toBlobLance = null;
  vi.stubGlobal('Image', ImageFactice);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => contexteFactice() as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => 'data:image/jpeg;base64,QUJD');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb: BlobCallback) {
    if (toBlobLance) throw toBlobLance;
    cb(new Blob(['jpeg'], { type: 'image/jpeg' }));
  });
  if (!('createObjectURL' in URL)) Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: () => '' });
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob:moknet/rendu');
  vi.mocked(analyzeImage).mockClear();
  vi.mocked(generateImage).mockClear();
  if (!document.getElementById('root')) { const racine = document.createElement('div'); racine.id = 'root'; document.body.appendChild(racine); }
});
afterEach(() => { vi.unstubAllGlobals(); });

function monter(surcharge: Partial<React.ComponentProps<typeof VisuelIAStudio>> = {}) {
  const onFermer = vi.fn();
  const onInserer = vi.fn<(r: ResultatVisuel) => void>();
  const props = { ouvert: true, onFermer, image: PHOTO, video: null, texteDuPost: 'Mon texte de publication', onInserer, ...surcharge };
  const r = render(<VisuelIAStudio {...props} />);
  return { ...r, props, onFermer, onInserer, dialogue: () => screen.getByRole('dialog', { name: 'Visuel IA — studio de retouche' }) };
}
const attendreCanvas = () => waitFor(() => expect(document.querySelector('canvas.vis-canvas')).not.toBeNull());
const curseur = (nom: string) => screen.getByRole('slider', { name: nom }) as HTMLInputElement;
const bouton = (nom: string | RegExp) => screen.getByRole('button', { name: nom });

describe('studio « Visuel IA » (DEC-2026-061, B10)', () => {
  it('n’existe pas fermé ; ouvert, il vit dans un portail au-dessus de tout, rend la racine inerte et prend le focus', async () => {
    const { rerender, props } = monter({ ouvert: false });
    expect(screen.queryByTestId('visuel-ia-studio')).toBeNull();
    expect(document.getElementById('root')?.hasAttribute('inert')).toBe(false);

    rerender(<VisuelIAStudio {...props} ouvert />);
    const voile = screen.getByTestId('visuel-ia-studio');
    expect(voile.parentElement).toBe(document.body);
    const dialogue = screen.getByRole('dialog', { name: 'Visuel IA — studio de retouche' });
    expect(dialogue.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById('root')?.hasAttribute('inert')).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(dialogue.querySelector('.vis-fermer')));

    rerender(<VisuelIAStudio {...props} ouvert={false} />);
    expect(document.getElementById('root')?.hasAttribute('inert')).toBe(false);
  });

  it('offre les deux modes et les cinq familles ; « Vidéo » attend une vidéo ; une famille bascule en réglages manuels', async () => {
    monter();
    await attendreCanvas();
    const modes = within(screen.getByRole('group', { name: 'Mode' })).getAllByRole('button');
    expect(modes.map((b) => b.textContent)).toEqual(['Prompt', 'Réglages manuels']);
    expect(modes[0].getAttribute('aria-pressed')).toBe('true');
    expect(modes[1].getAttribute('aria-pressed')).toBe('false');

    const familles = within(screen.getByRole('navigation', { name: 'Familles de réglages' })).getAllByRole('button');
    expect(familles.map((b) => b.textContent)).toEqual(['Visage & cheveux', 'Lumière', 'Cinéma', 'Texte', 'Vidéo']);
    expect((familles[4] as HTMLButtonElement).disabled).toBe(true);
    expect(within(screen.getByRole('group', { name: 'Source' })).getByRole('button', { name: 'Vidéo' })).toBeDisabled();

    fireEvent.click(familles[1]);
    expect(modes[1].getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('slider').map((s) => s.getAttribute('aria-label'))).toEqual(['Exposition', 'Contraste', 'Ombres', 'Hautes lumières', 'Température', 'Teinte', 'Saturation']);
    fireEvent.click(familles[0]);
    expect(screen.getAllByRole('slider').map((s) => s.getAttribute('aria-label'))).toEqual(['Peau douce', 'Éclat du regard', 'Brillance cheveux (tons foncés)', 'Netteté']);
    expect(screen.getByText(/Pour viser une zone précise/)).toBeTruthy();
    fireEvent.click(familles[2]);
    expect(within(screen.getByRole('group', { name: 'Look' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Naturel', 'Teal & orange', 'Golden hour', 'Noir doux', 'Pellicule', 'Éditorial']);
    expect(within(screen.getByRole('group', { name: 'Cadrage' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Original', '1:1', '4:5', '16:9', '9:16']);
    fireEvent.click(familles[3]);
    expect(screen.getByRole('textbox', { name: "Titre sur l'image" })).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'Position' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Bas', 'Haut', 'Centre']);
  });

  it('réglages manuels : un curseur change le rendu, « Annuler » revient, « Réinitialiser » remet tout', async () => {
    monter();
    await attendreCanvas();
    await waitFor(() => expect(journal.drawImage).toBeGreaterThan(0));
    const dessinsAvant = journal.putImageData;
    expect(bouton(/Réinitialiser/)).toBeDisabled();
    expect(bouton(/^Annuler/)).toBeDisabled();

    fireEvent.click(bouton('Réglages manuels'));
    fireEvent.change(curseur('Peau douce'), { target: { value: '40' } });
    expect(curseur('Peau douce').value).toBe('40');
    await waitFor(() => expect(journal.putImageData).toBeGreaterThan(dessinsAvant));
    expect(bouton(/Réinitialiser/)).toBeEnabled();
    expect(bouton(/^Annuler/)).toBeEnabled();
    expect(screen.getByRole('group', { name: 'Avant ou après' })).toBeTruthy();

    fireEvent.click(bouton(/^Annuler/));
    expect(curseur('Peau douce').value).toBe('0');
    expect(bouton(/Réinitialiser/)).toBeDisabled();

    fireEvent.change(curseur('Netteté'), { target: { value: '25' } });
    fireEvent.change(curseur('Éclat du regard'), { target: { value: '15' } });
    fireEvent.click(bouton(/Réinitialiser/));
    expect(curseur('Netteté').value).toBe('0');
    expect(curseur('Éclat du regard').value).toBe('0');
    expect(bouton(/^Annuler/)).toBeEnabled();
  });

  it('mode Prompt avec photo : l’IA reçoit l’image réduite et la consigne, renvoie des réglages qui s’appliquent', async () => {
    monter();
    await attendreCanvas();
    fireEvent.change(screen.getByRole('textbox', { name: "Consigne pour l'IA" }), { target: { value: 'peau douce, lumière dorée' } });
    fireEvent.click(bouton('Appliquer'));
    await waitFor(() => expect(analyzeImage).toHaveBeenCalledTimes(1));
    expect(vi.mocked(analyzeImage).mock.calls[0][0]).toBe('QUJD');
    expect(vi.mocked(analyzeImage).mock.calls[0][1]).toBe('image/jpeg');
    expect(vi.mocked(analyzeImage).mock.calls[0][2]).toBe('Consigne du membre : peau douce, lumière dorée');
    expect(vi.mocked(analyzeImage).mock.calls[0][3]).toEqual({ jsonMode: true, systemInstruction: SYSTEME_PROMPT_REGLAGES });
    await screen.findByText(/Réglages appliqués par l'IA/);
    expect(generateImage).not.toHaveBeenCalled();

    fireEvent.click(bouton('Réglages manuels'));
    expect(curseur('Peau douce').value).toBe('30');
    fireEvent.click(bouton('Cinéma'));
    expect(within(screen.getByRole('group', { name: 'Look' })).getByRole('button', { name: 'Golden hour' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('mode Prompt : sans consigne, le texte de la publication sert ; une réponse inexploitable donne une erreur, pas un faux succès', async () => {
    vi.mocked(analyzeImage).mockResolvedValueOnce('Désolé, je ne peux pas.');
    monter();
    await attendreCanvas();
    fireEvent.click(bouton('Appliquer'));
    await waitFor(() => expect(analyzeImage).toHaveBeenCalledTimes(1));
    expect(vi.mocked(analyzeImage).mock.calls[0][2]).toBe('Consigne du membre : Mon texte de publication');
    const alerte = await screen.findByRole('alert');
    expect(alerte.textContent).toMatch(/n'a pas renvoyé de réglages exploitables/);
    expect(bouton(/Réinitialiser/)).toBeDisabled();
  });

  it('mode Prompt sans photo : « Générer depuis le texte » appelle la passerelle et la photo générée devient retouchable', async () => {
    const { onInserer } = monter({ image: null });
    expect(screen.getByText(/Aucune photo jointe/)).toBeTruthy();
    expect(bouton(/Insérer dans la publication/)).toBeDisabled();
    for (const b of screen.getAllByRole('button', { name: /Portrait pro|Lumière dorée|Look cinéma|Plus net|Éclaircir|Titre en haut/ })) expect(b).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: "Consigne pour l'IA" }), { target: { value: 'un campus au soleil' } });
    fireEvent.click(bouton('Générer depuis le texte'));
    await waitFor(() => expect(generateImage).toHaveBeenCalledWith('un campus au soleil'));
    expect(analyzeImage).not.toHaveBeenCalled();
    await attendreCanvas();
    await screen.findByText(/Image générée/);
    expect(bouton(/Insérer dans la publication/)).toBeEnabled();
    expect(bouton('Appliquer')).toBeTruthy();
    expect(onInserer).not.toHaveBeenCalled();
  });

  it('les intentions guidées appliquent leurs réglages d’un geste', async () => {
    monter();
    await attendreCanvas();
    fireEvent.click(bouton('Portrait pro'));
    fireEvent.click(bouton('Réglages manuels'));
    expect(curseur('Peau douce').value).toBe('30');
    expect(curseur('Éclat du regard').value).toBe('18');
    fireEvent.click(bouton('Prompt'));
    fireEvent.click(bouton('Titre en haut'));
    fireEvent.click(bouton('Texte'));
    expect(within(screen.getByRole('group', { name: 'Position' })).getByRole('button', { name: 'Haut' }).getAttribute('aria-pressed')).toBe('true');
    expect(curseur('Taille du texte').value).toBe('60');
  });

  it('insère un vrai fichier JPEG rendu à pleine résolution, puis se ferme', async () => {
    const { onInserer, onFermer } = monter();
    await attendreCanvas();
    fireEvent.click(bouton('Réglages manuels'));
    fireEvent.click(bouton('Texte'));
    fireEvent.change(screen.getByRole('textbox', { name: "Titre sur l'image" }), { target: { value: 'Bienvenue au campus' } });
    journal.fillText = 0;
    fireEvent.click(bouton(/Insérer dans la publication/));
    await waitFor(() => expect(onInserer).toHaveBeenCalledTimes(1));
    const resultat = onInserer.mock.calls[0][0];
    expect(resultat.video).toBeUndefined();
    expect(resultat.image?.url).toBe('blob:moknet/rendu');
    expect(resultat.image?.fichier).toBeInstanceOf(File);
    expect(resultat.image?.fichier.name).toBe('visuel-ia.jpg');
    expect(resultat.image?.fichier.type).toBe('image/jpeg');
    expect(journal.fillText).toBeGreaterThan(0);
    expect(onFermer).toHaveBeenCalledTimes(1);
  });

  it('une image d’un site qui interdit la lecture du canvas donne un message clair, sans rien insérer', async () => {
    toBlobLance = Object.assign(new Error('The operation is insecure.'), { name: 'SecurityError' });
    const { onInserer, onFermer } = monter({ image: 'https://images.exemple.test/photo.jpg' });
    await attendreCanvas();
    fireEvent.click(bouton(/Insérer dans la publication/));
    const alerte = await screen.findByRole('alert');
    expect(alerte.textContent).toMatch(/n'autorise pas la retouche dans le navigateur/);
    expect(onInserer).not.toHaveBeenCalled();
    expect(onFermer).not.toHaveBeenCalled();
  });

  it('une photo qui ne charge pas est dite, et l’insertion reste impossible', async () => {
    monter({ image: 'blob:moknet/casse' });
    const alerte = await screen.findByRole('alert');
    expect(alerte.textContent).toMatch(/n'a pas pu être chargée/);
    expect(bouton(/Insérer dans la publication/)).toBeDisabled();
  });

  it('Échap ferme quand le focus est dedans ; le lien vers le grand Studio Créatif n’apparaît que s’il existe', async () => {
    const { onFermer, unmount } = monter();
    await waitFor(() => expect(document.activeElement?.className).toBe('vis-fermer'));
    expect(screen.queryByRole('button', { name: /Studio Créatif/ })).toBeNull();
    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(onFermer).toHaveBeenCalledTimes(1);
    unmount();

    const ouvrir = vi.fn();
    const deuxieme = monter({ onOuvrirStudioCreatif: ouvrir });
    fireEvent.click(screen.getByRole('button', { name: 'Besoin de plus ? Studio Créatif' }));
    expect(deuxieme.onFermer).toHaveBeenCalledTimes(1);
    expect(ouvrir).toHaveBeenCalledTimes(1);
  });

  it('vidéo seule : la source vidéo est choisie, la famille « Vidéo » s’ouvre, et sans ré-encodage le studio le dit', async () => {
    const { onInserer } = monter({ image: null, video: VIDEO });
    const sources = within(screen.getByRole('group', { name: 'Source' })).getAllByRole('button');
    expect(sources[1].getAttribute('aria-pressed')).toBe('true');
    const video = document.querySelector('video.vis-video') as HTMLVideoElement;
    expect(video.getAttribute('src')).toBe(VIDEO);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Familles de réglages' })).getByRole('button', { name: 'Vidéo' }));
    expect(screen.getAllByRole('slider').map((s) => s.getAttribute('aria-label'))).toEqual(['Début (s)', 'Fin (s)', 'Vitesse']);
    fireEvent.change(curseur('Vitesse'), { target: { value: '150' } });
    expect(video.style.filter).toBe('brightness(1.000) contrast(1.000) saturate(1.000)');
    fireEvent.click(bouton('Lumière'));
    fireEvent.change(curseur('Exposition'), { target: { value: '20' } });
    expect(video.style.filter).toContain('brightness(1.200)');

    expect(typeof (globalThis as { MediaRecorder?: unknown }).MediaRecorder).toBe('undefined');
    fireEvent.click(bouton(/Insérer dans la publication/));
    const alerte = await screen.findByRole('alert');
    expect(alerte.textContent).toMatch(/ne sait pas ré-encoder la vidéo/);
    expect(onInserer).not.toHaveBeenCalled();
  });
});

describe('feuille de style du studio « Visuel IA » (index.html, telle qu’analysée)', () => {
  const HTML = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const debut = HTML.indexOf('VISUEL IA — STUDIO PLEIN ECRAN SOMBRE (DEC-2026-061');
  const fin = HTML.indexOf('/* ===== FIN VISUEL IA ===== */');
  const bloc = HTML.slice(debut, fin);
  const racine = postcss.parse(bloc.slice(bloc.indexOf('*/') + 2));
  const regle = (sel: string) => { let r: postcss.Rule | undefined; racine.walkRules((x) => { if (!r && x.selector === sel && x.parent?.type === 'root') r = x; }); return r; };
  const decl = (sel: string, prop: string) => { let v: string | undefined; regle(sel)?.walkDecls(prop, (d) => { v = d.value; }); return v; };

  it('existe, est fermée, et vient après le composeur A7', () => {
    expect(debut).toBeGreaterThan(HTML.indexOf('/* ===== FIN COMPOSEUR A7 ===== */'));
    expect(fin).toBeGreaterThan(debut);
    expect(racine.nodes.length).toBeGreaterThan(20);
  });

  it('le voile couvre tout l’écran, au-dessus de la coquille, et la feuille est sombre et bornée', () => {
    expect(decl('.vis-voile', 'position')).toBe('fixed');
    expect(Number(decl('.vis-voile', 'z-index'))).toBeGreaterThan(1000000);
    expect(decl('.vis-feuille', 'width')).toMatch(/min\(1040px/);
    expect(decl('.vis-feuille', 'color-scheme')).toBe('dark');
  });

  it('plein écran sur téléphone et immobile sous prefers-reduced-motion', () => {
    const medias: string[] = [];
    racine.walkAtRules('media', (at) => { medias.push(at.params); });
    expect(medias.some((m) => /max-width:\s*639px/.test(m))).toBe(true);
    expect(medias.some((m) => /prefers-reduced-motion:\s*reduce/.test(m))).toBe(true);
    // Aucun survol hors d'une requête (hover: hover) : sur tactile, un
    // survol « collant » ferait croire à un état actif qui n'existe pas.
    let hoverNu = 0; racine.walkRules((r) => { if (/:hover/.test(r.selector) && r.parent?.type === 'root') hoverNu++; });
    expect(hoverNu).toBe(0);
  });
});
