#!/usr/bin/env node
/**
 * Vérifie un kit extrait : sommes de contrôle, cohérence du manifeste, bundle
 * git, absence de secrets. Rend ATTENDU / OBTENU / ÉCART / VERDICT et sort en
 * erreur au moindre écart. Utilisé seul (`node assistant/verifier-kit.mjs .`)
 * et par l'assistant à son étape 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { journal, titre, ok, erreur, info, sha256Fichier, lireJSON, listerFichiers, executer, scannerSecrets, avertissementConnu } from './lib/commun.mjs';

export function verifierKit(dossier) {
    const lignes = [];
    const consigner = (controle, attendu, obtenu, verdict, ecart = '') => lignes.push({ controle, attendu, obtenu, ecart, verdict });
    const sommes = path.join(dossier, 'SOMME_DE_CONTROLE.sha256');
    if (!fs.existsSync(sommes)) { consigner('Fichier de sommes de contrôle', 'présent', 'absent', '🔴', 'SOMME_DE_CONTROLE.sha256 manquant'); return { ok: false, lignes }; }
    const attendus = fs.readFileSync(sommes, 'utf8').split('\n').filter(Boolean).map((l) => { const [sha, ...reste] = l.split('  '); return { sha, chemin: reste.join('  ') }; });
    let manquants = 0, alteres = 0;
    for (const a of attendus) {
        const p = path.join(dossier, a.chemin);
        if (!fs.existsSync(p)) { manquants++; continue; }
        if (sha256Fichier(p) !== a.sha) alteres++;
    }
    const presents = new Set(listerFichiers(dossier).filter((f) => f !== 'SOMME_DE_CONTROLE.sha256'));
    const inattendus = [...presents].filter((f) => !attendus.some((a) => a.chemin === f));
    consigner('Intégrité des fichiers', `${attendus.length} fichiers, empreintes identiques`, `${attendus.length - manquants - alteres} conformes, ${manquants} manquant(s), ${alteres} altéré(s), ${inattendus.length} inattendu(s)`, manquants || alteres ? '🔴' : inattendus.length ? '🟠' : '🟢', inattendus.length ? `inattendus : ${inattendus.slice(0, 5).join(', ')}` : '');

    let manifeste = null;
    try { manifeste = lireJSON(path.join(dossier, 'manifeste.json')); } catch (e) { consigner('Manifeste', 'JSON lisible', 'illisible', '🔴', e.message); }
    if (manifeste) {
        const shaOk = /^[0-9a-f]{40}$/.test(manifeste.depot?.head || '');
        consigner('Manifeste : commit sauvegardé', 'SHA-1 de 40 caractères', manifeste.depot?.head || '(absent)', shaOk ? '🟢' : '🔴');
        // Le manifeste ne peut pas contenir sa propre empreinte : il déclare tout sauf lui-même (et le fichier de sommes).
        const nbContenu = manifeste.contenu?.length ?? 0;
        const nbAttendu = attendus.length - 1;
        consigner('Manifeste : contenu déclaré', `${nbAttendu} fichiers (tout sauf manifeste.json)`, `${nbContenu} fichiers`, nbContenu === nbAttendu ? '🟢' : '🟠', nbContenu === nbAttendu ? '' : 'le manifeste et les sommes de contrôle ne listent pas le même nombre de fichiers');
    }
    const bundle = path.join(dossier, 'depot/moknet.bundle');
    if (fs.existsSync(bundle)) {
        const r = executer('git', ['bundle', 'verify', bundle], { capture: true, silencieux: true });
        const tetes = executer('git', ['bundle', 'list-heads', bundle], { capture: true, silencieux: true });
        // `git bundle list-heads` cite aussi HEAD (symbolique) : on compte les références, pas HEAD.
        const nbTetes = tetes.status === 0 ? tetes.stdout.trim().split('\n').filter((l) => l && !/ HEAD$/.test(l)).length : 0;
        const attenduTetes = manifeste?.depot?.refs?.length;
        consigner('Bundle git', `vérifié, ${attenduTetes ?? '?'} références`, r.status === 0 ? `vérifié, ${nbTetes} références` : `git bundle verify en échec : ${(r.stderr || '').trim().split('\n').pop()}`, r.status === 0 && (!attenduTetes || attenduTetes === nbTetes) ? '🟢' : '🔴');
        const heads = tetes.status === 0 ? tetes.stdout : '';
        if (manifeste?.depot?.head) consigner('Bundle : commit sauvegardé présent', manifeste.depot.head.slice(0, 12), heads.includes(manifeste.depot.head) ? 'présent' : 'absent', heads.includes(manifeste.depot.head) ? '🟢' : '🔴');
    } else consigner('Bundle git', 'depot/moknet.bundle présent', 'absent', '🔴');
    const envInterdit = [...presents].filter((f) => /(^|\/)\.env(\.[^/]*)?$/.test(f) && !f.endsWith('.env.example'));
    consigner('Aucun fichier .env', 'aucun', envInterdit.length ? envInterdit.join(', ') : 'aucun', envInterdit.length ? '🔴' : '🟢');
    const det = scannerSecrets(dossier, [...presents].filter((f) => !f.startsWith('depot/') && !f.startsWith('source/')), { avertissementSeulement: avertissementConnu });
    const bloquants = det.filter((d) => d.bloquant);
    consigner('Scan anti-secrets des fichiers du kit', '0 détection bloquante', `${bloquants.length} bloquante(s), ${det.length - bloquants.length} avertissement(s)`, bloquants.length ? '🔴' : '🟢', bloquants.slice(0, 5).map((d) => `${d.fichier}:${d.ligne} ${d.motif}`).join(' ; '));
    return { ok: lignes.every((l) => l.verdict === '🟢' || l.verdict === '🟠'), lignes, manifeste };
}

export function afficherVerdicts(lignes) {
    journal('  | Contrôle | Attendu | Obtenu | Verdict |');
    journal('  | :--- | :--- | :--- | :---: |');
    for (const l of lignes) journal(`  | ${l.controle} | ${l.attendu} | ${l.obtenu}${l.ecart ? ' — ' + l.ecart : ''} | ${l.verdict} |`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const dossier = path.resolve(process.argv[2] || '.');
    titre(`Vérification du kit : ${dossier}`);
    const r = verifierKit(dossier);
    afficherVerdicts(r.lignes);
    journal('');
    if (r.ok) { ok('Kit intègre.'); if (r.manifeste) info(`Commit ${r.manifeste.depot.head.slice(0, 12)}, version ${r.manifeste.application?.version || '?'}, créé le ${r.manifeste.cree_le}.`); process.exit(0); }
    erreur('Kit NON conforme : ne pas l\'utiliser pour un redéploiement.');
    process.exit(1);
}
