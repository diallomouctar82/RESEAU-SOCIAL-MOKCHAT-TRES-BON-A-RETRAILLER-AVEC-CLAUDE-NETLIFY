// Sonde de la modale « Assistant IA » : voile, carte, enfants, titre, en-tete, pied, bouton, et couleur calculee de chaque texte (DEC-2026-080).
// usage : PORT=<port du serveur Vite> node sonde-modale.cjs > <etat>-sonde.json  (ordinateur 1440x900 et telephone 390x844)
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const out = {};
  for (const vue of [{ name: 'ordinateur', viewport: { width: 1440, height: 900 } }, { name: 'telephone', viewport: { width: 390, height: 844 }, mobile: true }]) {
    const ctx = await browser.newContext({ viewport: vue.viewport, isMobile: !!vue.mobile, hasTouch: !!vue.mobile, deviceScaleFactor: 1, locale: 'fr-FR' });
    await ctx.route('**/images.unsplash.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }));
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${process.env.PORT}/preview-harness.html?tab=social`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('[data-testid="composeur-a7"]', { timeout: 60000 });
    await page.locator('[data-testid="composeur-a7"] textarea').fill('Bonjour, soyez les bienvenus');
    await page.getByRole('button', { name: 'Améliorer le style' }).first().click();
    await page.getByRole('button', { name: /Appliquer à ma publication/ }).waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(1500);
    out[vue.name] = await page.evaluate(() => {
      const bouton = Array.from(document.querySelectorAll('button')).find((b) => /Appliquer à ma publication/.test(b.textContent || ''));
      const fond = bouton.closest('.fixed.inset-0');
      const carte = fond.firstElementChild;
      const r = (el) => { const b = el.getBoundingClientRect(); return { y: Math.round(b.top), h: Math.round(b.height), l: Math.round(b.width) }; };
      const cs = (el, props) => Object.fromEntries(props.map((p) => [p, getComputedStyle(el)[p]]));
      const h3 = carte.querySelector('h3');
      const pied = bouton.parentElement;
      const enfants = Array.from(carte.children).map((c) => ({ cls: String(c.className).slice(0, 30), ...r(c) }));
      return {
        fondRect: (() => { const b = fond.getBoundingClientRect(); return { y: Math.round(b.top), h: Math.round(b.height), l: Math.round(b.width), fenetre: innerHeight, bas: Math.round(b.bottom) }; })(), blocConteneur: (() => { let p = fond.parentElement; const out = []; while (p && p !== document.body) { const s = getComputedStyle(p); if (s.transform !== 'none' || s.backdropFilter !== 'none' || s.filter !== 'none' || s.perspective !== 'none' || s.willChange.includes('transform') || s.contain.includes('paint') || s.contain.includes('layout')) out.push({ tag: p.tagName, cls: String(p.className).slice(0, 50), transform: s.transform, backdropFilter: s.backdropFilter, filter: s.filter, willChange: s.willChange, contain: s.contain, y: Math.round(p.getBoundingClientRect().top) }); p = p.parentElement; } return out; })(),
        fond: { ...cs(fond, ['fontFamily', 'fontSize', 'lineHeight', 'color', 'zIndex']), dansBody: fond.parentElement === document.body, miroir: fond.hasAttribute('data-miroir'), racineMiroir: !!fond.closest('[data-miroir]') },
        carte: { ...r(carte), ...cs(carte, ['maxHeight', 'fontFamily', 'background', 'backgroundColor', 'backdropFilter', 'borderColor', 'boxShadow']) },
        enfants,
        h3: { ...r(h3), ...cs(h3, ['fontFamily', 'fontSize', 'lineHeight', 'fontWeight']) },
        entete: cs(h3.closest('div[class*="bg-gradient"]') || h3.parentElement, ['backgroundImage']),
        pied: { ...r(pied), ...cs(pied, ['paddingBottom', 'paddingTop']) },
        bouton: { ...r(bouton), ...cs(bouton, ['fontFamily', 'fontSize', 'backgroundImage']) },
        textes: Array.from(carte.querySelectorAll('*')).filter((el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())).map((el) => ({ t: (el.textContent || '').trim().slice(0, 24), tag: el.tagName, color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor })),
      };
    });
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
