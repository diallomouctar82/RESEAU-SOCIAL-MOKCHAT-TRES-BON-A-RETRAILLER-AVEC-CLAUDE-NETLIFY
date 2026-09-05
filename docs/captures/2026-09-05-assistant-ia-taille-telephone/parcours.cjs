// Parcours complet de publication sur téléphone (DEC-2026-080) : composer → « Améliorer le style »
// → modale de l'assistant → « Appliquer à ma publication » (visible ? cliquable au point réel ?)
// → texte appliqué → « Publier » → publication visible dans le fil.
// usage : SHA=<sha du code servi> ETAT=avant|apres PORT=<port du serveur Vite> node parcours.cjs <dossier-sortie>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const ETAT = process.env.ETAT || 'apres';
const PORT = process.env.PORT || '3000';
const TEXTE = 'Bonjour, soyez les bienvenus';
const SHA = process.env.SHA || null; // SHA du code servi par le serveur Vite (a renseigner par l'appelant)
const VUES = [
  { name: 'telephone', viewport: { width: 390, height: 844 } },
  { name: 'android360', viewport: { width: 360, height: 800 } },
  { name: 'ordinateur', viewport: { width: 1440, height: 900 }, bureau: true },
];
const BRUITS = [/unsplash/i, /favicon/i, /net::ERR/i, /Failed to load resource/i, /supabase/i, /websocket/i, /ResizeObserver/i, /vibrate/i];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const mesures = { _meta: { etat: ETAT, sha: SHA, date: new Date().toISOString(), texte: TEXTE } };
  for (const vue of VUES) {
    const ctx = await browser.newContext({ viewport: vue.viewport, isMobile: !vue.bureau, hasTouch: !vue.bureau, deviceScaleFactor: vue.bureau ? 1 : 2, ignoreHTTPSErrors: true, locale: 'fr-FR' });
    await ctx.route('**/images.unsplash.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/jpeg', body: Buffer.alloc(0) }));
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(String(e.message || e).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error' && !BRUITS.some((b) => b.test(m.text()))) erreurs.push('console: ' + m.text().slice(0, 200)); });
    await page.goto(`http://localhost:${PORT}/preview-harness.html?tab=social`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForSelector('[data-testid="composeur-a7"]', { timeout: 60000 });
    await page.waitForTimeout(1200);
    const m = { ecran: vue.viewport, etapes: {} };

    // 1. Saisie
    const champ = page.locator('[data-testid="composeur-a7"] textarea');
    await champ.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.scrollBy(0, -12));
    await champ.fill(TEXTE);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-1-saisie.png`), fullPage: false });
    m.etapes.saisie = { compteur: await page.locator('.a7-compteur').textContent() };

    // 2. Ouvrir l'assistant sur « Améliorer le style »
    await page.getByRole('button', { name: 'Améliorer le style' }).first().click();
    const appliquer = page.getByRole('button', { name: /Appliquer à ma publication/ });
    await appliquer.waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(1500); // l'IA de secours renvoie une version optimisée (passerelle absente)
    const boite = await appliquer.boundingBox();
    const annuler = await page.getByRole('button', { name: 'Annuler' }).boundingBox();
    const geo = await page.evaluate(([bx]) => {
      const cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
      const el = document.elementFromPoint(cx, cy);
      const bouton = el && el.closest('button');
      const dock = document.querySelector('.mir-dock');
      const d = dock ? dock.getBoundingClientRect() : null;
      const boutonAppliquer = Array.from(document.querySelectorAll('button')).find((b) => /Appliquer à ma publication/.test(b.textContent || ''));
      const dialogue = boutonAppliquer ? boutonAppliquer.closest('.fixed.inset-0') : null;
      const dialogues = Array.from(document.querySelectorAll('[role="dialog"]'));
      const racine = document.getElementById('root');
      return {
        pointTeste: { x: Math.round(cx), y: Math.round(cy) },
        elementSousLeDoigt: el ? { tag: el.tagName, classes: String(el.className).slice(0, 60), texte: (el.textContent || '').trim().slice(0, 40) } : null,
        estLeBoutonAppliquer: !!bouton && /Appliquer/.test(bouton.textContent || ''),
        sousLeDock: !!(el && el.closest('.mir-dock')),
        dock: d ? { y: Math.round(d.top), h: Math.round(d.height) } : null,
        boutonDansLaFenetre: bx.y >= 0 && bx.y + bx.height <= innerHeight,
        chevaucheLeDock: d ? (bx.y < d.bottom && bx.y + bx.height > d.top) : false,
        modaleDansBody: !!dialogue && dialogue.parentElement === document.body,
        racineInerte: !!racine && racine.hasAttribute('inert'),
        zIndexModale: dialogue ? getComputedStyle(dialogue).zIndex : null,
        roleModale: dialogue ? dialogue.getAttribute('role') : null, nbDialogues: dialogues.length, autresDialogues: dialogues.filter((d) => d !== dialogue).map((d) => (d.getAttribute('aria-label') || d.tagName).slice(0, 40)), classesModale: dialogue ? String(dialogue.className).slice(0, 40) : null,
        versionOptimisee: !!Array.from(document.querySelectorAll('*')).find((n) => /Version Optimisée par l'IA/.test(n.textContent || '') && n.children.length < 3),
      };
    }, [boite]);
    m.etapes.modale = { boutonAppliquer: boite && { x: Math.round(boite.x), y: Math.round(boite.y), l: Math.round(boite.width), h: Math.round(boite.height) }, boutonAnnuler: annuler && { y: Math.round(annuler.y), h: Math.round(annuler.height) }, ...geo };
    await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-2-modale.png`), fullPage: false });

    // 3. Clic réel au point du bouton (pas de clic forcé) : ferme-t-il la modale ?
    await page.mouse.click(geo.pointTeste.x, geo.pointTeste.y);
    await page.waitForTimeout(800);
    const encoreOuverte = await appliquer.count();
    const valeurApres = await champ.inputValue();
    m.etapes.clic = { modaleFermee: encoreOuverte === 0, texteDuChamp: valeurApres.slice(0, 80), champNonVide: valeurApres.length > 0 };
    await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-3-apres-clic.png`), fullPage: false });

    // 4. Publier (seulement si la modale s'est fermée : sinon le parcours est bloqué, ce qui est le constat « avant »)
    if (encoreOuverte === 0) {
      const publier = page.getByRole('button', { name: 'Publier' });
      await publier.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      const actif = await publier.isEnabled();
      await publier.click();
      await page.waitForTimeout(2500);
      const apresPublication = await page.evaluate((texte) => {
        const champ = document.querySelector('[data-testid="composeur-a7"] textarea');
        const comp = document.querySelector('[data-testid="composeur-a7"]');
        const dansLeFil = Array.from(document.querySelectorAll('article, .mir-sheet, .mir-glass, p, div')).filter((n) => !comp.contains(n) && n.children.length === 0 && (n.textContent || '').includes(texte.slice(0, 20)));
        return { champVide: !champ.value, occurrencesDansLeFil: dansLeFil.length, extrait: dansLeFil[0] ? (dansLeFil[0].textContent || '').trim().slice(0, 80) : null };
      }, TEXTE);
      m.etapes.publication = { publierActif: actif, ...apresPublication };
      await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-4-publie.png`), fullPage: false });
      // 5. La publication dans le fil, rendue visible (defilement jusqu'au texte publie, hors du composeur)
      const poignee = await page.evaluateHandle((texte) => { const comp = document.querySelector('[data-testid="composeur-a7"]'); return Array.from(document.querySelectorAll('p, div, span')).find((n) => !comp.contains(n) && n.children.length === 0 && (n.textContent || '').includes(texte.slice(0, 20))) || null; }, TEXTE);
      const noeud = poignee.asElement();
      if (noeud) { await noeud.evaluate((el) => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, `${ETAT}-${vue.name}-5-fil.png`), fullPage: false }); m.etapes.publication.captureDuFil = `${ETAT}-${vue.name}-5-fil.png`; }
    } else {
      m.etapes.publication = { bloque: 'la modale est restée ouverte : le clic au point du bouton n’a pas atteint « Appliquer »' };
    }
    m.erreursJS = erreurs;
    mesures[vue.name] = m;
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `${ETAT}-parcours.json`), JSON.stringify(mesures, null, 2));
  console.log(JSON.stringify(mesures, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
