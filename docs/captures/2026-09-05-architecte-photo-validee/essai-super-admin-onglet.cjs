// PREUVE NAVIGATEUR RÉEL — tableau de bord Super-Admin RÉEL (components/AdminDashboard.tsx) :
// onglet « Avatar de l'Architecte » visible sans défilement → option « Créer ou remplacer l'avatar vivant depuis une
// photo » → photo validée → aperçu actuel / nouveau → validation → ENREGISTRÉ (stockage vérifié) → rechargement de la
// page (l'avatar validé est toujours là) → retour arrière → note de renvoi dans « Paramètres Plateforme ».
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:5177'; const OUT = process.argv[2]; const PHOTO = process.argv[3];
const WASM_DIR = process.env.WASM_DIR; fs.mkdirSync(OUT, { recursive: true });
const tailwind = fs.readFileSync('/tmp/tailwind.js', 'utf8');
async function scenario(browser, nom, contexte) {
  const ctx = await browser.newContext(contexte); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
    const url = route.request().url();
    if (/cdn\.tailwindcss\.com/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: tailwind });
    const m = url.match(/tasks-vision@[\d.]+\/wasm\/([\w.-]+)$/);
    if (m && WASM_DIR) { const f = path.join(WASM_DIR, m[1]); if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: f.endsWith('.wasm') ? 'application/wasm' : 'application/javascript', body: fs.readFileSync(f) }); }
    return route.abort();
  });
  const shot = async (n) => p.screenshot({ path: path.join(OUT, `${nom}-${n}.jpg`), type: 'jpeg', quality: 82 });
  const t0 = Date.now(); const etapes = {};
  await p.goto(BASE + '/design-lab/banc/super-admin.html', { waitUntil: 'load', timeout: 120000 });
  const onglet = p.getByTestId('admin-onglet-architecte');
  await onglet.waitFor({ timeout: 60000 }); await p.waitForTimeout(900);
  etapes.tableauDeBord = { ongletVisibleSansDefilement: await onglet.evaluate((el) => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight; }), libelle: (await onglet.textContent())?.trim() };
  await shot('1-tableau-de-bord');
  await onglet.click(); await p.getByTestId('admin-architecte-avatar-tab').waitFor({ timeout: 20000 }); await p.waitForTimeout(700);
  const boutonChoisir = p.getByTestId('avatar-photo-choisir');
  etapes.onglet = { titre: await p.locator('[data-testid="admin-architecte-avatar-tab"] h2').first().textContent(), etat: await p.getByTestId('admin-architecte-avatar-enregistrement').textContent(),
    optionVisibleSansDefilement: await boutonChoisir.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }), optionLibelle: (await boutonChoisir.textContent())?.trim() };
  await shot('2-onglet-avatar-architecte');
  const t1 = Date.now();
  await p.setInputFiles('[data-testid="avatar-photo-fichier"]', PHOTO);
  await p.getByText(/Photo analysée/).waitFor({ timeout: 180000 });
  etapes.analyseMs = Date.now() - t1;
  await p.getByTestId('avatar-photo-apercu').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  etapes.apercu = { statut: await p.getByTestId('avatar-photo-statut').textContent(), avertissements: await p.locator('[data-testid="avatar-photo-avertissements"] li').allTextContents() };
  await shot('3-apercu-actuel-nouveau');
  await p.getByTestId('avatar-photo-valider').click();
  await p.getByText(/Nouvel avatar enregistré/).waitFor({ timeout: 10000 }); await p.waitForTimeout(400);
  etapes.enregistre = { bandeau: await p.getByTestId('admin-architecte-avatar-enregistrement').textContent(),
    stockage: await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('lmav_admin_detailed_settings_v1') || '{}'); const a = s.architecteAvatar || {}; return { photoPrefix: (a.photoUrl || '').slice(0, 22), masquePrefix: (a.silhouetteMaskUrl || '').slice(0, 21), precedent: a.previousAvatar?.photoUrl ?? null, updatedBy: a.updatedBy, updatedAt: a.updatedAt }; }) };
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await shot('4-enregistre');
  await p.reload({ waitUntil: 'load', timeout: 120000 }); await onglet.waitFor({ timeout: 60000 }); await onglet.click();
  await p.getByTestId('admin-architecte-avatar-tab').waitFor({ timeout: 20000 }); await p.waitForTimeout(900);
  etapes.apresRechargement = await p.evaluate(() => { const a = window.__bancSuperAdmin.getArchitecteAvatar(); return { photoPrefix: a.photoUrl.slice(0, 22), retourVisible: !!document.querySelector('[data-testid="avatar-photo-retour"]'), portraitActuel: document.querySelector('[data-testid="avatar-photo"] canvas, [data-testid="architecte-avatar"] canvas')?.getAttribute('data-portrait-src')?.slice(0, 22) ?? null }; });
  await shot('5-apres-rechargement');
  await p.getByTestId('avatar-photo-retour').click(); await p.getByText(/Avatar précédent rétabli/).waitFor({ timeout: 10000 }); await p.waitForTimeout(400);
  etapes.retour = await p.evaluate(() => { const a = window.__bancSuperAdmin.getArchitecteAvatar(); return { photoUrl: a.photoUrl, precedent: a.previousAvatar, bandeau: document.querySelector('[data-testid="admin-architecte-avatar-enregistrement"]')?.textContent }; });
  await shot('6-retour-arriere');
  await p.getByRole('button', { name: /Paramètres Plateforme/ }).click(); const renvoi = p.getByTestId('renvoi-onglet-architecte'); await renvoi.waitFor({ timeout: 20000 }); await renvoi.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  etapes.parametres = { renvoi: (await renvoi.textContent())?.replace(/\s+/g, ' ').trim(), carteEncorePresente: await p.getByTestId('avatar-photo-choisir').count() };
  await shot('7-parametres-plateforme-renvoi');
  console.log(JSON.stringify({ nom, viewport: contexte.viewport, dureeTotaleMs: Date.now() - t0, etapes, erreurs: errs.filter((e) => !/Supabase non configuré|VITE_SUPABASE|ERR_FAILED|404|favicon|XNNPACK/.test(e)).slice(0, 8) }));
  await ctx.close();
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  await scenario(browser, 'ordinateur', { viewport: { width: 1280, height: 800 } });
  await scenario(browser, 'telephone', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await browser.close();
})().catch((e) => { console.error('ECHEC', e); process.exit(1); });
