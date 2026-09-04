/**
 * DS-EX-3 — Garde-fou de la couche de traduction aqua.
 *
 * La couche est générée depuis le code réel (`scripts/genMiroirAquaLayer.cjs`).
 * Ce garde-fou existe pour empêcher les trois façons dont elle peut mentir
 * silencieusement — la famille de piège déjà rencontrée trois fois dans ce
 * dépôt (`-webkit-box-reflect: none` ignoré par Chromium, les teintes
 * `brand-*` absentes de la config Tailwind, `hidden sm:flex` doublé d'un
 * `flex` nu) : une déclaration qui ne peint rien sans le dire.
 *
 *  1. La couche est PÉRIMÉE — une classe bleue ajoutée après coup reste bleue
 *     au milieu d'un écran aqua, et rien ne le signale.
 *  2. Une famille SÉMANTIQUE est traduite — un rouge de danger devient aqua,
 *     et l'information portée par la couleur disparaît.
 *  3. Le CONTRASTE se dégrade — la rampe est jolie mais un texte devient
 *     illisible. Les ratios sont donc recalculés ici, pas supposés.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const exiger = createRequire(import.meta.url);
const generateur = exiger('../scripts/genMiroirAquaLayer.cjs') as {
  RAMPE: Record<string, string>;
  FAMILLES_MARQUE: string[];
  FAMILLES_SEMANTIQUES: string[];
  construireCouche: () => { css: string; classes: Array<{ classe: string; prop: string; marche: string }> };
  releverClasses: () => Array<{ classe: string; occurrences: number }>;
  DEBUT: string;
  FIN: string;
};

const RACINE = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');

/** Luminance relative WCAG d'une couleur hexadécimale. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const canaux = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canaux[0] + 0.7152 * canaux[1] + 0.0722 * canaux[2];
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function extraireCouche(): string {
  const debut = HTML.indexOf(generateur.DEBUT);
  const fin = HTML.indexOf(generateur.FIN);
  expect(debut, "le bloc généré doit exister dans index.html").toBeGreaterThan(-1);
  expect(fin, "la fin du bloc généré doit exister dans index.html").toBeGreaterThan(debut);
  return HTML.slice(debut + generateur.DEBUT.length, fin);
}

describe("DS-EX — couche de traduction aqua", () => {
  it("est à jour : régénérer ne change rien (aucune classe de marque oubliée)", () => {
    const { css } = generateur.construireCouche();
    // Comparaison sur le contenu normalisé : c'est le seul moyen de prouver
    // qu'AUCUNE classe bleue ajoutée depuis la génération n'est restée sans
    // traduction. Si ce test échoue, la correction n'est pas de l'assouplir —
    // c'est de relancer `node scripts/genMiroirAquaLayer.cjs --ecrire`.
    const normaliser = (t: string) => t.replace(/\s+/g, ' ').trim();
    expect(normaliser(extraireCouche())).toBe(normaliser(css));
  });

  it("ne traduit AUCUNE famille sémantique ni aucun gris", () => {
    const couche = extraireCouche();
    for (const famille of generateur.FAMILLES_SEMANTIQUES) {
      const motif = new RegExp(`-${famille}-(?:50|100|200|300|400|500|600|700|800|900|950)\\b`);
      expect(
        motif.test(couche),
        `la famille « ${famille} » ne doit jamais être traduite : sa couleur EST l'information`,
      ).toBe(false);
    }
  });

  it("ne traduit que des classes réellement présentes dans le code (zéro règle morte)", () => {
    const relevees = new Set(generateur.releverClasses().map((c) => c.classe));
    const { classes } = generateur.construireCouche();
    expect(classes.length).toBeGreaterThan(300);
    for (const entree of classes) {
      expect(relevees.has(entree.classe), `règle morte : ${entree.classe}`).toBe(true);
    }
  });

  it("chaque règle reste dans le périmètre [data-miroir]", () => {
    const couche = extraireCouche();
    const regles = couche
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes('{') && !l.startsWith('/*') && !l.startsWith('*'));
    expect(regles.length).toBeGreaterThan(300);
    for (const regle of regles) {
      // Le sélecteur peut être précédé d'une requête média, jamais autre chose.
      const selecteur = regle.replace(/^@media[^{]+\{/, '');
      expect(
        selecteur.startsWith('[data-miroir]'),
        `règle hors périmètre : ${regle.slice(0, 120)}`,
      ).toBe(true);
    }
  });

  it("la rampe aqua tient les planchers de contraste, marche par marche", () => {
    const BLANC = '#FFFFFF';
    // L'abysse réel du Studio Live, le fond sombre sur lequel les marches
    // claires sont employées (mesuré en DS-L1, pas supposé ici).
    const ABYSSE = '#0A2430';

    // Les marches FONCÉES portent du texte sur fond clair.
    for (const marche of ['600', '700', '800', '900', '950']) {
      const ratio = contraste(generateur.RAMPE[marche], BLANC);
      expect(ratio, `aqua-${marche} sur blanc = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
    // Les marches CLAIRES portent du texte sur le fond sombre du Studio.
    for (const marche of ['200', '300', '400']) {
      const ratio = contraste(generateur.RAMPE[marche], ABYSSE);
      expect(ratio, `aqua-${marche} sur l'abysse = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
    // Le cas croisé le plus courant de l'application : un libellé d'accent
    // foncé posé sur une pastille d'accent très claire (`text-blue-600` sur
    // `bg-blue-50`), qui existe réellement dans le code.
    const croise = contraste(generateur.RAMPE['600'], generateur.RAMPE['50']);
    expect(croise, `aqua-600 sur aqua-50 = ${croise.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });

  it("conserve l'échelle de clarté : la rampe est strictement décroissante", () => {
    // C'est la propriété qui garantit qu'une teinte claire reste claire et une
    // teinte foncée reste foncée — donc que le contraste est préservé par
    // construction plutôt que par chance, y compris sur les écrans sombres.
    const marches = Object.keys(generateur.RAMPE)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 1; i < marches.length; i += 1) {
      const avant = luminance(generateur.RAMPE[String(marches[i - 1])]);
      const apres = luminance(generateur.RAMPE[String(marches[i])]);
      expect(apres, `aqua-${marches[i]} doit être plus sombre que aqua-${marches[i - 1]}`).toBeLessThan(avant);
    }
  });
});

describe("DS-EX — la nappe d'eau visible dans toute l'application", () => {
  it("le repère `mir-page` existe dans Layout.tsx et cible l'écran courant", () => {
    const layout = fs.readFileSync(path.join(RACINE, 'components', 'Layout.tsx'), 'utf8');
    expect(layout).toContain('mir-page');
    // Le repère doit envelopper `{children}` : c'est ce qui garantit que la
    // règle vise la racine de l'écran, et pas un champ de saisie plus bas.
    expect(layout).toMatch(/mir-page[^>]*>\s*\{?\s*\n?\s*\{children\}/);
  });

  it("neutralise le fond pleine page seulement pour l'ENFANT DIRECT de l'écran", () => {
    // `>` est ce qui empêche la règle d'atteindre les champs de saisie et les
    // listes déroulantes, qui emploient les mêmes classes plus bas dans l'arbre.
    for (const classe of ['bg-white', 'bg-slate-50', 'bg-slate-100', 'bg-gray-50']) {
      expect(HTML).toContain(`[data-miroir] .mir-page > [class*="${classe}"]`);
    }
  });

  it("habille aussi les modales, rendues hors de `.mir-page` par Layout", () => {
    // Les modales de navigation sont rendues par `Layout` À CÔTÉ de <main>.
    // La règle de matière doit donc porter sur `[data-miroir]` et non sur
    // `.mir-page`, sans quoi elles resteraient des panneaux blancs francs.
    const materiau = HTML.slice(HTML.indexOf('DS-EX-2'), HTML.indexOf(generateur.DEBUT));
    expect(materiau).toContain('[data-miroir] .bg-white.rounded-3xl');
    expect(materiau).not.toContain('[data-miroir] .mir-page .bg-white.rounded-3xl');
  });

  it("ne transforme en carte de verre que ce qui a un rayon de CARTE", () => {
    // Un champ de saisie est en `rounded-xl` ou moins : le distinguer par le
    // rayon évite de rendre translucide une zone de saisie, où l'opacité sert
    // directement la lisibilité.
    expect(HTML).toContain('[data-miroir] .bg-white.rounded-3xl');
    expect(HTML).toContain('[data-miroir] .bg-white.rounded-2xl');
    expect(HTML).not.toContain('[data-miroir] .bg-white.rounded-xl {');
  });

  it("prévoit le repli sans transparence", () => {
    const bloc = HTML.slice(HTML.indexOf('DS-EX-2'), HTML.indexOf(generateur.DEBUT));
    expect(bloc).toContain('prefers-reduced-transparency');
    expect(bloc).toContain('var(--mir-panel-solid)');
  });
});

describe("DS-EX — la barre latérale (styles en ligne, hors de portée du CSS)", () => {
  // La barre latérale peint par des styles EN LIGNE issus de `palette-10` :
  // aucune règle CSS ne peut les atteindre, quelle que soit sa spécificité.
  // C'est pourquoi elle restait bleu nuit au milieu d'un chrome aqua, et
  // pourquoi le correctif touche les VALEURS de la palette et non le CSS.
  const TOKENS = fs.readFileSync(path.join(RACINE, 'components', 'ui', 'DesignTokens.ts'), 'utf8');
  const palette10 = TOKENS.slice(TOKENS.indexOf("id: 'palette-10'"));

  function valeur(cle: string): string {
    const m = palette10.match(new RegExp(`${cle}:\\s*'(#[0-9A-Fa-f]{6})'`));
    if (!m) throw new Error(`clé introuvable dans palette-10 : ${cle}`);
    return m[1];
  }

  it("tient les planchers de contraste sur les couples réellement affichés", () => {
    const couples: Array<[string, string, string]> = [
      ['texte de la barre sur son fond', valeur('sidebarText'), valeur('sidebarBg')],
      ['texte atténué sur le fond de la barre', valeur('sidebarTextMuted'), valeur('sidebarBg')],
      ['texte actif (blanc) sur la pastille active', valeur('sidebarActiveText'), valeur('sidebarActiveBg')],
      ["texte principal sur le fond de l'application", valeur('textPrimary'), valeur('background')],
      ["texte secondaire sur le fond de l'application", valeur('textSecondary'), valeur('background')],
    ];
    for (const [nom, avant, fond] of couples) {
      const ratio = contraste(avant, fond);
      expect(ratio, `${nom} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("a bien quitté la famille bleue pour la famille aqua", () => {
    // Critère objectif plutôt qu'un jugement d'œil : sur une teinte aqua le
    // canal vert dépasse le rouge d'au moins autant que le bleu dépasse le
    // vert — ce qui est faux d'un bleu franc, où le bleu écrase le vert.
    for (const cle of ['sidebarBg', 'sidebarActiveBg', 'primary', 'secondary', 'accent']) {
      const hex = valeur(cle);
      const n = parseInt(hex.slice(1), 16);
      const [r, v, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      expect(v, `${cle} (${hex}) : le vert doit dépasser le rouge`).toBeGreaterThan(r);
      expect(v - r, `${cle} (${hex}) : teinte aqua et non bleu franc`).toBeGreaterThanOrEqual((b - v) * 0.9);
    }
  });

  it("ne touche à aucune des neuf autres palettes", () => {
    // Le gel décidé au Chantier 3 portait sur le SÉLECTEUR de palettes, pas
    // sur les valeurs de la palette retenue : les neuf autres restent telles
    // quelles, prêtes pour le futur sélecteur de l'Administrateur Général.
    const avantPalette10 = TOKENS.slice(0, TOKENS.indexOf("id: 'palette-10'"));
    // Les identifiants sont écrits sur deux chiffres (`palette-01`…) — vérifié
    // dans le fichier, pas supposé : une première version de ce test cherchait
    // `palette-1` et échouait alors que le code était juste.
    for (const n of ['01', '02', '03', '04', '05', '06', '07', '08', '09']) {
      expect(avantPalette10, `palette-${n} doit rester présente`).toContain(`id: 'palette-${n}'`);
    }
    expect(TOKENS).toContain("DEFAULT_PALETTE_ID = 'palette-10'");
    // Et surtout : aucune des valeurs aqua introduites ici n'a fui vers les
    // neuf autres palettes, qui gardent chacune leur identité propre.
    for (const teinte of ['#062733', '#0B3A4A', '#0A7590', '#0F4B5E', '#EAF7FB']) {
      expect(avantPalette10, `${teinte} ne doit exister que dans palette-10`).not.toContain(teinte);
    }
  });
});
