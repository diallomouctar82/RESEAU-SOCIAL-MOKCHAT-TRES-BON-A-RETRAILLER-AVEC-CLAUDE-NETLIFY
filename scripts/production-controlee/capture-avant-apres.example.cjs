// GABARIT Playwright de captures avant/après + mesures (exemple : composeur A7 et studio Visuel IA).
// À copier hors dépôt (dossier disposant de playwright), à adapter (sélecteurs, mesures, gestes).
// usage: ETAT=avant|apres PORT=3000 PHOTO=/chemin/photo.jpg node capture-a7.cjs <dossier-sortie>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const ETAT = process.env.ETAT || 'apres';
const PORT = process.env.PORT || '3000';
const PHOTO = process.env.PHOTO;
const VUES = [
  { name: 'ordinateur', viewport: { width: 1440, height: 900 } },
  { name: 'tablette', viewport: { width: 820, height: 1180 }, mobile: true },
  { name: 'telephone', viewport: { width: 390, height: 844 }, mobile: true },
];
const SEL_COMP = ETAT === 'apres' ? '[data-testid="composeur-a7"]' : 'textarea[placeholder^="Quoi de neuf"]';

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const mesures = {};
  for (const vue of VUES) {
    const ctx = await browser.newContext({ viewport: vue.viewport, isMobile: !!vue.mobile, hasTouch: !!vue.mobile, deviceScaleFactor: vue.mobile ? 2 : 1, ignoreHTTPSErrors: true, locale: 'fr-FR' });
    await ctx.route('**/images.unsplash.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }));
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(String(e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') erreurs.push('console: ' + m.text()); });
    await page.goto(`http://localhost:${PORT}/preview-harness.html?tab=social`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector(SEL_COMP, { timeout: 60000 });
    await page.waitForTimeout(1500);
    const comp = ETAT === 'apres' ? page.locator('[data-testid="composeur-a7"]') : page.locator('textarea[placeholder^="Quoi de neuf"]').locator('xpath=ancestor::div[contains(@class,"mir-sheet")][1]');
    await comp.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -12));
    await page.waitForTimeout(500);
    const m = await page.evaluate((etat) => {
      const comp = etat === 'apres' ? document.querySelector('[data-testid="composeur-a7"]') : document.querySelector('textarea[placeholder^="Quoi de neuf"]').closest('.mir-sheet');
      const r = comp.getBoundingClientRect();
      const visible = (el) => { if (!el) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const boutons = Array.from(comp.querySelectorAll('button')).filter(visible);
      const noms = boutons.map((b) => b.getAttribute('aria-label') || (b.textContent || '').trim());
      const horsEcran = boutons.filter((b) => { const x = b.getBoundingClientRect(); return x.right > innerWidth + 1 || x.left < -1; }).map((b) => b.getAttribute('aria-label') || b.textContent.trim());
      const avatar = comp.querySelector('img');
      const ar = avatar ? avatar.getBoundingClientRect() : null;
      const champ = comp.querySelector('textarea');
      const cr = champ.getBoundingClientRect();
      const rail = comp.querySelector('.a7-rail'), bas = comp.querySelector('.a7-medias-bas');
      return {
        composeur: { largeur: Math.round(r.width), hauteur: Math.round(r.height), top: Math.round(r.top) },
        avatar: ar ? { l: Math.round(ar.width), h: Math.round(ar.height), classes: avatar.className } : null,
        champ: { l: Math.round(cr.width), h: Math.round(cr.height), placeholder: champ.placeholder },
        boutonsVisibles: noms,
        nbBoutons: boutons.length,
        horsEcran,
        railVisible: rail ? visible(rail) : null,
        basVisible: bas ? visible(bas) : null,
        selects: Array.from(comp.querySelectorAll('select')).map((s) => s.options[s.selectedIndex].textContent),
        compteur: (comp.querySelector('.a7-compteur') || {}).textContent || null,
        compteurVisible: visible(comp.querySelector('.a7-compteur')),
        debordeX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        orbe: (() => { const o = comp.querySelector('.a7-orbe'); if (!o) return null; const b = o.getBoundingClientRect(); return { l: Math.round(b.width), h: Math.round(b.height), radius: getComputedStyle(o).borderRadius }; })(),
        police: (() => { const p = comp.querySelector('.a7-publier'); return p ? getComputedStyle(p).fontFamily.split(',')[0] : null; })(),
        ciblesPetites: boutons.filter((b) => { const x = b.getBoundingClientRect(); return x.width < 40 || x.height < 40; }).map((b) => `${b.getAttribute('aria-label') || b.textContent.trim()} ${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`),
      };
    }, ETAT);
    m.erreursJS = erreurs.filter((e) => !/unsplash|favicon|net::ERR|Failed to load resource|WebSocket|Supabase|supabase|VITE_|ResizeObserver/i.test(e));
    mesures[vue.name] = m;
    await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}.png`), fullPage: false });
    await comp.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-composeur.png`) });

    if (ETAT === 'apres') {
      // Saisie + survol (ordinateur)
      await page.locator('[data-testid="composeur-a7"] textarea').fill('Retour du campus : trois enseignements sur le financement des projets étudiants en Afrique de l\'Ouest.');
      await page.waitForTimeout(300);
      if (!vue.mobile) {
        const cible = page.locator('[data-testid="a7-rail"] button').nth(1);
        const box = await cible.boundingBox();
        if (box) { await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.4, { steps: 6 }); await page.waitForTimeout(450); }
      }
      await comp.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-saisie.png`) });
      m.apresSaisie = await page.evaluate(() => ({ compteur: document.querySelector('.a7-compteur')?.textContent, publierActif: !document.querySelector('.a7-publier').disabled, brouillonActif: !document.querySelector('.a7-brouillon').disabled }));
      await page.mouse.move(5, 5);

      // Modale IA sur l'onglet Traduire
      await page.locator('[data-testid="composeur-a7"] button[aria-label="Traduire"]').click();
      await page.waitForTimeout(700);
      m.modaleTraduire = await page.evaluate(() => ({ titre: !!Array.from(document.querySelectorAll('h3')).find((h) => /Assistant IA Pré-Publication Mooc/.test(h.textContent)), ongletLangue: !!Array.from(document.querySelectorAll('label')).find((l) => /Choisissez la langue cible/.test(l.textContent)) }));
      await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-modale-traduire.png`), fullPage: false });
      await page.locator('div.fixed.inset-0.z-50 button:has(svg.lucide-x)').first().click();
      await page.waitForTimeout(500);
      m.modaleFermee = await page.evaluate(() => !Array.from(document.querySelectorAll('h3')).find((x) => /Assistant IA Pré-Publication Mooc/.test(x.textContent)));

      // Photo jointe puis studio Visuel IA
      if (PHOTO) {
        await page.locator('[data-testid="composeur-a7"] input[accept="image/*"]').setInputFiles(PHOTO);
        await page.waitForTimeout(600);
        await comp.evaluate((el) => el.scrollIntoView({ block: 'start' }));
        await page.waitForTimeout(300);
        await comp.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-photo-jointe.png`) });
        await page.locator('[data-testid="composeur-a7"] button[aria-label="Visuel IA"]').click();
        await page.waitForSelector('canvas.vis-canvas', { timeout: 20000 });
        await page.waitForTimeout(700);
        m.studio = await page.evaluate(() => {
          const d = document.querySelector('[role="dialog"][aria-label^="Visuel IA"]');
          const r = d.getBoundingClientRect();
          const c = document.querySelector('canvas.vis-canvas');
          return { present: !!d, inertRacine: document.getElementById('root').hasAttribute('inert'), feuille: { l: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) }, canvas: { l: c.width, h: c.height }, focus: document.activeElement && document.activeElement.className, modes: Array.from(d.querySelectorAll('.vis-modes button')).map((b) => `${b.textContent}:${b.getAttribute('aria-pressed')}`), familles: Array.from(d.querySelectorAll('.vis-outils button')).map((b) => `${b.textContent}${b.disabled ? ' (inactif)' : ''}`), debordeX: d.scrollWidth > d.clientWidth + 1 };
        });
        await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-studio-prompt.png`), fullPage: false });
        // Intention guidee + reglages manuels + look + titre
        await page.locator('.vis-intentions button', { hasText: 'Portrait pro' }).click();
        await page.locator('.vis-outils button', { hasText: 'Cinéma' }).click();
        await page.locator('.vis-puces[aria-label="Look"] button', { hasText: 'Golden hour' }).click();
        await page.locator('input[aria-label="Vignette"]').fill('35');
        await page.locator('.vis-outils button', { hasText: 'Texte' }).click();
        await page.locator('input[aria-label="Titre sur l\'image"]').fill('Campus, saison 2026');
        await page.locator('input[aria-label="Sous-titre"]').fill('Trois enseignements sur le financement');
        await page.waitForTimeout(500);
        m.studioReglages = await page.evaluate(() => ({ badge: document.querySelector('.vis-badge').textContent, reinitialiserActif: !document.querySelector('.vis-pied .vis-secondaire').disabled, insererActif: !document.querySelector('.vis-inserer').disabled }));
        await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-studio-manuel.png`), fullPage: false });
        // Avant / apres
        await page.locator('.vis-avap button', { hasText: 'Avant' }).click();
        await page.waitForTimeout(300);
        await page.locator('.vis-apercu').screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-studio-avant.png`) });
        await page.locator('.vis-avap button', { hasText: 'Après' }).click();
        await page.waitForTimeout(300);
        await page.locator('.vis-apercu').screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-studio-apres.png`) });
        // Insertion
        await page.locator('.vis-inserer').click();
        await page.waitForSelector('[data-testid="visuel-ia-studio"]', { state: 'detached', timeout: 30000 });
        await page.waitForTimeout(600);
        m.insertion = await page.evaluate(() => { const img = document.querySelector('[data-testid="composeur-a7"] img.w-full'); return { image: img ? img.getAttribute('src').slice(0, 5) : null, studioFerme: !document.querySelector('[data-testid="visuel-ia-studio"]'), inertRetire: !document.getElementById('root').hasAttribute('inert'), publierActif: !document.querySelector('.a7-publier').disabled }; });
        await comp.evaluate((el) => el.scrollIntoView({ block: 'start' }));
        await page.waitForTimeout(300);
        await comp.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-inseree.png`) });
      }
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, `${ETAT}-mesures.json`), JSON.stringify(mesures, null, 2));
  console.log(JSON.stringify(mesures, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
