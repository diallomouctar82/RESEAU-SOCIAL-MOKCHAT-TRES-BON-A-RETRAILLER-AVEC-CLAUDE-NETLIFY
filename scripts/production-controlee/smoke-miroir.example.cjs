// GABARIT Playwright de fumée sur un miroir local (preview ou production) : racine React montée, règles CSS analysées, captures.
// À copier hors dépôt (dossier disposant de playwright), à adapter (sélecteurs, conteneurs).
const { chromium } = require('playwright');
const OUT = process.argv[2]; const PORT = process.argv[3] || '3006'; const TAG = process.argv[4] || 'preview93';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } });
  const out = [];
  for (const v of [{ n: 'ordinateur', w: 1440, h: 900 }, { n: 'telephone', w: 390, h: 844, m: true }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, isMobile: !!v.m, hasTouch: !!v.m, ignoreHTTPSErrors: true, locale: 'fr-FR' });
    await ctx.addInitScript(() => { try { localStorage.setItem('lmav_session_v2', JSON.stringify({ email: 'direction@moknet.net', name: 'Amadou Diallo', credits: 1000000 })); } catch {} });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 160)));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|supabase|placeholder|vibrate|WebSocket/i.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
    const resp = await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(7000);
    const css = await page.evaluate(() => {
      const regles = Array.from(document.styleSheets).flatMap((s) => { try { return Array.from(s.cssRules); } catch { return []; } });
      const sel = (n) => regles.some((r) => r.selectorText === n);
      const conteneurs = regles.filter((r) => r.constructor && r.constructor.name === 'CSSContainerRule').map((r) => r.conditionText);
      return { racine: document.getElementById('root')?.children.length ?? -1, a7comp: sel('.a7-comp'), a7orbe: sel('.a7-orbe'), visFeuille: sel('.vis-feuille'), visEnfants: sel('.vis-feuille > *'), conteneurs: conteneurs.filter((c) => /a7|aurore/.test(c)), texte: document.body.innerText.replace(/\s+/g, ' ').slice(0, 60) };
    });
    let comp = null, studio = null;
    try {
      const lien = page.locator('nav button, aside button, a').filter({ hasText: /^Réseau MOC$/ }).first();
      if (await lien.count()) {
        await lien.click({ timeout: 5000 });
        await page.waitForSelector('[data-testid="composeur-a7"]', { timeout: 20000 }); await page.waitForTimeout(1200);
        await page.evaluate(() => document.querySelector('[data-testid="composeur-a7"]').scrollIntoView({ block: 'start' }));
        comp = await page.evaluate(() => {
          const c = document.querySelector('[data-testid="composeur-a7"]');
          const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
          const bs = Array.from(c.querySelectorAll('button')).filter(vis);
          const o = c.querySelector('.a7-rail .a7-orbe, .a7-medias-bas .a7-orbe');
          return { boutons: bs.length, libelles: bs.map((x) => x.getAttribute('aria-label') || x.textContent.trim()), rail: vis(c.querySelector('.a7-rail')), bas: vis(c.querySelector('.a7-medias-bas')), orbe: o ? Math.round(o.getBoundingClientRect().width) : null, avatar: c.querySelector('img')?.className, invite: c.querySelector('textarea')?.placeholder.slice(0, 14), largeurCarte: Math.round(c.getBoundingClientRect().width), ciblesPetites: bs.filter((b) => b.getBoundingClientRect().height < 40).length };
        });
        await page.screenshot({ path: `${OUT}/${TAG}-${v.n}-composeur.png` });
        await page.locator('[data-testid="composeur-a7"] button[aria-label="Visuel IA"]').click();
        await page.waitForSelector('[data-testid="visuel-ia-studio"]', { timeout: 10000 }); await page.waitForTimeout(800);
        studio = await page.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-label^="Visuel IA"]'); const r = d.getBoundingClientRect(); return { present: !!d, dansBody: d.closest('#root') === null, inert: document.getElementById('root').hasAttribute('inert'), focus: document.activeElement?.className, feuille: `${Math.round(r.width)}x${Math.round(r.height)}`, modes: Array.from(d.querySelectorAll('.vis-modes button')).map((b) => b.textContent).join('/'), familles: d.querySelectorAll('.vis-outils button').length, sansPhoto: /Aucune photo jointe/.test(d.textContent), generer: !!Array.from(d.querySelectorAll('button')).find((b) => /Générer depuis le texte/.test(b.textContent)) }; });
        await page.screenshot({ path: `${OUT}/${TAG}-${v.n}-studio.png` });
        await page.keyboard.press('Escape'); await page.waitForTimeout(500);
        studio.fermeParEchap = await page.evaluate(() => !document.querySelector('[data-testid="visuel-ia-studio"]') && !document.getElementById('root').hasAttribute('inert'));
      }
    } catch (e) { comp = comp || { erreur: e.message.slice(0, 160) }; studio = studio || { erreur: e.message.slice(0, 160) }; }
    out.push(`${v.n}: http ${resp.status()} ; racine React montée: ${css.racine > 0} ; erreurs JS: ${errs.length}${errs.length ? ' ' + JSON.stringify(errs.slice(0, 3)) : ''} ; règles .a7-comp/.a7-orbe/.vis-feuille/.vis-feuille>*: ${css.a7comp}/${css.a7orbe}/${css.visFeuille}/${css.visEnfants} ; @container: ${css.conteneurs.join(' | ')} ; composeur: ${JSON.stringify(comp)} ; studio: ${JSON.stringify(studio)}`);
    await ctx.close();
  }
  await browser.close();
  console.log(out.join('\n'));
})().catch((e) => { console.error('SMOKE ERREUR', e.message); process.exit(1); });
