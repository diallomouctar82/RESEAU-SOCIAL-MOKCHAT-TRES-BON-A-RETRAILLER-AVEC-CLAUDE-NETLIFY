import { describe, expect, it } from 'vitest';
import {
  CADRAGES, INTENTIONS, LOOKS, POLICES, REGLAGES_DEFAUT, SYSTEME_PROMPT_REGLAGES,
  appliquerPixels, dimensionsSortie, filtreCss, normaliserReglages, rectangleCadrage, reglagesDepuisReponse, reglagesModifies,
} from '../services/visuelIA';

/**
 * DEC-2026-061 — le service pur du studio « Visuel IA » (variante B10).
 *
 * Tout ce que l'écran affiche passe par ces fonctions : bornage des
 * réglages (venant de l'écran ou de l'IA), lecture de la réponse de l'IA,
 * filtre CSS de l'aperçu vidéo, découpe du cadrage, dimensions de sortie et
 * surtout le pipeline de pixels lui-même. Les tests mesurent des pixels, pas
 * des intentions : un « look noir » doit vraiment donner R = G = B.
 */

function imageUnie(largeur: number, hauteur: number, [r, g, b]: [number, number, number]): Uint8ClampedArray {
  const d = new Uint8ClampedArray(largeur * hauteur * 4);
  for (let i = 0; i < d.length; i += 4) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }
  return d;
}
function pixel(d: Uint8ClampedArray, largeur: number, x: number, y: number): [number, number, number] {
  const i = (y * largeur + x) * 4;
  return [d[i], d[i + 1], d[i + 2]];
}
function moyenne(d: Uint8ClampedArray): [number, number, number] {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return [r / n, g / n, b / n];
}

describe('réglages : bornage et lecture de la réponse de l’IA', () => {
  it('a des réglages par défaut neutres et gelés', () => {
    expect(reglagesModifies(REGLAGES_DEFAUT)).toBe(false);
    expect(Object.isFrozen(REGLAGES_DEFAUT)).toBe(true);
    expect(REGLAGES_DEFAUT.look).toBe('naturel');
    expect(REGLAGES_DEFAUT.cadrage).toBe('original');
    expect(REGLAGES_DEFAUT.fin).toBeNull();
  });

  it('normalise : objet vide → défauts ; valeurs hors bornes ramenées ; chaînes numériques acceptées ; inconnus refusés', () => {
    expect(normaliserReglages({})).toEqual(REGLAGES_DEFAUT);
    expect(normaliserReglages(null)).toEqual(REGLAGES_DEFAUT);
    const r = normaliserReglages({ exposition: 900, peauDouce: -3, vitesse: 10, contraste: '12', look: 'sepia', cadrage: '3:2', positionTexte: 'gauche', policeTexte: 'comic', tailleTexte: 12.6 });
    expect(r.exposition).toBe(50);
    expect(r.peauDouce).toBe(0);
    expect(r.vitesse).toBe(50);
    expect(r.contraste).toBe(12);
    expect(r.look).toBe('naturel');
    expect(r.cadrage).toBe('original');
    expect(r.positionTexte).toBe('bas');
    expect(r.policeTexte).toBe('outfit');
    expect(r.tailleTexte).toBe(13);
  });

  it('garde la base pour ce qui manque, et tronque les textes', () => {
    const base = normaliserReglages({ look: 'teal', grain: 20, titre: 'Bonjour' });
    const r = normaliserReglages({ vignette: 30 }, base);
    expect(r.look).toBe('teal');
    expect(r.grain).toBe(20);
    expect(r.titre).toBe('Bonjour');
    expect(r.vignette).toBe(30);
    expect(normaliserReglages({ titre: 'a'.repeat(200), sousTitre: 'b'.repeat(200) }).titre).toHaveLength(120);
    expect(normaliserReglages({ titre: 'a'.repeat(200), sousTitre: 'b'.repeat(200) }).sousTitre).toHaveLength(160);
    expect(normaliserReglages({ titre: 42 }).titre).toBe('');
  });

  it('traite la fin de vidéo : null explicite, nombre borné, absente → base', () => {
    expect(normaliserReglages({ fin: null }).fin).toBeNull();
    expect(normaliserReglages({ fin: 12 }).fin).toBe(12);
    expect(normaliserReglages({ fin: -5 }).fin).toBe(0);
    expect(normaliserReglages({}, normaliserReglages({ fin: 7 })).fin).toBe(7);
    expect(normaliserReglages({}).fin).toBeNull();
  });

  it('lit la réponse de l’IA même entourée de prose ou de ``` ; refuse le reste', () => {
    const a = reglagesDepuisReponse('```json\n{"peauDouce": 30, "look": "golden"}\n```', REGLAGES_DEFAUT);
    expect(a?.peauDouce).toBe(30);
    expect(a?.look).toBe('golden');
    expect(a?.exposition).toBe(0);
    const b = reglagesDepuisReponse('Voici mes réglages : {"exposition": 10, "titre": "Bienvenue"} — bonne journée.', REGLAGES_DEFAUT);
    expect(b?.exposition).toBe(10);
    expect(b?.titre).toBe('Bienvenue');
    expect(reglagesDepuisReponse('rien à voir', REGLAGES_DEFAUT)).toBeNull();
    expect(reglagesDepuisReponse('{"exposition": 10', REGLAGES_DEFAUT)).toBeNull();
    expect(reglagesDepuisReponse('', REGLAGES_DEFAUT)).toBeNull();
    expect(reglagesDepuisReponse('[1,2]', REGLAGES_DEFAUT)).toBeNull();
  });

  it('demande à l’IA des RÉGLAGES en JSON seul, avec les clés exactes du modèle', () => {
    expect(SYSTEME_PROMPT_REGLAGES).toMatch(/UNIQUEMENT par un objet JSON/);
    for (const cle of ['exposition', 'peauDouce', 'brillanceCheveux', 'look', 'cadrage', 'titre', 'positionTexte', 'policeTexte']) {
      expect(SYSTEME_PROMPT_REGLAGES).toContain(cle);
    }
    for (const look of Object.keys(LOOKS)) expect(SYSTEME_PROMPT_REGLAGES).toContain(`"${look}"`);
  });

  it('les intentions guidées ne perdent aucun réglage au bornage', () => {
    expect(INTENTIONS.map((i) => i.cle)).toEqual(['portrait', 'doree', 'cinema', 'net', 'clair', 'titre']);
    for (const it of INTENTIONS) {
      const r = normaliserReglages(it.reglages);
      for (const [k, v] of Object.entries(it.reglages)) expect((r as unknown as Record<string, unknown>)[k], `${it.cle}.${k}`).toBe(v);
      expect(reglagesModifies(r)).toBe(true);
    }
  });

  it('expose six looks, cinq cadrages et trois polices nommés', () => {
    expect(Object.keys(LOOKS)).toEqual(['naturel', 'teal', 'golden', 'noir', 'pellicule', 'editorial']);
    expect(Object.keys(CADRAGES)).toEqual(['original', '1:1', '4:5', '16:9', '9:16']);
    expect(Object.keys(POLICES)).toEqual(['outfit', 'elegante', 'manuscrite']);
    for (const l of Object.values(LOOKS)) expect(l.libelle.length).toBeGreaterThan(2);
  });
});

describe('filtre CSS (aperçu vidéo)', () => {
  it('est neutre par défaut', () => {
    expect(filtreCss(REGLAGES_DEFAUT)).toBe('brightness(1.000) contrast(1.000) saturate(1.000)');
  });
  it('suit les réglages : exposition, noir & blanc, température, peau douce', () => {
    expect(filtreCss(normaliserReglages({ exposition: 20 }))).toContain('brightness(1.200)');
    const noir = filtreCss(normaliserReglages({ look: 'noir' }));
    expect(noir).toContain('grayscale(1)');
    expect(noir).toContain('saturate(0.000)');
    expect(filtreCss(normaliserReglages({ temperature: 20 }))).toContain('sepia(0.080)');
    expect(filtreCss(normaliserReglages({ temperature: -20 }))).toContain('hue-rotate(12deg)');
    expect(filtreCss(normaliserReglages({ peauDouce: 50 }))).toContain('blur(0.25px)');
    expect(filtreCss(normaliserReglages({ peauDouce: 0 }))).not.toContain('blur');
  });
});

describe('cadrage et dimensions de sortie', () => {
  it('découpe au centre selon le ratio', () => {
    expect(rectangleCadrage(800, 600, 'original')).toEqual({ sx: 0, sy: 0, sw: 800, sh: 600 });
    expect(rectangleCadrage(800, 600, '1:1')).toEqual({ sx: 100, sy: 0, sw: 600, sh: 600 });
    expect(rectangleCadrage(600, 800, '16:9')).toEqual({ sx: 0, sy: 231, sw: 600, sh: 338 });
    expect(rectangleCadrage(800, 600, '9:16')).toEqual({ sx: 231, sy: 0, sw: 338, sh: 600 });
    expect(rectangleCadrage(0, 0, '1:1')).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 });
  });
  it('limite le grand côté sans jamais agrandir', () => {
    expect(dimensionsSortie(4000, 3000, 'original', 720)).toMatchObject({ largeur: 720, hauteur: 540 });
    expect(dimensionsSortie(300, 200, 'original', 720)).toMatchObject({ largeur: 300, hauteur: 200 });
    const carre = dimensionsSortie(4000, 3000, '1:1', 1600);
    expect(carre).toMatchObject({ largeur: 1600, hauteur: 1600 });
    expect(carre.source).toEqual({ sx: 500, sy: 0, sw: 3000, sh: 3000 });
    expect(dimensionsSortie(0, 0, 'original', 720)).toMatchObject({ largeur: 1, hauteur: 1 });
  });
});

describe('pipeline de pixels', () => {
  const L = 24, H = 16;

  it('ne touche pas une image quand tous les réglages sont neutres', () => {
    const d = imageUnie(L, H, [120, 80, 60]);
    const avant = Uint8ClampedArray.from(d);
    appliquerPixels(d, L, H, REGLAGES_DEFAUT);
    expect(Array.from(d)).toEqual(Array.from(avant));
  });

  it('éclaircit avec l’exposition, assombrit avec une exposition négative', () => {
    const clair = imageUnie(L, H, [120, 120, 120]);
    appliquerPixels(clair, L, H, normaliserReglages({ exposition: 40 }));
    expect(moyenne(clair)[0]).toBeGreaterThan(150);
    const sombre = imageUnie(L, H, [120, 120, 120]);
    appliquerPixels(sombre, L, H, normaliserReglages({ exposition: -40 }));
    expect(moyenne(sombre)[0]).toBeLessThan(90);
  });

  it('le look « noir » désature complètement (R = G = B)', () => {
    const d = imageUnie(L, H, [200, 80, 60]);
    appliquerPixels(d, L, H, normaliserReglages({ look: 'noir' }));
    const [r, g, b] = pixel(d, L, 12, 8);
    expect(Math.abs(r - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
  });

  it('la saturation négative rapproche les canaux, la température réchauffe (R monte, B descend)', () => {
    const terne = imageUnie(L, H, [200, 80, 80]);
    appliquerPixels(terne, L, H, normaliserReglages({ saturation: -40 }));
    const [r, g] = pixel(terne, L, 3, 3);
    expect(r - g).toBeLessThan(120);
    expect(r - g).toBeGreaterThan(0);
    const chaud = imageUnie(L, H, [120, 120, 120]);
    appliquerPixels(chaud, L, H, normaliserReglages({ temperature: 30 }));
    const [cr, , cb] = pixel(chaud, L, 3, 3);
    expect(cr).toBeGreaterThan(120);
    expect(cb).toBeLessThan(120);
  });

  it('la vignette assombrit les coins plus que le centre', () => {
    const d = imageUnie(L, H, [160, 160, 160]);
    appliquerPixels(d, L, H, normaliserReglages({ vignette: 100 }));
    const centre = pixel(d, L, L / 2, H / 2)[0];
    const coin = pixel(d, L, 0, 0)[0];
    expect(coin).toBeLessThan(centre);
    expect(centre).toBeGreaterThanOrEqual(150);
  });

  it('le grain est déterministe : même image, même résultat, mais plus uniforme', () => {
    const a = imageUnie(L, H, [128, 128, 128]);
    const b = imageUnie(L, H, [128, 128, 128]);
    const r = normaliserReglages({ grain: 100 });
    appliquerPixels(a, L, H, r);
    appliquerPixels(b, L, H, r);
    expect(Array.from(a)).toEqual(Array.from(b));
    const valeurs = new Set<number>();
    for (let i = 0; i < a.length; i += 4) valeurs.add(a[i]);
    expect(valeurs.size).toBeGreaterThan(3);
  });

  it('peau douce, netteté et flou des bords s’exécutent sans casser l’alpha ni les bornes', () => {
    const d = imageUnie(L, H, [180, 140, 120]);
    for (let x = 0; x < L; x += 2) { const i = (4 * L + x) * 4; d[i] = 40; d[i + 1] = 30; d[i + 2] = 20; }
    appliquerPixels(d, L, H, normaliserReglages({ peauDouce: 80, nettete: 60, flouBords: 70, eclat: 50, brillanceCheveux: 50 }));
    for (let i = 3; i < d.length; i += 4) expect(d[i]).toBe(255);
    for (let i = 0; i < d.length; i++) { expect(d[i]).toBeGreaterThanOrEqual(0); expect(d[i]).toBeLessThanOrEqual(255); }
  });
});
