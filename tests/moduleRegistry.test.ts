import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    EXPORTABLE_MODULES,
    findModuleById,
    findModuleByPath,
} from '../modules/moduleRegistry';

/**
 * ÉQUIPE X (architecture modulaire) — registre des modules exportables.
 *
 * La forme de l'entrée « messagerie » est le modèle des modules suivants :
 * ces tests la figent, et vérifient surtout que le registre et le manifeste
 * servi (public/manifests/messagerie.webmanifest) racontent la MÊME chose —
 * un écart entre les deux ferait installer une application au mauvais nom,
 * ou l'ouvrirait sur une route que personne ne rend.
 */

const messagerie = EXPORTABLE_MODULES.find((m) => m.id === 'messagerie')!;

describe('registre des modules exportables', () => {
    it('contient la messagerie, seul module disponible aujourd’hui, avec la forme attendue', () => {
        expect(EXPORTABLE_MODULES).toHaveLength(1);
        expect(messagerie).toMatchObject({
            id: 'messagerie',
            name: 'Messagerie MokNet',
            shortName: 'Messagerie',
            labelInSentence: 'la messagerie',
            route: '/messagerie',
            manifestPath: '/manifests/messagerie.webmanifest',
            icon: '/icons/icon-192.png',
            themeColor: '#2563eb',
            status: 'disponible',
        });
        expect(messagerie.description.length).toBeGreaterThan(20);
    });

    it('chaque module a une route absolue et un manifeste qui lui est propre', () => {
        for (const module of EXPORTABLE_MODULES) {
            expect(module.route.startsWith('/')).toBe(true);
            expect(module.route).not.toBe('/');
            expect(module.manifestPath).toMatch(/^\/manifests\/.+\.webmanifest$/);
            expect(module.manifestPath).toContain(module.id);
        }
    });

    it('findModuleById : identifiant exact, tolérant à la casse et aux espaces, null sinon', () => {
        expect(findModuleById('messagerie')).toBe(messagerie);
        expect(findModuleById('  Messagerie ')).toBe(messagerie);
        expect(findModuleById('inconnu')).toBeNull();
        expect(findModuleById('')).toBeNull();
    });
});

describe('findModuleByPath', () => {
    it('reconnaît la route autonome, avec ou sans barre finale, et ses sous-chemins', () => {
        expect(findModuleByPath('/messagerie')).toBe(messagerie);
        expect(findModuleByPath('/messagerie/')).toBe(messagerie);
        expect(findModuleByPath('/messagerie/conversation/42')).toBe(messagerie);
        expect(findModuleByPath('/Messagerie')).toBe(messagerie);
    });

    it('ne confond jamais une route voisine ni la racine avec le module', () => {
        expect(findModuleByPath('/')).toBeNull();
        expect(findModuleByPath('')).toBeNull();
        expect(findModuleByPath('/messagerie-pro')).toBeNull();
        expect(findModuleByPath('/social')).toBeNull();
        expect(findModuleByPath('/manifests/messagerie.webmanifest')).toBeNull();
    });
});

describe('cohérence registre ↔ manifeste servi', () => {
    const manifestFile = path.resolve(__dirname, '..', 'public', messagerie.manifestPath.replace(/^\//, ''));
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as Record<string, unknown>;

    it('le manifeste du module existe, est un JSON valide et porte l’identité du registre', () => {
        expect(manifest.id).toBe(messagerie.route);
        expect(manifest.name).toBe(messagerie.name);
        expect(manifest.short_name).toBe(messagerie.shortName);
        expect(manifest.start_url).toBe(messagerie.route);
        expect(manifest.theme_color).toBe(messagerie.themeColor);
        expect(manifest.display).toBe('standalone');
        expect(manifest.lang).toBe('fr');
        expect(manifest.scope).toBe('/');
    });

    it('son `id` est distinct de celui de l’application principale : deux applications installables sur la même origine', () => {
        expect(manifest.id).not.toBe('/');
        expect(manifest.id).not.toBe('');
    });

    it('référence l’icône du registre et une icône maskable, toutes en PNG absolu', () => {
        const icons = manifest.icons as { src: string; sizes: string; type: string; purpose?: string }[];
        expect(icons.some((icon) => icon.src === messagerie.icon)).toBe(true);
        expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
        expect(icons.some((icon) => icon.sizes === '512x512')).toBe(true);
        for (const icon of icons) {
            expect(icon.src.startsWith('/icons/')).toBe(true);
            expect(icon.type).toBe('image/png');
        }
    });
});
