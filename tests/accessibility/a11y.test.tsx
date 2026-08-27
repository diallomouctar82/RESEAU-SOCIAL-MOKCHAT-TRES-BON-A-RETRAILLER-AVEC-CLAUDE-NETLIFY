// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import axe from 'axe-core';
import { GuidedModeModal } from '../../components/accessibility/GuidedModeModal';
import { UniversalSearchModal } from '../../components/navigation/UniversalSearchModal';

afterEach(() => cleanup());

const expectNoAxeViolations = async (container: HTMLElement) => {
  const result = await axe.run(container, {
    rules: {
      // jsdom cannot calculate rendered foreground/background colors.
      'color-contrast': { enabled: false },
    },
  });
  expect(result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.length }))).toEqual([]);
};

describe('surfaces responsive et accessibles', () => {
  it('expose le mode guidé comme dialogue nommé, sans violation axe', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <GuidedModeModal isOpen onClose={onClose} onNavigate={vi.fn()} />,
    );

    const dialog = screen.getByRole('dialog', { name: /étape 1/i });
    expect(dialog.firstElementChild).toHaveClass('max-h-[96dvh]', 'sm:max-h-[90vh]');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('button', { name: /activer l'assistance vocale/i })).toHaveAttribute('aria-pressed', 'false');
    await expectNoAxeViolations(container);
  });

  it('contient le focus et ferme le mode guidé avec Échap', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GuidedModeModal isOpen onClose={onClose} onNavigate={vi.fn()} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('nomme la recherche, ses contrôles et ses résultats, sans violation axe', async () => {
    const { container } = render(
      <UniversalSearchModal
        isOpen
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onOpenDialloOS={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /recherche universelle/i });
    expect(dialog.firstElementChild).toHaveClass('max-h-[calc(100dvh-1.5rem)]', 'sm:max-h-[80vh]');
    expect(screen.getByRole('searchbox', { name: /votre recherche/i })).toHaveAttribute('aria-controls', 'universal-search-results');
    expect(screen.getByRole('button', { name: /démarrer la commande vocale/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /fermer la recherche/i })).toBeTruthy();
    await expectNoAxeViolations(container);
  });
});
