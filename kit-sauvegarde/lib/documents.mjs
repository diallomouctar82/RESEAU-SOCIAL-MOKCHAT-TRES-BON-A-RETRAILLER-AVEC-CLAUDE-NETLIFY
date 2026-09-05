/**
 * Générateurs des documents du kit : schéma des variables (Markdown), état
 * exact de l'application au moment de la sauvegarde, lisez-moi du zip.
 * Tous sont produits à partir d'objets déjà relevés : aucun secret ne transite.
 */
import { taille } from './commun.mjs';

const cellule = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function genererSchemaEnvMd(schema) {
    const L = [];
    const p = (s = '') => L.push(s);
    p('# Schéma des variables d\'environnement — MokNet');
    p();
    p(`> Version ${schema.version}, relevé du ${schema.releve}. ${schema.regle}`);
    p();
    p('## Cibles d\'installation');
    p();
    p('| Cible | Signification |');
    p('| :--- | :--- |');
    for (const [k, v] of Object.entries(schema.cibles)) p(`| \`${k}\` | ${cellule(v)} |`);
    p();
    p('## Variables par fournisseur (dans l\'ordre où l\'assistant les demande)');
    p();
    for (const f of schema.fournisseurs) {
        p(`### ${f.nom} — ${f.obligatoire ? '**obligatoire**' : 'facultatif'} — étape ${f.etape}`);
        p();
        if (f.variables.length) {
            p('| Variable | Secret | Obligatoire | Installée dans | Lue par / sert à | Où l\'obtenir |');
            p('| :--- | :---: | :---: | :--- | :--- | :--- |');
            for (const v of f.variables) {
                const installe = v.cibles.map((c) => `\`${c}\``).join(', ') + (v.nom_installe ? ` (sous le nom \`${v.nom_installe}\`)` : '');
                const lue = [v.lue_par ? v.lue_par.map((x) => `\`${x}\``).join(', ') : '', v.sert_a || '', v.deduite_de ? `déduite : ${v.deduite_de}` : '', v.defaut ? `défaut : \`${v.defaut}\`` : '', v.choix ? `valeurs : ${v.choix.join(' / ')}` : '', v.sans_valeur ? `sans valeur : ${v.sans_valeur}` : ''].filter(Boolean).join(' — ');
                p(`| \`${v.nom}\` | ${v.secret ? 'oui' : 'non'} | ${v.obligatoire ? 'oui' : 'non'} | ${cellule(installe)} | ${cellule(lue)} | ${cellule(v.ou_obtenir || v.exemple || '')} |`);
            }
            p();
        }
        if (f.coffre_noms_releves) p(`Entrées du coffre relevées : ${f.coffre_noms_releves.map((n) => `\`${n}\``).join(', ')}.`), p();
        if (f.note) p(`_${f.note}_`), p();
        if (f.action_humaine) p(`**Action humaine** : ${f.action_humaine}`), p();
    }
    p('## Variables injectées automatiquement par Supabase dans les fonctions Edge');
    p();
    p(schema.injectees_par_supabase.map((n) => `\`${n}\``).join(', ') + ' — jamais à saisir.');
    p();
    p('## Variables héritées, présentes dans `.env.example`, jamais lues par le code');
    p();
    p(schema.heritees_non_lues.variables.map((n) => `\`${n}\``).join(', '));
    p();
    p(`_${schema.heritees_non_lues.note}_`);
    p();
    return L.join('\n') + '\n';
}

export function genererEtatSauvegardeMd(e) {
    const L = [];
    const p = (s = '') => L.push(s);
    p('# État exact de MokNet au moment de la sauvegarde');
    p();
    p(`> Kit créé le **${e.cree_le}** (UTC) par \`kit-sauvegarde/creer-kit.mjs\` ${e.kit_version}. Commit sauvegardé : \`${e.depot.head}\` (branche \`${e.depot.branche}\`, ${e.depot.date_commit}).`);
    p('> Ce document décrit ce qui est DANS le kit et ce qui n\'y est PAS. Chaque nombre est mesuré au moment de la création, jamais recopié.');
    p();
    p('## 1. Application');
    p();
    p('| Élément | Valeur |');
    p('| :--- | :--- |');
    p(`| Version courante (docs/ETAT_ACTUEL.md) | **${e.application.version || 'non lue'}** |`);
    p(`| Dernière décision consignée (docs/JOURNAL_DECISIONS.md) | ${e.application.dec || 'non lue'} |`);
    p(`| Commit | \`${e.depot.head}\` — ${cellule(e.depot.sujet)} |`);
    p(`| Branche sauvegardée | \`${e.depot.branche}\` |`);
    p(`| Commits dans l'historique de cette branche | ${e.depot.nb_commits} |`);
    p(`| Paquet | \`${e.application.paquet}\` (Node ${e.application.node_requis}, npm ; verrou \`package-lock.json\` sha256 \`${e.application.lock_sha256.slice(0, 16)}…\`) |`);
    p(`| Pile | React ${e.application.dependances.react}, Vite ${e.application.dev_dependances.vite}, TypeScript ${e.application.dev_dependances.typescript}, vitest ${e.application.dev_dependances.vitest}, supabase-js ${e.application.dependances['@supabase/supabase-js']}, livekit-client ${e.application.dependances['livekit-client']} |`);
    p(`| Scripts npm | ${Object.entries(e.application.scripts).map(([k, v]) => `\`${k}\` → \`${v}\``).join(' ; ')} |`);
    p(`| Fichiers suivis par git | ${e.depot.nb_fichiers_suivis} (dont ${e.depot.nb_tests} fichiers de test, ${e.depot.nb_composants} composants, ${e.depot.nb_services} services) |`);
    p(`| Poste de création | Node ${e.outils.node}, npm ${e.outils.npm}, git ${e.outils.git}, ${e.outils.plateforme} |`);
    p();
    p('## 2. Dépôt git (bundle complet)');
    p();
    p(`Le fichier \`depot/moknet.bundle\` contient **tout l'historique** (${e.depot.refs.length} références : branches locales, branches distantes connues, étiquettes). Vérifié à la création par \`git bundle verify\` puis par une **épreuve de clonage réelle** (clone nu jetable : ${e.depot.epreuve_clonage ? `${e.depot.epreuve_clonage.commits} commits accessibles, fsck ${e.depot.epreuve_clonage.fsck}` : 'non réalisée'}).`);
    p();
    p('| Référence | Commit |');
    p('| :--- | :--- |');
    for (const r of e.depot.refs) p(`| \`${r.nom}\` | \`${r.sha.slice(0, 12)}\` |`);
    p();
    p(`Étiquettes : ${e.depot.tags.length ? e.depot.tags.map((t) => `\`${t}\``).join(', ') : 'aucune'}.`);
    p();
    p('## 3. Code source sans clés');
    p();
    p(`\`source/${e.source.nom}\` : archive \`git archive\` du commit sauvegardé (${e.source.nb_fichiers} fichiers suivis). Par construction, aucun fichier ignoré (\`.env\`, \`node_modules\`, \`dist\`, \`.netlify\`, \`supabase/.temp\`) n'y figure. Scan anti-secrets à la création : ${e.scan.bloquants} détection bloquante, ${e.scan.avertissements} avertissement(s) connus (doublures de tests et mesures de captures).`);
    p();
    p('## 4. Supabase (structure relevée en lecture seule)');
    p();
    p(`Projet **${e.supabase.projet.nom}** (\`${e.supabase.projet.ref}\`, ${e.supabase.projet.region}, Postgres ${e.supabase.projet.postgres}), relevé le ${e.supabase.releve_le}.`);
    p();
    p('| Objet | Nombre |');
    p('| :--- | ---: |');
    for (const [k, v] of Object.entries(e.supabase.comptes)) p(`| ${k.replace(/_/g, ' ')} | ${v} |`);
    p();
    p(`Migrations : **${e.supabase.migrations.nombre}** fichiers dans \`supabase/migrations/\` (de \`${e.supabase.migrations.premiere}\` à \`${e.supabase.migrations.derniere}\`), reconstitués depuis \`supabase_migrations.schema_migrations\` de la base réelle. Le dépôt n'en versionne que ${e.supabase.migrations_depot} : l'historique de référence est celui de la base.`);
    p();
    p('Fonctions Edge (code dans `supabase/fonctions-edge/`, copie du dépôt) :');
    p();
    p('| Fonction | Version déployée | JWT vérifié | Secrets lus |');
    p('| :--- | ---: | :---: | :--- |');
    for (const f of e.supabase.fonctions_edge) p(`| \`${f.slug}\` | ${f.version} | ${f.verify_jwt ? 'oui' : 'non'} | ${f.secrets_lus.map((s) => `\`${s}\``).join(', ')} |`);
    p();
    p(`Hors migrations (recréés par \`prerequis.sql\`, \`complements-hors-migrations.sql\` ou l'assistant) : extensions ${e.supabase.hors_migrations.extensions.map((x) => `\`${x}\``).join(', ')} ; bucket(s) ${e.supabase.hors_migrations.buckets.map((x) => `\`${x}\``).join(', ')} ; coffre ${e.supabase.hors_migrations.coffre.map((x) => `\`${x}\``).join(', ')}.`);
    p();
    p('## 5. Netlify (paramètres de build)');
    p();
    p(`Site de production \`${e.netlify.site_production.nom}\` (${e.netlify.site_production.url}), framework ${e.netlify.site_production.framework_detecte}, branche \`${e.netlify.site_production.branche_production}\`. Dernier déploiement relevé : \`${e.netlify.site_production.dernier_deploiement_releve.id}\` sur le commit \`${e.netlify.site_production.dernier_deploiement_releve.commit.slice(0, 12)}\` (${e.netlify.site_production.dernier_deploiement_releve.publie_le}).`);
    p();
    p(`Build : \`${e.netlify.build.installation}\` → \`${e.netlify.build.commande}\` → dossier \`${e.netlify.build.repertoire_publie}\`, Node ${e.netlify.build.node}. Variables du site : ${e.netlify.variables_environnement_netlify.map((v) => `\`${v.nom}\``).join(', ')}. Fichier \`netlify/netlify.toml\` copié (en-têtes et redirections).`);
    p();
    p('## 6. Variables d\'environnement');
    p();
    p(`Schéma sans valeurs : \`env/schema-env.json\` et \`env/SCHEMA_ENV.md\` (${e.env.nb_variables} variables, ${e.env.nb_fournisseurs} fournisseurs). L'assistant les demande une par une, au bon moment, et les installe lui-même.`);
    p();
    p('## 7. Contenu du kit (sommes de contrôle)');
    p();
    p('| Fichier | Taille | SHA-256 |');
    p('| :--- | ---: | :--- |');
    for (const f of e.contenu.filter((x) => !x.chemin.startsWith('supabase/releve/') && !x.chemin.startsWith('supabase/migrations/') && !x.chemin.startsWith('supabase/fonctions-edge/') && !x.chemin.startsWith('assistant/'))) p(`| \`${f.chemin}\` | ${taille(f.octets)} | \`${f.sha256.slice(0, 16)}…\` |`);
    p(`| \`supabase/migrations/\` (${e.contenu.filter((x) => x.chemin.startsWith('supabase/migrations/')).length} fichiers) | ${taille(e.contenu.filter((x) => x.chemin.startsWith('supabase/migrations/')).reduce((a, x) => a + x.octets, 0))} | voir SOMME_DE_CONTROLE.sha256 |`);
    p(`| \`supabase/releve/\`, \`supabase/fonctions-edge/\`, \`assistant/\` | ${taille(e.contenu.filter((x) => /^(supabase\/releve|supabase\/fonctions-edge|assistant)\//.test(x.chemin)).reduce((a, x) => a + x.octets, 0))} | voir SOMME_DE_CONTROLE.sha256 |`);
    p();
    p(`Total : ${e.contenu.length} fichiers, ${taille(e.contenu.reduce((a, x) => a + x.octets, 0))}, plus \`manifeste.json\` et \`SOMME_DE_CONTROLE.sha256\` écrits après ce document. Liste complète et empreintes : \`SOMME_DE_CONTROLE.sha256\` (vérifiée par \`assistant/verifier-kit.mjs\`).`);
    p();
    p('## 8. Ce que ce kit ne contient PAS (limites dites)');
    p();
    for (const l of e.limites) p(`- ${l}`);
    p();
    return L.join('\n') + '\n';
}

export function genererLisezMoi(e) {
    return `# Kit de sauvegarde et de redéploiement MokNet

Créé le ${e.cree_le} (UTC) sur le commit \`${e.depot.head.slice(0, 12)}\` — version applicative ${e.application.version || 'non lue'}.

## Démarrage rapide

1. Décompresser ce zip dans un dossier vide.
2. Vérifier l'intégrité : \`node assistant/verifier-kit.mjs .\`
3. Lancer l'assistant guidé : \`node assistant/redeployer.mjs --destination ../moknet-redeploye\`
   - Un seul parcours, treize étapes : il affiche l'état, demande chaque clé au bon moment, l'installe lui-même,
     reconstruit Supabase (migrations, fonctions Edge, secrets, authentification), écrit les variables, construit,
     teste, déploie sur Netlify, détecte les autres fournisseurs et rend un rapport.
   - \`--simulation\` : aucun appel réseau vers Supabase, Netlify ou GitHub ; les commandes locales tournent.
   - \`--reponses fichier.json\` : réponses préparées (rejeu, tests) ; \`--reprendre\` : continuer un parcours interrompu.

Prérequis : Node ≥ 22, npm, git, unzip. Rien d'autre à installer (les CLI Supabase/Netlify sont appelées via npx quand c'est nécessaire).

## Contenu

- \`ETAT_SAUVEGARDE.md\` — état exact de l'application au moment de la sauvegarde (mesuré).
- \`manifeste.json\` — le même état, lisible par machine.
- \`SOMME_DE_CONTROLE.sha256\` — empreinte de chaque fichier.
- \`depot/moknet.bundle\` — dépôt git complet (toutes les branches connues, tout l'historique).
- \`source/\` — code source du commit sauvegardé, sans aucune clé (archive \`git archive\`).
- \`env/\` — schéma des variables d'environnement, sans valeurs.
- \`supabase/\` — historique complet des migrations, relevé de structure, guide de reconstruction, fonctions Edge.
- \`netlify/\` — paramètres de build et \`netlify.toml\`.
- \`assistant/\` — l'assistant guidé et le vérificateur.

Aucun secret n'est dans ce kit. Les clés sont demandées au moment du redéploiement, une par une, et ne sont jamais écrites ailleurs que dans leur cible (\`.env\` local, variables Netlify, secrets et coffre Supabase).
`;
}
