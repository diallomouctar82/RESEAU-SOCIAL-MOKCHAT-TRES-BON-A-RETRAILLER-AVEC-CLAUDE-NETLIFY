// Taille du panneau « Assistant IA » sur telephone : plusieurs ecrans, hauteur reduite (clavier) et zoom de page
// (Emulation.setPageScaleFactor, equivalent du zoom automatique d'iOS au focus d'un champ < 16 px).
// usage : SHA=<sha> ETAT=avant|apres PORT=<port> node taille.cjs <dossier-sortie>  (harnais preview-harness.html?tab=social, meme code que l application)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const ETAT = process.env.ETAT || 'apres';
const PORT = process.env.PORT || '3000';
const CAS = [
  { name: 'iphone-se1-320x568', viewport: { width: 320, height: 568 }, mobile: true },
  { name: 'android-360x640', viewport: { width: 360, height: 640 }, mobile: true },
  { name: 'iphone-se-375x667', viewport: { width: 375, height: 667 }, mobile: true },
  { name: 'iphone-390x844', viewport: { width: 390, height: 844 }, mobile: true },
  { name: 'android-412x915', viewport: { width: 412, height: 915 }, mobile: true },
  { name: 'iphone-390x500-clavier', viewport: { width: 390, height: 500 }, mobile: true },
  { name: 'iphone-390x844-zoom150', viewport: { width: 390, height: 844 }, mobile: true, zoom: 1.5 },
  { name: 'iphone-375x667-zoom133', viewport: { width: 375, height: 667 }, mobile: true, zoom: 1.33 },
  { name: 'ordinateur-1440x900', viewport: { width: 1440, height: 900 } },
];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const res = { _meta: { etat: ETAT, sha: process.env.SHA || null, date: new Date().toISOString() } };
  for (const cas of CAS) {
    const ctx = await browser.newContext({ viewport: cas.viewport, isMobile: !!cas.mobile, hasTouch: !!cas.mobile, deviceScaleFactor: cas.mobile ? 2 : 1, locale: 'fr-FR' });
    await ctx.route('**/images.unsplash.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }));
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(String(e.message || e).slice(0, 120)));
    await page.goto(`http://localhost:${PORT}/preview-harness.html?tab=social`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('[data-testid="composeur-a7"]', { timeout: 60000 });
    const champ = page.locator('[data-testid="composeur-a7"] textarea');
    await champ.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await champ.fill('Bonjour, soyez les bienvenus');
    const policeChamp = await champ.evaluate((el) => getComputedStyle(el).fontSize);
    if (cas.zoom) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: cas.zoom }); await page.waitForTimeout(300); }
    await page.getByRole('button', { name: 'Améliorer le style' }).first().click();
    const appliquer = page.getByRole('button', { name: /Appliquer à ma publication/ });
    await appliquer.waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => {
      const bouton = Array.from(document.querySelectorAll('button')).find((b) => /Appliquer à ma publication/.test(b.textContent || ''));
      const fond = bouton.closest('.fixed.inset-0') || bouton.closest('.ia-fond');
      const carte = fond.firstElementChild;
      const vv = window.visualViewport;
      const visible = { x: vv.offsetLeft, y: vv.offsetTop, w: vv.width, h: vv.height, echelle: vv.scale };
      const r = (el) => { const b = el.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), bas: Math.round(b.bottom) }; };
      const dans = (b) => b.x >= visible.x - 1 && b.y >= visible.y - 1 && b.x + b.w <= visible.x + visible.w + 1 && b.bas <= visible.y + visible.h + 1;
      const cb = r(carte), bb = r(bouton), fb = r(fond);
      const zone = carte.querySelector('.overflow-y-auto');
      const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
      const sous = document.elementFromPoint(cx, cy);
      return {
        visible, fenetreDisposition: { w: innerWidth, h: innerHeight },
        fond: fb, carte: cb, bouton: bb,
        carteDansLaZoneVisible: dans(cb), boutonDansLaZoneVisible: dans(bb), fondCouvreLaZoneVisible: fb.x <= visible.x + 1 && fb.y <= visible.y + 1 && fb.x + fb.w >= visible.x + visible.w - 1 && fb.bas >= visible.y + visible.h - 1,
        zoneDefilante: zone ? { h: Math.round(zone.clientHeight), contenu: Math.round(zone.scrollHeight), defile: zone.scrollHeight > zone.clientHeight + 1 } : null,
        boutonSousLeDoigt: !!(sous && sous.closest('button') && /Appliquer/.test(sous.closest('button').textContent || '')),
        maxHeightCarte: getComputedStyle(carte).maxHeight,
        debordementCarte: { scrollLeft: carte.scrollLeft, scrollWidth: carte.scrollWidth, clientWidth: carte.clientWidth, deborde: carte.scrollWidth > carte.clientWidth + 1 },
        plusLarges: Array.from(carte.querySelectorAll('*')).filter((el) => el.getBoundingClientRect().right > cb.x + cb.w + 1 || el.getBoundingClientRect().left < cb.x - 1).slice(0, 4).map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 40), l: Math.round(el.getBoundingClientRect().left), r: Math.round(el.getBoundingClientRect().right) })),
      };
    });
    await page.screenshot({ path: path.join(OUT, `${ETAT}-${cas.name}.png`), fullPage: false });
    res[cas.name] = { ecran: cas.viewport, zoom: cas.zoom || 1, policeChamp, ...m, erreursJS: erreurs };
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${ETAT}-taille.json`), JSON.stringify(res, null, 2));
  for (const [k, v] of Object.entries(res)) { if (k.startsWith('_')) continue; console.log(k, 'police', v.policeChamp, 'visible', JSON.stringify(v.visible), 'carte', JSON.stringify(v.carte), 'carteVisible', v.carteDansLaZoneVisible, 'boutonVisible', v.boutonDansLaZoneVisible, 'fondCouvre', v.fondCouvreLaZoneVisible, 'sousLeDoigt', v.boutonSousLeDoigt, 'defile', v.zoneDefilante && v.zoneDefilante.defile, 'maxH', v.maxHeightCarte, 'debordeX', v.debordementCarte.deborde, 'scrollLeft', v.debordementCarte.scrollLeft, 'horsCarte', JSON.stringify(v.plusLarges), 'err', v.erreursJS.length); }
})().catch((e) => { console.error(e); process.exit(1); });
