import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HEALTH_LINES, REMEDIATION_IDS } from '../services/health/healthRegistry';
import { EVALUATORS, VERSIONED_TABLE_COUNT, evaluateAll, RawMetrics } from '../supabase/functions/health-guardian/evaluate';

/**
 * GARDE-FOU DE COHÉRENCE — la santé de MokNet repose sur TROIS couches qui
 * doivent parler exactement le même vocabulaire :
 *
 *   1. le registre TypeScript (ce qui est affiché et pondéré) ;
 *   2. les évaluateurs de l'Edge Function (ce qui est mesuré) ;
 *   3. le catalogue SQL de la migration (ce qui peut être réparé).
 *
 * Une divergence entre elles ne provoque aucune erreur visible : la ligne
 * reste simplement blanche pour toujours, ou le bouton échoue au clic. Ce
 * fichier échoue à la place, à l'intégration.
 *
 * Les fonctions Edge sont hors `tsc` (elles tournent sur Deno) : on les teste
 * donc par import direct quand le fichier est pur, et par lecture de source
 * pour le reste — même convention que `livekitTokenGrant.test.ts`.
 */

const ROOT = resolve(__dirname, '..');
const MIGRATIONS = join(ROOT, 'supabase/migrations');
const GUARDIAN = join(ROOT, 'supabase/functions/health-guardian');

const migrationSante = readFileSync(join(MIGRATIONS, '20260904150000_health_guardian.sql'), 'utf8');
const indexSource = readFileSync(join(GUARDIAN, 'index.ts'), 'utf8');

describe('cohérence des trois couches', () => {
    it('chaque réparation du registre existe dans le catalogue SQL', () => {
        const catalogue = new Set(
            [...migrationSante.matchAll(/when '([a-z_]+\.[a-z_]+)' then jsonb_build_object/g)].map((m) => m[1]),
        );
        const manquantes = REMEDIATION_IDS.filter((id) => !catalogue.has(id));
        expect(manquantes).toEqual([]);
    });

    it('le catalogue SQL ne contient aucune réparation orpheline', () => {
        const catalogue = [...migrationSante.matchAll(/when '([a-z_]+\.[a-z_]+)' then jsonb_build_object/g)]
            .map((m) => m[1]);
        const registre = new Set(REMEDIATION_IDS);
        expect(catalogue.filter((id) => !registre.has(id))).toEqual([]);
    });

    it("la liste déclarée par health_remediation_catalogue couvre le catalogue réel", () => {
        const declares = new Set(
            [...migrationSante.matchAll(/'([a-z_]+\.[a-z_]+)'(?=[,\s\]])/g)]
                .map((m) => m[1])
                .filter((id) => REMEDIATION_IDS.includes(id)),
        );
        for (const id of REMEDIATION_IDS) expect(declares.has(id)).toBe(true);
    });

    it('chaque ligne de portée serveur a un évaluateur, et réciproquement', () => {
        const lignesServeur = HEALTH_LINES.filter((l) => l.location === 'serveur').map((l) => l.id);
        const evaluateurs = new Set(Object.keys(EVALUATORS));

        expect(lignesServeur.filter((id) => !evaluateurs.has(id))).toEqual([]);
        const registre = new Set(HEALTH_LINES.map((l) => l.id));
        expect([...evaluateurs].filter((id) => !registre.has(id))).toEqual([]);
    });

    it('aucune ligne cliente ou humaine n\'a d\'évaluateur serveur', () => {
        const nonServeur = HEALTH_LINES.filter((l) => l.location !== 'serveur').map((l) => l.id);
        const enTrop = nonServeur.filter((id) => id in EVALUATORS);
        expect(enTrop).toEqual([]);
    });
});

describe('constante de couverture du schéma', () => {
    it('correspond au nombre réel de tables créées par les migrations versionnées', () => {
        // Sans ce contrôle, la ligne « schéma versionné » finirait par mentir
        // dans le sens rassurant dès qu'une migration serait ajoutée.
        const fichiers = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql'));
        const tables = new Set<string>();
        for (const f of fichiers) {
            const sql = readFileSync(join(MIGRATIONS, f), 'utf8');
            for (const m of sql.matchAll(/create table if not exists public\.([a-z_]+)/gi)) {
                tables.add(m[1].toLowerCase());
            }
        }
        expect(VERSIONED_TABLE_COUNT).toBe(tables.size);
    });
});

describe('migration — garde-fous de sécurité', () => {
    it('réserve les actions modifiantes à l\'Admin Général', () => {
        for (const fn of ['health_apply_remediation', 'health_restore_snapshot', 'health_purge_snapshots']) {
            const debut = migrationSante.indexOf(`function public.${fn}(`);
            expect(debut, `${fn} introuvable`).toBeGreaterThan(-1);
            const corps = migrationSante.slice(debut, debut + 2000);
            expect(corps, `${fn} doit exiger l'Admin Général`)
                .toContain('perform public.health_require_general_admin();');
        }
    });

    it('laisse la lecture et le diagnostic aux administrateurs', () => {
        for (const fn of ['health_probe_catalogue', 'health_probe_data', 'health_probe_operations',
                          'health_diagnose_remediation', 'health_journal']) {
            const debut = migrationSante.indexOf(`function public.${fn}(`);
            expect(debut, `${fn} introuvable`).toBeGreaterThan(-1);
            expect(migrationSante.slice(debut, debut + 1500)).toContain('perform public.health_require_admin();');
        }
    });

    it('fige le chemin de recherche de toutes les fonctions de santé', () => {
        const definitions = [...migrationSante.matchAll(
            /create or replace function public\.(health_[a-z_]+)\([^)]*\)([\s\S]*?)as \$\$/g)];
        expect(definitions.length).toBeGreaterThan(8);
        for (const [, nom, entete] of definitions) {
            expect(entete, `${nom} doit figer son search_path`).toMatch(/set search_path to 'public'/);
        }
    });

    it('n\'expose ni le garde ni le catalogue brut au navigateur', () => {
        expect(migrationSante).toContain(
            'revoke all on function public.health_require_admin() from public, anon, authenticated;');
        expect(migrationSante).toContain(
            'revoke all on function public.health_remediation_spec(text) from public, anon, authenticated;');
    });

    it('verrouille le coffre de sauvegarde (RLS, aucune policy, aucun droit direct)', () => {
        expect(migrationSante).toContain('alter table public.health_snapshots enable row level security;');
        expect(migrationSante).toContain('revoke all on public.health_snapshots from anon, authenticated;');
        expect(migrationSante).not.toMatch(/create policy \w+ on public\.health_snapshots/);
    });

    it('borne la taille d\'une sauvegarde plutôt que d\'accepter n\'importe quel volume', () => {
        expect(migrationSante).toContain('health_snapshots_payload_size');
    });
});

describe('Edge Function — pipeline imposé', () => {
    it('exige une confirmation liée au périmètre avant toute réparation', () => {
        const debut = indexSource.indexOf("case 'repair'");
        const corps = indexSource.slice(debut, indexSource.indexOf("case 'restore'"));
        expect(corps).toContain('verifyPlan(body.confirmationToken)');
        // Le périmètre est re-mesuré et comparé : une confirmation ne vaut que
        // pour le nombre d'éléments réellement montré à la personne.
        expect(corps).toContain('freshCount !== claims.affectedCount');
        expect(corps).toContain('health_apply_remediation');
    });

    it('vérifie APRÈS action au lieu de déduire du succès de l\'écriture', () => {
        for (const bloc of ["case 'repair'", "case 'restore'"]) {
            const debut = indexSource.indexOf(bloc);
            const corps = indexSource.slice(debut, debut + 3000);
            expect(corps, `${bloc} doit re-sonder`).toContain('await runProbes(userClient)');
            expect(corps, `${bloc} doit journaliser`).toContain('await journal({');
        }
    });

    it('compare les signatures à temps constant', () => {
        expect(indexSource).toContain('diff |= got[i] ^ exp[i]');
    });

    it('n\'ouvre pas le CORS à tout le monde par défaut de conception', () => {
        // Sans HEALTH_ALLOWED_ORIGINS, le repli est la liste des domaines
        // MokNet connus — signalé dans les journaux — et jamais `*` : la
        // fonction mesure le CORS des autres, elle ne peut pas échouer à son
        // propre contrôle.
        expect(indexSource).toContain('HEALTH_ALLOWED_ORIGINS');
        expect(indexSource).toContain('console.warn');
        expect(indexSource).toContain('MOKNET_ORIGIN_RULES');
        const corsFn = indexSource.slice(indexSource.indexOf('function corsHeaders('), indexSource.indexOf('function json('));
        expect(corsFn).not.toContain("'*'");
    });

    it('sonde le VPS et le CORS sans jamais faire tomber la fonction', () => {
        expect(indexSource).toMatch(/observeVps\(config\)\.catch\(/);
        expect(indexSource).toMatch(/observeEdgeCors\(\)\.catch\(/);
        // Le jeton de la porte /rtc ne peut ni publier ni s'abonner.
        expect(indexSource).toMatch(/canPublish: false, canSubscribe: false/);
    });

    it('appelle les fonctions de santé avec le client scopé au JWT, jamais en service_role', () => {
        // En service_role, `auth.uid()` serait nul : le contrôle de rang et
        // l'auteur du journal disparaîtraient tous les deux.
        expect(indexSource).toMatch(/userClient\.rpc\('health_apply_remediation'/);
        expect(indexSource).toMatch(/userClient\.rpc\('health_restore_snapshot'/);
        const journalFn = indexSource.slice(indexSource.indexOf('async function journal('));
        expect(journalFn.slice(0, 600)).toContain('createServiceRoleClient()');
    });
});

describe('évaluateurs — verdicts à partir de mesures réelles', () => {
    /** Base « tout va bien », que chaque test dégrade sur un seul point. */
    const sain = (): RawMetrics => ({
        catalogue: {
            // Schéma entièrement versionné : c'est ce qu'une base saine suppose.
            tablesTotal: VERSIONED_TABLE_COUNT, tablesWithRls: VERSIONED_TABLE_COUNT, tablesWithoutRls: [],
            creditForgeryOpen: false, walletWriteOpen: false, aiSpendOpen: false,
            vaultLeaks: [], mutableSearchPath: [], roleGuardEnabled: true,
            anonReadableTables: ['posts', 'profiles'],
            foreignKeys: ['messages_conversation_id_fkey', 'conversation_participants_conversation_id_fkey',
                          'post_reactions_post_id_fkey', 'live_speakers_session_id_fkey',
                          'post_documents_post_id_fkey'],
            rlsNoPolicy: ['audit_logs', 'health_snapshots'],
            auditLogPresent: true,
            // 05/09/2026 — un Admin Général reconnu par la base.
            superAdminCount: 1, adminCount: 1,
        },
        data: {
            orphanMessages: 0, orphanParticipants: 0, emptyConversations: 0, orphanReactions: 0,
            selfFriendships: 0, duplicateFriendships: 0, profilesWithoutAccount: 0,
            orphanSpeakers: 0, orphanDocuments: 0, stuckScheduledPosts: 0, expiredStories: 0,
            notificationsTotal: 300, staleNotifications: 0, activeAgents: 13,
        },
        operations: {
            activeProviderCategories: ['llm', 'voice', 'image_video'], enabledWithoutSecret: 0,
            budgetEnforced: true, budgetHasCap: true, aiCalls24h: 100, aiFailures24h: 2,
            aiCallLogRows: 2061, liveTransportConfigured: true, stuckCalls: 0, calls24h: 20,
            callFailures24h: 1, blockFunctionPresent: true, zombieSessions: 0, expiredTranscripts: 0,
            vapidConfigured: true, pushSends24h: 50, pushFailures24h: 2, pushDeliveryLogRows: 50,
            deadSubscriptions: 0, healthActionsLogged: 0, publicBucketPresent: true,
        },
        // 05/09/2026 — VPS joignable, porte /rtc qui valide, aucune fonction
        // ouverte à n'importe quelle origine.
        vps: {
            configured: true,
            front: { reached: true, httpStatus: 200, latencyMs: 120, timedOut: false },
            rtc: { reached: true, httpStatus: 200, latencyMs: 140, timedOut: false },
        },
        edgeCors: {
            foreignOrigin: 'https://origine-inconnue.invalid',
            functions: ['ai-gateway', 'discover-provider', 'livekit-token', 'mint-live-token', 'push-notify', 'health-guardian']
                .map((slug) => ({ slug, reached: true, httpStatus: 200, allowOrigin: 'https://moknet.net' })),
        },
    });

    const verdict = (metrics: RawMetrics, lineId: string) =>
        evaluateAll(metrics).find((o) => o.lineId === lineId)!;

    it('sur une base saine, aucune ligne serveur n\'est rouge', () => {
        const rouges = evaluateAll(sain()).filter((o) => o.status === 'rouge');
        expect(rouges.map((r) => r.lineId)).toEqual([]);
    });

    it('déclare la forge de crédits en rouge dès que le droit est ouvert', () => {
        const m = sain();
        m.catalogue.creditForgeryOpen = true;
        expect(verdict(m, 'securite.forge_credits').status).toBe('rouge');
    });

    it('déclare le coffre en rouge si une fonction interne devient appelable', () => {
        const m = sain();
        m.catalogue.vaultLeaks = ['get_ai_provider_secret_internal'];
        const v = verdict(m, 'securite.coffre_cles');
        expect(v.status).toBe('rouge');
        expect(v.gap).toContain('get_ai_provider_secret_internal');
    });

    it('distingue une contrainte perdue d\'un simple orphelin', () => {
        const m = sain();
        m.catalogue.foreignKeys = [];
        m.data.orphanMessages = 3;
        const v = verdict(m, 'donnees.messages_orphelins');
        expect(v.status).toBe('rouge');
        expect(v.gap).toContain('Rétablir la contrainte');
    });

    it('traite tout dépassement de rétention des transcriptions comme rouge', () => {
        const m = sain();
        m.operations.expiredTranscripts = 1;
        expect(verdict(m, 'live.transcriptions_a_purger').status).toBe('rouge');
    });

    it('gradue les stories expirées : orange si peu, rouge si beaucoup', () => {
        const peu = sain(); peu.data.expiredStories = 5;
        expect(verdict(peu, 'contenu.stories_expirees').status).toBe('orange');
        const beaucoup = sain(); beaucoup.data.expiredStories = 400;
        expect(verdict(beaucoup, 'contenu.stories_expirees').status).toBe('rouge');
    });

    it('reste en jaune, jamais en vert, quand il n\'y a rien à mesurer', () => {
        const m = sain();
        m.operations.aiCalls24h = 0; m.operations.aiFailures24h = 0;
        const v = verdict(m, 'ia.taux_echec');
        expect(v.status).toBe('jaune');
        expect(v.measured).toContain('rien à mesurer');
    });

    it('signale une table verrouillée qui n\'était pas prévue de l\'être', () => {
        const m = sain();
        m.catalogue.rlsNoPolicy = ['audit_logs', 'messages'];
        const v = verdict(m, 'gouvernance.tables_sans_politique');
        expect(v.status).toBe('orange');
        expect(v.gap).toContain('messages');
    });

    it('ne classe PAS la lecture anonyme en rouge — la RLS reste le verrou', () => {
        const m = sain();
        m.catalogue.anonReadableTables = ['posts', 'profiles', 'messages', 'dossiers'];
        expect(verdict(m, 'securite.grants_anon').status).toBe('orange');
    });

    it('dit qu\'aucun Admin Général n\'est reconnu par la base — orange, jamais rouge, jamais vert', () => {
        const m = sain();
        m.catalogue.superAdminCount = 0;
        const v = verdict(m, 'gouvernance.rang_admin_general');
        expect(v.status).toBe('orange');
        expect(v.measured).toMatch(/Aucun compte ne porte le rang super_admin/);
        expect(v.gap).toMatch(/Réparer et restaurer sont impossibles/);
    });

    it('reste BLANC sur le rang Admin Général tant que la migration du compteur n\'est pas appliquée', () => {
        const m = sain();
        delete m.catalogue.superAdminCount;
        const v = verdict(m, 'gouvernance.rang_admin_general');
        expect(v.status).toBe('blanc');
        expect(v.probeError).toMatch(/20260905090000/);
    });

    it('signale en orange toute fonction Edge qui répond à n\'importe quelle origine', () => {
        const m = sain();
        m.edgeCors!.functions[0].allowOrigin = '*';
        m.edgeCors!.functions[1].allowOrigin = m.edgeCors!.foreignOrigin;
        const v = verdict(m, 'securite.cors_fonctions');
        expect(v.status).toBe('orange');
        expect(v.measured).toMatch(/2 fonctions sur 6/);
        expect(v.measured).toContain('ai-gateway');
        expect(v.measured).toContain('discover-provider');
    });

    it('ne prouve pas fermée une fonction que la passerelle a masquée (404)', () => {
        const m = sain();
        m.edgeCors!.functions[5] = { slug: 'health-guardian', reached: false, httpStatus: 404, allowOrigin: null };
        const v = verdict(m, 'securite.cors_fonctions');
        expect(v.status).toBe('orange');
        expect(v.measured).toMatch(/non interrogeable/);
        expect(v.measured).toContain('health-guardian');
    });

    it('juge le VPS : façade muette = rouge, façade lente = orange, porte /rtc qui refuse = rouge', () => {
        const muet = sain();
        muet.vps!.front = { reached: false, httpStatus: null, latencyMs: 3000, timedOut: true };
        expect(verdict(muet, 'vps.reverse_proxy').status).toBe('rouge');

        const lent = sain();
        lent.vps!.front = { reached: true, httpStatus: 200, latencyMs: 2400, timedOut: false };
        expect(verdict(lent, 'vps.reverse_proxy').status).toBe('orange');

        const refuse = sain();
        refuse.vps!.rtc = { reached: true, httpStatus: 401, latencyMs: 90, timedOut: false };
        const v = verdict(refuse, 'vps.signalisation');
        expect(v.status).toBe('rouge');
        expect(v.measured).toMatch(/refuse notre jeton/);

        expect(verdict(sain(), 'vps.signalisation').status).toBe('vert');
    });

    it('laisse le VPS BLANC — jamais rouge — quand aucun transport n\'est configuré', () => {
        const m = sain();
        m.vps = { configured: false, front: null, rtc: null };
        expect(verdict(m, 'vps.reverse_proxy').status).toBe('blanc');
        expect(verdict(m, 'vps.signalisation').status).toBe('blanc');
    });

    it('rend une ligne BLANCHE si sa sonde lève, sans contaminer les autres', () => {
        const m = sain();
        // `anonReadableTables` non itérable → l'évaluateur concerné lèvera.
        Object.defineProperty(m.catalogue, 'anonReadableTables', {
            get() { throw new Error('mesure indisponible'); },
        });
        const tous = evaluateAll(m);
        const casse = tous.find((o) => o.lineId === 'securite.grants_anon')!;
        expect(casse.status).toBe('blanc');
        expect(casse.probeError).toContain('mesure indisponible');
        // Les autres lignes restent mesurées.
        expect(tous.find((o) => o.lineId === 'securite.garde_role')!.status).toBe('vert');
    });
});
