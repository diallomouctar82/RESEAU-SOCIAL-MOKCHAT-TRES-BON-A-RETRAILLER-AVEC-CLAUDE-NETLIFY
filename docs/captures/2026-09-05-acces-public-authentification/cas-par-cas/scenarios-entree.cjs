// Scénarios d'entrée (avant/après) : par canal (agent utilisateur réel des navigateurs intégrés) et par état de session.
// usage : node scenarios-entree.cjs <dossier-sortie> <base-url> <tag> [canaux=tous|court] [scenarios=tous]
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const OUT = process.argv[2]; const BASE = process.argv[3]; const TAG = process.argv[4] || 'avant';
const CANAUX_MODE = process.argv[5] || 'tous'; const SCEN_MODE = process.argv[6] || 'tous';
fs.mkdirSync(OUT, { recursive: true });
const REF = 'rqciahtpixdjbyoajomg'; const CLE = `sb-${REF}-auth-token`;
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const UID = '11111111-2222-4333-8444-555555555555';
const jwt = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: UID, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3000, session_id: 'banc' }) + '.signature-de-banc';
const sessionExpiree = () => ({ access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) - 7200, refresh_token: 'refresh-perime', user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'banc@moknet.net', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } });
const sessionLocale = { access_token: jwt, token_type: 'bearer', expires_in: 3000, expires_at: Math.floor(Date.now() / 1000) + 3000, refresh_token: 'refresh-de-banc', user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'banc@moknet.net', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } };
const UA = {
  'navigateur-ordinateur': null,
  'navigateur-mobile': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
  'navigateur-tablette': 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'sms-android-webview': 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36',
  'whatsapp-android': 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36 WhatsApp/2.24.18.78',
  'messenger-android': 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/470.0.0.35.115;]',
  'messenger-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21G93 [FBAN/MessengerForiOS;FBAV/470.0.0.35.115;FBDV/iPhone15,2;FBSN/iOS;FBSV/17.6;FBLC/fr_FR]',
  'whatsapp-ios-safariview': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
};
const SCENARIOS = {
  'vierge': { stockage: null, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'profil-local-sans-session': { stockage: { lmav_session_v2: JSON.stringify({ email: 'banc@moknet.net', name: 'Banc Test' }) }, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'session-invalide': { stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'refus-401', attendu: 'ECRAN_AUTHENTIFICATION' },
  'session-valide': { stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'valide', attendu: 'INTERFACE_INTERNE' },
  'session-reseau-coupe': { stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'coupe', attendu: 'INTERFACE_INTERNE (tolérance dite : session locale non expirée, serveur injoignable)' },
  'session-invalide-rejeu': { stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'refus-401', attendu: 'ECRAN_AUTHENTIFICATION', rejeu: true },
  'session-expiree': { stockage: { [CLE]: JSON.stringify(sessionExpiree()) }, reseau: 'refus-401', attendu: 'ECRAN_AUTHENTIFICATION' },
  'deconnexion': { stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'valide', attendu: 'INTERFACE_INTERNE', deconnexion: true },
  'serveur-injoignable-vierge': { stockage: null, reseau: 'coupe', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-live-vierge': { chemin: '?live=live-banc-123', stockage: null, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-invitation-vierge': { chemin: '?invite=ABCD1234', stockage: null, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-messagerie-vierge': { chemin: 'messagerie', stockage: null, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-module-messagerie-vierge': { chemin: '?module=messagerie', stockage: null, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-admin-vierge': { chemin: '#admin', stockage: null, reseau: 'normal', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-live-session-invalide': { chemin: '?live=live-banc-123', stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'refus-401', attendu: 'ECRAN_AUTHENTIFICATION' },
  'lien-prive-live-session-valide': { chemin: '?live=live-banc-123', stockage: { [CLE]: JSON.stringify(sessionLocale) }, reseau: 'valide', attendu: 'INTERFACE_INTERNE' },
  'session-expiree-serveur-injoignable': { stockage: { [CLE]: JSON.stringify(sessionExpiree()) }, reseau: 'coupe', attendu: 'ECRAN_AUTHENTIFICATION', attenteMs: 60000, chrono: true },
  'lien-architecte-vierge': { chemin: 'architecte', stockage: null, reseau: 'normal', attendu: 'PAGE_DEMO_PUBLIQUE (code actuel : DEC-2026-066, avant le verrou — à soumettre à la Direction)' },
};
const canaux = CANAUX_MODE === 'court' ? ['navigateur-ordinateur', 'navigateur-mobile'] : (CANAUX_MODE === 'telephone' ? ['navigateur-mobile'] : (CANAUX_MODE === 'supports' ? ['navigateur-ordinateur', 'navigateur-mobile', 'navigateur-tablette'] : (CANAUX_MODE === 'tous' ? Object.keys(UA) : CANAUX_MODE.split(','))));
const scenarios = SCEN_MODE === 'tous' ? Object.keys(SCENARIOS) : SCEN_MODE.split(',');
const json = (status, body) => ({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }, body: JSON.stringify(body) });
async function routerSupabase(ctx, mode, journal) {
  await ctx.route(`**/${REF}.supabase.co/**`, (route) => {
    const req = route.request(); const u = new URL(req.url()); const p = u.pathname; journal.push(`${req.method()} ${p}${u.search.slice(0, 40)}`);
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (mode === 'coupe') return route.abort('connectionrefused');
    if (p.startsWith('/realtime')) return route.abort('connectionrefused');
    if (mode === 'refus-401') {
      if (p === '/auth/v1/user') return route.fulfill(json(401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT: unable to parse or verify signature' }));
      if (p === '/auth/v1/token') return route.fulfill(json(400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token: Refresh Token Not Found' }));
      if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return route.fulfill(json(401, { code: 'PGRST301', message: 'JWT expired' }));
    }
    // valide
    if (p === '/auth/v1/user') return route.fulfill(json(200, sessionLocale.user));
    if (p === '/auth/v1/token') return route.fulfill(json(200, sessionLocale));
    if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    if (p.startsWith('/rest/v1/profiles')) return route.fulfill(json(200, { id: UID, email: 'banc@moknet.net', name: 'Banc Test', role: 'user', level: 1, xp: 0, next_level_xp: 100, credits: 0, avatar_url: '', preferred_language: 'fr', two_factor_enabled: false, is_verified: false, interests: [] }));
    if (p.startsWith('/rest/v1/rpc/')) return route.fulfill(json(200, null));
    if (p.startsWith('/rest/v1/')) return route.fulfill(json(200, []));
    return route.fulfill(json(200, {}));
  });
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const resultats = {};
  for (const sc of scenarios) {
    const scen = SCENARIOS[sc];
    for (const canal of canaux) {
      const ua = UA[canal]; const mobile = canal !== 'navigateur-ordinateur'; const tablette = canal === 'navigateur-tablette';
      const ctx = await browser.newContext({ viewport: tablette ? { width: 820, height: 1180 } : (mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }), isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1, ignoreHTTPSErrors: true, locale: 'fr-FR', ...(ua ? { userAgent: ua } : {}) });
      const journal = [];
      await routerSupabase(ctx, scen.reseau, journal);
      await ctx.route('**/images.unsplash.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }));
      await ctx.route('**/cdn.jsdelivr.net/**', (r) => r.abort());
      await ctx.route('**/cdn.tailwindcss.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(__dirname, '..', 'tailwind-play.js')) }));
      if (scen.stockage) { const st = scen.stockage; await ctx.addInitScript((st) => { try { if (localStorage.getItem('__banc_seme__')) return; for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); localStorage.setItem('__banc_seme__', '1'); } catch {} }, st); }
      const page = await ctx.newPage();
      const erreurs = [];
      page.on('pageerror', (e) => erreurs.push(String(e.message || e).slice(0, 200)));
      page.on('console', (m) => { if (m.type() === 'error') erreurs.push('console: ' + m.text().slice(0, 200)); });
      let status = null;
      const urlCible = BASE.replace(/\/?$/, '/') + (scen.chemin || '');
      try { const r = await page.goto(urlCible, { waitUntil: 'load', timeout: 90000 }); status = r && r.status(); } catch (e) { erreurs.push('goto: ' + e.message.slice(0, 200)); }
      const t0 = Date.now(); let dureeAvantEcranMs = null;
      try { await page.waitForFunction(() => !!document.querySelector('input[type="password"]') || !!document.querySelector('nav, aside, [data-testid="composeur-a7"]'), null, { timeout: scen.attenteMs || 20000 }); dureeAvantEcranMs = Date.now() - t0; } catch {}
      await page.waitForTimeout(1500);
      const m = await page.evaluate(() => {
        const vis = (el) => { if (!el) return false; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
        const h1 = Array.from(document.querySelectorAll('h1')).filter(vis).map((h) => h.textContent.trim());
        const boutons = Array.from(document.querySelectorAll('button')).filter(vis).map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim()).filter(Boolean);
        let stockage = null; try { stockage = { local: Object.keys(localStorage).filter((k) => k !== '__banc_seme__'), session: Object.keys(sessionStorage) }; } catch (e) { stockage = 'inaccessible: ' + e.message; }
        return {
          url: location.href, racineMontee: (document.getElementById('root')?.children.length ?? 0) > 0, h1,
          champEmail: !!document.querySelector('input[type="email"]'), champMotDePasse: !!document.querySelector('input[type="password"]'),
          boutonSeConnecter: boutons.some((t) => /^Se connecter$/i.test(t)), boutonCreerCompte: boutons.some((t) => /Créer un compte/i.test(t)), boutonGoogle: boutons.some((t) => /Continuer avec Google/i.test(t)),
          navigationInterne: !!document.querySelector('nav, aside'), composeur: !!document.querySelector('[data-testid="composeur-a7"], textarea[placeholder^="Quoi de neuf"]'),
          spinner: !!document.querySelector('.animate-spin'), nbBoutonsVisibles: boutons.length, boutons: boutons.slice(0, 10), stockage,
          texte: document.body.innerText.replace(/\s+/g, ' ').slice(0, 120),
        };
      });
      if (scen.rejeu) {
        await page.evaluate(([cle, val]) => { localStorage.setItem(cle, val); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }, [CLE, JSON.stringify(sessionLocale)]);
        await page.waitForTimeout(4000);
        m.apresRejeu = await page.evaluate(() => ({ navigationInterne: !!document.querySelector('nav, aside'), champMotDePasse: !!document.querySelector('input[type="password"]'), composeur: !!document.querySelector('[data-testid="composeur-a7"], textarea[placeholder^="Quoi de neuf"]') }));
        m.apresRejeu.verdictEcran = m.apresRejeu.champMotDePasse && !m.apresRejeu.navigationInterne && !m.apresRejeu.composeur ? 'ECRAN_AUTHENTIFICATION' : (m.apresRejeu.navigationInterne || m.apresRejeu.composeur ? 'INTERFACE_INTERNE' : 'INDETERMINE');
        await page.screenshot({ path: path.join(OUT, `${TAG}-${sc}-${canal}-apres-rejeu.png`), fullPage: false });
      }
      if (scen.deconnexion) {
        const etape = {};
        await page.screenshot({ path: path.join(OUT, `${TAG}-${sc}-${canal}-avant-deconnexion.png`) });
        try {
          const declencheurMobile = page.locator('button[aria-label="Ouvrir le menu"]');
          if (await declencheurMobile.isVisible().catch(() => false)) {
            etape.chemin = 'téléphone/tablette : bouton « Ouvrir le menu » puis bouton « Se déconnecter » du tiroir';
            await declencheurMobile.click({ timeout: 10000 });
            await page.waitForTimeout(800);
            await page.click('aside[aria-label="Menu des espaces MokNet"] button[aria-label="Se déconnecter"]', { timeout: 10000 });
          } else {
            etape.chemin = 'ordinateur : avatar de profil (en-tête) puis « Se déconnecter » du menu';
            await page.click('header button.rounded-full:has(img[alt="Profile"])', { timeout: 10000 });
            await page.waitForTimeout(800);
            await page.click('button:has-text("Se déconnecter")', { timeout: 10000 });
          }
          await page.waitForTimeout(3000);
          etape.apresClic = await page.evaluate(() => ({ champMotDePasse: !!document.querySelector('input[type="password"]'), navigationInterne: !!document.querySelector('nav, aside'), cles: (() => { try { return Object.keys(localStorage).filter((k) => k !== '__banc_seme__'); } catch { return 'inaccessible'; } })() }));
          await page.screenshot({ path: path.join(OUT, `${TAG}-${sc}-${canal}-apres-deconnexion.png`) });
          await page.reload({ waitUntil: 'load', timeout: 60000 });
          try { await page.waitForFunction(() => !!document.querySelector('input[type="password"]') || !!document.querySelector('nav, aside'), null, { timeout: 20000 }); } catch {}
          await page.waitForTimeout(1500);
          etape.apresReouverture = await page.evaluate(() => ({ champMotDePasse: !!document.querySelector('input[type="password"]'), navigationInterne: !!document.querySelector('nav, aside'), cles: (() => { try { return Object.keys(localStorage).filter((k) => k !== '__banc_seme__'); } catch { return 'inaccessible'; } })() }));
          await page.screenshot({ path: path.join(OUT, `${TAG}-${sc}-${canal}-apres-reouverture.png`) });
        } catch (e) { etape.erreur = String(e.message || e).slice(0, 160); }
        m.deconnexion = etape;
      }
      m.http = status; m.canal = canal; m.scenario = sc; m.userAgent = ua || 'Chromium ordinateur (défaut)'; m.appelsSupabase = journal.slice(0, 12);
      m.erreursJS = erreurs.filter((e) => !/favicon|net::ERR|Failed to load resource|WebSocket|ResizeObserver|tailwindcss\.com|jsdelivr|Supabase non configuré|401|JWT|refresh/i.test(e));
      m.verdictEcran = m.champEmail && m.champMotDePasse && !m.navigationInterne && !m.composeur ? 'ECRAN_AUTHENTIFICATION' : (m.h1.some((t) => /Architecte/.test(t)) && !m.champMotDePasse ? 'PAGE_DEMO_PUBLIQUE' : (m.navigationInterne || m.composeur ? 'INTERFACE_INTERNE' : (m.spinner ? 'CHARGEMENT' : 'INDETERMINE')));
      m.urlCible = urlCible; m.conforme = m.verdictEcran === scen.attendu.split(' ')[0]; m.dureeAvantEcranMs = dureeAvantEcranMs; m.nbAppelsSupabase = journal.length;
      m.attendu = scen.attendu;
      resultats[`${sc}/${canal}`] = m;
      await page.screenshot({ path: path.join(OUT, `${TAG}-${sc}-${canal}.png`), fullPage: false });
      await ctx.close();
      console.log(`${TAG} | ${sc} | ${canal}: http ${status} -> ${m.verdictEcran}${m.apresRejeu ? ' puis rejeu SIGNED_IN -> ' + m.apresRejeu.verdictEcran : ''}${m.deconnexion ? ' | déconnexion: ' + (m.deconnexion.erreur ? 'ERREUR ' + m.deconnexion.erreur : `[${m.deconnexion.chemin}] après clic mdp=${m.deconnexion.apresClic.champMotDePasse} nav=${m.deconnexion.apresClic.navigationInterne} sb=${JSON.stringify(m.deconnexion.apresClic.cles)} ; après réouverture mdp=${m.deconnexion.apresReouverture.champMotDePasse} nav=${m.deconnexion.apresReouverture.navigationInterne} sb=${JSON.stringify(m.deconnexion.apresReouverture.cles)}`) : ''} (attendu ${scen.attendu.split(' ')[0]})${scen.chrono ? ' | écran après ' + (dureeAvantEcranMs === null ? 'jamais (' + (scen.attenteMs || 20000) + ' ms)' : dureeAvantEcranMs + ' ms') : ''} | h1=${JSON.stringify(m.h1)} nav=${m.navigationInterne} composeur=${m.composeur} spinner=${m.spinner} | supabase=${journal.length} | erreursJS=${m.erreursJS.length}${m.erreursJS.length ? ' ' + JSON.stringify(m.erreursJS.slice(0, 2)) : ''}`);
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${TAG}-mesures.json`), JSON.stringify(resultats, null, 2));
})().catch((e) => { console.error('SCENARIOS ERREUR', e); process.exit(1); });
