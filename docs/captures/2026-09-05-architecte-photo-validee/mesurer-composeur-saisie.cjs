// Fil réel (harnais) : avant / pendant la saisie dans le composeur / après « Publier » — la sculpture se retire-t-elle ?
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = 'http://127.0.0.1:5177'; const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const tailwind = fs.readFileSync('/tmp/tailwind.js', 'utf8');
const MESURE = `(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const inter = (a, b) => { if (!a || !b) return 0; const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)); const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); return x * y; };
  const s = document.querySelector('[data-testid="architecte-flottant"]'); const sculpture = r(s);
  const publier = [...document.querySelectorAll('button')].find((b) => /^Publier/.test(b.textContent?.trim() || ''));
  const bp = r(publier); const centre = bp ? document.elementFromPoint(bp.x + bp.w / 2, bp.y + bp.h / 2) : null;
  const coin = bp ? document.elementFromPoint(bp.x + bp.w - 6, bp.y + bp.h / 2) : null;
  return { retrait: document.querySelector('[data-testid="architecte-ancrage"]')?.dataset.retrait ?? null, sculpture, publier: bp, recouvrementPx2: inter(sculpture, bp),
    centreAtteignable: !!(centre && publier && (centre === publier || publier.contains(centre))), coinDroitAtteignable: !!(coin && publier && (coin === publier || publier.contains(coin))) };
})()`;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [w, h] of [[390, 844], [360, 800]]) {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
    await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => /cdn\.tailwindcss\.com/.test(route.request().url()) ? route.fulfill({ status: 200, contentType: 'application/javascript', body: tailwind }) : route.abort());
    await p.goto(BASE + '/preview-harness.html?tab=social', { waitUntil: 'load', timeout: 120000 });
    await p.getByTestId('architecte-flottant').waitFor({ timeout: 60000 }); await p.waitForTimeout(1200);
    const avant = await p.evaluate(MESURE); await p.screenshot({ path: path.join(OUT, `${w}x${h}-1-repos.jpg`), type: 'jpeg', quality: 80 });
    const champ = p.locator('textarea').first(); await champ.click(); await champ.type('Bonjour le réseau, ceci est une publication de preuve.'); await p.waitForTimeout(500);
    const pendant = await p.evaluate(MESURE); await p.screenshot({ path: path.join(OUT, `${w}x${h}-2-saisie.jpg`), type: 'jpeg', quality: 80 });
    // Sortie du champ (le clic sur « Publier » suit) : la sculpture attend encore.
    await p.evaluate(() => { const a = document.activeElement; if (a && 'blur' in a) a.blur(); }); await p.waitForTimeout(120);
    const juste_apres = await p.evaluate(MESURE);
    await p.waitForTimeout(700);
    const apres = await p.evaluate(MESURE); await p.screenshot({ path: path.join(OUT, `${w}x${h}-3-apres.jpg`), type: 'jpeg', quality: 80 });
    console.log(JSON.stringify({ ecran: `${w}x${h}`, avant, pendant, juste_apres, apres, erreurs: errs.slice(0, 3) }));
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error('ECHEC', e); process.exit(1); });
