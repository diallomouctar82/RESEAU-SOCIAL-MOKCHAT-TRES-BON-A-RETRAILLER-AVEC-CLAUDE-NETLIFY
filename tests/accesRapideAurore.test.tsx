import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { describe, expect, it, vi } from 'vitest';

/**
 * DEC-2026-058 — bande « Aurore » du Réseau MOC (variante 3 choisie par la
 * Direction parmi dix, sur la base « Orbes lumineux »).
 *
 * Ce que la Direction a imposé et que ces tests gardent :
 *   - seize entrées, dans cet ordre exact, chacune dans une orbe teintée de
 *     sa propre couleur ;
 *   - les sept premières conservent leurs actions d'avant (RO-1), les neuf
 *     suivantes ouvrent l'espace du menu latéral qui porte le même nom ;
 *   - l'orbe de la section courante se remplit (aria-current="page") ;
 *   - le mouvement est en CSS, réservé aux vrais pointeurs pour le survol,
 *     et s'arrête sous prefers-reduced-motion ;
 *   - rien d'autre n'a bougé : le composeur reste au-dessus, la carte
 *     « Réseau Mooc » en dessous.
 */

vi.mock('../services/aiGateway', () => ({
  generateJSON: vi.fn(async () => null),
  generateText: vi.fn(async () => ''),
  analyzeImage: vi.fn(async () => ''),
}));
vi.mock('../services/supabaseClient', () => {
  const base: Record<string, unknown> = { isConfigured: () => false };
  const service = new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return async () => [];
    },
  });
  return { supabaseService: service, isSupabaseConfigured: false, supabase: {} };
});
vi.mock('../services/cloud', () => ({
  cloudService: { getAllPosts: async () => [], savePost: async () => {}, replaceAllPosts: async () => {} },
}));
vi.mock('../services/pwaService', () => ({ checkNetworkStatus: () => true }));
vi.mock('../hooks/useVoiceAssistant', () => ({
  useVoiceAssistant: () => ({
    isListening: false, isSpeaking: false, isSupported: false, volume: 0, transcript: '', error: null,
    startListening: vi.fn(async () => true), stopListening: vi.fn(), speak: vi.fn(), stopSpeaking: vi.fn(), setConversationalMode: vi.fn(),
  }),
}));
vi.mock('../contexts/GlobalContext', () => ({
  useGlobal: () => ({
    userProfile: { id: 'test-user', name: 'Testeur MokNet', avatarUrl: 'https://example.com/a.png', role: 'user', level: 3, credits: 10, skills: [] },
    isSupabaseConnected: false,
    updateUserProfile: vi.fn(),
  }),
}));

import { SocialFeed } from '../components/SocialFeed';

const ORDRE = [
  'Live', 'Équipe & Experts', 'Campus & Éducation', 'Reels', 'Tribus', 'Croissance', 'Ma Story',
  'Langues & Immersion', 'Carrière & Accomplissement', 'Santé & Bien-être', 'Habitat & Installation',
  'Finance & Wallet', 'Mes Démarches', 'Mobilité & Expatriation', 'Studio Créatif', 'Marché Mondial',
];
const TEINTES = [196, 204, 212, 262, 14, 158, 330, 186, 230, 350, 150, 42, 200, 176, 280, 30];
const ESPACES: Array<[string, string]> = [
  ['Équipe & Experts', 'experts'], ['Campus & Éducation', 'campus'], ['Langues & Immersion', 'languages'],
  ['Carrière & Accomplissement', 'career'], ['Santé & Bien-être', 'health'], ['Habitat & Installation', 'housing'],
  ['Finance & Wallet', 'wallet'], ['Mes Démarches', 'admin-procedures'], ['Mobilité & Expatriation', 'world'],
  ['Studio Créatif', 'studio'], ['Marché Mondial', 'shop'],
];

function monter(onNavigate = vi.fn()) {
  const r = render(<SocialFeed onOpenLive={vi.fn()} onOpenDirectChat={vi.fn()} onNavigate={onNavigate} />);
  const bande = screen.getByTestId('acces-rapide');
  const liste = () => bande.querySelector('ul.aurore-rangee') as HTMLElement;
  return { ...r, bande, onNavigate, liste, boutons: () => within(liste()).getAllByRole('button') };
}

describe('bande « Aurore » du Réseau MOC (DEC-2026-058)', () => {
  it('affiche les seize entrées dans l’ordre imposé par la Direction, chacune dans une orbe', () => {
    const { bande, boutons } = monter();
    expect(bande.tagName).toBe('NAV');
    expect(bande.className).toContain('aurore-bande');
    const noms = boutons().map((b) => b.getAttribute('aria-label'));
    expect(noms).toEqual(ORDRE);
    for (const b of boutons()) {
      expect(b.className).toBe('aurore-orbe');
      expect(b.getAttribute('type')).toBe('button');
      expect(b.querySelector('.aurore-bulle svg')).not.toBeNull();
      expect(b.querySelector('.aurore-reflet')).not.toBeNull();
    }
  });

  it('donne à chaque entrée sa propre teinte (--h) et une phase propre (--i, --t)', () => {
    const { boutons } = monter();
    expect(new Set(TEINTES).size).toBe(16);
    expect(boutons().map((b) => Number(b.style.getPropertyValue('--h')))).toEqual(TEINTES);
    expect(boutons().map((b) => b.style.getPropertyValue('--i'))).toEqual(TEINTES.map((_, i) => String(i)));
    expect(boutons().map((b) => b.style.getPropertyValue('--t'))).toEqual(TEINTES.map((_, i) => `${5 + (i % 4)}s`));
  });

  it('porte le libellé complet et le libellé court de chaque entrée (le court est réservé au téléphone)', () => {
    const { boutons } = monter();
    const courts = boutons().map((b) => b.querySelector('.aurore-court')?.textContent);
    expect(courts).toEqual(['Live', 'Experts', 'Campus', 'Reels', 'Tribus', 'Croissance', 'Ma Story', 'Langues', 'Carrière', 'Santé', 'Habitat', 'Finance', 'Démarches', 'Mobilité', 'Studio', 'Marché']);
    expect(boutons().map((b) => b.querySelector('.aurore-libelle')?.textContent)).toEqual(ORDRE);
    for (const b of boutons()) expect(b.querySelector('.aurore-court')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('ouvre l’espace du menu latéral qui porte le même nom pour les onze entrées externes', () => {
    const { onNavigate } = monter();
    for (const [nom, espace] of ESPACES) {
      onNavigate.mockClear();
      fireEvent.click(screen.getByRole('button', { name: nom }));
      expect(onNavigate, nom).toHaveBeenCalledTimes(1);
      expect(onNavigate, nom).toHaveBeenCalledWith(espace);
    }
  });

  it('remplit l’orbe de la section courante ; « Fil d’actu » n’apparaît qu’une fois le fil quitté, hors de la grille', () => {
    const { bande, boutons, onNavigate } = monter();
    expect(within(bande).queryByRole('button', { name: "Fil d'actu" })).toBeNull();
    expect(boutons().filter((b) => b.getAttribute('aria-current') === 'page')).toHaveLength(0);

    for (const [nom, actifs] of [['Live', 'Live'], ['Reels', 'Reels'], ['Croissance', 'Croissance']] as const) {
      fireEvent.click(screen.getByRole('button', { name: nom }));
      expect(boutons().filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.getAttribute('aria-label'))).toEqual([actifs]);
    }
    expect(onNavigate).not.toHaveBeenCalled();

    // Le retour vit dans la bande mais HORS de la liste : seize orbes, mêmes
    // rangs (--i) et même damier qu'avant, quelle que soit la section.
    const retour = within(bande).getByRole('button', { name: "Fil d'actu" });
    expect(retour.className).toBe('aurore-retour');
    expect(retour.closest('ul')).toBeNull();
    expect(retour.compareDocumentPosition(bande.querySelector('ul.aurore-rangee')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(boutons()).toHaveLength(16);
    expect(boutons().map((b) => b.getAttribute('aria-label'))).toEqual(ORDRE);
    expect(boutons().map((b) => b.style.getPropertyValue('--i'))).toEqual(TEINTES.map((_, i) => String(i)));

    fireEvent.click(screen.getByRole('button', { name: 'Tribus' }));
    expect(screen.getByRole('button', { name: 'Tribus' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Croissance' }).getAttribute('aria-current')).toBeNull();

    fireEvent.click(retour);
    expect(within(bande).queryByRole('button', { name: "Fil d'actu" })).toBeNull();
    expect(boutons()).toHaveLength(16);
  });

  it('« Ma Story » ouvre la création de story, sans quitter le fil', () => {
    const { bande, onNavigate } = monter();
    expect(screen.queryByText('Créer une Story Mooc')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ma Story' }));
    expect(screen.getByText('Créer une Story Mooc')).toBeTruthy();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(within(bande).queryByRole('button', { name: "Fil d'actu" })).toBeNull();
  });

  it('garde la bande à sa place : sous le composeur, au-dessus de la carte « Réseau Mooc »', () => {
    const { bande } = monter();
    const composeur = screen.getByRole('button', { name: /Publier/ });
    const titre = screen.getByRole('heading', { name: 'Réseau Mooc' });
    expect(composeur.compareDocumentPosition(bande) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bande.compareDocumentPosition(titre) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('feuille de style de la bande « Aurore » (index.html, telle qu’analysée)', () => {
  const HTML = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const debut = HTML.indexOf('BANDE AURORE (DEC-2026-058)');
  const fin = HTML.indexOf('/* ===== FIN BANDE AURORE ===== */');
  const bloc = HTML.slice(debut, fin);
  const racine = postcss.parse(bloc.slice(bloc.indexOf('*/') + 2));

  it('existe, est fermée, et vient après les plateaux de cristal', () => {
    expect(debut).toBeGreaterThan(HTML.indexOf('FIN PLATEAUX DE CRISTAL'));
    expect(fin).toBeGreaterThan(debut);
  });

  it('teinte l’orbe par --h, remplit l’orbe courante et fait respirer le halo', () => {
    const regles: Record<string, string> = {};
    racine.walkRules((r) => { if (!r.parent || r.parent.type === 'root') regles[r.selector] = r.toString(); });
    expect(regles['.aurore-bulle']).toMatch(/hsl\(var\(--h, 196\) 80% 93%\)/);
    expect(regles['.aurore-bulle']).toMatch(/border-radius: 50%/);
    expect(regles['.aurore-orbe[aria-current="page"] .aurore-bulle']).toMatch(/color: #fff/);
    // le halo est porté par le bouton : une bulle transformée (survol) est
    // son propre contexte d'empilement et ferait passer un ::before devant elle
    expect(regles['.aurore-bulle::before']).toBeUndefined();
    expect(regles['.aurore-orbe::before']).toMatch(/animation: aurore-halo var\(--t, 5s\)/);
    expect(regles['.aurore-orbe::before']).toMatch(/z-index: -1/);
    expect(regles['.aurore-orbe']).toMatch(/isolation: isolate/);
    expect(regles['.aurore-orbe[aria-current="page"] .aurore-bulle']).toMatch(/hsl\(var\(--h, 196\) 70% 38%\), hsl\(var\(--h, 196\) 65% 28%\)/);
    expect(regles['.aurore-retour']).toMatch(/border-radius: 999px/);
    expect(regles['.aurore-item:nth-child(2n) .aurore-orbe']).toMatch(/translateY\(10px\)/);
    const keyframes: string[] = [];
    racine.walkAtRules('keyframes', (a) => { keyframes.push(a.params); });
    expect(keyframes).toEqual(['aurore-halo']);
  });

  it('réserve le survol aux vrais pointeurs, lit la largeur de la carte et s’arrête sous reduced-motion', () => {
    const medias: string[] = [];
    racine.walkAtRules('media', (a) => { medias.push(a.params); });
    expect(medias).toContain('(hover: hover) and (pointer: fine)');
    expect(medias).toContain('(prefers-reduced-motion: reduce)');
    const survol = bloc.match(/\.aurore-(?:orbe|retour):hover/g) ?? [];
    let dansMedia = 0;
    racine.walkAtRules('media', (a) => { if (a.params.includes('hover: hover')) a.walkRules((r) => { if (r.selector.includes(':hover')) dansMedia += 1; }); });
    expect(survol.length).toBeGreaterThan(0);
    expect(dansMedia).toBe(survol.length);
    const conteneurs: string[] = [];
    racine.walkAtRules('container', (a) => { conteneurs.push(a.params); });
    expect(conteneurs).toEqual(['aurore (max-width: 800px)', 'aurore (max-width: 480px)']);
    expect(regleRacine(racine, '.aurore-bande')).toMatch(/container-type: inline-size/);
    let reduit = '';
    racine.walkAtRules('media', (a) => { if (a.params.includes('reduced-motion')) reduit = a.toString(); });
    expect(reduit).toMatch(/\.aurore-orbe::before \{ animation: none !important/);
    const replis: string[] = [];
    racine.walkAtRules('supports', (a) => { replis.push(a.params); });
    expect(replis).toEqual(['not (container-type: inline-size)']);
  });

  it('sur téléphone (conteneur ≤ 480 px) la bande garde la disposition de l’ordinateur en quatre colonnes : grille, damier conservé, aucun défilement horizontal (DEC-2026-076)', () => {
    let tel: postcss.AtRule | undefined;
    racine.walkAtRules('container', (a) => { if (/480px/.test(a.params)) tel = a; });
    expect(tel).toBeTruthy();
    const dans = (sel: string) => { let r: postcss.Rule | undefined; tel?.walkRules((x) => { if (x.selector === sel) r = x; }); return r; };
    const val = (sel: string, prop: string) => { let v: string | undefined; dans(sel)?.walkDecls(prop, (d) => { v = d.value; }); return v; };
    // La grille de la racine (huit colonnes) reste la grille : seul le nombre
    // de colonnes change ; ni flex, ni défilement, ni aimantation, ni fondu.
    expect(regleRacine(racine, '.aurore-rangee')).toMatch(/display: grid/);
    expect(regleRacine(racine, '.aurore-rangee')).toMatch(/grid-template-columns: repeat\(8, minmax\(0, 1fr\)\)/);
    expect(val('.aurore-rangee', 'grid-template-columns')).toBe('repeat(4, minmax(0, 1fr))');
    expect(val('.aurore-rangee', 'display')).toBeUndefined();
    expect(tel?.toString()).not.toMatch(/overflow-x|scroll-snap|scroll-padding|mask-image|scrollbar|flex: none/);
    // Le damier n'est plus annulé sur téléphone : les orbes paires restent
    // abaissées de 10 px, comme sur ordinateur (règle de la racine seule).
    expect(dans('.aurore-item:nth-child(2n) .aurore-orbe')).toBeUndefined();
    expect(dans('.aurore-item')).toBeUndefined();
    // Orbes de 46 px (cible ≥ 44 px), libellés courts sur toute la cellule.
    expect(val('.aurore-bulle', 'width')).toBe('46px');
    expect(val('.aurore-court', 'max-width')).toBe('100%');
    // Repli sans requêtes de conteneur : la même grille, par l'écran.
    let repli: postcss.AtRule | undefined;
    racine.walkAtRules('supports', (a) => { repli = a; });
    let media: postcss.AtRule | undefined;
    repli?.walkAtRules('media', (a) => { if (/639px/.test(a.params)) media = a; });
    expect(media?.toString()).toMatch(/grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
    expect(media?.toString()).not.toMatch(/overflow-x|scroll-snap|flex: none/);
  });
});

function regleRacine(racine: postcss.Root, selecteur: string): string {
  let sortie = '';
  racine.walkRules((r) => { if (r.selector === selecteur && r.parent?.type === 'root') sortie = r.toString(); });
  return sortie;
}
