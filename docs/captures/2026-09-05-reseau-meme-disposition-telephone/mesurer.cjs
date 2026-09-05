// Captures + mesures « même disposition ordinateur / téléphone » (DEC-2026-078, v6.40.0) :
// composeur A7 et bande Aurore du Réseau MOC, sur le harnais non versionné
// `preview-harness.html?tab=social` (gabarit : scripts/production-controlee/preview-harness.tsx.example).
//
// Rejouer (voir .claude/skills/production-controlee/SKILL.md § 5 et § 9.1) :
//   1. harnais : sed -e 's#src="/index.tsx"#src="/preview-harness.tsx"#' -e 's#https://cdn.tailwindcss.com#/tailwind-play.js#' index.html > preview-harness.html
//   2. serveurs : `npx vite --port 3000 --strictPort` (après) ; worktree `origin/main` + même harnais sur `--port 3001` (avant).
//      Ne jamais lancer `npm run build` pendant qu'un serveur tourne : le cache partagé node_modules/.vite est réécrit
//      et la page charge deux copies de React (« Invalid hook call »).
//   3. depuis un dossier hors dépôt qui possède `playwright` (Chromium en /opt/pw-browsers/chromium) :
//      PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1 ETAT=apres PORT=3000 node <ce fichier> <dossier-sortie>
//      PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1 ETAT=avant PORT=3001 node <ce fichier> <dossier-sortie>
// Sortie : PNG par écran (page, composeur, bande, saisie sur téléphone) et `<etat>-mesures.json`.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const ETAT = process.env.ETAT || 'apres';
const PORT = process.env.PORT || '3000';
const VUES = [
  { name: 'ordinateur', viewport: { width: 1440, height: 900 } },
  { name: 'tablette', viewport: { width: 820, height: 1180 }, mobile: true },
  { name: 'telephone', viewport: { width: 390, height: 844 }, mobile: true },
  { name: 'android360', viewport: { width: 360, height: 800 }, mobile: true },
  { name: 'iphone375', viewport: { width: 375, height: 667 }, mobile: true },
  { name: 'etroit', viewport: { width: 320, height: 568 }, mobile: true },
];
const BRUITS = [/unsplash/i, /favicon/i, /net::ERR/i, /Failed to load resource/i, /supabase/i, /websocket/i, /ResizeObserver/i];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const mesures = {};
  for (const vue of VUES) {
    const ctx = await browser.newContext({ viewport: vue.viewport, isMobile: !!vue.mobile, hasTouch: !!vue.mobile, deviceScaleFactor: vue.mobile ? 2 : 1, ignoreHTTPSErrors: true, locale: 'fr-FR' });
    await ctx.route('**/images.unsplash.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }));
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(String(e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error' && !BRUITS.some((b) => b.test(m.text()))) erreurs.push('console: ' + m.text()); });
    await page.goto(`http://localhost:${PORT}/preview-harness.html?tab=social`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('[data-testid="composeur-a7"]', { timeout: 60000 });
    await page.waitForSelector('[data-testid="acces-rapide"]', { timeout: 60000 });
    await page.waitForTimeout(1500);
    const comp = page.locator('[data-testid="composeur-a7"]');
    const bande = page.locator('[data-testid="acces-rapide"]');
    await comp.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -12));
    await page.waitForTimeout(400);

    const mesurer = () => page.evaluate(() => {
      const visible = (el) => { if (!el) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const boite = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.left + scrollX), y: Math.round(b.top + scrollY), l: Math.round(b.width), h: Math.round(b.height) }; };
      const nom = (b) => b.getAttribute('aria-label') || (b.textContent || '').trim();
      const comp = document.querySelector('[data-testid="composeur-a7"]');
      const bande = document.querySelector('[data-testid="acces-rapide"]');
      const rangee = bande.querySelector('.aurore-rangee');
      const avatar = comp.querySelector('img');
      const champ = comp.querySelector('textarea');
      const rail = comp.querySelector('.a7-rail');
      const bas = comp.querySelector('.a7-medias-bas');
      const groupe = comp.querySelector('.a7-groupe');
      const corps = comp.querySelector('.a7-corps');
      const boutonsComp = Array.from(comp.querySelectorAll('button')).filter(visible);
      const actions = Array.from(comp.querySelectorAll('[role="group"][aria-label="Assistant IA"] button')).filter(visible);
      const orbes = Array.from(bande.querySelectorAll('.aurore-orbe'));
      const orbesVisibles = orbes.filter(visible);
      const petits = (liste) => liste.filter((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height) < 44; }).map((b) => `${nom(b)} ${Math.round(b.getBoundingClientRect().width)}×${Math.round(b.getBoundingClientRect().height)}`);
      const horsEcran = (liste) => liste.filter((b) => { const r = b.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1; }).map(nom);
      // Rangées : éléments triés par gauche ; une nouvelle rangée commence quand la gauche recule.
      const rangs = (liste) => { const tri = liste.map((b) => b.getBoundingClientRect()).sort((a, b) => a.top - b.top || a.left - b.left); let n = tri.length ? 1 : 0; for (let i = 1; i < tri.length; i++) if (tri[i].left <= tri[i - 1].left) n++; return n; };
      const colonnes = (liste) => new Set(liste.map((b) => Math.round(b.getBoundingClientRect().left / 4))).size;
      // Le groupe Brouillon | Publier dépasse-t-il de sa colonne ?
      const gr = groupe.getBoundingClientRect(), cr = corps.getBoundingClientRect();
      return {
        ecran: { largeur: innerWidth, hauteur: innerHeight },
        debordementHorizontalPage: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        composeur: {
          boite: boite(comp),
          conteneurLargeur: Math.round(comp.clientWidth - parseFloat(getComputedStyle(comp).paddingLeft) - parseFloat(getComputedStyle(comp).paddingRight)),
          avatar: avatar ? { ...boite(avatar), classes: avatar.className } : null,
          champ: { ...boite(champ), placeholder: champ.placeholder, minHeight: getComputedStyle(champ).minHeight },
          railVisible: visible(rail),
          railLibelles: rail ? Array.from(rail.querySelectorAll('.a7-lb')).filter(visible).map((s) => s.textContent) : [],
          railBoite: rail && visible(rail) ? boite(rail) : null,
          ligneBasVisible: visible(bas),
          ligneBasLibelles: bas ? Array.from(bas.querySelectorAll('.a7-lb')).filter(visible).map((s) => s.textContent) : [],
          intituleAssistantVisible: visible(comp.querySelector('.a7-lab')),
          actionsIA: actions.map(nom),
          actionsIALibellesVisibles: actions.map((b) => visible(b.querySelector('.a7-lb'))),
          actionsIARangees: rangs(actions),
          groupe: { l: Math.round(gr.width), h: Math.round(gr.height), deborde: gr.right > cr.right + 1 || gr.left < cr.left - 1 },
          boutonsVisibles: boutonsComp.map(nom),
          nbBoutonsVisibles: boutonsComp.length,
          horsEcran: horsEcran(boutonsComp),
          ciblesSous44: petits(boutonsComp),
          compteurVisible: visible(comp.querySelector('.a7-compteur')),
          selects: Array.from(comp.querySelectorAll('select')).filter(visible).length,
          gabaritColonnes: getComputedStyle(comp.querySelector('.a7-grille')).gridTemplateColumns,
        },
        bande: {
          boite: boite(bande),
          nbOrbes: orbes.length,
          nbOrbesVisibles: orbesVisibles.length,
          noms: orbesVisibles.map(nom),
          rangees: rangs(orbesVisibles),
          colonnes: colonnes(orbesVisibles),
          defilementHorizontal: rangee.scrollWidth > rangee.clientWidth + 1,
          overflowX: getComputedStyle(rangee).overflowX,
          affichage: getComputedStyle(rangee).display,
          horsEcran: horsEcran(orbesVisibles),
          ciblesSous44: petits(orbesVisibles),
          bulle: (() => { const o = bande.querySelector('.aurore-bulle'); const r = o.getBoundingClientRect(); return { l: Math.round(r.width), h: Math.round(r.height) }; })(),
          libellesVisibles: orbesVisibles.map((b) => { const l = b.querySelector('.aurore-libelle'), c = b.querySelector('.aurore-court'); return visible(l) ? l.textContent : visible(c) ? c.textContent : ''; }),
          derniereOrbeDansLaCarte: (() => { const d = orbesVisibles[orbesVisibles.length - 1]; if (!d) return null; return d.getBoundingClientRect().bottom <= bande.getBoundingClientRect().bottom + 0.5; })(),
        },
      };
    });

    const m = await mesurer();
    await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}.png`), fullPage: false });
    await comp.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-composeur.png`) });
    await bande.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -12));
    await page.waitForTimeout(400);
    await bande.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-bande.png`) });
    if (vue.mobile && vue.name !== 'tablette') {
      await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-bande-ecran.png`), fullPage: false });
      // Saisie : le champ reste utilisable, le compteur suit.
      await comp.evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.evaluate(() => window.scrollBy(0, -12));
      await page.locator('[data-testid="composeur-a7"] textarea').fill('Nouvelle formation numérique ouverte à Conakry : inscriptions cette semaine.');
      await page.waitForTimeout(300);
      m.saisie = await page.evaluate(() => {
        const comp = document.querySelector('[data-testid="composeur-a7"]');
        const publier = Array.from(comp.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Publier');
        return { compteur: (comp.querySelector('.a7-compteur') || {}).textContent || null, publierActif: publier ? !publier.disabled : null };
      });
      await comp.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-saisie.png`) });
    }
    m.erreursJS = erreurs;
    mesures[vue.name] = m;
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${ETAT}-mesures.json`), JSON.stringify(mesures, null, 2));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(mesures).map(([k, v]) => [k, {
    conteneur: v.composeur.conteneurLargeur, debordPage: v.debordementHorizontalPage, railVisible: v.composeur.railVisible, railLibelles: v.composeur.railLibelles.length, ligneBas: v.composeur.ligneBasVisible,
    champL: v.composeur.champ.l, avatar: v.composeur.avatar && `${v.composeur.avatar.x},${v.composeur.avatar.y} ${v.composeur.avatar.l}×${v.composeur.avatar.h}`,
    actionsRangees: v.composeur.actionsIARangees, groupe: `${v.composeur.groupe.l}×${v.composeur.groupe.h}${v.composeur.groupe.deborde ? ' DEBORDE' : ''}`, boutons: v.composeur.nbBoutonsVisibles, horsEcranComp: v.composeur.horsEcran.length, sous44Comp: v.composeur.ciblesSous44.length,
    bandeOrbes: v.bande.nbOrbesVisibles, bandeRangees: v.bande.rangees, bandeColonnes: v.bande.colonnes, bandeDefile: v.bande.defilementHorizontal, bandeHorsEcran: v.bande.horsEcran.length, derniereDansCarte: v.bande.derniereOrbeDansLaCarte, sous44Bande: v.bande.ciblesSous44.length, erreurs: v.erreursJS.length,
  }])), null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
