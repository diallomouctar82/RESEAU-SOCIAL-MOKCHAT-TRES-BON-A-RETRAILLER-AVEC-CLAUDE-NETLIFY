// Calage vidéo ↔ portrait (méthode DEC-2026-073, repères par le moteur de production) :
// pupilles du portrait livré et de l'image 1 de la vidéo → échelle, origine, décalage (registre `alignment`).
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = 'http://127.0.0.1:5177'; const WASM_DIR = process.env.WASM_DIR; const FRAME = process.argv[2];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await browser.newPage();
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    const url = route.request().url(); const m = url.match(/tasks-vision@[\d.]+\/wasm\/([\w.-]+)$/);
    if (m && WASM_DIR) { const f = path.join(WASM_DIR, m[1]); if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: f.endsWith('.wasm') ? 'application/wasm' : 'application/javascript', body: fs.readFileSync(f) }); }
    return route.abort();
  });
  await p.route(BASE + '/__image-1.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(FRAME) }));
  await p.goto(BASE + '/design-lab/banc/reperes.html', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof window.__reperes === 'function');
  const portrait = await p.evaluate((u) => window.__reperes(u), '/architecte/architecte.webp');
  const image1 = await p.evaluate((u) => window.__reperes(u), '/__image-1.png');
  const pct = (r) => ({ lx: 100 * r.left.x, ly: 100 * r.left.y, rx: 100 * r.right.x, ry: 100 * r.right.y, mx: 50 * (r.left.x + r.right.x), my: 50 * (r.left.y + r.right.y), gap: 100 * (r.right.x - r.left.x) });
  const P = pct(portrait), F = pct(image1);
  const alignment = { scale: +(P.gap / F.gap).toFixed(4), originXPercent: +F.mx.toFixed(2), originYPercent: +F.my.toFixed(2), dxPercent: +(P.mx - F.mx).toFixed(2), dyPercent: +(P.my - F.my).toFixed(2) };
  console.log(JSON.stringify({ portrait: { ...P, size: portrait.width, landmarks: portrait.landmarks }, image1: { ...F, size: image1.width, landmarks: image1.landmarks }, alignment }, null, 2));
  await browser.close();
})().catch((e) => { console.error('ECHEC', e); process.exit(1); });
