import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AU-14 — garde-fou sur la version de `livekit-client`.
 *
 * Le serveur LiveKit de production (live.moknet.net) tourne en 1.8.4
 * (protocole 15). Mesuré contre ce binaire exact, en local, micro factice,
 * 50 s par version (voir deploy/livekit/README.md, « Mettre à jour le
 * serveur ») :
 *
 *   2.18.0 → 2.22.1 : 3 « negotiation timed out » / 50 s, 2 rétablissements,
 *                     bytesSent = null — la voix ne part JAMAIS. C'est mot
 *                     pour mot ce que public.call_diagnostics a enregistré
 *                     sur les deux vrais téléphones.
 *   2.17.3 et moins  : 0 expiration, 0 rétablissement, octets envoyés.
 *
 * 2.17.3 négocie aussi sans expiration contre 1.13.6 (cible de montée de
 * version du VPS) : la version épinglée ici reste valable avant ET après la
 * mise à jour du serveur. Une montée du SDK au-delà de 2.17.x ne doit se
 * faire qu'APRÈS avoir vérifié la version du serveur réellement déployé.
 */
describe('livekit-client — version épinglée compatible avec le serveur déployé (AU-14)', () => {
    const root = process.cwd();
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
        dependencies: Record<string, string>;
    };
    const installed = JSON.parse(
        readFileSync(resolve(root, 'node_modules/livekit-client/package.json'), 'utf8'),
    ) as { version: string };

    it('package.json épingle exactement 2.17.3 (pas de ^ ni de ~ : npm ne doit pas remonter tout seul)', () => {
        expect(pkg.dependencies['livekit-client']).toBe('2.17.3');
    });

    it('la version installée est bien celle épinglée', () => {
        expect(installed.version).toBe('2.17.3');
    });

    it('la version installée reste sous 2.18 (première version qui demande /rtc/v1 et expire contre 1.8.4)', () => {
        const [major, minor] = installed.version.split('.').map(Number);
        expect(major).toBe(2);
        expect(minor).toBeLessThan(18);
    });
});
