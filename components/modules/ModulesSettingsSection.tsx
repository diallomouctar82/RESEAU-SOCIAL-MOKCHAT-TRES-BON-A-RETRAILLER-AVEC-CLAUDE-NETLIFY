import React from 'react';
import { Blocks, MessageCircle, RefreshCw } from 'lucide-react';
import { EXPORTABLE_MODULES, ExportableModuleId } from '../../modules/moduleRegistry';
import { InstallModuleButton } from './InstallModuleButton';

/**
 * Section « Modules & applications » des Paramètres : la liste du registre
 * des modules exportables, chacun avec son point d'installation. Ajouter un
 * module = une entrée au registre (et son icône ci-dessous) — rien à changer
 * dans cette section.
 */

const MODULE_ICONS: Record<ExportableModuleId, React.ComponentType<{ size?: number; className?: string }>> = {
  messagerie: MessageCircle,
};

const SYNC_POINTS: { label: string; detail: string }[] = [
  { label: 'Même compte', detail: 'la session MokNet est partagée' },
  { label: 'Mêmes conversations', detail: 'fils, appels et vocaux identiques' },
  { label: 'Mêmes notifications', detail: 'un seul service de notifications' },
  { label: 'Mêmes réglages', detail: 'langue, sonnerie, confidentialité' },
];

export const ModulesSettingsSection: React.FC = () => (
  <div className="space-y-4">
    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 text-xs text-blue-950 font-medium leading-relaxed flex items-start gap-2.5">
      <Blocks size={16} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
      <span>
        Chaque module de MokNet est conçu pour vivre aussi seul, installé sur votre téléphone comme une
        application dédiée — avec le même compte, les mêmes données et les mêmes notifications. La
        messagerie est le premier module exportable ; les suivants suivront le même modèle.
      </span>
    </div>

    {EXPORTABLE_MODULES.map((module) => {
      const Icon = MODULE_ICONS[module.id] ?? Blocks;
      const available = module.status === 'disponible';
      return (
        <section
          key={module.id}
          aria-labelledby={`module-${module.id}-title`}
          className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span id={`module-${module.id}-title`} className="text-sm font-bold text-slate-900">
                  {module.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {available ? 'Disponible' : 'En préparation'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{module.description}</p>
            </div>
          </div>

          {available ? (
            <InstallModuleButton module={module} />
          ) : (
            <p className="text-xs text-slate-500">Ce module n'est pas encore détachable.</p>
          )}

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
              <RefreshCw size={12} aria-hidden="true" />
              Synchronisation
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              {SYNC_POINTS.map((point) => (
                <div key={point.label} className="text-[11px] leading-snug">
                  <dt className="font-bold text-slate-800 inline">{point.label}</dt>
                  <dd className="text-slate-500 inline"> — {point.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );
    })}
  </div>
);
