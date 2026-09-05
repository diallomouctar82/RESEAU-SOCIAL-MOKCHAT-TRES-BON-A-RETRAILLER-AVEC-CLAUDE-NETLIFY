// Preuve C1 — l'Architecte accompagne TOUTE la conversation (banc Chromium, harnais authentifié,
// passerelle IA doublée : voix HD = extrait RÉEL de la voix attitrée, cerveau = réponses fixées).
// Usage : BASE=http://127.0.0.1:5178 node preuve-c1.cjs <dossier> <etiquette>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:5178';
const OUT = process.argv[2]; const TAG = process.argv[3] || 'apres';
fs.mkdirSync(OUT, { recursive: true });
const CHROMIUM = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const tailwind = fs.readFileSync(process.env.TAILWIND_STUB || '/tmp/tailwind.js', 'utf8');
const WAV_B64 = fs.readFileSync(process.env.WAV || path.join(__dirname, 'voix-3s.wav')).toString('base64');
const QUESTION_1 = 'Que peut faire Vision Smart pour moi ?';
const REPONSE_1 = 'Vision Smart réunit vos experts, vos formations et votre réseau au même endroit. Dites-moi ce que vous voulez faire et je vous y conduis.';
const QUESTION_2 = 'Et pour envoyer un message à un expert ?';
const REPONSE_2 = 'Bien sûr. Je peux ouvrir la messagerie, lancer un direct ou vous mettre en relation avec un expert, à vous de choisir.';
const ECRANS = [['ordinateur-1440x900', 1440, 900, 1], ['telephone-390x844', 390, 844, 2]];

function initScript() {
  // Reconnaissance vocale factice : démarre et s'arrête comme un vrai moteur ; le banc lui souffle des phrases finales.
  class FauxReco {
    constructor() { this.continuous = false; this.interimResults = false; this.lang = ''; this.onstart = null; this.onresult = null; this.onerror = null; this.onend = null; window.__reco = this; }
    start() { window.__recoStarts = (window.__recoStarts || 0) + 1; setTimeout(() => { if (this.onstart) this.onstart(); }, 20); }
    stop() { setTimeout(() => { if (this.onend) this.onend(); }, 20); }
    abort() { this.stop(); }
  }
  // Chromium expose aussi `SpeechRecognition` sans préfixe : les deux pointent sur le moteur factice (le vrai parlerait à Google).
  window.SpeechRecognition = FauxReco; window.webkitSpeechRecognition = FauxReco;
  window.__journal = []; window.__bouche = []; window.__presence = []; window.__liaisons = 0; window.__lectures = 0;
  window.__note = (type, detail) => window.__journal.push({ t: Math.round(performance.now()), type, detail });
  const origCreate = AudioContext.prototype.createMediaElementSource;
  AudioContext.prototype.createMediaElementSource = function (el) { window.__liaisons += 1; window.__note('liaison', String(el.src || '').slice(0, 22)); return origCreate.call(this, el); };
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { window.__lectures += 1; window.__note('play', this.tagName + ':' + String(this.currentSrc || this.src || '').slice(0, 22)); return origPlay.call(this); };
  let last = null;
  setInterval(() => { const el = document.querySelector('[data-testid="architecte-flottant"]'); const p = el ? el.getAttribute('data-presence') : 'absent'; if (p !== last) { last = p; window.__presence.push({ t: Math.round(performance.now()), presence: p }); } }, 50);
}

async function scenario(browser, [nom, w, h, dpr]) {
  const appels = { voix: 0, llm: 0, warmup: 0 };
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 500, hasTouch: w < 900, locale: 'fr-FR', permissions: ['microphone'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  await p.addInitScript(initScript);
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => { const url = route.request().url(); if (/cdn\.tailwindcss\.com/.test(url)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: tailwind }); return route.abort(); });
  await p.route(/\/functions\/v1\/ai-gateway/, route => {
    let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch { /* corps vide */ }
    const ok = (obj) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(obj) });
    if (body.mode === 'warmup') { appels.warmup += 1; return ok({ ok: true }); }
    if (body.category === 'voice') { appels.voix += 1; return ok({ result: { audioBase64: WAV_B64, audioMimeType: 'audio/wav' } }); }
    if (body.category === 'llm') { appels.llm += 1; return ok({ result: { json: { type: 'NOTIFICATION', explanation: appels.llm === 1 ? REPONSE_1 : REPONSE_2 } } }); }
    return ok({ result: { text: '' } });
  });
  await p.goto(BASE + '/preview-harness.html', { waitUntil: 'load', timeout: 120000 });
  const sculpture = p.getByTestId('architecte-flottant');
  await sculpture.waitFor({ timeout: 60000 });
  await p.waitForFunction(() => !!window.__voiceEngine, null, { timeout: 30000 });
  await p.evaluate(() => {
    window.__voiceEngine.addListener({
      onMouthShape: s => window.__bouche.push([Math.round(performance.now()), Math.round(s.open * 1000) / 1000, Math.round(s.level * 1000) / 1000]),
      onSpeakingStateChange: v => window.__note('parole', v),
      onStart: () => window.__note('ecoute', true),
      onEnd: () => window.__note('ecoute', false),
      onTtsEngineChange: m => window.__note('moteur', m),
      onError: err => window.__note('erreur', String(err)),
      onLipSyncAligned: a => window.__note('aligne', a),
    });
  });
  await p.waitForTimeout(1500);
  const shot = (k) => p.screenshot({ path: path.join(OUT, `${TAG}-${nom}-${k}.jpg`), type: 'jpeg', quality: 82 });
  const now = () => p.evaluate(() => Math.round(performance.now()));
  const presence = () => p.evaluate(() => { const el = document.querySelector('[data-testid="architecte-flottant"]'); return el ? el.getAttribute('data-presence') : 'absent'; });
  const waitPresence = (v, t = 15000) => p.waitForFunction((x) => { const el = document.querySelector('[data-testid="architecte-flottant"]'); return el && el.getAttribute('data-presence') === x; }, v, { timeout: t }).catch(async (e) => { await p.__dump('attente-' + v); throw e; });
  const nbParoles = () => p.evaluate(() => window.__journal.filter(j => j.type === 'parole' && j.detail === true).length);
  const waitNewSpeech = async (n, t = 25000) => p.waitForFunction((k) => window.__journal.filter(j => j.type === 'parole' && j.detail === true).length > k, n, { timeout: t });
  const waitSpeechEnd = (t = 30000) => p.waitForFunction(() => !window.__voiceEngine.getIsSpeaking(), null, { timeout: t });
  const parler = (texte) => p.evaluate((t) => { window.__note('utilisateur', t); window.__reco.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: t }], { isFinal: true })] }); }, texte);
  const sousTitre = () => p.evaluate(() => [...document.querySelectorAll('span.font-mono')].map(e => e.textContent || '').filter(Boolean));
  const jalons = {};
  // Diagnostic en cas d'échec d'une étape : journal, présence et sous-titre du moment.
  p.__dump = async (etape) => { try { const d = await p.evaluate(() => ({ journal: window.__journal.slice(-40), presence: window.__presence, sousTitres: [...document.querySelectorAll('span.font-mono')].map(e => e.textContent), parle: window.__voiceEngine.getIsSpeaking(), ecoute: window.__voiceEngine.getIsListening(), bouche: window.__bouche.length })); fs.writeFileSync(path.join(OUT, `${TAG}-${nom}-ECHEC-${etape}.json`), JSON.stringify({ jalons, ...d }, null, 2)); await p.screenshot({ path: path.join(OUT, `${TAG}-${nom}-ECHEC-${etape}.jpg`), type: 'jpeg', quality: 70 }); } catch (e) { console.error('dump impossible', e.message); } };

  await shot('01-repos');
  jalons.repos = { t: await now(), presence: await presence() };

  // 1. Appui sur la sculpture (geste réel) : présentation vidéo dans la sculpture, barre ouverte.
  await sculpture.click();
  await p.getByText("L'Architecte").waitFor({ timeout: 10000 });
  await p.waitForFunction(() => { const v = document.querySelector('[data-testid="architecte-sequence-video"]'); return v && v.getAttribute('data-sequence-status') === 'playing'; }, null, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1200);
  await shot('02-presentation');
  jalons.presentation = { t: await now(), presence: await presence(), video: await p.evaluate(() => { const v = document.querySelector('[data-testid="architecte-sequence-video"]'); return v ? { statut: v.getAttribute('data-sequence-status'), temps: Math.round(v.currentTime * 100) / 100, duree: Math.round((v.duration || 0) * 100) / 100 } : null; }) };
  // Raccourci de banc : la présentation dure ~15 s, la preuve porte sur ce qui vient APRÈS — on saute à sa fin.
  await p.evaluate(() => { const v = document.querySelector('[data-testid="architecte-sequence-video"]'); if (v && isFinite(v.duration) && v.duration > 1) v.currentTime = Math.max(0, v.duration - 0.4); });

  // 2. Accueil DIT par la voix HD : présence « speaking », bouche en mouvement.
  await waitNewSpeech(0, 25000);
  await p.waitForTimeout(900);
  await shot('03-accueil-parle');
  jalons.accueil = { t: await now(), presence: await presence(), sousTitre: (await sousTitre()).slice(0, 2) };
  await waitSpeechEnd();
  // 3. Écoute reprise toute seule à la fin de l'accueil.
  await waitPresence('listening');
  await p.waitForTimeout(400);
  await shot('04-ecoute');
  jalons.ecoute1 = { t: await now(), presence: await presence() };

  // 4. La personne parle (moteur factice) → réflexion → réponse DITE → écoute.
  let n = await nbParoles();
  await parler(QUESTION_1);
  // Passerelle doublée = réponse quasi instantanée : « réfléchit » peut durer moins qu'un échantillon (50 ms) — attente facultative.
  await p.waitForFunction(() => { const el = document.querySelector('[data-testid="architecte-flottant"]'); return el && el.getAttribute('data-presence') === 'thinking'; }, null, { timeout: 3000 }).catch(() => {});
  await shot('05-reflechit');
  jalons.reflexion1 = { t: await now(), presence: await presence(), sousTitre: (await sousTitre()).slice(0, 2) };
  await waitNewSpeech(n);
  await p.waitForTimeout(900);
  await shot('06-reponse-parle');
  jalons.reponse1 = { t: await now(), presence: await presence(), reponseAffichee: await p.getByText(REPONSE_1.slice(0, 40)).count() > 0 };
  await waitSpeechEnd();
  await waitPresence('listening');
  await p.waitForTimeout(400);
  await shot('07-reecoute');
  jalons.ecoute2 = { t: await now(), presence: await presence() };

  // 5. Deuxième question ; appui sur la sculpture PENDANT la réponse : il se tait et écoute — rien ne se ferme.
  n = await nbParoles();
  await parler(QUESTION_2);
  await waitNewSpeech(n);
  await p.waitForTimeout(500);
  jalons.appuiPendantReponse = { t: await now(), presenceAvant: await presence() };
  await sculpture.click();
  await p.waitForTimeout(700);
  await shot('08-appui-reprise');
  jalons.reprise = { t: await now(), barreOuverte: await p.getByTestId('architecte-panneau-bascule').count() > 0, sousTitre: (await sousTitre()).slice(0, 2), presence: await presence(), parleEncore: await p.evaluate(() => window.__voiceEngine.getIsSpeaking()), libelle: await sculpture.getAttribute('aria-label'), modeConversationnelCoupe: await p.evaluate(() => !window.__voiceEngine.isConversationalMode) };
  if (jalons.reprise.barreOuverte) {
    await waitPresence('listening');
    jalons.ecoute3 = { t: await now(), presence: await presence() };
    // 6. Fermer reste sur le ✕ de la barre.
    await p.getByRole('button', { name: 'Fermer', exact: true }).click();
    await p.waitForTimeout(500);
    await shot('09-ferme');
    jalons.ferme = { t: await now(), barreOuverte: await p.getByTestId('architecte-panneau-bascule').count() > 0, presence: await presence() };
  } else {
    // Comportement « avant » : l'appui a tout fermé — c'est le défaut constaté par la Direction.
    jalons.ferme = { t: await now(), barreOuverte: false, presence: await presence(), fermeParLAppui: true };
  }

  // Mesures : bouche pendant / hors parole, moteur, liaisons, lectures, écoute, présence.
  const brut = await p.evaluate(() => ({ journal: window.__journal, bouche: window.__bouche, presence: window.__presence, liaisons: window.__liaisons, lectures: window.__lectures, recoStarts: window.__recoStarts || 0, deverrouille: typeof window.__voiceEngine.isPlaybackUnlocked === 'function' ? window.__voiceEngine.isPlaybackUnlocked() : 'n/a (moteur avant C1)', contexte: (window.__voiceEngine.outputAudioContext || {}).state || null }));
  const fenetres = []; let ouvert = null;
  for (const j of brut.journal) { if (j.type === 'parole' && j.detail === true) ouvert = j.t; if (j.type === 'parole' && j.detail === false && ouvert !== null) { fenetres.push([ouvert, j.t]); ouvert = null; } }
  const dans = (t) => fenetres.some(([a, b]) => t >= a + 120 && t <= b);
  const pendant = brut.bouche.filter(([t]) => dans(t)); const hors = brut.bouche.filter(([t]) => !fenetres.some(([a, b]) => t >= a - 50 && t <= b + 350));
  const stats = (arr) => arr.length ? { images: arr.length, ouvertureMax: Math.max(...arr.map(x => x[1])), ouvertureMoyenne: Math.round(arr.reduce((s, x) => s + x[1], 0) / arr.length * 1000) / 1000, partOuverte: Math.round(arr.filter(x => x[1] > 0.05).length / arr.length * 100) / 100 } : { images: 0 };
  const mesures = {
    ecran: nom, jalons, appelsPasserelle: appels,
    paroles: fenetres.map(([a, b]) => ({ debut: a, fin: b, dureeMs: b - a })),
    bouchePendantLaParole: stats(pendant), boucheHorsParole: stats(hors),
    moteurs: [...new Set(brut.journal.filter(j => j.type === 'moteur').map(j => j.detail))],
    erreursMoteur: brut.journal.filter(j => j.type === 'erreur').map(j => j.detail),
    alignements: brut.journal.filter(j => j.type === 'aligne').map(j => j.detail),
    liaisonsAuGraphe: brut.liaisons, lectures: brut.journal.filter(j => j.type === 'play').map(j => j.detail), demarragesEcoute: brut.recoStarts,
    lectureDeverrouillee: brut.deverrouille, etatContexteAudio: brut.contexte,
    presence: brut.presence, erreursPage: errs.filter(e => !/Supabase|VITE_SUPABASE|ERR_FAILED|favicon|WebSocket|404|placeholder/.test(e)).slice(0, 6),
  };
  fs.writeFileSync(path.join(OUT, `${TAG}-${nom}-mesures.json`), JSON.stringify(mesures, null, 2));
  await ctx.close();
  return mesures;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const resultats = [];
  const filtre = process.env.ECRAN ? ECRANS.filter(e => e[0].startsWith(process.env.ECRAN)) : ECRANS;
  for (const ecran of filtre) resultats.push(await scenario(browser, ecran));
  fs.writeFileSync(path.join(OUT, `${TAG}-mesures.json`), JSON.stringify(resultats, null, 2));
  console.log(JSON.stringify(resultats.map(r => ({ ecran: r.ecran, paroles: r.paroles.length, bouche: r.bouchePendantLaParole, hors: r.boucheHorsParole, moteurs: r.moteurs, liaisons: r.liaisonsAuGraphe, reprise: r.jalons.reprise, ferme: r.jalons.ferme, erreurs: r.erreursPage })), null, 2));
  await browser.close();
})().catch(e => { console.error('ECHEC', e); process.exit(1); });
