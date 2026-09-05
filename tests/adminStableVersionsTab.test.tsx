/**
 * ONGLET SUPER-ADMIN « VERSIONS STABLES & RESTAURATION CONTRÔLÉE »
 * (Direction, 05/09/2026) — comportements, pas des classes : ce que
 * moknet.net sert est lu sur le réseau (doublure), les versions s'affichent
 * avec leurs faits, la version servie ne se restaure pas, un ordre exige la
 * saisie exacte de la version, un motif, la reconnaissance des oranges ; il
 * est journalisé nominativement ; la procédure est celle du registre ; la
 * vérification après coup rend un verdict honnête. Injoignable → refus.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminStableVersionsTab } from '../components/admin/AdminStableVersionsTab';
import type { JournalRestaurations, OrdreRestauration } from '../services/versions/restaurationControlee';
import { REGISTRE_VERSIONS_STABLES, type VersionJson } from '../services/versions/stableVersions';

const html = (bundle: string | null) =>
    `<!doctype html><html><head>${bundle ? `<script type="module" crossorigin src="${bundle}"></script>` : ''}</head><body></body></html>`;

interface Serveur { versionJson?: Partial<VersionJson> | null | 'panne'; bundle?: string | null | 'panne' }

/** Doublure du serveur : `/version.json?v=…` puis `/?v=…`, toujours relues avec une clé anti-cache. */
function serveur(etat: Serveur) {
    const courant: Serveur = { ...etat };
    const f = vi.fn(async (entree: RequestInfo | URL) => {
        const url = String(entree);
        if (url.startsWith('/version.json')) {
            expect(url).toMatch(/^\/version\.json\?v=\d+$/);
            if (courant.versionJson === 'panne') throw new TypeError('Failed to fetch');
            if (!courant.versionJson) return new Response('Not found', { status: 404 });
            const corps: VersionJson = { version: 'v6.42.1', commit: null, deployId: null, branche: 'main', contexte: 'production', construitLe: '2026-09-05T17:48:00.000Z', bundle: null, ...courant.versionJson };
            return new Response(JSON.stringify(corps), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        expect(url).toMatch(/^\/\?v=\d+$/);
        if (courant.bundle === 'panne') throw new TypeError('Failed to fetch');
        return new Response(html(courant.bundle ?? null), { status: 200, headers: { 'content-type': 'text/html' } });
    }) as unknown as typeof fetch & { mock: unknown };
    return { fetch: f, changer(nouveau: Serveur) { Object.assign(courant, nouveau); } };
}

function journalDouble(initial: OrdreRestauration[] = [], partage = true) {
    const ordres = [...initial];
    const j: JournalRestaurations = {
        charger: vi.fn(async () => ({ ordres: [...ordres], partage })),
        enregistrer: vi.fn(async (o: OrdreRestauration) => { ordres.unshift(o); return { partage }; }),
        marquerVerification: vi.fn(async (id: string, verification, statut) => {
            const i = ordres.findIndex((o) => o.id === id);
            if (i < 0) return { partage, ordre: null };
            ordres[i] = { ...ordres[i], statut, verification };
            return { partage, ordre: ordres[i] };
        }),
    };
    return { j, ordres };
}

const auteur = async (nom: string) => ({ nom, email: 'direction@moknet.net', id: 'u-direction' });
const horloge = () => new Date('2026-09-05T20:10:00.000Z');

const SERVIE_V6421: Serveur = { versionJson: { version: 'v6.42.1', commit: 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e', deployId: '6a9c6540a62aa9000714444b', bundle: '/assets/index-C8Y6seFM.js' }, bundle: '/assets/index-C8Y6seFM.js' };

function monter(etat: Serveur, journal = journalDouble().j) {
    const s = serveur(etat);
    const utils = render(<AdminStableVersionsTab adminName="Admin-Général" fetchImpl={s.fetch} journal={journal} lireAuteur={auteur} maintenant={horloge} />);
    return { ...utils, s, journal };
}

async function attendreLecture() {
    await waitFor(() => expect(screen.getByTestId('versions-lecture-statut')).not.toHaveTextContent('Lecture de la production…'));
}

describe('ce que moknet.net sert', () => {
    it('identifie la version servie par version.json (commit consigné) et la marque « Servie » — son bouton de restauration est désactivé', async () => {
        monter(SERVIE_V6421);
        await attendreLecture();
        const verdict = screen.getByTestId('versions-production-verdict');
        expect(verdict).toHaveAttribute('data-etat', 'identifiee');
        expect(verdict).toHaveTextContent('Version servie : v6.42.1');
        expect(verdict).toHaveTextContent('commit f6d9a16');
        expect(verdict).toHaveTextContent('déploiement 6a9c6540a62aa9000714444b');
        expect(screen.getByTestId('versions-statut-v6.42.1')).toHaveTextContent('Servie par moknet.net');
        expect(screen.getByTestId('versions-choisir-v6.42.1')).toBeDisabled();
        expect(screen.getByTestId('versions-statut-v6.43.0')).toHaveTextContent('Remplacée');
        expect(screen.getByTestId('versions-choisir-v6.43.0')).toBeEnabled();
        // Au banc, aucune carte d'identité de build : dit tel quel.
        expect(screen.getByTestId('versions-onglet-courant')).toHaveTextContent('version de développement');
    });

    it('sans version.json (déploiement antérieur au registre), identifie par le bundle consigné', async () => {
        monter({ versionJson: null, bundle: '/assets/index-CacRDIgE.js' });
        await attendreLecture();
        expect(screen.getByTestId('versions-production-verdict')).toHaveAttribute('data-etat', 'identifiee');
        expect(screen.getByTestId('versions-production-verdict')).toHaveTextContent('Version servie : v6.42.0');
        expect(screen.getByTestId('versions-production-verdict')).toHaveTextContent('source : bundle');
        expect(screen.getByTestId('versions-choisir-v6.42.0')).toBeDisabled();
    });

    it('serveur injoignable : dit qu’on ne sait pas ce qui est servi, et refuse tout ordre', async () => {
        monter({ versionJson: 'panne', bundle: 'panne' });
        await attendreLecture();
        expect(screen.getByTestId('versions-lecture-statut')).toHaveTextContent('Production injoignable');
        expect(screen.getByTestId('versions-production-verdict')).toHaveAttribute('data-etat', 'injoignable');
        fireEvent.click(screen.getByTestId('versions-choisir-v6.42.0'));
        expect(screen.getByTestId('restauration-precontrole-production-lisible')).toHaveAttribute('data-verdict', 'rouge');
        expect(screen.getByTestId('restauration-refusee')).toBeInTheDocument();
        expect(screen.queryByTestId('restauration-enregistrer')).toBeNull();
    });

    it('« Relire la production » relit vraiment le serveur (nouvelle requête, clé anti-cache différente)', async () => {
        const { s } = monter(SERVIE_V6421);
        await attendreLecture();
        const avant = (s.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.length;
        fireEvent.click(screen.getByTestId('versions-relire'));
        await attendreLecture();
        expect((s.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.length).toBe(avant + 2);
    });
});

describe('les versions stables affichées', () => {
    it('au moins trois versions fusionnées, chacune avec nom, date UTC, commit (lien), PR, module, statut et preuves', async () => {
        monter(SERVIE_V6421);
        await attendreLecture();
        const fusionnees = REGISTRE_VERSIONS_STABLES.filter((v) => v.statut === 'fusionnee');
        expect(fusionnees.length).toBeGreaterThanOrEqual(3);
        for (const v of fusionnees.slice(0, 3)) {
            const carte = screen.getByTestId(`versions-carte-${v.version}`);
            expect(carte).toHaveTextContent(v.nom);
            expect(carte).toHaveTextContent('UTC');
            expect(within(carte).getByTestId(`versions-commit-${v.version}`)).toHaveAttribute('href', expect.stringContaining(`/commit/${v.commit}`));
            expect(carte).toHaveTextContent(`#${v.pr}`);
            expect(carte).toHaveTextContent(v.modules[0]);
            expect(carte).toHaveTextContent(`tests ${v.preuves.tests}`);
            expect(within(carte).getByTestId(`versions-statut-${v.version}`)).toBeInTheDocument();
        }
        // La version en préparation (celle de ce code) est affichée mais non restaurable.
        expect(screen.getByTestId(`versions-statut-${REGISTRE_VERSIONS_STABLES[0].version}`)).toHaveTextContent('En préparation');
        expect(screen.getByTestId(`versions-choisir-${REGISTRE_VERSIONS_STABLES[0].version}`)).toBeDisabled();
    });
});

describe('ordre de restauration contrôlée', () => {
    it('revenir à v6.42.0 : pré-contrôles verts, bouton verrouillé tant que la version exacte et un motif ne sont pas saisis, ordre journalisé nominativement, procédure et revert exacts', async () => {
        const { j } = journalDouble();
        monter(SERVIE_V6421, j);
        await attendreLecture();
        fireEvent.click(screen.getByTestId('versions-choisir-v6.42.0'));
        const panneau = screen.getByTestId('restauration-panneau');
        expect(panneau).toHaveTextContent('Ordre de restauration vers v6.42.0');
        for (const id of ['cible-consignee', 'cible-eprouvee', 'production-lisible', 'cible-differente', 'schema-base', 'donnees', 'configuration-servie']) {
            expect(screen.getByTestId(`restauration-precontrole-${id}`)).toHaveAttribute('data-verdict', 'vert');
        }
        expect(screen.queryByTestId('restauration-oranges')).toBeNull();

        const bouton = screen.getByTestId('restauration-enregistrer');
        expect(bouton).toBeDisabled();
        fireEvent.change(screen.getByTestId('restauration-confirmation'), { target: { value: 'v6.42.1' } });
        fireEvent.change(screen.getByTestId('restauration-motif'), { target: { value: 'Régression : écran blanc au chargement du fil depuis 17:50 UTC.' } });
        expect(bouton).toBeDisabled(); // mauvaise version saisie
        fireEvent.change(screen.getByTestId('restauration-confirmation'), { target: { value: 'v6.42.0' } });
        fireEvent.change(screen.getByTestId('restauration-motif'), { target: { value: 'court' } });
        expect(bouton).toBeDisabled(); // motif trop court
        fireEvent.change(screen.getByTestId('restauration-motif'), { target: { value: 'Régression : écran blanc au chargement du fil depuis 17:50 UTC.' } });
        expect(bouton).toBeEnabled();

        fireEvent.click(bouton);
        await screen.findByTestId('restauration-ordre-enregistre');
        expect(j.enregistrer).toHaveBeenCalledTimes(1);
        const ordre = (j.enregistrer as unknown as { mock: { calls: OrdreRestauration[][] } }).mock.calls[0][0];
        expect(ordre.id).toMatch(/^RST-20260905-2010-[a-z0-9]+$/);
        expect(ordre.cible).toMatchObject({ version: 'v6.42.0', commit: 'daa6575f6a5aa6d2159dda51b4fe5c94e32d5cd8', pr: 105, dec: 'DEC-2026-081' });
        expect(ordre.servieAvant).toMatchObject({ version: 'v6.42.1', etat: 'identifiee' });
        expect(ordre.par).toEqual({ nom: 'Admin-Général', email: 'direction@moknet.net', id: 'u-direction' });
        expect(ordre.motif).toContain('écran blanc');
        expect(ordre.statut).toBe('ordonne');

        const statut = screen.getByTestId('restauration-ordre-enregistre');
        expect(statut).toHaveTextContent(`Ordre ${ordre.id} enregistré`);
        expect(statut).toHaveTextContent('Admin-Général (direction@moknet.net)');
        expect(statut).toHaveTextContent('Journal partagé de la plateforme');
        // Le formulaire a disparu : un ordre, pas deux.
        expect(screen.queryByTestId('restauration-enregistrer')).toBeNull();

        expect(screen.getByTestId('restauration-lien-netlify')).toHaveAttribute('href', 'https://app.netlify.com/projects/lovely-maamoul-478226/deploys?filter=main');
        const commandes = screen.getByTestId('restauration-commandes').textContent!;
        expect(commandes).toContain('git revert --no-edit f6d9a16');
        expect(commandes).toContain('git revert --no-edit f6948b0');
        expect(commandes).toContain('git log --oneline daa6575..origin/main');
        expect(panneau).toHaveTextContent('Publish deploy');
        expect(panneau).toHaveTextContent('verrouille');
        // L'ordre est visible dans le journal de l'onglet.
        expect(screen.getByTestId(`restauration-ordre-${ordre.id}`)).toHaveTextContent('Ordonné');
    });

    it('vérifier après publication : le serveur sert la cible → verdict vert, consigné dans l’ordre ; sert encore l’ancienne → rouge', async () => {
        const { j } = journalDouble();
        const { s } = monter(SERVIE_V6421, j);
        await attendreLecture();
        fireEvent.click(screen.getByTestId('versions-choisir-v6.42.0'));
        fireEvent.change(screen.getByTestId('restauration-confirmation'), { target: { value: 'v6.42.0' } });
        fireEvent.change(screen.getByTestId('restauration-motif'), { target: { value: 'Régression constatée sur le fil, retour à la version saine.' } });
        fireEvent.click(screen.getByTestId('restauration-enregistrer'));
        await screen.findByTestId('restauration-ordre-enregistre');

        // Rien n'a bougé côté serveur : rouge, honnête.
        fireEvent.click(screen.getByTestId('restauration-verifier'));
        await waitFor(() => expect(screen.getByTestId('restauration-verdict')).toHaveAttribute('data-verdict', 'rouge'));
        expect(screen.getByTestId('restauration-verdict')).toHaveTextContent('sert encore v6.42.1');
        expect(j.marquerVerification).toHaveBeenLastCalledWith(expect.stringMatching(/^RST-/), expect.objectContaining({ message: expect.stringContaining('v6.42.1') }), 'verifie-rouge');

        // Le déploiement de v6.42.0 a été republié (déploiement antérieur au registre : pas de version.json, bundle consigné).
        s.changer({ versionJson: null, bundle: '/assets/index-CacRDIgE.js' });
        fireEvent.click(screen.getByTestId('restauration-verifier'));
        await waitFor(() => expect(screen.getByTestId('restauration-verdict')).toHaveAttribute('data-verdict', 'vert'));
        expect(screen.getByTestId('restauration-verdict')).toHaveTextContent('sert v6.42.0');
        expect(j.marquerVerification).toHaveBeenLastCalledWith(expect.stringMatching(/^RST-/), expect.objectContaining({ le: '2026-09-05T20:10:00.000Z' }), 'verifie-vert');
        await waitFor(() => expect(screen.getByTestId('restauration-journal')).toHaveTextContent('Vérifié vert'));
        // La carte de v6.42.0 est maintenant « Servie ».
        expect(screen.getByTestId('versions-statut-v6.42.0')).toHaveTextContent('Servie par moknet.net');
    });

    it('un point orange (configuration servie perdue avant v6.42.0) doit être reconnu explicitement avant tout ordre', async () => {
        monter(SERVIE_V6421);
        await attendreLecture();
        fireEvent.click(screen.getByTestId('versions-choisir-v6.41.1'));
        const conf = screen.getByTestId('restauration-precontrole-configuration-servie');
        expect(conf).toHaveAttribute('data-verdict', 'orange');
        expect(conf).toHaveTextContent('v6.42.0');
        fireEvent.change(screen.getByTestId('restauration-confirmation'), { target: { value: 'v6.41.1' } });
        fireEvent.change(screen.getByTestId('restauration-motif'), { target: { value: 'Régression de la modale Assistant IA sur téléphone.' } });
        const bouton = screen.getByTestId('restauration-enregistrer');
        expect(bouton).toBeDisabled();
        fireEvent.click(screen.getByTestId('restauration-oranges'));
        expect(bouton).toBeEnabled();
    });

    it('production non identifiable : orange à reconnaître, la restauration reste possible ; « Abandonner » referme sans rien enregistrer', async () => {
        const { j } = journalDouble();
        monter({ versionJson: null, bundle: '/assets/index-INCONNU.js' }, j);
        await attendreLecture();
        expect(screen.getByTestId('versions-production-verdict')).toHaveAttribute('data-etat', 'non-identifiable');
        fireEvent.click(screen.getByTestId('versions-choisir-v6.42.1'));
        expect(screen.getByTestId('restauration-precontrole-production-lisible')).toHaveAttribute('data-verdict', 'orange');
        expect(screen.getByTestId('restauration-oranges')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('restauration-abandonner'));
        expect(screen.queryByTestId('restauration-panneau')).toBeNull();
        expect(j.enregistrer).not.toHaveBeenCalled();
    });

    it('journal partagé indisponible : l’ordre est quand même tracé localement, et la limite est dite', async () => {
        const { j } = journalDouble([], false);
        monter(SERVIE_V6421, j);
        await attendreLecture();
        expect(screen.getByTestId('restauration-journal')).toHaveTextContent('journal partagé indisponible');
        fireEvent.click(screen.getByTestId('versions-choisir-v6.42.0'));
        fireEvent.change(screen.getByTestId('restauration-confirmation'), { target: { value: 'v6.42.0' } });
        fireEvent.change(screen.getByTestId('restauration-motif'), { target: { value: 'Régression constatée, retour à la version saine.' } });
        fireEvent.click(screen.getByTestId('restauration-enregistrer'));
        const statut = await screen.findByTestId('restauration-ordre-enregistre');
        expect(statut).toHaveTextContent('Journal partagé indisponible : copie locale et journal d’audit seulement');
    });

    it('les ordres déjà enregistrés sont affichés à l’ouverture', async () => {
        const existant: OrdreRestauration = {
            id: 'RST-20260905-1900-abcd', creeLe: '2026-09-05T19:00:00.000Z', par: { nom: 'Admin-Général', email: null, id: null },
            cible: { version: 'v6.41.1', commit: '81c66c8fcc5856ef9ae51579ccdd080240de0176', bundle: '/assets/index-6ZrCib2c.js', pr: 109, dec: 'DEC-2026-080' },
            servieAvant: { version: 'v6.42.0', commit: 'daa6575f6a5aa6d2159dda51b4fe5c94e32d5cd8', bundle: null, etat: 'identifiee' },
            motif: 'Essai de la procédure.', preControles: [], orangesReconnus: true, statut: 'verifie-vert',
            verification: { le: '2026-09-05T19:05:00.000Z', message: 'ok', servie: { version: 'v6.41.1', commit: null, bundle: null, etat: 'identifiee' } },
        };
        monter(SERVIE_V6421, journalDouble([existant]).j);
        await screen.findByTestId('restauration-ordre-RST-20260905-1900-abcd');
        expect(screen.getByTestId('restauration-journal')).toHaveTextContent('Ordres de restauration (1)');
        expect(screen.getByTestId('restauration-ordre-RST-20260905-1900-abcd')).toHaveTextContent('Vérifié vert le 05/09/2026 à 19:05 UTC');
    });
});
