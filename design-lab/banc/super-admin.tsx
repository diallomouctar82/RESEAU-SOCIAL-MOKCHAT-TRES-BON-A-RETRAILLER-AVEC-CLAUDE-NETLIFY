import React from 'react';
import { createRoot } from 'react-dom/client';
import { AdminDashboard } from '../../components/AdminDashboard';
import { adminConfigService } from '../../services/adminConfigService';

/**
 * BANC DE PREUVE — le tableau de bord Super-Admin RÉEL, tel que l'application
 * le monte pour un compte administrateur (App.tsx : onglet « admin »), sans
 * compte ni réseau. Ce que la Direction voit ici est l'écran de production.
 */
(window as unknown as { __bancSuperAdmin?: unknown }).__bancSuperAdmin = {
    getArchitecteAvatar: () => adminConfigService.getDetailedSettings().architecteAvatar,
    stockage: () => localStorage.getItem('lmav_admin_detailed_settings_v1'),
};

createRoot(document.getElementById('root')!).render(
    <main className="max-w-[1400px] mx-auto px-3 py-4 md:px-6">
        <AdminDashboard />
    </main>,
);
