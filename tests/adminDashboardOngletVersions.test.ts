/**
 * Garde-fou de structure du tableau de bord Super-Admin (même principe que
 * `liveQuitButton.test.tsx`) : l'onglet « Versions stables » est branché,
 * rien de ce qui existait n'a disparu (invariant « rien ne disparaît »), et
 * l'ancien sous-onglet « Versions » de « Workflows & Sauvegarde » dit sa
 * portée et renvoie vers le nouvel onglet au lieu d'être retiré.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync(resolve(__dirname, '../components/AdminDashboard.tsx'), 'utf8');
const sauvegarde = readFileSync(resolve(__dirname, '../components/admin/AdminWorkflowsAndBackupTab.tsx'), 'utf8');

describe('AdminDashboard — onglet « Versions stables »', () => {
    it('le type des onglets porte « versions » et conserve tous les onglets antérieurs', () => {
        const ligne = dashboard.split('\n').find((l) => l.startsWith('export type AdminTab'))!;
        for (const t of ['overview', 'health', 'versions', 'ai-connectors', 'architecte', 'users', 'moderation', 'settings', 'modules', 'templates', 'workflows', 'logs']) {
            expect(ligne, t).toContain(`'${t}'`);
        }
    });

    it('un bouton d’onglet identifiable ouvre « versions » et le contenu monte AdminStableVersionsTab', () => {
        expect(dashboard).toContain('data-testid="admin-onglet-versions"');
        expect(dashboard).toContain("onClick={() => setActiveTab('versions')}");
        expect(dashboard).toContain("{activeTab === 'versions' && (");
        expect(dashboard).toContain('<AdminStableVersionsTab />');
        expect(dashboard).toContain("import { AdminStableVersionsTab } from './admin/AdminStableVersionsTab';");
    });

    it('tous les onglets antérieurs sont encore rendus (rien ne disparaît)', () => {
        for (const bloc of ['<AdminOverviewTab', '<AdminHealthTab', '<AiOrchestrator', '<AdminUsersTab', '<AdminModerationTab', '<AdminPlatformModulesTab', '<AdminArchitecteAvatarTab', '<AdminPlatformSettingsTab', '<AdminTemplatesAndStampsTab', '<AdminWorkflowsAndBackupTab', '<AdminLogsAndBroadcastTab']) {
            expect(dashboard, bloc).toContain(bloc);
        }
    });

    it('l’ancien sous-onglet « Versions » (configuration locale, v6.3) reste et renvoie vers « Versions stables »', () => {
        expect(sauvegarde).toContain("subTab === 'versions'");
        expect(sauvegarde).toContain('data-testid="versions-locales-renvoi"');
        expect(sauvegarde).toContain('onOuvrirVersionsStables');
        expect(sauvegarde).toContain('Registre des Versions Majeures & Stables');
        expect(dashboard).toContain("onOuvrirVersionsStables={() => setActiveTab('versions')}");
    });
});
