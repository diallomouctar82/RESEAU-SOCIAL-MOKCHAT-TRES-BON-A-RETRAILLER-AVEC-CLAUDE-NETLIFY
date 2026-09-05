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
    expect(appliquer.disabled).toBe(false);
    fireEvent.click(appliquer);
    expect(onApply).toHaveBeenCalledWith('Bonjour, soyez les bienvenus', undefined, undefined);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(annuler);
    expect(onClose).toHaveBeenCalledTimes(2);
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

  it('borne la hauteur à la fenêtre visible avec repli, et le pied respecte la zone sûre du bas', () => {
    expect(valeurs('.ia-carte', 'max-height')).toEqual(['90vh', '90dvh']);
    expect(valeurs('.ia-fond .ia-pied', 'padding-bottom')[0]).toMatch(/max\(1rem, env\(safe-area-inset-bottom\)\)/);
  });
});
