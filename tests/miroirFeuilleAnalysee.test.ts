import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';

/**
 * Garde-fou de la FEUILLE ANALYSÉE — et non de son texte.
 *
 * Pourquoi ce fichier existe : le garde-fou précédent vérifiait que le TEXTE
 * d'`index.html` contenait bien `[data-miroir] .bg-white.rounded-3xl`. Il est
 * resté vert alors que la règle ne parvenait JAMAIS au navigateur : un
 * commentaire CSS refermé une ligne trop tôt laissait six lignes de prose dans
 * la feuille, prose que l'analyseur agglutinait au sélecteur suivant pour en
 * faire un sélecteur invalide — donc une règle silencieusement jetée.
 *
 * Vérifié sur la page réellement servie par l'aperçu Netlify avant correction :
 * `[data-miroir] .bg-white.rounded-3xl` était ABSENT du CSSOM (0 occurrence sur
 * 668 règles), tandis que le texte, lui, était bien là.
 *
 * C'est la quatrième occurrence dans ce dépôt de la même famille de piège :
 * une déclaration qui ne peint rien SANS LE DIRE (`-webkit-box-reflect: none`
 * ignoré par Chromium, teintes `brand-*` absentes de la config Tailwind,
 * `hidden sm:flex` annulé par un `flex` nu). D'où un test qui ANALYSE au lieu
 * de chercher une chaîne de caractères.
 */

const RACINE = join(__dirname, '..');
const HTML = readFileSync(join(RACINE, 'index.html'), 'utf8');

/**
 * Le contenu des vraies balises <style> d'index.html.
 *
 * L'ouverture et la fermeture sont ancrées en début de ligne : un commentaire
 * JavaScript du bloc de configuration Tailwind cite le mot `<style>` en texte,
 * et une expression non ancrée y accrochait le script tout entier.
 */
function feuilleDeStyle(): string {
  const blocs = [...HTML.matchAll(/^[ \t]*<style[^>]*>\r?\n([\s\S]*?)^[ \t]*<\/style>/gm)].map((m) => m[1]);
  expect(blocs.length, 'index.html doit contenir au moins un bloc <style>').toBeGreaterThan(0);
  return blocs.join('\n');
}

/** Tous les sélecteurs réellement produits par l'analyseur. */
function selecteursAnalyses(): string[] {
  const racine = postcss.parse(feuilleDeStyle());
  const sortie: string[] = [];
  racine.walkRules((regle) => {
    for (const s of regle.selectors) sortie.push(s.trim());
  });
  return sortie;
}

/**
 * Un sélecteur écrit à la main ne contient jamais de prose. Ces marques-là
 * n'apparaissent que si du texte a fui hors d'un commentaire.
 */
const MARQUES_DE_PROSE = ['`', '«', '»', '—', '*/', 'é', 'è', 'à', 'ç', 'û'];

describe("la feuille de style d'index.html, telle qu'un navigateur l'analyse", () => {
  it("ne contient aucun sélecteur fabriqué à partir de prose échappée d'un commentaire", () => {
    const fautifs = selecteursAnalyses()
      .filter((s) => MARQUES_DE_PROSE.some((m) => s.includes(m)))
      .map((s) => `${s.length} car. — ${s.slice(0, 120)}…`);
    expect(fautifs, 'un commentaire mal fermé fait avaler la règle qui suit').toEqual([]);
  });

  it("n'a aucun sélecteur d'une longueur invraisemblable (signature d'une règle avalée)", () => {
    const trop = selecteursAnalyses().filter((s) => s.length > 200);
    expect(trop.map((s) => s.slice(0, 100)), 'sélecteur anormalement long').toEqual([]);
  });

  it("produit RÉELLEMENT les règles de matière de l'habillage « Miroir d'eau »", () => {
    const sels = selecteursAnalyses();
    // Les cartes de contenu : la règle la plus large de l'habillage.
    expect(sels, "la règle « cartes en verre » doit exister APRÈS analyse").toContain(
      '[data-miroir] .bg-white.rounded-3xl',
    );
    expect(sels).toContain('[data-miroir] .bg-white.rounded-2xl');
    // Les barres de section.
    expect(sels).toContain('[data-miroir] .bg-white.border-b');
    // La racine d'écran, qui laisse passer la nappe d'eau.
    expect(sels.some((s) => s.startsWith('[data-miroir] .mir-page >'))).toBe(true);
  });

  it("produit RÉELLEMENT la couche de traduction aqua (pas seulement son texte)", () => {
    const sels = selecteursAnalyses();
    const aqua = sels.filter((s) => /^\[data-miroir\] \.(bg|text|border|from|to|via|ring|fill|stroke)-/.test(s));
    // La couche générée compte plusieurs centaines de règles : en dessous de
    // 200 sélecteurs analysés, c'est qu'un bloc entier a été avalé.
    expect(aqua.length, 'couche aqua analysée trop courte — un bloc a été avalé').toBeGreaterThan(200);
  });

  it("garde-fou non complaisant : une prose laissée hors commentaire est bien détectée", () => {
    // Contre-épreuve : on reproduit exactement le défaut corrigé et on vérifie
    // que la détection le voit. Sans cela, un test vert ne prouverait rien.
    const casse = `
      /* un commentaire refermé une ligne trop tôt. */
         Périmètre \`[data-miroir]\` et NON \`.mir-page\` : la suite de la prose. */
      [data-miroir] .bg-white.rounded-3xl { background-color: red; }
    `;
    const sels: string[] = [];
    postcss.parse(casse).walkRules((r) => {
      sels.push(...r.selectors.map((s) => s.trim()));
    });
    const detecte = sels.some((s) => MARQUES_DE_PROSE.some((m) => s.includes(m)));
    expect(detecte, 'la détection doit voir le défaut reproduit').toBe(true);
    // Et la règle visée est bien PERDUE dans ce cas.
    expect(sels).not.toContain('[data-miroir] .bg-white.rounded-3xl');
  });
});
