#!/usr/bin/env node
/**
 * Générateur de la couche de traduction « Miroir d'eau » (mission DS-EX).
 *
 * POURQUOI UN GÉNÉRATEUR ET PAS DU CSS ÉCRIT À LA MAIN
 * L'application emploie ~215 utilitaires distincts des familles de marque
 * (blue/indigo/sky/cyan), répartis sur ~2400 occurrences dans `components/`.
 * Écrits à la main, deux défauts sont certains : des règles mortes (une classe
 * remappée qui n'existe plus) et des oublis (une classe ajoutée plus tard qui
 * reste bleue au milieu d'un écran aqua). Le générateur lit le code réel ; le
 * garde-fou `tests/miroirAquaLayer.test.ts` régénère et compare, donc une
 * classe bleue ajoutée demain fait échouer la suite au lieu de passer inaperçue.
 *
 * LE PRINCIPE DE TRADUCTION — l'échelle de clarté est conservée
 * Mesure faite avant d'écrire une ligne : sur fond clair l'application emploie
 * les marches FONCÉES (`text-blue-600`), et dans le Studio Live, qui est sombre,
 * les marches CLAIRES (`text-indigo-300/400`). Un remplacement à plat par une
 * seule couleur d'accent casserait donc le contraste d'un côté ou de l'autre.
 * La rampe aqua ci-dessous est construite marche par marche pour avoir une
 * LUMINANCE comparable à la marche Tailwind qu'elle remplace : le contraste est
 * préservé par construction, pas par chance. Le garde-fou le vérifie par calcul.
 *
 * LA SPÉCIFICITÉ PLUTÔT QUE L'ORDRE
 * Tailwind est servi par CDN et injecte ses règles à l'exécution : rien ne doit
 * dépendre de l'ordre des feuilles de style (piège déjà consigné en DS-L1). Les
 * règles générées sont préfixées par `[data-miroir]`, soit une spécificité
 * (0,2,0) contre (0,1,0) pour l'utilitaire Tailwind — elles gagnent quel que
 * soit l'ordre d'injection.
 *
 * CE QUI N'EST JAMAIS TRADUIT
 * Les familles SÉMANTIQUES (red, rose, amber, orange, yellow, green, emerald,
 * teal, lime) portent un sens — danger, alerte, succès — qui n'est pas une
 * couleur de marque : les repeindre en aqua effacerait l'information. `slate`
 * et les autres gris portent le texte et les neutres. Aucune n'entre ici.
 */

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');

/**
 * Rampe aqua. Chaque marche est choisie pour une luminance relative proche de
 * la marche Tailwind `blue-N` correspondante (valeurs vérifiées par le
 * garde-fou, qui recalcule les contrastes plutôt que de faire confiance à ce
 * commentaire).
 */
const RAMPE = {
  50: '#ECFAFD',
  100: '#CBF0FA',
  200: '#A5E4F5',
  300: '#5ECBE7',
  400: '#29B4D6',
  500: '#0C90B2',
  600: '#0A7590',
  700: '#086077',
  800: '#094E60',
  900: '#0A404F',
  950: '#06262F',
};

/** Familles de marque traduites. Toute autre famille est laissée intacte. */
const FAMILLES_MARQUE = ['blue', 'indigo', 'sky', 'cyan'];

/**
 * Familles interdites dans la couche. Le garde-fou vérifie qu'aucune n'y
 * apparaît : une régression silencieuse ici effacerait un signal de danger.
 */
const FAMILLES_SEMANTIQUES = [
  'red', 'rose', 'amber', 'orange', 'yellow',
  'green', 'emerald', 'teal', 'lime', 'slate', 'gray', 'zinc', 'neutral', 'stone',
];

/** Propriétés Tailwind prises en charge → génération CSS. */
const PROPRIETES = {
  bg: (c) => `background-color:${c};`,
  text: (c) => `color:${c};`,
  border: (c) => `border-color:${c};`,
  // Relevées par la mesure : sans elles, 10 éléments seraient restés bleus au
  // milieu d'un écran aqua. L'alternance du motif est triée par longueur
  // décroissante, sinon `ring` mangerait `ring-offset` et `border` `border-t`.
  'ring-offset': (c) => `--tw-ring-offset-color:${c};`,
  'border-t': (c) => `border-top-color:${c};`,
  'border-b': (c) => `border-bottom-color:${c};`,
  'border-l': (c) => `border-left-color:${c};`,
  'border-r': (c) => `border-right-color:${c};`,
  ring: (c) => `--tw-ring-color:${c};`,
  shadow: (c) => `--tw-shadow-color:${c};--tw-shadow:var(--tw-shadow-colored);`,
  fill: (c) => `fill:${c};`,
  stroke: (c) => `stroke:${c};`,
  outline: (c) => `outline-color:${c};`,
  accent: (c) => `accent-color:${c};`,
  caret: (c) => `caret-color:${c};`,
  decoration: (c) => `text-decoration-color:${c};`,
  // Les dégradés passent par les variables de Tailwind : `--tw-gradient-stops`
  // les référence, donc redéfinir les bornes suffit — inutile de reconstruire
  // le dégradé entier, ce qui casserait les positions personnalisées.
  from: (c) => `--tw-gradient-from:${c} var(--tw-gradient-from-position);--tw-gradient-to:rgb(255 255 255 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to);`,
  to: (c) => `--tw-gradient-to:${c} var(--tw-gradient-to-position);`,
  via: (c) => `--tw-gradient-to:rgb(255 255 255 / 0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),${c} var(--tw-gradient-via-position),var(--tw-gradient-to);`,
};

/** Points de rupture Tailwind par défaut (config inline d'`index.html`). */
const RUPTURES = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

/** Variantes d'état prises en charge → suffixe de sélecteur. */
const ETATS = {
  hover: (sel) => `${sel}:hover`,
  focus: (sel) => `${sel}:focus`,
  'focus-within': (sel) => `${sel}:focus-within`,
  active: (sel) => `${sel}:active`,
  disabled: (sel) => `${sel}:disabled`,
  'group-hover': (sel) => `.group:hover ${sel}`,
  'peer-focus': (sel) => `.peer:focus ~ ${sel}`,
  placeholder: (sel) => `${sel}::placeholder`,
  before: (sel) => `${sel}::before`,
  after: (sel) => `${sel}::after`,
};

function hexVersRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Couleur finale d'une marche, avec modificateur d'opacité Tailwind éventuel. */
function couleur(marche, opacite) {
  const hex = RAMPE[marche];
  if (opacite == null) return hex;
  const [r, v, b] = hexVersRgb(hex);
  // `rgba()` littéral plutôt que `color-mix()` : `color-mix()` n'est pas garanti
  // sur Safari 16.0 (limite déjà rencontrée et consignée en DS-L1).
  return `rgba(${r},${v},${b},${(Number(opacite) / 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')})`;
}

/** Échappe une classe Tailwind pour l'employer comme sélecteur CSS. */
function echapper(classe) {
  return classe.replace(/([:/.])/g, '\\$1');
}

function fichiersSources() {
  const sortie = [];
  const ignorer = new Set(['node_modules', 'dist', 'design-lab', '.git', 'scripts', 'tests']);
  (function parcourir(dossier) {
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      if (ignorer.has(entree.name)) continue;
      const chemin = path.join(dossier, entree.name);
      if (entree.isDirectory()) parcourir(chemin);
      else if (/\.(tsx|ts)$/.test(entree.name)) sortie.push(chemin);
    }
  })(RACINE);
  return sortie;
}

/** Relève toutes les classes de marque réellement présentes dans le code. */
function releverClasses() {
  const prefixes = [
    ...Object.keys(ETATS),
    ...Object.keys(RUPTURES),
  ].join('|');
  // Tri par longueur décroissante : l'alternance d'une expression régulière
  // JavaScript retient la PREMIÈRE branche qui correspond, donc `ring` placé
  // avant `ring-offset` capturerait `ring-offset-blue-500` comme un `ring`.
  const props = Object.keys(PROPRIETES)
    .sort((a, b) => b.length - a.length)
    .join('|');
  const familles = FAMILLES_MARQUE.join('|');
  const motif = new RegExp(
    `\\b((?:(?:${prefixes}):){0,2})(${props})-(${familles})-(50|100|200|300|400|500|600|700|800|900|950)(?:/(\\d{1,3}))?\\b`,
    'g',
  );

  const trouvees = new Map();
  for (const fichier of fichiersSources()) {
    const texte = fs.readFileSync(fichier, 'utf8');
    let m;
    while ((m = motif.exec(texte)) !== null) {
      const [complet, variantes, prop, , marche, opacite] = m;
      const cle = complet;
      if (!trouvees.has(cle)) {
        trouvees.set(cle, {
          classe: complet,
          variantes: variantes ? variantes.split(':').filter(Boolean) : [],
          prop,
          marche,
          opacite: opacite ?? null,
          occurrences: 0,
        });
      }
      trouvees.get(cle).occurrences += 1;
    }
  }
  return [...trouvees.values()].sort((a, b) => a.classe.localeCompare(b.classe));
}

/** Construit la règle CSS d'une classe relevée. */
function regle(entree) {
  const rupture = entree.variantes.find((v) => RUPTURES[v]);
  const etats = entree.variantes.filter((v) => ETATS[v]);

  // Le sélecteur d'état est construit AVANT le préfixe de périmètre : sinon
  // `group-hover` produirait `.group:hover [data-miroir] .x`, qui place
  // `[data-miroir]` au milieu et sort donc du périmètre voulu (défaut trouvé
  // en relisant la sortie du générateur, avant toute écriture).
  let selecteur = `.${echapper(entree.classe)}`;
  for (const etat of etats) selecteur = ETATS[etat](selecteur);
  selecteur = `[data-miroir] ${selecteur}`;

  const declarations = PROPRIETES[entree.prop](couleur(entree.marche, entree.opacite));
  const corps = `${selecteur}{${declarations}}`;
  return rupture ? `@media (min-width:${RUPTURES[rupture]}px){${corps}}` : corps;
}

function construireCouche() {
  const classes = releverClasses();
  const lignes = [];

  lignes.push('      /* ===================================================================');
  lignes.push('         COUCHE DE TRADUCTION AQUA — GÉNÉRÉE, NE PAS ÉDITER À LA MAIN.');
  lignes.push('         Régénérer : node scripts/genMiroirAquaLayer.cjs --ecrire');
  lignes.push('         Vérifiée par tests/miroirAquaLayer.test.ts (règles mortes,');
  lignes.push('         familles sémantiques, planchers de contraste).');
  lignes.push('');
  lignes.push('         Traduit les familles de marque (blue/indigo/sky/cyan) vers la');
  lignes.push("         rampe aqua du « Miroir d'eau », EN CONSERVANT LA MARCHE : une");
  lignes.push('         teinte claire reste claire (Studio Live, fond sombre), une teinte');
  lignes.push('         foncée reste foncée (écrans clairs). Le contraste est donc');
  lignes.push('         préservé par construction.');
  lignes.push('');
  lignes.push('         Les familles sémantiques (red/amber/green…) et les gris ne sont');
  lignes.push("         JAMAIS traduits : leur couleur EST l'information.");
  lignes.push('         =================================================================== */');
  lignes.push(`      [data-miroir] {`);
  for (const [marche, hex] of Object.entries(RAMPE)) {
    lignes.push(`        --mir-aq-${marche}: ${hex};`);
  }
  lignes.push(`      }`);
  for (const entree of classes) lignes.push(`      ${regle(entree)}`);

  return { css: lignes.join('\n'), classes };
}

const DEBUT = '      /* ===== DÉBUT COUCHE AQUA GÉNÉRÉE ===== */';
const FIN = '      /* ===== FIN COUCHE AQUA GÉNÉRÉE ===== */';

function ecrireDansIndex(css) {
  const chemin = path.join(RACINE, 'index.html');
  const html = fs.readFileSync(chemin, 'utf8');
  const bloc = `${DEBUT}\n${css}\n${FIN}`;

  let sortie;
  if (html.includes(DEBUT)) {
    const debut = html.indexOf(DEBUT);
    const fin = html.indexOf(FIN) + FIN.length;
    sortie = html.slice(0, debut) + bloc + html.slice(fin);
  } else {
    const ancre = html.lastIndexOf('    </style>');
    if (ancre === -1) throw new Error("Impossible de trouver </style> dans index.html");
    sortie = `${html.slice(0, ancre)}${bloc}\n${html.slice(ancre)}`;
  }
  fs.writeFileSync(chemin, sortie);
}

module.exports = {
  RAMPE,
  FAMILLES_MARQUE,
  FAMILLES_SEMANTIQUES,
  PROPRIETES,
  construireCouche,
  releverClasses,
  DEBUT,
  FIN,
};

if (require.main === module) {
  const { css, classes } = construireCouche();
  if (process.argv.includes('--ecrire')) {
    ecrireDansIndex(css);
    console.log(`Couche écrite dans index.html — ${classes.length} classes traduites.`);
  } else {
    console.log(`${classes.length} classes de marque relevées.`);
    const parProp = {};
    for (const c of classes) parProp[c.prop] = (parProp[c.prop] || 0) + 1;
    console.log(parProp);
  }
}
