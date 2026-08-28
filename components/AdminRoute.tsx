import React, { Suspense, lazy } from 'react';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import type { UserRole } from '../types';

const AdminDashboard = lazy(async () => {
  const module = await import('./AdminDashboard');
  return { default: module.AdminDashboard };
});

export const canAccessAdmin = (role: UserRole) => role === 'admin' || role === 'super_admin';

interface AdminRouteProps {
  role: UserRole;
  onExit: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ role, onExit }) => {
  if (!canAccessAdmin(role)) {
    return (
      <section
        role="alert"
        aria-labelledby="admin-access-denied-title"
        className="mx-auto mt-8 max-w-xl rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm"
      >
        <ShieldAlert aria-hidden="true" className="mx-auto text-rose-600" size={38} />
        <h1 id="admin-access-denied-title" className="mt-3 text-xl font-black text-slate-900">Accès à l’administration refusé</h1>
        <p className="mt-2 text-sm text-slate-600">Votre profil ne possède pas un rôle administrateur autorisé.</p>
        <button
          type="button"
          onClick={onExit}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Retour au tableau de bord
        </button>
      </section>
    );
  }

  return (
    <Suspense
      fallback={(
        <div role="status" aria-live="polite" className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-slate-600">
          <Loader2 aria-hidden="true" className="animate-spin text-blue-600" /> Chargement de la console d’administration…
        </div>
      )}
    >
      <AdminDashboard />
    </Suspense>
  );
};
