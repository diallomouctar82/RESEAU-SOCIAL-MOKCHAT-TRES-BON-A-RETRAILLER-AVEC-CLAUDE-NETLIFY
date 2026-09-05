// Captures et mesures de la page /architecte (cadre rond) : repos + vidéo, trois écrans. Usage: node capture-architecte.cjs <dossier> <etiquette>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:5177'; const OUT = process.argv[2]; const TAG = process.argv[3] || 'avant';
fs.mkdirSync(OUT, { recursive: true });
const tailwind = fs.readFileSync('/tmp/tailwind.js', 'utf8');
const ECRANS = [['ordinateur-1440x900', 1440, 900, 1], ['tablette-820x1180', 820, 1180, 2], ['telephone-390x844', 390, 844, 2]];
const lumBande = `(c, y0, y1) => { const ctx = c.getContext('2d'); const W = c.width, H = c.height; const d = ctx.getImageData(Math.round(W*0.35), Math.round(H*y0), Math.round(W*0.3), Math.max(1, Math.round(H*(y1-y0)))).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]; return Math.round(s / (d.length/4)); }`;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const resultats = [];
  for (const [nom, w, h, dpr] of ECRANS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 500, hasTouch: w < 900, locale: 'fr-FR' });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
    await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => { const url = route.request().url(); if (/cdn\.tailwindcss\.com/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: tailwind }); return route.abort(); });
    await p.goto(BASE + '/architecte', { waitUntil: 'load', timeout: 120000 });
    const canvas = p.locator('canvas[data-portrait-src]').first();
    await canvas.waitFor({ timeout: 60000 });
    await p.waitForTimeout(2500);
    const mesure = await p.evaluate((lum) => { const f = eval(lum); const c = document.querySelector('canvas[data-portrait-src]'); const r = c.getBoundingClientRect(); return { cadre: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, canvas: { W: c.width, H: c.height }, portrait: { luminanceHaut2a8pct: f(c, 0.02, 0.08), luminanceHaut8a12pct: f(c, 0.08, 0.12), luminanceSousBande14a20pct: f(c, 0.14, 0.20) }, src: c.getAttribute('data-portrait-src') }; }, lumBande);
    await p.screenshot({ path: path.join(OUT, `${TAG}-${nom}-repos.jpg`), type: 'jpeg', quality: 85 });
    let video = null;
    const bouton = p.getByRole('button', { name: /Voir l.avatar vidéo/ });
    if (await bouton.count()) {
      await bouton.first().click(); await p.waitForTimeout(1800);
      video = await p.evaluate((lum) => { const f = eval(lum); const v = document.querySelector('video[data-testid="architecte-sequence-video"]'); if (!v) return null; const cv = document.createElement('canvas'); cv.width = v.videoWidth || 1; cv.height = v.videoHeight || 1; cv.getContext('2d').drawImage(v, 0, 0); return { statut: v.getAttribute('data-sequence-status'), temps: Math.round(v.currentTime * 100) / 100, src: (v.currentSrc || '').split('/').pop(), dimensions: `${v.videoWidth}x${v.videoHeight}`, luminanceHaut2a8pct: f(cv, 0.02, 0.08), luminanceHaut8a12pct: f(cv, 0.08, 0.12), luminanceSousBande14a20pct: f(cv, 0.14, 0.20) }; }, lumBande);
      await p.screenshot({ path: path.join(OUT, `${TAG}-${nom}-video.jpg`), type: 'jpeg', quality: 85 });
    }
    resultats.push({ ecran: nom, ...mesure, video, erreurs: errs.filter(e => !/Supabase|VITE_SUPABASE|ERR_FAILED|favicon|WebSocket|404/.test(e)).slice(0, 5) });
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, `${TAG}-mesures.json`), JSON.stringify(resultats, null, 2)); console.log(JSON.stringify(resultats, null, 2));
  await browser.close();
})().catch(e => { console.error('ECHEC', e); process.exit(1); });
