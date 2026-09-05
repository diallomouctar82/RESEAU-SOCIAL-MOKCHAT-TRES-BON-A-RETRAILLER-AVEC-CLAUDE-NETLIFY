import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * DEC-2026-080 — la modale « Assistant IA Pré-Publication » au-dessus du dock.
 *
 * Constat de la Direction (capture iPhone, 5/09/2026) : sur téléphone, le
 * bouton « Appliquer à ma publication » était masqué par la barre du bas
 * (menu, messages). Ce que ces tests gardent :
 *   - la modale vit dans un portail sur <body>, hors de #root, qui devient
 *     inerte ; focus pris à l'ouverture, rendu au déclencheur à la fermeture ;
 *     Échap ferme ;
 *   - le pied garde « Annuler » et « Appliquer à ma publication » et
 *     « Appliquer » envoie le texte puis ferme ;
 *   - la feuille place la modale au-dessus du dock (50) et de la barre
 *     flottante (60), sous le studio Visuel IA, borne la hauteur à la fenêtre
 *     visible (dvh avec repli vh) et respecte la zone sûre du bas.
 */

vi.mock('../services/ai', () => ({
  aiService: { generateText: vi.fn(async () => 'Texte amélioré par la doublure') },
}));

import { AIPostAssistantModal } from '../components/AIPostAssistantModal';

function racine(): HTMLElement {
  let r = document.getElementById('root');
  if (!r) { r = document.createElement('div'); r.id = 'root'; document.body.appendChild(r); }
  return r;
}

function monter(ouvert = true) {
  const r = racine();
  const onClose = vi.fn();
  const onApply = vi.fn();
  const declencheur = document.createElement('button');
  declencheur.textContent = 'Améliorer le style';
  r.appendChild(declencheur);
  declencheur.focus();
  const conteneur = r.appendChild(document.createElement('div'));
  const props = { onClose, onApply, originalText: 'Bonjour, soyez les bienvenus', initialTool: 'style' as const };
  const rendu = render(<AIPostAssistantModal isOpen={ouvert} {...props} />, { container: conteneur });
  return { ...rendu, onClose, onApply, declencheur, r, props };
}

afterEach(() => { cleanup(); document.body.innerHTML = ''; });

describe('modale « Assistant IA Pré-Publication » (DEC-2026-080)', () => {
  it('fermée, n’existe pas et ne rend rien inerte', () => {
    const { r } = monter(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(r.hasAttribute('inert')).toBe(false);
  });

  it('ouverte, vit dans un portail sur <body> hors de #root, rend la racine inerte et prend le focus ; Échap ferme ; fermée, rend le focus et l’inertie', async () => {
    const { r, onClose, declencheur, rerender, props } = monter();
    const dialogue = screen.getByRole('dialog');
    expect(dialogue.parentElement).toBe(document.body);
    expect(r.contains(dialogue)).toBe(false);
    expect(r.hasAttribute('inert')).toBe(true);
    expect(dialogue.className).not.toMatch(/\bz-50\b/);
    expect(dialogue.className).toContain('ia-fond');
    expect(dialogue.hasAttribute('data-miroir')).toBe(true); // la couche aqua [data-miroir] suit la modale hors de #root
    const carte = dialogue.firstElementChild as HTMLElement;
    expect(carte.className).toContain('ia-carte');
    expect(carte.className).not.toMatch(/max-h-\[90vh\]/);
    // DEC-2026-082 : en-tete retrecissable et repliable (cartes etroites)
    const titre = dialogue.querySelector('#ia-modale-titre') as HTMLElement;
    expect(titre.className).toMatch(/\bbreak-words\b/);
    expect(titre.parentElement!.className).toMatch(/\bflex-wrap\b/);
    expect(titre.parentElement!.parentElement!.parentElement!.className).toMatch(/\bmin-w-0\b.*\bflex-1\b|\bflex-1\b.*\bmin-w-0\b/);
    expect((dialogue.querySelector('.ia-fermer') as HTMLElement).className).toMatch(/\bshrink-0\b/);
    expect(carte.querySelector('.ia-tete')).not.toBeNull(); expect(carte.querySelector('.ia-onglets')).not.toBeNull(); expect(carte.querySelector('.ia-corps')).not.toBeNull(); expect(carte.querySelector('.ia-pied')).not.toBeNull();

    await act(async () => { await new Promise((res) => setTimeout(res, 50)); });
    expect((document.activeElement as HTMLElement | null)?.classList.contains('ia-fermer')).toBe(true);

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<AIPostAssistantModal isOpen={false} {...props} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(r.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(declencheur);
  });

  it('le pied garde « Annuler » et « Appliquer à ma publication » ; Appliquer envoie le texte puis ferme', () => {
    const { onApply, onClose } = monter();
    const annuler = screen.getByRole('button', { name: 'Annuler' });
    const appliquer = screen.getByRole('button', { name: /Appliquer à ma publication/ }) as HTMLButtonElement;
    expect(annuler.closest('.ia-pied')).not.toBeNull();
    expect(appliquer.closest('.ia-pied')).not.toBeNull();
    expect((appliquer.closest('.ia-pied') as HTMLElement).className).toMatch(/\bflex-wrap\b/); // DEC-2026-082 : le pied se replie sur les cartes etroites
    expect(appliquer.disabled).toBe(false);
    fireEvent.click(appliquer);
    expect(onApply).toHaveBeenCalledWith('Bonjour, soyez les bienvenus', undefined, undefined);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(annuler);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('suit la zone réellement visible tant qu’elle est ouverte (zoom de page, clavier) et cesse à la fermeture — DEC-2026-082', () => {
    const faux = Object.assign(new EventTarget(), { offsetTop: 0, offsetLeft: 0, width: 390, height: 844, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { value: faux, configurable: true });
    const retire = vi.spyOn(faux, 'removeEventListener');
    try {
      const { rerender, props } = monter();
      const dialogue = screen.getByRole('dialog') as HTMLElement;
      expect([dialogue.style.top, dialogue.style.left, dialogue.style.width, dialogue.style.height]).toEqual(['0px', '0px', '390px', '844px']);
      Object.assign(faux, { offsetTop: 40, offsetLeft: 130, width: 260, height: 562 }); // zoom 1,5 : la zone visible retrecit et se decale
      act(() => { faux.dispatchEvent(new Event('resize')); });
      expect([dialogue.style.top, dialogue.style.left, dialogue.style.width, dialogue.style.height]).toEqual(['40px', '130px', '260px', '562px']);
      rerender(<AIPostAssistantModal isOpen={false} {...props} />);
      expect(retire).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(retire).toHaveBeenCalledWith('scroll', expect.any(Function));
    } finally {
      Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
    }
  });

  it('est un dialogue modal nommé par son titre, avec un bouton de fermeture nommé', () => {
    monter();
    expect(screen.getByRole('dialog', { name: 'Assistant IA Pré-Publication Mooc' }).getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('button', { name: "Fermer l'assistant" })).toBeTruthy();
  });
});

describe('feuille de style de la modale (index.html, telle qu’analysée)', () => {
  const HTML = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const debut = HTML.indexOf('ASSISTANT IA — MODALE AU-DESSUS DU DOCK (DEC-2026-080)');
  const fin = HTML.indexOf('/* ===== FIN ASSISTANT IA ===== */');
  const bloc = HTML.slice(debut, fin);
  const feuille = postcss.parse(bloc.slice(bloc.indexOf('*/') + 2));
  const valeurs = (sel: string, prop: string) => { const v: string[] = []; feuille.walkRules((r) => { if (r.selector === sel) r.walkDecls(prop, (d) => { v.push(d.value); }); }); return v; };

  it('existe, est fermée, et vient après le studio Visuel IA', () => {
    expect(debut).toBeGreaterThan(HTML.indexOf('/* ===== FIN VISUEL IA ===== */'));
    expect(fin).toBeGreaterThan(debut);
  });

  it('place la modale au-dessus du dock (50) et de la barre flottante (60), sous le studio Visuel IA', () => {
    const z = Number(valeurs('.ia-fond', 'z-index')[0]);
    expect(z).toBeGreaterThan(60);
    const studio = HTML.match(/\.vis-voile \{[^}]*z-index:\s*(\d+)/);
    expect(studio).not.toBeNull();
    expect(z).toBeLessThan(Number(studio![1]));
  });

  it('borne la hauteur à 90 % du voile (qui suit la zone visible), et le pied respecte la zone sûre du bas', () => {
    expect(valeurs('.ia-carte', 'max-height')).toEqual(['90%', '96%']); // 90 % du voile (96 % quand le voile est bas), qui suit la zone visible (DEC-2026-082)
    expect(valeurs('.ia-fond .ia-carte', 'overflow')).toEqual(['clip']); // jamais defilee horizontalement par un focus
    expect(valeurs('.ia-fond .ia-tete, .ia-fond .ia-onglets, .ia-fond .ia-pied', 'flex-shrink')).toEqual(['0']);
    expect(valeurs('.ia-fond .ia-corps', 'min-height')).toEqual(['0']);
    expect(valeurs('.ia-fond', 'container-type')).toEqual(['size']); // largeur ET hauteur du voile interrogeables
    const conteneurs: string[] = []; feuille.walkAtRules('container', (a) => { conteneurs.push(a.params); });
    expect(conteneurs).toEqual(['ia (max-width: 320px)', 'ia (max-height: 560px)']);
    expect(valeurs('.ia-fond .ia-pied', 'padding-bottom')[0]).toMatch(/max\(1rem, env\(safe-area-inset-bottom\)\)/);
  });
});

describe('champ du composeur à 16 px sur tactile (index.html, DEC-2026-082)', () => {
  const HTML = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const debut = HTML.indexOf('COMPOSEUR A7 — CHAMP A 16 PX SUR TACTILE (DEC-2026-082)');
  const fin = HTML.indexOf('/* ===== FIN COMPOSEUR A7 CHAMP TACTILE ===== */');
  const bloc = HTML.slice(debut, fin);
  const feuille = postcss.parse(bloc.slice(bloc.indexOf('*/') + 2));

  it('existe, est fermé, et vient après le bloc de la modale', () => {
    expect(debut).toBeGreaterThan(HTML.indexOf('/* ===== FIN ASSISTANT IA ===== */'));
    expect(fin).toBeGreaterThan(debut);
  });

  it('passe le champ du composeur à 16 px (seuil du zoom automatique de Safari iOS) sur pointeur tactile ou fenêtre étroite, avec une spécificité qui bat .text-xs', () => {
    const medias: string[] = [];
    const regles: Array<{ selecteur: string; taille?: string; interligne?: string }> = [];
    feuille.walkAtRules('media', (a) => {
      medias.push(a.params);
      a.walkRules((r) => { const d: Record<string, string> = {}; r.walkDecls((x) => { d[x.prop] = x.value; }); regles.push({ selecteur: r.selector, taille: d['font-size'], interligne: d['line-height'] }); });
    });
    expect(medias.some((m) => /pointer:\s*coarse/.test(m) && /max-width:\s*767px/.test(m))).toBe(true);
    expect(regles).toEqual([{ selecteur: '.a7-comp .a7-champ', taille: '16px', interligne: '1.4' }]);
    // Le champ reel porte bien ces deux classes (sinon la regle serait morte).
    const feed = readFileSync(join(__dirname, '..', 'components', 'SocialFeed.tsx'), 'utf8');
    expect(feed).toMatch(/className="[^"]*\ba7-comp\b/);
    expect(feed).toMatch(/className="a7-champ [^"]*\btext-xs\b/);
  });
});
