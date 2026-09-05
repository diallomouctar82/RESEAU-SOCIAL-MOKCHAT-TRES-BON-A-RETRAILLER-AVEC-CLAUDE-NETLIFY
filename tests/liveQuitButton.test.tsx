import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * LV-2 Point 1 — le bouton « Quitter le direct » est CLAIR et sort PROPREMENT.
 *
 * Comme `liveStudioMatter`, le Studio (2600+ lignes, LiveKit, médias) ne se
 * monte pas en jsdom : on vérifie ici la STRUCTURE dans la source, et le
 * COMPORTEMENT réel (voir/cliquer/sortir sans rechargement, téléphone ET
 * ordinateur) est prouvé par le banc navigateur `scratchpad/lv2-p1/`. Les deux
 * se complètent — l'un garde la structure en CI, l'autre prouve le vécu.
 */

const STUDIO = readFileSync(join(__dirname, '..', 'components/SocialLive.tsx'), 'utf8');

describe('LV-2 Point 1 — bouton « Quitter le direct »', () => {
    it('porte un libellé VISIBLE « Quitter » (plus une icône seule à deviner)', () => {
        expect(STUDIO).toContain('data-testid="live-quit-button"');
        expect(STUDIO).toContain('<span>Quitter</span>');
        expect(STUDIO).toContain('aria-label="Quitter le direct"');
    });

    it('le bouton d’en-tête est câblé sur handleQuitLive (plus handleEndLive en direct sur l’icône)', () => {
        // Le bouton porteur du testid appelle bien handleQuitLive.
        expect(STUDIO).toMatch(
            /onClick=\{handleQuitLive\}[\s\S]{0,120}data-testid="live-quit-button"/,
        );
        // L'ancienne icône seule « Quitter ou terminer le Live » a disparu.
        expect(STUDIO).not.toContain('aria-label="Quitter ou terminer le Live"');
        expect(STUDIO).not.toMatch(/onClick=\{handleEndLive\}\s*\n\s*className="shrink-0 w-11 h-11/);
    });

    it('handleQuitLive : le spectateur sort IMMÉDIATEMENT (onClose), l’hôte garde le compte-rendu', () => {
        const m = STUDIO.match(/const handleQuitLive = \(\) => \{[\s\S]*?\n {2}\};/);
        expect(m, 'handleQuitLive introuvable dans SocialLive.tsx').toBeTruthy();
        const body = m![0];
        // Hôte : conserve exactement le flux compte-rendu existant.
        expect(body).toMatch(/if \(isHost\)\s*\{\s*handleEndLive\(\);/);
        // Spectateur : sortie propre en un seul geste, sans rechargement.
        expect(body).toContain('stopLocalMedia()');
        expect(body).toContain('leaveRealSession()');
        expect(body).toContain('onClose()');
        // onClose est un simple changement d'état côté parent (App.tsx) — jamais
        // un window.location/reload : la sortie ne recharge pas la page.
        expect(body).not.toMatch(/location|reload/);
    });
});
