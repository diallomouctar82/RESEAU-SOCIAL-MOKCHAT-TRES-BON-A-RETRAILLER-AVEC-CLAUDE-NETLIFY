// Compare deux sorties de sonde-modale.cjs (avant / apres) : proprietes identiques, differentes, textes.
// usage : node comparer-sondes.cjs avant-sonde.json apres-sonde.json > sonde-comparaison.txt
const path = require('path');
const a = require(path.resolve(process.argv[2]));
const b = require(path.resolve(process.argv[3]));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, x]) => (x && typeof x === 'object' && !Array.isArray(x) ? flat(x, p + k + '.') : [[p + k, JSON.stringify(x)]]));
for (const v of Object.keys(a)) {
  const fa = Object.fromEntries(flat(a[v]));
  const fb = Object.fromEntries(flat(b[v]));
  const diff = Object.keys(fa).filter((k) => fa[k] !== fb[k]);
  console.log(`### ${v} : ${Object.keys(fa).length - diff.length} identiques, ${diff.length} différentes`);
  for (const k of diff) console.log(`  ${k}\n    avant ${String(fa[k]).slice(0, 200)}\n    apres ${String(fb[k]).slice(0, 200)}`);
  const A = a[v].textes || [];
  const B = b[v].textes || [];
  let n = 0;
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] || {};
    const y = B[i] || {};
    if (x.t !== y.t || x.color !== y.color || x.bg !== y.bg) { n++; console.log('  texte ≠', JSON.stringify(x), '→', JSON.stringify(y)); }
  }
  console.log(`  textes : ${A.length} avant, ${B.length} après, ${n} différence(s) de couleur ou de fond`);
}
