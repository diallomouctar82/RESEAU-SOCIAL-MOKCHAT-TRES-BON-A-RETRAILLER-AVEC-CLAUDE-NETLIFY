// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../components/AdminDashboard', () => ({
  AdminDashboard: () => <main aria-label="Console admin chargée">Console cloud active</main>,
}));

import { AdminRoute, canAccessAdmin } from '../components/AdminRoute';

afterEach(() => cleanup());

describe('route de la console Admin', () => {
  it('autorise uniquement les rôles admin et super_admin', () => {
    expect(canAccessAdmin('admin')).toBe(true);
    expect(canAccessAdmin('super_admin')).toBe(true);
    expect(canAccessAdmin('user')).toBe(false);
    expect(canAccessAdmin('moderator')).toBe(false);
  });

  it('charge réellement la console pour un rôle autorisé', async () => {
    render(<AdminRoute role="admin" onExit={vi.fn()} />);
    expect(await screen.findByRole('main', { name: /console admin chargée/i })).toHaveTextContent('Console cloud active');
  });

  it('affiche un refus explicite et permet de revenir sans écran vide', async () => {
    const onExit = vi.fn();
    const user = userEvent.setup();
    render(<AdminRoute role="user" onExit={onExit} />);

    expect(screen.getByRole('alert')).toHaveTextContent(/accès à l’administration refusé/i);
    await user.click(screen.getByRole('button', { name: /retour au tableau de bord/i }));
    expect(onExit).toHaveBeenCalledOnce();
  });
});
