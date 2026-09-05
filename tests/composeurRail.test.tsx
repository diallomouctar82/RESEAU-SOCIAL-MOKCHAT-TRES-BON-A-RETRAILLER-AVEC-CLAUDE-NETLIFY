import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * DEC-2026-061 — composeur « A7, rail latéral » du Réseau MOC (choix de la
 * Direction parmi dix variantes de la série A).
 *
 * Ce que la Direction a imposé et que ces tests gardent :
 *   - rien ne disparaît : avatar (logo VS, intouchable), champ, Assistant IA,
 *     améliorer le style, traduire, hashtags, Visuel IA, Public,
 *     Tech & Innovation, photo, vidéo, document, voix, brouillon, publier ;
 *   - chaque orbe fait ce que faisait le bouton d'avant (mêmes entrées de
 *     fichier, même modale IA — ouverte sur le bon onglet —, même bascule
 *     d'écoute, mêmes conditions de Brouillon / Publier) ;
 *   - « Visuel IA » ouvre le studio intégré, pas le grand Studio Créatif ;
 *   - aucun bouton factice : tout ce qui se voit agit ;
 *   - le composeur reste au-dessus de la bande « Aurore ».
 */

const voix = vi.hoisted(() => ({
  isListening: false, isSupported: true,
  startListening: vi.fn(async () => true), stopListening: vi.fn(),
}));

vi.mock('../services/aiGateway', () => ({
  generateJSON: vi.fn(async () => null),
  generateText: vi.fn(async () => ''),
  analyzeImage: vi.fn(async () => ''),
  generateImage: vi.fn(async () => ''),
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
    isListening: voix.isListening, isSupported: voix.isSupported, isSpeaking: false, volume: 0, transcript: '', error: null,
    startListening: voix.startListening, stopListening: voix.stopListening, speak: vi.fn(), stopSpeaking: vi.fn(), setConversationalMode: vi.fn(),
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

const MEDIAS = ['Photo', 'Vidéo', 'Document', 'Voix'];
const TEINTES_MEDIAS = [150, 262, 42, 330];
const ACTIONS = ['Améliorer le style', 'Traduire', 'Hashtags', 'Visuel IA'];
const TEINTES_ACTIONS = [42, 186, 262, 14];

afterEach(() => { voix.isListening = false; voix.isSupported = true; voix.startListening.mockClear(); voix.stopListening.mockClear(); });

function monter(onNavigate = vi.fn()) {
  const r = render(<SocialFeed onOpenLive={vi.fn()} onOpenDirectChat={vi.fn()} onNavigate={onNavigate} />);
  const comp = screen.getByTestId('composeur-a7');
  const rail = () => within(screen.getByTestId('a7-rail')).getAllByRole('button');
  const bas = () => within(screen.getByTestId('a7-medias-bas')).getAllByRole('button');
  const champ = () => screen.getByPlaceholderText('Quoi de neuf ? Partage une réflexion, une opportunité, un tutoriel ou un document.') as HTMLTextAreaElement;
  const publier = () => screen.getByRole('button', { name: 'Publier' }) as HTMLButtonElement;
  const brouillon = () => screen.getByRole('button', { name: 'Brouillon' }) as HTMLButtonElement;
  return { ...r, comp, onNavigate, rail, bas, champ, publier, brouillon };
}
const teinte = (b: HTMLElement) => Number((b.querySelector('.a7-orbe') as HTMLElement).style.getPropertyValue('--h'));

describe('composeur « A7, rail latéral » (DEC-2026-061)', () => {
  it('garde tout ce qui existait, dans l’ordre : avatar intouché, champ, étincelle, quatre actions IA, visibilité, catégorie, médias, Brouillon | Publier', () => {
    const { comp, rail, bas, champ } = monter();
    expect(comp.className).toContain('a7-comp');

    // 1. L'avatar : premier enfant, mêmes classes qu'avant, à l'octet près.
    const avatar = comp.firstElementChild as HTMLImageElement;
    expect(avatar.tagName).toBe('IMG');
    expect(avatar.getAttribute('src')).toBe('https://example.com/a.png');
    expect(avatar.getAttribute('alt')).toBe('Testeur MokNet');
    expect(avatar.className).toBe('w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20');

    // 2. Le rail des médias, puis le corps.
    expect(avatar.nextElementSibling).toBe(screen.getByTestId('a7-rail'));
    expect(rail().map((b) => b.getAttribute('aria-label'))).toEqual(MEDIAS);
    expect(rail().map(teinte)).toEqual(TEINTES_MEDIAS);
    expect(rail().map((b) => b.querySelector('.a7-lb')?.textContent)).toEqual(MEDIAS);
    for (const b of rail()) { expect(b.className).toBe('a7-ob'); expect(b.getAttribute('type')).toBe('button'); expect(b.querySelector('.a7-orbe svg')).not.toBeNull(); }

    // 3. Le champ et l'étincelle dans le champ.
    const zone = champ().parentElement as HTMLElement;
    expect(zone.className).toBe('a7-zone');
    expect(champ().className).toContain('a7-champ');
    const etincelle = within(zone).getByRole('button', { name: 'Assistant IA Pré-Publication' });
    expect(etincelle.className).toBe('a7-etincelle');
    expect(etincelle.querySelector('.a7-orbe.or svg')).not.toBeNull();

    // 4. Les quatre actions IA, nommées, dans l'ordre imposé.
    const rangee = screen.getByRole('group', { name: 'Assistant IA' });
    const actions = within(rangee).getAllByRole('button');
    expect(actions.map((b) => b.getAttribute('aria-label'))).toEqual(ACTIONS);
    expect(actions.map(teinte)).toEqual(TEINTES_ACTIONS);
    expect(actions.map((b) => b.querySelector('.a7-lb')?.textContent)).toEqual(ACTIONS);
    expect(new Set([...TEINTES_ACTIONS]).size).toBe(4);
    expect(new Set([...TEINTES_MEDIAS]).size).toBe(4);

    // 5. Visibilité et catégorie : mêmes options, mêmes valeurs par défaut.
    const visibilite = screen.getByRole('combobox', { name: 'Visibilité de la publication' }) as HTMLSelectElement;
    expect(visibilite.value).toBe('public');
    expect(Array.from(visibilite.options).map((o) => o.textContent)).toEqual(['🌐 Public', '👥 Abonnés uniquement', '🔒 Privé']);
    const categorie = screen.getByRole('combobox', { name: 'Catégorie de la publication' }) as HTMLSelectElement;
    expect(categorie.value).toBe('Tech & Innovation');
    expect(Array.from(categorie.options).map((o) => o.value)).toEqual(['Tech & Innovation', 'Juridique & Visas', 'Entrepreneuriat', 'Formation & Campus', 'Logement & Mobilité']);
    expect(screen.getByTestId('a7-compteur').textContent).toBe('0 caractère');

    // 6. Les médias du téléphone : mêmes quatre orbes, même ordre.
    expect(bas().map((b) => b.getAttribute('aria-label'))).toEqual(MEDIAS);
    expect(bas().map(teinte)).toEqual(TEINTES_MEDIAS);

    // 7. Brouillon | Publier, groupés, dans cet ordre, et rien après eux.
    const groupe = comp.querySelector('.a7-groupe') as HTMLElement;
    expect(within(groupe).getAllByRole('button').map((b) => b.textContent)).toEqual(['Brouillon', 'Publier']);
    expect(groupe.parentElement?.className).toBe('a7-pied');
    expect(groupe.nextElementSibling).toBeNull();

    // Ordre général dans le document.
    const suite = [avatar, screen.getByTestId('a7-rail'), champ(), etincelle, rangee, visibilite, categorie, screen.getByTestId('a7-medias-bas'), groupe];
    for (let i = 1; i < suite.length; i++) expect(suite[i - 1].compareDocumentPosition(suite[i]) & Node.DOCUMENT_POSITION_FOLLOWING, `${i}`).toBeTruthy();
  });

  it('Photo, Vidéo et Document ouvrent la même entrée de fichier qu’avant — depuis le rail comme depuis la ligne téléphone', () => {
    const { rail, bas, comp } = monter();
    const cliques: string[] = [];
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { cliques.push(this.accept); });
    const entrees = Array.from(comp.querySelectorAll('input[type="file"]'));
    expect(entrees.map((e) => e.getAttribute('accept'))).toEqual(['image/*', 'video/*', '.pdf,.doc,.docx,.zip']);
    expect(entrees.every((e) => e.className === 'hidden')).toBe(true);

    for (const b of rail().slice(0, 3)) fireEvent.click(b);
    expect(cliques).toEqual(['image/*', 'video/*', '.pdf,.doc,.docx,.zip']);
    for (const b of bas().slice(0, 3)) fireEvent.click(b);
    expect(cliques).toEqual(['image/*', 'video/*', '.pdf,.doc,.docx,.zip', 'image/*', 'video/*', '.pdf,.doc,.docx,.zip']);
  });

  it('Brouillon et Publier restent désactivés tant que rien n’est saisi ; le compteur suit la saisie', () => {
    const { champ, publier, brouillon } = monter();
    expect(publier().disabled).toBe(true);
    expect(brouillon().disabled).toBe(true);
    expect(publier().className).toBe('a7-publier');
    expect(brouillon().className).toBe('a7-brouillon');

    fireEvent.change(champ(), { target: { value: 'B' } });
    expect(screen.getByTestId('a7-compteur').textContent).toBe('1 caractère');
    fireEvent.change(champ(), { target: { value: 'Bonjour' } });
    expect(screen.getByTestId('a7-compteur').textContent).toBe('7 caractères');
    expect(publier().disabled).toBe(false);
    expect(brouillon().disabled).toBe(false);

    fireEvent.change(champ(), { target: { value: '   ' } });
    expect(publier().disabled).toBe(true);
    expect(screen.getByTestId('a7-compteur').textContent).toBe('3 caractères');
  });

  it('visibilité et catégorie se changent comme avant', () => {
    monter();
    const visibilite = screen.getByRole('combobox', { name: 'Visibilité de la publication' }) as HTMLSelectElement;
    fireEvent.change(visibilite, { target: { value: 'network' } });
    expect(visibilite.value).toBe('network');
    const categorie = screen.getByRole('combobox', { name: 'Catégorie de la publication' }) as HTMLSelectElement;
    fireEvent.change(categorie, { target: { value: 'Juridique & Visas' } });
    expect(categorie.value).toBe('Juridique & Visas');
  });

  it.each([
    ['Assistant IA Pré-Publication', 'Sélectionnez le ton souhaité'],
    ['Améliorer le style', 'Sélectionnez le ton souhaité'],
    ['Traduire', 'Choisissez la langue cible'],
    ['Hashtags', "Hashtags suggérés par l'IA"],
  ])('« %s » ouvre la modale IA existante directement sur le bon onglet', (nom, attendu) => {
    monter();
    expect(screen.queryByText('Assistant IA Pré-Publication Mooc')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: nom }));
    expect(screen.getByText('Assistant IA Pré-Publication Mooc')).toBeTruthy();
    expect(screen.getByText(new RegExp(attendu))).toBeTruthy();
    expect(screen.queryByTestId('visuel-ia-studio')).toBeNull();
  });

  it('« Visuel IA » ouvre le studio intégré — pas le grand Studio Créatif, qui reste un lien discret', () => {
    const { onNavigate } = monter();
    expect(screen.queryByTestId('visuel-ia-studio')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Visuel IA' }));
    const dialogue = screen.getByRole('dialog', { name: 'Visuel IA — studio de retouche' });
    expect(dialogue).toBeTruthy();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(screen.queryByText('Assistant IA Pré-Publication Mooc')).toBeNull();

    fireEvent.click(within(dialogue).getByRole('button', { name: 'Fermer le studio' }));
    expect(screen.queryByTestId('visuel-ia-studio')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Visuel IA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Besoin de plus ? Studio Créatif' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('studio');
    expect(screen.queryByTestId('visuel-ia-studio')).toBeNull();
  });

  it('la voix : « Voix » lance l’écoute ; en écoute l’orbe pulse, se nomme « Écoute... » et l’arrête', () => {
    const { rail, bas, rerender } = monter();
    expect(rail()[3].getAttribute('aria-label')).toBe('Voix');
    expect(rail()[3].getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(rail()[3]);
    expect(voix.startListening).toHaveBeenCalledTimes(1);
    fireEvent.click(bas()[3]);
    expect(voix.startListening).toHaveBeenCalledTimes(2);
    expect(voix.stopListening).not.toHaveBeenCalled();

    voix.isListening = true;
    rerender(<SocialFeed onOpenLive={vi.fn()} onOpenDirectChat={vi.fn()} onNavigate={vi.fn()} />);
    for (const b of [rail()[3], bas()[3]]) {
      expect(b.getAttribute('aria-label')).toBe('Écoute...');
      expect(b.getAttribute('aria-pressed')).toBe('true');
      expect(b.querySelector('.a7-orbe')?.className).toBe('a7-orbe ecoute');
    }
    fireEvent.click(rail()[3]);
    expect(voix.stopListening).toHaveBeenCalledTimes(1);
    expect(voix.startListening).toHaveBeenCalledTimes(2);
  });

  it('sans reconnaissance vocale, l’orbe Voix n’est simplement pas là (aucun bouton factice)', () => {
    voix.isSupported = false;
    const { rail, bas } = monter();
    expect(rail().map((b) => b.getAttribute('aria-label'))).toEqual(['Photo', 'Vidéo', 'Document']);
    expect(bas().map((b) => b.getAttribute('aria-label'))).toEqual(['Photo', 'Vidéo', 'Document']);
  });

  it('reste au-dessus de la bande « Aurore » et n’a pas bougé l’avatar', () => {
    const { comp, publier } = monter();
    const bande = screen.getByTestId('acces-rapide');
    expect(publier().compareDocumentPosition(bande) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(comp.compareDocumentPosition(bande) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(comp.querySelectorAll('img').length).toBe(1);
  });
});

describe('feuille de style du composeur A7 (index.html, telle qu’analysée)', () => {
  const HTML = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const debut = HTML.indexOf('COMPOSEUR A7 « RAIL LATERAL » (DEC-2026-061)');
  const fin = HTML.indexOf('/* ===== FIN COMPOSEUR A7 ===== */');
  const bloc = HTML.slice(debut, fin);
  const racine = postcss.parse(bloc.slice(bloc.indexOf('*/') + 2));
  const regle = (sel: string, parent?: (n: postcss.Container) => boolean) => { let r: postcss.Rule | undefined; racine.walkRules((x) => { if (!r && x.selector === sel && (parent ? parent(x.parent as postcss.Container) : x.parent?.type === 'root')) r = x; }); return r; };
  const decl = (r: postcss.Rule | undefined, prop: string) => { let v: string | undefined; r?.walkDecls(prop, (d) => { v = d.value; }); return v; };

  it('existe, est fermée, et vient après la bande Aurore', () => {
    expect(debut).toBeGreaterThan(HTML.indexOf('/* ===== FIN BANDE AURORE ===== */'));
    expect(fin).toBeGreaterThan(debut);
    expect(racine.nodes.length).toBeGreaterThan(20);
  });

  it('le composeur est un conteneur nommé « a7 » en grille avatar | rail | corps', () => {
    const comp = regle('.a7-comp');
    expect(decl(comp, 'container-type')).toBe('inline-size');
    expect(decl(comp, 'container-name')).toBe('a7');
    expect(decl(comp, 'grid-template-columns')).toBe('44px auto minmax(0, 1fr)');
    expect(decl(regle('.a7-medias-bas'), 'display')).toBe('none');
    expect(decl(regle('.a7-corps'), 'min-width')).toBe('0');
  });

  it('sur téléphone (conteneur ≤ 560 px) le rail disparaît et la ligne des médias apparaît — avec un repli @supports pour les navigateurs sans requêtes de conteneur', () => {
    let conteneur: postcss.AtRule | undefined;
    racine.walkAtRules('container', (at) => { if (/a7/.test(at.params) && /max-width:\s*560px/.test(at.params)) conteneur = at; });
    expect(conteneur).toBeTruthy();
    const dans = (sel: string) => { let r: postcss.Rule | undefined; conteneur?.walkRules((x) => { if (x.selector === sel) r = x; }); return r; };
    expect(decl(dans('.a7-rail'), 'display')).toBe('none');
    expect(decl(dans('.a7-medias-bas'), 'display')).toBe('flex');
    expect(decl(dans('.a7-comp'), 'grid-template-columns')).toBe('40px minmax(0, 1fr)');

    let repli: postcss.AtRule | undefined;
    racine.walkAtRules('supports', (at) => { if (/not \(container-type: inline-size\)/.test(at.params)) repli = at; });
    expect(repli).toBeTruthy();
    let media: postcss.AtRule | undefined;
    repli?.walkAtRules('media', (at) => { media = at; });
    expect(media?.params).toMatch(/max-width:\s*639px/);
    let railRepli: string | undefined;
    media?.walkRules('.a7-rail', (r) => { r.walkDecls('display', (d) => { railRepli = d.value; }); });
    expect(railRepli).toBe('none');
  });

  it('le survol n’existe que pour les vrais pointeurs, le pouls d’écoute s’arrête sous prefers-reduced-motion', () => {
    let hoverNu = 0; racine.walkRules((r) => { if (/:hover/.test(r.selector) && r.parent?.type === 'root') hoverNu++; });
    expect(hoverNu).toBe(0);
    let hover = 0; racine.walkAtRules('media', (at) => { if (/hover:\s*hover/.test(at.params) && /pointer:\s*fine/.test(at.params)) hover++; });
    expect(hover).toBeGreaterThan(0);
    let reduit: postcss.AtRule | undefined;
    racine.walkAtRules('media', (at) => { if (/prefers-reduced-motion:\s*reduce/.test(at.params)) reduit = at; });
    expect(reduit).toBeTruthy();
    let animation: string | undefined;
    reduit?.walkRules('.a7-orbe.ecoute', (r) => { r.walkDecls('animation', (d) => { animation = d.value; }); });
    expect(animation).toMatch(/none/);
  });

  it('les boutons ont une taille de cible suffisante et un anneau de focus visible', () => {
    expect(decl(regle('.a7-ob'), 'min-width')).toBe('44px');
    expect(decl(regle('.a7-orbe'), 'width')).toBe('40px');
    let focus = 0; racine.walkRules((r) => { if (/:focus-visible/.test(r.selector)) focus++; });
    expect(focus).toBeGreaterThanOrEqual(3);
  });
});
