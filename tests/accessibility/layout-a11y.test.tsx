// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    paletteId: 'default',
    currentPalette: {
      colors: {
        sidebarBg: '#0f172a', sidebarBorder: '#334155', sidebarText: '#ffffff',
        sidebarSurface: '#1e293b', sidebarActiveBg: '#2563eb', sidebarActiveText: '#ffffff',
        sidebarTextMuted: '#cbd5e1', sidebarHighlight: '#fb923c',
      },
    },
  }),
}));

vi.mock('../../components/DialloOS', () => ({ DialloOS: () => null }));
vi.mock('../../components/GoogleWorkspaceBanner', () => ({ GoogleWorkspaceBanner: () => null }));
vi.mock('../../components/MoocChatFloating', () => ({ MoocChatFloating: () => null }));
vi.mock('../../components/navigation/TransversalServicesModal', () => ({ TransversalServicesModal: () => null }));
vi.mock('../../components/navigation/UniversalSearchModal', () => ({ UniversalSearchModal: () => null }));
vi.mock('../../components/navigation/GoalOrientationModal', () => ({ GoalOrientationModal: () => null }));
vi.mock('../../components/accessibility/GuidedModeModal', () => ({ GuidedModeModal: () => null }));
vi.mock('../../components/scanner/UniversalScannerModal', () => ({ UniversalScannerModal: () => null }));
vi.mock('../../components/translation/BilingualConversationModal', () => ({ BilingualConversationModal: () => null }));
vi.mock('../../components/settings/UnifiedSettingsModal', () => ({ UnifiedSettingsModal: () => null }));
vi.mock('../../components/settings/BrandColorLabModal', () => ({ BrandColorLabModal: () => null }));
vi.mock('../../components/ui/ComponentShowcaseModal', () => ({ ComponentShowcaseModal: () => null }));
vi.mock('../../components/ui/ContextActionBar', () => ({ ContextActionBar: () => null }));
vi.mock('../../components/ui/FocusAndPresentationControls', () => ({ FocusAndPresentationControls: () => null }));

import { Layout } from '../../components/Layout';

const userProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Aminata Test',
  email: 'aminata@example.test',
  avatarUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  title: 'Membre',
  role: 'user',
  credits: 42,
} as any;

afterEach(() => cleanup());

describe('shell de navigation accessible', () => {
  it('fournit un lien d’évitement, un contenu nommé et des commandes mobiles nommées', () => {
    render(
      <Layout activeTab="home" onTabChange={vi.fn()} notifications={[]} onMarkRead={vi.fn()} userProfile={userProfile}>
        <h2>Tableau de bord</h2>
      </Layout>,
    );

    expect(screen.getByRole('link', { name: /aller au contenu principal/i })).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).toHaveAttribute('aria-label', expect.stringMatching(/accueil/i));
    expect(screen.getByRole('navigation', { name: /navigation mobile principale/i })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^accueil$/i }).every((button) => button.getAttribute('aria-current') === 'page')).toBe(true);
    expect(screen.getByRole('button', { name: /ouvrir diallo os/i })).toBeTruthy();
  });

  it('retire les contrôles du tiroir fermé de l’ordre de tabulation puis les expose à l’ouverture', async () => {
    const user = userEvent.setup();
    render(
      <Layout activeTab="home" onTabChange={vi.fn()} notifications={[]} onMarkRead={vi.fn()} userProfile={userProfile}>
        <h2>Tableau de bord</h2>
      </Layout>,
    );
    const toggle = screen.getByRole('button', { name: /ouvrir le menu des espaces/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /fermer le menu des espaces/i })).toBeNull();
    await user.click(toggle);
    const drawer = screen.getByRole('navigation', { name: /tous les espaces/i });
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
    expect(drawer.querySelector('.grid')).toHaveClass('grid-cols-3', 'min-[420px]:grid-cols-4');
    expect(screen.getAllByRole('button', { name: /fermer le menu des espaces/i })).toHaveLength(2);
  });

  it('déplace le focus vers le contenu après un changement d’espace', async () => {
    const { rerender } = render(
      <Layout activeTab="home" onTabChange={vi.fn()} notifications={[]} onMarkRead={vi.fn()} userProfile={userProfile}>
        <h2>Tableau de bord</h2>
      </Layout>,
    );
    rerender(
      <Layout activeTab="social" onTabChange={vi.fn()} notifications={[]} onMarkRead={vi.fn()} userProfile={userProfile}>
        <h2>Réseau</h2>
      </Layout>,
    );
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById('main-content')));
  });
});
